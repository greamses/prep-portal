/* ============================================================================
   Maths Workbook — the drawings for MULTIPLYING (chapter 8)
   ----------------------------------------------------------------------------
   Every method in the chapter, drawn: the things in equal groups, the array,
   the jumps on a number line, the figures moving a place when you multiply by
   ten, the blocks in rows, the grid, the two column methods and the lattice.

   One rule runs through all of it: WHAT A CHILD WRITES IN IS A REAL BOX. The
   pictures are SVG, but every answer — a partial product, a carry, a figure in
   the lattice — is an element on the page, so the same paper that prints is
   the paper that is typed into and marked.

   The columns are tinted with the butter/sky/leaf of the place-value chart and
   the blocks, like the adding chapter's columns, because the thing that goes
   wrong in a written multiplication is a figure in the wrong column.
   ========================================================================== */

import { shapeDraw, paperColour } from "./shapes.js";
import { blocksSvg, placeFill } from "./blocks.js";
import { colSheet, figuresOf, topOf } from "./colsheet.js";

const INK = "#2a2723";
const NAMES = ["O", "T", "H", "Th", "TTh", "HTh"];

/** The figures of n, lowest place first, padded to `places`. */
export const digitsOf = (n, places = String(n).length) => {
  const out = [];
  let v = n;
  for (let i = 0; i < places; i++) {
    out.push(v % 10);
    v = Math.floor(v / 10);
  }
  return out;
};

const box = () => `<span class="rw-answer"></span>`;

/* ── equal groups ──────────────────────────────────────────────────────────*/

/**
 * g plates, each holding n of the same thing. The plates are the point: a
 * group you can see the edge of is a group, and "3 lots of 4" is a picture
 * before it is a sum.
 */
export function groupsHtml(g, n, { shape = "circle", colour = 0 } = {}) {
  return `<div class="mm-plates" role="img" aria-label="${g} groups of ${n}">${plateSvg(n, shape, colour).repeat(g)}</div>`;
}

/* A plate is drawn small and tidy, NOT at the size of the dividing chapter's
   piles. Those are spaced to have rings drawn round them — 13 mm a thing, eight
   to a row — and five plates of ten at that size filled most of a page: a tall
   enough first question pushes its whole section off page one and leaves page
   one blank. Nothing is ringed here; the plate is the group. */
const PLATE_CELL = 6;
const PLATE_PER_ROW = 5;
function plateSvg(n, shape, colour) {
  /* split evenly over two rows once it will not go in one — six is three and
     three, not five and a lonely one that looks like a different group */
  const perRow = n <= PLATE_PER_ROW ? n : Math.ceil(n / 2);
  const cols = perRow;
  const rows = Math.ceil(n / perRow);
  const pad = 2.2;
  const w = cols * PLATE_CELL + pad * 2;
  const h = rows * PLATE_CELL + pad * 2;
  const s = 4.4 / 100;
  let body = `<rect x="0.3" y="0.3" width="${w - 0.6}" height="${h - 0.6}" rx="${Math.min(w, h) / 2 - 0.3}" fill="#fffdf8" stroke="${INK}" stroke-width="0.45"/>`;
  for (let i = 0; i < n; i++) {
    const x = pad + ((i % perRow) + 0.5) * PLATE_CELL;
    const y = pad + (Math.floor(i / perRow) + 0.5) * PLATE_CELL;
    body += `<g transform="translate(${x} ${y}) scale(${s})" fill="${paperColour(colour)}" stroke="${INK}" stroke-width="${(0.35 / s).toFixed(1)}" stroke-linejoin="round">${shapeDraw(shape)}</g>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm" class="mm-plate">${body}</svg>`;
}

/* ── the array ─────────────────────────────────────────────────────────────*/

/** rows × cols dots on a square grid — the groups straightened into lines. */
export function arraySvg(rows, cols, { cell = 6 } = {}) {
  let body = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      body += `<circle cx="${(c + 0.5) * cell}" cy="${(r + 0.5) * cell}" r="${cell * 0.3}" fill="#6fb7e8" stroke="${INK}" stroke-width="0.35"/>`;
    }
  }
  const w = cols * cell;
  const h = rows * cell;
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm" class="mm-array" role="img" aria-label="An array of dots">${body}</svg>`;
}

/* ── jumps on a number line ────────────────────────────────────────────────*/

/**
 * A number line from 0 with `jumps` equal hops of `size` drawn over it. The
 * line is numbered every `size`, so the child reads where the hops land rather
 * than counting tiny ticks — the skill is the skip count, not the ruler.
 */
export function jumpsSvg(jumps, size, { showJumps = true } = {}) {
  const end = jumps * size + size;
  const step = Math.min(14, 150 / (end / size));
  const unit = step / size;
  const w = end * unit + 8;
  const y = 22;
  let body = `<line x1="3" y1="${y}" x2="${w - 2}" y2="${y}" stroke="${INK}" stroke-width="0.5"/>`;
  for (let v = 0; v <= end; v += size) {
    const x = 4 + v * unit;
    body += `<line x1="${x}" y1="${y - 1.6}" x2="${x}" y2="${y + 1.6}" stroke="${INK}" stroke-width="0.4"/>`;
    body += `<text x="${x}" y="${y + 6}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.2" fill="${INK}">${v}</text>`;
  }
  if (showJumps) {
    for (let k = 0; k < jumps; k++) {
      const x0 = 4 + k * size * unit;
      const x1 = x0 + size * unit;
      body += `<path d="M${x0} ${y - 1}Q${(x0 + x1) / 2} ${y - 16} ${x1} ${y - 1}" fill="none" stroke="#c0453f" stroke-width="0.55"/>`;
      body += `<path d="M${x1 - 1.6} ${y - 3.4} L${x1} ${y - 1} L${x1 + 0.4} ${y - 3.8}" fill="none" stroke="#c0453f" stroke-width="0.5"/>`;
    }
  }
  return `<svg viewBox="0 0 ${w} 32" width="${w}mm" height="32mm" class="mm-jumps" role="img" aria-label="Jumps along a number line">${body}</svg>`;
}

/* ── multiplying by 10, 100, 1000 ──────────────────────────────────────────*/

/**
 * The number in a place-value table, and an empty row under it for the same
 * figures once they have moved. The figures move; the point does not — which
 * is the whole of "×10", and the zero is what holds the empty place.
 */
export function shiftTable(n, factor, { answer = false } = {}) {
  const shift = String(factor).length - 1;
  const top = digitsOf(n);
  const places = top.length + shift;
  const cols = [...Array(places).keys()].reverse();
  const res = digitsOf(n * factor, places);
  const head = `<tr class="ms-down__head"><td></td>${cols.map((p) => `<td style="--ms-fill:${placeFill(p)}">${NAMES[p] || ""}</td>`).join("")}</tr>`;
  const rowA = `<tr><td class="ms-down__sign"></td>${cols.map((p) => `<td class="ms-down__cell">${p < top.length ? top[p] : ""}</td>`).join("")}</tr>`;
  const rowB = `<tr class="ms-down__answer"><td class="ms-down__sign">×${factor}</td>${cols
    .map((p) => `<td class="ms-down__cell${answer ? "" : " wb-cell"}">${answer ? res[p] : ""}</td>`).join("")}</tr>`;
  /* multiplying by ten shifts the figures; they are read across, not worked
     from the right, so this table opens all at once */
  return `<table class="ms-down mm-shift">${head}${rowA}${rowB}</table>`;
}

/* ── blocks in rows ────────────────────────────────────────────────────────*/

/** n rows of the same blocks: 3 × 24 is three rows of 2 rods and 4 units. */
export function blockRowsHtml(n, t, u, { cellMm = 2.2 } = {}) {
  const row = blocksSvg([u, t], 10, { maxCells: 60, cellMm, still: true, label: `${t} tens and ${u} ones` });
  return `<div class="mm-rows">${Array.from({ length: n }, (_, i) => `<div class="mm-rows__one"><span class="mm-rows__n">${i + 1}</span>${row}</div>`).join("")}</div>`;
}

/* ── the grid (area) method ────────────────────────────────────────────────*/

/** A number split into its place parts, zeros left out: 305 → [300, 5]. */
export const partsOf = (n) => digitsOf(n)
  .map((d, p) => d * 10 ** p)
  .filter(Boolean)
  .reverse();

/**
 * The grid: one factor split along the top, the other down the side, and a box
 * where each pair meets. `fill` writes the products in, for the worked example.
 */
export function gridTable(a, b, { fill = false } = {}) {
  const top = partsOf(a);
  const side = partsOf(b);
  const head = `<tr><th class="mm-grid__corner">×</th>${top.map((v) => `<th>${v}</th>`).join("")}</tr>`;
  const rows = side.map((s) => `<tr><th>${s}</th>${top
    .map((v) => `<td>${fill ? `<b>${v * s}</b>` : box()}</td>`).join("")}</tr>`).join("");
  return `<table class="mm-grid">${head}${rows}</table>`;
}

/* ── short multiplication ──────────────────────────────────────────────────*/

/**
 * A number of any length times one figure, down the page: the carry boxes
 * above, the number, × and the figure in the ones column, the rule, the
 * answer. One extra column on the left for the answer to grow into.
 */
export function shortCol(a, b, { answer = false } = {}) {
  const da = String(a).length;
  const A = figuresOf(a, da);
  const top = topOf(a * b);
  const cols = Math.max(da, top + 1);
  const R = figuresOf(a * b, cols);
  const carries = timesCarries(A, b);
  const carrying = carries.some((c) => c != null);

  const sheet = colSheet({ cols, places: da, steps: answer ? null : "rtl" });
  sheet.tags();
  /* a carry goes INTO a column, so every column but the ones has a box — and
     the one done for the child has the carries WRITTEN IN, because carrying is
     the whole of what short multiplication asks and a worked example that
     leaves the boxes empty has shown the answer and hidden the method */
  /* A row for the carrying only when it carries — an empty row is a gap in the
     sum where a child looks for something that was never asked. */
  let row = 1;
  const carryRow = carrying ? row++ : -1;
  const rowA = row++;
  const rowB = row++;
  const rowR = row++;
  if (carrying) sheet.carries(carryRow, carries, { under: rowR, show: answer });
  for (let p = 0; p < da; p++) sheet.mark(rowA, p, A[p]);
  sheet.sign(rowB, "×");
  sheet.mark(rowB, 0, b);
  sheet.rule(rowB, { heavy: true });
  if (!answer) sheet.boxes(rowR, top);
  else for (let p = top; p >= 0; p--) sheet.mark(rowR, p, R[p]);
  return sheet.html("mm-col");
}

/* ── the carrying, worked out ──────────────────────────────────────────────*/

/** Multiplying a number by one figure: what is carried into each column. */
export function timesCarries(A, b, shift = 0) {
  const out = [];
  let c = 0;
  for (let i = 0; i < A.length; i++) {
    const prod = A[i] * b + c;
    c = Math.floor(prod / 10);
    if (c) out[i + shift + 1] = c;
  }
  return out;
}

/** Adding a column of numbers: what is carried into each column. */
export function addCarries(rows, width) {
  const out = [];
  let c = 0;
  for (let p = 0; p < width; p++) {
    const sum = rows.reduce((t, R) => t + (R[p] || 0), 0) + c;
    c = Math.floor(sum / 10);
    if (c) out[p + 1] = c;
  }
  return out;
}

/**
 * WHERE A COLUMN MULTIPLICATION CARRIES — the same working the sheet draws its
 * boxes from, so an exercise's key can count them without building the sheet.
 * Short: one row. Long: one per row of the multiplying, then the addition.
 */
export function carriesOf(a, b) {
  const da = String(a).length;
  const db = String(b).length;
  const A = figuresOf(a, da);
  if (db === 1) return [timesCarries(A, b)];
  const cols = Math.max(da, db, topOf(a * b) + 1);
  const bd = figuresOf(b, db);
  const rows = bd.map((d, k) => timesCarries(A, d, k));
  return [...rows, addCarries(bd.map((d, k) => figuresOf(a * d * 10 ** k, cols)), cols)];
}

/* ── long multiplication ───────────────────────────────────────────────────*/

/**
 * A number times a two-figure number: one row for each figure of the
 * multiplier, then the rule and the total. The second row starts with a 0 in
 * the ones column — the zero is written, not left blank, because it IS the
 * point: that row is the number times TENS.
 *
 * EVERY ROW THAT IS WORKED OUT HAS ITS OWN CARRY BOXES — the two rows of
 * multiplying and the addition at the end. They are three different sums and
 * the carries of one have nothing to do with the carries of the next, which is
 * exactly why the board in the tool panel rubs them out between rows.
 */
export function longCol(a, b, { answer = false } = {}) {
  const da = String(a).length;
  const db = String(b).length;
  const top = topOf(a * b);
  const cols = Math.max(da, db, top + 1);
  const A = figuresOf(a, cols);
  const B = figuresOf(b, cols);
  const bd = figuresOf(b, db);
  const partRows = bd.map((d, k) => figuresOf(a * d * 10 ** k, cols));

  const sheet = colSheet({ cols, steps: answer ? null : "rows-rtl" });
  sheet.tags();
  for (let p = 0; p < da; p++) sheet.mark(1, p, A[p]);
  sheet.sign(2, "×");
  for (let p = 0; p < db; p++) sheet.mark(2, p, B[p]);
  sheet.rule(2, { heavy: true });

  let row = 3;
  bd.forEach((d, k) => {
    const V = partRows[k];
    const high = topOf(a * d * 10 ** k);
    const carries = timesCarries(figuresOf(a, da), d, k);
    const carryRow = carries.some((c) => c != null) ? row++ : -1;
    const partRow = row++;
    if (carryRow >= 0) sheet.carries(carryRow, carries, { under: partRow, show: answer });
    const last = k === db - 1;
    if (last && k > 0) sheet.sign(partRow, "+");
    if (!answer) sheet.boxes(partRow, high);
    else for (let p = high; p >= 0; p--) sheet.mark(partRow, p, V[p]);
    if (last) sheet.rule(partRow, { heavy: true });
  });

  const R = figuresOf(a * b, cols);
  const carries = addCarries(partRows, cols);
  const carryRow = carries.some((c) => c != null) ? row++ : -1;
  const totalRow = row++;
  if (carryRow >= 0) sheet.carries(carryRow, carries, { under: totalRow, show: answer });
  if (!answer) sheet.boxes(totalRow, top);
  else for (let p = top; p >= 0; p--) sheet.mark(totalRow, p, R[p]);
  return sheet.html("mm-col mm-long");
}

/* ── one table of the distribution ─────────────────────────────────────────*/

/**
 * ONE of the tables a long multiplication is really made of: `a` times a single
 * place of the multiplier — 42 x 30, or 42 x 2 — written as a column sum of its
 * own, with its own carries and its own answer.
 *
 * Long multiplication writes these two under one another and asks a child to
 * keep track of which row they are on. Split apart they are two ordinary
 * multiplications, each true on its own, and the adding at the end is an
 * ordinary addition. The 0 in 42 x 30 is printed, not left off: it is the
 * reason that row is ten times the other.
 */
export function timesRow(a, d, k, { answer = false } = {}) {
  const v = a * d * 10 ** k;
  const da = String(a).length;
  const mul = d * 10 ** k;
  const dm = String(mul).length;
  const top = topOf(v);
  const cols = Math.max(da, dm, top + 1);
  const A = figuresOf(a, cols);
  const M = figuresOf(mul, cols);
  const V = figuresOf(v, cols);
  const carries = timesCarries(figuresOf(a, da), d, k);
  const carrying = carries.some((c) => c != null);

  /* every column is named: unlike an addition, a product is EXPECTED to reach
     further than the number it started from */
  const sheet = colSheet({ cols, steps: answer ? null : "rtl" });
  sheet.tags();
  let row = 1;
  const carryRow = carrying ? row++ : -1;
  const rowA = row++;
  const rowB = row++;
  const rowV = row++;
  if (carrying) sheet.carries(carryRow, carries, { under: rowV, show: answer });
  for (let p = 0; p < da; p++) sheet.mark(rowA, p, A[p]);
  sheet.sign(rowB, "×");
  for (let p = 0; p < dm; p++) sheet.mark(rowB, p, M[p], p < k ? "is-soft" : "");
  sheet.rule(rowB, { heavy: true });
  if (!answer) sheet.boxes(rowV, top);
  else for (let p = top; p >= 0; p--) sheet.mark(rowV, p, V[p]);
  return sheet.html("mm-col");
}

/** Where that table carries — for the exercise key, which must count the boxes. */
export const timesRowCarries = (a, d, k) => timesCarries(figuresOf(a, String(a).length), d, k);

/**
 * THE ADDING UP AT THE END of a split multiplication. The two products are
 * written in by the child — they are the answers they have just worked out,
 * brought down — so this sheet is boxes all the way: the two rows and the
 * total.
 */
export function sumUp(x, y, { answer = false } = {}) {
  const total = x + y;
  const top = topOf(total);
  const cols = Math.max(topOf(x), topOf(y), top) + 1;
  const carries = addCarries([figuresOf(x, cols), figuresOf(y, cols)], cols);
  const carrying = carries.some((c) => c != null);

  const sheet = colSheet({ cols, steps: answer ? null : "rtl" });
  sheet.tags();
  let row = 1;
  const carryRow = carrying ? row++ : -1;
  const rowX = row++;
  const rowY = row++;
  const rowT = row++;
  if (carrying) sheet.carries(carryRow, carries, { under: rowT, show: answer });
  const put = (row, v) => {
    const F = figuresOf(v, cols);
    const high = topOf(v);
    if (!answer) sheet.boxes(row, high);
    else for (let p = high; p >= 0; p--) sheet.mark(row, p, F[p]);
  };
  put(rowX, x);
  sheet.sign(rowY, "+");
  put(rowY, y);
  sheet.rule(rowY, { heavy: true });
  put(rowT, total);
  return sheet.html("mm-col mm-sumup");
}

/** Where that addition carries — for the key. */
export const sumUpCarries = (x, y) => {
  const cols = Math.max(topOf(x), topOf(y), topOf(x + y)) + 1;
  return addCarries([figuresOf(x, cols), figuresOf(y, cols)], cols);
};

/* ── criss-cross ───────────────────────────────────────────────────────────*/

/**
 * The crossing picture: two numbers one above the other and the three passes
 * drawn over them — straight down the ones, across both ways, straight down the
 * tens. Each pass is a colour, and the same colour names the box its answer
 * goes in, so the picture and the working are one thing.
 */
export function crissSvg(a, b) {
  const [a1, a0] = String(a).split("").map(Number);
  const [b1, b0] = String(b).split("").map(Number);
  const COL = ["#c0453f", "#2a6ca8", "#3f8f4f"];    // ones, cross, tens
  const x = [14, 34];                               // tens, ones
  const y = [10, 31];
  const dig = (v, i, j) => `<text x="${x[i]}" y="${y[j] + 3.4}" text-anchor="middle"`
    + ` font-size="9" font-weight="700" fill="#2a2723">${v}</text>`;
  const line = (x1, y1, x2, y2, c) =>
    `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${c}" stroke-width="1.1" stroke-linecap="round" opacity="0.85"/>`;
  return `<svg viewBox="0 0 48 44" width="32mm" height="29mm" class="mm-criss" role="img"`
    + ` aria-label="${a} times ${b}, the three passes of the criss-cross">`
    + line(x[1], y[0] + 5, x[1], y[1] - 5, COL[0])
    + line(x[0], y[0] + 5, x[1], y[1] - 5, COL[1]) + line(x[1], y[0] + 5, x[0], y[1] - 5, COL[1])
    + line(x[0], y[0] + 5, x[0], y[1] - 5, COL[2])
    + dig(a1, 0, 0) + dig(a0, 1, 0) + dig(b1, 0, 1) + dig(b0, 1, 1)
    + `<path d="M6 ${y[1] + 7}H42" stroke="#2a2723" stroke-width="1"/>`
    + `<text x="4" y="${y[1] + 3.4}" text-anchor="middle" font-size="8" fill="#6b655c">×</text>`
    + `</svg>`;
}

/* ── the lattice ───────────────────────────────────────────────────────────*/

/**
 * The lattice (gelosia): one factor along the top, the other down the right,
 * every pair of figures multiplied into a cell split by a diagonal — tens above
 * it, ones below — and the answer read off the diagonals, down the left and
 * along the bottom.
 *
 * Cell (i, j) holds the product of the i-th figure of b (from the top, highest
 * first) and the j-th of a (from the left). Its ones sit in place
 * (da-1-j)+(db-1-i) and its tens one place higher, so the left edge of row i
 * collects place da+db-1-i and the bottom under column j collects place
 * da-1-j: reading down the left and then along the bottom gives the answer
 * highest figure first.
 */
export function latticeTable(a, b, { answer = false } = {}) {
  const as = String(a).split("").map(Number);
  const bs = String(b).split("").map(Number);
  const da = as.length;
  const db = bs.length;
  const R = digitsOf(a * b, da + db);
  const topR = String(a * b).length - 1;
  const ans = (q) => `<td class="mm-lat__ans${answer ? "" : " wb-cell"}">${answer ? (q <= topR ? R[q] : "") : ""}</td>`;
  const head = `<tr><td></td>${as.map((d) => `<th>${d}</th>`).join("")}<td></td></tr>`;
  const body = bs.map((bd, i) => {
    const cells = as.map((ad) => {
      const p = ad * bd;
      const t = Math.floor(p / 10);
      const o = p % 10;
      /* laid out on a grid inside the cell, not positioned: interactive mode
         makes every answer place position: relative, which would pull two
         absolutely placed boxes back into a heap */
      return `<td class="mm-lat__cell"><div class="mm-lat__in">`
        + `<span class="mm-lat__t${answer ? "" : " wb-cell"}">${answer ? t : ""}</span>`
        + `<span class="mm-lat__o${answer ? "" : " wb-cell"}">${answer ? o : ""}</span></div></td>`;
    }).join("");
    return `<tr>${ans(da + db - 1 - i)}${cells}<th>${bd}</th></tr>`;
  }).join("");
  const foot = `<tr><td></td>${as.map((_, j) => ans(da - 1 - j)).join("")}<td></td></tr>`;
  return `<table class="mm-lat">${head}${body}${foot}</table>`;
}
