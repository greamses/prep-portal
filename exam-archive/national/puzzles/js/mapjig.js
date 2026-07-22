/* ═══════════════════════════════════════════════════════
   PUZZLES — Map jigsaw (Map of Nigeria)

   A jigsaw whose pieces are the 37 states, not a photo grid. The frame is the
   whole country as a tray of empty, NAMED slots (each state's outline with its
   name written in it); the loose state pieces are heaped below. Drag a state
   over its own slot and it clicks in and locks — a wrong slot bounces it back —
   so everything placed is correct, exactly like the photo jigsaw.

   State outlines / names / zones / centroids all come from the shared Nigeria
   map data (data/vocab/nigeria-map.js, Natural Earth, public domain). Every
   client in a room shares one `seed`, so the same pieces are pre-placed and the
   same heap scatter appears on every device.
═══════════════════════════════════════════════════════ */
import { STATES, MAP_W, MAP_H } from '/data/vocab/nigeria-map.js';
import { mulberry32 } from './rng.js';

export { MAP_W, MAP_H, STATES };

// Soft fill per geopolitical zone, so the finished map reads as regions.
export const ZONE_FILL = {
  'n-central': '#e7c15b', 'n-east': '#7fb3d5', 'n-west': '#e08f6a',
  's-east': '#8bc48a', 's-south': '#b593c9', 's-west': '#e6a0b8',
};
const fillOf = (s) => ZONE_FILL[s.zone] || '#cbb98f';
export const stateFill = (i) => fillOf(STATES[i]);

// Share of states pre-placed (locked) when the round starts — the easier the
// difficulty, the more of the map is already filled in.
const LOCKED_FRACTION = { easy: 0.3, medium: 0.14, hard: 0 };

// { locked:boolean[37], heap:[{state,x,y,rot}], movableCount }. Same seeded
// shuffle → lock → scatter as the photo jigsaw, over the 37 states.
export function generateMapJigsaw(seed, difficulty) {
  const rng = mulberry32(seed);
  const total = STATES.length;
  const frac = LOCKED_FRACTION[difficulty] ?? LOCKED_FRACTION.medium;
  const lockedCount = Math.min(Math.round(total * frac), total - 4);

  const order = STATES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const locked = new Array(total).fill(false);
  for (let k = 0; k < lockedCount; k++) locked[order[k]] = true;

  const loose = order.filter((i) => !locked[i]);
  for (let i = loose.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [loose[i], loose[j]] = [loose[j], loose[i]];
  }
  // `piece` carries the state index (0..36) — same shape as the photo jigsaw's
  // heap, so the shared drag machinery reads it the same way.
  const heap = loose.map((piece) => ({ piece, x: rng(), y: rng(), rot: Math.round((rng() * 2 - 1) * 12) }));
  return { locked, heap, movableCount: heap.length };
}

// The tray: the whole country as empty slots. The drop area stays UNlabelled —
// a state's name is revealed only once it is correctly placed (so the finished
// map ends up labelled). Each slot is a hittable <path data-state> so a drop can
// be tested with elementFromPoint.
export function mapFrameSvg(locked) {
  let slots = '';
  let labels = '';
  STATES.forEach((s, i) => {
    const on = locked[i];
    slots += `<path class="mapjig-slot${on ? ' is-filled' : ''}" data-state="${i}" d="${s.d}"`
      + (on ? ` style="fill:${fillOf(s)}"` : '') + '/>';
    if (on) labels += stateLabel(i); // pre-placed anchors show their name
  });
  return `<svg class="mapjig-frame" viewBox="0 0 ${MAP_W} ${MAP_H}" `
    + `preserveAspectRatio="xMidYMid meet" aria-label="Map of Nigeria — drag each state home">`
    + `<g class="mapjig-slots">${slots}</g><g class="mapjig-labels">${labels}</g></svg>`;
}

// One state's name label, at its centroid — appended when the state is placed.
export function stateLabel(i) {
  const s = STATES[i];
  return `<text class="mapjig-label" data-state="${i}" x="${s.cx}" y="${s.cy}">${s.name}</text>`;
}

// One draggable state piece: the state shown at a legible size (its own bounding
// box as the viewBox) in its zone colour, its name beneath. `bbox` is measured
// once in the browser (see measureBBoxes) since a path's extent isn't known
// without laying it out.
export function statePieceSvg(i, bbox) {
  const s = STATES[i];
  const pad = Math.max(bbox.w, bbox.h) * 0.08 + 6;
  const x = (bbox.x - pad).toFixed(1), y = (bbox.y - pad).toFixed(1);
  const w = (bbox.w + pad * 2).toFixed(1), h = (bbox.h + pad * 2).toFixed(1);
  return `<svg class="mapjig-piece-svg" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet">`
    + `<path d="${s.d}" fill="${fillOf(s)}" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>`
    + `</svg><span class="mapjig-piece-name">${s.name}</span>`;
}

// Measure every state's bounding box once, off a throwaway SVG. Returns an array
// of { x, y, w, h } in map units, indexed like STATES.
export function measureBBoxes() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${MAP_W} ${MAP_H}`);
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  const paths = STATES.map((s) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', s.d);
    svg.appendChild(p);
    return p;
  });
  document.body.appendChild(svg);
  const boxes = paths.map((p) => { const b = p.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
  svg.remove();
  return boxes;
}
