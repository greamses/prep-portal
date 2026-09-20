/* ============================================================================
   Algebra Workbook — CHAPTER 6, last section: sequences (the PLACE goes in)
   ----------------------------------------------------------------------------
   A sequence is the same machine as ever, fed with the place of a term rather
   than with any old number: put 1 in and the first term comes out, 2 gives the
   second, 10 gives the tenth — WITHOUT writing out the nine before it. That is
   the whole use of it.

     a growing pattern   place 1, 2, 3 drawn: so many lots, and a few extra
                         that never change — the × and the + of the rule, in
                         two colours, before anybody writes a rule at all
     the places go in    the train fed with 1, 2, 3, 4: out comes the sequence
     find the rule       the sequence given: BUILD the train that turns a place
                         into its term (and then use it on the 10th)
     far along           the 10th, the 50th, the 100th — and which place gives
                         a number
     is it in there?     run the machine backwards: if the place does not come
                         out a whole number, that number is not in the sequence

   Each term is a whole number, and so is every step on the way.
   ========================================================================== */

import { patternRowHtml, patternSvg, nth, termsOf } from "./seqart.js";
import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";
import { opText, runOps, trainHtml } from "/utils/components/workbook/machine.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const side = (a, b) => `<div class="fn-side">${a}<div class="fn-lines">${b}</div></div>`;
/** The places along the top, the terms beneath. */
const seqTable = (places, terms, { head = "Place", row = "Term" } = {}) =>
  `<table class="fn-table gr-table"><tbody><tr><th>${head}</th>${places.map((p) => `<td>${p}</td>`).join("")}</tr>` +
  `<tr><th>${row}</th>${terms.map((t) => `<td>${t}</td>`).join("")}</tr></tbody></table>`;

const tier = (o) => levelOf(o).id;
const num = (v) => (v < 0 ? `−${-v}` : String(v));
const jobs = (a, b) => [`*${a}`, b >= 0 ? `+${b}` : `-${-b}`].filter((op, i) => (i === 0 ? a !== 1 : b !== 0));

/** The rule of a sequence at this level: term = a × place + b. */
function ruleOf(r, o, { positive = false } = {}) {
  const t = tier(o);
  const a = t === "gentle" ? r.int(2, 5) : t === "middle" ? r.int(2, 9) : r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const b = t === "gentle" || positive ? r.int(1, 9) : r.int(-8, 9);
  return { a, b: b === 0 ? 1 : b };
}

export const SQ_GROUPS = [
  { id: "sq-place", label: "Sequences: the place goes in", blurb: "Feed the machine the PLACE of a term — 1, 2, 3 — and out comes the sequence." },
  { id: "sq-rule", label: "The rule of a sequence", blurb: "Build the train from a sequence, and use it far along the line." },
];

/* ═══ 1. a growing pattern ═════════════════════════════════════════════════*/

const sqPattern = {
  id: "sq-pattern",
  group: "sq-place",
  label: "A growing pattern",
  blurb: "So many lots, and a few extra that never change.",
  heading: "Count the growing pattern",
  instruction: () =>
    "Each pattern has its PLACE written under it. Count the squares in each. The blue squares come in lots — " +
    "one more lot every place — and the orange ones were there from the start and never change. Count the " +
    "next one WITHOUT drawing it: one more lot than the one before.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const { a, b } = ruleOf(r, o, { positive: true });
    return { a: Math.min(a, 5), b: Math.min(b, 4) };
  },
  render(item) {
    const { a, b } = item;
    return side(patternRowHtml(a, b, [1, 2, 3]),
      seqTable([1, 2, 3, 4], [box(), box(), box(), box()]) +
      ask(`Every new place adds ${box()} squares.`) +
      ask(`Before the lots start, there are always ${box()} orange ones.`));
  },
  worked() {
    return worked(`<div class="sq-row">${patternSvg(3, 2, 1, { label: "Place 1" })}${patternSvg(3, 2, 2, { label: "Place 2" })}</div>` +
      say("Place 1 has one lot of 3 and 2 orange: 5. Place 2 has two lots of 3 and the same 2 orange: 8. Every " +
        "place adds one more lot of 3, and the 2 never changes — so place 4 has 4 × 3 + 2 = 14 squares."));
  },
  key(item) {
    const { a, b } = item;
    return [...termsOf(a, b, 4).map((t) => want.num(t)), want.num(a), want.num(b)];
  },
  answer(item) {
    return [`${termsOf(item.a, item.b, 4).join(", ")}; ${nth(item.a, item.b)}`];
  },
};

const sqRun = {
  id: "sq-run",
  group: "sq-place",
  label: "Feed the machine the place",
  blurb: "1, 2, 3, 4 go in — the sequence comes out.",
  heading: "Put the places through",
  instruction: () =>
    "This train makes a sequence: what goes IN is the PLACE of the term — 1 for the first, 2 for the second — " +
    "and what comes out is the term itself. Put each place through in turn and write the sequence.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return ruleOf(r, o);
  },
  render(item) {
    const ops = jobs(item.a, item.b);
    /* the train above and the five places under it: side by side they run off
       the page once the numbers are big */
    return trainHtml({ given: ops }) +
      seqTable([1, 2, 3, 4, 5], [box(), box(), box(), box(), box()]) +
      ask("What goes into the machine is") + tick("the place of the term", "the term before it");
  },
  key(item) {
    const ops = jobs(item.a, item.b);
    return [...[1, 2, 3, 4, 5].map((p) => want.num(runOps(ops, p))), want.tick(0)];
  },
  answer(item) {
    return [termsOf(item.a, item.b, 5).map(num).join(", ")];
  },
};

/* ═══ 2. the rule of a sequence ════════════════════════════════════════════*/

const sqFind = {
  id: "sq-find",
  group: "sq-rule",
  label: "Build the train for a sequence",
  blurb: "From the sequence to the machine that makes it.",
  heading: "Find the rule of the sequence",
  instruction: () =>
    "The places are 1, 2, 3, 4 and the terms are underneath. How much does the sequence go up by each place? " +
    "That is the × job. Then see what must be added to 1 lot of it to make the first term. Build the train — " +
    "on screen, type the jobs into the coaches — and ride the places through it to test it.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const { a, b } = ruleOf(r, o);
    const far = tier(o) === "gentle" ? 10 : r.pick([10, 20, 50]);
    const tray = [`*${a}`, b >= 0 ? `+${b}` : `-${-b}`, `*${a + 1}`, `+${Math.max(1, Math.abs(b) + 2)}`, `-${Math.max(1, Math.abs(b))}`, `*${Math.max(2, a - 1)}`];
    return { a, b, far, tray: r.shuffle([...new Set(tray)]) };
  },
  render(item) {
    const places = [1, 2, 3, 4];
    const terms = termsOf(item.a, item.b, 4);
    return side(seqTable(places, terms.map(num)),
      trainHtml({ slots: 2, ins: places, tray: item.tray }) +
      ask(`The ${item.far}th term is ${box()}`) +
      eq(`The rule: term = ${box()} × place + ${box()}`));
  },
  worked() {
    return worked(say("5, 8, 11, 14: each place adds 3, so the first job is × 3. But place 1 × 3 is 3, and the " +
      "first term is 5 — so 2 more: the second job is + 2. Test place 4: 4 × 3 + 2 = 14. Right. The tenth term " +
      "is 10 × 3 + 2 = 32, and nobody had to write out the nine before it."));
  },
  key(item) {
    const places = [1, 2, 3, 4];
    return [
      want.machine({ ins: places, outs: termsOf(item.a, item.b, 4), says: jobs(item.a, item.b).map(opText).join(" then ") }),
      want.num(item.a * item.far + item.b),
      want.num(item.a), want.num(item.b),
    ];
  },
  answer(item) {
    return [`${nth(item.a, item.b)}; the ${item.far}th is ${num(item.a * item.far + item.b)}`];
  },
};

const sqFar = {
  id: "sq-far",
  group: "sq-rule",
  label: "Far along the line",
  blurb: "The 50th term without writing out the 49 before it.",
  heading: "Go far along the sequence",
  instruction: () =>
    "The rule turns a place into its term, so put the place straight in — the 50th term is the rule done to 50. " +
    "To go the other way, undo the rule: take away, then divide.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const { a, b } = ruleOf(r, o);
    const far = r.pick(tier(o) === "gentle" ? [10, 20] : [20, 50, 100]);
    const back = r.int(6, 20);
    return { a, b, far, back };
  },
  render(item) {
    const target = item.a * item.back + item.b;
    return eq(`term = ${nth(item.a, item.b, "place")}`) +
      seqTable([1, 2, 3], termsOf(item.a, item.b, 3).map(num), { head: "Place", row: "Term" }) +
      eq(`The ${item.far}th term is ${box()}`) +
      eq(`Which place gives ${num(target)}? ${box()}`);
  },
  key(item) {
    return [want.num(item.a * item.far + item.b), want.num(item.back)];
  },
  answer(item) {
    return [`${num(item.a * item.far + item.b)}; place ${item.back}`];
  },
};

const sqIn = {
  id: "sq-in",
  group: "sq-rule",
  label: "Is that number in the sequence?",
  blurb: "Undo the rule: a place that is not a whole number means no.",
  heading: "Is it in the sequence?",
  hardest: true,
  instruction: () =>
    "Run the machine BACKWARDS on the number: undo the + (or −) first, then undo the ×. If the place comes out " +
    "a whole number, the number is in the sequence — at that place. If it does not, it is not in the sequence " +
    "at all, however close it looks.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const { a, b } = ruleOf(r, o);
    const place = r.int(5, 18);
    const inIt = i % 2 === 0;
    /* a near miss: one more than a term, which the × cannot undo evenly */
    const value = a * place + b + (inIt ? 0 : r.int(1, a - 1));
    return { a, b, value, inIt, place };
  },
  render(item) {
    return eq(`term = ${nth(item.a, item.b, "place")}`) +
      ask(`Is ${num(item.value)} in this sequence?`) +
      eq(`Undo the ${item.b >= 0 ? `+ ${item.b}` : `− ${-item.b}`}: ${num(item.value)} ${item.b >= 0 ? "−" : "+"} ${Math.abs(item.b)} = ${box()}`) +
      ask(`Does that divide by ${item.a} exactly?`) + tick("Yes", "No") +
      eq(`So its place is ${box()} &nbsp; <em>(write — if it is not in the sequence)</em>`);
  },
  worked() {
    return worked(say("Is 41 in 5, 8, 11, 14…? The rule is 3 × place + 2. Undo the + 2: 41 − 2 = 39. Undo the " +
      "× 3: 39 ÷ 3 = 13 — a whole number, so yes: 41 is the 13th term. Try 42: 42 − 2 = 40, and 40 ÷ 3 is not " +
      "whole, so 42 is not in the sequence at all."));
  },
  key(item) {
    const after = item.value - item.b;
    return [
      want.num(after),
      want.tick(item.inIt ? 0 : 1),
      item.inIt ? want.text(String(item.place)) : want.text("—", "-", "none", "no", "not in it"),
    ];
  },
  answer(item) {
    const after = item.value - item.b;
    return [`${num(after)} ÷ ${item.a}: ${item.inIt ? `whole, so place ${item.place}` : "not whole, so it is not in the sequence"}`];
  },
};

export const SQ_EXERCISES = [sqPattern, sqRun, sqFind, sqFar, sqIn];
