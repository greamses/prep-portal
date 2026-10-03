/* ============================================================================
   Algebra Workbook — CHAPTER 7 opens: UNDERSTANDING GRAPHS
   ----------------------------------------------------------------------------
   Before a rule is drawn as a line, a graph has to be readable at all: two
   number lines crossed, and a point is a pair of numbers — along first, then
   up. So the chapter begins with the grid itself:

     read the coordinates    three lettered points: (along, up) for each
     plot the points         a list of pairs, a cross at each (tapped on screen,
                             the shared dotplot.js)
     the four quadrants      (Middle+) which quarter of the grid a point is in,
                             from the signs of its numbers — or on an axis
     a real-life graph       a journey: distance from home against time. Read
                             how far at a time, how long the flat part (a stop)
                             lasts, and which stretch is steepest (fastest)

   Every point is a whole number on a whole-number grid.
   ========================================================================== */

import { planeSvg } from "./gridart.js";
import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq">${html}</p>`;
const art = (html) => `<div class="ab-art">${html}</div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const side = (a, b) => `<div class="fn-side">${a}<div class="fn-lines">${b}</div></div>`;

const tier = (o) => levelOf(o).id;
const num = (v) => (v < 0 ? `−${-v}` : String(v));
const pair = ([x, y]) => `(${num(x)}, ${num(y)})`;

/** The grid a level uses: the first quarter only at Gentle, all four above it. */
const gridOf = (o) => (tier(o) === "gentle" ? { x: [0, 8], y: [0, 8] } : { x: [-5, 5], y: [-5, 5] });
/** n different whole-number points on that grid, none at the origin. */
function pointsOn(r, o, n, { axes = true } = {}) {
  const g = gridOf(o);
  const out = [];
  while (out.length < n) {
    const p = [r.int(g.x[0], g.x[1]), r.int(g.y[0], g.y[1])];
    if (p[0] === 0 && p[1] === 0) continue;
    if (!axes && (p[0] === 0 || p[1] === 0)) continue;
    if (out.some((q) => q[0] === p[0] && q[1] === p[1])) continue;
    out.push(p);
  }
  return out;
}

export const UG_GROUPS = [
  { id: "gr-know", chapter: "Chapter 7 · Graphs of functions", label: "Understanding graphs", blurb: "Along then up: reading and plotting points, the quadrants, a real-life graph." },
];

/* ═══ read the coordinates ═════════════════════════════════════════════════*/

const ugRead = {
  id: "ug-read",
  group: "gr-know",
  label: "Read the coordinates",
  blurb: "(along, up) for each lettered point.",
  heading: "Reading coordinates",
  instruction: () =>
    "A point is written (x, y): x is how far ALONG from 0 (right is plus, left is minus), and y is how far UP " +
    "(down is minus). Always along first, then up — “along the corridor, then up the stairs”. Write each " +
    "lettered point's two numbers.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { pts: pointsOn(r, o, 3) };
  },
  render(item, o) {
    const g = gridOf(o);
    const names = ["A", "B", "C"];
    return side(art(planeSvg({ ...g, cell: 4.4, pts: item.pts.map((p, i) => [...p, names[i]]) })),
      names.map((n) => eq(`${n} = (${box()}, ${box()})`)).join(""));
  },
  worked() {
    return worked(say("A point 3 squares right of 0 and 2 squares up is (3, 2). One 2 squares LEFT and 4 DOWN is " +
      "(−2, −4). A point on the y axis has not gone along at all: (0, 5)."));
  },
  key(item) {
    return item.pts.flat().map((v) => want.num(v));
  },
  answer(item) {
    return [item.pts.map((p, i) => `${"ABC"[i]} ${pair(p)}`).join(", ")];
  },
};

/* ═══ plot the points ══════════════════════════════════════════════════════*/

const ugPlot = {
  id: "ug-plot",
  group: "gr-know",
  label: "Plot the points",
  blurb: "Along to x, up to y, and a cross.",
  heading: "Plotting points",
  instruction: () =>
    "For each pair, start at 0, go ALONG to the first number, then UP (or down) to the second, and mark a " +
    "cross. On screen, tap the grid where the cross goes; tap it again to take it off.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { pts: pointsOn(r, o, 4) };
  },
  render(item, o) {
    const g = gridOf(o);
    return side(art(planeSvg({ ...g, cell: 4.4, build: true })),
      ask(`Plot ${item.pts.map(pair).join(", ")}.`));
  },
  key(item) {
    return [want.dots({ points: item.pts, says: item.pts.map(pair).join(" ") })];
  },
  answer(item) {
    return [item.pts.map(pair).join(" ")];
  },
};

/* ═══ the quadrants ════════════════════════════════════════════════════════*/

const QUARTERS = ["first (+, +)", "second (−, +)", "third (−, −)", "fourth (+, −)", "on an axis"];
const quarterOf = ([x, y]) => (x === 0 || y === 0 ? 4 : x > 0 && y > 0 ? 0 : x < 0 && y > 0 ? 1 : x < 0 ? 2 : 3);

const ugQuad = {
  id: "ug-quad",
  group: "gr-know",
  label: "The four quadrants",
  blurb: "The signs of x and y say which quarter of the grid.",
  heading: "Which quadrant?",
  hardest: true,
  instruction: () =>
    "The axes cut the grid into four QUADRANTS, numbered round the way the hands of a clock do NOT go: the " +
    "first is top right (x and y both plus), the second top left, the third bottom left, the fourth bottom " +
    "right. A point with a 0 in it sits on an axis, in no quadrant. Tick where each point is.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const [p] = pointsOn(r, o, 1);
    return { p };
  },
  render(item) {
    return ask(`${pair(item.p)} is in the ${tick(...QUARTERS)}`);
  },
  worked() {
    return worked(say("(−3, 2): x is minus (left) and y plus (up), so top left — the second quadrant. (4, 0) " +
      "has not gone up or down at all: it is on the x axis."));
  },
  key(item) {
    return [want.tick(quarterOf(item.p))];
  },
  answer(item) {
    return [`${pair(item.p)}: ${QUARTERS[quarterOf(item.p)]}`];
  },
};

/* ═══ a real-life graph: a journey ═════════════════════════════════════════*/

/** A journey: whole hours, distances in tens of km; one stop, then home. */
function journey(r, o) {
  const t = tier(o);
  for (let g = 0; g < 400; g++) {
    const legs = [];
    let d = 0;
    const out1 = r.int(1, 2), stop = r.int(1, 2), out2 = r.int(1, 2), back = r.int(1, 3);
    const d1 = r.int(2, t === "gentle" ? 4 : 6) * 10;
    const d2 = d1 + r.int(1, t === "gentle" ? 3 : 5) * 10;
    legs.push([out1, d1]); d = d1;
    legs.push([stop, d]);
    legs.push([out2, d2]);
    legs.push([back, 0]);
    const speeds = [d1 / out1, 0, (d2 - d1) / out2, d2 / back];
    const fastest = speeds.indexOf(Math.max(...speeds));
    if (speeds.filter((s) => s === speeds[fastest]).length > 1) continue;
    /* the points the line passes through */
    const pts = [[0, 0]];
    legs.forEach(([h, dist]) => pts.push([pts[pts.length - 1][0] + h, dist]));
    const T = pts[pts.length - 1][0];
    const when = r.int(1, T - 1);
    const at = (x) => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); } return 0; };
    if (!Number.isInteger(at(when))) continue;
    return { pts, stop, fastest, ask: when, far: at(when), top: d2 };
  }
  return { pts: [[0, 0], [1, 30], [2, 30], [3, 50], [5, 0]], stop: 1, fastest: 0, ask: 1, far: 30, top: 50 };
}

/** The journey drawn: hours along, km up, the four stretches lettered. */
function journeySvg({ pts, top }) {
  const T = pts[pts.length - 1][0];
  const D = Math.ceil(top / 10) * 10 + 10;
  const L = 12, B = 9, W = 116, H = 66, TOP = 9;
  const X = (h) => L + (h / T) * (W - L - 4);
  const Y = (d) => H - B - (d / D) * (H - B - TOP);
  let s = "";
  for (let h = 0; h <= T; h++) s += `<line x1="${X(h)}" x2="${X(h)}" y1="${Y(0)}" y2="${Y(D)}" stroke="#dcd6ca" stroke-width="0.2"/><text x="${X(h)}" y="${Y(0) + 3.8}" font-size="2.6" text-anchor="middle" font-family="JetBrains Mono, monospace">${h}</text>`;
  for (let d = 0; d <= D; d += 10) s += `<line x1="${X(0)}" x2="${X(T)}" y1="${Y(d)}" y2="${Y(d)}" stroke="#dcd6ca" stroke-width="0.2"/><text x="${X(0) - 1.6}" y="${Y(d) + 0.9}" font-size="2.6" text-anchor="end" font-family="JetBrains Mono, monospace">${d}</text>`;
  s += `<line x1="${X(0)}" x2="${X(T)}" y1="${Y(0)}" y2="${Y(0)}" stroke="#2a2723" stroke-width="0.45"/><line x1="${X(0)}" x2="${X(0)}" y1="${Y(0)}" y2="${Y(D)}" stroke="#2a2723" stroke-width="0.45"/>`;
  s += `<text x="${(X(0) + X(T)) / 2}" y="${H - 1}" font-size="2.9" font-weight="700" text-anchor="middle" font-family="JetBrains Mono, monospace">time (hours)</text>`;
  s += `<text x="${X(0) + 2}" y="4.2" font-size="2.9" font-weight="700" font-family="JetBrains Mono, monospace">km from home</text>`;
  s += `<polyline points="${pts.map(([h, d]) => `${X(h)},${Y(d)}`).join(" ")}" fill="none" stroke="#2f6ea8" stroke-width="0.7"/>`;
  pts.slice(1).forEach(([h, d], i) => {
    const [h0, d0] = pts[i];
    s += `<text x="${(X(h0) + X(h)) / 2 + 1.5}" y="${(Y(d0) + Y(d)) / 2 - 1.6}" font-size="3.2" font-weight="800" fill="#c0453f" font-family="JetBrains Mono, monospace">${"ABCD"[i]}</text>`;
  });
  return `<svg class="gr-fig" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" role="img" aria-label="A journey graph">${s}</svg>`;
}

const ugJourney = {
  id: "ug-journey",
  group: "gr-know",
  label: "A journey graph",
  blurb: "Distance against time: a flat part is a stop, steeper is faster.",
  heading: "Reading a real-life graph",
  instruction: () =>
    "The graph shows how far someone is from home as the hours go by. Read a distance by going up from the " +
    "time to the line, then across. A FLAT stretch means the distance is not changing — they have stopped. " +
    "The STEEPER a stretch, the more km in each hour — the faster they went. Going down means coming home.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return journey(r, o);
  },
  render(item) {
    return side(art(journeySvg(item)),
      eq(`after ${item.ask} hour${item.ask > 1 ? "s" : ""}: ${box()} km from home`) +
      eq(`they stopped for ${box()} hours`) +
      ask(`The fastest stretch is ${tick("A", "B", "C", "D")}`));
  },
  worked() {
    return worked(say("Up from 1 hour to the line, then across: 30 km. Stretch B is flat from 1 to 2 hours, so " +
      "they stopped for 1 hour. Stretch A climbs 30 km in 1 hour, C 20 km in 1 hour, D comes down 50 km in 2 " +
      "hours (25 an hour) — A is steepest, the fastest."));
  },
  key(item) {
    return [want.num(item.far), want.num(item.stop), want.tick(item.fastest)];
  },
  answer(item) {
    return [`${item.far} km; stopped ${item.stop} h; fastest ${"ABCD"[item.fastest]}`];
  },
};

export const UG_EXERCISES = [ugRead, ugPlot, ugQuad, ugJourney];
