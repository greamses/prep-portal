/* ============================================================================
   Algebra Workbook — CHAPTER 2: the bar model
   ----------------------------------------------------------------------------
   Solving a linear equation by drawing it. A child who cannot start
   "3x + 4 = 19" can nearly always look at three equal boxes and a four making
   nineteen and say "take the four off, then share what is left between three"
   — and that sentence is the method. The picture is not a crutch beside the
   algebra; it IS the algebra, said in a way that can be pointed at.

     reading a model     what the bars are saying, before drawing any
     solving with bars   x + b = c · x − b = c · ax = c · ax + b = c ·
                         two bars compared
     drawing your own    make the model for an equation, and for a story

   THE ORDER INSIDE EACH QUESTION IS ALWAYS THE SAME: see the picture, say the
   equation, then do the arithmetic. The equation is picked from a list rather
   than written, because a child who has understood the picture perfectly can
   still be marked wrong for writing "19 = 3x + 4" — and this chapter is not
   about notation.

   Every step is whole numbers. An equation whose answer is 4.5 is an equation
   about fractions, and a bar cut into halves teaches that lesson instead of
   this one.
   ========================================================================== */

import { barSvg, compareSvg, blankBarSvg, equationText, MINUS } from "./barart.js";
import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const lead = (html) => `<p class="wb-ask wb-ask--lead">${html}</p>`;
const art = (html) => `<div class="ab-art">${html}</div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;
const LETTERS = ["x", "n", "y", "a", "m", "p"];

/** How big the numbers get. Whole numbers everywhere, at every level. */
const sizes = (o) => ({
  gentle: { x: [2, 9], b: [1, 9], a: [2, 3] },
  middle: { x: [3, 15], b: [2, 15], a: [2, 5] },
  stretch: { x: [4, 25], b: [3, 30], a: [3, 8] },
}[tier(o)]);

/* Three equations to choose between: the right one, and the two a child who
   has read the picture backwards would pick. */
const choices = (r, right, wrong) => {
  const opts = r.shuffle([right, ...wrong]);
  return { opts, right: opts.indexOf(right) };
};

export const BM_GROUPS = [
  { id: "bm-read", chapter: "Chapter 2 · The bar model", label: "Reading a bar model", blurb: "What the bars say, before you draw any." },
  { id: "bm-solve", label: "Solving with bars", blurb: "One box, equal boxes, boxes and a bit over, and two bars compared." },
  { id: "bm-make", label: "Drawing your own", blurb: "Make the model for an equation, and for a story." },
];

/* ═══ reading a model ══════════════════════════════════════════════════════*/

const bmRead = {
  id: "bm-read",
  group: "bm-read",
  label: "What does the bar say?",
  blurb: "A bar in two parts, one known and one not: name the equation, then find the unknown.",
  heading: "Read the bar, then solve it",
  instruction: () =>
    "The whole bar is written under it. It is cut into two parts: one you were told, and one you are " +
    "looking for. Tick the equation the picture is saying, then find the unknown by taking the part you " +
    "know off the whole.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const letter = LETTERS[i % LETTERS.length];
    const x = r.int(...s.x);
    const b = r.int(...s.b);
    const c = x + b;
    return { letter, x, b, c, ...choices(r,
      equationText(1, b, c, { letter }),
      [equationText(1, c, b, { letter }), equationText(1, b, c, { letter, op: "-" })]) };
  },
  render(item) {
    return (
      art(barSvg([{ text: item.letter, value: null }, { text: String(item.b), value: item.b }], { whole: item.c })) +
      ask(`The equation is ${tick(...item.opts)}`) +
      ask(`${item.letter} = ${box()}`)
    );
  },
  worked() {
    return worked(
      art(barSvg([{ text: "x", value: null }, { text: "5", value: 5 }], { whole: 12 })) +
      ask("The equation is <b>x + 5 = 12</b>") +
      ask("x = <b>7</b>") +
      say("The whole strip is 12. Five of it is the part we were told, so the box must be what is left: 12 − 5 = 7.")
    );
  },
  key(item) {
    return [want.tick(item.right), want.num(item.x)];
  },
  answer(item) {
    return [`${item.letter} = ${item.x}`];
  },
};

const bmTake = {
  id: "bm-take",
  group: "bm-read",
  label: "The bar that is taken from",
  blurb: "x − b = c drawn: the whole is the unknown, and it is the parts that are known.",
  heading: "The unknown is the whole bar",
  instruction: () =>
    `Here it is the WHOLE bar that is unknown and the parts that are known. Taking ${MINUS}b off x leaves ` +
    "c, so x is made of that b and that c — put them back together.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const letter = LETTERS[(i + 1) % LETTERS.length];
    const b = r.int(...s.b);
    const c = r.int(...s.x);
    return { letter, b, c, x: b + c, ...choices(r,
      equationText(1, b, c, { letter, op: "-" }),
      [equationText(1, b, c, { letter }), equationText(1, c, b, { letter, op: "-" })]) };
  },
  render(item) {
    return (
      art(barSvg(
        [{ text: String(item.b), value: item.b }, { text: String(item.c), value: item.c }],
        { whole: item.letter },
      )) +
      ask(`The equation is ${tick(...item.opts)}`) +
      ask(`${item.letter} = ${box()}`)
    );
  },
  key(item) {
    return [want.tick(item.right), want.num(item.x)];
  },
  answer(item) {
    return [`${item.letter} = ${item.b} + ${item.c} = ${item.x}`];
  },
};

/* ═══ solving with bars ════════════════════════════════════════════════════*/

const bmEqual = {
  id: "bm-equal",
  group: "bm-solve",
  label: "Equal boxes",
  blurb: "ax = c: the whole shared between a equal boxes.",
  heading: "Equal boxes make the whole",
  instruction: () =>
    "Every box is the same size and holds the same unknown. The whole bar is written under it, so one box " +
    "is the whole shared between however many boxes there are.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const letter = LETTERS[i % LETTERS.length];
    const a = r.int(...s.a);
    const x = r.int(...s.x);
    return { letter, a, x, c: a * x };
  },
  render(item) {
    return (
      art(barSvg(Array.from({ length: item.a }, () => ({ text: item.letter, value: null })), { whole: item.c })) +
      ask(`${equationText(item.a, 0, item.c, { letter: item.letter })}`) +
      ask(`One box: ${item.letter} = ${box()}`)
    );
  },
  worked() {
    return worked(
      art(barSvg([{ text: "x", value: null }, { text: "x", value: null }, { text: "x", value: null }], { whole: 18 })) +
      ask("3x = 18") +
      ask("One box: x = <b>6</b>") +
      say("Three equal boxes make 18, so one box is 18 shared between 3, which is 6.")
    );
  },
  key(item) {
    return [want.num(item.x)];
  },
  answer(item) {
    return [`${item.letter} = ${item.c} ÷ ${item.a} = ${item.x}`];
  },
};

const bmTwoStep = {
  id: "bm-two-step",
  group: "bm-solve",
  label: "Boxes and a bit over",
  blurb: "ax + b = c: take the bit off first, then share what is left.",
  heading: "Take the extra off, then share",
  instruction: () =>
    "The bar is equal boxes AND a number. Take that number off the whole first — what is left is just the " +
    "boxes — then share it between them. Two steps, and the picture says which comes first.",
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    const s = sizes(o);
    const letter = LETTERS[i % LETTERS.length];
    const a = r.int(...s.a);
    const x = r.int(...s.x);
    const b = r.int(...s.b);
    return { letter, a, x, b, c: a * x + b };
  },
  render(item) {
    const parts = Array.from({ length: item.a }, () => ({ text: item.letter, value: null }));
    parts.push({ text: String(item.b), value: item.b });
    return (
      lead(equationText(item.a, item.b, item.c, { letter: item.letter })) +
      art(barSvg(parts, { whole: item.c })) +
      ask(`Take the ${item.b} off: the boxes come to ${box()}`) +
      ask(`Share it between the ${item.a} boxes: ${item.letter} = ${box()}`)
    );
  },
  worked() {
    return worked(
      lead("3x + 4 = 19") +
      art(barSvg([
        { text: "x", value: null }, { text: "x", value: null }, { text: "x", value: null }, { text: "4", value: 4 },
      ], { whole: 19 })) +
      ask("Take the 4 off: the boxes come to <b>15</b>") +
      ask("Share it between the 3 boxes: x = <b>5</b>") +
      say("The 4 is not part of the boxes, so it comes off the whole first: 19 − 4 = 15. Three equal boxes make 15, so one is 5.")
    );
  },
  key(item) {
    return [want.num(item.a * item.x), want.num(item.x)];
  },
  answer(item) {
    return [`boxes ${item.a * item.x}, ${item.letter} = ${item.x}`];
  },
};

const NAMES = [["Ada", "Ben"], ["Chidi", "Dayo"], ["Ese", "Femi"], ["Gina", "Hadi"]];

const bmCompare = {
  id: "bm-compare",
  group: "bm-solve",
  label: "Two bars compared",
  blurb: "One has some more than the other, and together they make a total.",
  heading: "Two bars, one total",
  instruction: () =>
    "The shorter bar is the unknown. The longer one is the same box AND the extra. Together they make the " +
    "total written down the side. Take the extra off the total, and what is left is two equal boxes.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const x = r.int(...s.x);
    const d = r.int(...s.b);
    const [one, two] = NAMES[i % NAMES.length];
    return { x, d, total: 2 * x + d, one, two, thing: r.pick(["marbles", "naira", "stickers", "books"]) };
  },
  render(item) {
    return (
      lead(`${item.two} has <b>${item.d}</b> more ${item.thing} than ${item.one}. Together they have <b>${item.total}</b>.`) +
      art(compareSvg(
        [{ text: "?", value: null }],
        [{ text: "?", value: null }, { text: String(item.d), value: item.d }],
        { whole: item.total, topName: item.one, bottomName: item.two },
      )) +
      ask(`Take the ${item.d} off the total: ${box()}`) +
      ask(`That is two equal boxes, so ${item.one} has ${box()}`) +
      ask(`And ${item.two} has ${box()}`)
    );
  },
  worked() {
    return worked(
      lead("Ben has <b>4</b> more marbles than Ada. Together they have <b>20</b>.") +
      art(compareSvg(
        [{ text: "?", value: null }],
        [{ text: "?", value: null }, { text: "4", value: 4 }],
        { whole: 20, topName: "Ada", bottomName: "Ben" },
      )) +
      ask("Take the 4 off the total: <b>16</b>") +
      ask("That is two equal boxes, so Ada has <b>8</b>") +
      ask("And Ben has <b>12</b>") +
      say("The 4 is what Ben has extra, so it is not part of the equal boxes. 20 − 4 = 16 is two boxes, so one box is 8 — and Ben has 8 + 4 = 12.")
    );
  },
  key(item) {
    return [want.num(item.total - item.d), want.num(item.x), want.num(item.x + item.d)];
  },
  answer(item) {
    return [`${item.one} ${item.x}, ${item.two} ${item.x + item.d}`];
  },
};

/* ═══ drawing your own ═════════════════════════════════════════════════════*/

const bmDraw = {
  id: "bm-draw",
  group: "bm-make",
  label: "Draw the bar for the equation",
  blurb: "The picture made by the child: boxes for the unknown, a box for the number, the whole underneath.",
  heading: "Draw the bar model, then solve",
  instruction: () =>
    "Draw the bar: one box for every lot of the letter, all the same size, then a box for the number that " +
    "is added on, and write the whole underneath. Then solve it the way the picture tells you to.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const letter = LETTERS[i % LETTERS.length];
    const a = r.chance(0.5) ? 1 : r.int(...s.a);
    const x = r.int(...s.x);
    const b = r.int(...s.b);
    return { letter, a, x, b, c: a * x + b };
  },
  render(item) {
    return (
      lead(equationText(item.a, item.b, item.c, { letter: item.letter })) +
      art(blankBarSvg()) +
      ask(`${item.letter} = ${box()}`)
    );
  },
  key(item) {
    return [want.pen(".ab-art svg"), want.num(item.x)];
  },
  answer(item) {
    return [`${item.letter} = ${item.x}`];
  },
};

const STORIES = [
  (a, b, c, thing) => `A box holds the same number of ${thing} in each of <b>${a}</b> rows, and <b>${b}</b> more ${thing} are loose. There are <b>${c}</b> altogether.`,
  (a, b, c, thing) => `<b>${a}</b> children each save the same amount. With <b>${b}</b> naira already in the tin there is <b>${c}</b> naira.`,
  (a, b, c, thing) => `<b>${a}</b> shelves hold the same number of ${thing}. With <b>${b}</b> more on the table there are <b>${c}</b>.`,
];

const bmWord = {
  id: "bm-word",
  group: "bm-make",
  label: "A story, drawn",
  blurb: "Find the equal parts and the bit over, draw them, and answer the question.",
  heading: "Draw the story, then answer it",
  instruction: () =>
    "Find what is repeated — those are the equal boxes — and what is extra. Draw the bar, write the whole " +
    "underneath, and work out what one box holds.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const a = r.int(Math.max(2, s.a[0]), s.a[1]);
    const x = r.int(...s.x);
    const b = r.int(...s.b);
    return { a, x, b, c: a * x + b, s: i % STORIES.length, thing: r.pick(["pencils", "mangoes", "cards", "beads"]) };
  },
  render(item) {
    return (
      ask(STORIES[item.s](item.a, item.b, item.c, item.thing)) +
      art(blankBarSvg({ h: 38 })) +
      ask(`One box holds ${box()}`)
    );
  },
  key(item) {
    return [want.pen(".ab-art svg"), want.num(item.x)];
  },
  answer(item) {
    return [`one box = ${item.x}`];
  },
};

export const BM_EXERCISES = [bmRead, bmTake, bmEqual, bmTwoStep, bmCompare, bmDraw, bmWord];
