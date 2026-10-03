/* ============================================================================
   Maths Workbook — the SINGAPORE BAR MODEL, drawn (chapter 9)
   ----------------------------------------------------------------------------
   A word problem turned into strips of paper. Every model in the chapter is
   one or more ROWS, drawn to one scale and lined up at the left:

     part–whole     one row cut into parts, the whole written at its end
     comparison     two rows, the longer with its extra as a box of its own
     part to part   rows of equal UNITS ("3 times as many" is three boxes
                    against one), with the total bracketed beside them
     part to whole  one row of equal units, some of them shaded (3/5 of …)

   Parts are drawn TO SCALE, the box with the question mark included (pass its
   value with text "?"), so a model always shows which amount is bigger. A part
   given no value at all is drawn a fixed width — kept for a model that must
   not show its unknown's size.

   Millimetres at the paper's own size, fixed colours: it prints the same in
   either theme.
   ========================================================================== */

const INK = "#2a2723";
const GREY = "#8a837a";
export const TONE = { a: "#bfe3ff", b: "#fff3a8", c: "#d6f0cf", q: "#fffdf8" };

const f = (n) => (+n).toFixed(2);
const BAR_H = 11;
const GAP = 4.5;
const PAPER = 150;
const UNKNOWN_MM = 24;

const text = (x, y, s, { anchor = "middle", size = 4.2, weight = 700 } = {}) =>
  `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${INK}">${s}</text>`;

/**
 * Rows of a bar model.
 *
 *   rows   [{ name, parts: [{ text, value, tone }], says }]
 *            value  a number to draw to scale, or null — an unknown box
 *            tone   "a" sky, "b" butter, "c" leaf, "q" plain (default by known/unknown)
 *            says   what the row comes to, written at its end ("= 63", "?")
 *   total  bracketed down the right of every row, with this written by it
 *   over   { from, to, text } — a brace over parts [from, to) of the first row
 *   cap    the most a unit of `value` may be in mm (units rows want big boxes)
 */
export function modelSvg(rows, { total = null, over = null, cap = 7, label = "A bar model" } = {}) {
  const nameW = rows.some((r) => r.name) ? 17 : 0;
  const saysW = rows.some((r) => r.says != null) ? 14 : 0;
  const totalW = total != null ? 16 : 0;
  const budget = PAPER - nameW - saysW - totalW - 2;

  /* ONE scale for every row — two rows being compared must use the same ruler */
  const unknowns = Math.max(...rows.map((r) => r.parts.filter((p) => p.value == null).length));
  const known = Math.max(...rows.map((r) => r.parts.filter((p) => p.value != null).reduce((s, p) => s + p.value, 0)));
  const unknownW = unknowns ? Math.min(UNKNOWN_MM, (budget * (known ? 0.45 : 0.95)) / unknowns) : 0;
  const unit = known ? Math.min(cap, (budget - unknowns * unknownW) / known) : 0;

  const top = over ? 9 : 2;
  let out = "";
  let end = 0;
  rows.forEach((row, r) => {
    const y = top + r * (BAR_H + GAP);
    let x = 1 + nameW;
    if (row.name) out += text(1, y + BAR_H / 2 + 1.5, row.name, { anchor: "start", weight: 600 });
    const starts = [];
    row.parts.forEach((p) => {
      const w = p.value == null ? unknownW : p.value * unit;
      const fill = TONE[p.tone || (p.value == null ? "b" : "a")];
      starts.push(x);
      out += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${BAR_H}" fill="${fill}" stroke="${INK}" stroke-width="0.45"/>`;
      if (p.text) out += text(x + w / 2, y + BAR_H / 2 + 1.5, p.text, { size: w < 7 ? 3.2 : 4.2 });
      x += w;
    });
    starts.push(x);
    if (r === 0 && over) {
      const x0 = starts[over.from], x1 = starts[over.to];
      out += `<path d="M${f(x0)} ${f(y - 1)}V${f(y - 3.4)}H${f(x1)}V${f(y - 1)}" fill="none" stroke="${GREY}" stroke-width="0.4"/>` +
        text((x0 + x1) / 2, y - 4.6, over.text, { size: 3.8, weight: 600 });
    }
    if (row.says != null) out += text(x + 2, y + BAR_H / 2 + 1.5, row.says, { anchor: "start" });
    end = Math.max(end, x + (row.says != null ? saysW : 0));
  });
  const h = top + rows.length * BAR_H + (rows.length - 1) * GAP;
  if (total != null) {
    const x = end + 2.5;
    out += `<path d="M${f(x - 2.2)} ${f(top)}H${f(x)}V${f(h)}H${f(x - 2.2)}" fill="none" stroke="${GREY}" stroke-width="0.4"/>` +
      text(x + 2, (top + h) / 2 + 1.5, total, { anchor: "start" });
    end = x + totalW - 2;
  }
  return `<svg class="mb-model" viewBox="0 0 ${f(end + 1)} ${f(h + 2)}" width="${f(end + 1)}mm" height="${f(h + 2)}mm" role="img" aria-label="${label}">${out}</svg>`;
}

/** An empty strip to draw a model in, for the problems that ask for one. */
export function blankModelSvg({ w = 150, h = 32 } = {}) {
  return `<svg class="mb-model" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm" role="img" aria-label="Room to draw the bar model">` +
    `<rect x="0.3" y="0.3" width="${w - 0.6}" height="${h - 0.6}" rx="1.5" fill="none" stroke="${GREY}" stroke-width="0.3" stroke-dasharray="1 1.4"/>` +
    `<text x="3" y="5" font-family="JetBrains Mono, monospace" font-size="3" fill="${GREY}">draw the bar model here</text></svg>`;
}

/** n equal units, each a box of value 1 in a tone. */
export const units = (n, tone = "a", label = "") => Array.from({ length: n }, () => ({ text: label, value: 1, tone }));
