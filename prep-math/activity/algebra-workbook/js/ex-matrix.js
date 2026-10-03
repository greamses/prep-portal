/* ============================================================================
   Algebra Workbook — CHAPTER 9, the advanced methods: THREE and FOUR unknowns
   ----------------------------------------------------------------------------
   Two letters can be done by substitution, elimination or a graph. Three or
   four letters want a method that runs the same way however many there are:

     Cramer's rule          the determinant method of two letters, grown: D is
                            the square of the numbers in front of the letters,
                            Dx swaps the answers into the x column (and Dy, Dz,
                            Dw likewise), and x = Dx ÷ D. A 3 × 3 determinant
                            is worked along its top row — each number times the
                            2 × 2 left when its row and column are crossed out,
                            signs + − + — and a 4 × 4 the same way, each minor
                            now a 3 × 3 (its top row has noughts, so only two
                            minors are needed)
     Gaussian elimination   the equations as rows of numbers (an augmented
                            matrix); take multiples of the top row off the rows
                            under it until x is gone from them, then the same
                            with the second row for y, … until the rows make a
                            staircase; then BACK-SUBSTITUTE from the bottom row

   Every system is made from its answer. For Gaussian elimination the matrix
   is built as L × U (L with ones down its diagonal, both whole numbers), so
   the textbook steps — no row swaps, take (number ÷ pivot) × the pivot row —
   meet only whole numbers, and the staircase reached IS U. For Cramer's rule
   Dx is always D × x, so D divides it exactly whatever D is.
   ========================================================================== */

import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq">${html}</p>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;
const num = (n) => (n < 0 ? `−${-n}` : String(n));
const LETTERS = ["x", "y", "z", "w"];

/* ── numbers ───────────────────────────────────────────────────────────── */

/** The determinant of a square of numbers, along the top row. */
export function det(M) {
  if (M.length === 1) return M[0][0];
  if (M.length === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
  return M[0].reduce((s, a, j) => s + (a ? (j % 2 ? -1 : 1) * a * det(minorOf(M, 0, j)) : 0), 0);
}
/** M with row i and column j crossed out. */
const minorOf = (M, i, j) => M.filter((_, r) => r !== i).map((row) => row.filter((_, c) => c !== j));
/** M with column j replaced by b. */
const swapCol = (M, j, b) => M.map((row, i) => row.map((v, c) => (c === j ? b[i] : v)));
const times = (M, v) => M.map((row) => row.reduce((s, a, j) => s + a * v[j], 0));
const mul = (P, Q) => P.map((row) => Q[0].map((_, j) => row.reduce((s, a, k) => s + a * Q[k][j], 0)));

/* ── drawing ───────────────────────────────────────────────────────────── */

/** A determinant: n × n numbers (or boxes) between two bars. */
function detHtml(M, label = "") {
  const n = M.length;
  const cells = M.flat().map((v) => `<span class="dt-det__c">${typeof v === "number" ? num(v) : v}</span>`).join("");
  return `<span class="dt-sq">${label}<span class="dt-det" style="grid-template-columns: repeat(${n}, auto)">${cells}</span></span>`;
}
/** An augmented matrix: the coefficients, a bar, the answers — in brackets. */
function augHtml(M, b) {
  const n = M[0].length;
  const cell = (v, rhs) => `<span class="ge-c${rhs ? " ge-c--rhs" : ""}">${typeof v === "number" ? num(v) : v}</span>`;
  const cells = M.map((row, i) => row.map((v) => cell(v, false)).join("") + cell(b[i], true)).join("");
  return `<span class="ge-mat" style="grid-template-columns: repeat(${n}, auto) auto">${cells}</span>`;
}
/** One term of an equation. */
function term(k, letter, first) {
  if (k === 0) return "";
  const size = Math.abs(k) === 1 ? "" : String(Math.abs(k));
  if (first) return `${k < 0 ? "−" : ""}${size}${letter}`;
  return ` ${k < 0 ? "−" : "+"} ${size}${letter}`;
}
function equation(row, rhs) {
  let s = "";
  row.forEach((k, j) => { s += term(k, LETTERS[j], !s); });
  return `${s || "0"} = ${num(rhs)}`;
}
const system = (M, b) => `<div class="dt-pair">${M.map((row, i) => eq(`(${i + 1}) &nbsp; ${equation(row, b[i])}`)).join("")}</div>`;
/* D, Dx, Dy …: said outright to the typesetter (it would set "Dx" as D times x) */
const D = (sub = "") => `<span class="dt-name" data-tex="D${sub ? `_{${sub}}` : ""}">D${sub ? `<sub>${sub}</sub>` : ""}</span>`;
const solveBoxes = (n) => eq(LETTERS.slice(0, n).map((l) => `${l} = ${box()}`).join(" &nbsp;&nbsp; "));

/* ── making systems ────────────────────────────────────────────────────── */

const pickFrom = (r, list) => list[r.int(0, list.length - 1)];
function entryPool(t) {
  return t === "gentle" ? [0, 1, 1, 2, 2, 3, 4] : t === "middle" ? [0, 1, 2, 3, 4, -1, -2, 5] : [0, 1, 2, 3, 4, 5, -1, -2, -3, -4];
}
function answers(r, t, n) {
  return Array.from({ length: n }, () => (t === "stretch" ? r.int(-4, 6) : r.int(1, t === "gentle" ? 5 : 6)));
}

/** n × n with D not 0; a top row with noughts at 4 × 4 so two minors do. */
function cramerSystem(r, o, n) {
  const t = tier(o);
  const pool = entryPool(t);
  for (let g = 0; g < 2000; g++) {
    const M = Array.from({ length: n }, () => Array.from({ length: n }, () => pickFrom(r, pool)));
    if (n === 4) {
      const keep = [0, 1, 2, 3].sort(() => r.int(0, 1) - 0.5).slice(0, 2);
      M[0] = M[0].map((v, j) => (keep.includes(j) ? v || pickFrom(r, pool.filter(Boolean)) : 0));
    }
    const d = det(M);
    if (d === 0 || Math.abs(d) > (n === 3 ? 60 : 80)) continue;
    if (t === "gentle" && d < 0) continue;
    const v = answers(r, t, n);
    const b = times(M, v);
    if (b.some((x) => Math.abs(x) > 99)) continue;
    if (t !== "stretch" && b.some((x) => x < 0)) continue;
    return { M, b, v, D: d };
  }
  return { M: [[1, 1, 1], [0, 2, 5], [2, 5, -1]], b: [6, -4, 27], v: [5, 3, -2], D: -21 };
}

/** n × n as L × U, so Gaussian elimination meets only whole numbers. */
function gaussSystem(r, o, n) {
  const t = tier(o);
  const lPool = t === "gentle" ? [1, 2] : t === "middle" ? [-2, -1, 1, 2, 3] : [-3, -2, -1, 1, 2, 3];
  const dPool = t === "gentle" ? [1] : t === "middle" ? [1, 1, 2] : [1, 2, 3, -1, -2];
  const uPool = t === "gentle" ? [0, 1, 2] : t === "middle" ? [-2, -1, 0, 1, 2, 3] : [-3, -2, -1, 0, 1, 2, 3, 4];
  for (let g = 0; g < 2000; g++) {
    const L = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : j < i ? pickFrom(r, lPool) : 0)));
    const U = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? pickFrom(r, dPool) : j > i ? pickFrom(r, uPool) : 0)));
    const M = mul(L, U);
    if (M.flat().some((x) => Math.abs(x) > (t === "gentle" ? 12 : 20))) continue;
    const v = answers(r, t, n);
    const b = times(M, v);
    if (b.some((x) => Math.abs(x) > 99)) continue;
    if (t === "gentle" && b.some((x) => x < 0)) continue;
    return { L, U, M, b, v, c: times(U, v) };
  }
  return { L: [[1, 0, 0], [2, 1, 0], [1, 1, 1]], U: [[1, 1, 1], [0, 1, 2], [0, 0, 1]], M: [[1, 1, 1], [2, 3, 4], [1, 2, 4]], b: [6, 20, 17], v: [1, 2, 3], c: [6, 8, 3] };
}

/** The elimination, step by step: multipliers and the rows after each stage. */
function eliminate(M, b) {
  const A = M.map((row, i) => [...row, b[i]]);
  const n = M.length;
  const stages = [];
  for (let k = 0; k < n - 1; k++) {
    const mult = [];
    for (let i = k + 1; i < n; i++) {
      const l = A[i][k] / A[k][k];
      mult.push(l);
      A[i] = A[i].map((v, j) => v - l * A[k][j]);
    }
    stages.push({ mult, rows: A.slice(k + 1).map((row) => row.slice(k + 1)) });
  }
  return { stages, U: A };
}

export const MX_GROUPS = [
  { id: "mx-cramer", label: "Cramer's rule: three and four unknowns", blurb: "D, then Dx, Dy, Dz (and Dw) — x = Dx ÷ D, however many letters." },
  { id: "mx-gauss", label: "Gaussian elimination", blurb: "Rows of numbers into a staircase, then back-substitute from the bottom." },
];

/* ═══ CRAMER'S RULE ════════════════════════════════════════════════════════*/

const cr3Value = {
  id: "mx-det3",
  group: "mx-cramer",
  label: "A 3 × 3 determinant",
  blurb: "Along the top row: + a × its minor − b × its minor + c × its minor.",
  heading: "Working out a 3 × 3 determinant",
  instruction: () =>
    "Go along the top row. For each number, cross out its row and its column: the 2 × 2 square left is its " +
    "MINOR — work it out (top-left × bottom-right − top-right × bottom-left). Then the determinant is the first " +
    "number × its minor, MINUS the second × its minor, PLUS the third × its minor: the signs go + − +.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const { M } = cramerSystem(r, o, 3);
    return { M, minors: [0, 1, 2].map((j) => det(minorOf(M, 0, j))), D: det(M) };
  },
  render(item) {
    const [a, b, c] = item.M[0];
    return ask(detHtml(item.M)) +
      eq(`minors: under ${num(a)} ${box()} &nbsp; under ${num(b)} ${box()} &nbsp; under ${num(c)} ${box()}`) +
      eq(`${D()} = ${num(a)} × minor − ${num(b)} × minor + ${num(c)} × minor = ${box()}`);
  },
  worked() {
    const M = [[2, 1, 3], [0, 4, 1], [1, 2, 2]];
    return worked(ask(detHtml(M)) +
      say("Under 2, cross out its row and column: |4 1; 2 2| = 8 − 2 = 6. Under 1: |0 1; 1 2| = 0 − 1 = −1. " +
        "Under 3: |0 4; 1 2| = 0 − 4 = −4. So D = 2 × 6 − 1 × (−1) + 3 × (−4) = 12 + 1 − 12 = 1."));
  },
  key(item) {
    return [...item.minors.map((m) => want.num(m)), want.num(item.D)];
  },
  answer(item) {
    return [`minors ${item.minors.map(num).join(", ")}; D = ${num(item.D)}`];
  },
};

const cr3Solve = {
  id: "mx-cramer3",
  group: "mx-cramer",
  label: "Three unknowns by Cramer's rule",
  blurb: "Four 3 × 3 determinants, three divisions.",
  heading: "Cramer's rule: three equations, three unknowns",
  instruction: () =>
    `${D()} is the 3 × 3 of the numbers in front of x, y and z. For ${D("x")}, put the right-hand answers in the x column ` +
    `instead; ${D("y")} and ${D("z")} likewise for their columns. Work out all four, then x = ${D("x")} ÷ ${D()}, ` +
    `y = ${D("y")} ÷ ${D()}, z = ${D("z")} ÷ ${D()}. Check in all three equations.`,
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const s = cramerSystem(r, o, 3);
    return { ...s, Ds: [0, 1, 2].map((j) => det(swapCol(s.M, j, s.b))) };
  },
  render(item) {
    return system(item.M, item.b) +
      eq(`${D()} = ${box()} &nbsp; ${D("x")} = ${box()} &nbsp; ${D("y")} = ${box()} &nbsp; ${D("z")} = ${box()}`) + solveBoxes(3);
  },
  worked() {
    return worked(eq("x + y + z = 6 &nbsp; 2y + 5z = −4 &nbsp; 2x + 5y − z = 27") +
      say("D = −21. Swapping the answers 6, −4, 27 into each column in turn: Dx = −105, Dy = −63, Dz = 42. " +
        "So x = −105 ÷ −21 = 5, y = −63 ÷ −21 = 3, z = 42 ÷ −21 = −2. Check: 5 + 3 − 2 = 6."));
  },
  key(item) {
    return [want.num(item.D), ...item.Ds.map((d) => want.num(d)), ...item.v.map((v) => want.num(v))];
  },
  answer(item) {
    return [`D = ${num(item.D)}; Dx, Dy, Dz = ${item.Ds.map(num).join(", ")}`, item.v.map((v, i) => `${LETTERS[i]} = ${num(v)}`).join(", ")];
  },
};

const cr4Value = {
  id: "mx-det4",
  group: "mx-cramer",
  label: "A 4 × 4 determinant",
  blurb: "The top row has two noughts: only two 3 × 3 minors to work out.",
  heading: "Working out a 4 × 4 determinant",
  hardest: true,
  instruction: () =>
    "The same as a 3 × 3, one size up: along the top row, each number times its minor (now a 3 × 3), with " +
    "signs + − + − across the row. A nought times anything is nought, so only the top row's two non-zero " +
    "numbers need their minors. Watch the sign that goes with each one's PLACE in the row.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const { M } = cramerSystem(r, o, 4);
    const cols = M[0].map((v, j) => (v ? j : -1)).filter((j) => j >= 0);
    return { M, cols, minors: cols.map((j) => det(minorOf(M, 0, j))), D: det(M) };
  },
  render(item) {
    const parts = item.cols.map((j) => `under ${num(item.M[0][j])} (place ${j + 1}, sign ${j % 2 ? "−" : "+"}) ${box()}`);
    return ask(detHtml(item.M)) + eq(`minors: ${parts.join(" &nbsp; ")}`) + eq(`${D()} = ${box()}`);
  },
  worked() {
    return worked(say("If the top row is 0, 2, 0, 3: only the 2 (place 2, sign −) and the 3 (place 4, sign −) count. " +
      "Work out each one's 3 × 3 minor the way the last section did; then D = −2 × its minor − 3 × its minor."));
  },
  key(item) {
    return [...item.minors.map((m) => want.num(m)), want.num(item.D)];
  },
  answer(item) {
    return [`minors ${item.minors.map(num).join(", ")}; D = ${num(item.D)}`];
  },
};

const cr4Solve = {
  id: "mx-cramer4",
  group: "mx-cramer",
  label: "Four unknowns by Cramer's rule",
  blurb: "Five 4 × 4 determinants, four divisions.",
  heading: "Cramer's rule: four equations, four unknowns",
  hardest: true,
  instruction: () =>
    `Exactly the three-letter rule with a fourth letter, w. ${D()} is the 4 × 4 in front of the letters; ` +
    `${D("x")}, ${D("y")}, ${D("z")} and ${D("w")} each put the answers into their own column. Then each letter is its ` +
    `D ÷ ${D()}. Choose the row or column with the most noughts to work each determinant along.`,
  cols: 1,
  defaultCount: 1,
  make(r, o) {
    const s = cramerSystem(r, o, 4);
    return { ...s, Ds: [0, 1, 2, 3].map((j) => det(swapCol(s.M, j, s.b))) };
  },
  render(item) {
    return system(item.M, item.b) +
      eq(`${D()} = ${box()} &nbsp; ${D("x")} = ${box()} &nbsp; ${D("y")} = ${box()} &nbsp; ${D("z")} = ${box()} &nbsp; ${D("w")} = ${box()}`) +
      solveBoxes(4);
  },
  key(item) {
    return [want.num(item.D), ...item.Ds.map((d) => want.num(d)), ...item.v.map((v) => want.num(v))];
  },
  answer(item) {
    return [`D = ${num(item.D)}; Dx, Dy, Dz, Dw = ${item.Ds.map(num).join(", ")}`, item.v.map((v, i) => `${LETTERS[i]} = ${num(v)}`).join(", ")];
  },
};

/* ═══ GAUSSIAN ELIMINATION ═════════════════════════════════════════════════*/

const geStep = {
  id: "mx-ge-step",
  group: "mx-gauss",
  label: "One row operation",
  blurb: "Row 2 take away a multiple of row 1, so x is gone from it.",
  heading: "Gaussian elimination: one row operation",
  instruction: () =>
    "Each row is an equation: the numbers in front of x, y and z, a bar, then the answer. To get rid of x " +
    "from row 2, take away the right multiple of row 1 — (row 2's first number ÷ row 1's first number) times " +
    "row 1 — from EVERY number in row 2, the answer too. Its first number becomes 0.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const s = gaussSystem(r, o, 3);
    const l = s.M[1][0] / s.M[0][0];
    return { ...s, l, row: [1, 2].map((j) => s.M[1][j] - l * s.M[0][j]), rhs: s.b[1] - l * s.b[0] };
  },
  render(item) {
    return ask(augHtml(item.M, item.b)) +
      eq(`row 2 → row 2 − ${box()} × row 1`) +
      ask(`new row 2: ${augHtml([[0, box(), box()]], [box()])}`);
  },
  worked() {
    return worked(ask(augHtml([[1, 1, 1], [2, 3, 4]], [6, 20])) +
      say("Row 2 starts with 2 and row 1 with 1, so take 2 × row 1 away: 2 − 2 = 0, 3 − 2 = 1, 4 − 2 = 2, and " +
        "20 − 12 = 8. The new row 2 is 0, 1, 2 | 8 — the equation y + 2z = 8, with no x in it."));
  },
  key(item) {
    return [want.num(item.l), ...item.row.map((v) => want.num(v)), want.num(item.rhs)];
  },
  answer(item) {
    return [`× ${num(item.l)}: 0, ${item.row.map(num).join(", ")} | ${num(item.rhs)}`];
  },
};

const ge3 = {
  id: "mx-ge3",
  group: "mx-gauss",
  label: "Three unknowns by Gaussian elimination",
  blurb: "Clear x from rows 2 and 3, then y from row 3, then back-substitute.",
  heading: "Gaussian elimination: three equations",
  instruction: () =>
    "Write the system as rows. STEP 1: take multiples of row 1 from rows 2 and 3 so both start with 0. " +
    "STEP 2: take a multiple of the NEW row 2 from the new row 3 so it has 0 in the y place too. The rows now " +
    "make a staircase. BACK-SUBSTITUTE: the bottom row gives z, the row above it y, the top row x.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const s = gaussSystem(r, o, 3);
    return { ...s, ...eliminate(s.M, s.b) };
  },
  render(item) {
    return system(item.M, item.b) +
      eq(`step 1: row 2 − ${box()} × row 1, &nbsp; row 3 − ${box()} × row 1`) +
      ask(`now: ${augHtml([[0, box(), box()], [0, box(), box()]], [box(), box()])}`) +
      eq(`step 2: row 3 − ${box()} × row 2`) +
      ask(`staircase: ${augHtml([[0, 0, box()]], [box()])}`) +
      solveBoxes(3);
  },
  worked() {
    return worked(ask(augHtml([[1, 1, 1], [2, 3, 4], [1, 2, 4]], [6, 20, 17])) +
      say("Step 1: row 2 − 2 × row 1 gives 0 1 2 | 8; row 3 − 1 × row 1 gives 0 1 3 | 11. Step 2: row 3 − 1 × row 2 " +
        "gives 0 0 1 | 3. So z = 3; then y + 2 × 3 = 8, y = 2; then x + 2 + 3 = 6, x = 1."));
  },
  key(item) {
    const [s1, s2] = item.stages;
    const r1 = s1.rows.flat();     // two rows of [y, z | rhs]
    const r2 = s2.rows.flat();     // [z | rhs]
    return [...s1.mult, ...r1, ...s2.mult, ...r2, ...item.v].map((v) => want.num(v));
  },
  answer(item) {
    const [s1, s2] = item.stages;
    return [`× ${s1.mult.map(num).join(", ")} → ${s1.rows.map((row) => row.map(num).join(" ")).join(" / ")}`,
      `× ${num(s2.mult[0])} → ${s2.rows[0].map(num).join(" ")}`,
      item.v.map((v, i) => `${LETTERS[i]} = ${num(v)}`).join(", ")];
  },
};

const geBack4 = {
  id: "mx-ge-back4",
  group: "mx-gauss",
  label: "Back-substitution: four unknowns",
  blurb: "A staircase already made: w, then z, then y, then x.",
  heading: "Gaussian elimination: back-substitution with four unknowns",
  instruction: () =>
    "These rows are already a staircase: the bottom row has only w in it, the next only z and w, and so on. " +
    "Start at the bottom: find w. Put it into the row above to find z, then both into the next row for y, and " +
    "all three into the top row for x.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const s = gaussSystem(r, o, 4);
    return { U: s.U, c: s.c, v: s.v };
  },
  render(item) {
    return ask(augHtml(item.U, item.c)) +
      eq(`w = ${box()} &nbsp;&nbsp; z = ${box()} &nbsp;&nbsp; y = ${box()} &nbsp;&nbsp; x = ${box()}`);
  },
  worked() {
    return worked(ask(augHtml([[1, 1, 0, 2], [0, 1, 1, 1], [0, 0, 2, 1], [0, 0, 0, 1]], [9, 7, 7, 3])) +
      say("Bottom row: w = 3. Row 3: 2z + 3 = 7, so z = 2. Row 2: y + 2 + 3 = 7, so y = 2. Row 1: x + 2 + 6 = 9, " +
        "so x = 1."));
  },
  key(item) {
    return [item.v[3], item.v[2], item.v[1], item.v[0]].map((v) => want.num(v));
  },
  answer(item) {
    return [`w = ${num(item.v[3])}, z = ${num(item.v[2])}, y = ${num(item.v[1])}, x = ${num(item.v[0])}`];
  },
};

const ge4 = {
  id: "mx-ge4",
  group: "mx-gauss",
  label: "Four unknowns by Gaussian elimination",
  blurb: "Three rounds of clearing, a four-step staircase, then back up.",
  heading: "Gaussian elimination: four equations",
  hardest: true,
  instruction: () =>
    "The same as three, one round longer. Clear x from rows 2, 3 and 4 using row 1; clear y from rows 3 and 4 " +
    "using the new row 2; clear z from row 4 using the new row 3. Write the staircase you reach, then " +
    "back-substitute from the bottom.",
  cols: 1,
  defaultCount: 1,
  make(r, o) {
    const s = gaussSystem(r, o, 4);
    return { ...s, ...eliminate(s.M, s.b) };
  },
  render(item) {
    return system(item.M, item.b) +
      ask(`the staircase: ${augHtml([
        [item.M[0][0], item.M[0][1], item.M[0][2], item.M[0][3]],
        [0, box(), box(), box()],
        [0, 0, box(), box()],
        [0, 0, 0, box()],
      ], [item.b[0], box(), box(), box()])}`) +
      solveBoxes(4);
  },
  key(item) {
    const U = item.U;
    const cells = [U[1][1], U[1][2], U[1][3], U[1][4], U[2][2], U[2][3], U[2][4], U[3][3], U[3][4]];
    return [...cells, ...item.v].map((v) => want.num(v));
  },
  answer(item) {
    const U = item.U;
    return [`${U.slice(1).map((row, i) => row.slice(i + 1).map(num).join(" ")).join(" / ")}`, item.v.map((v, i) => `${LETTERS[i]} = ${num(v)}`).join(", ")];
  },
};

export const MX_EXERCISES = [cr3Value, cr3Solve, cr4Value, cr4Solve, geStep, ge3, geBack4, ge4];
