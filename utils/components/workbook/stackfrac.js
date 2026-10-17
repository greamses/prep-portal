/* ============================================================================
   A FRACTION IS WRITTEN ONE FIGURE OVER THE OTHER
   ----------------------------------------------------------------------------
   *"Use stack fraction instead of slash fraction across all videos."* And the
   reason is the teaching, not the typography: three sixths is a TOP number
   and a BOTTOM number, the bottom names the part and the top counts them, and
   every film in this chapter says those two words out loud. Written 3/6 there
   is no top and no bottom — there is a left and a right, and a child who has
   been told to look at the bottom number has to translate before they can
   obey.

   Two of them, because a film writes in two places: HTML, for the tiles that
   stand beside the drawing, and SVG, for a mark inside a drawing. Both take
   their colour from what they are written in, so a line that is coloured for
   emphasis takes its fraction with it.
   ========================================================================== */

/** One stacked fraction, inline in a line of HTML. */
export const fracHtml = (n, d) =>
  `<span class="sf" style="display:inline-grid;grid-template-rows:1fr 1fr;justify-items:center;`
  /* MIDDLE, not the baseline. A stacked fraction is two lines tall, so sat on
     the baseline it hangs below the words and the + and = beside it ride up
     over its numerator. Centred on the line, the rule lands where the signs
     are and the sum reads straight across. */
  + `align-items:center;vertical-align:middle;line-height:1.04;margin:0 0.14em">`
  + `<span style="padding:0 0.16em">${n}</span>`
  + `<span style="padding:0 0.16em;border-top:0.085em solid currentColor">${d}</span></span>`;

/** Every a/b in a line of words, written properly. */
export const stackText = (s) =>
  String(s == null ? "" : s).replace(/(\d+)\s*\/\s*(\d+)/g, (_, a, b) => fracHtml(a, b));

/** Whether a piece of text is nothing but a fraction. */
export const isFraction = (s) => /^\s*\d+\s*\/\s*\d+\s*$/.test(String(s == null ? "" : s));

const f = (n) => Number(n.toFixed(2));

/**
 * One stacked fraction as a mark inside a drawing, centred on (x, y) the way
 * the single line of text it replaces would have been.
 *
 * The colour is set on the GROUP and not on the figures, so that a film which
 * lights a mark up gets the whole fraction and not half of it.
 */
export function fracSvg(x, y, n, d, { size = 4.2, weight = 700, ink = "#2a2723",
  tag = "", row = null, ask = false } = {}) {
  /* A STACKED FRACTION IS TWO LINES TALL WHERE A FIGURE IS ONE, and the room
     above a brace was measured for one — so the figures are set a little
     smaller and the two lines pulled close, which keeps the whole fraction
     inside the band the single number had and off the curve of the brace. */
  const fs = size * 0.72;
  const rule = y - size * 0.42;                      // about where the figure's middle was
  const wide = Math.max(String(n).length, String(d).length);
  const half = fs * 0.36 * wide + size * 0.08;
  return `<g${tag ? ` data-mb="${tag}"` : ""}${row != null ? ` data-mb-row="${row}"` : ""}`
    + `${ask ? ' data-ask="1"' : ""} fill="${ink}" font-family="JetBrains Mono, monospace"`
    + ` font-weight="${weight}" text-anchor="middle">`
    + `<text x="${f(x)}" y="${f(rule - size * 0.1)}" font-size="${f(fs)}">${n}</text>`
    + `<line x1="${f(x - half)}" y1="${f(rule)}" x2="${f(x + half)}" y2="${f(rule)}"`
    + ` stroke="${ink}" stroke-width="${f(size * 0.085)}" stroke-linecap="round"/>`
    + `<text x="${f(x)}" y="${f(rule + size * 0.62)}" font-size="${f(fs)}">${d}</text></g>`;
}

/** The two figures of a fraction written as `a/b`. */
export const partsOf = (s) => String(s).trim().split("/").map((p) => p.trim());
