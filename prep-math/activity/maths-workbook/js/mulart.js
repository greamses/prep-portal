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

/* ── the criss-cross ───────────────────────────────────────────────────────
   Written two ways, because they are read two ways. ACROSS — 43 × 25, the way
   the sum is said — and STACKED, one number over the other with the crossings
   looped over them. The method is the same either way and lives in one place
   (crissPasses); what changes is where each product is written.

   WHERE A PRODUCT IS ASKED FOR AT ALL. Only where a column has more than one
   crossing in it. The ones column of a two-by-two is one product and the answer
   figure is the last figure of it; the hundreds column is one product and a
   carry. It is the MIDDLE that needs writing down, because two products have to
   be held at once and added — and that is the only place this method is harder
   than any other. The rest goes straight under the line.
   ========================================================================== */

/**
 * THE PAIRS OF FIGURES THAT CROSS, column by column. The column at place p
 * takes every pair whose places add up to p — that one rule is the whole
 * method, whatever size the numbers are.
 *
 * Within a column they come in the order a hand works them: the figure of the
 * FIRST number nearest the ones first, so 43 × 25 asks 3 × 2 before 4 × 5.
 */
export function crissPasses(a, b) {
  const A = String(a).split("").map(Number);        // left to right, as written
  const B = String(b).split("").map(Number);
  const la = A.length;
  const lb = B.length;
  const width = String(a * b).length;
  const cols = [];
  let carry = 0;
  for (let p = 0; p < width; p++) {
    const pairs = [];
    for (let i = la - 1; i >= 0; i--) {             // A from its ones upward
      const pa = la - 1 - i;
      const pb = p - pa;
      if (pb < 0 || pb >= lb) continue;
      const j = lb - 1 - pb;
      pairs.push({ i, j, pa, pb, a: A[i], b: B[j], of: A[i] * B[j] });
    }
    const cross = pairs.reduce((t, q) => t + q.of, 0);
    const total = cross + carry;
    const carryIn = carry;
    carry = Math.floor(total / 10);
    /* one crossing in a column is worked in the head; two or more are written */
    pairs.forEach((q) => { q.writes = pairs.length > 1; });
    cols.push({ p, pairs, cross, carryIn, total, digit: total % 10, carryOut: carry });
  }
  return { A, B, la, lb, width, cols };
}

/** What the key has to answer, in the order both sheets list it. */
export function crissKey(a, b) {
  const { cols } = crissPasses(a, b);
  const out = [];
  cols.forEach((col) => {
    col.pairs.forEach((q) => { if (q.writes) out.push({ kind: "pass", value: q.of }); });
    out.push({ kind: "digit", value: col.digit });
    if (col.carryOut) out.push({ kind: "carry", value: col.carryOut });
  });
  return out;
}

/* the sheet, in millimetres */
const COL_W = 12;
const CARRY_H = 6.4;
const SLOT_H = 8;
const SUM_H = 10;
const STACK_H = 11.5;                   // a row of one stacked number
const ANS_H = 11;

/* How far an arc sags: the wider the jump the deeper it goes, and each one a
   little deeper than the last, so two of the same width are still two curves. */
const sagOf = (span, nth = 0) => 1.4 + span * 0.1 + nth * 0.5;
const bandOf = (arcs) => Math.max(4, ...arcs.map((c, i) => sagOf(Math.abs(c.to - c.from) * COL_W, i))) + 1.6;

/** The little builder both arrangements write themselves with. */
function sheetBits() {
  const bits = [];
  return {
    bits,
    put(cls, row, col, text = "", attrs = "", span = 1) {
      bits.push(`<span class="${cls}"${attrs} style="grid-row:${row + 1};grid-column:${col + 1}`
        + `${span > 1 ? ` / span ${span}` : ""};">${text}</span>`);
    },
  };
}

/**
 * ACROSS: the sum written the way it is said, each product over the figure in
 * the LOWER place of the pair that makes it — 43 × 25 puts 3 × 2 over the 3 and
 * 4 × 5 over the 5 — the carries over those, and only the answer under the line.
 */
export function crissSheet(a, b, { answer = false } = {}) {
  const { A, B, la, width, cols } = crissPasses(a, b);
  const gridCols = la + 1 + B.length;
  /* over the figure in the lower place; two of the same place (3 × 5) have no
     lower one, so they go over the first number's figure */
  const overOf = (q) => (q.pb < q.pa ? la + 1 + q.j : q.i);

  const deepOf = new Map();
  cols.forEach((col) => col.pairs.forEach((q) => {
    if (!q.writes) return;
    const over = overOf(q);
    deepOf.set(over, (deepOf.get(over) || 0) + 1);
  }));
  const deep = Math.max(1, ...deepOf.values(), 1);

  const rowSum = deep + 1;
  const rowArc = deep + 2;
  const rowAns = deep + 3;
  const { bits, put } = sheetBits();
  const arcs = [];

  A.forEach((d, i) => put("mm-cross__fig", rowSum, i, d));
  put("mm-cross__sign", rowSum, la, "×");
  B.forEach((d, j) => put("mm-cross__fig", rowSum, la + 1 + j, d));

  const used = new Map();
  const plus = [];                      // { from, to, row } — a + between two products
  let step = 0;
  cols.forEach((col) => {
    let last = null;
    col.pairs.forEach((q) => {
      if (q.writes) {
        const over = overOf(q);
        const nth = used.get(over) || 0;
        used.set(over, nth + 1);
        if (answer) put("mm-cross__said", deep - nth, over, q.of);
        else put("mm-cross__slot wb-answer", deep - nth, over, "", ` data-step="${step}" data-for="${col.p}"`);
        arcs.push({ from: q.i, to: la + 1 + q.j, step: answer ? null : step, tone: col.p });
        /* the crossings of a column are ADDED, so a + stands between them */
        if (last) plus.push({ from: last.col, to: over, row: Math.max(last.row, deep - nth) });
        last = { col: over, row: deep - nth };
        step += 1;
      } else {
        /* no box for it: the arrow comes out when the figure under the line is
           asked for, because that is when this crossing is done */
        arcs.push({ from: q.i, to: la + 1 + q.j, step: answer ? null : "ans" + col.p, tone: col.p });
      }
    });
    const at = gridCols - 1 - col.p;
    if (answer) put("mm-cross__said mm-cross__said--ans", rowAns, at, col.digit);
    else put("mm-cross__cell wb-cell", rowAns, at, "", ` data-step="${step}" data-ans="${col.p}"`);
    step += 1;
    if (col.carryOut) {
      /* over the column it goes INTO — where a column sum puts it, and the one
         place that is its own: no two carries can ever want the same cell. */
      const home = gridCols - 1 - (col.p + 1);
      if (answer) put("mm-cross__carried", 0, home, col.carryOut);
      else put("mm-cross__carry wb-answer", 0, home, "", ` data-step="${step}" data-for="${col.p + 1}"`);
      step += 1;
    }
  });

  put("mm-cross__rule", rowArc, 0, "", "", gridCols);
  const band = bandOf(arcs);
  const rows = [`${CARRY_H}mm`, ...Array(deep).fill(`${SLOT_H}mm`),
    `${SUM_H}mm`, `${band.toFixed(1)}mm`, `${ANS_H}mm`].join(" ");
  return `<div class="mm-cross" data-nomath${answer ? "" : ` data-steps="listed"`}`
    + ` style="--mc-cols:${gridCols};grid-template-rows:${rows}">`
    + bits.join("") + plusSvg(plus, gridCols, deep)
    + arcSvg(arcs, gridCols, CARRY_H + deep * SLOT_H, band, "under") + `</div>`;
}

/**
 * STACKED: one number over the other, the crossings looped over the two of
 * them, and each product written over the TOP number's figure that makes it —
 * which is where the loop starts, so the product and its loop are read as one
 * thing. The carries go over the products; only the answer goes under the line.
 */
export function crissStack(a, b, { answer = false } = {}) {
  const { A, B, la, lb, width, cols } = crissPasses(a, b);
  /* as wide as the answer, with both numbers right-aligned in it */
  const colOfPlace = (p) => width - 1 - p;
  const topCol = (i) => colOfPlace(la - 1 - i);
  const botCol = (j) => colOfPlace(lb - 1 - j);

  const deepOf = new Map();
  cols.forEach((col) => col.pairs.forEach((q) => {
    if (!q.writes) return;
    deepOf.set(topCol(q.i), (deepOf.get(topCol(q.i)) || 0) + 1);
  }));
  const deep = Math.max(1, ...deepOf.values(), 1);

  const rowTop = deep + 1;
  const rowBot = deep + 2;
  const rowAns = deep + 3;
  const { bits, put } = sheetBits();
  const arcs = [];

  A.forEach((d, i) => put("mm-cross__fig", rowTop, topCol(i), d));
  put("mm-cross__sign", rowBot, Math.max(0, colOfPlace(lb) - 1), "×");
  B.forEach((d, j) => put("mm-cross__fig", rowBot, botCol(j), d));

  const used = new Map();
  const plus = [];
  let step = 0;
  cols.forEach((col) => {
    let last = null;
    col.pairs.forEach((q) => {
      const loop = { from: topCol(q.i), to: botCol(q.j), tone: col.p };
      if (q.writes) {
        const over = topCol(q.i);
        const nth = used.get(over) || 0;
        used.set(over, nth + 1);
        if (answer) put("mm-cross__said", deep - nth, over, q.of);
        else put("mm-cross__slot wb-answer", deep - nth, over, "", ` data-step="${step}" data-for="${col.p}"`);
        arcs.push({ ...loop, step: answer ? null : step });
        if (last) plus.push({ from: last.col, to: over, row: Math.max(last.row, deep - nth) });
        last = { col: over, row: deep - nth };
        step += 1;
      } else {
        arcs.push({ ...loop, step: answer ? null : "ans" + col.p });
      }
    });
    const at = colOfPlace(col.p);
    if (answer) put("mm-cross__said mm-cross__said--ans", rowAns, at, col.digit);
    else put("mm-cross__cell wb-cell", rowAns, at, "", ` data-step="${step}" data-ans="${col.p}"`);
    step += 1;
    if (col.carryOut) {
      /* over the column it goes INTO, which is its own and nobody else's */
      const home = colOfPlace(col.p + 1);
      if (answer) put("mm-cross__carried", 0, home, col.carryOut);
      else put("mm-cross__carry wb-answer", 0, home, "", ` data-step="${step}" data-for="${col.p + 1}"`);
      step += 1;
    }
  });

  put("mm-cross__rule", rowBot, 0, "", "", width);
  const rows = [`${CARRY_H}mm`, ...Array(deep).fill(`${SLOT_H}mm`),
    `${STACK_H}mm`, `${STACK_H}mm`, `${ANS_H}mm`].join(" ");
  return `<div class="mm-cross mm-cross--stack" data-nomath${answer ? "" : ` data-steps="listed"`}`
    + ` style="--mc-cols:${width};grid-template-rows:${rows}">`
    + bits.join("") + plusSvg(plus, width, deep)
    + arcSvg(arcs, width, CARRY_H + deep * SLOT_H, 0, "between") + `</div>`;
}

/**
 * THE PLUS SIGNS BETWEEN THE PRODUCTS OF A COLUMN, because that is what is
 * done with them: two crossings meet in the tens and the tens figure is their
 * SUM. They are drawn in the gap between the two boxes rather than put in a
 * cell of their own — the boxes stand over the figures they came from and
 * nothing may be moved off its figure to make room for a sign.
 */
function plusSvg(plus, gridCols, deep) {
  if (!plus.length) return "";
  const W = gridCols * COL_W;
  const H = CARRY_H + deep * SLOT_H;
  const mid = (col) => col * COL_W + COL_W / 2;
  const signs = plus.map(({ from, to, row }) => {
    const x = (mid(from) + mid(to)) / 2;
    const y = CARRY_H + row * SLOT_H - SLOT_H / 2;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle"`
      + ` dominant-baseline="central" font-size="4.2" font-weight="700"`
      + ` fill="#6b655c">+</text>`;
  }).join("");
  return `<svg class="mm-cross__plus" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm"`
    + ` aria-hidden="true">${signs}</svg>`;
}

/**
 * The loops, measured in the same millimetres the grid is, so nothing has to be
 * asked of the browser. `under` draws them below one row of figures (the sum
 * written across); `between` draws them from the top number to the bottom one.
 * Each is tied to the box its product goes in — or, where a crossing has no box
 * of its own, to the answer figure it goes straight into — and on screen the
 * only one drawn is the one being asked for.
 */
function arcSvg(arcs, gridCols, top, band, how) {
  if (!arcs.length) return "";
  const W = gridCols * COL_W;
  const H = how === "between" ? STACK_H * 2 : SUM_H + band;
  const x = (col) => col * COL_W + COL_W / 2;
  const TONES = ["#c0453f", "#2a6ca8", "#3f8f4f", "#8a5cc0", "#c9922f"];
  const paths = arcs.map(({ from, to, step, tone }, nth) => {
    const x1 = x(from);
    const x2 = x(to);
    const colour = TONES[tone % TONES.length];
    const tie = step == null ? "" : ` data-pass="${step}"`;
    if (how === "between") {
      /* straight from under the top figure to the top of the bottom one, with
         a head on it: this is the line a hand draws, and two of them crossing
         is what the method is named after. A pair in one column is a line
         straight down. */
      const y1 = STACK_H - 3;
      const y2 = STACK_H + 3.4;
      return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"`
        + ` fill="none" stroke="${colour}" stroke-width="0.55" stroke-linecap="round"`
        + ` marker-end="url(#mm-tip-${tone % TONES.length})"${tie}/>`;
    }
    const y0 = SUM_H - 1.2;
    const cy = y0 + sagOf(Math.abs(x2 - x1), nth) * 2;
    return `<path d="M${x1.toFixed(1)} ${y0.toFixed(1)}Q${((x1 + x2) / 2).toFixed(1)} ${cy.toFixed(1)}`
      + ` ${x2.toFixed(1)} ${y0.toFixed(1)}" fill="none" stroke="${colour}" stroke-width="0.5"`
      + ` stroke-linecap="round"${tie}/>`;
  }).join("");
  /* the heads, one per colour, so a line says which way it was read */
  const tips = how === "between"
    ? `<defs>${TONES.map((c, i) => `<marker id="mm-tip-${i}" viewBox="0 0 6 6" refX="4.8" refY="3"`
      + ` markerWidth="3.6" markerHeight="3.6" orient="auto">`
      + `<path d="M0.8 1 5 3 0.8 5z" fill="${c}"/></marker>`).join("")}</defs>`
    : "";
  return `<svg class="mm-cross__arcs" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm"`
    + ` aria-hidden="true" style="top:${top}mm">${tips}${paths}</svg>`;
}

/* ── the crossing sticks ───────────────────────────────────────────────────*/

/**
 * MULTIPLYING BY LAYING STICKS ACROSS EACH OTHER. Lay 4 sticks then 2 sticks
 * one way, 3 sticks then 1 stick the other way, and count where they cross:
 * the crossings on the left are the hundreds, the ones down the middle are the
 * tens, the ones on the right are the units. 42 x 31 = 12 | 4 + 6 | 2 = 1302.
 *
 * It is the same three sums as the criss-cross and the same four boxes as the
 * grid — but nobody has to be told them. They are there to be counted, which
 * is why it is the first multiplication a child can do before they can
 * multiply.
 *
 * HOW IT IS DRAWN. Every stick of the first number has slope +1 (y = x - c)
 * and every stick of the second has slope -1 (y = e - x), so a stick of one
 * and a stick of the other cross at x = (c + e) / 2. Give the tens of each
 * number the small offsets and the units the big ones, and the crossings fall
 * into three groups along the page by themselves: small+small on the left,
 * big+big on the right, the two mixed pairs in the middle. Nothing is
 * positioned by hand.
 */
export function sticksSvg(a, b) {
  const [a1, a0] = String(a).split("").map(Number);
  const [b1, b0] = String(b).split("").map(Number);
  const D = 7;                                   // the gap between sticks
  const GAP = 18;                                // between one digit and the next
  const COL = { left: "#3f8f4f", mid: "#2a6ca8", right: "#c0453f" };

  /* where each stick sits: the tens first, then the units further along */
  const offs = (hi, lo) => [
    ...Array.from({ length: hi }, (_, i) => i * D),
    ...Array.from({ length: lo }, (_, i) => (hi - 1) * D + GAP + i * D),
  ];
  const A = offs(a1, a0);                        // sticks of the first number
  const B = offs(b1, b0);                        // sticks of the second
  const group = (k, hi) => (k < hi ? "hi" : "lo");

  /* every crossing, and which of the three groups it belongs to */
  const dots = [];
  A.forEach((c, i) => B.forEach((e, j) => {
    const side = group(i, a1) === "hi"
      ? (group(j, b1) === "hi" ? "left" : "mid")
      : (group(j, b1) === "hi" ? "mid" : "right");
    dots.push({ x: (c + e) / 2, y: (e - c) / 2, side });
  }));

  const xs = dots.map((d) => d.x);
  const ys = dots.map((d) => d.y);
  const pad = 12;
  const x0 = Math.min(...xs) - pad;
  const x1 = Math.max(...xs) + pad;
  const y0 = Math.min(...ys) - pad;
  const y1 = Math.max(...ys) + pad;
  const W = x1 - x0;
  const H = y1 - y0;

  /* a stick is drawn from its first crossing to its last, and a little past */
  const line = (pts, slope, colour) => {
    const [p, q] = [Math.min(...pts.map((t) => t.x)), Math.max(...pts.map((t) => t.x))];
    const fy = (x, off) => (slope > 0 ? x - off : off - x);
    return { from: p - 7, to: q + 7, fy };
  };

  const stick = (off, slope, colour) => {
    const on = dots.filter((d) => (slope > 0
      ? Math.abs(d.y - (d.x - off)) < 0.01
      : Math.abs(d.y - (off - d.x)) < 0.01));
    if (!on.length) return "";
    const { from, to, fy } = line(on, slope, colour);
    return `<path d="M${(from - x0).toFixed(1)} ${(fy(from, off) - y0).toFixed(1)}`
      + `L${(to - x0).toFixed(1)} ${(fy(to, off) - y0).toFixed(1)}"`
      + ` stroke="${colour}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
  };

  const sticks = A.map((c) => stick(c, +1, "#2a2723")).join("")
    + B.map((e) => stick(e, -1, "#6b655c")).join("");
  const crossings = dots.map((d) =>
    `<circle cx="${(d.x - x0).toFixed(1)}" cy="${(d.y - y0).toFixed(1)}" r="2.6"`
    + ` fill="${COL[d.side]}" stroke="#fffdf8" stroke-width="0.7"/>`).join("");

  /* the two dashed fences between the three groups */
  const between = (one, two) => {
    const l = Math.max(...dots.filter((d) => d.side === one).map((d) => d.x));
    const r = Math.min(...dots.filter((d) => d.side === two).map((d) => d.x));
    const x = ((l + r) / 2 - x0).toFixed(1);
    return `<path d="M${x} 0V${H.toFixed(1)}" stroke="#b8b1a4" stroke-width="0.8" stroke-dasharray="3 3"/>`;
  };
  const fences = (dots.some((d) => d.side === "mid") ? between("left", "mid") + between("mid", "right") : "");

  const mm = Math.min(76, Math.max(46, W * 0.55));
  return `<svg viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" width="${mm.toFixed(0)}mm"`
    + ` height="${(mm * H / W).toFixed(0)}mm" class="mm-sticks" role="img"`
    + ` aria-label="${a} sticks crossing ${b} sticks">`
    + fences + sticks + crossings + `</svg>`;
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
