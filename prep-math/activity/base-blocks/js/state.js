/* ============================================================================
   Base Blocks — the store
   ----------------------------------------------------------------------------
   Plain data: what is on the mat, what is selected, which base we are working
   in. Everything that draws (the 3D view, the readout, the toolbar) listens for
   "change" and re-reads; nothing draws itself from inside an operation.
   ========================================================================== */

import { CFG } from "./config.js";

export const store = {
  base: CFG.defaultBase,
  strict: true, // "trade" rules: you may only merge exactly `base` alike blocks
  blocks: [], // { id, l, w, h, x, z, tag }
  selection: new Set(),
  seq: 1,
  history: [],
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

export function blockById(id) {
  return store.blocks.find((b) => b.id === id) || null;
}

export function selected() {
  return store.blocks.filter((b) => store.selection.has(b.id));
}

export function totalUnits(blocks = store.blocks) {
  return blocks.reduce((n, b) => n + b.l * b.w * b.h, 0);
}

/* ── undo ─────────────────────────────────────────────────────────────────── */

export function snapshot() {
  store.history.push({
    base: store.base,
    seq: store.seq,
    blocks: store.blocks.map((b) => ({ ...b })),
    selection: [...store.selection],
  });
  if (store.history.length > CFG.undoDepth) store.history.shift();
}

export function undo() {
  const s = store.history.pop();
  if (!s) { say("Nothing left to undo.", "warn"); return false; }
  store.base = s.base;
  store.seq = s.seq;
  store.blocks = s.blocks;
  store.selection = new Set(s.selection.filter((id) => store.blocks.some((b) => b.id === id)));
  return true;
}

export function canUndo() {
  return store.history.length > 0;
}
