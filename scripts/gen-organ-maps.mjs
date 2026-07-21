/* Generates data/vocab/organs/{heart,brain,ear,skin}.js — the individual organ
   maps, where the game lights ONE PART of an organ and you name it (the whole-
   body map names the organs; these name the parts inside one).

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
    { name: 'epidermis', hint: 'The thin outer layer you can see and touch; it waterproofs the body.',
      at: [720, 128], d: band(30, 940, 85, 178, { amp: 9, freq: 2.5 }) },
    { name: 'dermis', hint: 'The thicker inner layer holding the hair roots, glands and blood vessels.',
      at: [780, 300], d: band(30, 940, 178, 430, { amp: 5, freq: 2 }) },
    { name: 'fatty layer', hint: 'The deepest layer, padding and insulating the body with stored fat.',
      at: [230, 560], d: band(30, 940, 430, 655, { amp: 5, freq: 1.5 }) },
    { name: 'hair', hint: 'The thread of dead cells that grows up out of the skin.',
      at: [300, 45], d: tube([[300, 12], [301, 90], [300, 190], [299, 300], [300, 360]], 8) },
    { name: 'hair follicle', hint: 'The pocket in the skin that anchors and grows a single hair.',
      at: [300, 395], d: tube([[300, 96], [300, 200], [300, 320], [300, 400], [300, 415]], 26) },
    { name: 'oil gland', hint: 'A small gland on the follicle that oils the hair and skin.',
      at: [392, 250], d: blob(378, 250, 46, 34, { amp: 0.18, freq: 3 }) },
    { name: 'sweat gland', hint: 'A deep coiled gland that pushes salty water up to cool you.',
      at: [660, 585], d: blob(660, 580, 58, 46, { amp: 0.22, freq: 5 })
        + tube([[648, 545], [660, 430], [648, 300], [656, 178], [648, 90]], 8) },
    { name: 'blood vessel', hint: 'A tube carrying blood to feed the living skin.',
      at: [852, 470], d: tube([[820, 178], [822, 360], [826, 540], [860, 560], [872, 540], [868, 360], [864, 178]], 9) },
    { name: 'nerve', hint: 'A fibre that carries the feeling of touch, heat and pain to the brain.',
      at: [168, 250], d: tube([[150, 430], [158, 320], [166, 220], [170, 150]], 8) + circle(170, 145, 20) },
  ],
};

// ── HEART ── anterior view. Standard textbook side convention: the patient's
//    right chambers sit on the VIEWER's left.
ORGANS.heart = {
  file: 'heart', label: 'The Heart', w: 1000, h: 980,
  parts: [
    // The great vessels emerge from the base; the chambers are drawn after, so
    // the vessel roots tuck behind them and read as connected.
    { name: 'superior vena cava', hint: 'The big vein bringing blood down from the head and arms.',
      at: [372, 215], d: tube([[366, 120], [368, 230], [382, 330], [404, 404]], 36) },
    { name: 'aorta', hint: 'The great arched vessel carrying blood out to the whole body.',
      at: [500, 150], d: arcTube(530, 300, 152, D2R(-158), D2R(-18), 36) },
    { name: 'pulmonary artery', hint: 'The vessel taking blood from the heart to the lungs for oxygen.',
      at: [452, 235], d: tube([[468, 368], [452, 270], [440, 196], [414, 150]], 32) },
    { name: 'inferior vena cava', hint: 'The big vein bringing blood up from the lower body.',
      at: [340, 650], d: tube([[338, 700], [346, 610], [364, 556]], 34) },
    // The four chambers TILE: neighbours share an edge (the septum down the
    // middle, the AV groove across) so together they read as one heart, apex
    // at the bottom formed by the left ventricle.
    { name: 'right atrium', hint: 'The upper chamber that receives tired blood returning from the body.',
      at: [398, 460], d: smoothClosed([[330, 405], [505, 352], [505, 560], [300, 548]]) },
    { name: 'left atrium', hint: 'The upper chamber that receives fresh blood back from the lungs.',
      at: [618, 462], d: smoothClosed([[505, 352], [712, 408], [716, 562], [505, 560]]) },
    { name: 'right ventricle', hint: 'The lower chamber that pumps blood to the lungs.',
      at: [406, 700], d: smoothClosed([[300, 548], [505, 560], [556, 838], [430, 892], [330, 768]]) },
    { name: 'left ventricle', hint: 'The strongest chamber; it pumps blood out to the whole body.',
      at: [642, 716], d: smoothClosed([[505, 560], [716, 562], [700, 782], [562, 912], [520, 770]]) },
  ],
};

// ── BRAIN ── left-facing lateral view: the four cerebral lobes, the cerebellum
//    and the brain stem.
ORGANS.brain = {
  file: 'brain', label: 'The Brain', w: 1000, h: 920,
  parts: [
    { name: 'frontal lobe', hint: 'The front of the brain — planning, deciding and voluntary movement.',
      at: [250, 300], d: smoothClosed([[150, 300], [180, 200], [280, 150], [380, 165], [400, 300], [370, 420], [250, 440], [160, 400]]) },
    { name: 'parietal lobe', hint: 'The upper middle — touch, temperature and body position.',
      at: [500, 235], d: smoothClosed([[400, 210], [430, 150], [560, 135], [640, 175], [630, 300], [520, 330], [415, 300]]) },
    { name: 'occipital lobe', hint: 'The very back of the brain — where seeing is understood.',
      at: [720, 340], d: smoothClosed([[640, 200], [740, 210], [812, 300], [790, 420], [680, 450], [625, 360]]) },
    { name: 'temporal lobe', hint: 'The lower side — hearing, and the memory of words.',
      at: [385, 505], d: smoothClosed([[250, 450], [400, 440], [520, 470], [540, 560], [430, 600], [300, 575], [240, 510]]) },
    { name: 'cerebellum', hint: 'The folded ball at the back that keeps movement smooth and balanced.',
      at: [730, 545], d: blob(730, 540, 108, 92, { amp: 0.16, freq: 8 }) },
    // The brain stem, drawn as its three real parts stacked top-to-bottom, then
    // continuing as the spinal cord; the pituitary hangs from the base in front.
    { name: 'midbrain', hint: 'The topmost stalk section, passing on reflexes of sight and sound.',
      at: [548, 598], d: tube([[556, 556], [558, 588], [562, 622]], 34) },
    { name: 'pons', hint: 'The rounded bulge of the stalk that helps drive breathing.',
      at: [588, 664], d: blob(586, 664, 48, 40, { amp: 0.1, freq: 3 }) },
    { name: 'medulla oblongata', hint: 'The lowest stalk part; it runs the heartbeat and breathing.',
      at: [600, 736], d: tube([[588, 700], [594, 734], [600, 766]], 30) },
    { name: 'spinal cord', hint: 'The thick cable of nerves running down from the base into the back.',
      at: [606, 838], d: tube([[600, 766], [604, 818], [608, 882]], 22) },
    { name: 'pituitary gland', hint: 'The pea-sized master gland below the brain, steering the other glands.',
      at: [468, 616], d: blob(470, 614, 28, 24, { amp: 0.12, freq: 3 }) + tube([[472, 566], [471, 592]], 7) },
  ],
};

// ── EAR ── cross-section, outer ear on the left through to the nerve on the
//    right: pinna, canal, eardrum, ossicles, semicircular canals, cochlea,
//    Eustachian tube and auditory nerve.
ORGANS.ear = {
  file: 'ear', label: 'The Ear', w: 1000, h: 780,
  parts: [
    { name: 'pinna', hint: 'The flap of skin and cartilage on the head that funnels sound in.',
      at: [140, 400], d: smoothClosed([[70, 250], [180, 200], [250, 300], [235, 430], [255, 520], [150, 560], [80, 470], [95, 360]]) },
    { name: 'ear canal', hint: 'The tube that carries sound from the outer ear to the eardrum.',
      at: [360, 398], d: tube([[236, 400], [320, 398], [430, 402], [468, 405]], 42) },
    { name: 'eardrum', hint: 'The tight membrane that vibrates when sound waves hit it.',
      at: [492, 405], d: poly([[478, 352], [500, 360], [502, 452], [480, 460]]) },
    { name: 'ossicles', hint: 'The three tiniest bones in the body; they pass on the vibration.',
      at: [560, 360], d: tube([[512, 388], [548, 330], [590, 348], [612, 400]], 15)
        + circle(548, 330, 20) + circle(600, 372, 18) },
    { name: 'semicircular canals', hint: 'The three looping tubes that sense balance and turning.',
      at: [700, 250], d: arcTube(700, 250, 78, D2R(120), D2R(430), 16) },
    { name: 'cochlea', hint: 'The coiled tube that turns vibration into nerve signals for sound.',
      at: [700, 505], d: spiral(700, 505, 92, 2.4, 17) },
    { name: 'Eustachian tube', hint: 'The tube linking the middle ear to the throat to balance pressure.',
      at: [660, 620], d: tube([[588, 452], [640, 540], [720, 640], [780, 690]], 22) },
    { name: 'auditory nerve', hint: 'The nerve carrying sound signals from the ear to the brain.',
      at: [852, 470], d: tube([[772, 500], [840, 486], [930, 470]], 20) + circle(772, 505, 22) },
  ],
};

// ── Emit ──────────────────────────────────────────────────────────────────
function emit(spec) {
  const rows = spec.parts.map((p) => {
    if (!/^[A-Za-z][A-Za-z '-]*$/.test(p.name)) throw new Error(`odd part name: ${p.name}`);
    if (p.hint.toLowerCase().includes(p.name.toLowerCase())) throw new Error(`clue names itself: ${p.name}`);
    return `  [${JSON.stringify(p.name)}, ${JSON.stringify(p.hint)}, ${r1(p.at[0])}, ${r1(p.at[1])}, ${JSON.stringify(p.d)}],`;
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

   Each row: [name, hint, cx, cy, path]. cx/cy anchor the locator ring. This
   file is LAZY-LOADED — never import it statically from index.js.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${spec.w};
export const MAP_H = ${spec.h};

const RAW = [
${rows}
];

export const PARTS = RAW.map(([name, hint, cx, cy, d]) => ({ name, hint, cx, cy, d }));

// Shaped like any other topic's words: the part's NAME is the word, its
// description is the clue, and \`part\` carries the drawing the game lights up.
export const GAME_PARTS = PARTS.map((c) => ({ w: c.name, d: c.hint, part: c }));
`;
  writeFileSync(join(OUT_DIR, `${spec.file}.js`), out);
  console.log(`  ${spec.file}.js — ${spec.parts.length} parts, ${spec.w}×${spec.h}`);
}

console.log('organ maps:');
for (const key of Object.keys(ORGANS)) emit(ORGANS[key]);
