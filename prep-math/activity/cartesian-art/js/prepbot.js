/* ============================================================================
   Cartesian Art — PrepBot demo (very basic, for now)
   ----------------------------------------------------------------------------
   Narrates and drives the SAME navigation the player uses (setCursor/addPoint/
   toggleClosed/startNewShape) to plot a few simple shapes, one leg at a time:
   move on x, move on y, mark — repeated until the shape is done, then return
   to origin and begin the next shape. Toggled from the hamburger menu FAB.
   ========================================================================== */

import { state, setCursor, addPoint, toggleClosed, startNewShape, activeShape } from "./state.js";

const STEP_MS = 950; // how long each speech-bubble message stays up before acting

/** Very basic demo shapes: each vertex is a {dx,dy} step from the previous
 *  point (first step is from the origin). "Return to origin" closes the
 *  loop back to the first marked vertex (state.toggleClosed), while the
 *  cursor itself glides back to the literal (0,0) home position. */
const DEMO_SHAPES = [
  [{ dx: 4, dy: 0 }, { dx: 0, dy: 4 }, { dx: -4, dy: 0 }], // triangle (closing edge cuts back diagonally)
  [{ dx: 4, dy: 0 }, { dx: 0, dy: 4 }, { dx: -4, dy: 0 }, { dx: 0, dy: -4 }], // square
  [{ dx: 6, dy: 0 }, { dx: 0, dy: 3 }, { dx: -6, dy: 0 }, { dx: 0, dy: -3 }], // rectangle
];

let running = false;
let shapeIndex = 0;
let $widget = null;
let $text = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function say(msg) {
  if ($text) $text.textContent = msg;
  await sleep(STEP_MS);
}

async function runShape(shape) {
  for (const { dx, dy } of shape) {
    if (!running) return;
    if (dx) {
      await say(`Move ${dx > 0 ? "right" : "left"} ${Math.abs(dx)}`);
      if (!running) return;
      setCursor(state.cursor.x + dx, state.cursor.y);
    }
    if (!running) return;
    if (dy) {
      await say(`Move ${dy > 0 ? "up" : "down"} ${Math.abs(dy)}`);
      if (!running) return;
      setCursor(state.cursor.x, state.cursor.y + dy);
    }
    if (!running) return;
    await say("Mark");
    addPoint();
  }
  if (!running) return;
  await say("Return to origin");
  setCursor(0, 0);
  if (activeShape().points.length > 2) toggleClosed();
}

async function loop() {
  while (running) {
    await runShape(DEMO_SHAPES[shapeIndex % DEMO_SHAPES.length]);
    if (!running) break;
    shapeIndex++;
    startNewShape();
    await sleep(STEP_MS);
  }
}

function start() {
  if (running) return;
  running = true;
  if ($widget) $widget.hidden = false;
  setCursor(0, 0);
  loop();
}

function stop() {
  running = false;
  if ($widget) $widget.hidden = true;
}

export function initPrepbot(scope = document) {
  $widget = scope.querySelector("#ca-prepbot");
  $text = scope.querySelector("#ca-prepbot-text");
  const btn = scope.querySelector("#ca-prepbot-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const on = !btn.classList.contains("is-active");
    btn.classList.toggle("is-active", on);
    if (on) start();
    else stop();
  });
}
