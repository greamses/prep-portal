/* ============================================================================
   Remainder Theorem Workbook — the four glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per section in the rail. Everything else on the bench — the printer, the
   die, the tick — comes from /utils/components/workbook/icons.js.
   ========================================================================== */

import { ICON as BASE, line } from "/utils/components/workbook/icons.js";

export const ICON = {
  ...BASE,
  /* A bracket with a nought inside it: the bracket, made zero. */
  bracket: line(
    `<path d="M8.5 4.2A9 9 0 0 0 8.5 19.8M15.5 4.2a9 9 0 0 1 0 15.6"/>` +
      `<ellipse cx="12" cy="12" rx="2.4" ry="3"/>`
  ),
  /* Two things exchanging places — the swap, and nothing else here is a pair
     of arrows going opposite ways. */
  swap: line(`<path d="M4 8.5h13M13.5 5 17 8.5 13.5 12M20 15.5H7M10.5 12 7 15.5 10.5 19"/>`),
  /* The frame itself in miniature: four rows, the first one full. */
  frame: line(
    `<rect x="3.5" y="3.5" width="17" height="17" rx="1.4"/>` +
      `<path d="M3.5 8.6h17M3.5 12.8h17M3.5 17h17"/>` +
      `<path d="M6.4 6h6" stroke-width="2.6"/>`
  ),
  /* Speech, because section D is the rule said out loud. */
  said: line(`<path d="M4 5.2h16v11H9.8L5.4 20v-3.8H4z"/><path d="M8 9.2h8M8 12.4h5"/>`),

  /* ── chapter 1 ── */
  /* An empty box with a question mark in it: the unknown. */
  unknown: line(`<rect x="3.5" y="4.5" width="15" height="15" rx="1.6"/><path d="M8.6 10.2a2.4 2.4 0 1 1 3.3 2.2c-.7.3-.9.8-.9 1.5"/><path d="M11 17v0"/>`),
  /* A line that goes up and down next to one that stays flat: what varies and what does not. */
  vary: line(`<path d="M3.5 9.5c2.5-5 5-5 7.5 0s5 5 9 0"/><path d="M3.5 17.5h17" stroke-dasharray="2 1.6"/>`),
  /* ── chapter 2, the bar model ── */
  /* One strip cut in two: the whole, and the part you are looking for. */
  bar: line(`<rect x="2.5" y="8.5" width="19" height="7" rx="1"/><path d="M13 8.5v7"/><path d="M2.5 18.5h19"/>`),
  /* Equal boxes and a bit over — ax + b, drawn. */
  bars: line(`<rect x="2.5" y="8.5" width="19" height="7" rx="1"/><path d="M8 8.5v7M13.5 8.5v7M17.5 8.5v7"/>`),
  /* A strip with a pencil over it: draw the model yourself. */
  pencilBar: line(`<rect x="2.5" y="13" width="14" height="6" rx="1"/><path d="m13.5 11.5 5.5-5.5a1.7 1.7 0 0 1 2.4 2.4l-5.5 5.5-3.2.8z"/>`),
};
