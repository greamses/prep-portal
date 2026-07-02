/* ============================================================================
   Bearing Courier — analog thumbstick
   ----------------------------------------------------------------------------
   The same soft thumbstick used across our games (maze / Cartesian Art), here
   reused for touch flight. Reports a continuous vector { x, y } (each -1..1);
   screen-up is -y, screen-right is +x. Releasing snaps the knob back to centre.
   Two of these drive the drone on mobile: a LEFT stick (turn + throttle) and a
   RIGHT stick (altitude).
   ========================================================================== */

export function createJoystick(ring, knob) {
  const RADIUS = 40; // px the knob can travel from centre
  const DEAD = 5; // px before movement registers
  const vec = { x: 0, y: 0 };
  let active = false;

  const recenter = () => { knob.style.transform = "translate(0px, 0px)"; };

  const reset = () => {
    active = false;
    vec.x = 0;
    vec.y = 0;
    ring.classList.remove("dr-dragging");
    recenter();
  };

  const onMove = (e) => {
    if (!active) return;
    const r = ring.getBoundingClientRect();
    const vx = e.clientX - (r.left + r.width / 2);
    const vy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(vx, vy);
    const k = Math.min(1, RADIUS / (dist || 1));
    knob.style.transform = `translate(${vx * k}px, ${vy * k}px)`;
    if (dist < DEAD) { vec.x = 0; vec.y = 0; return; }
    vec.x = Math.max(-1, Math.min(1, vx / RADIUS));
    vec.y = Math.max(-1, Math.min(1, vy / RADIUS));
  };

  const onDown = (e) => {
    e.preventDefault();
    active = true;
    ring.classList.add("dr-dragging");
    ring.setPointerCapture?.(e.pointerId);
    onMove(e);
  };

  ring.addEventListener("pointerdown", onDown);
  ring.addEventListener("pointermove", onMove);
  ring.addEventListener("pointerup", reset);
  ring.addEventListener("pointercancel", reset);
  ring.addEventListener("lostpointercapture", reset);

  return { value: vec, reset };
}
