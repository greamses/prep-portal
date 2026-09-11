/* ============================================================================
   Manipulatives — column multiplication, as a thing on the canvas
   ----------------------------------------------------------------------------
   The METHOD is not here. It lives in /utils/components/boards/times.js, with
   the long division and the column addition. This file is what the canvas needs
   on top of it — how big the slab is, and how to paint it.
   ========================================================================== */

import {
  ask, answer, cellsOf, checkSum, defaultSum, multiplicandOf, planOf, resetWork,
  setProduct as setProductOn, setSum as setSumOn, setWritten as setWrittenOn,
  sheetOf, showNext, makeTimes as newTimes, rebaseTimes as rebaseOn, workOut,
  MAX_BY, MAX_DIGITS, MAX_PLACES,
} from "/utils/components/boards/times.js";
import { drawSheet } from "/utils/components/boards/paint.js";
import { cssVar } from "./config.js";

export {
  ask, answer, cellsOf, checkSum, defaultSum, multiplicandOf, planOf, resetWork,
  sheetOf, showNext, workOut, MAX_BY, MAX_DIGITS, MAX_PLACES,
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

export function makeTimes(base) {
  const thing = newTimes(base);
  thing.h = SLAB;
  thing.l = 0;
  thing.w = 0;
  return resize(thing);
}

export function setSum(thing, multiplicand, multiplier, dpA = 0, dpB = 0) {
  const out = setSumOn(thing, multiplicand, multiplier, dpA, dpB);
  if (out.ok) resize(thing);
  return out;
}
export function setWritten(thing, aText, bText) {
  const out = setWrittenOn(thing, aText, bText);
  if (out.ok) resize(thing);
  return out;
}
export function setProduct(thing, n) {
  const out = setProductOn(thing, n);
  if (out) resize(thing);
  return out;
}
export function rebaseTimes(thing, base) {
  const out = rebaseOn(thing, base);
  resize(thing);
  return out;
}

/* ── drawing ──────────────────────────────────────────────────────────────── */

export function drawTimes(g, W, H, thing, c) {
  drawSheet(g, W, H, sheetOf(thing), {
    ink: c.ink,
    soft: c.soft,
    accent: cssVar("--accent-secondary", "#6fb7e8"),
    done: cssVar("--accent-success", "#7cc47c"),
  });
}
