/* ═══════════════════════════════════════════════════════
   GAMES — end-of-round leaderboard (Drills, Puzzles, Geometry, Vocab)

   Exactly ONE write (your own score) and ONE listener (everyone else's), opened
   only after the local timer has already hit zero and closed the moment the room
   is complete. No polling at any point during or after a round — the bots'
   scores are recomputed locally from the seed, so they cost nothing at all.

   The only thing a game supplies is its own bot score model (`scoreBot`): a
   hangman word, a sudoku cell and a times-table sum are worth wildly different
   amounts of time, so that tuning belongs to each game and nowhere else.
═══════════════════════════════════════════════════════ */
import { db, auth } from '/firebase-init.js';
import { doc, collection, updateDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { quotaStatus, reportUsage, quotaError } from '/utils/data-service.js';
import { botName } from './bots.js';

const GRACE_MS = 1200;    // floor: even a solo round holds a beat, so results don't snap in
const MAX_WAIT_MS = 12000; // how long past the round's OWN end a straggler's write is still waited for

/**
 * When the room stops being able to change — the moment nobody can still be
 * playing — plus the window a late write needs to land.
 *
 * This has to be measured from the ROUND's end, not from the caller's own
 * submit. Several games let you submit early (Grammar's Ctrl+Enter, a solved
 * puzzle), and an early finisher who only waited a fixed spell from their own
 * submit gave up long before the clock ran out, then ranked everyone still
 * playing at 0 — the exact bug this whole file has been chasing.
 *
 * `startAt` is the ACTIVATING client's wall clock (see game.js), so a device
 * whose clock is off would compute a nonsense deadline. Same guard the games
 * use: trust it only while it lands in the window a real round could still be
 * running, and otherwise fall back to waiting from now.
 */
function deadlineFor(startAt, timeLimit) {
  const now = Date.now();
  const fallback = now + MAX_WAIT_MS;
  if (!startAt || !timeLimit) return fallback;

  const endsAt = startAt + timeLimit * 1000;
  const remaining = endsAt - now;
  if (remaining <= 0) return fallback;                     // clock's already out
  if (remaining > timeLimit * 1000 + 8000) return fallback; // skewed — don't trust it
  return endsAt + MAX_WAIT_MS;
}

async function checkQuota(kind) {
  const s = await quotaStatus();
  if (kind === 'write' ? s.writesBlocked : s.readsBlocked) throw quotaError(kind);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Everybody's clock runs out at the same instant, but their WRITES don't: a slow
 * phone can land its score a few seconds after a fast laptop. Reading the room
 * the moment we finish therefore used to show a real opponent sitting on 0 and
 * ranked dead last — a wrong leaderboard, not a slow one.
 *
 * So we watch the players collection until every real player has written a
 * `finishedAt`, and only rank once the room is genuinely complete. Two bounds
 * keep that honest: nothing resolves before GRACE_MS, and nothing waits past
 * `deadline` (see deadlineFor) — a player who closed the tab mid-round will
 * never write, and the rest of the room must not be held hostage to them.
 *
 * Submitting early does NOT rank you early: the deadline is the round's own
 * clock, so a fast finisher sits on the awaiting screen until either everyone
 * is in or the timer everyone shares has genuinely run out.
 *
 * This replaces the old blind sleep-then-getDocs: it is ONE listener, opened
 * after the round is over and closed the moment the room is complete, and it
 * costs the same reads the single getDocs did.
 */
function awaitAllSubmissions(playersRef, onProgress, deadline) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let latest = null;
    let graceDone = false;
    let unsub = null;

    const done = () => {
      if (settled || !graceDone || !latest) return;
      settled = true;
      clearTimeout(graceTimer);
      clearTimeout(capTimer);
      if (unsub) unsub();
      resolve(latest);
    };

    const graceTimer = setTimeout(() => { graceDone = true; check(); }, GRACE_MS);
    const capTimer = setTimeout(() => {
      // Out of patience: rank with whoever actually submitted. A missing score
      // stays 0, which is the truth about a player who never finished.
      graceDone = true;
      if (latest) return done();
      // Not one snapshot in all that time — the listener is effectively dead.
      // Reject so the caller falls back to a plain read.
      settled = true;
      clearTimeout(graceTimer);
      if (unsub) unsub();
      reject(new Error('leaderboard: no player snapshot'));
    }, Math.max(GRACE_MS, deadline - Date.now()));

    function check() {
      if (!latest) return;
      const pending = latest.docs.filter((d) => !d.data().finishedAt).length;
      if (onProgress) {
        onProgress({ submitted: latest.size - pending, total: latest.size });
      }
      if (pending === 0) done();
    }

    unsub = onSnapshot(playersRef, (snap) => {
      if (!snap.metadata.fromCache) reportUsage(snap.docChanges().length, 0);
      latest = snap;
      check();
    }, (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(graceTimer);
      clearTimeout(capTimer);
      reject(err);
    });
  });
}

/**
 * Every game's "tallying scores…" overlay is the same paragraph under the same
 * three bouncing dots, so the straggler count is written once, here, instead of
 * five times. Hand the returned callback to `finishRound({ onAwaiting })` — it
 * only speaks up while someone is genuinely still submitting, and says nothing
 * at all in a solo or bot-filled round.
 *
 * @param {HTMLElement} textEl the overlay's text paragraph
 * @returns {{ onAwaiting: function, reset: function }}
 */
export function createAwaitingProgress(textEl) {
  const resting = textEl ? textEl.textContent : '';
  return {
    reset() { if (textEl) textEl.textContent = resting; },
    onAwaiting({ submitted, total }) {
      if (!textEl) return;
      const pending = total - submitted;
      textEl.textContent = pending > 0
        ? `Waiting for ${pending} more player${pending === 1 ? '' : 's'}…`
        : resting;
    },
  };
}

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
    const { roomId, seed, botsNeeded, myScore, myMetrics, onAwaiting, startAt, timeLimit } = args;
    const uid = auth.currentUser.uid;

    await checkQuota('write');
    const meRef = doc(db, rooms, roomId, 'players', uid);
    const finishedAt = Date.now();
    const core = { score: myScore, finishedAt };
    // A single undefined value makes Firestore reject the WHOLE write before it
    // ever leaves the client, which would cost us the score to save a tiebreak.
    const full = { ...core };
    for (const [k, v] of Object.entries(myMetrics || {})) {
      if (v !== undefined) full[k] = v;
    }

    try {
      await updateDoc(meRef, full);
    } catch (e) {
      // The score MUST land even if the tiebreak metrics are refused — this is
      // the failure that looks like nothing is wrong. The player who was
      // rejected still sees their real score (games fall back to a local,
      // one-row board), while every opponent reads them as 0 and ranks them
      // last. A rules deploy that predates a game's metric fields does exactly
      // that. Losing a tiebreaker is survivable; losing the score is not.
      console.error(
        `[leaderboard] ${rooms}: full score write refused (${e.code || e.message}) — retrying score only`,
      );
      await updateDoc(meRef, core);
    }
    reportUsage(0, 1);

    await checkQuota('read');
    const playersRef = collection(db, rooms, roomId, 'players');
    let snap;
    try {
      snap = await awaitAllSubmissions(playersRef, onAwaiting, deadlineFor(startAt, timeLimit));
    } catch (e) {
      // The listener was refused (rules, offline). Fall back to exactly what
      // this used to do rather than dropping the whole leaderboard.
      await sleep(GRACE_MS);
      snap = await getDocs(playersRef);
      reportUsage(snap.size, 0);
    }

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
