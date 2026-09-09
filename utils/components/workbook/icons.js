/* ============================================================================
   PRINTABLE WORKBOOK — the glyphs every workbook bench uses
   ----------------------------------------------------------------------------
   Our own inline SVG. No icon fonts, no emoji. A workbook that draws something
   of its own — blocks, a chart, an organiser — keeps that glyph beside itself
   and spreads it over this set.
   ========================================================================== */

export const line = (d) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const ICON = {
  /* A sheet feeding through a press and coming out the top — the thing a
     workbook page exists to do, so it is the only filled-in glyph here. */
  print: line(
    `<path d="M7 9V3.6h10V9"/><rect x="3.5" y="9" width="17" height="7.5" rx="1.4"/>` +
      `<path d="M7 14.5h10v5.9H7z"/><circle cx="17.4" cy="12" r="1" fill="currentColor" stroke="none"/>`
  ),
  /* Dice: a new seed is a new roll, and nothing else on a bench is a die. */
  dice: line(
    `<rect x="3.5" y="3.5" width="17" height="17" rx="3"/>` +
      `<circle cx="8.4" cy="8.4" r="1.25" fill="currentColor" stroke="none"/>` +
      `<circle cx="15.6" cy="8.4" r="1.25" fill="currentColor" stroke="none"/>` +
      `<circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none"/>` +
      `<circle cx="8.4" cy="15.6" r="1.25" fill="currentColor" stroke="none"/>` +
      `<circle cx="15.6" cy="15.6" r="1.25" fill="currentColor" stroke="none"/>`
  ),
  check: line(`<path d="M4.5 12.6 9.6 18 19.5 6.4"/>`),
  chevron: line(`<path d="m9 5 7 7-7 7"/>`),
  /* Sliders — the builder rail, the only glyph here that is a control rather
     than a thing on the paper. */
  sliders: line(
    `<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h12M20 17h0"/>` +
      `<circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="18" cy="17" r="2"/>`
  ),
  page: line(
    `<path d="M6 3.5h7.5L19 9v11.5H6z"/><path d="M13.2 3.6V9H19"/><path d="M9 13h7M9 16.6h5"/>`
  ),
};
