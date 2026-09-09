/* ============================================================================
   Remainder Theorem Workbook — the exercises, as one registry
   ----------------------------------------------------------------------------
   ONE list, read by the builder (which offers them), the engine (which prints
   them) and the answer key (which marks them) — the same shape as the
   place-value workbook's registry, so a new exercise is an entry here and
   nothing else.

   THE ORDER IS THE TEACHING, and it is the whole design of this paper:

     A  the bracket and its zero      one step, done on its own, over and over
     B  swapping x for a number       the arithmetic, with a row per term
     C  the remainder theorem         the two put together, in the frame
     D  saying the rule               the words, so the method survives the week

   Nothing in section C is new. By the time a child reaches it they have found
   the zero thirty times and substituted twenty; the frame only says which
   order to do them in. That is the point of splitting a method this far down —
   a child who cannot do the whole thing can always do the first row, and a
   first row done right is a lesson that went well.

   Every question is said in the SAME WORDS every time. "Find the remainder
   when … is divided by …" never becomes "what is left over when you divide",
   because for the learner this paper is built for, the second sentence is a
   new question and not the same one.
   ========================================================================== */

import {
  polyText, statement, divisor, divisorText, zeroEquation, valueAt, num, factor,
  shortText, drawQuestion, drawFactor, drawPoly, drawRoot, rootDealer,
  levelOf, NAME,
} from "./poly.js";
import {
  frame, ladder, zeroBox, workingBox, tickPair, worked, askRemainder, helpOf,
} from "./organiser.js";

const line = (size = "md") => `<span class="wb-line wb-line--${size}"></span>`;

export const GROUPS = [
  { id: "zero", label: "A · The bracket and its zero", blurb: "One step on its own: what number makes the bracket zero?" },
  { id: "swap", label: "B · Swapping x for a number", blurb: "The arithmetic, with a row for every term." },
  { id: "theorem", label: "C · The remainder theorem", blurb: "The two steps together, in the four-step frame." },
  { id: "say", label: "D · Saying the rule", blurb: "The words, so the method is still there next week." },
];

/* ── A. the bracket and its zero ───────────────────────────────────────────*/

/* Every section that shows brackets deals them from a shuffled pack rather
   than drawing one per question — see rootDealer in poly.js for why. */
const dealZeroFind = rootDealer();

const zeroFind = {
  id: "zero-find",
  group: "zero",
  label: "Make the bracket zero",
  blurb: "x − 3 = 0, so x = 3. The one step the whole method turns on.",
  heading: "Make each bracket zero",
  instruction: () => "What number makes the bracket equal to zero? Write it in the second box.",
  cols: 2,
  defaultCount: 8,
  make(r, o, k, i) {
    return { a: dealZeroFind(r, o, i) };
  },
  render(item) {
    return zeroBox(item.a);
  },
  worked(o) {
    const a = levelOf(o).roots.includes(2) ? 2 : levelOf(o).roots[0];
    return worked("Make the bracket zero.", zeroBox(a, { answer: true }));
  },
  answer(item) {
    return [`x = ${num(item.a)}`];
  },
};

const zeroMatch = {
  id: "zero-match",
  group: "zero",
  label: "Join each bracket to its number",
  blurb: "Brackets down one side, numbers down the other. Draw the lines.",
  heading: "Join each bracket to its number",
  instruction: () => "Draw a line from each bracket to the number that makes it zero.",
  cols: 1,
  groupSize: 5,
  defaultCount: 5,
  /* Never longer than the number of DIFFERENT brackets this level has. Two
     lines running to the same dot is not a puzzle with two answers, it is a
     puzzle with none. */
  make(r, o, k) {
    const pool = r.shuffle(levelOf(o).roots.slice());
    const roots = pool.slice(0, Math.min(k, pool.length));
    return { roots, right: r.shuffle(roots.slice()) };
  },
  render(item) {
    const left = item.roots
      .map((a) => `<li><span class="rt-match__dot"></span><span>${divisor(a)}</span></li>`)
      .join("");
    const right = item.right
      .map((a) => `<li><span class="rt-match__dot"></span><span>x = ${num(a)}</span></li>`)
      .join("");
    return (
      `<div class="rt-match">` +
      `<ul class="rt-match__side">${left}</ul>` +
      `<ul class="rt-match__side rt-match__side--right">${right}</ul>` +
      `</div>`
    );
  },
  answer(item) {
    return item.roots.map((a) => `${divisor(a)} → x = ${num(a)}`);
  },
};

const dealZeroWrite = rootDealer();

const zeroWrite = {
  id: "zero-write",
  group: "zero",
  label: "Write the bracket back",
  blurb: "The same fact the other way round: x = −2 came from which bracket?",
  heading: "Write the bracket back",
  instruction: () =>
    "Each number came from a bracket. Write the bracket it came from.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    return { a: dealZeroWrite(r, o, i) };
  },
  render(item) {
    return `<p class="wb-ask wb-ask--lead">x = ${num(item.a)} came from ( ${line("sm")} )</p>`;
  },
  worked() {
    return worked(
      "x = −2 came from which bracket?",
      `<p class="wb-ask wb-ask--lead">x = −2 came from ( <b>x + 2</b> ) &nbsp;— because x + 2 = 0 when x = −2.</p>`
    );
  },
  answer(item) {
    return [divisorText(item.a)];
  },
};

/* ── B. swapping x for a number ────────────────────────────────────────────*/

const dealLadder = rootDealer();

const swapLadder = {
  id: "swap-ladder",
  group: "swap",
  label: "The swap ladder",
  blurb: "One row per term, so the substitution is done in small pieces.",
  heading: "Swap x for the number, a row at a time",
  instruction: () =>
    "Fill in one row for each term, then add the last column up. The total is the answer.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const { c, a } = drawQuestion(r, o, { root: dealLadder(r, o, i) });
    return { c, a };
  },
  render(item, o) {
    return (
      `<p class="wb-ask wb-ask--lead">${statement(item.c)}. &nbsp; Work out ` +
      `<b>${NAME}(${num(item.a)})</b>.</p>` +
      ladder(item.c, item.a, o)
    );
  },
  worked(o) {
    const c = [5, -4, 0, 2]; // 2x³ − 4x + 5, the example used all through this paper
    return worked(
      `${statement(c)}. Work out ${NAME}(3).`,
      ladder(c, 3, o, { filledMiddle: true, filledRight: true })
    );
  },
  answer(item) {
    return [`${NAME}(${num(item.a)}) = ${num(valueAt(item.c, item.a))}`];
  },
};

const dealQuick = rootDealer();

const swapQuick = {
  id: "swap-quick",
  group: "swap",
  label: "Swap it in one line",
  blurb: "The same thing without the ladder, once the ladder is not needed.",
  heading: "Swap x for the number",
  instruction: () => "Swap every x for the number in the brackets, then work it out.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const { c, a } = drawQuestion(r, o, { root: dealQuick(r, o, i) });
    return { c, a };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">${statement(item.c)}</p>` +
      `<p class="wb-ask">${NAME}(${num(item.a)}) = ${line("sm")}</p>`
    );
  },
  answer(item) {
    return [`${NAME}(${num(item.a)}) = ${num(valueAt(item.c, item.a))}`];
  },
};

/* ── C. the remainder theorem ──────────────────────────────────────────────*/

const dealFrame = rootDealer();

const frameEx = {
  id: "frame",
  group: "theorem",
  label: "The four-step frame",
  blurb: "The whole method, one numbered row at a time. The heart of this paper.",
  heading: "Find the remainder, one step at a time",
  instruction: () =>
    "Fill in the four rows in order. Row four is the remainder.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const { c, a } = drawQuestion(r, o, { root: dealFrame(r, o, i) });
    return { c, a };
  },
  render(item, o) {
    return (
      `<p class="wb-ask wb-ask--lead">${askRemainder(item.c, item.a)}</p>` +
      frame(item, o)
    );
  },
  worked(o) {
    const c = [5, -4, 0, 2];
    const a = 3;
    return worked(
      askRemainder(c, a),
      frame({ c, a }, o, {
        given: {
          bracket: divisor(a),
          zero: "<b>x = 3</b>",
          swap: `2 × 3 × 3 × 3 − 4 × 3 + 5`,
          answer: num(valueAt(c, a)),
        },
      })
    );
  },
  answer(item) {
    return [
      `x = ${num(item.a)} · ${shortestWorking(item)} · remainder = ` +
        `<b>${num(valueAt(item.c, item.a))}</b>`,
    ];
  },
};

const dealRemainder = rootDealer();

const remainderEx = {
  id: "remainder",
  group: "theorem",
  label: "Find the remainder",
  blurb: "The question on its own, with a ruled box to work in.",
  heading: "Find the remainder",
  instruction: () =>
    "Make the bracket zero, swap every x for that number, and work it out.",
  /* Full width, even though the question would fit in half. A question that
     wraps over three short lines is a harder question than the same question
     on one line, and that is not the difficulty this exercise is for. */
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    const { c, a } = drawQuestion(r, o, { root: dealRemainder(r, o, i) });
    return { c, a };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">${askRemainder(item.c, item.a)}</p>` +
      workingBox({ lines: 4 }) +
      `<p class="wb-ask">Remainder = ${line("sm")}</p>`
    );
  },
  answer(item) {
    return [num(valueAt(item.c, item.a))];
  },
};

let factorFlip = 0;
const dealFactor = rootDealer();

const factorEx = {
  id: "factor",
  group: "theorem",
  label: "Is it a factor?",
  blurb: "The same working, and one extra sentence: a remainder of 0 means it goes in exactly.",
  heading: "Is the bracket a factor?",
  instruction: () =>
    "Work out the remainder the same way. If the remainder is 0 the bracket IS a factor. " +
    "If it is not 0 the bracket is NOT a factor. Then tick.",
  cols: 1,
  defaultCount: 4,
  /* Half of them are factors and half are not — ALTERNATING, not tossed for.
     Four coin tosses come up three-to-one often enough that a page of yes,
     yes, yes, no would be common, and a child who answered yes to everything
     would have scored three out of four for it. The ones that are NOT factors
     miss by a little, because "a small remainder means yes" is the other wrong
     rule waiting to be learned. */
  make(r, o, k, i) {
    if (i === 0) factorFlip = r.chance(0.5) ? 1 : 0;
    const isFactor = (i + factorFlip) % 2 === 0;
    const wanted = isFactor ? 0 : r.pick([-3, -2, -1, 1, 2, 3]);
    const { c, a, value } = drawFactor(r, o, wanted, dealFactor(r, o, i));
    return { c, a, value, isFactor };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Is <b>${divisor(item.a)}</b> a factor of ` +
      `<b>${polyText(item.c)}</b>?</p>` +
      workingBox({ lines: 3 }) +
      `<p class="wb-ask">Remainder = ${line("sm")} &nbsp;&nbsp; ` +
      tickPair("Yes, it is a factor", "No, it is not") +
      `</p>`
    );
  },
  worked(o) {
    void o;
    const c = [-6, -1, 0, 1]; // x³ − x − 6, which (x − 2) divides exactly
    return worked(
      `Is ${divisor(2)} a factor of ${polyText(c)}?`,
      `<p class="wb-ask">x − 2 = 0, so <b>x = 2</b>.</p>` +
        `<p class="wb-ask">2 × 2 × 2 − 2 − 6 = 8 − 2 − 6 = <b>0</b></p>` +
        `<p class="wb-ask">The remainder is <b>0</b>, so ${divisor(2)} <b>is</b> a factor.</p>`
    );
  },
  answer(item) {
    return [
      `remainder ${num(item.value)} — ${item.isFactor ? "yes, a factor" : "no, not a factor"}`,
    ];
  },
};

const findK = {
  id: "find-k",
  group: "theorem",
  label: "Find the missing number",
  blurb: "The method run backwards. Only worth setting once the frame is easy.",
  heading: "Find the missing number",
  instruction: () =>
    "There is a letter k in each one. Swap x for the number as usual, then work out what k must be.",
  cols: 1,
  defaultCount: 2,
  hardest: true,
  make(r, o) {
    const c = drawPoly(r, o);
    const a = drawRoot(r, o);
    const k = r.pick([-4, -3, -2, 2, 3, 4]);
    c[1] = k; // k always multiplies x, so the sum a child forms is k × a
    return { c, a, k, value: valueAt(c, a) };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">${NAME}(x) = ` +
      `${polyText(item.c, { letter: { at: 1, as: "k" } })}</p>` +
      `<p class="wb-ask">Divided by <b>${divisor(item.a)}</b> the remainder is ` +
      `<b>${num(item.value)}</b>.</p>` +
      workingBox({ lines: 3 }) +
      `<p class="wb-ask">k = ${line("sm")}</p>`
    );
  },
  answer(item) {
    return [`k = ${num(item.k)}`];
  },
};

/* ── D. saying the rule ────────────────────────────────────────────────────*/

/* The blank is written as ___ inside the sentence so the answer key can quote
   the same sentence back with the word in it. */
const RULES = [
  ["When P(x) is divided by (x − a), the remainder is P(___).", "a"],
  ["To start, make the bracket equal to ___.", "0 (zero)"],
  ["If the remainder is ___, then the bracket is a factor.", "0 (zero)"],
  ["The bracket (x + 5) is zero when x = ___.", "−5"],
  ["The bracket (x − 7) is zero when x = ___.", "7"],
  ["P(4) means: swap every x for ___.", "4"],
  ["If P(3) = 11, dividing by (x − 3) leaves a remainder of ___.", "11"],
  ["A remainder ___ be a negative number.", "can"],
];

/**
 * The two exercises below deal from a fixed bank rather than drawing from it,
 * because a bank of eight drawn five times over repeats about half the time,
 * and the same sentence twice on one page reads as a mistake.
 *
 * The order is shuffled once, on the first question, and then dealt. `make` is
 * always called in order from index 0 for a given exercise (see the engine), so
 * this is deterministic for a given seed — which the answer key depends on.
 */
function dealer(bank) {
  let order = null;
  return (r, i) => {
    if (i === 0 || !order) order = r.shuffle(bank.map((_, j) => j));
    return order[i % order.length];
  };
}

const dealRule = dealer(RULES);

const ruleFill = {
  id: "rule-fill",
  group: "say",
  label: "Finish the sentence",
  blurb: "The rule in words, with one word missing.",
  heading: "Finish each sentence",
  instruction: () => "Write the missing word or number on the line.",
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    return { pick: dealRule(r, i) };
  },
  render(item) {
    const [text] = RULES[item.pick];
    return `<p class="wb-ask wb-ask--lead">${text.replace("___", line("sm"))}</p>`;
  },
  answer(item) {
    return [RULES[item.pick][1]];
  },
};

const TF = [
  ["(x + 3) is zero when x = 3.", false],
  ["(x − 4) is zero when x = 4.", true],
  ["If the remainder is 0, the bracket is a factor.", true],
  ["You have to do long division before you can use the remainder theorem.", false],
  ["P(−1) means swap every x for −1.", true],
  ["A remainder can be a negative number.", true],
  ["If P(2) = 5, the remainder when you divide by (x − 2) is 5.", true],
  ["If P(2) = 5, then (x − 2) is a factor.", false],
  ["(x + 6) is zero when x = −6.", true],
  ["The remainder is always smaller than the number you divided by.", false],
];

const dealTF = dealer(TF);

const trueFalse = {
  id: "true-false",
  group: "say",
  label: "True or false",
  blurb: "Tick one box. Half of them are the mistake people actually make.",
  heading: "True or false?",
  instruction: () => "Tick one box for each sentence.",
  cols: 1,
  defaultCount: 5,
  make(r, o, k, i) {
    return { pick: dealTF(r, i) };
  },
  render(item) {
    /* The sentence and the boxes are two columns, not a sentence with boxes
       after it, so the ticks line up down the page however long the sentences
       are. A column of boxes is one target to aim at; boxes that move about
       are five. */
    return (
      `<p class="wb-ask wb-ask--lead rt-tf">` +
      `<span class="rt-tf__say">${TF[item.pick][0]}</span>` +
      tickPair("True", "False") +
      `</p>`
    );
  },
  answer(item) {
    return [TF[item.pick][1] ? "True" : "False"];
  },
};

/* ── the registry ──────────────────────────────────────────────────────────*/

export const EXERCISES = [
  zeroFind, zeroMatch, zeroWrite,
  swapLadder, swapQuick,
  frameEx, remainderEx, factorEx, findK,
  ruleFill, trueFalse,
];

export function exerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

/** Why an exercise cannot run under these settings, or null. */
export function unavailable(ex, o) {
  if (ex.hardest && o.level === "gentle") return "needs Middle or Stretch";
  return null;
}

/** The one-line working the answer key quotes back for the frame. */
function shortestWorking(item) {
  const terms = [];
  for (let p = item.c.length - 1; p >= 0; p--) {
    if (!item.c[p]) continue;
    terms.push(shortText(item.c[p], p, item.a));
  }
  return terms.join(" + ").replace(/\+ −/g, "− ");
}

export { helpOf, factor, num, divisor, zeroEquation };
