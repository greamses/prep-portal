/**
 * Mobile on-screen controls:
 *   - Left analog stick (#joystick-zone) → movement
 *   - One-finger drag anywhere else      → look / pan the camera
 *   - Two-finger pinch anywhere else     → zoom (via the onPinchZoom callback)
 *   - Back button       (#btn-back)              → navigate away
 *   - Interact button   (#btn-interact-mobile)   → fires interactTarget.toggle()
 *
 * The movement stick and the look/pinch gestures are tracked by separate touch
 * identifiers, so you can walk with one thumb and look with the other at once.
 */
export class VirtualJoystick {
  constructor(controls, { backHref = '../index.html', onPinchZoom = null } = {}) {
    this._controls = controls;
    this._onZoom   = onPinchZoom;   // f => apply a multiplicative zoom factor

    const moveZone = document.getElementById('joystick-zone');
    const moveKnob = document.getElementById('joystick-knob');
    const btnBack  = document.getElementById('btn-back');
    const btnAct   = document.getElementById('btn-interact-mobile');
    const overlay  = document.getElementById('start-overlay');

    const RADIUS = 46; // max knob travel (px)

    // ── Movement analog stick ──────────────────────────────────────────────────
    if (moveZone && moveKnob) {
      const state = { id: null, cx: 0, cy: 0 };

      moveZone.addEventListener('touchstart', e => {
        e.preventDefault();
        const t = e.changedTouches[0];
        const r = moveZone.getBoundingClientRect();
        state.cx = r.left + r.width / 2;
        state.cy = r.top + r.height / 2;
        state.id = t.identifier;
      }, { passive: false });

      moveZone.addEventListener('touchmove', e => {
        e.preventDefault();
        for (const t of e.changedTouches) {
          if (t.identifier !== state.id) continue;
          let dx = t.clientX - state.cx;
          let dy = t.clientY - state.cy;
          const dist = Math.hypot(dx, dy);
          if (dist > RADIUS) { dx = dx / dist * RADIUS; dy = dy / dist * RADIUS; }
          moveKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
          this._controls.setJoystick(dx / RADIUS, dy / RADIUS);
        }
      }, { passive: false });

      const end = e => {
        for (const t of e.changedTouches) {
          if (t.identifier !== state.id) continue;
          state.id = null;
          moveKnob.style.transform = 'translate(-50%, -50%)';
          this._controls.setJoystick(0, 0);
        }
      };
      moveZone.addEventListener('touchend', end, { passive: true });
      moveZone.addEventListener('touchcancel', end, { passive: true });
    }

    // ── Look (one finger) + pinch-zoom (two fingers), anywhere off the HUD ──────
    // Every "screen" touch (not on a control) is tracked; one finger looks, two
    // fingers pinch. Tracking both keeps the camera from spinning during a pinch.
    const screenTouches = new Map();   // id → { x, y }
    let pinchDist = 0;
    const isControl = el => el && el.closest && el.closest('#joystick-zone, .hud-btn');
    const started   = () => overlay && overlay.classList.contains('hidden');
    const spread = () => {
      const [a, b] = [...screenTouches.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    document.addEventListener('touchstart', e => {
      if (!started()) return;
      for (const t of e.changedTouches) {
        if (isControl(t.target)) continue;       // leave HUD touches to their handlers
        screenTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
      if (screenTouches.size === 2) pinchDist = spread();   // begin a pinch
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      if (screenTouches.size === 0) return;
      let looked = false;
      for (const t of e.changedTouches) {
        const prev = screenTouches.get(t.identifier);
        if (!prev) continue;
        // One finger down → look. (With two down we pinch instead, below.)
        if (screenTouches.size === 1 && !looked) {
          this._controls.rotateLook(t.clientX - prev.x, t.clientY - prev.y);
          looked = true;
        }
        prev.x = t.clientX; prev.y = t.clientY;
      }
      if (screenTouches.size >= 2 && this._onZoom) {
        const d = spread();
        if (pinchDist > 0 && d > 0) this._onZoom(d / pinchDist);
        pinchDist = d;
      }
    }, { passive: true });

    const endTouch = e => {
      for (const t of e.changedTouches) screenTouches.delete(t.identifier);
      if (screenTouches.size < 2) pinchDist = 0;   // pinch over; a lone finger resumes look
    };
    document.addEventListener('touchend',    endTouch, { passive: true });
    document.addEventListener('touchcancel', endTouch, { passive: true });

    // ── Buttons ─────────────────────────────────────────────────────────────────
    if (btnBack) {
      btnBack.addEventListener('touchstart', e => {
        e.preventDefault();
        window.location.href = backHref;
      }, { passive: false });
    }

    if (btnAct) {
      btnAct.addEventListener('touchstart', e => {
        e.preventDefault();
        if (this._controls.interactTarget) this._controls.interactTarget.toggle();
      }, { passive: false });
    }
  }
}
