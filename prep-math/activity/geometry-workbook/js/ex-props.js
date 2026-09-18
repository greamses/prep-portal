/* ============================================================================
   Geometry Workbook — CHAPTER 11: Properties of polygons
   ----------------------------------------------------------------------------
   Six sections, in the order they were asked for, and one to pull them
   together:

     sides (slant and straight) · angles · heights of slant shapes ·
     diagonals · lines of symmetry · all the properties together

   Every section goes CONCRETE → REPRESENTATIONAL → ABSTRACT:

     concrete         centimetre squares to count, a shape at TRUE SIZE for a
                      ruler and a protractor, a shape to FOLD
     representational a drawing with the textbook's marks on it — ticks for
                      equal sides, chevrons for parallel ones, the square for a
                      right angle, a dashed height
     abstract         words only: riddles, properties, numbers

   Sides. A straight side runs along the lines of the squares and can be
   counted; a SLANT side cuts across them and cannot — it is longer than the
   squares it crosses, and Pythagoras says how much longer.

   Heights. The one idea: a slant shape's height is NOT its slant side. It is
   the distance straight up from the base, square to it, and it is always
   shorter than the slant side. Counted on squares first, then picked out from
   impostors, then measured, then found with Pythagoras.

   Symmetry. A line of symmetry is where a shape folds so that its two halves
   lie exactly on each other. On paper the questions say to trace, cut out and
   fold; on screen every dashed line can be tapped and the shape folds along
   it (the workbook's fold.js), and every line a child rules on a symmetry
   figure is folded along as soon as it is drawn. The classic trap is in the
   bank on purpose: a parallelogram does NOT fold onto itself along a
   diagonal, however much it looks as if it should.

   The lines of symmetry of every shape are FOUND, not written down — every
   line through two of its corners, side-middles and centre is folded in
   foldFits, and the ones that fit are the answer.
   ========================================================================== */

import { polySvg, symSnaps, gridSnaps, turn, anglesOf, sideLens, centreOf } from "./shapeart.js";
import { levelOf, helpOf, stepped, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";
import { foldFits, reflect, clipHalf, areaOf } from "/utils/components/workbook/fold.js";

const box = () => `<span class="wb-answer"></span>`;
const slot = (label, unit = "") => `<span class="wb-slot"><em>${label}</em>${box()}${unit}</span>`;
const art = (svg) => `<div class="gw-art">${svg}</div>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const side = (figure, words) => `<div class="gw-side">${figure}<div class="gw-lines">${words}</div></div>`;
const worked = (tag, body) => `<div class="wb-worked"><p class="wb-worked__tag">${tag}</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const lead = (html) => `<p class="wb-ask wb-ask--lead gw-word">${html}</p>`;
const workbox = (lines = 3) =>
  `<span class="wb-workbox" style="--wb-lines:${lines}">` +
  [...Array(lines - 1)].map((_, k) => `<span class="wb-workbox__rule" style="top:${(((k + 1) * 100) / lines).toFixed(1)}%"></span>`).join("") +
  `</span>`;

const FIG = { w: 64, h: 48 };
const tier = (o) => levelOf(o).id;
const shown = (o) => helpOf(o).id === "show";
const rnd = (v) => Math.round(v * 100) / 100;
const r1 = (v) => Math.round(v * 10) / 10;
const fmt = (v) => String(rnd(v));
const cm = (v) => `${fmt(v)} cm`;
const whole = (v) => Math.abs(v - Math.round(v)) < 1e-9;
const exactOr1 = (v) => (whole(v) ? want.num(Math.round(v)) : want.num(r1(v), 0.05));
const rad = (d) => (d * Math.PI) / 180;
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const YESNO = ["yes", "no"];

/* ── the quadrilaterals ────────────────────────────────────────────────────
   Every one anticlockwise from the bottom-left corner, so side 0 is the
   bottom, side 1 the right, side 2 the top and side 3 the left. */

const Q = {
  square: (s) => [[0, 0], [s, 0], [s, s], [0, s]],
  rectangle: (w, h) => [[0, 0], [w, 0], [w, h], [0, h]],
  rhombus: (s, A) => [[0, 0], [s, 0], [s + s * Math.cos(rad(A)), s * Math.sin(rad(A))], [s * Math.cos(rad(A)), s * Math.sin(rad(A))]],
  parallelogram: (b, d, h) => [[0, 0], [b, 0], [b + d, h], [d, h]],
  kite: (w, q, u) => [[0, -u], [w, 0], [0, q], [-w, 0]],
  isoTrap: (b, t, h) => [[0, 0], [b, 0], [(b + t) / 2, h], [(b - t) / 2, h]],
  rightTrap: (b, t, h) => [[0, 0], [b, 0], [t, h], [0, h]],
  trapezium: (b, t, h, x) => [[0, 0], [b, 0], [x + t, h], [x, h]],
};

/* What each one IS: its marks, and the facts the last section asks about. */
const KIND = {
  square: { name: "square", ticks: [1, 1, 1, 1], arrows: [1, 2, 1, 2], rights: [0, 1, 2, 3], sides: 0, par: 2, right: 4, dEq: 1, dPerp: 1, dBis: 1, sym: 4 },
  rectangle: { name: "rectangle", ticks: [1, 2, 1, 2], arrows: [1, 2, 1, 2], rights: [0, 1, 2, 3], sides: 1, par: 2, right: 4, dEq: 1, dPerp: 0, dBis: 1, sym: 2 },
  rhombus: { name: "rhombus", ticks: [1, 1, 1, 1], arrows: [1, 2, 1, 2], rights: [], sides: 0, par: 2, right: 0, dEq: 0, dPerp: 1, dBis: 1, sym: 2 },
  parallelogram: { name: "parallelogram", ticks: [1, 2, 1, 2], arrows: [1, 2, 1, 2], rights: [], sides: 1, par: 2, right: 0, dEq: 0, dPerp: 0, dBis: 1, sym: 0 },
  kite: { name: "kite", ticks: [1, 2, 2, 1], arrows: [], rights: [], sides: 2, par: 0, right: 0, dEq: 0, dPerp: 1, dBis: 0, sym: 1 },
  isoTrap: { name: "trapezium", ticks: [0, 1, 0, 1], arrows: [1, 0, 1, 0], rights: [], sides: 3, par: 1, right: 0, dEq: 1, dPerp: 0, dBis: 0, sym: 1 },
  rightTrap: { name: "trapezium", ticks: [], arrows: [1, 0, 1, 0], rights: [0, 3], sides: 4, par: 1, right: 2, dEq: 0, dPerp: 0, dBis: 0, sym: 0 },
  trapezium: { name: "trapezium", ticks: [], arrows: [1, 0, 1, 0], rights: [], sides: 4, par: 1, right: 0, dEq: 0, dPerp: 0, dBis: 0, sym: 0 },
};
const NAMES = ["square", "rectangle", "rhombus", "parallelogram", "kite", "trapezium"];
const SIDE_PATTERNS = ["all four equal", "opposite sides equal", "two pairs of neighbours equal", "just one pair equal", "no two equal"];

const RULER = { gentle: 1, middle: 0.5, stretch: 0.1 };

/**
 * One quadrilateral of a kind, printable at true size: at most 8.5 cm across
 * and 6 cm tall, lengths a ruler at this level can read, and different
 * enough from its neighbours in the family that it is not secretly one of
 * them (a "parallelogram" whose slant side happens to equal its base is a
 * rhombus).
 */
function quadOf(kind, r, o) {
  const st = RULER[tier(o)] || 1;
  const L = (lo, hi) => rnd(r.int(Math.ceil(lo / st), Math.floor(hi / st)) * st);
  const ang = () => stepped(r, o, 55, 75);
  for (let g = 0; g < 200; g++) {
    let pts;
    if (kind === "square") pts = Q.square(L(3, 5.5));
    else if (kind === "rectangle") { const w = L(4, 8); const h = L(2.5, 5); if (Math.abs(w - h) < 1) continue; pts = Q.rectangle(w, h); }
    else if (kind === "rhombus") pts = Q.rhombus(L(3, 5), ang());
    else if (kind === "parallelogram") {
      const b = L(4, 7); const h = L(2.5, 4.5); const d = L(1, 2.5);
      if (Math.abs(Math.hypot(d, h) - b) < 0.8) continue;
      pts = Q.parallelogram(b, d, h);
    } else if (kind === "kite") pts = Q.kite(L(2, 3.5), L(1.5, 2.5), L(3.5, 5.5));
    else if (kind === "isoTrap") { const b = L(6, 8.5); const t = L(2.5, b - 2); pts = Q.isoTrap(b, t, L(2.5, 4.5)); }
    else if (kind === "rightTrap") { const b = L(5, 8); const t = L(3, b - 1.5); pts = Q.rightTrap(b, t, L(3, 5)); }
    else {
      const b = L(6, 8.5); const t = L(2.5, b - 2.5); const h = L(3, 4.5); const x = L(0.5, b - t - 0.5);
      if (x <= 0 || Math.abs(x - (b - t) / 2) < 0.8) continue;
      const s = sideLens(Q.trapezium(b, t, h, x));
      if (s.some((a, i) => s.some((c, j) => i < j && Math.abs(a - c) < 0.6))) continue;
      pts = Q.trapezium(b, t, h, x);
    }
    return pts;
  }
  return Q.square(4);
}

/** Which of the five side patterns a quadrilateral has, from its lengths. */
function patternOf(pts) {
  const s = sideLens(pts);
  const eq = (i, j) => Math.abs(s[i] - s[j]) < 1e-6;
  if (eq(0, 1) && eq(1, 2) && eq(2, 3)) return 0;
  if (eq(0, 2) && eq(1, 3)) return 1;
  if ((eq(0, 1) && eq(2, 3)) || (eq(1, 2) && eq(3, 0))) return 2;
  if (eq(0, 1) || eq(1, 2) || eq(2, 3) || eq(3, 0) || eq(0, 2) || eq(1, 3)) return 3;
  return 4;
}

/** Four names to tick from, the right one among them. */
function fourNames(r, right) {
  return r.shuffle([right, ...r.shuffle(NAMES.filter((n) => n !== right)).slice(0, 3)]);
}

/* ── shapes on squares ─────────────────────────────────────────────────────*/

const GRID_SHAPES = [
  [[0, 0], [5, 0], [3, 3], [0, 3]],
  [[0, 0], [4, 0], [6, 3], [2, 3]],
  [[2, 0], [4, 2], [2, 5], [0, 2]],
  [[0, 0], [4, 0], [4, 3], [2, 5], [0, 3]],
  [[0, 0], [4, 0], [4, 2], [2, 2], [2, 4], [0, 4]],
  [[1, 0], [4, 0], [5, 2], [4, 4], [1, 4], [0, 2]],
  [[0, 0], [5, 0], [2, 4]],
  [[0, 0], [6, 0], [4, 3], [1, 3]],
  [[0, 0], [3, 0], [5, 2], [3, 4], [0, 4]],
  [[0, 0], [5, 0], [5, 2], [3, 4], [0, 4]],
  [[0, 0], [6, 0], [6, 4], [0, 4]],
  [[1, 0], [5, 0], [5, 3], [0, 3]],
];
const convex = (p) => anglesOf(p).every((a) => a < 180 - 1e-6);

/** A grid shape turned a quarter at a time (and mirrored), so it stays on the squares. */
function onSquares(pts, q, flip) {
  let out = pts.map(([x, y]) => [flip ? -x : x, y]);
  if (flip) out = out.reverse();
  for (let k = 0; k < q; k++) out = out.map(([x, y]) => [-y, x]);
  return out;
}

const isSlant = (p, q) => Math.abs(p[0] - q[0]) > 1e-9 && Math.abs(p[1] - q[1]) > 1e-9;

/* ═══ the groups ═══════════════════════════════════════════════════════════*/

export const PR_GROUPS = [
  { id: "pr-sides", chapter: "Chapter 11 · Properties of polygons", label: "Sides: slant and straight" },
  { id: "pr-angles", label: "Angles" },
  { id: "pr-heights", label: "Heights of slant shapes" },
  { id: "pr-diags", label: "Diagonals" },
  { id: "pr-sym", label: "Lines of symmetry" },
  { id: "pr-all", label: "All the properties together" },
];

/* ═══ 1. sides ═════════════════════════════════════════════════════════════*/

const dealGrid = dealer();

const prSidesGrid = {
  id: "pr-sides-grid",
  group: "pr-sides",
  label: "Straight or slant?",
  blurb: "On squares: a straight side runs along the lines, a slant side cuts across them.",
  heading: "Count the sides — straight and slant",
  instruction: () =>
    "A STRAIGHT side runs along the lines of the squares, across or up. A SLANT side cuts " +
    "across the squares at a slope. Count all the sides, then how many of each.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const pts = dealGrid(r, GRID_SHAPES, i);
    return { pts: onSquares(pts, r.int(0, 3), r.chance(0.5)) };
  },
  render(item) {
    return side(art(polySvg(item.pts, { grid: true, label: "A shape on centimetre squares" })),
      ask(slot("Sides")) + ask(slot("Straight")) + ask(slot("Slant")));
  },
  worked() {
    const p = GRID_SHAPES[0];
    return worked("One done for you", side(art(polySvg(p, { grid: true })),
      say("4 sides. The bottom, the left and the top run along the lines: <b>3 straight</b>. " +
        "The right-hand side cuts across the squares: <b>1 slant</b>.")));
  },
  key(item) {
    const n = item.pts.length;
    const s = item.pts.filter((p, i) => isSlant(p, item.pts[(i + 1) % n])).length;
    return [want.num(n), want.num(n - s), want.num(s)];
  },
  answer(item) {
    const n = item.pts.length;
    const s = item.pts.filter((p, i) => isSlant(p, item.pts[(i + 1) % n])).length;
    return [`${n} sides: ${n - s} straight, ${s} slant`];
  },
};

/* A slant side's length, from how far it goes across and how far up. */
const SLANTS = {
  gentle: [[3, 4], [4, 3], [6, 8], [8, 6]],
  middle: [[3, 4], [4, 3], [6, 8], [8, 6], [1, 2], [2, 3], [3, 5]],
  stretch: [[1, 3], [2, 5], [4, 5], [3, 7], [5, 6], [6, 8], [2, 7]],
};

const prSlant = {
  id: "pr-slant",
  group: "pr-sides",
  label: "How long is a slant side?",
  blurb: "Across and up can be counted; the slant side is longer than either — Pythagoras says how long.",
  heading: "Find the length of the slant side",
  instruction: (o) =>
    "Count how far the slant side goes ACROSS and how far it goes UP. Those two and the slant " +
    "side make a right-angled triangle, so the slant side² = across² + up²." +
    (tier(o) === "gentle" ? "" : " Give it to one decimal place when it is not whole."),
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const [a, b] = r.pick(SLANTS[tier(o)] || SLANTS.gentle);
    return { a, b, flip: r.chance(0.5) };
  },
  render(item) {
    const { a, b } = item;
    const s = item.flip ? -1 : 1;
    const P = [0, 0];
    const Qp = [s * a, b];
    const fig = polySvg([], {
      grid: true, outline: false, solid: [[P, Qp]],
      lines: [{ a: P, b: [s * a, 0], kind: "plain" }, { a: [s * a, 0], b: Qp, kind: "plain" }],
      label: "A slant line on centimetre squares",
    });
    return side(art(fig), ask(slot("Across", " cm")) + ask(slot("Up", " cm")) + ask(slot("Slant side", " cm")));
  },
  worked() {
    return worked("One done for you", say(
      "The slant side goes 3 across and 4 up. 3² + 4² = 9 + 16 = 25, and √25 = 5, so it is " +
      "<b>5 cm</b> — longer than 3 and longer than 4. A slant side always is longer than " +
      "its across and its up."));
  },
  key(item) {
    return [want.num(item.a), want.num(item.b), exactOr1(Math.hypot(item.a, item.b))];
  },
  answer(item) {
    const c = Math.hypot(item.a, item.b);
    return [`${item.a}² + ${item.b}² = ${item.a ** 2 + item.b ** 2}; slant side ${whole(c) ? "=" : "≈"} ${fmt(r1(c))} cm`];
  },
};

const SIDE_KINDS = ["square", "rectangle", "rhombus", "parallelogram", "kite", "isoTrap", "trapezium"];
const dealSideKind = dealer();

const prSidesMeasure = {
  id: "pr-sides-measure",
  group: "pr-sides",
  label: "Measure the four sides",
  blurb: "True size: measure every side, then say which sides are equal.",
  heading: "Measure the sides and compare them",
  instruction: (o) =>
    "The shape is printed at its real size. Measure each side in centimetres" +
    ({ gentle: "", middle: ", to the nearest half centimetre", stretch: ", to the millimetre" }[tier(o)]) +
    ". Then tick which sides are equal.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const kind = dealSideKind(r, SIDE_KINDS, i);
    return { kind, pts: turn(quadOf(kind, r, o), r.pick([0, 90, 180, 270]), r.chance(0.5)) };
  },
  render(item) {
    const fig = polySvg(item.pts, { scale: 10, letters: LETTERS, label: "A four-sided shape at true size" });
    const names = ["AB", "BC", "CD", "DA"];
    return side(art(fig), ask(names.map((n) => slot(n, " cm")).join("")) + tick(...SIDE_PATTERNS));
  },
  key(item) {
    return [...sideLens(item.pts).map((v) => want.num(r1(v), 0.2)), want.tick(patternOf(item.pts))];
  },
  answer(item) {
    const s = sideLens(item.pts);
    return [`AB ${cm(r1(s[0]))}, BC ${cm(r1(s[1]))}, CD ${cm(r1(s[2]))}, DA ${cm(r1(s[3]))} — ${SIDE_PATTERNS[patternOf(item.pts)]}`];
  },
};

const MARK_KINDS = ["square", "rectangle", "rhombus", "parallelogram", "kite", "isoTrap", "rightTrap", "trapezium"];
const dealMark = dealer();

const prSidesMarks = {
  id: "pr-sides-marks",
  group: "pr-sides",
  label: "Read the marks, name the shape",
  blurb: "Ticks: equal sides. Chevrons: parallel sides. Squares: right angles.",
  heading: "Name the four-sided shape from its marks",
  instruction: () =>
    "Sides with the same number of ticks are equal. Sides with the same number of chevrons " +
    "(>) are parallel — they never meet. A little square is a right angle. Read the marks, " +
    "not the look of it, and tick the name.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const kind = dealMark(r, MARK_KINDS, i);
    const pts = quadOf(kind, r, { ...o, level: "gentle" });
    return { kind, pts, turnBy: tier(o) === "gentle" ? 0 : r.pick([0, 90, 180, 270, 30, -30]), opts: fourNames(r, KIND[kind].name) };
  },
  render(item) {
    const K = KIND[item.kind];
    const pts = turn(item.pts, item.turnBy);
    return side(art(polySvg(pts, { box: { w: 48, h: 40 }, ticks: K.ticks, arrows: K.arrows, rights: K.rights })), tick(...item.opts));
  },
  worked() {
    const K = KIND.parallelogram;
    return worked("One done for you", side(art(polySvg(Q.parallelogram(5, 1.8, 3), { box: { w: 48, h: 40 }, ticks: K.ticks, arrows: K.arrows })),
      say("Opposite sides have the same ticks — equal — and the same chevrons — parallel. No " +
        "square corners. That is a <b>parallelogram</b>. With square corners it would be a rectangle.")));
  },
  key(item) {
    return [want.tick(item.opts.indexOf(KIND[item.kind].name))];
  },
  answer(item) {
    return [KIND[item.kind].name];
  },
};

const RIDDLES = {
  square: ["I have four equal sides and four right angles.", "My two diagonals are equal and cross at right angles, and all my sides are the same."],
  rectangle: ["My opposite sides are equal and all four of my angles are right angles, but my sides are not all equal.", "I have four right angles and two lines of symmetry."],
  rhombus: ["I have four equal sides but no right angles.", "My four sides are equal; my diagonals cross at right angles but are not equal."],
  parallelogram: ["My opposite sides are parallel and equal, I have no right angles, and I have no lines of symmetry.", "I am a slanted rectangle: two pairs of parallel sides, but no square corners."],
  kite: ["I have two pairs of equal sides, but the equal sides are next to each other, not opposite.", "I have one line of symmetry, and no parallel sides."],
  trapezium: ["I have exactly one pair of parallel sides.", "Two of my sides are parallel and the other two are not."],
};
const dealRiddle = dealer();

const prRiddle = {
  id: "pr-riddle",
  group: "pr-sides",
  label: "Which shape am I?",
  blurb: "No picture: the properties alone name the shape.",
  heading: "Which four-sided shape am I?",
  instruction: () => "Read the clue. Sketch it if it helps. Tick the shape it describes.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const name = dealRiddle(r, NAMES, i);
    return { name, clue: r.pick(RIDDLES[name]), opts: fourNames(r, name) };
  },
  render(item) {
    return lead(item.clue) + tick(...item.opts);
  },
  key(item) {
    return [want.tick(item.opts.indexOf(item.name))];
  },
  answer(item) {
    return [item.name];
  },
};

/* ═══ 2. angles ════════════════════════════════════════════════════════════*/

/** A quadrilateral built from a whole-number angle, so its corners measure exactly. */
function fromAngle(kind, r, o) {
  const t = tier(o);
  if (kind === "parallelogram" || kind === "rhombus") {
    const A = stepped(r, o, 50, 80);
    if (kind === "rhombus") return { kind, A, pts: Q.rhombus(t === "gentle" ? 4 : 4.5, A) };
    const h = 3.5;
    return { kind, A, pts: Q.parallelogram(t === "gentle" ? 5 : 5.5, h / Math.tan(rad(A)), h) };
  }
  if (kind === "isoTrap") {
    const A = stepped(r, o, 55, 75);
    const h = 3.2;
    const off = h / Math.tan(rad(A));
    return { kind, A, pts: Q.isoTrap(7, 7 - 2 * off, h) };
  }
  /* a kite: its bottom and top angles, the two side ones equal to each other */
  let a; let b;
  do { a = stepped(r, o, 50, 90); b = stepped(r, o, 95, 130); } while ((360 - a - b) % 2);
  const w = 2.6;
  return { kind: "kite", a, b, pts: Q.kite(w, w / Math.tan(rad(b / 2)), w / Math.tan(rad(a / 2))) };
}

const ANGLE_KINDS = ["parallelogram", "kite", "isoTrap", "rhombus"];
const dealAngle = dealer();

const prAngMeasure = {
  id: "pr-ang-measure",
  group: "pr-angles",
  label: "Measure the four angles",
  blurb: "True size, with a protractor. The four always add up to 360°.",
  heading: "Measure each angle, then add them",
  instruction: () =>
    "The shape is printed at its real size. Measure each angle with a protractor — the " +
    "cut-out one, or the one in the toolbox on screen. Then add all four.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const s = fromAngle(dealAngle(r, ANGLE_KINDS, i), r, o);
    return { pts: turn(s.pts, r.pick([0, 180]), r.chance(0.5)) };
  },
  render(item) {
    return side(art(polySvg(item.pts, { scale: 10, letters: LETTERS, snap: item.pts, label: "A four-sided shape at true size" })),
      ask(["A", "B", "C", "D"].map((l) => slot(`∠${l}`, "°")).join("")) + ask(slot("Together", "°")));
  },
  worked() {
    return worked("One done for you", say(
      "Put the protractor's centre on the corner and its zero line along one side; read where " +
      "the other side crosses the scale — the scale that starts at 0 on your side. A parallelogram " +
      "measured 70°, 110°, 70° and 110°: together <b>360°</b>. Every four-sided shape comes to 360°."));
  },
  key(item) {
    return [...anglesOf(item.pts).map((a) => want.num(Math.round(a), 2)), want.num(360, 4)];
  },
  answer(item) {
    return [`${anglesOf(item.pts).map((a) => `${Math.round(a)}°`).join(", ")} — together 360°`];
  },
};

const prAngKinds = {
  id: "pr-ang-kinds",
  group: "pr-angles",
  label: "Right, acute and obtuse corners",
  blurb: "On squares: a right angle fits a square's corner; acute is less, obtuse is more.",
  heading: "Count each kind of angle",
  instruction: () =>
    "Look at every corner. A RIGHT angle is a square corner. ACUTE is sharper than that; " +
    "OBTUSE is wider than a square corner but not flat. Count each kind.",
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    const list = GRID_SHAPES.filter(convex);
    return { pts: onSquares(dealGrid(r, list, i), r.int(0, 3), r.chance(0.5)) };
  },
  render(item) {
    return side(art(polySvg(item.pts, { grid: true, label: "A shape on centimetre squares" })),
      ask(slot("Right")) + ask(slot("Acute")) + ask(slot("Obtuse")));
  },
  key(item) {
    const a = anglesOf(item.pts);
    return [want.num(a.filter((x) => Math.abs(x - 90) < 0.5).length), want.num(a.filter((x) => x < 89.5).length), want.num(a.filter((x) => x > 90.5).length)];
  },
  answer(item) {
    const a = anglesOf(item.pts);
    return [`right ${a.filter((x) => Math.abs(x - 90) < 0.5).length}, acute ${a.filter((x) => x < 89.5).length}, obtuse ${a.filter((x) => x > 90.5).length}`];
  },
};

const prAngProps = {
  id: "pr-ang-props",
  group: "pr-angles",
  label: "Angles from the properties",
  blurb: "Opposite angles of a parallelogram are equal; a kite's side angles are equal.",
  heading: "Find the angles marked with letters",
  instruction: () =>
    "Use what the shape is. A parallelogram or rhombus: opposite angles are equal, and two " +
    "angles next to each other add up to 180°. A kite: the two angles between the unequal " +
    "sides are equal. A trapezium with equal slant sides: the two angles on each parallel side " +
    "are equal. All four always make 360°.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    return fromAngle(dealAngle(r, ANGLE_KINDS, i), r, o);
  },
  render(item) {
    const K = KIND[item.kind];
    let angles;
    let slots;
    if (item.kind === "kite") {
      angles = [{ at: 0, label: `${item.a}°` }, { at: 2, label: `${item.b}°` }, { at: 1, label: "x" }, { at: 3, label: "y" }];
      slots = ["x", "y"];
    } else {
      angles = [{ at: 0, label: `${item.A}°` }, { at: 1, label: "x" }, { at: 2, label: "y" }, { at: 3, label: "z" }];
      slots = ["x", "y", "z"];
    }
    return side(art(polySvg(item.pts, { box: FIG, ticks: K.ticks, arrows: K.arrows, angles })),
      ask(slots.map((s) => slot(s, "°")).join("")));
  },
  worked() {
    const s = { kind: "parallelogram", A: 70, pts: Q.parallelogram(5, 3.2 / Math.tan(rad(70)), 3.2) };
    const K = KIND.parallelogram;
    return worked("One done for you", side(art(polySvg(s.pts, { box: FIG, ticks: K.ticks, arrows: K.arrows, angles: [{ at: 0, label: "70°" }, { at: 1, label: "x" }, { at: 2, label: "y" }, { at: 3, label: "z" }] })),
      say("x is next to 70° along a side: 180 − 70 = <b>110°</b>. y is opposite 70°: <b>70°</b>. " +
        "z is opposite x: <b>110°</b>. Check: 70 + 110 + 70 + 110 = 360.")));
  },
  key(item) {
    if (item.kind === "kite") { const x = (360 - item.a - item.b) / 2; return [want.num(x), want.num(x)]; }
    const A = item.A;
    if (item.kind === "isoTrap") return [want.num(A), want.num(180 - A), want.num(180 - A)];
    return [want.num(180 - A), want.num(A), want.num(180 - A)];
  },
  answer(item) {
    if (item.kind === "kite") { const x = (360 - item.a - item.b) / 2; return [`x = y = (360 − ${item.a} − ${item.b}) ÷ 2 = ${x}°`]; }
    const A = item.A;
    if (item.kind === "isoTrap") return [`x = ${A}°, y = z = ${180 - A}°`];
    return [`x = ${180 - A}°, y = ${A}°, z = ${180 - A}°`];
  },
};

const ANG_WORDS = [
  (r, o) => { let a; let b; let c; do { a = stepped(r, o, 60, 130); b = stepped(r, o, 60, 130); c = stepped(r, o, 60, 130); } while (360 - a - b - c < 40 || 360 - a - b - c > 150); return { text: `Three angles of a four-sided shape are ${a}°, ${b}° and ${c}°. What is the fourth?`, v: [360 - a - b - c], labels: ["Fourth angle"] }; },
  (r, o) => { const A = stepped(r, o, 40, 80); return { text: `One angle of a parallelogram is ${A}°. What are the angle next to it and the angle opposite it?`, v: [180 - A, A], labels: ["Next to it", "Opposite"] }; },
  (r, o) => { let a; let b; do { a = stepped(r, o, 50, 90); b = stepped(r, o, 90, 140); } while ((360 - a - b) % 2); return { text: `A kite has a ${a}° angle at its bottom and a ${b}° angle at its top. Its two side angles are equal. How big is each?`, v: [(360 - a - b) / 2], labels: ["Each side angle"] }; },
  (r, o) => { const A = stepped(r, o, 45, 80); return { text: `A trapezium has an angle of ${A}° at one end of a slant side. What is the angle at the other end of that slant side, between the same two parallel sides?`, v: [180 - A], labels: ["The other angle"] }; },
  (r, o) => { const A = stepped(r, o, 40, 80); return { text: `The angles of a rhombus are a small one of ${A}° and three others. What are all four?`, v: [A, 180 - A, A, 180 - A], labels: ["", "", "", ""] }; },
];
const dealAngWords = dealer();

const prAngWords = {
  id: "pr-ang-words",
  group: "pr-angles",
  label: "Angle problems",
  blurb: "No drawing: 360° altogether, and what the shape's properties say.",
  heading: "Angle problems",
  instruction: () =>
    "Sketch the shape. The four angles of any four-sided shape add up to 360°; then use what " +
    "that shape's angles always do.",
  cols: 1,
  defaultCount: 5,
  make(r, o, k, i) {
    return dealAngWords(r, ANG_WORDS, i)(r, o);
  },
  render(item) {
    return lead(item.text) + workbox(2) + ask(item.labels.map((l) => slot(l || "∠", "°")).join(""));
  },
  key(item) {
    return item.labels.every((l) => !l) ? [want.set(...item.v)] : item.v.map((v) => want.num(v));
  },
  answer(item) {
    return [item.v.map((v) => `${v}°`).join(", ")];
  },
};

/* ═══ 3. heights of slant shapes ═══════════════════════════════════════════*/

/** A slant shape on squares with its base along the bottom: a parallelogram,
    a triangle or (from Middle) a trapezium. */
function slantOnSquares(r, o, i) {
  const t = tier(o);
  const kinds = t === "gentle" ? ["parallelogram", "triangle"] : ["parallelogram", "triangle", "trapezium"];
  const kind = kinds[i % kinds.length];
  const b = r.int(3, t === "gentle" ? 5 : 6);
  const h = r.int(2, 4);
  if (kind === "parallelogram") { const d = r.int(1, 2); return { kind, b, h, pts: Q.parallelogram(b, d, h), area: b * h }; }
  if (kind === "triangle") { const x = r.int(1, b - 1); return { kind, b, h, pts: [[0, 0], [b, 0], [x, h]], area: (b * h) / 2 }; }
  const top = r.int(2, b - 1); const x = r.int(1, b - top);
  return { kind, b, h, top, pts: Q.trapezium(b, top, h, x), area: ((b + top) * h) / 2 };
}

const prHGrid = {
  id: "pr-h-grid",
  group: "pr-heights",
  label: "Count the height, not the slant",
  blurb: "On squares: the height is how far STRAIGHT up — count it; the slant side cannot be counted.",
  heading: "Count the base and the height, then find the area",
  instruction: () =>
    "The base is along the bottom. The HEIGHT is how far it is straight up from the base to the " +
    "top — count the squares upwards, never along the slant side. Parallelogram: base × height. " +
    "Triangle: base × height ÷ 2. Trapezium: the two parallel sides added, ÷ 2, × height.",
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    return slantOnSquares(r, o, i);
  },
  render(item) {
    const words = item.kind === "trapezium"
      ? ask(slot("Bottom", " cm") + slot("Top", " cm")) + ask(slot("Height", " cm")) + ask(slot("Area", " cm²"))
      : ask(slot("Base", " cm")) + ask(slot("Height", " cm")) + ask(slot("Area", " cm²"));
    return side(art(polySvg(item.pts, { grid: true, label: `A ${item.kind} on centimetre squares` })), words);
  },
  worked() {
    return worked("One done for you", side(art(polySvg(Q.parallelogram(4, 2, 3), { grid: true, lines: [{ a: [2, 3], b: [2, 0], kind: "height", along: [0, 0] }] })),
      say("The base is 4 squares long. Straight up from it to the top is 3 squares — that red " +
        "dashed line, not the slanted side. Area: 4 × 3 = <b>12 cm²</b>.")));
  },
  key(item) {
    return item.kind === "trapezium"
      ? [want.num(item.b), want.num(item.top), want.num(item.h), want.num(item.area)]
      : [want.num(item.b), want.num(item.h), want.num(item.area)];
  },
  answer(item) {
    return item.kind === "trapezium"
      ? [`(${item.b} + ${item.top}) ÷ 2 × ${item.h} = ${fmt(item.area)} cm²`]
      : [`base ${item.b}, height ${item.h} — area ${fmt(item.area)} cm²`];
  },
};

/* The height among impostors: a slant side, a sloping dashed line, and the
   one dashed line that is square to the base. */
function candidates(r, o) {
  const kind = r.pick(["parallelogram", "trapezium", "triangle"]);
  let pts;
  let topAt;
  if (kind === "parallelogram") { pts = Q.parallelogram(6, 2.4, 3.4); topAt = [3.6, 5.6]; }
  else if (kind === "trapezium") { pts = Q.trapezium(7, 3, 3.4, 1.6); topAt = [2.2, 4]; }
  else { pts = [[0, 0], [6.4, 0], [2.4, 3.8]]; topAt = [2.4, 2.4]; }
  const h = pts[2][1];
  const x = kind === "triangle" ? 2.4 : r.int(Math.round(topAt[0] * 10), Math.round(topAt[1] * 10)) / 10;
  const lean = r.pick([-1, 1]) * r.int(12, 18) / 10;
  const upright = { a: [x, h], b: [x, 0] };
  const sloping = { a: [kind === "triangle" ? 2.4 : x + (lean > 0 ? -0.6 : 0.6), h], b: [x + lean + (kind === "triangle" ? 0 : 0), 0] };
  const order = r.chance(0.5) ? ["b", "c"] : ["c", "b"];
  return { kind, pts, upright, sloping, names: order };
}

const prHWhich = {
  id: "pr-h-which",
  group: "pr-heights",
  label: "Which line is the height?",
  blurb: "A slant side, a sloping line and the height: only one is square to the base.",
  heading: "Which one is the height?",
  instruction: () =>
    "The height meets the base at a right angle. Check each line with the corner of a page or " +
    "a set square — on screen, the set square in the toolbox. Tick the height.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return candidates(r, o);
  },
  render(item) {
    const [nUp, nSlope] = item.names;
    const lines = [
      /* labelled near their feet, where the two lines are furthest apart */
      { ...item.upright, kind: "plain", label: nUp, at: 0.14 },
      { ...item.sloping, kind: "plain", label: nSlope, at: 0.14 },
    ];
    const n = item.pts.length;
    const sides = [...Array(n)].map((_, j) => (j === n - 1 ? "a" : null));
    return side(art(polySvg(item.pts, { box: FIG, sides, lines, snap: [...item.pts, item.upright.b, item.sloping.b] })), tick("a", "b", "c"));
  },
  worked() {
    return worked("One done for you", say(
      "Side a slopes: that is the slant side, not the height. One dashed line leans; the other " +
      "stands straight up, and the corner of a page fits exactly where it meets the base. That " +
      "one is the height."));
  },
  key(item) {
    return [want.tick(["a", "b", "c"].indexOf(item.names[0]))];
  },
  answer(item) {
    return [`${item.names[0]} — it meets the base at a right angle`];
  },
};

const prHMeasure = {
  id: "pr-h-measure",
  group: "pr-heights",
  label: "Measure the height and the slant side",
  blurb: "True size: the height is always shorter than the slant side.",
  heading: "Measure, compare, and find the area",
  instruction: () =>
    "The parallelogram is printed at real size. Measure its base, its slant side, and its " +
    "height (the red dashed line). Which is longer? Then find the area: base × height.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const st = RULER[tier(o)] || 1;
    const L = (lo, hi) => rnd(r.int(Math.ceil(lo / st), Math.floor(hi / st)) * st);
    const b = L(5, 7.5); const h = L(2.5, 4); const d = L(1.2, 2.5);
    return { b, h, d, flip: r.chance(0.5) };
  },
  render(item) {
    const { b, h, d } = item;
    const pts = Q.parallelogram(b, d, h);
    const fig = polySvg(pts, { scale: 10, lines: [{ a: [d, h], b: [d, 0], kind: "height", along: [0, 0] }], label: "A parallelogram at true size" });
    return side(art(fig),
      ask(slot("Base", " cm") + slot("Slant side", " cm")) + ask(slot("Height", " cm")) +
      ask("Longer:") + tick("the slant side", "the height") + ask(slot("Area", " cm²")));
  },
  key(item) {
    const { b, h, d } = item;
    const s = Math.hypot(d, h);
    return [want.num(b, 0.2), want.num(r1(s), 0.2), want.num(h, 0.2), want.tick(0), want.num(rnd(b * h), 0.2 * (b + h) + 0.1)];
  },
  answer(item) {
    const { b, h, d } = item;
    return [`base ${cm(b)}, slant ${cm(r1(Math.hypot(d, h)))}, height ${cm(h)}; the slant side is longer; area ${fmt(b * h)} cm²`];
  },
};

const HEIGHT_TRIPLES = { gentle: [[3, 4, 5], [6, 8, 10]], middle: [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]], stretch: [[5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [1.5, 2, 2.5]] };

const prHPyth = {
  id: "pr-h-pyth",
  group: "pr-heights",
  label: "The height by Pythagoras",
  blurb: "The slant side, the height and a piece of the base make a right-angled triangle.",
  heading: "Find the height, then the area",
  instruction: () =>
    "The dashed height cuts off a right-angled triangle: the slant side is its longest side, " +
    "and the short piece of the base is another. Height² = slant² − piece². Then the area.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const [d, h, s] = r.pick(HEIGHT_TRIPLES[tier(o)] || HEIGHT_TRIPLES.gentle);
    const trap = tier(o) !== "gentle" && i % 2 === 1;
    const b = rnd(d + r.int(Math.ceil(s * 0.6), Math.ceil(s * 1.3)));
    return { d, h, s, b, trap };
  },
  render(item, o) {
    const { d, h, s, b, trap } = item;
    const pts = trap ? Q.isoTrap(b + 2 * d, b, h).map(([x, y]) => [x, y]) : Q.parallelogram(b, d, h);
    const foot = trap ? [d, 0] : [d, 0];
    const top = trap ? pts[3] : pts[3];
    const lines = [
      { a: top, b: foot, kind: "height", along: [0, 0], label: "h" },
      { a: [0, -0.9], b: [d, -0.9], kind: "plain", label: cm(d), at: 0.5 },
    ];
    const n = pts.length;
    /* a parallelogram's base is written on its top (the same length), clear
       of the piece of base marked underneath */
    const sides = trap ? [cm(b + 2 * d), null, cm(b), cm(s)] : [null, null, cm(b), cm(s)];
    const ticks = trap ? [0, 1, 0, 1] : [];
    const fig = polySvg(pts, { box: { w: 70, h: 46 }, sides, ticks, lines });
    void n;
    const areaWord = trap ? "Area: (top + bottom) ÷ 2 × h" : "Area: base × h";
    return side(art(fig), ask(`h² = ${fmt(s)}² − ${fmt(d)}² = ${box()}`) + ask(slot("h", " cm")) + ask(slot(shown(o) ? areaWord : "Area", " cm²")));
  },
  worked() {
    return worked("One done for you", say(
      "The slant side is 5 cm and the piece of base cut off is 3 cm. h² = 25 − 9 = 16, so h = 4 cm. " +
      "With a base of 7 cm the parallelogram's area is 7 × 4 = <b>28 cm²</b> — not 7 × 5."));
  },
  key(item) {
    const { d, h, s, b, trap } = item;
    const area = trap ? ((2 * b + 2 * d) / 2) * h : b * h;
    return [want.num(rnd(s * s - d * d)), want.num(h), want.num(rnd(area))];
  },
  answer(item) {
    const { d, h, s, b, trap } = item;
    const area = trap ? ((2 * b + 2 * d) / 2) * h : b * h;
    return [`h² = ${fmt(s * s)} − ${fmt(d * d)} = ${fmt(h * h)}, h = ${fmt(h)} cm; area ${fmt(area)} cm²`];
  },
};

const H_WORDS = [
  (r, o) => { const b = r.int(4, 15); const h = r.int(2, 12); return { text: `A parallelogram has an area of ${b * h} cm² and a base of ${b} cm. How tall is it?`, v: h }; },
  (r, o) => { const a = r.int(3, 10); const c = a + r.int(2, 8); const h = 2 * r.int(1, 6); return { text: `A trapezium's parallel sides are ${a} cm and ${c} cm, and its area is ${((a + c) * h) / 2} cm². How far apart are the parallel sides?`, v: h }; },
  (r, o) => { const b = r.int(5, 12); const h = r.int(3, 8); const s = r1(Math.hypot(r.int(1, 4), h)); return { text: `A parallelogram's sides are ${b} cm and ${s} cm, and its height, measured from the ${b} cm side, is ${h} cm. What is its area?`, v: b * h }; },
];
const dealH = dealer();

const prHWords = {
  id: "pr-h-words",
  group: "pr-heights",
  label: "Height problems",
  blurb: "Area and base given: the height. And a slant side that is not the height.",
  heading: "Height problems",
  instruction: () =>
    "Parallelogram: area = base × height, so height = area ÷ base. Trapezium: area = the two " +
    "parallel sides added, ÷ 2, × height. A slant side is never used in place of the height.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    return dealH(r, H_WORDS, i)(r, o);
  },
  render(item) {
    return lead(item.text) + workbox(2) + ask(slot("Answer", item.text.includes("area?") ? " cm²" : " cm"));
  },
  key(item) {
    return [want.num(item.v)];
  },
  answer(item) {
    return [fmt(item.v)];
  },
};

/* ═══ 4. diagonals ═════════════════════════════════════════════════════════*/

function regular(n, R = 3) {
  return [...Array(n)].map((_, i) => {
    const a = rad(-90 + 180 / n + (360 * i) / n);
    return [+(R * Math.cos(a)).toFixed(4), +(R * Math.sin(a)).toFixed(4)];
  });
}

/** A convex polygon with n corners, a little uneven so it does not look regular. */
function uneven(r, n) {
  for (let g = 0; g < 100; g++) {
    const steps = [...Array(n)].map(() => 0.7 + r.int(0, 6) / 10);
    const tot = steps.reduce((a, b) => a + b, 0);
    let acc = 0;
    const pts = steps.map((s) => {
      const a = (2 * Math.PI * acc) / tot - Math.PI / 2;
      acc += s;
      const R = 3 * (0.85 + r.int(0, 3) / 20);
      return [+(R * Math.cos(a)).toFixed(3), +(R * Math.sin(a)).toFixed(3)];
    });
    if (convex(pts) && anglesOf(pts).every((x) => x < 165)) return pts;
  }
  return regular(n);
}

const prDDraw = {
  id: "pr-d-draw",
  group: "pr-diags",
  label: "Draw every diagonal",
  blurb: "Corner to corner, but not along a side. Count them from one corner, then all of them.",
  heading: "Draw all the diagonals",
  instruction: () =>
    "A DIAGONAL joins two corners that are not next to each other. Rule every one — on screen, " +
    "drag from corner to corner. Then count the diagonals from ONE corner, and all of them.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const most = { gentle: 5, middle: 6, stretch: 8 }[tier(o)] || 5;
    const n = 4 + (i % (most - 3));
    return { n, pts: r.chance(0.5) ? regular(n) : uneven(r, n) };
  },
  render(item) {
    return side(art(polySvg(item.pts, { box: { w: 50, h: 46 }, letters: LETTERS, snap: item.pts, label: "A polygon" })),
      ask(slot("From one corner")) + ask(slot("Altogether")));
  },
  worked() {
    const p = regular(5);
    const lines = [[0, 2], [0, 3], [1, 3], [1, 4], [2, 4]].map(([a, b]) => ({ a: p[a], b: p[b], kind: "diag" }));
    return worked("One done for you", side(art(polySvg(p, { box: { w: 50, h: 46 }, letters: LETTERS, lines })),
      say("A pentagon. From A you can reach C and D: <b>2</b> diagonals — B and E are next to A, " +
        "and A itself does not count. Doing every corner that way counts each diagonal twice, so " +
        "5 × 2 ÷ 2 = <b>5</b> altogether.")));
  },
  key(item) {
    const n = item.n;
    return [
      want.draw({
        says: `all ${(n * (n - 3)) / 2} diagonals`,
        check: (lines) => {
          const got = new Set();
          lines.forEach(([a, b]) => {
            const gap = Math.abs(a - b);
            if (gap !== 1 && gap !== n - 1 && a !== b) got.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
          });
          return got.size === (n * (n - 3)) / 2;
        },
      }),
      want.num(n - 3), want.num((n * (n - 3)) / 2),
    ];
  },
  answer(item) {
    const n = item.n;
    return [`${n} corners: ${n - 3} from each corner, ${(n * (n - 3)) / 2} altogether`];
  },
};

const POLY_NAME = { 3: "triangle", 4: "quadrilateral", 5: "pentagon", 6: "hexagon", 7: "heptagon", 8: "octagon", 9: "nonagon", 10: "decagon", 12: "dodecagon" };

const prDTable = {
  id: "pr-d-table",
  group: "pr-diags",
  label: "The diagonals table",
  blurb: "n − 3 from each corner; n × (n − 3) ÷ 2 altogether.",
  heading: "Fill in the table",
  instruction: () =>
    "From one corner there is a diagonal to every corner except itself and its two neighbours: " +
    "n − 3. Those cut the shape into n − 2 triangles. Every corner has n − 3, and each diagonal " +
    "has two ends, so altogether there are n × (n − 3) ÷ 2.",
  cols: 1,
  defaultCount: 1,
  make(r, o) {
    const top = { gentle: 7, middle: 8, stretch: 10 }[tier(o)] || 7;
    return { rows: [...Array(top - 3)].map((_, j) => j + 4), rule: tier(o) === "stretch" };
  },
  render(item, o) {
    const filled = shown(o) ? 1 : 0;
    const row = (n, j) => {
      const c = (v) => (j < filled ? `<td>${v}</td>` : `<td class="wb-cell"></td>`);
      return `<tr><td>${POLY_NAME[n]}</td><td>${n}</td>${c(n - 3)}${c(n - 2)}${c((n * (n - 3)) / 2)}</tr>`;
    };
    const rule = item.rule ? `<tr class="gw-table__rule"><td>any polygon</td><td><b>n</b></td><td class="wb-cell"></td><td class="wb-cell"></td><td class="wb-cell"></td></tr>` : "";
    return `<table class="gw-table"><thead><tr><th>Shape</th><th>Corners</th><th>Diagonals from one corner</th><th>Triangles made</th><th>Diagonals altogether</th></tr></thead><tbody>${item.rows.map(row).join("")}${rule}</tbody></table>`;
  },
  key(item, o) {
    const filled = shown(o) ? 1 : 0;
    const out = [];
    item.rows.forEach((n, j) => { if (j >= filled) out.push(want.num(n - 3), want.num(n - 2), want.num((n * (n - 3)) / 2)); });
    if (item.rule) out.push(want.text("n-3", "n−3"), want.text("n-2", "n−2"), want.text("n(n-3)/2", "n(n-3)÷2", "nx(n-3)/2", "nx(n-3)÷2", "n(n−3)÷2", "(n²-3n)/2", "(n^2-3n)/2"));
    return out;
  },
  answer(item) {
    return item.rows.map((n) => `${POLY_NAME[n]}: ${n - 3}, ${n - 2}, ${(n * (n - 3)) / 2}`).concat(item.rule ? ["n − 3, n − 2, n(n − 3) ÷ 2"] : []);
  },
};

const DIAG_KINDS = ["square", "rectangle", "rhombus", "parallelogram", "kite", "isoTrap"];
const dealDiag = dealer();

/** Where the diagonals AC and BD cross, and the smaller angle between them. */
function crossing(p) {
  const [A, B, C, D] = p;
  const u = [C[0] - A[0], C[1] - A[1]];
  const v = [D[0] - B[0], D[1] - B[1]];
  const ang = (Math.acos(Math.abs(u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))) * 180) / Math.PI;
  return { AC: Math.hypot(...u), BD: Math.hypot(...v), ang };
}

const prDMeasure = {
  id: "pr-d-measure",
  group: "pr-diags",
  label: "Measure the diagonals",
  blurb: "True size: are the diagonals equal? Do they cross at a right angle?",
  heading: "Measure the diagonals and the angle between them",
  instruction: () =>
    "The shape is printed at real size with its diagonals drawn. Measure AC and BD with a " +
    "ruler, and the smaller angle where they cross with a protractor. Then tick.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const kind = dealDiag(r, DIAG_KINDS, i);
    return { kind, pts: kind === "rhombus" ? Q.rhombus(4.5, stepped(r, o, 55, 70)) : quadOf(kind, r, o) };
  },
  render(item) {
    const p = item.pts;
    const lines = [{ a: p[0], b: p[2], kind: "diag" }, { a: p[1], b: p[3], kind: "diag" }];
    return side(art(polySvg(p, { scale: 10, letters: LETTERS, lines, snap: p, label: "A four-sided shape at true size with its diagonals" })),
      ask(slot("AC", " cm") + slot("BD", " cm")) + ask(slot("Angle where they cross", "°")) +
      tick("equal", "not equal") + tick("cross at a right angle", "do not"));
  },
  key(item) {
    const c = crossing(item.pts);
    return [want.num(r1(c.AC), 0.2), want.num(r1(c.BD), 0.2), want.num(Math.round(c.ang), 2),
      want.tick(Math.abs(c.AC - c.BD) < 0.05 ? 0 : 1), want.tick(Math.abs(c.ang - 90) < 0.5 ? 0 : 1)];
  },
  answer(item) {
    const c = crossing(item.pts);
    return [`${KIND[item.kind].name}: AC ${cm(r1(c.AC))}, BD ${cm(r1(c.BD))}, ${Math.round(c.ang)}° — ${Math.abs(c.AC - c.BD) < 0.05 ? "equal" : "not equal"}, ${Math.abs(c.ang - 90) < 0.5 ? "at a right angle" : "not at a right angle"}`];
  },
};

const D_WORDS = {
  gentle: [[3, 4, 5], [6, 8, 10]],
  middle: [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]],
  stretch: [[5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 40, 41]],
};
const D_FORMS = ["rect", "rhombus", "square"];
const dealDForm = dealer();

const prDPyth = {
  id: "pr-d-pyth",
  group: "pr-diags",
  label: "Diagonals by Pythagoras",
  blurb: "A diagonal cuts a rectangle into two right-angled triangles.",
  heading: "Use Pythagoras with a diagonal",
  instruction: (o) =>
    "A rectangle's diagonal is the long side of a right-angled triangle whose short sides are " +
    "the rectangle's length and width. A rhombus's diagonals cross at right angles and cut " +
    "each other in half, making four right-angled triangles." +
    (tier(o) === "gentle" ? "" : " One decimal place where it is not whole."),
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const forms = tier(o) === "gentle" ? D_FORMS.slice(0, 2) : D_FORMS;
    const form = dealDForm(r, forms, i);
    const [a, b, c] = r.pick(D_WORDS[tier(o)] || D_WORDS.gentle);
    if (form === "square") return { form, s: r.int(2, 12) };
    return { form, a, b, c };
  },
  render(item) {
    if (item.form === "rect") {
      const pts = Q.rectangle(item.b, item.a);
      return side(art(polySvg(pts, { box: FIG, sides: [cm(item.b), cm(item.a), null, null], rights: [0, 1, 2, 3], lines: [{ a: pts[0], b: pts[2], kind: "diag", label: "d", side: "in" }] })),
        ask(slot("d", " cm")));
    }
    if (item.form === "rhombus") {
      const p = item.b; const q = item.a;
      const pts = Q.kite(p, q, q);
      const lines = [{ a: [-p, 0], b: [p, 0], kind: "diag" }, { a: [0, -q], b: [0, q], kind: "diag" }];
      return side(art(polySvg(pts, { box: FIG, ticks: [1, 1, 1, 1], lines, sides: ["x", null, null, null] })),
        ask(`The diagonals are ${2 * p} cm and ${2 * q} cm.`) + ask(slot("Side x", " cm")) + ask(slot("Perimeter", " cm")));
    }
    const pts = Q.square(3);
    return side(art(polySvg(pts, { box: FIG, ticks: [1, 1, 1, 1], rights: [0, 1, 2, 3], sides: [cm(item.s), null, null, null], lines: [{ a: pts[0], b: pts[2], kind: "diag", label: "d", side: "in" }] })),
      ask(slot("d", " cm")));
  },
  worked() {
    return worked("One done for you", say(
      "A rhombus with diagonals 8 cm and 6 cm. They cut each other in half at a right angle: " +
      "each small triangle has sides 4 and 3, so a side is √(16 + 9) = <b>5 cm</b>, and the " +
      "perimeter is 4 × 5 = <b>20 cm</b>."));
  },
  key(item) {
    if (item.form === "rect") return [want.num(item.c)];
    if (item.form === "rhombus") return [want.num(item.c), want.num(4 * item.c)];
    return [exactOr1(item.s * Math.SQRT2)];
  },
  answer(item) {
    if (item.form === "rect") return [`d = √(${item.b}² + ${item.a}²) = ${item.c} cm`];
    if (item.form === "rhombus") return [`x = √(${item.b}² + ${item.a}²) = ${item.c} cm; perimeter ${4 * item.c} cm`];
    return [`d = √(${item.s}² + ${item.s}²) ≈ ${fmt(r1(item.s * Math.SQRT2))} cm`];
  },
};

/* ═══ 5. lines of symmetry ═════════════════════════════════════════════════*/

const R3 = Math.sqrt(3);
const SYM = {
  square: Q.square(4),
  rectangle: Q.rectangle(6, 3.5),
  rhombus: Q.rhombus(4, 60),
  parallelogram: Q.parallelogram(5, 2, 3),
  kite: Q.kite(2.5, 2, 4.5),
  isoTrap: Q.isoTrap(6, 3, 3),
  rightTrap: Q.rightTrap(6, 3.5, 3),
  equilateral: [[0, 0], [4, 0], [2, 2 * R3]],
  isosceles: [[0, 0], [4, 0], [2, 5]],
  scalene: [[0, 0], [6, 0], [1.5, 3.5]],
  rightIso: [[0, 0], [4, 0], [0, 4]],
  pentagon: regular(5),
  hexagon: regular(6),
  octagon: regular(8),
  arrow: [[1, 0], [3, 0], [3, 3], [4, 3], [2, 5], [0, 3], [1, 3]],
  tee: [[1.5, 0], [2.5, 0], [2.5, 3], [4, 3], [4, 4], [0, 4], [0, 3], [1.5, 3]],
  plus: [[1, 0], [2, 0], [2, 1], [3, 1], [3, 2], [2, 2], [2, 3], [1, 3], [1, 2], [0, 2], [0, 1], [1, 1]],
  eitch: [[0, 0], [1, 0], [1, 1.5], [3, 1.5], [3, 0], [4, 0], [4, 4], [3, 4], [3, 2.5], [1, 2.5], [1, 4], [0, 4]],
  ell: [[0, 0], [4, 0], [4, 1], [1, 1], [1, 3], [0, 3]],
  step: [[0, 0], [3, 0], [3, 1], [4, 1], [4, 3], [1, 3], [1, 2], [0, 2]],
  house: [[0, 0], [4, 0], [4, 3], [2, 5], [0, 3]],
  chevron: [[0, 0], [2, 1.5], [4, 0], [4, 2], [2, 3.5], [0, 2]],
};
const SYM_BANK = {
  gentle: ["square", "rectangle", "isosceles", "equilateral", "kite", "arrow", "tee", "house", "scalene", "rightIso"],
  middle: ["rectangle", "rhombus", "parallelogram", "kite", "isoTrap", "rightTrap", "pentagon", "hexagon", "ell", "plus", "chevron", "equilateral"],
  stretch: ["square", "rhombus", "parallelogram", "isoTrap", "octagon", "hexagon", "eitch", "step", "plus", "chevron", "pentagon", "rightTrap"],
};

/** A line as (direction mod 180°, distance from the origin), to compare two lines. */
function lineKey(p, q) {
  let t = Math.atan2(q[1] - p[1], q[0] - p[0]);
  if (t < 0) t += Math.PI;
  if (t >= Math.PI - 1e-6) t -= Math.PI;
  const c = -Math.sin(t) * p[0] + Math.cos(t) * p[1];
  return [t, c];
}
const sameLine = (a, b) => {
  const dt = Math.abs(a[0] - b[0]);
  if (dt < 1e-3) return Math.abs(a[1] - b[1]) < 1e-3;
  if (Math.abs(dt - Math.PI) < 1e-3) return Math.abs(a[1] + b[1]) < 1e-3;
  return false;
};

/** Every line of symmetry of a polygon, found by folding along every line
    through two of its corners, side-middles and centre. */
export function axesOf(poly) {
  const snaps = symSnaps(poly);
  const found = [];
  for (let i = 0; i < snaps.length; i++) {
    for (let j = i + 1; j < snaps.length; j++) {
      const p = snaps[i]; const q = snaps[j];
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6) continue;
      const k = lineKey(p, q);
      if (found.some((f) => sameLine(f.k, k))) continue;
      if (foldFits(poly, p, q)) found.push({ k, p, q });
    }
  }
  return found;
}

/** A shape from the bank, turned about as much as the level allows. */
function symShape(r, o, name) {
  const t = tier(o);
  const deg = t === "gentle" ? r.pick([0, 0, 90]) : t === "middle" ? r.pick([0, 90, 180, 45]) : r.pick([0, 30, 45, 60, 90, 135]);
  return turn(SYM[name], deg, r.chance(0.3));
}

const dealSym = dealer();

/* The dashed line to test: a true line of symmetry about half the time; the
   other half a line that LOOKS as if it might be — a diagonal, or through the
   middle at the wrong angle. */
function testLine(r, pts, axes, yes) {
  if (yes && axes.length) { const a = r.pick(axes); return [a.p, a.q]; }
  const snaps = symSnaps(pts);
  const c = snaps[snaps.length - 1];
  const tries = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 2; j < pts.length; j++) tries.push([pts[i], pts[j]]);
    tries.push([pts[i], c]);
  }
  for (let i = pts.length; i < snaps.length - 1; i++) tries.push([snaps[i], c]);
  /* a decoy must go THROUGH the shape — a line along an edge of an L or an
     arrow leaves nothing to fold — and cut off a real piece either side */
  const whole = areaOf(pts);
  const cuts = ([p, q]) => Math.min(areaOf(clipHalf(pts, p, q, 1)), areaOf(clipHalf(pts, p, q, -1))) > whole * 0.2;
  const wrong = r.shuffle(tries).find(([p, q]) => Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6 && cuts([p, q]) && !axes.some((a) => sameLine(a.k, lineKey(p, q))));
  return wrong || [pts[0], c];
}

/** A line as far as it goes across the shape's box, so the whole fold shows. */
function across([p, q], pts) {
  const c = centreOf(pts);
  const R = Math.max(...pts.map((v) => Math.hypot(v[0] - c[0], v[1] - c[1]))) * 1.18;
  const d = [q[0] - p[0], q[1] - p[1]];
  const L = Math.hypot(...d) || 1;
  const u = [d[0] / L, d[1] / L];
  const t0 = (c[0] - p[0]) * u[0] + (c[1] - p[1]) * u[1];
  const m = [p[0] + u[0] * t0, p[1] + u[1] * t0];
  return { a: [m[0] - u[0] * R, m[1] - u[1] * R], b: [m[0] + u[0] * R, m[1] + u[1] * R] };
}

let foldFlip = 0;
const prFoldTest = {
  id: "pr-fold-test",
  group: "pr-sym",
  label: "Fold it: do the halves match?",
  blurb: "Fold along the dashed line. On screen, tap the line and the shape folds.",
  heading: "Fold along the dashed line",
  instruction: () =>
    "Trace the shape, cut it out and fold it along the dashed line — on screen, just tap the " +
    "line. If the two halves lie exactly on top of each other, the line is a line of symmetry.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    if (i === 0) foldFlip = r.chance(0.5) ? 1 : 0;
    const bank = SYM_BANK[tier(o)] || SYM_BANK.gentle;
    let name = dealSym(r, bank, i);
    let pts = symShape(r, o, name);
    let axes = axesOf(pts);
    let yes = (i + foldFlip) % 2 === 0;
    if (yes && !axes.length) {
      name = r.pick(bank.filter((n) => axesOf(SYM[n]).length));
      pts = symShape(r, o, name);
      axes = axesOf(pts);
    }
    const ln = testLine(r, pts, axes, yes);
    yes = foldFits(pts, ln[0], ln[1]);
    return { pts, line: ln, yes };
  },
  render(item) {
    const L = across(item.line, item.pts);
    const fig = polySvg(item.pts, { box: { w: 50, h: 44 }, fold: true, lines: [{ ...L, kind: "fold" }], label: "A shape with a dashed line to fold along" });
    return side(art(fig), tick("the halves match", "they do not match"));
  },
  worked() {
    const pts = SYM.parallelogram;
    const L = across([pts[0], pts[2]], pts);
    return worked("One to watch for", side(art(polySvg(pts, { box: { w: 50, h: 44 }, fold: true, lines: [{ ...L, kind: "fold" }] })),
      say("A parallelogram folded along a diagonal: the two halves are the same size, but the " +
        "corners land in the wrong places and stick out. <b>Not</b> a line of symmetry — a " +
        "parallelogram has none.")));
  },
  key(item) {
    return [want.tick(item.yes ? 0 : 1)];
  },
  answer(item) {
    return [item.yes ? "they match — a line of symmetry" : "they do not match — not a line of symmetry"];
  },
};

const dealSymDraw = dealer();

const prSymDraw = {
  id: "pr-sym-draw",
  group: "pr-sym",
  label: "Draw every line of symmetry",
  blurb: "Rule each fold line — corner, middle of a side, or the centre. Each one folds on screen.",
  heading: "Draw all the lines of symmetry",
  instruction: () =>
    "Rule every line the shape would fold along with its halves matching. Every one goes " +
    "through two of: a corner, the middle of a side, the centre. On screen each line you rule " +
    "is folded straight away, so you can see if it fits. Then say how many there are.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const name = dealSymDraw(r, SYM_BANK[tier(o)] || SYM_BANK.gentle, i);
    const pts = symShape(r, o, name);
    return { pts, axes: axesOf(pts).length };
  },
  render(item) {
    return side(art(polySvg(item.pts, { box: { w: 50, h: 44 }, fold: true, snap: symSnaps(item.pts), label: "A shape to find the lines of symmetry of" })),
      ask(slot("Lines of symmetry")));
  },
  worked() {
    const pts = SYM.rectangle;
    const ax = axesOf(pts).map((a) => ({ ...across([a.p, a.q], pts), kind: "fold" }));
    return worked("One done for you", side(art(polySvg(pts, { box: { w: 50, h: 44 }, lines: ax })),
      say("A rectangle folds across its middle both ways: <b>2</b> lines of symmetry. Not along " +
        "a diagonal — try it with a sheet of paper: the corners stick out.")));
  },
  key(item) {
    const snaps = symSnaps(item.pts);
    const axes = axesOf(item.pts);
    return [
      want.draw({
        says: `${axes.length} line${axes.length === 1 ? "" : "s"} of symmetry`,
        check: (lines) => {
          const drawn = [];
          for (const [a, b] of lines) {
            const p = snaps[a]; const q = snaps[b];
            if (!p || !q) return false;
            const k = lineKey(p, q);
            if (!axes.some((ax) => sameLine(ax.k, k))) return false;
            if (!drawn.some((d) => sameLine(d, k))) drawn.push(k);
          }
          return drawn.length === axes.length;
        },
      }),
      want.num(axes.length),
    ];
  },
  answer(item) {
    return [`${item.axes} line${item.axes === 1 ? "" : "s"} of symmetry`];
  },
};

/* Half a shape against a mirror line on squares: the child draws the other half. */
const HALVES = {
  gentle: [
    [[0, 0], [-2, 0], [-2, 3], [0, 3]],
    [[0, 0], [-3, 0], [-3, 2], [-1, 2], [-1, 4], [0, 4]],
    [[0, 0], [-2, 0], [-2, 2], [0, 4]],
    [[0, 1], [-3, 1], [-3, 3], [-1, 3], [-1, 4], [0, 4]],
  ],
  middle: [
    [[0, 0], [-2, 0], [-3, 2], [-1, 4], [0, 4]],
    [[0, 0], [-3, 1], [-3, 3], [0, 4]],
    [[0, 0], [-1, 0], [-1, 2], [-3, 2], [0, 5]],
    [[0, 0], [-2, 2], [-2, 3], [-4, 3], [0, 5]],
  ],
  stretch: [
    [[0, 0], [-1, 1], [-3, 0], [-2, 2], [-4, 4], [0, 3]],
    [[0, 0], [-3, 0], [-1, 2], [-3, 4], [0, 5]],
    [[0, 1], [-2, 0], [-4, 2], [-2, 3], [-2, 5], [0, 4]],
  ],
};

const prSymComplete = {
  id: "pr-sym-complete",
  group: "pr-sym",
  label: "Finish the symmetric shape",
  blurb: "Half a shape and its mirror line. Each corner is as far the other side as it is this side.",
  heading: "Draw the other half",
  instruction: () =>
    "The dashed line is a line of symmetry. For every corner, count how far it is from the " +
    "line, and put its partner just as far on the other side. Then join them up, dot to dot.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const half = r.pick(HALVES[tier(o)] || HALVES.gentle);
    /* the mirror upright, or (from Middle) lying down */
    const lying = tier(o) !== "gentle" && r.chance(0.5);
    const flip = r.chance(0.5);
    return { half, lying, flip };
  },
  render(item) {
    const g = geom(item);
    const fig = polySvg([], {
      grid: true, outline: false, gridBox: g.box, solid: g.given,
      lines: [{ ...g.mirror, kind: "fold" }], snap: g.snaps, label: "Half a shape on squares, and its line of symmetry",
    });
    return art(fig);
  },
  worked() {
    return worked("How it works", say(
      "A corner 3 squares left of the line has its partner 3 squares right of it, on the same " +
      "row. A corner ON the line is its own partner. Slant sides come out slanting the other way."));
  },
  key(item) {
    const g = geom(item);
    const target = g.missing;
    const on = (pt, [a, b]) => {
      const d = [b[0] - a[0], b[1] - a[1]];
      const L2 = d[0] * d[0] + d[1] * d[1];
      const t = ((pt[0] - a[0]) * d[0] + (pt[1] - a[1]) * d[1]) / L2;
      if (t < -1e-6 || t > 1 + 1e-6) return false;
      return Math.hypot(a[0] + d[0] * t - pt[0], a[1] + d[1] * t - pt[1]) < 1e-6;
    };
    const samples = (s) => [...Array(9)].map((_, k) => [s[0][0] + ((s[1][0] - s[0][0]) * k) / 8, s[0][1] + ((s[1][1] - s[0][1]) * k) / 8]);
    return [want.draw({
      says: "the other half, each corner mirrored across the line",
      check: (lines) => {
        const drawn = lines.map(([a, b]) => [g.snaps[a], g.snaps[b]]).filter(([a, b]) => a && b);
        /* everything drawn lies on the missing half, and the missing half is all drawn */
        const covered = (s, set) => samples(s).every((pt) => set.some((t) => on(pt, t)));
        return drawn.length > 0 && drawn.every((s) => covered(s, target)) && target.every((s) => covered(s, drawn));
      },
    })];
  },
  answer() {
    return ["the mirror image of the half, across the dashed line"];
  },
};

/** Where everything is for a half-shape question, in grid units. */
function geom(item) {
  let half = item.half.map(([x, y]) => [x, y]);
  if (item.flip) half = half.map(([x, y]) => [-x, y]);
  const other = half.map(([x, y]) => [-x, y]);
  const xs = [...half, ...other].map((p) => p[0]);
  const ys = [...half, ...other].map((p) => p[1]);
  let mirror = { a: [0, Math.min(...ys) - 1], b: [0, Math.max(...ys) + 1] };
  let T = (p) => p;
  if (item.lying) T = ([x, y]) => [y, -x];
  const segsOf = (pts) => pts.slice(1).map((p, j) => [T(pts[j]), T(p)]);
  const given = segsOf(half);
  const missing = segsOf(other);
  mirror = { a: T(mirror.a), b: T(mirror.b) };
  const all = [...given.flat(), ...missing.flat(), mirror.a, mirror.b];
  const box = [Math.min(...all.map((p) => p[0])) - 1, Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[0])) + 1, Math.max(...all.map((p) => p[1]))];
  void xs;
  return { given, missing, mirror, box, snaps: gridSnaps(box[0], box[1], box[2], box[3]) };
}

const COUNTS = [
  ["a square", 4], ["a rectangle", 2], ["a rhombus", 2], ["a parallelogram", 0], ["a kite", 1],
  ["an equilateral triangle", 3], ["an isosceles triangle", 1], ["a scalene triangle", 0],
  ["a regular pentagon", 5], ["a regular hexagon", 6], ["a regular octagon", 8],
  ["a trapezium with its two slant sides equal", 1], ["a circle", "many"],
];
const dealCount = dealer();

const prSymCount = {
  id: "pr-sym-count",
  group: "pr-sym",
  label: "How many lines of symmetry?",
  blurb: "No picture: picture it, fold it in your head.",
  heading: "How many lines of symmetry?",
  instruction: () =>
    "Picture the shape, or sketch it, and fold it in your head. A regular shape has as many " +
    "lines of symmetry as it has sides. A circle has too many to count: write 'many'.",
  cols: 2,
  defaultCount: 8,
  make(r, o, k, i) {
    const list = tier(o) === "gentle" ? COUNTS.filter(([, n]) => n !== "many" && n <= 4) : COUNTS;
    const [name, n] = dealCount(r, list, i);
    return { name, n };
  },
  render(item) {
    return ask(`${item.name[0].toUpperCase()}${item.name.slice(1)}: ${box()}`);
  },
  key(item) {
    return [item.n === "many" ? want.text("many", "infinite", "infinitely many", "lots", "countless") : want.num(item.n)];
  },
  answer(item) {
    return [`${item.name}: ${item.n}`];
  },
};

/* ═══ 6. all the properties together ═══════════════════════════════════════*/

const CARD_KINDS = ["square", "rectangle", "rhombus", "parallelogram", "kite", "isoTrap"];
const dealCard = dealer();
const CARD_ROWS = [
  ["All four sides equal", (K) => K.sides === 0],
  ["Two pairs of parallel sides", (K) => K.par === 2],
  ["Four right angles", (K) => K.right === 4],
  ["Diagonals equal", (K) => !!K.dEq],
  ["Diagonals cross at right angles", (K) => !!K.dPerp],
  ["Diagonals cut each other in half", (K) => !!K.dBis],
];

const prCard = {
  id: "pr-card",
  group: "pr-all",
  label: "The property card",
  blurb: "One shape, every property: sides, angles, diagonals, symmetry.",
  heading: "Fill in the shape's property card",
  instruction: () =>
    "Tick yes or no for each property, and write the number of lines of symmetry. Sketch the " +
    "shape with its diagonals first if it helps.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    return { kind: dealCard(r, CARD_KINDS, i) };
  },
  render(item) {
    const name = item.kind === "isoTrap" ? "trapezium with its slant sides equal" : KIND[item.kind].name;
    return lead(`<b>A ${name}</b>`) +
      CARD_ROWS.map(([label]) => `<div class="gw-card-row"><span>${label}</span>${tick(...YESNO)}</div>`).join("") +
      ask(slot("Lines of symmetry"));
  },
  key(item) {
    const K = KIND[item.kind];
    return [...CARD_ROWS.map(([, has]) => want.tick(has(K) ? 0 : 1)), want.num(K.sym)];
  },
  answer(item) {
    const K = KIND[item.kind];
    return [CARD_ROWS.map(([label, has]) => `${label}: ${has(K) ? "yes" : "no"}`).join("; ") + `; ${K.sym} lines of symmetry`];
  },
};

export const PR_EXERCISES = [
  prSidesGrid, prSlant, prSidesMeasure, prSidesMarks, prRiddle,
  prAngMeasure, prAngKinds, prAngProps, prAngWords,
  prHGrid, prHWhich, prHMeasure, prHPyth, prHWords,
  prDDraw, prDMeasure, prDTable, prDPyth,
  prFoldTest, prSymDraw, prSymComplete, prSymCount,
  prCard,
];

/* for the checks */
export { reflect as _reflect, SYM as _SYM, geom as _geom };
