/* ============================================================================
   Maths Workbook — the glyphs this workbook adds
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
  /* A plus over a rule — an addition, written down the page. */
  plus: line(`<path d="M8 6.5v7M4.5 10h7M3.5 16.5h17M14.5 19.5h6"/>`),
  /* And the same drawing with a minus in it. */
  minus: line(`<path d="M4.5 10h7M3.5 16.5h17M14.5 19.5h6"/>`),
  /* Things with a ring drawn round some of them. */
  ring: line(
    `<circle cx="7" cy="8" r="1.9"/><circle cx="12.6" cy="8" r="1.9"/>` +
      `<circle cx="7" cy="15.4" r="1.9"/><circle cx="12.6" cy="15.4" r="1.9"/>` +
      `<circle cx="18.2" cy="15.4" r="1.9"/>` +
      `<ellipse cx="9.8" cy="8" rx="7.2" ry="4.3" stroke-dasharray="2.6 1.8"/>`
  ),
  /* A sum written out: the sentence, with its parts. */
  sentence: line(
    `<path d="M3.5 12h4M11 8.6v6.8M14.6 12h6"/>` +
      `<circle cx="9" cy="7.4" r="0.9"/><circle cx="9" cy="16.6" r="0.9"/>`
  ),
  /* A bar with part of it filled — a whole, and a piece of one. */
  bar: line(
    `<rect x="2.5" y="6.5" width="19" height="5" rx="0.8"/>` +
      `<path d="M2.5 6.5h7v5h-7z" fill="currentColor" stroke="none"/>` +
      `<rect x="2.5" y="14" width="19" height="5" rx="0.8"/>` +
      `<path d="M9.5 6.5v5M16 6.5v5M9.5 14v5M16 14v5"/>`
  ),
  /* A pie with a slice coloured: what a fraction is. */
  pie: line(
    `<circle cx="12" cy="12" r="8.6"/>` +
      `<path d="M12 3.4A8.6 8.6 0 0 1 20.6 12H12z" fill="currentColor" stroke="none"/>` +
      `<path d="M12 3.4v17.2M3.4 12h17.2"/>`
  ),
  /* A number over a number: the fraction itself. */
  frac: line(`<path d="M4.5 12h15M9 4.2v3.6M7.2 6h3.6M14 16.2h3.6M15.8 14.4v3.6"/>`),
};
