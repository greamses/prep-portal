/* ============================================================================
   JavaScript Workbook — the glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per section in the rail, in the house style every workbook shares
   (/utils/components/workbook/icons.js): 24×24, filled shapes in the theme's
   accent tokens, the thing that makes a section itself LOUD, the scaffold QUIET.
   ========================================================================== */

import {
  ICON as BASE, svg, bar, LOUD, QUIET, PAPER, GOLD, LEAF,
} from "/utils/components/workbook/icons.js";

const chip = (x, y, w, h, fill, r = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
/* the pair of quote marks this whole chapter turns on — drawn from the pen's
   start with relative curves only, so no coordinate is ever glued to another */
const quote = (x, y, fill) =>
  `<path d="M${x} ${y}q0-2.6 2.4-3.4l.6 1.4q-1.4.4-1.2 1.6h-1.8z" fill="${fill}"/>`;
const quotes = (x, y, fill) => quote(x, y, fill) + quote(x + 3.4, y, fill);

export const ICON = {
  ...BASE,
  /* Three values of three kinds, sorted into their own colours. */
  dtKind: svg(
    chip(2.6, 4, 8.4, 5.2, PAPER, 1.4) +
      chip(13, 4, 8.4, 5.2, GOLD, 1.4) +
      chip(2.6, 14.8, 8.4, 5.2, LEAF, 1.4) +
      chip(13, 14.8, 8.4, 5.2, LOUD, 1.4)
  ),
  /* A number with quote marks round it: the thing that changes everything. */
  dtQuotes: svg(
    quotes(3, 9.4, LOUD) +
      `<text x="12" y="16.4" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="800" fill="${QUIET}">7</text>` +
      quotes(16.4, 9.4, LOUD)
  ),
  /* A magnifying glass over a value: asking what kind it is. */
  dtTypeof: svg(
    `<circle cx="10.4" cy="10.4" r="7.2" fill="${PAPER}"/>` +
      `<circle cx="10.4" cy="10.4" r="4.4" fill="#fff"/>` +
      bar(14.6, 15.4, 20.4, 21, 2.6, GOLD) +
      `<circle cx="10.4" cy="10.4" r="1.9" fill="${LOUD}"/>`
  ),
  /* A console line with its caret: something printed. */
  dtPrint: svg(
    chip(2.4, 4.6, 19.2, 14.8, PAPER, 2.4) +
      `<path d="M6 9.6 8.8 12 6 14.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
      chip(10.6, 13, 7.4, 2, LOUD, 1)
  ),
  /* An empty box, and a box crossed out: nothing yet, and nothing on purpose. */
  dtEmpty: svg(
    chip(2.6, 7.4, 8.4, 9.2, QUIET, 1.4) +
      chip(4.2, 9, 5.2, 6, "#fff", 1) +
      chip(13, 7.4, 8.4, 9.2, PAPER, 1.4) +
      bar(14.2, 15.6, 20.2, 8.4, 2, LOUD)
  ),
  /* Two chips joined end to end where a plus should have added them. */
  dtJoin: svg(
    chip(2.4, 9.6, 8.8, 5.6, GOLD, 1.4) +
      chip(11.4, 9.6, 8.8, 5.6, GOLD, 1.4) +
      bar(9.4, 6.6, 13.4, 18.4, 1.6, LOUD)
  ),
  /* A labelled box with a value inside it. */
  dtVars: svg(
    chip(2.6, 6.4, 18.8, 11.4, PAPER, 2) +
      chip(4.6, 8.6, 6.4, 3, "#fff", 1.2) +
      chip(4.6, 13, 14.8, 2.4, LEAF, 1.2)
  ),
};
