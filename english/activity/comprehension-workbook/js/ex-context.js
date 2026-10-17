/* ============================================================================
   Comprehension Workbook — CHAPTER 2: CONTEXT CLUES (IDEAS)
   ----------------------------------------------------------------------------
   A child meeting a word they do not know has two choices: stop, or work it
   out from the sentence it is standing in. The second is a skill, it can be
   taught, and it is almost never taught — a dictionary is handed over
   instead, which answers this question and teaches nothing about the next
   one.

   Five sections, one per kind of clue, in the order that spells the word:

     I  Inference   nothing says it; only one meaning makes the sentence work
     D  Definition  the sentence says what it means, straight out
     E  Example     you are given examples, and the kind shows
     A  Antonym     you are given the opposite, with a contrast word
     S  Synonym     another word beside it means the same

   WHAT IS MARKED IS THE MEANING, because that is what can be marked exactly.
   The clue words are what the child underlines, and the key prints them, so
   that self-marking sends them back to the place they should have looked
   rather than just telling them the answer. That is the rule the rest of
   this workbook follows too (ex-read.js) and the reason it can be printed
   at all.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { levelOf, box, ask, say, worked, dealer } from "../../shared/levels.js";
import { lessonStrip } from "/utils/components/workbook/tv-lessons.js";
import { IDEAS, KIND_OF, bankFor, marked } from "/data/english/context.js";

const tier = (o) => levelOf(o).id;

export const CM_CTX_GROUPS = IDEAS.map((k, i) => ({
  id: `cm-ctx-${k.id.toLowerCase()}`,
  ...(i === 0 ? { chapter: "Chapter 2 · Context clues: IDEAS" } : {}),
  label: `${k.id} · ${k.name} clues`,
  blurb: k.how,
}));

/* The strip that opens each section on the TV. One film per clue, because
   one film for all five would be five lessons in one — and a child after the
   antonym one should not have to sit through the other four. */
const FILM = {
  I: ["ctx-inference", "Inference clues"],
  D: ["ctx-definition", "Definition clues"],
  E: ["ctx-example", "Example clues"],
  A: ["ctx-antonym", "Antonym clues"],
  S: ["ctx-synonym", "Synonym clues"],
};

const deal = dealer();

/** One section: the same shape for all five, with its own bank and words. */
function section(k) {
  const id = `cm-ctx-${k.id.toLowerCase()}`;
  return {
    id: `${id}-find`,
    group: id,
    video: () => lessonStrip(FILM[k.id][0], FILM[k.id][1]),
    label: `What does it mean? (${k.name.toLowerCase()})`,
    blurb: `${k.hint}`,
    heading: `${k.id} · ${k.name}: work the word out`,
    instruction: () =>
      `Every sentence below has one word in bold that you are not expected to know. Do NOT guess it, and do not `
      + `skip it: the sentence is telling you, and the way it tells you here is ${k.name.toLowerCase()}. `
      + `${k.how} ${k.hint} So read the whole sentence first, UNDERLINE the words that give it away, and then `
      + `write what the bold word means in your own words. Your own words matter — if you can only say it back `
      + `the way the sentence did, you have copied rather than understood.`,
    cols: 1,
    defaultCount: 4,
    make: (r, o, _k, i) => deal(r, bankFor(k.key, tier(o)), i),
    render: (it) => ask(`${marked(it.s)}<br><span class="en-from">means</span> ${box()}`),
    worked: (o) => {
      const one = bankFor(k.key, tier(o || {}))[0];
      return worked(
        ask(`${marked(one.s)}<br><span class="en-from">means</span> <u>${one.mean[0]}</u>`)
        + say(`The words that give it away are <b class="en-pick">${one.clue}</b> — ${one.why}. `
          + `Underline those first, every time, and the meaning follows from them. Notice that nobody looked `
          + `the word up: the sentence had already said it.`));
    },
    /* ONE place to a question, and it is the meaning. The clue words are
       underlined on the page and printed in the key, because no page can
       mark an underlining — but a child can see at once whether they
       underlined the right thing. */
    key: (it) => [want.text(...it.mean)],
    answer: (it) => [`${it.word}: ${it.mean[0]} — the clue is "${it.clue}" (${it.why})`],
  };
}

export const CM_CTX_EXERCISES = IDEAS.map(section);

/** The five, named, for anything that wants to list them. */
export const CTX_FILMS = IDEAS.map((k) => ({ ...k, film: FILM[k.id] }));
export { KIND_OF };
