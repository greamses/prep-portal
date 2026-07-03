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
  const shadowGen = scene.metadata && scene.metadata.shadowGen;

  const mat = (hex, emis = 0.12, spec = 0.25) => {
    const m = new B.StandardMaterial("dm", scene);
    m.diffuseColor = B.Color3.FromHexString(hex);
    m.emissiveColor = B.Color3.FromHexString(hex).scale(emis);
    m.specularColor = new B.Color3(spec, spec, spec);
    m.specularPower = 48;
    return m;
  };
  const carbon = mat("#232a33", 0.06, 0.35);
  const trim = mat("#39434f", 0.05, 0.2);
  const cast = (m) => { if (shadowGen) shadowGen.addShadowCaster(m); m.parent = body; return m; };

  // central hull: a tapered carbon body (two stacked boxes) + top canopy
  const belly = B.MeshBuilder.CreateBox("belly", { width: 2.4, height: 0.6, depth: 3.2 }, scene);
  belly.material = carbon; cast(belly);
  const deck = B.MeshBuilder.CreateBox("deck", { width: 1.8, height: 0.5, depth: 2.4 }, scene);
  deck.position.y = 0.5; deck.material = trim; cast(deck);
  const canopy = B.MeshBuilder.CreateSphere("canopy", { diameter: 1.4, segments: 10 }, scene);
  canopy.scaling.set(1, 0.6, 1.4); canopy.position.set(0, 0.75, 0.3);
  const canopyMat = mat("#11161d", 0.04, 0.7); canopyMat.alpha = 0.92;
  canopy.material = canopyMat; cast(canopy);

  // gimbal camera ball at the nose (marks facing / bearing)
  const gimbal = B.MeshBuilder.CreateSphere("gimbal", { diameter: 0.85, segments: 12 }, scene);
  gimbal.position.set(0, -0.15, 1.5); gimbal.material = mat("#0d1116", 0.03, 0.8); cast(gimbal);
  const lens = B.MeshBuilder.CreateCylinder("lens", { diameter: 0.4, height: 0.2, tessellation: 16 }, scene);
  lens.rotation.x = Math.PI / 2; lens.position.set(0, -0.15, 1.95);
  lens.material = mat("#2a6ff0", 0.5, 0.9); cast(lens);

  // four arms (angled booms) with motors + twin-blade props
  const rotors = [];
  const arm = 2.0;
  const corners = [[arm, arm, 1], [-arm, arm, -1], [arm, -arm, -1], [-arm, -arm, 1]];
  for (const [x, z] of corners) {
    const boom = B.MeshBuilder.CreateBox("boom", { width: 0.28, height: 0.22, depth: 0.28 }, scene);
    boom.position.set(x * 0.5, 0.05, z * 0.5);
    const len = Math.hypot(x, z);
    boom.scaling.set(1, 1, len / 0.28);
    boom.rotation.y = Math.atan2(x, z);
    boom.material = carbon; cast(boom);

    const motor = B.MeshBuilder.CreateCylinder("motor", { diameter: 0.72, height: 0.5, tessellation: 16 }, scene);
    motor.position.set(x, 0.32, z); motor.material = mat("#c24a3a", 0.1, 0.4); cast(motor);
    const bell = B.MeshBuilder.CreateCylinder("bell", { diameter: 0.5, height: 0.15, tessellation: 16 }, scene);
    bell.position.set(x, 0.6, z); bell.material = mat("#e2e6ea", 0.15, 0.6); cast(bell);

    // prop hub with two thin swept blades
    const hub = new B.TransformNode("prop", scene);
    hub.position.set(x, 0.7, z); hub.parent = body;
    const bladeMat = mat("#1a1f26", 0.04, 0.3); bladeMat.alpha = 0.9;
    for (const s of [1, -1]) {
      const blade = B.MeshBuilder.CreateBox("blade", { width: 2.6, height: 0.05, depth: 0.34 }, scene);
      blade.position.set(s * 1.2, 0, 0);
      blade.rotation.z = s * 0.12;
      blade.material = bladeMat; blade.parent = hub;
    }
    rotors.push(hub);
  }

  // landing skids (two rails on struts)
  for (const s of [-1, 1]) {
    const rail = B.MeshBuilder.CreateBox("skid", { width: 0.18, height: 0.18, depth: 3.4 }, scene);
    rail.position.set(s * 1.1, -0.85, 0); rail.material = trim; cast(rail);
    for (const dz of [-1.1, 1.1]) {
      const strut = B.MeshBuilder.CreateBox("strut", { width: 0.14, height: 0.7, depth: 0.14 }, scene);
      strut.position.set(s * 1.0, -0.5, dz); strut.material = trim; cast(strut);
    }
  }

  // LED nav lights: green on the right, red on the left, white tail
  const led = (hex, x, z) => {
    const l = B.MeshBuilder.CreateSphere("led", { diameter: 0.32, segments: 8 }, scene);
    l.position.set(x, -0.05, z); l.material = mat(hex, 1.4, 0); cast(l);
  };
  led("#22dd55", 1.9, 1.9); led("#ff3344", -1.9, 1.9);
  led("#ffffff", 1.9, -1.9); led("#ffffff", -1.9, -1.9);

  // the carton slung under the drone (shown only while carrying a package)
  const carton = B.MeshBuilder.CreateBox("carton", { width: 1.7, height: 1.4, depth: 1.7 }, scene);
  carton.position.set(0, -1.05, 0);
  carton.material = cartonMat(scene);
  carton.parent = body;
  if (shadowGen) shadowGen.addShadowCaster(carton);
  carton.setEnabled(false);

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

    // spin props (fast, thrust-dependent; alternating direction per motor)
    const spin = 0.9 + Math.abs(intent.thrust) * 0.6;
    for (let i = 0; i < rotors.length; i++) rotors[i].rotation.y += spin * (i % 2 ? 1 : -1);

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
