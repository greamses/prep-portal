/* ============================================================================
   Algebra Workbook — the coordinate grid, for CHAPTER 7 (graphs of functions)
   ----------------------------------------------------------------------------
   One function, planeSvg: an x axis and a y axis crossing at the origin, a
   square for every whole number, and on it whatever the question needs:

     lines   y = mx + c (or x = a, a line straight up), clipped to the grid and
             lettered at one end when there is more than one
     curve   any y = f(x), sampled finely and broken where it leaves the grid
     pts     dots at points
     build   every whole-number point a target to tap: a cross appears there
             (the shared utils/components/workbook/dotplot.js — the same piece
             the Statistics Workbook's scatter graphs are plotted with)
     rule    every whole-number point a snap point (data-pts, going across the
             x values in order and up each one), so on screen a child rules a
             line with the workbook's own ruler

   Millimetres at the paper's own size. Every colour a fixed hex.
   ========================================================================== */

const INK = "#2a2723";
const GREY = "#8a837a";
const GRID = "#dcd6ca";
const COLS = ["#2f6ea8", "#c0453f", "#3d8a4a", "#b7791f"];

const f = (n) => (+n).toFixed(2);
const minus = (v) => (v < 0 ? `−${-v}` : String(v));
const text = (x, y, t, { size = 2.6, col = INK, weight = 600, anchor = "middle" } = {}) =>
  `<text x="${f(x)}" y="${f(y + size * 0.36)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}">${t}</text>`;

/** Snap point k of a `rule` grid, back to (x, y). */
export const pointOf = (k, x0, x1, y0, y1) => {
  const ny = y1 - y0 + 1;
  return [x0 + Math.floor(k / ny), y0 + (k % ny)];
};
/** …and (x, y) to its snap point. */
export const indexOf = (x, y, x0, x1, y0, y1) => (x - x0) * (y1 - y0 + 1) + (y - y0);

/** The part of a line inside the box: y = m·x + c, or { x: a } straight up. */
function clipLine(l, x0, x1, y0, y1) {
  if (l.x !== undefined) return l.x >= x0 && l.x <= x1 ? [[l.x, y0], [l.x, y1]] : null;
  const pts = [];
  const add = (x, y) => {
    if (x >= x0 - 1e-9 && x <= x1 + 1e-9 && y >= y0 - 1e-9 && y <= y1 + 1e-9 && !pts.some((p) => Math.abs(p[0] - x) < 1e-9 && Math.abs(p[1] - y) < 1e-9)) pts.push([x, y]);
  };
  add(x0, l.m * x0 + l.c); add(x1, l.m * x1 + l.c);
  if (l.m) { add((y0 - l.c) / l.m, y0); add((y1 - l.c) / l.m, y1); }
  if (pts.length < 2) return null;
  pts.sort((a, b) => a[0] - b[0]);
  return [pts[0], pts[pts.length - 1]];
}

/**
 *   x, y     [lowest, highest] whole numbers on each axis
 *   cell     millimetres per unit
 *   lines    [{ m, c } | { x }, name?]
 *   curve    { fn, name? }
 *   pts      [[x, y], …] dots
 *   build    tap-to-plot targets;  rule   snap points to rule between
 *   title
 */
export function planeSvg({ x: [x0, x1], y: [y0, y1], cell = 4.4, lines = [], curve = null, pts = [], build = false, rule = false, title = "" }) {
  const L = 8; const T = title ? 9 : 4; const R = 6; const B = 5;
  const W = L + (x1 - x0) * cell + R;
  const H = T + (y1 - y0) * cell + B;
  const X = (x) => L + (x - x0) * cell;
  const Y = (y) => T + (y1 - y) * cell;
  /* the axes cross at 0 — or run along the edge when 0 is off the grid */
  const ax = Math.min(Math.max(0, y0), y1);
  const ay = Math.min(Math.max(0, x0), x1);
  const every = Math.max(x1 - x0, y1 - y0) > 14 ? 2 : 1;
  let body = title ? text(W / 2, 3.4, title, { size: 3.2, weight: 700 }) : "";

  for (let x = x0; x <= x1; x++) body += `<line x1="${f(X(x))}" y1="${f(Y(y1))}" x2="${f(X(x))}" y2="${f(Y(y0))}" stroke="${GRID}" stroke-width="0.2"/>`;
  for (let y = y0; y <= y1; y++) body += `<line x1="${f(X(x0))}" y1="${f(Y(y))}" x2="${f(X(x1))}" y2="${f(Y(y))}" stroke="${GRID}" stroke-width="0.2"/>`;
  body += `<line x1="${f(X(x0))}" y1="${f(Y(ax))}" x2="${f(X(x1) + 2.5)}" y2="${f(Y(ax))}" stroke="${INK}" stroke-width="0.45"/>` +
    `<path d="M${f(X(x1) + 3.2)} ${f(Y(ax))}l-1.8 -1l0 2z" fill="${INK}"/>` + text(X(x1) + 3.6, Y(ax) + 2.4, "x", { size: 2.9, weight: 700 });
  body += `<line x1="${f(X(ay))}" y1="${f(Y(y0))}" x2="${f(X(ay))}" y2="${f(Y(y1) - 2.5)}" stroke="${INK}" stroke-width="0.45"/>` +
    `<path d="M${f(X(ay))} ${f(Y(y1) - 3.2)}l-1 1.8l2 0z" fill="${INK}"/>` + text(X(ay) - 2.2, Y(y1) - 2.6, "y", { size: 2.9, weight: 700 });
  for (let x = x0; x <= x1; x++) if (x !== ay && (x - x0) % every === 0) body += text(X(x), Y(ax) + 2.4, minus(x), { size: 2.3 });
  /* round the origin the two axes' numbers would sit on each other: the y
     axis leaves its −1 to be read from its neighbours */
  const crowded = (y) => y === -1 && ay === 0 && x0 < 0;
  for (let y = y0; y <= y1; y++) if (y !== ax && !crowded(y) && (y - y0) % every === 0) body += text(X(ay) - 1.4, Y(y), minus(y), { size: 2.3, anchor: "end" });

  const named = lines.filter((l) => l.name).length;
  lines.forEach((l, j) => {
    const seg = clipLine(l, x0, x1, y0, y1);
    if (!seg) return;
    const col = named > 1 || l.col ? (l.col || COLS[j % COLS.length]) : COLS[0];
    const [[xa, ya], [xb, yb]] = seg;
    body += `<line x1="${f(X(xa))}" y1="${f(Y(ya))}" x2="${f(X(xb))}" y2="${f(Y(yb))}" stroke="${col}" stroke-width="0.6"${l.dash ? ' stroke-dasharray="1.6 1"' : ""}/>`;
    if (l.name) {
      /* the name at the top end of the line, pushed inside the grid */
      const [lx, ly] = l.x !== undefined ? [xb, y1] : (yb >= ya ? [xb, yb] : [xa, ya]);
      const px = Math.min(Math.max(X(lx) + (l.x !== undefined ? 1.6 : 1.2), X(x0) + 1), X(x1) - 1);
      const py = Math.min(Math.max(Y(ly) + 2.4, Y(y1) + 2.2), Y(y0) - 1);
      body += text(px, py, l.name, { size: 3, weight: 800, col, anchor: "start" });
    }
  });

  if (curve) {
    let d = ""; let pen = false;
    for (let x = x0; x <= x1 + 1e-9; x += 0.05) {
      const y = curve.fn(x);
      if (y < y0 - 1e-9 || y > y1 + 1e-9 || !Number.isFinite(y)) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${f(X(x))} ${f(Y(y))}`;
      pen = true;
    }
    body += `<path d="${d}" fill="none" stroke="${COLS[0]}" stroke-width="0.6"/>`;
  }

  pts.forEach(([x, y]) => { body += `<circle cx="${f(X(x))}" cy="${f(Y(y))}" r="0.9" fill="${INK}"/>`; });

  let attrs = "";
  if (build) {
    attrs += ' data-dotplot="1"';
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      body += `<circle class="dp-hit" cx="${f(X(x))}" cy="${f(Y(y))}" r="${f(cell / 2.1)}" data-x="${x}" data-y="${y}"/>`;
    }
  }
  if (rule) {
    const snap = [];
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) snap.push(`${f(X(x))},${f(Y(y))}`);
    attrs += ` data-pts="${snap.join(" ")}" data-grid="1"`;
  }
  return `<svg class="gr-fig" viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" role="img" aria-label="${title || "A coordinate grid"}"${attrs}>${body}</svg>`;
}
