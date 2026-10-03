/* ============================================================================
   Algebra Workbook — CHAPTER 8: QUADRATIC EQUATIONS — three more methods
   ----------------------------------------------------------------------------
   The chapter is every way to solve ax² + bx + c = 0, each built up a step at
   a time. Completing the square (ex-square.js) and the graph (ex-quadgraph.js)
   are two of them; this file is the other three.

   FACTORISATION — comes first, because it is multiplying brackets run backwards
     expand two brackets       an area box: (x + p)(x + q) is four pieces, and
                               the two x pieces join: x² + (p + q)x + pq
     find the two numbers      their PRODUCT is the last number, their SUM the
                               middle one
     factorise                 x² + bx + c = (x + p)(x + q)
     solve by factorising      a product is 0 only if a bracket is 0
     a number in front of x²   (Stretch) ax² + bx + c: two numbers with product
                               a × c and sum b, then split the middle term

   THE FORMULA — works on every quadratic
     name a, b and c           from the equation, rearranged to … = 0 first
     the discriminant          b² − 4ac: plus two roots, 0 one, minus none
     piece by piece            −b, b² − 4ac, its square root, 2a
     solve by the formula      x = (−b ± √(b² − 4ac)) ÷ 2a

   PO-SHEN LOH'S METHOD — no guessing for the two numbers
     the middle                the roots add to −b, so their middle is −b ÷ 2
     how far out               the roots are m − u and m + u, and their
                               product (m − u)(m + u) = m² − u² is c: u² = m² − c
     solve                     m, u, then m − u and m + u
     harder                    (Middle+) divide through by a first; odd b,
                               where the middle is a half

   Every equation is made from its roots, so each step comes out exactly.
   Lines with boxes are kept out of MathJax (as chapter 10's are).
   ========================================================================== */

import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq bn-eq wb-nomath">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;
const num = (n) => (n < 0 ? `−${-n}` : String(n));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** ax² + bx + c as written: x² − 5x + 6, 2x² + x − 3, x² − 9. */
export function quadText(a, b, c) {
  const ax = `${a === 1 ? "" : a === -1 ? "−" : num(a)}x²`;
  const bx = b === 0 ? "" : ` ${b < 0 ? "−" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}x`;
  const cc = c === 0 ? "" : ` ${c < 0 ? "−" : "+"} ${Math.abs(c)}`;
  return `${ax}${bx}${cc}`;
}
/** A bracket: (x + 3), (x − 2), (2x + 1). */
const bracket = (k, p) => `(${k === 1 ? "" : k}x ${p < 0 ? "−" : "+"} ${Math.abs(p)})`;

/** Two numbers p and q for (x + p)(x + q), by level. Never 0. */
function twoNumbers(r, o) {
  const t = tier(o);
  for (;;) {
    const pick = () => (t === "gentle" ? r.int(1, 6) : t === "middle" ? r.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7]) : r.pick([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
    const p = pick(), q = pick();
    if (p + q === 0) continue;       // x² − 9 has no middle term: kept for the formula
    return p <= q ? { p, q } : { p: q, q: p };
  }
}

export const QD_FACTOR_GROUPS = [
  { id: "qd-factor", chapter: "Chapter 8 · Quadratic equations", label: "Factorisation", blurb: "Two brackets multiplied — and then run backwards to solve." },
];
export const QD_MORE_GROUPS = [
  { id: "qd-formula", label: "The formula", blurb: "x = (−b ± √(b² − 4ac)) ÷ 2a: works on every quadratic." },
  { id: "qd-loh", label: "Po-Shen Loh's method", blurb: "The roots sit the same distance either side of their middle." },
];

/* ═══ FACTORISATION ════════════════════════════════════════════════════════*/

/** The area box of (x + p)(x + q): four pieces. Cells are text or boxes. */
function areaBox(p, q, cells) {
  const h = (k) => (k === null ? "x" : `${k < 0 ? "−" : "+"} ${Math.abs(k)}`);
  return `<table class="qd-area wb-nomath"><tbody>` +
    `<tr><th></th><th>x</th><th>${h(q)}</th></tr>` +
    `<tr><th>x</th><td>${cells[0]}</td><td>${cells[1]}</td></tr>` +
    `<tr><th>${h(p)}</th><td>${cells[2]}</td><td>${cells[3]}</td></tr></tbody></table>`;
}

const fcExpand = {
  id: "qd-expand",
  group: "qd-factor",
  label: "Expand two brackets",
  blurb: "An area box: four pieces, and the two x pieces join.",
  heading: "Factorisation: first, multiply two brackets",
  instruction: () =>
    "(x + p)(x + q) is a rectangle x + p by x + q, in four pieces: x times x, x times each number, and the two " +
    "numbers times each other. Fill the box (write just the number in front of x in the two x pieces), then add " +
    "the pieces: the two x pieces join into one.",
  cols: 1,
  defaultCount: 3,
  make: (r, o) => twoNumbers(r, o),
  render(item) {
    const { p, q } = item;
    return eq(`${bracket(1, p)}${bracket(1, q)}`) +
      areaBox(p, q, ["x²", `${box()}x`, `${box()}x`, box()]) +
      eq(`= x² + ${box()}x + ${box()}`);
  },
  worked() {
    return worked(eq("(x + 2)(x + 3)") + areaBox(2, 3, ["x²", "3x", "2x", "6"]) +
      say("x × x = x², x × 3 = 3x, 2 × x = 2x and 2 × 3 = 6. The x pieces join: 3x + 2x = 5x. So x² + 5x + 6 — the " +
        "middle number is the SUM of 2 and 3, the last number their PRODUCT."));
  },
  key(item) {
    const { p, q } = item;
    return [q, p, p * q, p + q, p * q].map((v) => want.num(v));
  },
  answer(item) {
    return [`${quadText(1, item.p + item.q, item.p * item.q)}`];
  },
};

const fcNumbers = {
  id: "qd-numbers",
  group: "qd-factor",
  label: "Find the two numbers",
  blurb: "Their product is the last number, their sum the middle one.",
  heading: "Factorisation: the two numbers",
  instruction: () =>
    "To undo the multiplying you need the two numbers back. Start from the PRODUCT — list the pairs that multiply " +
    "to it — and pick the pair whose SUM is right. A minus product means one of each sign; a plus product with a " +
    "minus sum means both are minus. Write the smaller number first.",
  cols: 1,
  defaultCount: 6,
  make: (r, o) => twoNumbers(r, o),
  render(item) {
    return eq(`product ${num(item.p * item.q)}, sum ${num(item.p + item.q)}: &nbsp; ${box()} and ${box()}`);
  },
  worked() {
    return worked(eq("product 6, sum 5: &nbsp; 2 and 3") +
      say("Pairs that multiply to 6: 1 and 6 (sum 7), 2 and 3 (sum 5) — that one. For product −6 and sum 1: −2 and 3."));
  },
  key(item) {
    return [want.num(item.p), want.num(item.q)];
  },
  answer(item) {
    return [`${num(item.p)} and ${num(item.q)}`];
  },
};

const fcFactorise = {
  id: "qd-factorise",
  group: "qd-factor",
  label: "Factorise",
  blurb: "x² + bx + c back into two brackets.",
  heading: "Factorisation: back into brackets",
  instruction: () =>
    "Find the two numbers whose product is the last number and whose sum is the middle one. They go in the " +
    "brackets: x² + bx + c = (x + first)(x + second). Write the smaller number first, with its sign. Check by " +
    "multiplying out.",
  cols: 1,
  defaultCount: 4,
  make: (r, o) => twoNumbers(r, o),
  render(item) {
    return eq(`${quadText(1, item.p + item.q, item.p * item.q)} = (x + ${box()})(x + ${box()})`);
  },
  worked() {
    return worked(eq("x² − x − 6 = (x + −3)(x + 2)") +
      say("Product −6, sum −1: the pair is −3 and 2. So (x − 3)(x + 2). Check: x² + 2x − 3x − 6 = x² − x − 6."));
  },
  key(item) {
    return [want.num(item.p), want.num(item.q)];
  },
  answer(item) {
    return [`${bracket(1, item.p)}${bracket(1, item.q)}`];
  },
};

const fcSolve = {
  id: "qd-fsolve",
  group: "qd-factor",
  label: "Solve by factorising",
  blurb: "A product is 0 only if one of its brackets is 0.",
  heading: "Factorisation: solving the equation",
  instruction: () =>
    "Factorise the left side. Two brackets multiplied make 0 only if ONE of them is 0 — so set each bracket to 0 " +
    "and solve it: x + 3 = 0 gives x = −3. Notice each root is the bracket's number with its sign CHANGED. Write the " +
    "smaller root first.",
  cols: 1,
  defaultCount: 4,
  make: (r, o) => twoNumbers(r, o),
  render(item) {
    const { p, q } = item;
    return eq(`${quadText(1, p + q, p * q)} = 0`) +
      eq(`(x + ${box()})(x + ${box()}) = 0, &nbsp; so x = ${box()} or x = ${box()}`);
  },
  worked() {
    return worked(eq("x² + 5x + 6 = 0") +
      say("(x + 2)(x + 3) = 0. Either x + 2 = 0, so x = −2, or x + 3 = 0, so x = −3. Smaller first: x = −3 or x = −2. " +
        "Check: 9 − 15 + 6 = 0."));
  },
  key(item) {
    const { p, q } = item;
    return [p, q, -q, -p].map((v) => want.num(v));
  },
  answer(item) {
    return [`${bracket(1, item.p)}${bracket(1, item.q)} = 0; x = ${num(-item.q)} or ${num(-item.p)}`];
  },
};

const fcLeading = {
  id: "qd-leading",
  group: "qd-factor",
  label: "A number in front of x²",
  blurb: "Product a × c, sum b — then split the middle term.",
  heading: "Factorisation: when x² has a number in front",
  hardest: true,
  minLevel: "stretch",
  instruction: () =>
    "For ax² + bx + c, look for two numbers whose product is a × c (not just c) and whose sum is b. Split the " +
    "middle term into those two, factorise in pairs, and the brackets appear. Give the product a × c, the two " +
    "numbers (smaller first), and then the roots (smaller first) — a root may be a fraction: write it like 1/2.",
  cols: 1,
  defaultCount: 3,
  make(r) {
    /* (ax + m)(x + n): a × c = a·m·n, the two numbers are m and a·n */
    for (;;) {
      const a = r.int(2, 3);
      const m = r.pick([-5, -3, -1, 1, 3, 5]), n = r.pick([-4, -3, -2, -1, 1, 2, 3, 4]);
      if (gcd(a, m) !== 1 || m === a * n || m + a * n === 0) continue;
      const u = Math.min(m, a * n), v = Math.max(m, a * n);
      /* roots −m/a and −n */
      const roots = [[-m, a], [-n, 1]].sort((x, y) => x[0] / x[1] - y[0] / y[1]);
      return { a, m, n, b: a * n + m, c: m * n, u, v, roots };
    }
  },
  render(item) {
    return eq(`${quadText(item.a, item.b, item.c)} = 0`) +
      eq(`a × c = ${box()} &nbsp; the two numbers: ${box()} and ${box()}`) +
      eq(`x = ${box()} or x = ${box()}`);
  },
  worked() {
    return worked(eq("2x² + 7x + 3 = 0") +
      say("a × c = 6 and the sum is 7: the numbers are 1 and 6. Split: 2x² + x + 6x + 3 = x(2x + 1) + 3(2x + 1) = " +
        "(2x + 1)(x + 3). So 2x + 1 = 0 gives x = −1/2, and x + 3 = 0 gives x = −3. Smaller first: −3 or −1/2."));
  },
  key(item) {
    return [want.num(item.a * item.c), want.num(item.u), want.num(item.v), ...item.roots.map(([n, d]) => want.frac(n, d))];
  },
  answer(item) {
    return [`a × c = ${num(item.a * item.c)}: ${num(item.u)} and ${num(item.v)}; ${bracket(item.a, item.m)}${bracket(1, item.n)} = 0`];
  },
};

/* ═══ THE FORMULA ══════════════════════════════════════════════════════════*/

/** a quadratic with rational roots: a(x − r1)(x − r2), or (ax − p)(x − q) at Stretch. */
function withRoots(r, o) {
  const t = tier(o);
  for (;;) {
    if (t === "stretch" && r.chance(0.5)) {
      const a = r.int(2, 4), p = r.pick([-5, -3, -1, 1, 3, 5, 7]), q = r.int(-5, 5);
      if (gcd(a, p) !== 1 || p === a * q) continue;
      const b = -(a * q + p), c = p * q;
      const roots = [[p, a], [q, 1]].sort((x, y) => x[0] / x[1] - y[0] / y[1]);
      return { a, b, c, roots, disc: b * b - 4 * a * c };
    }
    const a = t === "gentle" ? 1 : r.pick([1, 1, 2, 3]);
    const r1 = t === "gentle" ? r.int(-6, 3) : r.int(-7, 7);
    const r2 = r1 + r.int(1, 8);
    const b = -a * (r1 + r2), c = a * r1 * r2;
    if (Math.abs(b) > 30 || Math.abs(c) > 60) continue;
    return { a, b, c, roots: [[r1, 1], [r2, 1]], disc: b * b - 4 * a * c };
  }
}

const fmName = {
  id: "qd-abc",
  group: "qd-formula",
  label: "Name a, b and c",
  blurb: "The numbers in front of x², of x, and the one on its own.",
  heading: "The formula: a, b and c",
  instruction: () =>
    "Write the equation as ax² + bx + c = 0, with everything on the left and the x² term positive. Then a is the " +
    "number in front of x², b the number in front of x, and c the number on its own — each WITH its sign. A term " +
    "that is missing has 0; x² alone has a = 1.",
  cols: 1,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const a = t === "gentle" ? r.int(1, 3) : r.int(1, 6);
    let b = t === "gentle" ? r.int(1, 9) : r.int(-9, 9);
    let c = t === "gentle" ? r.int(1, 9) : r.int(-9, 9);
    if (b === 0 && c === 0) c = r.int(1, 9);
    const form = t === "gentle" ? 0 : t === "middle" ? r.pick([0, 0, 1]) : r.pick([0, 1, 2]);
    return { a, b, c, form };
  },
  render(item) {
    const { a, b, c, form } = item;
    /* 0: as it stands · 1: the number moved across · 2: the x term and the number moved across */
    const one = (k, s) => (Math.abs(k) === 1 && s ? "" : Math.abs(k));
    const text = form === 0 ? `${quadText(a, b, c)} = 0`
      : form === 1 ? `${quadText(a, b, 0)} = ${num(-c)}`
        : `${a === 1 ? "" : a}x² = ${b === 0 ? "" : `${b > 0 ? "−" : ""}${one(b, true)}x`}${c === 0 ? "" : `${b === 0 ? (c > 0 ? "−" : "") : c > 0 ? " − " : " + "}${Math.abs(c)}`}`;
    return eq(text) + eq(`a = ${box()} &nbsp; b = ${box()} &nbsp; c = ${box()}`);
  },
  worked() {
    return worked(eq("3x² = 5x + 2") +
      say("Bring everything to the left: 3x² − 5x − 2 = 0. So a = 3, b = −5 and c = −2 — the signs go with the numbers."));
  },
  key(item) {
    return [item.a, item.b, item.c].map((v) => want.num(v));
  },
  answer(item) {
    return [`${quadText(item.a, item.b, item.c)} = 0: a = ${num(item.a)}, b = ${num(item.b)}, c = ${num(item.c)}`];
  },
};

const ROOTS = ["two roots", "one root (the same twice)", "no real roots"];

const fmDisc = {
  id: "qd-disc",
  group: "qd-formula",
  label: "The discriminant",
  blurb: "b² − 4ac: plus, two roots; 0, one; minus, none.",
  heading: "The formula: the discriminant",
  instruction: () =>
    "b² − 4ac is the number under the square root in the formula, called the DISCRIMINANT. Work it out (b² is " +
    "never minus; mind the sign of 4ac). If it is positive there are two roots; if it is 0 the ± adds nothing, so " +
    "one root; if it is negative it has no square root, so no real roots.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    for (;;) {
      const kind = r.int(0, 2);
      const a = t === "gentle" ? 1 : r.int(1, 3);
      const b = t === "gentle" ? r.int(1, 8) : r.int(-8, 8);
      let c;
      if (kind === 1) { if ((b * b) % (4 * a)) continue; c = (b * b) / (4 * a); } else c = t === "gentle" ? r.int(1, 12) : r.int(-10, 12);
      if (c === 0) continue;
      const d = b * b - 4 * a * c;
      if ((kind === 0 && d <= 0) || (kind === 2 && d >= 0)) continue;
      return { a, b, c, d, kind };
    }
  },
  render(item) {
    return eq(`${quadText(item.a, item.b, item.c)} = 0`) + eq(`b² − 4ac = ${box()}`) + ask(`So it has ${tick(...ROOTS)}`);
  },
  worked() {
    return worked(eq("x² + 4x + 5 = 0") +
      say("a = 1, b = 4, c = 5. b² − 4ac = 16 − 20 = −4. A negative number has no square root, so there are no real roots."));
  },
  key(item) {
    return [want.num(item.d), want.tick(item.kind)];
  },
  answer(item) {
    return [`${num(item.d)}: ${ROOTS[item.kind]}`];
  },
};

const fmPieces = {
  id: "qd-pieces",
  group: "qd-formula",
  label: "The formula, piece by piece",
  blurb: "−b, the discriminant, its square root, and 2a.",
  heading: "The formula: one piece at a time",
  instruction: () =>
    "x = (−b ± √(b² − 4ac)) ÷ 2a. Work out its four pieces before putting them together: −b (change b's sign), the " +
    "discriminant b² − 4ac, the square root of that, and 2a. Then the roots are (−b − root) ÷ 2a and " +
    "(−b + root) ÷ 2a — smaller first.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    for (;;) { const q = withRoots(r, { ...o, level: tier(o) === "stretch" ? "middle" : o.level }); if (q.disc > 0) return q; }
  },
  render(item) {
    return eq(`${quadText(item.a, item.b, item.c)} = 0`) +
      eq(`−b = ${box()} &nbsp; b² − 4ac = ${box()} &nbsp; √ of it = ${box()} &nbsp; 2a = ${box()}`) +
      eq(`x = ${box()} or x = ${box()}`);
  },
  worked() {
    return worked(eq("x² − 5x + 6 = 0") +
      say("a = 1, b = −5, c = 6. −b = 5. b² − 4ac = 25 − 24 = 1, and its square root is 1. 2a = 2. " +
        "So x = (5 − 1) ÷ 2 = 2 or x = (5 + 1) ÷ 2 = 3."));
  },
  key(item) {
    return [want.num(-item.b), want.num(item.disc), want.num(Math.sqrt(item.disc)), want.num(2 * item.a), ...item.roots.map(([n, d]) => want.frac(n, d))];
  },
  answer(item) {
    return [`−b = ${num(-item.b)}, disc ${item.disc}, √ = ${Math.sqrt(item.disc)}, 2a = ${2 * item.a}; x = ${item.roots.map(([n, d]) => (d === 1 ? num(n) : `${num(n)}/${d}`)).join(" or ")}`];
  },
};

const fmSolve = {
  id: "qd-fmsolve",
  group: "qd-formula",
  label: "Solve by the formula",
  blurb: "Everything at once: x = (−b ± √(b² − 4ac)) ÷ 2a.",
  heading: "The formula: solving",
  instruction: () =>
    "Name a, b and c, put them into x = (−b ± √(b² − 4ac)) ÷ 2a, and work both answers out. Write the smaller root " +
    "first; a root that is a fraction is written like 3/2. Check one root by putting it back into the equation.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    for (;;) { const q = withRoots(r, o); if (q.disc > 0) return q; }
  },
  render(item) {
    return eq(`${quadText(item.a, item.b, item.c)} = 0`) + eq(`x = ${box()} or x = ${box()}`);
  },
  worked() {
    return worked(eq("2x² − 5x − 3 = 0") +
      say("a = 2, b = −5, c = −3. b² − 4ac = 25 + 24 = 49, whose root is 7. x = (5 ± 7) ÷ 4: that is −2 ÷ 4 = −1/2, " +
        "or 12 ÷ 4 = 3."));
  },
  key(item) {
    return item.roots.map(([n, d]) => want.frac(n, d));
  },
  answer(item) {
    return [`x = ${item.roots.map(([n, d]) => (d === 1 ? num(n) : `${num(n)}/${d}`)).join(" or ")}`];
  },
};

/* ═══ PO-SHEN LOH'S METHOD ═════════════════════════════════════════════════*/

/** x² + bx + c with whole roots the same distance u either side of a whole middle m. */
function lohOf(r, o) {
  const t = tier(o);
  const m = t === "gentle" ? r.int(1, 6) : r.int(-7, 7);
  let u = r.int(1, t === "gentle" ? 4 : 7);
  /* a root of 0 leaves no number term, and the method nothing to do */
  while (u === Math.abs(m)) u = r.int(1, t === "gentle" ? 4 : 7);
  return { m, u, b: -2 * m, c: m * m - u * u };
}

const lhMiddle = {
  id: "qd-loh-mid",
  group: "qd-loh",
  label: "The middle of the roots",
  blurb: "The roots add up to −b, so their middle is −b ÷ 2.",
  heading: "Po-Shen Loh's method: the middle",
  instruction: () =>
    "If x² + bx + c = (x − r)(x − s), then the two roots r and s ADD to −b and MULTIPLY to c. Two numbers that add " +
    "to −b have their middle (their average) at −b ÷ 2. Write the sum, the product, and the middle.",
  cols: 1,
  defaultCount: 4,
  make: (r, o) => lohOf(r, o),
  render(item) {
    return eq(`${quadText(1, item.b, item.c)} = 0`) +
      eq(`the roots add to ${box()} &nbsp; multiply to ${box()} &nbsp; their middle is ${box()}`);
  },
  worked() {
    return worked(eq("x² − 8x + 12 = 0") +
      say("b is −8, so the roots add to 8; they multiply to 12. Two numbers that add to 8 are centred on 4 — the middle is 4."));
  },
  key(item) {
    return [want.num(-item.b), want.num(item.c), want.num(item.m)];
  },
  answer(item) {
    return [`sum ${num(-item.b)}, product ${num(item.c)}, middle ${num(item.m)}`];
  },
};

const lhOut = {
  id: "qd-loh-u",
  group: "qd-loh",
  label: "How far out",
  blurb: "(m − u)(m + u) = m² − u² must be c: so u² = m² − c.",
  heading: "Po-Shen Loh's method: how far either side",
  instruction: () =>
    "The roots are the same distance u either side of the middle m: they are m − u and m + u. Their product is " +
    "(m − u)(m + u) = m² − u² — and that must be c. So u² = m² − c. Work out m², then u², then u.",
  cols: 1,
  defaultCount: 4,
  make: (r, o) => lohOf(r, o),
  render(item) {
    return eq(`${quadText(1, item.b, item.c)} = 0, &nbsp; middle m = ${num(item.m)}`) +
      eq(`m² = ${box()} &nbsp; u² = m² − c = ${box()} &nbsp; u = ${box()}`);
  },
  worked() {
    return worked(eq("x² − 8x + 12 = 0, &nbsp; middle m = 4") +
      say("m² = 16. The product must be 12, so 16 − u² = 12: u² = 4 and u = 2. The roots are 2 either side of 4."));
  },
  key(item) {
    return [want.num(item.m * item.m), want.num(item.u * item.u), want.num(item.u)];
  },
  answer(item) {
    return [`m² = ${item.m * item.m}, u² = ${item.u * item.u}, u = ${item.u}`];
  },
};

const lhSolve = {
  id: "qd-loh-solve",
  group: "qd-loh",
  label: "Solve by Po-Shen Loh's method",
  blurb: "m, then u, then m − u and m + u.",
  heading: "Po-Shen Loh's method: solving",
  instruction: () =>
    "Three steps, and nothing to guess. The middle m is −b ÷ 2. Then u² = m² − c gives u. The roots are m − u and " +
    "m + u — smaller first. Check: they add to −b and multiply to c.",
  cols: 1,
  defaultCount: 4,
  make: (r, o) => lohOf(r, o),
  render(item) {
    return eq(`${quadText(1, item.b, item.c)} = 0`) +
      eq(`m = ${box()} &nbsp; u = ${box()} &nbsp; x = ${box()} or x = ${box()}`);
  },
  worked() {
    return worked(eq("x² + 6x + 5 = 0") +
      say("m = −6 ÷ 2 = −3. u² = 9 − 5 = 4, so u = 2. The roots are −3 − 2 = −5 and −3 + 2 = −1. Check: they add to " +
        "−6 and multiply to 5."));
  },
  key(item) {
    return [want.num(item.m), want.num(item.u), want.num(item.m - item.u), want.num(item.m + item.u)];
  },
  answer(item) {
    return [`m = ${num(item.m)}, u = ${item.u}; x = ${num(item.m - item.u)} or ${num(item.m + item.u)}`];
  },
};

const lhHarder = {
  id: "qd-loh-hard",
  group: "qd-loh",
  label: "Divide through first; halves",
  blurb: "Make x² stand alone; a middle may be a half.",
  heading: "Po-Shen Loh's method: harder ones",
  hardest: true,
  instruction: () =>
    "The method needs x² on its own, so if there is a number in front of x², DIVIDE every term by it first. And " +
    "when b is odd the middle is a half — the method does not mind: write halves as fractions, like 5/2, and u as " +
    "a fraction too. Then m − u and m + u as before.",
  cols: 1,
  defaultCount: 3,
  make(r) {
    for (;;) {
      /* roots r1 < r2 of different parity (so the middle is a half), times a */
      const a = r.pick([1, 2, 3]);
      const r1 = r.int(-6, 5), gap = r.pick([1, 3, 5, 7]);
      const r2 = r1 + gap;
      if (r1 === 0 || r2 === 0) continue;
      return { a, r1, r2, b: -(r1 + r2), c: r1 * r2, gap };
    }
  },
  render(item) {
    const { a, b, c } = item;
    return eq(`${quadText(a, a * b, a * c)} = 0`) +
      (a === 1 ? "" : eq(`divide by ${a}: &nbsp; x² + ${box()}x + ${box()} = 0`)) +
      eq(`m = ${box()} &nbsp; u = ${box()} &nbsp; x = ${box()} or x = ${box()}`);
  },
  worked() {
    return worked(eq("2x² − 10x + 12 = 0") +
      say("Divide by 2: x² − 5x + 6 = 0. m = 5/2. u² = 25/4 − 6 = 1/4, so u = 1/2. The roots are 5/2 − 1/2 = 2 and " +
        "5/2 + 1/2 = 3."));
  },
  key(item) {
    const { a, b, c, r1, r2, gap } = item;
    const first = a === 1 ? [] : [want.num(b), want.num(c)];
    return [...first, want.frac(r1 + r2, 2), want.frac(gap, 2), want.num(r1), want.num(r2)];
  },
  answer(item) {
    return [`x² ${item.b < 0 ? "−" : "+"} ${Math.abs(item.b)}x ${item.c < 0 ? "−" : "+"} ${Math.abs(item.c)} = 0; m = ${item.r1 + item.r2}/2, u = ${item.gap}/2; x = ${num(item.r1)} or ${num(item.r2)}`];
  },
};

export const QD_FACTOR_EXERCISES = [fcExpand, fcNumbers, fcFactorise, fcSolve, fcLeading];
export const QD_MORE_EXERCISES = [fmName, fmDisc, fmPieces, fmSolve, lhMiddle, lhOut, lhSolve, lhHarder];
