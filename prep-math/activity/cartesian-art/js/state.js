/* ============================================================================
   Cartesian Art — central state
   ----------------------------------------------------------------------------
   One small reactive-ish store the whole studio reads from. Modules mutate it
   through the setters here (never reach in and reassign) so we get a single
   "changed" broadcast and re-render path. Kept deliberately framework-free.

   An artwork is made of MANY shapes (the worksheet calls them "Lines"): each is
   an ordered list of vertices with its own stroke + fill colour and open/closed
   flag. Point setters act on the *active* shape; rendering, history, export and
   transforms iterate every shape. state.points / state.closed are live getters
   onto the active shape so single-shape callers keep working.
   ========================================================================== */

import { snapStep, snap } from "./scale.js";

/** Default coordinate-plane window. Symmetric four-quadrant plane. */
export const DEFAULT_GRID = Object.freeze({
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  step: 1, // spacing between labelled gridlines, in math units
});

/** Hard limit on how far the coordinate window can reach in any direction. */
export const GRID_MAX = 500;
const MIN_SPAN = 0.1; // closest you can zoom in (math units across ≈ ±0.05)

let _pid = 0; // unique point ids (across all shapes)
let _sid = 0; // unique shape ids

function makeShape({ points = [], closed = false, fillColor = null, strokeColor = null } = {}) {
  return {
    id: ++_sid,
    points: points.map((p) => ({ x: p.x, y: p.y, id: ++_pid })),
    closed: !!closed && points.length > 2,
    fillColor,
    strokeColor,
  };
}

export const state = {
  /** Coordinate window currently shown. lockAspect=true keeps square cells;
   *  it flips to false once the user zooms on a single axis line. */
  grid: { ...DEFAULT_GRID, lockAspect: true, posOnly: false },

  /** Where the mascot/cursor sits, in math units (snapped to integers). */
  cursor: { x: 0, y: 0 },

  /** All shapes that make up the artwork. Always at least one. */
  shapes: [makeShape()],

  /** id of the shape currently being edited. */
  activeId: 0,

  /** "free" studio vs a loaded "puzzle" mission. */
  mode: "free",

  /** The active puzzle, or null in free mode. */
  puzzle: null,

  /** UI flags. */
  ui: {
    showLabels: true, // axis number labels
    snap: true, // snap cursor to integer lattice
    transformMode: false, // arrows/analog transform the active shape
  },
};
state.activeId = state.shapes[0].id;

/** The shape currently being edited (always returns one). */
export function activeShape() {
  return state.shapes.find((s) => s.id === state.activeId) || state.shapes[0];
}

/* Live convenience getters so single-shape callers (mascot, readouts, the old
   paint/score paths) keep reading the active shape without changes. */
Object.defineProperties(state, {
  points: {
    get() { return activeShape().points; },
    set(v) { activeShape().points = v; },
  },
  closed: {
    get() { return activeShape().closed; },
    set(v) { activeShape().closed = v; },
  },
  paint: {
    get() {
      const s = activeShape();
      return {
        get fillColor() { return s.fillColor; },
        set fillColor(c) { s.fillColor = c; },
      };
    },
  },
});

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

/* ── cursor ──────────────────────────────────────────────────────────────── */

/** The current adaptive step (one fine gridline cell) per axis. */
export function cursorStep() {
  const g = state.grid;
  return { x: snapStep(g.xMax - g.xMin), y: snapStep(g.yMax - g.yMin) };
}

/** Move the cursor to an absolute math coordinate, clamped to the grid. */
export function setCursor(x, y) {
  const g = state.grid;
  state.cursor.x = clamp(x, g.xMin, g.xMax);
  state.cursor.y = clamp(y, g.yMin, g.yMax);
  emit("cursor");
}

/** Nudge the cursor by one adaptive step — strides scale with the zoom level. */
export function moveCursor(dx, dy) {
  const s = cursorStep();
  setCursor(
    snap(state.cursor.x + dx * s.x, s.x),
    snap(state.cursor.y + dy * s.y, s.y)
  );
}

/* ── shapes ──────────────────────────────────────────────────────────────── */

/** Start a fresh empty shape and make it active. Returns the new shape. */
export function startNewShape(props = {}) {
  const s = makeShape(props);
  state.shapes.push(s);
  state.activeId = s.id;
  emit("shapes");
  return s;
}

/** Make a shape active by id. */
export function setActiveShape(id) {
  if (state.shapes.some((s) => s.id === id)) {
    state.activeId = id;
    emit("shapes");
  }
}

/** Remove a shape by id. Always keeps at least one shape. */
export function deleteShape(id) {
  if (state.shapes.length <= 1) {
    // last shape: just empty it instead of removing
    const s = state.shapes[0];
    s.points = [];
    s.closed = false;
    s.fillColor = null;
    state.activeId = s.id;
    emit("shapes");
    return;
  }
  const i = state.shapes.findIndex((s) => s.id === id);
  if (i === -1) return;
  state.shapes.splice(i, 1);
  if (state.activeId === id) {
    state.activeId = state.shapes[Math.max(0, i - 1)].id;
  }
  emit("shapes");
}

/** Add a fully-specified shape (used by coordinate paste / import). */
export function addShape({ points = [], closed = false, fillColor = null, strokeColor = null } = {}) {
  const s = makeShape({ points, closed, fillColor, strokeColor });
  state.shapes.push(s);
  state.activeId = s.id;
  fitGridToPoints();
  emit("shapes");
  return s;
}

/** Replace every shape at once (used by load / paste-whole-artwork). */
export function setShapes(list, grid = null) {
  state.mode = "free";
  state.puzzle = null;
  const shapes = (list || []).map((s) => makeShape(s));
  state.shapes = shapes.length ? shapes : [makeShape()];
  state.activeId = state.shapes[0].id;
  if (grid) { Object.assign(state.grid, grid); state.grid.lockAspect = true; enforcePosOnly(); }
  else fitGridToPoints();
  state.cursor.x = clamp(state.cursor.x, state.grid.xMin, state.grid.xMax);
  state.cursor.y = clamp(state.cursor.y, state.grid.yMin, state.grid.yMax);
  emit("shapes");
}

/** Replace the active shape's vertices outright (direct coordinate entry). */
export function setActivePoints(points, closed) {
  const s = activeShape();
  s.points = (points || []).map((p) => ({ x: +p.x, y: +p.y, id: ++_pid })); // keep fractional
  if (closed != null) s.closed = !!closed && s.points.length > 2;
  else if (s.points.length < 3) s.closed = false;
  fitGridToPoints();
  emit("points");
}

/* ── points (act on the active shape) ──────────────────────────────────────── */

/** Register a vertex at the current cursor. Ignores an exact repeat of the
 *  last point. Tapping the first point again closes the active loop. */
export function addPoint() {
  const { x, y } = state.cursor;
  const s = activeShape();
  const last = s.points[s.points.length - 1];
  if (last && last.x === x && last.y === y) return null;
  const first = s.points[0];
  if (s.points.length > 2 && first && first.x === x && first.y === y) {
    s.closed = true;
    emit("close");
    return null;
  }
  const pt = { x, y, id: ++_pid };
  s.points.push(pt);
  emit("points");
  return pt;
}

/** Remove a point by id (used by double-click on a marker). */
export function deletePointById(id) {
  for (const s of state.shapes) {
    const i = s.points.findIndex((p) => p.id === id);
    if (i !== -1) {
      s.points.splice(i, 1);
      if (s.points.length < 3) s.closed = false;
      emit("points");
      return;
    }
  }
}

/** Remove the most recently added point from the active shape. */
export function deleteLastPoint() {
  const s = activeShape();
  if (!s.points.length) return;
  s.points.pop();
  if (s.points.length < 3) s.closed = false;
  emit("points");
}

/** Remove a point sitting on the cursor in the active shape, if any. */
export function deletePointAtCursor() {
  const s = activeShape();
  const { x, y } = state.cursor;
  const i = s.points.findIndex((p) => p.x === x && p.y === y);
  if (i === -1) return false;
  s.points.splice(i, 1);
  if (s.points.length < 3) s.closed = false;
  emit("points");
  return true;
}

/** Clear the active shape's points. */
export function clearPoints() {
  const s = activeShape();
  s.points = [];
  s.closed = false;
  s.fillColor = null;
  emit("points");
}

/** Set (or clear, with null) the active shape's fill colour. */
export function setFill(color) {
  activeShape().fillColor = color;
  emit("points");
}

/** Set (or clear, with null) the active shape's stroke colour. */
export function setStroke(color) {
  activeShape().strokeColor = color;
  emit("points");
}

export function toggleClosed() {
  const s = activeShape();
  if (s.points.length < 3) return;
  s.closed = !s.closed;
  emit("close");
}

/* ── grid window ────────────────────────────────────────────────────────────── */

/** Replace the grid window (merges over current). */
export function setGrid(patch) {
  Object.assign(state.grid, patch);
  enforcePosOnly();
  setCursor(state.cursor.x, state.cursor.y); // keep cursor inside
  emit("grid");
}

/** Set an explicit view window (pan/zoom). Clamped to ±GRID_MAX with a sane
 *  minimum span so you can't invert or over-zoom. `lock` controls aspect:
 *  true → square cells, false → non-uniform (per-axis zoom), undefined → leave
 *  the current lock state untouched. Emits "grid". */
export function setView(xMin, xMax, yMin, yMax, lock) {
  // enforce minimum span
  if (xMax - xMin < MIN_SPAN) {
    const c = (xMax + xMin) / 2;
    xMin = c - MIN_SPAN / 2; xMax = c + MIN_SPAN / 2;
  }
  if (yMax - yMin < MIN_SPAN) {
    const c = (yMax + yMin) / 2;
    yMin = c - MIN_SPAN / 2; yMax = c + MIN_SPAN / 2;
  }
  const g = state.grid;
  // first-quadrant mode: never show below 0 on either axis
  if (g.posOnly) {
    if (xMin < 0) { xMax -= xMin; xMin = 0; }
    if (yMin < 0) { yMax -= yMin; yMin = 0; }
  }
  // bounds stay fractional so deep zoom (sub-unit) works; only clamp to ±GRID_MAX
  g.xMin = Math.max(-GRID_MAX, xMin);
  g.xMax = Math.min(GRID_MAX, xMax);
  g.yMin = Math.max(-GRID_MAX, yMin);
  g.yMax = Math.min(GRID_MAX, yMax);
  if (lock !== undefined) g.lockAspect = lock;
  emit("grid");
}

/** Snap back to square cells (uniform aspect), keeping the current centre. */
export function squareView() {
  state.grid.lockAspect = true;
  emit("grid");
}

/** Toggle first-quadrant mode (hide the negative axes). */
export function setPosOnly(on) {
  state.grid.posOnly = !!on;
  const g = state.grid;
  const sx = g.xMax - g.xMin, sy = g.yMax - g.yMin;
  if (on) setView(0, sx, 0, sy);
  else setView(-sx / 2, sx / 2, -sy / 2, sy / 2);
}

/* ── load / transform ──────────────────────────────────────────────────────── */

/** Load an outline (single shape — used by admin edit) into the FREE studio. */
export function loadShape({ points = [], closed = false, grid = null, shapes = null } = {}) {
  if (shapes) return setShapes(shapes, grid);
  setShapes([{ points, closed }], grid);
}

/** Keep first-quadrant mode after a direct window assignment (load/undo/refit):
 *  shift any negative edge up to 0 so the negative axes stay hidden. */
function enforcePosOnly() {
  if (!state.grid.posOnly) return;
  const g = state.grid;
  if (g.xMin < 0) { g.xMax = Math.min(GRID_MAX, g.xMax - g.xMin); g.xMin = 0; }
  if (g.yMin < 0) { g.yMax = Math.min(GRID_MAX, g.yMax - g.yMin); g.yMin = 0; }
}

/** Grow the grid window (capped at ±GRID_MAX) so every point stays visible.
 *  In first-quadrant mode the window starts at the origin. */
function fitGridToPoints() {
  let need = 0;
  for (const s of state.shapes)
    for (const p of s.points) need = Math.max(need, Math.abs(p.x), Math.abs(p.y));
  const g = state.grid;
  const cur = Math.max(Math.abs(g.xMin), g.xMax, Math.abs(g.yMin), g.yMax);
  const half = Math.min(GRID_MAX, Math.max(cur, need + 1));
  if (g.posOnly) {
    g.xMin = 0; g.xMax = half; g.yMin = 0; g.yMax = half;
  } else {
    g.xMin = -half; g.xMax = half; g.yMin = -half; g.yMax = half;
  }
  g.lockAspect = true; // a fresh window is square again
}

/** Map every point of every shape through fn(x,y)->{x,y}, keeping ids. */
export function transformPoints(fn) {
  let any = false;
  for (const s of state.shapes) {
    if (!s.points.length) continue;
    any = true;
    s.points = s.points.map((p) => {
      const n = fn(p.x, p.y);
      return { x: Math.round(n.x), y: Math.round(n.y), id: p.id };
    });
  }
  if (!any) return;
  fitGridToPoints();
  emit("points");
}

/** Restore a full snapshot (used by undo/redo). */
export function restoreState(snap) {
  if (snap.grid) Object.assign(state.grid, snap.grid);
  enforcePosOnly();
  const list = snap.shapes || [{ points: snap.points || [], closed: snap.closed, fillColor: snap.fillColor }];
  state.shapes = list.map((s) => makeShape(s));
  if (!state.shapes.length) state.shapes = [makeShape()];
  const idx = Number.isInteger(snap.activeIndex)
    ? clamp(snap.activeIndex, 0, state.shapes.length - 1)
    : 0;
  state.activeId = state.shapes[idx].id;
  emit("points");
}

/* ── puzzle mode ─────────────────────────────────────────────────────────── */

export function enterPuzzle(puzzle) {
  state.mode = "puzzle";
  state.puzzle = puzzle;
  state.shapes = [makeShape()];
  state.activeId = state.shapes[0].id;
  if (puzzle.grid) Object.assign(state.grid, puzzle.grid);
  state.grid.lockAspect = true;
  enforcePosOnly();
  state.cursor.x = clamp(0, state.grid.xMin, state.grid.xMax);
  state.cursor.y = clamp(0, state.grid.yMin, state.grid.yMax);
  emit("puzzle");
}

export function exitPuzzle() {
  state.mode = "free";
  state.puzzle = null;
  state.shapes = [makeShape()];
  state.activeId = state.shapes[0].id;
  emit("puzzle");
}

/** Every plotted point across all shapes (for scoring / export bounds). */
export function allPoints() {
  return state.shapes.flatMap((s) => s.points);
}

/** Score the current attempt against the loaded puzzle's target outline.
 *  Order-independent vertex matching over the union of all shapes' points. */
export function scoreAttempt() {
  const targets = (state.puzzle && state.puzzle.targets) || [];
  const total = targets.length;
  const key = (p) => `${p.x},${p.y}`;
  const want = new Set(targets.map(key));
  const got = new Set(allPoints().map(key));
  let correct = 0;
  for (const k of want) if (got.has(k)) correct++;
  const extra = [...got].filter((k) => !want.has(k)).length;
  const missed = total - correct;
  const raw = total ? (correct - extra * 0.5) / total : 0;
  const score = Math.max(0, Math.round(raw * 100));
  const anyClosed = state.shapes.some((s) => s.closed);
  let stars = 0;
  if (score >= 100 && anyClosed) stars = 3;
  else if (score >= 75) stars = 2;
  else if (score >= 40) stars = 1;
  return { total, correct, missed, extra, score, stars };
}

/** Toggle the transform mode (arrows/analog steer the active shape). */
export function setTransformMode(on) {
  state.ui.transformMode = !!on;
  emit("transform");
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
