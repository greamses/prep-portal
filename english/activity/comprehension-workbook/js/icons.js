/* ============================================================================
   Comprehension Workbook — the glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per section in the rail, in the house style every workbook shares
   (/utils/components/workbook/icons.js): 24×24, filled shapes in the theme's
   accent tokens, the thing that makes a section ITSELF drawn LOUD and
   everything it shares with its neighbours drawn QUIET.
   ========================================================================== */

import {
  ICON as BASE, svg, LOUD, QUIET, PAPER, GOLD, LEAF,
} from "/utils/components/workbook/icons.js";

const slab = (x, y, w, h, fill, rx = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;

export const ICON = {
  ...BASE,
  /* A numbered page with a magnifier over one of its lines: the answer is in
     there, and the exercise is finding WHICH line it is in. */
  "cm-read": svg(
    slab(2.6, 2.4, 14.8, 19.2, PAPER, 2.2)
      + slab(4.6, 5.4, 1.4, 1.4, QUIET, 0.5)
      + slab(4.6, 9, 1.4, 1.4, QUIET, 0.5)
      + slab(4.6, 12.6, 1.4, 1.4, GOLD, 0.5)
      + slab(7, 5.6, 8, 1.2, QUIET, 0.6)
      + slab(7, 9.2, 8, 1.2, QUIET, 0.6)
      + slab(7, 12.8, 8, 1.2, GOLD, 0.6)
      + `<circle cx="16.6" cy="13.4" r="4.6" fill="none" stroke="${LOUD}" stroke-width="2"/>`
      + `<path d="M19.9 16.7 22.2 19" stroke="${LOUD}" stroke-width="2.4" stroke-linecap="round"/>`,
  ),

  /* ── the five context clues ──────────────────────────────────────────────
     One sentence drawn QUIET in every one of them, with the hard word GOLD,
     so the five read as one family; what changes is the mark underneath,
     which is the kind of clue. That is the whole idea of IDEAS: the same
     sentence tells you in five different ways. */
  ...Object.fromEntries([
    /* I · a line that stops at a question: nothing says it */
    ["cm-ctx-i", `<path d="M5.4 17.6c1.6-2.4 4-2.4 5.6 0" fill="none" stroke="${LOUD}" stroke-width="2"`
      + ` stroke-linecap="round"/><circle cx="14.4" cy="17.8" r="1.5" fill="${LOUD}"/>`
      + `<path d="M18.2 17.8h1.2" stroke="${LOUD}" stroke-width="2" stroke-linecap="round"/>`],
    /* D · an equals sign: the sentence says what it is */
    ["cm-ctx-d", `<rect x="5.4" y="16.2" width="13.2" height="2" rx="1" fill="${LOUD}"/>`
      + `<rect x="5.4" y="19.6" width="13.2" height="2" rx="1" fill="${LOUD}"/>`],
    /* E · three of a kind */
    ["cm-ctx-e", `<circle cx="7" cy="18.4" r="2" fill="${LOUD}"/><circle cx="12" cy="18.4" r="2" fill="${LOUD}"/>`
      + `<circle cx="17" cy="18.4" r="2" fill="${LOUD}"/>`],
    /* A · two arrows walking away from each other */
    ["cm-ctx-a", `<path d="M11 18.4H5.6M8 15.8l-2.6 2.6L8 21" fill="none" stroke="${LOUD}" stroke-width="2"`
      + ` stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="M13 18.4h5.4M16 15.8l2.6 2.6L16 21" fill="none" stroke="${LOUD}" stroke-width="2"`
      + ` stroke-linecap="round" stroke-linejoin="round"/>`],
    /* S · two words the same length, side by side */
    ["cm-ctx-s", slab(4.4, 16.6, 7, 2.4, LOUD, 1) + slab(12.6, 16.6, 7, 2.4, LEAF, 1)],
  ].map(([id, mark]) => [id, svg(
    slab(2.6, 2.4, 18.8, 11.4, PAPER, 2)
      + slab(5, 5.4, 8.6, 1.5, QUIET, 0.7)
      + slab(14.6, 5.4, 4.4, 1.5, GOLD, 0.7)
      + slab(5, 9.2, 5, 1.5, GOLD, 0.7)
      + slab(11.6, 9.2, 7.4, 1.5, QUIET, 0.7)
      + mark,
  )])),
};
