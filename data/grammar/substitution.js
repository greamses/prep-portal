/* ═══════════════════════════════════════════════════════
   GRAMMAR — Word Upgrade (the substitution activity).

   The second activity on the Grammar page. Where CUPS is proof-reading, this
   is word choice: a sentence carries a tired, over-used word ("said", "walked",
   "big"), and the player swaps it for the most vivid word that fits THAT
   sentence — not just any synonym, the right one for the context.

   THE MODEL (why it maps onto the proof-reading score)
   Each sentence lists:
     accept  every vivid word that genuinely fits — swapping to any of them is
             a point (the "caught" of proof-reading).
     best    the single sharpest choice — landing it is the bonus point (the
             "tagged" of proof-reading), so a round of N sentences is out of 2N,
             exactly like a passage of N errors.
   A word that is changed but fits nothing is a wrong guess (a "false edit", the
   tiebreak). Leaving the tired word alone is a miss. That shared shape is the
   whole reason the bots, the leaderboard and the results board work for both
   activities untouched (see js/bots.js, js/leaderboard.js).

   THE 20-WORD PALETTE. Every set hands the player the same twenty vivid words
   up front, each with a use-case to READ before playing — the point is to
   learn the shades of meaning, not to guess. Every `accept`/`best` word is one
   of the twenty, so the palette is always sufficient and never misleading.

   THE SLOT. `s` marks the exact text to replace in braces — usually the tired
   word, but "{looked at}" when the vivid verb ("examined") should eat the
   preposition too. The player's word replaces the whole brace, so the grammar
   stays right whichever verb they pick.
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
    sentences: [
      { s: '“Get out of my way!” she {said} furiously.', accept: ['shouted', 'yelled', 'snapped', 'demanded'], best: 'shouted', why: 'A loud, angry order — “shouted” carries the volume and the fury.' },
      { s: '“Don’t wake the baby,” he {said}, leaning close.', accept: ['whispered', 'muttered', 'mumbled'], best: 'whispered', why: 'Quiet and close, so the baby sleeps on — that is “whispered”.' },
      { s: '“It was me. I broke it,” she {said} at last.', accept: ['admitted', 'confessed'], best: 'admitted', why: 'Owning up to a truth she would rather hide is “admitted”.' },
      { s: '“Please, please let me come with you,” the boy {said}.', accept: ['begged', 'pleaded'], best: 'begged', why: 'Desperate, repeated asking is “begged”.' },
      { s: '“Look out — the wall is falling!” he {said}.', accept: ['warned', 'shouted', 'yelled', 'cried'], best: 'warned', why: 'The whole point is to alert them to danger: “warned”.' },
      { s: '“I came first in the whole school!” she {said}.', accept: ['announced', 'boasted', 'cried'], best: 'boasted', why: 'Proud showing-off about herself is “boasted”.' },
      { s: '“So nine times eight is seventy-two,” the teacher {said}.', accept: ['explained', 'replied', 'announced'], best: 'explained', why: 'Making the sum clear to the class is “explained”.' },
      { s: '“What time does the match start?” she {said}.', accept: ['asked'], best: 'asked', why: 'It is a question, so the plain vivid verb is “asked”.' },
      { s: '“My legs are aching so badly,” he {said}, sitting down.', accept: ['groaned', 'sighed', 'moaned'], best: 'groaned', why: 'A low sound of aching tiredness is “groaned”.' },
      { s: '“Yes, of course I will help,” he {said} kindly.', accept: ['replied', 'answered'], best: 'replied', why: 'Answering someone who spoke first is “replied”.' },
    ],
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
    sentences: [
      { s: 'Late for school, she {walked} to the gate.', accept: ['hurried', 'dashed', 'raced', 'sprinted'], best: 'hurried', why: 'Quick because time is short, but still walking: “hurried”.' },
      { s: 'Trying not to be heard, he {walked} past the sleeping guard.', accept: ['crept', 'tiptoed'], best: 'crept', why: 'Slow and silent so as not to be noticed is “crept”.' },
      { s: 'Exhausted, the hikers {walked} up the last steep hill.', accept: ['trudged', 'plodded', 'staggered'], best: 'trudged', why: 'Heavy, weary steps up hard ground is “trudged”.' },
      { s: 'The soldiers {walked} in step across the parade square.', accept: ['marched'], best: 'marched', why: 'Firm, even, in-step movement is “marched”.' },
      { s: 'With nothing to do, he {walked} around the busy market.', accept: ['wandered', 'strolled', 'ambled'], best: 'wandered', why: 'No fixed direction, just drifting about, is “wandered”.' },
      { s: 'After twisting his ankle, she {walked} slowly to the bench.', accept: ['limped', 'hobbled'], best: 'limped', why: 'Uneven walking on a hurt foot is “limped”.' },
      { s: 'On the icy path he {walked} and almost fell twice.', accept: ['stumbled', 'staggered', 'slipped'], best: 'stumbled', why: 'Unsteady, tripping steps are “stumbled”.' },
      { s: 'Head high, the winner {walked} onto the stage.', accept: ['strode', 'marched'], best: 'strode', why: 'Long, confident, purposeful steps are “strode”.' },
      { s: 'The baby {walked} across the floor to reach the ball.', accept: ['crawled'], best: 'crawled', why: 'On hands and knees, a baby “crawled”.' },
      { s: 'Enjoying the cool evening, they {walked} along the beach.', accept: ['strolled', 'ambled', 'wandered'], best: 'strolled', why: 'Slow, relaxed, unhurried walking is “strolled”.' },
    ],
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
      { w: 'watched', use: 'Look at something as it moves or happens.' },
      { w: 'examined', use: 'Look closely to find out details — no “at”.' },
      { w: 'spotted', use: 'Suddenly see or pick out something.' },
      { w: 'studied', use: 'Look at carefully and thoroughly — no “at”.' },
      { w: 'observed', use: 'Watch closely to learn or notice — no “at”.' },
      { w: 'scanned', use: 'Look over quickly, searching for something — no “at”.' },
      { w: 'glimpsed', use: 'See for only a split second — no “at”.' },
      { w: 'squinted', use: 'Look with half-shut eyes, against light or tiny print.' },
      { w: 'spied', use: 'Catch sight of something, often far off.' },
      { w: 'gaped', use: 'Look with your mouth open, amazed or shocked.' },
      { w: 'inspected', use: 'Look over carefully and officially — no “at”.' },
      { w: 'noticed', use: 'Become aware of something — no “at”.' },
      { w: 'eyed', use: 'Look at with suspicion or longing — no “at”.' },
      { w: 'surveyed', use: 'Look over a whole wide scene — no “at”.' },
      { w: 'scowled', use: 'Look with an angry, bad-tempered frown.' },
    ],
    sentences: [
      { s: 'She {looked} angrily at the boy who had pushed her.', accept: ['glared', 'scowled'], best: 'glared', why: 'A long, hard, angry look is “glared”.' },
      { s: 'He {looked} quickly at his watch and started to run.', accept: ['glanced'], best: 'glanced', why: 'A one-moment look is “glanced”.' },
      { s: 'Through the thick fog she {looked} to make out the road.', accept: ['peered', 'squinted'], best: 'peered', why: 'Straining to see something dim is “peered”.' },
      { s: 'The scientist {looked at} the cells for over an hour.', accept: ['examined', 'studied', 'inspected', 'observed'], best: 'examined', why: 'Looking closely to find details is “examined” (the “at” is dropped).' },
      { s: 'For a long time he {looked} up at the shining stars.', accept: ['gazed', 'stared'], best: 'gazed', why: 'A long, steady look full of wonder is “gazed”.' },
      { s: 'She {looked at} the whole crowd, hunting for her father.', accept: ['scanned', 'surveyed', 'searched'], best: 'scanned', why: 'Sweeping over a crowd to find someone is “scanned”.' },
      { s: 'From the hilltop they {looked at} the entire green valley.', accept: ['surveyed', 'observed', 'scanned'], best: 'surveyed', why: 'Taking in a whole wide scene is “surveyed”.' },
      { s: 'He {looked} at the tiny print, screwing up his eyes.', accept: ['squinted', 'peered', 'stared'], best: 'squinted', why: 'Half-shut eyes against tiny print is “squinted”.' },
      { s: 'For just a second she {looked at} the letter, then hid it.', accept: ['glimpsed', 'noticed'], best: 'glimpsed', why: 'Seeing for only a split second is “glimpsed”.' },
      { s: 'The goalkeeper {looked} at the ball all the way into the net.', accept: ['watched', 'stared'], best: 'watched', why: 'Following something as it moves is “watched”.' },
    ],
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
      { w: 'vast', use: 'Huge in area or extent — a desert, a crowd.' },
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
    sentences: [
      { s: 'An {big} elephant blocked the whole narrow road.', accept: ['enormous', 'gigantic', 'massive', 'huge'], best: 'enormous', why: 'For sheer size, “enormous” is far sharper than “big”.' },
      { s: 'From the plane the {big} desert stretched to the horizon.', accept: ['vast', 'enormous', 'endless'], best: 'vast', why: 'A wide, open extent of land is “vast”.' },
      { s: 'The {big} tower rose high above every other building.', accept: ['towering', 'massive', 'enormous'], best: 'towering', why: 'Very tall and rising high is “towering”.' },
      { s: 'She cooked a {good} meal that everyone finished happily.', accept: ['delicious', 'excellent', 'superb', 'tasty'], best: 'delicious', why: 'For food that tastes wonderful, “delicious”.' },
      { s: 'He gave a {good} performance and won first prize.', accept: ['excellent', 'superb', 'outstanding', 'brilliant', 'impressive'], best: 'outstanding', why: 'So good it stood out from the rest: “outstanding”.' },
      { s: 'That was a really {good} idea — nobody else thought of it.', accept: ['brilliant', 'excellent', 'clever'], best: 'brilliant', why: 'A very clever idea is “brilliant”.' },
      { s: 'Our new neighbour is a {nice} woman who helps everyone.', accept: ['kind', 'thoughtful', 'friendly', 'generous'], best: 'kind', why: 'Warm and caring towards others is “kind”.' },
      { s: 'It was {nice} of him to share his lunch with the new boy.', accept: ['generous', 'kind', 'thoughtful'], best: 'generous', why: 'Happy to give and share freely is “generous”.' },
      { s: 'We spent a {nice} afternoon by the cool river.', accept: ['pleasant', 'delightful', 'wonderful'], best: 'pleasant', why: 'Mildly agreeable and enjoyable is “pleasant”.' },
      { s: 'Be {nice} with the puppy — hold it softly.', accept: ['gentle'], best: 'gentle', why: 'Soft and careful, never rough, is “gentle”.' },
    ],
  },
];

export const SET_KEYS = SETS.map((s) => s.key);
export const setMeta = (key) => SETS.find((s) => s.key === key) || null;

/** Sets written for a grade, in registry order. */
export function setsForGrade(grade) {
  return SETS.filter((s) => grade >= s.band[0] && grade <= s.band[1]);
}

/* ── The slot ──────────────────────────────────────────────────────────────
   `{dull}` in a sentence is the replaceable slot. Split it into the fixed text
   before and after, and the tired word shown inside. */
const SLOT = /^([\s\S]*?)\{([^}]*)\}([\s\S]*)$/;

/** A sentence record → { before, dull, after, accept, best, why }. */
export function parseSentence(sent) {
  const m = SLOT.exec(sent.s);
  if (!m) return { before: sent.s, dull: '', after: '', accept: sent.accept, best: sent.best, why: sent.why };
  return { before: m[1], dull: m[2], after: m[3], accept: sent.accept, best: sent.best, why: sent.why };
}

export const normWord = (s) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z]/g, '');

/* ── Scoring one answer ────────────────────────────────────────────────────
   Mirrors proof-reading's four outcomes so the leaderboard is untouched:
     caught      the word fits (∈ accept)          → +1
     best        the word is THE best (=== best)   → +1 more (bonus)
     wrong-fix   changed, but fits nothing         → a false edit
     missed      left as the tired word / blank    → nothing
*/
export function judge(answer, parsed) {
  const a = normWord(answer);
  const dull = normWord(parsed.dull.replace(/\s+/g, ' ').split(' ')[0]); // "looked at" → "looked"
  const accept = parsed.accept.map(normWord);
  const isBest = a === normWord(parsed.best);
  if (!a || a === dull) return { outcome: 'missed', caught: false, best: false };
  if (accept.includes(a)) return { outcome: 'caught', caught: true, best: isBest };
  return { outcome: 'wrong-fix', caught: false, best: false };
}

/** A whole upgrade round → the SAME result shape proof-reading returns. */
export function scoreUpgrade(items, answers) {
  const detail = [];
  let caught = 0, best = 0, wrong = 0, missed = 0;
  items.forEach((it, i) => {
    const parsed = it.parsed;
    const answer = answers[i] != null ? answers[i] : '';
    const j = judge(answer, parsed);
    if (j.outcome === 'caught') { caught += 1; if (j.best) best += 1; }
    else if (j.outcome === 'wrong-fix') wrong += 1;
    else missed += 1;
    detail.push({ i, outcome: j.outcome, best: j.best, submitted: answer, parsed });
  });
  return {
    score: caught + best,          // out of items.length × 2, like a passage
    caught,
    tagged: best,                  // "best word" reuses the tagged slot
    wrongFix: wrong,
    missed,
    falseEdits: wrong,             // wrong guesses are the tiebreak, as in CUPS
    errorTotal: items.length,
    maxScore: items.length * 2,
    byCat: {},                     // no CUPS breakdown for this activity
    detail,
  };
}
