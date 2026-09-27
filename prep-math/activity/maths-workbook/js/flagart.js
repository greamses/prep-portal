/* ============================================================================
   Maths Workbook — dividing with a flag (straight division)
   ----------------------------------------------------------------------------
   THE DIVISION THAT GOES WITH THE CRISS-CROSS. Long division by a two-figure
   number asks a child to guess how many 23s are in 123 and then multiply back
   to find out; this asks them to divide by 2 — which they can do — and then
   take away a crossing, which is the same one step the criss-cross multiplies
   with, run backwards.

   1234 ÷ 23. The 2 is the DIVISOR and the 3 is the FLAG.

     12 ÷ 2 is 6 … but 6 leaves nothing to take 3 × 6 from, so it is 5 r 2
     bring the 3 down beside the 2: 23, less the crossing 3 × 5 = 15, is 8
     8 ÷ 2 is 4 … the same trouble, so 3 r 2
     bring the 4 down: 24, less the crossing 3 × 3 = 9, is 15
     nothing left to divide: 53 remainder 15

   THE ONE HARD PART is that the figure you first think of is sometimes too big
   — you find out when the crossing will not come off what is left. A child
   meets that here as "take one off and try again", which is the same thing long
   division asks of them, one figure at a time instead of one number at a time.

   The last figure of the number being divided is set apart by a bar: it is not
   divided, it is what the remainder is finished off with.
   ========================================================================== */

import { colSheet } from "./colsheet.js";

/**
 * The whole method, worked out.
 *
 *   steps  one per figure of the answer: what stood there, what went in, what
 *          was left, the crossing taken off, and what that came to
 */
export function flagWork(n, d) {
  const digits = String(n).split("").map(Number);
  const main = Math.floor(d / 10);
  const flag = d % 10;
  const steps = [];
  let i = 0;
  let gross = digits[0];
  /* the first figure may be too small to divide on its own */
  if (gross < main) { gross = gross * 10 + digits[1]; i = 1; }
  const from = i;                        // how many figures the first step ate
  while (i < digits.length - 1) {
    let qd = Math.min(9, Math.floor(gross / main));
    let left = gross - qd * main;
    let next = left * 10 + digits[i + 1] - flag * qd;
    /* the figure first thought of is sometimes too big: you find out when the
       crossing will not come off what is left */
    let tries = 0;
    while (next < 0 && qd > 0) {
      qd -= 1;
      left = gross - qd * main;
      next = left * 10 + digits[i + 1] - flag * qd;
      tries += 1;
    }
    steps.push({
      gross, q: qd, left, cross: flag * qd, next, digit: digits[i + 1], tried: tries,
    });
    gross = next;
    i += 1;
  }
  /* the answer can still finish one short — 1234 ÷ 23 does not, but 1000 ÷ 11
     would — so the last figure is pushed up until what is left is less than
     the divisor, which is what "remainder" means */
  while (steps.length && gross >= d) {
    const last = steps[steps.length - 1];
    last.q += 1;
    gross -= d;
    last.next = gross;
  }
  return {
    n, d, main, flag, digits, steps, from,
    quotient: steps.map((s) => s.q).join("") || "0",
    remainder: gross,
  };
}

/** Is this a sum the method can be set on a child? */
export const flagFits = (n, d) => {
  if (d < 11 || d > 99 || d % 10 === 0) return false;
  const w = flagWork(n, d);
  return w.remainder >= 0 && w.remainder < d
    && Number(w.quotient) * d + w.remainder === n
    && w.steps.every((s) => s.q >= 0 && s.q <= 9 && s.next >= 0)
    /* no nought at the front of the answer: it is a figure of nothing, and a
       box for it on a worksheet is a box a child fills in wrongly and is told
       they are wrong */
    && w.steps[0].q > 0
    && w.steps.length >= 2;
};

/**
 * THE SHEET. The divisor written with its flag set apart — 2 | 3 — the number
 * being divided inside the stop with its last figure set apart too, the
 * crossings taken off in a row above, and the answer under it.
 *
 *   rows   0 the crossing taken off at each step
 *          1 what stands there to be divided (the gross)
 *          2 the number being divided, with the divisor and the stop
 *          3 the answer, and what is left over
 */
export function flagStop(n, d, { answer = false } = {}) {
  const w = flagWork(n, d);
  const wide = w.digits.length;
  /* places, right to left: 0 the remainder, 1 the r, 2 … the figures */
  const cols = wide + 2;
  const at = (k) => wide - 1 - k + 2;
  const rowX = 0;
  const rowG = 1;
  const rowN = 2;
  const rowQ = 3;

  const sheet = colSheet({ cols, places: 0, steps: answer ? null : "listed" });
  const last = w.steps.length - 1;

  /* the number being divided, and the divisor with its flag */
  sheet.sign(rowN, `${w.main}|${w.flag}`);
  w.digits.forEach((f, k) => sheet.mark(rowN, at(k), f, k === wide - 1 ? "is-flagged" : ""));

  /* THE ORDER THE METHOD IS WORKED: divide what stands there, write the figure,
     take the crossing off, and what is left is what stands there next. So each
     step asks for its figure, then its crossing, then the number that comes of
     it — and the last one's "next" is the remainder itself, asked for once at
     the end rather than twice. */
  w.steps.forEach((s, k) => {
    const col = at(k + w.from);
    const nextCol = at(k + w.from + 1);
    if (answer) {
      sheet.mark(rowQ, col, s.q);
      sheet.mark(rowX, col, `−${s.cross}`, "is-soft");
      if (k < last) sheet.mark(rowG, nextCol, s.next, "is-soft");
    } else {
      sheet.box(rowQ, col, { step: k * 3 });
      sheet.slot(rowX, col, { step: k * 3 + 1, tone: "is-cross" });
      if (k < last) sheet.slot(rowG, nextCol, { step: k * 3 + 2 });
      /* the crossing is the FLAG times the figure just written: an arrow from
         the one to the other, drawn while that crossing is the thing being
         asked for — which is the moment it answers the question */
      sheet.arrow({ row: rowN, place: "sign" }, { row: rowQ, place: col },
        { tie: `r${rowX}c${col}` });
    }
  });

  /* what is left over at the end */
  sheet.mark(rowQ, 1, "r", "is-soft");
  if (answer) sheet.mark(rowQ, 0, w.remainder);
  else sheet.box(rowQ, 0, { step: w.steps.length * 3 });

  sheet.stop(rowG, { from: at(wide - 1), to: at(0) });
  return sheet.html("mm-col mm-flag");
}

/** What the key has to answer, in the order the sheet lists it. */
export function flagKey(n, d) {
  const w = flagWork(n, d);
  const out = [];
  const last = w.steps.length - 1;
  w.steps.forEach((s, k) => {
    out.push({ kind: "digit", value: s.q });
    out.push({ kind: "cross", value: s.cross });
    if (k < last) out.push({ kind: "gross", value: s.next });
  });
  out.push({ kind: "remainder", value: w.remainder });
  return out;
}
