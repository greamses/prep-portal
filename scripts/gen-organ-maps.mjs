/* Generates data/vocab/organs/{brain,ear,skin}.js — the individual organ maps,
   where the game lights ONE PART of an organ and you name it (the whole-body
   map names the organs; these name the parts inside one).

   The HEART is NOT here — it is sourced from a detailed Wikimedia diagram by
   scripts/gen-heart-map.mjs (CC-BY-SA). Do not re-add it here or this generator
   will overwrite that sourced file with a schematic.

   These are HAND-AUTHORED schematics, not traced from a source: clean textbook-
   style diagrams composed here from drawing primitives (blob / tube / band /
   spiral). That is deliberate — a "name the part" quiz wants a clear, evenly
   segmented diagram far more than a photoreal one, and composing from
   primitives is both more reliable than hand-writing bezier coordinates and
   trivial to nudge. No source artwork means no licence to carry.

   Output matches the drawn-map shape (M..L..C..Z paths in a 1000-wide box), so
   the existing map renderer draws them with no new code. Each file exports
   MAP_W/MAP_H, PARTS ({name,hint,cx,cy,d}) and GAME_PARTS ({w,d,part}).

   Re-run any time (no deps):  node scripts/gen-organ-maps.mjs */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'organs');
mkdirSync(OUT_DIR, { recursive: true });

const r1 = (v) => {
  const s = v.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
};
const P = (x, y) => `${r1(x)},${r1(y)}`;

// ── Drawing primitives (all return an absolute-path `d` string) ───────────
const ellipse = (cx, cy, rx, ry) =>
  `M${P(cx - rx, cy)}A${r1(rx)},${r1(ry)} 0 1,0 ${P(cx + rx, cy)}A${r1(rx)},${r1(ry)} 0 1,0 ${P(cx - rx, cy)}Z`;
const circle = (cx, cy, r) => ellipse(cx, cy, r, r);

// Catmull-Rom through the points, emitted as a closed cubic-bezier path.
function smoothClosed(pts) {
  const n = pts.length;
  let d = `M${P(pts[0][0], pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${P(c1[0], c1[1])} ${P(c2[0], c2[1])} ${P(p2[0], p2[1])}`;
  }
  return d + 'Z';
}

// An organic rounded blob: an ellipse whose radius breathes with angle.
function blob(cx, cy, rx, ry, { n = 30, amp = 0.06, freq = 3, phase = 0 } = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    const k = 1 + amp * Math.sin(freq * a + phase);
    pts.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]);
  }
  return smoothClosed(pts);
}

// A rounded rectangle.
function roundRect(x, y, w, h, r) {
  return `M${P(x + r, y)}L${P(x + w - r, y)}Q${P(x + w, y)} ${P(x + w, y + r)}`
    + `L${P(x + w, y + h - r)}Q${P(x + w, y + h)} ${P(x + w - r, y + h)}`
    + `L${P(x + r, y + h)}Q${P(x, y + h)} ${P(x, y + h - r)}`
    + `L${P(x, y + r)}Q${P(x, y)} ${P(x + r, y)}Z`;
}

// A horizontal layer with gently wavy top and bottom edges (skin strata).
function band(x, w, yTop, yBot, { amp = 7, freq = 2.5, phase = 0 } = {}) {
  const steps = 44;
  let d = `M${P(x, yTop)}`;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    d += `L${P(x + w * t, yTop + amp * Math.sin(freq * Math.PI * 2 * t + phase))}`;
  }
  d += `L${P(x + w, yBot)}`;
  for (let i = steps - 1; i >= 0; i--) {
    const t = i / steps;
    d += `L${P(x + w * t, yBot + amp * 0.6 * Math.sin(freq * Math.PI * 2 * t + phase + 1))}`;
  }
  return d + 'Z';
}

// A filled tube of constant half-width along a polyline (vessels, ducts, canal).
function tube(pts, half) {
  const n = pts.length;
  const nrm = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
    nrm.push([-dy, dx]);
  }
  const left = pts.map((p, i) => [p[0] + nrm[i][0] * half, p[1] + nrm[i][1] * half]);
  const right = pts.map((p, i) => [p[0] - nrm[i][0] * half, p[1] - nrm[i][1] * half]);
  let d = `M${P(left[0][0], left[0][1])}`;
  for (let i = 1; i < n; i++) d += `L${P(left[i][0], left[i][1])}`;
  for (let i = n - 1; i >= 0; i--) d += `L${P(right[i][0], right[i][1])}`;
  return d + 'Z';
}

const poly = (pts, close = true) =>
  `M${pts.map((p) => P(p[0], p[1])).join('L')}${close ? 'Z' : ''}`;

// A spiral tube — the cochlea.
function spiral(cx, cy, rMax, turns, half) {
  const steps = Math.round(turns * 28);
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * 2 * Math.PI;
    const r = rMax * (1 - 0.72 * t);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return tube(pts, half);
}

// A tube bent along an arc (great-vessel arches, semicircular canal).
function arcTube(cx, cy, r, a0, a1, half, steps = 24) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (a1 - a0) * (i / steps);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return tube(pts, half);
}
const D2R = (d) => (d * Math.PI) / 180;

// ═══════════════════════════════════════════════════════════════════════
// Each organ: box + parts. A part is { name, hint, at:[cx,cy], d, grade? }.
// `at` is the locator-ring anchor. grade is optional per-part tiering (unused
// for now — the topic's own grade band gates the whole organ).
// ═══════════════════════════════════════════════════════════════════════
const ORGANS = {};

// ── SKIN ── a cross-section: three strata, a hair in its follicle, the two
//    glands, a capillary loop and a nerve ending. The easiest to read.
ORGANS.skin = {
  file: 'skin', label: 'The Skin', w: 1000, h: 720,
  parts: [
    { name: 'epidermis', fill: '#f2caa4', hint: 'The thin outer layer you can see and touch; it waterproofs the body.',
      at: [720, 128], d: band(30, 940, 85, 178, { amp: 9, freq: 2.5 }) },
    { name: 'dermis', fill: '#e8a6a2', hint: 'The thicker inner layer holding the hair roots, glands and blood vessels.',
      at: [780, 300], d: band(30, 940, 178, 430, { amp: 5, freq: 2 }) },
    { name: 'fatty layer', fill: '#f4e2a0', hint: 'The deepest layer, padding and insulating the body with stored fat.',
      at: [230, 560], d: band(30, 940, 430, 655, { amp: 5, freq: 1.5 }) },
    { name: 'hair', fill: '#8a5a38', hint: 'The thread of dead cells that grows up out of the skin.',
      at: [300, 45], d: tube([[300, 12], [301, 90], [300, 190], [299, 300], [300, 360]], 8) },
    { name: 'hair follicle', fill: '#d8b088', hint: 'The pocket in the skin that anchors and grows a single hair.',
      at: [300, 395], d: tube([[300, 96], [300, 200], [300, 320], [300, 400], [300, 415]], 26) },
    { name: 'oil gland', fill: '#e6b23e', hint: 'A small gland on the follicle that oils the hair and skin.',
      at: [392, 250], d: blob(378, 250, 46, 34, { amp: 0.18, freq: 3 }) },
    { name: 'sweat gland', fill: '#c2a6d6', hint: 'A deep coiled gland that pushes salty water up to cool you.',
      at: [660, 585], d: blob(660, 580, 58, 46, { amp: 0.22, freq: 5 })
        + tube([[648, 545], [660, 430], [648, 300], [656, 178], [648, 90]], 8) },
    { name: 'blood vessel', fill: '#d25454', hint: 'A tube carrying blood to feed the living skin.',
      at: [852, 470], d: tube([[820, 178], [822, 360], [826, 540], [860, 560], [872, 540], [868, 360], [864, 178]], 9) },
    { name: 'nerve', fill: '#6082c8', hint: 'A fibre that carries the feeling of touch, heat and pain to the brain.',
      at: [168, 250], d: tube([[150, 430], [158, 320], [166, 220], [170, 150]], 8) + circle(170, 145, 20) },
  ],
};

// ── HEART lives in gen-heart-map.mjs, BRAIN in gen-brain-map.mjs — both are
//    sourced from Wikimedia. Only the two hand-authored organs remain here. ──

// ── EAR ── cross-section, outer ear on the left through to the nerve on the
//    right: pinna, canal, eardrum, ossicles, semicircular canals, cochlea,
//    Eustachian tube and auditory nerve.
ORGANS.ear = {
  file: 'ear', label: 'The Ear', w: 1000, h: 780,
  parts: [
    { name: 'pinna', fill: '#f0c8a8', hint: 'The flap of skin and cartilage on the head that funnels sound in.',
      at: [140, 400], d: smoothClosed([[70, 250], [180, 200], [250, 300], [235, 430], [255, 520], [150, 560], [80, 470], [95, 360]]) },
    { name: 'ear canal', fill: '#e6b48c', hint: 'The tube that carries sound from the outer ear to the eardrum.',
      at: [360, 398], d: tube([[236, 400], [320, 398], [430, 402], [468, 405]], 42) },
    { name: 'eardrum', fill: '#efd6a0', hint: 'The tight membrane that vibrates when sound waves hit it.',
      at: [492, 405], d: poly([[478, 352], [500, 360], [502, 452], [480, 460]]) },
    { name: 'ossicles', fill: '#f0ead6', hint: 'The three tiniest bones in the body; they pass on the vibration.',
      at: [560, 360], d: tube([[512, 388], [548, 330], [590, 348], [612, 400]], 15)
        + circle(548, 330, 20) + circle(600, 372, 18) },
    { name: 'semicircular canals', fill: '#8ccaca', hint: 'The three looping tubes that sense balance and turning.',
      at: [700, 250], d: arcTube(700, 250, 78, D2R(120), D2R(430), 16) },
    { name: 'cochlea', fill: '#e6a6b6', hint: 'The coiled tube that turns vibration into nerve signals for sound.',
      at: [700, 505], d: spiral(700, 505, 92, 2.4, 17) },
    { name: 'Eustachian tube', fill: '#ecc898', hint: 'The tube linking the middle ear to the throat to balance pressure.',
      at: [660, 620], d: tube([[588, 452], [640, 540], [720, 640], [780, 690]], 22) },
    { name: 'auditory nerve', fill: '#ecd45e', hint: 'The nerve carrying sound signals from the ear to the brain.',
      at: [852, 470], d: tube([[772, 500], [840, 486], [930, 470]], 20) + circle(772, 505, 22) },
  ],
};

// ── Emit ──────────────────────────────────────────────────────────────────
function emit(spec) {
  const rows = spec.parts.map((p) => {
    if (!/^[A-Za-z][A-Za-z '-]*$/.test(p.name)) throw new Error(`odd part name: ${p.name}`);
    if (p.hint.toLowerCase().includes(p.name.toLowerCase())) throw new Error(`clue names itself: ${p.name}`);
    if (!p.fill) throw new Error(`no fill colour for ${p.name}`);
    return `  [${JSON.stringify(p.name)}, ${JSON.stringify(p.hint)}, ${JSON.stringify(p.fill)}, ${r1(p.at[0])}, ${r1(p.at[1])}, ${JSON.stringify(p.d)}],`;
  }).join('\n');

  // A duplicate outline would put one figure on the board with two answers.
  const seen = new Map();
  for (const p of spec.parts) {
    if (seen.has(p.d)) throw new Error(`${p.name} draws the same path as ${seen.get(p.d)}`);
    seen.set(p.d, p.name);
  }

  const out = `/* ═══════════════════════════════════════════════════════
   MAP OF ${spec.label.toUpperCase()} — a hand-authored schematic, generated by
   scripts/gen-organ-maps.mjs. The game lights ONE part and you name it. Same
   drawn shape as the maps (M..L..C..Z paths in a ${spec.w}-wide box), so the
   map renderer draws it with no new code. No source artwork, so no licence.

   Each row: [name, hint, fill, cx, cy, path]. \`fill\` is the part's natural
   colour; cx/cy anchor the locator ring. This file is LAZY-LOADED — never
   import it statically from index.js.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${spec.w};
export const MAP_H = ${spec.h};

const RAW = [
${rows}
];

export const PARTS = RAW.map(([name, hint, fill, cx, cy, d]) => ({ name, hint, fill, cx, cy, d }));

// Shaped like any other topic's words: the part's NAME is the word, its
// description is the clue, and \`part\` carries the drawing the game lights up.
export const GAME_PARTS = PARTS.map((c) => ({ w: c.name, d: c.hint, part: c }));
`;
  writeFileSync(join(OUT_DIR, `${spec.file}.js`), out);
  console.log(`  ${spec.file}.js — ${spec.parts.length} parts, ${spec.w}×${spec.h}`);
}

console.log('organ maps:');
for (const key of Object.keys(ORGANS)) emit(ORGANS[key]);
