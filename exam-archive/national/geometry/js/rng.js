/* ═══════════════════════════════════════════════════════
   GEOMETRY — seeded PRNG + question generation
   Every client in a room shares one `seed`, so questionAt(seed, i)
   produces the identical question sequence on every device with zero
   network traffic — same primitives as Drills'/Puzzles' rng.js.

   Two families of shape:
   - Circular (circle/semicircle/quadrant/sector): lengths are drawn only
     from multiples of 7 (LENGTH_NUMBERS) so pi=22/7 always cancels the /7
     cleanly. Circle/semicircle/quadrant answers land on whole numbers
     every time; sector is the one case that can land on a genuine reduced
     fraction, graded exactly ("64/3") through fracAnswer's gcd reduction.
   - Polygon (triangle/rectangle/square): plain side-length sums, always a
     whole number — no pi involved.
   Either way, the diagram itself never scales with the actual values (see
   js/geo-svg.js) — only the labels change.
═══════════════════════════════════════════════════════ */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(seed, ns) {
  let h = (seed ^ Math.imul(ns + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

export const QUESTION_NS = 0;

export const SHAPES = ['circle', 'semicircle', 'quadrant', 'sector', 'triangle', 'rectangle', 'square'];
export const CIRCULAR_SHAPES = ['circle', 'semicircle', 'quadrant', 'sector'];
export const GIVEN_TYPES = ['radius', 'diameter'];
export const LENGTH_NUMBERS = Array.from({ length: 10 }, (_, i) => (i + 1) * 7); // 7..70

const MEASURE_LABEL = { circle: 'Circumference', semicircle: 'Perimeter', quadrant: 'Perimeter', sector: 'Perimeter' };
const SHAPE_NAME = {
  circle: 'Circle', semicircle: 'Semicircle', quadrant: 'Quadrant', sector: 'Sector',
  triangle: 'Triangle', rectangle: 'Rectangle', square: 'Square',
};
// Curated so a sector's drawing never lines up with the quadrant/semicircle
// special cases — a genuinely "generic" sector every time it's drawn.
const SECTOR_ANGLES = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}
// Canonical graded answer for a fraction: reduced, and just the whole
// number (no "/1") when it comes out even — matches what a player would
// actually type on a plain keyboard ("64/3", "44").
function fracAnswer(num, den) {
  const g = gcd(num, den);
  const n = num / g, d = den / g;
  return d === 1 ? String(n) : `${n}/${d}`;
}

function drawFrom(rng, pool) { return pool[Math.floor(rng() * pool.length)]; }

// Two pool draws that are guaranteed different when the pool has more than
// one distinct value (so a rectangle isn't secretly a square) — a bounded
// retry, same shape as the equivalent helper in Drills' Fractions category.
function distinctPair(rng, pool) {
  const x = drawFrom(rng, pool);
  let y = drawFrom(rng, pool);
  let guard = 0;
  while (y === x && guard < 20) { y = drawFrom(rng, pool); guard += 1; }
  return [x, y];
}

// Three side lengths that satisfy the triangle inequality (each side <
// sum of the other two) — rejection-sample a scalene triple first; if the
// pool's spread makes that unlucky within a bounded number of tries, fall
// back to a guaranteed-valid isosceles triple instead.
function drawTriangleSides(rng, pool) {
  for (let attempt = 0; attempt < 25; attempt++) {
    const a = drawFrom(rng, pool), b = drawFrom(rng, pool), c = drawFrom(rng, pool);
    const sorted = [a, b, c].slice().sort((x, y) => x - y);
    if (sorted[0] + sorted[1] > sorted[2]) return [a, b, c];
  }
  const a = drawFrom(rng, pool);
  const smaller = pool.filter((v) => v < 2 * a);
  const c = smaller.length ? drawFrom(rng, smaller) : a;
  return [a, a, c];
}

// One circular question: `given` picks whether the diagram states the
// radius or the doubled-up diameter. Every formula is an exact num/den
// pair over pi=22/7. `r`/`angleDeg` ride along on `geo` purely for the SVG
// diagram — the drawing itself never scales with either.
function circularQuestion(rng, pool, shape, givens) {
  const r = drawFrom(rng, pool);
  const given = givens[Math.floor(rng() * givens.length)];
  let angleDeg = null;
  let num, den;
  if (shape === 'circle') { num = 44 * r; den = 7; } // 2*pi*r = 2*(22/7)*r
  else if (shape === 'semicircle') { num = 36 * r; den = 7; } // pi*r + 2r
  else if (shape === 'quadrant') { num = 25 * r; den = 7; } // pi*r/2 + 2r
  else {
    angleDeg = SECTOR_ANGLES[Math.floor(rng() * SECTOR_ANGLES.length)];
    // (angle/360)*2*pi*r + 2r, combined over a 360*7 common denominator
    num = angleDeg * 44 * r + 2 * r * 2520;
    den = 2520;
  }
  const givenValue = given === 'radius' ? r : 2 * r;
  return {
    text: `${MEASURE_LABEL[shape]} of the ${SHAPE_NAME[shape]}`,
    answer: fracAnswer(num, den),
    geo: { shape, given, givenValue, angleDeg },
  };
}

// One polygon question: a plain sum of sides, always a whole number —
// graded as a number (parseInt-tolerant), not a fraction string.
function polygonQuestion(rng, pool, shape) {
  if (shape === 'square') {
    const s = drawFrom(rng, pool);
    return { text: `Perimeter of the ${SHAPE_NAME.square}`, answer: 4 * s, geo: { shape, side: s } };
  }
  if (shape === 'rectangle') {
    const [l, w] = distinctPair(rng, pool);
    return { text: `Perimeter of the ${SHAPE_NAME.rectangle}`, answer: 2 * (l + w), geo: { shape, length: l, width: w } };
  }
  const [a, b, c] = drawTriangleSides(rng, pool);
  return { text: `Perimeter of the ${SHAPE_NAME.triangle}`, answer: a + b + c, geo: { shape, sides: [a, b, c] } };
}

// `shapes` is a non-empty subset of SHAPES (one is drawn at random per
// question); `lengths` supplies the radius/side pool (always multiples of
// 7); `given` gates which quantity (radius/diameter) a circular question
// states — ignored for triangle/rectangle/square, which always label their
// actual side lengths directly.
export function questionAt(seed, index, { shapes = SHAPES, given = GIVEN_TYPES, lengths = LENGTH_NUMBERS } = {}) {
  const rng = mulberry32(hashSeed(seed, QUESTION_NS + index));
  const shapeList = shapes.length ? shapes : SHAPES;
  const shape = shapeList[Math.floor(rng() * shapeList.length)];
  const pool = lengths.length ? lengths : LENGTH_NUMBERS;
  const givens = given.length ? given : GIVEN_TYPES;

  if (CIRCULAR_SHAPES.includes(shape)) return circularQuestion(rng, pool, shape, givens);
  return polygonQuestion(rng, pool, shape);
}
