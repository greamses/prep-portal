/**
 * The question bank used to keep single questions (questionBank/{uid}/items). It now keeps NAMED banks
 * (questionSets/{uid}/sets). This groups each teacher's old questions into banks by their topic (or
 * subject), so nothing saved before is lost. The old items are left where they are.
 *
 *   node scripts/migrate-bank-to-sets.js          do it
 *   node scripts/migrate-bank-to-sets.js --dry    only say what it would do
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const crypto = require("crypto");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });
const db = admin.firestore();
const dry = process.argv.includes("--dry");
const setId = (name) => crypto.createHash("sha1").update(String(name).trim().toLowerCase()).digest("hex").slice(0, 24);
const FIELDS = ["type", "text", "options", "answer", "marks", "lines", "svg"];

/* the old topic was often the whole prompt typed for the model: its first line is the name */
function nameOf(x) {
  const first = String(x.topic || "").split(/\r?\n/)[0].replace(/\s+/g, " ").trim().replace(/[.,;:\s]+$/, "");
  const short = first.length > 60 ? `${first.slice(0, 57).replace(/\s+\S*$/, "")}...` : first;
  return short || `Saved questions${x.subject ? ` (${String(x.subject).split("·")[0].trim()})` : ""}`;
}

(async () => {
  const owners = await db.collection("questionBank").listDocuments();
  for (const owner of owners) {
    const snap = await owner.collection("items").get();
    if (!snap.size) continue;
    const groups = new Map();
    const at = (d) => (d.data().savedAt && d.data().savedAt.toMillis ? d.data().savedAt.toMillis() : 0);
    snap.docs.sort((a, b) => at(a) - at(b)).forEach((d) => {
      const x = d.data(), name = nameOf(x);
      if (!groups.has(name)) groups.set(name, { subject: x.subject || "", level: x.level || "", questions: [] });
      const q = {};
      FIELDS.forEach((f) => { if (x[f] !== undefined) q[f] = x[f]; });
      groups.get(name).questions.push(q);
    });
    console.log(`${owner.id}: ${snap.size} questions -> ${groups.size} banks`);
    for (const [name, g] of groups) {
      for (let part = 0; part * 300 < g.questions.length; part++) {
        const nm = g.questions.length > 300 ? `${name} (part ${part + 1})` : name;
        const qs = g.questions.slice(part * 300, part * 300 + 300);
        console.log(`   ${String(qs.length).padStart(3)}  ${nm}`);
        if (!dry) await db.collection("questionSets").doc(owner.id).collection("sets").doc(setId(nm)).set({ name: nm, questions: qs, subject: g.subject, level: g.level, savedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
    }
  }
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
