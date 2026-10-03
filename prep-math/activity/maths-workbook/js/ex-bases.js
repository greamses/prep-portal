/* ============================================================================
   Maths Workbook — CHAPTER 10: NUMBER BASES
   ----------------------------------------------------------------------------
   Base ten groups in tens: ones, tens, hundreds. Base b groups in b's: ones,
   b's, b²'s … and uses only the digits 0 to b − 1. (Chapter 1's blocks can be
   set to a base too; this chapter does the arithmetic of it.)

     place values          the columns of base b: 1, b, b², b³
     to base ten           each digit × its column's value, added
     from base ten         divide by b again and again; the remainders, read
                           from the BOTTOM up, are the digits
     adding                column by column; a column that reaches b carries 1
     taking away           (Middle+) a column too small borrows ONE b, not ten
     base to base          (Stretch) through base ten: there, then back out

   BITS AND BULBS — a breadboard of LEDs to tap on screen, colour on paper:
     read the bulbs        lit worths added up
     light a number        the biggest worth that fits, then the next
     octal in threes       (Middle+) one octal digit is exactly three bulbs
     read octal            (Middle+) each three bulbs is one digit

   A number in base b is written with a small b after it: 1011₂. Answers in a
   base are typed as their digits.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { levelOf } from "./ex-remainder.js";
import { bitsHtml } from "/utils/components/workbook/bits.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const tier = (o) => levelOf(o).id;

const SUB = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n) => String(n).split("").map((d) => SUB[d]).join("");
/** n written in base b, as its digits. */
export const inBase = (n, b) => n.toString(b);
/** n in base b with its little base: 1011₂ (base ten gets ₁₀). */
const shown = (n, b) => `<span class="nb-n" data-tex="${inBase(n, b)}_{${b}}">${inBase(n, b)}${sub(b)}</span>`;
/** The little base on its own, after an answer box: ▢₁₀. */
const baseOf = (b) => `<span data-tex="{}_{${b}}">${sub(b)}</span>`;

/** The bases a level uses. */
const basesOf = (o) => (tier(o) === "gentle" ? [2, 5] : tier(o) === "middle" ? [2, 3, 4, 5, 8] : [2, 3, 4, 5, 6, 7, 8, 9]);
/** A number with `d` digits in base b (leading digit not 0). */
const withDigits = (r, b, d) => r.int(b ** (d - 1), b ** d - 1);
const digitsOf = (o, b) => (b === 2 ? (tier(o) === "gentle" ? 4 : tier(o) === "middle" ? 5 : 6) : tier(o) === "gentle" ? 2 : tier(o) === "middle" ? 3 : 4);

export const NB_GROUPS = [
  { id: "nb-bases", chapter: "Chapter 10 · Number bases", label: "Number bases", blurb: "Counting in twos, fives, eights: changing base, and sums in a base." },
  { id: "nb-bulbs", label: "Bits and bulbs", blurb: "A breadboard of LEDs: lit is 1, dark is 0." },
];

/* ═══ place values ═════════════════════════════════════════════════════════*/

const nbPlaces = {
  id: "nb-places",
  group: "nb-bases",
  label: "Place values in a base",
  blurb: "1, b, b², b³ — each column b times the last.",
  heading: "Number bases: the place values",
  instruction: () =>
    "In base ten the columns are ones, tens, hundreds, thousands — each ten times the one to its right. In base b " +
    "each column is b times the one to its right: 1, then b, then b × b, then b × b × b. Write the value of each " +
    "column, starting from the ones.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return { b: r.pick(basesOf(o).filter((x) => x !== 10)) };
  },
  render(item) {
    const b = item.b;
    return ask(`Base ${b}: the value of each column`) +
      `<table class="nb-table"><tbody><tr><td>${b}³</td><td>${b}²</td><td>${b}</td><td>1</td></tr>` +
      `<tr><td>${box()}</td><td>${box()}</td><td>${box()}</td><td>1</td></tr></tbody></table>`;
  },
  worked() {
    return worked(ask("Base 2: the columns are 8, 4, 2 and 1") +
      say("Ones, then 2 ones = 2, then 2 twos = 4, then 2 fours = 8. Base 5 would be 125, 25, 5, 1."));
  },
  key(item) {
    return [item.b ** 3, item.b ** 2, item.b].map((v) => want.num(v));
  },
  answer(item) {
    return [`${item.b ** 3}, ${item.b ** 2}, ${item.b}, 1`];
  },
};

/* ═══ to base ten ══════════════════════════════════════════════════════════*/

const nbTo10 = {
  id: "nb-to10",
  group: "nb-bases",
  label: "From a base to base ten",
  blurb: "Each digit times its column's value, then add.",
  heading: "Number bases: changing to base ten",
  instruction: () =>
    "Write each digit under its column's value (1, b, b², … from the right). Multiply each digit by its column " +
    "and add them up: that is the number in base ten.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const b = r.pick(basesOf(o));
    return { b, n: withDigits(r, b, digitsOf(o, b)) };
  },
  render(item) {
    const ds = inBase(item.n, item.b).split("");
    const k = ds.length;
    const cols = ds.map((d, i) => `<td>${d} × ${item.b ** (k - 1 - i)}</td>`).join("");
    return ask(`${shown(item.n, item.b)} in base ten:`) +
      `<table class="nb-table"><tbody><tr>${cols}</tr><tr>${ds.map(() => `<td>${box()}</td>`).join("")}</tr></tbody></table>` +
      ask(`added: ${box()}${baseOf(10)}`);
  },
  worked() {
    return worked(ask("1011₂: &nbsp; 1 × 8 + 0 × 4 + 1 × 2 + 1 × 1 = 8 + 0 + 2 + 1 = 11₁₀") +
      say("The columns of base 2 are 8, 4, 2 and 1. Each digit says how many of that column."));
  },
  key(item) {
    const ds = inBase(item.n, item.b).split("").map(Number);
    const k = ds.length;
    return [...ds.map((d, i) => want.num(d * item.b ** (k - 1 - i))), want.num(item.n)];
  },
  answer(item) {
    return [`${inBase(item.n, item.b)} base ${item.b} = ${item.n}`];
  },
};

/* ═══ from base ten ════════════════════════════════════════════════════════*/

const nbFrom10 = {
  id: "nb-from10",
  group: "nb-bases",
  label: "From base ten to a base",
  blurb: "Divide by b again and again; read the remainders from the bottom.",
  heading: "Number bases: changing from base ten",
  instruction: () =>
    "Divide the number by b and write the remainder beside it. Divide the answer by b again, and again, until it " +
    "is 0. The remainders, read from the BOTTOM up, are the digits in base b.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    const b = r.pick(basesOf(o));
    const n = t === "gentle" ? r.int(b + 1, b === 2 ? 30 : 60) : t === "middle" ? r.int(b * b, b === 2 ? 100 : 300) : r.int(b * b * b, b === 2 ? 250 : 900);
    const steps = [];
    let v = n;
    while (v > 0) { steps.push([v, Math.floor(v / b), v % b]); v = Math.floor(v / b); }
    return { b, n, steps };
  },
  render(item) {
    const rows = item.steps.map(([v], i) => `<tr><td>${item.b}</td><td>${i === 0 ? v : box()}</td><td>remainder ${box()}</td></tr>`).join("");
    return ask(`${item.n}${sub(10)} in base ${item.b}:`) +
      `<table class="nb-div"><tbody>${rows}<tr><td></td><td>0</td><td></td></tr></tbody></table>` +
      ask(`so ${item.n}${sub(10)} = <span class="nb-wide">${box()}</span>${baseOf(item.b)}`);
  },
  worked() {
    return worked(ask("13₁₀ in base 2: 13 ÷ 2 = 6 r 1; 6 ÷ 2 = 3 r 0; 3 ÷ 2 = 1 r 1; 1 ÷ 2 = 0 r 1") +
      say("Read the remainders from the bottom up: 1, 1, 0, 1. So 13₁₀ = 1101₂. Check: 8 + 4 + 0 + 1 = 13."));
  },
  key(item) {
    /* row by row: the remainder of this row, then the number on the next row */
    const out = [];
    item.steps.forEach(([, , rem], i) => {
      if (i > 0) out.push(want.num(item.steps[i][0]));
      out.push(want.num(rem));
    });
    return [...out, want.text(inBase(item.n, item.b))];
  },
  answer(item) {
    return [`${item.n} = ${inBase(item.n, item.b)} base ${item.b}`];
  },
};

/* ═══ adding and taking away in a base ═════════════════════════════════════*/

/** A column sum: the two numbers in base b, and a box for every digit of the answer. */
function columnSum(a, c, b, op, answer) {
  const A = inBase(a, b), C = inBase(c, b), R = inBase(answer, b);
  const w = Math.max(A.length, C.length, R.length);
  const cells = (s, boxes) => Array.from({ length: w }, (_, i) => {
    const d = s.padStart(w, " ")[i];
    return `<td>${boxes ? (d === " " ? "" : box()) : d === " " ? "" : d}</td>`;
  }).join("");
  return `<table class="nb-sum wb-nomath"><tbody>` +
    `<tr><td></td>${cells(A)}</tr><tr><td>${op}</td>${cells(C)}</tr>` +
    `<tr class="nb-sum__ans"><td></td>${cells(R, true)}</tr></tbody></table>`;
}

const nbAdd = {
  id: "nb-add",
  group: "nb-bases",
  label: "Adding in a base",
  blurb: "A column that reaches b carries 1 to the next.",
  heading: "Number bases: adding",
  instruction: () =>
    "Add column by column from the right, just as in base ten — but a column that comes to b or more carries: " +
    "write what is over b, and carry 1. In base 2, 1 + 1 is 10 (write 0, carry 1). Every digit you write must be " +
    "less than b.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const b = r.pick(basesOf(o));
    const d = digitsOf(o, b) - (b === 2 ? 1 : 0);
    const a = withDigits(r, b, d), c = withDigits(r, b, d);
    return { b, a, c, s: a + c };
  },
  render(item) {
    return ask(`base ${item.b}`) + columnSum(item.a, item.c, item.b, "+", item.s);
  },
  worked() {
    return worked(ask("base 5: &nbsp; 34 + 23") +
      say("Ones: 4 + 3 = 7, which is one 5 and 2 — write 2, carry 1. Fives: 3 + 2 + 1 = 6, one 5 and 1 — write 1, " +
        "carry 1. So 34₅ + 23₅ = 112₅. (In base ten: 19 + 13 = 32 = 25 + 5 + 2.)"));
  },
  key(item) {
    return inBase(item.s, item.b).split("").map((d) => want.num(Number(d)));
  },
  answer(item) {
    return [`${inBase(item.a, item.b)} + ${inBase(item.c, item.b)} = ${inBase(item.s, item.b)} (base ${item.b})`];
  },
};

const nbSub = {
  id: "nb-sub",
  group: "nb-bases",
  label: "Taking away in a base",
  blurb: "Borrowing brings ONE b, not ten.",
  heading: "Number bases: taking away",
  hardest: true,
  instruction: () =>
    "Take away column by column from the right. When the top digit is too small, borrow 1 from the next column — " +
    "and in base b that 1 is worth b, so ADD b to the top digit, not ten. In base 2, 10 − 1 is 1.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const b = r.pick(basesOf(o));
    const d = digitsOf(o, b);
    for (;;) {
      const a = withDigits(r, b, d), c = r.int(1, a - 1);
      if (inBase(a - c, b).length === d || r.chance(0.3)) return { b, a, c, s: a - c };
    }
  },
  render(item) {
    return ask(`base ${item.b}`) + columnSum(item.a, item.c, item.b, "−", item.s);
  },
  worked() {
    return worked(ask("base 2: &nbsp; 1010 − 11") +
      say("Ones: 0 − 1 cannot be done, so borrow: the 0 becomes 2 (one 2, in base 2), and 2 − 1 = 1. Twos: the 1 " +
        "lent its 1, so 0 − 1 again — borrow: 2 − 1 = 1. Fours: the 0 lent, borrowing from the 1 above. The answer is " +
        "111₂. (10 − 3 = 7.)"));
  },
  key(item) {
    const A = inBase(item.a, item.b);
    const R = inBase(item.s, item.b).padStart(A.length, " ");
    return R.split("").filter((d) => d !== " ").map((d) => want.num(Number(d)));
  },
  answer(item) {
    return [`${inBase(item.a, item.b)} − ${inBase(item.c, item.b)} = ${inBase(item.s, item.b)} (base ${item.b})`];
  },
};

/* ═══ base to base ═════════════════════════════════════════════════════════*/

const nbConvert = {
  id: "nb-convert",
  group: "nb-bases",
  label: "From one base to another",
  blurb: "Through base ten: there, then back out.",
  heading: "Number bases: base to base",
  hardest: true,
  minLevel: "stretch",
  instruction: () =>
    "To change between two bases that are not ten, go THROUGH base ten: change the number to base ten (digits × " +
    "column values), then change that to the new base (divide again and again, remainders from the bottom up).",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const pool = basesOf(o);
    const b = r.pick(pool);
    let c = r.pick(pool);
    while (c === b) c = r.pick(pool);
    return { b, c, n: withDigits(r, b, digitsOf(o, b) - (b === 2 ? 1 : 0)) };
  },
  render(item) {
    return ask(`${shown(item.n, item.b)} = <span class="nb-wide">${box()}</span>${baseOf(10)} = <span class="nb-wide">${box()}</span>${baseOf(item.c)}`);
  },
  worked() {
    return worked(ask("212₃ = 2 × 9 + 1 × 3 + 2 = 23₁₀; 23 ÷ 5 = 4 r 3, 4 ÷ 5 = 0 r 4, so 23₁₀ = 43₅") +
      say("Into base ten first, then out to base 5. Check: 4 × 5 + 3 = 23."));
  },
  key(item) {
    return [want.num(item.n), want.text(inBase(item.n, item.c))];
  },
  answer(item) {
    return [`${inBase(item.n, item.b)} base ${item.b} = ${item.n} = ${inBase(item.n, item.c)} base ${item.c}`];
  },
};

/* ═══ BITS AND BULBS ═══════════════════════════════════════════════════════
   A row of LEDs on a breadboard (the shared utils/components/workbook/bits.js):
   lit is 1, dark is 0, and each is worth what is printed under it. */

const bulbCount = (o) => (tier(o) === "gentle" ? 4 : tier(o) === "middle" ? 6 : 8);

const bbRead = {
  id: "nb-bulb-read",
  group: "nb-bulbs",
  label: "Read the bulbs",
  blurb: "Add up what the lit bulbs are worth.",
  heading: "Bits and bulbs: reading a number",
  instruction: () =>
    "Each bulb is one BIT — a binary digit. A lit bulb is 1 and counts what is written under it; a dark bulb is 0 " +
    "and counts nothing. Add the worths of the lit bulbs to read the number, and write the bits out as a binary " +
    "number.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const n = bulbCount(o);
    return { n, v: r.int(2 ** (n - 1), 2 ** n - 1) };
  },
  render(item) {
    return bitsHtml({ n: item.n, lit: item.v }) +
      ask(`in binary: <span class="nb-wide">${box()}</span>${baseOf(2)} &nbsp; in base ten: ${box()}`);
  },
  worked() {
    return worked(bitsHtml({ n: 4, lit: 13 }) +
      say("The bulbs worth 8, 4 and 1 are lit: 8 + 4 + 1 = 13. The bits, left to right, are 1101."));
  },
  key: (item) => [want.text(inBase(item.v, 2)), want.num(item.v)],
  answer: (item) => [`${inBase(item.v, 2)} = ${item.v}`],
};

const bbLight = {
  id: "nb-bulb-light",
  group: "nb-bulbs",
  label: "Light the bulbs for a number",
  blurb: "Take the biggest worth that fits, then the next …",
  heading: "Bits and bulbs: showing a number",
  instruction: () =>
    "Start with the bulb worth most. If its worth fits into the number, LIGHT it and take its worth away; if not, " +
    "leave it dark. Go on to the next bulb with what is left. On screen, tap a bulb to light it (tap again to put " +
    "it out); on paper, colour the lit ones. Then write the bits.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const n = bulbCount(o);
    return { n, v: r.int(3, 2 ** n - 1) };
  },
  render(item) {
    return ask(`Show <strong>${item.v}</strong> on the bulbs.`) + bitsHtml({ n: item.n }) +
      ask(`${item.v}${sub(10)} = <span class="nb-wide">${box()}</span>${baseOf(2)}`);
  },
  worked() {
    return worked(ask("Show <strong>11</strong>.") + bitsHtml({ n: 4, lit: 11 }) +
      say("8 fits into 11: light it, 3 left. 4 does not fit into 3: dark. 2 fits: light it, 1 left. 1 fits: light it. 1011."));
  },
  key: (item) => [want.bits({ value: item.v, says: `${inBase(item.v, 2).padStart(item.n, "0")} lit` }), want.text(inBase(item.v, 2), inBase(item.v, 2).padStart(item.n, "0"))],
  answer: (item) => [`${item.v} = ${inBase(item.v, 2)}`],
};

const bbOctal = {
  id: "nb-bulb-octal",
  group: "nb-bulbs",
  label: "Octal on the bulbs",
  blurb: "One octal digit is exactly three bulbs: 4, 2, 1.",
  heading: "Bits and bulbs: octal in threes",
  hardest: true,
  instruction: () =>
    "Octal (base 8) is used with computers because ONE octal digit is exactly THREE bits. The bulbs stand in " +
    "threes, each three worth 4, 2 and 1: light each octal digit on its own three bulbs. The whole row is then " +
    "the number in binary — no dividing needed.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const digits = tier(o) === "middle" ? 2 : 3;
    return { digits, v: r.int(8 ** (digits - 1), 8 ** digits - 1) };
  },
  render(item) {
    return ask(`Show ${shown(item.v, 8)} on the bulbs.`) + bitsHtml({ n: 3 * item.digits, mode: "octal" }) +
      ask(`${shown(item.v, 8)} = <span class="nb-wide">${box()}</span>${baseOf(2)}`);
  },
  worked() {
    return worked(ask(`Show ${shown(46, 8)}.`) + bitsHtml({ n: 6, mode: "octal", lit: 46 }) +
      say("The 5 is 4 + 1: light the 4 and the 1 of the first three (101). The 6 is 4 + 2: light the 4 and the 2 of " +
        "the second three (110). Together: 101110."));
  },
  key(item) {
    const bin = inBase(item.v, 2);
    return [want.bits({ value: item.v, says: `${bin.padStart(3 * item.digits, "0")} lit` }), want.text(bin, bin.padStart(3 * item.digits, "0"))];
  },
  answer: (item) => [`${inBase(item.v, 8)} base 8 = ${inBase(item.v, 2)} base 2`],
};

const bbToOctal = {
  id: "nb-bulb-tooctal",
  group: "nb-bulbs",
  label: "Read the bulbs in octal",
  blurb: "Each three bulbs is one octal digit.",
  heading: "Bits and bulbs: reading octal",
  hardest: true,
  instruction: () =>
    "The bulbs are in threes, each three worth 4, 2, 1. Add up the lit worths in EACH three: that is one octal " +
    "digit. Write the digits side by side for the octal number, and then work out the number in base ten.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const digits = tier(o) === "middle" ? 2 : 3;
    return { digits, v: r.int(8 ** (digits - 1), 8 ** digits - 1) };
  },
  render(item) {
    return bitsHtml({ n: 3 * item.digits, mode: "octal", lit: item.v }) +
      ask(`in octal: <span class="nb-wide">${box()}</span>${baseOf(8)} &nbsp; in base ten: ${box()}`);
  },
  key: (item) => [want.text(inBase(item.v, 8)), want.num(item.v)],
  answer: (item) => [`${inBase(item.v, 8)} base 8 = ${item.v}`],
};

export const NB_EXERCISES = [nbPlaces, nbTo10, nbFrom10, nbAdd, nbSub, nbConvert, bbRead, bbLight, bbOctal, bbToOctal];
