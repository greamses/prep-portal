/* ============================================================================
   Algebra Workbook — CHAPTER 3: the balance scale
   ----------------------------------------------------------------------------
   The bar model shows what an equation SAYS. The balance shows what you are
   allowed to DO to it: a level scale stays level only if the same thing happens
   to both pans. Every rule of rearranging a linear equation is that one
   sentence, and this chapter is where a child learns it with weights before
   they meet it with symbols.

     reading a balance     what a level scale says, and which moves keep it
                           level (the moves are the lesson, so they get a
                           section of their own before any solving)
     solving on it         take the same off both pans · share both pans ·
                           take off, then share · bags on BOTH pans
     putting it on         draw the scale for an equation, and for a story

   THE BALANCE EARNS ITS PLACE WITH THE LAST SOLVING SECTION. "3x + 2 = x + 10"
   has the unknown on both sides, which a bar model cannot draw honestly and a
   scale draws without trying: take a bag off both pans. That is why this
   chapter comes after the bar model and not instead of it.

   THE NUMBERS MOVE FROM COUNTED TO WRITTEN. At Gentle every 1 on a pan is its
   own cube, so taking 3 off both pans is something a child can do with a
   pencil, crossing out; at Middle and Stretch a pan carries one labelled
   weight, because by then the counting is not the point.

   Nothing here takes away below zero: there is no subtraction ON the scale,
   only taken OFF it. "x − 4 = 9" is a balance with a balloon on it, and a
   balloon is a harder idea than the one this chapter is teaching — it is the
   bar model's job (ex-bars.js, "the bar that is taken from").

   Every answer is a whole number, for the reason the bar model gives.
   ========================================================================== */

import { balanceSvg, blankBalanceSvg, balanceText } from "./balanceart.js";
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
const cubesAt = (o) => tier(o) === "gentle";
const LETTERS = ["x", "n", "y", "a", "m", "p"];

/** How big the numbers get. Gentle stays small enough that every 1 can be a cube. */
const sizes = (o) => ({
  gentle: { x: [1, 6], b: [1, 6], a: [2, 3] },
  middle: { x: [2, 12], b: [2, 15], a: [2, 5] },
  stretch: { x: [3, 20], b: [3, 30], a: [3, 8] },
}[tier(o)]);

const scale = (left, right, o, letter) =>
  art(balanceSvg(left, right, { letter, cubes: cubesAt(o), label: `A level balance: ${balanceText(left, right, letter)}` }));

const choices = (r, right, wrong) => {
  const opts = r.shuffle([right, ...wrong]);
  return { opts, right: opts.indexOf(right) };
};

export const BS_GROUPS = [
  { id: "bs-read", chapter: "Chapter 3 · The balance scale", label: "Reading a balance", blurb: "What a level scale says, and which moves keep it level." },
  { id: "bs-solve", label: "Solving on the balance", blurb: "The same off both pans, both pans shared, and bags on both sides." },
  { id: "bs-make", label: "Putting it on the scale", blurb: "Draw the balance for an equation, and for a story." },
];

/* ═══ reading a balance ════════════════════════════════════════════════════*/

const bsRead = {
  id: "bs-read",
  group: "bs-read",
  label: "What does the balance say?",
  blurb: "A bag and some weights against weights: name the equation, then find what the bag weighs.",
  heading: "Read the balance, then solve it",
  instruction: () =>
    "The scale is level, so the two pans weigh the same. The bag holds the unknown. Tick the equation the " +
    "scale is saying, then work out what the bag must weigh.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const letter = LETTERS[i % LETTERS.length];
    const x = r.int(...s.x);
    const b = r.int(...s.b);
    const c = x + b;
    return { letter, x, b, c, ...choices(r,
      `${letter} + ${b} = ${c}`,
      [`${letter} = ${b} + ${c}`, `${letter} + ${c} = ${b}`]) };
  },
  render(item, o) {
    return (
      scale({ bags: 1, n: item.b }, { bags: 0, n: item.c }, o, item.letter) +
      ask(`The equation is ${tick(...item.opts)}`) +
      ask(`${item.letter} = ${box()}`)
    );
  },
  worked() {
    return worked(
      art(balanceSvg({ bags: 1, n: 3 }, { bags: 0, n: 8 }, { cubes: true })) +
      ask("The equation is <b>x + 3 = 8</b>") +
      ask("x = <b>5</b>") +
      say("The left pan is a bag and 3; the right pan is 8; the scale is level, so they weigh the same. Take the 3 off both pans and the bag is left weighing 5.")
    );
  },
  key(item) {
    return [want.tick(item.right), want.num(item.x)];
  },
  answer(item) {
    return [`${item.letter} + ${item.b} = ${item.c}, ${item.letter} = ${item.x}`];
  },
};

/* The moves a child might make, and whether the scale survives them. Each is
   built from the scale in front of them, so "take 5 off" is never offered on a
   pan that only has 3. */
function movesFor(r, left, right) {
  const small = Math.max(1, Math.min(left.n, right.n));
  const k = r.int(1, small);
  const level = [
    { text: `Take ${k} off both pans`, ok: true },
    { text: `Put ${r.int(1, 5)} more on both pans`, ok: true },
    { text: "Double what is on both pans", ok: true },
  ];
  const tips = [
    { text: `Take ${k} off the left pan only`, ok: false },
    { text: `Put ${r.int(1, 5)} more on the right pan only`, ok: false },
    { text: "Take a bag off the left pan and nothing off the right", ok: false },
  ];
  const first = r.pick(level);
  const second = r.pick(tips);
  const rest = r.pick([...level, ...tips].filter((m) => m !== first && m !== second));
  return r.shuffle([first, second, rest]);
}

const bsLevel = {
  id: "bs-level",
  group: "bs-read",
  label: "Does it stay level?",
  blurb: "Three moves: which keep the scale level, and which tip it.",
  heading: "Does the scale stay level?",
  instruction: () =>
    "Here is a level scale. For each move, tick whether the scale would stay level or tip. The rule to find: " +
    "a move keeps it level only if it happens to BOTH pans.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const s = sizes(o);
    const letter = LETTERS[i % LETTERS.length];
    const a = r.chance(0.5) ? 1 : r.int(...s.a);
    const x = r.int(...s.x);
    const b = r.int(...s.b);
    const left = { bags: a, n: b };
    const right = { bags: 0, n: a * x + b };
    return { letter, a, b, x, left, right, moves: movesFor(r, left, right) };
  },
  render(item, o) {
    return (
      scale(item.left, item.right, o, item.letter) +
      item.moves.map((m) => `<div class="ab-move">${ask(m.text)}${tick("Stays level", "Tips")}</div>`).join("")
    );
  },
  worked() {
    return worked(
      art(balanceSvg({ bags: 2, n: 1 }, { bags: 0, n: 7 }, { cubes: true })) +
      `<div class="ab-move">${ask("Take 1 off both pans")}<b>Stays level</b></div>` +
      `<div class="ab-move">${ask("Take 1 off the left pan only")}<b>Tips</b></div>` +
      say("Both pans weighed the same. Take 1 from each and they still weigh the same. Take 1 from the left only and the left is lighter, so the right side goes down.")
    );
  },
  key(item) {
    return item.moves.map((m) => want.tick(m.ok ? 0 : 1));
  },
  answer(item) {
    return [item.moves.map((m) => (m.ok ? "level" : "tips")).join(", ")];
  },
};

/* ═══ solving on the balance ═══════════════════════════════════════════════*/

const bsTake = {
  id: "bs-take",
  group: "bs-solve",
  label: "The same off both pans",
  blurb: "x + b = c: take the weights off both pans until the bag is on its own.",
  heading: "Take the same off both pans",
  instruction: () =>
    "Get the bag on its own. Whatever you take off the left pan, take off the right pan too, and the scale " +
    "stays level — then whatever is left on the right is what the bag weighs.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const letter = LETTERS[(i + 2) % LETTERS.length];
    const x = r.int(...s.x);
    const b = r.int(...s.b);
    return { letter, x, b, c: x + b };
  },
  render(item, o) {
    const left = { bags: 1, n: item.b };
    const right = { bags: 0, n: item.c };
    return (
      lead(balanceText(left, right, item.letter)) +
      scale(left, right, o, item.letter) +
      ask(`Take ${box()} off both pans.`) +
      ask(`Now the bag is on its own: ${item.letter} = ${box()}`)
    );
  },
  key(item) {
    return [want.num(item.b), want.num(item.x)];
  },
  answer(item) {
    return [`take ${item.b} off both, ${item.letter} = ${item.x}`];
  },
};

const bsShare = {
  id: "bs-share",
  group: "bs-solve",
  label: "Share both pans",
  blurb: "ax = c: equal bags on one pan, so share the other pan the same way.",
  heading: "Share both pans into equal groups",
  instruction: () =>
    "Every bag weighs the same. Split the left pan into single bags, and split the right pan into the same " +
    "number of equal groups — one group balances one bag.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const letter = LETTERS[i % LETTERS.length];
    const a = r.int(...s.a);
    const x = r.int(...s.x);
    return { letter, a, x, c: a * x };
  },
  render(item, o) {
    const left = { bags: item.a, n: 0 };
    const right = { bags: 0, n: item.c };
    return (
      lead(balanceText(left, right, item.letter)) +
      scale(left, right, o, item.letter) +
      ask(`Share both pans into ${item.a} equal groups: one bag, ${item.letter} = ${box()}`)
    );
  },
  key(item) {
    return [want.num(item.x)];
  },
  answer(item) {
    return [`${item.letter} = ${item.c} ÷ ${item.a} = ${item.x}`];
  },
};

const bsTwoStep = {
  id: "bs-two-step",
  group: "bs-solve",
  label: "Take off, then share",
  blurb: "ax + b = c: weights off both pans first, then share what is left.",
  heading: "Take off both pans, then share",
  instruction: () =>
    "Two moves, in this order. First take the loose weights off both pans, so only bags are left on the " +
    "left. Then share both pans into as many groups as there are bags.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const letter = LETTERS[i % LETTERS.length];
    const a = r.int(...s.a);
    const x = r.int(...s.x);
    const b = r.int(...s.b);
    return { letter, a, x, b, c: a * x + b };
  },
  render(item, o) {
    const left = { bags: item.a, n: item.b };
    const right = { bags: 0, n: item.c };
    return (
      lead(balanceText(left, right, item.letter)) +
      scale(left, right, o, item.letter) +
      ask(`Take ${item.b} off both pans: the ${item.a} bags balance ${box()}`) +
      ask(`Share both pans into ${item.a} groups: ${item.letter} = ${box()}`)
    );
  },
  worked() {
    return worked(
      lead("3x + 2 = 14") +
      art(balanceSvg({ bags: 3, n: 2 }, { bags: 0, n: 14 }, { cubes: true })) +
      ask("Take 2 off both pans: the 3 bags balance <b>12</b>") +
      ask("Share both pans into 3 groups: x = <b>4</b>") +
      say("Taking 2 off both pans keeps the scale level and leaves only bags on the left: 14 − 2 = 12. Three equal bags balance 12, so one bag balances 4.")
    );
  },
  key(item) {
    return [want.num(item.a * item.x), want.num(item.x)];
  },
  answer(item) {
    return [`bags balance ${item.a * item.x}, ${item.letter} = ${item.x}`];
  },
};

const bsBoth = {
  id: "bs-both",
  group: "bs-solve",
  label: "Bags on both pans",
  blurb: "ax + b = cx + d: take bags off both pans, then weights, then share.",
  heading: "Bags on both sides",
  instruction: () =>
    "There are bags on both pans now. Take the same number of bags off both pans until only one pan has " +
    "bags — the scale stays level, because every bag weighs the same. Then carry on the way you know.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const letter = LETTERS[i % LETTERS.length];
    const a = r.int(Math.max(2, s.a[0]), s.a[1]);
    const c = tier(o) === "gentle" ? 1 : r.int(1, a - 1);
    const x = r.int(...s.x);
    const b = r.int(...s.b);
    return { letter, a, c, x, b, d: (a - c) * x + b };
  },
  render(item, o) {
    const left = { bags: item.a, n: item.b };
    const right = { bags: item.c, n: item.d };
    return (
      lead(balanceText(left, right, item.letter)) +
      scale(left, right, o, item.letter) +
      ask(`Take ${item.c === 1 ? "a bag" : `${item.c} bags`} off both pans: the left pan has ${box()} bags`) +
      ask(`Take ${item.b} off both pans: those bags balance ${box()}`) +
      ask(`Share: ${item.letter} = ${box()}`)
    );
  },
  worked() {
    return worked(
      lead("3x + 2 = x + 10") +
      art(balanceSvg({ bags: 3, n: 2 }, { bags: 1, n: 10 }, { cubes: true })) +
      ask("Take a bag off both pans: the left pan has <b>2</b> bags") +
      ask("Take 2 off both pans: those bags balance <b>8</b>") +
      ask("Share: x = <b>4</b>") +
      say("A bag on each pan weighs the same, so taking one off each keeps it level: 2x + 2 = 10. Then 2 off both pans: 2x = 8. Two bags balance 8, so one bag is 4.")
    );
  },
  key(item) {
    return [want.num(item.a - item.c), want.num(item.d - item.b), want.num(item.x)];
  },
  answer(item) {
    return [`${item.a - item.c} bags, ${item.d - item.b}, ${item.letter} = ${item.x}`];
  },
};

/* ═══ putting it on the scale ══════════════════════════════════════════════*/

const bsDraw = {
  id: "bs-draw",
  group: "bs-make",
  label: "Draw the balance for the equation",
  blurb: "Bags for the letter, weights for the numbers, each side on its own pan.",
  heading: "Put the equation on the scale",
  instruction: () =>
    "Draw each side of the equation on its own pan: a bag for every lot of the letter, all the same, and the " +
    "numbers as weights. Then solve it by doing the same to both pans.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const letter = LETTERS[i % LETTERS.length];
    const a = r.int(...s.a);
    const x = r.int(...s.x);
    const b = r.int(...s.b);
    /* from Middle on, some of them have bags on both sides */
    const c = tier(o) !== "gentle" && r.chance(0.5) ? r.int(1, a - 1) : 0;
    return { letter, a, c, x, b, d: (a - c) * x + b };
  },
  render(item) {
    return (
      lead(balanceText({ bags: item.a, n: item.b }, { bags: item.c, n: item.d }, item.letter)) +
      art(blankBalanceSvg()) +
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

const SACKS = [
  { thing: "bags of rice", one: "bag of rice" },
  { thing: "boxes of nails", one: "box of nails" },
  { thing: "parcels", one: "parcel" },
  { thing: "tins of paint", one: "tin of paint" },
];

const bsWord = {
  id: "bs-word",
  group: "bs-make",
  label: "A story on the scales",
  blurb: "Things of the same weight and some kilograms, balanced: find one thing.",
  heading: "Put the story on the scales",
  instruction: () =>
    "Draw what is on each pan: the things that all weigh the same as bags, and the kilograms as weights. " +
    "Then do the same to both pans until one thing is on its own.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const s = sizes(o);
    const a = r.int(Math.max(2, s.a[0]), s.a[1]);
    const c = r.int(1, a - 1);
    const x = r.int(...s.x);
    const b = r.int(...s.b);
    return { a, c, x, b, d: (a - c) * x + b, sack: SACKS[i % SACKS.length] };
  },
  render(item) {
    const n = (count) => (count === 1 ? `1 ${item.sack.one}` : `${count} ${item.sack.thing}`);
    return (
      ask(`On one pan: <b>${n(item.a)}</b> and a <b>${item.b} kg</b> weight. On the other: <b>${n(item.c)}</b> and a ` +
        `<b>${item.d} kg</b> weight. The scale is level. Every ${item.sack.one} weighs the same.`) +
      art(blankBalanceSvg()) +
      ask(`One ${item.sack.one} weighs ${box()} kg`)
    );
  },
  key(item) {
    return [want.pen(".ab-art svg"), want.num(item.x)];
  },
  answer(item) {
    return [`${item.x} kg`];
  },
};

export const BS_EXERCISES = [bsRead, bsLevel, bsTake, bsShare, bsTwoStep, bsBoth, bsDraw, bsWord];
