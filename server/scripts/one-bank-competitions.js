/**
 * The competition papers into the ONE bank (cbtQuestions).
 *
 * Each round was a static script (exam-archive/competitions/<comp>/<div>/<year>/<round>/script.js)
 * that calls setupQuiz(questions, timeLimit). They are read here in a sandbox and
 * every question written as cbtQuestions/comp_<comp>_<div>_<year>_<round>_<n>:
 *   source "competition", scheme "competition", visibility "gated",
 *   compKey "comp|div|year|round" (the same key a paperShares link records),
 *   compOrder n (the paper's own order), compTimeLimit.
 * Gated questions are never in a public query; /api/cbt/competition hands a paper
 * only to the admin, a premium member, or someone holding a share link for it.
 * Pictures given as ./q10.svg become the file's site path. Copies only; re-running
 * replaces the same documents.
 *
 *   node scripts/one-bank-competitions.js --dry
 *   node scripts/one-bank-competitions.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });

const DRY = process.argv.includes("--dry");
const ROOT = path.join(__dirname, "..", "..", "exam-archive", "competitions");

function papers() {
  const out = [];
  for (const comp of fs.readdirSync(ROOT)) {
    const c = path.join(ROOT, comp);
    if (!fs.statSync(c).isDirectory()) continue;
    const dirs = (d) => fs.readdirSync(d).filter((n) => fs.statSync(path.join(d, n)).isDirectory());
    for (const div of dirs(c)) for (const year of dirs(path.join(c, div))) {
      const y = path.join(c, div, year);
      if (!fs.statSync(y).isDirectory()) continue;
      for (const round of fs.readdirSync(y)) {
        const file = path.join(y, round, "script.js");
        if (fs.existsSync(file)) out.push({ comp, div, year, round, file });
      }
    }
  }
  return out;
}

/** Run a round's script with setupQuiz stubbed, and hand back what it set up. */
// The scripts are ES modules (some import a shared data file), so they are
// imported for real, as the browser does; question.js leaves the paper on window.
async function readPaper(file) {
  globalThis.window = globalThis.window || {};
  window.__compQuiz = null;
  await import(require("url").pathToFileURL(file).href);
  return window.__compQuiz;
}

const answerIndexOf = (q) => (typeof q.correctIndex === "number" ? q.correctIndex : typeof q.correct_index === "number" ? q.correct_index : null);

(async () => {
  const db = admin.firestore();
  /* a fill-in-the-blank's key: its own `accept`, or one made from a short answer */
  const { acceptFrom } = await import(require("url").pathToFileURL(path.join(__dirname, "..", "..", "utils", "blank-check.js")).href);
  const now = admin.firestore.FieldValue.serverTimestamp();
  let total = 0;
  for (const p of papers()) {
    const data = await readPaper(p.file);
    if (!data || !Array.isArray(data.questions) || !data.questions.length) { console.log(`  skipped ${p.comp}/${p.div}/${p.year}/${p.round}: no questions`); continue; }
    const compKey = `${p.comp}|${p.div}|${p.year}|${p.round}`;
    const base = `/exam-archive/competitions/${p.comp}/${p.div}/${p.year}/${p.round}/`;
    const writes = data.questions.map((q, n) => {
      const opts = Array.isArray(q.options) ? q.options : [];
      const image = typeof q.image === "string" && q.image ? (q.image.startsWith("./") ? base + q.image.slice(2) : q.image) : null;
      const ai = answerIndexOf(q);
      return [db.collection("cbtQuestions").doc(`comp_${p.comp}_${p.div}_${p.year}_${p.round}_${n + 1}`.replace(/[^A-Za-z0-9_-]/g, "-")), {
        source: "competition", scheme: "competition", visibility: "gated",
        compKey, comp: { comp: p.comp, div: p.div, year: p.year, round: p.round },
        compOrder: n + 1, compTimeLimit: data.timeLimit || 0,
        // a question with no options is fill-in-the-blank
        type: opts.length >= 2 ? (q.type || "objective") : "subjective",
        question: q.question || "", options: opts,
        answerIndex: ai, answer: opts.length >= 2 ? null : (q.answer ?? ([].concat(q.explanation || "").join(" ").trim() || null)),
        accept: opts.length >= 2 ? null : (Array.isArray(q.accept) && q.accept.length ? q.accept.map(String) : (q.answer ? acceptFrom(q.answer) : [])),
        explanation: q.explanation ?? "", hint: q.hint || "", topic: q.topic || null,
        section: q.section || null, image, film: q.film || null,
        /* the diagram's own SVG too, for the Paper Test Builder, whose questions carry their drawing inline */
        svgInline: image && image.endsWith(".svg") ? (() => { try { return fs.readFileSync(path.join(__dirname, "..", "..", image.replace(/^\//, "")), "utf8").slice(0, 30000); } catch { return null; } })() : null,
        subject: q.subject || "mathematics",
        origin: { file: path.relative(path.join(__dirname, "..", ".."), p.file).replace(/\\/g, "/"), index: n },
        createdAt: now, migratedAt: now,
      }];
    });
    /* the same paper as a file the server reads first (routes/cbt.js /competition): no
       Firestore read per open, and the paper still opens when the read quota runs out.
       server/papers/ is blocked from the web by middleware.js; only the function reads it. */
    const paperFile = path.join(__dirname, "..", "papers", `${compKey.replace(/\|/g, "__")}.paper`);
    fs.mkdirSync(path.dirname(paperFile), { recursive: true });
    fs.writeFileSync(paperFile, JSON.stringify({
      timeLimit: data.timeLimit || 0,
      questions: writes.map(([, d]) => ({
        question: d.question, options: d.options, correctIndex: d.answerIndex, answer: d.answer, accept: d.accept,
        explanation: d.explanation, hint: d.hint, image: d.image, topic: d.topic, type: d.type, section: d.section,
        ...(d.film ? { film: d.film } : {}),
      })),
    }));
    console.log(`  ${String(writes.length).padStart(3)}  ${compKey}  (time ${data.timeLimit}s)`);
    total += writes.length;
    if (!DRY) {
      for (let i = 0; i < writes.length; i += 400) {
        const batch = db.batch();
        writes.slice(i, i + 400).forEach(([ref, d]) => batch.set(ref, d));
        await batch.commit();
      }
    }
  }
  console.log(`${total} competition questions${DRY ? " (dry run: nothing written)" : " written"}`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
