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
  // `format` picks the game (events / weekly routine); `difficulty` its size.
  contentKeys: ['format', 'difficulty'],
  // Two players share a room only if they'd be solving the same brief — same
  // format AND same difficulty. (`format` defaults to events for old rooms.)
  bucketOf: (c) => `${c.format || 'events'}:${c.difficulty}`,
});
