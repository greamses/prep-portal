/* ═══════════════════════════════════════════════════════
   DRILLS — end-of-round leaderboard
   Exactly one write (your own score) + exactly one read (everyone else's
   final scores), fired only after the local timer has already hit zero.
   No onSnapshot, no polling, at any point during or after the round —
   bots cost nothing since their scores are recomputed locally.
═══════════════════════════════════════════════════════ */
import { db, auth } from '/firebase-init.js';
import { doc, collection, updateDoc, getDocs } from 'firebase/firestore';
import { quotaStatus, reportUsage, quotaError } from '/utils/data-service.js';
import { simulateBotScore } from './bots.js';

const GRACE_MS = 1200; // lets other real players' near-simultaneous writes land

async function checkQuota(kind) {
  const s = await quotaStatus();
  if (kind === 'write' ? s.writesBlocked : s.readsBlocked) throw quotaError(kind);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Returns a ranked array: [{ name, score, isBot, isSelf }]
export async function finishRound({ roomId, seed, timeLimit, botsNeeded, myScore }) {
  const uid = auth.currentUser.uid;

  await checkQuota('write');
  await updateDoc(doc(db, 'drillRooms', roomId, 'players', uid), {
    score: myScore,
    finishedAt: Date.now(),
  });
  reportUsage(0, 1);

  await sleep(GRACE_MS);

  await checkQuota('read');
  const snap = await getDocs(collection(db, 'drillRooms', roomId, 'players'));
  reportUsage(snap.size, 0);

  const real = snap.docs.map((d) => ({
    name: d.data().displayName || 'Player',
    score: d.data().score ?? 0,
    isBot: false,
    isSelf: d.id === uid,
  }));

  const bots = Array.from({ length: botsNeeded }, (_, i) => ({
    name: `Bot ${i + 1}`,
    score: simulateBotScore(seed, i, timeLimit),
    isBot: true,
    isSelf: false,
  }));

  return [...real, ...bots].sort((a, b) => b.score - a.score);
}
