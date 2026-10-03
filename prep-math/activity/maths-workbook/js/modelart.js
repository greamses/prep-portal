/* ============================================================================
   Maths Workbook — the SINGAPORE BAR MODEL, drawn (chapter 9)
   ----------------------------------------------------------------------------
   A word problem turned into strips of paper. Every model in the chapter is
   one or more ROWS, drawn to one scale and lined up at the left:

     part–whole     one row cut into parts, the whole braced under it
     comparison     two rows, the longer with its extra as a box of its own
     ratio          rows of equal UNITS ("3 times as many" is three boxes
                    against one), with the total braced beside them
     fraction, %    one row of equal units (fifths, tenths …), some of them
     and degrees    braced as the part

   A number is never written BESIDE a bar. What a stretch of bars comes to is
   written over or under it, on a curly brace that spans exactly that stretch
   — and only when the bars do not already say it: a single bar with its
   number in it is not labelled again. The one brace that runs down the side
   is the total of two or more stacked rows, which no row can carry alone.

   Parts are drawn TO SCALE, the box with the question mark included (pass its
   value with text "?"), so a model always shows which amount is bigger. A part
   given no value at all is drawn a fixed width — kept for a model that must
   not show its unknown's size.

   A "?" is drawn with data-ask, so the interactive sheet can turn it into a
   box to write in (double-click).

   Millimetres at the paper's own size, fixed colours: it prints the same in
   either theme.
   ========================================================================== */

const INK = "#2a2723";
const GREY = "#6f685f";
export const TONE = { a: "#bfe3ff", b: "#fff3a8", c: "#d6f0cf", d: "#ffd9cf", q: "#fffdf8" };

const f = (n) => (+n).toFixed(2);
const BAR_H = 11;
const GAP = 3;
const BRACE = 9;      // the room a brace and its words take over or under a row
const PAPER = 150;
const UNKNOWN_MM = 24;

const text = (x, y, s, { anchor = "middle", size = 4.2, weight = 700, ask = false } = {}) =>
  `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${INK}"${ask ? ' data-ask="1"' : ""}>${s}</text>`;

/** A curly brace from x0 to x1 at y, its point away from the bar (dir 1 down, -1 up). */
export function curly(x0, x1, y, dir = 1, depth = 2.6) {
  const h = depth * dir;
  const m = (x0 + x1) / 2;
  const r = Math.min(1.6, (x1 - x0) / 5);
  return `<path d="M${f(x0)} ${f(y)}Q${f(x0)} ${f(y + h / 2)} ${f(x0 + r)} ${f(y + h / 2)}H${f(m - r)}` +
    `Q${f(m)} ${f(y + h / 2)} ${f(m)} ${f(y + h)}Q${f(m)} ${f(y + h / 2)} ${f(m + r)} ${f(y + h / 2)}` +
    `H${f(x1 - r)}Q${f(x1)} ${f(y + h / 2)} ${f(x1)} ${f(y)}" fill="none" stroke="${GREY}" stroke-width="0.4"/>`;
}

/** The same, standing up: from y0 to y1 at x, its point to the right. */
function curlyUp(x, y0, y1, depth = 2.6) {
  const m = (y0 + y1) / 2;
  const r = Math.min(1.6, (y1 - y0) / 5);
  const h = depth;
  return `<path d="M${f(x)} ${f(y0)}Q${f(x + h / 2)} ${f(y0)} ${f(x + h / 2)} ${f(y0 + r)}V${f(m - r)}` +
    `Q${f(x + h / 2)} ${f(m)} ${f(x + h)} ${f(m)}Q${f(x + h / 2)} ${f(m)} ${f(x + h / 2)} ${f(m + r)}` +
    `V${f(y1 - r)}Q${f(x + h / 2)} ${f(y1)} ${f(x)} ${f(y1)}" fill="none" stroke="${GREY}" stroke-width="0.4"/>`;
}

/**
 * A row's braces. `above` / `below` are [{ from, to, text }] over parts
 * [from, to); `says` (the older way to say what a row comes to) becomes a
 * brace under the whole row — unless the row is one bar already showing it.
 */
function bracesOf(row) {
  const above = (row.above || []).slice();
  const below = (row.below || []).slice();
  if (row.says != null) {
    const one = row.parts.length === 1 && String(row.parts[0].text) === String(row.says);
    if (!one) below.push({ from: 0, to: row.parts.length, text: String(row.says) });
  }
  return { above, below };
}

/**
 * Rows of a bar model.
 *
 *   rows   [{ name, parts: [{ text, value, tone }], above, below, says }]
 *            value  a number to draw to scale, or null — an unknown box
 *            tone   "a" sky, "b" butter, "c" leaf, "d" peach, "q" plain
 *            above / below  [{ from, to, text }] — braces over / under parts
 *            says   what the whole row comes to (braced under it)
 *   total  braced down the right of every row, with this written by it
 *   over   { from, to, text } — a brace over parts [from, to) of the first row
 *   cap    the most a unit of `value` may be in mm (units rows want big boxes)
 */
export function modelSvg(rows, { total = null, over = null, cap = 7, label = "A bar model" } = {}) {
  const braces = rows.map(bracesOf);
  if (over) braces[0].above.push(over);
  const nameW = rows.some((r) => r.name) ? 17 : 0;
  const totalW = total != null ? 18 : 0;
  const budget = PAPER - nameW - totalW - 2;

  /* ONE scale for every row — two rows being compared must use the same ruler */
  const unknowns = Math.max(...rows.map((r) => r.parts.filter((p) => p.value == null).length));
  const known = Math.max(...rows.map((r) => r.parts.filter((p) => p.value != null).reduce((s, p) => s + p.value, 0)));
  const unknownW = unknowns ? Math.min(UNKNOWN_MM, (budget * (known ? 0.45 : 0.95)) / unknowns) : 0;
  const unit = known ? Math.min(cap, (budget - unknowns * unknownW) / known) : 0;

  let out = "";
  let end = 0;
  let y = 1;
  let firstTop = null, lastBottom = 0;
  rows.forEach((row, r) => {
    const { above, below } = braces[r];
    if (above.length) y += BRACE;
    const top = y;
    let x = 1 + nameW;
    if (row.name) out += text(1, top + BAR_H / 2 + 1.5, row.name, { anchor: "start", weight: 600 });
    const starts = [];
    row.parts.forEach((p) => {
      const w = p.value == null ? unknownW : p.value * unit;
      const fill = TONE[p.tone || (p.value == null ? "b" : "a")];
      starts.push(x);
      out += `<rect x="${f(x)}" y="${f(top)}" width="${f(w)}" height="${BAR_H}" fill="${fill}" stroke="${INK}" stroke-width="0.45"/>`;
      if (p.text) out += text(x + w / 2, top + BAR_H / 2 + 1.5, p.text, { size: w < 7 ? 3.2 : 4.2, ask: p.text === "?" });
      x += w;
    });
    starts.push(x);
    above.forEach((b) => {
      const x0 = starts[b.from], x1 = starts[b.to];
      out += curly(x0, x1, top - 1, -1) + text((x0 + x1) / 2, top - 5, b.text, { size: 3.8, weight: 700, ask: b.text === "?" });
    });
    below.forEach((b) => {
      const x0 = starts[b.from], x1 = starts[b.to];
      out += curly(x0, x1, top + BAR_H + 1, 1) + text((x0 + x1) / 2, top + BAR_H + 7.6, b.text, { size: 3.8, weight: 700, ask: b.text === "?" });
    });
    end = Math.max(end, x);
    if (firstTop == null) firstTop = top;
    lastBottom = top + BAR_H;
    y = top + BAR_H + (below.length ? BRACE : 0) + GAP;
  });
  let h = y - GAP + 1;
  if (total != null) {
    const x = end + 1.5;
    out += curlyUp(x, firstTop, lastBottom) + text(x + 4.2, (firstTop + lastBottom) / 2 + 1.5, total, { anchor: "start", ask: total === "?" });
    end = x + totalW - 1.5;
  }
  return `<svg class="mb-model" viewBox="0 0 ${f(end + 1)} ${f(h)}" width="${f(end + 1)}mm" height="${f(h)}mm" role="img" aria-label="${label}">${out}</svg>`;
}

/** An empty strip to draw a model in, for the problems that ask for one. On
    screen it becomes a board of bars to drag about (data-barmodel). */
export function blankModelSvg({ w = 150, h = 32 } = {}) {
  return `<div class="mb-board" data-barmodel="1"><svg class="mb-model" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm" role="img" aria-label="Room to draw the bar model">` +
    `<rect x="0.3" y="0.3" width="${w - 0.6}" height="${h - 0.6}" rx="1.5" fill="none" stroke="${GREY}" stroke-width="0.3" stroke-dasharray="1 1.4"/>` +
    `<text x="3" y="5" font-family="JetBrains Mono, monospace" font-size="3" fill="${GREY}">draw the bar model here</text></svg></div>`;
}

/** n equal units, each a box of value 1 in a tone. */
export const units = (n, tone = "a", label = "") => Array.from({ length: n }, () => ({ text: label, value: 1, tone }));

/* ── the same model as a board to build on (utils/components/workbook/barmodel.js) ──
   Board units are 600 across. A run of equal units in one colour becomes ONE
   bar cut into units — unless a brace starts or stops inside the run, which
   splits it there so the brace still has bars to hang on. The total down the
   side of stacked rows has no place on the board and is left to the picture. */
const BOARD_W = 560;
const TONE_INDEX = { a: 0, b: 1, c: 2, d: 3, q: 4 };

export function boardFrom(rows, { over = null, cap = 7 } = {}) {
  const braces = rows.map(bracesOf);
  if (over) braces[0].above.push(over);
  const unknowns = Math.max(...rows.map((r) => r.parts.filter((p) => p.value == null).length));
  const known = Math.max(...rows.map((r) => r.parts.filter((p) => p.value != null).reduce((s, p) => s + p.value, 0)));
  const unknownW = unknowns ? Math.min(96, (BOARD_W * (known ? 0.45 : 0.95)) / unknowns) : 0;
  const unit = known ? Math.min(cap * 4, (BOARD_W - unknowns * unknownW) / known) : 0;

  const model = { bars: [], braces: [] };
  let id = 1;
  rows.forEach((row, r) => {
    const { above, below } = braces[r];
    const cuts = new Set([...above, ...below].flatMap((b) => [b.from, b.to]));
    const barOf = [];            // part index → bar id
    let x = 0, run = null;
    row.parts.forEach((p, i) => {
      const w = p.value == null ? unknownW : p.value * unit;
      const tone = TONE_INDEX[p.tone || (p.value == null ? "b" : "a")] ?? 0;
      const joins = run && p.value === 1 && run.unitOf === 1 && run.tone === tone && !cuts.has(i);
      if (joins) {
        run.w += w; run.n += 1; run.labels.push(p.text || "");
      } else {
        run = { id: id++, x: Math.round(x), row: r, w, n: 1, tone, labels: [p.text || ""], unitOf: p.value };
        model.bars.push(run);
      }
      barOf[i] = run.id;
      x += w;
    });
    [...above.map((b) => ({ ...b, at: "above" })), ...below.map((b) => ({ ...b, at: "below" }))].forEach((b) => {
      model.braces.push({ id: id++, ids: [...new Set(barOf.slice(b.from, b.to))], at: b.at, text: b.text });
    });
  });
  model.bars.forEach((b) => { b.w = Math.round(b.w); delete b.unitOf; });
  return model;
}

/** A folded board under a printed model, starting from that model. Screen only. */
export function boardUnder(rows, opts) {
  const start = JSON.stringify(boardFrom(rows, opts)).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<div class="mb-board mb-board--screen" data-barmodel="1" data-fold="1" data-start="${start}"></div>`;
}
