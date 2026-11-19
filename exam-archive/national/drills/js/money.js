/* ═══════════════════════════════════════════════════════
   DRILLS — commercial maths: simple interest, profit and loss percent, the
   selling price or the cost price from a profit or loss percent, discount,
   and commission.
   Every amount is built so the answer is a whole number (a cost price that is
   a multiple of 20 takes any 5% step exactly, and so on). No currency mark:
   CP, SP, P are amounts (the drills write no ₦ anywhere).
═══════════════════════════════════════════════════════ */
export const MONEY_OPS = ['monSI', 'monProfitPct', 'monLossPct', 'monSP', 'monCP', 'monDiscount', 'monCommission'];
export const isMoneyOp = (op) => MONEY_OPS.includes(op);

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const STEPS = [5, 10, 15, 20, 25, 30, 40, 50];            // percentages that sit on a whole amount
const q = (text, tex, hint, answer) => ({ math: true, text, tex, hint, answer });

export function moneyQuestion(rng, pool, op) {
  if (op === 'monSI') {
    const P = 100 * int(rng, 2, 50), R = int(rng, 2, 15), T = int(rng, 1, 6);
    return q(`P = ${P}, R = ${R}%, T = ${T} years`, `P = ${P},\\; R = ${R}\\%,\\; T = ${T} \\text{ years}`, 'Simple interest: find I', (P * R * T) / 100);
  }
  if (op === 'monProfitPct' || op === 'monLossPct') {
    const CP = 20 * int(rng, 5, 100), p = pick(rng, STEPS), profit = op === 'monProfitPct';
    const SP = profit ? CP + (CP * p) / 100 : CP - (CP * p) / 100;
    return q(`CP = ${CP}, SP = ${SP}`, `\\text{CP} = ${CP},\\; \\text{SP} = ${SP}`, profit ? 'Profit percent: find it' : 'Loss percent: find it', p);
  }
  if (op === 'monSP' || op === 'monCP') {
    const CP = 20 * int(rng, 5, 100), p = pick(rng, STEPS), profit = rng() < 0.6;
    const SP = profit ? CP + (CP * p) / 100 : CP - (CP * p) / 100;
    const word = profit ? 'profit' : 'loss';
    if (op === 'monSP') return q(`CP = ${CP}, ${word} = ${p}%`, `\\text{CP} = ${CP},\\; \\text{${word}} = ${p}\\%`, 'Selling price: find SP', SP);
    return q(`SP = ${SP}, ${word} = ${p}%`, `\\text{SP} = ${SP},\\; \\text{${word}} = ${p}\\%`, 'Cost price: find CP', CP);
  }
  if (op === 'monDiscount') {
    const MP = 20 * int(rng, 5, 100), d = pick(rng, STEPS), off = (MP * d) / 100;
    return rng() < 0.5
      ? q(`Marked price = ${MP}, discount = ${d}%`, `\\text{Marked price} = ${MP},\\; \\text{discount} = ${d}\\%`, 'Discount: find the discount', off)
      : q(`Marked price = ${MP}, discount = ${d}%`, `\\text{Marked price} = ${MP},\\; \\text{discount} = ${d}\\%`, 'Discount: find the price paid', MP - off);
  }
  // monCommission
  const S = 100 * int(rng, 10, 200), r = pick(rng, [2, 3, 4, 5, 6, 8, 10, 12, 15]);
  return q(`Sales = ${S}, rate = ${r}%`, `\\text{Sales} = ${S},\\; \\text{rate} = ${r}\\%`, 'Commission: find it', (S * r) / 100);
}
