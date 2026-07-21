/* Generates data/vocab/organs/brain.js — the brain map — from the Wikimedia
   diagram "Lobes of the brain NL.svg" (PUBLIC DOMAIN). A lateral view whose
   four cerebral lobes are each a distinct COLOURED region, so the game can draw
   them in their real colours. Replaces the earlier hand-authored brain.

   Trade-off (chosen deliberately): this is a clean, polished four-lobe teaching
   diagram — four parts, not the ten of the hand-authored lateral brain. The
   deep structures (thalamus, corpus callosum…) only live in traced sagittal
   illustrations that have no per-structure paths to extract, so they can't be
   sourced this way.

   LICENCE: the source is public domain (no attribution or share-alike needed),
   so this file carries no in-game credit. The lobe outlines and the sulci come
   straight from the diagram; the lobe NAMES are assigned here by position.

   RE-RUN (no deps). From a scratch dir:
     curl -L -o lobes.svg \
       'https://commons.wikimedia.org/wiki/Special:FilePath/Lobes%20of%20the%20brain%20NL.svg'
     node /path/to/prep-portal/scripts/gen-brain-map.mjs

   Output matches the organ-map shape, plus a per-part `fill` (its lobe colour)
   and a DECOR path (the sulci + outline, drawn but never quizzed) so the flat
   colours still read as a brain. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  parseXML, buildIndex, chainT, parsePath, applyAffine, segStr, bounds, anchor, fillOf,
} from './lib/svg-flatten.mjs';

const SRC = 'lobes.svg';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'organs', 'brain.js');
const W = 1000, MARGIN = 20;

// The four lobe fills in the source. Names are NOT tied to colour — they are
// assigned by position below, so a re-source with a different palette still works.
const LOBE_FILLS = new Set(['#f7a6b6', '#b6cf9d', '#b4d8ec', '#fcfb98']);
const HINT = {
  'frontal lobe': 'The front of the brain — planning, deciding and voluntary movement.',
  'parietal lobe': 'The upper middle — touch, temperature and knowing where the body is.',
  'temporal lobe': 'The lower side — hearing, and the memory of words.',
  'occipital lobe': 'The very back of the brain — where seeing is understood.',
};

const doc = parseXML(readFileSync(SRC, 'utf8'));
const { all } = buildIndex(doc);
const paths = all.filter((n) => n.tag === 'path' && (n.attrs.d || '').trim());

// Flatten every path once, into source-space absolute segments.
const flat = paths.map((p) => ({ segs: applyAffine(parsePath(p.attrs.d), chainT(p)), fill: fillOf(p) }));

// Fit everything to a 1000-wide box.
const b = bounds(flat.map((f) => f.segs));
const scale = (W - 2 * MARGIN) / (b.maxx - b.minx);
const H = Math.ceil((b.maxy - b.miny) * scale + 2 * MARGIN);
const fit = [scale, 0, 0, scale, MARGIN - b.minx * scale, MARGIN - b.miny * scale];
for (const f of flat) f.segs = applyAffine(f.segs, fit);

// The four lobes (one coloured path each) and the decoration (everything with no
// fill — the outline and the sulci lines — drawn but not nameable).
const lobes = flat.filter((f) => LOBE_FILLS.has(f.fill));
const decorSegs = flat.filter((f) => f.fill === 'none' || f.fill === '' || f.fill === '#000000' || f.fill === '#000');
if (lobes.length !== 4) throw new Error(`expected 4 coloured lobes, found ${lobes.length}`);

// Name the lobes by position: frontal is front-most (min x), occipital back-most
// (max x); of the middle pair, parietal sits higher (min y), temporal lower.
const withC = lobes.map((f) => ({ ...f, c: anchor(f.segs) }));
withC.sort((p, q) => p.c[0] - q.c[0]);
const frontal = withC[0], occipital = withC[3];
const mid = [withC[1], withC[2]].sort((p, q) => p.c[1] - q.c[1]);
const named = [
  { name: 'frontal lobe', ...frontal },
  { name: 'parietal lobe', ...mid[0] },
  { name: 'temporal lobe', ...mid[1] },
  { name: 'occipital lobe', ...occipital },
];

const r1 = (v) => Math.round(v * 10) / 10;
const rows = named.map((l) => {
  const hint = HINT[l.name];
  if (hint.toLowerCase().includes(l.name.toLowerCase())) throw new Error(`clue names itself: ${l.name}`);
  return { name: l.name, hint, fill: l.fill, cx: r1(l.c[0]), cy: r1(l.c[1]), d: segStr(l.segs) };
}).sort((a, z) => a.name.localeCompare(z.name));

const decor = decorSegs.map((f) => segStr(f.segs)).join('');

console.log(`brain lobes: ${rows.length}  (${rows.map((r) => `${r.name}=${r.fill}`).join(', ')})`);
console.log(`decor paths: ${decorSegs.length}   box ${W}×${H}`);

const body = rows.map((r) =>
  `  [${JSON.stringify(r.name)}, ${JSON.stringify(r.hint)}, ${JSON.stringify(r.fill)}, ${r.cx}, ${r.cy}, ${JSON.stringify(r.d)}],`).join('\n');

const out = `/* ═══════════════════════════════════════════════════════
   MAP OF THE BRAIN — the four cerebral lobes, lateral view, from the public-
   domain Wikimedia diagram "Lobes of the brain NL.svg", baked by
   scripts/gen-brain-map.mjs. Name the lit lobe.

   PUBLIC DOMAIN — no attribution or licence obligation. Each lobe keeps its
   real colour (\`fill\`); DECOR is the outline + sulci, drawn under the labels
   but never quizzed, so the flat colours still read as a brain.

   Each row: [name, hint, fill, cx, cy, path]. This file is LAZY-LOADED —
   never import it statically from index.js.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${W};
export const MAP_H = ${H};
export const DECOR = ${JSON.stringify(decor)};

const RAW = [
${body}
];

export const PARTS = RAW.map(([name, hint, fill, cx, cy, d]) => ({ name, hint, fill, cx, cy, d }));

// Shaped like any other topic's words: the lobe's NAME is the word, its
// description is the clue, and \`part\` carries the drawing (with its colour).
export const GAME_PARTS = PARTS.map((c) => ({ w: c.name, d: c.hint, part: c }));
`;

writeFileSync(OUT, out);
console.log(`wrote data/vocab/organs/brain.js`);
