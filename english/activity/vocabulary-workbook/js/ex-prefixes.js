/* ============================================================================
   Vocabulary Workbook — CHAPTER 1: OPPOSITES MADE WITH A PREFIX
   ----------------------------------------------------------------------------
   The quickest way there is to double the words a child owns. Every prefix
   learnt turns a word they already have into one they did not: a child who
   knows "possible" and knows im- has "impossible" for nothing.

   AND IT IS A SPELLING LESSON IN DISGUISE. im- before p, b and m; il- before
   l; ir- before r; in- before most of the rest — and un-, which goes in front
   of more words than any of them. The rules narrow the choice, they never
   settle it, so the bank (/data/english/prefixes.js) stores every word's own
   prefix rather than working it out. The words that break the rules are the
   words worth asking about.

   The second exercise asks what the new word MEANS, because a prefix stuck on
   a word the child cannot use is not vocabulary, it is spelling practice.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { levelOf, box, line, ask, say, worked, dealer, pick } from "../../shared/levels.js";
import { PREFIXES, bankFor } from "/data/english/prefixes.js";

const tier = (o) => levelOf(o).id;
const deal = dealer();

export const VB_GROUPS = [
  {
    id: "vb-prefix",
    chapter: "Chapter 1 · Building words from the front",
    label: "Opposites with a prefix",
    blurb: "un-, dis-, im-, il-, ir-, in-, mis-, non-: one word becomes two.",
  },
];

/* ═══ make the opposite ════════════════════════════════════════════════════*/

const vbMake = {
  id: "vb-prefix-make",
  group: "vb-prefix",
  label: "Make the opposite",
  blurb: "Put the right beginning on the word.",
  heading: "Making the opposite",
  instruction: () =>
    "English usually makes an opposite by putting something on the FRONT of the word. Which something is not a " +
    "matter of choice — it is fixed for each word, and a wrong one is a spelling mistake. The sounds help: im- " +
    "goes before p, b and m (say “inpossible” and you will hear why), il- before l, ir- before r, in- before most " +
    "of the rest. And un- goes in front of more words than all of them put together. Write the whole new word.",
  cols: 2,
  defaultCount: 8,
  make: (r, o, _k, i) => ({ ...deal(r, bankFor(tier(o)), i) }),
  render: (it) => ask(`the opposite of <b class="en-word">${it.w}</b> is ${box()}`),
  worked: () => worked(
    ask(`the opposite of <b class="en-word">possible</b> is <u>impossible</u>`)
    + say("Not unpossible. The word starts with a p, and in- will not sit in front of a p — your mouth turns it "
      + "into an m whether you mean it to or not. That is the whole of the im- rule.")),
  key: (it) => [want.text(it.o)],
  answer: (it) => [`${it.w} → ${it.o} (${PREFIXES[it.p].of})${it.note ? ` — ${it.note}` : ""}`],
};

/* ═══ and what does it mean? ═══════════════════════════════════════════════*/

const vbMean = {
  id: "vb-prefix-mean",
  group: "vb-prefix",
  label: "What does it mean?",
  blurb: "The new word, and the beginning that made it.",
  heading: "The new word, and what it means",
  minLevel: "middle",
  instruction: () =>
    "A prefix on a word you cannot use is not a new word, it is just longer spelling. So here: write the beginning " +
    "that was taken off, and then say what the whole word means in your own words. Watch mis- especially — it does " +
    "not mean NOT, it means WRONGLY. To misread something is to read it and get it wrong, which is not the same as " +
    "not reading it at all.",
  cols: 1,
  defaultCount: 6,
  make: (r, o, _k, i) => ({ ...deal(r, bankFor(tier(o)), i) }),
  render: (it) => ask(`${pick(it.o)} = ${box()} + <b class="en-word">${it.w}</b>, and it means ${line()}`),
  worked: () => worked(
    ask(`${pick("misjudge")} = <u>mis-</u> + <b class="en-word">judge</b>, and it means <u>to judge it wrongly</u>`)
    + say("Not “to not judge it”. mis- is the wrongly one: a misprint is printed, a misunderstanding is understood "
      + "— both of them badly.")),
  key: (it) => [want.text(PREFIXES[it.p].of, PREFIXES[it.p].id), want.free()],
  answer: (it) => [`${PREFIXES[it.p].of} + ${it.w} = ${it.o}: ${it.m}`],
};

export const VB_EXERCISES = [vbMake, vbMean];
