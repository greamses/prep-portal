/* ============================================================================
   Cartesian Art — pinch / wheel zoom + pan
   ----------------------------------------------------------------------------
   The coordinate window can be zoomed and panned so kids can work close-up on a
   detail or pull back to see a ±100 picture whole:
     • Wheel / trackpad — zoom about the pointer.
     • Two-finger pinch — zoom about the midpoint, with the spread; drag the two
       fingers together to pan.
   Both drive state.setView (clamped to ±GRID_MAX). We deliberately DON'T capture
   the pointers, so the plot/paint layers still see single-finger taps; isGesturing()
   lets the tap-to-park handler bail while two fingers are down.
   ========================================================================== */

import { state, setView } from "./state.js";
import { layout } from "./grid.js";

const pointers = new Map(); // pointerId → { x, y } (client coords)
let gesture = null; // active pinch snapshot
let panMode = false; // dedicated drag-to-pan tool
let spaceDown = false; // hold Space to pan on desktop
let pan = null; // active single-pointer pan snapshot

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

/** Apply a centred view of the given spans. */
function applyView(cx, cy, sx, sy) {
  setView(cx - sx / 2, cx + sx / 2, cy - sy / 2, cy + sy / 2);
}

/* ── pinch zoom (about the pointer) ─────────────────────────────────────────
   Only a pinch gesture zooms — on a trackpad the browser delivers that as a
   wheel event with ctrlKey set. A plain scroll is left alone so the page can
   scroll normally; touchscreens use the two-finger pinch handler below. */
function onWheel(e, stage) {
  if (!e.ctrlKey) return; // plain scroll → let the page scroll
  e.preventDefault();
  const factor = e.deltaY > 0 ? 1.08 : 1 / 1.08; // down = zoom out
  // math point under the cursor (anchor)
  const r = stage.getBoundingClientRect();
  const px = e.clientX - r.left;
  const py = e.clientY - r.top;
  const ax = (px - layout.ox) / layout.unit;
  const ay = (layout.oy - py) / layout.unit;

  const nsx = spanX() * factor;
  const nsy = spanY() * factor;
  // keep the anchor fixed: shift centre toward/away from it
  const ncx = ax + (centerX() - ax) * factor;
  const ncy = ay + (centerY() - ay) * factor;
  applyView(ncx, ncy, nsx, nsy);
}

/* ── pinch ──────────────────────────────────────────────────────────────── */
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
  gesture = {
    startDist: dist(),
    startMid: mid,
    startCx: centerX(),
    startCy: centerY(),
    startSx: spanX(),
    startSy: spanY(),
    unit: layout.unit || 1,
    // anchor math point under the starting midpoint
    ax: (mid.x - r.left - layout.ox) / layout.unit,
    ay: (layout.oy - (mid.y - r.top)) / layout.unit,
  };
}

function updateGesture() {
  if (!gesture) return;
  const scale = dist() / gesture.startDist; // >1 = fingers spreading = zoom in
  const nsx = gesture.startSx / scale;
  const nsy = gesture.startSy / scale;
  // zoom about the anchor
  let ncx = gesture.ax + (gesture.startCx - gesture.ax) / scale;
  let ncy = gesture.ay + (gesture.startCy - gesture.ay) / scale;
  // pan with the midpoint drift
  const mid = midClient();
  ncx += -(mid.x - gesture.startMid.x) / gesture.unit;
  ncy += (mid.y - gesture.startMid.y) / gesture.unit;
  applyView(ncx, ncy, nsx, nsy);
}

/* ── single-pointer pan (pan tool / Space-drag) ─────────────────────────── */
function startPan(e) {
  pan = {
    x: e.clientX, y: e.clientY,
    cx: centerX(), cy: centerY(),
    unit: layout.unit || 1,
  };
}
function updatePan(e) {
  if (!pan) return;
  const ncx = pan.cx - (e.clientX - pan.x) / pan.unit;
  const ncy = pan.cy + (e.clientY - pan.y) / pan.unit;
  applyView(ncx, ncy, spanX(), spanY());
}

export function initZoom(stage) {
  if (!stage) return;

  stage.addEventListener("wheel", (e) => onWheel(e, stage), { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    // drag-to-pan (pan tool or Space held) — works for mouse and one finger
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
    if (pointers.size >= 2) {
      e.preventDefault();
      updateGesture();
    }
  });

  const drop = (e) => {
    if (pan) pan = null;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) gesture = null;
  };
  stage.addEventListener("pointerup", drop);
  stage.addEventListener("pointercancel", drop);
  stage.addEventListener("pointerleave", drop);

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
