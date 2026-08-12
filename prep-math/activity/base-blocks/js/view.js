/* ============================================================================
   Base Blocks — the 3D view
   ----------------------------------------------------------------------------
   One-way: the store says what exists, sync() makes the scene match. Meshes are
   created for new blocks (with a small pop), glided to their cell when they move,
   repainted when their colour changes and disposed when their block is gone.
   ========================================================================== */

import { cssVar } from "./config.js";
import { buildMesh, colourOf, glideTo, place, repaint, clearMaterials } from "./blocks.js";

const B = () => window.BABYLON;

export function createView(ctx) {
  const meshes = new Map(); // blockId → mesh

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
    const live = new Set();
    const outline = BJS.Color3.FromHexString(cssVar("--ink", "#2a2723"));

    for (const b of store.blocks) {
      live.add(b.id);
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
      if (live.has(id)) continue;
      ctx.shadows.removeShadowCaster(mesh);
      mesh.dispose();
      meshes.delete(id);
    }
  }

  /** After a theme flip: materials hold token colours, so rebuild them. */
  function retint(store) {
    clearMaterials();
    for (const b of store.blocks) {
      const mesh = meshes.get(b.id);
      if (!mesh) continue;
      repaint(ctx, mesh, b, store.base);
      mesh.metadata.colour = colourOf(b, store.base);
    }
    sync(store, { animate: false });
  }

  function blockIdOf(mesh) {
    return mesh?.metadata?.blockId ?? null;
  }

  function meshOf(id) {
    return meshes.get(id) || null;
  }

  return { sync, retint, blockIdOf, meshOf, meshes };
}
