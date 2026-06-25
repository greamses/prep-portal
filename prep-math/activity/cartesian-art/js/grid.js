/* ============================================================================
   Cartesian Art — coordinate-plane renderer
   ----------------------------------------------------------------------------
   Draws the four-quadrant grid into an <svg> using *pixel* coordinates (not an
   SVG math-unit transform) so markers, labels and stroke widths stay crisp and
   never scale oddly. Exposes toPx()/toMath() so the mascot, points and paint
   layers in later phases share one mapping. Re-renders on container resize.
   ========================================================================== */

import { state, subscribe } from "./state.js";

const SVGNS = "http://www.w3.org/2000/svg";

/* Live layout, recomputed every render. Other modules read this. */
export const layout = {
  w: 0,
  h: 0,
  pad: 34, // gutter for axis number labels
  unit: 40, // pixels per math unit
  ox: 0, // origin x in px
  oy: 0, // origin y in px
};

let svg = null;
let stage = null;
export const layers = {}; // named <g> groups, back-to-front

/** Math → pixel. */
export function toPx(mx, my) {
  return { x: layout.ox + mx * layout.unit, y: layout.oy - my * layout.unit };
}

/** Pixel → math (unrounded). */
export function toMath(px, py) {
  return { x: (px - layout.ox) / layout.unit, y: (layout.oy - py) / layout.unit };
}

/** Pixel → nearest lattice point (rounded, clamped to the grid window). */
export function toLattice(px, py) {
  const m = toMath(px, py);
  const g = state.grid;
  return {
    x: Math.max(g.xMin, Math.min(g.xMax, Math.round(m.x))),
    y: Math.max(g.yMin, Math.min(g.yMax, Math.round(m.y))),
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
  // square cells: pick the limiting axis
  const unit = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY);
  layout.unit = unit;
  // centre the plane in the stage
  const plotW = unit * spanX;
  const plotH = unit * spanY;
  layout.ox = (w - plotW) / 2 - g.xMin * unit;
  layout.oy = (h - plotH) / 2 + g.yMax * unit;
}

function clear(g) {
  while (g.firstChild) g.removeChild(g.firstChild);
}

/** A "nice" gridline spacing (1, 2, 5 ×10ⁿ) aiming for ~target divisions. */
function niceStep(span, target = 14) {
  const raw = span / target;
  const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = raw / pow;
  let step;
  if (n < 1.5) step = 1;
  else if (n < 3) step = 2;
  else if (n < 7) step = 5;
  else step = 10;
  return Math.max(1, step * pow);
}

/** Sub-step for the fainter "inner" gridlines drawn between labelled lines. */
function subStep(major) {
  if (major <= 1) return 0; // already at integer resolution — no inner grid
  if (major % 5 === 0) return major / 5;
  if (major % 4 === 0) return major / 4;
  if (major % 2 === 0) return major / 2;
  return 0;
}

/** Vertical/horizontal lines at every multiple of `step` within [lo,hi]. */
function gridLinesX(parent, step, cls, g) {
  if (step <= 0) return;
  for (let k = Math.ceil(g.xMin / step); k * step <= g.xMax + 1e-9; k++) {
    const x = k * step;
    if (x === 0) continue;
    const a = toPx(x, g.yMin), b = toPx(x, g.yMax);
    el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: cls }, parent);
  }
}
function gridLinesY(parent, step, cls, g) {
  if (step <= 0) return;
  for (let k = Math.ceil(g.yMin / step); k * step <= g.yMax + 1e-9; k++) {
    const y = k * step;
    if (y === 0) continue;
    const a = toPx(g.xMin, y), b = toPx(g.xMax, y);
    el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: cls }, parent);
  }
}

/** Draw gridlines + axes + tick labels. */
function drawGrid() {
  const g = state.grid;
  const G = layers.grid;
  const A = layers.axes;
  clear(G);
  clear(A);

  const major = niceStep(Math.max(g.xMax - g.xMin, g.yMax - g.yMin));
  const minor = subStep(major);

  // inner (minor) gridlines first, then the major lines over them
  gridLinesX(G, minor, "ca-grid-line ca-grid-line--minor", g);
  gridLinesY(G, minor, "ca-grid-line ca-grid-line--minor", g);
  gridLinesX(G, major, "ca-grid-line", g);
  gridLinesY(G, major, "ca-grid-line", g);

  // the two axes themselves
  el("line", {
    x1: toPx(g.xMin, 0).x, y1: toPx(g.xMin, 0).y,
    x2: toPx(g.xMax, 0).x, y2: toPx(g.xMax, 0).y, class: "ca-grid-axisline",
  }, G);
  el("line", {
    x1: toPx(0, g.yMin).x, y1: toPx(0, g.yMin).y,
    x2: toPx(0, g.yMax).x, y2: toPx(0, g.yMax).y, class: "ca-grid-axisline",
  }, G);

  // axes (drawn over gridlines, with arrowheads)
  const left = toPx(g.xMin, 0);
  const right = toPx(g.xMax, 0);
  const top = toPx(0, g.yMax);
  const bottom = toPx(0, g.yMin);
  el("line", { x1: left.x, y1: left.y, x2: right.x, y2: right.y, class: "ca-axis" }, A);
  el("line", { x1: bottom.x, y1: bottom.y, x2: top.x, y2: top.y, class: "ca-axis" }, A);
  drawArrow(A, right, "x+");
  drawArrow(A, left, "x-");
  drawArrow(A, top, "y+");
  drawArrow(A, bottom, "y-");

  // tick labels (on major lines only)
  if (state.ui.showLabels) {
    for (let k = Math.ceil(g.xMin / major); k * major <= g.xMax + 1e-9; k++) {
      const x = k * major;
      if (x === 0) continue;
      const p = toPx(x, 0);
      el("text", { x: p.x, y: p.y + 16, class: "ca-tick" }, A).textContent = String(x);
    }
    for (let k = Math.ceil(g.yMin / major); k * major <= g.yMax + 1e-9; k++) {
      const y = k * major;
      if (y === 0) continue;
      const p = toPx(0, y);
      el("text", { x: p.x - 9, y: p.y + 4, class: "ca-tick ca-tick--y" }, A).textContent = String(y);
    }
    // origin
    const o = toPx(0, 0);
    el("text", { x: o.x - 9, y: o.y + 16, class: "ca-tick ca-tick--o" }, A).textContent = "0";
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
