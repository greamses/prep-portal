/* ============================================================================
   Cartesian Art — drawing the typed equations on the plane
   ----------------------------------------------------------------------------
   graph-model.js says what each row is; this draws it into the plane's own
   "graph" layer (above the grid, below the learner's points), in pixels, the
   same way grid.js draws, so a curve stays crisp at any zoom and exports with
   the rest of the picture.

     y = f(x), x = g(y)   sampled once per pixel, subdivided where it bends,
                          broken where it jumps (tan x, 1/x, floor x)
     parametric, polar    sampled along t / θ, subdivided by pixel distance
     implicit             marching squares on a 5px lattice
     regions              a small bitmap of where the inequality holds,
                          stretched smooth under a crisp boundary

   Hovering a curve shows the point under the pointer; the selected row's
   roots, turning points, y-intercept and crossings appear as grey dots.
   ========================================================================== */

import { layers, layout, toPx, toMath, onRender, clientToMath } from "./grid.js";

const SVGNS = "http://www.w3.org/2000/svg";

let items = [];          // [{ id, color, style, width, hidden, result, selected, opacity }]
let poiList = [];        // points of interest on screen right now (px + math)
const cache = new WeakMap(); // result → { key, paths }

const el = (name, attrs = {}, parent = null) => {
  const n = document.createElementNS(SVGNS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};

export const DASH = { solid: null, dashed: "9 7", dotted: "0.5 7" };

/** Give the plotter the panel's current rows. */
export function setItems(list) {
  items = list;
  draw();
}

export function initGraph() {
  onRender(draw);
}

/* ── the visible window ──────────────────────────────────────────────────── */

function view() {
  const a = toMath(0, 0), b = toMath(layout.w, layout.h);
  return {
    xLo: a.x, xHi: b.x, yLo: b.y, yHi: a.y, w: layout.w, h: layout.h,
    key: [a.x, b.x, a.y, b.y, layout.w, layout.h].map((v) => v.toPrecision(10)).join(","),
  };
}
const X = (x) => layout.ox + x * layout.unitX;
const Y = (y) => layout.oy - y * layout.unitY;

/* ── sampling ────────────────────────────────────────────────────────────── */

const MAXD = 7;
const clampPx = (v, lim) => (v < -lim ? -lim : v > lim ? lim : v);

/**
 * Sample f along one screen axis. `toA` maps the input to its pixel, `toB`
 * the output. Returns polylines of [a, b] pixel pairs (a along the input axis).
 */
function sampleFn(f, lo, hi, n, toA, toB, limB) {
  const lines = [];
  let cur = null;
  const lim = limB * 10;
  const safe = (x) => { try { const v = f(x); return typeof v === "number" ? v : NaN; } catch { return NaN; } };
  const add = (a0, b0, a1, b1) => {
    if (!cur) { cur = [[a0, clampPx(b0, lim)]]; lines.push(cur); }
    cur.push([a1, clampPx(b1, lim)]);
  };
  const brk = () => { cur = null; };

  function seg(x0, y0, x1, y1, d) {
    const f0 = isFinite(y0), f1 = isFinite(y1);
    if (!f0 && !f1) { brk(); return; }
    const p0 = f0 ? toB(y0) : NaN, p1 = f1 ? toB(y1) : NaN;
    if (f0 && f1) {
      // both far off the same side: nothing to see, but keep the pen moving
      if ((p0 < -limB && p1 < -limB) || (p0 > 2 * limB && p1 > 2 * limB)) { brk(); return; }
      if (Math.abs(p1 - p0) <= 2.5 || d >= MAXD) {
        if (d >= MAXD && Math.abs(p1 - p0) > 4) {
          // still steep at the finest step: a jump, unless the middle agrees
          const ym = safe((x0 + x1) / 2);
          const pm = toB(ym);
          if (!isFinite(ym) || Math.abs(pm - (p0 + p1) / 2) > 0.3 * Math.abs(p1 - p0)) { brk(); return; }
        }
        add(toA(x0), p0, toA(x1), p1);
        return;
      }
    } else if (d >= MAXD) {
      brk();
      return;
    }
    const xm = (x0 + x1) / 2;
    seg(x0, y0, xm, safe(xm), d + 1);
    seg(xm, safe(xm), x1, y1, d + 1);
  }

  let xPrev = lo, yPrev = safe(lo);
  for (let i = 1; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n;
    const y = safe(x);
    seg(xPrev, yPrev, x, y, 0);
    xPrev = x; yPrev = y;
  }
  return lines;
}

/** Sample a parametric curve t ↦ (fx, fy) into pixel polylines. */
function sampleParam(fx, fy, t0, t1, v) {
  const lines = [];
  let cur = null;
  const lim = Math.max(v.w, v.h) * 10;
  const at = (t) => {
    try {
      const x = fx(t), y = fy(t);
      return isFinite(x) && isFinite(y) ? [clampPx(X(x), lim), clampPx(Y(y), lim)] : null;
    } catch { return null; }
  };
  const add = (p0, p1) => {
    if (!cur) { cur = [p0]; lines.push(cur); }
    cur.push(p1);
  };
  let budget = 40000;
  function seg(ta, pa, tb, pb, d) {
    if (budget-- <= 0) return;
    if (!pa && !pb) { cur = null; return; }
    if (pa && pb) {
      const dist = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      if (dist <= 3 || d >= 9) {
        if (d >= 9 && dist > 40) { cur = null; return; } // a jump
        add(pa, pb);
        return;
      }
    } else if (d >= 9) { cur = null; return; }
    const tm = (ta + tb) / 2;
    const pm = at(tm);
    seg(ta, pa, tm, pm, d + 1);
    seg(tm, pm, tb, pb, d + 1);
  }
  if (!(t1 > t0) || !isFinite(t0) || !isFinite(t1)) return lines;
  const N = 600;
  let tPrev = t0, pPrev = at(t0);
  for (let i = 1; i <= N; i++) {
    const t = t0 + ((t1 - t0) * i) / N;
    const p = at(t);
    seg(tPrev, pPrev, t, p, 0);
    tPrev = t; pPrev = p;
  }
  return lines;
}

/** Marching squares: F(x, y) = 0 as a list of pixel segments. */
function marching(F, v, cell = 5) {
  const cols = Math.ceil(v.w / cell), rows = Math.ceil(v.h / cell);
  const vals = new Float64Array((cols + 1) * (rows + 1));
  const at = (px, py) => {
    const m = toMath(px, py);
    try { const r = F(m.x, m.y); return typeof r === "number" ? r : NaN; } catch { return NaN; }
  };
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) vals[j * (cols + 1) + i] = at(i * cell, j * cell);
  const segs = [];
  const lerp = (a, b, va, vb) => a + (b - a) * (va / (va - vb));
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * (cols + 1) + i;
      const a = vals[k], b = vals[k + 1], c = vals[k + cols + 2], d = vals[k + cols + 1]; // tl tr br bl
      if (!(isFinite(a) && isFinite(b) && isFinite(c) && isFinite(d))) continue;
      const code = (a > 0 ? 8 : 0) | (b > 0 ? 4 : 0) | (c > 0 ? 2 : 0) | (d > 0 ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const x0 = i * cell, y0 = j * cell, x1 = x0 + cell, y1 = y0 + cell;
      const top = [lerp(x0, x1, a, b), y0], right = [x1, lerp(y0, y1, b, c)];
      const bot = [lerp(x0, x1, d, c), y1], left = [x0, lerp(y0, y1, a, d)];
      let pairs;
      switch (code) {
        case 1: case 14: pairs = [[left, bot]]; break;
        case 2: case 13: pairs = [[bot, right]]; break;
        case 3: case 12: pairs = [[left, right]]; break;
        case 4: case 11: pairs = [[top, right]]; break;
        case 6: case 9: pairs = [[top, bot]]; break;
        case 7: case 8: pairs = [[left, top]]; break;
        case 5: case 10: {
          // saddle: the centre decides which corners join
          const mid = at(x0 + cell / 2, y0 + cell / 2);
          const up = mid > 0;
          pairs = (code === 5) === up ? [[left, top], [bot, right]] : [[left, bot], [top, right]];
          break;
        }
      }
      const scale = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d));
      for (const [p, q] of pairs) {
        // a sign change across a pole (1/x = 0 style) is not a crossing
        const fm = at((p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
        if (!isFinite(fm) || Math.abs(fm) > scale * 2) continue;
        segs.push(p, q);
      }
    }
  }
  return segs;
}

/** A soft bitmap of where `test` holds, as a data URL. */
function regionImage(test, v, color, cell = 4) {
  const cols = Math.ceil(v.w / cell) + 1, rows = Math.ceil(v.h / cell) + 1;
  const cv = document.createElement("canvas");
  cv.width = cols;
  cv.height = rows;
  const cx = cv.getContext("2d");
  const img = cx.createImageData(cols, rows);
  const [r, g, b] = hexRgb(color);
  let any = false;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const m = toMath(i * cell, j * cell);
      let on = false;
      try { on = !!test(m.x, m.y); } catch { on = false; }
      if (!on) continue;
      any = true;
      const o = (j * cols + i) * 4;
      img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
  }
  if (!any) return null;
  cx.putImageData(img, 0, 0);
  return { url: cv.toDataURL(), w: (cols - 1) * cell, h: (rows - 1) * cell };
}

function hexRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return [45, 112, 179];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* ── building paths for one row ──────────────────────────────────────────── */

const ptsToD = (lines) => lines
  .filter((l) => l.length > 1)
  .map((l) => "M" + l.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join("L"))
  .join("");

function curvePaths(c, v) {
  if (c.type === "fnx") {
    const lines = sampleFn(c.f, v.xLo, v.xHi, Math.ceil(v.w), X, Y, v.h);
    return ptsToD(lines);
  }
  if (c.type === "fny") {
    const lines = sampleFn(c.f, v.yLo, v.yHi, Math.ceil(v.h), Y, X, v.w).map((l) => l.map(([a, b]) => [b, a]));
    return ptsToD(lines);
  }
  if (c.type === "param") return ptsToD(sampleParam(c.fx, c.fy, c.t0, c.t1, v));
  if (c.type === "implicit") {
    const s = marching(c.F, v);
    let d = "";
    for (let i = 0; i < s.length; i += 2) d += `M${s[i][0].toFixed(1)},${s[i][1].toFixed(1)}L${s[i + 1][0].toFixed(1)},${s[i + 1][1].toFixed(1)}`;
    return d;
  }
  return "";
}

function built(it, v) {
  const res = it.result;
  const c = cache.get(res);
  if (c && c.key === v.key && c.color === it.color) return c;
  const out = { key: v.key, color: it.color, paths: [], region: null };
  for (const cv of res.curves || []) out.paths.push(curvePaths(cv, v));
  if (res.kind === "region" && res.region) out.region = regionImage(res.region, v, it.color);
  cache.set(res, out);
  return out;
}

/* ── points of interest (selected row) ───────────────────────────────────── */

function rootsOf(f, lo, hi, n = 600) {
  const out = [];
  const safe = (x) => { try { return f(x); } catch { return NaN; } };
  let x0 = lo, y0 = safe(lo);
  for (let i = 1; i <= n; i++) {
    const x1 = lo + ((hi - lo) * i) / n, y1 = safe(x1);
    if (isFinite(y0) && isFinite(y1)) {
      if (y0 === 0) out.push(x0);
      else if (y0 * y1 < 0) {
        let a = x0, b = x1, fa = y0;
        for (let k = 0; k < 60; k++) {
          const m = (a + b) / 2, fm = safe(m);
          if (!isFinite(fm)) break;
          if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
        }
        const r = (a + b) / 2, fr = safe(r);
        // a sign change across a pole is not a root
        if (isFinite(fr) && Math.abs(fr) < 1e-6 * (1 + Math.abs(y0) + Math.abs(y1))) out.push(r);
      }
    }
    x0 = x1; y0 = y1;
  }
  return out;
}

function extremaOf(f, lo, hi, n = 600) {
  const out = [];
  const safe = (x) => { try { return f(x); } catch { return NaN; } };
  const ys = [];
  for (let i = 0; i <= n; i++) ys.push(safe(lo + ((hi - lo) * i) / n));
  for (let i = 1; i < n; i++) {
    const a = ys[i - 1], b = ys[i], c = ys[i + 1];
    if (!(isFinite(a) && isFinite(b) && isFinite(c))) continue;
    const isMax = b > a && b >= c, isMin = b < a && b <= c;
    if (!isMax && !isMin) continue;
    // golden-section search in the bracket
    let l = lo + ((hi - lo) * (i - 1)) / n, r = lo + ((hi - lo) * (i + 1)) / n;
    const g = (Math.sqrt(5) - 1) / 2;
    const better = (p, q) => (isMax ? p > q : p < q);
    let m1 = r - g * (r - l), m2 = l + g * (r - l), f1 = safe(m1), f2 = safe(m2);
    for (let k = 0; k < 60; k++) {
      if (better(f1, f2)) { r = m2; m2 = m1; f2 = f1; m1 = r - g * (r - l); f1 = safe(m1); }
      else { l = m1; m1 = m2; f1 = f2; m2 = l + g * (r - l); f2 = safe(m2); }
    }
    const x = (l + r) / 2, y = safe(x);
    // a spike at a pole is not a turning point
    if (isFinite(y) && Math.abs(y - b) < Math.abs(b - a) + Math.abs(c - b) + 1e-9) out.push({ x, y, label: isMax ? "max" : "min" });
  }
  return out;
}

function pois(v) {
  const list = [];
  const fnx = items.filter((it) => !it.hidden && it.result.curves)
    .flatMap((it) => it.result.curves.filter((c) => c.type === "fnx").map((c) => ({ it, f: c.f })));
  const sel = items.find((it) => it.selected && !it.hidden);
  if (sel && sel.result.curves) {
    for (const c of sel.result.curves) {
      if (c.type !== "fnx") continue;
      const f = (x) => c.f(x);
      for (const x of rootsOf(f, v.xLo, v.xHi)) list.push({ x, y: 0 });
      for (const e of extremaOf(f, v.xLo, v.xHi)) list.push({ x: e.x, y: e.y });
      if (v.xLo < 0 && v.xHi > 0) {
        let y0 = NaN;
        try { y0 = f(0); } catch {}
        if (isFinite(y0)) list.push({ x: 0, y: y0 });
      }
      for (const o of fnx) {
        if (o.it === sel) continue;
        const d = (x) => f(x) - o.f(x);
        for (const x of rootsOf(d, v.xLo, v.xHi, 400)) {
          let y = NaN;
          try { y = f(x); } catch {}
          if (isFinite(y)) list.push({ x, y });
        }
      }
    }
  }
  const seen = new Set();
  return list.filter((p) => {
    if (p.y < v.yLo || p.y > v.yHi) return false;
    const k = `${Math.round(X(p.x))},${Math.round(Y(p.y))}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 60).map((p) => ({ ...p, px: X(p.x), py: Y(p.y), grey: true }));
}

/* ── drawing ─────────────────────────────────────────────────────────────── */

let hoverG = null;

function draw() {
  const L = layers.graph;
  if (!L || !layout.w) return;
  while (L.firstChild) L.removeChild(L.firstChild);
  hoverG = null;
  const v = view();
  poiList = [];

  for (const it of items) {
    if (it.hidden) continue;
    const res = it.result;
    if (res.kind === "points") {
      const g = el("g", { class: "ca-graph-pts" }, L);
      for (const p of res.points) {
        if (!isFinite(p.x) || !isFinite(p.y)) continue;
        const px = X(p.x), py = Y(p.y);
        el("circle", { cx: px, cy: py, r: it.width === "thick" ? 7 : it.width === "thin" ? 4 : 5.5,
          fill: it.color, class: "ca-graph-pt" }, g);
        if (it.label) {
          const t = el("text", { x: px + 9, y: py - 9, class: "ca-graph-ptlabel" }, g);
          t.textContent = `(${fmt(p.x)}, ${fmt(p.y)})`;
        }
        poiList.push({ x: p.x, y: p.y, px, py, color: it.color });
      }
      continue;
    }
    if (!res.curves) continue;
    let b;
    try { b = built(it, v); } catch { continue; }
    const g = el("g", { class: "ca-graph-row" }, L);
    if (b.region) {
      el("image", { href: b.region.url, x: 0, y: 0, width: b.region.w, height: b.region.h,
        preserveAspectRatio: "none", opacity: it.opacity ?? 0.28, class: "ca-graph-region" }, g);
    }
    const dash = res.kind === "region" && res.strict ? DASH.dashed : DASH[it.style];
    const sw = it.width === "thick" ? 4.5 : it.width === "thin" ? 1.6 : 2.8;
    for (const d of b.paths) {
      if (!d) continue;
      const attrs = { d, stroke: it.color, "stroke-width": it.selected ? sw + 0.8 : sw, class: "ca-graph-curve" };
      if (dash) attrs["stroke-dasharray"] = dash;
      el("path", attrs, g);
    }
  }

  // the selected row's points of interest
  const extra = pois(v);
  if (extra.length) {
    const g = el("g", { class: "ca-graph-pois" }, L);
    for (const p of extra) el("circle", { cx: p.px, cy: p.py, r: 4.5, class: "ca-graph-poi" }, g);
    poiList.push(...extra);
  }
  hoverG = el("g", { class: "ca-graph-hover" }, L);
}

export function fmt(v) {
  if (!isFinite(v)) return "undefined";
  const a = Math.abs(v);
  const d = a >= 1000 ? 1 : a >= 1 ? 3 : 4;
  const s = Number(v.toFixed(d)).toString();
  return s === "-0" ? "0" : s.replace("-", "−");
}

/* ── hover: trace a curve, or read a dot ─────────────────────────────────── */

function showHover(px, py, label, color) {
  if (!hoverG) return;
  while (hoverG.firstChild) hoverG.removeChild(hoverG.firstChild);
  el("circle", { cx: px, cy: py, r: 6, fill: color || "#6b6b6b", class: "ca-graph-trace" }, hoverG);
  const t = el("text", { x: 0, y: 0, class: "ca-graph-tip-text" }, hoverG);
  t.textContent = label;
  const bb = t.getBBox();
  const w = bb.width + 14, h = 22;
  let tx = px + 12, ty = py - h - 8;
  if (tx + w > layout.w - 4) tx = px - w - 12;
  if (ty < 4) ty = py + 10;
  const r = el("rect", { x: tx, y: ty, width: w, height: h, class: "ca-graph-tip" }, hoverG);
  hoverG.insertBefore(r, t);
  t.setAttribute("x", tx + 7);
  t.setAttribute("y", ty + 15);
}
function clearHover() {
  if (hoverG) while (hoverG.firstChild) hoverG.removeChild(hoverG.firstChild);
}

export function initTrace(stage) {
  stage.addEventListener("pointermove", (e) => {
    if (e.buttons || !items.length) { clearHover(); return; }
    const r = stage.querySelector("svg").getBoundingClientRect();
    const px = (e.clientX - r.left) * (layout.w / r.width);
    const py = (e.clientY - r.top) * (layout.h / r.height);

    // a dot (point, root, turning point) wins over the curve it sits on
    let best = null, bd = 11;
    for (const p of poiList) {
      const d = Math.hypot(p.px - px, p.py - py);
      if (d < bd) { bd = d; best = p; }
    }
    if (best) { showHover(best.px, best.py, `(${fmt(best.x)}, ${fmt(best.y)})`, best.grey ? null : best.color); return; }

    const m = clientToMath(e.clientX, e.clientY);
    let hit = null; bd = 12;
    for (const it of items) {
      if (it.hidden || !it.result.curves) continue;
      for (const c of it.result.curves) {
        try {
          if (c.type === "fnx") {
            const y = c.f(m.x);
            const d = Math.abs(Y(y) - py);
            if (isFinite(y) && d < bd) { bd = d; hit = { x: m.x, y, color: it.color }; }
          } else if (c.type === "fny") {
            const x = c.f(m.y);
            const d = Math.abs(X(x) - px);
            if (isFinite(x) && d < bd) { bd = d; hit = { x, y: m.y, color: it.color }; }
          }
        } catch {}
      }
    }
    if (hit) showHover(X(hit.x), Y(hit.y), `(${fmt(hit.x)}, ${fmt(hit.y)})`, hit.color);
    else clearHover();
  });
  stage.addEventListener("pointerleave", clearHover);
}

/* ── turning a curve into a Cartesian Art shape ──────────────────────────── */

/**
 * The longest visible piece of a row's first curve as math points (≤ `max`),
 * or the row's points. Used by "Make a shape" so a graph can be painted.
 */
export function shapePoints(result, max = 48) {
  if (result.kind === "points") return { points: result.points.filter((p) => isFinite(p.x) && isFinite(p.y)), closed: false };
  const c = result.curves && result.curves[0];
  if (!c || c.type === "implicit") return null;
  const v = view();
  let lines;
  if (c.type === "fnx") lines = sampleFn(c.f, v.xLo, v.xHi, Math.ceil(v.w), X, Y, v.h);
  else if (c.type === "fny") lines = sampleFn(c.f, v.yLo, v.yHi, Math.ceil(v.h), Y, X, v.w).map((l) => l.map(([a, b]) => [b, a]));
  else lines = sampleParam(c.fx, c.fy, c.t0, c.t1, v);
  const longest = lines.sort((a, b) => b.length - a.length)[0];
  if (!longest || longest.length < 2) return null;
  // keep only what is on screen, then thin to `max` points
  const inside = longest.filter(([a, b]) => a >= -2 && a <= v.w + 2 && b >= -2 && b <= v.h + 2);
  if (inside.length < 2) return null;
  const stepN = Math.max(1, Math.ceil(inside.length / max));
  const picked = inside.filter((_, i) => i % stepN === 0);
  if (picked[picked.length - 1] !== inside[inside.length - 1]) picked.push(inside[inside.length - 1]);
  const round = (n) => Math.round(n * 100) / 100;
  const points = picked.map(([a, b]) => { const m = toMath(a, b); return { x: round(m.x), y: round(m.y) }; });
  const f = points[0], l = points[points.length - 1];
  const closed = c.type === "param" && Math.hypot(f.x - l.x, f.y - l.y) < 1e-6 + (v.xHi - v.xLo) / 200;
  if (closed) points.pop();
  return { points, closed };
}

export { toPx };
