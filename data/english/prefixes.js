/* ============================================================================
   Vocabulary — the bank for OPPOSITES MADE WITH A PREFIX
   ----------------------------------------------------------------------------
   English makes most of its opposites by putting something on the FRONT of a
   word, and which something is not a matter of taste: it is fixed per word,
   and the commonest mistake in the language's spelling is picking the wrong
   one (*unpossible, *displace for "misplace").

   There are rules of thumb and they are worth teaching:
     im-   before p, b and m          possible → impossible, polite → impolite
     il-   before l                   legal → illegal, logical → illogical
     ir-   before r                   regular → irregular, responsible → irresponsible
     in-   before most others         visible → invisible, correct → incorrect
     un-   the all-purpose one        happy → unhappy, kind → unkind
     dis-  often with verbs and with
           words about agreeing       agree → disagree, honest → dishonest
     non-  "not one of those"         fiction → non-fiction, sense → nonsense

   But the rules only ever narrow the choice — "un-" and "in-" both sit in
   front of consonants, and only one of them is right for any given word. So
   every entry stores its own prefix and its own meaning; nothing here is
   worked out from a rule, because the words that break the rules are exactly
   the words worth asking about.

     { w: the word, p: the prefix, o: the opposite, m: what the opposite means }
   ========================================================================== */

export const PREFIXES = {
  un: { id: "un", of: "un-", how: "the all-purpose one: it goes in front of more words than any other" },
  in: { id: "in", of: "in-", how: "before most consonants and vowels — but never before p, b, m, l or r" },
  im: { id: "im", of: "im-", how: "before p, b and m, because in- is hard to say there: say “inpossible” and you will hear it" },
  il: { id: "il", of: "il-", how: "before l" },
  ir: { id: "ir", of: "ir-", how: "before r" },
  dis: { id: "dis", of: "dis-", how: "often on verbs, and on words about agreeing or trusting" },
  mis: { id: "mis", of: "mis-", how: "not “not”, but WRONGLY: misread is read wrongly, not unread" },
  non: { id: "non", of: "non-", how: "“not one of those”: it says what a thing is not, rather than undoing it" },
};

export const EASY = [
  { w: "happy", p: "un", o: "unhappy", m: "sad" },
  { w: "kind", p: "un", o: "unkind", m: "not kind to people" },
  { w: "tidy", p: "un", o: "untidy", m: "in a mess" },
  { w: "safe", p: "un", o: "unsafe", m: "not safe" },
  { w: "fair", p: "un", o: "unfair", m: "not fair" },
  { w: "lucky", p: "un", o: "unlucky", m: "having bad luck" },
  { w: "able", p: "un", o: "unable", m: "not able to" },
  { w: "like", p: "dis", o: "dislike", m: "not to like" },
  { w: "obey", p: "dis", o: "disobey", m: "not to do as you are told" },
  { w: "agree", p: "dis", o: "disagree", m: "to think the opposite" },
  { w: "correct", p: "in", o: "incorrect", m: "wrong" },
  { w: "polite", p: "im", o: "impolite", m: "rude" },
];

export const MEDIUM = [
  { w: "possible", p: "im", o: "impossible", m: "cannot be done" },
  { w: "patient", p: "im", o: "impatient", m: "not willing to wait" },
  { w: "perfect", p: "im", o: "imperfect", m: "having a fault" },
  { w: "mortal", p: "im", o: "immortal", m: "never dying" },
  { w: "balance", p: "im", o: "imbalance", m: "an unevenness" },
  { w: "legal", p: "il", o: "illegal", m: "against the law" },
  { w: "legible", p: "il", o: "illegible", m: "impossible to read" },
  { w: "regular", p: "ir", o: "irregular", m: "not following the usual pattern" },
  { w: "relevant", p: "ir", o: "irrelevant", m: "nothing to do with it" },
  { w: "visible", p: "in", o: "invisible", m: "cannot be seen" },
  { w: "complete", p: "in", o: "incomplete", m: "not finished" },
  { w: "formal", p: "in", o: "informal", m: "relaxed, not official" },
  { w: "honest", p: "dis", o: "dishonest", m: "not truthful" },
  { w: "appear", p: "dis", o: "disappear", m: "to go out of sight" },
  { w: "read", p: "mis", o: "misread", m: "to read it wrongly" },
  { w: "understand", p: "mis", o: "misunderstand", m: "to take it the wrong way" },
  { w: "fiction", p: "non", o: "non-fiction", m: "writing about things that are true" },
];

/* The ones where the rule of thumb points the wrong way, or two prefixes look
   equally likely. Every entry here is a word a thoughtful child gets wrong. */
export const HARD = [
  { w: "responsible", p: "ir", o: "irresponsible", m: "not to be trusted with it" },
  { w: "replaceable", p: "ir", o: "irreplaceable", m: "could never be replaced" },
  { w: "literate", p: "il", o: "illiterate", m: "unable to read or write" },
  { w: "logical", p: "il", o: "illogical", m: "not making sense" },
  { w: "mature", p: "im", o: "immature", m: "not grown up" },
  { w: "movable", p: "im", o: "immovable", m: "cannot be shifted" },
  { w: "convenient", p: "in", o: "inconvenient", m: "awkward, at a bad time" },
  { w: "sufficient", p: "in", o: "insufficient", m: "not enough" },
  { w: "dependent", p: "in", o: "independent", m: "not needing anyone else" },
  { w: "accurate", p: "in", o: "inaccurate", m: "not exactly right" },
  { w: "satisfied", p: "dis", o: "dissatisfied", m: "not pleased with it",
    note: "dis- on a word that already starts with s: both s's are written" },
  { w: "similar", p: "dis", o: "dissimilar", m: "not alike", note: "two s's again" },
  { w: "approve", p: "dis", o: "disapprove", m: "to think it wrong" },
  { w: "lead", p: "mis", o: "mislead", m: "to give someone the wrong idea",
    note: "not unlead — mis- is WRONGLY, not NOT" },
  { w: "judge", p: "mis", o: "misjudge", m: "to judge it wrongly", note: "wrongly, not not-at-all" },
  { w: "sense", p: "non", o: "nonsense", m: "something with no meaning in it" },
  { w: "flammable", p: "non", o: "non-flammable", m: "will not catch fire",
    note: "inflammable does NOT mean this — it means the very opposite, which is why the word was given up on" },
];

export const bankFor = (tier) =>
  (tier === "stretch" ? [...HARD, ...MEDIUM]
    : tier === "middle" ? [...MEDIUM, ...EASY]
      : EASY);
