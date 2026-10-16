/* ============================================================================
   Writing — the bank for BUILDING A SENTENCE
   ----------------------------------------------------------------------------
   Before a child can write a paragraph they have to be able to build one
   sentence on purpose, and the quickest way to find out whether they can is
   to hand them the words in the wrong order and see what they do.

   It is not a puzzle. English word order is the grammar: WHO did WHAT to
   WHOM, and then where and when. A child who can put six words in order is
   using subject-verb-object without being told its name, and a child who
   cannot will write sentences nobody can follow however good their spelling.

   Each entry stores the sentence as it should come out, and nothing else —
   the jumble is made at build time from the page's own seed, so the same
   workbook code gives the same jumble and a different code gives another.

     { t: the sentence, why: what its order is showing }

   WHERE THE EXTRAS GO is the part worth teaching: an adverb of time can sit
   at either end ("Yesterday we walked home" / "We walked home yesterday")
   but not in the middle, and that is why some of these have `also`, a second
   order that is equally right.
   ========================================================================== */

const S = (t, why = "", also = null) => ({ t, why, also });

export const EASY = [
  S("The boy kicked the ball", "who · did what · to what"),
  S("My sister closed the door", "who · did what · to what"),
  S("A dog chased the cat", "who · did what · to what"),
  S("The teacher opened the window", "who · did what · to what"),
  S("Birds build their nests", "who · did what · to what"),
  S("We ate rice and beans", "the two things joined by and stay together"),
  S("The baby is sleeping", "who · what they are doing"),
  S("Rain fell all night", "who · did what · for how long"),
];

export const MEDIUM = [
  S("The farmer carried a heavy basket", "the adjective sits in FRONT of its noun: a heavy basket, never a basket heavy"),
  S("Our neighbour painted his gate blue", "what the gate was painted comes after the thing painted"),
  S("She found her keys under the chair", "where it happened comes after what happened"),
  S("The children walked home quietly", "how they walked goes at the end",
    "The children quietly walked home"),
  S("Yesterday we visited my grandmother", "when it happened may go at the FRONT",
    "We visited my grandmother yesterday"),
  S("He washed the plates before dinner", "when it happened, at the end this time"),
  S("The bus stopped at the market", "where, after what happened"),
  S("My brother reads a book every evening", "how often, at the end"),
];

export const HARD = [
  S("Although it was raining the match continued",
    "the joining word starts the part it belongs to: although begins the raining half, not the match half"),
  S("The old man who lives next door keeps bees",
    "who lives next door tells you WHICH man, so it sits right beside man and nothing comes between"),
  S("Before the sun rose the fishermen had already left",
    "the earlier thing is told first, and had left says it happened before the sunrise",
    "The fishermen had already left before the sun rose"),
  S("She gave her younger brother the last mango",
    "two things after the verb: WHO gets it, then WHAT they get"),
  S("The letter was written by my aunt",
    "the thing it happened TO comes first here, and by says who did it"),
  S("Neither the driver nor the passengers were hurt",
    "neither and nor belong to the two things they are weighing up, one each"),
  S("After we had eaten we washed the plates",
    "when it happened as a whole half-sentence of its own, at the front",
    "We washed the plates after we had eaten"),
  S("The parcel that arrived this morning is for you",
    "that arrived this morning says which parcel, so it stays next to parcel"),
];

export const bankFor = (tier) =>
  (tier === "stretch" ? [...HARD, ...MEDIUM]
    : tier === "middle" ? [...MEDIUM, ...EASY]
      : EASY);
