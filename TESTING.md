# FitScore v2 — Testing Manual
## Zero API · Runs locally · No server needed

---

## Setup — literally one step

```bash
# Option A: Open directly in browser (simplest)
open public/index.html

# Option B: Serve with any static server (avoids rare CORS issues)
npx serve public
# → http://localhost:3000

# Option C: VS Code Live Server extension
# Right-click public/index.html → Open with Live Server
```

No `npm install`. No `.env`. No API key. Nothing.

---

## TEST 1 — App loads

**Steps:**
1. Open `public/index.html` in Chrome, Firefox, or Safari
2. Verify landing page loads with dark theme
3. Verify hero headline, 3-step section, scoring explainer card, and features all render
4. Click the moon/sun icon (top right) — toggles light mode
5. Refresh — light mode persists (localStorage)
6. Click "Try it free →" in header — goes to analyzer page
7. Click "Back" — returns to landing

**Expected:** Everything renders. No console errors.

---

## TEST 2 — Input validation

**Steps:**
1. Go to analyzer page
2. Click "Analyze resume fit" with both fields empty
3. → Error: "Please paste a job description."
4. Type only "Software engineer" in JD field, paste full resume
5. → Error: "Job description is too short..."
6. Fill JD properly, leave resume empty
7. → Error: "Please paste your resume."

**Expected:** Errors appear inline without crashing.

---

## TEST 3 — Full analysis · Fair match

**Paste this JD:**
```
Software Engineer — Frontend
Acme Corp

Requirements:
- 2+ years React and TypeScript
- Strong HTML, CSS, JavaScript fundamentals
- REST API and GraphQL experience
- Jest and React Testing Library
- CI/CD pipelines, Git workflows
- Performance optimization, WCAG accessibility
- Bonus: Next.js, Tailwind CSS
```

**Paste this resume:**
```
Jane Smith · Frontend Developer

EXPERIENCE
Frontend Developer — StartupXYZ (2022–Present)
- Built responsive pages using HTML, CSS, JavaScript
- Worked on React components for the dashboard
- Collaborated with backend team on REST API integration
- Used Git for version control

SKILLS
HTML, CSS, JavaScript, React, Git, Python

PROJECTS
- Portfolio site built with plain HTML/CSS
- Todo app in React with localStorage
```

**Expected:**
- Score: 35–58 (Fair Match or Weak Match)
- Ring color: amber
- Missing: TypeScript, GraphQL, Jest, CI/CD, Next.js, accessibility
- Matched: React, HTML, CSS, JavaScript, REST API, Git
- At least 2–3 improvement cards with original vs suggested bullets

---

## TEST 4 — Strong match scenario

**Paste this JD:**
```
React Developer
Requirements: React, TypeScript, REST API, Git, CSS, JavaScript, HTML, responsive design
```

**Paste this resume:**
```
EXPERIENCE
Senior React Developer (2021–Present)
- Built scalable React and TypeScript applications
- Designed responsive CSS layouts for mobile and desktop
- Integrated REST APIs with authentication
- Managed codebase with Git and GitHub

SKILLS
React, TypeScript, JavaScript, HTML, CSS, REST API, Git, responsive design
```

**Expected:**
- Score: 72–88 (Good Match or Strong Match)
- Ring color: green
- Few or no Critical missing skills
- "Strong Match" or "Good Match" badge

---

## TEST 5 — Poor match scenario

**JD:** Machine Learning Engineer — PhD required, PyTorch, TensorFlow, CUDA, transformer models, MLOps

**Resume:** Marketing Manager — social media, Google Analytics, PowerPoint, content strategy

**Expected:**
- Score: 3–20 (Poor Match)
- Ring color: red
- Many Critical missing skills
- Honest summary about the gap

---

## TEST 6 — Resume auto-save

**Steps:**
1. Go to analyzer, paste any resume (50+ chars)
2. Briefly see "Resume auto-saved ✓" flash below the textarea
3. Open DevTools → Application → Local Storage → check "fitscore_resume"
4. Clear the resume textarea using ✕ button
5. See "Restore saved →" appear
6. Click it — resume reappears
7. Refresh the page, go to analyzer — "Restore saved →" should be visible again

**Expected:** Resume persists across sessions.

---

## TEST 7 — Copy button

**Steps:**
1. Run any analysis that produces improvement cards
2. Click "Copy" on any improvement card
3. Button changes to "Copied!" with green check
4. Paste into a text editor — improved bullet text appears
5. Button resets after 2 seconds

**Expected:** Copy works in all modern browsers.

---

## TEST 8 — Mobile responsive

**Steps:**
1. Open DevTools → 390px width (iPhone 14)
2. Landing page: headline readable, CTA full width
3. Analyzer: two textareas stack vertically
4. Run analysis: score ring visible, skills and improvements all readable

**Expected:** Fully functional on 390px.

---

## TEST 9 — Keyboard shortcut

**Steps:**
1. On analyzer page with both fields filled
2. Press Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
3. Analysis runs immediately

---

## TEST 10 — Speed test

**Steps:**
1. Paste a long resume (500+ lines) and long JD (200+ lines)
2. Click analyze
3. Results should appear in under 200ms (it's synchronous JS in the browser)

**Expected:** Instant results regardless of text length.

---

## Accuracy notes

| What it does well | Limitations |
|---|---|
| Keyword + bigram matching | Can't understand semantics ("led" ≠ "managed" to the engine) |
| Section weighting (Required > Nice to have) | Won't detect implicit skills ("built mobile apps" → React Native) |
| Tech synonym normalization | Unusual formatting may confuse the bullet parser |
| ATS-style term frequency scoring | Improvement suggestions are templates, not AI rewrites |

**The score is most accurate when:** The JD uses explicit skill lists and the resume uses clear bullet points.

**The score may undercount when:** Your experience uses different vocabulary for the same skill (e.g. "web APIs" instead of "REST API").

**Tip for users:** If the score seems low, look at the missing skills list — if you have those skills but used different wording, add those exact keywords to your resume.
