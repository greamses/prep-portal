/* ═══════════════════════════════════════════════════════
   THE SOLAR SYSTEM (2D) — a Geography drawn topic beside the World and Nigeria
   maps. The game draws the Sun, the planets, the Moon and the smaller bodies as
   a single flat diagram (crafted SVG — gradient-shaded discs, faint orbits,
   Saturn's ring, the asteroid and Kuiper belts, a comet, a starfield) and lights
   ONE body; you name it. All hand-drawn vector, so there is nothing to source.

   The layout (cx/cy/r, in the 1120×560 viewBox) is hand-tuned: sizes are scaled
   down from the real radii so Jupiter still dwarfs the Earth without the rocky
   planets vanishing, and the spacing increases outward like the real orbits while
   still fitting on one screen. The Moon rides just off Earth as its companion.

   `type` drives how solar.js draws it; `c` = [lit colour, shadow colour]; `hint`
   is the quiz clue; `g` is the minimum grade the body is asked at (null = all).
   Belts carry `inner`/`outer` (radii from the Sun); the comet and the meteor
   trio carry their own little extras. The SVG is built by
   exam-archive/national/vocab/js/solar.js — this module stays pure. LAZY-LOADED.
═══════════════════════════════════════════════════════ */

export const MAP_W = 1120;
export const MAP_H = 560;

// The Sun sits here; orbit radii below are measured from it.
export const SUN = { cx: 118, cy: 280 };

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
  { key: 'mars', name: 'Mars', cx: 430, cy: 280, r: 12, type: 'rocky', c: ['#e39b6d', '#7c2e17'],
    hint: "The fourth planet, rust-red from the iron in its soil — the 'Red Planet'." },
  // ── the asteroid belt, between Mars and Jupiter ──
  { key: 'asteroid-belt', name: 'Asteroid Belt', cx: 476, cy: 280, r: 14, type: 'belt', inner: 338, outer: 374, g: 3,
    hint: 'The ring of countless rocky bodies orbiting the Sun between Mars and Jupiter.' },
  { key: 'ceres', name: 'Ceres', cx: 452, cy: 246, r: 5, type: 'dwarf', c: ['#c8beb0', '#6b6157'], g: 5,
    hint: 'The largest body in the asteroid belt — a dwarf planet.' },
  { key: 'asteroid', name: 'Asteroid', cx: 512, cy: 210, r: 7, type: 'rock', c: ['#b7a793', '#5a5046'], g: 3,
    hint: 'A small rocky body orbiting the Sun, most found in the belt between Mars and Jupiter.' },
  { key: 'jupiter', name: 'Jupiter', cx: 588, cy: 280, r: 42, type: 'gas', c: ['#ebd0a4', '#a9793f'], spot: true,
    hint: 'The largest planet, a giant ball of gas marked by its Great Red Spot.' },
  { key: 'comet', name: 'Comet', cx: 812, cy: 116, r: 7, type: 'comet', c: ['#dff2ff', '#8fb8d6'], g: 3,
    hint: 'An icy body that grows a long glowing tail, always pointing away from the Sun, as it nears it.' },
  { key: 'saturn', name: 'Saturn', cx: 726, cy: 280, r: 34, type: 'gas', c: ['#f0dfb0', '#b0894a'], ring: true,
    hint: 'The sixth planet, famous for its bright, wide system of rings.' },
  { key: 'uranus', name: 'Uranus', cx: 866, cy: 280, r: 25, type: 'ice', c: ['#cfeef0', '#69aeb8'],
    hint: 'The seventh planet, an ice giant that spins tipped almost onto its side.' },
  { key: 'neptune', name: 'Neptune', cx: 956, cy: 280, r: 24, type: 'ice', c: ['#5b7fe0', '#22346e'],
    hint: 'The eighth and farthest major planet, a deep-blue, windy ice giant.' },
  // ── beyond Neptune ──
  { key: 'kuiper-belt', name: 'Kuiper Belt', cx: 1070, cy: 280, r: 14, type: 'belt', inner: 928, outer: 968, g: 5,
    hint: 'The wide band of icy bodies and dwarf planets that rings the solar system beyond Neptune.' },
  { key: 'pluto', name: 'Pluto', cx: 1030, cy: 236, r: 5, type: 'dwarf', c: ['#d8c6b2', '#7a6b5c'], g: 5,
    hint: 'A dwarf planet in the Kuiper Belt, once counted as the ninth planet.' },
  // ── the meteor trio: one rock, three names for where it is ──
  { key: 'meteoroid', name: 'Meteoroid', cx: 214, cy: 402, r: 4, type: 'meteoroid', c: ['#b7a08a', '#584a3c'], g: 5,
    hint: 'A small rock or metal chunk travelling through space, smaller than an asteroid.' },
  { key: 'meteor', name: 'Meteor', cx: 258, cy: 440, r: 5, type: 'meteor', to: [300, 474], g: 5,
    hint: 'The bright streak of light as a meteoroid burns up in the atmosphere — a shooting star.' },
  { key: 'meteorite', name: 'Meteorite', cx: 320, cy: 486, r: 5, type: 'meteorite', c: ['#8f7d68', '#453a2d'], g: 5,
    hint: 'A meteoroid that survives its fiery fall and lands on the ground.' },
];

// Shaped like every other topic's words: the body NAME is the answer, its
// description the clue, and `body` carries the disc the diagram lights. `g` tiers
// the smaller/subtler bodies to older grades (topicPool honours it).
export const GAME_BODIES = BODIES.map((b) => ({
  w: b.name, d: b.hint, g: b.g ?? null, body: { name: b.name, key: b.key, hint: b.hint },
}));
