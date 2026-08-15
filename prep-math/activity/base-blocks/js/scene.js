/* ============================================================================
   Manipulatives — engine, cameras and the endless sheet of paper
   ----------------------------------------------------------------------------
   The paper is one big plane wearing a texture of `base × base` cells that
   REPEATS, so the squared grid regroups when the base changes and still costs a
   single 512px tile no matter how far the canvas runs. Cell (0,0) is the world
   origin; the tile is offset so its bold lines land exactly on cell boundaries.

   One camera does both views. 3D is the usual perspective orbit; 2D drops it to
   an orthographic straight-down look with the rotation pinned, which is the
   right way to read every one of these manipulatives — blocks, abacus and grids
   all lie flat on the desk.
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
  camera.lowerBetaLimit = 0.06;
  camera.upperBetaLimit = Math.PI / 2 - 0.05; // never dip under the paper
  camera.lowerRadiusLimit = CFG.camera.min;
  camera.upperRadiusLimit = CFG.camera.max;
  camera.wheelDeltaPercentage = 0.012;
  camera.pinchDeltaPercentage = 0.0015;
  camera.panningSensibility = 60;
  camera.panningInertia = 0.6;
  camera.inertia = 0.72;
  camera.attachControl(canvas, true);

  /* Babylon spins an ArcRotate camera on the arrow keys. We want the arrows to
     SLIDE the paper instead (see panBy), and two handlers fighting over one key
     is worse than either, so its keyboard input is taken off here. */
  camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");

  // kept deliberately dim: the pieces are pale pastels, and a hot key light
  // blows their top faces out to white (worst in the dark theme)
  const hemi = new BJS.HemisphericLight("hemi", new BJS.Vector3(0.2, 1, 0.1), scene);
  hemi.intensity = 0.62;
  hemi.groundColor = new BJS.Color3(0.85, 0.83, 0.8);

  const sun = new BJS.DirectionalLight("sun", new BJS.Vector3(-0.45, -1, -0.35), scene);
  sun.position = new BJS.Vector3(30, 46, 26);
  sun.intensity = 0.45;
  sun.shadowMinZ = 4;
  sun.shadowMaxZ = 200;

  const shadows = new BJS.ShadowGenerator(2048, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 28;
  shadows.darkness = 0.55;

  // ── the paper ─────────────────────────────────────────────────────────────
  const mat = BJS.MeshBuilder.CreateGround(
    "paper",
    { width: CFG.ground, height: CFG.ground, subdivisions: 1 },
    scene
  );
  mat.receiveShadows = true;
  mat.isPickable = true;

  const matMat = new BJS.StandardMaterial("paperMat", scene);
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
    engine,
    camera,
    sun,
    hemi,
    shadows,
    mat,
    matMat,
    highlight,
    matTexture: null,
    base: CFG.defaultBase,
    flat: false, // true while the 2D view is on
  };

  // Orthographic zoom has no radius, so the wheel is mapped onto the ortho box
  // every frame while the flat view is on.
  scene.onBeforeRenderObservable.add(() => {
    if (camera.mode !== BJS.Camera.ORTHOGRAPHIC_CAMERA) return;
    const h = camera.radius * 0.5;
    const a = engine.getAspectRatio(camera);
    camera.orthoTop = h;
    camera.orthoBottom = -h;
    camera.orthoLeft = -h * a;
    camera.orthoRight = h * a;
  });

  paintMat(ctx, CFG.defaultBase);
  return ctx;
}

/* ── the squared paper ────────────────────────────────────────────────────── */

/**
 * One tile = `base × base` cells: a faint line on every cell and a bold one on
 * the tile's own edges, which is where the base's grouping shows.
 */
export function paintMat(ctx, base) {
  const BJS = B();
  const px = 512;
  const cell = px / base;
  ctx.base = base;

  ctx.matTexture?.dispose();
  const tex = new BJS.DynamicTexture("paperTex", { width: px, height: px }, ctx.scene, true);
  const g = tex.getContext();

  const paper = cssVar("--surface-primary", "#fffdf8");
  const faint = cssVar("--text-tertiary", "#9a948a");
  const ink = cssVar("--ink", "#2a2723");

  g.fillStyle = paper;
  g.fillRect(0, 0, px, px);

  g.strokeStyle = rgba(faint, 0.3);
  g.lineWidth = 1.5;
  g.beginPath();
  for (let i = 1; i < base; i++) {
    const p = Math.round(i * cell) + 0.5;
    g.moveTo(p, 0); g.lineTo(p, px);
    g.moveTo(0, p); g.lineTo(px, p);
  }
  g.stroke();

  // the tile edge, drawn half in from each side so the two halves of the
  // repeat meet as one line rather than a double-weight one
  g.strokeStyle = rgba(ink, 0.22);
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(1.5, 0); g.lineTo(1.5, px);
  g.moveTo(px - 1.5, 0); g.lineTo(px - 1.5, px);
  g.moveTo(0, 1.5); g.lineTo(px, 1.5);
  g.moveTo(0, px - 1.5); g.lineTo(px, px - 1.5);
  g.stroke();

  tex.update(false);
  tex.hasAlpha = false;
  tex.wrapU = BJS.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = BJS.Texture.WRAP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 8;

  /* The ground's UV runs 0..1 across its whole width, so one repeat per `base`
     cells means this scale — and the offset slides the tile so a bold line sits
     on cell 0 rather than on the far corner of the plane. */
  tex.uScale = CFG.ground / base;
  tex.vScale = CFG.ground / base;
  tex.uOffset = -CFG.ground / (2 * base);
  tex.vOffset = -CFG.ground / (2 * base);

  ctx.matTexture = tex;
  ctx.matMat.diffuseTexture = tex;
  ctx.matMat.diffuseColor = new BJS.Color3(1, 1, 1);
}

/* ── 2D ⇄ 3D ──────────────────────────────────────────────────────────────── */

export function setFlatView(ctx, on) {
  const BJS = B();
  const cam = ctx.camera;
  if (ctx.flat === on) return;
  ctx.flat = on;

  const fps = 60, frames = 22;
  const ease = new BJS.CubicEase();
  ease.setEasingMode(BJS.EasingFunction.EASINGMODE_EASEINOUT);

  if (on) {
    cam.lowerBetaLimit = null;
    cam.upperBetaLimit = null;
    BJS.Animation.CreateAndStartAnimation("flatB", cam, "beta", fps, frames,
      cam.beta, 0.0001, BJS.Animation.ANIMATIONLOOPMODE_CONSTANT, ease,
      () => {
        cam.mode = BJS.Camera.ORTHOGRAPHIC_CAMERA;
        // pin the orbit: straight down, north up, pan and zoom only
        cam.lowerBetaLimit = cam.upperBetaLimit = 0.0001;
        cam.lowerAlphaLimit = cam.upperAlphaLimit = cam.alpha;
      });
    BJS.Animation.CreateAndStartAnimation("flatA", cam, "alpha", fps, frames,
      cam.alpha, -Math.PI / 2, BJS.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
  } else {
    cam.mode = BJS.Camera.PERSPECTIVE_CAMERA;
    cam.lowerAlphaLimit = cam.upperAlphaLimit = null;
    cam.lowerBetaLimit = null;
    cam.upperBetaLimit = null;
    BJS.Animation.CreateAndStartAnimation("solidB", cam, "beta", fps, frames,
      cam.beta, CFG.camera.beta, BJS.Animation.ANIMATIONLOOPMODE_CONSTANT, ease,
      () => {
        cam.lowerBetaLimit = 0.06;
        cam.upperBetaLimit = Math.PI / 2 - 0.05;
      });
  }
}

/* ── framing ──────────────────────────────────────────────────────────────── */

/** Swing the camera out until every given item is in shot. */
export function fitView(ctx, items) {
  const BJS = B();
  let x0 = 0, x1 = 8, z0 = 0, z1 = 8, top = 2;
  if (items.length) {
    x0 = Infinity; x1 = -Infinity; z0 = Infinity; z1 = -Infinity;
    for (const b of items) {
      x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.l);
      z0 = Math.min(z0, b.z); z1 = Math.max(z1, b.z + b.w);
      top = Math.max(top, b.h);
    }
  }

  const span = Math.max(x1 - x0, z1 - z0, 8);
  const radius = Math.max(
    CFG.camera.min,
    Math.min(CFG.camera.max, span / (2 * Math.tan(ctx.camera.fov / 2)) + span * 0.12)
  );

  /* Looking at the paper obliquely, whatever the camera aims at lands LOW in
     the frame — the near half of the ground eats the bottom of the picture.
     Pulling the aim point back towards the camera lifts the pieces into the
     middle. Straight down (the flat view) has no such skew. */
  const lean = ctx.flat ? 0 : span * 0.3;
  const a = ctx.camera.alpha;
  const target = new BJS.Vector3(
    (x0 + x1) / 2 + Math.cos(a) * lean,
    top / 2,
    (z0 + z1) / 2 + Math.sin(a) * lean
  );

  const fps = 60, frames = 26;
  const ease = new BJS.CubicEase();
  ease.setEasingMode(BJS.EasingFunction.EASINGMODE_EASEINOUT);
  BJS.Animation.CreateAndStartAnimation("fitT", ctx.camera, "target", fps, frames,
    ctx.camera.target.clone(), target, BJS.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
  BJS.Animation.CreateAndStartAnimation("fitR", ctx.camera, "radius", fps, frames,
    ctx.camera.radius, radius, BJS.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
}

/* ── driving the camera from a button ─────────────────────────────────────── */

const EASE_OUT = () => {
  const BJS = B();
  const e = new BJS.CubicEase();
  e.setEasingMode(BJS.EasingFunction.EASINGMODE_EASEOUT);
  return e;
};

/**
 * Zoom by a factor (>1 pulls back, <1 moves in). Both views ride on `radius`:
 * the perspective camera uses it directly and the flat view's ortho box is
 * derived from it every frame, so one number drives the zoom in 2D and 3D alike.
 */
export function zoomBy(ctx, factor) {
  const BJS = B();
  const cam = ctx.camera;
  const to = Math.max(CFG.camera.min, Math.min(CFG.camera.max, cam.radius * factor));
  if (Math.abs(to - cam.radius) < 1e-4) return false; // already against a stop
  BJS.Animation.CreateAndStartAnimation("zoom", cam, "radius", 60, 12,
    cam.radius, to, BJS.Animation.ANIMATIONLOOPMODE_CONSTANT, EASE_OUT());
  return true;
}

/**
 * Slide the view across the paper. `dx`/`dz` are screen-relative: +1 is right
 * and "down the screen", whichever way the camera happens to be facing.
 *
 * The two directions come from `alpha` rather than from the camera's own axes:
 * flattening the camera's forward vector onto the paper is degenerate in the 2D
 * view, where it points straight down and flattens to nothing. Off alpha they
 * are exact in both views.
 *
 * `(cos a, 0, sin a)` is the way to the camera along the paper — the same vector
 * fitView leans on. Down-the-screen is therefore TOWARDS the viewer, and
 * screen-right is `up × forward`, in that order, because Babylon's world is
 * left-handed; taking the cross product the other way round mirrors both keys.
 */
export function panBy(ctx, dx, dz) {
  const BJS = B();
  const cam = ctx.camera;
  const step = cam.radius * 0.22; // a press moves the same share of the screen
  const a = cam.alpha;
  const right = new BJS.Vector3(-Math.sin(a), 0, Math.cos(a));
  const fwd = new BJS.Vector3(Math.cos(a), 0, Math.sin(a));

  const to = cam.target.clone()
    .add(right.scale(dx * step))
    .add(fwd.scale(dz * step));

  BJS.Animation.CreateAndStartAnimation("pan", cam, "target", 60, 12,
    cam.target.clone(), to, BJS.Animation.ANIMATIONLOOPMODE_CONSTANT, EASE_OUT());
}

/**
 * The hand tool: drag anywhere to slide the paper. Babylon pans an ArcRotate
 * camera on the RIGHT mouse button, which a touch screen does not have and a
 * child will not find, so the tool moves panning onto the left button while it
 * is on. The pointer layer stops picking things up for as long as it lasts.
 */
export function setPanTool(ctx, on) {
  const pointers = ctx.camera.inputs?.attached?.pointers;
  if (!pointers) return false;
  pointers.panningMouseButton = on ? 0 : 2;
  return true;
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
