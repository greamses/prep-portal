/* ============================================================================
   Manipulatives — the 3D view
   ----------------------------------------------------------------------------
   One-way: the store says what exists, sync() makes the scene match. Meshes are
   created for new items (with a small pop), glided to their cell when they move,
   repainted when their colour changes and disposed when their item is gone.
   Blocks, abacus frames and chart boards all go through the same pass.
   ========================================================================== */

import { cssVar } from "./config.js";
import { buildMesh, colourOf, glideTo, place, repaint, clearMaterials } from "./blocks.js";
import { buildAbacus, placeAbacus, syncAbacus, clearAbacusMaterials } from "./abacus.js";
import { buildBoard, placeBoard, paintBoard, placeReading } from "./grids.js";

const B = () => window.BABYLON;

export function createView(ctx) {
  const meshes = new Map(); // blockId → mesh
  const rigs = new Map();   // thingId → { parts, kind }

  function pop(mesh) {
    const BJS = B();
    const to = mesh.scaling.clone();
    mesh.scaling = new BJS.Vector3(0.01, 0.01, 0.01);
    BJS.Animation.CreateAndStartAnimation(
      "pop", mesh, "scaling", 60, 11,
      mesh.scaling.clone(), to,
      BJS.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
  }

  function sync(store, { animate = true } = {}) {
    const BJS = B();
    const outline = BJS.Color3.FromHexString(cssVar("--ink", "#2a2723"));
    const glow = BJS.Color3.FromHexString(cssVar("--accent-secondary", "#6fb7e8"));

    /* ── blocks ─────────────────────────────────────────────────────────── */
    const liveBlocks = new Set();
    for (const b of store.blocks) {
      liveBlocks.add(b.id);
      let mesh = meshes.get(b.id);
      if (!mesh) {
        mesh = buildMesh(ctx, b, store.base);
        meshes.set(b.id, mesh);
        if (animate) pop(mesh);
      } else {
        const want = colourOf(b, store.base);
        if (mesh.metadata.colour !== want) repaint(ctx, mesh, b, store.base);
        if (animate) glideTo(ctx, mesh, b);
        else place(mesh, b);
      }
      mesh.metadata.colour = colourOf(b, store.base);

      const on = store.selection.has(b.id);
      mesh.renderOutline = on;
      mesh.outlineColor = outline;
      mesh.outlineWidth = 0.055;
    }
    for (const [id, mesh] of meshes) {
      if (liveBlocks.has(id)) continue;
      ctx.shadows.removeShadowCaster(mesh);
      mesh.dispose();
      meshes.delete(id);
    }

    /* ── abacus frames and chart boards ─────────────────────────────────── */
    const liveThings = new Set();
    for (const t of store.things) {
      liveThings.add(t.id);
      let rig = rigs.get(t.id);
      /* A chart that has grown or shrunk is a different size of slab with a
         different size of texture on it, so the rig is built again rather than
         repainted — the mesh itself changed, not just what is drawn on it. */
      if (rig && rig.places !== (t.places ?? null)) {
        disposeRig(rig);
        rigs.delete(t.id);
        rig = null;
      }
      if (!rig) {
        const parts = t.kind === "abacus"
          ? buildAbacus(ctx, t)
          : buildBoard(ctx, t, store.base);
        rig = { parts, kind: t.kind, signature: "", places: t.places ?? null };
        rigs.set(t.id, rig);
      }

      if (t.kind === "abacus") {
        placeAbacus(rig.parts, t);
        syncAbacus(t, rig.parts, animate);
      } else {
        placeBoard(rig.parts, t);
        const sig = boardSignature(t, store);
        if (sig !== rig.signature) {
          rig.signature = sig;
          paintBoard(t, rig.parts, {
            base: store.base,
            reading: t.variant === "place"
              ? placeReading(t, store.blocks, store.base)
              : null,
          });
        }
      }

      /* A frame or a board is picked out with a glow, NOT the outline blocks
         use: the outline renderer inflates the mesh along its normals, and on a
         slab 2mm under its own printed face that shell swallows the table. */
      const on = store.selection.has(t.id);
      const body = t.kind === "abacus" ? rig.parts.frame : rig.parts.slab;
      if (body && rig.lit !== on) {
        rig.lit = on;
        if (on) ctx.highlight.addMesh(body, glow);
        else ctx.highlight.removeMesh(body);
      }
    }
    for (const [id, rig] of rigs) {
      if (liveThings.has(id)) continue;
      disposeRig(rig);
      rigs.delete(id);
    }
  }

  /* What a board's drawn face depends on — redraw only when this changes. */
  function boardSignature(t, store) {
    if (t.variant !== "place") {
      return [t.variant, (t.hidden || []).join("|"), JSON.stringify(t.focus || null)].join("~");
    }
    const r = placeReading(t, store.blocks, store.base);
    return ["place", store.base, t.places, r.digits.join(","), r.strays,
      (t.counters || []).join(",")].join("~");
  }

  function disposeRig(rig) {
    rig.parts.root.getChildMeshes().forEach((m) => {
      ctx.shadows.removeShadowCaster(m);
      if (rig.lit) ctx.highlight.removeMesh(m);
      m.dispose();
    });
    rig.parts.root.dispose();
    rig.parts.tex?.dispose();
  }

  /** After a theme flip: materials hold token colours, so rebuild them. */
  function retint(store) {
    clearMaterials();
    clearAbacusMaterials();
    for (const b of store.blocks) {
      const mesh = meshes.get(b.id);
      if (!mesh) continue;
      repaint(ctx, mesh, b, store.base);
      mesh.metadata.colour = colourOf(b, store.base);
    }
    for (const [, rig] of rigs) disposeRig(rig);
    rigs.clear();
    sync(store, { animate: false });
  }

  function itemIdOf(mesh) {
    return mesh?.metadata?.itemId ?? null;
  }

  function meshOf(id) {
    return meshes.get(id) || rigs.get(id)?.parts.root || null;
  }

  function rigOf(id) {
    return rigs.get(id) || null;
  }

  /** Snap an item's meshes to its cell — used while dragging, so no easing. */
  function placeItem(item) {
    const mesh = meshes.get(item.id);
    if (mesh) { place(mesh, item); return; }
    const rig = rigs.get(item.id);
    if (!rig) return;
    if (rig.kind === "abacus") placeAbacus(rig.parts, item);
    else placeBoard(rig.parts, item);
  }

  return { sync, retint, itemIdOf, meshOf, rigOf, placeItem, meshes, rigs };
}
