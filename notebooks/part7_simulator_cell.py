#@title Skilltrx Real-Time Match Simulator { run: "auto" }
#@markdown Provide the candidate resume and target job description below.
resume_input = "Summary: Experienced Software Engineer specialized in backend systems. Over 6 years developing web applications in Python and Flask. Database design using PostgreSQL and Redis. Deployments managed on GCP and AWS. Skills: Python, Flask, SQL, PostgreSQL, Docker, AWS, Git. Education: B.Sc. in Computer Science." #@param {type:"string"}
job_description_input = "We are looking for a Senior Python Developer. Must have 5+ years of experience in Python, Django, PostgreSQL, and AWS. Experience with Docker or Kubernetes is a plus. Bachelor's degree in CS required." #@param {type:"string"}
show_raw_json = False #@param {type:"boolean"}

# ==============================================================================
# 1. SELF-HEALING ENVIRONMENT & IMPORTS
# ==============================================================================
import os
import re
import json
import textwrap
import numpy as np

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from transformers import AutoModel, AutoTokenizer
except ImportError:
    print("\033[93m[System]\033[0m Installing missing dependencies...")
    os.system("pip -q install sentence-transformers transformers torch")
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from transformers import AutoModel, AutoTokenizer

# ==============================================================================
# 2. CONFIGURATION & STANDALONE TEXT CLEANING
# ==============================================================================
SIM_CFG = globals().get("CFG", {})
ENCODER_NAME = SIM_CFG.get("encoder", "sentence-transformers/all-MiniLM-L6-v2")
CHUNK_TOKENS = SIM_CFG.get("chunk_tokens", 256)
CHUNK_STRIDE = SIM_CFG.get("chunk_stride", 192)
MAX_CHUNKS   = SIM_CFG.get("max_chunks", 6)
HEAD_HIDDEN  = SIM_CFG.get("head_hidden", 256)
DROPOUT      = SIM_CFG.get("dropout", 0.1)
OUT_DIR      = SIM_CFG.get("out_dir", "/content/drive/MyDrive/inclusive_ats")
CKPT_PATH    = SIM_CFG.get("ckpt", f"{OUT_DIR}/sbert_matcher_best.pt")

LABELS   = ["No Fit", "Potential Fit", "Good Fit"]
LABEL2ID = {lab: i for i, lab in enumerate(LABELS)}
ID2LABEL = {i: lab for lab, i in LABEL2ID.items()}
DEVICE   = torch.device("cuda" if torch.cuda.is_available() else "cpu")

SECTION_HEADERS = [
    "Professional Summary", "Executive Summary", "Career Overview", "Professional Profile",
    "Summary", "Profile", "Objective", "Highlights", "Qualifications", "Skills",
    "Technical Skills", "Core Competencies", "Experience", "Work Experience",
    "Professional Experience", "Work History", "Employment History", "Education",
    "Education and Training", "Certifications", "Accomplishments", "Projects",
    "Languages", "Interests", "Additional Information",
]
_header_alt = "|".join(re.escape(h) for h in sorted(SECTION_HEADERS, key=len, reverse=True))
HEADER_GLUE = re.compile(rf"(?<![A-Za-z])({_header_alt})(?=[A-Z])")
BULLETS     = re.compile(r"\s*[•●▪■◦\uf0b7]\s*")

def clean_text_safe(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("\xa0", " ").replace("\r", "\n")
    text = HEADER_GLUE.sub(r"\1\n", text)
    text = BULLETS.sub("\n- ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()

# ==============================================================================
# 3. MODEL ARCHITECTURE & CACHED LOADER
# ==============================================================================
class BiEncoderMatcherSim(nn.Module):
    def __init__(self, name=ENCODER_NAME, n_classes=3, hidden=HEAD_HIDDEN, dropout=DROPOUT):
        super().__init__()
        self.encoder = AutoModel.from_pretrained(name)
        d = self.encoder.config.hidden_size
        self.head = nn.Sequential(
            nn.Linear(2 * d + 1, hidden),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden, n_classes),
        )

    def embed(self, input_ids, attention_mask, owner, n_docs):
        tokens = self.encoder(input_ids=input_ids, attention_mask=attention_mask).last_hidden_state
        mask = attention_mask.unsqueeze(-1).to(tokens.dtype)
        chunk = ((tokens * mask).sum(1) / mask.sum(1).clamp(min=1e-9)).float()
        doc = torch.zeros(n_docs, chunk.size(1), device=chunk.device).index_add_(0, owner, chunk)
        doc = doc / torch.bincount(owner, minlength=n_docs).unsqueeze(1)
        return F.normalize(doc, dim=-1)

    def classify(self, r, j):
        feats = torch.cat([(r * j).sum(-1, keepdim=True), (r - j).abs(), r * j], dim=-1)
        return self.head(feats)

def get_cached_pipeline():
    global _SKILLTRX_MODEL, _SKILLTRX_TOK

    if "model" in globals() and globals()["model"] is not None and hasattr(globals()["model"], "classify"):
        _SKILLTRX_MODEL = globals()["model"].eval()

    if "_SKILLTRX_TOK" not in globals() or _SKILLTRX_TOK is None:
        _SKILLTRX_TOK = globals().get("TOK") or AutoTokenizer.from_pretrained(ENCODER_NAME)

    if "_SKILLTRX_MODEL" not in globals() or _SKILLTRX_MODEL is None:
        if not os.path.exists(CKPT_PATH) and not os.path.exists("/content/drive/MyDrive"):
            try:
                from google.colab import drive
                print("\033[93m[System]\033[0m Mounting Google Drive to locate checkpoint...")
                drive.mount("/content/drive")
            except Exception:
                pass

        m = BiEncoderMatcherSim(ENCODER_NAME).to(DEVICE)
        if os.path.exists(CKPT_PATH):
            state = torch.load(CKPT_PATH, map_location=DEVICE)
            m.load_state_dict(state)
            print(f"\033[92m[System]\033[0m Loaded fine-tuned checkpoint: {CKPT_PATH}")
        else:
            print(f"\033[93m[Warning]\033[0m Checkpoint not found at {CKPT_PATH}. Running with untuned weights!")
        _SKILLTRX_MODEL = m.eval()

    return _SKILLTRX_MODEL, _SKILLTRX_TOK

# ==============================================================================
# 4. REQUIREMENT EXPLAINABILITY LAYER (23 Skill Families)
# ==============================================================================
SKILL_FAMILIES = {
    "programming": {"python": ["python"], "java": ["java"], "javascript": ["javascript"], "typescript": ["typescript"],
                    "c++": ["c++"], "c#": ["c#"], "go": ["golang"], "r": ["r programming", "rstudio"], "scala": ["scala"],
                    "php": ["php"], "ruby": ["ruby"], "swift": ["swift"], "kotlin": ["kotlin"]},
    "web": {"react": ["react", "reactjs", "react.js"], "angular": ["angular"], "node.js": ["node.js", "nodejs"],
            "django": ["django"], "flask": ["flask"], "spring": ["spring boot", "spring framework"],
            "html/css": ["html", "css"], ".net": [".net", "asp.net"], "rest api": ["rest api", "restful"]},
    "databases": {"sql": ["sql"], "mysql": ["mysql"], "postgresql": ["postgresql", "postgres"], "mongodb": ["mongodb"],
                  "nosql": ["nosql"], "oracle db": ["oracle database", "pl/sql"]},
    "big data": {"spark": ["spark", "pyspark"], "hadoop": ["hadoop"], "etl": ["etl"],
                 "data warehousing": ["data warehouse", "data warehousing", "snowflake", "redshift"]},
    "bi tools": {"tableau": ["tableau"], "power bi": ["power bi", "powerbi"], "looker": ["looker"]},
    "machine learning": {"machine learning": ["machine learning"], "deep learning": ["deep learning"],
                         "nlp": ["nlp", "natural language processing"], "computer vision": ["computer vision"],
                         "statistics": ["statistics", "statistical analysis"], "scikit-learn": ["scikit-learn", "sklearn"]},
    "ml frameworks": {"pytorch": ["pytorch"], "tensorflow": ["tensorflow"], "keras": ["keras"]},
    "cloud": {"aws": ["aws", "amazon web services"], "azure": ["azure"], "gcp": ["gcp", "google cloud"]},
    "devops": {"docker": ["docker"], "kubernetes": ["kubernetes", "k8s"], "ci/cd": ["ci/cd", "jenkins", "github actions"],
               "git": ["git"], "linux": ["linux", "unix"], "terraform": ["terraform"]},
    "testing": {"selenium": ["selenium"], "test automation": ["test automation", "automated testing"],
                "manual testing": ["manual testing"]},
    "accounting": {"accounting": ["accounting", "accounts payable", "accounts receivable", "general ledger"],
                   "financial reporting": ["financial reporting", "financial statements"],
                   "budgeting": ["budgeting", "forecasting"], "auditing": ["audit", "auditing"],
                   "tax": ["tax", "taxation"], "gaap/ifrs": ["gaap", "ifrs"], "quickbooks": ["quickbooks"],
                   "financial analysis": ["financial analysis", "financial modeling", "financial modelling"]},
    "erp": {"sap": ["sap"], "oracle erp": ["oracle financials", "oracle erp"]},
    "finance certifications": {"cpa": ["cpa", "certified public accountant"], "cfa": ["cfa"], "acca": ["acca"]},
    "marketing": {"seo": ["seo"], "digital marketing": ["digital marketing"], "social media": ["social media"],
                  "content marketing": ["content marketing"], "google analytics": ["google analytics"],
                  "market research": ["market research"]},
    "sales": {"crm": ["crm"], "salesforce": ["salesforce"], "lead generation": ["lead generation"],
              "account management": ["account management"], "b2b sales": ["b2b"]},
    "healthcare": {"patient care": ["patient care"], "nursing": ["nursing", "registered nurse"],
                   "ehr/emr": ["ehr", "emr", "electronic health records", "electronic medical records"],
                   "bls/acls": ["bls", "acls", "cpr"], "medication administration": ["medication administration"]},
    "hr": {"recruitment": ["recruitment", "recruiting", "talent acquisition"], "onboarding": ["onboarding"],
           "payroll": ["payroll"], "employee relations": ["employee relations"], "hris": ["hris", "workday"]},
    "design": {"figma": ["figma"], "photoshop": ["photoshop"], "illustrator": ["illustrator"],
               "ui/ux": ["ui/ux", "user experience", "ux design", "ui design"]},
    "engineering tools": {"autocad": ["autocad"], "solidworks": ["solidworks"], "matlab": ["matlab"], "plc": ["plc"]},
    "legal": {"contract drafting": ["contract drafting", "contract negotiation"], "litigation": ["litigation"],
              "compliance": ["compliance", "regulatory compliance"], "legal research": ["legal research"]},
    "project management": {"project management": ["project management"], "agile/scrum": ["agile", "scrum"],
                           "jira": ["jira"], "pmp": ["pmp"], "stakeholder management": ["stakeholder management"]},
    "office": {"excel": ["excel", "vlookup", "pivot table"], "ms office": ["microsoft office", "ms office"]},
    "qualifications": {"bachelor's degree": ["bachelor", "bachelors", "b.tech", "b.sc", "bsc", "b.e."],
                       "master's degree": ["master's", "masters", "m.tech", "m.sc", "msc"], "mba": ["mba"],
                       "phd": ["phd", "ph.d", "doctorate"]},
}

SKILL_RX = {
    canon: (fam, re.compile(r"(?<![a-z0-9+#.])(?:" + "|".join(re.escape(a) for a in aliases) + r")(?![a-z0-9+#])", re.I))
    for fam, skills in SKILL_FAMILIES.items() for canon, aliases in skills.items()
}

def extract_skills(text: str):
    return {c: (fam, m.start(), m.end()) for c, (fam, rx) in SKILL_RX.items() if (m := rx.search(text))}

def extract_evidence_span(text: str, s: int, e: int, pad: int = 70) -> str:
    a = max(s - pad, text.rfind("\n", 0, s) + 1)
    nl = text.find("\n", e)
    b = min(e + pad, nl if nl != -1 else len(text))
    if a > 0 and text[a - 1].isalnum():
        a = text.find(" ", a, s) + 1 or a
    if b < len(text) and text[b].isalnum():
        b = text.rfind(" ", e, b) if text.rfind(" ", e, b) != -1 else b
    return text[a:b].strip()

def build_explanation(resume_clean: str, jd_clean: str, probs: np.ndarray, cos_sim: float) -> dict:
    req, have = extract_skills(jd_clean), extract_skills(resume_clean)
    have_fams = {}
    for c, (fam, _, _) in have.items():
        have_fams.setdefault(fam, []).append(c)

    matched, partial, missing = [], [], []
    for c, (fam, _, _) in req.items():
        if c in have:
            matched.append({"requirement": c, "family": fam, "evidence": extract_evidence_span(resume_clean, *have[c][1:])})
        elif fam in have_fams:
            partial.append({"requirement": c, "family": fam, "related_in_resume": have_fams[fam]})
        else:
            missing.append(c)

    fit_score = float(probs[2] + 0.5 * probs[1])
    return {
        "compatibility_class": ID2LABEL[int(np.argmax(probs))],
        "expected_fit_score": round(fit_score, 4),
        "class_probabilities": {l: round(float(p), 4) for l, p in zip(LABELS, probs)},
        "semantic_similarity": round(float(cos_sim), 4),
        "requirement_coverage": round(len(matched) / len(req), 3) if req else None,
        "matched_requirements": matched,
        "partial_requirements": partial,
        "not_identified": missing,
        "review_notice": "Decision support only. A recruiter must review the original documents before any decision.",
    }

# ==============================================================================
# 5. CHUNKED INFERENCE & DASHBOARD RENDERER
# ==============================================================================
def chunk_document(text: str, tok):
    ids = tok(text, add_special_tokens=False, truncation=False)["input_ids"]
    body = CHUNK_TOKENS - 2
    if len(ids) <= body:
        starts = [0]
    else:
        starts = list(range(0, len(ids) - body, CHUNK_STRIDE)) + [len(ids) - body]
        if len(starts) > MAX_CHUNKS:
            keep = np.linspace(0, len(starts) - 1, MAX_CHUNKS).round().astype(int)
            starts = [starts[k] for k in keep]
    return [[tok.cls_token_id] + ids[s:s + body] + [tok.sep_token_id] for s in starts]

@torch.no_grad()
def run_skilltrx_match(resume_raw: str, jd_raw: str):
    sim_model, sim_tok = get_cached_pipeline()
    r_clean, j_clean = clean_text_safe(resume_raw), clean_text_safe(jd_raw)

    r_chunks, j_chunks = chunk_document(r_clean, sim_tok), chunk_document(j_clean, sim_tok)
    all_seqs = r_chunks + j_chunks
    owner = [0] * len(r_chunks) + [1] * len(j_chunks)

    ids = torch.full((len(all_seqs), max(map(len, all_seqs))), sim_tok.pad_token_id, dtype=torch.long)
    att = torch.zeros_like(ids)
    for k, s in enumerate(all_seqs):
        ids[k, :len(s)] = torch.tensor(s)
        att[k, :len(s)] = 1

    use_amp = DEVICE.type == "cuda"
    with torch.amp.autocast(device_type=DEVICE.type, dtype=torch.float16, enabled=use_amp):
        embs = sim_model.embed(ids.to(DEVICE), att.to(DEVICE), torch.tensor(owner, device=DEVICE), n_docs=2).float()
        r_emb, j_emb = embs[0:1], embs[1:2]
        logits = sim_model.classify(r_emb, j_emb).float()
        probs = torch.softmax(logits, dim=-1).cpu().numpy()[0]
        cos_sim = (r_emb * j_emb).sum(-1).cpu().item()

    result = build_explanation(r_clean, j_clean, probs, cos_sim)
    result["chunks_used"] = {"resume_chunks": len(r_chunks), "jd_chunks": len(j_chunks)}
    return result

def render_dashboard(result: dict, show_json: bool = False):
    C_RESET, C_BOLD, C_DIM = "\033[0m", "\033[1m", "\033[2m"
    C_GREEN, C_YELLOW, C_RED, C_CYAN = "\033[92m", "\033[93m", "\033[91m", "\033[96m"

    cls = result["compatibility_class"]
    cls_color = C_RED if cls == "No Fit" else C_YELLOW if cls == "Potential Fit" else C_GREEN

    def bar(val, width=12, fill_code="\033[42m"):
        v = max(0.0, min(1.0, float(val or 0.0)))
        filled = int(round(v * width))
        return f"{fill_code}{' ' * filled}{C_RESET}\033[100m{' ' * (width - filled)}{C_RESET}"

    cov_val = result["requirement_coverage"]
    cov_str = f"{bar(cov_val, 10, '\033[42m')} {cov_val*100:5.1f}%" if cov_val is not None else "N/A (No mapped JD skills)"

    left_lines = [
        f"{C_BOLD}QUANTITATIVE PROFILE{C_RESET}",
        "",
        f"{C_BOLD}Decision   :{C_RESET} {cls_color}{C_BOLD}{cls.upper()}{C_RESET}",
        f"{C_BOLD}Fit Score  :{C_RESET} {C_CYAN}{result['expected_fit_score']:.4f}{C_RESET} / 1.0000",
        f"{C_BOLD}Cosine Sim :{C_RESET} {C_CYAN}{result['semantic_similarity']:+.4f}{C_RESET}",
        f"{C_BOLD}JD Coverage:{C_RESET} {cov_str}",
        f"{C_BOLD}Chunks Used:{C_RESET} Resume={result['chunks_used']['resume_chunks']} | JD={result['chunks_used']['jd_chunks']}",
        "",
        f"{C_BOLD}CLASS PROBABILITIES{C_RESET}",
    ]
    for l, p in result["class_probabilities"].items():
        left_lines.append(f"  {l:<13}: {bar(p, 10, '\033[44m')} {p*100:5.1f}%")

    right_lines = [f"{C_BOLD}REQUIREMENT INTERPRETABILITY AUDIT{C_RESET}", ""]

    n_m = len(result["matched_requirements"])
    right_lines.append(f"{C_GREEN}{C_BOLD}✔ Verbatim Identified ({n_m}):{C_RESET}")
    if result["matched_requirements"]:
        for m in result["matched_requirements"]:
            right_lines.append(f"  • {C_BOLD}{m['requirement']}{C_RESET} {C_DIM}[{m['family']}]{C_RESET}")
            for wrapped in textwrap.wrap(f"\"{m['evidence']}\"", width=52):
                right_lines.append(f"    {C_DIM}{wrapped}{C_RESET}")
    else:
        right_lines.append("  • None identified")
    right_lines.append("")

    n_p = len(result["partial_requirements"])
    right_lines.append(f"{C_YELLOW}{C_BOLD}⟳ Related Partial Matches ({n_p}):{C_RESET}")
    if result["partial_requirements"]:
        for p in result["partial_requirements"]:
            rel = ", ".join(p["related_in_resume"])
            right_lines.append(f"  • {C_BOLD}{p['requirement']}{C_RESET} → Resume has: {C_CYAN}{rel}{C_RESET}")
    else:
        right_lines.append("  • None identified")
    right_lines.append("")

    n_x = len(result["not_identified"])
    right_lines.append(f"{C_RED}{C_BOLD}✗ Not Identified in Text ({n_x}):{C_RESET}")
    if result["not_identified"]:
        right_lines.append(f"  • {', '.join(result['not_identified'])}")
    else:
        right_lines.append("  • None")

    max_h = max(len(left_lines), len(right_lines))
    left_lines  += [""] * (max_h - len(left_lines))
    right_lines += [""] * (max_h - len(right_lines))

    sep = "═" * 100
    print("\n" + sep)
    print(f"  {C_BOLD}[ WINDOW 1: MODEL SCORES & CALIBRATION ]   ║   [ WINDOW 2: REQUIREMENT EVIDENCE AUDIT ]{C_RESET}")
    print(sep)
    for l_line, r_line in zip(left_lines, right_lines):
        plain_l = re.sub(r"\x1b\[[0-9;]*m", "", l_line)
        pad = max(1, 43 - len(plain_l))
        print(f"  {l_line}{' ' * pad}║   {r_line}")
    print(sep)
    print(f"  {C_BOLD}GOVERNANCE NOTICE:{C_RESET} {result['review_notice']}")
    print(sep + "\n")

    if show_json:
        print(f"{C_BOLD}Raw Structured Output (JSON):{C_RESET}")
        print(json.dumps(result, indent=2))

if not resume_input.strip() or not job_description_input.strip():
    print("\033[91m[Error]\033[0m Both resume_input and job_description_input must be non-empty.")
else:
    try:
        sim_result = run_skilltrx_match(resume_input, job_description_input)
        render_dashboard(sim_result, show_json=show_raw_json)
    except Exception as e:
        print(f"\033[91m[Error] Simulation execution failed:\033[0m {e}")
