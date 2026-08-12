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

  // kept deliberately dim: the blocks are pale pastels, and a hot key light
  // blows their top faces out to white (worst in the dark theme)
  const hemi = new BJS.HemisphericLight("hemi", new BJS.Vector3(0.2, 1, 0.1), scene);
  hemi.intensity = 0.62;
  hemi.groundColor = new BJS.Color3(0.85, 0.83, 0.8);

  const sun = new BJS.DirectionalLight("sun", new BJS.Vector3(-0.45, -1, -0.35), scene);
  sun.position = new BJS.Vector3(30, 46, 26);
  sun.intensity = 0.45;
  sun.shadowMinZ = 4;
  sun.shadowMaxZ = 140;

  const shadows = new BJS.ShadowGenerator(2048, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 28;
  shadows.darkness = 0.55;

  // ── the desk the mat lies on (so the camera never sees past the world) ────
  const desk = BJS.MeshBuilder.CreateGround(
    "desk",
    { width: CFG.mat * 3, height: CFG.mat * 3, subdivisions: 1 },
    scene
  );
  desk.position.y = -0.03;
  desk.isPickable = false;
  const deskMat = new BJS.StandardMaterial("deskMat", scene);
  deskMat.specularColor = new BJS.Color3(0, 0, 0);
  deskMat.diffuseColor = new BJS.Color3(0, 0, 0);
  deskMat.disableLighting = true; // painted flat in the page colour, so the far
  desk.material = deskMat; //        edge of the world never shows as a seam

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
    desk,
    deskMat,
    highlight,
    matTexture: null,
    base: CFG.defaultBase,
  };

  paintDesk(ctx);
  paintMat(ctx, CFG.defaultBase);
  return ctx;
}

function paintDesk(ctx) {
  const BJS = B();
  ctx.deskMat.emissiveColor = BJS.Color3.FromHexString(norm(cssVar("--app-bg", "#f0ece3")));
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

/** Swing the camera out until every block on the mat is in shot. */
export function fitView(ctx, blocks) {
  const BJS = B();
  const half = CFG.mat / 2;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, top = 2;
  for (const b of blocks) {
    x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.l);
    z0 = Math.min(z0, b.z); z1 = Math.max(z1, b.z + b.w);
    top = Math.max(top, b.h);
  }
  if (!blocks.length) { x0 = z0 = 0; x1 = z1 = CFG.mat; }

  const span = Math.max(x1 - x0, z1 - z0, 8);
  const radius = Math.max(
    CFG.camera.min,
    Math.min(CFG.camera.max, span / (2 * Math.tan(ctx.camera.fov / 2)) + span * 0.12)
  );

  // Looking at the mat obliquely, whatever the camera aims at lands LOW in the
  // frame — the near half of the ground eats the bottom of the picture. Pulling
  // the aim point back towards the camera lifts the blocks into the middle.
  const a = ctx.camera.alpha;
  const lean = span * 0.3;
  const target = new BJS.Vector3(
    (x0 + x1) / 2 - half + Math.cos(a) * lean,
    top / 2,
    (z0 + z1) / 2 - half + Math.sin(a) * lean
  );

  const fps = 60, frames = 26;
  const ease = new BJS.CubicEase();
  ease.setEasingMode(BJS.EasingFunction.EASINGMODE_EASEINOUT);
  BJS.Animation.CreateAndStartAnimation("fitT", ctx.camera, "target", fps, frames,
    ctx.camera.target.clone(), target, BJS.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
  BJS.Animation.CreateAndStartAnimation("fitR", ctx.camera, "radius", fps, frames,
    ctx.camera.radius, radius, BJS.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
}

/** Re-read the theme tokens after a light/dark switch. */
export function retheme(ctx) {
  const BJS = B();
  ctx.scene.clearColor = BJS.Color4.FromHexString(hexA(cssVar("--app-bg", "#f0ece3")));
  paintDesk(ctx);
  paintMat(ctx, ctx.base);
}

/* ── small colour helpers ─────────────────────────────────────────────────── */

/** Babylon's FromHexString wants 8 digits; pad a #rrggbb. */
function hexA(hex) {
  const h = hex.trim();
  return h.length === 7 ? h + "ff" : h.length === 4 ? expand(h) + "ff" : h;
}
function norm(hex) {
  const h = hex.trim();
  return h.length === 4 ? expand(h) : h.slice(0, 7);
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
