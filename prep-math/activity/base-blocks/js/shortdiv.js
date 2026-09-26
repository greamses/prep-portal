/* ============================================================================
   Manipulatives — short division, as a thing on the canvas
   ----------------------------------------------------------------------------
   The METHOD is not here. It lives in /utils/components/boards/shortdiv.js,
   beside the other written boards. This file is what the canvas needs on top of
   it — how big the slab is, and how to paint it.

   No blocks laid out beside it, unlike the long division: the whole point of
   the short one is that the sharing out happens in your head and only the
   carried figures reach the paper. What it does join in with is the number
   being passed round the canvas, and there it hands over what is still to be
   divided rather than what it started with.
   ========================================================================== */

import {
  ask, answer, cellsOf, checkSum, leftToDivide, planOf, resetWork,
  setDividend as setDividendOn, setSum as setSumOn, setWritten as setWrittenOn,
  sheetOf, showNext, makeShortDiv as newShortDiv, rebase as rebaseOn, workOut,
  MAX_DIGITS,
} from "/utils/components/boards/shortdiv.js";
import { drawSheet } from "/utils/components/boards/paint.js";
import { cssVar } from "./config.js";

export {
  ask, answer, cellsOf, checkSum, leftToDivide, planOf, resetWork,
  sheetOf, showNext, workOut, MAX_DIGITS,
};

const DIG = 2;
const SLAB = 0.22;

/** The board is as big as the working it has to hold. */
export function resize(thing) {
  const plan = planOf(thing);
  thing.l = plan.cols * DIG;
  thing.w = plan.rows * DIG;
  return thing;
}

export function makeShortDiv(base) {
  const thing = newShortDiv(base);
  thing.h = SLAB;
  thing.l = 0;
  thing.w = 0;
  return resize(thing);
}

export function setSum(thing, n, d) {
  const out = setSumOn(thing, n, d);
  if (out.ok) resize(thing);
  return out;
}
export function setWritten(thing, nText, dText) {
  const out = setWrittenOn(thing, nText, dText);
  if (out.ok) resize(thing);
  return out;
}
export function setDividend(thing, n) {
  const out = setDividendOn(thing, n);
  if (out) resize(thing);
  return out;
}
export function rebaseShortDiv(thing, base) {
  const out = rebaseOn(thing, base);
  resize(thing);
  return out;
}

/* ── drawing ──────────────────────────────────────────────────────────────── */

export function drawShortDiv(g, W, H, thing, c) {
  drawSheet(g, W, H, sheetOf(thing), {
    ink: c.ink,
    soft: c.soft,
    accent: cssVar("--accent-secondary", "#6fb7e8"),
    done: cssVar("--accent-success", "#7cc47c"),
  });
}
