/* ═══════════════════════════════════════════════════════
   THE GRADE LEVEL — who is being marked, decided before what they write.

   A twelve-year-old and a seventeen-year-old do not write the same essay, and
   until now they were marked as though they did: one gate (150 words, five
   paragraphs), one rubric (30/25/25/20), one band table, one ceiling. The
   consequence was quiet but real — a Grade 5 narrative failed the sheet before
   it could be marked at all, and a Grade 12 essay was praised for clearing a
   bar set for a child.

   So the level is now the FIRST question the setup asks, ahead of the family
   and the form, because it changes three separate things:

     1. THE GATE      what the sheet will accept as finished (js/rules.js) —
                      word floor, paragraph count, sentence length.
     2. THE RUBRIC    which categories carry the marks, and how many. Mechanics
                      are most of a primary mark and a quarter of a senior one.
     3. THE PEN       which errors are marked at all, what each one costs, and
                      how high the total may go.

   Three bands rather than twelve grades. The site's own vocabulary is Grade
   1–12 (admin-cbt.html, server/routes/cbt.js) and the labels here keep it, but
   writing is not taught in twelve distinct ways — it is taught in these three,
   and a twelve-option list would be fake precision on a page that has to make
   the difference visible in a mark.

   `junior` is the DEFAULT and is deliberately identical to how the page marked
   before this file existed. Nothing about an existing user's experience moves
   unless they choose to move it.
═══════════════════════════════════════════════════════ */

export const LEVELS = [
  {
    id: 'primary',
    label: 'Grades 4–6',
    blurb: 'upper primary',
    /* The gate. A ten-year-old writing three tidy paragraphs has done the task;
       holding them to 150 words and five paragraphs fails them for their age. */
    gate: { minWords: 80, minParagraphs: 3, minSentences: 3, minSentenceWords: 5 },
    /* Mechanics are most of the mark here because they are most of what is
       being taught, and because they are the part a child can actually fix. */
    rubric: [
      { category: 'Grammar & Mechanics', outOf: 40 },
      { category: 'Vocabulary & Style', outOf: 20 },
      { category: 'Structure & Coherence', outOf: 20 },
      { category: 'Creativity & Content', outOf: 20 },
    ],
    ceiling: 98,
    /* Every marked error costs less at this level. Not kindness — a child makes
       more of them, and a piece charged at full rate lands in the twenties no
       matter how good it is for its age, which teaches nothing. */
    lossScale: 0.7,
    /* Not marked at all: these have not been taught yet, and a red mark for a
       rule a student has never met is noise they cannot act on. */
    ignore: ['par', 'ref', 'spell', 'rep'],
    bands: '88-98 excellent for this age | 72-87 good | 58-71 average | 40-57 weak | 0-39 very weak',
    expect: `THE WRITER IS 9 TO 11 YEARS OLD (upper primary).
  • Expect simple sentences, "and then" joins, a small vocabulary and a story or
    account rather than an argument. None of that is a fault at this age.
  • MARK: spelling, capital letters, full stops, obvious agreement and tense
    slips, and words missing from a sentence. These are what the level teaches.
  • DO NOT MARK: parallel structure, unclear pronoun reference, abbreviation
    style, or repetition. Do not ask for sophisticated vocabulary, subordinate
    clauses, rhetorical devices or a formal register.
  • PRAISE loudly and specifically. A good describing word or a sentence that
    tries something new is the achievement here — say which one and why.`,
  },

  {
    id: 'junior',
    label: 'Grades 7–9',
    blurb: 'junior secondary',
    // Exactly the gate js/rules.js has always enforced.
    gate: { minWords: 150, minParagraphs: 5, minSentences: 5, minSentenceWords: 7 },
    rubric: [
      { category: 'Grammar & Mechanics', outOf: 30 },
      { category: 'Vocabulary & Style', outOf: 25 },
      { category: 'Structure & Coherence', outOf: 25 },
      { category: 'Creativity & Content', outOf: 20 },
    ],
    ceiling: 95,
    lossScale: 1,
    ignore: [],
    bands: '85-95 near-perfect | 70-84 good | 55-69 average | 40-54 weak | 0-39 very weak',
    expect: `THE WRITER IS 12 TO 14 YEARS OLD (junior secondary).
  • Expect a controlled five-paragraph shape, an attempt at varied sentence
    openings, and vocabulary that reaches beyond the everyday without always
    landing. Mark every category in full.
  • MARK everything in the red-pen list. This is the level where the whole set
    of mechanical rules is being examined.
  • Expect an introduction and a conclusion that do different work from the body,
    and say so in Structure & Coherence when they do not.`,
  },

  {
    id: 'senior',
    label: 'Grades 10–12',
    blurb: 'senior secondary — WAEC/NECO',
    /* Longer, because the exam this level is walking towards is longer. Still
       well under a real WAEC essay: this is a typed sheet in a browser, not a
       two-hour paper, and a floor nobody clears is a floor nobody writes over. */
    gate: { minWords: 220, minParagraphs: 5, minSentences: 5, minSentenceWords: 7 },
    /* Flat: at this level content and expression carry as much as accuracy, and
       a candidate who is merely error-free is not yet a strong candidate. */
    rubric: [
      { category: 'Grammar & Mechanics', outOf: 25 },
      { category: 'Vocabulary & Style', outOf: 25 },
      { category: 'Structure & Coherence', outOf: 25 },
      { category: 'Creativity & Content', outOf: 25 },
    ],
    // The hardest ceiling of the three. Nothing a school candidate writes in a
    // browser is a 95, and pretending otherwise is what makes a mark useless.
    ceiling: 92,
    // Errors cost MORE here: at examination level a mechanical slip is not a
    // stage of learning, it is a lost mark, and the marking should say so.
    lossScale: 1.3,
    ignore: [],
    bands: '82-92 distinction | 68-81 credit | 52-67 pass | 38-51 weak | 0-37 fail',
    expect: `THE WRITER IS 15 TO 18 YEARS OLD (senior secondary, sitting WAEC/NECO).
  • Expect register control, subordination, deliberate paragraphing and a
    vocabulary chosen rather than reached for. Judge against an examination
    standard, not against effort.
  • MARK everything, and be strict: at this level a comma splice or a tense
    shift is a lost mark, not a stage of learning.
  • Content must have a position and support it. Generic, unsupported assertion
    is the commonest way this level loses marks — name it in Creativity &
    Content rather than letting fluency cover for it.
  • Do not reward length. A padded 400 words is weaker than a controlled 250.`,
  },
];

export const DEFAULT_LEVEL = 'junior';

/** The level record, always something — an unknown id falls back to junior. */
export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS.find((l) => l.id === DEFAULT_LEVEL);
}

export const levelLabel = (id) => getLevel(id).label;

/** Is this mark type charged at this level? Used by the pen AND by the total. */
export const marksAt = (id, type) => !getLevel(id).ignore.includes(type);

/* The one place a level's numbers are turned into the sentences the examiner
   reads. Kept here rather than in js/api.js so that adding a fourth band is a
   change to this file alone. */
export function levelBrief(id) {
  const L = getLevel(id);
  const rubric = L.rubric.map((r) => `${r.category} /${r.outOf}`).join(', ');
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE LEVEL YOU ARE MARKING AT: ${L.label} (${L.blurb})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${L.expect}

MARKS AT THIS LEVEL: ${rubric}. Total bands: ${L.bands}.
NEVER exceed ${L.ceiling}.`;
}
