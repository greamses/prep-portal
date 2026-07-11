/* ═══════════════════════════════════════════════════════
   PUZZLES — round loop (Sudoku)
   3-2-1 "get ready" beat from a shared startAt (rendered on the grid
   itself, same as Drills' card), then a free-form NxN grid: click a cell,
   type a digit — physical keys or the on-screen digit pad. Score is a live
   count of correctly-filled editable cells; a full-solve ends the round
   early. Timing after activation is entirely local (startAt/timeLimit),
   no further server dependency during play.
═══════════════════════════════════════════════════════ */
import { generatePuzzle, scoreGrid, countEditableCells } from './sudoku.js';

const $ = (id) => document.getElementById(id);

const playBd = $('puzzle-play-bd');
const gridWrap = $('puzzle-grid-wrap');
const gridEl = $('puzzle-grid');
const countdownEl = $('puzzle-countdown');
const rosterEl = $('puzzle-roster');
const timeRemainingEl = $('puzzle-time-remaining');
const digitPad = $('puzzle-digit-pad');
const scoreNote = $('puzzle-score-note');
const timerNote = $('puzzle-timer-note');

let active = false;
let seed = 0;
let gridSize = 9;
let givens = null;
let solution = null;
let current = null; // mutable NxN working grid
let editableTotal = 0;
let selected = null; // { r, c } or null
let score = 0;
let endAt = 0;
let rafId = null;
let resolveRound = null;

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function renderRoster(roster) {
  rosterEl.innerHTML = '';
  roster.forEach((p, i) => {
    const pill = document.createElement('span');
    pill.className = `puzzle-roster-item${p.isSelf ? ' is-self' : ''}`;
    pill.style.setProperty('--delay', `${i * 90}ms`);
    pill.textContent = p.isSelf ? `${p.name} (You)` : p.name;
    rosterEl.appendChild(pill);
  });
  rosterEl.hidden = false;
}

function cellKey(r, c) { return `${r}_${c}`; }

function buildGrid() {
  gridEl.innerHTML = '';
  gridEl.style.setProperty('--grid-size', gridSize);
  const config = gridSize === 4 ? { boxW: 2, boxH: 2 } : gridSize === 6 ? { boxW: 3, boxH: 2 } : { boxW: 3, boxH: 3 };
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const given = givens[r][c] !== 0;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `sudoku-cell${given ? ' is-given' : ' is-editable'}`;
      if ((c + 1) % config.boxW === 0 && c !== gridSize - 1) btn.classList.add('box-edge-right');
      if ((r + 1) % config.boxH === 0 && r !== gridSize - 1) btn.classList.add('box-edge-bottom');
      btn.dataset.r = String(r);
      btn.dataset.c = String(c);
      btn.textContent = given ? String(givens[r][c]) : '';
      btn.disabled = given;
      gridEl.appendChild(btn);
    }
  }
}

function renderDigitPad() {
  digitPad.innerHTML = '';
  for (let d = 1; d <= gridSize; d++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'puzzle-digit-btn';
    btn.textContent = String(d);
    btn.dataset.digit = String(d);
    digitPad.appendChild(btn);
  }
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'puzzle-digit-btn puzzle-digit-btn--clear';
  clear.textContent = 'Clear';
  clear.dataset.digit = '0';
  digitPad.appendChild(clear);
}

function selectCell(r, c) {
  if (givens[r][c] !== 0) return; // givens aren't selectable
  if (selected) {
    const prevEl = gridEl.querySelector(`[data-r="${selected.r}"][data-c="${selected.c}"]`);
    if (prevEl) prevEl.classList.remove('is-selected');
  }
  selected = { r, c };
  const el = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  if (el) el.classList.add('is-selected');
}

function setDigit(d) {
  if (!active || !selected) return;
  const { r, c } = selected;
  const el = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  if (!el) return;

  current[r][c] = d;
  el.textContent = d === 0 ? '' : String(d);

  const isCorrect = d !== 0 && d === solution[r][c];
  el.classList.toggle('is-correct', isCorrect);
  if (isCorrect) {
    el.classList.add('correct-flash');
    setTimeout(() => el.classList.remove('correct-flash'), 260);
  }

  score = scoreGrid(current, solution, givens);
  scoreNote.textContent = `${score}/${editableTotal} correct`;
  if (score >= editableTotal) endRound(); // fully (correctly) solved — no need to wait out the clock
}

function onGridClick(e) {
  const btn = e.target.closest('.sudoku-cell.is-editable');
  if (!btn || !active) return;
  selectCell(parseInt(btn.dataset.r, 10), parseInt(btn.dataset.c, 10));
}

function onDigitPadClick(e) {
  const btn = e.target.closest('.puzzle-digit-btn');
  if (!btn || !active) return;
  setDigit(parseInt(btn.dataset.digit, 10));
}

function onKeydown(e) {
  if (!active || !selected) return;
  if (e.key >= '1' && e.key <= '9') {
    const d = parseInt(e.key, 10);
    if (d <= gridSize) setDigit(d);
  } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
    setDigit(0);
  } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    let { r, c } = selected;
    if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
    if (e.key === 'ArrowDown') r = Math.min(gridSize - 1, r + 1);
    if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
    if (e.key === 'ArrowRight') c = Math.min(gridSize - 1, c + 1);
    if (givens[r][c] === 0) selectCell(r, c);
  }
}

function tick() {
  if (!active) return;
  const remainingMs = endAt - Date.now();
  if (remainingMs <= 0) {
    endRound();
    return;
  }
  timeRemainingEl.textContent = `${formatClock(remainingMs / 1000)} left`;
  rafId = requestAnimationFrame(tick);
}

function endRound() {
  if (!active) return;
  active = false;
  if (rafId) cancelAnimationFrame(rafId);
  playBd.classList.remove('open');
  playBd.setAttribute('aria-hidden', 'true');
  const result = { score, editableCells: editableTotal };
  if (resolveRound) resolveRound(result);
  resolveRound = null;
}

gridEl.addEventListener('click', onGridClick);
digitPad.addEventListener('click', onDigitPadClick);
document.addEventListener('keydown', onKeydown);

// Resolves with { score, editableCells } once the local timer hits zero
// (or the puzzle is fully solved early) — editableCells lets the caller
// pass the same cap to bot simulation without regenerating the puzzle.
export function startRound({ seed: roomSeed, timeLimit, startAt, difficulty, gridSize: size, roster }) {
  return new Promise((resolve) => {
    seed = roomSeed;
    gridSize = size;
    const puzzle = generatePuzzle(seed, difficulty, gridSize);
    givens = puzzle.givens;
    solution = puzzle.solution;
    current = givens.map((row) => row.slice());
    editableTotal = countEditableCells(givens);
    selected = null;
    score = 0;
    resolveRound = resolve;

    scoreNote.textContent = `0/${editableTotal} correct`;
    timerNote.textContent = `${formatClock(timeLimit)} round`;
    gridWrap.hidden = false;
    countdownEl.hidden = false;
    gridEl.hidden = true;
    digitPad.hidden = true;
    timeRemainingEl.textContent = '';
    if (roster) renderRoster(roster);

    buildGrid();
    renderDigitPad();

    playBd.classList.add('open');
    playBd.setAttribute('aria-hidden', 'false');
    active = true;

    (function tickCountdown() {
      const msLeft = startAt - Date.now();
      if (msLeft <= 0) {
        countdownEl.hidden = true;
        rosterEl.hidden = true;
        gridEl.hidden = false;
        digitPad.hidden = false;
        endAt = startAt + timeLimit * 1000;
        rafId = requestAnimationFrame(tick);
        return;
      }
      countdownEl.textContent = Math.ceil(msLeft / 1000);
      setTimeout(tickCountdown, 100);
    })();
  });
}
