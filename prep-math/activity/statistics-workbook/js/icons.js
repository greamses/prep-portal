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

  /* ── chapter 3 ── */
  /* Bars with a line across their tops. */
  lnIntro: svg(
    `<rect x="3" y="13" width="4.6" height="8" fill="${PAPER}"/><rect x="9.6" y="8" width="4.6" height="13" fill="${PAPER}"/><rect x="16.2" y="11" width="4.6" height="10" fill="${PAPER}"/>` +
      bar(5.3, 13, 11.9, 8, 1.6, LOUD) + bar(11.9, 8, 18.5, 11, 1.6, LOUD)
  ),
  /* A line with its dots. */
  lnRead: svg(
    bar(3, 3, 3, 21, 1.4, QUIET) + bar(3, 21, 21, 21, 1.4, QUIET) +
      bar(5, 16, 10, 9, 1.6, LOUD) + bar(10, 9, 15, 12, 1.6, LOUD) + bar(15, 12, 20, 5, 1.6, LOUD) +
      [[5, 16], [10, 9], [15, 12], [20, 5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${GOLD}"/>`).join("")
  ),
  /* Up from the axis to the line, then across: reading between. */
  lnBetween: svg(
    bar(3, 21, 21, 21, 1.4, QUIET) + bar(4, 18, 20, 6, 1.8, PAPER) +
      `<rect x="11.3" y="12" width="1.4" height="9" rx="0.7" fill="${LOUD}"/><rect x="3" y="11.3" width="9.7" height="1.4" rx="0.7" fill="${LOUD}"/>`
  ),
  /* A pencil ruling from one dot to the next. */
  lnDraw: svg(
    bar(3, 21, 21, 21, 1.4, QUIET) +
      `<circle cx="5" cy="15" r="1.8" fill="${GOLD}"/><circle cx="11" cy="9" r="1.8" fill="${GOLD}"/>` + bar(5, 15, 11, 9, 1.6, PAPER) +
      `<path d="M14 11l4.6-4.6 2 2-4.6 4.6z" fill="${LOUD}"/><path d="M14 11l-.9 2.9 2.9-.9z" fill="${LOUD}"/>`
  ),
  /* Two lines crossing. */
  lnTrend: svg(
    bar(3, 21, 21, 21, 1.4, QUIET) + bar(4, 17, 20, 6, 1.8, LOUD) + bar(4, 7, 20, 16, 1.8, PAPER)
  ),
  /* A straight line from the corner: a conversion graph, with a coin. */
  lnSolve: svg(
    bar(3, 3, 3, 21, 1.4, QUIET) + bar(3, 21, 21, 21, 1.4, QUIET) + bar(3, 21, 15, 7, 1.8, PAPER) +
      `<circle cx="18" cy="7" r="4.2" fill="${GOLD}"/><rect x="17.1" y="4.6" width="1.8" height="4.8" rx="0.9" fill="${LOUD}"/>`
  ),

  /* ── chapter 4 ── */
  /* A circle in quarters, one coloured in. */
  piWhole: svg(
    `<circle cx="12" cy="12" r="9" fill="${PAPER}"/><path d="M12 12L12 3A9 9 0 0 1 21 12Z" fill="${LOUD}"/>` +
      bar(12, 3, 12, 21, 1.2, QUIET) + bar(3, 12, 21, 12, 1.2, QUIET)
  ),
  /* A pie chart with three slices. */
  piRead: svg(
    `<path d="M12 12L12 2.5A9.5 9.5 0 0 1 16.75 20.23Z" fill="${LOUD}"/><path d="M12 12L16.75 20.23A9.5 9.5 0 0 1 2.64 13.65Z" fill="${GOLD}"/><path d="M12 12L2.64 13.65A9.5 9.5 0 0 1 12 2.5Z" fill="${PAPER}"/>`
  ),
  /* A slice with its angle marked by an arc. */
  piAngles: svg(
    `<circle cx="12" cy="12" r="9.5" fill="${PAPER}"/><path d="M12 12L12 2.5A9.5 9.5 0 0 1 20.93 15.25Z" fill="${LOUD}"/><path d="M12 12L12 7.8A4.2 4.2 0 0 1 15.95 13.44Z" fill="${GOLD}"/>`
  ),
  /* A circle with a radius being ruled by a pencil. */
  piDraw: svg(
    `<circle cx="10" cy="13" r="8" fill="${PAPER}"/>` + bar(10, 13, 10, 5, 1.4, QUIET) + bar(10, 13, 16.6, 17.4, 1.4, LOUD) +
      `<path d="M16 9l4-4 2 2-4 4z" fill="${LOUD}"/><path d="M16 9l-.8 2.8 2.8-.8z" fill="${LOUD}"/>`
  ),
  /* A straight line from the corner beside a small pie: proportion. */
  piProp: svg(
    bar(3, 3, 3, 21, 1.4, QUIET) + bar(3, 21, 21, 21, 1.4, QUIET) + bar(3, 21, 12, 8, 1.8, LOUD) +
      `<circle cx="17" cy="8" r="4.4" fill="${PAPER}"/><path d="M17 8L17 3.6A4.4 4.4 0 0 1 20.81 10.2Z" fill="${GOLD}"/>`
  ),

  /* ── chapter 5 ── */
  /* Axes, and a cross going on. */
  scPlot: svg(
    bar(3, 3, 3, 21, 1.4, QUIET) + bar(3, 21, 21, 21, 1.4, QUIET) +
      bar(9, 15, 17, 7, 2, GOLD) + bar(9, 7, 17, 15, 2, LOUD)
  ),
  /* Crosses, one read down to the axis. */
  scRead: svg(
    bar(3, 3, 3, 21, 1.4, QUIET) + bar(3, 21, 21, 21, 1.4, QUIET) +
      [[7, 15], [11, 13], [18, 6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="${PAPER}"/>`).join("") +
      `<circle cx="14" cy="9" r="2.1" fill="${LOUD}"/>` + bar(14, 11, 14, 21, 1.2, GOLD)
  ),
  /* Crosses climbing together. */
  scCorr: svg(
    bar(3, 3, 3, 21, 1.4, QUIET) + bar(3, 21, 21, 21, 1.4, QUIET) +
      [[6, 17], [9, 15], [11, 12], [14, 11], [16, 8], [19, 5]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="1.7" fill="${i % 2 ? GOLD : LOUD}"/>`).join("")
  ),
  /* A line through the middle of the crosses. */
  scFit: svg(
    bar(3, 3, 3, 21, 1.4, QUIET) + bar(3, 21, 21, 21, 1.4, QUIET) +
      [[6, 14], [9, 16], [12, 10], [15, 11], [18, 5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${PAPER}"/>`).join("") +
      bar(5, 17, 20, 5, 1.8, LOUD)
  ),
  /* A pattern of crosses, and one far away from it. */
  scSolve: svg(
    bar(3, 3, 3, 21, 1.4, QUIET) + bar(3, 21, 21, 21, 1.4, QUIET) +
      [[6, 17], [9, 14], [12, 12], [15, 9], [18, 7]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${PAPER}"/>`).join("") +
      `<circle cx="9" cy="6" r="2.4" fill="${GOLD}"/><circle cx="9" cy="6" r="1" fill="${LOUD}"/>`
  ),

  /* A pictogram and a coin: a problem to solve with it. */
  pgSolve: svg(
    [4.4, 8.6].map((x) => face(x, 6, 1.8, PAPER)).join("") +
      [4.4, 8.6, 12.8].map((x) => face(x, 12, 1.8, PAPER)).join("") +
      face(17.2, 17, 4.4, GOLD) +
      `<rect x="16.3" y="14.2" width="1.8" height="5.6" rx="0.9" fill="${LOUD}"/>`
  ),
};
