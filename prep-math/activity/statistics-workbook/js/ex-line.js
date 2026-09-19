/* ============================================================================
   Statistics Workbook — CHAPTER 3: Line graphs
   ----------------------------------------------------------------------------
   A line graph is for something that CHANGES — a temperature through the day,
   a plant week by week — and the chapter goes from where it comes from to
   where it misleads:

     from bars to a line   the same readings as bars, a dot on each top, the
                           dots joined: that is all a line graph is
     reading one           a reading at each time; the highest, the lowest;
                           how much it went up or down between two times
     between the points    (Middle+) half-way between two readings, and back
                           the other way: WHEN was it this much?
     drawing one           from a table: plot each reading and rule to the next
                           — on screen, with the workbook's own ruler, snapping
                           to the grid; marked on the joins
     rising and falling    each step up, down or level; the biggest change;
                           two lines on one graph
     problems              a conversion graph read both ways, and graphs that
                           mislead: a scale not from 0, times unevenly spaced

   Scales by level: Gentle in ones up to 10, Middle in twos, Stretch in fives
   and tens — and a reading never falls off the grid.
   ========================================================================== */

import { lineSvg, buildPoints } from "./lineart.js";
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
const fmt = (v) => String(Math.round(v * 100) / 100);

/* ── things that change, in order ──────────────────────────────────────── */

const LDATA = [
  { title: "Height of a bean plant", yLabel: "height in cm", xs: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7"], noun: "cm", shape: "rise" },
  { title: "Water in the tank", yLabel: "litres", xs: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], noun: "litres", shape: "fall" },
  { title: "Temperature through the day", yLabel: "°C", xs: ["6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm"], noun: "°C", shape: "hill", warm: true },
  { title: "Visitors to the library", yLabel: "visitors", xs: ["9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm"], noun: "visitors", shape: "any" },
  { title: "Rainfall", yLabel: "rain in mm", xs: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"], noun: "mm", shape: "hill" },
];
const dealL = dealer();
/* at Gentle the scale is 0 to 10 — no temperature fits on it */
const dataFor = (r, o, i) => {
  let d = dealL(r, LDATA, i);
  if (tier(o) === "gentle" && d.warm) d = LDATA[(LDATA.indexOf(d) + 1) % LDATA.length];
  return d;
};

/** The scale at this level: gridline step, the unit a reading can end on
    (half a step when reading between lines), and the top of the axis. */
function scaleOf(o, { half = false, d = null } = {}) {
  const t = tier(o);
  /* a temperature has its own scale: fives up to 40 °C, never below 15 — a
     day at 90 °C is not a day anybody has had */
  if (d?.warm) return { step: 5, unit: 5, top: 40, lo: 3 };
  const step = { gentle: 1, middle: 2, stretch: 10 }[t] || 1;
  const levels = { gentle: 10, middle: 10, stretch: 10 }[t] || 10;
  return { step, unit: half && t !== "gentle" ? step / 2 : step, top: step * levels };
}

/** Readings with the chart's shape, on the scale, never off the grid. */
function readingsOf(r, sc, n, shape) {
  const max = Math.round(sc.top / sc.unit);
  const lo = sc.lo || 1;
  for (let g = 0; g < 500; g++) {
    let v = Array.from({ length: n }, () => r.int(lo, max - 1));
    if (shape === "rise") v.sort((a, b) => a - b);
    if (shape === "fall") v.sort((a, b) => b - a);
    if (shape === "hill") { v.sort((a, b) => a - b); const peak = r.int(2, n - 2); const up = v.slice(0, peak + 1); const down = v.slice(peak + 1).reverse(); v = [...up.slice(0, -1), up[up.length - 1], ...down]; }
    /* no two readings in a row the same (a flat step is its own question), and a
       single highest and lowest, so "when was it highest" has one answer */
    if (v.some((x, i) => i && x === v[i - 1])) continue;
    const hi = Math.max(...v); const low = Math.min(...v);
    if (v.filter((x) => x === hi).length > 1 || v.filter((x) => x === low).length > 1) continue;
    return v.map((x) => x * sc.unit);
  }
  return Array.from({ length: n }, (_, i) => (i + 1) * sc.unit);
}

const steps = (v) => v.slice(1).map((x, i) => x - v[i]);
const intervalNames = (xs) => xs.slice(1).map((x, i) => `${xs[i]}–${x}`);

export const LN_GROUPS = [
  { id: "ln-intro", chapter: "Chapter 3 · Line graphs", label: "From bars to a line", blurb: "A dot on the top of every bar, joined: that is a line graph." },
  { id: "ln-read", label: "Reading a line graph", blurb: "Each reading, the highest and the lowest, and how much it changed." },
  { id: "ln-between", label: "Between the points", blurb: "Half-way between two readings — and back: when was it this much?" },
  { id: "ln-draw", label: "Drawing a line graph", blurb: "Plot each reading, rule to the next — on screen, snapping to the grid." },
  { id: "ln-trend", label: "Rising and falling", blurb: "Up, down or level; the biggest change; two lines on one graph." },
  { id: "ln-solve", label: "Line graph problems", blurb: "A conversion graph read both ways, and graphs that mislead." },
];

/* ═══ 1. from bars to a line ═══════════════════════════════════════════════*/

const lnBars = {
  id: "ln-bars",
  group: "ln-intro",
  label: "The tops of the bars, joined",
  blurb: "The same readings as bars and as a line.",
  heading: "From bars to a line",
  instruction: () =>
    "The bars and the line show the same readings. Each dot sits on the top of a bar; the line joins " +
    "the dots in order. Read each dot across to the scale.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const d = dataFor(r, o, i);
    const sc = scaleOf(o, { d });
    const n = tier(o) === "gentle" ? 5 : 6;
    return { d: LDATA.indexOf(d), sc, v: readingsOf(r, sc, n, d.shape) };
  },
  render(item) {
    const d = LDATA[item.d];
    const xs = d.xs.slice(0, item.v.length);
    const fig = lineSvg({ xs, series: [{ values: item.v }], step: item.sc.step, top: item.sc.top, title: d.title, yLabel: d.yLabel, bars: true });
    return side(art(fig), tableHtml(["", d.noun], xs.map((x) => [x, box()])) + ask("Each dot sits on the") + tick("top of a bar", "bottom of a bar", "middle of a bar"));
  },
  worked() {
    return worked(say("A bar chart shows each reading as a bar. Put a dot on the top of each bar and join the dots " +
      "in order, and you have a line graph of the same readings — the line shows how it CHANGED from one to the next."));
  },
  key(item) {
    return [...item.v.map((v) => want.num(v)), want.tick(0)];
  },
  answer(item) {
    return [item.v.map(fmt).join(", ")];
  },
};

/* ═══ 2. reading a line graph ══════════════════════════════════════════════*/

const lnRead = {
  id: "ln-read",
  group: "ln-read",
  label: "Read the line graph",
  blurb: "Read every dot; the highest; how much it rose.",
  heading: "Read the line graph",
  instruction: (o) =>
    "Go from each dot straight across to the scale and read it." +
    (tier(o) === "gentle" ? "" : " A dot half-way between two lines is half-way between their numbers.") +
    " To find how much it went up or down between two times, take the smaller reading from the bigger.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const d = dataFor(r, o, i + 1);
    const sc = scaleOf(o, { half: true, d });
    const v = readingsOf(r, sc, 6, d.shape);
    const s = steps(v);
    return { d: LDATA.indexOf(d), sc, v, a: r.int(0, s.length - 1) };
  },
  render(item) {
    const d = LDATA[item.d];
    const xs = d.xs.slice(0, item.v.length);
    const fig = lineSvg({ xs, series: [{ values: item.v }], step: item.sc.step, top: item.sc.top, title: d.title, yLabel: d.yLabel });
    const up = item.v[item.a + 1] > item.v[item.a];
    return side(art(fig), tableHtml(["", d.noun], xs.map((x) => [x, box()])) +
      ask("The highest was at") + tick(...xs) +
      ask(`From ${xs[item.a]} to ${xs[item.a + 1]} it went ${up ? "up" : "down"} by ${box()}`));
  },
  key(item) {
    const hi = item.v.indexOf(Math.max(...item.v));
    return [...item.v.map((v) => want.num(v)), want.tick(hi), want.num(Math.abs(item.v[item.a + 1] - item.v[item.a]))];
  },
  answer(item) {
    return [`${item.v.map(fmt).join(", ")}; highest at ${LDATA[item.d].xs[item.v.indexOf(Math.max(...item.v))]}`];
  },
};

/* ═══ 3. between the points ════════════════════════════════════════════════*/

const lnBetween = {
  id: "ln-between",
  group: "ln-between",
  label: "Half-way between readings",
  blurb: "No reading at that time: the line tells you what it was, near enough.",
  heading: "Read between the points",
  minLevel: "middle",
  instruction: () =>
    "There is no dot at every time. Where there is none, go up from the time to the LINE, then across to " +
    "the scale: that is the best estimate. To find WHEN it was a number, go across from the number to " +
    "the line, then down to the time.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const d = dataFor(r, o, i + 2);
    const sc = scaleOf(o, { d });
    /* readings every other time, so every other time has none */
    /* four different readings, so "when was it this much?" has one answer */
    let read;
    do { read = readingsOf(r, { ...sc, unit: sc.step }, 4, d.shape === "hill" ? "any" : d.shape); } while (new Set(read).size < 4);
    const gap = r.int(0, 2);
    const back = r.int(0, 3);
    return { d: LDATA.indexOf(d), sc, read, gap, back };
  },
  render(item) {
    const d = LDATA[item.d];
    const times = d.xs.slice(0, 7);
    const values = [0, 1, 2, 3, 4, 5, 6].map((j) => (j % 2 === 0 ? item.read[j / 2] : null));
    const fig = lineSvg({ xs: times, series: [{ values }], step: item.sc.step, top: item.sc.top, title: d.title, yLabel: d.yLabel, slot: 11 });
    const at = 2 * item.gap + 1;
    return side(art(fig),
      ask(`At ${times[at] || "the time half-way"} there was no reading. Best estimate: ${box()} ${d.noun}`) +
      ask(`When was it ${item.read[item.back]} ${d.noun}?`) + tick(...[0, 2, 4, 6].map((j) => times[j])));
  },
  key(item) {
    const a = item.read[item.gap];
    const b = item.read[item.gap + 1];
    return [want.num((a + b) / 2, item.sc.step / 2), want.tick(item.back)];
  },
  answer(item) {
    return [`about ${fmt((item.read[item.gap] + item.read[item.gap + 1]) / 2)}; ${item.read[item.back]} at the ${item.back + 1}${["st", "nd", "rd", "th"][item.back]} reading`];
  },
};

/* ═══ 4. drawing a line graph ══════════════════════════════════════════════*/

/** Which snap point a reading is, in buildPoints' order. */
const indexOf = (i, v, sc) => i * (Math.round(sc.top / sc.unit) + 1) + Math.round(v / sc.unit);

const lnDraw = {
  id: "ln-draw",
  group: "ln-draw",
  label: "Plot it and join it",
  blurb: "A dot for each reading, a ruled line to the next.",
  heading: "Draw the line graph",
  instruction: () =>
    "For each time, go up to its reading and mark a dot — where the time's line meets the reading's " +
    "line. Then rule a straight line from each dot to the next, in order. On screen, drag from dot to " +
    "dot: the ruler snaps to the grid.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const d = dataFor(r, o, i + 3);
    const sc = scaleOf(o, { d });
    const n = tier(o) === "gentle" ? 5 : 6;
    return { d: LDATA.indexOf(d), sc, v: readingsOf(r, sc, n, d.shape) };
  },
  render(item) {
    const d = LDATA[item.d];
    const xs = d.xs.slice(0, item.v.length);
    const table = tableHtml(["", d.noun], xs.map((x, j) => [x, fmt(item.v[j])]));
    const fig = lineSvg({ xs, series: [], step: item.sc.step, top: item.sc.top, title: d.title, yLabel: d.yLabel, build: { unit: item.sc.unit } });
    return pair(table, art(fig));
  },
  worked() {
    return worked(say("Monday's reading is 6: go up Monday's line to the 6 line and put a dot where they cross. Do " +
      "every day, then rule Monday's dot to Tuesday's, Tuesday's to Wednesday's, and so on — never from the " +
      "first dot straight to the last."));
  },
  key(item) {
    const { sc, v } = item;
    const want2 = new Set(v.slice(1).map((x, i) => {
      const a = indexOf(i, v[i], sc); const b = indexOf(i + 1, x, sc);
      return `${Math.min(a, b)}-${Math.max(a, b)}`;
    }));
    return [want.draw({
      says: `dots at ${v.map(fmt).join(", ")}, each joined to the next`,
      check: (lines) => {
        const got = new Set(lines.filter(([a, b]) => a !== b).map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
        return got.size === want2.size && [...want2].every((s) => got.has(s));
      },
    })];
  },
  answer(item) {
    return [item.v.map(fmt).join(", ")];
  },
};

/* ═══ 5. rising and falling ════════════════════════════════════════════════*/

const lnTrend = {
  id: "ln-trend",
  group: "ln-trend",
  label: "Up, down, or the same?",
  blurb: "A line going up is rising; down, falling. The steepest step is the biggest change.",
  heading: "How did it change?",
  instruction: () =>
    "Where the line goes up from one dot to the next, the reading rose; down, it fell. The steeper the " +
    "line, the bigger the change.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const d = dataFor(r, o, i + 2);
    const sc = scaleOf(o, { d });
    let v;
    /* one biggest change, so the question has one answer (a narrow scale like
       temperature's cannot give five different sizes of step — asking for that hung) */
    let g = 0;
    do {
      v = readingsOf(r, sc, 6, "any");
      const big = Math.max(...steps(v).map(Math.abs));
      if (steps(v).filter((x) => Math.abs(x) === big).length === 1) break;
    } while (++g < 300);
    return { d: LDATA.indexOf(d), sc, v, a: r.int(0, 4) };
  },
  render(item) {
    const d = LDATA[item.d];
    const xs = d.xs.slice(0, 6);
    const names = intervalNames(xs);
    const fig = lineSvg({ xs, series: [{ values: item.v }], step: item.sc.step, top: item.sc.top, title: d.title, yLabel: d.yLabel });
    return side(art(fig),
      ask(`From ${names[item.a]}, the line is`) + tick("rising", "falling") +
      ask("The biggest change was") + tick(...names) +
      ask(`By how much? ${box()}`));
  },
  key(item) {
    const s = steps(item.v);
    const big = s.map(Math.abs).indexOf(Math.max(...s.map(Math.abs)));
    return [want.tick(s[item.a] > 0 ? 0 : 1), want.tick(big), want.num(Math.abs(s[big]))];
  },
  answer(item) {
    const s = steps(item.v);
    const big = s.map(Math.abs).indexOf(Math.max(...s.map(Math.abs)));
    return [`${s[item.a] > 0 ? "rising" : "falling"}; biggest ${intervalNames(LDATA[item.d].xs.slice(0, 6))[big]}, by ${fmt(Math.abs(s[big]))}`];
  },
};

const TWO = [["Ada", "Bayo"], ["Plant A", "Plant B"], ["This year", "Last year"]];

const lnTwo = {
  id: "ln-two",
  group: "ln-trend",
  label: "Two lines on one graph",
  blurb: "The key says which line is which. Where they cross, they are the same.",
  heading: "Compare the two lines",
  minLevel: "middle",
  instruction: () =>
    "Two lines share one scale — the key says which is which. At each time, the higher line is the bigger " +
    "reading. Where the lines cross, the two readings are the same.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const d = dataFor(r, o, i + 4);
    const sc = scaleOf(o, { d });
    for (let g = 0; g < 400; g++) {
      const a = readingsOf(r, sc, 6, "any");
      const b = readingsOf(r, sc, 6, "any");
      const same = a.map((x, j) => (x === b[j] ? j : -1)).filter((j) => j >= 0);
      if (same.length !== 1) continue;
      return { d: LDATA.indexOf(d), sc, a, b, same: same[0], names: r.pick(TWO), at: (same[0] + 2) % 6 };
    }
    return { d: 0, sc, a: [1, 2, 3, 4, 5, 6].map((x) => x * sc.step), b: [2, 2, 2, 5, 5, 5].map((x) => x * sc.step), same: 1, names: TWO[0], at: 3 };
  },
  render(item) {
    const d = LDATA[item.d];
    const xs = d.xs.slice(0, 6);
    const [n1, n2] = item.names;
    const fig = lineSvg({ xs, series: [{ values: item.a, name: n1 }, { values: item.b, name: n2 }], step: item.sc.step, top: item.sc.top, title: d.title, yLabel: d.yLabel });
    return side(art(fig),
      ask(`At ${xs[item.at]}, ${n1}: ${box()} and ${n2}: ${box()}`) +
      ask("The two were the same at") + tick(...xs) +
      ask(`At how many of the times was ${n1} higher? ${box()}`));
  },
  key(item) {
    return [want.num(item.a[item.at]), want.num(item.b[item.at]), want.tick(item.same), want.num(item.a.filter((x, j) => x > item.b[j]).length)];
  },
  answer(item) {
    return [`${item.names[0]} ${item.a.map(fmt).join(", ")}; ${item.names[1]} ${item.b.map(fmt).join(", ")}`];
  },
};

/* ═══ 6. problems ══════════════════════════════════════════════════════════*/

/* A straight line from 0: every litre costs the same, so the graph is a line
   and can be read either way — and doubled to go past its end. */
const lnConvert = {
  id: "ln-convert",
  group: "ln-solve",
  label: "A conversion graph",
  blurb: "Litres to naira: read it across, read it back, go past its end.",
  heading: "Use the conversion graph",
  minLevel: "middle",
  instruction: () =>
    "The line changes one amount into another. To change litres to naira, go up from the litres to the " +
    "line and across. To go the other way, go across from the naira to the line and down. For more than the " +
    "graph shows, use a number you CAN read and multiply.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const price = tier(o) === "stretch" ? r.pick([600, 700, 800]) : r.pick([200, 300, 500]);
    return { price, a: r.int(2, 9), back: r.int(2, 9), far: r.pick([20, 30, 50]) };
  },
  render(item) {
    const xs = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const top = item.price * 10;
    const fig = lineSvg({ xs, series: [{ values: xs.map((x) => Number(x) * item.price) }], step: item.price, top, title: "Cost of petrol", yLabel: "naira (₦)", xLabel: "litres", slot: 8.5 });
    return side(art(fig),
      ask(`${item.a} litres cost ₦${box()}`) +
      ask(`₦${item.back * item.price} buys ${box()} litres`) +
      ask(`${item.far} litres cost ₦${box()}`));
  },
  key(item) {
    return [want.num(item.a * item.price), want.num(item.back), want.num(item.far * item.price)];
  },
  answer(item) {
    return [`₦${item.a * item.price}; ${item.back} litres; ₦${item.far * item.price}`];
  },
};

const FAULTS = ["The scale does not start at 0", "The times are not evenly spaced", "Nothing is wrong"];
let faultTurn = 0;

const lnWrong = {
  id: "ln-wrong",
  group: "ln-solve",
  label: "What is wrong with it?",
  blurb: "A scale that starts high makes a small change look huge; bunched-up times hide how fast it changed.",
  heading: "What is wrong with this line graph?",
  instruction: () =>
    "A fair line graph starts its scale at 0 (or says clearly that it does not), and spaces its times " +
    "evenly — one hour is always the same width. Tick what is wrong, or that nothing is.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    if (i === 0) faultTurn = r.int(0, 2);
    const fault = (i + faultTurn) % 3;
    /* fixed readings, so never the temperature (its own scale is 15 to 40) */
    const cool = LDATA.filter((x) => !x.warm);
    const d = cool[r.int(0, cool.length - 1)];
    return { d: LDATA.indexOf(d), fault, v: fault === 0 ? [50, 52, 51, 53, 55, 54] : [2, 4, 5, 7, 6, 8] };
  },
  render(item) {
    const d = LDATA[item.d];
    const xs = d.xs.slice(0, 6);
    const base = { xs, series: [{ values: item.v }], title: d.title, yLabel: d.yLabel };
    const fig = item.fault === 0 ? lineSvg({ ...base, step: 1, top: 56, from: 49 })
      : item.fault === 1 ? lineSvg({ ...base, xs: ["6am", "7am", "8am", "12pm", "5pm", "6pm"], step: 1, top: 10, xAt: [0, 0.2, 0.4, 0.6, 0.8, 1] })
        : lineSvg({ ...base, step: 1, top: 10 });
    return art(fig) + tick(...FAULTS);
  },
  key(item) {
    return [want.tick(item.fault)];
  },
  answer(item) {
    return [FAULTS[item.fault]];
  },
};

export const LN_EXERCISES = [
  lnBars,
  lnRead,
  lnBetween,
  lnDraw,
  lnTrend, lnTwo,
  lnConvert, lnWrong,
];

void buildPoints;
