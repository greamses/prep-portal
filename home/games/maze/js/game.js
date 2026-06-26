/* ============================================================================
   3D Maze — game logic
   ----------------------------------------------------------------------------
   Builds the engine, a fresh random maze + first-person player, the glowing
   exit, fullscreen + analog movement, and the render loop. Imported by main.js
   only AFTER Babylon has loaded, so the global BABYLON is guaranteed here.
   startGame() resolves once the first scene is ready (used to finish the loader).
   ========================================================================== */

import { createEngine, createScene } from "./engine.js";
import { generateMaze, buildMaze } from "./maze.js";
import { createPlayer } from "./player.js";
import { createJoystick } from "./joystick.js";
import { initMinimap } from "./minimap.js";
import { CFG } from "./config.js";

const B = window.BABYLON;
const $ = (s) => document.querySelector(s);

const HINT = "Click to look around · WASD / Arrow keys (or the stick) to move · Reach the glowing exit";

const canvas = $("#maze-canvas");
let engine, scene, cam, goal, goalPos, won, joy, map;

/* ── glowing exit pillar at the maze's far corner ───────────────────────── */
function buildGoal(scn, pos) {
  const m = B.MeshBuilder.CreateCylinder("goal", { diameter: 1.7, height: CFG.wallH * 0.9, tessellation: 24 }, scn);
  m.position.set(pos.x, (CFG.wallH * 0.9) / 2, pos.z);
  const mat = new B.StandardMaterial("goalMat", scn);
  const c = B.Color3.FromHexString(CFG.colors.goal);
  mat.diffuseColor = c;
  mat.emissiveColor = c.scale(0.55);
  m.material = mat;

  const glow = new B.GlowLayer("glow", scn);
  glow.intensity = 0.9;
  glow.addIncludedOnlyMesh(m);
  return m;
}

/** Move the camera from the analog stick, relative to where it's facing. */
function applyStick() {
  if (!cam || !joy) return;
  const { x, y } = joy.value;
  if (!x && !y) return;
  const fwd = cam.getDirection(B.Axis.Z); fwd.y = 0; fwd.normalize();
  const right = cam.getDirection(B.Axis.X); right.y = 0; right.normalize();
  const move = fwd.scale(-y).add(right.scale(x)).scale(CFG.moveSpeed);
  cam.moveWithCollisions(move);
}

/** Tear down any previous scene and build a brand-new maze. */
function start() {
  if (scene) scene.dispose();
  won = false;
  $("#maze-win").hidden = true;
  $("#maze-hint").hidden = false;
  $("#maze-hint").textContent = HINT;

  scene = createScene(engine);
  const grid = generateMaze(CFG.cols, CFG.rows);
  const info = buildMaze(scene, grid);
  goalPos = info.goalPos;
  goal = buildGoal(scene, goalPos);
  cam = createPlayer(scene, canvas, info.startPos);
  if (map) map.setMaze(grid, CFG.cell);

  scene.registerBeforeRender(() => {
    applyStick();
    if (map && cam) map.update(cam.position.x, cam.position.z, cam.rotation.y);
    if (goal) goal.rotation.y += 0.012;
    if (!won && cam) {
      const dx = cam.position.x - goalPos.x;
      const dz = cam.position.z - goalPos.z;
      if (Math.hypot(dx, dz) < CFG.cell * 0.55) {
        won = true;
        $("#maze-win").hidden = false;
        $("#maze-hint").hidden = true;
        document.exitPointerLock?.();
      }
    }
  });
}

/* ── fullscreen toggle (on the game stage) ──────────────────────────────── */
function fsElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}
function initFullscreen() {
  const stage = $(".maze-stage");
  const btn = $("#maze-fs");
  if (!stage || !btn) return;

  const enterFs = (el) =>
    (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el);
  const exitFs = () =>
    (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen)?.call(document);

  btn.addEventListener("click", () => {
    document.exitPointerLock?.();
    try {
      if (fsElement()) exitFs();
      else {
        const p = enterFs(stage);
        if (p && p.catch) p.catch(() => ($("#maze-hint").textContent = "Fullscreen blocked by the browser."));
      }
    } catch (e) {
      $("#maze-hint").textContent = "Fullscreen isn't available here.";
    }
  });

  const onChange = () => {
    const on = !!fsElement();
    const enter = btn.querySelector(".mz-fs-enter");
    const exit = btn.querySelector(".mz-fs-exit");
    if (enter) enter.hidden = on;
    if (exit) exit.hidden = !on;
    setTimeout(() => engine && engine.resize(), 80);
  };
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange);
}

/** Boot the game. Resolves when the first scene is ready. */
export function startGame() {
  engine = createEngine(canvas);
  joy = createJoystick($("#mz-joy-ring"), $("#mz-joy-knob"));
  map = initMinimap($("#maze-map"));
  start();
  engine.runRenderLoop(() => scene && scene.render());
  window.addEventListener("resize", () => engine.resize());

  initFullscreen();
  $("#maze-new")?.addEventListener("click", start);
  $("#maze-again")?.addEventListener("click", start);

  return new Promise((resolve) => {
    let done = false;
    const fin = () => { if (!done) { done = true; resolve(); } };
    scene.executeWhenReady(fin);
    setTimeout(fin, 6000); // safety
  });
}
