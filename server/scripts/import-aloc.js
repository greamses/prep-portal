/**
 * import-aloc.js — seed Firestore with past questions from the ALOC API.
 *
 * Usage:
 *   npm run import:aloc
 *   node scripts/import-aloc.js --types=utme,wassce --subjects=mathematics,english \
 *                               --batches=2 --size=40 --years=2019,2020
 *
 * Each question is written to the `alocQuestions` collection as one document
 * with id `aloc_<id>`, so re-running is idempotent (existing questions are
 * merged, never duplicated). The token is read from ALOC_TOKEN in server/.env.
 */

require("dotenv").config();
const admin = require("firebase-admin");

// ── CLI args (--key=value, comma-separated lists) ──────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ""), true];
  })
);
const list = (v, d) =>
  typeof v === "string" && v.length ? v.split(",").map((s) => s.trim()).filter(Boolean) : d;

const TOKEN = process.env.ALOC_TOKEN;
if (!TOKEN) {
  console.error("Missing ALOC_TOKEN in server/.env — add it and retry.");
  process.exit(1);
}

const TYPES = list(args.types, ["utme", "wassce"]);
const SUBJECTS = list(args.subjects, [
  // Core (already seeded) — re-running deepens them via dedupe.
  "english", "mathematics", "biology", "physics", "chemistry",
  "economics", "government", "commerce", "geography", "crk",
  // Remaining picker subjects that exist in ALOC.
  "englishlit", "accounting", "history", "insurance", "civiledu", "irk", "currentaffairs",
]);
// --years=all → 2000..2025 (one targeted call per year gives far more uniques
// than re-sampling a subject at random). Otherwise a comma list, or any-year.
let YEARS;
if (args.years === "all") YEARS = Array.from({ length: 26 }, (_, i) => String(2000 + i));
else YEARS = list(args.years, [null]);
const BATCHES = parseInt(args.batches || "2", 10);
const SIZE = parseInt(args.size || "20", 10); // ALOC is slow/flaky for large N — keep modest
const DELAY_MS = parseInt(args.delay || "300", 10);
const TIMEOUT_MS = parseInt(args.timeout || "50000", 10);
const RETRIES = parseInt(args.retries || "2", 10);
// Skip questions already in Firestore (default on) → re-runs only store new ones.
const SKIP_EXISTING = String(args["skip-existing"] || "true") !== "false";

// ── Firebase Admin (same init pattern as index.js) ─────────────────
let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else {
  credential = admin.credential.cert(require("../serviceAccountKey.json"));
}
admin.initializeApp({ credential });
const db = admin.firestore();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LETTERS = ["a", "b", "c", "d", "e"];

async function fetchBatch(subject, type, year) {
  const params = new URLSearchParams({ subject, type });
  if (year) params.set("year", year);
  const url = `https://questions.aloc.com.ng/api/v2/q/${SIZE}?${params}`;
  const tag = `${subject}/${type}${year ? "/" + year : ""}`;
  // ALOC times out intermittently — retry a couple of times before giving up.
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { AccessToken: TOKEN, Accept: "application/json" },
        signal: ctrl.signal,
      });
      if (!res.ok) {
        if (res.status === 429 && attempt < RETRIES) { await sleep(2000); continue; }
        console.warn(`  ! ${tag} → HTTP ${res.status}`);
        return [];
      }
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : json.data ? [json.data] : [];
    } catch (e) {
      if (attempt < RETRIES) { await sleep(800); continue; }
      console.warn(`  ! ${tag} → ${e.message} (after ${attempt + 1} tries)`);
      return [];
    } finally {
      clearTimeout(t);
    }
  }
  return [];
}

function normalize(q, subject, queryType) {
  const opt = q.option || {};
  const options = LETTERS.map((l) => opt[l]).filter((v) => v != null && String(v).trim() !== "");
  const answer = String(q.answer || "").toLowerCase().trim();
  return {
    alocId: q.id,
    source: "aloc",
    subject,
    queryType: String(queryType || "").toLowerCase(), // clean type we fetched under (ALOC's own examtype is unreliable)
    examType: String(q.examtype || "").toLowerCase(),
    examYear: String(q.examyear || ""),
    question: q.question || "",
    options, // ordered array (nulls dropped)
    optionMap: { a: opt.a ?? null, b: opt.b ?? null, c: opt.c ?? null, d: opt.d ?? null, e: opt.e ?? null },
    answer, // letter, e.g. "c"
    answerIndex: LETTERS.indexOf(answer), // 0-based, -1 if unknown
    solution: q.solution || "",
    section: q.section || "",
    image: q.image || "",
    importedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function commit(docs) {
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + 400)) {
      batch.set(db.collection("alocQuestions").doc(`aloc_${d.alocId}`), d, { merge: true });
    }
    await batch.commit();
  }
}

(async () => {
  console.log(`ALOC import → Firestore "alocQuestions"`);
  console.log(
    `types=[${TYPES}] subjects=[${SUBJECTS}] years=[${YEARS.map((y) => y || "any")}] ` +
      `batches=${BATCHES} size=${SIZE}\n`
  );

  const seen = new Set();
  const toWrite = new Map();
  let fetched = 0;

  // Preload existing IDs so we only keep questions we don't already have.
  if (SKIP_EXISTING) {
    const snap = await db.collection("alocQuestions").select().get();
    snap.forEach((d) => {
      const m = d.id.match(/^aloc_(\d+)$/);
      if (m) seen.add(Number(m[1]));
    });
    console.log(`Loaded ${seen.size} existing IDs — only NEW questions will be stored.\n`);
  }

  for (const type of TYPES) {
    for (const subject of SUBJECTS) {
      for (const year of YEARS) {
        for (let b = 0; b < BATCHES; b++) {
          const data = await fetchBatch(subject, type, year);
          fetched += data.length;
          for (const q of data) {
            if (!q || q.id == null || seen.has(q.id)) continue;
            seen.add(q.id);
            toWrite.set(q.id, normalize(q, subject, type));
          }
          await sleep(DELAY_MS);
        }
        console.log(`  ${type}/${subject}${year ? "/" + year : ""}: ${toWrite.size} new so far`);
      }
    }
  }

  const docs = [...toWrite.values()];
  console.log(`\nFetched ${fetched} rows → ${docs.length} NEW questions. Writing to Firestore…`);
  await commit(docs);
  console.log(`Done. Wrote ${docs.length} new questions into "alocQuestions".`);
  process.exit(0);
})().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
