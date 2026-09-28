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

   THE FLAG CAN BE MORE THAN ONE FIGURE, and that is the whole of "long flag
   division": 123456 ÷ 234 divides by 2 and flies a flag of 34. The crossing is
   then the crossing of the CRISS-CROSS — the newest answer figure against the
   first flag figure, the one before it against the second — which is why these
   two methods are taught together and in this order.

     123456 ÷ 234:  flag 3 4, and the last TWO figures of 123456 are set apart
     12 ÷ 2 → 5 r 2, bring the 3: 23 − 3×5      = 8
      8 ÷ 2 → 2 r 4, bring the 4: 44 − (3×2+4×5) = 18
     18 ÷ 2 → 7 r 4, bring the 5: 45 − (3×7+4×2) = 16
     the set-apart figures finish it: 166 − 4×7  = 138
     so 123456 ÷ 234 = 527 remainder 138

   HOW MANY FIGURES ARE SET APART is how many figures the flag has: each one is
   a crossing that is still owed when the answer has run out, and the last
   columns are where they are paid.

   THE ANSWER IS WORKED OUT FIRST, by dividing, and the method is then run with
   those figures. The alternative — thinking of a figure, finding the crossing
   will not come off, and taking one off it — is what a CHILD does, and a child
   can do it because they can rub out. A worksheet cannot: every sum on it has
   to come out with nothing negative in the middle of it, and the only way to
   be sure of that is to work it and look. A sum that does not behave is not
   set (see `flagFits`).
   ========================================================================== */

import { colSheet } from "./colsheet.js";

/** The figures of a number, most significant first. */
const figs = (n) => String(n).split("").map(Number);

/**
 * The whole method, worked out — or null when this sum cannot be written this
 * way (see the head of the file).
 *
 *   main   the figure that divides            2      of 234
 *   flag   the figures that cross    [3, 4]           of 234
 *   from   how many figures the first step ate (0 or 1)
 *   steps  one per figure of the answer: what stood there, what went in, what
 *          was left, the crossing taken off, and what that came to
 *   tail   the set-apart columns at the end, one per flag figure after the
 *          first: the crossing still owed, and what it leaves
 */
export function flagWork(n, d) {
  const ds = String(d);
  const main = Number(ds[0]);
  const flag = ds.slice(1).split("").map(Number);
  const L = flag.length;
  const a = figs(n);
  const m = a.length;
  if (!L || !main) return null;

  /* the first figure may be too small to divide on its own */
  const from = a[0] < main ? 1 : 0;
  const count = m - L - from;               // how many figures the answer has
  if (count < 1) return null;

  const Q = Math.floor(n / d);
  const R = n % d;
  const q = figs(Q);
  if (q.length !== count) return null;      // the answer does not fit the columns

  let gross = from ? a[0] * 10 + a[1] : a[0];
  const steps = [];
  for (let k = 0; k < count; k++) {
    const qd = q[k];
    const guess = Math.min(9, Math.floor(gross / main));
    const left = gross - qd * main;
    if (left < 0) return null;
    const digit = a[from + 1 + k];
    let cross = 0;
    for (let j = 0; j < L && k - j >= 0; j++) cross += flag[j] * q[k - j];
    const next = left * 10 + digit - cross;
    if (next < 0) return null;              // a step that would have to be undone
    steps.push({ gross, q: qd, left, cross, next, digit, tried: Math.max(0, guess - qd) });
    gross = next;
  }

  /* THE SET-APART COLUMNS. One per flag figure after the first, each paying a
     crossing that was still owed when the answer ran out. */
  const tail = [];
  for (let t = 1; t < L; t++) {
    const digit = a[m - L + t];
    let cross = 0;
    for (let j = t; j < L; j++) {
      const which = count - 1 - (j - t);
      if (which >= 0) cross += flag[j] * q[which];
    }
    const next = gross * 10 + digit - cross;
    if (next < 0) return null;
    tail.push({ gross, digit, cross, next });
    gross = next;
  }

  if (gross !== R) return null;             // it did not come out: do not set it
  return {
    n, d, main, flag, L, digits: a, steps, tail, from,
    quotient: String(Q), remainder: R,
  };
}

/** Is this a sum the method can be set on a child? */
export const flagFits = (n, d) => {
  if (d < 11 || d % 10 === 0) return false;
  const w = flagWork(n, d);
  if (!w) return false;
  return w.remainder >= 0 && w.remainder < d
    && Number(w.quotient) * d + w.remainder === n
    && w.steps.every((s) => s.q >= 0 && s.q <= 9)
    /* no nought at the front of the answer: it is a figure of nothing, and a
       box for it on a worksheet is a box a child fills in wrongly and is told
       they are wrong */
    && w.steps[0].q > 0
    && w.steps.length >= 2;
};

/**
 * THE SHEET. The divisor written with its flag set apart — 2 | 34 — the number
 * being divided inside the stop with its last figures set apart too, the
 * crossings taken off in a row above, and the answer under it.
 *
 *   rows   0 the crossing taken off at each step
 *          1 what stands there to be divided (the gross)
 *          2 the number being divided, with the divisor and the stop
 *          3 the answer, and what is left over
 */
export function flagStop(n, d, { answer = false } = {}) {
  const w = flagWork(n, d);
  if (!w) return "";
  const wide = w.digits.length;
  /* room past the bar for "r 138": the widest thing that can be left over is
     one less than the divisor, so the room it needs is known before the sum is
     worked — and every sheet in an exercise is then the same width. */
  const rwide = String(d - 1).length;
  const cols = wide + 1 + rwide;
  const at = (k) => wide - 1 - k + 1 + rwide;
  const rowX = 0;
  const rowG = 1;
  const rowN = 2;
  const rowQ = 3;

  const sheet = colSheet({ cols, places: 0, steps: answer ? null : "listed" });
  const last = w.steps.length - 1;
  const setApart = wide - w.L;             // the first figure that is set apart

  /* the number being divided, and the divisor with its flag */
  sheet.sign(rowN, `${w.main}|${w.flag.join("")}`);
  /* ONE line, where the setting apart starts — the last two figures of a
     long flag division are set apart together, and a dash in front of each of
     them would say they were two separate things */
  w.digits.forEach((f, k) => sheet.mark(rowN, at(k), f, k === setApart ? "is-flagged" : ""));

  /* THE ORDER THE METHOD IS WORKED: divide what stands there, write the figure,
     take the crossing off, and what is left is what stands there next. So each
     step asks for its figure, then its crossing, then the number that comes of
     it — and with a one-figure flag the last step's "next" IS the remainder,
     asked for once at the end rather than twice. */
  let step = 0;
  w.steps.forEach((s, k) => {
    const col = at(k + w.from);
    const nextCol = at(k + w.from + 1);
    const lastGross = k === last && !w.tail.length;
    if (answer) {
      sheet.mark(rowQ, col, s.q);
      sheet.mark(rowX, col, `−${s.cross}`, "is-soft");
      if (!lastGross) sheet.mark(rowG, nextCol, s.next, "is-soft");
    } else {
      sheet.box(rowQ, col, { step: step++ });
      sheet.slot(rowX, col, { step: step++, tone: "is-cross" });
      if (!lastGross) sheet.slot(rowG, nextCol, { step: step++ });
      /* the crossing is the FLAG times the figures just written: an arrow from
         the one to the other, drawn while that crossing is the thing being
         asked for — which is the moment it answers the question */
      sheet.arrow({ row: rowN, place: "sign" }, { row: rowQ, place: col },
        { tie: `r${rowX}c${col}` });
    }
  });

  /* the set-apart columns, where the crossings still owed are paid */
  w.tail.forEach((t, i) => {
    const col = at(setApart + i);
    if (answer) sheet.mark(rowX, col, `−${t.cross}`, "is-soft");
    else sheet.slot(rowX, col, { step: step++, tone: "is-cross" });
  });

  /* what is left over at the end — as wide as it needs to be, because the
     thing left over after dividing by 234 is not one figure */
  sheet.mark(rowQ, rwide, "r", "is-soft");
  if (answer) sheet.mark(rowQ, rwide - 1, w.remainder);
  else sheet.slot(rowQ, rwide - 1, { step: step++, span: rwide });

  sheet.stop(rowG, { from: at(wide - 1), to: at(0) });
  /* a three-figure divisor writes 2|34 where a two-figure one writes 2|3, and
     the column it stands in is the same width either way */
  return sheet.html(`mm-col mm-flag${w.L > 1 ? " mm-flag--wide" : ""}`);
}

/** What the key has to answer, in the order the sheet lists it. */
export function flagKey(n, d) {
  const w = flagWork(n, d);
  if (!w) return [];
  const out = [];
  const last = w.steps.length - 1;
  w.steps.forEach((s, k) => {
    out.push({ kind: "digit", value: s.q });
    out.push({ kind: "cross", value: s.cross });
    if (!(k === last && !w.tail.length)) out.push({ kind: "gross", value: s.next });
  });
  w.tail.forEach((t) => out.push({ kind: "cross", value: t.cross }));
  out.push({ kind: "remainder", value: w.remainder });
  return out;
}
