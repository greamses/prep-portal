/* ============================================================================
   Geometry Workbook — CHAPTER 2: transversal angles
   ----------------------------------------------------------------------------
   Eleven sections, in the order they were asked for:

     parallel lines · transversal lines · the eight angles · acute or obtuse
     · vertically opposite · corresponding · alternate · consecutive interior
     · consecutive exterior · more than one transversal · triangles

   ONE RULE CARRIES THE WHOLE CHAPTER, and the sections are built so a child
   meets it before it is named. Across a pair of parallel lines a transversal
   makes only TWO sizes of angle: four acute ones that are all the same, and
   four obtuse ones that are all the same, and one of each makes 180°. The
   "acute or obtuse" section lands on this by sorting; every named pair after
   it is a way of saying WHICH two angles you are looking at — and the tick
   under every "find x" asks the only question that then matters: are they
   the same size, or do they make 180?

   The numbering, the pair names and the "why" sentences are the Transversals
   studio's (see transversal.js), so the paper and the screen agree.

   Nothing here is drawn "not to scale". Every figure is built from its own
   numbers, so a child can put a protractor on any angle and get the answer.
   ========================================================================== */

import {
  transversalSvg, crossingSvg, twoTransversalsSvg, triangleBetweenSvg, dotGridSvg,
  angleSize, drawnSize, familyOf, PAIRS, isInterior, isLeft,
} from "./transversal.js";
import { levelOf, stepped, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const small = () => `<span class="wb-answer gw-num"></span>`;
const deg = (label) => `<span class="wb-slot"><em>${label}</em>${box()}°</span>`;
const num = (label) => `<span class="wb-slot"><em>${label}</em>${small()}</span>`;
const art = (svg) => `<div class="gw-art">${svg}</div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const worked = (tag, body) => `<div class="wb-worked"><p class="wb-worked__tag">${tag}</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const side = (figure, words) => `<div class="gw-side">${figure}<div class="gw-lines">${words}</div></div>`;

/* Figure sizes, mm. A half column is about 88mm wide. */
const FIG = { w: 80, h: 58 };
const CROSS = { w: 74, h: 54 };
const TALL = { w: 80, h: 74 };
const WIDE = { w: 124, h: 62 };

/* The two things every "find it" question comes down to. */
const SAME = "equal";
const PAIRED = "add up to 180°";

/* ── the pairs, as the studio names them ───────────────────────────────────*/

export const REL = {
  vert: {
    name: "vertically opposite", kind: "vertically opposite", equal: true,
    why: "they are opposite each other where two lines cross",
  },
  corr: {
    name: "corresponding", kind: "corresponding", equal: true,
    why: "they sit in the same position at the two crossings",
  },
  altInt: {
    name: "alternate interior", kind: "alternate", equal: true,
    why: "they are between the parallels, on opposite sides of the transversal",
  },
  altExt: {
    name: "alternate exterior", kind: "alternate", equal: true,
    why: "they are outside the parallels, on opposite sides of the transversal",
  },
  coInt: {
    name: "consecutive interior", kind: "consecutive interior", equal: false,
    why: "they are between the parallels, on the same side of the transversal",
  },
  coExt: {
    name: "consecutive exterior", kind: "consecutive exterior", equal: false,
    why: "they are outside the parallels, on the same side of the transversal",
  },
};

const KINDS = ["vertically opposite", "corresponding", "alternate", "consecutive interior", "consecutive exterior"];

/* ── numbers the questions are made of ─────────────────────────────────────*/

/**
 * The angle the transversal makes with the parallels. Never 90: at a right
 * angle all eight angles are 90°, every pair is equal AND adds to 180, and
 * there is no acute or obtuse to tell apart — a true fact and a question with
 * no single answer. `far` keeps it clear of 90 by enough to SEE the difference.
 */
function phiOf(r, o, far = 10) {
  let p;
  let g = 0;
  do p = stepped(r, o, 35, 145);
  while (Math.abs(p - 90) < far && ++g < 60);
  return p;
}

/* Parallel lines do not have to run across the page — turned a little, so a
   page of them is not a page of the same picture. */
const rotOf = (r) => r.pick([0, 0, -15, 15, -25, 25]);

/** One pair of a relationship, either way round: [given, unknown]. */
function pairOf(r, rel) {
  const [a, b] = r.pick(PAIRS[rel]);
  return r.chance(0.5) ? [a, b] : [b, a];
}

/** A linear expression for an angle, in the chapter-one style. */
function expr(c, k) {
  const x = c === 1 ? "x" : `${c}x`;
  if (!k) return x;
  return k > 0 ? `${x} + ${k}°` : `${x} − ${-k}°`;
}

/**
 * Two expressions in x for two angles that are equal (or that make 180), with
 * x chosen first so everything comes out whole. `v` is the size the FIRST one
 * comes to, and the caller builds the figure round it.
 */
function exprPair(r, o, equal) {
  const s = levelOf(o).step === 1 ? 1 : 5;
  for (let g = 0; g < 400; g++) {
    const x = r.int(6, 42);
    if (equal) {
      const v = r.int(100, 140);
      const c1 = r.int(2, 3);
      const c2 = c1 + r.pick([1, 2]);
      const k1 = v - c1 * x;
      const k2 = v - c2 * x;
      if (k1 % s || k2 % s || Math.abs(k1) > 60 || Math.abs(k2) > 60 || !k2) continue;
      return { x, e1: [c1, k1], e2: [c2, k2], v1: v, v2: v };
    }
    /* supplementary: the acute one is a plain multiple of x, the obtuse one
       carries the number, so the long label sits in the wide angle */
    const c1 = r.int(1, 4);
    const v1 = c1 * x;
    if (v1 < 35 || v1 > 80 || v1 % s) continue;
    const c2 = r.int(1, 4);
    const v2 = 180 - v1;
    const k2 = v2 - c2 * x;
    if (k2 % s || Math.abs(k2) > 60 || !k2) continue;
    return { x, e1: [c1, 0], e2: [c2, k2], v1, v2 };
  }
  return { x: 20, e1: [3, 60], e2: [4, 40], v1: 120, v2: 120 };
}

/** φ for which angle n comes out at exactly v. */
const phiFor = (n, v) => (familyOf(n) === "A" ? 180 - v : v);

/* Every section's heading and blurb, for the rail. The first carries the
   chapter, so the rail marks where chapter two starts. */
export const TRANS_GROUPS = [
  { id: "parallel", chapter: "Chapter 2 · Transversal angles", label: "Parallel lines" },
  { id: "transversal", label: "Transversal lines" },
  { id: "tr-angles", label: "Transversal angles" },
  { id: "acute-obtuse", label: "Acute or obtuse on a transversal" },
  { id: "vert-opp", label: "Vertically opposite angles" },
  { id: "corresponding", label: "Corresponding angles" },
  { id: "alternate", label: "Alternate angles" },
  { id: "co-interior", label: "Consecutive interior angles" },
  { id: "co-exterior", label: "Consecutive exterior angles" },
  { id: "multi-trans", label: "Multiple transversals" },
  { id: "tri-trans", label: "Triangles on transversals" },
];

/* ═══ 1. parallel lines ════════════════════════════════════════════════════
   On a dot grid, because "the same slope" is a thing a child can COUNT there:
   so many across and so many up. Two lines that go the same across-and-up
   never meet. */

const GRID = { cols: 11, rows: 8 };
const inGrid = (p) => p[0] >= 0 && p[0] < GRID.cols && p[1] >= 0 && p[1] < GRID.rows;

/** Across and up, the way a child counts it: across is always to the right. */
function stepsOf(a, b) {
  let dx = b[0] - a[0];
  let dy = a[1] - b[1]; // up is positive
  if (dx < 0 || (dx === 0 && dy < 0)) { dx = -dx; dy = -dy; }
  return [dx, dy];
}
/* Across and up-or-down for each line, as a small table: the two counts sit
   side by side, and "the same steps" is the same row twice. */
const stepsTable = (rows) =>
  `<table class="gw-steps"><tr><th></th><th>across</th><th>up or down</th></tr>` +
  rows.map((n) => `<tr><th>${n}</th><td>${small()}</td><td>${small()}</td></tr>`).join("") +
  `</table>`;
/* A dot's column and row, from where it sits on the grid (see dotGridSvg). */
const dotAt = ([x, y]) => [Math.round((x - 5) / 6), Math.round((y - 5) / 6)];
const upWord = (dy) => (dy >= 0 ? `${dy} up` : `${-dy} down`);

/** A direction a child can count: 1–4 across, up to 3 up or down. */
function slopeOf(r) {
  for (;;) {
    const v = [r.int(1, 4), r.int(-3, 3)];
    if (v[1] !== 0 || r.chance(0.3)) return v;
  }
}

/* Distance of point p from the line through a that goes v = [across, up], in
   dots. The grid counts rows DOWN the page, so up is minus a row. */
function offLine(p, a, v) {
  const g = [v[0], -v[1]];
  return Math.abs((p[0] - a[0]) * g[1] - (p[1] - a[1]) * g[0]) / Math.hypot(g[0], g[1]);
}

/* Do segments ab and cd cross (or touch)? */
function crosses(a, b, c, d) {
  const o = (p, q, s) => Math.sign((q[0] - p[0]) * (s[1] - p[1]) - (q[1] - p[1]) * (s[0] - p[0]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}

let spotFlip = 0;
const parSpot = {
  id: "par-spot",
  group: "parallel",
  label: "Parallel or not?",
  blurb: "Count across and up on the dots. The same steps means the lines never meet.",
  heading: "Are the two lines parallel?",
  instruction: () =>
    "Parallel lines go in exactly the same direction, so they never meet however far " +
    "they go. Count how many dots each line goes across and how many up or down. " +
    "If the counts are the same, the lines are parallel.",
  cols: 2,
  defaultCount: 6,
  /* Half parallel and half not, alternating, like "could it be a triangle?" —
     and the ones that are not are out by ONE dot, never by a mile, so the
     answer comes from counting rather than from a glance. At the stretch
     level a parallel line may be twice as long: 4 across and 2 up goes the
     same way as 2 across and 1 up. */
  make(r, o, k, i) {
    if (i === 0) spotFlip = r.chance(0.5) ? 1 : 0;
    const yes = (i + spotFlip) % 2 === 0;
    const L = levelOf(o);
    for (let g = 0; g < 400; g++) {
      const v = slopeOf(r);
      let w = v.slice();
      if (!yes) {
        w = r.chance(0.5) ? [v[0], v[1] + r.pick([-1, 1])] : [v[0] + r.pick([-1, 1]), v[1]];
        if (w[0] < 1 || Math.abs(w[1]) > 3) continue;
        /* one more across on a FLAT line is still flat — still parallel. The
           test is the directions, not the counts. */
        if (v[0] * w[1] === v[1] * w[0]) continue;
      } else if (L.step === 1 && r.chance(0.4) && v[0] * 2 <= 6) {
        w = [v[0] * 2, v[1] * 2];
      }
      const a = [r.int(0, GRID.cols - 1), r.int(0, GRID.rows - 1)];
      const b = [a[0] + v[0], a[1] - v[1]];
      const c = [r.int(0, GRID.cols - 1), r.int(0, GRID.rows - 1)];
      const d = [c[0] + w[0], c[1] - w[1]];
      if (![a, b, c, d].every(inGrid)) continue;
      if (offLine(c, a, v) < 1.5 || offLine(d, a, v) < 1.5) continue;
      if (crosses(a, b, c, d)) continue;
      return { a, b, c, d, yes };
    }
    return { a: [1, 5], b: [4, 3], c: [5, 7], d: [8, 5], yes: true };
  },
  render(item) {
    return (
      art(dotGridSvg({ ...GRID, segs: [[item.a, item.b], [item.c, item.d]], names: ["a", "b"] })) +
      stepsTable(["a", "b"]) +
      tick("parallel", "not parallel")
    );
  },
  worked() {
    return worked(
      "One done for you",
      side(
        art(dotGridSvg({ ...GRID, segs: [[[1, 5], [4, 3]], [[5, 7], [8, 5]]], names: ["a", "b"] })),
        say("Line a goes 3 across and 2 up. Line b goes 3 across and 2 up as well. " +
          "The same steps, so they go the same way and never meet: <b>parallel</b>.")
      )
    );
  },
  key(item) {
    const [ax, ay] = stepsOf(item.a, item.b);
    const [bx, by] = stepsOf(item.c, item.d);
    return [want.num(ax), want.steps(ay), want.num(bx), want.steps(by), want.tick(item.yes ? 0 : 1)];
  },
  answer(item) {
    const [ax, ay] = stepsOf(item.a, item.b);
    const [bx, by] = stepsOf(item.c, item.d);
    const verdict = item.yes ? "parallel" : "not parallel";
    const twice = item.yes && bx === 2 * ax ? " (b is the same steps, twice)" : "";
    return [`a: ${ax} across, ${upWord(ay)}; b: ${bx} across, ${upWord(by)} — ${verdict}${twice}`];
  },
};

const parDraw = {
  id: "par-draw",
  group: "parallel",
  label: "Draw a parallel line",
  blurb: "Count the line's steps, then take the same steps from the dot P.",
  heading: "Draw a line through P, parallel to the line",
  instruction: () =>
    "Count how many dots the line goes across and how many up or down. Start at P " +
    "and count the same steps, then join P to where you land with a ruler.",
  cols: 2,
  defaultCount: 4,
  make(r) {
    for (let g = 0; g < 400; g++) {
      const v = slopeOf(r);
      const a = [r.int(0, GRID.cols - 1), r.int(0, GRID.rows - 1)];
      const b = [a[0] + v[0], a[1] - v[1]];
      const P = [r.int(0, GRID.cols - 1), r.int(0, GRID.rows - 1)];
      const Q = [P[0] + v[0], P[1] - v[1]];
      if (![a, b, P, Q].every(inGrid)) continue;
      if (offLine(P, a, v) < 2) continue;
      if (crosses(a, b, P, Q)) continue;
      return { a, b, P, v };
    }
    return { a: [1, 5], b: [4, 3], P: [5, 7], v: [3, 2] };
  },
  render(item) {
    return art(dotGridSvg({ ...GRID, segs: [[item.a, item.b]], P: item.P })) + stepsTable(["line"]);
  },
  worked() {
    return worked(
      "One done for you",
      side(
        art(dotGridSvg({ ...GRID, segs: [[[1, 5], [4, 3]], [[5, 7], [8, 5]]], P: [5, 7] })),
        say("The line goes 3 across and 2 up. From P, count 3 across and 2 up, and join " +
          "the two dots. The new line goes the same way, so it is parallel.")
      )
    );
  },
  /* The line is ruled on the grid, from P, the same way as the given line:
     any length, either way along it — but every line drawn has to be one. */
  key(item) {
    const [vx, vy] = item.v;
    return [
      want.num(vx), want.steps(vy),
      want.draw({
        says: `from P, ${vx} across and ${upWord(vy)}`,
        check(lines, fig) {
          if (!lines.length) return false;
          return lines.every(([i, j]) => {
            const a = dotAt(fig.pts[i]);
            const b = dotAt(fig.pts[j]);
            const atP = (d) => d[0] === item.P[0] && d[1] === item.P[1];
            if (!atP(a) && !atP(b)) return false;
            const q = atP(a) ? b : a;
            const d = [q[0] - item.P[0], q[1] - item.P[1]];
            return (d[0] || d[1]) && d[0] * -vy - d[1] * vx === 0;
          });
        },
      }),
    ];
  },
  answer(item) {
    return [`from P go ${item.v[0]} across and ${upWord(item.v[1])}, then join`];
  },
};

/* ═══ 2. transversal lines ═════════════════════════════════════════════════*/

const LETTERS = ["a", "b", "c", "d"];

const trWhich = {
  id: "tr-which",
  group: "transversal",
  label: "Which line is the transversal?",
  blurb: "The line that cuts across the others.",
  heading: "Which line is the transversal?",
  instruction: () =>
    "A transversal is a line that crosses two or more other lines. The little arrows " +
    "show which lines are parallel. Write the letter of the transversal.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const lines = o.level === "gentle" ? 2 : r.pick([2, 3]);
    const names = r.shuffle(LETTERS.slice(0, lines + 1));
    return { phi: phiOf(r, o), lines, names, rot: rotOf(r) };
  },
  render(item) {
    return art(transversalSvg({
      phi: item.phi, lines: item.lines, names: item.names, rot: item.rot, plain: true,
      box: item.lines === 3 ? TALL : FIG,
    })) + ask(`The transversal is line ${small()}`);
  },
  key(item) {
    return [want.text(item.names[item.lines])];
  },
  answer(item) {
    const others = item.names.slice(0, item.lines).join(" and ");
    return [`line ${item.names[item.lines]} — it crosses ${others}`];
  },
};

let countFlip = 0;
const trCount = {
  id: "tr-count",
  group: "transversal",
  label: "Count the angles it makes",
  blurb: "Four at every crossing.",
  heading: "Count the angles the transversal makes",
  instruction: () =>
    "Every dot is in one angle. Count the lines the transversal crosses, then count " +
    "the angles. How many are there at each crossing?",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    if (i === 0) countFlip = r.chance(0.5) ? 1 : 0;
    return { phi: phiOf(r, o), lines: (i + countFlip) % 2 ? 3 : 2, rot: rotOf(r) };
  },
  render(item) {
    return art(transversalSvg({ phi: item.phi, lines: item.lines, dots: true, rot: item.rot, box: item.lines === 3 ? TALL : FIG })) +
      ask(`${num("Lines crossed")}${num("Angles")}`) +
      ask(num("At each crossing"));
  },
  key(item) {
    return [want.num(item.lines), want.num(item.lines * 4), want.num(4)];
  },
  answer(item) {
    return [`${item.lines} lines, ${item.lines * 4} angles — 4 at each crossing`];
  },
};

const trDraw = {
  id: "tr-draw",
  group: "transversal",
  label: "Draw your own transversal",
  blurb: "Rule a line across, then number its eight angles the standard way.",
  heading: "Draw a transversal and number the angles",
  instruction: () =>
    "With a ruler, draw a straight line that crosses both parallel lines. Mark the " +
    "angles at the top crossing 1, 2, 3, 4 — top left, top right, bottom left, bottom " +
    "right — and the angles at the bottom crossing 5, 6, 7, 8 in the same order.",
  cols: 2,
  defaultCount: 2,
  make(r) {
    return { rot: r.pick([0, 0, -10, 10]) };
  },
  render(item) {
    return art(transversalSvg({ phi: 90, bare: true, rot: item.rot, box: FIG }));
  },
  worked() {
    return worked(
      "What yours will look like",
      side(
        art(transversalSvg({ phi: 60, numbers: true, box: FIG })),
        say("Any straight line across both makes eight angles, four at each crossing. " +
          "Number them the same way every time and the pairs later in the chapter will " +
          "always have the same numbers.")
      )
    );
  },
  /* A straight line that crosses both parallels (the numbering is on paper). */
  key() {
    return [
      want.draw({
        free: true,
        says: "one straight line that crosses both parallel lines",
        check(lines, fig) {
          const cross = (p, q, r, s) => {
            const o = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
            return o(p, q, r) !== o(p, q, s) && o(r, s, p) !== o(r, s, q);
          };
          return lines.some(([a, b]) => fig.par.every((l) => cross(a, b, [l[0], l[1]], [l[2], l[3]])));
        },
      }),
    ];
  },
  answer() {
    return ["any straight line across both — 1 to 4 at the top crossing, 5 to 8 at the bottom"];
  },
};

/* ═══ 3. the eight angles ══════════════════════════════════════════════════*/

const taInOut = {
  id: "ta-inout",
  group: "tr-angles",
  label: "Inside or outside the parallels",
  blurb: "Four angles are between the lines (interior), four are outside (exterior).",
  heading: "Interior and exterior angles",
  instruction: () =>
    "The angles BETWEEN the parallel lines are the interior angles. The ones outside " +
    "them are the exterior angles. Write the numbers of each.",
  cols: 2,
  defaultCount: 2,
  make(r, o) {
    return { phi: phiOf(r, o), rot: rotOf(r) };
  },
  render(item) {
    return art(transversalSvg({ phi: item.phi, numbers: true, rot: item.rot, box: FIG })) +
      ask(`Interior: ${small()}${small()}${small()}${small()}`) +
      ask(`Exterior: ${small()}${small()}${small()}${small()}`);
  },
  key() {
    return [want.set(3, 4, 5, 6), want.set(1, 2, 7, 8)];
  },
  answer() {
    return ["interior 3, 4, 5, 6 — exterior 1, 2, 7, 8"];
  },
};

const dealWhere = dealer();
const taWhere = {
  id: "ta-where",
  group: "tr-angles",
  label: "Where is the shaded angle?",
  blurb: "Inside or outside the parallels, and which side of the transversal.",
  heading: "Where is the shaded angle?",
  instruction: () =>
    "Tick two boxes for each: is the shaded angle between the parallel lines or " +
    "outside them? Is it on the left or the right of the transversal?",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    return { n: dealWhere(r, [1, 2, 3, 4, 5, 6, 7, 8], i), phi: phiOf(r, o) };
  },
  render(item) {
    return art(transversalSvg({ phi: item.phi, shade: [item.n], box: FIG })) +
      `<p class="gw-tickrow">${tick("interior", "exterior")}</p>` +
      `<p class="gw-tickrow">${tick("left", "right")} of the transversal</p>`;
  },
  key(item) {
    return [want.tick(isInterior(item.n) ? 0 : 1), want.tick(isLeft(item.n) ? 0 : 1)];
  },
  answer(item) {
    return [`∠${item.n}: ${isInterior(item.n) ? "interior" : "exterior"}, ${isLeft(item.n) ? "left" : "right"}`];
  },
};

/* ═══ 4. acute or obtuse ═══════════════════════════════════════════════════*/

const aoSort = {
  id: "ao-sort",
  group: "acute-obtuse",
  label: "Sort the eight angles",
  blurb: "Four are acute and four are obtuse — every time.",
  heading: "Acute or obtuse?",
  instruction: () =>
    "An acute angle is smaller than a right angle (less than 90°). An obtuse angle is " +
    "bigger (more than 90°). Sort the eight angles. Count how many of each you get.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return { phi: phiOf(r, o, 20), rot: rotOf(r) };
  },
  render(item) {
    return art(transversalSvg({ phi: item.phi, numbers: true, rot: item.rot, box: FIG })) +
      ask(`Acute: ${small()}${small()}${small()}${small()}`) +
      ask(`Obtuse: ${small()}${small()}${small()}${small()}`);
  },
  key(item) {
    const all = [1, 2, 3, 4, 5, 6, 7, 8];
    return [
      want.set(...all.filter((n) => angleSize(n, item.phi) < 90)),
      want.set(...all.filter((n) => angleSize(n, item.phi) > 90)),
    ];
  },
  answer(item) {
    const all = [1, 2, 3, 4, 5, 6, 7, 8];
    const acute = all.filter((n) => angleSize(n, item.phi) < 90);
    const obtuse = all.filter((n) => angleSize(n, item.phi) > 90);
    return [`acute ${acute.join(", ")} — obtuse ${obtuse.join(", ")}`];
  },
};

const aoFill = {
  id: "ao-fill",
  group: "acute-obtuse",
  label: "One angle gives you all eight",
  blurb: "All the acute ones are the same size, all the obtuse ones too, and one of each makes 180°.",
  heading: "Know one angle, know them all",
  instruction: () =>
    "There are only two sizes of angle here. Every acute angle is the same size, and " +
    "every obtuse angle is the same size. An acute one and an obtuse one sit on a " +
    "straight line, so together they make 180°. Fill in all the others.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { phi: phiOf(r, o), g: r.int(1, 8), rot: rotOf(r) };
  },
  render(item) {
    const v = angleSize(item.g, item.phi);
    const slots = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => n !== item.g).map((n) => deg(`∠${n} =`)).join("");
    return side(
      art(transversalSvg({ phi: item.phi, numbers: true, shade: [item.g], rot: item.rot, box: FIG })),
      `<p class="wb-ask wb-ask--lead">∠${item.g} = ${v}°</p>` + ask(slots)
    );
  },
  worked() {
    return worked(
      "One done for you",
      side(
        art(transversalSvg({ phi: 60, numbers: true, shade: [2], box: FIG })),
        say("∠2 = 60°, which is acute. So every acute angle is 60°: ∠2, ∠3, ∠6 and ∠7. " +
          "The obtuse ones are 180 − 60 = <b>120°</b>: ∠1, ∠4, ∠5 and ∠8.")
      )
    );
  },
  key(item) {
    return [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => n !== item.g).map((n) => want.num(angleSize(n, item.phi)));
  },
  answer(item) {
    return [[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `∠${n} = ${angleSize(n, item.phi)}°`).join(", ")];
  },
};

/* ═══ the "find x" pattern, shared by every named pair ═════════════════════*/

function workedFind(rel, g, u, phi) {
  const a = angleSize(g, phi);
  const x = angleSize(u, phi);
  const R = REL[rel];
  return worked(
    "One done for you",
    side(
      art(transversalSvg({ phi, box: FIG, labels: { [g]: `${a}°`, [u]: "x" } })),
      say(`These are ${R.name} angles: ${R.why}. ` +
        (R.equal
          ? `So they are equal: x = <b>${x}°</b>.`
          : `So they add up to 180°: x = 180 − ${a} = <b>${x}°</b>.`))
    )
  );
}

function findEx({ id, group, label, blurb, heading, instruction, rels, sample, count = 6 }) {
  const deal = dealer();
  return {
    id, group, label, blurb, heading,
    instruction: () => instruction,
    cols: 2,
    defaultCount: count,
    make(r, o, k, i) {
      const rel = deal(r, rels(o), i);
      const [g, u] = pairOf(r, rel);
      return { rel, g, u, phi: phiOf(r, o), rot: rotOf(r) };
    },
    render(item) {
      const labels = { [item.g]: `${angleSize(item.g, item.phi)}°`, [item.u]: "x" };
      return art(transversalSvg({ phi: item.phi, labels, rot: item.rot, box: FIG })) +
        ask(deg("x =")) + tick(SAME, PAIRED);
    },
    worked: () => workedFind(...sample),
    key(item) {
      return [want.num(angleSize(item.u, item.phi)), want.tick(REL[item.rel].equal ? 0 : 1)];
    },
    answer(item) {
      const a = angleSize(item.g, item.phi);
      const x = angleSize(item.u, item.phi);
      const R = REL[item.rel];
      return [`x = ${x}° — ${R.name}, ${R.equal ? "equal" : `180 − ${a}`}`];
    },
  };
}

function nameEx({ id, group, label, blurb, heading, instruction, rels }) {
  return {
    id, group, label, blurb, heading,
    instruction: () => instruction,
    cols: 2,
    defaultCount: 4,
    make(r, o) {
      const pool = rels(o);
      const angles = r.shuffle([...new Set(pool.flatMap((rel) => PAIRS[rel].flat()))]);
      /* two questions, never about the same pair */
      const first = angles[0];
      const relA = pool.find((rel) => PAIRS[rel].some((p) => p.includes(first)));
      const mate = PAIRS[relA].find((p) => p.includes(first)).find((n) => n !== first);
      const second = angles.find((n) => n !== first && n !== mate);
      return { phi: phiOf(r, o), asks: [first, second], pool };
    },
    render(item) {
      return art(transversalSvg({ phi: item.phi, numbers: true, box: FIG })) +
        item.asks.map((n) => ask(`∠${n} and ∠${small()} are ${REL[relOf(item.pool, n)].name}`)).join("");
    },
    key(item) {
      return item.asks.map((n) => want.num(mateOf(item.pool, n)));
    },
    answer(item) {
      return [item.asks.map((n) => `∠${n} and ∠${mateOf(item.pool, n)}`).join("; ")];
    },
  };
}

const relOf = (pool, n) => pool.find((rel) => PAIRS[rel].some((p) => p.includes(n)));
const mateOf = (pool, n) => PAIRS[relOf(pool, n)].find((p) => p.includes(n)).find((m) => m !== n);

function algebraEx({ id, group, label, heading, rels }) {
  const deal = dealer();
  return {
    id, group, label,
    blurb: "The pair rule turns into an equation. Solve it for x.",
    heading,
    instruction: () =>
      "Use the rule for the pair: equal angles give one expression = the other; " +
      "angles that make 180° give one + the other = 180. Solve for x, then find the angles.",
    cols: 2,
    defaultCount: 3,
    hardest: true,
    make(r, o, k, i) {
      const rel = deal(r, rels, i);
      const equal = REL[rel].equal;
      const P = exprPair(r, o, equal);
      /* the first expression goes on an angle of the right family for its
         size, and the figure is turned to fit */
      let [g, u] = pairOf(r, rel);
      if (!equal && familyOf(g) === familyOf(u)) [g, u] = [u, g];
      const phi = phiFor(g, P.v1);
      return { rel, g, u, phi, ...P };
    },
    render(item) {
      const labels = { [item.g]: expr(...item.e1), [item.u]: expr(...item.e2) };
      return art(transversalSvg({ phi: item.phi, labels, box: FIG })) + ask(deg("x ="));
    },
    key(item) {
      return [want.num(item.x)];
    },
    answer(item) {
      const R = REL[item.rel];
      return [`x = ${item.x} — ${R.name}, so the angles are ${item.v1}° and ${item.v2}°`];
    },
  };
}

/* ═══ 5. vertically opposite ═══════════════════════════════════════════════
   At ONE crossing first, where there is nothing else to look at. Positions
   go anticlockwise from the right: 1 and 3 are the angle a, 2 and 4 are
   180 − a. */

const crossSize = (k, a) => (k % 2 ? a : 180 - a);
const opposite = (k) => ((k + 1) % 4) + 1;
const crossRot = (r) => r.pick([0, 10, 20, 30, -10, -20]);

const voFind = {
  id: "vo-find",
  group: "vert-opp",
  label: "Opposite at a crossing",
  blurb: "Two straight lines cross. The angles opposite each other are equal.",
  heading: "Vertically opposite angles",
  instruction: () =>
    "Where two straight lines cross, the angles opposite each other are equal. " +
    "Find the angle marked x.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    return { a: phiOf(r, o), k: r.int(1, 4), rot: crossRot(r) };
  },
  render(item) {
    const labels = { [item.k]: `${crossSize(item.k, item.a)}°`, [opposite(item.k)]: "x" };
    return art(crossingSvg(item.a, { labels, rot: item.rot, box: CROSS })) + ask(deg("x ="));
  },
  worked() {
    return worked(
      "One done for you",
      side(
        art(crossingSvg(50, { labels: { 1: "50°", 3: "x" }, box: CROSS })),
        say("x is opposite the 50° angle, where the two lines cross. Opposite angles " +
          "are equal, so x = <b>50°</b>. Turn the page upside down: the picture is the same.")
      )
    );
  },
  key(item) {
    return [want.num(crossSize(opposite(item.k), item.a))];
  },
  answer(item) {
    return [`x = ${crossSize(item.k, item.a)}°`];
  },
};

const voAll = {
  id: "vo-all",
  group: "vert-opp",
  label: "All four at a crossing",
  blurb: "Opposite is equal; next door makes a straight line, 180°.",
  heading: "Find all four angles",
  instruction: () =>
    "Opposite angles are equal. Angles next to each other sit on a straight line, so " +
    "they add up to 180°. Find x, y and z.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return { a: phiOf(r, o), k: r.int(1, 4), rot: crossRot(r) };
  },
  render(item) {
    const labels = { [item.k]: `${crossSize(item.k, item.a)}°` };
    ["x", "y", "z"].forEach((l, j) => { labels[((item.k + j) % 4) + 1] = l; });
    return art(crossingSvg(item.a, { labels, rot: item.rot, box: CROSS })) +
      ask(`${deg("x =")}${deg("y =")}`) + ask(deg("z ="));
  },
  key(item) {
    return [0, 1, 2].map((j) => want.num(crossSize(((item.k + j) % 4) + 1, item.a)));
  },
  answer(item) {
    const out = ["x", "y", "z"].map((l, j) => `${l} = ${crossSize(((item.k + j) % 4) + 1, item.a)}°`);
    return [out.join(", ")];
  },
};

const voTrans = findEx({
  id: "vo-trans",
  group: "vert-opp",
  label: "Opposite on a transversal",
  blurb: "The same pair, at either crossing of a transversal.",
  heading: "Vertically opposite angles on a transversal",
  instruction:
    "A transversal makes two crossings, and each one has two pairs of opposite " +
    "angles. Find x, and tick what you know about the pair.",
  rels: () => ["vert"],
  sample: ["vert", 2, 3, 60],
  count: 4,
});

const voAlgebra = {
  id: "vo-algebra",
  group: "vert-opp",
  label: "Opposite angles written with x",
  blurb: "Opposite angles are equal, so the two expressions are equal.",
  heading: "Opposite angles written with x",
  instruction: () =>
    "The two angles are opposite each other, so they are equal. Make the two " +
    "expressions equal and solve for x. Then work out the angle.",
  cols: 2,
  defaultCount: 3,
  hardest: true,
  make(r, o) {
    const P = exprPair(r, o, true);
    const k = r.int(1, 4);
    const a = k % 2 ? P.v1 : 180 - P.v1;
    return { ...P, k, a, rot: crossRot(r) };
  },
  render(item) {
    const labels = { [item.k]: expr(...item.e1), [opposite(item.k)]: expr(...item.e2) };
    return art(crossingSvg(item.a, { labels, rot: item.rot, box: CROSS })) + ask(deg("x ="));
  },
  key(item) {
    return [want.num(item.x)];
  },
  answer(item) {
    return [`x = ${item.x} — both angles are ${item.v1}°`];
  },
};

/* ═══ 6. corresponding ═════════════════════════════════════════════════════*/

const coName = nameEx({
  id: "co-name",
  group: "corresponding",
  label: "Name the corresponding angle",
  blurb: "Same position, other crossing: 1 and 5, 2 and 6, 3 and 7, 4 and 8.",
  heading: "Corresponding angles",
  instruction:
    "Corresponding angles sit in the same position at the two crossings — both top " +
    "left, or both bottom right. Write the number of the angle that matches.",
  rels: () => ["corr"],
});

const coFind = findEx({
  id: "co-find",
  group: "corresponding",
  label: "Find the corresponding angle",
  blurb: "Slide one crossing down the transversal onto the other: it fits exactly.",
  heading: "Find the corresponding angle",
  instruction:
    "x and the angle given are corresponding angles: the same position at the two " +
    "crossings. Corresponding angles are equal. Find x, and tick what you know about the pair.",
  rels: () => ["corr"],
  sample: ["corr", 2, 6, 60],
});

const coAlgebra = algebraEx({
  id: "co-algebra",
  group: "corresponding",
  label: "Corresponding angles written with x",
  heading: "Corresponding angles written with x",
  rels: ["corr"],
});

/* ═══ 7. alternate ═════════════════════════════════════════════════════════*/

const altRels = (o) => (o.level === "gentle" ? ["altInt"] : ["altInt", "altExt"]);

const alName = nameEx({
  id: "al-name",
  group: "alternate",
  label: "Name the alternate angle",
  blurb: "Opposite sides of the transversal, both inside or both outside.",
  heading: "Alternate angles",
  instruction:
    "Alternate angles are on opposite sides of the transversal — both between the " +
    "parallels (interior) or both outside them (exterior). The interior ones make a Z. " +
    "Write the number of the angle that goes with each one.",
  rels: altRels,
});

const alFind = findEx({
  id: "al-find",
  group: "alternate",
  label: "Find the alternate angle",
  blurb: "Look for the Z. Alternate angles are equal.",
  heading: "Find the alternate angle",
  instruction:
    "x and the angle given are alternate angles. Alternate angles are equal. Find x, " +
    "and tick what you know about the pair.",
  rels: altRels,
  sample: ["altInt", 3, 6, 60],
});

const alAlgebra = algebraEx({
  id: "al-algebra",
  group: "alternate",
  label: "Alternate angles written with x",
  heading: "Alternate angles written with x",
  rels: ["altInt", "altExt"],
});

/* ═══ 8. consecutive interior ══════════════════════════════════════════════*/

const ciFind = findEx({
  id: "ci-find",
  group: "co-interior",
  label: "Find the consecutive interior angle",
  blurb: "Same side, both between the parallels. They make 180°, not equal.",
  heading: "Find the consecutive interior angle",
  instruction:
    "x and the angle given are consecutive interior angles (co-interior): between the " +
    "parallels, on the same side of the transversal. They make a C shape, and they add " +
    "up to 180°. Find x, and tick what you know about the pair.",
  rels: () => ["coInt"],
  sample: ["coInt", 3, 5, 60],
});

let checkFlip = 0;
const ciCheck = {
  id: "ci-check",
  group: "co-interior",
  label: "Are the lines really parallel?",
  blurb: "Add the two inside angles. Only exactly 180° means parallel.",
  heading: "Are the lines parallel?",
  instruction: () =>
    "There are no arrows this time — these lines might not be parallel. Add the two " +
    "consecutive interior angles. If they make exactly 180°, the lines are parallel. " +
    "If not, they are not, however straight they look.",
  cols: 2,
  defaultCount: 4,
  /* Drawn true to the numbers: a pair that makes 175° is drawn with the lines
     5° out of parallel, which is hard to see — that is the lesson. */
  make(r, o, k, i) {
    if (i === 0) checkFlip = r.chance(0.5) ? 1 : 0;
    const yes = (i + checkFlip) % 2 === 0;
    const L = levelOf(o);
    const off = L.step === 10 ? 10 : L.step === 5 ? r.pick([5, 10]) : r.int(2, 8);
    return {
      pair: r.pick([[3, 5], [4, 6]]),
      phi: phiOf(r, o, 20),
      skew: yes ? 0 : r.pick([-1, 1]) * off,
      yes,
    };
  },
  render(item) {
    const [a, b] = item.pair;
    const labels = {
      [a]: `${drawnSize(a, item.phi, item.skew)}°`,
      [b]: `${drawnSize(b, item.phi, item.skew)}°`,
    };
    return art(transversalSvg({ phi: item.phi, skew: item.skew, arrows: false, labels, box: FIG })) +
      ask(deg("Together")) + tick("parallel", "not parallel");
  },
  key(item) {
    const t = item.pair.reduce((sum, n) => sum + drawnSize(n, item.phi, item.skew), 0);
    return [want.num(t), want.tick(t === 180 ? 0 : 1)];
  },
  answer(item) {
    const [a, b] = item.pair.map((n) => drawnSize(n, item.phi, item.skew));
    const t = a + b;
    return [`${a} + ${b} = ${t}° — ${t === 180 ? "parallel" : "not parallel"}`];
  },
};

const ciAlgebra = algebraEx({
  id: "ci-algebra",
  group: "co-interior",
  label: "Consecutive interior angles written with x",
  heading: "Consecutive interior angles written with x",
  rels: ["coInt"],
});

/* ═══ 9. consecutive exterior ══════════════════════════════════════════════*/

const ceFind = findEx({
  id: "ce-find",
  group: "co-exterior",
  label: "Find the consecutive exterior angle",
  blurb: "Same side, both outside the parallels. They make 180° too.",
  heading: "Find the consecutive exterior angle",
  instruction:
    "x and the angle given are consecutive exterior angles: outside the parallels, on " +
    "the same side of the transversal. Like the interior pair, they add up to 180°. " +
    "Find x, and tick what you know about the pair.",
  rels: () => ["coExt"],
  sample: ["coExt", 1, 7, 60],
});

const dealSort = dealer();
const ceSort = {
  id: "ce-sort",
  group: "co-exterior",
  label: "Name the pair — all five kinds",
  blurb: "Which kind of pair is it, and so: equal, or 180° together?",
  heading: "What kind of pair is it?",
  instruction: () =>
    "Look at the two shaded angles. Tick the kind of pair they are, then tick what " +
    "that tells you about their sizes.",
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    const rel = dealSort(r, Object.keys(REL), i);
    const [a, b] = pairOf(r, rel);
    return { rel, a, b, phi: phiOf(r, o) };
  },
  render(item) {
    return side(
      art(transversalSvg({ phi: item.phi, numbers: true, shade: [item.a, item.b], box: FIG })),
      `<p class="wb-ask wb-ask--lead">∠${item.a} and ∠${item.b}</p>` +
        tick(...KINDS) + `<p class="wb-ask">so they are</p>` + tick(SAME, PAIRED)
    );
  },
  key(item) {
    const R = REL[item.rel];
    return [want.tick(KINDS.indexOf(R.kind)), want.tick(R.equal ? 0 : 1)];
  },
  answer(item) {
    const R = REL[item.rel];
    return [`${R.name} — ${R.equal ? "equal" : "add up to 180°"}`];
  },
};

/* ═══ 10. more than one transversal ════════════════════════════════════════*/

const cot = (d) => Math.cos((d * Math.PI) / 180) / Math.sin((d * Math.PI) / 180);

const dealTwo = dealer();
const mtTwo = {
  id: "mt-two",
  group: "multi-trans",
  label: "Two transversals",
  blurb: "Each transversal has its own two sizes. Only use angles on the same one.",
  heading: "Two transversals across the same parallels",
  instruction: () =>
    "Each transversal makes its own angles with the parallel lines. To find x, use " +
    "only the angle on the SAME transversal as x. Do the same for y.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const p0 = phiOf(r, o);
    let p1 = phiOf(r, o);
    for (let g = 0; g < 200 && (Math.abs(p1 - p0) < 15 || cot(p1) - cot(p0) > 1.05); g++) p1 = phiOf(r, o);
    const rels = Object.keys(REL).filter((rel) => rel !== "vert");
    const relX = dealTwo(r, rels, 2 * i);
    const relY = dealTwo(r, rels, 2 * i + 1);
    return { phis: [p0, p1], relX, relY, x: pairOf(r, relX), y: pairOf(r, relY) };
  },
  render(item) {
    const [p0, p1] = item.phis;
    const labels = {
      [`0.${item.x[0]}`]: `${angleSize(item.x[0], p0)}°`,
      [`0.${item.x[1]}`]: "x",
      [`1.${item.y[0]}`]: `${angleSize(item.y[0], p1)}°`,
      [`1.${item.y[1]}`]: "y",
    };
    return art(twoTransversalsSvg(item.phis, { labels, box: WIDE })) + ask(`${deg("x =")}${deg("y =")}`);
  },
  worked() {
    const labels = { "0.3": "70°", "0.6": "x", "1.2": "110°", "1.7": "y" };
    return worked(
      "One done for you",
      art(twoTransversalsSvg([70, 110], { labels, box: WIDE })) +
        say("x is on the left transversal with the 70°. They are alternate, so x = <b>70°</b>. " +
          "y is on the right transversal with the 110°. They are alternate exterior, so " +
          "y = <b>110°</b>. The 70° is no help with y — it is on the other line.")
    );
  },
  key(item) {
    const [p0, p1] = item.phis;
    return [want.num(angleSize(item.x[1], p0)), want.num(angleSize(item.y[1], p1))];
  },
  answer(item) {
    const [p0, p1] = item.phis;
    return [
      `x = ${angleSize(item.x[1], p0)}° (${REL[item.relX].name}), ` +
        `y = ${angleSize(item.y[1], p1)}° (${REL[item.relY].name})`,
    ];
  },
};

const mtThree = {
  id: "mt-three",
  group: "multi-trans",
  label: "Three parallel lines",
  blurb: "One transversal, three crossings — still only two sizes of angle.",
  heading: "One transversal across three parallel lines",
  instruction: () =>
    "The transversal crosses three parallel lines, so there are three crossings — " +
    "but still only two sizes of angle. Find x and y.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [cg, cx, cy] = r.shuffle([0, 1, 2]);
    return {
      phi: phiOf(r, o),
      g: cg * 4 + r.int(1, 4),
      x: cx * 4 + r.int(1, 4),
      y: cy * 4 + r.int(1, 4),
    };
  },
  render(item) {
    const labels = { [item.g]: `${angleSize(item.g, item.phi)}°`, [item.x]: "x", [item.y]: "y" };
    return art(transversalSvg({ phi: item.phi, lines: 3, labels, box: TALL })) + ask(`${deg("x =")}${deg("y =")}`);
  },
  key(item) {
    return [want.num(angleSize(item.x, item.phi)), want.num(angleSize(item.y, item.phi))];
  },
  answer(item) {
    return [`x = ${angleSize(item.x, item.phi)}°, y = ${angleSize(item.y, item.phi)}°`];
  },
};

/* ═══ 11. triangles on transversals ════════════════════════════════════════
   A triangle with its top corner on one parallel and its base on the other.
   Its two sides are transversals, so every angle round it is one of the
   pairs from this chapter — and the picture is the proof that a triangle's
   angles make 180°, which is where chapter one began. */

function triangleNumbers(r, o) {
  for (;;) {
    const p = stepped(r, o, 30, 80);
    const q = stepped(r, o, 30, 80);
    if (180 - p - q >= 30) return [p, q];
  }
}

const dealTri = dealer();
const ttFind = {
  id: "tt-find",
  group: "tri-trans",
  label: "Angles round a triangle between parallels",
  blurb: "The sides are transversals: alternate angles, and a straight line at the top.",
  heading: "Find the angles",
  instruction: () =>
    "The triangle's sides are transversals across the parallel lines. Look for " +
    "alternate angles (a Z), and remember the three angles at the top sit on a " +
    "straight line. Find x, y and z.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const [p, q] = triangleNumbers(r, o);
    return { p, q, given: dealTri(r, ["top", "base", "mixed"], i) };
  },
  render(item) {
    const { p, q } = item;
    const labels = {
      top: { pL: `${p}°`, pR: `${q}°`, bL: "x", bR: "y", top: "z" },
      base: { bL: `${p}°`, bR: `${q}°`, pL: "x", pR: "y", top: "z" },
      mixed: { pL: `${p}°`, bR: `${q}°`, bL: "x", pR: "y", top: "z" },
    }[item.given];
    return art(triangleBetweenSvg(p, q, { labels, box: FIG })) + ask(`${deg("x =")}${deg("y =")}`) + ask(deg("z ="));
  },
  worked() {
    return worked(
      "One done for you",
      side(
        art(triangleBetweenSvg(50, 60, { labels: { pL: "50°", pR: "60°", bL: "x", bR: "y", top: "z" }, box: FIG })),
        say("x and 50° are alternate (a Z), so x = <b>50°</b>. y and 60° are alternate, " +
          "so y = <b>60°</b>. The three angles at the top make a straight line: " +
          "z = 180 − 50 − 60 = <b>70°</b>.")
      )
    );
  },
  key(item) {
    const { p, q } = item;
    const z = 180 - p - q;
    /* x, y, z in the places they are asked, whichever pair was given */
    return [want.num(p), want.num(q), want.num(z)];
  },
  answer(item) {
    const z = 180 - item.p - item.q;
    return [`x = ${item.p}°, y = ${item.q}°, z = ${z}°`];
  },
};

const ttProof = {
  id: "tt-proof",
  group: "tri-trans",
  label: "Why a triangle makes 180°",
  blurb: "Two alternate pairs and a straight line — the proof, in four boxes.",
  heading: "Why the angles of a triangle add up to 180°",
  instruction: () =>
    "A line through the top corner, parallel to the base. Fill in each step. The last " +
    "line is the fact you found in Chapter 1 with a protractor — this time it is proved.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const [p, q] = triangleNumbers(r, o);
    return { p, q };
  },
  render(item) {
    const { p, q } = item;
    const labels = { pL: `${p}°`, pR: `${q}°`, bL: "a", bR: "b", top: "c" };
    return side(
      art(triangleBetweenSvg(p, q, { labels, box: FIG })),
      ask(`a is alternate to ${p}°, so ${deg("a =")}`) +
        ask(`b is alternate to ${q}°, so ${deg("b =")}`) +
        ask(`${p}°, c and ${q}° make a straight line, so ${deg("c =")}`) +
        ask(`a + b + c = ${deg("")}`)
    );
  },
  key(item) {
    return [want.num(item.p), want.num(item.q), want.num(180 - item.p - item.q), want.num(180)];
  },
  answer(item) {
    const c = 180 - item.p - item.q;
    return [`a = ${item.p}°, b = ${item.q}°, c = ${c}°, a + b + c = 180°`];
  },
};

export const TRANS_EXERCISES = [
  parSpot, parDraw,
  trWhich, trCount, trDraw,
  taInOut, taWhere,
  aoSort, aoFill,
  voFind, voAll, voTrans, voAlgebra,
  coName, coFind, coAlgebra,
  alName, alFind, alAlgebra,
  ciFind, ciCheck, ciAlgebra,
  ceFind, ceSort,
  mtTwo, mtThree,
  ttFind, ttProof,
];
