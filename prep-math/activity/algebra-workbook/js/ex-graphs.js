/* ============================================================================
   Algebra Workbook — CHAPTER 7: graphs of functions
   ----------------------------------------------------------------------------
   The machine of chapter 6 drawn as a picture: every x that goes in and the y
   that comes out is a point, and for y = mx + c the points line up. The
   chapter goes concrete to abstract, as every chapter does:

     rule → table → points   work out y for each x, and plot each (x, y) — on
                             screen by tapping the grid (the shared dotplot.js)
     drawing the line        a complete table: rule the straight line through
                             it with the workbook's ruler; is a point on it?
     reading a graph         y from x, x from y, where it crosses the axes
     gradient and intercept  how far up for each 1 across (m) and where it
                             crosses the y axis (c): so y = mx + c; three lines
                             matched to their equations; (Middle+) x = a and
                             y = b, lines straight up and straight across
     solving with graphs     (Middle+) where the line meets y = k solves
                             mx + c = k; where two lines cross solves both
     a curve                 (Middle+) y = x² + c: the same table and points,
                             and they do NOT line up — a U with a lowest point

   Every answer is a whole number, read exactly off a whole-number grid.
   ========================================================================== */

import { planeSvg, pointOf, indexOf } from "./gridart.js";
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
/** A table lying on its side, the way a graph's table is written: x across the top, y under it. */
const xyTable = (xs, ys) =>
  `<table class="fn-table gr-table"><tbody><tr><th>x</th>${xs.map((x) => `<td>${num(x)}</td>`).join("")}</tr>` +
  `<tr><th>y</th>${ys.map((y) => `<td>${y}</td>`).join("")}</tr></tbody></table>`;

const tier = (o) => levelOf(o).id;
const num = (v) => (v < 0 ? `−${-v}` : String(v));
const at = (l, x) => l.m * x + l.c;

/** y = mx + c written the way a person writes it: y = x, y = −2x + 3, y = 4. */
export function yEq({ m, c, x }) {
  if (x !== undefined) return `x = ${num(x)}`;
  const mx = m === 0 ? "" : m === 1 ? "x" : m === -1 ? "−x" : `${num(m)}x`;
  if (!mx) return `y = ${num(c)}`;
  return `y = ${mx}${c === 0 ? "" : c > 0 ? ` + ${c}` : ` − ${-c}`}`;
}

/* ── lines and grids, by level ─────────────────────────────────────────── */

/* A line whose table stays on a grid of sensible height: at most 12 up at
   Gentle, 10 either way above it — a steeper one makes a grid like a ladder. */
function lineOf(r, o) {
  const t = tier(o);
  for (let g = 0; g < 200; g++) {
    const l = t === "gentle" ? { m: r.pick([1, 2, 3]), c: r.int(0, 4) }
      : t === "middle" ? { m: r.pick([-2, -1, 1, 2, 3]), c: r.int(-3, 4) }
        : { m: r.pick([-3, -2, -1, 1, 2, 3, 4]), c: r.int(-5, 5) };
    if (t === "gentle" ? l.m * 4 + l.c <= 12 : Math.abs(l.m) * 2 + Math.abs(l.c) <= 10) return l;
  }
  return { m: 1, c: 1 };
}
const xsOf = (o) => (tier(o) === "gentle" ? [0, 1, 2, 3, 4] : [-2, -1, 0, 1, 2]);

/** A grid that holds these points with a square to spare, 0 always on it —
    and never narrower than 6 squares, so it looks like a grid, not a ladder. */
export function gridFor(pts, { pad = 1 } = {}) {
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
  const lo = Math.min(0, ...xs) - (Math.min(...xs) < 0 ? pad : 0);
  const hi = Math.max(...xs) + pad;
  const wide = lo < 0 ? [Math.min(lo, -4), Math.max(hi, 4)] : [lo, Math.max(hi, 6)];
  return {
    x: wide,
    y: [Math.min(0, ...ys) - (Math.min(...ys) < 0 ? pad : 0), Math.max(1, ...ys) + pad],
  };
}
const cellFor = (g) => { const h = g.y[1] - g.y[0]; return h > 20 ? 3.2 : h > 16 ? 3.6 : 4.4; };

export const GR_GROUPS = [
  { id: "gr-plot", chapter: "Chapter 7 · Graphs of functions", label: "Rule, table, points", blurb: "Work out y for each x, and plot every (x, y)." },
  { id: "gr-line", label: "Drawing the line", blurb: "The points of y = mx + c line up: rule the line through them." },
  { id: "gr-read", label: "Reading a graph", blurb: "y from x, x from y, and where the line crosses the axes." },
  { id: "gr-mc", label: "Gradient and intercept", blurb: "Up m for every 1 across, crossing the y axis at c: y = mx + c." },
  { id: "gr-solve", label: "Solving with graphs", blurb: "Where the line meets y = k; where two lines cross." },
  { id: "gr-curve", label: "A curved graph", blurb: "y = x² + c: the points do not line up — a U." },
];

/* ═══ 1. rule → table → points ═════════════════════════════════════════════*/

const grPlot = {
  id: "gr-plot",
  group: "gr-plot",
  label: "Fill the table, plot the points",
  blurb: "y for each x, then a cross at every (x, y).",
  heading: "From the rule to the points",
  instruction: () =>
    "Put each x into the rule to get its y — the rule is a function machine written short. Each pair is a " +
    "point (x, y): go ALONG to x, then UP (or down) to y, and mark a cross. On screen, tap the grid where the " +
    "cross goes; tap it again to take it off.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { l: lineOf(r, o), xs: xsOf(o) };
  },
  render(item) {
    const pts = item.xs.map((x) => [x, at(item.l, x)]);
    const g = gridFor(pts);
    return side(art(planeSvg({ ...g, cell: cellFor(g), build: true })),
      eq(yEq(item.l)) + xyTable(item.xs, item.xs.map(() => box())) +
      ask("The points lie on") + tick("a straight line", "a curve"));
  },
  worked() {
    return worked(say("y = 2x + 1. When x = 3, y = 2 × 3 + 1 = 7, so (3, 7) is a point: along 3, up 7. Do every x " +
      "in the table the same way. The crosses for a rule like this always line up in a straight line."));
  },
  key(item) {
    const pts = item.xs.map((x) => [x, at(item.l, x)]);
    return [
      ...pts.map(([, y]) => want.num(y)),
      want.dots({ points: pts, says: pts.map(([x, y]) => `(${num(x)}, ${num(y)})`).join(" ") }),
      want.tick(0),
    ];
  },
  answer(item) {
    return [item.xs.map((x) => `(${num(x)}, ${num(at(item.l, x))})`).join(" ")];
  },
};

/* ═══ 2. drawing the line ══════════════════════════════════════════════════*/

/** Is a set of ruled lines the line l, covering from x = a to x = b? */
export function lineRight(lines, l, g, a, b) {
  const real = lines.filter(([p, q]) => p !== q);
  if (!real.length) return false;
  const pt = (k) => pointOf(k, g.x[0], g.x[1], g.y[0], g.y[1]);
  let lo = Infinity; let hi = -Infinity;
  for (const [p, q] of real) {
    const [P, Q] = [pt(p), pt(q)];
    if (at(l, P[0]) !== P[1] || at(l, Q[0]) !== Q[1]) return false;
    lo = Math.min(lo, P[0], Q[0]); hi = Math.max(hi, P[0], Q[0]);
  }
  return lo <= a && hi >= b;
}

const grDraw = {
  id: "gr-draw",
  group: "gr-line",
  label: "Rule the straight line",
  blurb: "Plot the table's points and rule one line through all of them.",
  heading: "Draw the graph",
  instruction: () =>
    "Plot each point from the table. They line up: lay your ruler along them and draw ONE straight line " +
    "through all of them, from the first to the last (you may go further). On screen, drag from one end " +
    "to the other — the ruler snaps to the corners of the squares. Then use your line.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const l = lineOf(r, o);
    const xs = xsOf(o);
    const p = r.pick(xs);
    const on = r.chance(0.5);
    return { l, xs, p, q: at(l, p) + (on ? 0 : r.pick([-2, -1, 1, 2])) };
  },
  render(item) {
    const pts = item.xs.map((x) => [x, at(item.l, x)]);
    const g = gridFor(pts);
    return side(art(planeSvg({ ...g, cell: cellFor(g), rule: true })),
      eq(yEq(item.l)) + xyTable(item.xs, pts.map(([, y]) => num(y))) +
      ask(`Is (${num(item.p)}, ${num(item.q)}) on the line?`) + tick("Yes", "No"));
  },
  key(item) {
    const pts = item.xs.map((x) => [x, at(item.l, x)]);
    const g = gridFor(pts);
    return [
      want.draw({
        says: `one straight line through ${pts.map(([x, y]) => `(${num(x)}, ${num(y)})`).join(", ")}`,
        check: (lines) => lineRight(lines, item.l, g, item.xs[0], item.xs[item.xs.length - 1]),
      }),
      want.tick(at(item.l, item.p) === item.q ? 0 : 1),
    ];
  },
  answer(item) {
    return [`${yEq(item.l)}; (${num(item.p)}, ${num(item.q)}) ${at(item.l, item.p) === item.q ? "is" : "is not"} on it`];
  },
};

/* ═══ 3. reading a graph ═══════════════════════════════════════════════════*/

const grRead = {
  id: "gr-read",
  group: "gr-read",
  label: "Read the graph",
  blurb: "Up from x to the line and across; across from y and down.",
  heading: "Read the graph",
  instruction: () =>
    "To find y for an x: go along to x, then up or down to the LINE, then across to the y axis. To find x for a " +
    "y: go across from y to the line, then up or down to the x axis. Where the line crosses the y axis, x is 0.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const l = lineOf(r, o);
    const xs = xsOf(o);
    const a = r.pick(xs);
    let b; do { b = r.pick(xs); } while (b === a);
    /* crossing the x axis at a whole number, when there is one on the grid (Middle up) */
    const root = -l.c / l.m;
    const xcross = tier(o) !== "gentle" && Number.isInteger(root) && root >= xs[0] && root <= xs[xs.length - 1] ? root : null;
    return { l, xs, a, b, xcross };
  },
  render(item) {
    const pts = item.xs.map((x) => [x, at(item.l, x)]);
    const g = gridFor(pts);
    return side(art(planeSvg({ ...g, cell: cellFor(g), lines: [{ ...item.l }] })),
      eq(yEq(item.l)) +
      eq(`When x = ${num(item.a)}, y = ${box()}`) +
      eq(`When y = ${num(at(item.l, item.b))}, x = ${box()}`) +
      ask(`It crosses the y axis at y = ${box()}`) +
      (item.xcross !== null ? ask(`It crosses the x axis at x = ${box()}`) : ""));
  },
  key(item) {
    return [want.num(at(item.l, item.a)), want.num(item.b), want.num(item.l.c), ...(item.xcross !== null ? [want.num(item.xcross)] : [])];
  },
  answer(item) {
    return [`${num(at(item.l, item.a))}; ${num(item.b)}; ${num(item.l.c)}${item.xcross !== null ? `; ${num(item.xcross)}` : ""}`];
  },
};

/* ═══ 4. gradient and intercept ════════════════════════════════════════════*/

const grGrad = {
  id: "gr-grad",
  group: "gr-mc",
  label: "Find m and c",
  blurb: "Steepness and where it crosses: write the line's equation.",
  heading: "Gradient and intercept",
  instruction: (o) =>
    "The GRADIENT m is how far the line goes up for every 1 square across to the right" +
    (tier(o) === "gentle" ? "." : " — if it goes DOWN, m is negative.") +
    " The INTERCEPT c is where it crosses the y axis. Then the line is y = mx + c.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    return { l: lineOf(r, o), xs: xsOf(o) };
  },
  render(item, o) {
    const pts = item.xs.map((x) => [x, at(item.l, x)]);
    const g = gridFor(pts);
    return side(art(planeSvg({ ...g, cell: cellFor(g), lines: [{ ...item.l }] })),
      (tier(o) === "gentle" ? "" : ask("Going right, the line goes") + tick("up", "down")) +
      ask(`For each 1 across, it goes ${tier(o) === "gentle" ? "up" : "up or down"} by ${box()}`) +
      ask(`It crosses the y axis at ${box()}`) +
      eq(`So y = ${box()}x + ${box()}`));
  },
  worked() {
    return worked(say("Start where the line crosses the y axis — at 1, so c = 1. Go 1 square right and the line " +
      "is 2 squares higher, so m = 2. The line is y = 2x + 1. (If it went 2 squares DOWN for each 1 across, m " +
      "would be −2.)"));
  },
  key(item, o) {
    return [
      ...(tier(o) === "gentle" ? [] : [want.tick(item.l.m > 0 ? 0 : 1)]),
      want.num(Math.abs(item.l.m)), want.num(item.l.c), want.num(item.l.m), want.num(item.l.c),
    ];
  },
  answer(item) {
    return [`m = ${num(item.l.m)}, c = ${num(item.l.c)}: ${yEq(item.l)}`];
  },
};

/** Three different lines that all cross the grid well, for matching. */
function threeLines(r, o) {
  for (let g = 0; g < 400; g++) {
    const ls = [lineOf(r, o), lineOf(r, o), lineOf(r, o)];
    const key = ls.map((l) => `${l.m},${l.c}`);
    if (new Set(key).size < 3) continue;
    /* told apart by steepness or by where they cross — never the same line */
    if (new Set(ls.map((l) => l.m)).size < 2 && new Set(ls.map((l) => l.c)).size < 3) continue;
    return ls;
  }
  return [{ m: 1, c: 0 }, { m: 2, c: 1 }, { m: 3, c: 2 }];
}

const grMatch = {
  id: "gr-match",
  group: "gr-mc",
  label: "Which line is which?",
  blurb: "Three lines, three equations: match them by m and c.",
  heading: "Match each equation to its line",
  instruction: () =>
    "Use c first: which line crosses the y axis there? If two cross at the same place, use m: the steeper line " +
    "has the bigger number, and a line going down has a minus.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const ls = threeLines(r, o);
    return { ls, order: r.shuffle([0, 1, 2]), xs: xsOf(o) };
  },
  render(item) {
    const pts = item.ls.flatMap((l) => item.xs.map((x) => [x, at(l, x)]));
    const g = gridFor(pts);
    const lines = item.ls.map((l, j) => ({ ...l, name: "ABC"[j] }));
    return side(art(planeSvg({ ...g, cell: cellFor(g), lines })),
      item.order.map((j) => eq(yEq(item.ls[j])) + tick("A", "B", "C")).join(""));
  },
  key(item) {
    return item.order.map((j) => want.tick(j));
  },
  answer(item) {
    return [item.order.map((j) => `${yEq(item.ls[j])} is ${"ABC"[j]}`).join("; ")];
  },
};

const grSpecial = {
  id: "gr-special",
  group: "gr-mc",
  label: "Straight across, straight up",
  blurb: "y = 3 is flat; x = −2 goes straight up; y = x goes corner to corner.",
  heading: "Name the special lines",
  hardest: true,
  instruction: () =>
    "On y = 3 every point has y equal to 3, whatever x is: a flat line across. On x = −2 every point has x " +
    "equal to −2: a line straight up. y = x goes through (1, 1), (2, 2)…, and y = −x through (1, −1), (2, −2)….",
  cols: 1,
  defaultCount: 2,
  make(r) {
    const b = r.pick([-3, -2, 2, 3, 4]);
    const a = r.pick([-3, -2, 2, 3]);
    const ls = r.shuffle([{ m: 0, c: b }, { x: a }, { m: 1, c: 0 }, { m: -1, c: 0 }]);
    return { ls, order: r.shuffle([0, 1, 2, 3]) };
  },
  render(item) {
    const lines = item.ls.map((l, j) => ({ ...l, name: "ABCD"[j] }));
    return side(art(planeSvg({ x: [-5, 5], y: [-5, 5], cell: 4.2, lines })),
      item.order.map((j) => eq(yEq(item.ls[j])) + tick("A", "B", "C", "D")).join(""));
  },
  key(item) {
    return item.order.map((j) => want.tick(j));
  },
  answer(item) {
    return [item.order.map((j) => `${yEq(item.ls[j])} is ${"ABCD"[j]}`).join("; ")];
  },
};

/* ═══ 5. solving with graphs ═══════════════════════════════════════════════*/

const grSolve = {
  id: "gr-solve",
  group: "gr-solve",
  label: "Solve by reading the graph",
  blurb: "2x + 1 = 7 where the line y = 2x + 1 meets the line y = 7.",
  heading: "Solve with the graph",
  hardest: true,
  instruction: () =>
    "The dashed line is y = k. Where it meets the graph, y is k — so the x there is the x that makes the rule " +
    "equal k. Read it down to the x axis, then check it in the equation.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const l = lineOf(r, o);
    const xs = xsOf(o);
    const x = r.pick(xs);
    return { l, xs, x };
  },
  render(item) {
    const k = at(item.l, item.x);
    const rhs = yEq(item.l).replace("y = ", "");
    const pts = item.xs.map((x) => [x, at(item.l, x)]);
    const g = gridFor(pts);
    return side(art(planeSvg({ ...g, cell: cellFor(g), lines: [{ ...item.l }, { m: 0, c: k, dash: true, col: "#c0453f" }] })),
      eq(`${yEq(item.l)} and y = ${num(k)}`) +
      eq(`${rhs} = ${num(k)} when x = ${box()}`));
  },
  key(item) {
    return [want.num(item.x)];
  },
  answer(item) {
    return [`x = ${num(item.x)}`];
  },
};

const grCross = {
  id: "gr-cross",
  group: "gr-solve",
  label: "Where two lines cross",
  blurb: "The crossing point fits both equations at once.",
  heading: "Where do the lines cross?",
  hardest: true,
  instruction: () =>
    "The point where two lines cross is on BOTH lines, so its x and y make both equations true. Read its x " +
    "and y off the grid, then check them in each equation.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    for (let g = 0; g < 400; g++) {
      const a = lineOf(r, o); const b = lineOf(r, o);
      if (a.m === b.m) continue;
      const x = (b.c - a.c) / (a.m - b.m);
      if (!Number.isInteger(x) || x < -3 || x > 4) continue;
      const y = at(a, x);
      if (y < -6 || y > 10) continue;
      return { a, b, x, y };
    }
    return { a: { m: 1, c: 1 }, b: { m: -1, c: 5 }, x: 2, y: 3 };
  },
  render(item) {
    const xs = [item.x - 2, item.x - 1, item.x, item.x + 1, item.x + 2];
    const pts = [...xs.map((x) => [x, at(item.a, x)]), ...xs.map((x) => [x, at(item.b, x)])];
    const g = gridFor(pts);
    const clampG = { x: [Math.max(g.x[0], -6), Math.min(g.x[1], 7)], y: [Math.max(g.y[0], -8), Math.min(g.y[1], 12)] };
    return side(art(planeSvg({ ...clampG, cell: cellFor(clampG), lines: [{ ...item.a, name: "A" }, { ...item.b, name: "B" }] })),
      eq(`A: ${yEq(item.a)} &nbsp; B: ${yEq(item.b)}`) +
      eq(`They cross at (${box()}, ${box()})`));
  },
  key(item) {
    return [want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`(${num(item.x)}, ${num(item.y)})`];
  },
};

/* ═══ 6. a curve ═══════════════════════════════════════════════════════════*/

const grCurve = {
  id: "gr-curve",
  group: "gr-curve",
  label: "The graph of y = x² + c",
  blurb: "Square each x: the points make a U, not a line.",
  heading: "A curved graph",
  hardest: true,
  instruction: () =>
    "Square x first (a minus times a minus is a plus, so (−3)² = 9), then add c. Plot every point — on screen by " +
    "tapping — and join them with a SMOOTH curve, not with a ruler. It is a U, the same on both sides of the " +
    "y axis.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { c: tier(o) === "stretch" ? r.int(-4, 3) : r.pick([0, 1, -1]) };
  },
  render(item) {
    const xs = [-3, -2, -1, 0, 1, 2, 3];
    const g = { x: [-4, 4], y: [Math.min(0, item.c) - 1, 9 + item.c + 1] };
    const c = item.c === 0 ? "" : item.c > 0 ? ` + ${item.c}` : ` − ${-item.c}`;
    return side(art(planeSvg({ ...g, cell: 4, build: true })),
      eq(`y = x²${c}`) + xyTable(xs, xs.map(() => box())) +
      ask(`The lowest point is at y = ${box()}`) +
      ask(`The line of symmetry is x = ${box()}`) +
      ask("The graph is") + tick("a straight line", "a U-shaped curve"));
  },
  key(item) {
    const xs = [-3, -2, -1, 0, 1, 2, 3];
    const pts = xs.map((x) => [x, x * x + item.c]);
    return [
      ...pts.map(([, y]) => want.num(y)),
      want.dots({ points: pts, says: pts.map(([x, y]) => `(${num(x)}, ${num(y)})`).join(" ") }),
      want.num(item.c), want.num(0), want.tick(1),
    ];
  },
  answer(item) {
    return [[-3, -2, -1, 0, 1, 2, 3].map((x) => num(x * x + item.c)).join(", ") + `; lowest ${num(item.c)}`];
  },
};

export const GR_EXERCISES = [
  grPlot,
  grDraw,
  grRead,
  grGrad, grMatch, grSpecial,
  grSolve, grCross,
  grCurve,
];

void indexOf;
