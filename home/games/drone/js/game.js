/* ============================================================================
   Bearing Courier — game orchestrator
   ----------------------------------------------------------------------------
   Wires scene, drone, controls, mission and HUD together and runs the one-minute
   round as a courier loop:

     BASE ─(pick up carton)→ fly the quoted bearing ─→ DROP among the houses
          ←────────────────  fly the bearing back  ←── RETURN to base → next

   The drop pad is hidden in the neighbourhood and never shown on the radar, so
   the pilot must fly the bearing + distance to find it. Win at CFG.target drops,
   lose when the timer runs out. startGame() resolves once the scene is ready.
   ========================================================================== */

import { CFG } from "./config.js";
import { createEngine, createScene } from "./engine.js";
import { createDrone } from "./drone.js";
import { createControls } from "./controls.js";
import { createJoystick } from "./joystick.js";
import { createMission } from "./mission.js";
import { createHud } from "./hud.js";
import { bearingFromTo, planarDist } from "./bearing.js";

const $ = (s) => document.querySelector(s);
const BASE = { x: 0, z: 0 };

export async function startGame() {
  const canvas = document.getElementById("dr-canvas");
  const engine = createEngine(canvas);
  const scene = createScene(engine);

  const drone = createDrone(scene);
  const leftStick = createJoystick($("#dr-joy-l-ring"), $("#dr-joy-l-knob"));
  const rightStick = createJoystick($("#dr-joy-r-ring"), $("#dr-joy-r-knob"));
  const controls = createControls({ left: leftStick, right: rightStick });
  const mission = createMission(scene);
  const hud = createHud();

  const state = {
    score: 0,
    startedAt: 0,
    over: false,
    cooldown: 0, // frames to ignore pickup/drop right after one happens
    phase: "toDrop", // "toDrop" (carrying to a pad) | "toBase" (returning)
  };

  // Pick up a carton at base and name a target house to deliver to.
  function pickUp() {
    const { houseNumber } = mission.spawn(BASE);
    state.phase = "toDrop";
    drone.setCarrying(true);
    hud.setCard(state.score + 1, CFG.target, "DELIVER TO", "#" + houseNumber);
    state.cooldown = 30;
  }

  // Drop the carton at the pad; then send the pilot back to base.
  function deliver() {
    mission.dropCarton();
    drone.setCarrying(false);
    state.score++;
    hud.setScore(state.score, CFG.target);
    if (state.score >= CFG.target) { end(true); return; }
    state.phase = "toBase";
    hud.setCard(state.score + 1, CFG.target, "RETURN TO BASE", "BASE 1");
    state.cooldown = 30;
  }

  function begin() {
    state.score = 0;
    state.over = false;
    state.startedAt = performance.now();
    drone.reset();
    hud.hideEnd();
    hud.setScore(0, CFG.target);
    pickUp(); // start already holding the first carton
    state.startedAt = performance.now(); // (re)zero after any spawn work
  }

  function end(won) {
    state.over = true;
    hud.showEnd(won, state.score, CFG.target);
  }

  engine.runRenderLoop(() => {
    const now = performance.now();

    if (!state.over) {
      const intent = controls.sample();
      drone.update(intent);
      mission.pulse(now);

      // distance + LIVE homing bearing to this leg's target (drop pad, or base)
      const target = state.phase === "toBase" ? BASE : mission.pad.position;
      const dist = planarDist(drone.position.x, drone.position.z, target.x, target.z);
      const required = bearingFromTo(drone.position.x, drone.position.z, target.x, target.z);
      const radius = state.phase === "toBase" ? CFG.baseRadius : CFG.padRadius;
      const overTarget = dist <= radius;
      const lowEnough = drone.position.y <= CFG.landAlt;

      if (state.cooldown > 0) state.cooldown--;
      else if (overTarget && lowEnough) {
        if (state.phase === "toDrop") deliver();
        else pickUp();
      }

      // timer
      const left = CFG.timeLimitMs - (now - state.startedAt);
      hud.setTimer(left);
      if (left <= 0 && !state.over) end(false);

      hud.tick({
        droneBearing: drone.bearing,
        requiredBearing: required,
        distanceM: Math.round(dist * CFG.metresPerUnit),
        altM: drone.altitudeM,
        overTarget,
        lowEnough,
        phase: state.phase,
      });
    }

    scene.render();
  });

  window.addEventListener("resize", () => engine.resize());
  $("#dr-end-restart")?.addEventListener("click", begin);

  begin();

  await new Promise((res) => scene.executeWhenReady(res));
  return { scene, engine, drone };
}
