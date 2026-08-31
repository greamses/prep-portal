/* ============================================================================
   Manipulatives — the pick tool: handling the cards themselves
   ----------------------------------------------------------------------------
   Everything on this canvas is now one of two cards (see style.css): a RECEIPT
   for the panels you act on, a STICKY NOTE for the things that say something.
   This is the tool for handling the cards as cards — put one where you want it,
   pull it to the size you want, or close it.

   It is a MODE, like the hand tool, and for the same reason: the ordinary press
   already means something everywhere it lands. A press on a panel works the
   control under it, a press on a note opens it for writing. So the handles only
   appear while the tool is on, and the moment it goes off every card is back to
   doing its own job.

   ── one tool, two kinds of card ───────────────────────────────────────────
   A panel is a DOM element and is moved by writing a left/top on it. A note or
   a number card lies on the 3D paper, so its handles are floated OVER it by
   projecting its corners, the way turn.js floats the turn handle.

   Both get the same three affordances and in the same places, because they are
   the same gesture: drag the bar at the top to move, the corner to resize, the
   cross to close.

   ── what resizing means ───────────────────────────────────────────────────
   For a panel it is a width and a height in pixels, written onto the element.
   For a note it is a WIDTH IN CELLS and nothing else (`note.wide`): the writing
   still decides the height, so pulling a note narrow makes it taller — which is
   what happens to a piece of writing on a real page, and is the only resize
   that leaves the words legible.

   The rail is not a card. It is the box the tools come out of, and a rail you
   could close is a rail you could lose.
   ========================================================================== */

import { store, snapshot, emit, say, selectedItems } from "./state.js";
import { footprint } from "./layout.js";
import { measure, NOTE_MIN_CELLS, NOTE_MAX_CELLS } from "./notes.js";
import { ICON } from "./icons.js";

const B = () => window.BABYLON;

/* The panels that are cards you may handle. The rail is deliberately not one,
   and neither is the toast or the running total — those are the canvas
   speaking, not a card of yours.

   The strip over a written sum is not one either. It is not a panel you opened;
   it belongs to the board and goes where the board goes. Leaving it in this list
   was a real bug: with a long division in your hand the strip is always up, so
   it always won, and the × closed the strip while the division itself could
   never be taken hold of at all. */
const PANELS = ".bb-fly, .bb-pop, .bb-board";

/* A panel may not be pulled smaller than this, or there is nothing left to
   take hold of and no way back. */
const MIN_W = 180;
const MIN_H = 90;

/* What to call a card when it is closed, so the line of feedback names the
   thing that went rather than saying "removed" at you. */
const NAMES = {
  note: "Note", card: "Number card", abacus: "Frame", tile: "Tile", board: "Board",
};

export function createPickTool(ctx, view, stage) {
  const { scene, camera } = ctx;

  /* One set of handles, moved about, rather than a set per card: only ever one
     card is being handled, and a canvas wearing a cross on everything at once
     reads as a mistake rather than as an offer. */
  const kit = document.createElement("div");
  kit.className = "bb-pickkit";
  kit.hidden = true;
  kit.innerHTML = `
    <button class="bb-pickkit__bar" type="button" data-do="move"
            title="Drag to move this card" aria-label="Move this card"></button>
    <button class="bb-pickkit__key" type="button" data-do="close"
            title="Close this card" aria-label="Close this card">${ICON.close}</button>
    <button class="bb-pickkit__grip" type="button" data-do="size"
            title="Drag to resize this card" aria-label="Resize this card"></button>`;
  stage.appendChild(kit);

  const bar = kit.querySelector('[data-do="move"]');
  const grip = kit.querySelector('[data-do="size"]');
  const shut = kit.querySelector('[data-do="close"]');

  /* What the handles are on at the moment: a panel element, or a thing on the
     paper. Never both. */
  let onPanel = null;
  let onThing = null;
  let drag = null;

  /* ── which card is under the pointer ─────────────────────────────────────── */

  /**
   * The one THING that is picked up. Everything on the paper is a card here — a
   * frame, a chart, a written sum, a tile, a note — except the blocks, which are
   * the material you build with rather than a card you handle. They have the
   * whole Blocks kit of their own and a strip of keys that comes to them.
   */
  function heldThing() {
    const picked = selectedItems();
    if (picked.length !== 1) return null;
    const t = picked[0];
    return t.kind && t.kind !== "block" && store.things.includes(t) ? t : null;
  }

  /**
   * Which cards can be pulled to a size, and what that means for them.
   *
   * A note is the only one with a size of its OWN — everything else on the paper
   * is cut to fit what it holds, and a soroban you could stretch would be a
   * soroban with the wrong number of beads on it. So the corner only appears
   * where pulling it means something.
   */
  function canSize(t) {
    return !!t && (t.kind === "note" || t.kind === "card");
  }

  /** The topmost open panel, which is the one a press would have landed on. */
  function openPanel() {
    const open = [...stage.querySelectorAll(PANELS)].filter((el) => !el.hidden);
    if (!open.length) return null;
    /* The last one in the DOM wins ties, which is the one drawn on top. */
    return open[open.length - 1];
  }

  /* ── putting the handles somewhere ───────────────────────────────────────── */

  function project(v) {
    const BJS = B();
    const engine = scene.getEngine();
    const rect = stage.getBoundingClientRect();
    const vp = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const p = BJS.Vector3.Project(v, BJS.Matrix.Identity(), scene.getTransformMatrix(), vp);
    return {
      x: p.x * (rect.width / engine.getRenderWidth()),
      y: p.y * (rect.height / engine.getRenderHeight()),
    };
  }

  /** The screen box a thing on the paper covers. */
  function boxOfThing(t) {
    const BJS = B();
    const f = footprint(t);
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const x of [t.x, t.x + f.l]) {
      for (const z of [t.z, t.z + f.w]) {
        const p = project(new BJS.Vector3(x, (t.y || 0) + (t.h || 0), z));
        left = Math.min(left, p.x); right = Math.max(right, p.x);
        top = Math.min(top, p.y); bottom = Math.max(bottom, p.y);
      }
    }
    return { x: left, y: top, w: right - left, h: bottom - top };
  }

  /** The screen box a panel covers, in the stage's own coordinates. */
  function boxOfPanel(el) {
    const r = el.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    return { x: r.x - s.x, y: r.y - s.y, w: r.width, h: r.height };
  }

  /* Room for the bar, which hangs above the frame, and the grip, which hangs
     below it. Handles printed outside the stage cannot be pressed. */
  const EDGE = 22;

  function lay(box) {
    /* Clamped to what is ON SCREEN. A board can easily be bigger than the view —
       a long division at a comfortable zoom usually is — and handles pinned to
       the corners of something you can only see the middle of are handles you
       cannot reach. The frame hugs the card where the card is visible, and stops
       at the edge of the stage where it is not. */
    const r = stage.getBoundingClientRect();
    const left = Math.max(EDGE, Math.min(box.x, r.width - 80));
    const top = Math.max(EDGE, Math.min(box.y, r.height - 60));
    const right = Math.min(r.width - EDGE / 2, Math.max(box.x + box.w, left + 60));
    const bottom = Math.min(r.height - EDGE / 2, Math.max(box.y + box.h, top + 40));
    kit.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    kit.style.width = `${Math.round(right - left)}px`;
    kit.style.height = `${Math.round(bottom - top)}px`;
  }

  function place() {
    if (onPanel) { lay(boxOfPanel(onPanel)); return; }
    if (onThing) { lay(boxOfThing(onThing)); return; }
    kit.hidden = true;
  }

  /* ── moving, sizing, closing ─────────────────────────────────────────────── */

  function begin(e, what) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const box = onPanel ? boxOfPanel(onPanel) : boxOfThing(onThing);
    drag = { id: e.pointerId, what, x0: e.clientX, y0: e.clientY, box, moved: false };
    if (onThing && what === "size") drag.wide0 = onThing.wide || onThing.l;
    if (onThing) {
      drag.at = { x: onThing.x, z: onThing.z };
      /* One step back for the whole pull, taken BEFORE it — a snapshot at the
         end would record where the note ended up, and undo would put it back
         exactly where it already was. */
      snapshot();
    }
  }

  function move(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;

    if (onPanel) {
      if (drag.what === "move") {
        /* Once a panel has been put somewhere by hand it stays there: `is-put`
           is what tells the code that placed it to leave it alone. */
        onPanel.classList.add("is-put");
        onPanel.style.left = `${Math.round(drag.box.x + dx)}px`;
        onPanel.style.top = `${Math.round(drag.box.y + dy)}px`;
        onPanel.style.right = "auto";
        onPanel.style.bottom = "auto";
        onPanel.style.transform = "none";
      } else {
        onPanel.style.width = `${Math.max(MIN_W, Math.round(drag.box.w + dx))}px`;
        onPanel.style.height = `${Math.max(MIN_H, Math.round(drag.box.h + dy))}px`;
      }
      place();
      return;
    }

    if (!onThing) return;
    if (drag.what === "move") {
      /* Screen pixels into squares of paper. The note is drawn in a box we
         already have, so how big a square is on screen is that box over how many
         squares it covers — no need to ask the camera. Screen y runs DOWN and
         the paper's z runs UP the screen, hence the minus. */
      const perX = drag.box.w / Math.max(1, onThing.l);
      const perZ = drag.box.h / Math.max(1, onThing.w);
      const x = Math.round(drag.at.x + dx / Math.max(4, perX));
      const z = Math.round(drag.at.z - dy / Math.max(4, perZ));
      if (x !== onThing.x || z !== onThing.z) {
        onThing.x = x;
        onThing.z = z;
        emit();
      }
      place();
      return;
    }
    if (drag.what === "size") {
      /* Cells across, not pixels: the note is on squared paper and its width is
         a number of squares. How many pixels a square is depends on the camera,
         so the drag is measured against the box the note is drawn in. */
      const perCell = drag.box.w / Math.max(1, onThing.l);
      const want = Math.round(drag.wide0 + dx / Math.max(6, perCell));
      const wide = Math.max(NOTE_MIN_CELLS, Math.min(NOTE_MAX_CELLS, want));
      if (wide !== onThing.wide) {
        onThing.wide = wide;
        measure(onThing);
        emit();
      }
    }
    place();
  }

  function end(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const was = drag;
    drag = null;
    /* Nothing happened, so there is nothing to step back to. */
    if (onThing && !was.moved) store.history.pop();
    place();
  }

  bar.addEventListener("pointerdown", (e) => begin(e, "move"));
  grip.addEventListener("pointerdown", (e) => begin(e, "size"));
  for (const el of [bar, grip]) {
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  shut.addEventListener("pointerdown", (e) => e.stopPropagation());
  shut.addEventListener("click", (e) => {
    e.stopPropagation();
    if (onPanel) {
      /* Shut it the way the rail shuts it — by pressing the key that opened it.
         Hiding the element behind ui.js's back leaves that key still believing
         its panel is open, so the next press closes what is already closed and
         the panel seems not to come back at all. The rail names its panels by
         the tail of their id: #bb-fly-add is data-menu="add". */
      const menu = onPanel.id.replace(/^bb-(fly|pop)-/, "");
      const opener = document.querySelector(
        `[aria-controls="${onPanel.id}"], [data-menu="${menu}"]`);
      if (opener) opener.click();
      else onPanel.hidden = true;
      onPanel = null;
      kit.hidden = true;
      emit();
      return;
    }
    if (onThing) {
      snapshot();
      const gone = onThing;
      store.things = store.things.filter((t) => t.id !== gone.id);
      store.selection = new Set();
      onThing = null;
      kit.hidden = true;
      say(`${NAMES[gone.kind] || gone.variant || "That"} closed.`);
      emit();
    }
  });

  /* ── the mode itself ─────────────────────────────────────────────────────── */

  function refresh() {
    /* Never change what is being handled in the middle of handling it. */
    if (drag) { place(); return; }
    if (!store.pick) {
      if (onPanel || onThing) { onPanel = null; onThing = null; }
      kit.hidden = true;
      stage.classList.remove("is-picking");
      return;
    }
    stage.classList.add("is-picking");

    /* THE CARD IN YOUR HAND COMES FIRST. You picked it up; that is the whole
       gesture this tool is named after. A panel gets the handles only when your
       hands are empty, which is also the only time you would be reaching for
       one. */
    const card = heldThing();
    onThing = card;
    onPanel = card ? null : openPanel();
    const on = !!(onPanel || onThing);
    kit.hidden = !on;
    kit.dataset.on = onPanel ? "panel" : onThing ? "card" : "";
    /* No corner where a pull would mean nothing. */
    grip.hidden = !(onPanel || canSize(onThing));
    if (on) place();
  }

  /* Re-read every frame while the tool is on, not only when the store changes:
     opening a panel is DOM work that the store knows nothing about, so waiting
     for an emit would leave the handles behind on the card before it. */
  const obs = scene.onAfterRenderObservable.add(() => {
    if (store.pick) refresh();
    else if (!kit.hidden) place();
  });

  return {
    refresh,
    destroy() {
      scene.onAfterRenderObservable.remove(obs);
      kit.remove();
    },
  };
}
