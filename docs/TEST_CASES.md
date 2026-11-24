# Skilltrx — 5 Ready-to-Use Test Cases (Resume + Job Description)

Paste any of these 5 pairs into the **Resume Matcher** tab and click **Analyze Match** to test **Good Fit**, **Potential Fit**, and **No Fit** predictions alongside verbatim and family-level skill explanations.

---

## Test Case 1: Strong Technical Alignment → Expected: `Good Fit`
*(Showcases high requirement coverage + partial match where `Flask` covers `Django` in the `web` family)*

### Candidate Resume
```text
Professional SummarySenior Backend Software Engineer with 6+ years of experience building scalable REST API microservices in Python and Flask. Designed high-availability relational databases using PostgreSQL and MySQL. Managed containerized production deployments using Docker, Kubernetes, and CI/CD pipelines on AWS and Linux.
EducationB.Tech in Computer Science
Technical Skills
• Python, SQL, Flask, REST API
• PostgreSQL, MySQL
• AWS, Docker, Kubernetes, Git, Jenkins, Linux
```

### Job Description (JD)
```text
We are hiring a Senior Python Backend Developer. Requirements: Bachelor's degree in Computer Science, 5+ years of experience in Python, Django, REST API design, and PostgreSQL. Must have hands-on experience deploying cloud applications on AWS using Docker, Kubernetes, Git, and CI/CD pipelines.
```

---

## Test Case 2: Business Intelligence & Data Analytics → Expected: `Good Fit`
*(Showcases glued header cleaning like `SummaryResults-driven` and `EducationB.Sc.` + exact BI/Data matches)*

### Candidate Resume
```text
SummaryResults-driven Data Analyst with 4 years of experience turning financial and operational data into actionable insights. Built automated ETL data warehousing pipelines on Snowflake and designed executive dashboards in Tableau, Power BI, and Excel (VLOOKUP, Pivot Table). Strong foundation in SQL, Python, and statistical analysis.
EducationB.Sc. in Statistics and Data Science
Skills: Python, SQL, Tableau, Power BI, ETL, Snowflake, Statistics, Excel
```

### Job Description (JD)
```text
Hiring a Business Intelligence Data Analyst. Candidates must hold a Bachelor's degree and have 3+ years of experience with SQL, Python, ETL, and Data Warehousing. Proven ability to build interactive reports in Tableau or Power BI and perform statistical analysis in Excel is required.
```

---

## Test Case 3: Transferable / Sibling Skills (ML & Cloud) → Expected: `Potential Fit`
*(Showcases **Related Partial Matches**: candidate has `TensorFlow`/`Keras` instead of `PyTorch`, `GCP` instead of `AWS`, and `MySQL` instead of `PostgreSQL`)*

### Candidate Resume
```text
Professional SummaryMachine Learning Engineer with 3 years of experience developing NLP and deep learning models using Python, TensorFlow, Keras, and scikit-learn. Built data processing workflows with MySQL and deployed containerized services on Google Cloud (GCP) using Git and Linux.
EducationM.Tech in Artificial Intelligence
```

### Job Description (JD)
```text
Looking for an Applied Machine Learning Engineer. Requirements: Master's degree, strong proficiency in Python, Deep Learning, NLP, and Computer Vision. Must have production experience with PyTorch, PostgreSQL, AWS cloud infrastructure, Docker, and Kubernetes.
```

---

## Test Case 4: Same Domain, Junior / Missing Core Certifications → Expected: `Potential Fit`
*(Showcases an Accounting candidate who matches core accounting/Excel skills, gets a partial ERP match via `SAP` for `Oracle ERP`, but is missing `CPA`, `Auditing`, and `Tax`)*

### Candidate Resume
```text
SummaryJunior Accountant with 2 years of experience managing accounts payable, accounts receivable, and general ledger reconciliations. Assisted senior finance team with monthly financial reporting, budgeting, and forecasting using SAP and Microsoft Excel.
EducationB.Com / Bachelor's degree in Accounting and Finance
```

### Job Description (JD)
```text
Seeking a Senior Corporate Accountant & Auditor. Requirements: Bachelor's degree in Accounting, active CPA certification, and 5+ years of experience in accounting, financial reporting, GAAP/IFRS compliance, external auditing, corporate taxation, Oracle ERP, and advanced Excel.
```

---

## Test Case 5: Cross-Domain Mismatch (Healthcare Nurse vs. Full-Stack Web JD) → Expected: `No Fit`
*(Showcases 0% requirement coverage and clear `No Fit` decision when a Registered Nurse applies to a Full-Stack React/Node.js role)*

### Candidate Resume
```text
Professional ProfileCompassionate Registered Nurse with 5 years of clinical experience in hospital acute patient care, medication administration, and care planning. Certified in BLS and ACLS. Experienced in documenting patient histories using Epic Electronic Health Records (EHR/EMR) and coordinating multidisciplinary clinical teams.
EducationBachelor of Science in Nursing
```

### Job Description (JD)
```text
Full-Stack Software Engineer needed. Requirements: Bachelor's degree in Computer Science, 3+ years building web applications using JavaScript, TypeScript, React, Node.js, and HTML/CSS. Experience with MongoDB, SQL, Docker, and Agile/Scrum project management with Jira is required.
```
