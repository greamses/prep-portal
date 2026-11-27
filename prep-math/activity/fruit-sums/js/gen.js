/* ============================================================================
   FRUIT SUMS — the algebra generator
   ----------------------------------------------------------------------------
   Every puzzle is a system of linear equations with ONE whole-number answer,
   made fresh from a seed. The fruits are only how it is drawn: underneath,
   a puzzle is

        a + b = 20          { k: coefficient, v: which unknown, s: +1 | -1 }
        a + c = 16          per term, and a total per equation
        b + c = 6

   and the page can draw a term as fruits (2a = two apples side by side) or as
   letters. Nothing here touches the DOM, so it runs under node for testing.

   HOW "ONE ANSWER" IS MADE SURE OF. The values are picked first, then the
   equations are built round them, so the answer is always whole and positive.
   The equations' coefficients form a square matrix; if its determinant is not
   zero there is exactly one solution, and it is the one we picked. Every
   puzzle is checked that way before it is returned.

   Each level has a CAP on any line's total (the last line may go to 1.5 ×
   the cap), so Hard stays hard by its shape, not by big numbers.

   THE LEVELS differ in how many fruits, how big a group of one fruit can be
   (single / double / triple), whether a term can be taken away, and whether
   a line may hold THREE fruits (`wide`).

   NO LINE EVER HOLDS ONE FRUIT ALONE (the user's rule: "2a should not be
   alone"). Every line has two or more different fruits and none gives a fruit
   away on its own (a+b, a+c, b+c), so the fruits are always found together,
   by comparing lines.
   ========================================================================== */

export const LEVELS = [
  { id: "starter", name: "Starter", fruits: 2, maxK: 2, minus: false, wide: false, max: 10, cap: 40, ask: "sum" },
  { id: "easy", name: "Easy", fruits: 3, maxK: 2, minus: false, wide: false, max: 12, cap: 60, ask: "sum" },
  { id: "medium", name: "Medium", fruits: 3, maxK: 3, minus: true, wide: true, max: 15, cap: 80, ask: "sum" },
  { id: "hard", name: "Hard", fruits: 4, maxK: 3, minus: true, wide: true, max: 12, cap: 60, ask: "times" },
];

export const levelOf = (id) => LEVELS.find((l) => l.id === id) || LEVELS[0];

/* mulberry32 — a small seeded random, so a puzzle can be made again */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (R, lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
function shuffle(R, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Determinant of a small integer matrix (Bareiss: exact, no fractions). */
export function det(M) {
  const n = M.length;
  const A = M.map((r) => r.slice());
  let sign = 1;
  let prev = 1;
  for (let k = 0; k < n - 1; k++) {
    if (A[k][k] === 0) {
      const sw = A.findIndex((r, i) => i > k && r[k] !== 0);
      if (sw < 0) return 0;
      [A[k], A[sw]] = [A[sw], A[k]];
      sign = -sign;
    }
    for (let i = k + 1; i < n; i++) {
      for (let j = k + 1; j < n; j++) {
        A[i][j] = (A[i][j] * A[k][k] - A[i][k] * A[k][j]) / prev;
      }
    }
    prev = A[k][k];
  }
  return sign * A[n - 1][n - 1];
}

/* An equation's row of coefficients, signed. */
const rowOf = (eq, n) => {
  const r = new Array(n).fill(0);
  for (const t of eq.terms) r[t.v] += t.s * t.k;
  return r;
};

const totalOf = (terms, vals) => terms.reduce((s, t) => s + t.s * t.k * vals[t.v], 0);

/* Build one equation over the unknowns in `vars` (in that order). The first
   term is always added; later ones may be taken away when the level allows,
   so long as the total stays above nought. */
function equation(R, L, vars, vals) {
  for (let tries = 0; tries < 40; tries++) {
    const terms = shuffle(R, vars).map((v, i) => ({
      v,
      k: int(R, 1, L.maxK),
      s: i > 0 && L.minus && R() < 0.35 ? -1 : 1,
    }));
    const total = totalOf(terms, vals);
    if (total > 0) return { terms, total };
  }
  /* all added: always positive */
  const terms = vars.map((v) => ({ v, k: int(R, 1, L.maxK), s: 1 }));
  return { terms, total: totalOf(terms, vals) };
}

/* Every line two or more fruits. Starts from the round of pairs
   (a+b, b+c, c+a, …) so every fruit is used, then lets the level's groups
   and signs loose on it. */
function lines(R, L, vals) {
  const n = vals.length;
  return [...Array(n).keys()].map((i) => {
    const vars = [i, (i + 1) % n];
    if (L.wide && n > 2 && R() < 0.4) vars.push((i + 2) % n);
    return equation(R, L, vars, vals);
  });
}

/* The last line: the question. Adds the fruits (and at Hard, one product of
   two of them) and asks for the total. */
function question(R, L, vals) {
  const n = vals.length;
  const order = shuffle(R, [...Array(n).keys()]);
  const vars = order.slice(0, Math.min(n, 3));
  const terms = vars.map((v, i) => ({ v, k: i === 0 ? 1 : int(R, 1, Math.min(2, L.maxK)), s: 1 }));
  if (L.ask === "times" && terms.length >= 2) {
    /* the last two become one product: a + b × c */
    const b = terms.pop();
    const a = terms.pop();
    terms.push({ v: a.v, k: 1, s: 1, times: b.v });
  }
  const answer = terms.reduce((s, t) => s + t.k * vals[t.v] * (t.times != null ? vals[t.times] : 1), 0);
  return { terms, answer };
}

/**
 * makePuzzle({ level, seed, fruits }) → {
 *   level, seed, n,
 *   fruits:   ids of the fruits used, in unknown order (fruits[v]),
 *   letters:  'a', 'b', … in the same order,
 *   values:   the answer, values[v],
 *   equations:[{ terms:[{v,k,s}], total }],
 *   question: { terms:[{v,k,s,times?}], answer }
 * }
 * `fruits` is the full list of ids to choose from.
 */
export function makePuzzle({ level = "starter", seed = 1, fruits }) {
  const L = levelOf(level);
  const R = rng(seed);
  const n = L.fruits;
  for (let attempt = 0; attempt < 400; attempt++) {
    /* distinct values make the puzzle fairer: two fruits worth the same
       look like a mistake to a child even when they are not */
    const pool = shuffle(R, [...Array(L.max).keys()].map((i) => i + 1));
    const vals = pool.slice(0, n);
    const eqs = shuffle(R, lines(R, L, vals));
    const M = eqs.map((e) => rowOf(e, n));
    if (det(M) === 0) continue;
    /* never one fruit alone on a line */
    if (M.some((r) => r.filter((x) => x !== 0).length < 2)) continue;
    /* keep totals within a child's reach: every line, and the last one too */
    if (eqs.some((e) => e.total > L.cap)) continue;
    const q = question(R, L, vals);
    if (q.answer > L.cap * 1.5) continue;
    const chosen = shuffle(R, fruits).slice(0, n);
    return {
      level: L.id,
      seed,
      n,
      fruits: chosen,
      letters: "abcd".slice(0, n).split(""),
      values: vals,
      equations: eqs,
      question: q,
    };
  }
  throw new Error("fruit-sums: no puzzle found");
}

/** Solve a puzzle's equations exactly (Gauss–Jordan on fractions) — the test
 *  that the answer is the only one. Returns null if not uniquely solvable. */
export function solve(p) {
  const n = p.n;
  const A = p.equations.map((e) => [...rowOf(e, n), e.total]);
  for (let c = 0; c < n; c++) {
    const r = A.findIndex((row, i) => i >= c && Math.abs(row[c]) > 1e-12);
    if (r < 0) return null;
    [A[c], A[r]] = [A[r], A[c]];
    const d = A[c][c];
    A[c] = A[c].map((x) => x / d);
    for (let i = 0; i < n; i++) {
      if (i === c) continue;
      const f = A[i][c];
      A[i] = A[i].map((x, j) => x - f * A[c][j]);
    }
  }
  return A.map((r) => Math.round(r[n] * 1e9) / 1e9);
}

/** The value of one term (what goes in the box above it), sign left off. */
export const termValue = (t, values) =>
  t.k * values[t.v] * (t.times != null ? values[t.times] : 1);
