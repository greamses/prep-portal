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

  // Flat maze → no gravity needed. Keep wall collisions; the camera stays at a
  // fixed eye height, which avoids the "sinks into / sticks on the floor" bug.
  cam.checkCollisions = true;
  cam.applyGravity = false;
  cam.ellipsoid = new B.Vector3(0.55, 0.9, 0.55); // collision body for walls
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

  // Keyboard input only reaches a focused canvas — make it focusable + focus it.
  canvas.tabIndex = 1;
  canvas.style.outline = "none";
  canvas.addEventListener("pointerdown", () => canvas.focus());

  // mouse-look: capture the pointer on click (Esc releases it)
  canvas.addEventListener("click", () => canvas.requestPointerLock?.());

  setTimeout(() => canvas.focus(), 0);
  return cam;
}
