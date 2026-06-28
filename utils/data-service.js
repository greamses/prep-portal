/**
 * data-service.js — the single Firestore access layer for the whole app.
 *
 * WHY THIS EXISTS
 * ---------------
 * Firestore bills 1 read per document returned, every time. Before this layer,
 * the same `users/{uid}` doc was read 2–4× per page (nav + guard + dashboard +
 * blog), whole collections were polled on timers, and live listeners were leaked.
 * That burned ~50k reads/day with <7 users.
 *
 * This module fixes that with three tools:
 *   1. A TTL cache in localStorage — repeat reads inside the window cost ZERO
 *      Firestore reads (data is served from the user's machine).
 *   2. In-flight de-duplication — concurrent callers for the same key share one
 *      network round-trip instead of each issuing their own.
 *   3. ONE shared profile listener — every component that needs the signed-in
 *      user's profile subscribes to a single onSnapshot, not one each.
 *
 * This sits ON TOP of Firestore's own IndexedDB persistence (see firebase-init):
 * persistence makes the SDK efficient; this layer makes our *access patterns*
 * cheap and gives us explicit TTL control the SDK doesn't.
 *
 * GUIDANCE
 *   • Need data once / occasionally?  -> getDoc(), getList()   (cached, no listener)
 *   • Need the signed-in user's profile live?  -> watchProfile() (one shared listener)
 *   • Never poll a getDocs on a timer. Use a TTL + a manual refresh (force:true).
 */
import { auth, db } from "/firebase-init.js";
import {
  doc,
  getDoc as fsGetDoc,
  getDocs as fsGetDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";

/* ───────────────────────────── TTL cache (localStorage) ──────────────────── */

const NS = "pp_cache:";
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

function readCache(key, ttl) {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return undefined;
    const { t, v } = JSON.parse(raw);
    if (ttl !== Infinity && Date.now() - t > ttl) return undefined; // stale
    return v;
  } catch (e) {
    return undefined;
  }
}

function writeCache(key, v) {
  try {
    localStorage.setItem(NS + key, JSON.stringify({ t: Date.now(), v }));
  } catch (e) {
    // Quota exceeded — drop our namespace and retry once so a full disk never
    // breaks reads (the data just falls back to a live fetch next time).
    try {
      clearCache();
      localStorage.setItem(NS + key, JSON.stringify({ t: Date.now(), v }));
    } catch (_) {}
  }
}

function delCache(key) {
  try {
    localStorage.removeItem(NS + key);
  } catch (e) {}
}

/** Remove cache entries whose key contains `substr` (or all of ours if omitted). */
export function clearCache(substr) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(NS)) continue;
      if (!substr || k.includes(substr)) localStorage.removeItem(k);
    }
  } catch (e) {}
}

/* ─────────────────────────── in-flight de-duplication ────────────────────── */

const inflight = new Map();

function dedupe(key, factory) {
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = Promise.resolve()
    .then(factory)
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/* ──────────────────────────────── reads ──────────────────────────────────── */

/**
 * Read a single document, served from cache when fresh.
 * @param {string} path  e.g. "users/abc123"
 * @returns {Promise<object|null>}  { id, ...data } or null if it doesn't exist
 */
export async function getDoc(path, { ttl = DEFAULT_TTL, force = false } = {}) {
  const key = "doc:" + path;
  if (!force) {
    const hit = readCache(key, ttl);
    if (hit !== undefined) return hit;
  }
  return dedupe(key, async () => {
    const snap = await fsGetDoc(doc(db, ...path.split("/")));
    const v = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    writeCache(key, v);
    return v;
  });
}

/**
 * Read a query/collection, served from cache when fresh.
 * @param {string}   cacheKey  a stable string identifying this query+filters
 * @param {function} queryFactory  () => a Firestore Query (or CollectionReference)
 * @returns {Promise<object[]>}  array of { id, ...data }
 */
export async function getList(
  cacheKey,
  queryFactory,
  { ttl = DEFAULT_TTL, force = false } = {},
) {
  const key = "list:" + cacheKey;
  if (!force) {
    const hit = readCache(key, ttl);
    if (hit !== undefined) return hit;
  }
  return dedupe(key, async () => {
    const snap = await fsGetDocs(queryFactory());
    const v = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    writeCache(key, v);
    return v;
  });
}

/** Convenience: the signed-in user's profile, cached (one-shot, not live). */
export function getProfile(uid, opts) {
  return getDoc(`users/${uid}`, opts);
}

/* ─────────────────────────── shared profile listener ─────────────────────── */
// Every component that wants the current user's profile LIVE subscribes here.
// There is exactly ONE onSnapshot for the whole app; new docs only bill the
// changed document, and the cache is kept warm for instant first paint.

const profileState = { uid: null, value: undefined, unsub: null, subs: new Set() };

/**
 * Subscribe to the signed-in user's profile. The callback fires immediately with
 * the cached value (if any) for instant paint, then on every live change.
 * @returns {function} unsubscribe
 */
export function watchProfile(uid, cb) {
  if (!uid || typeof cb !== "function") return () => {};

  // Instant paint from cache (ignore TTL — a listener is about to refresh it).
  const cached = readCache("doc:users/" + uid, Infinity);
  if (cached !== undefined) cb(cached);

  // (Re)point the single shared listener if the user changed.
  if (profileState.uid !== uid) {
    if (profileState.unsub) profileState.unsub();
    profileState.uid = uid;
    profileState.value = undefined;
    profileState.unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        const v = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        profileState.value = v;
        writeCache("doc:users/" + uid, v);
        profileState.subs.forEach((fn) => {
          try {
            fn(v);
          } catch (e) {}
        });
      },
      () => {}, // swallow transient errors; cached value stands
    );
  } else if (profileState.value !== undefined) {
    cb(profileState.value); // already have a live value to hand over
  }

  profileState.subs.add(cb);
  return () => {
    profileState.subs.delete(cb);
    if (profileState.subs.size === 0 && profileState.unsub) {
      profileState.unsub();
      profileState.unsub = null;
      profileState.uid = null;
      profileState.value = undefined;
    }
  };
}

/* ─────────────────────────────── writes ──────────────────────────────────── */
// Write-through: update Firestore AND the local cache, so a read right after a
// write doesn't need a round-trip. `skipIfUnchanged` avoids a redundant WRITE
// when the cached doc already holds these exact values (cuts write quota too).

function shallowEqualSubset(target, subset) {
  if (!target) return false;
  return Object.keys(subset).every(
    (k) => JSON.stringify(target[k]) === JSON.stringify(subset[k]),
  );
}

/**
 * setDoc(merge) with cache write-through.
 * @param {string} path
 * @param {object} data
 * @param {object} [opts] { merge=true, skipIfUnchanged=false }
 * @returns {Promise<boolean>} true if a write happened, false if skipped
 */
export async function saveDoc(path, data, { merge = true, skipIfUnchanged = false } = {}) {
  const key = "doc:" + path;
  if (skipIfUnchanged) {
    const cur = readCache(key, Infinity);
    if (cur !== undefined && shallowEqualSubset(cur, data)) return false;
  }
  await setDoc(doc(db, ...path.split("/")), data, { merge });
  const cur = readCache(key, Infinity);
  writeCache(key, { ...(cur && typeof cur === "object" ? cur : {}), ...data });
  return true;
}

/** updateDoc with cache write-through. */
export async function updateFields(path, data) {
  const key = "doc:" + path;
  await updateDoc(doc(db, ...path.split("/")), data);
  const cur = readCache(key, Infinity);
  writeCache(key, { ...(cur && typeof cur === "object" ? cur : {}), ...data });
}

/** Drop a cached doc/list so the next read re-fetches (call after a known change). */
export function invalidateDoc(path) {
  delCache("doc:" + path);
}
export function invalidateList(cacheKey) {
  delCache("list:" + cacheKey);
}

/* ─────────────────────────── cache hygiene on sign-out ───────────────────── */
// When the signed-in user changes, the previous user's cached profile is stale
// and must not leak to the next session. Clearing on auth change keeps it clean.
let lastUid = null;
try {
  auth.onAuthStateChanged((user) => {
    const uid = user ? user.uid : null;
    if (lastUid && lastUid !== uid) {
      clearCache("doc:users/" + lastUid);
      delCache("doc:users/" + lastUid);
    }
    if (!uid) clearCache(); // signed out — drop everything we cached
    lastUid = uid;
  });
} catch (e) {}
