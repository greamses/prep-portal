/**
 * pieces/index.js — the piece factory. Maps a piece type to its module's
 * builder, and exposes a helper to build the full opening line-up as 3D
 * groups positioned on the board.
 */
import { squareToWorld } from "../config.js";
import { createPawn } from "./pawn.js";
import { createRook } from "./rook.js";
import { createKnight } from "./knight.js";
import { createBishop } from "./bishop.js";
import { createQueen } from "./queen.js";
import { createKing } from "./king.js";

const BUILDERS = {
  p: createPawn,
  r: createRook,
  n: createKnight,
  b: createBishop,
  q: createQueen,
  k: createKing,
};

/** Build a single piece mesh-group for (type, side). */
export function createPiece(type, side) {
  const build = BUILDERS[type];
  if (!build) throw new Error(`Unknown piece type: ${type}`);
  const g = build(side);
  g.scale.setScalar(0.92); // breathing room between neighbours
  return g;
}

/** Standard back-rank order, file a→h. */
export const BACK_RANK = ["r", "n", "b", "q", "k", "b", "n", "r"];

/**
 * Place a freshly built piece group at its (file, rank). Knights keep the
 * facing rotation they set themselves, so we only touch position.
 */
export function placePieceAt(group, file, rank) {
  const pos = squareToWorld(file, rank);
  group.position.set(pos.x, 0, pos.z);
}
