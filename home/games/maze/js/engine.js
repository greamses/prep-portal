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

  // ── ground (procedural flagstone texture) ────────────────────────────────
  const span = Math.max(CFG.cols, CFG.rows) * CFG.cell * 1.6;
  const ground = B.MeshBuilder.CreateGround("ground", { width: span, height: span }, scene);
  ground.position.set(((CFG.cols - 1) * CFG.cell) / 2, 0, ((CFG.rows - 1) * CFG.cell) / 2);
  const gmat = new B.StandardMaterial("groundMat", scene);
  const ftex = makeFloorTexture(scene);
  ftex.uScale = span / 4;
  ftex.vScale = span / 4;
  gmat.diffuseTexture = ftex;
  gmat.specularColor = new B.Color3(0, 0, 0);
  ground.material = gmat;
  ground.checkCollisions = true;

  return scene;
}

/** Procedural flagstone floor (2×2 stones per tile, grout + speckle). */
function makeFloorTexture(scene) {
  const S = 256;
  const tex = new B.DynamicTexture("floor", { width: S, height: S }, scene, true);
  const ctx = tex.getContext();
  const base = B.Color3.FromHexString(CFG.colors.ground);

  ctx.fillStyle = "#34302a"; // grout
  ctx.fillRect(0, 0, S, S);

  const n = 2;
  const t = S / n;
  const gap = 7;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = 0.78 + Math.random() * 0.36;
      ctx.fillStyle = `rgb(${Math.min(255, base.r * 255 * v) | 0}, ${Math.min(255, base.g * 255 * v) | 0}, ${Math.min(255, base.b * 255 * v) | 0})`;
      ctx.fillRect(c * t + gap / 2, r * t + gap / 2, t - gap, t - gap);
    }
  }
  // speckle for grit
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
    ctx.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  tex.update();
  tex.wrapU = B.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = B.Texture.WRAP_ADDRESSMODE;
  return tex;
}
