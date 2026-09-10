/* ============================================================================
   Maths Workbook — the clock face
   ----------------------------------------------------------------------------
   One drawing, used by every question about time, and by the counting-in-fives
   questions that come before them.

   THE FIVES ARE WHY COUNTING IN FIVES IS ON THIS PAPER AT ALL. A clock has
   sixty minutes and twelve numbers, and the whole of "twenty-five past" is the
   ability to land on 5, 10, 15, 20, 25 while pointing at 1, 2, 3, 4, 5. So the
   face can be drawn with the minute count printed OUTSIDE the hour numbers —
   which is the bridge — and then drawn again without it, which is the lesson.

   THE TWO HANDS ARE NEVER THE SAME LENGTH OR THE SAME WEIGHT. Telling the time
   goes wrong at "which hand am I reading", and a clock whose hands are nearly
   alike is a clock that teaches guessing. The hour hand here is short and fat,
   the minute hand long and thin, and they are different colours as well —
   three signals, because none of them can be the only one on a photocopy.

   THE HOUR HAND MOVES BETWEEN THE NUMBERS. At half past three it points
   halfway between the 3 and the 4, because it does, and a child taught on
   clocks where it points straight at the 3 has been taught something they will
   have to unlearn at a real clock.
   ========================================================================== */

const INK = "#2a2723";
const FACE = "#fffdf8";
const HOUR_COL = "#c0453f"; // short, fat, red
const MIN_COL = "#2f6ea8"; // long, thin, blue
const FIVES_COL = "#6b655c";

const R = 21; // millimetres to the rim
const PAD = 8; // room outside the rim for the counted fives

const pt = (deg, r, cx, cy) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

/**
 * A clock face.
 *
 * `h` and `m` are the time; pass `hands: false` for a face a child draws the
 * hands onto. `fives` prints the minute count outside the hour numbers — the
 * bridge from counting in fives to telling the time, and off by default
 * because a clock that always shows it is a clock nobody learns to read.
 */
export function clockSvg(h, m, { hands = true, fives = false, label = "", mm = 0 } = {}) {
  const size = (R + PAD) * 2;
  const c = R + PAD;
  let body = "";

  /* the face */
  body += `<circle cx="${c}" cy="${c}" r="${R}" fill="${FACE}" stroke="${INK}" stroke-width="1.1"/>`;

  /* sixty minute ticks, every fifth one long — the fives are visible on the
     face before anyone counts them */
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0;
    const [x1, y1] = pt(i * 6, R - (big ? 3.2 : 1.4), c, c);
    const [x2, y2] = pt(i * 6, R - 0.4, c, c);
    body +=
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" ` +
      `stroke="${INK}" stroke-width="${big ? 0.75 : 0.35}"/>`;
  }

  /* the twelve hours */
  for (let n = 1; n <= 12; n++) {
    const [x, y] = pt(n * 30, R - 6.2, c, c);
    body +=
      `<text x="${x.toFixed(2)}" y="${(y + 1.9).toFixed(2)}" text-anchor="middle" ` +
      `font-family="JetBrains Mono, monospace" font-size="5.2" font-weight="700" ` +
      `fill="${INK}">${n}</text>`;
  }

  /* the minute count, outside the rim */
  if (fives) {
    for (let n = 1; n <= 12; n++) {
      const [x, y] = pt(n * 30, R + 4.4, c, c);
      body +=
        `<text x="${x.toFixed(2)}" y="${(y + 1.5).toFixed(2)}" text-anchor="middle" ` +
        `font-family="JetBrains Mono, monospace" font-size="4" font-weight="600" ` +
        `fill="${FIVES_COL}">${(n * 5) % 60}</text>`;
    }
  }

  if (hands) {
    /* The hour hand moves with the minutes: at half past three it is halfway
       between the 3 and the 4, because it is. */
    const hourDeg = ((h % 12) + m / 60) * 30;
    const [hx, hy] = pt(hourDeg, R * 0.52, c, c);
    body +=
      `<line x1="${c}" y1="${c}" x2="${hx.toFixed(2)}" y2="${hy.toFixed(2)}" ` +
      `stroke="${HOUR_COL}" stroke-width="2.4" stroke-linecap="round"/>`;

    const [mx, my] = pt(m * 6, R * 0.84, c, c);
    body +=
      `<line x1="${c}" y1="${c}" x2="${mx.toFixed(2)}" y2="${my.toFixed(2)}" ` +
      `stroke="${MIN_COL}" stroke-width="1.1" stroke-linecap="round"/>`;
  }

  body += `<circle cx="${c}" cy="${c}" r="1.3" fill="${INK}"/>`;

  /* The drawing is always the same drawing; `mm` only says how big to print
     it. A clock in a list of four beside a column of words has to be smaller
     than one a child draws the hands onto, and shrinking the whole thing keeps
     the numbers in proportion to the face. */
  const out = mm || size;
  /* Where hands can be drawn on a blank face, for the on-screen layer: the
     centre, then twelve points on an inner ring (the SHORT hour hand) and
     twelve on an outer ring (the LONG minute hand), 1 to 12 in order. */
  let spots = "";
  if (!hands) {
    const ring = (rr) => Array.from({ length: 12 }, (_, i) => pt((i + 1) * 30, rr, c, c).map((v) => v.toFixed(2)).join(","));
    spots = ` data-pts="${[`${c},${c}`, ...ring(R * 0.5), ...ring(R * 0.84)].join(" ")}"`;
  }
  return (
    `<svg viewBox="0 0 ${size} ${size}" width="${out}mm" height="${out}mm" ` +
    `class="mt-clock"${spots} role="img" aria-label="${label || (hands ? `A clock showing ${digital(h, m)}` : "A blank clock face")}">` +
    `${body}</svg>`
  );
}

/** The little key that says which hand is which. Printed once, per section. */
export function handKey() {
  return (
    `<div class="mt-key">` +
    `<span class="mt-key__one"><span class="mt-key__hand mt-key__hand--hour"></span>` +
    `the <b>hour</b> hand — short and fat</span>` +
    `<span class="mt-key__one"><span class="mt-key__hand mt-key__hand--min"></span>` +
    `the <b>minute</b> hand — long and thin</span>` +
    `</div>`
  );
}

/* ── saying the time ───────────────────────────────────────────────────────*/

const HOURS = [
  "twelve", "one", "two", "three", "four", "five",
  "six", "seven", "eight", "nine", "ten", "eleven",
];

const MINUTES = {
  5: "five", 10: "ten", 15: "quarter", 20: "twenty", 25: "twenty-five",
  30: "half", 35: "twenty-five", 40: "twenty", 45: "quarter", 50: "ten", 55: "five",
};

/** "3:25" — the digital face, always two figures for the minutes. */
export function digital(h, m) {
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")}`;
}

/**
 * "half past three", "quarter to four", "twenty-five past three".
 *
 * Past up to and including half, TO after it — and the hour changes when it
 * turns to "to", which is the single fact that makes "quarter to four" mean a
 * clock whose hour hand is nearly at four while the child is still thinking
 * about three.
 */
export function timeWords(h, m) {
  const hh = h % 12;
  const next = (hh + 1) % 12;
  if (m === 0) return `${HOURS[hh]} o'clock`;
  if (m === 30) return `half past ${HOURS[hh]}`;
  if (m < 30) return `${MINUTES[m]} past ${HOURS[hh]}`;
  return `${MINUTES[m]} to ${HOURS[next]}`;
}

/** The words with a capital, for the start of a line. */
export const said = (h, m) => {
  const s = timeWords(h, m);
  return s[0].toUpperCase() + s.slice(1);
};
