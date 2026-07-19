/* GRAMMAR — Wildlife. Authoring format and rules are documented in diary.js —
   read them before adding one.

   Informative writing, not narrative: the reader is being told facts about an
   animal, in the register of a good encyclopaedia entry. That makes it the
   natural home for two things narrative rarely offers — non-defining relative
   clauses ("water, which travels…") and serial lists — while the facts
   themselves have to be accurate, because a child will remember them longer
   than the punctuation. */

export const PASSAGES = [
  {
    id: 'wildlife-elephant',
    title: 'The African Elephant',
    band: [4, 7],
    text: `{{C|the|The}} {{C|african|African}} elephant is the largest land animal alive today. A full-grown male can weigh six {{P|tonnes|tonnes,}} and he eats for about sixteen hours every day. Elephants live in family herds led by the oldest {{P|female|female,}} who is called the matriarch. She remembers where water can be found in a {{S|drougt|drought}}. {{U|There|Their}} trunks contain no bones at all. {{S|Instaed|Instead}}, they are made of thousands of small {{S|musles|muscles}}. In {{C|nigeria|Nigeria}}, elephants are now {{P|rare|rare,}} and most of them live in {{C|yankari|Yankari}} Game Reserve.`,
  },
  {
    id: 'wildlife-pangolin',
    title: 'The Pangolin',
    band: [5, 9],
    text: `{{C|the|The}} pangolin is the only mammal in the world that is covered in scales. When it is {{P|frightened|frightened,}} it rolls itself into a tight ball, and even a lion cannot open it. Pangolins have no {{P|teeth|teeth.}} They swallow small {{P|stones|stones,}} which help to grind the ants, {{P|termites|termites,}} and larvae in {{U|there|their}} stomachs. {{S|Sadley|Sadly}}, the pangolin is now the most trafficked wild mammal in {{C|africa|Africa}}. {{U|It's|Its}} scales are made of {{S|keratine|keratin}}, the same material as human fingernails. {{C|nigeria|Nigeria}} has become an important route for {{S|smuglers|smugglers}}, and conservationists are working to close it.`,
  },
  {
    id: 'wildlife-weaver',
    title: 'The Weaver Bird',
    band: [4, 8],
    text: `{{C|the|The}} village weaver is one of the {{S|noisyest|noisiest}} birds in West {{C|africa|Africa}}. The male builds a round nest from strips of {{P|grass|grass,}} and he ties every knot with his beak. When the nest is {{P|finished|finished,}} he hangs upside down beneath it and calls to the {{S|femails|females}}. If a female does not like his work, she will tear the nest apart. The male simply starts {{P|again|again.}} A single tree can hold more than a hundred nests. {{U|There|Their}} colonies are so loud that farmers can hear them from a {{S|distence|distance}}.`,
  },
];
