/* ── LAWS — a study set, not a timed game ────────────────────────────────
   Pick a subject; read every named law in plain words; flip the WHOLE set
   between its statements and its formulas with one toggle. Formulas are TeX,
   typeset by MathJax (loaded from the page). Laws with no single formula keep
   showing their statement in the Formulas view, tagged so it's clear why. */
import { SUBJECTS } from '/data/laws/laws.js';

const $ = (id) => document.getElementById(id);
const subjectsEl = $('laws-subjects');
const gridEl = $('laws-grid');
const stmtBtn = $('laws-view-statements');
const formBtn = $('laws-view-formulas');

const SUBJECT_KEY = 'lawsSubject';
const VIEW_KEY = 'lawsView'; // 'statements' | 'formulas'

let activeSubject =
  localStorage.getItem(SUBJECT_KEY) &&
  SUBJECTS.some((s) => s.key === localStorage.getItem(SUBJECT_KEY))
    ? localStorage.getItem(SUBJECT_KEY)
    : SUBJECTS[0].key;
let view = localStorage.getItem(VIEW_KEY) === 'formulas' ? 'formulas' : 'statements';

// ── MathJax: the CDN script loads async, so gate every typeset on it. ──
let mjReady = null;
function whenMathJax() {
  if (mjReady) return mjReady;
  mjReady = new Promise((resolve) => {
    (function check() {
      if (window.MathJax?.startup?.promise) window.MathJax.startup.promise.then(resolve);
      else setTimeout(check, 40);
    })();
  });
  return mjReady;
}
async function typesetGrid() {
  await whenMathJax();
  try {
    await window.MathJax.typesetPromise([gridEl]);
  } catch {
    /* a single bad formula shouldn't blank the page — leave its raw TeX */
  }
}

// ── Subject tabs ──
function renderSubjects() {
  subjectsEl.innerHTML = '';
  for (const s of SUBJECTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pp-pill laws-subject${s.key === activeSubject ? ' is-active' : ''}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', s.key === activeSubject ? 'true' : 'false');
    btn.textContent = s.label;
    btn.addEventListener('click', () => {
      if (activeSubject === s.key) return;
      activeSubject = s.key;
      localStorage.setItem(SUBJECT_KEY, s.key);
      renderSubjects();
      renderGrid();
    });
    subjectsEl.appendChild(btn);
  }
}

// ── Cards ──
function renderGrid() {
  // Drop MathJax's references to the outgoing SVGs before we replace them.
  if (window.MathJax?.typesetClear) {
    try { window.MathJax.typesetClear([gridEl]); } catch { /* not ready yet */ }
  }

  const subject = SUBJECTS.find((s) => s.key === activeSubject) || SUBJECTS[0];
  gridEl.innerHTML = '';

  for (const law of subject.laws) {
    const hasFormula = !!law.formula;

    const card = document.createElement('article');
    card.className = 'law-card pp-receipt';
    card.dataset.hasformula = String(hasFormula);

    const paper = document.createElement('div');
    paper.className = 'law-card-paper pp-receipt__paper';

    const name = document.createElement('h3');
    name.className = 'law-name';
    name.textContent = law.name;
    paper.appendChild(name);

    const statement = document.createElement('p');
    statement.className = 'law-statement';
    statement.textContent = law.statement;
    paper.appendChild(statement);

    if (hasFormula) {
      const formula = document.createElement('div');
      formula.className = 'law-formula';

      const math = document.createElement('div');
      math.className = 'law-formula-math';
      // Display math delimiters — see the MathJax config in index.html.
      math.textContent = `\\[ ${law.formula} \\]`;
      formula.appendChild(math);

      if (law.where) {
        const where = document.createElement('p');
        where.className = 'law-where';
        where.textContent = law.where;
        formula.appendChild(where);
      }
      paper.appendChild(formula);
    } else {
      const tag = document.createElement('span');
      tag.className = 'law-noformula pp-sticky pp-sticky--tape pp-sticky--c2';
      tag.textContent = 'No single formula';
      paper.appendChild(tag);
    }

    // The person the law is named after — a byline pinned to the card's foot.
    if (law.scientist) {
      const by = document.createElement('div');
      by.className = 'law-by';
      by.innerHTML =
        '<svg class="law-by-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" ' +
        'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-6.2 8-6.2s8 2.2 8 6.2" /></svg>' +
        `<span class="law-by-name"></span>`;
      by.querySelector('.law-by-name').textContent = law.scientist;
      paper.appendChild(by);
    }

    card.appendChild(paper);
    gridEl.appendChild(card);
  }

  applyView();
  typesetGrid();
}

// ── Statements ⇄ Formulas (whole set at once) ──
function applyView() {
  const showFormulas = view === 'formulas';
  gridEl.classList.toggle('show-formulas', showFormulas);
  stmtBtn.classList.toggle('is-active', !showFormulas);
  formBtn.classList.toggle('is-active', showFormulas);
  stmtBtn.setAttribute('aria-pressed', String(!showFormulas));
  formBtn.setAttribute('aria-pressed', String(showFormulas));
}

function setView(next) {
  if (view === next) return;
  view = next;
  localStorage.setItem(VIEW_KEY, next);
  applyView();
}

stmtBtn.addEventListener('click', () => setView('statements'));
formBtn.addEventListener('click', () => setView('formulas'));

renderSubjects();
renderGrid();
