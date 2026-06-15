/* ═══════════════════════════════════════════════════════════
   PREP PORTAL — Local Question Bank Manifest
   ───────────────────────────────────────────────────────────
   Hand-curated past-question files we host ourselves, indexed by
   board → subject → year → type. When a learner picks one of these
   years, the quiz engine loads OUR file; every other year falls
   back to the ALOC API (Firestore-backed /api/questions).

   Notes
   • `subject` keys use the SAME keys ALOC uses (mathematics, english,
     physics, chemistry, …) so the builder and loader can match either
     source with one key.
   • `path` is relative to exam-archive/national/ (works from both the
     builder page and the question page, which sit one level under it).
   • `varName` is the top-level binding each file declares — they are
     inconsistent (`examQuestions`, `quizData`, `chemistryObjective`,
     `chemistryTheory`), so the loader reads the named binding instead
     of guessing. `count` is the question total, shown on the chip.
   ═══════════════════════════════════════════════════════════ */

'use strict';

window.LOCAL_QUESTION_BANK = {
  waec: {
    mathematics: {
      '2020': { objective: { path: '../waec/math/math-2020.js', varName: 'examQuestions', count: 61 } },
      '2021': { objective: { path: '../waec/math/math-2021.js', varName: 'quizData',     count: 48 } },
    },
    english: {
      '2021': { objective: { path: '../waec/english/english-2021.js', varName: 'examQuestions', count: 147 } },
    },
    physics: {
      '2020': { objective: { path: '../waec/physics/physics-2020.js', varName: 'examQuestions', count: 95 } },
    },
    chemistry: {
      '2024': { objective: { path: '../waec/chemistry/chemistry-2024.js', varName: 'chemistryObjective', count: 50 } },
      '2023': { theory:    { path: '../waec/chemistry/chemistry-2023.js', varName: 'chemistryTheory',    count: 5 } },
    },
  },
  jamb: {
    chemistry: {
      '2024': { objective: { path: '../jamb/chemistry/chemistry-2024.js', varName: 'examQuestions', count: 50 } },
    },
  },
};

// Labels for any subject the local bank carries but ALOC's facets might not
// return — keeps the builder chips human-readable. Falls back to ALOC's own
// labels when present.
window.LOCAL_SUBJECT_LABELS = {
  mathematics: 'Mathematics', english: 'English Language',
  physics: 'Physics', chemistry: 'Chemistry', biology: 'Biology',
};

/* ── Helpers shared by the builder (data.js) and loader (quiz-engine.js) ──
   Kept on window so both classic-script pages can use them. */

// Board key (waec/neco/jamb) from a UI exam id ("WAEC", "JAMB", …).
window.localBoardKey = function (examId) {
  return String(examId || '').toLowerCase().trim();
};

// All local entries for a board+subject, as [{ year, type, entry }].
window.localEntries = function (board, subjectKey) {
  const subj = (window.LOCAL_QUESTION_BANK[board] || {})[subjectKey] || {};
  const out = [];
  for (const year of Object.keys(subj)) {
    for (const type of Object.keys(subj[year])) {
      out.push({ year, type, entry: subj[year][type] });
    }
  }
  return out;
};

// Does a local file exist for this exact board/subject/year/type?
window.hasLocal = function (board, subjectKey, year, type) {
  return !!(((window.LOCAL_QUESTION_BANK[board] || {})[subjectKey] || {})[year] || {})[type];
};
