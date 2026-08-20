/* ============================================================================
   Manipulatives — the store
   ----------------------------------------------------------------------------
   Plain data: what is on the canvas, what is selected, which base we are working
   in. Everything that draws (the 3D view, the readout, the toolbar) listens for
   "change" and re-reads; nothing draws itself from inside an operation.

   Blocks and "things" (abacus frames, chart boards) are kept in two lists
   because only blocks can be split, merged and regrouped — but they share one
   id sequence and one selection, so the canvas can treat them alike when it is
   picking, dragging and laying out.
   ========================================================================== */

import { CFG } from "./config.js";

export const store = {
  base: CFG.defaultBase,
  strict: true, // "trade" rules: you may only merge exactly `base` alike blocks
  blocks: [], // { id, l, w, h, x, z, y, angle, tip, tag }
  things: [], // { id, kind: "abacus" | "board" | "tile" | "note", … , l, w, h, x, z }
  selection: new Set(),
  tool: "base-blocks", // which tool the dock is showing
  group: "blocks",
  flat: false, // 2D view on?
  sync: false, // when on, every tool shows the same number (js/sync.js)
  /* How a piece lands when you let go of it (js/snap.js). Flush is on to begin
     with because the algebra tiles are the pieces that move freely, and pieces
     that do not quite touch are the one way they can lie to you. */
  snap: { grid: false, side: true },
  seq: 1,
  history: [],
  /* Stepped back, and not yet stepped forward again. Cleared by any NEW change,
     because at that moment the way forward is a way that no longer exists. */
  future: [],
  message: null, // { text, kind } — one line of feedback for the HUD
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit() {
  listeners.forEach((fn) => fn(store));
}

export function say(text, kind = "info") {
  store.message = text ? { text, kind, at: Date.now() } : null;
}

export function nextId() {
  return store.seq++;
}

/** Everything that occupies cells on the canvas. */
export function items() {
  return store.blocks.concat(store.things);
}

export function itemById(id) {
  return items().find((b) => b.id === id) || null;
}

export function blockById(id) {
  return store.blocks.find((b) => b.id === id) || null;
}

export function thingById(id) {
  return store.things.find((b) => b.id === id) || null;
}

/** Selected blocks only — every block operation is defined on these. */
export function selected() {
  return store.blocks.filter((b) => store.selection.has(b.id));
}

/** Selected anything, for moving and deleting. */
export function selectedItems() {
  return items().filter((b) => store.selection.has(b.id));
}

export function totalUnits(blocks = store.blocks) {
  return blocks.reduce((n, b) => n + b.l * b.w * b.h, 0);
}

/* ── undo ─────────────────────────────────────────────────────────────────── */

/** Everything that can be stepped back to, copied deeply enough to be safe. */
function capture() {
  return {
    base: store.base,
    seq: store.seq,
    blocks: store.blocks.map((b) => ({ ...b })),
    things: store.things.map((t) => clone(t)),
    selection: [...store.selection],
  };
}

function restore(s) {
  store.base = s.base;
  store.seq = s.seq;
  store.blocks = s.blocks;
  store.things = s.things;
  const live = new Set(items().map((b) => b.id));
  store.selection = new Set(s.selection.filter((id) => live.has(id)));
}

export function snapshot() {
  store.history.push(capture());
  if (store.history.length > CFG.undoDepth) store.history.shift();
  /* A new change writes over the future. You cannot step forward into a canvas
     that was only ever reached from a past you have just left. */
  store.future.length = 0;
}

/* Things carry nested state (an abacus's rods, a grid's hidden cells) that a
   shallow copy would share with the snapshot — and then undo would restore a
   list of objects that had been mutated all along. */
function clone(t) {
  const copy = { ...t };
  if (t.rods) copy.rods = t.rods.map((r) => ({ ...r }));
  if (t.hidden) copy.hidden = [...t.hidden];
  if (t.focus) copy.focus = { ...t.focus };
  if (t.counters) copy.counters = [...t.counters];
  return copy;
}

export function undo() {
  const s = store.history.pop();
  if (!s) { say("Nothing left to undo.", "warn"); return false; }
  /* Where we are now becomes the way forward — so undo and redo are one
     another's opposite exactly, and stepping back and forward again lands on
     the canvas you started from and not on a rebuilt guess at it. */
  store.future.push(capture());
  if (store.future.length > CFG.undoDepth) store.future.shift();
  restore(s);
  return true;
}

export function redo() {
  const s = store.future.pop();
  if (!s) { say("Nothing to step forward to.", "warn"); return false; }
  store.history.push(capture());
  if (store.history.length > CFG.undoDepth) store.history.shift();
  restore(s);
  return true;
}

export function canUndo() {
  return store.history.length > 0;
}

export function canRedo() {
  return store.future.length > 0;
}
