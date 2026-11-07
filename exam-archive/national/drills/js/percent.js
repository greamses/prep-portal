/* ═══════════════════════════════════════════════════════
   DRILLS — percentages: % → decimal, % → fraction, fraction → %,
   decimal → %, and a percentage of a number.
   Every value is built from whole numbers (tenths of a percent at most), so
   the answers are exact: no 0.1 + 0.2 float noise ever reaches a question.
   Fractions are graded in lowest terms, typed with "/" (7/20).
═══════════════════════════════════════════════════════ */
export const PERCENT_OPS = ['pctToDec', 'pctToFrac', 'fracToPct', 'decToPct', 'pctOf'];
export const isPercentOp = (op) => PERCENT_OPS.includes(op);

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
// Lowest terms, and a whole number on its own: 3/2, 7/20, 2.
const fracStr = (n, d) => { const g = gcd(n, d); return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };
// p tenths-of-a-percent → printed percentage (12.5, 35, 150)
const pctText = (tenths) => String(tenths / 10);

// Percentages worth knowing, in tenths so 12.5 and 2.5 stay exact.
const PCTS = [1, 2, 4, 5, 6, 8, 10, 12.5, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 62.5, 65, 70, 75, 80, 85, 87.5, 90, 95,
  120, 125, 150, 200, 250].map((p) => p * 10);

export function percentQuestion(rng, pool, op) {
  if (op === 'pctToDec') {
    const t = pick(rng, PCTS);   // includes 120%, 150%, 250%
    return { math: true, hint: 'Write as a decimal', text: `${pctText(t)}%`, tex: `${pctText(t)}\\%`, answer: t / 1000 };
  }
  if (op === 'pctToFrac') {
    const t = pick(rng, PCTS);
    return { math: true, hint: 'Write as a fraction in its lowest terms', text: `${pctText(t)}%`, tex: `${pctText(t)}\\%`, answer: fracStr(t, 1000) };
  }
  if (op === 'fracToPct') {
    // denominators that go into 100 (or 200, for the eighths' 12.5%)
    const d = pick(rng, [2, 4, 5, 8, 10, 20, 25, 50]);
    let n = 1 + Math.floor(rng() * (d - 1));
    if (rng() < 0.15) n += d; // now and then an improper one: 5/4 = 125%
    while (gcd(n, d) !== 1) n += 1;
    return { math: true, hint: 'Write as a percentage', text: `${n}/${d}`, tex: `\\dfrac{${n}}{${d}} = \\square\\,\\%`, answer: (n * 100) / d };
  }
  if (op === 'decToPct') {
    const t = pick(rng, PCTS);
    const dec = t / 1000;
    return { math: true, hint: 'Write as a percentage', text: `${dec}`, tex: `${dec} = \\square\\,\\%`, answer: t / 10 };
  }
  // pctOf — chosen so the answer is a whole number
  const t = pick(rng, [5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 75, 80, 150, 200].map((p) => p * 10));
  const step = 1000 / gcd(t, 1000);                         // n must be a multiple of this
  const k = Math.max(1, pool[Math.floor(rng() * pool.length)] % 13 || 1);
  let n = step * k;
  while (n > 2000) n -= step;
  return {
    math: true, hint: 'Work it out',
    text: `${pctText(t)}% of ${n}`, tex: `${pctText(t)}\\% \\text{ of } ${n}`,
    answer: (t * n) / 1000,
  };
}
