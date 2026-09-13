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

import { clockSvg, handKey, digital, digitalFace, timeWords, said } from "./clock.js";
import { helpOf } from "./ex-remainder.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="rw-answer"></span>`;
const line = (size = "md") => `<span class="wb-line wb-line--${size}"></span>`;

export const TIME_GROUPS = [
  {
    chapter: "Chapter 6 · Counting in fives and telling the time",
    id: "fives",
    label: "Counting in fives",
    blurb: "Five, ten, fifteen — and then the same numbers round a clock face.",
  },
  {
    id: "time",
    label: "Telling the time",
    blurb:
      "O'clock, half past, quarter past and to, then every five minutes — each " +
      "one read off a clock and then set on one. And both kinds of clock, the " +
      "round one and the digital, against each other.",
  },
];

/* ── counting in fives ─────────────────────────────────────────────────────*/

/* ── answers for the on-screen layer ───────────────────────────────────────*/

const HOUR_FIG = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
/* "twenty past seven" and "twenty past 7" are the same answer. */
function wordsKey(h, m) {
  const w = timeWords(h, m);
  const hh = h % 12;
  const next = (hh + 1) % 12;
  const say = m <= 30 ? hh : next;
  const named = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"][say];
  return want.words(w, w.replace(named, HOUR_FIG[say]));
}
function digitalKey(h, m) {
  const d = digital(h, m);
  return want.words(d, d.length === 4 ? `0${d}` : d);
}

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
  key(item) {
    return item.gaps.slice().sort((a, b) => a - b).map((i) => want.num(item.nums[i]));
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
  key(item) {
    return [1, 2, 3, 4, 5].map((k) => want.num(item.start + k * 5));
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
  /* written round the face with the pencil; checked by the grown-up */
  key() {
    return [want.pen("svg.mt-clock")];
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
    key(item) {
      return [wordsKey(item.h, item.m), digitalKey(item.h, item.m)];
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

/* ── setting the clock ─────────────────────────────────────────────────────
   Reading a clock and SETTING one are not the same skill, and only the second
   one proves the first. A child who has learned twelve pictures can read
   "quarter to four" off a face and still have no idea where the short hand
   goes to make one — that is exactly the child this catches.

   So every kind is asked BOTH WAYS, which is what the note at the head of this
   file has always claimed and what the paper now actually does: each reading
   exercise is followed by the same times to set. */

/**
 * Where the two hands have to end up, and how to mark them.
 *
 * Ruled from the centre: the long hand out to the outer ring of points, the
 * short hand to the inner. Past the half hour the short hand stands between
 * two numbers, so either of them is allowed — a hand drawn to a point cannot
 * say "three-quarters of the way to four".
 */
function handsKey(h, m) {
  const minute = 12 + ((m / 5) % 12 || 12);
  const hour = (h % 12) || 12;
  const hours = new Set([hour]);
  if (m >= 30) hours.add((h % 12) + 1);
  return want.draw({
    on: "svg.mt-clock",
    hands: true,
    says: `long hand to the ${(m / 5) % 12 || 12}, short hand to the ${hour}${m >= 30 ? ` or ${(h % 12) + 1}` : ""}`,
    check(lines) {
      const ends = lines.map(([a, b]) => (a === 0 ? b : b === 0 ? a : -1));
      if (ends.length !== 2 || ends.includes(-1)) return false;
      return ends.includes(minute) && ends.some((e) => e <= 12 && hours.has(e));
    },
  });
}

/** Set the clock to a time given in words: a blank face, and two hands to draw. */
function setOne(id, kind, label, blurb, heading, instruction, count = 4) {
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
        `<p class="wb-ask wb-ask--lead">${said(item.h, item.m)}</p>` +
        `<div class="mt-art">${clockSvg(item.h, item.m, { hands: false })}</div>`
      );
    },
    key(item) {
      return [handsKey(item.h, item.m)];
    },
    answer(item) {
      return [`${digital(item.h, item.m)} — long hand on the ${(item.m / 5) % 12 || 12}`];
    },
  };
}

const setOclock = setOne(
  "time-set-oclock", "oclock",
  "Set it — o'clock",
  "Long hand straight up, short hand on the hour.",
  "Make the clock say it",
  () =>
    "The long hand goes straight up to the 12 every time. All that changes is " +
    "the short hand, and it points at the hour you were given."
);
setOclock.worked = () =>
  `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
  handKey() +
  `<p class="wb-ask wb-ask--lead">${said(5, 0)}</p>` +
  `<div class="mt-art">${clockSvg(5, 0)}</div>` +
  `<p class="wb-ask rw-worked__say">Long hand straight up at the 12, short hand ` +
  `pointing at the 5.</p></div>`;

const setHalf = setOne(
  "time-set-half", "half",
  "Set it — half past",
  "Long hand straight down, and the short hand only halfway there.",
  "Make the clock say it",
  () =>
    "The long hand goes straight down to the 6. The short hand does NOT sit on " +
    "the number — half an hour has gone by, so it is halfway to the next one."
);
setHalf.worked = () =>
  `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
  `<p class="wb-ask wb-ask--lead">${said(5, 30)}</p>` +
  `<div class="mt-art">${clockSvg(5, 30)}</div>` +
  `<p class="wb-ask rw-worked__say">Long hand at the 6. The short hand has left the 5 ` +
  `and is halfway to the 6 — half past <b>five</b>, not half past six.</p></div>`;

const setQuarters = setOne(
  "time-set-quarter", "quarter",
  "Set it — quarter past and quarter to",
  "The two that look alike and mean opposite things.",
  "Make the clock say it",
  () =>
    "Quarter past puts the long hand at the 3. Quarter to puts it at the 9 — and " +
    "then the short hand is nearly AT the hour you said, not just past it."
);
setQuarters.worked = () =>
  `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
  `<div class="mt-two">` +
  `<span><p class="wb-ask wb-ask--lead">${said(5, 15)}</p>` +
  `<div class="mt-art">${clockSvg(5, 15)}</div></span>` +
  `<span><p class="wb-ask wb-ask--lead">${said(5, 45)}</p>` +
  `<div class="mt-art">${clockSvg(5, 45)}</div></span>` +
  `</div>` +
  `<p class="wb-ask rw-worked__say">Quarter past five: long hand at the 3, short hand ` +
  `just past the 5. Quarter to five: long hand at the 9, and the short hand has come ` +
  `almost all the way from the 4 — it is nearly at the 5.</p></div>`;

const setFives = setOne(
  "time-set-fives", "fives",
  "Set it — every five minutes",
  "Count round in fives to find where the long hand stops.",
  "Make the clock say it",
  () =>
    "Count round from the 12 in fives until you reach the minutes you were given: " +
    "that number is where the long hand points. For a TO time, count backwards " +
    "from the 12 instead."
);

const drawTime = {
  id: "time-draw",
  group: "time",
  label: "Draw the hands — any time",
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
  key(item) {
    return [handsKey(item.h, item.m)];
  },
  answer(item) {
    return [`${digital(item.h, item.m)} — long hand on the ${(item.m / 5) % 12 || 12}`];
  },
};

/* ── the two kinds of clock ────────────────────────────────────────────────
   A child meets both of these before they are seven — the round one on the
   wall and the figures on the cooker — and the two are usually taught as if
   they had nothing to do with each other. They are the same time twice, and
   the whole of "3:45" is knowing it is the clock with the long hand at the 9.

   Three ways round it, because each catches a different gap:
     · read the round one, write the figures      — going one way,
     · read the figures, set the round one        — going the other, and the
                                                    harder of the two,
     · put the pairs together                     — which needs neither, and
                                                    catches a child who has
                                                    learned one direction by
                                                    rote.

   The hours are 12-hour throughout, because that is what the round clock has.
   Twenty-four hour time is a separate thing and is not on this paper. */

const hoursBox = () => `<span class="rw-answer mt-digital__box"></span>`;

/** The panel with the figures missing: two boxes, and the colon between. */
const blankDigital = () =>
  digitalFace(
    `${hoursBox()}<b class="mt-digital__colon">:</b>${hoursBox()}`,
    "A digital clock with the time to be written in"
  );

const readDigital = {
  id: "time-digital-write",
  group: "time",
  label: "Write it as a digital clock",
  blurb: "The round clock says it; write the same time the way a cooker would.",
  heading: "Write what the digital clock would say",
  instruction: () =>
    "Read the round clock, then fill in the digital one. The hour goes before " +
    "the two dots and the minutes after it — and the minutes ALWAYS take two " +
    "figures, so five past is 05, not 5.",
  cols: 2,
  defaultCount: 6,
  make: makeTime("any"),
  render(item) {
    return (
      `<div class="mt-pair">` +
      `<div class="mt-art">${clockSvg(item.h, item.m)}</div>` +
      `${blankDigital()}</div>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<div class="mt-pair mt-pair--worked">` +
      `<div class="mt-art">${clockSvg(2, 5)}</div>` +
      `${digitalFace(digital(2, 5))}</div>` +
      `<p class="wb-ask rw-worked__say">The long hand is at the 1, which is five minutes ` +
      `past, and the short hand has just left the 2. Five past two is <b>${digital(2, 5)}</b> ` +
      `— the nought is there because the minutes always take two figures.</p></div>`
    );
  },
  /* Two answers, not one: the hour and the minutes are two different readings
     and a child who gets one of them right has got one of them right. */
  key(item) {
    const hh = (item.h % 12) || 12;
    const mm = String(item.m).padStart(2, "0");
    return [
      want.words(String(hh), `0${hh}`),
      want.words(mm, String(item.m)),
    ];
  },
  answer(item) {
    return [digital(item.h, item.m)];
  },
};

const setDigital = {
  id: "time-set-digital",
  group: "time",
  label: "Set the clock from the digital one",
  blurb: "The figures are given; make the round clock agree with them.",
  heading: "Set the round clock to the same time",
  instruction: () =>
    "The digital clock has the time on it. Draw the hands on the round one to " +
    "match. The minutes tell you where the LONG hand goes — count round in " +
    "fives to find it — and the hour tells you the short one.",
  cols: 2,
  defaultCount: 6,
  make: makeTime("any"),
  render(item) {
    return (
      `<div class="mt-pair">` +
      `${digitalFace(digital(item.h, item.m), `A digital clock showing ${digital(item.h, item.m)}`)}` +
      `<div class="mt-art">${clockSvg(item.h, item.m, { hands: false })}</div></div>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<div class="mt-pair mt-pair--worked">` +
      `${digitalFace(digital(9, 35))}` +
      `<div class="mt-art">${clockSvg(9, 35)}</div></div>` +
      `<p class="wb-ask rw-worked__say">Thirty-five minutes: five, ten, fifteen, twenty, ` +
      `twenty-five, thirty, thirty-five — that is seven fives, so the long hand goes to ` +
      `the 7. The short hand has gone more than halfway from the 9 to the 10. Said out ` +
      `loud it is ${timeWords(9, 35)}.</p></div>`
    );
  },
  key(item) {
    return [handsKey(item.h, item.m)];
  },
  answer(item) {
    return [`${digital(item.h, item.m)} — long hand on the ${(item.m / 5) % 12 || 12}`];
  },
};

const matchDigital = {
  id: "time-digital-match",
  group: "time",
  label: "Join the two clocks",
  blurb: "Round clocks down one side, digital down the other. Same times, mixed up.",
  heading: "Join each clock to the digital one saying the same time",
  instruction: () =>
    "Every round clock has a digital one somewhere on the right saying exactly " +
    "the same time. Draw a line between each pair.",
  cols: 1,
  groupSize: 4,
  defaultCount: 4,
  make(r, o, k) {
    /* Never two times that share an hour or share the minutes: with either
       repeated the pairing can be got by glancing at one half of the reading,
       which is the guess this exercise exists to close off. */
    const mins = r.shuffle([0, 5, 15, 20, 30, 35, 45, 50]).slice(0, k);
    const hours = r.shuffle([...Array(12).keys()]).slice(0, k);
    const times = mins.map((m, i) => ({ h: hours[i], m }));
    return { times, right: r.shuffle(times.slice()) };
  },
  render(item) {
    const left = item.times
      .map((t) => `<li><span class="wb-match__dot"></span><span>${clockSvg(t.h, t.m, { mm: 34 })}</span></li>`)
      .join("");
    const right = item.right
      .map((t) => `<li><span class="wb-match__dot"></span><span>${digitalFace(digital(t.h, t.m))}</span></li>`)
      .join("");
    return (
      `<div class="wb-match mt-match">` +
      `<ul class="wb-match__side">${left}</ul>` +
      `<ul class="wb-match__side wb-match__side--right">${right}</ul>` +
      `</div>`
    );
  },
  key(item) {
    const pairs = item.times.map((t, i) => [i, item.right.findIndex((u) => u.h === t.h && u.m === t.m)]);
    return [want.match(pairs, "each round clock to the digital one saying the same time")];
  },
  answer(item) {
    return item.times.map((t) => `${timeWords(t.h, t.m)} → ${digital(t.h, t.m)}`);
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
  key(item) {
    const pairs = item.times.map((t, i) => [i, item.right.findIndex((u) => u.h === t.h && u.m === t.m)]);
    return [want.match(pairs, "each clock to its own time")];
  },
  answer(item) {
    return item.times.map((t) => `${digital(t.h, t.m)} → ${timeWords(t.h, t.m)}`);
  },
};

/* Read it, then set it — for each kind in turn, while that kind is the thing
   being learned. Setting a clock the week after you last read one is a
   different exercise; setting one straight after is the same lesson finished.

   Then the two faces against each other, and then the joining, which needs all
   of it at once. */
export const TIME_EXERCISES = [
  countFives, countOn, fivesClock,
  oclock, setOclock,
  halfPast, setHalf,
  quarters, setQuarters,
  fiveMinutes, setFives,
  anyTime, drawTime,
  readDigital, setDigital, matchDigital,
  matchTime,
];
