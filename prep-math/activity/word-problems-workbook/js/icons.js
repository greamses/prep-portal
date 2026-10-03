/* ============================================================================
   Competition Word Problems — the glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per chapter in the rail, in the house style every workbook shares
   (/utils/components/workbook/icons.js): 24×24, filled shapes in the theme's
   accent tokens, the thing that makes a chapter itself LOUD, the scaffold QUIET.
   ========================================================================== */

import { ICON as BASE, svg, bar, LOUD, QUIET, PAPER, GOLD, LEAF, WARM } from "/utils/components/workbook/icons.js";

const cell = (x, y, w, h, fill, rx = 1.2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const dot = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

export const ICON = {
  ...BASE,
  /* ages: two people, one taller — a short bar and a long one on a time line */
  wpAges: svg(dot(7, 6.4, 2.6, PAPER) + cell(4.4, 10, 5.2, 7, PAPER, 2) + dot(16.4, 5, 3, LOUD) + cell(13.2, 9, 6.4, 8, LOUD, 2.4) + bar(2.6, 20, 21.4, 20, 1.6, QUIET)),
  /* alligation: two prices above, the mean in the middle, the cross below */
  wpMix: svg(bar(5, 5, 19, 19, 1.4, QUIET) + bar(19, 5, 5, 19, 1.4, QUIET) + dot(5, 5, 2.8, PAPER) + dot(19, 5, 2.8, GOLD) + dot(12, 12, 3.4, LOUD) + dot(5, 19, 2.4, GOLD) + dot(19, 19, 2.4, PAPER)),
  /* HCF and LCM: two overlapping sets, the overlap loud */
  wpHcf: svg(dot(9, 12, 6.6, PAPER) + dot(15, 12, 6.6, GOLD) + `<path d="M12 6.1a6.6 6.6 0 0 1 0 11.8a6.6 6.6 0 0 1 0-11.8z" fill="${LOUD}"/>`),
  /* ratio: two bars cut into equal parts, 2 against 3 */
  wpRatio: svg(cell(3, 5, 5.4, 5.4, LOUD) + cell(9.2, 5, 5.4, 5.4, LOUD) + cell(3, 13.6, 5.4, 5.4, PAPER) + cell(9.2, 13.6, 5.4, 5.4, PAPER) + cell(15.4, 13.6, 5.4, 5.4, PAPER)),
  /* algebraic fractions: a top, a bar, a bottom */
  wpFrac: svg(cell(7, 3, 10, 6.4, PAPER, 1.6) + bar(4, 12, 20, 12, 2.2, LOUD) + cell(7, 14.6, 10, 6.4, GOLD, 1.6)),
  /* systems: two lines crossing at the answer */
  wpSys: svg(bar(3, 18.5, 21, 6.5, 2, PAPER) + bar(4, 4.5, 20, 19.5, 2, GOLD) + dot(11.8, 12.4, 3.2, LOUD)),
  /* sequence: steps rising */
  wpSeq: svg(cell(3, 15.4, 4, 5.6, PAPER) + cell(8, 12, 4, 9, PAPER) + cell(13, 8, 4, 13, GOLD) + cell(18, 3, 4, 18, LOUD)),
  /* arrangements: three places in a row, one swapped out */
  wpArr: svg(cell(2.6, 12.6, 5.6, 8, PAPER, 1.4) + cell(9.2, 12.6, 5.6, 8, GOLD, 1.4) + cell(15.8, 12.6, 5.6, 8, LEAF, 1.4) + dot(12, 5.6, 3.2, LOUD)),
  /* probability tree: one root, two branches, four leaves */
  wpProb: svg(bar(4, 12, 12, 6.4, 1.6, QUIET) + bar(4, 12, 12, 17.6, 1.6, QUIET) + bar(12, 6.4, 20, 3.6, 1.4, QUIET) + bar(12, 6.4, 20, 9, 1.4, QUIET) + bar(12, 17.6, 20, 15, 1.4, QUIET) + bar(12, 17.6, 20, 20.4, 1.4, QUIET) +
    dot(4, 12, 2.4, PAPER) + dot(12, 6.4, 2.4, LOUD) + dot(12, 17.6, 2.4, GOLD) + dot(20, 3.6, 1.8, LOUD) + dot(20, 9, 1.8, GOLD) + dot(20, 15, 1.8, LOUD) + dot(20, 20.4, 1.8, GOLD)),
  /* percentages: the sign itself */
  wpPct: svg(bar(5.4, 19.4, 18.6, 4.6, 2.4, QUIET) + dot(7, 7, 3.6, LOUD) + dot(17, 17, 3.6, PAPER) + dot(7, 7, 1.3, "#fff") + dot(17, 17, 1.3, "#fff")),
  /* remainder: a divided bar with one piece left over */
  wpRem: svg(cell(2.6, 8.4, 4.6, 7.2, PAPER) + cell(8, 8.4, 4.6, 7.2, PAPER) + cell(13.4, 8.4, 4.6, 7.2, PAPER) + cell(19, 8.4, 2.6, 7.2, LOUD) + bar(2.6, 19, 18, 19, 1.4, WARM)),
};
