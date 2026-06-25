/* ============================================================================
   Cartesian Art — pan / zoom (wheel, pinch, per-axis)
   ----------------------------------------------------------------------------
   • Wheel / trackpad scroll PANS the graph; Ctrl/⌘ + wheel (or trackpad pinch)
     ZOOMS about the pointer.
   • Two-finger touch:
       – hold one finger still and slide the other → scale a SINGLE axis
         (slide up/down = grow/shrink the y-axis; right/left = grow/shrink x),
         anchored on the still finger.
       – move both fingers (pinch) → uniform zoom of all axes.
   • Drag-to-pan tool / hold-Space also pan. Everything drives state.setView
     (clamped to ±GRID_MAX). Pointers aren't captured, so taps still reach the
     plot/paint layers; isGesturing() lets tap-to-park bail mid-gesture.
   ========================================================================== */

import { state, setView, squareView } from "./state.js";
import { layout, toPx, toMath } from "./grid.js";

const pointers = new Map(); // pointerId → { x, y } (client coords)
let gesture = null;
let panMode = false;
let spaceDown = false;
let pan = null;

const MOVE_TH = 9;   // px a finger must travel to count as "moving"
const AXIS_SENS = 170; // px of finger travel to double/halve an axis

export function isGesturing() { return pointers.size >= 2 || !!pan; }
export function isPanMode() { return panMode || spaceDown; }
export function setPanMode(on) {
  panMode = !!on;
  const stage = document.querySelector("#ca-stage");
  if (stage) stage.classList.toggle("ca-pan-ready", isPanMode());
}

function spanX() { return state.grid.xMax - state.grid.xMin; }
function spanY() { return state.grid.yMax - state.grid.yMin; }
function centerX() { return (state.grid.xMax + state.grid.xMin) / 2; }
function centerY() { return (state.grid.yMax + state.grid.yMin) / 2; }

function applyView(cx, cy, sx, sy, lock) {
  setView(cx - sx / 2, cx + sx / 2, cy - sy / 2, cy + sy / 2, lock);
}

function visible() {
  const a = toMath(0, 0), b = toMath(layout.w, layout.h);
  return {
    xLo: Math.min(a.x, b.x), xHi: Math.max(a.x, b.x),
    yLo: Math.min(a.y, b.y), yHi: Math.max(a.y, b.y),
  };
}

/** Scale one axis by `factor` about a fixed math anchor, using a start window. */
function scaleAxis(axis, factor, anchor, v) {
  if (axis === "x") {
    const span = (v.xHi - v.xLo) * factor;
    const f = (anchor - v.xLo) / (v.xHi - v.xLo);
    const lo = anchor - f * span;
    setView(lo, lo + span, v.yLo, v.yHi, false);
  } else {
    const span = (v.yHi - v.yLo) * factor;
    const f = (anchor - v.yLo) / (v.yHi - v.yLo);
    const lo = anchor - f * span;
    setView(v.xLo, v.xHi, lo, lo + span, false);
  }
}

/** Uniform zoom about the centre (keyboard +/-). */
export function zoomBy(factor) {
  applyView(centerX(), centerY(), spanX() * factor, spanY() * factor);
}

/* ── wheel: scroll = pan, Ctrl/⌘ + scroll = per-axis zoom ───────────────── */
function onWheel(e, stage) {
  e.preventDefault();
  const r = stage.getBoundingClientRect();
  const px = e.clientX - r.left, py = e.clientY - r.top;

  if (e.ctrlKey || e.metaKey) {
    // per-axis zoom by scroll direction, anchored on the pointer.
    // x: scroll right = grow (zoom in), left = shrink; y: up = grow, down = shrink.
    const v = visible();
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
      const factor = e.deltaX > 0 ? 1 / 1.08 : 1.08;
      scaleAxis("x", factor, (px - layout.ox) / layout.unitX, v);
    } else {
      const factor = e.deltaY < 0 ? 1 / 1.08 : 1.08;
      scaleAxis("y", factor, (layout.oy - py) / layout.unitY, v);
    }
    return;
  }
  // plain scroll → pan the graph
  applyView(centerX() + e.deltaX / layout.unitX, centerY() - e.deltaY / layout.unitY,
    spanX(), spanY());
}

/* ── two-finger gesture ─────────────────────────────────────────────────── */
function startGesture(stage) {
  const r = stage.getBoundingClientRect();
  const [[idA, a], [idB, b]] = [...pointers.entries()];
  gesture = {
    ids: [idA, idB],
    a0: { x: a.x, y: a.y }, b0: { x: b.x, y: b.y },
    left: r.left, top: r.top,
    ox: layout.ox, oy: layout.oy, ux: layout.unitX, uy: layout.unitY,
    v: visible(),
    startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
    startMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    cx: centerX(), cy: centerY(), sx: spanX(), sy: spanY(),
  };
}

function updateGesture() {
  if (!gesture) return;
  const a = pointers.get(gesture.ids[0]);
  const b = pointers.get(gesture.ids[1]);
  if (!a || !b) return;

  const dA = { x: a.x - gesture.a0.x, y: a.y - gesture.a0.y };
  const dB = { x: b.x - gesture.b0.x, y: b.y - gesture.b0.y };
  const mA = Math.hypot(dA.x, dA.y);
  const mB = Math.hypot(dB.x, dB.y);

  // both fingers moving → uniform zoom (pinch by distance), about the midpoint
  if (mA > MOVE_TH && mB > MOVE_TH) {
    const scale = (Math.hypot(a.x - b.x, a.y - b.y) || 1) / gesture.startDist;
    let ncx = gesture.cx, ncy = gesture.cy;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    ncx += -(mid.x - gesture.startMid.x) / gesture.ux;
    ncy += (mid.y - gesture.startMid.y) / gesture.uy;
    applyView(ncx, ncy, gesture.sx / scale, gesture.sy / scale); // leaves lock as-is
    return;
  }

  // one finger still, the other sliding → single-axis scale
  const mover = mA >= mB ? dA : dB;
  const still = mA >= mB ? gesture.b0 : gesture.a0;
  if (Math.max(mA, mB) < MOVE_TH) return; // nothing moved enough yet

  if (Math.abs(mover.y) >= Math.abs(mover.x)) {
    // vertical slide → y-axis. up (negative screen-y) grows the axis (zoom in)
    const factor = Math.exp(mover.y / AXIS_SENS);
    const anchorY = (gesture.oy - (still.y - gesture.top)) / gesture.uy;
    scaleAxis("y", factor, anchorY, gesture.v);
  } else {
    // horizontal slide → x-axis. right (positive screen-x) grows the axis
    const factor = Math.exp(-mover.x / AXIS_SENS);
    const anchorX = (still.x - gesture.left - gesture.ox) / gesture.ux;
    scaleAxis("x", factor, anchorX, gesture.v);
  }
}

/* ── single-pointer pan (pan tool / Space-drag) ─────────────────────────── */
function startPan(e) {
  pan = { x: e.clientX, y: e.clientY, cx: centerX(), cy: centerY(), ux: layout.unitX, uy: layout.unitY };
}
function updatePan(e) {
  if (!pan) return;
  applyView(pan.cx - (e.clientX - pan.x) / pan.ux, pan.cy + (e.clientY - pan.y) / pan.uy, spanX(), spanY());
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
    if (e.target.closest(".ca-point")) return;
    if (state.grid.lockAspect === false) squareView();
  });

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
