/* ============================================================================
   Manipulatives — the picture on each card
   ----------------------------------------------------------------------------
   Our own SVG, generated rather than hand-typed so a soroban and a suanpan are
   the same drawing with different bead counts. Colours come from the theme
   tokens, so the shelf re-tints with the rest of the site.
   ========================================================================== */

const W = 120;
const H = 80;

const svg = (inner) =>
  `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${inner}</svg>`;

const PAPER = "var(--surface-primary, #fffdf8)";
const LINE = "var(--ink, #2a2723)";
const FAINT = "rgba(42,39,35,.22)";

/* ── blocks ───────────────────────────────────────────────────────────────── */

function slab(x, y, cols, rows, cell, fill) {
  let out = `<rect x="${x}" y="${y}" width="${cols * cell}" height="${rows * cell}"
    fill="${fill}" stroke="${LINE}" stroke-width="1.4"/>`;
  let lines = "";
  for (let i = 1; i < cols; i++) {
    lines += `M${x + i * cell} ${y}V${y + rows * cell}`;
  }
  for (let j = 1; j < rows; j++) {
    lines += `M${x} ${y + j * cell}H${x + cols * cell}`;
  }
  if (lines) out += `<path d="${lines}" stroke="${FAINT}" stroke-width="0.7" fill="none"/>`;
  return out;
}

export function blocksArt() {
  const c = 4.4;
  return svg(
    slab(8, 14, 10, 10, c, "var(--accent-success, #7cc47c)") +
      slab(58, 14, 1, 10, c, "var(--accent-secondary, #6fb7e8)") +
      slab(70, 14, 1, 10, c, "var(--accent-secondary, #6fb7e8)") +
      slab(84, 14, 1, 1, c, "var(--accent-primary, #f4c95d)") +
      slab(84, 24, 1, 1, c, "var(--accent-primary, #f4c95d)") +
      slab(84, 34, 1, 1, c, "var(--accent-primary, #f4c95d)") +
      slab(96, 14, 3, 3, c, "var(--accent-danger, #f07a7a)")
  );
}

/* ── abacus ───────────────────────────────────────────────────────────────── */

function bead(cx, cy, rx, ry, fill) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"
    stroke="${LINE}" stroke-width="1.1"/>`;
}

/** Chinese and Japanese frames: upright rods split by a reckoning bar. */
function upright({ rods, heaven, earth, barY }) {
  const x0 = 12, x1 = W - 12, y0 = 8, y1 = H - 8;
  const step = (x1 - x0) / (rods + 1);
  let out = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"
    fill="${PAPER}" stroke="${LINE}" stroke-width="1.6"/>`;
  out += `<path d="M${x0} ${barY}H${x1}" stroke="${LINE}" stroke-width="2"/>`;

  for (let r = 1; r <= rods; r++) {
    const x = x0 + step * r;
    out += `<path d="M${x} ${y0}V${y1}" stroke="${FAINT}" stroke-width="1"/>`;
    for (let i = 0; i < heaven; i++) {
      out += bead(x, y0 + 6 + i * 8, 5, 3.4, "var(--accent-warning, #f0a868)");
    }
    for (let i = 0; i < earth; i++) {
      out += bead(x, barY + 7 + i * 7.4, 5, 3.2, "var(--accent-secondary, #6fb7e8)");
    }
  }
  return svg(out);
}

export const suanpanArt = () => upright({ rods: 7, heaven: 2, earth: 5, barY: 28 });
export const sorobanArt = () => upright({ rods: 7, heaven: 1, earth: 4, barY: 24 });

/** The Russian schoty: wires lying across, beads counted from the right. */
export function schotyArt() {
  const x0 = 10, x1 = W - 10, y0 = 8, y1 = H - 8;
  const wires = 5;
  const step = (y1 - y0) / (wires + 1);
  let out = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"
    fill="${PAPER}" stroke="${LINE}" stroke-width="1.6"/>`;

  for (let r = 1; r <= wires; r++) {
    const y = y0 + step * r;
    out += `<path d="M${x0} ${y}H${x1}" stroke="${FAINT}" stroke-width="1"/>`;
    const n = 10;
    const pushed = r === 2 ? 4 : r === 4 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      // the fifth and sixth beads are dark on a real schoty, to count by
      const dark = i === 4 || i === 5;
      const at = i < pushed ? x0 + 5 + i * 6.4 : x1 - 5 - (n - 1 - i) * 6.4;
      out += bead(at, y, 3.1, 4.4,
        dark ? "var(--accent-danger, #f07a7a)" : "var(--accent-primary, #f4c95d)");
    }
  }
  return svg(out);
}

/* ── charts and grids ─────────────────────────────────────────────────────── */

function table({ cols, rows, head, fills = [] }) {
  const x0 = 10, x1 = W - 10, y0 = 10, y1 = H - 10;
  const cw = (x1 - x0) / cols;
  const rh = (y1 - y0) / rows;
  let out = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"
    fill="${PAPER}" stroke="${LINE}" stroke-width="1.6"/>`;
  if (head) {
    out += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${rh}"
      fill="var(--accent-primary, #f4c95d)" opacity="0.75"/>`;
  }
  for (const f of fills) {
    out += `<rect x="${x0 + f.c * cw}" y="${y0 + f.r * rh}" width="${cw}" height="${rh}"
      fill="${f.fill}" opacity="0.85"/>`;
  }
  let lines = "";
  for (let c = 1; c < cols; c++) lines += `M${x0 + c * cw} ${y0}V${y1}`;
  for (let r = 1; r < rows; r++) lines += `M${x0} ${y0 + r * rh}H${x1}`;
  out += `<path d="${lines}" stroke="${FAINT}" stroke-width="0.9" fill="none"/>`;
  if (head) out += `<path d="M${x0} ${y0 + rh}H${x1}" stroke="${LINE}" stroke-width="1.4"/>`;
  return svg(out);
}

export const placeValueArt = () =>
  table({
    cols: 4,
    rows: 4,
    head: true,
    fills: [
      { c: 0, r: 1, fill: "var(--accent-danger, #f07a7a)" },
      { c: 1, r: 1, fill: "var(--accent-success, #7cc47c)" },
      { c: 1, r: 2, fill: "var(--accent-success, #7cc47c)" },
      { c: 2, r: 1, fill: "var(--accent-secondary, #6fb7e8)" },
      { c: 3, r: 1, fill: "var(--accent-primary, #f4c95d)" },
      { c: 3, r: 2, fill: "var(--accent-primary, #f4c95d)" },
    ],
  });

export const multiplyArt = () =>
  table({
    cols: 6,
    rows: 5,
    head: true,
    fills: [
      { c: 3, r: 0, fill: "var(--accent-secondary, #6fb7e8)" },
      { c: 0, r: 3, fill: "var(--accent-secondary, #6fb7e8)" },
      { c: 3, r: 3, fill: "var(--accent-success, #7cc47c)" },
    ],
  });

export const divideArt = () =>
  table({
    cols: 6,
    rows: 5,
    head: true,
    fills: [
      { c: 4, r: 2, fill: "var(--accent-success, #7cc47c)" },
      { c: 0, r: 2, fill: "var(--accent-warning, #f0a868)" },
      { c: 4, r: 0, fill: "var(--accent-warning, #f0a868)" },
    ],
  });

/* ── algebra tiles ────────────────────────────────────────────────────────── */

/**
 * The family in one picture: the x² square, the x tile, a red −x beside it and
 * the unit. The x tile is drawn LONGER than four units and shorter than five,
 * which is the whole point of the set — you cannot measure x with ones.
 */
export function tilesArt() {
  const u = 7;          // a unit tile
  const x = u * 4.6;    // an x tile, at its true length
  const tile = (px, py, w, h, fill, label, size = 9) =>
    `<rect x="${px}" y="${py}" width="${w}" height="${h}" rx="1.5"
       fill="${fill}" stroke="${LINE}" stroke-width="1.3"/>
     <text x="${px + w / 2}" y="${py + h / 2}" fill="${LINE}" font-size="${size}"
       font-weight="700" text-anchor="middle" dominant-baseline="central"
       font-family="Unbounded, system-ui, sans-serif">${label}</text>`;

  return svg(
    tile(7, 14, x * 0.72, x * 0.72, "var(--accent-secondary, #6fb7e8)", "x²", 11) +
      tile(38, 14, x * 0.72, u, "var(--accent-secondary, #6fb7e8)", "x") +
      tile(38, 27, x * 0.72, u, "#d2544a", "−x") +
      tile(38, 40, x * 0.42, u, "var(--accent-warning, #f0a868)", "y", 8) +
      tile(80, 40, u, u, "var(--accent-primary, #f4c95d)", "1", 8)
  );
}
