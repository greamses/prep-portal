/* ============================================================================
   Maths Workbook — the DIVIDING AND REMAINDERS exercises
   ----------------------------------------------------------------------------
   One of the four families this workbook is made of; they are assembled into
   one registry in ./exercises.js. The level and help dials declared here are
   shared with the sums and the fractions, because all three are about numbers
   a child can hold rather than about place value.

   THE ORDER IS THE TEACHING, and here the order is the whole argument:

     A  group them        a pile of things and a pencil. No numbers yet.
     B  write it down     the same picture as a sentence, with every part named
     C  what is left over the remainder stops being a leftover and becomes a
                          fraction of one more group
     D  fraction bars     and once it is a fraction, it is a mixed number, and
                          a mixed number is an improper fraction

   Section C is the hinge. A child who has grouped seventeen counters into
   threes-of-five-with-two-over, and then coloured three whole bars and two
   fifths of a fourth, has been shown that 17 ÷ 5 = 3 r 2 and 17/5 = 3 2/5 are
   the same sentence written twice. That is the only idea on this paper, and
   everything before it is preparation and everything after it is practice.

   Every question is said in the same words every time, and the divisor is
   always called the divisor.
   ========================================================================== */

import { pileSvg, jitterFor, traysSvg, SHAPE_NAMES, SHAPE_WORDS } from "./shapes.js";
import { barsSvg, sentence, mixed, improper } from "./bars.js";
import { want } from "/utils/components/workbook/want.js";

const line = (size = "md") => `<span class="wb-line wb-line--${size}"></span>`;
const box = () => `<span class="rw-answer"></span>`;

/* A labelled answer slot: the word first, then the space. Every answer on this
   paper is asked for the same way round. */
const slot = (label) => `<span class="rw-slot"><em>${label}</em>${box()}</span>`;

export const REM_GROUPS = [
  { id: "group", chapter: "Chapter 3 · Dividing and remainders", label: "Group them", blurb: "A pile of things and a pencil. Ring the groups; count what is over." },
  { id: "write", label: "Write it down", blurb: "The same picture as a sentence, with every part named." },
  { id: "bridge", label: "What is left over", blurb: "The hinge: the remainder becomes a fraction of one more group." },
  { id: "bars", label: "Fraction bars", blurb: "Mixed numbers and improper fractions, coloured in." },
];

/* ── how hard ──────────────────────────────────────────────────────────────
   Small on purpose at every level. This paper is about an IDEA, and a child
   who loses the idea while working out 47 ÷ 8 has not been taught the idea. */

/* `dens` is the denominators a level uses. It is wider than `divisors` on
   purpose: eighths are an easy fraction to see and a hard number to divide by,
   so the fraction sections reach further than the dividing ones do. */
export const LEVELS = {
  gentle: {
    id: "gentle",
    label: "Gentle — up to 20 things, shared into 2s, 3s, 4s and 5s",
    max: 20, divisors: [2, 3, 4, 5], dens: [2, 3, 4, 6, 8], maxWhole: 3,
  },
  middle: {
    id: "middle",
    label: "Middle — up to 34 things, shared into 2s to 6s",
    max: 34, divisors: [2, 3, 4, 5, 6], dens: [2, 3, 4, 5, 6, 8], maxWhole: 4,
  },
  stretch: {
    id: "stretch",
    label: "Stretch — up to 48 things, shared into 3s to 9s",
    max: 48, divisors: [3, 4, 5, 6, 7, 8, 9], dens: [3, 4, 5, 6, 8, 10, 12], maxWhole: 5,
  },
};

export const levelOf = (o) => LEVELS[o.level] || LEVELS.gentle;

export const HELP = {
  show: { id: "show", label: "Show me — one done for you, and the picture already grouped" },
  help: { id: "help", label: "Help me — the picture and the sentence, both empty" },
  try: { id: "try", label: "Let me try — no words under the sentence" },
};
export const helpOf = (o) => HELP[o.help] || HELP.help;

/* ── drawing a division ────────────────────────────────────────────────────*/

/**
 * A division that leaves something over.
 *
 * A remainder of nought is a true and useful fact, and it is NOT what this
 * paper is teaching, so it is drawn out on purpose everywhere except the one
 * exercise that exists to catch it. A page of "remainder 0" would teach a
 * child that the last box is decoration.
 */
function drawDivision(r, o, { allowExact = false, max = null } = {}) {
  const L = levelOf(o);
  const top = Math.min(max || L.max, L.max);
  let d;
  let n;
  let guard = 0;
  do {
    d = r.pick(L.divisors);
    n = r.int(d + 1, top);
    guard++;
  } while (!allowExact && n % d === 0 && guard < 60);
  return { n, d, q: Math.floor(n / d), r: n % d };
}

/** The pile that goes with it — a shape, a colour and a wobble, all seeded. */
function drawPile(r, n) {
  const shape = r.pick(SHAPE_NAMES);
  return { shape, colour: r.int(0, 5), jit: jitterFor(r, n), word: SHAPE_WORDS[shape] };
}

const pile = (item) =>
  `<div class="rw-art">${pileSvg(item.n, { shape: item.shape, colour: item.colour, jit: item.jit })}</div>`;

/* ── A. group them ─────────────────────────────────────────────────────────*/

const ringGroups = {
  id: "ring-groups",
  group: "group",
  label: "Ring the groups",
  blurb: "Draw a ring round every group. Count the rings, then count what is left.",
  heading: "Ring the groups",
  instruction: () =>
    "Draw a ring round each group. When you cannot make another full group, " +
    "what is left over is the remainder.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const div = drawDivision(r, o);
    return { ...div, ...drawPile(r, div.n) };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Ring groups of <b>${item.d}</b>.</p>` +
      pile(item) +
      `<p class="wb-ask">${slot("Groups")}${slot("Left over")}</p>`
    );
  },
  /* Fourteen in groups of four, because four is the one divisor whose groups
     land inside single rows of the pile — so the three rings are three clean
     ellipses and not a ring that wraps round the end of a row. */
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<p class="wb-ask wb-ask--lead">Ring groups of <b>4</b>.</p>` +
      `<div class="rw-art">${pileSvg(14, { shape: "circle", colour: 0, rings: 4 })}</div>` +
      `<p class="wb-ask">Groups <b>3</b> &nbsp;·&nbsp; Left over <b>2</b></p>` +
      `<p class="wb-ask rw-worked__say">Three full groups of four is twelve. Two will not ` +
      `make another four, so two is the remainder.</p></div>`
    );
  },
  key(item) {
    return [want.num(item.q), want.num(item.r), want.pen(".rw-art svg")];
  },
  answer(item) {
    return [`${item.q} groups, ${item.r} left over`];
  },
};

const shareOut = {
  id: "share-out",
  group: "group",
  label: "Share them out",
  blurb: "The other kind of division: not groups OF five, but shared BETWEEN five.",
  heading: "Share them out",
  instruction: () =>
    "Give one to each tray, then another, and keep going. Draw them in. " +
    "Stop when there are not enough to go all the way round.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const div = drawDivision(r, o, { max: 26 });
    return { ...div, ...drawPile(r, div.n) };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Share <b>${item.n}</b> ${item.word} between ` +
      `<b>${item.d}</b> trays.</p>` +
      pile(item) +
      `<div class="rw-art">${traysSvg(item.d)}</div>` +
      `<p class="wb-ask">${slot("Each tray gets")}${slot("Left over")}</p>`
    );
  },
  key(item) {
    return [want.num(item.q), want.num(item.r), want.pen(".rw-art svg")];
  },
  answer(item) {
    return [`${item.q} each, ${item.r} left over`];
  },
};

/* ── B. write it down ──────────────────────────────────────────────────────*/

const pictureSentence = {
  id: "picture-sentence",
  group: "write",
  label: "Picture into a sentence",
  blurb: "Group the picture, then fill the sentence in underneath it.",
  heading: "Write the sentence under the picture",
  instruction: () =>
    "Ring the groups first. Then fill in the sentence. The words under each box say what goes in it.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const div = drawDivision(r, o);
    return { ...div, ...drawPile(r, div.n) };
  },
  render(item, o) {
    return (
      `<p class="wb-ask wb-ask--lead">Ring groups of <b>${item.d}</b>.</p>` +
      pile(item) +
      sentence(item, {
        given: { n: null, d: null, q: null, r: null },
        named: helpOf(o).id !== "try",
      })
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<p class="wb-ask wb-ask--lead">Thirteen ${SHAPE_WORDS.circle}, in groups of 5.</p>` +
      sentence({ n: 13, d: 5, q: 2, r: 3 }) +
      `</div>`
    );
  },
  key(item) {
    return [want.num(item.n), want.num(item.d), want.num(item.q), want.num(item.r), want.pen(".rw-art svg")];
  },
  answer(item) {
    return [`${item.n} ÷ ${item.d} = ${item.q} r ${item.r}`];
  },
};

const nameTheParts = {
  id: "name-the-parts",
  group: "write",
  label: "Name the parts",
  blurb: "Which number is the divisor? Which is the remainder? The words, not the working.",
  heading: "Name the parts",
  instruction: () =>
    "Every one is already worked out. Write down which number is which.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const div = drawDivision(r, o);
    return { ...div, ask: r.pick(["d", "r", "q"]) };
  },
  render(item) {
    const asked = { d: "the divisor", r: "the remainder", q: "how many groups" }[item.ask];
    return (
      `<p class="wb-ask wb-ask--lead">` +
      sentence(item, { named: false }) +
      `</p><p class="wb-ask">Which number is <b>${asked}</b>? ${box()}</p>`
    );
  },
  key(item) {
    return [want.num(item[item.ask])];
  },
  answer(item) {
    return [String(item[item.ask])];
  },
};

const divideWrite = {
  id: "divide-write",
  group: "write",
  label: "Divide with no picture",
  blurb: "The same sentence once the counters are not needed.",
  heading: "Divide, and say what is left over",
  instruction: () => "Work each one out. Write how many groups, and the remainder.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    /* One in six comes out exactly. It is the only place on this paper a
       remainder of nought is allowed, and it is here so that "0" stays a
       possible answer rather than a mistake. */
    return drawDivision(r, o, { allowExact: r.chance(0.18) });
  },
  render(item, o) {
    return sentence(item, {
      given: { q: null, r: null },
      named: helpOf(o).id === "show",
    });
  },
  key(item) {
    return [want.num(item.q), want.num(item.r)];
  },
  answer(item) {
    return [`${item.q} r ${item.r}`];
  },
};

const buildBack = {
  id: "build-back",
  group: "write",
  label: "Work backwards",
  blurb: "Four groups of six with three over — what was the number?",
  heading: "Work backwards",
  instruction: () =>
    "You are told the groups and what was left. Work out how many there were to start with.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return drawDivision(r, o);
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead"><b>${item.q}</b> groups of <b>${item.d}</b>, ` +
      `and <b>${item.r}</b> left over.</p>` +
      `<p class="wb-ask">${slot("How many to start with")}</p>`
    );
  },
  key(item) {
    return [want.num(item.n)];
  },
  answer(item) {
    return [`${item.n} &nbsp;(${item.q} × ${item.d} + ${item.r})`];
  },
};

/* ── C. what is left over ──────────────────────────────────────────────────*/

const leftoverFraction = {
  id: "leftover-fraction",
  group: "bridge",
  label: "The bit left over is a fraction",
  blurb: "The hinge of the whole paper: 2 left out of a group of 5 is two fifths.",
  heading: "The bit left over is a fraction",
  instruction: () =>
    "The groups are full bars. What is left over does not fill a bar — colour it in, " +
    "and write how much of a bar it is.",
  cols: 1,
  defaultCount: 3,
  /* Between two and four whole bars. One whole bar barely makes the point, and
     six of them is a picture of nothing. */
  make(r, o) {
    let div;
    let guard = 0;
    do {
      div = drawDivision(r, o, { max: Math.min(30, levelOf(o).max) });
      guard++;
    } while ((div.q < 2 || div.q > 4) && guard < 60);
    return div;
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead"><b>${item.n}</b> shared into groups of <b>${item.d}</b> ` +
      `makes <b>${item.q}</b> full groups with <b>${item.r}</b> left over.</p>` +
      `<div class="rw-art">${barsSvg(item.d, item.q * item.d, item.q + 1)}</div>` +
      `<p class="wb-ask">Colour in the ${item.r} left over.</p>` +
      `<p class="wb-ask">So ${item.n} ÷ ${item.d} = ` +
      `${mixed(null, null, null, { blank: true })}</p>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<p class="wb-ask wb-ask--lead"><b>17</b> shared into groups of <b>5</b> makes ` +
      `<b>3</b> full groups with <b>2</b> left over.</p>` +
      `<div class="rw-art">${barsSvg(5, 17, 4)}</div>` +
      `<p class="wb-ask">Three whole bars, and 2 out of 5 of the next one. ` +
      `So 17 ÷ 5 = ${mixed(3, 2, 5)} — and that is the same as ${improper(17, 5)}.</p></div>`
    );
  },
  key(item) {
    return [
      want.colour({ count: item.r, says: `colour ${item.r} more` }),
      want.num(item.q), want.num(item.r), want.num(item.d),
    ];
  },
  answer(item) {
    return [`${item.q} ${item.r}/${item.d}`];
  },
};

/* ── D. fraction bars ──────────────────────────────────────────────────────*/

/** A mixed number small enough to draw. */
function drawMixed(r, o) {
  const L = levelOf(o);
  const den = r.pick(L.dens);
  const whole = r.int(1, L.maxWhole);
  const num = r.int(1, den - 1);
  return { whole, num, den, top: whole * den + num };
}

const barsRead = {
  id: "bars-read",
  group: "bars",
  label: "Read the bars",
  blurb: "Bars already coloured; write it both ways.",
  heading: "Read the bars",
  instruction: () =>
    "Count the whole bars, then the coloured parts of the last one. Write it both ways.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    return drawMixed(r, o);
  },
  render(item) {
    return (
      `<div class="rw-art">${barsSvg(item.den, item.top, item.whole + 1)}</div>` +
      `<p class="wb-ask">As a mixed number ${mixed(null, null, null, { blank: true })}` +
      `<span class="rw-gap"></span>` +
      `As an improper fraction ${improper(null, null, { blank: true })}</p>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<div class="rw-art">${barsSvg(4, 9, 3)}</div>` +
      `<p class="wb-ask">Two whole bars and 1 out of 4 more: ${mixed(2, 1, 4)}.` +
      `<span class="rw-gap"></span>` +
      `Nine quarters altogether: ${improper(9, 4)}.</p></div>`
    );
  },
  key(item) {
    return [want.num(item.whole), want.num(item.num), want.num(item.den), want.num(item.top), want.num(item.den)];
  },
  answer(item) {
    return [`${item.whole} ${item.num}/${item.den} = ${item.top}/${item.den}`];
  },
};

const mixedToImproper = {
  id: "mixed-to-improper",
  group: "bars",
  label: "Mixed into improper",
  blurb: "Colour the bars in, then count every part.",
  heading: "Mixed number into improper fraction",
  instruction: () =>
    "Colour in the bars to show the number. Then count ALL the coloured parts — " +
    "that is the top of the improper fraction.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    return drawMixed(r, o);
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Colour in ${mixed(item.whole, item.num, item.den)}.</p>` +
      `<div class="rw-art">${barsSvg(item.den, 0, item.whole + 1)}</div>` +
      `<p class="wb-ask">${mixed(item.whole, item.num, item.den)} = ` +
      `${improper(null, null, { blank: true })}</p>`
    );
  },
  key(item) {
    return [want.colour({ count: item.top, says: `colour ${item.top} parts` }), want.num(item.top), want.num(item.den)];
  },
  answer(item) {
    return [`${item.top}/${item.den}`];
  },
};

const improperToMixed = {
  id: "improper-to-mixed",
  group: "bars",
  label: "Improper into mixed",
  blurb: "The same picture read the other way — and it is a division with a remainder.",
  heading: "Improper fraction into mixed number",
  instruction: () =>
    "Colour in that many parts, filling one bar before you start the next. " +
    "The full bars are the whole number.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    return drawMixed(r, o);
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Colour in ${improper(item.top, item.den)}.</p>` +
      `<div class="rw-art">${barsSvg(item.den, 0, item.whole + 1)}</div>` +
      `<p class="wb-ask">${improper(item.top, item.den)} = ` +
      `${mixed(null, null, null, { blank: true })}</p>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<p class="wb-ask wb-ask--lead">Colour in ${improper(7, 3)}.</p>` +
      `<div class="rw-art">${barsSvg(3, 7, 3)}</div>` +
      `<p class="wb-ask">Seven thirds fills two whole bars and one third more: ` +
      `${improper(7, 3)} = ${mixed(2, 1, 3)}.` +
      `<span class="rw-gap"></span>` +
      `It is 7 ÷ 3 = 2 remainder 1 — the same sum.</p></div>`
    );
  },
  key(item) {
    return [
      want.colour({ count: item.top, says: `colour ${item.top} parts` }),
      want.num(item.whole), want.num(item.num), want.num(item.den),
    ];
  },
  answer(item) {
    return [`${item.whole} ${item.num}/${item.den}`];
  },
};

const convertQuick = {
  id: "convert-quick",
  group: "bars",
  label: "Both ways, no bars",
  blurb: "Once the bars are not needed. Mixed one way, improper the other.",
  heading: "Change them over",
  instruction: () =>
    "Where you are given a mixed number, write the improper fraction. " +
    "Where you are given an improper fraction, write the mixed number.",
  cols: 2,
  defaultCount: 8,
  make(r, o) {
    return { ...drawMixed(r, o), toImproper: r.chance(0.5) };
  },
  render(item) {
    return item.toImproper
      ? `<p class="wb-ask wb-ask--lead">${mixed(item.whole, item.num, item.den)} = ` +
          `${improper(null, null, { blank: true })}</p>`
      : `<p class="wb-ask wb-ask--lead">${improper(item.top, item.den)} = ` +
          `${mixed(null, null, null, { blank: true })}</p>`;
  },
  key(item) {
    return item.toImproper
      ? [want.num(item.top), want.num(item.den)]
      : [want.num(item.whole), want.num(item.num), want.num(item.den)];
  },
  answer(item) {
    return [
      item.toImproper
        ? `${item.top}/${item.den}`
        : `${item.whole} ${item.num}/${item.den}`,
    ];
  },
};

/* ── the registry ──────────────────────────────────────────────────────────*/

export const REM_EXERCISES = [
  ringGroups, shareOut,
  pictureSentence, nameTheParts, divideWrite, buildBack,
  leftoverFraction,
  barsRead, mixedToImproper, improperToMixed, convertQuick,
];

export { line, box, slot };
