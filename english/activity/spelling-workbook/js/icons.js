/* ============================================================================
   Spelling Workbook — the glyphs this workbook adds
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
  /* A word with its last letter written TWICE before the ending goes on —
     the doubling rule, which is the one children lose marks on. */
  "sp-endings": svg(
    slab(2.4, 9.4, 7.2, 5.2, PAPER, 1.6)
      + slab(10.4, 9.4, 3.4, 5.2, LOUD, 1.2)
      + slab(14.6, 9.4, 3.4, 5.2, LOUD, 1.2)
      + slab(18.8, 9.4, 2.8, 5.2, GOLD, 1.2)
      + slab(10.4, 5.4, 7.6, 1.6, QUIET, 0.8)
      + slab(2.4, 17.4, 19.2, 1.6, QUIET, 0.8),
  ),
};
