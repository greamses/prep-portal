/* ============================================================================
   Manipulatives — pointer: pick, drag, marquee, tap
   ----------------------------------------------------------------------------
   Tap a thing to pick it up; Ctrl/Shift-tap to add it to the selection; drag a
   picked thing (or a whole picked group) and it slides across the canvas a whole
   cell at a time, never through anything else. Shift-drag on bare paper — or a
   drag in lasso mode — sweeps a box selection. Double-tap splits a block.

   Algebra tiles are the exception, because x is not a whole number of squares:
   they move freely and through each other, and js/snap.js decides where they
   actually land — flush against a neighbouring edge, or on the paper's own
   ruling, or exactly where the hand let go if the alt key is down.

   Beads and board faces are checked FIRST and never select: sliding a bead or
   tapping a times-table cell is what you meant, not picking the frame up. To
   move an abacus you grab its frame — the timbers, not the beads — which is
   what your hand would do.
   ========================================================================== */

import { store, snapshot, say, selectedItems } from "./state.js";
import { occupancy, fits, footprint } from "./layout.js";
import { snapMove } from "./snap.js";

const B = () => window.BABYLON;
/* What counts as a double-tap. Nearer the platform's own 500ms than the 320 it
   was: a double-tap is now how you open a note to write on it, and that is a
   deliberate, aimed gesture rather than a flick — on a touchscreen especially. */
const DOUBLE_MS = 450;

export function createPointer(ctx, view, canvas, hooks = {}) {
  const { scene, camera } = ctx;
  const onChange = hooks.onChange || (() => {});
  /* A double-tap means different things to different items — a block comes
     apart, a note opens to be written on — so the hook is told WHICH item it
     was and decides. */
  const onDouble = hooks.onDouble || (() => {});
  const onBead = hooks.onBead || (() => {});
  const onBoard = hooks.onBoard || (() => {});
  /* A press on a board face may be the start of dragging a counter about. The
     hook says whether there is anything to drag under the finger; if there is,
     the tap is held back until we know the finger stayed still. */
  const onFacePress = hooks.onFacePress || (() => null);
  const onFaceDragMove = hooks.onFaceDragMove || (() => {});
  const onFaceDrop = hooks.onFaceDrop || (() => {});
  /* What was let go of, and where. Algebra tiles laid over their opposites
     cancel on the drop, so the hook is told which items moved. */
  const onDrop = hooks.onDrop || (() => {});
  const marquee = hooks.marqueeEl || null;

  const TAP_SLOP = 7; // px a finger may wander and still count as a tap

  const state = {
    lasso: false, // touch-friendly "select with a box" mode
    pan: false,   // hand tool: every drag belongs to the camera
    drag: null,
    face: null,   // a counter being dragged across a chart
    sweep: null,
    lastTap: { id: null, at: 0 },
  };

  function localXY(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, rect: r };
  }

  function pickAny(x, y, test) {
    const hit = scene.pick(x, y, (m) => m.isPickable && test(m));
    return hit?.hit ? hit : null;
  }

  const isBead = (m) => !!m.metadata?.bead;
  const isFace = (m) => !!m.metadata?.boardFace;
  const isItem = (m) => m.metadata?.itemId != null && !m.metadata.boardFace;

  /** Where the pointer meets the paper, in canvas cells (may be fractional). */
  function groundCell(x, y) {
    const BJS = B();
    const ray = scene.createPickingRay(x, y, BJS.Matrix.Identity(), camera);
    const plane = BJS.Plane.FromPositionAndNormal(BJS.Vector3.Zero(), new BJS.Vector3(0, 1, 0));
    const d = ray.intersectsPlane(plane);
    if (d === null || d === undefined) return null;
    const p = ray.origin.add(ray.direction.scale(d));
    return { x: p.x, z: p.z };
  }

  /* ── selection ──────────────────────────────────────────────────────────── */

  function tapItem(id, additive) {
    if (additive) {
      if (store.selection.has(id)) store.selection.delete(id);
      else store.selection.add(id);
      return false; // an additive tap never starts a drag
    }
    if (!store.selection.has(id)) store.selection = new Set([id]);
    return true;
  }

  /* ── drag ───────────────────────────────────────────────────────────────── */

  function startDrag(cell) {
    const moving = selectedItems();
    if (!moving.length) return;
    const ids = new Set(moving.map((b) => b.id));
    state.drag = {
      origin: cell,
      moving,
      start: moving.map((b) => ({ id: b.id, x: b.x, z: b.z })),
      /* Copies of what is moving, left WHERE THE DRAG BEGAN. The snap is
         worked out by adding the move to these, never to the live pieces: the
         live ones have already been moved by every pointermove so far, and
         adding the move to them again would count it twice over. */
      ghosts: moving.map((b) => ({ ...b })),
      grid: occupancy(store.blocks.concat(store.things), ids),
      free: moving.every((b) => b.kind === "tile"),
      /* Everything a freely-moving piece could land against, worked out once at
         the start of the drag rather than on every pointermove. */
      others: store.blocks.concat(store.things).filter((b) => !ids.has(b.id)),
      moved: false,
      dx: 0,
      dz: 0,
    };
    camera.detachControl();
    canvas.style.cursor = "grabbing";
  }

  function dragTo(cell) {
    const d = state.drag;
    if (!d || !cell) return;

    /* Algebra tiles move FREELY: not a cell at a time, and not stopped by what
       is already there. They are meant to be pushed up against one another and
       laid over their opposites, and a piece that snaps to the paper's squares
       can do neither — x is not a whole number of squares. Everything else
       still moves a cell at a time and still goes round what is in the way. */
    let dx = d.free ? cell.x - d.origin.x : Math.round(cell.x - d.origin.x);
    let dz = d.free ? cell.z - d.origin.z : Math.round(cell.z - d.origin.z);

    /* A freely-moving piece is the one that can be a hair out, so it is the one
       snapping is for — the rest are already on the squares by construction.
       Held down, the alt key suspends it: sometimes a piece has to go exactly
       where you put it, and a snap you cannot switch off for a moment is a snap
       that gets in the way. */
    if (d.free && !d.raw) {
      const s = snapMove(d.ghosts, dx, dz, d.others);
      dx = s.dx;
      dz = s.dz;
    }
    if (dx === d.dx && dz === d.dz) return;

    const ok = d.free || d.start.every((s) => {
      const b = d.moving.find((m) => m.id === s.id);
      const f = footprint(b);
      return fits(d.grid, s.x + dx, s.z + dz, f.l, f.w, 0);
    });
    if (!ok) return;

    if (!d.moved) { snapshot(); d.moved = true; }
    d.dx = dx; d.dz = dz;
    for (const s of d.start) {
      const b = d.moving.find((m) => m.id === s.id);
      b.x = s.x + dx;
      b.z = s.z + dz;
      view.placeItem(b);
    }
  }

  function endDrag() {
    if (!state.drag) return;
    if (state.drag.moved) {
      onDrop(state.drag.moving);
      onChange({ animate: false });
    }
    state.drag = null;
    camera.attachControl(canvas, true);
    canvas.style.cursor = "";
  }

  /* ── marquee ────────────────────────────────────────────────────────────── */

  function startSweep(pt, additive) {
    state.sweep = { x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y, additive };
    camera.detachControl();
    if (marquee) {
      marquee.hidden = false;
      drawSweep();
    }
  }

  function drawSweep() {
    const s = state.sweep;
    if (!s || !marquee) return;
    marquee.style.left = Math.min(s.x0, s.x1) + "px";
    marquee.style.top = Math.min(s.y0, s.y1) + "px";
    marquee.style.width = Math.abs(s.x1 - s.x0) + "px";
    marquee.style.height = Math.abs(s.y1 - s.y0) + "px";
  }

  function endSweep() {
    const s = state.sweep;
    state.sweep = null;
    camera.attachControl(canvas, true);
    if (marquee) marquee.hidden = true;
    if (!s) return;
    if (Math.abs(s.x1 - s.x0) < 6 && Math.abs(s.y1 - s.y0) < 6) {
      if (!s.additive) store.selection = new Set();
      onChange();
      return;
    }
    const BJS = B();
    const engine = scene.getEngine();
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width / engine.getRenderWidth();
    const sy = rect.height / engine.getRenderHeight();
    const vp = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const x0 = Math.min(s.x0, s.x1), x1 = Math.max(s.x0, s.x1);
    const y0 = Math.min(s.y0, s.y1), y1 = Math.max(s.y0, s.y1);

    const picked = s.additive ? new Set(store.selection) : new Set();
    for (const b of store.blocks.concat(store.things)) {
      const mesh = view.meshOf(b.id);
      if (!mesh) continue;
      const at = mesh.getAbsolutePosition ? mesh.getAbsolutePosition() : mesh.position;
      const p = BJS.Vector3.Project(at, BJS.Matrix.Identity(), scene.getTransformMatrix(), vp);
      const px = p.x * sx, py = p.y * sy;
      if (px >= x0 && px <= x1 && py >= y0 && py <= y1) picked.add(b.id);
    }
    store.selection = picked;
    say(picked.size ? `${picked.size} selected.` : "Nothing in the box.");
    onChange();
  }

  /* ── events ─────────────────────────────────────────────────────────────── */

  function onDown(e) {
    if (e.button != null && e.button > 0) return; // let right/middle drag the camera
    if (state.pan) return; // hand tool on: the camera gets the drag, nothing is picked
    const pt = localXY(e);
    const additive = e.ctrlKey || e.shiftKey || e.metaKey;

    // a bead is always a bead
    const beadHit = pickAny(pt.x, pt.y, isBead);
    if (beadHit) { onBead(beadHit.pickedMesh.metadata.bead, e); return; }

    // so is a square of a table
    const faceHit = pickAny(pt.x, pt.y, isFace);
    if (faceHit) {
      const uv = faceHit.getTextureCoordinates();
      if (uv) {
        const id = faceHit.pickedMesh.metadata.itemId;
        const token = onFacePress(id, uv, e);
        if (token) {
          state.face = { token, id, uv, x0: pt.x, y0: pt.y, moved: false, e };
          camera.detachControl();
        } else {
          onBoard(id, uv, e);
        }
        return;
      }
    }

    const itemHit = pickAny(pt.x, pt.y, isItem);
    const id = itemHit ? view.itemIdOf(itemHit.pickedMesh) : null;

    if (id == null) {
      if (state.lasso || e.shiftKey) startSweep(pt, additive);
      return; // otherwise the camera keeps the drag
    }

    const now = performance.now();
    if (state.lastTap.id === id && now - state.lastTap.at < DOUBLE_MS) {
      state.lastTap = { id: null, at: 0 };
      store.selection = new Set([id]);
      onChange();
      onDouble(id);
      return;
    }
    state.lastTap = { id, at: now };

    const canDrag = tapItem(id, additive);
    onChange();
    if (canDrag) {
      const cell = groundCell(pt.x, pt.y);
      if (cell) startDrag(cell);
    }
  }

  function onMove(e) {
    const pt = localXY(e);
    if (state.drag) state.drag.raw = !!e.altKey;
    if (state.face) {
      const f = state.face;
      if (!f.moved && Math.hypot(pt.x - f.x0, pt.y - f.y0) > TAP_SLOP) f.moved = true;
      if (f.moved) {
        /* A drag that is going somewhere ON the face — sweeping an array out
           of a table — needs the SQUARE under the finger and not the screen
           point, so it is picked here. Only for a token that asked for it: a
           counter being carried about only needs to know where the ghost goes,
           and a ray cast every pointermove for nothing is a ray cast wasted. */
        const uv = f.token && f.token.track ? faceUV(pt) : null;
        onFaceDragMove(f.token, e.clientX, e.clientY, uv);
      }
      return;
    }
    if (state.sweep) {
      state.sweep.x1 = pt.x; state.sweep.y1 = pt.y;
      drawSweep();
      return;
    }
    if (state.drag) {
      dragTo(groundCell(pt.x, pt.y));
      return;
    }
    if (e.pointerType !== "touch") {
      if (state.pan) { canvas.style.cursor = "grab"; return; }
      const over = pickAny(pt.x, pt.y, (m) => isBead(m) || isFace(m) || isItem(m));
      canvas.style.cursor = over
        ? (isBead(over.pickedMesh) || isFace(over.pickedMesh) ? "pointer" : "grab")
        : state.lasso ? "crosshair" : "";
    }
  }

  function onUp(e) {
    if (state.face) endFace(e);
    if (state.sweep) endSweep();
    if (state.drag) endDrag();
  }

  /**
   * The end of a press on a board face. A finger that never moved was a tap
   * after all, so the tap is let through now; one that travelled is a drop, and
   * lands wherever it let go — which may be on another board or on bare paper.
   */
  function endFace(e) {
    const f = state.face;
    state.face = null;
    camera.attachControl(canvas, true);
    if (!f.moved) { onBoard(f.id, f.uv, f.e); return; }

    const pt = e ? localXY(e) : { x: f.x0, y: f.y0 };
    const hit = pickAny(pt.x, pt.y, isFace);
    const uv = hit ? hit.getTextureCoordinates() : null;
    onFaceDrop(f.token, uv ? hit.pickedMesh.metadata.itemId : null, uv);
  }

  /** The point on a board's face under this screen point, if there is one. */
  function faceUV(pt) {
    const hit = pickAny(pt.x, pt.y, isFace);
    return hit ? hit.getTextureCoordinates() : null;
  }

  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  return {
    /** Where a point on the stage meets the paper — for dropping things on it. */
    cellAt(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
      return groundCell(clientX - r.left, clientY - r.top);
    },
    get lasso() { return state.lasso; },
    setLasso(on) {
      state.lasso = !!on;
      canvas.style.cursor = on ? "crosshair" : "";
    },
    get pan() { return state.pan; },
    setPan(on) {
      state.pan = !!on;
      // a half-finished drag would otherwise keep running under the hand tool
      if (state.pan) { state.drag = null; state.sweep = null; state.face = null; }
      canvas.style.cursor = on ? "grab" : state.lasso ? "crosshair" : "";
    },
    destroy() {
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    },
  };
}
