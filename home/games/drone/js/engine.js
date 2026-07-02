/* ============================================================================
   Bearing Courier — engine + scene
   ----------------------------------------------------------------------------
   Creates the Babylon engine and a bright-sky scene: hemispheric + directional
   light, a gridded ground (so motion reads clearly from above), soft distance
   fog, and the depot pad at the origin. Babylon is the global `BABYLON`.
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
  scene.clearColor = B.Color4.FromHexString(CFG.sky + "ff");
  scene.fogMode = B.Scene.FOGMODE_EXP2;
  scene.fogColor = B.Color3.FromHexString(CFG.fog);
  scene.fogDensity = CFG.fogD;

  // ── lights ────────────────────────────────────────────────────────────────
  const hemi = new B.HemisphericLight("hemi", new B.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.95;
  hemi.groundColor = new B.Color3(0.4, 0.45, 0.5);

  const dir = new B.DirectionalLight("dir", new B.Vector3(-0.4, -1, -0.3), scene);
  dir.position = new B.Vector3(60, 120, 60);
  dir.intensity = 0.55;

  // ── ground with a printed grid (reads well from the chase camera) ─────────
  const span = CFG.worldSize;
  const ground = B.MeshBuilder.CreateGround("ground", { width: span, height: span }, scene);
  const gmat = new B.StandardMaterial("groundMat", scene);
  const tex = makeGridTexture(scene);
  tex.uScale = span / 20;
  tex.vScale = span / 20;
  gmat.diffuseTexture = tex;
  gmat.specularColor = new B.Color3(0, 0, 0);
  ground.material = gmat;

  // ── depot (home base) at the origin ───────────────────────────────────────
  const depot = B.MeshBuilder.CreateCylinder("depot", { diameter: CFG.baseRadius * 2, height: 0.6, tessellation: 32 }, scene);
  depot.position.set(0, 0.3, 0);
  const dmat = new B.StandardMaterial("depotMat", scene);
  dmat.diffuseColor = B.Color3.FromHexString(CFG.depot);
  dmat.emissiveColor = B.Color3.FromHexString(CFG.depot).scale(0.3);
  dmat.specularColor = new B.Color3(0, 0, 0);
  depot.material = dmat;
  // a small control tower so the base is a clear landmark to fly back to
  const tower = B.MeshBuilder.CreateBox("tower", { width: 3, height: 10, depth: 3 }, scene);
  tower.position.set(0, 5, 0);
  const tmat = new B.StandardMaterial("towerMat", scene);
  tmat.diffuseColor = B.Color3.FromHexString(CFG.depot).scale(0.8);
  tmat.emissiveColor = B.Color3.FromHexString(CFG.depot).scale(0.25);
  tmat.specularColor = new B.Color3(0, 0, 0);
  tower.material = tmat;

  // ── neighbourhood of houses (occludes the drop pads) ──────────────────────
  scene.metadata = { houses: buildNeighbourhood(scene) };

  return scene;
}

/** Scatter numbered houses on a jittered grid, leaving the base clearing empty.
    Each house floats a billboard door-number so the pilot can read the street.
    Returns [{ x, z, r, number, roofHex }] so the mission can target a house. */
function buildNeighbourhood(scene) {
  const houses = [];
  const roofColors = ["#cc6666", "#cc9966", "#6699aa", "#77aa66", "#aa6677", "#8899bb"];
  const wallColors = ["#e6ddd0", "#dcd3c4", "#e9e2d4", "#d6cdbd"];
  const half = CFG.worldSize / 2 - 24;
  const step = 32;
  const wallMats = wallColors.map((h) => flatMat(scene, h, 0.12));
  const roofMats = roofColors.map((h) => flatMat(scene, h, 0.32));

  let number = 2; // door numbers start at 2 (base is "1")
  for (let gx = -half; gx <= half; gx += step) {
    for (let gz = -half; gz <= half; gz += step) {
      // keep the base clearing (and its approach) open
      if (Math.hypot(gx, gz) < CFG.baseRadius + 22) continue;
      if (Math.random() < 0.18) continue; // some empty lots → streets/yards
      const x = gx + (Math.random() - 0.5) * 8;
      const z = gz + (Math.random() - 0.5) * 8;
      const w = 8 + Math.random() * 5;
      const d = 8 + Math.random() * 5;
      const h = 5 + Math.random() * 4;
      const roofIdx = (Math.random() * roofMats.length) | 0;

      const body = B.MeshBuilder.CreateBox("house", { width: w, height: h, depth: d }, scene);
      body.position.set(x, h / 2, z);
      body.material = wallMats[(Math.random() * wallMats.length) | 0];

      const roof = B.MeshBuilder.CreateCylinder("roof", { diameterTop: 0, diameterBottom: Math.max(w, d) * 1.15, height: 3.6, tessellation: 4 }, scene);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(x, h + 1.6, z);
      roof.scaling.z = d / Math.max(w, d);
      roof.material = roofMats[roofIdx];

      addNumberLabel(scene, x, h + 6.5, z, number);
      houses.push({ x, z, r: Math.max(w, d) * 0.75, number, roofHex: roofColors[roofIdx] });
      number++;
    }
  }
  return houses;
}

/** A small billboarded door-number plane that floats above a house. */
function addNumberLabel(scene, x, y, z, n) {
  const dt = new B.DynamicTexture("num" + n, { width: 128, height: 128 }, scene, true);
  dt.hasAlpha = true;
  const ctx = dt.getContext();
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = "rgba(14,26,40,0.82)";
  roundRect(ctx, 14, 34, 100, 60, 14);
  ctx.fill();
  ctx.fillStyle = "#f0a868";
  ctx.font = "bold 54px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(n), 64, 66);
  dt.update();

  const plane = B.MeshBuilder.CreatePlane("label" + n, { width: 5.6, height: 5.6 }, scene);
  plane.position.set(x, y, z);
  plane.billboardMode = B.Mesh.BILLBOARDMODE_ALL;
  const m = new B.StandardMaterial("labelMat" + n, scene);
  m.diffuseTexture = dt;
  m.emissiveColor = new B.Color3(1, 1, 1);
  m.diffuseColor = new B.Color3(0, 0, 0);
  m.specularColor = new B.Color3(0, 0, 0);
  m.useAlphaFromDiffuseTexture = true;
  m.transparencyMode = B.Material.MATERIAL_ALPHABLEND;
  m.backFaceCulling = false;
  plane.material = m;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function flatMat(scene, hex, emis) {
  const m = new B.StandardMaterial("m", scene);
  m.diffuseColor = B.Color3.FromHexString(hex);
  m.emissiveColor = B.Color3.FromHexString(hex).scale(emis);
  m.specularColor = new B.Color3(0, 0, 0);
  return m;
}

/** One grid cell: pale fill + crisp gridline on two edges (tiles seamlessly). */
function makeGridTexture(scene) {
  const S = 128;
  const tex = new B.DynamicTexture("grid", { width: S, height: S }, scene, true);
  const ctx = tex.getContext();
  ctx.fillStyle = CFG.ground;
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = CFG.grid;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, S, S);
  tex.update();
  tex.wrapU = B.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = B.Texture.WRAP_ADDRESSMODE;
  return tex;
}
