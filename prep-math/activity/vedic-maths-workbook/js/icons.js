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
  /* The Trachtenberg stages: two digit boxes, painted by what they hold —
     both even (quiet blue), both odd (loud), one of each. */
  vmTrEven: svg(cell(3, 6, 7.6, 12, PAPER) + cell(13.4, 6, 7.6, 12, PAPER) + `<circle cx="6.8" cy="12" r="1.6" fill="#fff"/><circle cx="17.2" cy="12" r="1.6" fill="#fff"/>`),
  vmTrOdd: svg(cell(3, 6, 7.6, 12, LOUD) + cell(13.4, 6, 7.6, 12, LOUD) + `<circle cx="6.8" cy="12" r="1.6" fill="#fff"/><circle cx="17.2" cy="12" r="1.6" fill="#fff"/>`),
  vmTrMix: svg(cell(3, 6, 7.6, 12, PAPER) + cell(13.4, 6, 7.6, 12, LOUD) + `<circle cx="6.8" cy="12" r="1.6" fill="#fff"/><circle cx="17.2" cy="12" r="1.6" fill="#fff"/>`),
  /* A row of digit boxes with an arrow running right to left over them. */
  vmTrach: svg(
    cell(2.6, 11, 5, 7.4, PAPER) + cell(9.5, 11, 5, 7.4, PAPER) + cell(16.4, 11, 5, 7.4, GOLD) +
      `<path d="M20.4 6.4H6.2" stroke="${LOUD}" stroke-width="2" stroke-linecap="round"/><path d="M3.4 6.4 7.6 3.6v5.6z" fill="${LOUD}"/>`
  ),
  /* A bar nearly full, and the little piece that would fill it: a complement. */
  vmComp: svg(
    cell(2.6, 8.6, 14.4, 6.8, PAPER, 1.6) + cell(18, 8.6, 3.4, 6.8, LOUD, 1.2) + bar(17.5, 5, 17.5, 19, 1.2, QUIET)
  ),
  /* A square split into its left and right parts. */
  vmSquares: svg(
    cell(3.4, 3.4, 17.2, 17.2, PAPER, 2) + cell(3.4, 3.4, 10.4, 10.4, GOLD, 2) + cell(14.8, 14.8, 5.8, 5.8, LOUD, 1.4)
  ),
  /* The root sign over a number. */
  vmRoots: svg(
    `<path d="M2.6 13.4 5.4 12l3 6.6L13 3.4h8.4" fill="none" stroke="${LOUD}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
      cell(13.6, 8, 7.6, 10.6, PAPER, 1.4)
  ),
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
