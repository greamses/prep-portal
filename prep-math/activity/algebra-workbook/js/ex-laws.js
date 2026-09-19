/* ============================================================================
   Algebra Workbook — CHAPTER 5: properties and identities
   ----------------------------------------------------------------------------
   Five sections:

     changing the order (commutative) · grouping (associative) · the
     distributive law · identity, inverse and zero · identities

   Every law is SEEN before it is written, and written before it is used —
   concrete, representational, abstract, the order every chapter keeps:

     concrete         dots in an array turned round; strips of paper swapped;
                      counters grouped in rings; yellow and red counters that
                      cancel; a square counted on centimetre squares
     representational an area model with the lengths written along it, from
                      which an expansion is read off, part by part
     abstract         statements to judge, brackets to expand and to take back
                      out, and the laws used as tricks for mental arithmetic

   The two things a child most often gets wrong are in the bank on purpose:
   subtraction and division do NOT commute (7 − 3 is not 3 − 7), and
   (a + b)² is NOT a² + b² — the square drawn on squares shows the two
   rectangles that go missing, and a table of values catches it again.

   Every answer is a number in a box — a coefficient, a constant — so it is
   marked exactly, and nothing depends on how a child happens to type 3x + 6.
   ========================================================================== */

import { dotsSvg, barsSvg, zeroPairsSvg, groupsSvg, areaSvg, diffSqSvg } from "./propart.js";
import { levelOf } from "./poly.js";
import { helpOf } from "./organiser.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const slot = (label, unit = "") => `<span class="wb-slot"><em>${label}</em>${box()}${unit}</span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const lead = (html) => `<p class="wb-ask wb-ask--lead">${html}</p>`;
/** An expression with boxes in it, kept on one line — a bracket split from
    its box across a line break cannot be read. */
const eq = (html) => `<p class="wb-ask ap-eq">${html}</p>`;
const art = (html) => `<div class="ab-art">${html}</div>`;
const side = (figure, words) => `<div class="ap-side">${figure}<div class="ap-lines">${words}</div></div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;
const named = (o) => helpOf(o).id !== "try";
const sign = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`);
/** A dealer: shuffled once on the first question, then gone round in order. */
function dealer() {
  let order = null;
  return (r, list, i = 0) => {
    if (i === 0 || !order || order.length !== list.length) order = r.shuffle(list.slice());
    return order[i % order.length];
  };
}
const LETTERS = ["x", "a", "n", "y", "m", "p"];

export const AP_GROUPS = [
  { id: "ap-comm", chapter: "Chapter 5 · Properties and identities", label: "Changing the order", blurb: "3 × 5 is 5 × 3, and 3 + 5 is 5 + 3 — but 7 − 3 is not 3 − 7." },
  { id: "ap-assoc", label: "Grouping", blurb: "Where the brackets go in a sum or a product does not change the answer." },
  { id: "ap-dist", label: "The distributive law", blurb: "3(x + 2) is 3x + 6: the number outside multiplies everything inside." },
  { id: "ap-special", label: "Identity, inverse and zero", blurb: "Adding 0 and multiplying by 1 change nothing; a number and its opposite make 0." },
  { id: "ap-ident", label: "Identities", blurb: "(a + b)², (a − b)², a² − b² and (x + a)(x + b), from squares and rectangles." },
];

/* ═══ 1. changing the order ════════════════════════════════════════════════*/

const apCommDots = {
  id: "ap-comm-dots",
  group: "ap-comm",
  label: "Turn the dots round",
  blurb: "3 rows of 5 turned round is 5 rows of 3 — the same dots.",
  heading: "Count both ways",
  instruction: () =>
    "The second array is the first one turned round: the same dots. Count each one by rows × " +
    "columns. The order of a multiplication does not change the answer.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const hi = { gentle: 5, middle: 7, stretch: 9 }[tier(o)] || 5;
    let a; let b;
    do { a = r.int(2, hi); b = r.int(2, hi); } while (a === b);
    return { a, b };
  },
  render(item) {
    const { a, b } = item;
    return side(art(dotsSvg(a, b)) + art(dotsSvg(b, a)),
      ask(`${a} × ${b} = ${box()}`) + ask(`${b} × ${a} = ${box()}`) + tick("the same", "different"));
  },
  worked() {
    return worked(side(art(dotsSvg(3, 5)) + art(dotsSvg(5, 3)),
      say("3 rows of 5 is 15 dots. Turn the page on its side: now it is 5 rows of 3 — still 15, " +
        "because it is the same dots. So 3 × 5 = 5 × 3. That is the <b>commutative law</b>: a × b = b × a.")));
  },
  key(item) {
    return [want.num(item.a * item.b), want.num(item.a * item.b), want.tick(0)];
  },
  answer(item) {
    return [`${item.a} × ${item.b} = ${item.b} × ${item.a} = ${item.a * item.b}`];
  },
};

const apCommBars = {
  id: "ap-comm-bars",
  group: "ap-comm",
  label: "Swap the strips",
  blurb: "3 then 5 is as long as 5 then 3.",
  heading: "Add both ways",
  instruction: () =>
    "The two strips are the same pieces laid in the other order. Add each one. The order of an " +
    "addition does not change the answer.",
  cols: 2,
  defaultCount: 2,
  make(r, o) {
    const hi = { gentle: 8, middle: 12, stretch: 14 }[tier(o)] || 8;
    let a; let b;
    do { a = r.int(2, hi); b = r.int(2, hi); } while (a === b);
    return { a, b };
  },
  render(item) {
    const { a, b } = item;
    const mm = Math.min(5, 64 / (a + b));
    return art(barsSvg([[a, b], [b, a]], { mm })) + ask(`${a} + ${b} = ${box()}`) + ask(`${b} + ${a} = ${box()}`) + tick("the same length", "different");
  },
  key(item) {
    return [want.num(item.a + item.b), want.num(item.a + item.b), want.tick(0)];
  },
  answer(item) {
    return [`${item.a} + ${item.b} = ${item.b} + ${item.a} = ${item.a + item.b}`];
  },
};

const ORDER_FORMS = ["+", "×", "−", "÷"];
const dealOrder = dealer();

const apCommTrue = {
  id: "ap-comm-true",
  group: "ap-comm",
  label: "Which ones can be swapped?",
  blurb: "Adding and multiplying: yes. Taking away and dividing: no.",
  heading: "True or false?",
  instruction: () =>
    "Work out each side. Swapping the order works for + and ×. Try it for − and ÷ and see what happens.",
  cols: 2,
  defaultCount: 8,
  make(r, o, k, i) {
    const op = dealOrder(r, ORDER_FORMS, i);
    const hi = { gentle: 9, middle: 15, stretch: 25 }[tier(o)] || 9;
    let a; let b;
    do { a = r.int(2, hi); b = r.int(2, hi); } while (a === b);
    if (op === "÷") { a = b * r.int(2, 5); }
    const letters = tier(o) === "stretch" && i % 3 === 2;
    return { op, a, b, letters };
  },
  render(item) {
    const { op, a, b, letters } = item;
    const [p, q] = letters ? ["a", "b"] : [a, b];
    const stmt = `${p} ${op} ${q} = ${q} ${op} ${p}`;
    return lead(letters ? `${stmt}, for every number a and b` : stmt) + tick("true", "false");
  },
  key(item) {
    return [want.tick(item.op === "+" || item.op === "×" ? 0 : 1)];
  },
  answer(item) {
    const { op, a, b } = item;
    if (op === "+" || op === "×") return ["true — the commutative law"];
    return [op === "−" ? `false: ${a} − ${b} = ${a - b}, ${b} − ${a} = ${b - a}` : `false: ${a} ÷ ${b} = ${a / b}, but ${b} ÷ ${a} is less than 1`];
  },
};

/* ═══ 2. grouping ══════════════════════════════════════════════════════════*/

const apAssocGroups = {
  id: "ap-assoc-groups",
  group: "ap-assoc",
  label: "Ring them two ways",
  blurb: "(2 + 3) + 4 and 2 + (3 + 4): the same counters, grouped differently.",
  heading: "Group the counters two ways",
  instruction: () =>
    "The ring shows which two are added first. Work out each way. The grouping of an addition " +
    "does not change the answer.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const hi = { gentle: 4, middle: 5, stretch: 6 }[tier(o)] || 4;
    return { a: r.int(1, hi), b: r.int(1, hi), c: r.int(1, hi) };
  },
  render(item) {
    const { a, b, c } = item;
    return art(groupsSvg([[a, b], c])) + ask(`(${a} + ${b}) + ${c} = ${box()} + ${c} = ${box()}`) +
      art(groupsSvg([a, [b, c]])) + ask(`${a} + (${b} + ${c}) = ${a} + ${box()} = ${box()}`);
  },
  worked() {
    return worked(say("(2 + 3) + 4: first 2 + 3 = 5, then 5 + 4 = 9. 2 + (3 + 4): first 3 + 4 = 7, then " +
      "2 + 7 = 9. The same. That is the <b>associative law</b>: (a + b) + c = a + (b + c), and the same for ×."));
  },
  key(item) {
    const { a, b, c } = item;
    return [want.num(a + b), want.num(a + b + c), want.num(b + c), want.num(a + b + c)];
  },
  answer(item) {
    const { a, b, c } = item;
    return [`${a + b} + ${c} = ${a} + ${b + c} = ${a + b + c}`];
  },
};

/* Friendly pairs: numbers that make a round total, hidden in a longer sum. */
const SMART = [
  (r) => { const p = r.pick([[25, 75], [36, 64], [18, 82], [45, 55], [27, 73]]); const x = r.int(11, 39); return { text: `${x} + ${p[0]} + ${p[1]}`, steps: [["the friendly pair", p[0] + p[1]]], v: x + p[0] + p[1] }; },
  (r) => { const x = r.int(7, 19); return { text: `25 × ${x} × 4`, steps: [["25 × 4", 100]], v: 100 * x }; },
  (r) => { const x = r.int(11, 29); return { text: `5 × ${x} × 2`, steps: [["5 × 2", 10]], v: 10 * x }; },
  (r) => { const x = r.int(3, 9); return { text: `50 × ${x} × 2`, steps: [["50 × 2", 100]], v: 100 * x }; },
  (r) => { const p = r.pick([[199, 1], [298, 2], [497, 3]]); const x = r.int(24, 88); return { text: `${p[0]} + ${x} + ${p[1]}`, steps: [["the friendly pair", p[0] + p[1]]], v: p[0] + p[1] + x }; },
];
const dealSmart = dealer();

const apAssocSmart = {
  id: "ap-assoc-smart",
  group: "ap-assoc",
  label: "Group it the easy way",
  blurb: "25 × 7 × 4: do 25 × 4 first. The laws let you choose.",
  heading: "Work it out in your head",
  instruction: () =>
    "You may swap the order and move the brackets, so look for two numbers that make a round " +
    "number together, and do those first.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    return dealSmart(r, SMART, i)(r, o);
  },
  render(item) {
    return lead(item.text) + item.steps.map(([l]) => ask(slot(l))).join("") + ask(slot("Answer"));
  },
  worked() {
    return worked(say("25 × 13 × 4: swap to 25 × 4 × 13. 25 × 4 = 100, and 100 × 13 = <b>1300</b> — no long multiplication."));
  },
  key(item) {
    return [...item.steps.map(([, v]) => want.num(v)), want.num(item.v)];
  },
  answer(item) {
    return [`${item.steps.map(([l, v]) => `${l} = ${v}`).join("; ")}; ${item.text} = ${item.v}`];
  },
};

/* ═══ 3. the distributive law ══════════════════════════════════════════════*/

const apDistDots = {
  id: "ap-dist-dots",
  group: "ap-dist",
  label: "Cut the array in two",
  blurb: "3 × (4 + 2): three rows of 4, and three rows of 2.",
  heading: "Split the array",
  instruction: () =>
    "The dashed line cuts each row into two parts. Count each part, add them, and check against " +
    "the whole array.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    return { k: r.int(2, t === "gentle" ? 4 : 6), a: r.int(2, t === "gentle" ? 5 : 7), b: r.int(1, t === "gentle" ? 3 : 5) };
  },
  render(item) {
    const { k, a, b } = item;
    return side(art(dotsSvg(k, a + b, { split: a })),
      ask(`${k} × ${a} = ${box()}`) + ask(`${k} × ${b} = ${box()}`) + ask(`together ${box()}`) + ask(`${k} × (${a} + ${b}) = ${k} × ${a + b} = ${box()}`));
  },
  worked() {
    return worked(side(art(dotsSvg(3, 6, { split: 4 })),
      say("3 × 4 = 12 on the left, 3 × 2 = 6 on the right: together 18. And 3 × (4 + 2) = 3 × 6 = 18. " +
        "The 3 multiplies <b>both</b> parts: a(b + c) = ab + ac. That is the <b>distributive law</b>.")));
  },
  key(item) {
    const { k, a, b } = item;
    return [want.num(k * a), want.num(k * b), want.num(k * (a + b)), want.num(k * (a + b))];
  },
  answer(item) {
    const { k, a, b } = item;
    return [`${k * a} + ${k * b} = ${k * (a + b)}`];
  },
};

const apDistArea = {
  id: "ap-dist-area",
  group: "ap-dist",
  label: "The area model",
  blurb: "A rectangle k by (x + b): its two parts are kx and kb.",
  heading: "Find each part, then write the expansion",
  instruction: () =>
    "The rectangle is the side number times the top. Each part is its side times its top. Add " +
    "the parts: that is the bracket multiplied out.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const t = tier(o);
    const letter = t === "gentle" ? "x" : LETTERS[i % LETTERS.length];
    const xOut = t === "stretch" && i % 2 === 1;
    return { k: r.int(2, t === "gentle" ? 5 : 9), b: r.int(1, t === "gentle" ? 6 : 9), letter, xOut };
  },
  render(item, o) {
    const { k, b, letter, xOut } = item;
    const sideLen = xOut ? { v: "x", label: letter } : { v: k };
    const fig = areaSvg({ top: [{ v: "x", label: letter }, { v: b }], side: [sideLen], inside: named(o) ? [["?", "?"]] : null, mm: 4 });
    const left = xOut ? `${letter}(${letter} + ${b})` : `${k}(${letter} + ${b})`;
    const right = xOut ? `${letter}² + ${box()}${letter}` : `${box()}${letter} + ${box()}`;
    return side(art(fig), eq(`${left} = ${right}`));
  },
  worked() {
    return worked(side(art(areaSvg({ top: [{ v: "x" }, { v: 2 }], side: [{ v: 3 }], inside: [["3x", "6"]], mm: 4 })),
      say("The left part is 3 by x: <b>3x</b>. The right part is 3 by 2: <b>6</b>. So 3(x + 2) = 3x + 6.")));
  },
  key(item) {
    return item.xOut ? [want.num(item.b)] : [want.num(item.k), want.num(item.k * item.b)];
  },
  answer(item) {
    const { k, b, letter, xOut } = item;
    return [xOut ? `${letter}(${letter} + ${b}) = ${letter}² + ${b}${letter}` : `${k}(${letter} + ${b}) = ${k}${letter} + ${k * b}`];
  },
};

const apDistExpand = {
  id: "ap-dist-expand",
  group: "ap-dist",
  label: "Multiply out the bracket",
  blurb: "Everything inside is multiplied — the minus signs too.",
  heading: "Expand",
  instruction: (o) =>
    "Multiply every term inside the bracket by the number outside." +
    (tier(o) === "gentle" ? "" : " Watch the signs: a minus inside stays a minus; a minus outside turns every sign over."),
  cols: 2,
  defaultCount: 8,
  make(r, o, k, i) {
    const t = tier(o);
    const letter = LETTERS[i % (t === "gentle" ? 1 : LETTERS.length)];
    const kk = r.int(2, t === "gentle" ? 6 : 9) * (t === "stretch" && i % 3 === 2 ? -1 : 1);
    const b = r.int(1, 9) * (t !== "gentle" && i % 2 === 1 ? -1 : 1);
    return { k: kk, b, letter };
  },
  render(item) {
    const { k, b, letter } = item;
    const outside = k < 0 ? `−${-k}` : `${k}`;
    return eq(`${outside}(${letter} ${sign(b)}) = ${box()}${letter} + ${box()}`);
  },
  worked(o) {
    return worked(say(tier(o) === "gentle"
      ? "4(x + 3): 4 × x = 4x and 4 × 3 = 12, so <b>4x + 12</b>."
      : "−2(x − 5): −2 × x = −2x, and −2 × −5 = +10, so <b>−2x + 10</b>. The boxes hold −2 and 10."));
  },
  key(item) {
    return [want.num(item.k), want.num(item.k * item.b)];
  },
  answer(item) {
    const { k, b, letter } = item;
    return [`${k}${letter} ${sign(k * b)}`];
  },
};

const apDistFactor = {
  id: "ap-dist-factor",
  group: "ap-dist",
  label: "Take it back out",
  blurb: "6x + 9 = 3(2x + 3): the distributive law run backwards.",
  heading: "Factorise",
  instruction: () =>
    "Find the biggest number that divides BOTH terms. It goes outside the bracket; what each term " +
    "becomes when you divide by it goes inside.",
  cols: 1,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const gcd = (x, y) => (y ? gcd(y, x % y) : x);
    let k; let a; let b;
    do {
      k = r.int(2, t === "gentle" ? 5 : 9);
      a = r.int(1, t === "gentle" ? 4 : 7);
      b = r.int(1, 9);
    } while (gcd(a, b) !== 1);
    return { k, a, b };
  },
  render(item) {
    const { k, a, b } = item;
    return eq(`${k * a === 1 ? "" : k * a}x + ${k * b} = ${box()}(${box()}x + ${box()})`);
  },
  worked() {
    return worked(say("12x + 18: 6 divides both (12 ÷ 6 = 2, 18 ÷ 6 = 3), and nothing bigger does. So 12x + 18 = <b>6(2x + 3)</b>. Check by multiplying out."));
  },
  key(item) {
    return [want.num(item.k), want.num(item.a), want.num(item.b)];
  },
  answer(item) {
    const { k, a, b } = item;
    return [`${k}(${a === 1 ? "" : a}x + ${b})`];
  },
};

const MENTAL = [
  (r) => { const n = r.int(3, 9); const d = r.int(1, 4); return { text: `${n} × ${100 - d}`, ask: [`${n} × 100`, `${n} × ${d}`], v: [n * 100, n * d, n * (100 - d)], how: `${n} × 100 − ${n} × ${d}` }; },
  (r) => { const n = r.int(3, 9); const d = r.int(1, 4); return { text: `${n} × ${100 + d}`, ask: [`${n} × 100`, `${n} × ${d}`], v: [n * 100, n * d, n * (100 + d)], how: `${n} × 100 + ${n} × ${d}` }; },
  (r) => { const n = r.int(4, 9); const d = r.int(1, 2); return { text: `${n} × ${50 - d}`, ask: [`${n} × 50`, `${n} × ${d}`], v: [n * 50, n * d, n * (50 - d)], how: `${n} × 50 − ${n} × ${d}` }; },
  (r) => { const n = r.int(12, 19); const m = r.int(3, 9); return { text: `${m} × ${n}`, ask: [`${m} × 10`, `${m} × ${n - 10}`], v: [m * 10, m * (n - 10), m * n], how: `${m} × 10 + ${m} × ${n - 10}` }; },
];
const dealMental = dealer();

const apDistMental = {
  id: "ap-dist-mental",
  group: "ap-dist",
  label: "Multiply in your head",
  blurb: "7 × 98 = 7 × 100 − 7 × 2.",
  heading: "Use the distributive law",
  instruction: () =>
    "Split the awkward number into a round one and a small one, multiply each, and add (or take away).",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    return dealMental(r, MENTAL, i)(r);
  },
  render(item) {
    return lead(item.text) + ask(slot(item.ask[0])) + ask(slot(item.ask[1])) + ask(slot("Answer"));
  },
  worked() {
    return worked(say("7 × 98 = 7 × (100 − 2) = 700 − 14 = <b>686</b>."));
  },
  key(item) {
    return item.v.map((v) => want.num(v));
  },
  answer(item) {
    return [`${item.how} = ${item.v[2]}`];
  },
};

/* ═══ 4. identity, inverse and zero ════════════════════════════════════════*/

const apZeroPairs = {
  id: "ap-zero-pairs",
  group: "ap-special",
  label: "Zero pairs",
  blurb: "A +1 and a −1 together make 0: a number and its opposite cancel.",
  heading: "Cancel the zero pairs",
  instruction: () =>
    "A yellow counter is +1, a red one is −1. A yellow and a red together are a ZERO PAIR: they " +
    "make 0. Ring the pairs, then see what is left.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const hi = { gentle: 6, middle: 9, stretch: 12 }[tier(o)] || 6;
    let p; let q;
    do { p = r.int(1, hi); q = r.int(1, hi); } while (p === q && r.chance(0.6));
    /* Gentle is adding only: more yellows than reds, so what is left is positive */
    if (tier(o) === "gentle" && q > p) [p, q] = [q, p];
    return { p, q };
  },
  render(item) {
    return art(zeroPairsSvg(item.p, item.q)) + ask(slot("Zero pairs")) + ask(`${item.p} + (−${item.q}) = ${box()}`);
  },
  worked() {
    return worked(side(art(zeroPairsSvg(5, 3)),
      say("Three yellows pair off with the three reds: 3 zero pairs, worth 0. Two yellows are left, so " +
        "5 + (−3) = <b>2</b>. When they all pair off — 4 + (−4) — nothing is left: a + (−a) = 0, the <b>additive inverse</b>.")));
  },
  key(item) {
    return [want.num(Math.min(item.p, item.q)), want.num(item.p - item.q)];
  },
  answer(item) {
    return [`${Math.min(item.p, item.q)} zero pairs; ${item.p} + (−${item.q}) = ${item.p - item.q}`];
  },
};

const FILLS = [
  { name: "additive identity", make: (a) => ({ text: `${a} + ${box()} = ${a}`, v: [0] }) },
  { name: "multiplicative identity", make: (a) => ({ text: `${a} × ${box()} = ${a}`, v: [1] }) },
  { name: "additive inverse", make: (a) => ({ text: `${a} + ${box()} = 0`, v: [-a] }) },
  { name: "zero property", make: (a) => ({ text: `${a} × ${box()} = 0`, v: [0] }) },
  { name: "multiplicative inverse", make: (a) => ({ text: `${a} × ${box()} = 1`, frac: a }) },
];
const dealFill = dealer();

const apSpecialFill = {
  id: "ap-special-fill",
  group: "ap-special",
  label: "What number goes in the box?",
  blurb: "a + 0 = a, a × 1 = a, a + (−a) = 0, a × 0 = 0, a × 1/a = 1.",
  heading: "Find the missing number",
  instruction: (o) =>
    "Five special facts: adding 0 changes nothing; multiplying by 1 changes nothing; a number plus " +
    "its opposite is 0; anything times 0 is 0" + (tier(o) === "gentle" ? "." : "; a number times its reciprocal (1 over it) is 1 — write it as a fraction like 1/4."),
  cols: 2,
  defaultCount: 8,
  make(r, o, k, i) {
    const list = tier(o) === "gentle" ? FILLS.slice(0, 4) : FILLS;
    const f = dealFill(r, list, i);
    return { name: f.name, a: r.int(2, { gentle: 20, middle: 50, stretch: 99 }[tier(o)] || 20) };
  },
  render(item) {
    return ask(FILLS.find((f) => f.name === item.name).make(item.a).text);
  },
  key(item) {
    const f = FILLS.find((x) => x.name === item.name).make(item.a);
    if (f.frac) return [want.text(`1/${f.frac}`, ...(Number.isInteger(1000 / f.frac) ? [String(1 / f.frac)] : []))];
    return [want.num(f.v[0])];
  },
  answer(item) {
    const f = FILLS.find((x) => x.name === item.name).make(item.a);
    return [`${f.frac ? `1/${f.frac}` : f.v[0]} — the ${item.name}`];
  },
};

const LAWS = ["commutative", "associative", "distributive", "identity", "inverse", "zero property"];
const STATEMENTS = {
  commutative: [(a, b) => `${a} + ${b} = ${b} + ${a}`, (a, b) => `${a} × ${b} = ${b} × ${a}`, () => "xy = yx"],
  associative: [(a, b, c) => `(${a} + ${b}) + ${c} = ${a} + (${b} + ${c})`, (a, b, c) => `(${a} × ${b}) × ${c} = ${a} × (${b} × ${c})`, () => "(xy)z = x(yz)"],
  distributive: [(a, b, c) => `${a}(${b} + ${c}) = ${a} × ${b} + ${a} × ${c}`, () => "a(b − c) = ab − ac", (a) => `${a}(x + 1) = ${a}x + ${a}`],
  identity: [(a) => `${a} + 0 = ${a}`, (a) => `${a} × 1 = ${a}`, () => "x × 1 = x"],
  inverse: [(a) => `${a} + (−${a}) = 0`, (a) => `${a} × 1/${a} = 1`, () => "y + (−y) = 0"],
  "zero property": [(a) => `${a} × 0 = 0`, () => "0 × x = 0", (a, b) => `${a} × ${b} × 0 = 0`],
};
const dealLaw = dealer();

const apName = {
  id: "ap-name",
  group: "ap-special",
  label: "Name the property",
  blurb: "Every statement is one of the laws: which one?",
  heading: "Which property does it show?",
  instruction: () =>
    "Commutative: the order changes. Associative: the brackets move. Distributive: a number " +
    "multiplies into a bracket. Identity: 0 added or 1 multiplied, and nothing changes. Inverse: " +
    "a number undone by its opposite. Zero property: times 0 is 0.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const law = dealLaw(r, LAWS, i);
    const forms = STATEMENTS[law];
    const form = tier(o) === "gentle" ? forms[r.int(0, 1)] : r.pick(forms);
    const [a, b, c] = [r.int(2, 9), r.int(2, 9), r.int(2, 9)];
    const opts = r.shuffle([law, ...r.shuffle(LAWS.filter((l) => l !== law)).slice(0, 3)]);
    return { law, text: form(a, b, c), opts };
  },
  render(item) {
    return lead(item.text) + tick(...item.opts);
  },
  key(item) {
    return [want.tick(item.opts.indexOf(item.law))];
  },
  answer(item) {
    return [item.law];
  },
};

/* ═══ 5. identities ════════════════════════════════════════════════════════*/

const apSqGrid = {
  id: "ap-sq-grid",
  group: "ap-ident",
  label: "(a + b)² on squares",
  blurb: "A square of side a + b is a², two ab rectangles and b² — not just a² + b².",
  heading: "Count the parts of the big square",
  instruction: () =>
    "The square's side is cut into two lengths. Count the little squares in each of the four parts, " +
    "then in the whole square. Notice the two rectangles: they are the part people forget.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    let a; let b;
    do { a = r.int(2, t === "gentle" ? 4 : 5); b = r.int(1, 3); } while (a === b);
    return { a, b };
  },
  render(item) {
    const { a, b } = item;
    const fig = areaSvg({ top: [{ v: a }, { v: b }], side: [{ v: a }, { v: b }], grid: true });
    return side(art(fig),
      ask(`${a} × ${a} = ${box()}`) + ask(`${a} × ${b} = ${box()} and ${b} × ${a} = ${box()}`) + ask(`${b} × ${b} = ${box()}`) +
      ask(`altogether ${box()}`) + ask(`(${a} + ${b})² = ${a + b}² = ${box()}`));
  },
  worked() {
    return worked(side(art(areaSvg({ top: [{ v: 3 }, { v: 2 }], side: [{ v: 3 }, { v: 2 }], grid: true, inside: [["9", "6"], ["6", "4"]] })),
      say("9 + 6 + 6 + 4 = 25, and 5² = 25. So (a + b)² = a² + 2ab + b². Leaving out the two " +
        "rectangles — writing 3² + 2² = 13 — is the commonest mistake in algebra.")));
  },
  key(item) {
    const { a, b } = item;
    return [want.num(a * a), want.num(a * b), want.num(a * b), want.num(b * b), want.num((a + b) ** 2), want.num((a + b) ** 2)];
  },
  answer(item) {
    const { a, b } = item;
    return [`${a * a} + ${a * b} + ${a * b} + ${b * b} = ${(a + b) ** 2}`];
  },
};

const apSqExpand = {
  id: "ap-sq-expand",
  group: "ap-ident",
  label: "(x + b)² and (x − b)²",
  blurb: "x² + 2bx + b², and x² − 2bx + b²: square the first, twice the product, square the last.",
  heading: "Expand the square",
  instruction: (o) =>
    "(x + b)² = x² + 2bx + b². " + (tier(o) === "gentle" ? "Use the picture: the two rectangles are both bx." :
      "For (x − b)² the middle term is taken away: x² − 2bx + b² — the last term is still added."),
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const t = tier(o);
    const minus = t !== "gentle" && i % 2 === 1;
    return { b: r.int(1, t === "gentle" ? 5 : 9), minus, pic: t !== "stretch" && !minus };
  },
  render(item) {
    const { b, minus, pic } = item;
    const q = `(x ${minus ? "−" : "+"} ${b})² = x² ${minus ? "−" : "+"} ${box()}x + ${box()}`;
    if (!pic) return eq(q);
    const fig = areaSvg({ top: [{ v: "x" }, { v: b }], side: [{ v: "x" }, { v: b }], mm: 3.4 });
    return side(art(fig), eq(q));
  },
  key(item) {
    return [want.num(2 * item.b), want.num(item.b * item.b)];
  },
  answer(item) {
    const { b, minus } = item;
    return [`x² ${minus ? "−" : "+"} ${2 * b}x + ${b * b}`];
  },
};

const apProd = {
  id: "ap-prod",
  group: "ap-ident",
  label: "(x + a)(x + b)",
  blurb: "x² + (a + b)x + ab: the middle is the two numbers added, the end is them multiplied.",
  heading: "Multiply the two brackets",
  instruction: (o) =>
    "The rectangle is (x + a) by (x + b). Its four parts are x², ax, bx and ab. Collect the x " +
    "terms." + (tier(o) === "stretch" ? " With a minus sign, the part is taken away: the numbers can be negative." : ""),
  cols: 1,
  defaultCount: 6,
  make(r, o, k, i) {
    const t = tier(o);
    let a; let b;
    do {
      a = r.int(1, t === "gentle" ? 5 : 9);
      b = r.int(1, t === "gentle" ? 5 : 9) * (t === "stretch" && i % 2 === 1 ? -1 : 1);
    } while (a === Math.abs(b));
    return { a, b, pic: t !== "stretch" };
  },
  render(item, o) {
    const { a, b, pic } = item;
    const q = `(x + ${a})(x ${sign(b)}) = x² + ${box()}x + ${box()}`;
    if (!pic) return eq(q);
    const fig = areaSvg({ top: [{ v: "x" }, { v: b }], side: [{ v: "x" }, { v: a }], inside: named(o) ? [["x²", `${b}x`], [`${a}x`, "?"]] : null, mm: 3.4 });
    return side(art(fig), eq(q));
  },
  worked() {
    return worked(side(art(areaSvg({ top: [{ v: "x" }, { v: 3 }], side: [{ v: "x" }, { v: 2 }], inside: [["x²", "3x"], ["2x", "6"]], mm: 3.4 })),
      say("(x + 2)(x + 3): the parts are x², 3x, 2x and 6. The x terms together: 2x + 3x = 5x. So " +
        "<b>x² + 5x + 6</b> — 5 is 2 + 3, and 6 is 2 × 3.")));
  },
  key(item) {
    return [want.num(item.a + item.b), want.num(item.a * item.b)];
  },
  answer(item) {
    const { a, b } = item;
    return [`x² ${sign(a + b)}x ${sign(a * b)}`];
  },
};

const apDiffSq = {
  id: "ap-diff-sq",
  group: "ap-ident",
  label: "a² − b²: cut and move",
  blurb: "Cut a small square from a big one; the rest rearranges into (a + b) by (a − b).",
  heading: "The difference of two squares",
  instruction: () =>
    "Take a b-by-b square off the corner of an a-by-a square. The two pieces left slide together " +
    "into one rectangle, (a + b) long and (a − b) wide. Work out both ways.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    let a; let b;
    do { a = r.int(4, t === "gentle" ? 7 : 9); b = r.int(1, a - 2); } while (a - b < 2);
    return { a, b };
  },
  render(item) {
    const { a, b } = item;
    return art(diffSqSvg(a, b, { mm: Math.min(4, 34 / a) })) +
      ask(`${a}² − ${b}² = ${box()} − ${box()} = ${box()}`) +
      ask(`(${a} + ${b}) × (${a} − ${b}) = ${box()} × ${box()} = ${box()}`);
  },
  worked() {
    return worked(say("7² − 3² = 49 − 9 = 40. And (7 + 3)(7 − 3) = 10 × 4 = 40. Always: <b>a² − b² = (a + b)(a − b)</b>."));
  },
  key(item) {
    const { a, b } = item;
    return [want.num(a * a), want.num(b * b), want.num(a * a - b * b), want.num(a + b), want.num(a - b), want.num(a * a - b * b)];
  },
  answer(item) {
    const { a, b } = item;
    return [`${a * a} − ${b * b} = ${a + b} × ${a - b} = ${a * a - b * b}`];
  },
};

const TRICKS = [
  (r) => { const n = r.pick([20, 30, 40, 50, 60, 70]); const d = r.int(1, 3); const x = n + d; return { text: `${x}²`, ask: [`${n}²`, `2 × ${n} × ${d}`, `${d}²`], v: [n * n, 2 * n * d, d * d, x * x], how: `(${n} + ${d})²` }; },
  (r) => { const n = r.pick([30, 40, 50, 60, 70, 80, 100]); const d = r.int(1, 2); const x = n - d; return { text: `${x}²`, ask: [`${n}²`, `2 × ${n} × ${d}`, `${d}²`], v: [n * n, 2 * n * d, d * d, x * x], how: `(${n} − ${d})² = ${n}² − 2 × ${n} × ${d} + ${d}²` }; },
  (r) => { const n = r.pick([20, 30, 40, 50, 60, 100]); const d = r.int(1, 3); return { text: `${n + d} × ${n - d}`, ask: [`${n}²`, `${d}²`], v: [n * n, d * d, n * n - d * d], how: `${n}² − ${d}²` }; },
];
const dealTrick = dealer();

const apIdentMental = {
  id: "ap-ident-mental",
  group: "ap-ident",
  label: "Squares in your head",
  blurb: "51² = 2500 + 100 + 1. 41 × 39 = 40² − 1².",
  heading: "Use an identity",
  instruction: () =>
    "Write the number as a round number and a small one. For a square use (a + b)² = a² + 2ab + b² " +
    "(or the minus one); for two numbers either side of a round one use (a + b)(a − b) = a² − b².",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const list = tier(o) === "gentle" ? [TRICKS[0], TRICKS[2]] : TRICKS;
    return dealTrick(r, list, i)(r);
  },
  render(item) {
    return lead(item.text) + item.ask.map((a) => ask(slot(a))).join("") + ask(slot("Answer"));
  },
  worked() {
    return worked(say("52² = (50 + 2)²: 50² = 2500, 2 × 50 × 2 = 200, 2² = 4, so <b>2704</b>. " +
      "43 × 37 = (40 + 3)(40 − 3) = 40² − 3² = 1600 − 9 = <b>1591</b>."));
  },
  key(item) {
    return item.v.map((v) => want.num(v));
  },
  answer(item) {
    return [`${item.how} = ${item.v[item.v.length - 1]}`];
  },
};

let checkFlip = 0;
const apIdentCheck = {
  id: "ap-ident-check",
  group: "ap-ident",
  label: "True for every x?",
  blurb: "An identity is true whatever x is. Try some values and see which one is.",
  heading: "Which is an identity?",
  instruction: () =>
    "Put each value of x into all three columns. An IDENTITY gives the same answer as (x + b)² every " +
    "time; an equation that is only sometimes true is not one.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    if (i === 0) checkFlip = r.int(0, 1);
    const b = r.int(1, tier(o) === "gentle" ? 3 : 5);
    const xs = tier(o) === "stretch" ? [0, 1, 2, -1] : [1, 2, 3];
    return { b, xs, rightFirst: (i + checkFlip) % 2 === 0 };
  },
  render(item) {
    const { b, xs, rightFirst } = item;
    const good = `x² + ${2 * b}x + ${b * b}`;
    const bad = `x² + ${b * b}`;
    const [c1, c2] = rightFirst ? [good, bad] : [bad, good];
    const rows = xs.map((x) => `<tr><td>${x}</td><td class="wb-cell"></td><td class="wb-cell"></td><td class="wb-cell"></td></tr>`).join("");
    return `<table class="ap-table"><thead><tr><th>x</th><th>(x + ${b})²</th><th>${c1}</th><th>${c2}</th></tr></thead><tbody>${rows}</tbody></table>` +
      ask("The identity is") + tick(c1, c2);
  },
  key(item) {
    const { b, xs, rightFirst } = item;
    const out = [];
    xs.forEach((x) => {
      const good = x * x + 2 * b * x + b * b;
      const bad = x * x + b * b;
      out.push(want.num((x + b) ** 2), want.num(rightFirst ? good : bad), want.num(rightFirst ? bad : good));
    });
    out.push(want.tick(rightFirst ? 0 : 1));
    return out;
  },
  answer(item) {
    const { b } = item;
    return [`x² + ${2 * b}x + ${b * b} matches (x + ${b})² for every x; x² + ${b * b} does not`];
  },
};

const FACTORS = ["diff", "square", "pair"];
const dealFactor = dealer();

const apFactor = {
  id: "ap-factor",
  group: "ap-ident",
  label: "Factorise with an identity",
  blurb: "x² − 9 = (x + 3)(x − 3); x² + 6x + 9 = (x + 3)²; x² + 5x + 6 = (x + 2)(x + 3).",
  heading: "Factorise",
  hardest: true,
  instruction: () =>
    "Run an identity backwards. Two squares taken away: (x + b)(x − b). A perfect square: (x + b)². " +
    "Otherwise find two numbers that multiply to the last number and add to the middle one.",
  cols: 1,
  defaultCount: 6,
  make(r, o, k, i) {
    const form = dealFactor(r, FACTORS, i);
    const b = r.int(2, 9);
    let c = r.int(1, 7);
    while (c === b) c = r.int(1, 7);
    return { form, b, c };
  },
  render(item) {
    const { form, b, c } = item;
    if (form === "diff") return eq(`x² − ${b * b} = (x + ${box()})(x − ${box()})`);
    if (form === "square") return eq(`x² + ${2 * b}x + ${b * b} = (x + ${box()})²`);
    return eq(`x² + ${b + c}x + ${b * c} = (x + ${box()})(x + ${box()})`);
  },
  key(item) {
    const { form, b, c } = item;
    if (form === "diff") return [want.num(b), want.num(b)];
    if (form === "square") return [want.num(b)];
    return [want.set(b, c)];
  },
  answer(item) {
    const { form, b, c } = item;
    if (form === "diff") return [`(x + ${b})(x − ${b})`];
    if (form === "square") return [`(x + ${b})²`];
    return [`(x + ${b})(x + ${c})`];
  },
};

export const AP_EXERCISES = [
  apCommDots, apCommBars, apCommTrue,
  apAssocGroups, apAssocSmart,
  apDistDots, apDistArea, apDistExpand, apDistFactor, apDistMental,
  apZeroPairs, apSpecialFill, apName,
  apSqGrid, apSqExpand, apProd, apDiffSq, apIdentMental, apIdentCheck, apFactor,
];
