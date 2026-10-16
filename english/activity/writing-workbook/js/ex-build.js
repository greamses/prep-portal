/* ============================================================================
   Writing Workbook — CHAPTER 1: BUILDING ONE SENTENCE ON PURPOSE
   ----------------------------------------------------------------------------
   A child cannot write a paragraph until they can build a sentence on
   purpose, and the fastest way to find out whether they can is to hand them
   the words in the wrong order.

   It is not a word puzzle. In English the ORDER IS THE GRAMMAR: who did what
   to whom, and then where, and then when. There are no endings on our nouns
   to say which is doing and which is being done to, so the only thing holding
   "the dog bit the man" apart from "the man bit the dog" is where the words
   stand. A child who can order six words is using subject-verb-object
   without having to be told its name.

   The jumble is MADE HERE from the page's own seed, not stored — so the same
   workbook code gives the same page and a different code gives another, and
   nobody has to hand-write a shuffle that might accidentally be the answer.

   The second exercise is the one that matters more: a sentence with its
   punctuation stripped off, to be written out properly. Capital letter, the
   stops in the middle, full stop at the end.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { levelOf, line, ask, say, worked, dealer } from "../../shared/levels.js";
import { bankFor } from "/data/english/sentences.js";

const tier = (o) => levelOf(o).id;
const deal = dealer();

/* The sentence as loose words, in an order that is NOT the right one — a
   shuffle that happened to come out right would be a question with nothing
   in it. */
function jumble(r, words) {
  const right = words.join(" ");
  for (let tries = 0; tries < 12; tries += 1) {
    const mixed = r.shuffle(words.slice());
    if (mixed.join(" ") !== right) return mixed;
  }
  /* a two-word sentence, or a run of bad luck: turn it round by hand */
  return words.slice().reverse();
}

const tile = (w) => `<span class="en-tile">${w}</span>`;

export const WR_GROUPS = [
  {
    id: "wr-build",
    chapter: "Chapter 1 · Building a sentence",
    label: "Building one sentence",
    blurb: "Words in the right order, and the punctuation that finishes them.",
  },
];

/* ═══ put the words in order ═══════════════════════════════════════════════*/

const wrOrder = {
  id: "wr-build-order",
  group: "wr-build",
  label: "Put the words in order",
  blurb: "The same words, standing in the right places.",
  heading: "Put the words in order",
  instruction: () =>
    "In English the order of the words IS the grammar. Nothing on the end of a word tells you which one is doing " +
    "and which is being done to — only where it stands does, which is why “the dog bit the man” and “the man bit " +
    "the dog” are made of the same words and mean opposite things. Write these out as one sentence that says " +
    "something. Start with who or what the sentence is about, then what they did, then the rest. Capital letter " +
    "at the front and a full stop at the end.",
  cols: 1,
  defaultCount: 6,
  make(r, o, _k, i) {
    const it = deal(r, bankFor(tier(o)), i);
    const words = it.t.split(" ");
    /* shown lower case, so the capital letter is not a clue to what goes first */
    const shown = words.map((w, k) => (k === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w));
    return { ...it, mixed: jumble(r, shown) };
  },
  render: (it) => ask(`${it.mixed.map(tile).join(" ")}<br>${line()}`),
  worked: () => worked(
    ask(`${["ball", "the", "kicked", "boy", "the"].map(tile).join(" ")}<br><u>The boy kicked the ball.</u>`)
    + say("Start with who the sentence is about — the boy. Then what he did — kicked. Then what he did it to — "
      + "the ball. Capital letter on the front, full stop on the end, and it is a sentence.")),
  key: (it) => [want.text(it.t, `${it.t}.`, ...(it.also ? [it.also, `${it.also}.`] : []))],
  answer: (it) => [`${it.t}.${it.why ? ` — ${it.why}` : ""}${it.also ? ` (also right: ${it.also}.)` : ""}`],
};

/* ═══ and punctuate it ═════════════════════════════════════════════════════*/

const wrPunct = {
  id: "wr-build-punct",
  group: "wr-build",
  label: "Write it out properly",
  blurb: "The words are right; the capital letters and stops are missing.",
  heading: "Write it out properly",
  minLevel: "middle",
  instruction: () =>
    "These sentences are in the right order already, but nothing has been punctuated. Copy each one out with a " +
    "capital letter at the beginning, a full stop at the end, and any commas it needs in between. A part that " +
    "begins with a joining word — although, before, after — and comes FIRST takes a comma after it, to show the " +
    "reader where the main part starts.",
  cols: 1,
  defaultCount: 5,
  make(r, o, _k, i) {
    const it = deal(r, bankFor(tier(o)), i);
    return { ...it, bare: it.t.toLowerCase() };
  },
  render: (it) => ask(`<span class="en-bare">${it.bare}</span><br>${line()}`),
  worked: () => worked(
    ask(`<span class="en-bare">although it was raining the match continued</span><br>`
      + `<u>Although it was raining, the match continued.</u>`)
    + say("The although part comes first, so a comma goes where it ends — that comma is what tells the reader the "
      + "real sentence is starting. Capital A at the front, full stop at the end.")),
  /* `free`: the comma is a judgement in some of these, and a page that marks
     a correct sentence wrong over one comma teaches the child to distrust it.
     The key prints the sentence punctuated, which is what they check against. */
  key: () => [want.free()],
  answer: (it) => [`${it.t}.${it.why ? ` — ${it.why}` : ""}`],
};

export const WR_EXERCISES = [wrOrder, wrPunct];
