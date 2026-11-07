/* ═══════════════════════════════════════════════════════
   DRILLS — algebra: distribution, factorising, quadratic expansion and
   quadratic factorising.
   Answers are EXPRESSIONS, so they are not compared as text: the typed line
   is parsed to a polynomial in x and compared coefficient by coefficient
   (3(2x+3), (2x+3)3 and 3(3+2x) all count). Factorising is also checked for
   SHAPE — a bracket must really be there, and nothing left to take out.
═══════════════════════════════════════════════════════ */

const MINUS = '−';
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };

/* ── polynomials as arrays of coefficients, index = power of x ── */
const trim = (p) => { const q = p.slice(); while (q.length > 1 && q[q.length - 1] === 0) q.pop(); return q; };
const add = (p, q) => trim(Array.from({ length: Math.max(p.length, q.length) }, (_, i) => (p[i] || 0) + (q[i] || 0)));
const neg = (p) => p.map((c) => -c);
function mul(p, q) {
  const out = Array(p.length + q.length - 1).fill(0);
  p.forEach((a, i) => q.forEach((b, j) => { out[i + j] += a * b; }));
  return trim(out);
}
const same = (p, q) => { const a = trim(p), b = trim(q); return a.length === b.length && a.every((c, i) => c === b[i]); };

/** Parse typed algebra to a polynomial in x, or null if it is not (yet) well formed. */
export function parsePoly(raw) {
  const s = String(raw).replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/X/g, 'x').replace(/\*/g, '');
  if (!s || /[^0-9x^()+\-]/.test(s)) return null;
  let i = 0;
  const peek = () => s[i];
  function expr() {
    let p = term();
    if (!p) return null;
    while (peek() === '+' || peek() === '-') {
      const op = s[i++];
      const t = term();
      if (!t) return null;
      p = add(p, op === '-' ? neg(t) : t);
    }
    return p;
  }
  function term() {
    let sign = 1;
    while (peek() === '-' || peek() === '+') { if (s[i++] === '-') sign = -sign; }
    let p = factor();
    if (!p) return null;
    // implicit multiplication: 3x, 2(x+1), (x+1)(x+2), x(x+1)
    while (i < s.length && (peek() === '(' || peek() === 'x' || /[0-9]/.test(peek()))) {
      const f = factor();
      if (!f) return null;
      p = mul(p, f);
    }
    return sign === -1 ? neg(p) : p;
  }
  function factor() {
    let base;
    if (peek() === '(') {
      i++;
      base = expr();
      if (!base || peek() !== ')') return null;
      i++;
    } else if (peek() === 'x') { i++; base = [0, 1]; }
    else if (/[0-9]/.test(peek() || '')) {
      let n = '';
      while (/[0-9]/.test(peek() || '')) n += s[i++];
      base = [Number(n)];
    } else return null;
    if (peek() === '^') {
      i++;
      let e = '';
      while (/[0-9]/.test(peek() || '')) e += s[i++];
      if (!e || Number(e) > 4) return null;
      let r = [1];
      for (let k = 0; k < Number(e); k++) r = mul(r, base);
      base = r;
    }
    return base;
  }
  const p = expr();
  return p && i === s.length ? p : null;
}

/* ── checking ── */
const flat = (t) => String(t).replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/\*/g, '');
const degree = (p) => trim(p).length - 1;

export function checkAlgebra(typed, ans) {
  const got = parsePoly(typed);
  if (!got || !same(got, ans.poly)) return false;
  const t = flat(typed);
  if (ans.kind === 'distribute' || ans.kind === 'quadExpand') {
    return !t.includes('(') && !/\)/.test(t); // fully expanded, no brackets left
  }
  if (ans.kind === 'factorise') {
    // k(inner) with nothing left to take out of the inner part
    const m = /^(-?\d*)\((.+)\)$/.exec(t);
    if (!m) return false;
    const inner = parsePoly(m[2]);
    if (!inner || m[2].includes('(')) return false;
    return inner.reduce((g, c) => gcd(g, c), 0) === 1 && degree(inner) === 1;
  }
  if (ans.kind === 'quadFactorise') {
    // k(…)(…) or k(…)^2, k optional. Fully factorised: nothing left to take
    // out of either bracket, so 2(x - 3)(x + 2) counts but (2x - 6)(x + 2) does not.
    const two = /^(-?\d*)\(([^()]+)\)\(([^()]+)\)$/.exec(t);
    const sq = /^(-?\d*)\(([^()]+)\)\^2$/.exec(t);
    const groups = two ? [two[2], two[3]] : sq && ans.square ? [sq[2], sq[2]] : null;
    if (!groups) return false;
    return groups.every((g) => {
      const q = parsePoly(g);
      return q && degree(q) === 1 && q.reduce((h, c) => gcd(h, c), 0) === 1;
    });
  }
  return true;
}

/* ── generators ── */
const KINDS = ['distribute', 'factorise', 'quadExpand', 'quadFactorise'];
const KIND_OPS = ['algDistribute', 'algFactorise', 'algQuadExpand', 'algQuadFactorise'];
export const ALGEBRA_OPS = [...KIND_OPS, 'algMixed'];
const KIND_OF = Object.fromEntries(KIND_OPS.map((o, i) => [o, KINDS[i]]));
export const isAlgebraOp = (op) => ALGEBRA_OPS.includes(op);

const signed = (v) => (v < 0 ? `${MINUS}${-v}` : String(v));
const coef = (c) => (c === 1 ? '' : c === -1 ? MINUS : String(c));
// "3x + 5" / "3x − 5" (variable term first)
const linear = (a, b) => `${coef(a)}x ${b < 0 ? MINUS : '+'} ${Math.abs(b)}`;
// c in 1..12 from whichever pool the range gave
const small = (rng, pool) => ((pool[Math.floor(rng() * pool.length)] - 1) % 12) + 1;
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const sgn = (rng) => (rng() < 0.5 ? -1 : 1);
const nonzero = (rng, max) => sgn(rng) * (1 + Math.floor(rng() * max));

export function algebraQuestion(rng, pool, op) {
  // Mixed: one of the four types, drawn per question.
  if (op === 'algMixed') op = pick(rng, KIND_OPS);
  const kind = KIND_OF[op];
  const k = Math.max(2, Math.min(12, small(rng, pool)));
  if (kind === 'distribute') {
    const a = rng() < 0.3 ? -k : k;
    const b = pick(rng, [1, 1, 2, 3, 4, 5]);
    const c = nonzero(rng, 9);
    return {
      alg: true, hint: 'Expand',
      text: `${signed(a)}(${linear(b, c)})`,
      answer: { alg: true, kind, poly: [a * c, a * b] },
    };
  }
  if (kind === 'factorise') {
    const g = k;
    const p = pick(rng, [1, 1, 2, 3, 4, 5]);
    let q = nonzero(rng, 9);
    while (gcd(p, q) !== 1) q = nonzero(rng, 9);
    return {
      alg: true, hint: 'Factorise fully',
      text: linear(g * p, g * q),
      answer: { alg: true, kind, poly: [g * q, g * p] },
    };
  }
  const a = nonzero(rng, Math.min(9, k));
  const b = nonzero(rng, Math.min(9, k));
  if (kind === 'quadExpand') {
    const p = pick(rng, [1, 1, 1, 2, 3]);
    const q = pick(rng, [1, 1, 1, 2, 3]);
    return {
      alg: true, hint: 'Expand and simplify',
      text: `(${linear(p, a)})(${linear(q, b)})`,
      answer: { alg: true, kind, poly: mul([a, p], [b, q]) },
    };
  }
  // quadFactorise — k(x + a)(x + b): the roots −a and −b are always whole
  // numbers. Half the time the x² coefficient k is 2–5 (a common factor to
  // take out first); a quarter of them are a difference of two squares.
  const lead = rng() < 0.5 ? 1 : int(rng, 2, 5);
  let p = a, r = b;
  if (rng() < 0.25) r = -p;              // difference of squares: k(x − a)(x + a)
  const mid = lead * (p + r), con = lead * p * r;
  const middle = mid === 0 ? '' : ` ${mid < 0 ? MINUS : '+'} ${Math.abs(mid) === 1 ? '' : Math.abs(mid)}x`;
  return {
    alg: true, hint: 'Factorise fully',
    text: `${lead === 1 ? '' : lead}x²${middle} ${con < 0 ? MINUS : '+'} ${Math.abs(con)}`,
    answer: { alg: true, kind, poly: [con, mid, lead], square: p === r },
  };
}
