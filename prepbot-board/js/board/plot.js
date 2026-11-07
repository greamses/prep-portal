/* ============================================================================
   PrepBoard — graphs, computed
   ----------------------------------------------------------------------------
   A curve on the board is computed from its equation by the site's own
   expression engine (the one behind Cartesian Art's grapher), never drawn
   from the model's idea of what it looks like. This turns a graph op's ranges
   into a mapping onto the figure panel, picks tick marks a person would
   choose, and samples a function into polylines — finely where it bends, and
   broken where it jumps (tan x, 1/x).

   Pure: no DOM — node-testable.
   ========================================================================== */

import { parse, compile } from "../../../prep-math/activity/cartesian-art/js/expr.js";

/** Ticks a person would choose: 1, 2 or 5 times a power of ten. */
export function niceTicks(lo, hi, maxN = 8) {
  const span = hi - lo;
  if (!(span > 0)) return [];
  const raw = span / maxN;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((m) => m * p).find((s) => span / s <= maxN) || 10 * p;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) {
    out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
  }
  return out;
}

/** A graph's own units onto a box of the board (y grows upward on the graph). */
export function makeMapper(graph, box) {
  const [x0, x1] = graph.x;
  const [y0, y1] = graph.y;
  const sx = box.w / (x1 - x0);
  const sy = box.h / (y1 - y0);
  return {
    box,
    x: graph.x,
    y: graph.y,
    toX: (v) => box.x + (v - x0) * sx,
    toY: (v) => box.y + box.h - (v - y0) * sy,
    /* where the axes cross: at 0 when 0 is in range, else along the edge */
    originX: () => box.x + (Math.min(Math.max(0, x0), x1) - x0) * sx,
    originY: () => box.y + box.h - (Math.min(Math.max(0, y0), y1) - y0) * sy,
    ticks: { x: niceTicks(x0, x1), y: niceTicks(y0, y1, 7) },
  };
}

/** The figure panel's plain 0–10 grid, for arrows and shapes with no graph. */
export function gridMapper(box) {
  return makeMapper({ x: [0, 10], y: [0, 10] }, box);
}

/**
 * The function an equation draws, as x → y. Accepts "y = 2x + 1", "f(x) = x^2"
 * or just "x^2 - 3". Throws (expr.js ParseError) when it cannot be read, or
 * when it is not a function of x alone.
 */
export function compileFn(src, { deg = false } = {}) {
  const text = String(src).replace(/^\s*(?:y|f\s*\(\s*x\s*\))\s*=\s*/i, "");
  const tree = parse(text);
  const item = tree.items?.[0];
  if (!item || item.exprs.length !== 1) throw new Error("Not a function of x");
  const f = compile(item.exprs[0], { deg });
  return (x) => f({ x });
}

const MAXD = 7;

/**
 * Sample a function into polylines in BOARD units. Copied in spirit from
 * cartesian-art/js/graph.js sampleFn (which is tied to that page's DOM): one
 * sample per ~4 units, subdivided where the curve moves more than 2.5 units,
 * broken at a jump. Points far outside the box are clamped so a steep curve
 * still leaves the panel cleanly.
 */
export function samplePlot(f, mapper, xr = null) {
  const lo = Math.max(mapper.x[0], xr ? xr[0] : -Infinity);
  const hi = Math.min(mapper.x[1], xr ? xr[1] : Infinity);
  if (!(hi > lo)) return [];
  const { box } = mapper;
  const n = Math.max(24, Math.round(((mapper.toX(hi) - mapper.toX(lo)) / 4)));
  const limTop = box.y - box.h * 2, limBot = box.y + box.h * 3;
  const safe = (x) => { try { const v = f(x); return typeof v === "number" ? v : NaN; } catch { return NaN; } };
  const toB = (y) => mapper.toY(y);
  const lines = [];
  let cur = null;
  const add = (a0, b0, a1, b1) => {
    if (!cur) { cur = [[a0, Math.max(limTop, Math.min(limBot, b0))]]; lines.push(cur); }
    cur.push([a1, Math.max(limTop, Math.min(limBot, b1))]);
  };
  const brk = () => { cur = null; };
  const outside = (p) => p < box.y - box.h * 0.5 || p > box.y + box.h * 1.5;

  function seg(x0, y0, x1, y1, d) {
    const f0 = Number.isFinite(y0), f1 = Number.isFinite(y1);
    if (!f0 && !f1) { brk(); return; }
    const p0 = f0 ? toB(y0) : NaN, p1 = f1 ? toB(y1) : NaN;
    if (f0 && f1) {
      if (outside(p0) && outside(p1) && Math.sign(p0 - box.y) === Math.sign(p1 - box.y)) { brk(); return; }
      if (Math.abs(p1 - p0) <= 2.5 || d >= MAXD) {
        if (d >= MAXD && Math.abs(p1 - p0) > 4) {
          const ym = safe((x0 + x1) / 2);
          const pm = toB(ym);
          if (!Number.isFinite(ym) || Math.abs(pm - (p0 + p1) / 2) > 0.3 * Math.abs(p1 - p0)) { brk(); return; }
        }
        add(mapper.toX(x0), p0, mapper.toX(x1), p1);
        return;
      }
    } else if (d >= MAXD) { brk(); return; }
    const xm = (x0 + x1) / 2;
    seg(x0, y0, xm, safe(xm), d + 1);
    seg(xm, safe(xm), x1, y1, d + 1);
  }

  let xp = lo, yp = safe(lo);
  for (let i = 1; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n;
    const y = safe(x);
    seg(xp, yp, x, y, 0);
    xp = x; yp = y;
  }
  return lines.filter((l) => l.length > 1);
}

/** Polylines → one SVG path string, rounded to a tenth of a unit. */
export function pathOf(lines) {
  const r = (v) => Math.round(v * 10) / 10;
  return lines.map((l) => "M" + l.map(([x, y]) => `${r(x)} ${r(y)}`).join("L")).join("");
}
