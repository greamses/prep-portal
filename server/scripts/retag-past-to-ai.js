/**
 * retag-past-to-ai.js — one-off data correction.
 *
 * The `source:"past"` tag on cbtQuestions was a legacy/default mislabel: every
 * such doc is actually ORIGINAL AI-generated practice (worked solutions, intro
 * videos, recent createdAt), NOT a verbatim past paper. Real verbatim past
 * papers live in the SEPARATE ALOC archive (/api/questions, archiveEnabled),
 * never in cbtQuestions. The `hideOriginals` kill-switch only special-cases
 * source==="past", so the mislabel was wrongly hiding ~1800 good questions.
 *
 * This retags source:"past" -> "ai" so they classify correctly and stay visible
 * regardless of the hideOriginals flag. Idempotent (re-running is a no-op).
 *
 *   node server/scripts/retag-past-to-ai.js --dry-run
 *   node server/scripts/retag-past-to-ai.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const admin = require("firebase-admin");

let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
else credential = admin.credential.cert(require("../serviceAccountKey.json"));
if (!admin.apps.length) admin.initializeApp({ credential });
const db = admin.firestore();

const DRY = process.argv.includes("--dry-run");

(async () => {
  const snap = await db.collection("cbtQuestions").where("source", "==", "past").get();
  console.log(`Found ${snap.size} docs with source:"past".${DRY ? " (DRY RUN)" : ""}`);
  if (DRY || snap.empty) { process.exit(0); }

  const docs = snap.docs;
  let written = 0;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + 400)) { batch.set(d.ref, { source: "ai" }, { merge: true }); written++; }
    await batch.commit();
    process.stdout.write(`  wrote ${written}/${docs.length}\r`);
  }
  console.log(`\nRetagged ${written} docs: source "past" -> "ai".`);
  console.log("Next: node scripts/export-cbt-bank.js + commit + deploy.");
  process.exit(0);
})().catch((e) => { console.error("\nRetag failed:", e.message); process.exit(1); });
