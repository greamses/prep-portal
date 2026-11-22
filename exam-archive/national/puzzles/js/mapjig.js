/* ═══════════════════════════════════════════════════════
   PUZZLES — Figure jigsaw (Map of Nigeria, and the biology diagrams)

   A jigsaw whose pieces are the PARTS of one figure: the 37 states of Nigeria,
   or the parts of the ear, the eye, the heart, the brain. There is no separate
   pile: the pieces are POURED straight onto the figure and you drag each one to
   where it belongs. A piece SNAPS and locks when it lands near its true spot —
   a classic jigsaw, where placing pieces at their correct positions makes their
   edges line up.

   The trick: every piece is drawn in the WHOLE figure's coordinate system
   (its viewBox) showing only its own part, so at offset (0,0) the part sits
   exactly home. Scattering = translating the piece's inner <g>; dragging
   changes that offset; a small-enough offset on release snaps it home.

   Two kinds of figure, one game:
     FLAT  (Nigeria, heart, brain) — each part is a coloured region `d`; a
           piece is that region filled in its colour.
     RICH  (ear, eye — traced pictures, see tools/figure-trace) — the figure is
           a whole picture (`SVG`) and each part carries its outline `shape`; a
           piece is the PICTURE clipped to that outline, so it keeps every line
           and shade of the drawing. The frame shows the rest of the picture
           with the parts cut out.

   A sticky-note "outlines" toggle shows or hides the part outlines in the frame:
   ON = the subdivisions are drawn as a guide; OFF = place by shape alone.
   It rides the room doc in `tiles` as '<figure>' / '<figure>-blank'.

   Figure data is the Vocab game's (data/vocab/…), loaded on demand — the
   Nigeria map is the only one imported up front. One shared `seed` → the same
   scatter on every device.
═══════════════════════════════════════════════════════ */
import * as nigeria from '/data/vocab/nigeria-map.js';
import { mulberry32 } from './rng.js';

// Soft fill per geopolitical zone, so the finished map reads as regions.
export const ZONE_FILL = {
  'n-central': '#e7c15b', 'n-east': '#7fb3d5', 'n-west': '#e08f6a',
  's-east': '#8bc48a', 's-south': '#b593c9', 's-west': '#e6a0b8',
};
// The six zones in a fixed order, with their names — for the on-map colour key.
export const ZONES = [
  { key: 'n-central', label: 'North Central' },
  { key: 'n-east', label: 'North East' },
  { key: 'n-west', label: 'North West' },
  { key: 's-east', label: 'South East' },
  { key: 's-south', label: 'South South' },
  { key: 's-west', label: 'South West' },
];

/* Every figure the jigsaw can be. `group` sorts the setup choices; `module` is
   the Vocab figure (lazy). The key is what `tiles` carries, so it is also in
   firestore.rules' puzzleRooms tiles list — add a figure there too. */
// `short` is the setup note's label; `tip` the hover tooltip with the details.
export const JIGSAW_FIGURES = [
  { key: 'nigeria', label: 'Map of Nigeria', short: 'Nigeria', tip: 'Drag the 37 states home onto the map', group: 'map' },
  { key: 'ear', label: 'The Ear', short: 'Ear', tip: 'The outer, middle and inner ear — 13 parts', group: 'biology', module: '/data/vocab/organs/ear.js' },
  { key: 'eye', label: 'The Eye', short: 'Eye', tip: 'Lens, iris, retina and more — 13 parts', group: 'biology', module: '/data/vocab/organs/eye.js' },
  { key: 'heart', label: 'The Heart', short: 'Heart', tip: 'The four chambers, the great vessels and the valves', group: 'biology', module: '/data/vocab/organs/heart.js' },
  { key: 'brain', label: 'The Brain', short: 'Brain', tip: 'The brain from the side — its lobes and stem', group: 'biology', module: '/data/vocab/organs/brain.js' },
  { key: 'brain-section', label: 'Inside the Brain', short: 'Brain cut', tip: 'The brain cut down the middle — 14 parts inside', group: 'biology', module: '/data/vocab/organs/brain-section.js' },
];
export const figureInfo = (key) => JIGSAW_FIGURES.find((f) => f.key === key);
// 'ear-blank' → { key: 'ear', blank: true }; null when `tiles` is no figure.
export function parseFigureTiles(tiles) {
  if (typeof tiles !== 'string') return null;
  const blank = tiles.endsWith('-blank');
  const key = blank ? tiles.slice(0, -6) : tiles;
  return figureInfo(key) ? { key, blank } : null;
}

/* A loaded figure, normalised:
   { key, label, W, H, rich, art, credit, pieces:[{ name, d, fill, cx, cy }] }
   `d` is the part's outline (a region for FLAT, the traced shape for RICH). */
const cache = new Map();
export async function loadFigure(key) {
  if (cache.has(key)) return cache.get(key);
  const info = figureInfo(key);
  let fig;
  if (key === 'nigeria') {
    fig = {
      key, label: info.label, W: nigeria.MAP_W, H: nigeria.MAP_H, rich: false, art: '', credit: '',
      pieces: nigeria.STATES.map((s) => ({ name: s.name, d: s.d, fill: ZONE_FILL[s.zone] || '#cbb98f', cx: s.cx, cy: s.cy })),
    };
  } else {
    const m = await import(info.module);
    const rich = !!m.RICH;
    fig = {
      key, label: info.label, W: m.MAP_W, H: m.MAP_H, rich, art: rich ? m.SVG : '', credit: m.CREDIT || '',
      pieces: m.PARTS.map((p) => ({ name: p.name, d: rich ? p.shape : p.d, fill: p.fill || '#cbb98f', cx: p.cx, cy: p.cy })),
    };
  }
  cache.set(key, fig);
  return fig;
}
// The figure startRound uses — loadFigure() must have resolved first.
export const loadedFigure = (key) => cache.get(key) || null;

// How close a piece must land to its home to snap in — the difficulty setting,
// since nothing is pre-placed. In thousandths of the figure's WIDTH (the Nigeria
// map is 1000 wide, where these were tuned), so a figure of any size plays alike.
export const SNAP_TOLERANCE = { easy: 78, medium: 52, hard: 32 };
export const snapTolerance = (fig, difficulty) =>
  ((SNAP_TOLERANCE[difficulty] ?? SNAP_TOLERANCE.medium) * fig.W) / 1000;

// { heap:[{piece, ox, oy}], movableCount }. Nothing is pre-placed — every part
// is a loose piece, poured onto the figure. `piece` is the part index; ox/oy
// its starting offset from home, scattered so each part's centre lands
// somewhere on the figure. Seeded, so every client pours the pieces the same way.
export function generateMapJigsaw(seed, fig) {
  const rng = mulberry32(seed);
  const order = fig.pieces.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const mx = fig.W * 0.09, my = fig.H * 0.09;
  const heap = order.map((piece) => {
    const p = fig.pieces[piece];
    const sx = mx + rng() * (fig.W - 2 * mx); // where this part's centre lands
    const sy = my + rng() * (fig.H - 2 * my);
    return { piece, ox: sx - p.cx, oy: sy - p.cy };
  });
  return { heap, movableCount: heap.length };
}

const artId = (fig) => `mapjig-art-${fig.key}`;

// The figure beneath the pieces — the GUIDE only (nothing is pre-placed).
// FLAT: every part's slot (outlined when the guide is on, one quiet silhouette
// when off). RICH: the whole picture, with each part's slot painted over it so
// the parts are cut out — the rest of the drawing stays as context. The
// picture is defined ONCE here and the pieces <use> it.
export function mapFrameSvg(fig, showOutlines = true) {
  let slots = '';
  fig.pieces.forEach((p, i) => {
    slots += `<path class="mapjig-slot${showOutlines ? '' : ' is-blank'}" data-state="${i}" d="${p.d}"/>`;
  });
  const art = fig.rich
    ? `<defs><g id="${artId(fig)}">${fig.art}</g></defs><use href="#${artId(fig)}" class="mapjig-art"/>`
    : '';
  return `<svg class="mapjig-frame${fig.rich ? ' is-rich' : ''}" viewBox="0 0 ${fig.W} ${fig.H}" preserveAspectRatio="xMidYMid meet" `
    + `aria-hidden="true">${art}<g class="mapjig-slots">${slots}</g></svg>`;
}

// A loose piece: the whole-figure viewBox showing only part `i`, its inner <g>
// translated by (ox,oy) so it starts scattered. The <svg> ignores the pointer
// (its huge transparent area must not block pieces beneath); only the part's
// outline path catches it.
export function statePieceFullSvg(fig, i, ox, oy, showName = true) {
  const p = fig.pieces[i];
  const fs = Math.round((13 * fig.W) / 1000 * 10) / 10;
  const name = showName
    ? `<text class="mapjig-pname" x="${p.cx}" y="${p.cy}" style="font-size:${Math.max(fs, 9)}px">${p.name}</text>` : '';
  const sw = ((2.5 * fig.W) / 1000).toFixed(2);
  const body = fig.rich
    // the picture clipped to the part, then an invisible-filled outline on top
    // that carries the pointer and the edge
    ? `<clipPath id="mapjig-clip-${fig.key}-${i}"><path d="${p.d}"/></clipPath>`
      + `<g clip-path="url(#mapjig-clip-${fig.key}-${i})"><use href="#${artId(fig)}"/></g>`
      + `<path class="mapjig-ppath" d="${p.d}" fill="#000" fill-opacity="0" stroke="var(--ink)" stroke-width="${sw}" stroke-linejoin="round"/>`
    : `<path class="mapjig-ppath" d="${p.d}" fill="${p.fill}" stroke="var(--ink)" stroke-width="${sw}" stroke-linejoin="round"/>`;
  return `<svg class="mapjig-piece" viewBox="0 0 ${fig.W} ${fig.H}" preserveAspectRatio="xMidYMid meet" data-state="${i}">`
    + `<g class="mapjig-pg" transform="translate(${ox.toFixed(1)} ${oy.toFixed(1)})">`
    + body + name
    + `</g></svg>`;
}
