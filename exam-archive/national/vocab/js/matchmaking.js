/* ═══════════════════════════════════════════════════════
   VOCAB — matchmaking

   All the machinery (the pointer-doc transaction, the wait/abandon/full-room
   timers, the single onSnapshot, the code rooms) lives in
   /utils/games/seeded-room.js and is shared with every other game. It used to be
   copied into all four, which is how one bug came to need four identical fixes.

   What is left here is the only part that is really this game's:
   Vocab: which subject and grade, and whether you are walking the alphabet
   or playing one topic.
═══════════════════════════════════════════════════════ */
import { createRoomClient } from '/utils/games/seeded-room.js';

export const { matchmake, createCodeRoom, joinRoomByCode } = createRoomClient({
  rooms: 'vocabRooms',
  pointers: 'vocabRoomPointers',
  contentKeys: ['subject', 'grade', 'playMode', 'topic', 'spelling'],
  // Two players share a room only if they would be playing the same thing.
  bucketOf: (c) => `${c.subject}_${c.grade}_${c.playMode}_${c.topic || 'all'}_${c.spelling}`,
});
