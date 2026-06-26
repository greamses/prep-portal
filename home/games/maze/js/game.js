/* ============================================================================
   3D Maze — game logic (third-person)
   ----------------------------------------------------------------------------
   Builds the engine, a random maze, the Mixamo character (third-person), the
   glowing exit and the hunters. COD-style controls: left stick / WASD move
   relative to the camera, drag / right-stick orbits the camera, the character
   turns to face movement. Imported by main.js after Babylon + glTF loader exist.
   ========================================================================== */

import { createEngine, createScene } from "./engine.js";
import { generateMaze, buildMaze } from "./maze.js";
import { createPlayer } from "./player.js";
import { loadCharacter, loadZombie, placeholderCharacter } from "./character.js";
import { createJoystick } from "./joystick.js";
import { initMinimap } from "./minimap.js";
import { createEnemies } from "./enemy.js";
import { initRiddles, openRiddle, isRiddleOpen, closeRiddle } from "./riddles.js";
import { CFG } from "./config.js";

const B = window.BABYLON;
const $ = (s) => document.querySelector(s);

const canvas = $("#maze-canvas");
let engine, scene, goal, goalPos, won, lost, joy, map, enemies, player;
let graceUntil = 0, alerted = false, alertTimer = null;
let door = null, doorState = "shut", doorBaseY = 0, entranceDoorZ = 0;
let gates = [];
let ready = false; // scene fully built (camera exists) — gate the render loop

const keys = new Set();

/* ── input: keyboard + stick → { x: strafe, y: forward, run } ─────────────── */
function readInput() {
  let x = 0, y = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) y += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) y -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
  if (joy) { x += joy.value.x; y += -joy.value.y; }
  x = Math.max(-1, Math.min(1, x));
  y = Math.max(-1, Math.min(1, y));
  return { x, y, run: keys.has("ShiftLeft") || keys.has("ShiftRight") };
}

/* ── grace-period HUD ─────────────────────────────────────────────────────── */
function showGrace(sec) {
  const el = $("#maze-grace");
  if (!el) return;
  el.hidden = false;
  el.classList.remove("is-alert");
  el.textContent = `HUNTERS WAKE IN ${sec}`;
}
function flashAlert() {
  const el = $("#maze-grace");
  if (!el) return;
  el.hidden = false;
  el.classList.add("is-alert");
  el.textContent = "HUNTERS ACTIVE";
  clearTimeout(alertTimer);
  alertTimer = setTimeout(() => { el.hidden = true; }, 1300);
}
function hideGrace() {
  clearTimeout(alertTimer);
  const el = $("#maze-grace");
  if (el) el.hidden = true;
}

function endGame(overlayId) {
  $("#" + overlayId).hidden = false;
  $("#maze-hint").hidden = true;
  hideGrace();
  closeRiddle();
}

/* ── glowing exit pillar ──────────────────────────────────────────────────── */
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

/* ── build / rebuild a maze ───────────────────────────────────────────────── */
async function start() {
  ready = false;
  if (scene) scene.dispose();
  won = false;
  lost = false;
  alerted = false;
  graceUntil = performance.now() + CFG.graceMs;
  $("#maze-win").hidden = true;
  $("#maze-lose").hidden = true;
  $("#maze-hint").hidden = true;
  hideGrace();

  scene = createScene(engine);
  const grid = generateMaze(CFG.cols, CFG.rows);
  const info = buildMaze(scene, grid);
  goalPos = info.goalPos;
  goal = buildGoal(scene, goalPos);

  let character;
  try { character = await loadCharacter(scene); }
  catch (e) { character = placeholderCharacter(scene); }

  let zombie = null;
  if (CFG.enemyCount > 0) { try { zombie = await loadZombie(scene); } catch (e) { zombie = null; } }

  player = createPlayer(scene, canvas, info.startPos, character, grid, info.entrance, () => doorState);
  enemies = createEnemies(scene, grid, { count: CFG.enemyCount, speed: CFG.enemySpeed, model: zombie });
  gates = info.gates || [];
  closeRiddle();
  if (map) map.setMaze(grid, CFG.cell);

  // one-way gate: shut until she reaches it, opens to enter, seals behind her
  door = info.door;
  doorState = "shut";
  doorBaseY = door ? door.position.y : 0;
  entranceDoorZ = info.entrance ? info.entrance.doorZ : 0;

  scene.registerBeforeRender(() => {
    const over = won || lost;
    const now = performance.now();
    const haveEnemies = enemies && enemies.enemies.length > 0;
    const hunting = haveEnemies && now >= graceUntil;
    const body = player.body;

    const riddling = isRiddleOpen();
    if (!over) player.update(riddling ? { x: 0, y: 0, run: false } : readInput());
    if (haveEnemies) enemies.update(body.position, hunting && !over); // zombies keep coming during riddles
    if (map) {
      const pts = haveEnemies ? enemies.enemies.map((e) => ({ x: e.mesh.position.x, z: e.mesh.position.z })) : [];
      map.update(body.position.x, body.position.z, body.rotation.y - CFG.modelYaw, pts);
    }
    if (goal) goal.rotation.y += 0.012;
    if (over) return;

    // riddle gates: walking up to a locked gate pops its wheel riddle
    if (!riddling) {
      for (const g of gates) {
        if (g.solved || g.active) continue;
        if (Math.hypot(body.position.x - g.pos.x, body.position.z - g.pos.z) < 1.7) {
          g.active = true;
          openRiddle(() => { g.open(); g.active = false; });
          break;
        }
      }
    }

    // gate: open when she walks up to it, seal it once she's inside
    if (door) {
      const z = body.position.z;
      if (doorState === "shut" && z > entranceDoorZ - 0.95) {
        doorState = "open";
        B.Animation.CreateAndStartAnimation("doorOpen", door, "position.y", 60, 55, doorBaseY, doorBaseY + CFG.wallH * 1.3, 0);
      } else if (doorState === "open" && z > entranceDoorZ + 1.6) {
        doorState = "sealed";
        B.Animation.CreateAndStartAnimation("doorClose", door, "position.y", 60, 55, door.position.y, doorBaseY, 0);
      }
    }

    if (haveEnemies) {
      if (!hunting) {
        showGrace(Math.max(0, Math.ceil((graceUntil - now) / 1000)));
      } else if (!alerted) {
        alerted = true;
        enemies.setAlert(true);
        flashAlert();
      }
      if (enemies.caught(body.position)) {
        lost = true;
        endGame("maze-lose");
        return;
      }
    }
    const dx = body.position.x - goalPos.x;
    const dz = body.position.z - goalPos.z;
    if (Math.hypot(dx, dz) < CFG.cell * 0.55) {
      won = true;
      endGame("maze-win");
    }
  });

  ready = true;
}

/* ── fullscreen toggle ────────────────────────────────────────────────────── */
function fsElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}
function initFullscreen() {
  const stage = $(".maze-stage");
  const btn = $("#maze-fs");
  if (!stage || !btn) return;
  const enterFs = (el) => (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el);
  const exitFs = () => (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen)?.call(document);
  btn.addEventListener("click", () => {
    try { fsElement() ? exitFs() : enterFs(stage); } catch (e) {}
  });
  const onChange = () => {
    const on = !!fsElement();
    btn.querySelector(".mz-fs-enter") && (btn.querySelector(".mz-fs-enter").hidden = on);
    btn.querySelector(".mz-fs-exit") && (btn.querySelector(".mz-fs-exit").hidden = !on);
    setTimeout(() => engine && engine.resize(), 80);
  };
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange);
}

/* ── boot. Resolves once the first scene is ready. ────────────────────────── */
export async function startGame() {
  engine = createEngine(canvas);
  joy = createJoystick($("#mz-joy-ring"), $("#mz-joy-knob"));
  map = initMinimap($("#maze-map"));
  initRiddles();

  const MOVE = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  window.addEventListener("keydown", (e) => {
    if (e.target && e.target.tagName === "INPUT") return; // let the riddle input type
    keys.add(e.code);
    if (MOVE.includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("blur", () => keys.clear());

  await start();

  engine.runRenderLoop(() => { if (ready && scene && scene.activeCamera) scene.render(); });
  window.addEventListener("resize", () => engine.resize());

  initFullscreen();
  $("#maze-new")?.addEventListener("click", start);
  $("#maze-again")?.addEventListener("click", start);
  $("#maze-retry")?.addEventListener("click", start);

  return new Promise((resolve) => {
    let done = false;
    const fin = () => { if (!done) { done = true; resolve(); } };
    scene.executeWhenReady(fin);
    setTimeout(fin, 6000);
  });
}
