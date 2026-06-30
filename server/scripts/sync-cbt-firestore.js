/**
 * sync-cbt-firestore.js — push the STATIC bank (data/cbt/*, the source of truth)
 * up to Firestore, the WRITE-ONLY backup. Run "when happy", after committing.
 *
 * It NEVER reads the cbtQuestions collection. State lives in a committed ledger
 * (data/cbt/.synced.json: id → {h:contentHash, c:createdMs}), so each run writes
 * ONLY what changed since the last sync:
 *   • new id            → set() a full doc (organising keys reconstructed)
 *   • content changed   → set() again (createdAt preserved from the ledger)
 *   • id gone from bank  → delete() from Firestore
 * Unchanged questions cost nothing.
 *
 *   node server/scripts/sync-cbt-firestore.js          # apply the delta
 *   node server/scripts/sync-cbt-firestore.js --dry     # preview, write nothing
 *   node server/scripts/sync-cbt-firestore.js --seed    # mark current bank as
 *                                                       # already-synced (ledger
 *                                                       # only; no Firestore)
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const S = require("../lib/cbt-static");
const H = require("../routes/cbt").helpers;

const LEDGER = path.join(S.OUT_DIR, ".synced.json");
const DRY = process.argv.includes("--dry");
const SEED = process.argv.includes("--seed");

const hashOf = (rec) => crypto.createHash("sha1").update(JSON.stringify(rec)).digest("hex");

// Deterministic scan: class buckets (sorted) in array order, then any exam-only
// records. Yields {rec, paper} where paper (paperNo/paperKey) is set for records
// that live in a class bucket. Position in this scan defines createdMs ordering.
function scanOrdered() {
  const out = [];
  const seen = new Set();
  const push = (rec, paper) => { if (!seen.has(rec.id)) { seen.add(rec.id); out.push({ rec, paper }); } };

  for (const key of S.listKeys("class").sort()) {
    const [cls, subj] = key.split("__");
    const arr = S.readBucket("class", key);
    const perTopic = {};
    for (const q of arr) {
      const tk = H.topicKeyOf(q.topic || "General");
      const idx = (perTopic[tk] = perTopic[tk] || 0);
      const paperNo = Math.floor(idx / S.PAPER_SIZE) + 1;
      perTopic[tk] = idx + 1;
      push(q, { paperNo, paperKey: H.paperKeyOf(cls, subj, tk, paperNo) });
    }
  }
  for (const key of S.listKeys("exam").sort()) {
    for (const q of S.readBucket("exam", key)) push(q, null);
  }
  return out;
}

// Reconstruct the full Firestore doc shape from a slim record + its paper.
function toDoc(rec, paper, createdMs, admin) {
  const cl = rec.classLevel;
  const tk = H.topicKeyOf(rec.topic || "General");
  const doc = {
    scheme: rec.scheme || null, subject: rec.subject, subjectLabel: rec.subjectLabel || H.subjLabel(rec.subject),
    schemeSubject: rec.scheme ? `${rec.scheme}__${rec.subject}` : null,
    classLevel: cl || null, grade: rec.grade || null,
    topic: rec.topic || "General", topicKey: tk,
    type: rec.type || "objective", question: rec.question,
    options: rec.options || null, answerIndex: typeof rec.answerIndex === "number" ? rec.answerIndex : null,
    answer: rec.answer || null, explanation: rec.explanation || "", hint: rec.hint || "",
    image: rec.image || null, video: rec.video || null, videoScope: rec.videoScope || "question",
    source: "ai",
    createdAt: admin.firestore.Timestamp.fromMillis(createdMs),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (cl) {
    doc.classSubject = H.csKey(cl, rec.subject);
    doc.classSubjectTopic = H.cstKey(cl, rec.subject, tk);
    if (paper) { doc.paperNo = paper.paperNo; doc.paperKey = paper.paperKey; }
  }
  return doc;
}

function readLedger() {
  try { const l = JSON.parse(fs.readFileSync(LEDGER, "utf8")); return { ids: l.ids || {}, baseMs: l.baseMs || Date.parse("2025-01-01T00:00:00Z") }; }
  catch (_) { return { ids: {}, baseMs: Date.parse("2025-01-01T00:00:00Z") }; }
}
function writeLedger(ids, baseMs) {
  fs.writeFileSync(LEDGER, JSON.stringify({ version: 1, baseMs, updatedAt: new Date().toISOString(), ids }, null, 0) + "\n");
}

(async () => {
  const scan = scanOrdered();
  const ledger = readLedger();
  const baseMs = ledger.baseMs;
  // createdMs by scan position keeps the Firestore fallback's createdAt order in
  // step with the static array order (1s apart, far past, monotonic).
  const posMs = (i) => baseMs + i * 1000;

  // ── Seed: record the whole current bank as already-synced (no Firestore) ──
  if (SEED) {
    const ids = {};
    scan.forEach(({ rec }, i) => { ids[rec.id] = { h: hashOf(rec), c: posMs(i) }; });
    writeLedger(ids, baseMs);
    console.log(`Seeded ledger: ${Object.keys(ids).length} questions marked as already in Firestore. Future syncs push only the delta.`);
    process.exit(0);
  }

  // ── Delta vs ledger ──
  const nextIds = {};
  const upserts = []; // { rec, paper, createdMs }
  scan.forEach(({ rec, paper }, i) => {
    const h = hashOf(rec);
    const prev = ledger.ids[rec.id];
    const createdMs = prev ? prev.c : posMs(i);
    nextIds[rec.id] = { h, c: createdMs };
    if (!prev || prev.h !== h) upserts.push({ rec, paper, createdMs });
  });
  const deletes = Object.keys(ledger.ids).filter((id) => !nextIds[id]);

  console.log(`Static bank: ${scan.length} questions. Delta → upsert ${upserts.length}, delete ${deletes.length}.`);
  if (DRY) { console.log("(dry run — nothing written)"); process.exit(0); }
  if (!upserts.length && !deletes.length) { console.log("Nothing to sync. Firestore is already up to date."); process.exit(0); }

  const admin = require("firebase-admin");
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  else credential = admin.credential.cert(require("../serviceAccountKey.json"));
  if (!admin.apps.length) admin.initializeApp({ credential });
  const db = admin.firestore();
  const col = db.collection("cbtQuestions");

  const ops = [
    ...upserts.map((u) => ({ kind: "set", id: u.rec.id, data: toDoc(u.rec, u.paper, u.createdMs, admin) })),
    ...deletes.map((id) => ({ kind: "del", id })),
  ];
  let done = 0;
  for (let i = 0; i < ops.length; i += 400) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + 400)) {
      if (op.kind === "set") batch.set(col.doc(op.id), op.data);
      else batch.delete(col.doc(op.id));
    }
    await batch.commit();
    done += Math.min(400, ops.length - i);
    console.log(`  …${done}/${ops.length}`);
  }

  writeLedger(nextIds, baseMs);
  console.log(`Synced. Wrote ${upserts.length}, deleted ${deletes.length}. Firestore backup is current.`);
  process.exit(0);
})().catch((e) => { console.error("sync failed:", e.message); process.exit(1); });
