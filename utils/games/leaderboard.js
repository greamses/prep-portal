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
 * @param {function} o.scoreBot (seed, botSlot, args) -> that bot's result, either
 *                              a plain number (score) OR an object carrying extra
 *                              ranking metrics, e.g. { score, timeMs, wrong }.
 * @param {function} [o.compare] (a, b) -> sort order over the entries; defaults to
 *                              highest score first. A game that ranks on more than
 *                              score (Vocab: score, then speed, then wrong guesses)
 *                              supplies its own — and passes the player's own extra
 *                              metrics through `finishRound({ ..., myMetrics })`.
 * @param {string[]} [o.metricKeys] which extra fields to read back off a real
 *                              player's doc. Defaults to Vocab's ['timeMs','wrong'].
 *                              A game ranking on something else (Grammar: false
 *                              edits) names its own, so `compare` is never handed
 *                              an undefined it silently sorts last.
 * @returns finishRound(args) -> ranked [{ name, score, isBot, isSelf, avatarSeed, ...metrics }]
 */
export function createLeaderboard({ rooms, scoreBot, compare, metricKeys }) {
  const cmp = compare || ((a, b) => b.score - a.score);
  const metrics = metricKeys || ['timeMs', 'wrong'];
  return async function finishRound(args) {
    const { roomId, seed, botsNeeded, myScore, myMetrics } = args;
    const uid = auth.currentUser.uid;

    await checkQuota('write');
    await updateDoc(doc(db, rooms, roomId, 'players', uid), {
      score: myScore,
      finishedAt: Date.now(),
      ...(myMetrics || {}), // e.g. { timeMs, wrong } — undefined for score-only games
    });
    reportUsage(0, 1);

    await sleep(GRACE_MS);

    await checkQuota('read');
    const snap = await getDocs(collection(db, rooms, roomId, 'players'));
    reportUsage(snap.size, 0);

    const real = snap.docs.map((d) => {
      const data = d.data();
      const row = {
        name: data.displayName || 'Player',
        score: data.score ?? 0,
        isBot: false,
        isSelf: d.id === uid,
        avatarSeed: d.id, // stable per-account face, unlike a name, which can collide
      };
      // Whatever this game ranks on beyond score, straight off the doc it was
      // written to by `myMetrics`.
      for (const key of metrics) row[key] = data[key];
      return row;
    });

    const bots = Array.from({ length: botsNeeded }, (_, i) => {
      const name = botName(seed, i);
      const b = scoreBot(seed, i, args);
      const metrics = (b && typeof b === 'object') ? b : { score: b };
      return { name, ...metrics, isBot: true, isSelf: false, avatarSeed: name };
    });

    return [...real, ...bots].sort(cmp);
  };
}
