/* ============================================================================
   Geometry Workbook — CHAPTER 13: CLOCK ANGLES AND BEARINGS
   ----------------------------------------------------------------------------
   Two places where a whole turn of 360° is put to work.

   CLOCK ANGLES — the face is 12 equal parts of 30°, and 60 minutes of 6°
     between the marks      from one hour mark to another: 30° each
     on the hour            the angle between the hands at 4 o'clock
     at other times         the hour hand has moved on too: ½° every minute
     how far a hand turns   the minute hand 6° a minute; the hour hand ½°

   BEARINGS — a direction as an angle: from NORTH, CLOCKWISE, three figures
     read a bearing         the line's angle from the nearest compass arm,
                            turned into an angle from north
     compass directions     NE is 045°, S 20° W is 200°
     back bearings          the way home: 180° more, or 180° less
     between two bearings   the angle between two directions from one point

   Every answer is a whole number of degrees. The clock and the compass are
   drawn here; a bearing typed without its leading noughts (45 for 045) is
   taken as right, the three figures being how it is WRITTEN.
   ========================================================================== */

import { levelOf } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const art = (svg) => `<div class="gw-art">${svg}</div>`;
const side = (figure, words) => `<div class="gw-side">${figure}<div class="gw-lines">${words}</div></div>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const tier = (o) => levelOf(o).id;
const f = (n) => (+n).toFixed(2);
const three = (b) => String(b).padStart(3, "0");
const INK = "#2a2723", GREY = "#8a837a";

/* ── the clock ─────────────────────────────────────────────────────────── */

/** A clock face showing h:m — or, with marks, two hour marks picked out. */
function clockSvg({ h = null, m = 0, marks = null }) {
  const R = 20, C = 23;
  const at = (deg, r) => [C + r * Math.sin((deg * Math.PI) / 180), C - r * Math.cos((deg * Math.PI) / 180)];
  let s = `<circle cx="${C}" cy="${C}" r="${R}" fill="#fffdf8" stroke="${INK}" stroke-width="0.6"/>`;
  for (let k = 1; k <= 12; k++) {
    const [x, y] = at(k * 30, R - 3.6);
    const hot = marks && marks.includes(k);
    s += `<text x="${f(x)}" y="${f(y + 1.3)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.6" font-weight="${hot ? 800 : 600}" fill="${hot ? "#c0453f" : INK}">${k}</text>`;
    const [a, b] = at(k * 30, R), [c, d] = at(k * 30, R - 1.4);
    s += `<line x1="${f(a)}" y1="${f(b)}" x2="${f(c)}" y2="${f(d)}" stroke="${INK}" stroke-width="0.45"/>`;
  }
  if (marks) marks.forEach((k) => { const [x, y] = at(k * 30, R - 7); s += `<line x1="${C}" y1="${C}" x2="${f(x)}" y2="${f(y)}" stroke="#c0453f" stroke-width="0.5" stroke-dasharray="1.2 0.9"/>`; });
  if (h != null) {
    const [hx, hy] = at((h % 12) * 30 + m * 0.5, R - 10), [mx, my] = at(m * 6, R - 5.6);
    s += `<line x1="${C}" y1="${C}" x2="${f(hx)}" y2="${f(hy)}" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/>` +
      `<line x1="${C}" y1="${C}" x2="${f(mx)}" y2="${f(my)}" stroke="#2f6ea8" stroke-width="0.7" stroke-linecap="round"/>`;
  }
  s += `<circle cx="${C}" cy="${C}" r="0.9" fill="${INK}"/>`;
  return `<svg class="gw-fig" viewBox="0 0 46 46" width="46mm" height="46mm" role="img" aria-label="A clock face">${s}</svg>`;
}
/** The smaller angle between the hands at h:m. */
export function handsAngle(h, m) {
  const d = Math.abs((h % 12) * 30 + m * 0.5 - m * 6);
  return Math.min(d, 360 - d);
}
const timeText = (h, m) => (m === 0 ? `${h} o'clock` : `${h}:${String(m).padStart(2, "0")}`);

export const CK_GROUPS = [
  { id: "ck-clock", chapter: "Chapter 13 · Clock angles and bearings", label: "Clock angles", blurb: "Twelve parts of 30°: the angle between the hands." },
  { id: "br-bearing", label: "Bearings", blurb: "From north, clockwise, in three figures." },
];

const ckMarks = {
  id: "ck-marks",
  group: "ck-clock",
  label: "Between the hour marks",
  blurb: "A full turn shared between 12 marks: 30° each.",
  heading: "Clock angles: between the marks",
  instruction: () =>
    "The clock face is a full turn, 360°, shared equally between its 12 hour marks — so from one mark to the next " +
    "is 360 ÷ 12 = 30°. Count the gaps between the two marks (the shorter way round) and multiply by 30.",
  cols: 2,
  defaultCount: 4,
  make(r) {
    const a = r.int(1, 12);
    const gap = r.int(1, 6);
    return { a, b: ((a + gap - 1) % 12) + 1, gap };
  },
  render: (it) => side(art(clockSvg({ marks: [it.a, it.b] })), ask(`From ${it.a} to ${it.b}: ${box()}°`)),
  worked: () => worked(say("From 12 to 4 is 4 gaps: 4 × 30° = 120°.")),
  key: (it) => [want.num(it.gap * 30)],
  answer: (it) => [`${it.gap} × 30° = ${it.gap * 30}°`],
};

const ckHour = {
  id: "ck-hour",
  group: "ck-clock",
  label: "The hands on the hour",
  blurb: "At 4 o'clock the hands are 4 gaps apart.",
  heading: "Clock angles: on the hour",
  instruction: () =>
    "On the hour the minute hand points at 12 and the hour hand at the hour. Count the gaps between them and " +
    "multiply by 30° — and give the SMALLER angle: after 6 o'clock it is shorter to go the other way round " +
    "(360° take away the big angle).",
  cols: 2,
  defaultCount: 4,
  make: (r) => ({ h: r.int(1, 11) }),
  render: (it) => side(art(clockSvg({ h: it.h })), ask(`At ${it.h} o'clock: ${box()}°`)),
  worked: () => worked(say("At 8 o'clock the hands are 8 gaps apart the long way: 240°. The shorter way is 360° − 240° = 120° (4 gaps).")),
  key: (it) => [want.num(handsAngle(it.h, 0))],
  answer: (it) => [`${handsAngle(it.h, 0)}°`],
};

const ckOther = {
  id: "ck-other",
  group: "ck-clock",
  label: "The hands at other times",
  blurb: "The hour hand has moved on: half a degree every minute.",
  heading: "Clock angles: at any time",
  instruction: () =>
    "The hour hand does not wait at its number: in 60 minutes it creeps 30°, which is ½° every minute — one small " +
    "minute mark (6°) for every 12 minutes. So at h:m " +
    "the hour hand is at 30 × h + ½ × m degrees from the 12, and the minute hand at 6 × m. Take one from the " +
    "other; if it is more than 180°, take it from 360°.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const mins = t === "gentle" ? [30] : t === "middle" ? [20, 30, 40, 10] : [10, 20, 30, 40, 50, 12, 24, 36, 48];
    return { h: r.int(1, 12), m: r.pick(mins) };
  },
  render(it) {
    return side(art(clockSvg({ h: it.h, m: it.m })),
      ask(`At ${timeText(it.h, it.m)}:`) + ask(`hour hand at ${box()}° &nbsp; minute hand at ${box()}°`) + ask(`angle between them: ${box()}°`));
  },
  worked: () => worked(say("At 3:30 the hour hand is at 30 × 3 + ½ × 30 = 105°, and the minute hand at 6 × 30 = 180°. The angle between them is 180° − 105° = 75°.")),
  key: (it) => [want.num((it.h % 12) * 30 + it.m / 2), want.num(it.m * 6), want.num(handsAngle(it.h, it.m))],
  answer: (it) => [`hour ${(it.h % 12) * 30 + it.m / 2}°, minute ${it.m * 6}°: ${handsAngle(it.h, it.m)}°`],
};

const ckTurn = {
  id: "ck-turn",
  group: "ck-clock",
  label: "How far a hand turns",
  blurb: "The minute hand 6° a minute; the hour hand ½°.",
  heading: "Clock angles: turning",
  instruction: () =>
    "The minute hand goes right round, 360°, in 60 minutes: 6° every minute. The hour hand goes right round in 12 " +
    "hours: 30° every hour, which is ½° every minute. Multiply by the time that has gone by.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    const kind = r.int(0, t === "gentle" ? 1 : 2);
    if (kind === 0) { const m = r.pick([5, 10, 15, 20, 25, 35, 40, 45]); return { text: `Through what angle does the MINUTE hand turn in ${m} minutes?`, v: 6 * m, how: `6 × ${m}` }; }
    if (kind === 1) { const h = r.int(2, 9); return { text: `Through what angle does the HOUR hand turn in ${h} hours?`, v: 30 * h, how: `30 × ${h}` }; }
    const m = r.pick([20, 30, 40, 50, 90, 100]);
    return { text: `Through what angle does the HOUR hand turn in ${m} minutes?`, v: m / 2, how: `½ × ${m}` };
  },
  render: (it) => ask(`${it.text} ${box()}°`),
  worked: () => worked(say("In 20 minutes the minute hand turns 6 × 20 = 120°. In the same 20 minutes the hour hand turns only ½ × 20 = 10°.")),
  key: (it) => [want.num(it.v)],
  answer: (it) => [`${it.how} = ${it.v}°`],
};

/* ── bearings ──────────────────────────────────────────────────────────── */

/** A compass cross with a direction line at bearing b; the angle from one arm is marked. */
function compassSvg(b, { from = null, name = "B", second = null } = {}) {
  const C = 25, R = 19;
  const at = (deg, r) => [C + r * Math.sin((deg * Math.PI) / 180), C - r * Math.cos((deg * Math.PI) / 180)];
  let s = "";
  [["N", 0], ["E", 90], ["S", 180], ["W", 270]].forEach(([n, d]) => {
    const [x, y] = at(d, R), [lx, ly] = at(d, R + 3.4);
    s += `<line x1="${C}" y1="${C}" x2="${f(x)}" y2="${f(y)}" stroke="${GREY}" stroke-width="0.4"/>` +
      `<text x="${f(lx)}" y="${f(ly + 1.3)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.6" font-weight="800" fill="${INK}">${n}</text>`;
  });
  const [nx, ny] = at(0, R);
  s += `<path d="M${f(nx)} ${f(ny - 1.6)}l-1.3 2.6h2.6z" fill="${INK}"/>`;
  const ray = (deg, col, label) => {
    const [x, y] = at(deg, R - 1), [lx, ly] = at(deg, R - 5.5);
    return `<line x1="${C}" y1="${C}" x2="${f(x)}" y2="${f(y)}" stroke="${col}" stroke-width="0.8"/>` +
      `<text x="${f(lx + 2)}" y="${f(ly + 1.2)}" font-family="JetBrains Mono, monospace" font-size="3.4" font-weight="800" fill="${col}">${label}</text>`;
  };
  s += ray(b, "#2f6ea8", name);
  if (second != null) s += ray(second, "#c0453f", "A");
  if (from != null) {
    /* the marked angle: from the arm at `from` round to the line */
    const a0 = Math.min(from, b), a1 = Math.max(from, b);
    const [x0, y0] = at(a0, 7), [x1, y1] = at(a1, 7), [tx, ty] = at((a0 + a1) / 2, 11.5);
    s += `<path d="M${f(x0)} ${f(y0)}A7 7 0 0 1 ${f(x1)} ${f(y1)}" fill="none" stroke="#c0453f" stroke-width="0.5"/>` +
      `<text x="${f(tx)}" y="${f(ty + 1.2)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.1" font-weight="700" fill="#c0453f">${a1 - a0}°</text>`;
  }
  s += `<circle cx="${C}" cy="${C}" r="0.9" fill="${INK}"/><text x="${C - 2.6}" y="${C + 4}" font-family="JetBrains Mono, monospace" font-size="3.2" font-weight="800" fill="${INK}">O</text>`;
  return `<svg class="gw-fig" viewBox="0 0 50 50" width="50mm" height="50mm" role="img" aria-label="A compass with a direction marked">${s}</svg>`;
}

const brRead = {
  id: "br-read",
  group: "br-bearing",
  label: "Read a bearing",
  blurb: "The angle from north, clockwise — built from the nearest arm.",
  heading: "Bearings: reading one",
  instruction: () =>
    "A BEARING is a direction given as an angle: start facing NORTH, turn CLOCKWISE, and stop at the direction. It " +
    "is always written with three figures (045°, not 45°). The diagram marks the angle from one arm of the " +
    "compass: north is 0°, east 90°, south 180°, west 270° — add the marked angle to its arm, or take it away if " +
    "the line comes before the arm.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    for (;;) {
      const arm = r.pick(t === "gentle" ? [0, 90] : [0, 90, 180, 270]);
      const off = r.pick([10, 20, 25, 30, 35, 40, 50, 60, 65, 70]) * (t !== "gentle" && arm > 0 && r.chance(0.4) ? -1 : 1);
      const b = arm + off;
      if (b > 0 && b < 360 && b % 90 !== 0) return { b, arm };
    }
  },
  render: (it) => side(art(compassSvg(it.b, { from: it.arm })), ask(`The bearing of B from O is ${box()}°`)),
  worked: () => worked(say("If the line is 40° past EAST: east is 090°, so the bearing is 90 + 40 = 130°. If it is 30° BEFORE south: 180 − 30 = 150°.")),
  key: (it) => [want.num(it.b)],
  answer: (it) => [`${three(it.b)}°`],
};

const POINTS = [["N", 0], ["NE", 45], ["E", 90], ["SE", 135], ["S", 180], ["SW", 225], ["W", 270], ["NW", 315]];

const brCompass = {
  id: "br-compass",
  group: "br-bearing",
  label: "Compass directions as bearings",
  blurb: "NE is 045°; S 20° W is 200°.",
  heading: "Bearings: from compass directions",
  instruction: () =>
    "The eight compass points are 45° apart: N 000°, NE 045°, E 090°, SE 135°, S 180°, SW 225°, W 270°, NW 315°. A " +
    "direction like S 20° W means “face SOUTH, then turn 20° towards WEST”: from south (180°), towards west is " +
    "clockwise, so 180 + 20 = 200°. N 30° W is 30° back from north: 360 − 30 = 330°.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    if (tier(o) === "gentle" || r.chance(0.35)) { const [n, d] = r.pick(POINTS); return { text: n, b: d }; }
    const ns = r.pick(["N", "S"]), ew = r.pick(["E", "W"]), a = r.pick([10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80]);
    const b = ns === "N" ? (ew === "E" ? a : 360 - a) : (ew === "E" ? 180 - a : 180 + a);
    return { text: `${ns} ${a}° ${ew}`, b };
  },
  render: (it) => ask(`${it.text} = ${box()}°`),
  worked: () => worked(say("S 20° W: south is 180°, and turning towards west goes on clockwise: 180 + 20 = 200°.")),
  key: (it) => [want.num(it.b)],
  answer: (it) => [`${three(it.b)}°`],
};

const brBack = {
  id: "br-back",
  group: "br-bearing",
  label: "Back bearings",
  blurb: "The way back: 180° more, or 180° less.",
  heading: "Bearings: the way back",
  instruction: () =>
    "If B is on a bearing from A, then to go BACK from B to A you face exactly the opposite way: a half turn, 180°. " +
    "Add 180° if the bearing is less than 180°; take 180° away if it is more. The answer must stay between 000° " +
    "and 360°.",
  cols: 2,
  defaultCount: 6,
  make: (r) => ({ b: r.int(1, 71) * 5 }),
  render: (it) => ask(`The bearing of B from A is ${three(it.b)}°. The bearing of A from B is ${box()}°`),
  worked: () => worked(say("070° is less than 180°, so add: 70 + 180 = 250°. For 310°, take away: 310 − 180 = 130°.")),
  key: (it) => [want.num((it.b + 180) % 360)],
  answer: (it) => [`${three((it.b + 180) % 360)}°`],
};

const brBetween = {
  id: "br-between",
  group: "br-bearing",
  label: "The angle between two bearings",
  blurb: "Two directions from one point: take one from the other.",
  heading: "Bearings: the angle between two directions",
  instruction: () =>
    "Two places A and B are on different bearings from O. The angle AOB between the two directions is the " +
    "difference of the two bearings — and if that comes to more than 180°, the angle the other way round is " +
    "smaller: take it from 360°.",
  cols: 1,
  defaultCount: 3,
  make(r) {
    for (;;) {
      const a = r.int(2, 70) * 5, b = r.int(2, 70) * 5;
      const d = Math.abs(a - b);
      if (d >= 20 && d !== 180 && Math.abs(d - 180) >= 15) return { a, b, v: Math.min(d, 360 - d) };
    }
  },
  render: (it) => side(art(compassSvg(it.b, { second: it.a })),
    ask(`A is on a bearing of ${three(it.a)}° from O, and B on a bearing of ${three(it.b)}°.`) + ask(`Angle AOB = ${box()}°`)),
  worked: () => worked(say("A on 070° and B on 160°: 160 − 70 = 90°. A on 020° and B on 300°: 300 − 20 = 280°, more than 180°, so the angle is 360 − 280 = 80°.")),
  key: (it) => [want.num(it.v)],
  answer: (it) => [`${it.v}°`],
};

export const CK_EXERCISES = [ckMarks, ckHour, ckOther, ckTurn, brRead, brCompass, brBack, brBetween];
