/* ═══════════════════════════════════════════════════════
   PUZZLES — seeded sliding-number-tile generator
   Classic 15-puzzle style: numbered tiles 1..N²-1 plus one blank, on an
   N×N board. Every client in a room shares one `seed`, so
   generateSlider(seed, ...) produces the identical shuffled board on every
   device with zero network traffic — same philosophy as sudoku.js.

   Solvability is guaranteed by construction rather than permutation-parity
   math: the shuffle is a random walk of `shuffleMoves` legal slides
   starting from the solved board, so every intermediate (and final) state
   is reachable from — and therefore solvable back to — the goal.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed } from './rng.js';

export const SLIDER_SIZES = [3, 4, 5];
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
// What the tiles wear: plain numbers, fraction bars (mechanics borrowed from
// the standalone fraction slider in home/games/slide), or windows of one
// seeded picture (see art.js).
export const TILE_SETS = ['numbers', 'fractions', 'picture'];
// Random shuffle moves per tile — more moves scrambles the board further
// from solved. Self-limited to what's reachable; no risk of an unsolvable
// board since every move is a reversible slide from the goal state.
const DIFFICULTY_MOVES_PER_TILE = { easy: 6, medium: 14, hard: 25 };

function solvedBoard(gridSize) {
  const total = gridSize * gridSize;
  return Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));
}

// Flat-index neighbors of `blank` that are legal slide targets (adjacent,
// no wraparound across row edges).
function neighborsOf(blank, gridSize) {
  const total = gridSize * gridSize;
  const moves = [];
  if (blank - gridSize >= 0) moves.push(blank - gridSize); // up
  if (blank + gridSize < total) moves.push(blank + gridSize); // down
  if (blank % gridSize !== 0) moves.push(blank - 1); // left
  if ((blank + 1) % gridSize !== 0) moves.push(blank + 1); // right
  return moves;
}

// Returns { board, solved, gridSize }. `board`/`solved` are flat
// length-N² arrays of tile numbers (0 = blank).
export function generateSlider(seed, difficulty, gridSize) {
  const rng = mulberry32(seed);
  const solved = solvedBoard(gridSize);
  const board = solved.slice();
  const shuffleMoves = gridSize * gridSize * (DIFFICULTY_MOVES_PER_TILE[difficulty] ?? DIFFICULTY_MOVES_PER_TILE.medium);

  let blank = board.length - 1;
  let previousBlank = -1;
  for (let i = 0; i < shuffleMoves; i++) {
    const candidates = neighborsOf(blank, gridSize).filter((t) => t !== previousBlank);
    const pool = candidates.length ? candidates : neighborsOf(blank, gridSize);
    const target = pool[Math.floor(rng() * pool.length)];
    board[blank] = board[target];
    board[target] = 0;
    previousBlank = blank;
    blank = target;
  }

  return { board, solved, gridSize };
}

// How many non-blank tiles currently sit in their solved position.
export function scoreSlider(board, solved) {
  let correct = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== 0 && board[i] === solved[i]) correct += 1;
  }
  return correct;
}

export function countSliderTiles(gridSize) {
  return gridSize * gridSize - 1;
}

// Flat indices currently slidable (adjacent to the blank).
export function movableIndices(board, gridSize) {
  return neighborsOf(board.indexOf(0), gridSize);
}

// ── Fraction tiles ────────────────────────────────────────────────────────
// Mechanics ported from the standalone fraction slider (home/games/slide):
// each tile carries a fraction and the goal is smallest → largest, reading
// order. Because the values are unique and pre-sorted, "ascending order" IS
// the solved board — tile number n simply wears fractions[n-1] — so scoring
// and shuffling stay identical to the numbered slider.
const FRACTION_NS = 4242;

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

// A seeded pick of `count` unique reduced fractions, sorted ascending.
// Reduced-only keeps the values genuinely distinct (no 2/4 posing as 1/2),
// and the [0.06, 0.94] clamp keeps the bars visibly partial.
export function generateFractionValues(seed, count) {
  const pool = [];
  for (let den = 2; den <= 16; den++) {
    for (let num = 1; num < den; num++) {
      if (gcd(num, den) !== 1) continue;
      const value = num / den;
      if (value < 0.06 || value > 0.94) continue;
      pool.push({ num, den, value });
    }
  }
  const rng = mulberry32(hashSeed(seed, FRACTION_NS));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a.value - b.value);
}
