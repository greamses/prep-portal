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
  // `activity` splits the two games: proof-reading (CUPS, uses theme+focus) and
  // Word Upgrade (substitution, uses wordset). The unused field of each rides
  // along empty — a room's whole content still has to match for two players to
  // share it, and a Word-Upgrade round and a CUPS round are plainly not the
  // same game. Rooms made before this shipped carry no `activity`; the bucket
  // reads that as 'proofread', which is exactly what they were.
  contentKeys: ['activity', 'grade', 'theme', 'focus', 'wordset', 'count'],
  bucketOf: (c) => [
    c.activity || 'proofread',
    c.grade,
    c.theme || '-',
    c.focus || 'cups',
    c.wordset || '-',
    c.count || 1,
  ].join('_'),
});
