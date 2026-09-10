/* ============================================================================
   Geometry Workbook — the glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per section in the rail. Everything else on the bench — the printer, the
   die, the tick — comes from /utils/components/workbook/icons.js.
   ========================================================================== */

import { ICON as BASE, line } from "/utils/components/workbook/icons.js";

export const ICON = {
  ...BASE,
  /* A triangle with an arc in one corner: an angle inside a triangle. */
  triangle: line(`<path d="M3.5 19.5h17L12 4.5z"/><path d="M8.2 19.5a4.6 4.6 0 0 0-2.1-3.9"/>`),
  /* A hexagon with two cuts from one corner — the whole idea of the chapter. */
  cut: line(
    `<path d="M7.5 3.8h9l4.5 8.2-4.5 8.2h-9L3 12z"/>` +
      `<path d="M7.5 3.8 16.5 20.2M7.5 3.8 21 12" stroke-dasharray="2 1.6"/>`
  ),
  /* A triangle with a "?" where one corner would be read. */
  missing: line(`<path d="M3.5 19.5h17L12 4.5z"/><path d="M11 13.2a1.6 1.6 0 1 1 2.2 1.5c-.5.2-.8.6-.8 1.1"/><path d="M12.4 17.6v0"/>`),
  /* A pentagon: any shape. */
  polygon: line(`<path d="M12 3.2 20.8 9.6 17.4 20H6.6L3.2 9.6z"/>`),
  /* A regular shape with an arc in every corner — each angle. */
  each: line(
    `<path d="M7.5 3.8h9l4.5 8.2-4.5 8.2h-9L3 12z"/>` +
      `<path d="M9.8 3.8a2.3 2.3 0 0 1-1.1 2M14.2 3.8a2.3 2.3 0 0 0 1.1 2"/>`
  ),
  /* Lines of writing: a word problem. */
  words: line(`<path d="M4 6.5h16M4 11h16M4 15.5h10"/>`),
  /* A triangle with its base carried on and the outside angle marked. */
  exterior: line(`<path d="M3 19.5h12L9 6.5z"/><path d="M15 19.5h6" stroke-dasharray="1.8 1.4"/><path d="M18.4 19.5a3.4 3.4 0 0 0-2.5-3.1"/>`),

  /* ── chapter 2 ── */
  /* Two lines with the arrow marks that say they are parallel. */
  parallel: line(`<path d="M3 8h18M3 16h18"/><path d="M11 6.2l1.8 1.8-1.8 1.8M11 14.2l1.8 1.8-1.8 1.8"/>`),
  /* Two parallels and a line across them. */
  transversal: line(`<path d="M3 8h18M3 16h18M8 21 16 3"/>`),
  /* The four angles at a crossing, one dot in each. */
  trAngles: line(
    `<path d="M3 8h18M3 16h18M8 21 16 3"/>` +
      `<circle cx="16.5" cy="6.3" r=".6"/><circle cx="12" cy="5.3" r=".6"/><circle cx="11.1" cy="9.7" r=".6"/><circle cx="15.5" cy="10.7" r=".6"/>`
  ),
  /* A small arc and a wide one at the same crossing. */
  acuteObtuse: line(`<path d="M3 14h18M7 21 17 3"/><path d="M13.9 14A3 3 0 0 0 12.3 11.4M11.9 12.2A2 2 0 0 0 8.9 14"/>`),
  /* Two lines crossing, the opposite pair marked. */
  vertOpp: line(`<path d="M4 6 20 18M4 18 20 6"/><path d="M9.2 9.9A3.5 3.5 0 0 0 9.2 14.1M14.8 14.1A3.5 3.5 0 0 0 14.8 9.9"/>`),
  /* The same corner marked at both crossings. */
  corresponding: line(`<path d="M3 8h18M3 16h18M8 21 16 3"/><path d="M16.3 8A2.5 2.5 0 0 0 14.8 5.7M12.7 16A2.5 2.5 0 0 0 11.2 13.7"/>`),
  /* The Z. */
  alternate: line(`<path d="M3 6h18M3 18h18M7 20 15 4"/><path d="M11.5 6A2.5 2.5 0 0 0 12.9 8.2M10.5 18A2.5 2.5 0 0 0 9.1 15.8"/>`),
  /* The C: both inside, the same side. */
  coInterior: line(`<path d="M3 6h18M3 18h18M7 20 15 4"/><path d="M11.5 6A2.5 2.5 0 0 0 12.9 8.2M9.1 15.8A2.5 2.5 0 0 0 5.5 18"/>`),
  /* Both outside, the same side. */
  coExterior: line(`<path d="M3 6h18M3 18h18M7 20 15 4"/><path d="M15.1 3.8A2.5 2.5 0 0 0 11.5 6M5.5 18A2.5 2.5 0 0 0 6.9 20.2"/>`),
  /* Two lines across the same parallels. */
  multiTrans: line(`<path d="M3 8h18M3 16h18M5 20 10 4M13 20 20 4"/>`),
  /* A triangle standing between two parallels. */
  triTrans: line(`<path d="M3 5h18M3 19h18"/><path d="M12 5 6 19M12 5 18 19"/>`),
};
