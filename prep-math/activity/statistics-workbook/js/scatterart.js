/* ============================================================================
   Statistics Workbook — the drawings for CHAPTER 5, scatter graphs
   ----------------------------------------------------------------------------
   One function, scatterSvg: two number scales, one along the bottom and one up
   the side, each with ten steps, and a cross for every pair of readings. The
   data is kept in GRID UNITS (0 to 10 on each axis) and each context says what
   a unit is worth, so the same generator serves marks out of 10, 20 or 100.

     lines   straight lines across the plot (a line of best fit, or three to
             choose between, lettered at their right-hand end), clipped to it
     build   empty axes with every gridpoint a target to tap: a cross appears
             (utils/components/workbook/dotplot.js)
     rule    every gridpoint a snap point (data-pts, across then up), so on
             screen a child rules a line of best fit with the workbook's ruler

   Millimetres at the paper's own size.
   ========================================================================== */

const INK = "#2a2723";
const GREY = "#8a837a";
const GRID = "#d9d3c7";
const DOT = "#2f6ea8";
const LINES = ["#c0453f", "#2f6ea8", "#3d8a4a"];

const f = (n) => (+n).toFixed(2);
const text = (x, y, t, { size = 2.9, col = INK, weight = 600, anchor = "middle", rotate = 0 } = {}) =>
  `<text x="${f(x)}" y="${f(y + size * 0.36)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}"${rotate ? ` transform="rotate(${rotate} ${f(x)} ${f(y)})"` : ""}>${t}</text>`;
const svg = (w, h, body, aria, extra = "") =>
  `<svg class="sw-fig" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}mm" height="${f(h)}mm" role="img" aria-label="${aria}"${extra}>${body}</svg>`;

const cross = (x, y, d = 1.1, col = DOT) =>
  `<path d="M${f(x - d)} ${f(y - d)}L${f(x + d)} ${f(y + d)}M${f(x + d)} ${f(y - d)}L${f(x - d)} ${f(y + d)}" stroke="${col}" stroke-width="0.5" stroke-linecap="round"/>`;

/** A value on an axis from a grid unit: from + u × step. */
export const valueAt = (ax, u) => +(ax.from + u * ax.step).toFixed(6);

/** The part of the line y = a + b·x (in units) that lies inside the 0–10 square. */
export function clip(a, b) {
  const pts = [];
  const push = (x, y) => { if (x >= -1e-9 && x <= 10 + 1e-9 && y >= -1e-9 && y <= 10 + 1e-9) pts.push([x, y]); };
  push(0, a); push(10, a + 10 * b);
  if (b !== 0) { push(-a / b, 0); push((10 - a) / b, 10); }
  if (pts.length < 2) return null;
  pts.sort((p, q) => p[0] - q[0]);
  return [pts[0], pts[pts.length - 1]];
}

/**
 *   pts      [[u, v], …] in grid units
 *   xAxis, yAxis   { from, step, label }
 *   title
 *   lines    [{ a, b, name }] — y = a + b·x in units
 *   build    true: empty, every gridpoint a target to tap
 *   rule     true: every gridpoint a snap point to rule between
 *   marks    [{ at: [u, v], name }] — a letter beside a point
 */
export function scatterSvg({ pts = [], xAxis, yAxis, title = "", lines = [], build = false, rule = false, marks = [], cell = 5.4 }) {
  const x0 = 13;
  const T = title ? 12 : 6;
  const P = 10 * cell;
  const base = T + P;
  const W = x0 + P + 9;
  const H = base + 11;
  const X = (u) => x0 + u * cell;
  const Y = (v) => base - v * cell;
  let body = "";
  /* on screen the Undo / Clear bar sits top right of a graph you work on: its title starts at the left */
  if (title) body += build || rule ? text(2, 3.6, title, { size: 3.4, weight: 700, anchor: "start" }) : text(W / 2, 3.6, title, { size: 3.4, weight: 700 });
  if (yAxis.label) body += text(x0 - 1, T - 3, yAxis.label, { size: 2.7, anchor: "start", col: GREY });
  for (let u = 0; u <= 10; u++) {
    body += `<line x1="${f(X(u))}" y1="${f(T)}" x2="${f(X(u))}" y2="${f(base)}" stroke="${GRID}" stroke-width="0.2"/>`;
    body += `<line x1="${f(x0)}" y1="${f(Y(u))}" x2="${f(X(10))}" y2="${f(Y(u))}" stroke="${GRID}" stroke-width="0.2"/>`;
    body += text(X(u), base + 3.4, String(valueAt(xAxis, u)), { size: 2.6 });
    body += text(x0 - 1.4, Y(u), String(valueAt(yAxis, u)), { size: 2.6, anchor: "end" });
  }
  body += `<line x1="${f(x0)}" y1="${f(T)}" x2="${f(x0)}" y2="${f(base)}" stroke="${INK}" stroke-width="0.5"/>`;
  body += `<line x1="${f(x0)}" y1="${f(base)}" x2="${f(X(10))}" y2="${f(base)}" stroke="${INK}" stroke-width="0.5"/>`;
  if (xAxis.label) body += text(x0 + P / 2, base + 8, xAxis.label, { size: 2.7, col: GREY });

  lines.forEach((l, j) => {
    const seg = clip(l.a, l.b);
    if (!seg) return;
    const [[ua, va], [ub, vb]] = seg;
    const col = lines.length > 1 ? LINES[j % LINES.length] : GREY;
    body += `<line x1="${f(X(ua))}" y1="${f(Y(va))}" x2="${f(X(ub))}" y2="${f(Y(vb))}" stroke="${col}" stroke-width="0.6"${lines.length > 1 && j ? ` stroke-dasharray="${j === 1 ? "2 1.2" : "0.6 1"}"` : ""}/>`;
    if (l.name) body += text(X(ub) + 2, Y(vb) + (vb > 9.5 ? 2 : vb < 0.5 ? -2 : 0), l.name, { size: 3.1, weight: 700, col, anchor: "start" });
  });

  pts.forEach(([u, v]) => { body += cross(X(u), Y(v)); });
  marks.forEach((m) => { body += text(X(m.at[0]) + 2.4, Y(m.at[1]) - 2.2, m.name, { size: 2.9, weight: 700, anchor: "start" }); });

  let attrs = "";
  if (build) {
    attrs = " data-dotplot=\"1\"";
    for (let u = 0; u <= 10; u++) {
      for (let v = 0; v <= 10; v++) {
        body += `<circle class="dp-hit" cx="${f(X(u))}" cy="${f(Y(v))}" r="${f(cell / 2.1)}" data-x="${valueAt(xAxis, u)}" data-y="${valueAt(yAxis, v)}"/>`;
      }
    }
  }
  if (rule) {
    const snap = [];
    for (let u = 0; u <= 10; u++) for (let v = 0; v <= 10; v++) snap.push(`${f(X(u))},${f(Y(v))}`);
    attrs += ` data-pts="${snap.join(" ")}" data-grid="1"`;
  }
  return svg(W, H, body, title || "A scatter graph", attrs);
}

/** Snap point k of a `rule` graph, back in grid units. */
export const unitOf = (k) => [Math.floor(k / 11), k % 11];
