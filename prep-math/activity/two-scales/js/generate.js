/* ============================================================================
   TWO SCALES — the puzzles
   ----------------------------------------------------------------------------
   Three steps, and they are the lesson:

     evaluate    one scale already says what x is worth. The other has y on one
                 pan and something made of x on the other: swap the x for what
                 it is worth, tidy the numbers, and y is found. Nothing to
                 solve — just what substitution IS.
     solve       now the first scale has to be solved first (send a number
                 across, share the pans equally), and only then can it be put
                 into the second.
     two         neither scale says a letter's worth on its own. One is already
                 a letter alone — y = x + 1 — so THAT is the rule: swap it into
                 the other scale, and the scale you have left has one letter in
                 it. Solve that, then put it back to find the other.

   Every answer is a whole number, every step on the way is a whole number, and
   nothing is ever below zero at Evaluate.
   ========================================================================== */

import { block, scale } from "./model.js";
import { stream } from "/utils/components/workbook/seed.js";

const ones = (n) => (n ? [block("n", n)] : []);
const vars = (kind, c) => Array.from({ length: Math.abs(c) }, () => block(kind, Math.sign(c)));

export const LEVELS = {
  evaluate: { id: "evaluate", label: "Evaluate — one scale already says what x is worth" },
  solve: { id: "solve", label: "Solve, then substitute — solve one scale first" },
  two: { id: "two", label: "Two unknowns — a scale that says y in terms of x" },
};

/**
 * A puzzle.
 *   → { scales, want, answer, story, level }
 */
export function makePuzzle(level = "evaluate", seed = 1) {
  const r = stream(seed, "two-scales");
  if (level === "solve") return solvePuzzle(r);
  if (level === "two") return twoPuzzle(r);
  return evaluatePuzzle(r);
}

/* ── evaluate: x is given, find y ───────────────────────────────────────── */

function evaluatePuzzle(r) {
  const x = r.int(2, 9);
  const a = r.int(2, 4);
  const b = r.int(1, 9);
  const plus = r.chance(0.75) || a * x <= b;
  const y = a * x + (plus ? b : -b);
  return {
    level: "evaluate",
    scales: [
      scale([block("x", 1)], ones(x)),
      scale([block("y", 1)], [...vars("x", a), ...ones(plus ? b : -b)]),
    ],
    want: ["y"],
    answer: { x, y },
    story: `This scale says what x is worth. Put it into the other scale and find y.`,
  };
}

/* ── solve, then substitute ─────────────────────────────────────────────── */

function solvePuzzle(r) {
  const x = r.int(2, 8);
  const k = r.int(2, 4);
  const b = r.int(1, 9);
  /* kx + b = kx + b's total — a scale to solve: k lots of x and b against a number */
  const total = k * x + b;
  const a = r.int(1, 3);
  const c = r.int(1, 9);
  const y = a * x + c;
  return {
    level: "solve",
    scales: [
      scale([...vars("x", k), ...ones(b)], ones(total)),
      scale([block("y", 1)], [...vars("x", a), ...ones(c)]),
    ],
    want: ["x", "y"],
    answer: { x, y },
    story: `Solve the first scale for x — then put x into the second to find y.`,
  };
}

/* ── two unknowns ───────────────────────────────────────────────────────── */

function twoPuzzle(r) {
  for (let g = 0; g < 200; g++) {
    const x = r.int(2, 7);
    const d = r.int(1, 6);
    const k = r.int(1, 3);
    const y = x + d;               // scale B: y = x + d
    const s = k * x + y;           // scale A: kx + y = s
    if (s > 30) continue;
    return {
      level: "two",
      scales: [
        scale([...vars("x", k), block("y", 1)], ones(s)),
        scale([block("y", 1)], [block("x", 1), ...ones(d)]),
      ],
      want: ["x", "y"],
      answer: { x, y },
      story: `The second scale says y in terms of x. Swap it into the first, solve for x, then go back for y.`,
    };
  }
  return {
    level: "two",
    scales: [scale([block("x", 1), block("y", 1)], ones(9)), scale([block("y", 1)], [block("x", 1), block("n", 1)])],
    want: ["x", "y"],
    answer: { x: 4, y: 5 },
    story: "The second scale says y in terms of x.",
  };
}
