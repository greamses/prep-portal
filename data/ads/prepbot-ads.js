/* ============================================================================
   PREPBOT'S DAILY ADVERT — thirty of them, one a day
   ----------------------------------------------------------------------------
   One advert a day, each about ONE thing the site can do, so that a month of
   them covers the place without ever repeating itself. Pick by the day of the
   month (`adOfDay`), or shuffle, or pick by hand — the list is just data.

   HOW THESE ARE WRITTEN, and why they read the way they do:

     ONE FEATURE EACH. An advert that lists four things sells none of them.
     Every entry names a single thing and says what it DOES.

     SAY WHAT IT DOES, NOT HOW GOOD IT IS. "Work out the tax yourself, because
     the till will not" tells a parent something; "the best maths experience"
     tells them nothing and they know it. There is no superlative in this file
     and none should be added.

     SHORT ENOUGH TO BE SAID. `say` is what PrepBot speaks, so it is one or
     two sentences and under about 150 characters. It is read aloud through
     utils/speech-maths.js, which is why the figures in it are plain.

     NO EMOJIS. House rule, everywhere.

   Each advert is:
     id        a stable name, so a day can be pinned or skipped
     feature   the part of the site it is about, for grouping and reporting
     headline  four to seven words, on the card
     say       what PrepBot says, aloud or in its bubble
     cta       the words on the button
     href      where the button goes — every one of these is a registered page
               (scripts/seo/pages.mjs); check there before adding a new one
   ========================================================================== */

export const ADS = [
  {
    id: "toy-shop",
    feature: "Toy Shop",
    headline: "A shop whose till adds nothing up",
    say: "Fill a basket with toys, then work out the bill yourself — the sale, the tax, the change. The till here will not do one sum for you.",
    cta: "Go shopping",
    href: "/prep-math/activity/toy-shop/index.html",
  },
  {
    id: "maths-workbook",
    feature: "Maths Workbook",
    headline: "Print a maths book tonight",
    say: "Place value, written sums, remainders, fractions, time and multiplying — choose the chapters, choose how many questions, and print it.",
    cta: "Build one",
    href: "/prep-math/activity/maths-workbook/index.html",
  },
  {
    id: "interactive-workbook",
    feature: "Workbooks · interactive mode",
    headline: "Or do the book on the screen",
    say: "Every printable workbook can be done here instead, and marked as it is done. The paper is the same paper either way.",
    cta: "Try it marked",
    href: "/prep-math/activity/maths-workbook/index.html",
  },
  {
    id: "geometry-workbook",
    feature: "Geometry Workbook",
    headline: "Sixteen chapters of geometry",
    say: "Angles in polygons, transversals, prisms and pyramids, clock angles, bearings, trigonometry — printable, with the answers worked out.",
    cta: "Open it",
    href: "/prep-math/activity/geometry-workbook/index.html",
  },
  {
    id: "algebra-workbook",
    feature: "Algebra Workbook",
    headline: "Quadratics, four ways",
    say: "Factorising, completing the square, the formula, and Po-Shen Loh's method — with the picture that shows why completing the square works.",
    cta: "See the four",
    href: "/prep-math/activity/algebra-workbook/index.html",
  },
  {
    id: "word-problems",
    feature: "Competition Word Problems",
    headline: "Eleven chapters of word problems",
    say: "Ages, mixtures, HCF and LCM, ratio, work and time — the kinds that turn up in competitions, with the method stated before the questions.",
    cta: "Start a set",
    href: "/prep-math/activity/word-problems-workbook/index.html",
  },
  {
    id: "statistics-workbook",
    feature: "Statistics Workbook",
    headline: "Charts, probability, and trees",
    say: "Pictograms through to probability trees and the counting rules, with dice you roll on the page and tally yourself.",
    cta: "Open it",
    href: "/prep-math/activity/statistics-workbook/index.html",
  },
  {
    id: "mental-maths",
    feature: "Mental Maths Workbook",
    headline: "Sums you can do in your head",
    say: "The old shortcuts, taught properly: why multiplying by eleven works, and then a timer to see if it has stuck.",
    cta: "Learn one",
    href: "/prep-math/activity/vedic-maths-workbook/index.html",
  },
  {
    id: "js-workbook",
    feature: "JavaScript Workbook",
    headline: "A coding book that runs",
    say: "Learn to write programs on paper that works: a real editor and a real console, on the page, running what you have written.",
    cta: "Write a program",
    href: "/prep-math/activity/js-workbook/index.html",
  },
  {
    id: "manipulatives",
    feature: "Manipulatives",
    headline: "The whole maths cupboard",
    say: "Base-ten blocks in any base, three abacuses, algebra tiles, a balance scale and the written boards — all on one bench.",
    cta: "Open the bench",
    href: "/prep-math/activity/base-blocks/index.html",
  },
  {
    id: "algebra-moves",
    feature: "Algebra Moves",
    headline: "Name the move, not the answer",
    say: "Type an equation, tap a term and say what you want to do to it. Only legal moves are offered, so every line you write is correct.",
    cta: "Solve one",
    href: "/prep-math/activity/algebra-moves/index.html",
  },
  {
    id: "geometry-studios",
    feature: "Geometry studios",
    headline: "Drag the shape and watch",
    say: "Polygon angles, transversals, Pythagoras, surface area and the circle theorems — each one a figure you can take hold of and move.",
    cta: "Explore",
    href: "/prep-math/activity/polygon-angles/index.html",
  },
  {
    id: "cartesian-art",
    feature: "Cartesian Art",
    headline: "Plot the points, find the picture",
    say: "Plot each coordinate, join them in order, and a drawing appears — then paint it. All four quadrants, and the negatives too.",
    cta: "Draw one",
    href: "/prep-math/activity/cartesian-art/index.html",
  },
  {
    id: "number-match",
    feature: "Number Match",
    headline: "Every way of writing a number",
    say: "Words, tally marks, tens and ones, base-ten blocks — drag each one onto the numeral it means. For the first years of school.",
    cta: "Play it",
    href: "/prep-math/activity/number-match/index.html",
  },
  {
    id: "equivalent-fractions",
    feature: "Equivalent Fractions",
    headline: "See why two fractions are the same",
    say: "Cut the shape into halves, then into quarters, and watch the same amount of it stay shaded. Fractions, percentages and degrees.",
    cta: "Try it",
    href: "/prep-math/activity/equivalent-fractions/index.html",
  },
  {
    id: "card-tricks",
    feature: "Card Tricks",
    headline: "Six card tricks that are sums",
    say: "A real pack on a table. Deal three piles of nine and your card lands where you asked — because you have been counting in base three.",
    cta: "Learn a trick",
    href: "/prep-math/activity/card-tricks/index.html",
  },
  {
    id: "calculator-rail",
    feature: "The tool rail",
    headline: "A calculator that shows its working",
    say: "A scientific calculator, the written boards and a notepad, on a rail beside whatever you are doing — and it keeps the sums before this one.",
    cta: "Find the rail",
    href: "/prep-math/activity/toy-shop/index.html",
  },
  {
    id: "writing",
    feature: "Writing Evaluator",
    headline: "Get your essay marked tonight",
    say: "Write it here and it comes back marked paragraph by paragraph, against the rubric for your year, with the marks explained.",
    cta: "Hand one in",
    href: "/writing/index.html",
  },
  {
    id: "sentence-studio",
    feature: "Sentence Studio",
    headline: "Build writing out of blocks",
    say: "Sentences, then paragraphs, then a whole composition — assembled from blocks, so the shape of the writing is visible before the words are.",
    cta: "Build one",
    href: "/writing/blocks/index.html",
  },
  {
    id: "game-studio",
    feature: "Game Studio",
    headline: "Make a game out of blocks",
    say: "Snap blocks together and a web page comes out the other end — HTML, CSS and JavaScript you can then read.",
    cta: "Make one",
    href: "/code/studio/index.html",
  },
  {
    id: "chemistry-bench",
    feature: "Chemistry Bench",
    headline: "A chemistry bench with loose parts",
    say: "Pick up the glassware and set it down where you like. The practicals are picture cards, and PrepBot works at the bench beside you.",
    cta: "Open the bench",
    href: "/virtual-lab/chemistry-2d/index.html",
  },
  {
    id: "chemistry-3d",
    feature: "3D Chemistry Lab",
    headline: "Stand at the bench yourself",
    say: "A laboratory you walk around in, with your own hands doing the pouring. The glassware breaks if you drop it.",
    cta: "Walk in",
    href: "/virtual-lab/chemistry/index.html",
  },
  {
    id: "exams",
    feature: "CBT exams",
    headline: "Sit a paper against the clock",
    say: "Pick a class, a subject and a topic, and sit the paper the way the real one runs — timed, marked, and gone through afterwards.",
    cta: "Sit one",
    href: "/exam-archive/national/exams/index.html",
  },
  {
    id: "theory",
    feature: "Theory Practice",
    headline: "The questions that want sentences",
    say: "Theory and essay questions, marked with a red pen rather than a tick — because multiple choice never asked you to explain anything.",
    cta: "Answer one",
    href: "/theory-page/index.html",
  },
  {
    id: "drills",
    feature: "Drills",
    headline: "Six minutes of arithmetic a day",
    say: "Tables, fractions, molecular masses — short races against the clock and against other people, in six kinds.",
    cta: "Race one",
    href: "/exam-archive/national/drills/index.html",
  },
  {
    id: "puzzles",
    feature: "Puzzles",
    headline: "Five puzzles, none of them idle",
    say: "Sliding tiles, jigsaws, Shikaku, tangrams and a map of Nigeria you put back together state by state.",
    cta: "Pick one",
    href: "/exam-archive/national/puzzles/index.html",
  },
  {
    id: "vocab",
    feature: "Vocab",
    headline: "Hangman with a diagram for a clue",
    say: "Guess the word from a picture: an element on the periodic table, an organ of the body, a country on the map, a part of a cell.",
    cta: "Play a round",
    href: "/exam-archive/national/vocab/index.html",
  },
  {
    id: "grammar",
    feature: "Grammar",
    headline: "Find what is wrong with this sentence",
    say: "A passage with mistakes buried in it: capitals, punctuation, spelling. Click the word that is wrong and put it right.",
    cta: "Proof-read one",
    href: "/exam-archive/national/grammar/index.html",
  },
  {
    id: "drone",
    feature: "Bearing Courier",
    headline: "Fly a drone by bearing alone",
    say: "Deliver a parcel to number forty-two. The only thing you are told is the bearing, so you have to read it and fly it.",
    cta: "Take off",
    href: "/home/games/drone/index.html",
  },
  {
    id: "flashcards",
    feature: "Flashcards",
    headline: "Cards that know what you forgot",
    say: "Make a deck on any topic and it comes back to the cards you missed, more often, until you stop missing them.",
    cta: "Make a deck",
    href: "/flashcards/index.html",
  },
];

/** Which advert belongs to a given day — 1 to 30, wrapping round the month. */
export const adOfDay = (date = new Date()) => ADS[(date.getDate() - 1) % ADS.length];

/** One by name, for pinning a particular advert to a particular day. */
export const adById = (id) => ADS.find((a) => a.id === id) || null;
