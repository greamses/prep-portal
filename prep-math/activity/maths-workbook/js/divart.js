/* ============================================================================
   Maths Workbook — a division written down the page
   ----------------------------------------------------------------------------
   THE BUS STOP, on the same ruled sheet as every other written sum here
   (colsheet.js): the answer above the bar, the number being divided under it,
   and the little figures carried along the row between them.

   It is the printed half of /utils/components/boards/shortdiv.js. The board
   asks for one figure at a time and says why a wrong one is wrong; this asks
   for all of them at once and is marked at the end. Same method, same shape on
   the page, so a child who has worked one on the screen recognises the other.

   THE COLUMNS, from the right:
     0        the box the remainder goes in
     1        the printed "r" in front of it
     2 … n+1  the figures of the number being divided, ones at 2

   The remainder lives OUTSIDE the stop, past the end of the bar, because it is
   what the division would not take — not another figure of the answer. When the
   division comes out exactly, those two columns are simply not there.
   ========================================================================== */

import { colSheet } from "./colsheet.js";

/**
 * The working, as the method makes it.
 *
 *   q      the figures of the answer, in writing order
 *   carry  what is left over after each figure, carried in front of the next
 *          one — `null` where nothing was left
 */
export function shortWork(n, d) {
  const figs = String(n).split("").map(Number);
  const q = [];
  const carry = [];
  let left = 0;
  figs.forEach((f, k) => {
    const standing = left * 10 + f;
    q.push(Math.floor(standing / d));
    left = standing % d;
    /* the carry is written in front of the NEXT figure, so it belongs to k+1 */
    if (k < figs.length - 1) carry.push(left || null);
  });
  return { figs, q, carry, remainder: left };
}

/** Just the carried figures, for the key. */
export const shortCarries = (n, d) => shortWork(n, d).carry;

/**
 * The bus stop itself.
 *
 *   answer   true prints the whole thing worked, for the one done for you;
 *            false leaves the answer and the carries to be written in
 */
export function busStop(n, d, { answer = false } = {}) {
  const { figs, q, carry, remainder } = shortWork(n, d);
  const wide = figs.length;
  /* two columns past the number for "r 3", and none at all when it goes exactly */
  const cols = wide + (remainder ? 2 : 0);
  /* place of the figure written k along from the left */
  const at = (k) => wide - 1 - k + (remainder ? 2 : 0);

  /* No place tags: the columns of a division are the columns of the METHOD.
     Naming them O, T, H would invite a child to read the carried 1 in front of
     the tens as one ten, and it is not — it is one of whatever place it stands
     in front of. */
  const sheet = colSheet({ cols, places: 0, steps: answer ? null : "ltr" });

  const rowQ = 0;       // the answer, above the bar
  const rowC = 1;       // what is carried, just under it
  const rowN = 2;       // the number being divided

  /* The answer, highest place first — which for a division is also the order it
     is worked out in, the one method on this paper where those agree. */
  for (let k = 0; k < wide; k++) {
    if (answer) sheet.mark(rowQ, at(k), q[k]);
    else sheet.box(rowQ, at(k));
  }
  if (remainder) {
    sheet.mark(rowQ, 1, "r", "is-soft");
    if (answer) sheet.mark(rowQ, 0, remainder);
    else sheet.box(rowQ, 0);
  }

  /* Each carry waits on the figure to its LEFT: you divide a column, and what
     will not go carries into the next one along. */
  for (let k = 1; k < wide; k++) {
    if (carry[k - 1] == null) continue;
    sheet.carry(rowC, at(k), answer ? carry[k - 1] : null, rowQ, at(k - 1));
  }

  sheet.sign(rowN, String(d));
  figs.forEach((f, k) => sheet.mark(rowN, at(k), f));
  sheet.stop(rowC, { from: at(wide - 1), to: at(0) });
  return sheet.html("mm-col");
}
