/* ============================================================================
   Cartesian Art — entry point
   ----------------------------------------------------------------------------
   Boots the studio: coordinate plane, mascot, point/outline layer, and the
   controls (keyboard + d-pad + analog). Keeps the coordinate readout and the
   point counter in sync, and shows a live hover coordinate over the plane.
   Painting, transforms, sharing and AI land in later phases.
   ========================================================================== */

import { state, subscribe, setCursor, allPoints } from "./state.js";
import { initGrid, clientToMath, toLattice } from "./grid.js";
import { initZoom, isGesturing, isPanMode, setPanMode } from "./zoom.js";
import { initShapesDock } from "./shapes-dock.js";
import { initTransformMode } from "./transform-mode.js";
import { initMascot } from "./mascot.js";
import { initPoints } from "./points.js";
import { initControls } from "./controls.js";
import { initPaint } from "./paint.js";
import { initToolRail } from "./tool-rail.js";
import { makeDraggable } from "./draggable.js";
import { initTransforms } from "./transforms.js";
import { initHistory } from "./history.js";
import { initPuzzleMode } from "./puzzle-mode.js";
import { initLibrary } from "./library.js";
import { initExport, loadFromUrl } from "./export.js";

const $ = (sel) => document.querySelector(sel);

function init() {
  const stage = $("#ca-stage");
  if (!stage) return;

  initGrid(stage);
  initMascot();
  initPoints();
  initControls(document);
  initPaint();
  initTransforms(document);
  initToolRail(document);
  initTransformMode();
  initPuzzleMode();
  initLibrary();
  initShapesDock();
  initZoom(stage);
  initExport();
  loadFromUrl(); // a shared ?#art= link rehydrates the drawing before baseline
  initHistory(); // last: baseline snapshot needs the brush bridge registered

  // ── readouts: cursor position + how many points dropped ────────────────
  const cx = $("#read-x");
  const cy = $("#read-y");
  const count = $("#read-count");
  const syncReadout = () => {
    if (cx) cx.textContent = state.cursor.x;
    if (cy) cy.textContent = state.cursor.y;
    if (count) count.textContent = allPoints().length;
  };
  subscribe(syncReadout);
  syncReadout();

  // ── hover coordinate preview over the plane ────────────────────────────
  const hov = $("#read-hover");
  stage.addEventListener("pointermove", (e) => {
    const m = clientToMath(e.clientX, e.clientY);
    const g = state.grid;
    if (m.x < g.xMin - 0.5 || m.x > g.xMax + 0.5 || m.y < g.yMin - 0.5 || m.y > g.yMax + 0.5) {
      if (hov) hov.textContent = "—";
      return;
    }
    const l = toLattice(...svgPixelArgs(e));
    if (hov) hov.textContent = `(${l.x}, ${l.y})`;
  });
  stage.addEventListener("pointerleave", () => {
    if (hov) hov.textContent = "—";
  });

  // convenience: tap the plane to park the mascot there (point-drop is Enter /
  // the drop key, so a stray tap never registers an unwanted vertex)
  stage.addEventListener("pointerdown", (e) => {
    if (stage.classList.contains("ca-painting")) return; // painting, not plotting
    if (isPanMode() || isGesturing()) return; // panning / pinch gesture in progress
    if (e.pointerType === "touch" && !e.isPrimary) return; // second finger of a pinch
    const l = toLattice(...svgPixelArgs(e));
    setCursor(l.x, l.y);
  });

  initMenu();
  initSteer();
  initFullscreen();
}

/* ── steering pad: extracted from the rail, toggled on its own ─────────────── */
function initSteer() {
  const dock = $("#dock-move");
  const toggle = $("#ca-steer-toggle");
  if (!dock || !toggle) return;
  const KEY = "ca-steer-open";

  const setOpen = (on) => {
    dock.classList.toggle("is-open", on);
    toggle.classList.toggle("is-active", on);
    toggle.setAttribute("aria-pressed", on ? "true" : "false");
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch {}
  };

  let open = true; // visible by default — it's the primary control
  try { const s = localStorage.getItem(KEY); if (s !== null) open = s === "1"; } catch {}

  toggle.addEventListener("click", () => setOpen(!dock.classList.contains("is-open")));
  dock.querySelector(".ca-dock-toggle")?.addEventListener("click", () => setOpen(false));
  makeDraggable(dock, dock.querySelector(".ca-dock-head"), "ca-steerpos");

  setOpen(open);
}

/* ── hamburger menu of floating toggles ───────────────────────────────────── */
function initMenu() {
  const menu = $("#ca-menu");
  const btn = $("#ca-menu-btn");
  if (!menu || !btn) return;
  const openIcon = btn.querySelector(".ca-menu-open");
  const closeIcon = btn.querySelector(".ca-menu-close");
  const setOpen = (on) => {
    menu.classList.toggle("is-open", on);
    btn.setAttribute("aria-expanded", on ? "true" : "false");
    if (openIcon) openIcon.hidden = on;
    if (closeIcon) closeIcon.hidden = !on;
  };
  btn.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
  // tapping a menu item closes the menu (except pan, which is a sticky toggle)
  menu.querySelectorAll(".ca-menu-items .ca-fab").forEach((b) => {
    if (b.id === "ca-pan-btn") return;
    b.addEventListener("click", () => setOpen(false));
  });

  // pan toggle
  const panBtn = $("#ca-pan-btn");
  panBtn?.addEventListener("click", () => {
    const on = !panBtn.classList.contains("is-active");
    panBtn.classList.toggle("is-active", on);
    setPanMode(on);
  });
}

/* ── fullscreen toggle ─────────────────────────────────────────────────── */
function initFullscreen() {
  const btn = $("#ca-fullscreen-btn");
  if (!btn) return;
  const enterIcon = btn.querySelector(".ca-fs-enter");
  const exitIcon = btn.querySelector(".ca-fs-exit");
  const target = $("#ca-studio"); // fullscreen the GRAPH, not the whole page

  btn.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else if (target) (target.requestFullscreen?.() || Promise.reject()).catch(() => {});
  });

  document.addEventListener("fullscreenchange", () => {
    const on = document.fullscreenElement === target;
    if (enterIcon) enterIcon.hidden = on;
    if (exitIcon) exitIcon.hidden = !on;
    document.body.classList.toggle("ca-fs", on);
    // the stage resizes — the grid's ResizeObserver redraws, but nudge it too
    setTimeout(() => window.dispatchEvent(new Event("resize")), 80);
  });
}

/** clientX/clientY → svg-pixel coords, honouring any CSS scaling. */
function svgPixelArgs(e) {
  const svg = document.querySelector("#ca-stage svg");
  const r = svg.getBoundingClientRect();
  const sx = svg.viewBox.baseVal.width / r.width;
  const sy = svg.viewBox.baseVal.height / r.height;
  return [(e.clientX - r.left) * sx, (e.clientY - r.top) * sy];
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
