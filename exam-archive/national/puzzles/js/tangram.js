/* ═══════════════════════════════════════════════════════
   PUZZLES — Tangram geometry, figures and placement rules

   The seven-piece dissection puzzle: fit all seven pieces into a silhouette.
   Same seeded-determinism contract as the other puzzles — the figure comes
   from the room's content and the scatter from its seed, so every client
   lays out an identical round with zero network traffic.

   THE FIGURES ARE NOT HAND-WRITTEN. Every arrangement below was found by a
   backtracking solver and checked with real polygon maths (exact convex
   intersection area): the right seven shapes, no two overlapping, all
   joined into one figure. Three arrangements I derived by hand on paper
   first were each wrong in a way that looked perfectly plausible written
   down — one of them silently used two medium triangles and no
   parallelogram. If you add a figure, run it through that verifier rather
   than trusting the coordinates.

   Scaled so the classic square is 8x8 (area 64) and every canonical vertex
   is an integer. Each piece carries its 45 degrees in its own shape — the
   triangles put a hypotenuse on an axis, the square is a diamond, the
   parallelogram is slanted — which is why every figure here needs only
   quarter-turns, and why the game rotates in 90-degree steps rather than
   45: half of an eight-way rotation could never match anything.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed } from './rng.js';

export const PIECES = {
  large: [[0, 0], [8, 0], [4, 4]],          // hyp 8, area 16
  medium: [[0, 0], [4, 0], [0, 4]],         // legs 4, area 8
  small: [[0, 0], [4, 0], [2, 2]],          // hyp 4, area 4
  square: [[2, 0], [4, 2], [2, 4], [0, 2]], // side 2√2, area 8
  para: [[2, 0], [6, 0], [4, 2], [0, 2]],   // sides 4 and 2√2, area 8
};

export const PIECE_LABELS = {
  large: 'Large triangle', medium: 'Medium triangle', small: 'Small triangle',
  square: 'Square', para: 'Parallelogram',
};

/* A piece that looks the same after a turn must accept that turn. The
   triangles have no rotational symmetry at all (a small triangle upside
   down is visibly wrong); the square repeats every quarter-turn; the
   parallelogram every half-turn. Getting this wrong in either direction is
   maddening to play: too strict and a correctly-placed piece is refused,
   too loose and a wrong one snaps in. */
export const SYMMETRY = { large: 360, medium: 360, small: 360, square: 90, para: 180 };

/* How close counts. Bigger than it sounds — these are units where the whole
   classic square is 8 across, so even 'hard' forgives about a tenth of the
   figure. The puzzle is working out WHICH piece goes where, never pixel
   dexterity. */
export const SNAP_TOLERANCE = { easy: 1.8, medium: 1.2, hard: 0.8 };

const rotate = ([x, y], deg) => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r); const s = Math.sin(r);
  return [x * c - y * s, x * s + y * c];
};

/** A placement ({ piece, deg, x, y }) as absolute polygon points. */
export function piecePolygon({ piece, deg = 0, x = 0, y = 0 }) {
  return PIECES[piece].map((p) => {
    const [rx, ry] = rotate(p, deg);
    return [Math.round((rx + x) * 1e4) / 1e4, Math.round((ry + y) * 1e4) / 1e4];
  });
}

const centroidOf = (poly) => [
  poly.reduce((s, p) => s + p[0], 0) / poly.length,
  poly.reduce((s, p) => s + p[1], 0) / poly.length,
];

/** Where a placement actually sits — what "near enough" is measured between. */
export const placementCentre = (placement) => centroidOf(piecePolygon(placement));

/** Two turns are the same turn for this piece? */
export function sameFacing(piece, a, b) {
  const period = SYMMETRY[piece];
  const diff = (((a - b) % period) + period) % period;
  return diff < 1 || period - diff < 1;
}

/* ── The figures ─────────────────────────────────────────────────────────
   Solver output, verified. `pieces` is the solution: one placement per
   tangram piece, which is both the answer key and (drawn filled, with no
   internal edges) the silhouette itself. */
const RAW_FIGURES = [
  {
    key: 'square',
    label: 'Square',
    hint: 'The classic one — and the hardest.',
    pieces: [
      { piece: 'large', deg: 0, x: 0, y: 0 },
      { piece: 'large', deg: 270, x: 0, y: 8 },
      { piece: 'para', deg: 0, x: 0, y: 6 },
      { piece: 'small', deg: 180, x: 6, y: 6 },
      { piece: 'square', deg: 0, x: 4, y: 2 },
      { piece: 'medium', deg: 180, x: 8, y: 8 },
      { piece: 'small', deg: 90, x: 8, y: 0 },
    ],
  },
  {
    key: 'triangle',
    label: 'Triangle',
    hint: 'All seven pieces, one big triangle.',
    pieces: [
      { piece: 'large', deg: 180, x: 8, y: 8 },
      { piece: 'large', deg: 90, x: 8, y: 0 },
      { piece: 'para', deg: 90, x: 10, y: 0 },
      { piece: 'medium', deg: 270, x: 8, y: 8 },
      { piece: 'small', deg: 270, x: 10, y: 6 },
      { piece: 'square', deg: 0, x: 10, y: 4 },
      { piece: 'small', deg: 180, x: 16, y: 8 },
    ],
  },
  {
    key: 'rectangle',
    label: 'Rectangle',
    hint: 'Twice as long as it is wide.',
    pieces: [
      { piece: 'large', deg: 0, x: -4, y: 4 },
      { piece: 'large', deg: 180, x: 4, y: 4 },
      { piece: 'medium', deg: 90, x: 4, y: 8 },
      { piece: 'para', deg: 0, x: 0, y: 6 },
      { piece: 'small', deg: 180, x: 6, y: 6 },
      { piece: 'square', deg: 0, x: 4, y: 6 },
      { piece: 'small', deg: 270, x: 4, y: 12 },
    ],
  },
  {
    key: 'parallelogram',
    label: 'Parallelogram',
    hint: 'A square that has been pushed over.',
    pieces: [
      { piece: 'large', deg: 0, x: 0, y: 0 },
      { piece: 'large', deg: 90, x: 8, y: 0 },
      { piece: 'para', deg: 90, x: 10, y: 0 },
      { piece: 'medium', deg: 270, x: 8, y: 8 },
      { piece: 'small', deg: 270, x: 10, y: 6 },
      { piece: 'square', deg: 0, x: 10, y: 4 },
      { piece: 'small', deg: 180, x: 16, y: 8 },
    ],
  },
];

export const FIGURE_KEYS = RAW_FIGURES.map((f) => f.key);

// Each figure is normalised to sit at the origin, then centred on the board
// below — the solver's coordinates are wherever its search happened to land
// (the rectangle's run out to x = -4), which is no basis for a layout.
function bboxOf(placements) {
  const pts = placements.flatMap(piecePolygon);
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

export const FIGURES = RAW_FIGURES.map((fig) => {
  const b = bboxOf(fig.pieces);
  return {
    ...fig,
    w: b.x1 - b.x0,
    h: b.y1 - b.y0,
    pieces: fig.pieces.map((p) => ({ ...p, x: p.x - b.x0, y: p.y - b.y0 })),
  };
});

export const figureFor = (key) => FIGURES.find((f) => f.key === key) || FIGURES[0];

/* ── The board ───────────────────────────────────────────────────────────
   One square playfield: the figure sits in the middle, the seven loose
   pieces start scattered around it. Deliberately NOT a tight fit — a piece
   dropped just outside the silhouette must still be on the board. */
export const BOARD = 30;

/**
 * A round's layout: where the figure sits, and where each loose piece starts.
 * Seeded, so every client in the room gets the identical scatter.
 */
export function layoutRound(seed, figureKey) {
  const figure = figureFor(figureKey);
  const rng = mulberry32(hashSeed(seed, 8800));

  // Centre the figure.
  const ox = (BOARD - figure.w) / 2;
  const oy = (BOARD - figure.h) / 2;
  const slots = figure.pieces.map((p, i) => {
    const placement = { ...p, x: p.x + ox, y: p.y + oy };
    return { ...placement, index: i, centre: placementCentre(placement) };
  });

  // Scatter the loose pieces around the figure's box, never on top of it —
  // the silhouette is the question, so it has to stay readable.
  const margin = { x0: ox - 1, y0: oy - 1, x1: ox + figure.w + 1, y1: oy + figure.h + 1 };
  const taken = [];
  const pieces = slots.map((slot, i) => {
    const deg = 90 * Math.floor(rng() * 4);
    let spot = null;
    for (let tries = 0; tries < 200 && !spot; tries++) {
      const x = 3 + rng() * (BOARD - 6);
      const y = 3 + rng() * (BOARD - 6);
      const inFigure = x > margin.x0 - 3 && x < margin.x1 + 3 && y > margin.y0 - 3 && y < margin.y1 + 3;
      if (inFigure) continue;
      if (taken.some((t) => Math.hypot(t[0] - x, t[1] - y) < 5)) continue;
      spot = [x, y];
    }
    // Every seed lands eventually, but a scatter must never fail to produce
    // a piece — fall back to a spot on the board's edge.
    if (!spot) spot = [3 + (i % 4) * 7, i < 4 ? 3 : BOARD - 3];
    taken.push(spot);

    // `x`/`y` translate the canonical shape, so aim the piece's CENTRE at
    // the scatter spot rather than its arbitrary origin vertex.
    const c = placementCentre({ piece: slot.piece, deg, x: 0, y: 0 });
    return {
      id: i,
      piece: slot.piece,
      deg,
      x: Math.round((spot[0] - c[0]) * 100) / 100,
      y: Math.round((spot[1] - c[1]) * 100) / 100,
      placed: false,
    };
  });

  return { figure, slots, pieces };
}

/**
 * Which empty slot this piece has just been dropped into, or -1. A slot
 * takes any piece of its own KIND — the two large triangles are the same
 * shape, so refusing one because it is "the other one" would be nonsense.
 */
export function slotFor(piece, slots, tolerance) {
  const centre = placementCentre(piece);
  let best = -1;
  let bestDist = Infinity;
  slots.forEach((slot, i) => {
    if (slot.filled) return;
    if (slot.piece !== piece.piece) return;
    if (!sameFacing(slot.piece, slot.deg, piece.deg)) return;
    const d = Math.hypot(slot.centre[0] - centre[0], slot.centre[1] - centre[1]);
    if (d <= tolerance && d < bestDist) { best = i; bestDist = d; }
  });
  return best;
}

export const pointsAttr = (poly) => poly.map(([x, y]) => `${x},${y}`).join(' ');
