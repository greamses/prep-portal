/* ═══════════════════════════════════════════════════════
   GEOMETRY — matchmaking

   All the machinery (the pointer-doc transaction, the wait/abandon/full-room
   timers, the single onSnapshot, the code rooms) lives in
   /utils/games/seeded-room.js and is shared with every other game. It used to be
   copied into all four, which is how one bug came to need four identical fixes.

   What is left here is the only part that is really this game's:
   Geometry: which shapes, what you are given, and which side lengths.
═══════════════════════════════════════════════════════ */
import { createRoomClient } from '/utils/games/seeded-room.js';

export const { matchmake, createCodeRoom, joinRoomByCode } = createRoomClient({
  rooms: 'geometryRooms',
  pointers: 'geometryRoomPointers',
  contentKeys: ['shapes', 'given', 'lengths'],
  // Two players share a room only if they would be playing the same thing.
  bucketOf: (c) => [
    [...c.shapes].sort().join(','),
    [...c.given].sort().join(','),
    [...c.lengths].sort((a, b) => a - b).join(','),
  ].join('_'),
});
