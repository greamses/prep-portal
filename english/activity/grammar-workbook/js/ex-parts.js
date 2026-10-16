/* ============================================================================
   Grammar Workbook — CHAPTER 1: WHAT JOB IS THIS WORD DOING?
   ----------------------------------------------------------------------------
   The one idea the whole of grammar stands on, and the one most often taught
   back to front: a part of speech is not a label a word carries about with
   it. It is the JOB the word is doing in the sentence it is in.

       We will  WATER  the garden.     — verb
       She drank the   WATER.          — noun
       The      WATER  bottle is full. — adjective

   Three sentences, one word, three answers — and a child who has learnt
   "water is a noun" is wrong twice out of three. So the sentences come from a
   bank (/data/english/partsofspeech.js) where the job is stored against the
   SENTENCE, never against the word, and the Stretch level is built out of
   words doing two different jobs on the same page.

   The second exercise turns it round: here is the job, find a word doing it.
   That is harder, and it is the one that shows whether the idea has landed.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { levelOf, box, ask, say, worked, dealer, anOf } from "../../shared/levels.js";
import { JOBS, bankFor } from "/data/english/partsofspeech.js";

const tier = (o) => levelOf(o).id;
const deal = dealer();

/** The sentence, with the word in question picked out of it. */
const sentence = (it) => it.s
  .map((w, k) => (k === it.i ? `<b class="en-pick">${w}</b>` : w))
  .join(" ");

export const GR_GROUPS = [
  {
    id: "gr-parts",
    chapter: "Chapter 1 · The jobs words do",
    label: "What job is this word doing?",
    blurb: "Noun, verb, adjective, adverb — decided by the sentence, not by the word.",
  },
];

/* ═══ name the job ═════════════════════════════════════════════════════════*/

const grName = {
  id: "gr-parts-name",
  group: "gr-parts",
  label: "Name the job",
  blurb: "One word is picked out. What is it doing there?",
  heading: "What job is this word doing?",
  instruction: () =>
    "A word's part of speech is its JOB in the sentence it is in, and the same word can do different jobs in " +
    "different sentences. So do not ask “what is this word?” — ask “what is it DOING here?”. A noun is a person, " +
    "a place, a thing or an idea. A verb is what something does or is. An adjective tells you more about a noun, " +
    "and an adverb tells you more about a verb. A pronoun stands in for a noun; a preposition puts a thing " +
    "somewhere; a conjunction joins; a determiner points a noun out.",
  cols: 1,
  defaultCount: 8,
  make: (r, o, _k, i) => ({ ...deal(r, bankFor(tier(o)), i) }),
  render: (it) => ask(`${sentence(it)} &nbsp;&nbsp; ${box()}`),
  worked: () => worked(
    ask(`We will <b class="en-pick">water</b> the garden tonight &nbsp;&nbsp; <u>verb</u>`)
    + say("Water is usually a thing, but not here: here it is what we are going to DO to the garden. Ask what the "
      + "sentence says is happening, and the answer is watering. That makes it a verb this time.")),
  key: (it) => [want.text(JOBS[it.j].name)],
  answer: (it) => [`${it.s[it.i]} — ${JOBS[it.j].name}${it.note ? ` (${it.note})` : `: ${JOBS[it.j].how}`}`],
};

/* ═══ find one doing that job ══════════════════════════════════════════════*/

const grFind = {
  id: "gr-parts-find",
  group: "gr-parts",
  label: "Find one doing that job",
  blurb: "The other way round: here is the job, which word has it?",
  heading: "Find the word doing that job",
  minLevel: "middle",
  instruction: () =>
    "Now the other way about. You are told the job; copy out a word from the sentence that is doing it. There may " +
    "be more than one right answer, and any of them will do — what is being asked is whether you can SEE the job " +
    "being done, not whether you can guess which word was meant.",
  cols: 1,
  defaultCount: 6,
  make: (r, o, _k, i) => ({ ...deal(r, bankFor(tier(o)), i) }),
  /* `anOf`, not "a": the jobs include adjective, adverb and an interjection,
     and a page that asks for "a adjective" is teaching the wrong thing on
     the way to teaching the right one */
  render: (it) => ask(`${it.s.join(" ")} &nbsp;&nbsp; ${anOf(JOBS[it.j].name)}: ${box()}`),
  worked: () => worked(
    ask(`The cat sat under the table &nbsp;&nbsp; a preposition: <u>under</u>`)
    + say("A preposition puts a thing somewhere. Under is what puts the cat in its place against the table — so "
      + "under is the one.")),
  /* The stored word is always right; so is any other word of that job in the
     same sentence, which is why only the stored one is keyed and the key's
     note says so. One word, correctly chosen, is the whole of the answer. */
  key: (it) => [want.text(it.s[it.i])],
  answer: (it) => [`${JOBS[it.j].name}: ${it.s[it.i]} (another word doing the same job is also right)`],
};

export const GR_EXERCISES = [grName, grFind];
