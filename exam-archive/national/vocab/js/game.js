/* ═══════════════════════════════════════════════════════
   VOCAB — the hangman round
   A 3-2-1 "get ready" beat off the shared startAt, then a run of words. Each
   word arrives as a clue and a row of blanks; you guess letters one at a time,
   and six wrong guesses hang you and cost you that word (not the round).

   NO LETTER IS EVER GIVEN. In an A-Z round you know the word starts with the
   letter you're on, and that is the only help there is — the board itself is
   blank from the first guess. The clue does the rest of the work, which is why
   the clue is never allowed to contain its own word (see data/vocab).

   TWO WAYS TO PLAY A WORD:
     classic — hangman. Guess any letter; a hit fills EVERY place it appears,
               and a letter that isn't in the word costs a limb. You are READING
               the word.
     spell   — a spelling bee. Type the word out in order, one letter at a time,
               left to right. A wrong letter costs a limb and the cursor stays
               put. You are WRITING the word, which is a harder thing, and the
               thing a spelling test actually asks of a child.

   Score is words SOLVED. Timing after activation is entirely local
   (startAt/timeLimit) — no further server dependency during play.
═══════════════════════════════════════════════════════ */
import { buildRound, isGuessable, MAX_WRONG } from './rng.js';
import { loadWords, topicMeta, CATEGORY_LABELS } from '/data/vocab/index.js';

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
let spelling = 'classic';
// POSITIONS shown on the board, not letters. The two modes fill the board in
// different ways — classic fills every place a letter appears, a spelling bee
// fills the next place only — and only positions can express both.
const revealedPos = new Set();
const guessed = new Set(); // keys already spent on this word — classic only
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

// The next place a speller has to fill. -1 once the word is complete.
function nextSlot() {
  const chars = [...current.word.toUpperCase()];
  for (let i = 0; i < chars.length; i++) {
    if (isGuessable(chars[i]) && !revealedPos.has(i)) return i;
  }
  return -1;
}

function renderWord() {
  wordEl.innerHTML = '';
  const cursor = spelling === 'spell' ? nextSlot() : -1;
  [...current.word.toUpperCase()].forEach((ch, i) => {
    const slot = document.createElement('span');
    if (!isGuessable(ch)) {
      // Scenery ("x-ray"'s hyphen) — always shown, never typed, never guessed.
      slot.className = 'vocab-slot vocab-slot--fixed';
      slot.textContent = ch;
    } else if (revealedPos.has(i)) {
      slot.className = 'vocab-slot is-filled';
      slot.textContent = ch;
    } else {
      // A spelling bee shows a cursor: you are writing, so you need to see where
      // the next letter is going to land.
      slot.className = 'vocab-slot' + (i === cursor ? ' is-cursor' : '');
      slot.textContent = '';
    }
    wordEl.appendChild(slot);
  });
}

function isSolved() {
  return nextSlot() === -1;
}

// A single periodic-table cell as the clue: atomic number top-left, mass below,
// a "?" where the symbol would sit, and a hover tip with the real help.
function renderElementClue(el) {
  clueEl.className = 'vocab-clue vocab-clue--element';
  const cat = CATEGORY_LABELS[el.cat] || '';
  const place = el.group ? `Group ${el.group} · Period ${el.period}` : `Period ${el.period}`;
  const tip = [cat, place, el.use].filter(Boolean).join(' — ');
  clueEl.innerHTML = `
    <span class="vocab-el-cell" data-cat="${el.cat}" tabindex="0" aria-label="Element clue: atomic number ${el.z}, mass ${el.mass}">
      <span class="vocab-el-z">${el.z}</span>
      <span class="vocab-el-q">?</span>
      <span class="vocab-el-mass">${el.mass}</span>
      <span class="vocab-el-tip" role="tooltip">${tip}</span>
    </span>`;
}

// Scenery is never guessed, so it sits on the board from the start.
function revealScenery() {
  [...current.word].forEach((ch, i) => { if (!isGuessable(ch)) revealedPos.add(i); });
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

  revealedPos.clear();
  guessed.clear();
  wrong = 0;

  verdictEl.hidden = true;
  verdictEl.className = 'vocab-verdict';
  boardEl.classList.remove('is-solved', 'is-hung');
  // In an A-Z round the letter labels the stop — it tells you the word begins
  // with a D. It is NOT filled in on the board and its key is NOT spent.
  stepEl.textContent = current.letter
    ? `${current.letter} · word ${index + 1} of ${round.length}`
    : `${current.element ? 'Element' : 'Word'} ${index + 1} of ${round.length}`;
  // The periodic-table topic hands you a table cell, not a sentence: atomic
  // number and mass showing, symbol and name blank. Hover it for a hint.
  if (current.element) renderElementClue(current.element);
  else { clueEl.className = 'vocab-clue'; clueEl.textContent = current.clue; }

  keyboardEl.querySelectorAll('.vocab-key').forEach((btn) => {
    btn.classList.remove('is-hit', 'is-miss');
    btn.disabled = false;
  });

  revealScenery();
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
  [...current.word].forEach((_, i) => revealedPos.add(i));
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
  if (!/^[A-Z]$/.test(ch)) return;

  const hit = spelling === 'spell' ? spellLetter(ch) : classicLetter(ch);
  if (hit === null) return; // key already spent (classic only)

  if (hit) {
    renderWord();
    if (isSolved()) solve();
    return;
  }

  wrong += 1;
  renderWord(); // in a spelling bee a wrong letter leaves the cursor where it was
  renderLives();
  if (wrong >= MAX_WRONG) hang();
}

// Classic hangman: any letter, any time. A hit fills every place it appears, and
// the key is spent either way, so the board remembers what you have tried.
function classicLetter(ch) {
  if (guessed.has(ch)) return null;
  guessed.add(ch);

  const chars = [...current.word.toUpperCase()];
  const hit = chars.includes(ch);
  const btn = keyEl(ch);
  if (btn) {
    btn.classList.add(hit ? 'is-hit' : 'is-miss');
    btn.disabled = true;
  }
  if (hit) chars.forEach((c, i) => { if (c === ch) revealedPos.add(i); });
  return hit;
}

// Spelling bee: only the NEXT letter counts. Keys are never spent — a word with
// two S's needs the S key twice, and a letter that was wrong here may be exactly
// right two places later.
function spellLetter(ch) {
  const at = nextSlot();
  if (at === -1) return false;
  const hit = current.word.toUpperCase()[at] === ch;

  const btn = keyEl(ch);
  if (btn) {
    // Flash the key rather than spending it.
    btn.classList.add(hit ? 'is-hit' : 'is-miss');
    setTimeout(() => btn.classList.remove('is-hit', 'is-miss'), 220);
  }
  if (hit) revealedPos.add(at);
  return hit;
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
export async function startRound({ seed: roomSeed, timeLimit, startAt, subject, grade, mode, topic, spelling: spellMode, roster }) {
  // The bank loads on demand, so the round's words must be in hand before the
  // countdown ends. It resolves from cache on a replay.
  const words = await loadWords(subject);
  round = buildRound({ seed: roomSeed, words, subject, grade, mode, topic });

  return new Promise((resolve) => {
    seed = roomSeed;
    spelling = spellMode === 'spell' ? 'spell' : 'classic';
    index = 0;
    score = 0;
    wrong = 0;
    resolveRound = resolve;

    scoreNote.textContent = '0 solved';
    timerNote.textContent = `${Math.round(timeLimit / 60)} min round`;
    const meta = mode === 'topic' ? topicMeta(subject, topic) : null;
    modeNote.textContent = (meta ? meta.label : 'A to Z') + ' · ' + (spelling === 'spell' ? 'Spelling Bee' : 'Classic');
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
