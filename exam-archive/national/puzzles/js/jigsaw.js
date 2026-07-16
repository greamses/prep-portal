/* ═══════════════════════════════════════════════════════
   PUZZLES — seeded jigsaw generator
   One seeded picture (art.js) cut into an N×N grid of interlocking pieces.
   The loose pieces start OFF the board, tipped into a heap below the empty
   frame like a real puzzle onto a tabletop — drag one over its home cell
   (or tap it, then tap the cell) and it clicks in and locks. Every client
   in a room shares one `seed`, so the same picture, the same tab layout
   and the same heap appear on every device with zero network traffic —
   same philosophy as sudoku.js/slider.js.

   Border pieces read differently at a glance, exactly like a real jigsaw:
   their outer sides are FLAT (tab = 0 along the frame), so corners show
   two straight sides and edges one. Difficulty is how much help you start
   with: Easy/Medium pre-place (and lock) a seeded handful of anchor
   pieces in the frame, Hard gives none.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed } from './rng.js';

export const JIGSAW_SIZES = [3, 4, 5, 6];
// Share of pieces already sitting at home (locked) when the round starts.
// They score nothing — totalUnits counts only the pieces YOU place.
const LOCKED_FRACTION = { easy: 0.28, medium: 0.12, hard: 0 };

const JIGSAW_TAB_NS = 77177;

// Returns { locked, heap, movableCount }. `locked[cell]` marks the anchors
// pre-placed in the frame; `heap` is every other piece in seeded scatter
// order — { piece, x, y, rot } with x/y as 0..1 fractions of the heap area
// and a resting tilt, later pieces stacking on top of earlier ones.
export function generateJigsaw(seed, difficulty, gridSize) {
  const rng = mulberry32(seed);
  const total = gridSize * gridSize;
  const frac = LOCKED_FRACTION[difficulty] ?? LOCKED_FRACTION.medium;
  const lockedCount = Math.min(Math.round(total * frac), total - 4);

  const cells = Array.from({ length: total }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const locked = new Array(total).fill(false);
  for (let k = 0; k < lockedCount; k++) locked[cells[k]] = true;

  const loose = [];
  for (let i = 0; i < total; i++) if (!locked[i]) loose.push(i + 1);
  for (let i = loose.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [loose[i], loose[j]] = [loose[j], loose[i]];
  }

  const heap = loose.map((piece) => ({
    piece,
    x: rng(),
    y: rng(),
    rot: Math.round((rng() * 2 - 1) * 16),
  }));

  return { locked, heap, movableCount: heap.length };
}

/* ── Piece faces ──────────────────────────────────────────────────────────
   Each piece is one inline SVG: the WHOLE picture, clipped to that piece's
   jigsaw outline. Tab directions are decided once per shared edge (seeded,
   independent of difficulty), so the piece above's outward tab is exactly
   this piece's inward blank — neighbours genuinely interlock, but only
   line up when they're truly adjacent in the finished picture. Tabs
   overhang the square cell by up to 22 units on a 100-unit cell; the
   viewBox carries a 24-unit bleed all round to fit them. */
const CELL = 100;
const BLEED = 24;

const r1 = (x) => Math.round(x * 10) / 10;

// One side of a piece, from (x0,y0) to (x1,y1). `tab` is +1 (bump sticks
// out of this piece), -1 (bump cut into it) or 0 (flat border edge).
// (nx,ny) is this side's outward normal; the profile is symmetric so it
// reads the same whichever direction the side is traversed.
function edgeD(x0, y0, x1, y1, tab, nx, ny) {
  if (!tab) return `L${r1(x1)},${r1(y1)}`;
  const dx = (x1 - x0) / CELL;
  const dy = (y1 - y0) / CELL;
  const pt = (u, v) => `${r1(x0 + dx * u + nx * v * tab)},${r1(y0 + dy * u + ny * v * tab)}`;
  return (
    `L${pt(40, 0)}` +
    `C${pt(50, 0)} ${pt(44, 6)} ${pt(44, 12)}` +   // up the neck (pinched)
    `C${pt(44, 22)} ${pt(56, 22)} ${pt(56, 12)}` + // over the bump
    `C${pt(56, 6)} ${pt(50, 0)} ${pt(60, 0)}` +    // back down
    `L${r1(x1)},${r1(y1)}`
  );
}

// Array indexed by piece number (1..N²) of ready-to-inject SVG strings.
// `artUri` is the shared scene as a data: URI (see art.js) — every piece
// carries the whole image and shows only its own clipped window, so the
// "cutting" costs nothing and the picture follows each piece as it swaps.
export function pieceFacesSvg(seed, gridSize, artUri) {
  const rng = mulberry32(hashSeed(seed, JIGSAW_TAB_NS));
  const g = gridSize;

  // hTabs[r][c]: does piece (r,c) poke a tab RIGHT into (r,c+1)?  (+1/-1)
  // vTabs[r][c]: does piece (r,c) poke a tab DOWN into (r+1,c)?
  const hTabs = [];
  const vTabs = [];
  for (let r = 0; r < g; r++) {
    hTabs.push(Array.from({ length: g - 1 }, () => (rng() < 0.5 ? 1 : -1)));
  }
  for (let r = 0; r < g - 1; r++) {
    vTabs.push(Array.from({ length: g }, () => (rng() < 0.5 ? 1 : -1)));
  }

  const faces = new Array(g * g + 1);
  for (let p = 1; p <= g * g; p++) {
    const r = Math.floor((p - 1) / g);
    const c = (p - 1) % g;
    const top = r === 0 ? 0 : -vTabs[r - 1][c];
    const right = c === g - 1 ? 0 : hTabs[r][c];
    const bottom = r === g - 1 ? 0 : vTabs[r][c];
    const left = c === 0 ? 0 : -hTabs[r][c - 1];

    const d =
      `M0,0` +
      edgeD(0, 0, CELL, 0, top, 0, -1) +
      edgeD(CELL, 0, CELL, CELL, right, 1, 0) +
      edgeD(CELL, CELL, 0, CELL, bottom, 0, 1) +
      edgeD(0, CELL, 0, 0, left, -1, 0) +
      'Z';

    faces[p] =
      `<svg viewBox="${-BLEED} ${-BLEED} ${CELL + 2 * BLEED} ${CELL + 2 * BLEED}" aria-hidden="true">` +
      `<defs><clipPath id="jig-${p}"><path d="${d}"/></clipPath></defs>` +
      `<image href="${artUri}" x="${-c * CELL}" y="${-r * CELL}" width="${g * CELL}" height="${g * CELL}" preserveAspectRatio="none" clip-path="url(#jig-${p})"/>` +
      `<path class="jigsaw-outline" d="${d}" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>` +
      `</svg>`;
  }
  return faces;
}
