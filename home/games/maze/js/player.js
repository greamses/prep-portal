/* ============================================================================
   3D Maze — third-person player controller (COD-style)
   ----------------------------------------------------------------------------
   An invisible (debug: translucent) capsule "body" moves and is clamped out of
   maze walls via the grid. The character model is parented to it. Camera starts
   ABOVE on spawn and eases down behind the character as she walks to the gate,
   then follows behind (drag to pan). The entrance is a one-way gate: shut until
   she reaches it, then it seals behind her once inside.
   ========================================================================== */

import { CFG } from "./config.js";

const B = window.BABYLON;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function createPlayer(scene, canvas, startPos, character, grid, entrance, getDoorState) {
  const rows = grid.length, cols = grid[0].length;
  const R = 0.62, h = CFG.cell / 2; // collision clearance from walls + half cell
  const startZ = startPos.z;

  // ── physics body (radius = R so the debug capsule shows the real clearance) ─
  const body = B.MeshBuilder.CreateCapsule("playerBody", { height: 1.7, radius: R }, scene);
  body.position.set(startPos.x, 0.9, startPos.z);
  body.isVisible = false;
  if (CFG.debugCollision) {
    body.isVisible = true;
    const dm = new B.StandardMaterial("dbgMat", scene);
    dm.diffuseColor = new B.Color3(1, 0.25, 0.25);
    dm.emissiveColor = new B.Color3(0.4, 0.05, 0.05);
    dm.alpha = 0.3;
    body.material = dm;
  }

  // Grid-based wall collision + one-way entrance gate.
  function clampWalls(p) {
    const c = Math.round(p.x / CFG.cell), r = Math.round(p.z / CFG.cell);
    if (r >= 0 && c >= 0 && r < rows && c < cols) {
      const cx = c * CFG.cell, cz = r * CFG.cell, k = grid[r][c];
      if (k.w) p.x = Math.max(p.x, cx - h + R);
      if (k.e) p.x = Math.min(p.x, cx + h - R);
      if (k.n) p.z = Math.max(p.z, cz - h + R);
      if (k.s) p.z = Math.min(p.z, cz + h - R);
    } else if (entrance) {
      p.x = clamp(p.x, -h + R, h - R);
      p.z = Math.max(p.z, entrance.backZ + R);
    }
    if (entrance && getDoorState) {
      const s = getDoorState();
      if (s === "shut") p.z = Math.min(p.z, entrance.doorZ - R);      // can't enter yet
      else if (s === "sealed") p.z = Math.max(p.z, entrance.doorZ + R); // can't go back out
    }
  }

  // ── character model under the body ───────────────────────────────────────
  const model = character.root;
  model.parent = body;
  model.position.set(0, -0.85 - (character.footOffset || 0), 0);

  // ── camera: starts above, eases to behind-the-back ───────────────────────
  const cam = new B.ArcRotateCamera("tpv", -Math.PI / 2, 0.35, 9, body.position, scene);
  cam.attachControl(canvas, true);
  cam.inputs.removeByType("ArcRotateCameraKeyboardMoveInput"); // arrows = move
  cam.lockedTarget = body;
  cam.lowerRadiusLimit = 2.5;
  cam.upperRadiusLimit = 10;
  cam.lowerBetaLimit = 0.3;
  cam.upperBetaLimit = 1.46;
  cam.wheelPrecision = 40;
  cam.checkCollisions = true;
  cam.collisionRadius = new B.Vector3(0.5, 0.5, 0.5);
  cam.targetScreenOffset = new B.Vector2(0, -0.35);
  scene.activeCamera = cam;

  let dragging = false, lastDrag = -1e9;
  canvas.addEventListener("pointerdown", () => { dragging = true; });
  window.addEventListener("pointerup", () => {
    if (dragging) { dragging = false; lastDrag = performance.now(); }
  });

  let yaw = 0;

  /** input = { x: strafe(-1..1), y: forward(-1..1), run: bool } */
  function update(input) {
    const mag = Math.hypot(input.x, input.y);
    if (mag < 0.02) { character.play("idle"); return; }

    const f = cam.getForwardRay().direction;
    f.y = 0; f.normalize();
    const r = B.Vector3.Cross(B.Vector3.Up(), f);
    r.normalize();

    const move = f.scale(input.y).add(r.scale(input.x));
    move.y = 0;
    if (move.lengthSquared() < 1e-5) { character.play("idle"); return; }
    move.normalize();

    const running = input.run; // walk by default; hold Shift to run
    const speed = running ? CFG.runSpeed : CFG.moveSpeed;
    body.position.x += move.x * speed;
    body.position.z += move.z * speed;
    clampWalls(body.position);

    const facing = Math.atan2(move.x, move.z);
    yaw = lerpAngle(yaw, facing + CFG.modelYaw, CFG.turnLerp);
    body.rotation.y = yaw;

    character.play(running ? "run" : "walk");

    // cinematic intro: above → behind as she advances toward the gate
    if (getDoorState && getDoorState() === "shut" && entrance) {
      const t = clamp((body.position.z - startZ) / (entrance.doorZ - startZ), 0, 1);
      cam.beta = 0.35 + (1.32 - 0.35) * t;
      cam.radius = 9 + (CFG.camDist - 9) * t;
    } else if (!dragging && performance.now() - lastDrag > 1100) {
      // auto-trail behind once she's through the gate
      const want = Math.atan2(-Math.cos(facing), -Math.sin(facing));
      cam.alpha = lerpAngle(cam.alpha, want, 0.05);
    }
  }

  return { body, cam, model, update };
}
