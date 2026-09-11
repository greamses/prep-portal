/* ============================================================================
   Manipulatives — long division, as a thing on the canvas
   ----------------------------------------------------------------------------
   The METHOD is not here. It lives in /utils/components/boards/longdiv.js, with
   the column addition and the column multiplication, because the workbook works
   the same sums on paper and one of those two places had to be the copy. It is
   neither: there is one board, and this file is what the canvas needs on top of
   it — how big the slab is, and how to paint it.

   Everything the panel asks of a board (sheets.js) is re-exported straight
   through, so nothing else in here had to change when the method moved.
   ========================================================================== */

import {
  ask, answer, bringDown, cellsOf, checkSum, defaultSum, leftToShare, planOf,
  resetWork, setDividend as setDividendOn, setSum as setSumOn, setWritten as setWrittenOn,
  sheetOf, showNext, makeLongDiv as newLongDiv, rebaseLongDiv as rebaseOn, workOut,
  MAX_DIGITS, MAX_DIVISOR, MAX_PLACES,
} from "/utils/components/boards/longdiv.js";
import { drawSheet } from "/utils/components/boards/paint.js";
import { cssVar } from "./config.js";

export {
  ask, answer, bringDown, cellsOf, checkSum, defaultSum, leftToShare, planOf,
  resetWork, sheetOf, showNext, workOut, MAX_DIGITS, MAX_DIVISOR, MAX_PLACES,
};

/* One digit of working is a two-cell square of the canvas's paper — the same
   size a table's cell is, so a division board and a times table standing side
   by side are written in the same hand. */
const DIG = 2;
const SLAB = 0.22;

/** The board is as big as the working it has to hold. */
export function resize(thing) {
  const plan = planOf(thing);
  thing.l = plan.cols * DIG;
  thing.w = plan.rows * DIG;
  return thing;
}

export function makeLongDiv(base) {
  const thing = newLongDiv(base);
  thing.h = SLAB;
  thing.l = 0;
  thing.w = 0;
  return resize(thing);
}

/* The three ways the sum on the board changes. Each one can make the working
   taller or wider, so each one measures the slab again. */
export function setSum(thing, dividend, divisor, dpA = 0, dpB = 0) {
  const out = setSumOn(thing, dividend, divisor, dpA, dpB);
  if (out.ok) resize(thing);
  return out;
}
export function setWritten(thing, dividendText, divisorText) {
  const out = setWrittenOn(thing, dividendText, divisorText);
  if (out.ok) resize(thing);
  return out;
}
export function setDividend(thing, n) {
  const out = setDividendOn(thing, n);
  if (out) resize(thing);
  return out;
}
export function rebaseLongDiv(thing, base) {
  const out = rebaseOn(thing, base);
  resize(thing);
  return out;
}

/* ── drawing ──────────────────────────────────────────────────────────────── */

export function drawLongDiv(g, W, H, thing, c) {
  drawSheet(g, W, H, sheetOf(thing), {
    ink: c.ink,
    soft: c.soft,
    accent: cssVar("--accent-secondary", "#6fb7e8"),
    done: cssVar("--accent-success", "#7cc47c"),
  });
}
