/* ============================================================================
   Geometry Workbook — CHAPTER 7: lines and angles
   ----------------------------------------------------------------------------
   The facts about lines and the angles between them that the other chapters
   stand on — without repeating what they already do (the Maths Workbook
   measures and draws angles; chapter 2 does parallel lines, transversals and
   the vertically opposite pair at one crossing):

     points, lines, rays, segments   line AB, ray AB, ray BA, segment AB
     naming angles                   three letters, the corner in the middle
     kinds of angles                 acute to a full turn; measuring reflex
     angles on a straight line       add up to 180°
     angles at a point               add up to 360°
     vertically opposite angles      three lines through one point
     complementary, supplementary    making 90°, making 180°
     perpendicular and parallel      on the dot grid
     angles written with x
     give the reason

   Every figure is drawn from its numbers (rays.js): rays that a question says
   are 35° apart are 35° apart, so a protractor checks them. Angles are whole
   tens at Gentle, fives at Middle, any whole degree at Stretch.
   ========================================================================== */

import { raysSvg, pathSvg } from "./rays.js";
import { dotGridSvg } from "./transversal.js";
import { levelOf, stepped, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
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
const FIG = { w: 68, h: 56 };
const turnOf = (r, o) => (tier(o) === "gentle" ? 0 : r.pick([0, 15, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]));

/** n angles, each a whole step and at least `lo`, adding up to `total`. */
function parts(r, o, n, total, lo = 25, hi = 170) {
  for (let g = 0; g < 400; g++) {
    const out = [];
    let left = total;
    for (let k = 0; k < n - 1; k++) {
      const v = stepped(r, o, lo, Math.min(hi, left - lo * (n - 1 - k)));
      out.push(v);
      left -= v;
    }
    if (left >= lo && left <= hi) return r.shuffle([...out, left]);
  }
  return n === 2 ? [total / 2, total / 2] : [...Array(n)].map(() => total / n);
}

const REASONS = {
  line: "angles on a straight line add up to 180°",
  point: "angles at a point add up to 360°",
  vo: "vertically opposite angles are equal",
  right: "angles that make a right angle add up to 90°",
};
const reasonTick = (keys) =>
  `<span class="wb-tick gw-reasons">${keys.map((k) => `<span class="wb-tick__one"><span class="wb-box"></span><span>${REASONS[k]}</span></span>`).join("")}</span>`;

/* ── the groups ────────────────────────────────────────────────────────────*/

export const LA_GROUPS = [
  { id: "la-paths", chapter: "Chapter 7 · Lines and angles", label: "Points, lines, rays and segments" },
  { id: "la-name", label: "Naming angles" },
  { id: "la-kinds", label: "Kinds of angles" },
  { id: "la-line", label: "Angles on a straight line" },
  { id: "la-point", label: "Angles at a point" },
  { id: "la-vo", label: "Vertically opposite angles" },
  { id: "la-comp", label: "Complementary and supplementary angles" },
  { id: "la-perp", label: "Perpendicular and parallel lines" },
  { id: "la-algebra", label: "Angles written with x" },
  { id: "la-reason", label: "Give the reason" },
];

/* ═══ points, lines, rays, segments ════════════════════════════════════════*/

const PATHS = ["line", "rayAB", "rayBA", "segment"];
const PATH_NAMES = { line: "line AB", rayAB: "ray AB", rayBA: "ray BA", segment: "segment AB" };
const dealPath = dealer();

const laPath = {
  id: "la-path",
  group: "la-paths",
  label: "Line, ray or segment?",
  blurb: "Arrows at both ends, one end, or none — and which way the ray goes.",
  heading: "Line, ray or segment?",
  instruction: () =>
    "A LINE goes on for ever in both directions: arrows at both ends. A RAY starts at a point and " +
    "goes on for ever one way: ray AB starts at A and goes through B; ray BA starts at B. A " +
    "SEGMENT is the part between two points: it stops at both. Tick what each one is.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    return { kind: dealPath(r, PATHS, i), turn: tier(o) === "gentle" ? 0 : r.pick([0, 20, 35, 150, 160, 340]) };
  },
  render(item) {
    return art(pathSvg(item.kind, { turn: item.turn })) + tick(...PATHS.map((p) => PATH_NAMES[p]));
  },
  key(item) {
    return [want.tick(PATHS.indexOf(item.kind))];
  },
  answer(item) {
    return [PATH_NAMES[item.kind]];
  },
};

/* ═══ naming angles ════════════════════════════════════════════════════════*/

const LETTERS = "ABCDEFGHKLMNPQRST".split("");

const laNameAngle = {
  id: "la-name-angle",
  group: "la-name",
  label: "Name the angle with three letters",
  blurb: "The corner's letter goes in the middle: ∠ABC is the angle at B.",
  heading: "Name the marked angle",
  instruction: () =>
    "An angle is named with three letters: a point on one arm, the CORNER, a point on the other " +
    "arm. The corner's letter always goes in the MIDDLE. ∠ABC and ∠CBA are the same angle — the " +
    "angle at B, between BA and BC. Where several angles share a corner, one letter is not enough.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const pick = r.shuffle(LETTERS.slice()).slice(0, 4);
    const [v, ...ends] = pick;
    const t = turnOf(r, o);
    const gaps = parts(r, { level: "middle" }, 3, 360, 60, 170);
    const dirs = [t, t + gaps[0], t + gaps[0] + gaps[1]];
    const [p, q] = r.chance(0.5) ? [0, 1] : [1, 2];
    return { v, ends, dirs, p, q };
  },
  render(item) {
    const ends = Object.fromEntries(item.dirs.map((d, j) => [d, item.ends[j]]));
    const arcs = [{ from: item.dirs[item.p], to: item.dirs[item.q], label: "" }];
    return side(art(raysSvg({ rays: item.dirs, ends, vertex: item.v, arcs, box: FIG })), ask("The marked angle is") + ask(line()));
  },
  worked() {
    return worked("One done for you", say(
      "The marked angle has its corner at Q, and its arms go to P and R. So it is <b>∠PQR</b> " +
      "(or ∠RQP) — Q in the middle. 'The angle at Q' would not do: there are three angles at Q."));
  },
  key(item) {
    const a = item.ends[item.p]; const b = item.ends[item.q]; const v = item.v;
    const forms = [];
    [`${a}${v}${b}`, `${b}${v}${a}`].forEach((s) => forms.push(s, `∠${s}`, `angle ${s}`, `<${s}`));
    return [want.text(...forms)];
  },
  answer(item) {
    const a = item.ends[item.p]; const b = item.ends[item.q];
    return [`∠${a}${item.v}${b} (or ∠${b}${item.v}${a})`];
  },
};

/* ═══ kinds of angles ══════════════════════════════════════════════════════*/

const KINDS = ["acute", "right", "obtuse", "straight", "reflex", "full turn"];
const dealKind = dealer();

const laKind = {
  id: "la-kind",
  group: "la-kinds",
  label: "What kind of angle?",
  blurb: "Acute, right, obtuse, straight, reflex — or a whole turn.",
  heading: "What kind of angle is it?",
  instruction: () =>
    "ACUTE: less than 90°. RIGHT: exactly 90°. OBTUSE: between 90° and 180°. STRAIGHT: exactly " +
    "180°. REFLEX: between 180° and 360°. A FULL TURN is 360°.",
  cols: 2,
  defaultCount: 8,
  make(r, o, k, i) {
    const kind = dealKind(r, KINDS, i);
    const v = { acute: stepped(r, o, 10, 80), right: 90, obtuse: stepped(r, o, 100, 170), straight: 180, reflex: stepped(r, o, 190, 350), "full turn": 360 }[kind];
    return { kind, v };
  },
  render(item) {
    return `<p class="wb-ask wb-ask--lead">${item.v}°</p>` + tick(...KINDS);
  },
  key(item) {
    return [want.tick(KINDS.indexOf(item.kind))];
  },
  answer(item) {
    return [`${item.v}° is ${item.kind === "full turn" ? "a full turn" : `${/^[aeiou]/.test(item.kind) ? "an" : "a"} ${item.kind} angle`}`];
  },
};

const laReflex = {
  id: "la-reflex",
  group: "la-kinds",
  label: "Measure a reflex angle",
  blurb: "A protractor only goes to 180°: measure the small angle and take it from 360°.",
  heading: "Measure the reflex angle",
  instruction: () =>
    "The marked angle goes the LONG way round — it is reflex. A protractor only reaches 180°, so " +
    "measure the small angle between the same two arms, then take it away from 360° (a whole turn).",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const small = stepped(r, o, 30, 150);
    const t = turnOf(r, o);
    return { small, t };
  },
  render(item) {
    const a = item.t; const b = item.t + item.small;
    /* the arc turns the long way: from b round to a */
    const arcs = [{ from: b, to: a + 360, label: "" }];
    return side(art(raysSvg({ rays: [a, b], arcs, box: FIG })), ask(deg("small angle")) + ask(deg("reflex angle")));
  },
  worked() {
    return worked("One done for you", say(
      "The small angle measures 70°. The reflex angle is the rest of the whole turn: 360 − 70 = <b>290°</b>."));
  },
  key(item) {
    return [want.num(item.small, 2), want.num(360 - item.small, 2)];
  },
  answer(item) {
    return [`small ${item.small}°, reflex 360 − ${item.small} = ${360 - item.small}°`];
  },
};

/* ═══ angles on a straight line ════════════════════════════════════════════*/

/** Angles laid side by side from direction `t`: the rays between them, and
    an arc for each, one of them the unknown. */
function fan(t, sizes, unknown, labels = null) {
  const rays = [];
  const arcs = [];
  let at = t;
  sizes.forEach((s, j) => {
    arcs.push({ from: at, to: at + s, label: labels ? labels[j] : j === unknown ? "x" : `${s}°` });
    at += s;
    rays.push(at);
  });
  return { rays, arcs };
}

const laStraight = {
  id: "la-straight",
  group: "la-line",
  label: "Angles on a straight line",
  blurb: "However many there are, they fill half a turn: 180°.",
  heading: "Find x",
  instruction: () =>
    "Angles that sit side by side on a straight line fill half a turn, so together they are 180°. " +
    "Add the ones you know and take them from 180.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const n = tier(o) === "gentle" ? 2 : r.int(2, 3);
    const sizes = parts(r, o, n, 180);
    return { sizes, unknown: r.int(0, n - 1), t: turnOf(r, o) };
  },
  render(item) {
    const { rays, arcs } = fan(item.t, item.sizes, item.unknown);
    return side(art(raysSvg({ lines: [item.t], rays: rays.slice(0, -1), arcs, box: FIG })), ask(deg("x =")));
  },
  worked() {
    return worked("One done for you", say("40° and x sit on a straight line: x = 180 − 40 = <b>140°</b>."));
  },
  key(item) {
    return [want.num(item.sizes[item.unknown])];
  },
  answer(item) {
    const known = item.sizes.filter((_, j) => j !== item.unknown);
    return [`x = 180 − ${known.join(" − ")} = ${item.sizes[item.unknown]}°`];
  },
};

/* ═══ angles at a point ════════════════════════════════════════════════════*/

const laPoint = {
  id: "la-point",
  group: "la-point",
  label: "Angles at a point",
  blurb: "All the way round a point: 360°.",
  heading: "Find x",
  instruction: () =>
    "Angles all the way round a point fill a whole turn, so together they are 360°. Add the ones " +
    "you know and take them from 360.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const n = tier(o) === "gentle" ? 3 : r.int(3, 5);
    const sizes = parts(r, o, n, 360, 35, 175);
    return { sizes, unknown: r.int(0, n - 1), t: turnOf(r, o) };
  },
  render(item) {
    const { rays, arcs } = fan(item.t, item.sizes, item.unknown);
    return side(art(raysSvg({ rays, arcs, box: FIG })), ask(deg("x =")));
  },
  worked() {
    return worked("One done for you", say("Round the point: 120° + 150° + x = 360°, so x = 360 − 270 = <b>90°</b>."));
  },
  key(item) {
    return [want.num(item.sizes[item.unknown])];
  },
  answer(item) {
    const known = item.sizes.filter((_, j) => j !== item.unknown);
    return [`x = 360 − ${known.join(" − ")} = ${item.sizes[item.unknown]}°`];
  },
};

/* ═══ vertically opposite angles ═══════════════════════════════════════════*/

const laThree = {
  id: "la-three",
  group: "la-vo",
  label: "Three lines through a point",
  blurb: "Six angles, three pairs of opposite ones — two given, the rest found.",
  heading: "Three straight lines cross at a point. Find x, y and z.",
  instruction: () =>
    "Where straight lines cross, the angles OPPOSITE each other are equal (vertically opposite " +
    "angles). And the angles along any one line add up to 180°. With three lines there are six " +
    "angles: three different sizes, each twice.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [a, b, c] = parts(r, o, 3, 180, 30, 110);
    return { a, b, c, t: turnOf(r, o) };
  },
  render(item) {
    const { a, b, c, t } = item;
    const arcs = [
      { from: t, to: t + a, label: `${a}°` }, { from: t + a, to: t + a + b, label: `${b}°` },
      { from: t + a + b, to: t + 180, label: "x" }, { from: t + 180, to: t + 180 + a, label: "y" },
      { from: t + 180 + a, to: t + 180 + a + b, label: "z" },
    ];
    return side(art(raysSvg({ lines: [t, t + a, t + a + b], arcs, box: FIG })), ask(deg("x =")) + ask(deg("y =")) + ask(deg("z =")));
  },
  worked() {
    return worked("One done for you", say(
      "40° and 70° are on one straight line with x, so x = 180 − 40 − 70 = <b>70°</b>. y is opposite " +
      "the 40°, so y = <b>40°</b>; z is opposite the 70°, so z = <b>70°</b>."));
  },
  key(item) {
    return [want.num(item.c), want.num(item.a), want.num(item.b)];
  },
  answer(item) {
    return [`x = 180 − ${item.a} − ${item.b} = ${item.c}°; y = ${item.a}° and z = ${item.b}° (vertically opposite)`];
  },
};

/* ═══ complementary and supplementary ══════════════════════════════════════*/

const laCompSupp = {
  id: "la-comp-supp",
  group: "la-comp",
  label: "Complements and supplements",
  blurb: "Complementary angles make 90°; supplementary angles make 180°.",
  heading: "Find the complement and the supplement",
  instruction: () =>
    "Two angles are COMPLEMENTARY if they add up to 90° (a right angle) — the complement of 30° is " +
    "60°. They are SUPPLEMENTARY if they add up to 180° (a straight line) — the supplement of 30° " +
    "is 150°.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    return { a: stepped(r, o, 10, 80), b: stepped(r, o, 10, 170) };
  },
  render(item) {
    return ask(`The complement of ${item.a}° is ${box()}°`) + ask(`The supplement of ${item.b}° is ${box()}°`);
  },
  key(item) {
    return [want.num(90 - item.a), want.num(180 - item.b)];
  },
  answer(item) {
    return [`complement ${90 - item.a}°, supplement ${180 - item.b}°`];
  },
};

const laRightSplit = {
  id: "la-right-split",
  group: "la-comp",
  label: "A right angle cut into parts",
  blurb: "The square says 90°: the parts inside it add up to 90°.",
  heading: "The whole angle is a right angle. Find x.",
  instruction: () =>
    "The little square marks a right angle: 90°. The angles it has been cut into add up to 90°, so " +
    "two of them are complementary.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const n = tier(o) === "gentle" ? 2 : r.int(2, 3);
    const sizes = parts(r, o, n, 90, 15, 75);
    return { sizes, unknown: r.int(0, n - 1), t: turnOf(r, o) };
  },
  render(item) {
    const { rays, arcs } = fan(item.t, item.sizes, item.unknown);
    arcs.push({ from: item.t, to: item.t + 90, right: true, label: "" });
    return side(art(raysSvg({ rays: [item.t, ...rays], arcs, box: FIG })), ask(deg("x =")));
  },
  key(item) {
    return [want.num(item.sizes[item.unknown])];
  },
  answer(item) {
    const known = item.sizes.filter((_, j) => j !== item.unknown);
    return [`x = 90 − ${known.join(" − ")} = ${item.sizes[item.unknown]}°`];
  },
};

/* ═══ perpendicular and parallel ═══════════════════════════════════════════*/

const GRID = { cols: 11, rows: 8 };
const inGrid = (p) => p[0] >= 0 && p[0] < GRID.cols && p[1] >= 0 && p[1] < GRID.rows;
const RELS = ["parallel", "perpendicular", "neither"];
const dealRel = dealer();

const laPerp = {
  id: "la-perp",
  group: "la-perp",
  label: "Parallel, perpendicular or neither?",
  blurb: "Count the steps: the same way is parallel; swap them and turn one round for perpendicular.",
  heading: "Are the lines a and b parallel, perpendicular or neither?",
  instruction: () =>
    "PARALLEL lines go the same way and never meet. PERPENDICULAR lines meet (or would meet) at a " +
    "right angle. On the dots: count each line's steps across and up. The same steps (or double " +
    "them) — parallel. Swap the two numbers and turn one of them round (3 across, 1 up becomes " +
    "1 across, 3 down) — perpendicular.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const rel = dealRel(r, RELS, i);
    for (let g = 0; g < 500; g++) {
      const v = [r.int(1, 4), r.int(-3, 3)];
      if (v[1] === 0 && tier(o) !== "gentle" && r.chance(0.5)) continue;
      let w;
      if (rel === "parallel") w = r.chance(0.5) ? v : [v[0] * 2, v[1] * 2];
      else if (rel === "perpendicular") w = r.chance(0.5) ? [-v[1], v[0]] : [v[1], -v[0]];
      else w = [r.int(1, 4), r.int(-3, 3)];
      if (!w[0] && !w[1]) continue;
      const cross = v[0] * w[1] - v[1] * w[0];
      const dot = v[0] * w[0] + v[1] * w[1];
      if (rel === "neither" && (cross === 0 || dot === 0)) continue;
      const a = [r.int(0, GRID.cols - 1), r.int(0, GRID.rows - 1)];
      const b = [a[0] + v[0], a[1] - v[1]];
      const c = [r.int(0, GRID.cols - 1), r.int(0, GRID.rows - 1)];
      const d = [c[0] + w[0], c[1] - w[1]];
      if (![a, b, c, d].every(inGrid)) continue;
      if (Math.min(...[a, b].map((p) => Math.min(...[c, d].map((q) => Math.hypot(p[0] - q[0], p[1] - q[1]))))) < 1) continue;
      return { rel, segs: [[a, b], [c, d]] };
    }
    return { rel: "parallel", segs: [[[1, 5], [4, 3]], [[5, 7], [8, 5]]] };
  },
  render(item) {
    return art(dotGridSvg({ ...GRID, segs: item.segs, names: ["a", "b"] })) + tick(...RELS);
  },
  key(item) {
    return [want.tick(RELS.indexOf(item.rel))];
  },
  answer(item) {
    return [item.rel];
  },
};

/* ═══ angles written with x ════════════════════════════════════════════════*/

const expr = (c, k) => {
  const x = c === 1 ? "x" : `${c}x`;
  if (!k) return x;
  return k > 0 ? `${x} + ${k}` : `${x} − ${-k}`;
};

const laAlgebra = {
  id: "la-algebra",
  group: "la-algebra",
  label: "Angles written with x",
  blurb: "Add the expressions, make them 180 (or 360), solve for x.",
  heading: "Find x, then the angle asked for",
  instruction: () =>
    "The angles are written with x. If they are on a straight line, they add up to 180; round a " +
    "point, 360. Add the expressions, set the total equal to 180 (or 360), and solve for x. Then " +
    "put x back in to find the angle.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const point = tier(o) !== "gentle" && r.chance(0.5);
    const total = point ? 360 : 180;
    const n = point ? 3 : 2 + (tier(o) === "stretch" && r.chance(0.5) ? 1 : 0);
    for (let g = 0; g < 400; g++) {
      const x = stepped(r, o, 10, 40);
      const cs = [...Array(n)].map(() => r.int(1, 3));
      const ks = cs.map(() => r.pick([0, 0, 10, 20, -10, 30]));
      const partial = cs.slice(0, -1).reduce((s, c, j) => s + c * x + ks[j], 0);
      const last = total - partial;
      ks[n - 1] = last - cs[n - 1] * x;
      const sizes = cs.map((c, j) => c * x + ks[j]);
      if (sizes.every((s) => s >= 25 && s <= (point ? 175 : 150)) && Math.abs(ks[n - 1]) <= 60) {
        const ask2 = r.int(0, n - 1);
        return { x, cs, ks, sizes, point, total, ask2, t: turnOf(r, o) };
      }
    }
    return { x: 30, cs: [2, 3], ks: [0, 30], sizes: [60, 120], point: false, total: 180, ask2: 0, t: 0 };
  },
  render(item) {
    const labels = item.cs.map((c, j) => `${expr(c, item.ks[j])}`);
    const { rays, arcs } = fan(item.t, item.sizes, -1, labels);
    const fig = item.point
      ? raysSvg({ rays, arcs, box: FIG })
      : raysSvg({ lines: [item.t], rays: rays.slice(0, -1), arcs, box: FIG });
    return side(art(fig), ask(deg("x =")) + ask(deg(`${labels[item.ask2]} =`)));
  },
  worked() {
    return worked("One done for you", say(
      "On a straight line: 2x + 3x + 30 = 180, so 5x = 150 and x = <b>30</b>. The angle 3x + 30 is " +
      "3 × 30 + 30 = <b>120°</b>."));
  },
  key(item) {
    return [want.num(item.x), want.num(item.sizes[item.ask2])];
  },
  answer(item) {
    const sum = item.cs.map((c, j) => expr(c, item.ks[j])).join(" + ");
    return [`${sum} = ${item.total}, so x = ${item.x}; that angle is ${item.sizes[item.ask2]}°`];
  },
};

/* ═══ give the reason ══════════════════════════════════════════════════════*/

const SCENES = {
  line(r, o) {
    const [a, b] = parts(r, o, 2, 180); const t = turnOf(r, o);
    return { fig: { lines: [t], rays: [t + a], arcs: [{ from: t, to: t + a, label: `${a}°` }, { from: t + a, to: t + 180, label: `${b}°` }] }, fact: `The angle marked ${b}° is ${b}° because…` };
  },
  point(r, o) {
    const s = parts(r, o, 3, 360, 60, 170); const t = turnOf(r, o);
    const { rays, arcs } = fan(t, s, -1, s.map((v) => `${v}°`));
    return { fig: { rays, arcs }, fact: `The angle marked ${s[2]}° is ${s[2]}° because…` };
  },
  vo(r, o) {
    const a = stepped(r, o, 30, 150); const t = turnOf(r, o);
    return { fig: { lines: [t, t + a], arcs: [{ from: t, to: t + a, label: `${a}°` }, { from: t + 180, to: t + 180 + a, label: `${a}°` }] }, fact: `The second ${a}° angle is ${a}° because…` };
  },
  right(r, o) {
    const [a, b] = parts(r, o, 2, 90, 20, 70); const t = turnOf(r, o);
    return { fig: { rays: [t, t + a, t + 90], arcs: [{ from: t, to: t + a, label: `${a}°` }, { from: t + a, to: t + 90, label: `${b}°` }, { from: t, to: t + 90, right: true, label: "" }] }, fact: `The angle marked ${b}° is ${b}° because…` };
  },
};
const dealScene = dealer();

const laReason = {
  id: "la-reason",
  group: "la-reason",
  label: "Which fact?",
  blurb: "The angle is worked out. Say which fact did it.",
  heading: "Tick the reason",
  instruction: () =>
    "Each angle has already been found. Tick the fact that gives it. In an exam a reason earns " +
    "marks of its own.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const kind = dealScene(r, Object.keys(SCENES), i);
    return { kind, scene: SCENES[kind](r, o), order: r.shuffle(Object.keys(REASONS)) };
  },
  render(item) {
    return side(art(raysSvg({ ...item.scene.fig, box: FIG })), ask(item.scene.fact) + reasonTick(item.order));
  },
  key(item) {
    return [want.tick(item.order.indexOf(item.kind))];
  },
  answer(item) {
    return [REASONS[item.kind]];
  },
};

const laTwoStep = {
  id: "la-two-step",
  group: "la-reason",
  label: "Two steps, a reason each",
  blurb: "A straight line first, then vertically opposite.",
  heading: "Find x and y. Give a reason for each.",
  instruction: () =>
    "Two straight lines cross, and a third line comes out of the crossing. Find x first, then use " +
    "what you know to find y. Write the reason for each step on its line.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const [a, b, x] = parts(r, o, 3, 180, 30, 100);
    return { a, b, x, t: turnOf(r, o) };
  },
  render(item) {
    const { a, b, t } = item;
    const theta = a + b;
    const arcs = [
      { from: t, to: t + a, label: `${a}°` }, { from: t + a, to: t + theta, label: `${b}°` },
      { from: t + theta, to: t + 180, label: "x" }, { from: t + 180, to: t + 180 + theta, label: "y" },
    ];
    return side(art(raysSvg({ lines: [t, t + theta], rays: [t + a], arcs, box: { w: 64, h: 50 } })),
      ask(deg("x =")) + ask("because") + ask(line()) + ask(deg("y =")) + ask("because") + ask(line()));
  },
  worked() {
    return worked("One done for you", say(
      "30° + 50° + x are on one straight line, so x = 180 − 80 = <b>100°</b> (angles on a straight " +
      "line add up to 180°). y is opposite the whole 80° angle, so y = <b>80°</b> (vertically " +
      "opposite angles are equal)."));
  },
  key(item) {
    return [want.num(item.x), want.free(), want.num(item.a + item.b), want.free()];
  },
  answer(item) {
    return [`x = 180 − ${item.a} − ${item.b} = ${item.x}° (straight line); y = ${item.a} + ${item.b} = ${item.a + item.b}° (vertically opposite)`];
  },
};

export const LA_EXERCISES = [
  laPath,
  laNameAngle,
  laKind, laReflex,
  laStraight,
  laPoint,
  laThree,
  laCompSupp, laRightSplit,
  laPerp,
  laAlgebra,
  laReason, laTwoStep,
];
