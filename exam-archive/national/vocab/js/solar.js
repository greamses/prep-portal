/* ═══════════════════════════════════════════════════════
   THE SOLAR SYSTEM (2D) — the drawer.

   Builds the whole system as one crafted <svg>: a faint starfield, elliptical
   orbits, and every body — the Sun (glowing), the planets (Jupiter and Saturn
   banded, Jupiter with its Great Red Spot, Earth with oceans and land, Saturn
   with its ring), the Moon, the asteroid and Kuiper belts, the dwarf planets, a
   comet with a Sun-averted tail, and the meteoroid→meteor→meteorite trio. Pure
   presentation — the geometry and hints come in as `bodies`
   (data/vocab/space/solar-system.js), so the game clue and the study view share
   one picture.

   buildSolarSvg(bodies, { focus, labels, reveal }):
     focus  — a body key to spotlight (others dim, a locator ring pulses on it);
              null shows every body at full strength (the study view).
     labels — draw each body's name beneath it (the study view).
     reveal — tag each body so the study view can name it on hover (never the clue).
═══════════════════════════════════════════════════════ */
import { MAP_W, MAP_H } from '/data/vocab/space/solar-system.js';

const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}) {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

// Deterministic little PRNG so the starfield and belts are the same every render.
function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A lit-from-the-Sun radial gradient (light focus up-and-left, toward the Sun).
function discGradient(defs, id, lit, shadow) {
  const g = el('radialGradient', { id, cx: '0.35', cy: '0.36', r: '0.75' });
  g.append(el('stop', { offset: '0', 'stop-color': lit }), el('stop', { offset: '1', 'stop-color': shadow }));
  defs.appendChild(g);
  return `url(#${id})`;
}

function starfield() {
  const g = el('g', { class: 'vocab-solar-stars' });
  const rnd = mulberry(1988);
  for (let i = 0; i < 140; i++) {
    const x = rnd() * MAP_W, y = rnd() * MAP_H, r = rnd() * 0.9 + 0.3;
    g.appendChild(el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(2),
      fill: '#ffffff', opacity: (rnd() * 0.5 + 0.25).toFixed(2) }));
  }
  return g;
}

// A closed, irregular "blob" — a wobbly ellipse (Jupiter's Great Red Spot is a
// storm, not a neat oval). Smooth quadratic segments through jittered points.
function blobPath(cx, cy, rx, ry, seed, jitter = 0.22) {
  const rnd = mulberry(seed);
  const n = 9, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (rnd() - 0.5) * 2 * jitter;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const mid = (i) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
  const m0 = mid(n - 1);
  let d = `M ${m0[0].toFixed(1)} ${m0[1].toFixed(1)} `;
  for (let i = 0; i < n; i++) {
    const m = mid(i);
    d += `Q ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)} `;
  }
  return d + 'Z';
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

// The shaded disc + rim shadow common to every round body. `craters` pocks a
// rocky one (asteroid, meteoroid, meteorite).
function shadedDisc(defs, g, b, craters = 0) {
  const clip = `clip-${b.key}`;
  const cp = el('clipPath', { id: clip });
  cp.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: b.r }));
  defs.appendChild(cp);
  g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: b.r, fill: discGradient(defs, `g-${b.key}`, b.c[0], b.c[1]) }));
  if (craters) {
    const rnd = mulberry(b.cx * 31 + b.cy);
    const cg = el('g', { 'clip-path': `url(#${clip})`, fill: 'rgba(0,0,0,0.22)' });
    for (let i = 0; i < craters; i++) {
      cg.appendChild(el('circle', { cx: (b.cx + (rnd() - 0.5) * b.r * 1.2).toFixed(1),
        cy: (b.cy + (rnd() - 0.5) * b.r * 1.2).toFixed(1), r: (b.r * (0.12 + rnd() * 0.18)).toFixed(1) }));
    }
    g.appendChild(cg);
  }
  g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: b.r, fill: 'none',
    stroke: 'rgba(0,0,0,0.28)', 'stroke-width': Math.max(1, b.r * 0.12) }));
  return clip;
}

// Saturn's ring — a FLAT plane of icy rocks seen at a tilt: a shallow, rolled
// annulus (thin top-to-bottom, its real width running front-to-back into the
// plane). Returns the two halves separately so the far one sits behind the
// planet and the near one in front.
function saturnRing(b, which) {
  const g = el('g');
  const inner = b.r * 1.3, outer = b.r * 2.15, flat = 0.32, deg = -16;
  const th = deg * Math.PI / 180, cos = Math.cos(th), sin = Math.sin(th);
  const rnd = mulberry(b.cx * 13 + (which === 'front' ? 1 : 2));
  // Sweep the angle evenly (with a little jitter) so the ring is dense and even
  // all the way round, not randomly clumped.
  const N = 460;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + (rnd() - 0.5) * 0.09;
    // local lower half (sin>0) is the near side once rolled — the front.
    if ((which === 'front') !== (Math.sin(a) > 0)) continue;
    const rad = inner + rnd() * (outer - inner);
    const lx = rad * Math.cos(a), ly = rad * flat * Math.sin(a);
    const x = b.cx + lx * cos - ly * sin, y = b.cy + lx * sin + ly * cos;
    g.appendChild(el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (0.5 + rnd() * 0.9).toFixed(2),
      fill: rnd() < 0.32 ? '#f0e2bd' : '#cbb182', opacity: (0.55 + rnd() * 0.4).toFixed(2) }));
  }
  return g;
}

// A belt: a flattened ring of little rocks scattered between two orbital radii,
// centred on the Sun (like the faint orbit ellipses).
function drawBelt(g, b, sun) {
  const icy = b.key === 'kuiper-belt';
  const rnd = mulberry(b.inner * 7 + b.outer);
  const dots = icy ? 150 : 130;
  for (let i = 0; i < dots; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = b.inner + rnd() * (b.outer - b.inner);
    const x = sun.cx + rad * Math.cos(a);
    const y = sun.cy + rad * 0.26 * Math.sin(a);
    g.appendChild(el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (0.7 + rnd() * 1.4).toFixed(2),
      fill: icy ? '#a9c2d6' : '#b6a891', opacity: (0.5 + rnd() * 0.4).toFixed(2) }));
  }
}

// A comet: an icy head and a soft tail pointing straight away from the Sun.
function drawComet(defs, g, b, sun) {
  let dx = b.cx - sun.cx, dy = b.cy - sun.cy;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;                 // unit vector, Sun → comet (the tail way)
  const px = -dy, py = dx;              // perpendicular
  const L = 118, w0 = b.r * 0.9, wL = b.r * 2.2;
  const tipx = b.cx + dx * L, tipy = b.cy + dy * L;
  const gid = `comet-tail-${b.key}`;
  const lg = el('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse',
    x1: b.cx, y1: b.cy, x2: tipx, y2: tipy });
  lg.append(
    el('stop', { offset: '0', 'stop-color': '#cfeeff', 'stop-opacity': '0.85' }),
    el('stop', { offset: '1', 'stop-color': '#7fb4ff', 'stop-opacity': '0' }),
  );
  defs.appendChild(lg);
  g.appendChild(el('path', {
    d: `M ${(b.cx + px * w0).toFixed(1)} ${(b.cy + py * w0).toFixed(1)}`
      + ` L ${(tipx + px * wL).toFixed(1)} ${(tipy + py * wL).toFixed(1)}`
      + ` L ${(tipx - px * wL).toFixed(1)} ${(tipy - py * wL).toFixed(1)}`
      + ` L ${(b.cx - px * w0).toFixed(1)} ${(b.cy - py * w0).toFixed(1)} Z`,
    fill: `url(#${gid})`,
  }));
  // glowing head
  const hid = `comet-head-${b.key}`;
  const rg = el('radialGradient', { id: hid, cx: '0.5', cy: '0.5', r: '0.5' });
  rg.append(
    el('stop', { offset: '0', 'stop-color': '#ffffff', 'stop-opacity': '0.95' }),
    el('stop', { offset: '1', 'stop-color': '#bfe4ff', 'stop-opacity': '0' }),
  );
  defs.appendChild(rg);
  g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: b.r * 2, fill: `url(#${hid})` }));
  g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: b.r * 0.75, fill: '#eafaff' }));
}

// A meteor: a bright shooting-star streak from (cx,cy) to `to`, head leading.
function drawMeteor(defs, g, b) {
  const [tx, ty] = b.to;
  const gid = `meteor-${b.key}`;
  const lg = el('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse', x1: b.cx, y1: b.cy, x2: tx, y2: ty });
  lg.append(
    el('stop', { offset: '0', 'stop-color': '#fff2c2', 'stop-opacity': '0' }),
    el('stop', { offset: '1', 'stop-color': '#ffd75e', 'stop-opacity': '0.95' }),
  );
  defs.appendChild(lg);
  g.appendChild(el('line', { x1: b.cx, y1: b.cy, x2: tx, y2: ty, stroke: `url(#${gid})`,
    'stroke-width': '3.2', 'stroke-linecap': 'round' }));
  g.appendChild(el('circle', { cx: tx, cy: ty, r: b.r, fill: '#fff6d5' }));
  g.appendChild(el('circle', { cx: tx, cy: ty, r: b.r * 0.55, fill: '#fff' }));
}

function drawBody(defs, b, reveal, sun) {
  const g = el('g', { class: 'vocab-solar-body', 'data-key': b.key });
  if (reveal) g.setAttribute('data-tip', b.hint ? `${b.name} — ${b.hint}` : b.name);

  if (b.type === 'sun') {
    const R = b.r;
    // Corona — a wide, soft, centred glow (a star radiates from its middle, it
    // is not a ball lit from one side).
    const cid = `sun-corona-${b.key}`;
    const cg = el('radialGradient', { id: cid, cx: '0.5', cy: '0.5', r: '0.5' });
    cg.append(
      el('stop', { offset: '0', 'stop-color': '#fff6c8', 'stop-opacity': '0.9' }),
      el('stop', { offset: '0.32', 'stop-color': '#ffcf5c', 'stop-opacity': '0.5' }),
      el('stop', { offset: '0.6', 'stop-color': '#ff9b2e', 'stop-opacity': '0.2' }),
      el('stop', { offset: '1', 'stop-color': '#ff7d1e', 'stop-opacity': '0' }),
    );
    defs.appendChild(cg);
    g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: R * 2.5, fill: `url(#${cid})`, class: 'vocab-solar-sunglow' }));
    // Disc — a hot white core dimming to a warm orange limb (limb darkening).
    const did = `sun-disc-${b.key}`;
    const dg = el('radialGradient', { id: did, cx: '0.5', cy: '0.5', r: '0.5' });
    dg.append(
      el('stop', { offset: '0', 'stop-color': '#fffdf3' }),
      el('stop', { offset: '0.42', 'stop-color': '#ffef9e' }),
      el('stop', { offset: '0.75', 'stop-color': '#ffc23c' }),
      el('stop', { offset: '0.93', 'stop-color': '#ff9526' }),
      el('stop', { offset: '1', 'stop-color': '#ef7314' }),
    );
    defs.appendChild(dg);
    const clip = `clip-${b.key}`;
    const cp = el('clipPath', { id: clip });
    cp.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: R }));
    defs.appendChild(cp);
    g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: R, fill: `url(#${did})` }));
    // Granulation — organic fractal-noise mottle, tinted warm, laid over the
    // disc so the surface roils like plasma instead of reading as smooth paint.
    const fid = `sun-gran-${b.key}`;
    const f = el('filter', { id: fid, x: '-10%', y: '-10%', width: '120%', height: '120%' });
    const turb = el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.06 0.09', numOctaves: '5', seed: '7', stitchTiles: 'stitch', result: 'n' });
    const ct = el('feComponentTransfer', { in: 'n', result: 'n2' });
    ct.appendChild(el('feFuncA', { type: 'gamma', amplitude: '1', exponent: '1.9', offset: '0' }));
    const cm = el('feColorMatrix', { in: 'n2', type: 'matrix',
      values: '0 0 0 0 1  0 0 0 0 0.46  0 0 0 0 0.06  0 0 0 1 0' });
    f.append(turb, ct, cm);
    defs.appendChild(f);
    g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: R, fill: '#000', 'clip-path': `url(#${clip})`,
      filter: `url(#${fid})`, opacity: '0.5', style: 'mix-blend-mode:overlay' }));
    // A bright, hot core.
    const hid = `sun-core-${b.key}`;
    const hg = el('radialGradient', { id: hid, cx: '0.5', cy: '0.5', r: '0.5' });
    hg.append(el('stop', { offset: '0', 'stop-color': '#fffef7', 'stop-opacity': '0.7' }),
      el('stop', { offset: '1', 'stop-color': '#fffef7', 'stop-opacity': '0' }));
    defs.appendChild(hg);
    g.appendChild(el('circle', { cx: b.cx, cy: b.cy, r: R * 0.62, fill: `url(#${hid})` }));
    return g;
  }
  if (b.type === 'belt') { drawBelt(g, b, sun); return g; }
  if (b.type === 'comet') { drawComet(defs, g, b, sun); return g; }
  if (b.type === 'meteor') { drawMeteor(defs, g, b); return g; }
  if (b.type === 'meteorite') {
    // a rock resting on a little ground arc, with a puff of dust
    g.appendChild(el('path', { d: `M ${b.cx - 26} ${b.cy + b.r + 2} Q ${b.cx} ${b.cy + b.r - 6} ${b.cx + 26} ${b.cy + b.r + 2}`,
      fill: 'none', stroke: 'rgba(150,120,90,0.55)', 'stroke-width': '2.5', 'stroke-linecap': 'round' }));
    shadedDisc(defs, g, b, 3);
    return g;
  }
  if (b.type === 'meteoroid' || b.type === 'rock') { shadedDisc(defs, g, b, 3); return g; }

  // ── the round discs: rocky / earth / gas / ice / moon / dwarf ──
  let frontRing = null;
  if (b.ring) {
    g.appendChild(saturnRing(b, 'back')); // far half — behind the planet
    frontRing = saturnRing(b, 'front');   // near half — over the planet (added last)
  }

  const clip = shadedDisc(defs, g, b);

  if (b.type === 'earth') {
    const land = el('g', { 'clip-path': `url(#${clip})`, fill: '#4f9d5a' });
    land.append(
      el('ellipse', { cx: b.cx - b.r * 0.3, cy: b.cy - b.r * 0.2, rx: b.r * 0.4, ry: b.r * 0.28, transform: `rotate(20 ${b.cx} ${b.cy})` }),
      el('ellipse', { cx: b.cx + b.r * 0.35, cy: b.cy + b.r * 0.3, rx: b.r * 0.3, ry: b.r * 0.42, transform: `rotate(-15 ${b.cx} ${b.cy})` }),
      el('ellipse', { cx: b.cx + b.r * 0.1, cy: b.cy - b.r * 0.5, rx: b.r * 0.22, ry: b.r * 0.16 }),
    );
    g.appendChild(land);
    g.appendChild(el('ellipse', { cx: b.cx - b.r * 0.1, cy: b.cy + b.r * 0.05, rx: b.r * 0.7, ry: b.r * 0.16,
      fill: '#ffffff', opacity: '0.3', 'clip-path': `url(#${clip})`, transform: `rotate(-10 ${b.cx} ${b.cy})` }));
  }
  if (b.type === 'gas') {
    g.appendChild(bands(clip, b.cx, b.cy, b.r, b.ring
      ? ['#e7d3a0', '#c9a866', '#f2e3ba', '#cdae70', '#e7d3a0']
      : ['#d8b483', '#efdcbc', '#c69a64', '#e3c99f', '#b98a58', '#e9d6b2']));
    if (b.spot) {
      const scx = b.cx + b.r * 0.28, scy = b.cy + b.r * 0.28;
      const spot = el('g', { 'clip-path': `url(#${clip})`, transform: `rotate(-8 ${b.cx} ${b.cy})` });
      spot.append(
        el('path', { d: blobPath(scx, scy, b.r * 0.27, b.r * 0.17, 71, 0.24), fill: '#a8492f', opacity: '0.9' }),
        el('path', { d: blobPath(scx, scy, b.r * 0.17, b.r * 0.1, 88, 0.28), fill: '#d07a4e', opacity: '0.8' }),
      );
      g.appendChild(spot);
    }
  }
  if (frontRing) g.appendChild(frontRing);
  return g;
}

// Which bodies get a drawn orbit ring — the eight planets only (the belts show
// their own rock ring; dwarfs/comet/meteors would only clutter).
const ORBITED = new Set(['rocky', 'earth', 'gas', 'ice']);

export function buildSolarSvg(bodies, { focus = null, labels = false, reveal = false } = {}) {
  const svg = el('svg', { class: 'vocab-solar', viewBox: `0 0 ${MAP_W} ${MAP_H}`,
    preserveAspectRatio: 'xMidYMid meet', 'aria-label': 'The solar system — one body is highlighted' });
  const defs = el('defs');
  svg.appendChild(defs);
  svg.appendChild(starfield());

  const sun = bodies.find((b) => b.key === 'sun');
  const orbits = el('g', { class: 'vocab-solar-orbits' });
  for (const b of bodies) {
    if (!ORBITED.has(b.type)) continue;
    const rx = b.cx - sun.cx;
    orbits.append(el('ellipse', { cx: sun.cx, cy: sun.cy, rx, ry: (rx * 0.26).toFixed(1),
      fill: 'none', stroke: 'rgba(150,180,230,0.18)', 'stroke-width': '1' }));
  }
  svg.appendChild(orbits);

  // Every body is drawn at full strength (Sun last so its glow sits over the
  // orbit lines); the spotlight is applied afterwards by setFocus, so the game
  // builds this once per round and only re-focuses per word (no rebuild flicker).
  const order = [...bodies].sort((a, b) => (a.key === 'sun') - (b.key === 'sun'));
  const groups = new Map();
  for (const b of order) {
    const gg = drawBody(defs, b, reveal, sun);
    groups.set(b.key, gg);
    svg.appendChild(gg);
  }

  // The locator ring — one element, repositioned onto the focused body (a point
  // ring makes no sense on a belt: its whole band is the answer, and dimming the
  // rest already makes it read).
  const ring = el('circle', { class: 'vocab-solar-ring', fill: 'none', visibility: 'hidden' });
  svg.appendChild(ring);

  if (labels) {
    const lg = el('g', { class: 'vocab-solar-labels' });
    for (const b of bodies) {
      const y = b.type === 'meteor' ? b.to[1] + 16 : b.cy + b.r + 16;
      const t = el('text', { x: b.type === 'meteor' ? b.to[0] : b.cx, y: y.toFixed(1), 'text-anchor': 'middle' });
      t.textContent = b.name;
      lg.appendChild(t);
    }
    svg.appendChild(lg);
  }

  // Spotlight one body (dim the rest, ring the target); null clears it.
  svg.setFocus = (key) => {
    for (const [k, gg] of groups) gg.setAttribute('opacity', !key || k === key ? '1' : '0.2');
    const b = key ? bodies.find((x) => x.key === key) : null;
    if (b && b.type !== 'belt') {
      ring.setAttribute('cx', b.cx); ring.setAttribute('cy', b.cy);
      ring.setAttribute('r', (b.r + Math.max(10, b.r * 0.5)).toFixed(1));
      ring.setAttribute('visibility', 'visible');
    } else ring.setAttribute('visibility', 'hidden');
  };
  if (focus) svg.setFocus(focus);
  return svg;
}
