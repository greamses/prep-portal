/* ═══════════════════════════════════════════════════════
   DRILLS — Geometry: angles, area & perimeter, Pythagoras & trig, circles &
   volume. Every question has a whole-number (or lowest-terms fraction)
   answer: circles take π = 22/7 and use radii that are multiples of 7.
   `hint` says what to find; `text` carries the numbers, typeset by MathJax.
═══════════════════════════════════════════════════════ */
export const GEOMETRY_OPS = [
  'geoAngLine', 'geoAngTriangle', 'geoAngPolygon', 'geoAngParallel',
  'geoRect', 'geoTriangle', 'geoTrapezium', 'geoParallelogram',
  'geoHyp', 'geoLeg', 'geoTrig',
  'geoCircumference', 'geoCircleArea', 'geoCuboid', 'geoCylinder', 'geoCone',
];
export const isGeometryOp = (op) => GEOMETRY_OPS.includes(op);

const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const frac = (n, d) => `${n / gcd(n, d)}/${d / gcd(n, d)}`;
const q = (text, hint, answer) => ({ math: true, text, hint, answer });

/** A side length from the range pool: single digits stay 2–9, larger pools wrap to 2–30. */
function side(rng, pool) {
  const v = pool[Math.floor(rng() * pool.length)];
  const big = Math.max(...pool) >= 10;
  return Math.max(2, big ? ((v - 1) % 30) + 1 : v);
}
const isBig = (pool) => Math.max(...pool) >= 10;

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];

export function geometryQuestion(rng, pool, op) {
  /* ── angles ── */
  if (op === 'geoAngLine') {
    const a = int(rng, 10, 150), b = rng() < 0.5 ? int(rng, 10, 170 - a) : 0;
    return b
      ? q(`x + ${a}° + ${b}° = 180°`, 'Angles on a straight line: find x', 180 - a - b)
      : q(`x + ${a}° = 180°`, 'Angles on a straight line: find x', 180 - a);
  }
  if (op === 'geoAngTriangle') {
    const a = int(rng, 20, 100), b = int(rng, 20, 160 - a);
    return q(`x + ${a}° + ${b}° = 180°`, 'Angles in a triangle: find x', 180 - a - b);
  }
  if (op === 'geoAngPolygon') {
    const n = pick(rng, [5, 6, 8, 9, 10, 12, 15]);
    switch (int(rng, 0, 2)) {
      case 0: return q(`n = ${n}`, 'Sum of the interior angles of an n-sided polygon', (n - 2) * 180);
      case 1: return q(`n = ${n}`, 'One interior angle of a regular n-sided polygon', 180 - 360 / n);
      default: return q(`n = ${n}`, 'One exterior angle of a regular n-sided polygon', 360 / n);
    }
  }
  if (op === 'geoAngParallel') {
    let a = int(rng, 30, 150);
    if (a === 90) a = 70;
    const kind = pick(rng, ['Alternate', 'Corresponding', 'Vertically opposite', 'Co-interior']);
    return q(`a = ${a}°`, `${kind} angles: find x`, kind === 'Co-interior' ? 180 - a : a);
  }

  /* ── area & perimeter ── */
  if (op === 'geoRect') {
    const l = side(rng, pool), w = side(rng, pool);
    return rng() < 0.5
      ? q(`l = ${l}, w = ${w}`, 'Area of a rectangle', l * w)
      : q(`l = ${l}, w = ${w}`, 'Perimeter of a rectangle', 2 * (l + w));
  }
  if (op === 'geoTriangle') {
    const b = side(rng, pool); let h = side(rng, pool);
    if ((b * h) % 2) h += 1;
    return q(`b = ${b}, h = ${h}`, 'Area of a triangle', (b * h) / 2);
  }
  if (op === 'geoTrapezium') {
    const a = side(rng, pool), b = side(rng, pool); let h = side(rng, pool);
    if (((a + b) * h) % 2) h += 1;
    return q(`a = ${a}, b = ${b}, h = ${h}`, 'Area of a trapezium', ((a + b) * h) / 2);
  }
  if (op === 'geoParallelogram') {
    const b = side(rng, pool), h = side(rng, pool);
    return q(`b = ${b}, h = ${h}`, 'Area of a parallelogram', b * h);
  }

  /* ── Pythagoras & trig ── */
  if (op === 'geoHyp' || op === 'geoLeg' || op === 'geoTrig') {
    const [a, b, c] = pick(rng, TRIPLES);
    const k = isBig(pool) ? int(rng, 1, 6) : (a * 3 > 24 ? 1 : int(rng, 1, 3));
    const A = a * k, B = b * k, C = c * k;
    if (op === 'geoHyp') return q(`a = ${A}, b = ${B}`, 'Right-angled triangle: find the hypotenuse', C);
    if (op === 'geoLeg') return rng() < 0.5
      ? q(`c = ${C}, a = ${A}`, 'Right-angled triangle (c is the hypotenuse): find b', B)
      : q(`c = ${C}, b = ${B}`, 'Right-angled triangle (c is the hypotenuse): find a', A);
    const fn = pick(rng, ['sin', 'cos', 'tan']);
    const ans = fn === 'sin' ? frac(a, c) : fn === 'cos' ? frac(b, c) : frac(a, b);
    return q(`${fn} A`, `Opposite = ${A}, adjacent = ${B}, hypotenuse = ${C}. Give a fraction`, ans);
  }

  /* ── circles & volume (π = 22/7, radii in sevens) ── */
  const k = isBig(pool) ? int(rng, 1, 4) : 1;
  const r = 7 * k;
  if (op === 'geoCircumference') return q(`r = ${r}`, 'Circumference of a circle, π = 22/7', 44 * k);
  if (op === 'geoCircleArea') return q(`r = ${r}`, 'Area of a circle, π = 22/7', 154 * k * k);
  if (op === 'geoCuboid') {
    const l = side(rng, pool), w = side(rng, pool), h = side(rng, pool);
    return q(`l = ${l}, w = ${w}, h = ${h}`, 'Volume of a cuboid', l * w * h);
  }
  if (op === 'geoCylinder') {
    const h = side(rng, pool);
    return q(`r = ${r}, h = ${h}`, 'Volume of a cylinder, π = 22/7', 154 * k * k * h);
  }
  const m = int(rng, 1, isBig(pool) ? 9 : 4); // cone: h a multiple of 3
  return q(`r = ${r}, h = ${3 * m}`, 'Volume of a cone, π = 22/7', 154 * k * k * m);
}
