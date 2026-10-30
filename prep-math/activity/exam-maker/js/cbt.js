/* ============================================================================
   A CBT paper, as a printed paper
   ----------------------------------------------------------------------------
   The CBT picker (exam-archive/national/exams) can open a paper in "Paper mode":
   it sends the Exam Maker `?cbt=axis|top|subject|topic|paper`, and the paper
   comes from the same static bank the on-screen test is served from, so the
   printed paper and the CBT one are always the same questions.

   toPaper() is pure and node-testable; loadPaper() only adds the bank read.
   ========================================================================== */

import { clean } from "./model.js";

/* the picker's own rule (quiz-engine qFormat): two or more options is a
   multiple-choice question whatever its stored type says */
const formatOf = (q) =>
  Array.isArray(q.options) && q.options.length >= 2 ? "mcq"
    : /^(theory|essay)$/.test(q.type) ? "theory" : "short";

const answerText = (q) =>
  String(q.answer || (Array.isArray(q.explanation) ? q.explanation.join(" ") : q.explanation) || "").trim();

/**
 * Bank questions → Exam Maker questions.
 *   objective (4 options)      → multiple choice
 *   polar (True / False)       → a fill-in-the-blank: "True or False: …"
 *   short, subjective, blank   → subjective
 *   theory, essay              → theory
 * `marksEach` is the teacher's scheme, so the paper follows it like any other.
 * Questions that carry a picture are counted, because the printed paper cannot
 * show that picture yet.
 */
export function toPaper(bank, { format = "", marksEach = { mcq: 1, fill: 1, sub: 2, theory: 4 } } = {}) {
  const list = (bank || []).filter((q) => q && q.question && (!format || formatOf(q) === format));
  let pictures = 0;
  const questions = list.map((q) => {
    if (q.image) pictures++;
    const fmt = formatOf(q);
    let raw;
    if (fmt === "mcq" && q.options.length === 2) {
      raw = { type: "fill", text: `True or False: ${q.question}`, answer: q.options[q.answerIndex] || "True" };
    } else if (fmt === "mcq") {
      raw = { type: "mcq", text: q.question, options: q.options, answer: q.answerIndex || 0 };
    } else if (fmt === "theory") {
      raw = { type: "theory", text: q.question, answer: answerText(q) };
    } else {
      raw = { type: "sub", text: q.question, answer: answerText(q) };
    }
    raw.marks = marksEach[raw.type];
    return clean(raw);
  });
  const first = list[0] || {};
  return {
    questions,
    pictures,
    head: {
      subject: [first.subjectLabel || first.subject, first.topic].filter(Boolean).join(" · "),
      klass: first.grade || (first.scheme ? String(first.scheme).toUpperCase() : ""),
    },
  };
}

/**
 * "Attempt N of the paper" as the Exam Maker holds it, one number per kind of question:
 * N shared out in proportion to how many of each there are (largest remainders), at least
 * one for every kind that is there. A number that is every question (or more) means all.
 */
export function attemptSplit(questions, n) {
  const kinds = ["mcq", "fill", "sub", "theory"];
  const count = Object.fromEntries(kinds.map((k) => [k, questions.filter((q) => q.type === k).length]));
  const total = kinds.reduce((s, k) => s + count[k], 0);
  if (!(n > 0) || n >= total) return {};
  const present = kinds.filter((k) => count[k]);
  const raw = Object.fromEntries(present.map((k) => [k, (count[k] * n) / total]));
  const out = Object.fromEntries(present.map((k) => [k, Math.max(1, Math.floor(raw[k]))]));
  let left = n - present.reduce((s, k) => s + out[k], 0);
  const byRemainder = [...present].sort((a, b) => (raw[b] - Math.floor(raw[b])) - (raw[a] - Math.floor(raw[a])));
  for (let i = 0; left > 0 && i < 100; i++, left--) out[byRemainder[i % byRemainder.length]]++;
  /* a kind given as many as it has is simply "all" */
  present.forEach((k) => { if (out[k] >= count[k]) out[k] = 0; });
  return out;
}

/** "class|grade10|biology|Cell Structure|1" → that paper's questions, as above. */
export async function loadPaper(spec, format, marksEach, attempt = 0) {
  const [axis, top, subject, topic, paper] = String(spec || "").split("|");
  if (!top || !subject || !topic) return null;
  const { paperQuestions } = await import("/utils/cbt-bank.js");
  const bank = await paperQuestions(axis === "exam" ? "exam" : "class", top, subject, topic, paper || 1);
  if (!bank.length) return null;
  const built = toPaper(bank, { format, marksEach });
  built.head.attempt = attemptSplit(built.questions, attempt);
  return built;
}
