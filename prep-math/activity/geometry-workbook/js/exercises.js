/* ============================================================================
   Geometry Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else;
   the families live in their own files only because they are long.

     ex-triangles.js     the triangle sum, angles inside, angles outside
     ex-polygons.js      cutting shapes into triangles, the polygon sum, each angle
     ex-words.js         word problems
     ex-transversals.js  chapter 2, all of it
     ex-solids.js        chapter 3, all of it (drawn by solid.js)
     ex-pythagoras.js    chapter 4, all of it (drawn by pythag.js)
     ex-transform.js     chapter 5, all of it (drawn by transform.js)
     ex-circles.js       chapter 6, all of it (drawn by circle.js)

   THE ORDER IS THE BOOK, and it is the order it was asked for.

   Chapter 1 — Polygon angles
     1  angles in a triangle add up to 180° — found with a protractor and by
        tearing the corners off, before it is ever called a rule
     2  cutting shapes into triangles — the idea everything after depends on
     3  finding angles inside a triangle
     4  the angles of any shape
     5  finding each angle
     6  word problems
     7  exterior angles of a triangle

   Chapter 2 — Transversal angles
     parallel lines · transversal lines · the eight angles · acute or obtuse ·
     vertically opposite · corresponding · alternate · consecutive interior ·
     consecutive exterior · multiple transversals · triangles on transversals

   Chapter 3 — Pyramids and prisms
     faces, edges and corners · stick shapes · faces and surfaces · side and
     base faces · pyramid or prism by the bases, by the side faces · nets ·
     the rule for faces, edges and corners · surface area · volume · real-world
     practicals · one base open · both bases open · the frustum

   Chapter 4 — Pythagoras' rule
     right-angled triangles · the sides of a right-angled triangle · forming
     squares from the sides · sum of sides · difference of sides · the
     Pythagorean formula · Pythagorean triples

   Chapter 5 — 2D transformations
     what a transformation is · translation · reflection · rotation ·
     scaling (enlargement) · describe the transformation

   Chapter 6 — Circle theorems
     parts of a circle · radii and isosceles triangles · the angle at the
     centre · the angle in a semicircle · angles in the same segment · cyclic
     quadrilaterals · tangents · chords · the alternate segment theorem ·
     give the reason

   The section letters printed on the paper follow this list, so a workbook
   printed with every section ticked reads front to back as a book. A group
   that carries `chapter` starts a chapter in the rail.

   A third chapter is new group entries and a new ex-file, and nothing else.
   ========================================================================== */

import {
  TRI_GROUPS, TRI_EXERCISES, INSIDE_GROUPS, INSIDE_EXERCISES, EXT_GROUPS, EXT_EXERCISES,
} from "./ex-triangles.js";
import {
  DECOMP_GROUPS, DECOMP_EXERCISES, POLY_GROUPS, POLY_SUM_EXERCISES, POLY_EACH_EXERCISES,
} from "./ex-polygons.js";
import { WORD_GROUPS, WORD_EXERCISES } from "./ex-words.js";
import { TRANS_GROUPS, TRANS_EXERCISES } from "./ex-transversals.js";
import { SOLID_GROUPS, SOLID_EXERCISES } from "./ex-solids.js";
import { PY_GROUPS, PY_EXERCISES } from "./ex-pythagoras.js";
import { TF_GROUPS, TF_EXERCISES } from "./ex-transform.js";
import { CI_GROUPS, CI_EXERCISES } from "./ex-circles.js";

export { LEVELS, HELP, levelOf, helpOf } from "./levels.js";

export const GROUPS = [
  ...TRI_GROUPS,
  ...DECOMP_GROUPS,
  ...INSIDE_GROUPS,
  ...POLY_GROUPS,
  ...WORD_GROUPS,
  ...EXT_GROUPS,
  ...TRANS_GROUPS,
  ...SOLID_GROUPS,
  ...PY_GROUPS,
  ...TF_GROUPS,
  ...CI_GROUPS,
];

export const EXERCISES = [
  ...TRI_EXERCISES,
  ...DECOMP_EXERCISES,
  ...INSIDE_EXERCISES,
  ...POLY_SUM_EXERCISES,
  ...POLY_EACH_EXERCISES,
  ...WORD_EXERCISES,
  ...EXT_EXERCISES,
  ...TRANS_EXERCISES,
  ...SOLID_EXERCISES,
  ...PY_EXERCISES,
  ...TF_EXERCISES,
  ...CI_EXERCISES,
];

/** Which chapter an exercise belongs to: 1 to 6. */
const CHAPTER = new Map([
  ...TRANS_GROUPS.map((g) => [g.id, 2]),
  ...SOLID_GROUPS.map((g) => [g.id, 3]),
  ...PY_GROUPS.map((g) => [g.id, 4]),
  ...TF_GROUPS.map((g) => [g.id, 5]),
  ...CI_GROUPS.map((g) => [g.id, 6]),
]);
export const chapterOf = (ex) => CHAPTER.get(ex.group) || 1;

export function exerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

export const GROUP_IDS = GROUPS.map((g) => g.id);
