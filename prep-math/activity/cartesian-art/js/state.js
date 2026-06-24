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

  /** "free" studio vs a loaded "puzzle" mission. */
  mode: "free",

  /** The active puzzle: { id, title, prompt, difficulty, targets:[{x,y}],
   *  closed, grid } — or null in free mode. */
  puzzle: null,

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

/* ── points ──────────────────────────────────────────────────────────────── */
let _pid = 0;

/** Register a vertex at the current cursor. Ignores an exact repeat of the
 *  last point (double-tap Enter shouldn't stack duplicates). Returns the
 *  point, or null if it was a no-op. */
export function addPoint() {
  const { x, y } = state.cursor;
  const last = state.points[state.points.length - 1];
  if (last && last.x === x && last.y === y) return null;
  // tapping the very first point again closes the loop instead of adding
  const first = state.points[0];
  if (state.points.length > 2 && first && first.x === x && first.y === y) {
    state.closed = true;
    emit("close");
    return null;
  }
  const pt = { x, y, id: ++_pid };
  state.points.push(pt);
  emit("points");
  return pt;
}

/** Remove a point by id (used by double-click on a marker). */
export function deletePointById(id) {
  const i = state.points.findIndex((p) => p.id === id);
  if (i === -1) return;
  state.points.splice(i, 1);
  if (state.points.length < 3) state.closed = false;
  emit("points");
}

/** Remove the most recently added point. */
export function deleteLastPoint() {
  if (!state.points.length) return;
  state.points.pop();
  if (state.points.length < 3) state.closed = false;
  emit("points");
}

/** Remove a point sitting on the cursor, if any. */
export function deletePointAtCursor() {
  const { x, y } = state.cursor;
  const i = state.points.findIndex((p) => p.x === x && p.y === y);
  if (i === -1) return false;
  state.points.splice(i, 1);
  if (state.points.length < 3) state.closed = false;
  emit("points");
  return true;
}

export function clearPoints() {
  state.points = [];
  state.closed = false;
  emit("points");
}

export function toggleClosed() {
  if (state.points.length < 3) return;
  state.closed = !state.closed;
  emit("close");
}

/** Replace the grid window (merges over current). */
export function setGrid(patch) {
  Object.assign(state.grid, patch);
  // keep the cursor inside the new window
  setCursor(state.cursor.x, state.cursor.y);
  emit("grid");
}

/** Load an existing outline into the FREE studio (used by admin authoring to
 *  edit a saved puzzle's shape). Re-ids the points so deletes stay unique. */
export function loadShape({ points = [], closed = false, grid = null } = {}) {
  state.mode = "free";
  state.puzzle = null;
  if (grid) Object.assign(state.grid, grid);
  state.points = points.map((p) => ({ x: p.x, y: p.y, id: ++_pid }));
  state.closed = !!closed && state.points.length > 2;
  state.cursor.x = clamp(state.cursor.x, state.grid.xMin, state.grid.xMax);
  state.cursor.y = clamp(state.cursor.y, state.grid.yMin, state.grid.yMax);
  emit("points");
}

/* ── puzzle mode ─────────────────────────────────────────────────────────── */

/** Load a puzzle into the studio: adopt its grid window, clear the canvas and
 *  switch to puzzle mode. The solution outline lives on state.puzzle.targets. */
export function enterPuzzle(puzzle) {
  state.mode = "puzzle";
  state.puzzle = puzzle;
  state.points = [];
  state.closed = false;
  if (puzzle.grid) Object.assign(state.grid, puzzle.grid);
  state.cursor.x = clamp(0, state.grid.xMin, state.grid.xMax);
  state.cursor.y = clamp(0, state.grid.yMin, state.grid.yMax);
  emit("puzzle");
}

/** Leave puzzle mode back to the free studio. */
export function exitPuzzle() {
  state.mode = "free";
  state.puzzle = null;
  state.points = [];
  state.closed = false;
  emit("puzzle");
}

/** Score the current attempt against the loaded puzzle's target outline.
 *  Returns { total, correct, missed, extra, score, stars }. Order-independent
 *  vertex matching (exact lattice hits) keeps it fair and kid-friendly. */
export function scoreAttempt() {
  const targets = (state.puzzle && state.puzzle.targets) || [];
  const total = targets.length;
  const key = (p) => `${p.x},${p.y}`;
  const want = new Set(targets.map(key));
  const got = new Set(state.points.map(key));
  let correct = 0;
  for (const k of want) if (got.has(k)) correct++;
  const extra = [...got].filter((k) => !want.has(k)).length;
  const missed = total - correct;
  const raw = total ? (correct - extra * 0.5) / total : 0;
  const score = Math.max(0, Math.round(raw * 100));
  let stars = 0;
  if (score >= 100 && state.closed) stars = 3;
  else if (score >= 75) stars = 2;
  else if (score >= 40) stars = 1;
  return { total, correct, missed, extra, score, stars };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
