/* ============================================================================
   Manipulatives — the turn handle
   ----------------------------------------------------------------------------
   Pick something up and a handle appears at its top-right corner. DRAG the
   handle round and the thing follows your hand; hold shift and it snaps to
   fifteen degrees. It is a DOM button pinned over the canvas rather than a gizmo
   in the scene, for the same reason the trade card is: a 3D one would have to be
   picked, dragged and kept a sensible size against the camera.

   There are THREE of them, in a little column: turn it on the paper, lift it
   off the paper, tip it over. The last two are the third dimension made
   draggable — see ops.js — and they are dragged UP AND DOWN, because that is
   the direction the thing they do happens in.

   The angle comes from the CENTRE of what is picked, not from the handle: the
   handle orbits as the thing turns, and measuring from a moving thing to itself
   would feed the rotation back into its own input.

   Where the handle sits is worked out from the ITEM — the corners of the paper
   it covers, projected to the screen. A block is one mesh but an abacus is a rig
   hanging off a transform node with no bounding box of its own, and the patch of
   paper is the one thing both of them have.
   ========================================================================== */

import { store, snapshot, selectedItems, say } from "./state.js";
import { footprint, standing } from "./layout.js";
import { settleSelected, canTip } from "./ops.js";
import { snapLift, othersThan } from "./snap.js";
import { ICON } from "./icons.js";

const B = () => window.BABYLON;
const STEP = Math.PI / 12; // fifteen degrees, while shift is held

/* How far the hand must travel to tip a piece a quarter turn. */
const TIP_PER_PX = Math.PI / 2 / 130;

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

  /* ── the two that work in the third dimension ───────────────────────────── */

  function extraHandle(cls, icon, title, aria) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "bb-turn " + cls;
    b.hidden = true;
    b.title = title;
    b.setAttribute("aria-label", aria);
    b.innerHTML = icon;
    stage.appendChild(b);
    return b;
  }

  const liftBtn = extraHandle("bb-lift", ICON.lift,
    "Drag up and down to lift it off the paper (U and D)",
    "Drag up or down to lift the picked thing off the paper, or press U and D");
  const tipBtn = extraHandle("bb-tip", ICON.tip,
    "Drag up and down to tip it over (E for a quarter tip)",
    "Drag up or down to tip the picked thing over; E tips it a quarter turn");

  /**
   * One drag, up and down, doing whatever it is told with the distance.
   *
   * The two handles differ only in what a pixel of hand movement MEANS, so the
   * business of capturing the pointer, taking one snapshot, redrawing live and
   * settling at the end is written once.
   */
  function vertical(el, { begin, move, end }) {
    let run = null;
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const sel = selectedItems();
      if (!sel.length) return;
      el.setPointerCapture(e.pointerId);
      snapshot();
      run = { id: e.pointerId, y0: e.clientY, sel, moved: false, ...(begin(sel) || {}) };
      el.classList.add("is-turning");
    });
    el.addEventListener("pointermove", (e) => {
      if (!run || e.pointerId !== run.id) return;
      e.preventDefault();
      // up the screen is a smaller clientY, and up is the direction that adds
      move(run, run.y0 - e.clientY, e);
      run.moved = true;
      for (const b of run.sel) view.placeItem(b);
      place();
    });
    const stop = (e) => {
      if (!run || (e && e.pointerId !== run.id)) return;
      const done = run;
      run = null;
      el.classList.remove("is-turning");
      if (done.moved) { end?.(done); onDone(); }
      place();
    };
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
  }

  /* LIFT. A pixel is worth whatever a pixel is worth on this canvas at this
     zoom — measured by projecting one unit of height and seeing how far up the
     screen it lands — so the piece comes up under your finger rather than at
     some rate of its own. Straight down (the flat view) a unit of height
     projects to nothing at all, so there is a floor under that measurement and
     a word about why nothing appears to be happening. */
  vertical(liftBtn, {
    begin: (sel) => {
      const low = Math.min(...sel.map((b) => b.y || 0));
      if (store.flat) say("Turn the flat view off (V) to watch it rise.");
      return {
        low,
        from: sel.map((b) => ({ b, y: b.y || 0 })),
        others: othersThan(sel),
        perUnit: pixelsPerUnit(sel),
      };
    },
    move: (r, dy) => {
      const want = Math.max(0, r.low + dy / r.perUnit);
      const landed = snapLift(r.sel, want, r.others);
      const rise = landed - r.low;
      for (const { b, y } of r.from) b.y = Math.max(0, y + rise);
    },
  });

  /* TIP. Shift snaps to fifteen degrees, the way turning does — and a piece
     that has been tipped needs a new patch of paper, because its footprint has
     just changed shape. */
  vertical(tipBtn, {
    begin: (sel) => ({ sel: sel.filter(canTip), from: sel.filter(canTip).map((b) => ({ b, t: b.tip || 0 })) }),
    move: (r, dy, e) => {
      const step = dy * TIP_PER_PX;
      for (const { b, t } of r.from) {
        const next = t + step;
        b.tip = e.shiftKey ? Math.round(next / STEP) * STEP : next;
      }
    },
    end: () => { settleSelected(); },
  });

  /** How many pixels up the screen one unit of height is, here and now. */
  function pixelsPerUnit(sel) {
    const b = sel[0];
    const f = footprint(b);
    const at = { x: b.x + f.l / 2, z: b.z + f.w / 2 };
    const a = project(at.x, 0, at.z);
    const c = project(at.x, 1, at.z);
    return Math.max(6, Math.abs(a.y - c.y));
  }

  /* Typing an exact angle. Dragging is for "about there" and this is for "45",
     which is a different question — a protractor beside the handle rather than
     a steadier hand. It follows the handle about, opens on a right-click, and
     shows the angle live while you drag so the two are one control. */
  const box = document.createElement("form");
  box.className = "bb-turnbox";
  box.hidden = true;
  box.innerHTML = `
    <div class="pp-receipt__paper bb-paper bb-turnbox__paper">
      <input class="bb-turnbox__n" id="bb-turn-n" type="text" inputmode="decimal"
             autocomplete="off" spellcheck="false" aria-label="Angle in degrees" />
      <span class="bb-turnbox__deg" aria-hidden="true">°</span>
    </div>`;
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
      const p = project(b.x + f.l / 2, (b.y || 0) + standing(b).h / 2, b.z + f.w / 2);
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
    liftBtn.hidden = !on;
    /* Tipping is for the pieces. A chart or a counting frame standing on its
       edge is not a lesson about anything, so the handle is simply not there. */
    tipBtn.hidden = !on || !selectedItems().some(canTip);
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
            for (const y of [b.y || 0, (b.y || 0) + standing(b).h]) {
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
    cy = Math.max(8, Math.min(rect.height - h * 3 - 20, cy));
    btn.style.transform = `translate(${Math.round(cx)}px, ${Math.round(cy)}px)`;

    /* The other two hang under it in a column, in the order they take the piece
       further from the paper: turn it where it lies, lift it off, tip it over. */
    const under = (el, n) => {
      if (el.hidden) return;
      el.style.transform =
        `translate(${Math.round(cx)}px, ${Math.round(cy + n * (h + 6))}px)`;
    };
    under(liftBtn, 1);
    under(tipBtn, tipBtn.hidden ? 1 : 2);

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
      liftBtn.remove();
      tipBtn.remove();
      box.remove();
    },
  };
}
