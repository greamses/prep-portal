/* ============================================================================
   Cartesian Art — built-in hard puzzles
   ----------------------------------------------------------------------------
   Three ready-made "hard" challenges that ship with the studio so the picker
   always has a few genuinely demanding (300-point) detailed arts, even before
   an admin authors any. Each is a parametric curve sampled to exactly 300
   lattice points, packaged in the SAME shape format Firestore puzzles use, so
   the picker, thumbnails and puzzle mode treat them identically. They are
   read-only: the picker hides Edit/Delete for anything flagged `builtin`.
   ========================================================================== */

import { colorFromWords } from "./parse.js";

const TAU = Math.PI * 2;

/** Sample n points from a parametric fn(u in [0,1)) → {x,y}; round to lattice. */
function sample(n, fn) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const p = fn(i / n, i);
    pts.push({ x: Math.round(p.x), y: Math.round(p.y) });
  }
  return pts;
}

/* 1 — Butterfly curve (Temple H. Fay). One flowing open trace. */
function butterfly(n) {
  return sample(n, (u) => {
    const t = u * 12 * Math.PI;
    const r =
      Math.exp(Math.sin(t)) -
      2 * Math.cos(4 * t) +
      Math.pow(Math.sin((2 * t - Math.PI) / 24), 5);
    return { x: 42 * r * Math.sin(t), y: 42 * r * Math.cos(t) };
  });
}

/* 2 — Rose mandala: symmetric flower, 8 big petals + 24 fine ripples. */
function mandala(n) {
  return sample(n, (u) => {
    const t = u * TAU;
    const r = 110 + 60 * Math.cos(8 * t) + 18 * Math.cos(24 * t);
    return { x: r * Math.cos(t), y: r * Math.sin(t) };
  });
}

/* 3 — Guilloché rosette: detailed, asymmetric harmonic curve (a "spirograph"). */
function guilloche(n) {
  return sample(n, (u) => {
    const t = u * TAU;
    return {
      x: 150 * Math.cos(t) + 70 * Math.cos(5 * t) + 24 * Math.cos(-9 * t),
      y: 150 * Math.sin(t) + 70 * Math.sin(5 * t) + 24 * Math.sin(-9 * t),
    };
  });
}

/** Wrap a point list into a built-in puzzle doc (auto-sizes the grid window). */
function build(id, title, prompt, points, { stroke, fill, closed } = {}) {
  let m = 0;
  for (const p of points) m = Math.max(m, Math.abs(p.x), Math.abs(p.y));
  const half = Math.ceil((m + 8) / 10) * 10; // nice, padded, square window
  return {
    id,
    builtin: true,
    title,
    prompt,
    difficulty: "hard",
    grid: { xMin: -half, xMax: half, yMin: -half, yMax: half },
    shapes: [
      {
        points,
        closed: !!closed,
        strokeColor: colorFromWords(stroke),
        fillColor: colorFromWords(fill),
      },
    ],
    // flattened union of every vertex — used as the connect-the-dots targets
    points: points.map((p) => ({ x: p.x, y: p.y })),
    closed: !!closed,
  };
}

/** The three shipped hard puzzles (computed once at module load). */
export const BUILTIN_PUZZLES = [
  build(
    "builtin-butterfly",
    "Butterfly Curve",
    "Plot all 300 points in order to trace Fay's famous butterfly curve.",
    butterfly(300),
    { stroke: "purple", closed: false }
  ),
  build(
    "builtin-mandala",
    "Rose Mandala",
    "A symmetric eight-petal mandala — 300 points around the bloom.",
    mandala(300),
    { stroke: "pink", fill: "light yellow", closed: true }
  ),
  build(
    "builtin-guilloche",
    "Guilloché Star",
    "A detailed, asymmetric harmonic rosette traced in 300 points.",
    guilloche(300),
    { stroke: "indigo", closed: true }
  ),
];
