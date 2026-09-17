/* ============================================================================
   Algebra Workbook — the subject: what the engine needs to build this paper
   ----------------------------------------------------------------------------
   Kept apart from main.js (which wires the builder's dials) so that anything
   else that renders an Algebra Workbook — the assignment player at /wb/<code>
   — builds exactly the same paper from the same options.
   ========================================================================== */

import { EXERCISES, levelOf, helpOf, unavailable, exerciseById, chapterOf } from "./exercises.js";

export const WORKBOOK = { id: "algebra-workbook", label: "Algebra Workbook", style: "/prep-math/activity/algebra-workbook/style.css" };

const CHAPTERS = {
  1: "Chapter 1: Basic concepts",
  2: "Chapter 2: The bar model",
  3: "Chapter 3: The balance scale",
  4: "Chapter 4: The remainder theorem",
};

const chaptersOn = (o) => [...new Set((o.chosen || [])
  .map((c) => exerciseById(c.id))
  .filter(Boolean)
  .map(chapterOf))].sort((a, b) => a - b);

export const SUBJECT = {
  eyebrow: (o) => {
    const list = chaptersOn(o);
    const which = !list.length ? "Something to print"
      : list.length === 1 ? CHAPTERS[list[0]]
        : `Chapters ${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
    return `Mathematics · Algebra · ${which}`;
  },
  /* Says what the dials mean for the chapters actually on the paper. */
  subtitle: (o) => {
    const L = levelOf(o);
    const H = helpOf(o);
    const found = chaptersOn(o);
    const parts = [];
    if (!found.length || found.includes(4)) {
      parts.push(L.degree === 2 ? "squares" : "cubes");
      parts.push(L.roots.some((a) => a < 0) ? "brackets both ways" : "positive brackets");
    }
    parts.push(H.id === "show" ? "one done for you" : H.id === "help" ? "the organiser, empty" : "no labels");
    return parts.join(" · ");
  },
  exercises: EXERCISES,
  unavailable,
  /**
   * The worked example opens its OWN section rather than the workbook, and only
   * at the Show me level — per section, because the sections teach different
   * steps, and a child looking for the model they were shown should find it at
   * the top of the page they are on.
   */
  sectionHead: (section, o) => {
    if (helpOf(o).id !== "show" || !section.ex.worked) return "";
    return section.ex.worked(section.opts);
  },
};

/* Done on screen: typed, ticked and joined, and marked where there is a key.
   The remainder-theorem chapter has no key — it was built for paper — so on
   screen it can be written in and is not marked. */
export const LIVE = {};
