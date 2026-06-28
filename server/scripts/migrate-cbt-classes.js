/**
 * migrate-cbt-classes.js — re-organise the CBT bank around the new axis:
 *   Class → Subject → Topic → Paper.
 *
 * For every cbtQuestions doc it backfills:
 *   classLevel        normalised from the legacy `grade` ("JSS1" → "jss1")
 *   topic / topicKey  existing topic, or the catch-all "General"
 *   classSubject      `${classLevel}__${subject}`            (single-field key)
 *   classSubjectTopic `${classLevel}__${subject}__${topicKey}`
 *   paperNo / paperKey questions in each class+subject+topic bucket are ordered
 *                      by createdAt and split into papers of 60 (Paper 1 = first
 *                      60, Paper 2 = next 60, …) — unlimited papers per topic.
 *
 * It also seeds the `cbtTopics` registry (one doc per class+subject) from the
 * topics it finds, so the admin picker and student filter have a curated list.
 *
 * Questions with no resolvable class (no `grade`) are left untouched on the
 * class fields — they keep working in the legacy scheme flow. Idempotent.
 *
 *   node server/scripts/migrate-cbt-classes.js
 */

require("dotenv").config();
const admin = require("firebase-admin");

let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else {
  credential = admin.credential.cert(require("../serviceAccountKey.json"));
}
admin.initializeApp({ credential });
const db = admin.firestore();

// ── Helpers (mirror server/routes/cbt.js) ──────────────────────────────────
const PAPER_SIZE = 60;
const GENERAL_TOPIC = "General";
const CLASS_LABELS = {
  primary4: "Primary 4", primary5: "Primary 5", primary6: "Primary 6",
  jss1: "JSS1", jss2: "JSS2", jss3: "JSS3",
  sss1: "SSS1", sss2: "SSS2", sss3: "SSS3",
  grade6: "Grade 6", grade7: "Grade 7", grade8: "Grade 8",
  grade9: "Grade 9", grade10: "Grade 10", grade11: "Grade 11", grade12: "Grade 12",
};
const classKey = (g) => {
  const s = String(g == null ? "" : g).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
  return s || null;
};
const classLabel = (k) => CLASS_LABELS[k] || (k === "unsorted" ? "Unsorted" : (k || null));
const topicKeyOf = (t) =>
  String(t == null ? "" : t).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "general";
const csKey = (cl, s) => `${cl}__${s}`;
const cstKey = (cl, s, tk) => `${cl}__${s}__${tk}`;
const paperKeyOf = (cl, s, tk, p) => `${cstKey(cl, s, tk)}__p${p}`;
const ms = (x) => (x && x.toMillis ? x.toMillis() : (typeof x === "number" ? x : 0));

(async () => {
  const snap = await db.collection("cbtQuestions").get();
  const docs = snap.docs;
  console.log(`Scanning ${docs.length} questions…`);

  const buckets = {};   // classSubjectTopic -> [{ ref, createdAt, cl, subject, tk }]
  const registry = {};  // classSubject -> Map(topicKey -> topicName)
  const updates = [];   // { ref, patch }
  let classless = 0;

  for (const d of docs) {
    const data = d.data();
    const subject = data.subject;
    if (!subject) continue;
    // Legacy questions with no resolvable class go to the "unsorted" holding pen
    // so the admin can still find and re-tag them (they're hidden from students).
    const resolved = data.classLevel || classKey(data.grade);
    const cl = resolved || "unsorted";
    if (!resolved) classless++;
    const topicName = (data.topic && String(data.topic).trim()) || GENERAL_TOPIC;
    const tk = topicKeyOf(topicName);
    const patch = { topic: topicName, topicKey: tk };

    patch.classLevel = cl;
    patch.grade = classLabel(cl) || data.grade || null;
    patch.classSubject = csKey(cl, subject);
    patch.classSubjectTopic = cstKey(cl, subject, tk);
    (buckets[patch.classSubjectTopic] = buckets[patch.classSubjectTopic] || []).push({ ref: d.ref, createdAt: data.createdAt, cl, subject, tk });
    const ck = csKey(cl, subject);
    (registry[ck] = registry[ck] || new Map()).set(tk, topicName);
    updates.push({ ref: d.ref, patch });
  }

  // Assign papers within each bucket (stable order by createdAt).
  const paperPatch = new Map();
  for (const cst in buckets) {
    buckets[cst].sort((a, b) => ms(a.createdAt) - ms(b.createdAt)).forEach((it, idx) => {
      const paperNo = Math.floor(idx / PAPER_SIZE) + 1;
      paperPatch.set(it.ref, { paperNo, paperKey: paperKeyOf(it.cl, it.subject, it.tk, paperNo) });
    });
  }
  for (const u of updates) {
    const pp = paperPatch.get(u.ref);
    if (pp) Object.assign(u.patch, pp);
  }

  // Commit question updates.
  let written = 0;
  for (let i = 0; i < updates.length; i += 400) {
    const batch = db.batch();
    for (const u of updates.slice(i, i + 400)) { batch.set(u.ref, u.patch, { merge: true }); written++; }
    await batch.commit();
  }
  console.log(`Updated ${written} questions (${classless} had no class → filed under "Unsorted" for re-tagging).`);

  // Seed the cbtTopics registry.
  const entries = Object.entries(registry);
  let reg = 0;
  for (let i = 0; i < entries.length; i += 400) {
    const batch = db.batch();
    for (const [ck, map] of entries.slice(i, i + 400)) {
      const [classLevel, subject] = ck.split("__");
      const topics = [...map.entries()].map(([key, name]) => ({ name, key }));
      batch.set(db.collection("cbtTopics").doc(ck), { classLevel, subject, topics, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      reg++;
    }
    await batch.commit();
  }
  console.log(`Seeded ${reg} class+subject topic lists into cbtTopics.`);
  process.exit(0);
})().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
