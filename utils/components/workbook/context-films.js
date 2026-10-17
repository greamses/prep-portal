/* ============================================================================
   CONTEXT CLUES, in five films — IDEAS
   ----------------------------------------------------------------------------
   A child meeting a word they do not know has two choices: stop, or work it
   out from the sentence it is standing in. The second is a skill and it can
   be taught — and these are the five ways a sentence tells you, one film
   each, in the order that spells the word:

     I  inference   nothing says it; only one meaning makes the sentence work
     D  definition  the sentence says what it means, straight out
     E  example     you are given examples, and the kind shows
     A  antonym     you are given the opposite, with a contrast word
     S  synonym     another word beside it means the same

   THE FILM READS THE BANK THE PAGE READS. Every sentence, the word it is
   about, the words that give it away and WHY they do are in
   /data/english/context.js, so a film cannot teach a different clue from the
   one the exercise under it is about, and nobody has to write the lesson
   twice. What is written here is only the teaching around them.

   They are built with the kit the bar films use (./film-kit.js). The drawing
   in these is a SENTENCE: the hard word is picked out of it, the clue is in
   a span of its own, and pointing means lighting that span where it stands.
   ========================================================================== */

import { film, runLit } from "./film-kit.js";
import { esc } from "./video-kit.js";
import { IDEAS, bankFor, plainOf } from "/data/english/context.js";

/* where things stand on the screen */
const SENT_X = 4, SENT_Y = 19, SENT_W = 52;
/* the same mark the printed page puts on the word a question is about
   (.en-pick in english.css): underlined as well as bold, and underlined
   rather than bordered so the rule hugs the word instead of sitting at the
   foot of the whole line */
const MARK = "text-decoration:underline;text-decoration-thickness:0.08em;text-underline-offset:0.2em";
const LIST_X = 60;

/**
 * The sentence, dressed for the screen: the hard word picked out, and the
 * words that give it away in a span the film can light.
 *
 * Escaped FIRST and marked up after, which is the only order that is safe —
 * the other way round and the markup is escaped along with the words.
 */
function dress(it) {
  const plain = esc(plainOf(it.s));
  const clue = esc(it.clue);
  const word = esc(it.word);
  let out = plain.replace(clue, `<span data-k="clue">${clue}</span>`);
  const re = new RegExp(`(^|[^\\w])(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})([^\\w]|$)`);
  /* UNDERLINED AS WELL AS BOLD, which is what the printed page does to the
     same word (.en-pick): the screen font has no heavier face to go to, so
     bold alone does not mark anything out. */
  out = out.replace(re, (m, a, w, b) => `${a}<b data-k="word" style="${MARK}">${w}</b>${b}`);
  return out;
}

/** The five, listed down the side of every one of these films. */
const listLines = (here) => IDEAS.map((k, i) => ({
  id: `r${i}`,
  text: `${k.id} · ${k.name}`,
  x: LIST_X,
  y: 9 + i * 6.6,
  c: k.id === here ? 2 : 1,
  size: 2.2,
}));

/**
 * ONE FILM, for one kind of clue, working two sentences through.
 *
 * The frame is the same for all five on purpose: a child who has watched the
 * definition one should recognise the shape of the antonym one and have
 * attention left over for what is different about it. What differs is the
 * rule, the signal words, and what the clue is DOING — and those come from
 * the kind itself.
 */
function ctxFilm(kind, talk) {
  const k = IDEAS.find((x) => x.key === kind);
  const one = bankFor(kind, "gentle")[0];
  const two = bankFor(kind, "middle")[0];
  return film({
    asks: [
      { id: "a1", html: true, text: `What does <b style="${MARK}">${esc(one.word)}</b> mean here?` },
      { id: "a2", html: true, text: `What does <b style="${MARK}">${esc(two.word)}</b> mean here?` },
    ],
    lines: [
      ...listLines(k.id),
      { id: "g1", text: k.hint, x: LIST_X, y: 44, c: 3, size: 2, w: 36 },
      { id: "s1", html: true, text: dress(one), x: SENT_X, y: SENT_Y, c: 0, size: 2.4, w: SENT_W },
      { id: "s2", html: true, text: dress(two), x: SENT_X, y: SENT_Y, c: 0, size: 2.4, w: SENT_W },
      { id: "m1", text: `${one.word} = ${one.mean[0]}`, x: SENT_X, y: 38, c: 2, size: 2.5, w: SENT_W },
      { id: "m2", text: `${two.word} = ${two.mean[0]}`, x: SENT_X, y: 38, c: 2, size: 2.5, w: SENT_W },
    ],
    steps: ({ push, look }) => {
      /* THE WHOLE OF IDEAS STANDS THERE from the first word, with today's
         letter picked out of it. A child should see where this one film sits
         among the five every time they watch one — that is what makes five
         films a set rather than five films. */
      push(talk.open, { on: [...IDEAS.map((_, i) => `r${i}`), "g1"],
        look: look.tile(`r${IDEAS.indexOf(k)}`), lookAt: { lit: true, delay: 1.4, hold: 2.4 } });

      push(`Here is the first one. Read the whole sentence before you do anything else — all of it, `
        + `including the part after the word, because that is where the answer usually is. The word in bold `
        + `is ${one.word}, and you are not expected to know it. Nobody is.`,
        { on: ["a1", "s1"], look: look.said("s1", "word"), lookAt: { delay: 2.2, hold: 2.2, to: 1.3 } });

      push(`${talk.spot} Here they are: ${esc(one.clue)}. Underline them — actually underline them, with a `
        + `pencil, because the underlining is the thinking and you will not do it in your head.`,
        { look: look.said("s1", "clue"), lookAt: { lit: true, delay: 1.2, hold: 3.0 } });

      push(`So what must ${one.word} mean? ${cap(one.why)}. It means ${one.mean[0]} — and say it in your own `
        + `words like that, not by reading the clue back. If the only way you can say it is the way the `
        + `sentence said it, you have copied it rather than understood it.`,
        { on: ["m1"], look: look.tile("m1"), lookAt: { delay: 1.8, hold: 2.2, to: 1.25 } });

      push(`Another one, and this time you go first. Read it, find the words that give it away, and have your `
        + `answer ready before I say anything. The word is ${two.word}.`,
        { on: ["a2", "s2"], off: ["a1", "s1", "m1"],
          look: look.said("s2", "word"), lookAt: { delay: 2.4, hold: 2.0, to: 1.3 } });

      push(`${talk.spot2} ${esc(two.clue)}. ${cap(two.why)} — so ${two.word} means ${two.mean[0]}. Check `
        + `your own answer against that one: not word for word, but is it the same idea? That is the only `
        + `test that matters here.`,
        { on: ["m2"], look: look.said("s2", "clue"), lookAt: { lit: true, delay: 1.0, hold: 2.8 } });

      push(talk.close, { on: IDEAS.map((_, i) => `r${i}`),
        play: (S, H, stage) => runLit(H, stage, IDEAS.map((_, i) => `r${i}`), 0.3, 1.0) });
    },
  });
}

const cap = (t) => String(t).charAt(0).toUpperCase() + String(t).slice(1);

/* ═══ I · INFERENCE ════════════════════════════════════════════════════════*/

export const ctxInference = () => ctxFilm("inference", {
  open: "There are five ways a sentence can tell you what a hard word means, and they spell the word IDEAS. "
    + "This film is the I, and it is the hardest of the five, so we will do it first and the rest will feel "
    + "easy. INFERENCE means the sentence never says it. Nothing is defined, nothing is repeated — but only "
    + "one meaning makes the rest of the sentence sensible, and you work backwards to it.",
  spot: "Now, there is no word here that means the same and nothing after a comma telling you. So ask the "
    + "question that always works: what would have to be true for the REST of this sentence to make sense?",
  spot2: "Same question, and the answer is in what actually happens:",
  close: "So: inference. Nothing says it, and you work it out from what the sentence takes for granted. Ask "
    + "what would have to be true, and be willing to be roughly right — close is a real answer here, and "
    + "stopping is not. The other four kinds hand it to you more plainly, and they are next.",
});

/* ═══ D · DEFINITION ═══════════════════════════════════════════════════════*/

export const ctxDefinition = () => ctxFilm("definition", {
  open: "The D in IDEAS, and it is the kindest of the five, because the writer has decided to tell you "
    + "outright. A DEFINITION clue means the meaning is sitting in the sentence in plain words — usually "
    + "straight after the hard word, and usually fenced off by a comma, a dash, a colon, or one of the little "
    + "signposts: is, means, which means, that is.",
  spot: "Look at what comes straight after the word. That is where a writer puts a definition, and this writer "
    + "has done exactly that.",
  spot2: "Again, read on past the word and the writer hands it to you:",
  close: "So: definition. Read PAST the hard word rather than stopping at it — that is the whole trick, and "
    + "the reason people miss these is that they stop. Watch for a comma, a dash, a colon, and for the words "
    + "is, means, which means and that is. When you see one of those, the meaning is already on the page.",
});

/* ═══ E · EXAMPLE ══════════════════════════════════════════════════════════*/

export const ctxExample = () => ctxFilm("example", {
  open: "The E in IDEAS: EXAMPLE clues. Here the writer does not tell you what the word means — they show "
    + "you two or three of the thing, and leave you to see what the examples have in common. The signposts are "
    + "such as, for example, like, including, or just a colon and a list.",
  spot: "So look for the list, and then ask the question that does the work: what do all of these have in "
    + "common? Not what each one is — what they SHARE.",
  spot2: "Find the list first, then ask what the examples have in common:",
  close: "So: example. The list is the clue, and the meaning is whatever the things in it share. Careful with "
    + "the word LIKE — it brings examples here, but it can also be a comparison, so read it both ways and "
    + "keep the one that makes sense. And your answer should cover every example, not just the first.",
});

/* ═══ A · ANTONYM ══════════════════════════════════════════════════════════*/

export const ctxAntonym = () => ctxFilm("antonym", {
  open: "The A in IDEAS: ANTONYM clues, and this is the one that catches people out, because the sentence "
    + "tells you the OPPOSITE of what you want. There is always a warning word with it — but, unlike, "
    + "whereas, instead of, rather than, though — and that word is telling you to turn the meaning round.",
  spot: "Find the contrast word first. It is the hinge the sentence turns on, and everything after it is the "
    + "other side of the word you want.",
  spot2: "Find the hinge, then take the other side of it:",
  close: "So: antonym. Find the contrast word, see what is on the far side of it, and then say the opposite of "
    + "THAT. The mistake is to read the opposite and write it down as the meaning — so after you answer, "
    + "put your meaning back into the sentence and check that the contrast still makes sense.",
});

/* ═══ S · SYNONYM ══════════════════════════════════════════════════════════*/

export const ctxSynonym = () => ctxFilm("synonym", {
  open: "The S in IDEAS: SYNONYM clues. The writer has used a hard word and then, in case you did not have "
    + "it, put an easier word beside it that means the same thing. Watch for or, in other words, that is to "
    + "say, also called — or simply a second word dropped in next to the first with a comma or a dash.",
  spot: "So look right beside the word, before it and after it, for something that is doing the same job in "
    + "easier clothes.",
  spot2: "Look beside the word again for its easier twin:",
  close: "So: synonym. The meaning is sitting next to the word in plainer language, and the little word OR is "
    + "the commonest signpost in English for it. One warning: a synonym is close, not exact. Use it to get the "
    + "sense, and then say the meaning in your own words rather than swapping one hard word for another.",
});
