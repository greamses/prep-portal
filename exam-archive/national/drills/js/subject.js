/* ═══════════════════════════════════════════════════════
   DRILLS — change of subject ("make a the subject of v = u + at").
   The player types the new right-hand side, e.g. (v-u)/t. It is not compared
   as text: both it and the expected answer are evaluated at a few points and
   must agree, so (v-u)/t, (v−u)÷t and 1/t(v-u) all count. Implicit
   multiplication binds tighter than "/" (ab/cd is (ab)/(cd)).
═══════════════════════════════════════════════════════ */
export const SUBJECT_OPS = ['subOne', 'subTwo', 'subMulti'];
export const isSubjectOp = (op) => SUBJECT_OPS.includes(op);

/* ── a tiny evaluator: + − * / ^ ( ) numbers and single letters ── */
function evaluate(src, env) {
  const s = String(src).replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/×/g, '*').replace(/÷/g, '/')
    .replace(/²/g, '^2').replace(/³/g, '^3').replace(/½/g, '(1/2)');
  if (!s || /[^0-9A-Za-z.+\-*/^()]/.test(s)) return NaN;
  let i = 0;
  const peek = () => s[i];
  const isLetter = (c) => !!c && /[A-Za-z]/.test(c);
  const isDigit = (c) => !!c && /[0-9.]/.test(c);
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') { const op = s[i++]; const t = term(); v = op === '+' ? v + t : v - t; }
    return v;
  }
  function term() {
    let v = product();
    while (peek() === '/' || peek() === '*') {
      const op = s[i++]; const t = product();
      v = op === '/' ? v / t : v * t;
    }
    return v;
  }
  function product() {
    let v = unary();
    while (peek() === '(' || isLetter(peek())) v *= power(); // implicit: 2as, a(b+c)
    return v;
  }
  function unary() {
    if (peek() === '-') { i++; return -unary(); }
    if (peek() === '+') { i++; return unary(); }
    return power();
  }
  function power() {
    let base;
    if (peek() === '(') { i++; base = expr(); if (peek() !== ')') return NaN; i++; }
    else if (isLetter(peek())) { const name = s[i++]; if (!(name in env)) return NaN; base = env[name]; }
    else if (isDigit(peek())) { let n = ''; while (isDigit(peek())) n += s[i++]; base = Number(n); }
    else return NaN;
    if (peek() === '^') {
      i++;
      let neg = false;
      if (peek() === '-') { neg = true; i++; }
      let e = ''; while (/[0-9]/.test(peek() || '')) e += s[i++];
      if (!e) return NaN;
      base = base ** (neg ? -Number(e) : Number(e));
    }
    return base;
  }
  const v = expr();
  return i === s.length ? v : NaN;
}

const lettersIn = (src) => new Set(String(src).match(/[A-Za-z]/g) || []);
const POINTS = [
  [2.3, 3.1, 5.7, 7.9, 1.9, 4.3, 6.1, 8.3],
  [3.7, 1.3, 2.9, 5.3, 6.7, 2.1, 9.1, 3.3],
  [5.1, 4.7, 1.7, 3.9, 2.7, 7.3, 4.1, 1.1],
];
function envFor(vars, k) {
  const env = {}; [...vars].sort().forEach((v, j) => { env[v] = POINTS[k][j % 8] + j * 0.37; }); return env;
}

export function checkSubject(typed, ans) {
  let t = String(typed).trim();
  // allow "a = (v-u)/t"
  const eq = t.indexOf('=');
  if (eq >= 0) { if (t.slice(0, eq).trim() !== ans.find) return false; t = t.slice(eq + 1); }
  if (!t) return false;
  const want = lettersIn(ans.expr), got = lettersIn(t);
  for (const g of got) if (!want.has(g)) return false;
  const vars = new Set([...want, ...got]);
  for (let k = 0; k < POINTS.length; k++) {
    const env = envFor(vars, k);
    const a = evaluate(t, env), b = evaluate(ans.expr, env);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    if (Math.abs(a - b) > 1e-8 * Math.max(1, Math.abs(b))) return false;
  }
  return true;
}

/* ── the formulas ──
   [text, tex, subject, answer]. `text` is the plain fallback. */
const T = {
  subOne: [
    ['P = a + b', 'P = a + b', 'a', 'P - b'],
    ['P = a + b', 'P = a + b', 'b', 'P - a'],
    ['y = x − c', 'y = x - c', 'x', 'y + c'],
    ['A = lw', 'A = lw', 'l', 'A/w'],
    ['A = lw', 'A = lw', 'w', 'A/l'],
    ['V = IR', 'V = IR', 'I', 'V/R'],
    ['V = IR', 'V = IR', 'R', 'V/I'],
    ['d = st', 'd = st', 's', 'd/t'],
    ['d = st', 'd = st', 't', 'd/s'],
    ['F = ma', 'F = ma', 'a', 'F/m'],
    ['F = ma', 'F = ma', 'm', 'F/a'],
    ['s = d/t', 's = \\tfrac{d}{t}', 'd', 'st'],
  ],
  subTwo: [
    ['v = u + at', 'v = u + at', 'u', 'v - at'],
    ['v = u + at', 'v = u + at', 'a', '(v-u)/t'],
    ['v = u + at', 'v = u + at', 't', '(v-u)/a'],
    ['y = mx + c', 'y = mx + c', 'x', '(y-c)/m'],
    ['y = mx + c', 'y = mx + c', 'm', '(y-c)/x'],
    ['y = mx + c', 'y = mx + c', 'c', 'y - mx'],
    ['P = 2l + 2w', 'P = 2l + 2w', 'l', '(P-2w)/2'],
    ['P = 2l + 2w', 'P = 2l + 2w', 'w', '(P-2l)/2'],
    ['y = (x + a)/b', 'y = \\tfrac{x + a}{b}', 'x', 'by - a'],
    ['y = (x + a)/b', 'y = \\tfrac{x + a}{b}', 'b', '(x+a)/y'],
    ['I = PRT/100', 'I = \\tfrac{PRT}{100}', 'R', '100I/(PT)'],
    ['I = PRT/100', 'I = \\tfrac{PRT}{100}', 'P', '100I/(RT)'],
  ],
  subMulti: [
    ['T = 2(a + b)', 'T = 2(a + b)', 'a', 'T/2 - b'],
    ['A = ½(a + b)h', 'A = \\tfrac{1}{2}(a + b)h', 'h', '2A/(a+b)'],
    ['A = ½(a + b)h', 'A = \\tfrac{1}{2}(a + b)h', 'a', '2A/h - b'],
    ['C = 5(F − 32)/9', 'C = \\tfrac{5(F - 32)}{9}', 'F', '9C/5 + 32'],
    ['s = ut + ½at²', 's = ut + \\tfrac{1}{2}at^{2}', 'a', '2(s-ut)/t^2'],
    ['v² = u² + 2as', 'v^{2} = u^{2} + 2as', 'a', '(v^2-u^2)/(2s)'],
    ['v² = u² + 2as', 'v^{2} = u^{2} + 2as', 's', '(v^2-u^2)/(2a)'],
    ['A = P + PRT/100', 'A = P + \\tfrac{PRT}{100}', 'R', '100(A-P)/(PT)'],
    ['S = n(a + l)/2', 'S = \\tfrac{n(a + l)}{2}', 'l', '2S/n - a'],
    ['S = n(a + l)/2', 'S = \\tfrac{n(a + l)}{2}', 'n', '2S/(a+l)'],
  ],
};

export function subjectQuestion(rng, op) {
  const list = T[op];
  const [text, tex, find, expr] = list[Math.floor(rng() * list.length)];
  return {
    math: true, subject: true, text, tex,
    hint: `Make ${find} the subject`,
    answer: { kind: 'subject', find, expr },
  };
}
