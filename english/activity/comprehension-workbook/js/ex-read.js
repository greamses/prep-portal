/* ============================================================================
   Comprehension Workbook — CHAPTER 1: READ IT, THEN ANSWER IT
   ----------------------------------------------------------------------------
   Comprehension is the hardest thing to put on a printable page, because the
   questions worth asking have answers no page can mark. A workbook that
   pretends otherwise either marks good answers wrong or marks nothing at all.

   So this chapter asks the three kinds that CAN be marked, and says so:

     literal      the answer is a word or two lifted straight out
     vocabulary   what a word means HERE, from the sentence round it
     inference    not stated, but only one answer really fits

   AND EVERY QUESTION ASKS FOR THE LINE. That is the exercise, as much as the
   answer is: a child who cannot name the line has not found the answer, they
   have remembered something. It is also what makes the marking teach — the
   key says "grass, line 3", so a wrong answer sends them to the right place
   rather than just telling them what they should have put.

   ONE ITEM IS ONE PASSAGE, with all its questions under it. The engine makes
   an item and renders it whole, so this is the only shape that prints a
   passage once and asks five things about it; a question per item would
   reprint the passage five times.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { levelOf, box, line, ask, say, worked, dealer } from "../../shared/levels.js";
import { bankFor } from "/data/english/passages.js";

const tier = (o) => levelOf(o).id;
const deal = dealer();

const KINDS = {
  literal: "it is written there",
  vocabulary: "what the word means here",
  inference: "not written, but it follows",
};

/** The passage, with its lines numbered so the questions can point at them. */
const passageHtml = (p) =>
  `<div class="en-passage"><p class="en-passage__title">${p.title}</p>`
  + p.lines.map((l, i) => `<p class="en-passage__line"><span class="en-passage__n">${i + 1}</span>${l}</p>`).join("")
  + `</div>`;

export const CM_GROUPS = [
  {
    id: "cm-read",
    chapter: "Chapter 1 · Reading for the answer",
    label: "Read it, then answer it",
    blurb: "A short passage, and questions whose answers can be found in it.",
  },
];

/* ═══ a passage and its questions ══════════════════════════════════════════*/

const cmRead = {
  id: "cm-read-passage",
  group: "cm-read",
  label: "A passage and its questions",
  blurb: "Short numbered passages; every answer names the line it came from.",
  heading: "Read the passage, then answer the questions",
  instruction: () =>
    "Read the whole passage once before you look at the questions — all of it, even the parts that seem dull. Then " +
    "take one question at a time and go BACK into the passage for it. Most of the answers are written there in so " +
    "many words. Some ask what a word means where it stands, and the sentence around it will tell you. A few are " +
    "not written down anywhere, but only one answer fits what is. Then write the number of the line you found it " +
    "on. If you cannot name a line, you have not found the answer yet — you have remembered something.",
  cols: 1,
  /* ONE passage to a page-full. Two would mean every Gentle page carried the
     whole bank, so a new workbook code would only reorder it. */
  defaultCount: 1,
  make(r, o, _k, i) {
    const p = deal(r, bankFor(tier(o)), i);
    /* the questions in a fixed order: they build on each other, the literal
       ones first and the inference last */
    return { p, qs: p.qs };
  },
  render: (it) => passageHtml(it.p)
    + it.qs.map((q, i) => ask(
      `<span class="en-qn">${i + 1}</span> ${q.q}<br>${line()} <span class="en-from">line ${box()}</span>`,
    )).join(""),
  worked: () => worked(
    `<div class="en-passage"><p class="en-passage__title">The Weaver Birds</p>`
    + `<p class="en-passage__line"><span class="en-passage__n">3</span>The males build the nests, knotting strips of grass with their beaks.</p></div>`
    + ask(`<span class="en-qn">1</span> What do the birds build their nests from?<br>`
      + `<u>grass</u> &nbsp; <span class="en-from">line <u>3</u></span>`)
    + say("The answer is one word and it is already in the passage, so copy it rather than putting it into your "
      + "own words. Then name the line: line 3 is where the grass is mentioned. Naming the line is half the "
      + "exercise, because it is the half you can check.")),
  /* two places per question, in the order they are rendered: the answer, then
     the line it came from */
  key: (it) => it.qs.flatMap((q) => [want.text(...q.a), want.num(q.from)]),
  answer: (it) => it.qs.map((q, i) => `${i + 1}. ${q.a[0]} — line ${q.from} (${KINDS[q.kind]})`),
};

export const CM_EXERCISES = [cmRead];
