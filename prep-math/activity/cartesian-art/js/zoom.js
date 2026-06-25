/* ============================================================================
   Cartesian Art — pinch / wheel zoom + pan (+ per-axis zoom)
   ----------------------------------------------------------------------------
   Zoom + pan the coordinate window:
     • Pinch (trackpad pinch = ctrl+wheel; touchscreen two-finger) — zoom about
       the pointer; plain scroll is left alone.
     • Drag-to-pan (pan tool / hold Space) and two-finger pan.
     • Zooming ON an axis line scales ONLY that axis (non-uniform, like a data
       plot). Double-click empty canvas snaps back to square cells.
   Everything drives state.setView (clamped to ±GRID_MAX). We don't capture the
   pointers, so taps still reach the plot/paint layers; isGesturing() lets the
   tap-to-park handler bail while a gesture/pan is in progress.
   ========================================================================== */

import { state, setView, squareView } from "./state.js";
import { layout, toPx, toMath } from "./grid.js";

const pointers = new Map(); // pointerId → { x, y } (client coords)
let gesture = null; // active pinch snapshot
let panMode = false; // dedicated drag-to-pan tool
let spaceDown = false; // hold Space to pan on desktop
let pan = null; // active single-pointer pan snapshot

const AXIS_TOL = 16; // px from an axis line that counts as "on the axis"

export function isGesturing() {
  return pointers.size >= 2 || !!pan;
}
export function isPanMode() {
  return panMode || spaceDown;
}
export function setPanMode(on) {
  panMode = !!on;
  const stage = document.querySelector("#ca-stage");
  if (stage) stage.classList.toggle("ca-pan-ready", isPanMode());
}

function spanX() { return state.grid.xMax - state.grid.xMin; }
function spanY() { return state.grid.yMax - state.grid.yMin; }
function centerX() { return (state.grid.xMax + state.grid.xMin) / 2; }
function centerY() { return (state.grid.yMax + state.grid.yMin) / 2; }

function applyView(cx, cy, sx, sy) {
  setView(cx - sx / 2, cx + sx / 2, cy - sy / 2, cy + sy / 2);
}

/** Math bounds currently visible in the stage rectangle. */
function visible() {
  const a = toMath(0, 0), b = toMath(layout.w, layout.h);
  return {
    xLo: Math.min(a.x, b.x), xHi: Math.max(a.x, b.x),
    yLo: Math.min(a.y, b.y), yHi: Math.max(a.y, b.y),
  };
}

/** Which axis line (if any) a stage-pixel point sits on. */
function axisAt(px, py) {
  const o = toPx(0, 0);
  const onX = Math.abs(py - o.y) <= AXIS_TOL; // near the horizontal x-axis
  const onY = Math.abs(px - o.x) <= AXIS_TOL; // near the vertical y-axis
  if (onX && !onY) return "x";
  if (onY && !onX) return "y";
  return null; // origin (both) or open canvas (neither) → uniform zoom
}

/** Scale a single axis about an anchor (keeps the other axis fixed). */
function axisZoom(axis, factor, px, py) {
  const v = visible();
  const m = toMath(px, py);
  if (axis === "x") {
    const s = (v.xHi - v.xLo) * factor;
    const f = (m.x - v.xLo) / (v.xHi - v.xLo);
    const lo = m.x - f * s;
    setView(lo, lo + s, v.yLo, v.yHi, false);
  } else {
    const s = (v.yHi - v.yLo) * factor;
    const f = (m.y - v.yLo) / (v.yHi - v.yLo);
    const lo = m.y - f * s;
    setView(v.xLo, v.xHi, lo, lo + s, false);
  }
}

/* ── pinch zoom via wheel (trackpad) ────────────────────────────────────── */
function onWheel(e, stage) {
  if (!e.ctrlKey) return; // plain scroll → let the page scroll
  e.preventDefault();
  const factor = e.deltaY > 0 ? 1.08 : 1 / 1.08; // down = zoom out
  const r = stage.getBoundingClientRect();
  const px = e.clientX - r.left;
  const py = e.clientY - r.top;

  const axis = axisAt(px, py);
  if (axis) { axisZoom(axis, factor, px, py); return; }

  // uniform: keep the anchor fixed
  const ax = (px - layout.ox) / layout.unitX;
  const ay = (layout.oy - py) / layout.unitY;
  applyView(ax + (centerX() - ax) * factor, ay + (centerY() - ay) * factor,
    spanX() * factor, spanY() * factor);
}

/* ── two-finger pinch ───────────────────────────────────────────────────── */
function midClient() {
  const [a, b] = [...pointers.values()];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function dist() {
  const [a, b] = [...pointers.values()];
  return Math.hypot(a.x - b.x, a.y - b.y) || 1;
}

function startGesture(stage) {
  const r = stage.getBoundingClientRect();
  const mid = midClient();
  const px = mid.x - r.left, py = mid.y - r.top;
  gesture = {
    startDist: dist(),
    startMid: mid,
    axis: axisAt(px, py),
    v: visible(),
    startCx: centerX(), startCy: centerY(),
    startSx: spanX(), startSy: spanY(),
    unitX: layout.unitX || 1, unitY: layout.unitY || 1,
    ax: (px - layout.ox) / layout.unitX,
    ay: (layout.oy - py) / layout.unitY,
  };
}

function updateGesture() {
  if (!gesture) return;
  const scale = dist() / gesture.startDist; // >1 = spreading = zoom in
  const v = gesture.v;
  if (gesture.axis === "x") {
    const s = (v.xHi - v.xLo) / scale;
    const f = (gesture.ax - v.xLo) / (v.xHi - v.xLo);
    const lo = gesture.ax - f * s;
    setView(lo, lo + s, v.yLo, v.yHi, false);
    return;
  }
  if (gesture.axis === "y") {
    const s = (v.yHi - v.yLo) / scale;
    const f = (gesture.ay - v.yLo) / (v.yHi - v.yLo);
    const lo = gesture.ay - f * s;
    setView(v.xLo, v.xHi, lo, lo + s, false);
    return;
  }
  // uniform: zoom about the anchor + pan with the midpoint drift
  let ncx = gesture.ax + (gesture.startCx - gesture.ax) / scale;
  let ncy = gesture.ay + (gesture.startCy - gesture.ay) / scale;
  const mid = midClient();
  ncx += -(mid.x - gesture.startMid.x) / gesture.unitX;
  ncy += (mid.y - gesture.startMid.y) / gesture.unitY;
  applyView(ncx, ncy, gesture.startSx / scale, gesture.startSy / scale);
}

/* ── single-pointer pan (pan tool / Space-drag) ─────────────────────────── */
function startPan(e) {
  pan = {
    x: e.clientX, y: e.clientY,
    cx: centerX(), cy: centerY(),
    unitX: layout.unitX || 1, unitY: layout.unitY || 1,
  };
}
function updatePan(e) {
  if (!pan) return;
  applyView(
    pan.cx - (e.clientX - pan.x) / pan.unitX,
    pan.cy + (e.clientY - pan.y) / pan.unitY,
    spanX(), spanY()
  );
}

export function initZoom(stage) {
  if (!stage) return;

  stage.addEventListener("wheel", (e) => onWheel(e, stage), { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    if (isPanMode() && pointers.size === 0) {
      startPan(e);
      stage.setPointerCapture?.(e.pointerId);
      e.preventDefault();
      return;
    }
    if (e.pointerType !== "touch") return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) { pan = null; startGesture(stage); }
  });

  stage.addEventListener("pointermove", (e) => {
    if (pan) { e.preventDefault(); updatePan(e); return; }
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size >= 2) { e.preventDefault(); updateGesture(); }
  });

  const drop = (e) => {
    if (pan) pan = null;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) gesture = null;
  };
  stage.addEventListener("pointerup", drop);
  stage.addEventListener("pointercancel", drop);
  stage.addEventListener("pointerleave", drop);

  // double-click empty canvas → back to square cells
  stage.addEventListener("dblclick", (e) => {
    if (e.target.closest(".ca-point")) return; // that's a point delete
    if (state.grid.lockAspect === false) squareView();
  });

  // hold Space to pan on desktop
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !spaceDown && !isTyping(e.target)) {
      spaceDown = true;
      stage.classList.add("ca-pan-ready");
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      spaceDown = false;
      stage.classList.toggle("ca-pan-ready", panMode);
    }
  });
}

function isTyping(t) {
  return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT" || t.isContentEditable);
}
