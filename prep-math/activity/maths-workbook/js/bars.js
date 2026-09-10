/* ============================================================================
   Remainders Workbook — fraction bars, and the division sentence
   ----------------------------------------------------------------------------
   The bars are how the remainder stops being "what is left over" and becomes a
   number. Seventeen shared between five is three whole bars and two fifths of
   a fourth one, and once a child has coloured that in, 17 ÷ 5 = 3 r 2 and
   17/5 = 3 2/5 are visibly the same sentence.

   ONE RULE, AND EVERYTHING ELSE FOLLOWS FROM IT: every bar is the same length,
   whatever it is cut into. A whole is a whole. Bars that grow with the
   denominator teach that fifths are bigger than thirds, which is the exact
   misconception the picture is meant to prevent — so the bar width below is a
   constant and the cells inside it get thinner as the denominator grows.
   ========================================================================== */

const INK = "#2a2723";
const SHADE = "#6fb7e8";
const PAPER = "#fffdf8";

const BAR_MM = 76; // one whole, always
const BAR_H = 9;
const GAP = 2.4;

/**
 * A stack of bars, each cut into `den`, with `shaded` cells coloured in from
 * the left. Pass `shaded: 0` for bars the child colours themselves.
 *
 * `bars` says how many to draw, which is not always ceil(shaded/den): a
 * question that asks for two and a quarter needs a THIRD empty bar on the page
 * or the child cannot be wrong, and being able to be wrong is the exercise.
 */
export function barsSvg(den, shaded, bars, { label = "" } = {}) {
  const n = Math.max(1, bars);
  const cell = BAR_MM / den;
  let body = "";

  for (let b = 0; b < n; b++) {
    const y = b * (BAR_H + GAP);
    for (let c = 0; c < den; c++) {
      const filled = b * den + c < shaded;
      body +=
        `<rect data-part="${b * den + c}"${filled ? ' data-shaded="1"' : ""} x="${(c * cell).toFixed(2)}" y="${y}" width="${cell.toFixed(2)}" height="${BAR_H}" ` +
        `fill="${filled ? SHADE : PAPER}" stroke="${INK}" stroke-width="0.45"/>`;
    }
    /* The outline is drawn again over the cells so the WHOLE reads as one
       object and not as a row of little boxes. */
    body +=
      `<rect x="0" y="${y}" width="${BAR_MM}" height="${BAR_H}" fill="none" ` +
      `stroke="${INK}" stroke-width="0.9"/>`;
  }

  const h = n * BAR_H + (n - 1) * GAP;
  return (
    `<svg viewBox="-0.6 -0.6 ${BAR_MM + 1.2} ${h + 1.2}" width="${BAR_MM}mm" height="${h}mm" ` +
    `class="rw-bars" role="img" aria-label="${label || `${n} bars cut into ${den}`}">${body}</svg>`
  );
}

/** How many bars a mixed number needs on the page, with one spare to be wrong in. */
export function barsNeeded(whole, num) {
  return whole + (num > 0 ? 1 : 1);
}

/* ── the division sentence ─────────────────────────────────────────────────*/

/**
 * The sentence with every part NAMED under it.
 *
 * This is the organiser the whole of section B is: a child who can work out
 * 17 ÷ 5 = 3 r 2 and still cannot answer "what is the divisor?" has learned a
 * procedure and not an idea. So the words sit under the numbers, in the same
 * places, every time — and the exercises take the numbers away, or the words,
 * and ask for the other.
 *
 * `given` decides which cells are printed and which are blank; `named` decides
 * whether the words under them are printed.
 */
export function sentence({ n, d, q, r }, { given = {}, named = true, ask = null } = {}) {
  const cell = (key, value, word) => {
    const shown = given[key] !== undefined ? given[key] : value;
    const body = shown === null ? `<span class="rw-sentence__blank"></span>` : shown;
    const asking = ask === key ? " rw-sentence__cell--ask" : "";
    return (
      `<span class="rw-sentence__part${asking}">` +
      `<span class="rw-sentence__cell">${body}</span>` +
      `<span class="rw-sentence__word">${named ? word : ""}</span>` +
      `</span>`
    );
  };
  const sign = (s) => `<span class="rw-sentence__sign">${s}</span>`;

  return (
    `<span class="rw-sentence">` +
    cell("n", n, "how many there were") +
    sign("÷") +
    cell("d", d, "the divisor") +
    sign("=") +
    cell("q", q, "how many groups") +
    sign("r") +
    cell("r", r, "the remainder") +
    `</span>`
  );
}

/** "3 2/5" — a mixed number, or a blank one to fill in. */
export function mixed(whole, num, den, { blank = false } = {}) {
  const b = (v) => (blank ? `<span class="rw-fill"></span>` : v);
  return (
    `<span class="rw-mixed">` +
    `<span class="rw-mixed__whole">${b(whole)}</span>` +
    `<span class="rw-frac">` +
    `<span class="rw-frac__top">${b(num)}</span>` +
    `<span class="rw-frac__bot">${b(den)}</span>` +
    `</span></span>`
  );
}

/** "17/5" — an improper fraction, or a blank one to fill in. */
export function improper(num, den, { blank = false } = {}) {
  const b = (v) => (blank ? `<span class="rw-fill"></span>` : v);
  return (
    `<span class="rw-frac rw-frac--big">` +
    `<span class="rw-frac__top">${b(num)}</span>` +
    `<span class="rw-frac__bot">${b(den)}</span>` +
    `</span>`
  );
}
