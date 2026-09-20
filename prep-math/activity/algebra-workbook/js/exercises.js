/* ============================================================================
   Algebra Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else;
   the chapters live in their own files only because they are long.

     ex-concepts.js    chapter 1, basic concepts — known and unknown, variables
                       and constants, the parts of an expression, the words
     ex-bars.js        chapter 2, the bar model — linear equations drawn as
                       strips of paper before they are rearranged (barart.js)
     ex-balance.js     chapter 3, the balance scale — the same equations as a
                       level scale, where the MOVE is what is being taught
                       (balanceart.js)
     ex-two.js         chapter 3's last section: TWO linked scales — two
                       equations at once, solved by carrying what one scale
                       says into the other (the shared
                       utils/components/workbook/scales.js, blocks and all)
     ex-remainder.js   chapter 4, the polynomial remainder theorem — moved here
                       whole from the page it used to be (drawn by organiser.js
                       and poly.js)
     ex-laws.js        chapter 5, properties and identities — the laws of
                       arithmetic seen in dots, strips and counters, then the
                       identities as squares and rectangles (propart.js)
     ex-func.js        chapter 6, functions — function machines run, run
                       backwards and BUILT from job cards (the shared
                       utils/components/workbook/machine.js), formulas, the
                       order of the jobs, mappings, f(x) and composition
     ex-seq.js         chapter 6 again, its last two sections: sequences — the
                       machine fed with the PLACE of a term (growing patterns
                       drawn by seqart.js, the rule built as a train, the 50th
                       term, and whether a number is in the sequence at all)
     ex-graphs.js      chapter 7, graphs of functions — rule → table → points
                       (tapped, the shared dotplot.js), ruling the line, reading
                       it, gradient and intercept, solving with graphs, and a
                       first curve (drawn by gridart.js)

   THE ORDER IS THE BOOK. The words come first because every later instruction
   is written in them: "swap x for a number" means nothing to a child who has
   not been told that x is a variable. Then the bar model, which is a linear
   equation you can point at — and a child who has solved 3x + 4 = 19 by
   drawing it has done the arithmetic the remainder theorem will ask for.

   A group that carries `chapter` starts a chapter in the rail. A new chapter is
   new group entries and a new ex-file, and nothing else.

   THE BAR MODEL AND THE BALANCE ARE NOT THE SAME LESSON, which is why they are
   two chapters and in this order. The bar says what an equation MEANS; the
   balance says what you may DO to it, and it is the one that can draw an
   unknown on both sides.
   ========================================================================== */

import { BC_GROUPS, BC_EXERCISES } from "./ex-concepts.js";
import { BM_GROUPS, BM_EXERCISES } from "./ex-bars.js";
import { BS_GROUPS, BS_EXERCISES } from "./ex-balance.js";
import { TW_GROUPS, TW_EXERCISES } from "./ex-two.js";
import { RT_GROUPS, RT_EXERCISES } from "./ex-remainder.js";
import { AP_GROUPS, AP_EXERCISES } from "./ex-laws.js";
import { FN_GROUPS, FN_EXERCISES } from "./ex-func.js";
import { SQ_GROUPS, SQ_EXERCISES } from "./ex-seq.js";
import { GR_GROUPS, GR_EXERCISES } from "./ex-graphs.js";

export { LEVELS, levelOf } from "./poly.js";
export { HELP, helpOf } from "./organiser.js";

export const GROUPS = [...BC_GROUPS, ...BM_GROUPS, ...BS_GROUPS, ...TW_GROUPS, ...RT_GROUPS, ...AP_GROUPS, ...FN_GROUPS, ...SQ_GROUPS, ...GR_GROUPS];

export const EXERCISES = [...BC_EXERCISES, ...BM_EXERCISES, ...BS_EXERCISES, ...TW_EXERCISES, ...RT_EXERCISES, ...AP_EXERCISES, ...FN_EXERCISES, ...SQ_EXERCISES, ...GR_EXERCISES];

/** Which chapter an exercise belongs to: 1 to 5. */
const CHAPTER = new Map([
  ...BM_GROUPS.map((g) => [g.id, 2]),
  ...BS_GROUPS.map((g) => [g.id, 3]), ...TW_GROUPS.map((g) => [g.id, 3]),
  ...RT_GROUPS.map((g) => [g.id, 4]),
  ...AP_GROUPS.map((g) => [g.id, 5]),
  ...FN_GROUPS.map((g) => [g.id, 6]), ...SQ_GROUPS.map((g) => [g.id, 6]),
  ...GR_GROUPS.map((g) => [g.id, 7]),
]);
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
