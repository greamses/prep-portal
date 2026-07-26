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
  contentKeys: ['operations', 'tables', 'fractionTypes', 'compounds', 'activity', 'gridSize', 'gridBlanks'],
  // Two players share a room only if they would be playing the same thing. The
  // grid activity buckets purely on its own dials (its operations/tables are
  // placeholders); the arithmetic bucket is left byte-for-byte as it was, so
  // existing drill matchmaking is undisturbed — 'grid_…' can't collide with it.
  bucketOf: (c) => {
    if (c.activity === 'grid') return `grid_${c.gridSize}_${c.gridBlanks}`;
    return [
      [...c.operations].sort().join(','),
      [...c.tables].sort((a, b) => a - b).join(','),
      [...(c.fractionTypes || [])].sort().join(','),
      [...(c.compounds || [])].sort().join(','),
    ].join('_');
  },
});
