/* ============================================================================
   The instructions page
   ----------------------------------------------------------------------------
   Before an exam begins the student is shown how it works, written from the exam's own
   settings, so it is always true of THIS paper: the time and whether a clock runs, the
   sections and how many to answer, how many tries, how to answer each kind of question,
   what the OMR sheet or answer booklet is, the camera check if there is one, and then
   whatever the teacher wrote. The student presses Begin; nothing of the paper is drawn
   and no clock starts until they do.

   The teacher turns the page on or off in the setup (head.instructions) and adds their
   own lines there (head.instrText). `preview` shows it to the teacher, who closes it.
   ========================================================================== */

import { TYPES, ORDER, paperMarks, attemptOf, esc } from "./model.js";
import { makeCover } from "/utils/components/pp-cover.js";

const SECTION = "ABCD";

/**
 * The page as data: [{ title, lines: [string] }], plain text (escaped when drawn).
 * Pure, so it can be tested without a browser.
 */
export function instructionSections(head, questions) {
  const out = [];
  const groups = ORDER.map((t) => [t, questions.filter((q) => q.type === t)]).filter(([, l]) => l.length);
  const total = paperMarks(questions, head.attempt);

  /* the facts */
  const facts = [];
  facts.push(`${[head.subject, head.klass].filter(Boolean).join(" · ") || "This exam"}: ${questions.length} question${questions.length === 1 ? "" : "s"}, ${total} mark${total === 1 ? "" : "s"} in all.`);
  if (head.time) facts.push(`Time allowed: ${head.time}.`);
  if (head.timer) facts.push("A countdown clock runs on the screen. It starts when you press Begin, and your paper is checked for you when it reaches zero.");
  else if (head.time) facts.push("There is no clock on the screen, so keep to the time yourself.");
  const tries = head.tries == null ? 1 : Number(head.tries);
  facts.push(tries === 0 ? "You may check your answers as often as you like."
    : tries === 1 ? "You have ONE try. When you check your answers, that is your score."
      : `You may sit this paper ${tries} times. Each time you check your answers uses up one try.`);
  out.push({ title: "About this exam", lines: facts });

  /* the sections */
  const sec = groups.map(([t, list], i) => {
    const n = attemptOf(head.attempt, t, list.length);
    const marks = paperMarks(list, { [t]: n });
    const rule = n < list.length ? `answer any ${n} of the ${list.length}` : list.length === 1 ? "answer the question" : "answer every question";
    return `Section ${SECTION[i]}: ${TYPES[t].head}. ${list.length} question${list.length === 1 ? "" : "s"}; ${rule}; ${marks} mark${marks === 1 ? "" : "s"}.`;
  });
  if (sec.length) out.push({ title: "The sections", lines: sec });

  /* how to answer */
  const has = (t) => groups.some(([g]) => g === t);
  const how = [];
  const sheet = head.omr || head.booklet;
  if (has("mcq")) how.push(sheet
    ? "Multiple choice: shade ONE bubble for each question on the OMR sheet. Open it from the tab at the bottom of the right edge; it opens beside the questions."
    : "Multiple choice: click the letter for the answer you choose. Click another to change it.");
  if (has("fill")) how.push("Fill-in-the-blank: type your answer on the line in the sentence.");
  if (has("sub") || has("theory")) how.push(head.booklet
    ? "Written answers: type each answer in the answer booklet, on the lines under its question number."
    : head.theorySheet ? "Written answers: type each answer on the answer sheet, under its question number."
      : "Written answers: type your answer on the lines under the question.");
  if (has("fill") || has("sub") || has("theory")) how.push("To write an equation (a fraction, a power, a square root), press Alt and = together, type it the way you would say it (for example 1/2 or x^2), and press Enter.");
  how.push("Your tools (calculator, rulers and the rest) are on the left edge of the screen. The tab beside them slides them away.");
  how.push("When you have finished, press the tick key to check your answers. Multiple choice and one-word answers are marked for you; for the written ones you mark your own against the model answer.");
  out.push({ title: "How to answer", lines: how });

  if (head.camera) out.push({
    title: "The camera check",
    lines: [
      "This exam has a camera check. Your camera is looked at on this device only; no picture, video or sound is sent or saved.",
      "Your teacher gets a short list of notes, such as 'face not in view for 14 seconds' or 'left the exam page'.",
      "Sit where your face is lit and in view, with nobody else in the picture, and stay on this page.",
    ],
  });

  /* the teacher's own words, a paragraph for each line they wrote */
  const own = String(head.instrText || "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (own.length) out.push({ title: head.school ? `From ${head.school}` : "From your teacher", lines: own });
  return out;
}

/**
 * Show the page over everything and resolve when the student presses Begin (or the teacher, in a
 * preview, presses Close). Nothing behind it is the student's to use until then.
 * The site's receipt on the paint blob (pp-cover.js); each section's name is a sticky tag, like the
 * "Section A" notes on the paper itself.
 */
export function showInstructions({ head, questions, preview = false }) {
  return new Promise((resolve) => {
    document.querySelector(".pp-instr")?.remove();
    const { root, paper, close } = makeCover({ label: "Instructions", wide: true, tag: preview ? "Preview" : "Exam", colour: 0 });
    root.classList.add("pp-instr");
    const parts = instructionSections(head, questions);
    paper.innerHTML = `<div class="pp-cover__scroll">
      <div class="pp-cover__head">
        <h1 class="pp-cover__title" style="margin:0">Instructions</h1>
        ${head.school ? `<span class="pp-pill pp-pill--static">${esc(head.school)}</span>` : ""}
      </div>
      ${parts.map((sec, i) => `<div class="pp-cover__tag"><span class="pp-sticky pp-sticky--c${[0, 3, 2, 4, 1][i % 5]}" style="--pp-note-tilt:${i % 2 ? 1.5 : -1.5}deg;padding:0.3rem 0.8rem 0.35rem">${esc(sec.title)}</span></div>
        <ul class="pp-cover__list">${sec.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`).join("")}
    </div>
    <div class="pp-cover__go"><button type="button" class="pp-btn">${preview ? "Close the preview" : "Begin the exam"}</button></div>`;
    const btn = paper.querySelector("button");
    btn.focus({ preventScroll: true });
    const done = () => { close(); document.removeEventListener("keydown", onKey); resolve(); };
    const onKey = (e) => { if (preview && e.key === "Escape") done(); };
    btn.addEventListener("click", done);
    if (preview) document.addEventListener("keydown", onKey);
  });
}
