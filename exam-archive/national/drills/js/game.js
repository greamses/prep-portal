/* ═══════════════════════════════════════════════════════
   DRILLS — round loop
   3-2-1 "get ready" beat from a shared startAt, then a forward-only,
   auto-advancing card: type the answer, no Enter needed. Timing after
   activation is entirely local (startAt/timeLimit), no further server
   dependency during play.
═══════════════════════════════════════════════════════ */
import { questionAt } from './rng.js';
import { checkAlgebra } from './algebra.js';
import { checkSubject } from './subject.js';
import { mathReady, loadMath, svgFor } from '/utils/components/workbook/mathify.js';

const $ = (id) => document.getElementById(id);

// Mirrors seeded-room.js's START_BUFFER_MS. Used only to sanity-check the
// startAt we're handed against our own clock — never to schedule anything.
const START_BUFFER_MS = 3000;

/* ── MathJax for the card ────────────────────────────────────────────
   Questions and the typed answer are plain text in the room (graded as
   text); here they are only DRAWN as maths. Until MathJax arrives (or if it
   never does) the plain text shows. */
loadMath();
const SUPS = { '²': '2', '³': '3', '⁴': '4' };
function toTex(t) {
  return t
    .replace(/⁴√(\d+)/g, '\\sqrt[4]{$1}')
    .replace(/∛(\d+)/g, '\\sqrt[3]{$1}')
    .replace(/√(\d+)/g, '\\sqrt{$1}')
    .replace(/(\d+|x)([²³⁴])/g, (_, n, e) => `${n}^{${SUPS[e]}}`)
    .replace(/(\d+|x)⁄(\d+)/g, '\\tfrac{$1}{$2}')
    .replace(/([0-9A-F?]+)([₀-₉]+)/g, (_, d, u) => `${d === '?' ? '\\square ' : `\\mathrm{${d}}`}_{${[...u].map((c) => c.charCodeAt(0) - 0x2080).join('')}}`)
    .replace(/°/g, '^{\\circ}')
    .replace(/\b(sin|cos|tan)\b/g, '\\$1 ')
    .replace(/−/g, '-').replace(/×/g, '\\times ').replace(/÷/g, '\\div ');
}
function typedTex(t) {
  if (currentQuestion && currentQuestion.base) return `\\mathrm{${t}}`;
  if (currentQuestion && (currentQuestion.alg || currentQuestion.subject)) {
    return t.replace(/\*/g, '').replace(/\^(\d+)/g, '^{$1}').replace(/\^$/, '').replace(/-/g, '-');
  }
  const m = /^(-?)(\d+)\/(\d*)$/.exec(t);
  if (m) return `${m[1]}\\tfrac{${m[2]}}{${m[3] || '\\square'}}`;
  return t.replace(/\/$/, '');
}
// Draw `tex` into `el`; falls back to `plain` text if MathJax isn't up.
function drawMath(el, tex, plain) {
  if (tex && mathReady()) {
    try {
      // svgFor carries its own glyph outlines (the page's shared font cache
      // would leave a cloned formula an empty box).
      const made = svgFor(tex);
      const svg = made && made.cloneNode(true);
      if (svg) { svg.setAttribute('aria-label', plain); el.replaceChildren(svg); return; }
    } catch { /* fall through to text */ }
  }
  el.textContent = plain;
}

const playBd = $('drill-play-bd');
const cardEl = $('drill-card');
const countdownEl = $('drill-countdown');
const rosterEl = $('drill-roster');
const timeRemainingEl = $('drill-time-remaining');
const questionText = $('drill-question-text');
const questionHint = $('drill-question-hint');
const answerStage = $('drill-answer-stage');
const typedEl = $('drill-typed');
const inputEl = $('drill-answer-input');
const scoreNote = $('drill-score-note');
const timerNote = $('drill-timer-note');

let active = false;
let locked = false;
let seed = 0;
let questionOpts = { operations: ['multiply', 'divide'], tables: undefined, fractionTypes: undefined, compounds: undefined };
let currentIndex = 0;
let currentQuestion = null;
let score = 0;
let endAt = 0;
let rafId = null;
let resolveRound = null;

function focusInput() {
  if (active) inputEl.focus({ preventScroll: true });
}

// The room-entry animation: everyone in the room (you, other real players,
// bots with real names) pops in one at a time during the "get ready" beat.
function renderRoster(roster) {
  rosterEl.innerHTML = '';
  roster.forEach((p, i) => {
    const pill = document.createElement('span');
    pill.className = `pp-roster-item${p.isSelf ? ' is-self' : ''}`;
    pill.style.setProperty('--delay', `${i * 90}ms`);
    pill.textContent = p.isSelf ? `${p.name} (You)` : p.name;
    rosterEl.appendChild(pill);
  });
  rosterEl.hidden = false;
}

function renderQuestion() {
  currentQuestion = questionAt(seed, currentIndex, questionOpts);
  // Chemistry formulas are not maths notation — only the rest is typeset.
  if (currentQuestion.hint && !currentQuestion.alg && !currentQuestion.math) questionText.textContent = currentQuestion.text;
  else drawMath(questionText, currentQuestion.tex || toTex(currentQuestion.text), currentQuestion.text);
  // A chemical formula is far longer than "7 × 8" — step the display size
  // down so C₆H₅CH₃ and CH₃CH₂CH₂CH₂OH still fit the card on a phone.
  questionText.classList.toggle('is-long', currentQuestion.text.length > 7);
  questionText.classList.toggle('is-longest', currentQuestion.text.length > 12);
  // Chemistry rides with the mass bracket the exam paper would print; every
  // other question type has no hint and the line collapses.
  questionHint.textContent = currentQuestion.hint || '';
  questionHint.hidden = !currentQuestion.hint;
  inputEl.maxLength = currentQuestion.subject ? 28 : currentQuestion.alg ? 24 : 7;
  inputEl.value = '';
  typedEl.textContent = '';
}

// Fraction answers ("3/8") are graded as an exact string match — typed with
// a plain "/" (display-only text uses the Unicode fraction slash instead).
// Plain-number answers stay parse-tolerant (e.g. forgives a leading zero),
// same as before fractions existed — but parseFloat, not parseInt, because
// a relative molecular mass is often a half (NaCl = 58.5, Cl being 35.5).
function isCorrectAnswer(typed, answer) {
  if (answer && typeof answer === 'object') return answer.kind === 'subject' ? checkSubject(typed, answer) : checkAlgebra(typed, answer);
  if (currentQuestion && currentQuestion.base) return typed.toUpperCase().replace(/^0+(?=.)/, '') === answer;
  if (typeof answer === 'number') {
    const n = parseFloat(typed);
    return Number.isFinite(n) && Math.abs(n - answer) < 1e-9;
  }
  return typed === answer;
}

// Strip to digits plus at most one "/" and at most one "." — neither of
// which can lead. Everything else a question ever answers with is digits.
function sanitizeTyped(raw) {
  if (currentQuestion && currentQuestion.subject) return raw.replace(/−/g, '-').replace(/[^0-9A-Za-z=^()+\-*/.√∛π]/g, '').slice(0, 28);
  if (currentQuestion && currentQuestion.base) return raw.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 10);
  if (currentQuestion && currentQuestion.alg) return raw.replace(/−/g, '-').replace(/X/g, 'x').replace(/[^0-9x^()+\-*]/g, '').slice(0, 24);
  // A leading "-" is kept (integer answers can be negative); any other is dropped.
  const neg = raw.trimStart().startsWith('-') || raw.trimStart().startsWith('−');
  let s = raw.replace(/[^0-9/.]/g, '');
  for (const mark of ['/', '.']) {
    const at = s.indexOf(mark);
    if (at !== -1) s = s.slice(0, at + 1) + s.slice(at + 1).split(mark).join('');
  }
  if (s.startsWith('/') || s.startsWith('.')) s = s.slice(1);
  return (neg ? '-' : '') + s.slice(0, 7);
}

function onInput() {
  if (!active) return;
  const digits = sanitizeTyped(inputEl.value);
  inputEl.value = digits;
  drawMath(typedEl, digits ? typedTex(digits) : '', digits);
  if (locked || digits === '') return;
  if (isCorrectAnswer(digits, currentQuestion.answer)) {
    locked = true;
    score += 1;
    scoreNote.textContent = `${score} correct`;
    cardEl.classList.add('correct-flash');
    setTimeout(() => {
      cardEl.classList.remove('correct-flash');
      locked = false;
      currentIndex += 1;
      renderQuestion();
    }, 120);
  }
}

function tick() {
  if (!active) return;
  const remainingMs = endAt - Date.now();
  if (remainingMs <= 0) {
    endRound();
    return;
  }
  timeRemainingEl.textContent = `${Math.ceil(remainingMs / 1000)}s left`;
  rafId = requestAnimationFrame(tick);
}

function endRound() {
  active = false;
  if (rafId) cancelAnimationFrame(rafId);
  playBd.classList.remove('open');
  playBd.setAttribute('aria-hidden', 'true');
  const finalScore = score;
  if (resolveRound) resolveRound(finalScore);
  resolveRound = null;
}

inputEl.addEventListener('input', onInput);
inputEl.addEventListener('blur', focusInput);
cardEl.addEventListener('click', focusInput);

// Resolves with the player's final correct-answer count once the local
// timer hits zero.
export function startRound({ seed: roomSeed, timeLimit, startAt, operations, tables, fractionTypes, compounds, roster }) {
  return new Promise((resolve) => {
    seed = roomSeed;
    questionOpts = { operations, tables, fractionTypes, compounds };
    score = 0;
    currentIndex = 0;
    locked = false;
    resolveRound = resolve;

    scoreNote.textContent = '0 correct';
    timerNote.textContent = `${timeLimit}s round`;
    cardEl.hidden = false;
    countdownEl.hidden = false;
    questionText.hidden = true;
    questionHint.hidden = true;
    answerStage.hidden = true;
    timeRemainingEl.textContent = '';
    if (roster) renderRoster(roster);

    playBd.classList.add('open');
    playBd.setAttribute('aria-hidden', 'false');
    // Game mode: the nav goes away. A round is timed and full-screen — a stray
    // click on the menu mid-round costs the player the round.
    document.body.classList.add('drill-nav-hidden');
    active = true;

    // startAt is the ACTIVATOR's local clock (their Date.now() + a "get ready"
    // buffer), and we schedule against our OWN Date.now() — which only agrees if
    // the two devices share a wall clock. A phone whose clock is minutes off
    // would compute an endAt already behind it: the countdown clears, tick()
    // sees no time left, and the player is dumped onto the results screen
    // without playing. So trust startAt only when it lands in the plausible
    // window; otherwise anchor the round to THIS device's clock, so a skewed
    // player still gets a full round — offset in wall-clock from the others,
    // which the leaderboard's grace window tolerates.
    const lead = startAt - Date.now();
    const anchorAt = (lead > -2000 && lead <= START_BUFFER_MS + 2000)
      ? startAt
      : Date.now() + 800;

    (function tickCountdown() {
      const msLeft = anchorAt - Date.now();
      if (msLeft <= 0) {
        countdownEl.hidden = true;
        rosterEl.hidden = true;
        questionText.hidden = false;
        answerStage.hidden = false;
        endAt = anchorAt + timeLimit * 1000;
        renderQuestion();
        focusInput();
        rafId = requestAnimationFrame(tick);
        return;
      }
      countdownEl.textContent = Math.ceil(msLeft / 1000);
      setTimeout(tickCountdown, 100);
    })();
  });
}
