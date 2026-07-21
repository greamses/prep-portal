/* ═══════════════════════════════════════════════════════
   VOCAB — the subject & topic outline.

   This file is HAND-CURATED and is the spine of the whole game: it decides
   which subjects exist, which grades each one serves, and what a player can
   study inside it. The WORDS are generated against this outline (see
   scripts/gen-vocab.mjs) and land in data/vocab/words/<subject>.js — that is
   the only part a machine writes.

   Two tiers, because a Grade 2 child and a Grade 11 student do not share a
   science curriculum:
     grades 1–9   Life / Earth / Physical Science  +  General Maths
     grades 10–12 Biology / Chemistry / Physics    +  Algebra / Geometry /
                                                       Statistics

   Every topic carries a grade BAND rather than a single grade, and words carry
   no grade of their own — the band a topic sits in is what makes its vocabulary
   fair. Pick Grade 3 and you are offered "Plants and How They Grow", not
   "Heredity and Adaptation"; the A–Z round at that grade draws only from the
   topics that were on offer.

   `size` is the number of words the generator aims for. A few topics genuinely
   cannot field 50 single-word terms (there are only so many nouns in
   "Permutations and Combinations") — the generator writes what it can get and
   records the real count.
═══════════════════════════════════════════════════════ */

export const TARGET_WORDS = 50;

// Topic shorthand: [key, label, minGrade, maxGrade]
const T = (key, label, lo, hi) => ({ key, label, lo, hi });

export const SUBJECTS = {
  // ── Science, lower school ────────────────────────────────────────────
  'life-science': {
    label: 'Life Science',
    group: 'Science',
    grades: [1, 9],
    topics: [
      T('plants', 'Plants and How They Grow', 1, 3),
      T('animals', 'Animals and Their Bodies', 1, 3),
      T('human-body', 'The Human Body', 2, 5),
      T('habitats', 'Habitats and Ecosystems', 3, 6),
      T('food-chains', 'Food Chains and Food Webs', 4, 7),
      T('classification', 'Classifying Living Things', 5, 8),
      T('cells', 'Cells and Life Processes', 6, 9),
      T('heredity', 'Heredity and Adaptation', 7, 9),
      T('microbes', 'Microbes, Health and Disease', 6, 9),
    ],
  },
  'earth-science': {
    label: 'Earth Science',
    group: 'Science',
    grades: [1, 9],
    topics: [
      T('weather', 'Weather and the Sky', 1, 3),
      T('rocks', 'Rocks, Soil and Minerals', 2, 5),
      T('water-cycle', 'Water and the Water Cycle', 3, 6),
      T('landforms', 'Landforms and Maps', 3, 6),
      T('solar-system', 'The Solar System', 4, 7),
      T('plate-tectonics', 'Volcanoes, Earthquakes and Plates', 5, 8),
      T('climate', 'Climate and the Atmosphere', 6, 9),
      T('fossils', "Fossils and Earth's History", 6, 9),
      T('resources', 'Natural Resources and Conservation', 5, 9),
    ],
  },
  'physical-science': {
    label: 'Physical Science',
    group: 'Science',
    grades: [1, 9],
    topics: [
      T('matter', 'Matter and Materials', 1, 4),
      T('forces', 'Forces and Motion', 2, 5),
      T('light', 'Light and Colour', 3, 6),
      T('sound', 'Sound', 3, 6),
      T('heat', 'Heat and Temperature', 4, 7),
      // Electricity, magnetism and machines were one lumped topic each. They are
      // separate chapters in every syllabus and separate vocabularies — a child
      // revising circuits should not be handed "pulley" and "compass".
      T('electricity', 'Electricity and Circuits', 5, 8),
      T('magnetism', 'Magnets and Magnetism', 4, 8),
      T('machines', 'Simple Machines', 3, 7),
      T('energy', 'Energy and its Forms', 5, 8),
      T('atoms', 'Atoms, Elements and Mixtures', 7, 9),
      T('changes', 'Physical and Chemical Change', 6, 9),
    ],
  },
  'space-science': {
    label: 'Space Science',
    group: 'Science',
    grades: [1, 9],
    topics: [
      T('sky', 'The Sun, Moon and Sky', 1, 3),
      T('earth-in-space', 'Day, Night and the Seasons', 2, 5),
      T('planets', 'Planets and the Solar System', 3, 6),
      T('rockets', 'Rockets and Space Travel', 3, 7),
      T('stars', 'Stars and Galaxies', 5, 9),
      T('telescopes', 'Exploring Space', 5, 9),
    ],
  },

  // ── Science, senior school ───────────────────────────────────────────
  biology: {
    label: 'Biology',
    group: 'Science',
    grades: [10, 12],
    topics: [
      T('cell-biology', 'Cell Structure and Organelles', 10, 12),
      T('genetics', 'Genetics and Inheritance', 10, 12),
      T('physiology', 'Human Physiology', 10, 12),
      T('ecology', 'Ecology and Ecosystems', 10, 12),
      T('evolution', 'Evolution and Classification', 10, 12),
      T('plant-biology', 'Plant Biology and Photosynthesis', 10, 12),
      T('microbiology', 'Microbiology and Immunity', 10, 12),
      T('homeostasis', 'Homeostasis and the Nervous System', 10, 12),
      // Bundled from the Laws bank (data/laws/laws.js) — always offered, no
      // manifest entry needed (see index.js's BUNDLED_TOPICS).
      T('laws', 'Laws of Biology', 10, 12),
      T('law-scientists', 'Biology Scientists', 10, 12),
    ],
  },
  chemistry: {
    label: 'Chemistry',
    group: 'Science',
    grades: [10, 12],
    topics: [
      T('atomic-structure', 'Atomic Structure and the Periodic Table', 10, 12),
      T('bonding', 'Chemical Bonding', 10, 12),
      T('acids-bases', 'Acids, Bases and Salts', 10, 12),
      T('reactions', 'Chemical Reactions and Equations', 10, 12),
      T('moles', 'Moles and Stoichiometry', 10, 12),
      T('organic', 'Organic Chemistry', 10, 12),
      T('electrochemistry', 'Electrochemistry', 10, 12),
      T('kinetics', 'Energy and Rates of Reaction', 10, 12),
      T('periodic-table', 'The Periodic Table', 10, 12),
      T('laws', 'Laws of Chemistry', 10, 12),
      T('law-scientists', 'Chemistry Scientists', 10, 12),
      // IUPAC naming — read the formula, name the compound (data/chem/iupac.js).
      T('iupac-inorganic', 'IUPAC Names — Inorganic', 10, 12),
      T('iupac-organic', 'IUPAC Names — Organic', 10, 12),
    ],
  },
  physics: {
    label: 'Physics',
    group: 'Science',
    grades: [10, 12],
    topics: [
      T('mechanics', 'Mechanics and Motion', 10, 12),
      T('newton', "Forces and Newton's Laws", 10, 12),
      T('work-energy', 'Energy, Work and Power', 10, 12),
      T('waves', 'Waves, Light and Sound', 10, 12),
      T('circuits', 'Electricity and Circuits', 10, 12),
      T('magnetism', 'Magnetism and Induction', 10, 12),
      T('thermodynamics', 'Heat and Thermodynamics', 10, 12),
      T('nuclear', 'Atomic and Nuclear Physics', 10, 12),
      T('laws', 'Laws of Physics', 10, 12),
      T('law-scientists', 'Physics Scientists', 10, 12),
    ],
  },

  // ── Geography, all grades ────────────────────────────────────────────
  // Bundled map data (data/vocab/*-map.js), not generated words — the
  // countries and states themselves are the vocabulary, drawn on a real map.
  // One tier never mixes with the other, but a map is fair at any age, so this
  // subject alone spans both.
  geography: {
    label: 'Geography',
    group: 'Geography',
    grades: [1, 12],
    topics: [
      T('world-map', 'Map of the World', 1, 12),
      T('nigeria-map', 'Map of Nigeria', 1, 12),
    ],
  },

  // ── The Human Body, grades 3–9 ───────────────────────────────────────
  // Anatomy, not geography — kept in its own Science subject. These are the 2D
  // DRAWN diagrams, the JUNIOR tier: the whole-body map names the ORGANS, the
  // single-organ maps name the PARTS inside one organ.
  //
  // Senior biology (grades 10–12) will get realistic labelled 3D MODELS of the
  // same organs — a separate tier that narrows each organ down even further.
  // Until the first 3D model (the heart) is built, the subject stops at grade 9
  // so no senior room is offered an empty topic; bump the range to [3, 12] and
  // add the T('heart-3d', …, 10, 12) row when it lands.
  'human-body': {
    label: 'The Human Body',
    group: 'Science',
    grades: [3, 9],
    topics: [
      T('body-map', 'Map of the Body', 3, 9),
      T('ear-map', 'The Ear', 3, 9),
      T('skin-map', 'The Skin', 3, 9),
      T('heart-map', 'The Heart', 3, 9),
      T('brain-map', 'The Brain', 3, 9),
    ],
  },


  // ── Maths, lower school ──────────────────────────────────────────────
  'general-maths': {
    label: 'General Maths',
    group: 'Maths',
    grades: [1, 9],
    topics: [
      T('numbers', 'Numbers and Counting', 1, 3),
      T('add-subtract', 'Addition and Subtraction', 1, 4),
      T('multiply-divide', 'Multiplication and Division', 2, 5),
      T('shapes', 'Shapes and Space', 1, 5),
      T('measurement', 'Measurement', 2, 6),
      T('fractions', 'Fractions and Decimals', 3, 7),
      T('data', 'Data and Graphs', 3, 7),
      T('ratio', 'Ratio, Rate and Percentage', 5, 9),
      T('angles', 'Angles, Lines and Polygons', 5, 9),
      T('pre-algebra', 'Introduction to Algebra', 6, 9),
    ],
  },

  // ── Maths, senior school ─────────────────────────────────────────────
  algebra: {
    label: 'Algebra',
    group: 'Maths',
    grades: [10, 12],
    topics: [
      T('expressions', 'Expressions and Equations', 10, 12),
      T('quadratics', 'Quadratic Equations', 10, 12),
      T('functions', 'Functions and Graphs', 10, 12),
      T('sequences', 'Sequences and Series', 10, 12),
      T('indices', 'Indices, Surds and Logarithms', 10, 12),
      T('inequalities', 'Inequalities', 10, 12),
      T('matrices', 'Matrices and Determinants', 10, 12),
      T('polynomials', 'Polynomials', 10, 12),
    ],
  },
  geometry: {
    label: 'Geometry',
    group: 'Maths',
    grades: [10, 12],
    topics: [
      T('triangles', 'Triangles and Congruence', 10, 12),
      T('circles', 'Circles and Circle Theorems', 10, 12),
      T('coordinate', 'Coordinate Geometry', 10, 12),
      T('trigonometry', 'Trigonometry', 10, 12),
      T('transformations', 'Transformations and Vectors', 10, 12),
      T('mensuration', 'Mensuration: Area and Volume', 10, 12),
      T('similarity', 'Similarity and Scale', 10, 12),
      T('constructions', 'Constructions and Loci', 10, 12),
    ],
  },
  statistics: {
    label: 'Statistics',
    group: 'Maths',
    grades: [10, 12],
    topics: [
      T('data-presentation', 'Data Collection and Presentation', 10, 12),
      T('averages', 'Measures of Central Tendency', 10, 12),
      T('dispersion', 'Measures of Dispersion', 10, 12),
      T('probability', 'Probability', 10, 12),
      T('combinatorics', 'Permutations and Combinations', 10, 12),
      T('correlation', 'Correlation and Regression', 10, 12),
      T('distributions', 'Probability Distributions', 10, 12),
    ],
  },
};

export const SUBJECT_KEYS = Object.keys(SUBJECTS);
export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Subjects on offer at a grade — the two tiers never mix. */
export function subjectsForGrade(grade) {
  return SUBJECT_KEYS.filter((k) => {
    const [lo, hi] = SUBJECTS[k].grades;
    return grade >= lo && grade <= hi;
  });
}

/** Grades a subject serves, as a flat list (for the grade picker). */
export function gradesForSubject(subjectKey) {
  const s = SUBJECTS[subjectKey];
  if (!s) return [];
  const [lo, hi] = s.grades;
  return GRADES.filter((g) => g >= lo && g <= hi);
}

/** Topics a subject offers AT a grade — the band is what keeps it fair. */
export function topicsFor(subjectKey, grade) {
  const s = SUBJECTS[subjectKey];
  if (!s) return [];
  return s.topics.filter((t) => grade >= t.lo && grade <= t.hi);
}

export function topicMeta(subjectKey, topicKey) {
  const s = SUBJECTS[subjectKey];
  return (s && s.topics.find((t) => t.key === topicKey)) || null;
}
