/* ═══════════════════════════════════════════════════════
   PUZZLES — matchmaking
   Same algorithm as Drills' js/matchmaking.js — only the room's config
   shape differs (difficulty/gridSize instead of operations/tables/
   fractionTypes) and it lives in its own puzzleRooms/puzzleRoomPointers
   collections. Two entry points:
   - matchmake(): anonymous pool matching for Multiplayer, via a single
     transaction on a small per-bucket pointer doc
     (puzzleRoomPointers/{mode_size_timeLimit_difficulty_gridSize}), so two
     clients racing to start the same kind of room land in the SAME room
     instead of creating duplicates — Firestore's transaction retry handles
     the race, no manual conflict resolution needed.
   - createCodeRoom()/joinRoomByCode(): private 1v1 Versus rooms (or
     Multiplayer's "Create Room" path). The host creates a room and gets a
     short shareable code; a friend joins with that code instead of
     anonymous matching. Give this a much longer wait window than the pool
     (CODE_WAIT_MS) since a human has to actually receive and type the
     code — a bot still fills in if nobody shows.

   Both paths converge on watchRoomUntilActive(): every client attaches
   exactly one onSnapshot listener on its own room doc, torn down the
   instant status flips to "active". The host runs a local wait for real
   players, then activates the room (fills any remaining seats with bots);
   every other member also runs a longer local "abandon" timer so the room
   still starts if the host's tab closes mid-wait.
═══════════════════════════════════════════════════════ */
import { db, auth } from '/firebase-init.js';
import {
  doc, collection, runTransaction, setDoc, updateDoc, getDoc,
  onSnapshot, query, where, limit, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { quotaStatus, reportUsage, quotaError } from '/utils/data-service.js';

const WAIT_MS = 8000; // anonymous-pool host's local "waiting for real players" window
const CODE_WAIT_MS = 90000; // code-room host's window — a friend needs time to receive + type the code
const START_BUFFER_MS = 3000; // "get ready" beat shown to everyone after activation
const ABANDON_EXTRA_MS = 4000; // added to whichever wait window applies, for every member's fallback timer

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

// Waits for a room to go "active" (real joins + eventual bot fill), then
// resolves with everything game.js/leaderboard.js need to run the round.
function watchRoomUntilActive({ roomId, seed, roomSize, roomTimeLimit, roomDifficulty, roomGridSize, isHost, waitMs, onWaiting }) {
  return new Promise((resolve, reject) => {
    const roomRef = doc(db, 'puzzleRooms', roomId);
    let settled = false;
    let unsub = null;
    let hostTimer = null;
    let abandonTimer = null;

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
      if (unsub) unsub();
      resolve({
        roomId, seed, timeLimit: roomTimeLimit, size: roomSize,
        difficulty: roomDifficulty, gridSize: roomGridSize,
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
        // Bots don't land in the room all at once — give the UI a staggered
        // window (scaled to how many seats they fill) to reveal them one at
        // a time, like real people trickling in, before handing off.
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
      if (onWaiting) onWaiting({ phase: 'waiting', seed, playerCount: data.playerCount, size: data.size });
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
    // Firestore rule's "status must still be waiting" precondition
    // guarantees only one such write ever succeeds.
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

async function joinOrCreateRoom({ mode, size, timeLimit, difficulty, gridSize, displayName: name }) {
  const user = auth.currentUser;
  const bucketKey = `${mode}_${size}_${timeLimit}_${difficulty}_${gridSize}`;
  const ptrRef = doc(db, 'puzzleRoomPointers', bucketKey);
  const now = Date.now();
  const displayName = name || user.displayName || 'Player';

  await checkQuota('write');
  const result = await runTransaction(db, async (tx) => {
    const ptrSnap = await tx.get(ptrRef);
    let roomSnap = null;
    if (ptrSnap.exists() && ptrSnap.data().expiresAt > now) {
      roomSnap = await tx.get(doc(db, 'puzzleRooms', ptrSnap.data().roomId));
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
        difficulty: room.difficulty, gridSize: room.gridSize,
      };
    }

    const roomRef = doc(collection(db, 'puzzleRooms'));
    const seed = Math.floor(Math.random() * 2 ** 31);
    tx.set(roomRef, {
      mode, size, timeLimit, difficulty, gridSize, status: 'waiting',
      seed, hostUid: user.uid, playerCount: 1, botsNeeded: 0,
      createdAt: serverTimestamp(),
    });
    tx.set(doc(roomRef, 'players', user.uid), { displayName, joinedAt: now });
    tx.set(ptrRef, { roomId: roomRef.id, expiresAt: now + WAIT_MS + 2000 });
    return { roomId: roomRef.id, isHost: true, size, timeLimit, seed, difficulty, gridSize };
  });

  reportUsage(2, result.isHost ? 3 : 2); // approximate — real billing happens server-side
  return result;
}

// Resolves once the room is "active": { roomId, seed, timeLimit, difficulty, gridSize, size, startAt, botsNeeded }.
// onWaiting(state) is called with { playerCount, size } while still in the lobby.
export async function matchmake({ mode, size, timeLimit, difficulty, gridSize }, { onWaiting } = {}) {
  const room = await joinOrCreateRoom({ mode, size, timeLimit, difficulty, gridSize });
  return watchRoomUntilActive({
    roomId: room.roomId, seed: room.seed, roomSize: room.size,
    roomTimeLimit: room.timeLimit, roomDifficulty: room.difficulty, roomGridSize: room.gridSize,
    isHost: room.isHost, waitMs: WAIT_MS, onWaiting,
  });
}

// Creates a private room (Versus is always size 2; Multiplayer's "Create
// Room" path uses the chosen 5/10) and returns its code immediately (before
// the round is ready) so the UI can display it for sharing. `roundReady`
// resolves the same way matchmake() does, once the room goes active.
export async function createCodeRoom({ mode = 'versus', size = 2, timeLimit, difficulty, gridSize, displayName: name }, { onWaiting } = {}) {
  const user = auth.currentUser;
  const code = generateCode();
  const roomRef = doc(collection(db, 'puzzleRooms'));
  const seed = Math.floor(Math.random() * 2 ** 31);
  const now = Date.now();
  const displayName = name || user.displayName || 'Player';

  await checkQuota('write');
  await setDoc(roomRef, {
    mode, size, timeLimit, difficulty, gridSize, status: 'waiting',
    seed, hostUid: user.uid, playerCount: 1, botsNeeded: 0, code,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(roomRef, 'players', user.uid), { displayName, joinedAt: now });
  reportUsage(0, 2);

  const roundReady = watchRoomUntilActive({
    roomId: roomRef.id, seed, roomSize: size, roomTimeLimit: timeLimit,
    roomDifficulty: difficulty, roomGridSize: gridSize,
    isHost: true, waitMs: CODE_WAIT_MS, onWaiting,
  });

  return { code, roomId: roomRef.id, roundReady };
}

// Looks up a waiting room by its shared code and joins it. Throws if the
// code doesn't match an open room.
export async function joinRoomByCode(code, { onWaiting, displayName: name } = {}) {
  const user = auth.currentUser;
  const now = Date.now();
  const displayName = name || user.displayName || 'Player';

  await checkQuota('read');
  const q = query(
    collection(db, 'puzzleRooms'),
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

  return watchRoomUntilActive({
    roomId: roomDoc.id, seed: room.seed, roomSize: room.size,
    roomTimeLimit: room.timeLimit, roomDifficulty: room.difficulty, roomGridSize: room.gridSize,
    isHost: false, waitMs: CODE_WAIT_MS, onWaiting,
  });
}
