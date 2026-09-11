/* ============================================================================
   Manipulatives — the fraction board, as a thing on the canvas
   ----------------------------------------------------------------------------
   The METHOD is not here. It lives in /utils/components/boards/fraction.js,
   with the long division and the column sums, and the printable workbooks'
   sidebar opens the same board. This file is what the canvas needs on top of
   it — how big the slab is, and how to paint it.

   It is the one written board that does not join in with sync. Sync hands a
   whole number from tool to tool, and a fraction sum does not hold one — any
   number it offered the blocks would be made up. So its registry entry has no
   setValue, and sync leaves it alone (sync.js `targets`).
   ========================================================================== */

import {
  ask, answer, cellsOf, checkSum, planOf, resetWork, sheetOf, showNext, workOut,
  readFraction, writeFraction, writtenSum, OPS,
  setSum as setSumOn, setWritten as setWrittenOn,
  makeFraction as newFraction, rebaseFraction as rebaseOn,
} from "/utils/components/boards/fraction.js";
import { drawSheet } from "/utils/components/boards/paint.js";
import { cssVar } from "./config.js";

export {
  ask, answer, cellsOf, checkSum, planOf, resetWork, sheetOf, showNext, workOut,
  readFraction, writeFraction, writtenSum, OPS,
};

/* One cell of working is a two-cell square of the canvas's paper, the same as
   every other written board, so they stand side by side in the same hand. */
const DIG = 2;
const SLAB = 0.22;

/** The board is as big as the working it has to hold. */
export function resize(thing) {
  const plan = planOf(thing);
  thing.l = plan.cols * DIG;
  thing.w = plan.rows * DIG;
  return thing;
}

export function makeFraction(base) {
  const thing = newFraction(base);
  thing.h = SLAB;
  thing.l = 0;
  thing.w = 0;
  return resize(thing);
}

export function setSum(thing, a, b, op) {
  const out = setSumOn(thing, a, b, op);
  if (out.ok) resize(thing);
  return out;
}
export function setWritten(thing, aText, op, bText) {
  const out = setWrittenOn(thing, aText, op, bText);
  if (out.ok) resize(thing);
  return out;
}
export function rebaseFraction(thing, base) {
  const out = rebaseOn(thing, base);
  resize(thing);
  return out;
}

/* ── drawing ──────────────────────────────────────────────────────────────── */

export function drawFraction(g, W, H, thing, c) {
  drawSheet(g, W, H, sheetOf(thing), {
    ink: c.ink,
    soft: c.soft,
    accent: cssVar("--accent-secondary", "#6fb7e8"),
    done: cssVar("--accent-success", "#7cc47c"),
  });
}
