/* ============================================================================
   ONE ABACUS, ON ITS OWN
   ----------------------------------------------------------------------------
   The counting frames live on the Manipulatives canvas, where they sit on the
   paper beside blocks and tiles and charts. This mounts ONE of them, on its
   own little canvas, so a workbook can open a frame beside a question the way
   it opens a long division board — the same frames, the same beads, the same
   arithmetic, because everything here comes out of abacus.js rather than being
   drawn again.

   It owns nothing but its canvas: an engine, a scene, one frame. Closing the
   panel disposes the lot.
   ========================================================================== */

import { createEngine, createScene, setFlatView } from "./scene.js";
import {
  SPECS, makeAbacus, buildAbacus, syncAbacus, tapBead,
  abacusValue, setAbacusValue, clearAbacus, worksInBase, abacusSentence,
} from "./abacus.js";

const BABYLON_URL = "https://cdn.jsdelivr.net/npm/babylonjs@7/babylon.js";

/** The frames, in the order they are offered. */
export const FRAMES = [
  { id: "soroban", label: "Soroban", hint: "Japanese — one bead worth five, four worth one" },
  { id: "suanpan", label: "Suanpan", hint: "Chinese — two fives above the bar, five ones below" },
  { id: "schoty", label: "Schoty", hint: "Russian — ten to a wire, and it counts in any base" },
];

/** How many rods a frame may be built with — how many places it can hold. */
export const RODS = [5, 7, 9, 11, 13, 15];

let loading = null;
function loadBabylon() {
  if (window.BABYLON) return Promise.resolve();
  /* One fetch even if two panels open at once — the second waits on the first
     rather than pulling the library down again. */
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = BABYLON_URL;
    s.onload = resolve;
    s.onerror = () => { loading = null; reject(new Error("Babylon did not load")); };
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * Put one counting frame in `host`.
 *
 *   variant   soroban | suanpan | schoty
 *   base      the base it counts in (only the schoty travels)
 *   rods      how many places it holds
 *   onRead    called with { value, sentence } whenever a bead moves
 *
 * → { setVariant, setRods, setBase, setValue, clear, read, dispose }
 */
export async function mountAbacus(host, { variant = "soroban", base = 10, rods = 9, onRead = null } = {}) {
  await loadBabylon();

  const canvas = document.createElement("canvas");
  canvas.className = "ab-canvas";
  canvas.setAttribute("touch-action", "none");
  host.appendChild(canvas);

  const engine = createEngine(canvas);
  const ctx = createScene(engine, canvas);

  let thing = null;
  let parts = null;
  let now = { variant, base, rods };

  /* Swing the camera out far enough to see the whole frame, however wide it
     has been built — a fifteen-rod schoty is nearly twice a soroban. */
  function frame() {
    /* Fit the WHOLE instrument, not just its span. A fifteen-rod schoty is
       wide; an upright frame is deep; and the panel it sits in is wider than
       it is tall — so the camera has to answer to the frame's depth and to the
       shape of the box it is being seen through, or the bottom of the frame is
       cut off by the edge of the panel. */
    const { width, depth } = parts.size;
    const aspect = Math.max(0.4, engine.getAspectRatio(ctx.camera) || 1.4);
    /* Work out the distance from what the camera can actually SEE rather than
       from a multiplier that happened to look right once: at distance r the
       view is 2·r·tan(fov/2) tall and that again times the aspect wide. The
       frame is seen from above at a slant, so its depth foreshortens. */
    const half = Math.tan((ctx.camera.fov || 0.8) / 2);
    /* Seen from above at a slant the frame occupies, at worst, its own full
       span in BOTH directions — a guessed foreshortening factor put a
       fifteen-rod schoty through the bottom of the panel. Take the diagonal
       and fit that, which cannot be too small whichever way the frame runs. */
    const span = Math.hypot(width, depth);
    const needTall = span / (2 * half);
    const needWide = span / (2 * half * aspect);
    ctx.camera.setTarget(new window.BABYLON.Vector3(0, 1, 0));
    // and a tenth again, so nothing sits hard against the edge
    ctx.camera.radius = Math.max(14, Math.max(needTall, needWide) * 1.1);
    /* Flat view owns the angles — it animates them and then pins them — so
       while it is on, only the distance is set here. */
    if (!ctx.flat) {
      ctx.camera.alpha = -Math.PI / 2;
      ctx.camera.beta = 0.86;
    }
  }

  function build() {
    if (parts) {
      parts.root.dispose(false, true);
      parts.tex?.dispose();
      parts.readMat?.dispose();
    }
    /* The schoty is the only frame that counts outside base ten, so a base the
       chosen frame cannot hold quietly becomes ten — the same rule the canvas
       follows. */
    const own = worksInBase(now.variant, now.base) ? now.base : 10;
    thing = makeAbacus(now.variant, own, now.rods);
    parts = buildAbacus(ctx, thing);

    /* No turning here any more: the schoty stands up like the other two in
       abacus.js itself, so the canvas and this panel agree. Turning it in the
       wrapper only ever fixed the panel. */

    frame();
    tell();
  }

  function tell() {
    if (onRead) onRead({ value: abacusValue(thing), sentence: abacusSentence(thing) });
  }

  build();

  /* A bead carries which rod and tier it belongs to, so a tap needs no
     arithmetic — see buildAbacus. */
  ctx.scene.onPointerDown = (_evt, hit) => {
    const bead = hit?.pickedMesh?.metadata?.bead;
    if (!bead) return;
    if (tapBead(thing, bead)) {
      syncAbacus(thing, parts);
      tell();
    }
  };

  engine.runRenderLoop(() => ctx.scene.render());

  const grow = new ResizeObserver(() => {
    engine.resize();
    /* the shape of the box changed, so what fits in it changed */
    if (parts) frame();
  });
  grow.observe(host);

  const api = {
    canvas,
    setVariant(v) {
      if (!SPECS[v] || v === now.variant) return;
      now.variant = v;
      build();
    },
    setRods(n) {
      const want = Math.max(3, Math.min(24, Math.round(n)));
      if (want === now.rods) return;
      now.rods = want;
      build();
    },
    setBase(b) {
      if (b === now.base) return;
      now.base = b;
      build();
    },
    /* 2D or 3D — the same flattening the manipulatives canvas does, for when
       the perspective is in the way of counting beads. */
    setFlat(on) {
      setFlatView(ctx, !!on);
      frame();
    },
    isFlat: () => !!ctx.flat,
    /* What the view is actually doing — the camera's own numbers, and where a
       bead really is in the world. Guessing at either from a screenshot is how
       a "fixed" frame stayed broken. */
    view() {
      const m = parts.beads[0];
      m.computeWorldMatrix(true);
      const at = m.getAbsolutePosition();
      /* EVERY bead, not the first one: a value of 3 moves the units rod, which
         is the LAST rod, so watching bead nought says "nothing moved" about a
         frame that moved perfectly well. */
      const beads = parts.beads.map((k) => {
        k.computeWorldMatrix(true);
        const q = k.getAbsolutePosition();
        return { x: +q.x.toFixed(2), y: +q.y.toFixed(2), z: +q.z.toFixed(2) };
      });
      return {
        variant: now.variant,
        flat: !!ctx.flat,
        mode: ctx.camera.mode,            // 0 perspective, 1 orthographic
        beta: +ctx.camera.beta.toFixed(3),
        alpha: +ctx.camera.alpha.toFixed(3),
        radius: +ctx.camera.radius.toFixed(1),
        hubY: +parts.hub.rotation.y.toFixed(3),
        size: { w: +parts.size.width.toFixed(1), d: +parts.size.depth.toFixed(1) },
        // in the flat view the camera shows a box this tall, so the frame
        // should be a decent share of it and not a speck in the middle
        orthoH: +(ctx.camera.radius).toFixed(1),
        bead0: { x: +at.x.toFixed(2), y: +at.y.toFixed(2), z: +at.z.toFixed(2) },
        beads,
      };
    },
    setValue(n) {
      const ok = setAbacusValue(thing, n);
      syncAbacus(thing, parts);
      tell();
      return ok;
    },
    clear() {
      clearAbacus(thing);
      syncAbacus(thing, parts);
      tell();
    },
    read: () => ({ value: abacusValue(thing), sentence: abacusSentence(thing), rods: now.rods, variant: now.variant }),
    dispose() {
      grow.disconnect();
      engine.stopRenderLoop();
      ctx.scene.dispose();
      engine.dispose();
      canvas.remove();
    },
  };

  /* The canvas carries its own frame, the way a drawn pile carries its own
     blocks — so anything holding the element can ask it what it is doing. */
  canvas.__abacus = api;
  return api;
}
