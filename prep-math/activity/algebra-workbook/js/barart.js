/* ============================================================================
   Algebra Workbook — the BAR MODEL (chapter 2)
   ----------------------------------------------------------------------------
   A tape diagram: the quantity as a strip of paper, cut into the parts the
   question talks about. It is the oldest trick for making an equation visible —
   a child who cannot start "3x + 4 = 19" can usually point at the picture and
   say "three equal boxes and a four make nineteen", and that sentence IS the
   equation.

   ONE RULE MATTERS MORE THAN EVERY OTHER HERE, and it is the rule a tidy mind
   breaks first: THE UNKNOWN BOX IS NOT DRAWN TO SCALE. Known parts are drawn
   proportionally to each other — a 6 really is twice a 3 — but every box
   holding x is drawn at the same fixed width whatever x turns out to be. Draw
   it to scale and the child reads the answer off the picture with a ruler, and
   the model has taught nothing. (It is also why two x boxes look identical:
   they are the same unknown, not two lengths that happen to match.)

   Everything is measured in millimetres at the paper's own size, like the rest
   of this site's workbooks.
   ========================================================================== */

const INK = "#2a2723";
const UNKNOWN = "#fff3a8";   // butter: the box we are looking for
const KNOWN = "#bfe3ff";     // sky: a number we were told
const GREY = "#8a837a";

const f = (n) => (+n).toFixed(2);

const BAR_H = 12;            // mm, the height of a bar
const UNKNOWN_MM = 26;       // mm, every unknown box, whatever it holds
const PAPER = 150;           // mm of paper a bar may take, margin to margin
const PAD = 1.5;
const BRACE_W = 17;          // mm: the comparison brace, and the total beside it

/**
 * One part of a bar.
 *   { text }            what is written in it
 *   { value }           a number, so it can be drawn to scale; null = unknown
 *
 * The layout is worked out for the WHOLE bar at once, because three things have
 * to hold together and none of them can be fixed part by part:
 *
 *   · the known parts are in exact proportion to each other — a 6 is twice a 3
 *     — so there is no per-part minimum width to round the small ones up with.
 *     A floor like that quietly turns 2 and 3 into the same box;
 *   · the bar fits the paper. Eight unknown boxes at a fixed 26 mm is 208 mm of
 *     a 150 mm page, so the unknown box SHRINKS when there are many of them.
 *     All of them equally: they are the same unknown and must look it;
 *   · NOTHING IS ROUNDED UP AT THE END. `budget` is the room left for the cells
 *     after the margins, the names down the side and the total brace have each
 *     been taken out of the paper's 150 mm, and no minimum width is allowed to
 *     spend more than that. A floor on the unit — "a 1 must be at least 0.7 mm"
 *     — reads as harmless and is not: at stretch, where the numbers run to 30,
 *     it is what pushed the bar off the edge of the page.
 */
function layout(parts, budget) {
  const unknowns = parts.filter((p) => p.value == null).length;
  const known = parts.filter((p) => p.value != null).reduce((s, p) => s + p.value, 0);

  /* the unknown boxes get up to two thirds of what there is between them */
  const unknownW = unknowns ? Math.min(UNKNOWN_MM, (budget * (known ? 0.62 : 0.97)) / unknowns) : 0;
  const room = budget - unknowns * unknownW;
  /* wide enough to read a two-figure number in, and never wider than the room */
  const unit = known ? Math.min(7, room / known) : 0;
  return { unknownW, unit };
}

const widthOf = (p, L) => (p.value == null ? L.unknownW : p.value * L.unit);

function cells(parts, L, x0, y) {
  let x = x0;
  let body = "";
  parts.forEach((p) => {
    const w = widthOf(p, L);
    body +=
      `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${BAR_H}" ` +
      `fill="${p.value == null ? UNKNOWN : KNOWN}" stroke="${INK}" stroke-width="0.5"/>` +
      `<text x="${f(x + w / 2)}" y="${f(y + BAR_H / 2 + 1.6)}" text-anchor="middle" ` +
      `font-family="JetBrains Mono, monospace" font-size="4.4" font-weight="700" fill="${INK}">${p.text}</text>`;
    x += w;
  });
  return { body, end: x };
}

/** A brace under or over a span, with what the whole of it comes to written on it. */
function brace(x0, x1, y, label, { under = false } = {}) {
  const tick = under ? 2.4 : -2.4;
  const mid = (x0 + x1) / 2;
  const ty = under ? y + 7.2 : y - 4.4;
  return (
    `<path d="M${f(x0)} ${f(y + tick)}V${f(y)}H${f(x1)}V${f(y + tick)}" fill="none" stroke="${GREY}" stroke-width="0.4"/>` +
    `<text x="${f(mid)}" y="${f(ty)}" text-anchor="middle" font-family="JetBrains Mono, monospace" ` +
    `font-size="4.2" font-weight="700" fill="${INK}">${label}</text>`
  );
}

const svg = (w, h, body, label) =>
  `<svg class="ab-bar" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}mm" height="${f(h)}mm" ` +
  `role="img" aria-label="${label}">${body}</svg>`;

/**
 * One bar, cut into parts, with what the whole comes to written under it.
 *
 *   parts   [{ text, value }] — value null for an unknown box
 *   whole   what the whole bar comes to, written on the brace; null for none
 */
export function barSvg(parts, { whole = null, label = "A bar model" } = {}) {
  /* a margin each side, and what is left is the bar's to spend */
  const { body, end } = cells(parts, layout(parts, PAPER - PAD * 2), PAD, 6);
  let out = body;
  if (whole !== null) out += brace(PAD, end, 6 + BAR_H + 1.2, String(whole), { under: true });
  return svg(end + PAD, whole !== null ? 30 : 21, out, label);
}

/**
 * Two bars, one above the other, left-aligned — the comparison model.
 *
 * The shorter is the first row; what the longer has EXTRA is its own box, so
 * "Ben has 4 more than Ada" is a picture of a four rather than a sentence about
 * one. `whole` braces both bars together.
 */
export function compareSvg(top, bottom, { whole = null, topName = "", bottomName = "", label = "Two bars compared" } = {}) {
  const nameW = topName || bottomName ? 16 : 0;
  /* the brace and the total written beside it are paper the bars cannot have */
  const braceW = whole !== null ? BRACE_W : 0;
  /* ONE layout for both rows: the same unknown drawn two different widths on
     two bars that are being compared is the picture telling a lie. And ONE
     budget, so the longer row is the one that has to fit. */
  const rows = [top, bottom];
  const longest = rows.reduce((m, r) => Math.max(m, r.filter((p) => p.value != null).reduce((s, p) => s + p.value, 0)), 0);
  const most = rows.reduce((m, r) => Math.max(m, r.filter((p) => p.value == null).length), 0);
  const L = layout(
    [...Array(most).fill({ value: null }), ...(longest ? [{ value: longest }] : [])],
    PAPER - PAD * 2 - nameW - braceW
  );
  const a = cells(top, L, PAD + nameW, 6);
  const b = cells(bottom, L, PAD + nameW, 6 + BAR_H + 4);
  const name = (t, y) => (t
    ? `<text x="${f(PAD)}" y="${f(y + BAR_H / 2 + 1.6)}" font-family="JetBrains Mono, monospace" ` +
      `font-size="4.2" fill="${INK}">${t}</text>`
    : "");
  let out = a.body + b.body + name(topName, 6) + name(bottomName, 6 + BAR_H + 4);
  const end = Math.max(a.end, b.end);
  let h = 6 + BAR_H * 2 + 4 + 5;
  if (whole !== null) {
    /* the brace goes down the RIGHT of both bars: one total, both rows */
    const x = end + 3;
    out +=
      `<path d="M${f(x - 2.4)} 6H${f(x)}V${f(6 + BAR_H * 2 + 4)}H${f(x - 2.4)}" fill="none" stroke="${GREY}" stroke-width="0.4"/>` +
      `<text x="${f(x + 2)}" y="${f(6 + BAR_H + 3.6)}" font-family="JetBrains Mono, monospace" ` +
      `font-size="4.2" font-weight="700" fill="${INK}">${whole}</text>`;
    return svg(x + BRACE_W - 3, h, out, label);
  }
  return svg(end + PAD, h, out, label);
}

/**
 * An empty strip to draw a bar model on: a frame, a faint middle line to keep
 * the drawing straight, and nothing else. For the questions that ask the child
 * to make the model rather than read one.
 */
export function blankBarSvg({ w = 150, h = 34 } = {}) {
  const body =
    `<rect x="0.3" y="0.3" width="${f(w - 0.6)}" height="${f(h - 0.6)}" rx="1.5" fill="none" ` +
    `stroke="${GREY}" stroke-width="0.3" stroke-dasharray="1 1.4"/>` +
    `<line x1="6" y1="${f(h / 2)}" x2="${f(w - 6)}" y2="${f(h / 2)}" stroke="${GREY}" ` +
    `stroke-width="0.25" stroke-dasharray="1.2 2"/>`;
  return svg(w, h, body, "Room to draw a bar model");
}

/** "3x + 4 = 19", written the way the paper writes it. */
export const MINUS = "−";
export function equationText(a, b, c, { letter = "x", op = "+" } = {}) {
  const lhs = a === 1 ? letter : `${a}${letter}`;
  if (b === 0) return `${lhs} = ${c}`;
  return `${lhs} ${op === "-" ? MINUS : "+"} ${b} = ${c}`;
}
