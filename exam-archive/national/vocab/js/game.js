/* ═══════════════════════════════════════════════════════
   VOCAB — the hangman round
   A 3-2-1 "get ready" beat off the shared startAt, then a run of words. Each
   word arrives as a clue and a row of blanks; you guess letters one at a time,
   and six wrong guesses hang you and cost you that word (not the round).

   NO LETTER IS EVER GIVEN. In an A-Z round you know the word starts with the
   letter you're on, and that is the only help there is — the board itself is
   blank from the first guess. The clue does the rest of the work, which is why
   the clue is never allowed to contain its own word (see data/vocab).

   Score is words SOLVED. Timing after activation is entirely local
   (startAt/timeLimit) — no further server dependency during play.
═══════════════════════════════════════════════════════ */
import { buildRound, isGuessable, hiddenLetters, MAX_WRONG } from './rng.js';
import { loadWords, topicMeta } from '/data/vocab/index.js';

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
const modeNote = $('vocab-mode-note');
const gallowsParts = [...document.querySelectorAll('#vocab-gallows [data-part]')];

let active = false;   // the round is running (clock ticking)
let acceptingGuesses = false; // …and the board is live (not mid-verdict, not out of words)
let seed = 0;
let round = [];   // [{ word, clue, letter }] — the same list on every client
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
  current = round[index];
  if (!current) { finishWords(); return; }

  revealed.clear();
  guessed.clear();
  wrong = 0;

  verdictEl.hidden = true;
  verdictEl.className = 'vocab-verdict';
  boardEl.classList.remove('is-solved', 'is-hung');
  // In an A-Z round the letter labels the stop — it tells you the word begins
  // with a D. It is NOT filled in on the board and its key is NOT spent.
  stepEl.textContent = current.letter
    ? `${current.letter} · word ${index + 1} of ${round.length}`
    : `Word ${index + 1} of ${round.length}`;
  clueEl.textContent = current.clue;

  keyboardEl.querySelectorAll('.vocab-key').forEach((btn) => {
    btn.classList.remove('is-hit', 'is-miss');
    btn.disabled = false;
  });

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
    if (index >= round.length) { finishWords(); return; }
    loadWord();
  }, ms);
}

// Ran out of words before the clock did. The score is locked, but the round is
// NOT cut short: everyone in the room finishes together, so the end-of-round
// write/read still lands at the same moment for every player (see
// leaderboard.js's grace window — an early exit would read the others as zero).
function finishWords() {
  acceptingGuesses = false;
  boardEl.classList.remove('is-solved', 'is-hung');
  stepEl.textContent = `${round.length} of ${round.length}`;
  clueEl.textContent = 'Every word done. Sit tight — the clock is still running for everyone else.';
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
  // The word count goes back with the score: leaderboard.js needs it to cap the
  // bots at the same number of words the humans were actually dealt.
  if (resolveRound) resolveRound({ score, wordCount: round.length });
  resolveRound = null;
}

buildKeyboard();

// Resolves with { score, wordCount } once the local timer hits zero: how many
// words the player solved, and how many the round held.
export async function startRound({ seed: roomSeed, timeLimit, startAt, subject, grade, mode, topic, roster }) {
  // The bank loads on demand, so the round's words must be in hand before the
  // countdown ends. It resolves from cache on a replay.
  const words = await loadWords(subject);
  round = buildRound({ seed: roomSeed, words, subject, grade, mode, topic });

  return new Promise((resolve) => {
    seed = roomSeed;
    index = 0;
    score = 0;
    wrong = 0;
    resolveRound = resolve;

    scoreNote.textContent = '0 solved';
    timerNote.textContent = `${Math.round(timeLimit / 60)} min round`;
    const meta = mode === 'topic' ? topicMeta(subject, topic) : null;
    modeNote.textContent = meta ? meta.label : 'A to Z';
    cardEl.hidden = false;
    countdownEl.hidden = false;
    boardEl.hidden = true;
    keyboardEl.hidden = true;
    timeRemainingEl.textContent = '';
    if (roster) renderRoster(roster);

    playBd.classList.add('open');
    playBd.setAttribute('aria-hidden', 'false');
    // Game mode: the nav goes away. A round is timed and full-screen — a stray
    // click on the menu mid-round costs the player the round.
    document.body.classList.add('vocab-nav-hidden');
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
