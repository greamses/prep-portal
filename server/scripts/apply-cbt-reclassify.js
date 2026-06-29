/**
 * apply-cbt-reclassify.js — write the AI classification (cbt-reclassify.json)
 * back to the live cbtQuestions bank: sets topic + topicKey, recomputes the
 * composite keys (classSubject / classSubjectTopic) and paperKey (papers of 60,
 * stable by createdAt), and rebuilds the cbtTopics registry for the touched
 * class+subject buckets. Optionally applies the flagged CLASS moves.
 *
 * Only the questions named in the mapping are touched (by doc id). Idempotent.
 *
 *   node server/scripts/apply-cbt-reclassify.js --dry-run            # preview
 *   node server/scripts/apply-cbt-reclassify.js                      # topics only
 *   node server/scripts/apply-cbt-reclassify.js --class=conservative # +±2-grade moves
 *   node server/scripts/apply-cbt-reclassify.js --class=all          # + every flagged move
 *
 * Needs Firestore writes — run AFTER the daily quota resets (midnight Pacific).
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const admin = require("firebase-admin");

let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
else credential = admin.credential.cert(require("../serviceAccountKey.json"));
if (!admin.apps.length) admin.initializeApp({ credential });
const db = admin.firestore();

// ── Key helpers (mirror server/routes/cbt.js + migrate-cbt-classes.js) ──────
const PAPER_SIZE = 60;
const CLASS_LABELS = {};
for (let i = 1; i <= 12; i++) CLASS_LABELS["grade" + i] = "Grade " + i;
const topicKeyOf = (t) => String(t == null ? "" : t).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "general";
const csKey = (cl, s) => `${cl}__${s}`;
const cstKey = (cl, s, tk) => `${cl}__${s}__${tk}`;
const paperKeyOf = (cl, s, tk, p) => `${cstKey(cl, s, tk)}__p${p}`;
const ms = (x) => (x && x.toMillis ? x.toMillis() : (typeof x === "number" ? x : 0));
const gradeNum = (g) => parseInt(String(g || "").replace("grade", ""), 10) || 0;

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const classMode = (args.find((a) => a.startsWith("--class=")) || "--class=none").split("=")[1]; // none|conservative|all

// Should a flagged class move be applied under the chosen policy?
function moveAllowed(oldC, newC) {
  if (classMode === "all") return true;
  if (classMode === "conservative") return Math.abs(gradeNum(newC) - gradeNum(oldC)) <= 2;
  return false; // none
}

(async () => {
  const map = JSON.parse(fs.readFileSync(path.join(__dirname, "cbt-reclassify.json"), "utf8"));
  const assigns = map.assignments || [];
  console.log(`Loaded ${assigns.length} assignments. classMode=${classMode}${DRY ? " (DRY RUN)" : ""}`);

  // Resolve the final class per question under the policy.
  let moves = 0;
  const finalClass = new Map(); // id -> classLevel
  for (const a of assigns) {
    let cl = a.oldClass;
    if (a.classChanged && moveAllowed(a.oldClass, a.newClass)) { cl = a.newClass; moves++; }
    finalClass.set(a.id, cl);
  }
  console.log(`Class moves to apply: ${moves} (of ${map.classChanges ? map.classChanges.length : 0} flagged).`);

  // Read createdAt for stable paper ordering (one read per touched doc).
  const ids = assigns.map((a) => a.id);
  const docMeta = new Map();
  for (let i = 0; i < ids.length; i += 300) {
    const refs = ids.slice(i, i + 300).map((id) => db.collection("cbtQuestions").doc(id));
    const snaps = await db.getAll(...refs);
    snaps.forEach((s) => { if (s.exists) docMeta.set(s.id, s.data()); });
    process.stdout.write(`  read ${Math.min(i + 300, ids.length)}/${ids.length}\r`);
  }
  console.log(`\nRead ${docMeta.size} live docs.`);

  // Build buckets to assign paper numbers (stable by createdAt).
  const buckets = {};   // cst -> [{id, createdAt, cl, subject, tk}]
  const registry = {};  // cs  -> Map(tk -> topicName)
  const patches = new Map(); // id -> patch
  for (const a of assigns) {
    const data = docMeta.get(a.id);
    if (!data) continue;
    const cl = finalClass.get(a.id);
    const subject = a.subject;
    const topicName = a.newTopic;
    const tk = topicKeyOf(topicName);
    const cst = cstKey(cl, subject, tk);
    const patch = {
      topic: topicName, topicKey: tk,
      classLevel: cl, grade: CLASS_LABELS[cl] || data.grade || null,
      classSubject: csKey(cl, subject), classSubjectTopic: cst,
    };
    patches.set(a.id, patch);
    (buckets[cst] = buckets[cst] || []).push({ id: a.id, createdAt: data.createdAt, cl, subject, tk });
    const cs = csKey(cl, subject);
    (registry[cs] = registry[cs] || new Map()).set(tk, topicName);
  }

  // Paper numbers within each bucket.
  for (const cst in buckets) {
    buckets[cst].sort((a, b) => ms(a.createdAt) - ms(b.createdAt)).forEach((it, idx) => {
      const p = Math.floor(idx / PAPER_SIZE) + 1;
      Object.assign(patches.get(it.id), { paperNo: p, paperKey: paperKeyOf(it.cl, it.subject, it.tk, p) });
    });
  }

  if (DRY) {
    console.log(`\nDRY RUN — would update ${patches.size} questions and ${Object.keys(registry).length} cbtTopics docs.`);
    const sample = [...patches.entries()].slice(0, 5);
    sample.forEach(([id, p]) => console.log("  ", id, "→", p.classLevel, "/", p.topic, "/ paper", p.paperNo));
    process.exit(0);
  }

  // Commit question patches.
  let written = 0;
  const entries = [...patches.entries()];
  for (let i = 0; i < entries.length; i += 400) {
    const batch = db.batch();
    for (const [id, patch] of entries.slice(i, i + 400)) { batch.set(db.collection("cbtQuestions").doc(id), patch, { merge: true }); written++; }
    await batch.commit();
    process.stdout.write(`  wrote ${written}/${entries.length}\r`);
  }
  console.log(`\nUpdated ${written} questions.`);

  // Rebuild the cbtTopics registry for touched class+subject buckets.
  const regEntries = Object.entries(registry);
  let reg = 0;
  for (let i = 0; i < regEntries.length; i += 400) {
    const batch = db.batch();
    for (const [cs, mp] of regEntries.slice(i, i + 400)) {
      const [classLevel, subject] = cs.split("__");
      const topics = [...mp.entries()].map(([key, name]) => ({ name, key }));
      batch.set(db.collection("cbtTopics").doc(cs), { classLevel, subject, topics, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      reg++;
    }
    await batch.commit();
  }
  console.log(`Rebuilt ${reg} cbtTopics buckets.`);
  console.log("Done. Re-run the static export (export-cbt-bank.js) + redeploy to publish to students.");
  process.exit(0);
})().catch((e) => { console.error("\nApply failed:", e.message); process.exit(1); });
