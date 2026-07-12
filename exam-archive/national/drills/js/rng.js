/* ═══════════════════════════════════════════════════════
   DRILLS — seeded PRNG + question generation
   Every client in a room shares one `seed`, so questionAt(seed, i)
   produces the identical question sequence on every device with zero
   network traffic. See js/bots.js for the matching bot-score use of
   the same primitives.
═══════════════════════════════════════════════════════ */

// mulberry32 — small, fast, good-enough distribution for game content
// (not cryptographic). Returns a function that yields floats in [0,1).
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

// Mixes a room seed with a namespace/index into one well-distributed
// 32-bit int, so independent draw streams (questions vs. bot profiles,
// and each bot's own stream) never overlap or correlate.
export function hashSeed(seed, ns) {
  let h = (seed ^ Math.imul(ns + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

export const QUESTION_NS = 0;
export const BOT_NS = 1_000_000;

// Safe fallback pool if a room's `tables` ever arrives empty — full 1-100
// range, matching the setup screen's "All" bucket.
export const ALL_TABLES = Array.from({ length: 100 }, (_, i) => i + 1);

// The setup screen only shows individual number checkboxes for the 1-9
// bucket (see main.js's RANGES/renderNumbersGrid) — everything above that
// is drilled as a whole range, never cherry-picked number by number.
export const UNIT_NUMBERS = Array.from({ length: 9 }, (_, i) => i + 1);

export const ALL_OPERATIONS = [
  'add', 'multiply', 'divide', 'square', 'sqrt', 'cube', 'cuberoot',
  'fracAdd', 'fracSub', 'fracMul', 'fracDiv',
];

export const ALL_FRACTION_TYPES = ['like', 'unlike', 'wholeFraction'];

// Geometry — perimeter/circumference practice. Radii are drawn only from
// multiples of 7 so that pi = 22/7 always cancels the /7 cleanly (circle,
// semicircle and quadrant answers land on whole numbers every time; sector
// answers are the one case that can land on a genuine reduced fraction,
// same "3/8"-style grading as the Fractions category already handles).
export const GEO_OPS = ['geoCircle', 'geoSemicircle', 'geoQuadrant', 'geoSector'];
export const GEO_GIVEN_TYPES = ['radius', 'diameter'];
export const RADIUS_NUMBERS = Array.from({ length: 10 }, (_, i) => (i + 1) * 7); // 7..70

const GEO_SHAPE = { geoCircle: 'circle', geoSemicircle: 'semicircle', geoQuadrant: 'quadrant', geoSector: 'sector' };
const GEO_MEASURE_LABEL = { circle: 'Circumference', semicircle: 'Perimeter', quadrant: 'Perimeter', sector: 'Perimeter' };
const GEO_SHAPE_NAME = { circle: 'Circle', semicircle: 'Semicircle', quadrant: 'Quadrant', sector: 'Sector' };
// Curated so the diagram never lines up with the quadrant/semicircle special
// cases — a genuinely "generic" sector every time it's drawn.
const SECTOR_ANGLES = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

// Canonical graded answer for a fraction: reduced, and just the whole
// number (no "/1") when it comes out even — matches what a player would
// actually type on a plain keyboard ("3/8", "5").
function fracAnswer(num, den) {
  const g = gcd(num, den);
  const n = num / g, d = den / g;
  return d === 1 ? String(n) : `${n}/${d}`;
}
// Display uses the Unicode fraction slash (⁄) purely for typesetting —
// the graded answer above always uses a plain "/", matching what's typed.
const fracText = (num, den) => `${num}⁄${den}`;

function drawFrom(rng, pool) { return pool[Math.floor(rng() * pool.length)]; }

// Two pool draws that are guaranteed different (so "unlike" denominators
// are actually unlike) and at least `min`, with a bounded retry — pools
// this small only show up for a hand-picked 1-9 set, and min is 2 there.
function distinctPair(rng, pool, min) {
  let x = Math.max(drawFrom(rng, pool), min);
  let y = Math.max(drawFrom(rng, pool), min);
  let guard = 0;
  while (y === x && guard < 20) { y = Math.max(drawFrom(rng, pool), min); guard += 1; }
  if (y === x) y += 1;
  return [x, y];
}

// One fraction question: `type` picks the shape (same denominator, mixed
// denominators, or a whole number paired with a fraction), `op` picks the
// arithmetic. Every branch is built so the result never needs simplifying
// beyond gcd-reduction and never goes negative (subtraction always takes
// the larger operand first).
function fractionQuestionAt(rng, pool, n, op, type) {
  if (type === 'like') {
    const denom = Math.max(n, 3);
    const a = 1 + Math.floor(rng() * (denom - 1));
    const b = 1 + Math.floor(rng() * (denom - 1));
    if (op === 'fracAdd') return { text: `${fracText(a, denom)} + ${fracText(b, denom)}`, answer: fracAnswer(a + b, denom) };
    if (op === 'fracSub') {
      const hi = Math.max(a, b), lo = Math.min(a, b);
      return { text: `${fracText(hi, denom)} − ${fracText(lo, denom)}`, answer: fracAnswer(hi - lo, denom) };
    }
    if (op === 'fracMul') return { text: `${fracText(a, denom)} × ${fracText(b, denom)}`, answer: fracAnswer(a * b, denom * denom) };
    return { text: `${fracText(a, denom)} ÷ ${fracText(b, denom)}`, answer: fracAnswer(a, b) }; // shared denom cancels
  }

  if (type === 'unlike') {
    const [x, y] = distinctPair(rng, pool, 2);
    const a = 1 + Math.floor(rng() * (x - 1));
    const b = 1 + Math.floor(rng() * (y - 1));
    if (op === 'fracAdd') return { text: `${fracText(a, x)} + ${fracText(b, y)}`, answer: fracAnswer(a * y + b * x, x * y) };
    if (op === 'fracSub') {
      const diff = a * y - b * x;
      return diff >= 0
        ? { text: `${fracText(a, x)} − ${fracText(b, y)}`, answer: fracAnswer(diff, x * y) }
        : { text: `${fracText(b, y)} − ${fracText(a, x)}`, answer: fracAnswer(-diff, x * y) };
    }
    if (op === 'fracMul') return { text: `${fracText(a, x)} × ${fracText(b, y)}`, answer: fracAnswer(a * b, x * y) };
    return { text: `${fracText(a, x)} ÷ ${fracText(b, y)}`, answer: fracAnswer(a * y, x * b) };
  }

  // wholeFraction: a whole number paired with a fraction.
  const denom = Math.max(drawFrom(rng, pool), 2);
  const whole = Math.max(n, 1);
  const a = 1 + Math.floor(rng() * (denom - 1));
  if (op === 'fracAdd') return { text: `${whole} + ${fracText(a, denom)}`, answer: fracAnswer(whole * denom + a, denom) };
  if (op === 'fracSub') return { text: `${whole} − ${fracText(a, denom)}`, answer: fracAnswer(whole * denom - a, denom) };
  if (op === 'fracMul') return { text: `${whole} × ${fracText(a, denom)}`, answer: fracAnswer(whole * a, denom) };
  return { text: `${whole} ÷ ${fracText(a, denom)}`, answer: fracAnswer(whole * denom, a) };
}

// One geometry question: `tables` supplies the radius pool (always
// multiples of 7 — see RADIUS_NUMBERS), `given` picks whether the diagram
// states the radius or the doubled-up diameter. Every formula is built as
// an exact num/den pair over pi=22/7 and graded through the same
// gcd-reduced fracAnswer() the Fractions category uses, so a sector's
// occasional non-whole answer ("64/3") is typed and graded exactly like a
// fraction question. `r` and `angleDeg` ride along on the returned `geo`
// object purely for the SVG diagram — the drawing itself never scales with
// either (see js/geo-svg.js).
function geometryQuestionAt(rng, pool, op, givens) {
  const shape = GEO_SHAPE[op];
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
    text: `${GEO_MEASURE_LABEL[shape]} of the ${GEO_SHAPE_NAME[shape]}`,
    answer: fracAnswer(num, den),
    geo: { shape, given, givenValue, angleDeg },
  };
}

const FRACTION_OPS = ['fracAdd', 'fracSub', 'fracMul', 'fracDiv'];

// `tables` is the pool a question's "base" number is drawn from — either a
// hand-picked set of 1-9 numbers or a whole decade range (see main.js). For
// add/multiply/divide, one operand comes from that pool, the other is free,
// 1–12 (mirroring the flashcards Facts picker); for square/sqrt/cube/
// cuberoot, `tables` supplies the number being raised/rooted; for the
// fracAdd/fracSub/fracMul/fracDiv ops it supplies denominators, gated by
// `fractionTypes` (like/unlike/wholeFraction). `operations` is a non-empty
// subset of ALL_OPERATIONS — one is drawn at random per question. Division
// always divides evenly (built from a product, then presented as dividend
// ÷ divisor) — never a non-integer result, and square/cube root are always
// a perfect power for the same reason.
export function questionAt(seed, index, { operations = ['multiply', 'divide'], tables = ALL_TABLES, fractionTypes = ALL_FRACTION_TYPES } = {}) {
  const rng = mulberry32(hashSeed(seed, QUESTION_NS + index));
  const ops = operations.length ? operations : ['multiply', 'divide'];
  const op = ops[Math.floor(rng() * ops.length)];
  const pool = tables.length ? tables : ALL_TABLES;

  if (GEO_OPS.includes(op)) {
    const givens = fractionTypes.length ? fractionTypes : GEO_GIVEN_TYPES;
    return geometryQuestionAt(rng, pool, op, givens);
  }

  const n = pool[Math.floor(rng() * pool.length)];

  if (op === 'square') return { text: `${n}²`, answer: n * n };
  if (op === 'sqrt') return { text: `√${n * n}`, answer: n };
  if (op === 'cube') return { text: `${n}³`, answer: n * n * n };
  if (op === 'cuberoot') return { text: `∛${n * n * n}`, answer: n };

  if (FRACTION_OPS.includes(op)) {
    const types = fractionTypes.length ? fractionTypes : ALL_FRACTION_TYPES;
    const type = types[Math.floor(rng() * types.length)];
    return fractionQuestionAt(rng, pool, n, op, type);
  }

  const other = 1 + Math.floor(rng() * 12);
  if (op === 'divide') {
    const dividend = n * other;
    return { text: `${dividend} ÷ ${n}`, answer: other };
  }
  if (op === 'add') return { text: `${n} + ${other}`, answer: n + other };
  return { text: `${n} × ${other}`, answer: n * other };
}
