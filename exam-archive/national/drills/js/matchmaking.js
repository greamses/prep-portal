/* ═══════════════════════════════════════════════════════
   DRILLS — matchmaking
   Join-or-create a room via a single transaction on a small per-bucket
   pointer doc (drillRoomPointers/{mode_size_timeLimit}), so two clients
   racing to start the same kind of room land in the SAME room instead of
   creating duplicates — Firestore's transaction retry handles the race,
   no manual conflict resolution needed.

   After joining, every client attaches exactly one onSnapshot listener on
   its own room doc, torn down the instant status flips to "active". The
   host runs a short local wait for real players, then activates the room
   (fills any remaining seats with bots); every other member also runs a
   longer local "abandon" timer so the room still starts if the host's tab
   closes mid-wait.
═══════════════════════════════════════════════════════ */
import { db, auth } from '/firebase-init.js';
import {
  doc, collection, runTransaction, onSnapshot, updateDoc, getDoc, serverTimestamp,
} from 'firebase/firestore';
import { quotaStatus, reportUsage, quotaError } from '/utils/data-service.js';

const WAIT_MS = 8000; // host's local "waiting for real players" window
const START_BUFFER_MS = 3000; // "get ready" beat shown to everyone after activation
const HOST_ABANDON_MS = WAIT_MS + 4000; // every member's own fallback-promotion timer

async function checkQuota(kind) {
  const s = await quotaStatus();
  if (kind === 'write' ? s.writesBlocked : s.readsBlocked) throw quotaError(kind);
}

async function joinOrCreateRoom({ mode, size, timeLimit, operation, tables }) {
  const user = auth.currentUser;
  const tablesKey = [...tables].sort((a, b) => a - b).join(',');
  const bucketKey = `${mode}_${size}_${timeLimit}_${operation}_${tablesKey}`;
  const ptrRef = doc(db, 'drillRoomPointers', bucketKey);
  const now = Date.now();
  const displayName = user.displayName || 'Player';

  await checkQuota('write');
  const result = await runTransaction(db, async (tx) => {
    const ptrSnap = await tx.get(ptrRef);
    let roomSnap = null;
    if (ptrSnap.exists() && ptrSnap.data().expiresAt > now) {
      roomSnap = await tx.get(doc(db, 'drillRooms', ptrSnap.data().roomId));
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
        operation: room.operation, tables: room.tables,
      };
    }

    const roomRef = doc(collection(db, 'drillRooms'));
    const seed = Math.floor(Math.random() * 2 ** 31);
    tx.set(roomRef, {
      mode, size, timeLimit, operation, tables, status: 'waiting',
      seed, hostUid: user.uid, playerCount: 1, botsNeeded: 0,
      createdAt: serverTimestamp(),
    });
    tx.set(doc(roomRef, 'players', user.uid), { displayName, joinedAt: now });
    tx.set(ptrRef, { roomId: roomRef.id, expiresAt: now + WAIT_MS + 2000 });
    return { roomId: roomRef.id, isHost: true, size, timeLimit, seed, operation, tables };
  });

  reportUsage(2, result.isHost ? 3 : 2); // approximate — real billing happens server-side
  return result;
}

// Resolves once the room is "active": { roomId, seed, timeLimit, operation, tables, startAt, botsNeeded }.
// onWaiting(state) is called with { playerCount, size } while still in the lobby.
export async function matchmake({ mode, size, timeLimit, operation, tables }, { onWaiting } = {}) {
  const {
    roomId, isHost, size: roomSize, timeLimit: roomTimeLimit, seed,
    operation: roomOperation, tables: roomTables,
  } = await joinOrCreateRoom({ mode, size, timeLimit, operation, tables });

  return new Promise((resolve, reject) => {
    const roomRef = doc(db, 'drillRooms', roomId);
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
        operation: roomOperation, tables: roomTables,
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
        // Flash the room as full (real players + bots) for a beat before
        // handing off, so the lobby count visibly ticks up even when the
        // remaining seats were filled by bots rather than real joiners.
        if (onWaiting) onWaiting({ playerCount: data.size, size: data.size });
        setTimeout(() => finish(data), 600);
        return;
      }
      if (onWaiting) onWaiting({ playerCount: data.playerCount, size: data.size });
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
      }, WAIT_MS);
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
    }, HOST_ABANDON_MS);
  });
}
