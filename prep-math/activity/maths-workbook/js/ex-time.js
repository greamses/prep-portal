/* ============================================================================
   Maths Workbook — COUNTING IN FIVES, and TELLING THE TIME
   ----------------------------------------------------------------------------
   Two families, and the first exists for the second.

   Counting in fives is on this paper because a clock has sixty minutes and
   twelve numbers, and the whole of "twenty-five past" is being able to land on
   5, 10, 15, 20, 25 while pointing at 1, 2, 3, 4, 5. A child who cannot count
   in fives is not learning to tell the time, they are learning to recognise
   twelve pictures. So the fives come first, they end ON a clock face with the
   minutes written round the outside, and only then do the hands appear.

   THE TIMES ARE TAUGHT IN THE ORDER THEY ARE TAUGHT: o'clock, half past,
   quarter past, quarter to, then every five minutes, then all of it mixed.
   Each is its own exercise so a page can be one of them and nothing else,
   which is what a child who has just met "quarter to" needs.

   And every kind is asked BOTH WAYS — read the clock, and draw the hands —
   because a child who can only read one has learned to match shapes.
   ========================================================================== */

import { clockSvg, handKey, digital, timeWords, said } from "./clock.js";
import { helpOf } from "./ex-remainder.js";

const box = () => `<span class="rw-answer"></span>`;
const line = (size = "md") => `<span class="wb-line wb-line--${size}"></span>`;

export const TIME_GROUPS = [
  {
    id: "fives",
    label: "Counting in fives",
    blurb: "Five, ten, fifteen — and then the same numbers round a clock face.",
  },
  {
    id: "time",
    label: "Telling the time",
    blurb: "O'clock, half past, quarter past and to, then every five minutes.",
  },
];

/* ── counting in fives ─────────────────────────────────────────────────────*/

const countFives = {
  id: "count-fives",
  group: "fives",
  label: "Fill in the fives",
  blurb: "A track of fives with some missing. Count on to fill the gaps.",
  heading: "Count in fives",
  instruction: () =>
    "Each step along the track is five more than the one before. Write the " +
    "missing numbers in.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const len = 8;
    const start = r.int(1, 6) * 5;
    const nums = Array.from({ length: len }, (_, i) => start + i * 5);
    /* Never the first one, so there is always something to count on FROM, and
       never so many gaps that the track stops being a track. */
    const gaps = new Set();
    const want = helpOf(o).id === "show" ? 2 : helpOf(o).id === "help" ? 3 : 4;
    let guard = 0;
    while (gaps.size < want && guard++ < 40) gaps.add(r.int(1, len - 1));
    return { nums, gaps: [...gaps] };
  },
  render(item) {
    const cells = item.nums
      .map((n, i) =>
        item.gaps.includes(i)
          ? `<span class="mt-track__cell mt-track__cell--gap"></span>`
          : `<span class="mt-track__cell">${n}</span>`
      )
      .join("");
    return `<div class="mt-track">${cells}</div>`;
  },
  worked() {
    const nums = [5, 10, 15, 20, 25, 30, 35, 40];
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<div class="mt-track">` +
      nums.map((n, i) => `<span class="mt-track__cell${i === 2 || i === 5 ? " mt-track__cell--was" : ""}">${n}</span>`).join("") +
      `</div>` +
      `<p class="wb-ask rw-worked__say">Twenty and five more is twenty-five. Count on in ` +
      `fives — the ones digit goes 5, 0, 5, 0 all the way along.</p></div>`
    );
  },
  answer(item) {
    return [item.gaps.sort((a, b) => a - b).map((i) => item.nums[i]).join(", ")];
  },
};

const countOn = {
  id: "count-on-fives",
  group: "fives",
  label: "Count on in fives",
  blurb: "Start where you are told and write the next few.",
  heading: "Count on in fives",
  instruction: () => "Start at the number given and write the next five numbers.",
  cols: 2,
  defaultCount: 6,
  make(r) {
    return { start: r.int(1, 11) * 5 };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Start at <b>${item.start}</b>.</p>` +
      `<p class="wb-ask">${[1, 2, 3, 4, 5].map(() => box()).join("")}</p>`
    );
  },
  answer(item) {
    return [[1, 2, 3, 4, 5].map((k) => item.start + k * 5).join(", ")];
  },
};

const fivesClock = {
  id: "fives-clock",
  group: "fives",
  label: "Fives round the clock",
  blurb: "The bridge: write the minute count round a clock face.",
  heading: "Write the fives round the clock",
  instruction: () =>
    "Start at the 12 and write 5 outside the 1, 10 outside the 2, and keep " +
    "counting in fives all the way round. This is what the numbers on a clock " +
    "are really counting.",
  cols: 2,
  defaultCount: 2,
  make() {
    return {};
  },
  render() {
    return `<div class="mt-art">${clockSvg(0, 0, { hands: false })}</div>`;
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<div class="mt-art">${clockSvg(0, 0, { hands: false, fives: true })}</div>` +
      `<p class="wb-ask rw-worked__say">The 1 is five minutes, the 2 is ten, the 3 is ` +
      `fifteen. All the way round is sixty — and sixty minutes is one hour.</p></div>`
    );
  },
  answer() {
    return ["5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60 round the face"];
  },
};

/* ── telling the time ──────────────────────────────────────────────────────*/

/* Every kind of time this paper deals in, and the minutes it is made of. */
const KINDS = {
  oclock: [0],
  half: [30],
  quarter: [15, 45],
  fives: [5, 10, 20, 25, 35, 40, 50, 55],
  any: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
};

/** A time of the given kind, dealt so a page of six is not four of one hour. */
function makeTime(kind) {
  let hourDeal = null;
  let minDeal = null;
  return (r, o, k, i) => {
    if (i === 0 || !hourDeal) {
      hourDeal = r.shuffle([...Array(12).keys()]);
      minDeal = r.shuffle(KINDS[kind].slice());
    }
    const h = hourDeal[i % hourDeal.length];
    const m = minDeal[i % minDeal.length];
    return { h, m };
  };
}

/** Read the clock and write the time — in words and in figures. */
function readOne(id, kind, label, blurb, heading, instruction, count) {
  return {
    id,
    group: "time",
    label,
    blurb,
    heading,
    instruction,
    cols: 2,
    defaultCount: count,
    make: makeTime(kind),
    render(item) {
      return (
        `<div class="mt-art">${clockSvg(item.h, item.m)}</div>` +
        `<p class="wb-ask">In words ${line("lg")}</p>` +
        `<p class="wb-ask">In figures ${box()}</p>`
      );
    },
    answer(item) {
      return [`${timeWords(item.h, item.m)} · ${digital(item.h, item.m)}`];
    },
  };
}

const oclock = readOne(
  "time-oclock", "oclock",
  "O'clock",
  "The minute hand is straight up. The hour hand says which hour.",
  "What o'clock is it?",
  () =>
    "When the long hand points straight up at the 12, it is exactly o'clock. " +
    "Read the short hand to find out which one.",
  6
);
oclock.worked = () =>
  `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
  handKey() +
  `<div class="mt-art">${clockSvg(3, 0)}</div>` +
  `<p class="wb-ask">In words <b>${timeWords(3, 0)}</b> &nbsp;·&nbsp; In figures <b>${digital(3, 0)}</b></p>` +
  `<p class="wb-ask rw-worked__say">The long hand is straight up, so it is exactly ` +
  `o'clock. The short hand is on the 3.</p></div>`;

const halfPast = readOne(
  "time-half", "half",
  "Half past",
  "The minute hand is straight down — and the hour hand has moved on halfway.",
  "Half past what?",
  () =>
    "When the long hand points straight down at the 6, half an hour has gone " +
    "by. Careful with the short hand: it is now HALFWAY between two numbers, " +
    "and the hour is the one it has passed.",
  6
);
halfPast.worked = () =>
  `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
  `<div class="mt-art">${clockSvg(3, 30)}</div>` +
  `<p class="wb-ask">In words <b>${timeWords(3, 30)}</b> &nbsp;·&nbsp; In figures <b>${digital(3, 30)}</b></p>` +
  `<p class="wb-ask rw-worked__say">The long hand is at the 6, so it is half past. The ` +
  `short hand sits between the 3 and the 4 — it is half past <b>three</b>, the hour it ` +
  `has already gone by.</p></div>`;

const quarters = readOne(
  "time-quarter", "quarter",
  "Quarter past and quarter to",
  "A quarter of the way round, and a quarter still to go.",
  "Quarter past, or quarter to?",
  () =>
    "The long hand at the 3 is a quarter past. At the 9 it is a quarter TO — " +
    "and then the hour you say is the one it is going to, not the one it has left.",
  6
);
quarters.worked = () =>
  `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
  `<div class="mt-two">` +
  `<span><div class="mt-art">${clockSvg(3, 15)}</div>` +
  `<p class="wb-ask"><b>${timeWords(3, 15)}</b> · <b>${digital(3, 15)}</b></p></span>` +
  `<span><div class="mt-art">${clockSvg(3, 45)}</div>` +
  `<p class="wb-ask"><b>${timeWords(3, 45)}</b> · <b>${digital(3, 45)}</b></p></span>` +
  `</div>` +
  `<p class="wb-ask rw-worked__say">Both short hands are between the 3 and the 4. The ` +
  `first is quarter past <b>three</b>; the second is quarter to <b>four</b>, because ` +
  `there is only a quarter of an hour left to go.</p></div>`;

const fiveMinutes = readOne(
  "time-fives", "fives",
  "Every five minutes",
  "Count round in fives to find the minutes.",
  "Count the minutes in fives",
  () =>
    "Count round from the 12 in fives to reach the long hand: 5, 10, 15 and on. " +
    "Up to half past say PAST; after half past, count backwards to the 12 and say TO.",
  6
);
fiveMinutes.worked = () =>
  `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
  `<div class="mt-art">${clockSvg(7, 25, { fives: true })}</div>` +
  `<p class="wb-ask">In words <b>${timeWords(7, 25)}</b> &nbsp;·&nbsp; In figures <b>${digital(7, 25)}</b></p>` +
  `<p class="wb-ask rw-worked__say">Counting round from the 12 — five, ten, fifteen, ` +
  `twenty, twenty-five — lands on the long hand. The short hand has passed the 7.</p></div>`;

const anyTime = readOne(
  "time-any", "any",
  "Any time, mixed up",
  "All of it together, which is what a real clock does.",
  "What time is it?",
  () =>
    "Read the long hand first to get the minutes, then the short hand for the hour.",
  6
);

const drawTime = {
  id: "time-draw",
  group: "time",
  label: "Draw the hands",
  blurb: "The same skill backwards — and the one that shows whether it is understood.",
  heading: "Draw the hands on the clock",
  instruction: () =>
    "Draw the two hands to show the time. Remember: the hour hand is SHORT and " +
    "the minute hand is LONG, and past half past the hour hand is nearly at the next number.",
  cols: 2,
  defaultCount: 6,
  make: makeTime("any"),
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">${said(item.h, item.m)}</p>` +
      `<div class="mt-art">${clockSvg(item.h, item.m, { hands: false })}</div>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<p class="wb-ask wb-ask--lead">${said(8, 40)}</p>` +
      `<div class="mt-art">${clockSvg(8, 40)}</div>` +
      `<p class="wb-ask rw-worked__say">Twenty to nine is forty minutes past eight, so the ` +
      `long hand is at the 8. The short hand is most of the way from the 8 to the 9.</p></div>`
    );
  },
  answer(item) {
    return [`${digital(item.h, item.m)} — long hand on the ${(item.m / 5) % 12 || 12}`];
  },
};

const matchTime = {
  id: "time-match",
  group: "time",
  label: "Join the clock to the words",
  blurb: "Clocks down one side, times down the other. Draw the lines.",
  heading: "Join each clock to its time",
  instruction: () => "Draw a line from each clock to the time it is showing.",
  cols: 1,
  groupSize: 4,
  defaultCount: 4,
  make(r, o, k) {
    const mins = r.shuffle([0, 15, 30, 45, 5, 20, 25, 40]).slice(0, k);
    const hours = r.shuffle([...Array(12).keys()]).slice(0, k);
    const times = mins.map((m, i) => ({ h: hours[i], m }));
    return { times, right: r.shuffle(times.slice()) };
  },
  render(item) {
    const left = item.times
      .map((t) => `<li><span class="wb-match__dot"></span><span>${clockSvg(t.h, t.m, { mm: 34 })}</span></li>`)
      .join("");
    const right = item.right
      .map((t) => `<li><span class="wb-match__dot"></span><span>${timeWords(t.h, t.m)}</span></li>`)
      .join("");
    return (
      `<div class="wb-match mt-match">` +
      `<ul class="wb-match__side">${left}</ul>` +
      `<ul class="wb-match__side wb-match__side--right">${right}</ul>` +
      `</div>`
    );
  },
  answer(item) {
    return item.times.map((t) => `${digital(t.h, t.m)} → ${timeWords(t.h, t.m)}`);
  },
};

export const TIME_EXERCISES = [
  countFives, countOn, fivesClock,
  oclock, halfPast, quarters, fiveMinutes, anyTime, drawTime, matchTime,
];
