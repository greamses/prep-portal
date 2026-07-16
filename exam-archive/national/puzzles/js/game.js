/* ═══════════════════════════════════════════════════════
   PUZZLES — round loop
   3-2-1 "get ready" beat from a shared startAt (rendered on the grid
   itself, same as Drills' card), then a free-form NxN grid whose
   interaction depends on the active puzzle:
     - sudoku: click a cell, type a digit — physical keys or the on-screen
       digit pad. Score is a live count of correctly-filled editable cells.
     - slider: click any tile adjacent to the blank (or use arrow keys) to
       slide it. Score is a live count of tiles in their solved position.
     - jigsaw: tap one piece, tap another to swap them. A piece that lands
       on its home cell locks in; score is a live count of pieces placed.
   Either way, a full solve ends the round early, and timing after
   activation is entirely local (startAt/timeLimit) — no further server
   dependency during play.
═══════════════════════════════════════════════════════ */
import { generatePuzzle, scoreGrid, countEditableCells } from './sudoku.js';
import { generateSlider, scoreSlider, countSliderTiles, movableIndices, generateFractionValues } from './slider.js';
import { generateJigsaw, scoreJigsaw, pieceFacesSvg } from './jigsaw.js';
import { scenePictureUri } from './art.js';

const $ = (id) => document.getElementById(id);

// Mirrors seeded-room.js's START_BUFFER_MS. Used only to sanity-check the
// startAt we're handed against our own clock — never to schedule anything.
const START_BUFFER_MS = 3000;

const playBd = $('puzzle-play-bd');
const gridWrap = $('puzzle-grid-wrap');
const gridEl = $('puzzle-grid');
const countdownEl = $('puzzle-countdown');
const rosterEl = $('puzzle-roster');
const timeRemainingEl = $('puzzle-time-remaining');
const digitPad = $('puzzle-digit-pad');
const scoreNote = $('puzzle-score-note');
const timerNote = $('puzzle-timer-note');
const topbarEl = $('puzzle-grid-topbar');
const previewEl = $('puzzle-slider-preview');
const hintEl = $('puzzle-grid-hint');

let active = false;
let puzzleType = 'sudoku';
let gridSize = 9;
let totalUnits = 0;
let score = 0;
let endAt = 0;
let rafId = null;
let resolveRound = null;

// Sudoku-only state
let givens = null;
let solution = null;
let current = null; // mutable NxN working grid
let selected = null; // { r, c } or null

// Slider-only state
let board = null; // flat length-N² array, 0 = blank
let solvedBoard = null;
let tileSet = 'numbers'; // numbers | fractions | picture — what the tiles wear
let fractionValues = null; // fractions only — ascending, tile n wears [n-1]
let artUri = ''; // picture/jigsaw — the seeded scene as a data: URI

// Jigsaw-only state
let placement = null; // flat length-N² array — placement[cell] = piece number
let lockedCells = null; // pre-placed anchor cells (difficulty givens)
let pieceFaces = null; // piece number → its clipped-picture SVG face
let jigsawSelected = -1; // cell index of the picked-up piece, or -1

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

// ── Sudoku ───────────────────────────────────────────────────────────────
function buildSudokuGrid() {
  gridEl.classList.add('sudoku-grid');
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
  scoreNote.textContent = `${score}/${totalUnits} correct`;
  if (score >= totalUnits) endRound(); // fully (correctly) solved — no need to wait out the clock
}

// ── Slider ───────────────────────────────────────────────────────────────
// Soft pastel fills for the fraction bars — keyed off the fraction itself so
// the same fraction is always the same color, wherever it slides.
const FRACTION_FILLS = ['#f4c95d', '#6fb7e8', '#7cc47c', '#f07a7a', '#c9a3e8', '#f0a868'];

function fractionTileFace({ num, den, value }) {
  const shaded = value * 90;
  const fill = FRACTION_FILLS[(num + den) % FRACTION_FILLS.length];
  let splits = '';
  const partWidth = 90 / den;
  for (let i = 1; i < den; i++) {
    const x = (5 + i * partWidth).toFixed(1);
    splits += `<line x1="${x}" y1="12" x2="${x}" y2="48" stroke="var(--ink)" stroke-width="1.4"/>`;
  }
  return `<span class="slider-frac">
    <svg viewBox="0 0 100 60" aria-hidden="true">
      <rect x="5" y="12" width="90" height="36" fill="var(--surface-secondary, #efe9dc)"/>
      <rect x="5" y="12" width="${shaded.toFixed(1)}" height="36" fill="${fill}"/>
      ${splits}
      <rect x="5" y="12" width="90" height="36" fill="none" stroke="var(--ink)" stroke-width="2.4"/>
    </svg>
    <span class="slider-frac-label">${num}/${den}</span>
  </span>`;
}

// Dresses a tile for its number: plain digit, fraction bar, or its window of
// the shared picture. Picture tiles all carry the WHOLE image as background —
// background-size blows it up to the full grid and background-position pans
// to the window this tile occupies when solved, so the "splitting" is pure
// CSS and follows the tile wherever it slides.
function paintTile(el, value) {
  el.className = 'slider-tile';
  el.disabled = false;
  if (tileSet === 'picture') {
    el.textContent = '';
    const g = gridSize;
    const p = value - 1; // solved position of this tile
    el.style.backgroundImage = `url("${artUri}")`;
    el.style.backgroundSize = `${g * 100}% ${g * 100}%`;
    el.style.backgroundPosition = `${((p % g) / (g - 1)) * 100}% ${(Math.floor(p / g) / (g - 1)) * 100}%`;
  } else if (tileSet === 'fractions') {
    el.innerHTML = fractionTileFace(fractionValues[value - 1]);
  } else {
    el.textContent = String(value);
  }
}

function clearTile(el) {
  el.className = 'slider-tile is-blank';
  el.disabled = true;
  el.textContent = '';
  el.style.backgroundImage = '';
}

function buildSliderGrid() {
  gridEl.classList.add('slider-grid');
  if (tileSet !== 'numbers') gridEl.classList.add(`slider-grid--${tileSet}`);
  for (let i = 0; i < board.length; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.index = String(i);
    if (board[i] === 0) clearTile(btn);
    else paintTile(btn, board[i]);
    gridEl.appendChild(btn);
  }
  updateMovableHighlights();
}

function updateMovableHighlights() {
  const movable = new Set(movableIndices(board, gridSize));
  gridEl.querySelectorAll('.slider-tile').forEach((el) => {
    el.classList.toggle('is-movable', movable.has(parseInt(el.dataset.index, 10)));
  });
}

function slideTile(fromIndex) {
  if (!active) return;
  const blank = board.indexOf(0);
  if (!movableIndices(board, gridSize).includes(fromIndex)) return;

  board[blank] = board[fromIndex];
  board[fromIndex] = 0;

  const blankEl = gridEl.children[blank];
  const movedEl = gridEl.children[fromIndex];
  // Measure both cells BEFORE repainting, then FLIP: the arriving tile is
  // painted at its destination but starts translated back over the cell it
  // came from and slides home. The grid itself never reflows — only a
  // transform animates, and the Web Animations API cleans up after itself.
  const from = movedEl.getBoundingClientRect();
  const to = blankEl.getBoundingClientRect();
  paintTile(blankEl, board[blank]);
  clearTile(movedEl);
  if (blankEl.animate) {
    blankEl.animate(
      [
        { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)` },
        { transform: 'translate(0, 0)' },
      ],
      { duration: 130, easing: 'ease-out' },
    );
  }

  const isCorrect = board[blank] === solvedBoard[blank];
  blankEl.classList.toggle('is-correct', isCorrect);
  if (isCorrect) {
    blankEl.classList.add('correct-flash');
    setTimeout(() => blankEl.classList.remove('correct-flash'), 260);
  }

  updateMovableHighlights();
  score = scoreSlider(board, solvedBoard);
  scoreNote.textContent = `${score}/${totalUnits} correct`;
  if (score >= totalUnits) endRound();
}

// ── Jigsaw ───────────────────────────────────────────────────────────────
// Dresses cell `i` for the piece currently sitting on it. A piece at home
// (a pre-placed anchor, or one the player just delivered) locks: it can't
// be picked up again, and since every piece has exactly one home a locked
// piece can never block another one's way.
function paintJigsawCell(i, { flash = false } = {}) {
  const el = gridEl.children[i];
  const correct = placement[i] === i + 1;
  el.className = `jigsaw-piece${correct ? ' is-correct' : ''}`;
  el.disabled = correct;
  el.innerHTML = pieceFaces[placement[i]];
  if (correct && flash) {
    el.classList.add('correct-flash');
    setTimeout(() => el.classList.remove('correct-flash'), 380);
  }
}

function buildJigsawGrid() {
  gridEl.classList.add('jigsaw-grid');
  for (let i = 0; i < placement.length; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.index = String(i);
    gridEl.appendChild(btn);
    paintJigsawCell(i);
  }
}

function setJigsawSelected(i) {
  if (jigsawSelected !== -1) {
    const prev = gridEl.children[jigsawSelected];
    if (prev) prev.classList.remove('is-selected');
  }
  jigsawSelected = i;
  if (i !== -1) gridEl.children[i].classList.add('is-selected');
}

// Same FLIP recipe as slideTile, for both travellers at once: each piece is
// painted at its destination but starts translated back over the cell it
// came from and glides home. Only transforms animate — no reflow.
function jigsawGlide(el, from, to) {
  if (!el.animate) return;
  el.classList.add('is-swapping');
  const anim = el.animate(
    [
      { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)` },
      { transform: 'translate(0, 0)' },
    ],
    { duration: 160, easing: 'ease-out' },
  );
  anim.onfinish = () => el.classList.remove('is-swapping');
}

function swapJigsaw(a, b) {
  setJigsawSelected(-1);
  const elA = gridEl.children[a];
  const elB = gridEl.children[b];
  const rectA = elA.getBoundingClientRect();
  const rectB = elB.getBoundingClientRect();

  [placement[a], placement[b]] = [placement[b], placement[a]];
  paintJigsawCell(a, { flash: true });
  paintJigsawCell(b, { flash: true });
  jigsawGlide(elA, rectB, rectA);
  jigsawGlide(elB, rectA, rectB);

  score = scoreJigsaw(placement, lockedCells);
  scoreNote.textContent = `${score}/${totalUnits} correct`;
  if (score >= totalUnits) endRound();
}

// First tap picks a piece up (tap it again to put it down); the second tap
// swaps the two. Locked pieces are disabled buttons, so their clicks never
// even arrive here.
function onJigsawTap(i) {
  if (jigsawSelected === i) setJigsawSelected(-1);
  else if (jigsawSelected === -1) setJigsawSelected(i);
  else swapJigsaw(jigsawSelected, i);
}

// ── Shared input dispatch ─────────────────────────────────────────────────
function buildGrid() {
  gridEl.innerHTML = '';
  gridEl.classList.remove('sudoku-grid', 'slider-grid', 'slider-grid--fractions', 'slider-grid--picture', 'jigsaw-grid');
  gridEl.style.setProperty('--grid-size', gridSize);
  if (puzzleType === 'slider') buildSliderGrid();
  else if (puzzleType === 'jigsaw') buildJigsawGrid();
  else buildSudokuGrid();
}

function onGridClick(e) {
  if (!active) return;
  if (puzzleType === 'slider') {
    const btn = e.target.closest('.slider-tile.is-movable');
    if (btn) slideTile(parseInt(btn.dataset.index, 10));
    return;
  }
  if (puzzleType === 'jigsaw') {
    const btn = e.target.closest('.jigsaw-piece');
    if (btn && !btn.disabled) onJigsawTap(parseInt(btn.dataset.index, 10));
    return;
  }
  const btn = e.target.closest('.sudoku-cell.is-editable');
  if (btn) selectCell(parseInt(btn.dataset.r, 10), parseInt(btn.dataset.c, 10));
}

function onDigitPadClick(e) {
  if (!active || puzzleType !== 'sudoku') return;
  const btn = e.target.closest('.puzzle-digit-btn');
  if (btn) setDigit(parseInt(btn.dataset.digit, 10));
}

function onKeydown(e) {
  if (!active) return;
  // Jigsaw pieces are plain <button>s — Tab reaches them and Enter/Space
  // taps them natively, so it needs no bespoke key handling.
  if (puzzleType === 'jigsaw') return;

  if (puzzleType === 'slider') {
    // Arrow direction = which way a tile slides (the blank moves opposite).
    const deltaFor = { ArrowUp: gridSize, ArrowDown: -gridSize, ArrowLeft: 1, ArrowRight: -1 };
    if (!(e.key in deltaFor)) return;
    e.preventDefault();
    const target = board.indexOf(0) + deltaFor[e.key];
    if (movableIndices(board, gridSize).includes(target)) slideTile(target);
    return;
  }

  if (!selected) return;
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
  const result = { score, totalUnits };
  if (resolveRound) resolveRound(result);
  resolveRound = null;
}

gridEl.addEventListener('click', onGridClick);
digitPad.addEventListener('click', onDigitPadClick);
document.addEventListener('keydown', onKeydown);

// Resolves with { score, totalUnits } once the local timer hits zero (or
// the puzzle is fully solved early) — totalUnits lets the caller pass the
// same cap to bot simulation without regenerating the puzzle.
export function startRound({ seed, timeLimit, startAt, puzzleType: type, difficulty, gridSize: size, tiles, roster }) {
  return new Promise((resolve) => {
    puzzleType = type;
    gridSize = size;
    selected = null;
    score = 0;
    resolveRound = resolve;

    if (puzzleType === 'slider') {
      const puzzle = generateSlider(seed, difficulty, gridSize);
      board = puzzle.board;
      solvedBoard = puzzle.solved;
      totalUnits = countSliderTiles(gridSize);
      // `tiles` rides the room doc — a room created before this shipped has
      // none, so those rounds keep playing as plain numbers.
      tileSet = tiles || 'numbers';
      fractionValues = tileSet === 'fractions' ? generateFractionValues(seed, totalUnits) : null;
      artUri = tileSet === 'picture' ? scenePictureUri(seed) : '';
    } else if (puzzleType === 'jigsaw') {
      const puzzle = generateJigsaw(seed, difficulty, gridSize);
      placement = puzzle.placement;
      lockedCells = puzzle.locked;
      totalUnits = puzzle.movableCount; // anchors are givens — only YOUR pieces score
      artUri = scenePictureUri(seed);
      pieceFaces = pieceFacesSvg(seed, gridSize, artUri);
      jigsawSelected = -1;
    } else {
      const puzzle = generatePuzzle(seed, difficulty, gridSize);
      givens = puzzle.givens;
      solution = puzzle.solution;
      current = givens.map((row) => row.slice());
      totalUnits = countEditableCells(givens);
    }

    // Slider and Jigsaw rounds get a hint line, and picture rounds also show
    // the goal picture — visible from the countdown on, so players study it
    // before the clock starts.
    if (puzzleType === 'slider') {
      hintEl.textContent =
        tileSet === 'picture' ? 'Rebuild the picture — slide tiles next to the gap.'
        : tileSet === 'fractions' ? 'Smallest fraction first — arrange them in order.'
        : `Put the tiles in order, 1 to ${totalUnits}.`;
      previewEl.hidden = tileSet !== 'picture';
      if (tileSet === 'picture') previewEl.src = artUri;
      topbarEl.hidden = false;
    } else if (puzzleType === 'jigsaw') {
      hintEl.textContent = 'Rebuild the picture — tap two pieces to swap them.';
      previewEl.hidden = false;
      previewEl.src = artUri;
      topbarEl.hidden = false;
    } else {
      topbarEl.hidden = true;
    }

    scoreNote.textContent = `0/${totalUnits} correct`;
    timerNote.textContent = `${formatClock(timeLimit)} round`;
    gridWrap.hidden = false;
    countdownEl.hidden = false;
    gridEl.hidden = true;
    digitPad.hidden = puzzleType !== 'sudoku';
    timeRemainingEl.textContent = '';
    if (roster) renderRoster(roster);

    buildGrid();
    if (puzzleType === 'sudoku') renderDigitPad();

    playBd.classList.add('open');
    playBd.setAttribute('aria-hidden', 'false');
    // Game mode: the nav goes away. A round is timed and full-screen — a stray
    // click on the menu mid-round costs the player the round.
    document.body.classList.add('puzzle-nav-hidden');
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
        gridEl.hidden = false;
        if (puzzleType === 'sudoku') digitPad.hidden = false;
        endAt = anchorAt + timeLimit * 1000;
        rafId = requestAnimationFrame(tick);
        return;
      }
      countdownEl.textContent = Math.ceil(msLeft / 1000);
      setTimeout(tickCountdown, 100);
    })();
  });
}
