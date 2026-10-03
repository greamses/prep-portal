/* ============================================================================
   Vedic Maths Workbook — the glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per section in the rail, in the house style every workbook shares
   (/utils/components/workbook/icons.js): 24×24, filled shapes in the theme's
   accent tokens, the thing that makes a section itself LOUD, the scaffold QUIET.
   ========================================================================== */

import { ICON as BASE, svg, bar, LOUD, QUIET, PAPER, GOLD, LEAF } from "/utils/components/workbook/icons.js";

const cell = (x, y, w, h, fill, rx = 1.2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;

export const ICON = {
  ...BASE,
  /* Two ends with the middle dropped in between them: × 11. */
  vmQuick: svg(
    cell(2.6, 8, 5.4, 8, PAPER) + cell(16, 8, 5.4, 8, PAPER) +
      `<path d="M12 2.4 15.4 7H8.6z" fill="${LOUD}"/>` + cell(9.3, 8, 5.4, 8, GOLD)
  ),
  /* A strip in two parts joined by a bar: the answer assembled. */
  vmPattern: svg(
    cell(2.4, 7.4, 8.6, 9.2, GOLD) + bar(12, 5, 12, 19, 1.8, QUIET) + cell(13, 7.4, 8.6, 9.2, LOUD)
  ),
  /* A long bar (the base) with a short notch below it: how far from it. */
  vmBase: svg(
    cell(2.6, 5, 18.8, 4, PAPER, 2) + cell(2.6, 12.4, 14, 4, GOLD, 2) + cell(17.6, 12.4, 3.8, 4, LOUD, 1.6)
  ),
  /* Steps going down to the right: running totals. */
  vmDivide: svg(
    cell(2.6, 3.4, 5.2, 5.2, PAPER) + cell(9.4, 9.4, 5.2, 5.2, GOLD) + cell(16.2, 15.4, 5.2, 5.2, LOUD)
  ),
  /* A circle with a tick in it: checked. */
  vmCheck: svg(
    `<circle cx="12" cy="12" r="9.4" fill="${LEAF}"/>` +
      `<path d="M7.2 12.4 10.6 15.8 17 8.6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
};
