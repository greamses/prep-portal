/* Generates data/vocab/organs/brain-limbic.js — the LIMBIC SYSTEM, a hand-authored
   schematic (front on the left) composed from drawing primitives, the same way the
   ear and skin maps are built. The limbic structures — hippocampus, amygdala,
   hypothalamus, thalamus, fornix, mammillary body, cingulate gyrus — are deep
   structures that no surface or midline diagram exposes as clean regions, so a
   clear labelled schematic is the way to teach them. No source artwork → no licence.

   The faint brain silhouette is DECOR (context, never quizzed). Output matches the
   organ-map shape so the existing map renderer draws it with no new code.

   RE-RUN (no deps): node scripts/gen-limbic-map.mjs */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'organs', 'brain-limbic.js');
const W = 1000, H = 760;
const r1 = (v) => Math.round(v * 10) / 10;
const P = (x, y) => `${r1(x)},${r1(y)}`;
const D2R = (d) => (d * Math.PI) / 180;

const circle = (cx, cy, r) => { let d = `M${P(cx + r, cy)}`; for (let i = 1; i <= 44; i++) { const a = i / 44 * 2 * Math.PI; d += `L${P(cx + r * Math.cos(a), cy + r * Math.sin(a))}`; } return d + 'Z'; };
function blob(cx, cy, rx, ry, { n = 40, amp = 0.06, freq = 3, phase = 0 } = {}) {
  let d = ''; for (let i = 0; i <= n; i++) { const a = i / n * 2 * Math.PI; const k = 1 + amp * Math.sin(freq * a + phase); d += (i ? 'L' : 'M') + P(cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)); } return d + 'Z';
}
// Catmull-Rom resample an open polyline into many points → smooth tubes.
function spline(pts, per = 14) {
  const n = pts.length, g = (i) => pts[Math.max(0, Math.min(n - 1, i))], out = [];
  for (let i = 0; i < n - 1; i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); for (let t = 0; t < per; t++) { const s = t / per, s2 = s * s, s3 = s2 * s; out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3), 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3)]); } }
  out.push(pts[n - 1]); return out;
}
// closed Catmull-Rom (the brain silhouette).
function sclosed(pts, per = 16) {
  const n = pts.length, g = (i) => pts[((i % n) + n) % n], out = [];
  for (let i = 0; i < n; i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); for (let t = 0; t < per; t++) { const s = t / per, s2 = s * s, s3 = s2 * s; out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3), 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3)]); } }
  return 'M' + out.map((p) => P(p[0], p[1])).join('L') + 'Z';
}
// filled tube of (possibly varying) half-width along a polyline.
function tube(pts, half) {
  const Hf = typeof half === 'function' ? half : () => half;
  const nrm = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; });
  const Lp = pts.map((p, i) => [p[0] + nrm[i][0] * Hf(i, pts.length), p[1] + nrm[i][1] * Hf(i, pts.length)]);
  const Rp = pts.map((p, i) => [p[0] - nrm[i][0] * Hf(i, pts.length), p[1] - nrm[i][1] * Hf(i, pts.length)]);
  return `M${[...Lp, ...Rp.reverse()].map((p) => P(p[0], p[1])).join('L')}Z`;
}
const stube = (pts, half) => tube(spline(pts), half);
function arc(cx, cy, r, d0, d1, half) { const pts = []; for (let i = 0; i <= 30; i++) { const a = D2R(d0 + (d1 - d0) * i / 30); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return tube(pts, half); }

const DECOR = sclosed([[70, 360], [150, 180], [340, 70], [560, 60], [760, 120], [900, 270], [905, 410], [820, 520], [640, 540], [560, 560], [520, 660], [470, 600], [430, 540], [250, 540], [120, 470]]);

// [name, fill, hint, at(locator ring), path]
const PARTS = [
  ['cingulate gyrus', '#cdd5df', 'The arching fold over the centre that helps handle emotion and pain.', [300, 250], arc(500, 478, 300, 202, 338, 40)],
  ['fornix', '#f4d59a', 'The curved bundle of fibres carrying signals out of the memory curl.', [700, 300], stube([[706, 448], [678, 358], [612, 288], [520, 260], [452, 288], [430, 362], [420, 438]], (i, t) => 13 - 4 * (i / t))],
  ['thalamus', '#c9a0dc', 'The central relay that passes signals up to the cortex.', [528, 368], blob(528, 368, 66, 47, { amp: 0.05, freq: 3 })],
  ['hypothalamus', '#9ad19a', 'The small control centre for hunger, temperature and hormones.', [462, 430], blob(462, 430, 37, 26, { amp: 0.09, freq: 3 })],
  ['mammillary body', '#e2938f', 'The tiny bump at the base that helps store memories.', [416, 448], circle(416, 448, 15)],
  ['hippocampus', '#f2a6c0', 'The curled “seahorse” that forms new memories.', [672, 520], stube([[712, 452], [730, 505], [712, 556], [665, 582], [615, 570], [598, 527], [628, 498], [668, 500]], (i, t) => 10 + 16 * Math.max(0, 1 - i / (t * 0.8)))],
  ['amygdala', '#f6b087', 'The almond-shaped part that drives fear and strong emotion.', [578, 498], blob(578, 498, 35, 28, { amp: 0.1, freq: 3, phase: 1 })],
];

// Guards: clean names, no self-naming clue, no two parts sharing a path.
const seen = new Map();
for (const [name, fill, hint, , d] of PARTS) {
  if (!/^[A-Za-z][A-Za-z '-]*$/.test(name)) throw new Error(`odd name: ${name}`);
  if (hint.toLowerCase().includes(name.toLowerCase())) throw new Error(`clue names itself: ${name}`);
  if (!fill) throw new Error(`no fill for ${name}`);
  if (seen.has(d)) throw new Error(`${name} shares a path with ${seen.get(d)}`);
  seen.set(d, name);
}

const rows = PARTS
  .map(([name, fill, hint, at, d]) => `  [${JSON.stringify(name)}, ${JSON.stringify(hint)}, ${JSON.stringify(fill)}, ${r1(at[0])}, ${r1(at[1])}, ${JSON.stringify(d)}],`)
  .join('\n');

const out = `/* ═══════════════════════════════════════════════════════
   THE LIMBIC SYSTEM — a hand-authored schematic (front on the left), generated by
   scripts/gen-limbic-map.mjs: hippocampus, amygdala, hypothalamus, thalamus,
   fornix, mammillary body and the cingulate gyrus, inside a faint brain outline
   (DECOR). These deep structures aren't exposed as clean regions by any surface or
   midline diagram, so they're drawn as a clear "name the part" schematic. No
   source artwork, so no licence. Same path shape as the maps — the map renderer
   draws it with no new code. LAZY-LOADED — never import statically.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${W};
export const MAP_H = ${H};
export const DECOR = ${JSON.stringify(DECOR)};

const RAW = [
${rows}
];

export const PARTS = RAW.map(([name, hint, fill, cx, cy, d]) => ({ name, hint, fill, cx, cy, d }));

export const GAME_PARTS = PARTS.map((c) => ({ w: c.name, d: c.hint, part: c }));
`;

writeFileSync(OUT, out);
console.log(`wrote data/vocab/organs/brain-limbic.js — ${PARTS.length} parts, ${W}×${H}`);
