/* ═══════════════════════════════════════════════════════
   PUZZLES — matchmaking

   All the machinery (the pointer-doc transaction, the wait/abandon/full-room
   timers, the single onSnapshot, the code rooms) lives in
   /utils/games/seeded-room.js and is shared with every other game. It used to be
   copied into all four, which is how one bug came to need four identical fixes.

   What is left here is the only part that is really this game's:
   Puzzles: which puzzle, how hard, and how big the grid is.
═══════════════════════════════════════════════════════ */
import { createRoomClient } from '/utils/games/seeded-room.js';

export const { matchmake, createCodeRoom, joinRoomByCode } = createRoomClient({
  rooms: 'puzzleRooms',
  pointers: 'puzzleRoomPointers',
  contentKeys: ['puzzleType', 'tiles', 'difficulty', 'gridSize'],
  // Two players share a room only if they would be playing the same thing —
  // `tiles` is what the slider tiles wear (numbers/fractions/picture); Sudoku
  // rooms always carry 'numbers' so the bucket key stays well-formed.
  bucketOf: (c) => `${c.puzzleType}_${c.tiles}_${c.difficulty}_${c.gridSize}`,
});
