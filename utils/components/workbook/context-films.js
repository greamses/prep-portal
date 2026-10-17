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
/* the colour a clue is underlined in: the same orange the fraction films
   cut with, because it means the same thing in both — this is the mark we
   have just made, and it is what tells you */
const CLUE = "#d9632b";
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
 * rule, the signal words, what the clue is DOING and what people get wrong —
 * and those come from the kind itself.
 */
function ctxFilm(kind, talk) {
  const k = IDEAS.find((x) => x.key === kind);
  const one = bankFor(kind, "gentle")[0];
  const two = bankFor(kind, "middle")[0];
  const all = IDEAS.map((_, i) => `r${i}`);
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
    /* THE UNDERLINING IS A STAGE, not a look. A look lights a mark up and
       drops it again two seconds later; a stage is replayed under every step
       that follows, so the rule stays under the clue for as long as the
       example is on the screen — which is the whole time the child is
       working on it. */
    stages: {
      "u.one": (s, H, stage) => H.underline(stage.querySelector('[data-t="s1"] [data-k="clue"]'), CLUE, 0.5),
      "u.two": (s, H, stage) => H.underline(stage.querySelector('[data-t="s2"] [data-k="clue"]'), CLUE, 0.5),
    },
    steps: ({ push, look }) => {
      /* THE WHOLE OF IDEAS STANDS THERE from the first word, with today's
         letter picked out of it. A child should see where this one film sits
         among the five every time they watch one — that is what makes five
         films a set rather than five films. */
      push(talk.open, { on: [...all, "g1"],
        look: look.tile(`r${IDEAS.indexOf(k)}`), lookAt: { lit: true, delay: 1.6, hold: 2.6 } });

      push(`Here is the first one, and before anything else: read ALL of it. Not up to the hard word and then `
        + `stop, which is what most people do — the whole sentence, including the part after it, because that `
        + `is nearly always where the help is hiding. The word in bold is ${one.word}. Say it out loud once, `
        + `even if it feels silly, and then leave it alone for a moment. ${talk.meet}`,
        { on: ["a1", "s1"], look: look.said("s1", "word"), lookAt: { delay: 3.0, hold: 2.2, to: 1.3 } });

      push(`${talk.spot} Watch what I am underlining: ${esc(one.clue)}. In orange, and it stays there — a `
        + `different colour from the word, because it is doing a different job. The word is the problem; the `
        + `orange is the answer, sitting in the same sentence all along. Now do it on your own page, with a `
        + `pencil, properly. The underlining IS the thinking, and if you keep it in your head you will skip it `
        + `and guess, and guessing is how people end up certain of the wrong meaning.`,
        { add: ["u.one"] });

      push(`So what must ${one.word} mean? ${cap(one.why)}. Which gives us: ${one.mean[0]}. Now say that in `
        + `your OWN words — do not read the orange back at me. Here is the test, and it is a good one: put `
        + `your meaning into the sentence in place of the word, and read the whole thing again. Does it still `
        + `make sense? Then you have it, and you have it without a dictionary, which is the point.`,
        { on: ["m1"], look: look.tile("m1"), lookAt: { delay: 2.4, hold: 2.2, to: 1.25 } });

      push(`Right — your turn, and I am going to keep quiet for a bit. New sentence, same five moves: read the `
        + `whole thing, find the words that give it away, underline them, and have your answer ready before I `
        + `say a word. The one in bold is ${two.word}. ${talk.wait} Take your time. I will still be here.`,
        { on: ["a2", "s2"], off: ["a1", "s1", "m1"],
          look: look.said("s2", "word"), lookAt: { delay: 3.2, hold: 2.0, to: 1.3 } });

      push(`${talk.spot2} ${esc(two.clue)} — underlined, same orange, and it stays. ${cap(two.why)}, so `
        + `${two.word} means ${two.mean[0]}. Now hold that against what you wrote. Not word for word — nobody `
        + `is marking your phrasing — but is it the same IDEA? If it is, you have just read a word you had `
        + `never met, which is a thing you can now do whenever you need to.`,
        { on: ["m2"], add: ["u.two"],
          look: look.tile("m2"), lookAt: { delay: 3.4, hold: 2.0, to: 1.25 } });

      push(talk.close, { on: all,
        play: (S, H, stage) => runLit(H, stage, all, 0.3, 1.0) });
    },
  });
}

const cap = (t) => String(t).charAt(0).toUpperCase() + String(t).slice(1);

/* ═══ I · INFERENCE ════════════════════════════════════════════════════════*/

export const ctxInference = () => ctxFilm("inference", {
  open: "There are five ways a sentence can tell you what a hard word means, and they spell the word IDEAS. "
    + "You are going to meet all five, and once you have them you will stop being stuck on words — which is "
    + "worth more than any list of words anybody could give you. This film is the I, and I am going to be "
    + "honest with you: it is the hardest of the five. INFERENCE means the sentence never actually says it. "
    + "Nothing is defined, nothing is repeated, nobody helps you. But only one meaning makes the rest of the "
    + "sentence sensible, and you work backwards to it.",
  meet: "You are not supposed to know it. Nobody is. That is not the test.",
  spot: "Now, there is no word here that means the same, and nothing after a comma telling you. So we ask the "
    + "question that always works for this kind: what would have to be TRUE for the rest of this sentence to "
    + "make sense? Look at what actually happens in it — what somebody does, or what the result is.",
  wait: "There is no definition in it. Look at what happens instead.",
  spot2: "Same question, and the answer is in what actually happens:",
  close: "So: inference. Nothing says it, and you work it out from what the sentence takes for granted. Ask "
    + "what would have to be true. Be willing to be roughly right — close IS a real answer here, and a child "
    + "who writes tired for weary has understood the sentence, which is what was being asked. The mistake is "
    + "to decide you cannot do it and leave the line blank. The other four kinds hand it to you far more "
    + "plainly than this one, and they are next.",
});

/* ═══ D · DEFINITION ═══════════════════════════════════════════════════════*/

export const ctxDefinition = () => ctxFilm("definition", {
  open: "The D in IDEAS, and it is the kindest of the five, because the writer has decided to tell you "
    + "outright. A DEFINITION clue means the meaning is sitting in the sentence in plain words — usually "
    + "straight after the hard word, and usually fenced off by a comma, a dash, a colon or brackets. There "
    + "are signposts too, little words that nearly always mean a definition is coming: is, means, which "
    + "means, that is. Learn those four and half of this kind is done for you.",
  meet: "And I will tell you now: this sentence is about to explain itself.",
  spot: "So look at what comes straight AFTER the word. That is where a writer puts a definition, nine times "
    + "out of ten, and this writer has done exactly that.",
  wait: "Read past it rather than stopping at it. The explanation is right there.",
  spot2: "Again, read on past the word, and the writer hands it to you:",
  close: "So: definition. Read PAST the hard word instead of stopping at it — that is the whole trick, and "
    + "the reason people miss these is that they stop dead at the word and never see the help two words "
    + "later. Watch for a comma, a dash, a colon, and for is, means, which means and that is. One warning: "
    + "do not copy the definition out word for word and call it your answer. Say it back in your own words, "
    + "or you have only proved you can copy.",
});

/* ═══ E · EXAMPLE ══════════════════════════════════════════════════════════*/

export const ctxExample = () => ctxFilm("example", {
  open: "The E in IDEAS: EXAMPLE clues. Here the writer does not tell you what the word means — they show "
    + "you two or three of the thing and leave you to work out what kind of thing it is. It is a little more "
    + "work than a definition and it sticks far better, because you did the last step yourself. The "
    + "signposts are such as, for example, like, including — or just a colon and a list.",
  meet: "Notice there is a list coming. That list is not decoration; it is the clue.",
  spot: "So find the list first, and then ask the question that does all the work: what do these things have "
    + "in COMMON? Not what each one is separately — what they share.",
  wait: "Find the list, then ask what the things in it share.",
  spot2: "Find the list, then ask what the examples have in common:",
  close: "So: example. The list is the clue, and the meaning is whatever the things in it share. Two "
    + "warnings. The first is the word LIKE: it brings examples here, but it can also mean a comparison, so "
    + "read it both ways and keep the one that makes sense. The second is bigger — your meaning has to cover "
    + "EVERY example, not just the first one. If you say stationery means pens, you have explained the pens "
    + "and left the ruler standing there with nothing to do.",
});

/* ═══ A · ANTONYM ══════════════════════════════════════════════════════════*/

export const ctxAntonym = () => ctxFilm("antonym", {
  open: "The A in IDEAS: ANTONYM clues — and this is the one that catches people out, so sit up. Here the "
    + "sentence tells you the OPPOSITE of what you want, and if you are not paying attention you will write "
    + "that opposite down as your answer and be exactly wrong. There is always a warning word with it: but, "
    + "unlike, whereas, instead of, rather than, though, far from. That word is the sentence saying: careful, "
    + "I am about to turn round.",
  meet: "And listen for a contrast word, because there is one coming.",
  spot: "Find the contrast word first — it is the hinge the whole sentence turns on. Everything on the far "
    + "side of it is the OTHER side of the word you want, so whatever you find there, you will be taking the "
    + "opposite of it.",
  wait: "Find the hinge word first, then look at what is on the far side of it.",
  spot2: "Find the hinge, then take the other side of it:",
  close: "So: antonym. Find the contrast word, see what is on the far side of it, and then say the opposite "
    + "of THAT. Two steps, and people only ever do the first one — they read the opposite, write it down, and "
    + "lose the mark with the right words in the wrong order. So after you answer, put your meaning back into "
    + "the sentence and read it with the but still in it. If the contrast no longer makes sense, you have "
    + "written down the opposite of what you meant.",
});

/* ═══ S · SYNONYM ══════════════════════════════════════════════════════════*/

export const ctxSynonym = () => ctxFilm("synonym", {
  open: "The S in IDEAS: SYNONYM clues, and the last of the five. The writer has used a hard word and then, "
    + "in case you did not have it, dropped an easier word beside it that means the same thing. Writers do "
    + "this constantly once you start noticing it. Watch for or, in other words, that is to say, also "
    + "called — or simply a second word set down next to the first with a comma or a dash between them.",
  meet: "There is an easier word standing right beside it. Go and find it.",
  spot: "So look RIGHT BESIDE the word — before it and after it, within a few words either way — for "
    + "something that is doing the same job in easier clothes.",
  wait: "Look either side of it for its easier twin.",
  spot2: "Look beside the word again, and there it is:",
  close: "So: synonym. The meaning is sitting next to the word in plainer language, and the little word OR "
    + "is the commonest signpost in English for it. One warning, and it matters: a synonym is close, not "
    + "exact. Use it to get the sense and then say the meaning in your own words — swapping one hard word "
    + "for another hard word is not understanding, it is just moving the problem along. And that is all five: "
    + "Inference, Definition, Example, Antonym, Synonym. IDEAS.",
});
