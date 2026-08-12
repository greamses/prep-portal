/* ============================================================================
   Base Blocks — the block meshes
   ----------------------------------------------------------------------------
   Every block is ONE box, however many unit cubes it contains. The unit grooves
   come from a single tiled texture: each face's UV rectangle is set to the face's
   size in units, so a 10×1×1 rod shows ten squares along its length and a
   10×10×10 cube shows a hundred on each face — at the cost of one draw call.
   ========================================================================== */

import { CFG, PLACE_TOKENS, TAGS, placeOf, cssVar } from "./config.js";

const B = () => window.BABYLON;

let grooveTex = null;
let matCache = new Map();

/* ── the tiled unit-cube face ─────────────────────────────────────────────── */
function grooveTexture(scene) {
  if (grooveTex) return grooveTex;
  const BJS = B();
  const px = 128;
  const tex = new BJS.DynamicTexture("groove", { width: px, height: px }, scene, true);
  const g = tex.getContext();

  // the sunk gap between neighbouring unit cubes
  g.fillStyle = "#8d8880";
  g.fillRect(0, 0, px, px);

  // the raised face of one cube, with a soft bevel so it reads as embossed
  const b = 7;
  const face = g.createLinearGradient(b, b, px - b, px - b);
  face.addColorStop(0, "#ffffff");
  face.addColorStop(0.55, "#f2f2f2");
  face.addColorStop(1, "#d8d5d1");
  g.fillStyle = face;
  g.fillRect(b, b, px - b * 2, px - b * 2);

  // top-left catch light, bottom-right shade
  g.strokeStyle = "rgba(255,255,255,0.95)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(b, px - b); g.lineTo(b, b); g.lineTo(px - b, b);
  g.stroke();
  g.strokeStyle = "rgba(90,86,80,0.45)";
  g.beginPath();
  g.moveTo(px - b, b); g.lineTo(px - b, px - b); g.lineTo(b, px - b);
  g.stroke();

  tex.update(false);
  tex.wrapU = BJS.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = BJS.Texture.WRAP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 8;
  grooveTex = tex;
  return tex;
}

/* ── one material per colour ──────────────────────────────────────────────── */
function materialFor(scene, hex) {
  if (matCache.has(hex)) return matCache.get(hex);
  const BJS = B();
  const m = new BJS.StandardMaterial("blk-" + hex, scene);
  m.diffuseTexture = grooveTexture(scene);
  m.diffuseColor = BJS.Color3.FromHexString(norm(hex));
  m.specularColor = new BJS.Color3(0.09, 0.09, 0.09);
  m.specularPower = 48;
  m.ambientColor = new BJS.Color3(0.1, 0.1, 0.1);
  matCache.set(hex, m);
  return m;
}

/** Forget the cached materials (called when the theme flips). */
export function clearMaterials() {
  matCache.forEach((m) => m.dispose());
  matCache = new Map();
}

/** The colour a block should wear: its highlight tag if it has one, else its place. */
export function colourOf(block, base) {
  if (block.tag != null) return TAGS[block.tag].hex;
  const place = placeOf(block, base) || "custom";
  return cssVar(PLACE_TOKENS[place], "#f4c95d");
}

/* ── mesh ─────────────────────────────────────────────────────────────────── */

export function buildMesh(ctx, block, base) {
  const BJS = B();
  const { l, w, h } = block;
  const V4 = BJS.Vector4;
  const faceUV = [
    new V4(0, 0, l, h), // back
    new V4(0, 0, l, h), // front
    new V4(0, 0, w, h), // right
    new V4(0, 0, w, h), // left
    new V4(0, 0, l, w), // top
    new V4(0, 0, l, w), // bottom
  ];

  const mesh = BJS.MeshBuilder.CreateBox(
    "b" + block.id,
    {
      width: l - CFG.inset,
      depth: w - CFG.inset,
      height: h,
      faceUV,
      wrap: true,
    },
    ctx.scene
  );
  mesh.material = materialFor(ctx.scene, colourOf(block, base));
  mesh.metadata = { blockId: block.id };
  mesh.receiveShadows = true;
  ctx.shadows.addShadowCaster(mesh);
  place(mesh, block);
  return mesh;
}

/** Put a mesh where its block says it lives (cells → world). */
export function place(mesh, block, lift = 0) {
  const half = CFG.mat / 2;
  mesh.position.x = block.x + block.l / 2 - half;
  mesh.position.z = block.z + block.w / 2 - half;
  mesh.position.y = block.h / 2 + lift;
}

/** Slide a mesh to its block's cell over CFG.anim ms. */
export function glideTo(ctx, mesh, block) {
  const BJS = B();
  const half = CFG.mat / 2;
  const target = new BJS.Vector3(
    block.x + block.l / 2 - half,
    block.h / 2,
    block.z + block.w / 2 - half
  );
  if (BJS.Vector3.Distance(mesh.position, target) < 0.001) return;
  const fps = 60;
  const frames = Math.max(2, Math.round((CFG.anim / 1000) * fps));
  BJS.Animation.CreateAndStartAnimation(
    "mv",
    mesh,
    "position",
    fps,
    frames,
    mesh.position.clone(),
    target,
    BJS.Animation.ANIMATIONLOOPMODE_CONSTANT,
    easeOut()
  );
}

function easeOut() {
  const BJS = B();
  const e = new BJS.CubicEase();
  e.setEasingMode(BJS.EasingFunction.EASINGMODE_EASEOUT);
  return e;
}

/** Repaint a mesh for its block's current colour. */
export function repaint(ctx, mesh, block, base) {
  mesh.material = materialFor(ctx.scene, colourOf(block, base));
}
