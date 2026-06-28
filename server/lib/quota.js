/**
 * quota.js — a daily Firestore usage guard.
 *
 * Keeps a shared per-day counter in usage/firestore-YYYY-MM-DD ({reads,writes})
 * and refuses further operations once the caps are hit, so we never reach the
 * hard free-tier limits (50k reads / 20k writes) that would block the database.
 *
 *   Caps (overridable via env): 45,000 reads/day · 15,000 writes/day.
 *
 * Counting is best-effort + conservative (it over-counts slightly rather than
 * under-count): the guard middleware tallies a baseline per request, heavy
 * routes add their exact doc counts, and the browser data-service reports its
 * own reads/writes via /api/usage/record. The counter's own read/write of the
 * tally doc is deliberately NOT counted (bounded + small; the 5k/5k headroom to
 * the hard cap absorbs it).
 */
const admin = require("firebase-admin");

const READ_CAP = parseInt(process.env.FIRESTORE_READ_CAP, 10) || 45000;
const WRITE_CAP = parseInt(process.env.FIRESTORE_WRITE_CAP, 10) || 15000;
const CACHE_MS = 120000; // refresh the shared tally at most every 2 min
const FLUSH_MS = 60000;   // flush pending deltas at most once a minute…
const FLUSH_AT = 150;     // …or sooner once this many ops are pending

const dateKey = () => new Date().toISOString().slice(0, 10); // UTC day
const docRef = () => admin.firestore().collection("usage").doc("firestore-" + dateKey());

let cache = { day: null, reads: 0, writes: 0, at: 0 };
let pending = { reads: 0, writes: 0 };
let lastFlush = 0;

async function refresh() {
  const day = dateKey();
  if (cache.day === day && Date.now() - cache.at < CACHE_MS) return;
  if (cache.day !== day) { cache = { day, reads: 0, writes: 0, at: 0 }; pending = { reads: 0, writes: 0 }; }
  try {
    const s = await docRef().get();
    const d = s.exists ? s.data() : {};
    cache = { day, reads: d.reads || 0, writes: d.writes || 0, at: Date.now() };
  } catch (_) {
    cache.at = Date.now(); // keep last-known; try again after CACHE_MS
  }
}

async function flush(force) {
  if (!pending.reads && !pending.writes) return;
  if (!force && Date.now() - lastFlush < FLUSH_MS && pending.reads + pending.writes < FLUSH_AT) return;
  const delta = pending;
  pending = { reads: 0, writes: 0 };
  lastFlush = Date.now();
  try {
    await docRef().set({
      reads: admin.firestore.FieldValue.increment(delta.reads),
      writes: admin.firestore.FieldValue.increment(delta.writes),
      day: dateKey(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    cache.reads += delta.reads;
    cache.writes += delta.writes;
  } catch (_) {
    pending.reads += delta.reads; // failed — retry on the next flush
    pending.writes += delta.writes;
  }
}

function addReads(n) { if (n > 0) { pending.reads += n; flush(); } }
function addWrites(n) { if (n > 0) { pending.writes += n; flush(); } }

// Cheap cap checks against the cached tally (kick a background refresh).
function readsBlocked() { refresh(); return cache.reads + pending.reads >= READ_CAP; }
function writesBlocked() { refresh(); return cache.writes + pending.writes >= WRITE_CAP; }

async function status() {
  await refresh();
  const reads = cache.reads + pending.reads;
  const writes = cache.writes + pending.writes;
  return {
    day: dateKey(), reads, writes, readCap: READ_CAP, writeCap: WRITE_CAP,
    readsBlocked: reads >= READ_CAP, writesBlocked: writes >= WRITE_CAP,
  };
}

// Express middleware: block panel reads/writes once over cap, and tally a
// conservative baseline (1 op) per request so small per-request reads count.
function guard(req, res, next) {
  const writing = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  if (writing ? writesBlocked() : readsBlocked()) {
    return res.status(429).json({
      quotaBlocked: true, kind: writing ? "write" : "read",
      error: writing
        ? "Daily write limit reached — please try again tomorrow."
        : "Daily read limit reached — please try again tomorrow.",
    });
  }
  if (writing) addWrites(1); else addReads(1);
  next();
}

module.exports = { addReads, addWrites, readsBlocked, writesBlocked, status, guard, READ_CAP, WRITE_CAP };
