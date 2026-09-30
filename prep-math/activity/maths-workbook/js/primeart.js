/* ============================================================================
   Maths Workbook — the drawings of the PRIME FACTORS chapter
   ----------------------------------------------------------------------------
   Three pictures, and each of them is an argument.

     blocksIn(n)    n little blocks in one long row, to be regrouped. The whole
                    idea of a prime is here and nowhere else: some numbers of
                    blocks can be pushed into equal rows and some cannot, and a
                    child who has tried it on 12 and on 13 knows the difference
                    before the words "prime" and "composite" are said to them.

     arrayOf(r, c)  the same blocks in r rows of c — the answer to "can it be
                    grouped?", drawn as the rectangle it makes. A prime makes
                    only the one-row rectangle, which is why it looks like a
                    stick and a composite looks like a brick.

     ladder(n)      the division ladder of table factoring: divide by the
                    smallest prime that goes, again and again, and read the
                    answer down the left-hand side.

                      2 | 60
                      2 | 30
                      3 | 15
                      5 |  5
                          1

   The blocks are drawn here rather than borrowed from blocks.js because these
   are not PLACE-VALUE blocks. A ten-rod would be a lie in a chapter about
   grouping: what makes twelve twelve is not one ten and two ones, it is three
   fours or four threes, and the picture has to be able to say so.
   ========================================================================== */

import { colSheet } from "./colsheet.js";
import { primesOf } from "/utils/components/workbook/factortree.js";

/* millimetres, like every other drawing on this paper */
const CELL = 4.2;        // one block
const PAD = 0.55;        // the air between two of them

const block = (x, y, tone = "") =>
  `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(CELL - PAD).toFixed(2)}" height="${(CELL - PAD).toFixed(2)}"`
  + ` rx="0.7" class="pf-cube${tone ? ` ${tone}` : ""}"/>`;

/**
 * `n` blocks in rows of `per`. One row of everything is the unbroken stick a
 * number starts as; `per` less than n is the child's regrouping of it.
 */
export function arrayOf(n, per = n, { tone = "", wrap = 24 } = {}) {
  const across = Math.min(per, wrap);
  const rows = Math.ceil(n / across);
  const w = across * CELL;
  const h = rows * CELL;
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / across);
    const c = i % across;
    out.push(block(c * CELL, r * CELL, tone));
  }
  return `<svg class="pf-blocks" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}"`
    + ` width="${w.toFixed(1)}mm" height="${h.toFixed(1)}mm" aria-hidden="true">${out.join("")}</svg>`;
}

/** The unbroken row a number arrives as. */
export const blocksIn = (n) => arrayOf(n, n, { wrap: 24 });

/** Every rectangle a number makes, drawn side by side — what its factors LOOK like. */
export function shapesOf(n, { only = null } = {}) {
  const rows = [];
  for (let r = 1; r * r <= n; r++) {
    if (n % r) continue;
    rows.push([r, n / r]);
  }
  const use = only ? rows.filter(([r]) => only.includes(r)) : rows;
  return `<div class="pf-shapes">${use.map(([r, c]) =>
    `<figure class="pf-shape">${arrayOf(n, c, { wrap: 24 })}<figcaption>${r} × ${c}</figcaption></figure>`).join("")}</div>`;
}

/**
 * THE DIVISION LADDER — table factoring.
 *
 * One row per division: the prime that goes on the left of the rule, what is
 * left under the last one. The boxes are the child's; the number at the top is
 * the question, and the 1 at the bottom is where every ladder ends.
 *
 *   rows   0 … k-1  the divisions
 *   the divisor stands in the sign column, the number inside the stop
 */
export function ladder(n, { answer = false } = {}) {
  const ps = primesOf(n);
  const wide = String(n).length;
  const cols = wide;
  const at = (v) => {
    /* a number written so its ones stand in the ones column */
    const s = String(v);
    return { s, from: s.length - 1 };
  };

  const sheet = colSheet({ cols, places: 0, steps: answer ? null : "listed" });
  let step = 0;
  let left = n;

  /* a number written with its ones in the ones column */
  const put = (row, v, cls = "") => {
    const { s } = at(v);
    s.split("").forEach((ch, i) => sheet.mark(row, s.length - 1 - i, ch, cls));
  };
  const boxes = (row, v) => {
    const s = String(v);
    for (let i = 0; i < s.length; i++) sheet.box(row, s.length - 1 - i, { step: step++ });
  };

  /* the number being factored, at the top; under it what is left each time */
  put(0, n);
  ps.forEach((p, k) => {
    left /= p;
    /* WHAT IT IS DIVIDED BY, outside the ladder — the question this method
       asks at every rung, and the only one it asks */
    if (answer) sheet.sign(k, String(p));
    else sheet.signBox(k, { step: step++, tone: "is-by" });
    if (answer) put(k + 1, left, "is-left");
    else boxes(k + 1, left);
  });
  /* one line over the top and one down the side, the whole way to the 1 */
  sheet.stop(0, { from: 0, to: cols - 1 });
  return sheet.html("mm-col mm-ladder");
}

/** What the ladder asks for, in the order it asks: the prime, then what is left. */
export function ladderKey(n) {
  const out = [];
  let left = n;
  primesOf(n).forEach((p) => {
    left /= p;
    out.push({ kind: "by", value: p });
    String(left).split("").forEach((ch) => out.push({ kind: "left", value: Number(ch) }));
  });
  return out;
}
