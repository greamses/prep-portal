/**
 * main.js — bootstraps the game: scene, board, rules engine, HUD and
 * interaction, then drives the render loop and wires the control buttons.
 */
import * as THREE from "three";
import { createScene } from "./scene.js";
import { createBoard } from "./board.js";
import { ChessGame } from "./game.js";
import { createHUD } from "./hud.js";
import { createInteraction } from "./interaction.js";
import { DIFFICULTY } from "./ai.js";

const canvas = document.getElementById("scene");
const { renderer, scene, camera, controls } = createScene(canvas);

/* ---------- Board ---------- */
const board = createBoard();
scene.add(board.group);

/* ---------- Rules + UI ---------- */
const game = new ChessGame();
const hud = createHUD();
const interaction = createInteraction({
  scene,
  camera,
  controls,
  dom: renderer.domElement,
  board,
  game,
  hud,
});
interaction.setup();

/* ---------- Controls ---------- */
document.getElementById("btn-undo").addEventListener("click", () => interaction.undo());
document.getElementById("btn-new").addEventListener("click", () => {
  if (game.history.length === 0 || confirm("Start a new game?")) interaction.newGame();
});

/* ---------- AI opponent (cycles Off → Easy → Medium → Hard) ---------- */
const AI_MODES = [
  { label: "2 Players", depth: null },
  { label: "AI · Easy", depth: DIFFICULTY.easy },
  { label: "AI · Medium", depth: DIFFICULTY.medium },
  { label: "AI · Hard", depth: DIFFICULTY.hard },
];
let aiMode = 0;
const aiLabel = document.getElementById("ai-label");
document.getElementById("btn-ai").addEventListener("click", () => {
  aiMode = (aiMode + 1) % AI_MODES.length;
  const mode = AI_MODES[aiMode];
  aiLabel.textContent = mode.label;
  interaction.setAI(mode.depth);
});

/* ---------- Fullscreen ---------- */
const fsBtn = document.getElementById("btn-fullscreen");
const fsOpen = document.getElementById("fs-icon-open");
const fsClose = document.getElementById("fs-icon-close");
const fsLabel = document.getElementById("fs-label");
const appEl = document.getElementById("app");

fsBtn.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen?.();
  } else {
    (appEl.requestFullscreen || appEl.webkitRequestFullscreen)?.call(appEl);
  }
});

function syncFullscreenUI() {
  const on = !!document.fullscreenElement;
  fsOpen.hidden = on;
  fsClose.hidden = !on;
  fsLabel.textContent = on ? "Exit" : "Fullscreen";
}
document.addEventListener("fullscreenchange", syncFullscreenUI);

let flipped = false;
const flipBtn = document.getElementById("btn-flip");
flipBtn.addEventListener("click", () => {
  flipped = !flipped;
  flipCamera(flipped);
});

// Smoothly swing the camera to the far side of the board.
let camFlip = null;
function flipCamera(toBlackSide) {
  const r = Math.hypot(camera.position.x, camera.position.z);
  const y = camera.position.y;
  const targetZ = toBlackSide ? -r : r;
  camFlip = {
    t: 0,
    dur: 0.7,
    fromX: camera.position.x,
    fromZ: camera.position.z,
    toX: 0,
    toZ: targetZ,
    y,
  };
}

/* ---------- Render loop ---------- */
let last = 0;
let loaderHidden = false;
function animate(now) {
  requestAnimationFrame(animate);
  const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
  last = now;

  if (camFlip) {
    camFlip.t += dt;
    const p = Math.min(camFlip.t / camFlip.dur, 1);
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    camera.position.x = camFlip.fromX + (camFlip.toX - camFlip.fromX) * e;
    camera.position.z = camFlip.fromZ + (camFlip.toZ - camFlip.fromZ) * e;
    camera.position.y = camFlip.y;
    if (p >= 1) camFlip = null;
  }

  interaction.update(dt);
  controls.update();
  renderer.render(scene, camera);

  if (!loaderHidden) {
    loaderHidden = true;
    hideLoader();
  }
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;
  const status = document.getElementById("loader-status");
  if (status) status.textContent = "READY";
  setTimeout(() => {
    loader.classList.add("fade-out");
    loader.addEventListener("transitionend", () => loader.remove(), { once: true });
  }, 250);
}

/* ---------- Keyboard niceties ---------- */
window.addEventListener("keydown", (e) => {
  if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    interaction.undo();
  } else if (e.key.toLowerCase() === "f") {
    flipped = !flipped;
    flipCamera(flipped);
  }
});

requestAnimationFrame(animate);
console.log("Grand Chess — ready");
