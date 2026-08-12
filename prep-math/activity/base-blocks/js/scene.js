/* ============================================================================
   Base Blocks — engine, camera, light and the paper mat
   ----------------------------------------------------------------------------
   The mat is a sheet of squared paper: one faint line per unit cell and a bolder
   line every `base` cells, so the grouping of the working base is visible before
   a single block is put down. Babylon is the global `BABYLON`.
   ========================================================================== */

import { CFG, cssVar } from "./config.js";

const B = () => window.BABYLON;

export function createEngine(canvas) {
  return new (B().Engine)(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true,
    adaptToDeviceRatio: true,
  });
}

export function createScene(engine, canvas) {
  const BJS = B();
  const scene = new BJS.Scene(engine);
  scene.clearColor = BJS.Color4.FromHexString(hexA(cssVar("--app-bg", "#f0ece3")));

  const camera = new BJS.ArcRotateCamera(
    "cam",
    CFG.camera.alpha,
    CFG.camera.beta,
    CFG.camera.radius,
    new BJS.Vector3(0, 1.5, 0),
    scene
  );
  camera.lowerBetaLimit = 0.12;
  camera.upperBetaLimit = Math.PI / 2 - 0.05; // never dip under the mat
  camera.lowerRadiusLimit = CFG.camera.min;
  camera.upperRadiusLimit = CFG.camera.max;
  camera.wheelDeltaPercentage = 0.012;
  camera.pinchDeltaPercentage = 0.0015;
  camera.panningSensibility = 60;
  camera.panningInertia = 0.6;
  camera.inertia = 0.72;
  camera.attachControl(canvas, true);

  const hemi = new BJS.HemisphericLight("hemi", new BJS.Vector3(0.2, 1, 0.1), scene);
  hemi.intensity = 0.78;
  hemi.groundColor = new BJS.Color3(0.62, 0.6, 0.56);

  const sun = new BJS.DirectionalLight("sun", new BJS.Vector3(-0.45, -1, -0.35), scene);
  sun.position = new BJS.Vector3(30, 46, 26);
  sun.intensity = 1.15;
  sun.shadowMinZ = 4;
  sun.shadowMaxZ = 140;

  const shadows = new BJS.ShadowGenerator(2048, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 28;
  shadows.darkness = 0.55;

  // ── the mat ───────────────────────────────────────────────────────────────
  const mat = BJS.MeshBuilder.CreateGround(
    "mat",
    { width: CFG.mat, height: CFG.mat, subdivisions: 1 },
    scene
  );
  mat.receiveShadows = true;
  mat.isPickable = true;

  const matMat = new BJS.StandardMaterial("matMat", scene);
  matMat.specularColor = new BJS.Color3(0.02, 0.02, 0.02);
  mat.material = matMat;

  const highlight = new BJS.HighlightLayer("hl", scene, {
    blurHorizontalSize: 1.1,
    blurVerticalSize: 1.1,
  });
  highlight.innerGlow = false;
  highlight.outerGlow = true;

  const ctx = {
    scene,
    camera,
    sun,
    hemi,
    shadows,
    mat,
    matMat,
    highlight,
    matTexture: null,
    base: CFG.defaultBase,
  };

  paintMat(ctx, CFG.defaultBase);
  return ctx;
}

/** Redraw the squared paper so its bold lines group in the given base. */
export function paintMat(ctx, base) {
  const BJS = B();
  const px = 1024;
  const cell = px / CFG.mat;
  ctx.base = base;

  ctx.matTexture?.dispose();
  const tex = new BJS.DynamicTexture("matTex", { width: px, height: px }, ctx.scene, true);
  const g = tex.getContext();

  const paper = cssVar("--surface-primary", "#fffdf8");
  const faint = cssVar("--text-tertiary", "#9a948a");
  const ink = cssVar("--ink", "#2a2723");

  g.fillStyle = paper;
  g.fillRect(0, 0, px, px);

  // faint line on every unit
  g.strokeStyle = rgba(faint, 0.28);
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i <= CFG.mat; i++) {
    const p = Math.round(i * cell) + 0.5;
    g.moveTo(p, 0); g.lineTo(p, px);
    g.moveTo(0, p); g.lineTo(px, p);
  }
  g.stroke();

  // bolder line every `base` units — the grouping of the working base
  g.strokeStyle = rgba(ink, 0.2);
  g.lineWidth = 2.5;
  g.beginPath();
  for (let i = 0; i <= CFG.mat; i += base) {
    const p = Math.round(i * cell) + 0.5;
    g.moveTo(p, 0); g.lineTo(p, px);
    g.moveTo(0, p); g.lineTo(px, p);
  }
  g.stroke();

  tex.update(false);
  tex.hasAlpha = false;
  ctx.matTexture = tex;
  ctx.matMat.diffuseTexture = tex;
  ctx.matMat.diffuseColor = new BJS.Color3(1, 1, 1);
}

/** Re-read the theme tokens after a light/dark switch. */
export function retheme(ctx) {
  const BJS = B();
  ctx.scene.clearColor = BJS.Color4.FromHexString(hexA(cssVar("--app-bg", "#f0ece3")));
  paintMat(ctx, ctx.base);
}

/* ── small colour helpers ─────────────────────────────────────────────────── */

/** Babylon's FromHexString wants 8 digits; pad a #rrggbb. */
function hexA(hex) {
  const h = hex.trim();
  return h.length === 7 ? h + "ff" : h.length === 4 ? expand(h) + "ff" : h;
}
function expand(h) {
  return "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
}
function rgba(hex, a) {
  const h = hex.trim().replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
