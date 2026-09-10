/* ============================================================================
   Maths Workbook — the subject: what the engine needs to build this paper
   ----------------------------------------------------------------------------
   Kept apart from main.js (which wires the builder's dials) so that anything
   else that renders a Maths Workbook — the assignment player at /wb/<code> —
   builds exactly the same paper from the same options.
   ========================================================================== */

import { EXERCISES, levelOf, helpOf, unavailable, placesFor } from "./exercises.js";
import { placeName, placeWorth } from "./numbers.js";
import { blocksKey } from "./blocks.js";
import { baseWord } from "../../base-blocks/js/config.js";
import { protractorSvg } from "./protractor.js";

export const WORKBOOK = { id: "maths-workbook", label: "Maths Workbook", style: "/prep-math/activity/maths-workbook/style.css" };

/* ── the subject ───────────────────────────────────────────────────────────*/

export const SUBJECT = {
  eyebrow: "Mathematics · A workbook to print",
  subtitle: (o) => {
    const L = levelOf(o);
    const H = helpOf(o);
    const help =
      H.id === "show" ? "one done for you" : H.id === "help" ? "no examples" : "nothing named";
    const place =
      o.base === 10
        ? `${o.places} places`
        : `base ${baseWord(o.base)} · ${o.places} places`;
    return `${place} · up to ${L.max} things · ${help}`;
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
};
