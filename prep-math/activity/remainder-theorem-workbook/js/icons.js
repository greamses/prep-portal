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
};
