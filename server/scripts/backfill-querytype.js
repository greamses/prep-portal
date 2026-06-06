/**
 * backfill-querytype.js — set a clean `queryType` (utme | wassce) on every
 * existing alocQuestions doc, derived from ALOC's (dirty) examType field.
 *
 *   secondary-school cert level  → wassce   (wassce / neco / ssce)
 *   everything else (utme, post-utme, model, junk) → utme
 *
 * Run once after import to make the picker's type filter work. Idempotent.
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

const bucket = (examType) =>
  /wassce|neco|ssce/.test(String(examType || "").toLowerCase()) ? "wassce" : "utme";

(async () => {
  const snap = await db.collection("alocQuestions").get();
  console.log(`Scanning ${snap.size} docs…`);
  const docs = snap.docs;
  let updated = 0;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + 400)) {
      const qt = bucket(d.data().examType);
      batch.set(d.ref, { queryType: qt }, { merge: true });
      updated++;
    }
    await batch.commit();
  }
  console.log(`Done. Set queryType on ${updated} docs.`);
  process.exit(0);
})().catch((e) => {
  console.error("Backfill failed:", e);
  process.exit(1);
});
