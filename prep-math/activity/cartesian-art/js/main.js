/* ============================================================================
   Cartesian Art — entry point
   ----------------------------------------------------------------------------
   Boots the studio: coordinate plane, mascot, point/outline layer, and the
   controls (keyboard + d-pad + analog). Keeps the coordinate readout and the
   point counter in sync, and shows a live hover coordinate over the plane.
   Painting, transforms, sharing and AI land in later phases.
   ========================================================================== */

import { state, subscribe, setCursor } from "./state.js";
import { initGrid, clientToMath, toLattice } from "./grid.js";
import { initMascot } from "./mascot.js";
import { initPoints } from "./points.js";
import { initControls } from "./controls.js";
import { initPaint } from "./paint.js";
import { initPuzzleMode } from "./puzzle-mode.js";
import { initLibrary } from "./library.js";

const $ = (sel) => document.querySelector(sel);

function init() {
  const stage = $("#ca-stage");
  if (!stage) return;

  initGrid(stage);
  initMascot();
  initPoints();
  initControls(document);
  initPaint();
  initPuzzleMode();
  initLibrary();

  // ── readouts: cursor position + how many points dropped ────────────────
  const cx = $("#read-x");
  const cy = $("#read-y");
  const count = $("#read-count");
  const syncReadout = () => {
    if (cx) cx.textContent = state.cursor.x;
    if (cy) cy.textContent = state.cursor.y;
    if (count) count.textContent = state.points.length;
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
    const l = toLattice(...svgPixelArgs(e));
    setCursor(l.x, l.y);
  });

  initFullscreen();
}

/* ── fullscreen toggle ─────────────────────────────────────────────────── */
function initFullscreen() {
  const btn = $("#ca-fullscreen-btn");
  if (!btn) return;
  const enterIcon = btn.querySelector(".ca-fs-enter");
  const exitIcon = btn.querySelector(".ca-fs-exit");
  const label = btn.querySelector(".ca-fs-label");

  btn.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else (document.documentElement.requestFullscreen?.() || Promise.reject()).catch(() => {});
  });

  document.addEventListener("fullscreenchange", () => {
    const on = !!document.fullscreenElement;
    if (enterIcon) enterIcon.hidden = on;
    if (exitIcon) exitIcon.hidden = !on;
    if (label) label.textContent = on ? "Exit full screen" : "Fullscreen";
    document.body.classList.toggle("ca-fs", on);
    // the stage size changes — the grid's ResizeObserver redraws, but nudge it
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
