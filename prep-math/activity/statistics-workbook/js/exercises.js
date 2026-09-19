/* ============================================================================
   Statistics Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else.

     ex-picto.js    chapter 1, pictograms — sorting and counting, tally marks,
                    reading with and without a key, part symbols, building one
                    (tapped on screen, utils/components/workbook/picto.js), and
                    problems (drawn by pictoart.js)
     ex-bars.js     chapter 2, bar charts — block graphs, reading a scale,
                    drawing one (tapped on screen, barbuild.js), two groups
                    compared, and problems (drawn by barart.js)

   THE ORDER IS THE BOOK: things counted before they are pictured, a picture
   of one-for-one before a key, and reading before building. A new chapter is
   new group entries and a new ex-file, and nothing else.
   ========================================================================== */

import { PG_GROUPS, PG_EXERCISES } from "./ex-picto.js";
import { BR_GROUPS, BR_EXERCISES } from "./ex-bars.js";

export { LEVELS, HELP, levelOf, helpOf } from "./levels.js";

export const GROUPS = [...PG_GROUPS, ...BR_GROUPS];
export const EXERCISES = [...PG_EXERCISES, ...BR_EXERCISES];

/** Which chapter an exercise belongs to. */
const CHAPTER = new Map([...PG_GROUPS.map((g) => [g.id, 1]), ...BR_GROUPS.map((g) => [g.id, 2])]);
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
