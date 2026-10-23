/* ═══════════════════════════════════════════════════════════════════════════
   THE SOLVER

   Plays the tool against itself. It has no powers the student does not have:
   it can only pick from the same `offers()` menu, and every line it produces
   went through the same verifier. So this is not a second implementation of
   algebra that could drift from the first — it is a STRATEGY over the one set
   of moves, and if the moves are right the working is right.

   That makes it useful for three things: worked solutions in the API, hints
   in the page later, and a standing test that the move set is actually
   sufficient to finish a problem rather than merely legal.

   The strategy is the ordinary one a teacher would narrate: tidy up what is
   already there, gather the letters on one side and the numbers on the other,
   then divide.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as A from "./ast.js";
import * as R from "./rational.js";
import { offers, hasSubstitutions, asNumbers, TIDY } from "./ops.js";
import { preservesSolutions } from "./verify.js";
import { plain } from "./layout.js";

/* Cheapest and most obviously-right first: tidy what is already written before
   changing the shape of it, or the tidying gets carried along inside the new
   shape — x/2 = 4 − 1 multiplied up reads x = 2(4 − 1). Shoving a term across
   the equals sign is the move most likely to undo itself, so it goes last. */
const RANK = { substitute: 0, workout: 1, trig: 1, multiply: 1, diff: 1, integrate: 1, limit: 1, dropzero: 2, pyth: 2, combine: 3, cancel: 4, times: 5, expand: 6, flip: 7, swap: 8, across: 9, divide: 10 };
const LAST = 99;

const CALC = new Set(["deriv", "int", "lim"]);
const CALC_OK = new Set(["substitute", "workout", "multiply", "combine", "dropzero", "expand", "split", "cancel",
  "indices", "limit", "diff", "integrate", "trig", "pyth", "addfrac", "surd"]);
const holdsCalculus = (n) => { let yes = false; A.walk(n, (m) => { if (CALC.has(m.kind)) yes = true; }); return yes; };
function insideCalculus(eq, id) {
  for (let p = A.parentOf(eq, id); p; p = A.parentOf(eq, p.id)) if (CALC.has(p.kind)) return true;
  return false;
}

/* A finished answer is a NUMBER, not merely something with no letters in it.
   (20 − 5)/3 is variable-free and still half a step from being an answer, so a
   fraction only counts once both halves are numbers themselves — AND once it is
   as far down as it goes. 48/6 passes every other test for a number and is not
   an answer to anything; the check is the same one "work it out" makes, which
   is what keeps the two from ever disagreeing. */
const isNumberNode = (n) =>
  n.kind === "num" ||
  (n.kind === "pm" && isNumberNode(n.k)) ||
  isSimpleSurd(n) ||
  (n.kind === "neg" && isNumberNode(n.k)) ||
  // 2√3: a whole number in front of a simplest surd.
  (n.kind === "prod" && n.kids.length === 2 && n.kids[0].kind === "num" && R.isInt(n.kids[0].v)
    && !R.isOne(n.kids[0].v) && isSimpleSurd(n.kids[1])) ||
  (n.kind === "frac" && isNumberNode(n.a) && isNumberNode(n.b) &&
    (isLowest(n) || (A.exactValue(n.a) === null && n.b.kind === "num" && R.isInt(n.b.v))));

/* A surd as simple as it goes: a whole number under the root with no square
   factor left in it. √3 is an answer; √12 is still 2√3 waiting to happen. */
function isSimpleSurd(n) {
  if (n.kind !== "root") return false;
  const v = A.exactValue(n.k);
  return !!v && R.isInt(v) && v.n > 1n && R.squareSplit(v.n).out === 1n;
}

function isLowest(n) {
  const v = A.exactValue(n);
  return !!v && plain(A.numberNode(v)) === plain(n);
}

/**
 * Is this line finished?
 *
 * An equation is finished at x = 5: one letter on the left, one plain number on
 * the right. An expression has no such shape to reach, so finished means what
 * it means on paper — there is nothing left to do to it. Asking the move set
 * itself is both the honest definition and a self-maintaining one: a move added
 * later automatically stops counting a line as tidy while it still applies.
 */
export function isSolved(eq, { given = null } = {}) {
  if (eq.kind === "expr") {
    return !A.allTerms(eq).some((t) => offers(eq, t.id, { given }).length > 0);
  }
  if (hasSubstitutions(eq, given)) return false;
  /* Finished means a letter on its own on the left that does not appear on the
     right — x = 5, but just as much t = (v − u)/a or the quadratic formula,
     which are what rearranging a formula is FOR — with nothing left on the
     right that a tidy-up would still change. */
  if (eq.l.kind !== "var" || A.varsIn(eq.r).includes(eq.l.name)) return false;
  // A d/dx, an ∫ or a lim still on the right is work still to do.
  let calculus = false;
  A.walk(eq.r, (n) => { if (n.kind === "deriv" || n.kind === "int" || n.kind === "lim") calculus = true; });
  if (calculus) return false;
  if (A.termsOf(eq.r).length === 1 && isNumberNode(eq.r)) return true;
  const right = A.allTerms(eq).filter((t) => A.findById(eq.r, t.id));
  return !right.some((t) => offers(eq, t.id, { given }).some((o) => TIDY.has(o.key)));
}

/**
 * The letter and number a finished line stands for — x = 5 once it is there —
 * which is what another card's substitution can reach across for. Anything
 * short of exactly that shape (an expression, a formula still waiting on a
 * number, an equation not yet alone on one side) is not a value to hand out,
 * so this returns null for all of it rather than guessing at one.
 */
export function solvedLetterValue(eq, { given = null } = {}) {
  if (eq.kind !== "eq" || eq.l.kind !== "var") return null;
  if (!isSolved(eq, { given })) return null;
  const value = A.exactValue(eq.r);
  return value ? { name: eq.l.name, value } : null;
}

/** 5 = x is the same answer, just written backwards — one "turn it round" away. */
const isAnswerBackwards = (eq) =>
  eq.kind === "eq" && eq.r.kind === "var" && A.termsOf(eq.l).length === 1 && isNumberNode(eq.l);

/** Which side we are gathering the letters on — wherever most of them already are. */
function letterSide(eq) {
  if (eq.kind === "expr") return "e";
  const count = (side) => A.termsOf(side).filter((t) => !A.isNumeric(t)).length;
  return count(eq.r) > count(eq.l) ? "r" : "l";
}

/**
 * The moves worth offering on one term, best first.
 *
 * This is what the student is shown, and it is the same judgement the solver
 * makes about its own next move — one function, so the tool can never offer a
 * move it would not play itself. It is why a term with nothing useful to do
 * says so rather than offering something that undoes the last line.
 *
 * Two rules do the filtering, and they are the two a teacher says out loud:
 * a term only crosses the equals sign if it is on the wrong side for what it
 * is — letters together, numbers on the other side — and turning the equation
 * round is only progress when the answer is already sitting there backwards.
 */
export function bestOffers(eq, id, { given = null } = {}) {
  const home = letterSide(eq);
  const onHome = new Set(A.termsOf(eq[home]).map((t) => t.id));
  const term = A.findById(eq, id);
  if (!term) return [];

  // A formula with a number still to go into it has exactly one sensible next
  // move anywhere on the line, and it is putting that number in. Reshaping a
  // formula around letters that are about to become 5 and 2 is work thrown away.
  const pending = hasSubstitutions(eq, given);

  // Inside a d/dx, an ∫ or a lim the job is to simplify what is there until
  // the calculus can be done — not to carry it across or rebuild it.
  const calc = holdsCalculus(term) || insideCalculus(eq, id);
  const out = [];
  for (const offer of offers(eq, id, { given })) {
    if (pending && offer.key !== "substitute") continue;
    if (calc && !CALC_OK.has(offer.key)) continue;
    if (offer.key === "swap" && !isAnswerBackwards(eq)) continue;
    if (offer.key === "across") {
      const hasLetter = !A.isNumeric(term);
      if (hasLetter === onHome.has(id)) continue;
    }
    out.push(offer);
  }
  return out.sort((a, b) => (RANK[a.key] ?? LAST) - (RANK[b.key] ?? LAST));
}

/**
 * Work a line through to wherever it finishes — x = something for an equation,
 * as tidy as it goes for an expression — using only the moves the student is
 * offered. Returns every line, in order, with the reason for each.
 *
 *   { solved, steps: [{ equation, note, move }], stuck? }
 */
export function solve(eq, { maxSteps = 24, given = null } = {}) {
  const steps = [{ equation: plain(eq), note: "where we started", move: null }];
  const seen = new Set([plain(eq)]);
  const pinned = given ? asNumbers(given) : null;

  for (let i = 0; i < maxSteps; i++) {
    if (isSolved(eq, { given })) return { solved: true, steps };

    // Exactly what the student would be shown on every term, pooled.
    const choices = [];
    for (const term of A.allTerms(eq)) {
      for (const offer of bestOffers(eq, term.id, { given })) {
        choices.push({ offer, rank: RANK[offer.key] ?? LAST });
      }
    }
    choices.sort((a, b) => a.rank - b.rank);

    // Take the best move that is legal, verifies, and is not somewhere we have
    // already been — a repeat means the strategy is cycling, not progressing.
    let moved = false;
    for (const { offer } of choices) {
      const result = offer.run();
      if (result.error) continue;
      if (!preservesSolutions(eq, result.eq, { given: pinned, scaledBy: result.scaledBy, upToConstant: result.upToConstant, inverse: result.inverse }).ok) continue;
      const line = plain(result.eq);
      if (seen.has(line)) continue;
      seen.add(line);
      eq = result.eq;
      steps.push({ equation: line, note: result.note, move: offer.key });
      moved = true;
      break;
    }
    if (!moved) break;
  }

  const done = isSolved(eq, { given });
  return {
    solved: done,
    steps,
    stuck: done ? undefined : "I ran out of moves that get any closer.",
  };
}
