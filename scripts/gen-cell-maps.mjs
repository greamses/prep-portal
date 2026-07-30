/* Generates data/vocab/cells/plant-cell.js and data/vocab/cells/animal-cell.js —
   the two drawn CELL diagrams (name the lit PART), SOURCED from the Wikimedia
   diagrams by LadyofHats:

     plant   "Plant cell structure no text-2.svg"   (the label-free artwork)
             positions read off "Plant cell structure-en.svg" — same file,
             same coordinate system, labels on top
     animal  "Animal cell structure en.svg"         (labels stripped here)

   Both are PUBLIC DOMAIN (PD-user, released by the author), so nothing is owed:
   no licence to carry, no share-alike. The in-game CREDIT below is courtesy,
   not obligation.

   These are shaded illustrations, not flat regions, so they are kept as RICH
   figures exactly like the ear: the whole artwork is embedded untouched and a
   part is quizzed by dimming everything except an elliptical "spotlight" over
   it (see the rich branch in vocab game.js / main.js). That preserves the
   original drawing and can never mislabel — the spotlight just points at art
   that is already correct.

   SPOTLIGHTS ARE IN SOURCE COORDINATES — the same numbers you read off the
   labelled diagram — and this script maps them into the cropped, refitted
   1000-wide box. Most centres below are the exact endpoints of the source's OWN
   leader lines (extracted from the file), so they point where the author
   pointed; the radii are authored by eye and verified against the labelled
   render.

   RE-RUN (rarely — only to re-source): no deps. From a scratch dir:
     curl -L -o plant-src.svg \
       'https://commons.wikimedia.org/wiki/Special:FilePath/Plant%20cell%20structure%20no%20text-2.svg'
     curl -L -o animal-src.svg \
       'https://commons.wikimedia.org/wiki/Special:FilePath/Animal%20cell%20structure%20en.svg'
     node /path/to/prep-portal/scripts/gen-cell-maps.mjs

   Parts carry a `grade`: the basics at 5, the organelles as the syllabus
   introduces them, and the senior detail (thylakoid, plasmodesma, nuclear pore,
   microtubule) at 10–11. topicPool filters on it, so one diagram serves a Grade
   5 room and a Grade 12 room without lying to either. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'cells');
const OUT_W = 1000; // every figure is refitted to a 1000-wide box

/* ── the plant cell ───────────────────────────────────────────────────────
   Rows: [name, hint, grade, cx, cy, rx, ry, rot] in the SOURCE's 649×475 box.
   Hints never contain the part's own name (the check below enforces it). */
const PLANT = {
  src: 'plant-src.svg',
  out: 'plant-cell.js',
  ns: 'pc',
  title: 'THE PLANT CELL',
  label: 'The Plant Cell',
  file: 'Plant_cell_structure_no_text-2.svg',
  // The artwork's bbox in source units, measured with getBBox, plus a margin.
  crop: { x: 111, y: 76, w: 471, h: 356 },
  credit: 'Plant cell © LadyofHats · <a href="https://commons.wikimedia.org/wiki/File:Plant_cell_structure-en.svg" target="_blank" rel="noopener">public domain</a>',
  parts: [
    ['cell wall', 'The stiff outer jacket that gives this cell its box shape.', 5, 228, 158, 26, 20, -40],
    ['cell membrane', 'The thin skin just inside the stiff jacket, letting things in and out.', 5, 252, 168, 26, 13, -42],
    ['cytoplasm', 'The jelly that fills the cell and holds everything in place.', 5, 286, 292, 20, 18, 0],
    ['vacuole', 'The big sap-filled bag that keeps this cell firm.', 5, 310, 218, 48, 44, 0],
    ['tonoplast', 'The membrane wrapping the big sap-filled bag.', 10, 267, 232, 12, 26, 20],
    ['chloroplast', 'The green packet that traps sunlight to make food.', 5, 256, 185, 26, 34, 20],
    ['thylakoid membrane', 'The stacked green discs inside, where light is caught.', 11, 262, 178, 13, 11, 20],
    ['starch grain', 'The pale store of food the green packet has already made.', 10, 250, 197, 9, 8, 0],
    ['mitochondrion', 'The bean-shaped powerhouse that releases energy from food.', 5, 251, 264, 26, 16, -20],
    ['peroxisome', 'The small bubble that breaks down poisons the cell has made.', 11, 264, 291, 12, 12, 0],
    ['nucleus', "The control room that stores the cell's instructions.", 5, 388, 272, 50, 45, 0],
    ['nucleolus', 'The dark spot deep inside the control room where ribosomes are made.', 5, 390, 277, 24, 21, 0, [270, 95]],
    ['nuclear pore', 'One of the tiny holes that let messages out of the control room.', 11, 345, 252, 14, 12, 0],
    ['rough endoplasmic reticulum', 'The folded sheets studded with grains that build proteins.', 9, 352, 290, 26, 20, -20],
    ['smooth endoplasmic reticulum', 'The smooth tubes that make fats and store them.', 10, 412, 215, 32, 26, 0],
    ['ribosome', 'A tiny grain where proteins are put together.', 7, 430, 248, 14, 18, 0],
    ['Golgi apparatus', 'The stack of sacs that packages and posts what the cell makes.', 7, 313, 303, 24, 22, 0],
    ['vesicle', 'A small bubble pinched off to carry goods around the cell.', 9, 287, 313, 14, 12, 0],
    ['plasmodesma', 'A tiny channel through the wall that links one cell to the next.', 10, 340, 112, 28, 14, 0, [0, 95]],
  ],
};

/* ── the animal cell ──────────────────────────────────────────────────────
   Source box is the viewBox "-133.621 -59.397 724.464 484.476" — the negative
   origin is the label margin, which the crop below throws away. */
const ANIMAL = {
  src: 'animal-src.svg',
  out: 'animal-cell.js',
  ns: 'ac',
  title: 'THE ANIMAL CELL',
  label: 'The Animal Cell',
  file: 'Animal_cell_structure_en.svg',
  crop: { x: -37, y: 30, w: 590, h: 385 },
  credit: 'Animal cell © LadyofHats · <a href="https://commons.wikimedia.org/wiki/File:Animal_cell_structure_en.svg" target="_blank" rel="noopener">public domain</a>',
  parts: [
    ['cell membrane', 'The thin skin that holds the cell in and lets things pass.', 5, 74, 105, 26, 20, -40],
    ['cytoplasm', 'The jelly that fills the cell and holds everything in place.', 5, 150, 270, 26, 22, 0],
    ['nucleus', "The control room that stores the cell's instructions.", 5, 240, 152, 55, 46, 0],
    ['nucleolus', 'The dark spot deep inside the control room where ribosomes are made.', 5, 218, 152, 18, 15, 0],
    ['nuclear envelope', 'The double skin around the control room.', 9, 192, 150, 14, 18, 0, [0, 85]],
    ['chromatin', 'The tangled threads that carry the instructions themselves.', 10, 252, 168, 20, 16, 0, [180, 85]],
    ['mitochondrion', 'The bean-shaped powerhouse that releases energy from food.', 5, 392, 150, 40, 26, -10],
    ['ribosome', 'A tiny grain where proteins are put together.', 7, 172, 163, 14, 14, 0],
    ['rough endoplasmic reticulum', 'The folded sheets studded with grains that build proteins.', 9, 280, 160, 22, 34, 10],
    ['smooth endoplasmic reticulum', 'The smooth tubes that make fats and store them.', 9, 195, 207, 42, 24, -5],
    ['Golgi apparatus', 'The stack of sacs that packages and posts what the cell makes.', 7, 145, 150, 32, 26, -15],
    ['lysosome', 'The little bag of chemicals that breaks down worn-out parts.', 5, 380, 126, 20, 16, 0],
    ['peroxisome', 'The small bubble that breaks down poisons the cell has made.', 11, 320, 118, 12, 12, 0],
    ['centrosome', 'The pair of tiny barrels that pull the cell apart when it divides.', 10, 315, 207, 20, 22, 0],
    ['secretory vesicle', 'The bubble that carries goods to the surface and empties them out.', 9, 362, 236, 16, 14, 0],
    ['flagellum', 'The long whip the cell lashes to swim.', 5, 120, 398, 55, 20, 5, [45, 85]],
    ['microtubule', 'A stiff hollow rod that acts as a rail inside the cell.', 11, 348, 125, 12, 22, 5],
    ['cytoskeleton', 'The fine threads that criss-cross the cell and hold its shape.', 10, 185, 247, 26, 18, 0],
  ],
};

/* ── baking ───────────────────────────────────────────────────────────────
   The label machinery differs per source: the plant artwork ships label-free,
   the animal's labels are <text> plus leader lines that all carry class
   "leader" (and a <style> block, and the two marker <defs> the leaders use). */
function strip(raw) {
  return raw
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<defs>[\s\S]*?<\/defs>/, '')
    .replace(/<switch[\s\S]*?<\/switch>/g, '')
    .replace(/<text[\s\S]*?<\/text>/g, '')
    .replace(/<(line|polyline|circle|path)\b[^>]*\bclass="leader"[^>]*(?:\/>|>[\s\S]*?<\/\1>)/g, '')
    .replace(/<metadata[\s\S]*?<\/metadata>/g, '')
    // Editor leftovers (Inkscape/sodipodi). Harmless in the game, where the
    // markup is parsed as HTML, but they are undeclared namespace prefixes and
    // make the standalone tracer reference below a hard XML parse error.
    .replace(/<sodipodi:namedview[\s\S]*?(?:\/>|<\/sodipodi:namedview>)/g, '')
    .replace(/<inkscape:perspective[\s\S]*?(?:\/>|<\/inkscape:perspective>)/g, '')
    .replace(/\s(?:sodipodi|inkscape):[\w-]+="[^"]*"/g, '');
}

const F = (n) => Math.round(n * 100) / 100;
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

function bake(fig) {
  let raw = strip(readFileSync(fig.src, 'utf8'));

  // Namespace every id the markup refers to, so two figures (or the page) can
  // never collide on a gradient/pattern id.
  const refIds = new Set([...raw.matchAll(/url\(#([\w.:-]+)\)/g)].map((m) => m[1]));
  for (const id of [...refIds].concat([...raw.matchAll(/xlink:href="#([\w.:-]+)"/g)].map((m) => m[1]))) {
    raw = raw.replace(new RegExp(`id="${id}"`, 'g'), `id="${fig.ns}-${id}"`);
    raw = raw.replace(new RegExp(`url\\(#${id}\\)`, 'g'), `url(#${fig.ns}-${id})`);
    raw = raw.replace(new RegExp(`xlink:href="#${id}"`, 'g'), `xlink:href="#${fig.ns}-${id}"`);
  }
  const inner = raw.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();

  // Crop to the artwork and refit to a 1000-wide box: everything is wrapped in
  // one transform, and the spotlights below get the same mapping applied.
  const { x, y, w, h } = fig.crop;
  const s = OUT_W / w;
  const MAP_H = Math.round(h * s);
  const svg = `<g transform="scale(${F(s)}) translate(${F(-x)},${F(-y)})">${inner}</g>`;
  const map = (px, py) => [F((px - x) * s), F((py - y) * s)];

  for (const [name, hint] of fig.parts) {
    if (hint.toLowerCase().includes(name.toLowerCase())) throw new Error(`clue names itself: ${name}`);
  }
  if (/<text|class="leader"/.test(inner)) throw new Error(`${fig.out}: a label survived the strip`);
  if (new RegExp(`url\\(#(?!${fig.ns}-)[\\w.:-]+\\)`).test(inner)) throw new Error(`${fig.out}: an id escaped namespacing`);

  /* The pointer. The clue draws an ARROW at the part rather than dimming the
     rest of the figure — a diagram this detailed reads better whole. The arrow
     flies IN from the open space outside the part, i.e. along the line from the
     figure's centre outwards, so it never crosses the middle of the drawing;
     `aim` overrides that heading (degrees, 0 = flying east, 90 = flying south)
     wherever the default would come in over something else, and the second
     number lengthens or shortens the shaft.

     Its tip stops just clear of the part's own ellipse, so the arrow points at
     the thing without covering it. */
  const CX = OUT_W / 2, CY = MAP_H / 2;
  const arrowFor = ([, , , cx, cy, rx, ry, rot, aim]) => {
    const [X, Y] = map(cx, cy);
    const RX = rx * s, RY = ry * s;
    let [deg, len] = Array.isArray(aim) ? aim : [aim, null];
    if (deg == null) deg = (Math.atan2(CY - Y, CX - X) * 180) / Math.PI; // fly inwards
    len = len || 82;
    const t = (deg * Math.PI) / 180;
    const ux = Math.cos(t), uy = Math.sin(t);
    // Clearance: the ellipse's own radius along the arrow's heading, +4.
    const a = ((deg - rot) * Math.PI) / 180;
    const clear = (RX * RY) / Math.hypot(RY * Math.cos(a), RX * Math.sin(a)) + 4;
    // Clamped into the box: a part near an edge with a wide ellipse (the
    // flagellum) would otherwise put its own tip outside the frame.
    const clamp = (v, hi) => Math.max(10, Math.min(hi - 10, v));
    const tip = [clamp(X - ux * clear, OUT_W), clamp(Y - uy * clear, MAP_H)];
    // Shorten rather than run off the edge of the box.
    const room = (px, py, dx, dy) => {
      let k = len;
      if (dx) k = Math.min(k, dx < 0 ? (px - 8) / -dx : (OUT_W - 8 - px) / dx);
      if (dy) k = Math.min(k, dy < 0 ? (py - 8) / -dy : (MAP_H - 8 - py) / dy);
      return Math.max(34, k);
    };
    const back = room(tip[0], tip[1], -ux, -uy);
    return { x1: F(tip[0] - ux * back), y1: F(tip[1] - uy * back), x2: F(tip[0]), y2: F(tip[1]) };
  };

  const rows = fig.parts.map((p) => {
    const [name, hint, grade, cx, cy, rx, ry, rot] = p;
    const [X, Y] = map(cx, cy);
    const a = arrowFor(p);
    return `  ["${esc(name)}", "${esc(hint)}", ${grade}, ${X}, ${Y}, ${F(rx * s)}, ${F(ry * s)}, ${rot}, `
      + `[${a.x1}, ${a.y1}, ${a.x2}, ${a.y2}]],`;
  }).join('\n');

  const src = `/* ═══════════════════════════════════════════════════════
   ${fig.title} — the schoolbook cutaway, name the lit PART. SOURCED from the
   Wikimedia diagram "${fig.file}" by LadyofHats, baked by
   scripts/gen-cell-maps.mjs.

   PUBLIC DOMAIN (PD-user) — the author released it, so nothing is owed here:
   no licence to carry forward and no share-alike. The CREDIT below is shown
   in-game as a courtesy.

   It is a shaded illustration, not flat regions, so it is a RICH figure: the
   whole artwork is embedded as \`SVG\` and stays fully lit, and the quizzed part
   is picked out by an ARROW flown in at it (\`arrow\`, tail → tip). No per-part
   paths, so the clue can't mislabel — it points at art that is already correct.
   \`spot\` is kept too: the study view hangs each part's hover tip on it.

   Each row: [name, hint, grade, spot cx, cy, rx, ry, rot, arrow], refitted from
   the source's own coordinates to this 1000-wide box; \`arrow\` is
   [tailX, tailY, tipX, tipY]. \`grade\` tiers the parts
   by difficulty and topicPool filters on it. Adapted: labels and leader lines
   dropped, ids namespaced ("${fig.ns}-…"), cropped to the artwork.

   GENERATED — do not edit by hand. LAZY-LOADED — never import it statically.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${OUT_W};
export const MAP_H = ${MAP_H};
export const RICH = true;
export const CREDIT = "${esc(fig.credit)}";

// The full shaded artwork, cropped and scaled into the box above.
export const SVG = "${esc(svg).replace(/\r?\n\s*/g, ' ')}";

const RAW = [
${rows}
];

export const PARTS = RAW.map(([name, hint, grade, cx, cy, rx, ry, rot, a]) =>
  ({ name, hint, grade, cx, cy, spot: { cx, cy, rx, ry, rot },
    arrow: { x1: a[0], y1: a[1], x2: a[2], y2: a[3] } }));

// Same shape every topic's words take: the part NAME is the word, its
// description the clue, \`g\` tiers it by grade, and \`part\` carries the
// spotlight the game lights up.
export const GAME_PARTS = PARTS.map((c) => ({ w: c.name, d: c.hint, g: c.grade, part: c }));
`;
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, fig.out), src);

  /* The same cropped artwork as a standalone SVG, for tools/organ-tracer. Load
     it there as the reference and every path you trace comes out in THIS box's
     coordinates — so traced regions drop straight onto the baked figure with no
     refitting. That is the road to per-part regions (hover/light a real shape)
     if the arrows ever stop being enough. */
  const refDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'tools', 'organ-tracer', 'refs');
  mkdirSync(refDir, { recursive: true });
  writeFileSync(join(refDir, fig.out.replace(/\.js$/, '.svg')),
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" `
    + `width="${OUT_W}" height="${MAP_H}" viewBox="0 0 ${OUT_W} ${MAP_H}">${svg}</svg>\n`);

  console.log(`${fig.out}: ${fig.parts.length} parts, ${OUT_W}×${MAP_H}, ${(src.length / 1024).toFixed(1)} KB`);
}

bake(PLANT);
bake(ANIMAL);
