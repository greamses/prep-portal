/* ============================================================================
   Statistics Workbook — the glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per section in the rail, in the house style every workbook shares
   (/utils/components/workbook/icons.js): 24×24, filled shapes in the theme's
   accent tokens, the thing that makes a section itself LOUD, the scaffold QUIET.
   ========================================================================== */

import {
  ICON as BASE, svg, bar, LOUD, QUIET, PAPER, GOLD, LEAF,
} from "/utils/components/workbook/icons.js";

const face = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;

export const ICON = {
  ...BASE,
  /* A jumble of three shapes, one of them picked out. */
  pgSort: svg(
    `<rect x="3" y="3.4" width="7" height="7" rx="1" fill="${PAPER}"/>` +
      `<path d="M16.6 3 21.4 11h-9.6z" fill="${GOLD}"/>` +
      face(8, 17, 4.2, LOUD) +
      `<rect x="14" y="14" width="6.4" height="6.4" rx="1" fill="${LEAF}"/>`
  ),
  /* A gate of five: four upright, one across. */
  pgTally: svg(
    [5, 9, 13, 17].map((x) => bar(x, 4, x, 20, 2, QUIET)).join("") +
      bar(3, 17.6, 19.4, 6.4, 2.4, LOUD)
  ),
  /* Rows of symbols, one row longer than the others. */
  pgRead: svg(
    [5, 9.5, 14].map((x) => face(x, 5.5, 1.9, PAPER)).join("") +
      [5, 9.5, 14, 18.5].map((x) => face(x, 12, 1.9, LOUD)).join("") +
      [5, 9.5].map((x) => face(x, 18.5, 1.9, PAPER)).join("")
  ),
  /* The key: one symbol, an equals sign, and more than one. */
  pgKey: svg(
    face(6, 12, 4.2, LOUD) +
      `<rect x="12" y="9.2" width="4" height="1.8" rx="0.9" fill="${QUIET}"/>` +
      `<rect x="12" y="13" width="4" height="1.8" rx="0.9" fill="${QUIET}"/>` +
      face(19.6, 8.6, 2, GOLD) + face(19.6, 15.4, 2, GOLD)
  ),
  /* Empty boxes, the first two filled in: building one. */
  pgMake: svg(
    [3, 9.2, 15.4].map((x, i) => `<rect x="${x}" y="8.4" width="5.6" height="7.2" rx="1" fill="${i < 2 ? GOLD : PAPER}"/>`).join("") +
      `<path d="M9.2 8.4h2.8v7.2H9.2z" fill="${LOUD}"/>`
  ),
  /* ── chapter 2 ── */
  /* Columns of squares: a block graph. */
  brBlocks: svg(
    [[3, 3], [9.6, 5], [16.2, 2]].map(([x, n]) => Array.from({ length: n }, (_, k) =>
      `<rect x="${x}" y="${19.4 - (k + 1) * 3.6}" width="5" height="3.1" rx="0.5" fill="${n === 5 ? LOUD : PAPER}"/>`).join("")).join("") +
      bar(2, 20.4, 22, 20.4, 1.4, QUIET)
  ),
  /* A bar and the line across from its top to the scale. */
  brRead: svg(
    bar(3, 3, 3, 21, 1.6, QUIET) + bar(3, 21, 21, 21, 1.6, QUIET) +
      `<rect x="12" y="8" width="6" height="12.2" rx="0.6" fill="${GOLD}"/>` +
      bar(3.8, 8, 11.4, 8, 1.4, LOUD)
  ),
  /* Bars being raised, a pencil at the top of one. */
  brDraw: svg(
    bar(3, 21, 21, 21, 1.6, QUIET) +
      `<rect x="4.4" y="12" width="4.4" height="8.2" rx="0.5" fill="${PAPER}"/>` +
      `<rect x="10.4" y="7" width="4.4" height="13.2" rx="0.5" fill="${GOLD}"/>` +
      `<path d="M16.6 13.2l3-3 1.8 1.8-3 3z" fill="${LOUD}"/>` +
      `<path d="M16.6 13.2l-.9 2.7 2.7-.9z" fill="${LOUD}"/>`
  ),
  /* Two bars side by side for each label. */
  brCompare: svg(
    bar(3, 21, 21, 21, 1.6, QUIET) +
      `<rect x="4" y="9" width="3.6" height="11.2" fill="${PAPER}"/><rect x="7.6" y="13" width="3.6" height="7.2" fill="${LOUD}"/>` +
      `<rect x="13" y="12" width="3.6" height="8.2" fill="${PAPER}"/><rect x="16.6" y="5" width="3.6" height="15.2" fill="${LOUD}"/>`
  ),
  /* A bar chart with a question on it: a problem. */
  brSolve: svg(
    bar(3, 21, 14, 21, 1.6, QUIET) +
      `<rect x="4" y="12" width="3.6" height="8.2" fill="${PAPER}"/><rect x="9" y="8" width="3.6" height="12.2" fill="${PAPER}"/>` +
      `<circle cx="18" cy="8" r="4.6" fill="${GOLD}"/>` +
      `<rect x="17.1" y="5.2" width="1.8" height="4" rx="0.9" fill="${LOUD}"/><circle cx="18" cy="11" r="0.95" fill="${LOUD}"/>`
  ),

  /* A pictogram and a coin: a problem to solve with it. */
  pgSolve: svg(
    [4.4, 8.6].map((x) => face(x, 6, 1.8, PAPER)).join("") +
      [4.4, 8.6, 12.8].map((x) => face(x, 12, 1.8, PAPER)).join("") +
      face(17.2, 17, 4.4, GOLD) +
      `<rect x="16.3" y="14.2" width="1.8" height="5.6" rx="0.9" fill="${LOUD}"/>`
  ),
};
