/* ============================================================================
   Algebra Workbook — growing patterns, for the sequences section of CHAPTER 6
   ----------------------------------------------------------------------------
   A sequence is a function machine fed with the PLACE: 1 goes in and the first
   term comes out, 2 gives the second, and so on. A growing pattern is that
   drawn: the pattern in place p is p lots of the same little group, plus the
   few that were there from the start and never change.

     patternSvg(3, 2, 4)   four lots of three, and two extra: 14 squares

   The lots are drawn in one colour and the extra in another, on purpose: the
   colours are the × and the + of the rule, so a child can see 3p + 2 before
   anybody writes it down. Millimetres, at the paper's own size.
   ========================================================================== */

const INK = "#2a2723";
const LOT = "#bfe3ff";
const EXTRA = "#ffd7a3";
const GREY = "#6b645a";

const f = (n) => (+n).toFixed(2);
const text = (x, y, t, { size = 3, col = INK, weight = 700, anchor = "middle" } = {}) =>
  `<text x="${f(x)}" y="${f(y + size * 0.36)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}">${t}</text>`;

/** One pattern: `p` lots of `a` squares standing in a column, then `b` extra. */
export function patternSvg(a, b, p, { cell = 4.2, label = "" } = {}) {
  const cols = p + (b ? 1 : 0);
  const rows = Math.max(a, b, 1);
  const W = cols * (cell + 1) + 3;
  const H = rows * (cell + 1) + (label ? 7.5 : 3);
  const top = label ? 6 : 1.5;
  let body = "";
  for (let c = 0; c < p; c++) {
    for (let r = 0; r < a; r++) {
      body += `<rect x="${f(1.5 + c * (cell + 1))}" y="${f(top + (rows - 1 - r) * (cell + 1))}" width="${f(cell)}" height="${f(cell)}" rx="0.6" fill="${LOT}" stroke="${INK}" stroke-width="0.35"/>`;
    }
  }
  for (let r = 0; r < b; r++) {
    body += `<rect x="${f(1.5 + p * (cell + 1))}" y="${f(top + (rows - 1 - r) * (cell + 1))}" width="${f(cell)}" height="${f(cell)}" rx="0.6" fill="${EXTRA}" stroke="${INK}" stroke-width="0.35"/>`;
  }
  if (label) body += text(W / 2, 2.4, label, { size: 2.8, col: GREY });
  return `<svg class="sq-fig" viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" role="img" aria-label="${label || `Pattern ${p}`}: ${p} lots of ${a}${b ? ` and ${b} more` : ""}">${body}</svg>`;
}

/** The first few patterns in a row, each with its place written under it. */
export const patternRowHtml = (a, b, places) =>
  `<div class="sq-row">${places.map((p) => `<div class="sq-one">${patternSvg(a, b, p, { label: `Place ${p}` })}</div>`).join("")}</div>`;

/** The rule as it is written for a sequence: 3n + 2, n − 4, 5n — and with a
    word in place of the letter, "3 × place + 2", because 3place is not English. */
export const nth = (a, b, v = "n") => {
  const word = v.length > 1;
  const many = String(a).replace("-", "−");
  const front = a === 1 ? v : a === -1 ? `−${word ? " " : ""}${v}` : `${many}${word ? " × " : ""}${v}`;
  return `${front}${b === 0 ? "" : b > 0 ? ` + ${b}` : ` − ${-b}`}`;
};

/** The terms of a sequence, by place. */
export const termsOf = (a, b, upTo = 5) => Array.from({ length: upTo }, (_, i) => a * (i + 1) + b);
