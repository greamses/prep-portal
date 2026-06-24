/* ============================================================================
   Cartesian Art — central state
   ----------------------------------------------------------------------------
   One small reactive-ish store the whole studio reads from. Modules mutate it
   through the setters here (never reach in and reassign) so we get a single
   "changed" broadcast and re-render path. Kept deliberately framework-free.
   ========================================================================== */

/** Default coordinate-plane window. Symmetric four-quadrant plane. */
export const DEFAULT_GRID = Object.freeze({
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  step: 1, // spacing between gridlines, in math units
});

export const state = {
  /** Coordinate window currently shown. */
  grid: { ...DEFAULT_GRID },

  /** Where the mascot/cursor sits, in math units (snapped to integers). */
  cursor: { x: 0, y: 0 },

  /** Plotted vertices, in order, each { x, y, id }. Filled in Phase 2+. */
  points: [],

  /** Whether the path is closed back to the first point. */
  closed: false,

  /** UI flags. */
  ui: {
    showLabels: true, // axis number labels
    snap: true, // snap cursor to integer lattice
  },
};

/* ── change broadcasting ─────────────────────────────────────────────────── */
const listeners = new Set();

/** Subscribe to any state change. Returns an unsubscribe fn. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Notify everyone a change happened. Pass a short reason for debugging. */
export function emit(reason = "") {
  for (const fn of listeners) fn(reason);
}

/* ── setters ─────────────────────────────────────────────────────────────── */

/** Move the cursor to an absolute math coordinate, clamped to the grid. */
export function setCursor(x, y) {
  const g = state.grid;
  state.cursor.x = clamp(Math.round(x), g.xMin, g.xMax);
  state.cursor.y = clamp(Math.round(y), g.yMin, g.yMax);
  emit("cursor");
}

/** Nudge the cursor by a whole-unit delta. */
export function moveCursor(dx, dy) {
  setCursor(state.cursor.x + dx, state.cursor.y + dy);
}

/** Replace the grid window (merges over current). */
export function setGrid(patch) {
  Object.assign(state.grid, patch);
  // keep the cursor inside the new window
  setCursor(state.cursor.x, state.cursor.y);
  emit("grid");
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
