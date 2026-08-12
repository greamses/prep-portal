/* ============================================================================
   Base Blocks — pointer: pick, drag, marquee
   ----------------------------------------------------------------------------
   Tap a block to pick it up; Ctrl/Shift-tap to add it to the selection; drag a
   picked block (or a whole picked group) and it slides across the mat a whole
   cell at a time, never through another block. Shift-drag on bare paper — or a
   drag in lasso mode — sweeps a box selection. Double-tap splits.
   ========================================================================== */

import { CFG } from "./config.js";
import { store, snapshot, say } from "./state.js";
import { occupancy, fits } from "./layout.js";
import { place } from "./blocks.js";

const B = () => window.BABYLON;
const DOUBLE_MS = 320;

export function createPointer(ctx, view, canvas, hooks = {}) {
  const { scene, camera } = ctx;
  const onChange = hooks.onChange || (() => {});
  const onSplit = hooks.onSplit || (() => {});
  const marquee = hooks.marqueeEl || null;

  const state = {
    lasso: false, // touch-friendly "select with a box" mode
    drag: null,
    sweep: null,
    lastTap: { id: null, at: 0 },
  };

  function localXY(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, rect: r };
  }

  function pickBlock(x, y) {
    const hit = scene.pick(x, y, (m) => m.isPickable && m.metadata && m.metadata.blockId != null);
    if (!hit?.hit || !hit.pickedMesh) return null;
    return view.blockIdOf(hit.pickedMesh);
  }

  /** Where the pointer meets the mat plane, in mat cells (may be fractional). */
  function groundCell(x, y) {
    const BJS = B();
    const ray = scene.createPickingRay(x, y, BJS.Matrix.Identity(), camera);
    const plane = BJS.Plane.FromPositionAndNormal(BJS.Vector3.Zero(), new BJS.Vector3(0, 1, 0));
    const d = ray.intersectsPlane(plane);
    if (d === null || d === undefined) return null;
    const p = ray.origin.add(ray.direction.scale(d));
    return { x: p.x + CFG.mat / 2, z: p.z + CFG.mat / 2 };
  }

  /* ── selection ──────────────────────────────────────────────────────────── */

  function tapBlock(id, additive) {
    if (additive) {
      if (store.selection.has(id)) store.selection.delete(id);
      else store.selection.add(id);
      return false; // an additive tap never starts a drag
    }
    if (!store.selection.has(id)) store.selection = new Set([id]);
    return true;
  }

  /* ── drag ───────────────────────────────────────────────────────────────── */

  function startDrag(id, cell) {
    const ids = [...store.selection];
    const moving = store.blocks.filter((b) => ids.includes(b.id));
    if (!moving.length) return;
    state.drag = {
      origin: cell,
      moving,
      start: moving.map((b) => ({ id: b.id, x: b.x, z: b.z })),
      grid: occupancy(store.blocks, new Set(ids)),
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
    const dx = Math.round(cell.x - d.origin.x);
    const dz = Math.round(cell.z - d.origin.z);
    if (dx === d.dx && dz === d.dz) return;

    const ok = d.start.every((s) => {
      const b = d.moving.find((m) => m.id === s.id);
      return fits(d.grid, s.x + dx, s.z + dz, b.l, b.w, 0);
    });
    if (!ok) return;

    if (!d.moved) { snapshot(); d.moved = true; }
    d.dx = dx; d.dz = dz;
    for (const s of d.start) {
      const b = d.moving.find((m) => m.id === s.id);
      b.x = s.x + dx;
      b.z = s.z + dz;
      const mesh = view.meshOf(b.id);
      if (mesh) place(mesh, b);
    }
  }

  function endDrag() {
    if (!state.drag) return;
    if (state.drag.moved) onChange({ animate: false });
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
    for (const b of store.blocks) {
      const mesh = view.meshOf(b.id);
      if (!mesh) continue;
      const p = BJS.Vector3.Project(mesh.position, BJS.Matrix.Identity(), scene.getTransformMatrix(), vp);
      const px = p.x * sx, py = p.y * sy;
      if (px >= x0 && px <= x1 && py >= y0 && py <= y1) picked.add(b.id);
    }
    store.selection = picked;
    say(picked.size ? `${picked.size} block${picked.size === 1 ? "" : "s"} selected.` : "Nothing in the box.");
    onChange();
  }

  /* ── events ─────────────────────────────────────────────────────────────── */

  function onDown(e) {
    if (e.button != null && e.button > 0) return; // let right/middle drag the camera
    const pt = localXY(e);
    const id = pickBlock(pt.x, pt.y);
    const additive = e.ctrlKey || e.shiftKey || e.metaKey;

    if (id == null) {
      if (state.lasso || e.shiftKey) startSweep(pt, additive);
      return; // otherwise the camera keeps the drag
    }

    const now = performance.now();
    if (state.lastTap.id === id && now - state.lastTap.at < DOUBLE_MS) {
      state.lastTap = { id: null, at: 0 };
      store.selection = new Set([id]);
      onChange();
      onSplit();
      return;
    }
    state.lastTap = { id, at: now };

    const canDrag = tapBlock(id, additive);
    onChange();
    if (canDrag) {
      const cell = groundCell(pt.x, pt.y);
      if (cell) startDrag(id, cell);
    }
  }

  function onMove(e) {
    const pt = localXY(e);
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
      canvas.style.cursor = pickBlock(pt.x, pt.y) != null ? "grab" : state.lasso ? "crosshair" : "";
    }
  }

  function onUp() {
    if (state.sweep) endSweep();
    if (state.drag) endDrag();
  }

  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  return {
    get lasso() { return state.lasso; },
    setLasso(on) {
      state.lasso = !!on;
      canvas.style.cursor = on ? "crosshair" : "";
    },
    destroy() {
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    },
  };
}
