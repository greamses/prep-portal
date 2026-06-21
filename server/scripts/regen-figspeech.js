/**
 * One-off: regenerate the figurative-speech VIDEO set in practice/english with
 * the new prompt (Bloom's spread, grade, mixed types). The server AI can't watch
 * a YouTube link, so we feed the EXISTING questions back as source notes — they
 * encode the video's facts — then replace the old AI set for this video.
 *
 *   node scripts/regen-figspeech.js          # dry run (generate + print, no write)
 *   node scripts/regen-figspeech.js --write  # replace the live set
 */
require("dotenv").config({ path: __dirname + "/../.env" });
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });

const { genPrompt, parseExamJs, cleanQuestions, callModelRaw, safeJson } = require("../routes/cbt.js").helpers;

const VIDEO = "https://youtu.be/iLw5DSyYsaI?si=efDEgzzFGz_rYUo5";
const VIDEO_KEY = "iLw5DSyYsaI";
const SCHEME = "practice", SUBJECT = "english", LABEL = "English Language";
const SS = `${SCHEME}__${SUBJECT}`;
const WRITE = process.argv.includes("--write");

(async () => {
  const db = admin.firestore();
  const snap = await db.collection("cbtQuestions").where("schemeSubject", "==", SS).get();
  const old = snap.docs.filter((d) => String(d.data().video || "").includes(VIDEO_KEY));
  console.log(`Found ${old.length} existing questions for this video.`);
  if (!old.length) { console.log("Nothing to regenerate — abort."); process.exit(0); }

  // Build source notes from the existing Q/A/explanations (the video's facts).
  const notes = old.map((d) => {
    const q = d.data();
    const ans = q.answer || (Array.isArray(q.options) ? q.options[q.answerIndex] : "");
    const ex = Array.isArray(q.explanation) ? q.explanation.join(" ") : (q.explanation || "");
    return `- ${q.question} (Answer: ${ans}). ${ex}`;
  }).join("\n");

  const prompt = genPrompt(
    SCHEME, LABEL,
    "Figurative speech: similes, metaphors and hyperbole",
    20,
    ["objective", "polar", "short", "subjective"],
    false,
    { url: VIDEO, text: notes, scope: "set" },
    "JSS1",
  );

  console.log("Generating with the new prompt…");
  const text = await callModelRaw(prompt, false);
  let arr = parseExamJs(text);
  if (!arr.length) { try { const j = safeJson(text); arr = j.questions || j.items || (Array.isArray(j) ? j : []); } catch (_) {} }
  const questions = cleanQuestions(arr);
  console.log(`Generated ${questions.length} usable questions.`);
  const byType = questions.reduce((m, q) => ((m[q.type] = (m[q.type] || 0) + 1), m), {});
  console.log("By type:", byType);
  questions.slice(0, 4).forEach((q, i) => console.log(`  [${i}] (${q.type}) ${q.question.slice(0, 80)}`));

  if (questions.length < 8) { console.log("Too few questions — NOT replacing the set."); process.exit(1); }
  if (!WRITE) { console.log("\nDry run. Re-run with --write to replace the live set."); process.exit(0); }

  const stamp = admin.firestore.FieldValue.serverTimestamp;
  const batch = db.batch();
  old.forEach((d) => batch.delete(d.ref));
  questions.forEach((q) => {
    const ref = db.collection("cbtQuestions").doc();
    batch.set(ref, {
      scheme: SCHEME, subject: SUBJECT, subjectLabel: LABEL, schemeSubject: SS,
      topic: "Figurative speech", paper: "1",
      type: q.type || "objective",
      question: q.question, options: q.options || null,
      answerIndex: typeof q.answerIndex === "number" ? q.answerIndex : null,
      answer: q.answer || null,
      explanation: q.explanation, hint: q.hint || "", image: q.image || null,
      video: VIDEO, videoScope: "set",
      source: "ai", createdAt: stamp(), updatedAt: stamp(),
    });
  });
  await batch.commit();
  console.log(`Replaced ${old.length} old → ${questions.length} new questions.`);
  process.exit(0);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
