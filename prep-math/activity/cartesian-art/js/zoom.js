/* ============================================================================
   Cartesian Art — pan / zoom (Desmos-style)
   ----------------------------------------------------------------------------
     • Drag the background        → pan.
     • Drag directly on an axis    → stretch ONLY that axis (the grabbed value
                                     follows the cursor; the origin stays fixed).
     • Scroll wheel                → zoom about the pointer.
     • Two-finger pinch            → zoom (+ pan with the midpoint).
     • Click without dragging      → drop the cursor there (plot).
     • Double-click / double-tap    → add a point here (or remove one on it).
   Keyboard +/- zoom (zoomBy) and V/Space force-pan stay. Everything drives
   state.setView (clamped to ±GRID_MAX). The "V"/pan tool just forces a drag to
   pan even when it starts on an axis.
   ========================================================================== */

import { state, setView, setCursor, addPoint, deletePointAtCursor } from "./state.js";
import { layout, toPx, toMath, toLattice } from "./grid.js";

const pointers = new Map(); // touch pointers
let drag = null;            // active single-pointer interaction
let pinch = null;           // active two-finger gesture
let panMode = false;        // V / pan tool
let spaceDown = false;      // hold Space

const CLICK_TH = 5;   // px before a press becomes a drag
const AXIS_TOL = 24;  // px from an axis line that counts as "grabbing" it
const AXIS_MIN = 40;  // must be this far from the origin to grab an axis

export function isGesturing() { return !!pinch || (!!drag && drag.moved); }
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

/** Uniform zoom about the centre (keyboard +/-). */
export function zoomBy(factor) {
  applyView(centerX(), centerY(), spanX() * factor, spanY() * factor);
}

/** Zoom one axis only about its centre (keyboard x/y + +/-). */
export function zoomAxisBy(axis, factor) {
  const v = visible();
  if (axis === "x") {
    const c = (v.xLo + v.xHi) / 2, s = (v.xHi - v.xLo) * factor;
    setView(c - s / 2, c + s / 2, v.yLo, v.yHi, false);
  } else {
    const c = (v.yLo + v.yHi) / 2, s = (v.yHi - v.yLo) * factor;
    setView(v.xLo, v.xHi, c - s / 2, c + s / 2, false);
  }
}

/** Which axis a stage-pixel sits on (away from the origin), or null. */
function axisAt(px, py) {
  const o = toPx(0, 0);
  if (Math.abs(py - o.y) <= AXIS_TOL && Math.abs(px - o.x) > AXIS_MIN) return "x";
  if (Math.abs(px - o.x) <= AXIS_TOL && Math.abs(py - o.y) > AXIS_MIN) return "y";
  return null;
}

/* ── wheel: plain scroll pans, Ctrl/⌘ + scroll zooms about the pointer ───── */
function onWheel(e, stage) {
  e.preventDefault();
  const r = stage.getBoundingClientRect();
  const px = e.clientX - r.left, py = e.clientY - r.top;

  if (e.ctrlKey || e.metaKey) {
    const factor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
    const ax = (px - layout.ox) / layout.unitX;
    const ay = (layout.oy - py) / layout.unitY;
    applyView(ax + (centerX() - ax) * factor, ay + (centerY() - ay) * factor,
      spanX() * factor, spanY() * factor);
    return;
  }
  // plain scroll → pan
  applyView(centerX() + e.deltaX / layout.unitX, centerY() - e.deltaY / layout.unitY,
    spanX(), spanY());
}

/* ── single-pointer drag: pan or axis-stretch ───────────────────────────── */
function beginDrag(e, stage) {
  const r = stage.getBoundingClientRect();
  const px = e.clientX - r.left, py = e.clientY - r.top;
  const axis = isPanMode() ? null : axisAt(px, py);
  drag = {
    id: e.pointerId, axis, moved: false,
    sx0: e.clientX, sy0: e.clientY,
    left: r.left, top: r.top,
    ox: layout.ox, oy: layout.oy, ux: layout.unitX, uy: layout.unitY,
    v: visible(), cx: centerX(), cy: centerY(), spanx: spanX(), spany: spanY(),
    X0: axis === "x" ? (px - layout.ox) / layout.unitX : 0,
    Y0: axis === "y" ? (layout.oy - py) / layout.unitY : 0,
  };
  stage.setPointerCapture?.(e.pointerId);
}

function panDrag(dx, dy) {
  applyView(drag.cx - dx / drag.ux, drag.cy + dy / drag.uy, drag.spanx, drag.spany);
}

function axisDragX(px) {
  const ux2 = (px - drag.ox) / drag.X0; // keep grabbed value under the cursor
  if (!isFinite(ux2) || ux2 <= 0) return;
  const span = (layout.w - 2 * layout.pad) / ux2;
  const xMin = (layout.pad - drag.ox) / ux2; // keeps the origin pixel fixed
  setView(xMin, xMin + span, drag.v.yLo, drag.v.yHi, false);
}
function axisDragY(py) {
  const uy2 = (drag.oy - py) / drag.Y0;
  if (!isFinite(uy2) || uy2 <= 0) return;
  const span = (layout.h - 2 * layout.pad) / uy2;
  const yMin = (drag.oy - (layout.h - layout.pad)) / uy2;
  setView(drag.v.xLo, drag.v.xHi, yMin, yMin + span, false);
}

/* ── two-finger pinch (zoom + pan) ──────────────────────────────────────── */
function startPinch() {
  const [a, b] = [...pointers.values()];
  pinch = {
    startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
    startMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    ux: layout.unitX, uy: layout.unitY,
    cx: centerX(), cy: centerY(), spanx: spanX(), spany: spanY(),
  };
}
function updatePinch() {
  const [a, b] = [...pointers.values()];
  const scale = (Math.hypot(a.x - b.x, a.y - b.y) || 1) / pinch.startDist;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  applyView(
    pinch.cx - (mid.x - pinch.startMid.x) / pinch.ux,
    pinch.cy + (mid.y - pinch.startMid.y) / pinch.uy,
    pinch.spanx / scale, pinch.spany / scale
  );
}

function clickPlace(e, stage) {
  if (stage.classList.contains("ca-painting")) return;
  const r = stage.getBoundingClientRect();
  const l = toLattice(e.clientX - r.left, e.clientY - r.top);
  setCursor(l.x, l.y);
}

/* Double-click / double-tap: drop a point here, or remove the one already on
   this lattice cell. Snaps to the lattice first so it lands exactly on grid. */
function toggleAt(clientX, clientY, stage) {
  if (stage.classList.contains("ca-painting")) return;
  const r = stage.getBoundingClientRect();
  const l = toLattice(clientX - r.left, clientY - r.top);
  setCursor(l.x, l.y);
  if (!deletePointAtCursor()) addPoint();
}

/* Touch double-tap detection (browsers don't reliably fire dblclick on touch). */
let lastTap = 0, lastTapX = 0, lastTapY = 0;
function maybeDoubleTap(e, stage) {
  if (e.pointerType !== "touch") return;
  const now = Date.now();
  if (now - lastTap < 320 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 30) {
    lastTap = 0;
    toggleAt(e.clientX, e.clientY, stage);
  } else {
    lastTap = now; lastTapX = e.clientX; lastTapY = e.clientY;
  }
}

export function initZoom(stage) {
  if (!stage) return;

  stage.addEventListener("wheel", (e) => onWheel(e, stage), { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    if (stage.classList.contains("ca-painting")) return; // painting owns the pointer
    if (e.pointerType === "touch") {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size >= 2) { drag = null; startPinch(); return; }
    }
    beginDrag(e, stage);
  });

  stage.addEventListener("pointermove", (e) => {
    if (stage.classList.contains("ca-painting") && !drag && !pinch) return;
    if (pinch) {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size >= 2) { e.preventDefault(); updatePinch(); }
      return;
    }
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.sx0, dy = e.clientY - drag.sy0;
      if (!drag.moved && Math.hypot(dx, dy) < CLICK_TH) return;
      if (!drag.moved) {
        drag.moved = true;
        stage.style.cursor = drag.axis === "x" ? "ew-resize" : drag.axis === "y" ? "ns-resize" : "grabbing";
      }
      e.preventDefault();
      if (drag.axis === "x") axisDragX(e.clientX - drag.left);
      else if (drag.axis === "y") axisDragY(e.clientY - drag.top);
      else panDrag(dx, dy);
      return;
    }
    // hover (no active drag): show the axis-stretch cursor
    if (!isPanMode()) {
      const r = stage.getBoundingClientRect();
      const ax = axisAt(e.clientX - r.left, e.clientY - r.top);
      stage.style.cursor = ax === "x" ? "ew-resize" : ax === "y" ? "ns-resize" : "";
    }
  });

  const onUp = (e) => {
    if (pointers.has(e.pointerId)) pointers.delete(e.pointerId);
    if (pinch && pointers.size < 2) pinch = null;
    if (drag && e.pointerId === drag.id) {
      if (!drag.moved && !isPanMode()) {
        clickPlace(e, stage);
        maybeDoubleTap(e, stage); // touch: a quick second tap toggles a point
      }
      if (!isPanMode()) stage.style.cursor = "";
      drag = null;
    }
  };
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);

  // double-click: add a point here (or remove the one already on this cell).
  // A double-click directly on a marker is handled in points.js (delete by id).
  // Re-square the grid lives on the "0" key now.
  stage.addEventListener("dblclick", (e) => {
    if (stage.classList.contains("ca-painting")) return;
    if (e.target.closest(".ca-point")) return;
    toggleAt(e.clientX, e.clientY, stage);
  });

  // hold Space to pan
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
