/* =====================================================================
   The render loop. Runs only while the modal is open; also applies the
   free-spin thumbstick drift to the cube each frame.
   ===================================================================== */
import { AXIS_X, AXIS_Y } from "./constants.js";
import { renderer, scene, camera, cubeGroup } from "./scene.js";
import { S } from "./state.js";
import { cartonOn } from "./carton.js";

let rendering = false;

export function startRender() {
  if (rendering) return;
  rendering = true;
  loop();
}

export function stopRender() {
  rendering = false;
}

function loop() {
  if (!rendering) return;
  requestAnimationFrame(loop);
  if (
    S.rotMode === "free" &&
    S.stickEngaged &&
    !S.animating &&
    !S.scrambling &&
    !cartonOn() &&
    (Math.abs(S.stickNX) > 0.04 || Math.abs(S.stickNY) > 0.04)
  ) {
    const sp = 0.05;
    cubeGroup.rotateOnWorldAxis(AXIS_Y, -S.stickNX * sp);
    cubeGroup.rotateOnWorldAxis(AXIS_X, S.stickNY * sp);
  }
  renderer.render(scene, camera);
}
