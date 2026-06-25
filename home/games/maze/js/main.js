/* ============================================================================
   3D Maze — entry point
   ----------------------------------------------------------------------------
   Boots the Babylon engine, builds a fresh random maze + first-person player,
   spawns a glowing goal pillar in the far corner, and runs the render loop.
   Reaching the goal shows the win banner; "New maze" / "Play again" rebuild.
   ========================================================================== */

import { createEngine, createScene } from "./engine.js";
import { generateMaze, buildMaze } from "./maze.js";
import { createPlayer } from "./player.js";
import { CFG } from "./config.js";

const B = window.BABYLON;
const $ = (s) => document.querySelector(s);

const canvas = $("#maze-canvas");
let engine, scene, cam, goal, goalPos, won;

/** A glowing exit pillar at the maze's far corner. */
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

/** Tear down any previous scene and build a brand-new maze. */
function start() {
  if (scene) scene.dispose();
  won = false;
  $("#maze-win").hidden = true;
  $("#maze-hint").hidden = false;

  scene = createScene(engine);
  const grid = generateMaze(CFG.cols, CFG.rows);
  const info = buildMaze(scene, grid);
  goalPos = info.goalPos;
  goal = buildGoal(scene, goalPos);
  cam = createPlayer(scene, canvas, info.startPos);

  scene.registerBeforeRender(() => {
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

function init() {
  if (!window.BABYLON) {
    $("#maze-hint").textContent = "Couldn't load the 3D engine. Check your connection and refresh.";
    return;
  }
  engine = createEngine(canvas);
  start();
  engine.runRenderLoop(() => scene && scene.render());
  window.addEventListener("resize", () => engine.resize());

  $("#maze-new")?.addEventListener("click", start);
  $("#maze-again")?.addEventListener("click", start);
}

init();
