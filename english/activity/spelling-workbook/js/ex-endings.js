/* ============================================================================
   Spelling Workbook — CHAPTER 1: ADDING -ING AND -ED
   ----------------------------------------------------------------------------
   The first spelling rule worth having, because it is four rules that look
   like one and a child who has not sorted them out spells "hoping" when they
   mean "hopping".

     nothing changes      jump  → jumping, jumped
     drop the e           hope  → hoping,  hoped
     double the letter    hop   → hopping, hopped
     y becomes i          carry → carrying, carried   (only for -ed)

   WHAT THE PAGE ASKS is the word, not the rule's name — because a child who
   can say "double the last letter" and still writes "hoping" has learnt the
   label and not the spelling. The rule is given back in the answer key, where
   it explains the mark rather than being the mark.

   The bank lives in /data/english/spelling.js, and every word there carries
   its own two answers. Nothing here applies a rule to a word to find out how
   it is spelt: a rule applied in code would be wrong in exactly the places
   children go wrong, which are the places this chapter is for.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { levelOf, box, ask, say, worked, dealer, pick } from "../../shared/levels.js";
import { RULES, bankFor } from "/data/english/spelling.js";

const tier = (o) => levelOf(o).id;

export const SP_GROUPS = [
  {
    id: "sp-endings",
    chapter: "Chapter 1 · Adding an ending",
    label: "Adding -ing and -ed",
    blurb: "Four rules that look like one: jumping, hoping, hopping, carried.",
  },
];

/* ═══ add the ending ═══════════════════════════════════════════════════════*/

const deal = dealer();

const spEndings = {
  id: "sp-endings-add",
  group: "sp-endings",
  label: "Add the ending",
  blurb: "Write the word with -ing, and again with -ed.",
  heading: "Adding -ing and -ed",
  instruction: () =>
    "Four things can happen when an ending goes on a word. MOST of the time nothing changes at all — jump becomes " +
    "jumping and jumped. If the word ends in a silent e, DROP the e: hope becomes hoping and hoped. If it is a " +
    "short word ending in one vowel and one consonant, DOUBLE that last letter: hop becomes hopping and hopped — " +
    "and that doubled p is the whole difference between hoping and hopping. If it ends in y after a consonant, the " +
    "y turns into an i for -ed but KEEPS the y for -ing: carry becomes carrying and carried.",
  cols: 2,
  defaultCount: 8,
  make(r, o, _k, i) {
    return { ...deal(r, bankFor(tier(o)), i) };
  },
  /* Only the endings the word really takes: a few of these are irregular in
     the past (ran, not runned), and asking for "runned" would be teaching a
     mistake in order to mark it wrong. */
  /* each ending and its box are ONE thing: in two columns the box was
     wrapping onto the next line and leaving "+ -ed =" stranded above it */
  render: (it) => ask(`<span class="en-pair"><b class="en-word">${it.w}</b> + -ing = ${box()}</span>`
    + (it.ed ? ` <span class="en-pair">+ -ed = ${box()}</span>`
      : ` <span class="en-note">(-ed: not this one)</span>`)),
  worked: () => worked(
    ask(`<b class="en-word">hop</b> + -ing = <u>hopping</u> &nbsp;&nbsp;&nbsp; + -ed = <u>hopped</u>`)
    + say("hop is a short word ending in one vowel and one consonant, so the p is written twice before the ending "
      + "goes on. Leave it out and you have written hoping, which is a different word altogether.")),
  key: (it) => (it.ed ? [want.text(it.ing), want.text(it.ed)] : [want.text(it.ing)]),
  answer: (it) => [`${it.w} → ${it.ing}${it.ed ? `, ${it.ed}` : ""} — ${RULES[it.rule].name}${it.why ? ` (${it.why})` : ""}`],
};

/* ═══ which rule? ══════════════════════════════════════════════════════════
   Worth asking ONCE the spelling is in the hand, never before: naming the
   rule is a way of noticing what you already did, not a way of deciding. */

const spWhich = {
  id: "sp-endings-why",
  group: "sp-endings",
  label: "Which rule was it?",
  blurb: "Write the word, then say what happened to it.",
  heading: "Which rule was it?",
  minLevel: "middle",
  instruction: () =>
    "Here the ending is already on. Write what the word was BEFORE the ending went on, and then say in your own " +
    "words what happened to it: nothing, dropped the e, doubled the last letter, or the y became an i.",
  cols: 1,
  defaultCount: 6,
  make(r, o, _k, i) {
    const bank = bankFor(tier(o)).filter((x) => x.rule !== "just" || tier(o) === "stretch");
    const w = deal(r, bank.length ? bank : bankFor(tier(o)), i);
    const ending = w.ed && r.int(0, 1) ? "ed" : "ing";
    return { shown: ending === "ed" ? w.ed : w.ing, w: w.w, rule: w.rule, why: w.why || "" };
  },
  render: (it) => ask(`${pick(it.shown)} — the word was ${box()} and the rule was ${box()}`),
  worked: () => worked(
    ask(`${pick("smiling")} — the word was <u>smile</u> and the rule was <u>drop the e</u>`)
    + say("Put the ending back and you can hear the word: smil-ing. It cannot be smil, so the e was taken off "
      + "before the -ing went on.")),
  key: (it) => [want.text(it.w), want.text(RULES[it.rule].name, RULES[it.rule].id)],
  answer: (it) => [`${it.shown} ← ${it.w}: ${RULES[it.rule].name}${it.why ? ` (${it.why})` : ""}`],
};

export const SP_EXERCISES = [spEndings, spWhich];
