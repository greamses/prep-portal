/* ═══════════════════════════════════════════════════════
   DRILLS — matchmaking

   All the machinery (the pointer-doc transaction, the wait/abandon/full-room
   timers, the single onSnapshot, the code rooms) lives in
   /utils/games/seeded-room.js and is shared with every other game. It used to be
   copied into all four, which is how one bug came to need four identical fixes.

   What is left here is the only part that is really this game's:
   Drills: which operations, which tables, and (for Fractions/Chemistry)
   which kinds of question and which compounds.
═══════════════════════════════════════════════════════ */
import { createRoomClient } from '/utils/games/seeded-room.js';

export const { matchmake, createCodeRoom, joinRoomByCode } = createRoomClient({
  rooms: 'drillRooms',
  pointers: 'drillRoomPointers',
  contentKeys: ['operations', 'tables', 'fractionTypes', 'compounds'],
  // Two players share a room only if they would be playing the same thing.
  bucketOf: (c) => [
    [...c.operations].sort().join(','),
    [...c.tables].sort((a, b) => a - b).join(','),
    [...(c.fractionTypes || [])].sort().join(','),
    [...(c.compounds || [])].sort().join(','),
  ].join('_'),
});
