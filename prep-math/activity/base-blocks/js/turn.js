/* ============================================================================
   Manipulatives — the turn handle
   ----------------------------------------------------------------------------
   Pick something up and a small handle appears at its top-right corner; press it
   and the thing turns a quarter. It is a DOM button pinned over the canvas
   rather than anything in the scene, for the same reason the trade card is: a
   3D gizmo would have to be picked, dragged and scaled against the camera, and
   this needs to be a button.

   Where it goes is worked out from the ITEM, not from its mesh — the eight
   corners of the cell-space box it occupies, projected to the screen. A block
   is one mesh but an abacus is a whole rig hanging off a transform node with no
   bounding box of its own, and the box is the one thing both of them have.
   ========================================================================== */

import { store, selectedItems } from "./state.js";
import { ICON } from "./icons.js";

const B = () => window.BABYLON;

export function createTurnHandle(ctx, stage, onTurn) {
  const { scene, camera } = ctx;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "bb-turn";
  btn.hidden = true;
  btn.title = "Turn a quarter (Q)";
  btn.setAttribute("aria-label", "Turn the picked thing a quarter turn");
  btn.innerHTML = ICON.turn;
  stage.appendChild(btn);

  // the canvas is under this button; a press must not also count as a tap on
  // whatever happens to be behind it
  btn.addEventListener("pointerdown", (e) => e.stopPropagation());
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onTurn();
  });

  function refresh() {
    const on = store.selection.size > 0;
    btn.hidden = !on;
    if (on) place();
  }

  function place() {
    if (btn.hidden) return;
    const BJS = B();
    const sel = selectedItems();
    if (!sel.length) { btn.hidden = true; return; }

    const engine = scene.getEngine();
    const rect = stage.getBoundingClientRect();
    const vp = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const sx = rect.width / engine.getRenderWidth();
    const sy = rect.height / engine.getRenderHeight();
    const m = scene.getTransformMatrix();

    let right = -Infinity;
    let top = Infinity;
    for (const b of sel) {
      for (const x of [b.x, b.x + b.l]) {
        for (const z of [b.z, b.z + b.w]) {
          for (const y of [0, b.h]) {
            const p = BJS.Vector3.Project(new BJS.Vector3(x, y, z), BJS.Matrix.Identity(), m, vp);
            right = Math.max(right, p.x * sx);
            top = Math.min(top, p.y * sy);
          }
        }
      }
    }
    if (!isFinite(right) || !isFinite(top)) { btn.hidden = true; return; }

    const w = btn.offsetWidth || 34;
    const h = btn.offsetHeight || 34;
    const cx = Math.max(8, Math.min(rect.width - w - 8, right + 10));
    const cy = Math.max(8, Math.min(rect.height - h - 8, top - h / 2));
    btn.style.transform = `translate(${Math.round(cx)}px, ${Math.round(cy)}px)`;
  }

  // the camera can orbit without the store changing, so it is re-pinned after
  // every render rather than only when something happens
  const obs = scene.onAfterRenderObservable.add(place);

  return {
    refresh,
    destroy() {
      scene.onAfterRenderObservable.remove(obs);
      btn.remove();
    },
  };
}
