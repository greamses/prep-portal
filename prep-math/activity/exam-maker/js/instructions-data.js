/* ============================================================================
   What the instructions say
   ----------------------------------------------------------------------------
   Written from the exam's own settings, so it is always true of THIS paper: its structure, how to
   answer each kind of question, how the clock and the tries work, what the OMR sheet, answer
   booklet and exam number are, the camera check, how marks are given and graded, and whatever
   the teacher wrote. Pure data (no browser), so it can be tested and used twice: printed as the
   first page of the paper (paper.js) and shown before the exam begins (instructions.js).
   ========================================================================== */

import { TYPES, ORDER, paperMarks, attemptOf } from "./model.js";

const SECTION = "ABCD";
const digits = (h) => Math.max(4, Math.min(12, Math.round(Number(h.examDigits)) || 8));

/** The paper's questions grouped as the paper prints them. */
export const groupsOf = (questions) => ORDER.map((t) => [t, questions.filter((q) => q.type === t)]).filter(([, l]) => l.length);

/** The table "Structure of the paper": one row per section, and what the whole paper is worth. */
export function structureRows(head, questions) {
  return groupsOf(questions).map(([t, list], i) => {
    const n = attemptOf(head.attempt, t, list.length);
    return { section: SECTION[i], kind: TYPES[t].head, questions: list.length, toAnswer: n, marks: paperMarks(list, { [t]: n }) };
  });
}

/**
 * The numbered parts of the page: [{ title, lines: [string] }], plain text (escaped when drawn).
 */
export function instructionSections(head, questions) {
  const out = [];
  const groups = groupsOf(questions);
  const has = (t) => groups.some(([g]) => g === t);
  const written = has("sub") || has("theory");
  const sheet = head.omr || head.booklet;
  const tries = head.tries == null ? 1 : Number(head.tries);

  /* 1. before you begin */
  const first = ["Write your name on the line at the top of the paper."];
  if (head.examNo) first.push(`Shade your ${digits(head)}-digit exam number on the ${head.booklet ? "front page of the answer booklet" : "OMR sheet"}: write each digit in its box, then shade the same digit in the column below it.`);
  first.push(`Check that you have all ${questions.length} question${questions.length === 1 ? "" : "s"} and that every page is clear. Tell the invigilator if anything is missing.`);
  first.push("Read every instruction and question carefully before you answer.");
  out.push({ title: "Before you begin", lines: first });

  /* 2. how to answer */
  const how = [];
  if (has("mcq")) how.push(sheet
    ? "Multiple choice: shade ONE bubble for each question on the OMR sheet, completely, with a soft pencil. To change an answer, rub the first one out completely. On screen, click the bubble."
    : "Multiple choice: choose ONE answer for each question: circle its letter, or click it on screen. Choose again to change it.");
  if (has("fill")) how.push("Fill-in-the-blank: write your answer on the line in the sentence.");
  if (written) how.push(head.booklet
    ? "Written answers: write (or type) each answer in the answer booklet, on the lines under its own question number. Show your working."
    : head.theorySheet ? "Written answers: write (or type) each answer on the answer sheet, under its own question number. Show your working."
      : "Written answers: write (or type) your answer on the lines under the question. Show your working.");
  if (has("fill") || written) how.push("On screen, press Alt and = to write an equation: type it as you would say it (1/2, x^2) and press Enter.");
  out.push({ title: "How to answer", lines: how });

  /* 3. time and conduct */
  const conduct = [];
  if (head.time) conduct.push(`You have ${head.time}.`);
  if (head.timer) conduct.push("A countdown clock runs on the screen. It starts when you press Begin, and your paper is checked for you when it reaches zero.");
  else if (head.time) conduct.push("Keep to the time yourself: there is no clock on the screen.");
  conduct.push("Work on your own. Do not talk, copy from anyone, or look up the answers.");
  if (head.camera) {
    conduct.push("Camera check: your camera is looked at on this device only. No picture, video or sound is sent or saved; your teacher gets a short list of notes (such as 'face not in view'). Keep your face in view, alone in the picture, and stay on the exam page.");
  }
  out.push({ title: "Time and conduct", lines: conduct });

  /* 4. marking */
  const marking = ["Multiple choice and one-word answers are marked by the computer when you check your answers."];
  if (written) marking.push(head.aiMark
    ? "Written answers are marked by AI, in turn, and your teacher may change a mark. Keep the page open until your marks appear."
    : "Written answers are marked against the model answer, by you or your teacher.");
  marking.push(tries === 0 ? "You may check your answers as often as you like."
    : tries === 1 ? "You have ONE try. When you check your answers, that is your score."
      : `You may sit this paper ${tries} times. Each time you check your answers uses up one try.`);
  marking.push("Grades: A 70 and over, B 60, C 50, D 45, E 40, F below 40.");
  out.push({ title: "Marking and grades", lines: marking });

  /* 5. the teacher's own words, a line for each line they wrote */
  const own = String(head.instrText || "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (own.length) out.push({ title: head.school ? `From ${head.school}` : "From your teacher", lines: own });
  return out;
}
