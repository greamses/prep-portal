/* ============================================================================
   Base Blocks — the block meshes
   ----------------------------------------------------------------------------
   Every block is ONE box, however many unit cubes it contains. The unit grooves
   come from a single tiled texture: each face's UV rectangle is set to the face's
   size in units, so a 10×1×1 rod shows ten squares along its length and a
   10×10×10 cube shows a hundred on each face — at the cost of one draw call.
   ========================================================================== */

import { CFG, CUSTOM_TOKEN, TAGS, placeOf, powerOf, placeColour, cssVar } from "./config.js";
import { footprint, standing } from "./layout.js";

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

/** Babylon wants a plain #rrggbb; tokens may arrive short or with alpha. */
function norm(hex) {
  const h = String(hex || "").trim();
  if (/^#[0-9a-f]{3}$/i.test(h)) return "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  if (/^#[0-9a-f]{6}$/i.test(h)) return h;
  if (/^#[0-9a-f]{8}$/i.test(h)) return h.slice(0, 7);
  return "#f4c95d";
}

/** Forget the cached materials (called when the theme flips). */
export function clearMaterials() {
  matCache.forEach((m) => m.dispose());
  matCache = new Map();
}

/**
 * The colour a block should wear: its highlight tag if it has one, else the
 * colour of its place WITHIN ITS PERIOD. A thousand-cube is butter like a unit
 * cube, because both are the unit of their period; what tells them apart is
 * that one of them is a thousand times the size.
 */
export function colourOf(block, base) {
  if (block.tag != null) return TAGS[block.tag].hex;
  const power = powerOf(placeOf(block, base));
  if (power == null) return cssVar(CUSTOM_TOKEN[0], CUSTOM_TOKEN[1]);
  return placeColour(power);
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
  mesh.metadata = { itemId: block.id };
  mesh.receiveShadows = true;
  ctx.shadows.addShadowCaster(mesh);
  place(mesh, block);
  return mesh;
}

/** Put a mesh where its block says it lives (cells → world, one to one). */
export function place(mesh, block, lift = 0) {
  // centred on the paper it covers, which is bigger than the block itself once
  // the block is turned off the square
  const f = footprint(block);
  mesh.position.x = block.x + f.l / 2;
  mesh.position.z = block.z + f.w / 2;
  mesh.position.y = restY(block) + lift;
  /* Tipped first, then turned. Babylon's rotation is yaw-pitch-roll, so setting
     both leaves the pitch in the block's OWN frame and the yaw about the world's
     upright — which is the order a hand does it in: tip the piece over, then
     turn it round on the paper. */
  mesh.rotation.x = block.tip || 0;
  mesh.rotation.y = block.angle || 0;
}

/**
 * Where the middle of a piece sits above the paper: half of however tall it is
 * LYING LIKE THIS, plus however far it has been lifted. A piece tipped onto its
 * edge is a different height from the same piece lying flat, and it still has
 * to rest on the paper rather than sink into it.
 */
export function restY(block) {
  return standing(block).h / 2 + (block.y || 0);
}

/** Slide a mesh to its block's cell over CFG.anim ms. */
export function glideTo(ctx, mesh, block) {
  const BJS = B();
  const f = footprint(block);
  mesh.rotation.x = block.tip || 0;
  mesh.rotation.y = block.angle || 0;
  const target = new BJS.Vector3(
    block.x + f.l / 2,
    restY(block),
    block.z + f.w / 2
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
