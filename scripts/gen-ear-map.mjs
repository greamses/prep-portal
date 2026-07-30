/* Generates data/vocab/organs/ear.js — the ear, SOURCED from the Wikimedia
   diagram "Anatomy of the Human Ear.svg" by Lars Chittka & Axel Brockmann
   (CC BY 2.5). It's a shaded illustration, not flat regions, so it's kept as a
   RICH figure: the whole artwork is embedded untouched and a part is quizzed by
   dimming everything except an elliptical "spotlight" over it (see the rich
   branch in vocab game.js / main.js). That preserves the shading and never
   mislabels — the spotlight just points at the real, correctly-drawn art.

   The multilingual <switch>/<text> labels are stripped (we draw our own), and the
   gradient ids are namespaced ("ear-…") so they can't collide with other ids on
   the page. Part spotlights are authored by position, verified against the
   labelled source (scratchpad/brain/ear-spots.png).

   RE-RUN (no deps). From a scratch dir:
     curl -L -o ear-src.svg \
       'https://commons.wikimedia.org/wiki/Special:FilePath/Anatomy%20of%20the%20Human%20Ear.svg'
     node /path/to/prep-portal/scripts/gen-ear-map.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const SRC = 'ear-src.svg';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'organs', 'ear.js');

// [name, hint, spotlight ellipse {cx,cy,rx,ry,rot}]. Hints never contain the name.
const PARTS = [
  ['auricle', 'The outer flap that funnels sound into the ear.', { cx: 75, cy: 275, rx: 70, ry: 205, rot: 0 }],
  ['external auditory canal', 'The passage that carries sound inwards to the eardrum.', { cx: 245, cy: 305, rx: 95, ry: 34, rot: -3 }],
  ['tympanic membrane', 'The tight skin that vibrates when sound hits it — the eardrum.', { cx: 375, cy: 292, rx: 30, ry: 48, rot: 6 }],
  ['tympanic cavity', 'The air-filled space that holds the three tiniest bones.', { cx: 368, cy: 232, rx: 44, ry: 44, rot: 0 }],
  ['malleus', 'The first tiny bone, shaped like a little hammer.', { cx: 352, cy: 235, rx: 22, ry: 30, rot: 0 }],
  ['incus', 'The middle tiny bone, shaped like an anvil.', { cx: 381, cy: 236, rx: 20, ry: 26, rot: 0 }],
  ['stapes', 'The last tiny bone, a stirrup shape on the oval window.', { cx: 408, cy: 254, rx: 20, ry: 24, rot: 0 }],
  ['semicircular canals', 'The three looping tubes that sense balance and turning.', { cx: 430, cy: 188, rx: 54, ry: 54, rot: 0 }],
  ['cochlea', 'The coiled, snail-shaped tube that turns vibration into signals.', { cx: 500, cy: 282, rx: 56, ry: 52, rot: 0 }],
  ['vestibular nerve', 'The strand carrying balance messages to the brain.', { cx: 578, cy: 250, rx: 62, ry: 24, rot: -8 }],
  ['cochlear nerve', 'The strand carrying sound messages to the brain.', { cx: 588, cy: 294, rx: 62, ry: 24, rot: 9 }],
  ['round window', 'The little membrane that lets the inner-ear fluid ripple.', { cx: 428, cy: 302, rx: 22, ry: 28, rot: 0 }],
  ['Eustachian tube', 'The passage down to the throat that balances air pressure.', { cx: 488, cy: 382, rx: 85, ry: 26, rot: 40 }],
];

let raw = readFileSync(SRC, 'utf8');
// Drop the multilingual label machinery and any stray text.
raw = raw.replace(/<switch[\s\S]*?<\/switch>/g, '').replace(/<text[\s\S]*?<\/text>/g, '');

// viewBox → intrinsic size.
const vb = /viewBox="([^"]+)"/.exec(raw)[1].trim().split(/[\s,]+/).map(Number);
const [, , W, H] = vb;

// Namespace every gradient/clip id that is referenced by url(#…) so the embedded
// markup can't collide with ids elsewhere on the page.
const refIds = new Set([...raw.matchAll(/url\(#([\w-]+)\)/g)].map((m) => m[1]));
for (const id of refIds) {
  raw = raw.replace(new RegExp(`id="${id}"`, 'g'), `id="ear-${id}"`);
  raw = raw.replace(new RegExp(`url\\(#${id}\\)`, 'g'), `url(#ear-${id})`);
}

// Keep only the inner markup (defs + shapes) — strip the outer <svg> wrapper so
// the game can drop it into its own sized <svg>.
const inner = raw.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();

// Sanity: hints don't name their part; no gradient id survived un-namespaced.
for (const [name, hint] of PARTS) {
  if (hint.toLowerCase().includes(name.toLowerCase())) throw new Error(`clue names itself: ${name}`);
}
if (/url\(#(?!ear-)[\w-]+\)/.test(inner)) throw new Error('a gradient id escaped namespacing');

const CREDIT = 'Ear © Chittka & Brockmann · <a href="https://commons.wikimedia.org/wiki/File:Anatomy_of_the_Human_Ear.svg" target="_blank" rel="noopener">CC BY 2.5</a>, adapted';

const rows = PARTS.map(([name, hint, s]) =>
  `  [${JSON.stringify(name)}, ${JSON.stringify(hint)}, ${s.cx}, ${s.cy}, ${s.rx}, ${s.ry}, ${s.rot}],`).join('\n');

const out = `/* ═══════════════════════════════════════════════════════
   THE EAR — a RICH (shaded) figure, sourced from the Wikimedia diagram
   "Anatomy of the Human Ear.svg" by Lars Chittka & Axel Brockmann, baked by
   scripts/gen-ear-map.mjs. Unlike the flat-region maps this keeps the original
   shading: the whole artwork is the SVG below, and the game quizzes a part by
   dimming everything except an elliptical spotlight over it. \`RICH\` tells the
   renderer to take that path. LAZY-LOADED — never import statically.

   CC BY 2.5 — attribution required; the CREDIT below is shown in-game.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${W};
export const MAP_H = ${H};
export const RICH = true;
export const CREDIT = ${JSON.stringify(CREDIT)};

// The full shaded artwork (labels stripped, gradient ids namespaced).
export const SVG = ${JSON.stringify(inner)};

// [name, hint, spotlight cx, cy, rx, ry, rot]. cx/cy also anchor the locator ring.
const RAW = [
${rows}
];

export const PARTS = RAW.map(([name, hint, cx, cy, rx, ry, rot]) =>
  ({ name, hint, cx, cy, spot: { cx, cy, rx, ry, rot } }));

// Same shape every topic's words take: the part NAME is the word, its
// description the clue, and \`part\` carries the spotlight the game lights up.
export const GAME_PARTS = PARTS.map((c) => ({ w: c.name, d: c.hint, part: c }));
`;

writeFileSync(OUT, out);
console.log(`wrote data/vocab/organs/ear.js — ${PARTS.length} parts, ${W}×${H}, ${(inner.length / 1024).toFixed(1)}KB art`);
