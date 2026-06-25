/* ============================================================================
   Cartesian Art — transform mode (animated, with a ghost)
   ----------------------------------------------------------------------------
   The standard plane transformations applied to the ACTIVE shape, each one
   animated rigidly so kids can see the slide / flip / turn / resize happen.
   While transform mode is on:
     • a faint GHOST of the shape's starting position stays on the grid, and
     • keyboard arrows + the d-pad translate the shape, while the analog stick
       turns (left/right) and resizes (up/down) it — see controls.js.
   Every committed step lands as one undo entry (setActivePoints emits "points").
   ========================================================================== */

import { state, subscribe, activeShape, setActivePoints } from "./state.js";
import { layers, toPx, onRender } from "./grid.js";
import { redrawPoints } from "./points.js";

const SVGNS = "http://www.w3.org/2000/svg";
const DUR = 260; // ms

let ghostPts = null;   // captured outline (math) shown as the ghost
let animating = false;
let animId = null;     // id of the shape currently animating
let raf = 0;

function el(name, attrs = {}, parent = null) {
  const n = document.createElementNS(SVGNS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
function clear(g) { while (g && g.firstChild) g.removeChild(g.firstChild); }

function reducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isAnimatingActive(id) {
  return animating && id === animId;
}

/* ── op definitions: math point map + an animated screen transform ─────────── */
const OPS = {
  left:   { fn: (x, y) => ({ x: x - 1, y }),     frame: (e) => `translate(${-unit() * e} 0)` },
  right:  { fn: (x, y) => ({ x: x + 1, y }),     frame: (e) => `translate(${unit() * e} 0)` },
  up:     { fn: (x, y) => ({ x, y: y + 1 }),     frame: (e) => `translate(0 ${-unit() * e})` },
  down:   { fn: (x, y) => ({ x, y: y - 1 }),     frame: (e) => `translate(0 ${unit() * e})` },
  "flip-h": { fn: (x, y) => ({ x: -x, y }),      frame: (e) => about(`scale(${1 - 2 * e} 1)`) },
  "flip-v": { fn: (x, y) => ({ x, y: -y }),      frame: (e) => about(`scale(1 ${1 - 2 * e})`) },
  "rot-cw":  { fn: (x, y) => ({ x: y, y: -x }),  frame: (e) => rot(90 * e) },
  "rot-ccw": { fn: (x, y) => ({ x: -y, y: x }),  frame: (e) => rot(-90 * e) },
  bigger:  { fn: (x, y) => ({ x: x * 2, y: y * 2 }), frame: (e) => about(`scale(${1 + e})`) },
  smaller: { fn: (x, y) => ({ x: x / 2, y: y / 2 }), frame: (e) => about(`scale(${1 - 0.5 * e})`) },
};

function unit() { const a = toPx(0, 0), b = toPx(1, 0); return Math.abs(b.x - a.x) || 40; }
function about(t) { const o = toPx(0, 0); return `translate(${o.x} ${o.y}) ${t} translate(${-o.x} ${-o.y})`; }
function rot(deg) { const o = toPx(0, 0); return `rotate(${deg} ${o.x} ${o.y})`; }

function pathData(pts, closed) {
  const px = pts.map((p) => toPx(p.x, p.y));
  return "M " + px.map((p) => `${p.x} ${p.y}`).join(" L ") + (closed ? " Z" : "");
}

const easeOut = (k) => 1 - Math.pow(1 - k, 3);

/** Run a named transform on the active shape, animated. */
export function runOp(name) {
  const op = OPS[name];
  const s = activeShape();
  if (!op || !s.points.length || animating) return;

  const oldPts = s.points.map((p) => ({ x: p.x, y: p.y }));
  const newPts = oldPts.map((p) => {
    const n = op.fn(p.x, p.y);
    return { x: Math.round(n.x), y: Math.round(n.y) };
  });

  const commit = () => setActivePoints(newPts, s.closed);
  if (reducedMotion()) { commit(); return; }

  // draw the moving outline into the anim layer; hide the static active shape
  animating = true;
  animId = s.id;
  redrawPoints();
  const A = layers.anim;
  clear(A);
  const g = el("g", { class: "ca-anim-group" }, A);
  if (s.closed) {
    const f = el("path", { d: pathData(oldPts, true), class: "ca-shape-fill" }, g);
    if (s.fillColor) f.setAttribute("style", `fill:${s.fillColor}`);
  }
  const line = el("path", { d: pathData(oldPts, s.closed), class: "ca-shape-line" }, g);
  if (s.strokeColor) line.setAttribute("style", `stroke:${s.strokeColor}`);

  const start = performance.now();
  cancelAnimationFrame(raf);
  const step = (t) => {
    const k = Math.min(1, (t - start) / DUR);
    g.setAttribute("transform", op.frame(easeOut(k)));
    if (k < 1) { raf = requestAnimationFrame(step); }
    else {
      animating = false;
      animId = null;
      clear(A);
      commit(); // emits "points" → redraw shows the shape at its new home
    }
  };
  raf = requestAnimationFrame(step);
}

/* ── ghost ─────────────────────────────────────────────────────────────── */
function drawGhost() {
  const G = layers.tfghost; // dedicated layer (puzzle dots live on layers.ghost)
  if (!G) return;
  if (!state.ui.transformMode || !ghostPts || ghostPts.length < 2) {
    clear(G);
    return;
  }
  clear(G);
  const closed = activeShape().closed;
  el("path", { d: pathData(ghostPts, closed), class: "ca-tf-ghost" }, G);
  ghostPts.forEach((p) => {
    const q = toPx(p.x, p.y);
    el("circle", { cx: q.x, cy: q.y, r: 4, class: "ca-tf-ghost-dot" }, G);
  });
}

function captureGhost() {
  const s = activeShape();
  ghostPts = s.points.map((p) => ({ x: p.x, y: p.y }));
  drawGhost();
}

export function initTransformMode() {
  onRender(drawGhost); // ghost tracks zoom / pan / resize

  subscribe((reason) => {
    if (reason === "transform") {
      if (state.ui.transformMode) captureGhost();
      else { ghostPts = null; drawGhost(); }
    } else if (reason === "shapes" && state.ui.transformMode) {
      captureGhost(); // active shape changed → re-anchor the ghost
    } else if (reason === "grid") {
      drawGhost();
    } else if (reason === "puzzle") {
      ghostPts = null;
    }
  });
}
