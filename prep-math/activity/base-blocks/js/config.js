/* ============================================================================
   Base Blocks — tunables, palette and the naming of the places
   ----------------------------------------------------------------------------
   One unit cube is 1 world unit. A block is a cuboid of l×w×h unit cubes that
   sits on an integer cell of the mat, so a rod really is exactly as long as the
   ten units it trades for.
   ========================================================================== */

export const CFG = {
  /* The canvas has no edges. `ground` is only how big the drawn sheet of paper
     is — far enough out that the camera never reaches its rim — while the cells
     things actually occupy are unbounded integers in both directions. */
  ground: 4000,
  searchRings: 400, // how far out placement will look before giving up

  inset: 0.08, // shrink each block a hair so touching blocks still read apart
  gap: 1, // cells left between things when the canvas is laid out

  minBase: 2,
  maxBase: 12,
  defaultBase: 10,

  maxDim: 20, // biggest side a hand-made block may have
  maxBlocks: 400, // safety cap on how many pieces live on the canvas
  maxBreak: 400, // refuse to smash a block into more units than this

  undoDepth: 40,

  camera: { alpha: -Math.PI / 2.15, beta: 0.66, radius: 42, min: 4, max: 420 },
  anim: 260, // ms for a split/merge/tidy move
};

/* Place names, in rising order. In base b a rod is b units, a flat is b rods
   and a cube is b flats — the words stay the same whatever the base is. */
export const PLACES = [
  { id: "unit", label: "Unit", plural: "Units", power: 0 },
  { id: "rod", label: "Rod", plural: "Rods", power: 1 },
  { id: "flat", label: "Flat", plural: "Flats", power: 2 },
  { id: "cube", label: "Cube", plural: "Cubes", power: 3 },
];

/**
 * The place at any power, for charts that reach past the four places blocks
 * come in. The shapes repeat on the cube — base^4 is a rod OF cubes, base^5 a
 * flat of them, base^6 a cube of them — which is how Dienes blocks carry on,
 * so the names carry on the same way.
 */
const CYCLE = [
  ["rod", "Rod", "Rods"],
  ["flat", "Flat", "Flats"],
  ["cube", "Cube", "Cubes"],
];

export function placeAt(power) {
  if (power <= 0) return { ...PLACES[0] };
  if (power <= 3) return { ...PLACES[power] };
  const [, label, plural] = CYCLE[(power - 1) % 3];
  const deep = Math.floor((power - 1) / 3); // 1 = of cubes, 2 = of big cubes
  const of = deep === 1 ? " of cubes" : " of big cubes";
  return { id: "p" + power, label: label + of, plural: plural + of, power };
}

/** What one of a place is worth in units. */
export function worthOf(power, base) {
  return Math.pow(base, power);
}

/** The canonical l×w×h of each place in a given base. */
export function placeDims(placeId, base) {
  switch (placeId) {
    case "unit": return { l: 1, w: 1, h: 1 };
    case "rod": return { l: base, w: 1, h: 1 };
    case "flat": return { l: base, w: base, h: 1 };
    case "cube": return { l: base, w: base, h: base };
    default: return { l: 1, w: 1, h: 1 };
  }
}

/** Which place a block is, or null when it is a shape the learner invented. */
export function placeOf(block, base) {
  for (const p of PLACES) {
    const d = placeDims(p.id, base);
    if (block.l === d.l && block.w === d.w && block.h === d.h) return p.id;
  }
  return null;
}

/* ── Colour ────────────────────────────────────────────────────────────────
   Place colours come from the live theme tokens so the mat re-tints with the
   rest of the site. Highlight tags are paint: fixed pastels in both themes. */
export const PLACE_TOKENS = {
  unit: "--accent-primary",
  rod: "--accent-secondary",
  flat: "--accent-success",
  cube: "--accent-danger",
  custom: "--accent-warning",
};

/* Abacus beads take a theme accent per rod, so every place is its own colour and
   a number can be read off the frame by where the colours change. */
export const BEAD_TOKENS = [
  ["--accent-primary", "#f4c95d"],
  ["--accent-secondary", "#6fb7e8"],
  ["--accent-success", "#7cc47c"],
  ["--accent-danger", "#f07a7a"],
  ["--accent-warning", "#f0a868"],
];

export const TAGS = [
  { id: 0, name: "Butter", hex: "#f6d268" },
  { id: 1, name: "Lilac", hex: "#c9a3ee" },
  { id: 2, name: "Leaf", hex: "#8fd68a" },
  { id: 3, name: "Sky", hex: "#82c2ef" },
  { id: 4, name: "Peach", hex: "#f4a970" },
  { id: 5, name: "Mint", hex: "#7fd7c6" },
];

/** Digits for bases above ten — 10 reads as A, 11 as B. */
export const DIGITS = "0123456789AB";

/** Write a base-ten count in the working base. */
export function toBase(n, base) {
  if (n === 0) return "0";
  let s = "";
  let v = Math.abs(Math.round(n));
  while (v > 0) {
    s = DIGITS[v % base] + s;
    v = Math.floor(v / base);
  }
  return s;
}

/** Spoken name of a base, for labels like "base five". */
const BASE_WORDS = [
  "", "", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten", "eleven", "twelve",
];
export function baseWord(base) {
  return BASE_WORDS[base] || String(base);
}

/** Read a CSS custom property off the page (so we follow light/dark). */
export function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
