/* Generates data/vocab/organs/brain.js — the WHOLE brain map — from the Wikimedia
   diagram "Gehirn, lateral - Lobi + Stammhirn + Cerebellum eng.svg" by NEUROtiker
   (CC BY-SA 3.0). A lateral view whose SIX structures are each a distinct coloured
   region: the four cerebral lobes PLUS the cerebellum and the brain stem — so it
   is a whole brain, not the cerebrum alone (which the old four-lobe source showed).

   LICENCE: CC BY-SA 3.0 — attribution required. This file therefore carries an
   in-game CREDIT line (like the sourced heart). The region outlines, sulci and
   cerebellar folia come from the diagram; the structure NAMES are assigned here by
   the source colours (asserted against position). The source's text labels are
   filled glyph-paths — dropped (they are neither coloured regions nor outline).

   RE-RUN (no deps). From a scratch dir:
     curl -L -o whole.svg \
       'https://commons.wikimedia.org/wiki/Special:FilePath/Gehirn,%20lateral%20-%20Lobi%20%2B%20Stammhirn%20%2B%20Cerebellum%20eng.svg'
     node /path/to/prep-portal/scripts/gen-brain-map.mjs

   Output matches the organ-map shape, plus a per-part `fill` (a soft recolour of
   its source hue) and a DECOR path (outline + sulci + folia, drawn but never
   quizzed) so the flat colours still read as a brain. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  parseXML, buildIndex, chainT, parsePath, applyAffine, segStr, bounds, anchor, fillOf,
} from './lib/svg-flatten.mjs';

const SRC = 'whole.svg';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'organs', 'brain.js');
const W = 1000, MARGIN = 20;

// Each source colour is one structure. Soft-UI recolour + hint + expected
// lateral position (front = min x, back = max x; used only to sanity-check).
const REGIONS = {
  '#ffff00': { name: 'frontal lobe',  fill: '#fcfb98', pos: 'front',
    hint: 'The front — planning, deciding and voluntary movement.' },
  '#ff0000': { name: 'parietal lobe', fill: '#f4a9a9', pos: 'topmid',
    hint: 'The upper middle — touch, temperature and knowing where the body is.' },
  '#00ff00': { name: 'temporal lobe', fill: '#b6cf9d', pos: 'lowside',
    hint: 'The lower side — hearing, and the memory of words.' },
  '#0000ff': { name: 'occipital lobe', fill: '#b4d8ec', pos: 'back',
    hint: 'The very back — where seeing is understood.' },
  '#ff00ff': { name: 'cerebellum',    fill: '#e2b6f2', pos: 'backlow',
    hint: 'The small ridged part at the back, below the lobes — balance and coordination.' },
  '#00ffff': { name: 'brain stem',    fill: '#9adfd8', pos: 'bottom',
    hint: 'The stalk into the spinal cord — controls breathing and the heartbeat.' },
};

const doc = parseXML(readFileSync(SRC, 'utf8'));
const { all } = buildIndex(doc);
const paths = all.filter((n) => n.tag === 'path' && (n.attrs.d || '').trim());

// Flatten every path into absolute segments, tagged by fill.
const flat = paths.map((p) => ({ segs: applyAffine(parsePath(p.attrs.d), chainT(p)), fill: fillOf(p) }));

// Keep only what we draw: the coloured regions + the fill:none outline strokes.
// Everything else (default-fill glyph paths = the source's text labels) is dropped.
const regionPaths = flat.filter((f) => REGIONS[f.fill]);
const decorPaths = flat.filter((f) => f.fill === 'none');
const kept = [...regionPaths, ...decorPaths];

// Fit the KEPT geometry (not the dropped labels) to a 1000-wide box.
const b = bounds(kept.map((f) => f.segs));
const scale = (W - 2 * MARGIN) / (b.maxx - b.minx);
const H = Math.ceil((b.maxy - b.miny) * scale + 2 * MARGIN);
const fit = [scale, 0, 0, scale, MARGIN - b.minx * scale, MARGIN - b.miny * scale];
for (const f of kept) f.segs = applyAffine(f.segs, fit);

// Merge each colour's subpaths into one region.
const byColour = {};
for (const f of regionPaths) (byColour[f.fill] = byColour[f.fill] || []).push(f.segs);
const regions = Object.entries(byColour).map(([src, segLists]) => {
  const segs = segLists.flat();
  const spec = REGIONS[src];
  return { ...spec, src, c: anchor(segs), d: segStr(segs) };
});
if (regions.length !== 6) throw new Error(`expected 6 coloured regions, found ${regions.length}`);

// Sanity-check the colour→name assignment against lateral position: the frontal
// lobe must be the front-most structure, the occipital the back-most.
const xs = regions.map((r) => r.c[0]);
const frontMost = regions[xs.indexOf(Math.min(...xs))];
const backMostLobe = regions.filter((r) => r.name.endsWith('lobe')).sort((a, z) => z.c[0] - a.c[0])[0];
if (frontMost.name !== 'frontal lobe') throw new Error(`front-most region is ${frontMost.name}, not frontal lobe`);
if (backMostLobe.name !== 'occipital lobe') throw new Error(`back-most lobe is ${backMostLobe.name}, not occipital`);

const r1 = (v) => Math.round(v * 10) / 10;
const rows = regions.map((l) => {
  if (l.hint.toLowerCase().includes(l.name.toLowerCase())) throw new Error(`clue names itself: ${l.name}`);
  return { name: l.name, hint: l.hint, fill: l.fill, cx: r1(l.c[0]), cy: r1(l.c[1]), d: l.d };
}).sort((a, z) => a.name.localeCompare(z.name));

const decor = decorPaths.map((f) => segStr(f.segs)).join('');

console.log(`brain regions: ${rows.length}  (${rows.map((r) => r.name).join(', ')})`);
console.log(`decor paths: ${decorPaths.length}   dropped labels: ${flat.length - kept.length}   box ${W}×${H}`);

const CREDIT = 'Brain © NEUROtiker · <a href="https://commons.wikimedia.org/wiki/File:Gehirn,_lateral_-_Lobi_%2B_Stammhirn_%2B_Cerebellum_eng.svg" target="_blank" rel="noopener">CC BY-SA 3.0</a>, adapted';

const body = rows.map((r) =>
  `  [${JSON.stringify(r.name)}, ${JSON.stringify(r.hint)}, ${JSON.stringify(r.fill)}, ${r.cx}, ${r.cy}, ${JSON.stringify(r.d)}],`).join('\n');

const out = `/* ═══════════════════════════════════════════════════════
   MAP OF THE BRAIN — the WHOLE brain in lateral view (four cerebral lobes +
   cerebellum + brain stem), from the Wikimedia diagram
   "Gehirn, lateral - Lobi + Stammhirn + Cerebellum eng.svg" by NEUROtiker,
   baked by scripts/gen-brain-map.mjs. Name the lit structure.

   CC BY-SA 3.0 — attribution required; the CREDIT below is shown in-game. Each
   structure keeps a soft recolour of its source hue (\`fill\`); DECOR is the
   outline + sulci + cerebellar folia, drawn under the labels but never quizzed.

   Each row: [name, hint, fill, cx, cy, path]. This file is LAZY-LOADED —
   never import it statically from index.js.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${W};
export const MAP_H = ${H};
export const CREDIT = ${JSON.stringify(CREDIT)};
export const DECOR = ${JSON.stringify(decor)};

const RAW = [
${body}
];

export const PARTS = RAW.map(([name, hint, fill, cx, cy, d]) => ({ name, hint, fill, cx, cy, d }));

// Shaped like any other topic's words: the structure's NAME is the word, its
// description is the clue, and \`part\` carries the drawing (with its colour).
export const GAME_PARTS = PARTS.map((c) => ({ w: c.name, d: c.hint, part: c }));
`;

writeFileSync(OUT, out);
console.log(`wrote data/vocab/organs/brain.js`);
