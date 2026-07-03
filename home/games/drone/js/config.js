/* ============================================================================
   Bearing Courier — configuration
   ----------------------------------------------------------------------------
   One small place to tune the world, the drone's flight feel and the mission.
   Bearings are measured CLOCKWISE FROM NORTH (000°–360°); the world uses
   +Z = North and +X = East, so a drone's yaw (in degrees) equals its bearing.
   ========================================================================== */

export const CFG = {
  // ── world ────────────────────────────────────────────────────────────────
  worldSize: 400, // ground is worldSize × worldSize (Babylon units)
  metresPerUnit: 5, // 1 unit = 5 m, so distances read like a real map

  // ── drone flight (per-frame, tuned around 60fps) ──────────────────────────
  yawRate: 1.7, // deg per frame while holding A/D  (turn speed)
  accel: 0.018, // forward/back thrust
  maxSpeed: 0.85, // top horizontal speed (units/frame)
  drag: 0.94, // velocity retained each frame (air resistance)
  climbRate: 0.35, // altitude change per frame on ↑/↓
  minAlt: 3, // hard floor (drone can't sink into the ground)
  maxAlt: 60, // ceiling
  startAlt: 14,
  tiltMax: 0.35, // how far the body pitches/rolls with motion (radians)

  // ── camera (chase) ────────────────────────────────────────────────────────
  camDist: 18, // distance behind the drone
  camHeight: 8, // camera height above the drone
  camLerp: 0.08, // how snappily the camera follows (0..1)

  // ── mission ─────────────────────────────────────────────────────────────
  target: 6, // packages to deliver to win
  timeLimitMs: 60000, // one minute
  baseRadius: 10, // depot pad radius (fly over it to pick up / land)
  houseCount: 12, // number of big detailed houses in the suburb
  padMinDist: 40, // nearest a new pad can spawn (units)
  padMaxDist: 160, // farthest a new pad can spawn (units)
  padRadius: 6, // horizontal distance for a successful drop
  bearingSnap: 5, // within ±this many degrees the compass locks green
  landAlt: 22, // must be below this altitude to drop / pick up (descend to it)

  // ── look ──────────────────────────────────────────────────────────────────
  sky: "#bfe4ff",
  fog: "#d6ecff",
  fogD: 0.0016,
  ground: "#5c6b7a",
  grid: "#7f93a6",
  depot: "#f0a868",
  pad: "#7cc47c",
};
