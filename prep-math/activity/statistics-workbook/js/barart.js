/* ============================================================================
   Statistics Workbook — the drawings for CHAPTER 2, bar charts
   ----------------------------------------------------------------------------
     blocks      a block graph: every one a square, stacked — the bar chart's
                 concrete stage, where the height is COUNTED
     barChart    bars against a scale: gridlines, labels, a title; vertical or
                 lying down; one series or two side by side (with a key); and
                 to BUILD — empty axes whose columns are tapped on screen to
                 raise each bar (utils/components/workbook/barbuild.js)
     the faults  a chart that misleads, for the last section: an axis that
                 does not start at 0, steps that are not even, bars of
                 different widths

   Millimetres at the paper's own size.
   ========================================================================== */

const INK = "#2a2723";
const GREY = "#8a837a";
const GRID = "#d9d3c7";
export const FILLS = ["#bfe3ff", "#ffd7a3", "#c8f0c0", "#fff3a8", "#f6c9c4", "#e3d4f7"];

const f = (n) => (+n).toFixed(2);
const text = (x, y, t, { size = 3.3, col = INK, weight = 700, anchor = "middle", rotate = 0 } = {}) =>
  `<text x="${f(x)}" y="${f(y + size * 0.36)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}"${rotate ? ` transform="rotate(${rotate} ${f(x)} ${f(y)})"` : ""}>${t}</text>`;
const svg = (w, h, body, aria, extra = "") =>
  `<svg class="sw-fig" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}mm" height="${f(h)}mm" role="img" aria-label="${aria}"${extra}>${body}</svg>`;

/* ── block graphs ─────────────────────────────────────────────────────────── */

/** Columns of squares, one square for each one — counted, not read off a scale. */
export function blocksSvg(cats, values, { size = 5.2, title = "", fill = FILLS[0] } = {}) {
  const slot = Math.max(size + 6, ...cats.map((c) => c.length * 2 + 3));
  const top = Math.max(...values);
  const x0 = 4;
  const t = title ? 8 : 2;
  const base = t + top * size + 1;
  let body = title ? text(x0 + (cats.length * slot) / 2, 3.5, title, { size: 3.4 }) : "";
  cats.forEach((c, i) => {
    const cx = x0 + i * slot + slot / 2;
    for (let k = 0; k < values[i]; k++) {
      body += `<rect x="${f(cx - size / 2)}" y="${f(base - (k + 1) * size)}" width="${f(size)}" height="${f(size)}" fill="${fill}" stroke="${INK}" stroke-width="0.35"/>`;
    }
    body += text(cx, base + 3.6, c, { size: 3, weight: 600 });
  });
  body += `<line x1="${x0}" y1="${f(base)}" x2="${f(x0 + cats.length * slot)}" y2="${f(base)}" stroke="${INK}" stroke-width="0.5"/>`;
  return svg(x0 * 2 + cats.length * slot, base + 7, body, title || "A block graph");
}

/* ── bar charts ───────────────────────────────────────────────────────────── */

/**
 * A bar chart.
 *
 *   cats      labels along the bottom (or down the side, lying down)
 *   series    [{ values, name, fill }] — one, or two side by side
 *   step      the value between gridlines;  top  the value at the top line
 *   title, yLabel
 *   horizontal  bars lying down
 *   build     { unit } — empty axes to draw on: each column gets bands to tap,
 *             one per `unit`, and its bar starts at 0
 *   from      the value the axis starts at (a fault: it should be 0)
 *   ticks     values at equally spaced gridlines (a fault if they are uneven)
 *   widths    per-bar width scale (a fault if they differ)
 */
export function barChartSvg({
  cats, series, step, top, title = "", yLabel = "", horizontal = false, build = null,
  from = 0, ticks = null, widths = null, plot = 58,
}) {
  const nS = series.length;
  const barW = nS > 1 ? 6.5 : 9;
  const slot = Math.max(nS * barW + 7, ...cats.map((c) => c.length * 2 + 4));
  const labelsW = horizontal ? Math.max(12, ...cats.map((c) => c.length * 2 + 4)) : 12;
  /* the title on its own line, and the axis label on the next, so they never meet */
  const T = title ? (yLabel && !horizontal ? 13 : 9) : (yLabel && !horizontal ? 7 : 3);
  const lines = ticks || (() => { const out = []; for (let v = from; v <= top + 1e-9; v += step) out.push(+v.toFixed(6)); return out; })();
  /* where a value sits along the axis: evenly between the gridlines drawn,
     even when the gridlines' numbers are NOT even (that is the fault) */
  const at = (v) => {
    for (let i = 1; i < lines.length; i++) {
      if (v <= lines[i] + 1e-9) {
        const a = lines[i - 1];
        const b = lines[i];
        return ((i - 1) + (v - a) / (b - a)) / (lines.length - 1);
      }
    }
    return 1;
  };
  let body = "";
  let W;
  let H;
  const extra = [];

  if (!horizontal) {
    const x0 = labelsW + 2;
    const base = T + plot;
    W = x0 + cats.length * slot + 6;
    H = base + 11;
    if (title) body += text(W / 2, 4, title, { size: 3.5 });
    if (yLabel) body += text(x0 - 1, T - 2.6, yLabel, { size: 2.7, anchor: "start", weight: 600, col: GREY });
    lines.forEach((v) => {
      const y = base - at(v) * plot;
      body += `<line x1="${f(x0)}" y1="${f(y)}" x2="${f(W - 3)}" y2="${f(y)}" stroke="${GRID}" stroke-width="0.25"/>`;
      body += text(x0 - 1.5, y, String(v), { size: 2.9, anchor: "end", weight: 600 });
    });
    body += `<line x1="${f(x0)}" y1="${f(T - 1)}" x2="${f(x0)}" y2="${f(base)}" stroke="${INK}" stroke-width="0.5"/>`;
    cats.forEach((c, i) => {
      const cx = x0 + i * slot + slot / 2;
      const scale = widths ? widths[i] : 1;
      series.forEach((s, j) => {
        const w = barW * scale;
        const x = cx - (nS * w) / 2 + j * w;
        if (build) {
          const per = plot / (top - from);
          body += `<rect class="bb-bar" data-col="${i}" x="${f(x)}" y="${f(base)}" width="${f(w)}" height="0" fill="${s.fill || FILLS[j]}" stroke="${INK}" stroke-width="0.4" pointer-events="none"/>`;
          for (let v = build.unit; v <= top + 1e-9; v += build.unit) {
            const y1 = base - v * per;
            body += `<rect class="bb-hit" data-col="${i}" data-v="${+v.toFixed(6)}" data-step="${build.unit}" x="${f(cx - slot / 2 + 1)}" y="${f(y1)}" width="${f(slot - 2)}" height="${f(build.unit * per)}"/>`;
          }
          body += `<circle class="bb-mark" data-col="${i}" cx="${f(cx)}" cy="${f(base + 8.4)}" r="1.1"/>`;
          extra.push(per);
        } else {
          const v = s.values[i];
          const h = at(Math.max(v, from)) * plot;
          body += `<rect x="${f(x)}" y="${f(base - h)}" width="${f(w)}" height="${f(h)}" fill="${s.fill || FILLS[j]}" stroke="${INK}" stroke-width="0.4"/>`;
        }
      });
      body += text(cx, base + 4, c, { size: 3, weight: 600 });
    });
    body += `<line x1="${f(x0)}" y1="${f(base)}" x2="${f(W - 3)}" y2="${f(base)}" stroke="${INK}" stroke-width="0.5"/>`;
    if (nS > 1) {
      let lx = x0;
      series.forEach((s, j) => {
        body += `<rect x="${f(lx)}" y="${f(H - 3.8)}" width="3.4" height="3" fill="${s.fill || FILLS[j]}" stroke="${INK}" stroke-width="0.3"/>` +
          text(lx + 4.6, H - 2.3, s.name, { size: 2.8, anchor: "start", weight: 600 });
        lx += 8 + s.name.length * 1.8;
      });
      H += 1;
    }
    const attrs = build ? ` data-barbuild="1" data-axis="${f(base)},${f(plot / (top - from))}"` : "";
    return svg(W, H, body, title || "A bar chart", attrs);
  }

  /* lying down: categories down the side, the scale along the bottom */
  const x0 = labelsW + 2;
  const plotW = Math.max(70, plot * 1.3);
  const rowH = nS * 5.5 + 4;
  W = x0 + plotW + 8;
  H = T + cats.length * rowH + 10;
  const base = T + cats.length * rowH;
  if (title) body += text(W / 2, 4, title, { size: 3.5 });
  lines.forEach((v) => {
    const x = x0 + at(v) * plotW;
    body += `<line x1="${f(x)}" y1="${f(T)}" x2="${f(x)}" y2="${f(base)}" stroke="${GRID}" stroke-width="0.25"/>`;
    body += text(x, base + 3.4, String(v), { size: 2.9, weight: 600 });
  });
  cats.forEach((c, i) => {
    const cy = T + i * rowH + rowH / 2;
    series.forEach((s, j) => {
      const h = nS * 5.5 / nS;
      const y = cy - (nS * h) / 2 + j * h;
      body += `<rect x="${f(x0)}" y="${f(y)}" width="${f(at(s.values[i]) * plotW)}" height="${f(h - 0.6)}" fill="${s.fill || FILLS[j]}" stroke="${INK}" stroke-width="0.4"/>`;
    });
    body += text(x0 - 1.8, cy, c, { size: 3, anchor: "end", weight: 600 });
  });
  body += `<line x1="${f(x0)}" y1="${f(T)}" x2="${f(x0)}" y2="${f(base)}" stroke="${INK}" stroke-width="0.5"/>`;
  body += `<line x1="${f(x0)}" y1="${f(base)}" x2="${f(x0 + plotW)}" y2="${f(base)}" stroke="${INK}" stroke-width="0.5"/>`;
  if (yLabel) body += text(x0 + plotW / 2, H - 2, yLabel, { size: 2.7, weight: 600, col: GREY });
  return svg(W, H, body, title || "A bar chart lying on its side", " data-horizontal=\"1\"");
}
