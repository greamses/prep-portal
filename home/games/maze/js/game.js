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
import { loadCharacter, loadZombie, loadGuide, placeholderCharacter } from "./character.js";
import { createJoystick } from "./joystick.js";
import { initMinimap } from "./minimap.js";
import { createEnemies } from "./enemy.js";
import { createGuide } from "./guide.js";
import { initRiddles, openRiddle, isRiddleOpen, closeRiddle } from "./riddles.js";
import { initSettings } from "./settings.js";
import { CFG } from "./config.js";

const B = window.BABYLON;
const $ = (s) => document.querySelector(s);

const canvas = $("#maze-canvas");
let engine, scene, goal, goalPos, won, lost, joy, map, enemies, player;
let graceUntil = Infinity, alerted = false, alertTimer = null, woke = false;
let door = null, doorState = "shut", doorBaseY = 0, entranceDoorZ = 0;
let gates = [];
// deferred zombie: pre-warmed in the background, spawned after she passes the
// entrance AND makes her first turn
let turned = false, initHeading = null, zombieRequested = false, prevX = null, prevZ = null;
let zombieModel = null, zombieReady = false, zombieSpawned = false, chaserWakeAt = 0;
let playerChar = null;
let guide = null, guidePath = []; // the Erika guide who leads to the exit
let ready = false; // scene fully built (camera exists) — gate the render loop

const keys = new Set();

/* ── input: keyboard + stick → { x: strafe, y: forward, run } ─────────────── */
function readInput() {
  let x = 0, y = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) y += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) y -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
  let stickMag = 0;
  if (joy) { x += joy.value.x; y += -joy.value.y; stickMag = Math.hypot(joy.value.x, joy.value.y); }
  x = Math.max(-1, Math.min(1, x));
  y = Math.max(-1, Math.min(1, y));
  return { x, y, run: keys.has("ShiftLeft") || keys.has("ShiftRight"), stickMag };
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

/** Quietly load the zombie in the background (hidden) so spawning is instant. */
function prewarmZombie() {
  zombieModel = null;
  zombieReady = false;
  if (!CFG.enemyCount) { zombieReady = true; return; }
  const s = scene;
  loadZombie(s)
    .then((z) => {
      if (s !== scene) { z.root?.dispose?.(); return; } // maze changed during load
      z.root.setEnabled(false); // keep hidden until spawned
      zombieModel = z;
      zombieReady = true;
    })
    .catch(() => { zombieModel = null; zombieReady = true; }); // octahedron fallback
}

/** Load the Erika guide in the background; she starts leading once loaded. */
function prewarmGuide() {
  guide = null;
  const s = scene, pth = guidePath;
  loadGuide(s)
    .then((rig) => {
      if (s !== scene) { rig.root?.dispose?.(); return; } // maze changed during load
      guide = createGuide(s, rig, pth, gates);
    })
    .catch((e) => { console.warn("[maze] guide load failed:", e); guide = null; });
}

/* ── glowing exit pillar ──────────────────────────────────────────────────── */
function buildGoal(scn, pos) {
  const m = B.MeshBuilder.CreateCylinder("goal", { diameter: 1.7, height: CFG.wallH * 0.9, tessellation: 24 }, scn);
  m.position.set(pos.x, (CFG.wallH * 0.9) / 2, pos.z);
  const mat = new B.StandardMaterial("goalMat", scn);
  const c = B.Color3.FromHexString(CFG.goalColor);
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
  woke = false;
  turned = false;
  initHeading = null;
  zombieRequested = false;
  zombieSpawned = false;
  prevX = prevZ = null;
  graceUntil = Infinity;
  $("#maze-win").hidden = true;
  $("#maze-lose").hidden = true;
  $("#maze-hint").hidden = true;
  hideGrace();

  scene = createScene(engine);
  const grid = generateMaze(CFG.cols, CFG.rows);
  const info = buildMaze(scene, grid);
  goalPos = info.goalPos;
  goal = buildGoal(scene, goalPos);
  guidePath = info.path || [];

  let character;
  try { character = await loadCharacter(scene); }
  catch (e) { character = placeholderCharacter(scene); }
  playerChar = character;

  player = createPlayer(scene, canvas, info.startPos, character, grid, info.entrance, () => doorState);
  enemies = createEnemies(scene, grid, { speed: CFG.enemySpeed }); // chaser spawned later
  prewarmZombie(); // load the detailed chaser quietly in the background
  // hide shadow zombies in random dead-ends — they wake when you run past
  const aspots = (info.deadEnds || []).slice();
  for (let i = aspots.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [aspots[i], aspots[j]] = [aspots[j], aspots[i]]; }
  aspots.slice(0, CFG.ambushCount).forEach((cell) => enemies.spawnShadow(cell));
  gates = info.gates || [];
  prewarmGuide(); // load Erika; she leads once the player is inside
  closeRiddle();
  if (map) map.setMaze(grid, CFG.cell);
  // NOTE: do NOT build a selection octree here. It snapshots only the meshes that
  // exist at call time, and every enemy (chaser + ambushers) loads asynchronously
  // AFTER this — an octree would exclude them from active-mesh selection and they
  // would never render (the long-standing "invisible zombies" bug). Default
  // frustum selection + pickWithRay for camera occlusion are plenty for this maze.
  chaserWakeAt = 0;

  // one-way gate: shut until she reaches it, opens to enter, seals behind her
  door = info.door;
  doorState = "shut";
  doorBaseY = door ? door.position.y : 0;
  entranceDoorZ = info.entrance ? info.entrance.doorZ : 0;

  scene.registerBeforeRender(() => {
    const over = won || lost;
    const now = performance.now();
    const body = player.body;

    const riddling = isRiddleOpen();
    const input = (over || riddling) ? { x: 0, y: 0, run: false } : readInput();
    if (!over) player.update(input);

    // bring the zombie in only AFTER she passes the entrance and turns once
    if (!zombieRequested && CFG.enemyCount > 0) {
      if (prevX !== null) {
        const ddx = body.position.x - prevX, ddz = body.position.z - prevZ;
        if (Math.hypot(ddx, ddz) > 0.02) {
          const heading = Math.atan2(ddx, ddz);
          if (initHeading === null) { if (doorState === "sealed") initHeading = heading; }
          else {
            const d = Math.abs(((heading - initHeading + Math.PI) % (Math.PI * 2)) - Math.PI);
            if (d > 0.9) turned = true;
          }
        }
      }
      prevX = body.position.x; prevZ = body.position.z;
      if (doorState === "sealed" && turned) zombieRequested = true;
    }
    // spawn the (pre-warmed) chaser once requested + loaded — it wakes after a countdown
    if (zombieRequested && !zombieSpawned && zombieReady && enemies) {
      zombieSpawned = true;
      alerted = false;
      chaserWakeAt = now + CFG.graceMs;
      enemies.spawn(zombieModel, { cell: [0, 0], awake: false, wakeAt: chaserWakeAt });
    }
    // chaser wake countdown HUD
    if (zombieSpawned && chaserWakeAt) {
      if (now < chaserWakeAt) showGrace(Math.max(1, Math.ceil((chaserWakeAt - now) / 1000)));
      else if (!alerted) { alerted = true; flashAlert(); }
    }

    if (enemies) enemies.update(body.position); // ambushers wake on proximity
    if (guide) guide.update(body.position, !over && doorState === "sealed"); // lead once inside
    if (map) {
      const pts = enemies ? enemies.enemies.map((e) => ({ x: e.mesh.position.x, z: e.mesh.position.z })) : [];
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

    // caught → zombie bites, she plays her death, then the defeat screen
    if (enemies && enemies.caught(body.position)) {
      lost = true;
      enemies.bite(body.position);
      if (playerChar) playerChar.play("death");
      setTimeout(() => endGame("maze-lose"), 1400);
      return;
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
  initSettings(() => start());

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
