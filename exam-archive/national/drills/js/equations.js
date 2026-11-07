/* ═══════════════════════════════════════════════════════
   DRILLS — equations (one-step, two-step, multi-step) and number bases.
   Every equation is built BACKWARDS from the answer, so x is always a whole
   number (negatives allowed). Base answers are digit strings (A–F for hex).
═══════════════════════════════════════════════════════ */
const MINUS = '−';
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const small = (rng, pool, cap = 12) => ((pool[Math.floor(rng() * pool.length)] - 1) % cap) + 1;
const sgn = (rng) => (rng() < 0.5 ? -1 : 1);
const co = (c) => (c === 1 ? '' : c === -1 ? MINUS : String(c));
const plus = (n) => (n < 0 ? `${MINUS} ${-n}` : `+ ${n}`);

export const EQUATION_OPS = ['eqOne', 'eqTwo', 'eqMulti'];
export const BASE_OPS = ['baseTo10', 'baseFrom10', 'baseToBase', 'binTo10', 'binFrom10', 'binAdd', 'binSub', 'binMul', 'binDiv',
  'octAdd', 'octSub', 'octMul', 'octDiv', 'hexAdd', 'hexSub', 'hexMul', 'hexDiv'];
export const isEquationOp = (op) => EQUATION_OPS.includes(op);
export const isBaseOp = (op) => BASE_OPS.includes(op);

const eq = (text, x) => ({ math: true, hint: 'Solve for x', text: text.replace(/-/g, MINUS), answer: x });

export function equationQuestion(rng, pool, op) {
  const k = Math.max(2, small(rng, pool));
  const x = sgn(rng) * int(rng, 1, Math.min(12, k + 3));
  if (op === 'eqOne') {
    const a = int(rng, 2, Math.min(12, k + 2));
    switch (int(rng, 0, 3)) {
      case 0: return eq(`x + ${a} = ${x + a}`, x);
      case 1: return eq(`x ${MINUS} ${a} = ${x - a}`.replace('= -', `= ${MINUS}`), x);
      case 2: return eq(`${a}x = ${a * x}`, x);
      default: return eq(`x⁄${a} = ${x}`, a * x); // x/a = x0
    }
  }
  if (op === 'eqTwo') {
    const a = int(rng, 2, Math.min(9, k + 1)), b = int(rng, 1, 15);
    switch (int(rng, 0, 2)) {
      case 0: return eq(`${a}x + ${b} = ${a * x + b}`, x);
      case 1: return eq(`${a}x ${MINUS} ${b} = ${a * x - b}`, x);
      default: return eq(`x⁄${a} + ${b} = ${x + b}`, a * x);
    }
  }
  // multi-step
  const a = int(rng, 2, 6), b = sgn(rng) * int(rng, 1, 9);
  switch (int(rng, 0, 2)) {
    case 0: return eq(`${a}(x ${plus(b)}) = ${a * (x + b)}`, x);
    case 1: { // x on both sides
      const c = int(rng, 1, a - 1);
      // a x + b = c x + e  with  e = (a - c) x + b
      const e = (a - c) * x + b;
      return eq(`${co(a)}x ${plus(b)} = ${co(c)}x ${plus(e)}`, x);
    }
    default: { // a(x + b) + c = d
      const c = sgn(rng) * int(rng, 1, 9);
      return eq(`${a}(x ${plus(b)}) ${plus(c)} = ${a * (x + b) + c}`, x);
    }
  }
}

/* ── number bases ── */
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n) => String(n).split('').map((d) => SUBS[Number(d)]).join('');
const BASES = [2, 3, 4, 5, 6, 7, 8, 16];
const show = (n, base) => n.toString(base).toUpperCase();

export function baseQuestion(rng, pool, op) {
  const n = Math.max(3, pool[Math.floor(rng() * pool.length)] + int(rng, 0, 20));
  // Binary to / from denary: the same two drills with the base fixed at 2.
  const b = op.startsWith('bin') ? 2 : pick(rng, BASES);
  // Arithmetic in binary, octal or hexadecimal, answered in the same base.
  const ARITH = { bin: [2, 'binary', 31, 7], oct: [8, 'octal', 63, 7], hex: [16, 'hexadecimal', 255, 15] };
  const m = /^(bin|oct|hex)(Add|Sub|Mul|Div)$/.exec(op);
  if (m) {
    const [B, word, cap, maxF] = ARITH[m[1]];
    const w = (v) => `${show(v, B)}${sub(B)}`;
    const q = (verb, text, v) => ({ math: true, base: true, hint: `${verb} in ${word}`, text: `${text} = ?${sub(B)}`, answer: show(v, B) });
    const other = () => Math.max(2, pool[Math.floor(rng() * pool.length)] + int(rng, 0, 20));
    const scale = B === 2 ? 1 : B === 8 ? 3 : 6; // octal and hex questions use bigger numbers
    if (m[2] === 'Add') {
      const terms = [n * scale, other() * scale];
      if (rng() < 0.25) terms.push(int(rng, 1, 15) * scale);
      return q('Add', terms.map(w).join(' + '), terms.reduce((x, y) => x + y, 0));
    }
    if (m[2] === 'Sub') {
      // never negative: the larger number comes first
      const x = n * scale, y = other() * scale;
      const hi = Math.max(x, y), lo = Math.min(x, y) === hi ? hi - 1 : Math.min(x, y);
      return q('Subtract', `${w(hi)} − ${w(lo)}`, hi - lo);
    }
    if (m[2] === 'Mul') {
      // a number times one figure, so the working stays on the page
      const x = Math.max(2, Math.min(n * scale, cap)), f = int(rng, 2, maxF);
      return q('Multiply', `${w(x)} × ${w(f)}`, x * f);
    }
    // Div: built from a product, so it always divides exactly
    const d = int(rng, 2, maxF), quo = Math.max(1, Math.min(n * scale, cap));
    return q('Divide', `${w(d * quo)} ÷ ${w(d)}`, quo);
  }
  if (op === 'binTo10') op = 'baseTo10';
  if (op === 'binFrom10') op = 'baseFrom10';
  const base = { math: true, base: true };
  if (op === 'baseTo10') {
    return { ...base, hint: 'Convert to base 10', text: `${show(n, b)}${sub(b)} = ?${sub(10)}`, answer: String(n) };
  }
  if (op === 'baseFrom10') {
    return { ...base, hint: `Convert to base ${b}`, text: `${n}${sub(10)} = ?${sub(b)}`, answer: show(n, b) };
  }
  let c = pick(rng, BASES);
  while (c === b) c = pick(rng, BASES);
  return { ...base, hint: `Convert to base ${c}`, text: `${show(n, b)}${sub(b)} = ?${sub(c)}`, answer: show(n, c) };
}
