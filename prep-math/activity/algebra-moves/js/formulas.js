/* ═══════════════════════════════════════════════════════════════════════════
   THE FORMULA BANK

   A formula is not a new kind of maths for this tool — it is an equation with
   more than one letter in it, plus a note of what each letter stands for. What
   makes it worth having its own list is the QUESTION it comes with: given these
   numbers, find that one. That question is the whole of substitution.

   Every formula here is written in the same linear syntax a student types on
   the keypad, and is put through the parser and the solver by the sweep in
   scripts/ before it ships — a formula that cannot be finished with the moves
   on offer is a bug in the move set, not a formula to quietly leave out.

   `example` is a worked set of values so that picking a formula and pressing go
   lands a real question on the canvas. `find` is the letter left blank.

   π is written as the fraction every syllabus here tells a student to use. The
   tool holds exact rationals, so 22/7 stays 22/7 all the way down and only
   becomes a number when the arithmetic asks for one.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as R from "./rational.js";

export const GROUPS = [
  {
    group: "Shapes",
    items: [
      {
        id: "rect-area", name: "Area of a rectangle", eq: "A = lb", find: "A",
        letters: { A: "the area", l: "the length", b: "the breadth" },
        example: { l: "8", b: "5" },
      },
      {
        id: "rect-perimeter", name: "Perimeter of a rectangle", eq: "P = 2l + 2b", find: "P",
        letters: { P: "the perimeter", l: "the length", b: "the breadth" },
        example: { l: "9", b: "4" },
      },
      {
        id: "triangle-area", name: "Area of a triangle", eq: "A = bh/2", find: "A",
        letters: { A: "the area", b: "the base", h: "the height" },
        example: { b: "12", h: "5" },
      },
      {
        id: "circle-area", name: "Area of a circle", eq: "A = (22/7)r^2", find: "A",
        letters: { A: "the area", r: "the radius" },
        example: { r: "7" },
        note: "taking π as 22/7",
      },
      {
        id: "circle-round", name: "Distance round a circle", eq: "C = 2(22/7)r", find: "C",
        letters: { C: "the distance round", r: "the radius" },
        example: { r: "14" },
        note: "taking π as 22/7",
      },
      {
        id: "cuboid-volume", name: "Volume of a cuboid", eq: "V = lbh", find: "V",
        letters: { V: "the volume", l: "the length", b: "the breadth", h: "the height" },
        example: { l: "5", b: "3", h: "4" },
      },
      {
        id: "trapezium-area", name: "Area of a trapezium", eq: "A = (a + b)h/2", find: "A",
        letters: { A: "the area", a: "one parallel side", b: "the other one", h: "the height" },
        example: { a: "6", b: "10", h: "4" },
      },
      {
        id: "square-area", name: "Area of a square", eq: "A = s^2", find: "A",
        letters: { A: "the area", s: "the side length" },
        example: { s: "6" },
      },
      {
        id: "square-perimeter", name: "Perimeter of a square", eq: "P = 4s", find: "P",
        letters: { P: "the perimeter", s: "the side length" },
        example: { s: "6" },
      },
      {
        id: "triangle-perimeter", name: "Perimeter of a triangle", eq: "P = a + b + c", find: "P",
        letters: { P: "the perimeter", a: "one side", b: "another side", c: "the third side" },
        example: { a: "3", b: "4", c: "5" },
      },
      {
        id: "triangle-heron", name: "Area of a triangle (Heron's formula)", eq: "A = sqrt(s(s - a)(s - b)(s - c))", find: "A",
        letters: { A: "the area", s: "the semi-perimeter, (a + b + c)/2", a: "one side", b: "another side", c: "the third side" },
        example: { s: "6", a: "3", b: "4", c: "5" },
      },
      {
        id: "parallelogram-area", name: "Area of a parallelogram", eq: "A = bh", find: "A",
        letters: { A: "the area", b: "the base", h: "the perpendicular height" },
        example: { b: "9", h: "4" },
      },
      {
        id: "parallelogram-perimeter", name: "Perimeter of a parallelogram", eq: "P = 2(a + b)", find: "P",
        letters: { P: "the perimeter", a: "one side", b: "an adjacent side" },
        example: { a: "5", b: "8" },
      },
      {
        id: "rhombus-area", name: "Area of a rhombus", eq: "A = pq/2", find: "A",
        letters: { A: "the area", p: "one diagonal", q: "the other diagonal" },
        example: { p: "10", q: "6" },
        note: "the diagonals are perpendicular",
      },
      {
        id: "rhombus-perimeter", name: "Perimeter of a rhombus", eq: "P = 4s", find: "P",
        letters: { P: "the perimeter", s: "the side length" },
        example: { s: "6" },
      },
      {
        id: "ellipse-area", name: "Area of an ellipse", eq: "A = (22/7)ab", find: "A",
        letters: { A: "the area", a: "the semi-major axis", b: "the semi-minor axis" },
        example: { a: "7", b: "4" },
        note: "taking π as 22/7",
      },
      {
        id: "sector-area", name: "Area of a sector", eq: "A = (θ/2)r^2", find: "A",
        letters: { A: "the area", θ: "the angle in radians", r: "the radius" },
        example: { θ: "1", r: "4" },
        note: "θ must be in radians",
      },
      {
        id: "sector-area-arc", name: "Area of a sector (from the arc length)", eq: "A = Lr/2", find: "A",
        letters: { A: "the area", L: "the arc length", r: "the radius" },
        example: { L: "8", r: "3" },
      },
      {
        id: "regular-polygon-area", name: "Area of a regular polygon (from the apothem)", eq: "A = ap/2", find: "A",
        letters: { A: "the area", a: "the apothem", p: "the perimeter" },
        example: { a: "4", p: "20" },
      },
      {
        id: "cube-volume", name: "Volume of a cube", eq: "V = s^3", find: "V",
        letters: { V: "the volume", s: "the side length" },
        example: { s: "3" },
      },
      {
        id: "cube-surface-area", name: "Surface area of a cube", eq: "A = 6s^2", find: "A",
        letters: { A: "the surface area", s: "the side length" },
        example: { s: "3" },
      },
      {
        id: "cuboid-surface-area", name: "Surface area of a cuboid", eq: "A = 2(lb + lh + bh)", find: "A",
        letters: { A: "the surface area", l: "the length", b: "the breadth", h: "the height" },
        example: { l: "5", b: "3", h: "4" },
      },
      {
        id: "cylinder-volume", name: "Volume of a cylinder", eq: "V = (22/7)r^2h", find: "V",
        letters: { V: "the volume", r: "the radius", h: "the height" },
        example: { r: "7", h: "10" },
        note: "taking π as 22/7",
      },
      {
        id: "cylinder-surface-area", name: "Total surface area of a cylinder", eq: "A = 2(22/7)r(r + h)", find: "A",
        letters: { A: "the surface area", r: "the radius", h: "the height" },
        example: { r: "7", h: "10" },
        note: "taking π as 22/7",
      },
      {
        id: "sphere-volume", name: "Volume of a sphere", eq: "V = (4/3)(22/7)r^3", find: "V",
        letters: { V: "the volume", r: "the radius" },
        example: { r: "7" },
        note: "taking π as 22/7",
      },
      {
        id: "sphere-surface-area", name: "Surface area of a sphere", eq: "A = 4(22/7)r^2", find: "A",
        letters: { A: "the surface area", r: "the radius" },
        example: { r: "7" },
        note: "taking π as 22/7",
      },
      {
        id: "cone-volume", name: "Volume of a cone", eq: "V = (1/3)(22/7)r^2h", find: "V",
        letters: { V: "the volume", r: "the base radius", h: "the height" },
        example: { r: "3", h: "4" },
        note: "taking π as 22/7",
      },
      {
        id: "cone-surface-area", name: "Total surface area of a cone", eq: "A = (22/7)r(r + sqrt(r^2 + h^2))", find: "A",
        letters: { A: "the surface area", r: "the base radius", h: "the height" },
        example: { r: "3", h: "4" },
        note: "taking π as 22/7; the slant height is sqrt(r^2 + h^2)",
      },
      {
        id: "pyramid-volume", name: "Volume of a pyramid", eq: "V = (1/3)Bh", find: "V",
        letters: { V: "the volume", B: "the base area", h: "the height" },
        example: { B: "20", h: "6" },
      },
    ],
  },
  {
    group: "Algebra",
    items: [
      {
        id: "quadratic-formula", name: "Quadratic formula", eq: "x = (-b ± sqrt(b^2 - 4ac))/(2a)", find: "x",
        letters: { x: "the unknown", a: "the coefficient of x²", b: "the coefficient of x", c: "the constant term" },
        example: { a: "1", b: "-3", c: "2" },
        note: "solves ax² + bx + c = 0, with a not 0",
      },
      {
        id: "quadratic-psl", name: "Po-Shen Loh: the roots of x² + bx + c = 0", eq: "x = -b/2 ± sqrt(b^2/4 - c)", find: "x",
        letters: { x: "a root", b: "the number in front of x", c: "the number on its own" },
        example: { b: "-5", c: "6" },
        note: "the roots average −b/2 and sit u either side of it",
      },
      {
        id: "quadratic-psl-u", name: "Po-Shen Loh's u: how far each root is from −b/2", eq: "u = sqrt(b^2/4 - c)", find: "u",
        letters: { u: "the distance from the average to each root", b: "the number in front of x", c: "the number on its own" },
        example: { b: "-6", c: "5" },
      },
      {
        id: "quadratic-factorised", name: "Factorised form: a quadratic from its roots", eq: "y = (x - r)(x - s)", find: "y",
        letters: { y: "the value of the quadratic", x: "where it is found", r: "one root", s: "the other root" },
        example: { x: "5", r: "2", s: "3" },
        note: "the factoring method run backwards: the roots give the brackets",
      },
      {
        id: "quadratic-discriminant", name: "Discriminant of a quadratic", eq: "D = b^2 - 4ac", find: "D",
        letters: { D: "the discriminant", a: "the coefficient of x²", b: "the coefficient of x", c: "the constant term" },
        example: { a: "1", b: "-3", c: "2" },
        note: "D > 0: two real roots; D = 0: one repeated root; D < 0: no real roots",
      },
      // "r₁ + r₂ = −b/a, r₁r₂ = c/a" is two equations; one card holds one.
      {
        id: "quadratic-root-sum", name: "Sum of the roots of a quadratic", eq: "S = -b/a", find: "S",
        letters: { S: "the sum of the two roots", a: "the coefficient of x²", b: "the coefficient of x" },
        example: { a: "1", b: "-3" },
        note: "the roots of ax² + bx + c = 0",
      },
      {
        id: "quadratic-root-product", name: "Product of the roots of a quadratic", eq: "P = c/a", find: "P",
        letters: { P: "the product of the two roots", a: "the coefficient of x²", c: "the constant term" },
        example: { a: "1", c: "2" },
        note: "the roots of ax² + bx + c = 0",
      },
      // The vertex is two coordinates — again one card each.
      {
        id: "quadratic-vertex-x", name: "Vertex of a quadratic (across)", eq: "h = -b/(2a)", find: "h",
        letters: { h: "the x-coordinate of the vertex", a: "the coefficient of x²", b: "the coefficient of x" },
        example: { a: "1", b: "-3" },
        note: "the turning point of y = ax² + bx + c",
      },
      {
        id: "quadratic-vertex-y", name: "Vertex of a quadratic (up)", eq: "k = (4ac - b^2)/(4a)", find: "k",
        letters: { k: "the y-coordinate of the vertex", a: "the coefficient of x²", b: "the coefficient of x", c: "the constant term" },
        example: { a: "1", b: "-3", c: "2" },
        note: "the turning point of y = ax² + bx + c",
      },
    ],
  },
  {
    group: "Motion and forces",
    items: [
      {
        id: "speed", name: "Distance at a steady speed", eq: "s = vt", find: "s",
        letters: { s: "the distance", v: "the speed", t: "the time" },
        example: { v: "60", t: "3" },
      },
      {
        id: "final-speed", name: "Speed after a time", eq: "v = u + at", find: "v",
        letters: { v: "the speed at the end", u: "the speed at the start", a: "the acceleration", t: "the time" },
        example: { u: "5", a: "2", t: "3" },
      },
      {
        id: "force", name: "Force on a mass", eq: "F = ma", find: "F",
        letters: { F: "the force", m: "the mass", a: "the acceleration" },
        example: { m: "12", a: "3" },
      },
      {
        id: "density", name: "Density", eq: "d = m/V", find: "d",
        letters: { d: "the density", m: "the mass", V: "the volume" },
        example: { m: "48", V: "6" },
      },
      {
        id: "ohm", name: "Ohm's law", eq: "V = IR", find: "V",
        letters: { V: "the voltage", I: "the current", R: "the resistance" },
        example: { I: "3", R: "8" },
      },
      {
        id: "work", name: "Work done", eq: "W = Fd", find: "W",
        letters: { W: "the work done", F: "the force", d: "the distance moved" },
        example: { F: "25", d: "4" },
      },
    ],
  },
  {
    group: "Money and everyday",
    items: [
      {
        id: "simple-interest", name: "Simple interest", eq: "I = PRT/100", find: "I",
        letters: { I: "the interest", P: "the money put in", R: "the rate per year", T: "the number of years" },
        example: { P: "8000", R: "5", T: "3" },
      },
      {
        id: "profit", name: "Profit", eq: "P = S - C", find: "P",
        letters: { P: "the profit", S: "the selling price", C: "the cost price" },
        example: { S: "1500", C: "1150" },
      },
      {
        id: "total-cost", name: "Cost of several of a thing", eq: "T = np", find: "T",
        letters: { T: "the total cost", n: "how many", p: "the price of one" },
        example: { n: "12", p: "250" },
      },
      {
        id: "average-speed", name: "Average speed", eq: "v = d/t", find: "v",
        letters: { v: "the average speed", d: "the distance", t: "the time taken" },
        example: { d: "240", t: "4" },
      },
      {
        id: "celsius", name: "Fahrenheit from Celsius", eq: "F = 9C/5 + 32", find: "F",
        letters: { F: "degrees Fahrenheit", C: "degrees Celsius" },
        example: { C: "35" },
      },
    ],
  },
  /* Angles are written in degrees with the ° on them, so sin(30°) has an exact
     value the special triangles give. */
  {
    group: "Trigonometry",
    items: [
      {
        id: "trig-opposite", name: "Opposite side from the hypotenuse", eq: "o = h·sin(θ°)", find: "o",
        letters: { o: "the side opposite the angle", h: "the hypotenuse", θ: "the angle in degrees" },
        example: { h: "10", θ: "30" },
      },
      {
        id: "trig-adjacent", name: "Adjacent side from the hypotenuse", eq: "a = h·cos(θ°)", find: "a",
        letters: { a: "the side next to the angle", h: "the hypotenuse", θ: "the angle in degrees" },
        example: { h: "12", θ: "60" },
      },
      {
        id: "trig-tan", name: "Opposite side from the adjacent", eq: "o = a·tan(θ°)", find: "o",
        letters: { o: "the side opposite the angle", a: "the side next to it", θ: "the angle in degrees" },
        example: { a: "7", θ: "45" },
      },
      {
        id: "trig-sas-area", name: "Area of a triangle from two sides and the angle", eq: "A = (1/2)ab·sin(C°)", find: "A",
        letters: { A: "the area", a: "one side", b: "another side", C: "the angle between them, in degrees" },
        example: { a: "6", b: "8", C: "30" },
      },
      {
        id: "trig-sine-rule", name: "The sine rule", eq: "a/sin(A°) = b/sin(B°)", find: "a",
        letters: { a: "a side", A: "the angle opposite it", b: "another side", B: "the angle opposite that" },
        example: { b: "10", A: "30", B: "90" },
      },
      {
        id: "trig-cosine-rule", name: "The cosine rule", eq: "c^2 = a^2 + b^2 - 2ab·cos(C°)", find: "c",
        letters: { c: "the side opposite the angle", a: "one side", b: "another side", C: "the angle between them, in degrees" },
        example: { a: "5", b: "8", C: "60" },
      },
      /* Finding the ANGLE: sin⁻¹ of both sides, the special triangles, then the
         degree signs come off. */
      {
        id: "trig-angle-sin", name: "Angle from the opposite and the hypotenuse", eq: "sin(θ°) = o/h", find: "θ",
        letters: { θ: "the angle in degrees", o: "the side opposite it", h: "the hypotenuse" },
        example: { o: "5", h: "10" },
      },
      {
        id: "trig-angle-cos", name: "Angle from the adjacent and the hypotenuse", eq: "cos(θ°) = a/h", find: "θ",
        letters: { θ: "the angle in degrees", a: "the side next to it", h: "the hypotenuse" },
        example: { a: "6", h: "12" },
      },
      {
        id: "trig-angle-tan", name: "Angle from the opposite and the adjacent", eq: "tan(θ°) = o/a", find: "θ",
        letters: { θ: "the angle in degrees", o: "the side opposite it", a: "the side next to it" },
        example: { o: "7", a: "7" },
      },
      {
        id: "trig-sine-rule-angle", name: "The sine rule, for an angle", eq: "sin(B°)/b = sin(A°)/a", find: "B",
        letters: { B: "the angle wanted", b: "the side opposite it", A: "another angle", a: "the side opposite that" },
        example: { b: "10", A: "30", a: "5" },
      },
      {
        id: "trig-cosine-rule-angle", name: "The cosine rule, for an angle", eq: "cos(C°) = (a^2 + b^2 - c^2)/(2ab)", find: "C",
        letters: { C: "the angle wanted", a: "one side", b: "another side", c: "the side opposite the angle" },
        example: { a: "5", b: "8", c: "7" },
      },
    ],
  },
  /* The letter a slope or an area is taken IN (the x of d/dx) is only given
     its value once the calculus is done — see substitute in ops.js. */
  {
    group: "Calculus",
    items: [
      {
        id: "calc-gradient", name: "Gradient of a curve at a point", eq: "m = d/dx(x^3 - 2x)", find: "m",
        letters: { m: "the gradient", x: "where on the curve" },
        example: { x: "2" },
      },
      {
        id: "calc-velocity", name: "Velocity from displacement", eq: "v = d/dt(5t^2 + 2t)", find: "v",
        letters: { v: "the velocity", t: "the time" },
        example: { t: "3" },
      },
      {
        id: "calc-area", name: "Area under y = x² from 0", eq: "A = ∫_0^b(x^2)dx", find: "A",
        letters: { A: "the area", b: "where the area stops" },
        example: { b: "3" },
      },
      {
        id: "calc-distance", name: "Distance from velocity", eq: "s = ∫_0^T(3t^2 + 2)dt", find: "s",
        letters: { s: "the distance", T: "the time taken" },
        example: { T: "2" },
      },
      {
        id: "calc-first-principles", name: "Gradient of y = x² from first principles", eq: "m = lim(h->0)(((x + h)^2 - x^2)/h)", find: "m",
        letters: { m: "the gradient", x: "where on the curve" },
        example: { x: "3" },
      },
    ],
  },
];

/** Every formula, flat, in the order they are listed. */
export const ALL = GROUPS.flatMap((g) => g.items.map((f) => ({ ...f, group: g.group })));

export const byId = (id) => ALL.find((f) => f.id === id) || null;

/* ── Reading a value a student typed ────────────────────────────────────────
   Whole numbers, decimals, a fraction, and a minus in front of any of them.
   Everything becomes an exact rational, because the moment a value is a float
   the tool starts telling small lies about thirds. Anything else is null, which
   the form reads as "not filled in". */

export function readValue(text) {
  const raw = String(text ?? "").trim().replace(/−/g, "-").replace(/\s+/g, "");
  if (!raw) return null;
  const m = /^(-?)(\d*\.?\d+)(?:\/(\d*\.?\d+))?$/.exec(raw);
  if (!m) return null;
  try {
    let v = R.fromDecimal(m[2]);
    if (m[3]) {
      const d = R.fromDecimal(m[3]);
      if (R.isZero(d)) return null;
      v = R.div(v, d);
    }
    return m[1] ? R.neg(v) : v;
  } catch {
    return null;
  }
}

/** The example values as the givens the card wants: letter -> exact rational. */
export function exampleGivens(formula) {
  const out = {};
  for (const [letter, text] of Object.entries(formula.example || {})) {
    const v = readValue(text);
    if (v) out[letter] = v;
  }
  return out;
}
