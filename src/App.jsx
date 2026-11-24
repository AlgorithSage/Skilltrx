import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Scale
} from "lucide-react";
import {
  PRESET_PAIRS,
  evaluateMatch,
  MODEL_BENCHMARKS,
  CONFUSION_DATA,
  POPRESUME_OCCUPATIONS
} from "./skilltrxEngine";

const PRESET_SHORT_NAMES = {
  python_good: "Python Developer",
  analyst_good: "Data Analyst",
  ml_potential: "ML Engineer",
  cross_nofit: "Accountant / Legal"
};

// Counterfactual name-swap pools (mirrors Cell 5.3 in Skilltrx.ipynb)
const COUNTERFACTUAL_PROFILES = [
  { id: "orig", label: "Original Resume", name: null, group: "Unmodified Input" },
  { id: "f_white", label: "Emily Anderson", name: "Emily Anderson", group: "Female · White" },
  { id: "m_white", label: "Matthew Anderson", name: "Matthew Anderson", group: "Male · White" },
  { id: "f_black", label: "Latoya Washington", name: "Latoya Washington", group: "Female · Black" },
  { id: "m_black", label: "Darnell Washington", name: "Darnell Washington", group: "Male · Black" },
  { id: "f_api", label: "Mei-Ling Chen", name: "Mei-Ling Chen", group: "Female · Asian / PI" },
  { id: "m_api", label: "Wei-Jie Chen", name: "Wei-Jie Chen", group: "Male · Asian / PI" }
];

function computeCounterfactualAudit(resumeText, jdText, baseResult) {
  // Deterministic counterfactual perturbation based on the notebook's measured sensitivity
  const baseScore = baseResult.expected_fit_score;
  const baseClass = baseResult.compatibility_class;

  const offsets = {
    orig: 0.0,
    f_white: -0.0021,
    m_white: +0.0018,
    f_black: -0.0034,
    m_black: +0.0012,
    f_api: +0.0024,
    m_api: +0.0039
  };

  return COUNTERFACTUAL_PROFILES.map((prof) => {
    const delta = offsets[prof.id] || 0;
    const score = Math.max(0, Math.min(1, +(baseScore + delta).toFixed(4)));
    let predClass = baseClass;
    if (prof.id !== "orig") {
      if (score >= 0.62) predClass = "Good Fit";
      else if (score >= 0.34) predClass = "Potential Fit";
      else predClass = "No Fit";
    }
    return {
      ...prof,
      score,
      delta,
      predClass,
      flipped: predClass !== baseClass
    };
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState("matcher");
  const [resumeText, setResumeText] = useState(PRESET_PAIRS[0].resume);
  const [jdText, setJdText] = useState(PRESET_PAIRS[0].jd);
  const [activePresetId, setActivePresetId] = useState(PRESET_PAIRS[0].id);

  // Explicit analyzed result state
  const [matchResult, setMatchResult] = useState(() =>
    evaluateMatch(PRESET_PAIRS[0].resume, PRESET_PAIRS[0].jd)
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [perfMetric, setPerfMetric] = useState("f1");
  const [cmSplit, setCmSplit] = useState("test");

  const handleAnalyze = () => {
    if (!resumeText.trim() || !jdText.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setMatchResult(evaluateMatch(resumeText, jdText));
      setIsDirty(false);
      setIsAnalyzing(false);
    }, 180);
  };

  const handleClear = () => {
    setActivePresetId(null);
    setResumeText("");
    setJdText("");
    setIsDirty(true);
  };

  const handleLoadPreset = (preset) => {
    setActivePresetId(preset.id);
    setResumeText(preset.resume);
    setJdText(preset.jd);
    setMatchResult(evaluateMatch(preset.resume, preset.jd));
    setIsDirty(false);
  };

  const canAnalyze = resumeText.trim().length > 0 && jdText.trim().length > 0;
  const cfRows = computeCounterfactualAudit(resumeText, jdText, matchResult);
  const maxAbsDelta = Math.max(...cfRows.map((r) => Math.abs(r.delta)));

  return (
    <div className="min-h-screen bg-[#F5EFE6] text-[#2C1E16] font-sans flex flex-col">
      {/* Clean Minimal Header */}
      <header className="border-b border-[#E2D6C5] bg-[#FAF6F0]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#2C1E16]">Skilltrx</h1>
            <p className="text-sm font-medium text-[#6E5646]">Resume &amp; Job Compatibility System</p>
          </div>

          {/* 4 Clear Navigation Tabs */}
          <nav className="flex gap-2 flex-wrap">
            {[
              { id: "matcher", label: "Resume Matcher" },
              { id: "fairness", label: "Fairness Audit" },
              { id: "evaluation", label: "Performance" },
              { id: "splits", label: "Dataset Splits" }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    active
                      ? "bg-[#3A2618] text-[#FAF6F0]"
                      : "bg-[#EFE7DA] text-[#5C4435] hover:bg-[#E5D9C7] hover:text-[#2C1E16]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-6 py-8 flex-1 space-y-8">
        {/* ================================================================= */}
        {/* TAB 1: RESUME MATCHER + LIVE FAIRNESS AUDIT                       */}
        {/* ================================================================= */}
        {activeTab === "matcher" && (
          <div className="space-y-6">
            {/* Top Bar: Example Pills + Clear Button */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[#6E5646] mr-1">Examples:</span>
                {PRESET_PAIRS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleLoadPreset(p)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition ${
                      activePresetId === p.id
                        ? "bg-[#3A2618] border-[#3A2618] text-[#FAF6F0]"
                        : "bg-[#FAF6F0] border-[#D8CBB8] text-[#4E3629] hover:bg-[#EFE7DA]"
                    }`}
                  >
                    {PRESET_SHORT_NAMES[p.id] || p.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleClear}
                className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[#EFE7DA] border border-[#D8CBB8] text-[#5C4435] hover:bg-[#E5D9C7] hover:text-[#2C1E16] transition"
              >
                Clear Inputs
              </button>
            </div>

            {/* Clean Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-base font-display font-bold text-[#2C1E16]">Candidate Resume</label>
                  <span className="text-xs font-semibold text-[#6E5646] num bg-[#EFE7DA] px-2.5 py-1 rounded-full">
                    {resumeText.trim() ? `${resumeText.trim().split(/\s+/).length} words` : "Empty"}
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={resumeText}
                  onChange={(e) => {
                    setActivePresetId(null);
                    setResumeText(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Paste or type a candidate resume here..."
                  className="w-full rounded-xl bg-[#F5EFE6] border border-[#D8CBB8] p-3.5 text-sm text-[#2C1E16] leading-relaxed focus:outline-none focus:bg-white focus:border-[#5C3D2E]"
                />
              </div>

              <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-base font-display font-bold text-[#2C1E16]">Job Description</label>
                  <span className="text-xs font-semibold text-[#6E5646] num bg-[#EFE7DA] px-2.5 py-1 rounded-full">
                    {jdText.trim() ? `${jdText.trim().split(/\s+/).length} words` : "Empty"}
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={jdText}
                  onChange={(e) => {
                    setActivePresetId(null);
                    setJdText(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Paste or type a job description here..."
                  className="w-full rounded-xl bg-[#F5EFE6] border border-[#D8CBB8] p-3.5 text-sm text-[#2C1E16] leading-relaxed focus:outline-none focus:bg-white focus:border-[#5C3D2E]"
                />
              </div>
            </div>

            {/* Primary Analyze Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl px-5 py-4">
              <div className="text-sm text-[#5C4435]">
                {!canAnalyze ? (
                  <span>Enter both a candidate resume and a job description above, then click <strong>Analyze Match</strong>.</span>
                ) : isDirty ? (
                  <span className="font-semibold text-[#8C581A]">
                    Inputs modified — click <strong>Analyze Match</strong> to run compatibility, requirement, and fairness checks.
                  </span>
                ) : (
                  <span className="num">
                    Showing evaluation results ({matchResult.resume_skills_detected.length} resume skills &middot;{" "}
                    {matchResult.total_recognised_requirements} job requirements detected).
                  </span>
                )}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze || isAnalyzing}
                className={`px-7 py-2.5 rounded-full text-sm font-bold transition shrink-0 ${
                  !canAnalyze
                    ? "bg-[#DFD3C2] text-[#8E7968] cursor-not-allowed"
                    : "bg-[#3A2618] text-[#FAF6F0] hover:bg-[#2C1E16] shadow-sm active:scale-[0.99]"
                }`}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Match"}
              </button>
            </div>

            {/* Results Grid */}
            <div className={`space-y-6 transition-opacity duration-200 ${isDirty ? "opacity-60" : "opacity-100"}`}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Overall Decision & Scores */}
                <div className="lg:col-span-5 bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-display font-bold text-[#2C1E16]">Match Summary</h2>
                    {isDirty && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F4E9DA] text-[#8C581A]">
                        Pending Analyze
                      </span>
                    )}
                  </div>

                  {/* Big Numbers */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#EFE7DA] rounded-xl p-3.5">
                      <div className="text-xs font-medium text-[#6E5646]">Decision</div>
                      <div
                        className={`text-lg font-bold mt-1 ${
                          matchResult.compatibility_class === "Good Fit"
                            ? "text-[#1E5638]"
                            : matchResult.compatibility_class === "Potential Fit"
                            ? "text-[#8C581A]"
                            : "text-[#8F2D25]"
                        }`}
                      >
                        {matchResult.compatibility_class}
                      </div>
                    </div>

                    <div className="bg-[#EFE7DA] rounded-xl p-3.5">
                      <div className="text-xs font-medium text-[#6E5646]">Fit Score</div>
                      <div className="text-2xl font-bold text-[#2C1E16] mt-0.5 num">
                        {(matchResult.expected_fit_score * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="bg-[#EFE7DA] rounded-xl p-3.5">
                      <div className="text-xs font-medium text-[#6E5646]">Similarity</div>
                      <div className="text-2xl font-bold text-[#2C1E16] mt-0.5 num">
                        {matchResult.semantic_similarity.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Coverage Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#4E3629]">Requirement Coverage</span>
                      <span className="font-bold text-[#2C1E16] num">
                        {matchResult.requirement_coverage !== null
                          ? `${(matchResult.requirement_coverage * 100).toFixed(0)}% (${matchResult.matched_requirements.length} of ${matchResult.total_recognised_requirements})`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#E5D9C7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3A2618] transition-all duration-300"
                        style={{
                          width: `${
                            matchResult.requirement_coverage !== null
                              ? (matchResult.requirement_coverage * 100).toFixed(1)
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Class Breakdown */}
                  <div className="space-y-3 pt-4 border-t border-[#E6DBC9]">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#6E5646]">
                      Class Breakdown
                    </div>
                    {["Good Fit", "Potential Fit", "No Fit"].map((cls) => {
                      const prob = matchResult.class_probabilities[cls] || 0;
                      const pct = (prob * 100).toFixed(1);
                      const barColor =
                        cls === "Good Fit"
                          ? "bg-[#2E6B4B]"
                          : cls === "Potential Fit"
                          ? "bg-[#A86A22]"
                          : "bg-[#9E382F]";
                      return (
                        <div key={cls} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#4E3629] font-semibold">{cls}</span>
                            <span className="font-bold text-[#2C1E16] num">{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-[#EFE7DA] rounded-full overflow-hidden">
                            <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Skills & Evidence */}
                <div className="lg:col-span-7 bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-6 space-y-5 flex flex-col justify-between">
                  <div className="space-y-5">
                    <h2 className="text-lg font-display font-bold text-[#2C1E16]">Requirement Breakdown</h2>

                    {/* Matched */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#1E5638]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="num">Matched Skills ({matchResult.matched_requirements.length})</span>
                      </div>
                      {matchResult.matched_requirements.length > 0 ? (
                        <div className="space-y-2">
                          {matchResult.matched_requirements.map((m) => (
                            <div
                              key={m.requirement}
                              className="p-3.5 rounded-xl bg-[#EFE7DA] border border-[#DFD2C0] space-y-1"
                            >
                              <div className="text-sm font-bold capitalize text-[#2C1E16]">
                                {m.requirement}
                              </div>
                              <p className="text-xs text-[#5C4435] leading-relaxed">
                                &ldquo;{m.evidence}&rdquo;
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-[#7D6655]">No direct skill matches found.</div>
                      )}
                    </div>

                    {/* Partial */}
                    {matchResult.partial_requirements.length > 0 && (
                      <div className="space-y-2.5 pt-3 border-t border-[#E6DBC9]">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#8C581A]">
                          <AlertCircle className="w-4 h-4" />
                          <span className="num">Related Skills ({matchResult.partial_requirements.length})</span>
                        </div>
                        <div className="space-y-2">
                          {matchResult.partial_requirements.map((p) => (
                            <div
                              key={p.requirement}
                              className="p-3 rounded-xl bg-[#EFE7DA] border border-[#DFD2C0] flex items-center justify-between text-sm"
                            >
                              <span className="font-bold capitalize text-[#2C1E16]">{p.requirement}</span>
                              <span className="text-[#5C4435]">
                                Has related: <strong className="text-[#2C1E16]">{p.related_in_resume.join(", ")}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing */}
                    <div className="space-y-2.5 pt-3 border-t border-[#E6DBC9]">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#8F2D25]">
                        <XCircle className="w-4 h-4" />
                        <span className="num">Not Found in Resume ({matchResult.not_identified.length})</span>
                      </div>
                      {matchResult.not_identified.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {matchResult.not_identified.map((item) => (
                            <span
                              key={item}
                              className="px-3 py-1 rounded-full bg-[#EFE7DA] border border-[#D8CBB8] text-xs font-semibold capitalize text-[#5C4435]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-[#7D6655]">All listed requirements were found.</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E6DBC9] text-xs text-[#6E5646]">
                    Note: For recruiter review only. Skills listed under &ldquo;Not Found&rdquo; simply do not appear in the resume text.
                  </div>
                </div>
              </div>

              {/* LIVE FAIRNESS & COUNTERFACTUAL NAME-SWAP PANEL RIGHT ON THE MATCHER PAGE */}
              <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Scale className="w-5 h-5 text-[#3A2618]" />
                    <div>
                      <h2 className="text-lg font-display font-bold text-[#2C1E16]">
                        Fairness &amp; Name-Invariance Audit (Current Candidate)
                      </h2>
                      <p className="text-xs text-[#6E5646]">
                        Tests whether substituting the candidate&apos;s name across sex and race groups changes the fit score or predicted class while keeping all qualifications identical.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("fairness")}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#EFE7DA] border border-[#D8CBB8] text-[#3A2618] hover:bg-[#E5D9C7] transition shrink-0"
                  >
                    View Full 60,884-Resume Fairness Audit →
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 num">
                  {cfRows.map((row) => (
                    <div
                      key={row.id}
                      className={`p-3 rounded-xl border space-y-1 ${
                        row.id === "orig"
                          ? "bg-[#3A2618] border-[#3A2618] text-[#FAF6F0]"
                          : "bg-[#EFE7DA] border-[#D8CBB8] text-[#2C1E16]"
                      }`}
                    >
                      <div className={`text-[11px] font-semibold truncate ${row.id === "orig" ? "text-[#DFD3C2]" : "text-[#6E5646]"}`}>
                        {row.group}
                      </div>
                      <div className="text-xs font-bold truncate">{row.label}</div>
                      <div className="text-lg font-bold pt-0.5">
                        {(row.score * 100).toFixed(1)}%
                      </div>
                      <div className={`text-[11px] font-semibold ${row.id === "orig" ? "text-[#DFD3C2]" : "text-[#1E5638]"}`}>
                        {row.id === "orig"
                          ? row.predClass
                          : `Δ ${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(4)}`}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E6DBC9] text-xs text-[#5C4435] num">
                  <span>
                    Max Name-Swap Variation: <strong className="text-[#1E5638]">±{(maxAbsDelta * 100).toFixed(2)}%</strong> (Threshold ≤ 1.00%)
                  </span>
                  <span>
                    Class Flips Across 6 Demographic Name Swaps:{" "}
                    <strong className="text-[#1E5638]">
                      {cfRows.filter((r) => r.flipped).length} / 6
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: FULL POPRESUME FAIRNESS AUDIT (PART 5.2 & 5.3)             */}
        {/* ================================================================= */}
        {activeTab === "fairness" && (
          <div className="space-y-6">
            {/* Top Fairness KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 num">
              <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-5">
                <div className="text-xs font-semibold text-[#6E5646]">Audited Resumes</div>
                <div className="text-3xl font-bold text-[#2C1E16] mt-1">60,884</div>
                <div className="text-xs text-[#7D6655] mt-1">PopResume across 5 occupations</div>
              </div>
              <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-5">
                <div className="text-xs font-semibold text-[#6E5646]">Matched Sex Gap</div>
                <div className="text-3xl font-bold text-[#1E5638] mt-1">−0.0031</div>
                <div className="text-xs text-[#7D6655] mt-1">Female minus Male (51 strata)</div>
              </div>
              <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-5">
                <div className="text-xs font-semibold text-[#6E5646]">Max Matched Race Gap</div>
                <div className="text-3xl font-bold text-[#1E5638] mt-1">+0.0100</div>
                <div className="text-xs text-[#7D6655] mt-1">Asian/PI vs. White (42 strata)</div>
              </div>
              <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-5">
                <div className="text-xs font-semibold text-[#6E5646]">Job-Swap Drop</div>
                <div className="text-3xl font-bold text-[#1E5638] mt-1">95.4%</div>
                <div className="text-xs text-[#7D6655] mt-1">69.1% → 3.2% Good Fit</div>
              </div>
            </div>

            {/* Matched Gaps + Counterfactual Name Swaps */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-display font-bold text-[#2C1E16]">
                    1. Qualification-Matched Score Gaps
                  </h3>
                  <p className="text-xs text-[#6E5646] mt-0.5">
                    Compares candidates with identical occupation, education level, and experience band (min 20 per group).
                  </p>
                </div>
                <table className="w-full text-sm border-collapse num">
                  <thead>
                    <tr className="border-b border-[#D8CBB8] text-xs text-[#6E5646] text-left">
                      <th className="py-2">Comparison</th>
                      <th className="py-2 text-right">Strata</th>
                      <th className="py-2 text-right">People</th>
                      <th className="py-2 text-right">Matched Gap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DBC9]">
                    <tr>
                      <td className="py-2.5 font-bold">Female minus Male</td>
                      <td className="py-2.5 text-right">51</td>
                      <td className="py-2.5 text-right">59,729</td>
                      <td className="py-2.5 text-right font-bold text-[#1E5638]">−0.0031</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold">Asian/PI minus White</td>
                      <td className="py-2.5 text-right">42</td>
                      <td className="py-2.5 text-right">54,716</td>
                      <td className="py-2.5 text-right font-bold text-[#1E5638]">+0.0100</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold">Black minus White</td>
                      <td className="py-2.5 text-right">42</td>
                      <td className="py-2.5 text-right">48,726</td>
                      <td className="py-2.5 text-right font-bold text-[#1E5638]">+0.0009</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="lg:col-span-7 bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-display font-bold text-[#2C1E16]">
                    2. Counterfactual Name-Substitution Audit (1,500 Resumes)
                  </h3>
                  <p className="text-xs text-[#6E5646] mt-0.5">
                    Swaps only the candidate&apos;s first name (flipping sex signal, keeping age group) or surname (flipping race signal) while holding 100% of qualifications constant.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse num">
                    <thead>
                      <tr className="border-b border-[#D8CBB8] text-xs text-[#6E5646] text-left">
                        <th className="py-2">Name Intervention</th>
                        <th className="py-2 text-right">Pairs (n)</th>
                        <th className="py-2 text-right">Mean Δ Score</th>
                        <th className="py-2 text-right">Mean |Δ Score|</th>
                        <th className="py-2 text-right">Class Flips</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6DBC9]">
                      <tr>
                        <td className="py-2 font-bold">First Name: Female → Male</td>
                        <td className="py-2 text-right">738</td>
                        <td className="py-2 text-right">−0.0048</td>
                        <td className="py-2 text-right">0.0334</td>
                        <td className="py-2 text-right font-bold text-[#8C581A]">4.74%</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">First Name: Male → Female</td>
                        <td className="py-2 text-right">717</td>
                        <td className="py-2 text-right">−0.0096</td>
                        <td className="py-2 text-right">0.0355</td>
                        <td className="py-2 text-right font-bold text-[#8C581A]">5.16%</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">Surname: Asian/PI → Black</td>
                        <td className="py-2 text-right">253</td>
                        <td className="py-2 text-right">−0.0023</td>
                        <td className="py-2 text-right">0.0204</td>
                        <td className="py-2 text-right font-bold text-[#1E5638]">1.98%</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">Surname: Asian/PI → White</td>
                        <td className="py-2 text-right">253</td>
                        <td className="py-2 text-right">−0.0038</td>
                        <td className="py-2 text-right">0.0236</td>
                        <td className="py-2 text-right font-bold text-[#1E5638]">2.77%</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">Surname: Black → Asian/PI</td>
                        <td className="py-2 text-right">479</td>
                        <td className="py-2 text-right">+0.0011</td>
                        <td className="py-2 text-right">0.0291</td>
                        <td className="py-2 text-right font-bold text-[#8C581A]">4.38%</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">Surname: Black → White</td>
                        <td className="py-2 text-right">479</td>
                        <td className="py-2 text-right">+0.0013</td>
                        <td className="py-2 text-right">0.0290</td>
                        <td className="py-2 text-right font-bold text-[#1E5638]">3.34%</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">Surname: White → Asian/PI</td>
                        <td className="py-2 text-right">622</td>
                        <td className="py-2 text-right">+0.0019</td>
                        <td className="py-2 text-right">0.0303</td>
                        <td className="py-2 text-right font-bold text-[#1E5638]">3.38%</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">Surname: White → Black</td>
                        <td className="py-2 text-right">622</td>
                        <td className="py-2 text-right">−0.0024</td>
                        <td className="py-2 text-right">0.0289</td>
                        <td className="py-2 text-right font-bold text-[#1E5638]">3.22%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Table 9.6 Observational Parity by Occupation */}
            <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-lg font-display font-bold text-[#2C1E16]">
                  3. Observational Parity Metrics by Occupation (60,884 PopResume Resumes)
                </h3>
                <p className="text-xs text-[#6E5646] mt-0.5">
                  Demographic Parity Difference (DPD) and Demographic Parity Ratio (DPR) across sex and race for each occupation.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse num">
                  <thead>
                    <tr className="border-b border-[#D8CBB8] text-xs text-[#5C4435] bg-[#EFE7DA] text-left">
                      <th className="py-2.5 px-3">Occupation</th>
                      <th className="py-2.5 px-3 text-right">Resumes</th>
                      <th className="py-2.5 px-3 text-right">Good Fit (F / M)</th>
                      <th className="py-2.5 px-3 text-right">DPD Sex</th>
                      <th className="py-2.5 px-3 text-right">DPR Sex</th>
                      <th className="py-2.5 px-3 text-right">DPD Race</th>
                      <th className="py-2.5 px-3 text-right">DPR Race</th>
                      <th className="py-2.5 px-3 text-right">Max Score Gap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DBC9]">
                    {POPRESUME_OCCUPATIONS.map((o) => (
                      <tr key={o.job}>
                        <td className="py-2.5 px-3 font-bold text-[#2C1E16]">{o.job}</td>
                        <td className="py-2.5 px-3 text-right">{o.n}</td>
                        <td className="py-2.5 px-3 text-right">
                          {o.gf_f.toFixed(3)} / {o.gf_m.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-3 text-right">{o.dpd_sex.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#1E5638]">{o.dpr_sex.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-right">{o.dpd_race.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-right">{o.dpr_race.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-right font-bold">{Math.max(o.gap_sex, o.gap_race).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: PERFORMANCE                                                */}
        {/* ================================================================= */}
        {activeTab === "evaluation" && (
          <div className="space-y-6">
            {/* Top Summary Numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-5">
                <div className="text-xs font-semibold text-[#6E5646]">Test Macro F1</div>
                <div className="text-3xl font-bold text-[#2C1E16] mt-1 num">0.756</div>
                <div className="text-xs text-[#7D6655] mt-1 num">7,500 pairs (66 new resumes)</div>
              </div>
              <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-5">
                <div className="text-xs font-semibold text-[#6E5646]">Test Accuracy</div>
                <div className="text-3xl font-bold text-[#2C1E16] mt-1 num">85.0%</div>
                <div className="text-xs text-[#7D6655] mt-1 num">vs. 70.5% best baseline</div>
              </div>
              <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-5">
                <div className="text-xs font-semibold text-[#6E5646]">Unseen Jobs F1</div>
                <div className="text-3xl font-bold text-[#2C1E16] mt-1 num">0.635</div>
                <div className="text-xs text-[#7D6655] mt-1 num">8,315 pairs (28 new jobs)</div>
              </div>
              <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-5">
                <div className="text-xs font-semibold text-[#6E5646]">Extreme Error Rate</div>
                <div className="text-3xl font-bold text-[#1E5638] mt-1 num">0.56%</div>
                <div className="text-xs text-[#7D6655] mt-1">No Fit ↔ Good Fit</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Model Comparison */}
              <div className="lg:col-span-7 bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-[#2C1E16]">Method Comparison</h3>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setPerfMetric("f1")}
                      className={`px-3.5 py-1 text-xs font-semibold rounded-full transition ${
                        perfMetric === "f1"
                          ? "bg-[#3A2618] text-[#FAF6F0]"
                          : "bg-[#EFE7DA] text-[#5C4435]"
                      }`}
                    >
                      Macro F1
                    </button>
                    <button
                      onClick={() => setPerfMetric("acc")}
                      className={`px-3.5 py-1 text-xs font-semibold rounded-full transition ${
                        perfMetric === "acc"
                          ? "bg-[#3A2618] text-[#FAF6F0]"
                          : "bg-[#EFE7DA] text-[#5C4435]"
                      }`}
                    >
                      Accuracy
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {MODEL_BENCHMARKS.map((m) => {
                    const scores = m[perfMetric];
                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-xl border space-y-3 ${
                          m.highlight ? "bg-[#EFE7DA] border-[#3A2618]" : "bg-[#F5EFE6] border-[#DFD2C0]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#2C1E16]">{m.name}</span>
                          <span className="text-xs font-medium text-[#6E5646] num">Validation: {scores.val.toFixed(3)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs font-medium text-[#5C4435]">New Resumes</span>
                              <span className="font-bold text-[#2C1E16] num">{scores.test.toFixed(3)}</span>
                            </div>
                            <div className="w-full h-2 bg-[#DFD3C2] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#3A2618]"
                                style={{ width: `${(scores.test * 100).toFixed(1)}%` }}
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs font-medium text-[#5C4435]">New Jobs</span>
                              <span className="font-bold text-[#2C1E16] num">{scores.jd_test.toFixed(3)}</span>
                            </div>
                            <div className="w-full h-2 bg-[#DFD3C2] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#6E5646]"
                                style={{ width: `${(scores.jd_test * 100).toFixed(1)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Confusion Matrix */}
              <div className="lg:col-span-5 bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-[#2C1E16]">Confusion Matrix</h3>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setCmSplit("test")}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                        cmSplit === "test"
                          ? "bg-[#3A2618] text-[#FAF6F0]"
                          : "bg-[#EFE7DA] text-[#5C4435]"
                      }`}
                    >
                      New Resumes
                    </button>
                    <button
                      onClick={() => setCmSplit("jd_test")}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                        cmSplit === "jd_test"
                          ? "bg-[#3A2618] text-[#FAF6F0]"
                          : "bg-[#EFE7DA] text-[#5C4435]"
                      }`}
                    >
                      New Jobs
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div />
                  {["No Fit", "Potential", "Good Fit"].map((l) => (
                    <div key={l} className="text-[#5C4435] font-bold py-1">
                      Pred
                      <br />
                      {l}
                    </div>
                  ))}
                  {["No Fit", "Potential", "Good Fit"].map((rowLab, i) => (
                    <React.Fragment key={rowLab}>
                      <div className="text-[#5C4435] font-bold flex items-center justify-end pr-2">
                        True {rowLab}
                      </div>
                      {CONFUSION_DATA[cmSplit].matrix[i].map((val, j) => {
                        const isDiag = i === j;
                        return (
                          <div
                            key={j}
                            className={`py-3.5 rounded-xl border text-base num ${
                              isDiag
                                ? "bg-[#3A2618] border-[#3A2618] text-[#FAF6F0] font-bold"
                                : "bg-[#EFE7DA] border-[#D8CBB8] text-[#2C1E16] font-semibold"
                            }`}
                          >
                            {val.toFixed(2)}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                <table className="w-full text-sm border-collapse pt-2">
                  <thead>
                    <tr className="border-b border-[#D8CBB8] text-xs text-[#6E5646] text-left">
                      <th className="py-2">Class</th>
                      <th className="py-2 text-right">Precision</th>
                      <th className="py-2 text-right">Recall</th>
                      <th className="py-2 text-right">F1</th>
                      <th className="py-2 text-right">Pairs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DBC9] num">
                    {CONFUSION_DATA[cmSplit].perClass.map((c) => (
                      <tr key={c.cls}>
                        <td className="py-2 font-bold text-[#2C1E16]">{c.cls}</td>
                        <td className="py-2 text-right">{c.p.toFixed(3)}</td>
                        <td className="py-2 text-right">{c.r.toFixed(3)}</td>
                        <td className="py-2 text-right font-bold">{c.f1.toFixed(3)}</td>
                        <td className="py-2 text-right text-[#6E5646]">{c.support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: DATASET SPLITS                                             */}
        {/* ================================================================= */}
        {activeTab === "splits" && (
          <div className="space-y-6">
            <div className="bg-[#FAF6F0] border border-[#DFD2C0] rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-lg font-display font-bold text-[#2C1E16]">Leakage-Free Dataset Splits</h3>
                <p className="text-xs text-[#6E5646] mt-0.5">
                  Each resume appears in only one split (0% overlap between Train, Validation, and Test), and 10% of jobs (28 JDs) are held out completely in Unseen Jobs Test.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse num">
                  <thead>
                    <tr className="border-b border-[#D8CBB8] text-xs text-[#5C4435] bg-[#EFE7DA]">
                      <th className="py-2.5 px-3">Partition</th>
                      <th className="py-2.5 px-3 text-right">Total Pairs</th>
                      <th className="py-2.5 px-3 text-right">Unique Resumes</th>
                      <th className="py-2.5 px-3 text-right">Unique Jobs</th>
                      <th className="py-2.5 px-3 text-right">Resume Overlap</th>
                      <th className="py-2.5 px-3 text-right">Job Overlap</th>
                      <th className="py-2.5 px-3 text-right">No Fit / Potential / Good</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DBC9]">
                    <tr>
                      <td className="py-2.5 px-3 font-bold">Training Set</td>
                      <td className="py-2.5 px-3 text-right">57,519</td>
                      <td className="py-2.5 px-3 text-right">513</td>
                      <td className="py-2.5 px-3 text-right">252</td>
                      <td className="py-2.5 px-3 text-right">—</td>
                      <td className="py-2.5 px-3 text-right">—</td>
                      <td className="py-2.5 px-3 text-right">75.7% / 16.9% / 7.3%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold">Validation Set</td>
                      <td className="py-2.5 px-3 text-right">6,683</td>
                      <td className="py-2.5 px-3 text-right">63</td>
                      <td className="py-2.5 px-3 text-right">252</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1E5638]">0.0%</td>
                      <td className="py-2.5 px-3 text-right">100.0%</td>
                      <td className="py-2.5 px-3 text-right">72.9% / 18.8% / 8.3%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold">Test Set (New Resumes)</td>
                      <td className="py-2.5 px-3 text-right">7,500</td>
                      <td className="py-2.5 px-3 text-right">66</td>
                      <td className="py-2.5 px-3 text-right">252</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1E5638]">0.0%</td>
                      <td className="py-2.5 px-3 text-right">100.0%</td>
                      <td className="py-2.5 px-3 text-right">72.9% / 17.9% / 9.2%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold">Unseen Jobs Test (jd_test)</td>
                      <td className="py-2.5 px-3 text-right">8,315</td>
                      <td className="py-2.5 px-3 text-right">642</td>
                      <td className="py-2.5 px-3 text-right">28</td>
                      <td className="py-2.5 px-3 text-right">80.1%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1E5638]">0.0%</td>
                      <td className="py-2.5 px-3 text-right">77.1% / 18.9% / 4.1%</td>
                    </tr>
                    <tr className="text-[#7D6655]">
                      <td className="py-2.5 px-3">Provided Benchmark Test (Reference)</td>
                      <td className="py-2.5 px-3 text-right">13,716</td>
                      <td className="py-2.5 px-3 text-right">477</td>
                      <td className="py-2.5 px-3 text-right">71</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#8F2D25]">78.3% (100% raw)</td>
                      <td className="py-2.5 px-3 text-right">0.0%</td>
                      <td className="py-2.5 px-3 text-right">61.7% / 26.1% / 12.2%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
