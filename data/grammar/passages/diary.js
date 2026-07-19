/* ═══════════════════════════════════════════════════════
   GRAMMAR — Diary & Everyday passages.

   AUTHORING FORMAT
   A passage is one string. Whitespace splits it into TOKENS, and a token is
   either clean prose or a planted error written as:

       {{CAT|bad|good}}                one accepted correction
       {{CAT|bad|good|also|also}}      several accepted corrections

   CAT is the CUPS letter (C/U/P/S), `bad` is what the player is shown, and
   every field after it is a correction that SCORES — the first is canonical
   and is what the review displays. Both halves must be a WHOLE token, though
   literal text may sit outside the braces and rides along ({{C|lagos|Lagos}}.
   is fine). That is what lets the play surface make each word independently
   editable without ever losing track of which word is which.

   A blank line is a real paragraph break (see ../index.js's buildPassage).

   THE RULES THAT MATTER — read before adding a passage
   · Every non-marker token must ALREADY be correct. A clean token the player
     edits scores as a FALSE EDIT, so a comma you leave OUT punishes the reader
     who correctly supplies it. Proof-read the prose itself first, hardest.
   · A planted error must have exactly ONE defensible fix — or every defensible
     fix must be listed as an alternative.
   · Never plant an error whose "correction" is itself bad grammar. (A comma
     joining two complete sentences is a comma splice, not a fix.)
   · One token tests ONE rule. Never require a comma AND an apostrophe on the
     same word — a player who supplies one correctly still scores nothing.
   · Lists take the SERIAL comma, before the final "and" (comma rule 5). A
     missing one is a good P error; a list in clean prose must already have it.
   · Each passage needs at least one error of EACH of C, U, P and S, or a
     single-letter focus round deals a passage with nothing in it.
   · `band` is [lowestGrade, highestGrade] — reading level, not error difficulty.

   THE COMMA RULES — the house style, applied everywhere, no exceptions
   These are the marking standard (they are also shown to players on the rules
   card, see ../cups.js). The prose must obey them even where no error is
   planted, because the player is being marked against them.
     1. Comma after an introductory word, phrase or clause.
          Last Saturday, my family went to the beach.
          When we arrived, I ran straight to the water.
          By midnight, the roof had been torn away.
     2. Comma before and / but / or / so joining two COMPLETE sentences —
        but NOT when two verbs share one subject.
          The pitch was dry, and the ball ran quickly.   (two sentences)
          He moved the goats and barred the door.        (one subject)
     3. Comma pair around an appositive — a renaming that could be lifted out.
          Our captain, Emeka, won the toss.
     4. Comma pair around a NON-DEFINING relative clause (extra information).
        No commas on a DEFINING one (it identifies which).
          The roots take in water, which travels up the stem.   (non-defining)
          Parents who wish to speak should write in.            (defining)
     5. Serial (Oxford) comma — every item in a list of three or more is
        separated, INCLUDING the one before the final "and".
          She packed rice, beans, and yams.
        This is a house choice, and it is stated on the players' rules card, so
        a list missing that last comma is a fair P error rather than a trap.

   `npm run check:grammar` enforces everything above that a machine can, and
   warns on the rest. Run it on ANYTHING an AI wrote before committing it.
═══════════════════════════════════════════════════════ */

export const PASSAGES = [
  {
    id: "diary-beach",
    title: "The Beach Trip",
    band: [4, 6],
    text: `{{C|last|Last}} {{C|saturday|Saturday}}, my family went to the beach in {{C|lagos|Lagos}}. We {{U|was|were}} all very {{S|exited|excited}} because we had been planning the trip for {{S|wekes|weeks}}. My mother packed rice and chicken into a big {{P|basket|basket,}} and my father carried the umbrella. When we arrived, {{C|i|I}} ran straight to the water. The waves were bigger than I expected, so I stayed near my brother. We could not find {{P|Amakas|Amaka’s}} sun hat anywhere. Where did the afternoon {{P|go.|go?}} By five {{P|o’clock|o’clock,}} we were {{P|tired|tired,}} sunburnt, and happy. It was the best day of the {{S|holliday|holiday}}.`,
  },
  {
    id: "diary-match",
    title: "Match Day",
    band: [5, 8],
    text: `My school played {{U|it's|its}} final match against {{C|command|Command}} Secondary School on {{C|wednesday|Wednesday}}. Our {{P|captain|captain,}} Emeka, won the toss and chose to kick towards the hill. The pitch was {{P|dry|dry,}} and the ball ran quickly across it. By half-time, we were leading by two goals, and nobody had been {{S|bookd|booked}}. Then {{U|there|their}} fastest winger came on, and everything changed. He scored twice in {{S|elleven|eleven}} minutes. I could hardly watch. We lost by a single goal, but the coach said we had played {{S|weel|well}}. {{C|there|There}} is always next term.`,
  },
  {
    id: "diary-power-cut",
    title: "The Power Cut",
    band: [4, 7],
    text: `The lights went out just as we {{U|was|were}} starting our homework on {{C|tuesday|Tuesday}} evening. My sister screamed because she is {{S|afriad|afraid}} of the dark. Mummy found the {{S|lantarn|lantern}}, and we sat together in the {{P|parlour|parlour.}} It was {{S|suprisingly|surprisingly}} peaceful without the television. Daddy told us a story about his village in {{C|enugu|Enugu}}. He said that when he was young {{U|their|there}} was no electricity at all. We {{P|didnt|didn’t}} believe him. Then the fan started spinning again, and everyone cheered.`,
  },
  {
    id: "diary-harmattan",
    title: "The Harmattan",
    band: [4, 7],
    text: `{{C|last|Last}} {{C|december|December}}, the harmattan came early. Every morning, the sky was the colour of {{P|dust|dust,}} and the sun looked like a pale orange. My {{P|grandmothers|grandmother’s}} cream stopped our skin {{S|craking|cracking}} in the dry air. At {{P|school|school,}} the teacher let us keep our {{S|jumpres|jumpers}} on. I liked the {{P|cold|cold,}} but my sister {{S|complaned|complained}} all week. When the wind finally dropped, everything in the house had to be washed. {{U|Their|There}} was fine red dust on every plate.`,
  },
  {
    id: "diary-new-school",
    title: "The New School",
    band: [5, 8],
    text: `On {{C|monday|Monday}}, I started at my new school in {{C|abuja|Abuja}}. I did not know {{P|anybody|anybody,}} and the corridors all looked the same. Our form {{P|teacher|teacher,}} Mrs Okoro, put me next to a boy called Ifeanyi. He lent me a pen because I had {{S|forgoten|forgotten}} mine. By break {{P|time|time,}} we had {{S|discovred|discovered}} that we support the same club. The lessons were harder {{U|then|than}} I expected, especially {{S|mathmatics|mathematics}}. I {{U|were|was}} tired when I got home, but I did not mind.`,
  },
];
