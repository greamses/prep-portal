/* ============================================================================
   Cartesian Art — entry point
   ----------------------------------------------------------------------------
   Boots the studio: coordinate plane, mascot, point/outline layer, and the
   controls (keyboard + d-pad + analog). Keeps the coordinate readout and the
   point counter in sync, and shows a live hover coordinate over the plane.
   Painting, transforms, sharing and AI land in later phases.
   ========================================================================== */

import { state, subscribe, allPoints, squareView, setPosOnly } from "./state.js";
import { initGrid, clientToMath, toLattice } from "./grid.js";
import { initZoom, setPanMode, zoomBy, zoomAxisBy } from "./zoom.js";
import { initShapesDock } from "./shapes-dock.js";
import { initTransformMode } from "./transform-mode.js";
import { initMascot } from "./mascot.js";
import { initPoints } from "./points.js";
import { initControls } from "./controls.js";
import { initPaint } from "./paint.js";
import { initGradient } from "./gradient.js";
import { initToolRail } from "./tool-rail.js";
import { makeDraggable } from "./draggable.js";
import { initTransforms } from "./transforms.js";
import { initHistory } from "./history.js";
import { initPuzzleMode } from "./puzzle-mode.js";
import { initLibrary } from "./library.js";
import { initExport, loadFromUrl } from "./export.js";
import { initAiGenerate } from "./ai-generate.js";
import { initGallery } from "./gallery.js";
import { initTaskPanel } from "./task-panel.js";
import { fmtCoord } from "./scale.js";

const $ = (sel) => document.querySelector(sel);

function init() {
  const stage = $("#ca-stage");
  if (!stage) return;

  initGrid(stage);
  initMascot();
  initPoints();
  initControls(document);
  initPaint();
  initGradient();
  initTransforms(document);
  initToolRail(document);
  initTransformMode();
  initPuzzleMode();
  initTaskPanel();
  initLibrary();
  initShapesDock();
  initZoom(stage);
  initExport();
  initAiGenerate();
  initGallery();
  loadFromUrl(); // a shared ?#art= link rehydrates the drawing before baseline
  initHistory(); // last: baseline snapshot needs the brush bridge registered

  // ── readouts: cursor position + how many points dropped ────────────────
  const cx = $("#read-x");
  const cy = $("#read-y");
  const count = $("#read-count");
  const syncReadout = () => {
    if (cx) cx.textContent = fmtCoord(state.cursor.x);
    if (cy) cy.textContent = fmtCoord(state.cursor.y);
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
    if (hov) hov.textContent = `(${fmtCoord(l.x)}, ${fmtCoord(l.y)})`;
  });
  stage.addEventListener("pointerleave", () => {
    if (hov) hov.textContent = "—";
  });

  // (click-to-place the cursor is handled in zoom.js, which distinguishes a
  // click from a pan/axis drag)

  initMenu();
  initSteer();
  initShortcuts();
  initFullscreen();
}

/* ── keyboard shortcuts (arrows/Enter/Del/C/undo live in controls.js) ─────── */
function initShortcuts() {
  const typing = (t) => t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT" || t.isContentEditable);
  const held = new Set(); // x / y axis modifier held for +/- zoom

  // hold x or y, then press +/- to zoom only that axis
  const zoom = (factor) => {
    if (held.has("x")) zoomAxisBy("x", factor);
    else if (held.has("y")) zoomAxisBy("y", factor);
    else zoomBy(factor);
  };

  window.addEventListener("keyup", (e) => {
    if (!e.key) return; // some inputs (colour/range) fire keyup without a key
    const k = e.key.toLowerCase();
    if (k === "x" || k === "y") held.delete(k);
  });
  window.addEventListener("blur", () => held.clear());

  window.addEventListener("keydown", (e) => {
    if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key) {
      case "x": case "X": held.add("x"); break;                   // axis modifier
      case "y": case "Y": held.add("y"); break;
      case "v": case "V": $("#ca-pan-btn")?.click(); break;       // toggle pan
      case "n": case "N": $("#act-new")?.click(); break;          // new shape
      case "t": case "T": $("#tf-mode")?.click(); break;          // transform mode
      case "f": case "F": $("#ca-fullscreen-btn")?.click(); break; // fullscreen
      case "+": case "=": e.preventDefault(); zoom(1 / 1.2); break; // zoom in
      case "-": case "_": e.preventDefault(); zoom(1.2); break;     // zoom out
      case "0": squareView(); break;                              // reset to square
      default: return;
    }
  });
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
  // tapping a menu item closes the menu (except the sticky toggles)
  const sticky = new Set(["ca-pan-btn", "ca-quadrant-btn"]);
  menu.querySelectorAll(".ca-menu-items .ca-fab").forEach((b) => {
    if (sticky.has(b.id)) return;
    b.addEventListener("click", () => setOpen(false));
  });

  // pan toggle
  const panBtn = $("#ca-pan-btn");
  panBtn?.addEventListener("click", () => {
    const on = !panBtn.classList.contains("is-active");
    panBtn.classList.toggle("is-active", on);
    setPanMode(on);
  });

  // negative-axis (first-quadrant) toggle
  const quadBtn = $("#ca-quadrant-btn");
  quadBtn?.addEventListener("click", () => {
    const on = !quadBtn.classList.contains("is-active");
    quadBtn.classList.toggle("is-active", on);
    setPosOnly(on);
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
