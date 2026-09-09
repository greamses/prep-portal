/* ============================================================================
   Place Value Workbook — the three glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per family in the rail. Everything else on the bench — the printer, the
   die, the tick — comes from /utils/components/workbook/icons.js.
   ========================================================================== */

import { ICON as BASE, line } from "/utils/components/workbook/icons.js";

export const ICON = {
  ...BASE,
  /* The four blocks, in their sizes: unit, rod, flat, and the cube on its end. */
  blocks: line(
    `<rect x="2.6" y="16.4" width="4" height="4" rx="0.6"/>` +
      `<rect x="8.4" y="8.4" width="4" height="12" rx="0.6"/>` +
      `<rect x="14.2" y="8.4" width="7.2" height="12" rx="0.6"/>` +
      `<path d="M14.2 8.4 16.6 5h7.2v0"/>`
  ),
  table: line(
    `<rect x="3" y="4.5" width="18" height="15" rx="1.4"/>` +
      `<path d="M3 9.6h18M9 9.6v9.9M15 9.6v9.9"/>`
  ),
  /* A figure with a line under it: the number on its own, being written. */
  figures: line(`<path d="M9.4 4.5 7 19.5M17 4.5l-2.4 15M4.5 9.2h15M3.8 14.8h15"/>`),
};
