/**
 * config.js — shared geometry constants + board↔world coordinate helpers.
 *
 * Board model uses (file, rank) with file 0..7 = a..h and rank 0..7 = 1..8.
 * White starts on ranks 0-1, black on ranks 6-7. The world is centred on the
 * board, +x points along files (a→h) and +z points along ranks (1→8) reversed
 * so rank 8 sits at -z (far side), which reads naturally with the default camera.
 */
import * as THREE from "three";

export const SQUARE = 1.0; // world units per square
export const BOARD = 8;
export const BOARD_SIZE = SQUARE * BOARD;
export const FRAME = 0.55; // border width around the playing surface
export const BOARD_TOP = 0; // y of the playing surface (pieces rest here)

/** Centre of square (file, rank) in world space, on the board surface. */
export function squareToWorld(file, rank, y = BOARD_TOP) {
  const x = (file - (BOARD - 1) / 2) * SQUARE;
  const z = ((BOARD - 1) / 2 - rank) * SQUARE; // rank 7 (8th) → -z
  return new THREE.Vector3(x, y, z);
}

/** World position → nearest {file, rank}, or null if off-board. */
export function worldToSquare(point) {
  const file = Math.round(point.x / SQUARE + (BOARD - 1) / 2);
  const rank = Math.round((BOARD - 1) / 2 - point.z / SQUARE);
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return { file, rank };
}

export function isLightSquare(file, rank) {
  return (file + rank) % 2 === 1;
}

/** Unicode glyphs for the captured-pieces tray. */
export const GLYPH = {
  white: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
  black: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
};
