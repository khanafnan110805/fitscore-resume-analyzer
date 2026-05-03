/* ====================================================
   FitScore v2 — script.js
   All UI logic. Calls FitScoreNLP.analyze() locally.
   Zero API calls. Zero server needed.
   ==================================================== */

const LS_RESUME = 'fitscore_resume';
const LS_THEME  = 'fitscore_theme';
let currentPage = 'landing';

// ── INIT ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCharCounts();
  checkForSavedResume();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
});

// ── ROUTING ─────────────────────────────────────────
function showPage(page) {
  currentPage = page;
  document.getElementById('landingPage').style.display   = page === 'landing'  ? '' : 'none';
  document.getElementById('analyzerPage').style.display  = page === 'analyzer' ? '' : 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (page === 'analyzer') checkForSavedResume();
}

// ── THEME ────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem(LS_THEME);
  const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (!isDark) { document.body.classList.add('light'); toggleThemeIcons(false); }
}
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem(LS_THEME, isLight ? 'light' : 'dark');
  toggleThemeIcons(!isLight);
}
function toggleThemeIcons(isDark) {
  document.getElementById('moonIcon').style.display = isDark ? '' : 'none';
  document.getElementById('sunIcon').style.display  = isDark ? 'none' : '';
}

// ── CHAR COUNTS + AUTO-SAVE ──────────────────────────
function initCharCounts() {
  const jd     = document.getElementById('jobDesc');
  const resume = document.getElementById('resumeText');

  jd.addEventListener('input', () => {
    document.getElementById('jdCount').textContent = `${jd.value.length.toLocaleString()} characters`;
  });

  resume.addEventListener('input', () => {
    updateResumeCount();
    if (resume.value.trim().length > 50) {
      localStorage.setItem(LS_RESUME, resume.value);
      flashSaveNote();
    }
  });
}

function updateResumeCount() {
  const resume = document.getElementById('resumeText');
  const countEl = document.getElementById('resumeCount');
  const restoreBtn = document.getElementById('restoreBtn');
  const saved = localStorage.getItem(LS_RESUME);
  const len = resume.value.length;

  if (saved && saved !== resume.value && len === 0) {
    countEl.innerHTML = `0 characters · `;
    restoreBtn.style.display = 'inline';
  } else {
    countEl.textContent = `${len.toLocaleString()} characters`;
    restoreBtn.style.display = 'none';
  }
}

function flashSaveNote() {
  const el = document.getElementById('saveNote');
  el.textContent = 'Resume auto-saved ✓';
  clearTimeout(window._snTimer);
  window._snTimer = setTimeout(() => { el.textContent = ''; }, 1800);
}

function checkForSavedResume() {
  const saved = localStorage.getItem(LS_RESUME);
  const resume = document.getElementById('resumeText');
  const restoreBtn = document.getElementById('restoreBtn');
  if (saved && !resume.value) restoreBtn.style.display = 'inline';
}

function restoreSaved() {
  const saved = localStorage.getItem(LS_RESUME);
  if (saved) {
    document.getElementById('resumeText').value = saved;
    updateResumeCount();
    document.getElementById('restoreBtn').style.display = 'none';
  }
}

function clearField(id) {
  document.getElementById(id).value = '';
  if (id === 'resumeText') updateResumeCount();
  if (id === 'jobDesc') document.getElementById('jdCount').textContent = '0 characters';
}

function scrollToInputs() {
  document.getElementById('jobDesc').scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('jobDesc').focus();
}

// ── RUN ANALYSIS ─────────────────────────────────────
function runAnalysis() {
  const jd     = document.getElementById('jobDesc').value.trim();
  const resume = document.getElementById('resumeText').value.trim();

  // Validate
  hideError();
  if (!jd) { showError('Please paste a job description.'); document.getElementById('jobDesc').focus(); return; }
  if (!resume) { showError('Please paste your resume.'); document.getElementById('resumeText').focus(); return; }
  if (jd.length < 80) { showError('Job description is too short — paste the full JD for accurate results.'); return; }
  if (resume.length < 80) { showError('Resume is too short — paste your complete resume text.'); return; }

  // Save resume
  localStorage.setItem(LS_RESUME, resume);

  // Disable button
  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  btn.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      style="animation:spin .7s linear infinite">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    Analyzing...`;

  // Hide previous results
  document.getElementById('resultsSection').style.display = 'none';

  // Run the NLP engine (synchronous — use setTimeout to allow UI repaint)
  setTimeout(() => {
    try {
      const result = FitScoreNLP.analyze(resume, jd);
      renderResults(result);

      // Re-enable button
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Re-analyze`;

      // Show results + scroll
      document.getElementById('resultsSection').style.display = 'block';
      setTimeout(() => {
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);

    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Analyze resume fit`;
      showError(err.message || 'Analysis failed. Please check your inputs and try again.');
    }
  }, 30);
}

// ── RENDER RESULTS ────────────────────────────────────
function renderResults(data) {
  renderScore(data.score, data.scoreLabel, data.scoreReason);
  renderSummary(data.summary, data.meta);
  renderMatchedSkills(data.matchedSkills || []);
  renderMissingSkills(data.missingSkills || []);
  renderImprovements(data.improvements || []);
}

function renderScore(score, label, reason) {
  const numEl    = document.getElementById('scoreNumber');
  const ringFill = document.getElementById('scoreRingFill');
  const badge    = document.getElementById('scoreLabelBadge');
  const reasonEl = document.getElementById('scoreReason');

  // Animate number
  let current = 0;
  const step = Math.max(1, Math.ceil(score / 35));
  const t = setInterval(() => {
    current = Math.min(current + step, score);
    numEl.textContent = current;
    if (current >= score) clearInterval(t);
  }, 22);

  // Animate ring (circumference = 2π×50 = 314.16)
  const offset = 314.16 - (score / 100) * 314.16;
  setTimeout(() => { ringFill.style.strokeDashoffset = offset; }, 60);

  // Ring color
  let color = '#ef4444';
  if (score >= 75) color = '#22c55e';
  else if (score >= 45) color = '#f59e0b';
  ringFill.style.stroke = color;

  // Badge
  const cls = { 'Poor Match':'poor','Weak Match':'weak','Fair Match':'fair','Good Match':'good','Strong Match':'strong' };
  badge.textContent = label;
  badge.className = `score-label-badge ${cls[label] || 'fair'}`;
  reasonEl.textContent = reason;
}

function renderSummary(text, meta) {
  document.getElementById('summaryText').textContent = text;
  const metaRow = document.getElementById('metaRow');
  if (meta) {
    metaRow.innerHTML = `
      <span class="meta-chip">${meta.jdTermsAnalyzed} JD terms analyzed</span>
      <span class="meta-chip">${meta.resumeTermsFound} resume terms found</span>
    `;
  }
}

function renderMatchedSkills(skills) {
  const c = document.getElementById('matchedSkillsTags');
  if (!skills.length) {
    c.innerHTML = `<span style="font-family:var(--font-m);font-size:12px;color:var(--text-3)">No matched terms detected</span>`;
    return;
  }
  c.innerHTML = skills.map(s => `<span class="skill-tag">${esc(s)}</span>`).join('');
}

function renderMissingSkills(skills) {
  const c = document.getElementById('missingSkillsList');
  if (!skills.length) {
    c.innerHTML = `<span style="font-family:var(--font-m);font-size:12px;color:var(--text-3)">No missing skills detected — strong match!</span>`;
    return;
  }
  c.innerHTML = skills.map(item => {
    const imp = (item.importance || '').toLowerCase();
    const cls = imp.includes('critical') ? 'critical' : imp.includes('important') ? 'important' : 'nice';
    const label = imp.includes('critical') ? 'Critical' : imp.includes('important') ? 'Important' : 'Nice to have';
    return `
      <div class="missing-skill-row">
        <span class="missing-skill-name">${esc(item.term || item)}</span>
        <span class="importance-badge ${cls}">${label}</span>
      </div>`;
  }).join('');
}

function renderImprovements(improvements) {
  const c = document.getElementById('improvementsList');
  if (!improvements.length) {
    c.innerHTML = `
      <div style="padding:18px;border:1px solid var(--border);border-radius:8px;font-family:var(--font-m);font-size:12px;color:var(--text-3)">
        No specific bullet improvements found. Make sure your resume contains bullet points or achievement statements.
      </div>`;
    return;
  }
  c.innerHTML = improvements.map((item, i) => `
    <div class="improvement-card">
      <div class="improvement-header">
        <span class="improvement-index">BULLET ${String(i+1).padStart(2,'0')}</span>
        <button class="copy-btn" onclick="copyText(this, ${JSON.stringify(esc(item.improved || ''))})"
          data-improved="${escAttr(item.improved || '')}">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy
        </button>
      </div>
      <div class="improvement-body">
        <div class="bullet-col">
          <p class="bullet-col-label original">Original</p>
          <p class="bullet-text">${esc(item.original || '—')}</p>
        </div>
        <div class="bullet-col">
          <p class="bullet-col-label improved">Suggested</p>
          <p class="bullet-text improved-text">${esc(item.improved || '—')}</p>
        </div>
      </div>
      ${item.reason ? `
      <div class="improvement-reason">
        <span>→</span>${esc(item.reason)}
      </div>` : ''}
    </div>
  `).join('');
}

// ── COPY ─────────────────────────────────────────────
function copyText(btn, _ignored) {
  const text = btn.getAttribute('data-improved');
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
    }, 2000);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
}

// ── ERROR HELPERS ─────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('errorState');
  document.getElementById('errorMsg').textContent = msg;
  el.style.display = 'flex';
}
function hideError() {
  document.getElementById('errorState').style.display = 'none';
}

// ── UTILS ─────────────────────────────────────────────
function esc(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#039;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── KEYBOARD ─────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && currentPage === 'analyzer') {
    runAnalysis();
  }
});
