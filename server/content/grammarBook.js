/**
 * Grammar Police — canonical book content (single source of truth).
 *
 * Served verbatim by GET /api/grammar/book. The browser fetches this and
 * renders the editorial McGraw-Hill–style flipbook; a trimmed mirror lives at
 * writing/activity/grammar-police/js/data/book.fallback.js for offline use.
 *
 * Shape contract the renderer + interaction layer depend on:
 *   wordGroups[key] = { options:[...], label }
 *   passage.paragraphs = Array< string | { correct, group } >[]   (per paragraph)
 *   exercise.items      = Array< string | { correct } >[]          (per sentence)
 * Everything else (furniture, lesson HTML, media) is presentation-only.
 *
 * To add a lesson: add a unit to UNITS. To change wording: edit here — the
 * change is live on next /api/grammar/book fetch, no rebuild needed.
 */

// ── Confusable word sets (the multiple-choice options for each blank) ───────
const WORD_GROUPS = {
  theyre: { options: ["they're", "their", "there"], label: "they're / their / there" },
  were:   { options: ["we're", "were", "where"],    label: "we're / were / where" },
  youre:  { options: ["you're", "your"],            label: "you're / your" },
  its:    { options: ["it's", "its"],               label: "it's / its" },
  totwo:  { options: ["to", "too", "two"],          label: "to / too / two" },
  thanthen: { options: ["than", "then"],            label: "than / then" },
  inon:     { options: ["in", "on"],                label: "in / on" },
};

// ── Guide character. Rendered as a flat-colour cartoon PNG (see
//    js/ui/mascot.js). `hero` is the friendly character name used on the
//    cover; swap it (or point the front-end NAMED map at your own PNGs).
const MASCOT = {
  name: "Sergeant Sentence",
  hero: "detective",
};

// ── Cover + closing media (real photography, not vector art) ────────────────
const MEDIA = {
  cover:  "photo-1503676260728-1c00da094a0b", // study desk / books
  hero:   "photo-1456513080510-7bf3a84b82f8", // reading by window
  // Closing video: real id is resolved at runtime from /api/youtube/featured;
  // this is the offline fallback only.
  video:  { id: "M7lc1UVf-VE", title: "Why grammar matters — in 3 minutes" },
};

/* ════════════════════════════════════════════════════════════════════════
   GRAMMAR UNITS  (kind: "grammar" → choose-the-word passages)
   PUNCTUATION UNITS (kind: "punctuation" → drag-the-mark exercises)
   Each unit carries McGraw-Hill "furniture": mainIdea, keyVocab, realWorld,
   studyTip and hot (Higher-Order-Thinking) prompts.
═════════════════════════════════════════════════════════════════════════ */

const UNITS = [
  // ───────────────────────────── UNIT 1 ─────────────────────────────
  {
    id: "u-theyre",
    teach: `
      <h3 class="exp-heading">Dig a little deeper</h3>
      <p class="exp-intro">Because these three words sound exactly alike, your ear cannot help you — only the <strong>job</strong> of the word can. Always ask what the word is doing before you choose.</p>
      <p class="exp-eg"><strong>they're</strong> = they are: "They're late." (They are late.)</p>
      <p class="exp-eg"><strong>their</strong> = ownership: "Their teacher is kind." (belongs to them)</p>
      <p class="exp-eg"><strong>there</strong> = a place, or "there is/are": "Put it there." · "There are two dogs."</p>
      <p class="exp-intro">If you can replace the word with <em>they are</em>, it must be <strong>they're</strong>. If something belongs to a group, it is <strong>their</strong>. Everything else is usually <strong>there</strong>.</p>`,
    kind: "grammar",
    number: 1,
    color: "blue",
    title: "They're, Their & There",
    focus: "they're · their · there",
    mascotPose: "teach",
    mainIdea: "Three words sound the same but do three different jobs. Decide the job, and the spelling follows.",
    keyVocab: [
      { term: "contraction", def: "two words joined with an apostrophe (they're = they are)" },
      { term: "possessive", def: "a word that shows ownership (their bags)" },
      { term: "adverb of place", def: "a word that points to a location (over there)" },
    ],
    realWorld: {
      title: "Why it matters",
      text: "Examiners dock marks for confusables more than almost any other error. One swap — 'their' for 'there' — can change the meaning of a whole sentence in a WAEC essay.",
      image: "photo-1434030216411-0b793f4b4173",
    },
    studyTip: "Read the sentence with “they are” swapped in. If it still makes sense, the answer is they're.",
    hot: [
      "Find the error: “Their going to bring they're books over their.” Rewrite it correctly.",
      "Open ended: Write one sentence that correctly uses all three — they're, their and there.",
    ],
    lesson: {
      leftHTML: `
        <h2 class="exp-heading">Three words, one sound!</h2>
        <p class="exp-intro">All sound like <em>"thair"</em> — different jobs:</p>
        <div class="exp-word-block exp-word-block--blue">
          <span class="exp-word">they're</span>
          <span class="exp-eq">= <strong>they are</strong></span>
          <p class="exp-eg">"<em>They're</em> going to school." (= They <u>are</u> going.)</p>
        </div>
        <div class="exp-word-block exp-word-block--yellow">
          <span class="exp-word">their</span>
          <span class="exp-eq">= <strong>belongs to them</strong></span>
          <p class="exp-eg">"Pack <em>their</em> bags." (the bags belong to them)</p>
        </div>
        <div class="exp-word-block exp-word-block--green">
          <span class="exp-word">there</span>
          <span class="exp-eq">= <strong>a place</strong></span>
          <p class="exp-eg">"Wait over <em>there</em>." · "<em>There</em> are five birds."</p>
        </div>`,
      rightHTML: `
        <div class="exp-trick-box">
          <div class="exp-trick-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            The Detective's Trick
          </div>
          <ol class="exp-steps">
            <li class="exp-step">Can I say <strong>"they are"</strong> here?<br><span class="exp-yes">Yes →</span> use <strong>they're</strong></li>
            <li class="exp-step">Does it show something belongs to a group?<br><span class="exp-yes">Yes →</span> use <strong>their</strong></li>
            <li class="exp-step">Am I pointing to a place?<br><span class="exp-yes">Yes →</span> use <strong>there</strong></li>
          </ol>
        </div>
        <div class="exp-quicktest">
          <p class="exp-qt-label">Quick Test</p>
          <p class="exp-qt-row"><span class="exp-qt-q">"<u>____</u> going home."</span> → <em>They are</em> going ✓ → <strong>they're</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"Pack <u>____</u> bags."</span> → belongs to them → <strong>their</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"Wait over <u>____</u>."</span> → points to a place → <strong>there</strong></p>
        </div>`,
    },
    passage: {
      id: "pass1",
      title: "The Science Museum Trip",
      focus: "they're / their / there",
      groups: ["theyre"],
      paragraphs: [
        [
          "The students in Class 5B could barely sit still. ",
          { correct: "They're", group: "theyre" },
          " going on a school trip today, and ",
          { correct: "their", group: "theyre" },
          " excitement was impossible to hide. Mrs. Okafor told them to leave ",
          { correct: "their", group: "theyre" },
          " bags by the classroom door. 'We are meeting over ",
          { correct: "there", group: "theyre" },
          " by the gate,' she said. Some children felt nervous because ",
          { correct: "they're", group: "theyre" },
          " not sure what to expect.",
        ],
        [
          "Once on the bus, ",
          { correct: "they're", group: "theyre" },
          " louder than ever. Emeka tells his friend that ",
          { correct: "their", group: "theyre" },
          " seats are near the window. 'Look over ",
          { correct: "there", group: "theyre" },
          "!' shouts Amara, pointing at a herd of goats. ",
          { correct: "They're", group: "theyre" },
          " all laughing now. The teacher checks that ",
          { correct: "their", group: "theyre" },
          " seatbelts are fastened before the bus moves off.",
        ],
        [
          "At the museum, ",
          { correct: "they're", group: "theyre" },
          " amazed by everything ",
          { correct: "they're", group: "theyre" },
          " seeing. ",
          { correct: "There", group: "theyre" },
          " are giant dinosaur bones on display. ",
          { correct: "Their", group: "theyre" },
          " size shocks the whole class. A guide explains that ",
          { correct: "their", group: "theyre" },
          " bones were buried underground for millions of years. 'Amazing — ",
          { correct: "they're", group: "theyre" },
          " still finding new fossils today!'",
        ],
        [
          "By lunchtime, ",
          { correct: "they're", group: "theyre" },
          " tired but happy. The children open ",
          { correct: "their", group: "theyre" },
          " lunchboxes and find shady spots. 'Is ",
          { correct: "there", group: "theyre" },
          " a bin nearby?' asks Temi. Emeka spots one over ",
          { correct: "there", group: "theyre" },
          " by the fountain. ",
          { correct: "They're", group: "theyre" },
          " careful to keep the area tidy before heading back.",
        ],
      ],
    },
  },

  // ───────────────────────────── UNIT 2 ─────────────────────────────
  {
    id: "u-were",
    teach: `
      <h3 class="exp-heading">Dig a little deeper</h3>
      <p class="exp-intro">Two of these are easy to test. <strong>we're</strong> always means <em>we are</em>, and <strong>were</strong> is just the past tense of <em>are</em>. Only <strong>where</strong> is about a place.</p>
      <p class="exp-eg"><strong>we're</strong>: "We're winning!" (We are winning.)</p>
      <p class="exp-eg"><strong>were</strong>: "They were here yesterday." (past tense)</p>
      <p class="exp-eg"><strong>where</strong>: "Where is my book?" (asks about a place)</p>
      <p class="exp-intro">The apostrophe in <strong>we're</strong> does the work of the missing <em>a</em> in "are". No apostrophe means no hidden "are".</p>`,
    kind: "grammar",
    number: 2,
    color: "green",
    title: "We're, Were & Where",
    focus: "we're · were · where",
    mascotPose: "think",
    mainIdea: "A contraction (we're), a past-tense verb (were) and a place word (where) — all decided by meaning, not by sound.",
    keyVocab: [
      { term: "contraction", def: "we're = we are" },
      { term: "past tense", def: "an action that already happened (we were late)" },
      { term: "question word", def: "where asks about a place" },
    ],
    realWorld: {
      title: "Why it matters",
      text: "In comprehension answers, writing 'where' for 'were' breaks the verb of a whole clause — markers read it as a tense error, not a spelling slip.",
      image: "photo-1507525428034-b723cf961d3e",
    },
    studyTip: "Only we're has an apostrophe, and only we're can be stretched back into “we are”.",
    hot: [
      "Find the error: “Where were you when we’re supposed to meet?” — is each one right?",
      "Number sense: How many of these need an apostrophe — were, where, we're? Explain.",
    ],
    lesson: {
      leftHTML: `
        <h2 class="exp-heading">Another tricky trio!</h2>
        <p class="exp-intro">Sound similar — different jobs:</p>
        <div class="exp-word-block exp-word-block--blue">
          <span class="exp-word">we're</span>
          <span class="exp-eq">= <strong>we are</strong></span>
          <p class="exp-eg">"<em>We're</em> excited!" (= We <u>are</u> excited!)</p>
        </div>
        <div class="exp-word-block exp-word-block--yellow">
          <span class="exp-word">were</span>
          <span class="exp-eq">= <strong>past tense of "to be"</strong></span>
          <p class="exp-eg">"The children <em>were</em> happy." · "We <em>were</em> late."</p>
        </div>
        <div class="exp-word-block exp-word-block--green">
          <span class="exp-word">where</span>
          <span class="exp-eq">= <strong>a place or location</strong></span>
          <p class="exp-eg">"<em>Where</em> is the bus?" · "I know <em>where</em> she went."</p>
        </div>`,
      rightHTML: `
        <div class="exp-trick-box">
          <div class="exp-trick-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            The Detective's Trick
          </div>
          <ol class="exp-steps">
            <li class="exp-step">Can I say <strong>"we are"</strong> here?<br><span class="exp-yes">Yes →</span> use <strong>we're</strong></li>
            <li class="exp-step">Did it happen <strong>in the past</strong>?<br><span class="exp-yes">Yes →</span> use <strong>were</strong></li>
            <li class="exp-step">Am I pointing to a <strong>place</strong>?<br><span class="exp-yes">Yes →</span> use <strong>where</strong></li>
          </ol>
        </div>
        <div class="exp-quicktest">
          <p class="exp-qt-label">Quick Test</p>
          <p class="exp-qt-row"><span class="exp-qt-q">"<u>____</u> all going home."</span> → We <em>are</em> going ✓ → <strong>we're</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"The bags <u>____</u> heavy."</span> → past tense → <strong>were</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"<u>____</u> did you go?"</span> → asking about a place → <strong>where</strong></p>
        </div>`,
    },
    passage: {
      id: "pass2",
      title: "The Beach Weekend",
      focus: "we're / were / where",
      groups: ["were"],
      paragraphs: [
        [
          "'",
          { correct: "We're", group: "were" },
          " going to the beach this Saturday!' Mum announced. The children ",
          { correct: "were", group: "were" },
          " already jumping with joy. 'But ",
          { correct: "where", group: "were" },
          " will we park?' Dad asked. They ",
          { correct: "were", group: "were" },
          " nearly late last time. 'This time ",
          { correct: "we're", group: "were" },
          " leaving at seven sharp,' said Mum.",
        ],
        [
          "The roads ",
          { correct: "were", group: "were" },
          " clear as they drove out of town. 'Do you remember ",
          { correct: "where", group: "were" },
          " we stopped for snacks last year?' asked Sade. The children ",
          { correct: "were", group: "were" },
          " already hungry. '",
          { correct: "We're", group: "were" },
          " stopping at that junction up ahead,' Dad said. Mum spotted the shop ",
          { correct: "where", group: "were" },
          " they always bought cold drinks.",
        ],
        [
          "When they arrived, the beaches ",
          { correct: "were", group: "were" },
          " already full. 'So ",
          { correct: "where", group: "were" },
          " shall we set up?' asked Dad. The children ",
          { correct: "were", group: "were" },
          " pointing in all directions. '",
          { correct: "We're", group: "were" },
          " going near those rocks!' said Tunde. But the rocks ",
          { correct: "were", group: "were" },
          " slippery, so Mum chose a spot ",
          { correct: "where", group: "were" },
          " the sand was dry.",
        ],
        [
          "'",
          { correct: "We're", group: "were" },
          " absolutely starving!' the children shouted at noon. 'I know exactly ",
          { correct: "where", group: "were" },
          " I packed the sandwiches,' said Dad. They ",
          { correct: "were", group: "were" },
          " at the bottom of the cooler bag. Everyone agreed — '",
          { correct: "We're", group: "were" },
          " coming back next month!' As they packed, nobody could recall ",
          { correct: "where", group: "were" },
          " they had parked the car.",
        ],
      ],
    },
  },

  // ───────────────────────────── UNIT 3 ─────────────────────────────
  {
    id: "u-mixed",
    teach: `
      <h3 class="exp-heading">Dig a little deeper</h3>
      <p class="exp-intro">The apostrophe is your best clue. It always stands for letters removed when two words join. If you cannot stretch the word back into two words, it takes no apostrophe.</p>
      <p class="exp-eg"><strong>it's</strong> = it is / it has &middot; <strong>its</strong> = belonging to it</p>
      <p class="exp-eg"><strong>you're</strong> = you are &middot; <strong>your</strong> = belonging to you</p>
      <p class="exp-eg"><strong>they're</strong> = they are &middot; <strong>their</strong> = belonging to them</p>
      <p class="exp-intro">Read it with the two full words. "Its raining" becomes "It is raining" — that works, so it must be <strong>it's</strong>.</p>`,
    kind: "grammar",
    number: 3,
    color: "purple",
    title: "The Apostrophe Challenge",
    focus: "they're · their · there · you're · your · it's · its",
    mascotPose: "salute",
    mainIdea: "One rule beats them all: an apostrophe means two words have been squeezed together. No apostrophe usually means ownership.",
    keyVocab: [
      { term: "apostrophe", def: "the mark ’ that stands in for missing letters" },
      { term: "it's vs its", def: "it's = it is/has · its = belonging to it" },
      { term: "you're vs your", def: "you're = you are · your = belonging to you" },
    ],
    realWorld: {
      title: "Why it matters",
      text: "“Your welcome” instead of “You're welcome” is one of the most-shared grammar mistakes online — and one examiners spot instantly.",
      image: "photo-1488190211105-8b0e65b80b4e",
    },
    studyTip: "Stuck on it's/its or you're/your? Stretch the apostrophe word out. “It is” or “you are” must still make sense.",
    hot: [
      "Find the error: “Its raining, so bring you're umbrella to school.”",
      "Select a technique: explain the one test that works for they're, you're AND it's.",
    ],
    lesson: {
      leftHTML: `
        <h2 class="exp-heading">The apostrophe secret!</h2>
        <p class="exp-intro">One rule to spot them all:</p>
        <div class="exp-secret-box">
          <p class="exp-secret-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            The Big Secret
          </p>
          <p class="exp-secret-body">When there is an apostrophe&nbsp;(<strong>'</strong>), it means letters have been removed and two words joined together.</p>
        </div>
        <div class="exp-pairs-grid">
          <div class="exp-pair"><span class="exp-pair-a">they're</span><span class="exp-pair-sep">=</span><span class="exp-pair-b">they + are</span></div>
          <div class="exp-pair"><span class="exp-pair-a">you're</span><span class="exp-pair-sep">=</span><span class="exp-pair-b">you + are</span></div>
          <div class="exp-pair"><span class="exp-pair-a">it's</span><span class="exp-pair-sep">=</span><span class="exp-pair-b">it + is</span></div>
          <div class="exp-pair"><span class="exp-pair-a">we're</span><span class="exp-pair-sep">=</span><span class="exp-pair-b">we + are</span></div>
        </div>
        <p class="exp-rule-summary">No apostrophe = ownership: <strong>their</strong>, <strong>your</strong>, <strong>its</strong> · place/past: <strong>there</strong>, <strong>were</strong></p>`,
      rightHTML: `
        <div class="exp-trick-box">
          <div class="exp-trick-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            The Full-Form Test
          </div>
          <p class="exp-trick-desc">Swap the word with the full form. Does the sentence still make sense?</p>
          <div class="exp-test-rows">
            <div class="exp-test-row exp-test-row--pass">
              <span>"<em>It's</em> raining."</span>
              <span>→ "It <u>is</u> raining." ✓ → use <strong>it's</strong></span>
            </div>
            <div class="exp-test-row exp-test-row--fail">
              <span>"The dog wagged <em>its</em> tail."</span>
              <span>→ "…it <u>is</u> tail." ✗ → use <strong>its</strong></span>
            </div>
            <div class="exp-test-row exp-test-row--pass">
              <span>"<em>You're</em> brilliant!"</span>
              <span>→ "You <u>are</u> brilliant!" ✓ → use <strong>you're</strong></span>
            </div>
            <div class="exp-test-row exp-test-row--fail">
              <span>"Do <em>your</em> homework."</span>
              <span>→ "Do you <u>are</u> homework." ✗ → use <strong>your</strong></span>
            </div>
          </div>
        </div>
        <div class="exp-reminder">
          <p><strong>No apostrophe = ownership:</strong></p>
          <p><strong>their</strong> (them) · <strong>your</strong> (you) · <strong>its</strong> (it)</p>
          <p><strong>there</strong> (place) · <strong>were</strong> (past)</p>
        </div>`,
    },
    passage: {
      id: "pass3",
      title: "The Good Student",
      focus: "Mixed: they're · their · there · you're · your · it's · its",
      groups: ["theyre", "youre", "its"],
      paragraphs: [
        [
          "As a student, ",
          { correct: "you're", group: "youre" },
          " always learning something new. ",
          { correct: "It's", group: "its" },
          " not just about working hard — ",
          { correct: "it's", group: "its" },
          " also about staying curious. ",
          { correct: "Your", group: "youre" },
          " attitude matters just as much as ",
          { correct: "your", group: "youre" },
          " effort in the classroom.",
        ],
        [
          "When students arrive at school, ",
          { correct: "they're", group: "theyre" },
          " often thinking about ",
          { correct: "their", group: "theyre" },
          " friends. But ",
          { correct: "there", group: "theyre" },
          " are always new things to discover if ",
          { correct: "you're", group: "youre" },
          " paying attention. '",
          { correct: "Their", group: "theyre" },
          " results improved this term,' the teacher noted, 'because ",
          { correct: "they're", group: "theyre" },
          " putting in real effort.'",
        ],
        [
          "'",
          { correct: "You're", group: "youre" },
          " all doing really well,' said Mr. Bello. '",
          { correct: "It's", group: "its" },
          " important to review ",
          { correct: "your", group: "youre" },
          " notes every evening. ",
          { correct: "There", group: "theyre" },
          " will be a test at the end of the week, and ",
          { correct: "it's", group: "its" },
          " always better to prepare as a group.'",
        ],
        [
          "At home, ",
          { correct: "it's", group: "its" },
          " easy to get distracted. '",
          { correct: "You're", group: "youre" },
          " spending too much time on that screen,' Mum warned. '",
          { correct: "Your", group: "youre" },
          " homework comes first.' ",
          { correct: "They're", group: "theyre" },
          " right. Once ",
          { correct: "you're", group: "youre" },
          " done with ",
          { correct: "your", group: "youre" },
          " work, ",
          { correct: "there", group: "theyre" },
          " is always time for fun.",
        ],
      ],
    },
  },

  // ───────────────────────────── UNIT 4 (NEW) ─────────────────────────────
  {
    id: "u-totwo",
    teach: `
      <h3 class="exp-heading">Dig a little deeper</h3>
      <p class="exp-intro"><strong>two</strong> is only ever the number 2. <strong>too</strong> means <em>also</em> or <em>more than enough</em>. <strong>to</strong> does every other job — direction, and the start of a verb.</p>
      <p class="exp-eg"><strong>two</strong>: "I have two pens." (the number)</p>
      <p class="exp-eg"><strong>too</strong>: "It is too hot." · "I want some too." (very / also)</p>
      <p class="exp-eg"><strong>to</strong>: "Walk to school." · "I like to read." (direction / verb)</p>
      <p class="exp-intro"><strong>too</strong> has an extra <em>o</em> — think of it as having "too many" o's, just like it often means "too much".</p>`,
    kind: "grammar",
    number: 4,
    color: "orange",
    title: "To, Too & Two",
    focus: "to · too · two",
    mascotPose: "teach",
    mainIdea: "Two is the number. Too means “also” or “excessively”. To does everything else.",
    keyVocab: [
      { term: "preposition", def: "to often shows direction (to school)" },
      { term: "infinitive", def: "to + verb (to run, to learn)" },
      { term: "adverb", def: "too can intensify (too hot) or add (me too)" },
    ],
    realWorld: {
      title: "Why it matters",
      text: "“I have too go” and “its two cold” are classic slips that cost easy marks in dictation and letter-writing tasks.",
      image: "photo-1497486751825-1233686d5d80",
    },
    studyTip: "If you can replace the word with the number 2, write two. If you can replace it with “also” or “very”, write too. Otherwise, to.",
    hot: [
      "Find the error: “I am to tired too walk the two miles.” Rewrite it.",
      "Open ended: write a sentence that uses to, too and two correctly, in that order.",
    ],
    lesson: {
      leftHTML: `
        <h2 class="exp-heading">One sound, three spellings</h2>
        <p class="exp-intro">They all sound like <em>"too"</em> — but watch the job:</p>
        <div class="exp-word-block exp-word-block--blue">
          <span class="exp-word">to</span>
          <span class="exp-eq">= <strong>towards / part of a verb</strong></span>
          <p class="exp-eg">"Going <em>to</em> school." · "I want <em>to</em> learn."</p>
        </div>
        <div class="exp-word-block exp-word-block--yellow">
          <span class="exp-word">too</span>
          <span class="exp-eq">= <strong>also / very</strong></span>
          <p class="exp-eg">"I'm coming <em>too</em>." · "It is <em>too</em> hot."</p>
        </div>
        <div class="exp-word-block exp-word-block--green">
          <span class="exp-word">two</span>
          <span class="exp-eq">= <strong>the number 2</strong></span>
          <p class="exp-eg">"I have <em>two</em> pencils."</p>
        </div>`,
      rightHTML: `
        <div class="exp-trick-box">
          <div class="exp-trick-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            The Detective's Trick
          </div>
          <ol class="exp-steps">
            <li class="exp-step">Can I count it — does <strong>"2"</strong> fit?<br><span class="exp-yes">Yes →</span> use <strong>two</strong></li>
            <li class="exp-step">Do I mean <strong>"also"</strong> or <strong>"very"</strong>?<br><span class="exp-yes">Yes →</span> use <strong>too</strong></li>
            <li class="exp-step">Everything else (direction, “to + verb”)<br><span class="exp-yes">→</span> use <strong>to</strong></li>
          </ol>
        </div>
        <div class="exp-quicktest">
          <p class="exp-qt-label">Quick Test</p>
          <p class="exp-qt-row"><span class="exp-qt-q">"I have <u>____</u> dogs."</span> → 2 fits → <strong>two</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"That bag is <u>____</u> heavy."</span> → very → <strong>too</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"We walked <u>____</u> the shop."</span> → direction → <strong>to</strong></p>
        </div>`,
    },
    passage: {
      id: "pass4",
      title: "Market Day",
      focus: "to / too / two",
      groups: ["totwo"],
      paragraphs: [
        [
          "On Saturday, Ada walked ",
          { correct: "to", group: "totwo" },
          " the market with her mother. They needed ",
          { correct: "two", group: "totwo" },
          " baskets for all the shopping. 'The sun is ",
          { correct: "too", group: "totwo" },
          " strong today,' Ada said. Her little brother wanted ",
          { correct: "to", group: "totwo" },
          " come ",
          { correct: "too", group: "totwo" },
          ", so all three set off together.",
        ],
        [
          "At the first stall they bought ",
          { correct: "two", group: "totwo" },
          " baskets of tomatoes. 'These are far ",
          { correct: "too", group: "totwo" },
          " expensive,' Mum said, deciding ",
          { correct: "to", group: "totwo" },
          " move on. Ada loved ",
          { correct: "to", group: "totwo" },
          " watch the traders call out prices. The noise was almost ",
          { correct: "too", group: "totwo" },
          " loud ",
          { correct: "to", group: "totwo" },
          " bear.",
        ],
        [
          "They stopped ",
          { correct: "to", group: "totwo" },
          " buy ",
          { correct: "two", group: "totwo" },
          " loaves of bread. 'Can I have one ",
          { correct: "too", group: "totwo" },
          "?' asked her brother. It was getting ",
          { correct: "too", group: "totwo" },
          " late ",
          { correct: "to", group: "totwo" },
          " visit the cloth sellers, so they began ",
          { correct: "to", group: "totwo" },
          " head home.",
        ],
        [
          "It took them ",
          { correct: "two", group: "totwo" },
          " trips ",
          { correct: "to", group: "totwo" },
          " carry everything inside. Ada was ",
          { correct: "too", group: "totwo" },
          " tired ",
          { correct: "to", group: "totwo" },
          " cook, and her brother was ",
          { correct: "too", group: "totwo" },
          ". 'Next time,' Mum laughed, 'we bring ",
          { correct: "two", group: "totwo" },
          " strong helpers!'",
        ],
      ],
    },
  },

  // ───────────────────────────── UNIT 5 (NEW) ─────────────────────────────
  {
    id: "u-thanthen",
    teach: `
      <h3 class="exp-heading">Dig a little deeper</h3>
      <p class="exp-intro"><strong>than</strong> always compares two things. <strong>then</strong> is about time or order — what happens next. They are never interchangeable.</p>
      <p class="exp-eg"><strong>than</strong>: "Taller than me." · "Better than ever." (comparing)</p>
      <p class="exp-eg"><strong>then</strong>: "We ate, then we slept." · "Back then…" (time / next)</p>
      <p class="exp-intro">Memory aid: th<strong>a</strong>n and comp<strong>a</strong>re share an <em>a</em>; th<strong>e</strong>n, wh<strong>e</strong>n and tim<strong>e</strong> share an <em>e</em>.</p>`,
    kind: "grammar",
    number: 5,
    color: "teal",
    title: "Than & Then",
    focus: "than · then",
    mascotPose: "think",
    mainIdea: "Than compares. Then is about time or order. The single letter changes the whole job.",
    keyVocab: [
      { term: "comparison", def: "than weighs one thing against another (taller than)" },
      { term: "sequence", def: "then shows what comes next in time (first… then…)" },
    ],
    realWorld: {
      title: "Why it matters",
      text: "Comparison sentences are everywhere in argumentative essays. Mixing up than/then turns a sharp comparison into a confusing time-line.",
      image: "photo-1513258496099-48168024aec0",
    },
    studyTip: "Comparing two things? Use than (both have an ‘a’ for ‘a-gainst’). Telling what happens next? Use then (then = when).",
    hot: [
      "Find the error: “She is taller then me, and then runs faster than me.”",
      "Open ended: write a sentence that uses both than and then correctly.",
    ],
    lesson: {
      leftHTML: `
        <h2 class="exp-heading">Compare or sequence?</h2>
        <p class="exp-intro">One letter, two very different jobs:</p>
        <div class="exp-word-block exp-word-block--blue">
          <span class="exp-word">than</span>
          <span class="exp-eq">= <strong>comparing</strong></span>
          <p class="exp-eg">"She is taller <em>than</em> me." · "Better late <em>than</em> never."</p>
        </div>
        <div class="exp-word-block exp-word-block--yellow">
          <span class="exp-word">then</span>
          <span class="exp-eq">= <strong>next / at that time</strong></span>
          <p class="exp-eg">"We ate, <em>then</em> we left." · "Back <em>then</em>, life was simpler."</p>
        </div>`,
      rightHTML: `
        <div class="exp-trick-box">
          <div class="exp-trick-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            The Detective's Trick
          </div>
          <ol class="exp-steps">
            <li class="exp-step">Am I <strong>comparing</strong> two things?<br><span class="exp-yes">Yes →</span> use <strong>than</strong></li>
            <li class="exp-step">Can I swap in <strong>"next"</strong> or <strong>"after that"</strong>?<br><span class="exp-yes">Yes →</span> use <strong>then</strong></li>
          </ol>
        </div>
        <div class="exp-quicktest">
          <p class="exp-qt-label">Quick Test</p>
          <p class="exp-qt-row"><span class="exp-qt-q">"Mangoes are sweeter <u>____</u> limes."</span> → comparing → <strong>than</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"Wash up, <u>____</u> sleep."</span> → next → <strong>then</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"It is colder now <u>____</u> before."</span> → comparing → <strong>than</strong></p>
        </div>`,
    },
    passage: {
      id: "pass5",
      title: "The Relay Race",
      focus: "than / then",
      groups: ["thanthen"],
      paragraphs: [
        [
          "Sport's Day was hotter ",
          { correct: "than", group: "thanthen" },
          " last year. First the whistle blew, ",
          { correct: "then", group: "thanthen" },
          " the runners shot off. Bisi was faster ",
          { correct: "than", group: "thanthen" },
          " everyone in her lane. She took the lead, ",
          { correct: "then", group: "thanthen" },
          " stretched it even further.",
        ],
        [
          "Our team was stronger ",
          { correct: "than", group: "thanthen" },
          " the others at the start. We passed the first baton, ",
          { correct: "then", group: "thanthen" },
          " the second. 'Run harder ",
          { correct: "than", group: "thanthen" },
          " ever!' shouted Coach. The crowd was louder ",
          { correct: "than", group: "thanthen" },
          " a thunderstorm, and ",
          { correct: "then", group: "thanthen" },
          " everyone began to cheer.",
        ],
        [
          "The final leg mattered more ",
          { correct: "than", group: "thanthen" },
          " any other. Tobi grabbed the baton, ",
          { correct: "then", group: "thanthen" },
          " sprinted. He was slower ",
          { correct: "than", group: "thanthen" },
          " his rival at first, but ",
          { correct: "then", group: "thanthen" },
          " he found another gear.",
        ],
        [
          "He crossed the line just ahead, ",
          { correct: "then", group: "thanthen" },
          " collapsed onto the grass, happier ",
          { correct: "than", group: "thanthen" },
          " he had ever been. 'That was harder ",
          { correct: "than", group: "thanthen" },
          " training,' he gasped. We celebrated, ",
          { correct: "then", group: "thanthen" },
          " shared cold water with the team we had beaten.",
        ],
      ],
    },
  },

  // ───────────────────────────── UNIT 6 ─────────────────────────────
  {
    id: "u-inon",
    teach: `
      <h3 class="exp-heading">Dig a little deeper</h3>
      <p class="exp-intro">With vehicles, English uses <strong>in</strong> and <strong>on</strong> in a fixed way — it depends on the <strong>kind</strong> of vehicle, not exactly where you sit.</p>
      <p class="exp-eg"><strong>in</strong> = small vehicles you climb into and sit down: "in a car", "in a taxi".</p>
      <p class="exp-eg"><strong>on</strong> = large vehicles you can stand up and walk about in: "on a bus", "on a train", "on a plane".</p>
      <p class="exp-intro">Think of size. If you must bend down to get in (a car, a taxi), use <strong>in</strong>. If you could walk down an aisle (a bus, train, plane or ship), use <strong>on</strong>.</p>`,
    kind: "grammar",
    number: 6,
    color: "orange",
    title: "In & On (Vehicles)",
    focus: "in · on",
    mascotPose: "teach",
    mainIdea: "Small vehicles you climb into take 'in'; large vehicles you can walk about in take 'on'.",
    keyVocab: [
      { term: "preposition", def: "a small linking word that shows place or direction (in, on, at)" },
      { term: "vehicle", def: "something that carries people — a car, bus, train or plane" },
    ],
    realWorld: {
      title: "Why it matters",
      text: "“I came on a taxi” instantly sounds wrong to an examiner. Getting in/on right with everyday transport is a quick, easy mark to keep.",
      image: "photo-1513258496099-48168024aec0",
    },
    studyTip: "Could you stand up and walk down an aisle? Then it is ON (bus, train, plane, ship). If you must duck and sit, it is IN (car, taxi).",
    hot: [
      "Find the error: “We went on a car to the airport, then we got in the plane.”",
      "Open ended: write one sentence using ‘in’ for a taxi and ‘on’ for a bus.",
    ],
    lesson: {
      leftHTML: `
        <h2 class="exp-heading">In or On a vehicle?</h2>
        <p class="exp-intro">The vehicle decides the word:</p>
        <div class="exp-word-block exp-word-block--blue">
          <span class="exp-word">in</span>
          <span class="exp-eq">= <strong>small / climb in</strong></span>
          <p class="exp-eg">"<em>in</em> a car" · "<em>in</em> a taxi" · "<em>in</em> a lorry"</p>
        </div>
        <div class="exp-word-block exp-word-block--green">
          <span class="exp-word">on</span>
          <span class="exp-eq">= <strong>large / walk about</strong></span>
          <p class="exp-eg">"<em>on</em> a bus" · "<em>on</em> a train" · "<em>on</em> a plane" · "<em>on</em> a ship"</p>
        </div>`,
      rightHTML: `
        <div class="exp-trick-box">
          <div class="exp-trick-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            The Detective's Trick
          </div>
          <ol class="exp-steps">
            <li class="exp-step">Could I <strong>stand and walk</strong> inside it (bus, train, plane, ship)?<br><span class="exp-yes">Yes →</span> use <strong>on</strong></li>
            <li class="exp-step">Must I <strong>duck down and sit</strong> (car, taxi)?<br><span class="exp-yes">Yes →</span> use <strong>in</strong></li>
          </ol>
        </div>
        <div class="exp-quicktest">
          <p class="exp-qt-label">Quick Test</p>
          <p class="exp-qt-row"><span class="exp-qt-q">"We sat <u>____</u> a taxi."</span> → small, climb in → <strong>in</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"She is <u>____</u> the bus."</span> → large, walk about → <strong>on</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"They flew <u>____</u> a plane."</span> → large → <strong>on</strong></p>
        </div>`,
    },
    passage: {
      id: "pass6",
      title: "The Journey to Lagos",
      focus: "in / on",
      groups: ["inon"],
      paragraphs: [
        [
          "Early in the morning, Dad and Ada climbed ",
          { correct: "in", group: "inon" },
          " the car and drove to the park. There, they got ",
          { correct: "on", group: "inon" },
          " a big bus to the city. Ada loved being ",
          { correct: "on", group: "inon" },
          " the bus because she could walk to the back and find a seat by the window.",
        ],
        [
          "At the station they jumped ",
          { correct: "on", group: "inon" },
          " a train. 'Hold the rail when you walk ",
          { correct: "on", group: "inon" },
          " the train,' said Dad. When they arrived, a friendly driver was waiting, so they hopped ",
          { correct: "in", group: "inon" },
          " his taxi for the last short ride.",
        ],
        [
          "The next day they went to the airport and stepped ",
          { correct: "on", group: "inon" },
          " a plane for the very first time. Grandma had travelled ",
          { correct: "in", group: "inon" },
          " a small car to meet them, but the children had come ",
          { correct: "on", group: "inon" },
          " a ship across the water the week before.",
        ],
      ],
    },
  },

  // ───────────────────────── PUNCTUATION UNIT 1 ─────────────────────────
  {
    id: "u-endmarks",
    teach: `
      <h3 class="exp-heading">Dig a little deeper</h3>
      <p class="exp-intro">Every sentence must end with a mark. A statement <em>tells</em> and ends with a full stop. A question <em>asks</em> and ends with a question mark.</p>
      <p class="exp-eg">Statement: "The bus is late." ( . )</p>
      <p class="exp-eg">Question: "Is the bus late?" ( ? )</p>
      <p class="exp-intro">Read your sentence aloud. If your voice rises at the end, as if you expect an answer, it is a question. If your voice falls and stops, it is a statement.</p>`,
    kind: "punctuation",
    number: 7,
    color: "blue",
    title: "Questions & Statements",
    focus: "? · .",
    mascotPose: "teach",
    mainIdea: "Every sentence needs an ending. A question asks; a statement tells. The mark must match the job.",
    keyVocab: [
      { term: "statement", def: "a sentence that tells something — ends with a full stop" },
      { term: "question", def: "a sentence that asks something — ends with a question mark" },
    ],
    realWorld: {
      title: "Why it matters",
      text: "Missing end-marks are the #1 reason a sentence is marked as a run-on. One dot or curl can rescue a whole answer.",
      image: "photo-1497633762265-9d179a990aa6",
    },
    studyTip: "Read it aloud. If your voice rises at the end, it's almost always a question (?).",
    hot: [
      "Find the error: “Where is my bag. The room is empty?”",
      "Open ended: write one question and one statement about the same picture.",
    ],
    lesson: {
      leftHTML: `
        <h2 class="exp-heading">Sentence Endings</h2>
        <p class="exp-intro">Every sentence needs an ending mark:</p>
        <div class="exp-word-block exp-word-block--blue">
          <span class="exp-word exp-word--punct">?</span>
          <span class="exp-eq">= <strong>question mark</strong></span>
          <p class="exp-eg">"Are you ready?" &nbsp;·&nbsp; "Where is Kemi?"</p>
        </div>
        <div class="exp-word-block exp-word-block--yellow">
          <span class="exp-word exp-word--punct">.</span>
          <span class="exp-eq">= <strong>full stop</strong></span>
          <p class="exp-eg">"She is ready." &nbsp;·&nbsp; "We went home."</p>
        </div>
        <div class="exp-secret-box">
          <p class="exp-secret-title">Question words</p>
          <p class="exp-secret-body">Sentences starting with <strong>Who, What, Where, When, Why, How, Is, Are, Did, Do, Can, Will</strong> are nearly always questions.</p>
        </div>`,
      rightHTML: `
        <div class="exp-trick-box">
          <div class="exp-trick-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            The Test
          </div>
          <ol class="exp-steps">
            <li class="exp-step">Is the sentence <strong>asking</strong> something?<br><span class="exp-yes">Yes →</span> use <strong>?</strong></li>
            <li class="exp-step">Is the sentence <strong>telling</strong> something?<br><span class="exp-yes">Yes →</span> use <strong>.</strong></li>
          </ol>
        </div>
        <div class="exp-quicktest">
          <p class="exp-qt-label">Quick Test</p>
          <p class="exp-qt-row"><span class="exp-qt-q">"Did you eat<u>__</u>"</span> → asking → <strong>?</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"She ate pizza<u>__</u>"</span> → telling → <strong>.</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"Where is my bag<u>__</u>"</span> → asking → <strong>?</strong></p>
        </div>`,
    },
    exercise: {
      id: "ex1",
      title: "Questions & Statements",
      focus: "? · .",
      pool: ["?", "."],
      items: [
        ["Is the sky blue", { correct: "?" }],
        ["She packed her school bag", { correct: "." }],
        ["Can you hear that noise", { correct: "?" }],
        ["The mango tree is very tall", { correct: "." }],
        ["Did you finish your supper", { correct: "?" }],
        ["Kemi walked home from school", { correct: "." }],
        ["Where is your homework", { correct: "?" }],
        ["The match started at three o'clock", { correct: "." }],
        ["Are you coming to the party", { correct: "?" }],
        ["We ate rice and stew for lunch", { correct: "." }],
        ["Who left the door open", { correct: "?" }],
        ["The market was very busy today", { correct: "." }],
      ],
    },
  },

  // ───────────────────────── PUNCTUATION UNIT 2 ─────────────────────────
  {
    id: "u-commas",
    teach: `
      <h3 class="exp-heading">Dig a little deeper</h3>
      <p class="exp-intro">A comma tells the reader to pause. Two everyday jobs: separating items in a list, and marking off an opening phrase before the main idea.</p>
      <p class="exp-eg">List: "We bought rice, beans, and yam."</p>
      <p class="exp-eg">Opening phrase: "After the rain, we played outside."</p>
      <p class="exp-intro">A comma can change meaning completely. "Let's eat, Grandma" invites Grandma to eat; "Let's eat Grandma" is something else entirely!</p>`,
    kind: "punctuation",
    number: 8,
    color: "green",
    title: "Commas in Lists & Phrases",
    focus: ",",
    mascotPose: "think",
    mainIdea: "A comma is a short pause. Use it to separate items in a list and after an opening phrase.",
    keyVocab: [
      { term: "list", def: "three or more items separated by commas" },
      { term: "opening phrase", def: "an introduction at the start of a sentence (After school, …)" },
    ],
    realWorld: {
      title: "Why it matters",
      text: "“Let's eat, Grandma” vs “Let's eat Grandma” — one comma decides whether dinner is friendly or frightening.",
      image: "photo-1531545514256-b1400bc00f31",
    },
    studyTip: "Only one item before “and”? No comma needed. Three or more? Commas between them.",
    hot: [
      "Find the error: “After lunch we played football basketball and tennis.”",
      "Open ended: write a sentence that lists four things you packed for a trip.",
    ],
    lesson: {
      leftHTML: `
        <h2 class="exp-heading">The Pause Mark</h2>
        <p class="exp-intro">A comma marks a short pause. Use it in two main ways:</p>
        <div class="exp-word-block exp-word-block--blue">
          <span class="exp-word exp-word--punct">,</span>
          <span class="exp-eq">= <strong>between items in a list</strong></span>
          <p class="exp-eg">"I have a dog, a cat, and a fish."</p>
        </div>
        <div class="exp-word-block exp-word-block--yellow">
          <span class="exp-word exp-word--punct">,</span>
          <span class="exp-eq">= <strong>after an opening phrase</strong></span>
          <p class="exp-eg">"After school, we played." · "Before you eat, wash your hands."</p>
        </div>`,
      rightHTML: `
        <div class="exp-trick-box">
          <div class="exp-trick-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            The Comma Test
          </div>
          <ol class="exp-steps">
            <li class="exp-step">Are there <strong>items in a list</strong>?<br><span class="exp-yes">Yes →</span> put commas between them</li>
            <li class="exp-step">Does the sentence <strong>start with a phrase</strong> (time / place / if / after / before)?<br><span class="exp-yes">Yes →</span> put a comma after it</li>
          </ol>
        </div>
        <div class="exp-quicktest">
          <p class="exp-qt-label">Quick Test</p>
          <p class="exp-qt-row"><span class="exp-qt-q">"I like apples<u>__</u> pears<u>__</u> and mangoes."</span><br>→ list → <strong>, ,</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"After the rain<u>__</u> the sun came out."</span><br>→ opening phrase → <strong>,</strong></p>
        </div>
        <div class="exp-reminder">
          <p><strong>Note:</strong> No comma is needed before "and" when there are only <em>two</em> items.</p>
          <p style="margin-top:0.2rem">"I have a dog and a cat." ← no comma needed</p>
        </div>`,
    },
    exercise: {
      id: "ex2",
      title: "Commas in Lists & Phrases",
      focus: ",",
      pool: [","],
      items: [
        ["I like football", { correct: "," }, " basketball", { correct: "," }, " and athletics."],
        ["After school", { correct: "," }, " we went to the playground."],
        ["She is kind", { correct: "," }, " clever", { correct: "," }, " and hardworking."],
        ["Before you sleep", { correct: "," }, " brush your teeth."],
        ["We visited Lagos", { correct: "," }, " Abuja", { correct: "," }, " and Enugu."],
        ["He bought bread", { correct: "," }, " eggs", { correct: "," }, " and milk."],
        ["On Fridays", { correct: "," }, " we wear our school uniforms."],
        ["Her bag had books", { correct: "," }, " pencils", { correct: "," }, " and a ruler."],
        ["If it rains", { correct: "," }, " we will have class inside."],
        ["He ran fast", { correct: "," }, " jumped high", { correct: "," }, " and won the race."],
      ],
    },
  },

  // ───────────────────────── PUNCTUATION UNIT 3 ─────────────────────────
  {
    id: "u-mixedpunct",
    teach: `
      <h3 class="exp-heading">Dig a little deeper</h3>
      <p class="exp-intro">Real writing mixes all three marks. Place the inside commas first to break the sentence into clear parts, then decide the ending mark last.</p>
      <p class="exp-eg">"After lunch, we washed, dried, and stacked the plates."</p>
      <p class="exp-eg">"Where did you put the keys, Tunde?"</p>
      <p class="exp-intro">Work from the inside out: commas organise the middle of a sentence, while the full stop or question mark closes it.</p>`,
    kind: "punctuation",
    number: 9,
    color: "purple",
    title: "Mixed Punctuation",
    focus: "? · . · ,",
    mascotPose: "salute",
    mainIdea: "Put all three together: ask with ?, tell with ., and pause with , — sometimes in the same sentence.",
    keyVocab: [
      { term: "end mark", def: "the . or ? that closes a sentence" },
      { term: "internal punctuation", def: "marks like , that sit inside a sentence" },
    ],
    realWorld: {
      title: "Why it matters",
      text: "Real writing needs all three marks working together. Editors call clean punctuation 'invisible' — it lets the meaning shine.",
      image: "photo-1513475382585-d06e58bcb0e0",
    },
    studyTip: "Place the inside commas first, then decide the ending mark last.",
    hot: [
      "Find the error: “After we ate we washed up then slept”.",
      "Open ended: write one sentence that needs a comma AND a question mark.",
    ],
    lesson: {
      leftHTML: `
        <h2 class="exp-heading">All Three Together</h2>
        <p class="exp-intro">A quick reminder of all three marks:</p>
        <div class="exp-word-block exp-word-block--blue">
          <span class="exp-word exp-word--punct">?</span>
          <span class="exp-eq">= <strong>asking</strong></span>
          <p class="exp-eg">"Where are you going?"</p>
        </div>
        <div class="exp-word-block exp-word-block--yellow">
          <span class="exp-word exp-word--punct">.</span>
          <span class="exp-eq">= <strong>telling / statement</strong></span>
          <p class="exp-eg">"She went to school."</p>
        </div>
        <div class="exp-word-block exp-word-block--green">
          <span class="exp-word exp-word--punct">,</span>
          <span class="exp-eq">= <strong>pause (list or opening phrase)</strong></span>
          <p class="exp-eg">"After class, we ate rice, beans, and stew."</p>
        </div>`,
      rightHTML: `
        <div class="exp-trick-box">
          <div class="exp-trick-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            The 3-Step Check
          </div>
          <ol class="exp-steps">
            <li class="exp-step">Is it a <strong>question</strong>? → <strong>?</strong></li>
            <li class="exp-step">End of a <strong>statement</strong>? → <strong>.</strong></li>
            <li class="exp-step"><strong>List</strong> or <strong>opening phrase</strong>? → <strong>,</strong></li>
          </ol>
        </div>
        <div class="exp-pairs-grid">
          <div class="exp-pair"><span class="exp-pair-a">?</span><span class="exp-pair-sep">=</span><span class="exp-pair-b">question</span></div>
          <div class="exp-pair"><span class="exp-pair-a">.</span><span class="exp-pair-sep">=</span><span class="exp-pair-b">statement</span></div>
          <div class="exp-pair"><span class="exp-pair-a">,</span><span class="exp-pair-sep">=</span><span class="exp-pair-b">list / pause</span></div>
        </div>
        <div class="exp-reminder">
          <p><strong>Top tip:</strong> Read the sentence aloud. A <em>pause inside</em> = comma. Voice <em>goes up at end</em> = question mark. Voice <em>stops at end</em> = full stop.</p>
        </div>`,
    },
    exercise: {
      id: "ex3",
      title: "Mixed Punctuation",
      focus: "? · . · ,",
      pool: ["?", ".", ","],
      items: [
        ["Did you eat breakfast", { correct: "?" }],
        ["The cat sat on the mat", { correct: "." }],
        ["I packed my books", { correct: "," }, " my lunch", { correct: "," }, " and my water bottle", { correct: "." }],
        ["Where is the library", { correct: "?" }],
        ["After the game", { correct: "," }, " we drank cold water", { correct: "." }],
        ["She reads", { correct: "," }, " writes", { correct: "," }, " and draws every day", { correct: "." }],
        ["Can you help me with this", { correct: "?" }],
        ["The sun set behind the hills", { correct: "." }],
        ["Before leaving", { correct: "," }, " check that the lights are off", { correct: "." }],
        ["Who is your favourite teacher", { correct: "?" }],
        ["He is funny", { correct: "," }, " kind", { correct: "," }, " and always helpful", { correct: "." }],
        ["We finished all our work", { correct: "." }],
      ],
    },
  },

  // ───────────────────────── PUNCTUATION UNIT 4 (NEW) ─────────────────────────
  {
    id: "u-apostrophe",
    teach: `
      <h3 class="exp-heading">Dig a little deeper</h3>
      <p class="exp-intro">The apostrophe has two jobs: it joins words into a contraction, and it shows that something belongs to someone. It never makes a word plural.</p>
      <p class="exp-eg">Contraction: "do not" becomes "don't".</p>
      <p class="exp-eg">Belonging: "the bag of Ada" becomes "Ada's bag".</p>
      <p class="exp-intro">Watch out: "three mangoes" needs <em>no</em> apostrophe — it is just a plural, nothing is missing and nothing is owned.</p>`,
    kind: "punctuation",
    number: 10,
    color: "orange",
    title: "Apostrophes",
    focus: "’",
    mascotPose: "teach",
    mainIdea: "The apostrophe does two jobs: it joins words into a contraction, and it shows that something belongs to someone.",
    keyVocab: [
      { term: "contraction", def: "do not → don't · it is → it's" },
      { term: "possession", def: "the boy's bag = the bag of the boy" },
    ],
    realWorld: {
      title: "Why it matters",
      text: "Shop signs famously get this wrong — 'banana's for sale'. Examiners notice a missing or stray apostrophe immediately.",
      image: "photo-1524178232363-1fb2b075b655",
    },
    studyTip: "For belonging, ask “who owns it?”. Put the apostrophe right after the owner: the girl's → one girl owns it.",
    hot: [
      "Find the error: “Its the teachers job to mark the boys books.”",
      "Open ended: write a sentence with one contraction and one possessive apostrophe.",
    ],
    lesson: {
      leftHTML: `
        <h2 class="exp-heading">The Hard-Working Mark</h2>
        <p class="exp-intro">The apostrophe (<strong>’</strong>) has two jobs:</p>
        <div class="exp-word-block exp-word-block--blue">
          <span class="exp-word exp-word--punct">’</span>
          <span class="exp-eq">= <strong>missing letters (contraction)</strong></span>
          <p class="exp-eg">"do not → <em>don't</em>" · "it is → <em>it's</em>"</p>
        </div>
        <div class="exp-word-block exp-word-block--yellow">
          <span class="exp-word exp-word--punct">’</span>
          <span class="exp-eq">= <strong>belonging (possession)</strong></span>
          <p class="exp-eg">"Ada<em>'s</em> pen" · "the dog<em>'s</em> tail"</p>
        </div>`,
      rightHTML: `
        <div class="exp-trick-box">
          <div class="exp-trick-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            The Test
          </div>
          <ol class="exp-steps">
            <li class="exp-step">Are two words <strong>squeezed together</strong>?<br><span class="exp-yes">Yes →</span> apostrophe where letters vanish</li>
            <li class="exp-step">Does something <strong>belong</strong> to someone?<br><span class="exp-yes">Yes →</span> apostrophe after the owner</li>
          </ol>
        </div>
        <div class="exp-quicktest">
          <p class="exp-qt-label">Quick Test</p>
          <p class="exp-qt-row"><span class="exp-qt-q">"can not → <u>____</u>"</span> → contraction → <strong>can't</strong></p>
          <p class="exp-qt-row"><span class="exp-qt-q">"the bag of Tope"</span> → belonging → <strong>Tope's bag</strong></p>
        </div>
        <div class="exp-reminder">
          <p><strong>Watch out:</strong> plain plurals take <em>no</em> apostrophe. "Three mangoes" — not "mango's".</p>
        </div>`,
    },
    exercise: {
      id: "ex4",
      title: "Apostrophes",
      focus: "’",
      pool: ["’"],
      items: [
        ["We did", { correct: "’" }, "nt finish the test."],
        ["That is Bola", { correct: "’" }, "s bicycle."],
        ["The teacher said it is", { correct: "’" }, "nt allowed."],
        ["My brother", { correct: "’" }, "s shoes are muddy."],
        ["I can", { correct: "’" }, "t hear the radio."],
        ["The dog wagged the cat", { correct: "’" }, "s tail."],
        ["They have", { correct: "’" }, "nt arrived yet."],
        ["Ada borrowed her friend", { correct: "’" }, "s ruler."],
        ["You should", { correct: "’" }, "nt run in the hall."],
        ["The school", { correct: "’" }, "s gates open at eight."],
      ],
    },
  },
];

module.exports = {
  meta: {
    title: "Grammar Police",
    subtitle: "& Punctuation Patrol",
    edition: "Field Manual · Prep Portal English",
    version: 2,
  },
  mascot: MASCOT,
  media: MEDIA,
  wordGroups: WORD_GROUPS,
  units: UNITS,
};
