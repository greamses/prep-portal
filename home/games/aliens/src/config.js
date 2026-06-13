// config.js — shared constants for Alien Angle (single 180° protractor game)
import * as THREE from 'three';

export const DEG = Math.PI / 180;

export const isMobile =
  /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) ||
  window.innerWidth < 768;

export const CONFIG = {
  pivotY: 0.9,                 // turret pivot height

  aimClamp: [4, 176],         // how far the cannon can elevate (0–180 plane)
  spawnAngle: [14, 166],      // alien angular positions
  distMin: 12,                 // nearest alien (well clear of the turret)
  distMax: 18,                 // farthest alien
  sizeMin: 0.55,               // smallest saucer (harder)
  sizeMax: 1.6,                // biggest saucer (easier)
  protractorR: 11,             // protractor arc radius

  projectileSpeed: 26,         // flight speed (world units / sec)
  panRateDeg: 70,              // keyboard fine-tune speed (deg / sec)

  // angular hit tolerance = base + the alien's apparent angular radius
  baseTolDeg: { easy: 6, medium: 3.5, hard: 2 },

  camera: { pos: [0, 8.5, 36], look: [0, 6.5, 0], fov: 40 },

  render: {
    pixelRatio: Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2),
    antialias: !isMobile,
    shadows: !isMobile,
  },
};

export const COLORS = {
  spaceBg: 0x05060f,
  accentPrimary: 0xf0cf6e,
  accentSuccess: 0x8ace8a,
  accentDanger: 0xf08a8a,
};

// aim direction in the vertical X–Y plane (0°=+X, 90°=up, 180°=−X)
export function makeAimDir(angleDeg, out = new THREE.Vector3()) {
  const a = angleDeg * DEG;
  return out.set(Math.cos(a), Math.sin(a), 0);
}
