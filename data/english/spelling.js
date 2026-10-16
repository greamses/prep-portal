/* ============================================================================
   Spelling — the bank for ADDING AN ENDING
   ----------------------------------------------------------------------------
   Every word here is a VERB, because -ing and -ed are what verbs take, and
   each one is filed under the rule its spelling obeys when the ending goes on.
   The rule is stored, not worked out, so the answer key and the exercise can
   never disagree about which rule a word is in — and a word that sits on the
   boundary of two rules is a deliberate entry rather than an accident.

     just      nothing changes:          jump   → jumping,   jumped
     drop      drop the silent e:        hope   → hoping,    hoped
     double    double the last letter:   hop    → hopping,   hopped
     ytoi      y after a consonant:      carry  → carrying,  carried
                                         (the -ing keeps the y; only -ed changes it)

   THE DOUBLING RULE, which is the one children lose marks on: double the
   last letter when the word ends consonant-vowel-consonant AND the last
   syllable is the stressed one. So hop → hopping, but open → opening. Words
   ending in w, x or y never double (snow → snowing).

   Each entry carries its own answers rather than a rule to re-apply:
     { w, ing, ed, rule, why }
   ========================================================================== */

export const RULES = {
  just: { id: "just", name: "nothing changes", how: "The word is already finished — just add the ending." },
  drop: { id: "drop", name: "drop the e", how: "The word ends in a silent e: take the e off, then add the ending." },
  double: { id: "double", name: "double the last letter", how: "Short word, one vowel, one consonant at the end: write that last letter twice, then add the ending." },
  ytoi: { id: "ytoi", name: "y becomes i", how: "A y after a consonant turns into an i for -ed — but -ing keeps the y, because two i's never meet." },
};

/* Gentle: one syllable, the rule plain. */
export const EASY = [
  { w: "jump", ing: "jumping", ed: "jumped", rule: "just" },
  { w: "walk", ing: "walking", ed: "walked", rule: "just" },
  { w: "play", ing: "playing", ed: "played", rule: "just" },
  { w: "help", ing: "helping", ed: "helped", rule: "just" },
  { w: "paint", ing: "painting", ed: "painted", rule: "just" },
  { w: "climb", ing: "climbing", ed: "climbed", rule: "just" },
  { w: "hope", ing: "hoping", ed: "hoped", rule: "drop" },
  { w: "bake", ing: "baking", ed: "baked", rule: "drop" },
  { w: "smile", ing: "smiling", ed: "smiled", rule: "drop" },
  { w: "move", ing: "moving", ed: "moved", rule: "drop" },
  { w: "hop", ing: "hopping", ed: "hopped", rule: "double" },
  { w: "stop", ing: "stopping", ed: "stopped", rule: "double" },
  { w: "run", ing: "running", ed: null, rule: "double", why: "ran, not runned — this one does not take -ed at all" },
  { w: "clap", ing: "clapping", ed: "clapped", rule: "double" },
  { w: "dig", ing: "digging", ed: null, rule: "double", why: "dug, not digged" },
  { w: "cry", ing: "crying", ed: "cried", rule: "ytoi" },
  { w: "try", ing: "trying", ed: "tried", rule: "ytoi" },
  { w: "dry", ing: "drying", ed: "dried", rule: "ytoi" },
];

/* Middle: two syllables, and the pairs that look alike and are not. */
export const MEDIUM = [
  { w: "shout", ing: "shouting", ed: "shouted", rule: "just" },
  { w: "answer", ing: "answering", ed: "answered", rule: "just" },
  { w: "listen", ing: "listening", ed: "listened", rule: "just" },
  { w: "gather", ing: "gathering", ed: "gathered", rule: "just" },
  { w: "invite", ing: "inviting", ed: "invited", rule: "drop" },
  { w: "decide", ing: "deciding", ed: "decided", rule: "drop" },
  { w: "arrive", ing: "arriving", ed: "arrived", rule: "drop" },
  { w: "measure", ing: "measuring", ed: "measured", rule: "drop" },
  { w: "escape", ing: "escaping", ed: "escaped", rule: "drop" },
  { w: "permit", ing: "permitting", ed: "permitted", rule: "double" },
  { w: "forget", ing: "forgetting", ed: null, rule: "double", why: "forgot, not forgetted" },
  { w: "begin", ing: "beginning", ed: null, rule: "double", why: "began, not beginned" },
  { w: "prefer", ing: "preferring", ed: "preferred", rule: "double" },
  { w: "carry", ing: "carrying", ed: "carried", rule: "ytoi" },
  { w: "hurry", ing: "hurrying", ed: "hurried", rule: "ytoi" },
  { w: "copy", ing: "copying", ed: "copied", rule: "ytoi" },
  { w: "study", ing: "studying", ed: "studied", rule: "ytoi" },
  { w: "reply", ing: "replying", ed: "replied", rule: "ytoi" },
];

/* Stretch: the ones where two rules look as if they both apply, and only one
   does. Every entry here is a word a careful child gets wrong for a reason. */
export const HARD = [
  { w: "open", ing: "opening", ed: "opened", rule: "just", why: "ends consonant-vowel-consonant, but the stress is on the FIRST part — so no doubling" },
  { w: "visit", ing: "visiting", ed: "visited", rule: "just", why: "VIS-it: the stress is at the front, so the t does not double" },
  { w: "enter", ing: "entering", ed: "entered", rule: "just", why: "EN-ter: stress at the front again" },
  { w: "benefit", ing: "benefiting", ed: "benefited", rule: "just", why: "BEN-e-fit: the stress is nowhere near the end" },
  { w: "snow", ing: "snowing", ed: "snowed", rule: "just", why: "w is never doubled" },
  { w: "fix", ing: "fixing", ed: "fixed", rule: "just", why: "x is never doubled — it is already two sounds" },
  { w: "play", ing: "playing", ed: "played", rule: "just", why: "the y follows a VOWEL, so it stays a y" },
  { w: "enjoy", ing: "enjoying", ed: "enjoyed", rule: "just", why: "the y follows a vowel: enjoyed, not enjoied" },
  { w: "obey", ing: "obeying", ed: "obeyed", rule: "just", why: "a vowel before the y again" },
  { w: "agree", ing: "agreeing", ed: "agreed", rule: "just", why: "the e is NOT silent — it is said, so it stays" },
  { w: "tie", ing: "tying", ed: "tied", rule: "drop", why: "the ie turns into a y, or there would be two i's" },
  { w: "argue", ing: "arguing", ed: "argued", rule: "drop" },
  { w: "notice", ing: "noticing", ed: "noticed", rule: "drop" },
  { w: "travel", ing: "travelling", ed: "travelled", rule: "double", why: "an l at the end doubles in British spelling however the word is said" },
  { w: "cancel", ing: "cancelling", ed: "cancelled", rule: "double", why: "the l doubles, as it does in travelling" },
  { w: "control", ing: "controlling", ed: "controlled", rule: "double" },
  { w: "occur", ing: "occurring", ed: "occurred", rule: "double", why: "oc-CUR: the stress IS at the end, so it doubles" },
  { w: "refer", ing: "referring", ed: "referred", rule: "double", why: "re-FER: stressed at the end" },
  { w: "satisfy", ing: "satisfying", ed: "satisfied", rule: "ytoi" },
  { w: "identify", ing: "identifying", ed: "identified", rule: "ytoi" },
];

/** The bank for a level, hardest first so a page has something in it. */
export const bankFor = (tier) =>
  (tier === "stretch" ? [...HARD, ...MEDIUM]
    : tier === "middle" ? [...MEDIUM, ...EASY]
      : EASY);
