/**
 * materials.js — shared, reusable materials for the whole set.
 *
 * Pieces are turned wood (light maple vs. dark walnut). Using
 * MeshPhysicalMaterial with a touch of clearcoat gives the lacquered,
 * hand-polished look you get on a real tournament set. Materials are
 * created once and shared across every mesh to keep draw calls cheap.
 */
import * as THREE from "three";

/* A subtle procedural grain so the flat wood doesn't read as plastic. */
function makeWoodTexture(base, streak) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = streak;
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * size;
    ctx.lineWidth = 0.5 + Math.random() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(
      x + (Math.random() - 0.5) * 28,
      size * 0.33,
      x + (Math.random() - 0.5) * 28,
      size * 0.66,
      x + (Math.random() - 0.5) * 18,
      size
    );
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

let _cache = null;

export function getMaterials() {
  if (_cache) return _cache;

  const whiteWood = new THREE.MeshPhysicalMaterial({
    color: 0xf2e2c4,
    map: makeWoodTexture("#efdfc0", "#c9aa78"),
    roughness: 0.42,
    metalness: 0.0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.35,
    sheen: 0.25,
    sheenColor: new THREE.Color(0xfff6e0),
  });

  const blackWood = new THREE.MeshPhysicalMaterial({
    color: 0x2a2018,
    map: makeWoodTexture("#2b211a", "#0d0906"),
    roughness: 0.4,
    metalness: 0.0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
    sheen: 0.2,
    sheenColor: new THREE.Color(0x6b4a2c),
  });

  /* Felt under each piece base so they "sit" without click. */
  const whiteFelt = new THREE.MeshStandardMaterial({
    color: 0xb9402f,
    roughness: 0.95,
    metalness: 0,
  });
  const blackFelt = new THREE.MeshStandardMaterial({
    color: 0x1f3a5f,
    roughness: 0.95,
    metalness: 0,
  });

  /* Board woods */
  const lightSquare = new THREE.MeshPhysicalMaterial({
    color: 0xd8b384,
    map: makeWoodTexture("#d8b384", "#b08a55"),
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.5,
  });
  const darkSquare = new THREE.MeshPhysicalMaterial({
    color: 0x6b4326,
    map: makeWoodTexture("#6b4326", "#3f2613"),
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.5,
  });
  const frame = new THREE.MeshPhysicalMaterial({
    color: 0x33200f,
    map: makeWoodTexture("#33200f", "#170d05"),
    roughness: 0.45,
    metalness: 0,
    clearcoat: 0.45,
    clearcoatRoughness: 0.4,
  });

  _cache = {
    whiteWood,
    blackWood,
    whiteFelt,
    blackFelt,
    lightSquare,
    darkSquare,
    frame,
  };
  return _cache;
}

/** The wood + felt pair for a given side. */
export function sideMaterials(side) {
  const m = getMaterials();
  return side === "white"
    ? { wood: m.whiteWood, felt: m.whiteFelt }
    : { wood: m.blackWood, felt: m.blackFelt };
}
