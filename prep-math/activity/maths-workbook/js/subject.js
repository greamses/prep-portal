/* ============================================================================
   Maths Workbook — the subject: what the engine needs to build this paper
   ----------------------------------------------------------------------------
   Kept apart from main.js (which wires the builder's dials) so that anything
   else that renders a Maths Workbook — the assignment player at /wb/<code> —
   builds exactly the same paper from the same options.
   ========================================================================== */

import { EXERCISES, levelOf, helpOf, unavailable, placesFor, exerciseById, chapterOf } from "./exercises.js";
import { placeName, placeWorth } from "./numbers.js";
import { blocksKey, blocksSvg } from "./blocks.js";
import { chartHtml } from "./chart.js";
import { baseWord } from "../../base-blocks/js/config.js";
import { protractorSvg } from "./protractor.js";

export const WORKBOOK = { id: "maths-workbook", label: "Maths Workbook", style: "/prep-math/activity/maths-workbook/style.css" };

/* ── the subject ───────────────────────────────────────────────────────────*/

const CHAPTERS = {
  1: "Chapter 1: Place value", 2: "Chapter 2: Words and figures",
  3: "Chapter 3: Adding and taking away", 4: "Chapter 4: Dividing and remainders",
  5: "Chapter 5: Fractions", 6: "Chapter 6: Counting in fives and telling the time",
  7: "Chapter 7: Angles",
};

/** The chapters the chosen exercises actually come from, in order. */
const chaptersOn = (o) => [...new Set((o.chosen || [])
  .map((c) => exerciseById(c.id))
  .filter(Boolean)
  .map(chapterOf))].sort((a, b) => a - b);

export const SUBJECT = {
  /* Names the chapter the paper is from — or all of them, when it mixes. */
  eyebrow: (o) => {
    const list = chaptersOn(o);
    const which = !list.length ? "A workbook to print"
      : list.length === 1 ? CHAPTERS[list[0]]
        : `Chapters ${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
    return `Mathematics · ${which}`;
  },
  /* Says what the dials mean for the chapters actually on the paper. The
     places belong to place value and the base moves only there; "up to N
     things" is only true where there are things to count. */
  subtitle: (o) => {
    const L = levelOf(o);
    const H = helpOf(o);
    const found = chaptersOn(o);
    const has = (n) => !found.length || found.includes(n);
    const parts = [];
    if (has(1)) {
      parts.push(o.base === 10
        ? `${o.places} places`
        : `base ${baseWord(o.base)} · ${o.places} places`);
    }
    /* the chapters that count things: place value, adding, dividing */
    if (has(1) || has(3) || has(4)) parts.push(`up to ${L.max} things`);
    parts.push(H.id === "show" ? "one done for you" : H.id === "help" ? "no examples" : "nothing named");
    return parts.join(" · ");
  },
  exercises: EXERCISES,
  unavailable,
  /* Blocks only come in four sizes, so a blocks exercise never sees more places
     than there are blocks for, however wide the chart on the next page is. */
  optionsFor: (ex, o) => ({ ...o, places: placesFor(ex, o) }),
  /**
   * Two things can open a section, and neither opens more than one.
   *
   * The blocks key opens the FIRST blocks section — one strip of pieces per
   * workbook, not one per section. The worked example opens EVERY section that
   * has one, but only at the Show me level: the sections teach different steps,
   * and a child looking for the model they were shown should find it at the top
   * of the page they are on, not eleven pages back.
   */
  sectionHead: (section, o, state) => {
    if (section.ex.group === "blocks" && !state.keyDone && o.blocksKey) {
      state.keyDone = true;
      const names = Array.from({ length: 4 }, (_, p) => placeName(p, o.base));
      const worths = Array.from({ length: 4 }, (_, p) => placeWorth(p, o.base));
      return blocksKey(o.base, names, worths);
    }
    /* The protractor is not an example, it is the instrument the questions
       tell you to cut out — so it prints at every level of help. A page that
       says "cut out the protractor" and has no protractor on it is broken. */
    if (section.ex.alwaysWorked) return section.ex.worked(section.opts);
    if (helpOf(o).id === "show" && section.ex.worked) return section.ex.worked(section.opts);
    return "";
  },
};

/* Done on screen and marked. This workbook's own boxes — the remainder
   sentence, the fraction blanks, the gaps in a track of fives, the parts of a
   written sum — are answer places too. */
export const LIVE = {
  protractor: protractorSvg(),
  places: ".wb-box, .rw-answer, .rw-fill, .rw-sentence__blank, .mt-track__cell--gap, .ms-across__box, .ms-down__carrybox",
  /* How this workbook draws a pile of blocks. Splitting a flat into ten rods
     means drawing the pile again, and only this workbook knows how — so the
     drawing is handed to the engine rather than reached for, the same way the
     protractor is. A workbook with no blocks hands nothing and the engine
     simply never offers it. */
  blocks: blocksSvg,
  /* And how it draws a place-value chart, handed in for the same reason: the
     chart on the tool rail is THIS workbook's chart, the one the questions are
     answered on, not a second one drawn to look like it. A workbook with no
     place value hands nothing and the rail never offers the chart. */
  chart: chartHtml,
};
