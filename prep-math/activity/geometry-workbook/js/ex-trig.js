/* ============================================================================
   Geometry Workbook — CHAPTER 15: SINE, COSINE AND TANGENT
   ----------------------------------------------------------------------------
   In a right-angled triangle, once an angle is fixed the SHAPE is fixed, so
   the sides are always in the same proportion. Those proportions have names.

     name the sides        from the marked angle: opposite, adjacent, and the
                           hypotenuse (always facing the right angle)
     the three ratios      sin = opp ÷ hyp, cos = adj ÷ hyp, tan = opp ÷ adj
     which ratio           the two sides in the question choose it: SOH CAH TOA
     find a side           the ratio's value times the side you know
     find an angle         work the ratio out, and look it up
     in the world          ladders, shadows, kites — angles of elevation

   The numbers are kept exact: every triangle is a whole-number one (3-4-5 and
   its relatives), and the only angles used are the ones with tidy ratios:

       angle   30°    37°    45°    53°    60°
       sin     0.5    0.6     —     0.8     —
       cos      —     0.8     —     0.6    0.5
       tan      —     0.75    1      —      —

   (37° and 53° are the angles of a 3-4-5 triangle, to the nearest degree.)
   Each question prints the value it needs.
   ========================================================================== */

import { levelOf } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const art = (svg) => `<div class="gw-art">${svg}</div>`;
const side = (figure, words) => `<div class="gw-side">${figure}<div class="gw-lines">${words}</div></div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const tier = (o) => levelOf(o).id;
const f = (n) => (+n).toFixed(2);
const INK = "#2a2723";
/** 15 × 0.6 is 9.000000000000002 to a computer: two places is all these need. */
const tidy = (v) => Math.round(v * 100) / 100;

/**
 * A right-angled triangle, the right angle bottom-right, the marked angle
 * bottom-left: `adj` along the bottom, `opp` up the right. Labels are what is
 * written on each side (a number, a letter, or nothing).
 */
function triSvg({ adj, opp, labels = {}, angle = "θ" }) {
  const k = Math.min(46 / adj, 34 / opp);
  const w = adj * k, h = opp * k;
  const A = [8, 8 + h], B = [8 + w, 8 + h], C = [8 + w, 8];
  const t = (x, y, s, anchor = "middle", col = INK) => `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" font-size="3.6" font-weight="700" fill="${col}">${s}</text>`;
  let s = `<path d="M${f(A[0])} ${f(A[1])}L${f(B[0])} ${f(B[1])}L${f(C[0])} ${f(C[1])}Z" fill="#bfe3ff" stroke="${INK}" stroke-width="0.55" stroke-linejoin="round"/>`;
  s += `<path d="M${f(B[0] - 3)} ${f(B[1])}v-3h3" fill="none" stroke="${INK}" stroke-width="0.4"/>`;
  const ang = Math.atan2(h, w);
  s += `<path d="M${f(A[0] + 7)} ${f(A[1])}A7 7 0 0 0 ${f(A[0] + 7 * Math.cos(ang))} ${f(A[1] - 7 * Math.sin(ang))}" fill="none" stroke="#c0453f" stroke-width="0.5"/>`;
  s += t(A[0] + 10.5 * Math.cos(ang / 2), A[1] - 10.5 * Math.sin(ang / 2) + 1.2, angle, "middle", "#c0453f");
  if (labels.adj != null) s += t((A[0] + B[0]) / 2, A[1] + 5, labels.adj);
  if (labels.opp != null) s += t(B[0] + 2, (B[1] + C[1]) / 2 + 1.2, labels.opp, "start");
  if (labels.hyp != null) s += t((A[0] + C[0]) / 2 - 2.4, (A[1] + C[1]) / 2 - 1.6, labels.hyp, "end");
  return `<svg class="gw-fig" viewBox="0 0 ${f(w + 24)} ${f(h + 18)}" width="${f(w + 24)}mm" height="${f(h + 18)}mm" role="img" aria-label="A right-angled triangle">${s}</svg>`;
}

/** Whole-number right-angled triangles: [opposite, adjacent, hypotenuse]. */
const TRIPLES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [9, 12, 15], [12, 9, 15]];
const tripleOf = (r, o) => { const [opp, adj, hyp] = r.pick(tier(o) === "gentle" ? TRIPLES.slice(0, 4) : TRIPLES); return { opp, adj, hyp }; };

/* the angles with tidy ratios: [degrees, ratio, value, the side it gives, the side it needs] */
const TIDY = [
  [30, "sin", 0.5, "opp", "hyp"], [60, "cos", 0.5, "adj", "hyp"], [45, "tan", 1, "opp", "adj"],
  [37, "sin", 0.6, "opp", "hyp"], [37, "cos", 0.8, "adj", "hyp"], [37, "tan", 0.75, "opp", "adj"],
  [53, "sin", 0.8, "opp", "hyp"], [53, "cos", 0.6, "adj", "hyp"],
];
const NAME = { opp: "opposite", adj: "adjacent", hyp: "hypotenuse" };

export const TG_GROUPS = [
  { id: "tg-ratio", chapter: "Chapter 15 · Sine, cosine and tangent", label: "The three ratios", blurb: "Opposite, adjacent, hypotenuse — and the three ways to divide them." },
  { id: "tg-use", label: "Using the ratios", blurb: "Find a side, find an angle, and solve a story." },
];

const tgSides = {
  id: "tg-sides",
  group: "tg-ratio",
  label: "Name the sides",
  blurb: "From the marked angle: opposite, adjacent, hypotenuse.",
  heading: "Trigonometry: naming the sides",
  instruction: () =>
    "The HYPOTENUSE is the longest side, facing the right angle. The other two are named from the marked angle θ: " +
    "the OPPOSITE side is across the triangle from θ and does not touch it; the ADJACENT side is the one next to θ " +
    "(that is not the hypotenuse). Write the length of each.",
  cols: 1,
  defaultCount: 3,
  make: (r, o) => tripleOf(r, o),
  render: (it) => side(art(triSvg({ adj: it.adj, opp: it.opp, labels: { adj: it.adj, opp: it.opp, hyp: it.hyp } })),
    ask(`opposite = ${box()} &nbsp; adjacent = ${box()} &nbsp; hypotenuse = ${box()}`)),
  worked: () => worked(side(art(triSvg({ adj: 4, opp: 3, labels: { adj: 4, opp: 3, hyp: 5 } })),
    say("5 faces the right angle: the hypotenuse. 3 is across from θ: the opposite. 4 is beside θ: the adjacent."))),
  key: (it) => [want.num(it.opp), want.num(it.adj), want.num(it.hyp)],
  answer: (it) => [`opp ${it.opp}, adj ${it.adj}, hyp ${it.hyp}`],
};

const tgRatios = {
  id: "tg-ratios",
  group: "tg-ratio",
  label: "Write the three ratios",
  blurb: "sin = opp ÷ hyp, cos = adj ÷ hyp, tan = opp ÷ adj.",
  heading: "Trigonometry: sine, cosine and tangent",
  instruction: () =>
    "The three ratios of an angle θ are: sin θ = opposite ÷ hypotenuse, cos θ = adjacent ÷ hypotenuse, and tan θ = " +
    "opposite ÷ adjacent. Remember them as SOH CAH TOA. Write each as a fraction, like 3/5.",
  cols: 1,
  defaultCount: 3,
  make: (r, o) => tripleOf(r, o),
  render: (it) => side(art(triSvg({ adj: it.adj, opp: it.opp, labels: { adj: it.adj, opp: it.opp, hyp: it.hyp } })),
    ask(`sin θ = ${box()} &nbsp; cos θ = ${box()} &nbsp; tan θ = ${box()}`)),
  worked: () => worked(side(art(triSvg({ adj: 4, opp: 3, labels: { adj: 4, opp: 3, hyp: 5 } })),
    say("sin θ = opp ÷ hyp = 3/5. cos θ = adj ÷ hyp = 4/5. tan θ = opp ÷ adj = 3/4."))),
  key: (it) => [want.frac(it.opp, it.hyp), want.frac(it.adj, it.hyp), want.frac(it.opp, it.adj)],
  answer: (it) => [`sin ${it.opp}/${it.hyp}, cos ${it.adj}/${it.hyp}, tan ${it.opp}/${it.adj}`],
};

const RATIOS = ["sin", "cos", "tan"];
const PAIRS = [["opp", "hyp", 0], ["adj", "hyp", 1], ["opp", "adj", 2]];

const tgWhich = {
  id: "tg-which",
  group: "tg-ratio",
  label: "Which ratio?",
  blurb: "The two sides in the question choose it: SOH CAH TOA.",
  heading: "Trigonometry: choosing the ratio",
  instruction: () =>
    "Look at which TWO sides the question is about — the one you know and the one you want. Opposite and " +
    "Hypotenuse: Sine (SOH). Adjacent and Hypotenuse: Cosine (CAH). Opposite and Adjacent: Tangent (TOA). The " +
    "side marked x is the one wanted.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const T = tripleOf(r, o);
    const [p, q, i] = r.pick(PAIRS);
    const [known, wanted] = r.chance(0.5) ? [p, q] : [q, p];
    return { ...T, known, wanted, i };
  },
  render(it) {
    const labels = { [it.known]: it[it.known], [it.wanted]: "x" };
    return side(art(triSvg({ adj: it.adj, opp: it.opp, labels })),
      ask(`The ${NAME[it.known]} is known and the ${NAME[it.wanted]} is wanted.`) + ask(`Use ${tick(...RATIOS)}`));
  },
  worked: () => worked(say("The hypotenuse is known and the opposite is wanted: O and H — that is SOH, the sine.")),
  key: (it) => [want.tick(it.i)],
  answer: (it) => [RATIOS[it.i]],
};

const tgSide = {
  id: "tg-side",
  group: "tg-use",
  label: "Find a side",
  blurb: "The ratio's value × the side you know.",
  heading: "Trigonometry: finding a side",
  instruction: () =>
    "sin θ = opp ÷ hyp turns round to opp = hyp × sin θ. In the same way adj = hyp × cos θ and opp = adj × tan θ. " +
    "Pick the ratio that joins the side you know to the side marked x, and multiply by the value given.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const pool = t === "gentle" ? TIDY.filter((x) => x[2] === 0.5 || x[2] === 1) : TIDY;
    const [deg, ratio, val, gives, needs] = r.pick(pool);
    const known = (val === 0.75 ? 4 : val === 1 ? 1 : val === 0.5 ? 2 : 5) * r.int(2, t === "gentle" ? 6 : 9);
    const x = tidy(known * val);
    /* the triangle's shape, for the drawing */
    const shape = deg === 30 ? [1, 1.73] : deg === 60 ? [1.73, 1] : deg === 45 ? [1, 1] : deg === 37 ? [3, 4] : [4, 3];
    return { deg, ratio, val, gives, needs, known, x, shape };
  },
  render(it) {
    const labels = { [it.needs]: it.known, [it.gives]: "x" };
    return side(art(triSvg({ opp: it.shape[0], adj: it.shape[1], labels, angle: `${it.deg}°` })),
      ask(`${it.ratio} ${it.deg}° = ${it.val}`) + ask(`x = ${box()}`));
  },
  worked: () => worked(say("The hypotenuse is 12 and the opposite is wanted, with sin 30° = 0.5: x = 12 × 0.5 = 6.")),
  key: (it) => [want.num(it.x)],
  answer: (it) => [`${it.known} × ${it.val} = ${it.x}`],
};

const TABLE = "sin 30° = 0.5, sin 37° = 0.6, sin 53° = 0.8, cos 37° = 0.8, cos 53° = 0.6, cos 60° = 0.5, tan 37° = 0.75, tan 45° = 1";

const tgAngle = {
  id: "tg-angle",
  group: "tg-use",
  label: "Find an angle",
  blurb: "Work the ratio out, then look it up.",
  heading: "Trigonometry: finding an angle",
  instruction: () =>
    `Two sides are given. Choose the ratio that uses those two, divide to get its value, and find which angle has ` +
    `that value: ${TABLE}.`,
  cols: 1,
  defaultCount: 3,
  make(r) {
    const [deg, ratio, val, gives, needs] = r.pick(TIDY);
    const known = (val === 0.75 ? 4 : val === 1 ? 1 : val === 0.5 ? 2 : 5) * r.int(2, 8);
    const shape = deg === 30 ? [1, 1.73] : deg === 60 ? [1.73, 1] : deg === 45 ? [1, 1] : deg === 37 ? [3, 4] : [4, 3];
    return { deg, ratio, val, gives, needs, known, other: tidy(known * val), shape };
  },
  render(it) {
    const labels = { [it.needs]: it.known, [it.gives]: it.other };
    return side(art(triSvg({ opp: it.shape[0], adj: it.shape[1], labels })),
      ask(`${it.ratio} θ = ${box()} &nbsp; so θ = ${box()}°`));
  },
  worked: () => worked(say("Opposite 5 and hypotenuse 10: sin θ = 5 ÷ 10 = 0.5, and the angle whose sine is 0.5 is 30°.")),
  key: (it) => [want.num(it.val), want.num(it.deg)],
  answer: (it) => [`${it.ratio} θ = ${it.val}; θ = ${it.deg}°`],
};

const STORIES = [
  (r) => { const L = 5 * r.int(2, 6); return { text: `A ladder ${L} m long leans against a wall, making an angle of 37° with the ground. How high up the wall does it reach? (sin 37° = 0.6)`, v: tidy(L * 0.6), how: `${L} × 0.6` }; },
  (r) => { const L = 5 * r.int(2, 6); return { text: `A ladder ${L} m long makes an angle of 37° with the ground. How far is its foot from the wall? (cos 37° = 0.8)`, v: tidy(L * 0.8), how: `${L} × 0.8` }; },
  (r) => { const d = r.int(4, 30); return { text: `From a point ${d} m from the foot of a tree, the angle of elevation of its top is 45°. How tall is the tree? (tan 45° = 1)`, v: d, how: `${d} × 1` }; },
  (r) => { const d = 4 * r.int(2, 10); return { text: `A flagpole casts a shadow ${d} m long when the sun's angle of elevation is 37°. How tall is the pole? (tan 37° = 0.75)`, v: tidy(d * 0.75), how: `${d} × 0.75` }; },
  (r) => { const L = 2 * r.int(5, 25); return { text: `A kite is flying on ${L} m of string, which makes 30° with the ground. How high is the kite? (sin 30° = 0.5)`, v: L / 2, how: `${L} × 0.5` }; },
  (r) => { const L = 2 * r.int(5, 20); return { text: `A ramp ${L} m long rises at 60° to the ground. How far along the ground does it reach? (cos 60° = 0.5)`, v: L / 2, how: `${L} × 0.5` }; },
];

const tgWord = {
  id: "tg-word",
  group: "tg-use",
  label: "Ladders, shadows and kites",
  blurb: "Draw the right-angled triangle hidden in the story.",
  heading: "Trigonometry in the world",
  instruction: () =>
    "Draw the triangle first: the ground and a wall (or a pole, or a tree) make the right angle. The ANGLE OF " +
    "ELEVATION is measured up from the ground. Mark the side you know and the side you want, choose the ratio, " +
    "and use the value given.",
  cols: 1,
  defaultCount: 3,
  make: (r) => r.pick(STORIES)(r),
  render: (it) => ask(`${it.text} ${box()} m`),
  worked: () => worked(say("A 10 m ladder at 37° to the ground: the ladder is the hypotenuse, and the height is opposite the angle. Height = 10 × sin 37° = 10 × 0.6 = 6 m.")),
  key: (it) => [want.num(it.v)],
  answer: (it) => [`${it.how} = ${it.v} m`],
};

export const TG_EXERCISES = [tgSides, tgRatios, tgWhich, tgSide, tgAngle, tgWord];
