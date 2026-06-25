/* ============================================================================
   3D Maze — player (first-person camera)
   ----------------------------------------------------------------------------
   A first-person UniversalCamera with WASD / arrow movement, mouse-look (via
   pointer-lock on click), wall collisions and gravity so you walk the maze
   rather than fly. Returns the camera.
   ========================================================================== */

import { CFG } from "./config.js";

const B = window.BABYLON;

export function createPlayer(scene, canvas, startPos) {
  const cam = new B.UniversalCamera("player", startPos.clone(), scene);
  cam.attachControl(canvas, true);

  cam.checkCollisions = true;
  cam.applyGravity = true;
  cam.ellipsoid = new B.Vector3(0.6, CFG.eyeH / 2, 0.6);
  cam.ellipsoidOffset = new B.Vector3(0, CFG.eyeH / 2, 0);
  cam.minZ = 0.1;
  cam.fov = 1.05;

  cam.speed = CFG.moveSpeed;
  cam.angularSensibility = CFG.lookSensitivity;
  cam.inertia = 0.6;

  // WASD + arrow keys
  cam.keysUp = [87, 38];
  cam.keysDown = [83, 40];
  cam.keysLeft = [65, 37];
  cam.keysRight = [68, 39];

  // mouse-look: capture the pointer on click (Esc releases it)
  canvas.addEventListener("click", () => canvas.requestPointerLock?.());

  return cam;
}
