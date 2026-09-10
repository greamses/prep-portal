/* ============================================================================
   Geometry Workbook — the subject: what the engine needs to build this paper
   ----------------------------------------------------------------------------
   Kept apart from main.js (which wires the builder's dials) so that anything
   else that renders a Geometry Workbook — the assignment player at /wb/<code>
   — builds exactly the same paper from the same options.
   ========================================================================== */

import { EXERCISES, levelOf, helpOf, exerciseById, chapterOf } from "./exercises.js";
import { protractorSvg } from "../../maths-workbook/js/protractor.js";

export const WORKBOOK = { id: "geometry-workbook", label: "Geometry Workbook", style: "/prep-math/activity/geometry-workbook/style.css" };

const CHAPTERS = {
  1: "Chapter 1: Polygon angles", 2: "Chapter 2: Transversal angles",
  3: "Chapter 3: Pyramids and prisms", 4: "Chapter 4: Pythagoras' rule",
};

export const SUBJECT = {
  /* Names the chapter the paper is from — or both, when it mixes them. */
  eyebrow: (o) => {
    const found = new Set((o.chosen || []).map((c) => exerciseById(c.id)).filter(Boolean).map(chapterOf));
    const list = [...found].sort();
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
    if (found.has(1) || found.has(2) || !found.size) {
      parts.push(L.step === 1 ? "any whole degree" : `whole ${L.step === 10 ? "tens" : "fives"}`);
      parts.push(`shapes up to ${L.maxSides} sides`);
    }
    if (found.has(4)) parts.push(L.id === "stretch" ? "some sides to one decimal place" : "whole-number sides");
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
