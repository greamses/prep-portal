/* ═══════════════════════════════════════════════════════
   WRITING FORMS — the one registry of what a student can be asked to write.

   "Narrative" is not a thing you write; it is a FAMILY. A personal narrative,
   a recount, a news report and a short story are all narrative and none of
   them is marked the same way — a news report that opens with "I will never
   forget the day" has failed, and a personal narrative that opens with a
   dateline has failed too. So the picker asks for the family first and the
   FORM second, and everything downstream keys off the form:

     • the prompt generator gets the form's `ask` (see js/api.js)
     • the lesson shown before writing is the form's `lesson`
     • the video search uses the form's `video` query
     • the red-pen substitution style is chosen by the form's FAMILY

   One family breaks the pattern on purpose. A SUMMARY has no prompt: the task
   is a passage, so those forms carry `kind: 'summary'` and their `ask`
   describes the PASSAGE to be written rather than the question to be set.
   Everything that has to behave differently keys off that one flag — the
   generator writes a passage, the Learn phase prints it, the write phase
   opens the graphic organiser (js/summary.js) instead of a blank sheet, and
   the examiner marks coverage instead of creativity.

   Prompts are deliberately culture-neutral. A student in Lagos, Leeds or
   Lahore should be able to answer any of them without needing local
   knowledge, so nothing here names a country, a currency or an institution.
═══════════════════════════════════════════════════════ */

export const FAMILIES = [
  {
    id: 'narrative',
    label: 'Narrative',
    blurb: 'Telling what happened',
    forms: [
      {
        id: 'personal-narrative',
        label: 'Personal Narrative',
        blurb: 'One true experience of your own, told for what it meant',
        ask: 'a personal narrative — one true experience from the writer\'s own life, narrow enough to tell in full, that clearly changed or taught them something',
        video: 'how to write a personal narrative essay',
        lesson: {
          what: 'A personal narrative tells ONE true thing that happened to you — not a summary of a whole year, but a single afternoon you could walk someone through minute by minute. It is judged on whether the reader feels it and understands why it mattered to you.',
          shape: [
            'Open inside the moment — a sound, an action, something said. Never "I am going to tell you about…"',
            'Tell it in the order it happened, in the past tense, as "I".',
            'Slow down at the one moment that matters most and give it the most words.',
            'Close on the change: what you understood afterwards that you did not understand before.',
          ],
          moves: [
            'Show the feeling through what you did — hands, breath, what you noticed — instead of naming it.',
            'Use real speech. One line of dialogue at the turning point is worth a paragraph of explaining.',
            'Keep the cast small. Two or three people is plenty.',
          ],
          model: 'The bell had gone ten minutes earlier and I was still standing at the gate with my bag on both shoulders. Every bus that pulled up was the wrong number. I remember counting them — four, five — and deciding, somewhere around the sixth, that I would simply walk.',
        },
        fallbacks: [
          'Write about a time you had to do something alone that you had always done with someone else.',
          'Write about a day when a small mistake of yours turned into something much bigger.',
          'Write about the first time you realised an adult could be wrong.',
          'Write about a promise you made and what it cost you to keep it.',
        ],
      },
      {
        id: 'recount',
        label: 'Recount',
        blurb: 'A clear, ordered account of an event that happened',
        ask: 'a recount — an orderly account of a single real event (a trip, a competition, a ceremony, an incident) that the writer took part in or witnessed',
        video: 'how to write a recount text',
        lesson: {
          what: 'A recount sets down what happened, in order, so that someone who was not there knows exactly how the event ran. It is closer to a report than to a story: less about feeling, more about a faithful record.',
          shape: [
            'Orientation first: who was involved, where, when, and why it was happening.',
            'Then the events in strict time order, usually one paragraph per stage.',
            'Use time connectives to mark each move: at first, shortly afterwards, by midday, finally.',
            'End with a brief comment — how it finished, or what it achieved.',
          ],
          moves: [
            'Past tense throughout, and keep the same person (I or we) all the way.',
            'Give real detail — numbers, times, names of things — because accuracy is the point.',
            'Leave out what did not happen and what you imagined; a recount records, it does not embroider.',
          ],
          model: 'The team left at six in the morning in two hired buses. By the time we reached the sports ground the first event had already been called, and our relay squad went straight from the bus to the track without changing.',
        },
        fallbacks: [
          'Recount a journey that did not go to plan, from setting out to arriving.',
          'Recount a competition or match you took part in, from the first round to the result.',
          'Recount a day when the electricity, water or internet failed for hours and what everyone did.',
          'Recount an event your school or community organised, from the preparations to the clearing up.',
        ],
      },
      {
        id: 'news-report',
        label: 'News Report',
        blurb: 'The facts of an event, most important first',
        ask: 'a news report — a factual account of a newsworthy incident or event for a school or local newspaper, which the student will write with a headline, an opening summary and quoted witnesses',
        video: 'how to write a news report article',
        lesson: {
          what: 'A news report gives a reader the facts of an event fast, in the third person, with no opinion of yours anywhere in it. The reader must be able to stop after the first paragraph and still know the story.',
          shape: [
            'A headline: short, present tense, factual. Not a joke and not a riddle.',
            'The opening paragraph answers who, what, where and when in one or two sentences.',
            'Later paragraphs add how and why, in order of importance — least important last.',
            'Quote at least one named witness or official, in quotation marks, and say who they are.',
          ],
          moves: [
            'Third person, past tense, no "I" and no "you".',
            'Attribute anything you cannot prove: residents said, according to the head teacher.',
            'Neutral words only — a report says "the crowd left", never "the poor crowd trudged sadly away".',
          ],
          model: 'STORM CLOSES MAIN BRIDGE\n\nThe river bridge was closed for six hours yesterday after heavy rain washed part of the approach road away. No one was injured. "We shut it as soon as we saw the crack," said Amina Sesay, a traffic officer at the scene.',
        },
        fallbacks: [
          'Write a news report on a power failure that stopped an important public event.',
          'Write a news report on a student who was rewarded for returning a large sum of lost money.',
          'Write a news report on a road that has been closed by flooding, and how people are getting to work.',
          'Write a news report on a school team winning a regional competition for the first time.',
        ],
      },
      {
        id: 'short-story',
        label: 'Short Story',
        blurb: 'Invented characters, a problem, and a turn',
        ask: 'a short story — an invented story with a small cast and one clear problem that turns, which can be told properly in 300–500 words',
        video: 'how to write a short story for students',
        lesson: {
          what: 'A short story is invented, and it lives or dies on one problem. There is no room for a whole life: pick one character who wants one thing, put something in the way, and let the story turn once.',
          shape: [
            'Start close to the trouble. The first paragraph should already have something wrong in it.',
            'Build: each scene should make the problem harder, not just longer.',
            'One turn — the moment the character chooses, discovers or loses something.',
            'Stop soon after the turn. A short story does not need to tidy everything away.',
          ],
          moves: [
            'Give the character one want the reader can state in a sentence.',
            'Use dialogue to carry conflict; people in stories rarely say exactly what they mean.',
            'Cut every sentence that only explains. Trust the reader.',
          ],
          model: 'Ola had the key in his pocket all afternoon and told no one. At break he took it out twice, turned it over, and put it back. By the time the last bell rang he had decided he would put it back where he found it — which was when he saw the padlock lying open on the store-room floor.',
        },
        fallbacks: [
          'Write a story that ends with a door being locked from the inside.',
          'Write a story about someone who is given a job they are not qualified to do.',
          'Write a story in which a small lie has to be defended with a bigger one.',
          'Write a story that begins: "The letter had been in the drawer for eleven years."',
        ],
      },
      {
        id: 'diary-entry',
        label: 'Diary Entry',
        blurb: 'Private writing, on the day it happened',
        ask: 'a diary entry — a private, dated entry written on the evening of a day that unsettled or delighted the writer, in which they work out on paper what they think about it',
        video: 'how to write a diary entry English lesson',
        lesson: {
          what: 'A diary entry is written to yourself, on the day, before you know how things turn out. That is what makes it different from a narrative: it can be unfair, unfinished and unsure, and it should sound like thinking rather than telling.',
          shape: [
            'Date it, then start wherever your mind starts — often mid-thought.',
            'Move between what happened and what you make of it; a diary does both at once.',
            'Address yourself, and let the tone be informal — questions, half-sentences, second thoughts.',
            'End unresolved: what you will do tomorrow, or what you still cannot decide.',
          ],
          moves: [
            'Past tense for events, present for the thinking you are doing now.',
            'Name the small things nobody else would record. That is the texture of a diary.',
            'Allow one honest, unflattering admission — diaries are not written to impress.',
          ],
          model: '14 March\n\nStill awake, and I keep going back over it. I should have said something when he took the credit in front of everyone, and I did not — I laughed, which was worse. I have decided twice tonight to speak to him tomorrow, and twice decided not to.',
        },
        fallbacks: [
          'Write a diary entry for a day you were blamed for something you did not do.',
          'Write a diary entry for the night before a decision you cannot take back.',
          'Write a diary entry for the day a close friend moved away.',
          'Write a diary entry for a day that started badly and ended far better than you expected.',
        ],
      },
    ],
  },

  {
    id: 'descriptive',
    label: 'Descriptive',
    blurb: 'Putting a thing in front of the reader',
    forms: [
      {
        id: 'place-description',
        label: 'Place Description',
        blurb: 'A single place, made real through the senses',
        ask: 'a descriptive piece about ONE specific place at ONE specific time of day, chosen so that its sounds, light and movement can carry the writing',
        video: 'how to write a descriptive essay about a place',
        lesson: {
          what: 'A place description makes a reader stand where you are standing. It is not a list of what is there — it is a chosen order of details that adds up to an atmosphere.',
          shape: [
            'Fix the time as well as the place: the same street at dawn and at dusk are two different pieces.',
            'Move the reader through it in a deliberate order — near to far, outside to inside, top to bottom.',
            'Give each paragraph one sense to lead with, so the piece does not become all sight.',
            'Finish on the detail that says most about the place.',
          ],
          moves: [
            'Prefer the exact noun to the adjective: not "a big old tree" but "a mango tree with its roots above ground".',
            'Let verbs do the describing — light "pools", dust "hangs", metal "ticks" as it cools.',
            'Put one person or animal in it. Empty places are hard to feel.',
          ],
          model: 'By six the market is only half awake. The fish tables are already wet and shining, but the cloth stalls are still bundled, and the whole lane smells of ice and diesel. Somewhere behind the shuttered end, a radio is being tuned, station to station.',
        },
        fallbacks: [
          'Describe a market in the last hour before it closes.',
          'Describe a classroom at the moment everyone has just left it.',
          'Describe a bus station in heavy rain.',
          'Describe a kitchen while a large meal is being cooked.',
        ],
      },
      {
        id: 'person-description',
        label: 'Character Sketch',
        blurb: 'One person, caught in a few telling details',
        ask: 'a character sketch of ONE person — someone the writer can picture exactly — built from how that person moves, speaks and treats other people',
        video: 'how to write a character sketch description',
        lesson: {
          what: 'A character sketch shows a person through evidence, not adjectives. "She was kind" tells the reader nothing; the way she counts out change for a stranger tells them everything.',
          shape: [
            'Open with the one image that fixes them — a habit, a posture, a way of arriving.',
            'Then their manner: how they speak, and what they do while speaking.',
            'Then how others behave around them; that is where character shows.',
            'Close with a single moment that proves what you have been implying.',
          ],
          moves: [
            'Choose three or four details and make them precise. A long list flattens the person.',
            'Use their own words once — the phrase they always say.',
            'Do not summarise their whole life. A sketch is a portrait, not a biography.',
          ],
          model: 'He never sat down to teach. He would come in, put the chalk in his shirt pocket, and stand with his back to the board as if the lesson were something he had just remembered on the way. When he did write, he wrote so fast that the last word of every line ran downhill.',
        },
        fallbacks: [
          'Describe someone who is always the first to arrive and the last to leave.',
          'Describe a neighbour whom the whole street relies on.',
          'Describe a person who is very good at something nobody else values.',
          'Describe someone you found difficult at first and later understood.',
        ],
      },
      {
        id: 'object-description',
        label: 'Object & Detail',
        blurb: 'One object, and everything it carries',
        ask: 'a descriptive piece about a single ordinary object that has been used, kept or handed on, so that describing it closely also tells its history',
        video: 'descriptive writing about an object lesson',
        lesson: {
          what: 'Describing an object well means describing its wear. Anything that has been used carries a record of the using, and that record is the interesting part.',
          shape: [
            'Start with the object plainly: what it is, its size in the hand, its weight.',
            'Then surface and detail — colour, marks, repairs, what has worn away.',
            'Then its use: who handles it, how, and how often.',
            'End with what it means to whoever keeps it.',
          ],
          moves: [
            'Compare to things a reader already knows the feel of.',
            'Touch, smell and sound matter more here than with a place.',
            'Never say the object is precious. Show the care it is given and let the reader conclude it.',
          ],
          model: 'The tin is the size of two fists and has lost most of its paint, so that the lettering survives only as a shadow of itself. The lid does not sit flat any more; it has to be pressed on one corner first, then the other, and it gives a small metallic complaint each time.',
        },
        fallbacks: [
          'Describe an object in your home that has been repaired more than once.',
          'Describe something you own that would mean nothing to anyone else.',
          'Describe a tool that belongs to someone who uses it every day.',
          'Describe a photograph without saying what it makes you feel.',
        ],
      },
      {
        id: 'atmosphere',
        label: 'Scene & Atmosphere',
        blurb: 'A crowd, an event, a mood in motion',
        ask: 'a descriptive piece about a busy scene or gathering as it happens, where the writing must catch movement, noise and mood rather than a still picture',
        video: 'descriptive writing atmosphere and mood lesson',
        lesson: {
          what: 'This is description with the volume up: a crowd, a storm, a ceremony, a queue that has waited too long. The subject is not a thing but an ATMOSPHERE, and atmosphere is made of movement and sound.',
          shape: [
            'Establish the mass first — how many, how close, what direction everything is going.',
            'Then pull in to two or three individuals; a crowd is only felt through the people in it.',
            'Change the pace with your sentences: short ones as things tighten, longer ones as they ease.',
            'End as the scene breaks or settles.',
          ],
          moves: [
            'Sound carries mood better than sight here — name what you can hear at each stage.',
            'Use one strong image rather than four ordinary ones.',
            'Avoid words like "chaotic", "amazing", "beautiful". They name the feeling instead of causing it.',
          ],
          model: 'The noise arrives before the procession does — first as a beat you feel through the ground, then as brass, badly tuned and very loud. Someone lifts a child onto a wall. The wall is already full of children.',
        },
        fallbacks: [
          'Describe a crowd waiting for something that is late.',
          'Describe the last ten minutes before a heavy storm breaks.',
          'Describe a celebration from the point of view of someone who is not enjoying it.',
          'Describe a queue that has been standing far longer than it expected.',
        ],
      },
    ],
  },

  {
    id: 'argumentative',
    label: 'Argumentative',
    blurb: 'Taking a position and defending it',
    forms: [
      {
        id: 'opinion-essay',
        label: 'Opinion Essay',
        blurb: 'A reasoned case, one point per paragraph',
        ask: 'an argumentative essay question on a debatable issue a teenager can reason about from ordinary experience, phrased so that a sensible person could take either side',
        video: 'how to write an argumentative essay structure',
        lesson: {
          what: 'An opinion essay argues one position and answers the strongest objection to it. A piece that only lists reasons you already agree with is not an argument — it is a speech to people who need no convincing.',
          shape: [
            'State your position plainly in the introduction. No suspense.',
            'One reason per paragraph: claim, then evidence or example, then why it matters.',
            'Give the other side its best argument, then answer it. This is where marks are won.',
            'Conclude by weighing, not repeating: given all that, the position still holds.',
          ],
          moves: [
            'Replace "I think" with the evidence for thinking it.',
            'Use connectives that show the logic: however, consequently, admittedly, even so.',
            'Concede something real. An essay that admits nothing convinces no one.',
          ],
          model: 'Admittedly, a phone in a bag is a phone that can be used in a lesson, and no rule can prevent that entirely. But the same argument would ban pens because pens can be used to write notes. The question is not whether a tool can be misused; it is whether the misuse is common enough to outweigh the use.',
        },
        fallbacks: [
          'Should students have a say in what subjects they are required to study? Argue your position.',
          'Is it better to be taught by one teacher for several subjects, or a different teacher for each?',
          'Should schools be allowed to publish every student\'s exam results? Argue for or against.',
          'Does competition make students work harder, or only make the strong stronger? Take a side.',
        ],
      },
      {
        id: 'persuasive-speech',
        label: 'Persuasive Speech',
        blurb: 'Written to be heard, and to move people',
        ask: 'a persuasive speech to be delivered to an audience of fellow students at an assembly, calling for a specific change they could actually act on',
        video: 'how to write a persuasive speech',
        lesson: {
          what: 'A speech is written for the ear. It argues like an essay but sounds nothing like one: shorter sentences, direct address, and a rhythm the speaker can ride.',
          shape: [
            'Greet the audience and name what you are asking for within the first few lines.',
            'Two or three arguments, each with something concrete the audience recognises.',
            'Answer the objection they are already thinking of.',
            'Finish with the call to action — one thing, stated so plainly it can be repeated.',
          ],
          moves: [
            'Ask questions you then answer. It keeps a listener with you.',
            'Use the rule of three, and repeat a phrase at the start of successive sentences.',
            'Say "we" and "you". A speech that says only "one" and "people" is an essay read aloud.',
          ],
          model: 'We are asked to be on time. We are asked to be prepared. And we are asked to do both while the timetable changes every Monday without warning. I am not asking for less to be expected of us. I am asking that the same be expected of the timetable.',
        },
        fallbacks: [
          'Write a speech persuading your school to change one rule you believe is unfair.',
          'Write a speech persuading your peers to take one practical action about waste.',
          'Write a speech arguing that a subject you value should be taken more seriously.',
          'Write a speech persuading students to volunteer for something unglamorous but necessary.',
        ],
      },
      {
        id: 'letter-to-editor',
        label: 'Letter to the Editor',
        blurb: 'A short, sharp public argument',
        ask: 'a letter to a newspaper editor responding to a public problem or a decision the writer disagrees with, short enough to be printed',
        video: 'how to write a letter to the editor',
        lesson: {
          what: 'A letter to the editor is a public argument in very little space. It responds to something — a report, a decision, another letter — and it has to land its point before the reader\'s eye moves on.',
          shape: [
            'Open by naming what you are responding to, and your position on it, in one sentence.',
            'Two short paragraphs of argument. No more; there is no room.',
            'One concession, handled in a clause rather than a paragraph.',
            'Close with what you want done, and sign off formally.',
          ],
          moves: [
            'Formal register, but not stiff. Contractions are fine; slang is not.',
            'One fact or example beats three assertions.',
            'Keep the temperature down. Anger on the page reads as weakness of argument.',
          ],
          model: 'Sir, — Your report on the closure of the town library described the decision as "regrettable but necessary". It may well be regrettable. Before we accept that it is necessary, readers deserve to know what the building costs to run, because that figure has never been published.',
        },
        fallbacks: [
          'Write a letter to an editor about a public space in your area that has been neglected.',
          'Write a letter to an editor disagreeing with a report that blamed young people for a problem.',
          'Write a letter to an editor arguing for one change to public transport where you live.',
          'Write a letter to an editor responding to a decision to cut something your community uses.',
        ],
      },
      {
        id: 'review',
        label: 'Review',
        blurb: 'A judgement, supported by evidence',
        ask: 'a review of a book, film, performance or product, in which the writer reaches a clear verdict and justifies it with specific evidence',
        video: 'how to write a review English lesson',
        lesson: {
          what: 'A review is an argument whose claim is a verdict. Summary is not review: the reader wants to know whether it is good, why, and for whom — and every judgement must be paid for with an example.',
          shape: [
            'Say what it is and give the verdict early. Withholding it wastes the reader\'s time.',
            'Describe just enough for the judgement to make sense — never the whole plot.',
            'Judge in parts: what works, what does not, and why.',
            'End with the recommendation, and be specific about who it is for.',
          ],
          moves: [
            'Every claim needs its moment: "the ending is rushed" means nothing without the scene.',
            'Balance. A review that only praises reads as advertising.',
            'Present tense for the work itself — "the film opens", not "the film opened".',
          ],
          model: 'The first hour is patient and very good. The trouble comes afterwards: having spent so long making us believe in the family, the film settles their argument in a single phone call, and a story that had earned its ending is handed one instead.',
        },
        fallbacks: [
          'Review a book you finished but would not recommend to everyone.',
          'Review a film or programme that is popular and, in your view, overrated.',
          'Review a place you visited — a museum, a park, an event — for someone deciding whether to go.',
          'Review something you use every day, judging it as a product rather than a habit.',
        ],
      },
    ],
  },

  {
    id: 'expository',
    label: 'Expository',
    blurb: 'Explaining so the reader understands',
    forms: [
      {
        id: 'explanation',
        label: 'Explanation',
        blurb: 'How or why something works',
        ask: 'an expository question asking the writer to explain HOW or WHY something works or happens — a process, a cause, a system a teenager can observe',
        video: 'how to write an explanation text',
        lesson: {
          what: 'An explanation answers how or why. It is judged on whether the reader who did not understand at the start understands at the end — so it must be ordered by the logic of the thing, not by what you happen to remember first.',
          shape: [
            'Say what you are explaining and why it is worth understanding.',
            'Then the chain, in order — each step caused by the one before it.',
            'Define any term the moment you first use it.',
            'Close with the effect or the significance, not a summary of your own essay.',
          ],
          moves: [
            'Causal connectives are the backbone: because, as a result, which means that, so.',
            'Use an analogy for the hardest step, then drop it. Analogies explain; they do not prove.',
            'Present tense, third person. An explanation is about the thing, not about you.',
          ],
          model: 'Warm air holds more water than cool air. As the air rises it cools, and at a certain height it can no longer hold what it is carrying — which is the point at which cloud forms. The higher the air rises before this happens, the taller the cloud.',
        },
        fallbacks: [
          'Explain why some habits are so much harder to break than others.',
          'Explain how a rumour spreads through a school, and why it changes as it travels.',
          'Explain what happens to household waste after it is collected.',
          'Explain why prices of the same item differ from one shop to another.',
        ],
      },
      {
        id: 'how-to',
        label: 'How-to / Process',
        blurb: 'Instructions someone could actually follow',
        ask: 'a how-to piece teaching a reader to do something practical, step by step, that the writer can plausibly do themselves',
        video: 'how to write instructions procedural text',
        lesson: {
          what: 'A how-to is tested by use: could a stranger follow it and succeed? That standard rules out vagueness. Every step must be doable, in order, with what you told them to gather.',
          shape: [
            'State the goal and what it takes — materials, time, anything needed beforehand.',
            'Number the steps and keep one action per step.',
            'Warn where things go wrong, at the step where they go wrong — not at the end.',
            'Say how the reader knows they have succeeded.',
          ],
          moves: [
            'Imperative verbs: "fold", "measure", "wait". Not "you should probably fold".',
            'Be exact where it matters — how long, how much, how hot.',
            'Second person throughout, and keep sentences short.',
          ],
          model: '3. Wet the cloth and wring it out until it stops dripping. A cloth that is too wet will spread the mark instead of lifting it.\n4. Press — do not rub — for ten seconds, then lift straight up.',
        },
        fallbacks: [
          'Explain to a beginner how to revise a subject they find difficult.',
          'Write instructions for cooking a simple dish for someone who has never cooked.',
          'Explain how to prepare for a journey so that nothing is forgotten.',
          'Write instructions for settling a disagreement fairly between two friends.',
        ],
      },
      {
        id: 'compare-contrast',
        label: 'Compare & Contrast',
        blurb: 'Two things, weighed point by point',
        ask: 'a compare-and-contrast question on two things a student genuinely knows and can weigh against each other on the same criteria',
        video: 'compare and contrast essay structure',
        lesson: {
          what: 'Comparison is not two descriptions side by side. It is one set of criteria applied twice, so that the differences that matter come into focus — and it must reach a conclusion about which, or when each.',
          shape: [
            'Name the two subjects and why comparing them is worth doing.',
            'Choose your criteria — three is usually right — and say what they are.',
            'Take them criterion by criterion, both subjects in the same paragraph. It is far clearer than one subject then the other.',
            'Conclude with a judgement: which, for whom, under what conditions.',
          ],
          moves: [
            'Comparative language: whereas, by contrast, similarly, both, neither.',
            'Give both subjects equal space. An uneven comparison reads as a disguised opinion piece.',
            'Say what they have in common before what divides them; it makes the differences sharper.',
          ],
          model: 'On cost the two are barely distinguishable. On time they are not: the bus is cheaper by a small margin but arrives when it arrives, whereas the train, for the same money and a longer walk at each end, can be planned around.',
        },
        fallbacks: [
          'Compare learning from a teacher with learning from the internet.',
          'Compare living in a large city with living in a small town.',
          'Compare working alone with working in a group, and say when each is better.',
          'Compare reading a book with watching the film made from it.',
        ],
      },
      {
        id: 'report',
        label: 'Report',
        blurb: 'Findings, set out under headings',
        ask: 'a formal report for a named reader (a head teacher, a committee, a council) presenting findings on a situation and recommending action',
        video: 'how to write a formal report English',
        lesson: {
          what: 'A report is written for someone who has to decide something. It is impersonal, organised under headings, and it ends in recommendations that follow from the findings rather than from your feelings.',
          shape: [
            'Title, and a line saying who it is for and what it covers.',
            'Introduction: why the report was written and what it examined.',
            'Findings, under headings, in order of importance. Facts, not opinions.',
            'Conclusions, then numbered recommendations — each one an action someone can take.',
          ],
          moves: [
            'Formal, impersonal register: "it was observed that", not "I saw".',
            'Headings and numbering are part of the form; a report written as flowing prose has lost marks before it is read.',
            'Every recommendation must trace back to a finding you actually reported.',
          ],
          model: 'FINDINGS\n\n2.1 Use of the library. The library was in use during 11 of the 25 periods observed. On eight of those occasions it was being used as an overflow classroom rather than for private study.',
        },
        fallbacks: [
          'Write a report to your head teacher on how students actually use the school library, and what should change.',
          'Write a report to a committee on the condition of a public facility and what it needs.',
          'Write a report on the causes of lateness in your school and how they could be reduced.',
          'Write a report on how a recent school event was organised, and what should be done differently next time.',
        ],
      },
      {
        id: 'formal-letter',
        label: 'Formal Letter',
        blurb: 'A request or complaint, properly set out',
        ask: 'a formal letter to an official, an organisation or a company, making a specific request or complaint with a clear outcome in mind',
        video: 'how to write a formal letter English',
        lesson: {
          what: 'A formal letter asks a stranger with some power to do something. Its form is fixed, and getting the form wrong costs marks before the argument is even read.',
          shape: [
            'Your address, then the date, then the recipient\'s address, each on its own lines.',
            'Salutation: Dear Sir/Madam if unnamed, Dear Mr/Ms [Name] if named.',
            'Paragraph 1 states your purpose. Middle paragraphs give the detail and evidence. The last says exactly what you want done.',
            'Sign off: Yours faithfully if you began Dear Sir/Madam, Yours sincerely if you used a name.',
          ],
          moves: [
            'No contractions, no slang, no exclamation marks.',
            'Be specific — dates, amounts, reference numbers. Vague complaints are easy to ignore.',
            'Stay courteous even when complaining; the polite letter is the one that gets answered.',
          ],
          model: 'I am writing regarding the bus service on route 14, which has failed to run at its scheduled 07:10 departure on nine occasions this month. I should be grateful if you would confirm what steps are being taken, and whether the timetable will be revised.',
        },
        fallbacks: [
          'Write a formal letter applying for a place on a course or programme.',
          'Write a formal letter complaining about a product or service that failed.',
          'Write a formal letter asking an organisation to support a school project.',
          'Write a formal letter requesting permission to use a public space for a community event.',
        ],
      },
      {
        id: 'article',
        label: 'Feature Article',
        blurb: 'Informative writing with a voice',
        ask: 'a feature article for a school magazine on a subject the writer knows well, informative but written with personality and a point of view',
        video: 'how to write a feature article',
        lesson: {
          what: 'A feature article informs like an explanation but reads like something someone chose to write. It has an angle — one idea it is really about — and a voice that a news report is not allowed.',
          shape: [
            'A hook: a scene, a statistic or a question that earns the next paragraph.',
            'State the angle early so the reader knows what the piece is arguing or exploring.',
            'Develop in sections, and vary what fills them — fact, example, quotation, observation.',
            'End by returning to the hook, changed.',
          ],
          moves: [
            'Subheadings are allowed and help. Use them where the piece turns.',
            'Address the reader directly now and then, but do not make the article about you.',
            'One good quotation is worth a paragraph of your own summary.',
          ],
          model: 'There are four bins in the corridor and, on any given morning, three of them contain the same thing. Ask anyone why and they will tell you exactly what should go where. Watch the same people at break and none of it survives contact with a hurry.',
        },
        fallbacks: [
          'Write a feature article about something everyone in your school complains about but nobody fixes.',
          'Write a feature article about a hobby or skill that deserves more respect than it gets.',
          'Write a feature article about how young people\'s free time has changed in the last ten years.',
          'Write a feature article about a person in your community whose work goes unnoticed.',
        ],
      },
    ],
  },

  /* ── SUMMARY ─────────────────────────────────────────────────────────────
     The odd family out: you are given a passage, not a question. What you are
     marked on is whether every paragraph of the source survived into one
     paragraph of your own, in your own words and in the right order — which
     is exactly what the graphic organiser (js/summary.js) walks you through,
     one box per paragraph.

     The forms are the KINDS OF PASSAGE, because summarising them is not the
     same job: a narrative is reduced by picking events, an argument by
     picking claims, and a discussion by keeping both sides in balance. Every
     form here sets `kind: 'summary'` and no `fallbacks` — a summary cannot
     fall back to a one-line prompt, so the offline passages live in
     js/passages.js instead. ──────────────────────────────────────────────── */
  {
    id: 'summary',
    label: 'Summary',
    blurb: 'Reading a passage and boiling it down',
    forms: [
      {
        id: 'summary-informational',
        label: 'Informational Passage',
        blurb: 'Facts about one subject, reduced to what matters',
        kind: 'summary',
        ask: 'an informational passage explaining one subject a teenager can follow without special knowledge — how something works, why something happens, or what something is made of',
        video: 'how to write a summary of a passage',
        lesson: {
          what: 'A summary re-tells someone else\'s writing in far fewer words, keeping every main point and adding nothing of your own. The test is simple: a reader who has never seen the passage should be able to read your paragraph and know what it said. Your opinion of it is not part of the job.',
          shape: [
            'Read the whole passage once before you write anything. You cannot tell what matters until you have seen the end.',
            'Take each paragraph in turn and find its ONE main point — the thing the rest of that paragraph exists to support.',
            'Write that point as a single sentence in your own words. That is the box for that paragraph.',
            'Join the sentences into ONE paragraph, in the same order as the passage, adding linking words so it reads as continuous writing.',
          ],
          moves: [
            'Your own words, always. Copying a phrase of six or seven words from the passage is lifting, and it is marked as such.',
            'Cut examples, statistics and repetition — a summary keeps the point, not the evidence for it.',
            'Never add an opinion, a judgement or a fact the passage did not contain.',
            'Aim for about a third of the original length, and stop. Length is not a virtue here.',
          ],
          model: 'The writer explains that sleep is far from idle time. The brain uses the night to sort what it has taken in, strengthening useful memories and discarding the rest, and it also flushes out the waste that builds up while a person is awake.',
        },
      },
      {
        id: 'summary-narrative',
        label: 'Narrative Passage',
        blurb: 'An account of events, reduced to what actually happened',
        kind: 'summary',
        ask: 'a narrative passage — a first-person account of one ordinary but eventful episode, told in order, with something learned or changed by the end',
        video: 'how to summarise a story in your own words',
        lesson: {
          what: 'Summarising a story means keeping the spine and losing the flesh. Events, in order, with the reason each one led to the next — and none of the description, dialogue or atmosphere that made the original worth reading. A summary of a story is not a shorter story; it is an account of one.',
          shape: [
            'Read to the end first. In a narrative the last paragraph often changes what the earlier ones were about.',
            'For each paragraph, ask what CHANGED in it. That change is your sentence.',
            'Keep the order of events exactly as the passage had it, even if you find a neater order.',
            'Join the sentences into one paragraph, using time links — then, once, by the time, afterwards.',
          ],
          moves: [
            'Past tense, third person: "the writer walked home", not "I walked home".',
            'Drop the dialogue. If a line of speech mattered, report what it did, not what it said.',
            'Keep the ending, including what the narrator understood. It is the point of the whole passage.',
            'No dramatic language of your own. A summary reports the story; it does not perform it.',
          ],
          model: 'When the rain flooded the road, the writer and their brother set off home on foot rather than wait. Finding the junction blocked, they took a longer route along higher ground, and only from there did the writer see how far the water had spread.',
        },
      },
      {
        id: 'summary-argument',
        label: 'Argument Passage',
        blurb: 'One writer\'s case, summed up without taking sides',
        kind: 'summary',
        ask: 'an argumentative passage in which one writer argues a clear position on a debatable everyday issue, gives separate reasons in separate paragraphs, and concedes one point to the other side',
        video: 'how to summarise an argument text',
        lesson: {
          what: 'Summarising an argument means reporting what somebody claims and why, without joining in. The hardest part is staying out of it: your paragraph must be just as accurate whether you agree with the writer or think they are completely wrong.',
          shape: [
            'Find the writer\'s position first — usually in the opening paragraph — and make it your first sentence.',
            'Then one sentence per paragraph, each carrying that paragraph\'s reason.',
            'Include the concession. A summary that drops the point the writer conceded has misrepresented them.',
            'Join it all into one paragraph using logical links — because, however, admittedly, therefore.',
          ],
          moves: [
            'Attribute everything: the writer argues, the passage claims, the author concedes. Never state their claims as facts.',
            'Report the reasoning, not the examples used to illustrate it.',
            'Do not add a counter-argument of your own, however obvious it seems.',
            'Keep the writer\'s strength of feeling out of it — "insists" and "admits" are already judgements.',
          ],
          model: 'The writer argues that homework should be set far less often. Much of what is set, they claim, is new work rather than practice, and it is done in conditions that differ so widely between homes that it cannot be marked fairly. They concede that some tasks need more quiet than a lesson allows.',
        },
      },
      {
        id: 'summary-discussion',
        label: 'Discussion Passage',
        blurb: 'Two sides weighed — report both fairly',
        kind: 'summary',
        ask: 'a balanced discussion passage setting out both sides of an everyday question a teenager would recognise, giving each side its own paragraphs and reaching a measured close rather than a verdict',
        video: 'how to summarise a discussion text both sides',
        lesson: {
          what: 'A discussion passage puts two cases and does not pick one. Summarising it means keeping the balance: if your paragraph makes one side sound stronger than the passage made it, you have summarised badly even if every sentence in it is true.',
          shape: [
            'Open by naming the question being discussed, not by answering it.',
            'One sentence per paragraph, keeping each side\'s points on that side.',
            'Give the two sides roughly equal space, as the passage did.',
            'Close with where the passage left it — the common ground, or the fact that it reached no verdict.',
          ],
          moves: [
            'Balancing links do the work: on one hand, others argue, by contrast, both sides accept.',
            'Never let your own view show. Nobody reading your summary should be able to guess it.',
            'Watch the verbs — "points out" agrees with a side, "claims" doubts it. Use neutral ones.',
            'If the passage ends undecided, say so. Inventing a conclusion is a common way to lose marks here.',
          ],
          model: 'The passage sets out the disagreement over phones in school. Those against them point to lost attention and to bullying that now follows students home, while those in favour argue that the phone is an ordinary working tool and that banning it teaches nobody to manage it. Both sides, the writer notes, agree more than they admit.',
        },
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════
   THE MNEMONICS — one word per form, painted as a wall chart.

   Every form above already carries a `shape`: four steps, in order, that make
   it the form it is. A student who has read them once remembers about two, so
   each form is also given a WORD whose letters are those same four steps —
   SLOW for a personal narrative, CASE for an opinion essay, BOIL for a
   summary. Nothing new is being taught here: `keys[i]` is `shape[i]` said
   short enough to fit on a tile, which is the point. The chart is the version
   a student can carry into an exam hall; the shape list underneath is the
   version that explains it.

   They live in one table rather than inside each form because that is how you
   check them — a wall of twenty-three words, read down in one go, is the only
   way to notice that two forms have quietly been given the same one, or that
   a letter has been made to stand for something nobody would ever recall.

   RULE FOR ADDING ONE: the word must be about the writing (SLOW is the advice
   a narrative needs; TURN is what a short story does), the letters must be in
   the order the steps happen, and there must be exactly as many keys as the
   form has `shape` entries. A mnemonic whose order is not the writing's order
   is worse than none — it teaches the student to produce the parts in the
   wrong sequence.
═══════════════════════════════════════════════════════ */
export const MNEMONICS = {
  /* ── Narrative ─────────────────────────────────────── */
  'personal-narrative': {
    word: 'SLOW', gloss: 'and it is also the advice — a narrative that hurries has nothing in it',
    keys: [
      { k: 'S', name: 'Start inside it', what: 'Open on a sound, an action, a line of speech. Never "I am going to tell you about".' },
      { k: 'L', name: 'Line it up', what: 'In the order it happened, past tense, as "I".' },
      { k: 'O', name: 'One moment', what: 'The moment that matters most gets the most words.' },
      { k: 'W', name: 'What you learned', what: 'Close on what you understood that you did not understand before.' },
    ],
  },
  recount: {
    word: 'OTTO', gloss: 'a record, not a story — it starts by orienting and ends by reporting',
    keys: [
      { k: 'O', name: 'Orientation', what: 'Who was involved, where, when, and why it was happening.' },
      { k: 'T', name: 'Then, in order', what: 'Strict time order, usually one paragraph per stage.' },
      { k: 'T', name: 'Time words', what: 'At first, shortly afterwards, by midday, finally.' },
      { k: 'O', name: 'Outcome', what: 'How it finished, or what it achieved.' },
    ],
  },
  'news-report': {
    word: 'HELP', gloss: 'a reader who stops after the first paragraph must still have the story',
    keys: [
      { k: 'H', name: 'Headline', what: 'Short, present tense, factual. Not a joke and not a riddle.' },
      { k: 'E', name: 'Essentials first', what: 'Who, what, where and when — in the opening paragraph.' },
      { k: 'L', name: 'Later, the rest', what: 'How and why, in order of importance. Least important last.' },
      { k: 'P', name: 'People quoted', what: 'At least one named witness or official, and say who they are.' },
    ],
  },
  'short-story': {
    word: 'TURN', gloss: 'the turn is the whole story — everything before it is the run-up',
    keys: [
      { k: 'T', name: 'Trouble early', what: 'The first paragraph already has something wrong in it.' },
      { k: 'U', name: 'Uphill', what: 'Each scene makes the problem harder, not just longer.' },
      { k: 'R', name: 'Reversal', what: 'One turn: the character chooses, discovers or loses something.' },
      { k: 'N', name: 'Now stop', what: 'End soon after the turn. Do not tidy everything away.' },
    ],
  },
  'diary-entry': {
    word: 'DEAR', gloss: 'written to yourself, on the day, before you know how it turns out',
    keys: [
      { k: 'D', name: 'Date it', what: 'Then start wherever your mind starts — often mid-thought.' },
      { k: 'E', name: 'Events', what: 'What happened, as you keep going back over it.' },
      { k: 'A', name: 'Argue with yourself', what: 'Move between the events and what you make of them.' },
      { k: 'R', name: 'Rest unresolved', what: 'End on what you will do tomorrow, or cannot yet decide.' },
    ],
  },

  /* ── Descriptive ───────────────────────────────────── */
  'place-description': {
    word: 'PATH', gloss: 'a description is a route through a place, not a list of what is in it',
    keys: [
      { k: 'P', name: 'Place and time', what: 'The same street at dawn and at dusk are two different pieces.' },
      { k: 'A', name: 'A route through', what: 'Near to far, outside to inside, top to bottom — deliberately.' },
      { k: 'T', name: 'Take a sense each', what: 'Lead each paragraph with a different sense, so it is not all sight.' },
      { k: 'H', name: 'Hold one back', what: 'Finish on the detail that says most about the place.' },
    ],
  },
  'person-description': {
    word: 'FACE', gloss: 'character is shown in evidence, never in adjectives',
    keys: [
      { k: 'F', name: 'First image', what: 'The habit, posture or way of arriving that fixes them.' },
      { k: 'A', name: 'And their manner', what: 'How they speak, and what they do while speaking.' },
      { k: 'C', name: 'Company', what: 'How other people behave around them. That is where character shows.' },
      { k: 'E', name: 'Evidence', what: 'One moment that proves what you have been implying.' },
    ],
  },
  'object-description': {
    word: 'WORN', gloss: 'anything that has been used carries a record of the using',
    keys: [
      { k: 'W', name: 'What it is', what: 'Plainly: its size in the hand, its weight.' },
      { k: 'O', name: 'Outside', what: 'Colour, marks, repairs, what has worn away.' },
      { k: 'R', name: 'Regular use', what: 'Who handles it, how, and how often.' },
      { k: 'N', name: 'Now what it means', what: 'What it means to whoever keeps it.' },
    ],
  },
  atmosphere: {
    word: 'MOOD', gloss: 'the subject is not a thing but a mood, and mood is movement and sound',
    keys: [
      { k: 'M', name: 'Mass first', what: 'How many, how close, which way it is all going.' },
      { k: 'O', name: 'One or two faces', what: 'A crowd is only felt through the people in it.' },
      { k: 'O', name: 'Off the pace', what: 'Short sentences as it tightens, longer as it eases.' },
      { k: 'D', name: 'Done', what: 'End as the scene breaks or settles.' },
    ],
  },

  /* ── Argumentative ─────────────────────────────────── */
  'opinion-essay': {
    word: 'CASE', gloss: 'an argument that answers nobody is a speech to people who agree already',
    keys: [
      { k: 'C', name: 'Claim', what: 'State your position plainly in the introduction. No suspense.' },
      { k: 'A', name: 'A reason each', what: 'One per paragraph: claim, evidence, then why it matters.' },
      { k: 'S', name: 'Someone disagrees', what: 'Give the other side its best argument, then answer it.' },
      { k: 'E', name: 'End by weighing', what: 'Not by repeating. Given all that, the position still holds.' },
    ],
  },
  'persuasive-speech': {
    word: 'ASKS', gloss: 'a speech is written for the ear and asks for one thing',
    keys: [
      { k: 'A', name: 'Address them', what: 'Greet the audience and name what you want, in the first few lines.' },
      { k: 'S', name: 'Say your reasons', what: 'Two or three, each with something concrete they recognise.' },
      { k: 'K', name: 'Knock down the objection', what: 'The one they are already thinking of.' },
      { k: 'S', name: 'Sign off with the action', what: 'One thing, stated plainly enough to be repeated.' },
    ],
  },
  'letter-to-editor': {
    word: 'NAIL', gloss: 'a public argument in very little space — it must land before the eye moves on',
    keys: [
      { k: 'N', name: 'Name what you answer', what: 'The report, decision or letter — and your position on it.' },
      { k: 'A', name: 'Argue twice', what: 'Two short paragraphs. There is no room for a third.' },
      { k: 'I', name: 'I grant you one thing', what: 'A concession, handled in a clause rather than a paragraph.' },
      { k: 'L', name: 'Lay out what you want', what: 'Say what should be done, then sign off formally.' },
    ],
  },
  review: {
    word: 'VIEW', gloss: 'a review is an argument whose claim is a verdict',
    keys: [
      { k: 'V', name: 'Verdict early', what: 'Say what it is and what you think. Withholding wastes the reader.' },
      { k: 'I', name: 'In brief', what: 'Describe only enough for the judgement to make sense.' },
      { k: 'E', name: 'Evidence', what: 'Every judgement paid for with a specific moment.' },
      { k: 'W', name: 'Who it is for', what: 'End with the recommendation, and be specific about the reader.' },
    ],
  },

  /* ── Expository ────────────────────────────────────── */
  explanation: {
    word: 'WHYS', gloss: 'ordered by the logic of the thing, not by what you remember first',
    keys: [
      { k: 'W', name: 'What you are explaining', what: 'And why it is worth understanding.' },
      { k: 'H', name: 'How it happens', what: 'The chain in order, each step caused by the one before it.' },
      { k: 'Y', name: 'Your terms defined', what: 'The moment you first use them.' },
      { k: 'S', name: 'So what', what: 'Close on the effect, not on a summary of your own essay.' },
    ],
  },
  'how-to': {
    word: 'STEP', gloss: 'tested by use — could a stranger follow it and succeed?',
    keys: [
      { k: 'S', name: 'Say the goal', what: 'And what it takes: materials, time, anything needed beforehand.' },
      { k: 'T', name: 'Take one action per step', what: 'Numbered, imperative: fold, measure, wait.' },
      { k: 'E', name: 'Explain where it goes wrong', what: 'At the step where it goes wrong, not at the end.' },
      { k: 'P', name: 'Prove it worked', what: 'Say how the reader knows they have succeeded.' },
    ],
  },
  'compare-contrast': {
    word: 'PAIR', gloss: 'one set of criteria applied twice — not two descriptions side by side',
    keys: [
      { k: 'P', name: 'Pair them', what: 'Name the two, and why comparing them is worth doing.' },
      { k: 'A', name: 'Agree the criteria', what: 'Three is usually right. Say what they are.' },
      { k: 'I', name: 'In one paragraph each', what: 'Both subjects together, criterion by criterion.' },
      { k: 'R', name: 'Reach a judgement', what: 'Which, for whom, under what conditions.' },
    ],
  },
  report: {
    word: 'FACT', gloss: 'written for somebody who has to decide something',
    keys: [
      { k: 'F', name: 'For whom', what: 'Title, and a line saying who it is for and what it covers.' },
      { k: 'A', name: 'Aim', what: 'Why the report was written and what it examined.' },
      { k: 'C', name: 'Come to the findings', what: 'Under headings, in order of importance. Facts, not opinions.' },
      { k: 'T', name: 'Then recommend', what: 'Numbered actions, each tracing back to a finding you reported.' },
    ],
  },
  'formal-letter': {
    word: 'ADDS', gloss: 'the form is fixed, and getting it wrong costs marks before the argument is read',
    keys: [
      { k: 'A', name: 'Addresses and date', what: 'Yours, then the date, then the recipient\'s — each on its own lines.' },
      { k: 'D', name: 'Dear —', what: 'Sir/Madam if unnamed, Mr/Ms [Name] if named.' },
      { k: 'D', name: 'Detail', what: 'Purpose, then evidence, then exactly what you want done.' },
      { k: 'S', name: 'Sign off to match', what: 'Yours faithfully for Sir/Madam, Yours sincerely for a name.' },
    ],
  },
  article: {
    word: 'HOOK', gloss: 'informative like an explanation, but it reads like somebody chose to write it',
    keys: [
      { k: 'H', name: 'Hook', what: 'A scene, a figure or a question that earns the next paragraph.' },
      { k: 'O', name: 'One angle', what: 'State early what the piece is really about.' },
      { k: 'O', name: 'Other material', what: 'Vary each section: fact, example, quotation, observation.' },
      { k: 'K', name: 'Kick back to the hook', what: 'End where you began, changed.' },
    ],
  },

  /* ── Summary ───────────────────────────────────────── */
  'summary-informational': {
    word: 'BOIL', gloss: 'keep every main point, add nothing, and stop',
    keys: [
      { k: 'B', name: 'Both ends first', what: 'Read the whole passage before you write anything.' },
      { k: 'O', name: 'One point per paragraph', what: 'Find the thing the rest of that paragraph exists to support.' },
      { k: 'I', name: 'In your own words', what: 'Write that point as a single sentence of your own.' },
      { k: 'L', name: 'Link them up', what: 'Join the sentences into one paragraph, in the passage\'s order.' },
    ],
  },
  'summary-narrative': {
    word: 'PLOT', gloss: 'keep the spine, lose the flesh — an account of a story, not a shorter story',
    keys: [
      { k: 'P', name: 'Pass through it all', what: 'Read to the end; the last paragraph often changes the earlier ones.' },
      { k: 'L', name: 'Look for the change', what: 'What CHANGED in each paragraph. That change is your sentence.' },
      { k: 'O', name: 'Order kept', what: 'Exactly as the passage had it, even if you find a neater order.' },
      { k: 'T', name: 'Tie with time links', what: 'Then, once, by the time, afterwards.' },
    ],
  },
  'summary-argument': {
    word: 'CLAP', gloss: 'report what somebody claims and why, without joining in',
    keys: [
      { k: 'C', name: 'Claim first', what: 'The writer\'s position, usually in the opening paragraph.' },
      { k: 'L', name: 'List the reasons', what: 'One sentence per paragraph, each carrying that paragraph\'s reason.' },
      { k: 'A', name: 'Admit the concession', what: 'A summary that drops it has misrepresented the writer.' },
      { k: 'P', name: 'Paragraph it', what: 'Join with logical links: because, however, admittedly, therefore.' },
    ],
  },
  'summary-discussion': {
    word: 'FAIR', gloss: 'if one side sounds stronger than the passage made it, you have summarised badly',
    keys: [
      { k: 'F', name: 'Frame the question', what: 'Open by naming what is being discussed, not by answering it.' },
      { k: 'A', name: 'A side at a time', what: 'One sentence per paragraph, keeping each side\'s points on that side.' },
      { k: 'I', name: 'In equal space', what: 'Give the two sides as much room as the passage did.' },
      { k: 'R', name: 'Report where it ended', what: 'The common ground — or that it reached no verdict at all.' },
    ],
  },
};

/* ── Lookups ───────────────────────────────────────────── */

const FORM_INDEX = new Map();
const FAMILY_OF = new Map();
FAMILIES.forEach((fam) => {
  fam.forms.forEach((f) => {
    FORM_INDEX.set(f.id, f);
    FAMILY_OF.set(f.id, fam.id);
  });
});

export const getForm = (id) => FORM_INDEX.get(id) || null;
export const getFamily = (id) => FAMILIES.find((f) => f.id === id) || null;

/* The one branch in the whole page: a summary is given a passage instead of a
   prompt, so the generator, the Learn phase, the write phase and the examiner
   all ask this rather than testing the family id by hand. */
export const isSummaryForm = (id) => (FORM_INDEX.get(id) || {}).kind === 'summary';

/* The red-pen substitution guidelines (js/api.js) are written per FAMILY —
   a news report and a short story want the same kind of verb suggestions
   even though everything else about them differs. */
export const familyOf = (formId) => FAMILY_OF.get(formId) || 'general';

export const formLabel = (id) => (FORM_INDEX.get(id) || {}).label || 'General';

/* The wall chart for a form, or null for a task the student brought
   themselves — there is no form, so there is no word to remember it by. */
export const getMnemonic = (id) => MNEMONICS[id] || null;
