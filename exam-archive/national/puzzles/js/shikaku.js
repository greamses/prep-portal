/* ═══════════════════════════════════════════════════════
   PUZZLES — seeded Shikaku generator/solver

   Shikaku ("divide by squares"): cut the whole grid into rectangles so that
   every rectangle contains exactly ONE number and has exactly that many
   cells. Every cell ends up in exactly one rectangle.

   Generated backwards, the way these puzzles always are: partition a blank
   grid into rectangles first, then write each rectangle's area into one of
   its own cells and throw the partition away. The player's job is to find it
   again. Same seeded-determinism contract as sudoku.js — generateShikaku(seed,
   ...) computes an identical puzzle on every client with zero network traffic.

   A partition alone can be AMBIGUOUS (two different sets of rectangles can
   satisfy the same clues), so each candidate is run through an exact-cover
   solver capped at two solutions and re-rolled until it has exactly one.
   Ambiguity isn't fatal here — the game validates a drawn rectangle against
   the RULES, not against a stored answer key, so any legal dissection scores
   — but a puzzle with one answer is the puzzle players expect.
═══════════════════════════════════════════════════════ */

import { mulberry32, hashSeed } from './rng.js';

export const GRID_SIZES = [5, 7, 10];

/* Difficulty is the size of the pieces: [minArea, maxArea, stopChance].
   Small rectangles mean many clues, each tightly constrained — you can nearly
   read them off. Big ones mean few clues, each with many possible shapes, and
   the grid only resolves once you see how they lock against each other.

   The MINIMUM is not cosmetic. A grid diced into dominoes is riddled with
   ambiguity — any 2×2 of them flips between two orientations that satisfy the
   same clues — and at 10×10 with a minimum of 2, fewer than one puzzle in
   twenty came out uniquely solvable. Raising the floor is what makes these
   puzzles have an answer; the numbers below are measured, not guessed.

   Scaled by grid size because "big piece" means something different on 25
   cells than on 100: the same [4, 9] that gives a 7×7 a proper Shikaku would
   leave a 5×5 with three rectangles in it. */
const DIFFICULTY = {
  5: { easy: [2, 4, 0.62], medium: [3, 6, 0.55], hard: [4, 8, 0.5] },
  7: { easy: [3, 6, 0.6], medium: [4, 9, 0.5], hard: [5, 12, 0.45] },
  10: { easy: [4, 8, 0.55], medium: [5, 12, 0.45], hard: [6, 16, 0.4] },
};
const settingsFor = (size, difficulty) => {
  const bySize = DIFFICULTY[size] || DIFFICULTY[7];
  return bySize[difficulty] || bySize.medium;
};

/* ── Partition ───────────────────────────────────────────────────────────
   Guillotine splitting: cut the grid in two, then cut the halves, until the
   pieces are the size this difficulty wants. Every piece is a rectangle by
   construction and they tile the grid exactly, which is precisely the
   invariant the puzzle needs. */

// Where to cut a side of length `len` (1..len-1). Sides of 4 or more avoid
// shaving off a 1-wide sliver — a grid full of 1×n strips reads as a maze,
// not a Shikaku.
function pickCut(len, rng) {
  if (len >= 4) return 2 + Math.floor(rng() * (len - 3));
  return 1 + Math.floor(rng() * (len - 1));
}

function splitInto(rect, rng, minArea, maxArea, stopChance, out) {
  const { r, c, w, h } = rect;
  const area = w * h;

  if (area <= maxArea && (area <= minArea || rng() < stopChance)) { out.push(rect); return; }

  const canV = w >= 2;
  const canH = h >= 2;
  if (!canV && !canH) { out.push(rect); return; }

  // Cut across the longer side most of the time, so pieces stay chunky rather
  // than degenerating into strips. A cut that would leave a half below the
  // minimum is rerolled; if a handful of tries can't find one, the piece
  // simply stays whole — better an oversized rectangle than a sliver.
  for (let tries = 0; tries < 6; tries++) {
    const vertical = canV && (!canH || (w > h ? rng() < 0.8 : rng() < 0.25));
    const cut = pickCut(vertical ? w : h, rng);
    const a = vertical ? { r, c, w: cut, h } : { r, c, w, h: cut };
    const b = vertical ? { r, c: c + cut, w: w - cut, h } : { r: r + cut, c, w, h: h - cut };
    if (a.w * a.h < minArea || b.w * b.h < minArea) continue;
    splitInto(a, rng, minArea, maxArea, stopChance, out);
    splitInto(b, rng, minArea, maxArea, stopChance, out);
    return;
  }
  out.push(rect);
}

// One candidate puzzle: a partition, plus a clue written in one cell of each
// piece. Which cell is itself random — a number in the corner of a long
// rectangle is a very different clue from the same number in its middle.
function buildCandidate(seed, size, minArea, maxArea, stopChance) {
  const rng = mulberry32(seed);
  const pieces = [];
  splitInto({ r: 0, c: 0, w: size, h: size }, rng, minArea, maxArea, stopChance, pieces);

  const clues = pieces.map((p) => {
    const dr = Math.floor(rng() * p.h);
    const dc = Math.floor(rng() * p.w);
    return { r: p.r + dr, c: p.c + dc, area: p.w * p.h };
  });
  const solution = pieces.map((p, i) => ({ ...p, clue: i }));
  return { clues, solution };
}

/* ── Solver ──────────────────────────────────────────────────────────────
   Exact cover: choose one rectangle per clue so that together they cover
   every cell exactly once. Since the clue areas sum to the cell count, "no
   two overlap" and "everything is covered" are the same condition — so the
   search only ever has to check overlap. */

// Every rectangle that could belong to one clue: the right area, containing
// its own clue cell, inside the grid, and containing no OTHER clue (two
// numbers in one rectangle is illegal by the rules).
function candidatesFor(clue, clues, size) {
  const out = [];
  const others = clues.filter((o) => o !== clue);
  for (let w = 1; w <= clue.area; w++) {
    if (clue.area % w !== 0) continue;
    const h = clue.area / w;
    if (w > size || h > size) continue;
    // Every placement of a w×h rectangle that still covers the clue cell.
    for (let r = Math.max(0, clue.r - h + 1); r <= Math.min(clue.r, size - h); r++) {
      for (let c = Math.max(0, clue.c - w + 1); c <= Math.min(clue.c, size - w); c++) {
        const holdsAnother = others.some((o) => o.r >= r && o.r < r + h && o.c >= c && o.c < c + w);
        if (!holdsAnother) out.push({ r, c, w, h });
      }
    }
  }
  return out;
}

/**
 * How many ways the clues can be satisfied, counting no further than `limit`.
 * 0 means the clues contradict each other, 1 is a proper puzzle, 2 means
 * "at least two" — the search stops as soon as it knows that much.
 */
export function countSolutions(clues, size, limit = 2) {
  const cands = clues.map((cl) => candidatesFor(cl, clues, size));
  if (cands.some((list) => list.length === 0)) return 0;

  const occupied = new Uint8Array(size * size);
  const placed = new Array(clues.length).fill(false);
  let count = 0;

  const fits = (rect) => {
    for (let r = rect.r; r < rect.r + rect.h; r++) {
      for (let c = rect.c; c < rect.c + rect.w; c++) if (occupied[r * size + c]) return false;
    }
    return true;
  };
  const mark = (rect, v) => {
    for (let r = rect.r; r < rect.r + rect.h; r++) {
      for (let c = rect.c; c < rect.c + rect.w; c++) occupied[r * size + c] = v;
    }
  };

  function search(remaining) {
    if (remaining === 0) { count += 1; return; }
    // Most-constrained clue first: a clue with one option left decides
    // itself, and a clue with none ends the branch here rather than after
    // every other clue has been tried around it.
    let bestList = null;
    let bestIndex = -1;
    for (let i = 0; i < clues.length; i++) {
      if (placed[i]) continue;
      const viable = cands[i].filter(fits);
      if (viable.length === 0) return;
      if (!bestList || viable.length < bestList.length) { bestList = viable; bestIndex = i; }
      if (viable.length === 1) break;
    }
    for (const rect of bestList) {
      mark(rect, 1); placed[bestIndex] = true;
      search(remaining - 1);
      mark(rect, 0); placed[bestIndex] = false;
      if (count >= limit) return;
    }
  }

  search(clues.length);
  return count;
}

/**
 * Returns { clues, solution, size } for a room's seed. `clues` is what the
 * player sees ({ r, c, area }); `solution` is the partition it was cut from
 * ({ r, c, w, h, clue }) — kept for the reveal, NOT for grading (see
 * validatePlacement: a drawn rectangle is judged by the rules, so any legal
 * dissection counts).
 *
 * Deterministic per (seed, difficulty, size): every client in a room computes
 * the identical puzzle locally, with zero reads or writes.
 */
export function generateShikaku(seed, difficulty, size) {
  const [minArea, maxArea, stopChance] = settingsFor(size, difficulty);

  let fallback = null;
  // Re-roll until the clues have exactly one answer — measured at ~4 tries on
  // average, 20 covers all but a handful of seeds. Bounded on purpose: a
  // puzzle that never gets there still plays (the rules do the grading), and
  // an unbounded loop would hang the round on the one seed that never
  // resolves. Worst case measured at ~45ms, once, at round start.
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = buildCandidate(hashSeed(seed, 4400 + attempt), size, minArea, maxArea, stopChance);
    if (!fallback) fallback = candidate;
    if (countSolutions(candidate.clues, size, 2) === 1) return { ...candidate, size };
  }
  return { ...fallback, size };
}

/* ── The rules, as the game applies them ─────────────────────────────────
   A rectangle the player draws is legal when it holds exactly one clue, has
   exactly that clue's area, and overlaps nothing already placed. Graded
   against the rules rather than the stored partition, so a player who finds a
   different-but-legal dissection is not told they are wrong. */

/** The two dragged corners, in either order, as { r, c, w, h }. */
export function rectFromCorners(a, b) {
  const r = Math.min(a.r, b.r);
  const c = Math.min(a.c, b.c);
  return { r, c, w: Math.abs(a.c - b.c) + 1, h: Math.abs(a.r - b.r) + 1 };
}

export function rectContains(rect, r, c) {
  return r >= rect.r && r < rect.r + rect.h && c >= rect.c && c < rect.c + rect.w;
}

/**
 * @returns { ok, clue, reason } — `clue` is the index of the single clue the
 * rectangle holds. `reason` is why it was refused ('overlap' | 'clues' |
 * 'area'), which the caller turns into the shake.
 */
export function validatePlacement(rect, clues, placedRects) {
  for (const p of placedRects) {
    const apart = rect.r >= p.r + p.h || p.r >= rect.r + rect.h
      || rect.c >= p.c + p.w || p.c >= rect.c + rect.w;
    if (!apart) return { ok: false, reason: 'overlap' };
  }
  const inside = [];
  clues.forEach((cl, i) => { if (rectContains(rect, cl.r, cl.c)) inside.push(i); });
  if (inside.length !== 1) return { ok: false, reason: 'clues' };
  if (rect.w * rect.h !== clues[inside[0]].area) return { ok: false, reason: 'area', clue: inside[0] };
  return { ok: true, clue: inside[0] };
}

export function countClues(clues) {
  return clues.length;
}
