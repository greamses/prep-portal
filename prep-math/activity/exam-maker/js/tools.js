/* ============================================================================
   The tool rail beside an exam paper
   ----------------------------------------------------------------------------
   A student sitting a paper on screen needs what they would have on the desk:
   a calculator, paper to work a sum out on, tables, the shapes and graphs. Those
   are the workbooks' own tools (the rail in utils/components/workbook/
   interactive.js), so they are mounted here rather than written again.

   The rail is built by the workbook's interactive layer, which also makes a
   "Make interactive" key and a bar of its own. This page has its own controls,
   so those two are hidden (style.css) and the rail is opened and put away
   with the paper: tools.on() / tools.off().

   Left out on purpose: the pencil, the eraser and the ruler, set square and
   protractor, which are laid on a workbook's printed pages, and the English
   organisers, which have no use on a maths or science paper.
   ========================================================================== */

import { mountInteractive } from "/utils/components/workbook/interactive.js";

const FAMILIES = ["work", "count", "shapes", "tables", "model", "algebra", "note"];

export function mountTools({ sheet, viewport, toolbar }) {
  let api = null;
  try {
    api = mountInteractive({
      sheet, viewport, scaler: viewport, toolbar, refit: () => {},
      rail: FAMILIES,
    });
  } catch (e) {
    console.warn("[exam tools] the rail could not be mounted:", e);
  }
  const toggle = () => document.querySelector(".wb-live-toggle");
  return {
    get ready() { return !!api; },
    on() { if (api && !api.isLive()) api.enter(); },
    off() { if (api && api.isLive()) toggle()?.click(); },
  };
}
