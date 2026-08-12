/* ============================================================================
   Base Blocks — bootstrap
   ----------------------------------------------------------------------------
   Streams Babylon from the CDN, builds the mat, then hands the store to the view
   (3D), the pointer (picking and dragging) and the panel (controls + readout).
   ========================================================================== */

import { CFG, placeDims } from "./config.js";
import { createEngine, createScene, retheme, fitView } from "./scene.js";
import { createView } from "./view.js";
import { createPointer } from "./pointer.js";
import { mountUI, paintIcons } from "./ui.js";
import { store, subscribe, emit, say, nextId } from "./state.js";
import { splitSelected } from "./ops.js";
import { ICON } from "./icons.js";
import { occupancy, findSpot, mark } from "./layout.js";

const BABYLON_URL = "https://cdn.jsdelivr.net/npm/babylonjs@7/babylon.js";

const stage = document.querySelector(".bb-stage");
const frame = document.querySelector(".bb-frame");
const canvas = document.getElementById("bb-canvas");

/* ── a small in-stage veil while the engine downloads ─────────────────────── */
const veil = document.createElement("div");
veil.className = "bb-veil";
veil.innerHTML = `<span class="bb-veil__spin"></span><p>Setting out the blocks…</p>`;
stage.appendChild(veil);

function loadBabylon() {
  if (window.BABYLON) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = BABYLON_URL;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ── corner controls (reuse the shared .gv-fs-btn look) ───────────────────── */
function mountCornerControls(engine, ctx) {
  const fit = document.createElement("button");
  fit.type = "button";
  fit.className = "gv-fs-btn bb-fit";
  fit.setAttribute("aria-label", "Fit every block in view");
  fit.title = "Fit the view";
  fit.innerHTML = ICON.fit;
  fit.addEventListener("click", () => fitView(ctx, store.blocks));
  stage.appendChild(fit);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "gv-fs-btn bb-fs";
  btn.setAttribute("aria-label", "Toggle fullscreen");
  btn.innerHTML = ICON.expand;
  stage.appendChild(btn);

  const isFull = () => document.fullscreenElement || document.webkitFullscreenElement;
  btn.addEventListener("click", async () => {
    try {
      if (isFull()) await (document.exitFullscreen?.() ?? document.webkitExitFullscreen?.());
      else await (frame.requestFullscreen?.() ?? frame.webkitRequestFullscreen?.());
    } catch (err) {
      /* fullscreen can be blocked; the inline stage still works */
    }
  });
  const onChange = () => {
    frame.classList.toggle("is-full", !!isFull());
    setTimeout(() => engine.resize(), 60);
  };
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange);
}

/* ── a starter mat so the page is never a blank sheet ─────────────────────── */
function seed() {
  const b = store.base;
  const start = [
    placeDims("flat", b),
    placeDims("rod", b),
    placeDims("rod", b),
    placeDims("unit", b),
    placeDims("unit", b),
    placeDims("unit", b),
  ];
  const grid = occupancy(store.blocks);
  for (const d of start) {
    const spot = findSpot(grid, d.l, d.w);
    if (!spot) continue;
    mark(grid, spot.x, spot.z, d.l, d.w);
    store.blocks.push({ id: nextId(), ...d, x: spot.x, z: spot.z, tag: null });
  }
  say("One flat, two rods and three units — that is 123. Try splitting the flat.");
}

async function boot() {
  paintIcons(document);
  try {
    await loadBabylon();
  } catch (err) {
    veil.innerHTML = `<p>The 3D blocks could not load. Check your connection and refresh.</p>`;
    return;
  }

  const engine = createEngine(canvas);
  const ctx = createScene(engine, canvas);
  const view = createView(ctx);

  const pointer = createPointer(ctx, view, canvas, {
    onChange: () => emit(),
    onSplit: () => { splitSelected(); emit(); },
    marqueeEl: document.getElementById("bb-marquee"),
  });

  mountUI({ pointer, stage, onFit: () => fitView(ctx, store.blocks) });
  mountCornerControls(engine, ctx);

  subscribe((s) => view.sync(s));

  // keep the mat and the block colours in step with a light/dark switch
  new MutationObserver(() => {
    retheme(ctx);
    view.retint(store);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // frame the mat: pull the camera back far enough to see a whole cube
  ctx.camera.setTarget(new window.BABYLON.Vector3(0, 1.5, 0));
  ctx.camera.radius = CFG.camera.radius;

  seed();
  emit();

  engine.runRenderLoop(() => ctx.scene.render());

  const ro = new ResizeObserver(() => engine.resize());
  ro.observe(stage);
  window.addEventListener("resize", () => engine.resize());

  veil.remove();
}

boot();
