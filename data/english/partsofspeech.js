/* ============================================================================
   Grammar — the bank for NAMING THE JOB OF A WORD
   ----------------------------------------------------------------------------
   A part of speech is not a label a word carries about with it. It is the JOB
   the word is doing in the sentence it is in, and the same word does different
   jobs in different sentences:

       We will  WATER  the garden.     — verb
       She drank the   WATER.          — noun
       The      WATER  bottle is full. — adjective (it tells you which bottle)

   So a sentence here is stored with the word picked out BY POSITION and the
   job it is doing in THAT sentence. Nothing is looked up in a dictionary of
   word-to-part, because such a dictionary is the misunderstanding this
   chapter exists to undo.

     { s: the sentence as words, i: which word is asked about, j: its job }

   The eight jobs, in the order children meet them:
     noun · verb · adjective · adverb · pronoun · preposition · conjunction ·
     determiner
   ========================================================================== */

export const JOBS = {
  noun: { id: "noun", name: "noun", how: "a person, a place, a thing or an idea — something you could put “the” in front of" },
  verb: { id: "verb", name: "verb", how: "what someone or something DOES, or IS" },
  adjective: { id: "adjective", name: "adjective", how: "it tells you more about a noun: which one, what kind, how many" },
  adverb: { id: "adverb", name: "adverb", how: "it tells you more about a verb: how, when, where" },
  pronoun: { id: "pronoun", name: "pronoun", how: "it stands in for a noun so you need not say it twice" },
  preposition: { id: "preposition", name: "preposition", how: "it puts a thing somewhere, in place or in time: in, on, under, before" },
  conjunction: { id: "conjunction", name: "conjunction", how: "it joins: and, but, because, although" },
  determiner: { id: "determiner", name: "determiner", how: "it points a noun out: the, a, this, my, some" },
};

const S = (text, i, j, note = "") => ({ s: text.split(" "), i, j, note });

/* Gentle: short sentences, and the word is doing its most ordinary job. */
export const EASY = [
  S("The dog barked at the gate", 1, "noun"),
  S("My sister reads every night", 2, "verb"),
  S("A cold wind blew all day", 1, "adjective"),
  S("She sang beautifully", 2, "adverb"),
  S("He dropped the plate", 0, "pronoun"),
  S("The cat sat under the table", 3, "preposition"),
  S("I was tired but happy", 3, "conjunction"),
  S("The boys ran home", 0, "determiner"),
  S("Our teacher wrote on the board", 1, "noun"),
  S("The baby cried loudly", 3, "adverb"),
  S("Peter kicked the heavy ball", 3, "adjective"),
  S("Birds build nests in spring", 1, "verb"),
];

/* Middle: longer sentences, and the job is not the first one you would guess. */
export const MEDIUM = [
  S("The old bridge over the river is closed", 3, "preposition"),
  S("We waited quietly because the baby was asleep", 4, "conjunction"),
  S("Amina carefully lifted the kettle", 1, "adverb"),
  S("Those mangoes are sweeter than these", 0, "determiner"),
  S("The rain stopped and the sun returned", 3, "conjunction"),
  S("He gave his brother the smaller piece", 2, "determiner", "his points the noun out — it is a determiner here, not a pronoun"),
  S("Everybody enjoyed the long journey home", 0, "pronoun", "everybody stands in for people without naming them"),
  S("The market opens early on Saturdays", 4, "preposition"),
  S("She is the fastest runner in our school", 3, "adjective"),
  S("They climbed the hill slowly", 4, "adverb"),
  S("A loud crash came from the kitchen", 2, "noun", "crash is a thing that happened — the verb in this sentence is came"),
  S("The students were reading quietly", 3, "verb", "were reading is the verb; reading is its main part"),
];

/* Stretch: the same word doing a different job, which is the whole idea. */
export const HARD = [
  S("We will water the garden tonight", 2, "verb", "water is the DOING word here"),
  S("She drank the water quickly", 3, "noun", "the same word, now a thing"),
  S("The water bottle is empty", 1, "adjective", "and now it tells you which bottle"),
  S("The light was fading fast", 1, "noun"),
  S("Please light the lamp", 1, "verb"),
  S("She carried a light bag", 3, "adjective"),
  S("He ran past the shop", 2, "preposition", "past puts the running somewhere"),
  S("We talked about the past", 4, "noun", "the same word, now a thing: times gone by"),
  S("I have not seen him since Monday", 5, "preposition"),
  S("She has been quiet since she arrived", 4, "conjunction", "here since joins two whole sentences, so it is a conjunction"),
  S("That book is mine", 3, "pronoun", "mine stands alone in place of a noun — compare my book, where my is a determiner"),
  S("That is the house we visited", 0, "pronoun", "that stands in for the house itself"),
  S("That house is ours", 0, "determiner", "the same word, now pointing a noun out"),
  S("The fast runner finished first", 1, "adjective"),
  S("Do not run so fast", 4, "adverb", "the same word, now telling you how"),
  S("He will only stay a while", 2, "adverb"),
  S("The only answer is to try again", 1, "adjective"),
];

export const bankFor = (tier) =>
  (tier === "stretch" ? [...HARD, ...MEDIUM]
    : tier === "middle" ? [...MEDIUM, ...EASY]
      : EASY);
