/* ============================================================================
   Bearing Courier — engine + scene
   ----------------------------------------------------------------------------
   A realistic delivery suburb, built with the same procedural approach as our
   basketball game: canvas (DynamicTexture) materials for grass / brick / roof
   shingles / wood, a warm directional sun with real shadows, soft distance fog,
   and a small number of BIG detailed houses (brick walls, tiled roofs, doors,
   framed windows, a door-number plaque) scattered across a grass field with
   trees and hedges. Babylon is the global `BABYLON`.
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

  // ── lights + sun shadows ──────────────────────────────────────────────────
  const hemi = new B.HemisphericLight("hemi", new B.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.85;
  hemi.diffuse = new B.Color3(1, 0.99, 0.95);
  hemi.groundColor = new B.Color3(0.42, 0.5, 0.4);

  const sun = new B.DirectionalLight("sun", new B.Vector3(-0.55, -1, -0.4), scene);
  sun.position = new B.Vector3(120, 200, 90);
  sun.intensity = 1.5;
  sun.diffuse = new B.Color3(1, 0.94, 0.83);

  const shadowGen = new B.ShadowGenerator(2048, sun);
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 24;
  shadowGen.darkness = 0.42;
  sun.shadowMinZ = 10;
  sun.shadowMaxZ = 700;

  // ── grass ground ──────────────────────────────────────────────────────────
  const span = CFG.worldSize;
  const ground = B.MeshBuilder.CreateGround("ground", { width: span, height: span }, scene);
  const gmat = new B.StandardMaterial("groundMat", scene);
  const grass = makeGrassTexture(scene);
  grass.uScale = span / 12;
  grass.vScale = span / 12;
  gmat.diffuseTexture = grass;
  gmat.specularColor = new B.Color3(0, 0, 0);
  ground.material = gmat;
  ground.receiveShadows = true;

  // ── depot (home base) at the origin ───────────────────────────────────────
  buildBase(scene, shadowGen);

  // ── neighbourhood of big houses + foliage ─────────────────────────────────
  scene.metadata = { houses: buildNeighbourhood(scene, shadowGen), shadowGen };

  return scene;
}

/* ── base ───────────────────────────────────────────────────────────────────*/

function buildBase(scene, shadowGen) {
  const depot = B.MeshBuilder.CreateCylinder("depot", { diameter: CFG.baseRadius * 2, height: 0.6, tessellation: 40 }, scene);
  depot.position.set(0, 0.3, 0);
  depot.material = flatMat(scene, CFG.depot, 0.28);
  depot.receiveShadows = true;

  // painted "H" helipad ring
  const ring = B.MeshBuilder.CreateTorus("baseRing", { diameter: CFG.baseRadius * 1.7, thickness: 0.5, tessellation: 40 }, scene);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.65, 0);
  ring.material = flatMat(scene, "#ffffff", 0.2);

  // control tower / warehouse
  const hall = B.MeshBuilder.CreateBox("hall", { width: 12, height: 7, depth: 9 }, scene);
  hall.position.set(0, 3.5, -CFG.baseRadius - 6);
  hall.material = makeTexMat(scene, makeMetalTexture(scene, "#c9773e"));
  shadowGen.addShadowCaster(hall);
  hall.receiveShadows = true;

  const tower = B.MeshBuilder.CreateBox("tower", { width: 3.2, height: 14, depth: 3.2 }, scene);
  tower.position.set(6, 7, -CFG.baseRadius - 6);
  tower.material = flatMat(scene, "#e2b07a", 0.12);
  shadowGen.addShadowCaster(tower);
  const cab = B.MeshBuilder.CreateBox("cab", { width: 4.4, height: 3, depth: 4.4 }, scene);
  cab.position.set(6, 15.5, -CFG.baseRadius - 6);
  cab.material = glassMat(scene);
  shadowGen.addShadowCaster(cab);
}

/* ── neighbourhood ───────────────────────────────────────────────────────────*/

/** A handful of BIG detailed houses on a sparse jittered grid, with trees and
    hedges filling the gaps. Returns [{ x, z, r, number }] so the mission can
    target a specific house. */
function buildNeighbourhood(scene, shadowGen) {
  const houses = [];
  const brickTex = ["#b23c32", "#b4a08c", "#6f7f96", "#c08a4a", "#8a9b6a"].map((h) => makeBrickTexture(scene, h));
  const roofTex = ["#8a3b32", "#3a4a5a", "#6a5030", "#455a44"].map((h) => makeRoofTexture(scene, h));

  const half = CFG.worldSize / 2 - 40;
  const step = 62;
  const candidates = [];
  for (let gx = -half; gx <= half; gx += step) {
    for (let gz = -half; gz <= half; gz += step) {
      if (Math.hypot(gx, gz) < CFG.baseRadius + 45) continue; // keep base clear
      candidates.push([gx, gz]);
    }
  }
  shuffle(candidates);
  const count = Math.min(CFG.houseCount, candidates.length);

  for (let i = 0; i < count; i++) {
    const [gx, gz] = candidates[i];
    const x = gx + (Math.random() - 0.5) * 16;
    const z = gz + (Math.random() - 0.5) * 16;
    const number = i + 2; // base is "1"
    const bi = (Math.random() * brickTex.length) | 0;
    const ri = (Math.random() * roofTex.length) | 0;
    const r = buildHouse(scene, shadowGen, x, z, brickTex[bi], roofTex[ri], number);
    houses.push({ x, z, r, number });
    scatterFoliage(scene, shadowGen, x, z, r);
  }
  // a few extra standalone trees for a fuller field
  for (let i = 0; i < 26; i++) {
    const x = (Math.random() - 0.5) * (CFG.worldSize - 60);
    const z = (Math.random() - 0.5) * (CFG.worldSize - 60);
    if (Math.hypot(x, z) < CFG.baseRadius + 30) continue;
    if (houses.some((h) => Math.hypot(x - h.x, z - h.z) < h.r + 8)) continue;
    buildTree(scene, shadowGen, x, z);
  }
  return houses;
}

/** One big detailed house. Returns its footprint radius. */
function buildHouse(scene, shadowGen, x, z, brickMat, roofMat, number) {
  const root = new B.TransformNode("house" + number, scene);
  root.position.set(x, 0, z);
  root.rotation.y = (Math.random() * 4 | 0) * (Math.PI / 2); // face a cardinal street

  const w = 20 + Math.random() * 8;
  const d = 16 + Math.random() * 6;
  const h = 11 + Math.random() * 4;

  const cast = (m) => { shadowGen.addShadowCaster(m); m.receiveShadows = true; m.parent = root; return m; };

  const body = B.MeshBuilder.CreateBox("hwall", { width: w, height: h, depth: d }, scene);
  body.position.set(0, h / 2, 0);
  body.material = brickMat;
  cast(body);

  // hipped roof (4-sided pyramid) with a slight overhang
  const roof = B.MeshBuilder.CreateCylinder("hroof", { diameterTop: 0, diameterBottom: Math.hypot(w, d) * 1.02, height: h * 0.75, tessellation: 4 }, scene);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, h + h * 0.375, 0);
  roof.scaling.z = d / w;
  roof.material = roofMat;
  cast(roof);

  // front door
  const door = B.MeshBuilder.CreateBox("hdoor", { width: 3, height: 5.4, depth: 0.4 }, scene);
  door.position.set(-w * 0.22, 2.7, d / 2 + 0.05);
  door.material = makeTexMat(scene, makeWoodTexture(scene));
  cast(door);

  // windows (framed glass) across the front + sides
  const winAt = (px, py, pz, ry) => {
    const frame = B.MeshBuilder.CreateBox("hwf", { width: 3.4, height: 3.4, depth: 0.3 }, scene);
    frame.position.set(px, py, pz); frame.rotation.y = ry;
    frame.material = flatMat(scene, "#efe9dc", 0.1); cast(frame);
    const glass = B.MeshBuilder.CreatePlane("hg", { width: 2.7, height: 2.7 }, scene);
    glass.position.set(px + Math.sin(ry) * 0.2, py, pz + Math.cos(ry) * 0.2);
    glass.rotation.y = ry; glass.material = glassMat(scene);
    glass.parent = root;
  };
  winAt(w * 0.22, h * 0.58, d / 2 + 0.12, 0);
  winAt(w * 0.22, h * 0.28, d / 2 + 0.12, 0);
  winAt(-w * 0.22, h * 0.62, d / 2 + 0.12, 0);
  winAt(w / 2 + 0.12, h * 0.55, d * 0.2, Math.PI / 2);
  winAt(w / 2 + 0.12, h * 0.55, -d * 0.2, Math.PI / 2);

  // door-number plaque on the wall + a floating billboard number (readable from air)
  addNumberPlaque(scene, root, -w * 0.22, 6.4, d / 2 + 0.25, number);
  addNumberBillboard(scene, x, h + h * 0.75 + 4, z, number);

  // a little garden path + hedge strip out front
  const path = B.MeshBuilder.CreateGround("hpath", { width: 3, height: 12 }, scene);
  path.position.set(-w * 0.22, 0.06, d / 2 + 6);
  path.material = flatMat(scene, "#9a9187", 0.05);
  path.parent = root;

  return Math.hypot(w, d) * 0.5;
}

/* ── foliage ─────────────────────────────────────────────────────────────────*/

function scatterFoliage(scene, shadowGen, hx, hz, r) {
  const n = 2 + (Math.random() * 3 | 0);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const rad = r + 4 + Math.random() * 10;
    buildTree(scene, shadowGen, hx + Math.cos(a) * rad, hz + Math.sin(a) * rad);
  }
  // hedge clump
  const hedge = flatMat(scene, "#4a7c36", 0.08);
  for (let i = 0; i < 5; i++) {
    const s = 1.4 + Math.random() * 1.2;
    const bush = B.MeshBuilder.CreateSphere("bush", { diameter: s * 2, segments: 8 }, scene);
    bush.position.set(hx + (i - 2) * 2.4 + (Math.random() - 0.5), s * 0.7, hz + r + 2 + (Math.random() - 0.5));
    bush.scaling.y = 0.7;
    bush.material = hedge;
    shadowGen.addShadowCaster(bush);
  }
}

function buildTree(scene, shadowGen, x, z) {
  const scale = 1.6 + Math.random() * 1.4;
  const trunkH = 4 + Math.random() * 2.5;
  const trunk = B.MeshBuilder.CreateCylinder("trunk", { diameterTop: 0.7, diameterBottom: 1.1, height: trunkH, tessellation: 8 }, scene);
  trunk.position.set(x, trunkH / 2, z);
  trunk.material = makeTexMat(scene, makeWoodTexture(scene));
  shadowGen.addShadowCaster(trunk);

  const leafHexes = ["#2f7a3a", "#3a8a3f", "#256d33", "#1f5c28", "#3d9140"];
  const leafMat = flatMat(scene, leafHexes[(Math.random() * leafHexes.length) | 0], 0.06);
  const clusters = [
    [0, trunkH * 0.95, 0, 1.0], [0.5, trunkH * 1.15, 0.4, 0.8],
    [-0.5, trunkH * 1.1, -0.3, 0.8], [0.3, trunkH * 1.35, -0.4, 0.7],
    [-0.3, trunkH * 1.3, 0.4, 0.7], [0, trunkH * 1.5, 0, 0.6],
  ];
  for (const [lx, ly, lz, s] of clusters) {
    const leaf = B.MeshBuilder.CreateSphere("leaf", { diameter: s * scale * 2.2, segments: 7 }, scene);
    leaf.position.set(x + lx * scale, ly, z + lz * scale);
    leaf.material = leafMat;
    shadowGen.addShadowCaster(leaf);
  }
}

/* ── door numbers ────────────────────────────────────────────────────────────*/

function addNumberPlaque(scene, parent, x, y, z, n) {
  const plane = B.MeshBuilder.CreatePlane("plaque" + n, { width: 2.2, height: 1.4 }, scene);
  plane.position.set(x, y, z);
  plane.parent = parent;
  plane.material = numberMat(scene, n, "#123", "#ffd9a8", false);
}

function addNumberBillboard(scene, x, y, z, n) {
  const plane = B.MeshBuilder.CreatePlane("bill" + n, { width: 6, height: 6 }, scene);
  plane.position.set(x, y, z);
  plane.billboardMode = B.Mesh.BILLBOARDMODE_ALL;
  plane.material = numberMat(scene, n, "rgba(14,26,40,0.85)", "#f0a868", true);
}

function numberMat(scene, n, bg, fg, billboard) {
  const dt = new B.DynamicTexture("num" + n + (billboard ? "b" : "p"), { width: 128, height: 128 }, scene, true);
  dt.hasAlpha = true;
  const ctx = dt.getContext();
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = bg;
  roundRect(ctx, billboard ? 14 : 8, 30, billboard ? 100 : 112, 68, 14);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = "bold 58px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(n), 64, 66);
  dt.update();
  const m = new B.StandardMaterial("numMat" + n, scene);
  m.diffuseTexture = dt;
  m.emissiveColor = new B.Color3(1, 1, 1);
  m.diffuseColor = new B.Color3(0, 0, 0);
  m.specularColor = new B.Color3(0, 0, 0);
  m.useAlphaFromDiffuseTexture = true;
  m.transparencyMode = B.Material.MATERIAL_ALPHABLEND;
  m.backFaceCulling = false;
  return m;
}

/* ── procedural textures (canvas → DynamicTexture) ───────────────────────────*/

function makeGrassTexture(scene) {
  const S = 256;
  const tex = new B.DynamicTexture("grass", { width: S, height: S }, scene, true);
  const ctx = tex.getContext();
  ctx.fillStyle = "#4a7c36";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(55,100,40,0.5)" : "rgba(96,150,66,0.5)";
    ctx.fillRect(Math.random() * S, Math.random() * S, 1.5, 4 + Math.random() * 5);
  }
  return wrap(tex);
}

function makeBrickTexture(scene, hex) {
  const S = 256;
  const base = B.Color3.FromHexString(hex);
  const tex = new B.DynamicTexture("brick", { width: S, height: S }, scene, true);
  const ctx = tex.getContext();
  ctx.fillStyle = "#b0aba2";
  ctx.fillRect(0, 0, S, S);
  const rows = 12, cols = 6, w = S / cols, h = S / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = -1; c <= cols; c++) {
      const x = c * w + (r % 2 ? w / 2 : 0), y = r * h;
      const v = 0.82 + Math.random() * 0.3;
      ctx.fillStyle = `rgb(${Math.min(255, base.r * 255 * v) | 0},${Math.min(255, base.g * 255 * v) | 0},${Math.min(255, base.b * 255 * v) | 0})`;
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      ctx.fillStyle = "rgba(0,0,0,0.10)";
      ctx.fillRect(x + 2, y + 2, (w - 4) * Math.random(), (h - 4) * Math.random());
    }
  }
  const t = wrap(tex); t.uScale = 3; t.vScale = 2; return matify(scene, t);
}

function makeRoofTexture(scene, hex) {
  const S = 256;
  const base = B.Color3.FromHexString(hex);
  const tex = new B.DynamicTexture("roof", { width: S, height: S }, scene, true);
  const ctx = tex.getContext();
  ctx.fillStyle = hex; ctx.fillRect(0, 0, S, S);
  const rows = 16, cols = 12, w = S / cols, h = S / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const x = c * w + (r % 2 ? w / 2 : 0), y = r * h;
      const v = 0.8 + Math.random() * 0.35;
      ctx.fillStyle = `rgb(${Math.min(255, base.r * 255 * v) | 0},${Math.min(255, base.g * 255 * v) | 0},${Math.min(255, base.b * 255 * v) | 0})`;
      ctx.fillRect(x + 1, y, w - 2, h + 2);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(x + 1, y + h - 2, w - 2, 3);
    }
  }
  const t = wrap(tex); t.uScale = 3; t.vScale = 3; return matify(scene, t, 0.12);
}

function makeWoodTexture(scene) {
  const S = 128;
  const tex = new B.DynamicTexture("wood", { width: S, height: S }, scene, true);
  const ctx = tex.getContext();
  ctx.fillStyle = "#7a5330"; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(60,38,18,${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    const y = Math.random() * S;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(S / 3, y + (Math.random() - 0.5) * 12, 2 * S / 3, y + (Math.random() - 0.5) * 12, S, y);
    ctx.stroke();
  }
  return wrap(tex);
}

function makeMetalTexture(scene, hex) {
  const S = 128;
  const tex = new B.DynamicTexture("metal", { width: S, height: S }, scene, true);
  const ctx = tex.getContext();
  ctx.fillStyle = hex; ctx.fillRect(0, 0, S, S);
  for (let x = 0; x < S; x += 8) {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(x, 0, 2, S);
  }
  const t = wrap(tex); t.uScale = 4; t.vScale = 2; return t;
}

/* ── material + canvas helpers ───────────────────────────────────────────────*/

function flatMat(scene, hex, emis) {
  const m = new B.StandardMaterial("m", scene);
  m.diffuseColor = B.Color3.FromHexString(hex);
  m.emissiveColor = B.Color3.FromHexString(hex).scale(emis || 0);
  m.specularColor = new B.Color3(0, 0, 0);
  return m;
}

function makeTexMat(scene, tex) {
  const m = new B.StandardMaterial("tm", scene);
  m.diffuseTexture = tex;
  m.specularColor = new B.Color3(0, 0, 0);
  return m;
}

function matify(scene, tex, emis) {
  const m = new B.StandardMaterial("tm", scene);
  m.diffuseTexture = tex;
  m.specularColor = new B.Color3(0.04, 0.04, 0.04);
  if (emis) m.emissiveColor = new B.Color3(emis, emis, emis);
  return m;
}

function glassMat(scene) {
  const m = new B.StandardMaterial("glass", scene);
  m.diffuseColor = B.Color3.FromHexString("#8fc6ea");
  m.emissiveColor = B.Color3.FromHexString("#3a5a70").scale(0.3);
  m.specularColor = new B.Color3(0.7, 0.8, 0.9);
  m.specularPower = 64;
  m.alpha = 0.55;
  return m;
}

function wrap(tex) {
  tex.wrapU = B.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = B.Texture.WRAP_ADDRESSMODE;
  tex.update();
  return tex;
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

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
}
