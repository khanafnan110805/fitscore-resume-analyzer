# ⚡ FitScore — Resume Match Analyzer

**Built for clarity, not guesswork.**

FitScore is a lightweight web application that analyzes how well a resume matches a job description. It simulates **Applicant Tracking System (ATS)** behavior using a deterministic NLP engine — no APIs, no backend, no hidden logic.

---

## 🧠 Problem

Most job seekers assume:

> “I meet the requirements, so my resume should pass.”

In reality, resumes are filtered by **keyword matching systems (ATS)** before reaching recruiters.

- Missing keywords → rejection  
- Weak phrasing → ignored  
- Generic resumes → low match  

---

## 💡 Solution

FitScore transforms raw input into:

- 📊 **Match Score (0–100)**
- ⚠️ **Missing Skills (prioritized)**
- ✅ **Matched Skills**
- ✍️ **Improved Resume Bullet Suggestions**
- 🧠 **Clear summary of alignment**

All instantly — no login, no API, no delay.

---

## 📸 Preview

### Landing Page
![Landing Page]([./screenshots/landing.png](https://github.com/khanafnan110805/fitscore-resume-analyzer/blob/main/screenshots/landingpage.png))

### Analysis Result
![Analysis Result]([./screenshots/result.png](https://github.com/khanafnan110805/fitscore-resume-analyzer/blob/main/screenshots/Resultpage.png))

---

## ⚙️ Features

- 🔍 **ATS-style scoring engine**  
- 📊 **Weighted keyword + phrase matching**  
- 🧠 **Custom rule-based NLP engine**  
- ⚠️ **Missing skills with priority levels**  
- ✍️ **Bullet point improvement suggestions**  
- 💾 **Auto-save using localStorage**  
- 🌗 **Dark / light mode toggle**  
- 📱 **Fully responsive design**  
- ⚡ **Instant analysis (<200ms)**  

---

## 🧠 How It Works

FitScore uses a **deterministic NLP pipeline** to simulate ATS evaluation.

### 1. Text Processing
- Tokenization (unigrams + bigrams)
- Stopword removal
- Synonym normalization  
  (`js → javascript`, `node → node.js`)

---

### 2. Job Description Weighting
- Required / Must-have → **high weight**
- Nice-to-have → **low weight**

---

### 3. Matching Algorithm
- Resume terms matched against weighted JD terms  
- Score = matched weight / total weight  

---

### 4. Skill Classification
- Matched skills extracted  
- Missing skills categorized:
  - Critical  
  - Important  
  - Nice to have  

---

### 5. Resume Improvement Engine
- Extracts bullet points  
- Strengthens weak verbs  
- Injects missing keywords  

---

## 🛠️ Tech Stack

- **HTML5** — structure  
- **CSS3 / Tailwind** — styling & layout  
- **JavaScript (Vanilla)** — logic & interactivity  
- **LocalStorage** — client-side persistence  

---

## 📂 Project Structure
fitscore/
│
├── public/
│ ├── index.html # UI & layout
│ ├── script.js # UI logic & rendering
│ ├── nlp.js # Core NLP engine
│ └── style.css # Design system
│
└── TESTING.md # Manual test scenarios

## 🚀 How to Run

1. Clone the repository:

   ```bash
   git clone https://github.com/khanafnan110805/fitscore-resume-analyzer.git
   ```

2. Open the project:

   * Navigate to the `public` folder
   * Open `index.html` in your browser

**OR**

3. Run a local server:

   ```bash
   npx serve public
   ```

## 📌 Note

This project focuses on system design, practical problem-solving, and deterministic logic rather than relying on external APIs or black-box AI systems.
