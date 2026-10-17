/* ============================================================================
   Context clues — IDEAS
   ----------------------------------------------------------------------------
   A child meeting a word they do not know has two choices: stop, or work it
   out from the sentence it is standing in. The second one is a skill, it can
   be taught, and it is almost never taught — a dictionary is handed over
   instead, which answers the question and teaches nothing about how to answer
   the next one.

   There are five ways a sentence tells you, and they spell IDEAS:

     I  INFERENCE   nothing says it; the rest of the sentence only makes
                    sense if the word means a certain thing
     D  DEFINITION  the sentence says what it means, straight out
     E  EXAMPLE     you are given examples of it, and the kind shows
     A  ANTONYM     you are given the OPPOSITE, with a word like but or
                    unlike to tell you it is a contrast
     S  SYNONYM     another word near it means the same thing

   EVERY ITEM CARRIES THE CLUE ITSELF, exactly as it appears in the sentence.
   That is what makes the key teach: "it means living in trees — the words
   that told you are *it lives its whole life in the trees*" sends a child
   back to the place they should have looked, which an answer on its own
   never does. It is also what the film lights up.

     { s, word, mean: [accepted…], clue, why }

   `s` carries the hard word in {{braces}} so the page can pick it out and
   the clue is an exact piece of the sentence — `scratchpad/ctxcheck.mjs`
   holds every item to both of those.
   ========================================================================== */

/** The five clue kinds, in the order that spells the word. */
export const IDEAS = [
  { id: "I", key: "inference", name: "Inference",
    how: "Nothing says it. The rest of the sentence only makes sense one way.",
    hint: "Ask: what would have to be true for this sentence to make sense?" },
  { id: "D", key: "definition", name: "Definition",
    how: "The sentence tells you outright, often after a comma, a dash, or the word IS.",
    hint: "Look for: is, means, or, that is, a comma straight after the word." },
  { id: "E", key: "example", name: "Example",
    how: "You are given examples, and what they have in common is the meaning.",
    hint: "Look for: such as, for example, like, including." },
  { id: "A", key: "antonym", name: "Antonym",
    how: "You are given the opposite, and a word that warns you it is a contrast.",
    hint: "Look for: but, unlike, instead of, whereas, not… but." },
  { id: "S", key: "synonym", name: "Synonym",
    how: "Another word beside it means the same thing.",
    hint: "Look for: or, also called, in other words, a word repeated another way." },
];

export const KIND_OF = Object.fromEntries(IDEAS.map((k) => [k.key, k]));

/* ── I · INFERENCE ─────────────────────────────────────────────────────────*/

const I_EASY = [
  { s: "By the time the bus came, Ada was so {{weary}} that she fell asleep standing up.",
    word: "weary", mean: ["tired", "very tired", "worn out", "exhausted"],
    clue: "fell asleep standing up", why: "nobody sleeps standing up unless they are worn out" },
  { s: "The soup was so {{bland}} that Tunde reached for the salt before his second spoon.",
    word: "bland", mean: ["tasteless", "with no taste", "not tasty", "without flavour"],
    clue: "reached for the salt", why: "you only add salt to something with no taste in it" },
  { s: "She spoke so {{softly}} that the boy at the next desk had to lean right over to hear.",
    word: "softly", mean: ["quietly", "in a quiet voice", "not loudly"],
    clue: "had to lean right over to hear", why: "you lean in for a voice that is too quiet" },
  { s: "The road was so {{narrow}} that the two lorries could not pass each other.",
    word: "narrow", mean: ["thin", "not wide", "small across"],
    clue: "could not pass each other", why: "two lorries only stick on a road without the width for both" },
  { s: "He was {{reluctant}} to go in, and stood at the gate for a full minute first.",
    word: "reluctant", mean: ["unwilling", "not wanting to", "slow to want to", "hesitant"],
    clue: "stood at the gate for a full minute first",
    why: "somebody who wants to go in does not wait at the gate" },
  { s: "The puppy was {{timid}} and hid behind its mother whenever anyone came close.",
    word: "timid", mean: ["shy", "easily frightened", "nervous", "not brave"],
    clue: "hid behind its mother whenever anyone came close",
    why: "hiding from people is what being easily frightened looks like" },
];

const I_MID = [
  { s: "The teacher's instructions were so {{ambiguous}} that half the class did one thing "
      + "and half did the other.",
    word: "ambiguous", mean: ["unclear", "able to mean two things", "confusing", "not clear"],
    clue: "half the class did one thing and half did the other",
    why: "one instruction cannot send a class two ways unless it could be read two ways" },
  { s: "Rain had made the path {{treacherous}}, and two of the porters went down before "
      + "they reached the bend.",
    word: "treacherous", mean: ["dangerous", "unsafe", "slippery and dangerous", "risky"],
    clue: "two of the porters went down", why: "people fall on a path that is not safe to walk" },
  { s: "His story was so {{implausible}} that nobody in the room believed a word of it.",
    word: "implausible", mean: ["hard to believe", "unbelievable", "not likely to be true"],
    clue: "nobody in the room believed a word of it",
    why: "a roomful of people only disbelieves a story that could not be so" },
  { s: "The hall was {{spacious}} enough for all four hundred chairs, with room to walk between them.",
    word: "spacious", mean: ["roomy", "with plenty of room", "large inside", "big"],
    clue: "enough for all four hundred chairs, with room to walk between them",
    why: "four hundred chairs and room to spare is what plenty of room means" },
  { s: "She was {{meticulous}} about her work, and checked every figure twice before she handed it in.",
    word: "meticulous", mean: ["very careful", "careful about details", "thorough", "painstaking"],
    clue: "checked every figure twice", why: "checking everything twice is being careful about detail" },
  { s: "The crowd grew {{restless}}, shifting about and murmuring while the speaker read on and on.",
    word: "restless", mean: ["unable to keep still", "fidgety", "impatient", "uneasy"],
    clue: "shifting about and murmuring", why: "people who cannot settle shift about and mutter" },
];

const I_HARD = [
  { s: "The minister was {{evasive}}, and answered three different questions before anyone "
      + "noticed he had answered none of them.",
    word: "evasive", mean: ["avoiding the question", "not answering directly", "dodging"],
    clue: "answered three different questions before anyone noticed he had answered none of them",
    why: "answering other questions instead is exactly what dodging looks like" },
  { s: "Her handwriting was {{illegible}}, and even her own teacher had to ask her to read it aloud.",
    word: "illegible", mean: ["impossible to read", "unreadable", "cannot be read"],
    clue: "had to ask her to read it aloud",
    why: "you only ask for it aloud when the writing cannot be read" },
  { s: "The settlement was {{remote}}: one road in, no telephone line, and a day's drive to the "
      + "nearest market.",
    word: "remote", mean: ["far away", "far from anywhere", "isolated", "cut off"],
    clue: "a day's drive to the nearest market", why: "a day from the market is a long way from anywhere" },
  { s: "He is the most {{gullible}} boy in the class, and has twice paid good money for a bag of sand.",
    word: "gullible", mean: ["easily fooled", "easily tricked", "believes anything"],
    clue: "twice paid good money for a bag of sand",
    why: "paying for sand, twice, is what being easily tricked costs" },
  { s: "The old bridge is {{precarious}}; the council has fenced it off and posted a man to turn "
      + "people back.",
    word: "precarious", mean: ["unsafe", "likely to fall", "dangerous", "unsteady"],
    clue: "fenced it off and posted a man to turn people back",
    why: "nobody guards a bridge that is safe to cross" },
  { s: "Her reply was {{curt}} — four words, no greeting, and she turned away as she said them.",
    word: "curt", mean: ["short and rude", "abrupt", "brief and unfriendly", "blunt"],
    clue: "four words, no greeting, and she turned away",
    why: "four words with no greeting is shortness you can hear" },
];

/* ── D · DEFINITION ────────────────────────────────────────────────────────*/

const D_EASY = [
  { s: "A {{herbivore}}, an animal that eats only plants, has flat teeth for grinding.",
    word: "herbivore", mean: ["an animal that eats only plants", "a plant eater", "eats only plants"],
    clue: "an animal that eats only plants", why: "the meaning is set between two commas" },
  { s: "The baby zebra is called a {{foal}}, which means a young horse or zebra.",
    word: "foal", mean: ["a young horse", "a young horse or zebra", "a baby horse"],
    clue: "which means a young horse or zebra", why: "the words which means hand you the meaning" },
  { s: "My grandmother keeps her money in a {{calabash}} — a bowl made from a dried gourd.",
    word: "calabash", mean: ["a bowl made from a dried gourd", "a gourd bowl", "a bowl from a gourd"],
    clue: "a bowl made from a dried gourd", why: "the dash is doing the work of the word means" },
  { s: "The desert is {{arid}}, that is, it has almost no rain at all.",
    word: "arid", mean: ["very dry", "with almost no rain", "dry"],
    clue: "that is, it has almost no rain at all", why: "that is tells you a meaning is coming" },
  { s: "Every morning the men mend the {{weir}}, the low wall built across the stream to hold "
      + "the water back.",
    word: "weir", mean: ["a low wall across a stream", "a wall that holds water back", "a low dam"],
    clue: "the low wall built across the stream to hold the water back",
    why: "the words after the comma are the meaning, laid out plainly" },
  { s: "She suffers from {{insomnia}}, which is the inability to sleep.",
    word: "insomnia", mean: ["not being able to sleep", "the inability to sleep", "sleeplessness"],
    clue: "which is the inability to sleep", why: "which is hands you the meaning" },
];

const D_MID = [
  { s: "The letter was written in {{cursive}} — the joined-up writing where the pen hardly "
      + "leaves the page.",
    word: "cursive", mean: ["joined-up writing", "joined up handwriting", "writing that is joined"],
    clue: "the joined-up writing where the pen hardly leaves the page",
    why: "the dash introduces the definition" },
  { s: "Mosquitoes are {{nocturnal}}, meaning they are active at night and rest in the day.",
    word: "nocturnal", mean: ["active at night", "awake at night", "comes out at night"],
    clue: "meaning they are active at night", why: "the word meaning could not be plainer" },
  { s: "A {{tributary}} is a smaller river that runs into a bigger one.",
    word: "tributary", mean: ["a smaller river that runs into a bigger one", "a river that joins a bigger river"],
    clue: "is a smaller river that runs into a bigger one", why: "the sentence is the definition" },
  { s: "He studies {{entomology}}, the study of insects, and keeps beetles in matchboxes.",
    word: "entomology", mean: ["the study of insects", "study of insects"],
    clue: "the study of insects", why: "the meaning sits between the commas" },
  { s: "The soil here is {{fertile}}, which means crops grow well in it without much help.",
    word: "fertile", mean: ["good for growing", "crops grow well in it", "rich"],
    clue: "which means crops grow well in it", why: "which means is the signal" },
  { s: "They carried the water in an {{amphora}}: a tall jar with two handles and a narrow neck.",
    word: "amphora", mean: ["a tall jar with two handles", "a tall two-handled jar", "a jar with two handles"],
    clue: "a tall jar with two handles and a narrow neck", why: "the colon says: here is what it is" },
];

const D_HARD = [
  { s: "The report described a {{moratorium}} — an agreed stop to an activity for a set time — "
      + "on all new building.",
    word: "moratorium", mean: ["an agreed stop for a time", "a temporary halt", "an agreed pause"],
    clue: "an agreed stop to an activity for a set time", why: "the meaning is fenced off by dashes" },
  { s: "She was charged with {{perjury}}, that is, telling lies on oath in a court.",
    word: "perjury", mean: ["lying on oath", "telling lies in court on oath", "lying in court"],
    clue: "that is, telling lies on oath in a court", why: "that is announces the definition" },
  { s: "{{Photosynthesis}} is the process by which a green plant makes its food out of light.",
    word: "Photosynthesis", mean: ["how a plant makes food from light", "a plant making food from light"],
    clue: "is the process by which a green plant makes its food out of light",
    why: "the whole sentence is a definition, hinged on is" },
  { s: "The village keeps a {{granary}}, a building where grain is stored until it is needed.",
    word: "granary", mean: ["a building where grain is stored", "a grain store"],
    clue: "a building where grain is stored", why: "the meaning follows the comma" },
  { s: "He spoke of {{attrition}} — the slow wearing down of a thing by rubbing or by loss.",
    word: "attrition", mean: ["slow wearing down", "wearing away", "gradual wearing down"],
    clue: "the slow wearing down of a thing", why: "the dash hands you the meaning" },
  { s: "A {{sedentary}} life, which means one spent mostly sitting down, is hard on the back.",
    word: "sedentary", mean: ["spent mostly sitting", "sitting down a lot", "not active"],
    clue: "which means one spent mostly sitting down", why: "which means is the signal" },
];

/* ── E · EXAMPLE ───────────────────────────────────────────────────────────*/

const E_EASY = [
  { s: "Bring your {{stationery}} — pens, pencils, a ruler and a rubber.",
    word: "stationery", mean: ["things to write with", "writing things", "writing materials"],
    clue: "pens, pencils, a ruler and a rubber", why: "every example is a thing you write with" },
  { s: "She likes {{citrus}} fruit, such as oranges, lemons and grapefruit.",
    word: "citrus", mean: ["sharp juicy fruit like oranges", "the orange and lemon family", "sour juicy fruit"],
    clue: "such as oranges, lemons and grapefruit", why: "such as always brings examples" },
  { s: "We saw several {{reptiles}} at the park, including a tortoise, a lizard and a snake.",
    word: "reptiles", mean: ["cold-blooded scaly animals", "animals like lizards and snakes", "scaly animals"],
    clue: "including a tortoise, a lizard and a snake", why: "the three examples have scales in common" },
  { s: "Mama grows {{tubers}} behind the house: yam, cassava and sweet potato.",
    word: "tubers", mean: ["roots you can eat", "swollen roots", "root crops"],
    clue: "yam, cassava and sweet potato", why: "all three grow fat underground" },
  { s: "The shop sells {{crockery}} like plates, bowls, cups and saucers.",
    word: "crockery", mean: ["plates and cups", "dishes", "china dishes"],
    clue: "like plates, bowls, cups and saucers", why: "the word like is bringing examples, not a comparison" },
  { s: "Take some {{provisions}} for the journey, for example bread, groundnuts and a bottle of water.",
    word: "provisions", mean: ["food for a journey", "supplies", "food and drink to take"],
    clue: "for example bread, groundnuts and a bottle of water", why: "for example could not be clearer" },
];

const E_MID = [
  { s: "The museum keeps many {{artefacts}}, such as clay pots, iron tools and carved stools.",
    word: "artefacts", mean: ["objects made by people long ago", "old made objects", "things people made"],
    clue: "such as clay pots, iron tools and carved stools",
    why: "the examples are all things somebody made by hand" },
  { s: "Heavy {{precipitation}} — rain, hail, sleet and snow — kept the aircraft on the ground.",
    word: "precipitation", mean: ["water falling from the sky", "rain, hail or snow", "falling wet weather"],
    clue: "rain, hail, sleet and snow", why: "all four fall out of the sky as water" },
  { s: "He plays several {{percussion}} instruments, including the drum, the gong and the shekere.",
    word: "percussion", mean: ["instruments you hit", "struck instruments", "ones you beat or shake"],
    clue: "including the drum, the gong and the shekere", why: "you strike or shake every one of them" },
  { s: "The clinic treats {{ailments}} like coughs, fevers, rashes and bad stomachs.",
    word: "ailments", mean: ["illnesses", "sicknesses", "minor illnesses"],
    clue: "like coughs, fevers, rashes and bad stomachs", why: "every example is something being wrong with you" },
  { s: "Our {{utensils}} are kept in that drawer: spoons, a ladle, a whisk and a peeler.",
    word: "utensils", mean: ["kitchen tools", "tools for cooking", "things you cook with"],
    clue: "spoons, a ladle, a whisk and a peeler", why: "the whole list lives in a kitchen" },
  { s: "She reads {{periodicals}} such as weekly magazines, monthly journals and the Sunday papers.",
    word: "periodicals", mean: ["magazines that come out regularly", "things printed at set times", "magazines and journals"],
    clue: "such as weekly magazines, monthly journals and the Sunday papers",
    why: "weekly, monthly, Sunday — each one comes round again" },
];

const E_HARD = [
  { s: "The treaty listed several {{commodities}} — cocoa, crude oil, tin and timber — on which "
      + "no duty would be paid.",
    word: "commodities", mean: ["goods that are bought and sold", "raw goods for sale", "traded goods"],
    clue: "cocoa, crude oil, tin and timber", why: "all four are raw things traded in bulk" },
  { s: "Certain {{crustaceans}}, such as crabs, prawns and lobsters, are sold at the river market.",
    word: "crustaceans", mean: ["shelled water animals", "animals with a hard shell and legs", "crabs and prawns and the like"],
    clue: "such as crabs, prawns and lobsters", why: "each one wears its skeleton on the outside" },
  { s: "He suffers from {{phobias}} — of heights, of crowds, and of being shut in a small room.",
    word: "phobias", mean: ["strong fears", "unreasonable fears", "fears of certain things"],
    clue: "of heights, of crowds, and of being shut in a small room",
    why: "three things, and all three are feared" },
  { s: "The soup is thickened with {{legumes}}, for instance beans, lentils and groundnuts.",
    word: "legumes", mean: ["plants with seeds in pods", "beans and peas", "pod plants"],
    clue: "for instance beans, lentils and groundnuts", why: "each of the three grows in a pod" },
  { s: "Her {{maladies}} were many: a weak chest, poor sight and a knee that would not bend.",
    word: "maladies", mean: ["illnesses", "complaints", "things wrong with her health"],
    clue: "a weak chest, poor sight and a knee that would not bend",
    why: "the colon introduces three examples, all of them ailments" },
  { s: "The region's {{staples}} — rice, maize, yam and cassava — are eaten at almost every meal.",
    word: "staples", mean: ["main foods", "foods eaten every day", "the basic foods"],
    clue: "rice, maize, yam and cassava", why: "the examples are what people there eat daily" },
];

/* ── A · ANTONYM ───────────────────────────────────────────────────────────*/

const A_EASY = [
  { s: "My brother is {{thrifty}}, but my sister spends every naira she is given.",
    word: "thrifty", mean: ["careful with money", "saving", "does not waste money"],
    clue: "but my sister spends every naira", why: "but warns you the sister is the opposite" },
  { s: "The first dog was {{ferocious}}, unlike the gentle old one asleep by the gate.",
    word: "ferocious", mean: ["fierce", "savage", "very aggressive"],
    clue: "unlike the gentle old one", why: "unlike puts gentle on the other side" },
  { s: "The water in the well is {{murky}}, not clear like the water from the tap.",
    word: "murky", mean: ["cloudy", "not clear", "dirty looking", "muddy"],
    clue: "not clear like the water from the tap", why: "not clear is the opposite, handed over" },
  { s: "She was {{calm}} all through the storm, while everyone else panicked.",
    word: "calm", mean: ["not worried", "peaceful", "steady", "quiet in herself"],
    clue: "while everyone else panicked", why: "while sets her against the panic" },
  { s: "The road out is {{smooth}}, whereas the road in is full of holes.",
    word: "smooth", mean: ["even", "flat", "with no bumps"],
    clue: "whereas the road in is full of holes", why: "whereas is a contrast word" },
  { s: "He is usually {{punctual}}; today, for once, he was twenty minutes late.",
    word: "punctual", mean: ["on time", "never late", "always on time"],
    clue: "today, for once, he was twenty minutes late",
    why: "for once says the lateness is unlike him" },
];

const A_MID = [
  { s: "The first speaker was {{concise}}, but the second took forty minutes to say the same thing.",
    word: "concise", mean: ["short and clear", "brief", "saying it in few words"],
    clue: "but the second took forty minutes to say the same thing",
    why: "forty minutes for the same thing is the opposite of brief" },
  { s: "Her desk is {{immaculate}}, unlike mine, which has not been tidied since term began.",
    word: "immaculate", mean: ["perfectly clean", "spotless", "very tidy"],
    clue: "unlike mine, which has not been tidied since term began",
    why: "unlike sets it against a desk nobody has tidied" },
  { s: "Rather than being {{lenient}}, the new head punished every lateness on the spot.",
    word: "lenient", mean: ["not strict", "gentle in punishing", "easy-going"],
    clue: "Rather than", why: "rather than tells you the head is the other thing" },
  { s: "The soil near the river is rich, but up on the ridge it is {{barren}}.",
    word: "barren", mean: ["nothing grows there", "poor", "bare and empty"],
    clue: "The soil near the river is rich, but", why: "but swings the sentence away from rich" },
  { s: "He looked {{robust}} beside his brother, who had been ill all year.",
    word: "robust", mean: ["strong and healthy", "sturdy", "in good health"],
    clue: "beside his brother, who had been ill all year",
    why: "set beside an ill brother, the word must mean well" },
  { s: "The meeting was {{brief}}; last month's dragged on past midnight.",
    word: "brief", mean: ["short", "quick", "soon over"],
    clue: "last month's dragged on past midnight", why: "the one that dragged on is the opposite" },
];

const A_HARD = [
  { s: "The elder was {{magnanimous}} in victory, where a smaller man would have gloated.",
    word: "magnanimous", mean: ["generous to those he beat", "big-hearted", "generous in spirit"],
    clue: "where a smaller man would have gloated", why: "gloating is what he did NOT do" },
  { s: "Far from being {{frugal}}, the household threw out food every week.",
    word: "frugal", mean: ["careful with what it has", "sparing", "not wasteful"],
    clue: "Far from being", why: "far from being tells you to take the opposite" },
  { s: "His manner was {{brusque}}, in place of the warm welcome we had been promised.",
    word: "brusque", mean: ["abrupt", "short and unfriendly", "blunt"],
    clue: "in place of the warm welcome", why: "it stands where warmth should have been" },
  { s: "The evidence was {{conclusive}}, not the doubtful sort that leaves a court arguing for years.",
    word: "conclusive", mean: ["settles it", "proves it", "leaves no doubt"],
    clue: "not the doubtful sort that leaves a court arguing", why: "not tells you doubtful is the opposite" },
  { s: "She remained {{impartial}} throughout, though both families expected her to take a side.",
    word: "impartial", mean: ["not taking sides", "fair to both", "neutral"],
    clue: "though both families expected her to take a side",
    why: "though says she did not do the expected thing" },
  { s: "The port was {{derelict}} now, instead of the busy harbour his grandfather described.",
    word: "derelict", mean: ["abandoned", "left to fall down", "deserted and ruined"],
    clue: "instead of the busy harbour", why: "instead of swaps in the opposite picture" },
];

/* ── S · SYNONYM ───────────────────────────────────────────────────────────*/

const S_EASY = [
  { s: "The old man was {{feeble}}, so weak that he needed a hand to stand up.",
    word: "feeble", mean: ["weak", "very weak", "without strength"],
    clue: "so weak", why: "weak is sitting right beside it, doing the same job" },
  { s: "Keep the room {{tidy}} — neat, with everything in its place.",
    word: "tidy", mean: ["neat", "in order", "put away properly"],
    clue: "neat", why: "neat is another word for the same thing" },
  { s: "The child looked {{miserable}}, unhappy right through, and would not speak.",
    word: "miserable", mean: ["very unhappy", "unhappy", "sad"],
    clue: "unhappy right through", why: "unhappy is the same word in plainer clothes" },
  { s: "That is a {{vast}} field — huge, bigger than the whole village.",
    word: "vast", mean: ["huge", "very big", "enormous"],
    clue: "huge", why: "huge is set down beside it as the same thing" },
  { s: "He gave a {{hasty}}, quick answer and walked away.",
    word: "hasty", mean: ["quick", "hurried", "done in a rush"],
    clue: "quick", why: "the two words are doing one job" },
  { s: "The air in the store was {{damp}}, or moist, and the salt had gone hard.",
    word: "damp", mean: ["a bit wet", "moist", "slightly wet"],
    clue: "or moist", why: "the word or is offering you another name for it" },
];

const S_MID = [
  { s: "The market was {{bustling}} — busy and noisy from one end to the other.",
    word: "bustling", mean: ["busy", "full of movement", "busy and noisy"],
    clue: "busy and noisy", why: "the dash offers the same idea in easier words" },
  { s: "She was {{candid}} with us, in other words honest, even when it cost her something.",
    word: "candid", mean: ["honest", "open", "frank"],
    clue: "in other words honest", why: "in other words always brings a synonym" },
  { s: "The task was {{arduous}}, or hard going, and took the whole of the afternoon.",
    word: "arduous", mean: ["hard", "difficult", "needing a lot of effort"],
    clue: "or hard going", why: "or hands you the easier word for it" },
  { s: "His explanation was {{lucid}} — clear, and easy to follow all the way through.",
    word: "lucid", mean: ["clear", "easy to understand", "clearly put"],
    clue: "clear, and easy to follow", why: "clear is standing in for it" },
  { s: "The guard was {{vigilant}}, watchful all night, and saw them cross the yard.",
    word: "vigilant", mean: ["watchful", "alert", "keeping careful watch"],
    clue: "watchful all night", why: "watchful means the same and sits beside it" },
  { s: "A {{perpetual}} noise, a never-ending one, came from the generator next door.",
    word: "perpetual", mean: ["never-ending", "going on and on", "constant"],
    clue: "a never-ending one", why: "the second phrase renames the first" },
];

const S_HARD = [
  { s: "Her account was {{veracious}} — truthful in every particular, as the witnesses confirmed.",
    word: "veracious", mean: ["truthful", "true", "telling the truth"],
    clue: "truthful in every particular", why: "truthful is the same word, plainly put" },
  { s: "The chairman was {{taciturn}}, or silent by habit, and spoke only twice in two hours.",
    word: "taciturn", mean: ["saying little", "silent by habit", "not talkative"],
    clue: "or silent by habit", why: "or introduces the synonym" },
  { s: "They set out at a {{languid}}, unhurried pace, as though the day were theirs.",
    word: "languid", mean: ["slow", "unhurried", "without energy"],
    clue: "unhurried", why: "unhurried is doing the same work in the same place" },
  { s: "The paint had a {{lustrous}} finish — glossy, and it caught the light from the window.",
    word: "lustrous", mean: ["shiny", "glossy", "with a shine"],
    clue: "glossy", why: "glossy is the everyday word for it" },
  { s: "He was {{adamant}}, that is to say immovable, and no argument shifted him.",
    word: "adamant", mean: ["refusing to change his mind", "immovable", "firm"],
    clue: "that is to say immovable", why: "that is to say brings the synonym" },
  { s: "A {{prudent}} farmer, a careful one, keeps a third of the harvest back for seed.",
    word: "prudent", mean: ["careful", "wise and careful", "thinking ahead"],
    clue: "a careful one", why: "the phrase after the comma renames him" },
];

const BANK = {
  inference: { gentle: I_EASY, middle: I_MID, stretch: I_HARD },
  definition: { gentle: D_EASY, middle: D_MID, stretch: D_HARD },
  example: { gentle: E_EASY, middle: E_MID, stretch: E_HARD },
  antonym: { gentle: A_EASY, middle: A_MID, stretch: A_HARD },
  synonym: { gentle: S_EASY, middle: S_MID, stretch: S_HARD },
};

/** Every sentence of one clue kind at one level. */
export const bankFor = (kind, tier = "gentle") => (BANK[kind] || {})[tier] || (BANK[kind] || {}).gentle || [];

/** All of them, for the mixed exercise and for the checks. */
export const everyItem = () => Object.entries(BANK)
  .flatMap(([kind, tiers]) => Object.entries(tiers)
    .flatMap(([tier, list]) => list.map((it) => ({ ...it, kind, tier }))));

/** The sentence with its hard word marked up, ready to print. */
export const marked = (s, as = "en-pick") => String(s).replace(/\{\{(.+?)\}\}/g, `<b class="${as}">$1</b>`);
/** The sentence as it is read aloud, with the braces taken off. */
export const plainOf = (s) => String(s).replace(/\{\{(.+?)\}\}/g, "$1");
