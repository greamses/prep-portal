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
        id: "arc-length", name: "Arc length", eq: "s = 2(22/7)r(θ/360)", find: "s",
        letters: { s: "the length of the arc", r: "the radius", θ: "the angle at the centre, in degrees" },
        example: { r: "7", θ: "90" },
        note: "taking π as 22/7",
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
