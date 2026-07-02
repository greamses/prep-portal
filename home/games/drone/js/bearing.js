/* ============================================================================
   Bearing Courier — bearing math
   ----------------------------------------------------------------------------
   Pure helpers. Bearings are clockwise from North, in the range [0, 360).
   World convention: +Z = North, +X = East, so a heading vector (dx, dz) has
   bearing = atan2(dx, dz). A drone's yaw (rotation.y) therefore equals its
   bearing directly.
   ========================================================================== */

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

/** Wrap any angle (deg) into [0, 360). */
export function norm360(deg) {
  return ((deg % 360) + 360) % 360;
}

/** Drone yaw (radians) → compass bearing in [0, 360). */
export function yawToBearing(yawRad) {
  return norm360(yawRad * RAD2DEG);
}

/** Bearing (deg) from point A to point B, using their .x / .z. */
export function bearingFromTo(ax, az, bx, bz) {
  return norm360(Math.atan2(bx - ax, bz - az) * RAD2DEG);
}

/** Signed smallest turn (deg, −180..180) to get from `from` to `to`. */
export function angleDelta(from, to) {
  return ((to - from + 540) % 360) - 180;
}

/** Format a bearing as the conventional three digits, e.g. 7 → "007". */
export function fmt3(deg) {
  return String(Math.round(norm360(deg))).padStart(3, "0");
}

/** Horizontal (map) distance between two points' .x / .z. */
export function planarDist(ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  return Math.hypot(dx, dz);
}

export { DEG2RAD, RAD2DEG };
