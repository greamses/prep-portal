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

  /* ── chapter 2: variables, and what to call them ──────────────────────── */

  /* Two name tags: one kept, one refused. */
  vrRules: svg(
    chip(2.4, 4.2, 19.2, 6.4, LEAF, 1.6) +
      `<path d="M5.4 7.4 7 9l3.2-3.2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` +
      chip(2.4, 13.4, 19.2, 6.4, QUIET, 1.6) +
      bar(5.2, 14.8, 9.2, 18.4, 1.8, LOUD) +
      bar(9.2, 14.8, 5.2, 18.4, 1.8, LOUD)
  ),
  /* The two humps the style is named after, with the capital on the second. */
  vrCamel: svg(
    `<path d="M2.2 18.4q0-6 4.6-6t4.6 6h-3q0-3-1.6-3t-1.6 3z" fill="${QUIET}"/>` +
      `<path d="M12.6 18.4q0-7.6 4.6-7.6t4.6 7.6h-3q0-4.6-1.6-4.6t-1.6 4.6z" fill="${LOUD}"/>` +
      chip(15.4, 5.2, 3.6, 3.6, GOLD, 1)
  ),
  /* A box with a tag tied to it: the name says what is inside. */
  vrChoose: svg(
    chip(8.4, 6.2, 13.2, 11.6, PAPER, 2) +
      chip(10.6, 9, 8.4, 2.2, "#fff", 1.1) +
      chip(10.6, 12.6, 5.4, 2.2, "#fff", 1.1) +
      `<path d="M8.4 9.4 3.2 12l5.2 2.6z" fill="${LOUD}"/>`
  ),
  /* A box whose value is being swapped for another. */
  vrLet: svg(
    chip(2.6, 7, 18.8, 10, PAPER, 2) +
      chip(4.6, 9.4, 5.6, 5.2, "#fff", 1.2) +
      bar(11.4, 12, 18.6, 12, 2, LOUD) +
      `<path d="M17.4 8.8 21.4 12l-4 3.2z" fill="${LOUD}"/>`
  ),
  /* The same box with a padlock on it. */
  vrConst: svg(
    chip(3.6, 10.4, 16.8, 9.2, PAPER, 2) +
      `<path d="M8.4 10.4v-2.2a3.6 3.6 0 0 1 7.2 0v2.2h-2.4V8.2a1.2 1.2 0 0 0-2.4 0v2.2z" fill="${QUIET}"/>` +
      chip(10.8, 13, 2.4, 4.2, LOUD, 1.2)
  ),
  /* A chip that has got out of its block. */
  vrVar: svg(
    `<rect x="2.6" y="5.6" width="12.8" height="12.8" rx="2" fill="none" stroke="${QUIET}" stroke-width="1.6" stroke-dasharray="2.6 2"/>` +
      chip(5, 8, 6.4, 3, QUIET, 1.2) +
      chip(14.6, 13.4, 6.8, 3.2, LOUD, 1.4) +
      bar(11.6, 15, 14.2, 15, 1.6, LOUD)
  ),
  /* One road forking in two: which keyword. */
  vrWhich: svg(
    bar(12, 20.4, 12, 13.4, 2.2, QUIET) +
      bar(12, 13.8, 5.4, 7.4, 2.2, LEAF) +
      bar(12, 13.8, 18.6, 7.4, 2.2, LOUD) +
      chip(3, 3.4, 5.2, 3.4, LEAF, 1.2) +
      chip(15.8, 3.4, 5.2, 3.4, LOUD, 1.2)
  ),
  /* A pencil writing a listing. */
  vrWrite: svg(
    chip(2.6, 4.4, 13.2, 15.2, PAPER, 2) +
      chip(4.8, 7.2, 8.8, 2, "#fff", 1) +
      chip(4.8, 11, 6, 2, "#fff", 1) +
      `<path d="M15.4 17.6 14.6 21l3.2-1.2 4.2-4.2-2.4-2.4z" fill="${GOLD}"/>` +
      `<path d="M20.2 11.6 22.6 14l-1.4 1.4-2.4-2.4z" fill="${LOUD}"/>`
  ),
};
