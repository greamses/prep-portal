/**
 * Move everything into the ONE bank (cbtQuestions). Copies only: nothing is
 * deleted from where it came from, and running it again changes nothing that
 * is already there (fixed document ids).
 *
 *   1. the past-question archive (alocQuestions)  -> cbtQuestions/aloc_<id>, source "past"
 *   2. every teacher's Exam Maker banks           -> cbtQuestions/own_<hash>, owner = uid, private;
 *      each set gets `ids` (its questions in the bank) and keeps its embedded copy
 *
 *   node scripts/one-bank-migrate.js --dry
 *   node scripts/one-bank-migrate.js
 */
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });
const { subjKey, subjLabel } = require("../routes/cbt").helpers;
const { BANK, emToBank, pastToBank } = require("../lib/one-bank");
const { cleanQuestion } = require("../lib/question-bank");

const DRY = process.argv.includes("--dry");

async function commitAll(writes) {
  const db = admin.firestore();
  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch();
    writes.slice(i, i + 400).forEach(([ref, data, opt]) => batch.set(ref, data, opt || {}));
    if (!DRY) await batch.commit();
  }
}

(async () => {
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  /* 1. the archive */
  const aloc = await db.collection("alocQuestions").get();
  const pastWrites = [];
  const byScheme = {};
  for (const d of aloc.docs) {
    const x = d.data();
    const data = pastToBank(x, subjKey, subjLabel);
    if (!data.scheme) continue;
    byScheme[data.schemeSubject] = (byScheme[data.schemeSubject] || 0) + 1;
    pastWrites.push([db.collection(BANK).doc(d.id), { ...data, createdAt: x.importedAt || now, migratedAt: now }, { merge: true }]);
  }
  console.log(`archive: ${pastWrites.length} questions -> ${BANK} (source past)`);
  Object.entries(byScheme).sort().forEach(([k, v]) => console.log(`   ${String(v).padStart(4)}  ${k}`));
  await commitAll(pastWrites);

  /* 2. teachers' Exam Maker banks */
  const owners = await db.collection("questionSets").listDocuments();
  let sets = 0, qs = 0;
  for (const owner of owners) {
    const uid = owner.id;
    const snap = await owner.collection("sets").get();
    const writes = [];
    for (const s of snap.docs) {
      const x = s.data();
      const ids = [];
      for (const raw of x.questions || []) {
        const q = cleanQuestion(raw);
        if (!q) continue;
        const { id, data } = emToBank(q, uid, { subject: x.subject, level: x.level });
        ids.push(id);
        writes.push([db.collection(BANK).doc(id), { ...data, createdAt: x.savedAt || now, migratedAt: now }, { merge: true }]);
      }
      writes.push([s.ref, { ids }, { merge: true }]);
      sets++; qs += ids.length;
    }
    await commitAll(writes);
  }
  console.log(`exam maker: ${sets} named banks, ${qs} questions -> ${BANK} (private to their teacher)`);
  console.log(DRY ? "dry run: nothing written" : "done");
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
