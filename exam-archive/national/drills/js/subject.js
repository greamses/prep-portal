/* ═══════════════════════════════════════════════════════
   DRILLS — change of subject ("make a the subject of v = u + at").
   The player types the new right-hand side, e.g. (v-u)/t. It is not compared
   as text: both it and the expected answer are evaluated at a few points and
   must agree, so (v-u)/t, (v−u)÷t and 1/t(v-u) all count. Implicit
   multiplication binds tighter than "/" (ab/cd is (ab)/(cd)).
═══════════════════════════════════════════════════════ */
export const SUBJECT_OPS = ['subOne', 'subTwo', 'subMulti', 'subPower'];
export const isSubjectOp = (op) => SUBJECT_OPS.includes(op);

/* ── a tiny evaluator: + − * / ^ ( ) numbers and single letters ── */
function evaluate(src, env) {
  const s = String(src).replace(/sqrt/gi, '√').replace(/cbrt/gi, '∛').replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/×/g, '*').replace(/÷/g, '/')
    .replace(/²/g, '^2').replace(/³/g, '^3').replace(/½/g, '(1/2)');
  if (!s || /[^0-9A-Za-z.+\-*/^()√∛π]/.test(s)) return NaN;
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
    while (peek() === '(' || isLetter(peek()) || peek() === '√' || peek() === '∛' || peek() === 'π') v *= power(); // implicit: 2as, a(b+c), 2πr
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
    else if (peek() === '√' || peek() === '∛') {
      const root = s[i++] === '√' ? Math.sqrt : Math.cbrt;
      let arg;
      if (peek() === '(') { i++; arg = expr(); if (peek() !== ')') return NaN; i++; } else arg = power();
      base = root(arg);
    }
    else if (peek() === 'π') { i++; base = Math.PI; }
    else if (isLetter(peek())) { const name = s[i++]; if (!(name in env)) return NaN; base = env[name]; }
    else if (isDigit(peek())) { let n = ''; while (isDigit(peek())) n += s[i++]; base = Number(n); }
    else return NaN;
    if (peek() === '^') {
      i++;
      if (peek() === '(') { i++; const e = expr(); if (peek() !== ')') return NaN; i++; base **= e; }
      else {
        let neg = false;
        if (peek() === '-') { neg = true; i++; }
        let e = ''; while (/[0-9.]/.test(peek() || '')) e += s[i++];
        if (!e) return NaN;
        base = base ** (neg ? -Number(e) : Number(e));
      }
    }
    return base;
  }
  const v = expr();
  return i === s.length ? v : NaN;
}

// letters that are variables: not the spelled-out sqrt / cbrt / pi
const lettersIn = (src) => new Set((String(src).replace(/sqrt|cbrt|pi/gi, '').match(/[A-Za-z]/g) || []));
// Deterministic pseudo-random positive points; roots can fail at some, so we
// try many and judge on the ones where the EXPECTED answer is a real number.
function envAt(vars, k) {
  const env = {}; let x = (k + 1) * 7919;
  [...vars].sort().forEach((v) => { x = (x * 1103515245 + 12345) % 2147483648; env[v] = 1.5 + (x % 7000) / 1000; });
  return env;
}

export function checkSubject(typed, ans) {
  let t = String(typed).trim().replace(/pi/gi, 'π');
  // allow "a = (v-u)/t"
  const eq = t.indexOf('=');
  if (eq >= 0) { if (t.slice(0, eq).trim() !== ans.find) return false; t = t.slice(eq + 1); }
  if (!t) return false;
  const want = lettersIn(ans.expr), got = lettersIn(t);
  for (const g of got) if (!want.has(g)) return false;
  const vars = new Set([...want, ...got]);
  let agreed = 0;
  for (let k = 0; k < 80 && agreed < 4; k++) {
    const env = envAt(vars, k);
    const b = evaluate(ans.expr, env);
    if (!Number.isFinite(b)) continue;          // not a real number here: skip the point
    const a = evaluate(t, env);
    if (!Number.isFinite(a) || Math.abs(a - b) > 1e-8 * Math.max(1, Math.abs(b))) return false;
    agreed += 1;
  }
  return agreed >= 4;
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
  subPower: [
    ['A = πr²', 'A = \\pi r^{2}', 'r', '√(A/π)'],
    ['V = πr²h', 'V = \\pi r^{2}h', 'r', '√(V/(πh))'],
    ['V = πr²h', 'V = \\pi r^{2}h', 'h', 'V/(πr^2)'],
    ['V = 4πr³/3', 'V = \\tfrac{4}{3}\\pi r^{3}', 'r', '∛(3V/(4π))'],
    ['V = x³', 'V = x^{3}', 'x', '∛(V)'],
    ['s = ½at²', 's = \\tfrac{1}{2}at^{2}', 't', '√(2s/a)'],
    ['s = ½at²', 's = \\tfrac{1}{2}at^{2}', 'a', '2s/t^2'],
    ['E = ½mv²', 'E = \\tfrac{1}{2}mv^{2}', 'v', '√(2E/m)'],
    ['E = ½mv²', 'E = \\tfrac{1}{2}mv^{2}', 'm', '2E/v^2'],
    ['c² = a² + b²', 'c^{2} = a^{2} + b^{2}', 'a', '√(c^2-b^2)'],
    ['v² = u² + 2as', 'v^{2} = u^{2} + 2as', 'u', '√(v^2-2as)'],
    ['d = √(x² + y²)', 'd = \\sqrt{x^{2} + y^{2}}', 'x', '√(d^2-y^2)'],
    ['y = √x', 'y = \\sqrt{x}', 'x', 'y^2'],
    ['t = √(2h/g)', 't = \\sqrt{\\tfrac{2h}{g}}', 'h', 'gt^2/2'],
    ['T = 2π√(l/g)', 'T = 2\\pi\\sqrt{\\tfrac{l}{g}}', 'l', 'gT^2/(4π^2)'],
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
