/* ============================================================================
   Writing Workbook — the glyphs this workbook adds
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
  /* Loose word-tiles dropping into a ruled line: the order is the sentence. */
  "wr-build": svg(
    slab(2.4, 2.6, 5.6, 3.4, GOLD, 1.2)
      + slab(9.4, 3.4, 4.4, 3.4, QUIET, 1.2)
      + slab(15.4, 2.6, 6.2, 3.4, QUIET, 1.2)
      + slab(3.4, 8.6, 4.4, 3.4, QUIET, 1.2)
      + slab(9.4, 9.4, 6.2, 3.4, LEAF, 1.2)
      + slab(2.4, 15.4, 19.2, 3.4, PAPER, 1.4)
      + slab(2.4, 20.2, 19.2, 1.6, LOUD, 0.8),
  ),
};
