# Writing Grammar passages

Two ways to add passages to `data/grammar/passages/`:

1. **Write them by hand** — follow the rules below.
2. **Generate them with any AI** — paste the prompt at the bottom, then run
   `npm run check:grammar` on the result. **Always run the checker on generated
   text.** A model will confidently produce a "correction" that is a comma
   splice, or plant an optional comma as though it were compulsory, and both
   read perfectly well until a student is marked wrong for being right.

Either way the passages are stored **statically** in this repo. There is no
runtime generation: the round is dealt from a shared seed with zero network
traffic, and every player in a room must get byte-identical prose.

---

## The format

A passage is one string. Whitespace splits it into **tokens**, and a token is
either clean prose or a planted error:

```
{{CAT|bad|good}}                one accepted correction
{{CAT|bad|good|also|also}}      several accepted corrections
```

- `CAT` is the CUPS letter: `C`apitalisation, `U`sage, `P`unctuation, `S`pelling.
- `bad` is what the player is shown.
- Everything after it **scores**. The first is canonical — it is what the review
  displays as "the answer".
- The marker wraps only the part that *changes*. Literal text may sit outside
  the braces and rides along: `{{C|lagos|Lagos}}.` → shown `lagos.`, answer `Lagos.`
- A marker must be **one whitespace-delimited token**. `{{P|didnt|didn’t}}` is
  fine; `{{P|We didnt|We didn’t}}` is not.
- **Every authored line is a line on screen.** A letter's greeting, body,
  sign-off and name each go on their own line.

```js
{
  id: 'letter-birthday',       // unique across the whole bank
  title: 'A Note to a Friend',
  band: [5, 8],                // reading level, not error difficulty
  text: `Dear {{P|Bola|Bola,}}

Thank you for the card. It arrived on {{C|friday|Friday}}.

Your {{P|friend|friend,}}
Tunde`,
}
```

---

## The rules that matter

Each of these exists because breaking it cost a real player real points.

- **Every non-marker token must already be correct.** A clean token the player
  edits is scored as a **false edit** — so a comma you leave *out* punishes the
  reader who correctly supplies it. Proof-read the clean prose hardest.
- **A planted error needs exactly one defensible fix**, or every defensible fix
  must be listed as an alternative.
- **Never plant an error whose correction is itself wrong.** A comma joining two
  complete sentences is a comma splice, not a fix.
- **One token tests one rule.** Never require a comma *and* an apostrophe on the
  same word — a player who supplies one correctly still scores nothing.
- **Lists take the serial comma.** A list in clean prose must already have it;
  a missing one is a good P error.
- **Every passage needs at least one error of each of C, U, P and S**, or a
  single-letter focus round deals a passage with nothing in it.
- Aim for 60–110 words and 8–12 errors.

## The comma rules (house style)

These are the marking standard. They are shown to players on the rules card
(`data/grammar/cups.js`), and **the clean prose must obey them too**, because
that is what the player is being marked against.

1. **Comma after an introductory word, phrase or clause.**
   *Last Saturday, my family went to the beach.* · *When we arrived, I ran.*
2. **Comma before `and`/`but`/`or`/`so` joining two complete sentences** — but
   **not** when two verbs share one subject.
   *The pitch was dry, and the ball ran quickly.* (two sentences)
   *He moved the goats and barred the door.* (one subject — no comma)
3. **Comma pair around an appositive** — a renaming that could be lifted out.
   *Our captain, Emeka, won the toss.*
4. **Comma pair around a non-defining relative clause.** None on a defining one.
   *The roots take in water, which travels up the stem.* (non-defining)
   *Parents who wish to speak should write in.* (defining — no commas)
5. **Serial (Oxford) comma** — every item in a list of three or more is
   separated, *including* the one before the final `and`.
   *She packed rice, beans, and yams.*
   This is a house choice and it is stated on the players' rules card, so a list
   missing that final comma is a fair error to plant rather than a trap.

Short bare adverbs (*Then*, *Now*, *Soon*) do **not** take a comma.

## Good error material

| Letter | Reliable, unambiguous errors |
| --- | --- |
| **C** | sentence starts · names · places · days · months · titles · `i` → `I` |
| **U** | their/there/they're · its/it's · was/were · affect/effect · "should of" · fewer/less |
| **P** | missing sentence-final `.` or `?` · possessive apostrophe · contraction apostrophe · the five comma rules above · `:` before a list · `?` inside a closing quote |
| **S** | recieve · seperate · definately · occured · comunity · sucessful |

Avoid as errors: optional commas, semicolons, hyphenation, British/American
spelling splits (*realise/realize*), and anything where two teachers would
disagree.

## Checking

```bash
npm run check:grammar
```

**Errors** fail the build — the round would be broken or unfair. **Warnings**
are judgement calls the script cannot settle: read each one and either fix it or
satisfy yourself the case is genuinely mandatory.

The checker catches: unparsed markers, multi-word markers, an "error" that is
already an accepted answer, missing CUPS coverage, a token needing two
punctuation fixes at once, missing introductory commas, missing commas before a
coordinating conjunction joining two sentences, comma splices, three-item lists,
manifest drift, and any grade that can no longer be dealt a round.

After adding passages, update the count in `data/grammar/manifest.js`.

---

## Prompt for an external AI

Paste this verbatim, then run `npm run check:grammar` on what comes back.

````text
You are writing proof-reading exercises for a Nigerian secondary-school study
app. Produce passages of ORIGINAL prose (never copy real exam papers, books,
news articles or any existing text) with deliberate mistakes planted in them,
in the exact format below.

FORMAT
Each passage is one string. Whitespace splits it into tokens. A planted mistake
is written as {{CAT|bad|good}} where CAT is C, U, P or S:
  C = Capitalisation   U = Usage (wrong word)   P = Punctuation   S = Spelling
`bad` is what the student sees; `good` is the correction. If more than one
correction is genuinely acceptable, list them all: {{P|bad|good|alsogood}}.
The marker wraps ONLY the part that changes — {{C|lagos|Lagos}}. is correct.
A marker must be ONE whitespace-delimited token: {{P|didnt|didn’t}} is valid,
{{P|We didnt|We didn’t}} is NOT.
Each authored line becomes a line on screen (letters need the greeting, body,
sign-off and name on separate lines).

HARD RULES — breaking any of these makes the exercise mark a correct student wrong
1. Every word that is NOT inside a marker must already be perfectly correct.
   If you leave out a comma the rules below require, a student who adds it is
   PENALISED. Proof-read the clean prose hardest.
2. Each planted mistake must have exactly ONE defensible correction, or you must
   list every acceptable correction as alternatives.
3. Never plant a mistake whose "correction" is itself wrong. In particular, a
   comma joining two complete sentences is a COMMA SPLICE, not a fix.
4. One token tests ONE rule. Never require a comma AND an apostrophe on the same
   word.
5. Every list of three or more items uses the serial comma (see comma rule 5).
6. Every passage must contain at least one C, one U, one P and one S mistake.

COMMA RULES — apply to the clean prose as well as the planted mistakes
1. Comma after an introductory word, phrase or clause.
     "Last Saturday, my family went to the beach."  "When we arrived, I ran."
2. Comma before and/but/or/so joining two COMPLETE sentences; NO comma when two
   verbs share one subject.
     "The pitch was dry, and the ball ran quickly."   (comma)
     "He moved the goats and barred the door."        (no comma)
3. Comma pair around an appositive: "Our captain, Emeka, won the toss."
4. Comma pair around a NON-DEFINING relative clause; none on a defining one.
     "The roots take in water, which travels up the stem."   (commas)
     "Parents who wish to speak should write in."            (no commas)
5. Serial (Oxford) comma in every list of three or more, INCLUDING before the
   final "and": "She packed rice, beans, and yams."
Short bare adverbs (Then, Now, Soon) take NO comma.

GOOD MISTAKES TO PLANT
C: sentence starts, names, places, days, months, titles, "i" -> "I"
U: their/there/they're, its/it's, was/were, affect/effect, "should of" -> "should have"
P: missing final . or ?, possessive apostrophe, contraction apostrophe, the comma
   rules above, ":" before a list, "?" inside a closing quote mark
S: recieve, seperate, definately, occured, comunity, sucessful
DO NOT use as mistakes: optional commas, semicolons, hyphenation, or
British/American spelling differences.

STYLE
British spelling. Nigerian settings, names and school life. 60-110 words per
passage, 8-12 planted mistakes. Age-appropriate for the stated grade band.

OUTPUT
A JavaScript array of objects exactly like this, and nothing else:

export const PASSAGES = [
  {
    id: 'diary-market-run',
    title: 'The Errand',
    band: [5, 8],
    text: `...passage text with {{CAT|bad|good}} markers...`,
  },
];

Now write N passages on the theme: <diary | story | letter | report | science |
wildlife | history | discovery>, for grade band <lo>-<hi>.

For the informative themes (wildlife, history, discovery) the FACTS MUST BE
ACCURATE — a student remembers the fact long after the punctuation. Write in the
register of a good encyclopaedia entry, and prefer subjects with a Nigerian or
West African connection where one exists.
````
