/* ============================================================================
   Maths Workbook — the shapes a fraction is coloured into
   ----------------------------------------------------------------------------
   A fraction bar is one whole cut into equal parts, and so is a pie, and so is
   a grid of squares. The three are here for one reason: a child who has only
   ever seen quarters as a pie thinks a quarter is a wedge. Meeting the same
   fraction as a wedge, as a strip and as squares is what makes it a NUMBER
   rather than a picture.

   Two rules the drawings obey:

   THE PARTS ARE EQUAL AND LOOK EQUAL. Every cut is measured, never eyeballed,
   because "equal parts" is the half of the definition children drop first.

   THE SHAPE IS THE SAME SIZE WHATEVER IT IS CUT INTO. A pie of fifths is
   exactly as big as a pie of thirds, so fifths visibly being smaller is a fact
   about the fifths and not about the pie. Same reasoning as the bars in
   bars.js, carried onto every shape here.
   ========================================================================== */

const INK = "#2a2723";
const SHADE = "#6fb7e8";
const PAPER = "#fffdf8";

export const SHAPE_KINDS = ["pie", "bar", "grid"];

/* ── the pie ───────────────────────────────────────────────────────────────*/

const R = 13; // millimetres; every pie on the paper is this size

function wedge(i, den) {
  const a0 = (2 * Math.PI * i) / den - Math.PI / 2;
  const a1 = (2 * Math.PI * (i + 1)) / den - Math.PI / 2;
  const x0 = R + R * Math.cos(a0);
  const y0 = R + R * Math.sin(a0);
  const x1 = R + R * Math.cos(a1);
  const y1 = R + R * Math.sin(a1);
  const big = a1 - a0 > Math.PI ? 1 : 0;
  if (den === 1) {
    return `<circle cx="${R}" cy="${R}" r="${R}"/>`;
  }
  return `<path d="M${R} ${R} L${x0.toFixed(2)} ${y0.toFixed(2)} ` +
    `A${R} ${R} 0 ${big} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z"/>`;
}

function pie(den, shaded) {
  let body = "";
  for (let i = 0; i < den; i++) {
    const fill = i < shaded ? SHADE : PAPER;
    /* data-part / data-shaded: which part this is, and whether it came
       coloured — so the on-screen layer can let a child colour it in */
    const tag = `data-part="${i}"${i < shaded ? ' data-shaded="1"' : ""} `;
    body += wedge(i, den).replace("<path ", `<path ${tag}fill="${fill}" stroke="${INK}" stroke-width="0.45" `)
      .replace("<circle ", `<circle ${tag}fill="${fill}" stroke="${INK}" stroke-width="0.45" `);
  }
  /* The rim last, over the cuts, so the whole reads as one object. */
  body += `<circle cx="${R}" cy="${R}" r="${R}" fill="none" stroke="${INK}" stroke-width="0.9"/>`;
  return { body, w: R * 2, h: R * 2 };
}

/* ── the bar ───────────────────────────────────────────────────────────────*/

const BAR_W = 56;
const BAR_H = 11;

function bar(den, shaded) {
  const cell = BAR_W / den;
  let body = "";
  for (let i = 0; i < den; i++) {
    body +=
      `<rect data-part="${i}"${i < shaded ? ' data-shaded="1"' : ""} x="${(i * cell).toFixed(2)}" y="0" width="${cell.toFixed(2)}" height="${BAR_H}" ` +
      `fill="${i < shaded ? SHADE : PAPER}" stroke="${INK}" stroke-width="0.45"/>`;
  }
  body += `<rect x="0" y="0" width="${BAR_W}" height="${BAR_H}" fill="none" stroke="${INK}" stroke-width="0.9"/>`;
  return { body, w: BAR_W, h: BAR_H };
}

/* ── the grid ──────────────────────────────────────────────────────────────*/

/**
 * A rectangle of squares. Only offered for denominators that make a tidy
 * rectangle — a grid of sevens is a row of sevens, which is a bar wearing a
 * different name.
 */
export function gridFits(den) {
  return [4, 6, 8, 9, 10, 12].includes(den);
}

function gridShape(den, shaded) {
  const cols = { 4: 2, 6: 3, 8: 4, 9: 3, 10: 5, 12: 4 }[den] || den;
  const rows = den / cols;
  const s = 9; // millimetres a side
  let body = "";
  for (let i = 0; i < den; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    body +=
      `<rect data-part="${i}"${i < shaded ? ' data-shaded="1"' : ""} x="${c * s}" y="${r * s}" width="${s}" height="${s}" ` +
      `fill="${i < shaded ? SHADE : PAPER}" stroke="${INK}" stroke-width="0.45"/>`;
  }
  body += `<rect x="0" y="0" width="${cols * s}" height="${rows * s}" fill="none" ` +
    `stroke="${INK}" stroke-width="0.9"/>`;
  return { body, w: cols * s, h: rows * s };
}

/* ── one shape ─────────────────────────────────────────────────────────────*/

/**
 * `den` equal parts, `shaded` of them coloured in. Pass shaded 0 for a shape a
 * child colours themselves.
 */
export function shapeSvg(kind, den, shaded, { label = "" } = {}) {
  const made =
    kind === "pie" ? pie(den, shaded)
      : kind === "grid" && gridFits(den) ? gridShape(den, shaded)
        : bar(den, shaded);
  return (
    `<svg viewBox="-0.6 -0.6 ${made.w + 1.2} ${made.h + 1.2}" ` +
    `width="${made.w}mm" height="${made.h}mm" class="mf-shape" role="img" ` +
    `aria-label="${label || `${den} equal parts, ${shaded} coloured in`}">${made.body}</svg>`
  );
}

/** Which shapes can show this denominator. */
export function kindsFor(den) {
  const out = ["pie", "bar"];
  if (gridFits(den)) out.push("grid");
  return out;
}

/* ── a fraction, written ───────────────────────────────────────────────────*/

/** 3/4, or a blank one to fill in. Shares its look with bars.js. */
export function frac(num, den, { blank = false, big = false } = {}) {
  const b = (v) => (blank ? `<span class="rw-fill"></span>` : v);
  return (
    `<span class="rw-frac${big ? " rw-frac--big" : ""}">` +
    `<span class="rw-frac__top">${b(num)}</span>` +
    `<span class="rw-frac__bot">${b(den)}</span>` +
    `</span>`
  );
}
