/* ═══════════════════════════════════════════════════════
   DRILLS — Times-Table Filler (grid) activity

   A 5×5 multiplication grid with missing cells AND missing row/column header
   labels. The headers are a mix of factors from 1..12 (shuffled, so position
   gives no hint), and some are blank — you work the missing label out from the
   products. Fill a grid and a FRESH 5×5 takes its place, on and on until the
   clock runs out; the score is the total number of blanks filled correctly.

   Streaming (rather than one finite grid) is deliberate: it means there is no
   ceiling on a fast player OR a bot, so the round scores exactly like the
   arithmetic card — a filled cell is just a times-table product — with no cap
   anywhere. Grids are generated on demand by index, like rng.js's questionAt.

   Two halves live here:
     · the SEEDED GENERATOR (gridAt/gridSpec) — pure and deterministic, so every
       client in a room draws the identical grid stream with zero network.
     · the ROUND RUNNER (startGridRound) — the play surface, structured like
       game.js's startRound: a 3-2-1 beat from the shared startAt, then a live
       grid where a cell locks green the moment its value is right, and the whole
       grid gives way to the next once every blank is filled.

   Blanks are chosen so each grid is always solvable: header 0 on each axis is
   never blanked, and every blank header is anchored by a shown cell in row/
   column 0 whose crossing header is shown — so no deduction ever chains.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, CONTENT_NS } from '/utils/games/rng.js';

const $ = (id) => document.getElementById(id);
const START_BUFFER_MS = 3000; // mirrors seeded-room.js; see game.js's note

const SIZE = 5; // always a 5×5 grid
const FACTOR_MAX = 12; // headers mix factors 1..12
const BLANK_FRACTION = { light: 0.4, heavy: 0.6 };

/* ── GENERATOR ──────────────────────────────────────────────────────────── */

// How many of a grid's 35 fillable positions (25 products + 10 headers) are
// blank, by density. Fixed formula, no seed.
export function gridSpec(blanks) {
  const fillable = SIZE * SIZE + 2 * SIZE;
  const fraction = BLANK_FRACTION[blanks] || BLANK_FRACTION.light;
  return { fillable, blankCount: Math.round(fraction * fillable) };
}

function shuffled(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The index-th 5×5 grid of the room's stream — deterministic per (seed, index),
// exactly like rng.js's questionAt(seed, i). Each grid re-mixes its 1..12
// headers, so the stream never repeats and a fast player never runs out.
// Solvable by construction: header 0 on each axis is never blanked, and every
// blanked header reserves a shown anchor cell in column/row 0.
export function gridAt(seed, index, blanks) {
  const rng = mulberry32(hashSeed(seed, CONTENT_NS + index));
  const FACTORS = Array.from({ length: FACTOR_MAX }, (_, i) => i + 1);
  // Rows and columns are independent axes — each an own shuffle of 1..12.
  const cols = shuffled(FACTORS, rng).slice(0, SIZE);
  const rows = shuffled(FACTORS, rng).slice(0, SIZE);
  const cells = rows.map((r) => cols.map((c) => r * c));

  const { blankCount } = gridSpec(blanks);
  const blankRow = new Set(); // row-header indices that are blank
  const blankCol = new Set(); // col-header indices that are blank
  const blankCell = new Set(); // interior "r,c"
  const reserved = new Set(); // interior "r,c" that must stay shown (anchors)

  // Some of the blanks are header labels — proportional to the header share of
  // the grid, but always at least one (missing labels are the point), and never
  // index 0 on either axis (that keeps an anchoring header shown).
  const headerSlots = shuffled(
    [
      ...Array.from({ length: SIZE - 1 }, (_, i) => ({ type: 'row', i: i + 1 })),
      ...Array.from({ length: SIZE - 1 }, (_, i) => ({ type: 'col', i: i + 1 })),
    ],
    rng,
  );
  const headerTarget = Math.max(
    1,
    Math.min(
      Math.round(blankCount * (2 * SIZE) / (SIZE * SIZE + 2 * SIZE)),
      headerSlots.length,
    ),
  );
  for (const h of headerSlots) {
    if (blankRow.size + blankCol.size >= headerTarget) break;
    if (h.type === 'row') {
      blankRow.add(h.i);
      reserved.add(`${h.i},0`); // anchor: cell in column 0 (col header 0 is shown)
    } else {
      blankCol.add(h.i);
      reserved.add(`0,${h.i}`); // anchor: cell in row 0 (row header 0 is shown)
    }
  }

  // Fill the rest of the blank budget from interior cells that aren't anchors.
  const interior = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!reserved.has(`${r},${c}`)) interior.push(`${r},${c}`);
    }
  }
  let need = blankCount - blankRow.size - blankCol.size;
  for (const key of shuffled(interior, rng)) {
    if (need <= 0) break;
    blankCell.add(key);
    need -= 1;
  }

  return { rows, cols, cells, blankRow, blankCol, blankCell };
}

/* ── ROUND RUNNER ───────────────────────────────────────────────────────── */

const playBd = $('drill-play-bd');
const gridStage = $('drill-grid');
const cardEl = $('drill-card');
const rosterEl = $('drill-roster');
const timeRemainingEl = $('drill-time-remaining');

let active = false;
let score = 0;
let endAt = 0;
let rafId = null;
let resolveRound = null;
let inputs = []; // ordered live blank inputs of the CURRENT grid, DOM order
let remaining = 0; // unlocked inputs left in the current grid
let curSeed = 0;
let curBlanks = 'light';
let gridIndex = 0;

// Mount elements built once and reused across rounds.
let headEl = null;
let scoreNote = null;
let timerNote = null;
let countdownEl = null;
let tableWrap = null;
let paperEl = null; // the receipt paper the table is printed on

function ensureMount() {
  if (headEl) return;
  headEl = document.createElement('div');
  headEl.className = 'drill-grid-head';
  timerNote = document.createElement('span');
  timerNote.className = 'pp-sticky pp-sticky--tape drill-grid-note';
  scoreNote = document.createElement('span');
  scoreNote.className = 'pp-sticky pp-sticky--tape drill-grid-note';
  headEl.append(timerNote, scoreNote);

  countdownEl = document.createElement('p');
  countdownEl.className = 'drill-countdown';
  countdownEl.hidden = true;

  // The grid is a single ruled table printed on receipt paper (the same torn
  // cream stock the card and leaderboard use), not a scatter of loose chips.
  tableWrap = document.createElement('div');
  tableWrap.className = 'drill-grid-scroll';
  const receipt = document.createElement('div');
  receipt.className = 'pp-receipt drill-grid-receipt';
  paperEl = document.createElement('div');
  paperEl.className = 'pp-receipt__paper drill-grid-paper';
  receipt.appendChild(paperEl);
  tableWrap.appendChild(receipt);

  gridStage.append(headEl, countdownEl, tableWrap);
}

function sanitize(raw) {
  return raw.replace(/[^0-9]/g, '').slice(0, 4);
}

function makeInput(correct) {
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'numeric';
  input.autocomplete = 'off';
  input.className = 'drill-grid-input';
  input.setAttribute('aria-label', 'Fill in');
  input.dataset.answer = String(correct);
  input.addEventListener('input', () => onCellInput(input));
  return input;
}

function onCellInput(input) {
  if (!active || input.readOnly) return;
  const v = sanitize(input.value);
  input.value = v;
  if (v === '') return;
  if (Number(v) === Number(input.dataset.answer)) {
    input.readOnly = true;
    input.classList.add('is-correct');
    score += 1;
    remaining -= 1;
    scoreNote.textContent = `${score} correct`;
    // Grid finished — deal the next 5×5 and keep the run going.
    if (remaining <= 0) { nextGrid(); return; }
    focusNextFrom(input);
  }
}

function focusNextFrom(input) {
  const start = inputs.indexOf(input);
  for (let k = 1; k <= inputs.length; k++) {
    const next = inputs[(start + k) % inputs.length];
    if (next && !next.readOnly) { next.focus({ preventScroll: true }); return; }
  }
}

function focusFirst() {
  const first = inputs.find((i) => !i.readOnly);
  if (first) first.focus({ preventScroll: true });
}

// Build the <table>: corner "×", a shuffled header row/column (blanks are
// inputs), and the product body (blanks are inputs). Fixed cells show their
// number. `inputs`/`remaining` are (re)set for the freshly dealt grid.
function renderTable(grid) {
  const { rows, cols, cells, blankRow, blankCol, blankCell } = grid;
  inputs = [];
  const table = document.createElement('table');
  table.className = 'drill-grid-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const corner = document.createElement('th');
  corner.className = 'drill-grid-corner';
  corner.textContent = '×';
  headRow.appendChild(corner);
  cols.forEach((val, c) => {
    const th = document.createElement('th');
    th.className = 'drill-grid-th';
    if (blankCol.has(c)) { const inp = makeInput(val); inputs.push(inp); th.appendChild(inp); }
    else th.textContent = String(val);
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach((rowVal, r) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.className = 'drill-grid-th';
    if (blankRow.has(r)) { const inp = makeInput(rowVal); inputs.push(inp); th.appendChild(inp); }
    else th.textContent = String(rowVal);
    tr.appendChild(th);
    cells[r].forEach((product, c) => {
      const td = document.createElement('td');
      td.className = 'drill-grid-td';
      if (blankCell.has(`${r},${c}`)) { const inp = makeInput(product); inputs.push(inp); td.appendChild(inp); }
      else td.textContent = String(product);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  paperEl.innerHTML = '';
  paperEl.appendChild(table);
  remaining = inputs.length;
}

function nextGrid() {
  gridIndex += 1;
  renderTable(gridAt(curSeed, gridIndex, curBlanks));
  focusFirst();
}

function renderRoster(roster) {
  rosterEl.innerHTML = '';
  roster.forEach((p, i) => {
    const pill = document.createElement('span');
    pill.className = `drill-roster-item${p.isSelf ? ' is-self' : ''}`;
    pill.style.setProperty('--delay', `${i * 90}ms`);
    pill.textContent = p.isSelf ? `${p.name} (You)` : p.name;
    rosterEl.appendChild(pill);
  });
  rosterEl.hidden = false;
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
  if (rafId) cancelAnimationFrame(rafId);
  playBd.classList.remove('open');
  playBd.setAttribute('aria-hidden', 'true');
  gridStage.hidden = true;
  const finalScore = score;
  if (resolveRound) resolveRound(finalScore);
  resolveRound = null;
}

// Resolves with the player's correct-cell count once the local timer hits zero.
// Same shape/contract as game.js's startRound so main.js can dispatch on it.
export function startGridRound({ seed, timeLimit, startAt, blanks, roster }) {
  return new Promise((resolve) => {
    ensureMount();
    score = 0;
    gridIndex = 0;
    curSeed = seed;
    curBlanks = blanks;
    resolveRound = resolve;
    inputs = [];
    remaining = 0;

    // Card is the arithmetic surface; hide it, show the grid.
    cardEl.hidden = true;
    gridStage.hidden = false;
    timerNote.textContent = `${timeLimit}s round`;
    scoreNote.textContent = '0 correct';
    countdownEl.hidden = false;
    paperEl.innerHTML = '';
    timeRemainingEl.textContent = '';
    if (roster) renderRoster(roster);

    playBd.classList.add('open');
    playBd.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drill-nav-hidden');
    active = true;

    // Same clock-skew guard as game.js: trust the shared startAt only when it
    // lands in the plausible window, else anchor to THIS device's clock so a
    // player with a skewed clock still gets a full round.
    const lead = startAt - Date.now();
    const anchorAt = (lead > -2000 && lead <= START_BUFFER_MS + 2000) ? startAt : Date.now() + 800;

    (function tickCountdown() {
      const msLeft = anchorAt - Date.now();
      if (msLeft <= 0) {
        countdownEl.hidden = true;
        rosterEl.hidden = true;
        renderTable(gridAt(seed, 0, blanks));
        endAt = anchorAt + timeLimit * 1000;
        focusFirst();
        rafId = requestAnimationFrame(tick);
        return;
      }
      countdownEl.textContent = Math.ceil(msLeft / 1000);
      setTimeout(tickCountdown, 100);
    })();
  });
}
