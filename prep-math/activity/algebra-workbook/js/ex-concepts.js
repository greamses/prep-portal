/* ============================================================================
   Algebra Workbook — CHAPTER 1: basic concepts
   ----------------------------------------------------------------------------
   The words algebra is spoken in, taught before any of it is done — because a
   child who has never been told what "unknown" or "constant" means reads every
   later instruction as noise:

     known and unknown        a story first: which amounts do we have, and which
                              are we looking for? Then a letter for the unknown,
                              and the box-then-letter bridge: □ + 7 = 15 is
                              x + 7 = 15
     variables and constants  things in the world that change and things that do
                              not; then the parts of an expression — the variable,
                              its coefficient, the constant; then watching a
                              variable VARY in a table while the constant stays
     the words                join each word to what it means

   Each idea is met in words before it is met in symbols, the same concrete-first
   order as the rest of the site's workbooks. The numbers are small at every
   level: these are ideas, and an idea lost in a big sum was not taught.
   ========================================================================== */

import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const slot = (label, unit = "") => `<span class="wb-slot"><em>${label}</em>${box()}${unit}</span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const lead = (html) => `<p class="wb-ask wb-ask--lead">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const MINUS = "−";

const tier = (o) => levelOf(o).id;
/** Letters a child will not confuse with a figure: no o, l, s, z, i. */
const LETTERS = ["x", "y", "n", "a", "b", "m", "p", "t", "k"];

/* ── the groups ────────────────────────────────────────────────────────────*/

export const BC_GROUPS = [
  { id: "bc-known", chapter: "Chapter 1 · Basic concepts", label: "Known and unknown", blurb: "What we have been told, and what we are looking for." },
  { id: "bc-vary", label: "Variables and constants", blurb: "What changes, what stays the same, and the parts of an expression." },
  { id: "bc-words", label: "The words", blurb: "Join each word to what it means." },
];

/* ═══ known and unknown ════════════════════════════════════════════════════*/

/*
 * Each story names three amounts. `known` says which ones the story TELLS us —
 * the rest it asks about or leaves out. The numbers are filled in per question;
 * an amount that is unknown is never given a number anywhere in the story.
 */
const STORIES = [
  {
    text: (u, v) => `Tunde has <b>${u}</b> marbles. He gives some to his sister. Now he has <b>${v}</b>.`,
    things: ["how many marbles Tunde started with", "how many he gave to his sister", "how many he has now"],
    known: [true, false, true],
    eq: (u, v) => ({ right: `${u} − n = ${v}`, wrong: [`n − ${u} = ${v}`, `${u} + n = ${v}`] }),
    nums: (r) => { const u = r.int(9, 20); return [u, r.int(2, u - 2)]; },
  },
  {
    text: (u, v) => `A bag holds some oranges. Ada puts in <b>${u}</b> more, and now there are <b>${v}</b>.`,
    things: ["how many oranges were in the bag at first", "how many Ada put in", "how many there are now"],
    known: [false, true, true],
    eq: (u, v) => ({ right: `n + ${u} = ${v}`, wrong: [`n − ${u} = ${v}`, `${u}n = ${v}`] }),
    nums: (r) => { const u = r.int(3, 9); return [u, u + r.int(4, 12)]; },
  },
  {
    text: (u, v) => `Some pupils sit in <b>${u}</b> equal rows. There are <b>${v}</b> pupils altogether.`,
    things: ["the number of rows", "how many pupils are in each row", "how many pupils there are altogether"],
    known: [true, false, true],
    eq: (u, v) => ({ right: `${u} × n = ${v}`, wrong: [`${u} + n = ${v}`, `n − ${u} = ${v}`] }),
    nums: (r) => { const u = r.int(2, 6); return [u, u * r.int(3, 9)]; },
  },
  {
    text: (u, v) => `Chidi buys a book and a pen. The pen costs <b>${u}</b> naira and he pays <b>${v}</b> naira for both.`,
    things: ["the price of the pen", "the price of the book", "what he pays for both"],
    known: [true, false, true],
    eq: (u, v) => ({ right: `n + ${u} = ${v}`, wrong: [`${u}n = ${v}`, `n = ${u} + ${v}`] }),
    nums: (r) => { const u = r.int(2, 9) * 50; return [u, u + r.int(3, 12) * 100]; },
  },
  {
    text: (u, v) => `A ribbon is cut into <b>${u}</b> equal pieces. Each piece is <b>${v}</b> cm long.`,
    things: ["how many pieces there are", "how long each piece is", "how long the ribbon was"],
    known: [true, true, false],
    eq: (u, v) => ({ right: `n ÷ ${u} = ${v}`, wrong: [`n × ${v} = ${u}`, `n + ${u} = ${v}`] }),
    nums: (r) => [r.int(2, 6), r.int(4, 15)],
  },
];

function dealStory(r, i) {
  const s = i % STORIES.length;
  const [u, v] = STORIES[s].nums(r);
  return { s, u, v };
}

const bcKnownTick = {
  id: "bc-known-tick",
  group: "bc-known",
  label: "Known or unknown?",
  blurb: "A short story, and three amounts in it: tick whether each one is known or unknown.",
  heading: "Known or unknown?",
  instruction: () =>
    "An amount is KNOWN if the story tells you what it is. It is UNKNOWN if the story does not say — it is " +
    "the thing you would have to work out. Read the story, then tick each amount.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    return dealStory(r, i + r.int(0, 4));
  },
  render(item) {
    const st = STORIES[item.s];
    return (
      lead(st.text(item.u, item.v)) +
      st.things.map((t) => ask(`${t}: ${tick("known", "unknown")}`)).join("")
    );
  },
  worked() {
    const st = STORIES[0];
    return worked(
      lead(st.text(15, 9)) +
      ask(`how many marbles Tunde started with: <b>known</b> — the story says 15`) +
      ask(`how many he gave to his sister: <b>unknown</b> — it only says "some"`) +
      ask(`how many he has now: <b>known</b> — the story says 9`) +
      say("If you can point to the number in the story, it is known. If the story only says some, a few or how many, it is unknown.")
    );
  },
  key(item) {
    return STORIES[item.s].known.map((k) => want.tick(k ? 0 : 1));
  },
  answer(item) {
    const st = STORIES[item.s];
    return st.things.map((t, j) => `${t}: ${st.known[j] ? "known" : "unknown"}`);
  },
};

const bcLetter = {
  id: "bc-letter",
  group: "bc-known",
  label: "A letter for the unknown",
  blurb: "Write the story with a letter standing for the amount nobody has told you.",
  heading: "Which one says the story?",
  instruction: () =>
    "In algebra we use a LETTER for the unknown amount. Here the letter is n. Tick the one that says the " +
    "same thing as the story.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const d = dealStory(r, i + 2);
    const e = STORIES[d.s].eq(d.u, d.v);
    const opts = r.shuffle([e.right, ...e.wrong]);
    return { ...d, opts, right: opts.indexOf(e.right) };
  },
  render(item) {
    return lead(STORIES[item.s].text(item.u, item.v)) + ask(tick(...item.opts));
  },
  key(item) {
    return [want.tick(item.right)];
  },
  answer(item) {
    return [item.opts[item.right]];
  },
};

const bcBox = {
  id: "bc-box",
  group: "bc-known",
  label: "The box and the letter",
  blurb: "□ + 7 = 15 and x + 7 = 15 ask the same question — a letter is just a box with a name.",
  heading: "Find the unknown",
  instruction: () =>
    "The box and the letter both stand for the SAME unknown number. Find the number that goes in the box, " +
    "then say what the letter is.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const t = tier(o);
    const x = t === "gentle" ? r.int(1, 10) : t === "middle" ? r.int(2, 20) : r.int(5, 40);
    const n = t === "gentle" ? r.int(1, 10) : t === "middle" ? r.int(2, 12) : r.int(3, 25);
    const ops = t === "gentle" ? ["+"] : t === "middle" ? ["+", "−"] : ["+", "−", "×"];
    const op = ops[i % ops.length];
    const letter = LETTERS[i % LETTERS.length];
    const total = op === "+" ? x + n : op === "−" ? x + n : x * n;
    /* x − n = total would go below zero too easily; say it as total − n = x instead */
    return { x, n, op, letter, total };
  },
  render(item) {
    const lhs = (u) => item.op === "+" ? `${u} + ${item.n}` : item.op === "−" ? `${item.total} ${MINUS} ${u}` : `${item.n} × ${u}`;
    const rhs = item.op === "−" ? item.n : item.total;
    return (
      ask(`${lhs('<span class="bc-box">□</span>')} = ${rhs} &nbsp; the box is ${box()}`) +
      ask(`${lhs(`<i>${item.letter}</i>`)} = ${rhs} &nbsp; <i>${item.letter}</i> = ${box()}`)
    );
  },
  worked() {
    return worked(
      ask(`<span class="bc-box">□</span> + 7 = 15 &nbsp; the box is <b>8</b>`) +
      ask(`<i>x</i> + 7 = 15 &nbsp; <i>x</i> = <b>8</b>`) +
      say("Something plus 7 makes 15, and 8 + 7 = 15. The letter asks exactly what the box asked, so x is 8 too.")
    );
  },
  key(item) {
    const v = item.op === "−" ? item.total - item.n : item.x;
    return [want.num(v), want.num(v)];
  },
  answer(item) {
    const v = item.op === "−" ? item.total - item.n : item.x;
    return [`${item.letter} = ${v}`];
  },
};

/* ═══ variables and constants ══════════════════════════════════════════════*/

/* Things from a child's own week. `v` is true when the amount VARIES. */
const WORLD = [
  ["the number of days in a week", false],
  ["the temperature outside", true],
  ["the height of a growing plant", true],
  ["the number of sides of a triangle", false],
  ["the number of pupils present in class each day", true],
  ["the number of minutes in an hour", false],
  ["your age", true],
  ["the number of legs on a spider", false],
  ["the price of rice in the market", true],
  ["the number of months in a year", false],
  ["how much water is in a tank that is being used", true],
  ["the number of corners on a square", false],
];

const bcWorld = {
  id: "bc-world",
  group: "bc-vary",
  label: "Does it vary?",
  blurb: "Amounts that change, and amounts that never do — before any letters.",
  heading: "Does it vary, or stay the same?",
  instruction: () =>
    "Something that can CHANGE is called a VARIABLE — it varies. Something that always stays the SAME is " +
    "called a CONSTANT. Tick each one.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const deck = r.shuffle([...WORLD.keys()]);
    const start = (i * 4) % WORLD.length;
    return { picks: [0, 1, 2, 3].map((j) => deck[(start + j) % deck.length]) };
  },
  render(item) {
    return item.picks.map((w) => ask(`${WORLD[w][0]}: ${tick("varies — a variable", "stays the same — a constant")}`)).join("");
  },
  worked() {
    return worked(
      ask(`the number of days in a week: <b>stays the same — a constant</b>`) +
      ask(`the temperature outside: <b>varies — a variable</b>`) +
      say("A week always has 7 days, whatever day it is. The temperature is different in the morning and at noon, so it varies.")
    );
  },
  key(item) {
    return item.picks.map((w) => want.tick(WORLD[w][1] ? 0 : 1));
  },
  answer(item) {
    return item.picks.map((w) => `${WORLD[w][0]}: ${WORLD[w][1] ? "variable" : "constant"}`);
  },
};

/** An expression ax ± b (or b ± ax) with its parts named. */
function exprFor(r, o, i) {
  const t = tier(o);
  const letter = LETTERS[(i * 2 + r.int(0, 8)) % LETTERS.length];
  const a = r.int(2, t === "stretch" ? 12 : 9);
  const b = r.int(1, t === "stretch" ? 20 : 9);
  const shapes = t === "gentle" ? ["a+b"] : t === "middle" ? ["a+b", "b+a", "a-b"] : ["a-b", "b-a", "b+a"];
  const shape = shapes[i % shapes.length];
  const L = `<i>${letter}</i>`;
  const text = {
    "a+b": `${a}${L} + ${b}`,
    "b+a": `${b} + ${a}${L}`,
    "a-b": `${a}${L} ${MINUS} ${b}`,
    "b-a": `${b} ${MINUS} ${a}${L}`,
  }[shape];
  const coef = shape === "b-a" ? -a : a;
  const constant = shape === "a-b" ? -b : b;
  return { letter, a, b, shape, text, coef, constant };
}

const signed = (n) => (n < 0 ? `${MINUS}${-n}` : String(n));

const bcParts = {
  id: "bc-parts",
  group: "bc-vary",
  label: "The parts of an expression",
  blurb: "In 3x + 7: x is the variable, 3 is its coefficient, 7 is the constant.",
  heading: "Name the parts",
  instruction: () =>
    "The LETTER is the variable — it can be any number. The number stuck to the letter is its COEFFICIENT: " +
    "it says how many of the letter. The number on its own is the CONSTANT: it never changes. A minus in " +
    "front belongs to the number after it.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    return exprFor(r, o, i);
  },
  render(item) {
    return (
      lead(item.text) +
      ask(slot("the variable")) +
      ask(slot("its coefficient")) +
      ask(slot("the constant"))
    );
  },
  worked() {
    return worked(
      lead(`3<i>x</i> + 7`) +
      ask(`the variable <b>x</b> &nbsp; its coefficient <b>3</b> &nbsp; the constant <b>7</b>`) +
      say("3x means 3 lots of x, so 3 is the coefficient. 7 stands alone and is the same whatever x is — the constant.")
    );
  },
  key(item) {
    return [want.text(item.letter), want.num(item.coef), want.num(item.constant)];
  },
  answer(item) {
    return [`variable ${item.letter}, coefficient ${signed(item.coef)}, constant ${signed(item.constant)}`];
  },
};

const bcTable = {
  id: "bc-table",
  group: "bc-vary",
  label: "Watch it vary",
  blurb: "Give the variable different values and see what changes — and what never does.",
  heading: "Fill in the table",
  instruction: () =>
    "Swap the letter for each number in the top row and work out the answer. The variable changes every " +
    "time; notice what stays the same.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const t = tier(o);
    const letter = LETTERS[i % 3];
    const a = r.int(2, t === "stretch" ? 9 : 5);
    let b = r.int(1, t === "stretch" ? 15 : 9);
    /* the tick below asks which NUMBER stayed the same — it must not also be the coefficient */
    while (b === a) b = r.int(1, t === "stretch" ? 15 : 9);
    const minus = t === "stretch" && i % 2 === 1;
    const start = t === "gentle" ? 1 : r.int(0, 2);
    const xs = [0, 1, 2, 3, 4].map((d) => start + d);
    return { letter, a, b: minus ? -b : b, xs };
  },
  render(item) {
    const L = `<i>${item.letter}</i>`;
    const expr = `${item.a}${L} ${item.b < 0 ? MINUS : "+"} ${Math.abs(item.b)}`;
    return (
      lead(expr) +
      `<table class="bc-table"><tr><th>${L}</th>${item.xs.map((x) => `<td>${x}</td>`).join("")}</tr>` +
      `<tr><th>${expr}</th>${item.xs.map(() => `<td>${box()}</td>`).join("")}</tr></table>` +
      ask(`Which number stayed the same every time? ${tick(`${item.a}`, `${Math.abs(item.b)}`, `${item.letter}`)}`)
    );
  },
  worked() {
    return worked(
      lead(`2<i>x</i> + 3`) +
      `<table class="bc-table"><tr><th><i>x</i></th><td>1</td><td>2</td><td>3</td></tr>` +
      `<tr><th>2<i>x</i> + 3</th><td><b>5</b></td><td><b>7</b></td><td><b>9</b></td></tr></table>` +
      say("x was 1, then 2, then 3 — it varied, so it is the variable. The answer changed with it. The 3 was added every single time: it is the constant.")
    );
  },
  key(item) {
    /* the tick asks which number stayed the same: the constant, second option */
    return [...item.xs.map((x) => want.num(item.a * x + item.b)), want.tick(1)];
  },
  answer(item) {
    return [`${item.xs.map((x) => item.a * x + item.b).join(", ")} — the constant ${Math.abs(item.b)} stays the same`];
  },
};

/* ═══ the words ════════════════════════════════════════════════════════════*/

const WORDS = [
  ["variable", "a letter or amount that can change"],
  ["constant", "a number that always stays the same"],
  ["coefficient", "the number that multiplies a letter"],
  ["unknown", "an amount we do not know yet and want to find"],
  ["known", "an amount we have been told"],
  ["expression", "numbers and letters joined by + − × ÷, with no = sign"],
  ["equation", "two things that are equal, with an = sign between them"],
];

const bcWords = {
  id: "bc-words",
  group: "bc-words",
  label: "Join the word to its meaning",
  blurb: "Variable, constant, coefficient, known, unknown — the words every later page uses.",
  heading: "Join each word to what it means",
  instruction: () => "Draw a line from each word to what it means.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const all = r.shuffle([...WORDS.keys()]);
    /* the first card always carries the five words this chapter is about */
    const pick = i === 0 ? [0, 1, 2, 3, 4] : all.slice(0, 5);
    return { left: pick, right: r.shuffle(pick.slice()) };
  },
  render(item) {
    const left = item.left.map((w) => `<li><span class="wb-match__dot"></span><span><b>${WORDS[w][0]}</b></span></li>`).join("");
    const right = item.right.map((w) => `<li><span class="wb-match__dot"></span><span>${WORDS[w][1]}</span></li>`).join("");
    return `<div class="wb-match bc-match"><ul class="wb-match__side">${left}</ul><ul class="wb-match__side wb-match__side--right">${right}</ul></div>`;
  },
  key(item) {
    return [want.match(item.left.map((w, j) => [j, item.right.indexOf(w)]), "each word to its meaning")];
  },
  answer(item) {
    return item.left.map((w) => `${WORDS[w][0]} → ${WORDS[w][1]}`);
  },
};

export const BC_EXERCISES = [
  bcKnownTick, bcLetter, bcBox,
  bcWorld, bcParts, bcTable,
  bcWords,
];
