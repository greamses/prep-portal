/* ============================================================================
   Competition Word Problems — the subject: what the engine needs to build this paper
   ----------------------------------------------------------------------------
   Kept apart from main.js (which wires the builder's dials) so that anything
   else that renders this workbook — the assignment player at /wb/<code> —
   builds exactly the same paper from the same options.
   ========================================================================== */

import { EXERCISES, levelOf, helpOf, unavailable, exerciseById, chapterOf } from "./exercises.js";

export const WORKBOOK = { id: "word-problems-workbook", label: "Competition Word Problems", style: "/prep-math/activity/word-problems-workbook/style.css" };

const CHAPTERS = {
  1: "Chapter 1: Ages",
  2: "Chapter 2: Alligation and mixture",
  3: "Chapter 3: HCF and LCM",
  4: "Chapter 4: Ratio",
  5: "Chapter 5: Algebraic fractions",
  6: "Chapter 6: Systems of equations",
  7: "Chapter 7: Sequence and series",
  8: "Chapter 8: Arrangements and selections",
  9: "Chapter 9: Probability trees",
  10: "Chapter 10: Percentages",
  11: "Chapter 11: The remainder theorem",
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
    return `Mathematics · Competition word problems · ${which}`;
  },
  subtitle: (o) => {
    const L = levelOf(o);
    const parts = [];
    parts.push(L.id === "gentle" ? "the standard types" : L.id === "middle" ? "the standard types and the twists" : "every type, the hardest included");
    parts.push(helpOf(o).id === "show" ? "one worked in full" : "no worked examples");
    return parts.join(" · ");
  },
  exercises: EXERCISES,
  unavailable,
  /* The worked example opens its own section, and only when help is on. */
  sectionHead: (section, o) => {
    if (helpOf(o).id !== "show" || !section.ex.worked) return "";
    return section.ex.worked(section.opts);
  },
};

/* Done on screen: every answer is typed and marked, and the chapters that
   are solved with a picture have the bar model board to draw it on. */
export const LIVE = {};
