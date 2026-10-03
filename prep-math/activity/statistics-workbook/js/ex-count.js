/* ============================================================================
   Statistics Workbook — CHAPTER 7: PERMUTATIONS AND COMBINATIONS
   ----------------------------------------------------------------------------
   Probability is "how many ways I want" over "how many ways there are" — and
   the ways soon get too many to list. This chapter counts them without
   listing.

     the counting principle   3 shirts and 4 trousers: 3 × 4 outfits
     factorials               n! = n × (n − 1) × … × 1, and n! ÷ (n − 2)!
     arranging                n different things in a row: n!
     permutations             r of the n, in ORDER: ⁿPᵣ = n! ÷ (n − r)!
     combinations             r of the n, order NOT counting: ⁿCᵣ = ⁿPᵣ ÷ r!
     which is it?             does the order matter? — then the number
     repeated letters         (Middle+) the arrangements of LEVEL: 5! ÷ (2! 2!)
     with a condition         (Stretch) two who must sit together; a committee
                              with so many of each

   Every answer is a whole number, and none is too big to work by hand.
   ========================================================================== */

import { levelOf } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const tier = (o) => levelOf(o).id;

export const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
export const nPr = (n, r) => fact(n) / fact(n - r);
export const nCr = (n, r) => nPr(n, r) / fact(r);

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹", SUB = "₀₁₂₃₄₅₆₇₈₉";
const up = (n) => String(n).split("").map((d) => SUP[d]).join("");
const down = (n) => String(n).split("").map((d) => SUB[d]).join("");
/** ⁵P₂ and ⁵C₂, said outright to the typesetter. */
const P = (n, r) => `<span data-tex="{}^{${n}}P_{${r}}">${up(n)}P${down(r)}</span>`;
const C = (n, r) => `<span data-tex="{}^{${n}}C_{${r}}">${up(n)}C${down(r)}</span>`;

export const PC_GROUPS = [
  { id: "pc-count", chapter: "Chapter 7 · Permutations and combinations", label: "Counting and factorials", blurb: "Multiply the choices; n! for everything in a row." },
  { id: "pc-perm", label: "Permutations and combinations", blurb: "In order: ⁿPᵣ. Order not counting: ⁿCᵣ." },
  { id: "pc-more", label: "Repeats and conditions", blurb: "Letters that repeat, people who must sit together." },
];

/* ═══ the counting principle ═══════════════════════════════════════════════*/

const PRINCIPLES = [
  (r) => { const a = r.int(2, 6), b = r.int(2, 6); return { text: `A shop has ${a} kinds of bread and ${b} kinds of spread. How many different sandwiches of one bread and one spread can be made?`, v: a * b, how: `${a} × ${b}` }; },
  (r) => { const a = r.int(2, 5), b = r.int(2, 5), c = r.int(2, 4); return { text: `Ada has ${a} shirts, ${b} skirts and ${c} pairs of shoes. How many different outfits can she wear?`, v: a * b * c, how: `${a} × ${b} × ${c}` }; },
  (r) => { const a = r.int(2, 5), b = r.int(2, 5); return { text: `There are ${a} roads from Ibadan to Lagos and ${b} roads from Lagos to Badagry. How many ways are there from Ibadan to Badagry through Lagos?`, v: a * b, how: `${a} × ${b}` }; },
  (r) => { const d = r.int(2, 3); return { text: `A code is ${d} digits long, and each digit may be any of 0 to 9. How many codes are there?`, v: 10 ** d, how: Array(d).fill(10).join(" × ") }; },
  (r) => { const n = r.int(2, 4); return { text: `A coin is tossed ${n} times. How many different orders of heads and tails can come up?`, v: 2 ** n, how: Array(n).fill(2).join(" × ") }; },
];

const pcPrinciple = {
  id: "pc-principle",
  group: "pc-count",
  label: "The counting principle",
  blurb: "One choice then another: multiply.",
  heading: "The counting principle",
  instruction: () =>
    "When one choice is followed by another, MULTIPLY the numbers of ways: every way of making the first choice " +
    "can go with every way of making the second. Three choices: multiply all three.",
  cols: 1,
  defaultCount: 4,
  make: (r) => r.pick(PRINCIPLES)(r),
  render: (item) => ask(`${item.text} ${box()}`),
  worked() {
    return worked(say("3 shirts and 4 trousers: each shirt goes with each of the 4 trousers, so 3 × 4 = 12 outfits."));
  },
  key: (item) => [want.num(item.v)],
  answer: (item) => [`${item.how} = ${item.v}`],
};

/* ═══ factorials ═══════════════════════════════════════════════════════════*/

const pcFact = {
  id: "pc-fact",
  group: "pc-count",
  label: "Factorials",
  blurb: "n! = n × (n − 1) × … × 1 — and how they cancel.",
  heading: "Factorials",
  instruction: () =>
    "n! (“n factorial”) is n × (n − 1) × (n − 2) × … × 1: 4! = 4 × 3 × 2 × 1 = 24. One factorial divided by a " +
    "smaller one CANCELS: 6! ÷ 4! is 6 × 5, because the 4 × 3 × 2 × 1 is in both. Never multiply everything out " +
    "when you can cancel first.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const kind = t === "gentle" ? 0 : r.int(0, 2);
    if (kind === 0) { const n = r.int(3, t === "gentle" ? 5 : 6); return { text: `${n}!`, v: fact(n), how: `${Array.from({ length: n }, (_, i) => n - i).join(" × ")}` }; }
    if (kind === 1) { const n = r.int(4, 9), k = r.int(1, 3); return { text: `${n}! ÷ ${n - k}!`, v: nPr(n, k), how: Array.from({ length: k }, (_, i) => n - i).join(" × ") }; }
    const n = r.int(4, 8), k = r.int(2, 3);
    return { text: `${n}! ÷ (${k}! × ${n - k}!)`, v: nCr(n, k), how: `${Array.from({ length: k }, (_, i) => n - i).join(" × ")} ÷ ${fact(k)}` };
  },
  render: (item) => ask(`${item.text} = ${box()}`),
  worked() {
    return worked(say("7! ÷ 5! = 7 × 6 × (5 × 4 × 3 × 2 × 1) ÷ (5 × 4 × 3 × 2 × 1) = 7 × 6 = 42."));
  },
  key: (item) => [want.num(item.v)],
  answer: (item) => [`${item.text} = ${item.how} = ${item.v}`],
};

/* ═══ arranging in a row ═══════════════════════════════════════════════════*/

const ROWS = [
  (n) => `In how many orders can ${n} different books stand on a shelf?`,
  (n) => `${n} pupils line up for assembly. In how many different orders can they stand?`,
  (n) => `In how many ways can the ${n} letters of a word with no repeated letter be arranged?`,
  (n) => `${n} runners finish a race, no two together. How many finishing orders are possible?`,
];

const pcArrange = {
  id: "pc-arrange",
  group: "pc-count",
  label: "Arranging in a row",
  blurb: "n choices for the first place, n − 1 for the next …: n!",
  heading: "Arranging things in a row",
  instruction: () =>
    "For the first place there are n things to choose from; for the second, one fewer; then one fewer again, " +
    "down to 1. By the counting principle that is n × (n − 1) × … × 1 = n!.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const n = r.int(3, tier(o) === "gentle" ? 5 : 7);
    return { n, text: r.pick(ROWS)(n) };
  },
  render: (item) => ask(`${item.text} ${box()}`),
  worked() {
    return worked(say("4 books: 4 choices for the first place, 3 for the next, then 2, then 1. 4! = 24 orders."));
  },
  key: (item) => [want.num(fact(item.n))],
  answer: (item) => [`${item.n}! = ${fact(item.n)}`],
};

/* ═══ permutations ═════════════════════════════════════════════════════════*/

const pick2 = (r, o) => {
  const t = tier(o);
  const n = r.int(4, t === "gentle" ? 6 : t === "middle" ? 8 : 10);
  return { n, r: r.int(2, Math.min(t === "stretch" ? 4 : 3, n - 1)) };
};

const pcPerm = {
  id: "pc-perm",
  group: "pc-perm",
  label: "Permutations",
  blurb: "r of the n in order: n! ÷ (n − r)!",
  heading: "Permutations: order counts",
  instruction: () =>
    "A PERMUTATION is an arrangement — the order matters. Choosing r things from n and putting them in order can " +
    "be done in n × (n − 1) × … (r numbers multiplied) ways: that is n! ÷ (n − r)!. Give n − r, then the answer.",
  cols: 1,
  defaultCount: 4,
  make: (r, o) => pick2(r, o),
  render: (item) => ask(`${P(item.n, item.r)} = ${item.n}! ÷ ${box()}! = ${box()}`),
  worked() {
    return worked(say("⁵P₂ = 5! ÷ 3! = 5 × 4 = 20: five choices for the first place and four for the second."));
  },
  key: (item) => [want.num(item.n - item.r), want.num(nPr(item.n, item.r))],
  answer: (item) => [`${item.n}! ÷ ${item.n - item.r}! = ${nPr(item.n, item.r)}`],
};

const pcComb = {
  id: "pc-comb",
  group: "pc-perm",
  label: "Combinations",
  blurb: "The same r in any order is one choice: divide by r!",
  heading: "Combinations: order does not count",
  instruction: () =>
    "A COMBINATION is a choice — a team, a hand of cards — where the order does not matter. Each choice of r " +
    "things has been counted r! times among the permutations (once for each order), so divide: " +
    "the number of combinations is the number of permutations ÷ r!. Give both.",
  cols: 1,
  defaultCount: 4,
  make: (r, o) => pick2(r, o),
  render: (item) => ask(`${P(item.n, item.r)} = ${box()} &nbsp; so ${C(item.n, item.r)} = ${box()}`),
  worked() {
    return worked(say("⁵P₂ = 20. Each pair has been counted twice (AB and BA), so ⁵C₂ = 20 ÷ 2! = 10."));
  },
  key: (item) => [want.num(nPr(item.n, item.r)), want.num(nCr(item.n, item.r))],
  answer: (item) => [`P = ${nPr(item.n, item.r)}, C = ${nPr(item.n, item.r)} ÷ ${fact(item.r)} = ${nCr(item.n, item.r)}`],
};

/* stories: [text(n, r), is the order counted?] */
const WHICH = [
  [(n, r) => `A club of ${n} members chooses a president, a secretary${r === 3 ? " and a treasurer" : ""}. In how many ways?`, true, [2, 3]],
  [(n, r) => `A committee of ${r} is chosen from ${n} people. In how many ways?`, false, [2, 3, 4]],
  [(n, r) => `${r} of ${n} runners win gold, silver${r === 3 ? " and bronze" : ""}. In how many ways can the medals go?`, true, [2, 3]],
  [(n, r) => `A pupil must answer ${r} of the ${n} questions on a paper. In how many ways can they be chosen?`, false, [2, 3, 4]],
  [(n, r) => `How many ${r}-letter codes can be made from ${n} different letters, using none twice?`, true, [2, 3]],
  [(n, r) => `${r} books are picked from ${n} to take on holiday. In how many ways?`, false, [2, 3, 4]],
];

const pcWhich = {
  id: "pc-which",
  group: "pc-perm",
  label: "Permutation or combination?",
  blurb: "Does the order matter? Then count.",
  heading: "Permutation or combination?",
  instruction: () =>
    "Ask one question: if the same things were picked in a DIFFERENT ORDER, would it be a different result? " +
    "President then secretary is different from secretary then president — order matters, a permutation. A " +
    "committee is the same committee whoever was picked first — a combination. Tick, then work it out.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    const [text, ordered, rs] = r.pick(WHICH);
    const rr = r.pick(rs.filter((x) => t !== "gentle" || x <= 3));
    const n = r.int(rr + 2, t === "gentle" ? 6 : 9);
    return { text: text(n, rr), ordered, n, r: rr, v: ordered ? nPr(n, rr) : nCr(n, rr) };
  },
  render: (item) => ask(item.text) + ask(`It is a ${tick("permutation", "combination")} &nbsp; number of ways: ${box()}`),
  worked() {
    return worked(say("A president and a secretary from 6: who gets which job matters, so a permutation — ⁶P₂ = 6 × 5 = 30. " +
      "A committee of 2 from 6 is a combination: 30 ÷ 2 = 15."));
  },
  key: (item) => [want.tick(item.ordered ? 0 : 1), want.num(item.v)],
  answer: (item) => [`${item.ordered ? "permutation" : "combination"}: ${item.v}`],
};

/* ═══ repeated letters ═════════════════════════════════════════════════════*/

/* words and their letter counts */
const WORDS = ["LEVEL", "APPLE", "BANANA", "LETTER", "COFFEE", "BALLOON", "PEPPER", "NOON", "DADA", "MAMA", "GOOGLE", "LAGOS", "IBADAN", "ABUJA", "KANO", "TEETH", "SCHOOL"];
function wordWays(w) {
  const counts = {};
  [...w].forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
  const reps = Object.values(counts).filter((v) => v > 1);
  return { n: w.length, reps, v: fact(w.length) / reps.reduce((p, v) => p * fact(v), 1) };
}

const pcRepeat = {
  id: "pc-repeat",
  group: "pc-more",
  label: "Letters that repeat",
  blurb: "LEVEL: 5! ÷ (2! × 2!) — swapping two L's changes nothing.",
  heading: "Arrangements with repeated letters",
  hardest: true,
  instruction: () =>
    "If all the letters were different there would be n! arrangements. But swapping two letters that are the " +
    "SAME makes no new word, so each arrangement has been counted too often: divide by the factorial of how many " +
    "times each repeated letter appears. A word with no repeats is just n!.",
  cols: 2,
  defaultCount: 4,
  make(r) {
    const w = r.pick(WORDS);
    return { w, ...wordWays(w) };
  },
  render: (item) => ask(`${item.w}: &nbsp; ${box()} arrangements`),
  worked() {
    return worked(say("LEVEL has 5 letters, with 2 L's and 2 E's: 5! ÷ (2! × 2!) = 120 ÷ 4 = 30 arrangements."));
  },
  key: (item) => [want.num(item.v)],
  answer: (item) => [`${item.n}!${item.reps.length ? ` ÷ (${item.reps.map((v) => `${v}!`).join(" × ")})` : ""} = ${item.v}`],
};

/* ═══ with a condition ═════════════════════════════════════════════════════*/

const CONDITIONS = [
  (r) => { const n = r.int(4, 6); return { text: `${n} friends sit in a row, but Ada and Bola must sit next to each other. In how many ways can they sit?`, v: fact(n - 1) * 2, how: `treat the pair as one: ${n - 1}! × 2` }; },
  (r) => { const n = r.int(4, 6); return { text: `${n} friends sit in a row, but Ada and Bola must NOT sit next to each other. In how many ways can they sit?`, v: fact(n) - fact(n - 1) * 2, how: `${n}! − ${n - 1}! × 2` }; },
  (r) => { const b = r.int(4, 6), g = r.int(4, 6), x = 2, y = r.int(1, 2); return { text: `A committee of ${x} boys and ${y} girl${y > 1 ? "s" : ""} is chosen from ${b} boys and ${g} girls. In how many ways?`, v: nCr(b, x) * nCr(g, y), how: `${nCr(b, x)} × ${nCr(g, y)}` }; },
  (r) => { const n = r.int(5, 7); return { text: `${n} people sit round a round table. In how many different ways (a turn of the whole table does not count as new)?`, v: fact(n - 1), how: `(${n} − 1)!` }; },
  (r) => { const n = r.int(5, 7); return { text: `How many 3-digit numbers can be made from the digits 1 to ${n}, using none twice, that are EVEN?`, v: Math.floor(n / 2) * (n - 1) * (n - 2), how: `${Math.floor(n / 2)} choices for the last digit × ${n - 1} × ${n - 2}` }; },
];

const pcCondition = {
  id: "pc-cond",
  group: "pc-more",
  label: "With a condition",
  blurb: "Together, apart, so many of each, round a table.",
  heading: "Counting with a condition",
  hardest: true,
  minLevel: "stretch",
  instruction: () =>
    "Deal with the condition FIRST. Two who must be together: tie them into one, arrange, then untie (× 2 for " +
    "their two orders). Must be apart: all the ways, take away the together ways. So many of each kind: choose " +
    "each kind separately and multiply. Round a table: fix one person, arrange the rest — (n − 1)!. A place with " +
    "a rule (the last digit even): fill that place first.",
  cols: 1,
  defaultCount: 3,
  make: (r) => r.pick(CONDITIONS)(r),
  render: (item) => ask(`${item.text} ${box()}`),
  worked() {
    return worked(say("5 friends, two together: tie the two into one “person” — 4 things to arrange, 4! = 24 — and " +
      "the two can swap inside their tie, × 2: 48 ways."));
  },
  key: (item) => [want.num(item.v)],
  answer: (item) => [`${item.how} = ${item.v}`],
};

export const PC_EXERCISES = [pcPrinciple, pcFact, pcArrange, pcPerm, pcComb, pcWhich, pcRepeat, pcCondition];
