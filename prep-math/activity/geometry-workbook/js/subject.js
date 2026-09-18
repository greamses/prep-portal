/* ============================================================================
   Geometry Workbook — the subject: what the engine needs to build this paper
   ----------------------------------------------------------------------------
   Kept apart from main.js (which wires the builder's dials) so that anything
   else that renders a Geometry Workbook — the assignment player at /wb/<code>
   — builds exactly the same paper from the same options.
   ========================================================================== */

import { EXERCISES, levelOf, helpOf, exerciseById, chapterOf } from "./exercises.js";
import { protractorSvg } from "./protractor.js";

export const WORKBOOK = { id: "geometry-workbook", label: "Geometry Workbook", style: "/prep-math/activity/geometry-workbook/style.css" };

const CHAPTERS = {
  1: "Chapter 1: Lines and angles", 2: "Chapter 2: Measuring angles",
  3: "Chapter 3: Polygon angles", 4: "Chapter 4: Transversal angles",
  5: "Chapter 5: Pythagoras' rule", 6: "Chapter 6: 2D transformations",
  7: "Chapter 7: Circle theorems", 8: "Chapter 8: Pyramids and prisms",
  9: "Chapter 9: Constructions", 10: "Chapter 10: Area and perimeter of triangles",
  11: "Chapter 11: Properties of polygons", 12: "Chapter 12: Parts of a circle",
};

export const SUBJECT = {
  /* Names the chapter the paper is from — or both, when it mixes them. */
  eyebrow: (o) => {
    const found = new Set((o.chosen || []).map((c) => exerciseById(c.id)).filter(Boolean).map(chapterOf));
    const list = [...found].sort((a, b) => a - b);
    const which = list.length === 1 ? CHAPTERS[list[0]]
      : `Chapters ${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
    return `Mathematics · Geometry · ${which}`;
  },
  /* Says what the level means for the chapters actually on the paper: the
     angles' step and the shapes for chapters 1–2, the sides for chapter 4. */
  subtitle: (o) => {
    const L = levelOf(o);
    const H = helpOf(o);
    const found = new Set((o.chosen || []).map((c) => exerciseById(c.id)).filter(Boolean).map(chapterOf));
    const parts = [];
    /* the chapters whose questions are angles in degrees */
    const angles = [1, 2, 3, 4, 7, 11].some((n) => found.has(n)) || !found.size;
    if (angles) parts.push(L.step === 1 ? "any whole degree" : `whole ${L.step === 10 ? "tens" : "fives"}`);
    if (found.has(3) || found.has(4) || !found.size) parts.push(`shapes up to ${L.maxSides} sides`);
    if (found.has(9) || found.has(10) || found.has(11) || found.has(12)) {
      parts.push({ gentle: "lengths in whole centimetres", middle: "lengths in half centimetres", stretch: "lengths to the millimetre" }[L.id]);
    }
    if (found.has(5)) parts.push(L.id === "stretch" ? "some sides to one decimal place" : "whole-number sides");
    if (found.has(6)) {
      parts.push({ gentle: "mirrors along the grid, half and quarter turns, scale factors 2 and 3", middle: "diagonal mirrors, turns about any point", stretch: "y = −x, hidden centres, fractional scale factors" }[L.id]);
    }
    if (found.has(12)) parts.push(L.id === "gentle" ? "π as 22/7" : "π as 3.14, one decimal place");
    parts.push(H.id === "show" ? "one done for you" : H.id === "help" ? "no examples" : "nothing named");
    return parts.join(" · ");
  },
  exercises: EXERCISES,
  /* The protractor is not an example, it is the instrument the questions tell
     you to cut out — so it prints at every level. Everything else that has a
     worked example shows it at Show me only, at the head of its own section. */
  sectionHead: (section, o) => {
    if (section.ex.alwaysWorked) return section.ex.worked(section.opts);
    if (helpOf(o).id === "show" && section.ex.worked) return section.ex.worked(section.opts);
    return "";
  },
};

/* done on screen: typed, ticked, ruled, measured, and marked */
export const LIVE = { protractor: protractorSvg() };
