/**
 * The hand-made past papers (exam-archive/national/{waec,jamb}/…, listed in
 * exam-archive/national/question/js/local-bank.js) into the ONE bank.
 *
 * Each objective paper becomes cbtQuestions/file_<board>_<subject>_<year>_<n>:
 * source "past", scheme wassce (WAEC) or utme (JAMB), its year, and paperOrder n
 * so the archive can serve the whole paper in its own order (/api/questions?full=1).
 * Pictures written "./q19.svg" are pointed at the file that really exists.
 * The one theory paper (WAEC Chemistry 2023) is not an objective list and is
 * left as a file. Copies only; re-running replaces the same documents.
 *
 *   node scripts/one-bank-local-papers.js --dry
 *   node scripts/one-bank-local-papers.js
 */
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });
const { parseExamJs, importQuestions, subjLabel } = require("../routes/cbt").helpers;

const DRY = process.argv.includes("--dry");
const NAT = path.join(__dirname, "..", "..", "exam-archive", "national");
const PAPERS = [
  ["waec", "mathematics", "2020", "waec/math/math-2020.js"],
  ["waec", "mathematics", "2021", "waec/math/math-2021.js"],
  ["waec", "english", "2021", "waec/english/english-2021.js"],
  ["waec", "physics", "2020", "waec/physics/physics-2020.js"],
  ["waec", "chemistry", "2024", "waec/chemistry/chemistry-2024.js"],
  ["jamb", "chemistry", "2024", "jamb/chemistry/chemistry-2024.js"],
];

/** "./q19.svg" -> the site path of the file that exists (next to the paper, or in its year folder). */
function imageOf(img, rel, year) {
  if (typeof img !== "string" || !img.trim()) return null;
  const s = img.trim();
  if (/^\s*<svg[\s>]/i.test(s) || /^(https?:)?\//.test(s)) return s;
  const name = s.replace(/^\.\//, "");
  const dir = path.dirname(rel);
  for (const cand of [path.join(dir, name), path.join(dir, year, name)]) {
    if (fs.existsSync(path.join(NAT, cand))) return `/exam-archive/national/${cand.replace(/\\/g, "/")}`;
  }
  return `/exam-archive/national/${path.join(dir, name).replace(/\\/g, "/")}`;
}

(async () => {
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  let total = 0;
  for (const [board, subject, year, rel] of PAPERS) {
    // Older files call the text `questionText`, and written-answer questions keep
    // their answer only in the worked explanation: that becomes the model answer.
    const raw = parseExamJs(fs.readFileSync(path.join(NAT, rel), "utf8")).map((q) => ({
      ...q,
      question: q.question ?? q.questionText,
      answer: q.answer ?? (!(q.options || []).length
        ? ([].concat(q.explanation || "").join("\n").trim() || "No model answer is given in the paper.")
        : undefined),
    }));
    const qs = importQuestions(raw);
    const scheme = board === "waec" ? "wassce" : "utme";
    const writes = qs.map((q, n) => [db.collection("cbtQuestions").doc(`file_${board}_${subject}_${year}_${n + 1}`), {
      ...q,
      image: imageOf(raw[n] && raw[n].image, rel, year) || q.image || null,
      source: "past", scheme, subject, subjectLabel: subjLabel(subject),
      schemeSubject: `${scheme}__${subject}`, year, paperOrder: n + 1,
      origin: { file: `exam-archive/national/${rel}`, index: n },
      createdAt: now, migratedAt: now,
    }]);
    console.log(`  ${String(writes.length).padStart(3)}  ${scheme} ${subject} ${year}  (${rel})`);
    total += writes.length;
    if (!DRY) {
      const batch = db.batch();
      writes.forEach(([ref, d]) => batch.set(ref, d));
      await batch.commit();
    }
  }
  console.log(`${total} questions${DRY ? " (dry run: nothing written)" : " written"}`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
