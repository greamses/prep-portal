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
   twice.

   EVERY ONE OF THEM ENDS ITS EXAMPLES THE SAME WAY: the word is struck out,
   the meaning is written over the top of it, and the sentence is read again
   to see whether it still fits. *"That's our test to check if we are
   correct."* It is the only check a child can make on their own, and it is
   the difference between having an answer and knowing it is right.

   WHAT NO TWO OF THEM SHARE IS THEIR WORDS. These five are watched one after
   another, and a sentence heard in the last film reads as filler in this
   one — so every step is written for the film that owns it, and
   `scratchpad/echoes.mjs` is what holds them to that.
   ========================================================================== */

import { film, runLit } from "./film-kit.js";
import { esc } from "./video-kit.js";
import { IDEAS, bankFor, plainOf } from "/data/english/context.js";

/* where things stand on the screen */
const SENT_X = 4, SENT_Y = 19, SENT_W = 52;
const LIST_X = 60;
/* the colour a clue is underlined in: the same orange the fraction films cut
   with, because it means the same thing in both — this is the mark we have
   just made, and it is what tells you */
const CLUE = "#d9632b";
const INK = "#2a2723";
/* the same mark the printed page puts on the word a question is about
   (.en-pick in english.css) */
const MARK = "text-decoration:underline;text-decoration-thickness:0.08em;text-underline-offset:0.2em";

/**
 * The sentence, dressed for the screen: the hard word picked out, the words
 * that give it away in a span the film can underline, and — waiting above the
 * word, hidden — the meaning that will be written over the top of it.
 *
 * Escaped FIRST and marked up after, which is the only order that is safe.
 */
function dress(it) {
  const plain = esc(plainOf(it.s));
  const clue = esc(it.clue);
  const word = esc(it.word);
  let out = plain.replace(clue, `<span data-k="clue">${clue}</span>`);
  const re = new RegExp(`(^|[^\\w])(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})([^\\w]|$)`);
  out = out.replace(re, (m, a, w, b) => `${a}<span data-k="slot" style="position:relative">`
    + `<b data-k="word" style="${MARK}">${w}</b>`
    + `<span data-k="swap" style="position:absolute;left:50%;bottom:118%;transform:translateX(-50%);`
    + `white-space:normal;max-width:24ch;width:max-content;text-align:center;line-height:1.1;`
    + `color:${CLUE};font-weight:800;opacity:0">${esc(it.mean[0])}</span>`
    + `</span>${b}`);
  return out;
}

/**
 * STRIKE THE WORD OUT AND WRITE THE MEANING OVER THE TOP.
 *
 * The replacement hangs over the word it replaces, which is where a child
 * would write it — but a long meaning over a word near the end of a line
 * reaches out of the sentence column and into the list of five letters
 * beside it. So it is measured and pulled back by however much it overhangs,
 * which keeps it over its word wherever it can and never on top of anything
 * else.
 */
function writeOver(stage, id, H) {
  const word = stage.querySelector(`[data-t="${id}"] [data-k="word"]`);
  const swap = stage.querySelector(`[data-t="${id}"] [data-k="swap"]`);
  H.cross(word, INK, 0.3);
  H.write(swap, 0.9);
  if (!swap) return;
  swap.style.transform = "translateX(-50%)";
  const tv = stage.querySelector(".vm-tv");
  if (!tv) return;
  const room = tv.getBoundingClientRect();
  const over = swap.getBoundingClientRect().right - (room.left + room.width * (SENT_X + SENT_W) / 100);
  if (over > 0) swap.style.transform = `translateX(calc(-50% - ${Math.ceil(over)}px))`;
}

/** The sentence as it reads once the meaning is written over the word. */
const swapped = (it) => plainOf(it.s).replace(it.word, it.mean[0]);

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
 * The SHAPE is the same for all five — the rule, a sentence, underline the
 * clue, say the meaning, test it by substitution, then the same again with
 * the child going first — because a shape learned once is attention left
 * over for what is different about this one. The WORDS are not shared: every
 * line of talk comes in from the film that owns it.
 */
function ctxFilm(kind, one, two, talk) {
  const k = IDEAS.find((x) => x.key === kind);
  const all = IDEAS.map((_, i) => `r${i}`);
  const at = (id, part) => (stage) => stage.querySelector(`[data-t="${id}"] [data-k="${part}"]`);
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
    /* THE MARKS ARE STAGES, not looks. A look lights something up and drops
       it two seconds later; a stage is replayed under every step that
       follows, so the underline stays under the clue and the struck-out word
       stays struck out for as long as the example is on the screen. */
    stages: {
      "u.one": (s, H, stage) => H.underline(at("s1", "clue")(stage), CLUE, 0.5),
      "u.two": (s, H, stage) => H.underline(at("s2", "clue")(stage), CLUE, 0.5),
      "t.one": (s, H, stage) => writeOver(stage, "s1", H),
      "t.two": (s, H, stage) => writeOver(stage, "s2", H),
    },
    steps: ({ push, look }) => {
      push(talk.open, { on: [...all, "g1"],
        look: look.tile(`r${IDEAS.indexOf(k)}`), lookAt: { lit: true, delay: 1.6, hold: 2.6 } });

      push(talk.read, { on: ["a1", "s1"],
        look: look.said("s1", "word"), lookAt: { delay: 2.8, hold: 2.2, to: 1.3 } });

      push(talk.mark, { add: ["u.one"] });

      push(talk.mean, { on: ["m1"], look: look.tile("m1"), lookAt: { delay: 2.4, hold: 2.0, to: 1.25 } });

      push(talk.test, { add: ["t.one"],
        look: look.said("s1", "swap"), lookAt: { lit: true, delay: 2.0, hold: 2.6 } });

      push(talk.over, { on: ["a2", "s2"], off: ["a1", "s1", "m1"],
        look: look.said("s2", "word"), lookAt: { delay: 3.0, hold: 2.0, to: 1.3 } });

      push(talk.back, { on: ["m2"], add: ["u.two"],
        look: look.tile("m2"), lookAt: { delay: 3.2, hold: 2.0, to: 1.25 } });

      push(talk.test2, { add: ["t.two"],
        look: look.said("s2", "swap"), lookAt: { lit: true, delay: 1.8, hold: 2.4 } });

      push(talk.close, { on: all, play: (S, H, stage) => runLit(H, stage, all, 0.3, 1.0) });
    },
  });
}

const first = (kind) => bankFor(kind, "gentle")[0];
const next = (kind) => bankFor(kind, "middle")[0];

/* ═══ I · INFERENCE ════════════════════════════════════════════════════════*/

export function ctxInference() {
  const a = first("inference"), b = next("inference");
  return ctxFilm("inference", a, b, {
    open: "There are five ways a sentence can tell you what a hard word means, and they spell the word "
      + "IDEAS. Once you have all five you will stop being stuck on words, which is worth more than any "
      + "list of words anybody could hand you. We start with the I, and I will be honest with you: it is "
      + "the hardest of the five. INFERENCE means the sentence never actually says it. Nothing is "
      + "defined, nothing is repeated, nobody helps you — and yet only one meaning makes the rest of it "
      + "sensible.",
    read: `So. Ada, a bus, and a word you may never have met: ${a.word}. Do not stare at it, and do not `
      + `try to guess from the look of it — guessing from the look of a word is how children decide `
      + `${a.word} is something to do with wearing. Read right on to the full stop instead. Everything `
      + `you need is in what Ada DOES, and that comes after the word, not before it.`,
    mark: `Here is the question that cracks every inference clue: what would have to be TRUE for this to `
      + `make sense? Ada ${a.clue}. Nobody does that. You cannot do that unless you are past caring about `
      + `anything — so I am putting orange under it, and leaving it there, because that half of the `
      + `sentence is doing all the work. Mark it on your own page too, in whatever you have got.`,
    mean: `Nobody sleeps upright on their feet unless they are completely worn out. So ${a.word} has to `
      + `mean something very close to ${a.mean[0]}. And notice what I did NOT do. I did not know the word `
      + `and then understand the sentence. I understood the sentence, and the word fell out of it. That `
      + `feels backwards the first few times, and it is the right way round.`,
    test: `Now the test, and I want this one done every single time. Cross the hard word out — gone — and `
      + `write your meaning over the top of it. Then read the whole thing again: "${swapped(a)}" Does it `
      + `fit? It does. If it had come out clumsy, or said something the story does not say, I would know `
      + `my meaning was wrong and I would go back to the orange and think again.`,
    over: `Your turn, and I am going to stay quiet. Rain, a path, and some porters: your word is `
      + `${b.word}. There is no definition in this one either, so do not go hunting for one. Find the `
      + `part that tells you what happened, underline it, and get a meaning ready. Then cross out and `
      + `write over the top, exactly as I did. Take your time; I will wait.`,
    back: `Here is what gives it away: ${b.clue}. People do not fall over on a safe path. Something about `
      + `it, after the rain, made going down likely — so ${b.word} must mean about ${b.mean[0]}. If you `
      + `wrote slippery you have understood it. If you wrote wet, you have described the rain rather than `
      + `the path, and the path is what the word is about.`,
    test2: `Cross it out, write yours above, and listen: "${swapped(b)}" That holds together. And notice `
      + `how forgiving this is — dangerous, risky, unsafe, treacherous, every one of them passes, and `
      + `every one would get the mark, because what is being tested is whether the sentence still says `
      + `what it was saying.`,
    close: "So: inference. Nothing says it, and you work backwards from what the sentence takes for "
      + "granted. Ask what would have to be true, underline the part that answers you, cross out, write "
      + "over, read it back. Be willing to be roughly right — close IS a real answer with this kind. The "
      + "only real mistake is deciding you cannot do it and leaving the line empty. The other four hand "
      + "it to you far more plainly than this, and they are next.",
  });
}

/* ═══ D · DEFINITION ═══════════════════════════════════════════════════════*/

export function ctxDefinition() {
  const a = first("definition"), b = next("definition");
  return ctxFilm("definition", a, b, {
    open: "The D in IDEAS, and after that last film you have earned it, because this is the kindest of "
      + "the five. A DEFINITION clue is a writer deciding to tell you outright. The meaning sits there in "
      + "plain words, nearly always just after the hard word, fenced off by a comma, a dash, a colon or a "
      + "pair of brackets. There are signposts as well: is, means, which means, that is. Four little "
      + "phrases, and half of this kind is done for you before you start.",
    read: `Teeth, grinding, and the word ${a.word}. Now, I happen to know this one — but pretend with me `
      + `that I do not, because what matters here is the habit, and the habit is this: when a word stops `
      + `you, keep going. Do not halt at the word. The writer has put something in this sentence `
      + `especially for people who do not know it, and it is only a few letters further on.`,
    mark: `And there it is, straight after the comma: ${a.clue}. That is not extra information, that is a `
      + `definition wearing a comma for a coat. Orange goes under it and the orange stays. A writer who `
      + `does this has leaned over and whispered you the answer — and the only way on earth to miss it `
      + `is to stop reading at the hard word, which, I promise you, is what most people do.`,
    mean: `So ${a.word} means ${a.mean[0]}. Say that back in your OWN words rather than copying the comma `
      + `part out letter for letter — a plant eater will do nicely, and so will an animal that does not `
      + `eat meat. If you copy it exactly you have proved that you can copy, and copying was never the `
      + `thing being tested.`,
    test: `Test it the usual way. A line through the hard word, your meaning standing over it, and read `
      + `the whole thing: "${swapped(a)}" Still sensible. And that is a definition clue behaving `
      + `properly — the sentence `
      + `should read almost the same afterwards, because the writer was describing the very same thing `
      + `both times.`,
    over: `Right, you go. A letter, somebody's handwriting, and the word ${b.word}. You know the drill `
      + `now: read past it, find the comma or the dash, pick up the plain words. Then strike it through, write `
      + `over, read it back to yourself. There is nothing new to learn in this one — only the doing of `
      + `it, which is the part that makes it yours.`,
    back: `After the dash: ${b.clue}. The writer has even told you where the pen goes. So ${b.word} means `
      + `${b.mean[0]}, and I would happily take joined handwriting, or writing where the letters run into `
      + `each other, or anything that shows me you pictured the page.`,
    test2: `Word struck through, meaning on top, read the lot: "${swapped(b)}" Good. One thing worth noticing before we leave this `
      + `kind: the definition came after a DASH this time and after a comma the time before. The `
      + `punctuation changes from sentence to sentence; the trick never does. Look just past the word.`,
    close: "So: definition. Read PAST the hard word instead of stopping dead at it — that is the whole of "
      + "this kind, and stopping is the only reason anybody ever fails it. Watch for the comma, the dash, "
      + "the colon, and for is, means, which means, that is. Then put it in your own words, and test it "
      + "by substitution like we just did. The next kind is almost as generous, except that it makes you "
      + "take the last step yourself.",
  });
}

/* ═══ E · EXAMPLE ══════════════════════════════════════════════════════════*/

export function ctxExample() {
  const a = first("example"), b = next("example");
  return ctxFilm("example", a, b, {
    open: "E, for EXAMPLE clues, and this one works differently. The writer does not tell you what the "
      + "word means — they show you two or three of the thing and leave the last step to you. That is "
      + "more work than a definition and it sticks far better, because the bit you work out yourself is "
      + "the bit you remember next week. The signposts are such as, for example, like, including, or "
      + "simply a colon with a list marching off behind it.",
    read: `Somebody is telling you what to bring to school, and the word is ${a.word}. Before you worry `
      + `about the word at all, look at the SHAPE of the sentence: there is a dash, and then a list. That `
      + `list is not decoration and it is not the writer being chatty. It is there for you, and it is `
      + `about to do the explaining.`,
    mark: `${a.clue}. Four things, in orange, staying put. Now do not go asking what each one is — you `
      + `know perfectly well what a pencil is. Ask the only question a list like this answers: what have `
      + `all four got in COMMON? Run your eye along them and find the one thing that is true of every `
      + `single one of them.`,
    mean: `Pens, pencils, a ruler, a rubber. Every one of them lives in a pencil case; every one is `
      + `something you write or draw with. So ${a.word} is ${a.mean[0]}. See how the list did the work of `
      + `a definition without a definition being anywhere in sight — and you did the last bit of it.`,
    test: `Strike the word out, write yours above it, and read the lot back: "${swapped(a)}" That works. `
      + `And here is the check that catches a lazy answer with this kind — does your meaning cover the `
      + `RULER? If you had written "things you write with" and stopped there, the ruler is left standing `
      + `with nothing to do, and your meaning is too narrow by one item.`,
    over: `Now you. A museum, some old things, and the word ${b.word}. Find the list — it is signposted `
      + `this time, so that part is easy — then ask what the things in it share. Be careful: they are not `
      + `all made of the same stuff and they were not all used for the same job, so what you want is `
      + `something more general than either of those.`,
    back: `${b.clue}. Pots, tools, stools. Not one of them grew on a tree or fell out of the sky — `
      + `somebody MADE each one, by hand, a long time ago. So ${b.word} means ${b.mean[0]}, and that `
      + `covers all three, which is exactly the test of a good answer with an example clue.`,
    test2: `Word out, meaning in: "${swapped(b)}" It holds. And notice that I had to hunt for something `
      + `the three had in common that was not obvious — clay, iron and wood have nothing in common as `
      + `materials at all. It was how they came to exist that mattered, not what they are made of.`,
    close: "So: example. The list is the clue, and the meaning is whatever everything in it shares. Two "
      + "warnings and we are done. One: the word LIKE brings examples here, but it can also be a "
      + "comparison, so read it both ways and keep the one that makes sense. Two, and this is the one "
      + "that costs marks — your meaning has to cover EVERY example, not just the first. Next comes the "
      + "kind that helps you by saying the reverse of the thing you are after.",
  });
}

/* ═══ A · ANTONYM ══════════════════════════════════════════════════════════*/

export function ctxAntonym() {
  const a = first("antonym"), b = next("antonym");
  return ctxFilm("antonym", a, b, {
    open: "A, for ANTONYM clues — and sit up for this one, because it is the kind that catches people "
      + "out. Here the sentence helps you by telling you the OPPOSITE of what you want. If you are not "
      + "paying attention you will read that opposite, write it down, and be exactly wrong. There is "
      + "always a warning word: but, unlike, whereas, instead of, rather than, though, far from. Treat it "
      + "as the sentence saying, careful, I am about to turn round.",
    read: `A brother, a sister, and the money they are given. Your word is ${a.word}. Before you think `
      + `about what it means, find the warning word — it is a short one, sitting in the middle of the `
      + `sentence. Have you got it? BUT. Everything after a but is about to go the other way from `
      + `everything before it.`,
    mark: `${a.clue}. Orange, and it stays there. Now read that part carefully, because it is a `
      + `description of the SISTER, not of the brother. She keeps nothing at all. Whatever she is, the `
      + `but is telling us the brother is the other thing — and the brother is the one we were asked `
      + `about in the first place.`,
    mean: `The sister spends every naira. The opposite of spending everything is keeping some of it, `
      + `looking after it, not letting it go. So ${a.word} means ${a.mean[0]}. Two steps, and you need `
      + `both of them: find what is on the far side of the but, and then flip it over.`,
    test: `Rub the word out, put yours in its place, and listen: "${swapped(a)}" Hear how that sits — careful with `
      + `money, BUT she spends every naira. The contrast still works, and that is how you know you `
      + `flipped it the right way. If you had written "spends a lot, but my sister spends every naira", `
      + `the but would have nothing left to do, and your own ear would tell you.`,
    over: `Your go. Two speakers, a meeting, and the word ${b.word}. Same two steps as before: find the `
      + `hinge, see what is on the far side of it, take the opposite. And when you have your answer, say `
      + `the whole sentence out loud with the but still in it. That is the quickest check there is, and `
      + `it takes about four seconds.`,
    back: `${b.clue}. Forty minutes to say the same thing — that is the far side of the hinge, so our `
      + `word has to be the opposite of it: short, few words, soon finished. ${b.mean[0]}. A speaker who `
      + `is ${b.word} says the thing and then sits down.`,
    test2: `Out, over, read: "${swapped(b)}" Hear the contrast land. If you wrote long-winded, you did `
      + `the first step and forgot the second, and you are in a great deal of company — that is the `
      + `single commonest way to lose this mark, which is precisely why we test every answer by putting `
      + `it back in.`,
    close: "So: antonym. Find the contrast word, look at what is on the far side of it, then say the "
      + "opposite of THAT. People only ever do the first half — they read the opposite, write it down, "
      + "and lose the mark with all the right words in the wrong order. So put your meaning back into "
      + "the sentence and read it with the but still in. If the contrast stops making sense, you have "
      + "written down the opposite of what you meant. One kind left, and it is the friendliest of all.",
  });
}

/* ═══ S · SYNONYM ══════════════════════════════════════════════════════════*/

export function ctxSynonym() {
  const a = first("synonym"), b = next("synonym");
  return ctxFilm("synonym", a, b, {
    open: "S, and the last of the five: SYNONYM clues. A writer uses a hard word and then, in case you "
      + "have not met it, drops an easier one right beside it that means the same thing. Once you start "
      + "noticing this you will see it everywhere — in textbooks especially, where somebody is trying to "
      + "teach you the hard word on purpose. Watch for or, in other words, that is to say, also called, "
      + "or simply a second word set down next to the first.",
    read: `An old man, and the word ${a.word}. This sentence is about to be very kind to you, so let me `
      + `tell you what to do with your eyes. Do not go looking away down the line for help. Look at what `
      + `is sitting immediately beside the word — a word or two either side of it, no further. That is `
      + `where a synonym lives.`,
    mark: `There: ${a.clue}. One small word, orange, staying put. The writer has used ${a.word} and then, `
      + `almost in the same breath, said it again in a word that everybody knows. They are not repeating `
      + `themselves by accident. They are translating for you, and it costs you nothing to accept.`,
    mean: `So ${a.word} means ${a.mean[0]}. And I would go a little further than the single word: he is `
      + `so weak that he cannot get up without a hand, which is weaker than merely tired. Take the easy `
      + `twin as your starting point, and then let the rest of the sentence sharpen it for you.`,
    test: `Strike it out, write over the top, read: "${swapped(a)}" Fine. Though listen to what we lost `
      + `doing that — the sentence has gone a little flatter. That is what a hard word is FOR: it carries `
      + `something extra, and the easy word beside it is a door into it rather than a replacement for it.`,
    over: `Last one, and it is yours. A market, and the word ${b.word}. Look either side of it for the `
      + `easier twin, underline what you find, then swap your meaning in and hear whether it fits. You have done this four `
      + `times now. It should be starting to feel like a routine rather than a puzzle, and that is `
      + `exactly what it ought to become.`,
    back: `${b.clue}, straight after the dash. So ${b.word} means ${b.mean[0]} — full of people, full of `
      + `movement, the sort of place where you cannot hear yourself think. Both of the easy words were `
      + `handed to you there, and the two together say more than either would on its own.`,
    test2: `Out it goes, in goes yours: "${swapped(b)}" Good. And one small warning before the end: a `
      + `synonym is CLOSE, not exact. Busy is close to ${b.word}, but it is not the same word, or English `
      + `would not have gone to the trouble of keeping both of them.`,
    close: "So: synonym. The meaning is standing next to the word in plainer language, and the little "
      + "word OR is the commonest signpost in English for it. Use it to get the sense — and then say the "
      + "meaning in your own words, because swapping one hard word for another hard word is not "
      + "understanding, it is only moving the problem along a bit. And that is all five: Inference, "
      + "Definition, Example, Antonym, Synonym. IDEAS — and now you have every one of them.",
  });
}
