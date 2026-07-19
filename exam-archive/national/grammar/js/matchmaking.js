/* ═══════════════════════════════════════════════════════
   GRAMMAR — matchmaking

   All the machinery (the pointer-doc transaction, the wait/abandon/full-room
   timers, the single onSnapshot, the code rooms) lives in
   /utils/games/seeded-room.js and is shared with every other game.

   What is left here is the only part that is really this game's: which grade,
   which theme of passage, and which CUPS letters are in play. All three have
   to match for two players to share a room — a Punctuation-only round and a
   full-CUPS round on the same passage are not the same game and must not be
   ranked against each other.
═══════════════════════════════════════════════════════ */
import { createRoomClient } from '/utils/games/seeded-room.js';

export const { matchmake, createCodeRoom, joinRoomByCode } = createRoomClient({
  rooms: 'grammarRooms',
  pointers: 'grammarRoomPointers',
  contentKeys: ['grade', 'theme', 'focus'],
  bucketOf: (c) => `${c.grade}_${c.theme}_${c.focus || 'cups'}`,
});
