/* ═══════════════════════════════════════════════════════
   PLANNER — matchmaking

   All the room machinery (pointer transaction, wait/abandon/full timers, the
   single onSnapshot, code rooms) is shared in /utils/games/seeded-room.js. The
   only game-specific part is what a room is "playing": here that's just the
   difficulty, since the brief is derived from the room seed + difficulty alone.
═══════════════════════════════════════════════════════ */
import { createRoomClient } from '/utils/games/seeded-room.js';

export const { matchmake, createCodeRoom, joinRoomByCode } = createRoomClient({
  rooms: 'plannerRooms',
  pointers: 'plannerRoomPointers',
  contentKeys: ['difficulty'],
  // Two players share a room only if they'd be scheduling the same-sized brief.
  bucketOf: (c) => c.difficulty,
});
