/* ============================================================================
   Remainders Workbook — the four glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per section in the rail. Everything else on the bench — the printer, the
   die, the tick — comes from /utils/components/workbook/icons.js.
   ========================================================================== */

import { ICON as BASE, line } from "/utils/components/workbook/icons.js";

export const ICON = {
  ...BASE,
  /* Things with a ring drawn round some of them: the whole workbook in one
     picture, and the only glyph here that is a pencil mark. */
  ring: line(
    `<circle cx="7" cy="8" r="1.9"/><circle cx="12.6" cy="8" r="1.9"/>` +
      `<circle cx="7" cy="15.4" r="1.9"/><circle cx="12.6" cy="15.4" r="1.9"/>` +
      `<circle cx="18.2" cy="15.4" r="1.9"/>` +
      `<ellipse cx="9.8" cy="8" rx="7.2" ry="4.3" stroke-dasharray="2.6 1.8"/>`
  ),
  /* A sum written out: the sentence, with its parts. */
  sentence: line(`<path d="M3.5 12h4M11 8.6v6.8M14.6 12h6M9 6.5v0M9 17.5v0"/><circle cx="9" cy="7.4" r="0.9"/><circle cx="9" cy="16.6" r="0.9"/>`),
  /* A bar with part of it filled — a whole, and a piece of one. */
  bar: line(
    `<rect x="2.5" y="6.5" width="19" height="5" rx="0.8"/>` +
      `<path d="M2.5 6.5h7v5h-7z" fill="currentColor" stroke="none"/>` +
      `<rect x="2.5" y="14" width="19" height="5" rx="0.8"/>` +
      `<path d="M9.5 6.5v5M16 6.5v5M9.5 14v5M16 14v5"/>`
  ),
  /* A number over a number: the fraction itself. */
  frac: line(`<path d="M4.5 12h15M9 4.2v3.6M7.2 6h3.6M14 16.2h3.6M15.8 14.4v3.6"/>`),
};
