/* ============================================================================
   Competition Word Problems — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else.

     ex-a.js   chapters 1 to 4: ages, alligation and mixture, HCF and LCM,
               ratio (compound, squared and cubed)
     ex-b.js   chapters 5 to 8: algebraic fractions, systems of equations,
               sequence and series, arrangements and selections
     ex-c.js   chapters 9 to 11: probability trees, percentages, the
               remainder theorem

   Every section is a BANK of story templates (common.js), each making its
   problem from the answer. The level picks which templates are in play:
   Foundation leaves the hardest out, Challenge lets every one in. A new
   chapter is a new group with a `chapter` label, its banks, and a line in
   CHAPTER below.
   ========================================================================== */

import { A_GROUPS, A_EXERCISES } from "./ex-a.js";
import { B_GROUPS, B_EXERCISES } from "./ex-b.js";
import { C_GROUPS, C_EXERCISES } from "./ex-c.js";

export { LEVELS, HELP, levelOf, helpOf } from "./levels.js";

export const GROUPS = [...A_GROUPS, ...B_GROUPS, ...C_GROUPS];
export const EXERCISES = [...A_EXERCISES, ...B_EXERCISES, ...C_EXERCISES];

/** Which chapter an exercise belongs to: the groups are in book order. */
const CHAPTER = new Map(GROUPS.map((g, i) => [g.id, i + 1]));
export const chapterOf = (ex) => CHAPTER.get(ex.group) || 1;

export function exerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

/** Why an exercise cannot run under these settings, or null. */
export function unavailable(ex, o) {
  if (ex.hardest && o.level === "gentle") return "needs Standard or Challenge";
  if (ex.minLevel === "stretch" && o.level !== "stretch") return "needs Challenge";
  return null;
}

export const GROUP_IDS = GROUPS.map((g) => g.id);
