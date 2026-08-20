/* ============================================================================
   Manipulatives — choosing what a number card says
   ----------------------------------------------------------------------------
   Pick a number card up and a dropdown appears on it: standard, expanded,
   powers, blocks, groups. It is a DOM control pinned over the card rather than
   anything drawn into the card's own paper, for the same reason the turn handle
   is: a control drawn into a texture would have to be picked, hit-tested and
   kept a readable size against the camera, and this is a list of five words
   that every phone and every screen reader already knows how to work.

   Pinned by projecting the corners of the card's CELL-SPACE box, the way
   turn.js pins its handles — and re-pinned after every render, because the
   camera can orbit without the store ever changing.
   ========================================================================== */

import { selectedItems } from "./state.js";
import { footprint } from "./layout.js";
import { NOTATIONS } from "./card.js";

const B = () => window.BABYLON;

export function createCardPicker(ctx, view, stage, { onPick = () => {} } = {}) {
  const { scene, camera } = ctx;

  const sel = document.createElement("select");
  sel.className = "bb-cardpick";
  sel.hidden = true;
  sel.title = "How the card says the number";
  sel.setAttribute("aria-label", "How the number card says the number");
  sel.innerHTML = NOTATIONS.map(
    (n) => `<option value="${n.id}" title="${n.hint}">${n.label}</option>`
  ).join("");
  stage.appendChild(sel);

  /* The dropdown belongs to the card, not to the canvas underneath it: a press
     on it must not also be a press on the paper, which would clear the very
     selection that is keeping the dropdown on screen. */
  sel.addEventListener("pointerdown", (e) => e.stopPropagation());
  sel.addEventListener("change", () => {
    const card = only();
    if (card) onPick(card, sel.value);
  });

  /** The one card that is picked up, if that is what is picked up. */
  function only() {
    const picked = selectedItems();
    if (picked.length !== 1) return null;
    return picked[0].kind === "card" ? picked[0] : null;
  }

  function project(x, y, z) {
    const BJS = B();
    const engine = scene.getEngine();
    const rect = stage.getBoundingClientRect();
    const vp = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const p = BJS.Vector3.Project(
      new BJS.Vector3(x, y, z), BJS.Matrix.Identity(), scene.getTransformMatrix(), vp);
    return {
      x: p.x * (rect.width / engine.getRenderWidth()),
      y: p.y * (rect.height / engine.getRenderHeight()),
    };
  }

  function place() {
    const card = only();
    if (!card) { sel.hidden = true; return; }
    const f = footprint(card);
    let left = Infinity;
    let top = Infinity;
    for (const x of [card.x, card.x + f.l]) {
      for (const z of [card.z, card.z + f.w]) {
        const p = project(x, card.y || 0, z);
        left = Math.min(left, p.x);
        top = Math.min(top, p.y);
      }
    }
    if (!isFinite(left)) { sel.hidden = true; return; }

    const rect = stage.getBoundingClientRect();
    const w = sel.offsetWidth || 108;
    const h = sel.offsetHeight || 26;
    // just above the card's top-left corner, and always on the stage
    const x = Math.max(8, Math.min(rect.width - w - 8, left));
    const y = Math.max(8, Math.min(rect.height - h - 8, top - h - 8));
    sel.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  function refresh() {
    const card = only();
    sel.hidden = !card;
    if (!card) return;
    if (sel.value !== card.notation) sel.value = card.notation;
    place();
  }

  const obs = scene.onAfterRenderObservable.add(() => { if (!sel.hidden) place(); });

  return {
    refresh,
    destroy() {
      scene.onAfterRenderObservable.remove(obs);
      sel.remove();
    },
  };
}
