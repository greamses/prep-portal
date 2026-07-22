/* ═══════════════════════════════════════════════════════
   THE SOLAR SYSTEM (2D) — a Geography drawn topic beside the World and Nigeria
   maps. The game draws the Sun, the eight planets and the Moon as a single flat
   diagram (crafted SVG — gradient-shaded discs, faint orbits, Saturn's ring, a
   starfield) and lights ONE body; you name it. All hand-drawn vector, so there is
   nothing to source or credit.

   The layout (cx/cy/r, in the 1000×560 viewBox) is hand-tuned: sizes are scaled
   down from the real radii so Jupiter still dwarfs the Earth without the rocky
   planets vanishing, and the spacing increases outward like the real orbits while
   still fitting on one screen. The Moon rides just off Earth as its companion.

   The SVG itself is built by exam-archive/national/vocab/js/solar.js from this
   data — this module stays pure. LAZY-LOADED; never import it statically.
═══════════════════════════════════════════════════════ */

export const MAP_W = 1000;
export const MAP_H = 560;

// type drives how solar.js shades the disc; c = [lit colour, shadow colour].
// hint is the quiz clue. cx/cy/r place and size the disc.
export const BODIES = [
  { key: 'sun', name: 'Sun', cx: 118, cy: 280, r: 74, type: 'sun', c: ['#fff2bf', '#ff8a1e'],
    hint: 'The star at the centre of the solar system; the Earth and every planet orbits it.' },
  { key: 'mercury', name: 'Mercury', cx: 252, cy: 280, r: 9, type: 'rocky', c: ['#cabaa7', '#544a41'],
    hint: 'The smallest planet and the closest to the Sun.' },
  { key: 'venus', name: 'Venus', cx: 302, cy: 280, r: 15, type: 'rocky', c: ['#f6e3af', '#a9761f'],
    hint: 'The second planet, wrapped in thick clouds — the hottest planet of all.' },
  { key: 'earth', name: 'Earth', cx: 364, cy: 280, r: 16, type: 'earth', c: ['#8ec8ef', '#1c568f'],
    hint: 'The third planet, and the only world known to support life.' },
  { key: 'moon', name: 'Moon', cx: 392, cy: 254, r: 6, type: 'moon', c: ['#e4e0d6', '#7b756b'], satellite: 'earth',
    hint: "Earth's only natural satellite, and the brightest object in the night sky." },
  { key: 'mars', name: 'Mars', cx: 434, cy: 280, r: 12, type: 'rocky', c: ['#e39b6d', '#7c2e17'],
    hint: "The fourth planet, rust-red from the iron in its soil — the 'Red Planet'." },
  { key: 'jupiter', name: 'Jupiter', cx: 552, cy: 280, r: 42, type: 'gas', c: ['#ebd0a4', '#a9793f'], spot: true,
    hint: 'The largest planet, a giant ball of gas marked by its Great Red Spot.' },
  { key: 'saturn', name: 'Saturn', cx: 696, cy: 280, r: 34, type: 'gas', c: ['#f0dfb0', '#b0894a'], ring: true,
    hint: 'The sixth planet, famous for its bright, wide system of rings.' },
  { key: 'uranus', name: 'Uranus', cx: 838, cy: 280, r: 25, type: 'ice', c: ['#cfeef0', '#69aeb8'],
    hint: 'The seventh planet, an ice giant that spins tipped almost onto its side.' },
  { key: 'neptune', name: 'Neptune', cx: 928, cy: 280, r: 24, type: 'ice', c: ['#5b7fe0', '#22346e'],
    hint: 'The eighth and farthest major planet, a deep-blue, windy ice giant.' },
];

// Shaped like every other topic's words: the body NAME is the answer, its
// description the clue, and `body` carries the disc the diagram lights.
export const GAME_BODIES = BODIES.map((b) => ({
  w: b.name, d: b.hint, body: { name: b.name, key: b.key, hint: b.hint },
}));
