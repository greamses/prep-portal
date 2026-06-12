/* =====================================================================
   Small stateless maths helpers shared across the move engine, the
   carton animation and the thumbstick.
   ===================================================================== */
import * as THREE from "three";

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Snap a quaternion to the nearest lattice-aligned orientation so cube
// state never drifts after repeated animated turns.
export function snapQuaternion(q) {
  const m = new THREE.Matrix4().makeRotationFromQuaternion(q);
  const e = m.elements;
  [0, 1, 2, 4, 5, 6, 8, 9, 10].forEach((i) => (e[i] = Math.round(e[i])));
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

export const easeInOut = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
