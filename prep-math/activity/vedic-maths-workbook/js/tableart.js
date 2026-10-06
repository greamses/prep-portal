/* ============================================================================
   Mental Maths Workbook — the two pictures the times-table secrets are drawn with
   ----------------------------------------------------------------------------
   Drawn once and used twice: on the paper (ex-tables.js) and on PrepBot's TV
   (explain.js), so the picture a child learns from and the picture they work
   on are the same picture.

     sticksSvg  ten counting sticks, numbered 1 to 10 — the STICKS METHOD for
                the nines. 9 is 10 − 1: take away the stick at number n, and
                the sticks to its LEFT are the tens of 9 × n, the sticks to
                its RIGHT the units.
     wSvg       a big W — the W METHOD for the FOURS. Count in twos ALONG the
                W: 0, 2, 4, 6, 8. Then go across the TOP (0, 4, 8) and then
                the BOTTOM (2, 6): those are the units of 0, 4, 8, 12, 16 —
                and they come round again for 20, 24, 28, 32, 36.

   The colours are the table's own two: blue for tens, orange for units.
   ========================================================================== */

const INK = "#2a2723";
const TENS = { fill: "#bfe3ff", line: "#2f6ea8" };
const UNITS = { fill: "#ffd7a3", line: "#d9632b" };
const f = (n) => (+n).toFixed(1);

/**
 * Ten counting sticks.
 *   take     the stick that is taken away (1 to 10), or 0 for none
 *   colour   paint the sticks left of it as tens and right of it as units
 */
export function sticksSvg({ take = 0, colour = false } = {}) {
  let s = "";
  for (let n = 1; n <= 10; n++) {
    const x = 9 + (n - 1) * 21.5;
    const gone = n === take;
    const tone = !colour || !take ? { fill: "#e9cf9c", line: INK } : n < take ? TENS : UNITS;
    s += gone
      ? `<rect x="${f(x)}" y="18" width="8" height="42" fill="none" stroke="#8a837a" stroke-width="1.2" stroke-dasharray="2.6 2"/>`
      : `<rect x="${f(x)}" y="18" width="8" height="42" fill="${tone.fill}" stroke="${tone.line}" stroke-width="1.4"/>`;
    s += `<text x="${f(x + 4)}" y="12" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8.5" font-weight="800" ` +
      `fill="${gone ? "#8a837a" : colour && take ? tone.line : INK}">${n}</text>`;
  }
  return `<svg class="vm-sticks" viewBox="0 0 220 64" role="img" aria-label="${take ? `Ten counting sticks with stick ${take} taken away` : "Ten counting sticks, numbered 1 to 10"}">${s}</svg>`;
}

/* where the W's five points are, along the stroke: top, bottom, top, bottom, top */
export const W_POINTS = [[14, 14], [38, 62], [62, 14], [86, 62], [110, 14]];

/**
 * A big W.
 *   labels   what stands at its five points, ALONG the stroke (so the bottom
 *            two are labels[1] and labels[3]); "" leaves a point empty
 *   trace    draw the arrow that says "read along it"
 */
export function wSvg({ labels = ["", "", "", "", ""], trace = false } = {}) {
  const path = W_POINTS.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("");
  let s = `<path d="${path}" fill="none" stroke="${trace ? UNITS.line : INK}" stroke-width="${trace ? 3 : 2.2}" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (trace) s += `<path d="M103.5 21.5L110 14l1.6 9.6" fill="none" stroke="${UNITS.line}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
  W_POINTS.forEach(([x, y], i) => {
    const top = i % 2 === 0;
    s += `<circle cx="${x}" cy="${y}" r="9.5" fill="${labels[i] === "" ? "#fffdf8" : UNITS.fill}" stroke="${UNITS.line}" stroke-width="1.5"/>`;
    if (labels[i] !== "") s += `<text x="${x}" y="${y + 4.2}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" font-weight="800" fill="${INK}">${labels[i]}</text>`;
    void top;
  });
  return `<svg class="vm-w" viewBox="0 0 124 76" role="img" aria-label="A big W with a number at each of its five points">${s}</svg>`;
}
