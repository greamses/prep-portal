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

import { colorFromWords, parseWorksheet } from "./parse.js";
import { WORLD_CUP_WORKSHEET } from "./reference-art.js";

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

/* ── Santa Claus face ────────────────────────────────────────────────────────
   A hand-built worksheet. The key correction over a naive Santa: shapes paint
   in order (later on top), so the BEARD and hat TRIM are shaped to FRAME the
   skin (a valley-topped beard + a thin hairline band) instead of covering it —
   the light-orange face stays visible. See the layering rule in ai-generate.js. */
const SANTA = `Object: Santa Claus Face
Line 1 {red with red fill}: (-84,56), (-50,92), (-10,124), (30,140), (70,150), (104,150), (96,118), (86,92), (84,56), (0,60), (-84,56)
Line 2 {light orange with light orange fill}: (0,60), (26,57), (48,50), (63,40), (72,24), (75,4), (72,-18), (62,-40), (46,-58), (24,-72), (0,-76), (-24,-72), (-46,-58), (-62,-40), (-72,-18), (-75,4), (-72,24), (-63,40), (-48,50), (-26,57), (0,60)
Line 3 {black with white fill}: (-86,76), (0,80), (86,70), (86,56), (0,60), (-86,58), (-86,76)
Line 4 {black with white fill}: (-72,30), (-56,10), (-36,-4), (-18,-13), (0,-16), (18,-13), (36,-4), (56,10), (72,30), (78,2), (72,-34), (56,-64), (32,-86), (0,-96), (-32,-86), (-56,-64), (-72,-34), (-78,2), (-72,30)
Line 5 {black with white fill}: (0,-3), (14,7), (32,9), (46,5), (42,-7), (26,-9), (10,-5), (0,-9), (-10,-5), (-26,-9), (-42,-7), (-46,5), (-32,9), (-14,7), (0,-3)
Line 6 {black with white fill}: (-42,46), (-32,52), (-18,50), (-12,44), (-24,43), (-36,43), (-42,46)
Line 7 {black with white fill}: (42,46), (32,52), (18,50), (12,44), (24,43), (36,43), (42,46)
Line 8 {black with black fill}: (-19,34), (-22,40), (-26,41), (-30,40), (-33,34), (-30,28), (-26,27), (-22,28), (-19,34)
Line 9 {black with black fill}: (33,34), (30,40), (26,41), (22,40), (19,34), (22,28), (26,27), (30,28), (33,34)
Line 10 {red with pink fill}: (11,15), (8,23), (0,26), (-8,23), (-11,15), (-8,7), (0,4), (8,7), (11,15)
Line 11 {pink with pink fill}: (-37,2), (-40,9), (-46,11), (-52,9), (-55,2), (-52,-5), (-46,-7), (-40,-5), (-37,2)
Line 12 {pink with pink fill}: (55,2), (52,9), (46,11), (40,9), (37,2), (40,-5), (46,-7), (52,-5), (55,2)
Line 13 {black with white fill}: (118,150), (113,162), (104,166), (95,162), (90,150), (95,138), (104,134), (113,138), (118,150)`;

/** Wrap a worksheet string (parsed by parse.js) into a built-in puzzle doc. */
function buildFromWorksheet(id, title, prompt, text, difficulty = "hard") {
  const parsed = parseWorksheet(text);
  const flat = [];
  let m = 0;
  for (const s of parsed)
    for (const p of s.points) {
      m = Math.max(m, Math.abs(p.x), Math.abs(p.y));
      flat.push({ x: p.x, y: p.y });
    }
  const half = Math.ceil((m + 8) / 10) * 10;
  return {
    id,
    builtin: true,
    title,
    prompt,
    difficulty,
    grid: { xMin: -half, xMax: half, yMin: -half, yMax: half },
    shapes: parsed.map((s) => ({
      points: s.points.map((p) => ({ x: p.x, y: p.y })),
      closed: !!s.closed,
      strokeColor: s.strokeColor || null,
      fillColor: s.fillColor || null,
    })),
    points: flat,
    closed: parsed.some((s) => s.closed),
  };
}

/** The shipped hard puzzles (computed once at module load). */
export const BUILTIN_PUZZLES = [
  buildFromWorksheet(
    "builtin-worldcup",
    "World Cup Trophy",
    "Plot the trophy: cup, base and handles, in colour.",
    WORLD_CUP_WORKSHEET,
    "medium"
  ),
  buildFromWorksheet(
    "builtin-santa",
    "Santa Claus Face",
    "Plot Santa: hat, beard and face. The beard frames the face so the skin shows.",
    SANTA,
    "hard"
  ),
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
