/**
 * ai.js — a compact alpha-beta chess engine that plays one side.
 *
 * It searches with the same ChessGame instance the UI uses, applying and
 * reverting moves via the engine's internal make/unmake (`_applyMove` /
 * `_revertMove`) so no board copying is needed. Evaluation is classic
 * material + piece-square tables, scored from White's perspective.
 *
 * Difficulty just sets the search depth (1 = casual, 3 = challenging).
 */
import { WHITE, BLACK } from "./game.js";

const opp = (s) => (s === WHITE ? BLACK : WHITE);
const MATE = 1_000_000;

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

/* Piece-square tables from White's perspective; rank 0 = White's home rank.
   Black reads the same table mirrored vertically (7 - rank). */
const PST = {
  p: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  n: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  b: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  r: [
    [0, 0, 0, 5, 5, 0, 0, 0],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  q: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  k: [
    [20, 30, 10, 0, 0, 10, 30, 20],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
  ],
};

/** Static evaluation in centipawns, positive = good for White. */
function evaluate(game) {
  let score = 0;
  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const p = game.board[f][r];
      if (!p) continue;
      const table = PST[p.type];
      const pst = p.side === WHITE ? table[r][f] : table[7 - r][f];
      const v = VALUE[p.type] + pst;
      score += p.side === WHITE ? v : -v;
    }
  }
  return score;
}

/** Captures first (most-valuable victim) for better alpha-beta pruning. */
function orderMoves(game, moves) {
  return moves
    .map((m) => {
      const victim = game.at(m.to.file, m.to.rank);
      return { m, gain: victim ? VALUE[victim.type] : 0 };
    })
    .sort((a, b) => b.gain - a.gain)
    .map((x) => x.m);
}

function search(game, depth, alpha, beta, side, ply) {
  const moves = game.allLegalMoves(side);
  if (moves.length === 0) {
    // No legal moves: checkmate (bad for `side`) or stalemate (draw).
    if (game.isInCheck(side)) {
      const mate = MATE - ply; // prefer faster mates
      return side === WHITE ? -mate : mate;
    }
    return 0;
  }
  if (depth <= 0) return evaluate(game);

  const ordered = orderMoves(game, moves);
  if (side === WHITE) {
    let best = -Infinity;
    for (const m of ordered) {
      const u = game._applyMove(m, { silent: true });
      best = Math.max(best, search(game, depth - 1, alpha, beta, BLACK, ply + 1));
      game._revertMove(u);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of ordered) {
    const u = game._applyMove(m, { silent: true });
    best = Math.min(best, search(game, depth - 1, alpha, beta, WHITE, ply + 1));
    game._revertMove(u);
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

/**
 * Pick the best move for `side` at the given depth. Returns a move object
 * (same shape the engine produces) or null if there are none. A little
 * randomness among equal-best moves keeps games from being identical.
 */
export function chooseMove(game, side, depth = 2) {
  const moves = orderMoves(game, game.allLegalMoves(side));
  if (moves.length === 0) return null;

  let best = null;
  let bestScore = side === WHITE ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const m of moves) {
    const u = game._applyMove(m, { silent: true });
    const sc = search(game, depth - 1, alpha, beta, opp(side), 1);
    game._revertMove(u);

    if (side === WHITE) {
      if (sc > bestScore || (sc === bestScore && Math.random() < 0.35)) {
        bestScore = sc;
        best = m;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (sc < bestScore || (sc === bestScore && Math.random() < 0.35)) {
        bestScore = sc;
        best = m;
      }
      beta = Math.min(beta, bestScore);
    }
  }
  return best;
}

export const DIFFICULTY = { easy: 1, medium: 2, hard: 3 };
