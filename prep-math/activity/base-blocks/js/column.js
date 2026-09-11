/* ============================================================================
   Manipulatives — column addition, as a thing on the canvas
   ----------------------------------------------------------------------------
   The METHOD is not here. It lives in /utils/components/boards/column.js, with
   the long division and the column multiplication, because the workbook works
   the same sums on paper and one of those two places had to be the copy. It is
   neither: there is one board, and this file is what the canvas needs on top of
   it — how big the slab is, and how to paint it.
   ========================================================================== */

import {
  ask, answer, cellsOf, checkSum, defaultSum, planOf, readSum, resetWork,
  setSum as setSumOn, setTotal as setTotalOn, setWritten as setWrittenOn,
  sheetOf, showNext, makeColumn as newColumn, rebaseColumn as rebaseOn, workOut,
  MAX_ADDENDS, MAX_DIGITS, MAX_PLACES,
} from "/utils/components/boards/column.js";
import { drawSheet } from "/utils/components/boards/paint.js";
import { cssVar } from "./config.js";

export {
  ask, answer, cellsOf, checkSum, defaultSum, planOf, readSum, resetWork,
  sheetOf, showNext, workOut, MAX_ADDENDS, MAX_DIGITS, MAX_PLACES,
};

/* One figure of working is a two-cell square of the canvas's paper — the same
   square the division board uses, so two sheets standing side by side are
   written in the same hand. */
const DIG = 2;
const SLAB = 0.22;

/** The board is as big as the working it has to hold. */
export function resize(thing) {
  const plan = planOf(thing);
  thing.l = plan.cols * DIG;
  thing.w = plan.rows * DIG;
  return thing;
}

export function makeColumn(base) {
  const thing = newColumn(base);
  thing.h = SLAB;
  thing.l = 0;
  thing.w = 0;
  return resize(thing);
}

export function setSum(thing, addends, dp = 0) {
  const out = setSumOn(thing, addends, dp);
  if (out.ok) resize(thing);
  return out;
}
export function setWritten(thing, text) {
  const out = setWrittenOn(thing, text);
  if (out.ok) resize(thing);
  return out;
}
export function setTotal(thing, n) {
  const out = setTotalOn(thing, n);
  if (out) resize(thing);
  return out;
}
export function rebaseColumn(thing, base) {
  const out = rebaseOn(thing, base);
  resize(thing);
  return out;
}

/* ── drawing ──────────────────────────────────────────────────────────────── */

export function drawColumn(g, W, H, thing, c) {
  drawSheet(g, W, H, sheetOf(thing), {
    ink: c.ink,
    soft: c.soft,
    accent: cssVar("--accent-secondary", "#6fb7e8"),
    done: cssVar("--accent-success", "#7cc47c"),
  });
}
