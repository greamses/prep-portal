/**
 * Regenerate EVERY watch-first video set in the CBT bank with the current prompt
 * (Bloom's spread, grade, mixed types). The server AI can't watch a video, so for
 * each set we feed the existing questions back as source notes (they encode the
 * video's facts), generate fresh questions, and replace that set in place.
 *
 * A "video set" = all questions sharing one video where videoScope === "set".
 *
 *   node scripts/regen-video-sets.js                 # dry run (no writes)
 *   node scripts/regen-video-sets.js --write         # apply to all sets
 *   node scripts/regen-video-sets.js --write --grade JSS1   # pitch to a grade
 *   node scripts/regen-video-sets.js --video iLw5DSyYsaI    # only matching video(s)
 */
require("dotenv").config({ path: __dirname + "/../.env" });
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });

const { genPrompt, parseExamJs, cleanQuestions, callModelRaw, safeJson } = require("../routes/cbt.js").helpers;

const argv = process.argv.slice(2);
const WRITE = argv.includes("--write");
const flag = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const GRADE = flag("--grade") || "";
const VIDEO_MATCH = flag("--video") || "";
const TYPES = ["objective", "polar", "short", "subjective"];
const mode = (a) => (a && a.toMillis ? a.toMillis() : 0);
const majority = (arr) => { const c = {}; arr.forEach((v) => { if (v) c[v] = (c[v] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || ""; };

(async () => {
  const db = admin.firestore();
  const stamp = admin.firestore.FieldValue.serverTimestamp;
  const snap = await db.collection("cbtQuestions").get();

  // Group watch-first questions by schemeSubject + video.
  const groups = new Map();
  snap.forEach((d) => {
    const x = d.data();
    if (!x.video || x.videoScope !== "set") return;
    if (VIDEO_MATCH && !String(x.video).includes(VIDEO_MATCH)) return;
    const key = `${x.schemeSubject}__${x.video}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ id: d.id, ref: d.ref, ...x });
  });

  console.log(`Found ${groups.size} watch-first video set(s)${WRITE ? "" : "  (dry run)"}.\n`);
  if (!groups.size) process.exit(0);

  let regenerated = 0;
  for (const [key, docs] of groups) {
    const first = docs[0];
    const scheme = first.scheme, subject = first.subject;
    const label = first.subjectLabel || (subject ? subject[0].toUpperCase() + subject.slice(1) : "Subject");
    const ss = first.schemeSubject || `${scheme}__${subject}`;
    const video = first.video;
    const paper = ["1", "2"].includes(String(first.paper)) ? String(first.paper) : null;
    const topic = majority(docs.map((d) => d.topic)) || "";
    const count = Math.min(Math.max(docs.length, 8), 30);
    console.log(`▶ ${label} · ${scheme} — ${docs.length} q · topic "${topic || "—"}" · ${video}`);

    const notes = docs.map((d) => {
      const ans = d.answer || (Array.isArray(d.options) ? d.options[d.answerIndex] : "");
      const ex = Array.isArray(d.explanation) ? d.explanation.join(" ") : (d.explanation || "");
      return `- ${d.question} (Answer: ${ans}). ${ex}`;
    }).join("\n");

    const prompt = genPrompt(scheme, label, topic, count, TYPES, false, { url: video, text: notes, scope: "set" }, GRADE);
    let text;
    try { text = await callModelRaw(prompt, false); } catch (e) { console.log(`   AI error: ${e.message} — skipped\n`); continue; }
    let arr = parseExamJs(text);
    if (!arr.length) { try { const j = safeJson(text); arr = j.questions || j.items || (Array.isArray(j) ? j : []); } catch (_) {} }
    const questions = cleanQuestions(arr);
    const byType = questions.reduce((m, q) => ((m[q.type] = (m[q.type] || 0) + 1), m), {});
    console.log(`   generated ${questions.length} — ${JSON.stringify(byType)}`);

    const threshold = Math.max(4, Math.floor(docs.length * 0.5));
    if (questions.length < threshold) { console.log(`   too few (<${threshold}) — NOT replacing\n`); continue; }
    if (!WRITE) { console.log("   dry run — not written\n"); continue; }

    const batch = db.batch();
    docs.forEach((d) => batch.delete(d.ref));
    questions.forEach((q) => {
      const ref = db.collection("cbtQuestions").doc();
      batch.set(ref, {
        scheme, subject, subjectLabel: label, schemeSubject: ss,
        topic: topic || null, paper,
        type: q.type || "objective",
        question: q.question, options: q.options || null,
        answerIndex: typeof q.answerIndex === "number" ? q.answerIndex : null,
        answer: q.answer || null,
        explanation: q.explanation, hint: q.hint || "", image: q.image || null,
        video, videoScope: "set",
        source: "ai", createdAt: stamp(), updatedAt: stamp(),
      });
    });
    await batch.commit();
    regenerated++;
    console.log(`   ✓ replaced ${docs.length} → ${questions.length}\n`);
  }

  console.log(WRITE ? `Done. Regenerated ${regenerated}/${groups.size} set(s).` : `Dry run complete for ${groups.size} set(s). Re-run with --write to apply.`);
  process.exit(0);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
