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
};
