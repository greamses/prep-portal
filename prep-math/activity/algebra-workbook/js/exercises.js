/* ============================================================================
   Algebra Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else;
   the chapters live in their own files only because they are long.

     ex-concepts.js    chapter 1, basic concepts — known and unknown, variables
                       and constants, the parts of an expression, the words
     ex-remainder.js   chapter 2, the polynomial remainder theorem — moved here
                       whole from the page it used to be (drawn by organiser.js
                       and poly.js)

   THE ORDER IS THE BOOK. The words come first because every later instruction
   is written in them: "swap x for a number" means nothing to a child who has
   not been told that x is a variable.

   A group that carries `chapter` starts a chapter in the rail. A new chapter is
   new group entries and a new ex-file, and nothing else.
   ========================================================================== */

import { BC_GROUPS, BC_EXERCISES } from "./ex-concepts.js";
import { RT_GROUPS, RT_EXERCISES } from "./ex-remainder.js";

export { LEVELS, levelOf } from "./poly.js";
export { HELP, helpOf } from "./organiser.js";

export const GROUPS = [...BC_GROUPS, ...RT_GROUPS];

export const EXERCISES = [...BC_EXERCISES, ...RT_EXERCISES];

/** Which chapter an exercise belongs to: 1 or 2. */
const CHAPTER = new Map(RT_GROUPS.map((g) => [g.id, 2]));
export const chapterOf = (ex) => CHAPTER.get(ex.group) || 1;

export function exerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

/** Why an exercise cannot run under these settings, or null. */
export function unavailable(ex, o) {
  if (ex.hardest && o.level === "gentle") return "needs Middle or Stretch";
  return null;
}

export const GROUP_IDS = GROUPS.map((g) => g.id);
