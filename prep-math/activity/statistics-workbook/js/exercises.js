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
     ex-line.js     chapter 3, line graphs — from bars to a line, reading,
                    between the points, drawing one (ruled on screen with the
                    workbook's own ruler), trends, two lines, conversion graphs
                    and misleading ones (drawn by lineart.js)
     ex-pie.js      chapter 4, pie charts and proportion — equal slices, the
                    hundred-square, reading fractions / percentages / angles,
                    drawing one (radii ruled on screen), bars vs pies, the
                    share-is-not-the-number trap, and direct proportion as a
                    straight line through 0 (drawn by pieart.js)
     ex-scatter.js  chapter 5, scatter graphs — plotting (tapped on screen,
                    dotplot.js), reading, correlation, the line of best fit
                    (chosen, used, ruled), outliers and cautions (scatterart.js)

   THE ORDER IS THE BOOK: things counted before they are pictured, a picture
   of one-for-one before a key, and reading before building. A new chapter is
   new group entries and a new ex-file, and nothing else.
   ========================================================================== */

import { PG_GROUPS, PG_EXERCISES } from "./ex-picto.js";
import { BR_GROUPS, BR_EXERCISES } from "./ex-bars.js";
import { LN_GROUPS, LN_EXERCISES } from "./ex-line.js";
import { PI_GROUPS, PI_EXERCISES } from "./ex-pie.js";
import { SC_GROUPS, SC_EXERCISES } from "./ex-scatter.js";

export { LEVELS, HELP, levelOf, helpOf } from "./levels.js";

export const GROUPS = [...PG_GROUPS, ...BR_GROUPS, ...LN_GROUPS, ...PI_GROUPS, ...SC_GROUPS];
export const EXERCISES = [...PG_EXERCISES, ...BR_EXERCISES, ...LN_EXERCISES, ...PI_EXERCISES, ...SC_EXERCISES];

/** Which chapter an exercise belongs to. */
const CHAPTER = new Map([...PG_GROUPS.map((g) => [g.id, 1]), ...BR_GROUPS.map((g) => [g.id, 2]), ...LN_GROUPS.map((g) => [g.id, 3]),
  ...PI_GROUPS.map((g) => [g.id, 4]), ...SC_GROUPS.map((g) => [g.id, 5])]);
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
