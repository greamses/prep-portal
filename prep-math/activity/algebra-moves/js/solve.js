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
import { offers } from "./ops.js";
import { preservesSolutions } from "./verify.js";
import { plain } from "./layout.js";

/* Cheapest and most obviously-right first: tidy what is already written before
   changing the shape of it, or the tidying gets carried along inside the new
   shape — x/2 = 4 − 1 multiplied up reads x = 2(4 − 1). Shoving a term across
   the equals sign is the move most likely to undo itself, so it goes last. */
const RANK = { workout: 0, dropzero: 1, combine: 2, cancel: 3, times: 4, expand: 5, flip: 6, swap: 7, across: 8, divide: 9 };

/* A finished answer is a NUMBER, not merely something with no letters in it.
   (20 − 5)/3 is variable-free and still half a step from being an answer, so a
   fraction only counts once both halves are numbers themselves. */
const isNumberNode = (n) =>
  n.kind === "num" ||
  (n.kind === "neg" && isNumberNode(n.k)) ||
  (n.kind === "frac" && isNumberNode(n.a) && isNumberNode(n.b));

/** x = 5, or x = −4/3. One letter on the left, one plain number on the right. */
export function isSolved(eq) {
  return eq.l.kind === "var" && A.termsOf(eq.r).length === 1 && isNumberNode(eq.r);
}

/** 5 = x is the same answer, just written backwards — one "turn it round" away. */
const isAnswerBackwards = (eq) =>
  eq.r.kind === "var" && A.termsOf(eq.l).length === 1 && isNumberNode(eq.l);

/** Which side we are gathering the letters on — wherever most of them already are. */
function letterSide(eq) {
  const count = (side) => A.termsOf(side).filter((t) => !A.isNumeric(t)).length;
  return count(eq.r) > count(eq.l) ? "r" : "l";
}

/**
 * Work an equation through to x = something, using only the moves the student
 * is offered. Returns every line, in order, with the reason for each.
 *
 *   { solved, steps: [{ equation, note, move }], stuck? }
 */
export function solve(eq, { maxSteps = 24 } = {}) {
  const steps = [{ equation: plain(eq), note: "where we started", move: null }];
  const seen = new Set([plain(eq)]);

  for (let i = 0; i < maxSteps; i++) {
    if (isSolved(eq)) return { solved: true, steps };

    const home = letterSide(eq);
    const onHome = new Set(A.termsOf(eq[home]).map((t) => t.id));

    const choices = [];
    for (const side of ["l", "r"]) {
      for (const term of A.termsOf(eq[side])) {
        for (const offer of offers(eq, term.id)) {
          // Only carry a term across if it is on the wrong side for what it is:
          // letters belong on the home side, numbers on the other.
          // Turning it round is only progress when the answer is already there
          // backwards; otherwise it is a free move to cycle on.
          if (offer.key === "swap" && !isAnswerBackwards(eq)) continue;
          if (offer.key === "across") {
            const hasLetter = !A.isNumeric(term);
            const atHome = onHome.has(term.id);
            if (hasLetter === atHome) continue;
          }
          choices.push({ offer, rank: RANK[offer.key] ?? 9 });
        }
      }
    }
    choices.sort((a, b) => a.rank - b.rank);

    // Take the best move that is legal, verifies, and is not somewhere we have
    // already been — a repeat means the strategy is cycling, not progressing.
    let moved = false;
    for (const { offer } of choices) {
      const result = offer.run();
      if (result.error) continue;
      if (!preservesSolutions(eq, result.eq).ok) continue;
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

  return {
    solved: isSolved(eq),
    steps,
    stuck: isSolved(eq) ? undefined : "I ran out of moves that get any closer.",
  };
}
