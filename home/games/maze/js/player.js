/* ============================================================================
   3D Maze — third-person player controller (COD-style)
   ----------------------------------------------------------------------------
   An invisible capsule "body" does the moving + wall collisions; the character
   model is parented to it. An ArcRotateCamera orbits behind the body (drag /
   right-stick = look, like COD). Movement is relative to where the camera looks;
   the character turns to face its movement direction and plays walk/run/idle.
   ========================================================================== */

import { CFG } from "./config.js";

const B = window.BABYLON;

function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function createPlayer(scene, canvas, startPos, character) {
  // ── physics body (invisible) ─────────────────────────────────────────────
  const body = B.MeshBuilder.CreateCapsule("playerBody", { height: 1.7, radius: 0.38 }, scene);
  body.position.set(startPos.x, 0.9, startPos.z);
  body.isVisible = false;
  body.checkCollisions = true;
  body.ellipsoid = new B.Vector3(0.38, 0.85, 0.38);

  // ── character model under the body ───────────────────────────────────────
  const model = character.root;
  model.parent = body;
  model.position.set(0, -0.9, 0); // feet at the body's base

  // ── third-person orbit camera ────────────────────────────────────────────
  const cam = new B.ArcRotateCamera("tpv", -Math.PI / 2, 1.15, CFG.camDist, body.position, scene);
  cam.attachControl(canvas, true);
  cam.lockedTarget = body;
  cam.lowerRadiusLimit = 3;
  cam.upperRadiusLimit = 9;
  cam.lowerBetaLimit = 0.45;
  cam.upperBetaLimit = 1.45;
  cam.wheelPrecision = 30;
  cam.checkCollisions = true; // keep the camera out of walls
  cam.collisionRadius = new B.Vector3(0.4, 0.4, 0.4);
  cam.targetScreenOffset = new B.Vector2(0, -0.7); // aim at the head, body lower in frame
  scene.activeCamera = cam;

  let yaw = 0;

  /** input = { x: strafe(-1..1), y: forward(-1..1), run: bool } */
  function update(input) {
    const mag = Math.hypot(input.x, input.y);
    if (mag < 0.02) {
      character.play("idle");
      return;
    }
    // camera-relative basis (flattened)
    const f = cam.getForwardRay().direction;
    f.y = 0;
    f.normalize();
    const r = B.Vector3.Cross(B.Vector3.Up(), f); // right (left-handed)
    r.normalize();

    const move = f.scale(input.y).add(r.scale(input.x));
    move.y = 0;
    if (move.lengthSquared() < 1e-5) { character.play("idle"); return; }
    move.normalize();

    const running = input.run || mag > CFG.runThreshold;
    const speed = running ? CFG.runSpeed : CFG.moveSpeed;
    body.moveWithCollisions(move.scale(speed));

    // face movement direction (+ model offset), smoothed
    yaw = lerpAngle(yaw, Math.atan2(move.x, move.z) + CFG.modelYaw, CFG.turnLerp);
    body.rotation.y = yaw;

    character.play(running ? "run" : "walk");
  }

  return { body, cam, model, update };
}
