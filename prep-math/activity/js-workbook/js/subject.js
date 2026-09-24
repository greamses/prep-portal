/* ============================================================================
   JavaScript Workbook — the subject: what the engine needs to build this paper
   ----------------------------------------------------------------------------
   Kept apart from main.js (which wires the builder's dials) so that anything
   else that renders a JavaScript Workbook — the assignment player at
   /wb/<code> — builds exactly the same paper from the same options.
   ========================================================================== */

import { EXERCISES, levelOf, helpOf, unavailable, exerciseById, chapterOf } from "./exercises.js";

export const WORKBOOK = { id: "js-workbook", label: "JavaScript Workbook", style: "/prep-math/activity/js-workbook/style.css" };

const CHAPTERS = {
  1: "Chapter 1: Data types",
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
    return `Programming · JavaScript · ${which}`;
  },
  subtitle: (o) => {
    const L = levelOf(o);
    const H = helpOf(o);
    const parts = [];
    parts.push(L.id === "gentle" ? "string, number and boolean"
      : L.id === "middle" ? "quoted numbers, null and undefined, Number()"
        : "the traps: typeof null, text that looks like a sum");
    parts.push(H.id === "show" ? "one done for you" : H.id === "help" ? "no examples" : "nothing named");
    return parts.join(" · ");
  },
  exercises: EXERCISES,
  unavailable,
  sectionHead: (section, o) => {
    if (helpOf(o).id !== "show" || !section.ex.worked) return "";
    return section.ex.worked(section.opts);
  },
};

/* Done on screen: typed, ticked, and — this book's own thing — written in an
   editor and RUN, with the console marked against what it printed. */
export const LIVE = {};
