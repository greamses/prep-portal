/* ═══════════════════════════════════════════════════════
   VOCAB — the A-Z hangman round
   A 3-2-1 "get ready" beat off the shared startAt, then a march through the
   alphabet: for each letter, a clue and a word starting with it. The letter
   itself is given (revealed everywhere it appears); you guess the rest one
   letter at a time, and six wrong guesses hang you and cost you the word.

   Score is words SOLVED. Timing after activation is entirely local
   (startAt/timeLimit) — no further server dependency during play.
═══════════════════════════════════════════════════════ */
import { wordAt, roundLetters, isGuessable, hiddenLetters, MAX_WRONG } from './rng.js';

const $ = (id) => document.getElementById(id);
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const playBd = $('vocab-play-bd');
const cardEl = $('vocab-card');
const countdownEl = $('vocab-countdown');
const rosterEl = $('vocab-roster');
const timeRemainingEl = $('vocab-time-remaining');
const boardEl = $('vocab-board');
const clueEl = $('vocab-clue');
const wordEl = $('vocab-word');
const stepEl = $('vocab-step');
const livesEl = $('vocab-lives');
const verdictEl = $('vocab-verdict');
const keyboardEl = $('vocab-keyboard');
const scoreNote = $('vocab-score-note');
const timerNote = $('vocab-timer-note');
const gallowsParts = [...document.querySelectorAll('#vocab-gallows [data-part]')];

let active = false;   // the round is running (clock ticking)
let acceptingGuesses = false; // …and the board is live (not mid-verdict, not out of words)
let seed = 0;
let opts = { subject: 'science', grade: 5 };
let letters = [];
let index = 0;
let current = null;
const revealed = new Set(); // letters shown on the board
const guessed = new Set();  // every key already pressed this word
let wrong = 0;
let score = 0;
let endAt = 0;
let rafId = null;
let nextTimer = null;
let resolveRound = null;

// The room-entry animation: everyone in the room (you, other real players,
// bots with real names) pops in one at a time during the "get ready" beat.
function renderRoster(roster) {
  rosterEl.innerHTML = '';
  roster.forEach((p, i) => {
    const pill = document.createElement('span');
    pill.className = `vocab-roster-item${p.isSelf ? ' is-self' : ''}`;
    pill.style.setProperty('--delay', `${i * 90}ms`);
    pill.textContent = p.isSelf ? `${p.name} (You)` : p.name;
    rosterEl.appendChild(pill);
  });
  rosterEl.hidden = false;
}

function buildKeyboard() {
  keyboardEl.innerHTML = '';
  ALPHABET.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pp-sticky pp-sticky--tape vocab-key pp-sticky--c${i % 6}`;
    btn.dataset.key = ch;
    btn.textContent = ch;
    btn.addEventListener('click', () => guess(ch));
    keyboardEl.appendChild(btn);
  });
}

const keyEl = (ch) => keyboardEl.querySelector(`[data-key="${ch}"]`);

function renderWord() {
  wordEl.innerHTML = '';
  [...current.word.toUpperCase()].forEach((ch) => {
    const slot = document.createElement('span');
    if (!isGuessable(ch)) {
      // Scenery ("x-ray"'s hyphen) — always shown, never guessed.
      slot.className = 'vocab-slot vocab-slot--fixed';
      slot.textContent = ch;
    } else if (revealed.has(ch)) {
      slot.className = 'vocab-slot is-filled';
      slot.textContent = ch;
    } else {
      slot.className = 'vocab-slot';
      slot.textContent = '';
    }
    wordEl.appendChild(slot);
  });
}

function renderLives() {
  livesEl.innerHTML = '';
  for (let i = 0; i < MAX_WRONG; i++) {
    const pip = document.createElement('span');
    pip.className = `vocab-life${i < MAX_WRONG - wrong ? '' : ' is-lost'}`;
    livesEl.appendChild(pip);
  }
  gallowsParts.forEach((el, i) => el.classList.toggle('is-shown', i < wrong));
}

function loadWord() {
  current = wordAt(seed, index, opts);
  if (!current) { finishAlphabet(); return; }

  revealed.clear();
  guessed.clear();
  wrong = 0;

  // The march's letter is the freebie — given everywhere it appears, and its
  // key is spent before you touch the board.
  revealed.add(current.letter);
  guessed.add(current.letter);

  verdictEl.hidden = true;
  verdictEl.className = 'vocab-verdict';
  boardEl.classList.remove('is-solved', 'is-hung');
  stepEl.textContent = `${current.letter} · word ${index + 1} of ${letters.length}`;
  clueEl.textContent = current.clue;

  keyboardEl.querySelectorAll('.vocab-key').forEach((btn) => {
    btn.classList.remove('is-hit', 'is-miss');
    btn.disabled = false;
  });
  const given = keyEl(current.letter);
  if (given) { given.classList.add('is-hit'); given.disabled = true; }

  renderWord();
  renderLives();
  acceptingGuesses = true;
}

function showVerdict(text, kind) {
  verdictEl.textContent = text;
  verdictEl.className = `vocab-verdict is-${kind}`;
  verdictEl.hidden = false;
}

function solve() {
  acceptingGuesses = false;
  score += 1;
  scoreNote.textContent = `${score} solved`;
  boardEl.classList.add('is-solved');
  showVerdict('Solved!', 'solved');
  queueNext(900);
}

function hang() {
  acceptingGuesses = false;
  // Show what it was — a hangman you never see the answer to teaches nothing.
  [...current.word.toUpperCase()].forEach((ch) => { if (isGuessable(ch)) revealed.add(ch); });
  renderWord();
  boardEl.classList.add('is-hung');
  showVerdict(`It was “${current.word.toUpperCase()}”`, 'hung');
  queueNext(1600);
}

function queueNext(ms) {
  clearTimeout(nextTimer);
  nextTimer = setTimeout(() => {
    if (!active) return;
    index += 1;
    if (index >= letters.length) { finishAlphabet(); return; }
    loadWord();
  }, ms);
}

// Ran the whole alphabet before the clock did. The score is locked, but the
// round is NOT cut short: everyone in the room finishes together, so the
// end-of-round write/read still lands at the same moment for every player
// (see leaderboard.js's grace window — an early exit would read the others
// as zero).
function finishAlphabet() {
  acceptingGuesses = false;
  boardEl.classList.remove('is-solved', 'is-hung');
  stepEl.textContent = `${letters.length} of ${letters.length}`;
  clueEl.textContent = 'Alphabet complete. Sit tight — the clock is still running for everyone else.';
  wordEl.innerHTML = '';
  showVerdict(`${score} solved`, 'solved');
  keyboardEl.querySelectorAll('.vocab-key').forEach((btn) => { btn.disabled = true; });
}

function guess(rawCh) {
  if (!active || !acceptingGuesses) return;
  const ch = rawCh.toUpperCase();
  if (!/^[A-Z]$/.test(ch) || guessed.has(ch)) return;
  guessed.add(ch);

  const hit = current.word.toUpperCase().includes(ch);
  const btn = keyEl(ch);
  if (btn) {
    btn.classList.add(hit ? 'is-hit' : 'is-miss');
    btn.disabled = true;
  }

  if (hit) {
    revealed.add(ch);
    renderWord();
    if (hiddenLetters(current.word, revealed).length === 0) solve();
    return;
  }

  wrong += 1;
  renderLives();
  if (wrong >= MAX_WRONG) hang();
}

function onKeyDown(e) {
  if (!active || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/^[a-z]$/i.test(e.key)) { e.preventDefault(); guess(e.key); }
}

function tick() {
  if (!active) return;
  const remainingMs = endAt - Date.now();
  if (remainingMs <= 0) { endRound(); return; }
  timeRemainingEl.textContent = `${Math.ceil(remainingMs / 1000)}s left`;
  rafId = requestAnimationFrame(tick);
}

function endRound() {
  active = false;
  acceptingGuesses = false;
  clearTimeout(nextTimer);
  if (rafId) cancelAnimationFrame(rafId);
  document.removeEventListener('keydown', onKeyDown);
  playBd.classList.remove('open');
  playBd.setAttribute('aria-hidden', 'true');
  const finalScore = score;
  if (resolveRound) resolveRound(finalScore);
  resolveRound = null;
}

buildKeyboard();

// Resolves with the number of words the player solved, once the local timer
// hits zero.
export function startRound({ seed: roomSeed, timeLimit, startAt, subject, grade, roster }) {
  return new Promise((resolve) => {
    seed = roomSeed;
    opts = { subject, grade };
    letters = roundLetters(subject, grade);
    index = 0;
    score = 0;
    wrong = 0;
    resolveRound = resolve;

    scoreNote.textContent = '0 solved';
    timerNote.textContent = `${Math.round(timeLimit / 60)} min round`;
    cardEl.hidden = false;
    countdownEl.hidden = false;
    boardEl.hidden = true;
    keyboardEl.hidden = true;
    timeRemainingEl.textContent = '';
    if (roster) renderRoster(roster);

    playBd.classList.add('open');
    playBd.setAttribute('aria-hidden', 'false');
    active = true;

    (function tickCountdown() {
      const msLeft = startAt - Date.now();
      if (msLeft <= 0) {
        countdownEl.hidden = true;
        rosterEl.hidden = true;
        boardEl.hidden = false;
        keyboardEl.hidden = false;
        endAt = startAt + timeLimit * 1000;
        loadWord();
        document.addEventListener('keydown', onKeyDown);
        rafId = requestAnimationFrame(tick);
        return;
      }
      countdownEl.textContent = Math.ceil(msLeft / 1000);
      setTimeout(tickCountdown, 100);
    })();
  });
}
