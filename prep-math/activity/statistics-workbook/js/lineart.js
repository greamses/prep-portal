/* ============================================================================
   Statistics Workbook — the drawings for CHAPTER 3, line graphs
   ----------------------------------------------------------------------------
   One function, lineSvg: a scale up the side, times (or anything in order)
   along the bottom, and for each series a dot at every reading joined to the
   next by a straight line. Options make it every stage of the chapter:

     bars      the same numbers as bars behind the line — the line is the bars'
               tops joined, which is where a line graph comes from
     build     empty axes: every gridpoint a dot to snap to (data-pts), so on
               screen a child rules from each plotted point to the next — the
               workbook's own ruling tool (want.draw) does the drawing
     two lines a second series, dashed, with a key
     faults    a scale that does not start at 0; times not evenly spaced but
               drawn as if they were

   Millimetres at the paper's own size.
   ========================================================================== */

const INK = "#2a2723";
const GREY = "#8a837a";
const GRID = "#d9d3c7";
const LINE = ["#2f6ea8", "#c0453f"];
const BAR = "#bfe3ff";

const f = (n) => (+n).toFixed(2);
const text = (x, y, t, { size = 3.1, col = INK, weight = 600, anchor = "middle" } = {}) =>
  `<text x="${f(x)}" y="${f(y + size * 0.36)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}">${t}</text>`;
const svg = (w, h, body, aria, extra = "") =>
  `<svg class="sw-fig" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}mm" height="${f(h)}mm" role="img" aria-label="${aria}"${extra}>${body}</svg>`;

/** The snap points of a line graph to BUILD, in the order data-pts lists them:
    for each x in turn, every level from `from` to `top` by `unit`. */
export function buildPoints(nx, from, top, unit) {
  const out = [];
  for (let i = 0; i < nx; i++) for (let v = from; v <= top + 1e-9; v += unit) out.push([i, +v.toFixed(6)]);
  return out;
}

/**
 *   xs        labels along the bottom
 *   series    [{ values, name }] — one or two
 *   step, top, from   the scale
 *   title, yLabel, xLabel
 *   bars      true: the first series also drawn as bars, behind
 *   build     { unit } — empty axes with every gridpoint to snap to
 *   xAt       positions along the bottom (0…1) — uneven spacing, for a fault
 *   labelsAt  which x labels to write (all, by default)
 */
export function lineSvg({
  xs, series = [], step, top, from = 0, title = "", yLabel = "", xLabel = "", bars = false, build = null,
  xAt = null, plot = 52, slot = 13,
}) {
  const x0 = 13;
  const T = title ? (yLabel ? 13 : 9) : (yLabel ? 7 : 3);
  const plotW = (xs.length - 1) * slot;
  const base = T + plot;
  const W = x0 + plotW + 10;
  const H = base + 10 + (xLabel ? 4 : 0) + (series.length > 1 ? 5 : 0);
  const Y = (v) => base - ((v - from) / (top - from)) * plot;
  const X = (i) => x0 + 4 + (xAt ? xAt[i] * plotW : i * slot);
  let body = "";
  if (title) body += text((x0 + W) / 2, 4, title, { size: 3.5, weight: 700 });
  if (yLabel) body += text(x0 - 1, T - 2.6, yLabel, { size: 2.7, anchor: "start", col: GREY });
  for (let v = from; v <= top + 1e-9; v += step) {
    const y = Y(v);
    body += `<line x1="${f(x0)}" y1="${f(y)}" x2="${f(W - 4)}" y2="${f(y)}" stroke="${GRID}" stroke-width="0.25"/>`;
    body += text(x0 - 1.5, y, String(+v.toFixed(6)), { size: 2.9, anchor: "end" });
  }
  xs.forEach((l, i) => {
    body += `<line x1="${f(X(i))}" y1="${f(T - 1)}" x2="${f(X(i))}" y2="${f(base)}" stroke="${GRID}" stroke-width="0.2"/>`;
    body += text(X(i), base + 3.8, l, { size: 2.9 });
  });
  body += `<line x1="${f(x0)}" y1="${f(T - 1)}" x2="${f(x0)}" y2="${f(base)}" stroke="${INK}" stroke-width="0.5"/>`;
  body += `<line x1="${f(x0)}" y1="${f(base)}" x2="${f(W - 4)}" y2="${f(base)}" stroke="${INK}" stroke-width="0.5"/>`;
  if (xLabel) body += text(x0 + 4 + plotW / 2, base + 8.6, xLabel, { size: 2.7, col: GREY });

  if (bars && series[0]) {
    series[0].values.forEach((v, i) => {
      if (v == null) return;
      body += `<rect x="${f(X(i) - 3.5)}" y="${f(Y(v))}" width="7" height="${f(base - Y(v))}" fill="${BAR}" stroke="${INK}" stroke-width="0.3" opacity="0.8"/>`;
    });
  }
  series.forEach((s, j) => {
    /* a null is a time with no reading: no dot there, and the line goes straight past it */
    const pts = s.values.map((v, i) => (v == null ? null : [X(i), Y(v)])).filter(Boolean);
    body += `<polyline points="${pts.map((p) => p.map(f).join(",")).join(" ")}" fill="none" stroke="${LINE[j]}" stroke-width="0.7" stroke-linejoin="round"${j ? ' stroke-dasharray="1.8 1.2"' : ""}/>`;
    pts.forEach(([x, y]) => {
      body += j
        ? `<rect x="${f(x - 1.1)}" y="${f(y - 1.1)}" width="2.2" height="2.2" fill="${LINE[j]}"/>`
        : `<circle cx="${f(x)}" cy="${f(y)}" r="1.15" fill="${LINE[j]}"/>`;
    });
  });
  if (series.length > 1) {
    let lx = x0;
    series.forEach((s, j) => {
      body += `<line x1="${f(lx)}" y1="${f(H - 2.5)}" x2="${f(lx + 6)}" y2="${f(H - 2.5)}" stroke="${LINE[j]}" stroke-width="0.7"${j ? ' stroke-dasharray="1.8 1.2"' : ""}/>` +
        text(lx + 7.4, H - 2.5, s.name, { size: 2.8, anchor: "start" });
      lx += 12 + s.name.length * 1.8;
    });
  }

  let attrs = "";
  if (build) {
    const pts = buildPoints(xs.length, from, top, build.unit);
    attrs = ` data-pts="${pts.map(([i, v]) => `${f(X(i))},${f(Y(v))}`).join(" ")}"`;
  }
  return svg(W, H, body, title || "A line graph", attrs);
}
