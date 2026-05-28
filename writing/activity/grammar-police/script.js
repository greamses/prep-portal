"use strict";

/* ═══════════════════════════════════════════════════════════
   WORD GROUP DATA
   ═══════════════════════════════════════════════════════════ */
const WORD_GROUPS = {
  theyre: {
    options: ["they're", "their", "there"],
    label:   "they're / their / there",
  },
  were: {
    options: ["we're", "were", "where"],
    label:   "we're / were / where",
  },
  youre: {
    options: ["you're", "your"],
    label:   "you're / your",
  },
  its: {
    options: ["it's", "its"],
    label:   "it's / its",
  },
};

/* ═══════════════════════════════════════════════════════════
   GRAMMAR EXPLANATION DATA
   ═══════════════════════════════════════════════════════════ */
const EXPLANATIONS = [
  /* ── Case 01: they're / their / there ─────────────────── */
  {
    caseNum: "01",
    title:   "They're, Their & There",
    focus:   "they're · their · there",
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

      <div class="exp-concept-cards">
        <div class="exp-cc exp-cc--blue">
          <img src="./images/concept-theyre.svg" width="44" height="32" alt="" aria-hidden="true">
          <strong>they're</strong>
          <span>= they are</span>
        </div>
        <div class="exp-cc exp-cc--yellow">
          <img src="./images/concept-their.svg" width="44" height="32" alt="" aria-hidden="true">
          <strong>their</strong>
          <span>= belongs to them</span>
        </div>
        <div class="exp-cc exp-cc--green">
          <img src="./images/concept-there.svg" width="44" height="32" alt="" aria-hidden="true">
          <strong>there</strong>
          <span>= a place</span>
        </div>
      </div>

      <div class="exp-quicktest">
        <p class="exp-qt-label">Quick Test</p>
        <p class="exp-qt-row"><span class="exp-qt-q">"<u>____</u> going home."</span> → <em>They are</em> going ✓ → <strong>they're</strong></p>
        <p class="exp-qt-row"><span class="exp-qt-q">"Pack <u>____</u> bags."</span> → belongs to them → <strong>their</strong></p>
        <p class="exp-qt-row"><span class="exp-qt-q">"Wait over <u>____</u>."</span> → points to a place → <strong>there</strong></p>
      </div>`,
  },

  /* ── Case 02: we're / were / where ────────────────────── */
  {
    caseNum: "02",
    title:   "We're, Were & Where",
    focus:   "we're · were · where",
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
          <li class="exp-step">Am I talking about something that happened <strong>in the past</strong>?<br><span class="exp-yes">Yes →</span> use <strong>were</strong></li>
          <li class="exp-step">Am I asking about or pointing to a <strong>place</strong>?<br><span class="exp-yes">Yes →</span> use <strong>where</strong></li>
        </ol>
      </div>

      <div class="exp-concept-cards">
        <div class="exp-cc exp-cc--blue">
          <img src="./images/concept-weare.svg" width="44" height="32" alt="" aria-hidden="true">
          <strong>we're</strong>
          <span>= we are</span>
        </div>
        <div class="exp-cc exp-cc--yellow">
          <img src="./images/concept-past.svg" width="44" height="32" alt="" aria-hidden="true">
          <strong>were</strong>
          <span>= in the past</span>
        </div>
        <div class="exp-cc exp-cc--green">
          <img src="./images/concept-where.svg" width="44" height="32" alt="" aria-hidden="true">
          <strong>where</strong>
          <span>= a place</span>
        </div>
      </div>

      <div class="exp-quicktest">
        <p class="exp-qt-label">Quick Test</p>
        <p class="exp-qt-row"><span class="exp-qt-q">"<u>____</u> all going home."</span> → We <em>are</em> going ✓ → <strong>we're</strong></p>
        <p class="exp-qt-row"><span class="exp-qt-q">"The bags <u>____</u> heavy."</span> → past tense → <strong>were</strong></p>
        <p class="exp-qt-row"><span class="exp-qt-q">"<u>____</u> did you go?"</span> → asking about a place → <strong>where</strong></p>
      </div>`,
  },

  /* ── Case 03: Mixed ─────────────────────────────────────── */
  {
    caseNum: "03",
    title:   "The Final Challenge",
    focus:   "they're · their · there · you're · your · it's · its",
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
        <div class="exp-pair">
          <span class="exp-pair-a">they're</span><span class="exp-pair-sep">=</span><span class="exp-pair-b">they + are</span>
        </div>
        <div class="exp-pair">
          <span class="exp-pair-a">you're</span><span class="exp-pair-sep">=</span><span class="exp-pair-b">you + are</span>
        </div>
        <div class="exp-pair">
          <span class="exp-pair-a">it's</span><span class="exp-pair-sep">=</span><span class="exp-pair-b">it + is</span>
        </div>
        <div class="exp-pair">
          <span class="exp-pair-a">we're</span><span class="exp-pair-sep">=</span><span class="exp-pair-b">we + are</span>
        </div>
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
];

/* ═══════════════════════════════════════════════════════════
   GRAMMAR PASSAGE DATA
   ═══════════════════════════════════════════════════════════ */
const PASSAGES = [
  {
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

  {
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

  {
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
];

/* ═══════════════════════════════════════════════════════════
   PUNCTUATION PATROL — EXPLANATION DATA
   ═══════════════════════════════════════════════════════════ */
const PP_EXPLANATIONS = [
  /* ── Case 01: ? and . ───────────────────────────────────── */
  {
    caseNum: "01",
    title:   "Questions & Statements",
    focus:   "? · .",
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
        <p class="exp-qt-row"><span class="exp-qt-q">"The dog barked<u>__</u>"</span> → telling → <strong>.</strong></p>
      </div>

      <div class="exp-reminder">
        <p><strong>Tip:</strong> Read aloud. If your voice goes <em>up</em> at the end, it is usually a question.</p>
      </div>`,
  },

  /* ── Case 02: , ─────────────────────────────────────────── */
  {
    caseNum: "02",
    title:   "Commas",
    focus:   ",",
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

  /* ── Case 03: Mixed ─────────────────────────────────────── */
  {
    caseNum: "03",
    title:   "Mixed Punctuation",
    focus:   "? · . · ,",
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
];

/* ═══════════════════════════════════════════════════════════
   PUNCTUATION PATROL — EXERCISE DATA
   ═══════════════════════════════════════════════════════════ */
const PP_EXERCISES = [
  {
    id:    "ex1",
    title: "Questions & Statements",
    focus: "? · .",
    pool:  ["?", "."],
    items: [
      ["Is the sky blue",                        { correct: "?" }],
      ["She packed her school bag",              { correct: "." }],
      ["Can you hear that noise",                { correct: "?" }],
      ["The mango tree is very tall",            { correct: "." }],
      ["Did you finish your supper",             { correct: "?" }],
      ["Kemi walked home from school",           { correct: "." }],
      ["Where is your homework",                 { correct: "?" }],
      ["The match started at three o'clock",     { correct: "." }],
      ["Are you coming to the party",            { correct: "?" }],
      ["We ate rice and stew for lunch",         { correct: "." }],
      ["Who left the door open",                 { correct: "?" }],
      ["The market was very busy today",         { correct: "." }],
    ],
  },
  {
    id:    "ex2",
    title: "Commas in Lists & Phrases",
    focus: ",",
    pool:  [","],
    items: [
      ["I like football",   { correct: "," }, " basketball",  { correct: "," }, " and athletics."],
      ["After school",      { correct: "," }, " we went to the playground."],
      ["She is kind",       { correct: "," }, " clever",      { correct: "," }, " and hardworking."],
      ["Before you sleep",  { correct: "," }, " brush your teeth."],
      ["We visited Lagos",  { correct: "," }, " Abuja",       { correct: "," }, " and Enugu."],
      ["He bought bread",   { correct: "," }, " eggs",        { correct: "," }, " and milk."],
      ["On Fridays",        { correct: "," }, " we wear our school uniforms."],
      ["Her bag had books", { correct: "," }, " pencils",     { correct: "," }, " and a ruler."],
      ["If it rains",       { correct: "," }, " we will have class inside."],
      ["He ran fast",       { correct: "," }, " jumped high", { correct: "," }, " and won the race."],
    ],
  },
  {
    id:    "ex3",
    title: "Mixed Punctuation",
    focus: "? · . · ,",
    pool:  ["?", ".", ","],
    items: [
      ["Did you eat breakfast",                                           { correct: "?" }],
      ["The cat sat on the mat",                                          { correct: "." }],
      ["I packed my books", { correct: "," }, " my lunch", { correct: "," }, " and my water bottle", { correct: "." }],
      ["Where is the library",                                            { correct: "?" }],
      ["After the game",  { correct: "," }, " we drank cold water",      { correct: "." }],
      ["She reads",       { correct: "," }, " writes",     { correct: "," }, " and draws every day", { correct: "." }],
      ["Can you help me with this",                                       { correct: "?" }],
      ["The sun set behind the hills",                                    { correct: "." }],
      ["Before leaving",  { correct: "," }, " check that the lights are off", { correct: "." }],
      ["Who is your favourite teacher",                                   { correct: "?" }],
      ["He is funny",     { correct: "," }, " kind",       { correct: "," }, " and always helpful", { correct: "." }],
      ["We finished all our work",                                        { correct: "." }],
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════ */
let pageFlip  = null;
let bookBuilt = false;

const EXPLANATION_START_PAGE = [];
const PASSAGE_START_PAGE     = [];
const PP_EXPL_START          = [];
const PP_EXER_START          = [];

/* PP drag state */
const drag = {
  char:       null,
  sourceSlot: null,
  ghost:      null,
  selected:   null,
};

/* ═══════════════════════════════════════════════════════════
   WEB AUDIO — page-turn sound synthesizer
   ═══════════════════════════════════════════════════════════ */
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playFlipSound() {
  if (!audioCtx) return;
  initAudio();
  const duration   = 0.5;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer     = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data       = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise  = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + duration);
  filter.Q.setValueAtTime(4.0, audioCtx.currentTime);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
}


/* ═══════════════════════════════════════════════════════════
   PAGE BUILDERS — HELPERS
   ═══════════════════════════════════════════════════════════ */
function makePage(extraClass, density) {
  const div = document.createElement("div");
  div.className = `page${extraClass ? " " + extraClass : ""}`;
  if (density) div.dataset.density = density;
  return div;
}

function coverPattern() {
  return `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <pattern id="diag" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255,255,255,0.05)" stroke-width="6"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#diag)"/>
  </svg>`;
}

/* ── Front Cover ─────────────────────────────────────────── */
function makeCoverPage() {
  const page = makePage("", "hard");
  page.innerHTML = `
    <div class="pc pc--cover">
      <div class="pc-cover-bg" aria-hidden="true">
        ${coverPattern()}
      </div>
      <div class="pc-cover-content">
        <div class="pc-cover-badge" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
            <path d="M32 4L6 17V38C6 51 17 62 32 64C47 62 58 51 58 38V17L32 4Z"
                  fill="rgba(255,229,0,0.18)" stroke="#ffe500" stroke-width="2.5"/>
            <path d="M22 33L29 40L42 26" stroke="#ffe500" stroke-width="3.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="pc-cover-title">Grammar<br>Police</h1>
        <p class="pc-cover-pp-sub">+ Punctuation Patrol</p>
        <p class="pc-cover-sub">English · Prep Portal</p>
        <div class="pc-cover-divider"></div>
        <ul class="pc-cover-chips" aria-label="Activity details">
          <li>3 Passages</li>
          <li>3 Exercises</li>
          <li>60+ Blanks</li>
          <li>Drag &amp; Drop</li>
        </ul>
        <p class="pc-cover-hint">Open to start &rarr;</p>
      </div>
      <div class="pc-cover-footer">prepportal.com</div>
    </div>`;
  return page;
}

/* ── TOC Left Page ───────────────────────────────────────── */
function makeTOCLeftPage() {
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--toc">
      <div class="pc-header">Table of Contents</div>
      <ul class="pc-toc-list" id="pcTocList">
        <li class="pc-toc-section-header">
          <span class="pc-toc-section-label">Grammar Police</span>
        </li>
        ${PASSAGES.map((p, i) => `
          <li class="pc-toc-item" data-goto-explanation="${i}">
            <span class="pc-toc-num">0${i + 1}</span>
            <span class="pc-toc-info">
              <strong class="pc-toc-title">${p.title}</strong>
              <span class="pc-toc-focus">${p.focus}</span>
              <span class="pc-toc-badge">Learn + Practise</span>
            </span>
            <span class="pc-toc-arrow">&rarr;</span>
          </li>`).join("")}
        <li class="pc-toc-section-header">
          <span class="pc-toc-section-label">Punctuation Patrol</span>
        </li>
        ${PP_EXERCISES.map((ex, i) => `
          <li class="pc-toc-item" data-goto-pp-explanation="${i}">
            <span class="pc-toc-num">0${i + 4}</span>
            <span class="pc-toc-info">
              <strong class="pc-toc-title">${ex.title}</strong>
              <span class="pc-toc-focus">${ex.focus}</span>
              <span class="pc-toc-badge">Learn + Practise</span>
            </span>
            <span class="pc-toc-arrow">&rarr;</span>
          </li>`).join("")}
      </ul>
      <p class="pc-toc-tip">Click a title to go straight to that lesson.</p>
    </div>`;
  return page;
}

/* ── TOC Right Page ──────────────────────────────────────── */
function makeTOCRightPage() {
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--ref">
      <div class="pc-header">How This Book Works</div>
      <div class="pc-howto">
        <div class="pc-howto-step">
          <span class="pc-howto-num">1</span>
          <div>
            <strong>Read the lesson</strong>
            <p>Each chapter opens with a friendly explanation of the words or punctuation marks and when to use them.</p>
          </div>
        </div>
        <div class="pc-howto-step">
          <span class="pc-howto-num">2</span>
          <div>
            <strong>Try the trick</strong>
            <p>Use the Detective's Trick to decide which word or mark fits — before flipping to the activity.</p>
          </div>
        </div>
        <div class="pc-howto-step">
          <span class="pc-howto-num">3</span>
          <div>
            <strong>Do the activity</strong>
            <p>Grammar chapters: choose from the dropdown. Punctuation chapters: drag a mark from the yellow strip or tap to select then tap a position in the sentence.</p>
          </div>
        </div>
        <div class="pc-howto-step">
          <span class="pc-howto-num">4</span>
          <div>
            <strong>Check &amp; learn</strong>
            <p>Press <em>Check</em> to see your score instantly. Review the lesson and try again!</p>
          </div>
        </div>
      </div>
      <p class="pc-ref-foot">Word groups: ${Object.values(WORD_GROUPS).map(g => g.label).join(" · ")}</p>
    </div>`;
  return page;
}

/* ── Explanation Left Page ───────────────────────────────── */
function makeExplanationLeftPage(idx) {
  const exp  = EXPLANATIONS[idx];
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--explanation pc--explanation-left">
      <div class="pc-exp-header">
        <span class="pc-exp-case">Case File #0${idx + 1}</span>
        <span class="pc-exp-focus">${exp.focus}</span>
      </div>
      <div class="pc-exp-body">
        ${exp.leftHTML}
      </div>
    </div>`;
  return page;
}

/* ── Explanation Right Page ──────────────────────────────── */
function makeExplanationRightPage(idx) {
  const exp  = EXPLANATIONS[idx];
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--explanation pc--explanation-right">
      <div class="pc-exp-header pc-exp-header--right">
        <span class="pc-exp-subtitle">${exp.title}</span>
        <span class="pc-exp-badge">Lesson</span>
      </div>
      <div class="pc-exp-body">
        ${exp.rightHTML}
      </div>
      <div class="pc-exp-cta">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="9 18 15 12 9 6"/></svg>
        Flip to practise &rarr;
      </div>
    </div>`;
  return page;
}

/* ── Passage Left Page (paras 0, 1) ─────────────────────── */
function makePassageLeftPage(passageIdx) {
  const passage = PASSAGES[passageIdx];
  const page    = makePage();
  page.dataset.passage = passageIdx;

  const pc = document.createElement("div");
  pc.className = "pc pc--passage";

  pc.innerHTML = `
    <div class="pc-passage-header">
      <span class="pc-passage-label">Passage ${passageIdx + 1} of ${PASSAGES.length}</span>
      <strong class="pc-passage-title">${passage.title}</strong>
      <span class="pc-focus-badge">${passage.focus}</span>
    </div>`;

  const body = document.createElement("div");
  body.className = "pc-passage-body";
  renderParas(passage.paragraphs.slice(0, 2), passageIdx, body);
  pc.appendChild(body);
  page.appendChild(pc);
  return page;
}

/* ── Passage Right Page (paras 2, 3 + check) ────────────── */
function makePassageRightPage(passageIdx) {
  const passage = PASSAGES[passageIdx];
  const page    = makePage();
  page.dataset.passage = passageIdx;

  const pc = document.createElement("div");
  pc.className = "pc pc--passage pc--passage-right";

  const body = document.createElement("div");
  body.className = "pc-passage-body";
  renderParas(passage.paragraphs.slice(2), passageIdx, body);
  pc.appendChild(body);

  const check = document.createElement("div");
  check.className = "pc-check-section";
  check.innerHTML = `
    <div class="pc-progress">
      <div class="pc-progress-track"><div class="pc-progress-fill" id="prog-${passageIdx}"></div></div>
      <span class="pc-progress-text" id="prog-text-${passageIdx}">0 / 0 filled</span>
    </div>
    <div class="pc-check-actions">
      <button class="pc-btn pc-btn--ghost" data-gp-reset="${passageIdx}">Reset</button>
      <button class="pc-btn pc-btn--check" data-gp-check="${passageIdx}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
        Check
      </button>
    </div>
    <div class="pc-score" id="score-${passageIdx}"></div>`;
  pc.appendChild(check);
  page.appendChild(pc);
  return page;
}

/* ── Chapter Divider Left ────────────────────────────────── */
function makeChapterDividerLeft() {
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--divider pc--divider-left">
      <div class="pc-div-stamp">Grammar Police</div>
      <div class="pc-div-check">
        <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
          <circle cx="20" cy="20" r="18" fill="#1a7f37" stroke="#0a0a0a" stroke-width="2"/>
          <polyline points="11,20 17,27 29,13" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>Section Complete</p>
      </div>
      <div class="pc-div-recap">
        <p class="pc-div-recap-label">Confusables covered</p>
        <div class="pc-div-tags">
          <span>they're · their · there</span>
          <span>we're · were · where</span>
          <span>you're · your · it's · its</span>
        </div>
      </div>
      <p class="pc-div-turn">Turn the page to continue &rarr;</p>
    </div>`;
  return page;
}

/* ── Chapter Divider Right ───────────────────────────────── */
function makeChapterDividerRight() {
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--divider pc--divider-right">
      <div class="pc-div-badge" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
          <path d="M32 4L6 17V38C6 51 17 62 32 64C47 62 58 51 58 38V17L32 4Z"
                fill="rgba(255,229,0,0.18)" stroke="#ffe500" stroke-width="2.5"/>
          <text x="32" y="46" text-anchor="middle" font-size="30" font-family="serif"
                fill="#ffe500" font-weight="900">?</text>
        </svg>
      </div>
      <h2 class="pc-div-chapter-title">Punctuation<br>Patrol</h2>
      <p class="pc-div-chapter-sub">English · Prep Portal</p>
      <ul class="pc-div-chapter-list">
        <li>Question marks &amp; Full stops</li>
        <li>Commas in lists &amp; phrases</li>
        <li>Mixed punctuation</li>
      </ul>
      <p class="pc-div-method">Drag punctuation marks into sentences</p>
    </div>`;
  return page;
}

/* ── Back Cover ──────────────────────────────────────────── */
function makeBackCoverPage() {
  const page = makePage("", "hard");
  page.innerHTML = `
    <div class="pc pc--back-cover">
      <div class="pc-back-inner">
        <svg viewBox="0 0 60 60" fill="none" width="52" height="52" aria-hidden="true">
          <path d="M30 56L6 42V18L30 4L54 18V42L30 56Z" fill="#ffe500" stroke="#0a0a0a" stroke-width="3"/>
          <text x="30" y="37" text-anchor="middle" font-size="22" font-family="sans-serif"
                fill="#0a0a0a" font-weight="900">P</text>
        </svg>
        <p class="pc-back-msg">Keep practising.<br>Words matter.</p>
        <p class="pc-back-site">prepportal.com</p>
      </div>
    </div>`;
  return page;
}

/* ── PP Explanation Left Page ────────────────────────────── */
function makePPExplLeftPage(idx) {
  const exp  = PP_EXPLANATIONS[idx];
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--explanation pc--explanation-left">
      <div class="pc-exp-header">
        <span class="pc-exp-case">Case File #0${idx + 1}</span>
        <span class="pc-exp-focus">${exp.focus}</span>
      </div>
      <div class="pc-exp-body">${exp.leftHTML}</div>
    </div>`;
  return page;
}

/* ── PP Explanation Right Page ───────────────────────────── */
function makePPExplRightPage(idx) {
  const exp  = PP_EXPLANATIONS[idx];
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--explanation pc--explanation-right">
      <div class="pc-exp-header pc-exp-header--right">
        <span class="pc-exp-subtitle">${exp.title}</span>
        <span class="pc-exp-badge">Lesson</span>
      </div>
      <div class="pc-exp-body">${exp.rightHTML}</div>
      <div class="pc-exp-cta">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="9 18 15 12 9 6"/></svg>
        Flip to practise &rarr;
      </div>
    </div>`;
  return page;
}

/* ── PP Exercise Left Page ───────────────────────────────── */
function makeExerLeftPage(idx) {
  const ex   = PP_EXERCISES[idx];
  const half = Math.ceil(ex.items.length / 2);
  const page = makePage();

  const pc = document.createElement("div");
  pc.className = "pc pc--practice";

  pc.innerHTML = `
    <div class="pc-practice-header">
      <span class="pc-practice-label">Exercise ${idx + 1} of ${PP_EXERCISES.length}</span>
      <strong class="pc-practice-title">${ex.title}</strong>
      <span class="pc-focus-badge">${ex.focus}</span>
    </div>`;

  const items = document.createElement("div");
  items.className = "pp-items";
  buildSentences(ex.items, 0, half, idx, items);
  pc.appendChild(items);

  page.appendChild(pc);
  return page;
}

/* ── PP Exercise Right Page ──────────────────────────────── */
function makeExerRightPage(idx) {
  const ex   = PP_EXERCISES[idx];
  const half = Math.ceil(ex.items.length / 2);
  const page = makePage();

  const pc = document.createElement("div");
  pc.className = "pc pc--practice";

  const items = document.createElement("div");
  items.className = "pp-items";
  buildSentences(ex.items, half, ex.items.length, idx, items);
  pc.appendChild(items);

  /* Pool strip */
  const pool = document.createElement("div");
  pool.className = "pp-pool-strip";
  pool.innerHTML = `<span class="pp-pool-label">Drag:</span><span class="pp-pool-tokens"></span>`;
  const tokenContainer = pool.querySelector(".pp-pool-tokens");
  ex.pool.forEach((char) => tokenContainer.appendChild(buildToken(char)));
  pc.appendChild(pool);

  /* Check section */
  const check = document.createElement("div");
  check.className = "pc-check-section";
  check.innerHTML = `
    <div class="pc-progress">
      <div class="pc-progress-track"><div class="pc-progress-fill" id="ppProg-${idx}"></div></div>
      <span class="pc-progress-text" id="ppProgText-${idx}">0 / 0 placed</span>
    </div>
    <div class="pc-check-actions">
      <button class="pc-btn pc-btn--ghost" data-pp-reset="${idx}">Reset</button>
      <button class="pc-btn pc-btn--check" data-pp-check="${idx}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
        Check
      </button>
    </div>
    <div class="pc-score" id="ppScore-${idx}"></div>`;
  pc.appendChild(check);

  page.appendChild(pc);
  return page;
}

/* ═══════════════════════════════════════════════════════════
   PUNCTUATION PATROL — TOKENISER
   ═══════════════════════════════════════════════════════════ */
function tokenizeSentence(item) {
  const tokens = [];
  let wordCount = 0;

  item.forEach((seg) => {
    if (typeof seg === "string") {
      const words = seg.trim().split(/\s+/).filter(Boolean);
      words.forEach((word) => {
        if (tokens.length > 0 && tokens[tokens.length - 1].type === "word") {
          tokens.push({ type: "slot", correct: null });
        }
        tokens.push({ type: "word", text: wordCount === 0 ? word : " " + word });
        wordCount++;
      });
    } else {
      if (tokens.length > 0 && tokens[tokens.length - 1].type === "slot") {
        tokens[tokens.length - 1].correct = seg.correct;
      } else {
        tokens.push({ type: "slot", correct: seg.correct });
      }
    }
  });

  if (tokens.length > 0 && tokens[tokens.length - 1].type === "word") {
    tokens.push({ type: "slot", correct: null });
  }

  return tokens;
}

/* ═══════════════════════════════════════════════════════════
   NEAREST SLOT
   ═══════════════════════════════════════════════════════════ */
function findNearestSlot(sentence, clientX) {
  const slots = sentence.querySelectorAll(".pp-slot");
  let nearest = null, nearestDist = Infinity;
  slots.forEach((slot) => {
    const rect = slot.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const dist = Math.abs(clientX - cx);
    if (dist < nearestDist) { nearestDist = dist; nearest = slot; }
  });
  return nearest;
}

/* ═══════════════════════════════════════════════════════════
   SENTENCE ROW BUILDER
   ═══════════════════════════════════════════════════════════ */
function buildSentenceRow(item, itemIdx, exerIdx) {
  const tokens        = tokenizeSentence(item);
  const requiredCount = tokens.filter((t) => t.type === "slot" && t.correct).length;
  const commaCount    = tokens.filter((t) => t.type === "slot" && t.correct === ",").length;

  const row = document.createElement("div");
  row.className = "pp-item";

  const num = document.createElement("span");
  num.className   = "pp-item-num";
  num.textContent = (itemIdx + 1) + ".";
  row.appendChild(num);

  const wrap = document.createElement("span");
  wrap.className         = "pp-sentence";
  wrap.dataset.exerIdx   = exerIdx;
  wrap.dataset.itemIdx   = itemIdx;
  wrap.dataset.maxSlots  = requiredCount;

  tokens.forEach((token) => {
    if (token.type === "word") {
      const span = document.createElement("span");
      span.className   = "pp-word";
      span.textContent = token.text;
      wrap.appendChild(span);
    } else {
      const slot = document.createElement("span");
      slot.className        = "pp-slot";
      slot.dataset.exerIdx  = exerIdx;
      slot.dataset.itemIdx  = itemIdx;
      if (token.correct) slot.dataset.correct = token.correct;

      slot.addEventListener("mousedown",  (e) => e.stopPropagation());
      slot.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });

      slot.addEventListener("click", (e) => {
        e.stopPropagation();
        if (slot.dataset.placed) {
          clearSlot(slot);
        } else if (drag.char) {
          tryPlaceInSlot(slot, drag.char, wrap);
          deselectToken();
        }
      });

      slot.setAttribute("draggable", "false");
      slot.addEventListener("dragstart", (e) => {
        if (!slot.dataset.placed) { e.preventDefault(); return; }
        e.stopPropagation();
        drag.char       = slot.dataset.placed;
        drag.sourceSlot = slot;
        e.dataTransfer.setData("text/plain", slot.dataset.placed);
        e.dataTransfer.effectAllowed = "move";
      });
      slot.addEventListener("dragend", () => { drag.char = null; drag.sourceSlot = null; });

      slot.addEventListener("touchstart", (e) => {
        if (!slot.dataset.placed) return;
        e.stopPropagation();
        e.preventDefault();
        drag.char       = slot.dataset.placed;
        drag.sourceSlot = slot;
        createGhost(slot.dataset.placed, e.touches[0]);
      }, { passive: false });

      wrap.appendChild(slot);
    }
  });

  wrap.addEventListener("dragover", (e) => {
    if (!drag.char) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = drag.sourceSlot ? "move" : "copy";
    wrap.classList.add("pp-sentence--drag-active");
    const nearest = findNearestSlot(wrap, e.clientX);
    wrap.querySelectorAll(".pp-slot--hover").forEach((s) => s.classList.remove("pp-slot--hover"));
    if (nearest) nearest.classList.add("pp-slot--hover");
  });

  wrap.addEventListener("dragleave", (e) => {
    if (e.relatedTarget && wrap.contains(e.relatedTarget)) return;
    wrap.classList.remove("pp-sentence--drag-active");
    wrap.querySelectorAll(".pp-slot--hover").forEach((s) => s.classList.remove("pp-slot--hover"));
  });

  wrap.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    wrap.classList.remove("pp-sentence--drag-active");
    wrap.querySelectorAll(".pp-slot--hover").forEach((s) => s.classList.remove("pp-slot--hover"));
    const char    = drag.char || e.dataTransfer.getData("text/plain");
    const nearest = findNearestSlot(wrap, e.clientX);
    if (!char || !nearest) return;
    if (drag.sourceSlot && drag.sourceSlot !== nearest) clearSlot(drag.sourceSlot);
    tryPlaceInSlot(nearest, char, wrap);
    drag.char       = null;
    drag.sourceSlot = null;
  });

  row.appendChild(wrap);

  if (commaCount > 0) {
    const hint = document.createElement("span");
    hint.className   = "pp-needs";
    hint.textContent = commaCount + " ,";
    row.appendChild(hint);
  }

  return row;
}

function buildSentences(items, start, end, exerIdx, container) {
  for (let i = start; i < end && i < items.length; i++) {
    container.appendChild(buildSentenceRow(items[i], i, exerIdx));
  }
}

/* ═══════════════════════════════════════════════════════════
   PLACE / CLEAR
   ═══════════════════════════════════════════════════════════ */
function tryPlaceInSlot(slot, char, sentence) {
  if (slot.dataset.placed) {
    clearSlot(slot);
    placeInSlot(slot, char);
    return;
  }
  const maxSlots = parseInt(sentence.dataset.maxSlots || 99);
  const filled   = [...sentence.querySelectorAll(".pp-slot")].filter((s) => s.dataset.placed).length;
  if (filled >= maxSlots) return;
  placeInSlot(slot, char);
}

function placeInSlot(slot, char) {
  slot.dataset.placed = char;
  slot.textContent    = char;
  slot.classList.add("pp-slot--filled");
  slot.classList.remove("pp-slot--correct", "pp-slot--wrong", "pp-slot--hover");
  slot.setAttribute("draggable", "true");
  updatePPProgress(parseInt(slot.dataset.exerIdx));
}

function clearSlot(slot) {
  delete slot.dataset.placed;
  slot.textContent = "";
  slot.classList.remove("pp-slot--filled", "pp-slot--correct", "pp-slot--wrong", "pp-slot--hover");
  slot.setAttribute("draggable", "false");
  updatePPProgress(parseInt(slot.dataset.exerIdx));
}

/* ═══════════════════════════════════════════════════════════
   POOL TOKENS
   ═══════════════════════════════════════════════════════════ */
function buildToken(char) {
  const el = document.createElement("span");
  el.className    = "pp-token";
  el.dataset.char = char;
  el.textContent  = char;
  el.setAttribute("draggable", "true");
  el.setAttribute("title", `Drag '${char}'`);

  el.addEventListener("mousedown", (e) => e.stopPropagation());

  el.addEventListener("dragstart", (e) => {
    e.stopPropagation();
    drag.char       = char;
    drag.sourceSlot = null;
    e.dataTransfer.setData("text/plain", char);
    e.dataTransfer.effectAllowed = "copy";
    el.classList.add("pp-token--dragging");
    deselectToken();
  });
  el.addEventListener("dragend", () => el.classList.remove("pp-token--dragging"));

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    if (drag.selected === el) { deselectToken(); return; }
    deselectToken();
    drag.char     = char;
    drag.selected = el;
    el.classList.add("pp-token--selected");
  });

  el.addEventListener("touchstart", (e) => {
    e.stopPropagation();
    e.preventDefault();
    drag.char       = char;
    drag.sourceSlot = null;
    deselectToken();
    createGhost(char, e.touches[0]);
  }, { passive: false });

  return el;
}

function deselectToken() {
  if (drag.selected) {
    drag.selected.classList.remove("pp-token--selected");
    drag.selected = null;
  }
  drag.char = null;
}

/* ═══════════════════════════════════════════════════════════
   TOUCH GHOST
   ═══════════════════════════════════════════════════════════ */
function createGhost(char, touch) {
  if (drag.ghost) drag.ghost.remove();
  const g = document.createElement("span");
  g.className   = "pp-drag-ghost";
  g.textContent = char;
  document.body.appendChild(g);
  drag.ghost = g;
  moveGhost(touch);
}

function moveGhost(touch) {
  if (!drag.ghost) return;
  drag.ghost.style.left = (touch.clientX - 19) + "px";
  drag.ghost.style.top  = (touch.clientY - 19) + "px";
}

/* Global touch — move ghost and highlight nearest slot */
document.addEventListener("touchmove", (e) => {
  if (!drag.ghost) return;
  e.preventDefault();
  moveGhost(e.touches[0]);

  drag.ghost.style.visibility = "hidden";
  const under    = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
  drag.ghost.style.visibility = "";
  const sentence = under?.closest(".pp-sentence");

  document.querySelectorAll(".pp-sentence--drag-active").forEach((s) => {
    if (s !== sentence) {
      s.classList.remove("pp-sentence--drag-active");
      s.querySelectorAll(".pp-slot--hover").forEach((sl) => sl.classList.remove("pp-slot--hover"));
    }
  });

  if (sentence) {
    sentence.classList.add("pp-sentence--drag-active");
    const nearest = findNearestSlot(sentence, e.touches[0].clientX);
    sentence.querySelectorAll(".pp-slot--hover").forEach((s) => s.classList.remove("pp-slot--hover"));
    if (nearest) nearest.classList.add("pp-slot--hover");
  }
}, { passive: false });

/* Global touch — drop on touchend */
document.addEventListener("touchend", (e) => {
  if (!drag.ghost) return;
  const touch = e.changedTouches[0];

  drag.ghost.style.visibility = "hidden";
  const under    = document.elementFromPoint(touch.clientX, touch.clientY);
  drag.ghost.remove();
  drag.ghost = null;

  const sentence = under?.closest(".pp-sentence");
  document.querySelectorAll(".pp-sentence--drag-active").forEach((s) => {
    s.classList.remove("pp-sentence--drag-active");
    s.querySelectorAll(".pp-slot--hover").forEach((sl) => sl.classList.remove("pp-slot--hover"));
  });

  if (sentence && drag.char) {
    const nearest = findNearestSlot(sentence, touch.clientX);
    if (nearest) {
      if (drag.sourceSlot && drag.sourceSlot !== nearest) clearSlot(drag.sourceSlot);
      tryPlaceInSlot(nearest, drag.char, sentence);
    }
  }
  drag.char       = null;
  drag.sourceSlot = null;
});

/* ═══════════════════════════════════════════════════════════
   RENDER GRAMMAR PASSAGE PARAGRAPHS
   ═══════════════════════════════════════════════════════════ */
function renderParas(paraArray, passageIdx, container) {
  paraArray.forEach((para) => {
    const p = document.createElement("p");
    p.className = "book-para";
    para.forEach((seg) => {
      if (typeof seg === "string") {
        p.appendChild(document.createTextNode(seg));
      } else {
        p.appendChild(buildBlank(seg, passageIdx));
      }
    });
    container.appendChild(p);
  });
}

function buildBlank(seg, passageIdx) {
  const group  = WORD_GROUPS[seg.group];
  const select = document.createElement("select");
  select.className       = `gp-blank gp-blank--${seg.group}`;
  select.dataset.correct = seg.correct.toLowerCase();
  select.dataset.passage = passageIdx;
  select.setAttribute("aria-label", `select: ${group.label}`);

  select.addEventListener("mousedown",  (e) => e.stopPropagation());
  select.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });

  const ph = document.createElement("option");
  ph.value = ""; ph.textContent = "pick…"; ph.disabled = true; ph.selected = true;
  select.appendChild(ph);

  [...group.options].sort(() => Math.random() - 0.5).forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.toLowerCase(); o.textContent = opt;
    select.appendChild(o);
  });

  select.addEventListener("change", () => updateProgress(passageIdx));
  return select;
}

/* ═══════════════════════════════════════════════════════════
   BUILD ALL PAGES
   ═══════════════════════════════════════════════════════════ */
function buildBookPages() {
  const book = document.getElementById("gpBook");
  book.innerHTML = "";
  const pages = [];

  pages.push(makeCoverPage());
  pages.push(makeTOCLeftPage());
  pages.push(makeTOCRightPage());

  PASSAGES.forEach((_, i) => {
    EXPLANATION_START_PAGE[i] = pages.length;
    pages.push(makeExplanationLeftPage(i));
    pages.push(makeExplanationRightPage(i));
    PASSAGE_START_PAGE[i] = pages.length;
    pages.push(makePassageLeftPage(i));
    pages.push(makePassageRightPage(i));
  });

  pages.push(makeChapterDividerLeft());
  pages.push(makeChapterDividerRight());

  PP_EXERCISES.forEach((_, i) => {
    PP_EXPL_START[i] = pages.length;
    pages.push(makePPExplLeftPage(i));
    pages.push(makePPExplRightPage(i));
    PP_EXER_START[i] = pages.length;
    pages.push(makeExerLeftPage(i));
    pages.push(makeExerRightPage(i));
  });

  pages.push(makeBackCoverPage());
  pages.forEach((p) => book.appendChild(p));

  PASSAGES.forEach((_, i) => updateProgress(i));
  PP_EXERCISES.forEach((_, i) => updatePPProgress(i));

  bookBuilt = true;
}

/* ═══════════════════════════════════════════════════════════
   STPAGEFLIP INIT
   ═══════════════════════════════════════════════════════════ */
function initPageFlip() {
  const book = document.getElementById("gpBook");
  const W    = book.offsetWidth;
  const H    = book.offsetHeight;

  pageFlip = new St.PageFlip(book, {
    width:               Math.floor(W / 2),
    height:              H,
    size:                "fixed",
    showCover:           true,
    usePortrait:         true,
    maxShadowOpacity:    0.55,
    mobileScrollSupport: false,
    clickEventForward:   false,
    swipeDistance:       9999,
  });

  pageFlip.loadFromHTML(book.querySelectorAll(".page"));
  pageFlip.on("flip", () => { playFlipSound(); syncUI(); });
  pageFlip.on("changeOrientation", syncUI);
}

/* ═══════════════════════════════════════════════════════════
   GRAMMAR PASSAGE LOGIC
   ═══════════════════════════════════════════════════════════ */
function updateProgress(passageIdx) {
  const blanks = document.querySelectorAll(`.gp-blank[data-passage="${passageIdx}"]`);
  const filled = [...blanks].filter((b) => b.value !== "").length;
  const total  = blanks.length;
  const pct    = total ? (filled / total) * 100 : 0;

  const fill = document.getElementById(`prog-${passageIdx}`);
  const text = document.getElementById(`prog-text-${passageIdx}`);
  if (fill) fill.style.width = pct + "%";
  if (text) text.textContent = `${filled} / ${total} filled`;
}

function checkPassage(passageIdx) {
  const blanks = document.querySelectorAll(`.gp-blank[data-passage="${passageIdx}"]`);
  let correct = 0, answered = 0;

  blanks.forEach((sel) => {
    sel.classList.remove("gp-blank--correct", "gp-blank--wrong", "gp-blank--unfilled");
    if (!sel.value) { sel.classList.add("gp-blank--unfilled"); return; }
    answered++;
    const ok = sel.value === sel.dataset.correct;
    sel.classList.add(ok ? "gp-blank--correct" : "gp-blank--wrong");
    if (ok) correct++;
  });

  setTimeout(() => {
    document.querySelectorAll(".gp-blank--unfilled").forEach((b) =>
      b.classList.remove("gp-blank--unfilled")
    );
  }, 800);

  const pct  = answered ? Math.round((correct / answered) * 100) : 0;
  const tier = pct === 100 ? "perfect" : pct >= 70 ? "good" : "low";
  const scoreEl = document.getElementById(`score-${passageIdx}`);
  if (scoreEl) {
    scoreEl.innerHTML = `<span class="pc-score-pill pc-score-pill--${tier}">${pct === 100 ? "✨ " : ""}${correct} / ${answered} correct</span>`;
  }
}

function resetPassage(passageIdx) {
  document.querySelectorAll(`.gp-blank[data-passage="${passageIdx}"]`).forEach((sel) => {
    sel.selectedIndex = 0;
    sel.classList.remove("gp-blank--correct", "gp-blank--wrong", "gp-blank--unfilled");
  });
  const scoreEl = document.getElementById(`score-${passageIdx}`);
  if (scoreEl) scoreEl.innerHTML = "";
  updateProgress(passageIdx);
}

/* ═══════════════════════════════════════════════════════════
   PP EXERCISE LOGIC
   ═══════════════════════════════════════════════════════════ */
function updatePPProgress(exerIdx) {
  const allSlots      = document.querySelectorAll(`.pp-slot[data-exer-idx="${exerIdx}"]`);
  const requiredSlots = document.querySelectorAll(`.pp-slot[data-correct][data-exer-idx="${exerIdx}"]`);
  const filled  = [...allSlots].filter((s) => s.dataset.placed).length;
  const total   = requiredSlots.length;
  const pct     = total ? Math.min((filled / total) * 100, 100) : 0;

  const fill = document.getElementById(`ppProg-${exerIdx}`);
  const text = document.getElementById(`ppProgText-${exerIdx}`);
  if (fill) fill.style.width = pct + "%";
  if (text) text.textContent = `${filled} / ${total} placed`;
}

function checkExercise(exerIdx) {
  const sentences = document.querySelectorAll(`.pp-sentence[data-exer-idx="${exerIdx}"]`);
  let totalRequired = 0, totalCorrect = 0;

  sentences.forEach((sentence) => {
    sentence.closest(".pp-item")?.querySelector(".pp-correct-answer")?.remove();

    const allSlots      = [...sentence.querySelectorAll(".pp-slot")];
    const requiredSlots = allSlots.filter((s) => s.dataset.correct);
    let sentenceOk = true;

    allSlots.forEach((slot) => {
      slot.classList.remove("pp-slot--correct", "pp-slot--wrong");
      if (!slot.dataset.placed) return;
      const correct = slot.dataset.correct && slot.dataset.placed === slot.dataset.correct;
      slot.classList.add(correct ? "pp-slot--correct" : "pp-slot--wrong");
      if (!correct) sentenceOk = false;
    });

    requiredSlots.forEach((s) => { if (!s.dataset.placed) sentenceOk = false; });

    totalRequired += requiredSlots.length;
    totalCorrect  += requiredSlots.filter((s) => s.dataset.placed === s.dataset.correct).length;

    if (!sentenceOk) {
      const itemIdx = parseInt(sentence.dataset.itemIdx);
      const item    = PP_EXERCISES[exerIdx].items[itemIdx];
      let ansText   = "";
      item.forEach((seg) => { ansText += typeof seg === "string" ? seg : seg.correct; });

      const ans = document.createElement("div");
      ans.className = "pp-correct-answer";
      ans.innerHTML = `<span class="pp-ca-label">Answer:</span> <em>${ansText}</em>`;
      sentence.closest(".pp-item").appendChild(ans);
    }
  });

  const pct  = totalRequired ? Math.round((totalCorrect / totalRequired) * 100) : 0;
  const tier = pct === 100 ? "perfect" : pct >= 70 ? "good" : "low";
  const scoreEl = document.getElementById(`ppScore-${exerIdx}`);
  if (scoreEl) {
    scoreEl.innerHTML = `<span class="pc-score-pill pc-score-pill--${tier}">${pct === 100 ? "✨ " : ""}${totalCorrect} / ${totalRequired} correct</span>`;
  }
}

function resetExercise(exerIdx) {
  document.querySelectorAll(`.pp-slot[data-exer-idx="${exerIdx}"]`).forEach(clearSlot);
  document.querySelectorAll(`.pp-sentence[data-exer-idx="${exerIdx}"]`).forEach((s) => {
    s.closest(".pp-item")?.querySelector(".pp-correct-answer")?.remove();
    s.classList.remove("pp-sentence--drag-active");
  });
  const scoreEl = document.getElementById(`ppScore-${exerIdx}`);
  if (scoreEl) scoreEl.innerHTML = "";
  deselectToken();
}

/* ═══════════════════════════════════════════════════════════
   MODAL
   ═══════════════════════════════════════════════════════════ */
function openModal() {
  const modal = document.getElementById("gpModal");
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  initAudio();
  if (!bookBuilt) {
    buildBookPages();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initPageFlip();
        wireBookEvents();
        syncUI();
      });
    });
  }
}

function closeModal() {
  document.getElementById("gpModal").hidden = true;
  document.body.style.overflow = "";
  deselectToken();
  if (drag.ghost) { drag.ghost.remove(); drag.ghost = null; }
}

function syncUI() {
  const cur   = pageFlip.getCurrentPageIndex();
  const total = pageFlip.getPageCount();
  document.getElementById("gpPageNum").textContent = `${cur + 1} / ${total}`;
  document.getElementById("gpPrev").disabled = cur === 0;
  document.getElementById("gpNext").disabled = cur >= total - 1;
}

/* ═══════════════════════════════════════════════════════════
   PAGE NAVIGATION HELPER
   ═══════════════════════════════════════════════════════════ */
function jumpToPage(targetPage) {
  const book = document.getElementById("gpBook");
  book.classList.add("gp-book--jumping");
  setTimeout(() => {
    pageFlip.turnToPage(targetPage);
    syncUI();
    requestAnimationFrame(() => book.classList.remove("gp-book--jumping"));
  }, 220);
}

/* ═══════════════════════════════════════════════════════════
   EVENT WIRING
   ═══════════════════════════════════════════════════════════ */
function wireBookEvents() {
  document.getElementById("gpPrev").addEventListener("click", () => pageFlip.flipPrev());
  document.getElementById("gpNext").addEventListener("click", () => pageFlip.flipNext());

  /* TOC → grammar explanation pages */
  document.getElementById("pcTocList").addEventListener("click", (e) => {
    const gpItem = e.target.closest("[data-goto-explanation]");
    if (gpItem) {
      const idx  = parseInt(gpItem.dataset.gotoExplanation, 10);
      const page = EXPLANATION_START_PAGE[idx];
      if (page !== undefined) jumpToPage(page);
      return;
    }
    const ppItem = e.target.closest("[data-goto-pp-explanation]");
    if (ppItem) {
      const idx  = parseInt(ppItem.dataset.gotoPpExplanation, 10);
      const page = PP_EXPL_START[idx];
      if (page !== undefined) jumpToPage(page);
    }
  });

  /* Check / Reset buttons — grammar and PP */
  document.getElementById("gpBook").addEventListener("click", (e) => {
    const gpCheck  = e.target.closest("[data-gp-check]");
    const gpReset  = e.target.closest("[data-gp-reset]");
    const ppCheck  = e.target.closest("[data-pp-check]");
    const ppReset  = e.target.closest("[data-pp-reset]");
    if (gpCheck)  checkPassage(parseInt(gpCheck.dataset.gpCheck, 10));
    if (gpReset)  resetPassage(parseInt(gpReset.dataset.gpReset, 10));
    if (ppCheck)  checkExercise(parseInt(ppCheck.dataset.ppCheck, 10));
    if (ppReset)  resetExercise(parseInt(ppReset.dataset.ppReset, 10));
  });

  document.addEventListener("keydown", (e) => {
    if (document.getElementById("gpModal").hidden) return;
    if (e.key === "Escape")     closeModal();
    if (e.key === "ArrowLeft")  pageFlip.flipPrev();
    if (e.key === "ArrowRight") pageFlip.flipNext();
  });
}

/* ═══════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("gpOpen").addEventListener("click",  openModal);
  document.getElementById("gpClose").addEventListener("click", closeModal);
  document.getElementById("gpModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!pageFlip) return;
      const book = document.getElementById("gpBook");
      pageFlip.updateState({ width: Math.floor(book.offsetWidth / 2), height: book.offsetHeight });
    }, 250);
  });
});
