/* ═══════════════════════════════════════════════════════
   GAMES — end-of-round leaderboard (Drills, Puzzles, Geometry, Vocab)

   Exactly ONE write (your own score) and ONE read (everyone else's), fired only
   after the local timer has already hit zero. No onSnapshot and no polling at
   any point during or after a round — the bots' scores are recomputed locally
   from the seed, so they cost nothing at all.

   The only thing a game supplies is its own bot score model (`scoreBot`): a
   hangman word, a sudoku cell and a times-table sum are worth wildly different
   amounts of time, so that tuning belongs to each game and nowhere else.
═══════════════════════════════════════════════════════ */
import { db, auth } from '/firebase-init.js';
import { doc, collection, updateDoc, getDocs } from 'firebase/firestore';
import { quotaStatus, reportUsage, quotaError } from '/utils/data-service.js';
import { botName } from './bots.js';

const GRACE_MS = 1200; // lets other real players' near-simultaneous writes land

async function checkQuota(kind) {
  const s = await quotaStatus();
  if (kind === 'write' ? s.writesBlocked : s.readsBlocked) throw quotaError(kind);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {string} o.rooms      the game's rooms collection, e.g. "vocabRooms"
 * @param {function} o.scoreBot (seed, botSlot, args) -> that bot's final score,
 *                              where `args` is whatever finishRound was called
 *                              with (so a game can pass its own extras through,
 *                              e.g. Vocab's wordCount).
 * @returns finishRound(args) -> ranked [{ name, score, isBot, isSelf, avatarSeed }]
 */
export function createLeaderboard({ rooms, scoreBot }) {
  return async function finishRound(args) {
    const { roomId, seed, botsNeeded, myScore } = args;
    const uid = auth.currentUser.uid;

    await checkQuota('write');
    await updateDoc(doc(db, rooms, roomId, 'players', uid), {
      score: myScore,
      finishedAt: Date.now(),
    });
    reportUsage(0, 1);

    await sleep(GRACE_MS);

    await checkQuota('read');
    const snap = await getDocs(collection(db, rooms, roomId, 'players'));
    reportUsage(snap.size, 0);

    const real = snap.docs.map((d) => ({
      name: d.data().displayName || 'Player',
      score: d.data().score ?? 0,
      isBot: false,
      isSelf: d.id === uid,
      avatarSeed: d.id, // stable per-account face, unlike a name, which can collide
    }));

    const bots = Array.from({ length: botsNeeded }, (_, i) => {
      const name = botName(seed, i);
      return {
        name,
        score: scoreBot(seed, i, args),
        isBot: true,
        isSelf: false,
        avatarSeed: name,
      };
    });

    return [...real, ...bots].sort((a, b) => b.score - a.score);
  };
}
