/* ============================================================================
   Cartesian Art — entry point
   ----------------------------------------------------------------------------
   Boots the studio: mounts the coordinate plane, keeps the coordinate readout
   in sync with the cursor, and shows a live hover coordinate over the plane.
   Mascot movement, point plotting, painting, transforms, sharing and AI all
   land in later phases — this is the Phase-1 shell + grid.
   ========================================================================== */

import { state, subscribe, setCursor } from "./state.js";
import { initGrid, clientToMath, toLattice } from "./grid.js";

const $ = (sel) => document.querySelector(sel);

function init() {
  const stage = $("#ca-stage");
  if (!stage) return;

  initGrid(stage);

  // ── live readout of the cursor (mascot) position ───────────────────────
  const cx = $("#read-x");
  const cy = $("#read-y");
  const syncReadout = () => {
    if (cx) cx.textContent = state.cursor.x;
    if (cy) cy.textContent = state.cursor.y;
  };
  subscribe(syncReadout);
  syncReadout();

  // ── hover coordinate (preview before plotting lands in Phase 2) ─────────
  const hov = $("#read-hover");
  stage.addEventListener("pointermove", (e) => {
    const m = clientToMath(e.clientX, e.clientY);
    const g = state.grid;
    if (m.x < g.xMin - 0.5 || m.x > g.xMax + 0.5 || m.y < g.yMin - 0.5 || m.y > g.yMax + 0.5) {
      if (hov) hov.textContent = "—";
      return;
    }
    const l = toLattice(...mathToClientArgs(e));
    if (hov) hov.textContent = `(${l.x}, ${l.y})`;
  });
  stage.addEventListener("pointerleave", () => {
    if (hov) hov.textContent = "—";
  });

  // Preview: tapping the plane parks the cursor there. Real "register a point"
  // (Enter / click) arrives in Phase 2 with the mascot + controls.
  stage.addEventListener("pointerdown", (e) => {
    const l = toLattice(...mathToClientArgs(e));
    setCursor(l.x, l.y);
  });
}

// toLattice takes pixel coords relative to the svg; reuse clientToMath's box math
function mathToClientArgs(e) {
  const stage = document.querySelector("#ca-stage");
  const svg = stage.querySelector("svg");
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
