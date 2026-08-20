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
import { store, subscribe, emit, say, nextId, snapshot, selectedItems } from "./state.js";
import { planSum, applyStep, canWorkSums } from "./sums.js";
import { splitSelected, addPlace, addThing, addTile, rotateSelected, settleThings,
  cancelOverlapping } from "./ops.js";
import { makeNote } from "./notes.js";
import { createNoteEditor } from "./noteedit.js";
import { createTurnHandle } from "./turn.js";
import { ICON } from "./icons.js";
import { occupancy, findSpot, mark, arrange } from "./layout.js";
import { makeAbacus, tapBead, abacusValue, setAbacusValue, worksInBase } from "./abacus.js";
import {
  makeBoard, tapBoard, tapPlace, toggleCell,
  hitPlace, moveCounter, dropCounter, counterColour,
} from "./grids.js";
import { createDotGhost } from "./dots.js";
import { frames, readFrame, frameSentence, frameSquare } from "./frame.js";
import { syncFrom as spread, afterBlocks, valueOf, setChartValue } from "./sync.js";

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
let noteEditor = null;
let dock = null;
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

/** Sync only speaks when a tool could not take the number it was handed. */
function sayIf(note) {
  if (note) say(note, "warn");
}

/**
 * A thing just put on the canvas while sync is on starts out showing whatever
 * everything else is showing — a new frame that read zero next to a chart
 * reading 138 would look like sync had broken the moment you used it.
 */
function catchUp(thing) {
  if (!store.sync || !thing) return;
  const lead = store.things.find(
    (t) => t.id !== thing.id && (t.kind === "abacus" || t.variant === "place")
  );
  const n = lead ? valueOf(lead) : store.blocks.reduce((s, b) => s + b.l * b.w * b.h, 0);
  if (thing.kind === "abacus") setAbacusValue(thing, n);
  else if (thing.variant === "place") setChartValue(thing, n);
}

/* ── a sum worked out on a frame ──────────────────────────────────────────── */

const STEP_MS = 1500; // long enough to read the sentence before the beads move

let sumRunning = false;

/** Which frame the sum is worked on: the one in your hand, else the only one. */
function sumFrame() {
  const picked = selectedItems().find(canWorkSums);
  if (picked) return { frame: picked, why: null };
  const all = store.things.filter(canWorkSums);
  if (all.length === 1) return { frame: all[0], why: null };
  if (all.length > 1) return { frame: null, why: "Pick the frame you want the sum worked on first." };
  const schoty = store.things.some((t) => t.kind === "abacus");
  return {
    frame: null,
    why: schoty
      ? "A schoty has no bead worth five, so it has no friends to use. Add a soroban or a suanpan."
      : "Put a soroban or a suanpan on the canvas first.",
  };
}

/**
 * Work a number on to a frame, one hand movement at a time.
 *
 * The whole sum is planned before a bead moves, so a frame that cannot hold the
 * answer says so and stays as it was. Then the steps are played with the
 * sentence up first — the pause with the words showing and the beads still is
 * where the learner works out what is about to happen.
 */
async function runSum(n, sign) {
  if (sumRunning) return;
  const { frame: f, why } = sumFrame();
  if (!f) { say(why, "warn"); emit(); return; }

  const plan = planSum(f, n, sign);
  if (!plan.ok) { say(plan.message, "warn"); emit(); return; }
  if (!plan.steps.length) { say("Nothing to do — that is zero."); emit(); return; }

  const was = abacusValue(f);
  sumRunning = true;
  ui.sumsBusy(true);
  snapshot();
  store.selection = new Set([f.id]);
  fitView(ctx, [f]);

  try {
    for (const step of plan.steps) {
      say(step.text, step.kind === "direct" ? "info" : "ok");
      emit();
      await wait(STEP_MS);
      if (step.dh || step.de) {
        applyStep(f, step);
        emit();
        await wait(STEP_MS * 0.5);
      }
    }
    const now = abacusValue(f);
    say(`${was} ${sign > 0 ? "+" : "−"} ${n} = ${now}.`, "ok");
    sayIf(spread(now, f.id));
  } finally {
    sumRunning = false;
    ui.sumsBusy(false);
    emit();
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── sticky notes ─────────────────────────────────────────────────────────── */

/* Papers are handed out in turn, so a wall of notes is not all one colour. */
let nextPaper = 0;

/**
 * A note dragged out of the rail and dropped on the paper.
 *
 * It lands empty, exactly where it was let go, with the caret already in it —
 * dragging a note out and typing on it is one movement, not "make a note" and
 * then "now write on it". A note that is left empty is thrown away when you
 * click off it, so a mis-drag costs nothing.
 */
function dropNote({ clientX, clientY }) {
  const at = clientX != null ? pointer.cellAt(clientX, clientY) : null;
  const note = makeNote("", nextPaper++);
  addThing(note, at ? { x: Math.round(at.x - note.l / 2), z: Math.round(at.z - note.w / 2) } : null);
  editNote(note);
}

/**
 * Open a note to write on.
 *
 * The selection is dropped first: writing on a note is not the same as holding
 * it, and a note left picked up wears the glow and carries the turn handle —
 * both of them sitting on the very paper you are trying to read as you type.
 */
function editNote(note) {
  store.selection = new Set();
  emit();
  noteEditor.open(note);
}

/** Writing on a note has finished: an empty one was never really a note. */
function afterNote(note, { empty }) {
  if (empty) {
    store.things = store.things.filter((t) => t.id !== note.id);
    store.selection.delete(note.id);
  } else {
    /* The paper was recut to the words as they were typed, so it may not fit
       where it was any more — leave it be if it does, move it least if not. */
    settleThings([note]);
  }
  emit();
}

/** A double-tap: a block comes apart, a note opens to be written on. */
function doubleTap(id) {
  const note = store.things.find((t) => t.id === id && t.kind === "note");
  if (note) { editNote(note); return; }
  if (splitSelected()) { sayIf(afterBlocks()); emit(); }
}

/* ── the area frame reads itself ──────────────────────────────────────────── */

/** What one frame comes to, in a sentence. */
function sayFrame(thing) {
  if (!frameSquare(thing)) {
    say("Turn the frame square to the paper (Q) before it can read itself.", "warn");
    return;
  }
  const read = readFrame(thing, store.things.filter((t) => t.kind === "tile"));
  const line = frameSentence(read);
  if (!line) {
    say("An empty frame. Lay pieces along the top and down the side, then fill it in.");
    return;
  }
  if (line.kind === "asked" || !read.sides) { say(line.text); return; }
  say(read.agree
    ? `${line.text} — the rectangle closes.`
    : `${line.text} — not yet.`, read.agree ? "ok" : "info");
}

/**
 * Say so the moment a frame comes right.
 *
 * Only when it CHANGES: a frame that already agreed and was not touched has
 * nothing new to say, and a sentence repeated on every drop stops being read.
 */
function announceFrames() {
  for (const f of frames(store.things)) {
    if (!frameSquare(f)) continue;
    const read = readFrame(f, store.things.filter((t) => t.kind === "tile"));
    const line = frameSentence(read);
    const now = line && read.agree ? line.text : "";
    if (now && now !== f.said) say(`${now} — the rectangle closes.`, "ok");
    f.said = now;
  }
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
  for (const d of start) {
    store.blocks.push({ id: nextId(), ...d, x: 0, z: 0, tag: null });
  }
  arrange(store.blocks, store.things);
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
  if (tool.kind === "tile") {
    /* The Tiles card is a door to the family, not one tile: which piece you
       want is the only question, and the panel is where it is asked. */
    say("Algebra tiles — pick a piece from the panel, cubes first. A red one is its negative.");
    return;
  }
  if (tool.kind === "abacus") {
    if (!worksInBase(tool.variant, store.base)) {
      say(`A ${tool.short.toLowerCase()} only counts in base ten — use the schoty.`, "warn");
      return;
    }
    const thing = addThing(makeAbacus(tool.variant, store.base));
    arrange(store.blocks, store.things);
    say(`${tool.label} — tap a bead to slide it against the bar.`);
    catchUp(thing);
    fitView(ctx, [thing]);
    return;
  }
  const thing = addThing(makeBoard(tool.variant, store.base));
  arrange(store.blocks, store.things);
  say(
    tool.variant === "place"
      ? "Place-value chart — stand blocks in the columns and it reads them back."
      : tool.variant === "area"
        ? "Area frame — lay pieces along the two tracks to say what you are "
          + "multiplying, then fill the field between them."
        : `${tool.label} — tap a square to light its row and column.`
  );
  catchUp(thing);
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
      onDouble: doubleTap,
      /* Let go of a tile over its opposite and the pair cancels itself: the
         zero pair made physical, with no key to press. */
      onDrop: (moved) => cancelOverlapping(moved),
      onBead: (ref) => {
        const thing = store.things.find((t) => t.id === ref.thingId);
        if (!thing) return;
        if (tapBead(thing, ref)) {
          const n = abacusValue(thing);
          say(spread(n, thing.id) || String(n));
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
        const spilled = done.changed ? spread(valueOf(thing), thing.id) : null;
        if (done.message) say(spilled || done.message, done.changed && !spilled ? "ok" : "warn");
        emit();
      },
      onBoard: (id, uv, e) => {
        const thing = store.things.find((t) => t.id === id);
        if (!thing) return;
        /* The area frame has no squares to tap: what it holds is the pieces
           lying on it, so a tap simply asks it to read itself out. */
        if (thing.variant === "area") { sayFrame(thing); emit(); return; }
        if (thing.variant === "place") {
          // shift takes a counter back out, the way it hides a square on a table
          snapshot();
          const done = tapPlace(thing, uv, store.base, {
            remove: !!(e && (e.shiftKey || e.ctrlKey)),
          });
          if (!done.changed) store.history.pop();
          const spilled = done.changed ? spread(valueOf(thing), thing.id) : null;
          if (done.message) say(spilled || done.message, done.changed && !spilled ? "ok" : "warn");
          /* A chart that has just grown reaches leftwards, and two columns is
             enough to carry its own + and − off the side of the screen — so
             bring the view with it, or you cannot press them again. */
          if (done.rebuilt) fitView(ctx, [thing]);
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
      onBack: () => canvasView.hide(),
      onNote: dropNote,
      onSum: runSum,
    });

    dock = buildDock(
      document.getElementById("bb-dock-tabs"),
      document.getElementById("bb-dock-panel"),
      {
        onPiece: (p) => { addPlace(p); sayIf(afterBlocks()); emit(); },
        /* Fit the WHOLE ROW, not the piece just added: tiles come out one
           beside the last, and a camera that dives onto each new piece hides
           the row it belongs to. */
        onTile: (id, sign) => {
          addTile(id, sign);
          fitView(ctx, store.things.filter((t) => t.kind === "tile"));
          emit();
        },
        onOwn: (btn) => ui.openOwn(btn),
        onPlace: (tool) => { placeTool(tool); emit(); },
        onPaint: () => { paintIcons(document); ui.update(); },
        base: () => store.base,
      }
    ).paint(store.group);

    mountViewKit();

    const trade = createRegroupPrompt(ctx, view, stage);
    noteEditor = createNoteEditor(ctx, view, stage,
      { onInput: () => emit(), onCommit: afterNote });
    const turn = createTurnHandle(ctx, view, stage, () => emit());
    subscribe((s) => { view.sync(s); trade.refresh(); turn.refresh(); });
    turn.refresh();

    // keep the paper and the piece colours in step with a light/dark switch
    new MutationObserver(() => {
      retheme(ctx);
      view.retint(store);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // the paper's bold lines follow the working base, and so does what may be
    // added: away from ten, only the schoty counts
    let lastBase = store.base;
    subscribe((s) => {
      if (s.base === lastBase) return;
      lastBase = s.base;
      paintMat(ctx, s.base);
      dock?.paint(s.group);
    });

    ctx.camera.setTarget(new window.BABYLON.Vector3(0, 1.5, 0));
    ctx.camera.radius = CFG.camera.radius;

    engine.runRenderLoop(() => ctx.scene.render());
    new ResizeObserver(() => engine.resize()).observe(stage);
    window.addEventListener("resize", () => engine.resize());

    /* A way in for the tests. Everything on this canvas is drawn into a WebGL
       texture, so what a frame or a chart is reading cannot be read back off
       the page — a harness can only assert on what it can see. Opened with
       ?debug so it is never there in a lesson. */
    if (location.search.includes("debug")) {
      window.__bb = { store, valueOf, view };
    }

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

paintIcons(document);
