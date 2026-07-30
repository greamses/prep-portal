/* Generates data/vocab/organs/brain-section.js — the brain in MID-SAGITTAL
   SECTION (the internal structures), from the Wikimedia diagram
   "Gehirn, medial - beschriftet lat.svg" by NEUROtiker (CC BY-SA 3.0). A cut
   through the midline, so structures hidden on the surface view — the corpus
   callosum, thalamus, pons, medulla oblongata, cerebellum, pituitary — are
   exposed. Companion to the surface brain map (gen-brain-map.mjs).

   The source colours its structures but SHARES a fill across several (the whole
   brainstem + callosum are one cream, etc.), and its labels are Latin glyph-
   paths that can't be read programmatically. So the structure→name map is
   HARD-CODED here by source path index, VERIFIED by rendering each group against
   the diagram's own Latin labels (see scratchpad/brain/section-check.png). If the
   source ever changes, these indices must be re-verified.

   Region #5 (a cream blob in front of the cerebellum) is anatomically ambiguous
   between the midbrain and the cerebellar white matter, so it is MERGED into the
   cerebellum rather than asserted as a separate named structure — no false label.

   LICENCE: CC BY-SA 3.0 — attribution required; CREDIT is shown in-game.

   RE-RUN (no deps). From a scratch dir:
     curl -L -o medial.svg \
       'https://commons.wikimedia.org/wiki/Special:FilePath/Gehirn,%20medial%20-%20beschriftet%20lat.svg'
     node /path/to/prep-portal/scripts/gen-brain-section.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  parseXML, buildIndex, chainT, parsePath, applyAffine, segStr, bounds, anchor, fillOf,
} from './lib/svg-flatten.mjs';

const SRC = 'medial.svg';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'organs', 'brain-section.js');
const W = 1000, MARGIN = 20;

// name -> { source path indices (into the COLOURED-structural list, in document
// order), soft fill, hint }. Verified against the diagram's Latin labels.
const STRUCTURES = [
  { name: 'frontal lobe',      idx: [10],       fill: '#fcfb98', hint: 'The front — planning, deciding and voluntary movement.' },
  { name: 'parietal lobe',     idx: [4],        fill: '#f4a9a9', hint: 'The upper middle — touch and knowing where the body is.' },
  { name: 'occipital lobe',    idx: [1, 2],     fill: '#b4d8ec', hint: 'The very back — where seeing is understood.' },
  { name: 'corpus callosum',   idx: [9, 14, 12, 13], fill: '#e9d8b0', hint: 'The thick curved band of fibres joining the left and right halves.' },
  { name: 'cingulate gyrus',   idx: [6],        fill: '#cdd5df', hint: 'The curved fold wrapped just above the great connecting band.' },
  { name: 'thalamus',          idx: [7],        fill: '#c9a0dc', hint: 'The central relay that passes signals up to the cortex.' },
  { name: 'pituitary gland',   idx: [11],       fill: '#9ad19a', hint: 'The small gland hanging beneath the brain — releases hormones.' },
  { name: 'pons',              idx: [8],        fill: '#9adfd8', hint: 'The rounded bulge of the stem that links across to the cerebellum.' },
  { name: 'medulla oblongata', idx: [0],        fill: '#7fc9c2', hint: 'The lowest part of the stem into the spinal cord — breathing and heartbeat.' },
  { name: 'cerebellum',        idx: [3, 5],     fill: '#e2b6f2', hint: 'The ridged “little brain” at the back — balance and coordination.' },
];

// The limbic structures the source diagram doesn't itself draw — hippocampus,
// amygdala and hypothalamus — are hand-added in the medial-temporal region so
// "Inside the Brain" covers them too. Same soft style as the sourced regions;
// drawn on top, over the fitted geometry. Built from the small primitives below.
const D2R = (d) => (d * Math.PI) / 180;
const _P = (x, y) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
function eblob(cx, cy, rx, ry, { n = 40, amp = 0.06, freq = 3, phase = 0 } = {}) {
  let s = ''; for (let i = 0; i <= n; i++) { const a = i / n * 2 * Math.PI; const k = 1 + amp * Math.sin(freq * a + phase); s += (i ? 'L' : 'M') + _P(cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)); } return s + 'Z';
}
function _spline(pts, per = 14) {
  const n = pts.length, g = (i) => pts[Math.max(0, Math.min(n - 1, i))], o = [];
  for (let i = 0; i < n - 1; i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); for (let t = 0; t < per; t++) { const u = t / per, u2 = u * u, u3 = u2 * u; o.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3), 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]); } } o.push(pts[n - 1]); return o;
}
function etube(pts, half) {
  const H = typeof half === 'function' ? half : () => half;
  const nrm = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; });
  const Lp = pts.map((p, i) => [p[0] + nrm[i][0] * H(i, pts.length), p[1] + nrm[i][1] * H(i, pts.length)]);
  const Rp = pts.map((p, i) => [p[0] - nrm[i][0] * H(i, pts.length), p[1] - nrm[i][1] * H(i, pts.length)]);
  return `M${[...Lp, ...Rp.reverse()].map((p) => _P(p[0], p[1])).join('L')}Z`;
}
const estube = (pts, half) => etube(_spline(pts), half);
const EXTRA = [
  { name: 'hypothalamus', fill: '#f0c674', hint: 'The small control centre for hunger, temperature and hormones.',
    cx: 470, cy: 496, d: eblob(470, 496, 25, 18, { amp: 0.08, freq: 3 }) },
  { name: 'amygdala', fill: '#f6b087', hint: 'The almond-shaped part that drives fear and strong emotion.',
    cx: 582, cy: 470, d: eblob(582, 470, 26, 20, { amp: 0.1, freq: 3, phase: 1 }) },
  { name: 'hippocampus', fill: '#f2a6c0', hint: 'The curled “seahorse” that forms new memories.',
    cx: 628, cy: 512, d: estube([[600, 480], [632, 488], [656, 516], [648, 546], [614, 554], [594, 530], [610, 512]], (i, t) => 8 + 11 * Math.max(0, 1 - i / (t * 0.8))) },
];

const doc = parseXML(readFileSync(SRC, 'utf8'));
const { all } = buildIndex(doc);
const paths = all.filter((n) => n.tag === 'path' && (n.attrs.d || '').trim());
const flat = paths.map((p) => ({ segs: applyAffine(parsePath(p.attrs.d), chainT(p)), fill: fillOf(p) }));

// The coloured structural paths (document order = the index the map refers to),
// and the fill:none strokes (outline + sulci + folia) for DECOR.
const struct = flat.filter((f) => f.fill && f.fill !== 'none');
const decorPaths = flat.filter((f) => f.fill === 'none');

// Fit the kept geometry (structures + decor) to a 1000-wide box.
const kept = [...struct, ...decorPaths];
const b = bounds(kept.map((f) => f.segs));
const scale = (W - 2 * MARGIN) / (b.maxx - b.minx);
const H = Math.ceil((b.maxy - b.miny) * scale + 2 * MARGIN);
const fit = [scale, 0, 0, scale, MARGIN - b.minx * scale, MARGIN - b.miny * scale];
for (const f of kept) f.segs = applyAffine(f.segs, fit);

// Every structural index must be claimed exactly once (guards a bad re-source).
const claimed = STRUCTURES.flatMap((s) => s.idx).sort((a, z) => a - z);
const expect = struct.map((_, i) => i).sort((a, z) => a - z);
if (JSON.stringify(claimed) !== JSON.stringify(expect)) {
  throw new Error(`structural indices changed — re-verify.\n claimed ${claimed}\n present ${expect}`);
}

const r1 = (v) => Math.round(v * 10) / 10;
const sourced = STRUCTURES.map((s) => {
  const segs = s.idx.flatMap((i) => struct[i].segs);
  const c = anchor(segs);
  if (s.hint.toLowerCase().includes(s.name.toLowerCase())) throw new Error(`clue names itself: ${s.name}`);
  return { name: s.name, hint: s.hint, fill: s.fill, cx: r1(c[0]), cy: r1(c[1]), d: segStr(segs) };
});
const rows = [...sourced, ...EXTRA]
  .map((r) => { if (r.hint.toLowerCase().includes(r.name.toLowerCase())) throw new Error(`clue names itself: ${r.name}`); return r; })
  .sort((a, z) => a.name.localeCompare(z.name));

const decor = decorPaths.map((f) => segStr(f.segs)).join('');
console.log(`section structures: ${rows.length} (${rows.map((r) => r.name).join(', ')})`);
console.log(`decor paths: ${decorPaths.length}   box ${W}×${H}`);

const CREDIT = 'Brain © NEUROtiker · <a href="https://commons.wikimedia.org/wiki/File:Gehirn,_medial_-_beschriftet_lat.svg" target="_blank" rel="noopener">CC BY-SA 3.0</a>, adapted';

const body = rows.map((r) =>
  `  [${JSON.stringify(r.name)}, ${JSON.stringify(r.hint)}, ${JSON.stringify(r.fill)}, ${r.cx}, ${r.cy}, ${JSON.stringify(r.d)}],`).join('\n');

const out = `/* ═══════════════════════════════════════════════════════
   BRAIN — MID-SAGITTAL SECTION. The internal structures exposed by a cut through
   the midline (corpus callosum, thalamus, pons, medulla oblongata, cerebellum,
   pituitary, cingulate gyrus + the medial lobe faces), from the Wikimedia diagram
   "Gehirn, medial - beschriftet lat.svg" by NEUROtiker, baked by
   scripts/gen-brain-section.mjs. The limbic structures the source omits —
   hippocampus, amygdala and hypothalamus — are hand-added in the medial-temporal
   region so this topic covers them too. Name the lit structure.

   CC BY-SA 3.0 — attribution required; the CREDIT below is shown in-game. Each
   structure carries a soft fill; DECOR is the outline + sulci + folia, drawn but
   never quizzed. This file is LAZY-LOADED — never import it statically.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${W};
export const MAP_H = ${H};
export const CREDIT = ${JSON.stringify(CREDIT)};
export const DECOR = ${JSON.stringify(decor)};

const RAW = [
${body}
];

export const PARTS = RAW.map(([name, hint, fill, cx, cy, d]) => ({ name, hint, fill, cx, cy, d }));

export const GAME_PARTS = PARTS.map((c) => ({ w: c.name, d: c.hint, part: c }));
`;

writeFileSync(OUT, out);
console.log(`wrote data/vocab/organs/brain-section.js`);
