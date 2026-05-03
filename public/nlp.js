/* ====================================================
   FitScore Engine — nlp.js
   Pure client-side resume vs JD matcher.
   Zero API calls. Zero dependencies.
   Runs entirely in the browser.
   ==================================================== */

const FitScoreNLP = (() => {

  // ── STOPWORDS ───────────────────────────────────────
  // Common English words that carry no signal for matching
  const STOPWORDS = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with',
    'by','from','up','about','into','through','during','is','are','was',
    'were','be','been','being','have','has','had','do','does','did','will',
    'would','could','should','may','might','shall','can','need','dare',
    'ought','used','i','me','my','we','our','you','your','he','she','it',
    'they','them','their','this','that','these','those','which','who',
    'whom','what','where','when','why','how','all','each','every','both',
    'few','more','most','other','some','such','no','not','only','own',
    'same','so','than','too','very','just','as','if','then','because',
    'while','although','though','since','unless','until','whether',
    'also','well','must','its','any','s','t','re','ll','ve','d','m',
    'across','after','before','between','following','including','like',
    'looking','per','using','via','within','without','work','working',
    'ability','strong','excellent','good','great','high','new','large',
    'small','best','various','multiple','different','general','full',
    'role','position','team','company','job','candidate','preferred',
    'required','requirements','responsibilities','duties','tasks',
    'plus','bonus','nice','ideal','related','relevant'
  ]);

  // ── TECH SYNONYMS ────────────────────────────────────
  // Map variants to canonical forms so "node" matches "node.js"
  const SYNONYMS = {
    'nodejs': 'node.js', 'node': 'node.js',
    'reactjs': 'react', 'react.js': 'react',
    'vuejs': 'vue', 'vue.js': 'vue',
    'angularjs': 'angular',
    'postgres': 'postgresql', 'psql': 'postgresql',
    'mongo': 'mongodb',
    'k8s': 'kubernetes',
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'ml': 'machine learning',
    'ai': 'artificial intelligence',
    'ui': 'user interface',
    'ux': 'user experience',
    'api': 'api',
    'rest': 'rest api', 'restful': 'rest api',
    'graphql': 'graphql',
    'aws': 'aws', 'amazon web services': 'aws',
    'gcp': 'google cloud', 'google cloud platform': 'google cloud',
    'azure': 'azure',
    'ci/cd': 'ci cd', 'cicd': 'ci cd',
    'css3': 'css', 'html5': 'html',
    'es6': 'javascript', 'es2015': 'javascript',
    'agile': 'agile', 'scrum': 'agile scrum',
    'oop': 'object oriented',
    'sql': 'sql', 'mysql': 'sql mysql',
    'nosql': 'nosql',
    'git': 'git', 'github': 'git github', 'gitlab': 'git gitlab',
    'docker': 'docker',
    'linux': 'linux unix', 'unix': 'linux unix',
    'vscode': 'vs code', 'visual studio code': 'vs code',
  };

  // ── SECTION WEIGHT PATTERNS ───────────────────────────
  // Terms found near these patterns in the JD get extra weight
  const HIGH_WEIGHT_PATTERNS = [
    /required|must.have|essential|mandatory|minimum|you (will|must|should|have)/i,
    /\d\+?\s*years?\s*(of\s*)?(experience|exp)/i,
    /key\s+(skills?|requirements?|qualifications?)/i,
    /what\s+you('ll|'ll|'ll| will)?\s+bring/i,
    /qualifications?/i,
  ];

  const LOW_WEIGHT_PATTERNS = [
    /nice.to.have|bonus|preferred|plus|desirable|advantage|ideal/i,
    /what we offer|benefits|perks|compensation|salary/i,
    /about (us|the company|the team)/i,
  ];

  // ── TOKENIZER ────────────────────────────────────────
  function tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[''`]/g, '')           // smart quotes
      .replace(/[^a-z0-9.\-+#/\s]/g, ' ') // keep tech chars like C++, C#, .NET
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(t => t.length > 1 && !STOPWORDS.has(t));
  }

  // Normalize a single token through the synonym map
  function normalize(token) {
    return SYNONYMS[token] || token;
  }

  // Extract unigrams + bigrams from text, normalized
  function extractTerms(text) {
    const tokens = tokenize(text);
    const terms = new Map(); // term → count

    // Unigrams
    tokens.forEach(t => {
      const norm = normalize(t);
      if (norm) {
        norm.split(' ').forEach(part => {
          if (!STOPWORDS.has(part) && part.length > 1) {
            terms.set(part, (terms.get(part) || 0) + 1);
          }
        });
      }
    });

    // Bigrams (two-word phrases) — very valuable for tech skills
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i+1]}`;
      const norm = normalize(bigram);
      if (!STOPWORDS.has(tokens[i]) && !STOPWORDS.has(tokens[i+1])) {
        terms.set(norm, (terms.get(norm) || 0) + 1);
      }
    }

    return terms;
  }

  // ── SECTION PARSER ────────────────────────────────────
  // Splits JD into sections and assigns weights
  function parseJDSections(jdText) {
    const lines = jdText.split('\n').filter(l => l.trim().length > 0);
    const sections = [];
    let currentWeight = 1.0;
    let currentLines = [];

    lines.forEach(line => {
      const trimmed = line.trim();

      // Check if this line changes the weight context
      const isHighSection = HIGH_WEIGHT_PATTERNS.some(p => p.test(trimmed));
      const isLowSection  = LOW_WEIGHT_PATTERNS.some(p => p.test(trimmed));

      if (isHighSection) {
        if (currentLines.length) sections.push({ text: currentLines.join(' '), weight: currentWeight });
        currentWeight = 2.0;
        currentLines = [trimmed];
      } else if (isLowSection) {
        if (currentLines.length) sections.push({ text: currentLines.join(' '), weight: currentWeight });
        currentWeight = 0.5;
        currentLines = [trimmed];
      } else {
        currentLines.push(trimmed);
      }
    });

    if (currentLines.length) sections.push({ text: currentLines.join(' '), weight: currentWeight });
    return sections;
  }

  // Build a weighted term map from the JD
  function buildJDTermMap(jdText) {
    const sections = parseJDSections(jdText);
    const termMap = new Map(); // term → weighted score

    sections.forEach(({ text, weight }) => {
      const terms = extractTerms(text);
      terms.forEach((count, term) => {
        const current = termMap.get(term) || 0;
        termMap.set(term, current + count * weight);
      });
    });

    return termMap;
  }

  // ── RESUME BULLET PARSER ──────────────────────────────
  function parseBullets(resumeText) {
    const lines = resumeText.split('\n');
    const bullets = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      // A bullet is a line that starts with common bullet indicators OR
      // is a substantial sentence (50+ chars likely to be an achievement)
      if (
        /^[•\-\*\→\▪\◦\–—]/.test(trimmed) ||
        (trimmed.length > 45 && /^[A-Z]/.test(trimmed) && !/^(education|experience|skills|projects|certifications|summary|objective|work|employment)/i.test(trimmed))
      ) {
        const cleaned = trimmed.replace(/^[•\-\*\→\▪\◦\–—\s]+/, '').trim();
        if (cleaned.length > 20) bullets.push(cleaned);
      }
    });

    return bullets;
  }

  // ── SKILLS SECTION EXTRACTOR ──────────────────────────
  function extractSkillsSection(resumeText) {
    const lines = resumeText.split('\n');
    let inSkills = false;
    let skillLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^skills?(\s*[:\-])?$/i.test(line) || /^(technical\s+)?skills?$/i.test(line)) {
        inSkills = true;
        continue;
      }
      if (inSkills) {
        // Stop at next section header (all caps or title-case short line)
        if (line.length < 40 && /^[A-Z]/.test(line) && !line.includes(',') && i > 0) {
          break;
        }
        if (line.length > 0) skillLines.push(line);
        if (skillLines.length > 8) break;
      }
    }

    return skillLines.join(' ');
  }

  // ── IMPROVEMENT SUGGESTIONS ───────────────────────────
  // Rule-based: find which bullets could mention high-value missing terms
  function generateImprovements(bullets, missingTerms, jdText) {
    const improvements = [];
    const topMissing = missingTerms.slice(0, 8).map(m => m.term);

    // For each bullet, check if it's a candidate for improvement
    const scoredBullets = bullets.map(bullet => {
      const bulletTerms = extractTerms(bullet);
      // A bullet is a candidate if it already has some technical content
      const techWords = [...bulletTerms.keys()].filter(t =>
        !STOPWORDS.has(t) && t.length > 2
      ).length;
      return { bullet, techWords };
    })
    .filter(b => b.techWords >= 2)
    .sort((a, b) => b.techWords - a.techWords)
    .slice(0, 5);

    // Match missing terms to bullets by context similarity
    scoredBullets.forEach(({ bullet }, idx) => {
      const bulletLower = bullet.toLowerCase();

      // Find relevant missing terms for this bullet
      const relevantMissing = topMissing.filter(term => {
        // Don't suggest completely unrelated terms
        const termParts = term.split(' ');
        const hasContext = termParts.some(part =>
          bulletLower.includes(part.slice(0, 4)) // prefix match
        );
        return hasContext || idx < 2; // always improve first 2 bullets
      }).slice(0, 2);

      if (relevantMissing.length === 0 && idx >= 2) return;

      // Generate improved version
      const improved = improvedBullet(bullet, relevantMissing, jdText);
      if (improved && improved !== bullet) {
        improvements.push({
          original: bullet,
          improved,
          addedTerms: relevantMissing,
          reason: relevantMissing.length > 0
            ? `Consider adding: ${relevantMissing.join(', ')}`
            : 'Strengthened with action verbs and specificity',
        });
      }
    });

    // If we didn't get 3 improvements from bullets, add generic ones
    while (improvements.length < 3 && bullets.length > improvements.length) {
      const unused = bullets.find(b => !improvements.find(i => i.original === b));
      if (!unused) break;
      const improved = improvedBullet(unused, topMissing.slice(0, 1), jdText);
      if (improved && improved !== unused) {
        improvements.push({
          original: unused,
          improved,
          addedTerms: [],
          reason: 'Reframed with stronger impact language',
        });
      } else break;
    }

    return improvements.slice(0, 5);
  }

  // Rule-based bullet improvement (no AI — uses templates)
  function improvedBullet(bullet, missingTerms, jdText) {
    let improved = bullet;

    // 1. Strengthen weak opening verbs
    const weakVerbs = {
      'worked on': 'Developed',
      'helped with': 'Contributed to',
      'was responsible for': 'Led',
      'did': 'Executed',
      'made': 'Built',
      'fixed': 'Resolved',
      'did work on': 'Implemented',
      'worked with': 'Collaborated on',
      'helped': 'Supported',
      'was part of': 'Contributed to',
      'participated in': 'Actively contributed to',
      'involved in': 'Delivered',
    };

    Object.entries(weakVerbs).forEach(([weak, strong]) => {
      const regex = new RegExp(`^${weak}\\b`, 'i');
      improved = improved.replace(regex, strong);
    });

    // 2. Ensure starts with capital action verb
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);

    // 3. Append missing terms contextually
    if (missingTerms.length > 0 && !improved.endsWith('.')) {
      const termStr = missingTerms.map(t => t).join(' and ');

      // Don't add if term already present
      const alreadyHas = missingTerms.every(t =>
        improved.toLowerCase().includes(t.toLowerCase())
      );

      if (!alreadyHas) {
        if (improved.includes(' using ') || improved.includes(' with ')) {
          improved = improved + `, ${termStr}`;
        } else {
          improved = improved + ` using ${termStr}`;
        }
      }
    }

    // 4. If no quantification exists, suggest adding it with [X]
    if (
      !/\d/.test(improved) &&
      improved.length < 120 &&
      /team|product|feature|system|application|service|project/i.test(improved)
    ) {
      improved = improved.replace(
        /(team|product|feature|system|application|service|project)/i,
        '$1 [add: quantify impact, e.g. "serving 10K users" or "reducing load time by 30%"]'
      );
    }

    return improved === bullet ? null : improved;
  }

  // ── MAIN ANALYSIS FUNCTION ────────────────────────────
  function analyze(resumeText, jdText) {
    if (!resumeText || !jdText) throw new Error('Both inputs required');

    // 1. Build term maps
    const jdTermMap     = buildJDTermMap(jdText);
    const resumeTerms   = extractTerms(resumeText + ' ' + extractSkillsSection(resumeText));

    // 2. Calculate match score
    let totalJDWeight = 0;
    let matchedWeight = 0;
    const matchedTerms = [];
    const missingTerms = [];

    // Only consider JD terms with meaningful weight (filter noise)
    const significantJDTerms = [...jdTermMap.entries()]
      .filter(([term, weight]) => weight >= 0.8 && term.length > 2)
      .sort((a, b) => b[1] - a[1]);

    significantJDTerms.forEach(([term, weight]) => {
      totalJDWeight += weight;

      // Check if term (or close variant) is in resume
      const resumeHas = resumeTerms.has(term) ||
        // check if any resume term starts with this term (prefix match for plurals etc.)
        [...resumeTerms.keys()].some(rt =>
          rt === term ||
          (term.length > 4 && (rt.startsWith(term.slice(0, -1)) || term.startsWith(rt.slice(0, -1))))
        );

      if (resumeHas) {
        matchedWeight += weight;
        if (matchedTerms.length < 10) {
          // Clean up display: remove technical noise, capitalize
          const display = term.replace(/\b\w/g, c => c.toUpperCase());
          if (!matchedTerms.includes(display)) matchedTerms.push(display);
        }
      } else {
        missingTerms.push({
          term: term.replace(/\b\w/g, c => c.toUpperCase()),
          rawTerm: term,
          weight,
          importance: weight >= 3 ? 'Critical' : weight >= 1.5 ? 'Important' : 'Nice to have',
        });
      }
    });

    // 3. Compute raw score
    const rawScore = totalJDWeight > 0 ? (matchedWeight / totalJDWeight) * 100 : 0;

    // 4. Apply calibration curve so scores feel honest
    // Raw keyword match of 50% → score ~55 (not 50)
    // Very low match penalised, very high given small boost
    let score;
    if (rawScore >= 80) score = Math.round(75 + (rawScore - 80) * 0.5); // 80–100 raw → 75–85
    else if (rawScore >= 60) score = Math.round(58 + (rawScore - 60) * 0.85); // 60–80 raw → 58–75
    else if (rawScore >= 40) score = Math.round(38 + (rawScore - 40) * 1.0); // 40–60 raw → 38–58
    else if (rawScore >= 20) score = Math.round(18 + (rawScore - 20) * 1.0); // 20–40 raw → 18–38
    else score = Math.round(rawScore * 0.9);

    score = Math.min(92, Math.max(3, score));

    // 5. Label
    let scoreLabel, scoreSummary;
    if (score >= 75) {
      scoreLabel = 'Strong Match';
      scoreSummary = 'Your resume has strong keyword alignment with this role. Focus on quantifying your impact and make sure every bullet directly ties to the job requirements.';
    } else if (score >= 55) {
      scoreLabel = 'Good Match';
      scoreSummary = 'Solid foundation — you cover the core requirements. Closing the gap on the missing skills (even briefly mentioning them in context) could meaningfully improve your shortlist chances.';
    } else if (score >= 35) {
      scoreLabel = 'Fair Match';
      scoreSummary = 'You have relevant experience but the resume isn\'t speaking the same language as the JD. Add the missing keywords in context, not just as a skills list.';
    } else if (score >= 18) {
      scoreLabel = 'Weak Match';
      scoreSummary = 'There is a significant gap between your resume and this role. Consider whether you have experience that isn\'t captured in your current resume — or if this role is a stretch target.';
    } else {
      scoreLabel = 'Poor Match';
      scoreSummary = 'Your current resume has very little overlap with this job description. This may be a career pivot role, or your resume may need a significant rewrite to surface relevant experience.';
    }

    // 6. Score reason (one liner)
    const matchPct = Math.round((matchedTerms.length / Math.max(significantJDTerms.length, 1)) * 100);
    const topMissing = missingTerms.slice(0, 3).map(m => m.term).join(', ');
    const scoreReason = matchedTerms.length > 0
      ? `Matched ${matchedTerms.length} of ${Math.min(significantJDTerms.length, 25)} key terms.${topMissing ? ` Top gaps: ${topMissing}.` : ''}`
      : 'No significant keyword overlap detected between resume and job description.';

    // 7. Bullet improvements
    const bullets = parseBullets(resumeText);
    const improvements = generateImprovements(bullets, missingTerms, jdText);

    // 8. Deduplicate and limit lists
    const finalMissing = missingTerms
      .filter((m, i, arr) => arr.findIndex(x => x.term === m.term) === i)
      .slice(0, 10);

    const finalMatched = [...new Set(matchedTerms)].slice(0, 10);

    return {
      score,
      scoreLabel,
      scoreReason,
      summary: scoreSummary,
      matchedSkills: finalMatched,
      missingSkills: finalMissing,
      improvements,
      meta: {
        jdTermsAnalyzed: significantJDTerms.length,
        resumeTermsFound: resumeTerms.size,
        rawScore: Math.round(rawScore),
      },
    };
  }

  // Public API
  return { analyze };

})();
