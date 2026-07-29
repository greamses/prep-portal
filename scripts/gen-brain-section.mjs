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
const rows = STRUCTURES.map((s) => {
  const segs = s.idx.flatMap((i) => struct[i].segs);
  const c = anchor(segs);
  if (s.hint.toLowerCase().includes(s.name.toLowerCase())) throw new Error(`clue names itself: ${s.name}`);
  return { name: s.name, hint: s.hint, fill: s.fill, cx: r1(c[0]), cy: r1(c[1]), d: segStr(segs) };
}).sort((a, z) => a.name.localeCompare(z.name));

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
   scripts/gen-brain-section.mjs. Name the lit structure.

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
