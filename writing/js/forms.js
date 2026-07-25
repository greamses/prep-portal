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
];

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

/* The red-pen substitution guidelines (js/api.js) are written per FAMILY —
   a news report and a short story want the same kind of verb suggestions
   even though everything else about them differs. */
export const familyOf = (formId) => FAMILY_OF.get(formId) || 'general';

export const formLabel = (id) => (FORM_INDEX.get(id) || {}).label || 'General';
