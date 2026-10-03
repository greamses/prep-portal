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

   BROKEN INTO STAGES, easiest first. × 12, × 9 and × 8 never ask whether a
   digit is odd, so they come first, on their own. × 6, × 7 and × 5 do — "half
   the neighbour" and "5 more if odd" — so they are met three times:

     even digits only   every half is exact and the "+ 5" never happens:
                        just the doubling-and-halving pattern
     odd digits only    the "+ 5" happens EVERY time and every half drops
                        its .5 — one new habit, practised on its own
     even and odd       both together, the rule as it really is
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { ask, big, worked, say, tier } from "./common.js";

export const TR_GROUPS = [
  { id: "vm-trach", chapter: "Chapter 6 · The Trachtenberg system", label: "× 12, × 9 and × 8", blurb: "Doubling and neighbours — no odd or even to watch for." },
  { id: "vm-tr-even", label: "× 6, × 7, × 5 — even digits only", blurb: "Every half is exact, and the “+ 5” never happens." },
  { id: "vm-tr-odd", label: "× 6, × 7, × 5 — odd digits only", blurb: "The “+ 5” every time, and every half drops its .5." },
  { id: "vm-tr-mix", label: "× 6, × 7, × 5 — even and odd digits", blurb: "Both together: the rule as it really is." },
];

/** Which digits a stage's numbers are made of. */
const STAGE = {
  even: { group: "vm-tr-even", digits: [0, 2, 4, 6, 8], lead: [2, 4, 6, 8], says: "even digits only" },
  odd: { group: "vm-tr-odd", digits: [1, 3, 5, 7, 9], lead: [1, 3, 5, 7, 9], says: "odd digits only" },
  mix: { group: "vm-tr-mix", digits: null, lead: null, says: "" },
};

/** What a stage adds to the rule's instruction. */
const STAGE_NOTE = {
  even: " Every digit here is even, so half of a neighbour is always exact and the “5 more” never comes into it.",
  odd: " Every digit here is odd, so the “5 more” happens EVERY time, and half of an odd neighbour drops its .5 (half of 7 is 3).",
  mix: "",
};

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

/** How many digits a level's numbers have. */
const lengthOf = (r, t) => (t === "gentle" ? r.int(2, 3) : t === "middle" ? r.int(3, 4) : r.int(5, 5));

function maker(m, stage = "mix") {
  const S = STAGE[stage];
  return (r, o) => {
    const t = tier(o);
    let n;
    if (!S.digits) n = t === "gentle" ? r.int(12, 489) : t === "middle" ? r.int(213, 4987) : r.int(10234, 98765);
    else {
      const len = lengthOf(r, t);
      let s = String(r.pick(S.lead));
      while (s.length < len) s += String(r.pick(S.digits));
      n = Number(s);
    }
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

/* The worked example for each stage uses a number of that stage. The mixed
   stage keeps the examples it always had. */
const STAGE_EXAMPLE = {
  even: { 6: 428, 7: 246, 5: 864 },
  odd: { 6: 357, 7: 513, 5: 739 },
};

/**
 * One section: multiplier m at a stage. The mixed stage keeps the plain ids
 * (vm-tr6 …), so a setup saved before the stages existed still finds them.
 */
function section(m, stage, group) {
  const S = STAGE[stage];
  const id = stage === "mix" ? `vm-tr${m}` : `vm-tr${m}${stage === "even" ? "e" : "o"}`;
  return {
    id,
    group,
    label: S.says ? `Multiply by ${m} — ${S.says}` : `Multiply by ${m}`,
    blurb: RULES[m],
    heading: `Trachtenberg: times ${m}${S.says ? ` — ${S.says}` : ""}`,
    instruction: () => `Write a 0 in front of the number. Then, starting at the right, make each digit of the answer: ${RULES[m]} Keep the last figure of each result and carry the rest. Fill the boxes from the right.${STAGE_NOTE[stage]}`,
    cols: 1,
    defaultCount: 4,
    make: maker(m, stage),
    render(item) {
      return big(`${item.n} × ${m}`) + ask(`0${item.n} → ${row(String(item.product).length)}`);
    },
    worked() {
      const n = (STAGE_EXAMPLE[stage] || {})[m] || EXAMPLE[m];
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
  };
}

export const TR_EXERCISES = [
  ...[12, 9, 8].map((m) => section(m, "mix", "vm-trach")),
  ...[6, 7, 5].map((m) => section(m, "even", "vm-tr-even")),
  ...[6, 7, 5].map((m) => section(m, "odd", "vm-tr-odd")),
  ...[6, 7, 5].map((m) => section(m, "mix", "vm-tr-mix")),
];
