/* ============================================================================
   Algebra Workbook — the glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per section in the rail. Everything else on the bench — the printer, the
   die, the tick — comes from /utils/components/workbook/icons.js, and so does
   the house style and the loud/quiet rule.

   The bar-model glyphs keep the paper's own two colours: butter for a box
   holding the unknown, sky for a part we were told. That is the same pairing
   barart.js prints, so the glyph on the rail is a small picture of the thing
   on the page — and it is also why the unknown box is the loud one here.
   ========================================================================== */

import {
  ICON as BASE, svg, bar, LOUD, QUIET, PAPER, GOLD, LEAF,
} from "/utils/components/workbook/icons.js";

export const ICON = {
  ...BASE,
  /* A bracket with a nought inside it: the bracket, made zero. */
  bracket: svg(
    `<path d="M9.6 3.4a1.3 1.3 0 0 1 .5 1.8 8.2 8.2 0 0 0 0 13.6 1.3 1.3 0 1 1-1.4 2.2 10.8 10.8 0 0 1 0-18 1.3 1.3 0 0 1 .9-.2z" fill="${PAPER}"/>` +
      `<path d="M14.4 3.4a1.3 1.3 0 0 0-.5 1.8 8.2 8.2 0 0 1 0 13.6 1.3 1.3 0 1 0 1.4 2.2 10.8 10.8 0 0 0 0-18 1.3 1.3 0 0 0-.9-.2z" fill="${PAPER}"/>` +
      `<ellipse cx="12" cy="12" rx="2.9" ry="3.6" fill="${LOUD}"/>` +
      `<ellipse cx="12" cy="12" rx="1.1" ry="1.7" fill="#fff"/>`
  ),
  /* Two things exchanging places — the swap, and nothing else here is a pair
     of arrows going opposite ways. */
  swap: svg(
    `<rect x="3.4" y="6.6" width="14.4" height="2.6" rx="1.3" fill="${PAPER}"/>` +
      `<path d="M14.6 4.2 20.6 7.9l-6 3.7z" fill="${LOUD}"/>` +
      `<rect x="6.2" y="14.8" width="14.4" height="2.6" rx="1.3" fill="${GOLD}"/>` +
      `<path d="M9.4 12.4 3.4 16.1l6 3.7z" fill="${LOUD}"/>`
  ),
  /* The frame itself in miniature: four rows, the first one filled in. */
  frame: svg(
    `<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="2.2" fill="${PAPER}"/>` +
      `<rect x="5.4" y="5.4" width="8" height="2.4" rx="1.2" fill="${LOUD}"/>` +
      `<rect x="3.2" y="9.4" width="17.6" height="1.3" fill="#fff"/>` +
      `<rect x="3.2" y="13.4" width="17.6" height="1.3" fill="#fff"/>` +
      `<rect x="3.2" y="17.4" width="17.6" height="1.3" fill="#fff"/>`
  ),
  /* Speech, because the last section is the rule said out loud. */
  said: svg(
    `<path d="M3.4 5.6a2 2 0 0 1 2-2h13.2a2 2 0 0 1 2 2v8.6a2 2 0 0 1-2 2h-8l-4.8 4v-4h-.4a2 2 0 0 1-2-2z" fill="${PAPER}"/>` +
      `<rect x="6.2" y="7.2" width="11.6" height="1.8" rx="0.9" fill="#fff"/>` +
      `<rect x="6.2" y="10.6" width="7.2" height="1.8" rx="0.9" fill="#fff"/>`
  ),

  /* ── chapter 1 ── */
  /* A box with a question mark in it: the unknown. */
  unknown: svg(
    `<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="2.4" fill="${GOLD}"/>` +
      `<path d="M9 10.4a3 3 0 0 1 5.9.7c0 1.8-2 1.9-2.2 3.5" fill="none" stroke="${LOUD}" stroke-width="2.4" stroke-linecap="round"/>` +
      `<circle cx="12.4" cy="17.1" r="1.4" fill="${LOUD}"/>`
  ),
  /* One line going up and down beside one that stays flat: what varies, and
     what does not. */
  vary: svg(
    `<path d="M2.6 10.4c2.6-5.4 5.2-5.4 7.8 0s5.2 5.4 9.6 0" fill="none" stroke="${LOUD}" stroke-width="2.8" stroke-linecap="round"/>` +
      `<rect x="2.6" y="16.6" width="18.8" height="2.6" rx="1.3" fill="${QUIET}"/>`
  ),

  /* ── chapter 2, the bar model ── */
  /* One strip cut in two: the part we were told, and the box we are after. */
  bar: svg(
    `<rect x="2.4" y="8" width="19.2" height="8" rx="1.4" fill="${PAPER}"/>` +
      `<path d="M3.8 8h8.2v8H3.8a1.4 1.4 0 0 1-1.4-1.4V9.4A1.4 1.4 0 0 1 3.8 8z" fill="${GOLD}"/>` +
      `<rect x="2.4" y="18.4" width="19.2" height="2.2" rx="1.1" fill="${QUIET}"/>`
  ),
  /* Equal boxes and a bit over — ax + b, drawn. */
  bars: svg(
    `<rect x="2.4" y="8" width="19.2" height="8" rx="1.4" fill="${PAPER}"/>` +
      `<path d="M3.8 8h11.2v8H3.8a1.4 1.4 0 0 1-1.4-1.4V9.4A1.4 1.4 0 0 1 3.8 8z" fill="${GOLD}"/>` +
      `<rect x="6.8" y="8" width="1.4" height="8" fill="#fff"/>` +
      `<rect x="11.2" y="8" width="1.4" height="8" fill="#fff"/>` +
      `<rect x="2.4" y="18.4" width="19.2" height="2.2" rx="1.1" fill="${QUIET}"/>`
  ),
  /* ── chapter 3, the balance scale ──
     All three are the same scale, so the loud part is what each section is
     about: what is ON the pans, the move between them, the pencil. */
  /* A level beam with a bag on one pan and a weight on the other. */
  scale: svg(
    `<path d="M4.4 8.6h5.2l-2.6 4.6z" fill="${GOLD}"/>` +
      `<path d="M14.4 8.6h5.2l-2.6 4.6z" fill="${PAPER}"/>` +
      `<rect x="3.4" y="7" width="17.2" height="2.2" rx="1.1" fill="${QUIET}"/>` +
      `<rect x="10.9" y="8.4" width="2.2" height="9.6" rx="1.1" fill="${QUIET}"/>` +
      `<rect x="6.4" y="18" width="11.2" height="2.4" rx="1.2" fill="${QUIET}"/>` +
      `<circle cx="12" cy="8.1" r="1.9" fill="${LOUD}"/>`
  ),
  /* The move: the same taken off both pans, so both arrows are the loud part. */
  scaleMove: svg(
    `<rect x="3.4" y="7" width="17.2" height="2.2" rx="1.1" fill="${QUIET}"/>` +
      `<rect x="10.9" y="8.4" width="2.2" height="9.6" rx="1.1" fill="${QUIET}"/>` +
      `<rect x="6.4" y="18" width="11.2" height="2.4" rx="1.2" fill="${QUIET}"/>` +
      `<path d="M4.2 15.4h5.2l-2.6-4.6z" fill="${LOUD}"/>` +
      `<path d="M14.6 15.4h5.2l-2.6-4.6z" fill="${LOUD}"/>` +
      `<circle cx="12" cy="8.1" r="1.9" fill="${GOLD}"/>`
  ),
  /* The scale with a pencil over it: put the equation on it yourself. */
  pencilScale: svg(
    `<rect x="2.6" y="9.6" width="12.6" height="2" rx="1" fill="${QUIET}"/>` +
      `<rect x="7.9" y="10.8" width="2" height="7.6" rx="1" fill="${QUIET}"/>` +
      `<rect x="3.6" y="18.4" width="10.6" height="2.2" rx="1.1" fill="${QUIET}"/>` +
      `<path d="M16.4 4.6l3 3-7.2 7.2-3-3z" fill="${GOLD}"/>` +
      `<path d="M17.8 3.2a1.9 1.9 0 0 1 2.7 2.7l-.9.9-3-3z" fill="${LEAF}"/>` +
      `<path d="M9.2 11.8l3 3-4.1 1.1z" fill="${LOUD}"/>`
  ),

  /* ── chapter 5 ── */
  /* Two things changing places across an equals sign. */
  apComm: svg(
    `<rect x="2.6" y="5" width="7" height="5.4" rx="1.2" fill="${GOLD}"/>` +
      `<rect x="14.4" y="5" width="7" height="5.4" rx="1.2" fill="${PAPER}"/>` +
      `<rect x="2.6" y="13.6" width="7" height="5.4" rx="1.2" fill="${PAPER}"/>` +
      `<rect x="14.4" y="13.6" width="7" height="5.4" rx="1.2" fill="${GOLD}"/>` +
      `<rect x="10.8" y="10.4" width="2.4" height="1.2" rx="0.6" fill="${LOUD}"/>` +
      `<rect x="10.8" y="12.4" width="2.4" height="1.2" rx="0.6" fill="${LOUD}"/>`
  ),
  /* Three counters, two of them in a ring. */
  apAssoc: svg(
    `<rect x="2" y="6.4" width="13.4" height="11.2" rx="5.6" fill="${LEAF}"/>` +
      `<circle cx="6.4" cy="12" r="2.8" fill="${GOLD}"/>` +
      `<circle cx="11" cy="12" r="2.8" fill="${GOLD}"/>` +
      `<circle cx="19" cy="12" r="2.8" fill="${LOUD}"/>`
  ),
  /* A rectangle cut in two: k(a + b) is ka and kb. */
  apDist: svg(
    `<rect x="2.6" y="5.4" width="11" height="13.2" rx="1" fill="${GOLD}"/>` +
      `<rect x="14.8" y="5.4" width="6.6" height="13.2" rx="1" fill="${PAPER}"/>` +
      bar(14.2, 3.6, 14.2, 20.4, 1.6, LOUD)
  ),
  /* A yellow and a red counter: a zero pair. */
  apZero: svg(
    `<circle cx="7.6" cy="12" r="5.2" fill="${GOLD}"/>` +
      `<circle cx="16.4" cy="12" r="5.2" fill="${LOUD}"/>` +
      `<rect x="5.2" y="11.1" width="4.8" height="1.8" rx="0.9" fill="#fff"/>` +
      `<rect x="6.7" y="9.6" width="1.8" height="4.8" rx="0.9" fill="#fff"/>` +
      `<rect x="14" y="11.1" width="4.8" height="1.8" rx="0.9" fill="#fff"/>`
  ),
  /* (a + b)²: the big square, its a² and b², and the two rectangles between. */
  apIdent: svg(
    `<rect x="3" y="3" width="11" height="11" fill="${GOLD}"/>` +
      `<rect x="14.6" y="3" width="6.4" height="11" fill="${LOUD}"/>` +
      `<rect x="3" y="14.6" width="11" height="6.4" fill="${LOUD}"/>` +
      `<rect x="14.6" y="14.6" width="6.4" height="6.4" fill="${PAPER}"/>`
  ),

  /* Two little scales side by side, linked by what one of them knows. */
  twoScales: svg(
    bar(2, 7, 10, 7, 1.6, QUIET) + `<path d="M6 8.4 3.6 13.4h4.8z" fill="${PAPER}"/>` + bar(4, 20, 8, 20, 1.6, QUIET) + bar(6, 8, 6, 20, 1.4, QUIET) +
      bar(14, 7, 22, 7, 1.6, QUIET) + `<path d="M18 8.4 15.6 13.4h4.8z" fill="${GOLD}"/>` + bar(16, 20, 20, 20, 1.6, QUIET) + bar(18, 8, 18, 20, 1.4, QUIET) +
      `<rect x="9.4" y="2.6" width="5.2" height="3.4" rx="1" fill="${LOUD}"/>`
  ),

  /* ── chapter 6 ── */
  /* A machine: a box with a hopper, a number going in. */
  fnMachine: svg(
    `<rect x="6" y="8" width="12" height="10" rx="2" fill="${LOUD}"/>` +
      `<path d="M8.5 8 10 4.5h4L15.5 8z" fill="${QUIET}"/>` +
      `<circle cx="9.4" cy="13" r="1.4" fill="${PAPER}"/><circle cx="14.6" cy="13" r="1.4" fill="${PAPER}"/>` +
      bar(2, 20.5, 6, 20.5, 1.6, GOLD) + bar(18, 20.5, 22, 20.5, 1.6, GOLD)
  ),
  /* The machine with an arrow running back through it. */
  fnBack: svg(
    `<rect x="6" y="6" width="12" height="12" rx="2" fill="${PAPER}"/>` +
      bar(21, 12, 4, 12, 2, LOUD) + `<path d="M3 12l4.4-3.6v7.2z" fill="${LOUD}"/>`
  ),
  /* Two empty boxes and a card going into one. */
  fnRule: svg(
    `<rect x="3" y="11" width="8" height="8" rx="1.4" fill="${PAPER}"/><rect x="13" y="11" width="8" height="8" rx="1.4" fill="${PAPER}"/>` +
      `<rect x="12" y="2.5" width="8" height="6" rx="1" fill="${GOLD}" transform="rotate(-8 16 5.5)"/>` +
      bar(5, 15, 9, 15, 1.4, LOUD) + bar(7, 13, 7, 17, 1.4, LOUD)
  ),
  /* f(x) written out. */
  fnWrite: svg(
    `<path d="M7 20V9a3 3 0 0 1 3-3h1.4" fill="none" stroke="${LOUD}" stroke-width="2" stroke-linecap="round"/>` +
      bar(4.5, 12, 10.5, 12, 1.8, LOUD) +
      `<path d="M14 7c-2 3-2 9 0 12M20 7c2 3 2 9 0 12" fill="none" stroke="${QUIET}" stroke-width="1.6" stroke-linecap="round"/>` +
      bar(15.4, 10.4, 18.6, 15.6, 1.6, GOLD) + bar(18.6, 10.4, 15.4, 15.6, 1.6, GOLD)
  ),
  /* Two ovals joined by arrows: a mapping. */
  fnMap: svg(
    `<ellipse cx="6" cy="12" rx="4" ry="9" fill="${PAPER}"/><ellipse cx="18" cy="12" rx="4" ry="9" fill="${GOLD}"/>` +
      bar(7, 7, 16, 9, 1.4, LOUD) + bar(7, 12, 16, 15, 1.4, LOUD) + bar(7, 17, 16, 15, 1.4, LOUD)
  ),

  /* Three growing stacks: a pattern that adds one lot each place. */
  sqPlace: svg(
    `<rect x="3" y="14" width="4.4" height="7" rx="0.8" fill="${PAPER}"/>` +
      `<rect x="9.8" y="9" width="4.4" height="12" rx="0.8" fill="${PAPER}"/>` +
      `<rect x="16.6" y="4" width="4.4" height="17" rx="0.8" fill="${PAPER}"/>` +
      `<rect x="3" y="9" width="4.4" height="4.4" rx="0.8" fill="${GOLD}"/><rect x="9.8" y="4" width="4.4" height="4.4" rx="0.8" fill="${GOLD}"/>`
  ),
  /* The place going in at the top of a list, its term coming out. */
  sqRule: svg(
    `<circle cx="6" cy="6" r="3.4" fill="${GOLD}"/>` + bar(6, 10, 6, 18, 1.6, QUIET) +
      `<path d="M6 21.4 2.8 16.6h6.4z" fill="${QUIET}"/>` +
      `<rect x="12" y="3.4" width="9" height="4" rx="1.2" fill="${PAPER}"/><rect x="12" y="10" width="9" height="4" rx="1.2" fill="${LOUD}"/><rect x="12" y="16.6" width="9" height="4" rx="1.2" fill="${PAPER}"/>`
  ),

  /* ── chapter 7 ── */
  /* Axes and a row of points going up in a line. */
  grPlot: svg(
    bar(4, 3, 4, 21, 1.4, QUIET) + bar(3, 20, 21, 20, 1.4, QUIET) +
      [[8, 16], [12, 12.5], [16, 9], [20, 5.5]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${i % 2 ? GOLD : LOUD}"/>`).join("")
  ),
  /* A ruled line through the points. */
  grLine: svg(
    bar(4, 3, 4, 21, 1.4, QUIET) + bar(3, 20, 21, 20, 1.4, QUIET) + bar(5, 18, 21, 4, 1.8, LOUD) +
      [[9, 14.5], [15, 9.3]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${GOLD}"/>`).join("")
  ),
  /* Up from the x axis to the line, then across. */
  grRead: svg(
    bar(4, 3, 4, 21, 1.4, QUIET) + bar(3, 20, 21, 20, 1.4, QUIET) + bar(5, 18, 21, 5, 1.6, PAPER) +
      bar(14, 20, 14, 11, 1.4, LOUD) + bar(14, 11, 4, 11, 1.4, LOUD)
  ),
  /* A step up the line: one across, m up. */
  grMc: svg(
    bar(4, 3, 4, 21, 1.4, QUIET) + bar(3, 20, 21, 20, 1.4, QUIET) + bar(4, 17, 20, 5, 1.8, LOUD) +
      bar(9, 13.3, 14.5, 13.3, 1.4, GOLD) + bar(14.5, 13.3, 14.5, 9.2, 1.4, GOLD)
  ),
  /* Two lines crossing, the crossing ringed. */
  grSolve: svg(
    bar(4, 3, 4, 21, 1.4, QUIET) + bar(3, 20, 21, 20, 1.4, QUIET) + bar(5, 18, 20, 5, 1.6, LOUD) + bar(5, 7, 20, 16, 1.6, PAPER) +
      `<circle cx="12.4" cy="11.6" r="2.4" fill="${GOLD}"/>`
  ),
  /* A U-shaped curve. */
  grCurve: svg(
    bar(4, 3, 4, 21, 1.4, QUIET) + bar(3, 20, 21, 20, 1.4, QUIET) + `<path d="M6 4c2 12 4 14 6.5 14S17 16 19 4" fill="none" stroke="${LOUD}" stroke-width="2" stroke-linecap="round"/>`
  ),

  /* A strip with a pencil over it: draw the model yourself. */
  pencilBar: svg(
    `<rect x="2.4" y="13.4" width="13.6" height="6.4" rx="1.2" fill="${PAPER}"/>` +
      `<path d="M16.4 4.6l3 3-7.2 7.2-3-3z" fill="${GOLD}"/>` +
      `<path d="M17.8 3.2a1.9 1.9 0 0 1 2.7 2.7l-.9.9-3-3z" fill="${LEAF}"/>` +
      `<path d="M9.2 11.8l3 3-4.1 1.1z" fill="${LOUD}"/>`
  ),
};
