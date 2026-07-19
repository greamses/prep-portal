/* ═══════════════════════════════════════════════════════
   GRAMMAR — Diary & Everyday passages.

   AUTHORING FORMAT
   A passage is one string. Whitespace splits it into TOKENS, and a token is
   either clean prose or a planted error written as:

       {{CAT|bad|good}}

   CAT is the CUPS letter (C/U/P/S), `bad` is what the player is shown, `good`
   is the only text that scores. Both must be a WHOLE token — punctuation and
   quote marks travel with the word they are attached to, which is what lets
   the play surface make each word independently editable without ever losing
   track of which word is which (see ../index.js and the page's game.js).

   So a missing comma is not an empty insertion, it is a word that is missing
   its comma: {{P|basket|basket,}}. A missing question mark is {{P|go.|go?}}.

   RULES FOR NEW PASSAGES
   · Every non-marker token must already be correct. A "clean" token the player
     edits is scored as a FALSE EDIT, so a typo you left in by accident
     punishes the careful reader — proof-read the prose itself first.
   · Never plant two errors that depend on each other. Each must be fixable and
     markable on its own.
   · `band` is [lowestGrade, highestGrade] — the reading level, not the
     difficulty of the errors.
═══════════════════════════════════════════════════════ */

export const PASSAGES = [
  {
    id: 'diary-beach',
    title: 'The Beach Trip',
    band: [4, 6],
    text: `{{C|last|Last}} {{C|saturday|Saturday}} my family went to the beach in {{C|lagos|Lagos}}. We {{U|was|were}} all very {{S|exited|excited}} because we had been planning the trip for {{S|wekes|weeks}}. My mother packed rice and chicken into a big {{P|basket|basket,}} and my father carried the umbrella. When we arrived {{C|i|I}} ran straight to the water. The waves were bigger than I expected, so I stayed near my brother. We built a sandcastle and {{S|decorateed|decorated}} it with shells. Where did the afternoon {{P|go.|go?}} By five {{P|oclock|o’clock}} we were {{P|tired|tired,}} sandy and happy. It was the best day of the holiday.`,
  },
  {
    id: 'diary-match',
    title: 'Match Day',
    band: [5, 8],
    text: `My school played {{U|it's|its}} final match against {{C|command|Command}} Secondary School on {{C|wednesday|Wednesday}}. Our {{P|captain|captain,}} Emeka, won the toss and chose to bat first. The pitch was dry and the ball moved quickly across it. By lunchtime we had scored eighty-four runs and nobody had been {{S|dismised|dismissed}}. Then {{U|there|their}} fastest bowler came on and everything changed. He took three wickets in four overs. I could hardly watch. In the {{P|end|end,}} we lost by eleven {{S|runns|runs}}, but the coach said we had played {{S|weel|well}}. {{C|there|There}} is always next term.`,
  },
  {
    id: 'diary-power-cut',
    title: 'The Power Cut',
    band: [4, 7],
    text: `The lights went out just as we {{U|was|were}} starting our homework on {{C|tuesday|Tuesday}} evening. My sister screamed because she is {{S|afriad|afraid}} of the dark. Mummy found the {{S|lantarn|lantern}} and we sat together in the {{P|parlour|parlour.}} It was {{S|suprisingly|surprisingly}} peaceful without the television. Daddy told us a story about his village in {{C|enugu|Enugu}}. He said that when he was young {{U|their|there}} was no electricity at all. We did not believe {{P|him|him.}} Then the fan started spinning again and everyone cheered.`,
  },
];
