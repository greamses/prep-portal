/* ═══════════════════════════════════════════════════════════════════════════
   EQUATIONS LINKED TOGETHER, WRITTEN AS A MATRIX

   Two or more equations wired together on the canvas are a SYSTEM:

       2x + y = 5
        x − y = 1

   and a system is a matrix equation in disguise — the numbers in front of the
   letters make a matrix, the letters a column, the numbers on the right a
   column:

       [[2, 1],[1, −1]] [[x],[y]] = [[5],[1]]

   or, with the right-hand column stuck on, the augmented matrix [[2, 1, 5],
   [1, −1, 1]]. This reads each line as a straight-line equation (letters to the
   first power, nothing multiplied by another letter), collects the numbers,
   and builds either form. Each line is rebuilt as "numbers times letters = a
   number" and CHECKED against the line it came from, so what is written is
   what was linked, not what was guessed.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as A from "./ast.js";
import * as R from "./rational.js";
import { plain } from "./layout.js";
import { preservesSolutions } from "./verify.js";

/**
 * One equation as { coef: Map(letter → rational), constant: rational }, meaning
 * Σ coef·letter = constant — or { error } when it is not a straight-line one.
 */
export function linearForm(eq) {
  if (!A.isEquation(eq)) return { error: "That is not an equation." };
  const coef = new Map();
  let constant = R.ZERO;
  const take = (side, sign) => {
    for (const t of A.termsOf(side)) {
      const read = A.readTerm(t);
      if (!read) return `${plain(t)} is not a plain number-times-letter term — open the brackets and tidy it first.`;
      const c = sign > 0 ? read.c : R.neg(read.c);
      if (read.vars.length === 0) { constant = R.sub(constant, c); continue; }     // a number on this side moves across
      if (read.vars.length > 1 || !/^[A-Za-zα-ω]$/.test(read.vars[0])) {
        return `${plain(t)} multiplies letters together or raises one to a power, so this is not a system of straight-line equations.`;
      }
      coef.set(read.vars[0], R.add(coef.get(read.vars[0]) || R.ZERO, c));
    }
    return null;
  };
  const bad = take(eq.l, 1) || take(eq.r, -1);
  if (bad) return { error: bad };
  // Left over after collecting: Σ coef·letter + (constants of the left) = (constants of the right)
  // The loop above subtracted left-side constants and added right-side ones, so `constant` is the right-hand number.
  return { coef, constant };
}

/** The same equation rebuilt as a tree — Σ number·letter = number — to be checked. */
function rebuilt(form, order) {
  const terms = order.filter((v) => form.coef.has(v) && !R.isZero(form.coef.get(v)))
    .map((v) => A.prod([A.numberNode(form.coef.get(v)), A.vr(v)]));
  return A.eqn(terms.length ? A.sum(terms) : A.num(R.ZERO), A.numberNode(form.constant));
}

/**
 * Read the equations (in the order given) as a system and build its matrix forms.
 * → { letters, A, X, B, equation, augmented } or { error }.
 */
export function systemMatrix(equations) {
  if (equations.length < 2) return { error: "Link at least two equations." };
  const forms = [];
  for (const eq of equations) {
    const f = linearForm(eq);
    if (f.error) return { error: f.error };
    forms.push(f);
  }
  const letters = [...new Set(forms.flatMap((f) => [...f.coef.keys()]))].sort((a, b) => a.localeCompare(b));
  if (!letters.length) return { error: "There are no letters in these equations." };

  // Each line, rebuilt, must say what the original said.
  for (let i = 0; i < equations.length; i++) {
    const again = rebuilt(forms[i], letters);
    if (!preservesSolutions(equations[i], again).ok) {
      return { error: `I could not rewrite ${plain(equations[i])} as numbers times letters, so I will not put it in a matrix.` };
    }
  }

  const number = (r) => A.numberNode(r);
  const coefficients = A.mat(forms.map((f) => letters.map((v) => number(f.coef.get(v) || R.ZERO))));
  const unknowns = A.mat(letters.map((v) => [A.vr(v)]));
  const constants = A.mat(forms.map((f) => [number(f.constant)]));
  return {
    letters,
    A: coefficients, X: unknowns, B: constants,
    equation: A.eqn(A.prod([coefficients, unknowns]), constants),
    augmented: A.mat(forms.map((f) => [...letters.map((v) => number(f.coef.get(v) || R.ZERO)), number(f.constant)])),
  };
}
