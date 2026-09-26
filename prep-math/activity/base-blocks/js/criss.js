/* ============================================================================
   Manipulatives — the criss-cross, as a thing on the canvas
   ----------------------------------------------------------------------------
   The METHOD is not here. It lives in /utils/components/boards/criss.js, beside
   the other written boards, because the workbook works the same sums on paper
   and one of those two places had to be the copy. It is neither: there is one
   board, and this file is what the canvas needs on top of it — how big the slab
   is, and how to paint it.

   It stands next to the column multiplication on purpose. They are the same
   arithmetic and the same answer worked in a different order — one row at a
   time against one column of the answer at a time — and a child who has only
   ever seen one of them does not know that there is a choice.
   ========================================================================== */

import {
  ask, answer, cellsOf, checkSum, crossings, multiplicandOf, planOf, resetWork,
  setMultiplicand as setMultiplicandOn, setSum as setSumOn,
  setWritten as setWrittenOn, sheetOf, showNext, makeCriss as newCriss,
  rebase as rebaseOn, workOut, MAX_DIGITS, MAX_WIDE,
} from "/utils/components/boards/criss.js";
import { drawSheet } from "/utils/components/boards/paint.js";
import { cssVar } from "./config.js";

export {
  ask, answer, cellsOf, checkSum, crossings, multiplicandOf, planOf, resetWork,
  sheetOf, showNext, workOut, MAX_DIGITS, MAX_WIDE,
};

/* One digit of working is a two-cell square of the canvas's paper — the same
   size a table's cell is, so a criss-cross and a times table standing side by
   side are written in the same hand. */
const DIG = 2;
const SLAB = 0.22;

/** The board is as big as the working it has to hold. */
export function resize(thing) {
  const plan = planOf(thing);
  thing.l = plan.cols * DIG;
  thing.w = plan.rows * DIG;
  return thing;
}

export function makeCriss(base) {
  const thing = newCriss(base);
  thing.h = SLAB;
  thing.l = 0;
  thing.w = 0;
  return resize(thing);
}

/* Every way the sum on the board changes. Each one can make the working wider,
   so each one measures the slab again. */
export function setSum(thing, a, b) {
  const out = setSumOn(thing, a, b);
  if (out.ok) resize(thing);
  return out;
}
export function setWritten(thing, aText, bText) {
  const out = setWrittenOn(thing, aText, bText);
  if (out.ok) resize(thing);
  return out;
}
export function setMultiplicand(thing, n) {
  const out = setMultiplicandOn(thing, n);
  if (out) resize(thing);
  return out;
}
export function rebaseCriss(thing, base) {
  const out = rebaseOn(thing, base);
  resize(thing);
  return out;
}

/* ── drawing ──────────────────────────────────────────────────────────────── */

export function drawCriss(g, W, H, thing, c) {
  drawSheet(g, W, H, sheetOf(thing), {
    ink: c.ink,
    soft: c.soft,
    accent: cssVar("--accent-secondary", "#6fb7e8"),
    done: cssVar("--accent-success", "#7cc47c"),
  });
}
