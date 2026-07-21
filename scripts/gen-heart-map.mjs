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

const SRC = 'heart-src.svg';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'organs', 'heart.js');
const W = 1000, MARGIN = 24;

// id -> [classroom name, clue, grade]. Missing ids are dropped. Several source
// ids merge into one part (a valve is two leaflets; a paired vessel two branches).
const PARTS = {
  right_atrium: ['right atrium', 'The upper chamber that receives tired blood returning from the body.', 5],
  left_atrium: ['left atrium', 'The upper chamber that receives fresh blood back from the lungs.', 5],
  right_ventricle: ['right ventricle', 'The lower chamber that pumps blood to the lungs.', 5],
  left_ventricle: ['left ventricle', 'The strongest chamber; it pumps blood out to the whole body.', 5],
  aorta: ['aorta', 'The great vessel carrying blood out to the whole body.', 5],
  superior_vena_cava: ['superior vena cava', 'The big vein bringing blood down from the head and arms.', 6],
  inferior_vena_cava: ['inferior vena cava', 'The big vein bringing blood up from the lower body.', 6],
  pulmonary_artery_1: ['pulmonary artery', 'The vessel taking blood from the heart to the lungs for oxygen.', 6],
  pulmonary_artery_2: ['pulmonary artery', '', 0],
  pulmonary_vein_1: ['pulmonary vein', 'The vessel bringing oxygen-rich blood from the lungs back to the heart.', 7],
  pulmonary_vein_2: ['pulmonary vein', '', 0],
  tricuspid_valve_1: ['tricuspid valve', 'The valve between the right atrium and right ventricle.', 9],
  tricuspid_valve_2: ['tricuspid valve', '', 0],
  mitral_valve_1: ['mitral valve', 'The valve between the left atrium and left ventricle.', 9],
  mitral_valve_2: ['mitral valve', '', 0],
  pulmonary_valve_1: ['pulmonary valve', 'The flap guarding the way out to the lungs.', 9],
  pulmonary_valve_2: ['pulmonary valve', '', 0],
  aortic_valve_1: ['aortic valve', 'The flap guarding the way out to the body.', 9],
  aortic_valve_2: ['aortic valve', '', 0],
};

// ── A very small XML reader (same shape as gen-body-map.mjs) ──────────────
function parseXML(src) {
  const root = { tag: '#root', attrs: {}, kids: [], parent: null };
  const stack = [root];
  const tagRe = /<(\/)?([A-Za-z_][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/)?>/g;
  let m;
  while ((m = tagRe.exec(src))) {
    const [, close, name, attrSrc, selfClose] = m;
    if (name === '?xml' || name.startsWith('!')) continue;
    if (close) { if (stack.length > 1) stack.pop(); continue; }
    const attrs = {};
    const aRe = /([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let a;
    while ((a = aRe.exec(attrSrc))) attrs[a[1]] = a[3] !== undefined ? a[3] : a[4];
    const node = { tag: name.replace(/^.*:/, ''), attrs, kids: [], parent: stack[stack.length - 1] };
    stack[stack.length - 1].kids.push(node);
    if (!selfClose) stack.push(node);
  }
  return root;
}

// ── Affine transforms [a,b,c,d,e,f]: x' = a·x + c·y + e, y' = b·x + d·y + f ──
const I = [1, 0, 0, 1, 0, 0];
function compose(A, B) {
  return [
    A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
  ];
}
function parseTransform(s) {
  let T = I;
  for (const m of (s || '').matchAll(/([a-zA-Z]+)\s*\(([^)]*)\)/g)) {
    const n = m[2].split(/[\s,]+/).map(Number).filter((v) => !Number.isNaN(v));
    let U;
    if (m[1] === 'translate') U = [1, 0, 0, 1, n[0], n[1] || 0];
    else if (m[1] === 'matrix') U = n.slice(0, 6);
    else if (m[1] === 'scale') U = [n[0], 0, 0, n.length > 1 ? n[1] : n[0], 0, 0];
    else throw new Error(`unhandled transform "${m[1]}"`);
    T = compose(T, U);
  }
  return T;
}
const chainT = (node) => {
  let T = I;
  const stack = [];
  for (let n = node; n; n = n.parent) stack.push(n);
  for (const n of stack.reverse()) T = compose(T, parseTransform(n.attrs.transform));
  return T;
};

// ── Path: parse (absolute+relative M L H V C Z) → absolute segments ────────
function parsePath(d) {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || [];
  let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, cmd = null;
  const segs = [];
  const num = () => parseFloat(toks[i++]);
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === 'M') {
      let x = num(), y = num(); if (rel) { x += cx; y += cy; }
      cx = x; cy = y; sx = x; sy = y; segs.push(['M', x, y]);
      cmd = rel ? 'l' : 'L'; // extra coord pairs after an M are implicit linetos
    } else if (C === 'L') {
      let x = num(), y = num(); if (rel) { x += cx; y += cy; } cx = x; cy = y; segs.push(['L', x, y]);
    } else if (C === 'H') {
      let x = num(); if (rel) x += cx; cx = x; segs.push(['L', cx, cy]);
    } else if (C === 'V') {
      let y = num(); if (rel) y += cy; cy = y; segs.push(['L', cx, cy]);
    } else if (C === 'C') {
      let x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
      if (rel) { x1 += cx; y1 += cy; x2 += cx; y2 += cy; x += cx; y += cy; }
      cx = x; cy = y; segs.push(['C', x1, y1, x2, y2, x, y]);
    } else if (C === 'Z') {
      cx = sx; cy = sy; segs.push(['Z']);
    } else {
      throw new Error(`unhandled path command "${cmd}" — this heart SVG was `
        + 'expected to use only M L H V C Z; a new command means the parser needs it');
    }
  }
  return segs;
}
function applyAffine(segs, T) {
  const [a, b, c, d, e, f] = T;
  const pt = (x, y) => [a * x + c * y + e, b * x + d * y + f];
  return segs.map((s) => {
    if (s[0] === 'M' || s[0] === 'L') { const [x, y] = pt(s[1], s[2]); return [s[0], x, y]; }
    if (s[0] === 'C') {
      const [x1, y1] = pt(s[1], s[2]), [x2, y2] = pt(s[3], s[4]), [x, y] = pt(s[5], s[6]);
      return ['C', x1, y1, x2, y2, x, y];
    }
    return s;
  });
}

const num1 = (v) => { const s = v.toFixed(1); return s.endsWith('.0') ? s.slice(0, -2) : s; };
function segStr(segs) {
  return segs.map((s) => {
    if (s[0] === 'M' || s[0] === 'L') return `${s[0]}${num1(s[1])},${num1(s[2])}`;
    if (s[0] === 'C') return `C${num1(s[1])},${num1(s[2])} ${num1(s[3])},${num1(s[4])} ${num1(s[5])},${num1(s[6])}`;
    return 'Z';
  }).join('');
}

// Rough polygon per subpath (segment endpoints) → area-weighted centroid of the
// biggest subpath, for the locator ring.
function anchor(segs) {
  const subs = [];
  let cur = [];
  for (const s of segs) {
    if (s[0] === 'M') { if (cur.length) subs.push(cur); cur = [[s[1], s[2]]]; }
    else if (s[0] === 'L') cur.push([s[1], s[2]]);
    else if (s[0] === 'C') cur.push([s[5], s[6]]);
  }
  if (cur.length) subs.push(cur);
  let best = null, bestA = -1;
  for (const pts of subs) {
    if (pts.length < 3) continue;
    let A = 0, cxs = 0, cys = 0;
    for (let k = 0; k < pts.length; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % pts.length];
      const cr = x0 * y1 - x1 * y0; A += cr; cxs += (x0 + x1) * cr; cys += (y0 + y1) * cr;
    }
    A /= 2;
    if (Math.abs(A) > bestA) { bestA = Math.abs(A); best = Math.abs(A) > 1e-6 ? [cxs / (6 * A), cys / (6 * A)] : pts[0]; }
  }
  return best;
}

// ── Read, flatten, group, fit ─────────────────────────────────────────────
const doc = parseXML(readFileSync(SRC, 'utf8'));
const byId = {};
(function walk(n) { if (n.attrs.id) byId[n.attrs.id] = n; n.kids.forEach(walk); })(doc);

// Flatten each source id into world-space absolute segments.
const flat = {};
for (const id of Object.keys(PARTS)) {
  const node = byId[id];
  if (!node) throw new Error(`source id "${id}" not found in ${SRC}`);
  flat[id] = applyAffine(parsePath(node.attrs.d), chainT(node));
}

// Global bbox of the VISIBLE ink → a scale+translate that fits the drawing into
// a 1000-wide box with a margin. Cubics are sampled along the curve rather than
// bounded by their control points — a control point can sit far outside the
// curve it shapes, which would inflate the box (and the diagram's aspect) with
// empty space.
let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
const see = (x, y) => {
  minx = Math.min(minx, x); maxx = Math.max(maxx, x);
  miny = Math.min(miny, y); maxy = Math.max(maxy, y);
};
for (const segs of Object.values(flat)) {
  let px = 0, py = 0;
  for (const s of segs) {
    if (s[0] === 'M' || s[0] === 'L') { see(s[1], s[2]); px = s[1]; py = s[2]; }
    else if (s[0] === 'C') {
      for (let n = 1; n <= 8; n++) {
        const t = n / 8, u = 1 - t;
        see(u * u * u * px + 3 * u * u * t * s[1] + 3 * u * t * t * s[3] + t * t * t * s[5],
          u * u * u * py + 3 * u * u * t * s[2] + 3 * u * t * t * s[4] + t * t * t * s[6]);
      }
      px = s[5]; py = s[6];
    }
  }
}
const scale = (W - 2 * MARGIN) / (maxx - minx);
const H = Math.ceil((maxy - miny) * scale + 2 * MARGIN);
const fit = [scale, 0, 0, scale, MARGIN - minx * scale, MARGIN - miny * scale];

// Merge the source ids that share a classroom name, in a stable order.
const order = [];
const merged = {};
for (const [id, [name, hint, grade]] of Object.entries(PARTS)) {
  const segs = applyAffine(flat[id], fit);
  if (!merged[name]) { merged[name] = { name, hint, grade, segList: [] }; order.push(name); }
  const m = merged[name];
  if (hint) { m.hint = hint; m.grade = grade; } // the primary piece carries the text
  m.segList.push(segs);
}

const rows = order.map((name) => {
  const m = merged[name];
  const all = m.segList.flat();
  const d = m.segList.map(segStr).join('');
  const a = anchor(all);
  if (!a) throw new Error(`no anchor for ${name}`);
  if (!m.hint) throw new Error(`no hint for ${name}`);
  if (m.hint.toLowerCase().includes(name.toLowerCase())) throw new Error(`clue names itself: ${name}`);
  return { name, hint: m.hint, grade: m.grade, cx: Math.round(a[0] * 10) / 10, cy: Math.round(a[1] * 10) / 10, d };
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
  `  [${JSON.stringify(r.name)}, ${JSON.stringify(r.hint)}, ${r.grade}, ${r.cx}, ${r.cy}, ${JSON.stringify(r.d)}],`).join('\n');

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

   Each row: [name, hint, grade, cx, cy, path]. \`grade\` tiers the parts by
   difficulty (chambers early, valves senior); topicPool filters on it. This
   file is LAZY-LOADED — never import it statically from index.js.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${W};
export const MAP_H = ${H};
export const CREDIT = ${JSON.stringify(CREDIT)};

const RAW = [
${body}
];

export const PARTS = RAW.map(([name, hint, grade, cx, cy, d]) => ({ name, hint, grade, cx, cy, d }));

// Shaped like any other topic's words: the part's NAME is the word, its
// description is the clue, \`g\` tiers it by grade (topicPool filters on it),
// and \`part\` carries the drawing the game lights up.
export const GAME_PARTS = PARTS.map((c) => ({ w: c.name, d: c.hint, g: c.grade, part: c }));
`;

writeFileSync(OUT, out);
console.log(`wrote ${OUT.split(/[\\/]/).slice(-4).join('/')}`);
