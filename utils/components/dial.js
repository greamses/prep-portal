/* ============================================================================
   THE DIAL — a number picked on a gauge, like a car's speedometer
   ----------------------------------------------------------------------------
   A real-looking instrument: a chrome bezel, a face in one of the theme's colours
   (each dial its own: butter, sky, leaf, rose, lilac, apricot) under glass, graduations
   round the rim, a red pointer and a metal cap on the value. What is lit is lit:
   the graduations up to the value glow, the arc glows, and the reading in the
   centre glows like an amber display. Roll it: drag the cap (or anywhere on the
   face) round, turn the mouse wheel over it, or use the arrow keys (Page Up /
   Page Down: five steps; Home / End: the ends). It is a role="slider".

     const d = createDial({ label: 'Sums', min: 5, max: 100, step: 5, value: 10,
                            format: (v) => `${v}`, unit: '', onInput: (v) => {} });
     host.append(d.el);
     d.setRange(min, max, value);    // a new range (the value kept in it)
     d.value;                        // what it reads

   Two to a line in a `.pp-dials` row. The label and the ends are JetBrains Mono
   (the site's body face); the reading is the display face, lit.
   ========================================================================== */
/* each dial a colour of the theme (the user: "the skeuomorph is fine, just use different colours from our theme") */
const TONES = ['--accent-primary', '--accent-secondary', '--accent-success', '--accent-pink', '--accent-purple', '--accent-warning', '--accent-danger'];
const FALLBACK = { '--accent-primary': '#f4c95d', '--accent-secondary': '#6fb7e8', '--accent-success': '#7cc47c', '--accent-pink': '#f0a8c9', '--accent-purple': '#b8a8e8', '--accent-warning': '#f0a868', '--accent-danger': '#f07a7a' };
const SWEEP = 270, START = 135;               // from the bottom left, round over the top, to the bottom right
const C = 60, R = 44;                          // viewBox 120 x 120: centre, the lit arc's radius

let cssDone = false;
let uid = 0;
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

export function createDial({ label, min, max, step = 1, value, format = (v) => String(v), unit = '', tone, onInput }) {
  ensureCss();
  const id = `ppd${++uid}`;
  const el = document.createElement('div');
  el.className = 'pp-dial';
  const tok = tone || TONES[(uid - 1) % TONES.length];
  el.style.setProperty('--tone', `var(${tok}, ${FALLBACK[tok] || '#f4c95d'})`);
  el.innerHTML = `
    <div class="pp-dial__face" role="slider" tabindex="0" aria-label="${label}">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="${id}-chrome" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stop-color="#fbfbfa"/><stop offset="0.3" stop-color="#b9bcc0"/><stop offset="0.55" stop-color="#eceef0"/><stop offset="0.8" stop-color="#8d9196"/><stop offset="1" stop-color="#d7d9dc"/>
          </linearGradient>
          <radialGradient id="${id}-face" cx="0.5" cy="0.38" r="0.66">
            <stop offset="0" style="stop-color: color-mix(in srgb, var(--tone) 22%, #ffffff)"/><stop offset="0.72" style="stop-color: color-mix(in srgb, var(--tone) 55%, #ffffff)"/><stop offset="1" style="stop-color: color-mix(in srgb, var(--tone) 80%, #6b5a3a)"/>
          </radialGradient>
          <radialGradient id="${id}-cap" cx="0.38" cy="0.32" r="0.75">
            <stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#c3c6ca"/><stop offset="1" stop-color="#6c7076"/>
          </radialGradient>
          <linearGradient id="${id}-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
          </linearGradient>
          <filter id="${id}-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="${C}" cy="${C}" r="58.5" fill="url(#${id}-chrome)"/>
        <circle cx="${C}" cy="${C}" r="54.2" fill="#5d6166"/>
        <circle cx="${C}" cy="${C}" r="53" fill="url(#${id}-face)"/>
        <path class="pp-dial__track"/>
        <path class="pp-dial__fill" filter="url(#${id}-glow)"/>
        <g class="pp-dial__ticks"></g>
        <line class="pp-dial__pointer"/>
        <circle class="pp-dial__cap" r="5.4" fill="url(#${id}-cap)"/>
        <ellipse cx="${C}" cy="36" rx="40" ry="24" fill="url(#${id}-glass)" pointer-events="none"/>
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
    const every = n <= 24 ? 1 : Math.ceil(n / 24);          // at most two dozen graduations round the rim
    let g = '';
    for (let i = 0; i <= n; i += every) {
      const tv = lo + i * st, a = angleOf(tv), major = i === 0 || i + every > n || (i / every) % 5 === 0;
      const [x0, y0] = pt(a, major ? 45.5 : 48), [x1, y1] = pt(a, 51.5);
      g += `<line data-v="${tv}" x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" class="${major ? 'is-major' : ''}"/>`;
    }
    const ticks = q('.pp-dial__ticks');
    ticks.innerHTML = g;
    q('.pp-dial__track').setAttribute('d', arc(START, START + SWEEP, R - 4));
    q('.pp-dial__ends').children[0].textContent = format(lo);
    q('.pp-dial__ends').children[1].textContent = format(hi);
  }
  function paint() {
    const a = angleOf(v);
    q('.pp-dial__fill').setAttribute('d', arc(START, a, R - 4));
    // the graduations up to the value are lit
    for (const t of q('.pp-dial__ticks').children) t.classList.toggle('is-lit', Number(t.dataset.v) <= v + 1e-9);
    const [px0, py0] = pt(a, 30), [px1, py1] = pt(a, 52);
    const ptr = q('.pp-dial__pointer');
    ptr.setAttribute('x1', f1(px0)); ptr.setAttribute('y1', f1(py0)); ptr.setAttribute('x2', f1(px1)); ptr.setAttribute('y2', f1(py1));
    const [cx, cy] = pt(a, R - 4);
    const cap = q('.pp-dial__cap');
    cap.setAttribute('cx', f1(cx)); cap.setAttribute('cy', f1(cy));
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

  // rolling it: drag round the face (the bottom gap snaps to the nearer end)
  let dragging = false;
  const fromPointer = (e) => {
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 120 - C, y = ((e.clientY - r.top) / r.height) * 120 - C;
    let a = (Math.atan2(y, x) * 180) / Math.PI;
    if (a < 0) a += 360;
    if (a < START - (360 - SWEEP) / 2) a += 360;
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
