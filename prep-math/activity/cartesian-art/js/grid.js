/* ============================================================================
   Cartesian Art — coordinate-plane renderer
   ----------------------------------------------------------------------------
   Draws the four-quadrant grid into an <svg> using *pixel* coordinates (not an
   SVG math-unit transform) so markers, labels and stroke widths stay crisp and
   never scale oddly. Exposes toPx()/toMath() so the mascot, points and paint
   layers in later phases share one mapping. Re-renders on container resize.
   ========================================================================== */

import { state, subscribe } from "./state.js";
import { niceStep, subStep, snapStep, snap, fmtShort } from "./scale.js";

const SVGNS = "http://www.w3.org/2000/svg";

/* Live layout, recomputed every render. Other modules read this. unitX/unitY
   are usually equal (square cells); they diverge only when the user zooms on a
   single axis line (non-uniform scaling, like a data-plot tool). `unit` is kept
   as an alias of unitX for older callers. */
export const layout = {
  w: 0,
  h: 0,
  pad: 34, // gutter for axis number labels
  unit: 40, // pixels per math unit (x)
  unitX: 40,
  unitY: 40,
  ox: 0, // origin x in px
  oy: 0, // origin y in px
};

let svg = null;
let stage = null;
export const layers = {}; // named <g> groups, back-to-front

/** Math → pixel. */
export function toPx(mx, my) {
  return { x: layout.ox + mx * layout.unitX, y: layout.oy - my * layout.unitY };
}

/** Pixel → math (unrounded). */
export function toMath(px, py) {
  return { x: (px - layout.ox) / layout.unitX, y: (layout.oy - py) / layout.unitY };
}

/** Pixel → nearest lattice point (snapped to the adaptive step, clamped). */
export function toLattice(px, py) {
  const m = toMath(px, py);
  const g = state.grid;
  const sx = snapStep(g.xMax - g.xMin);
  const sy = snapStep(g.yMax - g.yMin);
  return {
    x: Math.max(g.xMin, Math.min(g.xMax, snap(m.x, sx))),
    y: Math.max(g.yMin, Math.min(g.yMax, snap(m.y, sy))),
  };
}

/** Convert a clientX/clientY (e.g. from a pointer event) to math units. */
export function clientToMath(clientX, clientY) {
  const r = svg.getBoundingClientRect();
  // account for any SVG scaling between attribute size and CSS size
  const sx = layout.w / r.width;
  const sy = layout.h / r.height;
  return toMath((clientX - r.left) * sx, (clientY - r.top) * sy);
}

function el(name, attrs = {}, parent = null) {
  const n = document.createElementNS(SVGNS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

/** Build the SVG skeleton + named layer groups once. */
export function initGrid(stageEl) {
  stage = stageEl;
  svg = el("svg", { class: "ca-svg", "aria-hidden": "true" });
  stage.appendChild(svg);

  // back-to-front draw order
  for (const name of ["grid", "axes", "ghost", "tfghost", "shape", "paint", "points", "anim", "mascot"]) {
    layers[name] = el("g", { class: `ca-layer ca-layer--${name}` }, svg);
  }

  const ro = new ResizeObserver(() => render());
  ro.observe(stage);
  window.addEventListener("resize", () => render());

  subscribe((reason) => {
    // grid window changes need a full re-measure; everything else just redraws
    render();
  });

  render();
  return { svg, layers };
}

/* Post-render hooks — mascot/points/paint layers reposition after each measure
   (so they track resizes and grid-window changes, not just state edits). */
const renderCallbacks = new Set();
export function onRender(fn) {
  renderCallbacks.add(fn);
  return () => renderCallbacks.delete(fn);
}

/** Recompute layout from the container size + current grid window. */
function measure() {
  const rect = stage.getBoundingClientRect();
  const w = Math.max(240, Math.round(rect.width));
  const h = Math.max(240, Math.round(rect.height));
  layout.w = w;
  layout.h = h;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("width", w);
  svg.setAttribute("height", h);

  const g = state.grid;
  const spanX = g.xMax - g.xMin;
  const spanY = g.yMax - g.yMin;
  const pad = layout.pad;

  if (g.lockAspect === false) {
    // non-uniform: each axis fills its dimension independently (per-axis zoom)
    layout.unitX = (w - pad * 2) / spanX;
    layout.unitY = (h - pad * 2) / spanY;
    layout.ox = pad - g.xMin * layout.unitX;
    layout.oy = (h - pad) + g.yMin * layout.unitY;
  } else {
    // square cells: pick the limiting axis, centre the window (grid fills the
    // rest via edge-to-edge lines in drawGrid)
    const unit = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY);
    layout.unitX = layout.unitY = unit;
    const plotW = unit * spanX;
    const plotH = unit * spanY;
    layout.ox = (w - plotW) / 2 - g.xMin * unit;
    layout.oy = (h - plotH) / 2 + g.yMax * unit;
  }
  layout.unit = layout.unitX;
}

function clear(g) {
  while (g.firstChild) g.removeChild(g.firstChild);
}

/** Format a tick value to the precision implied by its step (no float noise). */
function fmtTick(v, step) {
  const d = step < 1 ? Math.min(6, Math.ceil(-Math.log10(step) - 1e-9)) : 0;
  return Number(v.toFixed(d)).toString();
}

/** A tick label: compact text, full value on hover. */
function tick(parent, x, y, cls, v, step) {
  const t = el("text", { x, y, class: cls }, parent);
  t.textContent = fmtShort(v);
  el("title", {}, t).textContent = fmtTick(v, step);
}

const MAX_LINES = 800; // hard cap so an extreme zoom can never lock up the page

/** Vertical lines at every multiple of `step` spanning the full stage height. */
function gridLinesX(parent, step, cls, xLo, xHi) {
  if (!(step > 0) || !isFinite(xLo) || !isFinite(xHi)) return;
  let k = Math.ceil(xLo / step), n = 0;
  for (; k * step <= xHi && n < MAX_LINES; k++, n++) {
    const x = k * step;
    if (x === 0) continue;
    const px = toPx(x, 0).x;
    el("line", { x1: px, y1: 0, x2: px, y2: layout.h, class: cls }, parent);
  }
}
/** Horizontal lines at every multiple of `step` spanning the full stage width. */
function gridLinesY(parent, step, cls, yLo, yHi) {
  if (!(step > 0) || !isFinite(yLo) || !isFinite(yHi)) return;
  let k = Math.ceil(yLo / step), n = 0;
  for (; k * step <= yHi && n < MAX_LINES; k++, n++) {
    const y = k * step;
    if (y === 0) continue;
    const py = toPx(0, y).y;
    el("line", { x1: 0, y1: py, x2: layout.w, y2: py, class: cls }, parent);
  }
}

const cap = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Draw gridlines + axes + tick labels. The grid fills the ENTIRE stage (lines
 *  extend past the coordinate window to the viewport edges — no white margins);
 *  the window just sets the scale + centring. */
function drawGrid() {
  const g = state.grid;
  const G = layers.grid;
  const A = layers.axes;
  clear(G);
  clear(A);

  const w = layout.w, h = layout.h;
  // math span actually visible in the stage rectangle
  const xLo = toMath(0, 0).x, xHi = toMath(w, 0).x;
  const yLo = toMath(0, h).y, yHi = toMath(0, 0).y;

  // independent steps per axis (they differ only under non-uniform zoom)
  const majorX = niceStep(g.xMax - g.xMin);
  const majorY = niceStep(g.yMax - g.yMin);
  const minorX = subStep(majorX);
  const minorY = subStep(majorY);

  // inner (minor) gridlines first, then the major lines over them
  gridLinesX(G, minorX, "ca-grid-line ca-grid-line--minor", xLo, xHi);
  gridLinesY(G, minorY, "ca-grid-line ca-grid-line--minor", yLo, yHi);
  gridLinesX(G, majorX, "ca-grid-line", xLo, xHi);
  gridLinesY(G, majorY, "ca-grid-line", yLo, yHi);

  // axes span the full stage; arrowheads sit at the viewport edges
  const axisY = toPx(0, 0).y; // pixel y of the x-axis
  const axisX = toPx(0, 0).x; // pixel x of the y-axis
  const xAxisOn = axisY >= 0 && axisY <= h;
  const yAxisOn = axisX >= 0 && axisX <= w;
  if (xAxisOn) {
    el("line", { x1: 0, y1: axisY, x2: w, y2: axisY, class: "ca-axis" }, A);
    drawArrow(A, { x: w - 2, y: axisY }, "x+");
    drawArrow(A, { x: 2, y: axisY }, "x-");
  }
  if (yAxisOn) {
    el("line", { x1: axisX, y1: 0, x2: axisX, y2: h, class: "ca-axis" }, A);
    drawArrow(A, { x: axisX, y: 2 }, "y+");
    drawArrow(A, { x: axisX, y: h - 2 }, "y-");
  }

  // tick labels (on major lines only); when an axis is panned off-screen, pin
  // the labels to the nearest edge so the numbers stay readable
  if (state.ui.showLabels) {
    const labelY = cap(axisY, 14, h - 6);
    const labelX = cap(axisX, 16, w - 4);
    for (let k = Math.ceil(xLo / majorX), n = 0; k * majorX <= xHi && n < MAX_LINES; k++, n++) {
      const x = k * majorX;
      if (x === 0) continue;
      const px = toPx(x, 0).x;
      tick(A, px, labelY + 16, "ca-tick", x, majorX);
    }
    for (let k = Math.ceil(yLo / majorY), n = 0; k * majorY <= yHi && n < MAX_LINES; k++, n++) {
      const y = k * majorY;
      if (y === 0) continue;
      const py = toPx(0, y).y;
      tick(A, labelX - 9, py + 4, "ca-tick ca-tick--y", y, majorY);
    }
    if (xAxisOn && yAxisOn) {
      el("text", { x: axisX - 9, y: axisY + 16, class: "ca-tick ca-tick--o" }, A).textContent = "0";
    }
  }
}

function drawArrow(parent, p, dir) {
  const s = 7; // arrow size
  let pts;
  if (dir === "x+") pts = `${p.x},${p.y} ${p.x - s},${p.y - s} ${p.x - s},${p.y + s}`;
  else if (dir === "x-") pts = `${p.x},${p.y} ${p.x + s},${p.y - s} ${p.x + s},${p.y + s}`;
  else if (dir === "y+") pts = `${p.x},${p.y} ${p.x - s},${p.y + s} ${p.x + s},${p.y + s}`;
  else pts = `${p.x},${p.y} ${p.x - s},${p.y - s} ${p.x + s},${p.y - s}`;
  el("polygon", { points: pts, class: "ca-axis-arrow" }, parent);
}

let raf = 0;
export function render() {
  if (!svg) return;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    measure();
    drawGrid();
    for (const fn of renderCallbacks) fn();
  });
}
