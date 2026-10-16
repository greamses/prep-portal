/* ============================================================================
   Vocabulary Workbook — the glyphs this workbook adds
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
  /* A piece clicking onto the FRONT of a word: that is what a prefix is. */
  "vb-prefix": svg(
    slab(9.4, 7.4, 12.2, 9.2, PAPER, 2)
      + slab(2.4, 7.4, 6.2, 9.2, LOUD, 2)
      + slab(7, 10.6, 3.4, 2.8, GOLD, 1)
      + slab(12.2, 10.6, 6.6, 1.5, QUIET, 0.7)
      + slab(12.2, 13.4, 4.4, 1.5, QUIET, 0.7),
  ),
};
