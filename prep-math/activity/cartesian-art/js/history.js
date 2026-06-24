/* ============================================================================
   Cartesian Art — undo / redo
   ----------------------------------------------------------------------------
   A linear snapshot history covering everything a learner can edit: the plotted
   points, whether the loop is closed, the fill colour, the grid window, and the
   brush canvas (as a data URL). Vector edits auto-commit (we listen for the
   "points"/"close" state events); brush strokes and paint-clears commit
   explicitly from paint.js. Loading a puzzle resets the timeline.
   ========================================================================== */

import { state, subscribe, restoreState } from "./state.js";

const CAP = 60;
let stack = [];
let idx = -1;
let restoring = false;

// brush canvas bridge (registered by paint.js)
let getImg = () => null;
let putImg = () => {};

export function registerCanvas(getDataURL, putDataURL) {
  getImg = getDataURL;
  putImg = putDataURL;
}

function snapshot() {
  const g = state.grid;
  return {
    points: state.points.map((p) => ({ x: p.x, y: p.y })),
    closed: state.closed,
    fillColor: state.paint.fillColor,
    grid: { xMin: g.xMin, xMax: g.xMax, yMin: g.yMin, yMax: g.yMax, step: g.step },
    img: getImg(),
  };
}

function apply(snap) {
  restoring = true;
  restoreState(snap); // points / closed / fill / grid (emits "points")
  putImg(snap.img); // brush layer (async draw)
  restoring = false;
  updateButtons();
}

/** Record the current state as a new history entry. */
export function commit() {
  if (restoring) return;
  stack = stack.slice(0, idx + 1); // drop any redo tail
  stack.push(snapshot());
  if (stack.length > CAP) stack.shift();
  idx = stack.length - 1;
  updateButtons();
}

/** Clear the timeline and seed it with the current state as the baseline. */
export function reset() {
  stack = [snapshot()];
  idx = 0;
  updateButtons();
}

export function undo() {
  if (idx <= 0) return;
  idx--;
  apply(stack[idx]);
}
export function redo() {
  if (idx >= stack.length - 1) return;
  idx++;
  apply(stack[idx]);
}

function updateButtons() {
  const u = document.querySelector("#undo-btn");
  const r = document.querySelector("#redo-btn");
  if (u) u.disabled = idx <= 0;
  if (r) r.disabled = idx >= stack.length - 1;
}

export function initHistory() {
  subscribe((reason) => {
    if (restoring) return;
    if (reason === "puzzle") reset(); // new mission → fresh timeline
    else if (reason === "points" || reason === "close") commit();
  });
  reset(); // baseline
  updateButtons();
}
