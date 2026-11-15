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
import { sanitizeSpelling, spelledRight, sayWord, hush, canSpeak, faceButton, clipFor, preloadClip, onTrack, wordsInSets, aboutWord, aboutText, isTalking } from './spelling.js';
import { canListen, createSpellMic } from './spell-mic.js';
import { UI } from '/utils/components/ui-icons.js';

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
// If MathJax arrives after a question is already showing as plain text,
// typeset that question then (the next one would otherwise be the first set).
loadMath().then((ok) => {
  if (!ok || !active || !currentQuestion) return;
  if (currentQuestion.hint && !currentQuestion.alg && !currentQuestion.math) return;
  drawMath(questionText, currentQuestion.tex || toTex(currentQuestion.text), currentQuestion.text);
});
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
/* ── Word Master ──────────────────────────────────────────────────────
   Every word you skip (and so were shown) is kept. With Word Master on, when
   the clock runs out the round does not close: the missed words come back one
   by one, and a word you skip again goes to the back of the line, until each
   has been spelled right. Your score was already handed in when the clock
   stopped (so the room's leaderboard is not held up and mastering earns no
   points); only your own results wait until you are done. */
let masterOn = false;
/* Focus mode: twice the pace, and the first wrong letter (or a skip) puts you
   out. You are handed in as out (-1), which every board leaves off. */
let focusOn = false;
let roundWords = Infinity;    // a spelling round ends early once every word has been tried
// How long the round took this player, for ranking spelling rounds on time.
let roundStartAt = 0;
let roundLimitMs = 0;
let lastTimeMs = null;
/** The time the last round took, in ms (to the end of the list, or the whole clock). */
export const lastRoundTimeMs = () => lastTimeMs;
let missed = [];              // questions skipped during the timed round
let mastering = false;        // the after-the-clock phase
let masterQueue = [];
let masterDone = Promise.resolve();
let finishMaster = () => {};
const MISS_KEY = 'ppSpellMisses';   // how often each word has been missed, across rounds
function noteMiss(q) {
  if (!missed.some((m) => m.bank === q.bank && m.i === q.i)) missed.push(q);
  try {
    const t = JSON.parse(localStorage.getItem(MISS_KEY) || '{}');
    const k = `${q.bank}:${q.i}`;
    t[k] = (t[k] || 0) + 1;
    localStorage.setItem(MISS_KEY, JSON.stringify(t));
  } catch { /* private mode: the round still works */ }
}
/** Resolves when the player has finished Word Master (at once, if there was nothing to master). */
export const masterFinished = () => masterDone;
let roundId = 0;         // a Skip timer from an old round must not move a new one on

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

/* ── Spelling ─────────────────────────────────────────────────────────
   Read out: the question is the boy's face; he says the word (tap him, or
   press Enter, to hear it again). Transcribe: the question is the word's IPA.
   Under either sits what a spelling bee lets you ask for: the definition and
   the word used in a sentence (shown with the word blanked out), each of
   which the boy will read aloud. Skip, because a word you cannot spell would
   otherwise hold you for the rest of the round: it shows the spelling,
   scores nothing, and moves on. */
const speakBtn = faceButton({
  size: 104, label: 'Hear the word again', tip: 'Hear it again (Enter)',
  onPress: (b) => { if (currentQuestion && currentQuestion.spell) sayTheWord(b); focusInput(); },
});
const talker = () => (currentQuestion && currentQuestion.spell === 'say' ? speakBtn : null);
// The word, its definition, its sentence: a Kokoro recording when there is one.
const sayTheWord = (b = speakBtn) => sayWord(currentQuestion.word, b, { clip: clipFor(currentQuestion.bank, currentQuestion.i, 'w'), ipa: currentQuestion.ipa });

const meaningEl = document.createElement('div');
meaningEl.className = 'drill-meaning';
meaningEl.hidden = true;
// A spelling bee also tells you the part of speech and where the word comes from.
const aboutEl = document.createElement('p');
aboutEl.className = 'drill-about';
const defEl = document.createElement('p');
defEl.className = 'drill-def';
const useEl = document.createElement('p');
useEl.className = 'drill-use';
meaningEl.append(aboutEl, defEl, useEl);
questionHint.after(meaningEl);

function toolBtn(cls, icon, label, onPress) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `drill-spell-btn ${cls}`;
  b.innerHTML = icon;
  b.setAttribute('aria-label', label);
  b.dataset.tip = label;
  b.addEventListener('click', (e) => { e.stopPropagation(); onPress(); focusInput(); });
  return b;
}
const spellTools = document.createElement('div');
spellTools.className = 'drill-spell-tools';
spellTools.hidden = true;
const defBtn = toolBtn('drill-hear-def', UI.book(22), 'Hear the definition', () => {
  if (currentQuestion && currentQuestion.spell) sayWord(currentQuestion.def, talker(), { rate: 0.95, clip: clipFor(currentQuestion.bank, currentQuestion.i, 'd') });
});
// What a bee also tells you when asked: the part of speech, the language, and the root.
const rootBtn = toolBtn('drill-hear-root', UI.roots(22), 'Hear the part of speech, origin and root (Alt+R)', () => {
  if (currentQuestion && currentQuestion.spell) sayWord(currentQuestion.about, talker(), { rate: 0.95, clip: clipFor(currentQuestion.bank, currentQuestion.i, 'o') });
});
rootBtn.setAttribute('aria-keyshortcuts', 'Alt+R');
const useBtn = toolBtn('drill-hear-use', UI.speech(22), 'Hear it in a sentence', () => {
  if (currentQuestion && currentQuestion.spell) sayWord(currentQuestion.use, talker(), { rate: 0.95, clip: clipFor(currentQuestion.bank, currentQuestion.i, 's') });
});
const skipBtn = toolBtn('drill-skip', UI.skip(22), 'Skip: show the spelling', () => skipWord());
/* Spell it out loud: with the mic on, the letters said ("F, O, R...") go into the
   answer as typed ones do (js/spell-mic.js). It stays on from word to word, and the
   choice is remembered on this device. */
const MIC_KEY = 'ppSpellMic';
let micWanted = false;
try { micWanted = localStorage.getItem(MIC_KEY) === '1'; } catch { /* storage blocked */ }
const heardEl = document.createElement('p');
heardEl.className = 'drill-heard';
heardEl.hidden = true;
const spellMic = createSpellMic({
  quiet: () => !isTalking(350),            // his own voice must not type
  onHeard: (items, text) => {
    if (!active || locked || !currentQuestion || !currentQuestion.spell) return;
    heardEl.textContent = items.length ? `Heard: ${text.trim()}` : `Heard "${text.trim()}". Say the letters one by one.`;
    if (!items.length) return;
    let v = inputEl.value;
    for (const it of items) v = it.back ? v.slice(0, -1) : it.clear ? '' : it.ch ? v + it.ch : v;   // "done" means nothing here
    inputEl.value = v;
    try { inputEl.setSelectionRange(v.length, v.length); } catch { /* not focusable */ }
    onInput();
  },
  onState: (on, why) => {
    micBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    micBtn.classList.toggle('is-on', on);
    heardEl.hidden = !on && !why;
    if (on) heardEl.textContent = 'Listening. Say the letters one by one.';
    else if (why === 'denied') { micWanted = false; saveMic(); heardEl.textContent = 'The microphone is blocked. Allow it in the browser to spell out loud.'; }
    else if (why === 'error') { micWanted = false; saveMic(); heardEl.textContent = 'No microphone was found.'; }
  },
});
const saveMic = () => { try { localStorage.setItem(MIC_KEY, micWanted ? '1' : '0'); } catch { /* storage blocked */ } };
const micBtn = toolBtn('drill-mic', UI.mic(22), 'Spell out loud: mic on or off (Alt+M)', () => {
  micWanted = !spellMic.on;
  saveMic();
  if (micWanted) spellMic.start(); else spellMic.stop();
});
micBtn.setAttribute('aria-pressed', 'false');
micBtn.setAttribute('aria-keyshortcuts', 'Alt+M');
micBtn.hidden = !canListen;
const toolRow = document.createElement('div');
toolRow.className = 'drill-spell-row';
toolRow.append(micBtn, rootBtn, defBtn, useBtn, skipBtn);
const revealEl = document.createElement('p');
revealEl.className = 'drill-reveal';
revealEl.hidden = true;
spellTools.append(toolRow, revealEl, heardEl);
answerStage.after(spellTools);

function skipWord() {
  if (!active || locked || !currentQuestion || !currentQuestion.spell) return;
  if (focusOn && !mastering) { dropOut(); return; }
  locked = true;
  const round = roundId;
  hush();
  revealEl.textContent = currentQuestion.word;
  revealEl.hidden = false;
  toolRow.hidden = true;
  useEl.textContent = currentQuestion.use;   // the sentence, whole, while the answer shows
  // and the root, written out now that the spelling is no secret
  aboutEl.textContent = aboutText(currentQuestion.word, currentQuestion.pos, currentQuestion.origin, true);
  if (!mastering) noteMiss(currentQuestion);
  setTimeout(() => {
    if (round !== roundId) return;   // that round is over; endRound tidied up
    revealEl.hidden = true;
    toolRow.hidden = false;
    locked = false;
    if (!active) return;
    if (mastering) { masterQueue.push(masterQueue.shift()); nextMasterWord(); return; }
    advance();
  }, 1600);
}
function renderSpelling(q) {
  questionText.classList.remove('is-long', 'is-longest');
  questionText.classList.toggle('is-ipa', q.spell === 'ipa');
  questionText.classList.toggle('is-speak', q.spell === 'say');
  if (q.spell === 'ipa') {
    questionText.textContent = q.text;
    questionText.classList.toggle('is-long', q.text.length > 16);
    questionText.classList.toggle('is-longest', q.text.length > 26);
  } else {
    questionText.replaceChildren(speakBtn);
    sayTheWord();
  }
  questionHint.textContent = q.spell === 'say' && !canSpeak
    ? 'This browser cannot speak. Choose Transcribe instead.'
    : q.hint;
  questionHint.hidden = false;
  aboutEl.textContent = aboutWord(q.pos, q.origin);
  aboutEl.hidden = !aboutEl.textContent;
  defEl.textContent = q.def;
  useEl.textContent = q.gap;
  meaningEl.hidden = false;
  rootBtn.hidden = defBtn.hidden = useBtn.hidden = !canSpeak;
  if (micWanted && canListen && !spellMic.on) spellMic.start();
  spellMic.reset();                          // letters said from now on are for this word
  spellTools.hidden = false;
  cardEl.classList.add('is-spell');          // grows to fit a long sentence instead of cropping its buttons
  answerStage.classList.add('is-spell');
  // Long words are typed in a smaller face, sized by the word itself so it does not jump as you type.
  answerStage.classList.toggle('is-long', q.word.length > 11);
  answerStage.classList.toggle('is-longest', q.word.length > 18);
  preloadClip(clipFor(q.bank, q.i, 'd'));
  preloadClip(clipFor(q.bank, q.i, 's'));
  preloadClip(clipFor(q.bank, q.i, 'o'));
  inputEl.maxLength = 40;
  inputEl.value = '';
  typedEl.textContent = '';
  if (endCursor) endCursor.style.visibility = '';
  drawnFor = '';
  caretBar.hidden = true;
  box.reset(false);
}

function renderQuestion() {
  currentQuestion = questionAt(seed, currentIndex, questionOpts);
  if (currentQuestion.spell) { renderSpelling(currentQuestion); return; }
  if (spellMic.on) spellMic.stop();
  questionText.classList.remove('is-ipa', 'is-speak');
  spellTools.hidden = true;
  meaningEl.hidden = true;
  cardEl.classList.remove('is-spell');
  answerStage.classList.remove('is-spell', 'is-long', 'is-longest');
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
  inputEl.maxLength = currentQuestion.pair ? 20 : currentQuestion.roman ? 16 : currentQuestion.subject ? 28 : currentQuestion.alg ? 24 : 7;
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

/* Simultaneous equations: "3,-2", "x=3,y=-2" or "y=-2,x=3". */
function pairCorrect(typed, ans) {
  const t = typed.replace(/\s+/g, '').toLowerCase();
  const num = '(-?\\d+(?:\\.\\d+)?)';
  const named = { x: new RegExp(`x=${num}`).exec(t), y: new RegExp(`y=${num}`).exec(t) };
  let x, y;
  if (named.x && named.y) { x = +named.x[1]; y = +named.y[1]; }
  else {
    const m = new RegExp(`^${num},${num}$`).exec(t);
    if (!m) return false;
    x = +m[1]; y = +m[2];
  }
  return x === ans.x && y === ans.y;
}

function isCorrectAnswer(typed, answer) {
  if (currentQuestion && currentQuestion.spell) return spelledRight(typed, answer);
  if (answer && answer.kind === 'pair') return pairCorrect(typed, answer);
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
  if (currentQuestion && currentQuestion.spell) return sanitizeSpelling(raw);
  if (currentQuestion && currentQuestion.pair) return raw.replace(/−/g, '-').replace(/[XY]/g, (c) => c.toLowerCase()).replace(/[^0-9xy=,.\-]/g, '').slice(0, 20);
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
/* Spelling answers are plain text, so the caret is a real element placed at
   the input's caret position, between the letters. A click on the answer puts
   the caret at the letter clicked. */
const spellCaret = document.createElement('span');
spellCaret.className = 'drill-cursor drill-spell-caret';
spellCaret.setAttribute('aria-hidden', 'true');
function drawSpellingCaret(v) {
  const at = caretAt();
  typedEl.replaceChildren(document.createTextNode(v.slice(0, at)), spellCaret, document.createTextNode(v.slice(at)));
  if (endCursor) endCursor.style.visibility = 'hidden';
  caretBar.hidden = true;
  spellCaret.style.animation = 'none'; void spellCaret.offsetWidth; spellCaret.style.animation = '';
}
function spellingOffsetAt(x, y) {
  let node = null, off = 0;
  if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); if (p) { node = p.offsetNode; off = p.offset; } }
  else if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); if (r) { node = r.startContainer; off = r.startOffset; } }
  if (!node || !typedEl.contains(node)) return null;
  const [before] = typedEl.childNodes;
  return node === before ? off : before.textContent.length + (node.nodeType === 3 ? off : 0);
}
// Any caret move in the hidden input (arrows, Home/End, held keys, selection) redraws it.
document.addEventListener('selectionchange', () => {
  if (active && currentQuestion && currentQuestion.spell && document.activeElement === inputEl && inputEl.value) renderTyped();
});

function renderTyped() {
  const v = inputEl.value;
  if (!v) { typedEl.textContent = ''; drawnFor = ''; placeCaret(); return; }
  // A spelling is letters, not maths: shown as typed, with the caret drawn
  // where it really is, so the arrow keys, Home and End move it.
  if (currentQuestion && currentQuestion.spell) { drawSpellingCaret(v); drawnFor = v; return; }
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
  if (focusOn && !mastering && currentQuestion && currentQuestion.spell && digits && !onTrack(digits, currentQuestion.word)) {
    dropOut();
    return;
  }
  checkAnswer(digits);
}

/* Focus mode: out. The word is shown, then the round closes for this player,
   who is handed in as -1 (no place on the board). */
function dropOut() {
  if (!active || locked) return;
  locked = true;
  if (rafId) cancelAnimationFrame(rafId);   // the clock stops: out is out, even at 0:00
  timeRemainingEl.textContent = 'Out';
  hush();
  const round = roundId;
  revealEl.textContent = `Out! ${currentQuestion.word}`;
  revealEl.hidden = false;
  toolRow.hidden = true;
  useEl.textContent = currentQuestion.use;
  cardEl.classList.add('is-out');
  setTimeout(() => {
    if (round !== roundId) return;
    cardEl.classList.remove('is-out');
    score = -1;
    masterOn = false;
    timeUp();
  }, 2000);
}
/** After a word is done with: the next, or the end once every word has been tried. */
function advance() {
  currentIndex += 1;
  if (currentQuestion && currentQuestion.spell && currentIndex >= roundWords) { timeUp(); return; }
  renderQuestion();
}

/* Algebra Moves writes a power as ^(2) and a cube root as root_3(…); the
   answer checks read ^2 and the root sign. */
const forChecks = (text) => text.replace(/\^\((-?\d+)\)/g, '^$1').replace(/root_3\(/g, '∛(');

function checkAnswer(digits) {
  if (locked || digits === '') return;
  if (isCorrectAnswer(digits, currentQuestion.answer)) {
    locked = true;
    if (!mastering) {
      score += 1;
      scoreNote.textContent = `${score} correct`;
    }
    cardEl.classList.add('correct-flash');
    setTimeout(() => {
      cardEl.classList.remove('correct-flash');
      locked = false;
      if (mastering) { masterQueue.shift(); nextMasterWord(); return; }
      advance();
    }, 120);
  }
}

function tick() {
  if (!active) return;
  const remainingMs = endAt - Date.now();
  if (remainingMs <= 0) {
    timeUp();
    return;
  }
  timeRemainingEl.textContent = `${Math.ceil(remainingMs / 1000)}s left`;
  rafId = requestAnimationFrame(tick);
}

/* The clock has stopped: the score is handed in now, whatever happens next. */
function timeUp() {
  if (rafId) cancelAnimationFrame(rafId);
  if (!resolveRound && !mastering && !active) return;
  if (resolveRound) lastTimeMs = Math.max(0, Math.min(Date.now() - roundStartAt, roundLimitMs));
  const finalScore = score;
  if (resolveRound) resolveRound(finalScore);
  resolveRound = null;
  if (masterOn && missed.length && finalScore >= 0) { startMaster(); return; }
  endRound();
}

function startMaster() {
  mastering = true;
  masterQueue = missed.slice();
  locked = false;
  hush();
  timerNote.textContent = 'Word Master';
  cardEl.classList.add('is-mastering');
  nextMasterWord();
}
function nextMasterWord() {
  if (!masterQueue.length) { endRound(); return; }
  const left = masterQueue.length;
  timeRemainingEl.textContent = `Round over. Master ${left === 1 ? 'the last word' : `${left} words`} you missed`;
  currentQuestion = masterQueue[0];
  renderSpelling(currentQuestion);
  focusInput();
}

function endRound() {
  active = false;
  mastering = false;
  if (spellMic.on) spellMic.stop();         // the choice is kept for the next round
  heardEl.hidden = true;
  cardEl.classList.remove('is-mastering');
  hush();
  spellTools.hidden = true;
  revealEl.hidden = true;
  toolRow.hidden = false;
  meaningEl.hidden = true;
  if (rafId) cancelAnimationFrame(rafId);
  playBd.classList.remove('open');
  playBd.setAttribute('aria-hidden', 'true');
  const finalScore = score;
  if (resolveRound) resolveRound(finalScore);
  resolveRound = null;
  finishMaster();
}

inputEl.addEventListener('input', onInput);
// Spelling: Enter says the word again (Read out). There is nothing to submit,
// because a right spelling is taken the moment its last letter goes in.
inputEl.addEventListener('keydown', (e) => {
  // Alt+R reads the part of speech, origin and root (by key position: Alt+R types ® on a Mac)
  if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyM') {
    e.preventDefault();
    if (active && currentQuestion && currentQuestion.spell && !micBtn.hidden) micBtn.click();
    return;
  }
  if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyR') {
    e.preventDefault();
    if (active && currentQuestion && currentQuestion.spell && !locked && !rootBtn.hidden) rootBtn.click();
    return;
  }
  if (e.key !== 'Enter' || !active || !currentQuestion || !currentQuestion.spell) return;
  e.preventDefault();
  if (currentQuestion.spell === 'say' && !locked) sayTheWord();
});
// arrow keys, Home and End move the caret through the answer
inputEl.addEventListener('keyup', (e) => { if (!box.on && /^(Arrow|Home|End)/.test(e.key)) renderTyped(); });
inputEl.addEventListener('select', renderTyped);
// a click on the answer puts the caret at that point in it
answerStage.addEventListener('click', (e) => {
  const v = inputEl.value;
  if (!active || !v || box.on) return;
  if (currentQuestion && currentQuestion.spell) {
    const at = spellingOffsetAt(e.clientX, e.clientY);
    inputEl.focus({ preventScroll: true });
    if (at != null) { try { inputEl.setSelectionRange(at, at); } catch { /* ignore */ } }
    renderTyped();
    return;
  }
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
export function startRound({ seed: roomSeed, timeLimit, startAt, operations, tables, fractionTypes, compounds, roster, master = false, focus = false }) {
  return new Promise((resolve) => {
    seed = roomSeed;
    questionOpts = { operations, tables, fractionTypes, compounds };
    score = 0;
    currentIndex = 0;
    locked = false;
    resolveRound = resolve;
    roundId += 1;
    masterOn = !!master && !focus;     // a Focus round has no Word Master: one slip and you are out
    focusOn = !!focus;
    roundWords = (operations || []).some((o) => /^spell/.test(o)) ? wordsInSets(tables) : Infinity;
    missed = [];
    mastering = false;
    masterQueue = [];
    masterDone = new Promise((r) => { finishMaster = r; });

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
        roundStartAt = anchorAt;
        roundLimitMs = timeLimit * 1000;
        lastTimeMs = null;
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
