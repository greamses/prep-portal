/* ============================================================================
   Manipulatives — bootstrap
   ----------------------------------------------------------------------------
   The shelf is plain HTML and costs nothing. Babylon is streamed the first time
   a card is pressed; after that the canvas stays alive behind the shelf, so
   going back and picking something else keeps whatever you had built.
   ========================================================================== */

import { CFG, placeDims } from "./config.js";
import { createEngine, createScene, retheme, fitView, setFlatView, paintMat } from "./scene.js";
import { createView } from "./view.js";
import { createPointer } from "./pointer.js";
import { createRegroupPrompt } from "./prompt.js";
import { mountUI, paintIcons } from "./ui.js";
import { buildShelf, createCanvasView, buildDock } from "./shell.js";
import { store, subscribe, emit, say, nextId } from "./state.js";
import { splitSelected, addPlace, addThing } from "./ops.js";
import { ICON } from "./icons.js";
import { occupancy, findSpot, mark } from "./layout.js";
import { makeAbacus, tapBead, abacusValue } from "./abacus.js";
import { makeBoard, tapBoard, toggleCell, placeReading, placeSentence } from "./grids.js";

const BABYLON_URL = "https://cdn.jsdelivr.net/npm/babylonjs@7/babylon.js";

const shelfEl = document.getElementById("bb-shelf");
const viewEl = document.getElementById("bb-canvas-view");
const stage = viewEl.querySelector(".bb-stage");
const frame = viewEl.querySelector(".bb-frame");
const canvas = document.getElementById("bb-canvas");

let engine = null;
let ctx = null;
let view = null;
let ui = null;
let pointer = null;
let booting = null;

/* ── a veil while the engine downloads ────────────────────────────────────── */
function veilOn(text = "Setting out the canvas…") {
  let v = stage.querySelector(".bb-veil");
  if (!v) {
    v = document.createElement("div");
    v.className = "bb-veil";
    stage.appendChild(v);
  }
  v.innerHTML = `<span class="bb-veil__spin"></span><p>${text}</p>`;
  return v;
}
function veilOff() {
  stage.querySelector(".bb-veil")?.remove();
}

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

/* ── corner controls ──────────────────────────────────────────────────────── */
function mountCornerControls() {
  const fit = document.createElement("button");
  fit.type = "button";
  fit.className = "gv-fs-btn bb-fit";
  fit.setAttribute("aria-label", "Fit everything in view");
  fit.title = "Fit the view";
  fit.innerHTML = ICON.fit;
  fit.addEventListener("click", () => fitView(ctx, store.blocks.concat(store.things)));
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
      /* fullscreen can be blocked; the inline canvas still works */
    }
  });
  const onChange = () => {
    frame.classList.toggle("is-full", !!isFull());
    setTimeout(() => engine.resize(), 60);
  };
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange);
}

/* ── a starter set so the blocks canvas is never a blank sheet ────────────── */
function seedBlocks() {
  if (store.blocks.length) return;
  const b = store.base;
  const start = [
    placeDims("flat", b),
    placeDims("rod", b),
    placeDims("rod", b),
    placeDims("unit", b),
    placeDims("unit", b),
    placeDims("unit", b),
  ];
  const grid = occupancy(store.blocks.concat(store.things));
  for (const d of start) {
    const spot = findSpot(grid, d.l, d.w);
    if (!spot) continue;
    mark(grid, spot.x, spot.z, d.l, d.w);
    store.blocks.push({ id: nextId(), ...d, x: spot.x, z: spot.z, tag: null });
  }
  say("One flat, two rods and three units — that is 123. Try splitting the flat.");
}

/* ── what a card does ─────────────────────────────────────────────────────── */
function placeTool(tool) {
  if (!tool) return;
  store.tool = tool.id;
  store.group = tool.group || store.group;

  if (tool.kind === "blocks") {
    seedBlocks();
    return;
  }
  if (tool.kind === "abacus") {
    const thing = addThing(makeAbacus(tool.variant));
    say(`${tool.label} — tap a bead to slide it against the bar.`);
    fitView(ctx, [thing]);
    return;
  }
  const thing = addThing(makeBoard(tool.variant, store.base));
  say(
    tool.variant === "place"
      ? "Place-value chart — stand blocks in the columns and it reads them back."
      : `${tool.label} — tap a square to light its row and column.`
  );
  fitView(ctx, [thing]);
}

/* ── boot the 3D side once ────────────────────────────────────────────────── */
async function bootCanvas() {
  if (ctx) return true;
  if (booting) return booting;

  booting = (async () => {
    veilOn();
    try {
      await loadBabylon();
    } catch (err) {
      veilOn("The 3D canvas could not load. Check your connection and refresh.");
      return false;
    }

    engine = createEngine(canvas);
    ctx = createScene(engine, canvas);
    view = createView(ctx);

    pointer = createPointer(ctx, view, canvas, {
      onChange: () => emit(),
      onSplit: () => { splitSelected(); emit(); },
      onBead: (ref) => {
        const thing = store.things.find((t) => t.id === ref.thingId);
        if (!thing) return;
        if (tapBead(thing, ref)) {
          say(`${abacusValue(thing)}`);
          emit();
        }
      },
      onBoard: (id, uv, e) => {
        const thing = store.things.find((t) => t.id === id);
        if (!thing) return;
        if (thing.variant === "place") {
          say(placeSentence(placeReading(thing, store.blocks, store.base), store.base));
          emit();
          return;
        }
        // a plain tap reads the fact; hold shift to blank the square out
        const done = e && (e.shiftKey || e.ctrlKey)
          ? toggleCell(thing, uv) && { changed: true, message: "Square hidden — tap it again to bring it back." }
          : tapBoard(thing, uv, store.base);
        if (done && done.changed) {
          if (done.message) say(done.message, "ok");
          emit();
        }
      },
      marqueeEl: document.getElementById("bb-marquee"),
    });

    ui = mountUI({
      pointer,
      stage,
      onFit: () => fitView(ctx, store.blocks.concat(store.things)),
      onFlat: (on) => setFlatView(ctx, on),
    });

    buildDock(
      document.getElementById("bb-dock-tabs"),
      document.getElementById("bb-dock-panel"),
      {
        onPiece: (p) => { addPlace(p); emit(); },
        onOwn: (btn) => ui.openOwn(btn),
        onPlace: (tool) => { placeTool(tool); emit(); },
        onPaint: () => { paintIcons(document); ui.update(); },
      }
    ).paint(store.group);

    mountCornerControls();

    const trade = createRegroupPrompt(ctx, view, stage);
    subscribe((s) => { view.sync(s); trade.refresh(); });

    // keep the paper and the piece colours in step with a light/dark switch
    new MutationObserver(() => {
      retheme(ctx);
      view.retint(store);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // the paper's bold lines follow the working base
    let lastBase = store.base;
    subscribe((s) => {
      if (s.base === lastBase) return;
      lastBase = s.base;
      paintMat(ctx, s.base);
    });

    ctx.camera.setTarget(new window.BABYLON.Vector3(0, 1.5, 0));
    ctx.camera.radius = CFG.camera.radius;

    engine.runRenderLoop(() => ctx.scene.render());
    new ResizeObserver(() => engine.resize()).observe(stage);
    window.addEventListener("resize", () => engine.resize());

    veilOff();
    return true;
  })();

  return booting;
}

/* ── the shelf ────────────────────────────────────────────────────────────── */

const canvasView = createCanvasView(viewEl, {
  onOpen: () => setTimeout(() => engine?.resize(), 40),
});

buildShelf(shelfEl, async (tool) => {
  canvasView.show();
  const ok = await bootCanvas();
  if (!ok) return;
  engine.resize();
  placeTool(tool);
  emit();
  document.querySelector(`[data-group='${tool.group}']`)?.click();
});

document.getElementById("bb-back").addEventListener("click", () => canvasView.hide());
paintIcons(document);
