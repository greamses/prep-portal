/**
 * game.js — a self-contained, framework-free chess rules engine.
 *
 * The 3D layer never decides what's legal; it asks this engine. Board state
 * is an 8×8 grid `board[file][rank]` of `{ type, side }` (or null). Files are
 * 0..7 (a–h), ranks 0..7 (1–8). White is on ranks 0-1, black on 6-7.
 *
 * Supports the full rule set: per-piece movement, captures, check,
 * checkmate, stalemate, castling, en passant and promotion. Plus undo.
 */

const WHITE = "white";
const BLACK = "black";
const opp = (s) => (s === WHITE ? BLACK : WHITE);
const inBounds = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;

export class ChessGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    const back = ["r", "n", "b", "q", "k", "b", "n", "r"];
    for (let f = 0; f < 8; f++) {
      this.board[f][0] = { type: back[f], side: WHITE };
      this.board[f][1] = { type: "p", side: WHITE };
      this.board[f][6] = { type: "p", side: BLACK };
      this.board[f][7] = { type: back[f], side: BLACK };
    }
    this.turn = WHITE;
    this.enPassant = null; // {file, rank} square that can be captured onto
    this.castling = {
      white: { K: true, Q: true },
      black: { K: true, Q: true },
    };
    this.history = [];
  }

  at(f, r) {
    return inBounds(f, r) ? this.board[f][r] : null;
  }

  /* ---------------- Move generation ---------------- */

  /** Pseudo-legal moves (ignores leaving own king in check). */
  pseudoMoves(f, r) {
    const piece = this.at(f, r);
    if (!piece) return [];
    const moves = [];
    const side = piece.side;
    const add = (tf, tr, flags = {}) => {
      const target = this.at(tf, tr);
      if (target && target.side === side) return false; // blocked by own
      moves.push({
        from: { file: f, rank: r },
        to: { file: tf, rank: tr },
        flags,
      });
      return !target; // can continue sliding only into empty squares
    };

    const slide = (dirs) => {
      for (const [df, dr] of dirs) {
        let tf = f + df;
        let tr = r + dr;
        while (inBounds(tf, tr) && add(tf, tr)) {
          tf += df;
          tr += dr;
        }
      }
    };

    switch (piece.type) {
      case "p":
        this._pawnMoves(f, r, side, moves);
        break;
      case "n":
        for (const [df, dr] of [
          [1, 2], [2, 1], [2, -1], [1, -2],
          [-1, -2], [-2, -1], [-2, 1], [-1, 2],
        ]) {
          if (inBounds(f + df, r + dr)) add(f + df, r + dr);
        }
        break;
      case "b":
        slide([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
        break;
      case "r":
        slide([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        break;
      case "q":
        slide([
          [1, 0], [-1, 0], [0, 1], [0, -1],
          [1, 1], [1, -1], [-1, 1], [-1, -1],
        ]);
        break;
      case "k":
        for (const [df, dr] of [
          [1, 0], [-1, 0], [0, 1], [0, -1],
          [1, 1], [1, -1], [-1, 1], [-1, -1],
        ]) {
          if (inBounds(f + df, r + dr)) add(f + df, r + dr);
        }
        this._castleMoves(f, r, side, moves);
        break;
    }
    return moves;
  }

  _pawnMoves(f, r, side, moves) {
    const dir = side === WHITE ? 1 : -1;
    const startRank = side === WHITE ? 1 : 6;
    const promoteRank = side === WHITE ? 7 : 0;
    const oneR = r + dir;

    const pushFlags = (tr) =>
      tr === promoteRank ? { promotion: true } : {};

    // Forward one
    if (inBounds(f, oneR) && !this.at(f, oneR)) {
      moves.push({ from: { file: f, rank: r }, to: { file: f, rank: oneR }, flags: pushFlags(oneR) });
      // Forward two from start
      const twoR = r + dir * 2;
      if (r === startRank && !this.at(f, twoR)) {
        moves.push({
          from: { file: f, rank: r },
          to: { file: f, rank: twoR },
          flags: { doublePush: true },
        });
      }
    }
    // Captures (incl. en passant)
    for (const df of [-1, 1]) {
      const tf = f + df;
      if (!inBounds(tf, oneR)) continue;
      const target = this.at(tf, oneR);
      if (target && target.side !== side) {
        moves.push({ from: { file: f, rank: r }, to: { file: tf, rank: oneR }, flags: pushFlags(oneR) });
      } else if (
        this.enPassant &&
        this.enPassant.file === tf &&
        this.enPassant.rank === oneR
      ) {
        moves.push({
          from: { file: f, rank: r },
          to: { file: tf, rank: oneR },
          flags: { enPassant: true },
        });
      }
    }
  }

  _castleMoves(f, r, side, moves) {
    const rights = this.castling[side];
    const homeRank = side === WHITE ? 0 : 7;
    if (r !== homeRank || f !== 4) return;
    if (this.isInCheck(side)) return;

    // King-side: squares f,g empty; e,f,g not attacked; rook on h.
    if (
      rights.K &&
      !this.at(5, homeRank) &&
      !this.at(6, homeRank) &&
      this._rookReady(7, homeRank, side) &&
      !this.isSquareAttacked(5, homeRank, opp(side)) &&
      !this.isSquareAttacked(6, homeRank, opp(side))
    ) {
      moves.push({
        from: { file: 4, rank: homeRank },
        to: { file: 6, rank: homeRank },
        flags: { castle: "K" },
      });
    }
    // Queen-side: squares b,c,d empty; e,d,c not attacked; rook on a.
    if (
      rights.Q &&
      !this.at(1, homeRank) &&
      !this.at(2, homeRank) &&
      !this.at(3, homeRank) &&
      this._rookReady(0, homeRank, side) &&
      !this.isSquareAttacked(3, homeRank, opp(side)) &&
      !this.isSquareAttacked(2, homeRank, opp(side))
    ) {
      moves.push({
        from: { file: 4, rank: homeRank },
        to: { file: 2, rank: homeRank },
        flags: { castle: "Q" },
      });
    }
  }

  _rookReady(f, r, side) {
    const p = this.at(f, r);
    return p && p.type === "r" && p.side === side;
  }

  /** Fully legal moves from a square (filters out self-check). */
  legalMoves(f, r) {
    const piece = this.at(f, r);
    if (!piece || piece.side !== this.turn) return [];
    return this.pseudoMoves(f, r).filter((m) => !this._leavesKingInCheck(m, piece.side));
  }

  /** All legal moves for the side to move. */
  allLegalMoves(side = this.turn) {
    const out = [];
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const p = this.board[f][r];
        if (p && p.side === side) {
          for (const m of this.pseudoMoves(f, r)) {
            if (!this._leavesKingInCheck(m, side)) out.push(m);
          }
        }
      }
    }
    return out;
  }

  _leavesKingInCheck(move, side) {
    const undo = this._applyMove(move, { silent: true });
    const bad = this.isInCheck(side);
    this._revertMove(undo);
    return bad;
  }

  /* ---------------- Attack / check detection ---------------- */

  findKing(side) {
    for (let f = 0; f < 8; f++)
      for (let r = 0; r < 8; r++) {
        const p = this.board[f][r];
        if (p && p.type === "k" && p.side === side) return { file: f, rank: r };
      }
    return null;
  }

  isInCheck(side) {
    const k = this.findKing(side);
    return k ? this.isSquareAttacked(k.file, k.rank, opp(side)) : false;
  }

  /** Is (f,r) attacked by any piece of `bySide`? */
  isSquareAttacked(f, r, bySide) {
    const dir = bySide === WHITE ? 1 : -1;
    // Pawns (they attack toward their travel direction)
    for (const df of [-1, 1]) {
      const p = this.at(f + df, r - dir);
      if (p && p.side === bySide && p.type === "p") return true;
    }
    // Knights
    for (const [df, dr] of [
      [1, 2], [2, 1], [2, -1], [1, -2],
      [-1, -2], [-2, -1], [-2, 1], [-1, 2],
    ]) {
      const p = this.at(f + df, r + dr);
      if (p && p.side === bySide && p.type === "n") return true;
    }
    // King (adjacency)
    for (const [df, dr] of [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1],
    ]) {
      const p = this.at(f + df, r + dr);
      if (p && p.side === bySide && p.type === "k") return true;
    }
    // Sliding: bishops/queen (diagonals), rooks/queen (orthogonals)
    const diag = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    const orth = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const scan = (dirs, types) => {
      for (const [df, dr] of dirs) {
        let tf = f + df,
          tr = r + dr;
        while (inBounds(tf, tr)) {
          const p = this.board[tf][tr];
          if (p) {
            if (p.side === bySide && types.includes(p.type)) return true;
            break;
          }
          tf += df;
          tr += dr;
        }
      }
      return false;
    };
    if (scan(diag, ["b", "q"])) return true;
    if (scan(orth, ["r", "q"])) return true;
    return false;
  }

  /* ---------------- Applying moves ---------------- */

  /**
   * Internal apply — mutates the board and returns an undo record. Used both
   * for real moves and for hypothetical self-check tests.
   */
  _applyMove(move, { silent = false, promotion = "q" } = {}) {
    const { from, to, flags } = move;
    const piece = this.board[from.file][from.rank];
    const undo = {
      move,
      piece,
      captured: null,
      capturedSquare: null,
      prevEnPassant: this.enPassant,
      prevCastling: JSON.parse(JSON.stringify(this.castling)),
      promotion: null,
      rookMove: null,
    };

    // En passant capture removes the pawn behind the target square.
    if (flags.enPassant) {
      const dir = piece.side === WHITE ? 1 : -1;
      const capR = to.rank - dir;
      undo.captured = this.board[to.file][capR];
      undo.capturedSquare = { file: to.file, rank: capR };
      this.board[to.file][capR] = null;
    } else if (this.board[to.file][to.rank]) {
      undo.captured = this.board[to.file][to.rank];
      undo.capturedSquare = { file: to.file, rank: to.rank };
    }

    // Move the piece.
    this.board[from.file][from.rank] = null;
    this.board[to.file][to.rank] = piece;

    // Promotion.
    if (flags.promotion) {
      undo.promotion = piece.type;
      this.board[to.file][to.rank] = { type: promotion, side: piece.side };
    }

    // Castling: shift the rook.
    if (flags.castle) {
      const hr = to.rank;
      if (flags.castle === "K") {
        const rook = this.board[7][hr];
        this.board[7][hr] = null;
        this.board[5][hr] = rook;
        undo.rookMove = { from: { file: 7, rank: hr }, to: { file: 5, rank: hr } };
      } else {
        const rook = this.board[0][hr];
        this.board[0][hr] = null;
        this.board[3][hr] = rook;
        undo.rookMove = { from: { file: 0, rank: hr }, to: { file: 3, rank: hr } };
      }
    }

    // Update castling rights + en passant target only for "real" moves
    // (silent self-check probes restore everything anyway).
    this.enPassant = flags.doublePush
      ? { file: to.file, rank: (from.rank + to.rank) / 2 }
      : null;

    if (piece.type === "k") {
      this.castling[piece.side].K = false;
      this.castling[piece.side].Q = false;
    }
    if (piece.type === "r") {
      const hr = piece.side === WHITE ? 0 : 7;
      if (from.file === 0 && from.rank === hr) this.castling[piece.side].Q = false;
      if (from.file === 7 && from.rank === hr) this.castling[piece.side].K = false;
    }
    // Capturing a rook on its home square also kills that castling right.
    if (undo.captured && undo.captured.type === "r") {
      const cs = undo.capturedSquare;
      const ehr = undo.captured.side === WHITE ? 0 : 7;
      if (cs.rank === ehr && cs.file === 0) this.castling[undo.captured.side].Q = false;
      if (cs.rank === ehr && cs.file === 7) this.castling[undo.captured.side].K = false;
    }

    return undo;
  }

  _revertMove(undo) {
    const { move, piece } = undo;
    const { from, to } = move;
    // Restore moved piece (undo promotion type).
    this.board[from.file][from.rank] = piece;
    this.board[to.file][to.rank] = null;
    if (undo.promotion) piece.type = undo.promotion;
    // Restore capture.
    if (undo.captured) {
      const cs = undo.capturedSquare;
      this.board[cs.file][cs.rank] = undo.captured;
    }
    // Restore castled rook.
    if (undo.rookMove) {
      const rm = undo.rookMove;
      const rook = this.board[rm.to.file][rm.to.rank];
      this.board[rm.to.file][rm.to.rank] = null;
      this.board[rm.from.file][rm.from.rank] = rook;
    }
    this.enPassant = undo.prevEnPassant;
    this.castling = undo.prevCastling;
  }

  /**
   * Public move entry point. Validates the move is legal, applies it, flips
   * the turn, and records history. `promotion` chooses the promoted type.
   * Returns a result describing what happened (for the visual layer), or null
   * if the move was illegal.
   */
  move(from, to, promotion = "q") {
    const legal = this.legalMoves(from.file, from.rank).find(
      (m) => m.to.file === to.file && m.to.rank === to.rank
    );
    if (!legal) return null;

    const undo = this._applyMove(legal, { promotion });
    this.history.push(undo);
    this.turn = opp(this.turn);

    return {
      move: legal,
      captured: undo.captured,
      capturedSquare: undo.capturedSquare,
      castle: legal.flags.castle || null,
      rookMove: undo.rookMove,
      enPassant: !!legal.flags.enPassant,
      promotion: legal.flags.promotion ? promotion : null,
      status: this.status(),
    };
  }

  undo() {
    const undo = this.history.pop();
    if (!undo) return null;
    this._revertMove(undo);
    this.turn = opp(this.turn);
    return undo;
  }

  /** 'checkmate' | 'stalemate' | 'check' | 'normal' for the side to move. */
  status() {
    const hasMoves = this.allLegalMoves(this.turn).length > 0;
    const inCheck = this.isInCheck(this.turn);
    if (!hasMoves) return inCheck ? "checkmate" : "stalemate";
    return inCheck ? "check" : "normal";
  }
}

export { WHITE, BLACK };
