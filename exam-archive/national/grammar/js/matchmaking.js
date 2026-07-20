/* ═══════════════════════════════════════════════════════
   GRAMMAR — matchmaking

   All the machinery (the pointer-doc transaction, the wait/abandon/full-room
   timers, the single onSnapshot, the code rooms) lives in
   /utils/games/seeded-room.js and is shared with every other game.

   What is left here is the only part that is really this game's: which grade,
   which theme of passage, which CUPS letters are in play, and how many passages
   the round deals. All four have to match for two players to share a room — a
   Punctuation-only round and a full-CUPS round on the same passage are not the
   same game, and neither are a one-passage round and a three-passage one, which
   are scored out of totals that differ by a factor of three.

   `count` is in contentKeys as much for the JOINER as for the bucket: someone
   arriving by code never picked any of these, so the round shape has to come
   back off the room doc (see main.js's playRoundAndShowResults).
═══════════════════════════════════════════════════════ */
import { createRoomClient } from '/utils/games/seeded-room.js';

export const { matchmake, createCodeRoom, joinRoomByCode } = createRoomClient({
  rooms: 'grammarRooms',
  pointers: 'grammarRoomPointers',
  contentKeys: ['grade', 'theme', 'focus', 'count'],
  bucketOf: (c) => `${c.grade}_${c.theme}_${c.focus || 'cups'}_${c.count || 1}`,
});
