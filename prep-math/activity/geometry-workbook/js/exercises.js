/* ============================================================================
   Geometry Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else;
   the families live in their own files only because they are long.

     ex-triangles.js   the triangle sum, angles inside, angles outside
     ex-polygons.js    cutting shapes into triangles, the polygon sum, each angle
     ex-words.js       word problems

   THE ORDER IS THE CHAPTER, and it is the order it was asked for:

     1  angles in a triangle add up to 180° — found with a protractor and by
        tearing the corners off, before it is ever called a rule
     2  cutting shapes into triangles — the idea everything after depends on
     3  finding angles inside a triangle
     4  the angles of any shape
     5  finding each angle
     6  word problems
     7  exterior angles of a triangle

   The section letters printed on the paper follow this list, so a workbook
   printed with every section ticked reads front to back as a chapter.

   This is chapter one — Angles — of a geometry workbook that is meant to grow.
   A second chapter is new group entries and a new ex-file, and nothing else.
   ========================================================================== */

import {
  TRI_GROUPS, TRI_EXERCISES, INSIDE_GROUPS, INSIDE_EXERCISES, EXT_GROUPS, EXT_EXERCISES,
} from "./ex-triangles.js";
import {
  DECOMP_GROUPS, DECOMP_EXERCISES, POLY_GROUPS, POLY_SUM_EXERCISES, POLY_EACH_EXERCISES,
} from "./ex-polygons.js";
import { WORD_GROUPS, WORD_EXERCISES } from "./ex-words.js";

export { LEVELS, HELP, levelOf, helpOf } from "./levels.js";

export const GROUPS = [
  ...TRI_GROUPS,
  ...DECOMP_GROUPS,
  ...INSIDE_GROUPS,
  ...POLY_GROUPS,
  ...WORD_GROUPS,
  ...EXT_GROUPS,
];

export const EXERCISES = [
  ...TRI_EXERCISES,
  ...DECOMP_EXERCISES,
  ...INSIDE_EXERCISES,
  ...POLY_SUM_EXERCISES,
  ...POLY_EACH_EXERCISES,
  ...WORD_EXERCISES,
  ...EXT_EXERCISES,
];

export function exerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

/** Why an exercise cannot run at this level, said rather than hidden. */
export function unavailable(ex, o) {
  if (ex.hardest && o.level === "gentle") return "needs Middle or Stretch";
  return null;
}

export const GROUP_IDS = GROUPS.map((g) => g.id);
