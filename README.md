# Skilltrx — Explainable and Fairness-Aware Semantic Resume–Job Matching System

**Skilltrx** is an intelligent resume–job matching system built in PyTorch that understands context beyond simple keywords. It classifies candidates as **Good Fit**, **Potential Fit**, or **No Fit**, shows recruiters exact quotes proving matched and related skills, and tests that predictions remain fair across gender and race.

---

## Project Folder Structure

```text
Skilltrx/
├── README.md                                  # Project overview, quickstart, and architecture summary
├── package.json                               # React + Vite + Tailwind CSS dependencies
├── vite.config.js                             # Vite configuration
├── tailwind.config.js                         # Tailwind configuration (Fraunces, Plus Jakarta Sans, DM Sans)
├── postcss.config.js                          # PostCSS configuration
├── index.html                                 # React entry HTML
├── src/                                       # React Dashboard Source Code
│   ├── main.jsx                               # React root mount
│   ├── index.css                              # Beige & Dark Brown theme + tabular numeral styling
│   ├── App.jsx                                # Main 4-tab Skilltrx interface (Matcher, Fairness, Performance, Splits)
│   └── skilltrxEngine.js                      # 114-skill / 23-family regex engine, header cleaner, and benchmark data
├── notebooks/                                 # Jupyter / Google Colab Notebooks & Scripts
│   ├── Skilltrx.ipynb                         # Complete 7-part PyTorch training, evaluation, and fairness notebook
│   └── part7_simulator_cell.py                # Self-healing, cached Colab Real-Time Match Simulator cell
├── docs/                                      # Project Documentation & Test Cases
│   ├── METHODOLOGY_AND_OUTCOMES.md            # Point-by-point methodology, architecture, and final outcomes
│   ├── TEST_CASES.md                          # 5 ready-to-paste test cases (Good Fit, Potential Fit, No Fit)
│   └── skilltrx_standalone_dashboard.html     # Single-file standalone HTML dashboard
├── report/                                    # Complete 28-page NNDL Project Report
│   └── Skilltrx_Project_Report.pdf
└── presentations/                             # Project Presentations
    ├── Skilltrx_Presentation.pptx
    ├── Skilltrx_Project_Presentation.pptx
    └── Skilltrx_Project_Presentation_Latest.pptx
```

---

## Running the React Dashboard Locally

1. Open a terminal in this project folder (`c:\Users\archi\OneDrive\Desktop\Skilltrx`):
   ```powershell
   npm install
   npm run dev
   ```
2. Open **http://localhost:5173/** in your browser.
3. To create a production build in `dist/`:
   ```powershell
   npm run build
   ```

---

## Headline Experimental Results

| Metric / Split | Result | Details |
| :--- | :---: | :--- |
| **Test Set (`test` · Unseen Resumes)** | **0.7555 Macro F1** (85.04% Acc) | 7,500 pairs across 66 unseen resumes (0% train overlap) |
| **Unseen Jobs Test (`jd_test` · Unseen JDs)** | **0.6346 Macro F1** (81.72% Acc) | 8,315 pairs across 28 unseen job descriptions (0% JD overlap) |
| **Gross Two-Class Error Rate** | **0.56%** (`test`) / **0.67%** (`jd_test`) | `No Fit` ↔ `Good Fit` confusion rate |
| **Expected Calibration Error (ECE)** | **0.0466** | 10-bin probability calibration on `test` |
| **Verbatim Explanation Fidelity** | **100.0%** | 94.0% of JDs have recognized requirements across 114 skills / 23 families |
| **Qualification-Matched Fairness Gaps** | **≤ 0.0100** | Evaluated on 60,884 PopResume resumes (`−0.0031` Sex, `+0.0100` API–White, `+0.0009` Black–White) |
| **Counterfactual JD-Swap Drop** | **95.4% reduction** | `Good Fit` rate drops from 69.1% to 3.2% when swapping to an unrelated JD |
