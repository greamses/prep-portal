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
import { primesOf, ownPrimes, sharedPrimes, hcfOf, lcmOf } from "/utils/components/workbook/factortree.js";
import { shortWork } from "./divart.js";

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
  const rungs = [];
  ps.forEach((p, k) => {
    const was = left;
    left /= p;
    /* WHAT IT IS DIVIDED BY, outside the ladder — the question this method
       asks at every rung, and the only one it asks */
    if (answer) sheet.sign(k, String(p));
    else sheet.signBox(k, { step: step++, tone: "is-by" });
    if (answer) put(k + 1, left, "is-left");
    else boxes(k + 1, left);
    rungs.push({ row: k, p, was });
  });

  /* EVERY RUNG IS A SHORT DIVISION, so every rung may carry. 3 into 57 goes
     1 and carries 2, and a child who has nowhere to write that 2 does it in
     their head or gets it wrong — which is exactly what the short division
     chapter refused to let them do. The little figures go in the gap in front
     of the next figure, beside it and not over it, and are struck through
     when the column they were carried into has been written.

     They are drawn AFTER every rung so that they come after the answer boxes
     in the page's order, which is the order the key answers them in. */
  rungs.forEach(({ row, p, was }) => {
    const carry = shortWork(was, p).carry;
    const wideN = String(was).length;
    carry.forEach((c, i) => {
      if (c == null) return;
      /* the figures of `was` are right-aligned, so figure i+1 from the left
         stands in place (wideN - 1 - (i + 1)) */
      const place = wideN - 2 - i;
      if (answer) sheet.carry(row, place, c, row + 1, place + 1, { beside: true, strike: true });
      else sheet.carry(row, place, null, row + 1, place + 1, { beside: true, strike: true });
    });
  });
  /* one line over the top and one down the side, the whole way to the 1 */
  sheet.stop(0, { from: 0, to: cols - 1 });
  return sheet.html("mm-col mm-ladder");
}

/**
 * What the ladder asks for, in the order the page lists it: every rung's
 * divisor and what it leaves, and THEN all the carries — which is the order
 * the sheet draws them in, and the only order the marking can pair them up.
 */
export function ladderKey(n) {
  const out = [];
  const carries = [];
  let left = n;
  primesOf(n).forEach((p) => {
    const was = left;
    left /= p;
    out.push({ kind: "by", value: p });
    String(left).split("").forEach((ch) => out.push({ kind: "left", value: Number(ch) }));
    shortWork(was, p).carry.forEach((c) => { if (c != null) carries.push({ kind: "carry", value: c }); });
  });
  return out.concat(carries);
}

/* ── the two rings ─────────────────────────────────────────────────────────
   THE PICTURE THAT GIVES BOTH ANSWERS AT ONCE. The primes of one number go in
   one ring, the primes of the other in the other, and what they share goes in
   the part that belongs to both. Then:

     the HIGHEST COMMON FACTOR is the middle, multiplied
     the LOWEST COMMON MULTIPLE is the whole picture, multiplied

   and a child can SEE why — the middle is what divides both, and the whole
   picture is the smallest thing both will go into, because taking anything
   out of it would leave one of them unable to.

   The counting is what makes it hard and the picture is what makes it easy:
   36 is 2 × 2 × 3 × 3 and 48 is 2 × 2 × 2 × 2 × 3, so the middle holds TWO 2s
   and one 3 — not "a 2 and a 3". A ring with one box per prime cannot be
   filled in wrongly in that particular way, which is why it is drawn as boxes
   and not as a list. */

const RING_R = 25;        // mm
const RING_GAP = 26;      // between the centres

export function vennHtml(a, b, { answer = false } = {}) {
  const own = { left: ownPrimes(a, b), mid: sharedPrimes(a, b), right: ownPrimes(b, a) };
  const cx1 = RING_R + 2;
  const cx2 = cx1 + RING_GAP;
  const w = cx2 + RING_R + 2;
  const h = RING_R * 2 + 4;
  const at = { left: cx1 - RING_GAP / 2 - 3, mid: (cx1 + cx2) / 2, right: cx2 + RING_GAP / 2 + 3 };

  const stack = (where, list) => {
    const cell = (v) => (answer
      ? `<span class="pf-venn__said">${v}</span>`
      : `<span class="wb-answer"></span>`);
    return `<span class="pf-venn__stack" style="left:${at[where].toFixed(1)}mm">`
      + list.map(cell).join("")
      + `</span>`;
  };

  return `<div class="pf-venn wb-nomath" style="--vn-w:${w.toFixed(1)}mm;--vn-h:${h.toFixed(1)}mm">`
    + `<svg class="pf-venn__rings" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}"`
    + ` width="${w.toFixed(1)}mm" height="${h.toFixed(1)}mm" aria-hidden="true">`
    + `<circle cx="${cx1}" cy="${(h / 2).toFixed(1)}" r="${RING_R}"/>`
    + `<circle cx="${cx2}" cy="${(h / 2).toFixed(1)}" r="${RING_R}"/>`
    + `</svg>`
    + `<span class="pf-venn__cap" style="left:${(cx1 - RING_GAP / 2 - 3).toFixed(1)}mm">${a}</span>`
    + `<span class="pf-venn__cap" style="left:${(cx2 + RING_GAP / 2 + 3).toFixed(1)}mm">${b}</span>`
    + stack("left", own.left) + stack("mid", own.mid) + stack("right", own.right)
    + `</div>`;
}

/** The three stacks, in the order the picture draws them. */
export const vennParts = (a, b) => ({
  left: ownPrimes(a, b), mid: sharedPrimes(a, b), right: ownPrimes(b, a),
});


/* ── THE TABLE OF TWO NUMBERS ──────────────────────────────────────────────
   The ladder with both numbers in it at once, which is the method every
   teacher writes on a board and the one that gives both answers from one
   piece of work.

       2 | 36  48
       2 | 18  24
       3 |  9  12          ← nothing divides both of these any more
         |  3   4

     HCF = 2 × 2 × 3                = 12     everything down the left
     LCM = 12 × 3 × 4               = 144    …times what is left at the bottom

   and that last line is the thing worth having: the LCM comes OUT of the HCF,
   so a child who has one has the other for the price of a multiplication.

   `kind` is which of the three tables it is:
     "hcf"   stop when nothing divides both, and read the HCF down the left
     "lcm"   carry on, dividing whichever will go, until both are 1; the LCM
             is everything down the left
     "both"  the first, and then the leftovers multiplied onto it
*/

/** The rows of the table: what divides both, and what it leaves. */
export function tableRows(a, b, { toOne = false } = {}) {
  const rows = [];
  let x = a;
  let y = b;
  /* while something divides BOTH */
  for (let p = 2; p <= Math.max(x, y); p++) {
    while (x % p === 0 && y % p === 0) {
      rows.push({ by: p, a: x / p, b: y / p, both: true });
      x /= p;
      y /= p;
    }
  }
  if (!toOne) return { rows, left: [x, y] };
  /* and then whatever will go into either of them, until both are 1 */
  for (let p = 2; x > 1 || y > 1; p++) {
    while (x % p === 0 || y % p === 0) {
      const nx = x % p === 0 ? x / p : x;
      const ny = y % p === 0 ? y / p : y;
      rows.push({ by: p, a: nx, b: ny, both: false });
      x = nx;
      y = ny;
    }
    if (p > Math.max(a, b)) break;
  }
  return { rows, left: [x, y] };
}

/**
 * THE TABLE ON THE PAPER — drawn as the factor ladder is drawn, because it IS
 * the factor ladder with a second number in it. Same rule down the left with
 * the divisor outside it, same columns, same bar across the top; a child who
 * has done one recognises the other at a glance, which is the entire reason
 * the two methods are taught together.
 *
 *   columns   number A's places, a column of air, then number B's places
 *   rows      0 the two numbers, and then one row per division
 *
 *   kind      "hcf" | "lcm" | "both"
 *   answer    true prints it worked
 */
export function tableHtml(a, b, { kind = "both", answer = false } = {}) {
  const { rows, left } = tableRows(a, b, { toOne: kind === "lcm" });
  const wa = String(a).length;
  const wb = String(b).length;
  const cols = wa + 1 + wb;
  /* where each number's ONES column is: A keeps the left-hand block, B the
     right-hand one, with one empty column between them */
  const onesA = wb + 1;
  const onesB = 0;

  const sheet = colSheet({ cols, places: 0, steps: answer ? null : "listed" });
  let step = 0;
  const put = (row, v, ones, cls = "") => {
    const t = String(v);
    t.split("").forEach((ch, i) => sheet.mark(row, ones + t.length - 1 - i, ch, cls));
  };
  const boxes = (row, v, ones) => {
    const t = String(v);
    for (let i = 0; i < t.length; i++) sheet.box(row, ones + t.length - 1 - i, { step: step++ });
  };

  put(0, a, onesA);
  put(0, b, onesB);
  rows.forEach((r, k) => {
    if (answer) sheet.sign(k, String(r.by));
    else sheet.signBox(k, { step: step++, tone: "is-by" });
    if (answer) {
      put(k + 1, r.a, onesA, "is-left");
      put(k + 1, r.b, onesB, "is-left");
    } else {
      boxes(k + 1, r.a, onesA);
      boxes(k + 1, r.b, onesB);
    }
  });

  /* WHERE THE HCF STOPS. On the table that answers both questions the line
     under the last shared row is the whole point: above it is what they have
     in common, below it is what is left over for the LCM. */
  if (kind !== "lcm" && rows.length) sheet.rule(rows.length, { from: 0, to: cols - 1 });

  sheet.stop(0, { from: 0, to: cols - 1 });
  return sheet.html("mm-col mm-table");
}

/** What the table asks for, row by row: the divisor, then the two numbers. */
export function tableKey(a, b, kind = "both") {
  const { rows } = tableRows(a, b, { toOne: kind === "lcm" });
  const out = [];
  rows.forEach((r) => {
    out.push({ kind: "by", value: r.by });
    String(r.a).split("").forEach((ch) => out.push({ kind: "a", value: Number(ch) }));
    String(r.b).split("").forEach((ch) => out.push({ kind: "b", value: Number(ch) }));
  });
  return out;
}

/** What is left at the foot of an HCF table — the part the LCM still needs. */
export const tableLeft = (a, b) => tableRows(a, b).left;
