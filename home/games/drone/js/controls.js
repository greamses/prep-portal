/* ============================================================================
   Bearing Courier — controls
   ----------------------------------------------------------------------------
   Merges keyboard + two analog thumbsticks into one "intent" the drone
   integrates each frame:
     turn    (yaw / bearing)   A / D   ·   left stick  x
     thrust  (forward / back)  W / S   ·   left stick −y (push up = forward)
     climb   (altitude)        ↑ / ↓   ·   right stick −y (push up = ascend)
   Intent values are analog in [-1, 1] (a nudged stick turns gently). Arrow keys
   have their default scroll prevented. Returns { sample, dispose }.
   ========================================================================== */

export function createControls(sticks = {}) {
  const { left, right } = sticks; // each: { value: { x, y } } | undefined
  const keys = Object.create(null);
  const intent = { turn: 0, thrust: 0, climb: 0 };

  const CODES = new Set([
    "KeyW", "KeyA", "KeyS", "KeyD",
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  ]);

  const onDown = (e) => { if (CODES.has(e.code)) { keys[e.code] = true; e.preventDefault(); } };
  const onUp = (e) => { if (CODES.has(e.code)) { keys[e.code] = false; e.preventDefault(); } };
  const onBlur = () => { for (const k in keys) keys[k] = false; };

  window.addEventListener("keydown", onDown, { passive: false });
  window.addEventListener("keyup", onUp, { passive: false });
  window.addEventListener("blur", onBlur);

  const clamp1 = (v) => (v < -1 ? -1 : v > 1 ? 1 : v);

  function sample() {
    const kbTurn = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    const kbThrust = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    const kbClimb = (keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0);

    const lx = left ? left.value.x : 0;
    const ly = left ? left.value.y : 0;
    const ry = right ? right.value.y : 0;

    intent.turn = clamp1(kbTurn + lx);
    intent.thrust = clamp1(kbThrust - ly); // stick up (−y) = forward
    intent.climb = clamp1(kbClimb - ry); // stick up (−y) = ascend
    return intent;
  }

  function dispose() {
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
    window.removeEventListener("blur", onBlur);
  }

  return { sample, dispose };
}
