/* ============================================================================
   Mental Maths Workbook — the two pictures the times-table secrets are drawn with
   ----------------------------------------------------------------------------
   Drawn once and used twice: on the paper (ex-tables.js) and on PrepBot's TV
   (explain.js), so the picture a child learns from and the picture they work
   on are the same picture.

     handsSvg   ten fingers, numbered 1 to 10 — the FINGER METHOD for the nines.
                Fold finger n down: the fingers to its LEFT are the tens of
                9 × n and the fingers to its RIGHT are the units.
     wSvg       a big W — the W METHOD for the sixes. 2 and 4 at its two
                bottom points, 6, 8, 0 at its three top points; read ALONG the
                W from the left and it says 6, 2, 8, 4, 0: the units of
                6 × 1 to 6 × 5 (and of 6 × 6 to 6 × 10, over again).

   The colours are the table's own two: blue for tens, orange for units.
   ========================================================================== */

const INK = "#2a2723";
const TENS = { fill: "#bfe3ff", line: "#2f6ea8" };
const UNITS = { fill: "#ffd7a3", line: "#d9632b" };
const PLAIN = { fill: "#fffdf8", line: INK };
const f = (n) => (+n).toFixed(1);

/* a hand, palm towards you: little finger, ring, middle, index, thumb — how tall each stands */
const TALL = [30, 40, 46, 40, 24];

/**
 * Ten fingers.
 *   fold     the finger that is folded down (1 to 10), or 0 for none
 *   colour   paint the fingers left of the fold as tens and right of it as units
 *   numbers  write 1 to 10 over them
 */
export function handsSvg({ fold = 0, colour = false, numbers = true } = {}) {
  let s = "";
  const hand = (x0, order, first) => {
    /* the palm */
    s += `<rect x="${x0}" y="62" width="92" height="26" rx="9" fill="#f4efe2" stroke="${INK}" stroke-width="1.4"/>`;
    order.forEach((h, k) => {
      const n = first + k;
      const x = x0 + 5 + k * 17.4;
      const down = n === fold;
      const tone = !colour || !fold ? PLAIN : n < fold ? TENS : n > fold ? UNITS : PLAIN;
      const tall = down ? 9 : h;
      s += `<rect x="${f(x)}" y="${f(64 - tall)}" width="13" height="${f(tall + 4)}" rx="6.5" fill="${down ? "#e3ded2" : tone.fill}" ` +
        `stroke="${down ? "#8a837a" : tone.line}" stroke-width="1.4"${down ? ' stroke-dasharray="2.4 1.8"' : ""}/>`;
      if (numbers) s += `<text x="${f(x + 6.5)}" y="${f(64 - (down ? 30 : h) - 4)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" font-weight="800" ` +
        `fill="${down ? "#8a837a" : colour && fold ? tone.line : INK}">${n}</text>`;
    });
  };
  hand(8, TALL, 1);
  hand(120, [...TALL].reverse(), 6);
  return `<svg class="vm-hands" viewBox="0 0 220 92" role="img" aria-label="${fold ? `Ten fingers with finger ${fold} folded down` : "Ten fingers, numbered 1 to 10"}">${s}</svg>`;
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
