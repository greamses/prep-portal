/* ── RELATIVE MOLECULAR MASS BANK ────────────────────────────────────────
   The compounds the Drills game asks for a relative molecular mass of.

   There is no second list of formulas here: the compounds ARE the IUPAC bank
   (data/chem/iupac.js), the same ones the Vocab hangman names and the
   dictionary cards draw. Adding a compound there adds it to this drill too,
   and no formula can disagree with itself between the two.

   Each entry carries everything a question needs, worked out once at load:
     display  the formula with subscripts ("H₂SO₄") — what the card shows
     mass     the graded answer (a number; .5 values are real — Cl = 35.5)
     hint     the mass bracket an exam question prints ("H = 1, S = 32…")

   A compound whose formula the parser can't read is DROPPED rather than
   guessed at, so a typo in the bank costs one question, not a wrong answer
   the player can never satisfy.
*/
import { CATEGORIES } from './iupac.js';
import { formulaMass, massHint, subscriptFormula } from './masses.js';

export const COMPOUND_SETS = CATEGORIES.map((cat) => ({
  key: cat.key,
  label: cat.label,
  compounds: cat.compounds
    .map((c) => {
      const mass = formulaMass(c.formula);
      if (mass === null) return null;
      return {
        formula: c.formula,
        name: c.name,
        display: subscriptFormula(c.formula),
        hint: massHint(c.formula),
        mass,
      };
    })
    .filter(Boolean),
}));

export const ALL_COMPOUND_SETS = COMPOUND_SETS.map((s) => s.key);

/**
 * The flat pool a round draws from. Order follows COMPOUND_SETS, never the
 * order the keys were ticked in — the same selection must produce the same
 * pool on every device in the room, or the seeded questions diverge.
 */
export function compoundsFor(setKeys) {
  const wanted = new Set(setKeys && setKeys.length ? setKeys : ALL_COMPOUND_SETS);
  const out = [];
  for (const set of COMPOUND_SETS) {
    if (wanted.has(set.key)) out.push(...set.compounds);
  }
  return out.length ? out : COMPOUND_SETS.flatMap((s) => s.compounds);
}
