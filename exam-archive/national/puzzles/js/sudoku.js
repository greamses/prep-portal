/* ═══════════════════════════════════════════════════════
   PUZZLES — seeded Sudoku generator/solver
   Every client in a room shares one `seed`, so generatePuzzle(seed, ...)
   produces the identical givens + solution on every device with zero
   network traffic — same philosophy as Drills' rng.js.

   Uses bitmask row/col/box constraints + a minimum-remaining-values (MRV)
   heuristic for both the initial fill and the uniqueness-checking solver,
   so puzzle generation (including verifying each removed cell still
   leaves a unique solution) stays fast enough to run on the main thread.
═══════════════════════════════════════════════════════ */

// mulberry32/hashSeed — copied from drills/js/rng.js (tiny + generic enough
// that a shared module isn't worth the cross-page coupling). Exported so
// bots.js can derive its own independent seeded streams from the same
// primitives.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(seed, ns) {
  let h = (seed ^ Math.imul(ns + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

export const GRID_SIZES = [4, 6, 9];
export const GRID_CONFIGS = {
  4: { boxW: 2, boxH: 2 },
  6: { boxW: 3, boxH: 2 },
  9: { boxW: 3, boxH: 3 },
};
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
// Fraction of cells left blank — the removal loop only ever removes a cell
// when doing so still leaves a unique solution, so this is a target/ceiling
// the algorithm self-limits against, not a guarantee.
const DIFFICULTY_BLANK_RATIO = { easy: 0.42, medium: 0.54, hard: 0.66 };

function popcount(x) {
  let n = 0;
  while (x) { x &= x - 1; n++; }
  return n;
}

function shuffledDigitsFromMask(mask, N, rng) {
  const digits = [];
  for (let d = 1; d <= N; d++) if (mask & (1 << (d - 1))) digits.push(d);
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function boxIndexFor(N, boxW, boxH) {
  const boxesPerRow = N / boxW;
  return (r, c) => Math.floor(r / boxH) * boxesPerRow + Math.floor(c / boxW);
}

// Builds row/col/box occupancy bitmasks from an existing (possibly partial)
// grid — used to seed the solver's constraint state from a puzzle-so-far.
function masksFromGrid(grid, N, boxIndex) {
  const rowMask = new Array(N).fill(0);
  const colMask = new Array(N).fill(0);
  const boxMask = new Array(N).fill(0);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const d = grid[r][c];
      if (!d) continue;
      const bit = 1 << (d - 1);
      rowMask[r] |= bit; colMask[c] |= bit; boxMask[boxIndex(r, c)] |= bit;
    }
  }
  return { rowMask, colMask, boxMask };
}

// Finds the empty cell with the fewest legal candidates (MRV heuristic —
// dramatically cuts backtracking versus scanning row-major). Returns null
// once the grid is fully filled, or a cell with count:0 on a dead end.
function findMRVCell(grid, N, boxIndex, rowMask, colMask, boxMask, full) {
  let best = null;
  let bestCount = Infinity;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (grid[r][c] !== 0) continue;
      const avail = full & ~(rowMask[r] | colMask[c] | boxMask[boxIndex(r, c)]);
      const count = popcount(avail);
      if (count === 0) return { r, c, avail: 0, count: 0 };
      if (count < bestCount) {
        bestCount = count;
        best = { r, c, avail, count };
        if (count === 1) return best;
      }
    }
  }
  return best;
}

// Fills an empty NxN grid into a complete, valid solution — randomized
// candidate order (seeded) so the same seed always yields the same grid,
// but different seeds yield genuinely different solutions.
function generateSolution(seed, N, boxW, boxH) {
  const rng = mulberry32(seed);
  const boxIndex = boxIndexFor(N, boxW, boxH);
  const grid = Array.from({ length: N }, () => new Array(N).fill(0));
  const rowMask = new Array(N).fill(0);
  const colMask = new Array(N).fill(0);
  const boxMask = new Array(N).fill(0);
  const full = (1 << N) - 1;

  function backtrack() {
    const cell = findMRVCell(grid, N, boxIndex, rowMask, colMask, boxMask, full);
    if (!cell) return true; // no empty cells left — solved
    if (cell.count === 0) return false; // dead end
    const { r, c, avail } = cell;
    for (const d of shuffledDigitsFromMask(avail, N, rng)) {
      const bit = 1 << (d - 1);
      grid[r][c] = d;
      rowMask[r] |= bit; colMask[c] |= bit; boxMask[boxIndex(r, c)] |= bit;
      if (backtrack()) return true;
      grid[r][c] = 0;
      rowMask[r] &= ~bit; colMask[c] &= ~bit; boxMask[boxIndex(r, c)] &= ~bit;
    }
    return false;
  }
  backtrack();
  return grid;
}

// Counts solutions to a (possibly partial) grid, stopping early once
// `limit` is reached — used to confirm a puzzle still has exactly one
// solution after tentatively blanking a cell.
function countSolutions(grid, N, boxW, boxH, limit) {
  const boxIndex = boxIndexFor(N, boxW, boxH);
  const work = grid.map((row) => row.slice());
  const { rowMask, colMask, boxMask } = masksFromGrid(work, N, boxIndex);
  const full = (1 << N) - 1;
  let count = 0;

  function backtrack() {
    if (count >= limit) return;
    const cell = findMRVCell(work, N, boxIndex, rowMask, colMask, boxMask, full);
    if (!cell) { count++; return; }
    if (cell.count === 0) return;
    const { r, c, avail } = cell;
    for (let d = 1; d <= N; d++) {
      const bit = 1 << (d - 1);
      if (!(avail & bit)) continue;
      work[r][c] = d;
      rowMask[r] |= bit; colMask[c] |= bit; boxMask[boxIndex(r, c)] |= bit;
      backtrack();
      work[r][c] = 0;
      rowMask[r] &= ~bit; colMask[c] &= ~bit; boxMask[boxIndex(r, c)] &= ~bit;
      if (count >= limit) return;
    }
  }
  backtrack();
  return count;
}

// Blanks cells out of a complete solution, one at a time in a seeded random
// order, keeping each removal only if the puzzle still has a unique
// solution — the standard technique for generating proper Sudoku puzzles.
function makePuzzle(solution, seed, N, boxW, boxH, targetBlanks) {
  const rng = mulberry32(seed);
  const positions = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) positions.push([r, c]);
  shuffleInPlace(positions, rng);

  const puzzle = solution.map((row) => row.slice());
  let blanks = 0;
  for (const [r, c] of positions) {
    if (blanks >= targetBlanks) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    const solutionCount = countSolutions(puzzle, N, boxW, boxH, 2);
    if (solutionCount === 1) blanks += 1;
    else puzzle[r][c] = backup;
  }
  return puzzle;
}

// Returns { givens, solution, gridSize } — `givens` has 0 for every blank
// cell, `solution` is the fully-filled answer key. Deterministic per
// (seed, difficulty, gridSize): every client in a room computes the exact
// same puzzle locally, with zero reads/writes.
export function generatePuzzle(seed, difficulty, gridSize) {
  const config = GRID_CONFIGS[gridSize] || GRID_CONFIGS[9];
  const solution = generateSolution(seed, gridSize, config.boxW, config.boxH);
  const total = gridSize * gridSize;
  const ratio = DIFFICULTY_BLANK_RATIO[difficulty] ?? DIFFICULTY_BLANK_RATIO.medium;
  const targetBlanks = Math.round(total * ratio);
  const givens = makePuzzle(solution, hashSeed(seed, 777), gridSize, config.boxW, config.boxH, targetBlanks);
  return { givens, solution, gridSize };
}

// How many of the currently-filled editable cells match the solution —
// the round's live/final score.
export function scoreGrid(currentGrid, solution, givens) {
  let correct = 0;
  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution.length; c++) {
      if (givens[r][c] !== 0) continue; // givens don't count toward score
      if (currentGrid[r][c] !== 0 && currentGrid[r][c] === solution[r][c]) correct += 1;
    }
  }
  return correct;
}

export function countEditableCells(givens) {
  let n = 0;
  for (const row of givens) for (const v of row) if (v === 0) n += 1;
  return n;
}
