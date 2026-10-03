/* ============================================================================
   Vedic Maths Workbook — CHAPTER 6 · The Trachtenberg system
   ----------------------------------------------------------------------------
   Jakow Trachtenberg's speed system multiplies by a single number with no
   times table beyond doubling and halving. The answer is written ONE DIGIT AT
   A TIME FROM THE RIGHT, and every digit comes from just two digits of the
   number: the one above it, and its NEIGHBOUR — the digit to its right. Write
   a 0 in front of the number first, so there is a place for the last digit.

     × 12   double the digit, add the neighbour
     × 6    the digit, plus half the neighbour — and 5 more if the digit is odd
     × 7    double the digit, plus half the neighbour — 5 more if it is odd
     × 5    half the neighbour — 5 more if the digit is odd
     × 9    rightmost from 10; then from 9 plus the neighbour; the 0 in front
            gives the neighbour minus 1
     × 8    as × 9, but doubled: from 10 doubled; from 9 doubled plus the
            neighbour; the 0 in front gives the neighbour minus 2

   ("Half" always drops the fraction: half of 7 is 3.) Carry as usual.
   (× 11 — the digit plus its neighbour — is chapter 2's first trick.)

   So each question is a row of digit boxes filled from the right, which is
   also the order the on-screen drill moves the cursor in: the boxes are in the
   page right-to-left (the units first) and drawn left-to-right.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { ask, big, worked, say, tier } from "./common.js";

export const TR_GROUPS = [
  { id: "vm-trach", chapter: "Chapter 6 · The Trachtenberg system", label: "Trachtenberg multipliers", blurb: "× 12, 6, 7, 5, 9 and 8 — one digit at a time, from the right." },
];

const RULES = {
  12: "Double each digit and add its neighbour (the digit to its right).",
  6: "Each digit plus half its neighbour — and 5 more if the digit itself is odd.",
  7: "Double each digit plus half its neighbour — and 5 more if the digit is odd.",
  5: "Half of the neighbour — and 5 more if the digit itself is odd.",
  9: "The rightmost digit: take it from 10. Every digit after that: take it from 9 and add its neighbour. The 0 in front: its neighbour minus 1.",
  8: "The rightmost digit: take it from 10 and double. Every digit after that: take it from 9, double, and add its neighbour. The 0 in front: its neighbour minus 2.",
};

/** The answer's digits, units first. */
const digitsUp = (n) => String(n).split("").reverse().map(Number);

/** The digit boxes: in the page units first, drawn the usual way round. */
const row = (count) =>
  `<span class="vm-digits wb-nomath">${Array.from({ length: count }, () => '<span class="wb-answer"></span>').join("")}</span>`;

function maker(m) {
  return (r, o) => {
    const t = tier(o);
    const n = t === "gentle" ? r.int(12, 489) : t === "middle" ? r.int(213, 4987) : r.int(10234, 98765);
    return { n, m, product: n * m };
  };
}

/** A worked example: the steps for each digit, from the right. */
export function trachSteps(m, n) {
  const d = [0, ...String(n).split("").map(Number)]; // the 0 in front
  const out = [];
  let carry = 0;
  const half = (x) => Math.floor(x / 2);
  for (let i = d.length - 1; i >= 0; i--) {
    const digit = d[i];
    const nb = i + 1 < d.length ? d[i + 1] : 0;
    const odd = digit % 2 === 1;
    let raw, how;
    const last = i === d.length - 1;
    if (m === 12) { raw = 2 * digit + nb; how = `2 × ${digit} + ${nb}`; }
    else if (m === 6) { raw = digit + half(nb) + (odd ? 5 : 0); how = `${digit} + ${half(nb)}${odd ? " + 5" : ""}`; }
    else if (m === 7) { raw = 2 * digit + half(nb) + (odd ? 5 : 0); how = `2 × ${digit} + ${half(nb)}${odd ? " + 5" : ""}`; }
    else if (m === 5) { raw = half(nb) + (odd ? 5 : 0); how = `${half(nb)}${odd ? " + 5" : ""}`; }
    else if (m === 9) {
      if (last) { raw = 10 - digit; how = `10 − ${digit}`; }
      else if (i === 0) { raw = nb - 1; how = `${nb} − 1`; }
      else { raw = 9 - digit + nb; how = `9 − ${digit} + ${nb}`; }
    } else {
      if (last) { raw = 2 * (10 - digit); how = `2 × (10 − ${digit})`; }
      else if (i === 0) { raw = nb - 2; how = `${nb} − 2`; }
      else { raw = 2 * (9 - digit) + nb; how = `2 × (9 − ${digit}) + ${nb}`; }
    }
    const total = raw + carry;
    if (i === 0 && total === 0) { carry = 0; break; }
    out.push(`${how}${carry ? ` + ${carry} carried` : ""} = ${total} → write ${total % 10}`);
    carry = Math.floor(total / 10);
  }
  /* × 12 can run past the 0 in front: what is still carried is the first digit */
  if (carry) out.push(`the ${carry} still carried → write ${carry}`);
  return out;
}

const EXAMPLE = { 12: 413, 6: 357, 7: 342, 5: 463, 9: 284, 8: 315 };

const exercises = [12, 6, 7, 5, 9, 8].map((m) => ({
  id: `vm-tr${m}`,
  group: "vm-trach",
  label: `Multiply by ${m}`,
  blurb: RULES[m],
  heading: `Trachtenberg: times ${m}`,
  instruction: () => `Write a 0 in front of the number. Then, starting at the right, make each digit of the answer: ${RULES[m]} Keep the last figure of each result and carry the rest. Fill the boxes from the right.`,
  cols: 1,
  defaultCount: 4,
  make: maker(m),
  render(item) {
    return big(`${item.n} × ${m}`) + ask(`0${item.n} → ${row(String(item.product).length)}`);
  },
  worked() {
    const n = EXAMPLE[m];
    return worked(big(`${n} × ${m}`) + ask(`0${n}, from the right:`) +
      `<ol class="vm-trlist">${trachSteps(m, n).map((s) => `<li>${s}</li>`).join("")}</ol>` +
      say(`Read the written digits from the bottom up: ${n * m}.`));
  },
  key(item) {
    return digitsUp(item.product).map((v) => want.num(v));
  },
  answer(item) {
    return [`${item.n} × ${m} = ${item.product}`];
  },
}));

export const TR_EXERCISES = exercises;
