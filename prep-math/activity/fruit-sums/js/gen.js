/* ============================================================================
   FRUIT SUMS — the algebra generator
   ----------------------------------------------------------------------------
   Every puzzle is a set of equations with ONE whole-number answer, made fresh
   from a seed. The fruits are only how it is drawn: underneath, a puzzle is

        a + a + a = 30       a term: { v: which unknown, k: 1, s: +1 | -1,
        a + b + b = 20                 times?: a second unknown it multiplies }
        b + c × c = 14       and a total per equation

   A fruit that is there more than once is written out as separate terms —
   a + a + a, never "3a" — so every copy gets its own box above it (the
   user's design). A square is one term, b × b (drawn b² in letters), and so
   is a product, b × c. Nothing here touches the DOM, so it runs under node.

   TWO SHAPES OF PUZZLE

     chain   — the solvemoji shape. The first line is one fruit, repeated
               (c + c + c). Every line after brings in exactly ONE new fruit
               beside fruits already found (a + b + b, b + c + c). Solved top
               to bottom, one fruit a line. From Medium up the new fruit may
               come in squared (c × c) or multiplied by a known one (b × c),
               and known fruits may be taken away.
     tangle  — every line has two or more different fruits and none gives a
               fruit away on its own (a + b, a + c, b + c): the fruits are
               found together, by comparing lines. Always linear. Starter
               is ONLY tangles: it never opens on one fruit alone (b + b = 12)
               — the user's rule.

   HOW "ONE ANSWER" IS MADE SURE OF. The values are picked first and the
   lines built round them, so the answer is always whole and positive.
     tangle: the coefficients form a square matrix; a determinant that is not
             zero means exactly one solution.
     chain:  each line has one unknown left, always ADDED, so the line's total
             only grows as that fruit's value grows — one value fits, and
             `solveChain` proves it by finding it again.

   Each level has a CAP on any line's total (the last line may go to 1.5 ×
   the cap), so Hard stays hard by its shape, not by big numbers.
   ========================================================================== */

export const LEVELS = [
  { id: "starter", name: "Starter", fruits: 2, maxK: 3, minus: false, powers: "none", shapes: ["tangle"], max: 10, cap: 40, ask: "sum" },
  { id: "easy", name: "Easy", fruits: 3, maxK: 3, minus: false, powers: "none", shapes: ["chain", "tangle"], max: 12, cap: 60, ask: "sum" },
  { id: "medium", name: "Medium", fruits: 3, maxK: 3, minus: true, powers: "squares", shapes: ["chain", "chain", "tangle"], max: 10, cap: 80, ask: "square" },
  { id: "hard", name: "Hard", fruits: 4, maxK: 3, minus: true, powers: "all", shapes: ["chain", "chain", "tangle"], max: 10, cap: 60, ask: "times" },
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

/** The value of one term (what goes in the box above it), sign left off. */
export const termValue = (t, values) =>
  t.k * values[t.v] * (t.times != null ? values[t.times] : 1);

const totalOf = (terms, vals) => terms.reduce((s, t) => s + t.s * termValue(t, vals), 0);

/* A line's row of coefficients — only meaningful when it has no products. */
const isLinear = (eq) => eq.terms.every((t) => t.times == null);
const rowOf = (eq, n) => {
  const r = new Array(n).fill(0);
  for (const t of eq.terms) r[t.v] += t.s * t.k;
  return r;
};

/* A group is one fruit k times (written out as k terms), or one square /
   product term. */
const expand = (g) => (g.times != null ? [{ v: g.v, k: 1, s: g.s, times: g.times }] : Array.from({ length: g.k }, () => ({ v: g.v, k: 1, s: g.s })));

/* ── chain: the solvemoji shape ───────────────────────────────────────── */

/* The new fruit `nv`, brought in beside known fruits. Returns groups. */
function newGroup(R, L, nv, known, first) {
  const sq = L.powers !== "none" && !first && R() < 0.4;
  if (sq) {
    /* squared, or (at Hard) times a fruit already found */
    if (L.powers === "all" && known.length && R() < 0.5) return { v: nv, k: 1, s: 1, times: pick(R, known) };
    return { v: nv, k: 1, s: 1, times: nv };
  }
  return { v: nv, k: int(R, first ? 2 : 1, L.maxK), s: 1 };
}

function knownGroup(R, L, v, known) {
  const s = L.minus && R() < 0.35 ? -1 : 1;
  if (L.powers !== "none" && R() < 0.25) {
    const w = L.powers === "all" && known.length > 1 && R() < 0.5 ? pick(R, known.filter((x) => x !== v)) : v;
    return { v, k: 1, s, times: w };
  }
  return { v, k: int(R, 1, Math.min(2, L.maxK)), s };
}

function chain(R, L, vals) {
  const n = vals.length;
  const order = shuffle(R, [...Array(n).keys()]);   // the order fruits are found in
  const eqs = [];
  for (let i = 0; i < n; i++) {
    const nv = order[i];
    const known = order.slice(0, i);
    let groups;
    if (i === 0) {
      groups = [newGroup(R, L, nv, known, true)];
    } else {
      const olds = shuffle(R, known).slice(0, int(R, 1, Math.min(2, known.length)));
      const kg = olds.map((v) => knownGroup(R, L, v, known));
      const ng = newGroup(R, L, nv, known, false);
      /* a line never starts with a take-away: if any known part is taken
         away, the new fruit leads */
      groups = kg.some((g) => g.s < 0) ? [ng, ...kg] : [...kg, ng];
    }
    const terms = groups.flatMap(expand);
    eqs.push({ terms, total: totalOf(terms, vals) });
  }
  return eqs;
}

/* ── tangle: every line two or more fruits ────────────────────────────── */

function tangleLine(R, L, vars, vals) {
  for (let tries = 0; tries < 40; tries++) {
    const groups = shuffle(R, vars).map((v, i) => ({ v, k: int(R, 1, L.maxK), s: i > 0 && L.minus && R() < 0.35 ? -1 : 1 }));
    const terms = groups.flatMap(expand);
    const total = totalOf(terms, vals);
    if (total > 0) return { terms, total };
  }
  const terms = vars.map((v) => ({ v, k: 1, s: 1 }));
  return { terms, total: totalOf(terms, vals) };
}

function tangle(R, L, vals) {
  const n = vals.length;
  return shuffle(R, [...Array(n).keys()].map((i) => {
    const vars = [i, (i + 1) % n];
    if (L.powers !== "none" && n > 2 && R() < 0.4) vars.push((i + 2) % n);
    return tangleLine(R, L, vars, vals);
  }));
}

/* ── the last line: the question ──────────────────────────────────────── */

/* Adds two or three of the fruits and asks the total. From Medium up one
   part is a square (c + b × b), and at Hard it may be a product (a + b × c). */
function question(R, L, vals) {
  const n = vals.length;
  const vars = shuffle(R, [...Array(n).keys()]).slice(0, Math.min(n, 3));
  const groups = vars.map((v) => ({ v, k: int(R, 1, 2), s: 1 }));
  if (L.ask !== "sum") {
    const last = groups.pop();
    const other = groups.length ? groups[groups.length - 1].v : last.v;
    groups.push({ v: last.v, k: 1, s: 1, times: L.ask === "times" && R() < 0.5 ? other : last.v });
  }
  const terms = groups.flatMap(expand);
  return { terms, answer: totalOf(terms, vals) };
}

/* ── proving one answer ───────────────────────────────────────────────── */

/**
 * Find the fruits line by line: a line with exactly one fruit not yet found
 * is tried with every value 1…limit. If every fruit is found that way and
 * each line allowed exactly ONE value, the answer is unique. Returns the
 * values, or null when the lines cannot be worked top-down to one answer.
 */
export function solveChain(p, limit = 200) {
  const found = new Array(p.n).fill(null);
  let progress = true;
  while (progress && found.some((x) => x == null)) {
    progress = false;
    for (const e of p.equations) {
      const unknown = [...new Set(e.terms.flatMap((t) => [t.v, t.times]).filter((v) => v != null && found[v] == null))];
      if (unknown.length !== 1) continue;
      const u = unknown[0];
      const fits = [];
      for (let x = 1; x <= limit && fits.length < 2; x++) {
        const vals = found.map((y, i) => (i === u ? x : y ?? 0));
        if (totalOf(e.terms, vals) === e.total) fits.push(x);
      }
      if (fits.length !== 1) return null;
      found[u] = fits[0];
      progress = true;
    }
  }
  return found.some((x) => x == null) ? null : found;
}

/** Is there still exactly one answer? (After the child edits the lines.) */
export function uniquelySolvable(p) {
  if (p.equations.every(isLinear)) {
    return det(p.equations.map((e) => rowOf(e, p.n))) !== 0;
  }
  return solveChain(p) != null;
}

/** Solve a linear puzzle exactly (Gauss–Jordan) — for testing. */
export function solve(p) {
  if (!p.equations.every(isLinear)) return solveChain(p);
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

/**
 * makePuzzle({ level, seed, fruits }) → {
 *   level, seed, n, shape,
 *   fruits:   ids of the fruits used, in unknown order (fruits[v]),
 *   letters:  'a', 'b', … in the same order,
 *   values:   the answer, values[v],
 *   equations:[{ terms:[{v,k,s,times?}], total }],
 *   question: { terms:[{v,k,s,times?}], answer }
 * }
 * `fruits` is the full list of ids to choose from.
 */
export function makePuzzle({ level = "starter", seed = 1, fruits }) {
  const L = levelOf(level);
  const R = rng(seed);
  const n = L.fruits;
  for (let attempt = 0; attempt < 2000; attempt++) {
    /* distinct values: two fruits worth the same look like a mistake */
    const vals = shuffle(R, [...Array(L.max).keys()].map((i) => i + 1)).slice(0, n);
    const shape = pick(R, L.shapes);
    const eqs = shape === "chain" ? chain(R, L, vals) : tangle(R, L, vals);
    if (eqs.some((e) => e.total <= 0 || e.total > L.cap)) continue;
    /* no line longer than a child can follow */
    if (eqs.some((e) => e.terms.length > 6)) continue;
    const p = { n, equations: eqs };
    if (shape === "tangle") {
      const M = eqs.map((e) => rowOf(e, n));
      if (det(M) === 0) continue;
      if (M.some((r) => r.filter((x) => x !== 0).length < 2)) continue;
    } else {
      const got = solveChain(p);
      if (!got || got.some((x, i) => x !== vals[i])) continue;
    }
    const q = question(R, L, vals);
    if (q.answer > L.cap * 1.5) continue;
    return {
      level: L.id,
      seed,
      n,
      shape,
      fruits: shuffle(R, fruits).slice(0, n),
      letters: "abcd".slice(0, n).split(""),
      values: vals,
      equations: eqs,
      question: q,
    };
  }
  throw new Error("fruit-sums: no puzzle found");
}
