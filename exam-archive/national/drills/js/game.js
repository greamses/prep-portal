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
import { typedToTex, plainToTex } from './typed-tex.js';
import { createBoxInput } from './box-input.js';
import { mathReady, loadMath, svgFor } from '/utils/components/workbook/mathify.js';

const $ = (id) => document.getElementById(id);

// Mirrors seeded-room.js's START_BUFFER_MS. Used only to sanity-check the
// startAt we're handed against our own clock — never to schedule anything.
const START_BUFFER_MS = 3000;

/* ── MathJax for the card ────────────────────────────────────────────
   Questions and the typed answer are plain text in the room (graded as
   text); here they are only DRAWN as maths. Until MathJax arrives (or if it
   never does) the plain text shows. */
// The typed answer is tagged piece by piece with \class{dc-FROM-TO}{…} so the
// caret can be measured onto it; \class is MathJax's html extension, loaded
// up front (an autoload in the middle of a synchronous tex2svg would fail).
if (!window.MathJax) {
  window.MathJax = {
    loader: { load: ['[tex]/html'] },
    tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']], packages: { '[+]': ['html'] } },
    svg: { fontCache: 'global', scale: 1.0 },
    startup: { typeset: false },
  };
}
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
/* The typed answer with the caret inside it at `at` (TeX). The algebra
   parser places the caret itself; for the plain answers it is just spliced in. */
function typedTex(t) {
  if (currentQuestion && (currentQuestion.alg || currentQuestion.subject)) {
    return typedToTex(t); // "/" stacks into a fraction as it is typed
  }
  return plainToTex(t, !!(currentQuestion && currentQuestion.roman));
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
  inputEl.maxLength = currentQuestion.roman ? 16 : currentQuestion.subject ? 28 : currentQuestion.alg ? 24 : 7;
  inputEl.value = '';
  typedEl.textContent = '';
  if (endCursor) endCursor.style.visibility = ''; // the caret starts at the end again
  drawnFor = '';
  caretBar.hidden = true;
  box.reset(!!(currentQuestion.alg || currentQuestion.subject));
}

// Fraction answers ("3/8") are graded as an exact string match — typed with
// a plain "/" (display-only text uses the Unicode fraction slash instead).
// Plain-number answers stay parse-tolerant (e.g. forgives a leading zero),
// same as before fractions existed — but parseFloat, not parseInt, because
// a relative molecular mass is often a half (NaCl = 58.5, Cl being 35.5).
/* Phone keyboards offer ² and ³ as keys, and some give a modifier ˆ or a
   full-width ＾ for ^. Read them all as a typed power BEFORE anything is
   stripped: dropping the ² would turn 2x² + 7x − 4 into 2x2 + 7x − 4, which
   is a different expression and is marked wrong. */
function powers(raw) {
  return raw.replace(/²/g, '^2').replace(/³/g, '^3').replace(/[ˆ＾]/g, '^').replace(/×/g, '*');
}

function isCorrectAnswer(typed, answer) {
  if (answer && typeof answer === 'object') return answer.kind === 'subject' ? checkSubject(typed, answer) : checkAlgebra(typed, answer);
  if (currentQuestion && currentQuestion.roman) return typed.toUpperCase() === answer;
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
  if (currentQuestion && currentQuestion.roman) return raw.toUpperCase().replace(/[^IVXLCDM]/g, '').slice(0, 16);
  if (currentQuestion && currentQuestion.subject) return powers(raw).replace(/−/g, '-').replace(/[^0-9A-Za-z=^()+\-*/.√∛π]/g, '').slice(0, 28);
  if (currentQuestion && currentQuestion.base) return raw.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 10);
  if (currentQuestion && currentQuestion.alg) return powers(raw).replace(/−/g, '-').replace(/X/g, 'x').replace(/[^0-9x^()+\-*]/g, '').slice(0, 24);
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

/* Draw the typed answer with the caret where the hidden input's selection
   is: the blinking bar at the end, or a coloured bar inside the answer. */
const endCursor = answerStage.querySelector('.drill-cursor');
function caretAt() {
  const v = inputEl.value;
  const c = inputEl.selectionStart;
  return c == null || c > v.length ? v.length : c;
}
/* ── The caret, drawn ON the answer (the Algebra Moves way) ──────────────
   The typeset answer is never changed to show the caret. Each piece of it
   carries the span of the line it came from; anchorsOf() reads where those
   pieces landed, caretFor(k) finds where offset k sits among them, and a bar
   is placed there over the drawing. */
const caretBar = document.createElement('span');
caretBar.className = 'drill-caret-bar';
caretBar.hidden = true;
answerStage.appendChild(caretBar);

function anchorsOf() {
  const host = answerStage.getBoundingClientRect();
  const out = [];
  typedEl.querySelectorAll('[class*="dc-"]').forEach((el) => {
    const m = /dc-(\d+)-(\d+)/.exec(el.getAttribute('class') || '');
    if (!m) return;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    out.push({ from: +m[1], to: +m[2], left: r.left - host.left, right: r.right - host.left, top: r.top - host.top, h: r.height, w: r.width });
  });
  return out;
}
function caretFor(k, anchors) {
  // inside one piece (between the 2 and the 0 of 20): walk across its own box
  for (const a of anchors) {
    if (a.to - a.from > 1 && k > a.from && k < a.to) {
      return { x: a.left + ((k - a.from) / (a.to - a.from)) * (a.right - a.left), top: a.top, h: a.h };
    }
  }
  // otherwise beside the nearest edge of the nearest piece; ties go to the smallest
  let best = null;
  for (const a of anchors) {
    for (const [at, x] of [[a.from, a.left], [a.to, a.right]]) {
      const d = Math.abs(at - k);
      if (!best || d < best.d || (d === best.d && a.w < best.w)) best = { d, x, top: a.top, h: a.h, w: a.w };
    }
  }
  return best;
}
function placeCaret() {
  const v = inputEl.value;
  const svg = typedEl.querySelector('svg');
  const anchors = v && svg ? anchorsOf() : [];
  if (!anchors.length) {           // nothing typed, or plain text: the old cursor at the end
    caretBar.hidden = true;
    if (endCursor) endCursor.style.visibility = '';
    return;
  }
  const spot = caretFor(caretAt(), anchors);
  if (!spot) return;
  if (endCursor) endCursor.style.visibility = 'hidden';
  const h = Math.max(spot.h, 24);
  caretBar.style.left = `${spot.x - 1.5}px`;
  caretBar.style.top = `${spot.top + spot.h / 2 - h / 2}px`;
  caretBar.style.height = `${h}px`;
  caretBar.hidden = false;
  // restart the blink so the caret is visible the moment it moves
  caretBar.style.animation = 'none'; void caretBar.offsetWidth; caretBar.style.animation = '';
}

let drawnFor = null;               // the typed line the drawing shows

// Algebra and Change-of-Subject answers are typed into Algebra Moves' boxes.
const box = createBoxInput({
  inputEl, typedEl, stageEl: answerStage, endCursor,
  draw: (el, tex, plain) => drawMath(el, tex, plain),
  onChange: (text) => { if (active) checkAnswer(forChecks(text)); },
});
function renderTyped() {
  const v = inputEl.value;
  if (!v) { typedEl.textContent = ''; drawnFor = ''; placeCaret(); return; }
  // re-typeset only when the answer itself changed, never for a caret move
  if (v !== drawnFor) { drawMath(typedEl, typedTex(v), v); drawnFor = v; }
  placeCaret();
}

function onInput() {
  if (!active || box.on) return;
  const raw = inputEl.value;
  const at = inputEl.selectionStart == null ? raw.length : inputEl.selectionStart;
  const digits = sanitizeTyped(raw);
  inputEl.value = digits;
  // keep the caret where the player was typing (sanitising rewrites the value)
  const keep = Math.min(digits.length, sanitizeTyped(raw.slice(0, at)).length);
  try { inputEl.setSelectionRange(keep, keep); } catch { /* not focusable yet */ }
  renderTyped();
  checkAnswer(digits);
}

/* Algebra Moves writes a power as ^(2) and a cube root as root_3(…); the
   answer checks read ^2 and the root sign. */
const forChecks = (text) => text.replace(/\^\((-?\d+)\)/g, '^$1').replace(/root_3\(/g, '∛(');

function checkAnswer(digits) {
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
// arrow keys, Home and End move the caret through the answer
inputEl.addEventListener('keyup', (e) => { if (!box.on && /^(Arrow|Home|End)/.test(e.key)) renderTyped(); });
inputEl.addEventListener('select', renderTyped);
// a click on the answer puts the caret at that point in it
answerStage.addEventListener('click', (e) => {
  const v = inputEl.value;
  if (!active || !v || box.on) return;
  const anchors = anchorsOf();
  let idx = v.length;
  if (anchors.length) {
    // nearest edge, measured on the piece's own line first and along it second,
    // or a tap in a numerator lands in the denominator under it (Algebra Moves)
    const host = answerStage.getBoundingClientRect();
    const x = e.clientX - host.left, y = e.clientY - host.top;
    let best = null;
    for (const a of anchors) {
      const dy = Math.max(0, a.top - y, y - (a.top + a.h));
      for (const [at, ex] of [[a.from, a.left], [a.to, a.right]]) {
        const d = Math.hypot(ex - x, dy * 2.2);
        if (!best || d < best.d || (d === best.d && a.w < best.w)) best = { d, at, w: a.w };
      }
      // inside a many-figure piece, the nearest gap between its figures
      if (a.to - a.from > 1 && x > a.left && x < a.right && !dy) {
        const at = a.from + Math.round(((x - a.left) / (a.right - a.left)) * (a.to - a.from));
        best = { d: -1, at, w: 0 };
      }
    }
    idx = best ? best.at : v.length;
  }
  inputEl.focus({ preventScroll: true });
  try { inputEl.setSelectionRange(idx, idx); } catch { /* ignore */ }
  placeCaret();
});
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
