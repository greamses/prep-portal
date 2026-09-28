/* ============================================================================
   Maths Workbook — LONG division, written down the page
   ----------------------------------------------------------------------------
   The method everybody was taught: how many times it goes, multiply back, take
   away, bring the next one down.

           1 4 7
      3 ) 4 4 2
          3
          ─
          1 4
          1 2
          ─ ─
            2 2
            2 1
            ─ ─
              1

   SHORT DIVISION IS THIS SUM WITH THE WORKING IN YOUR HEAD, which is why this
   workbook teaches short division first and this after it: a child who cannot
   do 3 into 14 in their head has no business writing it out, and a child who
   can needs this the moment the divisor is 23 and they cannot.

   NOTHING HERE IS NEW ARITHMETIC. The plan comes from the written board the
   tools already have (utils/components/boards/longdiv.js) — the same steps,
   the same rows, the same argument about place value — so a child who has
   worked one on the screen meets the identical shape on paper. This file is
   the printing of it: which figure stands in which column, what is a box and
   what is copied, and the little rules under each taking-away.

   WHAT IS ASKED FOR, and what is not:

     the answer figures        asked      the point of the exercise
     what each one multiplies  asked      the step children skip and then
                                          wonder why the taking-away is wrong
     what is left after it     asked      the same
     the figures brought down  DRAGGED    bringing a figure down IS a movement
                                          and not a calculation, so on screen
                                          it is made as one: the figure is
                                          dragged out of the number being
                                          divided into the box waiting for it.
                                          On paper the box is empty and the
                                          child writes it. Either way nobody
                                          brings it down FOR them — a figure
                                          that appears by itself is the one
                                          step of this method that learners
                                          forget to take.

   Every box is one figure in one column, because the whole method is an
   argument about columns and a number typed into a wide box is not in one.
   ========================================================================== */

import { colSheet } from "./colsheet.js";
import { workOut } from "/utils/components/boards/longdiv.js";

/** The plan, in plain base ten. */
export const longWork = (n, d) => workOut(n, d, 10);

/** Is this a sum worth setting out the long way? */
export function longFits(n, d) {
  if (d < 2 || n < d) return false;
  const w = longWork(n, d);
  if (!w.live.length) return false;
  /* the answer must start where the sum starts: 0 at the front of a quotient
     is a box a child fills in wrongly and is told they are wrong */
  const written = w.steps.filter((s) => s.write);
  if (!written.length || written[0].q === 0) return false;
  return Number(w.quotient) === Math.floor(n / d) && w.remainder === n % d;
}

/** The figures of a number, most significant first. */
const figs = (v) => String(v).split("").map(Number);

/**
 * THE SHEET.
 *
 *   row 0        the answer, above the bar
 *   row 1        the number being divided, inside the stop
 *   after that   two rows per live step: what it multiplies to, and what is
 *                left after taking that away (which is also where the next
 *                figure is brought down to)
 */
export function longStop(n, d, { answer = false } = {}) {
  const w = longWork(n, d);
  const wide = w.digits.length;
  const cols = wide;
  const at = (i) => wide - 1 - i;          // digit i of the dividend → a place

  const sheet = colSheet({ cols, places: 0, steps: answer ? null : "listed" });
  const rowQ = 0;
  const rowN = 1;

  /* the answer above the bar, and the number being divided under it. Each
     figure of it can be picked up and brought down, so each one says which
     figure it is. */
  const firstLive = w.live[0].i;
  w.digits.forEach((f, i) => sheet.mark(rowN, at(i), f, "", ` data-figure="${i}"`));
  sheet.sign(rowN, String(d));

  const bringRow = (j) => {
    const s = w.live.find((x) => x.i >= j);
    return s ? s.curRow : w.rows - 1;
  };

  /* ASKED FOR, in the order a hand writing this would ask it of itself —
     bring the next figure down, decide how many times it goes, multiply back,
     take away. */
  let step = 0;
  const place = (row, i, value, kind) => {
    const fs = figs(value);
    for (let k = 0; k < fs.length; k++) {
      const p = at(i) + (fs.length - 1 - k);
      if (answer) sheet.mark(row, p, fs[k], kind);
      else sheet.box(row, p, { step: step++ });
    }
    return fs.length;
  };

  w.steps.forEach((s) => {
    /* the figure brought down, before anything is decided about it */
    if (s.i > firstLive) {
      const row = bringRow(s.i);
      if (row > rowN) {
        if (answer) sheet.mark(row, at(s.i), w.digits[s.i], "is-brought");
        else sheet.box(row, at(s.i), { step: step++, bring: s.i });
      }
    }
    if (s.write) {
      if (answer) sheet.mark(rowQ, at(s.i), s.q);
      else sheet.box(rowQ, at(s.i), { step: step++ });
    }
    if (s.q > 0) {
      const wideP = place(s.prodRow, s.i, s.product);
      /* the little line under what is being taken away — under THAT piece of
         the number and no further */
      sheet.rule(s.prodRow, { from: at(s.i), to: at(s.i) + wideP - 1 });
      place(s.diffRow, s.i, s.rem, "is-left");
    }
  });

  sheet.stop(rowN, { from: at(wide - 1), to: at(0) });
  return sheet.html("mm-col mm-long");
}

/** What the key has to answer, in the order the sheet lists it. */
export function longKey(n, d) {
  const w = longWork(n, d);
  const out = [];
  const firstLive = w.live[0].i;
  const bringRow = (j) => {
    const s = w.live.find((x) => x.i >= j);
    return s ? s.curRow : w.rows - 1;
  };
  w.steps.forEach((s) => {
    if (s.i > firstLive && bringRow(s.i) > 1) out.push({ kind: "brought", value: w.digits[s.i] });
    if (s.write) out.push({ kind: "digit", value: s.q });
    if (s.q > 0) {
      figs(s.product).forEach((f) => out.push({ kind: "times", value: f }));
      figs(s.rem).forEach((f) => out.push({ kind: "left", value: f }));
    }
  });
  return out;
}
