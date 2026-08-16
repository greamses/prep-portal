/* ============================================================================
   Manipulatives — bootstrap
   ----------------------------------------------------------------------------
   The shelf is plain HTML and costs nothing. Babylon is streamed the first time
   a card is pressed; after that the canvas stays alive behind the shelf, so
   going back and picking something else keeps whatever you had built.
   ========================================================================== */

import { CFG, placeDims } from "./config.js";
import {
  createEngine, createScene, retheme, fitView, setFlatView, paintMat,
  zoomBy, panBy, setPanTool,
} from "./scene.js";
import { createView } from "./view.js";
import { createPointer } from "./pointer.js";
import { createRegroupPrompt } from "./prompt.js";
import { mountUI, paintIcons } from "./ui.js";
import { buildShelf, createCanvasView, buildDock } from "./shell.js";
import { store, subscribe, emit, say, nextId, snapshot } from "./state.js";
import { splitSelected, addPlace, addThing, rotateSelected } from "./ops.js";
import { createTurnHandle } from "./turn.js";
import { ICON } from "./icons.js";
import { occupancy, findSpot, mark } from "./layout.js";
import { makeAbacus, tapBead, abacusValue } from "./abacus.js";
import {
  makeBoard, tapBoard, tapPlace, toggleCell,
  hitPlace, moveCounter, dropCounter, counterColour,
} from "./grids.js";
import { createDotGhost } from "./dots.js";

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
const ghost = createDotGhost(stage);

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

/** A quarter turn, from the handle on the canvas or from the Q key. */
function doTurn() {
  if (rotateSelected()) emit();
}

/* ── the hand tool ────────────────────────────────────────────────────────── */

let handOn = false;
let handBtn = null;

/**
 * Turn dragging-to-slide on or off. Two things have to agree: the camera (which
 * button pans) and the pointer layer (which must stop picking things up), so
 * they are never set apart from each other.
 */
function setHand(on) {
  handOn = !!on;
  setPanTool(ctx, handOn);
  pointer.setPan(handOn);
  if (handBtn) {
    handBtn.classList.toggle("is-on", handOn);
    handBtn.setAttribute("aria-pressed", String(handOn));
  }
  say(handOn ? "Hand tool on — drag to slide the paper." : "Hand tool off.");
}

/* ── the View kit ─────────────────────────────────────────────────────────── */
function mountViewKit() {
  /* These live in the rail with everything else rather than in a pad of their
     own in the far corner: they are one more group of controls, and two boxes
     of buttons on one canvas was one box too many. */
  const grid = document.getElementById("bb-kit-view");

  const add = (cls, label, title, icon, onClick) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "bb-tool " + cls;
    b.setAttribute("aria-label", label);
    b.title = title;
    b.innerHTML = `<span>${icon}</span><em>${label.split(":")[0]}</em>`;
    if (onClick) b.addEventListener("click", onClick);
    grid.appendChild(b);
    return b;
  };

  handBtn = add("bb-hand", "Hand", "Hand tool — drag to slide the paper (H)",
    ICON.hand, () => setHand(!handOn));
  handBtn.setAttribute("aria-pressed", "false");

  add("bb-fit", "Fit", "Fit everything in view", ICON.fit,
    () => fitView(ctx, store.blocks.concat(store.things)));

  add("bb-zoomin", "Closer", "Zoom in (+)", ICON.zoomIn, () => zoomBy(ctx, 0.8));
  add("bb-zoomout", "Further", "Zoom out (−)", ICON.zoomOut, () => zoomBy(ctx, 1.25));

  const btn = add("bb-fs", "Full screen", "Fullscreen", ICON.expand);

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
      onFacePress: (id, uv) => {
        const thing = store.things.find((t) => t.id === id);
        if (!thing || thing.variant !== "place") return null;
        const hit = hitPlace(thing, uv);
        // the tray always has a counter to take; a column only where one is
        const from = hit.zone === "tray" ? null
          : hit.zone === "area" && hit.index >= 0 ? hit.col
          : undefined;
        if (from === undefined) return null;
        ghost.show(counterColour(thing, hit.col));
        return { thingId: id, from };
      },
      onFaceDragMove: (token, x, y) => ghost.move(x, y),
      onFaceDrop: (token, targetId, uv) => {
        ghost.hide();
        const thing = store.things.find((t) => t.id === token.thingId);
        if (!thing) return;
        snapshot();

        // dropped off this chart — the counter is thrown away
        let done;
        if (targetId !== token.thingId || !uv) {
          done = dropCounter(thing, token.from);
        } else {
          const hit = hitPlace(thing, uv);
          done = hit.col == null
            ? dropCounter(thing, token.from)
            : moveCounter(thing, token.from, hit.col, store.base);
        }
        if (!done.changed) store.history.pop();
        if (done.message) say(done.message, done.changed ? "ok" : "warn");
        emit();
      },
      onBoard: (id, uv, e) => {
        const thing = store.things.find((t) => t.id === id);
        if (!thing) return;
        if (thing.variant === "place") {
          // shift takes a counter back out, the way it hides a square on a table
          snapshot();
          const done = tapPlace(thing, uv, store.base, {
            remove: !!(e && (e.shiftKey || e.ctrlKey)),
          });
          if (!done.changed) store.history.pop();
          if (done.message) say(done.message, done.changed ? "ok" : "warn");
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
      onZoom: (factor) => zoomBy(ctx, factor),
      onPan: (dx, dz) => panBy(ctx, dx, dz),
      onHand: () => setHand(!handOn),
      onTurn: doTurn,
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

    mountViewKit();

    const trade = createRegroupPrompt(ctx, view, stage);
    const turn = createTurnHandle(ctx, view, stage, () => emit());
    subscribe((s) => { view.sync(s); trade.refresh(); turn.refresh(); });
    turn.refresh();

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
