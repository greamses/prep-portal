/* ============================================================================
   Comprehension — the passages, and the questions that can be MARKED
   ----------------------------------------------------------------------------
   Comprehension is usually impossible to set on a printable page, because the
   good questions ("why did she hesitate?") have answers no page can mark. So
   this chapter asks the kind that can be marked exactly, and says plainly
   that it is doing so:

     literal     the answer is a word or two lifted from the passage
     vocabulary  what a word means HERE, chosen from the sentence round it
     inference   not stated, but only one answer fits — kept to the kind where
                 that is really true, and always with the line it rests on

   Every question stores the answer AND where in the passage it comes from, so
   the key can say "line 3" rather than just repeating the answer. A child
   marking their own work has to be able to see WHERE they should have looked;
   that is the skill, and an answer on its own does not teach it.

     { title, lines: [...], qs: [{ q, a: [accepted…], from: lineNo, kind }] }

   The passages are written for this page. They are short on purpose: a child
   who cannot hold six lines in their head will not be helped by sixteen.
   ========================================================================== */

export const EASY = [
  {
    title: "The Weaver Birds",
    lines: [
      "Behind our house there is a tall palm tree.",
      "Every year the weaver birds come back to it.",
      "The males build the nests, knotting strips of grass with their beaks.",
      "A female inspects each nest before she chooses one.",
      "If she does not like it, the male pulls it down and starts again.",
    ],
    qs: [
      { q: "What kind of tree is behind the house?", a: ["palm", "a palm", "palm tree", "a palm tree"], from: 1, kind: "literal" },
      { q: "Which birds build the nests, the males or the females?", a: ["males", "the males", "male"], from: 3, kind: "literal" },
      { q: "What do the birds build their nests from?", a: ["grass", "strips of grass", "grass strips"], from: 3, kind: "literal" },
      { q: "In line 4, what does inspects mean?", a: ["looks at it carefully", "examines", "checks", "looks closely at"], from: 4, kind: "vocabulary" },
      { q: "Who decides whether a nest is good enough?", a: ["the female", "female", "the female bird"], from: 4, kind: "inference" },
    ],
  },
  {
    title: "Market Day",
    lines: [
      "On Saturday my mother wakes me before the sun is up.",
      "We walk to the market while the roads are still quiet.",
      "She says the best tomatoes are gone by eight o'clock.",
      "I carry the basket on the way there, because it is empty.",
      "On the way back she carries it, and I carry the yams.",
    ],
    qs: [
      { q: "On which day do they go to the market?", a: ["saturday", "on saturday"], from: 1, kind: "literal" },
      { q: "By what time are the best tomatoes gone?", a: ["eight", "8", "eight o'clock", "8 o'clock", "by eight"], from: 3, kind: "literal" },
      { q: "Why is the basket easy to carry on the way there?", a: ["it is empty", "empty", "because it is empty"], from: 4, kind: "literal" },
      { q: "Who carries the basket on the way home?", a: ["mother", "my mother", "his mother", "her mother", "mum", "mom"], from: 5, kind: "literal" },
      { q: "Why do they leave so early?", a: ["to get the best tomatoes", "so the best tomatoes are not gone", "to arrive before eight", "because the good ones go by eight"], from: 3, kind: "inference" },
    ],
  },
  {
    title: "The Boy Who Counted Steps",
    lines: [
      "Musa counts the steps from his door to the road every morning.",
      "It is always sixty-two, unless he is late.",
      "When he is late it is fifty-eight, because he takes longer ones.",
      "His sister says counting them is a waste of a morning.",
      "Musa says he is the only one in the house who knows how far it is.",
    ],
    qs: [
      { q: "How many steps is it when Musa is not late?", a: ["sixty-two", "62", "sixty two"], from: 2, kind: "literal" },
      { q: "Why are there fewer steps when he is late?", a: ["he takes longer steps", "his steps are longer", "he takes bigger steps", "longer ones"], from: 3, kind: "literal" },
      { q: "What does his sister think of the counting?", a: ["a waste of time", "a waste of a morning", "it is a waste", "pointless"], from: 4, kind: "literal" },
      { q: "In line 5, what does Musa mean by how far it is?", a: ["the distance", "the distance to the road", "how long the walk is"], from: 5, kind: "vocabulary" },
      { q: "Does Musa agree with his sister?", a: ["no", "no he does not", "he disagrees"], from: 5, kind: "inference" },
    ],
  },
  {
    title: "The Loudest Bird",
    lines: [
      "The bird that wakes our street is not the biggest one.",
      "It is a small brown bird that sits on the aerial.",
      "It starts before five, when the sky is still grey.",
      "The big hornbills in the mango tree do not sing until seven.",
      "By then nobody is listening, because everyone is already up.",
    ],
    qs: [
      { q: "Where does the small brown bird sit?", a: ["on the aerial", "the aerial", "an aerial"], from: 2, kind: "literal" },
      { q: "At what time do the hornbills begin?", a: ["seven", "7", "at seven", "7 o'clock"], from: 4, kind: "literal" },
      { q: "In line 3, what colour is the sky when the small bird starts?", a: ["grey", "gray", "still grey"], from: 3, kind: "literal" },
      { q: "Why does nobody listen to the hornbills?", a: ["everyone is already up", "they are already awake", "people are up already"], from: 5, kind: "inference" },
      { q: "Which bird does the writer think matters more, and why?", a: ["the small one", "the small brown bird", "the brown bird"], from: 1, kind: "inference" },
    ],
  },
];

export const MEDIUM = [
  {
    title: "The Harmattan",
    lines: [
      "Between December and February a dry wind blows down from the Sahara.",
      "It is called the harmattan, and it carries a fine red dust.",
      "The dust settles on everything: roofs, leaves, the inside of your nose.",
      "The air turns hazy, and at noon the sun looks like a pale coin.",
      "Lips crack, wood shrinks, and the nights are suddenly cold.",
      "Farmers welcome it, because the dryness helps them store their grain.",
    ],
    qs: [
      { q: "Where does the harmattan wind come from?", a: ["the sahara", "sahara", "the sahara desert"], from: 1, kind: "literal" },
      { q: "In which months does it blow?", a: ["december to february", "december and february", "between december and february", "december, january and february"], from: 1, kind: "literal" },
      { q: "In line 4, what does hazy mean?", a: ["misty", "not clear", "cloudy with dust", "unclear", "murky"], from: 4, kind: "vocabulary" },
      { q: "Why does the sun look pale at noon?", a: ["the dust", "because of the dust", "dust in the air", "the haze"], from: 4, kind: "inference" },
      { q: "Give one reason farmers are glad of the harmattan.", a: ["it helps them store grain", "the dryness helps storage", "grain stores better", "it keeps the grain dry"], from: 6, kind: "literal" },
    ],
  },
  {
    title: "What the Baobab Holds",
    lines: [
      "The baobab is not a handsome tree, and it knows it.",
      "Its trunk is swollen and grey, and for half the year it has no leaves at all.",
      "People say it was planted upside down, with its roots in the air.",
      "But that swollen trunk is a tank: a big baobab can hold a hundred thousand litres of water.",
      "In a drought, elephants tear strips from it to reach what is inside.",
      "The tree survives this, and goes on standing for a thousand years.",
    ],
    qs: [
      { q: "For how much of the year does the baobab have no leaves?", a: ["half", "half the year", "half of the year", "six months"], from: 2, kind: "literal" },
      { q: "What do people say the tree looks like?", a: ["planted upside down", "upside down", "it was planted upside down", "roots in the air"], from: 3, kind: "literal" },
      { q: "What does the trunk store?", a: ["water", "rainwater"], from: 4, kind: "literal" },
      { q: "In line 4, what does the writer mean by calling the trunk a tank?", a: ["it holds water", "it stores water", "it is a water store", "it is full of water"], from: 4, kind: "vocabulary" },
      { q: "Why do elephants attack the tree in a drought?", a: ["for the water", "to get water", "to drink the water inside", "because there is water in it"], from: 5, kind: "inference" },
    ],
  },
];

export const HARD = [
  {
    title: "The Letter That Was Never Sent",
    lines: [
      "Ada found the letter folded inside her grandfather's dictionary.",
      "It was addressed to a woman in Enugu, and it had a stamp on it.",
      "The stamp had never been franked, so the letter had never gone.",
      "In it, her grandfather apologised for something he did not name.",
      "He wrote that he would come at Christmas and explain everything.",
      "The date at the top was the December before Ada was born.",
      "She put it back between the same two pages and said nothing.",
    ],
    qs: [
      { q: "Where did Ada find the letter?", a: ["in a dictionary", "in her grandfather's dictionary", "inside the dictionary", "a dictionary"], from: 1, kind: "literal" },
      { q: "How can we tell the letter was never posted?", a: ["the stamp was not franked", "the stamp had never been franked", "the stamp was unused", "it was not franked"], from: 3, kind: "literal" },
      { q: "In line 3, what does franked mean?", a: ["marked by the post office", "stamped by the post office", "postmarked", "cancelled"], from: 3, kind: "vocabulary" },
      { q: "Did Ada ever meet the woman in Enugu? How do you know?", a: ["no", "we are not told", "it does not say"], from: 2, kind: "inference" },
      { q: "Why did he write that he would explain at Christmas rather than in the letter?", a: ["he wanted to say it in person", "to say it face to face", "it was too hard to write", "he preferred to explain in person"], from: 5, kind: "inference" },
    ],
  },
  {
    title: "The Clock in the Hall",
    lines: [
      "The clock in our hall has been wrong for eleven years.",
      "It gains four minutes a day, which my father refuses to correct.",
      "Every few months, therefore, it tells the right time for one minute.",
      "He says a clock that is always wrong is more honest than one that is nearly right.",
      "A nearly right clock makes you late and lets you blame the clock.",
      "Ours makes you look at your watch, which is what a clock is for.",
    ],
    qs: [
      { q: "How much does the clock gain each day?", a: ["four minutes", "4 minutes", "four", "4"], from: 2, kind: "literal" },
      { q: "How often is the clock exactly right?", a: ["every few months", "once every few months", "for one minute every few months"], from: 3, kind: "literal" },
      { q: "In line 4, what does honest mean about a clock?", a: ["it does not mislead you", "it does not pretend", "it does not deceive", "it never tricks you"], from: 4, kind: "vocabulary" },
      { q: "Why does the father think a nearly right clock is worse?", a: ["you trust it and are late", "it makes you late", "you believe it and it is wrong", "because you blame the clock"], from: 5, kind: "inference" },
      { q: "What does the writer think a clock is really for?", a: ["making you check the time", "to make you look at your watch", "to make you check", "reminding you to look"], from: 6, kind: "inference" },
    ],
  },
];

export const bankFor = (tier) =>
  (tier === "stretch" ? [...HARD, ...MEDIUM]
    : tier === "middle" ? [...MEDIUM, ...EASY]
      : EASY);
