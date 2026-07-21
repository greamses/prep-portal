/* Generates data/vocab/organs/heart.js — a DETAILED heart map — from the
   Wikimedia diagram "Diagram of the human heart (cropped).svg" by Wapcaplet,
   CC-BY-SA 3.0. This replaces the earlier hand-authored heart schematic with a
   clinical cutaway: four chambers, the great vessels, the pulmonary veins and
   all four valves.

   LICENCE. The source is CC-BY-SA 3.0, so the file this writes is a derivative
   under the SAME licence — attribution to Wapcaplet, a link, and a note of the
   changes are baked into its header and shown in-game. That obligation rides
   only on this one organ file; the other organ maps stay hand-authored and
   unlicensed. Changes made here: kept only the labelled anatomy (dropped the
   text, arrows, gradients and internal vena-cava detail), merged each valve's
   two leaflets and each paired vessel into one part, flattened every part's
   transform into its path, refitted to a 1000-wide box, recoloured at render.

   RE-RUN (rarely — only to re-source): no deps. From a scratch dir:
     curl -L -o heart-src.svg \
       'https://commons.wikimedia.org/wiki/Special:FilePath/Diagram%20of%20the%20human%20heart%20(cropped).svg'
     node /path/to/prep-portal/scripts/gen-heart-map.mjs
   Writes data/vocab/organs/heart.js next to the other organ maps.

   Output is the same shape the other organ maps use (PARTS {name,hint,cx,cy,d},
   GAME_PARTS {w,d,part}), so the existing renderer draws it unchanged. Parts
   also carry a `grade` — this heart is detailed, so the chambers come in early
   and the valves wait for senior grades (topicPool tiers on it). */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  parseXML, buildIndex, chainT, parsePath, applyAffine, segStr, bounds, anchor, fillOf,
} from './lib/svg-flatten.mjs';

const SRC = 'heart-src.svg';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'organs', 'heart.js');
const W = 1000, MARGIN = 24;

// id -> [classroom name, clue, grade]. Missing ids are dropped. Several source
// ids merge into one part (a valve is two leaflets; a paired vessel two branches).
const PARTS = {
  right_atrium: ['right atrium', 'The upper chamber that receives tired blood returning from the body.', 3],
  left_atrium: ['left atrium', 'The upper chamber that receives fresh blood back from the lungs.', 3],
  right_ventricle: ['right ventricle', 'The lower chamber that pumps blood to the lungs.', 3],
  left_ventricle: ['left ventricle', 'The strongest chamber; it pumps blood out to the whole body.', 3],
  aorta: ['aorta', 'The great vessel carrying blood out to the whole body.', 3],
  superior_vena_cava: ['superior vena cava', 'The big vein bringing blood down from the head and arms.', 4],
  inferior_vena_cava: ['inferior vena cava', 'The big vein bringing blood up from the lower body.', 4],
  pulmonary_artery_1: ['pulmonary artery', 'The vessel taking blood from the heart to the lungs for oxygen.', 4],
  pulmonary_artery_2: ['pulmonary artery', '', 0],
  pulmonary_vein_1: ['pulmonary vein', 'The vessel bringing oxygen-rich blood from the lungs back to the heart.', 5],
  pulmonary_vein_2: ['pulmonary vein', '', 0],
  tricuspid_valve_1: ['tricuspid valve', 'The valve between the right atrium and right ventricle.', 7],
  tricuspid_valve_2: ['tricuspid valve', '', 0],
  mitral_valve_1: ['mitral valve', 'The valve between the left atrium and left ventricle.', 7],
  mitral_valve_2: ['mitral valve', '', 0],
  pulmonary_valve_1: ['pulmonary valve', 'The flap guarding the way out to the lungs.', 7],
  pulmonary_valve_2: ['pulmonary valve', '', 0],
  aortic_valve_1: ['aortic valve', 'The flap guarding the way out to the body.', 7],
  aortic_valve_2: ['aortic valve', '', 0],
};

// (XML reader, transforms, path parser, bounds, anchor all come from
// ./lib/svg-flatten.mjs — shared with gen-brain-map.mjs.)

// ── Read, flatten, group, fit ─────────────────────────────────────────────
const { byId } = buildIndex(parseXML(readFileSync(SRC, 'utf8')));

// Flatten each source id into world-space absolute segments, keeping its fill
// (the cutaway colours the oxygen-poor and oxygen-rich sides differently).
const flat = {};
for (const id of Object.keys(PARTS)) {
  const node = byId[id];
  if (!node) throw new Error(`source id "${id}" not found in ${SRC}`);
  flat[id] = { segs: applyAffine(parsePath(node.attrs.d), chainT(node)), fill: fillOf(node) };
}

// Fit the visible ink into a 1000-wide box.
const b = bounds(Object.values(flat).map((f) => f.segs));
const scale = (W - 2 * MARGIN) / (b.maxx - b.minx);
const H = Math.ceil((b.maxy - b.miny) * scale + 2 * MARGIN);
const fit = [scale, 0, 0, scale, MARGIN - b.minx * scale, MARGIN - b.miny * scale];

// Merge the source ids that share a classroom name, in a stable order. The
// primary piece (the one carrying the text) also carries the part's colour.
const order = [];
const merged = {};
for (const [id, [name, hint, grade]] of Object.entries(PARTS)) {
  const segs = applyAffine(flat[id].segs, fit);
  if (!merged[name]) { merged[name] = { name, hint, grade, fill: '', segList: [] }; order.push(name); }
  const m = merged[name];
  if (hint) { m.hint = hint; m.grade = grade; m.fill = flat[id].fill; }
  m.segList.push(segs);
}

const rows = order.map((name) => {
  const m = merged[name];
  const all = m.segList.flat();
  const d = m.segList.map(segStr).join('');
  const a = anchor(all);
  if (!a) throw new Error(`no anchor for ${name}`);
  if (!m.hint) throw new Error(`no hint for ${name}`);
  if (!m.fill || m.fill === 'none') throw new Error(`no fill colour for ${name}`);
  if (m.hint.toLowerCase().includes(name.toLowerCase())) throw new Error(`clue names itself: ${name}`);
  return { name, hint: m.hint, grade: m.grade, fill: m.fill, cx: Math.round(a[0] * 10) / 10, cy: Math.round(a[1] * 10) / 10, d };
});

// Distinct-outline guard, and every grade 3–12.
const seen = new Map();
for (const r of rows) {
  if (seen.has(r.d)) throw new Error(`${r.name} draws the same path as ${seen.get(r.d)}`);
  seen.set(r.d, r.name);
  if (!(r.grade >= 3 && r.grade <= 12)) throw new Error(`grade out of range: ${r.name} (${r.grade})`);
}

const askable = {};
for (let g = 5; g <= 12; g++) askable[g] = rows.filter((r) => r.grade <= g).length;
console.log(`heart parts: ${rows.length} (from ${Object.keys(PARTS).length} source ids)`);
console.log('askable by grade:', JSON.stringify(askable));
console.log(`box ${W}×${H}`);

// ── Emit ──────────────────────────────────────────────────────────────────
const CREDIT = 'Heart © Wapcaplet · <a href="https://commons.wikimedia.org/wiki/File:Diagram_of_the_human_heart_(cropped).svg" target="_blank" rel="noopener">CC BY-SA 3.0</a>, adapted';
const body = rows.map((r) =>
  `  [${JSON.stringify(r.name)}, ${JSON.stringify(r.hint)}, ${r.grade}, ${JSON.stringify(r.fill)}, ${r.cx}, ${r.cy}, ${JSON.stringify(r.d)}],`).join('\n');

const out = `/* ═══════════════════════════════════════════════════════
   MAP OF THE HEART — a detailed cutaway: four chambers, the great vessels, the
   pulmonary veins and all four valves. Baked from the Wikimedia diagram by
   scripts/gen-heart-map.mjs. Name the lit PART.

   ⚠ LICENCE — THIS FILE IS CC-BY-SA 3.0 (not the repo default). It derives from
   "Diagram of the human heart (cropped).svg" by Wikimedia user Wapcaplet
   (https://commons.wikimedia.org/wiki/File:Diagram_of_the_human_heart_(cropped).svg),
   CC-BY-SA 3.0. Adapted: kept only the labelled anatomy, merged each valve's
   leaflets and each paired vessel, flattened transforms and refit to a 1000-wide
   box. Any redistribution must keep this attribution and the same licence, and
   the visible in-game credit (CREDIT below) must stay.

   Each row: [name, hint, grade, fill, cx, cy, path]. \`grade\` tiers the parts
   by difficulty (chambers early, valves senior); topicPool filters on it.
   \`fill\` is the part's real colour from the cutaway. This file is LAZY-LOADED
   — never import it statically from index.js.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${W};
export const MAP_H = ${H};
export const CREDIT = ${JSON.stringify(CREDIT)};

const RAW = [
${body}
];

export const PARTS = RAW.map(([name, hint, grade, fill, cx, cy, d]) => ({ name, hint, grade, fill, cx, cy, d }));

// Shaped like any other topic's words: the part's NAME is the word, its
// description is the clue, \`g\` tiers it by grade (topicPool filters on it),
// and \`part\` carries the drawing the game lights up.
export const GAME_PARTS = PARTS.map((c) => ({ w: c.name, d: c.hint, g: c.grade, part: c }));
`;

writeFileSync(OUT, out);
console.log(`wrote ${OUT.split(/[\\/]/).slice(-4).join('/')}`);
