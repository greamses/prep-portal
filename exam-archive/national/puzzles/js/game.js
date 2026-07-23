/* ═══════════════════════════════════════════════════════
   PUZZLES — round loop
   3-2-1 "get ready" beat from a shared startAt (rendered on the grid
   itself, same as Drills' card), then a free-form NxN grid whose
   interaction depends on the active puzzle:
     - sudoku: click a cell, type a digit — physical keys or the on-screen
       digit pad. Score is a live count of correctly-filled editable cells.
     - slider: click any tile adjacent to the blank (or use arrow keys) to
       slide it. Score is a live count of tiles in their solved position.
     - jigsaw: the frame starts empty and the loose pieces sit heaped below
       it. Drag a piece over its home cell (or tap it, then tap the cell)
       and it clicks in and locks; score is a live count of pieces placed.
   Either way, a full solve ends the round early, and timing after
   activation is entirely local (startAt/timeLimit) — no further server
   dependency during play.
═══════════════════════════════════════════════════════ */
import { generatePuzzle, scoreGrid, countEditableCells } from './sudoku.js';
import { generateSlider, scoreSlider, countSliderTiles, movableIndices, generateFractionValues } from './slider.js';
import { generateJigsaw, pieceFacesSvg } from './jigsaw.js';
import { generateMapJigsaw, mapFrameSvg, statePieceFullSvg, SNAP_TOLERANCE, MAP_W, ZONE_FILL, ZONES, STATES } from './mapjig.js';

// The zone colour key, shown in the map's header (where the hint would sit).
const zoneLegendHtml = () => '<span class="mapjig-legend">'
  + ZONES.map((z) => `<span class="mapjig-legend-item"><i style="background:${ZONE_FILL[z.key]}"></i>${z.label}</span>`).join('')
  + '</span>';
import { photoPictureUrl } from './photos.js';
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
const hintEl = $('puzzle-grid-hint');
const heapEl = $('puzzle-jigsaw-heap');

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
let artUri = ''; // picture/jigsaw — the seeded scene (or the player's own photo) as a data: URI

// Jigsaw-only state
let lockedCells = null; // pre-placed anchor cells (difficulty givens)
let pieceFaces = null; // piece number → its clipped-picture SVG face
let jigsawPlaced = 0; // movable pieces delivered home so far
let jigsawPicked = null; // tap-selected loose piece element, or null
let jigsawDrag = null; // live pointer-drag state, or null
// Map jigsaw (Map of Nigeria): a jigsaw whose pieces are the 37 states. Same
// heap/drag/lock/score flow, but the frame is a map of named slots and a piece
// goes home into its own state's slot (found by elementFromPoint), not a grid cell.
let mapMode = false;      // this jigsaw is the Map of Nigeria (assemble on the map)
let mapShowStates = true; // State-maps toggle: draw the internal state outlines as a guide
let mapShowNames = true;  // draw each piece's state name
let mapHeap = null;       // the poured pieces [{ piece, ox, oy }]

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
// The frame is a grid of empty sockets (plus any pre-placed anchors); the
// loose pieces live in a heap element below it. A piece only goes in at its
// own home cell — a wrong drop bounces back to the pile — so everything
// placed is correct, and placed pieces lock for good.
function fillJigsawCell(cell, { flash = false } = {}) {
  const el = gridEl.children[cell];
  el.className = 'jigsaw-cell is-filled';
  el.disabled = true;
  el.innerHTML = pieceFaces[cell + 1];
  if (flash) {
    el.classList.add('correct-flash');
    setTimeout(() => el.classList.remove('correct-flash'), 380);
  }
}

function buildJigsawGrid() {
  gridEl.classList.add('jigsaw-grid');
  for (let i = 0; i < gridSize * gridSize; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'jigsaw-cell';
    btn.dataset.index = String(i);
    gridEl.appendChild(btn);
    if (lockedCells[i]) fillJigsawCell(i);
  }
}

// Tips the loose pieces onto the "tabletop" below the frame: absolutely
// positioned at seeded scatter spots with a resting tilt, stacking in DOM
// order like a real heap. Border pieces are spottable by their flat sides.
// The tray is square and pieces are square, so one piece-width fraction
// (95%/gridSize) bounds the scatter equally on both axes.
function buildJigsawHeap(heap) {
  heapEl.innerHTML = '';
  heapEl.classList.remove('mapjig-heap');
  heapEl.style.setProperty('--grid-size', gridSize);
  const span = 100 - 95 / gridSize; // keep whole pieces inside the tray
  heap.forEach((h) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'jigsaw-loose';
    btn.dataset.piece = String(h.piece);
    btn.style.left = `${(h.x * span).toFixed(2)}%`;
    btn.style.top = `${(h.y * span).toFixed(2)}%`;
    btn.style.setProperty('--rot', `${h.rot}deg`);
    btn.innerHTML = pieceFaces[h.piece];
    heapEl.appendChild(btn);
  });
}

function setJigsawPicked(el) {
  if (jigsawPicked) jigsawPicked.classList.remove('is-selected');
  jigsawPicked = el;
  if (el) el.classList.add('is-selected');
}

// Deliver a loose piece home: fill its cell (gliding in from wherever the
// piece was let go), drop it from the heap, and count it.
function placeJigsawPiece(looseEl, cell, fromRect) {
  if (jigsawPicked === looseEl) setJigsawPicked(null);
  looseEl.remove();
  fillJigsawCell(cell, { flash: true });
  const el = gridEl.children[cell];
  if (el.animate && fromRect) {
    const to = el.getBoundingClientRect();
    el.animate(
      [
        { transform: `translate(${fromRect.left - to.left}px, ${fromRect.top - to.top}px)` },
        { transform: 'translate(0, 0)' },
      ],
      { duration: 170, easing: 'ease-out' },
    );
  }
  jigsawPlaced += 1;
  score = jigsawPlaced;
  scoreNote.textContent = `${score}/${totalUnits} correct`;
  if (score >= totalUnits) endRound();
}

function jigsawShake(el) {
  el.classList.add('is-wrong');
  setTimeout(() => el.classList.remove('is-wrong'), 420);
}

// Which frame cell (if any) a viewport point is over. At most 36 cells, and
// only ever consulted on drop — a rect sweep is plenty.
function jigsawCellAt(x, y) {
  const cells = gridEl.children;
  for (let i = 0; i < cells.length; i++) {
    const r = cells[i].getBoundingClientRect();
    if (x >= r.left && x < r.right && y >= r.top && y < r.bottom) return i;
  }
  return -1;
}

// Pointer-driven drag (mouse + touch alike, via setPointerCapture). A press
// that never travels is a tap: it picks the piece up / puts it back down for
// the tap-piece-then-tap-cell path (see onGridClick).
function onHeapPointerDown(e) {
  if (!active) return;
  const el = e.target.closest('.jigsaw-loose');
  if (!el) return;
  e.preventDefault();
  jigsawDrag = { el, piece: parseInt(el.dataset.piece, 10), sx: e.clientX, sy: e.clientY, moved: false };
  // Capture can refuse (pointer already gone, synthetic event) — the drag
  // still works for any pointer that stays over the heap, so never let a
  // capture failure kill the tap path.
  try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
}

function onHeapPointerMove(e) {
  const d = jigsawDrag;
  if (!d) return;
  const dx = e.clientX - d.sx;
  const dy = e.clientY - d.sy;
  if (!d.moved && Math.hypot(dx, dy) > 6) {
    d.moved = true;
    setJigsawPicked(null);
    d.el.classList.add('is-dragging');
  }
  if (d.moved) d.el.style.transform = `translate(${dx}px, ${dy}px)`;
}

function onHeapPointerEnd(e) {
  const d = jigsawDrag;
  jigsawDrag = null;
  if (!d) return;
  if (!d.moved) {
    // A plain tap: pick the piece up (or put it back down).
    setJigsawPicked(jigsawPicked === d.el ? null : d.el);
    return;
  }
  d.el.classList.remove('is-dragging');
  const rect = d.el.getBoundingClientRect(); // where it was let go
  d.el.style.transform = '';
  const cancelled = e.type === 'pointercancel';
  const cell = cancelled ? -1 : jigsawCellAt(e.clientX, e.clientY);
  if (cell === d.piece - 1) {
    placeJigsawPiece(d.el, cell, rect);
    return;
  }
  // Not home — glide back to its heap spot; shake only if it was actually
  // dropped on the board (a drop back onto the pile isn't "wrong").
  bounceLoose(d.el, rect);
  if (cell !== -1) jigsawShake(d.el);
}

// Glide a loose piece back to where it rests in the heap.
function bounceLoose(el, fromRect) {
  if (!el.animate) return;
  const home = el.getBoundingClientRect();
  el.animate(
    [
      { transform: `translate(${fromRect.left - home.left}px, ${fromRect.top - home.top}px)` },
      { transform: 'translate(0, 0)' },
    ],
    { duration: 220, easing: 'ease-out' },
  );
}

// ── Map jigsaw (Map of Nigeria) — assemble on the map ──────────────────────
// No separate pile: the 37 states are poured onto the map, full size, as
// overlapping pieces you drag to where they belong. Each piece is the whole-map
// coordinate system showing just its state (mapjig.js), so at offset (0,0) it
// sits exactly home. Drag freely; a piece SNAPS + locks when it lands within the
// difficulty's tolerance of home. `mapOffsets[state] = {x, y}` (map units).
let mapOffsets = null;
let mapSnapTol = 52;
let mapDrag = null;

function buildMapGrid() {
  gridEl.classList.add('mapjig-grid');
  gridEl.innerHTML = mapFrameSvg(mapShowStates); // the guide beneath
  for (const h of mapHeap) {
    gridEl.insertAdjacentHTML('beforeend', statePieceFullSvg(h.piece, h.ox, h.oy, mapShowNames));
  }
}

// px → map units for the currently-rendered map.
const mapScale = () => (gridEl.getBoundingClientRect().width || 1) / MAP_W;
const mapPieceEl = (state) => gridEl.querySelector(`.mapjig-piece[data-state="${state}"]`);
const setPieceOffset = (state, x, y) => {
  const g = mapPieceEl(state)?.querySelector('.mapjig-pg');
  if (g) g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
};

function onMapPointerDown(e) {
  if (!active || !mapMode) return;
  const path = e.target.closest('.mapjig-ppath');
  if (!path) return;
  const sv = path.closest('.mapjig-piece');
  if (!sv || sv.classList.contains('is-done')) return;
  e.preventDefault();
  const state = parseInt(sv.dataset.state, 10);
  const o = mapOffsets[state];
  mapDrag = { sv, state, sx: e.clientX, sy: e.clientY, ox: o.x, oy: o.y };
  sv.classList.add('is-dragging');
  gridEl.appendChild(sv); // raise to the top of the pile
  try { sv.setPointerCapture(e.pointerId); } catch { /* noop */ }
}

function onMapPointerMove(e) {
  const d = mapDrag;
  if (!d) return;
  const s = mapScale();
  setPieceOffset(d.state, d.ox + (e.clientX - d.sx) / s, d.oy + (e.clientY - d.sy) / s);
}

// Is the piece's current position over its own ZONE's territory? (drop-by-zone)
// Tests the state's centroid, now at (cx+ox, cy+oy) in map units, against every
// same-zone slot in the guide via SVG isPointInFill.
function pieceInOwnZone(state, ox, oy) {
  const frame = gridEl.querySelector('.mapjig-frame');
  if (!frame) return false;
  const zone = STATES[state].zone;
  const px = STATES[state].cx + ox, py = STATES[state].cy + oy;
  let pt;
  try { pt = new DOMPoint(px, py); } catch { pt = { x: px, y: py }; }
  for (const slot of frame.querySelectorAll('.mapjig-slot')) {
    const s = parseInt(slot.dataset.state, 10);
    if (STATES[s].zone !== zone || !slot.isPointInFill) continue;
    if (slot.isPointInFill(pt)) return true;
  }
  return false;
}

function onMapPointerEnd(e) {
  const d = mapDrag;
  mapDrag = null;
  if (!d) return;
  d.sv.classList.remove('is-dragging');
  const s = mapScale();
  let x = d.ox + (e.clientX - d.sx) / s;
  let y = d.oy + (e.clientY - d.sy) / s;
  // Snap home if it landed anywhere in its own ZONE (drop-by-zone), or right on
  // its exact spot. A drop in the wrong zone stays loose.
  const snaps = e.type !== 'pointercancel'
    && (Math.hypot(x, y) <= mapSnapTol || pieceInOwnZone(d.state, x, y));
  if (snaps) {
    // Snap it home and lock it into the assembling map.
    x = 0; y = 0;
    setPieceOffset(d.state, 0, 0);
    d.sv.classList.add('is-done');
    const path = d.sv.querySelector('.mapjig-ppath');
    if (path) { path.classList.add('correct-flash'); setTimeout(() => path.classList.remove('correct-flash'), 380); }
    jigsawPlaced += 1;
    score = jigsawPlaced;
    scoreNote.textContent = `${score}/${totalUnits} correct`;
    if (score >= totalUnits) endRound();
  } else {
    // Free placement — leave it wherever it was let go (nothing returns to a pile).
    setPieceOffset(d.state, x, y);
  }
  mapOffsets[d.state] = { x, y };
}

// ── Shared input dispatch ─────────────────────────────────────────────────
function buildGrid() {
  gridEl.innerHTML = '';
  gridEl.classList.remove('sudoku-grid', 'slider-grid', 'slider-grid--fractions', 'slider-grid--picture', 'jigsaw-grid');
  gridEl.style.setProperty('--grid-size', gridSize);
  gridEl.classList.remove('mapjig-grid');
  if (puzzleType === 'slider') buildSliderGrid();
  else if (puzzleType === 'jigsaw') { if (mapMode) buildMapGrid(); else buildJigsawGrid(); }
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
    if (mapMode) return; // the map jigsaw is drag-only (pointer handlers on the grid)
    // Second half of the tap-piece-then-tap-cell path: with a loose piece
    // picked, tapping its home socket places it; any other socket says no.
    const btn = e.target.closest('.jigsaw-cell');
    if (!btn || btn.disabled || !jigsawPicked) return;
    const cell = parseInt(btn.dataset.index, 10);
    const piece = parseInt(jigsawPicked.dataset.piece, 10);
    if (cell === piece - 1) placeJigsawPiece(jigsawPicked, cell, jigsawPicked.getBoundingClientRect());
    else jigsawShake(jigsawPicked);
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
// setPointerCapture routes the whole drag to the pressed piece, and those
// events bubble here — so one set of listeners covers every loose piece.
heapEl.addEventListener('pointerdown', onHeapPointerDown);
heapEl.addEventListener('pointermove', onHeapPointerMove);
heapEl.addEventListener('pointerup', onHeapPointerEnd);
heapEl.addEventListener('pointercancel', onHeapPointerEnd);

// The map jigsaw is assembled ON the grid — drag pieces straight on the map.
gridEl.addEventListener('pointerdown', onMapPointerDown);
gridEl.addEventListener('pointermove', onMapPointerMove);
gridEl.addEventListener('pointerup', onMapPointerEnd);
gridEl.addEventListener('pointercancel', onMapPointerEnd);

// Resolves with { score, totalUnits } once the local timer hits zero (or
// the puzzle is fully solved early) — totalUnits lets the caller pass the
// same cap to bot simulation without regenerating the puzzle. `customArt`
// is the player's own uploaded photo (a data: URI) for picture rounds —
// purely local and never synced: the seed decides the puzzle's STRUCTURE
// (cuts, anchors, heap), so what the picture shows can differ per player
// without touching fairness.
export function startRound({ seed, timeLimit, startAt, puzzleType: type, difficulty, gridSize: size, tiles, customArt, roster }) {
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
      artUri = tileSet === 'picture' ? (customArt || scenePictureUri(seed)) : '';
    } else if (puzzleType === 'jigsaw') {
      // `tiles` rides the room doc: 'nigeria' is the map jigsaw with its state
      // outlines shown, 'nigeria-blank' hides them (State-maps off); anything
      // else (incl. rooms made before this shipped) is the classic photo jigsaw.
      mapMode = tiles === 'nigeria' || tiles === 'nigeria-blank';
      jigsawPlaced = 0;
      jigsawPicked = null;
      jigsawDrag = null;
      if (mapMode) {
        mapShowStates = tiles !== 'nigeria-blank';
        mapSnapTol = SNAP_TOLERANCE[difficulty] ?? SNAP_TOLERANCE.medium;
        const puzzle = generateMapJigsaw(seed); // nothing pre-placed
        mapHeap = puzzle.heap;
        mapOffsets = {};
        for (const h of mapHeap) mapOffsets[h.piece] = { x: h.ox, y: h.oy };
        totalUnits = puzzle.movableCount;
      } else {
        const puzzle = generateJigsaw(seed, difficulty, gridSize);
        lockedCells = puzzle.locked;
        totalUnits = puzzle.movableCount; // anchors are givens — only YOUR pieces score
        // A free online photo by default (seeded, so every client agrees), or
        // the player's own uploaded picture when they chose one.
        artUri = customArt || photoPictureUrl(seed);
        pieceFaces = pieceFacesSvg(seed, gridSize, artUri);
        buildJigsawHeap(puzzle.heap);
      }
    } else {
      const puzzle = generatePuzzle(seed, difficulty, gridSize);
      givens = puzzle.givens;
      solution = puzzle.solution;
      current = givens.map((row) => row.slice());
      totalUnits = countEditableCells(givens);
    }

    // Slider and Jigsaw rounds get a hint line. No reference image — the
    // pieces/tiles themselves are the only picture you get, so rebuilding
    // it stays a genuine puzzle.
    if (puzzleType === 'slider') {
      hintEl.textContent =
        tileSet === 'picture' ? 'Rebuild the picture — slide tiles next to the gap.'
        : tileSet === 'fractions' ? 'Smallest fraction first — arrange them in order.'
        : `Put the tiles in order, 1 to ${totalUnits}.`;
      topbarEl.hidden = false;
    } else if (puzzleType === 'jigsaw') {
      if (mapMode) {
        // The header carries the zone colour key instead of a hint (the drag is
        // obvious, and the key earns its place on the colour-by-zone map).
        hintEl.classList.add('puzzle-grid-hint--legend');
        hintEl.innerHTML = zoneLegendHtml();
      } else {
        hintEl.classList.remove('puzzle-grid-hint--legend');
        hintEl.textContent = 'Rebuild the picture — drag pieces from the pile into the frame.';
      }
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
    heapEl.hidden = true; // jigsaw's pile appears with the grid, after the countdown
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
        if (puzzleType === 'jigsaw' && !mapMode) heapEl.hidden = false; // map mode has no pile
        endAt = anchorAt + timeLimit * 1000;
        rafId = requestAnimationFrame(tick);
        return;
      }
      countdownEl.textContent = Math.ceil(msLeft / 1000);
      setTimeout(tickCountdown, 100);
    })();
  });
}
