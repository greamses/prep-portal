/* ============================================================================
   Algebra Workbook — CHAPTER 8, last section: QUADRATICS SOLVED BY GRAPH
   ----------------------------------------------------------------------------
   Completing the square solves x² + bx + c = 0 on paper. The graph solves it
   by looking: y = x² + bx + c is a U, and the answers are where the U meets
   the line that says what it must equal.

     table and plot        y for each x around the bottom of the U, plotted
                           (tapped on screen) — it is a U, not a line
     roots and turning     where it crosses the x axis (y = 0) are the roots;
     point                 halfway between them is the line of symmetry, and
                           on it the lowest point
     = k                   x² + bx + c = k where the U meets the line y = k
     a line and the curve  (Middle+) a line and the U together: where they
                           cross solves both — the graphical method of chapter
                           9, with a curve
     how many roots        crosses (two), just touches (one), misses (none):
                           read from where the bottom of the U is

   Every U is made from whole-number roots or a whole-number turning point, so
   every answer sits on a corner of the grid.
   ========================================================================== */

import { planeSvg } from "./gridart.js";
import { cellFor } from "./ex-graphs.js";
import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq">${html}</p>`;
const art = (html) => `<div class="ab-art">${html}</div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const side = (a, b) => `<div class="fn-side">${a}<div class="fn-lines">${b}</div></div>`;
const xyTable = (xs, ys) =>
  `<table class="fn-table gr-table"><tbody><tr><th>x</th>${xs.map((x) => `<td>${num(x)}</td>`).join("")}</tr>` +
  `<tr><th>y</th>${ys.map((y) => `<td>${y}</td>`).join("")}</tr></tbody></table>`;

const tier = (o) => levelOf(o).id;
const num = (v) => (v < 0 ? `−${-v}` : String(v));

/** y = x² + bx + c as written: y = x² − 4x + 3. */
function quad(b, c) {
  const bx = b === 0 ? "" : b === 1 ? " + x" : b === -1 ? " − x" : b > 0 ? ` + ${b}x` : ` − ${-b}x`;
  const cc = c === 0 ? "" : c > 0 ? ` + ${c}` : ` − ${-c}`;
  return `y = x²${bx}${cc}`;
}
const fOf = (b, c) => (x) => x * x + b * x + c;

/** A U with whole-number roots p < q whose middle is a whole number too. */
function roots(r, o) {
  const t = tier(o);
  for (let g = 0; g < 400; g++) {
    const p = t === "gentle" ? r.int(0, 3) : r.int(-4, 3);
    const gap = r.pick([2, 4, 6]);
    const q = p + gap;
    if (t === "gentle" && q > 6) continue;
    if (q > 6) continue;
    const b = -(p + q), c = p * q, h = (p + q) / 2, k = -((gap / 2) ** 2);
    return { p, q, b, c, h, k };
  }
  return { p: 1, q: 3, b: -4, c: 3, h: 2, k: -1 };
}
/** A grid that holds the U from h − 3 to h + 3 and every point asked about. */
function gridAround(h, f, extra = []) {
  const xs = [h - 3, h - 2, h - 1, h, h + 1, h + 2, h + 3];
  const ys = [...xs.map(f), ...extra.map((p) => p[1])];
  const x0 = Math.min(0, h - 4, ...extra.map((p) => p[0] - 1)), x1 = Math.max(1, h + 4, ...extra.map((p) => p[0] + 1));
  const g = { x: [x0, x1], y: [Math.min(0, ...ys) - 1, Math.max(1, ...ys) + 1] };
  return { xs, g };
}

export const QG_GROUPS = [
  { id: "qg-graph", label: "Solving quadratics with graphs", blurb: "The U crosses the x axis at the roots; a line y = k at the answers to = k." },
];

/* ═══ table and plot ═══════════════════════════════════════════════════════*/

const qgPlot = {
  id: "qg-plot",
  group: "qg-graph",
  label: "Table and plot the U",
  blurb: "y for each x, plotted: a U, the same on both sides of its middle.",
  heading: "Drawing y = x² + bx + c",
  instruction: () =>
    "Put each x into the rule: square it, then the x term, then the number (careful with minus signs: (−2)² is " +
    "+4). Plot every point — on screen by tapping — and join them with a SMOOTH U, not a ruler. The two sides " +
    "match: the line down the middle is the line of symmetry.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return roots(r, o);
  },
  render(item) {
    const f = fOf(item.b, item.c);
    const { xs, g } = gridAround(item.h, f);
    return side(art(planeSvg({ ...g, cell: cellFor(g), build: true })),
      eq(quad(item.b, item.c)) + xyTable(xs, xs.map(() => box())) +
      ask(`The line of symmetry is x = ${box()}`));
  },
  worked() {
    return worked(say("y = x² − 4x + 3 at x = 0: 0 − 0 + 3 = 3. At x = 1: 1 − 4 + 3 = 0. At x = 2: 4 − 8 + 3 = −1. " +
      "At x = 3: 0, at x = 4: 3 — the values climb back the way they came down, so the line of symmetry is x = 2."));
  },
  key(item) {
    const f = fOf(item.b, item.c);
    const { xs } = gridAround(item.h, f);
    const pts = xs.map((x) => [x, f(x)]);
    return [...pts.map(([, y]) => want.num(y)), want.dots({ points: pts, says: pts.map(([x, y]) => `(${num(x)}, ${num(y)})`).join(" ") }), want.num(item.h)];
  },
  answer(item) {
    const f = fOf(item.b, item.c);
    return [gridAround(item.h, f).xs.map((x) => num(f(x))).join(", ") + `; x = ${num(item.h)}`];
  },
};

/* ═══ roots and the turning point ══════════════════════════════════════════*/

const qgRoots = {
  id: "qg-roots",
  group: "qg-graph",
  label: "Roots and turning point",
  blurb: "Where it crosses y = 0; halfway between; the bottom of the U.",
  heading: "Reading the roots off the graph",
  instruction: () =>
    "On the x axis y is 0 — so where the U crosses the x axis, x² + bx + c = 0. Those two x's are the ROOTS " +
    "(write the smaller first). The line of symmetry is halfway between them, and the TURNING POINT, the bottom " +
    "of the U, sits on it.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return roots(r, o);
  },
  render(item) {
    const f = fOf(item.b, item.c);
    const { g } = gridAround(item.h, f);
    return side(art(planeSvg({ ...g, cell: cellFor(g), curve: { fn: f } })),
      eq(quad(item.b, item.c)) +
      eq(`${quad(item.b, item.c).replace("y = ", "")} = 0 when x = ${box()} or x = ${box()}`) +
      eq(`line of symmetry x = ${box()}`) + eq(`turning point (${box()}, ${box()})`));
  },
  worked() {
    return worked(say("y = x² − 4x + 3 crosses the x axis at 1 and 3, so x² − 4x + 3 = 0 when x = 1 or x = 3. Halfway " +
      "between is 2: the line of symmetry is x = 2, and the bottom of the U is at (2, −1)."));
  },
  key(item) {
    return [want.num(item.p), want.num(item.q), want.num(item.h), want.num(item.h), want.num(item.k)];
  },
  answer(item) {
    return [`x = ${num(item.p)} or ${num(item.q)}; x = ${num(item.h)}; (${num(item.h)}, ${num(item.k)})`];
  },
};

/* ═══ = k ══════════════════════════════════════════════════════════════════*/

const qgEqualsK = {
  id: "qg-k",
  group: "qg-graph",
  label: "Solve = k with a line",
  blurb: "x² + bx + c = k where the U meets the line y = k.",
  heading: "Solving x² + bx + c = k with the graph",
  instruction: () =>
    "The dashed line is y = k. Where it meets the U, y is k — so those x's make x² + bx + c equal k. Read both " +
    "down to the x axis (smaller first), and check one in the equation.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const R = roots(r, o);
    const d = r.int(1, 3);
    const f = fOf(R.b, R.c);
    return { ...R, d, kk: f(R.h + d), s1: R.h - d, s2: R.h + d };
  },
  render(item) {
    const f = fOf(item.b, item.c);
    const { g } = gridAround(item.h, f);
    return side(art(planeSvg({ ...g, cell: cellFor(g), curve: { fn: f }, lines: [{ m: 0, c: item.kk, dash: true, col: "#c0453f" }] })),
      eq(`${quad(item.b, item.c)} and y = ${num(item.kk)}`) +
      eq(`${quad(item.b, item.c).replace("y = ", "")} = ${num(item.kk)} when x = ${box()} or x = ${box()}`));
  },
  key(item) {
    return [want.num(item.s1), want.num(item.s2)];
  },
  answer(item) {
    return [`x = ${num(item.s1)} or ${num(item.s2)}`];
  },
};

/* ═══ a line and the curve ═════════════════════════════════════════════════*/

const qgLine = {
  id: "qg-line",
  group: "qg-graph",
  label: "Where a line meets the curve",
  blurb: "A line and a U together: two crossing points solve both.",
  heading: "A line and a curve: the graphical method",
  hardest: true,
  instruction: () =>
    "Two graphs on one grid: the U and a straight line. A crossing point is on BOTH, so its x and y make both " +
    "equations true. There are two here — read both (the one with the smaller x first), then check each in " +
    "both equations.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    for (let g = 0; g < 600; g++) {
      const R = roots(r, o);
      const f = fOf(R.b, R.c);
      const x1 = r.int(R.h - 2, R.h), x2 = r.int(R.h + 1, R.h + 3);
      if (x1 === x2) continue;
      const m = (f(x2) - f(x1)) / (x2 - x1);
      const n = f(x1) - m * x1;
      if (!Number.isInteger(m) || Math.abs(m) > 4) continue;
      return { ...R, x1, x2, y1: f(x1), y2: f(x2), m, n };
    }
    return { p: 1, q: 3, b: -4, c: 3, h: 2, k: -1, x1: 1, x2: 4, y1: 0, y2: 3, m: 1, n: -1 };
  },
  render(item) {
    const f = fOf(item.b, item.c);
    const { g } = gridAround(item.h, f, [[item.x1, item.y1], [item.x2, item.y2]]);
    const lineEq = `y = ${item.m === 0 ? "" : item.m === 1 ? "x" : item.m === -1 ? "−x" : `${num(item.m)}x`}${item.n === 0 ? (item.m === 0 ? "0" : "") : item.m === 0 ? num(item.n) : item.n > 0 ? ` + ${item.n}` : ` − ${-item.n}`}`;
    return side(art(planeSvg({ ...g, cell: cellFor(g), curve: { fn: f }, lines: [{ m: item.m, c: item.n, col: "#c0453f" }] })),
      eq(`${quad(item.b, item.c)} &nbsp; and &nbsp; ${lineEq}`) +
      eq(`they meet at (${box()}, ${box()}) and (${box()}, ${box()})`));
  },
  key(item) {
    return [item.x1, item.y1, item.x2, item.y2].map((v) => want.num(v));
  },
  answer(item) {
    return [`(${num(item.x1)}, ${num(item.y1)}) and (${num(item.x2)}, ${num(item.y2)})`];
  },
};

/* ═══ how many roots ═══════════════════════════════════════════════════════*/

const HOW = ["two roots — it crosses", "one root — it just touches", "no roots — it misses"];

const qgHowMany = {
  id: "qg-many",
  group: "qg-graph",
  label: "Two, one or no roots",
  blurb: "Bottom of the U below the axis, on it, or above it.",
  heading: "How many roots?",
  instruction: () =>
    "Look at the bottom of the U. Below the x axis, the U must cross it twice: two roots. Sitting exactly ON the " +
    "axis, it touches once: one root. Above the axis, it never reaches it: no roots — x² + bx + c = 0 has no " +
    "answer at all.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const h = t === "gentle" ? r.int(1, 3) : r.int(-3, 3);
    const kind = r.int(0, 2);
    const k = kind === 0 ? -r.pick([1, 4, 2, 3]) : kind === 1 ? 0 : r.int(1, 4);
    /* y = (x − h)² + k = x² − 2hx + h² + k */
    return { h, k, kind, b: -2 * h, c: h * h + k };
  },
  render(item) {
    const f = fOf(item.b, item.c);
    const { g } = gridAround(item.h, f);
    return side(art(planeSvg({ ...g, cell: cellFor(g), curve: { fn: f } })),
      eq(quad(item.b, item.c)) + eq(`the turning point is at y = ${box()}`) + ask(`So ${tick(...HOW)}`));
  },
  worked() {
    return worked(say("y = x² − 2x + 3: its bottom is at (1, 2), above the x axis, so the U never reaches it — " +
      "x² − 2x + 3 = 0 has no roots."));
  },
  key(item) {
    return [want.num(item.k), want.tick(item.kind)];
  },
  answer(item) {
    return [`turning point y = ${num(item.k)}: ${HOW[item.kind]}`];
  },
};

export const QG_EXERCISES = [qgPlot, qgRoots, qgEqualsK, qgLine, qgHowMany];
