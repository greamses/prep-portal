/* ============================================================================
   Statistics Workbook — CHAPTER 4: Pie charts and proportion
   ----------------------------------------------------------------------------
   A bar chart says HOW MANY; a pie chart says WHAT SHARE of the whole. The
   chapter starts with shares you can see and count, and ends with proportion
   as a graph:

     parts of a whole     a circle cut into equal slices, some coloured; a
                          hundred-square, where a share of 100 is a percentage
                          — and the same shares of a bigger crowd
     reading a pie        a slice as a fraction, then as a number of people;
                          (Middle+) slices given as percentages, one missing
     angles               the whole pie is 360°, so one person is 360 ÷ total;
                          a slice's angle back into people
     drawing a pie        from a table: the total, the degrees for one, each
                          angle — then rule the radii on screen (the workbook's
                          own ruler, snapping to the rim), in any order
     graphs and proportion  the same data as bars and as a pie; the trap — a
                          bigger share of a smaller crowd can be fewer people;
                          and "in proportion": double one, the other doubles,
                          and the graph is a straight line through 0

   Every angle is a whole number of degrees, and every share of the crowd a
   whole number of people.
   ========================================================================== */

import { pieSvg, sliceSvg, hundredSvg, swatch, fracOf } from "./pieart.js";
import { barChartSvg } from "./barart.js";
import { lineSvg } from "./lineart.js";
import { tableHtml } from "./pictoart.js";
import { levelOf, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const art = (html) => `<div class="sw-art">${html}</div>`;
const side = (figure, words) => `<div class="sw-side">${figure}<div class="sw-lines">${words}</div></div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;
const fmt = (v) => String(Math.round(v * 100) / 100);
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => (a * b) / gcd(a, b);

/** A fraction typed any of the usual ways: in its lowest terms, or as counted. */
const fracs = (k, n) => [...new Set([fracOf(k / n), `${k}/${n}`])];

/* ── what was asked ────────────────────────────────────────────────────── */

const PIE = [
  { title: "How we get to school", names: ["Walk", "Bus", "Car", "Bike", "Keke"], noun: "pupils" },
  { title: "Favourite fruit", names: ["Mango", "Orange", "Banana", "Pawpaw", "Apple"], noun: "children" },
  { title: "Pets at home", names: ["Dog", "Cat", "Fish", "Rabbit", "Bird"], noun: "families" },
  { title: "Favourite sport", names: ["Football", "Tennis", "Running", "Swimming", "Netball"], noun: "pupils" },
  { title: "Favourite colour", names: ["Blue", "Red", "Green", "Yellow", "Purple"], noun: "children" },
];
const dealP = dealer();

/**
 * `k` slice angles, each a whole number of `m` degrees, adding to 360 —
 * all different unless `same` is allowed (so "which is biggest" has one answer).
 */
function anglesOf(r, k, m, { same = false } = {}) {
  return partition(r, k, Math.round(360 / m), same).map((p) => p * m);
}

/** `U` split into `k` whole numbers, each at least 1 (all different unless `same`). */
function partition(r, k, U, same = false) {
  for (let g = 0; g < 500; g++) {
    const cuts = r.shuffle(Array.from({ length: U - 1 }, (_, i) => i + 1)).slice(0, k - 1).sort((a, b) => a - b);
    const parts = [...cuts, U].map((c, i) => c - (i ? cuts[i - 1] : 0));
    if (!same && new Set(parts).size < k) continue;
    return parts;
  }
  return Array.from({ length: k }, (_, i) => (i < k - 1 ? 1 : U - (k - 1)));
}

/** The most slices, all different, that `U` whole parts can make: 1 + 2 + … + k ≤ U. */
const most = (U, cap) => { let k = 1; while ((k + 1) * (k + 2) / 2 <= U && k < cap) k++; return k; };

/** A partition of `total` into `k` different whole numbers of `unit`. */
function partsOf(r, k, total, unit) {
  return partition(r, k, Math.round(total / unit)).map((p) => p * unit);
}

export const PI_GROUPS = [
  { id: "pi-whole", chapter: "Chapter 4 · Pie charts and proportion", label: "Parts of a whole", blurb: "Equal slices of a circle; a hundred-square, where a share of 100 is a percentage." },
  { id: "pi-read", label: "Reading a pie chart", blurb: "Each slice as a fraction of everyone, then as a number of people." },
  { id: "pi-angles", label: "Angles in a pie chart", blurb: "The whole pie is 360°: the degrees for one person, and back to people." },
  { id: "pi-draw", label: "Drawing a pie chart", blurb: "Total, degrees for one, each angle — then rule the radii." },
  { id: "pi-prop", label: "Graphs and proportion", blurb: "How many, or what share? And a straight line through 0." },
];

/* ═══ 1. parts of a whole ══════════════════════════════════════════════════*/

const piShare = {
  id: "pi-share",
  group: "pi-whole",
  label: "Colour a share of the circle",
  blurb: "A circle in equal slices: colour some, name what is left.",
  heading: "Colour a share of the circle",
  instruction: (o) =>
    "The circle is cut into equal slices. Colour as many slices as the fraction says: the bottom number is " +
    "how many slices there are, the top number how many to colour. Then say what fraction is left white." +
    (tier(o) === "gentle" ? "" : " A whole circle is 100%."),
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const n = r.pick({ gentle: [2, 4, 8], middle: [4, 5, 8, 10], stretch: [5, 8, 10, 20] }[tier(o)] || [2, 4]);
    return { n, k: r.int(1, n - 1), pct: tier(o) !== "gentle" };
  },
  render(item) {
    const { n, k } = item;
    return side(art(sliceSvg(n, { r: n > 10 ? 18 : 15 })),
      ask(`Colour ${k}/${n} of the circle.`) +
      ask(`The white part is ${box()} of the circle.`) +
      (item.pct ? ask(`The coloured part is ${box()}%`) : ""));
  },
  worked() {
    return worked(say("The circle is cut into 8 equal slices, so each slice is 1/8. To colour 3/8, colour any 3 " +
      "slices. The 5 left white are 5/8 — and 3/8 and 5/8 make 8/8, the whole circle."));
  },
  key(item) {
    const { n, k } = item;
    return [
      want.colour({ count: k, says: `${k} slices coloured` }),
      want.text(...fracs(n - k, n)),
      ...(item.pct ? [want.num((100 * k) / n)] : []),
    ];
  },
  answer(item) {
    return [`colour ${item.k}; white ${fracOf((item.n - item.k) / item.n)}${item.pct ? `; ${fmt((100 * item.k) / item.n)}%` : ""}`];
  },
};

const piHundred = {
  id: "pi-hundred",
  group: "pi-whole",
  label: "A hundred-square",
  blurb: "100 asked, one square each: the number IS the percentage.",
  heading: "Read the hundred-square",
  instruction: (o) =>
    "100 were asked, and each square is one of them. Count the squares of each colour. Out of 100, the number " +
    "of squares is also the percentage — per cent means out of a hundred." +
    (tier(o) === "gentle" ? "" : " For a bigger crowd in the same shares, the percentage stays the same: find that percentage of the crowd."),
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const t = tier(o);
    const d = dealP(r, PIE, i);
    const kinds = t === "gentle" ? 3 : 4;
    const unit = { gentle: 10, middle: 5, stretch: 1 }[t] || 10;
    const counts = partsOf(r, kinds, 100, unit);
    /* a bigger crowd, and whole people in every share of it */
    const crowd = t === "gentle" ? 0 : t === "middle" ? 200 : r.pick([300, 400, 500]);
    return { d: PIE.indexOf(d), counts, crowd, ask: r.int(0, kinds - 1) };
  },
  render(item) {
    const d = PIE[item.d];
    const rows = item.counts.map((c, j) => [`${swatch(j)} ${d.names[j]}`, box(), `${box()}%`]);
    return side(art(hundredSvg(item.counts)),
      ask(`${d.title}: 100 ${d.noun} asked.`) +
      tableHtml(["", d.noun, "per cent"], rows) +
      (item.crowd ? ask(`In the same shares, of ${item.crowd} ${d.noun} how many would choose ${d.names[item.ask]}? ${box()}`) : ""));
  },
  key(item) {
    return [
      ...item.counts.flatMap((c) => [want.num(c), want.num(c)]),
      ...(item.crowd ? [want.num((item.counts[item.ask] * item.crowd) / 100)] : []),
    ];
  },
  answer(item) {
    return [`${item.counts.join(", ")}${item.crowd ? `; ${(item.counts[item.ask] * item.crowd) / 100}` : ""}`];
  },
};

/* ═══ 2. reading a pie chart ═══════════════════════════════════════════════*/

const piFraction = {
  id: "pi-fraction",
  group: "pi-read",
  label: "A slice as a fraction",
  blurb: "What share is each slice — and how many people is that?",
  heading: "Read the pie chart",
  instruction: (o) =>
    (tier(o) === "gentle"
      ? "Look at each slice: half the circle is 1/2, a quarter is 1/4. "
      : "Each slice says what fraction of everyone it is. ") +
    "To find how many people a slice is, find that fraction of everyone: divide by the bottom number, " +
    "multiply by the top.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const t = tier(o);
    const d = dealP(r, PIE, i + 1);
    const m = t === "gentle" ? 90 : t === "middle" ? r.pick([30, 45, 60]) : r.pick([36, 30, 40, 72]);
    const kinds = t === "gentle" ? r.pick([2, 3]) : most(360 / m, 4);
    const angles = anglesOf(r, kinds, m, { same: t === "gentle" });
    const U = 360 / m;
    const N = t === "gentle" ? r.pick([4, 8, 12, 20, 40]) : U * r.int(2, t === "stretch" ? 10 : 5);
    return { d: PIE.indexOf(d), angles, N, gentle: t === "gentle" };
  },
  render(item) {
    const d = PIE[item.d];
    const names = d.names.slice(0, item.angles.length);
    const fig = pieSvg({ angles: item.angles, names, show: item.gentle ? "" : "fraction", title: `${d.title}: ${item.N} ${d.noun}` });
    const rows = names.map((n, j) => [`${swatch(j)} ${n}`, ...(item.gentle ? [box()] : []), box()]);
    return side(art(fig), tableHtml(["", ...(item.gentle ? ["fraction"] : []), d.noun], rows));
  },
  worked() {
    return worked(say("24 pupils were asked, and the Bus slice is 3/8 of the pie. 1/8 of 24 is 24 ÷ 8 = 3, so " +
      "3/8 of 24 is 3 × 3 = 9 pupils."));
  },
  key(item) {
    return item.angles.flatMap((a) => [
      ...(item.gentle ? [want.text(...fracs(a / 90, 4))] : []),
      want.num((a / 360) * item.N),
    ]);
  },
  answer(item) {
    return [item.angles.map((a) => `${fracOf(a / 360)} = ${(a / 360) * item.N}`).join("; ")];
  },
};

const piPercent = {
  id: "pi-percent",
  group: "pi-read",
  label: "Slices as percentages",
  blurb: "The slices make 100%: find the missing one, then the people in each.",
  heading: "Read the percentages",
  minLevel: "middle",
  instruction: () =>
    "The whole pie is 100%, so the missing slice is 100 take away the others. To change a percentage into " +
    "people, find 1% (divide everyone by 100), or 10% (divide by 10), and build it up.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const t = tier(o);
    const d = dealP(r, PIE, i + 2);
    const m = t === "stretch" ? 18 : 36;
    const angles = anglesOf(r, 4, m);
    const N = t === "stretch" ? r.pick([40, 60, 80, 120, 400]) : r.pick([20, 30, 40, 50, 200]);
    return { d: PIE.indexOf(d), angles, N, q: r.int(0, 3) };
  },
  render(item) {
    const d = PIE[item.d];
    const names = d.names.slice(0, 4);
    const show = item.angles.map((a, j) => (j === item.q ? "?" : `${(a / 360) * 100}%`));
    const fig = pieSvg({ angles: item.angles, names, show, title: `${d.title}: ${item.N} ${d.noun}` });
    return side(art(fig),
      ask(`The ? slice, ${names[item.q]}, is ${box()}%`) +
      tableHtml(["", d.noun], names.map((n, j) => [`${swatch(j)} ${n}`, box()])));
  },
  key(item) {
    return [want.num((item.angles[item.q] / 360) * 100), ...item.angles.map((a) => want.num((a / 360) * item.N))];
  },
  answer(item) {
    return [`${(item.angles[item.q] / 360) * 100}%; ${item.angles.map((a) => (a / 360) * item.N).join(", ")}`];
  },
};

/* ═══ 3. angles in a pie chart ═════════════════════════════════════════════*/

const DEG = { gentle: [90, 45, 30, 60], middle: [30, 20, 15, 10], stretch: [12, 8, 6, 5, 4] };

const piAngle = {
  id: "pi-angle",
  group: "pi-angles",
  label: "Angles into people",
  blurb: "360° for everyone: the degrees for one, the missing angle, the people in each slice.",
  heading: "From angles to people",
  instruction: () =>
    "All the way round the middle of a pie is 360°, and that is everyone. So one person gets 360 ÷ the " +
    "total. The angles add up to 360°: the missing one is 360 take away the rest. A slice's angle ÷ the " +
    "degrees for one person is how many people.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const t = tier(o);
    const d = dealP(r, PIE, i + 3);
    const per = r.pick(DEG[t] || DEG.gentle);
    const kinds = most(360 / per, t === "gentle" ? 3 : t === "middle" ? 4 : 5);
    const angles = anglesOf(r, kinds, per);
    return { d: PIE.indexOf(d), angles, per, q: r.int(0, kinds - 1) };
  },
  render(item) {
    const d = PIE[item.d];
    const N = 360 / item.per;
    const names = d.names.slice(0, item.angles.length);
    const show = item.angles.map((a, j) => (j === item.q ? "?" : `${a}°`));
    const fig = pieSvg({ angles: item.angles, names, show, title: `${d.title}: ${N} ${d.noun}` });
    return side(art(fig),
      ask(`One of the ${N} ${d.noun} is 360 ÷ ${N} = ${box()}°`) +
      ask(`The ? angle is ${box()}°`) +
      tableHtml(["", d.noun], names.map((n, j) => [`${swatch(j)} ${n}`, box()])));
  },
  worked() {
    return worked(say("A pie of 12 children: each child is 360 ÷ 12 = 30°. A slice of 90° is 90 ÷ 30 = 3 " +
      "children. If the other angles are 90° and 150°, the missing one is 360 − 90 − 150 = 120°."));
  },
  key(item) {
    return [want.num(item.per), want.num(item.angles[item.q]), ...item.angles.map((a) => want.num(a / item.per))];
  },
  answer(item) {
    return [`${item.per}° each; ? = ${item.angles[item.q]}°; ${item.angles.map((a) => a / item.per).join(", ")}`];
  },
};

/* ═══ 4. drawing a pie chart ═══════════════════════════════════════════════*/

/** The degrees for one person at this level, and the rim's snap step. */
function drawScale(r, o) {
  const t = tier(o);
  if (t === "gentle") { const per = r.pick([45, 90, 45]); return { per, step: 45, m: per }; }
  const per = r.pick(t === "middle" ? [30, 20, 10] : [5, 4, 3, 2]);
  return { per, step: 10, m: lcm(per, 10) };
}

/** Is this set of radii (rim positions, in degrees) a pie of these angles — in any order? */
export function pieRight(rims, angles) {
  const cuts = [...new Set([0, ...rims.map((x) => ((x % 360) + 360) % 360)])].sort((a, b) => a - b);
  const got = [...cuts, 360].slice(1).map((c, i) => c - cuts[i]).sort((a, b) => a - b);
  const want2 = angles.slice().sort((a, b) => a - b);
  return got.length === want2.length && got.every((x, i) => x === want2[i]);
}

const piDraw = {
  id: "pi-draw",
  group: "pi-draw",
  label: "Draw the pie chart",
  blurb: "The total, the degrees for one, each angle — then rule each radius.",
  heading: "Draw the pie chart",
  instruction: () =>
    "Add up the table for the total. One is 360° ÷ the total; each angle is its number × that. The first " +
    "radius is drawn: measure the first angle round from it (clockwise) and rule the next radius, then the next " +
    "angle from that one. On screen, drag from the centre to the rim — the ruler snaps to the marks. Label " +
    "each slice.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const d = dealP(r, PIE, i + 4);
    const sc = drawScale(r, o);
    const kinds = tier(o) === "gentle" && sc.m === 90 ? 3 : most(360 / sc.m, tier(o) === "gentle" ? 3 : 4);
    const angles = anglesOf(r, kinds, sc.m, { same: sc.m === 90 });
    return { d: PIE.indexOf(d), ...sc, angles };
  },
  render(item) {
    const d = PIE[item.d];
    const names = d.names.slice(0, item.angles.length);
    const table = tableHtml(["", d.noun, "angle"], names.map((n, j) => [n, String(item.angles[j] / item.per), `${box()}°`]));
    const words = ask(`Total: ${box()} ${d.noun}`) + ask(`One is 360 ÷ total = ${box()}°`) + table;
    return `<div class="sw-pair"><div>${words}</div>${art(pieSvg({ build: { step: item.step }, names, title: d.title, r: 22 }))}</div>`;
  },
  worked() {
    return worked(say("Walk 3, Bus 4, Car 5: 12 pupils, so one pupil is 360 ÷ 12 = 30°. Walk is 3 × 30 = 90°, " +
      "Bus 120°, Car 150° — and 90 + 120 + 150 = 360, so nothing is lost. Measure 90° from the first radius, " +
      "rule; 120° from that one, rule; what is left is Car's 150°."));
  },
  key(item) {
    const N = 360 / item.per;
    const n = 360 / item.step;
    return [
      want.num(N), want.num(item.per), ...item.angles.map((a) => want.num(a)),
      want.draw({
        says: `radii for ${item.angles.map((a) => `${a}°`).join(", ")}`,
        check: (lines) => {
          const real = lines.filter(([a, b]) => a !== b);
          /* every line a radius: from the centre (point 0) to the rim */
          if (real.some(([a, b]) => a !== 0 && b !== 0)) return false;
          const rims = real.map(([a, b]) => ((a || b) - 1) * item.step).filter((x) => x < n * item.step);
          return pieRight(rims, item.angles);
        },
      }),
    ];
  },
  answer(item) {
    return [`${360 / item.per} in all; ${item.per}° each; ${item.angles.map((a) => `${a}°`).join(", ")}`];
  },
};

/* ═══ 5. graphs and proportion ═════════════════════════════════════════════*/

const piWhich = {
  id: "pi-which",
  group: "pi-prop",
  label: "The same data, two ways",
  blurb: "A bar chart says how many; a pie says what share. Which pie is this bar chart?",
  heading: "Which pie chart shows the same thing?",
  instruction: () =>
    "The bar chart says how many chose each. Add them up for the total: a share is the number out of the " +
    "total. The right pie has the same shares — the biggest bar is the biggest slice, and a bar half the total " +
    "is half the pie.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const t = tier(o);
    const d = dealP(r, PIE, i);
    const per = r.pick({ gentle: [45, 30], middle: [30, 20, 15], stretch: [10, 12, 15] }[t] || [45]);
    const kinds = t === "gentle" ? 3 : 4;
    const angles = anglesOf(r, kinds, per);
    const values = angles.map((a) => a / per);
    /* two pies that are nearly right: two slices swapped */
    const swap = (list, a, b) => { const c = list.slice(); [c[a], c[b]] = [c[b], c[a]]; return c; };
    const wrong = [swap(angles, 0, 1), swap(angles, 1, 2)];
    const order = r.shuffle([0, 1, 2]);
    return { d: PIE.indexOf(d), values, angles, wrong, order, ask: r.int(0, kinds - 1) };
  },
  render(item) {
    const d = PIE[item.d];
    const names = d.names.slice(0, item.values.length);
    const most = Math.max(...item.values);
    const step = most <= 10 ? 1 : most <= 20 ? 2 : 5;
    const bar = barChartSvg({ cats: names, series: [{ values: item.values }], step, top: Math.ceil(most / step) * step, title: d.title, yLabel: d.noun, plot: 46 });
    const pies = [item.angles, ...item.wrong];
    const options = item.order.map((p, j) =>
      `<div class="sw-option"><b>${"ABC"[j]}</b>${pieSvg({ angles: pies[p], names, key: false, r: 12 })}</div>`).join("");
    const legend = `<p class="wb-ask">${names.map((n, j) => `${swatch(j)} ${n}`).join(" &nbsp; ")}</p>`;
    return side(art(bar),
      ask(`Altogether: ${box()} ${d.noun}`) +
      ask(`What fraction chose ${names[item.ask]}? ${box()}`)) +
      legend + `<div class="sw-options">${options}</div>` + tick("A", "B", "C");
  },
  key(item) {
    const N = item.values.reduce((a, b) => a + b, 0);
    return [want.num(N), want.text(...fracs(item.values[item.ask], N)), want.tick(item.order.indexOf(0))];
  },
  answer(item) {
    const N = item.values.reduce((a, b) => a + b, 0);
    return [`${N}; ${fracOf(item.values[item.ask] / N)}; ${"ABC"[item.order.indexOf(0)]}`];
  },
};

const piTrap = {
  id: "pi-trap",
  group: "pi-prop",
  label: "A bigger slice, fewer people?",
  blurb: "Two pies of two different crowds: the share is not the number.",
  heading: "A bigger slice — more people?",
  instruction: () =>
    "A pie shows shares, not numbers. A big slice of a small class can be fewer pupils than a small slice of " +
    "a big class. Work out the number in each before you compare.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const t = tier(o);
    const shares = t === "gentle" ? [1 / 4, 1 / 2, 3 / 4]
      : Array.from({ length: t === "stretch" ? 17 : 9 }, (_, j) => (t === "stretch" ? (j + 2) * 5 : (j + 1) * 10) / 100);
    const Ns = t === "gentle" ? [4, 8, 12, 16, 20, 24, 40] : t === "middle" ? [10, 20, 30, 40, 50, 60, 100] : [20, 40, 60, 80, 120, 200];
    const trap = i % 3 !== 2;
    for (let g = 0; g < 500; g++) {
      const p = [r.pick(shares), r.pick(shares)];
      const N = [r.pick(Ns), r.pick(Ns)];
      const c = [p[0] * N[0], p[1] * N[1]].map((x) => Math.round(x * 1e6) / 1e6);
      if (c.some((x) => !Number.isInteger(x)) || p[0] === p[1] || c[0] === c[1] || N[0] === N[1]) continue;
      if (trap !== ((p[0] > p[1]) !== (c[0] > c[1]))) continue;
      return { p, N, c, gentle: t === "gentle" };
    }
    return { p: [0.5, 0.25], N: [8, 24], c: [4, 6], gentle: t === "gentle" };
  },
  render(item) {
    const names = ["Football", "Something else"];
    const pie = (j) => pieSvg({
      angles: [item.p[j] * 360, 360 - item.p[j] * 360],
      names,
      show: item.gentle ? "fraction" : "percent",
      title: `Class ${"AB"[j]}: ${item.N[j]} pupils`,
      r: 16,
    });
    return `<div class="sw-pair">${art(pie(0))}${art(pie(1))}</div>` +
      ask(`Football, Class A: ${box()} pupils. Class B: ${box()} pupils.`) +
      ask("More pupils chose football in") + tick("Class A", "Class B") +
      ask("A bigger share chose football in") + tick("Class A", "Class B");
  },
  worked() {
    return worked(say("Class A: 1/2 of 8 pupils is 4. Class B: 1/4 of 24 pupils is 6. Class A's football slice " +
      "is bigger, but Class B has more pupils who chose football — because Class B is a bigger class."));
  },
  key(item) {
    return [want.num(item.c[0]), want.num(item.c[1]), want.tick(item.c[0] > item.c[1] ? 0 : 1), want.tick(item.p[0] > item.p[1] ? 0 : 1)];
  },
  answer(item) {
    return [`A ${item.c[0]}, B ${item.c[1]}; more in ${item.c[0] > item.c[1] ? "A" : "B"}; bigger share in ${item.p[0] > item.p[1] ? "A" : "B"}`];
  },
};

/* Three graphs that all go up — only one of them is in proportion. */
const KINDS = ["oranges", "taxi", "square"];
let kindTurn = 0;

function directValues(item) {
  const xs = [0, 1, 2, 3, 4, 5, 6];
  if (item.kind === "oranges") return xs.map((x) => x * item.each);
  if (item.kind === "taxi") return xs.map((x) => item.start + x * item.each);
  return xs.map((x) => x * x);
}

const piDirect = {
  id: "pi-direct",
  group: "pi-prop",
  label: "Is it in proportion?",
  blurb: "Double one, and the other doubles: a straight line through 0.",
  heading: "In proportion — or not?",
  instruction: () =>
    "Two amounts are in proportion when doubling one doubles the other (and trebling trebles it). Their graph " +
    "is a straight line that starts at 0. A line that starts higher up, or bends, is not in proportion — test " +
    "it by reading at 2 and at 4.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    if (i === 0) kindTurn = r.int(0, 2);
    const kind = KINDS[(i + kindTurn) % 3];
    const t = tier(o);
    if (kind === "oranges") { const each = r.pick(t === "gentle" ? [50, 100] : [50, 100, 150, 200]); return { kind, each }; }
    if (kind === "taxi") { const each = r.pick([100, 200]); return { kind, each, start: each * r.pick([1, 2, 3]) }; }
    return { kind };
  },
  render(item) {
    const v = directValues(item);
    const xs = ["0", "1", "2", "3", "4", "5", "6"];
    const spec = item.kind === "oranges"
      ? { title: "Cost of oranges", yLabel: "naira (₦)", xLabel: "oranges", step: item.each, top: 6 * item.each }
      : item.kind === "taxi"
        ? { title: "Taxi fare", yLabel: "naira (₦)", xLabel: "kilometres", step: item.each, top: item.start + 6 * item.each }
        : { title: "Area of a square", yLabel: "area in cm²", xLabel: "side in cm", step: 4, top: 36 };
    const thing = item.kind === "oranges" ? "cost" : item.kind === "taxi" ? "fare" : "area";
    const fig = lineSvg({ xs, series: [{ values: v }], slot: 9, ...spec });
    return side(art(fig),
      ask(`At 2: ${box()} &nbsp; At 4: ${box()}`) +
      ask(`From 2 to 4 is double. Did the ${thing} double too?`) + tick("Yes", "No") +
      ask("Is it in proportion?") + tick("Yes: a straight line through 0", "No"));
  },
  worked() {
    return worked(say("Oranges at ₦100 each: 2 cost ₦200 and 4 cost ₦400. Twice as many, twice the cost — in " +
      "proportion, and the graph is a straight line from 0. A taxi that charges ₦200 before it moves is not: " +
      "its line starts at 200, and 4 km does not cost twice 2 km."));
  },
  key(item) {
    const v = directValues(item);
    const yes = item.kind === "oranges";
    return [want.num(v[2]), want.num(v[4]), want.tick(v[4] === 2 * v[2] ? 0 : 1), want.tick(yes ? 0 : 1)];
  },
  answer(item) {
    const v = directValues(item);
    return [`${v[2]} and ${v[4]}; ${item.kind === "oranges" ? "in proportion" : "not in proportion"}`];
  },
};

export const PI_EXERCISES = [
  piShare, piHundred,
  piFraction, piPercent,
  piAngle,
  piDraw,
  piWhich, piTrap, piDirect,
];
