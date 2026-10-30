/* ============================================================================
   ALGEBRA MOVES — the page
   ----------------------------------------------------------------------------
   The tool itself is workspace.js, because it is mounted in two places: here,
   filling the window under the nav, and in a panel in the printable workbooks'
   sidebar. This file is only the half that belongs to this page.
   ========================================================================== */

import { mountAlgebraMoves, mountFormulaBook, pinNote, describeBoard, pinQuestion } from "./workspace.js";
import { mountGuide } from "./guide.js";
import { UI } from "/utils/components/ui-icons.js";
import { mountTools } from "/utils/components/workbook/toolbar.js";

mountAlgebraMoves(document.getElementById("am-frame"));

/* PrepBot, the site's one chat, knows this page: it reads the canvas (every
   equation with its working, the notes), can draw a figure for a geometry
   question, and offers to pin what it sets as a sticky note on the canvas. */
window.__prepbotPage = {
  title: "Algebra Moves",
  figures: true,
  context: () => describeBoard(),
  pin: (what) => pinQuestion(what),
};

/* The side rail: the formula book (formulas and rules) beside the workbook's
   own calculator, digit-shift card and notes. */
mountTools(document.body, {
  tools: ["formulas", "guide", "pin", "calculator", "graph", "shift", "note"],
  extra: {
    // Every press sticks another note on the canvas.
    pin: { label: "Pin a sticky note on the canvas", act: pinNote },
    guide: {
      label: "How to set up and use gestures",
      icon: UI.hand(22),
      size: { w: 440, h: 620 },
      open(body) {
        body.classList.add("am-book");
        mountGuide(body);
      },
    },
    formulas: {
      label: "Formula book",
      size: { w: 470, h: 600 },
      open(body) {
        body.classList.add("am-book");
        mountFormulaBook(body);
      },
    },
  },
});
