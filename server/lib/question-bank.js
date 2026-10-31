/**
 * A teacher's question bank.
 *
 * Every question a teacher writes, generates or shares is kept in questionBank/{uid}/items so it can be
 * put on another paper later. A SUBcollection, so no browser rule can read it; the Exam Maker asks the
 * server (/api/bank). A question's id is a hash of what it says, so saving the same question twice is
 * one question, not two.
 */

const crypto = require("crypto");
const admin = require("firebase-admin");

const TYPES = ["mcq", "fill", "sub", "theory"];
const clip = (s, n) => String(s == null ? "" : s).slice(0, n);

/** One question from the browser, checked and clipped. Null when it says nothing. */
function cleanQuestion(q) {
  const type = TYPES.includes(q && q.type) ? q.type : "mcq";
  const text = clip(q && q.text, 3000).trim();
  if (!text) return null;
  const out = {
    type, text,
    marks: Math.max(0, Math.min(100, Math.round(Number(q && q.marks)) || 0)),
    lines: Math.max(0, Math.min(40, Math.round(Number(q && q.lines)) || 0)),
    svg: typeof (q && q.svg) === "string" && /^\s*<svg[\s>]/i.test(q.svg) ? clip(q.svg, 30000) : "",
  };
  if (type === "mcq") {
    out.options = [0, 1, 2, 3].map((k) => clip(q && q.options && q.options[k], 400));
    out.answer = Math.max(0, Math.min(3, Math.round(Number(q && q.answer)) || 0));
  } else { out.options = []; out.answer = clip(q && q.answer, 3000); }
  return out;
}

/** What the question says, as an id: the same question is always the same document. */
function bankId(q) {
  const key = JSON.stringify([q.type, q.text.replace(/\s+/g, " ").toLowerCase(), q.options, q.type === "mcq" ? q.answer : String(q.answer).toLowerCase()]);
  return crypto.createHash("sha1").update(key).digest("hex").slice(0, 24);
}

/** Keep these questions in this teacher's bank. Never throws: a bank that cannot be reached must not stop a paper. */
async function saveQuestions(uid, questions, meta = {}) {
  try {
    const db = admin.firestore();
    const stamp = admin.firestore.FieldValue.serverTimestamp();
    const list = (Array.isArray(questions) ? questions : []).slice(0, 200).map(cleanQuestion).filter(Boolean);
    for (let i = 0; i < list.length; i += 400) {
      const batch = db.batch();
      list.slice(i, i + 400).forEach((q) => {
        batch.set(db.collection("questionBank").doc(uid).collection("items").doc(bankId(q)), {
          ...q, subject: clip(meta.subject, 80), topic: clip(meta.topic, 80), level: clip(meta.level, 60), savedAt: stamp,
        }, { merge: true });
      });
      await batch.commit();
    }
    return list.length;
  } catch (e) {
    console.error("[question bank]", e.message);
    return 0;
  }
}

module.exports = { cleanQuestion, bankId, saveQuestions };
