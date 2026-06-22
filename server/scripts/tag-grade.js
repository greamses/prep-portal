/**
 * Bulk-set a grade on every question in a scheme+subject.
 *   node scripts/tag-grade.js practice english "JSS1"            # dry run
 *   node scripts/tag-grade.js practice english "JSS1" --write    # apply
 */
require("dotenv").config({ path: __dirname + "/../.env" });
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });

const [scheme, subject, grade] = process.argv.slice(2);
const WRITE = process.argv.includes("--write");
if (!scheme || !subject || !grade) { console.error("usage: tag-grade.js <scheme> <subject> <grade> [--write]"); process.exit(1); }

(async () => {
  const db = admin.firestore();
  const ss = `${scheme}__${subject}`;
  const snap = await db.collection("cbtQuestions").where("schemeSubject", "==", ss).get();
  console.log(`${ss}: ${snap.size} question(s) → grade "${grade}"${WRITE ? "" : "  (dry run)"}`);
  if (!snap.size || !WRITE) { process.exit(0); }
  const stamp = admin.firestore.FieldValue.serverTimestamp;
  let n = 0;
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach((d) => { batch.set(d.ref, { grade, updatedAt: stamp() }, { merge: true }); n++; });
    await batch.commit();
  }
  console.log(`Tagged ${n} question(s) with grade "${grade}".`);
  process.exit(0);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
