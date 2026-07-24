/* ── RELATIVE ATOMIC MASSES + FORMULA PARSER ─────────────────────────────
   The numbers a Nigerian secondary-school chemistry paper actually prints in
   its "[H = 1, O = 16, S = 32]" bracket — rounded to whole numbers except
   where the .5 is the whole point (Cl = 35.5, Cu = 63.5). Deliberately NOT
   the full-precision IUPAC values: a student marking their own work against
   35.453 would count every correct answer wrong.

   parseFormula() reads a plain formula string the way a student reads it:
   element symbols with counts, brackets with a multiplier, and the dot of a
   hydrate (CuSO4.5H2O). It does NOT read SMILES, charges or state symbols —
   anything it can't account for comes back null rather than a wrong mass, so
   a bad formula drops out of the bank instead of quietly grading wrong.
*/

export const ATOMIC_MASSES = {
  H: 1, He: 4, Li: 7, Be: 9, B: 11, C: 12, N: 14, O: 16, F: 19, Ne: 20,
  Na: 23, Mg: 24, Al: 27, Si: 28, P: 31, S: 32, Cl: 35.5, Ar: 40,
  K: 39, Ca: 40, Ti: 48, V: 51, Cr: 52, Mn: 55, Fe: 56, Co: 59, Ni: 59,
  Cu: 63.5, Zn: 65, Br: 80, Kr: 84, Rb: 85, Sr: 88, Ag: 108, Cd: 112,
  Sn: 119, I: 127, Xe: 131, Ba: 137, Pt: 195, Au: 197, Hg: 200, Pb: 207,
};

const newFrame = () => ({ counts: Object.create(null), order: [] });

function add(frame, el, n) {
  if (!(el in frame.counts)) { frame.counts[el] = 0; frame.order.push(el); }
  frame.counts[el] += n;
}

// `order` is first-appearance order, kept so the mass hint under a question
// reads left-to-right with the formula (H2SO4 -> "H = 1, S = 32, O = 16")
// rather than alphabetically.
function merge(dst, src, mult) {
  for (const el of src.order) add(dst, el, src.counts[el] * mult);
}

// One dot-free unit: symbols, digits and bracket groups.
function parseUnit(text) {
  const stack = [newFrame()];
  let i = 0;

  const readCount = () => {
    let s = '';
    while (i < text.length && text[i] >= '0' && text[i] <= '9') s += text[i++];
    return s ? parseInt(s, 10) : 1;
  };

  while (i < text.length) {
    const ch = text[i];

    if (ch === '(' || ch === '[') { stack.push(newFrame()); i += 1; continue; }

    if (ch === ')' || ch === ']') {
      i += 1;
      if (stack.length < 2) return null; // a close with nothing open
      const group = stack.pop();
      merge(stack[stack.length - 1], group, readCount());
      continue;
    }

    if (ch >= 'A' && ch <= 'Z') {
      let el = ch;
      i += 1;
      if (i < text.length && text[i] >= 'a' && text[i] <= 'z') { el += text[i]; i += 1; }
      if (!(el in ATOMIC_MASSES)) return null;
      add(stack[stack.length - 1], el, readCount());
      continue;
    }

    return null; // a digit with no symbol before it, a charge, a space…
  }

  return stack.length === 1 ? stack[0] : null; // an unclosed bracket
}

/** Formula -> { counts: {el: n}, order: [el] }, or null if it can't be read. */
export function parseFormula(formula) {
  const root = newFrame();
  // Water of crystallisation: "CuSO4.5H2O" is three parts of one compound,
  // the "5" multiplying everything after it.
  for (const part of String(formula).split(/[.·]/)) {
    const m = part.match(/^(\d*)([\s\S]*)$/);
    const unit = parseUnit(m[2]);
    if (!unit) return null;
    merge(root, unit, m[1] ? parseInt(m[1], 10) : 1);
  }
  return root.order.length ? root : null;
}

/** Formula -> its relative molecular mass, or null if the formula can't be read. */
export function formulaMass(formula) {
  const parsed = parseFormula(formula);
  if (!parsed) return null;
  let total = 0;
  for (const el of parsed.order) total += ATOMIC_MASSES[el] * parsed.counts[el];
  // Every mass above is a whole number or an exact .5, so the sum is exact in
  // binary — this only tidies away a stray 0.30000000000000004 if that ever
  // stops being true.
  return Math.round(total * 100) / 100;
}

/** "H2SO4" -> "H = 1, S = 32, O = 16" — the bracket an exam question prints. */
export function massHint(formula) {
  const parsed = parseFormula(formula);
  if (!parsed) return '';
  return parsed.order.map((el) => `${el} = ${ATOMIC_MASSES[el]}`).join(', ');
}

const SUBSCRIPTS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

/** "H2SO4" -> "H₂SO₄". Display only — never parsed back. */
export function subscriptFormula(formula) {
  return String(formula).replace(/\d/g, (d) => SUBSCRIPTS[Number(d)]);
}
