/* ============================================================================
   Maths Workbook — the glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per family in the rail. Everything else on the bench — the printer, the
   die, the tick — comes from /utils/components/workbook/icons.js, and so does
   the house style and the loud/quiet rule the drawings follow.

   Three of these families are the SAME written sum with a different operation
   in it: `plus`, `minus` and `times`. The rule says the operation is the loud
   part and the rule and the answer line under it are quiet, so at 22px what a
   child sees first is the + or the − or the ×, which is the only thing that
   tells those three sections apart.

   The blocks, the bar and the pie keep the colours the paper itself prints
   them in — butter, sky, leaf — so the glyph on the rail and the thing on the
   page are recognisably the same object.
   ========================================================================== */

import {
  ICON as BASE, svg, bar, LOUD, QUIET, PAPER, GOLD, LEAF, WARM,
} from "/utils/components/workbook/icons.js";

/* A written sum: the rule across the page and the short answer line under it.
   Quiet, in every one of them, so the sign on top is what carries. */
const written =
  `<rect x="2.6" y="15.4" width="18.8" height="1.9" rx="0.95" fill="${QUIET}"/>` +
  `<rect x="13.4" y="19.4" width="8" height="1.9" rx="0.95" fill="${QUIET}"/>`;

const plusSign = (cx, cy, s = 7.4, w = 2.4, fill = LOUD) =>
  `<rect x="${cx - w / 2}" y="${cy - s / 2}" width="${w}" height="${s}" rx="${w / 2}" fill="${fill}"/>` +
  `<rect x="${cx - s / 2}" y="${cy - w / 2}" width="${s}" height="${w}" rx="${w / 2}" fill="${fill}"/>`;

const dot = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

export const ICON = {
  ...BASE,
  /* The four blocks in their sizes — unit, rod, flat — painted the colours the
     paper paints them. */
  blocks: svg(
    `<rect x="2.4" y="15.8" width="4.6" height="4.6" rx="0.8" fill="${LOUD}"/>` +
      `<rect x="8.2" y="7.6" width="4.6" height="12.8" rx="0.8" fill="${GOLD}"/>` +
      `<rect x="14" y="7.6" width="7.6" height="12.8" rx="0.8" fill="${PAPER}"/>` +
      `<path d="M14 7.6 16.4 4.4h7.2l-2.4 3.2z" fill="${LEAF}"/>`
  ),
  /* The place-value chart: a heading row and its columns. */
  table: svg(
    `<rect x="2.6" y="4.4" width="18.8" height="15.2" rx="1.8" fill="${PAPER}"/>` +
      `<path d="M2.6 6.2a1.8 1.8 0 0 1 1.8-1.8h15.2a1.8 1.8 0 0 1 1.8 1.8v3.4H2.6z" fill="${GOLD}"/>` +
      `<rect x="8.4" y="10.6" width="1.4" height="9" fill="#fff"/>` +
      `<rect x="14.2" y="10.6" width="1.4" height="9" fill="#fff"/>`
  ),
  /* A figure with rules over and under it: the number on its own, written. */
  figures: svg(
    `<rect x="3" y="8.4" width="18" height="2.2" rx="1.1" fill="${QUIET}"/>` +
      `<rect x="3" y="14.2" width="18" height="2.2" rx="1.1" fill="${QUIET}"/>` +
      bar(9.6, 4.2, 7.2, 19.8, 2.6, LOUD) +
      bar(17.2, 4.2, 14.8, 19.8, 2.6, GOLD)
  ),
  /* A plus over a written sum. */
  plus: svg(written + plusSign(7.4, 9.4)),
  /* The same drawing with a minus in it. */
  minus: svg(
    written + `<rect x="3.7" y="8.2" width="7.4" height="2.4" rx="1.2" fill="${LOUD}"/>`
  ),
  /* Equal rows of things: what multiplying is before it is a sum. */
  array: svg(
    [6, 12, 18]
      .map((y, r) => [5.4, 12, 18.6].map((x) => dot(x, y, 2.1, [PAPER, GOLD, LEAF][r])).join(""))
      .join("")
  ),
  /* A times sign over a written sum. */
  times: svg(
    written +
      bar(4.4, 6.4, 10.4, 12.4, 2.4, LOUD) +
      bar(10.4, 6.4, 4.4, 12.4, 2.4, LOUD)
  ),
  /* A square cut by its diagonals into cells: the lattice. */
  lattice: svg(
    `<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="1.4" fill="${PAPER}"/>` +
      `<path d="M3.4 3.4h8.6v8.6z" fill="${GOLD}"/>` +
      `<path d="M20.6 12v8.6H12z" fill="${GOLD}"/>` +
      bar(3.4, 20.6, 20.6, 3.4, 1.7, LOUD) +
      `<rect x="11.2" y="3.4" width="1.6" height="17.2" fill="#fff"/>` +
      `<rect x="3.4" y="11.2" width="17.2" height="1.6" fill="#fff"/>`
  ),
  /* Things with a ring drawn round a group of them: sharing into groups. */
  ring: svg(
    `<ellipse cx="9.8" cy="7.8" rx="7.6" ry="4.6" fill="${GOLD}"/>` +
      dot(6.8, 7.8, 2.1, "#fff") + dot(12.8, 7.8, 2.1, "#fff") +
      dot(6.8, 15.8, 2.1, PAPER) + dot(12.8, 15.8, 2.1, PAPER) + dot(18.4, 15.8, 2.1, LOUD)
  ),
  /* A sum said as a sentence: this, and this, make that. */
  sentence: svg(
    `<rect x="2.6" y="10.8" width="5.4" height="2.4" rx="1.2" fill="${PAPER}"/>` +
      plusSign(11.4, 12, 6.4, 2.2, LOUD) +
      `<rect x="15.8" y="9.4" width="5.6" height="1.9" rx="0.95" fill="${LEAF}"/>` +
      `<rect x="15.8" y="12.7" width="5.6" height="1.9" rx="0.95" fill="${LEAF}"/>`
  ),
  /* A whole bar, and a piece of one: what a fraction is along a strip. */
  bar: svg(
    `<rect x="2.6" y="6.2" width="18.8" height="5.4" rx="1.1" fill="${PAPER}"/>` +
      `<path d="M3.7 6.2h5.9v5.4H3.7a1.1 1.1 0 0 1-1.1-1.1V7.3a1.1 1.1 0 0 1 1.1-1.1z" fill="${LOUD}"/>` +
      `<rect x="9.2" y="6.2" width="1.3" height="5.4" fill="#fff"/>` +
      `<rect x="15.5" y="6.2" width="1.3" height="5.4" fill="#fff"/>` +
      `<rect x="2.6" y="13.8" width="18.8" height="5.4" rx="1.1" fill="${GOLD}"/>` +
      `<rect x="9.2" y="13.8" width="1.3" height="5.4" fill="#fff"/>` +
      `<rect x="15.5" y="13.8" width="1.3" height="5.4" fill="#fff"/>`
  ),
  /* A pie with one slice coloured. */
  pie: svg(
    `<circle cx="12" cy="12" r="8.8" fill="${PAPER}"/>` +
      `<path d="M12 3.2A8.8 8.8 0 0 1 20.8 12H12z" fill="${LOUD}"/>` +
      `<rect x="11.3" y="3.2" width="1.4" height="17.6" fill="#fff"/>` +
      `<rect x="3.2" y="11.3" width="17.6" height="1.4" fill="#fff"/>`
  ),
  /* A number over a number: the fraction itself. */
  frac: svg(
    `<rect x="4.2" y="10.9" width="15.6" height="2.2" rx="1.1" fill="${LOUD}"/>` +
      `<rect x="6.6" y="4" width="6.4" height="4.4" rx="1.4" fill="${PAPER}"/>` +
      `<rect x="11" y="15.6" width="6.4" height="4.4" rx="1.4" fill="${GOLD}"/>`
  ),
  /* Five marks, the fifth struck through: counting in fives. */
  fives: svg(
    [5, 8.8, 12.6, 16.4].map((x) => bar(x, 6.4, x, 17.6, 2, PAPER)).join("") +
      bar(3.4, 17.6, 18.2, 6.4, 2.2, LOUD)
  ),
  /* A clock, at a time nothing else on this page shows. */
  clock: svg(
    `<circle cx="12" cy="12" r="9" fill="${WARM}"/>` +
      `<circle cx="12" cy="12" r="6.6" fill="#fff"/>` +
      bar(12, 12, 12, 7.4, 1.9, LOUD) +
      bar(12, 12, 15.8, 14.2, 1.9, LOUD)
  ),
};
