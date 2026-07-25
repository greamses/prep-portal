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
      { w: 'shouted', use: 'Say loudly — in anger, or to be heard far off.', ex: '“Get back!” she shouted.' },
      { w: 'whispered', use: 'Say very quietly, close to someone, often a secret.', ex: '“It’s a secret,” he whispered.' },
      { w: 'muttered', use: 'Say low and unclear, usually cross or grumbling.', ex: 'He muttered crossly to himself.' },
      { w: 'yelled', use: 'Cry out loudly — fear, excitement or alarm.', ex: '“Watch out!” she yelled.' },
      { w: 'asked', use: 'Say as a question.', ex: '“What time is it?” he asked.' },
      { w: 'replied', use: 'Say in answer to someone.', ex: '“Yes, I will,” she replied.' },
      { w: 'snapped', use: 'Say short and sharp, losing patience.', ex: '“Leave me alone!” he snapped.' },
      { w: 'mumbled', use: 'Say under your breath, hard to make out.', ex: 'He mumbled something no one caught.' },
      { w: 'cried', use: 'Say out loud with strong feeling — joy, fear or pain.', ex: '“We won!” she cried with joy.' },
      { w: 'groaned', use: 'Say with a low sound of pain, tiredness or dismay.', ex: '“My head hurts,” he groaned.' },
      { w: 'begged', use: 'Ask for something desperately, again and again.', ex: '“Please help me,” she begged.' },
      { w: 'announced', use: 'Say clearly and publicly, like news everyone should hear.', ex: '“The winner is Ada!” he announced.' },
      { w: 'explained', use: 'Say in order to make something clear.', ex: 'She explained how the trick worked.' },
      { w: 'sighed', use: 'Say while breathing out — weary, sad or relieved.', ex: '“What a day,” he sighed.' },
      { w: 'boasted', use: 'Say proudly about yourself, showing off.', ex: '“I’m the best,” he boasted.' },
      { w: 'warned', use: 'Say to alert someone to danger.', ex: '“Mind the step,” she warned.' },
      { w: 'giggled', use: 'Say while laughing lightly.', ex: '“That tickles!” she giggled.' },
      { w: 'demanded', use: 'Say forcefully, insisting on an answer or action.', ex: '“Give it back now!” he demanded.' },
      { w: 'admitted', use: 'Say a truth you would rather have hidden.', ex: '“It was my fault,” she admitted.' },
      { w: 'suggested', use: 'Put an idea forward gently, not forcing it.', ex: '“Shall we rest?” he suggested.' },
    ],
    passage: {
      title: 'The Runaway Goat',
      text: `“Come back here!” Bunmi {said} as the goat bolted down the lane. “It is going to knock over the stalls,” {said} her brother Tunde, pointing ahead. “Keep quiet, or the trader will notice,” their mother {said} softly. “Stop telling me what to do!” Bunmi {said}, out of patience. “Please, please help me catch it,” she {said} to the shoppers.
An old farmer chuckled. “My goat once won first prize, you know,” he {said}. “But how did it even get loose?” Tunde {said}. “I forgot to lock the gate,” Bunmi {said}, staring at the ground. “Why not chase it towards the wall?” their mother {said}.
“The goat is at the yam stall!” a boy {said} to the whole street. “Watch my baskets!” the tomato seller {said} as the tins toppled. “Sorry… so sorry,” Bunmi {said} under her breath. “Corner it this instant!” Tunde {said}, refusing to wait. “All my lovely tomatoes,” the trader {said}, with a long, tired breath. “We will pay for the damage,” their mother {said}.
“It has stopped to eat a cabbage!” Bunmi {said}, unable to keep a straight face. “Move slowly now,” Tunde {said} in a low voice, so the goat would not startle. “Got you at last!” Bunmi {said} in triumph. “You hold a goat by its horns, like this,” the farmer {said}, showing them how. “I will never leave that gate open again,” Bunmi {said}, glad it was over.`,
      answers: [
        { accept: ['shouted', 'yelled'], best: 'shouted', why: 'A loud, urgent call after the goat — “shouted”.' },
        { accept: ['warned', 'cried'], best: 'warned', why: 'Alerting the others to the danger to the stalls — “warned”.' },
        { accept: ['whispered', 'muttered'], best: 'whispered', why: 'Quiet, so the trader will not notice — “whispered”.' },
        { accept: ['snapped', 'muttered'], best: 'snapped', why: 'Short and sharp, out of patience — “snapped”.' },
        { accept: ['begged', 'pleaded'], best: 'begged', why: 'A desperate, repeated appeal — “begged”.' },
        { accept: ['boasted'], best: 'boasted', why: 'Proud showing-off about his own goat — “boasted”.' },
        { accept: ['asked'], best: 'asked', why: 'It is a question — “asked”.' },
        { accept: ['admitted', 'confessed'], best: 'admitted', why: 'Owning up to a fault — “admitted”.' },
        { accept: ['suggested'], best: 'suggested', why: 'An idea offered gently — “suggested”.' },
        { accept: ['announced', 'shouted'], best: 'announced', why: 'Told out to the whole street like news — “announced”.' },
        { accept: ['cried', 'yelled'], best: 'cried', why: 'A sharp cry of alarm — “cried”.' },
        { accept: ['mumbled'], best: 'mumbled', why: 'Embarrassed, under the breath — “mumbled”.' },
        { accept: ['demanded'], best: 'demanded', why: 'Forceful, insisting, will not wait — “demanded”.' },
        { accept: ['groaned', 'moaned'], best: 'groaned', why: 'A low sound of dismay over the mess — “groaned”.' },
        { accept: ['replied', 'answered'], best: 'replied', why: 'Answering the trader — “replied”.' },
        { accept: ['giggled', 'laughed'], best: 'giggled', why: 'Unable to keep a straight face — “giggled”.' },
        { accept: ['muttered'], best: 'muttered', why: 'A low, wary voice so the goat stays calm — “muttered”.' },
        { accept: ['yelled', 'shouted'], best: 'yelled', why: 'A loud shout of triumph — “yelled”.' },
        { accept: ['explained', 'showed'], best: 'explained', why: 'Making clear how to hold a goat — “explained”.' },
        { accept: ['sighed'], best: 'sighed', why: 'A tired breath of relief — “sighed”.' },
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
      { w: 'strode', use: 'Walk with long, confident, purposeful steps.', ex: 'She strode confidently onto the stage.' },
      { w: 'crept', use: 'Move slowly and quietly, trying not to be noticed.', ex: 'He crept quietly past the guard.' },
      { w: 'marched', use: 'Walk in firm, even steps, like a soldier.', ex: 'The soldiers marched down the road.' },
      { w: 'wandered', use: 'Walk with no fixed direction, drifting about.', ex: 'They wandered around the old town.' },
      { w: 'stumbled', use: 'Walk unsteadily, tripping or nearly falling.', ex: 'He stumbled over a loose brick.' },
      { w: 'strolled', use: 'Walk in a slow, relaxed, unhurried way.', ex: 'We strolled along the beach.' },
      { w: 'trudged', use: 'Walk slowly and heavily, tired or through hard ground.', ex: 'They trudged home through the mud.' },
      { w: 'dashed', use: 'Move very fast for a short burst.', ex: 'She dashed across the busy road.' },
      { w: 'tiptoed', use: 'Walk on your toes to stay silent.', ex: 'He tiptoed into the quiet room.' },
      { w: 'limped', use: 'Walk unevenly because of a hurt leg or foot.', ex: 'She limped off the pitch, hurt.' },
      { w: 'hurried', use: 'Walk quickly because you are short of time.', ex: 'He hurried to catch the bus.' },
      { w: 'shuffled', use: 'Walk without lifting your feet, dragging them.', ex: 'The old man shuffled to his chair.' },
      { w: 'sprinted', use: 'Run at full speed.', ex: 'She sprinted the last hundred metres.' },
      { w: 'paced', use: 'Walk back and forth, restless or worried.', ex: 'He paced the room, worried.' },
      { w: 'staggered', use: 'Walk unsteadily, about to fall — weak or dizzy.', ex: 'She staggered, dizzy, to the door.' },
      { w: 'crawled', use: 'Move on hands and knees.', ex: 'The baby crawled under the table.' },
      { w: 'raced', use: 'Move very fast, as if in a race.', ex: 'They raced each other to the gate.' },
      { w: 'plodded', use: 'Walk slowly and steadily with dull, heavy steps.', ex: 'The tired horse plodded up the hill.' },
      { w: 'ambled', use: 'Walk slowly and easily, in no hurry at all.', ex: 'He ambled slowly through the park.' },
      { w: 'darted', use: 'Move suddenly and quickly in a short dash.', ex: 'She darted between the parked cars.' },
    ],
    passage: {
      title: 'The Long Way Home',
      text: `The final whistle blew, and the tired team {walked} off the pitch. Their captain {walked} tall, proud of the win, while little Sola {walked} at the back, half asleep on his feet. “We must not miss the bus,” said the captain, and they all {walked} faster.
But the bus had already gone. So they {walked} down the long road with no reason to rush. An old man {walked} past them, leaning heavily on a stick. Near the barracks, two soldiers {walked} in perfect step. A thin cat {walked} silently along the top of a wall.
The friends {walked} beside the cool river, in no hurry. Then Sola {walked} on unsteady legs and nearly fell into the mud. “This way,” said the captain, who {walked} ahead to check the corner. They {walked} through the market, drifting between the bright stalls, until the captain {walked} back and forth by the gate, worried about the time.
A stray dog {walked} suddenly across their path. Startled, Sola {walked} into a low stone and almost went over. They {walked} past a sleeping guard on their toes so as not to wake him. A toddler {walked} across a doorway on his hands and knees. Worn out now, Sola {walked} up the last hill dragging his feet, and a boy {walked} past them at a full run to beat the coming rain.`,
      answers: [
        { accept: ['trudged', 'plodded'], best: 'trudged', why: 'Heavy, weary steps off the pitch — “trudged”.' },
        { accept: ['strode', 'marched'], best: 'strode', why: 'Long, confident, proud steps — “strode”.' },
        { accept: ['shuffled', 'plodded'], best: 'shuffled', why: 'Dragging his feet, half asleep — “shuffled”.' },
        { accept: ['hurried', 'dashed'], best: 'hurried', why: 'Quick, to catch the bus — “hurried”.' },
        { accept: ['strolled', 'ambled'], best: 'strolled', why: 'Slow and unhurried, no reason to rush — “strolled”.' },
        { accept: ['limped', 'hobbled'], best: 'limped', why: 'Uneven, leaning on a stick — “limped”.' },
        { accept: ['marched'], best: 'marched', why: 'Firm, even, in-step — “marched”.' },
        { accept: ['crept', 'prowled'], best: 'crept', why: 'Slow and silent along the wall — “crept”.' },
        { accept: ['ambled', 'wandered'], best: 'ambled', why: 'Relaxed and easy by the river — “ambled”.' },
        { accept: ['staggered'], best: 'staggered', why: 'Unsteady, about to fall in the mud — “staggered”.' },
        { accept: ['dashed', 'darted'], best: 'dashed', why: 'A quick burst ahead to check the corner — “dashed”.' },
        { accept: ['wandered'], best: 'wandered', why: 'Drifting with no fixed path between stalls — “wandered”.' },
        { accept: ['paced'], best: 'paced', why: 'Back and forth, anxious about the time — “paced”.' },
        { accept: ['darted', 'bolted'], best: 'darted', why: 'A sudden, quick move across the path — “darted”.' },
        { accept: ['stumbled', 'tripped'], best: 'stumbled', why: 'Caught his foot and nearly fell — “stumbled”.' },
        { accept: ['tiptoed'], best: 'tiptoed', why: 'On their toes, silent, past the guard — “tiptoed”.' },
        { accept: ['crawled'], best: 'crawled', why: 'On hands and knees — “crawled”.' },
        { accept: ['plodded', 'trudged'], best: 'plodded', why: 'Slow, dull, dragging steps up the hill — “plodded”.' },
        { accept: ['sprinted', 'raced', 'ran'], best: 'sprinted', why: 'At a full run to beat the rain — “sprinted”.' },
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
      { w: 'sprinted', use: 'Run flat out at top speed, for a short burst.', ex: 'She sprinted the last hundred metres.' },
      { w: 'dashed', use: 'Run off suddenly and quickly.', ex: 'She dashed across the busy road.' },
      { w: 'raced', use: 'Run as fast as you can, as if in a race.', ex: 'They raced each other to the gate.' },
      { w: 'darted', use: 'Move in a sudden, quick, short dash.', ex: 'She darted between the parked cars.' },
      { w: 'bolted', use: 'Run off all at once — in fear or to escape.', ex: 'The horse bolted at the loud bang.' },
      { w: 'charged', use: 'Run forward hard, to attack or force through.', ex: 'The bull charged at the fence.' },
      { w: 'fled', use: 'Run away from danger.', ex: 'The thieves fled from the police.' },
      { w: 'galloped', use: 'Run fast with big leaping strides, like a horse.', ex: 'The horse galloped across the field.' },
      { w: 'scampered', use: 'Run with light, hurried steps — a child or small animal.', ex: 'The puppy scampered after the ball.' },
      { w: 'hurtled', use: 'Move very fast and out of control.', ex: 'The car hurtled down the hill.' },
      { w: 'jogged', use: 'Run at a slow, steady, easy pace.', ex: 'She jogged around the park each morning.' },
      { w: 'scurried', use: 'Run with short quick steps, busy or startled.', ex: 'The mice scurried into their hole.' },
      { w: 'rushed', use: 'Move fast because you are in a hurry.', ex: 'He rushed to the hospital.' },
      { w: 'tore', use: 'Run very fast and recklessly — “tore down the road”.', ex: 'She tore down the street, late.' },
      { w: 'streaked', use: 'Run so fast you are a blur.', ex: 'The runner streaked past everyone.' },
      { w: 'bounded', use: 'Run in big, springing leaps.', ex: 'The dog bounded over the wall.' },
      { w: 'pelted', use: 'Run at full pelt — very fast, usually in a rush.', ex: 'They pelted home through the rain.' },
      { w: 'zoomed', use: 'Move very fast, with speed to spare.', ex: 'The motorbike zoomed past us.' },
      { w: 'trotted', use: 'Run gently and easily, a little faster than walking.', ex: 'The pony trotted round the ring.' },
      { w: 'careered', use: 'Rush along fast and out of control.', ex: 'The trolley careered into the wall.' },
    ],
    passage: {
      title: 'Sports Day Chaos',
      text: `The starting gun cracked, and the runners {ran} off the line. Ade {ran} so fast in the first few metres that he was almost a blur, while the others {ran} hard behind him to catch up.
Then, out of nowhere, a stray dog {ran} onto the track. It {ran} in wild circles, completely out of control, and the crowd gasped as it {ran} straight at the long-jump pit. Two teachers {ran} after it, waving their arms. A small boy {ran} lightly across the grass to help, but the dog {ran} away from him towards the open gate.
“Shut it!” someone shouted, and the caretaker {ran} to block the way. The dog {ran} in great leaps over a bench and then {ran} down the road, reckless and fast. A frightened mouse {ran} under the wooden stands. In the next field a horse {ran} along the fence, excited by all the noise.
A rabbit {ran} out of a bush in fright. Higher up the hill a loose cart {ran} down the slope with no one at the reins. As thunder rumbled, the little ones {ran} home through the sudden rain, and a cyclist {ran} past the crowd in a flash. By now Ade had slowed and {ran} the last stretch at an easy pace. Finally, worn out, the dog {ran} in a slow, happy circle, and the boy caught its collar at last.`,
      answers: [
        { accept: ['sprinted', 'dashed', 'raced'], best: 'sprinted', why: 'Flat-out off the starting line — “sprinted”.' },
        { accept: ['streaked'], best: 'streaked', why: 'So fast he is a blur — “streaked”.' },
        { accept: ['raced', 'charged'], best: 'raced', why: 'Running all-out to catch up — “raced”.' },
        { accept: ['darted', 'dashed'], best: 'darted', why: 'A sudden dash onto the track — “darted”.' },
        { accept: ['careered', 'hurtled'], best: 'careered', why: 'Wild circles, out of control — “careered”.' },
        { accept: ['charged', 'bolted'], best: 'charged', why: 'Driving straight at the pit — “charged”.' },
        { accept: ['rushed', 'dashed'], best: 'rushed', why: 'Hurrying after the dog — “rushed”.' },
        { accept: ['scampered'], best: 'scampered', why: 'Light, hurried steps — a small boy — “scampered”.' },
        { accept: ['fled'], best: 'fled', why: 'Running away from him — “fled”.' },
        { accept: ['dashed', 'sprinted'], best: 'dashed', why: 'A quick burst to block the gate — “dashed”.' },
        { accept: ['bounded', 'leapt'], best: 'bounded', why: 'Big springing leaps over the bench — “bounded”.' },
        { accept: ['tore', 'pelted'], best: 'tore', why: 'Reckless, at speed, down the road — “tore”.' },
        { accept: ['scurried'], best: 'scurried', why: 'Short quick startled steps — “scurried”.' },
        { accept: ['galloped'], best: 'galloped', why: 'Fast leaping strides, horse-style — “galloped”.' },
        { accept: ['bolted'], best: 'bolted', why: 'Shot out of the bush in fright — “bolted”.' },
        { accept: ['hurtled', 'careered'], best: 'hurtled', why: 'Down the slope, fast and out of control — “hurtled”.' },
        { accept: ['pelted', 'tore'], best: 'pelted', why: 'At full pelt through the sudden rain — “pelted”.' },
        { accept: ['zoomed', 'sped'], best: 'zoomed', why: 'A cyclist flashing past — “zoomed”.' },
        { accept: ['jogged', 'trotted'], best: 'jogged', why: 'Easy, steady pace at the end — “jogged”.' },
        { accept: ['trotted'], best: 'trotted', why: 'A gentle, happy pace once tired — “trotted”.' },
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
      { w: 'glared', use: 'Look angrily and hard at someone.', ex: 'She glared at the rude boy.' },
      { w: 'peered', use: 'Look closely, straining to see — dim or far off.', ex: 'He peered through the keyhole.' },
      { w: 'stared', use: 'Look for a long time without looking away.', ex: 'The child stared at the clown.' },
      { w: 'glanced', use: 'Look quickly, for just a moment.', ex: 'She glanced at the clock.' },
      { w: 'gazed', use: 'Look long and steadily, often in wonder.', ex: 'They gazed at the sunset.' },
      { w: 'watched', use: 'Look at something as it moves or happens (no “at”).', ex: 'We watched the football match.' },
      { w: 'examined', use: 'Look closely to find out details (no “at”).', ex: 'The doctor examined the wound.' },
      { w: 'spotted', use: 'Suddenly see or pick out something (no “at”).', ex: 'He spotted a friend in the crowd.' },
      { w: 'studied', use: 'Look at carefully and thoroughly (no “at”).', ex: 'She studied the map carefully.' },
      { w: 'observed', use: 'Watch closely to learn or notice (no “at”).', ex: 'The scientist observed the ants.' },
      { w: 'scanned', use: 'Look over quickly, searching (no “at”).', ex: 'He scanned the page for the name.' },
      { w: 'glimpsed', use: 'See for only a split second (no “at”).', ex: 'She glimpsed the sea from the train.' },
      { w: 'squinted', use: 'Look with half-shut eyes, against light or tiny print.', ex: 'He squinted in the bright sun.' },
      { w: 'spied', use: 'Catch sight of something, often far off (no “at”).', ex: 'She spied a ship on the horizon.' },
      { w: 'gaped', use: 'Look with your mouth open, amazed or shocked.', ex: 'They gaped at the huge statue.' },
      { w: 'inspected', use: 'Look over carefully and officially (no “at”).', ex: 'The officer inspected the tickets.' },
      { w: 'noticed', use: 'Become aware of something (no “at”).', ex: 'She noticed a mistake in the sum.' },
      { w: 'eyed', use: 'Look at with suspicion or longing (no “at”).', ex: 'He eyed the last slice of cake.' },
      { w: 'surveyed', use: 'Look over a whole wide scene (no “at”).', ex: 'She surveyed the valley from the hill.' },
      { w: 'scowled', use: 'Look with an angry, bad-tempered frown.', ex: 'He scowled at the bad news.' },
    ],
    passage: {
      title: 'The Museum Trip',
      text: `The class filed in and {looked} up at the huge dinosaur skeleton. “Do not touch anything,” snapped the guard, who {looked} sternly at the smallest boy. The boy {looked} back at him with a sulky frown. Miss Ada {looked} quickly at her watch, worried they were late. For a long time Tunde {looked} up at the model of the stars. Bunmi {looked} at a tiny insect trapped in amber, right up close. She {looked} at the faded label through the dusty, cracked glass. When the guide pulled off a sheet, the whole class {looked} at the golden mask, mouths wide open.
In the next hall Bunmi {looked at} an old map for a full hour. A scientist {looked at} a chip of rock under a bright lens. The guard {looked at} a visitor’s badge to check it was real. The children {looked at} the goldfish going round and round its bowl. Miss Ada {looked at} the class quietly, learning each new name. She {looked at} the whole crowd, hunting for a lost pupil. From the balcony they {looked at} the entire city spread out below. For only a second Sola {looked at} a secret door before it shut. Tunde {looked at} his friend across the busy hall and waved. Miss Ada {looked at} something odd left on a shelf. Outside the gift shop Sola {looked at} the toys he could not afford, and far out to sea a sailor on a poster {looked at} a distant island.`,
      answers: [
        { accept: ['gazed', 'stared'], best: 'gazed', why: 'A long look of wonder — “gazed” (up at).' },
        { accept: ['glared', 'scowled'], best: 'glared', why: 'A hard, stern, angry look — “glared” (at).' },
        { accept: ['scowled', 'glared'], best: 'scowled', why: 'A sulky, bad-tempered frown — “scowled” (at).' },
        { accept: ['glanced'], best: 'glanced', why: 'A one-moment look at her watch — “glanced” (at).' },
        { accept: ['stared', 'gazed'], best: 'stared', why: 'A long, fixed look up — “stared” (up at).' },
        { accept: ['peered', 'squinted'], best: 'peered', why: 'Straining close to see something tiny — “peered” (at).' },
        { accept: ['squinted', 'peered'], best: 'squinted', why: 'Half-shut eyes through dusty glass — “squinted” (at).' },
        { accept: ['gaped'], best: 'gaped', why: 'Mouths wide, amazed — “gaped” (at).' },
        { accept: ['studied', 'examined'], best: 'studied', why: 'Careful, thorough looking — “studied the map”.' },
        { accept: ['examined', 'inspected'], best: 'examined', why: 'Close inspection for detail — “examined a chip of rock”.' },
        { accept: ['inspected', 'checked'], best: 'inspected', why: 'An official once-over of the badge — “inspected the badge”.' },
        { accept: ['watched', 'observed'], best: 'watched', why: 'Following the fish as it moves — “watched the goldfish”.' },
        { accept: ['observed', 'studied'], best: 'observed', why: 'Watching closely to learn the names — “observed the class”.' },
        { accept: ['scanned', 'searched'], best: 'scanned', why: 'A sweeping search of the crowd — “scanned the crowd”.' },
        { accept: ['surveyed'], best: 'surveyed', why: 'Taking in a whole wide scene — “surveyed the city”.' },
        { accept: ['glimpsed', 'spotted'], best: 'glimpsed', why: 'Seen for only a split second — “glimpsed a door”.' },
        { accept: ['spotted', 'noticed'], best: 'spotted', why: 'Picked his friend out of the crowd — “spotted his friend”.' },
        { accept: ['noticed'], best: 'noticed', why: 'Became aware of something odd — “noticed something”.' },
        { accept: ['eyed'], best: 'eyed', why: 'A longing look at the toys — “eyed the toys”.' },
        { accept: ['spied', 'sighted'], best: 'spied', why: 'Caught sight of something far off — “spied a distant island”.' },
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
      { w: 'enormous', use: 'Extremely large in size.', ex: 'An enormous whale surfaced by the boat.' },
      { w: 'gigantic', use: 'So large it is almost hard to believe.', ex: 'A gigantic wave hit the shore.' },
      { w: 'massive', use: 'Huge and heavy — great in bulk.', ex: 'They lifted a massive stone block.' },
      { w: 'towering', use: 'Very tall, rising high above.', ex: 'A towering cliff rose above them.' },
      { w: 'vast', use: 'Huge in area or extent — a field, a crowd.', ex: 'A vast desert stretched for miles.' },
      { w: 'wonderful', use: 'Extremely good — it fills you with delight.', ex: 'We had a wonderful holiday.' },
      { w: 'excellent', use: 'Extremely good in quality.', ex: 'She got an excellent mark.' },
      { w: 'superb', use: 'Wonderfully good — a top performance or view.', ex: 'The chef cooked a superb meal.' },
      { w: 'brilliant', use: 'Very clever, or wonderfully good.', ex: 'That was a brilliant idea.' },
      { w: 'outstanding', use: 'So good it stands out from the rest.', ex: 'He gave an outstanding speech.' },
      { w: 'impressive', use: 'Good enough to make people admire it.', ex: 'The fireworks were very impressive.' },
      { w: 'delicious', use: 'Tasting extremely good.', ex: 'This mango is delicious.' },
      { w: 'kind', use: 'Caring and warm towards other people.', ex: 'It was kind of you to help.' },
      { w: 'generous', use: 'Happy to give and share freely.', ex: 'She gave a generous donation.' },
      { w: 'gentle', use: 'Soft and careful, never rough.', ex: 'Be gentle with the kitten.' },
      { w: 'thoughtful', use: 'Caring about what others need or feel.', ex: 'A thoughtful gift made her smile.' },
      { w: 'friendly', use: 'Warm and easy to get along with.', ex: 'Our new neighbour is friendly.' },
      { w: 'delightful', use: 'So pleasant it brings real joy.', ex: 'We spent a delightful afternoon.' },
      { w: 'pleasant', use: 'Nice in a mild, agreeable way.', ex: 'It was a pleasant, sunny day.' },
      { w: 'cheerful', use: 'Bright and full of good spirits.', ex: 'She gave a cheerful wave.' },
    ],
    /* Written PREDICATIVELY ("the field was {big}") on purpose — never
       "a {big} field" — so the vivid replacement never lands after the wrong
       article ("a enormous" for "an enormous"). The "nice" words all start
       with a consonant, so a "was {nice}" still reads right whichever is chosen. */
    passage: {
      title: 'The Village Fair',
      text: `The fairground was {big} — you could not see the far side. In the middle the tent was {big}, rising taller than the church. By lunchtime the crowd was {big}, packed shoulder to shoulder. The pot of soup on the fire was {big}, enough for half the village. One balloon was so {big} that it hid the sun for a moment.
The jollof rice smelled {good}, and everybody queued for it. The band’s music was {good}, the best they had played all year. The juggler’s trick was {good} — ten flaming clubs at once. One boy’s idea for the raffle was so {good} that the whole committee cheered. Ade’s drumming was {good}, far better than anyone else’s. The view from the ferris wheel was {good}, right across the rooftops. Altogether the day was {good}, one to remember.
Mama Nkechi, who ran the food stall, was {nice} to every child. She was {nice} enough to give away the last of her puff-puff. She was {nice} with the smallest ones, never hurried or rough. Ade’s friend was {nice}, always thinking of what others needed. The stall-holders were {nice}, easy to talk to and quick to laugh. The puppet show was {nice} — pure, bright joy. The whole afternoon was {nice}, warm and calm. And everyone went home {nice}, humming the band’s last tune.`,
      answers: [
        { accept: ['vast', 'enormous'], best: 'vast', why: 'A wide, open extent of ground — “vast”.' },
        { accept: ['towering', 'massive'], best: 'towering', why: 'Tall, rising above the church — “towering”.' },
        { accept: ['enormous', 'vast'], best: 'enormous', why: 'A very large, packed crowd — “enormous”.' },
        { accept: ['massive', 'enormous'], best: 'massive', why: 'A huge, heavy pot — “massive”.' },
        { accept: ['gigantic', 'enormous'], best: 'gigantic', why: 'So large it hid the sun — “gigantic”.' },
        { accept: ['delicious', 'tasty'], best: 'delicious', why: 'Food that smells wonderful — “delicious”.' },
        { accept: ['superb', 'excellent'], best: 'superb', why: 'Wonderfully good music — “superb”.' },
        { accept: ['impressive', 'skilful'], best: 'impressive', why: 'Ten clubs at once — makes you admire it — “impressive”.' },
        { accept: ['brilliant', 'clever'], best: 'brilliant', why: 'A very clever idea — “brilliant”.' },
        { accept: ['outstanding', 'excellent'], best: 'outstanding', why: 'Far better than the rest — “outstanding”.' },
        { accept: ['excellent', 'superb'], best: 'excellent', why: 'Top quality, right across the rooftops — “excellent”.' },
        { accept: ['wonderful', 'delightful'], best: 'wonderful', why: 'A day full of delight — “wonderful”.' },
        { accept: ['kind', 'thoughtful'], best: 'kind', why: 'Warm and caring to every child — “kind”.' },
        { accept: ['generous'], best: 'generous', why: 'Giving away the last of her food — “generous”.' },
        { accept: ['gentle'], best: 'gentle', why: 'Soft and careful with the little ones — “gentle”.' },
        { accept: ['thoughtful', 'kind'], best: 'thoughtful', why: 'Thinking of what others needed — “thoughtful”.' },
        { accept: ['friendly'], best: 'friendly', why: 'Easy to talk to, quick to laugh — “friendly”.' },
        { accept: ['delightful', 'wonderful'], best: 'delightful', why: 'Pure, bright joy — “delightful”.' },
        { accept: ['pleasant'], best: 'pleasant', why: 'Mild, warm, agreeable — “pleasant”.' },
        { accept: ['cheerful'], best: 'cheerful', why: 'Bright and full of good spirits — “cheerful”.' },
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
