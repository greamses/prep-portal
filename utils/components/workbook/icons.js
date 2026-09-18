/* ============================================================================
   PRINTABLE WORKBOOK — the glyphs every workbook bench uses
   ----------------------------------------------------------------------------
   Our own inline SVG. No icon fonts, no emoji. A workbook that draws something
   of its own — blocks, a chart, an organiser — keeps that glyph beside itself
   and spreads it over this set.

   THE HOUSE STYLE IS THE NAV'S (utils/components/nav-icons.js): a 24×24 grid,
   chunky rounded shapes filled in the theme's accent tokens with white
   highlights, and no hard outlines. Colour does the work, and because the
   fills are tokens the whole set re-tints in light and dark on its own. White
   is only ever used enclosed by a coloured shape, so nothing disappears into
   the sticky note behind it.

   ONE RULE MATTERS MORE THAN THE PALETTE, and it is what makes a drawing
   survive at the size it is actually used:

        THE THING THAT TELLS THIS GLYPH FROM ITS NEIGHBOUR IS DRAWN LOUD.
        EVERYTHING THEY SHARE IS DRAWN QUIET.

   These glyphs live at about 22px on a rail. Four geometry sections can be the
   same two parallels and the same transversal, differing only in which angle is
   marked — and drawn evenly, all four become one grey smudge at 22px. So the
   shared scaffold goes down thin, in `QUIET`, and the distinguishing mark goes
   on top as a big filled shape in `LOUD`. Read the four transversal glyphs in
   geometry-workbook/js/icons.js for the case this rule was written for: the
   marked angles are what you see first, and the lines are what you see second.
   That is the right way round, and it is the opposite of how the line-art set
   that came before drew them.

   Every glyph also has its name in a tooltip on the rail, so the drawing does
   not have to carry the whole distinction alone — but it should carry as much
   of it as 22px allows.
   ========================================================================== */

/** The house wrapper: a bare 24×24 object, like the nav's. */
export const svg = (paths) =>
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${paths}</svg>`;

/* The palette, named by job rather than by colour, so a glyph says what it
   means and not what it looks like. These are the theme's own tokens. */
export const LOUD = "var(--accent-danger)";      // the mark that distinguishes
export const QUIET = "var(--text-tertiary)";     // shared scaffold, kept back
export const PAPER = "var(--accent-secondary)";  // sky: paper, boards, bodies
export const GOLD = "var(--accent-primary)";     // butter: the active part
export const LEAF = "var(--accent-success)";     // right, done, kept
export const WARM = "var(--accent-warning)";     // orange: tools, wood, rulers
export const INK = "var(--ink)";

/**
 * A rule drawn as a filled bar rather than a stroke, so it keeps the house
 * style and still lands on an exact line. `w` is its thickness.
 *   bar(3, 8, 21, 8, 2)      a horizontal at y=8
 *   bar(4, 3, 18, 20, 1.6)   any slope
 */
export function bar(x1, y1, x2, y2, w = 2, fill = QUIET) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return (
    `<rect x="${(cx - len / 2).toFixed(2)}" y="${(cy - w / 2).toFixed(2)}" ` +
    `width="${len.toFixed(2)}" height="${w}" rx="${(w / 2).toFixed(2)}" fill="${fill}" ` +
    `transform="rotate(${ang.toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)})"/>`
  );
}

/**
 * A filled wedge: the angle mark that replaces a hairline arc. It is drawn as
 * a real sector so it sits inside its corner, and at `r = 6` it is still four
 * or five pixels across on a rail — which an arc of stroke-width 1.9 is not.
 *
 *   at    [x, y] the corner
 *   from  direction of one arm, as [dx, dy]
 *   to    direction of the other
 */
export function wedge(at, from, to, r = 6, fill = LOUD) {
  const a0 = Math.atan2(from[1], from[0]);
  let a1 = Math.atan2(to[1], to[0]);
  while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI;
  while (a1 - a0 < -Math.PI) a1 += 2 * Math.PI;
  let d = `M${at[0].toFixed(2)} ${at[1].toFixed(2)}`;
  for (let i = 0; i <= 10; i++) {
    const t = a0 + ((a1 - a0) * i) / 10;
    d += ` L${(at[0] + Math.cos(t) * r).toFixed(2)} ${(at[1] + Math.sin(t) * r).toFixed(2)}`;
  }
  return `<path d="${d}Z" fill="${fill}"/>`;
}

/**
 * Put a glyph on a button and move its words into the tooltip — the rule the
 * tool rail and the chapter tabs already follow, now for the bench's own
 * controls. The words stay in the markup, clipped to a pixel, because a
 * screen reader still has to be able to say what the button does.
 *
 * The tooltip is the site's one component (/utils/components/tooltip.js),
 * reached through `data-tip` — NOT `title`, which would have the browser draw
 * a second, unstyled tooltip on top of it.
 *
 *   faceOf(printBtn, ICON.print, "Print")
 */
export function faceOf(btn, glyph, name, side) {
  if (!btn) return btn;
  btn.innerHTML = `<span class="wb-btn__ico" aria-hidden="true">${glyph}</span><em class="wb-btn__name">${name}</em>`;
  btn.dataset.tip = name;
  if (side) btn.dataset.tipSide = side;
  btn.setAttribute("aria-label", name);
  btn.removeAttribute("title");
  return btn;
}

export const ICON = {
  /* A sheet feeding through a press and coming out the front — the thing a
     workbook page exists to do. */
  print: svg(
    `<rect x="6.8" y="2.6" width="10.4" height="5.8" rx="1.3" fill="${PAPER}"/>` +
      `<rect x="2.6" y="8.2" width="18.8" height="7.8" rx="2.2" fill="${GOLD}"/>` +
      `<circle cx="18.2" cy="12" r="1.2" fill="#fff"/>` +
      `<rect x="6.8" y="13.6" width="10.4" height="7.8" rx="1.3" fill="${WARM}"/>` +
      `<rect x="8.6" y="16.2" width="6.8" height="1.3" rx="0.65" fill="#fff"/>` +
      `<rect x="8.6" y="18.5" width="4.4" height="1.3" rx="0.65" fill="#fff"/>`
  ),
  /* Dice: a new seed is a new roll, and nothing else on a bench is a die. */
  dice: svg(
    `<rect x="2.6" y="2.6" width="18.8" height="18.8" rx="4.2" fill="${PAPER}"/>` +
      `<circle cx="8.2" cy="8.2" r="1.75" fill="#fff"/>` +
      `<circle cx="15.8" cy="8.2" r="1.75" fill="#fff"/>` +
      `<circle cx="12" cy="12" r="1.75" fill="${GOLD}"/>` +
      `<circle cx="8.2" cy="15.8" r="1.75" fill="#fff"/>` +
      `<circle cx="15.8" cy="15.8" r="1.75" fill="#fff"/>`
  ),
  /* Marked right — the same badge the dashboard and the flashcards use. */
  check: svg(
    `<circle cx="12" cy="12" r="9.6" fill="${LEAF}"/>` +
      `<path d="M7.4 12.4l3 3 6.2-6.7" fill="none" stroke="#fff" stroke-width="2.3" ` +
      `stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  /* Onwards. Filled rather than stroked, so it belongs to this set; it is the
     one glyph here that is pure direction and it stays in one colour. */
  chevron: svg(
    `<path d="M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z" fill="${PAPER}"/>`
  ),
  /* Sliders — the builder rail, the only glyph here that is a control rather
     than a thing on the paper. Three tracks, three knobs, read at a glance. */
  sliders: svg(
    `<rect x="2.6" y="5.2" width="18.8" height="3.4" rx="1.7" fill="${PAPER}"/>` +
      `<rect x="2.6" y="10.3" width="18.8" height="3.4" rx="1.7" fill="${GOLD}"/>` +
      `<rect x="2.6" y="15.4" width="18.8" height="3.4" rx="1.7" fill="${LEAF}"/>` +
      `<circle cx="15.6" cy="6.9" r="2.4" fill="#fff"/>` +
      `<circle cx="8.4" cy="12" r="2.4" fill="#fff"/>` +
      `<circle cx="17.4" cy="17.1" r="2.4" fill="#fff"/>`
  ),
  /* A page of the booklet: the corner turned down is what says "page" and not
     "card", so the corner is the loud part. */
  page: svg(
    `<path d="M5.4 4.2a2 2 0 0 1 2-2h6.2l6 6v11.6a2 2 0 0 1-2 2H7.4a2 2 0 0 1-2-2z" fill="${PAPER}"/>` +
      `<path d="M13.6 2.2l6 6h-4.6a1.4 1.4 0 0 1-1.4-1.4z" fill="${GOLD}"/>` +
      `<rect x="8.2" y="12.4" width="7.6" height="1.5" rx="0.75" fill="#fff"/>` +
      `<rect x="8.2" y="15.6" width="5.2" height="1.5" rx="0.75" fill="#fff" opacity="0.85"/>`
  ),
};
