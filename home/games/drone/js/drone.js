/* ============================================================================
   Bearing Courier — the drone
   ----------------------------------------------------------------------------
   A procedural quad-rotor (no external model needed): a root TransformNode that
   carries position + yaw (yaw == bearing), a body group that tilts with motion,
   and four spinning rotors. Also owns the chase camera that trails behind it.

   update(intent) integrates simple flight physics from the control intent:
     intent.turn   -1 | 0 | +1   (A / D)  → yaw
     intent.thrust -1 | 0 | +1   (S / W)  → forward/back
     intent.climb  -1 | 0 | +1   (↓ / ↑)  → altitude
   ========================================================================== */

import { CFG } from "./config.js";
import { yawToBearing } from "./bearing.js";
import { cartonMat } from "./mission.js";

const B = window.BABYLON;

export function createDrone(scene) {
  const root = new B.TransformNode("drone", scene);
  root.position.set(0, CFG.startAlt, 0);

  // body group (tilts with motion; separate from root so yaw stays clean)
  const body = new B.TransformNode("droneBody", scene);
  body.parent = root;

  const mat = (hex, emis = 0.15) => {
    const m = new B.StandardMaterial("dm", scene);
    m.diffuseColor = B.Color3.FromHexString(hex);
    m.emissiveColor = B.Color3.FromHexString(hex).scale(emis);
    m.specularColor = new B.Color3(0.2, 0.2, 0.2);
    return m;
  };

  // central hull
  const hull = B.MeshBuilder.CreateBox("hull", { width: 2.4, height: 0.9, depth: 2.4 }, scene);
  hull.material = mat("#2f3a4a", 0.1);
  hull.parent = body;

  // a nose marker so the facing (bearing) is visible on the model
  const nose = B.MeshBuilder.CreateBox("nose", { width: 0.7, height: 0.5, depth: 1.4 }, scene);
  nose.position.set(0, 0, 1.6);
  nose.material = mat("#f0a868", 0.4);
  nose.parent = body;

  // four arms + rotors at the corners
  const rotors = [];
  const arm = 2.0;
  const corners = [
    [arm, arm], [-arm, arm], [arm, -arm], [-arm, -arm],
  ];
  for (const [x, z] of corners) {
    const armMesh = B.MeshBuilder.CreateBox("arm", { width: 0.3, height: 0.2, depth: 0.3 }, scene);
    armMesh.position.set(x * 0.6, 0, z * 0.6);
    armMesh.scaling.set(Math.abs(x) > 0 ? 2.2 : 1, 1, Math.abs(z) > 0 ? 2.2 : 1);
    armMesh.material = mat("#3d4a5c", 0.08);
    armMesh.parent = body;

    const motor = B.MeshBuilder.CreateCylinder("motor", { diameter: 0.6, height: 0.4, tessellation: 12 }, scene);
    motor.position.set(x, 0.35, z);
    motor.material = mat("#1f2732", 0.05);
    motor.parent = body;

    const rotor = B.MeshBuilder.CreateBox("rotor", { width: 2.4, height: 0.08, depth: 0.28 }, scene);
    rotor.position.set(x, 0.6, z);
    rotor.material = mat("#c9d4e0", 0.2);
    rotor.parent = body;
    rotors.push(rotor);
  }

  // the carton slung under the drone (shown only while carrying a package)
  const carton = B.MeshBuilder.CreateBox("carton", { width: 1.6, height: 1.3, depth: 1.6 }, scene);
  carton.position.set(0, -0.95, 0);
  carton.material = cartonMat(scene);
  carton.parent = body;
  carton.setEnabled(false);

  // a soft "shadow" disc that tracks the drone on the ground — a cheap depth cue
  const shadow = B.MeshBuilder.CreateDisc("droneShadow", { radius: 2.6, tessellation: 24 }, scene);
  shadow.rotation.x = Math.PI / 2;
  const smat = new B.StandardMaterial("shadowMat", scene);
  smat.diffuseColor = new B.Color3(0, 0, 0);
  smat.emissiveColor = new B.Color3(0, 0, 0);
  smat.alpha = 0.22;
  smat.specularColor = new B.Color3(0, 0, 0);
  shadow.material = smat;

  // ── chase camera ──────────────────────────────────────────────────────────
  const cam = new B.UniversalCamera("chase", new B.Vector3(0, CFG.startAlt + CFG.camHeight, -CFG.camDist), scene);
  cam.fov = 0.9;
  cam.minZ = 0.4;
  cam.maxZ = CFG.worldSize * 2;
  scene.activeCamera = cam;

  // physics state
  const vel = new B.Vector3(0, 0, 0); // horizontal velocity (units/frame)

  function update(intent) {
    // yaw = bearing (A/D). Turning right increases the bearing (clockwise).
    root.rotation.y += intent.turn * CFG.yawRate * Math.PI / 180;

    // forward vector from yaw (+Z at yaw 0 → North)
    const fwd = new B.Vector3(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y));

    // thrust → accelerate along forward, then drag + clamp
    vel.addInPlace(fwd.scale(intent.thrust * CFG.accel));
    vel.scaleInPlace(CFG.drag);
    const speed = Math.hypot(vel.x, vel.z);
    if (speed > CFG.maxSpeed) {
      const k = CFG.maxSpeed / speed;
      vel.x *= k; vel.z *= k;
    }

    // integrate horizontal position, keep inside the world
    const half = CFG.worldSize / 2 - 4;
    root.position.x = clamp(root.position.x + vel.x, -half, half);
    root.position.z = clamp(root.position.z + vel.z, -half, half);

    // altitude (arrows)
    root.position.y = clamp(root.position.y + intent.climb * CFG.climbRate, CFG.minAlt, CFG.maxAlt);

    // cosmetic body tilt: pitch into travel, roll into turns
    const localFwdSpeed = vel.x * fwd.x + vel.z * fwd.z;
    body.rotation.x = clamp(localFwdSpeed / CFG.maxSpeed, -1, 1) * CFG.tiltMax;
    body.rotation.z = -intent.turn * CFG.tiltMax * 0.6;

    // spin rotors (fast, thrust-dependent)
    const spin = 0.6 + Math.abs(intent.thrust) * 0.5;
    for (let i = 0; i < rotors.length; i++) rotors[i].rotation.y += spin * (i % 2 ? 1 : -1);

    // shadow follows on the ground
    shadow.position.set(root.position.x, 0.05, root.position.z);
    const alt = root.position.y - CFG.minAlt;
    shadow.scaling.setAll(1 + alt * 0.03);
    smat.alpha = Math.max(0.05, 0.24 - alt * 0.004);

    // chase camera trails behind the current heading, smoothly
    const behind = new B.Vector3(
      root.position.x - fwd.x * CFG.camDist,
      root.position.y + CFG.camHeight,
      root.position.z - fwd.z * CFG.camDist,
    );
    cam.position = B.Vector3.Lerp(cam.position, behind, CFG.camLerp);
    cam.setTarget(root.position.clone());
  }

  return {
    root,
    camera: cam,
    update,
    get position() { return root.position; },
    get bearing() { return yawToBearing(root.rotation.y); },
    get altitudeM() { return Math.round((root.position.y - CFG.minAlt) * CFG.metresPerUnit); },
    setCarrying(on) { carton.setEnabled(!!on); },
    reset() {
      root.position.set(0, CFG.startAlt, 0);
      root.rotation.y = 0;
      body.rotation.set(0, 0, 0);
      vel.set(0, 0, 0);
    },
  };
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
