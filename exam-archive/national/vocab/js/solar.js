/* ═══════════════════════════════════════════════════════
   THE SOLAR SYSTEM (2D) — the drawer.

   Builds the whole system as one crafted <svg>: a faint starfield, elliptical
   orbits, and each body as a gradient-shaded disc (the Sun glows; Jupiter and
   Saturn carry bands; Jupiter its Great Red Spot; Earth its oceans and land;
   Saturn its ring, correctly passing behind the planet at the top and in front
   at the bottom). Pure presentation — the geometry and hints come in as `bodies`
   (data/vocab/space/solar-system.js), so both the game clue and the study view
   share one picture.

   buildSolarSvg(bodies, { focus, labels }):
     focus  — a body key to spotlight (others dim, a locator ring pulses on it);
              null shows every body at full strength (the study view).
     labels — draw each body's name beneath it (the study view).
═══════════════════════════════════════════════════════ */
const NS = 'http://www.w3.org/2000/svg';
const VIEW_W = 1000, VIEW_H = 560;

function el(name, attrs = {}) {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

// A lit-from-the-Sun radial gradient (light focus up-and-left, toward the Sun).
function discGradient(defs, id, lit, shadow) {
  const g = el('radialGradient', { id, cx: '0.35', cy: '0.36', r: '0.75' });
  g.append(
    el('stop', { offset: '0', 'stop-color': lit }),
    el('stop', { offset: '1', 'stop-color': shadow }),
  );
  defs.appendChild(g);
  return `url(#${id})`;
}

// Deterministic little PRNG so the starfield is the same every render.
function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function starfield() {
  const g = el('g', { class: 'vocab-solar-stars' });
  const rnd = mulberry(1988);
  for (let i = 0; i < 120; i++) {
    const x = rnd() * VIEW_W, y = rnd() * VIEW_H, r = rnd() * 0.9 + 0.3;
    g.appendChild(el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(2),
      fill: '#ffffff', opacity: (rnd() * 0.5 + 0.25).toFixed(2) }));
  }
  return g;
}

// Horizontal bands (Jupiter / Saturn), clipped to the disc.
function bands(clip, cx, cy, r, tones) {
  const g = el('g', { 'clip-path': `url(#${clip})` });
  const rows = tones.length;
  for (let i = 0; i < rows; i++) {
    const yy = cy - r + (i + 0.5) * (2 * r / rows);
    g.appendChild(el('ellipse', { cx, cy: yy.toFixed(1), rx: r, ry: (r / rows * 0.75).toFixed(1),
      fill: tones[i], opacity: '0.55' }));
  }
  return g;
}

function drawBody(defs, b, focus, reveal) {
  const g = el('g', { class: 'vocab-solar-body', 'data-key': b.key });
  if (focus && b.key !== focus) g.setAttribute('opacity', '0.28');
  // Only the study view reveals names on hover — never the clue, or hovering
  // would hand you every answer.
  if (reveal) g.setAttribute('data-tip', b.hint ? `${b.name} — ${b.hint}` : b.name);
  const gid = discGradient(defs, `g-${b.key}`, b.c[0], b.c[1]);

  if (b.type === 'sun') {
    // A soft glow halo, then the disc.
    const hid = `glow-${b.key}`;
    const rg = el('radialGradient', { id: hid, cx: '0.5', cy: '0.5', r: '0.5' });
    rg.append(
      el('stop', { offset: '0', 'stop-color': '#ffd15a', 'stop-opacity': '0.85' }),
      el('stop', { offset: '0.55', 'stop-color': '#ff9b2e', 'stop-opacity': '0.35' }),
      el('stop', { offset: '1', 'stop-color': '#ff8a1e', 'stop-opacity': '0' }),
    );
    defs.appendChild(rg);
    g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: b.r * 2.1, fill: `url(#${hid})` }));
    g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: b.r, fill: gid }));
    g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: b.r, fill: '#fff', opacity: '0.12' }));
    return g;
  }

  const clip = `clip-${b.key}`;
  const cp = el('clipPath', { id: clip });
  cp.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: b.r }));
  defs.appendChild(cp);

  // Saturn's ring — behind the planet at the top, in front at the bottom.
  let frontRing = null;
  if (b.ring) {
    const rid = `ring-${b.key}`;
    const rg = el('linearGradient', { id: rid, x1: '0', y1: '0', x2: '1', y2: '0' });
    rg.append(
      el('stop', { offset: '0', 'stop-color': '#c9b072', 'stop-opacity': '0' }),
      el('stop', { offset: '0.18', 'stop-color': '#efdcae', 'stop-opacity': '0.9' }),
      el('stop', { offset: '0.5', 'stop-color': '#cdb478', 'stop-opacity': '0.55' }),
      el('stop', { offset: '0.82', 'stop-color': '#efdcae', 'stop-opacity': '0.9' }),
      el('stop', { offset: '1', 'stop-color': '#c9b072', 'stop-opacity': '0' }),
    );
    defs.appendChild(rg);
    const mkRing = () => el('ellipse', { cx: b.cx, cy: b.cy, rx: b.r * 2.05, ry: b.r * 0.62,
      fill: 'none', stroke: `url(#${rid})`, 'stroke-width': b.r * 0.5,
      transform: `rotate(-17 ${b.cx} ${b.cy})` });
    g.appendChild(mkRing()); // back half (planet drawn over it next)
    // Front half: the same ring, clipped to below the planet's centre.
    const halfClip = `ringfront-${b.key}`;
    const hc = el('clipPath', { id: halfClip });
    hc.appendChild(el('rect', { x: b.cx - b.r * 2.4, y: b.cy, width: b.r * 4.8, height: b.r * 2 }));
    defs.appendChild(hc);
    frontRing = el('g', { 'clip-path': `url(#${halfClip})` });
    frontRing.appendChild(mkRing());
  }

  g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: b.r, fill: gid }));

  if (b.type === 'earth') {
    const land = el('g', { 'clip-path': `url(#${clip})`, fill: '#4f9d5a' });
    land.append(
      el('ellipse', { cx: b.cx - b.r * 0.3, cy: b.cy - b.r * 0.2, rx: b.r * 0.4, ry: b.r * 0.28, transform: `rotate(20 ${b.cx} ${b.cy})` }),
      el('ellipse', { cx: b.cx + b.r * 0.35, cy: b.cy + b.r * 0.3, rx: b.r * 0.3, ry: b.r * 0.42, transform: `rotate(-15 ${b.cx} ${b.cy})` }),
      el('ellipse', { cx: b.cx + b.r * 0.1, cy: b.cy - b.r * 0.5, rx: b.r * 0.22, ry: b.r * 0.16 }),
    );
    g.appendChild(land);
    // a wisp of cloud
    g.appendChild(el('ellipse', { cx: b.cx - b.r * 0.1, cy: b.cy + b.r * 0.05, rx: b.r * 0.7, ry: b.r * 0.16,
      fill: '#ffffff', opacity: '0.3', 'clip-path': `url(#${clip})`, transform: `rotate(-10 ${b.cx} ${b.cy})` }));
  }
  if (b.type === 'gas') {
    g.appendChild(bands(clip, b.cx, b.cy, b.r, b.ring
      ? ['#e7d3a0', '#c9a866', '#f2e3ba', '#cdae70', '#e7d3a0']
      : ['#d8b483', '#efdcbc', '#c69a64', '#e3c99f', '#b98a58', '#e9d6b2']));
    if (b.spot) {
      g.appendChild(el('ellipse', { cx: b.cx + b.r * 0.28, cy: b.cy + b.r * 0.28, rx: b.r * 0.22, ry: b.r * 0.14,
        fill: '#b5533a', opacity: '0.85', 'clip-path': `url(#${clip})`, transform: `rotate(-8 ${b.cx} ${b.cy})` }));
    }
  }
  // A rim shadow gives every disc a little more roundness.
  g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: b.r, fill: 'none',
    stroke: 'rgba(0,0,0,0.28)', 'stroke-width': Math.max(1, b.r * 0.12) }));
  if (frontRing) g.appendChild(frontRing);
  return g;
}

export function buildSolarSvg(bodies, { focus = null, labels = false, reveal = false } = {}) {
  const svg = el('svg', { class: 'vocab-solar', viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    'aria-label': 'The solar system — one body is highlighted' });
  const defs = el('defs');
  svg.appendChild(defs);
  svg.appendChild(starfield());

  const sun = bodies.find((b) => b.key === 'sun');
  // Orbits (faint ellipses centred on the Sun).
  const orbits = el('g', { class: 'vocab-solar-orbits' });
  for (const b of bodies) {
    if (b.key === 'sun' || b.satellite) continue;
    const rx = b.cx - sun.cx;
    orbits.append(el('ellipse', { cx: sun.cx, cy: sun.cy, rx, ry: (rx * 0.26).toFixed(1),
      fill: 'none', stroke: 'rgba(150,180,230,0.18)', 'stroke-width': '1' }));
  }
  svg.appendChild(orbits);

  // Bodies, Sun last so its glow sits over the orbit lines.
  const order = [...bodies].sort((a, b) => (a.key === 'sun') - (b.key === 'sun'));
  for (const b of order) svg.appendChild(drawBody(defs, b, focus, reveal));

  // The focus locator ring + label.
  if (focus) {
    const b = bodies.find((x) => x.key === focus);
    if (b) {
      svg.appendChild(el('circle', { class: 'vocab-solar-ring', cx: b.cx, cy: b.cy,
        r: (b.r + Math.max(10, b.r * 0.5)).toFixed(1), fill: 'none' }));
    }
  }
  if (labels) {
    const lg = el('g', { class: 'vocab-solar-labels' });
    for (const b of bodies) {
      const t = el('text', { x: b.cx, y: (b.cy + b.r + 16).toFixed(1), 'text-anchor': 'middle' });
      t.textContent = b.name;
      lg.appendChild(t);
    }
    svg.appendChild(lg);
  }
  return svg;
}
