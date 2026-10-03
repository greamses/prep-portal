/* ============================================================================
   Vedic Maths Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else.

     ex-quick.js   chapter 1, multiplying in your head — × 11, × 5 / 25 / 50,
                   squares ending in 5, same front with units making 10, and
                   vertically and crosswise
     ex-base.js    chapter 2, working from a base — all from 9 and the last
                   from 10, multiplying near a base, squares near a base, and
                   dividing by 9
     ex-check.js   chapter 3, checking an answer — digit sums, and casting
                   out nines to check a product

   THE ORDER IS THE BOOK: each trick is a PATTERN, met first where nothing
   carries, so the pattern itself can be seen; the checking chapter comes last
   because by then there are fast answers worth checking. A new chapter is new
   group entries and a new ex-file, and nothing else.
   ========================================================================== */

import { QK_GROUPS, QK_EXERCISES } from "./ex-quick.js";
import { BS_GROUPS, BS_EXERCISES } from "./ex-base.js";
import { CK_GROUPS, CK_EXERCISES } from "./ex-check.js";

export { LEVELS, HELP, levelOf, helpOf } from "./levels.js";

export const GROUPS = [...QK_GROUPS, ...BS_GROUPS, ...CK_GROUPS];
export const EXERCISES = [...QK_EXERCISES, ...BS_EXERCISES, ...CK_EXERCISES];

/** Which chapter an exercise belongs to. */
const CHAPTER = new Map([
  ...QK_GROUPS.map((g) => [g.id, 1]),
  ...BS_GROUPS.map((g) => [g.id, 2]),
  ...CK_GROUPS.map((g) => [g.id, 3]),
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
