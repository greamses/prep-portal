/* ============================================================================
   Vedic Maths Workbook — the subject: what the engine needs to build this paper
   ----------------------------------------------------------------------------
   Kept apart from main.js (which wires the builder's dials) so that anything
   else that renders a Vedic Maths Workbook — the assignment player at
   /wb/<code> — builds exactly the same paper from the same options.
   ========================================================================== */

import { EXERCISES, levelOf, modeOf, isDrill, unavailable, exerciseById, chapterOf } from "./exercises.js";
import { explainStrip } from "./explain.js";

/* Called "Mental Maths" since 2026-10-03; the id and the URL keep the old
   name so saved papers, assignments and links all still open. */
export const WORKBOOK = { id: "vedic-maths-workbook", label: "Mental Maths Workbook", style: "/prep-math/activity/vedic-maths-workbook/style.css" };

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
    return `Mathematics · Mental maths · ${isDrill(o) ? "Drills" : "Skill development"} · ${which}`;
  },
  subtitle: (o) => {
    const L = levelOf(o);
    const parts = [];
    parts.push(L.id === "gentle" ? "two-digit numbers, nothing carries" : L.id === "middle" ? "carrying, three digits, near 100" : "bigger numbers, above the base, near 1000");
    parts.push(isDrill(o) ? "whole answers, 5 seconds each" : "one done for you, then the steps");
    return parts.join(" · ");
  },
  exercises: EXERCISES,
  unavailable,
  /* A skill section opens with PrepBot explaining the trick (explain.js: the
     site's own teaching mascot, saying the section's own words) and then the
     example worked on paper. A drill has neither: it is against the clock. */
  sectionHead: (section, o) => {
    if (isDrill(o)) return "";
    return explainStrip(section.ex, section.opts) + (section.ex.worked ? section.ex.worked(section.opts) : "");
  },
};

/* A Drills paper done on screen is a SPEED DRILL: 5 seconds for every number,
   one box at a time; a right answer moves the cursor straight on to the next
   box. A skill paper has no clock — it is for learning the trick, not racing
   it. (The engine's `timed` option, /utils/components/workbook/interactive.js,
   asked again each time the drill would start.) */
export const LIVE = { timed: (o) => (isDrill(o) ? { seconds: 5 } : null) };
