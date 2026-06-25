/* ============================================================================
   Cartesian Art — shape transformations
   ----------------------------------------------------------------------------
   The standard coordinate-plane transformations applied to the ACTIVE shape:
   translate, reflect across each axis, rotate 90° about the origin, and dilate
   from the origin. Each runs through transform-mode.runOp, which animates the
   move and commits one undo step. Also hosts the transform-mode toggle and wires
   the undo/redo buttons.
   ========================================================================== */

import { state, setTransformMode, subscribe } from "./state.js";
import { runOp } from "./transform-mode.js";
import { undo, redo } from "./history.js";

export function initTransforms(scope = document) {
  scope.querySelectorAll(".ca-tbtn[data-tf]").forEach((b) =>
    b.addEventListener("click", () => runOp(b.dataset.tf))
  );

  // transform-mode toggle (arrows/analog steer the active shape)
  const modeBtn = scope.querySelector("#tf-mode");
  modeBtn?.addEventListener("click", () => setTransformMode(!state.ui.transformMode));
  const sync = () => modeBtn?.classList.toggle("is-active", state.ui.transformMode);
  subscribe((r) => { if (r === "transform") sync(); });
  sync();

  scope.querySelector("#undo-btn")?.addEventListener("click", undo);
  scope.querySelector("#redo-btn")?.addEventListener("click", redo);
}
