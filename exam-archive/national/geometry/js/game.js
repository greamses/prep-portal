/* ═══════════════════════════════════════════════════════
   GEOMETRY — round loop
   3-2-1 "get ready" beat from a shared startAt, then a forward-only,
   auto-advancing card: an SVG diagram + a typed answer, no Enter needed.
   Every question here carries a diagram (unlike Drills, where geometry is
   one category among several), so the figure is always shown. Timing after
   activation is entirely local (startAt/timeLimit), no further server
   dependency during play. Same shell as Drills' js/game.js.
═══════════════════════════════════════════════════════ */
import { questionAt } from './rng.js';
import { buildShapeSvg } from './geo-svg.js';

const $ = (id) => document.getElementById(id);

// Mirrors seeded-room.js's START_BUFFER_MS. Used only to sanity-check the
// startAt we're handed against our own clock — never to schedule anything.
const START_BUFFER_MS = 3000;

const playBd = $('geo-play-bd');
const cardEl = $('geo-card');
const countdownEl = $('geo-countdown');
const rosterEl = $('geo-roster');
const timeRemainingEl = $('geo-time-remaining');
const geoFigureEl = $('geo-figure');
const questionText = $('geo-question-text');
const answerStage = $('geo-answer-stage');
const typedEl = $('geo-typed');
const inputEl = $('geo-answer-input');
const scoreNote = $('geo-score-note');
const timerNote = $('geo-timer-note');

let active = false;
let locked = false;
let seed = 0;
let questionOpts = {};
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
    pill.className = `geo-roster-item${p.isSelf ? ' is-self' : ''}`;
    pill.style.setProperty('--delay', `${i * 90}ms`);
    pill.textContent = p.isSelf ? `${p.name} (You)` : p.name;
    rosterEl.appendChild(pill);
  });
  rosterEl.hidden = false;
}

function renderQuestion() {
  currentQuestion = questionAt(seed, currentIndex, questionOpts);
  questionText.textContent = currentQuestion.text;
  inputEl.value = '';
  typedEl.textContent = '';
  geoFigureEl.innerHTML = buildShapeSvg(currentQuestion.geo);
}

// Fraction answers ("64/3") are graded as an exact string match — typed
// with a plain "/". Plain-number answers (every triangle/rectangle/square,
// and most circle/semicircle/quadrant) stay parseInt-tolerant.
function isCorrectAnswer(typed, answer) {
  if (typeof answer === 'number') return typed !== '' && parseInt(typed, 10) === answer;
  return typed === answer;
}

// Strip to digits + at most one "/", which can't lead.
function sanitizeTyped(raw) {
  let s = raw.replace(/[^0-9/]/g, '');
  const slash = s.indexOf('/');
  if (slash !== -1) s = s.slice(0, slash + 1) + s.slice(slash + 1).replace(/\//g, '');
  if (s.startsWith('/')) s = s.slice(1);
  return s.slice(0, 7);
}

function onInput() {
  if (!active) return;
  const digits = sanitizeTyped(inputEl.value);
  inputEl.value = digits;
  typedEl.textContent = digits;
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
export function startRound({ seed: roomSeed, timeLimit, startAt, shapes, given, lengths, roster }) {
  return new Promise((resolve) => {
    seed = roomSeed;
    questionOpts = { shapes, given, lengths };
    score = 0;
    currentIndex = 0;
    locked = false;
    resolveRound = resolve;

    scoreNote.textContent = '0 correct';
    timerNote.textContent = `${timeLimit}s round`;
    cardEl.hidden = false;
    countdownEl.hidden = false;
    geoFigureEl.innerHTML = '';
    // The face goes landscape on desktop (figure | question+answer); during the
    // countdown only the number should show, so hide the figure with the Q&A.
    geoFigureEl.hidden = true;
    questionText.hidden = true;
    answerStage.hidden = true;
    timeRemainingEl.textContent = '';
    if (roster) renderRoster(roster);

    playBd.classList.add('open');
    playBd.setAttribute('aria-hidden', 'false');
    // Game mode: the nav goes away. A round is timed and full-screen — a stray
    // click on the menu mid-round costs the player the round.
    document.body.classList.add('geo-nav-hidden');
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
        geoFigureEl.hidden = false;
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
