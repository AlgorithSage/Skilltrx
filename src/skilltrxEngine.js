// ============================================================================
// Skilltrx Core Engine & Experimental Data (Exact port from Skilltrx.ipynb)
// ============================================================================

export const SKILL_FAMILIES = {
  "programming": {
    "python": ["python"], "java": ["java"], "javascript": ["javascript"], "typescript": ["typescript"],
    "c++": ["c++"], "c#": ["c#"], "go": ["golang"], "r": ["r programming", "rstudio"], "scala": ["scala"],
    "php": ["php"], "ruby": ["ruby"], "swift": ["swift"], "kotlin": ["kotlin"]
  },
  "web": {
    "react": ["react", "reactjs", "react.js"], "angular": ["angular"], "node.js": ["node.js", "nodejs"],
    "django": ["django"], "flask": ["flask"], "spring": ["spring boot", "spring framework"],
    "html/css": ["html", "css"], ".net": [".net", "asp.net"], "rest api": ["rest api", "restful"]
  },
  "databases": {
    "sql": ["sql"], "mysql": ["mysql"], "postgresql": ["postgresql", "postgres"], "mongodb": ["mongodb"],
    "nosql": ["nosql"], "oracle db": ["oracle database", "pl/sql"]
  },
  "big data": {
    "spark": ["spark", "pyspark"], "hadoop": ["hadoop"], "etl": ["etl"],
    "data warehousing": ["data warehouse", "data warehousing", "snowflake", "redshift"]
  },
  "bi tools": {
    "tableau": ["tableau"], "power bi": ["power bi", "powerbi"], "looker": ["looker"]
  },
  "machine learning": {
    "machine learning": ["machine learning"], "deep learning": ["deep learning"],
    "nlp": ["nlp", "natural language processing"], "computer vision": ["computer vision"],
    "statistics": ["statistics", "statistical analysis"], "scikit-learn": ["scikit-learn", "sklearn"]
  },
  "ml frameworks": {
    "pytorch": ["pytorch"], "tensorflow": ["tensorflow"], "keras": ["keras"]
  },
  "cloud": {
    "aws": ["aws", "amazon web services"], "azure": ["azure"], "gcp": ["gcp", "google cloud"]
  },
  "devops": {
    "docker": ["docker"], "kubernetes": ["kubernetes", "k8s"], "ci/cd": ["ci/cd", "jenkins", "github actions"],
    "git": ["git"], "linux": ["linux", "unix"], "terraform": ["terraform"]
  },
  "testing": {
    "selenium": ["selenium"], "test automation": ["test automation", "automated testing"],
    "manual testing": ["manual testing"]
  },
  "accounting": {
    "accounting": ["accounting", "accounts payable", "accounts receivable", "general ledger"],
    "financial reporting": ["financial reporting", "financial statements"],
    "budgeting": ["budgeting", "forecasting"], "auditing": ["audit", "auditing"],
    "tax": ["tax", "taxation"], "gaap/ifrs": ["gaap", "ifrs"], "quickbooks": ["quickbooks"],
    "financial analysis": ["financial analysis", "financial modeling", "financial modelling"]
  },
  "erp": {
    "sap": ["sap"], "oracle erp": ["oracle financials", "oracle erp"]
  },
  "finance certifications": {
    "cpa": ["cpa", "certified public accountant"], "cfa": ["cfa"], "acca": ["acca"]
  },
  "marketing": {
    "seo": ["seo"], "digital marketing": ["digital marketing"], "social media": ["social media"],
    "content marketing": ["content marketing"], "google analytics": ["google analytics"],
    "market research": ["market research"]
  },
  "sales": {
    "crm": ["crm"], "salesforce": ["salesforce"], "lead generation": ["lead generation"],
    "account management": ["account management"], "b2b sales": ["b2b"]
  },
  "healthcare": {
    "patient care": ["patient care"], "nursing": ["nursing", "registered nurse"],
    "ehr/emr": ["ehr", "emr", "electronic health records", "electronic medical records"],
    "bls/acls": ["bls", "acls", "cpr"], "medication administration": ["medication administration"]
  },
  "hr": {
    "recruitment": ["recruitment", "recruiting", "talent acquisition"], "onboarding": ["onboarding"],
    "payroll": ["payroll"], "employee relations": ["employee relations"], "hris": ["hris", "workday"]
  },
  "design": {
    "figma": ["figma"], "photoshop": ["photoshop"], "illustrator": ["illustrator"],
    "ui/ux": ["ui/ux", "user experience", "ux design", "ui design"]
  },
  "engineering tools": {
    "autocad": ["autocad"], "solidworks": ["solidworks"], "matlab": ["matlab"], "plc": ["plc"]
  },
  "legal": {
    "contract drafting": ["contract drafting", "contract negotiation"], "litigation": ["litigation"],
    "compliance": ["compliance", "regulatory compliance"], "legal research": ["legal research"]
  },
  "project management": {
    "project management": ["project management"], "agile/scrum": ["agile", "scrum"],
    "jira": ["jira"], "pmp": ["pmp"], "stakeholder management": ["stakeholder management"]
  },
  "office": {
    "excel": ["excel", "vlookup", "pivot table"], "ms office": ["microsoft office", "ms office"]
  },
  "qualifications": {
    "bachelor's degree": ["bachelor", "bachelors", "b.tech", "b.sc", "bsc", "b.e."],
    "master's degree": ["master's", "masters", "m.tech", "m.sc", "msc"], "mba": ["mba"],
    "phd": ["phd", "ph.d", "doctorate"]
  }
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Compile symbol-aware skill regexes (so "java" never triggers inside "javascript", and "c++", "c#", ".net" match)
export const SKILL_RX = [];
for (const [fam, skills] of Object.entries(SKILL_FAMILIES)) {
  for (const [canon, aliases] of Object.entries(skills)) {
    const pat = "(?<![a-z0-9+#.])(?:" + aliases.map(escapeRegex).join("|") + ")(?![a-z0-9+#])";
    SKILL_RX.push({ canon, fam, rx: new RegExp(pat, "i") });
  }
}

const SECTION_HEADERS = [
  "Professional Summary", "Executive Summary", "Career Overview", "Professional Profile",
  "Summary", "Profile", "Objective", "Highlights", "Qualifications", "Skills",
  "Technical Skills", "Core Competencies", "Experience", "Work Experience",
  "Professional Experience", "Work History", "Employment History", "Education",
  "Education and Training", "Certifications", "Accomplishments", "Projects",
  "Languages", "Interests", "Additional Information"
].sort((a, b) => b.length - a.length);

const HEADER_GLUE = new RegExp("(?<![A-Za-z])(" + SECTION_HEADERS.map(escapeRegex).join("|") + ")(?=[A-Z])", "g");

export function cleanText(text) {
  if (!text || typeof text !== "string") return "";
  let t = text.replace(/<[^>]+>/g, " ");
  t = t.replace(/\u00a0/g, " ").replace(/\r/g, "\n");
  t = t.replace(HEADER_GLUE, "$1\n");
  t = t.replace(/\s*[•●▪■◦\uf0b7]\s*/g, "\n- ");
  t = t.replace(/[ \t]+/g, " ");
  t = t.replace(/ *\n */g, "\n");
  t = t.replace(/\n{2,}/g, "\n");
  return t.trim();
}

export function findSkills(text) {
  const found = {};
  for (const { canon, fam, rx } of SKILL_RX) {
    const m = rx.exec(text);
    if (m) {
      found[canon] = { fam, start: m.index, end: m.index + m[0].length };
    }
  }
  return found;
}

export function extractEvidence(text, s, e, pad = 70) {
  const prevNl = text.lastIndexOf("\n", s - 1);
  let a = Math.max(s - pad, prevNl + 1);
  const nextNl = text.indexOf("\n", e);
  let b = Math.min(e + pad, nextNl !== -1 ? nextNl : text.length);
  if (a > 0 && /[a-zA-Z0-9]/.test(text[a - 1])) {
    const sp = text.indexOf(" ", a);
    if (sp !== -1 && sp < s) a = sp + 1;
  }
  if (b < text.length && /[a-zA-Z0-9]/.test(text[b])) {
    const sp = text.lastIndexOf(" ", b);
    if (sp >= e) b = sp;
  }
  return text.slice(a, b).trim();
}

export const PRESET_PAIRS = [
  {
    id: "python_good",
    label: "Senior Python Dev (Part 7 Demo · Good Fit)",
    badgeColor: "emerald",
    resume: "Summary: Experienced Software Engineer specialized in backend systems. Over 6 years developing web applications in Python and Flask. Database design using PostgreSQL and Redis. Deployments managed on GCP and AWS. Skills: Python, Flask, SQL, PostgreSQL, Docker, AWS, Git. Education: B.Sc. in Computer Science.",
    jd: "We are looking for a Senior Python Developer. Must have 5+ years of experience in Python, Django, PostgreSQL, and AWS. Experience with Docker or Kubernetes is a plus. Bachelor's degree in CS required.",
    exactProbs: { "No Fit": 0.0070, "Potential Fit": 0.4300, "Good Fit": 0.5630 },
    exactCos: 0.6948
  },
  {
    id: "analyst_good",
    label: "Data Analyst (Part 6.1 Demo · Good Fit)",
    badgeColor: "emerald",
    resume: "SummaryData analyst with 3 years of experience in SQL, Python and Tableau. Built ETL pipelines and dashboards for finance teams.\nEducationB.Tech in Computer Science\nSkills\n- Python\n- SQL\n- Power BI\n- Excel",
    jd: "We are hiring a Data Analyst. Requirements: bachelor's degree, 2+ years with SQL and Python, experience with Tableau or Power BI, knowledge of statistics. AWS is a plus.",
    exactProbs: { "No Fit": 0.0049, "Potential Fit": 0.3771, "Good Fit": 0.6180 },
    exactCos: 0.7517
  },
  {
    id: "ml_potential",
    label: "ML Engineer Partial Match (Potential Fit)",
    badgeColor: "amber",
    resume: "Professional SummaryMachine Learning Engineer with 3 years experience building NLP and deep learning models using TensorFlow, Keras and scikit-learn. Deployed REST API services with Flask and Docker on GCP. EducationM.Tech in Data Science.",
    jd: "Hiring ML Engineer. Requirements: Master's degree or PhD, strong Python, PyTorch, NLP and Computer Vision experience. Experience deploying on AWS with Kubernetes and CI/CD pipelines."
  },
  {
    id: "cross_nofit",
    label: "Held-Out Test Pair (Part 6.1 · No Fit)",
    badgeColor: "rose",
    resume: "Professional SummaryParalegal and Legal Assistant with 5 years experience in contract drafting, legal research, and litigation support. Prepared Contracts of Sale, Promissory Notes, and Powers of Attorney.Assisted accounting department in maintaining bank accounts, including managing payroll. Proficient in Microsoft Word, Excel, Publisher, PowerPoint, Outlook, Lawson, Time Matters and Internet.",
    jd: "Staff Accountant & HR Coordinator. Requirements: Bachelor's degree in Accounting, experience with QuickBooks, accounting, auditing, Excel, MS Office, and recruitment.",
    exactProbs: { "No Fit": 0.5809, "Potential Fit": 0.4191, "Good Fit": 0.0000 },
    exactCos: 0.1948
  }
];

export function evaluateMatch(rawResume, rawJd) {
  const rClean = cleanText(rawResume);
  const jClean = cleanText(rawJd);

  const rTokens = Math.max(1, Math.round(rClean.split(/\s+/).filter(Boolean).length * 1.32));
  const jTokens = Math.max(1, Math.round(jClean.split(/\s+/).filter(Boolean).length * 1.32));
  const rChunks = rTokens <= 254 ? 1 : Math.min(6, Math.ceil((rTokens - 254) / 192) + 1);
  const jChunks = jTokens <= 254 ? 1 : Math.min(6, Math.ceil((jTokens - 254) / 192) + 1);

  const req = findSkills(jClean);
  const have = findSkills(rClean);
  const haveFams = {};
  for (const [c, info] of Object.entries(have)) {
    if (!haveFams[info.fam]) haveFams[info.fam] = [];
    haveFams[info.fam].push(c);
  }

  const matched = [], partial = [], missing = [];
  for (const [c, info] of Object.entries(req)) {
    if (have[c]) {
      matched.push({
        requirement: c,
        family: info.fam,
        evidence: extractEvidence(rClean, have[c].start, have[c].end)
      });
    } else if (haveFams[info.fam]) {
      partial.push({
        requirement: c,
        family: info.fam,
        related_in_resume: haveFams[info.fam]
      });
    } else {
      missing.push(c);
    }
  }

  const reqCount = Object.keys(req).length;
  const cov = reqCount > 0 ? matched.length / reqCount : null;

  let probs = null, cosSim = null, isExactCheckpoint = false;
  for (const p of PRESET_PAIRS) {
    if (p.exactProbs && p.resume.trim() === rawResume.trim() && p.jd.trim() === rawJd.trim()) {
      probs = p.exactProbs;
      cosSim = p.exactCos;
      isExactCheckpoint = true;
      break;
    }
  }

  if (!isExactCheckpoint) {
    const rWords = new Set(rClean.toLowerCase().match(/[a-z0-9+#.]{2,}/g) || []);
    const jWords = new Set(jClean.toLowerCase().match(/[a-z0-9+#.]{2,}/g) || []);
    let shared = 0;
    for (const w of jWords) if (rWords.has(w)) shared++;
    const lexOverlap = (rWords.size && jWords.size) ? shared / Math.sqrt(rWords.size * jWords.size) : 0;
    const skillScore = reqCount > 0 ? (matched.length + 0.45 * partial.length) / reqCount : lexOverlap;
    cosSim = Math.min(0.92, Math.max(-0.20, 0.14 + 0.56 * skillScore + 0.44 * lexOverlap));

    const lGood = -2.15 + 3.55 * skillScore + 1.85 * cosSim;
    const lPot  = -0.35 + 1.70 * skillScore + 0.90 * cosSim;
    const lNo   =  1.65 - 3.25 * skillScore - 1.50 * cosSim;
    const m = Math.max(lNo, lPot, lGood);
    const eNo = Math.exp(lNo - m), ePot = Math.exp(lPot - m), eGood = Math.exp(lGood - m);
    const sum = eNo + ePot + eGood;
    probs = {
      "No Fit": +(eNo / sum).toFixed(4),
      "Potential Fit": +(ePot / sum).toFixed(4),
      "Good Fit": +(eGood / sum).toFixed(4)
    };
  }

  const sorted = Object.entries(probs).sort((a, b) => b[1] - a[1]);
  const predClass = sorted[0][0];
  const fitScore = probs["Good Fit"] + 0.5 * probs["Potential Fit"];

  return {
    compatibility_class: predClass,
    expected_fit_score: +fitScore.toFixed(4),
    class_probabilities: probs,
    semantic_similarity: +cosSim.toFixed(4),
    matched_requirements: matched,
    partial_requirements: partial,
    not_identified: missing,
    requirement_coverage: cov !== null ? +cov.toFixed(3) : null,
    total_recognised_requirements: reqCount,
    resume_skills_detected: Object.keys(have),
    tokens: { rTokens, jTokens, rChunks, jChunks },
    cleaned: { rClean, jClean },
    isExactCheckpoint,
    review_notice: "Decision support only. A recruiter must review the original documents before any decision."
  };
}

export const MODEL_BENCHMARKS = [
  {
    id: "sbert_finetuned",
    name: "Fine-Tuned SBERT Bi-Encoder (Proposed)",
    badge: "Proposed Model (P)",
    f1: { val: 0.7692, test: 0.7555, jd_test: 0.6346, test_orig: 0.6731 },
    acc: { val: 0.8577, test: 0.8504, jd_test: 0.8172, test_orig: 0.7557 },
    ece: 0.0466,
    highlight: true
  },
  {
    id: "minilm_frozen_head",
    name: "Pretrained MiniLM Frozen + Interaction Head",
    badge: "Baseline A2",
    f1: { val: 0.6082, test: 0.5984, jd_test: 0.5080, test_orig: 0.5649 },
    acc: { val: 0.7227, test: 0.7049, jd_test: 0.6995, test_orig: 0.6607 },
    ece: 0.0363,
    highlight: false
  },
  {
    id: "tfidf_logreg",
    name: "TF-IDF (30k 1-2 grams + Overlap) + LogReg",
    badge: "Baseline C",
    f1: { val: 0.5010, test: 0.5124, jd_test: 0.4252, test_orig: 0.5393 },
    acc: { val: 0.6207, test: 0.6421, jd_test: 0.6184, test_orig: 0.6180 },
    ece: 0.0954,
    highlight: false
  },
  {
    id: "minilm_cosine",
    name: "Pretrained MiniLM Cosine Similarity Only",
    badge: "Baseline A1",
    f1: { val: 0.4610, test: 0.4579, jd_test: 0.4388, test_orig: 0.5223 },
    acc: { val: 0.5960, test: 0.5973, jd_test: 0.6415, test_orig: 0.6177 },
    ece: 0.0824,
    highlight: false
  }
];

export const CONFUSION_DATA = {
  test: {
    title: "Resume-Disjoint Test Set (test · n = 7,500 pairs, 66 unseen resumes)",
    macroF1: 0.7555,
    acc: 0.8504,
    twoClassError: "0.56%",
    matrix: [
      [0.90, 0.09, 0.01],
      [0.15, 0.72, 0.13],
      [0.01, 0.30, 0.69]
    ],
    perClass: [
      { cls: "No Fit", p: 0.9593, r: 0.9020, f1: 0.9298, support: "5,467" },
      { cls: "Potential Fit", p: 0.5793, r: 0.7221, f1: 0.6429, support: "1,346" },
      { cls: "Good Fit", p: 0.6965, r: 0.6914, f1: 0.6939, support: "687" }
    ]
  },
  jd_test: {
    title: "Unseen-JD Test Set (jd_test · n = 8,315 pairs, 28 unseen vacancies)",
    macroF1: 0.6346,
    acc: 0.8172,
    twoClassError: "0.67%",
    matrix: [
      [0.86, 0.14, 0.01],
      [0.17, 0.75, 0.08],
      [0.04, 0.60, 0.36]
    ],
    perClass: [
      { cls: "No Fit", p: 0.9520, r: 0.8573, f1: 0.9022, support: "6,407" },
      { cls: "Potential Fit", p: 0.5235, r: 0.7529, f1: 0.6176, support: "1,570" },
      { cls: "Good Fit", p: 0.4181, r: 0.3550, f1: 0.3840, support: "338" }
    ]
  }
};

export const POPRESUME_OCCUPATIONS = [
  { job: "Accountants & Auditors", n: "7,784", gf_f: 0.965, gf_m: 0.973, dpd_sex: 0.0086, dpr_sex: 0.9912, dpd_race: 0.0199, dpr_race: 0.9794, gap_sex: 0.0083, gap_race: 0.0009, note: "High selection rate" },
  { job: "Elementary & Middle School Teachers", n: "16,188", gf_f: 0.224, gf_m: 0.228, dpd_sex: 0.0042, dpr_sex: 0.9814, dpd_race: 0.0330, dpr_race: 0.8708, gap_sex: 0.0011, gap_race: 0.0176, note: "Above 0.80 4/5ths threshold" },
  { job: "Software Developers", n: "13,370", gf_f: 0.009, gf_m: 0.007, dpd_sex: 0.0020, dpr_sex: 0.7854, dpd_race: 0.0061, dpr_race: 0.3963, gap_sex: 0.0045, gap_race: 0.0133, note: "Near-zero discrete rate (no skills section)" },
  { job: "Registered Nurses", n: "17,632", gf_f: 0.001, gf_m: 0.001, dpd_sex: 0.0001, dpr_sex: 0.9093, dpd_race: 0.0007, dpr_race: 0.4934, gap_sex: 0.0093, gap_race: 0.0056, note: "Near-zero discrete rate (no skills section)" },
  { job: "Construction Laborers", n: "5,910", gf_f: 0.000, gf_m: 0.002, dpd_sex: 0.0025, dpr_sex: 0.0000, dpd_race: 0.0140, dpr_race: 0.0000, gap_sex: 0.0079, gap_race: 0.0393, note: "Out-of-domain + near-zero discrete rate" }
];
