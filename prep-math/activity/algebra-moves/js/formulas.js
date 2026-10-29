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

   π is the number π itself, kept as a symbol: an answer stays as 49π until
   the student asks for a decimal.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as R from "./rational.js";

export const GROUPS = [
  {
    group: "Logarithms and bases",
    items: [
      {
        id: "log-value", name: "A logarithm to any base", eq: "L = log_b(x)", find: "L",
        letters: { L: "the power b is raised to", b: "the base", x: "the number it makes" },
        example: { b: "2", x: "8" },
        note: "log_b x is the power b needs to make x",
      },
      {
        id: "log-power", name: "A logarithm as a power", eq: "x = b^L", find: "x",
        letters: { x: "the number", b: "the base", L: "the logarithm" },
        example: { b: "2", L: "5" },
        note: "log_b x = L means x = b^L",
      },
      {
        id: "log-product", name: "Logs add when numbers multiply", eq: "L = log_b(x) + log_b(y)", find: "L",
        letters: { L: "the log of the product", b: "the base", x: "the first number", y: "the second number" },
        example: { b: "2", x: "4", y: "8" },
        note: "log_b(xy) = log_b x + log_b y",
      },
      {
        id: "log-quotient", name: "Logs subtract when numbers divide", eq: "L = log_b(x) - log_b(y)", find: "L",
        letters: { L: "the log of the quotient", b: "the base", x: "the top number", y: "the bottom number" },
        example: { b: "3", x: "81", y: "3" },
        note: "log_b(x/y) = log_b x − log_b y",
      },
      {
        id: "log-power-rule", name: "A power comes out of a log", eq: "L = n log_b(x)", find: "L",
        letters: { L: "the log of x to the n", n: "the power", b: "the base", x: "the number" },
        example: { n: "3", b: "2", x: "4" },
        note: "log_b(x^n) = n log_b x",
      },
      {
        id: "numeral-value", name: "A numeral with a letter base", eq: "N = 35_b", find: "N",
        letters: { N: "its value in base ten", b: "the base" },
        example: { b: "8" },
        note: "each digit times a power of the base",
      },
    ],
  },
  {
    group: "Counting",
    items: [
      {
        id: "arrangements", name: "Arrangements in a row: nPr", eq: "P = n!/(n - r)!", find: "P",
        letters: { P: "the number of arrangements", n: "how many things there are", r: "how many are taken, in order" },
        example: { n: "6", r: "3" },
        note: "the order matters",
      },
      {
        id: "choices", name: "Choices: nCr", eq: "C = n!/(r!(n - r)!)", find: "C",
        letters: { C: "the number of ways to choose", n: "how many things there are", r: "how many are chosen" },
        example: { n: "6", r: "2" },
        note: "the order does not matter",
      },
      {
        id: "all-arranged", name: "All of them in a row: n!", eq: "A = n!", find: "A",
        letters: { A: "the number of arrangements", n: "how many things there are" },
        example: { n: "5" },
      },
    ],
  },
  {
    group: "Statistics and probability",
    items: [
      {
        id: "mean", name: "Mean", eq: "m = S/n", find: "m",
        letters: { m: "the mean", S: "the sum of all the values", n: "how many values there are" },
        example: { S: "45", n: "5" },
      },
      {
        id: "mean-freq", name: "Mean from a frequency table", eq: "m = F/f", find: "m",
        letters: { m: "the mean", F: "the sum of frequency × value", f: "the total frequency" },
        example: { F: "132", f: "12" },
      },
      {
        id: "mean-arith2", name: "Arithmetic mean of two numbers", eq: "A = (a + b)/2", find: "A",
        letters: { A: "the arithmetic mean", a: "the first number", b: "the second number" },
        example: { a: "4", b: "9" },
      },
      {
        id: "mean-geo2", name: "Geometric mean of two numbers", eq: "G = sqrt(ab)", find: "G",
        letters: { G: "the geometric mean", a: "the first number", b: "the second number" },
        example: { a: "4", b: "9" },
        note: "the square root of their product",
      },
      {
        id: "mean-geo3", name: "Geometric mean of three numbers", eq: "G = cbrt(abc)", find: "G",
        letters: { G: "the geometric mean", a: "the first number", b: "the second number", c: "the third number" },
        example: { a: "2", b: "4", c: "8" },
        note: "the cube root of their product",
      },
      {
        id: "mean-harm2", name: "Harmonic mean of two numbers", eq: "H = 2ab/(a + b)", find: "H",
        letters: { H: "the harmonic mean", a: "the first number", b: "the second number" },
        example: { a: "2", b: "6" },
        note: "the reciprocal of the mean of the reciprocals",
      },
      {
        id: "mean-harm3", name: "Harmonic mean of three numbers", eq: "H = 3abc/(ab + bc + ac)", find: "H",
        letters: { H: "the harmonic mean", a: "the first number", b: "the second number", c: "the third number" },
        example: { a: "2", b: "3", c: "6" },
        note: "3 over the sum of the reciprocals",
      },
      {
        id: "range", name: "Range", eq: "R = H - L", find: "R",
        letters: { R: "the range", H: "the highest value", L: "the lowest value" },
        example: { H: "93", L: "47" },
      },
      {
        id: "probability", name: "Probability of an event", eq: "p = f/n", find: "p",
        letters: { p: "the probability", f: "the ways it can happen", n: "all the ways anything can happen" },
        example: { f: "3", n: "12" },
      },
      {
        id: "not-event", name: "Probability it does not happen", eq: "q = 1 - p", find: "q",
        letters: { q: "the probability it does not happen", p: "the probability it does" },
        example: { p: "3/8" },
      },
      {
        id: "and-event", name: "Both of two independent events", eq: "P = ab", find: "P",
        letters: { P: "the probability of both", a: "the probability of the first", b: "the probability of the second" },
        example: { a: "1/2", b: "1/3" },
      },
      {
        id: "or-event", name: "Either of two events", eq: "P = a + b - c", find: "P",
        letters: { P: "the probability of either", a: "the probability of the first", b: "the probability of the second", c: "the probability of both" },
        example: { a: "1/2", b: "1/3", c: "1/6" },
      },
      {
        id: "conditional", name: "Probability given something has happened", eq: "P = c/b", find: "P",
        letters: { P: "the probability of the first given the second", c: "the probability of both", b: "the probability of the second" },
        example: { c: "1/6", b: "1/2" },
      },
      {
        id: "expected", name: "Expected number of times", eq: "E = np", find: "E",
        letters: { E: "how many times to expect it", n: "how many tries", p: "the probability each time" },
        example: { n: "60", p: "1/6" },
      },
      {
        id: "variance", name: "Variance", eq: "v = S/n - m^2", find: "v",
        letters: { v: "the variance", S: "the sum of the squares of the values", n: "how many values there are", m: "the mean" },
        example: { S: "250", n: "5", m: "6" },
        note: "the mean of the squares, take away the square of the mean",
      },
      {
        id: "std-dev", name: "Standard deviation", eq: "s = sqrt(S/n - m^2)", find: "s",
        letters: { s: "the standard deviation", S: "the sum of the squares of the values", n: "how many values there are", m: "the mean" },
        example: { S: "250", n: "5", m: "7" },
        note: "the square root of the variance",
      },
      {
        id: "z-score", name: "Standard score (z)", eq: "z = (x - m)/s", find: "z",
        letters: { z: "the standard score", x: "the value", m: "the mean", s: "the standard deviation" },
        example: { x: "74", m: "62", s: "6" },
      },
      {
        id: "std-error", name: "Standard error of the mean", eq: "d = s/sqrt(n)", find: "d",
        letters: { d: "the standard error", s: "the standard deviation", n: "the sample size" },
        example: { s: "8", n: "16" },
      },
      {
        id: "binomial", name: "Binomial probability", eq: "P = nCr(n,r)p^r(1 - p)^(n - r)", find: "P",
        letters: { P: "the probability of exactly r successes", n: "how many tries", r: "how many successes", p: "the probability of success each time" },
        example: { n: "5", r: "2", p: "1/2" },
        note: "choose which r of the n tries succeed",
      },
    ],
  },
  {
    group: "Sequences and series",
    items: [
      {
        id: "ap-term", name: "Arithmetic sequence: the nth term", eq: "T = a + (n - 1)d", find: "T",
        letters: { T: "the nth term", a: "the first term", n: "which term, or how many terms", d: "the common difference" },
        example: { a: "3", n: "10", d: "4" },
        note: "add the same number each time",
      },
      {
        id: "ap-diff", name: "Arithmetic sequence: the common difference", eq: "d = (T - a)/(n - 1)", find: "d",
        letters: { d: "the common difference", T: "the nth term", a: "the first term", n: "which term, or how many terms" },
        example: { T: "39", a: "3", n: "10" },
      },
      {
        id: "ap-sum", name: "Arithmetic series: the sum, from the difference", eq: "S = n/2(2a + (n - 1)d)", find: "S",
        letters: { S: "the sum of the first n terms", a: "the first term", n: "how many terms", d: "the common difference" },
        example: { a: "3", n: "10", d: "4" },
      },
      {
        id: "ap-sum-last", name: "Arithmetic series: the sum, from the last term", eq: "S = n/2(a + l)", find: "S",
        letters: { S: "the sum of the first n terms", a: "the first term", l: "the last term", n: "how many terms" },
        example: { a: "3", l: "39", n: "10" },
      },
      {
        id: "gp-term", name: "Geometric sequence: the nth term", eq: "T = ar^(n - 1)", find: "T",
        letters: { T: "the nth term", a: "the first term", r: "the common ratio", n: "which term, or how many terms" },
        example: { a: "2", r: "3", n: "5" },
        note: "multiply by the same number each time",
      },
      {
        id: "gp-ratio", name: "Geometric sequence: the common ratio", eq: "r = b/a", find: "r",
        letters: { r: "the common ratio", b: "any term", a: "the term before it" },
        example: { b: "12", a: "4" },
      },
      {
        id: "gp-sum", name: "Geometric series: the sum, ratio above 1", eq: "S = a(r^n - 1)/(r - 1)", find: "S",
        letters: { S: "the sum of the first n terms", a: "the first term", r: "the common ratio", n: "how many terms" },
        example: { a: "2", r: "3", n: "5" },
      },
      {
        id: "gp-sum-small", name: "Geometric series: the sum, ratio below 1", eq: "S = a(1 - r^n)/(1 - r)", find: "S",
        letters: { S: "the sum of the first n terms", a: "the first term", r: "the common ratio", n: "how many terms" },
        example: { a: "1", r: "1/2", n: "4" },
      },
      {
        id: "gp-infinity", name: "Geometric series: the sum to infinity", eq: "S = a/(1 - r)", find: "S",
        letters: { S: "the sum of all the terms, for ever", a: "the first term", r: "the common ratio" },
        example: { a: "6", r: "1/3" },
        note: "only when r is between −1 and 1",
      },
      {
        id: "gp-mean", name: "Geometric mean of two numbers", eq: "g = sqrt(ab)", find: "g",
        letters: { g: "the geometric mean", a: "the first number", b: "the second number" },
        example: { a: "4", b: "9" },
      },
      {
        id: "term-from-sums", name: "A term from two sums", eq: "T = S - P", find: "T",
        letters: { T: "the nth term", S: "the sum of the first n terms", P: "the sum of the first n − 1 terms" },
        example: { S: "210", P: "171" },
      },
      {
        id: "sum-naturals", name: "Sum of 1 + 2 + 3 + … + n", eq: "S = n(n + 1)/2", find: "S",
        letters: { S: "the sum", n: "the last number" },
        example: { n: "100" },
      },
      {
        id: "sum-squares", name: "Sum of the squares 1² + 2² + … + n²", eq: "S = n(n + 1)(2n + 1)/6", find: "S",
        letters: { S: "the sum", n: "the last number" },
        example: { n: "10" },
      },
      {
        id: "sum-cubes-n", name: "Sum of the cubes 1³ + 2³ + … + n³", eq: "S = (n(n + 1)/2)^2", find: "S",
        letters: { S: "the sum", n: "the last number" },
        example: { n: "5" },
        note: "the square of the sum of 1 to n",
      },
    ],
  },
  {
    group: "Shapes",
    items: [
      {
        id: "pythagoras", name: "Pythagorean theorem", eq: "a^2 + b^2 = c^2", find: "c",
        letters: { c: "the hypotenuse, the longest side", a: "one shorter side", b: "the other shorter side" },
        example: { a: "3", b: "4" },
      },
      {
        id: "arc-length", name: "Arc length", eq: "s = 2πr(θ/360)", find: "s",
        letters: { s: "the length of the arc", r: "the radius", θ: "the angle at the centre, in degrees" },
        example: { r: "7", θ: "90" },
      },
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
        id: "circle-area", name: "Area of a circle", eq: "A = πr^2", find: "A",
        letters: { A: "the area", r: "the radius" },
        example: { r: "7" },
      },
      {
        id: "circle-round", name: "Distance round a circle", eq: "C = 2πr", find: "C",
        letters: { C: "the distance round", r: "the radius" },
        example: { r: "14" },
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
        id: "ellipse-area", name: "Area of an ellipse", eq: "A = πab", find: "A",
        letters: { A: "the area", a: "the semi-major axis", b: "the semi-minor axis" },
        example: { a: "7", b: "4" },
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
        id: "cylinder-volume", name: "Volume of a cylinder", eq: "V = πr^2h", find: "V",
        letters: { V: "the volume", r: "the radius", h: "the height" },
        example: { r: "7", h: "10" },
      },
      {
        id: "cylinder-surface-area", name: "Total surface area of a cylinder", eq: "A = 2πr(r + h)", find: "A",
        letters: { A: "the surface area", r: "the radius", h: "the height" },
        example: { r: "7", h: "10" },
      },
      {
        id: "sphere-volume", name: "Volume of a sphere", eq: "V = (4/3)πr^3", find: "V",
        letters: { V: "the volume", r: "the radius" },
        example: { r: "7" },
      },
      {
        id: "sphere-surface-area", name: "Surface area of a sphere", eq: "A = 4πr^2", find: "A",
        letters: { A: "the surface area", r: "the radius" },
        example: { r: "7" },
      },
      {
        id: "cone-volume", name: "Volume of a cone", eq: "V = (1/3)πr^2h", find: "V",
        letters: { V: "the volume", r: "the base radius", h: "the height" },
        example: { r: "3", h: "4" },
      },
      {
        id: "cone-surface-area", name: "Total surface area of a cone", eq: "A = πr(r + sqrt(r^2 + h^2))", find: "A",
        letters: { A: "the surface area", r: "the base radius", h: "the height" },
        example: { r: "3", h: "4" },
        note: "the slant height is sqrt(r^2 + h^2)",
      },
      {
        id: "pyramid-volume", name: "Volume of a pyramid", eq: "V = (1/3)Bh", find: "V",
        letters: { V: "the volume", B: "the base area", h: "the height" },
        example: { B: "20", h: "6" },
      },
      {
        id: "rect-diagonal", name: "Diagonal of a rectangle", eq: "d = sqrt(l^2 + w^2)", find: "d",
        letters: { d: "the diagonal", l: "the length", w: "the width" },
        example: { l: "12", w: "5" },
        note: "Pythagoras on the two sides",
      },
      {
        id: "square-diagonal", name: "Diagonal of a square", eq: "d = ssqrt(2)", find: "d",
        letters: { d: "the diagonal", s: "the side" },
        example: { s: "5" },
      },
      {
        id: "cuboid-diagonal", name: "Space diagonal of a cuboid", eq: "d = sqrt(l^2 + w^2 + h^2)", find: "d",
        letters: { d: "the diagonal from corner to corner", l: "the length", w: "the width", h: "the height" },
        example: { l: "2", w: "3", h: "6" },
      },
      {
        id: "equilateral-area", name: "Area of an equilateral triangle", eq: "A = sqrt(3)s^2/4", find: "A",
        letters: { A: "the area", s: "the side" },
        example: { s: "4" },
      },
      {
        id: "annulus-area", name: "Area of a ring between two circles", eq: "A = π(R^2 - r^2)", find: "A",
        letters: { A: "the area of the ring", R: "the outer radius", r: "the inner radius" },
        example: { R: "10", r: "7" },
      },
      {
        id: "chord-length", name: "Length of a chord from its distance to the centre", eq: "c = 2sqrt(r^2 - d^2)", find: "c",
        letters: { c: "the chord", r: "the radius", d: "the distance from the centre to the chord" },
        example: { r: "13", d: "5" },
      },
      {
        id: "chord-angle", name: "Length of a chord from the angle it makes at the centre", eq: "c = 2r·sin(t°/2)", find: "c",
        letters: { c: "the chord", r: "the radius", t: "the angle at the centre, in degrees" },
        example: { r: "10", t: "60" },
      },
      {
        id: "segment-area", name: "Area of a segment of a circle", eq: "A = (t/360)πr^2 - (1/2)r^2·sin(t°)", find: "A",
        letters: { A: "the area of the segment", t: "the angle at the centre, in degrees", r: "the radius" },
        example: { t: "90", r: "7" },
        note: "the sector take away its triangle",
      },
      {
        id: "prism-volume", name: "Volume of a prism", eq: "V = Ah", find: "V",
        letters: { V: "the volume", A: "the area of the cross-section", h: "the length of the prism" },
        example: { A: "15", h: "8" },
      },
      {
        id: "cylinder-curved", name: "Curved surface area of a cylinder", eq: "A = 2πrh", find: "A",
        letters: { A: "the curved area", r: "the radius", h: "the height" },
        example: { r: "7", h: "10" },
      },
      {
        id: "cone-slant", name: "Slant height of a cone", eq: "l = sqrt(r^2 + h^2)", find: "l",
        letters: { l: "the slant height", r: "the base radius", h: "the height" },
        example: { r: "3", h: "4" },
      },
      {
        id: "cone-curved", name: "Curved surface area of a cone", eq: "A = πrl", find: "A",
        letters: { A: "the curved area", r: "the base radius", l: "the slant height" },
        example: { r: "7", l: "10" },
      },
      {
        id: "frustum-volume", name: "Volume of a frustum of a cone", eq: "V = (1/3)πh(R^2 + Rr + r^2)", find: "V",
        letters: { V: "the volume", h: "the height", R: "the bigger radius", r: "the smaller radius" },
        example: { h: "6", R: "7", r: "3" },
      },
      {
        id: "hemisphere-volume", name: "Volume of a hemisphere", eq: "V = (2/3)πr^3", find: "V",
        letters: { V: "the volume", r: "the radius" },
        example: { r: "7" },
      },
      {
        id: "hemisphere-curved", name: "Curved surface area of a hemisphere", eq: "A = 2πr^2", find: "A",
        letters: { A: "the curved area", r: "the radius" },
        example: { r: "7" },
      },
      {
        id: "hemisphere-total", name: "Total surface area of a hemisphere", eq: "A = 3πr^2", find: "A",
        letters: { A: "the total area", r: "the radius" },
        example: { r: "7" },
        note: "the curved part plus the flat circle",
      },
      {
        id: "polygon-angle-sum", name: "Sum of the interior angles of a polygon", eq: "S = 180(n - 2)", find: "S",
        letters: { S: "the sum of the angles, in degrees", n: "the number of sides" },
        example: { n: "8" },
      },
      {
        id: "polygon-interior", name: "Each interior angle of a regular polygon", eq: "A = 180(n - 2)/n", find: "A",
        letters: { A: "one interior angle, in degrees", n: "the number of sides" },
        example: { n: "6" },
      },
      {
        id: "polygon-exterior", name: "Each exterior angle of a regular polygon", eq: "E = 360/n", find: "E",
        letters: { E: "one exterior angle, in degrees", n: "the number of sides" },
        example: { n: "9" },
      },
      {
        id: "polygon-diagonals", name: "Diagonals of a polygon", eq: "D = n(n - 3)/2", find: "D",
        letters: { D: "the number of diagonals", n: "the number of sides" },
        example: { n: "10" },
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
        id: "compound-amount", name: "Compound interest: the amount", eq: "A = P(1 + R/100)^n", find: "A",
        letters: { A: "the amount after n years", P: "the money put in", R: "the rate per year", n: "the number of years" },
        example: { P: "10000", R: "10", n: "2" },
        note: "each year's interest is added before the next year's is worked out",
      },
      {
        id: "compound-interest", name: "Compound interest earned", eq: "I = P((1 + R/100)^n - 1)", find: "I",
        letters: { I: "the compound interest", P: "the money put in", R: "the rate per year", n: "the number of years" },
        example: { P: "10000", R: "10", n: "2" },
      },
      {
        id: "simple-rate", name: "Simple interest: the rate", eq: "R = 100I/(PT)", find: "R",
        letters: { R: "the rate per year", I: "the interest", P: "the money put in", T: "the number of years" },
        example: { I: "1200", P: "8000", T: "3" },
      },
      {
        id: "simple-time", name: "Simple interest: the time", eq: "T = 100I/(PR)", find: "T",
        letters: { T: "the number of years", I: "the interest", P: "the money put in", R: "the rate per year" },
        example: { I: "1200", P: "8000", R: "5" },
      },
      {
        id: "simple-principal", name: "Simple interest: the money put in", eq: "P = 100I/(RT)", find: "P",
        letters: { P: "the money put in", I: "the interest", R: "the rate per year", T: "the number of years" },
        example: { I: "1200", R: "5", T: "3" },
      },
      {
        id: "compound-rate", name: "Compound interest: the rate", eq: "R = 100((A/P)^(1/n) - 1)", find: "R",
        letters: { R: "the rate per year", A: "the amount after n years", P: "the money put in", n: "the number of years" },
        example: { A: "12100", P: "10000", n: "2" },
        note: "take the n-th root of how many times the money has grown, then subtract 1",
      },
      {
        id: "compound-time", name: "Compound interest: the time", eq: "n = log_(1 + R/100)(A/P)", find: "n",
        letters: { n: "the number of years", A: "the amount after n years", P: "the money put in", R: "the rate per year" },
        example: { A: "40000", P: "10000", R: "100" },
        note: "how many times the money must be multiplied by (1 + R/100) to reach the amount",
      },
      {
        id: "compound-principal", name: "Compound interest: the money put in", eq: "P = A/(1 + R/100)^n", find: "P",
        letters: { P: "the money put in", A: "the amount after n years", R: "the rate per year", n: "the number of years" },
        example: { A: "12100", R: "10", n: "2" },
      },
      {
        id: "depr-value", name: "Depreciation: the value after n years", eq: "V = P(1 - R/100)^n", find: "V",
        letters: { V: "the value after n years", P: "the value to begin with", R: "the percentage lost each year", n: "the number of years" },
        example: { P: "10000", R: "10", n: "2" },
        note: "each year loses a percentage of the year before's value, not of the original",
      },
      {
        id: "depr-rate", name: "Depreciation: the rate", eq: "R = 100(1 - (V/P)^(1/n))", find: "R",
        letters: { V: "the value after n years", P: "the value to begin with", R: "the percentage lost each year", n: "the number of years" },
        example: { V: "8100", P: "10000", n: "2" },
      },
      {
        id: "depr-time", name: "Depreciation: the time", eq: "n = log_(1 - R/100)(V/P)", find: "n",
        letters: { V: "the value after n years", P: "the value to begin with", R: "the percentage lost each year", n: "the number of years" },
        example: { V: "2500", P: "10000", R: "50" },
      },
      {
        id: "depr-start", name: "Depreciation: the value to begin with", eq: "P = V/(1 - R/100)^n", find: "P",
        letters: { V: "the value after n years", P: "the value to begin with", R: "the percentage lost each year", n: "the number of years" },
        example: { V: "8100", R: "10", n: "2" },
      },
      {
        id: "appr-value", name: "Appreciation: the value after n years", eq: "V = P(1 + R/100)^n", find: "V",
        letters: { V: "the value after n years", P: "the value to begin with", R: "the percentage gained each year", n: "the number of years" },
        example: { P: "10000", R: "10", n: "2" },
        note: "each year gains a percentage of the year before's value",
      },
      {
        id: "appr-rate", name: "Appreciation: the rate", eq: "R = 100((V/P)^(1/n) - 1)", find: "R",
        letters: { V: "the value after n years", P: "the value to begin with", R: "the percentage gained each year", n: "the number of years" },
        example: { V: "12100", P: "10000", n: "2" },
      },
      {
        id: "appr-time", name: "Appreciation: the time", eq: "n = log_(1 + R/100)(V/P)", find: "n",
        letters: { V: "the value after n years", P: "the value to begin with", R: "the percentage gained each year", n: "the number of years" },
        example: { V: "40000", P: "10000", R: "100" },
      },
      {
        id: "appr-start", name: "Appreciation: the value to begin with", eq: "P = V/(1 + R/100)^n", find: "P",
        letters: { V: "the value after n years", P: "the value to begin with", R: "the percentage gained each year", n: "the number of years" },
        example: { V: "12100", R: "10", n: "2" },
      },
      {
        id: "depr-line", name: "Straight-line depreciation each year", eq: "D = (C - S)/n", find: "D",
        letters: { D: "the amount lost each year", C: "the cost when new", S: "the scrap value at the end", n: "the number of years" },
        example: { C: "500000", S: "100000", n: "8" },
        note: "the same amount comes off every year",
      },
      {
        id: "depr-line-value", name: "Straight-line: the value after n years", eq: "V = C - Dn", find: "V",
        letters: { V: "the value after n years", C: "the cost when new", D: "the amount lost each year", n: "the number of years" },
        example: { C: "500000", D: "50000", n: "3" },
      },
      {
        id: "pct-change", name: "Percentage change", eq: "C = 100(N - O)/O", find: "C",
        letters: { C: "the percentage change (negative for a fall)", N: "the new value", O: "the original value" },
        example: { N: "65", O: "50" },
      },
      {
        id: "pct-increase", name: "After a percentage increase", eq: "N = O(100 + R)/100", find: "N",
        letters: { N: "the new value", O: "the original value", R: "the percentage increase" },
        example: { O: "40", R: "15" },
      },
      {
        id: "pct-decrease", name: "After a percentage decrease", eq: "N = O(100 - R)/100", find: "N",
        letters: { N: "the new value", O: "the original value", R: "the percentage decrease" },
        example: { O: "40", R: "15" },
      },
      {
        id: "reverse-increase", name: "Reverse percentage: the original before an increase", eq: "O = 100N/(100 + R)", find: "O",
        letters: { O: "the original value", N: "the value after the increase", R: "the percentage increase" },
        example: { N: "115", R: "15" },
        note: "the new value is (100 + R)% of the original, so divide by that and multiply by 100",
      },
      {
        id: "reverse-decrease", name: "Reverse percentage: the original before a decrease", eq: "O = 100N/(100 - R)", find: "O",
        letters: { O: "the original value", N: "the value after the decrease", R: "the percentage decrease" },
        example: { N: "85", R: "15" },
        note: "the new value is (100 − R)% of the original, so divide by that and multiply by 100",
      },
      {
        id: "profit", name: "Profit", eq: "P = S - C", find: "P",
        letters: { P: "the profit", S: "the selling price", C: "the cost price" },
        example: { S: "1500", C: "1150" },
      },
      {
        id: "loss", name: "Loss", eq: "L = C - S", find: "L",
        letters: { L: "the loss", C: "the cost price", S: "the selling price" },
        example: { C: "1500", S: "1150" },
      },
      {
        id: "pct-profit", name: "Percentage profit", eq: "P = 100(S - C)/C", find: "P",
        letters: { P: "the percentage profit", S: "the selling price", C: "the cost price" },
        example: { S: "1380", C: "1200" },
        note: "the profit as a percentage of the COST price",
      },
      {
        id: "pct-loss", name: "Percentage loss", eq: "L = 100(C - S)/C", find: "L",
        letters: { L: "the percentage loss", C: "the cost price", S: "the selling price" },
        example: { C: "1200", S: "1020" },
        note: "the loss as a percentage of the COST price",
      },
      {
        id: "sell-profit", name: "Selling price for a given percentage profit", eq: "S = C(100 + P)/100", find: "S",
        letters: { S: "the selling price", C: "the cost price", P: "the percentage profit" },
        example: { C: "1200", P: "15" },
      },
      {
        id: "sell-loss", name: "Selling price for a given percentage loss", eq: "S = C(100 - L)/100", find: "S",
        letters: { S: "the selling price", C: "the cost price", L: "the percentage loss" },
        example: { C: "1200", L: "15" },
      },
      {
        id: "cost-from-profit", name: "Cost price from a percentage profit", eq: "C = 100S/(100 + P)", find: "C",
        letters: { C: "the cost price", S: "the selling price", P: "the percentage profit" },
        example: { S: "1380", P: "15" },
        note: "the selling price is (100 + P)% of the cost price",
      },
      {
        id: "cost-from-loss", name: "Cost price from a percentage loss", eq: "C = 100S/(100 - L)", find: "C",
        letters: { C: "the cost price", S: "the selling price", L: "the percentage loss" },
        example: { S: "1020", L: "15" },
        note: "the selling price is (100 − L)% of the cost price",
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
  {
    group: "Ratio, proportion and variation",
    items: [
      {
        id: "share-ratio", name: "Share in a ratio: the first part", eq: "S = Ta/(a + b)", find: "S",
        letters: { S: "the first share", T: "the total to be shared", a: "the first part of the ratio", b: "the second part of the ratio" },
        example: { T: "360", a: "2", b: "7" },
        note: "the total is split into a + b equal parts",
      },
      {
        id: "share-ratio-2", name: "Share in a ratio: the second part", eq: "S = Tb/(a + b)", find: "S",
        letters: { S: "the second share", T: "the total to be shared", a: "the first part of the ratio", b: "the second part of the ratio" },
        example: { T: "360", a: "2", b: "7" },
      },
      {
        id: "ratio-equal", name: "Two ratios that are equal", eq: "a/b = c/d", find: "a",
        letters: { a: "the first number of the first ratio", b: "the second number of the first ratio", c: "the first number of the second ratio", d: "the second number of the second ratio" },
        example: { b: "6", c: "10", d: "15" },
        note: "a : b = c : d, written as fractions",
      },
      {
        id: "direct-prop", name: "Direct proportion: y = kx", eq: "y = kx", find: "y",
        letters: { y: "the quantity that changes with x", k: "the constant of proportionality", x: "the quantity it is proportional to" },
        example: { k: "4", x: "7" },
        note: "double x and y doubles",
      },
      {
        id: "direct-two", name: "Direct proportion between two cases", eq: "y/x = Y/X", find: "Y",
        letters: { y: "the first y", x: "the first x", Y: "the second y", X: "the second x" },
        example: { y: "12", x: "4", X: "10" },
        note: "the ratio y : x stays the same",
      },
      {
        id: "direct-square", name: "Varies as the square: y = kx²", eq: "y = kx^2", find: "y",
        letters: { y: "the quantity that changes", k: "the constant of variation", x: "the quantity it is the square of" },
        example: { k: "3", x: "5" },
        note: "double x and y becomes four times as big",
      },
      {
        id: "direct-root", name: "Varies as the square root: y = k√x", eq: "y = ksqrt(x)", find: "y",
        letters: { y: "the quantity that changes", k: "the constant of variation", x: "the quantity whose root it follows" },
        example: { k: "3", x: "16" },
      },
      {
        id: "direct-cube", name: "Varies as the cube: y = kx³", eq: "y = kx^3", find: "y",
        letters: { y: "the quantity that changes", k: "the constant of variation", x: "the quantity it is the cube of" },
        example: { k: "2", x: "3" },
      },
      {
        id: "inverse-prop", name: "Inverse proportion: y = k/x", eq: "y = k/x", find: "y",
        letters: { y: "the quantity that changes", k: "the constant of variation", x: "the quantity it is inversely proportional to" },
        example: { k: "24", x: "6" },
        note: "double x and y halves",
      },
      {
        id: "inverse-two", name: "Inverse proportion between two cases", eq: "xy = XY", find: "Y",
        letters: { x: "the first x", y: "the first y", X: "the second x", Y: "the second y" },
        example: { x: "6", y: "8", X: "12" },
        note: "the product xy stays the same",
      },
      {
        id: "inverse-square", name: "Inverse square: y = k/x²", eq: "y = k/x^2", find: "y",
        letters: { y: "the quantity that changes", k: "the constant of variation", x: "the quantity it is inversely proportional to the square of" },
        example: { k: "100", x: "5" },
        note: "double x and y falls to a quarter",
      },
      {
        id: "joint-var", name: "Joint variation: y = kxz", eq: "y = kxz", find: "y",
        letters: { y: "the quantity that changes", k: "the constant of variation", x: "the first quantity", z: "the second quantity" },
        example: { k: "2", x: "3", z: "5" },
        note: "y varies as x and as z together",
      },
      {
        id: "joint-inv", name: "Joint and inverse: y = kx/z", eq: "y = kx/z", find: "y",
        letters: { y: "the quantity that changes", k: "the constant of variation", x: "the quantity it rises with", z: "the quantity it falls with" },
        example: { k: "6", x: "4", z: "3" },
      },
      {
        id: "partial-var", name: "Partial variation: y = a + bx", eq: "y = a + bx", find: "y",
        letters: { y: "the total", a: "the part that stays fixed", b: "the part for each unit of x", x: "how many units" },
        example: { a: "500", b: "30", x: "8" },
        note: "a fixed part plus a part that varies as x",
      },
      {
        id: "scale-length", name: "Scale factor of similar shapes", eq: "k = L/l", find: "k",
        letters: { k: "the scale factor", l: "a length on the first shape", L: "the matching length on the second" },
        example: { l: "4", L: "10" },
      },
      {
        id: "scale-area", name: "Areas of similar shapes", eq: "B = Ak^2", find: "B",
        letters: { B: "the area of the second shape", A: "the area of the first shape", k: "the scale factor of the lengths" },
        example: { A: "12", k: "3" },
        note: "areas change by the scale factor squared",
      },
      {
        id: "scale-volume", name: "Volumes of similar solids", eq: "W = Vk^3", find: "W",
        letters: { W: "the volume of the second solid", V: "the volume of the first solid", k: "the scale factor of the lengths" },
        example: { V: "8", k: "3" },
        note: "volumes change by the scale factor cubed",
      },
      {
        id: "map-scale", name: "Distance from a map", eq: "D = dN", find: "D",
        letters: { D: "the real distance", d: "the distance on the map", N: "the scale, 1 : N" },
        example: { d: "6", N: "50000" },
        note: "the real distance is N times the distance on the map",
      },
      {
        id: "work-rate", name: "Workers and time (inverse proportion)", eq: "nt = NT", find: "T",
        letters: { n: "the first number of workers", t: "the time they take", N: "the second number of workers", T: "the time they take" },
        example: { n: "6", t: "10", N: "15" },
      },
    ],
  },
  {
    group: "Physics: motion, force and energy",
    items: [
      {
        id: "suvat-v", name: "Speed from the distance covered", eq: "v^2 = u^2 + 2as", find: "a",
        letters: { v: "the final speed", u: "the starting speed", a: "the acceleration", s: "the distance" },
        example: { v: "13", u: "5", s: "9" },
        note: "no time needed",
      },
      {
        id: "suvat-s", name: "Distance with a steady acceleration", eq: "s = ut + (1/2)at^2", find: "s",
        letters: { s: "the distance", u: "the starting speed", t: "the time", a: "the acceleration" },
        example: { u: "4", t: "3", a: "2" },
      },
      {
        id: "suvat-avg", name: "Distance from the average speed", eq: "s = (u + v)t/2", find: "s",
        letters: { s: "the distance", u: "the starting speed", v: "the final speed", t: "the time" },
        example: { u: "4", v: "10", t: "5" },
      },
      {
        id: "momentum", name: "Momentum", eq: "p = mv", find: "p",
        letters: { p: "the momentum", m: "the mass", v: "the speed" },
        example: { m: "6", v: "4" },
      },
      {
        id: "impulse", name: "Impulse and change of momentum", eq: "Ft = m(v - u)", find: "F",
        letters: { F: "the force", t: "the time it acts", m: "the mass", v: "the final speed", u: "the starting speed" },
        example: { t: "2", m: "5", v: "12", u: "2" },
      },
      {
        id: "weight", name: "Weight", eq: "W = mg", find: "W",
        letters: { W: "the weight", m: "the mass", g: "the pull of gravity per kilogram" },
        example: { m: "8", g: "10" },
        note: "g is about 10 N per kg",
      },
      {
        id: "pressure", name: "Pressure", eq: "P = F/A", find: "P",
        letters: { P: "the pressure", F: "the force", A: "the area it presses on" },
        example: { F: "200", A: "5" },
      },
      {
        id: "liquid-pressure", name: "Pressure in a liquid", eq: "P = hdg", find: "P",
        letters: { P: "the pressure", h: "the depth", d: "the density of the liquid", g: "the pull of gravity per kilogram" },
        example: { h: "3", d: "1000", g: "10" },
      },
      {
        id: "moments", name: "Moments in balance", eq: "Fd = fx", find: "F",
        letters: { F: "the first force", d: "its distance from the pivot", f: "the second force", x: "its distance from the pivot" },
        example: { d: "4", f: "10", x: "6" },
        note: "clockwise moment = anticlockwise moment",
      },
      {
        id: "hooke", name: "Hooke's law for a spring", eq: "F = kx", find: "F",
        letters: { F: "the force", k: "the spring constant", x: "the stretch" },
        example: { k: "50", x: "0.4" },
      },
      {
        id: "power", name: "Power", eq: "P = W/t", find: "P",
        letters: { P: "the power", W: "the work done", t: "the time" },
        example: { W: "600", t: "20" },
      },
      {
        id: "efficiency", name: "Efficiency", eq: "E = 100u/T", find: "E",
        letters: { E: "the efficiency, as a percentage", u: "the useful work out", T: "the total work put in" },
        example: { u: "60", T: "80" },
      },
      {
        id: "kinetic", name: "Kinetic energy", eq: "K = (1/2)mv^2", find: "K",
        letters: { K: "the kinetic energy", m: "the mass", v: "the speed" },
        example: { m: "4", v: "5" },
      },
      {
        id: "potential", name: "Potential energy", eq: "P = mgh", find: "P",
        letters: { P: "the potential energy", m: "the mass", g: "the pull of gravity per kilogram", h: "the height" },
        example: { m: "5", g: "10", h: "3" },
      },
      {
        id: "centripetal", name: "Force towards the centre of a circle", eq: "F = mv^2/r", find: "F",
        letters: { F: "the force", m: "the mass", v: "the speed", r: "the radius of the circle" },
        example: { m: "2", v: "6", r: "4" },
      },
      {
        id: "gravitation", name: "Gravitation between two masses", eq: "F = Gmn/r^2", find: "F",
        letters: { F: "the force", G: "the gravitational constant", m: "one mass", n: "the other mass", r: "the distance between them" },
        example: { G: "2", m: "3", n: "4", r: "2" },
      },
      {
        id: "mech-advantage", name: "Mechanical advantage", eq: "M = L/E", find: "M",
        letters: { M: "the mechanical advantage", L: "the load", E: "the effort" },
        example: { L: "400", E: "80" },
      },
      {
        id: "velocity-ratio", name: "Velocity ratio", eq: "V = D/d", find: "V",
        letters: { V: "the velocity ratio", D: "the distance the effort moves", d: "the distance the load moves" },
        example: { D: "12", d: "3" },
      },
    ],
  },
  {
    group: "Physics: waves, light and electricity",
    items: [
      {
        id: "wave-speed", name: "Speed of a wave", eq: "v = fw", find: "v",
        letters: { v: "the wave speed", f: "the frequency", w: "the wavelength" },
        example: { f: "50", w: "4" },
      },
      {
        id: "frequency", name: "Frequency and period", eq: "f = 1/T", find: "f",
        letters: { f: "the frequency", T: "the time for one wave" },
        example: { T: "0.02" },
      },
      {
        id: "refraction", name: "Refractive index (Snell's law)", eq: "n = sin(a°)/sin(b°)", find: "n",
        letters: { n: "the refractive index", a: "the angle in the air, in degrees", b: "the angle in the material, in degrees" },
        example: { a: "30", b: "30" },
      },
      {
        id: "lens", name: "The lens formula", eq: "1/F = 1/u + 1/v", find: "F",
        letters: { F: "the focal length", u: "the distance of the object", v: "the distance of the image" },
        example: { u: "30", v: "60" },
      },
      {
        id: "magnification", name: "Magnification", eq: "m = v/u", find: "m",
        letters: { m: "the magnification", v: "the distance of the image", u: "the distance of the object" },
        example: { v: "60", u: "20" },
      },
      {
        id: "power-electric", name: "Electrical power", eq: "P = IV", find: "P",
        letters: { P: "the power", I: "the current", V: "the voltage" },
        example: { I: "5", V: "230" },
      },
      {
        id: "charge", name: "Charge", eq: "Q = It", find: "Q",
        letters: { Q: "the charge", I: "the current", t: "the time" },
        example: { I: "3", t: "20" },
      },
      {
        id: "electric-energy", name: "Electrical energy", eq: "E = IVt", find: "E",
        letters: { E: "the energy", I: "the current", V: "the voltage", t: "the time" },
        example: { I: "2", V: "12", t: "30" },
      },
      {
        id: "series", name: "Resistors in series", eq: "R = a + b", find: "R",
        letters: { R: "the total resistance", a: "the first resistor", b: "the second resistor" },
        example: { a: "4", b: "6" },
      },
      {
        id: "parallel", name: "Resistors in parallel", eq: "1/R = 1/a + 1/b", find: "R",
        letters: { R: "the total resistance", a: "the first resistor", b: "the second resistor" },
        example: { a: "6", b: "3" },
      },
      {
        id: "resistivity", name: "Resistance of a wire", eq: "R = dL/A", find: "R",
        letters: { R: "the resistance", d: "the resistivity of the material", L: "the length", A: "the cross-section area" },
        example: { d: "2", L: "10", A: "4" },
      },
      {
        id: "transformer", name: "A transformer", eq: "V/v = N/n", find: "V",
        letters: { V: "the voltage across the primary coil", v: "the voltage across the secondary coil", N: "turns on the primary coil", n: "turns on the secondary coil" },
        example: { v: "12", N: "2000", n: "100" },
      },
    ],
  },
  {
    group: "Physics: heat, gases and the nucleus",
    items: [
      {
        id: "heat-capacity", name: "Heat to change a temperature", eq: "Q = mct", find: "Q",
        letters: { Q: "the heat energy", m: "the mass", c: "the specific heat capacity", t: "the temperature change" },
        example: { m: "2", c: "4200", t: "10" },
      },
      {
        id: "latent-heat", name: "Heat to change state", eq: "Q = ml", find: "Q",
        letters: { Q: "the heat energy", m: "the mass", l: "the specific latent heat" },
        example: { m: "0.5", l: "336000" },
      },
      {
        id: "expansion", name: "Expansion of a solid", eq: "x = Lat", find: "x",
        letters: { x: "the increase in length", L: "the original length", a: "the expansion coefficient", t: "the rise in temperature" },
        example: { L: "2", a: "0.00002", t: "50" },
      },
      {
        id: "boyle", name: "Boyle's law", eq: "PV = pv", find: "P",
        letters: { P: "the first pressure", V: "the first volume", p: "the second pressure", v: "the second volume" },
        example: { V: "6", p: "3", v: "10" },
        note: "the temperature stays the same",
      },
      {
        id: "charles", name: "Charles's law", eq: "V/T = v/t", find: "V",
        letters: { V: "the first volume", T: "the first temperature, in kelvin", v: "the second volume", t: "the second temperature, in kelvin" },
        example: { T: "300", v: "8", t: "400" },
        note: "the pressure stays the same",
      },
      {
        id: "pressure-law", name: "The pressure law", eq: "P/T = p/t", find: "P",
        letters: { P: "the first pressure", T: "the first temperature, in kelvin", p: "the second pressure", t: "the second temperature, in kelvin" },
        example: { T: "300", p: "3", t: "450" },
        note: "the volume stays the same",
      },
      {
        id: "gas-law", name: "The general gas law", eq: "PV/T = pv/t", find: "P",
        letters: { P: "the first pressure", V: "the first volume", T: "the first temperature, in kelvin", p: "the second pressure", v: "the second volume", t: "the second temperature, in kelvin" },
        example: { V: "4", T: "300", p: "2", v: "8", t: "600" },
      },
      {
        id: "half-life", name: "What is left after some half-lives", eq: "N = A(1/2)^n", find: "N",
        letters: { N: "the amount left", A: "the amount to begin with", n: "the number of half-lives" },
        example: { A: "80", n: "3" },
      },
      {
        id: "half-life-time", name: "What is left after a time", eq: "N = A(1/2)^(t/h)", find: "N",
        letters: { N: "the amount left", A: "the amount to begin with", t: "the time that has passed", h: "the half-life" },
        example: { A: "80", t: "15", h: "5" },
      },
    ],
  },
  {
    group: "Chemistry: moles and solutions",
    items: [
      {
        id: "moles-mass", name: "Moles from a mass", eq: "n = m/M", find: "n",
        letters: { n: "the number of moles", m: "the mass", M: "the molar mass" },
        example: { m: "36", M: "18" },
      },
      {
        id: "moles-gas", name: "Moles of a gas at room conditions", eq: "n = V/24", find: "n",
        letters: { n: "the number of moles", V: "the volume, in dm³" },
        example: { V: "48" },
        note: "one mole of gas fills 24 dm³ at room temperature and pressure",
      },
      {
        id: "moles-stp", name: "Moles of a gas at s.t.p.", eq: "n = V/22.4", find: "n",
        letters: { n: "the number of moles", V: "the volume, in dm³" },
        example: { V: "44.8" },
        note: "one mole of gas fills 22.4 dm³ at standard temperature and pressure",
      },
      {
        id: "moles-solution", name: "Moles in a solution", eq: "n = CV", find: "n",
        letters: { n: "the number of moles", C: "the concentration, in mol/dm³", V: "the volume, in dm³" },
        example: { C: "0.5", V: "2" },
      },
      {
        id: "concentration-mass", name: "Concentration in grams per dm³", eq: "C = m/V", find: "C",
        letters: { C: "the concentration, in g/dm³", m: "the mass dissolved", V: "the volume, in dm³" },
        example: { m: "20", V: "0.5" },
      },
      {
        id: "dilution", name: "Dilution", eq: "CV = cv", find: "C",
        letters: { C: "the first concentration", V: "the first volume", c: "the second concentration", v: "the second volume" },
        example: { V: "50", c: "0.2", v: "250" },
        note: "the moles stay the same",
      },
      {
        id: "avogadro", name: "Particles in some moles", eq: "N = nL", find: "N",
        letters: { N: "the number of particles", n: "the number of moles", L: "Avogadro's constant" },
        example: { n: "2", L: "6" },
        note: "L is about 6 × 10²³ per mole",
      },
      {
        id: "percent-mass", name: "Percentage of an element in a compound", eq: "P = 100a/M", find: "P",
        letters: { P: "the percentage by mass", a: "the mass of the element in one formula", M: "the molar mass of the compound" },
        example: { a: "12", M: "44" },
      },
      {
        id: "percent-yield", name: "Percentage yield", eq: "Y = 100a/t", find: "Y",
        letters: { Y: "the percentage yield", a: "the mass actually made", t: "the mass that could be made" },
        example: { a: "18", t: "24" },
      },
      {
        id: "ph", name: "pH", eq: "p = -log_10(H)", find: "p",
        letters: { p: "the pH", H: "the hydrogen ion concentration, in mol/dm³" },
        example: { H: "1/1000" },
      },
      {
        id: "ph-conc", name: "Hydrogen ion concentration from pH", eq: "H = 10^(-p)", find: "H",
        letters: { H: "the hydrogen ion concentration, in mol/dm³", p: "the pH" },
        example: { p: "3" },
      },
      {
        id: "faraday", name: "Mass deposited in electrolysis", eq: "m = QM/(zF)", find: "m",
        letters: { m: "the mass deposited", Q: "the charge passed", M: "the molar mass", z: "the charge on the ion", F: "Faraday's constant" },
        example: { Q: "9600", M: "64", z: "2", F: "96000" },
      },
    ],
  },
  {
    group: "Chemistry: gases and energy",
    items: [
      {
        id: "ideal-gas", name: "The ideal gas law", eq: "PV = nRT", find: "P",
        letters: { P: "the pressure", V: "the volume", n: "the number of moles", R: "the gas constant", T: "the temperature, in kelvin" },
        example: { V: "4", n: "2", R: "8", T: "300" },
      },
      {
        id: "enthalpy-mole", name: "Enthalpy change per mole", eq: "H = Q/n", find: "H",
        letters: { H: "the enthalpy change per mole", Q: "the heat energy", n: "the number of moles" },
        example: { Q: "2400", n: "0.5" },
      },
      {
        id: "rate", name: "Rate of a reaction", eq: "r = x/t", find: "r",
        letters: { r: "the rate", x: "the amount made or used up", t: "the time taken" },
        example: { x: "60", t: "20" },
      },
      {
        id: "empirical", name: "Moles of each element for the empirical formula", eq: "n = m/A", find: "n",
        letters: { n: "the moles of the element", m: "its mass in the sample", A: "its relative atomic mass" },
        example: { m: "24", A: "12" },
      },
    ],
  },
  {
    group: "Statistics: averages, spread and relationships",
    items: [
      {
        id: "iqr", name: "Interquartile range", eq: "I = U - L", find: "I",
        letters: { I: "the interquartile range", U: "the upper quartile", L: "the lower quartile" },
        example: { U: "15", L: "7" },
      },
      {
        id: "median-position", name: "Position of the median", eq: "p = (n + 1)/2", find: "p",
        letters: { p: "the position of the median", n: "how many values there are" },
        example: { n: "9" },
        note: "counting from the smallest, once the values are in order",
      },
      {
        id: "quartile-position", name: "Position of the lower quartile", eq: "p = (n + 1)/4", find: "p",
        letters: { p: "the position of the lower quartile", n: "how many values there are" },
        example: { n: "11" },
      },
      {
        id: "weighted-mean", name: "Weighted mean of two values", eq: "m = (xw + yv)/(w + v)", find: "m",
        letters: { m: "the weighted mean", x: "the first value", w: "its weight", y: "the second value", v: "its weight" },
        example: { x: "60", w: "2", y: "90", v: "3" },
      },
      {
        id: "combined-mean", name: "Mean of two groups together", eq: "M = (nm + Nk)/(n + N)", find: "M",
        letters: { M: "the mean of both groups", n: "how many in the first group", m: "the mean of the first group", N: "how many in the second group", k: "the mean of the second group" },
        example: { n: "10", m: "60", N: "30", k: "80" },
      },
      {
        id: "mean-added", name: "The mean after one more value is added", eq: "m = (nM + x)/(n + 1)", find: "m",
        letters: { m: "the new mean", n: "how many values there were", M: "the old mean", x: "the value added" },
        example: { n: "9", M: "50", x: "60" },
      },
      {
        id: "mean-deviation", name: "Mean deviation", eq: "D = S/n", find: "D",
        letters: { D: "the mean deviation", S: "the sum of how far each value is from the mean", n: "how many values there are" },
        example: { S: "24", n: "8" },
      },
      {
        id: "coef-variation", name: "Coefficient of variation", eq: "C = 100s/m", find: "C",
        letters: { C: "the coefficient of variation, as a percentage", s: "the standard deviation", m: "the mean" },
        example: { s: "6", m: "40" },
      },
      {
        id: "pie-angle", name: "Angle of a pie chart sector", eq: "A = 360f/T", find: "A",
        letters: { A: "the angle of the sector, in degrees", f: "the frequency of the item", T: "the total frequency" },
        example: { f: "15", T: "60" },
      },
      {
        id: "rel-freq", name: "Relative frequency", eq: "r = f/n", find: "r",
        letters: { r: "the relative frequency", f: "how many times it happened", n: "how many times it was tried" },
        example: { f: "18", n: "60" },
      },
      {
        id: "regress-slope", name: "Slope of the line of best fit", eq: "b = M/N", find: "b",
        letters: { b: "the slope", M: "the sum of the products of the x and y deviations", N: "the sum of the squares of the x deviations" },
        example: { M: "48", N: "16" },
      },
      {
        id: "regress-intercept", name: "The line of best fit passes through the means", eq: "a = Y - bX", find: "a",
        letters: { a: "the intercept", Y: "the mean of y", b: "the slope", X: "the mean of x" },
        example: { Y: "20", b: "3", X: "4" },
      },
      {
        id: "pearson", name: "Pearson's correlation coefficient", eq: "r = M/sqrt(NQ)", find: "r",
        letters: { r: "the correlation coefficient", M: "the sum of the products of the x and y deviations", N: "the sum of the squares of the x deviations", Q: "the sum of the squares of the y deviations" },
        example: { M: "30", N: "36", Q: "25" },
      },
      {
        id: "spearman", name: "Spearman's rank correlation", eq: "r = 1 - 6D/(n(n^2 - 1))", find: "r",
        letters: { r: "the rank correlation", D: "the sum of the squares of the differences in rank", n: "how many pairs" },
        example: { D: "4", n: "5" },
      },
      {
        id: "margin", name: "Margin of error for a mean", eq: "E = zs/sqrt(n)", find: "E",
        letters: { E: "the margin of error", z: "the z value for the confidence level", s: "the standard deviation", n: "the sample size" },
        example: { z: "2", s: "5", n: "25" },
      },
      {
        id: "sample-size", name: "Sample size for a margin of error", eq: "n = (zs/E)^2", find: "n",
        letters: { n: "the sample size", z: "the z value for the confidence level", s: "the standard deviation", E: "the margin of error wanted" },
        example: { z: "2", s: "5", E: "2" },
      },
    ],
  },
  {
    group: "Probability: more rules",
    items: [
      {
        id: "mutually-exclusive", name: "Either of two events that cannot both happen", eq: "P = a + b", find: "P",
        letters: { P: "the probability of either", a: "the probability of the first", b: "the probability of the second" },
        example: { a: "1/6", b: "1/3" },
      },
      {
        id: "at-least-once", name: "At least once in n tries", eq: "P = 1 - (1 - p)^n", find: "P",
        letters: { P: "the probability of at least one success", p: "the probability each time", n: "the number of tries" },
        example: { p: "1/2", n: "3" },
      },
      {
        id: "no-replacement", name: "Two picks without putting the first back", eq: "P = (a/n)(b/(n - 1))", find: "P",
        letters: { P: "the probability of both", a: "how many of the first kind there are", b: "how many of the second kind are left after the first pick", n: "how many things there are in all" },
        example: { a: "3", b: "2", n: "10" },
      },
      {
        id: "bayes", name: "Bayes' rule", eq: "a = bc/d", find: "a",
        letters: { a: "the probability of A given B", b: "the probability of B given A", c: "the probability of A", d: "the probability of B" },
        example: { b: "4/5", c: "1/4", d: "1/2" },
      },
      {
        id: "binomial-mean", name: "Mean of a binomial distribution", eq: "m = np", find: "m",
        letters: { m: "the mean number of successes", n: "the number of trials", p: "the probability each time" },
        example: { n: "40", p: "1/4" },
      },
      {
        id: "binomial-var", name: "Variance of a binomial distribution", eq: "v = np(1 - p)", find: "v",
        letters: { v: "the variance", n: "the number of trials", p: "the probability each time" },
        example: { n: "40", p: "1/4" },
      },
      {
        id: "geometric-prob", name: "The first success is on try k", eq: "P = (1 - p)^(k - 1)p", find: "P",
        letters: { P: "the probability", p: "the probability of success each time", k: "the try on which the first success comes" },
        example: { p: "1/2", k: "3" },
      },
      {
        id: "geometric-mean-tries", name: "Average number of tries to the first success", eq: "m = 1/p", find: "m",
        letters: { m: "the mean number of tries", p: "the probability of success each time" },
        example: { p: "1/5" },
      },
    ],
  },
  {
    group: "Finance: interest, loans and investing",
    items: [
      {
        id: "annuity-future", name: "Saving the same amount each period: the total", eq: "F = 100P((1 + R/100)^n - 1)/R", find: "F",
        letters: { F: "the total after n periods", P: "the amount saved each period", R: "the rate per period", n: "the number of periods" },
        example: { P: "100", R: "100", n: "3" },
        note: "each payment earns interest from the day it goes in",
      },
      {
        id: "loan-payment", name: "Repaying a loan in equal payments", eq: "M = (PR/100)/(1 - (1 + R/100)^(-n))", find: "M",
        letters: { M: "the payment each period", P: "the amount borrowed", R: "the rate per period", n: "the number of payments" },
        example: { P: "1000", R: "100", n: "1" },
      },
      {
        id: "rule-72", name: "The rule of 72: years to double", eq: "t = 72/R", find: "t",
        letters: { t: "the years to double", R: "the rate per year" },
        example: { R: "8" },
        note: "a quick estimate, best for rates between 5 and 12",
      },
      {
        id: "compound-often", name: "Compound interest added m times a year", eq: "A = P(1 + R/(100m))^(mn)", find: "A",
        letters: { A: "the amount", P: "the money put in", R: "the rate per year", m: "how many times a year interest is added", n: "the number of years" },
        example: { P: "100", R: "100", m: "2", n: "1" },
      },
      {
        id: "effective-rate", name: "Effective annual rate", eq: "E = 100((1 + R/(100m))^m - 1)", find: "E",
        letters: { E: "the effective annual rate", R: "the quoted rate per year", m: "how many times a year interest is added" },
        example: { R: "100", m: "2" },
        note: "what the quoted rate really pays over a year",
      },
      {
        id: "inflation-value", name: "What money is worth after inflation", eq: "V = P/(1 + I/100)^n", find: "V",
        letters: { V: "the value in today's money", P: "the amount in n years", I: "the inflation rate per year", n: "the number of years" },
        example: { P: "1210", I: "10", n: "2" },
      },
      {
        id: "real-rate", name: "Real interest rate", eq: "r = 100((1 + R/100)/(1 + I/100) - 1)", find: "r",
        letters: { r: "the real rate", R: "the interest rate", I: "the inflation rate" },
        example: { R: "21", I: "10" },
      },
      {
        id: "perpetuity", name: "Value of a payment that goes on for ever", eq: "V = 100C/R", find: "V",
        letters: { V: "the value now", C: "the payment each year", R: "the rate per year" },
        example: { C: "50", R: "5" },
      },
      {
        id: "roi", name: "Return on an investment", eq: "R = 100(G - C)/C", find: "R",
        letters: { R: "the return, as a percentage", G: "what the investment is worth now", C: "what it cost" },
        example: { G: "1380", C: "1200" },
      },
      {
        id: "dividend-yield", name: "Dividend yield", eq: "Y = 100D/P", find: "Y",
        letters: { Y: "the yield, as a percentage", D: "the dividend per share each year", P: "the price of a share" },
        example: { D: "8", P: "200" },
      },
      {
        id: "price-earnings", name: "Price-to-earnings ratio", eq: "r = P/s", find: "r",
        letters: { r: "the price-to-earnings ratio", P: "the price of a share", s: "the earnings per share" },
        example: { P: "240", s: "12" },
      },
      {
        id: "current-ratio", name: "Current ratio", eq: "r = A/L", find: "r",
        letters: { r: "the current ratio", A: "the current assets", L: "the current liabilities" },
        example: { A: "900", L: "600" },
      },
      {
        id: "net-pay", name: "Pay after tax", eq: "N = I(100 - T)/100", find: "N",
        letters: { N: "the pay after tax", I: "the pay before tax", T: "the tax rate" },
        example: { I: "50000", T: "20" },
      },
      {
        id: "vat-add", name: "Price with a sales tax added", eq: "G = N(100 + V)/100", find: "G",
        letters: { G: "the price with tax", N: "the price before tax", V: "the tax rate" },
        example: { N: "2000", V: "10" },
      },
      {
        id: "vat-remove", name: "Price before a sales tax", eq: "N = 100G/(100 + V)", find: "N",
        letters: { N: "the price before tax", G: "the price with tax", V: "the tax rate" },
        example: { G: "2200", V: "10" },
      },
      {
        id: "commission", name: "Commission", eq: "C = RS/100", find: "C",
        letters: { C: "the commission", R: "the commission rate", S: "the value of the sales" },
        example: { R: "5", S: "3000" },
      },
      {
        id: "profit-margin", name: "Profit margin on the selling price", eq: "M = 100(S - C)/S", find: "M",
        letters: { M: "the margin, as a percentage", S: "the selling price", C: "the cost price" },
        example: { S: "1500", C: "1200" },
      },
    ],
  },
  {
    group: "Economics: costs, revenue and the economy",
    items: [
      {
        id: "total-cost-fixed", name: "Total cost", eq: "T = F + vn", find: "T",
        letters: { T: "the total cost", F: "the fixed costs", v: "the cost of making one more", n: "how many are made" },
        example: { F: "6000", v: "20", n: "300" },
      },
      {
        id: "average-cost", name: "Average cost", eq: "A = T/n", find: "A",
        letters: { A: "the average cost of one", T: "the total cost", n: "how many are made" },
        example: { T: "12000", n: "300" },
      },
      {
        id: "revenue", name: "Total revenue", eq: "R = pq", find: "R",
        letters: { R: "the total revenue", p: "the price of one", q: "how many are sold" },
        example: { p: "50", q: "300" },
      },
      {
        id: "econ-profit", name: "Profit from a business", eq: "P = n(p - v) - F", find: "P",
        letters: { P: "the profit", n: "how many are sold", p: "the price of one", v: "the cost of making one", F: "the fixed costs" },
        example: { n: "300", p: "50", v: "20", F: "6000" },
      },
      {
        id: "break-even", name: "Break-even quantity", eq: "n = F/(p - v)", find: "n",
        letters: { n: "how many must be sold to break even", F: "the fixed costs", p: "the price of one", v: "the cost of making one" },
        example: { F: "6000", p: "50", v: "20" },
      },
      {
        id: "marginal-cost", name: "Marginal cost", eq: "M = a/b", find: "M",
        letters: { M: "the marginal cost", a: "the change in total cost", b: "the change in the number made" },
        example: { a: "300", b: "10" },
      },
      {
        id: "elasticity", name: "Price elasticity of demand", eq: "E = aP/(bQ)", find: "E",
        letters: { E: "the elasticity of demand", a: "the change in the quantity demanded", P: "the price", b: "the change in the price", Q: "the quantity demanded" },
        example: { a: "20", P: "50", b: "10", Q: "100" },
        note: "how much demand reacts to a change in price",
      },
      {
        id: "gdp-expenditure", name: "Gross domestic product by spending", eq: "Y = C + I + G + X - M", find: "Y",
        letters: { Y: "the GDP", C: "household spending", I: "investment", G: "government spending", X: "exports", M: "imports" },
        example: { C: "600", I: "200", G: "150", X: "80", M: "30" },
      },
      {
        id: "gdp-per-person", name: "GDP per person", eq: "y = Y/n", find: "y",
        letters: { y: "the GDP per person", Y: "the GDP", n: "the number of people" },
        example: { Y: "1000000", n: "2500" },
      },
      {
        id: "real-gdp", name: "Real GDP", eq: "R = 100N/D", find: "R",
        letters: { R: "the real GDP", N: "the GDP at today's prices", D: "the price index (the base year is 100)" },
        example: { N: "1200", D: "120" },
      },
      {
        id: "multiplier", name: "The spending multiplier", eq: "k = 1/(1 - c)", find: "k",
        letters: { k: "the multiplier", c: "the share of extra income that is spent" },
        example: { c: "4/5" },
      },
      {
        id: "unemployment", name: "Unemployment rate", eq: "u = 100U/L", find: "u",
        letters: { u: "the unemployment rate, as a percentage", U: "the number unemployed", L: "the labour force" },
        example: { U: "500", L: "10000" },
      },
      {
        id: "cpi", name: "Consumer price index", eq: "I = 100C/B", find: "I",
        letters: { I: "the price index", C: "the cost of a basket of goods now", B: "the cost of the same basket in the base year" },
        example: { C: "330", B: "300" },
      },
      {
        id: "terms-of-trade", name: "Terms of trade", eq: "T = 100X/M", find: "T",
        letters: { T: "the terms of trade", X: "the export price index", M: "the import price index" },
        example: { X: "120", M: "80" },
      },
      {
        id: "exchange", name: "Changing money into another currency", eq: "A = nr", find: "A",
        letters: { A: "the amount in the other currency", n: "the amount you change", r: "the rate: how much of the other currency for one" },
        example: { n: "250", r: "1500" },
      },
      {
        id: "quantity-theory", name: "The quantity theory of money", eq: "MV = PQ", find: "P",
        letters: { M: "the money supply", V: "how fast money changes hands", P: "the price level", Q: "the quantity of goods and services" },
        example: { M: "500", V: "4", Q: "100" },
      },
    ],
  },
  {
    group: "Computer science: bits, files and algorithms",
    items: [
      {
        id: "bits-values", name: "How many values n bits can hold", eq: "V = 2^n", find: "V",
        letters: { V: "the number of different values", n: "the number of bits" },
        example: { n: "8" },
      },
      {
        id: "bits-max", name: "The biggest whole number n bits can hold", eq: "M = 2^n - 1", find: "M",
        letters: { M: "the biggest number", n: "the number of bits" },
        example: { n: "8" },
        note: "counting from 0",
      },
      {
        id: "bits-needed", name: "Bits needed for some values", eq: "n = log_2(V)", find: "n",
        letters: { n: "the number of bits", V: "the number of different values" },
        example: { V: "256" },
        note: "round up when it is not a whole number",
      },
      {
        id: "twos-min", name: "Smallest two's complement number", eq: "m = -2^(n - 1)", find: "m",
        letters: { m: "the smallest number", n: "the number of bits" },
        example: { n: "8" },
      },
      {
        id: "twos-max", name: "Biggest two's complement number", eq: "M = 2^(n - 1) - 1", find: "M",
        letters: { M: "the biggest number", n: "the number of bits" },
        example: { n: "8" },
      },
      {
        id: "hex-digits", name: "Hexadecimal digits for n bits", eq: "d = n/4", find: "d",
        letters: { d: "the number of hex digits", n: "the number of bits" },
        example: { n: "32" },
        note: "each hex digit stands for 4 bits",
      },
      {
        id: "bytes", name: "Bytes from bits", eq: "B = b/8", find: "B",
        letters: { B: "the number of bytes", b: "the number of bits" },
        example: { b: "64" },
      },
      {
        id: "colours", name: "Colours for a colour depth", eq: "C = 2^d", find: "C",
        letters: { C: "the number of colours", d: "the bits for each pixel" },
        example: { d: "8" },
      },
      {
        id: "pixels", name: "Pixels in an image", eq: "P = wh", find: "P",
        letters: { P: "the number of pixels", w: "the width in pixels", h: "the height in pixels" },
        example: { w: "800", h: "600" },
      },
      {
        id: "image-size", name: "File size of an image, in bytes", eq: "S = whd/8", find: "S",
        letters: { S: "the file size in bytes", w: "the width in pixels", h: "the height in pixels", d: "the bits for each pixel" },
        example: { w: "800", h: "600", d: "24" },
      },
      {
        id: "sound-size", name: "File size of a recording, in bytes", eq: "S = rstc/8", find: "S",
        letters: { S: "the file size in bytes", r: "the samples each second", s: "the bits in each sample", t: "the seconds", c: "the number of channels" },
        example: { r: "8000", s: "16", t: "10", c: "2" },
      },
      {
        id: "sample-rate", name: "Sampling rate needed", eq: "f = 2B", find: "f",
        letters: { f: "the sampling rate", B: "the highest frequency in the sound" },
        example: { B: "20000" },
        note: "at least twice the highest frequency",
      },
      {
        id: "transfer-time", name: "Time to send a file", eq: "t = S/b", find: "t",
        letters: { t: "the time in seconds", S: "the size of the file in bits", b: "the bits sent each second" },
        example: { S: "80000000", b: "2000000" },
      },
      {
        id: "compression", name: "Compression ratio", eq: "r = O/C", find: "r",
        letters: { r: "the compression ratio", O: "the size before", C: "the size after" },
        example: { O: "12000", C: "3000" },
      },
      {
        id: "address-bits", name: "Bits needed to address memory", eq: "n = log_2(M)", find: "n",
        letters: { n: "the bits in an address", M: "the number of memory places" },
        example: { M: "65536" },
      },
      {
        id: "hosts", name: "Hosts on a network", eq: "H = 2^h - 2", find: "H",
        letters: { H: "the number of hosts", h: "the bits left for hosts" },
        example: { h: "8" },
        note: "two addresses are kept for the network and for broadcast",
      },
      {
        id: "binary-search", name: "Steps for a binary search", eq: "n = log_2(N)", find: "n",
        letters: { n: "the most steps", N: "the number of items" },
        example: { N: "1024" },
        note: "round up when it is not a whole number",
      },
      {
        id: "bubble-sort", name: "Comparisons in a bubble sort", eq: "C = n(n - 1)/2", find: "C",
        letters: { C: "the number of comparisons", n: "the number of items" },
        example: { n: "10" },
      },
      {
        id: "tree-nodes", name: "Nodes in a full binary tree", eq: "N = 2^h - 1", find: "N",
        letters: { N: "the number of nodes", h: "the number of levels" },
        example: { h: "4" },
      },
      {
        id: "tree-height", name: "Levels of a full binary tree", eq: "h = log_2(N + 1)", find: "h",
        letters: { h: "the number of levels", N: "the number of nodes" },
        example: { N: "15" },
      },
      {
        id: "load-factor", name: "Load factor of a hash table", eq: "L = n/m", find: "L",
        letters: { L: "the load factor", n: "how many items are stored", m: "how many places there are" },
        example: { n: "30", m: "40" },
      },
    ],
  },
  {
    group: "Number theory",
    items: [
      {
        id: "hcf-lcm", name: "The lowest common multiple from the highest common factor", eq: "L = ab/H", find: "L",
        letters: { L: "the lowest common multiple", a: "the first number", b: "the second number", H: "their highest common factor" },
        example: { a: "12", b: "18", H: "6" },
        note: "HCF × LCM = the product of the two numbers",
      },
      {
        id: "division-algorithm", name: "Dividing with a remainder", eq: "a = bq + r", find: "a",
        letters: { a: "the number divided", b: "the divisor", q: "the quotient", r: "the remainder" },
        example: { b: "5", q: "9", r: "2" },
      },
      {
        id: "totient-prime", name: "Euler's totient of a prime", eq: "t = p - 1", find: "t",
        letters: { t: "how many numbers up to p share no factor with it", p: "the prime" },
        example: { p: "13" },
      },
      {
        id: "totient-two-primes", name: "Euler's totient of two primes multiplied", eq: "t = (p - 1)(q - 1)", find: "t",
        letters: { t: "the totient of pq", p: "the first prime", q: "the second prime" },
        example: { p: "5", q: "11" },
      },
      {
        id: "totient-power", name: "Euler's totient of a prime power", eq: "t = p^(k - 1)(p - 1)", find: "t",
        letters: { t: "the totient of p to the power k", p: "the prime", k: "the power" },
        example: { p: "3", k: "3" },
      },
      {
        id: "divisor-count", name: "Number of factors of p^a × q^b", eq: "D = (a + 1)(b + 1)", find: "D",
        letters: { D: "the number of factors", a: "the power of the first prime", b: "the power of the second prime" },
        example: { a: "3", b: "2" },
      },
      {
        id: "divisor-sum", name: "Sum of the factors of a prime power", eq: "S = (p^(k + 1) - 1)/(p - 1)", find: "S",
        letters: { S: "the sum of the factors", p: "the prime", k: "the power" },
        example: { p: "2", k: "4" },
      },
      {
        id: "mersenne", name: "A Mersenne number", eq: "M = 2^p - 1", find: "M",
        letters: { M: "the Mersenne number", p: "the power of 2" },
        example: { p: "5" },
        note: "prime for some prime values of p",
      },
      {
        id: "perfect", name: "A perfect number from a Mersenne prime", eq: "P = 2^(p - 1)(2^p - 1)", find: "P",
        letters: { P: "the perfect number", p: "a power that makes 2^p − 1 prime" },
        example: { p: "3" },
      },
      {
        id: "fermat", name: "A Fermat number", eq: "F = 2^(2^n) + 1", find: "F",
        letters: { F: "the Fermat number", n: "which one" },
        example: { n: "2" },
      },
      {
        id: "triple-a", name: "Pythagorean triples: the first leg", eq: "a = m^2 - k^2", find: "a",
        letters: { a: "the first leg", m: "the bigger number", k: "the smaller number" },
        example: { m: "5", k: "2" },
      },
      {
        id: "triple-b", name: "Pythagorean triples: the second leg", eq: "b = 2mk", find: "b",
        letters: { b: "the second leg", m: "the bigger number", k: "the smaller number" },
        example: { m: "5", k: "2" },
      },
      {
        id: "triple-c", name: "Pythagorean triples: the hypotenuse", eq: "c = m^2 + k^2", find: "c",
        letters: { c: "the hypotenuse", m: "the bigger number", k: "the smaller number" },
        example: { m: "5", k: "2" },
      },
      {
        id: "sum-odds", name: "Sum of the first n odd numbers", eq: "S = n^2", find: "S",
        letters: { S: "the sum", n: "how many odd numbers" },
        example: { n: "9" },
        note: "1 + 3 + 5 + … is always a square",
      },
      {
        id: "sum-evens", name: "Sum of the first n even numbers", eq: "S = n(n + 1)", find: "S",
        letters: { S: "the sum", n: "how many even numbers" },
        example: { n: "9" },
      },
      {
        id: "pentagonal", name: "Pentagonal numbers", eq: "P = n(3n - 1)/2", find: "P",
        letters: { P: "the nth pentagonal number", n: "which one" },
        example: { n: "6" },
      },
      {
        id: "hexagonal", name: "Hexagonal numbers", eq: "H = n(2n - 1)", find: "H",
        letters: { H: "the nth hexagonal number", n: "which one" },
        example: { n: "6" },
      },
      {
        id: "catalan", name: "Catalan numbers", eq: "C = nCr(2n, n)/(n + 1)", find: "C",
        letters: { C: "the nth Catalan number", n: "which one" },
        example: { n: "3" },
      },
      {
        id: "stars-bars", name: "Ways to share identical things", eq: "W = nCr(n + k - 1, k - 1)", find: "W",
        letters: { W: "the number of ways", n: "how many identical things", k: "how many people share them" },
        example: { n: "5", k: "3" },
        note: "stars and bars",
      },
    ],
  },
  {
    group: "Engineering: forces, machines and structures",
    items: [
      {
        id: "stress", name: "Stress on a material", eq: "S = F/A", find: "S",
        letters: { S: "the stress", F: "the force", A: "the cross-section area" },
        example: { F: "5000", A: "25" },
      },
      {
        id: "strain", name: "Strain on a material", eq: "s = x/L", find: "s",
        letters: { s: "the strain", x: "the stretch", L: "the original length" },
        example: { x: "2", L: "400" },
      },
      {
        id: "young", name: "Young's modulus", eq: "Y = FL/(Ax)", find: "Y",
        letters: { Y: "Young's modulus", F: "the force", L: "the original length", A: "the cross-section area", x: "the stretch" },
        example: { F: "200", L: "3", A: "2", x: "0.5" },
        note: "stress divided by strain",
      },
      {
        id: "safety-factor", name: "Factor of safety", eq: "F = S/W", find: "F",
        letters: { F: "the factor of safety", S: "the load that would break it", W: "the load it carries" },
        example: { S: "900", W: "300" },
      },
      {
        id: "torque", name: "Torque", eq: "T = Fr", find: "T",
        letters: { T: "the torque", F: "the force", r: "the distance from the axis" },
        example: { F: "40", r: "0.5" },
      },
      {
        id: "rotational-power", name: "Power of a turning shaft", eq: "P = Tw", find: "P",
        letters: { P: "the power", T: "the torque", w: "the angular speed" },
        example: { T: "20", w: "150" },
      },
      {
        id: "angular-speed", name: "Angular speed from the frequency", eq: "w = 2πf", find: "w",
        letters: { w: "the angular speed, in radians per second", f: "the turns each second" },
        example: { f: "7" },
      },
      {
        id: "gear-ratio", name: "Gear ratio", eq: "G = N/n", find: "G",
        letters: { G: "the gear ratio", N: "the teeth on the driven gear", n: "the teeth on the driving gear" },
        example: { N: "60", n: "15" },
      },
      {
        id: "rotational-ke", name: "Energy of a spinning object", eq: "E = (1/2)Iw^2", find: "E",
        letters: { E: "the energy", I: "the moment of inertia", w: "the angular speed" },
        example: { I: "4", w: "5" },
      },
      {
        id: "incline-ma", name: "Mechanical advantage of a ramp", eq: "M = L/h", find: "M",
        letters: { M: "the mechanical advantage", L: "the length of the ramp", h: "the height it rises" },
        example: { L: "6", h: "1.5" },
      },
      {
        id: "hydraulic", name: "A hydraulic press", eq: "F/A = f/a", find: "F",
        letters: { F: "the force on the big piston", A: "the area of the big piston", f: "the force on the small piston", a: "the area of the small piston" },
        example: { A: "50", f: "20", a: "2" },
        note: "pressure is the same everywhere in the fluid",
      },
      {
        id: "flow-rate", name: "Flow rate in a pipe", eq: "Q = Av", find: "Q",
        letters: { Q: "the volume flowing each second", A: "the cross-section area of the pipe", v: "the speed of the fluid" },
        example: { A: "0.02", v: "3" },
      },
      {
        id: "beam-moment", name: "Bending moment: a load in the middle of a beam", eq: "M = FL/4", find: "M",
        letters: { M: "the greatest bending moment", F: "the load", L: "the length between the supports" },
        example: { F: "800", L: "5" },
      },
      {
        id: "beam-inertia", name: "Second moment of area of a rectangle", eq: "I = bh^3/12", find: "I",
        letters: { I: "the second moment of area", b: "the width", h: "the depth" },
        example: { b: "6", h: "10" },
      },
      {
        id: "heat-conduction", name: "Heat conducted through a wall", eq: "H = kAT/d", find: "H",
        letters: { H: "the heat flowing each second", k: "the conductivity of the material", A: "the area", T: "the temperature difference", d: "the thickness" },
        example: { k: "0.5", A: "20", T: "15", d: "0.25" },
      },
      {
        id: "carnot", name: "Best efficiency of a heat engine", eq: "E = 100(1 - c/h)", find: "E",
        letters: { E: "the greatest efficiency, as a percentage", c: "the cold temperature, in kelvin", h: "the hot temperature, in kelvin" },
        example: { c: "300", h: "600" },
      },
      {
        id: "power-loss", name: "Power lost as heat in a wire", eq: "P = I^2R", find: "P",
        letters: { P: "the power lost", I: "the current", R: "the resistance" },
        example: { I: "5", R: "4" },
      },
      {
        id: "capacitance", name: "Capacitance", eq: "C = Q/V", find: "C",
        letters: { C: "the capacitance", Q: "the charge stored", V: "the voltage" },
        example: { Q: "0.06", V: "12" },
      },
      {
        id: "capacitor-energy", name: "Energy stored in a capacitor", eq: "E = (1/2)CV^2", find: "E",
        letters: { E: "the energy", C: "the capacitance", V: "the voltage" },
        example: { C: "0.002", V: "10" },
      },
      {
        id: "range-projectile", name: "Range of a projectile", eq: "R = u^2·sin(2a°)/g", find: "R",
        letters: { R: "the range", u: "the launch speed", a: "the launch angle, in degrees", g: "the pull of gravity per kilogram" },
        example: { u: "20", a: "45", g: "10" },
      },
      {
        id: "height-projectile", name: "Greatest height of a projectile", eq: "H = u^2·sin(a°)^2/(2g)", find: "H",
        letters: { H: "the greatest height", u: "the launch speed", a: "the launch angle, in degrees", g: "the pull of gravity per kilogram" },
        example: { u: "20", a: "30", g: "10" },
      },
      {
        id: "flight-time", name: "Time of flight of a projectile", eq: "T = 2u·sin(a°)/g", find: "T",
        letters: { T: "the time in the air", u: "the launch speed", a: "the launch angle, in degrees", g: "the pull of gravity per kilogram" },
        example: { u: "20", a: "30", g: "10" },
      },
    ],
  },
  {
    group: "Earth science: rocks, weather, rivers and the planet",
    items: [
      {
        id: "quake-ratio", name: "How much bigger one earthquake is than another", eq: "R = 10^(M - m)", find: "R",
        letters: { R: "how many times bigger the shaking is", M: "the bigger magnitude", m: "the smaller magnitude" },
        example: { M: "7", m: "5" },
        note: "each step of 1 on the scale is ten times the shaking",
      },
      {
        id: "quake-distance", name: "Distance to an earthquake", eq: "d = tvu/(v - u)", find: "d",
        letters: { d: "the distance to the earthquake", t: "the gap between the first P wave and the first S wave", v: "the speed of the P wave", u: "the speed of the S wave" },
        example: { t: "10", v: "8", u: "4" },
      },
      {
        id: "rock-age", name: "Age of a rock from its half-life", eq: "t = h·log_2(A/N)", find: "t",
        letters: { t: "the age", h: "the half-life", A: "the amount of the isotope at the start", N: "the amount left now" },
        example: { h: "5", A: "80", N: "10" },
      },
      {
        id: "porosity", name: "Porosity of a rock", eq: "P = 100V/T", find: "P",
        letters: { P: "the porosity, as a percentage", V: "the volume of the gaps", T: "the total volume of the rock" },
        example: { V: "30", T: "150" },
      },
      {
        id: "specific-gravity", name: "Specific gravity of a mineral", eq: "S = a/(a - w)", find: "S",
        letters: { S: "the specific gravity", a: "the weight in air", w: "the weight in water" },
        example: { a: "30", w: "20" },
      },
      {
        id: "darcy", name: "Water flowing through rock or soil", eq: "Q = kAh/L", find: "Q",
        letters: { Q: "the flow each second", k: "how easily water passes", A: "the cross-section area", h: "the drop in water level", L: "the length of the flow" },
        example: { k: "0.2", A: "10", h: "6", L: "4" },
      },
      {
        id: "lapse-rate", name: "Temperature at a height", eq: "T = t - 0.0065h", find: "T",
        letters: { T: "the temperature at height h", t: "the temperature at sea level", h: "the height in metres" },
        example: { t: "30", h: "1000" },
        note: "air cools about 6.5 °C for each 1000 m",
      },
      {
        id: "cloud-base", name: "Height of the base of a cloud", eq: "H = 125(T - d)", find: "H",
        letters: { H: "the cloud base in metres", T: "the air temperature", d: "the dew point" },
        example: { T: "30", d: "20" },
      },
      {
        id: "humidity", name: "Relative humidity", eq: "H = 100a/s", find: "H",
        letters: { H: "the relative humidity, as a percentage", a: "the water vapour in the air", s: "the most the air could hold" },
        example: { a: "12", s: "30" },
      },
      {
        id: "river-discharge", name: "Discharge of a river", eq: "Q = wdv", find: "Q",
        letters: { Q: "the volume flowing each second", w: "the width", d: "the average depth", v: "the speed of the water" },
        example: { w: "12", d: "2", v: "1.5" },
      },
      {
        id: "river-gradient", name: "Gradient of a river or slope", eq: "G = h/d", find: "G",
        letters: { G: "the gradient", h: "the drop in height", d: "the distance along" },
        example: { h: "50", d: "2000" },
      },
      {
        id: "percent-grade", name: "Percentage grade of a slope", eq: "G = 100h/d", find: "G",
        letters: { G: "the grade, as a percentage", h: "the rise", d: "the distance along the ground" },
        example: { h: "12", d: "150" },
      },
      {
        id: "drainage-density", name: "Drainage density", eq: "D = L/A", find: "D",
        letters: { D: "the drainage density", L: "the total length of the streams", A: "the area of the basin" },
        example: { L: "90", A: "30" },
      },
      {
        id: "sinuosity", name: "Sinuosity of a river", eq: "S = c/s", find: "S",
        letters: { S: "the sinuosity", c: "the length along the channel", s: "the straight-line distance" },
        example: { c: "15", s: "10" },
      },
      {
        id: "population-density", name: "Population density", eq: "D = n/A", find: "D",
        letters: { D: "the people for each square kilometre", n: "the number of people", A: "the area" },
        example: { n: "900000", A: "300" },
      },
      {
        id: "natural-increase", name: "Natural increase of a population", eq: "r = (b - d)/10", find: "r",
        letters: { r: "the natural increase, as a percentage", b: "births for each 1000 people", d: "deaths for each 1000 people" },
        example: { b: "35", d: "15" },
      },
      {
        id: "rule-70", name: "The rule of 70: years for a population to double", eq: "t = 70/r", find: "t",
        letters: { t: "the years to double", r: "the growth rate, as a percentage" },
        example: { r: "2" },
      },
      {
        id: "time-longitude", name: "Time difference from longitude", eq: "t = L/15", find: "t",
        letters: { t: "the time difference in hours", L: "the difference in longitude, in degrees" },
        example: { L: "45" },
        note: "the sun crosses 15 degrees of longitude each hour",
      },
      {
        id: "surface-gravity", name: "Gravity at the surface of a planet", eq: "g = GM/r^2", find: "g",
        letters: { g: "the pull of gravity per kilogram", G: "the gravitational constant", M: "the mass of the planet", r: "the radius of the planet" },
        example: { G: "6", M: "8", r: "2" },
      },
      {
        id: "escape-speed", name: "Escape speed from a planet", eq: "v = sqrt(2GM/r)", find: "v",
        letters: { v: "the escape speed", G: "the gravitational constant", M: "the mass of the planet", r: "the radius of the planet" },
        example: { G: "6", M: "8", r: "3" },
      },
      {
        id: "orbit-speed", name: "Speed of a satellite in a circular orbit", eq: "v = sqrt(GM/r)", find: "v",
        letters: { v: "the orbital speed", G: "the gravitational constant", M: "the mass of the planet", r: "the distance from the centre" },
        example: { G: "6", M: "8", r: "3" },
      },
      {
        id: "kepler", name: "Kepler's third law", eq: "T^2 = a^3", find: "T",
        letters: { T: "the orbit time, in years", a: "the distance from the sun, in astronomical units" },
        example: { a: "4" },
        note: "for anything that orbits the sun",
      },
    ],
  },
  {
    group: "Logic: truth tables, sets and counting",
    items: [
      {
        id: "truth-rows", name: "Rows in a truth table", eq: "R = 2^n", find: "R",
        letters: { R: "the number of rows", n: "the number of statements" },
        example: { n: "4" },
        note: "each statement is true or false",
      },
      {
        id: "boolean-functions", name: "Different logic functions of n inputs", eq: "F = 2^(2^n)", find: "F",
        letters: { F: "the number of different functions", n: "the number of inputs" },
        example: { n: "3" },
      },
      {
        id: "union-two", name: "Inclusion and exclusion for two sets", eq: "U = a + b - c", find: "U",
        letters: { U: "the number in A or B (or both)", a: "the number in A", b: "the number in B", c: "the number in both" },
        example: { a: "30", b: "25", c: "12" },
        note: "the ones in both were counted twice",
      },
      {
        id: "union-three", name: "Inclusion and exclusion for three sets", eq: "U = a + b + c - p - q - r + t", find: "U",
        letters: { U: "the number in A or B or C", a: "the number in A", b: "the number in B", c: "the number in C", p: "the number in A and B", q: "the number in A and C", r: "the number in B and C", t: "the number in all three" },
        example: { a: "30", b: "25", c: "20", p: "10", q: "8", r: "6", t: "3" },
      },
      {
        id: "only-in-a", name: "Only in the first set", eq: "o = a - c", find: "o",
        letters: { o: "the number in A but not B", a: "the number in A", c: "the number in both" },
        example: { a: "30", c: "12" },
      },
      {
        id: "neither-set", name: "In neither set", eq: "N = T - a - b + c", find: "N",
        letters: { N: "the number in neither set", T: "the number in all", a: "the number in A", b: "the number in B", c: "the number in both" },
        example: { T: "60", a: "30", b: "25", c: "12" },
      },
      {
        id: "subsets", name: "Subsets of a set", eq: "S = 2^n", find: "S",
        letters: { S: "the number of subsets", n: "the number of elements" },
        example: { n: "5" },
        note: "each element is in or out",
      },
      {
        id: "proper-subsets", name: "Proper subsets of a set", eq: "S = 2^n - 1", find: "S",
        letters: { S: "the number of proper subsets", n: "the number of elements" },
        example: { n: "5" },
        note: "every subset except the set itself",
      },
      {
        id: "cartesian", name: "Size of a Cartesian product", eq: "P = ab", find: "P",
        letters: { P: "the number of ordered pairs", a: "the elements in A", b: "the elements in B" },
        example: { a: "4", b: "7" },
      },
      {
        id: "relations", name: "Relations on a set", eq: "R = 2^(n^2)", find: "R",
        letters: { R: "the number of relations", n: "the number of elements" },
        example: { n: "3" },
      },
      {
        id: "functions-count", name: "Functions from one set to another", eq: "F = n^m", find: "F",
        letters: { F: "the number of functions", m: "the elements in the first set", n: "the elements in the second set" },
        example: { m: "3", n: "4" },
      },
      {
        id: "one-to-one-count", name: "One-to-one functions from one set to another", eq: "F = nPr(n, m)", find: "F",
        letters: { F: "the number of one-to-one functions", m: "the elements in the first set", n: "the elements in the second set" },
        example: { m: "3", n: "5" },
      },
      {
        id: "pigeonhole", name: "Pigeonhole principle", eq: "n = km + 1", find: "n",
        letters: { n: "the items that guarantee it", k: "the boxes", m: "the most that can be kept out of one box" },
        example: { k: "7", m: "2" },
        note: "with this many, some box must hold m + 1",
      },
      {
        id: "handshakes", name: "Handshakes in a group", eq: "H = n(n - 1)/2", find: "H",
        letters: { H: "the number of handshakes", n: "the number of people" },
        example: { n: "12" },
      },
      {
        id: "odds-from-prob", name: "Odds from a probability", eq: "o = p/(1 - p)", find: "o",
        letters: { o: "the odds in favour", p: "the probability" },
        example: { p: "3/4" },
      },
      {
        id: "prob-from-odds", name: "A probability from the odds", eq: "p = o/(1 + o)", find: "p",
        letters: { p: "the probability", o: "the odds in favour" },
        example: { o: "3" },
      },
    ],
  },
  {
    group: "Law: damages, shares and evidence",
    items: [
      {
        id: "contributory", name: "Damages when the claimant is partly to blame", eq: "D = L(100 - p)/100", find: "D",
        letters: { D: "the damages awarded", L: "the full loss", p: "the claimant's share of the blame, as a percentage" },
        example: { L: "800000", p: "25" },
      },
      {
        id: "liability-share", name: "A share of a liability", eq: "S = La/T", find: "S",
        letters: { S: "the share to pay", L: "the whole liability", a: "this party's part", T: "the total of all the parts" },
        example: { L: "900000", a: "2", T: "9" },
      },
      {
        id: "estate-share", name: "A share of an estate", eq: "S = Ea/b", find: "S",
        letters: { S: "the share", E: "the value of the estate", a: "the top of the fraction", b: "the bottom of the fraction" },
        example: { E: "2400000", a: "1", b: "3" },
      },
      {
        id: "judgment-debt", name: "A judgment debt with simple interest", eq: "T = J(100 + RY)/100", find: "T",
        letters: { T: "the total owed", J: "the sum awarded", R: "the rate per year", Y: "the years until it is paid" },
        example: { J: "500000", R: "10", Y: "2" },
      },
      {
        id: "loss-multiplier", name: "Loss of earnings by the multiplier method", eq: "D = ym", find: "D",
        letters: { D: "the damages", y: "the loss each year", m: "the multiplier" },
        example: { y: "600000", m: "12" },
      },
      {
        id: "time-served", name: "Time served with remission", eq: "T = S(100 - r)/100", find: "T",
        letters: { T: "the time actually served", S: "the sentence", r: "the remission, as a percentage" },
        example: { S: "60", r: "25" },
      },
      {
        id: "daily-fine", name: "A fine charged by the day", eq: "F = dn", find: "F",
        letters: { F: "the total fine", d: "the fine for one day", n: "the number of days" },
        example: { d: "5000", n: "14" },
      },
      {
        id: "likelihood-ratio", name: "Likelihood ratio of a piece of evidence", eq: "L = a/b", find: "L",
        letters: { L: "the likelihood ratio", a: "the chance of the evidence if the claim is true", b: "the chance of the evidence if it is false" },
        example: { a: "9/10", b: "1/30" },
      },
      {
        id: "posterior-odds", name: "Updating the odds with new evidence", eq: "P = oL", find: "P",
        letters: { P: "the new odds", o: "the odds before the evidence", L: "the likelihood ratio" },
        example: { o: "1/5", L: "15" },
        note: "Bayes' rule in odds form",
      },
      {
        id: "random-match", name: "Chance that a random person matches all the markers", eq: "M = p^n", find: "M",
        letters: { M: "the chance of matching all of them", p: "the chance of matching one marker", n: "the number of independent markers" },
        example: { p: "1/10", n: "4" },
      },
      {
        id: "expected-matches", name: "People expected to match by chance", eq: "E = Np", find: "E",
        letters: { E: "how many to expect", N: "the people who could have left it", p: "the chance that one person matches" },
        example: { N: "2000000", p: "1/1000000" },
        note: "a rare match is not the same as a unique match",
      },
      {
        id: "another-match", name: "Chance that at least one other person matches", eq: "P = 1 - (1 - p)^N", find: "P",
        letters: { P: "the chance that someone else matches", p: "the chance that one person matches", N: "the other people who could have left it" },
        example: { p: "1/10", N: "2" },
      },
    ],
  },
  {
    group: "Language: reading, words and speech",
    items: [
      {
        id: "flesch-ease", name: "Flesch reading ease", eq: "R = 206.835 - 1.015(W/S) - 84.6(Y/W)", find: "R",
        letters: { R: "the reading ease score (higher is easier)", W: "the number of words", S: "the number of sentences", Y: "the number of syllables" },
        example: { W: "100", S: "5", Y: "150" },
      },
      {
        id: "flesch-kincaid", name: "Flesch-Kincaid grade level", eq: "G = 0.39(W/S) + 11.8(Y/W) - 15.59", find: "G",
        letters: { G: "the school grade needed to read it", W: "the number of words", S: "the number of sentences", Y: "the number of syllables" },
        example: { W: "100", S: "5", Y: "150" },
      },
      {
        id: "gunning-fog", name: "Gunning fog index", eq: "F = 0.4((W/S) + 100(C/W))", find: "F",
        letters: { F: "the school grade needed to read it", W: "the number of words", S: "the number of sentences", C: "the number of long words (three syllables or more)" },
        example: { W: "100", S: "5", C: "10" },
      },
      {
        id: "ari", name: "Automated readability index", eq: "A = 4.71(C/W) + 0.5(W/S) - 21.43", find: "A",
        letters: { A: "the school grade needed to read it", C: "the number of letters", W: "the number of words", S: "the number of sentences" },
        example: { C: "450", W: "100", S: "5" },
      },
      {
        id: "words-per-sentence", name: "Average sentence length", eq: "m = W/S", find: "m",
        letters: { m: "the words in an average sentence", W: "the number of words", S: "the number of sentences" },
        example: { W: "240", S: "15" },
      },
      {
        id: "mean-word-length", name: "Average word length", eq: "m = L/W", find: "m",
        letters: { m: "the letters in an average word", L: "the number of letters", W: "the number of words" },
        example: { L: "450", W: "100" },
      },
      {
        id: "type-token", name: "Type-token ratio", eq: "R = T/N", find: "R",
        letters: { R: "the type-token ratio", T: "the number of different words", N: "the number of words in all" },
        example: { T: "60", N: "150" },
        note: "how varied the vocabulary is",
      },
      {
        id: "lexical-density", name: "Lexical density", eq: "D = 100c/N", find: "D",
        letters: { D: "the lexical density, as a percentage", c: "the number of content words", N: "the number of words in all" },
        example: { c: "45", N: "100" },
        note: "nouns, verbs, adjectives and adverbs",
      },
      {
        id: "reading-time", name: "Time to read a text", eq: "t = W/r", find: "t",
        letters: { t: "the time in minutes", W: "the number of words", r: "the words read each minute" },
        example: { W: "1500", r: "250" },
      },
      {
        id: "words-from-pages", name: "Words in a document", eq: "W = pw", find: "W",
        letters: { W: "the number of words", p: "the number of pages", w: "the words on a page" },
        example: { p: "12", w: "300" },
      },
      {
        id: "speech-rate", name: "Speech rate", eq: "r = S/t", find: "r",
        letters: { r: "the syllables each second", S: "the number of syllables", t: "the time in seconds" },
        example: { S: "90", t: "20" },
      },
      {
        id: "words-per-minute", name: "Words a minute", eq: "w = 60W/t", find: "w",
        letters: { w: "the words each minute", W: "the number of words", t: "the time in seconds" },
        example: { W: "150", t: "50" },
      },
      {
        id: "mlu", name: "Mean length of utterance", eq: "M = m/u", find: "M",
        letters: { M: "the mean length of utterance", m: "the number of morphemes", u: "the number of utterances" },
        example: { m: "180", u: "60" },
        note: "a measure of a child's language growth",
      },
      {
        id: "pitch-interval", name: "Musical interval between two pitches", eq: "s = 12log_2(f/g)", find: "s",
        letters: { s: "the interval in semitones", f: "the higher frequency", g: "the lower frequency" },
        example: { f: "440", g: "220" },
      },
      {
        id: "zipf", name: "Zipf's law", eq: "f = k/r", find: "f",
        letters: { f: "how often the word appears", k: "a constant for the text", r: "the word's rank, most common first" },
        example: { k: "6000", r: "12" },
      },
      {
        id: "heaps", name: "Heaps' law", eq: "V = Kn^b", find: "V",
        letters: { V: "the number of different words", K: "a constant for the text", n: "the number of words read", b: "the growth power, between 0 and 1" },
        example: { K: "4", n: "10000", b: "1/2" },
      },
      {
        id: "string-count", name: "Possible strings from an alphabet", eq: "W = k^n", find: "W",
        letters: { W: "the number of strings", k: "the letters in the alphabet", n: "the length of the string" },
        example: { k: "26", n: "3" },
      },
      {
        id: "glottochronology", name: "Time since two languages split", eq: "t = log_2(c)/(2log_2(r))", find: "t",
        letters: { t: "the time since the split, in thousand-year units", c: "the share of the word list that is still shared", r: "the share kept by one language in one unit of time" },
        example: { c: "1/4", r: "1/2" },
        note: "the more shared words, the more recent the split",
      },
    ],
  },
  {
    group: "Linguistics: information and language technology",
    items: [
      {
        id: "information", name: "Information in an event", eq: "I = -log_2(p)", find: "I",
        letters: { I: "the information, in bits", p: "the probability of the event" },
        example: { p: "1/8" },
        note: "rarer events tell you more",
      },
      {
        id: "perplexity", name: "Perplexity of a language model", eq: "P = 2^H", find: "P",
        letters: { P: "the perplexity", H: "the entropy, in bits for each word" },
        example: { H: "5" },
        note: "how many equally likely words the model is torn between",
      },
      {
        id: "bigram", name: "Bigram probability", eq: "P = c/n", find: "P",
        letters: { P: "the chance the second word follows the first", c: "how often the pair appears", n: "how often the first word appears" },
        example: { c: "12", n: "60" },
      },
      {
        id: "add-one", name: "Add-one smoothing", eq: "P = (c + 1)/(n + V)", find: "P",
        letters: { P: "the smoothed probability", c: "how often the pair appears", n: "how often the first word appears", V: "the size of the vocabulary" },
        example: { c: "3", n: "20", V: "80" },
      },
      {
        id: "tf-idf", name: "TF-IDF weight of a word", eq: "w = tlog_10(N/n)", find: "w",
        letters: { w: "the weight of the word in a document", t: "how often it appears in the document", N: "the number of documents", n: "the number of documents that contain it" },
        example: { t: "3", N: "1000", n: "10" },
      },
      {
        id: "precision", name: "Precision", eq: "P = a/(a + b)", find: "P",
        letters: { P: "the precision", a: "the right answers it gave", b: "the wrong answers it gave" },
        example: { a: "40", b: "10" },
      },
      {
        id: "recall", name: "Recall", eq: "R = a/(a + m)", find: "R",
        letters: { R: "the recall", a: "the right answers it gave", m: "the right answers it missed" },
        example: { a: "40", m: "20" },
      },
      {
        id: "f-score", name: "F-score", eq: "F = 2PR/(P + R)", find: "F",
        letters: { F: "the F-score", P: "the precision", R: "the recall" },
        example: { P: "4/5", R: "2/3" },
      },
      {
        id: "accuracy", name: "Accuracy of a classifier", eq: "A = 100c/N", find: "A",
        letters: { A: "the accuracy, as a percentage", c: "the number it got right", N: "the number it was tested on" },
        example: { c: "180", N: "200" },
      },
      {
        id: "wer", name: "Word error rate", eq: "W = 100(S + D + I)/N", find: "W",
        letters: { W: "the word error rate, as a percentage", S: "the words wrongly swapped", D: "the words left out", I: "the words wrongly added", N: "the words in the correct text" },
        example: { S: "6", D: "3", I: "1", N: "200" },
      },
      {
        id: "cosine", name: "Cosine similarity of two texts", eq: "c = D/(AB)", find: "c",
        letters: { c: "the cosine similarity", D: "the dot product of the two word-count lists", A: "the length of the first list", B: "the length of the second list" },
        example: { D: "24", A: "5", B: "8" },
      },
      {
        id: "kappa", name: "Agreement between two annotators (kappa)", eq: "K = (a - b)/(1 - b)", find: "K",
        letters: { K: "kappa", a: "the share of items they agreed on", b: "the share they would agree on by chance" },
        example: { a: "9/10", b: "1/2" },
      },
    ],
  },
  {
    group: "Art and design: proportion, colour and pattern",
    items: [
      {
        id: "golden-ratio", name: "The golden ratio", eq: "g = (1 + sqrt(5))/2", find: "g",
        letters: { g: "the golden ratio" },
        example: {  },
        note: "about 1.618: the long side of a golden rectangle over its short side",
      },
      {
        id: "golden-rectangle", name: "Long side of a golden rectangle", eq: "L = Ws", find: "L",
        letters: { L: "the long side", W: "the short side", s: "the golden ratio, about 1.618" },
        example: { W: "10", s: "8/5" },
        note: "put the golden ratio in as a number",
      },
      {
        id: "rule-of-thirds", name: "Rule of thirds line", eq: "p = L/3", find: "p",
        letters: { p: "the distance of the line from the edge", L: "the width or height of the picture" },
        example: { L: "90" },
      },
      {
        id: "aspect-ratio", name: "Aspect ratio", eq: "A = w/h", find: "A",
        letters: { A: "the aspect ratio", w: "the width", h: "the height" },
        example: { w: "1920", h: "1080" },
      },
      {
        id: "scale-picture", name: "Resizing a picture without squashing it", eq: "H = hW/w", find: "H",
        letters: { H: "the new height", h: "the old height", W: "the new width", w: "the old width" },
        example: { h: "600", W: "800", w: "1200" },
      },
      {
        id: "print-pixels", name: "Pixels needed for a print", eq: "P = dI", find: "P",
        letters: { P: "the pixels across", d: "the dots for each inch", I: "the inches across" },
        example: { d: "300", I: "8" },
      },
      {
        id: "print-size", name: "Biggest print from an image", eq: "I = P/d", find: "I",
        letters: { I: "the inches across", P: "the pixels across", d: "the dots for each inch" },
        example: { P: "2400", d: "300" },
      },
      {
        id: "paper-area", name: "Area of an A-series sheet", eq: "A = 1/2^n", find: "A",
        letters: { A: "the area in square metres", n: "the paper size, as in A4" },
        example: { n: "4" },
        note: "A0 is one square metre and each size is half the one before",
      },
      {
        id: "mat-border", name: "Border of a picture mount", eq: "b = (F - p)/2", find: "b",
        letters: { b: "the border on each side", F: "the width of the frame opening", p: "the width of the picture" },
        example: { F: "50", p: "36" },
      },
      {
        id: "framed-width", name: "Width of a framed picture", eq: "W = w + 2f", find: "W",
        letters: { W: "the width with the frame", w: "the width of the picture", f: "the width of the frame" },
        example: { w: "40", f: "3" },
      },
      {
        id: "paint-needed", name: "Paint needed for a wall", eq: "L = A/c", find: "L",
        letters: { L: "the litres of paint", A: "the area to cover", c: "the area one litre covers" },
        example: { A: "45", c: "9" },
      },
      {
        id: "tile-count", name: "Tiles needed with some spare", eq: "N = A(100 + w)/(100a)", find: "N",
        letters: { N: "the number of tiles", A: "the area to cover", w: "the percentage to allow for breakage", a: "the area of one tile" },
        example: { A: "12", w: "10", a: "0.04" },
      },
      {
        id: "kiln-shrink", name: "Shrinkage of clay in the kiln", eq: "S = 100(a - b)/a", find: "S",
        letters: { S: "the shrinkage, as a percentage", a: "the length before firing", b: "the length after firing" },
        example: { a: "20", b: "17" },
      },
      {
        id: "model-scale", name: "Real size from a model", eq: "R = mN", find: "R",
        letters: { R: "the real size", m: "the size of the model", N: "the scale, 1 : N" },
        example: { m: "15", N: "20" },
      },
      {
        id: "tessellation", name: "Regular polygons that meet at a point", eq: "k = 2n/(n - 2)", find: "k",
        letters: { k: "how many meet at a point", n: "the number of sides of each polygon" },
        example: { n: "6" },
        note: "a whole number means the polygon tiles on its own",
      },
      {
        id: "koch", name: "Perimeter of a Koch snowflake", eq: "P = 3s(4/3)^n", find: "P",
        letters: { P: "the perimeter", s: "the side of the first triangle", n: "the number of times the pattern is repeated" },
        example: { s: "9", n: "2" },
      },
      {
        id: "sierpinski", name: "Triangles in a Sierpinski pattern", eq: "T = 3^n", find: "T",
        letters: { T: "the number of small triangles", n: "the number of times the pattern is repeated" },
        example: { n: "4" },
      },
      {
        id: "rgb-colours", name: "Colours from red, green and blue", eq: "C = 256^3", find: "C",
        letters: { C: "the number of colours" },
        example: {  },
        note: "256 levels for each of three lights",
      },
      {
        id: "luminance", name: "Brightness of a colour", eq: "L = 0.2126R + 0.7152G + 0.0722B", find: "L",
        letters: { L: "the brightness", R: "the red", G: "the green", B: "the blue" },
        example: { R: "100", G: "200", B: "50" },
      },
      {
        id: "contrast-ratio", name: "Contrast between two colours", eq: "C = (a + 0.05)/(b + 0.05)", find: "C",
        letters: { C: "the contrast ratio", a: "the brightness of the lighter colour, from 0 to 1", b: "the brightness of the darker colour, from 0 to 1" },
        example: { a: "0.95", b: "0.05" },
        note: "at least 4.5 is easy to read",
      },
    ],
  },
  {
    group: "Music: pitch, rhythm and sound",
    items: [
      {
        id: "note-frequency", name: "Frequency of a note", eq: "f = 440·2^(n/12)", find: "f",
        letters: { f: "the frequency in hertz", n: "the semitones above the A at 440 Hz (negative for below)" },
        example: { n: "12" },
      },
      {
        id: "note-from-frequency", name: "Semitones from a frequency", eq: "n = 12log_2(f/440)", find: "n",
        letters: { n: "the semitones above the A at 440 Hz", f: "the frequency in hertz" },
        example: { f: "880" },
      },
      {
        id: "interval-ratio", name: "Frequency ratio of an interval", eq: "r = 2^(s/12)", find: "r",
        letters: { r: "the ratio of the two frequencies", s: "the semitones between them" },
        example: { s: "12" },
        note: "twelve semitones make an octave, a ratio of 2",
      },
      {
        id: "cents", name: "Interval in cents", eq: "c = 1200log_2(f/g)", find: "c",
        letters: { c: "the interval in cents", f: "the higher frequency", g: "the lower frequency" },
        example: { f: "880", g: "440" },
        note: "100 cents make a semitone",
      },
      {
        id: "octaves", name: "Octaves between two notes", eq: "k = log_2(f/g)", find: "k",
        letters: { k: "the number of octaves", f: "the higher frequency", g: "the lower frequency" },
        example: { f: "1760", g: "220" },
      },
      {
        id: "harmonic", name: "Harmonics of a note", eq: "f = nF", find: "f",
        letters: { f: "the frequency of the harmonic", n: "which harmonic", F: "the lowest frequency" },
        example: { n: "5", F: "110" },
      },
      {
        id: "beat-frequency", name: "Beats between two notes", eq: "b = f - g", find: "b",
        letters: { b: "the beats each second", f: "the higher frequency", g: "the lower frequency" },
        example: { f: "442", g: "440" },
        note: "used for tuning by ear",
      },
      {
        id: "string-frequency", name: "Frequency of a stretched string", eq: "f = sqrt(T/m)/(2L)", find: "f",
        letters: { f: "the frequency", T: "the tension", m: "the mass of each metre of string", L: "the length" },
        example: { T: "100", m: "1", L: "5" },
      },
      {
        id: "open-pipe", name: "Frequency of a pipe open at both ends", eq: "f = v/(2L)", find: "f",
        letters: { f: "the lowest frequency", v: "the speed of sound", L: "the length of the pipe" },
        example: { v: "340", L: "0.5" },
      },
      {
        id: "closed-pipe", name: "Frequency of a pipe closed at one end", eq: "f = v/(4L)", find: "f",
        letters: { f: "the lowest frequency", v: "the speed of sound", L: "the length of the pipe" },
        example: { v: "340", L: "0.5" },
      },
      {
        id: "sound-speed", name: "Speed of sound in air", eq: "v = 331 + 0.6t", find: "v",
        letters: { v: "the speed of sound in metres a second", t: "the temperature in degrees Celsius" },
        example: { t: "20" },
      },
      {
        id: "wavelength", name: "Wavelength of a note", eq: "w = v/f", find: "w",
        letters: { w: "the wavelength", v: "the speed of sound", f: "the frequency" },
        example: { v: "340", f: "170" },
      },
      {
        id: "decibels", name: "Loudness in decibels", eq: "L = 10log_10(I/J)", find: "L",
        letters: { L: "how much louder in decibels", I: "the intensity of the louder sound", J: "the intensity of the quieter sound" },
        example: { I: "100", J: "1" },
      },
      {
        id: "reverb", name: "Reverberation time of a room (Sabine)", eq: "T = 0.161V/A", find: "T",
        letters: { T: "the time for the sound to die away, in seconds", V: "the volume of the room", A: "the total absorption of the room" },
        example: { V: "1000", A: "40" },
      },
      {
        id: "beat-length", name: "Length of a beat", eq: "t = 60/b", find: "t",
        letters: { t: "the seconds in one beat", b: "the beats a minute" },
        example: { b: "120" },
      },
      {
        id: "bar-length", name: "Length of a bar", eq: "D = 60n/b", find: "D",
        letters: { D: "the seconds in one bar", n: "the beats in a bar", b: "the beats a minute" },
        example: { n: "4", b: "120" },
      },
      {
        id: "song-length", name: "Length of a piece", eq: "T = 60B/b", find: "T",
        letters: { T: "the length in seconds", B: "the beats in the piece", b: "the beats a minute" },
        example: { B: "480", b: "120" },
      },
      {
        id: "dotted-note", name: "Length of a dotted note", eq: "D = 3d/2", find: "D",
        letters: { D: "the length of the dotted note", d: "the length of the note without the dot" },
        example: { d: "2" },
        note: "a dot adds half the note again",
      },
      {
        id: "triplet-note", name: "Length of a note in a triplet", eq: "D = 2d/3", find: "D",
        letters: { D: "the length of one note in the triplet", d: "the length of the plain note" },
        example: { d: "1" },
        note: "three in the time of two",
      },
      {
        id: "rhythm-count", name: "Ways to fill a bar with beats", eq: "W = 2^(n - 1)", find: "W",
        letters: { W: "the number of different rhythms", n: "the number of beats in the bar" },
        example: { n: "4" },
        note: "each beat can be split from the one before or not",
      },
      {
        id: "chord-count", name: "Chords of k notes from a scale", eq: "C = nCr(n, k)", find: "C",
        letters: { C: "the number of chords", n: "the notes in the scale", k: "the notes in each chord" },
        example: { n: "7", k: "3" },
      },
    ],
  },
  {
    group: "Sports: scores, rankings and training",
    items: [
      {
        id: "run-pace", name: "Running pace", eq: "p = t/d", find: "p",
        letters: { p: "the minutes for each kilometre", t: "the time in minutes", d: "the distance in kilometres" },
        example: { t: "30", d: "5" },
      },
      {
        id: "pace-speed", name: "Speed from a running pace", eq: "v = 60/p", find: "v",
        letters: { v: "the speed in kilometres an hour", p: "the minutes for each kilometre" },
        example: { p: "6" },
      },
      {
        id: "race-time", name: "Race time from a pace", eq: "T = dp", find: "T",
        letters: { T: "the time in minutes", d: "the distance in kilometres", p: "the minutes for each kilometre" },
        example: { d: "10", p: "5.5" },
      },
      {
        id: "laps", name: "Laps in a distance", eq: "L = d/c", find: "L",
        letters: { L: "the number of laps", d: "the distance", c: "the length of one lap" },
        example: { d: "5000", c: "400" },
      },
      {
        id: "batting-average", name: "Batting average", eq: "A = r/o", find: "A",
        letters: { A: "the batting average", r: "the runs scored", o: "the number of times out" },
        example: { r: "840", o: "21" },
      },
      {
        id: "strike-rate", name: "Batting strike rate", eq: "S = 100r/b", find: "S",
        letters: { S: "the runs for each 100 balls", r: "the runs scored", b: "the balls faced" },
        example: { r: "45", b: "30" },
      },
      {
        id: "economy", name: "Bowling economy rate", eq: "E = r/o", find: "E",
        letters: { E: "the runs conceded each over", r: "the runs conceded", o: "the overs bowled" },
        example: { r: "42", o: "6" },
      },
      {
        id: "bowling-average", name: "Bowling average", eq: "A = r/w", find: "A",
        letters: { A: "the runs for each wicket", r: "the runs conceded", w: "the wickets taken" },
        example: { r: "300", w: "12" },
      },
      {
        id: "run-rate", name: "Run rate", eq: "R = r/o", find: "R",
        letters: { R: "the runs each over", r: "the runs scored", o: "the overs bowled" },
        example: { r: "135", o: "15" },
      },
      {
        id: "required-rate", name: "Required run rate", eq: "q = (T - s)/o", find: "q",
        letters: { q: "the runs needed each over", T: "the target", s: "the score now", o: "the overs left" },
        example: { T: "180", s: "96", o: "7" },
      },
      {
        id: "net-run-rate", name: "Net run rate", eq: "N = r/o - c/p", find: "N",
        letters: { N: "the net run rate", r: "the runs scored", o: "the overs faced", c: "the runs conceded", p: "the overs bowled" },
        example: { r: "300", o: "40", c: "240", p: "40" },
      },
      {
        id: "league-points", name: "League points", eq: "P = 3w + d", find: "P",
        letters: { P: "the points", w: "the wins", d: "the draws" },
        example: { w: "9", d: "4" },
        note: "3 for a win and 1 for a draw",
      },
      {
        id: "win-percent", name: "Winning percentage", eq: "W = 100w/g", find: "W",
        letters: { W: "the percentage of games won", w: "the games won", g: "the games played" },
        example: { w: "18", g: "30" },
      },
      {
        id: "goal-difference", name: "Goal difference", eq: "D = f - a", find: "D",
        letters: { D: "the goal difference", f: "the goals scored", a: "the goals conceded" },
        example: { f: "42", a: "27" },
      },
      {
        id: "pythagorean-expectation", name: "Expected share of wins from points scored", eq: "W = P^2/(P^2 + A^2)", find: "W",
        letters: { W: "the expected share of wins", P: "the points scored", A: "the points conceded" },
        example: { P: "3", A: "4" },
      },
      {
        id: "elo-expected", name: "Chance of winning from two ratings (Elo)", eq: "E = 1/(1 + 10^((b - a)/400))", find: "E",
        letters: { E: "the chance that the first player wins", a: "the first player's rating", b: "the second player's rating" },
        example: { a: "1900", b: "1500" },
      },
      {
        id: "elo-new", name: "New rating after a game (Elo)", eq: "N = a + K(S - E)", find: "N",
        letters: { N: "the new rating", a: "the old rating", K: "how much one game can change a rating", S: "1 for a win, 1/2 for a draw, 0 for a loss", E: "the chance of winning that was expected" },
        example: { a: "1500", K: "32", S: "1", E: "1/2" },
      },
      {
        id: "one-rep-max", name: "Estimated heaviest single lift (Epley)", eq: "M = w(1 + r/30)", find: "M",
        letters: { M: "the estimated one-rep max", w: "the weight lifted", r: "how many times it was lifted" },
        example: { w: "80", r: "6" },
      },
      {
        id: "lift-volume", name: "Total weight lifted in a session", eq: "L = srw", find: "L",
        letters: { L: "the total lifted", s: "the sets", r: "the repetitions in each set", w: "the weight for each repetition" },
        example: { s: "4", r: "8", w: "60" },
      },
      {
        id: "met-calories", name: "Calories used in exercise", eq: "C = Mwt", find: "C",
        letters: { C: "the calories used", M: "the MET value of the exercise", w: "the body mass in kilograms", t: "the time in hours" },
        example: { M: "8", w: "70", t: "1" },
      },
      {
        id: "sweat-rate", name: "Sweat rate", eq: "S = (a - b + d)/t", find: "S",
        letters: { S: "the litres lost each hour", a: "the body mass before, in kilograms", b: "the body mass after, in kilograms", d: "the litres drunk", t: "the hours of exercise" },
        example: { a: "70", b: "69", d: "0.5", t: "1" },
      },
    ],
  },
  {
    group: "Health: body, dosage and public health",
    items: [
      {
        id: "bmi", name: "Body mass index", eq: "B = m/h^2", find: "B",
        letters: { B: "the body mass index", m: "the mass in kilograms", h: "the height in metres" },
        example: { m: "45", h: "1.5" },
      },
      {
        id: "body-surface", name: "Body surface area (Mosteller)", eq: "S = sqrt(hw/3600)", find: "S",
        letters: { S: "the body surface area in square metres", h: "the height in centimetres", w: "the mass in kilograms" },
        example: { h: "180", w: "80" },
      },
      {
        id: "waist-hip", name: "Waist-to-hip ratio", eq: "R = a/b", find: "R",
        letters: { R: "the waist-to-hip ratio", a: "the waist measurement", b: "the hip measurement" },
        example: { a: "80", b: "100" },
      },
      {
        id: "max-heart-rate", name: "Greatest heart rate", eq: "M = 220 - a", find: "M",
        letters: { M: "the greatest heart rate in beats a minute", a: "the age in years" },
        example: { a: "30" },
      },
      {
        id: "karvonen", name: "Target heart rate (Karvonen)", eq: "T = (M - r)p + r", find: "T",
        letters: { T: "the target heart rate", M: "the greatest heart rate", r: "the resting heart rate", p: "the share of effort, from 0 to 1" },
        example: { M: "190", r: "60", p: "7/10" },
      },
      {
        id: "bmr-male", name: "Resting energy use, men (Mifflin-St Jeor)", eq: "B = 10w + 6.25h - 5a + 5", find: "B",
        letters: { B: "the calories used each day at rest", w: "the mass in kilograms", h: "the height in centimetres", a: "the age in years" },
        example: { w: "70", h: "175", a: "30" },
      },
      {
        id: "bmr-female", name: "Resting energy use, women (Mifflin-St Jeor)", eq: "B = 10w + 6.25h - 5a - 161", find: "B",
        letters: { B: "the calories used each day at rest", w: "the mass in kilograms", h: "the height in centimetres", a: "the age in years" },
        example: { w: "60", h: "165", a: "30" },
      },
      {
        id: "daily-energy", name: "Calories needed in a day", eq: "E = Bf", find: "E",
        letters: { E: "the calories needed in a day", B: "the calories used at rest", f: "the activity factor, from 1.2 to 1.9" },
        example: { B: "1600", f: "1.5" },
      },
      {
        id: "food-energy", name: "Energy in food", eq: "E = 4p + 4c + 9f", find: "E",
        letters: { E: "the calories", p: "the grams of protein", c: "the grams of carbohydrate", f: "the grams of fat" },
        example: { p: "100", c: "250", f: "60" },
      },
      {
        id: "water-need", name: "Water needed in a day", eq: "V = 35w", find: "V",
        letters: { V: "the millilitres of water", w: "the mass in kilograms" },
        example: { w: "60" },
        note: "a rough guide",
      },
      {
        id: "dose-weight", name: "Dose by body mass", eq: "D = mw", find: "D",
        letters: { D: "the dose", m: "the dose for each kilogram", w: "the mass in kilograms" },
        example: { m: "15", w: "20" },
      },
      {
        id: "clark", name: "Child's dose from the adult dose (Clark's rule)", eq: "c = wD/70", find: "c",
        letters: { c: "the child's dose", w: "the child's mass in kilograms", D: "the adult dose" },
        example: { w: "21", D: "500" },
      },
      {
        id: "young-dose", name: "Child's dose from the adult dose (Young's rule)", eq: "c = aD/(a + 12)", find: "c",
        letters: { c: "the child's dose", a: "the child's age in years", D: "the adult dose" },
        example: { a: "4", D: "400" },
      },
      {
        id: "drip-rate", name: "Drip rate of an infusion", eq: "R = Vf/t", find: "R",
        letters: { R: "the drops each minute", V: "the volume in millilitres", f: "the drops in one millilitre", t: "the time in minutes" },
        example: { V: "500", f: "20", t: "100" },
      },
      {
        id: "map", name: "Mean arterial pressure", eq: "M = (s + 2d)/3", find: "M",
        letters: { M: "the mean arterial pressure", s: "the systolic pressure", d: "the diastolic pressure" },
        example: { s: "120", d: "75" },
      },
      {
        id: "pulse-pressure", name: "Pulse pressure", eq: "P = s - d", find: "P",
        letters: { P: "the pulse pressure", s: "the systolic pressure", d: "the diastolic pressure" },
        example: { s: "120", d: "80" },
      },
      {
        id: "cardiac-output", name: "Cardiac output", eq: "C = hs", find: "C",
        letters: { C: "the millilitres pumped each minute", h: "the heart rate", s: "the stroke volume in millilitres" },
        example: { h: "72", s: "70" },
      },
      {
        id: "ejection-fraction", name: "Ejection fraction", eq: "F = 100(E - s)/E", find: "F",
        letters: { F: "the ejection fraction, as a percentage", E: "the volume in the heart before it beats", s: "the volume left after it beats" },
        example: { E: "120", s: "48" },
      },
      {
        id: "creatinine-clearance", name: "Kidney clearance (Cockcroft-Gault)", eq: "C = (140 - a)w/(72s)", find: "C",
        letters: { C: "the clearance in millilitres a minute", a: "the age in years", w: "the mass in kilograms", s: "the serum creatinine" },
        example: { a: "60", w: "72", s: "1" },
      },
      {
        id: "corrected-calcium", name: "Corrected calcium", eq: "C = a + 0.8(4 - b)", find: "C",
        letters: { C: "the corrected calcium", a: "the measured calcium", b: "the albumin" },
        example: { a: "2", b: "3" },
      },
      {
        id: "anion-gap", name: "Anion gap", eq: "A = N - C - B", find: "A",
        letters: { A: "the anion gap", N: "the sodium", C: "the chloride", B: "the bicarbonate" },
        example: { N: "140", C: "104", B: "24" },
      },
      {
        id: "prevalence", name: "Prevalence of a condition", eq: "P = 100c/N", find: "P",
        letters: { P: "the prevalence, as a percentage", c: "the people who have it", N: "the people in the group" },
        example: { c: "45", N: "1500" },
      },
      {
        id: "mortality-rate", name: "Death rate for each 1000 people", eq: "M = 1000d/N", find: "M",
        letters: { M: "the deaths for each 1000 people", d: "the deaths in a year", N: "the people in the population" },
        example: { d: "90", N: "12000" },
      },
      {
        id: "case-fatality", name: "Case fatality rate", eq: "C = 100d/c", find: "C",
        letters: { C: "the case fatality rate, as a percentage", d: "the deaths from the disease", c: "the people who caught it" },
        example: { d: "30", c: "1200" },
      },
      {
        id: "relative-risk", name: "Relative risk", eq: "R = (a/(a + b))/(c/(c + d))", find: "R",
        letters: { R: "the relative risk", a: "the exposed who got ill", b: "the exposed who stayed well", c: "the unexposed who got ill", d: "the unexposed who stayed well" },
        example: { a: "20", b: "80", c: "10", d: "90" },
      },
      {
        id: "odds-ratio", name: "Odds ratio", eq: "O = ad/(bc)", find: "O",
        letters: { O: "the odds ratio", a: "the exposed who got ill", b: "the exposed who stayed well", c: "the unexposed who got ill", d: "the unexposed who stayed well" },
        example: { a: "20", b: "80", c: "10", d: "90" },
      },
      {
        id: "nnt", name: "Number needed to treat", eq: "n = 1/(a - b)", find: "n",
        letters: { n: "the people to treat for one to benefit", a: "the share who recover with the treatment", b: "the share who recover without it" },
        example: { a: "3/10", b: "1/10" },
      },
      {
        id: "sensitivity", name: "Sensitivity of a test", eq: "S = t/(t + f)", find: "S",
        letters: { S: "the sensitivity", t: "the sick people the test found", f: "the sick people it missed" },
        example: { t: "90", f: "10" },
      },
      {
        id: "specificity", name: "Specificity of a test", eq: "S = t/(t + f)", find: "S",
        letters: { S: "the specificity", t: "the healthy people it cleared", f: "the healthy people it wrongly flagged" },
        example: { t: "180", f: "20" },
      },
      {
        id: "ppv", name: "Chance that a positive test is right", eq: "V = t/(t + f)", find: "V",
        letters: { V: "the positive predictive value", t: "the positive tests that were right", f: "the positive tests that were wrong" },
        example: { t: "90", f: "30" },
      },
      {
        id: "spread", name: "People infected after n rounds of spread", eq: "I = R^n", find: "I",
        letters: { I: "the people infected", R: "the people each person infects", n: "the number of rounds" },
        example: { R: "3", n: "4" },
      },
      {
        id: "herd-immunity", name: "Share that must be immune to stop an outbreak", eq: "H = 100(1 - 1/R)", find: "H",
        letters: { H: "the share that must be immune, as a percentage", R: "the people each person infects" },
        example: { R: "4" },
      },
      {
        id: "vaccine-efficacy", name: "Efficacy of a vaccine", eq: "E = 100(1 - a/b)", find: "E",
        letters: { E: "the efficacy, as a percentage", a: "the risk of illness in the vaccinated", b: "the risk of illness in the unvaccinated" },
        example: { a: "1/10", b: "1/2" },
      },
    ],
  },
  {
    group: "Geometry: triangles",
    items: [
      {
        id: "equilateral-perimeter", name: "Perimeter of an equilateral triangle", eq: "P = 3s", find: "P",
        letters: { P: "the perimeter", s: "the side" },
        example: { s: "7" },
      },
      {
        id: "equilateral-height", name: "Height of an equilateral triangle", eq: "h = sqrt(3)s/2", find: "h",
        letters: { h: "the height", s: "the side" },
        example: { s: "4" },
      },
      {
        id: "isosceles-area", name: "Area of an isosceles triangle", eq: "A = (b/4)sqrt(4a^2 - b^2)", find: "A",
        letters: { A: "the area", a: "one of the equal sides", b: "the base" },
        example: { a: "5", b: "6" },
      },
      {
        id: "isosceles-height", name: "Height of an isosceles triangle", eq: "h = sqrt(a^2 - b^2/4)", find: "h",
        letters: { h: "the height", a: "one of the equal sides", b: "the base" },
        example: { a: "5", b: "6" },
      },
      {
        id: "isosceles-base-angle", name: "Base angles of an isosceles triangle", eq: "B = (180 - A)/2", find: "B",
        letters: { B: "each base angle in degrees", A: "the angle at the top in degrees" },
        example: { A: "40" },
      },
      {
        id: "angle-sum-triangle", name: "Angles of a triangle", eq: "C = 180 - A - B", find: "C",
        letters: { C: "the third angle in degrees", A: "the first angle", B: "the second angle" },
        example: { A: "50", B: "60" },
      },
      {
        id: "exterior-angle", name: "Exterior angle of a triangle", eq: "E = a + b", find: "E",
        letters: { E: "the exterior angle", a: "one opposite interior angle", b: "the other opposite interior angle" },
        example: { a: "50", b: "60" },
      },
      {
        id: "triangle-height", name: "Height of a triangle from its area", eq: "h = 2A/b", find: "h",
        letters: { h: "the height", A: "the area", b: "the base" },
        example: { A: "30", b: "10" },
      },
      {
        id: "right-altitude", name: "Altitude to the hypotenuse of a right triangle", eq: "h = ab/c", find: "h",
        letters: { h: "the altitude to the hypotenuse", a: "one leg", b: "the other leg", c: "the hypotenuse" },
        example: { a: "3", b: "4", c: "5" },
      },
      {
        id: "altitude-theorem", name: "Altitude to the hypotenuse from its two pieces", eq: "h = sqrt(pq)", find: "h",
        letters: { h: "the altitude", p: "one piece of the hypotenuse", q: "the other piece" },
        example: { p: "4", q: "9" },
        note: "the altitude is the geometric mean of the two pieces",
      },
      {
        id: "leg-theorem", name: "A leg of a right triangle from the hypotenuse", eq: "a^2 = pc", find: "p",
        letters: { a: "the leg", p: "the piece of the hypotenuse next to that leg", c: "the whole hypotenuse" },
        example: { a: "8", c: "16" },
      },
      {
        id: "inradius-area", name: "Radius of the circle inside a triangle", eq: "r = A/s", find: "r",
        letters: { r: "the inradius", A: "the area", s: "half the perimeter" },
        example: { A: "24", s: "12" },
      },
      {
        id: "right-inradius", name: "Radius of the circle inside a right triangle", eq: "r = (a + b - c)/2", find: "r",
        letters: { r: "the inradius", a: "one leg", b: "the other leg", c: "the hypotenuse" },
        example: { a: "3", b: "4", c: "5" },
      },
      {
        id: "circumradius", name: "Radius of the circle round a triangle", eq: "R = abc/(4A)", find: "R",
        letters: { R: "the circumradius", a: "one side", b: "another side", c: "the third side", A: "the area" },
        example: { a: "3", b: "4", c: "5", A: "6" },
      },
      {
        id: "circumradius-right", name: "Radius of the circle round a right triangle", eq: "R = c/2", find: "R",
        letters: { R: "the circumradius", c: "the hypotenuse" },
        example: { c: "10" },
        note: "the hypotenuse is a diameter",
      },
      {
        id: "sine-rule-circle", name: "The sine rule with the circumradius", eq: "a/sin(A°) = 2R", find: "R",
        letters: { a: "a side", A: "the angle opposite it in degrees", R: "the circumradius" },
        example: { a: "5", A: "30" },
      },
      {
        id: "area-circumradius", name: "Area of a triangle from the circumradius", eq: "A = abc/(4R)", find: "A",
        letters: { A: "the area", a: "one side", b: "another side", c: "the third side", R: "the circumradius" },
        example: { a: "3", b: "4", c: "5", R: "5/2" },
      },
      {
        id: "area-inradius", name: "Area of a triangle from the inradius", eq: "A = rs", find: "A",
        letters: { A: "the area", r: "the inradius", s: "half the perimeter" },
        example: { r: "2", s: "12" },
      },
      {
        id: "median-length", name: "Length of a median", eq: "m = sqrt(2b^2 + 2c^2 - a^2)/2", find: "m",
        letters: { m: "the median to side a", a: "the side it meets", b: "one other side", c: "the third side" },
        example: { a: "6", b: "5", c: "5" },
      },
      {
        id: "midsegment-triangle", name: "Line joining the midpoints of two sides", eq: "m = b/2", find: "m",
        letters: { m: "the length of the line", b: "the third side, which it is parallel to" },
        example: { b: "14" },
      },
      {
        id: "centroid-coordinate", name: "Centroid of a triangle", eq: "g = (a + b + c)/3", find: "g",
        letters: { g: "the coordinate of the centroid", a: "the first corner", b: "the second corner", c: "the third corner" },
        example: { a: "3", b: "6", c: "9" },
        note: "use it for the x values, then again for the y values",
      },
    ],
  },
  {
    group: "Geometry: quadrilaterals and polygons",
    items: [
      {
        id: "quad-perimeter", name: "Perimeter of any four-sided shape", eq: "P = a + b + c + d", find: "P",
        letters: { P: "the perimeter", a: "the first side", b: "the second side", c: "the third side", d: "the fourth side" },
        example: { a: "5", b: "7", c: "6", d: "9" },
      },
      {
        id: "parallelogram-sine", name: "Area of a parallelogram from two sides and the angle", eq: "A = ab·sin(C°)", find: "A",
        letters: { A: "the area", a: "one side", b: "the next side", C: "the angle between them in degrees" },
        example: { a: "8", b: "5", C: "30" },
      },
      {
        id: "parallelogram-diagonal", name: "Diagonals of a parallelogram", eq: "q = sqrt(2(a^2 + b^2) - p^2)", find: "q",
        letters: { q: "one diagonal", p: "the other diagonal", a: "one side", b: "the next side" },
        example: { a: "5", b: "5", p: "6" },
        note: "the squares of the diagonals add to twice the squares of the sides",
      },
      {
        id: "rhombus-side", name: "Side of a rhombus from its diagonals", eq: "s = sqrt(p^2 + q^2)/2", find: "s",
        letters: { s: "the side", p: "one diagonal", q: "the other diagonal" },
        example: { p: "6", q: "8" },
      },
      {
        id: "rhombus-sine", name: "Area of a rhombus from its side and an angle", eq: "A = s^2·sin(t°)", find: "A",
        letters: { A: "the area", s: "the side", t: "an angle in degrees" },
        example: { s: "10", t: "30" },
      },
      {
        id: "rhombus-inradius", name: "Radius of the circle inside a rhombus", eq: "r = pq/(2sqrt(p^2 + q^2))", find: "r",
        letters: { r: "the inradius", p: "one diagonal", q: "the other diagonal" },
        example: { p: "6", q: "8" },
      },
      {
        id: "isosceles-trapezium-height", name: "Height of an isosceles trapezium", eq: "h = sqrt(c^2 - ((a - b)/2)^2)", find: "h",
        letters: { h: "the height", a: "the long parallel side", b: "the short parallel side", c: "each slanting side" },
        example: { a: "10", b: "4", c: "5" },
      },
      {
        id: "quad-diagonals-area", name: "Area of any four-sided shape from its diagonals", eq: "A = pq·sin(t°)/2", find: "A",
        letters: { A: "the area", p: "one diagonal", q: "the other diagonal", t: "the angle between them in degrees" },
        example: { p: "10", q: "8", t: "30" },
      },
      {
        id: "cyclic-area", name: "Area of a quadrilateral inside a circle (Brahmagupta)", eq: "A = sqrt((s - a)(s - b)(s - c)(s - d))", find: "A",
        letters: { A: "the area", s: "half the perimeter", a: "the first side", b: "the second side", c: "the third side", d: "the fourth side" },
        example: { s: "6", a: "3", b: "3", c: "3", d: "3" },
      },
      {
        id: "ptolemy", name: "Ptolemy's theorem for a quadrilateral inside a circle", eq: "pq = ac + bd", find: "p",
        letters: { p: "one diagonal", q: "the other diagonal", a: "one side", c: "the opposite side", b: "another side", d: "its opposite side" },
        example: { a: "3", b: "4", c: "3", d: "4", q: "5" },
      },
      {
        id: "cyclic-opposite-angles", name: "Opposite angles of a quadrilateral inside a circle", eq: "C = 180 - A", find: "C",
        letters: { C: "one angle in degrees", A: "the opposite angle" },
        example: { A: "70" },
      },
      {
        id: "tangential-quad", name: "A quadrilateral with a circle inside it", eq: "d = a + c - b", find: "d",
        letters: { a: "one side", b: "the next side", c: "the side opposite a", d: "the side opposite b" },
        example: { a: "7", b: "5", c: "9" },
        note: "opposite sides add to the same total",
      },
      {
        id: "regular-polygon-side-area", name: "Area of a regular polygon from its side", eq: "A = ns^2/(4tan((180/n)°))", find: "A",
        letters: { A: "the area", n: "the number of sides", s: "the side" },
        example: { n: "4", s: "5" },
      },
      {
        id: "polygon-apothem", name: "Apothem of a regular polygon", eq: "a = s/(2tan((180/n)°))", find: "a",
        letters: { a: "the apothem", s: "the side", n: "the number of sides" },
        example: { n: "4", s: "10" },
      },
      {
        id: "polygon-circumradius", name: "Radius of the circle round a regular polygon", eq: "R = s/(2sin((180/n)°))", find: "R",
        letters: { R: "the circumradius", s: "the side", n: "the number of sides" },
        example: { n: "6", s: "10" },
      },
      {
        id: "polygon-perimeter", name: "Perimeter of a regular polygon", eq: "P = ns", find: "P",
        letters: { P: "the perimeter", n: "the number of sides", s: "the side" },
        example: { n: "8", s: "5" },
      },
      {
        id: "polygon-triangles", name: "Triangles a polygon is cut into", eq: "T = n - 2", find: "T",
        letters: { T: "the number of triangles", n: "the number of sides" },
        example: { n: "9" },
        note: "cut from one corner",
      },
      {
        id: "polygon-interior-exterior", name: "Interior and exterior angle at one corner", eq: "I = 180 - E", find: "I",
        letters: { I: "the interior angle", E: "the exterior angle" },
        example: { E: "40" },
      },
      {
        id: "square-incircle", name: "Radius of the circle inside a square", eq: "r = s/2", find: "r",
        letters: { r: "the radius", s: "the side" },
        example: { s: "12" },
      },
      {
        id: "square-circumcircle", name: "Radius of the circle round a square", eq: "R = ssqrt(2)/2", find: "R",
        letters: { R: "the radius", s: "the side" },
        example: { s: "6" },
      },
      {
        id: "pick", name: "Pick's theorem for a shape on a grid", eq: "A = i + b/2 - 1", find: "A",
        letters: { A: "the area", i: "the grid points inside", b: "the grid points on the edge" },
        example: { i: "6", b: "8" },
      },
    ],
  },
  {
    group: "Geometry: circles",
    items: [
      {
        id: "circle-diameter", name: "Diameter of a circle", eq: "d = 2r", find: "d",
        letters: { d: "the diameter", r: "the radius" },
        example: { r: "7" },
      },
      {
        id: "circle-area-diameter", name: "Area of a circle from its diameter", eq: "A = π(d/2)^2", find: "A",
        letters: { A: "the area", d: "the diameter" },
        example: { d: "14" },
      },
      {
        id: "circle-circumference-diameter", name: "Distance round a circle from its diameter", eq: "C = πd", find: "C",
        letters: { C: "the circumference", d: "the diameter" },
        example: { d: "14" },
      },
      {
        id: "circle-area-circumference", name: "Area of a circle from its circumference", eq: "A = C^2/(4π)", find: "A",
        letters: { A: "the area", C: "the circumference" },
        example: { C: "44" },
      },
      {
        id: "sector-perimeter", name: "Perimeter of a sector", eq: "P = 2r + s", find: "P",
        letters: { P: "the perimeter", r: "the radius", s: "the arc length" },
        example: { r: "7", s: "11" },
      },
      {
        id: "arc-radians", name: "Arc length when the angle is in radians", eq: "s = rt", find: "s",
        letters: { s: "the arc length", r: "the radius", t: "the angle in radians" },
        example: { r: "5", t: "2" },
      },
      {
        id: "degrees-to-radians", name: "Degrees into radians", eq: "R = πD/180", find: "R",
        letters: { R: "the angle in radians", D: "the angle in degrees" },
        example: { D: "90" },
      },
      {
        id: "sagitta", name: "Height of a circular segment", eq: "h = r - sqrt(r^2 - c^2/4)", find: "h",
        letters: { h: "the height of the segment", r: "the radius", c: "the chord" },
        example: { r: "5", c: "8" },
      },
      {
        id: "tangent-length", name: "Length of a tangent from a point", eq: "t = sqrt(d^2 - r^2)", find: "t",
        letters: { t: "the tangent length", d: "the distance from the point to the centre", r: "the radius" },
        example: { d: "13", r: "5" },
      },
      {
        id: "external-tangent", name: "Length of a common outside tangent", eq: "t = sqrt(d^2 - (R - r)^2)", find: "t",
        letters: { t: "the tangent length", d: "the distance between the centres", R: "the bigger radius", r: "the smaller radius" },
        example: { d: "13", R: "8", r: "3" },
      },
      {
        id: "internal-tangent", name: "Length of a common crossing tangent", eq: "t = sqrt(d^2 - (R + r)^2)", find: "t",
        letters: { t: "the tangent length", d: "the distance between the centres", R: "one radius", r: "the other radius" },
        example: { d: "13", R: "3", r: "2" },
      },
      {
        id: "intersecting-chords", name: "Two chords crossing inside a circle", eq: "ab = cd", find: "a",
        letters: { a: "one piece of the first chord", b: "the other piece", c: "one piece of the second chord", d: "the other piece" },
        example: { b: "4", c: "6", d: "2" },
      },
      {
        id: "secant-secant", name: "Two secants meeting outside a circle", eq: "a(a + b) = c(c + d)", find: "d",
        letters: { a: "the outside part of the first secant", b: "its inside part", c: "the outside part of the second", d: "its inside part" },
        example: { a: "3", b: "5", c: "4" },
      },
      {
        id: "tangent-secant", name: "A tangent and a secant meeting outside a circle", eq: "t = sqrt(a(a + b))", find: "t",
        letters: { t: "the tangent", a: "the outside part of the secant", b: "its inside part" },
        example: { a: "4", b: "5" },
      },
      {
        id: "inscribed-angle", name: "Angle at the edge on an arc", eq: "I = C/2", find: "I",
        letters: { I: "the angle at the circumference", C: "the angle at the centre on the same arc" },
        example: { C: "80" },
      },
      {
        id: "angle-two-chords", name: "Angle between two chords inside a circle", eq: "x = (a + b)/2", find: "x",
        letters: { x: "the angle in degrees", a: "one arc", b: "the opposite arc" },
        example: { a: "70", b: "50" },
      },
      {
        id: "angle-outside-circle", name: "Angle between two lines meeting outside a circle", eq: "x = (a - b)/2", find: "x",
        letters: { x: "the angle in degrees", a: "the far arc", b: "the near arc" },
        example: { a: "100", b: "40" },
      },
      {
        id: "circle-equation-radius", name: "Radius from the equation of a circle", eq: "r = sqrt((x - h)^2 + (y - k)^2)", find: "r",
        letters: { r: "the radius", x: "x of a point on the circle", y: "y of that point", h: "x of the centre", k: "y of the centre" },
        example: { x: "7", y: "3", h: "3", k: "0" },
      },
      {
        id: "circle-general-radius", name: "Radius from x² + y² + 2gx + 2fy + c = 0", eq: "r = sqrt(g^2 + f^2 - c)", find: "r",
        letters: { r: "the radius", g: "half the x coefficient", f: "half the y coefficient", c: "the number on its own" },
        example: { g: "3", f: "4", c: "0" },
        note: "the centre is at (−g, −f)",
      },
      {
        id: "ellipse-perimeter", name: "Distance round an ellipse (Ramanujan)", eq: "P = π(3(a + b) - sqrt((3a + b)(a + 3b)))", find: "P",
        letters: { P: "the perimeter", a: "the long radius", b: "the short radius" },
        example: { a: "7", b: "7" },
        note: "a close estimate",
      },
      {
        id: "ellipse-eccentricity", name: "How stretched an ellipse is", eq: "x = sqrt(1 - b^2/a^2)", find: "x",
        letters: { x: "the eccentricity", a: "the long radius", b: "the short radius" },
        example: { a: "5", b: "3" },
      },
      {
        id: "ellipse-focus", name: "Distance to a focus of an ellipse", eq: "c = sqrt(a^2 - b^2)", find: "c",
        letters: { c: "the distance from the centre to a focus", a: "the long radius", b: "the short radius" },
        example: { a: "5", b: "3" },
      },
      {
        id: "hyperbola-focus", name: "Distance to a focus of a hyperbola", eq: "c = sqrt(a^2 + b^2)", find: "c",
        letters: { c: "the distance from the centre to a focus", a: "the distance to a vertex", b: "the other semi-axis" },
        example: { a: "3", b: "4" },
      },
      {
        id: "hyperbola-asymptote", name: "Slope of a hyperbola's asymptote", eq: "m = b/a", find: "m",
        letters: { m: "the slope", a: "the distance to a vertex", b: "the other semi-axis" },
        example: { a: "3", b: "4" },
      },
      {
        id: "parabola-focus", name: "Focal length of a parabola y² = 4ax", eq: "a = y^2/(4x)", find: "a",
        letters: { a: "the focal length", x: "x of a point on the parabola", y: "y of that point" },
        example: { x: "1", y: "4" },
      },
    ],
  },
  {
    group: "Geometry: coordinates and transformations",
    items: [
      {
        id: "distance-2d", name: "Distance between two points", eq: "D = sqrt((c - a)^2 + (d - b)^2)", find: "D",
        letters: { D: "the distance", a: "x of the first point", b: "y of the first point", c: "x of the second point", d: "y of the second point" },
        example: { a: "1", b: "2", c: "4", d: "6" },
      },
      {
        id: "section-point", name: "Point dividing a line in a ratio", eq: "x = (mc + na)/(m + n)", find: "x",
        letters: { x: "the coordinate of the point", a: "the first end", c: "the second end", m: "the first part of the ratio", n: "the second part" },
        example: { a: "1", c: "9", m: "1", n: "3" },
        note: "use it for x, then again for y",
      },
      {
        id: "slope-two-points", name: "Slope between two points", eq: "m = (d - b)/(c - a)", find: "m",
        letters: { m: "the slope", a: "x of the first point", b: "y of the first point", c: "x of the second point", d: "y of the second point" },
        example: { a: "1", b: "2", c: "4", d: "11" },
      },
      {
        id: "line-slope-intercept", name: "A line y = mx + c", eq: "y = mx + c", find: "y",
        letters: { y: "the height of the line", m: "the slope", x: "the distance along", c: "where it crosses the y-axis" },
        example: { m: "2", x: "3", c: "1" },
      },
      {
        id: "line-point-slope", name: "A line from a point and a slope", eq: "y - b = m(x - a)", find: "y",
        letters: { y: "the height of the line", b: "y of the known point", m: "the slope", x: "the distance along", a: "x of the known point" },
        example: { m: "2", x: "5", a: "3", b: "1" },
      },
      {
        id: "line-two-points", name: "A line through two points", eq: "(y - b)/(d - b) = (x - a)/(c - a)", find: "y",
        letters: { y: "the height of the line", x: "the distance along", a: "x of the first point", b: "y of the first point", c: "x of the second point", d: "y of the second point" },
        example: { a: "1", b: "1", c: "3", d: "5", x: "2" },
      },
      {
        id: "line-intercepts", name: "A line from its two intercepts", eq: "y = b(1 - x/a)", find: "y",
        letters: { y: "the height of the line", x: "the distance along", a: "where it crosses the x-axis", b: "where it crosses the y-axis" },
        example: { a: "4", b: "2", x: "2" },
      },
      {
        id: "line-general-slope", name: "Slope of ax + by + c = 0", eq: "m = -a/b", find: "m",
        letters: { m: "the slope", a: "the number in front of x", b: "the number in front of y" },
        example: { a: "2", b: "4" },
      },
      {
        id: "perpendicular-slope", name: "Slope of a perpendicular line", eq: "n = -1/m", find: "n",
        letters: { n: "the slope of the perpendicular", m: "the slope of the first line" },
        example: { m: "2" },
        note: "the two slopes multiply to −1",
      },
      {
        id: "angle-between-lines", name: "Angle between two lines", eq: "tan(t°) = (m - n)/(1 + mn)", find: "t",
        letters: { t: "the angle in degrees", m: "the slope of one line", n: "the slope of the other" },
        example: { m: "3", n: "1/2" },
      },
      {
        id: "point-line-distance", name: "Distance from a point to a line", eq: "d = (ax + by + c)/sqrt(a^2 + b^2)", find: "d",
        letters: { d: "the distance (ignore the sign)", a: "the number in front of x", b: "the number in front of y", c: "the number on its own", x: "x of the point", y: "y of the point" },
        example: { a: "3", b: "4", c: "-5", x: "1", y: "2" },
      },
      {
        id: "parallel-lines-distance", name: "Distance between two parallel lines", eq: "d = (c - f)/sqrt(a^2 + b^2)", find: "d",
        letters: { d: "the distance (ignore the sign)", a: "the number in front of x", b: "the number in front of y", c: "the number on its own in the first line", f: "the number on its own in the second" },
        example: { a: "3", b: "4", c: "10", f: "0" },
      },
      {
        id: "translation", name: "Moving a point", eq: "X = x + a", find: "X",
        letters: { X: "the new x", x: "the old x", a: "how far it moves along" },
        example: { x: "3", a: "5" },
        note: "use it again for y",
      },
      {
        id: "enlargement", name: "Enlarging from a centre", eq: "X = k(x - a) + a", find: "X",
        letters: { X: "the new x", x: "the old x", a: "x of the centre", k: "the scale factor" },
        example: { k: "3", x: "4", a: "2" },
        note: "use it again for y",
      },
      {
        id: "rotation-x", name: "Turning a point about the origin: the new x", eq: "X = x·cos(t°) - y·sin(t°)", find: "X",
        letters: { X: "the new x", x: "the old x", y: "the old y", t: "the angle turned in degrees" },
        example: { x: "2", y: "3", t: "90" },
      },
      {
        id: "rotation-y", name: "Turning a point about the origin: the new y", eq: "Y = x·sin(t°) + y·cos(t°)", find: "Y",
        letters: { Y: "the new y", x: "the old x", y: "the old y", t: "the angle turned in degrees" },
        example: { x: "2", y: "3", t: "90" },
      },
      {
        id: "polar-x", name: "Polar to rectangular: x", eq: "x = r·cos(t°)", find: "x",
        letters: { x: "the distance along", r: "the distance from the origin", t: "the angle in degrees" },
        example: { r: "10", t: "60" },
      },
      {
        id: "polar-y", name: "Polar to rectangular: y", eq: "y = r·sin(t°)", find: "y",
        letters: { y: "the height", r: "the distance from the origin", t: "the angle in degrees" },
        example: { r: "10", t: "30" },
      },
      {
        id: "polar-radius", name: "Distance from the origin", eq: "r = sqrt(x^2 + y^2)", find: "r",
        letters: { r: "the distance from the origin", x: "the distance along", y: "the height" },
        example: { x: "6", y: "8" },
      },
      {
        id: "vector-magnitude-2d", name: "Length of a vector in two dimensions", eq: "m = sqrt(a^2 + b^2)", find: "m",
        letters: { m: "the length", a: "the x part", b: "the y part" },
        example: { a: "3", b: "4" },
      },
      {
        id: "vector-dot-2d", name: "Dot product in two dimensions", eq: "D = ac + bd", find: "D",
        letters: { D: "the dot product", a: "x of the first vector", b: "y of the first vector", c: "x of the second", d: "y of the second" },
        example: { a: "2", b: "3", c: "4", d: "-1" },
      },
      {
        id: "vector-angle", name: "Angle between two vectors", eq: "cos(t°) = (ac + bd)/(sqrt(a^2 + b^2)sqrt(c^2 + d^2))", find: "t",
        letters: { t: "the angle in degrees", a: "x of the first vector", b: "y of the first vector", c: "x of the second", d: "y of the second" },
        example: { a: "0", b: "1", c: "1", d: "0" },
      },
    ],
  },
  {
    group: "Geometry: solids",
    items: [
      {
        id: "cube-diagonal", name: "Diagonal of a cube", eq: "d = ssqrt(3)", find: "d",
        letters: { d: "the diagonal from corner to corner", s: "the edge" },
        example: { s: "4" },
      },
      {
        id: "sphere-round-cube", name: "Sphere that just holds a cube", eq: "R = ssqrt(3)/2", find: "R",
        letters: { R: "the radius of the sphere", s: "the edge of the cube" },
        example: { s: "4" },
      },
      {
        id: "cuboid-lateral", name: "Sides of a cuboid without top or bottom", eq: "L = 2h(l + w)", find: "L",
        letters: { L: "the area of the four sides", h: "the height", l: "the length", w: "the width" },
        example: { h: "5", l: "6", w: "4" },
      },
      {
        id: "prism-lateral", name: "Sides of a prism", eq: "L = Ph", find: "L",
        letters: { L: "the area of the sides", P: "the perimeter of the end", h: "the length of the prism" },
        example: { P: "12", h: "10" },
      },
      {
        id: "prism-surface", name: "Surface area of a prism", eq: "A = 2B + Ph", find: "A",
        letters: { A: "the total area", B: "the area of one end", P: "the perimeter of the end", h: "the length of the prism" },
        example: { B: "6", P: "12", h: "10" },
      },
      {
        id: "right-triangular-prism", name: "Surface area of a prism with a right-angled end", eq: "A = pq + (p + q + r)L", find: "A",
        letters: { A: "the total area", p: "one leg", q: "the other leg", r: "the hypotenuse", L: "the length of the prism" },
        example: { p: "3", q: "4", r: "5", L: "10" },
      },
      {
        id: "hexagonal-prism", name: "Volume of a hexagonal prism", eq: "V = 3sqrt(3)s^2h/2", find: "V",
        letters: { V: "the volume", s: "the side of the hexagon", h: "the height" },
        example: { s: "2", h: "5" },
      },
      {
        id: "hollow-cylinder", name: "Volume of a pipe", eq: "V = πh(R^2 - r^2)", find: "V",
        letters: { V: "the volume of the material", h: "the length", R: "the outer radius", r: "the inner radius" },
        example: { h: "7", R: "14", r: "7" },
      },
      {
        id: "open-cylinder", name: "Surface area of a cylinder open at the top", eq: "A = πr(r + 2h)", find: "A",
        letters: { A: "the area", r: "the radius", h: "the height" },
        example: { r: "7", h: "10" },
      },
      {
        id: "cylinder-diagonal", name: "Longest straight line inside a cylinder", eq: "d = sqrt(4r^2 + h^2)", find: "d",
        letters: { d: "the diagonal", r: "the radius", h: "the height" },
        example: { r: "3", h: "8" },
      },
      {
        id: "cone-sector-angle", name: "Angle of the sector that folds into a cone", eq: "t = 360r/l", find: "t",
        letters: { t: "the angle in degrees", r: "the base radius", l: "the slant height" },
        example: { r: "3", l: "5" },
      },
      {
        id: "cone-cut", name: "Radius of a slice cut from a cone", eq: "r = Rh/H", find: "r",
        letters: { r: "the radius of the slice", R: "the radius of the base", h: "the height of the small cone", H: "the height of the whole cone" },
        example: { R: "9", h: "2", H: "6" },
      },
      {
        id: "frustum-slant", name: "Slant height of a frustum", eq: "l = sqrt(h^2 + (R - r)^2)", find: "l",
        letters: { l: "the slant height", h: "the height", R: "the bigger radius", r: "the smaller radius" },
        example: { h: "4", R: "6", r: "3" },
      },
      {
        id: "frustum-lateral", name: "Curved surface of a frustum", eq: "A = π(R + r)l", find: "A",
        letters: { A: "the curved area", R: "the bigger radius", r: "the smaller radius", l: "the slant height" },
        example: { R: "4", r: "3", l: "5" },
      },
      {
        id: "frustum-total", name: "Total surface of a frustum", eq: "A = π((R + r)l + R^2 + r^2)", find: "A",
        letters: { A: "the total area", R: "the bigger radius", r: "the smaller radius", l: "the slant height" },
        example: { R: "4", r: "3", l: "5" },
      },
      {
        id: "pyramid-lateral", name: "Sloping faces of a regular pyramid", eq: "L = Pl/2", find: "L",
        letters: { L: "the area of the sloping faces", P: "the perimeter of the base", l: "the slant height" },
        example: { P: "24", l: "5" },
      },
      {
        id: "pyramid-surface", name: "Surface area of a regular pyramid", eq: "A = B + Pl/2", find: "A",
        letters: { A: "the total area", B: "the area of the base", P: "the perimeter of the base", l: "the slant height" },
        example: { B: "36", P: "24", l: "5" },
      },
      {
        id: "pyramid-slant", name: "Slant height of a square-based pyramid", eq: "l = sqrt(h^2 + (a/2)^2)", find: "l",
        letters: { l: "the slant height", h: "the height", a: "the side of the base" },
        example: { h: "4", a: "6" },
      },
      {
        id: "pyramid-edge", name: "Sloping edge of a square-based pyramid", eq: "k = sqrt(h^2 + a^2/2)", find: "k",
        letters: { k: "the sloping edge", h: "the height", a: "the side of the base" },
        example: { h: "1", a: "4" },
      },
      {
        id: "tetrahedron-volume", name: "Volume of a regular tetrahedron", eq: "V = a^3·sqrt(2)/12", find: "V",
        letters: { V: "the volume", a: "the edge" },
        example: { a: "6" },
      },
      {
        id: "tetrahedron-surface", name: "Surface area of a regular tetrahedron", eq: "A = sqrt(3)a^2", find: "A",
        letters: { A: "the area", a: "the edge" },
        example: { a: "2" },
      },
      {
        id: "tetrahedron-height", name: "Height of a regular tetrahedron", eq: "h = a·sqrt(6)/3", find: "h",
        letters: { h: "the height", a: "the edge" },
        example: { a: "3" },
      },
      {
        id: "octahedron-volume", name: "Volume of a regular octahedron", eq: "V = sqrt(2)a^3/3", find: "V",
        letters: { V: "the volume", a: "the edge" },
        example: { a: "3" },
      },
      {
        id: "octahedron-surface", name: "Surface area of a regular octahedron", eq: "A = 2sqrt(3)a^2", find: "A",
        letters: { A: "the area", a: "the edge" },
        example: { a: "2" },
      },
      {
        id: "icosahedron-volume", name: "Volume of a regular icosahedron", eq: "V = 5(3 + sqrt(5))a^3/12", find: "V",
        letters: { V: "the volume", a: "the edge" },
        example: { a: "2" },
      },
      {
        id: "icosahedron-surface", name: "Surface area of a regular icosahedron", eq: "A = 5sqrt(3)a^2", find: "A",
        letters: { A: "the area", a: "the edge" },
        example: { a: "2" },
      },
      {
        id: "dodecahedron-volume", name: "Volume of a regular dodecahedron", eq: "V = (15 + 7sqrt(5))a^3/4", find: "V",
        letters: { V: "the volume", a: "the edge" },
        example: { a: "2" },
      },
      {
        id: "dodecahedron-surface", name: "Surface area of a regular dodecahedron", eq: "A = 3sqrt(25 + 10sqrt(5))a^2", find: "A",
        letters: { A: "the area", a: "the edge" },
        example: { a: "2" },
      },
      {
        id: "euler-solid", name: "Euler's formula for solids", eq: "F = E - V + 2", find: "F",
        letters: { F: "the faces", E: "the edges", V: "the corners" },
        example: { E: "12", V: "8" },
      },
      {
        id: "cap-volume", name: "Volume of a spherical cap", eq: "V = πh^2(3r - h)/3", find: "V",
        letters: { V: "the volume", h: "the height of the cap", r: "the radius of the sphere" },
        example: { h: "3", r: "7" },
      },
      {
        id: "cap-area", name: "Curved surface of a spherical cap or zone", eq: "A = 2πrh", find: "A",
        letters: { A: "the curved area", r: "the radius of the sphere", h: "the height of the cap or zone" },
        example: { r: "7", h: "3" },
      },
      {
        id: "sphere-sector", name: "Volume of a spherical sector", eq: "V = (2/3)πr^2h", find: "V",
        letters: { V: "the volume", r: "the radius of the sphere", h: "the height of the cap" },
        example: { r: "7", h: "3" },
      },
      {
        id: "torus-volume", name: "Volume of a ring doughnut", eq: "V = 2π^2·Rr^2", find: "V",
        letters: { V: "the volume", R: "the distance from the centre of the hole to the middle of the tube", r: "the radius of the tube" },
        example: { R: "7", r: "1" },
      },
      {
        id: "torus-surface", name: "Surface area of a ring doughnut", eq: "A = 4π^2·Rr", find: "A",
        letters: { A: "the area", R: "the distance from the centre of the hole to the middle of the tube", r: "the radius of the tube" },
        example: { R: "7", r: "1" },
      },
      {
        id: "ellipsoid-volume", name: "Volume of an ellipsoid", eq: "V = (4/3)πabc", find: "V",
        letters: { V: "the volume", a: "the first radius", b: "the second radius", c: "the third radius" },
        example: { a: "7", b: "3", c: "2" },
      },
      {
        id: "paraboloid-volume", name: "Volume of a paraboloid", eq: "V = πr^2h/2", find: "V",
        letters: { V: "the volume", r: "the radius of the top", h: "the height" },
        example: { r: "7", h: "6" },
      },
      {
        id: "capsule-volume", name: "Volume of a capsule", eq: "V = πr^2(h + 4r/3)", find: "V",
        letters: { V: "the volume", r: "the radius", h: "the length of the straight part" },
        example: { r: "7", h: "10" },
      },
      {
        id: "pappus-volume", name: "Volume of a solid of revolution (Pappus)", eq: "V = 2πdA", find: "V",
        letters: { V: "the volume", d: "the distance of the centre of the shape from the axis", A: "the area of the shape" },
        example: { d: "7", A: "10" },
      },
      {
        id: "pappus-surface", name: "Surface of a solid of revolution (Pappus)", eq: "A = 2πdL", find: "A",
        letters: { A: "the surface area", d: "the distance of the centre of the curve from the axis", L: "the length of the curve" },
        example: { d: "7", L: "10" },
      },
      {
        id: "prismatoid", name: "Volume of a solid from its ends and middle (prismatoid)", eq: "V = h(a + 4m + b)/6", find: "V",
        letters: { V: "the volume", h: "the height", a: "the area of one end", m: "the area of the middle slice", b: "the area of the other end" },
        example: { h: "6", a: "10", m: "12", b: "14" },
      },
      {
        id: "solid-angle", name: "Solid angle", eq: "W = A/r^2", find: "W",
        letters: { W: "the solid angle in steradians", A: "the area on the sphere", r: "the radius" },
        example: { A: "8", r: "2" },
      },
      {
        id: "capacity-litres", name: "Litres in a volume", eq: "L = V/1000", find: "L",
        letters: { L: "the litres", V: "the volume in cubic centimetres" },
        example: { V: "2500" },
      },
      {
        id: "vector-magnitude-3d", name: "Length of a vector in three dimensions", eq: "m = sqrt(a^2 + b^2 + c^2)", find: "m",
        letters: { m: "the length", a: "the x part", b: "the y part", c: "the z part" },
        example: { a: "2", b: "3", c: "6" },
      },
      {
        id: "point-plane-distance", name: "Distance from a point to a plane", eq: "d = (ax + by + cz + q)/sqrt(a^2 + b^2 + c^2)", find: "d",
        letters: { d: "the distance (ignore the sign)", a: "the number in front of x", b: "the number in front of y", c: "the number in front of z", q: "the number on its own", x: "x of the point", y: "y of the point", z: "z of the point" },
        example: { a: "1", b: "2", c: "2", q: "-3", x: "1", y: "1", z: "1" },
      },
    ],
  },
  {
    group: "Biology: cells and microscopes",
    items: [
      {
        id: "magnification-image", name: "Magnification of a drawing or image", eq: "M = I/A", find: "M",
        letters: { M: "the magnification", I: "the size of the image", A: "the real size" },
        example: { I: "60", A: "2" },
      },
      {
        id: "total-magnification", name: "Total magnification of a microscope", eq: "M = ab", find: "M",
        letters: { M: "the total magnification", a: "the eyepiece lens magnification", b: "the objective lens magnification" },
        example: { a: "10", b: "40" },
      },
      {
        id: "field-of-view", name: "Size of an object from the field of view", eq: "s = d/n", find: "s",
        letters: { s: "the size of one object", d: "the diameter of the field of view", n: "how many objects fit across it" },
        example: { d: "4500", n: "30" },
      },
      {
        id: "cube-sa-v", name: "Surface area to volume ratio of a cube-shaped cell", eq: "R = 6/s", find: "R",
        letters: { R: "the surface area to volume ratio", s: "the side" },
        example: { s: "2" },
        note: "the smaller the cell, the bigger the ratio",
      },
      {
        id: "sphere-sa-v", name: "Surface area to volume ratio of a round cell", eq: "R = 3/r", find: "R",
        letters: { R: "the surface area to volume ratio", r: "the radius" },
        example: { r: "3" },
      },
      {
        id: "water-potential", name: "Water potential", eq: "W = s + p", find: "W",
        letters: { W: "the water potential", s: "the solute potential", p: "the pressure potential" },
        example: { s: "-700", p: "300" },
      },
      {
        id: "solute-potential", name: "Solute potential", eq: "S = -nCRT", find: "S",
        letters: { S: "the solute potential", n: "the ions each particle makes", C: "the concentration in moles per litre", R: "the pressure constant", T: "the temperature in kelvin" },
        example: { n: "2", C: "1/10", R: "8", T: "300" },
      },
      {
        id: "mitotic-index", name: "Mitotic index", eq: "M = 100d/N", find: "M",
        letters: { M: "the mitotic index, as a percentage", d: "the cells dividing", N: "the cells counted" },
        example: { d: "12", N: "200" },
      },
      {
        id: "diffusion-rate", name: "Rate of diffusion (Fick's law)", eq: "R = kA(C - c)/d", find: "R",
        letters: { R: "the rate of diffusion", k: "the diffusion constant", A: "the surface area", C: "the higher concentration", c: "the lower concentration", d: "the distance" },
        example: { k: "2", A: "5", C: "10", c: "4", d: "3" },
      },
      {
        id: "michaelis-menten", name: "Rate of an enzyme reaction (Michaelis-Menten)", eq: "v = VS/(K + S)", find: "v",
        letters: { v: "the rate", V: "the greatest rate", S: "the amount of substrate", K: "the substrate amount at half the greatest rate" },
        example: { V: "10", S: "5", K: "5" },
      },
      {
        id: "enzyme-rate", name: "Rate of an enzyme reaction from the time taken", eq: "r = 1/t", find: "r",
        letters: { r: "the rate", t: "the time taken" },
        example: { t: "25" },
      },
      {
        id: "temperature-coefficient", name: "Effect of a 10 degree rise on a reaction (Q10)", eq: "Q = (R/r)^(10/(T - t))", find: "Q",
        letters: { Q: "the temperature coefficient", R: "the rate at the higher temperature", r: "the rate at the lower temperature", T: "the higher temperature", t: "the lower temperature" },
        example: { R: "8", r: "2", T: "30", t: "20" },
      },
      {
        id: "rf-value", name: "Rf value in chromatography", eq: "R = d/D", find: "R",
        letters: { R: "the Rf value", d: "the distance moved by the spot", D: "the distance moved by the solvent" },
        example: { d: "3", D: "12" },
      },
      {
        id: "transpiration-rate", name: "Rate of water loss by a plant", eq: "R = V/(At)", find: "R",
        letters: { R: "the rate of water loss", V: "the volume lost", A: "the leaf area", t: "the time" },
        example: { V: "12", A: "4", t: "3" },
      },
      {
        id: "respiratory-quotient", name: "Respiratory quotient", eq: "Q = c/o", find: "Q",
        letters: { Q: "the respiratory quotient", c: "the carbon dioxide given out", o: "the oxygen taken in" },
        example: { c: "6", o: "6" },
      },
      {
        id: "net-productivity", name: "Net primary productivity", eq: "N = G - R", find: "N",
        letters: { N: "the net productivity", G: "the gross productivity", R: "the energy lost in respiration" },
        example: { G: "900", R: "400" },
      },
    ],
  },
  {
    group: "Biology: growth and populations",
    items: [
      {
        id: "cell-divisions", name: "Cells after some divisions", eq: "N = A·2^n", find: "N",
        letters: { N: "the number of cells", A: "the cells to begin with", n: "the number of divisions" },
        example: { A: "1", n: "10" },
      },
      {
        id: "bacteria-growth", name: "Bacteria after some time", eq: "N = A·2^(t/g)", find: "N",
        letters: { N: "the number of bacteria", A: "the number to begin with", t: "the time", g: "the time for the number to double" },
        example: { A: "100", t: "60", g: "20" },
      },
      {
        id: "generation-time", name: "Generation time", eq: "g = t/n", find: "g",
        letters: { g: "the time for one generation", t: "the total time", n: "the number of generations" },
        example: { t: "120", n: "6" },
      },
      {
        id: "dilution-factor", name: "Concentration after serial dilutions", eq: "C = c/d^k", find: "C",
        letters: { C: "the final concentration", c: "the starting concentration", d: "the dilution factor at each step", k: "the number of steps" },
        example: { c: "1000000", d: "10", k: "4" },
      },
      {
        id: "colony-count", name: "Bacteria in a sample from a plate count", eq: "C = n/(dV)", find: "C",
        letters: { C: "the bacteria in each millilitre", n: "the colonies counted", d: "the dilution (such as 1/1000)", V: "the volume plated in millilitres" },
        example: { n: "150", d: "1/1000", V: "1" },
      },
      {
        id: "mean-density", name: "Mean number in each quadrat", eq: "m = n/q", find: "m",
        letters: { m: "the mean for each quadrat", n: "the total counted", q: "the number of quadrats" },
        example: { n: "84", q: "12" },
      },
      {
        id: "population-estimate", name: "Population estimated from quadrats", eq: "N = dA", find: "N",
        letters: { N: "the estimate for the whole area", d: "the mean density", A: "the whole area" },
        example: { d: "5", A: "200" },
      },
      {
        id: "percentage-cover", name: "Percentage cover", eq: "C = 100a/N", find: "C",
        letters: { C: "the percentage cover", a: "the squares that contain the plant", N: "the squares in the quadrat" },
        example: { a: "36", N: "100" },
      },
      {
        id: "lincoln-index", name: "Capture and recapture (Lincoln index)", eq: "N = ab/c", find: "N",
        letters: { N: "the population estimate", a: "the number marked in the first catch", b: "the number in the second catch", c: "the marked ones in the second catch" },
        example: { a: "50", b: "40", c: "10" },
      },
      {
        id: "simpson-diversity", name: "Simpson's index of diversity", eq: "D = 1 - S/(N(N - 1))", find: "D",
        letters: { D: "the index of diversity", S: "the total of n(n−1) for each species", N: "the total number of organisms" },
        example: { S: "20", N: "10" },
      },
      {
        id: "birth-rate", name: "Birth rate", eq: "B = 1000b/N", find: "B",
        letters: { B: "the births for each 1000 people", b: "the births in a year", N: "the population" },
        example: { b: "45", N: "3000" },
      },
      {
        id: "population-change", name: "Change in a population", eq: "G = (b + i - d - m)/N", find: "G",
        letters: { G: "the growth for each person", b: "the births", i: "the people moving in", d: "the deaths", m: "the people moving out", N: "the population at the start" },
        example: { b: "300", i: "100", d: "200", m: "50", N: "10000" },
      },
      {
        id: "logistic-growth", name: "Logistic growth of a population", eq: "g = rN(K - N)/K", find: "g",
        letters: { g: "the growth in one step", r: "the growth rate", N: "the population now", K: "the carrying capacity" },
        example: { r: "2", N: "50", K: "100" },
      },
    ],
  },
  {
    group: "Biology: genetics and heredity",
    items: [
      {
        id: "hardy-weinberg-q", name: "Hardy-Weinberg: the other allele frequency", eq: "q = 1 - p", find: "q",
        letters: { q: "the frequency of one allele", p: "the frequency of the other" },
        example: { p: "3/10" },
      },
      {
        id: "hardy-weinberg-het", name: "Hardy-Weinberg: carriers in a population", eq: "H = 2pq", find: "H",
        letters: { H: "the share of heterozygous people", p: "the frequency of the dominant allele", q: "the frequency of the recessive allele" },
        example: { p: "3/10", q: "7/10" },
      },
      {
        id: "hardy-weinberg-recessive", name: "Hardy-Weinberg: the recessive allele from those showing the trait", eq: "q = sqrt(f)", find: "q",
        letters: { q: "the frequency of the recessive allele", f: "the share of people with the recessive trait" },
        example: { f: "1/25" },
      },
      {
        id: "allele-frequency", name: "Frequency of an allele from the genotypes", eq: "p = (2a + h)/(2N)", find: "p",
        letters: { p: "the frequency of the allele", a: "the people with two copies", h: "the people with one copy", N: "the people counted" },
        example: { a: "30", h: "40", N: "100" },
      },
      {
        id: "gamete-types", name: "Kinds of gametes", eq: "G = 2^n", find: "G",
        letters: { G: "the kinds of gamete", n: "the gene pairs that are heterozygous" },
        example: { n: "3" },
      },
      {
        id: "genotype-count", name: "Kinds of genotype from several gene pairs", eq: "G = 3^n", find: "G",
        letters: { G: "the kinds of genotype", n: "the gene pairs" },
        example: { n: "3" },
      },
      {
        id: "phenotype-count", name: "Kinds of phenotype from several gene pairs", eq: "P = 2^n", find: "P",
        letters: { P: "the kinds of phenotype", n: "the gene pairs with complete dominance" },
        example: { n: "3" },
      },
      {
        id: "chi-squared", name: "Chi-squared test", eq: "X = (O - E)^2/E", find: "X",
        letters: { X: "the chi-squared contribution of one class", O: "the number observed", E: "the number expected" },
        example: { O: "18", E: "12" },
        note: "add the results for all the classes",
      },
      {
        id: "degrees-of-freedom", name: "Degrees of freedom", eq: "d = n - 1", find: "d",
        letters: { d: "the degrees of freedom", n: "the number of classes" },
        example: { n: "4" },
      },
      {
        id: "recombination", name: "Recombination frequency", eq: "R = 100r/N", find: "R",
        letters: { R: "the recombination frequency, as a percentage", r: "the recombinant offspring", N: "the offspring in all" },
        example: { r: "18", N: "200" },
        note: "one percent is one map unit",
      },
    ],
  },
  {
    group: "Biology: the body",
    items: [
      {
        id: "stroke-volume", name: "Stroke volume", eq: "S = E - s", find: "S",
        letters: { S: "the stroke volume", E: "the volume in the heart before the beat", s: "the volume left after the beat" },
        example: { E: "120", s: "50" },
      },
      {
        id: "ventilation-rate", name: "Minute ventilation", eq: "V = tr", find: "V",
        letters: { V: "the air breathed each minute", t: "the tidal volume", r: "the breaths each minute" },
        example: { t: "500", r: "12" },
      },
      {
        id: "haematocrit", name: "Haematocrit", eq: "H = 100r/t", find: "H",
        letters: { H: "the haematocrit, as a percentage", r: "the volume of red cells", t: "the volume of blood" },
        example: { r: "45", t: "100" },
      },
      {
        id: "mean-cell-volume", name: "Mean corpuscular volume", eq: "M = 10h/n", find: "M",
        letters: { M: "the mean red cell volume", h: "the haematocrit, as a percentage", n: "the red cells in millions for each microlitre" },
        example: { h: "45", n: "5" },
      },
    ],
  },
  {
    group: "Physics: more on motion",
    items: [
      {
        id: "final-position", name: "Distance from the final speed", eq: "s = vt - (1/2)at^2", find: "s",
        letters: { s: "the distance", v: "the final speed", t: "the time", a: "the acceleration" },
        example: { v: "10", t: "4", a: "2" },
      },
      {
        id: "drop-speed", name: "Speed after a drop", eq: "v = sqrt(2gh)", find: "v",
        letters: { v: "the speed", g: "the pull of gravity per kilogram", h: "the height dropped" },
        example: { g: "10", h: "20" },
        note: "also the speed of water leaving a hole in a tank (Torricelli)",
      },
      {
        id: "circular-speed", name: "Speed round a circle", eq: "v = 2πr/T", find: "v",
        letters: { v: "the speed", r: "the radius", T: "the time for one turn" },
        example: { r: "7", T: "11" },
      },
      {
        id: "speed-angular", name: "Speed from the angular speed", eq: "v = rw", find: "v",
        letters: { v: "the speed", r: "the radius", w: "the angular speed" },
        example: { r: "2", w: "5" },
      },
      {
        id: "angular-period", name: "Angular speed from the time for one turn", eq: "w = 2π/T", find: "w",
        letters: { w: "the angular speed", T: "the time for one turn" },
        example: { T: "11" },
      },
      {
        id: "centripetal-acceleration", name: "Acceleration towards the centre", eq: "a = v^2/r", find: "a",
        letters: { a: "the acceleration", v: "the speed", r: "the radius" },
        example: { v: "6", r: "4" },
      },
      {
        id: "centripetal-acceleration-w", name: "Acceleration towards the centre from the angular speed", eq: "a = w^2r", find: "a",
        letters: { a: "the acceleration", w: "the angular speed", r: "the radius" },
        example: { w: "3", r: "2" },
      },
      {
        id: "orbit-period", name: "Time of one orbit", eq: "T = 2πsqrt(r^3/(GM))", find: "T",
        letters: { T: "the time for one orbit", r: "the distance from the centre", G: "the gravitational constant", M: "the mass of the body being orbited" },
        example: { r: "4", G: "2", M: "1" },
      },
      {
        id: "angular-acceleration", name: "Angular acceleration", eq: "a = (w - v)/t", find: "a",
        letters: { a: "the angular acceleration", w: "the final angular speed", v: "the starting angular speed", t: "the time" },
        example: { w: "20", v: "8", t: "3" },
      },
      {
        id: "angular-distance", name: "Angle turned through with a steady angular acceleration", eq: "t = vs + (1/2)as^2", find: "t",
        letters: { t: "the angle turned", v: "the starting angular speed", s: "the time", a: "the angular acceleration" },
        example: { v: "4", s: "3", a: "2" },
      },
    ],
  },
  {
    group: "Physics: more on forces and energy",
    items: [
      {
        id: "friction", name: "Friction", eq: "f = kN", find: "f",
        letters: { f: "the friction force", k: "the coefficient of friction", N: "the push of the surface" },
        example: { k: "2/5", N: "50" },
      },
      {
        id: "slope-along", name: "Pull of gravity along a slope", eq: "F = mg·sin(a°)", find: "F",
        letters: { F: "the force down the slope", m: "the mass", g: "the pull of gravity per kilogram", a: "the angle of the slope in degrees" },
        example: { m: "10", g: "10", a: "30" },
      },
      {
        id: "slope-normal", name: "Push of a slope on an object", eq: "N = mg·cos(a°)", find: "N",
        letters: { N: "the push of the slope", m: "the mass", g: "the pull of gravity per kilogram", a: "the angle of the slope in degrees" },
        example: { m: "10", g: "10", a: "60" },
      },
      {
        id: "slope-acceleration", name: "Acceleration down a rough slope", eq: "a = g·sin(t°) - kg·cos(t°)", find: "a",
        letters: { a: "the acceleration", g: "the pull of gravity per kilogram", t: "the angle of the slope in degrees", k: "the coefficient of friction" },
        example: { g: "10", t: "30", k: "0" },
      },
      {
        id: "lift-weight", name: "Apparent weight in a lift", eq: "W = m(g + a)", find: "W",
        letters: { W: "the weight you feel", m: "the mass", g: "the pull of gravity per kilogram", a: "the acceleration of the lift (negative when going down faster)" },
        example: { m: "60", g: "10", a: "2" },
      },
      {
        id: "atwood", name: "Two masses over a pulley (Atwood machine)", eq: "a = (m - M)g/(m + M)", find: "a",
        letters: { a: "the acceleration", m: "the heavier mass", M: "the lighter mass", g: "the pull of gravity per kilogram" },
        example: { m: "6", M: "4", g: "10" },
      },
      {
        id: "atwood-tension", name: "Tension in an Atwood machine", eq: "T = 2mMg/(m + M)", find: "T",
        letters: { T: "the tension", m: "one mass", M: "the other mass", g: "the pull of gravity per kilogram" },
        example: { m: "6", M: "4", g: "10" },
      },
      {
        id: "drag", name: "Drag on a moving object", eq: "F = (1/2)dCAv^2", find: "F",
        letters: { F: "the drag", d: "the density of the fluid", C: "the drag coefficient", A: "the area facing the flow", v: "the speed" },
        example: { d: "1", C: "1", A: "2", v: "10" },
      },
      {
        id: "momentum-conservation", name: "Conservation of momentum", eq: "mu + MU = mv + MV", find: "v",
        letters: { m: "the first mass", u: "its speed before", v: "its speed after", M: "the second mass", U: "its speed before", V: "its speed after" },
        example: { m: "2", u: "5", M: "3", U: "0", V: "4/3" },
      },
      {
        id: "inelastic-collision", name: "Objects that stick together", eq: "v = (mu + MU)/(m + M)", find: "v",
        letters: { v: "the speed after", m: "the first mass", u: "its speed before", M: "the second mass", U: "its speed before" },
        example: { m: "2", u: "5", M: "3", U: "0" },
      },
      {
        id: "restitution", name: "Coefficient of restitution", eq: "r = (V - v)/(u - U)", find: "r",
        letters: { r: "the coefficient of restitution", v: "the first speed after", V: "the second speed after", u: "the first speed before", U: "the second speed before" },
        example: { v: "-1", V: "2", u: "3", U: "0" },
      },
      {
        id: "centre-of-mass", name: "Centre of mass of two objects", eq: "x = (ma + Mb)/(m + M)", find: "x",
        letters: { x: "the position of the centre of mass", m: "the first mass", a: "its position", M: "the second mass", b: "its position" },
        example: { m: "2", a: "0", M: "3", b: "10" },
      },
      {
        id: "inertia-point", name: "Moment of inertia of a point mass", eq: "I = mr^2", find: "I",
        letters: { I: "the moment of inertia", m: "the mass", r: "the distance from the axis" },
        example: { m: "3", r: "2" },
      },
      {
        id: "inertia-rod", name: "Moment of inertia of a rod about its middle", eq: "I = ML^2/12", find: "I",
        letters: { I: "the moment of inertia", M: "the mass", L: "the length" },
        example: { M: "3", L: "4" },
      },
      {
        id: "inertia-disc", name: "Moment of inertia of a disc", eq: "I = MR^2/2", find: "I",
        letters: { I: "the moment of inertia", M: "the mass", R: "the radius" },
        example: { M: "4", R: "3" },
      },
      {
        id: "inertia-sphere", name: "Moment of inertia of a solid sphere", eq: "I = 2MR^2/5", find: "I",
        letters: { I: "the moment of inertia", M: "the mass", R: "the radius" },
        example: { M: "5", R: "2" },
      },
      {
        id: "torque-inertia", name: "Torque and angular acceleration", eq: "T = Ia", find: "T",
        letters: { T: "the torque", I: "the moment of inertia", a: "the angular acceleration" },
        example: { I: "4", a: "3" },
      },
      {
        id: "angular-momentum", name: "Angular momentum", eq: "L = Iw", find: "L",
        letters: { L: "the angular momentum", I: "the moment of inertia", w: "the angular speed" },
        example: { I: "4", w: "5" },
      },
      {
        id: "angular-momentum-orbit", name: "Angular momentum of a moving mass", eq: "L = mvr", find: "L",
        letters: { L: "the angular momentum", m: "the mass", v: "the speed", r: "the distance from the centre" },
        example: { m: "2", v: "3", r: "4" },
      },
      {
        id: "work-energy", name: "Work and change of speed", eq: "W = (1/2)m(v^2 - u^2)", find: "W",
        letters: { W: "the work done", m: "the mass", v: "the final speed", u: "the starting speed" },
        example: { m: "4", v: "6", u: "2" },
      },
      {
        id: "work-angle", name: "Work done by a force at an angle", eq: "W = Fd·cos(a°)", find: "W",
        letters: { W: "the work done", F: "the force", d: "the distance moved", a: "the angle between the force and the movement in degrees" },
        example: { F: "10", d: "5", a: "60" },
      },
      {
        id: "power-speed", name: "Power from force and speed", eq: "P = Fv", find: "P",
        letters: { P: "the power", F: "the force", v: "the speed" },
        example: { F: "200", v: "15" },
      },
      {
        id: "spring-energy", name: "Energy stored in a spring", eq: "E = (1/2)kx^2", find: "E",
        letters: { E: "the energy stored", k: "the spring constant", x: "the stretch" },
        example: { k: "50", x: "0.4" },
      },
      {
        id: "gravitational-energy", name: "Gravitational potential energy between two masses", eq: "U = -GMm/r", find: "U",
        letters: { U: "the potential energy", G: "the gravitational constant", M: "one mass", m: "the other mass", r: "the distance between them" },
        example: { G: "2", M: "3", m: "4", r: "6" },
      },
      {
        id: "gravitational-potential", name: "Gravitational potential", eq: "V = -GM/r", find: "V",
        letters: { V: "the gravitational potential", G: "the gravitational constant", M: "the mass", r: "the distance from its centre" },
        example: { G: "2", M: "3", r: "6" },
      },
    ],
  },
  {
    group: "Physics: oscillations and fluids",
    items: [
      {
        id: "spring-period", name: "Time for a mass on a spring to swing once", eq: "T = 2πsqrt(m/k)", find: "T",
        letters: { T: "the period", m: "the mass", k: "the spring constant" },
        example: { m: "1", k: "4" },
      },
      {
        id: "pendulum", name: "Time for a pendulum to swing once", eq: "T = 2πsqrt(L/g)", find: "T",
        letters: { T: "the period", L: "the length of the pendulum", g: "the pull of gravity per kilogram" },
        example: { L: "1", g: "4" },
      },
      {
        id: "shm-acceleration", name: "Acceleration in simple harmonic motion", eq: "a = -w^2x", find: "a",
        letters: { a: "the acceleration", w: "the angular frequency", x: "the displacement" },
        example: { w: "3", x: "2" },
      },
      {
        id: "shm-speed", name: "Speed in simple harmonic motion", eq: "v = w·sqrt(A^2 - x^2)", find: "v",
        letters: { v: "the speed", w: "the angular frequency", A: "the amplitude", x: "the displacement" },
        example: { w: "2", A: "5", x: "3" },
      },
      {
        id: "shm-energy", name: "Total energy in simple harmonic motion", eq: "E = (1/2)kA^2", find: "E",
        letters: { E: "the total energy", k: "the spring constant", A: "the amplitude" },
        example: { k: "50", A: "0.4" },
      },
      {
        id: "buoyancy", name: "Upthrust on a floating or sunk object", eq: "F = dVg", find: "F",
        letters: { F: "the upthrust", d: "the density of the fluid", V: "the volume of fluid pushed aside", g: "the pull of gravity per kilogram" },
        example: { d: "1000", V: "0.002", g: "10" },
      },
      {
        id: "continuity", name: "Flow through a pipe that changes width", eq: "Av = aV", find: "v",
        letters: { A: "the area of the wide part", v: "the speed in it", a: "the area of the narrow part", V: "the speed in it" },
        example: { A: "8", a: "2", V: "12" },
      },
      {
        id: "bernoulli", name: "Bernoulli's equation", eq: "P + (1/2)dv^2 + dgh = Q + (1/2)dw^2 + dgk", find: "Q",
        letters: { P: "the pressure at the first place", v: "the speed there", h: "the height there", Q: "the pressure at the second place", w: "the speed there", k: "the height there", d: "the density", g: "the pull of gravity per kilogram" },
        example: { P: "100", d: "1", v: "2", h: "0", w: "4", g: "10", k: "0" },
      },
      {
        id: "surface-tension", name: "Surface tension", eq: "T = F/L", find: "T",
        letters: { T: "the surface tension", F: "the force", L: "the length of the edge" },
        example: { F: "0.06", L: "2" },
      },
      {
        id: "capillary-rise", name: "Rise of liquid in a thin tube", eq: "h = 2T·cos(a°)/(dgr)", find: "h",
        letters: { h: "the height risen", T: "the surface tension", a: "the contact angle in degrees", d: "the density", g: "the pull of gravity per kilogram", r: "the radius of the tube" },
        example: { T: "0.07", a: "0", d: "1000", g: "10", r: "0.001" },
      },
      {
        id: "stokes-drag", name: "Drag on a small sphere in a thick fluid (Stokes)", eq: "F = 6πnrv", find: "F",
        letters: { F: "the drag", n: "the viscosity", r: "the radius of the sphere", v: "the speed" },
        example: { n: "7", r: "2", v: "3" },
      },
    ],
  },
  {
    group: "Physics: heat and thermodynamics",
    items: [
      {
        id: "first-law", name: "First law of thermodynamics", eq: "U = Q - W", find: "U",
        letters: { U: "the change in internal energy", Q: "the heat added", W: "the work done by the gas" },
        example: { Q: "500", W: "200" },
      },
      {
        id: "kelvin", name: "Kelvin from Celsius", eq: "K = C + 273", find: "K",
        letters: { K: "the temperature in kelvin", C: "the temperature in degrees Celsius" },
        example: { C: "27" },
      },
      {
        id: "gas-energy", name: "Energy of a gas particle", eq: "E = (3/2)kT", find: "E",
        letters: { E: "the average energy of a particle", k: "the Boltzmann constant", T: "the temperature in kelvin" },
        example: { k: "2", T: "300" },
      },
      {
        id: "rms-speed", name: "Typical speed of gas particles", eq: "v = sqrt(3RT/M)", find: "v",
        letters: { v: "the root mean square speed", R: "the gas constant", T: "the temperature in kelvin", M: "the molar mass" },
        example: { R: "8", T: "300", M: "2" },
      },
      {
        id: "entropy-change", name: "Change of entropy", eq: "S = Q/T", find: "S",
        letters: { S: "the change in entropy", Q: "the heat moved", T: "the temperature in kelvin" },
        example: { Q: "600", T: "300" },
      },
      {
        id: "stefan-boltzmann", name: "Power radiated by a hot object", eq: "P = sAT^4", find: "P",
        letters: { P: "the power", s: "the Stefan-Boltzmann constant", A: "the surface area", T: "the temperature in kelvin" },
        example: { s: "2", A: "3", T: "10" },
      },
      {
        id: "wien", name: "Wien's law", eq: "wT = b", find: "w",
        letters: { w: "the wavelength of the strongest light", T: "the temperature in kelvin", b: "Wien's constant" },
        example: { T: "3000", b: "3" },
      },
      {
        id: "area-expansion", name: "Expansion of an area", eq: "A = 2aSt", find: "A",
        letters: { A: "the increase in area", a: "the expansion coefficient", S: "the original area", t: "the rise in temperature" },
        example: { a: "0.00002", S: "10", t: "50" },
      },
      {
        id: "volume-expansion", name: "Expansion of a volume", eq: "V = 3aSt", find: "V",
        letters: { V: "the increase in volume", a: "the expansion coefficient", S: "the original volume", t: "the rise in temperature" },
        example: { a: "0.00002", S: "10", t: "50" },
      },
      {
        id: "mixing-temperature", name: "Temperature after mixing (calorimetry)", eq: "T = (mct + MCu)/(mc + MC)", find: "T",
        letters: { T: "the final temperature", m: "the first mass", c: "its specific heat capacity", t: "its temperature", M: "the second mass", C: "its specific heat capacity", u: "its temperature" },
        example: { m: "2", c: "4", t: "80", M: "3", C: "4", u: "20" },
      },
      {
        id: "cop", name: "Coefficient of performance of a refrigerator", eq: "C = Q/W", find: "C",
        letters: { C: "the coefficient of performance", Q: "the heat removed", W: "the work put in" },
        example: { Q: "600", W: "200" },
      },
    ],
  },
  {
    group: "Physics: waves, sound and light",
    items: [
      {
        id: "doppler", name: "Doppler effect for a moving source and listener", eq: "f = F(v + o)/(v - s)", find: "f",
        letters: { f: "the frequency heard", F: "the frequency made", v: "the speed of sound", o: "the speed of the listener towards the source", s: "the speed of the source towards the listener" },
        example: { F: "400", v: "340", o: "0", s: "20" },
      },
      {
        id: "sound-intensity", name: "Intensity of a sound", eq: "I = P/A", find: "I",
        letters: { I: "the intensity", P: "the power", A: "the area it spreads over" },
        example: { P: "2", A: "4" },
      },
      {
        id: "inverse-square-light", name: "Intensity spreading from a point source", eq: "I = P/(4πr^2)", find: "I",
        letters: { I: "the intensity", P: "the power of the source", r: "the distance from it" },
        example: { P: "88", r: "7" },
      },
      {
        id: "string-wave-speed", name: "Speed of a wave on a string", eq: "v = sqrt(T/m)", find: "v",
        letters: { v: "the wave speed", T: "the tension", m: "the mass of each metre of string" },
        example: { T: "100", m: "4" },
      },
      {
        id: "mirror", name: "Focal length of a curved mirror", eq: "f = R/2", find: "f",
        letters: { f: "the focal length", R: "the radius of curvature" },
        example: { R: "30" },
      },
      {
        id: "lens-maker", name: "Focal length of a lens from its curves", eq: "1/F = (n - 1)(1/a - 1/b)", find: "F",
        letters: { F: "the focal length", n: "the refractive index", a: "the radius of the first surface", b: "the radius of the second surface" },
        example: { n: "3/2", a: "10", b: "-10" },
      },
      {
        id: "critical-angle", name: "Critical angle", eq: "sin(c°) = 1/n", find: "c",
        letters: { c: "the critical angle in degrees", n: "the refractive index" },
        example: { n: "2" },
      },
      {
        id: "light-speed-index", name: "Refractive index from the speed of light", eq: "n = c/v", find: "n",
        letters: { n: "the refractive index", c: "the speed of light in a vacuum", v: "the speed of light in the material" },
        example: { c: "300", v: "200" },
      },
      {
        id: "apparent-depth", name: "Apparent depth", eq: "n = R/A", find: "n",
        letters: { n: "the refractive index", R: "the real depth", A: "the apparent depth" },
        example: { R: "12", A: "9" },
      },
      {
        id: "prism-index", name: "Refractive index from a prism", eq: "n = sin(((a + d)/2)°)/sin((a/2)°)", find: "n",
        letters: { n: "the refractive index", a: "the angle of the prism in degrees", d: "the least deviation in degrees" },
        example: { a: "60", d: "30" },
      },
      {
        id: "double-slit", name: "Fringe spacing in a double-slit experiment", eq: "x = wD/d", find: "x",
        letters: { x: "the fringe spacing", w: "the wavelength", D: "the distance to the screen", d: "the distance between the slits" },
        example: { w: "0.0006", D: "2", d: "0.2" },
      },
      {
        id: "grating", name: "Diffraction grating", eq: "d·sin(t°) = nw", find: "w",
        letters: { d: "the distance between the lines", t: "the angle of the bright line in degrees", n: "the order of the bright line", w: "the wavelength" },
        example: { d: "2", t: "30", n: "2" },
      },
      {
        id: "single-slit", name: "Single slit diffraction", eq: "a·sin(t°) = nw", find: "w",
        letters: { a: "the width of the slit", t: "the angle of the dark line in degrees", n: "the order of the dark line", w: "the wavelength" },
        example: { a: "4", t: "30", n: "1" },
      },
      {
        id: "malus", name: "Light through a second polariser (Malus's law)", eq: "I = J·cos(t°)^2", find: "I",
        letters: { I: "the intensity after", J: "the intensity before", t: "the angle between the polarisers in degrees" },
        example: { J: "80", t: "60" },
      },
      {
        id: "brewster", name: "Brewster's angle", eq: "tan(t°) = n", find: "t",
        letters: { t: "the angle in degrees", n: "the refractive index" },
        example: { n: "1" },
      },
    ],
  },
  {
    group: "Physics: electricity and magnetism",
    items: [
      {
        id: "coulomb", name: "Force between two charges (Coulomb's law)", eq: "F = kQq/r^2", find: "F",
        letters: { F: "the force", k: "Coulomb's constant", Q: "one charge", q: "the other charge", r: "the distance between them" },
        example: { k: "9", Q: "2", q: "3", r: "3" },
      },
      {
        id: "field-force", name: "Electric field strength from the force", eq: "E = F/q", find: "E",
        letters: { E: "the field strength", F: "the force on the charge", q: "the charge" },
        example: { F: "12", q: "3" },
      },
      {
        id: "field-point", name: "Electric field strength of a point charge", eq: "E = kQ/r^2", find: "E",
        letters: { E: "the field strength", k: "Coulomb's constant", Q: "the charge", r: "the distance from it" },
        example: { k: "9", Q: "2", r: "3" },
      },
      {
        id: "field-uniform", name: "Electric field between plates", eq: "E = V/d", find: "E",
        letters: { E: "the field strength", V: "the voltage", d: "the distance between the plates" },
        example: { V: "120", d: "4" },
      },
      {
        id: "potential-point", name: "Electric potential of a point charge", eq: "V = kQ/r", find: "V",
        letters: { V: "the potential", k: "Coulomb's constant", Q: "the charge", r: "the distance from it" },
        example: { k: "9", Q: "2", r: "3" },
      },
      {
        id: "electric-potential-energy", name: "Electric potential energy of two charges", eq: "U = kQq/r", find: "U",
        letters: { U: "the potential energy", k: "Coulomb's constant", Q: "one charge", q: "the other charge", r: "the distance between them" },
        example: { k: "9", Q: "2", q: "3", r: "3" },
      },
      {
        id: "plate-capacitor", name: "Capacitance of two plates", eq: "C = kA/d", find: "C",
        letters: { C: "the capacitance", k: "the permittivity of the material between them", A: "the area of a plate", d: "the gap" },
        example: { k: "2", A: "6", d: "3" },
      },
      {
        id: "capacitors-series", name: "Capacitors in series", eq: "1/C = 1/a + 1/b", find: "C",
        letters: { C: "the total capacitance", a: "the first capacitor", b: "the second capacitor" },
        example: { a: "6", b: "3" },
      },
      {
        id: "capacitors-parallel", name: "Capacitors in parallel", eq: "C = a + b", find: "C",
        letters: { C: "the total capacitance", a: "the first capacitor", b: "the second capacitor" },
        example: { a: "6", b: "3" },
      },
      {
        id: "potential-divider", name: "Potential divider", eq: "V = ER/(R + r)", find: "V",
        letters: { V: "the voltage across R", E: "the supply voltage", R: "the resistor measured across", r: "the other resistor" },
        example: { E: "12", R: "4", r: "2" },
      },
      {
        id: "internal-resistance", name: "Cell with internal resistance", eq: "E = V + Ir", find: "E",
        letters: { E: "the emf of the cell", V: "the voltage at the terminals", I: "the current", r: "the internal resistance" },
        example: { V: "11", I: "2", r: "1/2" },
      },
      {
        id: "cells-series", name: "Cells in series", eq: "E = nc", find: "E",
        letters: { E: "the total emf", n: "the number of cells", c: "the emf of one cell" },
        example: { n: "4", c: "3/2" },
      },
      {
        id: "wheatstone", name: "Wheatstone bridge", eq: "R/S = a/b", find: "R",
        letters: { R: "the unknown resistor", S: "the known resistor", a: "the first ratio arm", b: "the second ratio arm" },
        example: { S: "10", a: "3", b: "6" },
      },
      {
        id: "power-voltage", name: "Electrical power from voltage and resistance", eq: "P = V^2/R", find: "P",
        letters: { P: "the power", V: "the voltage", R: "the resistance" },
        example: { V: "12", R: "6" },
      },
      {
        id: "conductance", name: "Conductance", eq: "G = 1/R", find: "G",
        letters: { G: "the conductance", R: "the resistance" },
        example: { R: "4" },
      },
      {
        id: "resistance-temperature", name: "Resistance as temperature changes", eq: "R = r(1 + at)", find: "R",
        letters: { R: "the new resistance", r: "the resistance at 0 degrees", a: "the temperature coefficient", t: "the temperature" },
        example: { r: "100", a: "0.004", t: "50" },
      },
      {
        id: "drift-current", name: "Current from drifting charges", eq: "I = nAvq", find: "I",
        letters: { I: "the current", n: "the charges in each cubic metre", A: "the cross-section area", v: "the drift speed", q: "the charge on each" },
        example: { n: "10", A: "2", v: "3", q: "4" },
      },
      {
        id: "electric-cost", name: "Cost of using electrical energy", eq: "C = Ptr/1000", find: "C",
        letters: { C: "the cost", P: "the power in watts", t: "the time in hours", r: "the price of a kilowatt-hour" },
        example: { P: "2000", t: "3", r: "50" },
      },
      {
        id: "magnetic-force-charge", name: "Force on a moving charge", eq: "F = qvB·sin(t°)", find: "F",
        letters: { F: "the force", q: "the charge", v: "the speed", B: "the magnetic field", t: "the angle between the speed and the field in degrees" },
        example: { q: "2", v: "5", B: "3", t: "30" },
      },
      {
        id: "magnetic-force-wire", name: "Force on a wire in a magnetic field", eq: "F = BIL·sin(t°)", find: "F",
        letters: { F: "the force", B: "the magnetic field", I: "the current", L: "the length of wire", t: "the angle between the wire and the field in degrees" },
        example: { B: "2", I: "3", L: "4", t: "30" },
      },
      {
        id: "cyclotron-radius", name: "Radius of a charge circling in a magnetic field", eq: "r = mv/(qB)", find: "r",
        letters: { r: "the radius", m: "the mass of the charge", v: "its speed", q: "the charge", B: "the magnetic field" },
        example: { m: "2", v: "6", q: "3", B: "1" },
      },
      {
        id: "wire-field", name: "Magnetic field round a long wire", eq: "B = kI/(2πr)", find: "B",
        letters: { B: "the magnetic field", k: "the permeability", I: "the current", r: "the distance from the wire" },
        example: { k: "2", I: "11", r: "7" },
      },
      {
        id: "solenoid-field", name: "Magnetic field inside a solenoid", eq: "B = knI", find: "B",
        letters: { B: "the magnetic field", k: "the permeability", n: "the turns each metre", I: "the current" },
        example: { k: "2", n: "100", I: "3" },
      },
      {
        id: "magnetic-flux", name: "Magnetic flux", eq: "F = BA·cos(t°)", find: "F",
        letters: { F: "the flux", B: "the magnetic field", A: "the area", t: "the angle between the field and the normal to the area in degrees" },
        example: { B: "2", A: "5", t: "60" },
      },
      {
        id: "faraday-law", name: "Induced emf (Faraday's law)", eq: "E = -Nf/t", find: "E",
        letters: { E: "the induced emf", N: "the turns of the coil", f: "the change in flux", t: "the time it takes" },
        example: { N: "100", f: "0.02", t: "0.5" },
      },
      {
        id: "motional-emf", name: "Emf of a moving wire", eq: "E = Blv", find: "E",
        letters: { E: "the emf", B: "the magnetic field", l: "the length of the wire", v: "the speed" },
        example: { B: "2", l: "3", v: "4" },
      },
      {
        id: "rms-voltage", name: "Root mean square of an alternating voltage", eq: "V = P/sqrt(2)", find: "V",
        letters: { V: "the root mean square voltage", P: "the peak voltage" },
        example: { P: "325" },
      },
      {
        id: "inductor-energy", name: "Energy stored in an inductor", eq: "E = (1/2)LI^2", find: "E",
        letters: { E: "the energy", L: "the inductance", I: "the current" },
        example: { L: "4", I: "3" },
      },
      {
        id: "self-induction", name: "Emf induced in a coil by its own current", eq: "E = -LI/t", find: "E",
        letters: { E: "the induced emf", L: "the inductance", I: "the change in current", t: "the time it takes" },
        example: { L: "2", I: "6", t: "3" },
      },
      {
        id: "inductive-reactance", name: "Reactance of an inductor", eq: "X = 2πfL", find: "X",
        letters: { X: "the reactance", f: "the frequency", L: "the inductance" },
        example: { f: "50", L: "7" },
      },
      {
        id: "capacitive-reactance", name: "Reactance of a capacitor", eq: "X = 1/(2πfC)", find: "X",
        letters: { X: "the reactance", f: "the frequency", C: "the capacitance" },
        example: { f: "7", C: "1/44" },
      },
      {
        id: "impedance", name: "Impedance of a series circuit", eq: "Z = sqrt(R^2 + (X - Y)^2)", find: "Z",
        letters: { Z: "the impedance", R: "the resistance", X: "the inductive reactance", Y: "the capacitive reactance" },
        example: { R: "3", X: "10", Y: "6" },
      },
      {
        id: "resonance", name: "Resonant frequency", eq: "f = 1/(2πsqrt(LC))", find: "f",
        letters: { f: "the resonant frequency", L: "the inductance", C: "the capacitance" },
        example: { L: "1", C: "1/49" },
      },
      {
        id: "time-constant", name: "Time constant of a capacitor circuit", eq: "T = RC", find: "T",
        letters: { T: "the time constant", R: "the resistance", C: "the capacitance" },
        example: { R: "1000", C: "0.002" },
      },
    ],
  },
  {
    group: "Physics: modern physics and astronomy",
    items: [
      {
        id: "photon-energy", name: "Energy of a photon", eq: "E = hf", find: "E",
        letters: { E: "the energy", h: "Planck's constant", f: "the frequency" },
        example: { h: "2", f: "5" },
      },
      {
        id: "photoelectric", name: "Photoelectric effect", eq: "K = hf - p", find: "K",
        letters: { K: "the greatest energy of an electron released", h: "Planck's constant", f: "the frequency of the light", p: "the work function" },
        example: { h: "2", f: "5", p: "3" },
      },
      {
        id: "de-broglie", name: "Wavelength of a moving particle (de Broglie)", eq: "w = h/(mv)", find: "w",
        letters: { w: "the wavelength", h: "Planck's constant", m: "the mass", v: "the speed" },
        example: { h: "6", m: "2", v: "3" },
        note: "also the wavelength of a photon from its momentum",
      },
      {
        id: "photon-momentum-energy", name: "Energy and momentum of a photon", eq: "E = pc", find: "E",
        letters: { E: "the energy", p: "the momentum", c: "the speed of light" },
        example: { p: "2", c: "3" },
      },
      {
        id: "mass-energy", name: "Mass and energy (Einstein)", eq: "E = mc^2", find: "E",
        letters: { E: "the energy", m: "the mass", c: "the speed of light" },
        example: { m: "2", c: "3" },
      },
      {
        id: "hydrogen-level", name: "Energy level of hydrogen", eq: "E = -13.6/n^2", find: "E",
        letters: { E: "the energy in electron-volts", n: "the level" },
        example: { n: "2" },
      },
      {
        id: "rydberg", name: "Wavelengths of hydrogen light (Rydberg)", eq: "1/w = R(1/a^2 - 1/b^2)", find: "w",
        letters: { w: "the wavelength", R: "Rydberg's constant", a: "the lower level", b: "the higher level" },
        example: { R: "1", a: "1", b: "2" },
      },
      {
        id: "mass-number", name: "Mass number of an atom", eq: "A = Z + N", find: "A",
        letters: { A: "the mass number", Z: "the protons", N: "the neutrons" },
        example: { Z: "6", N: "8" },
      },
      {
        id: "decay-constant", name: "Decay constant and half-life", eq: "l = ln(2)/h", find: "l",
        letters: { l: "the decay constant", h: "the half-life" },
        example: { h: "ln(2)/5" },
      },
      {
        id: "activity", name: "Activity of a radioactive sample", eq: "A = lN", find: "A",
        letters: { A: "the decays each second", l: "the decay constant", N: "the number of nuclei" },
        example: { l: "0.01", N: "5000" },
      },
      {
        id: "binding-energy-defect", name: "Binding energy from the mass lost", eq: "B = dc^2", find: "B",
        letters: { B: "the binding energy", d: "the mass defect", c: "the speed of light" },
        example: { d: "2", c: "3" },
      },
      {
        id: "hubble", name: "Hubble's law", eq: "v = Hd", find: "v",
        letters: { v: "the speed a galaxy moves away", H: "Hubble's constant", d: "its distance" },
        example: { H: "70", d: "100" },
      },
      {
        id: "parallax-distance", name: "Distance from parallax", eq: "d = 1/p", find: "d",
        letters: { d: "the distance in parsecs", p: "the parallax angle in arcseconds" },
        example: { p: "1/4" },
      },
      {
        id: "redshift", name: "Redshift", eq: "z = (w - l)/l", find: "z",
        letters: { z: "the redshift", w: "the wavelength observed", l: "the wavelength emitted" },
        example: { w: "660", l: "600" },
      },
      {
        id: "schwarzschild", name: "Radius of a black hole", eq: "r = 2GM/c^2", find: "r",
        letters: { r: "the Schwarzschild radius", G: "the gravitational constant", M: "the mass", c: "the speed of light" },
        example: { G: "3", M: "6", c: "3" },
      },
      {
        id: "luminosity", name: "Luminosity of a star", eq: "L = 4πr^2sT^4", find: "L",
        letters: { L: "the luminosity", r: "the radius of the star", s: "the Stefan-Boltzmann constant", T: "the surface temperature in kelvin" },
        example: { r: "7", s: "1", T: "2" },
      },
      {
        id: "time-dilation", name: "Time dilation", eq: "t = T/sqrt(1 - v^2/c^2)", find: "t",
        letters: { t: "the time for the moving clock", T: "the time for the stationary clock", v: "the speed", c: "the speed of light" },
        example: { T: "3", v: "3", c: "5" },
      },
      {
        id: "length-contraction", name: "Length contraction", eq: "L = l·sqrt(1 - v^2/c^2)", find: "L",
        letters: { L: "the length seen", l: "the length at rest", v: "the speed", c: "the speed of light" },
        example: { l: "10", v: "3", c: "5" },
      },
    ],
  },
  {
    group: "Physics: measurement",
    items: [
      {
        id: "percentage-error", name: "Percentage error", eq: "E = 100d/m", find: "E",
        letters: { E: "the percentage error", d: "the error", m: "the measured value" },
        example: { d: "0.5", m: "20" },
      },
      {
        id: "percentage-uncertainty", name: "Percentage uncertainty", eq: "U = 100u/m", find: "U",
        letters: { U: "the percentage uncertainty", u: "the uncertainty", m: "the measured value" },
        example: { u: "0.2", m: "40" },
      },
      {
        id: "mean-uncertainty-product", name: "Uncertainty of a product or quotient", eq: "U = a + b", find: "U",
        letters: { U: "the percentage uncertainty of the answer", a: "the percentage uncertainty of one value", b: "the percentage uncertainty of the other" },
        example: { a: "2", b: "3" },
        note: "for values that are multiplied or divided",
      },
      {
        id: "power-uncertainty", name: "Uncertainty of a power", eq: "U = nu", find: "U",
        letters: { U: "the percentage uncertainty of the answer", n: "the power", u: "the percentage uncertainty of the value" },
        example: { n: "2", u: "3" },
      },
    ],
  },
  {
    group: "Geometry: triangles",
    items: [
      {
        id: "area-triangle-coordinates", name: "Area of a triangle from its corners", eq: "A = (a(d - q) + c(q - b) + p(b - d))/2", find: "A",
        letters: { A: "the area (take the positive value)", a: "x of the first corner", b: "y of the first corner", c: "x of the second corner", d: "y of the second corner", p: "x of the third corner", q: "y of the third corner" },
        example: { a: "1", b: "1", c: "5", d: "1", p: "1", q: "4" },
      },
    ],
  },
  {
    group: "Geometry: solids",
    items: [
      {
        id: "distance-3d", name: "Distance between two points in space", eq: "D = sqrt((d - a)^2 + (p - b)^2 + (q - c)^2)", find: "D",
        letters: { D: "the distance", a: "x of the first point", b: "y of the first point", c: "z of the first point", d: "x of the second", p: "y of the second", q: "z of the second" },
        example: { a: "1", b: "2", c: "3", d: "3", p: "6", q: "7" },
      },
      {
        id: "vector-dot-3d", name: "Dot product in three dimensions", eq: "D = ad + bp + cq", find: "D",
        letters: { D: "the dot product", a: "x of the first vector", b: "y of the first", c: "z of the first", d: "x of the second", p: "y of the second", q: "z of the second" },
        example: { a: "1", b: "2", c: "3", d: "4", p: "-1", q: "2" },
      },
    ],
  },
  {
    group: "Chemistry: atoms and formulas",
    items: [
      {
        id: "mass-number-neutrons", name: "Neutrons in an atom", eq: "N = A - Z", find: "N",
        letters: { N: "the neutrons", A: "the mass number", Z: "the atomic number" },
        example: { A: "35", Z: "17" },
      },
      {
        id: "relative-atomic-mass", name: "Relative atomic mass from isotopes", eq: "R = (xa + yb)/100", find: "R",
        letters: { R: "the relative atomic mass", x: "the percentage of the first isotope", a: "its mass number", y: "the percentage of the second isotope", b: "its mass number" },
        example: { x: "75", a: "35", y: "25", b: "37" },
      },
      {
        id: "shell-capacity", name: "Electrons in a shell", eq: "S = 2n^2", find: "S",
        letters: { S: "the most electrons the shell holds", n: "the shell number" },
        example: { n: "3" },
      },
      {
        id: "shell-orbitals", name: "Orbitals in a shell", eq: "O = n^2", find: "O",
        letters: { O: "the orbitals in the shell", n: "the shell number" },
        example: { n: "3" },
      },
      {
        id: "subshell-capacity", name: "Electrons in a subshell", eq: "S = 2(2l + 1)", find: "S",
        letters: { S: "the most electrons the subshell holds", l: "0 for s, 1 for p, 2 for d, 3 for f" },
        example: { l: "2" },
      },
      {
        id: "effective-charge", name: "Effective nuclear charge", eq: "Z = A - S", find: "Z",
        letters: { Z: "the effective nuclear charge", A: "the atomic number", S: "the shielding by inner electrons" },
        example: { A: "17", S: "10" },
      },
      {
        id: "relative-formula-mass", name: "Relative formula mass", eq: "M = a + b + c", find: "M",
        letters: { M: "the relative formula mass", a: "the mass of the first part", b: "the mass of the second", c: "the mass of the third" },
        example: { a: "23", b: "35", c: "0" },
        note: "add the mass of every atom in the formula",
      },
      {
        id: "molecular-formula", name: "Molecular formula from the empirical formula", eq: "n = M/E", find: "n",
        letters: { n: "how many times bigger the molecular formula is", M: "the molar mass of the compound", E: "the mass of the empirical formula" },
        example: { M: "180", E: "30" },
      },
      {
        id: "alkane", name: "Hydrogen atoms in an alkane", eq: "H = 2n + 2", find: "H",
        letters: { H: "the hydrogen atoms", n: "the carbon atoms" },
        example: { n: "6" },
      },
      {
        id: "alkene", name: "Hydrogen atoms in an alkene", eq: "H = 2n", find: "H",
        letters: { H: "the hydrogen atoms", n: "the carbon atoms" },
        example: { n: "6" },
      },
      {
        id: "alkyne", name: "Hydrogen atoms in an alkyne", eq: "H = 2n - 2", find: "H",
        letters: { H: "the hydrogen atoms", n: "the carbon atoms" },
        example: { n: "6" },
      },
      {
        id: "alkane-oxygen", name: "Oxygen needed to burn an alkane", eq: "O = (3n + 1)/2", find: "O",
        letters: { O: "the moles of oxygen for one mole of alkane", n: "the carbon atoms" },
        example: { n: "3" },
      },
      {
        id: "unsaturation", name: "Degrees of unsaturation", eq: "D = (2C + 2 + N - H - X)/2", find: "D",
        letters: { D: "the degrees of unsaturation", C: "the carbon atoms", N: "the nitrogen atoms", H: "the hydrogen atoms", X: "the halogen atoms" },
        example: { C: "6", N: "0", H: "6", X: "0" },
      },
    ],
  },
  {
    group: "Chemistry: amounts and concentrations",
    items: [
      {
        id: "molarity-mass", name: "Molarity from a mass", eq: "C = m/(MV)", find: "C",
        letters: { C: "the concentration in moles per litre", m: "the mass dissolved", M: "the molar mass", V: "the volume in litres" },
        example: { m: "40", M: "40", V: "2" },
      },
      {
        id: "mass-percent-solution", name: "Percentage of a solution by mass", eq: "P = 100m/T", find: "P",
        letters: { P: "the percentage by mass", m: "the mass of the solute", T: "the mass of the whole solution" },
        example: { m: "15", T: "200" },
      },
      {
        id: "ppm", name: "Parts per million", eq: "P = 1000000a/b", find: "P",
        letters: { P: "the parts per million", a: "the mass of the substance", b: "the mass of the sample" },
        example: { a: "3", b: "2000000" },
      },
      {
        id: "molality", name: "Molality", eq: "b = n/w", find: "b",
        letters: { b: "the molality", n: "the moles of solute", w: "the kilograms of solvent" },
        example: { n: "2", w: "4" },
      },
      {
        id: "mole-fraction", name: "Mole fraction", eq: "X = a/(a + b)", find: "X",
        letters: { X: "the mole fraction of the first substance", a: "its moles", b: "the moles of the others" },
        example: { a: "2", b: "6" },
      },
      {
        id: "normality", name: "Normality", eq: "N = Cz", find: "N",
        letters: { N: "the normality", C: "the concentration in moles per litre", z: "the equivalents in one mole" },
        example: { C: "0.5", z: "2" },
      },
      {
        id: "titration", name: "Titration of two solutions", eq: "CV/a = cv/b", find: "c",
        letters: { C: "the concentration of the first solution", V: "its volume", a: "its moles in the equation", c: "the concentration of the second solution", v: "its volume", b: "its moles in the equation" },
        example: { C: "0.1", V: "25", a: "1", v: "20", b: "2" },
      },
      {
        id: "mixing-concentration", name: "Concentration of two solutions mixed", eq: "C = (aV + bv)/(V + v)", find: "C",
        letters: { C: "the concentration of the mixture", a: "the concentration of the first solution", V: "its volume", b: "the concentration of the second", v: "its volume" },
        example: { a: "2", V: "100", b: "1", v: "300" },
      },
      {
        id: "molarity-percent", name: "Molarity from a percentage and a density", eq: "C = 10dP/M", find: "C",
        letters: { C: "the concentration in moles per litre", d: "the density in grams for each millilitre", P: "the percentage by mass", M: "the molar mass" },
        example: { d: "6/5", P: "20", M: "40" },
      },
      {
        id: "density-specific", name: "Specific gravity", eq: "S = d/w", find: "S",
        letters: { S: "the specific gravity", d: "the density of the substance", w: "the density of water" },
        example: { d: "13.6", w: "1" },
      },
      {
        id: "atom-economy", name: "Atom economy", eq: "A = 100m/M", find: "A",
        letters: { A: "the atom economy, as a percentage", m: "the mass of the product wanted", M: "the mass of all the products" },
        example: { m: "44", M: "80" },
      },
      {
        id: "purity", name: "Percentage purity", eq: "P = 100a/b", find: "P",
        letters: { P: "the percentage purity", a: "the mass of pure substance", b: "the mass of the sample" },
        example: { a: "18", b: "20" },
      },
    ],
  },
  {
    group: "Chemistry: gases and solutions",
    items: [
      {
        id: "dalton", name: "Total pressure of a gas mixture (Dalton)", eq: "P = a + b + c", find: "P",
        letters: { P: "the total pressure", a: "the pressure of the first gas", b: "the pressure of the second", c: "the pressure of the third" },
        example: { a: "20", b: "30", c: "50" },
      },
      {
        id: "partial-pressure", name: "Partial pressure of one gas", eq: "p = xP", find: "p",
        letters: { p: "the partial pressure", x: "the mole fraction of the gas", P: "the total pressure" },
        example: { x: "1/5", P: "100" },
      },
      {
        id: "graham", name: "Graham's law of effusion", eq: "a/b = sqrt(M/m)", find: "a",
        letters: { a: "the speed of the lighter gas", b: "the speed of the heavier gas", M: "the molar mass of the heavier gas", m: "the molar mass of the lighter gas" },
        example: { b: "1", M: "16", m: "4" },
      },
      {
        id: "avogadro-law", name: "Avogadro's law", eq: "V/n = v/m", find: "V",
        letters: { V: "the first volume", n: "its moles", v: "the second volume", m: "its moles" },
        example: { n: "2", v: "12", m: "3" },
      },
      {
        id: "gas-density", name: "Density of a gas", eq: "d = PM/(RT)", find: "d",
        letters: { d: "the density", P: "the pressure", M: "the molar mass", R: "the gas constant", T: "the temperature in kelvin" },
        example: { P: "100", M: "32", R: "8", T: "400" },
      },
      {
        id: "van-der-waals", name: "Pressure of a real gas (van der Waals)", eq: "P = nRT/(V - nb) - an^2/V^2", find: "P",
        letters: { P: "the pressure", n: "the moles", R: "the gas constant", T: "the temperature in kelvin", V: "the volume", a: "the attraction constant", b: "the size constant" },
        example: { n: "1", R: "8", T: "300", V: "10", a: "0", b: "0" },
      },
      {
        id: "raoult", name: "Vapour pressure of a solution (Raoult's law)", eq: "P = xp", find: "P",
        letters: { P: "the vapour pressure of the solution", x: "the mole fraction of the solvent", p: "the vapour pressure of the pure solvent" },
        example: { x: "9/10", p: "100" },
      },
      {
        id: "boiling-elevation", name: "Rise in boiling point", eq: "T = kmi", find: "T",
        letters: { T: "the rise in boiling point", k: "the boiling point constant", m: "the molality", i: "the particles each unit makes" },
        example: { k: "1/2", m: "2", i: "2" },
      },
      {
        id: "freezing-depression", name: "Fall in freezing point", eq: "T = kmi", find: "T",
        letters: { T: "the fall in freezing point", k: "the freezing point constant", m: "the molality", i: "the particles each unit makes" },
        example: { k: "2", m: "1", i: "3" },
      },
      {
        id: "osmotic-pressure", name: "Osmotic pressure", eq: "P = iCRT", find: "P",
        letters: { P: "the osmotic pressure", i: "the particles each unit makes", C: "the concentration in moles per litre", R: "the gas constant", T: "the temperature in kelvin" },
        example: { i: "2", C: "1/10", R: "8", T: "300" },
      },
      {
        id: "henry", name: "Gas dissolving in a liquid (Henry's law)", eq: "C = kP", find: "C",
        letters: { C: "the concentration of the dissolved gas", k: "Henry's constant", P: "the pressure of the gas" },
        example: { k: "2", P: "5" },
      },
      {
        id: "beer-lambert", name: "Light absorbed by a solution (Beer-Lambert law)", eq: "A = klc", find: "A",
        letters: { A: "the absorbance", k: "the absorption constant", l: "the path length", c: "the concentration" },
        example: { k: "2", l: "1", c: "3/10" },
      },
      {
        id: "absorbance-transmittance", name: "Absorbance from transmittance", eq: "A = -log_10(T)", find: "A",
        letters: { A: "the absorbance", T: "the share of light let through" },
        example: { T: "1/100" },
      },
      {
        id: "unit-cell-density", name: "Density of a crystal from its unit cell", eq: "d = ZM/(a^3N)", find: "d",
        letters: { d: "the density", Z: "the atoms in one unit cell", M: "the molar mass", a: "the edge of the cell", N: "Avogadro's constant" },
        example: { Z: "4", M: "60", a: "2", N: "10" },
      },
    ],
  },
  {
    group: "Chemistry: energy and rates",
    items: [
      {
        id: "hess", name: "Hess's law", eq: "H = P - R", find: "H",
        letters: { H: "the enthalpy change of the reaction", P: "the total for the products", R: "the total for the reactants" },
        example: { P: "-800", R: "-300" },
      },
      {
        id: "bond-enthalpy", name: "Enthalpy change from bond energies", eq: "H = B - M", find: "H",
        letters: { H: "the enthalpy change", B: "the energy to break the bonds", M: "the energy given out making the bonds" },
        example: { B: "2000", M: "2500" },
      },
      {
        id: "gibbs", name: "Gibbs free energy", eq: "G = H - TS", find: "G",
        letters: { G: "the free energy change", H: "the enthalpy change", T: "the temperature in kelvin", S: "the entropy change" },
        example: { H: "-100", T: "300", S: "0.2" },
        note: "a reaction can happen by itself when this is negative",
      },
      {
        id: "entropy-reaction", name: "Entropy change of a reaction", eq: "S = P - R", find: "S",
        letters: { S: "the entropy change", P: "the total entropy of the products", R: "the total entropy of the reactants" },
        example: { P: "200", R: "150" },
      },
      {
        id: "rate-law", name: "Rate law", eq: "r = kA^mB^n", find: "r",
        letters: { r: "the rate", k: "the rate constant", A: "the concentration of the first substance", m: "its order", B: "the concentration of the second", n: "its order" },
        example: { k: "2", A: "3", m: "2", B: "2", n: "1" },
      },
      {
        id: "first-order-half-life", name: "Half-life of a first-order reaction", eq: "t = ln(2)/k", find: "t",
        letters: { t: "the half-life", k: "the rate constant" },
        example: { k: "ln(2)/5" },
      },
      {
        id: "first-order-time", name: "Time for a first-order reaction", eq: "t = ln(A/B)/k", find: "t",
        letters: { t: "the time", A: "the amount at the start", B: "the amount left", k: "the rate constant" },
        example: { A: "8", B: "1", k: "ln(2)" },
      },
    ],
  },
  {
    group: "Chemistry: equilibrium, acids and bases",
    items: [
      {
        id: "equilibrium-constant", name: "Equilibrium constant", eq: "K = C^cD^d/(A^aB^b)", find: "K",
        letters: { K: "the equilibrium constant", A: "the concentration of the first reactant", a: "its number in the equation", B: "the concentration of the second reactant", b: "its number", C: "the concentration of the first product", c: "its number", D: "the concentration of the second product", d: "its number" },
        example: { A: "2", a: "1", B: "1", b: "1", C: "4", c: "1", D: "2", d: "1" },
      },
      {
        id: "pressure-constant", name: "Equilibrium constant with pressures", eq: "K = k(RT)^n", find: "K",
        letters: { K: "the pressure constant", k: "the concentration constant", R: "the gas constant", T: "the temperature in kelvin", n: "the change in moles of gas" },
        example: { k: "2", R: "1/2", T: "4", n: "2" },
      },
      {
        id: "solubility-product-1", name: "Solubility product for a salt such as AgCl", eq: "K = s^2", find: "K",
        letters: { K: "the solubility product", s: "the solubility in moles per litre" },
        example: { s: "3" },
      },
      {
        id: "solubility-product-2", name: "Solubility product for a salt such as CaF2", eq: "K = 4s^3", find: "K",
        letters: { K: "the solubility product", s: "the solubility in moles per litre" },
        example: { s: "2" },
      },
      {
        id: "solubility-product-general", name: "Solubility product in general", eq: "K = a^a·b^b·s^(a + b)", find: "K",
        letters: { K: "the solubility product", a: "the ions of the first kind in the formula", b: "the ions of the second kind", s: "the solubility in moles per litre" },
        example: { a: "1", b: "2", s: "2" },
      },
      {
        id: "poh", name: "pOH", eq: "p = -log_10(O)", find: "p",
        letters: { p: "the pOH", O: "the hydroxide concentration in moles per litre" },
        example: { O: "1/1000" },
      },
      {
        id: "ph-poh", name: "pH and pOH", eq: "p + q = 14", find: "q",
        letters: { p: "the pH", q: "the pOH" },
        example: { p: "3" },
        note: "at 25 degrees",
      },
      {
        id: "weak-acid-ka", name: "Acid dissociation constant", eq: "K = H^2/C", find: "K",
        letters: { K: "the acid dissociation constant", H: "the hydrogen ion concentration", C: "the acid concentration" },
        example: { H: "1/100", C: "1" },
      },
      {
        id: "weak-acid-h", name: "Hydrogen ions from a weak acid", eq: "H = sqrt(KC)", find: "H",
        letters: { H: "the hydrogen ion concentration", K: "the acid dissociation constant", C: "the acid concentration" },
        example: { K: "1/10000", C: "1" },
      },
      {
        id: "pka", name: "pKa", eq: "p = -log_10(K)", find: "p",
        letters: { p: "the pKa", K: "the acid dissociation constant" },
        example: { K: "1/100000" },
      },
      {
        id: "henderson", name: "Buffer pH (Henderson-Hasselbalch)", eq: "P = k + log_10(b/a)", find: "P",
        letters: { P: "the pH", k: "the pKa", b: "the concentration of the base", a: "the concentration of the acid" },
        example: { k: "5", b: "10", a: "1" },
      },
      {
        id: "ostwald", name: "Degree of dissociation (Ostwald's dilution law)", eq: "d = sqrt(K/C)", find: "d",
        letters: { d: "the degree of dissociation", K: "the dissociation constant", C: "the concentration" },
        example: { K: "1/10000", C: "1" },
      },
    ],
  },
  {
    group: "Chemistry: electrochemistry",
    items: [
      {
        id: "cell-potential", name: "Cell potential", eq: "E = R - L", find: "E",
        letters: { E: "the cell potential", R: "the potential of the cathode", L: "the potential of the anode" },
        example: { R: "0.34", L: "-0.76" },
      },
      {
        id: "nernst", name: "Cell potential away from standard conditions (Nernst)", eq: "E = f - (0.0592/n)log_10(Q)", find: "E",
        letters: { E: "the cell potential", f: "the standard cell potential", n: "the electrons transferred", Q: "the reaction quotient" },
        example: { f: "1.1", n: "2", Q: "100" },
      },
      {
        id: "gibbs-cell", name: "Free energy of a cell reaction", eq: "G = -nFE", find: "G",
        letters: { G: "the free energy change", n: "the electrons transferred", F: "Faraday's constant", E: "the cell potential" },
        example: { n: "2", F: "96500", E: "1.1" },
      },
      {
        id: "electron-moles", name: "Moles of electrons in electrolysis", eq: "n = Q/F", find: "n",
        letters: { n: "the moles of electrons", Q: "the charge passed", F: "Faraday's constant" },
        example: { Q: "9650", F: "96500" },
      },
      {
        id: "equilibrium-cell", name: "Equilibrium constant from the cell potential", eq: "log_10(K) = nE/0.0592", find: "K",
        letters: { K: "the equilibrium constant", n: "the electrons transferred", E: "the standard cell potential" },
        example: { n: "2", E: "0.0592" },
      },
    ],
  },
  {
    group: "Chemistry: equilibrium, acids and bases",
    items: [
      {
        id: "water-product", name: "Ionic product of water", eq: "O = 1/(10^14H)", find: "O",
        letters: { H: "the hydrogen ion concentration", O: "the hydroxide ion concentration" },
        example: { H: "1/1000000" },
        note: "the two concentrations multiply to 10 to the power −14 at 25 degrees",
      },
    ],
  },
  {
    group: "Organic chemistry: formulas and masses",
    items: [
      {
        id: "haloalkane", name: "Hydrogen atoms in a haloalkane", eq: "H = 2n + 1", find: "H",
        letters: { H: "the hydrogen atoms", n: "the carbon atoms" },
        example: { n: "4" },
        note: "one halogen atom takes the place of one hydrogen of the alkane",
      },
      {
        id: "amine", name: "Hydrogen atoms in a primary amine", eq: "H = 2n + 3", find: "H",
        letters: { H: "the hydrogen atoms", n: "the carbon atoms" },
        example: { n: "3" },
      },
      {
        id: "alkane-bonds", name: "Bonds in an alkane", eq: "B = 3n + 1", find: "B",
        letters: { B: "the bonds in all", n: "the carbon atoms" },
        example: { n: "3" },
      },
      {
        id: "alkane-mass", name: "Molar mass of an alkane", eq: "M = 14n + 2", find: "M",
        letters: { M: "the molar mass", n: "the carbon atoms" },
        example: { n: "5" },
      },
      {
        id: "alkene-mass", name: "Molar mass of an alkene", eq: "M = 14n", find: "M",
        letters: { M: "the molar mass", n: "the carbon atoms" },
        example: { n: "4" },
      },
      {
        id: "alkyne-mass", name: "Molar mass of an alkyne", eq: "M = 14n - 2", find: "M",
        letters: { M: "the molar mass", n: "the carbon atoms" },
        example: { n: "3" },
      },
      {
        id: "alcohol-mass", name: "Molar mass of an alcohol", eq: "M = 14n + 18", find: "M",
        letters: { M: "the molar mass", n: "the carbon atoms" },
        example: { n: "2" },
      },
      {
        id: "acid-mass", name: "Molar mass of a carboxylic acid", eq: "M = 14n + 32", find: "M",
        letters: { M: "the molar mass", n: "the carbon atoms" },
        example: { n: "2" },
      },
      {
        id: "hydrocarbon-oxygen", name: "Oxygen needed to burn a hydrocarbon CxHy", eq: "O = x + y/4", find: "O",
        letters: { O: "the moles of oxygen for one mole", x: "the carbon atoms", y: "the hydrogen atoms" },
        example: { x: "3", y: "8" },
      },
      {
        id: "hydrocarbon-water", name: "Water made by burning a hydrocarbon CxHy", eq: "W = y/2", find: "W",
        letters: { W: "the moles of water for one mole", y: "the hydrogen atoms" },
        example: { y: "8" },
        note: "the moles of carbon dioxide are x",
      },
      {
        id: "oxygenated-oxygen", name: "Oxygen needed to burn CxHyOz", eq: "O = x + y/4 - z/2", find: "O",
        letters: { O: "the moles of oxygen for one mole", x: "the carbon atoms", y: "the hydrogen atoms", z: "the oxygen atoms" },
        example: { x: "2", y: "6", z: "1" },
      },
      {
        id: "combustion-heat", name: "Heat from burning a mass of fuel", eq: "Q = mH/M", find: "Q",
        letters: { Q: "the heat given out", m: "the mass of fuel", H: "the heat given out by one mole", M: "the molar mass" },
        example: { m: "23", H: "1370", M: "46" },
      },
      {
        id: "hydrogenation", name: "Hydrogen needed to saturate a compound", eq: "H = dn", find: "H",
        letters: { H: "the moles of hydrogen", d: "the double bonds in each molecule", n: "the moles of the compound" },
        example: { d: "2", n: "3" },
      },
      {
        id: "iodine-value", name: "Iodine value of a fat or oil", eq: "I = 25380n/M", find: "I",
        letters: { I: "the grams of iodine taken up by 100 g", n: "the double bonds in each molecule", M: "the molar mass" },
        example: { n: "1", M: "282" },
      },
      {
        id: "saponification-value", name: "Saponification value of a fat", eq: "S = 56100n/M", find: "S",
        letters: { S: "the milligrams of potassium hydroxide for 1 g", n: "the ester groups in each molecule", M: "the molar mass" },
        example: { n: "3", M: "561" },
      },
      {
        id: "equivalent-mass", name: "Equivalent mass", eq: "E = M/z", find: "E",
        letters: { E: "the equivalent mass", M: "the molar mass", z: "the reacting units in one mole" },
        example: { M: "98", z: "2" },
      },
    ],
  },
  {
    group: "Organic chemistry: structure and spectra",
    items: [
      {
        id: "stereoisomers", name: "Stereoisomers of a molecule", eq: "S = 2^n", find: "S",
        letters: { S: "the number of stereoisomers", n: "the chiral centres" },
        example: { n: "3" },
      },
      {
        id: "stereoisomers-meso", name: "Stereoisomers when the molecule is symmetrical", eq: "S = 2^(n - 1)", find: "S",
        letters: { S: "the number of stereoisomers", n: "the chiral centres" },
        example: { n: "3" },
        note: "rough guide; some centres may repeat",
      },
      {
        id: "specific-rotation", name: "Specific rotation", eq: "S = a/(lc)", find: "S",
        letters: { S: "the specific rotation", a: "the rotation measured", l: "the length of the tube in decimetres", c: "the concentration in grams for each millilitre" },
        example: { a: "30", l: "1", c: "1/2" },
      },
      {
        id: "enantiomeric-excess", name: "Enantiomeric excess", eq: "E = 100(R - S)/(R + S)", find: "E",
        letters: { E: "the enantiomeric excess, as a percentage", R: "the amount of the major form", S: "the amount of the minor form" },
        example: { R: "75", S: "25" },
      },
      {
        id: "nmr-shift", name: "Chemical shift in NMR", eq: "d = 1000000(f - g)/g", find: "d",
        letters: { d: "the shift in parts per million", f: "the frequency of the signal", g: "the frequency of the reference" },
        example: { f: "300001500", g: "300000000" },
      },
      {
        id: "nmr-peaks", name: "Peaks in an NMR signal (n + 1 rule)", eq: "P = n + 1", find: "P",
        letters: { P: "the peaks in the signal", n: "the hydrogen atoms on the next carbon" },
        example: { n: "2" },
      },
      {
        id: "wavenumber", name: "Wavenumber in infrared spectroscopy", eq: "w = 10000/L", find: "w",
        letters: { w: "the wavenumber in waves for each centimetre", L: "the wavelength in micrometres" },
        example: { L: "5" },
      },
      {
        id: "retention-factor", name: "Retention factor in chromatography", eq: "k = (t - s)/s", find: "k",
        letters: { k: "the retention factor", t: "the time the substance is held back", s: "the time for something that is not held back" },
        example: { t: "12", s: "3" },
      },
      {
        id: "huckel", name: "Hückel's rule for aromatic rings", eq: "p = 4n + 2", find: "p",
        letters: { p: "the pi electrons in the ring", n: "0, 1, 2, 3 …" },
        example: { n: "1" },
      },
      {
        id: "formal-charge", name: "Formal charge on an atom", eq: "F = V - N - B/2", find: "F",
        letters: { F: "the formal charge", V: "the valence electrons of the free atom", N: "the electrons in lone pairs", B: "the electrons in bonds" },
        example: { V: "5", N: "0", B: "8" },
      },
      {
        id: "bond-order", name: "Bond order", eq: "O = (b - a)/2", find: "O",
        letters: { O: "the bond order", b: "the bonding electrons", a: "the antibonding electrons" },
        example: { b: "10", a: "4" },
      },
      {
        id: "electron-domains", name: "Electron domains round an atom", eq: "S = b + l", find: "S",
        letters: { S: "the electron domains", b: "the atoms bonded to it", l: "its lone pairs" },
        example: { b: "4", l: "0" },
      },
    ],
  },
  {
    group: "Organic chemistry: polymers",
    items: [
      {
        id: "polymer-length", name: "Units in a polymer chain", eq: "n = M/m", find: "n",
        letters: { n: "the units in the chain", M: "the molar mass of the polymer", m: "the molar mass of one unit" },
        example: { M: "28000", m: "28" },
      },
      {
        id: "number-average", name: "Number-average molar mass of a polymer", eq: "M = (Na + nb)/(N + n)", find: "M",
        letters: { M: "the number-average molar mass", N: "the chains of the first kind", a: "their molar mass", n: "the chains of the second kind", b: "their molar mass" },
        example: { N: "100", a: "10000", n: "50", b: "40000" },
      },
      {
        id: "polydispersity", name: "Polydispersity of a polymer", eq: "D = W/M", find: "D",
        letters: { D: "the polydispersity", W: "the mass-average molar mass", M: "the number-average molar mass" },
        example: { W: "30000", M: "20000" },
      },
    ],
  },
  {
    group: "Earth science: geology and seismology",
    items: [
      {
        id: "spreading-rate", name: "Rate of sea-floor spreading", eq: "r = d/t", find: "r",
        letters: { r: "the rate", d: "the distance from the ridge", t: "the age of the rock" },
        example: { d: "500", t: "10" },
      },
      {
        id: "geothermal-gradient", name: "Temperature underground", eq: "T = t + gd", find: "T",
        letters: { T: "the temperature at depth", t: "the temperature at the surface", g: "the rise for each kilometre", d: "the depth in kilometres" },
        example: { t: "15", g: "25", d: "2" },
      },
      {
        id: "isostasy", name: "Root of a mountain (Airy isostasy)", eq: "r = hd/(m - d)", find: "r",
        letters: { r: "the depth of the root", h: "the height of the mountain", d: "the density of the crust", m: "the density of the mantle" },
        example: { h: "5", d: "2", m: "3" },
      },
      {
        id: "bouguer", name: "Bouguer correction", eq: "B = 0.0419dh", find: "B",
        letters: { B: "the correction in milligals", d: "the density of the rock", h: "the height" },
        example: { d: "2.5", h: "100" },
      },
      {
        id: "free-air", name: "Free-air correction", eq: "F = 0.3086h", find: "F",
        letters: { F: "the correction in milligals", h: "the height in metres" },
        example: { h: "1000" },
      },
      {
        id: "gravity-anomaly", name: "Bouguer gravity anomaly", eq: "A = g - t + f - b", find: "A",
        letters: { A: "the anomaly", g: "the gravity measured", t: "the gravity expected at that latitude", f: "the free-air correction", b: "the Bouguer correction" },
        example: { g: "980000", t: "979900", f: "30", b: "10" },
      },
      {
        id: "heat-flow", name: "Heat flow through rock", eq: "q = kT/z", find: "q",
        letters: { q: "the heat flow", k: "the conductivity of the rock", T: "the temperature difference", z: "the depth difference" },
        example: { k: "3", T: "60", z: "2" },
      },
      {
        id: "local-magnitude", name: "Local earthquake magnitude", eq: "M = log_10(A) + 3log_10(8t) - 2.92", find: "M",
        letters: { M: "the magnitude", A: "the largest wave amplitude", t: "the gap between the P wave and the S wave in seconds" },
        example: { A: "1000", t: "5/4" },
      },
      {
        id: "magnitude-energy", name: "Energy of an earthquake", eq: "L = 1.5M + 4.8", find: "L",
        letters: { L: "the log of the energy in joules", M: "the magnitude" },
        example: { M: "6" },
      },
      {
        id: "moment-magnitude", name: "Moment magnitude", eq: "M = (2/3)log_10(S) - 10.7", find: "M",
        letters: { M: "the moment magnitude", S: "the seismic moment" },
        example: { S: "10^22" },
      },
      {
        id: "seismic-moment", name: "Seismic moment", eq: "S = uAD", find: "S",
        letters: { S: "the seismic moment", u: "the rigidity of the rock", A: "the area that slipped", D: "the slip" },
        example: { u: "30", A: "100", D: "2" },
      },
      {
        id: "p-wave-speed", name: "Speed of a P wave", eq: "v = sqrt((K + 4G/3)/d)", find: "v",
        letters: { v: "the speed", K: "the bulk modulus", G: "the shear modulus", d: "the density" },
        example: { K: "30", G: "15", d: "2" },
      },
      {
        id: "s-wave-speed", name: "Speed of an S wave", eq: "v = sqrt(G/d)", find: "v",
        letters: { v: "the speed", G: "the shear modulus", d: "the density" },
        example: { G: "32", d: "2" },
      },
      {
        id: "ray-parameter", name: "Ray parameter of a seismic wave", eq: "p = sin(i°)/v", find: "p",
        letters: { p: "the ray parameter", i: "the angle of the ray in degrees", v: "the wave speed" },
        example: { i: "30", v: "4" },
      },
      {
        id: "tsunami-speed", name: "Speed of a tsunami", eq: "v = sqrt(gd)", find: "v",
        letters: { v: "the speed", g: "the pull of gravity per kilogram", d: "the depth of the water" },
        example: { g: "10", d: "1000" },
      },
      {
        id: "tsunami-wavelength", name: "Wavelength of a tsunami", eq: "w = vT", find: "w",
        letters: { w: "the wavelength", v: "the speed", T: "the time between waves" },
        example: { v: "100", T: "900" },
      },
    ],
  },
  {
    group: "Earth science: water, soil and landforms",
    items: [
      {
        id: "runoff-coefficient", name: "Runoff coefficient", eq: "C = R/P", find: "C",
        letters: { C: "the runoff coefficient", R: "the runoff", P: "the rain that fell" },
        example: { R: "30", P: "60" },
      },
      {
        id: "rational-method", name: "Peak river flow from rain (rational method)", eq: "Q = CiA/360", find: "Q",
        letters: { Q: "the peak flow in cubic metres a second", C: "the runoff coefficient", i: "the rainfall in millimetres an hour", A: "the area in hectares" },
        example: { C: "0.9", i: "40", A: "10" },
      },
      {
        id: "manning", name: "Speed of a river (Manning's equation)", eq: "v = R^(2/3)S^(1/2)/n", find: "v",
        letters: { v: "the speed", R: "the hydraulic radius", S: "the slope", n: "Manning's roughness" },
        example: { R: "8", S: "1/4", n: "1/10" },
      },
      {
        id: "hydraulic-radius", name: "Hydraulic radius of a channel", eq: "R = A/P", find: "R",
        letters: { R: "the hydraulic radius", A: "the area of the flow", P: "the length of the wetted edge" },
        example: { A: "12", P: "8" },
      },
      {
        id: "water-balance", name: "Water balance of an area", eq: "S = P - E - R", find: "S",
        letters: { S: "the change in stored water", P: "the rain that fell", E: "the water lost to the air", R: "the runoff" },
        example: { P: "800", E: "450", R: "200" },
      },
      {
        id: "settling-speed", name: "Speed a grain settles in water (Stokes)", eq: "v = 2(p - f)gr^2/(9n)", find: "v",
        letters: { v: "the settling speed", p: "the density of the grain", f: "the density of the water", g: "the pull of gravity per kilogram", r: "the radius of the grain", n: "the viscosity of the water" },
        example: { p: "3", f: "1", g: "10", r: "3", n: "2" },
      },
      {
        id: "void-ratio", name: "Void ratio of a soil", eq: "v = V/S", find: "v",
        letters: { v: "the void ratio", V: "the volume of the gaps", S: "the volume of the solid grains" },
        example: { V: "30", S: "60" },
      },
      {
        id: "water-content", name: "Water content of a soil", eq: "w = 100m/s", find: "w",
        letters: { w: "the water content, as a percentage", m: "the mass of the water", s: "the mass of the dry soil" },
        example: { m: "25", s: "100" },
      },
      {
        id: "dry-density", name: "Dry density of a soil", eq: "D = B/(1 + w/100)", find: "D",
        letters: { D: "the dry density", B: "the bulk density", w: "the water content, as a percentage" },
        example: { B: "2", w: "25" },
      },
      {
        id: "saturation", name: "Degree of saturation of a soil", eq: "S = 100a/b", find: "S",
        letters: { S: "the saturation, as a percentage", a: "the volume of water", b: "the volume of the gaps" },
        example: { a: "18", b: "30" },
      },
      {
        id: "slope-angle", name: "Angle of a slope", eq: "tan(t°) = h/d", find: "t",
        letters: { t: "the angle in degrees", h: "the rise", d: "the distance along the ground" },
        example: { h: "1", d: "1" },
      },
      {
        id: "relief-ratio", name: "Relief ratio of a basin", eq: "R = h/L", find: "R",
        letters: { R: "the relief ratio", h: "the difference in height between the top and bottom", L: "the length of the basin" },
        example: { h: "300", L: "6000" },
      },
      {
        id: "hypsometric-integral", name: "Hypsometric integral", eq: "H = (m - l)/(h - l)", find: "H",
        letters: { H: "the hypsometric integral", m: "the mean height", l: "the lowest height", h: "the highest height" },
        example: { m: "500", l: "100", h: "900" },
      },
      {
        id: "bifurcation-ratio", name: "Bifurcation ratio of streams", eq: "B = N/n", find: "B",
        letters: { B: "the bifurcation ratio", N: "the streams of one order", n: "the streams of the next order up" },
        example: { N: "24", n: "6" },
      },
      {
        id: "circularity-ratio", name: "Circularity ratio of a basin", eq: "C = 4πA/P^2", find: "C",
        letters: { C: "the circularity ratio", A: "the area", P: "the perimeter" },
        example: { A: "154", P: "44" },
      },
      {
        id: "elongation-ratio", name: "Elongation ratio of a basin", eq: "E = 2sqrt(A/π)/L", find: "E",
        letters: { E: "the elongation ratio", A: "the area", L: "the length of the basin" },
        example: { A: "154", L: "14" },
      },
      {
        id: "form-factor", name: "Form factor of a basin", eq: "F = A/L^2", find: "F",
        letters: { F: "the form factor", A: "the area", L: "the length of the basin" },
        example: { A: "50", L: "10" },
      },
      {
        id: "glacier-balance", name: "Mass balance of a glacier", eq: "B = A - C", find: "B",
        letters: { B: "the mass balance", A: "the snow gained", C: "the ice lost" },
        example: { A: "500", C: "620" },
      },
      {
        id: "ice-thickness", name: "Thickness of a glacier", eq: "h = T/(dg·sin(a°))", find: "h",
        letters: { h: "the thickness", T: "the shear stress at the bed", d: "the density of ice", g: "the pull of gravity per kilogram", a: "the slope in degrees" },
        example: { T: "90000", d: "900", g: "10", a: "30" },
      },
      {
        id: "vertical-exaggeration", name: "Vertical exaggeration of a profile", eq: "V = a/b", find: "V",
        letters: { V: "the vertical exaggeration", a: "the vertical scale", b: "the horizontal scale" },
        example: { a: "1/10", b: "1/50" },
      },
    ],
  },
  {
    group: "Earth science: oceans, air and climate",
    items: [
      {
        id: "iceberg", name: "Share of an iceberg above the water", eq: "f = 1 - a/b", find: "f",
        letters: { f: "the share above the surface", a: "the density of ice", b: "the density of the water" },
        example: { a: "900", b: "1000" },
      },
      {
        id: "coriolis", name: "Coriolis parameter", eq: "f = 2w·sin(p°)", find: "f",
        letters: { f: "the Coriolis parameter", w: "the spin rate of the planet", p: "the latitude in degrees" },
        example: { w: "1/10000", p: "30" },
      },
      {
        id: "geostrophic-wind", name: "Geostrophic wind", eq: "v = P/(dfD)", find: "v",
        letters: { v: "the wind speed", P: "the pressure difference", d: "the density of the air", f: "the Coriolis parameter", D: "the distance it is measured over" },
        example: { P: "200", d: "1", f: "1/100", D: "1000" },
      },
      {
        id: "deep-water-speed", name: "Speed of a deep-water wave", eq: "c = gT/(2π)", find: "c",
        letters: { c: "the wave speed", g: "the pull of gravity per kilogram", T: "the time between waves" },
        example: { g: "10", T: "22" },
      },
      {
        id: "deep-water-wavelength", name: "Wavelength of a deep-water wave", eq: "L = gT^2/(2π)", find: "L",
        letters: { L: "the wavelength", g: "the pull of gravity per kilogram", T: "the time between waves" },
        example: { g: "10", T: "11/5" },
      },
      {
        id: "dry-lapse", name: "Cooling of rising dry air", eq: "T = t - 9.8h/1000", find: "T",
        letters: { T: "the temperature at height h", t: "the temperature at the start", h: "the height risen in metres" },
        example: { t: "30", h: "1000" },
      },
      {
        id: "dew-point", name: "Dew point from humidity", eq: "D = T - (100 - H)/5", find: "D",
        letters: { D: "the dew point", T: "the air temperature", H: "the relative humidity, as a percentage" },
        example: { T: "25", H: "60" },
        note: "a rough guide for humidity above 50 percent",
      },
      {
        id: "albedo", name: "Albedo", eq: "A = 100r/i", find: "A",
        letters: { A: "the albedo, as a percentage", r: "the light reflected", i: "the light arriving" },
        example: { r: "30", i: "100" },
      },
      {
        id: "effective-temperature", name: "Temperature of a planet with no atmosphere", eq: "T = (S(1 - a)/(4s))^(1/4)", find: "T",
        letters: { T: "the temperature in kelvin", S: "the sunlight arriving at the planet", a: "the albedo, from 0 to 1", s: "the Stefan-Boltzmann constant" },
        example: { S: "64", a: "0", s: "1" },
      },
      {
        id: "climate-sensitivity", name: "Warming from a change in heating", eq: "T = lF", find: "T",
        letters: { T: "the warming", l: "the climate sensitivity", F: "the change in radiative forcing" },
        example: { l: "3/4", F: "4" },
      },
      {
        id: "noon-sun", name: "Height of the noon sun", eq: "A = 90 - L + D", find: "A",
        letters: { A: "the altitude of the sun in degrees", L: "the latitude in degrees", D: "the latitude the sun is overhead at" },
        example: { L: "40", D: "10" },
      },
      {
        id: "solar-zenith", name: "Zenith angle of the sun", eq: "cos(z°) = sin(l°)sin(d°) + cos(l°)cos(d°)cos(h°)", find: "z",
        letters: { z: "the zenith angle in degrees", l: "the latitude", d: "the declination of the sun", h: "the hour angle" },
        example: { l: "0", d: "0", h: "60" },
      },
      {
        id: "insolation", name: "Sunlight on a flat surface", eq: "Q = S·cos(z°)", find: "Q",
        letters: { Q: "the sunlight on the surface", S: "the sunlight at right angles", z: "the zenith angle in degrees" },
        example: { S: "1000", z: "60" },
      },
      {
        id: "latitude-distance", name: "Distance along a line of longitude", eq: "d = 111L", find: "d",
        letters: { d: "the distance in kilometres", L: "the difference in latitude in degrees" },
        example: { L: "30" },
      },
      {
        id: "longitude-distance", name: "Distance along a line of latitude", eq: "d = 111·cos(p°)L", find: "d",
        letters: { d: "the distance in kilometres", p: "the latitude in degrees", L: "the difference in longitude in degrees" },
        example: { p: "60", L: "10" },
      },
      {
        id: "central-angle", name: "Angle between two places on the Earth", eq: "cos(t°) = sin(a°)sin(b°) + cos(a°)cos(b°)cos(c°)", find: "t",
        letters: { t: "the angle at the centre of the Earth in degrees", a: "the latitude of the first place", b: "the latitude of the second", c: "the difference in longitude" },
        example: { a: "0", b: "0", c: "90" },
      },
    ],
  },
  {
    group: "Earth science: the solar system and stars",
    items: [
      {
        id: "roche-limit", name: "Roche limit", eq: "d = 2.44R(m/M)^(1/3)", find: "d",
        letters: { d: "the closest a moon can come", R: "the radius of the planet", m: "the density of the planet", M: "the density of the moon" },
        example: { R: "10", m: "8", M: "1" },
      },
      {
        id: "hill-sphere", name: "Hill sphere", eq: "r = a(m/(3M))^(1/3)", find: "r",
        letters: { r: "the radius of the Hill sphere", a: "the distance from the sun", m: "the mass of the planet", M: "the mass of the sun" },
        example: { a: "10", m: "1", M: "8/3" },
      },
      {
        id: "distance-modulus", name: "Distance modulus", eq: "m = M + 5log_10(d/10)", find: "m",
        letters: { m: "the apparent magnitude", M: "the absolute magnitude", d: "the distance in parsecs" },
        example: { M: "1", d: "100" },
      },
      {
        id: "magnitude-difference", name: "Difference in magnitude from the brightness", eq: "m - n = -(5/2)log_10(F/f)", find: "m",
        letters: { m: "the magnitude of the brighter star", n: "the magnitude of the fainter star", F: "the brightness of the brighter star", f: "the brightness of the fainter star" },
        example: { n: "2", F: "100", f: "1" },
      },
      {
        id: "apparent-brightness", name: "Apparent brightness of a star", eq: "b = L/(4πd^2)", find: "b",
        letters: { b: "the apparent brightness", L: "the luminosity", d: "the distance" },
        example: { L: "88", d: "7" },
      },
      {
        id: "synodic-period", name: "Synodic period of an outer planet", eq: "1/S = 1/E - 1/P", find: "S",
        letters: { S: "the time between oppositions", E: "the Earth's year", P: "the planet's year" },
        example: { E: "1", P: "2" },
      },
      {
        id: "small-angle", name: "Size of an object from its angle", eq: "a = 206265s/d", find: "a",
        letters: { a: "the angle in arcseconds", s: "the size of the object", d: "the distance to it" },
        example: { s: "1", d: "206265" },
      },
      {
        id: "vis-viva", name: "Speed in an elliptical orbit (vis-viva)", eq: "v = sqrt(GM(2/r - 1/a))", find: "v",
        letters: { v: "the speed", G: "the gravitational constant", M: "the mass of the body being orbited", r: "the distance now", a: "the semi-major axis" },
        example: { G: "1", M: "4", r: "1", a: "1" },
      },
    ],
  },
  {
    group: "Geometry: faces, edges and vertices",
    items: [
      {
        id: "prism-faces", name: "Faces of a prism", eq: "F = n + 2", find: "F",
        letters: { F: "the faces", n: "the sides of the base" },
        example: { n: "5" },
        note: "two ends and one rectangle for each side",
      },
      {
        id: "prism-edges", name: "Edges of a prism", eq: "E = 3n", find: "E",
        letters: { E: "the edges", n: "the sides of the base" },
        example: { n: "5" },
      },
      {
        id: "prism-vertices", name: "Vertices of a prism", eq: "V = 2n", find: "V",
        letters: { V: "the vertices (corners)", n: "the sides of the base" },
        example: { n: "5" },
      },
      {
        id: "pyramid-faces", name: "Faces of a pyramid", eq: "F = n + 1", find: "F",
        letters: { F: "the faces", n: "the sides of the base" },
        example: { n: "5" },
        note: "the base and one triangle for each side",
      },
      {
        id: "pyramid-edges", name: "Edges of a pyramid", eq: "E = 2n", find: "E",
        letters: { E: "the edges", n: "the sides of the base" },
        example: { n: "5" },
      },
      {
        id: "pyramid-vertices", name: "Vertices of a pyramid", eq: "V = n + 1", find: "V",
        letters: { V: "the vertices (corners)", n: "the sides of the base" },
        example: { n: "5" },
      },
      {
        id: "bipyramid-faces", name: "Faces of a bipyramid", eq: "F = 2n", find: "F",
        letters: { F: "the faces", n: "the sides of the middle polygon" },
        example: { n: "4" },
        note: "two pyramids joined base to base",
      },
      {
        id: "bipyramid-edges", name: "Edges of a bipyramid", eq: "E = 3n", find: "E",
        letters: { E: "the edges", n: "the sides of the middle polygon" },
        example: { n: "4" },
      },
      {
        id: "bipyramid-vertices", name: "Vertices of a bipyramid", eq: "V = n + 2", find: "V",
        letters: { V: "the vertices (corners)", n: "the sides of the middle polygon" },
        example: { n: "4" },
      },
      {
        id: "antiprism-faces", name: "Faces of an antiprism", eq: "F = 2n + 2", find: "F",
        letters: { F: "the faces", n: "the sides of each end" },
        example: { n: "5" },
      },
      {
        id: "antiprism-edges", name: "Edges of an antiprism", eq: "E = 4n", find: "E",
        letters: { E: "the edges", n: "the sides of each end" },
        example: { n: "5" },
      },
      {
        id: "antiprism-vertices", name: "Vertices of an antiprism", eq: "V = 2n", find: "V",
        letters: { V: "the vertices (corners)", n: "the sides of each end" },
        example: { n: "5" },
      },
      {
        id: "polyhedron-edges-faces", name: "Edges from the faces", eq: "E = pF/2", find: "E",
        letters: { E: "the edges", p: "the sides of each face", F: "the faces" },
        example: { p: "4", F: "6" },
        note: "every edge is shared by two faces",
      },
      {
        id: "polyhedron-edges-vertices", name: "Edges from the vertices", eq: "E = qV/2", find: "E",
        letters: { E: "the edges", q: "the edges meeting at each vertex", V: "the vertices" },
        example: { q: "3", V: "8" },
        note: "every edge has two ends",
      },
      {
        id: "regular-polyhedron-vertices", name: "Vertices of a regular polyhedron", eq: "V = 4p/(2p + 2q - pq)", find: "V",
        letters: { V: "the vertices", p: "the sides of each face", q: "the faces meeting at each vertex" },
        example: { p: "4", q: "3" },
        note: "a cube is p = 4, q = 3",
      },
      {
        id: "regular-polyhedron-edges", name: "Edges of a regular polyhedron", eq: "E = 2pq/(2p + 2q - pq)", find: "E",
        letters: { E: "the edges", p: "the sides of each face", q: "the faces meeting at each vertex" },
        example: { p: "4", q: "3" },
      },
      {
        id: "regular-polyhedron-faces", name: "Faces of a regular polyhedron", eq: "F = 4q/(2p + 2q - pq)", find: "F",
        letters: { F: "the faces", p: "the sides of each face", q: "the faces meeting at each vertex" },
        example: { p: "4", q: "3" },
      },
      {
        id: "euler-genus", name: "Euler's formula for a solid with holes", eq: "F = E - V + 2 - 2g", find: "F",
        letters: { F: "the faces", E: "the edges", V: "the vertices", g: "the holes through the solid" },
        example: { E: "24", V: "16", g: "1" },
        note: "a doughnut shape has g = 1",
      },
      {
        id: "face-angle-total", name: "Sum of all the face angles of a solid", eq: "S = 360(V - 2)", find: "S",
        letters: { S: "the sum of every angle on every face, in degrees", V: "the vertices" },
        example: { V: "8" },
      },
      {
        id: "angle-defect", name: "Angle defect at a vertex", eq: "D = 360 - S", find: "D",
        letters: { D: "the angle defect in degrees", S: "the sum of the face angles at the vertex" },
        example: { S: "270" },
        note: "the defects of all the vertices add to 720",
      },
      {
        id: "total-edge-length", name: "Total length of the edges of a regular solid", eq: "L = Ea", find: "L",
        letters: { L: "the total length of all the edges", E: "the number of edges", a: "the length of one edge" },
        example: { E: "12", a: "5" },
      },
      {
        id: "cube-edge-length", name: "Total edge length of a cube", eq: "L = 12s", find: "L",
        letters: { L: "the total length of the edges", s: "the edge" },
        example: { s: "5" },
      },
      {
        id: "cuboid-edge-length", name: "Total edge length of a cuboid", eq: "L = 4(l + w + h)", find: "L",
        letters: { L: "the total length of the edges", l: "the length", w: "the width", h: "the height" },
        example: { l: "6", w: "4", h: "3" },
      },
      {
        id: "prism-edge-length", name: "Total edge length of a regular prism", eq: "L = 2ns + nh", find: "L",
        letters: { L: "the total length of the edges", n: "the sides of the base", s: "the side of the base", h: "the height" },
        example: { n: "6", s: "3", h: "10" },
      },
      {
        id: "pyramid-edge-length", name: "Total edge length of a regular pyramid", eq: "L = ns + nk", find: "L",
        letters: { L: "the total length of the edges", n: "the sides of the base", s: "the side of the base", k: "the sloping edge" },
        example: { n: "4", s: "6", k: "5" },
      },
    ],
  },
  {
    group: "Geometry: more surface areas and volumes of solids",
    items: [
      {
        id: "cube-lateral", name: "Four sides of a cube", eq: "A = 4s^2", find: "A",
        letters: { A: "the area of the four sides", s: "the edge" },
        example: { s: "5" },
      },
      {
        id: "triangular-prism-volume", name: "Volume of a triangular prism", eq: "V = bhl/2", find: "V",
        letters: { V: "the volume", b: "the base of the triangle", h: "the height of the triangle", l: "the length of the prism" },
        example: { b: "6", h: "4", l: "10" },
      },
      {
        id: "polygon-prism-volume", name: "Volume of a regular prism", eq: "V = ns^2h/(4tan((180/n)°))", find: "V",
        letters: { V: "the volume", n: "the sides of the base", s: "the side of the base", h: "the height of the prism" },
        example: { n: "4", s: "5", h: "10" },
      },
      {
        id: "hexagonal-prism-surface", name: "Surface area of a hexagonal prism", eq: "A = 3sqrt(3)s^2 + 6sh", find: "A",
        letters: { A: "the area", s: "the side of the hexagon", h: "the height" },
        example: { s: "2", h: "5" },
      },
      {
        id: "hollow-cylinder-surface", name: "Surface area of a pipe with both ends open to view", eq: "A = 2πh(R + r) + 2π(R^2 - r^2)", find: "A",
        letters: { A: "the total area", h: "the length", R: "the outer radius", r: "the inner radius" },
        example: { h: "10", R: "5", r: "3" },
      },
      {
        id: "square-pyramid-volume", name: "Volume of a square-based pyramid", eq: "V = a^2h/3", find: "V",
        letters: { V: "the volume", a: "the side of the base", h: "the height" },
        example: { a: "6", h: "5" },
      },
      {
        id: "square-pyramid-surface", name: "Surface area of a square-based pyramid", eq: "A = a^2 + 2al", find: "A",
        letters: { A: "the total area", a: "the side of the base", l: "the slant height" },
        example: { a: "6", l: "5" },
      },
      {
        id: "polygon-pyramid-volume", name: "Volume of a regular pyramid", eq: "V = ns^2h/(12tan((180/n)°))", find: "V",
        letters: { V: "the volume", n: "the sides of the base", s: "the side of the base", h: "the height" },
        example: { n: "4", s: "6", h: "5" },
      },
      {
        id: "square-frustum-volume", name: "Volume of a square frustum", eq: "V = h(a^2 + ab + b^2)/3", find: "V",
        letters: { V: "the volume", h: "the height", a: "the side of the bigger end", b: "the side of the smaller end" },
        example: { h: "6", a: "5", b: "3" },
      },
      {
        id: "square-frustum-surface", name: "Surface area of a square frustum", eq: "A = a^2 + b^2 + 2(a + b)l", find: "A",
        letters: { A: "the total area", a: "the side of the bigger end", b: "the side of the smaller end", l: "the slant height" },
        example: { a: "5", b: "3", l: "4" },
      },
      {
        id: "cap-total-area", name: "Total surface of a spherical cap", eq: "A = π(2a^2 + h^2)", find: "A",
        letters: { A: "the total area", a: "the radius of the flat face", h: "the height of the cap" },
        example: { a: "3", h: "2" },
      },
      {
        id: "sector-sphere-area", name: "Surface of a spherical sector", eq: "A = πr(2h + a)", find: "A",
        letters: { A: "the total area", r: "the radius of the sphere", h: "the height of the cap", a: "the radius of the cap's edge" },
        example: { r: "5", h: "2", a: "3" },
      },
      {
        id: "shell-volume", name: "Volume of a hollow sphere", eq: "V = (4/3)π(R^3 - r^3)", find: "V",
        letters: { V: "the volume of the material", R: "the outer radius", r: "the inner radius" },
        example: { R: "3", r: "2" },
      },
      {
        id: "shell-area", name: "Total surface of a hollow sphere", eq: "A = 4π(R^2 + r^2)", find: "A",
        letters: { A: "the total area, inside and out", R: "the outer radius", r: "the inner radius" },
        example: { R: "3", r: "2" },
      },
      {
        id: "capsule-surface", name: "Surface area of a capsule", eq: "A = 2πr(2r + h)", find: "A",
        letters: { A: "the area", r: "the radius", h: "the length of the straight part" },
        example: { r: "3", h: "10" },
      },
      {
        id: "hemisphere-hollow-surface", name: "Surface area of a hollow hemisphere (a bowl)", eq: "A = 2π(R^2 + r^2) + π(R^2 - r^2)", find: "A",
        letters: { A: "the total area", R: "the outer radius", r: "the inner radius" },
        example: { R: "5", r: "4" },
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
  {
    group: "Identities and expansions",
    items: [
      {
        id: "quadratic-pq", name: "Quadratic formula (p-q form)", eq: "x = -p/2 ± sqrt((p/2)^2 - q)", find: "x",
        letters: { x: "a root", p: "the number in front of x", q: "the number on its own" },
        example: { p: "-5", q: "6" },
        note: "for x² + px + q = 0",
      },
      {
        id: "factor-quad-sum", name: "Factoring a quadratic by hand: the numbers add to b", eq: "b = p + q", find: "b",
        letters: { b: "the number in front of x", p: "the number in the first bracket", q: "the number in the second bracket" },
        example: { p: "2", q: "3" },
        note: "x² + bx + c = (x + p)(x + q)",
      },
      {
        id: "factor-quad-product", name: "Factoring a quadratic by hand: the numbers multiply to c", eq: "c = pq", find: "c",
        letters: { c: "the number on its own", p: "the number in the first bracket", q: "the number in the second bracket" },
        example: { p: "2", q: "3" },
        note: "x² + bx + c = (x + p)(x + q)",
      },
      {
        id: "diff-squares", name: "Difference of squares", eq: "D = (a + b)(a - b)", find: "D",
        letters: { D: "a² − b²", a: "the first number", b: "the second number" },
        example: { a: "7", b: "3" },
        note: "a² − b² = (a + b)(a − b)",
      },
      {
        id: "binomial-square", name: "Square of a binomial", eq: "S = a^2 + 2ab + b^2", find: "S",
        letters: { S: "(a + b)²", a: "the first number", b: "the second number" },
        example: { a: "3", b: "4" },
        note: "(a + b)² = a² + 2ab + b²",
      },
      {
        id: "diff-cubes", name: "Difference of cubes", eq: "D = (a - b)(a^2 + ab + b^2)", find: "D",
        letters: { D: "a³ − b³", a: "the first number", b: "the second number" },
        example: { a: "3", b: "1" },
        note: "a³ − b³ = (a − b)(a² + ab + b²)",
      },
      {
        id: "sum-cubes", name: "Sum of cubes", eq: "S = (a + b)(a^2 - ab + b^2)", find: "S",
        letters: { S: "a³ + b³", a: "the first number", b: "the second number" },
        example: { a: "2", b: "1" },
        note: "a³ + b³ = (a + b)(a² − ab + b²)",
      },
    ],
  },
  {
    group: "Trigonometric identities",
    items: [
      {
        id: "tan-identity", name: "Tangent: sin over cos", eq: "t = sin(x°)/cos(x°)", find: "t",
        letters: { t: "tan x", x: "the angle in degrees" },
        example: { x: "0" },
        note: "tan x = sin x / cos x",
      },
      {
        id: "cot-identity", name: "Cotangent: cos over sin", eq: "c = cos(x°)/sin(x°)", find: "c",
        letters: { c: "cot x", x: "the angle in degrees" },
        example: { x: "90" },
        note: "cot x = cos x / sin x",
      },
      {
        id: "csc-identity", name: "Cosecant: one over sin", eq: "c = 1/sin(x°)", find: "c",
        letters: { c: "csc x", x: "the angle in degrees" },
        example: { x: "30" },
        note: "csc x = 1 / sin x",
      },
      {
        id: "sec-identity", name: "Secant: one over cos", eq: "s = 1/cos(x°)", find: "s",
        letters: { s: "sec x", x: "the angle in degrees" },
        example: { x: "60" },
        note: "sec x = 1 / cos x",
      },
      {
        id: "cot-reciprocal", name: "Cotangent: one over tan", eq: "c = 1/tan(x°)", find: "c",
        letters: { c: "cot x", x: "the angle in degrees" },
        example: { x: "45" },
        note: "cot x = 1 / tan x",
      },
      {
        id: "pyth-identity", name: "Pythagorean identity: sin² + cos²", eq: "s = sin(x°)^2 + cos(x°)^2", find: "s",
        letters: { s: "sin²x + cos²x", x: "the angle in degrees" },
        example: { x: "30" },
        note: "this is always 1",
      },
      {
        id: "pyth-tan", name: "Pythagorean identity: tan² + 1", eq: "s = tan(x°)^2 + 1", find: "s",
        letters: { s: "tan²x + 1", x: "the angle in degrees" },
        example: { x: "45" },
        note: "this is sec²x",
      },
      {
        id: "pyth-cot", name: "Pythagorean identity: cot² + 1", eq: "c = cos(x°)^2/sin(x°)^2 + 1", find: "c",
        letters: { c: "cot²x + 1", x: "the angle in degrees" },
        example: { x: "30" },
        note: "this is csc²x",
      },
      {
        id: "double-sin", name: "Double angle: sin 2x", eq: "s = 2sin(x°)cos(x°)", find: "s",
        letters: { s: "sin 2x", x: "the angle in degrees" },
        example: { x: "30" },
        note: "sin 2x = 2 sin x cos x",
      },
      {
        id: "double-cos-1", name: "Double angle: cos 2x, from cos² − sin²", eq: "c = cos(x°)^2 - sin(x°)^2", find: "c",
        letters: { c: "cos 2x", x: "the angle in degrees" },
        example: { x: "30" },
        note: "cos 2x = cos²x − sin²x",
      },
      {
        id: "double-cos-2", name: "Double angle: cos 2x, from cos²", eq: "c = 2cos(x°)^2 - 1", find: "c",
        letters: { c: "cos 2x", x: "the angle in degrees" },
        example: { x: "30" },
        note: "cos 2x = 2cos²x − 1",
      },
      {
        id: "double-cos-3", name: "Double angle: cos 2x, from sin²", eq: "c = 1 - 2sin(x°)^2", find: "c",
        letters: { c: "cos 2x", x: "the angle in degrees" },
        example: { x: "30" },
        note: "cos 2x = 1 − 2sin²x",
      },
      {
        id: "double-tan", name: "Double angle: tan 2x", eq: "t = 2tan(x°)/(1 - tan(x°)^2)", find: "t",
        letters: { t: "tan 2x", x: "the angle in degrees" },
        example: { x: "30" },
        note: "tan 2x = 2 tan x / (1 − tan²x)",
      },
      {
        id: "half-sin", name: "Half angle: sin² x", eq: "s = (1 - cos((2x)°))/2", find: "s",
        letters: { s: "sin²x", x: "the angle in degrees" },
        example: { x: "30" },
        note: "sin²x = (1 − cos 2x) / 2",
      },
      {
        id: "half-cos", name: "Half angle: cos² x", eq: "c = (1 + cos((2x)°))/2", find: "c",
        letters: { c: "cos²x", x: "the angle in degrees" },
        example: { x: "30" },
        note: "cos²x = (1 + cos 2x) / 2",
      },
      {
        id: "sum-sin", name: "Sum rule: sin(x + y)", eq: "s = sin(x°)cos(y°) + cos(x°)sin(y°)", find: "s",
        letters: { s: "sin(x + y)", x: "the first angle in degrees", y: "the second angle in degrees" },
        example: { x: "60", y: "0" },
      },
      {
        id: "sum-cos", name: "Sum rule: cos(x + y)", eq: "c = cos(x°)cos(y°) - sin(x°)sin(y°)", find: "c",
        letters: { c: "cos(x + y)", x: "the first angle in degrees", y: "the second angle in degrees" },
        example: { x: "30", y: "60" },
      },
      {
        id: "sum-tan", name: "Sum rule: tan(x + y)", eq: "t = (tan(x°) + tan(y°))/(1 - tan(x°)tan(y°))", find: "t",
        letters: { t: "tan(x + y)", x: "the first angle in degrees", y: "the second angle in degrees" },
        example: { x: "0", y: "45" },
      },
    ],
  },
  {
    group: "Coordinates",
    items: [
      {
        id: "midpoint-x", name: "Midpoint, across (x)", eq: "m = (a + b)/2", find: "m",
        letters: { m: "the x of the midpoint", a: "the x of the first point", b: "the x of the second point" },
        example: { a: "2", b: "8" },
        note: "M = ((x₁ + x₂)/2, (y₁ + y₂)/2)",
      },
      {
        id: "midpoint-y", name: "Midpoint, up (y)", eq: "n = (a + b)/2", find: "n",
        letters: { n: "the y of the midpoint", a: "the y of the first point", b: "the y of the second point" },
        example: { a: "1", b: "7" },
        note: "M = ((x₁ + x₂)/2, (y₁ + y₂)/2)",
      },
    ],
  },
];

/** Every formula, flat, in the order they are listed. */
/* The groups are written in the order they were made; the shelf reads better with
   a family kept together — every "Geometry: …" group right after Shapes, every
   "Physics: …" group right after Motion and forces. */
for (const [family, anchor] of [["Geometry:", "Shapes"], ["Physics:", "Motion and forces"]]) {
  const kin = GROUPS.filter((g) => g.group.startsWith(family));
  for (const g of kin) GROUPS.splice(GROUPS.indexOf(g), 1);
  GROUPS.splice(GROUPS.findIndex((g) => g.group === anchor) + 1, 0, ...kin);
}

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
