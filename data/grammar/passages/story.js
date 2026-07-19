/* GRAMMAR — Story passages. Authoring format and rules are documented in
   diary.js — read them before adding one.

   Narrative is where DIALOGUE punctuation lives: a speech mark carries the
   question mark or comma inside it, so those errors are planted on the closing
   token ({{P|home”|home?”}}) rather than as a mark floating on its own. A
   player typing a straight quote is not penalised — see normalise() in
   ../index.js. */

export const PASSAGES = [
  {
    id: 'story-lost-key',
    title: 'The Lost Key',
    band: [4, 7],
    text: `Ada pushed the gate open and stopped. The front door of the house was already open. “Is anybody {{P|home”|home?”}} she called. Nobody {{S|ansered|answered}} her. She stepped inside slowly, holding her breath. The parlour was exactly as she had left it that {{S|morening|morning}}, except for one thing. {{C|her|Her}} {{P|grandmothers|grandmother’s}} brass key was lying on the floor beside the table. Ada picked it up carefully. It {{U|were|was}} still warm.`,
  },
  {
    id: 'story-market',
    title: 'Market Day',
    band: [5, 9],
    text: `The market at {{C|onitsha|Onitsha}} opens before sunrise. By six {{P|o’clock|o’clock,}} the traders have arranged {{U|there|their}} tomatoes and yams into neat {{S|piramids|pyramids}}. Chidi walked between the stalls with his mother and carried an empty basket. He liked the noise and the smell of smoked {{P|fish|fish.}} “How much for the {{P|plantain”|plantain?”}} his mother asked. The trader named a figure that made her laugh out loud. They argued {{S|cheerfuly|cheerfully}} for several minutes. In the end, she paid less than half of what he had {{S|aksed|asked}}.`,
  },
  {
    id: 'story-storm',
    title: 'The Storm',
    band: [6, 9],
    text: `Nobody in the village had seen a storm like it. The wind arrived first and bent the palm trees almost to the ground. Then came the rain, so heavy that {{C|musa|Musa}} could not see the road from his window. His father moved the goats into the {{S|shead|shed}} and barred the door. Nobody could {{U|of|have}} helped them until the water went down. By midnight, the roof of the {{P|schools|school’s}} classroom block had been torn away {{S|completly|completely}}. {{C|in|In}} the morning, the whole {{S|comunity|community}} gathered to look at the {{P|damage|damage.}} It took them three weeks to repair {{S|everthing|everything}}.`,
  },
];
