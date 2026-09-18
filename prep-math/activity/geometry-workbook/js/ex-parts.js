/* ============================================================================
   Geometry Workbook — CHAPTER 12: Parts of a circle
   ----------------------------------------------------------------------------
   Six sections:

     centre, radius and diameter · chords, diameters and tangents ·
     semicircles, quadrants, sectors and segments (major and minor) ·
     arcs and the circumference · arc length, perimeter and area ·
     all the parts

   CONCRETE → REPRESENTATIONAL → ABSTRACT, as in every chapter:

     concrete         a circle at TRUE SIZE — folded to find its centre (on
                      screen the dashed lines can be tapped and it folds),
                      measured with a ruler, wrapped round with string
     representational a drawing with the part in red or shaded, to name
     abstract         statements, definitions and numbers with no picture

   The words, and how they are kept apart:

     radius           centre to the edge            diameter  edge to edge
                                                    THROUGH the centre
     chord            edge to edge, anywhere        tangent   touches the
                      (a diameter is the longest)             circle at one point
     arc              part of the circumference     circumference  all of it
     sector           a slice between two radii     segment   the piece a chord
                      (quadrant: a quarter;                   cuts off
                      semicircle: a half)
     minor / major    less than half / more than half — of a sector, segment
                      or arc

   π is 22/7 at Gentle, with radii in sevens so everything comes out whole,
   and 3.14 from Middle, answers to one decimal place.
   ========================================================================== */

import { ringSvg, on } from "./ringart.js";
import { levelOf, dealer } from "./levels.js";
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

const tier = (o) => levelOf(o).id;
const rnd = (v) => Math.round(v * 100) / 100;
const r1 = (v) => Math.round(v * 10) / 10;
const fmt = (v) => String(rnd(v));
const cm = (v) => `${fmt(v)} cm`;
const RED = "#c0453f";
const RULER = { gentle: 1, middle: 0.5, stretch: 0.1 };
const FIG = { w: 50, h: 46 };

/* π by level: 22/7 with radii in sevens at Gentle, so it all comes out whole */
const PI = (o) => (tier(o) === "gentle" ? 22 / 7 : 3.14);
const piSays = (o) => (tier(o) === "gentle" ? "22/7" : "3.14");
/** A number that is whole at Gentle; to one decimal place otherwise. */
const ans = (v, o) => (tier(o) === "gentle" ? want.num(Math.round(v)) : want.num(r1(v), 0.1));
const say1 = (v, o) => (tier(o) === "gentle" ? String(Math.round(v)) : fmt(r1(v)));

/** A radius a ruler can read at this level, small enough to print. */
function trueRadius(r, o, lo = 2, hi = 3.5) {
  const st = RULER[tier(o)] || 1;
  return rnd(r.int(Math.ceil(lo / st), Math.floor(hi / st)) * st);
}

export const PC_GROUPS = [
  { id: "pc-centre", chapter: "Chapter 12 · Parts of a circle", label: "Centre, radius and diameter" },
  { id: "pc-lines", label: "Chords, diameters and tangents" },
  { id: "pc-regions", label: "Semicircles, quadrants, sectors and segments" },
  { id: "pc-arcs", label: "Arcs and the circumference" },
  { id: "pc-more", label: "Arc length, perimeter and area" },
  { id: "pc-all", label: "All the parts" },
];

/* ═══ 1. centre, radius and diameter ═══════════════════════════════════════*/

const pcFoldCentre = {
  id: "pc-fold-centre",
  group: "pc-centre",
  label: "Fold to find the centre",
  blurb: "Fold the circle in half twice: the creases cross at the centre.",
  heading: "Find the centre by folding",
  instruction: () =>
    "Trace the circle, cut it out, and fold it in half along each dashed line — on screen, tap " +
    "a line. Each fold is a diameter, and every diameter goes through the centre, so the centre " +
    "is where the two creases cross. Mark it, then measure the radius and the diameter.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t1 = r.int(0, 11) * 15;
    return { r: trueRadius(r, o), t1, t2: t1 + r.pick([45, 60, 75, 90, 105]) };
  },
  render(item) {
    const lines = [item.t1, item.t2].map((t) => ({ a: on(t, item.r * 1.12), b: on(t + 180, item.r * 1.12), fold: true }));
    const fig = ringSvg({ r: item.r, scale: 10, centre: false, lines, fold: true, label: "A circle at true size with two lines to fold along" });
    return side(art(fig), ask(slot("Radius", " cm")) + ask(slot("Diameter", " cm")));
  },
  worked() {
    return worked("Why it works", say(
      "A circle folded exactly in half is folded along a diameter — the halves match whichever " +
      "diameter you pick. Two different diameters can only cross at one place: the centre. Measure " +
      "from there to the edge for the radius; right across through it for the diameter, twice as long."));
  },
  key(item) {
    return [want.num(item.r, 0.2), want.num(rnd(2 * item.r), 0.3)];
  },
  answer(item) {
    return [`radius ${cm(item.r)}, diameter ${cm(2 * item.r)}`];
  },
};

const pcMeasure = {
  id: "pc-measure",
  group: "pc-centre",
  label: "Measure a radius and a diameter",
  blurb: "True size: the diameter is two radii, end to end, through O.",
  heading: "Measure OA and BC",
  instruction: () =>
    "O is the centre. OA goes from the centre to the edge: a RADIUS. BC goes right across " +
    "through the centre: a DIAMETER. Measure both, and see how many radii make the diameter.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const a = r.int(0, 11) * 30 + 15;
    return { r: trueRadius(r, o), a, b: a + r.pick([100, 130, 150, 210, 240]) };
  },
  render(item) {
    const fig = ringSvg({
      r: item.r, scale: 10, points: { A: item.a, B: item.b, C: item.b + 180 },
      lines: [{ a: "O", b: "A", col: RED, w: 0.9 }, { a: "B", b: "C", col: "#2f6ea8", w: 0.9 }],
      snap: ["O", "A", "B", "C"], label: "A circle at true size with a radius and a diameter",
    });
    return side(art(fig), ask(slot("OA", " cm")) + ask(slot("BC", " cm")) + ask(slot("BC ÷ OA", "")));
  },
  key(item) {
    return [want.num(item.r, 0.2), want.num(rnd(2 * item.r), 0.3), want.num(2, 0.15)];
  },
  answer(item) {
    return [`OA ${cm(item.r)}, BC ${cm(2 * item.r)} — the diameter is 2 radii`];
  },
};

const RD_FORMS = ["r2d", "d2r"];
const dealRD = dealer();

const pcRD = {
  id: "pc-rd",
  group: "pc-centre",
  label: "Radius to diameter, and back",
  blurb: "Diameter = 2 × radius. Radius = diameter ÷ 2.",
  heading: "Radius and diameter",
  instruction: () => "The diameter is twice the radius; the radius is half the diameter.",
  cols: 2,
  defaultCount: 8,
  make(r, o, k, i) {
    const form = dealRD(r, RD_FORMS, i);
    const t = tier(o);
    const v = t === "gentle" ? r.int(2, 20) : t === "middle" ? r.int(3, 60) : r.int(15, 250) / 10;
    return { form, v: form === "d2r" && t === "gentle" ? 2 * v : v };
  },
  render(item) {
    return item.form === "r2d"
      ? ask(`Radius ${cm(item.v)}, so the diameter is ${box()} cm.`)
      : ask(`Diameter ${cm(item.v)}, so the radius is ${box()} cm.`);
  },
  key(item) {
    return [want.num(rnd(item.form === "r2d" ? 2 * item.v : item.v / 2))];
  },
  answer(item) {
    return [cm(item.form === "r2d" ? 2 * item.v : item.v / 2)];
  },
};

/* Twelve places round the edge, every 30°, and the centre: a ruled line
   clicks onto one of them. Index 0 is O; index k (1–12) is at (k − 1) × 30°. */
const RIM = [...Array(12)].map((_, k) => k * 30);
const rimSnap = (item) => ["O", ...RIM.map((_, k) => `_${k}`)];
const rimPoints = (item) => Object.fromEntries([...RIM.map((d, k) => [`_${k}`, d]), ["A", RIM[item.a]], ["B", RIM[item.b]], ["C", RIM[item.c]]]);

const pcDraw = {
  id: "pc-draw",
  group: "pc-centre",
  label: "Draw a radius, a diameter and a chord",
  blurb: "Rule them from point to point: each has its own ends.",
  heading: "Draw the three lines",
  instruction: () =>
    "Rule a RADIUS from O to A, a DIAMETER that starts at B, and a CHORD from A to C. A diameter " +
    "goes through O, so lay the ruler on B and O. On screen, drag from point to point; the " +
    "dots round the edge are every 30°.",
  cols: 2,
  defaultCount: 2,
  make(r) {
    /* A, B and C apart from each other; the chord AC not a diameter; and
       neither A nor C sitting where B's diameter ends */
    const gap = (x, y) => Math.min(Math.abs(x - y), 12 - Math.abs(x - y));
    for (let g = 0; g < 500; g++) {
      const [a, b, c] = [r.int(0, 11), r.int(0, 11), r.int(0, 11)];
      const opp = (b + 6) % 12;
      if (gap(a, b) >= 2 && gap(b, c) >= 2 && gap(a, c) >= 2 && gap(a, c) <= 5 && a !== opp && c !== opp) return { a, b, c };
    }
    return { a: 0, b: 3, c: 4 };
  },
  render(item) {
    const fig = ringSvg({ r: 2.5, box: FIG, points: rimPoints(item), snap: rimSnap(item), label: "A circle with points round its edge" });
    return art(fig);
  },
  worked() {
    return worked("Remember", say(
      "A radius has one end at O. A diameter has both ends on the edge and goes through O — so " +
      "from B it goes to the point exactly opposite. A chord has both ends on the edge and need " +
      "not go through O."));
  },
  key(item) {
    const idx = (k) => k + 1;
    const has = (lines, x, y) => lines.some(([p, q]) => (p === x && q === y) || (p === y && q === x));
    return [want.draw({
      says: "OA, B to the point opposite B, and AC",
      check: (lines) => has(lines, 0, idx(item.a)) && has(lines, idx(item.b), idx((item.b + 6) % 12)) && has(lines, idx(item.a), idx(item.c)),
    })];
  },
  answer() {
    return ["the radius OA, the diameter from B through O, the chord AC"];
  },
};

/* ═══ 2. chords, diameters and tangents ════════════════════════════════════*/

const LINE_KINDS = ["radius", "diameter", "chord", "tangent"];
const dealLine = dealer();

function lineFig(kind, t, spread, r = 2.5) {
  const hi = { col: RED, w: 1.2 };
  const opts = { r, box: FIG, points: {}, lines: [] };
  if (kind === "radius") { opts.points.A = t; opts.lines.push({ a: "O", b: "A", ...hi }); }
  if (kind === "diameter") { opts.points.A = t; opts.points.B = t + 180; opts.lines.push({ a: "A", b: "B", ...hi }); }
  if (kind === "chord") { opts.points.A = t; opts.points.B = t + spread; opts.lines.push({ a: "A", b: "B", ...hi }); }
  if (kind === "tangent") {
    opts.points.T = t;
    const p = on(t, r);
    const u = [-p[1] / r, p[0] / r];
    opts.lines.push({ a: [p[0] - u[0] * r * 0.9, p[1] - u[1] * r * 0.9], b: [p[0] + u[0] * r * 0.9, p[1] + u[1] * r * 0.9], ...hi });
  }
  return ringSvg(opts);
}

const pcLineName = {
  id: "pc-line-name",
  group: "pc-lines",
  label: "Name the red line",
  blurb: "Radius, diameter, chord or tangent — look at where its ends are.",
  heading: "What is the red line?",
  instruction: () =>
    "Where are its ends? O and the edge: a RADIUS. Edge to edge through O: a DIAMETER. Edge to " +
    "edge, missing O: a CHORD. Outside the circle, touching it at one point: a TANGENT.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    return { kind: dealLine(r, LINE_KINDS, i), t: r.int(0, 11) * 30 + 10, spread: r.pick([70, 100, 130]) };
  },
  render(item) {
    return side(art(lineFig(item.kind, item.t, item.spread)), tick(...LINE_KINDS));
  },
  key(item) {
    return [want.tick(LINE_KINDS.indexOf(item.kind))];
  },
  answer(item) {
    return [item.kind];
  },
};

const pcChords = {
  id: "pc-chords",
  group: "pc-lines",
  label: "The longest chord",
  blurb: "True size: measure three chords. The one through O is the longest.",
  heading: "Measure the chords",
  instruction: () =>
    "All three red lines are chords — both ends on the circle. Measure each one. Which is " +
    "longest? Does it go through the centre O?",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const R = trueRadius(r, o, 2.5, 3.5);
    const names = r.shuffle(["p", "q", "r"]);
    const t = r.int(0, 5) * 30;
    const spreads = r.shuffle([180, r.pick([70, 80, 90]), r.pick([110, 120, 140])]);
    return { R, names, chords: spreads.map((sp, j) => ({ from: t + j * 57, sp })) };
  },
  render(item) {
    const points = {};
    const lines = [];
    item.chords.forEach((c, j) => {
      points[`_a${j}`] = c.from; points[`_b${j}`] = c.from + c.sp;
      lines.push({ a: `_a${j}`, b: `_b${j}`, col: RED, w: 0.8, label: item.names[j], at: 0.3, away: false });
    });
    const fig = ringSvg({ r: item.R, scale: 10, points, lines, snap: ["O", ...Object.keys(points)], label: "A circle at true size with three chords" });
    return side(art(fig), ask(["p", "q", "r"].map((n) => slot(n, " cm")).join("")) + ask("The longest is") + tick("p", "q", "r"));
  },
  key(item) {
    const L = (c) => 2 * item.R * Math.sin((c.sp * Math.PI) / 360);
    const byName = ["p", "q", "r"].map((n) => item.chords[item.names.indexOf(n)]);
    const longest = ["p", "q", "r"].indexOf(item.names[item.chords.findIndex((c) => c.sp === 180)]);
    return [...byName.map((c) => want.num(r1(L(c)), 0.2)), want.tick(longest)];
  },
  answer(item) {
    const L = (c) => 2 * item.R * Math.sin((c.sp * Math.PI) / 360);
    const j = item.chords.findIndex((c) => c.sp === 180);
    return [`${item.chords.map((c, k) => `${item.names[k]} ${cm(r1(L(c)))}`).join(", ")} — the longest is ${item.names[j]}, the diameter`];
  },
};

const pcTangent = {
  id: "pc-tangent",
  group: "pc-lines",
  label: "Which line is the tangent?",
  blurb: "It touches at one point, and meets the radius there at 90°.",
  heading: "Find the tangent, then measure its angle with the radius",
  instruction: () =>
    "One line cuts the circle twice, one misses it, and one only TOUCHES it, at T: that is the " +
    "tangent. Tick it. Then measure the angle between the radius OT and the tangent with a protractor.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { R: trueRadius(r, o, 2, 3), t: r.int(0, 7) * 45 + 20, names: r.shuffle(["a", "b", "c"]) };
  },
  render(item) {
    const { R, t } = item;
    const p = on(t, R);
    const u = [-p[1] / R, p[0] / R];
    const nrm = [p[0] / R, p[1] / R];
    const L = R * 1.2;
    const tangent = { a: [p[0] - u[0] * L, p[1] - u[1] * L], b: [p[0] + u[0] * L, p[1] + u[1] * L] };
    const inner = [p[0] - nrm[0] * R * 0.55, p[1] - nrm[1] * R * 0.55];
    const cut = { a: [inner[0] - u[0] * L * 1.2, inner[1] - u[1] * L * 1.2], b: [inner[0] + u[0] * L * 1.2, inner[1] + u[1] * L * 1.2] };
    const outer = [-p[0] * 1.35, -p[1] * 1.35];
    const miss = { a: [outer[0] - u[0] * L, outer[1] - u[1] * L], b: [outer[0] + u[0] * L, outer[1] + u[1] * L] };
    const [nt, nc, nm] = item.names;
    const lines = [
      { ...tangent, label: nt, at: 0.12 }, { ...cut, label: nc, at: 0.1 }, { ...miss, label: nm, at: 0.12 },
      { a: "O", b: "T", col: RED, w: 0.7 },
    ];
    const fig = ringSvg({ r: R, scale: 10, points: { T: t }, lines, snap: ["O", "T", tangent.a, tangent.b], label: "A circle at true size with three lines" });
    return side(art(fig), ask("The tangent is") + tick("a", "b", "c") + ask(slot("Angle OT makes with it", "°")));
  },
  worked() {
    return worked("Remember", say(
      "A line can cut a circle twice, touch it once, or miss it. The one that touches is the " +
      "TANGENT, and the radius to the point where it touches always meets it at <b>90°</b>."));
  },
  key(item) {
    return [want.tick(["a", "b", "c"].indexOf(item.names[0])), want.num(90, 2)];
  },
  answer(item) {
    return [`${item.names[0]} — it touches at T; the angle is 90°`];
  },
};

const STATEMENTS = [
  ["A diameter is a chord.", true],
  ["Every chord goes through the centre.", false],
  ["The longest chord of a circle is a diameter.", true],
  ["A tangent crosses the circle twice.", false],
  ["A radius is half a diameter.", true],
  ["A diameter is made of two radii end to end.", true],
  ["A chord can be longer than the diameter.", false],
  ["A tangent meets the radius at its point of contact at a right angle.", true],
  ["All radii of one circle are the same length.", true],
  ["A radius has both its ends on the circumference.", false],
  ["A circle has exactly one diameter.", false],
  ["A tangent touches the circle at exactly one point.", true],
];
const dealStatement = dealer();

const pcTrueFalse = {
  id: "pc-true-false",
  group: "pc-lines",
  label: "True or false?",
  blurb: "No picture: what is always true of radii, chords and tangents.",
  heading: "True or false?",
  instruction: () => "Sketch a circle if it helps. Tick true or false.",
  cols: 2,
  defaultCount: 8,
  make(r, o, k, i) {
    const [text, yes] = dealStatement(r, STATEMENTS, i);
    return { text, yes };
  },
  render(item) {
    return lead(item.text) + tick("true", "false");
  },
  key(item) {
    return [want.tick(item.yes ? 0 : 1)];
  },
  answer(item) {
    return [item.yes ? "true" : "false"];
  },
};

/* ═══ 3. semicircles, quadrants, sectors and segments ══════════════════════*/

const REGION_KINDS = ["semicircle", "quadrant", "sector", "segment"];
const SIZES = ["minor — less than half", "major — more than half", "exactly half"];
const REGIONS = [
  { kind: 0, size: 2, make: (t) => ({ regions: [{ kind: "sector", from: t, to: t + 180 }], lines: [[t, t + 180]] }) },
  { kind: 1, size: 0, make: (t) => ({ regions: [{ kind: "sector", from: t, to: t + 90 }], lines: [["O", t], ["O", t + 90]] }) },
  { kind: 2, size: 0, make: (t, r) => { const s = r.pick([50, 70, 120, 140]); return { regions: [{ kind: "sector", from: t, to: t + s }], lines: [["O", t], ["O", t + s]] }; } },
  { kind: 2, size: 1, make: (t, r) => { const s = r.pick([220, 240, 290, 310]); return { regions: [{ kind: "sector", from: t, to: t + s }], lines: [["O", t], ["O", t + s]] }; } },
  { kind: 3, size: 0, make: (t, r) => { const s = r.pick([80, 110, 130]); return { regions: [{ kind: "segment", from: t, to: t + s }], lines: [[t, t + s]] }; } },
  { kind: 3, size: 1, make: (t, r) => { const s = r.pick([230, 250, 280]); return { regions: [{ kind: "segment", from: t, to: t + s }], lines: [[t, t + s]] }; } },
];
const dealRegion = dealer();

function regionFig(spec, r = 2.5) {
  const points = {};
  const lines = spec.lines.map(([a, b], j) => {
    const name = (v, k) => { if (v === "O") return "O"; points[`_${j}${k}`] = v; return `_${j}${k}`; };
    return { a: name(a, "a"), b: name(b, "b") };
  });
  return ringSvg({ r, box: FIG, points, lines, regions: spec.regions, label: "A circle with part of it shaded" });
}

const pcRegion = {
  id: "pc-region",
  group: "pc-regions",
  label: "Name the shaded part",
  blurb: "Sector or segment, quadrant or semicircle — and major or minor.",
  heading: "Name the shaded part",
  instruction: () =>
    "A SECTOR is a slice between two radii, like a slice of cake. A SEGMENT is the piece a chord " +
    "cuts off. A QUADRANT is a quarter-circle sector; a SEMICIRCLE is half the circle. MINOR " +
    "means less than half, MAJOR more than half.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const list = tier(o) === "gentle" ? REGIONS.filter((x) => x.size !== 1) : REGIONS;
    const R = dealRegion(r, list, i);
    return { kind: R.kind, size: R.size, spec: R.make(r.int(0, 11) * 30, r) };
  },
  render(item) {
    return side(art(regionFig(item.spec)), tick(...REGION_KINDS) + tick(...SIZES));
  },
  worked() {
    return worked("One done for you", side(art(regionFig({ regions: [{ kind: "segment", from: 30, to: 280 }], lines: [[30, 280]] })),
      say("A chord cuts the circle, and the shaded part is on the big side of it: a <b>segment</b>, " +
        "and more than half the circle, so the <b>major</b> segment.")));
  },
  key(item) {
    return [want.tick(item.kind), want.tick(item.size)];
  },
  answer(item) {
    return [`${item.size === 2 ? "" : item.size === 0 ? "minor " : "major "}${REGION_KINDS[item.kind]}${item.kind === 1 ? " (a minor sector)" : ""}`.trim()];
  },
};

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const fracForms = (a, b) => {
  const g = gcd(a, b);
  const [p, q] = [a / g, b / g];
  const out = [`${p}/${q}`];
  const d = p / q;
  /* a decimal that ends, too — but never ".25" on its own: the marker drops
     the point, and "25" is not a quarter */
  if (Number.isFinite(d) && Math.abs(d * 1000 - Math.round(d * 1000)) < 1e-9) out.push(String(d));
  return out;
};
const SECTOR_ANGLES = { gentle: [180, 90, 120, 60], middle: [90, 120, 60, 45, 30, 72, 40, 36], stretch: [270, 240, 135, 150, 300, 225, 45, 72] };

const pcSector = {
  id: "pc-sector",
  group: "pc-regions",
  label: "What fraction is the sector?",
  blurb: "The angle at the centre out of 360°. And the other sector gets the rest.",
  heading: "The sector and what is left",
  instruction: () =>
    "The whole way round the centre is 360°. The shaded sector's angle out of 360 is its " +
    "fraction of the circle. The unshaded sector has the rest of the 360°.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return { x: r.pick(SECTOR_ANGLES[tier(o)] || SECTOR_ANGLES.gentle), t: r.int(0, 11) * 30 };
  },
  render(item) {
    const { x, t } = item;
    const fig = ringSvg({
      r: 2.5, box: FIG, points: { _a: t, _b: t + x }, lines: [{ a: "O", b: "_a" }, { a: "O", b: "_b" }],
      regions: [{ kind: "sector", from: t, to: t + x }], angles: [{ from: t, to: t + x, label: `${x}°` }], label: "A sector",
    });
    return side(art(fig), ask(slot("Fraction of the circle", "")) + ask(slot("The other sector's angle", "°")) +
      ask("The shaded sector is") + tick("minor", "major", "a semicircle"));
  },
  worked() {
    return worked("One done for you", say(
      "A 90° sector: 90 out of 360 is 90/360 = <b>1/4</b> — a quadrant. The other sector has " +
      "360 − 90 = <b>270°</b>, and is the major sector."));
  },
  key(item) {
    return [want.text(...fracForms(item.x, 360)), want.num(360 - item.x), want.tick(item.x < 180 ? 0 : item.x > 180 ? 1 : 2)];
  },
  answer(item) {
    return [`${fracForms(item.x, 360)[0]}; the other is ${360 - item.x}°; ${item.x < 180 ? "minor" : item.x > 180 ? "major" : "a semicircle"}`];
  },
};

/* ═══ 4. arcs and the circumference ════════════════════════════════════════*/

const pcArc = {
  id: "pc-arc",
  group: "pc-arcs",
  label: "Minor arc or major arc?",
  blurb: "An arc is part of the circumference. The long way round is the major arc.",
  heading: "Name the red arc",
  instruction: () =>
    "An ARC is part of the circumference. Between A and B there are two: the short way round " +
    "(the MINOR arc, AB) and the long way round (the MAJOR arc, written with a point on it: ACB).",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const t = r.int(0, 11) * 30;
    const sp = r.pick([70, 100, 130]);
    return { t, sp, major: i % 2 === 1 };
  },
  render(item) {
    const { t, sp, major } = item;
    const fig = ringSvg({
      r: 2.5, box: FIG, points: { A: t, B: t + sp, C: t + sp + (360 - sp) / 2 },
      arcs: [major ? { from: t + sp, to: t + 360 } : { from: t, to: t + sp }], label: "A circle with an arc in red",
    });
    return side(art(fig), tick("the minor arc AB", "the major arc ACB"));
  },
  key(item) {
    return [want.tick(item.major ? 1 : 0)];
  },
  answer(item) {
    return [item.major ? "the major arc ACB" : "the minor arc AB"];
  },
};

const pcString = {
  id: "pc-string",
  group: "pc-arcs",
  label: "Round with a string",
  blurb: "Measure across, measure round: the round is always a little over 3 times across.",
  heading: "Measure the diameter and the circumference",
  instruction: () =>
    "Measure the diameter with a ruler. Then lay a piece of string all the way round the circle, " +
    "mark where it meets itself, straighten it and measure it: that is the CIRCUMFERENCE. Divide " +
    "the circumference by the diameter.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { r: trueRadius(r, o, 1.5, 3) };
  },
  render(item) {
    const fig = ringSvg({ r: item.r, scale: 10, points: { _a: 200, _b: 20 }, lines: [{ a: "_a", b: "_b", dash: "1.2 1" }], ring: true, label: "A circle at true size" });
    return side(art(fig), ask(slot("Diameter", " cm")) + ask(slot("Circumference", " cm")) + ask(slot("Circumference ÷ diameter", "")));
  },
  worked() {
    return worked("What you will find", say(
      "However big the circle, the string round it is a little over 3 times as long as the " +
      "diameter: about 3.14 times. That number is called π (pi)."));
  },
  key(item) {
    const d = 2 * item.r;
    return [want.num(d, 0.2), want.num(r1(Math.PI * d), 0.7), want.num(3.14, 0.2)];
  },
  answer(item) {
    const d = 2 * item.r;
    return [`diameter ${cm(d)}, circumference about ${cm(r1(Math.PI * d))}; about 3.14`];
  },
};

const pcCirc = {
  id: "pc-circ",
  group: "pc-arcs",
  label: "The circumference: π × diameter",
  blurb: "C = π × d, or 2 × π × r. And backwards, from C to the diameter.",
  heading: "Find the circumference",
  instruction: (o) =>
    `Circumference = π × diameter (or 2 × π × radius). Use π = ${piSays(o)}.` +
    (tier(o) === "gentle" ? "" : " Give answers to one decimal place.") +
    (tier(o) === "stretch" ? " Backwards: diameter = circumference ÷ π." : ""),
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const t = tier(o);
    const v = t === "gentle" ? 7 * r.int(1, 6) : r.int(2, 30);
    const form = t === "stretch" && i % 3 === 2 ? "back" : i % 2 === 0 ? "r" : "d";
    return { form, v };
  },
  render(item, o) {
    if (item.form === "back") return ask(`A circumference of ${cm(r1(PI(o) * item.v))}: the diameter is ${box()} cm.`);
    return ask(`${item.form === "r" ? "Radius" : "Diameter"} ${cm(item.v)}: the circumference is ${box()} cm.`);
  },
  worked(o) {
    return worked("One done for you", say(tier(o) === "gentle"
      ? "Radius 7 cm, so diameter 14 cm. C = 22/7 × 14 = 22 × 2 = <b>44 cm</b>."
      : "Diameter 10 cm. C = 3.14 × 10 = <b>31.4 cm</b>. With a radius of 10 cm the diameter is 20, and C = 62.8 cm."));
  },
  key(item, o) {
    if (item.form === "back") return [want.num(item.v, 0.1)];
    const d = item.form === "r" ? 2 * item.v : item.v;
    return [ans(PI(o) * d, o)];
  },
  answer(item, o) {
    if (item.form === "back") return [`${cm(item.v)}`];
    const d = item.form === "r" ? 2 * item.v : item.v;
    return [`${piSays(o)} × ${d} = ${say1(PI(o) * d, o)} cm`];
  },
};

/* ═══ 5. arc length, perimeter and area ════════════════════════════════════*/

const ARC_ANGLES = { gentle: [90, 180, 270], middle: [90, 60, 120, 45, 30, 270, 150], stretch: [40, 75, 100, 135, 210, 250, 320] };

const pcArcLen = {
  id: "pc-arc-len",
  group: "pc-more",
  label: "Arc length",
  blurb: "The arc is the same fraction of the circumference as the angle is of 360°.",
  heading: "Find the length of the red arc",
  instruction: (o) =>
    `Arc length = angle ÷ 360 × the circumference. Use π = ${piSays(o)}.` +
    (tier(o) === "stretch" ? " Then the perimeter of the sector: the arc and two radii." : ""),
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    return { x: r.pick(ARC_ANGLES[t] || ARC_ANGLES.gentle), rr: t === "gentle" ? 7 * r.int(1, 3) : r.int(3, 15), t: r.int(0, 11) * 30 };
  },
  render(item, o) {
    const { x, rr, t } = item;
    const fig = ringSvg({
      r: 2.5, box: { w: 60, h: 56 }, centre: "dot", points: { _a: t, _b: t + x },
      lines: [{ a: "O", b: "_a", label: cm(rr), at: 0.62 }, { a: "O", b: "_b" }],
      arcs: [{ from: t, to: t + x }], angles: [{ from: t, to: t + x, label: `${x}°` }], label: "A sector with its arc in red",
    });
    const flowWords = ask(slot("Circumference", " cm")) + ask(slot("Arc", " cm"));
    return side(art(fig), flowWords + (tier(o) === "stretch" ? ask(slot("Sector's perimeter", " cm")) : ""));
  },
  worked(o) {
    return worked("One done for you", say(tier(o) === "gentle"
      ? "Radius 7 cm, angle 90°. The circumference is 22/7 × 14 = 44 cm; 90° is a quarter of 360°, so the arc is 44 ÷ 4 = <b>11 cm</b>."
      : "Radius 10 cm, angle 72°. The circumference is 3.14 × 20 = 62.8 cm; 72/360 = 1/5, so the arc is 62.8 ÷ 5 = <b>12.6 cm</b>."));
  },
  key(item, o) {
    const C = PI(o) * 2 * item.rr;
    const arc = (item.x / 360) * C;
    const out = [ans(C, o), ans(arc, o)];
    if (tier(o) === "stretch") out.push(want.num(r1(arc + 2 * item.rr), 0.15));
    return out;
  },
  answer(item, o) {
    const C = PI(o) * 2 * item.rr;
    const arc = (item.x / 360) * C;
    return [`C = ${say1(C, o)} cm; arc = ${item.x}/360 × ${say1(C, o)} = ${say1(arc, o)} cm` + (tier(o) === "stretch" ? `; perimeter ${fmt(r1(arc + 2 * item.rr))} cm` : "")];
  },
};

const PERIM_FORMS = ["semi", "quad"];
const dealPerim = dealer();

const pcPerim = {
  id: "pc-perim",
  group: "pc-more",
  label: "Perimeter of a semicircle and a quadrant",
  blurb: "The curved edge AND the straight edges — half a circumference is not the whole way round.",
  heading: "Find the perimeter",
  instruction: (o) =>
    "The perimeter is the whole way round the shape. A semicircle: half the circumference, " +
    "plus the diameter along the bottom. A quadrant: a quarter of the circumference, plus two " +
    `radii. Use π = ${piSays(o)}.`,
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    return { form: dealPerim(r, PERIM_FORMS, i), rr: tier(o) === "gentle" ? 7 * r.int(1, 3) : r.int(3, 16), t: r.pick([0, 90, 180, 270]) };
  },
  render(item) {
    const { form, rr, t } = item;
    const sweep = form === "semi" ? 180 : 90;
    const fig = ringSvg({
      r: 2.5, box: FIG, centre: "dot", points: { _a: t, _b: t + sweep },
      lines: form === "semi" ? [{ a: "_a", b: "_b", w: 0.7, label: cm(2 * rr) }] : [{ a: "O", b: "_a", w: 0.7, label: cm(rr) }, { a: "O", b: "_b", w: 0.7 }],
      regions: [{ kind: "sector", from: t, to: t + sweep, col: "#fff3a8" }], arcs: [{ from: t, to: t + sweep, col: "#2a2723" }],
      label: form === "semi" ? "A semicircle" : "A quadrant", bare: true,
    });
    return side(art(fig), ask(slot("Curved edge", " cm")) + ask(slot("Perimeter", " cm")));
  },
  worked(o) {
    return worked("One done for you", say(tier(o) === "gentle"
      ? "A semicircle on a 14 cm diameter. The whole circumference would be 22/7 × 14 = 44 cm; half of it is 22 cm. Add the straight edge: 22 + 14 = <b>36 cm</b>."
      : "A quadrant with radius 10 cm. The circumference would be 3.14 × 20 = 62.8 cm; a quarter is 15.7 cm. Add two radii: 15.7 + 20 = <b>35.7 cm</b>."));
  },
  key(item, o) {
    const C = PI(o) * 2 * item.rr;
    const curve = item.form === "semi" ? C / 2 : C / 4;
    const straight = item.form === "semi" ? 2 * item.rr : 2 * item.rr;
    return [ans(curve, o), tier(o) === "gentle" ? want.num(Math.round(curve + straight)) : want.num(r1(curve + straight), 0.15)];
  },
  answer(item, o) {
    const C = PI(o) * 2 * item.rr;
    const curve = item.form === "semi" ? C / 2 : C / 4;
    return [`curved ${say1(curve, o)} cm + straight ${2 * item.rr} cm = ${say1(curve + 2 * item.rr, o)} cm`];
  },
};

const AREA_FORMS = ["circle", "semi", "quad", "fromD"];
const dealArea = dealer();

const pcArea = {
  id: "pc-area",
  group: "pc-more",
  label: "Area of a circle",
  blurb: "π × r × r — and a half or a quarter of it.",
  heading: "Find the area",
  instruction: (o) =>
    `Area of a circle = π × radius × radius. A semicircle is half of it, a quadrant a quarter. ` +
    `Use π = ${piSays(o)}. Given the diameter, halve it first.`,
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const list = tier(o) === "gentle" ? AREA_FORMS.slice(0, 2) : AREA_FORMS;
    return { form: dealArea(r, list, i), rr: tier(o) === "gentle" ? 7 * r.int(1, 2) : r.int(2, 15) };
  },
  render(item) {
    const what = { circle: `A circle, radius ${cm(item.rr)}`, semi: `A semicircle, radius ${cm(item.rr)}`, quad: `A quadrant, radius ${cm(item.rr)}`, fromD: `A circle, diameter ${cm(2 * item.rr)}` }[item.form];
    return ask(`${what}: area ${box()} cm²`);
  },
  worked(o) {
    return worked("One done for you", say(tier(o) === "gentle"
      ? "Radius 7 cm: 22/7 × 7 × 7 = 22 × 7 = <b>154 cm²</b>. A semicircle of it: 77 cm²."
      : "Radius 5 cm: 3.14 × 5 × 5 = <b>78.5 cm²</b>. Diameter 10 cm is the same circle — halve it first."));
  },
  key(item, o) {
    const A = PI(o) * item.rr * item.rr * (item.form === "semi" ? 0.5 : item.form === "quad" ? 0.25 : 1);
    return [ans(A, o)];
  },
  answer(item, o) {
    const A = PI(o) * item.rr * item.rr * (item.form === "semi" ? 0.5 : item.form === "quad" ? 0.25 : 1);
    return [`${say1(A, o)} cm²`];
  },
};

/* ═══ 6. all the parts ═════════════════════════════════════════════════════*/

/* A labelled diagram: each part in its own part of the circle, lettered. */
const PARTS = {
  centre: { accept: ["centre", "center", "the centre"], draw: () => ({ callout: [-0.24, -0.24] }) },
  radius: { accept: ["radius"], draw: (t) => ({ points: { _r: t }, lines: [{ a: "O", b: "_r" }], callout: on(t, 0.55) }) },
  diameter: { accept: ["diameter"], draw: (t) => ({ points: { _d1: t, _d2: t + 180 }, lines: [{ a: "_d1", b: "_d2" }], callout: on(t, 0.72) }) },
  chord: { accept: ["chord"], draw: (t) => ({ points: { _c1: t - 28, _c2: t + 28 }, lines: [{ a: "_c1", b: "_c2" }], callout: on(t, 0.68) }) },
  tangent: {
    accept: ["tangent"],
    /* in the circle's own units (radius 2.5), like every line; the callout
       is scaled with the rest afterwards */
    draw: (t) => { const p = on(t, 1); const u = [-p[1], p[0]]; const R = 2.5; return { lines: [{ a: [R * (p[0] - u[0] * 0.8), R * (p[1] - u[1] * 0.8)], b: [R * (p[0] + u[0] * 0.8), R * (p[1] + u[1] * 0.8)] }], callout: [p[0] * 1.15 + u[0] * 0.55, p[1] * 1.15 + u[1] * 0.55] }; },
  },
  sector: { accept: ["sector", "minor sector"], draw: (t) => ({ points: { _s1: t - 30, _s2: t + 30 }, lines: [{ a: "O", b: "_s1" }, { a: "O", b: "_s2" }], regions: [{ kind: "sector", from: t - 30, to: t + 30 }], callout: on(t, 0.6) }) },
  segment: { accept: ["segment", "minor segment"], draw: (t) => ({ points: { _g1: t - 30, _g2: t + 30 }, lines: [{ a: "_g1", b: "_g2" }], regions: [{ kind: "segment", from: t - 30, to: t + 30 }], callout: on(t, 0.9) }) },
  arc: { accept: ["arc", "minor arc"], draw: (t) => ({ arcs: [{ from: t - 25, to: t + 25 }], callout: on(t, 1.2) }) },
};

const pcLabel = {
  id: "pc-label",
  group: "pc-all",
  label: "Label the diagram",
  blurb: "Every part lettered on one circle: write what each is called.",
  heading: "Name each lettered part",
  instruction: () =>
    "Write the name of each part the letters point to: centre, radius, diameter, chord, " +
    "tangent, arc, sector or segment.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const many = { gentle: 4, middle: 5, stretch: 6 }[tier(o)] || 4;
    /* a diameter would cut through everything else, so it is drawn only alone with room */
    const names = r.shuffle(["radius", "chord", "tangent", "sector", "segment", "arc", "centre"]).slice(0, many);
    const start = r.int(0, 11) * 30;
    return { names, start };
  },
  render(item) {
    const spec = { r: 2.5, box: { w: 70, h: 62 }, points: {}, lines: [], regions: [], arcs: [], callouts: [], centre: "dot" };
    const others = item.names.filter((n) => n !== "centre");
    item.names.forEach((n, j) => {
      const letter = "PQRSTUVW"[j];
      const t = item.start + (360 / Math.max(1, others.length)) * others.indexOf(n);
      const d = PARTS[n].draw(t);
      Object.assign(spec.points, d.points || {});
      spec.lines.push(...(d.lines || []));
      spec.regions.push(...(d.regions || []));
      spec.arcs.push(...(d.arcs || []));
      spec.callouts.push({ at: d.callout.map((v) => v * 2.5), text: letter });
    });
    return side(art(ringSvg(spec)), item.names.map((_, j) => ask(slot("PQRSTUVW"[j], ""))).join(""));
  },
  key(item) {
    return item.names.map((n) => want.words(...PARTS[n].accept));
  },
  answer(item) {
    return [item.names.map((n, j) => `${"PQRSTUVW"[j]}: ${n}`).join(", ")];
  },
};

const DEFINITIONS = [
  ["The point in the middle, the same distance from every point on the circle.", ["centre", "center"]],
  ["A straight line from the centre to the circle.", ["radius"]],
  ["A straight line from the circle to the circle, through the centre.", ["diameter"]],
  ["A straight line joining two points on the circle.", ["chord"]],
  ["A straight line that touches the circle at one point only.", ["tangent"]],
  ["The whole distance round the circle.", ["circumference", "perimeter"]],
  ["Part of the circumference.", ["arc"]],
  ["A slice of the circle between two radii.", ["sector"]],
  ["The part of a circle cut off by a chord.", ["segment"]],
  ["Half of a circle, cut off by a diameter.", ["semicircle", "semi-circle"]],
  ["A quarter of a circle: a sector with a right angle at the centre.", ["quadrant"]],
  ["A sector that is more than half the circle.", ["major sector"]],
  ["A segment that is less than half the circle.", ["minor segment"]],
];
const dealDef = dealer();

const pcWords = {
  id: "pc-words",
  group: "pc-all",
  label: "What is it called?",
  blurb: "The definition, no picture: the word.",
  heading: "What is it called?",
  instruction: () => "Write the name of the part each sentence describes.",
  cols: 1,
  defaultCount: 8,
  make(r, o, k, i) {
    const [text, accept] = dealDef(r, DEFINITIONS, i);
    return { text, accept };
  },
  render(item) {
    return ask(`${item.text} ${box()}`);
  },
  key(item) {
    return [want.words(...item.accept)];
  },
  answer(item) {
    return [item.accept[0]];
  },
};

export const PC_EXERCISES = [
  pcFoldCentre, pcMeasure, pcRD, pcDraw,
  pcLineName, pcChords, pcTangent, pcTrueFalse,
  pcRegion, pcSector,
  pcArc, pcString, pcCirc,
  pcArcLen, pcPerim, pcArea,
  pcLabel, pcWords,
];

