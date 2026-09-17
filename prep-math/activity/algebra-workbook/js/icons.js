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
  /* A strip with a pencil over it: draw the model yourself. */
  pencilBar: svg(
    `<rect x="2.4" y="13.4" width="13.6" height="6.4" rx="1.2" fill="${PAPER}"/>` +
      `<path d="M16.4 4.6l3 3-7.2 7.2-3-3z" fill="${GOLD}"/>` +
      `<path d="M17.8 3.2a1.9 1.9 0 0 1 2.7 2.7l-.9.9-3-3z" fill="${LEAF}"/>` +
      `<path d="M9.2 11.8l3 3-4.1 1.1z" fill="${LOUD}"/>`
  ),
};
