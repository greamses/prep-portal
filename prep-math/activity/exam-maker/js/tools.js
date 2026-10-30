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

   The ruler, set square, compass and protractor are the workbook's own
   instruments, laid on the paper at its real scale (the sheet is 210 mm wide,
   so a centimetre on the ruler is a centimetre of paper). Left out on purpose:
   the pencil and eraser (they draw on a workbook's pages) and the English
   organisers, which have no use on a maths or science paper.
   ========================================================================== */

import { mountInteractive } from "/utils/components/workbook/interactive.js";

const FAMILIES = ["draw", "work", "count", "shapes", "tables", "model", "algebra", "note"];

export function mountTools({ sheet, viewport, toolbar }) {
  let api = null;
  /* the protractor is drawn by the geometry workbook; the rail needs it up front */
  const ready = (async () => {
    let protractor = null;
    try { protractor = (await import("/prep-math/activity/geometry-workbook/js/protractor.js")).protractorSvg(); } catch { /* no protractor, the rest still work */ }
    try {
      api = mountInteractive({
        sheet, viewport, scaler: viewport, toolbar, refit: () => {},
        rail: FAMILIES, railWithout: ["pencil", "eraser"], protractor,
      });
    } catch (e) {
      console.warn("[exam tools] the rail could not be mounted:", e);
    }
  })();
  const toggle = () => document.querySelector(".wb-live-toggle");
  return {
    ready,
    async on() { await ready; if (api && !api.isLive()) api.enter(); },
    async off() { await ready; if (api && api.isLive()) toggle()?.click(); },
  };
}
