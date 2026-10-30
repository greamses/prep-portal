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

/** "class|grade10|biology|Cell Structure|1" → that paper's questions, as above. */
export async function loadPaper(spec, format, marksEach) {
  const [axis, top, subject, topic, paper] = String(spec || "").split("|");
  if (!top || !subject || !topic) return null;
  const { paperQuestions } = await import("/utils/cbt-bank.js");
  const bank = await paperQuestions(axis === "exam" ? "exam" : "class", top, subject, topic, paper || 1);
  if (!bank.length) return null;
  return toPaper(bank, { format, marksEach });
}
