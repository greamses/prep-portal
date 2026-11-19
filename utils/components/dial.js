/* ============================================================================
   THE DIAL — a number picked on a wheel, like a speedometer
   ----------------------------------------------------------------------------
   A 270° gauge: ticks round the rim, the chosen part of the track filled, a
   knob on the value (no needle: it would cross the reading), and the reading large in the centre with its label under
   it. Roll it: drag round the wheel, turn the mouse wheel over it, or use the
   arrow keys (Page Up / Page Down move five steps, Home / End go to the ends).
   It is a role="slider", so screen readers hear its value.

     const d = createDial({ label: 'Sums', min: 5, max: 100, step: 5, value: 10,
                            format: (v) => `${v}`, unit: '', onInput: (v) => {} });
     host.append(d.el);
     d.setRange(min, max, value);    // a new range (the value kept in it)
     d.value;                        // what it reads

   Two to a line in a `.pp-dials` row. Colours from the theme tokens.
   ========================================================================== */
const SWEEP = 270, START = 135;               // from the bottom left, round over the top, to the bottom right
const C = 60, R = 46;                          // viewBox 120 x 120: centre, track radius

let cssDone = false;
function ensureCss() {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  if (document.querySelector('link[href*="/utils/components/dial.css"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/utils/components/dial.css';
  document.head.append(link);
}
const pt = (deg, r) => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)];
const f1 = (n) => n.toFixed(2);
function arc(a0, a1, r) {
  if (a1 - a0 < 0.01) return '';
  const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
  return `M${f1(x0)} ${f1(y0)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
}
const decimals = (step) => { const s = String(step); return s.includes('.') ? s.split('.')[1].length : 0; };

export function createDial({ label, min, max, step = 1, value, format = (v) => String(v), unit = '', onInput }) {
  ensureCss();
  const el = document.createElement('div');
  el.className = 'pp-dial';
  el.innerHTML = `
    <div class="pp-dial__face" role="slider" tabindex="0" aria-label="${label}">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle class="pp-dial__plate" cx="${C}" cy="${C}" r="57"/>
        <path class="pp-dial__track"/>
        <path class="pp-dial__fill"/>
        <g class="pp-dial__ticks"></g>
        <circle class="pp-dial__knob" r="6.2"/>
      </svg>
      <div class="pp-dial__read"><b class="pp-dial__val"></b><span class="pp-dial__unit"></span></div>
    </div>
    <p class="pp-dial__label">${label}</p>
    <p class="pp-dial__ends"><i></i><i></i></p>`;
  const face = el.querySelector('.pp-dial__face');
  const svg = el.querySelector('svg');
  const q = (s) => el.querySelector(s);
  let lo = min, hi = max, st = step, v = value;
  const snap = (x) => {
    const k = Math.round((x - lo) / st);
    const out = Math.min(hi, Math.max(lo, lo + k * st));
    return Number(out.toFixed(decimals(st) + 2));
  };
  const angleOf = (x) => START + (SWEEP * (x - lo)) / (hi - lo || 1);

  function drawTicks() {
    const n = Math.round((hi - lo) / st);
    const every = n <= 20 ? 1 : Math.ceil(n / 20);          // at most twenty ticks round the rim
    let g = '';
    for (let i = 0; i <= n; i += every) {
      const a = angleOf(lo + i * st), major = i === 0 || i >= n - every + 1 || i % (every * 5) === 0;
      const [x0, y0] = pt(a, major ? 50.5 : 52), [x1, y1] = pt(a, 55.5);
      g += `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" class="${major ? 'is-major' : ''}"/>`;
    }
    q('.pp-dial__ticks').innerHTML = g;
    q('.pp-dial__track').setAttribute('d', arc(START, START + SWEEP, R));
    q('.pp-dial__ends').children[0].textContent = format(lo);
    q('.pp-dial__ends').children[1].textContent = format(hi);
  }
  function paint() {
    const a = angleOf(v);
    q('.pp-dial__fill').setAttribute('d', arc(START, a, R));
    const [kx, ky] = pt(a, R);
    const knob = q('.pp-dial__knob');
    knob.setAttribute('cx', f1(kx)); knob.setAttribute('cy', f1(ky));
    q('.pp-dial__val').textContent = format(v).replace(unit, '').trim();
    q('.pp-dial__unit').textContent = unit;
    face.setAttribute('aria-valuemin', lo); face.setAttribute('aria-valuemax', hi);
    face.setAttribute('aria-valuenow', v); face.setAttribute('aria-valuetext', format(v));
  }
  function set(x, fromUser) {
    const nv = snap(x);
    if (nv === v) return;
    v = nv;
    paint();
    if (fromUser && onInput) onInput(v);
  }

  // rolling it: drag round the wheel (the bottom gap snaps to the nearer end)
  let dragging = false;
  const fromPointer = (e) => {
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 120 - C, y = ((e.clientY - r.top) / r.height) * 120 - C;
    let a = (Math.atan2(y, x) * 180) / Math.PI;               // -180..180, clockwise from the right
    if (a < 0) a += 360;
    if (a < START - (360 - SWEEP) / 2) a += 360;              // 0..90 belongs past the top: 360..450
    a = Math.min(START + SWEEP, Math.max(START, a));
    set(lo + ((a - START) / SWEEP) * (hi - lo), true);
  };
  face.addEventListener('pointerdown', (e) => { dragging = true; face.setPointerCapture(e.pointerId); face.classList.add('is-turning'); fromPointer(e); e.preventDefault(); });
  face.addEventListener('pointermove', (e) => { if (dragging) fromPointer(e); });
  const stop = () => { dragging = false; face.classList.remove('is-turning'); };
  face.addEventListener('pointerup', stop);
  face.addEventListener('pointercancel', stop);
  face.addEventListener('wheel', (e) => { e.preventDefault(); set(v + (e.deltaY < 0 ? st : -st), true); }, { passive: false });
  face.addEventListener('keydown', (e) => {
    const moves = { ArrowUp: st, ArrowRight: st, ArrowDown: -st, ArrowLeft: -st, PageUp: st * 5, PageDown: -st * 5 };
    if (e.key in moves) { e.preventDefault(); set(v + moves[e.key], true); }
    else if (e.key === 'Home') { e.preventDefault(); set(lo, true); }
    else if (e.key === 'End') { e.preventDefault(); set(hi, true); }
  });

  v = snap(v);
  drawTicks();
  paint();
  return {
    el,
    get value() { return v; },
    set value(x) { v = snap(x); paint(); },
    setRange(nlo, nhi, nv = v) { lo = nlo; hi = nhi; v = snap(nv); drawTicks(); paint(); },
  };
}
