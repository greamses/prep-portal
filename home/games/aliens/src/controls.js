// controls.js — angle dial stick (absolute 0–180° aim) + tap to fire
export function setupControls() {
  const stick = document.getElementById('stick');
  const knob = document.getElementById('stick-knob');
  const shoot = document.getElementById('shoot-btn');
  const hint = document.getElementById('hint');

  const state = { enabled: true, onAim: null, onShoot: null };

  let rect = null, kRadius = 0, pointerId = null;
  const cache = () => {
    rect = stick.getBoundingClientRect();
    kRadius = rect.width * 0.31;
  };
  window.addEventListener('resize', () => { cache(); }, { passive: true });

  // place the knob on the dial rim at a given angle (0°=right, 90°=up, 180°=left)
  function setKnob(deg) {
    if (!rect) cache();
    const a = deg * Math.PI / 180;
    knob.style.transform = `translate(${Math.cos(a) * kRadius}px, ${-Math.sin(a) * kRadius}px)`;
  }

  function angleFromEvent(e) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let deg = Math.atan2(-(e.clientY - cy), e.clientX - cx) * 180 / Math.PI;
    if (deg < 0) deg = (e.clientX - cx) >= 0 ? 0 : 180;   // clamp to upper semicircle
    return Math.max(0, Math.min(180, deg));
  }

  const drag = (e) => {
    const deg = angleFromEvent(e);
    setKnob(deg);
    state.onAim && state.onAim(deg);
  };

  stick.addEventListener('pointerdown', (e) => {
    if (!state.enabled) return;
    cache(); pointerId = e.pointerId; stick.setPointerCapture(e.pointerId);
    stick.classList.add('active'); drag(e); hideHint(); e.preventDefault();
  });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId === pointerId) drag(e); });
  const end = (e) => { if (e.pointerId === pointerId) { pointerId = null; stick.classList.remove('active'); } };
  stick.addEventListener('pointerup', end);
  stick.addEventListener('pointercancel', end);

  // tap to fire
  shoot.addEventListener('pointerdown', (e) => {
    if (!state.enabled) return;
    e.preventDefault(); hideHint();
    state.onShoot && state.onShoot();
  });

  function hideHint() {
    if (hint && !hint.classList.contains('hidden')) {
      setTimeout(() => hint.classList.add('hidden'), 1200);
    }
  }

  return {
    state,
    onAim(fn) { state.onAim = fn; },
    onShoot(fn) { state.onShoot = fn; },
    setKnob,
    setEnabled(v) { state.enabled = v; },
  };
}
