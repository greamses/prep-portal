/* ============================================================================
   Grammar Workbook — the glyphs this workbook adds
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
  /* A line of words with ONE of them picked out and underlined: the whole
     idea of the chapter is that the job belongs to the word in its place. */
  "gr-parts": svg(
    slab(2.4, 4.2, 6.2, 2.6, QUIET, 1.3)
      + slab(9.6, 4.2, 5, 2.6, QUIET, 1.3)
      + slab(2.4, 10.7, 4.2, 2.6, QUIET, 1.3)
      + slab(7.6, 10.7, 8.4, 2.6, GOLD, 1.3)
      + slab(7.6, 14.6, 8.4, 1.5, LOUD, 0.7)
      + slab(2.4, 17.2, 13.6, 2.6, QUIET, 1.3)
      + slab(17.8, 4.2, 3.8, 2.6, QUIET, 1.3),
  ),
};
