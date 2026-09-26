/* ============================================================================
   Maths Workbook — a sum written both ways
   ----------------------------------------------------------------------------
   The same addition, written ACROSS and written DOWN, on the same question.

   That pairing is the whole reason this organiser exists. A child who can do
   23 + 14 across the page and is then handed a column of figures often does
   not recognise it as the sum they just did — they have learned two rituals
   instead of one idea. Printed side by side with the blocks that make both of
   them true, the three are one thing seen three ways.

   THE COLUMN IS RULED LIKE A CHART. Ones under ones, tens under tens, with a
   faint line between the places, because the single thing that goes wrong in a
   written sum is a digit in the wrong column. The carry (or the exchange) has
   its own small box above the column it belongs to, so a child who has been
   taught to "put the one over there" has somewhere exact to put it.
   ========================================================================== */

import { colSheet, figuresOf, topOf } from "./colsheet.js";

/* ── the sum written across ────────────────────────────────────────────────*/

/** 23 + 14 = ___ . The answer is a box, never a ruled line: it holds figures. */
export function across(a, b, op, { answer = null } = {}) {
  const sign = op === "-" ? "−" : "+";
  return (
    `<span class="ms-across">` +
    `<span class="ms-across__n">${a}</span>` +
    `<span class="ms-across__op">${sign}</span>` +
    `<span class="ms-across__n">${b}</span>` +
    `<span class="ms-across__op">=</span>` +
    (answer === null ? `<span class="ms-across__box"></span>` : `<b>${answer}</b>`) +
    `</span>`
  );
}

/* ── the sum written down ──────────────────────────────────────────────────*/

/**
 * The column form.
 *
 * `carries` is the row of small boxes above the sum. It is printed EMPTY for a
 * question that needs regrouping and left out entirely for one that does not —
 * a carry box on a sum with no carry is a box a child dutifully writes a 0 in.
 *
 * `answer` fills the line under the rule in, which only the worked example does.
 */
export function down(a, b, op, { places = 2, carries = false, answer = null } = {}) {
  /* HOW WIDE THE SUM IS. As wide as the numbers, and one column wider when the
     answer really does spill into a place neither of them has — 91 + 34 is
     three figures. Not one wider always: a column that is only ever going to
     be left empty is a column a child dutifully writes a 0 in. */
  const total = op === "-" ? a - b : a + b;
  const top = topOf(total);
  const cols = colsFor(total, places);
  const A = figuresOf(a, places);
  const B = figuresOf(b, places);
  const S = figuresOf(total, cols);
  /* worked out whether or not it is shown: the sheet needs to know WHERE the
     carrying happens even when it is the child who has to do it */
  const figures = carriesOf(a, b, op, places);

  /* tags, carries, the first number, the second with the rule under it, the
     answer — the order they are written in */
  const sheet = colSheet({ cols, places, steps: answer === null ? "rtl" : null });
  sheet.tags();
  let row = 1;
  if (carries && figures.some((c) => c != null)) {
    /* A box where a carry is really made and nowhere else. Adding, that is
       above the column the ten goes INTO — never the ones, nothing has ever
       been carried into the ones. Taking away, it is every column the exchange
       changed, the ones included: twelve has to be written somewhere. */
    const carryRow = row++;
    sheet.carries(carryRow, figures, { under: carryRow + 3, show: answer !== null });
  }
  const rowA = row++;
  for (let p = 0; p < places; p++) sheet.mark(rowA, p, A[p]);
  const rowB = row++;
  sheet.sign(rowB, op === "-" ? "−" : "+");
  for (let p = 0; p < places; p++) sheet.mark(rowB, p, B[p]);
  sheet.rule(rowB, { heavy: true });
  const rowS = row++;
  if (answer === null) sheet.boxes(rowS, top);
  else for (let p = top; p >= 0; p--) sheet.mark(rowS, p, S[p]);
  return sheet.html();
}

/**
 * How many columns a written sum has — and so how many boxes its answer is,
 * which the exercise's key has to agree with exactly.
 */
export const colsFor = (total, places) => Math.max(places, topOf(total) + 1);

/**
 * WHAT GOES IN THE CARRY BOX, when the sum is worked for the child.
 *
 * Adding, it is the ten that moved on — a 1. Taking away, it is what the column
 * has LEFT after lending, which is the figure a child is told to write above the
 * column they crossed out, and what the column it lent TO has become.
 *
 * Printed blank for a question, written in for the one done for them: a worked
 * example with empty carry boxes has shown the answer and hidden the only step
 * that was difficult. Either way this says WHERE the boxes go, so a sum is only
 * ever asked for the carries it really makes.
 */
export function carriesOf(a, b, op, places) {
  const A = figuresOf(a, places);
  const B = figuresOf(b, places);
  const out = [];
  if (op === "-") {
    const lent = [];
    let borrow = 0;
    for (let p = 0; p < places; p++) {
      let have = A[p] - borrow;
      borrow = 0;
      if (have < B[p]) { have += 10; borrow = 1; lent[p + 1] = 1; }
      /* a column that gave a ten away, or was given one, is no longer the
         figure printed under it — so it says what it is now */
      if (lent[p] || borrow) out[p] = have;
    }
    return out;
  }
  let carry = 0;
  for (let p = 0; p < places; p++) {
    carry = A[p] + B[p] + carry >= 10 ? 1 : 0;
    if (carry) out[p + 1] = 1;
  }
  return out;
}

/* ── the two together ──────────────────────────────────────────────────────*/

/**
 * The pairing this file exists for: the blocks, then the sum across, then the
 * same sum down. Always in that order — concrete, then the notation a child
 * already reads, then the notation they are learning.
 */
export function bothWays(a, b, op, opts = {}) {
  return (
    `<div class="ms-ways">` +
    `<div class="ms-ways__across">${across(a, b, op, opts)}</div>` +
    `<div class="ms-ways__down">${down(a, b, op, opts)}</div>` +
    `</div>`
  );
}
