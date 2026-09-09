/* ============================================================================
   Place Value Workbook — the number blocks, drawn for paper
   ----------------------------------------------------------------------------
   The same Dienes blocks as the manipulatives canvas, flattened onto a sheet:
   a unit is one square, a rod is a column of `base` squares, a flat is a
   `base` × `base` square, and a cube is a flat drawn with a lid and a side so
   it reads as solid without pretending to be a photograph.

   Two rules carried over from the canvas, because a child who has used the
   blocks on screen has to recognise these as the SAME blocks:

     • Colour says which of units, tens and hundreds a piece is, and nothing
       else. The places run in threes, so the colours run in threes with them —
       a thousand-cube is butter again because a thousand is the UNIT of the
       thousands. (See PERIOD_TOKENS in base-blocks/js/config.js.)
     • Every square is drawn. A flat you cannot count the squares of is a
       picture of a hundred, not a hundred.

   Colours here are fixed hexes rather than live theme tokens, unlike the rest
   of the site: the workbook is paper. It has to look the same printed from a
   dark-mode browser as from a light one, and a printer has no theme.
   ========================================================================== */

/* The period palette, taken as the fallback hexes of the canvas's own tokens so
   the two never drift: units / tens / hundreds OF ANY PERIOD. */
const PERIOD = ["#f4c95d", "#6fb7e8", "#7cc47c"];
const INK = "#2a2723";
const FAINT = "rgba(42,39,35,.28)";

/** The fill for a place, by its power. */
export function placeFill(power) {
  return PERIOD[((power % 3) + 3) % 3];
}

/* One block cell in SVG user units. Everything below is measured in cells and
   the viewBox does the scaling, so a base-five sheet and a base-ten sheet come
   out with squares the same size on the page. */
const CELL = 10;

/* …and what one cell is on the paper. Every drawing carries its size in
   MILLIMETRES rather than stretching to the width of its column, because the
   size of a block is not decoration here — it is the claim being made. A
   hundred-flat is ten rods across and it has to LOOK ten rods across, on every
   question and next to every other pile on the page. */
export const CELL_MM = 2.4;
export const KEY_CELL_MM = 1.8; // the legend, scaled down as a whole set

/* ── one piece ─────────────────────────────────────────────────────────────*/

/** A grid of cols × rows squares with every square ruled in. */
function slab(x, y, cols, rows, fill) {
  const w = cols * CELL;
  const h = rows * CELL;
  let d = "";
  for (let i = 1; i < cols; i++) d += `M${x + i * CELL} ${y}V${y + h}`;
  for (let j = 1; j < rows; j++) d += `M${x} ${y + j * CELL}H${x + w}`;
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${INK}" stroke-width="1.6"/>` +
    (d ? `<path d="${d}" stroke="${FAINT}" stroke-width="0.8" fill="none"/>` : "")
  );
}

/**
 * A cube: the front face ruled like a flat, with a lid and a right side
 * skewed back so the solid reads at a glance. The two extra faces are drawn
 * plain and slightly darkened by an overlay rather than by a second colour,
 * because a cube is ONE place and must be ONE colour.
 */
function cube(x, y, base, fill) {
  const s = base * CELL;
  const d = base * 0.42 * CELL; // how far back the solid goes
  const top = `${x},${y + d} ${x + d},${y} ${x + s + d},${y} ${x + s},${y + d}`;
  const side = `${x + s},${y + d} ${x + s + d},${y} ${x + s + d},${y + s} ${x + s},${y + s + d}`;
  return (
    `<polygon points="${top}" fill="${fill}" stroke="${INK}" stroke-width="1.6"/>` +
    `<polygon points="${top}" fill="rgba(255,255,255,.35)" stroke="none"/>` +
    `<polygon points="${side}" fill="${fill}" stroke="${INK}" stroke-width="1.6"/>` +
    `<polygon points="${side}" fill="rgba(42,39,35,.16)" stroke="none"/>` +
    slab(x, y + d, base, base, fill)
  );
}

/* ── laying pieces out ─────────────────────────────────────────────────────*/

/**
 * The pieces one place contributes, as {w,h,draw} boxes measured in cells.
 * Power 0 is a unit, 1 a rod, 2 a flat, 3 a cube — blocks go no higher,
 * which is why every blocks exercise caps itself at four places.
 */
function piecesFor(power, count, base) {
  const fill = placeFill(power);
  const out = [];
  for (let i = 0; i < count; i++) {
    if (power === 0) out.push({ w: 1, h: 1, draw: (x, y) => slab(x, y, 1, 1, fill) });
    else if (power === 1) out.push({ w: 1, h: base, draw: (x, y) => slab(x, y, 1, base, fill) });
    else if (power === 2) out.push({ w: base, h: base, draw: (x, y) => slab(x, y, base, base, fill) });
    else {
      const back = base * 0.42;
      out.push({
        w: base + back, h: base + back,
        draw: (x, y) => cube(x, y, base, fill),
      });
    }
  }
  return out;
}

/**
 * Units are the one place that is not laid in a line. Nine units in a row read
 * as a rod that has been cut; nine units in a three-by-three read as nine. So
 * they are grouped into a block at most three wide, built from the bottom up
 * the way a child stacks them.
 */
function bundleUnits(count) {
  if (!count) return [];
  const cols = Math.min(3, count);
  const rows = Math.ceil(count / cols);
  return [{
    w: cols + (cols - 1) * 0.18,
    h: rows + (rows - 1) * 0.18,
    draw: (x, y) => {
      let out = "";
      for (let i = 0; i < count; i++) {
        const c = i % cols;
        const rFromBottom = Math.floor(i / cols);
        const px = x + c * 1.18 * CELL;
        const py = y + (rows - 1 - rFromBottom) * 1.18 * CELL;
        out += slab(px, py, 1, 1, PERIOD[0]);
      }
      return out;
    },
  }];
}

const GROUP_GAP = 1.4;  // cells between one place and the next
const ITEM_GAP = 0.45;  // cells between two pieces of the same place
const ROW_GAP = 1.0;    // cells between wrapped rows

/**
 * Draw a pile of blocks.
 *
 * `counts` is lowest-place-first, exactly like digitsOf — counts[2] is always
 * the number of flats — and may hold MORE than base-1 of a place, which is the
 * whole point of the trading exercises.
 */
export function blocksSvg(counts, base, { maxCells = 55, label = "", cellMm = CELL_MM } = {}) {
  /* Highest place first, left to right, the way the number is written. */
  const groups = [];
  for (let p = counts.length - 1; p >= 0; p--) {
    const n = counts[p] || 0;
    if (!n) continue;
    groups.push(p === 0 ? bundleUnits(n) : piecesFor(p, n, base));
  }
  if (!groups.length) {
    return `<svg viewBox="0 0 ${CELL * 8} ${CELL * 4}" class="pv-blocks" role="img" aria-label="No blocks"></svg>`;
  }

  /* Pack into rows, bottom-aligned, wrapping when a row runs off the paper. */
  const rows = [[]];
  let x = 0;
  let firstInRow = true;
  groups.forEach((pieces, gi) => {
    pieces.forEach((piece, pi) => {
      const gap = firstInRow ? 0 : pi === 0 ? GROUP_GAP : ITEM_GAP;
      if (!firstInRow && x + gap + piece.w > maxCells) {
        rows.push([]);
        x = 0;
        firstInRow = true;
      }
      const at = firstInRow ? x : x + gap;
      rows[rows.length - 1].push({ ...piece, x: at, group: gi });
      x = at + piece.w;
      firstInRow = false;
    });
  });

  const rowH = rows.map((r) => Math.max(...r.map((p) => p.h)));
  const totalW = Math.max(...rows.map((r) => Math.max(...r.map((p) => p.x + p.w))));
  const totalH = rowH.reduce((s, h) => s + h, 0) + ROW_GAP * (rows.length - 1);

  let body = "";
  let yCell = 0;
  rows.forEach((row, i) => {
    row.forEach((p) => {
      /* Bottom-aligned: a rod and a flat stand on the same line, the way they
         would on a desk. */
      body += p.draw(p.x * CELL, (yCell + rowH[i] - p.h) * CELL);
    });
    yCell += rowH[i] + ROW_GAP;
  });

  const pad = 0.4 * CELL;
  const w = totalW * CELL + pad * 2;
  const h = totalH * CELL + pad * 2;
  return (
    `<svg viewBox="${-pad} ${-pad} ${w} ${h}" ` +
    `width="${round(totalW * cellMm + 0.8 * cellMm)}mm" ` +
    `height="${round(totalH * cellMm + 0.8 * cellMm)}mm" ` +
    `class="pv-blocks" preserveAspectRatio="xMidYMid meet" role="img" ` +
    `aria-label="${label || "Base blocks"}">${body}</svg>`
  );
}

/* ── the empty box you draw into ───────────────────────────────────────────*/

/**
 * A framed panel of squared paper. Squares the size of a unit block, so a child
 * drawing a rod has ten squares to count along and does not have to guess how
 * big to make it — the paper is the ruler.
 */
export function drawingBox(base, { rows = 12, cols = 55 } = {}) {
  const w = cols * CELL;
  const h = rows * CELL;
  let d = "";
  for (let i = 1; i < cols; i++) d += `M${i * CELL} 0V${h}`;
  for (let j = 1; j < rows; j++) d += `M0 ${j * CELL}H${w}`;
  /* Every `base`-th line is darker, so the paper itself is grouped into the
     base you are working in. */
  let heavy = "";
  for (let i = base; i < cols; i += base) heavy += `M${i * CELL} 0V${h}`;
  for (let j = base; j < rows; j += base) heavy += `M0 ${j * CELL}H${w}`;
  return (
    `<svg viewBox="-1 -1 ${w + 2} ${h + 2}" class="pv-drawbox" ` +
    `width="${round(cols * CELL_MM)}mm" height="${round(rows * CELL_MM)}mm" ` +
    `preserveAspectRatio="xMidYMid meet" ` +
    `role="img" aria-label="Squared paper to draw blocks on">` +
    `<rect x="0" y="0" width="${w}" height="${h}" fill="#fffdf8"/>` +
    `<path d="${d}" stroke="rgba(42,39,35,.13)" stroke-width="0.7" fill="none"/>` +
    (heavy ? `<path d="${heavy}" stroke="rgba(42,39,35,.26)" stroke-width="0.9" fill="none"/>` : "") +
    `<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="1.6"/>` +
    `</svg>`
  );
}

/**
 * The little key that goes at the top of a blocks page: one of each piece with
 * its name and its worth, so a child who has never met the blocks can read the
 * whole section from the key alone.
 */
export function blocksKey(base, names, worths) {
  const cells = [0, 1, 2, 3].map((p) => {
    const counts = [0, 0, 0, 0];
    counts[p] = 1;
    return (
      `<div class="pv-key__item">` +
      `<div class="pv-key__art">${blocksSvg(counts, base, { maxCells: base + 6, cellMm: KEY_CELL_MM })}</div>` +
      `<div class="pv-key__name">${names[p]}</div>` +
      `<div class="pv-key__worth">${p === 0 ? "1" : "= " + worths[p]}</div>` +
      `</div>`
    );
  });
  return `<div class="pv-key">${cells.join("")}</div>`;
}

/** Millimetres, to a tenth — enough for a printer, short enough to read. */
function round(mm) {
  return Math.round(mm * 10) / 10;
}
