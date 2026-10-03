/* ============================================================================
   Algebra Workbook — CHAPTER 12: MATRICES
   ----------------------------------------------------------------------------
   A matrix is a block of numbers in rows and columns, treated as one thing.
   Chapter 9 used them to solve equations; this chapter is the matrices
   themselves, a step at a time.

   THE BASICS
     order and elements    rows × columns, and the number in row i, column j
     adding, taking away   the same place with the same place
     times a number        every element (and 2A + B, 3A − 2B)
     the transpose         rows become columns

   MULTIPLYING
     a row times a column  pair them off, multiply, add: one number
     which can multiply    m × n times n × p gives m × p — the inner numbers
                           must match; AB may exist when BA does not
     the product           every row of A with every column of B
     AB and BA             (Middle+) usually different: matrices do not commute

   DETERMINANT, ADJOINT, INVERSE
     determinant           ad − bc; 0 means SINGULAR — no inverse
     adjoint (2 × 2)       swap the main diagonal, change the other's signs
     inverse (2 × 2)       adjoint ÷ determinant
     dividing              (Middle+) there is no ÷: A "over" B is A × B⁻¹
     cofactors (3 × 3)     (Middle+) a minor with its sign from the + − + board
     adjoint (3 × 3)       (Stretch) every cofactor, then transposed
     inverse (3 × 3)       (Stretch) adjoint ÷ determinant

   USING THEM
     solving equations     AX = B, so X = A⁻¹B

   Entries of an inverse may be fractions (want.frac). The 3 × 3 inverses use
   determinant ±1 so the working, not the fractions, is the lesson.
   ========================================================================== */

import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq mt-eq">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const tier = (o) => levelOf(o).id;
const num = (n) => (n < 0 ? `−${-n}` : String(n));

/* ── numbers ───────────────────────────────────────────────────────────── */

const rand = (r, t) => (t === "gentle" ? r.int(0, 6) : t === "middle" ? r.int(-5, 7) : r.int(-9, 9));
const matrix = (r, t, rows, cols) => Array.from({ length: rows }, () => Array.from({ length: cols }, () => rand(r, t)));
const mul = (P, Q) => P.map((row) => Q[0].map((_, j) => row.reduce((s, a, k) => s + a * Q[k][j], 0)));
const add = (P, Q, s = 1) => P.map((row, i) => row.map((v, j) => v + s * Q[i][j]));
const scale = (k, P) => P.map((row) => row.map((v) => k * v));
const transpose = (P) => P[0].map((_, j) => P.map((row) => row[j]));
const det2 = ([[a, b], [c, d]]) => a * d - b * c;
const adj2 = ([[a, b], [c, d]]) => [[d, -b], [-c, a]];
const minor = (M, i, j) => M.filter((_, r) => r !== i).map((row) => row.filter((_, c) => c !== j));
const det3 = (M) => M[0].reduce((s, a, j) => s + (j % 2 ? -1 : 1) * a * det2(minor(M, 0, j)), 0);
const cof = (M, i, j) => ((i + j) % 2 ? -1 : 1) * det2(minor(M, i, j));
const adj3 = (M) => transpose(M.map((row, i) => row.map((_, j) => cof(M, i, j))));

/* ── drawing ───────────────────────────────────────────────────────────── */

/** A matrix in square brackets; entries are numbers or boxes. */
function mat(M) {
  const cells = M.flat().map((v) => `<span class="mt-c">${typeof v === "number" ? num(v) : v}</span>`).join("");
  return `<span class="mt-mat wb-mathbox" style="grid-template-columns: repeat(${M[0].length}, auto)">${cells}</span>`;
}
const boxes = (rows, cols) => Array.from({ length: rows }, () => Array.from({ length: cols }, () => box()));
const flat = (M) => M.flat().map((v) => want.num(v));
const list = (M) => M.map((row) => row.map(num).join(" ")).join(" / ");
/** A⁻¹, Aᵀ and friends, said outright. */
const tx = (tex, text) => `<span data-tex="${tex}">${text}</span>`;
const INV = (L) => tx(`${L}^{-1}`, `${L}⁻¹`);

export const MT_GROUPS = [
  { id: "mt-basics", chapter: "Chapter 12 · Matrices", label: "Matrices: the basics", blurb: "Order, elements, adding, a number times a matrix, the transpose." },
  { id: "mt-mult", label: "Multiplying matrices", blurb: "Rows of the first with columns of the second." },
  { id: "mt-inverse", label: "Determinant, adjoint and inverse", blurb: "ad − bc, the adjoint, and the matrix that undoes another." },
  { id: "mt-use", label: "Using matrices", blurb: "A pair of equations as AX = B." },
];

/* ═══ THE BASICS ═══════════════════════════════════════════════════════════*/

const mtOrder = {
  id: "mt-order",
  group: "mt-basics",
  label: "Order and elements",
  blurb: "Rows × columns; the number in row i, column j.",
  heading: "Matrices: order and elements",
  instruction: () =>
    "The ORDER of a matrix is its number of rows × its number of columns — rows first, always (rows go across, " +
    "columns go down). Each number is an ELEMENT, named by its row then its column: the element in row 2, column 1 " +
    "is the second row's first number.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const rows = r.int(2, 3), cols = r.int(2, t === "gentle" ? 3 : 4);
    const M = matrix(r, t, rows, cols);
    const i = r.int(0, rows - 1), j = r.int(0, cols - 1);
    return { M, i, j };
  },
  render(item) {
    return eq(`A = ${mat(item.M)}`) +
      eq(`order: ${box()} × ${box()} &nbsp; the element in row ${item.i + 1}, column ${item.j + 1} is ${box()}`);
  },
  worked() {
    return worked(eq(`A = ${mat([[2, 5, 1], [0, 3, 4]])}`) +
      say("2 rows and 3 columns: the order is 2 × 3. Row 2, column 3 is the second row's third number, 4."));
  },
  key(item) {
    return [want.num(item.M.length), want.num(item.M[0].length), want.num(item.M[item.i][item.j])];
  },
  answer(item) {
    return [`${item.M.length} × ${item.M[0].length}; ${num(item.M[item.i][item.j])}`];
  },
};

const mtAdd = {
  id: "mt-add",
  group: "mt-basics",
  label: "Adding and taking away",
  blurb: "The same place with the same place.",
  heading: "Matrices: adding and taking away",
  instruction: () =>
    "Two matrices of the SAME order are added by adding the numbers in the same places — top-left with top-left, " +
    "and so on. Taking away works the same way. (Matrices of different orders cannot be added at all.)",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const rows = 2, cols = t === "gentle" ? 2 : r.int(2, 3);
    return { A: matrix(r, t, rows, cols), B: matrix(r, t, rows, cols), s: r.chance(0.5) ? 1 : -1 };
  },
  render(item) {
    const { A, B, s } = item;
    return eq(`${mat(A)} ${s > 0 ? "+" : "−"} ${mat(B)} = ${mat(boxes(A.length, A[0].length))}`);
  },
  worked() {
    return worked(eq(`${mat([[2, 5], [1, 3]])} + ${mat([[4, 1], [0, 6]])} = ${mat([[6, 6], [1, 9]])}`) +
      say("2 + 4, 5 + 1, 1 + 0 and 3 + 6, each in its own place."));
  },
  key: (item) => flat(add(item.A, item.B, item.s)),
  answer: (item) => [list(add(item.A, item.B, item.s))],
};

const mtScalar = {
  id: "mt-scalar",
  group: "mt-basics",
  label: "A number times a matrix",
  blurb: "Every element is multiplied — then 2A + B, 3A − 2B.",
  heading: "Matrices: multiplying by a number",
  instruction: () =>
    "A number in front of a matrix multiplies EVERY element. For something like 2A − B, do the multiplying first " +
    "and then add or take away place by place.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const A = matrix(r, t, 2, 2), B = matrix(r, t, 2, 2);
    const k = r.int(2, t === "gentle" ? 4 : 5);
    const m = t === "gentle" ? 0 : r.pick([-3, -2, -1, 1, 2]);
    return { A, B, k, m };
  },
  render(item) {
    const { A, B, k, m } = item;
    const what = m === 0 ? `${k}A` : `${k}A ${m < 0 ? "−" : "+"} ${Math.abs(m) === 1 ? "" : Math.abs(m)}B`;
    return eq(`A = ${mat(A)}${m === 0 ? "" : ` &nbsp; B = ${mat(B)}`}`) + eq(`${what} = ${mat(boxes(2, 2))}`);
  },
  worked() {
    return worked(eq(`A = ${mat([[1, 4], [2, 0]])} &nbsp; 3A = ${mat([[3, 12], [6, 0]])}`) +
      say("Three lots of every element: 3 × 1, 3 × 4, 3 × 2 and 3 × 0."));
  },
  key: (item) => flat(item.m === 0 ? scale(item.k, item.A) : add(scale(item.k, item.A), scale(item.m, item.B))),
  answer: (item) => [list(item.m === 0 ? scale(item.k, item.A) : add(scale(item.k, item.A), scale(item.m, item.B)))],
};

const mtTranspose = {
  id: "mt-transpose",
  group: "mt-basics",
  label: "The transpose",
  blurb: "Rows become columns: a 2 × 3 becomes a 3 × 2.",
  heading: "Matrices: the transpose",
  instruction: () =>
    "The TRANSPOSE of A turns its rows into columns: the first row is written down as the first column, the second " +
    "row as the second column. So a 2 × 3 matrix becomes a 3 × 2.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    return { A: matrix(r, t, 2, t === "gentle" ? 2 : 3) };
  },
  render(item) {
    const T = transpose(item.A);
    return eq(`A = ${mat(item.A)} &nbsp; ${tx("A^{T}", "Aᵀ")} = ${mat(boxes(T.length, T[0].length))}`);
  },
  worked() {
    return worked(eq(`A = ${mat([[1, 2, 3], [4, 5, 6]])} &nbsp; ${tx("A^{T}", "Aᵀ")} = ${mat([[1, 4], [2, 5], [3, 6]])}`) +
      say("The first row 1 2 3 goes down as the first column; the second row 4 5 6 as the second."));
  },
  key: (item) => flat(transpose(item.A)),
  answer: (item) => [list(transpose(item.A))],
};

/* ═══ MULTIPLYING ══════════════════════════════════════════════════════════*/

const mtRowCol = {
  id: "mt-rowcol",
  group: "mt-mult",
  label: "A row times a column",
  blurb: "Pair them off, multiply each pair, add.",
  heading: "Multiplying: a row times a column",
  instruction: () =>
    "A row times a column gives ONE number. Pair the numbers off — first with first, second with second — " +
    "multiply each pair, and add the answers. Every bigger multiplication is this, done again and again.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    const n = t === "gentle" ? 2 : r.int(2, 3);
    return { R: matrix(r, t, 1, n), C: matrix(r, t, n, 1) };
  },
  render(item) {
    return eq(`${mat(item.R)} ${mat(item.C)} = ${box()}`);
  },
  worked() {
    return worked(eq(`${mat([[2, 3]])} ${mat([[4], [5]])} = 2 × 4 + 3 × 5 = 23`) +
      say("First with first: 2 × 4 = 8. Second with second: 3 × 5 = 15. Added: 23."));
  },
  key: (item) => [want.num(mul(item.R, item.C)[0][0])],
  answer: (item) => [`${item.R[0].map((v, i) => `${num(v)} × ${num(item.C[i][0])}`).join(" + ")} = ${num(mul(item.R, item.C)[0][0])}`],
};

const mtCan = {
  id: "mt-can",
  group: "mt-mult",
  label: "Which can be multiplied",
  blurb: "m × n times n × p: the inner numbers match, the outer give the order.",
  heading: "Multiplying: the orders",
  instruction: () =>
    "AB can be worked out only if A has as many COLUMNS as B has ROWS. Write the two orders side by side, " +
    "m × n and n × p: the two inner numbers must be the same, and the two outer numbers are the order of the " +
    "answer, m × p. Then try them the other way round — BA may not exist even when AB does.",
  cols: 1,
  defaultCount: 4,
  make(r) {
    const m = r.int(1, 3), n = r.int(2, 3), p = r.int(1, 3);
    return { m, n, p };
  },
  render(item) {
    const { m, n, p } = item;
    return ask(`A is ${m} × ${n} and B is ${n} × ${p}.`) +
      eq(`AB is ${box()} × ${box()}`) + ask(`BA ${tick("can be worked out", "cannot be worked out")}`);
  },
  worked() {
    return worked(say("A is 2 × 3 and B is 3 × 1. Side by side: 2 × 3, 3 × 1 — the inner 3s match, so AB exists and is " +
      "2 × 1. The other way: 3 × 1, 2 × 3 — inner numbers 1 and 2 do not match, so BA cannot be worked out."));
  },
  key: (item) => [want.num(item.m), want.num(item.p), want.tick(item.p === item.m ? 0 : 1)],
  answer: (item) => [`AB is ${item.m} × ${item.p}; BA ${item.p === item.m ? "can" : "cannot"} be worked out`],
};

const mtMult = {
  id: "mt-mult",
  group: "mt-mult",
  label: "Multiply two matrices",
  blurb: "Row i of A with column j of B goes in row i, column j.",
  heading: "Multiplying two matrices",
  instruction: () =>
    "The element in row i, column j of AB is ROW i of A times COLUMN j of B (pair off, multiply, add). So the " +
    "top-left answer is the first row with the first column; the top-right is the first row with the second " +
    "column; and so on. Cover the rest with your fingers and do one at a time.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const wide = t === "stretch" && r.chance(0.5);
    const small = t === "gentle" ? "gentle" : "middle";
    return wide ? { A: matrix(r, small, 2, 3), B: matrix(r, small, 3, 2) } : { A: matrix(r, small, 2, 2), B: matrix(r, small, 2, 2) };
  },
  render(item) {
    return eq(`${mat(item.A)} ${mat(item.B)} = ${mat(boxes(2, 2))}`);
  },
  worked() {
    return worked(eq(`${mat([[1, 2], [3, 4]])} ${mat([[5, 6], [7, 8]])} = ${mat([[19, 22], [43, 50]])}`) +
      say("Top-left: 1 × 5 + 2 × 7 = 19. Top-right: 1 × 6 + 2 × 8 = 22. Bottom-left: 3 × 5 + 4 × 7 = 43. " +
        "Bottom-right: 3 × 6 + 4 × 8 = 50."));
  },
  key: (item) => flat(mul(item.A, item.B)),
  answer: (item) => [list(mul(item.A, item.B))],
};

const SAME = ["AB = BA", "AB and BA are different"];

const mtCommute = {
  id: "mt-commute",
  group: "mt-mult",
  label: "AB and BA",
  blurb: "The order of multiplying matters.",
  heading: "Multiplying: AB against BA",
  hardest: true,
  instruction: () =>
    "With numbers, 3 × 5 is 5 × 3. With matrices the order usually MATTERS. Work out AB and then BA, and say " +
    "whether they came out the same. (The identity matrix I — 1s down the main diagonal, 0s elsewhere — is the " +
    "one that never changes anything: AI = IA = A.)",
  cols: 1,
  defaultCount: 2,
  make(r) {
    const A = matrix(r, "gentle", 2, 2);
    const B = r.chance(0.25) ? [[1, 0], [0, 1]] : matrix(r, "gentle", 2, 2);
    return { A, B };
  },
  render(item) {
    return eq(`A = ${mat(item.A)} &nbsp; B = ${mat(item.B)}`) +
      eq(`AB = ${mat(boxes(2, 2))} &nbsp; BA = ${mat(boxes(2, 2))}`) + ask(tick(...SAME));
  },
  key(item) {
    const AB = mul(item.A, item.B), BA = mul(item.B, item.A);
    return [...flat(AB), ...flat(BA), want.tick(JSON.stringify(AB) === JSON.stringify(BA) ? 0 : 1)];
  },
  answer(item) {
    return [`AB: ${list(mul(item.A, item.B))}`, `BA: ${list(mul(item.B, item.A))}`];
  },
};

/* ═══ DETERMINANT, ADJOINT, INVERSE ════════════════════════════════════════*/

const SING = ["has an inverse", "is singular — no inverse"];

const mtDet = {
  id: "mt-det",
  group: "mt-inverse",
  label: "The determinant, and singular matrices",
  blurb: "ad − bc; if it is 0 the matrix has no inverse.",
  heading: "The determinant of a 2 × 2 matrix",
  instruction: () =>
    "The determinant of a 2 × 2 matrix is (top-left × bottom-right) − (top-right × bottom-left): ad − bc. If it " +
    "comes to 0 the matrix is called SINGULAR, and it has no inverse — there is nothing to divide by.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    if (r.chance(0.3)) {
      const a = r.int(1, 4), b = r.int(1, 4), k = r.int(2, 3);
      return { A: [[a, b], [k * a, k * b]] };
    }
    return { A: matrix(r, t, 2, 2) };
  },
  render(item) {
    return eq(`A = ${mat(item.A)} &nbsp; det A = ${box()}`) + ask(`A ${tick(...SING)}`);
  },
  worked() {
    return worked(eq(`A = ${mat([[2, 4], [3, 6]])}`) +
      say("det A = 2 × 6 − 4 × 3 = 12 − 12 = 0. The matrix is singular: it has no inverse."));
  },
  key: (item) => [want.num(det2(item.A)), want.tick(det2(item.A) === 0 ? 1 : 0)],
  answer: (item) => [`det = ${num(det2(item.A))}: ${SING[det2(item.A) === 0 ? 1 : 0]}`],
};

/** A 2 × 2 with a determinant that is not 0 (±1 when `unit`). */
function invertible(r, t, unit = false) {
  for (;;) {
    const A = matrix(r, t === "gentle" ? "gentle" : "middle", 2, 2);
    const d = det2(A);
    if (unit ? Math.abs(d) === 1 : d !== 0 && Math.abs(d) <= 12) return A;
  }
}

const mtAdj = {
  id: "mt-adj",
  group: "mt-inverse",
  label: "The adjoint of a 2 × 2",
  blurb: "Swap the main diagonal; change the signs of the other two.",
  heading: "The adjoint of a 2 × 2 matrix",
  instruction: () =>
    "The ADJOINT (or adjugate) of a 2 × 2 matrix is made in two moves: SWAP the two numbers on the main diagonal " +
    "(top-left and bottom-right), and CHANGE THE SIGNS of the other two (they stay where they are).",
  cols: 2,
  defaultCount: 4,
  make: (r, o) => ({ A: invertible(r, tier(o)) }),
  render(item) {
    return eq(`A = ${mat(item.A)}`) + eq(`adj A = ${mat(boxes(2, 2))}`);
  },
  worked() {
    return worked(eq(`A = ${mat([[3, 1], [5, 2]])} &nbsp; adj A = ${mat([[2, -1], [-5, 3]])}`) +
      say("3 and 2 change places; 1 and 5 keep their places but become −1 and −5."));
  },
  key: (item) => flat(adj2(item.A)),
  answer: (item) => [list(adj2(item.A))],
};

/** n/d as a fraction answer, with the sign on top. */
const fr = (n, d) => (d < 0 ? want.frac(-n, -d) : want.frac(n, d));

const mtInv = {
  id: "mt-inv",
  group: "mt-inverse",
  label: "The inverse of a 2 × 2",
  blurb: "The adjoint, with every element divided by the determinant.",
  heading: "The inverse of a 2 × 2 matrix",
  instruction: () =>
    "The INVERSE of A is the matrix that undoes it: A times its inverse is the identity. Find the determinant, " +
    "write the adjoint, and divide every element of the adjoint by the determinant. An element that does not " +
    "divide exactly is left as a fraction, like 3/2.",
  cols: 1,
  defaultCount: 3,
  make: (r, o) => ({ A: invertible(r, tier(o), tier(o) === "gentle") }),
  render(item) {
    return eq(`A = ${mat(item.A)} &nbsp; det A = ${box()}`) + eq(`${INV("A")} = ${mat(boxes(2, 2))}`);
  },
  worked() {
    return worked(eq(`A = ${mat([[4, 3], [2, 2]])}`) +
      say("det A = 8 − 6 = 2. The adjoint is 2, −3 / −2, 4. Divide by 2: the inverse is 1, −3/2 / −1, 2."));
  },
  key(item) {
    const d = det2(item.A);
    return [want.num(d), ...adj2(item.A).flat().map((v) => fr(v, d))];
  },
  answer(item) {
    const d = det2(item.A);
    return [`det = ${num(d)}; inverse = (1/${num(d)}) × [${list(adj2(item.A))}]`];
  },
};

const mtDivide = {
  id: "mt-divide",
  group: "mt-inverse",
  label: "Dividing: multiply by the inverse",
  blurb: "There is no ÷ for matrices: A “over” B is A × B⁻¹.",
  heading: "Dividing by a matrix",
  hardest: true,
  instruction: () =>
    "Matrices have no division sign. To “divide” A by B, MULTIPLY A by the inverse of B — just as dividing by 2 " +
    "is multiplying by a half. Find the inverse of B first, then work out A times it (in that order: order " +
    "matters).",
  cols: 1,
  defaultCount: 2,
  make(r) {
    return { A: matrix(r, "gentle", 2, 2), B: invertible(r, "gentle", true) };
  },
  render(item) {
    return eq(`A = ${mat(item.A)} &nbsp; B = ${mat(item.B)}`) +
      eq(`${INV("B")} = ${mat(boxes(2, 2))} &nbsp; A${INV("B")} = ${mat(boxes(2, 2))}`);
  },
  worked() {
    return worked(eq(`A = ${mat([[2, 0], [1, 3]])} &nbsp; B = ${mat([[2, 1], [1, 1]])}`) +
      say("det B = 1, so its inverse is its adjoint: 1, −1 / −1, 2. Then A times it: top row 2 × 1 + 0 × −1 = 2 and " +
        "2 × −1 + 0 × 2 = −2; bottom row 1 − 3 = −2 and −1 + 6 = 5."));
  },
  key(item) {
    const d = det2(item.B);
    const Bi = scale(d, adj2(item.B));   // d is ±1, so 1/d = d
    return [...flat(Bi), ...flat(mul(item.A, Bi))];
  },
  answer(item) {
    const Bi = scale(det2(item.B), adj2(item.B));
    return [`B⁻¹: ${list(Bi)}`, `AB⁻¹: ${list(mul(item.A, Bi))}`];
  },
};

/** A 3 × 3 with small numbers and a determinant of ±1 (L × U, unit diagonals). */
function unit3(r) {
  for (;;) {
    const s = () => r.int(-2, 2);
    const L = [[1, 0, 0], [s(), 1, 0], [s(), s(), 1]];
    const U = [[1, s(), s()], [0, r.pick([1, -1]), s()], [0, 0, 1]];
    const M = mul(L, U);
    if (M.flat().every((v) => Math.abs(v) <= 6) && M.flat().filter((v) => v === 0).length <= 4) return M;
  }
}
const small3 = (r, t) => Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => (t === "stretch" ? r.int(-4, 5) : r.int(0, 5))));

const mtCof = {
  id: "mt-cof",
  group: "mt-inverse",
  label: "Minors and cofactors (3 × 3)",
  blurb: "Cross out the row and column; then the sign from the + − + board.",
  heading: "Minors and cofactors",
  hardest: true,
  instruction: () =>
    "The MINOR of an element is the determinant of the 2 × 2 left when its row and its column are crossed out. " +
    "Its COFACTOR is the minor with a sign: + if (row number + column number) is even, − if it is odd — a " +
    "chessboard of signs starting with + in the top-left corner.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const M = small3(r, tier(o));
    return { M, i: r.int(0, 2), j: r.int(0, 2) };
  },
  render(item) {
    const { M, i, j } = item;
    return eq(`A = ${mat(M)}`) +
      eq(`for the element in row ${i + 1}, column ${j + 1}: &nbsp; minor = ${box()} &nbsp; cofactor = ${box()}`);
  },
  worked() {
    return worked(eq(`A = ${mat([[2, 1, 3], [0, 4, 1], [1, 2, 2]])}`) +
      say("Row 1, column 2 (the 1): cross them out to leave 0 1 / 1 2, whose determinant is 0 − 1 = −1 — the minor. " +
        "1 + 2 = 3 is odd, so the sign is −: the cofactor is +1."));
  },
  key(item) {
    const m = det2(minor(item.M, item.i, item.j));
    return [want.num(m), want.num(cof(item.M, item.i, item.j))];
  },
  answer(item) {
    return [`minor ${num(det2(minor(item.M, item.i, item.j)))}, cofactor ${num(cof(item.M, item.i, item.j))}`];
  },
};

const mtAdj3 = {
  id: "mt-adj3",
  group: "mt-inverse",
  label: "The adjoint of a 3 × 3",
  blurb: "Every cofactor in its place — then transposed.",
  heading: "The adjoint of a 3 × 3 matrix",
  hardest: true,
  minLevel: "stretch",
  instruction: () =>
    "Work out the cofactor of EVERY element and write each in its element's place: that is the matrix of " +
    "cofactors. The adjoint is its TRANSPOSE — rows written as columns.",
  cols: 1,
  defaultCount: 1,
  make: (r) => ({ M: unit3(r) }),
  render(item) {
    return eq(`A = ${mat(item.M)}`) + eq(`cofactors = ${mat(boxes(3, 3))} &nbsp; adj A = ${mat(boxes(3, 3))}`);
  },
  key(item) {
    const C = item.M.map((row, i) => row.map((_, j) => cof(item.M, i, j)));
    return [...flat(C), ...flat(transpose(C))];
  },
  answer(item) {
    return [`adj A: ${list(adj3(item.M))}`];
  },
};

const mtInv3 = {
  id: "mt-inv3",
  group: "mt-inverse",
  label: "The inverse of a 3 × 3",
  blurb: "Adjoint ÷ determinant.",
  heading: "The inverse of a 3 × 3 matrix",
  hardest: true,
  minLevel: "stretch",
  instruction: () =>
    "As for a 2 × 2: the inverse is the adjoint with every element divided by the determinant. Find the " +
    "determinant along the top row (each element × its cofactor, added), then the adjoint, then divide. Check " +
    "one row: A times its inverse must give the identity.",
  cols: 1,
  defaultCount: 1,
  make: (r) => ({ M: unit3(r) }),
  render(item) {
    return eq(`A = ${mat(item.M)} &nbsp; det A = ${box()}`) + eq(`${INV("A")} = ${mat(boxes(3, 3))}`);
  },
  key(item) {
    const d = det3(item.M);
    return [want.num(d), ...flat(scale(d, adj3(item.M)))];   // d is ±1
  },
  answer(item) {
    const d = det3(item.M);
    return [`det = ${num(d)}; inverse: ${list(scale(d, adj3(item.M)))}`];
  },
};

/* ═══ USING THEM ═══════════════════════════════════════════════════════════*/

const term = (k, letter, first) => {
  const size = Math.abs(k) === 1 ? "" : String(Math.abs(k));
  return first ? `${k < 0 ? "−" : ""}${size}${letter}` : `${k < 0 ? "−" : "+"} ${size}${letter}`;
};

const mtSolve = {
  id: "mt-solve",
  group: "mt-use",
  label: "Solving equations with the inverse",
  blurb: "AX = B, so X = A⁻¹B.",
  heading: "Solving a pair of equations with a matrix",
  instruction: () =>
    "A pair of equations is one matrix equation AX = B: A holds the numbers in front of x and y, X is the column " +
    "x over y, and B the column of answers. Multiply both sides by the inverse of A and X = A⁻¹B. Find the " +
    "determinant of A, then x and y.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    for (;;) {
      const A = [[r.int(1, 5), r.int(1, 5)], [r.int(1, 5), r.int(1, 5)]];
      if (t === "stretch") { A[0][1] *= r.pick([1, -1]); A[1][0] *= r.pick([1, -1]); }
      const d = det2(A);
      if (d === 0 || (t === "gentle" && d < 0)) continue;
      const x = t === "stretch" ? r.int(-5, 6) : r.int(1, 6), y = t === "stretch" ? r.int(-5, 6) : r.int(1, 6);
      return { A, x, y, B: [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y] };
    }
  },
  render(item) {
    const { A, B } = item;
    return `<div class="dt-pair">${eq(`${term(A[0][0], "x", true)} ${term(A[0][1], "y", false)} = ${num(B[0])}`)}${eq(`${term(A[1][0], "x", true)} ${term(A[1][1], "y", false)} = ${num(B[1])}`)}</div>` +
      eq(`${mat(A)} ${mat([["x"], ["y"]])} = ${mat([[B[0]], [B[1]]])}`) +
      eq(`det A = ${box()} &nbsp; x = ${box()} &nbsp; y = ${box()}`);
  },
  worked() {
    return worked(eq(`${mat([[2, 1], [1, 3]])} ${mat([["x"], ["y"]])} = ${mat([[7], [11]])}`) +
      say("det A = 6 − 1 = 5, and the adjoint is 3, −1 / −1, 2. So X = (1/5) × (3 × 7 − 1 × 11 over −1 × 7 + 2 × 11) = " +
        "(1/5) × (10 over 15): x = 2, y = 3."));
  },
  key: (item) => [want.num(det2(item.A)), want.num(item.x), want.num(item.y)],
  answer: (item) => [`det = ${num(det2(item.A))}; x = ${num(item.x)}, y = ${num(item.y)}`],
};

export const MT_EXERCISES = [mtOrder, mtAdd, mtScalar, mtTranspose, mtRowCol, mtCan, mtMult, mtCommute, mtDet, mtAdj, mtInv, mtDivide, mtCof, mtAdj3, mtInv3, mtSolve];
