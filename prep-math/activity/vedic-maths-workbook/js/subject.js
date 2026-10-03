/* ============================================================================
   Vedic Maths Workbook — the subject: what the engine needs to build this paper
   ----------------------------------------------------------------------------
   Kept apart from main.js (which wires the builder's dials) so that anything
   else that renders a Vedic Maths Workbook — the assignment player at
   /wb/<code> — builds exactly the same paper from the same options.
   ========================================================================== */

import { EXERCISES, levelOf, helpOf, unavailable, exerciseById, chapterOf } from "./exercises.js";

export const WORKBOOK = { id: "vedic-maths-workbook", label: "Vedic Maths Workbook", style: "/prep-math/activity/vedic-maths-workbook/style.css" };

const CHAPTERS = {
  1: "Chapter 1: Adding and taking away",
  2: "Chapter 2: Multiplying in your head",
  3: "Chapter 3: Squares",
  4: "Chapter 4: Square roots and cube roots",
  5: "Chapter 5: Dividing and checking",
  6: "Chapter 6: The Trachtenberg system",
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
    return `Mathematics · Vedic maths · ${which}`;
  },
  subtitle: (o) => {
    const L = levelOf(o);
    const H = helpOf(o);
    const parts = [];
    parts.push(L.id === "gentle" ? "two-digit numbers, nothing carries" : L.id === "middle" ? "carrying, three digits, near 100" : "bigger numbers, above the base, near 1000");
    parts.push(H.id === "show" ? "one done for you" : H.id === "help" ? "the steps named" : "nothing named");
    return parts.join(" · ");
  },
  exercises: EXERCISES,
  unavailable,
  sectionHead: (section, o) => {
    if (helpOf(o).id !== "show" || !section.ex.worked) return "";
    return section.ex.worked(section.opts);
  },
};

/* Done on screen, the paper is a SPEED DRILL: 5 seconds for every number,
   one box at a time; a right answer moves the cursor straight on to the next
   box. A trick is only a trick if it is quick. (The engine's `timed` option,
   /utils/components/workbook/interactive.js.) */
export const LIVE = { timed: { seconds: 5 } };
