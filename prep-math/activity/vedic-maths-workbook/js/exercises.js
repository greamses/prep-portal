/* ============================================================================
   Vedic Maths Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else.

     ex-add.js      chapter 1, adding and taking away — complements (all from
                    9 and the last from 10), adding or taking away a number
                    just under a round one, and taking away with no
                    regrouping: same difference (a slider) and easy regroupers
     ex-quick.js    chapter 2, multiplying in your head — × 11, × 5 / 25 / 50,
                    same front with units making 10, vertically and crosswise,
                    and multiplying near a base
     ex-squares.js  chapter 3, squares — every squaring trick together: ending
                    in 5, ending in 1, starting with 1, same digits, near 50,
                    near 100
     ex-roots.js    chapter 4, square roots and cube roots of perfect squares
                    and cubes, read off in two looks
     ex-check.js    chapter 5, dividing by 9 with running totals, digit sums,
                    and casting out nines to check a product
     ex-trach.js    chapter 6, the Trachtenberg system — × 12, 6, 7, 5, 9
                    and 8, one digit at a time from the right

   THE ORDER IS THE BOOK: complements first, because every "near a base"
   trick after them starts by finding one; each trick met first where nothing
   carries, so the pattern itself can be seen; checking last, because by then
   there are fast answers worth checking. A new chapter is new group entries
   and a new ex-file, and nothing else.

   On screen the whole paper is a SPEED DRILL — see LIVE in subject.js.
   ========================================================================== */

import { CM_GROUPS, CM_EXERCISES } from "./ex-add.js";
import { QK_GROUPS, QK_EXERCISES } from "./ex-quick.js";
import { SQ_GROUPS, SQ_EXERCISES } from "./ex-squares.js";
import { RT_GROUPS, RT_EXERCISES } from "./ex-roots.js";
import { CK_GROUPS, CK_EXERCISES } from "./ex-check.js";
import { TR_GROUPS, TR_EXERCISES } from "./ex-trach.js";

export { LEVELS, HELP, levelOf, helpOf } from "./levels.js";

export const GROUPS = [...CM_GROUPS, ...QK_GROUPS, ...SQ_GROUPS, ...RT_GROUPS, ...CK_GROUPS, ...TR_GROUPS];
export const EXERCISES = [...CM_EXERCISES, ...QK_EXERCISES, ...SQ_EXERCISES, ...RT_EXERCISES, ...CK_EXERCISES, ...TR_EXERCISES];

/** Which chapter an exercise belongs to. */
const CHAPTER = new Map([
  ...CM_GROUPS.map((g) => [g.id, 1]),
  ...QK_GROUPS.map((g) => [g.id, 2]),
  ...SQ_GROUPS.map((g) => [g.id, 3]),
  ...RT_GROUPS.map((g) => [g.id, 4]),
  ...CK_GROUPS.map((g) => [g.id, 5]),
  ...TR_GROUPS.map((g) => [g.id, 6]),
]);
export const chapterOf = (ex) => CHAPTER.get(ex.group) || 1;

export function exerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

/** Why an exercise cannot run under these settings, or null. */
export function unavailable(ex, o) {
  if (ex.minLevel === "middle" && (o.level || "gentle") === "gentle") return "needs Middle or Stretch";
  return null;
}

export const GROUP_IDS = GROUPS.map((g) => g.id);
