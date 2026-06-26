/* ============================================================================
   3D Maze — analog movement stick
   ----------------------------------------------------------------------------
   The same soft "rubik's thumbstick" design used in the Cartesian Art studio,
   but here it reports a continuous vector instead of 4-way steps. Drag the knob
   to glide; the live vector { x, y } (each -1..1) drives the player. Screen-up
   is -y (so forward = -y), screen-right is +x. Releasing snaps back to centre.
   ========================================================================== */

export function createJoystick(ring, knob) {
  const RADIUS = 40; // px the knob can travel from centre
  const DEAD = 6; // px before movement registers
  const vec = { x: 0, y: 0 };
  let active = false;

  const recenter = () => { knob.style.transform = "translate(0px, 0px)"; };

  const reset = () => {
    active = false;
    vec.x = 0;
    vec.y = 0;
    ring.classList.remove("mz-dragging");
    recenter();
  };

  const onMove = (e) => {
    if (!active) return;
    const r = ring.getBoundingClientRect();
    let vx = e.clientX - (r.left + r.width / 2);
    let vy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(vx, vy);
    const k = Math.min(1, RADIUS / (dist || 1));
    knob.style.transform = `translate(${vx * k}px, ${vy * k}px)`;
    if (dist < DEAD) { vec.x = 0; vec.y = 0; return; }
    // normalise against the travel radius, clamped to a unit vector
    vec.x = Math.max(-1, Math.min(1, vx / RADIUS));
    vec.y = Math.max(-1, Math.min(1, vy / RADIUS));
  };

  const onDown = (e) => {
    e.preventDefault();
    active = true;
    ring.classList.add("mz-dragging");
    ring.setPointerCapture?.(e.pointerId);
    onMove(e);
  };

  ring.addEventListener("pointerdown", onDown);
  ring.addEventListener("pointermove", onMove);
  ring.addEventListener("pointerup", reset);
  ring.addEventListener("pointercancel", reset);
  ring.addEventListener("lostpointercapture", reset);

  return { value: vec };
}
