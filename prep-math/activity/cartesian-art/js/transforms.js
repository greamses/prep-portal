/* ============================================================================
   Cartesian Art — shape transformations
   ----------------------------------------------------------------------------
   The standard coordinate-plane transformations, applied to the whole plotted
   outline (great for teaching them): translate, reflect across each axis,
   rotate 90° about the origin, and dilate from the origin. Each one runs through
   state.transformPoints, which grows the grid to fit and emits "points" — so
   the history module records it automatically. Also wires the undo/redo buttons.
   ========================================================================== */

import { transformPoints } from "./state.js";
import { undo, redo } from "./history.js";

const OPS = {
  left: () => transformPoints((x, y) => ({ x: x - 1, y })),
  right: () => transformPoints((x, y) => ({ x: x + 1, y })),
  up: () => transformPoints((x, y) => ({ x, y: y + 1 })),
  down: () => transformPoints((x, y) => ({ x, y: y - 1 })),
  "flip-h": () => transformPoints((x, y) => ({ x: -x, y })), // reflect across y-axis
  "flip-v": () => transformPoints((x, y) => ({ x, y: -y })), // reflect across x-axis
  "rot-cw": () => transformPoints((x, y) => ({ x: y, y: -x })), // 90° clockwise about origin
  "rot-ccw": () => transformPoints((x, y) => ({ x: -y, y: x })), // 90° counter-clockwise
  bigger: () => transformPoints((x, y) => ({ x: x * 2, y: y * 2 })), // dilate ×2 from origin
  smaller: () => transformPoints((x, y) => ({ x: x / 2, y: y / 2 })), // dilate ÷2 from origin
};

export function initTransforms(scope = document) {
  scope.querySelectorAll(".ca-tbtn[data-tf]").forEach((b) =>
    b.addEventListener("click", () => OPS[b.dataset.tf]?.())
  );
  scope.querySelector("#undo-btn")?.addEventListener("click", undo);
  scope.querySelector("#redo-btn")?.addEventListener("click", redo);
}
