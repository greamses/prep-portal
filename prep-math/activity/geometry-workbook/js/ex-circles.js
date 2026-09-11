/* ============================================================================
   Geometry Workbook — CHAPTER 6: circle theorems
   ----------------------------------------------------------------------------
   What the theorems stand on, then one theorem at a time, then reasons:

     parts of a circle         radius, diameter, chord, tangent, arc, sector,
                               segment, circumference; radius = half diameter
     radii and isosceles       two radii make an isosceles triangle — the tool
                               inside half of every circle proof
     the angle at the centre   found with a protractor first, then used
     the angle in a semicircle
     angles in the same segment
     cyclic quadrilaterals     opposite angles; the exterior angle
     tangents                  tangent ⊥ radius; two tangents from a point;
                               a tangent's length by Pythagoras
     chords                    the perpendicular from the centre halves a
                               chord — Pythagoras again
     the alternate segment theorem
     give the reason           name the theorem; two steps, a reason each

   In an exam the reason is marked as well as the angle, so from the angle at
   the centre on, questions ask which theorem was used, from three that could
   plausibly be meant.

   Every figure is accurate (circle.js), so every angle can also be checked
   with a protractor. Angles are whole tens at Gentle, fives at Middle, any
   whole degree at Stretch — the levels.js step, as in chapter 1.
   ========================================================================== */

import { circleSvg, on, alongTangent, angleAt } from "./circle.js";
import { levelOf, helpOf, stepped, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const small = () => `<span class="wb-answer gw-num"></span>`;
const slot = (label, unit = "") => `<span class="wb-slot"><em>${label}</em>${box()}${unit}</span>`;
const deg = (label) => slot(label, "°");
const art = (svg) => `<div class="gw-art">${svg}</div>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const side = (figure, words) => `<div class="gw-side">${figure}<div class="gw-lines">${words}</div></div>`;
const worked = (tag, body) => `<div class="wb-worked"><p class="wb-worked__tag">${tag}</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const line = () => `<span class="wb-line wb-line--md"></span>`;

const tier = (o) => levelOf(o).id;
const FIG = { w: 60, h: 56 };

/* ── the reasons ───────────────────────────────────────────────────────────*/

const R = {
  centre: "the angle at the centre is twice the angle at the circumference",
  semi: "the angle in a semicircle is 90°",
  same: "angles in the same segment are equal",
  cyclic: "opposite angles of a cyclic quadrilateral add up to 180°",
  exterior: "the exterior angle of a cyclic quadrilateral equals the interior opposite angle",
  tangent: "a tangent meets the radius at 90°",
  twoTan: "the two tangents from a point are equal",
  alt: "the alternate segment theorem",
  iso: "two radii make an isosceles triangle",
};
/** The right reason and two others, in a shuffled row of tick boxes. */
function reasonsFor(r, right) {
  const others = r.shuffle(Object.keys(R).filter((k) => k !== right)).slice(0, 2);
  return r.shuffle([right, ...others]);
}
/* sentences, one to a line, that wrap inside their own column */
const reasonTick = (keys) =>
  `<span class="wb-tick gw-reasons">${keys.map((k) => `<span class="wb-tick__one"><span class="wb-box"></span><span>${R[k]}</span></span>`).join("")}</span>`;

/** A place round the circle to start from: the classic view at Gentle, any
    way round above it. */
const turnOf = (r, o, classic) => (tier(o) === "gentle" ? classic : classic + r.pick([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]));

/* ── the groups ────────────────────────────────────────────────────────────*/

export const CI_GROUPS = [
  { id: "ci-parts", chapter: "Chapter 6 · Circle theorems", label: "Parts of a circle" },
  { id: "ci-iso", label: "Radii and isosceles triangles" },
  { id: "ci-centre", label: "The angle at the centre" },
  { id: "ci-semi", label: "The angle in a semicircle" },
  { id: "ci-same", label: "Angles in the same segment" },
  { id: "ci-cyclic", label: "Cyclic quadrilaterals" },
  { id: "ci-tangent", label: "Tangents" },
  { id: "ci-chord", label: "Chords and the centre" },
  { id: "ci-alt", label: "The alternate segment theorem" },
  { id: "ci-reason", label: "Give the reason" },
];

/* ═══ parts of a circle ════════════════════════════════════════════════════*/

const PARTS = {
  radius: { says: "a line from the centre to the edge" },
  diameter: { says: "a line through the centre, edge to edge" },
  chord: { says: "a line from edge to edge, not through the centre" },
  tangent: { says: "a line touching the circle at one point" },
  arc: { says: "part of the curved edge" },
  sector: { says: "a slice between two radii, like a slice of cake" },
  segment: { says: "the part cut off by a chord" },
  circumference: { says: "the whole way round the edge" },
};
const PART_NAMES = Object.keys(PARTS);

function partFigure(part, t, spread) {
  const P = { O: [0, 0] };
  const hi = { col: "#c0453f", w: 1.3 };
  const opts = { P, segs: [], box: { w: 44, h: 42 } };
  if (part === "radius") { P.A = on(t); opts.segs.push({ a: "O", b: "A", ...hi }); }
  if (part === "diameter") { P.A = on(t); P.B = on(t + 180); opts.segs.push({ a: "A", b: "B", ...hi }); }
  if (part === "chord") { P.A = on(t); P.B = on(t + spread); opts.segs.push({ a: "A", b: "B", ...hi }); }
  if (part === "tangent") { P.A = on(t); P._1 = alongTangent(t, -0.9); P._2 = alongTangent(t, 0.9); opts.segs.push({ a: "_1", b: "_2", ...hi }); }
  if (part === "arc") { P.A = on(t); P.B = on(t + 100); opts.arc = ["A", "B"]; }
  if (part === "sector") { P.A = on(t); P.B = on(t + 80); opts.sector = ["A", "B"]; opts.segs.push(["O", "A"], ["O", "B"]); }
  if (part === "segment") { P.A = on(t); P.B = on(t + 120); opts.segment = ["A", "B"]; opts.segs.push(["A", "B"]); }
  if (part === "circumference") { opts.ring = true; }
  return circleSvg(opts);
}

const dealPart = dealer();
const ciName = {
  id: "ci-name",
  group: "ci-parts",
  label: "Name the part",
  blurb: "Radius, diameter, chord, tangent, arc, sector, segment, circumference.",
  heading: "What is the red part called?",
  instruction: () =>
    "The words: a RADIUS goes from the centre O to the edge; a DIAMETER goes right across through " +
    "the centre; a CHORD goes from edge to edge but misses the centre; a TANGENT touches the circle " +
    "at one point only. An ARC is part of the curved edge; a SECTOR is a slice between two radii; a " +
    "SEGMENT is the piece a chord cuts off; the CIRCUMFERENCE is the whole way round.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const part = dealPart(r, PART_NAMES, i);
    const opts = r.shuffle([part, ...r.shuffle(PART_NAMES.filter((p) => p !== part)).slice(0, 3)]);
    return { part, opts, t: r.int(0, 11) * 30 + 15, spread: r.pick([70, 100, 120]) };
  },
  render(item) {
    return side(art(partFigure(item.part, item.t, item.spread)), tick(...item.opts));
  },
  key(item) {
    return [want.tick(item.opts.indexOf(item.part))];
  },
  answer(item) {
    return [`${item.part} — ${PARTS[item.part].says}`];
  },
};

const ciRD = {
  id: "ci-rd",
  group: "ci-parts",
  label: "Radius and diameter",
  blurb: "A diameter is two radii end to end.",
  heading: "Radius and diameter",
  instruction: () =>
    "A diameter is two radii end to end, through the centre. So the diameter is twice the radius, " +
    "and the radius is half the diameter. Every radius of a circle is the same length.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const most = { gentle: 12, middle: 30, stretch: 60 }[tier(o)] || 12;
    return { r1: r.int(2, most), d2: 2 * r.int(2, most) };
  },
  render(item) {
    return ask(`Radius ${item.r1} cm, so the diameter is ${box()} cm.`) +
      ask(`Diameter ${item.d2} cm, so the radius is ${box()} cm.`);
  },
  key(item) {
    return [want.num(2 * item.r1), want.num(item.d2 / 2)];
  },
  answer(item) {
    return [`diameter ${2 * item.r1} cm; radius ${item.d2 / 2} cm`];
  },
};

/* ═══ radii and isosceles triangles ════════════════════════════════════════*/

const ciIso = {
  id: "ci-iso",
  group: "ci-iso",
  label: "Two radii, an isosceles triangle",
  blurb: "OA = OB, so the angles at A and B are equal.",
  heading: "Find the angles in the triangle OAB",
  instruction: () =>
    "OA and OB are both radii, so they are the same length: triangle OAB is ISOSCELES, and its " +
    "two angles at A and B are equal. The three angles add up to 180°. This is used again and " +
    "again in circle questions — look for two radii.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const atO = 2 * stepped(r, o, 15, 70);
    const t = turnOf(r, o, 270);
    const givenO = r.chance(0.5);
    return { atO, t, givenO };
  },
  render(item) {
    const base = (180 - item.atO) / 2;
    const P = { O: [0, 0], A: on(item.t - item.atO / 2), B: on(item.t + item.atO / 2) };
    const angles = item.givenO
      ? [{ at: "O", from: "A", to: "B", label: `${item.atO}°` }, { at: "A", from: "O", to: "B", label: "x" }]
      : [{ at: "A", from: "O", to: "B", label: `${base}°` }, { at: "O", from: "A", to: "B", label: "x" }];
    return side(art(circleSvg({ P, segs: [["O", "A"], ["O", "B"], ["A", "B"]], ticks: [["O", "A"], ["O", "B"]], angles, box: FIG })),
      ask(deg("x =")));
  },
  worked() {
    return worked("One done for you", say(
      "The angle at O is 100°. The other two are equal (OA and OB are radii) and share 180 − 100 = 80°, " +
      "so each is <b>40°</b>."));
  },
  key(item) {
    return [want.num(item.givenO ? (180 - item.atO) / 2 : item.atO)];
  },
  answer(item) {
    return [item.givenO ? `x = (180 − ${item.atO}) ÷ 2 = ${(180 - item.atO) / 2}°` : `x = 180 − 2 × ${(180 - item.atO) / 2} = ${item.atO}°`];
  },
};

/* ═══ the angle at the centre ══════════════════════════════════════════════*/

/** Arc AB seen from the centre O and from C on the far side of the circle. */
function centreFigure(r, o, x) {
  const t = turnOf(r, o, 270);
  const c = t + 180 + r.int(-(150 - x) / 3, (150 - x) / 3);
  return { t, c, P: { O: [0, 0], A: on(t - x), B: on(t + x), C: on(c) } };
}

const ciMeasure = {
  id: "ci-measure",
  group: "ci-centre",
  label: "Measure it: centre and edge",
  blurb: "The same arc, seen from the centre and from the edge. Measure both. Notice anything?",
  heading: "Measure the two angles",
  instruction: () =>
    "Both angles look at the same arc AB: one from the centre O, one from C on the edge (the " +
    "circumference). Measure both with a protractor, centre dot on the corner, baseline along one " +
    "line. Then compare them.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const x = stepped(r, o, 25, 70);
    return { x, ...centreFigure(r, o, x) };
  },
  render(item) {
    const angles = [{ at: "O", from: "A", to: "B", label: "" }, { at: "C", from: "A", to: "B", label: "" }];
    return side(art(circleSvg({ P: item.P, segs: [["O", "A"], ["O", "B"], ["C", "A"], ["C", "B"]], angles, box: FIG })),
      ask(deg("at O")) + ask(deg("at C")) + ask("The angle at O is") + tick("the same", "double", "half"));
  },
  worked() {
    return worked("What you will find", say(
      "However the points are placed, the angle at the centre comes out <b>twice</b> the angle at the " +
      "edge. Draw the line CO and carry it on: it splits the picture into two isosceles triangles " +
      "(two radii each), and that is why."));
  },
  key(item) {
    return [want.num(2 * item.x, 2), want.num(item.x, 2), want.tick(1)];
  },
  answer(item) {
    return [`about ${2 * item.x}° and ${item.x}° — the angle at the centre is double`];
  },
};

const ciCentre = {
  id: "ci-centre-find",
  group: "ci-centre",
  label: "Twice the angle at the circumference",
  blurb: "Centre angle = 2 × edge angle, when both look at the same arc.",
  heading: "Find x, and give the reason",
  instruction: () =>
    "When two angles look at the same arc — one from the centre, one from the circumference — the " +
    "angle at the centre is TWICE the angle at the circumference. Halve it to go one way, double " +
    "it to go the other. Then tick the reason.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const x = stepped(r, o, 20, 75);
    return { x, givenCentre: r.chance(0.5), reasons: reasonsFor(r, "centre"), ...centreFigure(r, o, x) };
  },
  render(item) {
    const angles = item.givenCentre
      ? [{ at: "O", from: "A", to: "B", label: `${2 * item.x}°` }, { at: "C", from: "A", to: "B", label: "x" }]
      : [{ at: "C", from: "A", to: "B", label: `${item.x}°` }, { at: "O", from: "A", to: "B", label: "x" }];
    return side(art(circleSvg({ P: item.P, segs: [["O", "A"], ["O", "B"], ["C", "A"], ["C", "B"]], angles, box: FIG })),
      ask(deg("x =")) + reasonTick(item.reasons));
  },
  worked() {
    return worked("One done for you", say(
      "The angle at the centre is 130°, looking at arc AB. The angle at C looks at the same arc, so it " +
      "is half: x = <b>65°</b> — the angle at the centre is twice the angle at the circumference."));
  },
  key(item) {
    return [want.num(item.givenCentre ? item.x : 2 * item.x), want.tick(item.reasons.indexOf("centre"))];
  },
  answer(item) {
    return [`x = ${item.givenCentre ? item.x : 2 * item.x}° — ${R.centre}`];
  },
};

/* ═══ the angle in a semicircle ════════════════════════════════════════════*/

const ciSemi = {
  id: "ci-semi",
  group: "ci-semi",
  label: "The angle in a semicircle",
  blurb: "AB is a diameter, so the angle at C is 90°. Then the triangle does the rest.",
  heading: "AB is a diameter. Find the angles.",
  instruction: () =>
    "When AB is a diameter, the angle at any point C on the circle, looking at AB, is exactly 90° " +
    "(the centre angle is 180°, a straight line, and half of it is 90°). Then use the triangle: the " +
    "three angles add up to 180°.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const a = stepped(r, o, 20, 70);
    const t = turnOf(r, o, 0);
    return { a, t };
  },
  render(item) {
    const P = { O: [0, 0], A: on(item.t + 180), B: on(item.t), C: on(item.t + 2 * item.a) };
    const angles = [{ at: "A", from: "B", to: "C", label: `${item.a}°` }, { at: "B", from: "A", to: "C", label: "x" }, { at: "C", from: "A", to: "B", label: "y", right: false, col: "#2f6ea8" }];
    return side(art(circleSvg({ P, segs: [["A", "B"], ["A", "C"], ["C", "B"]], angles, box: FIG })),
      ask(deg("y =")) + ask(deg("x =")));
  },
  worked() {
    return worked("One done for you", say(
      "AB goes through O, so it is a diameter and the angle at C is <b>90°</b>. With 30° at A, the " +
      "angle at B is 180 − 90 − 30 = <b>60°</b>."));
  },
  key(item) {
    return [want.num(90), want.num(90 - item.a)];
  },
  answer(item) {
    return [`y = 90° (angle in a semicircle); x = 180 − 90 − ${item.a} = ${90 - item.a}°`];
  },
};

/* ═══ angles in the same segment ═══════════════════════════════════════════*/

const ciSame = {
  id: "ci-same",
  group: "ci-same",
  label: "Angles in the same segment",
  blurb: "Two angles standing on the same chord, on the same side: equal.",
  heading: "Find x, and give the reason",
  instruction: () =>
    "C and D are on the same side of the chord AB (in the same SEGMENT), and both angles look at " +
    "AB. Angles in the same segment are EQUAL — both are half the angle AB makes at the centre.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const x = stepped(r, o, 20, 70);
    const t = turnOf(r, o, 270);
    const room = 180 - x - 20;
    let c = t + 180 - r.int(Math.round(room / 4), Math.round((room * 3) / 4));
    let d = t + 180 + r.int(Math.round(room / 4), Math.round((room * 3) / 4));
    if (r.chance(0.5)) [c, d] = [d, c];
    return { x, t, c, d, reasons: reasonsFor(r, "same") };
  },
  render(item) {
    const P = { A: on(item.t - item.x), B: on(item.t + item.x), C: on(item.c), D: on(item.d) };
    const angles = [{ at: "C", from: "A", to: "B", label: `${item.x}°` }, { at: "D", from: "A", to: "B", label: "x" }];
    return side(art(circleSvg({ P, segs: [["A", "B"], ["C", "A"], ["C", "B"], ["D", "A"], ["D", "B"]], angles, box: FIG, hideO: true })),
      ask(deg("x =")) + reasonTick(item.reasons));
  },
  key(item) {
    return [want.num(item.x), want.tick(item.reasons.indexOf("same"))];
  },
  answer(item) {
    return [`x = ${item.x}° — ${R.same}`];
  },
};

/* ═══ cyclic quadrilaterals ════════════════════════════════════════════════*/

/** Four points round the circle whose angles are whole steps: the angle at
    each corner is half the two arcs it does not touch. */
function cyclicQuad(r, o) {
  const s = levelOf(o).step;
  for (let g = 0; g < 200; g++) {
    const A = stepped(r, o, 60, 130);
    const B = stepped(r, o, 60, 130);
    const a3 = 2 * s * r.int(Math.ceil(35 / (2 * s)), Math.floor((Math.min(2 * A, 2 * B) - 35) / (2 * s)));
    const a2 = 2 * A - a3;
    const a4 = 2 * B - a3;
    const a1 = 360 - a2 - a3 - a4;
    if ([a1, a2, a3, a4].every((v) => v >= 35)) {
      const t = r.int(0, 11) * 30;
      return { A, B, pts: [t, t + a1, t + a1 + a2, t + a1 + a2 + a3] };
    }
  }
  return { A: 100, B: 80, pts: [0, 100, 180, 280] };
}

const ciCyclic = {
  id: "ci-cyclic",
  group: "ci-cyclic",
  label: "Opposite angles add up to 180°",
  blurb: "All four corners on the circle: each pair of opposite angles makes 180°.",
  heading: "ABCD is a cyclic quadrilateral. Find x and y.",
  instruction: () =>
    "A CYCLIC quadrilateral has all four corners on a circle. Its OPPOSITE angles add up to 180°: " +
    "A + C = 180° and B + D = 180°. (Angles next to each other do not have to.)",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return cyclicQuad(r, o);
  },
  render(item) {
    const [a, b, c, d] = item.pts.map(on);
    const P = { A: a, B: b, C: c, D: d };
    const angles = [
      { at: "A", from: "D", to: "B", label: `${item.A}°` }, { at: "B", from: "A", to: "C", label: `${item.B}°` },
      { at: "C", from: "B", to: "D", label: "x" }, { at: "D", from: "C", to: "A", label: "y" },
    ];
    return side(art(circleSvg({ P, segs: [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"]], angles, box: FIG, hideO: true })),
      ask(deg("x =")) + ask(deg("y =")));
  },
  worked() {
    return worked("One done for you", say(
      "The angle at A is 95°; C is opposite A, so x = 180 − 95 = <b>85°</b>. B is 110°; D is opposite " +
      "B, so y = 180 − 110 = <b>70°</b>. Check: 95 + 110 + 85 + 70 = 360, as any quadrilateral must."));
  },
  key(item) {
    return [want.num(180 - item.A), want.num(180 - item.B)];
  },
  answer(item) {
    return [`x = 180 − ${item.A} = ${180 - item.A}°, y = 180 − ${item.B} = ${180 - item.B}°`];
  },
};

const ciExterior = {
  id: "ci-exterior",
  group: "ci-cyclic",
  label: "The exterior angle",
  blurb: "Carry a side on: the outside angle equals the inside angle opposite.",
  heading: "Find the exterior angle x",
  instruction: () =>
    "One side has been carried on past a corner. The angle outside that corner and the one inside " +
    "it make 180°; the inside one and its opposite make 180° too. So the EXTERIOR angle equals the " +
    "INTERIOR OPPOSITE angle.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return { ...cyclicQuad(r, o), reasons: reasonsFor(r, "exterior") };
  },
  render(item) {
    const [a, b, c, d] = item.pts.map(on);
    /* carry AB on past B to E */
    const e = [b[0] + (b[0] - a[0]) * 0.55, b[1] + (b[1] - a[1]) * 0.55];
    const P = { A: a, B: b, C: c, D: d, E: e };
    const angles = [{ at: "D", from: "C", to: "A", label: `${180 - item.B}°` }, { at: "B", from: "E", to: "C", label: "x" }];
    return side(art(circleSvg({ P, segs: [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"], { a: "B", b: "E", dash: "1.8 1.2" }], angles, box: FIG, hideO: true })),
      ask(deg("x =")) + reasonTick(item.reasons));
  },
  key(item) {
    return [want.num(180 - item.B), want.tick(item.reasons.indexOf("exterior"))];
  },
  answer(item) {
    return [`x = ${180 - item.B}° — equal to the interior opposite angle at D`];
  },
};

/* ═══ tangents ═════════════════════════════════════════════════════════════*/

const ciTanRadius = {
  id: "ci-tan-radius",
  group: "ci-tangent",
  label: "Tangent and radius",
  blurb: "Where a tangent touches, it is at right angles to the radius.",
  heading: "PT is a tangent at T. Find the angles.",
  instruction: () =>
    "A TANGENT touches the circle at one point, T, and there it is at right angles to the radius " +
    "OT: the angle OTP is 90°. Then the triangle OTP has 180° in it.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const a = stepped(r, o, 30, 60);
    const t = turnOf(r, o, 270);
    const sgn = r.chance(0.5) ? 1 : -1;
    return { a, t, sgn, reasons: reasonsFor(r, "tangent") };
  },
  render(item) {
    const p = alongTangent(item.t, item.sgn * Math.tan((item.a * Math.PI) / 180));
    const P = { O: [0, 0], T: on(item.t), P: p, _e: alongTangent(item.t, -item.sgn * 0.8) };
    const angles = [{ at: "O", from: "T", to: "P", label: `${item.a}°` }, { at: "P", from: "O", to: "T", label: "x" }, { at: "T", from: "O", to: "P", label: "y", right: false, col: "#2f6ea8" }];
    return side(art(circleSvg({ P, segs: [["O", "T"], ["O", "P"], ["_e", "P"]], angles, box: FIG })),
      ask(deg("y =")) + ask(deg("x =")) + reasonTick(item.reasons));
  },
  key(item) {
    return [want.num(90), want.num(90 - item.a), want.tick(item.reasons.indexOf("tangent"))];
  },
  answer(item) {
    return [`y = 90° (tangent ⊥ radius); x = 180 − 90 − ${item.a} = ${90 - item.a}°`];
  },
};

const ciTwoTan = {
  id: "ci-two-tan",
  group: "ci-tangent",
  label: "Two tangents from a point",
  blurb: "PA = PB, and each meets its radius at 90°.",
  heading: "PA and PB are tangents. Find x and y.",
  instruction: () =>
    "From a point P outside a circle there are two tangents, PA and PB, and they are the SAME " +
    "LENGTH — so triangle PAB is isosceles. Each tangent meets its radius at 90°, so OAPB has two " +
    "right angles and the angle at O is 180° minus the angle at P.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const p = 2 * stepped(r, o, 20, 50);
    const phi = turnOf(r, o, 0);
    return { p, phi };
  },
  render(item) {
    const half = 90 - item.p / 2;
    const d = 1 / Math.sin((item.p / 2) * Math.PI / 180);
    const P = { O: [0, 0], A: on(item.phi + half), B: on(item.phi - half), P: [d * Math.cos(item.phi * Math.PI / 180), d * Math.sin(item.phi * Math.PI / 180)] };
    const angles = [
      { at: "P", from: "A", to: "B", label: `${item.p}°` }, { at: "A", from: "P", to: "B", label: "x" },
      { at: "O", from: "A", to: "B", label: "y" }, { at: "A", from: "O", to: "P", right: true, col: "#2f6ea8" }, { at: "B", from: "O", to: "P", right: true, col: "#2f6ea8" },
    ];
    return side(art(circleSvg({ P, segs: [["P", "A"], ["P", "B"], ["O", "A"], ["O", "B"], ["A", "B"]], ticks: [["P", "A"], ["P", "B"]], angles, box: FIG })),
      ask(deg("x =")) + ask(deg("y =")));
  },
  worked() {
    return worked("One done for you", say(
      "The angle at P is 50°. PA = PB, so the angles at A and B in triangle PAB are equal: " +
      "(180 − 50) ÷ 2 = <b>65°</b>. In OAPB, the two right angles take 180°, so O is 360 − 180 − 50 = " +
      "<b>130°</b>."));
  },
  key(item) {
    return [want.num((180 - item.p) / 2), want.num(180 - item.p)];
  },
  answer(item) {
    return [`x = (180 − ${item.p}) ÷ 2 = ${(180 - item.p) / 2}°; y = 180 − ${item.p} = ${180 - item.p}°`];
  },
};

const TRIPLES = { gentle: [[3, 4, 5], [6, 8, 10]], middle: [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]], stretch: [[5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 12, 15], [12, 16, 20]] };
const tripleOf = (r, o) => r.pick(TRIPLES[tier(o)] || TRIPLES.gentle);

const ciTanLength = {
  id: "ci-tan-length",
  group: "ci-tangent",
  label: "A tangent's length",
  blurb: "Radius, tangent and the line to the centre make a right-angled triangle.",
  heading: "PT is a tangent. Find the length.",
  instruction: () =>
    "The radius OT and the tangent PT meet at 90°, so OTP is a right-angled triangle and OP — " +
    "opposite the right angle — is its hypotenuse. Use Pythagoras (chapter 4): OP² = OT² + PT².",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [a, b, c] = tripleOf(r, o);
    const [rad0, tan0] = r.chance(0.5) ? [a, b] : [b, a];
    return { rad: rad0, tan: tan0, hyp: c, ask: r.pick(["tan", "hyp"]), t: turnOf(r, o, 270), sgn: r.chance(0.5) ? 1 : -1 };
  },
  render(item) {
    const p = alongTangent(item.t, item.sgn * (item.tan / item.rad));
    const P = { O: [0, 0], T: on(item.t), P: p };
    const lens = [{ a: "O", b: "T", text: `${item.rad} cm` }, item.ask === "tan" ? { a: "O", b: "P", text: `${item.hyp} cm` } : { a: "T", b: "P", text: `${item.tan} cm` }];
    return side(art(circleSvg({ P, segs: [["O", "T"], ["O", "P"], ["T", "P"]], angles: [{ at: "T", from: "O", to: "P", right: true, col: "#2f6ea8" }], lens, box: FIG })),
      ask(slot(item.ask === "tan" ? "PT =" : "OP =", " cm")));
  },
  key(item) {
    return [want.num(item.ask === "tan" ? item.tan : item.hyp)];
  },
  answer(item) {
    return item.ask === "tan"
      ? [`PT² = ${item.hyp}² − ${item.rad}² = ${item.tan * item.tan}, so PT = ${item.tan} cm`]
      : [`OP² = ${item.rad}² + ${item.tan}² = ${item.hyp * item.hyp}, so OP = ${item.hyp} cm`];
  },
};

/* ═══ chords ═══════════════════════════════════════════════════════════════*/

const ciChord = {
  id: "ci-chord",
  group: "ci-chord",
  label: "The perpendicular halves the chord",
  blurb: "From the centre, at right angles to a chord: it cuts the chord in half.",
  heading: "OM is at right angles to the chord AB. Find the length.",
  instruction: () =>
    "A line from the centre O at right angles to a chord cuts the chord exactly IN HALF, at M. That " +
    "makes a right-angled triangle OMA with the radius OA as its hypotenuse — Pythagoras again.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [a, b, c] = tripleOf(r, o);
    const [half, dist] = r.chance(0.5) ? [a, b] : [b, a];
    return { half, dist, rad: c, ask: r.pick(["chord", "dist", "rad"]), t: turnOf(r, o, 270) };
  },
  render(item) {
    const m = [item.dist / item.rad * Math.cos(item.t * Math.PI / 180), item.dist / item.rad * Math.sin(item.t * Math.PI / 180)];
    const u = [-Math.sin(item.t * Math.PI / 180), Math.cos(item.t * Math.PI / 180)];
    const h = item.half / item.rad;
    const P = { O: [0, 0], M: m, A: [m[0] - u[0] * h, m[1] - u[1] * h], B: [m[0] + u[0] * h, m[1] + u[1] * h] };
    const lens = [];
    /* a quarter of the way along, so it is clear of the letter M in the middle */
    if (item.ask !== "chord") lens.push({ a: "A", b: "B", text: `${2 * item.half} cm`, at: 0.22 });
    if (item.ask !== "dist") lens.push({ a: "O", b: "M", text: `${item.dist} cm` });
    if (item.ask !== "rad") lens.push({ a: "O", b: "A", text: `${item.rad} cm` });
    const q = { chord: "AB =", dist: "OM =", rad: "the radius =" }[item.ask];
    return side(art(circleSvg({ P, segs: [["A", "B"], ["O", "M"], ["O", "A"]], angles: [{ at: "M", from: "O", to: "B", right: true, col: "#2f6ea8" }], lens, box: FIG })),
      ask(slot(q, " cm")));
  },
  worked() {
    return worked("One done for you", say(
      "The radius is 5 cm and OM is 3 cm. In triangle OMA, AM² = 5² − 3² = 16, so AM = 4 cm. M is " +
      "the middle of the chord, so AB = 2 × 4 = <b>8 cm</b>."));
  },
  key(item) {
    return [want.num({ chord: 2 * item.half, dist: item.dist, rad: item.rad }[item.ask])];
  },
  answer(item) {
    return [{ chord: `AM = √(${item.rad}² − ${item.dist}²) = ${item.half}, AB = ${2 * item.half} cm`, dist: `OM = √(${item.rad}² − ${item.half}²) = ${item.dist} cm`, rad: `OA = √(${item.half}² + ${item.dist}²) = ${item.rad} cm` }[item.ask]];
  },
};

/* ═══ the alternate segment theorem ════════════════════════════════════════*/

const ciAlt = {
  id: "ci-alt",
  group: "ci-alt",
  label: "The alternate segment theorem",
  blurb: "The angle between a tangent and a chord equals the angle in the other segment.",
  heading: "TS is a tangent at A. Find x, and give the reason.",
  instruction: () =>
    "The angle between a tangent and a chord (here between the tangent at A and the chord AB) is " +
    "equal to the angle the chord makes at the circumference in the OTHER segment — the one on the " +
    "far side of the chord, at C. It is called the alternate segment theorem.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const x = stepped(r, o, 30, 75);
    const t = turnOf(r, o, 270);
    const room = 360 - 2 * x;
    const c = t + 2 * x + r.int(Math.round(room / 4), Math.round((room * 3) / 4));
    return { x, t, c, givenTan: r.chance(0.5), reasons: reasonsFor(r, "alt") };
  },
  render(item) {
    /* B is 2x round from A, so the tangent on B's side makes x with AB */
    const P = { A: on(item.t), B: on(item.t + 2 * item.x), C: on(item.c), T: alongTangent(item.t, 0.95), S: alongTangent(item.t, -0.95) };
    const angles = item.givenTan
      ? [{ at: "A", from: "T", to: "B", label: `${item.x}°` }, { at: "C", from: "A", to: "B", label: "x" }]
      : [{ at: "C", from: "A", to: "B", label: `${item.x}°` }, { at: "A", from: "T", to: "B", label: "x" }];
    return side(art(circleSvg({ P, segs: [["T", "S"], ["A", "B"], ["A", "C"], ["B", "C"]], angles, box: FIG, hideO: true })),
      ask(deg("x =")) + reasonTick(item.reasons));
  },
  worked() {
    return worked("One done for you", say(
      "The tangent makes 55° with the chord AB. The angle at C, in the other segment, standing on the " +
      "same chord, is equal: x = <b>55°</b> — the alternate segment theorem."));
  },
  key(item) {
    return [want.num(item.x), want.tick(item.reasons.indexOf("alt"))];
  },
  answer(item) {
    return [`x = ${item.x}° — ${R.alt}`];
  },
};

/* ═══ give the reason ══════════════════════════════════════════════════════*/

/** One solved picture for each theorem, and what it shows. */
const SCENES = {
  centre(r, o) {
    const x = stepped(r, o, 25, 70);
    const f0 = centreFigure(r, o, x);
    return { fig: { P: f0.P, segs: [["O", "A"], ["O", "B"], ["C", "A"], ["C", "B"]], angles: [{ at: "O", from: "A", to: "B", label: `${2 * x}°` }, { at: "C", from: "A", to: "B", label: `${x}°` }] }, fact: `The angle at C is ${x}° because…` };
  },
  semi(r, o) {
    const a = stepped(r, o, 20, 70); const t = turnOf(r, o, 0);
    return { fig: { P: { O: [0, 0], A: on(t + 180), B: on(t), C: on(t + 2 * a) }, segs: [["A", "B"], ["A", "C"], ["C", "B"]], angles: [{ at: "C", from: "A", to: "B", label: "90°" }] }, fact: "The angle at C is 90° because…" };
  },
  same(r, o) {
    const x = stepped(r, o, 20, 60); const t = turnOf(r, o, 270);
    return { fig: { P: { A: on(t - x), B: on(t + x), C: on(t + 150), D: on(t + 215) }, segs: [["A", "B"], ["C", "A"], ["C", "B"], ["D", "A"], ["D", "B"]], angles: [{ at: "C", from: "A", to: "B", label: `${x}°` }, { at: "D", from: "A", to: "B", label: `${x}°` }], hideO: true }, fact: `The angle at D is ${x}°, the same as at C, because…` };
  },
  cyclic(r, o) {
    const q = cyclicQuad(r, o); const [a, b, c, d] = q.pts.map(on);
    return { fig: { P: { A: a, B: b, C: c, D: d }, segs: [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"]], angles: [{ at: "A", from: "D", to: "B", label: `${q.A}°` }, { at: "C", from: "B", to: "D", label: `${180 - q.A}°` }], hideO: true }, fact: `The angle at C is ${180 - q.A}° because…` };
  },
  tangent(r, o) {
    const t = turnOf(r, o, 270);
    return { fig: { P: { O: [0, 0], T: on(t), P: alongTangent(t, 1.2), _e: alongTangent(t, -0.8) }, segs: [["O", "T"], ["_e", "P"]], angles: [{ at: "T", from: "O", to: "P", label: "90°", right: true }] }, fact: "The angle OTP is 90° because…" };
  },
  alt(r, o) {
    const x = stepped(r, o, 30, 70); const t = turnOf(r, o, 270);
    return { fig: { P: { A: on(t), B: on(t + 2 * x), C: on(t + 2 * x + (360 - 2 * x) / 2), T: alongTangent(t, 0.95), S: alongTangent(t, -0.95) }, segs: [["T", "S"], ["A", "B"], ["A", "C"], ["B", "C"]], angles: [{ at: "A", from: "T", to: "B", label: `${x}°` }, { at: "C", from: "A", to: "B", label: `${x}°` }], hideO: true }, fact: `The angle at C is ${x}° because…` };
  },
};
const dealScene = dealer();

const ciReason = {
  id: "ci-reason",
  group: "ci-reason",
  label: "Which theorem?",
  blurb: "The angle is given. Say why.",
  heading: "Tick the reason",
  instruction: () =>
    "Each picture shows an angle that has already been worked out. Tick the theorem that gives it. " +
    "In an exam, the reason earns marks of its own — an angle with no reason is only half an answer.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const kind = dealScene(r, Object.keys(SCENES), i);
    return { kind, reasons: reasonsFor(r, kind), seedScene: SCENES[kind](r, o) };
  },
  render(item) {
    return side(art(circleSvg({ ...item.seedScene.fig, box: FIG })), ask(item.seedScene.fact) + reasonTick(item.reasons));
  },
  key(item) {
    return [want.tick(item.reasons.indexOf(item.kind))];
  },
  answer(item) {
    return [R[item.kind]];
  },
};

const dealTwo = dealer();
const ciTwoStep = {
  id: "ci-two-step",
  group: "ci-reason",
  label: "Two steps, a reason each",
  blurb: "Find one angle, then use it to find the next — and say why each time.",
  heading: "Find x and y. Give a reason for each.",
  instruction: () =>
    "These take two steps. Find x first; then use it to find y. Write the reason for each step on " +
    "the line — the theorem's words, or 'angles in a triangle add up to 180°', 'two radii make an " +
    "isosceles triangle'.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const kind = dealTwo(r, ["centre-iso", "tangents-iso"], i);
    if (kind === "centre-iso") {
      const x = stepped(r, o, 25, 70);
      return { kind, a: x, ...centreFigure(r, o, x) };
    }
    const p = 2 * stepped(r, o, 20, 50);
    return { kind, p, phi: turnOf(r, o, 0) };
  },
  render(item) {
    let fig;
    if (item.kind === "centre-iso") {
      fig = circleSvg({ P: item.P, segs: [["O", "A"], ["O", "B"], ["A", "B"], ["C", "A"], ["C", "B"]], ticks: [["O", "A"], ["O", "B"]], angles: [{ at: "C", from: "A", to: "B", label: `${item.a}°` }, { at: "O", from: "A", to: "B", label: "x" }, { at: "A", from: "O", to: "B", label: "y" }], box: FIG });
    } else {
      const half = 90 - item.p / 2;
      const d = 1 / Math.sin((item.p / 2) * Math.PI / 180);
      const P = { O: [0, 0], A: on(item.phi + half), B: on(item.phi - half), P: [d * Math.cos(item.phi * Math.PI / 180), d * Math.sin(item.phi * Math.PI / 180)] };
      fig = circleSvg({ P, segs: [["P", "A"], ["P", "B"], ["O", "A"], ["O", "B"], ["A", "B"]], ticks: [["O", "A"], ["O", "B"]], angles: [{ at: "P", from: "A", to: "B", label: `${item.p}°` }, { at: "O", from: "A", to: "B", label: "x" }, { at: "A", from: "O", to: "B", label: "y" }], box: FIG });
    }
    return side(art(fig), ask(deg("x =")) + ask("because") + ask(line()) + ask(deg("y =")) + ask("because") + ask(line()));
  },
  worked() {
    return worked("One done for you", say(
      "The angle at C is 40°, so the angle at the centre is x = 2 × 40 = <b>80°</b> (the angle at the " +
      "centre is twice the angle at the circumference). OA and OB are radii, so OAB is isosceles and " +
      "y = (180 − 80) ÷ 2 = <b>50°</b>."));
  },
  key(item) {
    if (item.kind === "centre-iso") return [want.num(2 * item.a), want.free(), want.num(90 - item.a), want.free()];
    return [want.num(180 - item.p), want.free(), want.num(item.p / 2), want.free()];
  },
  answer(item) {
    return item.kind === "centre-iso"
      ? [`x = 2 × ${item.a} = ${2 * item.a}° (angle at the centre); y = (180 − ${2 * item.a}) ÷ 2 = ${90 - item.a}° (isosceles, two radii)`]
      : [`x = 180 − ${item.p} = ${180 - item.p}° (tangents meet radii at 90°, angles in OAPB add to 360°); y = (180 − ${180 - item.p}) ÷ 2 = ${item.p / 2}° (isosceles, two radii)`];
  },
};

export const CI_EXERCISES = [
  ciName, ciRD,
  ciIso,
  ciMeasure, ciCentre,
  ciSemi,
  ciSame,
  ciCyclic, ciExterior,
  ciTanRadius, ciTwoTan, ciTanLength,
  ciChord,
  ciAlt,
  ciReason, ciTwoStep,
];

/* exported for the checks: the geometry of every figure is measurable */
export { angleAt };
