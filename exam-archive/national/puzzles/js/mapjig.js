/* ═══════════════════════════════════════════════════════
   PUZZLES — Map jigsaw (Map of Nigeria)

   A jigsaw whose pieces are the 37 states. There is no separate pile: the pieces
   are POURED straight onto the map and you drag each one to where it belongs. A
   piece SNAPS and locks when it lands near its true spot — a classic jigsaw,
   where placing pieces at their correct positions makes their edges line up.

   The trick: every piece is drawn in the WHOLE map's coordinate system (viewBox
   0 0 1000 812) showing only its own state, so at offset (0,0) the state sits
   exactly on the map. Scattering = translating the piece's inner <g>; dragging
   changes that offset; a small-enough offset on release snaps it home.

   A sticky-note "State maps" toggle shows or hides the internal state outlines:
   ON = the subdivisions are drawn as a faint guide; OFF = only the country
   silhouette shows (pure classic — place by shape alone).

   State outlines / names / zones / centroids come from the shared Nigeria map
   data (data/vocab/nigeria-map.js, Natural Earth, public domain). One shared
   `seed` → the same pre-placed states and the same scatter on every device.
═══════════════════════════════════════════════════════ */
import { STATES, MAP_W, MAP_H } from '/data/vocab/nigeria-map.js';
import { mulberry32 } from './rng.js';

export { MAP_W, MAP_H, STATES };

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
const fillOf = (s) => ZONE_FILL[s.zone] || '#cbb98f';
export const stateFill = (i) => fillOf(STATES[i]);

// How close (in map units) a piece must land to its home to snap in — the
// difficulty setting, since nothing is pre-placed. Easy is forgiving, Hard is
// precise. (MAP_W is 1000, so 70 ≈ 7% of the map's width.)
export const SNAP_TOLERANCE = { easy: 78, medium: 52, hard: 32 };

// { heap:[{piece, ox, oy}], movableCount }. Nothing is pre-placed — every one of
// the 37 states is a loose piece, poured onto the map. `piece` is the state
// index; ox/oy is its starting offset (map units) from home, scattered so each
// state's centroid lands somewhere on the map. Seeded, so every client pours the
// pieces the same way.
export function generateMapJigsaw(seed) {
  const rng = mulberry32(seed);
  const order = STATES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const heap = order.map((piece) => {
    const s = STATES[piece];
    const sx = 90 + rng() * (MAP_W - 180); // where this state's centroid lands
    const sy = 90 + rng() * (MAP_H - 180);
    return { piece, ox: sx - s.cx, oy: sy - s.cy };
  });
  return { heap, movableCount: heap.length };
}

// The map beneath the pieces — the GUIDE only (nothing is pre-placed). State
// maps ON draws the internal state outlines; OFF draws a single quiet silhouette
// (no internal seams), so you place by shape alone. A placed piece is marked
// is-done as it locks, so the guide fills in behind the assembling map.
export function mapFrameSvg(showStates = true) {
  let slots = '';
  STATES.forEach((s, i) => {
    slots += `<path class="mapjig-slot${showStates ? '' : ' is-blank'}" data-state="${i}" d="${s.d}"/>`;
  });
  return `<svg class="mapjig-frame" viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="xMidYMid meet" `
    + `aria-hidden="true"><g class="mapjig-slots">${slots}</g></svg>`;
}

// A loose piece: the whole-map viewBox showing only state `i`, its inner <g>
// translated by (ox,oy) so it starts scattered. The <svg> ignores the pointer
// (its huge transparent area must not block pieces beneath); only the state
// path and its name catch it.
export function statePieceFullSvg(i, ox, oy, showName = true) {
  const s = STATES[i];
  const name = showName
    ? `<text class="mapjig-pname" x="${s.cx}" y="${s.cy}">${s.name}</text>` : '';
  return `<svg class="mapjig-piece" viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="xMidYMid meet" data-state="${i}">`
    + `<g class="mapjig-pg" transform="translate(${ox.toFixed(1)} ${oy.toFixed(1)})">`
    + `<path class="mapjig-ppath" d="${s.d}" fill="${fillOf(s)}" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>`
    + name
    + `</g></svg>`;
}
