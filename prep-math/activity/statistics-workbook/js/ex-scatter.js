/* ============================================================================
   Statistics Workbook — CHAPTER 5: Scatter graphs
   ----------------------------------------------------------------------------
   A scatter graph is for two things measured about the SAME people (or days,
   or cars) — is there a link between them? The chapter goes:

     plotting points      a table of pairs; across to one, up to the other, a
                          cross — tapped on screen (dotplot.js)
     reading one          how many points, one point's other value, how many
                          above a line
     correlation          going up together (positive), one up as the other
                          goes down (negative), no pattern (none); (Middle+)
                          strong or weak, and which pairs of things go together
     line of best fit     choose the best of three; (Middle+) estimate from it
                          both ways, and rule your own with the workbook's ruler
     careful!             an outlier that does not fit; a line used far outside
                          its data; and a link that is not a cause

   The data lives in grid units, 0 to 10 across and up; each context says what
   a unit is worth at each level (a mark out of 10, 20 or 100).
   ========================================================================== */

import { scatterSvg, valueAt, unitOf } from "./scatterart.js";
import { tableHtml } from "./pictoart.js";
import { levelOf, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const art = (html) => `<div class="sw-art">${html}</div>`;
const side = (figure, words) => `<div class="sw-side">${figure}<div class="sw-lines">${words}</div></div>`;
const pair = (a, b) => `<div class="sw-pair">${a}${b}</div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;
const LV = { gentle: 0, middle: 1, stretch: 2 };

/* ── two things measured together ──────────────────────────────────────── */

/* sign: +1 they go up together, −1 one goes down as the other goes up, 0 no link.
   y.step is per level: Gentle, Middle, Stretch. */
const SDATA = [
  { title: "Revision and test marks", x: { from: 0, step: 1, label: "hours of revision" }, y: { from: 0, step: [1, 2, 10], label: "test mark" }, sign: 1, xw: "the hours of revision", yw: "the mark" },
  { title: "Temperature and cold drinks sold", x: { from: 20, step: 2, label: "temperature in °C" }, y: { from: 0, step: [1, 2, 10], label: "drinks sold" }, sign: 1, xw: "the temperature", yw: "the drinks sold" },
  { title: "Height and arm span", x: { from: 120, step: 5, label: "height in cm" }, y: { from: 120, step: [5, 5, 5], label: "arm span in cm" }, sign: 1, xw: "the height", yw: "the arm span" },
  { title: "Age of a car and its value", x: { from: 0, step: 1, label: "age in years" }, y: { from: 0, step: [1, 2, 5], label: "value in ₦ million" }, sign: -1, xw: "the age", yw: "the value" },
  { title: "Hours of TV and hours of sleep", x: { from: 0, step: 1, label: "hours of TV" }, y: { from: 0, step: [1, 1, 1], label: "hours of sleep" }, sign: -1, xw: "the TV", yw: "the sleep" },
  { title: "Shoe size and test marks", x: { from: 30, step: 1, label: "shoe size" }, y: { from: 0, step: [1, 2, 10], label: "test mark" }, sign: 0, xw: "the shoe size", yw: "the mark" },
  { title: "Distance from school and test marks", x: { from: 0, step: 1, label: "km from school" }, y: { from: 0, step: [1, 2, 10], label: "test mark" }, sign: 0, xw: "the distance", yw: "the mark" },
];

const axesOf = (d, o) => [d.x, { ...d.y, step: d.y.step[LV[tier(o)] ?? 0] }];
const deal = dealer();
const contextFor = (r, i, sign = null) => {
  const list = sign === null ? SDATA : SDATA.filter((d) => d.sign === sign);
  return deal(r, list, i);
};

/** Pearson's r of a set of points: +1 a perfect rising line, −1 falling, 0 nothing. */
export function corrOf(pts) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0; let sxx = 0; let syy = 0;
  pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; });
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

/** The line of best fit (least squares): y = a + b·x, in grid units. */
export function fitOf(pts) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0; let sxx = 0;
  pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; });
  const b = sxx ? sxy / sxx : 0;
  return { a: my - b * mx, b };
}

/**
 * `n` points in grid units, every x different, with this link:
 *   strength "strong" (|r| ≥ 0.85), "weak" (0.35–0.7) or "none" (|r| < 0.2);
 *   every x at most `span`.
 */
export function pointsOf(r, n, sign, strength = "strong", span = 10) {
  for (let g = 0; g < 2000; g++) {
    const xs = r.shuffle(Array.from({ length: span + 1 }, (_, u) => u)).slice(0, n).sort((a, b) => a - b);
    const noise = strength === "weak" ? 3 : 1;
    const pts = xs.map((x) => {
      const mid = sign > 0 ? 1 + 0.8 * x : sign < 0 ? 9 - 0.8 * x : r.int(1, 9);
      const y = sign === 0 ? mid : Math.round(mid) + r.int(-noise, noise);
      return [x, Math.max(0, Math.min(10, y))];
    });
    const c = corrOf(pts);
    const ok = sign === 0 ? Math.abs(c) < 0.2
      : strength === "weak" ? Math.sign(c) === sign && Math.abs(c) >= 0.35 && Math.abs(c) <= 0.7
        : Math.sign(c) === sign && Math.abs(c) >= 0.85;
    if (ok) return pts;
  }
  return Array.from({ length: n }, (_, i) => [i, sign >= 0 ? i : 10 - i]);
}

const nOf = (o) => ({ gentle: 6, middle: 8, stretch: 10 }[tier(o)] || 6);

export const SC_GROUPS = [
  { id: "sc-plot", chapter: "Chapter 5 · Scatter graphs", label: "Plotting points", blurb: "Across to one, up to the other, a cross — tapped on screen." },
  { id: "sc-read", label: "Reading a scatter graph", blurb: "Each cross is two readings about the same one." },
  { id: "sc-corr", label: "Correlation", blurb: "Up together, one up as the other comes down, or no pattern at all." },
  { id: "sc-fit", label: "The line of best fit", blurb: "Through the middle of the crosses — and estimating from it." },
  { id: "sc-solve", label: "Careful with scatter graphs", blurb: "An outlier, a line used too far, a link that is not a cause." },
];

/* ═══ 1. plotting points ═══════════════════════════════════════════════════*/

const scPlot = {
  id: "sc-plot",
  group: "sc-plot",
  label: "Plot the points",
  blurb: "A table of pairs: a cross for each one.",
  heading: "Plot the scatter graph",
  instruction: () =>
    "Each row of the table is one person (or one day): two readings about the same one. Go ALONG the bottom to " +
    "the first reading and UP to the second, and mark a small cross. On screen, tap the place — tap it again to " +
    "take the cross off. Then look at the crosses: is there a pattern?",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const d = contextFor(r, i);
    const n = { gentle: 5, middle: 6, stretch: 8 }[tier(o)] || 5;
    const strength = d.sign === 0 ? "none" : "strong";
    return { d: SDATA.indexOf(d), pts: pointsOf(r, n, d.sign, strength) };
  },
  render(item, o) {
    const d = SDATA[item.d];
    const [xa, ya] = axesOf(d, o);
    const table = tableHtml([d.x.label, d.y.label], item.pts.map(([u, v]) => [String(valueAt(xa, u)), String(valueAt(ya, v))]));
    const fig = scatterSvg({ xAxis: xa, yAxis: ya, title: d.title, build: true });
    return pair(`<div>${table}${ask(`As ${d.xw} goes up, ${d.yw}`)}${tick("goes up", "goes down", "no pattern")}</div>`, art(fig));
  },
  worked() {
    return worked(say("Tobi revised for 3 hours and scored 5. Go along the bottom to 3, then straight up to the 5 " +
      "line, and mark a cross where they meet. Every row of the table is one cross."));
  },
  key(item, o) {
    const d = SDATA[item.d];
    const [xa, ya] = axesOf(d, o);
    return [
      want.dots({ points: item.pts.map(([u, v]) => [valueAt(xa, u), valueAt(ya, v)]), says: `${item.pts.length} crosses, one for each row` }),
      want.tick(d.sign > 0 ? 0 : d.sign < 0 ? 1 : 2),
    ];
  },
  answer(item, o) {
    const [xa, ya] = axesOf(SDATA[item.d], o);
    return [item.pts.map(([u, v]) => `(${valueAt(xa, u)}, ${valueAt(ya, v)})`).join(" ")];
  },
};

/* ═══ 2. reading a scatter graph ═══════════════════════════════════════════*/

const scRead = {
  id: "sc-read",
  group: "sc-read",
  label: "Read the scatter graph",
  blurb: "How many; one cross's other reading; how many above a line.",
  heading: "Read the scatter graph",
  instruction: () =>
    "Every cross is one person. To read a cross, go straight DOWN to the bottom scale for one reading and " +
    "straight ACROSS to the side scale for the other.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const d = contextFor(r, i + 1);
    const pts = pointsOf(r, nOf(o), d.sign, d.sign === 0 ? "none" : "strong");
    const which = r.int(0, pts.length - 1);
    /* a line no cross sits on, with some above it and some not */
    const ys = pts.map((p) => p[1]);
    const cut = [3, 4, 5, 6, 7].find((c) => !ys.includes(c) && ys.some((y) => y > c) && ys.some((y) => y < c)) ?? null;
    return { d: SDATA.indexOf(d), pts, which, cut };
  },
  render(item, o) {
    const d = SDATA[item.d];
    const [xa, ya] = axesOf(d, o);
    const [u] = item.pts[item.which];
    return side(art(scatterSvg({ pts: item.pts, xAxis: xa, yAxis: ya, title: d.title })),
      ask(`How many crosses are there? ${box()}`) +
      ask(`The one at ${valueAt(xa, u)} along: ${box()} up the side`) +
      (item.cut !== null ? ask(`How many are more than ${valueAt(ya, item.cut)}? ${box()}`) : ""));
  },
  key(item, o) {
    const [, ya] = axesOf(SDATA[item.d], o);
    return [
      want.num(item.pts.length),
      want.num(valueAt(ya, item.pts[item.which][1])),
      ...(item.cut !== null ? [want.num(item.pts.filter((p) => p[1] > item.cut).length)] : []),
    ];
  },
  answer(item, o) {
    const [, ya] = axesOf(SDATA[item.d], o);
    return [`${item.pts.length}; ${valueAt(ya, item.pts[item.which][1])}`];
  },
};

/* ═══ 3. correlation ═══════════════════════════════════════════════════════*/

const KIND_G = ["Positive", "Negative", "No correlation"];
const KIND_M = ["Strong positive", "Weak positive", "Strong negative", "Weak negative", "No correlation"];
let kindTurn = 0;

const scKind = {
  id: "sc-kind",
  group: "sc-corr",
  label: "What kind of correlation?",
  blurb: "Up together, one down as the other goes up, or no pattern.",
  heading: "Name the correlation",
  instruction: (o) =>
    "If the crosses go UP from left to right, the two go up together: positive correlation. If they go DOWN, one " +
    "goes down as the other goes up: negative correlation. Scattered all over, no pattern: no correlation." +
    (tier(o) === "gentle" ? "" : " Close to a straight line is strong; a loose band is weak."),
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const gentle = tier(o) === "gentle";
    if (i === 0) kindTurn = r.int(0, 4);
    const pick = gentle ? (i + kindTurn) % 3 : (i + kindTurn) % 5;
    const [sign, strength] = gentle ? [[1, "strong"], [-1, "strong"], [0, "none"]][pick]
      : [[1, "strong"], [1, "weak"], [-1, "strong"], [-1, "weak"], [0, "none"]][pick];
    const d = contextFor(r, i, sign);
    return { d: SDATA.indexOf(d), pts: pointsOf(r, gentle ? 8 : 10, sign, strength), pick, gentle };
  },
  render(item, o) {
    const d = SDATA[item.d];
    const [xa, ya] = axesOf(d, o);
    return art(scatterSvg({ pts: item.pts, xAxis: xa, yAxis: ya, title: d.title, cell: 4.4 })) +
      tick(...(item.gentle ? KIND_G : KIND_M)) +
      ask(`As ${d.xw} goes up, ${d.yw}`) + tick("goes up", "goes down", "no pattern");
  },
  worked() {
    return worked(say("The crosses climb from bottom left to top right: the more hours of revision, the higher " +
      "the mark, as a rule. That is positive correlation. They lie close to a straight line, so it is strong."));
  },
  key(item) {
    const sign = SDATA[item.d].sign;
    return [want.tick(item.pick), want.tick(sign > 0 ? 0 : sign < 0 ? 1 : 2)];
  },
  answer(item) {
    return [(item.gentle ? KIND_G : KIND_M)[item.pick]];
  },
};

const PAIRS = {
  1: ["Temperature and ice creams sold", "A child's age and their height", "Distance driven and fuel used", "Hours of practice and goals scored"],
  "-1": ["Age of a car and its value", "Outside temperature and hot drinks sold", "Speed and the time a journey takes", "Hours of TV and time spent reading"],
  0: ["Shoe size and test mark", "Birthday month and pocket money", "House number and height", "Hair length and times-table score"],
};

const scPairs = {
  id: "sc-pairs",
  group: "sc-corr",
  label: "Which things go together?",
  blurb: "Without a graph: would these show positive, negative or no correlation?",
  heading: "What correlation would you expect?",
  instruction: () =>
    "Think about each pair measured for lots of people (or days). As the first goes up, would the second go up " +
    "too, go down, or neither?",
  cols: 1,
  defaultCount: 1,
  make(r) {
    const three = r.shuffle([1, -1, 0]).map((s) => ({ s, t: r.pick(PAIRS[s]) }));
    return { three };
  },
  render(item) {
    return item.three.map(({ t }) => ask(t) + tick("Positive", "Negative", "No correlation")).join("");
  },
  key(item) {
    return item.three.map(({ s }) => want.tick(s > 0 ? 0 : s < 0 ? 1 : 2));
  },
  answer(item) {
    return [item.three.map(({ s }) => (s > 0 ? "positive" : s < 0 ? "negative" : "none")).join(", ")];
  },
};

/* ═══ 4. the line of best fit ══════════════════════════════════════════════*/

const scBest = {
  id: "sc-best",
  group: "sc-fit",
  label: "Choose the line of best fit",
  blurb: "It follows the crosses' direction, with about as many above as below.",
  heading: "Which is the line of best fit?",
  instruction: () =>
    "A line of best fit goes the same way as the crosses, through the middle of them, with about as many " +
    "crosses above it as below. It does not have to go through any cross, or through 0.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const sign = r.pick([1, -1]);
    const d = contextFor(r, i, sign);
    const pts = pointsOf(r, nOf(o), sign, "strong");
    const fit = fitOf(pts);
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const shift = fit.a + 5 * fit.b > 5 ? -3.2 : 3.2;
    const lines = [
      fit,
      { a: fit.a + shift, b: fit.b },                  // the right slope, but all the crosses on one side
      { a: my + fit.b * mx, b: -fit.b },               // through the middle, but the wrong way
    ];
    const order = r.shuffle([0, 1, 2]);
    return { d: SDATA.indexOf(d), pts, lines, order };
  },
  render(item, o) {
    const d = SDATA[item.d];
    const [xa, ya] = axesOf(d, o);
    const lines = item.order.map((l, j) => ({ ...item.lines[l], name: "ABC"[j] }));
    return side(art(scatterSvg({ pts: item.pts, xAxis: xa, yAxis: ya, title: d.title, lines })),
      ask("The line of best fit is") + tick("A", "B", "C"));
  },
  key(item) {
    return [want.tick(item.order.indexOf(0))];
  },
  answer(item) {
    return ["ABC"[item.order.indexOf(0)]];
  },
};

const scEstimate = {
  id: "sc-estimate",
  group: "sc-fit",
  label: "Estimate from the line",
  blurb: "Up to the line and across — or across to the line and down.",
  heading: "Estimate with the line of best fit",
  minLevel: "middle",
  instruction: () =>
    "To estimate the side reading, go up from the bottom to the LINE (not to a cross), then across. To " +
    "estimate the bottom reading, go across to the line, then down. It is an estimate: near enough is right.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const sign = r.pick([1, -1]);
    const d = contextFor(r, i + 1, sign);
    const pts = pointsOf(r, nOf(o), sign, "strong");
    const fit = fitOf(pts);
    const inside = pts.map((p) => p[0]);
    const lo = Math.min(...inside); const hi = Math.max(...inside);
    /* a place on the bottom with no cross, inside the data */
    const free = [];
    for (let u = lo + 1; u < hi; u++) if (!inside.includes(u)) free.push(u);
    const at = free.length ? r.pick(free) : Math.round((lo + hi) / 2);
    /* a side reading the line passes, inside the data, back to the bottom */
    const back = Math.round(fit.a + fit.b * r.pick([lo + 1, hi - 1, Math.round((lo + hi) / 2)]));
    return { d: SDATA.indexOf(d), pts, fit, at, back };
  },
  render(item, o) {
    const d = SDATA[item.d];
    const [xa, ya] = axesOf(d, o);
    return side(art(scatterSvg({ pts: item.pts, xAxis: xa, yAxis: ya, title: d.title, lines: [item.fit] })),
      ask(`At ${valueAt(xa, item.at)} along, about ${box()} up the side`) +
      ask(`${valueAt(ya, item.back)} up the side is about ${box()} along`));
  },
  key(item, o) {
    const [xa, ya] = axesOf(SDATA[item.d], o);
    const y = item.fit.a + item.fit.b * item.at;
    const x = (item.back - item.fit.a) / item.fit.b;
    /* an estimate: within one gridline either way */
    return [want.num(+valueAt(ya, y).toFixed(1), ya.step), want.num(+valueAt(xa, x).toFixed(1), xa.step)];
  },
  answer(item, o) {
    const [xa, ya] = axesOf(SDATA[item.d], o);
    return [`about ${Math.round(valueAt(ya, item.fit.a + item.fit.b * item.at))}; about ${Math.round(valueAt(xa, (item.back - item.fit.a) / item.fit.b))}`];
  },
};

/** Is a ruled line (two snap points) close to the best fit across the data? */
export function fitRight(k1, k2, pts, fit) {
  const [u1, v1] = unitOf(k1);
  const [u2, v2] = unitOf(k2);
  if (u1 === u2) return false;
  const xs = pts.map((p) => p[0]);
  const lo = Math.min(...xs); const hi = Math.max(...xs);
  /* long enough to be a line through the crosses, not a stub */
  if (Math.abs(u2 - u1) < (hi - lo) / 2) return false;
  const at = (u) => v1 + ((v2 - v1) * (u - u1)) / (u2 - u1);
  return [lo, hi].every((u) => Math.abs(at(u) - (fit.a + fit.b * u)) <= 1.5);
}

const scRule = {
  id: "sc-rule",
  group: "sc-fit",
  label: "Draw your own line of best fit",
  blurb: "Rule it through the middle of the crosses — then use it.",
  heading: "Draw the line of best fit",
  minLevel: "middle",
  instruction: () =>
    "Lay your ruler along the crosses, the same way they go, so that about as many are above the ruler as " +
    "below. Rule one straight line across all of them. On screen, drag from one end to the other: the ruler " +
    "snaps to the grid. Then use your line to estimate.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const sign = r.pick([1, -1]);
    const d = contextFor(r, i + 2, sign);
    const pts = pointsOf(r, nOf(o), sign, "strong");
    const xs = pts.map((p) => p[0]);
    const lo = Math.min(...xs); const hi = Math.max(...xs);
    return { d: SDATA.indexOf(d), pts, fit: fitOf(pts), at: r.int(lo + 1, hi - 1) };
  },
  render(item, o) {
    const d = SDATA[item.d];
    const [xa, ya] = axesOf(d, o);
    return side(art(scatterSvg({ pts: item.pts, xAxis: xa, yAxis: ya, title: d.title, rule: true })),
      ask(`From your line: at ${valueAt(xa, item.at)} along, about ${box()} up the side`));
  },
  key(item, o) {
    const [, ya] = axesOf(SDATA[item.d], o);
    return [
      want.draw({
        says: `a straight line through the middle of the crosses, going ${item.fit.b > 0 ? "up" : "down"}`,
        check: (lines) => {
          const real = lines.filter(([a, b]) => a !== b);
          return real.length === 1 && fitRight(real[0][0], real[0][1], item.pts, item.fit);
        },
      }),
      want.num(+valueAt(ya, item.fit.a + item.fit.b * item.at).toFixed(1), ya.step * 1.5),
    ];
  },
  answer(item, o) {
    const [, ya] = axesOf(SDATA[item.d], o);
    return [`about ${Math.round(valueAt(ya, item.fit.a + item.fit.b * item.at))}`];
  },
};

/* ═══ 5. careful ═══════════════════════════════════════════════════════════*/

const scOutlier = {
  id: "sc-outlier",
  group: "sc-solve",
  label: "The one that does not fit",
  blurb: "An outlier sits far from the pattern of the rest.",
  heading: "Find the outlier",
  instruction: () =>
    "An outlier is a cross far away from the pattern all the others make — someone unusual, or a reading " +
    "written down wrong. Leave it out when you judge the correlation and draw the line of best fit.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const sign = r.pick([1, -1]);
    const d = contextFor(r, i + 3, sign);
    for (let g = 0; g < 200; g++) {
      const pts = pointsOf(r, nOf(o) - 1, sign, "strong");
      const fit = fitOf(pts);
      const free = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((u) => !pts.some((p) => p[0] === u) && u >= 2 && u <= 8);
      if (!free.length) continue;
      const u = r.pick(free);
      const on = fit.a + fit.b * u;
      const v = on > 5 ? Math.max(0, Math.round(on) - 6) : Math.min(10, Math.round(on) + 6);
      if (Math.abs(v - on) < 5) continue;
      const all = [...pts, [u, v]].sort((a, b) => a[0] - b[0]);
      return { d: SDATA.indexOf(d), pts: all, odd: [u, v], sign };
    }
    return { d: SDATA.indexOf(d), pts: [[1, 1], [2, 2], [3, 3], [4, 9], [5, 5], [6, 6]], odd: [4, 9], sign: 1 };
  },
  render(item, o) {
    const d = SDATA[item.d];
    const [xa, ya] = axesOf(d, o);
    return side(art(scatterSvg({ pts: item.pts, xAxis: xa, yAxis: ya, title: d.title })),
      ask(`The outlier: ${box()} along, ${box()} up`) +
      ask("Without it, the correlation is") + tick("Positive", "Negative", "No correlation"));
  },
  key(item, o) {
    const [xa, ya] = axesOf(SDATA[item.d], o);
    return [want.num(valueAt(xa, item.odd[0])), want.num(valueAt(ya, item.odd[1])), want.tick(item.sign > 0 ? 0 : 1)];
  },
  answer(item, o) {
    const [xa, ya] = axesOf(SDATA[item.d], o);
    return [`(${valueAt(xa, item.odd[0])}, ${valueAt(ya, item.odd[1])}); ${item.sign > 0 ? "positive" : "negative"}`];
  },
};

const CAUSES = [
  { t: "In a town, ice-cream sales and sunburn go up together. Does eating ice cream cause sunburn?", why: "hot, sunny weather causes both" },
  { t: "Towns with more fire engines have more fires. Do fire engines cause fires?", why: "bigger towns have more of both" },
  { t: "Children with bigger feet read better. Do big feet make you read better?", why: "older children have bigger feet AND read better" },
  { t: "Days with more umbrellas sold have more traffic jams. Do umbrellas cause jams?", why: "rain causes both" },
];

const scCareful = {
  id: "sc-careful",
  group: "sc-solve",
  label: "Too far, and not a cause",
  blurb: "A line only works where there is data; going together is not causing.",
  heading: "Be careful",
  minLevel: "middle",
  instruction: () =>
    "A line of best fit is only good where there are crosses: far past them, nobody knows if the pattern " +
    "carries on. And two things going together does not mean one CAUSES the other — often a third thing " +
    "causes both.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const sign = r.pick([1, -1]);
    const d = contextFor(r, i + 4, sign);
    /* data in the lower part of the bottom scale, so "far outside" is on the grid */
    const pts = pointsOf(r, 6, sign, "strong", 6);
    const xs = pts.map((p) => p[0]);
    const inside = r.int(Math.min(...xs) + 1, Math.max(...xs) - 1);
    return { d: SDATA.indexOf(d), pts, fit: fitOf(pts), inside, far: 10, cause: r.int(0, CAUSES.length - 1), flip: r.chance(0.5) };
  },
  render(item, o) {
    const d = SDATA[item.d];
    const [xa] = axesOf(d, o);
    const c = CAUSES[item.cause];
    const q = (u) => ask(`Can the line give a good estimate at ${valueAt(xa, u)} along?`) + tick("Yes: there is data there", "No: it is far outside the data");
    return side(art(scatterSvg({ pts: item.pts, xAxis: xa, yAxis: axesOf(d, o)[1], title: d.title, lines: [item.fit] })),
      (item.flip ? q(item.far) + q(item.inside) : q(item.inside) + q(item.far))) +
      ask(c.t) + tick("Yes", `Not necessarily: ${c.why}`);
  },
  key(item) {
    const yesNo = item.flip ? [1, 0] : [0, 1];
    return [want.tick(yesNo[0]), want.tick(yesNo[1]), want.tick(1)];
  },
  answer(item) {
    return [`${item.flip ? "no, yes" : "yes, no"}; not necessarily`];
  },
};

export const SC_EXERCISES = [
  scPlot,
  scRead,
  scKind, scPairs,
  scBest, scEstimate, scRule,
  scOutlier, scCareful,
];
