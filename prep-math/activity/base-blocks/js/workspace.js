/* ============================================================================
   MANIPULATIVES — the workbench itself
   ----------------------------------------------------------------------------
   The whole canvas, mounted wherever it is asked for: its own page, and a panel
   in the printable workbooks' sidebar. One copy of the code, one set of tools,
   one canvas — the same split Algebra Moves made when it went into a panel.

   The shelf is plain HTML and costs nothing. Babylon is streamed the first time
   a card is pressed; after that the canvas stays alive, so going back and
   picking something else keeps whatever you had built. A panel closed and
   opened again drops the ENGINE but keeps the STATE, for the same reason: what
   you built is yours, and the paper should still have it on when you come back.
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
import { canvasShellHTML } from "./canvas-shell.js";
import { stackRail } from "./stacks.js";
import { GROUPS } from "./tools.js";
import { store, subscribe, emit, say, nextId, snapshot, selectedItems } from "./state.js";
import { planSum, applyStep, canWorkSums } from "./sums.js";
import { splitSelected, addPlace, addThing, addTile, addCard, rotateSelected,
  settleThings, cancelOverlapping } from "./ops.js";
import { refreshCards, setNotation } from "./card.js";
import { createCardPicker } from "./cardui.js";
import { createBlockBar } from "./blockbar.js";
import { createSheetPanel } from "./sheetui.js";
import { createCellLayer } from "./cells.js";
import { createPickTool } from "./pick.js";
import { sheetFor } from "./sheets.js";
/* Namespaces for the ?debug handle below — the page itself uses the named
   imports above; these are so a test can reach a module without importing it. */
import * as ops from "./ops.js";
import * as sync from "./sync.js";
import * as sheets from "./sheets.js";
import * as sceneMod from "./scene.js";
import * as layoutMod from "./layout.js";
import { makeNote } from "./notes.js";
import { createNoteEditor } from "./noteedit.js";
import { createTurnHandle } from "./turn.js";
import { ICON } from "./icons.js";
import { occupancy, findSpot, mark, arrange, footprint } from "./layout.js";
import { makeAbacus, tapBead, abacusValue, setAbacusValue, worksInBase } from "./abacus.js";
import {
  makeBoard, tapBoard, tapPlace, toggleCell, sweepArray,
  hitPlace, moveCounter, dropCounter, counterColour,
} from "./grids.js";
import { createDotGhost } from "./dots.js";
import { frames, readFrame, frameSentence, frameSquare } from "./frame.js";
import { syncFrom as spread, afterBlocks, valueOf, setChartValue } from "./sync.js";

const BABYLON_URL = "https://cdn.jsdelivr.net/npm/babylonjs@7/babylon.js";

/* Not looked up at import time any more: whoever mounts the canvas hands in
   the element it goes in, and everything below is found inside THAT. The page
   hands in its full-window view; the workbook panel hands in its body. */
let root = null;
let shelfEl = null;
let viewEl = null;
let stage = null;
let frame = null;
let canvas = null;

let engine = null;
let ctx = null;
let view = null;
let ui = null;
let pointer = null;
let noteEditor = null;
let dock = null;
let sheetPanel = null;
let cellLayer = null;
let pickTool = null;
let booting = null;
let ghost = null;                   // made once the stage is known
let sizeWatch = null;               // the stage's ResizeObserver, so it can go
let onWindowResize = null;          // ditto the window's listener

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
    (t) => t.id !== thing.id
      && (t.kind === "abacus" || t.variant === "place" || !!sheetFor(t)?.setValue)
  );
  const n = lead ? valueOf(lead) : store.blocks.reduce((s, b) => s + b.l * b.w * b.h, 0);
  const sheet = sheetFor(thing);
  if (thing.kind === "abacus") setAbacusValue(thing, n);
  else if (thing.variant === "place") setChartValue(thing, n);
  else if (sheet?.setValue) sheet.setValue(thing, n);
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
        /* Everything else keeps up A STEP AT A TIME, not all at once at the end.
           With sync on, the point of the canvas is that the tools tell the same
           story together — beads sliding while a chart and a written sum sat
           still, then all of them jumping at the last movement, told it twice
           instead. Anything a step could not be shown on is reported at the end
           by the final spread, so nothing is said twice here either. */
        spread(abacusValue(f), f.id);
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

/**
 * Put a note on the canvas beside a board, without disturbing anything.
 *
 * Not `addThing`: that arranges the whole canvas, which would sweep the groups
 * about at the very moment we are trying to keep a record of them. This finds
 * one clear patch and leaves everything else where it is.
 */
function keepNote(text, near) {
  const note = makeNote(text, nextPaper++ % 6);
  note.id = nextId();
  const f = footprint(note);
  const grid = occupancy(store.blocks.concat(store.things));
  const spot = findSpot(grid, f.l, f.w, { x: near.x + near.l + 2, z: near.z });
  if (!spot) return null;
  note.x = spot.x;
  note.z = spot.z;
  store.things.push(note);
  return note;
}

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
  const grid = root.querySelector("#bb-kit-view");

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
    setTimeout(() => engine?.resize(), 60);
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
  if (tool.kind === "card") {
    const card = addCard();
    fitView(ctx, [card]);
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
  /* A sheet you WORK on is picked up the moment it lands. The strip that asks
     the questions belongs to the board in your hand, and a sum nobody is
     holding is only a picture of one. */
  const sheet = sheetFor(thing);
  if (sheet) store.selection = new Set([thing.id]);
  say(
    tool.variant === "place"
      ? "Place-value chart — stand blocks in the columns and it reads them back."
      : tool.variant === "area"
        ? "Area frame — lay pieces along the two tracks to say what you are "
          + "multiplying, then fill the field between them."
        : sheet
          ? `${sumOf(sheet, thing)} — ${sheet.ask(thing).text}`
          : `${tool.label} — tap a square to light its row and column.`
  );
  catchUp(thing);
  /* A division put out while sync is on shows its first stage at once: thirty
     tens on the paper, seven empty piles, and the question is how many each. */
  if (sheet && store.sync) {
    const stage = sheet.stage?.(thing);
    if (stage) sheet.lay(thing, stage);
  }
  fitView(ctx, [thing]);
}

/* ── working a written sum ────────────────────────────────────────────────── */

/** The sum a sheet is set to, said the way that method writes it. */
function sumOf(sheet, board) {
  if (sheet.said) return sheet.said(board);
  const showing = sheet.read(board);
  return sheet.fields.map((f) => showing[f.n]).join(` ${sheet.sep} `).trim();
}

/**
 * Everything that writes on a division or an addition comes through here: one
 * step back per figure written, and NOTHING in the history for an answer that
 * was refused. Undo on this canvas takes a line of working off the page; it was
 * never meant to walk back through wrong guesses.
 */
function sheetAct(board, run) {
  if (!board) return;
  snapshot();
  const was = valueOf(board);
  /* The stage BEFORE the line is written, because writing the subtraction is
     what takes that round out of what is left to share — and after the last one
     there is no stage left to read it from. */
  const grouped = sheetFor(board).stage?.(board);
  const done = run(board);
  /* A refused answer is not a step back to take. It DOES change the board —
     the tally of slips goes up, which is how the board knows to offer to write
     one for you — but undo on this canvas takes a line of working off the page
     and was never meant to walk back through wrong guesses. */
  if (done.ok === false || !done.changed) store.history.pop();
  /* A board that has just been given a new sum is a different size, so it is
     put down again before anything else is standing where it now reaches — and
     the camera goes back to it, because the answer is typed in cells ON the
     page now and a longer sum can put them off the side of the screen. */
  if (done.changed && done.resized) {
    settleThings([board]);
    fitView(ctx, [board]);
  }
  /* EVERY step of the working spreads, not just a sum set by hand. A long
     division takes a pile apart a line at a time, so what is left to share out
     changes as it goes — and with sync on the blocks have to come down with it,
     or the canvas is telling two different stories at once.

     Only when the number actually moved: spreading a number nothing has changed
     would rebuild every block on the canvas for no reason. (An addition's total
     is its total from the first line to the last, so working one spreads
     nothing, which is right — nothing about it changed.) */
  const now = valueOf(board);
  let spilled = null;
  let shown = "";
  if (done.changed && store.sync) {
    /* A division's blocks change at EVERY stage, not only when the count does:
       the D of DMSB deals four tens into each of the seven piles without adding
       or taking away a single one of them, and that dealing is the answer to
       "where did the 4 come from". So it is not guarded by `now !== was`. */
    /* The S of DMSB. What has been dealt does NOT go: it stays in the piles it
       was dealt into and stops counting as still-to-share, and a note is stuck
       beside the piles saying what the round came to. The working carries on
       with what is left, so by the end the whole division is laid out in
       blocks — seven piles of 43, and the 4 that would not go round. */
    if (done.kind === "d" && grouped && grouped.grouped) {
      sheetFor(board).setAside(board);
      const said = sheetFor(board).groupNote(grouped, store.base);
      if (said) keepNote(said, board);
    }
    const stage = sheetFor(board).stage?.(board);
    if (stage && sheetFor(board).lay(board, stage)) {
      spilled = spread(now, board.id, { blocks: false });
      shown = " " + sheetFor(board).stageSaid(stage, store.base);
    } else if (now !== was) {
      spilled = spread(now, board.id);
    }
  }
  const note = spilled || (done.message ? done.message + shown : "");
  if (note) {
    say(note, done.ok === false || spilled ? "warn" : done.changed ? "ok" : "info");
  }
  emit();
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
        if (!thing) return null;
        /* A press on a times table may be the start of sweeping an array out
           of its corner. It asks to be TRACKED, so the pointer tells it which
           square the finger is over rather than only where it is on screen. */
        if (thing.variant === "multiply") return { thingId: id, track: true, array: true };
        if (thing.variant !== "place") return null;
        const hit = hitPlace(thing, uv);
        // the tray always has a counter to take; a column only where one is
        const from = hit.zone === "tray" ? null
          : hit.zone === "area" && hit.index >= 0 ? hit.col
          : undefined;
        if (from === undefined) return null;
        ghost.show(counterColour(thing, hit.col));
        return { thingId: id, from };
      },
      onFaceDragMove: (token, x, y, uv) => {
        /* Sweeping an array: the rectangle follows the finger, and the fact is
           said as it goes, so the numbers and the shape are read together. One
           snapshot for the WHOLE sweep, taken at the first square — a drag that
           passed over thirty squares is one change, not thirty. */
        if (token.array) {
          const thing = store.things.find((t) => t.id === token.thingId);
          if (!thing || !uv) return;
          if (!token.began) { snapshot(); token.began = true; }
          const done = sweepArray(thing, uv, store.base);
          if (done.changed) { say(done.message, "ok"); emit(); }
          return;
        }
        ghost.move(x, y);
      },
      onFaceDrop: (token, targetId, uv) => {
        if (token.array) return; // the sweep already put the rectangle where it goes
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
        /* Tapping a worked sum is asking to be told the question again — and it
           picks the board up and puts the caret in the box, because a face is
           the one part of a board that does not select itself. */
        const worked = sheetFor(thing);
        if (worked) {
          store.selection = new Set([thing.id]);
          const q = worked.ask(thing);
          say(q.text, q.done ? "ok" : "info");
          emit();
          cellLayer?.focus();
          return;
        }
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
      marqueeEl: root.querySelector("#bb-marquee"),
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
      root.querySelector("#bb-dock-tabs"),
      root.querySelector("#bb-dock-panel"),
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
        onPaint: () => { paintIcons(root); ui.update(); },
        base: () => store.base,
      }
    ).paint(store.group);

    mountViewKit();

    /* Cards are rewritten BEFORE anything redraws, so the view sees the words
       they should be showing rather than last change's. Registered before the
       view's own subscriber for exactly that reason. */
    subscribe(() => refreshCards());

    const cardPick = createCardPicker(ctx, view, stage, {
      onPick: (card, id) => {
        // a change to the canvas like any other, and one step back from it
        snapshot();
        if (setNotation(card, id)) emit(); else store.history.pop();
      },
    });
    const blockBar = createBlockBar(ctx, view, stage, {
      onAct: (name) => ui.act(name),
      enabled: (name) => ui.enabled(name),
    });

    /* The answer goes in the cells of the page; the strip only asks. Both come
       through the same one action, so a figure written either way takes exactly
       one step back. */
    cellLayer = createCellLayer(ctx, view, stage, {
      onWrite: (board, text) => sheetAct(board, (t) => sheetFor(t).answer(t, text)),
      onBring: (board) => sheetAct(board, (t) => sheetFor(t).bring(t)),
    });

    sheetPanel = createSheetPanel(ctx, view, stage, {
      onShow: (board) => sheetAct(board, (t) => sheetFor(t).showNext(t)),
      onReset: (board) => sheetAct(board, (t) => sheetFor(t).reset(t)),
      /* A new sum makes the board a different size, so this is the one action
         here that has to put it down again afterwards. */
      /* A new sum is a new size of board; the spread is sheetAct's business,
         the same as it is for every other line of working. */
      onSum: (board, values) => sheetAct(board, (t) => {
        const done = sheetFor(t).set(t, values);
        return { ...done, resized: done.changed };
      }),
    });

    pickTool = createPickTool(ctx, view, stage);

    const trade = createRegroupPrompt(ctx, view, stage);
    noteEditor = createNoteEditor(ctx, view, stage,
      { onInput: () => emit(), onCommit: afterNote });
    const turn = createTurnHandle(ctx, view, stage, () => emit());
    subscribe((s) => {
      view.sync(s);
      trade.refresh();
      turn.refresh();
      cardPick.refresh();
      blockBar.refresh();
      sheetPanel.refresh();
      cellLayer.refresh();
      pickTool.refresh();
    });
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
    /* Kept, so they can be taken off again. A panel is opened and closed over
       and over; left attached, each open adds another pair, and after a close
       they fire against an engine that is gone. */
    sizeWatch = new ResizeObserver(() => engine?.resize());
    sizeWatch.observe(stage);
    onWindowResize = () => engine?.resize();
    window.addEventListener("resize", onWindowResize);

    /* A way in for the tests. Everything on this canvas is drawn into a WebGL
       texture, so what a frame or a chart is reading cannot be read back off
       the page — a harness can only assert on what it can see. Opened with
       ?debug so it is never there in a lesson. */
    if (location.search.includes("debug")) {
      /* `ctx` is here so a harness can project a point on the canvas to a
         screen pixel and drive the REAL pointer at it — which is the only way
         to test anything drawn into a texture, an array swept out of a times
         table included. */
      /* The modules are on the handle too, not just the state. A test that has
         to `await import()` inside every page.evaluate loses one to V8's garbage
         collector every so often — "resulting promise was garbage collected" —
         and the heavier the call the likelier it is. Reaching them off one
         object costs nothing and makes that whole class of flake go away. */
      window.__bb = { store, valueOf, view, ctx, emit, say, ops, sync, sheets,
        scene: sceneMod, layout: layoutMod };
    }

    veilOff();
    return true;
  })();

  return booting;
}

/* ── mounting ─────────────────────────────────────────────────────────────── */

let canvasView = null;

/**
 * A tool out of the one registry, by id, carrying the family it belongs to.
 *
 * A FAMILY's name works too — "blocks" is a group and "base-blocks" the tool
 * inside it, and asking for the family is the more natural thing to want.
 */
function toolById(id) {
  for (const g of GROUPS) {
    const t = (g.tools || []).find((x) => x.id === id);
    if (t) return { ...t, group: t.group || g.id };
  }
  const fam = GROUPS.find((g) => g.id === id);
  const first = fam && (fam.tools || [])[0];
  return first ? { ...first, group: first.group || fam.id } : null;
}

/**
 * Put the canvas away: stop drawing and drop the engine, but leave the STATE
 * alone. A panel is closed and opened again all the time, and a render loop
 * nobody stops is a panel you shut that is still drawing.
 */
function teardown() {
  try { sizeWatch?.disconnect(); } catch { /* already gone */ }
  if (onWindowResize) window.removeEventListener("resize", onWindowResize);
  sizeWatch = null;
  onWindowResize = null;
  try { engine?.stopRenderLoop(); } catch { /* already gone */ }
  try { ctx?.scene?.dispose(); } catch { /* already gone */ }
  try { engine?.dispose(); } catch { /* already gone */ }
  engine = null; ctx = null; view = null; ui = null; pointer = null;
  noteEditor = null; dock = null; sheetPanel = null; cellLayer = null;
  pickTool = null; booting = null;   // so the next boot builds it again
}

/**
 * Mount the workbench in `host`.
 *
 *   shelf   the element to build the entry cards into, or none — a panel goes
 *           straight to the canvas and never shows a shelf
 *   tool    what to open with when there is no shelf to choose from
 *   onBack  what the rail's Back key does: the page hides the canvas view, a
 *           panel closes itself
 *
 * → { boot, resize, dispose }
 */
export async function mountBaseBlocks(host, { shelf = null, tool = null, onBack = null } = {}) {
  root = host;
  /* The markup comes from canvas-shell.js unless the host already has it. */
  if (!host.querySelector(".bb-stage")) host.innerHTML = canvasShellHTML();

  viewEl = host;
  shelfEl = shelf;
  stage = host.querySelector(".bb-stage");
  frame = host.querySelector(".bb-frame");
  canvas = host.querySelector("#bb-canvas");
  ghost = createDotGhost(stage);
  paintIcons(host);
  /* Fold the rail's alternatives into stacks — one showing, the rest behind a
     corner arrow. Done after the icons are painted, so a stacked key keeps the
     picture it was given. */
  stackRail(host.querySelector(".bb-rail"));

  canvasView = createCanvasView(viewEl, {
    onOpen: () => setTimeout(() => engine?.resize(), 40),
  });
  if (onBack) canvasView.hide = onBack;

  const handle = {
    boot: bootCanvas,
    resize: () => engine?.resize(),
    dispose: teardown,
  };

  if (shelfEl) {
    buildShelf(shelfEl, async (picked) => {
      canvasView.show();
      const ok = await bootCanvas();
      if (!ok) return;
      engine.resize();
      placeTool(picked);
      emit();
      root.querySelector(`[data-group='${picked.group}']`)?.click();
    });
    return handle;
  }

  /* No shelf — a panel opens straight onto the paper with the whole rail.
     NOT canvasView.show(): that locks the page's scroll, which is right for a
     canvas filling the window and wrong for one in a panel with a workbook
     behind it that still has to scroll. */
  host.hidden = false;
  const ok = await bootCanvas();
  if (!ok) return handle;
  engine.resize();
  const first = tool && toolById(tool);
  if (first) {
    placeTool(first);
    emit();
    root.querySelector(`[data-group='${first.group}']`)?.click();
  }
  return handle;
}
