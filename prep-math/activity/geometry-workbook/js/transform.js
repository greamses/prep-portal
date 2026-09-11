/* ============================================================================
   Geometry Workbook — the figures for 2D transformations (chapter 5)
   ----------------------------------------------------------------------------
   One picture: SQUARED PAPER, in the coordinates a maths book uses — x to the
   right, y UP — with, when a question needs them, the two axes numbered. On
   it: shapes (the object in ink, its image in blue, their corners lettered A,
   B, C and A′, B′, C′), lines (a mirror line, dashed red, with its equation),
   and points (a centre of rotation or of enlargement).

   Every question in the chapter is a transformation of whole-number points,
   so every corner of every object and image is on a crossing of the grid, and
   a child can draw an image by counting squares — which is the method. The
   crossings are the figure's data-pts, so on screen the lines a child rules
   snap to them, and `edgesRuled` checks the drawing the way the dot grids of
   chapters 2 and 4 are checked: every edge of the right image covered.

   The transformations themselves are here too, as plain arithmetic on
   points, so the exercises and the checks cannot disagree about where an
   image goes.
   ========================================================================== */

const INK = "#2a2723";
const RED = "#c0453f";
const BLUE = "#2f6ea8";
const GRID = "#d9d3c7";
const AXIS = "#6b655c";
const OBJ_FILL = "#fff3a8";
const IMG_FILL = "#bfe3ff";

const f = (n) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);

/* ── the transformations ───────────────────────────────────────────────────*/

/**
 * A mirror line: { k: "x", v } is the line x = v (upright), { k: "y", v } is
 * y = v (across), { k: "d", s: 1 } is y = x and { k: "d", s: -1 } is y = −x.
 */
export function reflect([x, y], L) {
  if (L.k === "x") return [2 * L.v - x, y];
  if (L.k === "y") return [x, 2 * L.v - y];
  return L.s === 1 ? [y, x] : [-y, -x];
}

/** The mirror line written as its equation. */
export function lineName(L) {
  if (L.k === "x") return `x = ${num(L.v)}`;
  if (L.k === "y") return `y = ${num(L.v)}`;
  return L.s === 1 ? "y = x" : "y = −x";
}

/** Every way a child might type that equation. */
export function lineForms(L) {
  const v = L.v;
  if (L.k === "x") return v === 0 ? ["x = 0", "the y-axis", "y-axis", "y axis"] : [`x = ${v}`];
  if (L.k === "y") return v === 0 ? ["y = 0", "the x-axis", "x-axis", "x axis"] : [`y = ${v}`];
  return L.s === 1 ? ["y = x", "x = y"] : ["y = -x", "x = -y", "y = −x"];
}

/**
 * Turn about centre c: +90 is a quarter turn ANTICLOCKWISE, −90 clockwise,
 * 180 a half turn (either way) — the mathematician's direction, y up.
 */
export function rotate([x, y], [cx, cy], deg) {
  const dx = x - cx;
  const dy = y - cy;
  const d = ((deg % 360) + 360) % 360;
  if (d === 90) return [cx - dy, cy + dx];
  if (d === 180) return [cx - dx, cy - dy];
  if (d === 270) return [cx + dy, cy - dx];
  return [x, y];
}

/** Enlarge from centre c by scale factor k: every point k times as far. */
export function enlarge([x, y], [cx, cy], k) {
  return [cx + k * (x - cx), cy + k * (y - cy)];
}

/** Slide by the vector [a, b]: a across (right is +), b up (up is +). */
export function translate([x, y], [a, b]) {
  return [x + a, y + b];
}

/** −3 printed with a real minus sign. */
export const num = (v) => (v < 0 ? `−${-v}` : String(v));
export const pt = ([x, y]) => `(${num(x)}, ${num(y)})`;

/** A column vector as it is written: the across over the up, in brackets. */
export const vec = ([a, b]) => `<span class="gw-vec"><span>${num(a)}</span><span>${num(b)}</span></span>`;

/** A slide said in words: "3 right and 2 down". */
export function slideWords([a, b]) {
  const across = a ? `${Math.abs(a)} ${Math.abs(a) === 1 ? "square" : "squares"} ${a > 0 ? "right" : "left"}` : "";
  const up = b ? `${Math.abs(b)} ${Math.abs(b) === 1 ? "square" : "squares"} ${b > 0 ? "up" : "down"}` : "";
  return [across, up].filter(Boolean).join(" and ");
}

/* ── the paper ─────────────────────────────────────────────────────────────*/

const CELL = 5; // mm to a square
const M = 6;    // mm round the grid, for the numbers on the axes

/** Where the squares of a figure are: its bounds, and the mm ↔ grid maps. */
export function frame(x0, x1, y0, y1, cell = CELL) {
  return {
    x0, x1, y0, y1, cell,
    mm: ([x, y]) => [(x - x0) * cell + M, (y1 - y) * cell + M],
    grid: ([X, Y]) => [x0 + (X - M) / cell, y1 - (Y - M) / cell],
  };
}

/** The bounds that hold all these points, with `pad` squares round them. */
export function boundsOf(points, pad = 1) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];
}

/** Where a mirror line crosses the edges of the grid. */
function clip(L, x0, x1, y0, y1) {
  if (L.k === "x") return [[L.v, y0], [L.v, y1]];
  if (L.k === "y") return [[x0, L.v], [x1, L.v]];
  const s = L.s;
  const cand = [[x0, s * x0], [x1, s * x1], [s * y0, y0], [s * y1, y1]]
    .filter(([x, y]) => x >= x0 - 1e-9 && x <= x1 + 1e-9 && y >= y0 - 1e-9 && y <= y1 + 1e-9);
  cand.sort((a, b) => a[0] - b[0]);
  return [cand[0], cand[cand.length - 1]];
}

const label = (p, s, { col = INK, size = 3.2, weight = 700, anchor = "middle" } = {}) =>
  `<text x="${f(p[0])}" y="${f(p[1] + size * 0.36)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}" stroke="#fffdf8" stroke-width="0.7" paint-order="stroke">${s}</text>`;

/**
 * Squared paper with things on it.
 *
 *   bounds   [x0, x1, y0, y1] in squares
 *   axes     draw and number the x- and y-axes (if they are on the paper)
 *   shapes   [{ pts, image, names, open }] — the object in ink, an `image`
 *            in blue; `names` letters the corners ("A", or "A′" for the
 *            image); `open` draws a line, not a closed shape
 *   lines    [{ L, label }] mirror lines, dashed red, with the equation
 *   points   [{ p, name, col }] a centre, or any marked point
 *   cell     mm to a square
 */
export function tfGrid({ bounds, axes = false, shapes = [], lines = [], points = [], cell = CELL, aria = "Squared paper" }) {
  const [x0, x1, y0, y1] = bounds;
  const F = frame(x0, x1, y0, y1, cell);
  const GR = (x1 - x0) * cell + M; // the grid's right edge
  const GB = (y1 - y0) * cell + M; // and its bottom edge
  /* A named mirror line that is not upright has its equation just past the
     right-hand end of the grid, where nothing is drawn — so the paper grows
     a margin for it. An upright one has it under the grid. */
  const room = lines.some(({ L, name = true }) => name && L.k !== "x") ? 19 : 0;
  const W = GR + M + room;
  const H = GB + M;
  let body = "";

  /* the squares */
  for (let x = x0; x <= x1; x++) {
    const [X] = F.mm([x, 0]);
    body += `<line x1="${f(X)}" y1="${M}" x2="${f(X)}" y2="${f(GB)}" stroke="${GRID}" stroke-width="0.22"/>`;
  }
  for (let y = y0; y <= y1; y++) {
    const [, Y] = F.mm([0, y]);
    body += `<line x1="${M}" y1="${f(Y)}" x2="${f(GR)}" y2="${f(Y)}" stroke="${GRID}" stroke-width="0.22"/>`;
  }

  /* the axes, numbered along the bottom of the x-axis and left of the y */
  if (axes) {
    if (y0 <= 0 && y1 >= 0) {
      const [, Y] = F.mm([0, 0]);
      body += `<line x1="${M - 1}" y1="${f(Y)}" x2="${f(GR + 2.2)}" y2="${f(Y)}" stroke="${AXIS}" stroke-width="0.5"/>`;
      body += `<path d="M${f(GR + 2.2)} ${f(Y)} l-1.6 -1 v2 z" fill="${AXIS}"/>`;
      body += label([GR + 2.6, Y - 2.4], "x", { col: AXIS, size: 3, weight: 400 });
      for (let x = x0; x <= x1; x++) {
        if (x === 0) continue;
        const [X] = F.mm([x, 0]);
        body += label([X, Y + 2.6], num(x), { col: AXIS, size: 2.2, weight: 400 });
      }
    }
    if (x0 <= 0 && x1 >= 0) {
      const [X] = F.mm([0, 0]);
      body += `<line x1="${f(X)}" y1="${f(GB + 1)}" x2="${f(X)}" y2="${M - 2.2}" stroke="${AXIS}" stroke-width="0.5"/>`;
      body += `<path d="M${f(X)} ${M - 2.2} l-1 1.6 h2 z" fill="${AXIS}"/>`;
      body += label([X + 2.4, M - 2.6], "y", { col: AXIS, size: 3, weight: 400 });
      for (let y = y0; y <= y1; y++) {
        if (y === 0) continue;
        const [, Y] = F.mm([0, y]);
        body += label([X - 1.2, Y], num(y), { col: AXIS, size: 2.2, weight: 400, anchor: "end" });
      }
      if (y0 <= 0 && y1 >= 0) {
        const [, Y] = F.mm([0, 0]);
        body += label([X - 1.4, Y + 2.6], "0", { col: AXIS, size: 2.2, weight: 400, anchor: "end" });
      }
    }
  }

  /* mirror lines */
  lines.forEach(({ L, name = true }) => {
    const [a, b] = clip(L, x0, x1, y0, y1).map(F.mm);
    body += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${RED}" stroke-width="0.7" stroke-dasharray="2.2 1.3"/>`;
    if (name) {
      /* upright: under the grid; otherwise past the end of the line that is
         furthest right — beside the grid, or just above or below it */
      const end = a[0] > b[0] ? a : b;
      const at = L.k === "x" ? [a[0] + 1.4, GB + 3.6]
        : end[0] >= GR - 0.01 ? [GR + 1.6, end[1]]
          : end[1] <= M + 0.01 ? [end[0] + 1.2, M - 2.4] : [end[0] + 1.2, GB + 3.4];
      body += label(at, name === true ? lineName(L) : name, { col: RED, size: 2.8, anchor: "start" });
    }
  });

  /* shapes: images first, objects over them — an object inside its own
     enlargement stays in sight */
  [...shapes].sort((u, v) => (v.image ? 1 : 0) - (u.image ? 1 : 0)).forEach(({ pts, image = false, names = null, open = false, faint = false }) => {
    const P = pts.map(F.mm);
    const col = image ? BLUE : INK;
    const fill = open ? "none" : image ? IMG_FILL : OBJ_FILL;
    body += `<${open ? "polyline" : "polygon"} points="${P.map((p) => p.map(f).join(",")).join(" ")}" fill="${fill}" fill-opacity="${faint ? 0.4 : image ? 0.6 : 0.85}" ` +
      `stroke="${col}" stroke-width="0.7" stroke-linejoin="round"${faint ? ' stroke-dasharray="1.4 1"' : ""}/>`;
    if (names) {
      const c = P.reduce((s, p) => [s[0] + p[0] / P.length, s[1] + p[1] / P.length], [0, 0]);
      P.forEach((p, i) => {
        if (!names[i]) return;
        const d = [p[0] - c[0], p[1] - c[1]];
        const l = Math.hypot(d[0], d[1]) || 1;
        body += label([p[0] + (d[0] / l) * 2.6, p[1] + (d[1] / l) * 2.6], names[i], { col, size: 2.9 });
      });
    }
  });

  /* marked points */
  points.forEach(({ p, name = "", col = RED }) => {
    const [X, Y] = F.mm(p);
    body += `<circle cx="${f(X)}" cy="${f(Y)}" r="1.05" fill="${col}"/>`;
    if (name) body += label([X + 2.6, Y - 2.2], name, { col, size: 3 });
  });

  const dots = [];
  for (let y = y1; y >= y0; y--) for (let x = x0; x <= x1; x++) dots.push(F.mm([x, y]).map(f).join(","));
  return (
    `<svg viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" class="gw-fig gw-tf" role="img" ` +
    `data-grid="${x1 - x0 + 1},${y1 - y0 + 1}" data-pts="${dots.join(" ")}" aria-label="${aria}">${body}</svg>`
  );
}

/**
 * Has every edge in `edges` (pairs of grid points) been ruled? `lines` are
 * pairs of indices into the figure's crossings; `F` is the figure's frame. An
 * edge may be ruled in one go or in pieces — every bit of it must be covered
 * by something ruled along it.
 */
export function edgesRuled(edges, lines, fig, F) {
  const G = fig.pts.map(F.grid);
  const segs = lines.map(([i, j]) => [G[i], G[j]]).filter(([p, q]) => p && q);
  const onSeg = (p) => segs.some(([a, b]) => {
    const d = [b[0] - a[0], b[1] - a[1]];
    const L2 = d[0] * d[0] + d[1] * d[1];
    if (!L2) return false;
    const t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / L2;
    if (t < -1e-6 || t > 1 + 1e-6) return false;
    return Math.hypot(p[0] - a[0] - t * d[0], p[1] - a[1] - t * d[1]) < 0.02;
  });
  return edges.every(([A, B]) => {
    for (let k = 1; k < 24; k++) {
      if (!onSeg([A[0] + ((B[0] - A[0]) * k) / 24, A[1] + ((B[1] - A[1]) * k) / 24])) return false;
    }
    return true;
  });
}

/** The edges of a closed shape (or, `open`, a line of points). */
export const edgesOf = (pts, open = false) =>
  pts.slice(0, open ? -1 : undefined).map((p, i) => [p, pts[(i + 1) % pts.length]]);

/* ── small pictures, for "which way is it facing?" ─────────────────────────*/

/** A shape drawn small, on its own, centred in a box of `size` mm. */
export function miniShape(pts, { size = 16, col = INK, fill = OBJ_FILL } = {}) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const s = (size - 3) / span;
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const P = pts.map(([x, y]) => [size / 2 + (x - cx) * s, size / 2 - (y - cy) * s]);
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}mm" height="${size}mm" class="gw-mini" role="img" aria-label="a shape">` +
    `<polygon points="${P.map((p) => p.map(f).join(",")).join(" ")}" fill="${fill}" stroke="${col}" stroke-width="0.6" stroke-linejoin="round"/></svg>`;
}

/** A polygon with n equal sides, or any listed shape, for rotational symmetry. */
export function polySvg(pts, { size = 30 } = {}) {
  return miniShape(pts, { size });
}
