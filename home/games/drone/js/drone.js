/* ============================================================================
   Bearing Courier — the aircraft
   ----------------------------------------------------------------------------
   A GLB aircraft (HVN4B Global Hawk drone, CC-BY, via Sketchfab) loaded onto a
   root TransformNode that carries position + yaw (yaw == bearing), and a body
   group that banks and pitches with motion. Also owns the chase camera that
   trails behind it.

   update(intent) integrates simple flight physics from the control intent:
     intent.turn   -1 | 0 | +1   (A / D)  → yaw (banked turns)
     intent.thrust -1 | 0 | +1   (S / W)  → forward/back
     intent.climb  -1 | 0 | +1   (↓ / ↑)  → altitude
   ========================================================================== */

import { CFG } from "./config.js";
import { yawToBearing } from "./bearing.js";
import { cartonMat } from "./mission.js";

const B = window.BABYLON;

const MODEL_DIR = "/home/games/drone/assets/aircraft/";
const MODEL_FILE = "global-hawk.glb";

export async function createDrone(scene) {
  const root = new B.TransformNode("airplane", scene);

  // body group (banks and pitches with motion; separate from root so yaw stays clean)
  const body = new B.TransformNode("airplaneBody", scene);
  body.parent = root;
  const shadowGen = scene.metadata && scene.metadata.shadowGen;

  // Load + auto-fit the model before placing the root at altitude, so the
  // hierarchy's world-space bounding box (used to centre it) isn't thrown
  // off by root already sitting CFG.startAlt units up.
  const { bottomY, lengthZ } = await loadAircraft(scene, body, shadowGen);
  root.position.set(0, CFG.startAlt, 0);

  // Carton (shown only while carrying a package) — hung under the fuselage.
  const carton = B.MeshBuilder.CreateBox("carton", { width: 1.0, height: 0.9, depth: 1.0 }, scene);
  carton.position.set(0, bottomY - 0.3, -lengthZ * 0.15);
  carton.material = cartonMat(scene);
  carton.parent = body;
  if (shadowGen) shadowGen.addShadowCaster(carton);
  carton.setEnabled(false);

  // ── Chase Camera ────────────────────────────────────────────────────────
  const cam = new B.UniversalCamera(
    "chase",
    new B.Vector3(0, CFG.startAlt + CFG.camHeight, -CFG.camDist),
    scene,
  );
  cam.fov = 0.9;
  cam.minZ = 0.4;
  cam.maxZ = CFG.worldSize * 2;
  scene.activeCamera = cam;

  // Physics state
  const vel = new B.Vector3(0, 0, 0);

  function update(intent) {
    // Yaw integration
    root.rotation.y += (intent.turn * CFG.yawRate * Math.PI) / 180;

    const fwd = new B.Vector3(
      Math.sin(root.rotation.y),
      0,
      Math.cos(root.rotation.y),
    );

    // Thrust calculation
    vel.addInPlace(fwd.scale(intent.thrust * CFG.accel));
    vel.scaleInPlace(CFG.drag);
    const speed = Math.hypot(vel.x, vel.z);
    if (speed > CFG.maxSpeed) {
      const k = CFG.maxSpeed / speed;
      vel.x *= k;
      vel.z *= k;
    }

    // Horizontal bounds clamp
    const half = CFG.worldSize / 2 - 4;
    root.position.x = clamp(root.position.x + vel.x, -half, half);
    root.position.z = clamp(root.position.z + vel.z, -half, half);

    // Altitude clamp
    root.position.y = clamp(
      root.position.y + intent.climb * CFG.climbRate,
      CFG.minAlt,
      CFG.maxAlt,
    );

    // Banking and pitching
    const targetBank = -intent.turn * CFG.tiltMax * 1.5;
    body.rotation.z += (targetBank - body.rotation.z) * 0.15;

    const targetPitch = intent.climb * CFG.tiltMax * 0.7;
    body.rotation.x += (targetPitch - body.rotation.x) * 0.15;

    const localFwdSpeed = vel.x * fwd.x + vel.z * fwd.z;
    const speedPitch =
      clamp(localFwdSpeed / CFG.maxSpeed, -0.5, 0.5) * CFG.tiltMax * 0.3;
    body.rotation.x += speedPitch * 0.1;

    // Smooth chase camera trailing
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
    get position() {
      return root.position;
    },
    get bearing() {
      return yawToBearing(root.rotation.y);
    },
    get altitudeM() {
      return Math.round((root.position.y - CFG.minAlt) * CFG.metresPerUnit);
    },
    setCarrying(on) {
      carton.setEnabled(!!on);
    },
    reset() {
      root.position.set(0, CFG.startAlt, 0);
      root.rotation.y = 0;
      body.rotation.set(0, 0, 0);
      vel.set(0, 0, 0);
    },
  };
}

/** Loads the aircraft GLB, auto-fits + centres it under `body`, and starts its
    built-in animation (control surfaces / gear) looping for a bit of life.
    Returns the model's ground clearance (bottomY) and length (lengthZ), both
    in body-local units, so callers can hang props (e.g. the cargo carton)
    off it without hardcoding the model's real-world scale. */
async function loadAircraft(scene, body, shadowGen) {
  const res = await B.SceneLoader.ImportMeshAsync("", MODEL_DIR, MODEL_FILE, scene);

  const modelRoot = new B.TransformNode("aircraftModel", scene);
  modelRoot.parent = body;
  res.meshes.forEach((m) => {
    if (!m.parent) m.parent = modelRoot;
  });

  // This GLB's nose already faces +Z, which matches the game's forward — no
  // yaw correction needed (confirmed by checking the rudder/tail nodes sit
  // on the -Z side of the model).

  res.meshes.forEach((m) => m.computeWorldMatrix(true));
  let bb = modelRoot.getHierarchyBoundingVectors(true);
  const size = bb.max.subtract(bb.min);
  const largest = Math.max(size.x, size.y, size.z) || 1;
  const scale = CFG.aircraftSize / largest;
  modelRoot.scaling.setAll(scale);

  res.meshes.forEach((m) => m.computeWorldMatrix(true));
  bb = modelRoot.getHierarchyBoundingVectors(true);
  const center = bb.max.add(bb.min).scale(0.5);
  // Centre the model on body's origin in X/Z; keep its own vertical centre
  // (rather than snapping the belly to y=0) so it sits mid-frame like the
  // old procedural plane did.
  modelRoot.position.x -= center.x;
  modelRoot.position.z -= center.z;
  modelRoot.position.y -= center.y;

  res.meshes.forEach((m) => m.computeWorldMatrix(true));
  bb = modelRoot.getHierarchyBoundingVectors(true);

  res.meshes.forEach((m) => {
    if (shadowGen && (m.getTotalVertices?.() || 0) > 0) shadowGen.addShadowCaster(m);
  });

  // Loop the model's built-in clip (ailerons/gear) for a bit of ambient life.
  res.animationGroups?.forEach((g) => g.play(true));

  return { modelRoot, bottomY: bb.min.y, lengthZ: bb.max.z - bb.min.z };
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
