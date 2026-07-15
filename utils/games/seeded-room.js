/* ═══════════════════════════════════════════════════════
   GAMES — the seeded room (Drills, Puzzles, Geometry, Vocab)

   This file used to exist FOUR times, once per game, differing only in a
   collection name and a handful of content fields. That is not a harmless
   copy-paste: when a room failed to start the moment it filled up, the bug was
   in all four copies and had to be fixed four times. It lives here once now.

   What a game supplies (createRoomClient):
     rooms       Firestore collection of rooms          e.g. "vocabRooms"
     pointers    Firestore collection of bucket pointers e.g. "vocabRoomPointers"
     contentKeys the fields that describe what is being PLAYED — the only thing
                 that genuinely differs between games (Drills: operations/tables/
                 fractionTypes; Vocab: subject/grade/playMode/topic). They are
                 written into the room doc and handed back when the round starts.
     bucketOf    turns that content into one string, so two players only share a
                 room if they would be playing the same thing.

   Everything else — the matchmaking transaction, the wait/abandon/full-room
   timers, the single onSnapshot, the code rooms — is identical for every game
   and is written once, here.

   THE CONTRACT: one onSnapshot per client on its own room doc, torn down the
   instant the room goes active. No polling, ever. Bots are never written.
═══════════════════════════════════════════════════════ */
import { db, auth } from '/firebase-init.js';
import {
  doc, collection, runTransaction, setDoc, updateDoc, getDoc,
  onSnapshot, query, where, limit, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { quotaStatus, reportUsage, quotaError } from '/utils/data-service.js';

const WAIT_MS = 8000;          // anonymous-pool host's "waiting for real players" window
const CODE_WAIT_MS = 90000;    // code-room host's window — a friend must receive AND type the code
const START_BUFFER_MS = 3000;  // the "get ready" beat everyone sees after activation
const ABANDON_EXTRA_MS = 4000; // added to whichever wait applies, for every member's fallback timer
const FULL_FALLBACK_MS = 1200; // a non-host's grace period before promoting a full room the host hasn't

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L — easy to read and type

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return code;
}

async function checkQuota(kind) {
  const s = await quotaStatus();
  if (kind === 'write' ? s.writesBlocked : s.readsBlocked) throw quotaError(kind);
}

export function createRoomClient({ rooms, pointers, contentKeys, bucketOf }) {
  // Pulls just the game's content fields out of a config or a room doc, so the
  // shared code never has to know what "fractionTypes" means.
  const contentOf = (obj) => {
    const out = {};
    for (const key of contentKeys) out[key] = obj[key];
    return out;
  };

  // Waits for a room to go "active" (real joins + eventual bot fill), then
  // resolves with everything the round needs to run.
  function watchRoomUntilActive({ roomId, seed, roomSize, roomTimeLimit, content, isHost, waitMs, onWaiting }) {
    return new Promise((resolve, reject) => {
      const roomRef = doc(db, rooms, roomId);
      let settled = false;
      let unsub = null;
      let hostTimer = null;
      let abandonTimer = null;
      let fullTimer = null;

      async function activate(currentPlayerCount) {
        if (settled) return;
        try {
          await checkQuota('write');
          await updateDoc(roomRef, {
            status: 'active',
            startAt: Date.now() + START_BUFFER_MS,
            botsNeeded: Math.max(0, roomSize - currentPlayerCount),
          });
          reportUsage(0, 1);
        } catch (e) {
          // Lost the race to activate (someone else already did, or a rule
          // precondition failed) — harmless, our listener picks up the winner.
        }
      }

      function finish(data) {
        if (settled) return;
        settled = true;
        clearTimeout(hostTimer);
        clearTimeout(abandonTimer);
        clearTimeout(fullTimer);
        if (unsub) unsub();
        resolve({
          roomId, seed, timeLimit: roomTimeLimit, size: roomSize,
          ...content,
          startAt: data.startAt, botsNeeded: data.botsNeeded,
        });
      }

      unsub = onSnapshot(roomRef, (snap) => {
        if (!snap.metadata.fromCache) reportUsage(1, 0);
        if (!snap.exists()) return;
        const data = snap.data();

        if (data.status === 'active') {
          if (settled) return;
          clearTimeout(hostTimer);
          clearTimeout(abandonTimer);
          clearTimeout(fullTimer);
          // Bots don't land in the room all at once — give the UI a staggered
          // window (scaled to how many seats they fill) to reveal them one at a
          // time, like real people trickling in, before handing off.
          const botsNeeded = data.botsNeeded || 0;
          const revealMs = botsNeeded ? 350 + botsNeeded * 550 : 300;
          if (onWaiting) {
            onWaiting({
              phase: 'activated', seed, botsNeeded, revealMs,
              playerCount: Math.max(0, data.size - botsNeeded), size: data.size,
            });
          }
          setTimeout(() => finish(data), revealMs);
          return;
        }

        if (onWaiting) {
          onWaiting({
            phase: 'waiting', seed, playerCount: data.playerCount, size: data.size,
            // The host can cut the wait short and start with whoever's already
            // here — the empty seats fill with bots. Only the host is handed
            // this, and it promotes the snapshot's CURRENT count, so the
            // botsNeeded it writes still equals size - playerCount (what the
            // rules require). A stale click after activation is a no-op:
            // activate() bails once the room has settled.
            startNow: isHost ? () => activate(data.playerCount) : null,
          });
        }

        // The room is full — there is nothing left to wait FOR. Start it now
        // instead of sitting out the rest of the host's window (8s in the pool,
        // 90s in a code room, which is an eternity once your opponent has already
        // arrived). The host promotes it immediately; everyone else holds back a
        // beat and only steps in if the host's write never lands.
        if (data.playerCount >= data.size && fullTimer === null) {
          fullTimer = setTimeout(() => {
            if (!settled) activate(data.playerCount);
          }, isHost ? 0 : FULL_FALLBACK_MS);
        }
      }, (err) => { if (!settled) { settled = true; reject(err); } });

      if (isHost) {
        hostTimer = setTimeout(async () => {
          if (settled) return;
          await checkQuota('read');
          const snap = await getDoc(roomRef);
          reportUsage(1, 0);
          if (!settled && snap.exists() && snap.data().status === 'waiting') {
            activate(snap.data().playerCount);
          }
        }, waitMs);
      }

      // Every member (host included) can promote an abandoned room — the
      // Firestore rule's "status must still be waiting" precondition guarantees
      // only one such write ever succeeds.
      abandonTimer = setTimeout(async () => {
        if (settled) return;
        await checkQuota('read');
        const snap = await getDoc(roomRef);
        reportUsage(1, 0);
        if (!settled && snap.exists() && snap.data().status === 'waiting') {
          activate(snap.data().playerCount);
        }
      }, waitMs + ABANDON_EXTRA_MS);
    });
  }

  // One transaction on a small per-bucket pointer doc, so two clients racing to
  // start the same kind of room land in the SAME room instead of creating
  // duplicates — Firestore's optimistic-concurrency retry resolves the race, so
  // there is no manual conflict handling here on purpose.
  async function joinOrCreateRoom(cfg) {
    const user = auth.currentUser;
    const content = contentOf(cfg);
    const { mode, size, timeLimit } = cfg;
    const bucketKey = `${mode}_${size}_${timeLimit}_${bucketOf(content)}`;
    const ptrRef = doc(db, pointers, bucketKey);
    const now = Date.now();
    const displayName = cfg.displayName || user.displayName || 'Player';

    await checkQuota('write');
    const result = await runTransaction(db, async (tx) => {
      const ptrSnap = await tx.get(ptrRef);
      let roomSnap = null;
      if (ptrSnap.exists() && ptrSnap.data().expiresAt > now) {
        roomSnap = await tx.get(doc(db, rooms, ptrSnap.data().roomId));
      }

      const usable = roomSnap && roomSnap.exists() &&
        roomSnap.data().status === 'waiting' &&
        roomSnap.data().playerCount < roomSnap.data().size;

      if (usable) {
        const room = roomSnap.data();
        const newCount = room.playerCount + 1;
        tx.update(roomSnap.ref, { playerCount: newCount });
        tx.set(doc(roomSnap.ref, 'players', user.uid), { displayName, joinedAt: now });
        if (newCount >= room.size) tx.delete(ptrRef); // free the bucket early
        return {
          roomId: roomSnap.id, isHost: false,
          size: room.size, timeLimit: room.timeLimit, seed: room.seed,
          // The JOINER plays the room's content, not their own setup screen's.
          content: contentOf(room),
        };
      }

      const roomRef = doc(collection(db, rooms));
      const seed = Math.floor(Math.random() * 2 ** 31);
      tx.set(roomRef, {
        mode, size, timeLimit, ...content,
        status: 'waiting', seed, hostUid: user.uid, playerCount: 1, botsNeeded: 0,
        createdAt: serverTimestamp(),
      });
      tx.set(doc(roomRef, 'players', user.uid), { displayName, joinedAt: now });
      tx.set(ptrRef, { roomId: roomRef.id, expiresAt: now + WAIT_MS + 2000 });
      return { roomId: roomRef.id, isHost: true, size, timeLimit, seed, content };
    });

    reportUsage(2, result.isHost ? 3 : 2); // approximate — real billing happens server-side
    return result;
  }

  /**
   * Anonymous pool matching. Resolves once the room is active, with the round's
   * settings and content: { roomId, seed, timeLimit, size, ...content, startAt,
   * botsNeeded }. onWaiting(state) fires while still in the lobby.
   */
  async function matchmake(cfg, { onWaiting } = {}) {
    const room = await joinOrCreateRoom(cfg);
    return watchRoomUntilActive({
      roomId: room.roomId, seed: room.seed, roomSize: room.size,
      roomTimeLimit: room.timeLimit, content: room.content,
      isHost: room.isHost, waitMs: WAIT_MS, onWaiting,
    });
  }

  /**
   * A private room joined with a short shared code. Returns the code IMMEDIATELY
   * (before the round is ready) so the UI can show it; `roundReady` then resolves
   * exactly as matchmake() does. The wait window is far longer than the pool's —
   * a human has to receive the code and type it — but a full room still starts at
   * once, and a bot still fills the seat if nobody shows.
   */
  async function createCodeRoom(cfg, { onWaiting } = {}) {
    const user = auth.currentUser;
    const content = contentOf(cfg);
    const { mode = 'versus', size = 2, timeLimit } = cfg;
    const code = generateCode();
    const roomRef = doc(collection(db, rooms));
    const seed = Math.floor(Math.random() * 2 ** 31);
    const now = Date.now();
    const displayName = cfg.displayName || user.displayName || 'Player';

    await checkQuota('write');
    await setDoc(roomRef, {
      mode, size, timeLimit, ...content,
      status: 'waiting', seed, hostUid: user.uid, playerCount: 1, botsNeeded: 0, code,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(roomRef, 'players', user.uid), { displayName, joinedAt: now });
    reportUsage(0, 2);

    const roundReady = watchRoomUntilActive({
      roomId: roomRef.id, seed, roomSize: size, roomTimeLimit: timeLimit, content,
      isHost: true, waitMs: CODE_WAIT_MS, onWaiting,
    });

    return { code, roomId: roomRef.id, roundReady };
  }

  /** Looks up a waiting room by its code and joins it. Throws if there isn't one. */
  async function joinRoomByCode(code, { onWaiting, displayName: name } = {}) {
    const user = auth.currentUser;
    const now = Date.now();
    const displayName = name || user.displayName || 'Player';

    await checkQuota('read');
    const q = query(
      collection(db, rooms),
      where('code', '==', code),
      where('status', '==', 'waiting'),
      limit(1),
    );
    const snap = await getDocs(q);
    reportUsage(snap.size, 0);
    if (snap.empty) throw new Error("That code doesn't match an open room — check it and try again.");

    const roomDoc = snap.docs[0];
    const room = roomDoc.data();
    if (room.playerCount >= room.size) throw new Error('That room is already full.');

    await checkQuota('write');
    await updateDoc(roomDoc.ref, { playerCount: room.playerCount + 1 });
    await setDoc(doc(roomDoc.ref, 'players', user.uid), { displayName, joinedAt: now });
    reportUsage(0, 2);

    // The joiner plays the HOST's content, never their own setup screen's — a
    // shared room is one shared board. This is exactly why joining by code needs
    // no setup at all.
    return watchRoomUntilActive({
      roomId: roomDoc.id, seed: room.seed, roomSize: room.size,
      roomTimeLimit: room.timeLimit, content: contentOf(room),
      isHost: false, waitMs: CODE_WAIT_MS, onWaiting,
    });
  }

  return { matchmake, createCodeRoom, joinRoomByCode };
}
