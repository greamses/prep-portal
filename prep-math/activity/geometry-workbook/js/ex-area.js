/* ============================================================================
   Geometry Workbook — CHAPTER 10: Area and perimeter of triangles
   ----------------------------------------------------------------------------
   Six sections, in the order they were asked for:

     kinds of triangle · perimeter · area · area and perimeter with ratio ·
     area and perimeter with Pythagoras · shapes made of triangles

   Every section goes CONCRETE → REPRESENTATIONAL → ABSTRACT, in that order,
   and the exercises inside each section are listed that way round:

     concrete         printed at TRUE SIZE for a ruler, or on centimetre
                      squares to be counted. The child finds the numbers.
     representational a drawing with its numbers written on it, and the marks
                      a textbook uses — ticks for equal sides, a dashed height
                      with a square at its foot, a dashed line for a side
                      that is inside a shape.
     abstract         words and numbers only; no picture to lean on.

   The ideas are met before their rules. Perimeter is measured and added
   before it is 3s or 2a + b. Area is counted — whole squares and half
   squares — then seen as half of the rectangle the triangle sits in, and only
   then written ½ × base × height. The height is the one people get wrong, so
   from Middle up the sloping sides are labelled too, and some triangles are
   obtuse, with the height outside the triangle, where it really is.

   Ratio: sides shared out in a ratio; base and height in a ratio; and a
   triangle made bigger — every length × k, so the perimeter × k and the area
   × k², met first on squared paper where the four little triangles can be
   seen.

   Pythagoras is used, not taught (chapter 5 does that): to find the side the
   perimeter needs, or the height the area needs.

   Shapes made of triangles only: parts counted on squares, then parts
   worked out and added — and for perimeter, the one rule that matters: a
   side two triangles share is INSIDE the shape and is not counted. It is
   drawn dashed, every time, so the picture says so before the words do.

   Numbers by level: Gentle whole centimetres and small numbers; Middle half
   centimetres to measure and bigger numbers; Stretch millimetres to measure,
   decimals, obtuse triangles and answers to one decimal place.
   ========================================================================== */

import { triSvg, compSvg, fromSides, edgeKey } from "./areaart.js";
import { levelOf, helpOf, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

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

const FIG = { w: 66, h: 50 };
const WIDE = { w: 84, h: 56 };
const tier = (o) => levelOf(o).id;
const named = (o) => helpOf(o).id !== "try";
const rnd = (v) => Math.round(v * 100) / 100;
const r1 = (v) => Math.round(v * 10) / 10;
const fmt = (v) => String(rnd(v));
const cm = (v) => `${fmt(v)} cm`;
const whole = (v) => Math.abs(v - Math.round(v)) < 1e-9;
/** A number that is whole (or near enough), exactly; otherwise one decimal place. */
const exactOr1 = (v) => (whole(v) ? want.num(Math.round(v)) : want.num(r1(v), 0.05));
const KINDS = ["equilateral", "isosceles", "scalene"];

/** The four-box flow from chapter one: named at Show me and Help me. */
function flow(steps, o) {
  const show = named(o);
  const step = ([label, content]) =>
    `<span class="gw-flow__step">${show ? `<em>${label}</em>` : ""}<span class="gw-flow__val">${content}</span></span>`;
  return `<div class="gw-flow">${steps.map(step).join(`<span class="gw-flow__arrow">→</span>`)}</div>`;
}

/** A triangle turned about the origin, and mirrored if asked. */
function turned(tri, deg, flip = false) {
  const t = (deg * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return tri.map(([x, y]) => {
    const X = flip ? -x : x;
    return [rnd(X * c - y * s), rnd(X * s + y * c)];
  });
}

/** Tick marks for the equal sides: one tick on each side of the equal pair. */
function marksFor(lens) {
  const eq = (a, b) => Math.abs(a - b) < 1e-6;
  if (eq(lens[0], lens[1]) && eq(lens[1], lens[2])) return [1, 1, 1];
  return lens.map((v, i) => (lens.some((w, j) => j !== i && eq(v, w)) ? 1 : 0));
}

const kindOf = (lens) => {
  const m = marksFor(lens);
  const n = m.reduce((a, b) => a + b, 0);
  return n === 3 ? 0 : n === 2 ? 1 : 2;
};

/* ── the numbers ───────────────────────────────────────────────────────────*/

/* What a ruler is expected to read, level by level. */
const RULER = { gentle: 1, middle: 0.5, stretch: 0.1 };

/**
 * Three sides of one kind of triangle, printable at true size: every side 3 to
 * 8 cm, the triangle not so flat that a ruler cannot find its corners, and —
 * so a ruler can tell them apart — sides that are different are different by
 * most of a centimetre.
 */
function trueSides(r, o, kind) {
  const st = RULER[tier(o)] || 1;
  const L = (lo, hi) => rnd(r.int(Math.ceil(lo / st), Math.floor(hi / st)) * st);
  const apart = (xs) => xs.every((x, i) => xs.every((y, j) => i === j || Math.abs(x - y) >= 0.8));
  for (let g = 0; g < 300; g++) {
    let s;
    if (kind === "equilateral") { const a = L(3.5, 6.5); s = [a, a, a]; }
    else if (kind === "isosceles") { const a = L(4, 7); const b = L(3, 7.5); if (!apart([a, b])) continue; s = [a, a, b]; }
    else { s = [L(3, 8), L(3, 8), L(3, 8)]; if (!apart(s)) continue; }
    const x = s.slice().sort((p, q) => p - q);
    if (x[2] > x[0] + x[1] - 1.2) continue;
    return r.shuffle(s);
  }
  return [5, 5, 5];
}

/** A triangle drawn from three sides, the third one along the bottom. */
const drawnFrom = ([a, b, c]) => fromSides(a, b, c);
/* fromSides puts c along p0→p1, a along p1→p2 and b along p2→p0, so the
   sides of the drawing, in the order triSvg labels them, are: */
const inOrder = ([a, b, c]) => [c, a, b];

/* ═══ 1. kinds of triangle ═════════════════════════════════════════════════*/

export const AR_GROUPS = [
  { id: "ar-kinds", chapter: "Chapter 10 · Area and perimeter of triangles", label: "Kinds of triangle" },
  { id: "ar-perim", label: "Perimeter" },
  { id: "ar-area", label: "Area" },
  { id: "ar-ratio", label: "Area and perimeter with ratio" },
  { id: "ar-py", label: "Area and perimeter with Pythagoras" },
  { id: "ar-comp", label: "Shapes made of triangles" },
];

const dealKind = dealer();

const arKindMeasure = {
  id: "ar-kind-measure",
  group: "ar-kinds",
  label: "Measure, then name it",
  blurb: "True size. A ruler finds the sides; the sides decide the name.",
  heading: "Measure the sides and name the triangle",
  instruction: (o) =>
    "The triangle is printed at its real size. Measure each side with a ruler, in centimetres" +
    ({ gentle: "", middle: " — to the nearest half centimetre", stretch: " — to the millimetre" }[tier(o)]) +
    ". Three sides the same: equilateral. Two the same: isosceles. All different: scalene.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const kind = dealKind(r, KINDS, i);
    return { s: trueSides(r, o, kind), kind, turn: r.pick([0, 180]), flip: r.chance(0.5) };
  },
  render(item) {
    const tri = turned(drawnFrom(item.s), item.turn, item.flip);
    return side(art(triSvg(tri, { scale: 10, labels: ["p", "q", "r"], label: "A triangle at true size" })),
      ask(["p", "q", "r"].map((l) => slot(l, " cm")).join("")) + tick("equilateral", "isosceles", "scalene"));
  },
  worked() {
    const tri = drawnFrom([5, 5, 3]);
    return worked("One done for you", side(art(triSvg(tri, { scale: 10, labels: ["p", "q", "r"] })),
      say("p is 3 cm, q is 5 cm and r is 5 cm. Two sides are the same, so it is <b>isosceles</b>. " +
        "Put the 0 of the ruler exactly on a corner, not on the end of the ruler.")));
  },
  key(item) {
    const L = inOrder(item.s);
    return [...L.map((v) => want.num(v, 0.2)), want.tick(KINDS.indexOf(item.kind))];
  },
  answer(item) {
    const L = inOrder(item.s);
    return [`p = ${cm(L[0])}, q = ${cm(L[1])}, r = ${cm(L[2])} — ${item.kind}`];
  },
};

const arKindMarks = {
  id: "ar-kind-marks",
  group: "ar-kinds",
  label: "Read the marks",
  blurb: "Little ticks across sides that are equal. No ruler needed — read the marks.",
  heading: "Name the triangle from its marks",
  instruction: () =>
    "A short tick across a side means it is equal to every other side with a tick. Do not " +
    "measure — read the marks, and tick the name.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const kind = dealKind(r, KINDS, i);
    const s = trueSides(r, { ...o, level: "gentle" }, kind);
    return { s, kind, turn: tier(o) === "gentle" ? r.pick([0, 180]) : r.int(0, 11) * 30, flip: r.chance(0.5) };
  },
  render(item) {
    const tri = turned(drawnFrom(item.s), item.turn, item.flip);
    return side(art(triSvg(tri, { box: { w: 46, h: 40 }, ticks: marksFor(inOrder(item.s)) })),
      tick("equilateral", "isosceles", "scalene"));
  },
  worked() {
    const tri = drawnFrom([6, 6, 4]);
    return worked("One done for you", side(art(triSvg(tri, { box: { w: 46, h: 40 }, ticks: [0, 1, 1] })),
      say("Two sides have a tick and one has none: two sides are equal, so it is <b>isosceles</b>. " +
        "No ticks at all would mean scalene; a tick on all three, equilateral.")));
  },
  key(item) {
    return [want.tick(KINDS.indexOf(item.kind))];
  },
  answer(item) {
    return [item.kind];
  },
};

/* Sides at every level; from Middle, angles too — equal angles sit opposite
   equal sides, so the same three names come from the angles. */
const arKindNumbers = {
  id: "ar-kind-numbers",
  group: "ar-kinds",
  label: "Name it from the numbers",
  blurb: "No picture: three sides, or three angles, and the name.",
  heading: "Name the triangle",
  instruction: (o) =>
    "No drawing this time. Three sides the same: equilateral; two: isosceles; none: scalene." +
    (tier(o) === "gentle" ? "" : " With angles it is the same — equal angles sit opposite equal sides."),
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const kind = dealKind(r, KINDS, i);
    const angles = tier(o) !== "gentle" && i % 2 === 1;
    if (angles) {
      let A;
      if (kind === "equilateral") A = [60, 60, 60];
      else if (kind === "isosceles") { const x = r.pick([30, 40, 45, 50, 65, 70, 75, 80]); A = [x, x, 180 - 2 * x]; }
      else { let a; let b; do { a = r.int(3, 10) * 10; b = r.int(2, 9) * 10; } while (a === b || 180 - a - b <= 10 || [a, b].includes(180 - a - b)); A = [a, b, 180 - a - b]; }
      return { kind, angles: r.shuffle(A) };
    }
    const big = tier(o) === "stretch";
    let s;
    if (kind === "equilateral") { const a = r.int(3, 15); s = [a, a, a]; }
    else if (kind === "isosceles") { let a; let b; do { a = r.int(4, 15); b = r.int(3, 15); } while (a === b || b >= 2 * a); s = [a, a, b]; }
    else { do { s = [r.int(3, 15), r.int(3, 15), r.int(3, 15)]; } while (new Set(s).size < 3 || Math.max(...s) * 2 >= s[0] + s[1] + s[2]); }
    if (big) s = s.map((v) => v / 2);
    return { kind, sides: r.shuffle(s) };
  },
  render(item) {
    const what = item.angles
      ? `Angles <b>${item.angles.map((a) => `${a}°`).join(", ")}</b>`
      : `Sides <b>${item.sides.map(cm).join(", ")}</b>`;
    return lead(what) + tick("equilateral", "isosceles", "scalene");
  },
  key(item) {
    return [want.tick(KINDS.indexOf(item.kind))];
  },
  answer(item) {
    return [item.kind];
  },
};

/* ═══ 2. perimeter ═════════════════════════════════════════════════════════*/

const arPerMeasure = {
  id: "ar-per-measure",
  group: "ar-perim",
  label: "Measure round the edge",
  blurb: "True size: measure all three sides, then add — that is the perimeter.",
  heading: "Measure the sides, then find the perimeter",
  instruction: () =>
    "The perimeter is the distance all the way round the edge: the three sides added together. " +
    "Measure each side of the real-size triangle, then add.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const kind = dealKind(r, KINDS, i + 1);
    return { s: trueSides(r, o, kind), turn: r.pick([0, 180]), flip: r.chance(0.5) };
  },
  render(item) {
    const tri = turned(drawnFrom(item.s), item.turn, item.flip);
    return side(art(triSvg(tri, { scale: 10, labels: ["p", "q", "r"], label: "A triangle at true size" })),
      ask(["p", "q", "r"].map((l) => slot(l, " cm")).join("")) + ask(slot("Perimeter", " cm")));
  },
  worked() {
    return worked("One done for you", say(
      "The sides measure 4 cm, 6 cm and 5 cm. All the way round is 4 + 6 + 5 = <b>15 cm</b>. " +
      "A piece of string laid round the edge and then pulled straight would be 15 cm long."));
  },
  key(item) {
    const L = inOrder(item.s);
    return [...L.map((v) => want.num(v, 0.2)), want.num(rnd(L[0] + L[1] + L[2]), 0.5)];
  },
  answer(item) {
    const L = inOrder(item.s);
    return [`${L.map(fmt).join(" + ")} = ${cm(L[0] + L[1] + L[2])}`];
  },
};

/** Three sides for a worked-out question, by level: whole, bigger, halves. */
function calcSides(r, o, kind) {
  const t = tier(o);
  const hi = t === "gentle" ? 10 : 20;
  const half = t === "stretch";
  const L = () => (half ? r.int(6, 2 * hi) / 2 : r.int(3, hi));
  for (let g = 0; g < 300; g++) {
    let s;
    if (kind === "equilateral") { const a = L(); s = [a, a, a]; }
    else if (kind === "isosceles") { const a = L(); const b = L(); if (Math.abs(a - b) < 1) continue; s = [a, a, b]; }
    else { s = [L(), L(), L()]; if (s.some((x, i) => s.some((y, j) => i !== j && Math.abs(x - y) < 1))) continue; }
    const x = s.slice().sort((p, q) => p - q);
    if (x[2] > x[0] + x[1] - 1) continue;
    return r.shuffle(s);
  }
  return [6, 6, 6];
}

const arPerAdd = {
  id: "ar-per-add",
  group: "ar-perim",
  label: "Add the sides — the marks give the rest",
  blurb: "Only the lengths you need are written. A tick means the same length again.",
  heading: "Find the perimeter",
  instruction: () =>
    "Add the three sides. Not every length is written: a side with the same marks as a " +
    "labelled side is the same length, so use it again.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const kind = dealKind(r, KINDS, i);
    return { s: calcSides(r, o, kind), turn: r.int(0, 3) * 90 + (tier(o) === "stretch" ? r.int(0, 5) * 15 : 0), flip: r.chance(0.5) };
  },
  render(item) {
    const L = inOrder(item.s);
    const marks = marksFor(L);
    /* write each length once: the first side of each length only */
    const labels = L.map((v, i) => (L.findIndex((w) => Math.abs(w - v) < 1e-6) === i ? cm(v) : null));
    const tri = turned(drawnFrom(item.s), item.turn, item.flip);
    return side(art(triSvg(tri, { box: FIG, labels, ticks: marks })), ask(slot("Perimeter", " cm")));
  },
  worked() {
    const tri = drawnFrom([7, 7, 4]);
    return worked("One done for you", side(art(triSvg(tri, { box: FIG, labels: ["4 cm", "7 cm", null], ticks: [0, 1, 1] })),
      say("Only one of the ticked sides says 7 cm, but the tick on the other says it is 7 cm too. " +
        "4 + 7 + 7 = <b>18 cm</b>.")));
  },
  key(item) {
    return [want.num(rnd(item.s[0] + item.s[1] + item.s[2]))];
  },
  answer(item) {
    const L = inOrder(item.s);
    return [`${L.map(fmt).join(" + ")} = ${cm(L[0] + L[1] + L[2])}`];
  },
};

/* The rules for perimeter, and the same rules backwards. */
const PER_RULES = [
  { id: "eq", make: (s) => ({ text: `An equilateral triangle has sides of ${cm(s)}. What is its perimeter?`, v: 3 * s, rule: `3 × ${fmt(s)}` }) },
  { id: "iso", make: (s, b) => ({ text: `An isosceles triangle has two sides of ${cm(s)} and a base of ${cm(b)}. What is its perimeter?`, v: 2 * s + b, rule: `2 × ${fmt(s)} + ${fmt(b)}` }) },
  { id: "eq-back", make: (s) => ({ text: `The perimeter of an equilateral triangle is ${cm(3 * s)}. How long is each side?`, v: s, rule: `${fmt(3 * s)} ÷ 3` }) },
  { id: "iso-back", make: (s, b) => ({ text: `An isosceles triangle has a perimeter of ${cm(2 * s + b)}. Its base is ${cm(b)}. How long is each of the two equal sides?`, v: s, rule: `(${fmt(2 * s + b)} − ${fmt(b)}) ÷ 2` }) },
  { id: "iso-base", make: (s, b) => ({ text: `The two equal sides of an isosceles triangle are ${cm(s)} each, and its perimeter is ${cm(2 * s + b)}. How long is the base?`, v: b, rule: `${fmt(2 * s + b)} − 2 × ${fmt(s)}` }) },
  { id: "sc-back", make: (s, b, c) => ({ text: `A triangle has a perimeter of ${cm(s + b + c)}. Two of its sides are ${cm(s)} and ${cm(b)}. How long is the third side?`, v: c, rule: `${fmt(s + b + c)} − ${fmt(s)} − ${fmt(b)}` }) },
];
const dealRule = dealer();

const arPerRule = {
  id: "ar-per-rule",
  group: "ar-perim",
  label: "The rules, both ways",
  blurb: "Equilateral: 3 × side. Isosceles: 2 × side + base. And backwards.",
  heading: "Perimeter problems",
  instruction: () =>
    "An equilateral triangle's perimeter is 3 × its side; an isosceles one's is 2 × an equal " +
    "side + the base. Some of these go backwards: you have the perimeter, and a side is missing.",
  cols: 1,
  defaultCount: 6,
  make(r, o, k, i) {
    const rule = dealRule(r, PER_RULES, i);
    const [x, y, z] = calcSides(r, o, "scalene");
    /* scalene sides are all different, so the longer of two makes the equal
       pair of an isosceles triangle and the shorter its base, always a triangle */
    if (rule.id === "sc-back") return rule.make(x, y, z);
    return rule.make(Math.max(x, y), Math.min(x, y));
  },
  render(item) {
    return lead(item.text) + workbox(2) + ask(slot("Answer", " cm"));
  },
  worked() {
    return worked("One done for you", say(
      "An isosceles triangle has a perimeter of 26 cm and a base of 8 cm. Take the base away: " +
      "26 − 8 = 18 cm for the two equal sides together, so each is 18 ÷ 2 = <b>9 cm</b>."));
  },
  key(item) {
    return [want.num(rnd(item.v))];
  },
  answer(item) {
    return [`${item.rule} = ${cm(item.v)}`];
  },
};

/* ═══ 3. area ══════════════════════════════════════════════════════════════*/

const arCount = {
  id: "ar-count",
  group: "ar-area",
  label: "Count the squares",
  blurb: "Centimetre squares: count the whole ones, count the halves, put them together.",
  heading: "Count the squares inside the triangle",
  instruction: () =>
    "Each square is 1 cm by 1 cm: 1 square centimetre, 1 cm². Count the whole squares inside " +
    "the triangle. The sloping side cuts some squares exactly in half — count those, and two " +
    "halves make one whole.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const n = { gentle: r.int(3, 5), middle: r.int(4, 6), stretch: r.int(5, 7) }[tier(o)] || 4;
    return { n, turn: r.int(0, 3) * 90 };
  },
  render(item) {
    const tri = turned([[0, 0], [item.n, 0], [0, item.n]], item.turn);
    return side(art(triSvg(tri, { grid: true, label: "A triangle on centimetre squares" })),
      ask(slot("Whole squares", "")) + ask(slot("Half squares", "")) + ask(slot("Area", " cm²")));
  },
  worked() {
    return worked("One done for you", side(art(triSvg([[0, 0], [3, 0], [0, 3]], { grid: true })),
      say("3 whole squares, and 3 halves along the slope. 3 halves make 1½ wholes. The area is " +
        "3 + 1½ = <b>4.5 cm²</b>.")));
  },
  key(item) {
    const n = item.n;
    return [want.num((n * (n - 1)) / 2), want.num(n), want.num((n * n) / 2)];
  },
  answer(item) {
    const n = item.n;
    return [`${(n * (n - 1)) / 2} whole + ${n} halves = ${fmt((n * n) / 2)} cm²`];
  },
};

const arHalfRect = {
  id: "ar-half-rect",
  group: "ar-area",
  label: "Half of its rectangle",
  blurb: "Draw the rectangle round it: the triangle is exactly half, every time.",
  heading: "The triangle is half of its rectangle",
  instruction: () =>
    "The dashed rectangle fits round the triangle. Find its area: length × width. The " +
    "triangle is exactly half of it — the part outside the triangle would fold over and fill it.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const t = tier(o);
    const b = r.int(t === "gentle" ? 3 : 4, t === "gentle" ? 6 : 7);
    const h = r.int(2, t === "gentle" ? 4 : 5);
    /* the top corner: over one end (right-angled) first, then anywhere along */
    const x = i % 3 === 0 ? r.pick([0, b]) : r.int(1, b - 1);
    return { b, h, x, flip: r.chance(0.5) };
  },
  render(item) {
    const tri = turned([[0, 0], [item.b, 0], [item.x, item.h]], 0, item.flip);
    return side(art(triSvg(tri, { grid: true, rect: true, label: "A triangle inside its rectangle" })),
      ask(slot("Rectangle", " cm²")) + ask(slot("Triangle", " cm²")));
  },
  worked() {
    return worked("One done for you", side(art(triSvg([[0, 0], [4, 0], [1, 3]], { grid: true, rect: true, height: { from: 2 } })),
      say("The rectangle is 4 × 3 = 12 cm². The height splits it into two smaller rectangles, and " +
        "the triangle is half of each — so half of the whole: <b>6 cm²</b>.")));
  },
  key(item) {
    return [want.num(item.b * item.h), want.num((item.b * item.h) / 2)];
  },
  answer(item) {
    return [`${item.b} × ${item.h} = ${item.b * item.h} cm²; half is ${fmt((item.b * item.h) / 2)} cm²`];
  },
};

/** A base, a height, and where the top corner sits: inside, over an end, or
    — from Middle — past the end, so the height falls outside. */
function baseHeight(r, o, i) {
  const t = tier(o);
  let b;
  let h;
  if (t === "gentle") {
    do { b = r.int(4, 10); h = r.int(3, 8); } while ((b * h) % 2);
  } else if (t === "middle") {
    b = r.int(5, 14); h = r.int(3, 12);
  } else {
    b = r.int(8, 28) / 2; h = r.int(3, 12);
  }
  const shape = t === "gentle" ? "in" : ["in", "right", "out"][i % 3];
  const x = shape === "in" ? b * (0.2 + 0.6 * r.int(0, 10) / 10)
    : shape === "right" ? 0 : -b * (0.2 + 0.2 * r.int(0, 5) / 5);
  return { b, h, x, shape, flip: r.chance(0.5) };
}

const bhTri = (it) => turned([[0, 0], [it.b, 0], [it.x, it.h]], 0, it.flip);

const arHalfBh = {
  id: "ar-half-bh",
  group: "ar-area",
  label: "½ × base × height",
  blurb: "The rectangle's area, halved: base × height ÷ 2. The height is the dashed one.",
  heading: "Find the area",
  instruction: (o) =>
    "Area of a triangle = base × height ÷ 2. The height is the dashed line, square to the base " +
    "— not a sloping side." + (tier(o) === "gentle" ? "" : " When the top leans past the end of the base, the height falls outside the triangle; it is still the height."),
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    return baseHeight(r, o, i);
  },
  render(item, o) {
    const tri = bhTri(item);
    const slant = tier(o) !== "gentle";
    const s1 = Math.hypot(item.x - item.b, item.h);
    const s2 = Math.hypot(item.x, item.h);
    const labels = [cm(item.b), slant && item.shape !== "right" ? cm(r1(s1)) : null, slant && item.shape !== "right" ? cm(r1(s2)) : null];
    return side(art(triSvg(tri, { box: FIG, labels, height: { from: 2, label: cm(item.h) } })),
      flow([["base × height", box()], ["÷ 2", `${box()} cm²`]], o));
  },
  worked(o) {
    const tri = [[0, 0], [8, 0], [-2, 5]];
    return worked("One done for you", side(art(triSvg(tri, { box: FIG, labels: ["8 cm", "11.2 cm", "5.4 cm"], height: { from: 2, label: "5 cm" } })),
      say("The base is 8 cm and the dashed height is 5 cm. 8 × 5 = 40, and half of 40 is <b>20 cm²</b>. " +
        (o && tier(o) === "gentle" ? "" : "The sloping sides, 11.2 cm and 5.4 cm, are not used: they are not square to the base."))));
  },
  key(item) {
    return [want.num(rnd(item.b * item.h)), want.num(rnd((item.b * item.h) / 2))];
  },
  answer(item) {
    return [`${fmt(item.b)} × ${fmt(item.h)} = ${fmt(item.b * item.h)}; ÷ 2 = ${fmt((item.b * item.h) / 2)} cm²`];
  },
};

/* The three whole-number right-angled triangles by level, short sides first. */
const TRIPLES = {
  gentle: [[3, 4, 5], [6, 8, 10], [5, 12, 13]],
  middle: [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]],
  stretch: [[5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [12, 35, 37], [15, 20, 25], [10, 24, 26], [4.5, 6, 7.5]],
};
const tripleOf = (r, o) => {
  const [a, b, c] = r.pick(TRIPLES[tier(o)] || TRIPLES.gentle);
  return r.chance(0.5) ? [a, b, c] : [b, a, c];
};
/** A right-angled triangle drawn legs a (along) and b (up), kept drawable. */
const rightTri = (a, b) => {
  const k = Math.max(a, b) / Math.min(a, b);
  const [da, db] = k <= 3 ? [a, b] : a > b ? [a, a / 3] : [b / 3, b];
  return [[0, 0], [da, 0], [0, db]];
};
/** What to say under a right-angled triangle drawn fatter than it is. */
const rightNote = (a, b) => (Math.max(a, b) / Math.min(a, b) > 3 ? "not drawn accurately" : "");

const arRightArea = {
  id: "ar-right-area",
  group: "ar-area",
  label: "Right-angled: the two short sides",
  blurb: "In a right-angled triangle the base and height are the two sides at the square corner.",
  heading: "Find the perimeter and the area",
  instruction: () =>
    "A right-angled triangle already has its height drawn: the two sides that meet at the " +
    "square corner are the base and the height. The longest side is for the perimeter only.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [a, b, c] = tripleOf(r, o);
    return { a, b, c, turn: tier(o) === "gentle" ? 0 : r.int(0, 3) * 90, flip: r.chance(0.5) };
  },
  render(item) {
    const tri = turned(rightTri(item.a, item.b), item.turn, item.flip);
    return side(art(triSvg(tri, { box: { w: 52, h: 44 }, labels: [cm(item.a), cm(item.c), cm(item.b)], right: 0, note: rightNote(item.a, item.b) })),
      ask(slot("Perimeter", " cm")) + ask(slot("Area", " cm²")));
  },
  worked() {
    return worked("One done for you", side(art(triSvg([[0, 0], [4, 0], [0, 3]], { box: { w: 52, h: 44 }, labels: ["4 cm", "5 cm", "3 cm"], right: 0 })),
      say("Perimeter: 3 + 4 + 5 = <b>12 cm</b>. Area: the sides at the square corner, 4 × 3 = 12, " +
        "halved: <b>6 cm²</b>. The 5 cm side is not the height.")));
  },
  key(item) {
    return [want.num(rnd(item.a + item.b + item.c)), want.num(rnd((item.a * item.b) / 2))];
  },
  answer(item) {
    return [`perimeter ${cm(item.a + item.b + item.c)}; area ${fmt(item.a)} × ${fmt(item.b)} ÷ 2 = ${fmt((item.a * item.b) / 2)} cm²`];
  },
};

const REVERSE = [
  { ask: "height", make: (b, h) => ({ text: `A triangle has an area of ${fmt((b * h) / 2)} cm² and a base of ${cm(b)}. How tall is it?`, v: h, rule: `${fmt((b * h) / 2)} × 2 ÷ ${fmt(b)}` }) },
  { ask: "base", make: (b, h) => ({ text: `A triangle is ${cm(h)} tall and has an area of ${fmt((b * h) / 2)} cm². How long is its base?`, v: b, rule: `${fmt((b * h) / 2)} × 2 ÷ ${fmt(h)}` }) },
];
const dealReverse = dealer();

const arReverse = {
  id: "ar-reverse",
  group: "ar-area",
  label: "Area backwards",
  blurb: "Area and base given: double the area, divide by the base — that is the height.",
  heading: "Find the missing length",
  instruction: () =>
    "Base × height ÷ 2 = area, so base × height = area × 2. Double the area, then divide by " +
    "the length you know.",
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    const it = baseHeight(r, o, i);
    const which = dealReverse(r, REVERSE, i);
    return which.make(it.b, it.h);
  },
  render(item) {
    return lead(item.text) + workbox(2) + ask(slot("Answer", " cm"));
  },
  worked() {
    return worked("One done for you", say(
      "Area 24 cm², base 8 cm. Double the area: 48. That is base × height, so the height is " +
      "48 ÷ 8 = <b>6 cm</b>. Check: 8 × 6 ÷ 2 = 24."));
  },
  key(item) {
    return [want.num(rnd(item.v))];
  },
  answer(item) {
    return [`${item.rule} = ${cm(item.v)}`];
  },
};

/* ═══ 4. area and perimeter with ratio ═════════════════════════════════════*/

const RATIOS = {
  gentle: [[1, 1, 1], [2, 2, 3], [3, 4, 5], [2, 3, 4]],
  middle: [[2, 2, 3], [3, 3, 2], [3, 4, 5], [2, 3, 4], [4, 5, 6], [5, 12, 13], [5, 5, 8]],
  stretch: [[3, 4, 5], [4, 5, 6], [5, 12, 13], [8, 15, 17], [5, 5, 6], [7, 8, 9], [6, 6, 5]],
};
const RIGHT_RATIOS = ["3,4,5", "5,12,13", "8,15,17"];

const arRatioSides = {
  id: "ar-ratio-sides",
  group: "ar-ratio",
  label: "Sides in a ratio",
  blurb: "Perimeter shared out 3 : 4 : 5 — one part first, then every side.",
  heading: "Share the perimeter in the ratio",
  instruction: (o) =>
    "Add the parts of the ratio. The perimeter ÷ that many parts is one part. Each side is its " +
    "number of parts × one part. Then name the triangle." +
    (tier(o) === "gentle" ? "" : " If the sides are a Pythagorean triple, it is right-angled: find its area too."),
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const ratio = r.pick(RATIOS[tier(o)] || RATIOS.gentle);
    const k = { gentle: r.int(1, 4), middle: r.int(2, 6), stretch: r.pick([1.5, 2.5, 3, 4, 5, 6, 0.5 * r.int(3, 13)]) }[tier(o)] || 2;
    const right = tier(o) !== "gentle" && RIGHT_RATIOS.includes(ratio.join(","));
    return { ratio, k, right };
  },
  render(item, o) {
    const sum = item.ratio.reduce((a, b) => a + b, 0);
    const P = rnd(sum * item.k);
    return lead(`The sides of a triangle are in the ratio <b>${item.ratio.join(" : ")}</b>. Its perimeter is <b>${cm(P)}</b>.`) +
      flow([["parts in all", box()], ["one part", `${box()} cm`], ["the sides", `${box()} ${box()} ${box()} cm`]], o) +
      tick("equilateral", "isosceles", "scalene") +
      (item.right ? ask(slot("Area", " cm²")) : "");
  },
  worked() {
    return worked("One done for you", say(
      "3 : 4 : 5 with a perimeter of 36 cm. 3 + 4 + 5 = 12 parts, so one part is 36 ÷ 12 = 3 cm. " +
      "The sides are 3 × 3 = <b>9</b>, 4 × 3 = <b>12</b> and 5 × 3 = <b>15 cm</b> — all different: scalene. " +
      "9, 12, 15 is a triple, so the corner between 9 and 12 is square: area 9 × 12 ÷ 2 = <b>54 cm²</b>."));
  },
  key(item) {
    const sum = item.ratio.reduce((a, b) => a + b, 0);
    const sides = item.ratio.map((p) => rnd(p * item.k));
    const out = [want.num(sum), want.num(item.k), ...sides.map((v) => want.num(v)), want.tick(kindOf(item.ratio))];
    if (item.right) out.push(want.num(rnd((sides[0] * sides[1]) / 2)));
    return out;
  },
  answer(item) {
    const sides = item.ratio.map((p) => rnd(p * item.k));
    return [`one part = ${cm(item.k)}; sides ${sides.map(fmt).join(", ")} cm — ${KINDS[kindOf(item.ratio)]}` +
      (item.right ? `; area ${fmt((sides[0] * sides[1]) / 2)} cm²` : "")];
  },
};

const BH_RATIOS = { gentle: [[1, 2], [2, 1], [1, 1], [2, 3]], middle: [[2, 3], [3, 2], [3, 4], [1, 3], [4, 5]], stretch: [[3, 5], [2, 5], [4, 3], [5, 6], [3, 8]] };

const arRatioBh = {
  id: "ar-ratio-bh",
  group: "ar-ratio",
  label: "Base and height in a ratio",
  blurb: "Base : height is 2 : 3 and the area is 48 cm². One part squared is the key.",
  heading: "Find the base and the height",
  instruction: () =>
    "Base × height = area × 2. Base and height are so many parts each, so area × 2 ÷ (base " +
    "parts × height parts) is one part times itself. Square root it for one part, then multiply out.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const [m, n] = r.pick(BH_RATIOS[tier(o)] || BH_RATIOS.gentle);
    const k = { gentle: r.int(2, 4), middle: r.int(2, 6), stretch: r.int(2, 9) }[tier(o)] || 2;
    return { m, n, k };
  },
  render(item, o) {
    const A = rnd((item.m * item.k * item.n * item.k) / 2);
    return lead(`Base : height = <b>${item.m} : ${item.n}</b>, and the area is <b>${fmt(A)} cm²</b>.`) +
      flow([["area × 2", box()], [`÷ ${item.m * item.n}`, box()], ["square root", `${box()} cm`]], o) +
      ask(slot("Base", " cm") + slot("Height", " cm"));
  },
  worked() {
    return worked("One done for you", say(
      "2 : 3, area 48 cm². 48 × 2 = 96. 96 ÷ (2 × 3) = 16. √16 = 4 cm is one part. The base is " +
      "2 × 4 = <b>8 cm</b>, the height 3 × 4 = <b>12 cm</b>. Check: 8 × 12 ÷ 2 = 48."));
  },
  key(item) {
    const { m, n, k } = item;
    return [want.num(m * n * k * k), want.num(k * k), want.num(k), want.num(m * k), want.num(n * k)];
  },
  answer(item) {
    const { m, n, k } = item;
    return [`one part ${k} cm; base ${m * k} cm, height ${n * k} cm`];
  },
};

const arScaleGrid = {
  id: "ar-scale-grid",
  group: "ar-ratio",
  label: "Twice as long, four times the area",
  blurb: "On squares: a triangle and the same triangle made bigger. Count, compare.",
  heading: "Compare the two triangles",
  instruction: () =>
    "Triangle 2 is triangle 1 made bigger: every side the same number of times as long. Find " +
    "both areas by counting or by base × height ÷ 2. How many times as long are the sides? " +
    "How many times as big is the area?",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const k = tier(o) === "stretch" ? r.pick([2, 3]) : 2;
    const a = r.int(1, k === 3 ? 2 : 3);
    const b = r.int(1, k === 3 ? 2 : 3);
    return { a, b, k };
  },
  render(item) {
    const { a, b, k } = item;
    const t1 = [[0, 0], [a, 0], [0, b]];
    const t2 = [[a + 1, 0], [a + 1 + k * a, 0], [a + 1, k * b]];
    return art(compSvg([t1, t2], { grid: true, numbers: true, label: "A triangle and the same triangle made bigger" })) +
      ask(slot("Area of 1", " cm²") + slot("Area of 2", " cm²")) +
      ask(slot("Sides", " times as long") + slot("Area", " times as big"));
  },
  worked() {
    return worked("What you will find", say(
      "Make every side twice as long and the area is not twice as big — it is <b>4 times</b>. Four " +
      "copies of the small triangle fit inside the big one. Three times as long: 9 times the " +
      "area. The area goes up by the number times itself."));
  },
  key(item) {
    const { a, b, k } = item;
    return [want.num((a * b) / 2), want.num((k * k * a * b) / 2), want.num(k), want.num(k * k)];
  },
  answer(item) {
    const { a, b, k } = item;
    return [`${fmt((a * b) / 2)} and ${fmt((k * k * a * b) / 2)} cm² — sides × ${k}, area × ${k * k}`];
  },
};

const SCALE = [
  { id: "up", make: (P, A, k) => ({ text: `A triangle has a perimeter of ${cm(P)} and an area of ${fmt(A)} cm². Every side is made ${k} times as long. Find the new perimeter and the new area.`, v: [k * P, k * k * A], units: [" cm", " cm²"], labels: ["New perimeter", "New area"] }) },
  { id: "ratio", make: (P, A, k) => ({ text: `Two triangles are the same shape. The sides of the big one are ${k} times as long as the small one's. The small one has an area of ${fmt(A)} cm² and a perimeter of ${cm(P)}. Write the ratio of the areas, small : big, and find the big one's area and perimeter.`, v: [k * k, k * k * A, k * P], units: ["", " cm²", " cm"], labels: [`Areas 1 :`, "Big area", "Big perimeter"] }) },
  { id: "back", make: (P, A, k) => ({ text: `A triangle's area is ${fmt(A)} cm². The same shape made bigger has an area of ${fmt(k * k * A)} cm², and the small one's perimeter is ${cm(P)}. How many times as long are the sides now? What is the big perimeter?`, v: [k, k * P], units: [" times", " cm"], labels: ["Sides", "Big perimeter"] }) },
];
const dealScale = dealer();

const arScale = {
  id: "ar-scale",
  group: "ar-ratio",
  label: "Made bigger: perimeter × k, area × k²",
  blurb: "Sides × 3 means perimeter × 3 but area × 9. And backwards, from the areas.",
  heading: "Triangles made bigger",
  instruction: (o) =>
    "When every side is k times as long, the perimeter is k times as long and the area is k × k " +
    "times as big." + (tier(o) === "stretch" ? " Backwards: the areas' ratio is k × k, so its square root is k." : ""),
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    const t = tier(o);
    const list = t === "stretch" ? SCALE : SCALE.slice(0, 2);
    const form = dealScale(r, list, i);
    const K = t === "gentle" ? r.int(2, 3) : r.int(2, 5);
    const [a, b, c] = tripleOf(r, { level: "gentle" });
    return form.make(rnd(a + b + c), rnd((a * b) / 2), K);
  },
  render(item) {
    return lead(item.text) + workbox(2) + ask(item.labels.map((l, j) => slot(l, item.units[j])).join(""));
  },
  worked() {
    return worked("One done for you", say(
      "A 3, 4, 5 triangle: perimeter 12 cm, area 6 cm². Sides × 3: perimeter 12 × 3 = <b>36 cm</b>; " +
      "area 6 × 3 × 3 = <b>54 cm²</b>, not 18. A 9, 12, 15 triangle does have area 9 × 12 ÷ 2 = 54."));
  },
  key(item) {
    return item.v.map((v) => want.num(rnd(v)));
  },
  answer(item) {
    return [item.labels.map((l, j) => `${l.replace(/:$/, "")} ${fmt(item.v[j])}${item.units[j]}`).join("; ")];
  },
};

/* ═══ 5. area and perimeter with Pythagoras ════════════════════════════════*/

/* At Stretch, every other one is not a triple: the side found is a decimal. */
function legsFor(r, o, i) {
  if (tier(o) === "stretch" && i % 2 === 1) {
    for (let g = 0; g < 50; g++) {
      const a = r.int(3, 12);
      const b = r.int(3, 12);
      if (!whole(Math.hypot(a, b))) return [a, b, Math.hypot(a, b)];
    }
  }
  return tripleOf(r, o);
}

const arPyRight = {
  id: "ar-py-right",
  group: "ar-py",
  label: "The long side, then the perimeter",
  blurb: "The area only needs the two short sides; the perimeter needs the third — Pythagoras finds it.",
  heading: "Find the missing side, the perimeter and the area",
  instruction: (o) =>
    "The area needs only the two sides at the square corner. The perimeter needs all three, " +
    "so find the long one first: square, add, square root." +
    (tier(o) === "stretch" ? " One decimal place where it is not whole." : ""),
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const [a, b, c] = legsFor(r, o, i);
    return { a, b, c, turn: tier(o) === "gentle" ? 0 : r.int(0, 3) * 90, flip: r.chance(0.5) };
  },
  render(item, o) {
    const tri = turned(rightTri(item.a, item.b), item.turn, item.flip);
    return side(art(triSvg(tri, { box: FIG, labels: [cm(item.a), "x", cm(item.b)], right: 0, note: rightNote(item.a, item.b) })),
      flow([[`${fmt(item.a)}² + ${fmt(item.b)}²`, box()], ["x = square root", `${box()} cm`]], o) +
      ask(slot("Perimeter", " cm")) + ask(slot("Area", " cm²")));
  },
  worked() {
    return worked("One done for you", side(art(triSvg([[0, 0], [8, 0], [0, 6]], { box: FIG, labels: ["8 cm", "x", "6 cm"], right: 0 })),
      say("64 + 36 = 100, and √100 = 10, so x = 10 cm. Perimeter: 8 + 6 + 10 = <b>24 cm</b>. " +
        "Area: 8 × 6 ÷ 2 = <b>24 cm²</b>.")));
  },
  key(item) {
    const { a, b, c } = item;
    const P = a + b + (whole(c) ? c : r1(c));
    return [want.num(a * a + b * b), exactOr1(c), whole(c) ? want.num(P) : want.num(r1(P), 0.15), want.num(rnd((a * b) / 2))];
  },
  answer(item) {
    const { a, b, c } = item;
    return [`x = √${a * a + b * b} ${whole(c) ? "=" : "≈"} ${fmt(r1(c))} cm; perimeter ${fmt(r1(a + b + c))} cm; area ${fmt((a * b) / 2)} cm²`];
  },
};

const arPyLeg = {
  id: "ar-py-leg",
  group: "ar-py",
  label: "A short side first, then the area",
  blurb: "Long side and one short side given: no area until the other short side is found.",
  heading: "Find x, then the perimeter and the area",
  instruction: (o) =>
    "The area needs both sides at the square corner, and one is missing. Find it: long side " +
    "squared take away short side squared, then square root." +
    (tier(o) === "stretch" ? " One decimal place where it is not whole." : ""),
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    let a; let b; let c;
    if (tier(o) === "stretch" && i % 2 === 1) {
      do { c = r.int(8, 15); b = r.int(3, c - 2); a = Math.sqrt(c * c - b * b); } while (whole(a));
    } else [a, b, c] = tripleOf(r, o);
    return { a, b, c, turn: tier(o) === "gentle" ? 0 : r.int(0, 3) * 90, flip: r.chance(0.5) };
  },
  render(item, o) {
    const tri = turned(rightTri(item.a, item.b), item.turn, item.flip);
    return side(art(triSvg(tri, { box: FIG, labels: ["x", cm(item.c), cm(item.b)], right: 0, note: rightNote(item.a, item.b) })),
      flow([[`${fmt(item.c)}² − ${fmt(item.b)}²`, box()], ["x = square root", `${box()} cm`]], o) +
      ask(slot("Perimeter", " cm")) + ask(slot("Area", " cm²")));
  },
  worked() {
    return worked("One done for you", say(
      "Long side 13 cm, short side 5 cm. 169 − 25 = 144 and √144 = 12, so x = 12 cm. " +
      "Perimeter: 5 + 12 + 13 = <b>30 cm</b>. Area: 5 × 12 ÷ 2 = <b>30 cm²</b>."));
  },
  key(item) {
    const { a, b, c } = item;
    const w = whole(a);
    const A = w ? a : r1(a);
    return [want.num(rnd(c * c - b * b)), exactOr1(a),
      w ? want.num(a + b + c) : want.num(r1(a + b + c), 0.15),
      w ? want.num(rnd((a * b) / 2)) : want.num(rnd((A * b) / 2), b * 0.05 + 0.05)];
  },
  answer(item) {
    const { a, b, c } = item;
    return [`x = √${fmt(c * c - b * b)} ${whole(a) ? "=" : "≈"} ${fmt(r1(a))} cm; perimeter ${fmt(r1(a + b + c))} cm; area ${fmt(r1((a * b) / 2))} cm²`];
  },
};

const arPyIso = {
  id: "ar-py-iso",
  group: "ar-py",
  label: "Isosceles: the height splits it in two",
  blurb: "The height cuts the base in half and makes two right-angled triangles.",
  heading: "Find the height, then the area and the perimeter",
  instruction: () =>
    "The height of an isosceles triangle meets the base in the middle, so it makes two " +
    "right-angled triangles, each with half the base. Use Pythagoras on one half to find the " +
    "height; then the area.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    /* half the base and the height are the triple's two short sides */
    const [p, q, s] = tripleOf(r, o);
    return { p, q, s, flip: r.chance(0.5) };
  },
  render(item, o) {
    const { p, q, s } = item;
    const tri = [[0, 0], [2 * p, 0], [p, q]];
    const fig = triSvg(tri, { box: FIG, labels: [cm(2 * p), cm(s), null], ticks: [0, 1, 1], height: { from: 2, label: "h" } });
    return side(art(fig),
      flow([["half the base", `${box()} cm`], [`${fmt(s)}² − half²`, box()], ["h = square root", `${box()} cm`]], o) +
      ask(slot("Area", " cm²")) + ask(slot("Perimeter", " cm")));
  },
  worked() {
    return worked("One done for you", side(art(triSvg([[0, 0], [6, 0], [3, 4]], { box: FIG, labels: ["6 cm", "5 cm", null], ticks: [0, 1, 1], height: { from: 2, label: "h" } })),
      say("Half the base is 3 cm. 5² − 3² = 25 − 9 = 16, so h = 4 cm. Area: 6 × 4 ÷ 2 = " +
        "<b>12 cm²</b>. Perimeter: 5 + 5 + 6 = <b>16 cm</b> — the tick says the unlabelled side is 5 too.")));
  },
  key(item) {
    const { p, q, s } = item;
    return [want.num(p), want.num(rnd(s * s - p * p)), want.num(q), want.num(rnd(p * q)), want.num(rnd(2 * s + 2 * p))];
  },
  answer(item) {
    const { p, q, s } = item;
    return [`h = √(${fmt(s)}² − ${fmt(p)}²) = ${fmt(q)} cm; area ${fmt(p * q)} cm²; perimeter ${fmt(2 * s + 2 * p)} cm`];
  },
};

const arPyEqui = {
  id: "ar-py-equi",
  group: "ar-py",
  label: "Equilateral: a height that is never whole",
  blurb: "Split it down the middle; the height is always a decimal. One decimal place.",
  heading: "Find the height and the area of the equilateral triangle",
  instruction: () =>
    "Split the equilateral triangle down the middle: each half is right-angled, with the whole " +
    "side as its long side and half the side along the bottom. Find the height to one decimal " +
    "place, then the area.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const s = { gentle: r.pick([2, 4, 6, 8, 10]), middle: r.int(3, 14), stretch: r.int(5, 30) }[tier(o)] || 4;
    return { s };
  },
  render(item, o) {
    const { s } = item;
    const tri = fromSides(s, s, s);
    return side(art(triSvg(tri, { box: FIG, labels: [cm(s), null, null], ticks: [1, 1, 1], height: { from: 2, label: "h" } })),
      flow([[`${fmt(s)}² − ${fmt(s / 2)}²`, box()], ["h = square root", `${box()} cm`]], o) +
      ask(slot("Area", " cm²")) + ask(slot("Perimeter", " cm")));
  },
  worked() {
    return worked("One done for you", say(
      "Side 6 cm, so half the base is 3 cm. 6² − 3² = 36 − 9 = 27, and √27 = 5.196…, so h ≈ " +
      "<b>5.2 cm</b>. Area: 6 × 5.2 ÷ 2 = <b>15.6 cm²</b>. Perimeter: 3 × 6 = <b>18 cm</b>."));
  },
  key(item) {
    const { s } = item;
    const h = Math.sqrt(s * s - (s * s) / 4);
    /* the area from the height the child rounded, or from the true one */
    return [want.num(rnd(s * s - (s * s) / 4)), want.num(r1(h), 0.05), want.num(r1((s * h) / 2), (s * 0.05) / 2 + 0.1), want.num(3 * s)];
  },
  answer(item) {
    const { s } = item;
    const h = Math.sqrt(s * s - (s * s) / 4);
    return [`h = √${fmt(s * s - (s * s) / 4)} ≈ ${fmt(r1(h))} cm; area ≈ ${fmt(r1((s * h) / 2))} cm²; perimeter ${3 * s} cm`];
  },
};

/* ═══ 6. shapes made of triangles ══════════════════════════════════════════*/

/** Two triangles on one shared base: a kite, or a dart-like shape. */
function kite2(d, x1, h1, x2, h2) {
  return {
    tris: [[[0, 0], [d, 0], [x1, h1]], [[0, 0], [d, 0], [x2, -h2]]],
    heights: [{ from: [x1, h1], to: [x1, 0], along: [x1 === 0 ? d : 0, 0] }, { from: [x2, -h2], to: [x2, 0], along: [x2 === 0 ? d : 0, 0] }],
    baseEdges: [[[0, 0], [d, 0]]],
    parts: [(d * h1) / 2, (d * h2) / 2],
    bases: [d, d], hs: [h1, h2],
  };
}

/** A row of n triangles along a strip, each base b and height h, alternately
    point up and point down: a parallelogram, or a trapezium when n is odd. */
function strip(n, b, s, h) {
  const B = (i) => [i * b, 0];
  const T = (i) => [s + i * b, h];
  const tris = [];
  for (let j = 0; j < n; j++) {
    const i = j >> 1;
    tris.push(j % 2 === 0 ? [B(i), B(i + 1), T(i)] : [B(i + 1), T(i + 1), T(i)]);
  }
  const baseEdges = tris.map((t, j) => (j % 2 === 0 ? [t[0], t[1]] : [t[1], t[2]]));
  return {
    tris, heights: [{ from: T(0), to: [s, 0], along: s === 0 ? B(1) : B(0) }], baseEdges,
    parts: tris.map(() => (b * h) / 2), bases: tris.map(() => b), hs: tris.map(() => h),
  };
}

/** A shape for the composite questions, on squares (grid) or labelled. */
function composite(r, o, i, grid) {
  const t = tier(o);
  const useStrip = t === "gentle" ? false : t === "middle" ? i % 2 === 1 : i % 2 === 0;
  if (!useStrip) {
    const d = r.int(grid ? 3 : 4, grid ? 6 : 12);
    /* on paper with numbers written on it, no part thinner than a third of
       its base and no height along an edge, or the words have no room */
    const hLo = grid ? 1 : Math.max(2, Math.ceil(d / 3));
    const hHi = grid ? 4 : Math.max(hLo + 1, Math.floor(d * 0.7));
    const h1 = r.int(Math.max(2, hLo), hHi);
    const h2 = r.int(hLo, grid ? 3 : hHi);
    const x1 = grid ? r.int(0, d) : r.int(Math.ceil(d / 4), Math.floor((3 * d) / 4));
    const x2 = grid ? r.int(0, d) : r.int(Math.ceil(d / 4), Math.floor((3 * d) / 4));
    return { kind: "kite", ...kite2(d, x1, h1, x2, h2) };
  }
  const n = t === "stretch" ? r.int(3, 4) : r.int(2, 3);
  const b = r.int(2, grid ? 3 : 8);
  const h = r.int(2, grid ? 4 : 9);
  const s = r.int(0, b);
  return { kind: "strip", ...strip(n, b, s, h) };
}

const arCompGrid = {
  id: "ar-comp-grid",
  group: "ar-comp",
  label: "Parts on squares",
  blurb: "A shape made of numbered triangles on centimetre squares. Each part, then the lot.",
  heading: "Find the area of each triangle, then of the whole shape",
  instruction: () =>
    "The shape is made of triangles and nothing else. Find each one's area — count squares, or " +
    "base × height ÷ 2 with the lengths counted off the squares. The whole shape is the parts " +
    "added.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const c = composite(r, o, i, true);
    return { tris: c.tris, parts: c.parts };
  },
  render(item) {
    return side(art(compSvg(item.tris, { grid: true, numbers: true, label: "A shape made of triangles, on squares" })),
      item.parts.map((_, j) => ask(slot(`Part ${j + 1}`, " cm²"))).join("") + ask(slot("Whole shape", " cm²")));
  },
  key(item) {
    return [...item.parts.map((v) => want.num(rnd(v))), want.num(rnd(item.parts.reduce((a, b) => a + b, 0)))];
  },
  answer(item) {
    return [`${item.parts.map(fmt).join(" + ")} = ${fmt(item.parts.reduce((a, b) => a + b, 0))} cm²`];
  },
};

const arCompArea = {
  id: "ar-comp-area",
  group: "ar-comp",
  label: "Parts worked out, then added",
  blurb: "Each triangle's base and height are marked. Work each part, add the parts.",
  heading: "Find the area of the whole shape",
  instruction: () =>
    "Split the shape into its triangles — the dashed lines already do. Each triangle's area is " +
    "its base × height ÷ 2; the shape's area is them all added. Triangles in a strip all have the " +
    "same height: the gap between the two long edges.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    return composite(r, o, i, false);
  },
  render(item) {
    const lbl = {};
    item.baseEdges.forEach(([p, q]) => { lbl[edgeKey(p, q)] = cm(item.bases[0]); });
    const heights = item.heights.map((h, j) => ({ ...h, label: cm(item.hs[j]) }));
    return side(art(compSvg(item.tris, { box: WIDE, labels: lbl, heights, numbers: true, label: "A shape made of triangles" })),
      item.parts.map((_, j) => ask(slot(`Part ${j + 1}`, " cm²"))).join("") + ask(slot("Whole shape", " cm²")));
  },
  worked() {
    const c = kite2(8, 3, 5, 5, 3);
    const lbl = { [edgeKey([0, 0], [8, 0])]: "8 cm" };
    const heights = c.heights.map((h, j) => ({ ...h, label: `${c.hs[j]} cm` }));
    return worked("One done for you", side(art(compSvg(c.tris, { box: WIDE, labels: lbl, heights, numbers: true })),
      say("Both triangles stand on the same 8 cm line. Part 1: 8 × 5 ÷ 2 = 20 cm². Part 2: " +
        "8 × 3 ÷ 2 = 12 cm². The whole shape: 20 + 12 = <b>32 cm²</b>.")));
  },
  key(item) {
    return [...item.parts.map((v) => want.num(rnd(v))), want.num(rnd(item.parts.reduce((a, b) => a + b, 0)))];
  },
  answer(item) {
    return [`${item.parts.map(fmt).join(" + ")} = ${fmt(item.parts.reduce((a, b) => a + b, 0))} cm²`];
  },
};

/** Two triangles glued along a side d: sides a1, b1 above, a2, b2 below. */
function pair2(r, o) {
  const hi = tier(o) === "gentle" ? 9 : 15;
  for (let g = 0; g < 400; g++) {
    const d = r.int(4, hi);
    const [a1, b1, a2, b2] = [r.int(3, hi), r.int(3, hi), r.int(3, hi), r.int(3, hi)];
    const ok = (x, y) => x + y > d + 1.5 && Math.abs(x - y) < d - 1.5;
    if (!ok(a1, b1) || !ok(a2, b2)) continue;
    const up = fromSides(a1, b1, d);
    const dn = fromSides(a2, b2, d).map(([x, y]) => [x, -y]);
    if (up[2][1] < d * 0.3 || -dn[2][1] < d * 0.3) continue;
    return { tris: [up, dn], d, outs: [a1, b1, a2, b2] };
  }
  return null;
}

/* Four right-angled triangles round a point: a rhombus (both halves the same)
   or a kite. Half-diagonals p across; q up, u down, from shared-leg triples. */
const KITES = {
  gentle: [[4, 3, 3], [3, 4, 4], [8, 6, 6], [6, 8, 8], [12, 5, 5]],
  middle: [[12, 5, 9], [12, 5, 16], [8, 6, 15], [12, 9, 16], [4, 3, 3], [24, 7, 10]],
  stretch: [[24, 7, 18], [15, 8, 20], [12, 9, 35], [24, 10, 7], [16, 12, 30], [6, 4.5, 8]],
};
function kite4(p, q, u) {
  const O = [0, 0]; const E = [p, 0]; const N = [0, q]; const W = [-p, 0]; const S = [0, -u];
  return { tris: [[O, E, N], [O, N, W], [O, W, S], [O, S, E]], outs: [Math.hypot(p, q), Math.hypot(p, q), Math.hypot(p, u), Math.hypot(p, u)] };
}

const arCompPerim = {
  id: "ar-comp-perim",
  group: "ar-comp",
  label: "Perimeter: only the outside",
  blurb: "A dashed side is shared by two triangles — it is inside the shape, so it is not counted.",
  heading: "Find the perimeter of the whole shape",
  instruction: () =>
    "The perimeter is the way round the OUTSIDE. A dashed side is where two triangles meet: it " +
    "is inside the shape, so leave it out, however long it is. Count the outside sides, then add them.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    if (i % 2 === 0) {
      const p = pair2(r, o);
      if (p) return { kind: "pair", ...p };
    }
    const [pp, q, u] = r.pick(KITES[tier(o)] || KITES.gentle);
    return { kind: "kite", p: pp, q, u, ...kite4(pp, q, u) };
  },
  render(item) {
    const lbl = {};
    if (item.kind === "pair") {
      const [up, dn] = item.tris;
      lbl[edgeKey(up[0], up[1])] = cm(item.d);
      lbl[edgeKey(up[1], up[2])] = cm(item.outs[0]);
      lbl[edgeKey(up[2], up[0])] = cm(item.outs[1]);
      lbl[edgeKey(dn[1], dn[2])] = cm(item.outs[2]);
      lbl[edgeKey(dn[2], dn[0])] = cm(item.outs[3]);
    } else {
      const [t0, t1, t2, t3] = item.tris;
      lbl[edgeKey(t0[0], t0[1])] = cm(item.p);
      lbl[edgeKey(t0[0], t0[2])] = cm(item.q);
      lbl[edgeKey(t2[0], t2[2])] = cm(item.u);
      lbl[edgeKey(t0[1], t0[2])] = cm(item.outs[0]);
      lbl[edgeKey(t1[1], t1[2])] = cm(item.outs[1]);
      lbl[edgeKey(t2[1], t2[2])] = cm(item.outs[2]);
      lbl[edgeKey(t3[1], t3[2])] = cm(item.outs[3]);
    }
    return side(art(compSvg(item.tris, { box: WIDE, labels: lbl, label: "A shape made of triangles" })),
      ask(slot("Sides on the outside", "")) + ask(slot("Perimeter", " cm")));
  },
  worked() {
    const c = kite4(4, 3, 3);
    const k = (a, b) => edgeKey(a, b);
    const [t0, t1, t2, t3] = c.tris;
    const lbl = { [k(t0[0], t0[1])]: "4 cm", [k(t0[0], t0[2])]: "3 cm", [k(t0[1], t0[2])]: "5 cm", [k(t1[1], t1[2])]: "5 cm", [k(t2[1], t2[2])]: "5 cm", [k(t3[1], t3[2])]: "5 cm" };
    return worked("One done for you", side(art(compSvg(c.tris, { box: WIDE, labels: lbl })),
      say("Four triangles, but only four sides on the outside, each 5 cm: 4 × 5 = <b>20 cm</b>. The " +
        "dashed 3 cm and 4 cm lines are inside the shape, so they are not in the perimeter.")));
  },
  key(item) {
    return [want.num(4), want.num(rnd(item.outs.reduce((a, b) => a + b, 0)))];
  },
  answer(item) {
    return [`4 outside sides: ${item.outs.map((v) => fmt(v)).join(" + ")} = ${cm(item.outs.reduce((a, b) => a + b, 0))}`];
  },
};

const arCompKite = {
  id: "ar-comp-kite",
  group: "ar-comp",
  label: "Kites and rhombuses: Pythagoras for the outside",
  blurb: "Only the inside lines are given. Pythagoras finds the outside ones.",
  heading: "Find the outside sides, the perimeter and the area",
  instruction: () =>
    "Four right-angled triangles meet in the middle. Only the dashed inside lines are measured. " +
    "Each outside side is the long side of one of the triangles: find it with Pythagoras. The " +
    "area is the four triangles added.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const [p, q, u] = r.pick(KITES[tier(o)] || KITES.gentle);
    return { p, q, u, flip: r.chance(0.5) };
  },
  render(item) {
    const { p, q, u } = item;
    const c = kite4(p, q, u);
    const [t0, , t2] = c.tris;
    const lbl = {
      [edgeKey(t0[0], t0[1])]: cm(p),
      [edgeKey(t0[0], t0[2])]: cm(q),
      [edgeKey(t2[0], t2[2])]: cm(u),
      [edgeKey(t0[1], t0[2])]: "x",
      [edgeKey(t2[1], t2[2])]: "y",
    };
    const tris = item.flip ? c.tris.map((t) => t.map(([x, y]) => [x, -y])) : c.tris;
    return side(art(compSvg(tris, { box: WIDE, labels: item.flip ? {
      [edgeKey([0, 0], [p, 0])]: cm(p), [edgeKey([0, 0], [0, -q])]: cm(q), [edgeKey([0, 0], [0, u])]: cm(u),
      [edgeKey([p, 0], [0, -q])]: "x", [edgeKey([-p, 0], [0, u])]: "y",
    } : lbl, label: "A kite made of four right-angled triangles" })),
      ask(slot("x", " cm") + slot("y", " cm")) + ask(slot("Perimeter", " cm")) + ask(slot("Area", " cm²")));
  },
  worked() {
    return worked("One done for you", say(
      "Across the middle 12 cm each way, 5 cm up and 9 cm down. x² = 12² + 5² = 169, x = 13 cm; " +
      "y² = 12² + 9² = 225, y = 15 cm. Perimeter: 13 + 13 + 15 + 15 = <b>56 cm</b>. Area: two " +
      "triangles 12 × 5 ÷ 2 = 30 and two 12 × 9 ÷ 2 = 54, so 60 + 108 = <b>168 cm²</b>."));
  },
  key(item) {
    const { p, q, u } = item;
    const x = Math.hypot(p, q);
    const y = Math.hypot(p, u);
    return [exactOr1(x), exactOr1(y), want.num(rnd(2 * x + 2 * y), 0.2), want.num(rnd(p * q + p * u))];
  },
  answer(item) {
    const { p, q, u } = item;
    const x = Math.hypot(p, q);
    const y = Math.hypot(p, u);
    return [`x = ${fmt(r1(x))} cm, y = ${fmt(r1(y))} cm; perimeter ${fmt(r1(2 * x + 2 * y))} cm; area ${fmt(p * q + p * u)} cm²`];
  },
};

const H3 = Math.sqrt(3) / 2;
/** n equilateral triangles in a row, or four / nine making a bigger one. */
function equiShape(form, s) {
  if (form === "big4" || form === "big9") {
    const m = form === "big4" ? 2 : 3;
    const P = (i, j) => [s * (i + j / 2), s * j * H3];
    const tris = [];
    for (let j = 0; j < m; j++) {
      for (let i = 0; i < m - j; i++) {
        tris.push([P(i, j), P(i + 1, j), P(i, j + 1)]);
        if (i < m - j - 1) tris.push([P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)]);
      }
    }
    return { tris, n: m * m, outside: 3 * m };
  }
  const n = { row2: 2, row3: 3, row4: 4 }[form];
  const st = strip(n, s, s / 2, s * H3);
  return { tris: st.tris, n, outside: n + 2 };
}
const EQUI_FORMS = { gentle: ["row2", "row3"], middle: ["row2", "row3", "row4", "big4"], stretch: ["row3", "row4", "big4", "big9"] };
const dealEqui = dealer();

const arCompEqui = {
  id: "ar-comp-equi",
  group: "ar-comp",
  label: "Made of equal triangles",
  blurb: "Same-size equilateral triangles: count the outside sides, count the triangles.",
  heading: "Shapes made of equilateral triangles",
  instruction: (o) =>
    "Every triangle is equilateral and the same size. The perimeter is the number of small sides " +
    "on the OUTSIDE × one side; the area is the number of triangles × one triangle's area." +
    (tier(o) === "stretch" ? " No picture from here on: sketch it." : ""),
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    const form = dealEqui(r, EQUI_FORMS[tier(o)] || EQUI_FORMS.gentle, i);
    const s = { gentle: r.int(2, 6), middle: r.int(3, 12), stretch: r.int(4, 20) }[tier(o)] || 4;
    /* the small triangle's real area, to one place — the side decides it */
    const A = r1((s * s * Math.sqrt(3)) / 4);
    return { form, s, A, pic: tier(o) !== "stretch" || i === 0 };
  },
  render(item) {
    const sh = equiShape(item.form, item.s);
    const words = {
      row2: "two", row3: "three", row4: "four",
      big4: "four", big9: "nine",
    }[item.form];
    const what = item.form.startsWith("big")
      ? `${words} equal equilateral triangles fitted together into one big triangle`
      : `${words} equal equilateral triangles in a row, each one turned to fit the last`;
    const text = `A shape is made of ${what}. Each small triangle has sides of ${cm(item.s)} and an area of ${fmt(item.A)} cm².`;
    const words2 = ask(slot("Sides on the outside", "")) + ask(slot("Perimeter", " cm")) + ask(slot("Area", " cm²"));
    return lead(text) + (item.pic ? side(art(compSvg(sh.tris, { box: { w: 70, h: 44 }, tint: false, label: "A shape made of equilateral triangles" })), words2) : workbox(2) + words2);
  },
  key(item) {
    const sh = equiShape(item.form, item.s);
    return [want.num(sh.outside), want.num(sh.outside * item.s), want.num(rnd(sh.n * item.A))];
  },
  answer(item) {
    const sh = equiShape(item.form, item.s);
    return [`${sh.outside} outside sides: ${sh.outside} × ${item.s} = ${sh.outside * item.s} cm; ${sh.n} triangles: ${sh.n} × ${fmt(item.A)} = ${fmt(sh.n * item.A)} cm²`];
  },
};

export const AR_EXERCISES = [
  arKindMeasure, arKindMarks, arKindNumbers,
  arPerMeasure, arPerAdd, arPerRule,
  arCount, arHalfRect, arHalfBh, arRightArea, arReverse,
  arScaleGrid, arRatioSides, arRatioBh, arScale,
  arPyRight, arPyLeg, arPyIso, arPyEqui,
  arCompGrid, arCompArea, arCompPerim, arCompKite, arCompEqui,
];
