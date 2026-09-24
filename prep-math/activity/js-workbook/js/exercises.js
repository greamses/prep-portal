/* ============================================================================
   JavaScript Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else.

     ex-types.js   chapter 1, data types — naming the kind of a value, what
                   quote marks change, typeof, the first program of their own
                   (written and RUN in a code box, utils/components/workbook/
                   code.js), null and undefined, "2" + 2 and Number(), and
                   let/const keeping the kind of what is in the box

   THE ORDER IS THE BOOK: noticed before named, named before asked about, and
   nothing written by the child until they have read three programs. A new
   chapter is new group entries and a new ex-file, and nothing else.
   ========================================================================== */

import { DT_GROUPS, DT_EXERCISES } from "./ex-types.js";

export { LEVELS, HELP, levelOf, helpOf } from "./levels.js";

export const GROUPS = [...DT_GROUPS];
export const EXERCISES = [...DT_EXERCISES];

/** Which chapter an exercise belongs to. */
const CHAPTER = new Map([...DT_GROUPS.map((g) => [g.id, 1])]);
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
