/* ============================================================================
   Comprehension Workbook — the glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per section in the rail, in the house style every workbook shares
   (/utils/components/workbook/icons.js): 24×24, filled shapes in the theme's
   accent tokens, the thing that makes a section ITSELF drawn LOUD and
   everything it shares with its neighbours drawn QUIET.
   ========================================================================== */

import {
  ICON as BASE, svg, LOUD, QUIET, PAPER, GOLD, LEAF,
} from "/utils/components/workbook/icons.js";

const slab = (x, y, w, h, fill, rx = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;

export const ICON = {
  ...BASE,
  /* A numbered page with a magnifier over one of its lines: the answer is in
     there, and the exercise is finding WHICH line it is in. */
  "cm-read": svg(
    slab(2.6, 2.4, 14.8, 19.2, PAPER, 2.2)
      + slab(4.6, 5.4, 1.4, 1.4, QUIET, 0.5)
      + slab(4.6, 9, 1.4, 1.4, QUIET, 0.5)
      + slab(4.6, 12.6, 1.4, 1.4, GOLD, 0.5)
      + slab(7, 5.6, 8, 1.2, QUIET, 0.6)
      + slab(7, 9.2, 8, 1.2, QUIET, 0.6)
      + slab(7, 12.8, 8, 1.2, GOLD, 0.6)
      + `<circle cx="16.6" cy="13.4" r="4.6" fill="none" stroke="${LOUD}" stroke-width="2"/>`
      + `<path d="M19.9 16.7 22.2 19" stroke="${LOUD}" stroke-width="2.4" stroke-linecap="round"/>`,
  ),
};
