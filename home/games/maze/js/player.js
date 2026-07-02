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

  // ── camera: drone overview of the whole maze → behind-the-back follow ────
  const mazeCenter = new B.Vector3((cols - 1) * CFG.cell / 2, 0, (rows - 1) * CFG.cell / 2);
  const droneRadius = Math.max(cols, rows) * CFG.cell * 1.15;

  const cam = new B.ArcRotateCamera("tpv", -Math.PI / 2, 0.12, droneRadius, mazeCenter.clone(), scene);
  cam.attachControl(canvas, true);
  cam.inputs.removeByType("ArcRotateCameraKeyboardMoveInput"); // arrows = move
  cam.lowerRadiusLimit = 1.4; // allow a tight close-in view
  cam.upperRadiusLimit = Math.max(60, droneRadius + 6);
  cam.lowerBetaLimit = 0.08;
  cam.upperBetaLimit = 1.46;
  cam.wheelPrecision = 40;
  cam.collisionRadius = new B.Vector3(0.5, 0.5, 0.5);
  cam.targetScreenOffset = new B.Vector2(0, -0.3);
  scene.activeCamera = cam;
  let followed = false;

  // follow-camera feel
  const FOLLOW_BETA = 1.15;   // behind & slightly above (0 = top-down, π/2 = level)
  const SWING_LERP = 0.16;    // how fast the camera swings behind her (was 0.05)
  const PITCH_LERP = 0.12;    // how fast the pitch eases back to FOLLOW_BETA
  const RADIUS_LERP = 0.12;   // how fast the distance eases to target
  const DRAG_HOLD_MS = 550;   // let a manual drag settle before auto-follow resumes

  let dragging = false, lastDrag = -1e9;
  canvas.addEventListener("pointerdown", () => { dragging = true; });
  window.addEventListener("pointerup", () => {
    if (dragging) { dragging = false; lastDrag = performance.now(); }
  });

  let yaw = 0, lastFacing = 0;

  // keep the camera from seeing through walls: if a wall sits between her head
  // and the camera, pull the camera in to just before it.
  const headOff = new B.Vector3(0, 1.3, 0);
  const occludes = (m) => m && (m.name === "wall" || m.name === "gate" || m.name === "door");
  function occludeCamera() {
    const tgt = body.position.add(headOff);
    const toCam = cam.position.subtract(tgt);
    const dist = toCam.length();
    if (dist < 0.15) return;
    toCam.scaleInPlace(1 / dist);
    const hit = scene.pickWithRay(new B.Ray(tgt, toCam, dist), occludes);
    if (hit && hit.hit) cam.radius = Math.max(cam.lowerRadiusLimit, hit.distance - 0.4);
  }

  // Camera follow — runs EVERY frame (even while she stands still) so the view
  // keeps settling behind her, holds a steady pitch and never rests in a wall.
  function followCamera(moving, running) {
    // drone intro: whole-maze overview eases down to behind-the-back as she
    // advances toward the gate; then we lock to follow.
    if (getDoorState && getDoorState() === "shut" && entrance) {
      const t = clamp((body.position.z - startZ) / (entrance.doorZ - startZ), 0, 1);
      cam.target = B.Vector3.Lerp(mazeCenter, body.position, t);
      cam.alpha = -Math.PI / 2;
      cam.beta = 0.12 + (FOLLOW_BETA - 0.12) * t;
      cam.radius = droneRadius + (CFG.camDist - droneRadius) * t;
      return;
    }
    if (!followed) { cam.lockedTarget = body; followed = true; }
    if (!dragging && performance.now() - lastDrag > DRAG_HOLD_MS) {
      // swing behind her only while she's moving (nothing to chase when idle)
      if (moving) {
        const want = Math.atan2(-Math.cos(lastFacing), -Math.sin(lastFacing));
        cam.alpha = lerpAngle(cam.alpha, want, SWING_LERP);
      }
      cam.beta += (FOLLOW_BETA - cam.beta) * PITCH_LERP; // ease back to a steady pitch
      // close in behind her while running (a tight, wall-skimming view)
      const wantR = (CFG.closeOnRun && running) ? CFG.camDist * 0.82 : CFG.camDist;
      cam.radius += (wantR - cam.radius) * RADIUS_LERP;
    }
    occludeCamera();
  }

  /** input = { x: strafe(-1..1), y: forward(-1..1), run: bool } */
  function update(input) {
    const mag = Math.hypot(input.x, input.y);
    let moving = false, running = false;

    if (mag >= 0.02) {
      // camera-relative basis; if the camera is steep (drone intro), its forward
      // is nearly vertical and useless — fall back to world forward so the stick
      // moves her instead of spinning her in place.
      const f = cam.getForwardRay().direction.clone();
      f.y = 0;
      if (f.lengthSquared() < 0.05) f.set(0, 0, 1);
      f.normalize();
      const r = B.Vector3.Cross(B.Vector3.Up(), f);
      r.normalize();

      const move = f.scale(input.y).add(r.scale(input.x));
      move.y = 0;
      if (move.lengthSquared() >= 1e-5) {
        move.normalize();
        // Shift runs (desktop); a full analog push runs (mobile — no Shift key)
        running = input.run || (input.stickMag || 0) > CFG.runThreshold;
        const speed = running ? CFG.runSpeed : CFG.moveSpeed;
        body.position.x += move.x * speed;
        body.position.z += move.z * speed;
        clampWalls(body.position);

        const facing = Math.atan2(move.x, move.z);
        yaw = lerpAngle(yaw, facing + CFG.modelYaw, CFG.turnLerp);
        body.rotation.y = yaw;
        lastFacing = facing;
        character.play(running ? "run" : "walk");
        moving = true;
      }
    }

    if (!moving) character.play("idle");
    followCamera(moving, running);
  }

  return { body, cam, model, update };
}
