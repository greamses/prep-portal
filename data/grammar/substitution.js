/* ═══════════════════════════════════════════════════════
   GRAMMAR — Word Upgrade (the substitution activity).

   The second activity on the Grammar page. Where CUPS is proof-reading, this
   is word choice: a PASSAGE is written with one tired word ("said", "walked",
   "big") appearing about twenty times, and the player upgrades each appearance
   to the most vivid word that fits — reading the whole passage, because the
   CONTEXT is what decides. "said" after a threat is "shouted"; the same "said"
   whispered by a baby's cot is not.

   WHY A PASSAGE, NOT LOOSE SENTENCES. The point of the exercise is that the
   right upgrade depends on what is happening around it — the same tired word
   wants a different vivid word each time. Isolated one-liners throw that away;
   a passage keeps it, and it reads like real writing being improved rather
   than a fill-in-the-blanks drill.

   THE MODEL (why it maps onto the proof-reading score)
   Each appearance (a "slot") lists:
     accept  every vivid word that genuinely fits HERE — any of them is a point
             (the "caught" of proof-reading).
     best    the single sharpest choice — landing it is the bonus point (the
             "tagged"), so a passage of N appearances is out of 2N, exactly like
             a passage of N errors.
   A word changed but fitting nothing is a wrong guess (a "false edit", the
   tiebreak); the tired word left alone is a miss. That shared shape is the
   whole reason the bots, the leaderboard and the results board work for both
   activities untouched (see js/bots.js, js/leaderboard.js).

   THE 20-WORD PALETTE. Every set hands the player the same twenty vivid words
   up front, each with a use-case to READ before playing — the point is to
   learn the shades of meaning, not to guess. Every `best` word is one of the
   twenty; `accept` may also list good synonyms outside the palette, since a
   child who types one should not be marked wrong.

   THE SLOT. `{said}` in the passage marks an appearance; usually the tired
   word, but "{looked at}" when the vivid verb ("examined") should eat the
   preposition too. The player's word replaces the whole brace, so the grammar
   stays right whichever verb they pick. The Nth brace uses the Nth `answers`
   entry — so the answer list is in reading order and must match the braces.
═══════════════════════════════════════════════════════ */

export const SETS = [
  {
    key: 'said',
    dull: 'said',
    label: 'Upgrade “said”',
    blurb: 'Dialogue verbs — the classic “said is dead”.',
    band: [4, 9],
    words: [
      { w: 'shouted', use: 'Say loudly — in anger, or to be heard far off.' },
      { w: 'whispered', use: 'Say very quietly, close to someone, often a secret.' },
      { w: 'muttered', use: 'Say low and unclear, usually cross or grumbling.' },
      { w: 'yelled', use: 'Cry out loudly — fear, excitement or alarm.' },
      { w: 'asked', use: 'Say as a question.' },
      { w: 'replied', use: 'Say in answer to someone.' },
      { w: 'snapped', use: 'Say short and sharp, losing patience.' },
      { w: 'mumbled', use: 'Say under your breath, hard to make out.' },
      { w: 'cried', use: 'Say out loud with strong feeling — joy, fear or pain.' },
      { w: 'groaned', use: 'Say with a low sound of pain, tiredness or dismay.' },
      { w: 'begged', use: 'Ask for something desperately, again and again.' },
      { w: 'announced', use: 'Say clearly and publicly, like news everyone should hear.' },
      { w: 'explained', use: 'Say in order to make something clear.' },
      { w: 'sighed', use: 'Say while breathing out — weary, sad or relieved.' },
      { w: 'boasted', use: 'Say proudly about yourself, showing off.' },
      { w: 'warned', use: 'Say to alert someone to danger.' },
      { w: 'giggled', use: 'Say while laughing lightly.' },
      { w: 'demanded', use: 'Say forcefully, insisting on an answer or action.' },
      { w: 'admitted', use: 'Say a truth you would rather have hidden.' },
      { w: 'suggested', use: 'Put an idea forward gently, not forcing it.' },
    ],
    passage: {
      title: 'The Runaway Goat',
      text: `“Come back here!” {said} Bunmi as the goat bolted down the lane. “It is heading straight for the market,” {said} her brother Tunde, pointing after it. “Keep your voice down, or the trader will hear us,” {said} their mother softly. “I am doing my best,” {said} Bunmi, losing her patience with him. “Please, somebody grab it!” she {said} to the crowd of shoppers.
An old farmer chuckled. “I won first prize with a goat just like that one,” he {said}. “But how did it even get loose?” Tunde {said}. “I must have left the gate open,” Bunmi {said}, staring at the ground. “Then why not drive it towards the wall?” their mother {said}.
“Everyone — the goat is by the yam stall!” a boy {said} to the whole street. “Mind my baskets!” the tomato seller {said} in alarm. “Sorry, so sorry,” Bunmi {said} as the tins rolled everywhere. “Corner it now!” Tunde {said}, refusing to wait a second longer. “My poor tomatoes,” the trader {said}, letting out a long, tired breath. “We will pay for every single one,” their mother {said} calmly.
“Look — it has stopped to eat a cabbage,” Bunmi {said}, and could not help laughing. “Grab it while it chews,” Tunde {said} in a low voice so the goat would not startle. “Got you!” Bunmi {said} at last, holding the rope tight. “Never open that gate again,” her mother {said} firmly. “I promise,” Bunmi {said}, relieved it was finally over.`,
      answers: [
        { accept: ['shouted', 'yelled'], best: 'shouted', why: 'A loud, urgent call after the goat — “shouted”.' },
        { accept: ['warned', 'announced', 'shouted'], best: 'warned', why: 'She is alerting the others to where it is going — “warned”.' },
        { accept: ['whispered', 'muttered', 'mumbled'], best: 'whispered', why: 'Quiet, so the trader will not hear — “whispered”.' },
        { accept: ['snapped', 'muttered'], best: 'snapped', why: 'Short and sharp, losing patience — “snapped”.' },
        { accept: ['begged', 'cried', 'pleaded'], best: 'begged', why: 'Desperate appeal to the crowd — “begged”.' },
        { accept: ['boasted'], best: 'boasted', why: 'Proud showing-off about his own goat — “boasted”.' },
        { accept: ['asked'], best: 'asked', why: 'It is a question — “asked”.' },
        { accept: ['admitted', 'sighed', 'confessed'], best: 'admitted', why: 'Owning up to a fault — “admitted”.' },
        { accept: ['suggested', 'asked'], best: 'suggested', why: 'An idea offered gently — “suggested”.' },
        { accept: ['announced', 'shouted', 'yelled'], best: 'announced', why: 'Told out to the whole street like news — “announced”.' },
        { accept: ['cried', 'yelled', 'shouted'], best: 'cried', why: 'A sharp cry of alarm — “cried”.' },
        { accept: ['mumbled', 'muttered'], best: 'mumbled', why: 'Embarrassed, under the breath — “mumbled”.' },
        { accept: ['demanded', 'snapped'], best: 'demanded', why: 'Forceful, insisting, will not wait — “demanded”.' },
        { accept: ['groaned', 'sighed', 'moaned'], best: 'groaned', why: 'A low sound of dismay over the mess — “groaned”.' },
        { accept: ['replied', 'answered'], best: 'replied', why: 'Answering the trader calmly — “replied”.' },
        { accept: ['giggled', 'laughed'], best: 'giggled', why: 'Said through light laughter — “giggled”.' },
        { accept: ['whispered', 'muttered'], best: 'whispered', why: 'Low, so the goat will not startle — “whispered”.' },
        { accept: ['cried', 'shouted'], best: 'cried', why: 'A triumphant cry as she catches it — “cried”.' },
        { accept: ['warned', 'demanded'], best: 'warned', why: 'Firmly alerting her not to do it again — “warned”.' },
        { accept: ['sighed', 'mumbled', 'replied'], best: 'sighed', why: 'A tired breath of relief — “sighed”.' },
      ],
    },
  },
  {
    key: 'walked',
    dull: 'walked',
    label: 'Upgrade “walked”',
    blurb: 'Ways of moving on foot.',
    band: [4, 10],
    words: [
      { w: 'strode', use: 'Walk with long, confident, purposeful steps.' },
      { w: 'crept', use: 'Move slowly and quietly, trying not to be noticed.' },
      { w: 'marched', use: 'Walk in firm, even steps, like a soldier.' },
      { w: 'wandered', use: 'Walk with no fixed direction, drifting about.' },
      { w: 'stumbled', use: 'Walk unsteadily, tripping or nearly falling.' },
      { w: 'strolled', use: 'Walk in a slow, relaxed, unhurried way.' },
      { w: 'trudged', use: 'Walk slowly and heavily, tired or through hard ground.' },
      { w: 'dashed', use: 'Move very fast for a short burst.' },
      { w: 'tiptoed', use: 'Walk on your toes to stay silent.' },
      { w: 'limped', use: 'Walk unevenly because of a hurt leg or foot.' },
      { w: 'hurried', use: 'Walk quickly because you are short of time.' },
      { w: 'shuffled', use: 'Walk without lifting your feet, dragging them.' },
      { w: 'sprinted', use: 'Run at full speed.' },
      { w: 'paced', use: 'Walk back and forth, restless or worried.' },
      { w: 'staggered', use: 'Walk unsteadily, about to fall — weak or dizzy.' },
      { w: 'crawled', use: 'Move on hands and knees.' },
      { w: 'raced', use: 'Move very fast, as if in a race.' },
      { w: 'plodded', use: 'Walk slowly and steadily with dull, heavy steps.' },
      { w: 'ambled', use: 'Walk slowly and easily, in no hurry at all.' },
      { w: 'darted', use: 'Move suddenly and quickly in a short dash.' },
    ],
    passage: {
      title: 'The Long Way Home',
      text: `The final whistle blew, and the tired team {walked} off the pitch. Their captain {walked} tall, proud of the win, while little Sola {walked} at the back, half asleep on his feet. “We must not miss the bus,” said the captain, and they all {walked} faster.
But the bus had already gone. So they {walked} down the long road with no reason to rush. An old man {walked} past them, leaning heavily on a stick. Near the barracks, two soldiers {walked} in perfect step. A thin cat {walked} silently along the top of a wall.
For a while the friends {walked} beside the river, enjoying the cool air. Then Sola {walked} on unsteady legs and nearly fell into the mud. “This way,” said the captain, who {walked} briskly ahead. They {walked} through the market, drifting between the bright stalls, until the captain {walked} back and forth by the gate, worried about the time.
A toddler {walked} across a doorway on his hands and knees. Worn out now, Sola {walked} up the last hill dragging his feet. “Almost there,” said the captain, and they {walked} quickly to beat the rain. At home at last they {walked} into the yard, and their mother {walked} out to meet them, smiling. One by one, everyone {walked} inside for supper.`,
      answers: [
        { accept: ['trudged', 'plodded'], best: 'trudged', why: 'Heavy, weary steps off the pitch — “trudged”.' },
        { accept: ['strode', 'marched'], best: 'strode', why: 'Long, confident, proud steps — “strode”.' },
        { accept: ['shuffled', 'ambled', 'plodded'], best: 'shuffled', why: 'Dragging his feet, half asleep — “shuffled”.' },
        { accept: ['hurried', 'dashed'], best: 'hurried', why: 'Quick, to catch the bus — “hurried”.' },
        { accept: ['ambled', 'strolled', 'trudged'], best: 'strolled', why: 'Slow and unhurried, no reason to rush — “strolled”.' },
        { accept: ['limped', 'hobbled', 'shuffled'], best: 'limped', why: 'Uneven, leaning on a stick — “limped”.' },
        { accept: ['marched'], best: 'marched', why: 'Firm, even, in-step — “marched”.' },
        { accept: ['crept', 'prowled', 'tiptoed'], best: 'crept', why: 'Slow and silent along the wall — “crept”.' },
        { accept: ['strolled', 'ambled', 'wandered'], best: 'ambled', why: 'Relaxed and easy by the river — “ambled”.' },
        { accept: ['staggered', 'stumbled'], best: 'staggered', why: 'Unsteady, about to fall in the mud — “staggered”.' },
        { accept: ['strode', 'marched'], best: 'strode', why: 'Brisk, purposeful, leading the way — “strode”.' },
        { accept: ['wandered', 'ambled'], best: 'wandered', why: 'Drifting with no fixed path between stalls — “wandered”.' },
        { accept: ['paced'], best: 'paced', why: 'Back and forth, anxious about the time — “paced”.' },
        { accept: ['crawled'], best: 'crawled', why: 'On hands and knees — “crawled”.' },
        { accept: ['trudged', 'plodded', 'shuffled'], best: 'plodded', why: 'Slow, dull, dragging steps up the hill — “plodded”.' },
        { accept: ['hurried', 'dashed', 'raced'], best: 'hurried', why: 'Quick, to beat the rain — “hurried”.' },
        { accept: ['ambled', 'strolled', 'shuffled'], best: 'ambled', why: 'Easy, relieved steps into the yard — “ambled”.' },
        { accept: ['hurried', 'strode', 'dashed'], best: 'hurried', why: 'Quick and eager to greet them — “hurried”.' },
        { accept: ['strolled', 'ambled', 'filed'], best: 'strolled', why: 'Relaxed, one after another, in to supper — “strolled”.' },
      ],
    },
  },
  {
    key: 'ran',
    dull: 'ran',
    label: 'Upgrade “ran”',
    blurb: 'Ways of running.',
    band: [4, 10],
    words: [
      { w: 'sprinted', use: 'Run flat out at top speed, for a short burst.' },
      { w: 'dashed', use: 'Run off suddenly and quickly.' },
      { w: 'raced', use: 'Run as fast as you can, as if in a race.' },
      { w: 'darted', use: 'Move in a sudden, quick, short dash.' },
      { w: 'bolted', use: 'Run off all at once — in fear or to escape.' },
      { w: 'charged', use: 'Run forward hard, to attack or force through.' },
      { w: 'fled', use: 'Run away from danger.' },
      { w: 'galloped', use: 'Run fast with big leaping strides, like a horse.' },
      { w: 'scampered', use: 'Run with light, hurried steps — a child or small animal.' },
      { w: 'hurtled', use: 'Move very fast and out of control.' },
      { w: 'jogged', use: 'Run at a slow, steady, easy pace.' },
      { w: 'scurried', use: 'Run with short quick steps, busy or startled.' },
      { w: 'rushed', use: 'Move fast because you are in a hurry.' },
      { w: 'tore', use: 'Run very fast and recklessly — “tore down the road”.' },
      { w: 'streaked', use: 'Run so fast you are a blur.' },
      { w: 'bounded', use: 'Run in big, springing leaps.' },
      { w: 'pelted', use: 'Run at full pelt — very fast, usually in a rush.' },
      { w: 'zoomed', use: 'Move very fast, with speed to spare.' },
      { w: 'trotted', use: 'Run gently and easily, a little faster than walking.' },
      { w: 'careered', use: 'Rush along fast and out of control.' },
    ],
    passage: {
      title: 'Sports Day Chaos',
      text: `The starting gun cracked, and the runners {ran} off the line. Ade {ran} so fast in the first few metres that he was almost a blur, while the others {ran} hard behind him to catch up.
Then, out of nowhere, a stray dog {ran} onto the track. It {ran} in wild circles, completely out of control, and the crowd gasped as it {ran} straight at the long-jump pit. Two teachers {ran} after it, waving their arms. A small boy {ran} lightly across the grass to help, but the dog {ran} away from him towards the open gate.
“Shut it!” someone shouted, and the caretaker {ran} to block the way. The dog {ran} in great leaps over a bench and then {ran} down the road with the boy close behind. A frightened mouse {ran} under the wooden stands. In the next field a horse {ran} along the fence, excited by all the noise.
By now Ade had slowed and {ran} the last stretch at an easy pace. At the junction the dog {ran} across the road and back again. Finally, tired out, it {ran} in a slow, happy circle. The boy {ran} the last few steps and caught its collar. Cheering, they {ran} back together to the field, where the teacher waved them in to reset the whole race.`,
      answers: [
        { accept: ['sprinted', 'dashed', 'raced'], best: 'sprinted', why: 'Flat-out off the starting line — “sprinted”.' },
        { accept: ['streaked', 'sprinted', 'raced'], best: 'streaked', why: 'So fast he is a blur — “streaked”.' },
        { accept: ['raced', 'charged', 'sprinted'], best: 'raced', why: 'Running all-out to catch up — “raced”.' },
        { accept: ['darted', 'bolted'], best: 'darted', why: 'A sudden dash onto the track — “darted”.' },
        { accept: ['careered', 'hurtled'], best: 'careered', why: 'Wild circles, out of control — “careered”.' },
        { accept: ['charged', 'hurtled', 'bolted'], best: 'charged', why: 'Driving straight at the pit — “charged”.' },
        { accept: ['rushed', 'dashed', 'raced'], best: 'rushed', why: 'Hurrying after the dog — “rushed”.' },
        { accept: ['scampered'], best: 'scampered', why: 'Light, hurried steps — a small boy — “scampered”.' },
        { accept: ['fled', 'bolted'], best: 'fled', why: 'Running away from him — “fled”.' },
        { accept: ['sprinted', 'dashed', 'raced'], best: 'dashed', why: 'A quick burst to block the gate — “dashed”.' },
        { accept: ['bounded', 'galloped', 'leapt'], best: 'bounded', why: 'Big springing leaps over the bench — “bounded”.' },
        { accept: ['tore', 'pelted', 'careered'], best: 'tore', why: 'Reckless, at speed, down the road — “tore”.' },
        { accept: ['scurried', 'darted'], best: 'scurried', why: 'Short quick startled steps — “scurried”.' },
        { accept: ['galloped', 'trotted'], best: 'galloped', why: 'Fast leaping strides, horse-style — “galloped”.' },
        { accept: ['jogged', 'trotted'], best: 'jogged', why: 'Easy, steady pace at the end — “jogged”.' },
        { accept: ['darted', 'bolted'], best: 'darted', why: 'Quick, this way and that at the junction — “darted”.' },
        { accept: ['trotted'], best: 'trotted', why: 'A gentle, happy pace once tired — “trotted”.' },
        { accept: ['dashed', 'sprinted'], best: 'dashed', why: 'A last quick burst to catch it — “dashed”.' },
        { accept: ['jogged', 'trotted'], best: 'trotted', why: 'An easy pace back together — “trotted”.' },
      ],
    },
  },
  {
    key: 'looked',
    dull: 'looked',
    label: 'Upgrade “looked”',
    blurb: 'Ways of seeing and looking.',
    band: [5, 12],
    words: [
      { w: 'glared', use: 'Look angrily and hard at someone.' },
      { w: 'peered', use: 'Look closely, straining to see — dim or far off.' },
      { w: 'stared', use: 'Look for a long time without looking away.' },
      { w: 'glanced', use: 'Look quickly, for just a moment.' },
      { w: 'gazed', use: 'Look long and steadily, often in wonder.' },
      { w: 'watched', use: 'Look at something as it moves or happens (no “at”).' },
      { w: 'examined', use: 'Look closely to find out details (no “at”).' },
      { w: 'spotted', use: 'Suddenly see or pick out something (no “at”).' },
      { w: 'studied', use: 'Look at carefully and thoroughly (no “at”).' },
      { w: 'observed', use: 'Watch closely to learn or notice (no “at”).' },
      { w: 'scanned', use: 'Look over quickly, searching (no “at”).' },
      { w: 'glimpsed', use: 'See for only a split second (no “at”).' },
      { w: 'squinted', use: 'Look with half-shut eyes, against light or tiny print.' },
      { w: 'spied', use: 'Catch sight of something, often far off (no “at”).' },
      { w: 'gaped', use: 'Look with your mouth open, amazed or shocked.' },
      { w: 'inspected', use: 'Look over carefully and officially (no “at”).' },
      { w: 'noticed', use: 'Become aware of something (no “at”).' },
      { w: 'eyed', use: 'Look at with suspicion or longing (no “at”).' },
      { w: 'surveyed', use: 'Look over a whole wide scene (no “at”).' },
      { w: 'scowled', use: 'Look with an angry, bad-tempered frown.' },
    ],
    passage: {
      title: 'The Museum Trip',
      text: `The class filed in and {looked} up at the huge dinosaur skeleton in wonder. Miss Ada {looked at} the whole group to count them quickly. Tunde {looked} closely at a tiny insect trapped in amber. “Do not touch anything,” warned the guard, who {looked} sternly at the smallest boy.
Bunmi {looked at} an old map for a long time, learning every river. She {looked} briefly at her watch, worried they were late. From the high balcony the children {looked at} the whole city spread out below. In the science room a scientist {looked at} a piece of rock under a bright lens.
For only a second Sola {looked at} a secret door before it swung shut. When the magician appeared, the whole class {looked} at him, mouths wide open. Miss Ada {looked at} something odd on a shelf and frowned. Tunde {looked at} the busy hall and picked out his friend at once.
The guard {looked at} a heavy bag with clear suspicion. Through the dusty glass Bunmi {looked} to make out a faded painting. They {looked at} the goldfish going round and round its bowl. The teacher {looked at} the timetable one more time. On the way out, Bunmi {looked} back at the dinosaur, and a pigeon on the roof {looked} down at them all as they {looked at} the exit sign and hurried into the sun.`,
      answers: [
        { accept: ['gazed', 'stared'], best: 'gazed', why: 'A long look of wonder — “gazed” (up at).' },
        { accept: ['scanned', 'surveyed'], best: 'scanned', why: 'A quick sweep to count them — “scanned the group”.' },
        { accept: ['peered', 'squinted'], best: 'peered', why: 'Straining to see something tiny — “peered” (at).' },
        { accept: ['glared', 'scowled'], best: 'glared', why: 'A hard, stern, angry look — “glared” (at).' },
        { accept: ['studied', 'examined'], best: 'studied', why: 'Careful, thorough learning — “studied the map”.' },
        { accept: ['glanced'], best: 'glanced', why: 'A one-moment look at her watch — “glanced” (at).' },
        { accept: ['surveyed', 'observed', 'scanned'], best: 'surveyed', why: 'Taking in a whole wide scene — “surveyed the city”.' },
        { accept: ['examined', 'inspected', 'studied'], best: 'examined', why: 'Close inspection for detail — “examined the rock”.' },
        { accept: ['glimpsed', 'spotted'], best: 'glimpsed', why: 'Seen for only a split second — “glimpsed the door”.' },
        { accept: ['gaped', 'stared'], best: 'gaped', why: 'Mouths wide, amazed — “gaped” (at).' },
        { accept: ['noticed', 'spotted', 'eyed'], best: 'noticed', why: 'Became aware of something odd — “noticed something”.' },
        { accept: ['spotted', 'scanned'], best: 'spotted', why: 'Picked his friend out of the crowd — “spotted his friend”.' },
        { accept: ['eyed', 'inspected'], best: 'eyed', why: 'A suspicious look at the bag — “eyed the bag”.' },
        { accept: ['peered', 'squinted', 'strained'], best: 'squinted', why: 'Half-shut eyes through dusty glass — “squinted”.' },
        { accept: ['watched', 'observed'], best: 'watched', why: 'Following the fish as it moves — “watched the goldfish”.' },
        { accept: ['studied', 'examined', 'checked'], best: 'studied', why: 'Careful re-reading of the timetable — “studied the timetable”.' },
        { accept: ['glanced', 'gazed'], best: 'glanced', why: 'A quick look back — “glanced” (back at).' },
        { accept: ['stared', 'gazed', 'peered'], best: 'stared', why: 'A long, fixed look down — “stared” (down at).' },
        { accept: ['spotted', 'noticed'], best: 'noticed', why: 'Caught sight of the exit sign — “noticed the exit sign”.' },
      ],
    },
  },
  {
    key: 'adjectives',
    dull: 'big / good / nice',
    label: 'Tired adjectives',
    blurb: 'Swap “big”, “good” and “nice” for a word that means it.',
    band: [4, 10],
    words: [
      { w: 'enormous', use: 'Extremely large in size.' },
      { w: 'gigantic', use: 'So large it is almost hard to believe.' },
      { w: 'massive', use: 'Huge and heavy — great in bulk.' },
      { w: 'towering', use: 'Very tall, rising high above.' },
      { w: 'vast', use: 'Huge in area or extent — a field, a crowd.' },
      { w: 'tiny', use: 'Extremely small.' },
      { w: 'excellent', use: 'Extremely good in quality.' },
      { w: 'superb', use: 'Wonderfully good — a top performance or view.' },
      { w: 'brilliant', use: 'Very clever, or wonderfully good.' },
      { w: 'outstanding', use: 'So good it stands out from the rest.' },
      { w: 'impressive', use: 'Good enough to make people admire it.' },
      { w: 'delicious', use: 'Tasting extremely good.' },
      { w: 'kind', use: 'Caring and warm towards other people.' },
      { w: 'generous', use: 'Happy to give and share freely.' },
      { w: 'gentle', use: 'Soft and careful, never rough.' },
      { w: 'thoughtful', use: 'Caring about what others need or feel.' },
      { w: 'friendly', use: 'Warm and easy to get along with.' },
      { w: 'delightful', use: 'So pleasant it brings real joy.' },
      { w: 'pleasant', use: 'Nice in a mild, agreeable way.' },
      { w: 'cheerful', use: 'Bright and full of good spirits.' },
    ],
    passage: {
      title: 'The Village Fair',
      text: `The fair was held in a {big} field at the edge of town. In the middle stood a {big} tent, taller than the church, and by lunchtime a {big} crowd was pushing towards the stalls. The jollof rice smelled {good}, and Mama Nkechi, who ran the food stall, was a {nice} woman. She was always {nice} enough to share, and she stirred a {big} pot of soup that fed half the village.
Above the games a {big} elephant balloon floated on its rope. A band played {good} music while a {good} juggler tossed ten balls at once. The clown was so {good} that he had everyone laughing. It was a {nice} afternoon, warm and calm, and the older children were {nice} to the little ones.
A {big} prize sat on the top shelf of the coconut game. Ade gave a {good} performance on the drums, and his friend was {nice} and cheered him on. The view from the ferris wheel was {good}, right across the town. Beside the games a {big} tower of tins waited to be knocked down. Everyone agreed they had a {nice} time, and Papa said it was a {good} day — the best of the whole year.`,
      answers: [
        { accept: ['vast', 'enormous', 'huge'], best: 'vast', why: 'A wide, open field — “vast”.' },
        { accept: ['towering', 'massive', 'enormous'], best: 'towering', why: 'Tall, rising above the church — “towering”.' },
        { accept: ['enormous', 'vast', 'huge'], best: 'enormous', why: 'A very large crowd — “enormous”.' },
        { accept: ['delicious', 'wonderful', 'tasty'], best: 'delicious', why: 'Food that smells wonderful — “delicious”.' },
        { accept: ['kind', 'friendly', 'thoughtful'], best: 'kind', why: 'Warm and caring — “kind”.' },
        { accept: ['generous', 'kind', 'thoughtful'], best: 'generous', why: 'Happy to give and share — “generous”.' },
        { accept: ['massive', 'enormous', 'huge'], best: 'massive', why: 'A huge, heavy pot — “massive”.' },
        { accept: ['gigantic', 'enormous', 'huge'], best: 'gigantic', why: 'An unbelievably large balloon — “gigantic”.' },
        { accept: ['superb', 'excellent', 'wonderful'], best: 'superb', why: 'Wonderfully good music — “superb”.' },
        { accept: ['impressive', 'brilliant', 'skilful'], best: 'impressive', why: 'Ten balls at once — makes you admire it — “impressive”.' },
        { accept: ['brilliant', 'delightful', 'hilarious'], best: 'delightful', why: 'So good he brings joy and laughter — “delightful”.' },
        { accept: ['pleasant', 'delightful', 'lovely'], best: 'pleasant', why: 'Mild, warm, agreeable — “pleasant”.' },
        { accept: ['kind', 'gentle', 'thoughtful'], best: 'thoughtful', why: 'Caring about the little ones — “thoughtful”.' },
        { accept: ['enormous', 'gigantic', 'huge'], best: 'gigantic', why: 'A huge prize — “gigantic”.' },
        { accept: ['outstanding', 'excellent', 'superb'], best: 'outstanding', why: 'A performance that stood out — “outstanding”.' },
        { accept: ['friendly', 'kind', 'cheerful'], best: 'friendly', why: 'Warm and easy, cheering him on — “friendly”.' },
        { accept: ['superb', 'impressive', 'wonderful'], best: 'impressive', why: 'A view that makes you admire it — “impressive”.' },
        { accept: ['towering', 'massive', 'huge'], best: 'massive', why: 'A big, bulky tower of tins — “massive”.' },
        { accept: ['delightful', 'wonderful', 'pleasant'], best: 'delightful', why: 'A time full of real joy — “delightful”.' },
        { accept: ['excellent', 'wonderful', 'superb'], best: 'excellent', why: 'The best day of the year — “excellent”.' },
      ],
    },
  },
];

export const SET_KEYS = SETS.map((s) => s.key);
export const setMeta = (key) => SETS.find((s) => s.key === key) || null;

/** Sets written for a grade, in registry order. */
export function setsForGrade(grade) {
  return SETS.filter((s) => grade >= s.band[0] && grade <= s.band[1]);
}

export const normWord = (s) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z]/g, '');

/* ── Parsing a passage ─────────────────────────────────────────────────────
   The passage text is split into a flat list of parts, in reading order:
     { type: 'text', s }                                a run of clean prose
     { type: 'slot', idx, dull, accept, best, why }     one appearance to upgrade
   The Nth `{...}` marker takes the Nth `answers` entry — so the answer list is
   authored in reading order and must be the same length as the brace count. */
const SLOT_RE = /\{([^}]*)\}/g;
export function parsePassage(set) {
  const p = set.passage;
  const parts = [];
  let last = 0; let idx = 0; let m;
  SLOT_RE.lastIndex = 0;
  while ((m = SLOT_RE.exec(p.text))) {
    if (m.index > last) parts.push({ type: 'text', s: p.text.slice(last, m.index) });
    const ans = p.answers[idx] || { accept: [], best: '', why: '' };
    parts.push({ type: 'slot', idx, dull: m[1], accept: ans.accept, best: ans.best, why: ans.why });
    idx += 1;
    last = m.index + m[0].length;
  }
  if (last < p.text.length) parts.push({ type: 'text', s: p.text.slice(last) });
  return { title: p.title, parts, count: idx };
}

/** Just the slots of a parsed passage, in order — the scorable items. */
export const slotsOf = (parsed) => parsed.parts.filter((x) => x.type === 'slot');

/* ── Scoring one answer ────────────────────────────────────────────────────
   Mirrors proof-reading's four outcomes so the leaderboard is untouched:
     caught      the word fits HERE (∈ accept)     → +1
     best        the word is THE best (=== best)   → +1 more (bonus)
     wrong-fix   changed, but fits nothing here    → a false edit
     missed      left as the tired word / blank    → nothing
*/
export function judge(answer, slot) {
  const a = normWord(answer);
  const dull = normWord(String(slot.dull).replace(/\s+/g, ' ').split(' ')[0]); // "looked at" → "looked"
  const accept = (slot.accept || []).map(normWord);
  const isBest = a === normWord(slot.best);
  if (!a || a === dull) return { outcome: 'missed', caught: false, best: false };
  if (accept.includes(a)) return { outcome: 'caught', caught: true, best: isBest };
  return { outcome: 'wrong-fix', caught: false, best: false };
}

/** A whole passage → the SAME result shape proof-reading returns. */
export function scoreUpgrade(slots, answers) {
  const detail = [];
  let caught = 0; let best = 0; let wrong = 0; let missed = 0;
  slots.forEach((slot, i) => {
    const answer = answers[i] != null ? answers[i] : '';
    const j = judge(answer, slot);
    if (j.outcome === 'caught') { caught += 1; if (j.best) best += 1; }
    else if (j.outcome === 'wrong-fix') wrong += 1;
    else missed += 1;
    detail.push({ i, outcome: j.outcome, best: j.best, submitted: answer, slot });
  });
  return {
    score: caught + best,          // out of slots.length × 2, like a passage
    caught,
    tagged: best,                  // "best word" reuses the tagged slot
    wrongFix: wrong,
    missed,
    falseEdits: wrong,             // wrong guesses are the tiebreak, as in CUPS
    errorTotal: slots.length,
    maxScore: slots.length * 2,
    byCat: {},                     // no CUPS breakdown for this activity
    detail,
  };
}
