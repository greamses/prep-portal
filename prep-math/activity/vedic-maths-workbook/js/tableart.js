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
     wSvg       a big W — the W TRICK for the FOURS, which takes TWO of them.
                Count in twos ALONG each W: 0, 2, 4, 6, 8 — the units. Then
                the tens: 0, 0, 0 across the TOP of the first W and 1, 1
                across its BOTTOM; 2, 2, 2 across the top of the second and
                3, 3 across its bottom. Top then bottom, W by W, it reads
                00 04 08 12 16 · 20 24 28 32 36. 40 stands by itself.

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
 *   tens     a tens digit to write in front of each of them, in the tens' blue
 *   dots     false leaves the five rings out (answer boxes stand there instead)
 */
export function wSvg({ labels = ["", "", "", "", ""], tens = ["", "", "", "", ""], dots = true } = {}) {
  const path = W_POINTS.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("");
  let s = `<path d="${path}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (dots) W_POINTS.forEach(([x, y], i) => {
    const t = tens[i] ?? "", u = labels[i] ?? "";
    s += `<circle cx="${x}" cy="${y}" r="10.5" fill="${u === "" ? "#fffdf8" : "#fff3df"}" stroke="${UNITS.line}" stroke-width="1.5"/>`;
    if (u !== "" || t !== "") s += `<text x="${x}" y="${y + 4.3}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" font-weight="800">` +
      `<tspan fill="${TENS.line}">${t}</tspan><tspan fill="${UNITS.line}">${u}</tspan></text>`;
  });
  return `<svg class="vm-w" viewBox="0 0 124 76" role="img" aria-label="A big W with a number at each of its five points">${s}</svg>`;
}

/* the six digits of one seventh, in the order they stand round the wheel, the ink each keeps,
   and the paper of its slice of the spinner */
export const WHEEL = [1, 4, 2, 8, 5, 7];
export const WHEEL_INK = ["#14130f", "#7b4fa3", "#2e8b46", "#2f6ea8", "#d9632b", "#1f8a8a"];
export const WHEEL_PAPER = ["#fff3a8", "#e8c8ff", "#c8f0c0", "#bfe3ff", "#ffd7a3", "#b8ece2"];

/* ── THE SPINNER of seven ────────────────────────────────────────────────
   A wheel of six coloured slices, 1 4 2 8 5 7 clockwise from the top, with
   a pin at every join and an ARROW on a hub in the middle. The arrow spins
   to the digit an answer starts at. Drawn in two layers, so that the TV can
   turn the arrow by itself: the disc, and the arrow (pointing straight up —
   at the 1 — until it is turned). Both are 200 by 200, centred on 100, 100. */
const P = (deg, r) => { const a = (deg * Math.PI) / 180; return [100 + r * Math.cos(a), 100 + r * Math.sin(a)]; };

/** the disc: `digits` false leaves the six figures off (the TV stands its own on the slices) */
export function spinnerDisc({ digits = true } = {}) {
  let s = `<circle cx="100" cy="100" r="98" fill="#2a2723"/>`;
  WHEEL.forEach((d, i) => {
    const [x0, y0] = P(-120 + i * 60, 91), [x1, y1] = P(-60 + i * 60, 91);
    s += `<path d="M100 100L${f(x0)} ${f(y0)}A91 91 0 0 1 ${f(x1)} ${f(y1)}Z" fill="${WHEEL_PAPER[i]}" stroke="#2a2723" stroke-width="2.2" stroke-linejoin="round"/>`;
    if (digits) { const [x, y] = P(-90 + i * 60, 64); s += `<text x="${f(x)}" y="${f(y + 11)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="32" font-weight="800" fill="${WHEEL_INK[i]}">${d}</text>`; }
  });
  for (let i = 0; i < 6; i++) { const [x, y] = P(-120 + i * 60, 94.5); s += `<circle cx="${f(x)}" cy="${f(y)}" r="3.4" fill="#fffdf8" stroke="#2a2723" stroke-width="1"/>`; }
  return s;
}

/** the arrow on its hub, pointing straight up */
export function spinnerArrow() {
  return `<path d="M100 66L112 93H88Z" fill="#d93a2b" stroke="#2a2723" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M94 90H106V118H94Z" fill="#d93a2b" stroke="#2a2723" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<circle cx="100" cy="100" r="13" fill="#2a2723"/><circle cx="100" cy="100" r="5" fill="#fffdf8"/>`;
}

/**
 * The whole spinner, as it is printed.
 *   start    the digit the arrow points at (1, 2, 4, 5, 7 or 8); 0 leaves the arrow pointing at the 1
 */
export function wheelSvg({ start = 0 } = {}) {
  const turn = 60 * Math.max(0, WHEEL.indexOf(start));
  return `<svg class="vm-wheel" viewBox="0 0 200 200" role="img" aria-label="A spinner wheel with the digits 1, 4, 2, 8, 5, 7 clockwise, its arrow at the ${start || 1}">` +
    `${spinnerDisc()}<g transform="rotate(${turn} 100 100)">${spinnerArrow()}</g></svg>`;
}
