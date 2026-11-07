/**
 * ONE QUESTION BANK — every question lives in `cbtQuestions`.
 *
 * The CBT bank already had the fullest question shape (types, topics, papers,
 * images, videos, MathJax), the admin editor and the test player, so it IS the
 * bank. What used to be kept elsewhere is kept here too:
 *
 *   source "past"     the past-question archive (was alocQuestions), served by
 *                     /api/questions as before (gated by archiveEnabled) and
 *                     hidden from CBT tests while hideOriginals is on
 *   source "teacher"  a teacher's own Exam Maker questions: owner = their uid,
 *                     scheme "own", never in any public query (no public scheme
 *                     or schemeSubject matches them). Private to that teacher.
 *
 * The Exam Maker still saves and loads NAMED banks (questionSets/{uid}/sets);
 * a set now lists the ids of its questions in this one bank, and keeps its old
 * embedded copy as a fallback.
 */
const crypto = require("crypto");

const BANK = "cbtQuestions";
const OWN_SCHEME = "own";

/* Exam Maker types <-> bank types */
const EM_TO_BANK = { mcq: "objective", fill: "subjective", sub: "short", theory: "theory" };
const BANK_TO_EM = { objective: "mcq", polar: "mcq", subjective: "fill", short: "sub", theory: "theory" };

const subjectKeyOf = (s) => String(s || "").split("·")[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, "") || "general";

/** The id a teacher's question has in the bank: the same question is always the same document. */
function ownId(uid, q) {
  const key = JSON.stringify([uid, q.type, String(q.text || "").replace(/\s+/g, " ").toLowerCase(), q.options || [], q.answer]);
  return `own_${crypto.createHash("sha1").update(key).digest("hex").slice(0, 24)}`;
}

/** An Exam Maker question (already cleaned) as a private bank document. */
function emToBank(q, uid, meta = {}) {
  const subject = subjectKeyOf(meta.subject);
  const isMcq = q.type === "mcq";
  return {
    id: ownId(uid, q),
    data: {
      owner: uid, visibility: "private", source: "teacher",
      scheme: OWN_SCHEME, subject, subjectLabel: String(meta.subject || "").slice(0, 80),
      level: String(meta.level || "").slice(0, 60),
      type: EM_TO_BANK[q.type] || "theory", emType: q.type,
      question: q.text,
      options: isMcq ? q.options : [],
      answerIndex: isMcq ? q.answer : null,
      answer: isMcq ? null : String(q.answer ?? ""),
      image: q.svg || null,
      marks: q.marks || 0, lines: q.lines || 0,
    },
  };
}

/** A bank document as an Exam Maker question. */
function bankToEm(x) {
  const type = x.emType || BANK_TO_EM[x.type] || "theory";
  const isMcq = type === "mcq";
  const opts = Array.isArray(x.options) ? x.options.slice(0, 4) : [];
  while (isMcq && opts.length < 4) opts.push("");
  return {
    type, text: x.question || "",
    options: isMcq ? opts : [],
    answer: isMcq ? (typeof x.answerIndex === "number" ? x.answerIndex : 0) : String(x.answer ?? ""),
    marks: x.marks || (isMcq ? 1 : 0), lines: x.lines || 0,
    svg: typeof x.image === "string" && /^\s*<svg[\s>]/i.test(x.image) ? x.image : "",
  };
}

/** An archive (ALOC) document as a bank document, tagged "past". */
function pastToBank(x, subjKey, subjLabel) {
  const scheme = String(x.queryType || "").toLowerCase();
  const subject = subjKey(x.subject);
  const year = /^(19|20)\d\d$/.test(String(x.examYear || "")) ? String(x.examYear) : null;
  const hasOpts = Array.isArray(x.options) && x.options.length >= 2;
  return {
    source: "past", scheme, subject, subjectLabel: subjLabel(subject),
    schemeSubject: `${scheme}__${subject}`,
    type: hasOpts ? "objective" : "theory",
    question: x.question || "", options: x.options || [],
    answerIndex: typeof x.answerIndex === "number" ? x.answerIndex : null,
    answer: x.answer || null,
    explanation: x.solution || "", image: x.image || null,
    year, examType: x.examType || null, section: x.section || null,
    alocId: x.alocId ?? null,
    origin: { coll: "alocQuestions", id: `aloc_${x.alocId}` },
    ...(x.raw ? { raw: x.raw } : {}),
  };
}

module.exports = { BANK, OWN_SCHEME, emToBank, bankToEm, pastToBank, ownId, subjectKeyOf };
