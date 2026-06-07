/**
 * On-screen controls: analog stick + power meter + shoot button.
 * ADDED: Free area pan (1 finger) and pinch-to-zoom (2 fingers) on the canvas.
 */
export function setupControls() {
  const canvas = document.getElementById("scene");
  const stick = document.getElementById("stick");
  const knob  = document.getElementById("stick-knob");
  const shoot = document.getElementById("shoot-btn");
  const fill  = document.getElementById("power-fill");
  const hint  = document.getElementById("hint");

  // Prevent default scrolling when swiping on the 3D canvas
  if (canvas) canvas.style.touchAction = "none";

  const state = {
    aim: { x: 0, y: 0 }, // Analog stick (NOW USED FOR MOVEMENT)
    pan: { x: 0, y: 0 }, // Free pan accumulator
    zoom: 1.0,           // Pinch zoom multiplier
    power: 0,
    charging: false,
    onShoot: null,
    enabled: true,
  };

  /* ----- Stick geometry — cached to avoid reflow ----- */
  let _rect = null;
  let _radius = 0;

  function cacheStickGeometry() {
    _rect   = stick.getBoundingClientRect();
    _radius = _rect.width / 2 - 18;
  }

  window.addEventListener("resize", cacheStickGeometry, { passive: true });

  /* ----- Analog Stick ----- */
  let stickPointer = null;

  const moveStick = (clientX, clientY) => {
    const cx = _rect.left + _rect.width / 2;
    const cy = _rect.top  + _rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > _radius) { dx = (dx / d) * _radius; dy = (dy / d) * _radius; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    state.aim.x = dx / _radius;
    state.aim.y = dy / _radius;
  };

  const resetStick = () => {
    knob.style.transform = "translate(0,0)";
    state.aim.x = 0; state.aim.y = 0;
    stick.classList.remove("active");
  };

  stick.addEventListener("pointerdown", (e) => {
    if (!state.enabled) return;
    cacheStickGeometry(); 
    stickPointer = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    stick.classList.add("active");
    moveStick(e.clientX, e.clientY);
    hideHint();
    e.preventDefault();
  });

  stick.addEventListener("pointermove", (e) => {
    if (e.pointerId !== stickPointer) return;
    moveStick(e.clientX, e.clientY);
  });

  const endStick = (e) => {
    if (e.pointerId !== stickPointer) return;
    stickPointer = null;
    resetStick();
  };
  stick.addEventListener("pointerup", endStick);
  stick.addEventListener("pointercancel", endStick);

  /* ----- Free Area Pan & Pinch Zoom (Canvas) ----- */
  const activePointers = new Map();
  let initialPinchDist = 0;
  let initialZoom = state.zoom;

  canvas.addEventListener("pointerdown", (e) => {
    if (!state.enabled) return;
    activePointers.set(e.pointerId, e);
    
    if (activePointers.size === 2) {
      const pts = Array.from(activePointers.values());
      initialPinchDist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      initialZoom = state.zoom;
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!state.enabled || !activePointers.has(e.pointerId)) return;
    
    const prev = activePointers.get(e.pointerId);
    activePointers.set(e.pointerId, e); // update stored pointer

    if (activePointers.size === 1) {
      // 1 Finger = Pan
      state.pan.x += (e.clientX - prev.clientX);
      state.pan.y += (e.clientY - prev.clientY);
    } else if (activePointers.size === 2) {
      // 2 Fingers = Pinch to Zoom
      const pts = Array.from(activePointers.values());
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      
      if (initialPinchDist > 0) {
        const scale = dist / initialPinchDist;
        // Restrict zoom out and zoom in limits
        state.zoom = Math.max(0.5, Math.min(1.5, initialZoom / scale));
      }
    }
  });

  const endCanvasPointer = (e) => {
    activePointers.delete(e.pointerId);
    // If going from 2 fingers back to 1, update the remaining finger to prevent jumping
    if (activePointers.size === 1) {
      const remaining = Array.from(activePointers.values())[0];
      activePointers.set(remaining.pointerId, remaining);
    }
  };
  
  canvas.addEventListener("pointerup", endCanvasPointer);
  canvas.addEventListener("pointercancel", endCanvasPointer);
  canvas.addEventListener("pointerout", endCanvasPointer);

  /* ----- Shoot button (charge + release) ----- */
  let chargeStart = 0;
  let chargeRAF = 0;
  const CHARGE_TIME = 1100;

  const startCharge = (e) => {
    if (!state.enabled) return;
    state.charging = true;
    state.power = 0;
    chargeStart = performance.now();
    shoot.classList.add("charging");
    hideHint();
    const tick = () => {
      if (!state.charging) return;
      const phase = ((performance.now() - chargeStart) / CHARGE_TIME) % 2;
      const p = phase <= 1 ? phase : 2 - phase;
      state.power = p;
      fill.style.height = (p * 100) + "%";
      chargeRAF = requestAnimationFrame(tick);
    };
    chargeRAF = requestAnimationFrame(tick);
    if (e) { shoot.setPointerCapture?.(e.pointerId); e.preventDefault(); }
  };

  const releaseCharge = () => {
    if (!state.charging) return;
    state.charging = false;
    cancelAnimationFrame(chargeRAF);
    shoot.classList.remove("charging");
    const power = state.power;
    fill.style.height = "0%";
    state.power = 0;
    state.onShoot && state.onShoot(power); // No longer passing aim, aiming is pan now
  };

  shoot.addEventListener("pointerdown", startCharge);
  shoot.addEventListener("pointerup",     releaseCharge);
  shoot.addEventListener("pointercancel", releaseCharge);
  shoot.addEventListener("pointerleave", () => { /* keep charging */ });

  function hideHint() {
    if (hint && !hint.classList.contains("hidden")) {
      setTimeout(() => hint.classList.add("hidden"), 1200);
    }
  }

  return {
    state,
    setOnShoot(fn) { state.onShoot = fn; },
    setEnabled(v)  { state.enabled = v; },
    // Read and reset pan values every frame
    consumePan() {
      const p = { x: state.pan.x, y: state.pan.y };
      state.pan.x = 0;
      state.pan.y = 0;
      return p;
    }
  };
}