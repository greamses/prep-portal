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
export const BASE_OPS = ['baseTo10', 'baseFrom10', 'baseToBase', 'binTo10', 'binFrom10', 'binAdd'];
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
  if (op === 'binAdd') {
    // two (sometimes three) binary numbers, answered in binary
    const terms = [n, Math.max(1, pool[Math.floor(rng() * pool.length)] + int(rng, 0, 20))];
    if (rng() < 0.25) terms.push(Math.max(1, int(rng, 1, 15)));
    const sum = terms.reduce((a, c) => a + c, 0);
    return { math: true, base: true, hint: 'Add in binary', text: `${terms.map((t) => `${show(t, 2)}${sub(2)}`).join(' + ')} = ?${sub(2)}`, answer: show(sum, 2) };
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
