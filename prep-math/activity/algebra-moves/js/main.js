/* ============================================================================
   ALGEBRA MOVES — the page
   ----------------------------------------------------------------------------
   The tool itself is workspace.js, because it is mounted in two places: here,
   filling the window under the nav, and in a panel in the printable workbooks'
   sidebar. This file is only the half that belongs to this page.
   ========================================================================== */

import { mountAlgebraMoves, mountFormulaBook } from "./workspace.js";
import { mountTools } from "/utils/components/workbook/toolbar.js";

mountAlgebraMoves(document.getElementById("am-frame"));

/* The side rail: the formula book (formulas and rules) beside the workbook's
   own calculator, digit-shift card and notes. */
mountTools(document.body, {
  tools: ["formulas", "calculator", "shift", "note"],
  extra: {
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
