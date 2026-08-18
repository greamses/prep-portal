/* ============================================================================
   Manipulatives — the turn handle
   ----------------------------------------------------------------------------
   Pick something up and a handle appears at its top-right corner. DRAG the
   handle round and the thing follows your hand; hold shift and it snaps to
   fifteen degrees. It is a DOM button pinned over the canvas rather than a gizmo
   in the scene, for the same reason the trade card is: a 3D one would have to be
   picked, dragged and kept a sensible size against the camera.

   The angle comes from the CENTRE of what is picked, not from the handle: the
   handle orbits as the thing turns, and measuring from a moving thing to itself
   would feed the rotation back into its own input.

   Where the handle sits is worked out from the ITEM — the corners of the paper
   it covers, projected to the screen. A block is one mesh but an abacus is a rig
   hanging off a transform node with no bounding box of its own, and the patch of
   paper is the one thing both of them have.
   ========================================================================== */

import { store, snapshot, selectedItems } from "./state.js";
import { footprint } from "./layout.js";
import { settleSelected } from "./ops.js";
import { ICON } from "./icons.js";

const B = () => window.BABYLON;
const STEP = Math.PI / 12; // fifteen degrees, while shift is held

export function createTurnHandle(ctx, view, stage, onDone) {
  const { scene, camera } = ctx;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "bb-turn";
  btn.hidden = true;
  btn.title = "Drag to turn — shift for 15° steps, right-click to type an angle";
  btn.setAttribute("aria-label",
    "Drag to turn the picked thing; hold shift for fifteen degree steps, "
    + "or right-click to type an exact angle");
  btn.innerHTML = ICON.turn;
  stage.appendChild(btn);

  /* Typing an exact angle. Dragging is for "about there" and this is for "45",
     which is a different question — a protractor beside the handle rather than
     a steadier hand. It follows the handle about, opens on a right-click, and
     shows the angle live while you drag so the two are one control. */
  const box = document.createElement("form");
  box.className = "bb-turnbox";
  box.hidden = true;
  box.innerHTML = `
    <input class="bb-turnbox__n" id="bb-turn-n" type="text" inputmode="decimal"
           autocomplete="off" spellcheck="false" aria-label="Angle in degrees" />
    <span class="bb-turnbox__deg" aria-hidden="true">°</span>`;
  stage.appendChild(box);
  const boxInput = box.querySelector("input");

  let drag = null;

  /** Show the angle in the box while it is open, so dragging reads out. */
  function onAngle(rad) {
    if (box.hidden || document.activeElement === boxInput) return;
    boxInput.value = String(Math.round(((rad * 180) / Math.PI) % 360));
  }

  function openBox() {
    const sel = selectedItems();
    if (!sel.length) return;
    box.hidden = false;
    boxInput.value = String(Math.round((((sel[0].angle || 0) * 180) / Math.PI) % 360));
    place();
    boxInput.focus();
    boxInput.select();
  }

  function closeBox() {
    box.hidden = true;
  }

  btn.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (box.hidden) openBox(); else closeBox();
  });

  box.addEventListener("submit", (e) => {
    e.preventDefault();
    const deg = Number(String(boxInput.value).replace(/[^\d.+-]/g, ""));
    if (!Number.isFinite(deg)) { closeBox(); return; }
    const sel = selectedItems();
    if (!sel.length) { closeBox(); return; }
    snapshot();
    for (const b of sel) b.angle = (deg * Math.PI) / 180;
    settleSelected();
    onDone();
    closeBox();
    place();
  });

  box.addEventListener("keydown", (e) => {
    e.stopPropagation(); // the canvas's own letter shortcuts are not for here
    if (e.key === "Escape") { e.preventDefault(); closeBox(); }
  });

  const local = (e) => {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  /** Where a point in the world lands on the stage, in pixels. */
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

  /** The middle of everything picked, on the stage. */
  function centreOf(sel) {
    let x = 0, y = 0;
    for (const b of sel) {
      const f = footprint(b);
      const p = project(b.x + f.l / 2, b.h / 2, b.z + f.w / 2);
      x += p.x; y += p.y;
    }
    return { x: x / sel.length, y: y / sel.length };
  }

  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sel = selectedItems();
    if (!sel.length) return;

    btn.setPointerCapture(e.pointerId);
    const at = local(e);
    const centre = centreOf(sel);
    snapshot();
    drag = {
      id: e.pointerId,
      centre,
      at,
      last: Math.atan2(at.y - centre.y, at.x - centre.x),
      delta: 0,
      from: sel.map((b) => ({ b, a: b.angle || 0 })),
      moved: false,
    };
    btn.classList.add("is-turning");
  });

  btn.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    e.preventDefault();
    const at = local(e);
    drag.at = at;

    /* Screen angles run clockwise (y counts downward) and so does a positive
       turn about Y seen from above, so the two agree without a sign flip. */
    const now = Math.atan2(at.y - drag.centre.y, at.x - drag.centre.x);

    /* atan2 jumps by a full turn as the hand crosses due west, and a raw
       difference from the starting angle would jump with it — the thing would
       spin right round for a pixel of movement. Unwrapping keeps the delta
       CONTINUOUS by accumulating the small step since the last move, which is
       what makes a slow drag feel like turning something rather than nudging
       it, and it lets the turn go past a full circle without unwinding. */
    let step = now - drag.last;
    if (step > Math.PI) step -= 2 * Math.PI;
    else if (step < -Math.PI) step += 2 * Math.PI;
    drag.last = now;
    drag.delta += step;

    for (const { b, a } of drag.from) {
      const next = a + drag.delta;
      b.angle = e.shiftKey ? Math.round(next / STEP) * STEP : next;
      view.placeItem(b);
    }
    drag.moved = true;
    place();
    onAngle(drag.from[0] ? drag.from[0].b.angle : 0);
  });

  function end(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const moved = drag.moved;
    drag = null;
    btn.classList.remove("is-turning");
    // the shape of the space each thing needs has changed, so let them settle
    if (moved) { settleSelected(); onDone(); }
    place();
  }
  btn.addEventListener("pointerup", end);
  btn.addEventListener("pointercancel", end);

  function refresh() {
    const on = store.selection.size > 0;
    btn.hidden = !on;
    if (!on) closeBox();
    if (on) place();
  }

  function place() {
    if (btn.hidden) return;
    const sel = selectedItems();
    if (!sel.length) { btn.hidden = true; return; }

    const rect = stage.getBoundingClientRect();
    const w = btn.offsetWidth || 34;
    const h = btn.offsetHeight || 34;

    let cx;
    let cy;
    if (drag) {
      // while it is being dragged the handle belongs under the finger, not at a
      // corner that is itself moving
      cx = drag.at.x - w / 2;
      cy = drag.at.y - h / 2;
    } else {
      let right = -Infinity;
      let top = Infinity;
      for (const b of sel) {
        const f = footprint(b);
        for (const x of [b.x, b.x + f.l]) {
          for (const z of [b.z, b.z + f.w]) {
            for (const y of [0, b.h]) {
              const p = project(x, y, z);
              right = Math.max(right, p.x);
              top = Math.min(top, p.y);
            }
          }
        }
      }
      if (!isFinite(right) || !isFinite(top)) { btn.hidden = true; return; }
      cx = right + 10;
      cy = top - h / 2;
    }

    cx = Math.max(8, Math.min(rect.width - w - 8, cx));
    cy = Math.max(8, Math.min(rect.height - h - 8, cy));
    btn.style.transform = `translate(${Math.round(cx)}px, ${Math.round(cy)}px)`;

    // the box rides just under the handle it belongs to
    if (!box.hidden) {
      const bw = box.offsetWidth || 74;
      box.style.transform =
        `translate(${Math.round(Math.max(8, Math.min(rect.width - bw - 8, cx + w / 2 - bw / 2)))}px, `
        + `${Math.round(Math.min(rect.height - 40, cy + h + 6))}px)`;
    }
  }

  // the camera can orbit without the store changing, so it is re-pinned after
  // every render rather than only when something happens
  const obs = scene.onAfterRenderObservable.add(place);

  return {
    refresh,
    destroy() {
      scene.onAfterRenderObservable.remove(obs);
      btn.remove();
      box.remove();
    },
  };
}
