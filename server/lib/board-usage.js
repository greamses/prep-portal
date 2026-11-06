/* ============================================================================
   PrepBot Board — the learner's daily allowance
   ----------------------------------------------------------------------------
   The site's AI pool (aiUsage/{uid}: tokensUsed per 5-hour window, monthTokens
   per month) only ever counts; it never refuses. The board is the first AI
   feature that talks for minutes at a time, so it has a real cap: a number of
   tutor replies a day, and a number of characters of the PrepBot voice a day
   (past that the browser's own voice is used).

   Kept as extra fields on the SAME aiUsage/{uid} document, so a turn costs no
   more Firestore operations than a chat message does:
     boardDay   "2026-11-06"   the UTC day the counts below belong to
     boardTurns  number        tutor replies today
     boardChars  number        characters of PrepBot voice today

   The caps live in config/site.aiQuota (boardTurnsPerDay, boardVoiceCharsPerDay)
   with the defaults in lib/access.js. The admin (ADMIN_EMAIL) is never capped.
   ========================================================================== */

const admin = require("firebase-admin");
const access = require("./access");

const WINDOW_MS = 5 * 60 * 60 * 1000;
const day = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);
const monthKey = (ms) => { const d = new Date(ms); return `${d.getUTCFullYear()}-${d.getUTCMonth()}`; };
const isAdminEmail = (email) => !!email && email === process.env.ADMIN_EMAIL;
const ref = (uid) => admin.firestore().collection("aiUsage").doc(uid);

async function limits() {
  const q = await access.getAiQuota();
  return { turns: q.boardTurnsPerDay || 60, chars: q.boardVoiceCharsPerDay || 15000 };
}

/**
 * Before a turn: may this learner have another reply today? Counts the turn
 * when it may. Returns { ok, turnsLeft, voice } — voice false when today's
 * PrepBot-voice allowance is used up.
 */
async function startTurn(uid, email) {
  if (isAdminEmail(email)) return { ok: true, turnsLeft: Infinity, voice: true };
  const cap = await limits();
  try {
    return await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref(uid));
      const d = snap.exists ? snap.data() : {};
      const today = day();
      const turns = d.boardDay === today ? d.boardTurns || 0 : 0;
      const chars = d.boardDay === today ? d.boardChars || 0 : 0;
      if (turns >= cap.turns) return { ok: false, turnsLeft: 0, voice: chars < cap.chars };
      tx.set(ref(uid), { boardDay: today, boardTurns: turns + 1, boardChars: chars }, { merge: true });
      return { ok: true, turnsLeft: cap.turns - turns - 1, voice: chars < cap.chars };
    });
  } catch (_) {
    return { ok: true, turnsLeft: null, voice: true }; // fail open: a counting error never blocks a lesson
  }
}

/** After a turn: add its tokens to the shared AI pool, and its spoken characters. */
async function endTurn(uid, email, { tokens = 0, chars = 0 } = {}) {
  if (isAdminEmail(email) || (!tokens && !chars)) return;
  try {
    await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref(uid));
      const d = snap.exists ? snap.data() : {};
      const now = Date.now();
      const s = d.windowStart?.toMillis?.() ?? d.windowStart ?? 0;
      const within = now - s < WINDOW_MS;
      const mk = monthKey(now);
      const today = day(now);
      tx.set(ref(uid), {
        tokensUsed: (within ? d.tokensUsed || 0 : 0) + tokens,
        windowStart: admin.firestore.Timestamp.fromMillis(within ? s : now),
        monthTokens: (d.monthKey === mk ? d.monthTokens || 0 : 0) + tokens,
        monthKey: mk,
        boardDay: today,
        boardTurns: d.boardDay === today ? d.boardTurns || 0 : 0,
        boardChars: (d.boardDay === today ? d.boardChars || 0 : 0) + chars,
      }, { merge: true });
    });
  } catch (_) { /* counting is best effort */ }
}

module.exports = { startTurn, endTurn, limits };
