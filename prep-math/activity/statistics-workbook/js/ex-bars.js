/* ============================================================================
   Statistics Workbook — CHAPTER 2: Bar charts
   ----------------------------------------------------------------------------
   From counting squares to reading a scale to spotting a chart that lies:

     block graphs      every one a square — the height is COUNTED; and the
                       pictogram from chapter 1 drawn again as blocks
     reading a chart   bars against a scale of 1, 2, 5, 10 …, ending on a
                       gridline and then between two; lying down at Stretch
     drawing one       from a table, a tally chart and a pictogram — tapped on
                       screen (utils/components/workbook/barbuild.js) and
                       marked bar by bar
     comparing         two groups side by side, with a key
     problems          totals, differences, fractions and money — and charts
                       that mislead: an axis that does not start at 0, uneven
                       steps, bars of different widths

   The numbers follow the level's scale: Gentle counts in ones, Middle reads a
   scale of 2 or 10 with bars ending half-way, Stretch reads 10s, 20s and 50s.
   Half a step is always a whole number — things counted come in wholes.
   ========================================================================== */

import { blocksSvg, barChartSvg, FILLS } from "./barart.js";
import { pictoSvg, tallySvg, tableHtml } from "./pictoart.js";
import { levelOf, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const lead = (html) => `<p class="wb-ask wb-ask--lead">${html}</p>`;
const art = (html) => `<div class="sw-art">${html}</div>`;
const side = (figure, words) => `<div class="sw-side">${figure}<div class="sw-lines">${words}</div></div>`;
const pair = (a, b) => `<div class="sw-pair">${a}${b}</div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const fmt = (v) => String(Math.round(v * 100) / 100);

/* ── the data: short labels, so they fit under a bar ─────────────────────── */

const CHARTS = [
  { title: "Cups of zobo sold", noun: "cups", one: "cup", cats: ["Mon", "Tue", "Wed", "Thu", "Fri"], price: 50, symbol: "cup" },
  { title: "Favourite fruit", noun: "children", one: "child", cats: ["Mango", "Orange", "Banana", "Pawpaw", "Apple"], symbol: "smiley" },
  { title: "Rainy days", noun: "days", one: "day", cats: ["Mar", "Apr", "May", "Jun", "Jul"], symbol: "sun" },
  { title: "Books borrowed", noun: "books", one: "book", cats: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"], symbol: "book" },
  { title: "Goals scored", noun: "goals", one: "goal", cats: ["Eagles", "Lions", "Stars", "Tigers", "Kites"], symbol: "ball" },
  { title: "Cars that passed", noun: "cars", one: "car", cats: ["Red", "Blue", "White", "Black", "Grey"], price: 0, symbol: "car" },
];
const SELLING = CHARTS.filter((c) => c.price);
const dealChart = dealer();

/** The scale a chart is drawn on at this level: the gridline step, the unit a
    value can end on (half a step from Middle), and the most a bar reaches. */
function scaleOf(r, o) {
  const t = tier(o);
  if (t === "gentle") return { step: 1, unit: 1, most: 10 };
  /* not 5: half of 5 is 2.5, and nobody sold two and a half cups */
  if (t === "middle") { const step = r.pick([2, 10]); return { step, unit: step / 2, most: step * 10 }; }
  const step = r.pick([10, 20, 50]);
  return { step, unit: step / 2, most: step * 10 };
}

/** Values on that scale: all different, at least one ending between gridlines
    where the level allows it, and the axis topped off at a whole step. */
function valuesOf(r, sc, n, { lo = 1 } = {}) {
  for (let g = 0; g < 300; g++) {
    const vals = Array.from({ length: n }, () => r.int(lo, Math.round(sc.most / sc.unit)) * sc.unit);
    if (new Set(vals).size < n) continue;
    if (sc.unit < sc.step && !vals.some((v) => v % sc.step !== 0)) continue;
    return vals;
  }
  return Array.from({ length: n }, (_, i) => (i + 1) * sc.unit);
}
const topOf = (vals, step) => Math.ceil(Math.max(...vals) / step) * step + step;

const answersFor = (cats, vals) => {
  const most = vals.indexOf(Math.max(...vals));
  const least = vals.indexOf(Math.min(...vals));
  return { most, least, diff: vals[most] - vals[least], total: vals.reduce((a, b) => a + b, 0) };
};

/* ═══ the groups ═══════════════════════════════════════════════════════════*/

export const BR_GROUPS = [
  { id: "br-blocks", chapter: "Chapter 2 · Bar charts", label: "Block graphs", blurb: "Every one a square: count up each column." },
  { id: "br-read", label: "Reading a bar chart", blurb: "Read across from the top of the bar to the scale — and between the lines." },
  { id: "br-draw", label: "Drawing a bar chart", blurb: "From a table, a tally and a pictogram — tapped on screen, marked bar by bar." },
  { id: "br-compare", label: "Comparing two groups", blurb: "Two bars side by side for each label, and a key to tell them apart." },
  { id: "br-solve", label: "Bar chart problems", blurb: "Totals, differences, fractions, money — and charts that mislead." },
];

/* ═══ 1. block graphs ══════════════════════════════════════════════════════*/

const brBlockCount = {
  id: "br-block-count",
  group: "br-blocks",
  label: "Count the blocks",
  blurb: "Each square is one: count up each column.",
  heading: "Read the block graph",
  instruction: () =>
    "Every square in a block graph stands for one. Count up each column for how many. The tallest " +
    "column is the most.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const ch = dealChart(r, CHARTS, i);
    const n = tier(o) === "gentle" ? 4 : 5;
    const vals = valuesOf(r, { unit: 1, step: 1, most: tier(o) === "gentle" ? 8 : 10 }, n);
    return { c: CHARTS.indexOf(ch), vals };
  },
  render(item) {
    const ch = CHARTS[item.c];
    const cats = ch.cats.slice(0, item.vals.length);
    const a = answersFor(cats, item.vals);
    return side(art(blocksSvg(cats, item.vals, { title: ch.title })),
      tableHtml(["", `How many ${ch.noun}`], cats.map((c) => [c, box()])) +
      ask("The most:") + tick(...cats) + ask(`Altogether: ${box()}`) + ask(`${cats[a.most]} had ${box()} more than ${cats[a.least]}.`));
  },
  worked() {
    return worked(side(art(blocksSvg(["Mon", "Tue", "Wed"], [4, 2, 5], { title: "Cups sold" })),
      say("Count up: Monday 4, Tuesday 2, Wednesday 5. Wednesday's column is tallest — the most. " +
        "Altogether 4 + 2 + 5 = <b>11</b>.")));
  },
  key(item) {
    const a = answersFor(null, item.vals);
    return [...item.vals.map((v) => want.num(v)), want.tick(a.most), want.num(a.total), want.num(a.diff)];
  },
  answer(item) {
    const a = answersFor(null, item.vals);
    return [`${item.vals.join(", ")}; total ${a.total}; ${a.diff} more`];
  },
};

let matchTurn = 0;
const brBlockMatch = {
  id: "br-block-match",
  group: "br-blocks",
  label: "Which block graph is the pictogram?",
  blurb: "The same numbers, drawn two ways: find the one that matches.",
  heading: "Match the pictogram to its block graph",
  instruction: () =>
    "A pictogram and a block graph can show the same numbers. Count each row of the pictogram, then " +
    "find the block graph whose columns are the same. Only one of them is.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    if (i === 0) matchTurn = r.int(0, 2);
    const ch = dealChart(r, CHARTS, i + 1);
    const vals = valuesOf(r, { unit: 1, step: 1, most: 7 }, 4);
    /* the wrong ones: one column changed by one, or two columns swapped */
    const off = vals.slice(); const j = r.int(0, 3); off[j] = off[j] + (off[j] > 1 && r.chance(0.5) ? -1 : 1);
    const swap = vals.slice(); const a = r.int(0, 3); const b = (a + 1 + r.int(0, 2)) % 4; [swap[a], swap[b]] = [swap[b], swap[a]];
    const right = (i + matchTurn) % 3;
    const opts = [];
    const wrongs = [off, swap];
    for (let q = 0; q < 3; q++) opts.push(q === right ? vals : wrongs.shift());
    return { c: CHARTS.indexOf(ch), vals, opts, right };
  },
  render(item) {
    const ch = CHARTS[item.c];
    const cats = ch.cats.slice(0, 4);
    const pic = pictoSvg({ rows: cats.map((c, j) => ({ label: c, n: item.vals[j] })), symbol: ch.symbol, key: { n: 1, noun: ch.one }, title: ch.title, cols: 0 });
    const graphs = item.opts.map((v, q) => `<div class="sw-option"><b>${"ABC"[q]}</b>${blocksSvg(cats, v, { size: 3.8 })}</div>`).join("");
    return art(pic) + `<div class="sw-options">${graphs}</div>` + ask("The matching block graph is") + tick("A", "B", "C");
  },
  key(item) {
    return [want.tick(item.right)];
  },
  answer(item) {
    return [`${"ABC"[item.right]} — ${item.vals.join(", ")}`];
  },
};

/* ═══ 2. reading a bar chart ═══════════════════════════════════════════════*/

const brRead = {
  id: "br-read",
  group: "br-read",
  label: "Read the bars",
  blurb: "Along from the top of each bar to the scale.",
  heading: "Read the bar chart",
  instruction: (o) =>
    "Go from the top of each bar straight across to the scale and read the number." +
    (tier(o) === "gentle" ? "" : " A bar that stops half-way between two lines is half-way between their numbers.") +
    (tier(o) === "stretch" ? " A chart can lie on its side: then read straight down to the scale." : ""),
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const ch = dealChart(r, CHARTS, i + 2);
    const sc = scaleOf(r, o);
    const vals = valuesOf(r, sc, 5);
    return { c: CHARTS.indexOf(ch), sc, vals, top: topOf(vals, sc.step), horizontal: tier(o) === "stretch" && i % 2 === 1 };
  },
  render(item) {
    const ch = CHARTS[item.c];
    const cats = ch.cats.slice(0, 5);
    const a = answersFor(cats, item.vals);
    const fig = barChartSvg({ cats, series: [{ values: item.vals }], step: item.sc.step, top: item.top, title: ch.title, yLabel: `Number of ${ch.noun}`, horizontal: item.horizontal });
    return side(art(fig),
      tableHtml(["", `How many ${ch.noun}`], cats.map((c) => [c, box()])) +
      ask("The least:") + tick(...cats) + ask(`How many more for ${cats[a.most]} than ${cats[a.least]}? ${box()}`) + ask(`Altogether: ${box()}`));
  },
  worked() {
    return worked(side(art(barChartSvg({ cats: ["Mon", "Tue", "Wed"], series: [{ values: [6, 3, 9] }], step: 2, top: 12, title: "Cups sold", plot: 40 })),
      say("Each line on the scale is 2 more. Monday's bar stops on the 6 line: 6. Tuesday's stops half-way " +
        "between 2 and 4: 3. Wednesday: half-way between 8 and 10 — <b>9</b>.")));
  },
  key(item) {
    const a = answersFor(null, item.vals);
    return [...item.vals.map((v) => want.num(v)), want.tick(a.least), want.num(a.diff), want.num(a.total)];
  },
  answer(item) {
    const a = answersFor(null, item.vals);
    return [`${item.vals.join(", ")}; ${a.diff} more; ${a.total} altogether`];
  },
};

const brScale = {
  id: "br-scale",
  group: "br-read",
  label: "Between the lines",
  blurb: "What one step of the scale is worth, and where half a step is.",
  heading: "Read the scale",
  minLevel: "middle",
  instruction: () =>
    "First find what each step of the scale is worth: take one gridline's number from the next. A bar " +
    "that stops half-way between two lines is half a step past the lower one.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const sc = scaleOf(r, o);
    const vals = valuesOf(r, sc, 3);
    return { sc, vals, top: topOf(vals, sc.step) };
  },
  render(item) {
    const fig = barChartSvg({ cats: ["A", "B", "C"], series: [{ values: item.vals }], step: item.sc.step, top: item.top, plot: 46 });
    return side(art(fig), ask(`Each step is worth ${box()}`) + ask(`A: ${box()} B: ${box()} C: ${box()}`));
  },
  key(item) {
    return [want.num(item.sc.step), ...item.vals.map((v) => want.num(v))];
  },
  answer(item) {
    return [`a step is ${item.sc.step}; ${item.vals.join(", ")}`];
  },
};

/* ═══ 3. drawing a bar chart ═══════════════════════════════════════════════*/

/** A chart to draw: the data, and the empty axes for it. */
function toDraw(r, o, i, off = 0) {
  const ch = dealChart(r, CHARTS, i + off);
  const sc = scaleOf(r, o);
  const n = tier(o) === "gentle" ? 4 : 5;
  const vals = valuesOf(r, sc, n);
  return { c: CHARTS.indexOf(ch), sc, vals, top: topOf(vals, sc.step) };
}
const emptyAxes = (item, ch) => barChartSvg({
  cats: ch.cats.slice(0, item.vals.length), series: [{ values: item.vals.map(() => 0) }], step: item.sc.step, top: item.top,
  title: ch.title, yLabel: `Number of ${ch.noun}`, build: { unit: item.sc.unit },
});
const barsKey = (item, ch) => want.bars({ values: item.vals, says: ch.cats.slice(0, item.vals.length).map((c, j) => `${c} ${fmt(item.vals[j])}`).join(", ") });

const brBuild = {
  id: "br-build",
  group: "br-draw",
  label: "Draw it from a table",
  blurb: "Rule each bar up to its number on the scale.",
  heading: "Draw the bar chart",
  instruction: (o) =>
    "For each label, find its number on the scale and draw the bar up to it — every bar the same width, " +
    "a gap between bars." + (tier(o) === "gentle" ? "" : " A number between two lines needs a bar that stops half-way.") +
    " On screen, tap the column where the bar should stop; tap the top again to take it down a step.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    return toDraw(r, o, i);
  },
  render(item) {
    const ch = CHARTS[item.c];
    const table = tableHtml(["", `How many ${ch.noun}`], ch.cats.slice(0, item.vals.length).map((c, j) => [c, fmt(item.vals[j])]));
    return pair(table, art(emptyAxes(item, ch)));
  },
  worked() {
    return worked(say("Tuesday sold 7 cups on a scale of 2s: 7 is between the 6 line and the 8 line, half-way, " +
      "so the bar stops half-way between them. Every bar starts from 0 on the bottom line."));
  },
  key(item) {
    return [barsKey(item, CHARTS[item.c])];
  },
  answer(item) {
    return [item.vals.map(fmt).join(", ")];
  },
};

const brFromTally = {
  id: "br-from-tally",
  group: "br-draw",
  label: "From a tally chart",
  blurb: "Count each tally, write the number, then draw its bar.",
  heading: "Tally chart to bar chart",
  instruction: () =>
    "Count each row's tally marks — gates of five first — and write the number. Then draw the bar chart " +
    "from your numbers.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const d = toDraw(r, { ...o, level: "gentle" }, i, 3);
    const most = { gentle: 10, middle: 20, stretch: 30 }[tier(o)] || 10;
    const step = { gentle: 1, middle: 2, stretch: 5 }[tier(o)] || 1;
    const vals = valuesOf(r, { unit: step, step, most }, d.vals.length);
    return { ...d, vals, sc: { step, unit: step, most }, top: topOf(vals, step) };
  },
  render(item) {
    const ch = CHARTS[item.c];
    const table = tableHtml(["", "Tally", "How many"], ch.cats.slice(0, item.vals.length).map((c, j) => [c, tallySvg(item.vals[j], { h: 6 }), box()]));
    return pair(table, art(emptyAxes(item, ch)));
  },
  key(item) {
    return [...item.vals.map((v) => want.num(v)), barsKey(item, CHARTS[item.c])];
  },
  answer(item) {
    return [item.vals.join(", ")];
  },
};

const brFromPicto = {
  id: "br-from-picto",
  group: "br-draw",
  label: "From a pictogram",
  blurb: "Read the pictogram with its key, then draw the bars.",
  heading: "Pictogram to bar chart",
  minLevel: "middle",
  instruction: () =>
    "Read each row of the pictogram with the key — half a symbol is half the key — and write the number. " +
    "Then draw the same numbers as a bar chart.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const ch = dealChart(r, CHARTS, i + 4);
    const key = tier(o) === "stretch" ? 10 : 2;
    const sym = [];
    while (sym.length < 4) {
      const s = r.int(2, 12) / 2;
      if (!sym.includes(s)) sym.push(s);
    }
    const vals = sym.map((s) => s * key);
    const sc = { step: key, unit: key / 2, most: key * 7 };
    return { c: CHARTS.indexOf(ch), key, sym, vals, sc, top: topOf(vals, key) };
  },
  render(item) {
    const ch = CHARTS[item.c];
    const cats = ch.cats.slice(0, 4);
    const pic = pictoSvg({ rows: cats.map((c, j) => ({ label: c, n: item.sym[j] })), symbol: ch.symbol, key: { n: item.key, noun: ch.noun }, title: ch.title, cols: 0 });
    const table = tableHtml(["", "How many"], cats.map((c) => [c, box()]));
    return art(pic) + pair(table, art(emptyAxes(item, ch)));
  },
  key(item) {
    return [...item.vals.map((v) => want.num(v)), barsKey(item, CHARTS[item.c])];
  },
  answer(item) {
    return [item.vals.map(fmt).join(", ")];
  },
};

/* ═══ 4. comparing two groups ══════════════════════════════════════════════*/

const PAIRS = [["Boys", "Girls"], ["2025", "2026"], ["Class A", "Class B"]];

const brGrouped = {
  id: "br-grouped",
  group: "br-compare",
  label: "Two bars for each label",
  blurb: "A dual bar chart: the key says which bar is which.",
  heading: "Compare the two groups",
  instruction: () =>
    "Each label has two bars, one for each group — the key under the chart says which colour is which. " +
    "Compare the two bars of a label to see which group had more.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const ch = dealChart(r, CHARTS, i + 1);
    const sc = scaleOf(r, { ...o, level: tier(o) === "stretch" ? "middle" : tier(o) });
    const a = valuesOf(r, { ...sc, unit: sc.step }, 4);
    let b;
    do { b = valuesOf(r, { ...sc, unit: sc.step }, 4); } while (b.some((v, j) => v === a[j]));
    return { c: CHARTS.indexOf(ch), sc, a, b, names: r.pick(PAIRS), ask: r.int(0, 3) };
  },
  render(item) {
    const ch = CHARTS[item.c];
    const cats = ch.cats.slice(0, 4);
    const [n1, n2] = item.names;
    const fig = barChartSvg({ cats, series: [{ values: item.a, name: n1, fill: FILLS[0] }, { values: item.b, name: n2, fill: FILLS[1] }], step: item.sc.step, top: topOf([...item.a, ...item.b], item.sc.step), title: ch.title });
    return side(art(fig),
      ask(`${cats[item.ask]}, ${n1}: ${box()}`) +
      ask(`${cats[item.ask]}, ${n2}: ${box()}`) +
      ask(`Where was the difference biggest?`) + tick(...cats) +
      ask(`${n2} altogether: ${box()}`) +
      ask(`For how many labels did ${n1} have more? ${box()}`));
  },
  key(item) {
    const diffs = item.a.map((v, j) => Math.abs(v - item.b[j]));
    const big = diffs.indexOf(Math.max(...diffs));
    const uniq = diffs.filter((d) => d === diffs[big]).length === 1;
    return [want.num(item.a[item.ask]), want.num(item.b[item.ask]), uniq ? want.tick(big) : want.free(), want.num(item.b.reduce((s, v) => s + v, 0)), want.num(item.a.filter((v, j) => v > item.b[j]).length)];
  },
  answer(item) {
    return [`${item.names[0]} ${item.a.join(", ")}; ${item.names[1]} ${item.b.join(", ")}`];
  },
};

/* ═══ 5. problems ══════════════════════════════════════════════════════════*/

const brProblems = {
  id: "br-problems",
  group: "br-solve",
  label: "Totals, fractions and money",
  blurb: "Read the numbers first, then answer with them.",
  heading: "Solve with the bar chart",
  instruction: () =>
    "Read every bar first and write its number beside it. Then answer. A fraction of the total is that " +
    "bar's number over the total, as simple as it goes.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const ch = r.pick(SELLING);
    const sc = scaleOf(r, o);
    const vals = valuesOf(r, sc, 4);
    const a = r.int(0, 3);
    let b = r.int(0, 3);
    if (b === a) b = (a + 1) % 4;
    const goal = (Math.floor(Math.max(...vals) / sc.step) + 2) * sc.step;
    return { c: CHARTS.indexOf(ch), sc, vals, top: topOf([...vals, goal], sc.step), a, b, goal };
  },
  render(item) {
    const ch = CHARTS[item.c];
    const cats = ch.cats.slice(0, 4);
    const fig = barChartSvg({ cats, series: [{ values: item.vals }], step: item.sc.step, top: item.top, title: ch.title, yLabel: `Number of ${ch.noun}` });
    return art(fig) +
      ask(`Each ${ch.one} costs ₦${ch.price}. How much was taken on ${cats[item.a]}? ₦${box()}`) +
      ask(`What fraction of all the ${ch.noun} were sold on ${cats[item.b]}? ${box()}`) +
      ask(`How many more would ${cats[item.b]} need to sell to reach ${item.goal}? ${box()}`);
  },
  key(item) {
    const ch = CHARTS[item.c];
    const total = item.vals.reduce((s, v) => s + v, 0);
    const v = item.vals[item.b];
    const g = gcd(Math.round(v * 2), Math.round(total * 2));
    const forms = Number.isInteger(v) && Number.isInteger(total) ? [`${v / gcd(v, total)}/${total / gcd(v, total)}`, `${v}/${total}`] : [`${(v * 2) / g}/${(total * 2) / g}`];
    return [want.num(item.vals[item.a] * ch.price), want.text(...forms), want.num(item.goal - v)];
  },
  answer(item) {
    const ch = CHARTS[item.c];
    const total = item.vals.reduce((s, v) => s + v, 0);
    const v = item.vals[item.b];
    const g = gcd(v, total);
    return [`₦${item.vals[item.a] * ch.price}; ${v / g}/${total / g}; ${fmt(item.goal - v)} more`];
  },
};

const FAULTS = ["The scale does not start at 0", "The steps on the scale are not even", "The bars are different widths", "Nothing is wrong"];
let faultTurn = 0;

const brWrong = {
  id: "br-wrong",
  group: "br-solve",
  label: "What is wrong with it?",
  blurb: "A scale that starts high, uneven steps, fat and thin bars.",
  heading: "What is wrong with this bar chart?",
  instruction: () =>
    "A fair bar chart starts its scale at 0, goes up in equal steps, and draws every bar the same " +
    "width — otherwise the bars' sizes say something the numbers do not. Tick what is wrong, or that nothing is.",
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    if (i === 0) faultTurn = r.int(0, 3);
    const fault = (i + faultTurn) % 4;
    const ch = r.pick(CHARTS);
    let vals;
    if (fault === 0) vals = [r.int(41, 46), r.int(47, 52), r.int(42, 50), r.int(51, 56)];
    else vals = valuesOf(r, { unit: 5, step: 5, most: 45 }, 4);
    return { c: CHARTS.indexOf(ch), vals, fault, widths: [1, 1.6, 0.6, 1.2] };
  },
  render(item) {
    const ch = CHARTS[item.c];
    const cats = ch.cats.slice(0, 4);
    const base = { cats, series: [{ values: item.vals }], title: ch.title, plot: 46 };
    const fig = item.fault === 0 ? barChartSvg({ ...base, step: 5, top: 60, from: 40 })
      : item.fault === 1 ? barChartSvg({ ...base, step: 5, top: 50, ticks: [0, 5, 10, 20, 30, 50] })
        : item.fault === 2 ? barChartSvg({ ...base, step: 5, top: 50, widths: item.widths })
          : barChartSvg({ ...base, step: 5, top: 50 });
    /* the four answers are long: under the chart, not beside it */
    return art(fig) + tick(...FAULTS);
  },
  key(item) {
    return [want.tick(item.fault)];
  },
  answer(item) {
    return [FAULTS[item.fault]];
  },
};

export const BR_EXERCISES = [
  brBlockCount, brBlockMatch,
  brRead, brScale,
  brBuild, brFromTally, brFromPicto,
  brGrouped,
  brProblems, brWrong,
];
