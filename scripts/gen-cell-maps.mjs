/* Generates data/vocab/cells/plant-cell.js and data/vocab/cells/animal-cell.js —
   the two drawn CELL diagrams (name the lit PART), in the same shape every
   single-figure map uses (PARTS {name,hint,grade,fill,cx,cy,d}, GAME_PARTS
   {w,d,g,part}), so the existing renderer draws them unchanged.

   UNLIKE the organ maps these are NOT traced from a source diagram — a
   textbook cell is a schematic, not a specimen, so it is cheaper and cleaner to
   COMPOSE it from primitives here than to trace someone else's drawing and owe
   their licence. Everything below is generated maths: rounded rectangles for
   the plant's wall, a wobbled radial loop for the animal's membrane, ellipses
   for the organelles, offset ribbons for the ER and nested domes for the Golgi.
   Nothing is copied, so both output files are ours and carry no CREDIT.

   RE-RUN (whenever a part moves or a hint changes): no deps, no source file.
     node scripts/gen-cell-maps.mjs

   Parts carry a `grade`: the seven a primary child is taught come in at 5, the
   organelles arrive as the syllabus does, and the senior-only detail (tonoplast,
   plasmodesma, centriole) waits for 10–11. topicPool filters on it, so one
   diagram serves Grade 5 and Grade 12 without lying to either. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'cells');
const W = 1000, H = 720;
const TAU = Math.PI * 2;
const rad = (deg) => (deg * Math.PI) / 180;

/* ── path primitives ──────────────────────────────────────────────────── */

const F = (n) => Math.round(n * 10) / 10;
const P = ([x, y]) => `${F(x)},${F(y)}`;

/** A closed (or open) curve through `pts`, Catmull-Rom converted to cubics —
    every organic outline here is a sampled point list, drawn smooth. */
function smooth(pts, closed = true) {
  const n = pts.length;
  const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${P(at(0))}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return closed ? `${d}Z` : d;
}

/** An ellipse as two arcs. `dir` flips the winding — a ring is the outer shape
    one way round and the inner shape the other, so the hole stays a hole under
    the default nonzero fill rule. */
function ellipse(cx, cy, rx, ry, rot = 0, dir = 1) {
  const t = rad(rot);
  const at = (u, v) => [cx + u * Math.cos(t) - v * Math.sin(t), cy + u * Math.sin(t) + v * Math.cos(t)];
  const a = at(-rx, 0), b = at(rx, 0);
  const s = dir === 1 ? 1 : 0;
  return `M${P(a)}A${F(rx)},${F(ry)} ${F(rot)} 0 ${s} ${P(b)}A${F(rx)},${F(ry)} ${F(rot)} 0 ${s} ${P(a)}Z`;
}

const circle = (cx, cy, r, dir = 1) => ellipse(cx, cy, r, r, 0, dir);

/** A rounded rectangle, clockwise (dir 1) or anticlockwise (dir -1). */
function rrect(x, y, w, h, r, dir = 1) {
  const x2 = x + w, y2 = y + h;
  if (dir === 1) {
    return `M${F(x + r)},${F(y)}H${F(x2 - r)}A${F(r)},${F(r)} 0 0 1 ${F(x2)},${F(y + r)}`
      + `V${F(y2 - r)}A${F(r)},${F(r)} 0 0 1 ${F(x2 - r)},${F(y2)}`
      + `H${F(x + r)}A${F(r)},${F(r)} 0 0 1 ${F(x)},${F(y2 - r)}`
      + `V${F(y + r)}A${F(r)},${F(r)} 0 0 1 ${F(x + r)},${F(y)}Z`;
  }
  return `M${F(x + r)},${F(y)}A${F(r)},${F(r)} 0 0 0 ${F(x)},${F(y + r)}`
    + `V${F(y2 - r)}A${F(r)},${F(r)} 0 0 0 ${F(x + r)},${F(y2)}`
    + `H${F(x2 - r)}A${F(r)},${F(r)} 0 0 0 ${F(x2)},${F(y2 - r)}`
    + `V${F(y + r)}A${F(r)},${F(r)} 0 0 0 ${F(x2 - r)},${F(y)}Z`;
}

/** A wobbled radial loop — the animal cell's outline. `wobble` is a list of
    [amplitude, cycles, phase] harmonics; nothing random, so a re-run of this
    script produces byte-identical output. */
function loop(cx, cy, rx, ry, wobble = [], n = 84) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    let f = 1;
    for (const [amp, k, ph] of wobble) f += amp * Math.sin(k * a + ph);
    pts.push([cx + rx * f * Math.cos(a), cy + ry * f * Math.sin(a)]);
  }
  return pts;
}

/** `pts` moved `d` units along the inward normal (toward the loop's centroid).
    Used for every membrane band: the same outline, offset, is its inner edge. */
function inset(pts, d) {
  const n = pts.length;
  const cen = pts.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0]);
  const push = (sign) => pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / L) * d * sign, p[1] + (dx / L) * d * sign];
  });
  const spread = (list) => list.reduce((s, p) => s + Math.hypot(p[0] - cen[0], p[1] - cen[1]), 0);
  const a = push(1), b = push(-1);
  return spread(a) < spread(b) ? a : b; // whichever shrank is the inward one
}

/** A closed band between a loop and the same loop inset by `t` — a membrane. */
const band = (pts, t) => `${smooth(pts)}${smooth(inset(pts, t).reverse())}`;

/** A ribbon of thickness `t` laid along a centreline — the ER's folded sheets. */
function ribbon(line, t) {
  const out = [], inn = [];
  line.forEach((p, i) => {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    out.push([p[0] - (dy / L) * (t / 2), p[1] + (dx / L) * (t / 2)]);
    inn.push([p[0] + (dy / L) * (t / 2), p[1] - (dx / L) * (t / 2)]);
  });
  return smooth([...out, ...inn.reverse()]);
}

/** A wavy centreline from a to b, `amp` across the direction of travel. */
function wave(ax, ay, bx, by, amp, cycles, n = 26) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const s = Math.sin(u * cycles * TAU) * amp;
    pts.push([ax + dx * u + nx * s, ay + dy * u + ny * s]);
  }
  return pts;
}

/** One curved sac of a Golgi stack: the area between two concentric arcs. */
function sac(cx, cy, rx, ry, t, a0, a1, n = 22) {
  const out = [], inn = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    inn.push([cx + (rx - t) * Math.cos(a), cy + (ry - t) * Math.sin(a)]);
  }
  return smooth([...out, ...inn.reverse()]);
}

/** A local → world transform for anything drawn inside a rotated organelle. */
const place = (cx, cy, rot) => (u, v) => {
  const t = rad(rot);
  return [cx + u * Math.cos(t) - v * Math.sin(t), cy + u * Math.sin(t) + v * Math.cos(t)];
};

const line = (a, b) => `M${P(a)}L${P(b)}`;

/* ── organelle builders (shape + the decor drawn over it) ─────────────── */

/** A mitochondrion: the outer oval, with cristae folding in from either wall. */
function mitochondrion(cx, cy, rx, ry, rot) {
  const at = place(cx, cy, rot);
  const shape = ellipse(cx, cy, rx, ry, rot);
  let decor = '';
  for (let i = -2; i <= 2; i++) {
    const u = i * rx * 0.32;
    const up = i % 2 === 0 ? -1 : 1;
    decor += smooth([at(u, up * ry * 0.86), at(u + rx * 0.1, up * ry * 0.3),
      at(u - rx * 0.08, -up * ry * 0.25), at(u + rx * 0.04, -up * ry * 0.62)], false);
  }
  return { shape, decor };
}

/** A chloroplast: the green oval, with grana drawn as stacks of short bars. */
function chloroplast(cx, cy, rx, ry, rot) {
  const at = place(cx, cy, rot);
  const shape = ellipse(cx, cy, rx, ry, rot);
  let decor = '';
  [[-0.45, -0.3], [0.05, 0.28], [0.5, -0.22]].forEach(([u, v]) => {
    for (let k = -1; k <= 1; k++) {
      const y = v * ry + k * 7;
      decor += line(at(u * rx - 12, y), at(u * rx + 12, y));
    }
  });
  // The lamellae linking the stacks.
  decor += smooth([at(-rx * 0.7, -ry * 0.15), at(-rx * 0.2, ry * 0.1),
    at(rx * 0.25, -ry * 0.05), at(rx * 0.72, ry * 0.12)], false);
  return { shape, decor };
}

/** A Golgi body: four nested domes, smallest at the top of the stack. */
function golgi(cx, cy, rx, ry, n = 4) {
  let shape = '';
  for (let i = 0; i < n; i++) {
    shape += sac(cx, cy, rx - i * 16, ry - i * 9, 12, 196, 344);
  }
  return shape;
}

/** Free ribosomes: a scatter of grains, one path, drawn where there is room. */
const ribosomes = (spots, r = 8) => spots.map(([x, y]) => circle(x, y, r)).join('');

// A tick standing off a point, `from` units out along (nx, ny) and `len` long.
const tick = (p, nx, ny, from, len) =>
  line([p[0] + nx * from, p[1] + ny * from], [p[0] + nx * (from + len), p[1] + ny * (from + len)]);

/** The ticks that make rough ER rough — ribosomes studding both faces. */
function studs(centre, t) {
  let d = '';
  centre.forEach((p, i) => {
    if (i % 3 !== 1) return;
    const a = centre[Math.max(0, i - 1)], b = centre[Math.min(centre.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    d += tick(p, nx, ny, t / 2, 5) + tick(p, -nx, -ny, t / 2, 5);
  });
  return d;
}

/** The pores that pepper a nuclear envelope — short radial ticks across it. */
function pores(cx, cy, r, t, count = 10) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + 0.3;
    const c = Math.cos(a), s = Math.sin(a);
    d += line([cx + c * (r - 1), cy + s * (r - 1)], [cx + c * (r + t + 1), cy + s * (r + t + 1)]);
  }
  return d;
}

/* ── THE PLANT CELL ───────────────────────────────────────────────────── */

function plantCell() {
  const decor = [];
  const parts = [];
  const add = (name, hint, grade, fill, cx, cy, d) => parts.push([name, hint, grade, fill, cx, cy, d]);

  // The three nested boxes: wall (34→60), membrane (60→72), cytoplasm inside.
  add('cell wall', 'The stiff outer jacket that gives a plant cell its box shape.', 5,
    '#cbb98c', 200, 47, rrect(34, 34, 932, 652, 56) + rrect(60, 60, 880, 600, 38, -1));
  add('cell membrane', 'The thin skin just inside the wall that lets things in and out.', 5,
    '#e2a077', 320, 66, rrect(60, 60, 880, 600, 38) + rrect(72, 72, 856, 576, 30, -1));
  add('cytoplasm', 'The jelly that fills the cell and holds everything in place.', 5,
    '#f0e6cd', 665, 480, rrect(72, 72, 856, 576, 30));

  // The sap vacuole: most of the middle, as it is in the real thing.
  const vac = loop(420, 330, 232, 148, [[0.03, 3, 0.7], [0.02, 5, 2.2]]);
  add('vacuole', 'The big sap-filled bag that keeps the plant cell firm.', 5,
    '#a9d3ea', 420, 330, smooth(vac));
  add('tonoplast', 'The membrane that wraps the big sap-filled bag.', 11,
    '#6fa8cc', 420, 182, band(vac, 11));

  // The nucleus, in the corridor to the right of the vacuole.
  add('nucleus', "The control room that stores the cell's instructions.", 5,
    '#b79ad6', 795, 215, circle(795, 215, 92));
  add('nuclear membrane', 'The double skin around the control room, pierced with pores.', 7,
    '#8f6fbb', 795, 307, circle(795, 215, 104) + circle(795, 215, 92, -1));
  add('nucleolus', 'The dark spot inside the nucleus where ribosomes are made.', 5,
    '#75529f', 818, 194, circle(818, 194, 33));
  decor.push(pores(795, 215, 92, 12));

  // Chloroplasts — the part that makes this a PLANT cell.
  const chloros = [[170, 148, -30], [358, 132, 8], [588, 134, -12], [370, 585, 15], [645, 508, -10]];
  let chShape = '', chDecor = '';
  for (const [x, y, r] of chloros) {
    const c = chloroplast(x, y, 66, 36, r);
    chShape += c.shape; chDecor += c.decor;
  }
  add('chloroplast', 'The green packet that traps sunlight to make food.', 5, '#8bbd6e', 170, 148, chShape);
  decor.push(chDecor);

  const mitos = [[135, 300, 78], [540, 592, -8], [870, 560, 65]];
  let mShape = '', mDecor = '';
  for (const [x, y, r] of mitos) {
    const m = mitochondrion(x, y, 62, 33, r);
    mShape += m.shape; mDecor += m.decor;
  }
  add('mitochondrion', 'The bean-shaped powerhouse that releases energy from food.', 5,
    '#dd7a68', 135, 300, mShape);
  decor.push(mDecor);

  // Rough ER below the nucleus, smooth ER down in the bottom-left.
  const rer = wave(686, 402, 906, 428, 26, 1.25);
  add('rough endoplasmic reticulum', 'The folded sheets studded with grains that build proteins.', 9,
    '#d69f5c', 796, 415, ribbon(rer, 22));
  decor.push(studs(rer, 22));
  const ser = wave(102, 528, 272, 596, 26, 1.1);
  add('smooth endoplasmic reticulum', 'The smooth tubes that make fats and store them.', 10,
    '#e6c07d', 187, 562, ribbon(ser, 18));

  add('Golgi apparatus', 'The stack of sacs that packages and posts what the cell makes.', 9,
    '#dfa2c4', 722, 585, golgi(722, 600, 86, 52));

  add('ribosome', 'A tiny grain where proteins are put together.', 7, '#7a6448', 430, 500,
    ribosomes([[110, 200], [96, 402], [255, 92], [462, 96], [700, 96], [890, 92],
      [152, 478], [250, 492], [430, 500], [700, 616], [902, 332], [330, 636]]));

  // Plasmodesmata: channels bored right through the wall, top, left and bottom.
  add('plasmodesma', 'A tiny channel through the wall that links one cell to the next.', 11,
    '#b0864f', 480, 53,
    rrect(467, 30, 26, 46, 8) + rrect(30, 367, 46, 26, 8) + rrect(747, 644, 26, 46, 8));

  return {
    title: 'PLANT CELL',
    blurb: 'A schoolbook plant cell in section — the boxy wall, the sap vacuole that\n'
      + '   fills the middle, and the chloroplasts that make it a plant.',
    parts, decor: decor.join(''),
  };
}

/* ── THE ANIMAL CELL ──────────────────────────────────────────────────── */

function animalCell() {
  const decor = [];
  const parts = [];
  const add = (name, hint, grade, fill, cx, cy, d) => parts.push([name, hint, grade, fill, cx, cy, d]);

  // No wall, so the outline is a soft irregular blob rather than a box.
  const outer = loop(500, 360, 448, 316, [[0.035, 3, 0.6], [0.022, 5, 2.4], [0.015, 2, 1.1]]);
  const inner = inset(outer, 17);
  add('cell membrane', 'The thin skin that holds the cell in and lets things pass.', 5,
    '#e2a077', ...membraneAnchor(outer, inner), band(outer, 17));
  add('cytoplasm', 'The jelly that fills the cell and holds everything in place.', 5,
    '#f5ecd8', 690, 330, smooth(inner));

  add('nucleus', "The control room that stores the cell's instructions.", 5,
    '#b79ad6', 330, 330, circle(330, 330, 115));
  add('nuclear membrane', 'The double skin around the control room, pierced with pores.', 7,
    '#8f6fbb', 330, 445, circle(330, 330, 129) + circle(330, 330, 115, -1));
  add('nucleolus', 'The dark spot inside the nucleus where ribosomes are made.', 5,
    '#75529f', 306, 306, circle(306, 306, 42));
  decor.push(pores(330, 330, 115, 14));

  const mitos = [[660, 240, -25], [772, 382, 75], [622, 498, 20]];
  let mShape = '', mDecor = '';
  for (const [x, y, r] of mitos) {
    const m = mitochondrion(x, y, 72, 38, r);
    mShape += m.shape; mDecor += m.decor;
  }
  add('mitochondrion', 'The bean-shaped powerhouse that releases energy from food.', 5,
    '#dd7a68', 660, 240, mShape);
  decor.push(mDecor);

  const rer = wave(508, 178, 526, 432, 38, 1.15);
  add('rough endoplasmic reticulum', 'The folded sheets studded with grains that build proteins.', 9,
    '#d69f5c', 517, 305, ribbon(rer, 22));
  decor.push(studs(rer, 22));
  const ser = wave(174, 432, 302, 548, 26, 1.15);
  add('smooth endoplasmic reticulum', 'The smooth tubes that make fats and store them.', 10,
    '#e6c07d', 238, 490, ribbon(ser, 18));

  add('Golgi apparatus', 'The stack of sacs that packages and posts what the cell makes.', 9,
    '#dfa2c4', 434, 540, golgi(434, 566, 88, 54));

  add('lysosome', 'The little bag of chemicals that breaks down worn-out parts.', 5,
    '#c2739a', 196, 236, circle(196, 236, 25) + circle(612, 342, 22) + circle(524, 596, 23));
  add('peroxisome', 'The small bubble that breaks down poisons the cell has made.', 11,
    '#9dbe8b', 238, 200, circle(238, 200, 18) + circle(676, 560, 16));
  add('vesicle', 'A small bubble that carries goods around the cell.', 9,
    '#f0c9a0', 392, 470, circle(392, 470, 15) + circle(360, 618, 14) + circle(466, 612, 13));
  add('vacuole', 'A small storage bag for water, food or waste.', 5,
    '#a9d3ea', 344, 162, circle(344, 162, 32) + circle(742, 520, 30));

  // The centrosome's pair of barrels, one end-on, one side-on.
  add('centriole', 'The pair of tiny barrels that help the cell divide.', 10,
    '#7f9bb5', 590, 148, rrect(566, 120, 48, 26, 9) + rrect(624, 126, 26, 62, 9));

  add('ribosome', 'A tiny grain where proteins are put together.', 7, '#7a6448', 430, 250,
    ribosomes([[430, 250], [372, 196], [250, 612], [648, 608], [820, 250],
      [846, 470], [186, 340], [560, 92], [706, 132], [268, 120]]));

  return {
    title: 'ANIMAL CELL',
    blurb: 'A schoolbook animal cell — no wall and no chloroplasts, so the membrane is\n'
      + '   a soft blob and the nucleus sits in open cytoplasm.',
    parts, decor: decor.join(''),
  };
}

/** A point in the middle of the membrane band, at the top of the cell — where
    the locator ring should sit when the membrane itself is the answer. */
function membraneAnchor(outer, inner) {
  let best = 0;
  outer.forEach((p, i) => { if (p[1] < outer[best][1]) best = i; });
  return [F((outer[best][0] + inner[best][0]) / 2), F((outer[best][1] + inner[best][1]) / 2)];
}

/* ── emit ─────────────────────────────────────────────────────────────── */

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

function emit(file, { title, blurb, parts, decor }) {
  const rows = parts.map(([name, hint, grade, fill, cx, cy, d]) =>
    `  ["${esc(name)}", "${esc(hint)}", ${grade}, "${fill}", ${F(cx)}, ${F(cy)}, "${d}"],`).join('\n');
  const src = `/* ═══════════════════════════════════════════════════════
   ${title} — the schoolbook diagram, name the lit PART. COMPOSED, not traced:
   every path is generated maths (see scripts/gen-cell-maps.mjs), so this file
   is ours and owes no attribution — there is no CREDIT export and the game
   draws no credit line for it.

   ${blurb}

   Each row: [name, hint, grade, fill, cx, cy, path]. \`grade\` tiers the parts by
   difficulty — the basics at 5, the organelles as the syllabus introduces them,
   the senior detail at 10–11 — and topicPool filters on it. DECOR is the cristae,
   grana, nuclear pores and ER studs: drawn over the parts, never quizzed.

   GENERATED by scripts/gen-cell-maps.mjs — do not edit by hand. LAZY-LOADED —
   never import it statically from index.js.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${W};
export const MAP_H = ${H};
export const DECOR = "${decor}";

const RAW = [
${rows}
];

export const PARTS = RAW.map(([name, hint, grade, fill, cx, cy, d]) => ({ name, hint, grade, fill, cx, cy, d }));

// Shaped like any other topic's words: the part's NAME is the word, its
// description is the clue, \`g\` tiers it by grade (topicPool filters on it),
// and \`part\` carries the drawing the game lights up.
export const GAME_PARTS = PARTS.map((c) => ({ w: c.name, d: c.hint, g: c.grade, part: c }));
`;
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, file), src);
  console.log(`${file}: ${parts.length} parts, ${(src.length / 1024).toFixed(1)} KB`);
}

emit('plant-cell.js', plantCell());
emit('animal-cell.js', animalCell());
