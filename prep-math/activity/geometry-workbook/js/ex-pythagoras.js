/* ============================================================================
   Geometry Workbook — CHAPTER 4: Pythagoras' rule
   ----------------------------------------------------------------------------
   Seven sections, in the order they were asked for:

     right-angled triangles · the sides of a right-angled triangle · forming
     squares from the sides · sum of sides · difference of sides · the
     Pythagorean formula · Pythagorean triples

   The rule is met as a picture before it is a formula. First the corner — is
   there a right angle, and where. Then the side opposite it, the longest,
   the hypotenuse. Then a square drawn on every side, ruled into little
   squares a child can count: 9 and 16 on the short sides, 25 on the long
   one. Only then the two directions the picture works in — the two small
   squares ADDED make the big one (the long side), the big one TAKE AWAY a
   small one leaves the other (a short side) — each as the same four-box flow
   chapter one used: square, square, add or take away, square root. The
   formula comes after, written for the triangle in front of you, then used;
   and the triples last, as the whole numbers that fit it exactly.

   Numbers by level. Gentle and Middle stay on whole-number triangles, the
   triples, so every square root comes out; Stretch mixes in triangles whose
   third side is a decimal, to one place. Pictures are drawn to scale unless
   they say otherwise, and the measuring one prints at true size.
   ========================================================================== */

import { rightTriSvg, gridTriSvg, fitGrid, squaresRuled } from "./pythag.js";
import { levelOf, helpOf, stepped, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const small = () => `<span class="wb-answer gw-num"></span>`;
const num = (label) => `<span class="wb-slot"><em>${label}</em>${small()}</span>`;
const slot = (label, unit = "") => `<span class="wb-slot"><em>${label}</em>${box()}${unit}</span>`;
const art = (svg) => `<div class="gw-art">${svg}</div>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const side = (figure, words) => `<div class="gw-side">${figure}<div class="gw-lines">${words}</div></div>`;
const worked = (tag, body) => `<div class="wb-worked"><p class="wb-worked__tag">${tag}</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const line = () => `<span class="wb-line wb-line--md"></span>`;
const workbox = (lines = 3) =>
  `<span class="wb-workbox" style="--wb-lines:${lines}">` +
  [...Array(lines - 1)].map((_, k) => `<span class="wb-workbox__rule" style="top:${(((k + 1) * 100) / lines).toFixed(1)}%"></span>`).join("") +
  `</span>`;

const FIG = { w: 64, h: 50 };
const SQ = { w: 80, h: 76 };
const tier = (o) => levelOf(o).id;
const named = (o) => helpOf(o).id !== "try";
const sq = (v) => Math.round(v * v * 100) / 100;
const r1 = (v) => Math.round(v * 10) / 10;
const fmt = (v) => (Number.isInteger(v) ? String(v) : String(r1(v)));
const tolOf = (v) => (Number.isInteger(v) ? 0 : 0.05);

/* ── the numbers ───────────────────────────────────────────────────────────*/

/** Whole-number right-angled triangles, short sides first. */
const TRIPLES = {
  gentle: [[3, 4, 5], [6, 8, 10], [5, 12, 13]],
  middle: [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]],
  stretch: [[5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37], [15, 20, 25], [10, 24, 26]],
};
const triplesOf = (o) => TRIPLES[tier(o)] || TRIPLES.gentle;

/** A triple, the two short sides either way round. */
function tripleOf(r, o) {
  const [a, b, c] = r.pick(triplesOf(o));
  return r.chance(0.5) ? [a, b, c] : [b, a, c];
}

/* At Stretch, every other "find the side" question has a third side that is
   not a whole number: two whole sides, and the answer to one decimal place. */
const decimalTurn = (o, i) => tier(o) === "stretch" && i % 2 === 1;

/** Two short sides and the long one, for finding the long side. */
function forLong(r, o, i) {
  if (decimalTurn(o, i)) {
    for (let g = 0; g < 50; g++) {
      const a = r.int(2, 12);
      const b = r.int(2, 12);
      const c = Math.hypot(a, b);
      if (!Number.isInteger(c)) return [a, b, r1(c)];
    }
  }
  return tripleOf(r, o);
}

/** The long side and one short side, for finding the other short side. */
function forShort(r, o, i) {
  if (decimalTurn(o, i)) {
    for (let g = 0; g < 50; g++) {
      const c = r.int(6, 15);
      const b = r.int(2, c - 2);
      const a = Math.sqrt(c * c - b * b);
      if (!Number.isInteger(a)) return [r1(a), b, c];
    }
  }
  return tripleOf(r, o);
}

/** A triangle drawn with sides this long, kept drawable: a very thin one is
    drawn fatter, and says so. */
function drawn(a, b) {
  const k = Math.max(a, b) / Math.min(a, b);
  if (k <= 3.2) return { da: a, db: b, note: "" };
  return a > b ? { da: a, db: a / 3.2, note: "not drawn accurately" } : { da: b / 3.2, db: b, note: "not drawn accurately" };
}

/** How a triangle sits on the paper: Gentle the right way up, Middle any
    quarter turn, Stretch any turn at all. */
function pose(r, o) {
  const t = tier(o);
  const turn = t === "gentle" ? 0 : t === "middle" ? r.pick([0, 90, 180, 270]) : r.int(0, 23) * 15;
  return { turn, flip: r.chance(0.5) };
}

const LETTER_SETS = [["a", "b", "c"], ["p", "q", "r"], ["d", "e", "f"], ["k", "m", "n"], ["s", "t", "u"], ["g", "h", "j"]];

/** A set of letters for the three sides, shuffled onto them. */
function letterSides(r) {
  const set = r.pick(LETTER_SETS);
  const on = r.shuffle(set.slice());
  return { set, names: { a: on[0], b: on[1], c: on[2] } };
}

/** The four-box flow from chapter one, for squaring, adding (or taking
    away) and square-rooting. Named at Show me and Help me; bare at Let me try. */
function flow(steps, o) {
  const show = named(o);
  const step = ([label, content]) =>
    `<span class="gw-flow__step">${show ? `<em>${label}</em>` : ""}<span class="gw-flow__val">${content}</span></span>`;
  return `<div class="gw-flow">${steps.map(step).join(`<span class="gw-flow__arrow">→</span>`)}</div>`;
}

/* ── the groups: one per section, the first carrying the chapter ───────────*/

export const PY_GROUPS = [
  { id: "py-right", chapter: "Chapter 4 · Pythagoras' rule", label: "Right-angled triangles" },
  { id: "py-sides", label: "Sides of a right-angled triangle" },
  { id: "py-squares", label: "Forming squares from the sides" },
  { id: "py-sum", label: "Sum of sides" },
  { id: "py-diff", label: "Difference of sides" },
  { id: "py-formula", label: "The Pythagorean formula" },
  { id: "py-triples", label: "Pythagorean triples" },
];

/* ═══ 1. right-angled triangles ════════════════════════════════════════════*/

let spotFlip = 0;
const pySpot = {
  id: "py-spot",
  group: "py-right",
  label: "Right-angled or not?",
  blurb: "Two angles given. The third is what is left of 180° — is it 90°?",
  heading: "Is the triangle right-angled?",
  instruction: () =>
    "A right-angled triangle has one corner that is exactly 90°. Find the third angle — " +
    "the three add up to 180° — and tick.",
  cols: 2,
  defaultCount: 6,
  /* Half are right-angled and half are not, alternating; the ones that are
     not miss by a step or two, never by a mile. */
  make(r, o, k, i) {
    if (i === 0) spotFlip = r.chance(0.5) ? 1 : 0;
    const yes = (i + spotFlip) % 2 === 0;
    const A = stepped(r, o, 20, 70);
    const miss = yes ? 0 : r.pick([-2, -1, 1, 2]) * Math.max(levelOf(o).step, 5);
    return { A, B: 90 - A + miss, yes };
  },
  render(item) {
    return ask(`Two angles of a triangle are <b>${item.A}°</b> and <b>${item.B}°</b>.`) +
      ask(slot("The third angle", "°")) + tick("right-angled", "not right-angled");
  },
  worked() {
    return worked("One done for you", say(
      "35° and 55° make 90° together, so the third angle is 180 − 90 = <b>90°</b>. " +
      "It has a right angle: it is right-angled."));
  },
  key(item) {
    return [want.num(180 - item.A - item.B), want.tick(item.yes ? 0 : 1)];
  },
  answer(item) {
    const c = 180 - item.A - item.B;
    return [`${c}° — ${item.yes ? "right-angled" : "not right-angled"}`];
  },
};

/** A right-angled triangle on the dot grid: its short sides along the grid
    at Gentle, tilted at Stretch (a right angle between (p, q) and (−q, p)). */
function gridRight(r, o, { room }) {
  const t = tier(o);
  const tilted = t === "stretch" || (t === "middle" && r.chance(0.5));
  let u;
  let v;
  if (!tilted) {
    const most = room ? (t === "gentle" ? 4 : 5) : 6;
    u = [r.int(2, most), 0];
    v = [0, r.int(2, most)];
  } else {
    /* both short sides at least two dots long, or the triangle is a speck */
    const p = r.int(1, 2);
    const q = r.int(1, room ? 2 : 3);
    const m = Math.hypot(p, q) < 2 ? 2 : 1;
    const k = room ? r.pick([1, 2]) : r.int(1, 2);
    u = [p * m, q * m];
    v = [-q * Math.max(k, m), p * Math.max(k, m)];
  }
  const turns = r.int(0, 3);
  for (let j = 0; j < turns; j++) { u = [-u[1], u[0]]; v = [-v[1], v[0]]; }
  if (r.chance(0.5)) { u = [-u[0], u[1]]; v = [-v[0], v[1]]; }
  return fitGrid([[0, 0], u, v], { room });
}

const pyCorner = {
  id: "py-corner",
  group: "py-right",
  label: "Where is the right angle?",
  blurb: "Find the square corner — with the corner of a page, or by the dots.",
  heading: "Which corner is the right angle?",
  instruction: () =>
    "A right angle is a square corner, like the corner of this page. Hold a corner of the " +
    "page against each corner of the triangle, or count the dots, and tick the one that is 90°.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const g = gridRight(r, o, { room: false });
    return { ...g, letters: r.shuffle(["A", "B", "C"]) };
  },
  render(item) {
    return side(art(gridTriSvg({ tri: item.tri, cols: item.cols, rows: item.rows, letters: item.letters })),
      ask("The right angle is at") + tick("A", "B", "C"));
  },
  key(item) {
    return [want.tick("ABC".indexOf(item.letters[0]))];
  },
  answer(item) {
    return [`corner ${item.letters[0]}`];
  },
};

/* ═══ 2. the sides of a right-angled triangle ══════════════════════════════*/

const pyHyp = {
  id: "py-hyp",
  group: "py-sides",
  label: "Which side is the hypotenuse?",
  blurb: "The side across from the right angle — and always the longest.",
  heading: "Find the hypotenuse",
  instruction: () =>
    "The hypotenuse is the side opposite the right angle: the one that does not touch the " +
    "little square. It is always the longest side. Tick its letter.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [a, b] = tripleOf(r, o);
    return { a, b, ...pose(r, o), ...letterSides(r) };
  },
  render(item) {
    const { da, db } = drawn(item.a, item.b);
    return side(art(rightTriSvg({ a: da, b: db, turn: item.turn, flip: item.flip, sides: item.names, box: FIG })),
      ask("The hypotenuse is") + tick(...item.set));
  },
  worked() {
    return worked("One done for you", side(
      art(rightTriSvg({ a: 4, b: 3, sides: { a: "p", b: "q", c: "r" }, box: FIG })),
      say("The little square is the right angle. Side <b>r</b> is the only one that does not " +
        "touch it — so r is the hypotenuse. It is the longest, too.")));
  },
  key(item) {
    return [want.tick(item.set.indexOf(item.names.c))];
  },
  answer(item) {
    return [`${item.names.c} — opposite the right angle`];
  },
};

/* true size, in centimetres: the long short side along the bottom */
const TRUE_SIZE = { gentle: [[4, 3]], middle: [[4, 3], [8, 6]], stretch: [[8, 6], [6, 4.5], [4.8, 3.6]] };

const pyMeasure = {
  id: "py-measure",
  group: "py-sides",
  label: "Measure the sides",
  blurb: "Printed at true size — a ruler finds the longest side, opposite the right angle.",
  heading: "Measure each side",
  instruction: () =>
    "The triangle is printed at its real size. Measure each side with a ruler, in centimetres. " +
    "Then tick the longest side — look where it is.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const [a, b] = r.pick(TRUE_SIZE[tier(o)] || TRUE_SIZE.gentle);
    const on = r.shuffle(["p", "q", "r"]);
    return { a, b, c: Math.hypot(a, b), turn: r.pick([0, 180]), flip: r.chance(0.5), names: { a: on[0], b: on[1], c: on[2] } };
  },
  render(item) {
    const fig = rightTriSvg({ a: item.a, b: item.b, scale: 10, turn: item.turn, flip: item.flip, sides: item.names });
    return side(art(fig),
      ask(["p", "q", "r"].map((l) => slot(l, " cm")).join("")) + ask("The longest side is") + tick("p", "q", "r"));
  },
  key(item) {
    const len = (l) => Object.keys(item.names).find((k) => item.names[k] === l);
    const size = { a: item.a, b: item.b, c: item.c };
    return [...["p", "q", "r"].map((l) => want.num(r1(size[len(l)]), 0.2)), want.tick(["p", "q", "r"].indexOf(item.names.c))];
  },
  answer(item) {
    const size = { a: item.a, b: item.b, c: item.c };
    const parts = Object.keys(item.names).map((k) => [item.names[k], size[k]]).sort((x, y) => x[0].localeCompare(y[0]));
    return [`${parts.map(([l, v]) => `${l} = ${fmt(v)} cm`).join(", ")} — the longest is ${item.names.c}, opposite the right angle`];
  },
};

/* ═══ 3. forming squares from the sides ════════════════════════════════════*/

const pyDrawSquares = {
  id: "py-draw-squares",
  group: "py-squares",
  label: "Draw a square on each side",
  blurb: "Dot to dot with a ruler — even the square on the sloping side has its corners on dots.",
  heading: "Draw a square on every side",
  instruction: () =>
    "Draw a square on each side of the triangle, on the outside. For the sloping side, count " +
    "its steps across and up; the next side of the square turns the corner and takes the " +
    "same steps the other way.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return gridRight(r, o, { room: true });
  },
  render(item) {
    return art(gridTriSvg({ tri: item.tri, cols: item.cols, rows: item.rows }));
  },
  worked() {
    const g = fitGrid([[0, 0], [3, 0], [0, -2]], { room: true });
    return worked("One done for you", side(
      art(gridTriSvg({ ...g, squares: true, corner: true })),
      say("The short sides are 3 and 2 dots long, so their squares are 3 by 3 and 2 by 2. The " +
        "sloping side goes 3 across and 2 up; turn the corner and go 2 across and 3 up — keep " +
        "going round and the square closes.")));
  },
  key(item) {
    return [want.draw({
      says: "a square on each of the three sides, on the outside",
      check: (lines, fig) => squaresRuled(item.tri, lines, fig),
    })];
  },
  answer() {
    return ["a square on each side, outside the triangle"];
  },
};

const pyCount = {
  id: "py-count",
  group: "py-squares",
  label: "Count the little squares",
  blurb: "9 on one short side, 16 on the other, 25 on the long one. Notice anything?",
  heading: "How many little squares in each square?",
  instruction: () =>
    "Count the little squares in the square on each side. Then add the two smaller squares " +
    "together, and compare with the big one.",
  cols: 2,
  defaultCount: 2,
  make(r, o) {
    const [a, b] = r.chance(0.5) ? [3, 4] : [4, 3];
    return { a, b, ...pose(r, o) };
  },
  render(item) {
    return side(
      art(rightTriSvg({ a: item.a, b: item.b, turn: item.turn, flip: item.flip, squares: "grid", sides: { a: "a", b: "b", c: "c" }, box: SQ })),
      ask(num("On a") + num("On b") + num("On c")) + ask(`${box()} + ${box()} = ${box()}`));
  },
  worked() {
    return worked("What you will find", say(
      "The square on a 3-long side is 3 × 3 = 9 little squares; on a 4-long side, 16. The " +
      "square on the long side has 25 — and 9 + 16 = 25. The two small squares, together, " +
      "exactly make the big one."));
  },
  key(item) {
    const A = item.a * item.a;
    const B = item.b * item.b;
    return [want.num(A), want.num(B), want.num(25), want.set(A, B), want.num(25)];
  },
  answer(item) {
    return [`a: ${item.a * item.a}, b: ${item.b * item.b}, c: 25 — ${item.a * item.a} + ${item.b * item.b} = 25`];
  },
};

const pyArea = {
  id: "py-area",
  group: "py-squares",
  label: "The area of each square",
  blurb: "A square on a 6 cm side is 6 × 6 = 36 cm². Three of them.",
  heading: "The area of the square on each side",
  instruction: () =>
    "The area of a square is its side times itself. Work out the area of the square on each " +
    "side of the triangle.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [a, b, c] = tripleOf(r, o);
    return { a, b, c, ...pose(r, o) };
  },
  render(item) {
    const { da, db, note } = drawn(item.a, item.b);
    const sides = { a: `${item.a} cm`, b: `${item.b} cm`, c: `${item.c} cm` };
    return side(
      art(rightTriSvg({ a: da, b: db, turn: item.turn, flip: item.flip, squares: "plain", sides, box: SQ, note })),
      [item.a, item.b, item.c].map((v) => ask(slot(`on ${v} cm`, " cm²"))).join(""));
  },
  worked() {
    return worked("One done for you", say(
      "On the 6 cm side: 6 × 6 = <b>36 cm²</b>. On the 8 cm side: 8 × 8 = <b>64 cm²</b>. " +
      "On the 10 cm side: 10 × 10 = <b>100 cm²</b>."));
  },
  key(item) {
    return [want.num(item.a * item.a), want.num(item.b * item.b), want.num(item.c * item.c)];
  },
  answer(item) {
    return [`${item.a * item.a}, ${item.b * item.b} and ${item.c * item.c} cm²`];
  },
};

/* ═══ 4. sum of sides: the two small squares make the big one ══════════════*/

const pySumArea = {
  id: "py-sum-area",
  group: "py-sum",
  label: "The big square from the two small ones",
  blurb: "Add the two small squares: that is the big square. Its side is the long side.",
  heading: "Find the big square, then the long side",
  instruction: () =>
    "The two squares on the short sides add up to the square on the long side. Add them to " +
    "find the big square. Then find the long side: the number that times itself makes it.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [a, b, c] = tripleOf(r, o);
    return { a, b, c, ...pose(r, o) };
  },
  render(item) {
    const { da, db, note } = drawn(item.a, item.b);
    const areas = { a: `${item.a * item.a} cm²`, b: `${item.b * item.b} cm²`, c: "?" };
    return side(
      art(rightTriSvg({ a: da, b: db, turn: item.turn, flip: item.flip, squares: "plain", areas, box: SQ, note })),
      ask(slot("big square", " cm²")) + ask(slot("long side", " cm")));
  },
  worked() {
    return worked("One done for you", say(
      "36 + 64 = <b>100 cm²</b> — that is the big square. Which number times itself is 100? " +
      "10 × 10 = 100, so the long side is <b>10 cm</b>."));
  },
  key(item) {
    return [want.num(item.c * item.c), want.num(item.c)];
  },
  answer(item) {
    return [`${item.a * item.a} + ${item.b * item.b} = ${item.c * item.c} cm²; the long side is ${item.c} cm`];
  },
};

const pySumSide = {
  id: "py-sum-side",
  group: "py-sum",
  label: "Find the long side",
  blurb: "Square each short side, add, then square root.",
  heading: "Find the hypotenuse, x",
  instruction: (o) =>
    "Square each short side, add the two squares, and take the square root: that is the " +
    "long side." + (tier(o) === "stretch" ? " Where it is not a whole number, give it to one decimal place." : ""),
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const [a, b, c] = forLong(r, o, i);
    return { a, b, c, ...pose(r, o) };
  },
  render(item, o) {
    const { da, db, note } = drawn(item.a, item.b);
    const sides = { a: `${fmt(item.a)} cm`, b: `${fmt(item.b)} cm`, c: "x" };
    return side(art(rightTriSvg({ a: da, b: db, turn: item.turn, flip: item.flip, sides, box: FIG, note })),
      flow([[`${fmt(item.a)} × ${fmt(item.a)}`, box()], [`${fmt(item.b)} × ${fmt(item.b)}`, box()], ["add them", box()], ["square root", `${box()} cm`]], o));
  },
  worked(o) {
    return worked("One done for you", side(
      art(rightTriSvg({ a: 8, b: 6, sides: { a: "8 cm", b: "6 cm", c: "x" }, box: FIG })),
      say("8 × 8 = 64. 6 × 6 = 36. Add them: 64 + 36 = 100. The square root of 100 is 10, " +
        "so x = <b>10 cm</b>." + (o && tier(o) === "stretch" ? " A square root that is not whole — √52 = 7.21… — is given to one decimal place: 7.2." : ""))));
  },
  key(item) {
    const s = sq(item.a) + sq(item.b);
    return [want.num(sq(item.a)), want.num(sq(item.b)), want.num(s), want.num(item.c, tolOf(item.c))];
  },
  answer(item) {
    const s = sq(item.a) + sq(item.b);
    return [`${sq(item.a)} + ${sq(item.b)} = ${s}; x = √${s} ${Number.isInteger(item.c) ? "=" : "≈"} ${fmt(item.c)} cm`];
  },
};

/* ═══ 5. difference of sides: the big square take away a small one ═════════*/

const pyDiffArea = {
  id: "py-diff-area",
  group: "py-diff",
  label: "A small square from the big one",
  blurb: "Big square take away one small square: the other small square is what is left.",
  heading: "Find the missing small square, then its side",
  instruction: () =>
    "The two small squares together make the big square. So the big square take away the " +
    "small one you know leaves the one you do not. Then find its side.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [a, b, c] = tripleOf(r, o);
    return { a, b, c, ...pose(r, o) };
  },
  render(item) {
    const { da, db, note } = drawn(item.a, item.b);
    const areas = { a: "?", b: `${item.b * item.b} cm²`, c: `${item.c * item.c} cm²` };
    return side(
      art(rightTriSvg({ a: da, b: db, turn: item.turn, flip: item.flip, squares: "plain", areas, box: SQ, note })),
      ask(slot("small square", " cm²")) + ask(slot("its side", " cm")));
  },
  worked() {
    return worked("One done for you", say(
      "The big square is 169 cm² and one small square is 144 cm². 169 − 144 = <b>25 cm²</b>. " +
      "5 × 5 = 25, so that short side is <b>5 cm</b>."));
  },
  key(item) {
    return [want.num(item.a * item.a), want.num(item.a)];
  },
  answer(item) {
    return [`${item.c * item.c} − ${item.b * item.b} = ${item.a * item.a} cm²; its side is ${item.a} cm`];
  },
};

const pyDiffSide = {
  id: "py-diff-side",
  group: "py-diff",
  label: "Find a short side",
  blurb: "Square the long side, square the short one, take away, square root.",
  heading: "Find the short side, x",
  instruction: (o) =>
    "Square the long side and the short side you know. Take the smaller square away from " +
    "the bigger one, and take the square root." + (tier(o) === "stretch" ? " Give an answer that is not whole to one decimal place." : ""),
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const [a, b, c] = forShort(r, o, i);
    return { a, b, c, ...pose(r, o) };
  },
  render(item, o) {
    const { da, db, note } = drawn(item.a, item.b);
    const sides = { a: "x", b: `${fmt(item.b)} cm`, c: `${fmt(item.c)} cm` };
    return side(art(rightTriSvg({ a: da, b: db, turn: item.turn, flip: item.flip, sides, box: FIG, note })),
      flow([[`${fmt(item.c)} × ${fmt(item.c)}`, box()], [`${fmt(item.b)} × ${fmt(item.b)}`, box()], ["take away", box()], ["square root", `${box()} cm`]], o));
  },
  worked() {
    return worked("One done for you", side(
      art(rightTriSvg({ a: 12, b: 5, sides: { a: "x", b: "5 cm", c: "13 cm" }, box: FIG })),
      say("13 × 13 = 169. 5 × 5 = 25. Take away: 169 − 25 = 144. The square root of 144 is 12, " +
        "so x = <b>12 cm</b>. It is shorter than 13 — a short side always is.")));
  },
  key(item) {
    const d = sq(item.c) - sq(item.b);
    return [want.num(sq(item.c)), want.num(sq(item.b)), want.num(Math.round(d * 100) / 100), want.num(item.a, tolOf(item.a))];
  },
  answer(item) {
    const d = Math.round((sq(item.c) - sq(item.b)) * 100) / 100;
    return [`${sq(item.c)} − ${sq(item.b)} = ${d}; x = √${d} ${Number.isInteger(item.a) ? "=" : "≈"} ${fmt(item.a)} cm`];
  },
};

/* ═══ 6. the Pythagorean formula ═══════════════════════════════════════════*/

/** Every way of writing the rule for this triangle a child might type. */
function ruleForms(x, y, h) {
  const out = [];
  const powers = ["²", "^2", "2"];
  [[x, y], [y, x]].forEach(([p, q]) => powers.forEach((e) => {
    out.push(`${p}${e}+${q}${e}=${h}${e}`, `${h}${e}=${p}${e}+${q}${e}`);
  }));
  [[x, y], [y, x]].forEach(([p, q]) => {
    out.push(`${p}×${p}+${q}×${q}=${h}×${h}`, `${h}×${h}=${p}×${p}+${q}×${q}`);
  });
  return out;
}

const pyWrite = {
  id: "py-write",
  group: "py-formula",
  label: "Write the rule for this triangle",
  blurb: "short² + short² = long², in the triangle's own letters.",
  heading: "Write Pythagoras' rule for the triangle",
  instruction: () =>
    "Pythagoras' rule: the square on one short side, add the square on the other, makes the " +
    "square on the hypotenuse. Write it with the letters of this triangle.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [a, b] = tripleOf(r, o);
    return { a, b, ...pose(r, o), ...letterSides(r) };
  },
  render(item) {
    const { da, db } = drawn(item.a, item.b);
    return side(art(rightTriSvg({ a: da, b: db, turn: item.turn, flip: item.flip, sides: item.names, box: FIG })),
      ask("The rule:") + ask(line()));
  },
  worked() {
    return worked("One done for you", side(
      art(rightTriSvg({ a: 4, b: 3, sides: { a: "p", b: "q", c: "r" }, box: FIG })),
      say("r is opposite the right angle, so r is the hypotenuse, on its own: " +
        "<b>p² + q² = r²</b>.")));
  },
  key(item) {
    const { a, b, c } = item.names;
    return [want.text(...ruleForms(a, b, c))];
  },
  answer(item) {
    const { a, b, c } = item.names;
    return [`${a}² + ${b}² = ${c}²`];
  },
};

let findTurn = 0;
const pyFind = {
  id: "py-find",
  group: "py-formula",
  label: "Find the missing side",
  blurb: "Long side missing: add. Short side missing: take away. Decide first.",
  heading: "Find x",
  instruction: (o) =>
    "First look where x is. If it is the hypotenuse, add the two squares; if it is a short " +
    "side, take the smaller square from the bigger." + (tier(o) === "stretch" ? " One decimal place where it is not whole." : ""),
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    if (i === 0) findTurn = r.chance(0.5) ? 1 : 0;
    const long = (i + findTurn) % 2 === 0;
    /* decimals in pairs, so both kinds of question get them */
    const [a, b, c] = long ? forLong(r, o, i >> 1) : forShort(r, o, i >> 1);
    return { a, b, c, long, ...pose(r, o) };
  },
  render(item) {
    const { da, db, note } = drawn(item.a, item.b);
    const sides = item.long
      ? { a: `${fmt(item.a)} cm`, b: `${fmt(item.b)} cm`, c: "x" }
      : { a: "x", b: `${fmt(item.b)} cm`, c: `${fmt(item.c)} cm` };
    return side(art(rightTriSvg({ a: da, b: db, turn: item.turn, flip: item.flip, sides, box: FIG, note })),
      workbox(3) + ask(slot("x =", " cm")));
  },
  key(item) {
    const x = item.long ? item.c : item.a;
    return [want.num(x, tolOf(x))];
  },
  answer(item) {
    return item.long
      ? [`x² = ${sq(item.a)} + ${sq(item.b)}; x ${Number.isInteger(item.c) ? "=" : "≈"} ${fmt(item.c)} cm`]
      : [`x² = ${sq(item.c)} − ${sq(item.b)}; x ${Number.isInteger(item.a) ? "=" : "≈"} ${fmt(item.a)} cm`];
  },
};

/* Word problems: a triangle hidden in something ordinary. Each says which
   side is missing; the numbers are a triple scaled to something sensible, or
   at Stretch, every other one, a decimal answer. */
const WORDS = [
  { long: false, make: (a, b, c) => ({ text: `A ladder ${fmt(c)} m long leans against a wall. Its foot is ${fmt(b)} m from the wall. How far up the wall does it reach?`, v: a, unit: "m" }) },
  { long: true, make: (a, b, c) => ({ text: `A rectangular field is ${fmt(a)} m long and ${fmt(b)} m wide. How long is a path straight across it, from one corner to the opposite corner?`, v: c, unit: "m" }) },
  { long: true, make: (a, b, c) => ({ text: `You walk ${fmt(a)} km east, then ${fmt(b)} km north. How far are you now, in a straight line, from where you started?`, v: c, unit: "km" }) },
  { long: true, make: (a, b, c) => ({ text: `A screen is ${fmt(a)} cm wide and ${fmt(b)} cm tall. How long is its diagonal, from corner to corner?`, v: c, unit: "cm" }) },
  { long: false, make: (a, b, c) => ({ text: `A kite's string is ${fmt(c)} m long and pulled tight. The kite is straight above a spot ${fmt(b)} m from the person holding it. How high is the kite?`, v: a, unit: "m" }) },
  { long: false, make: (a, b, c) => ({ text: `A ramp is ${fmt(c)} m long, and it covers ${fmt(b)} m along the ground. How high does it rise?`, v: a, unit: "m" }) },
];
const dealWords = dealer();

const pyWords = {
  id: "py-words",
  group: "py-formula",
  label: "Word problems",
  blurb: "Ladders, fields, walks and screens — find the right-angled triangle first.",
  heading: "Word problems",
  instruction: (o) =>
    "Every one of these hides a right-angled triangle. Draw a quick sketch, mark the right " +
    "angle, decide which side is the one asked for, then use the rule." +
    (tier(o) === "stretch" ? " One decimal place where the answer is not whole." : ""),
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    const w = dealWords(r, WORDS, i);
    const [a, b, c] = w.long ? forLong(r, o, i) : forShort(r, o, i);
    return w.make(a, b, c);
  },
  render(item) {
    return `<p class="wb-ask wb-ask--lead gw-word">${item.text}</p>` + workbox(3) +
      ask(slot("Answer", ` ${item.unit}`));
  },
  key(item) {
    return [Number.isInteger(item.v) ? want.nums(item.v) : want.num(item.v, 0.05)];
  },
  answer(item) {
    return [`${fmt(item.v)} ${item.unit}`];
  },
};

let checkTurn = 0;
const pyConverse = {
  id: "py-converse",
  group: "py-formula",
  label: "Is the corner a right angle?",
  blurb: "The rule works backwards: if the squares add up, the corner is 90°.",
  heading: "Is the marked corner a right angle?",
  instruction: () =>
    "The rule works the other way round, too. Square the two shorter sides and add; square " +
    "the longest. If the two answers are the same, the corner between the shorter sides is a " +
    "right angle. If not, it is not — however square it looks.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    if (i === 0) checkTurn = r.chance(0.5) ? 1 : 0;
    const yes = (i + checkTurn) % 2 === 0;
    let [a, b, c] = tripleOf(r, o);
    const halved = tier(o) === "stretch" && r.chance(0.5);
    if (halved) [a, b, c] = [a / 2, b / 2, c / 2];
    /* a near miss — never so far that the three sides lie flat */
    if (!yes) {
      const step = halved ? 0.5 : 1;
      c = r.chance(0.5) && c - step > Math.abs(a - b) + step ? c - step : c + step;
      if (c >= a + b) c = Math.max(a, b) + step;
    }
    /* the triangle those three sides really make */
    const angle = (Math.acos((a * a + b * b - c * c) / (2 * a * b)) * 180) / Math.PI;
    return { a, b, c, yes, angle, ...pose(r, o) };
  },
  render(item) {
    const k = Math.max(item.a, item.b) / Math.min(item.a, item.b);
    const sides = { a: `${fmt(item.a)} cm`, b: `${fmt(item.b)} cm`, c: `${fmt(item.c)} cm` };
    const fig = rightTriSvg({
      a: item.a, b: item.b, angle: item.angle, turn: item.turn, flip: item.flip, sides, corner: "ask", box: FIG,
      note: k > 3.2 ? "not drawn accurately" : "",
    });
    return side(art(fig),
      ask(`${fmt(item.a)}² + ${fmt(item.b)}² = ${box()}`) + ask(`${fmt(item.c)}² = ${box()}`) +
      tick("a right angle", "not a right angle"));
  },
  key(item) {
    return [want.num(Math.round((sq(item.a) + sq(item.b)) * 100) / 100), want.num(sq(item.c)), want.tick(item.yes ? 0 : 1)];
  },
  answer(item) {
    const s = Math.round((sq(item.a) + sq(item.b)) * 100) / 100;
    return [`${s} and ${sq(item.c)} — ${item.yes ? "the same: a right angle" : "not the same: not a right angle"}`];
  },
};

/* ═══ 7. Pythagorean triples ═══════════════════════════════════════════════*/

let tripleTurn = 0;
const trIs = {
  id: "tr-is",
  group: "py-triples",
  label: "Triple or not?",
  blurb: "Three whole numbers that fit the rule exactly: 3, 4, 5 is one.",
  heading: "Is it a Pythagorean triple?",
  instruction: () =>
    "A Pythagorean triple is three whole numbers that fit the rule exactly: the two smaller " +
    "squared and added make the biggest squared. Check each one.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    if (i === 0) tripleTurn = r.chance(0.5) ? 1 : 0;
    const yes = (i + tripleTurn) % 2 === 0;
    let [a, b, c] = r.pick(triplesOf(o));
    if (!yes) {
      const which = r.int(0, 2);
      if (which === 0) c += r.pick([1, 2]);
      else if (which === 1) b += 1;
      else a = Math.max(1, a - 1);
    }
    [a, b] = a < b ? [a, b] : [b, a];
    return { a, b, c, yes };
  },
  render(item) {
    return `<p class="wb-ask wb-ask--lead">${item.a}, ${item.b}, ${item.c}</p>` +
      ask(`${item.a}² + ${item.b}² = ${box()}`) + ask(`${item.c}² = ${box()}`) + tick("a triple", "not a triple");
  },
  worked() {
    return worked("One done for you", say(
      "5, 12, 13: 5² + 12² = 25 + 144 = <b>169</b>, and 13² = <b>169</b>. The same — it is a triple."));
  },
  key(item) {
    return [want.num(item.a * item.a + item.b * item.b), want.num(item.c * item.c), want.tick(item.yes ? 0 : 1)];
  },
  answer(item) {
    return [`${item.a * item.a + item.b * item.b} and ${item.c * item.c} — ${item.yes ? "a triple" : "not a triple"}`];
  },
};

const trComplete = {
  id: "tr-complete",
  group: "py-triples",
  label: "Complete the triple",
  blurb: "Two numbers of a triple given. The rule finds the third.",
  heading: "Find the missing number of the triple",
  instruction: () =>
    "Each line is a Pythagorean triple with one number missing. If the biggest is missing, " +
    "add the squares; if a smaller one is, take away. Then square root.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const [a, b, c] = r.pick(triplesOf(o));
    const gap = tier(o) === "gentle" ? 2 : r.int(0, 2);
    return { t: [a, b, c], gap };
  },
  render(item) {
    return `<p class="wb-ask wb-ask--lead">${item.t.map((v, j) => (j === item.gap ? box() : v)).join(", ")}</p>`;
  },
  worked() {
    return worked("One done for you", say(
      "8, 15, ?: the biggest is missing, so add: 64 + 225 = 289, and 17 × 17 = 289 — it is " +
      "<b>17</b>. For ?, 12, 13: take away: 169 − 144 = 25, so it is <b>5</b>."));
  },
  key(item) {
    return [want.num(item.t[item.gap])];
  },
  answer(item) {
    return [item.t.join(", ")];
  },
};

const BASES = { gentle: [[3, 4, 5]], middle: [[3, 4, 5], [5, 12, 13]], stretch: [[3, 4, 5], [5, 12, 13], [8, 15, 17]] };

const trTimes = {
  id: "tr-times",
  group: "py-triples",
  label: "Make new triples",
  blurb: "Double 3, 4, 5 and it is still a triple: 6, 8, 10. So is × 3, × 4 …",
  heading: "Multiply a triple",
  instruction: () =>
    "Multiply all three numbers of a triple by the same number and you get another triple. " +
    "Make the new one, then check it with the rule.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const base = r.pick(BASES[tier(o)] || BASES.gentle);
    const k = tier(o) === "gentle" ? r.int(2, 3) : tier(o) === "middle" ? r.int(2, 5) : r.int(2, 10);
    return { base, k };
  },
  render(item) {
    const [a, b, c] = item.base;
    return `<p class="wb-ask wb-ask--lead">${a}, ${b}, ${c} — each × ${item.k}</p>` +
      ask(`${box()}, ${box()}, ${box()}`) +
      ask(slot("two smaller, squared and added", "")) + ask(slot("biggest, squared", ""));
  },
  worked() {
    return worked("One done for you", say(
      "3, 4, 5 × 2 = <b>6, 8, 10</b>. Check: 36 + 64 = 100, and 10² = 100. Still a triple."));
  },
  key(item) {
    const [a, b, c] = item.base.map((v) => v * item.k);
    return [want.num(a), want.num(b), want.num(c), want.num(a * a + b * b), want.num(c * c)];
  },
  answer(item) {
    const [a, b, c] = item.base.map((v) => v * item.k);
    return [`${a}, ${b}, ${c} — ${a * a + b * b} = ${c * c}`];
  },
};

const ODD_ROWS = { gentle: [3, 5, 7], middle: [3, 5, 7, 9], stretch: [3, 5, 7, 9, 11] };

const trOdd = {
  id: "tr-odd",
  group: "py-triples",
  label: "Triples from odd numbers",
  blurb: "Square an odd number, split it into two numbers side by side: a triple every time.",
  heading: "A triple from every odd number",
  instruction: () =>
    "Square the odd number. Split the square into two whole numbers next to each other " +
    "(9 is 4 and 5). The odd number and those two make a triple: write it in the last column.",
  cols: 1,
  defaultCount: 1,
  make(r, o) {
    return { rows: ODD_ROWS[tier(o)] || ODD_ROWS.gentle };
  },
  render(item, o) {
    const filled = helpOf(o).id === "show" ? 1 : 0;
    const body = item.rows.map((n, j) => {
      const s = n * n;
      const lo = (s - 1) / 2;
      return j < filled
        ? `<tr><td>${n}</td><td>${s}</td><td>${lo}</td><td>${lo + 1}</td><td>${n}, ${lo}, ${lo + 1}</td></tr>`
        : `<tr><td>${n}</td><td class="wb-cell"></td><td class="wb-cell"></td><td class="wb-cell"></td><td class="wb-cell"></td></tr>`;
    }).join("");
    return `<table class="gw-table"><thead><tr><th>Odd number</th><th>Its square</th><th>Smaller half</th>` +
      `<th>Bigger half</th><th>The triple</th></tr></thead><tbody>${body}</tbody></table>`;
  },
  key(item, o) {
    const filled = helpOf(o).id === "show" ? 1 : 0;
    const out = [];
    item.rows.forEach((n, j) => {
      if (j < filled) return;
      const s = n * n;
      const lo = (s - 1) / 2;
      out.push(want.num(s), want.num(lo), want.num(lo + 1), want.nums(n, lo, lo + 1));
    });
    return out;
  },
  answer(item) {
    return item.rows.map((n) => {
      const lo = (n * n - 1) / 2;
      return `${n}: ${n * n} = ${lo} + ${lo + 1}, so ${n}, ${lo}, ${lo + 1}`;
    });
  },
};

export const PY_EXERCISES = [
  pySpot, pyCorner,
  pyHyp, pyMeasure,
  pyDrawSquares, pyCount, pyArea,
  pySumArea, pySumSide,
  pyDiffArea, pyDiffSide,
  pyWrite, pyFind, pyWords, pyConverse,
  trIs, trComplete, trTimes, trOdd,
];
