/* ============================================================================
   3D Maze — engine + scene
   ----------------------------------------------------------------------------
   Creates the Babylon engine and a fresh scene (lights, ground, sky colour,
   collisions + gravity enabled). Babylon is loaded as the global `BABYLON` from
   the CDN <script> in index.html, so we read it off `window` here.
   ========================================================================== */

import { CFG } from "./config.js";

const B = window.BABYLON;

export function createEngine(canvas) {
  return new B.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true,
    adaptToDeviceRatio: true,
  });
}

export function createScene(engine) {
  const scene = new B.Scene(engine);
  scene.clearColor = B.Color4.FromHexString(CFG.colors.sky + "ff");
  scene.collisionsEnabled = true;
  scene.gravity = new B.Vector3(0, -0.45, 0);
  scene.fogMode = B.Scene.FOGMODE_EXP2;
  scene.fogColor = B.Color3.FromHexString(CFG.colors.sky);
  scene.fogDensity = 0.012;

  // ── lights ──────────────────────────────────────────────────────────────
  const hemi = new B.HemisphericLight("hemi", new B.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.9;
  hemi.groundColor = new B.Color3(0.35, 0.33, 0.3);

  const dir = new B.DirectionalLight("dir", new B.Vector3(-0.5, -1, -0.45), scene);
  dir.position = new B.Vector3(20, 40, 20);
  dir.intensity = 0.6;

  // ── ground ──────────────────────────────────────────────────────────────
  const span = Math.max(CFG.cols, CFG.rows) * CFG.cell * 1.6;
  const ground = B.MeshBuilder.CreateGround("ground", { width: span, height: span }, scene);
  ground.position.set(((CFG.cols - 1) * CFG.cell) / 2, 0, ((CFG.rows - 1) * CFG.cell) / 2);
  const gmat = new B.StandardMaterial("groundMat", scene);
  gmat.diffuseColor = B.Color3.FromHexString(CFG.colors.ground);
  gmat.specularColor = new B.Color3(0, 0, 0);
  ground.material = gmat;
  ground.checkCollisions = true;

  return scene;
}
