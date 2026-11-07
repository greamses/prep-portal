/* ═══════════════════════════════════════════════════════
   DRILLS — Roman numerals: Roman → number, and number → Roman.
   Numbers run 1–3999 (the standard range), weighted towards the ones a
   pupil meets most: half are 1–100, then up to 1000, then the rest.
   Roman answers are typed in capitals (lower case is accepted and raised).
═══════════════════════════════════════════════════════ */
export const ROMAN_OPS = ['romanToNum', 'numToRoman'];
export const isRomanOp = (op) => ROMAN_OPS.includes(op);

const TABLE = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];

export function toRoman(n) {
  let out = '';
  for (const [v, s] of TABLE) while (n >= v) { out += s; n -= v; }
  return out;
}

function numberFor(rng) {
  const r = rng();
  if (r < 0.5) return 1 + Math.floor(rng() * 100);
  if (r < 0.8) return 100 + Math.floor(rng() * 900);
  return 1000 + Math.floor(rng() * 3000);
}

export function romanQuestion(rng, op) {
  const n = numberFor(rng);
  const r = toRoman(n);
  if (op === 'romanToNum') {
    return { math: true, hint: 'Write as a number', text: r, tex: `\\mathrm{${r}} = \\square`, answer: n };
  }
  return { math: true, roman: true, hint: 'Write in Roman numerals', text: String(n), tex: `${n} = \\square`, answer: r };
}
