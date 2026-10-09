/**
 * The SEO registry — ONE record per page a search engine should list.
 *
 * scripts/seo.mjs reads this and writes, into each page:
 *   · the <head> block  (title, description, canonical, Open Graph, Twitter,
 *                        JSON-LD) between the  seo:head  markers
 *   · the "about" block (h1/h2, what it is, what you do, links to its
 *                        neighbours) between the  seo:about  markers
 * and, from the same list, sitemap.xml and the middleware's gated-route table.
 *
 * A page that is NOT listed here (and not in MANUAL or OPEN_NOINDEX below) is
 * treated as private: it gets `noindex` and stays behind the login middleware.
 * So adding a page to search = adding a record here and running
 *   node scripts/seo.mjs
 *
 * Fields
 *   file    path of the HTML file from the repo root
 *   section key of SECTIONS (breadcrumb + which pages it is linked beside)
 *   name    short name, used in breadcrumbs and link lists
 *   title   <title>; keep under ~60 characters, the brand is appended
 *   desc    meta description; 120–160 characters, says what you DO there
 *   intro   one paragraph a visitor (or a crawler) reads on the page
 *   points  three or four things you do / learn there
 *   access  optional override: "free" | "login" | "premium". Left out, it is
 *           read off the guard the page already carries.
 *
 * Wording rule (see the copyright stance): practice is "WAEC-style",
 * "JAMB-style" — original questions, never "past questions".
 */

export const SITE = "https://www.prepportal.com.ng";
export const BRAND = "Prep Portal";

export const SECTIONS = {
  exams: { name: "Exam practice" },
  races: { name: "Multiplayer races" },
  maths: { name: "Maths activities" },
  workbooks: { name: "Printable workbooks", hub: "editorials/index.html" },
  games: { name: "Learning games", hub: "home/games/index.html" },
  labs: { name: "Virtual labs", hub: "virtual-lab/index.html" },
  studio: { name: "Writing and coding" },
  read: { name: "Reading" },
};

/** Pages whose <head> is written by hand (or by the blog exporter). They are
 *  public and go in the sitemap, but the generator leaves the file alone. */
export const MANUAL = [
  { file: "index.html", priority: "1.0", changefreq: "weekly" },
  { file: "about.html", priority: "0.6", changefreq: "monthly" },
  { file: "subscribe.html", priority: "0.8", changefreq: "monthly" },
  { file: "privacy.html", priority: "0.3", changefreq: "yearly" },
  { file: "terms.html", priority: "0.3", changefreq: "yearly" },
];

/** Reachable without an account, but not for the index: redirect stubs, the
 *  sign-in page, parameter-driven shells. They get `noindex, follow`. */
export const OPEN_NOINDEX = [
  "utils/auth/auth.html",
  "exam-archive/national/question/question.html",
  "home/games/flappy-bird/flappy-bird-addition/index.html",
  "home/games/flappy-bird/flappy-bird-subtraction/index.html",
  "home/games/flappy-bird/flappy-bird-multiplication/index.html",
  "home/games/flappy-bird/flappy-bird-division/index.html",
];

export const PAGES = [
  /* ── Exam practice ─────────────────────────────────────────────────── */
  {
    file: "exam-archive/national/exams/index.html",
    section: "exams",
    name: "CBT Exam Builder",
    title: "Free CBT Practice: WAEC, NECO & JAMB-style Exam Builder",
    desc: "Build a free CBT practice exam in seconds. Pick a class, subject and topics and sit an original WAEC, NECO, JAMB, Common Entrance, IGCSE or SAT-style paper, marked instantly.",
    intro:
      "The Exam Builder turns a question bank into a computer-based test you can sit straight away. Choose your class, a subject and the topics you want, and it sets a timed paper in the style of the exam you are preparing for. Every question is original and written to the syllabus, and the paper is marked the moment you submit, with the working shown for the ones you missed.",
    points: [
      "Common Entrance, WASSCE, NECO, UTME and Post-UTME-style papers for Nigerian students",
      "IGCSE, A-Level and SAT-style papers for international exams",
      "Papers arranged by class, subject and topic, so you can revise one weak topic at a time",
      "A real CBT clock, instant marking and a score you can try to beat",
    ],
    access: "free",
    priority: "0.9",
  },
  {
    file: "theory-page/index.html",
    section: "exams",
    name: "Theory Practice",
    title: "Theory Questions with AI Marking: WAEC, NECO & Cambridge-style",
    desc: "Practise long-form theory and essay questions across WAEC, NECO, JAMB and Cambridge-style subjects. Write your answer and get it marked, with feedback and a model answer.",
    intro:
      "Objective questions only test half of an exam. Theory Practice gives you the other half: structured and essay questions you answer in your own words. Write your answer, submit it, and it is marked against a marking scheme the way an examiner would, point by point, with a model answer to compare yours against.",
    points: [
      "Theory and essay questions across science, arts and commercial subjects",
      "Marked point by point, so you see exactly where the marks were won and lost",
      "A model answer after every question",
    ],
    access: "free",
    priority: "0.8",
  },
  {
    file: "exam-archive/international/cambridge/index.html",
    section: "exams",
    name: "Cambridge-style Maths",
    title: "Cambridge-style Maths Assessment: Checkpoint & IGCSE Practice",
    desc: "Sit Cambridge-style maths assessments online, with instant marking and worked solutions. Built for Cambridge Lower Secondary, Checkpoint and IGCSE learners.",
    intro:
      "A maths assessment in the style Cambridge schools use, taken on screen. Work through the paper at your own pace, submit, and see your mark with a worked solution for every question. It suits learners in Cambridge Lower and Upper Secondary who want practice that looks like the real paper.",
    points: [
      "Structured questions in the Cambridge style, not just multiple choice",
      "Instant marking with worked solutions",
      "Useful for Checkpoint and IGCSE Mathematics revision",
    ],
    access: "free",
    priority: "0.7",
  },

  /* ── Multiplayer races ─────────────────────────────────────────────── */
  {
    file: "exam-archive/national/drills/index.html",
    section: "races",
    name: "Drills",
    title: "Times Tables Race: Multiplayer Maths Drills",
    desc: "Race up to 10 players in timed maths drills: times tables, powers, fractions, fraction bars and relative molecular mass. Play 1v1 or in a room; bots fill empty seats.",
    intro:
      "Drills is speed practice turned into a race. Open a room, share the code with your class or friends, and everyone answers the same stream of questions against the clock. You type the answer and it is taken the moment it is right, so there is nothing to slow you down. If a seat is empty, a bot takes it.",
    points: [
      "Times tables, powers and fractions, plus a table grid where you work out the hidden headers",
      "Fraction bars for adding and subtracting unlike fractions",
      "Relative molecular mass of common chemistry compounds",
      "1v1 or rooms of up to 10 players",
    ],
  },
  {
    file: "exam-archive/national/puzzles/index.html",
    section: "races",
    name: "Puzzles",
    title: "Puzzle Race: Sudoku, Jigsaw, Shikaku & Tangram Online",
    desc: "Race friends in timed Sudoku, sliding-tile, jigsaw, Shikaku and Tangram puzzles, including a jigsaw map of Nigeria's 36 states. Up to 10 players or 1v1.",
    intro:
      "Five kinds of logic puzzle, each one a race. Everyone in the room gets the same puzzle and the same time; whoever has the most correct cells, tiles or pieces when the clock stops wins. The jigsaw includes a map of Nigeria where you drag every state into its place.",
    points: [
      "Sudoku, sliding tiles, jigsaw, Shikaku and Tangram",
      "A map of Nigeria jigsaw: place all 36 states and the FCT",
      "Picture, fraction and number tile sets for the slider",
      "Multiplayer rooms, 1v1, or solo against bots",
    ],
  },
  {
    file: "exam-archive/national/geometry/index.html",
    section: "races",
    name: "Geometry Race",
    title: "Perimeter & Circumference Race: Multiplayer Geometry Drills",
    desc: "Race up to 10 players finding the perimeter of circles, semicircles, quadrants, sectors, triangles, rectangles and squares, with pi as 22/7. Bots fill empty seats.",
    intro:
      "A shape appears with its measurements, and the first to work out its perimeter scores. The Geometry Race covers the plane shapes that come up in junior and senior secondary mensuration, using pi as 22/7 the way exam questions do.",
    points: [
      "Circles, semicircles, quadrants and sectors",
      "Triangles, rectangles and squares",
      "Timed rounds for up to 10 players, or 1v1",
    ],
  },
  {
    file: "exam-archive/national/vocab/index.html",
    section: "races",
    name: "Vocab",
    title: "Science & Maths Vocabulary Hangman: A to Z Word Game",
    desc: "Hangman for Science and Maths words. Read the clue or the diagram and spell the term: the periodic table, world and Nigeria maps, the human body, the cell and Nigerian leaders.",
    intro:
      "Vocab is hangman played with the words your subjects are built from. Each round gives a clue, or points at part of a drawing, and you spell the term a letter at a time. Picture topics turn a diagram into the clue, so you learn where things are as well as what they are called.",
    points: [
      "Science and Maths terms with a written clue for each",
      "Picture topics: the periodic table, a world map, a map of Nigeria, the human body, plant and animal cells",
      "Nigerian heads of state, by portrait and years in office",
      "Solo or multiplayer",
    ],
  },
  {
    file: "exam-archive/national/grammar/index.html",
    section: "races",
    name: "Grammar",
    title: "Grammar Editing Game: Proof-read with CUPS",
    desc: "Proof-reading as a race. Edit a passage full of planted mistakes and name each one with CUPS: Capitalisation, Usage, Punctuation, Spelling. Up to 10 players or 1v1.",
    intro:
      "You are handed a passage with mistakes planted in it. Find each one, correct the word, and say which kind of mistake it was using CUPS: Capitalisation, Usage, Punctuation or Spelling. A second activity, Word Upgrade, has you swap tired words such as “said” for more vivid ones.",
    points: [
      "Edit real passages word by word",
      "Name every error with the CUPS checklist",
      "Word Upgrade: replace weak words with stronger ones",
      "Race a room of up to 10, or play 1v1",
    ],
  },
  {
    file: "exam-archive/national/planner/index.html",
    section: "races",
    name: "Planner",
    title: "Planner: A Time-Management & Scheduling Game",
    desc: "Plan a day against the clock. Read the clues, work out when each event must happen, and schedule them all without a clash. A multiplayer time and reasoning race.",
    intro:
      "Planner gives you a list of events and a set of clues about when they happen. Work out the hidden times from the clues and place every event on the timetable so nothing clashes. It practises telling the time, elapsed time and logical deduction at once.",
    points: [
      "Deduce start times and durations from written clues",
      "Practise 12-hour and 24-hour time and elapsed time",
      "Multiplayer rooms or solo play",
    ],
  },

  /* ── Maths activities ──────────────────────────────────────────────── */
  {
    file: "prep-math/drag/index.html",
    section: "maths",
    name: "Algebra Lab",
    title: "Algebra Lab: Solve Equations by Dragging Terms",
    desc: "Solve linear equations by dragging terms across the equals sign and balancing both sides. An interactive algebra activity that builds equation-solving intuition.",
    intro:
      "In the Algebra Lab an equation is something you move with your hands. Drag a term to the other side and watch its sign change; do the same thing to both sides and watch the equation stay balanced. It makes the rules of solving equations visible before you have to do them on paper.",
    points: [
      "Drag terms across the equals sign",
      "See why “change side, change sign” works",
      "Step-by-step practice with linear equations",
    ],
    access: "free",
  },
  {
    file: "prep-math/graphing/index.html",
    section: "maths",
    name: "Graph Predictor",
    title: "Graph Predictor: Read a Graph and Find Its Equation",
    desc: "Look at a straight-line graph and type the equation you think it shows. Your answer is plotted instantly beside it, so you can see how gradient and intercept change the line.",
    intro:
      "The Graph Predictor shows you a graph and asks for its equation. Type what you think it is and your line is plotted at once next to the real one, so a wrong gradient or intercept is something you can see and correct. It builds the habit of reading y = mx + c straight off a graph.",
    points: [
      "Link gradient and intercept to the line you see",
      "Your answer plotted instantly for comparison",
      "Practice for straight-line graphs and coordinate geometry",
    ],
    access: "free",
  },
  {
    file: "prep-math/mental-math/index.html",
    section: "maths",
    name: "Mental Math Tricks",
    title: "Mental Maths Tricks: Vedic Maths & Trachtenberg, Animated",
    desc: "Learn mental maths shortcuts from Vedic Maths and the Trachtenberg system, animated step by step by a teacher, then drill each trick with endless practice.",
    intro:
      "Fast calculation is a set of tricks anyone can learn. Each lesson here takes one shortcut, shows it worked step by step on screen, and then gives you endless questions to practise it until it is automatic.",
    points: [
      "Shortcuts from Vedic Maths and the Trachtenberg system",
      "Every trick animated one step at a time",
      "Endless practice after each lesson",
    ],
    access: "free",
  },
  {
    file: "prep-math/mental-math/times-eleven/index.html",
    section: "maths",
    name: "The × 11 Trick",
    title: "Multiply by 11 in Your Head: The × 11 Trick",
    desc: "Learn to multiply any 2- to 4-digit number by 11 in your head. The trick is animated step by step, then you drill it with endless practice questions.",
    intro:
      "To multiply by 11 you only ever add neighbours. This lesson shows the method on 2-, 3- and 4-digit numbers, including what to do when a pair of digits adds up to more than 9, and then lets you practise until you can do it without writing anything down.",
    points: [
      "The add-the-neighbours method, animated",
      "Carrying handled step by step",
      "Endless practice from 2 to 4 digits",
    ],
    access: "free",
  },
  {
    file: "prep-math/activity/index.html",
    section: "maths",
    name: "Fraction Explorer",
    title: "Fraction Explorer: Name the Fraction a Shape Shows",
    desc: "A shaded circle or bar appears and you say what it shows, as a fraction, a percent, a decimal, degrees or time. Endless visual practice, with comparing, multiplying and dividing.",
    intro:
      "Fraction Explorer draws a shape, shades part of it and asks what you see. Answer as a fraction, a percentage, a decimal, an angle or a time, and the questions keep coming until you end the session. Choose circles or bars and how many parts the shape is cut into, from halves to twelfths.",
    points: [
      "Read fractions, percents, decimals, degrees and time off a shape",
      "Compare, multiply and divide fractions with pictures",
      "Build the number sense behind fraction sums",
    ],
  },
  {
    file: "prep-math/activity/equivalent-fractions/index.html",
    section: "maths",
    name: "Equivalent Fractions",
    title: "Equivalent Fractions Visualiser",
    desc: "See why 1/2, 2/4 and 4/8 are the same amount. An interactive visualiser that cuts a shape into more parts and shows equivalent fractions side by side.",
    intro:
      "Two fractions are equivalent when they cover the same amount. This visualiser draws a fraction, then cuts every part into smaller equal parts so you can watch the numerator and denominator grow together while the shaded amount stays the same.",
    points: [
      "See a fraction drawn as shaded parts of a shape",
      "See why you multiply top and bottom by the same number",
      "Simplify by reversing the cut",
    ],
  },
  {
    file: "prep-math/activity/algebra-moves/index.html",
    section: "maths",
    name: "Algebra Moves",
    title: "Algebra Moves: Solve Equations One Legal Move at a Time",
    desc: "Type an equation, tap a term and name the move. Algebra Moves writes the next line for you, so you learn to rearrange and solve equations step by step.",
    intro:
      "Algebra Moves is an endless sheet for working algebra out. Type an equation or an expression, or pick a formula and say what you were given. Tap a term, choose the move you want to make, and the tool writes the next line while the writing travels into place. Only legal moves are offered, so every line you produce is correct.",
    points: [
      "Solve linear equations and rearrange formulas",
      "Expand, factorise and collect like terms",
      "Every step written out as a line of working",
    ],
  },
  {
    file: "prep-math/activity/base-blocks/index.html",
    section: "maths",
    name: "Manipulatives",
    title: "Virtual Maths Manipulatives: Base-Ten Blocks, Abacus & Algebra Tiles",
    desc: "A workbench of virtual maths manipulatives: base-ten blocks in any base, three abacuses, algebra tiles, a balance scale, place-value charts and written-method boards.",
    intro:
      "Everything a maths teacher keeps in the cupboard, on one bench. Split and trade base-ten blocks in any base, count on a Russian, Chinese or Japanese abacus, lay out algebra tiles for x and y, weigh an unknown on a balance scale, and work a sum out on a board a line at a time.",
    points: [
      "Base-ten blocks you can split and trade, in any number base",
      "Russian, Chinese and Japanese abacuses",
      "Algebra tiles, an area frame and a balance scale for equations",
      "Boards for long division, column addition and column multiplication",
    ],
  },
  {
    file: "prep-math/activity/number-match/index.html",
    section: "maths",
    name: "Number Match",
    title: "Number Match: Words, Tally Marks & Base-Ten Blocks to Numerals",
    desc: "Match every way of writing a number to its numeral: number words, expanded form, tens and ones, tally marks and base-ten blocks. For early primary, from 1 to 100.",
    intro:
      "A board of numbers and a pile of sticky notes. Each note shows a number another way: in words, as its places added together, as tens and ones, as tally marks or as base-ten blocks. Drag every note onto the number it stands for. Choose the range and which ways of writing to practise.",
    points: [
      "Number words, expanded form, tens and ones, tallies and blocks",
      "Ranges 1 to 20, 20 to 50 and 50 to 100",
      "Works with a finger on a tablet",
    ],
  },
  {
    file: "prep-math/activity/cartesian-art/index.html",
    section: "maths",
    name: "Cartesian Art",
    title: "Cartesian Art: Plot Coordinates to Draw a Picture",
    desc: "Plot points on a coordinate plane, join them up and a picture appears, then paint it. A coordinate-plotting art studio for practising all four quadrants.",
    intro:
      "Cartesian Art gives you a list of coordinates and a grid. Plot each point, join them in order and a drawing appears, ready to paint. It is the most enjoyable way there is to practise reading and plotting (x, y) in all four quadrants.",
    points: [
      "Plot ordered pairs, including negative coordinates",
      "Join the points to reveal a picture",
      "Paint the finished drawing",
    ],
  },
  {
    file: "prep-math/activity/polygon-angles/index.html",
    section: "maths",
    name: "Polygon Angles",
    title: "Polygon Angles: Interior & Exterior Angle Explorer",
    desc: "Explore the angles of polygons: change the number of sides and see the interior angle sum, each interior angle and the exterior angles update as you go.",
    intro:
      "Why do the angles of a pentagon add up to 540°? Polygon Angles lets you set the number of sides and watch the polygon split into triangles, with the sum of the interior angles, the size of each angle and the exterior angles updating as you go.",
    points: [
      "Sum of interior angles, (n − 2) × 180°",
      "Interior and exterior angles of regular polygons",
      "Part of the Geometry studios, with Transversals, Pythagoras, Surface Area and Circle Theorems",
    ],
  },
  {
    file: "prep-math/activity/transversals/index.html",
    section: "maths",
    name: "Transversals",
    title: "Angles on Parallel Lines: Transversal Explorer",
    desc: "Drag a transversal across parallel lines and see corresponding, alternate and co-interior angles. Then answer on the figure: equal or supplementary?",
    intro:
      "When a line crosses two parallel lines it makes eight angles, and they come in just two sizes. The Transversal Explorer lets you move the line and watch which angles stay equal and which add up to 180°, then tests you by asking you to pick the right angle on the figure itself.",
    points: [
      "Corresponding, alternate and co-interior angles",
      "Vertically opposite angles and angles on a straight line",
      "Activities answered directly on the diagram",
    ],
  },
  {
    file: "prep-math/activity/pythagoras/index.html",
    section: "maths",
    name: "Pythagoras",
    title: "Pythagoras' Theorem: An Interactive Visual Proof",
    desc: "Drag a right-angled triangle to any size, then watch the squares on the two shorter sides break apart and slide together to fill the square on the hypotenuse.",
    intro:
      "Pythagoras' theorem says the squares on the two shorter sides of a right-angled triangle together equal the square on the hypotenuse. Here you see it happen: the smaller squares are cut into pieces that slide, without turning, to fill the large one exactly, whatever size you make the triangle.",
    points: [
      "Drag the triangle to any size",
      "A dissection proof you control with a slider",
      "See a² + b² = c² as area, not just a formula",
    ],
  },
  {
    file: "prep-math/activity/surface-area/index.html",
    section: "maths",
    name: "Surface Area",
    title: "Surface Area & Nets of 3D Shapes",
    desc: "Unfold a 3D shape into its net and see where its surface area comes from. An interactive activity for cubes, cuboids, cylinders, cones and spheres.",
    intro:
      "The surface area of a solid is the area of the flat shape you get when you unfold it. This activity opens 3D shapes into their nets so you can see each face, work out its area and add them up.",
    points: [
      "Unfold a 3D solid into its 2D net",
      "Match each face to its area",
      "Practice for mensuration questions",
    ],
  },
  {
    file: "prep-math/activity/circle-theorems/index.html",
    section: "maths",
    name: "Circle Theorems",
    title: "Circle Theorems: Drag the Points and See Why",
    desc: "Eight circle theorems you can drag. Move points round the circle and watch the angle at the centre stay twice the angle at the circumference, then find the missing angle.",
    intro:
      "Circle theorems are easier to remember once you have seen them refuse to break. Drag the points round the circle and each theorem holds wherever you put them. Every theorem has three parts: explore it, see why it is true, and find the missing angle.",
    points: [
      "Angle at the centre, angles in the same segment, angle in a semicircle",
      "Cyclic quadrilaterals, tangents and the alternate segment theorem",
      "A short proof and practice questions for every theorem",
    ],
  },

  /* ── Printable workbooks ───────────────────────────────────────────── */
  {
    file: "prep-math/activity/maths-workbook/index.html",
    section: "workbooks",
    name: "Maths Workbook",
    title: "Printable Maths Workbook & Worksheet Generator, with Answers",
    desc: "Make printable maths worksheets with an answer key: place value, addition and subtraction, division and remainders, fractions, time, multiplication and bar models.",
    intro:
      "A maths workbook you build a chapter at a time. Pick the exercises you want and the workbook lays them out on real pages, ready to print, with a fresh set of questions every time and an answer key at the back. The same pages can be done on screen and are marked as you go.",
    points: [
      "Place value with base-ten blocks and charts, number words, rounding and ordering",
      "Adding, taking away, multiplying and dividing, written across and down the page",
      "Fractions, time, prime factors, number bases and bar models",
      "New questions on every print, with answers",
    ],
    priority: "0.8",
  },
  {
    file: "prep-math/activity/geometry-workbook/index.html",
    section: "workbooks",
    name: "Geometry Workbook",
    title: "Printable Geometry Workbook: Angles, Polygons, Circles & Trig",
    desc: "A printable geometry workbook in the order it is taught: lines and angles, polygons, Pythagoras, circles, solids, bearings, trigonometry and angles of elevation.",
    intro:
      "Geometry in the order a class meets it, from naming an angle to angles of elevation and depression. Each chapter is a set of printable exercises with accurately drawn figures, and on screen the instruments work: you can measure with a protractor and fold shapes along their lines of symmetry.",
    points: [
      "Lines and angles, parallel lines and polygons",
      "Pythagoras, circles, pyramids and prisms, area and volume",
      "Clock angles, bearings, trigonometry, elevation and depression",
      "Printable, with an answer key",
    ],
    priority: "0.8",
  },
  {
    file: "prep-math/activity/algebra-workbook/index.html",
    section: "workbooks",
    name: "Algebra Workbook",
    title: "Printable Algebra Workbook: Equations, Quadratics & Graphs",
    desc: "A printable algebra workbook in 14 chapters: bar models and balance scales, functions and graphs, quadratics, simultaneous equations, matrices, vectors and logic.",
    intro:
      "Algebra from its first idea, a letter standing for an unknown, through to senior-secondary topics. Early chapters draw equations as bar models and balance scales; later ones cover the remainder theorem, quadratics by five methods, simultaneous equations, the binomial expansion, matrices, vectors and logic gates.",
    points: [
      "Bar models and a balance scale you can play on screen",
      "Quadratics: factorising, completing the square, the formula and graphs",
      "Simultaneous equations, including Cramer's rule and Gaussian elimination",
      "Matrices, vectors, truth tables and logic circuits",
    ],
    priority: "0.8",
  },
  {
    file: "prep-math/activity/statistics-workbook/index.html",
    section: "workbooks",
    name: "Statistics Workbook",
    title: "Printable Statistics Workbook: Charts, Graphs & Probability",
    desc: "A printable statistics workbook: tally charts and pictograms, bar charts, line graphs, pie charts, scatter graphs, probability with tree diagrams, permutations and combinations.",
    intro:
      "Data handling from the first tally mark to probability trees. The chapters build from sorting and counting, through reading and drawing every kind of chart, to probability, permutations and combinations. On screen you roll the dice and build the charts yourself.",
    points: [
      "Tallies, pictograms, bar charts, line graphs and pie charts",
      "Scatter graphs, correlation and the line of best fit",
      "Probability, tree diagrams, permutations and combinations",
    ],
    priority: "0.8",
  },
  {
    file: "prep-math/activity/vedic-maths-workbook/index.html",
    section: "workbooks",
    name: "Mental Maths Workbook",
    title: "Printable Mental Maths Workbook: Tricks & Timed Drills",
    desc: "A printable mental maths workbook: complements, doubles, multiplying by 11, 5 and 25, squaring tricks, square and cube roots and the Trachtenberg system.",
    intro:
      "Mental maths tricks in two kinds of practice. Skill development sets each trick out as steps with worked examples and no timer. Drills ask for whole answers with five seconds a question. Together they cover the shortcuts of Vedic Maths and the Trachtenberg system.",
    points: [
      "Complements, doubles and near doubles",
      "Multiplying by 11, 5, 25 and 50, vertically and crosswise",
      "Squaring tricks, square roots and cube roots",
      "Casting out nines to check an answer",
    ],
    priority: "0.8",
  },
  {
    file: "prep-math/activity/word-problems-workbook/index.html",
    section: "workbooks",
    name: "Competition Word Problems",
    title: "Maths Word Problems for Competitions & Scholarship Exams",
    desc: "A printable workbook of word problems for maths competitions and scholarship exams: ages, mixtures, HCF and LCM, ratio, work and speed, sequences, probability and percentages.",
    intro:
      "The word problems that decide maths competitions and scholarship exams, sorted by type. Each of the eleven chapters works one problem in full, then gives you a fresh set to try, and the answer key shows the method as well as the answer.",
    points: [
      "Ages, alligation and mixture, HCF and LCM, compound ratios",
      "Work, pipes and speed; systems of equations; sequences and series",
      "Arrangements, selections and probability trees",
      "Percentages, profit and loss, remainders and cycles",
    ],
    priority: "0.8",
  },
  {
    file: "prep-math/activity/js-workbook/index.html",
    section: "workbooks",
    name: "JavaScript Workbook",
    title: "JavaScript for Beginners: A Workbook with a Code Editor",
    desc: "Learn JavaScript from zero with a workbook that has an editor and a console on every page. Read a program, predict what it prints, then run it. Data types and variables.",
    intro:
      "A coding workbook for complete beginners. Every page has a code editor and a console: you read a short program, say what it will print, then run it and find out. The first chapters cover data types, variables and how to name them.",
    points: [
      "Strings, numbers and booleans, and what typeof tells you",
      "let and const, and the rules for naming a variable",
      "Programs run safely in the page and are marked by what they print",
    ],
    priority: "0.7",
  },

  /* ── Learning games ────────────────────────────────────────────────── */
  {
    file: "home/games/index.html",
    section: "games",
    name: "Games",
    title: "Maths Games Online: 2D & 3D Learning Games",
    desc: "Play maths games online: Cross Math, Math Flappy Bird, fraction sliders and flip cards, Snakes and Ladders, plus 3D chess, a bearings drone, an angle shooter and a maze.",
    intro:
      "Games that practise real maths while you play. The 2D games are quick rounds of number facts, fractions and equations. The 3D games put a skill inside a world: reading bearings to fly a drone, reading angles to aim a cannon, or thinking ahead on a chessboard.",
    points: [
      "2D: Cross Math, Math Flappy Bird, Flip Card, Slider, Snakes and Ladders, Prime Blockster",
      "3D: Bearing Courier, Alien Angle, Grand Chess, 3D Maze, Speed Cube, Free Throw",
      "Plays in the browser on a phone, tablet or computer",
    ],
    access: "free",
    priority: "0.8",
  },
  {
    file: "home/games/crossmath/index.html",
    section: "games",
    name: "Cross Math",
    title: "Cross Math: A Crossword Puzzle Made of Sums",
    desc: "Cross Math is a crossword made of sums. Every row and column is an equation; place the number tiles so that every line is true. A free online maths puzzle.",
    intro:
      "Every row and every column of the grid is an equation with numbers missing. The missing numbers are on the tiles below. Place them all so that every line is true at the same time.",
    points: [
      "Addition, subtraction, multiplication and division",
      "Each tile has to work across and down",
      "A new grid every game",
    ],
    access: "login",
  },
  {
    file: "home/games/flappy-bird/flappy.html",
    section: "games",
    name: "Math Flappy Bird",
    title: "Math Flappy Bird: Fly and Answer Times Tables",
    desc: "Flap the bird through the pipes while you answer sums from a table you choose: addition, subtraction, multiplication or division. One slip ends the flight.",
    intro:
      "Flappy Bird, with a sum to answer between the pipes. Choose an operation and a table, then keep the bird flying while you pick the right answers. It is number-fact practice you will want to repeat.",
    points: [
      "Addition, subtraction, multiplication and division",
      "Choose the table you want to practise",
      "Beat your own best flight",
    ],
    access: "login",
  },
  {
    file: "home/games/flip/index.html",
    section: "games",
    name: "Flip Card Game",
    title: "Fraction, Decimal & Percent Matching Game",
    desc: "A memory game for equivalent values. Flip two cards and keep the pair when a fraction meets its decimal, percent or angle. Practise conversions as you play.",
    intro:
      "A memory game where the pairs are not identical: they are equal. Flip two cards and keep them when a fraction matches its decimal, its percentage or its angle of a full turn.",
    points: [
      "Match fractions, decimals, percentages and angles",
      "Trains conversions until they are instant",
      "Quick rounds, good for the start of a lesson",
    ],
    access: "login",
  },
  {
    file: "home/games/slide/game.html",
    section: "games",
    name: "Slider Game",
    title: "Fraction Slider Puzzle: Put the Tiles in Order",
    desc: "A sliding-tile puzzle where the tiles are fractions, percents, decimals, degrees or minutes. Slide them into ascending or descending order to win.",
    intro:
      "The classic sliding puzzle, except that the tiles are fractions, decimals, percentages, degrees or minutes instead of 1 to 15. To solve it you have to know which value is bigger.",
    points: [
      "Order fractions, decimals and percentages",
      "Ascending or descending",
      "Fractions, percents, decimals, degrees or minutes",
    ],
    access: "login",
  },
  {
    file: "home/games/snakes-ladders/index.html",
    section: "games",
    name: "Snakes and Ladders",
    title: "Snakes and Ladders Maths Game: Fractions Practice",
    desc: "Roll the dice, climb the ladders and dodge the snakes. Convert fractions correctly to win Lucky Cards. A one- or two-player maths board game.",
    intro:
      "Snakes and Ladders with a maths twist: convert a fraction correctly and you earn a Lucky Card that can change the race. Play alone or against a friend on the same screen.",
    points: [
      "One or two players",
      "Fraction conversion questions unlock Lucky Cards",
      "Play with the keyboard or by dragging",
    ],
    access: "login",
  },
  {
    file: "home/games/block/tetris.html",
    section: "games",
    name: "Prime Blockster",
    title: "Prime Blockster: A Block-Stacking Game about Area & Primes",
    desc: "Stack falling blocks, in 2D or 3D, and keep track of the area and volume you have built. A block-stacking maths game about area, volume and prime numbers.",
    intro:
      "A block-stacking game that keeps asking about the shape you are building. As pieces lock in you work out the total area or volume on the board and whether the number is prime. Play flat in 2D or switch to 3D and build in depth.",
    points: [
      "Area and volume of rectangles, cuboids and polyominoes",
      "Prime and composite numbers",
      "2D and 3D boards",
    ],
    access: "login",
  },
  {
    file: "home/games/drone/index.html",
    section: "games",
    name: "Bearing Courier",
    title: "Bearing Courier: A 3D Drone Game for Learning Bearings",
    desc: "Pilot a delivery drone by bearing. Read the three-figure bearing to each house, turn to match your compass, fly there and drop the package before the minute is up.",
    intro:
      "Bearings make sense once you have had to fly by them. In Bearing Courier each delivery comes with a three-figure bearing. Turn your drone until the compass matches, fly to the numbered house and drop the package, as many times as you can in a minute.",
    points: [
      "Three-figure bearings measured clockwise from north",
      "Compass reading and direction",
      "A full 3D town to fly over",
    ],
  },
  {
    file: "home/games/aliens/index.html",
    section: "games",
    name: "Alien Angle",
    title: "Alien Angle: A Protractor Game for Measuring Angles",
    desc: "Shoot hidden alien saucers using their angular position. Read the protractor, aim the cannon at the right angle and fire. A 3D game for estimating and measuring angles.",
    intro:
      "The saucers are hidden; all you are given is an angle. Read the protractor, swing the cannon to that angle and fire. Alien Angle is practice at measuring and estimating angles that feels like an arcade game.",
    points: [
      "Read a protractor quickly and accurately",
      "Acute, obtuse and reflex angles",
      "Faster rounds as you improve",
    ],
  },
  {
    file: "home/games/chess/index.html",
    section: "games",
    name: "Grand Chess",
    title: "Grand Chess: Play Realistic 3D Chess Online",
    desc: "A realistic 3D chess game with hand-modelled wooden pieces and the full rules: legal moves, check, castling, en passant and promotion. Play in your browser.",
    intro:
      "Chess on a wooden board you can look around. Grand Chess enforces every rule of the game, including castling, en passant and promotion, and shows the legal moves for the piece you pick up.",
    points: [
      "Full legal-move checking, check and checkmate",
      "Castling, en passant and pawn promotion",
      "Builds planning and logical thinking",
    ],
  },
  {
    file: "home/games/maze/index.html",
    section: "games",
    name: "3D Maze",
    title: "3D Maze: Find the Exit Before the Hunters Find You",
    desc: "Find your way out of a randomly generated 3D maze. Explore with the keyboard and mouse, avoid the hunters and reach the glowing exit. A new maze every game.",
    intro:
      "A new maze is built every time you play. Find a route to the glowing exit while hunters search the corridors for you. It rewards a good memory, a sense of direction and a calm head.",
    points: [
      "Randomly generated mazes",
      "Spatial reasoning and route planning",
      "Keyboard and mouse controls",
    ],
  },
  {
    file: "home/games/rubiks-cube/index.html",
    section: "games",
    name: "Speed Cube",
    title: "Speed Cube: Solve a 3D Rubik's-style Cube Online",
    desc: "Solve a realistic 3D speed cube with your keyboard. Rotate the whole cube with the arrow keys and twist faces relative to the one in front of you.",
    intro:
      "A 3×3 cube you solve from the keyboard. Turn the whole cube with the arrow keys and twist faces relative to whichever one is facing you, the way a speed-cuber thinks about it.",
    points: [
      "Standard 3×3 cube with face turns",
      "Keyboard controls built for speed",
      "Practise algorithms and pattern recognition",
    ],
  },
  {
    file: "home/games/free-throw/index.html",
    section: "games",
    name: "Free Throw",
    title: "FPV Free Throw: A First-Person Basketball Game",
    desc: "A realistic first-person basketball free-throw game. Set your aim, judge the power and release. The ball follows a real projectile path to the hoop.",
    intro:
      "Stand at the free-throw line and shoot. You control the angle of your aim and the power of the throw, and the ball flies on a true projectile path, so getting it in is a matter of judging angle and speed.",
    points: [
      "Aim and power you control separately",
      "Projectile motion you can feel",
      "First-person 3D view",
    ],
  },

  /* ── Virtual labs ──────────────────────────────────────────────────── */
  {
    file: "virtual-lab/index.html",
    section: "labs",
    name: "Virtual Lab",
    title: "Virtual Science Lab: Online Chemistry Practicals",
    desc: "Do chemistry practicals online. A 3D chemistry lab for titrations and reactions, and a 2D bench where you assemble your own apparatus, heat, pour and test for gases and ions.",
    intro:
      "Not every school has a stocked laboratory, and no school lets you repeat a practical twenty times. The Virtual Lab does. Carry out the practicals on the chemistry syllabus on screen, with glassware that pours, burners that heat and tests that give the observations you would write in an exam.",
    points: [
      "Chemistry Lab: a 3D bench you walk around, for titrations and reactions",
      "Chemistry Bench: loose apparatus you assemble yourself in 2D",
      "Practice for WAEC and NECO-style chemistry practical papers",
    ],
    priority: "0.8",
  },
  {
    file: "virtual-lab/chemistry/index.html",
    section: "labs",
    name: "Chemistry Lab (3D)",
    title: "3D Virtual Chemistry Lab: Titration & Reactions Online",
    desc: "A 3D virtual chemistry lab. Walk up to the bench, pick up the glassware, mix solutions, run a titration and observe the reactions, all in first person.",
    intro:
      "A chemistry laboratory you can walk around. Pick up burettes, pipettes and flasks from a real bench, mix solutions and watch what happens. It is the nearest thing to being in the lab, for the times you cannot be.",
    points: [
      "Acid-base titration with 3D glassware",
      "Mix solutions and observe the reactions",
      "First-person view, with your own hands on the glassware",
    ],
  },
  {
    file: "virtual-lab/chemistry-2d/index.html",
    access: "login",
    section: "labs",
    name: "Chemistry Bench",
    title: "Chemistry Bench: Build Your Own Experiment Online",
    desc: "An open chemistry bench and a drawer of loose apparatus. Clamp, stopper and pipe it together, add acids, alkalis, salts and metals, heat them, and test the gases and ions.",
    intro:
      "The bench starts empty. Open the drawer, take out test tubes, flasks, stoppers, delivery tubes and burners, and put your own experiment together. Add the chemicals, heat them, collect the gas and test it, and a notebook records what you observe. A guide can do five experiments on the bench first, then watch you repeat them.",
    points: [
      "Precipitation, displacement and neutralisation reactions",
      "Tests for gases with a splint and litmus, and tests for ions",
      "Separating funnel, gas syringe, gas collection and an electrolysis cell",
      "Observations written down as you work, the way a practical paper wants them",
    ],
  },

  /* ── Writing and coding ────────────────────────────────────────────── */
  {
    file: "writing/index.html",
    section: "studio",
    name: "Writing Evaluator",
    title: "AI Essay Marker: Composition & Summary Feedback",
    desc: "Write an essay, letter, report or summary and have it marked in red pen: grammar, structure and content, scored against a rubric for your class, with a model text.",
    intro:
      "The Writing Evaluator teaches a piece of writing from plan to mark. Choose your class and the kind of writing; plan it in an organiser built on a mnemonic for that form; write; and get it back marked paragraph by paragraph, with every correction explained and a score against a rubric.",
    points: [
      "Narrative, descriptive, argumentative and expository essays, letters, reports, reviews and summaries",
      "Marking weighted for your class, from primary to senior secondary",
      "Planning organisers, wall charts and model texts for every form",
      "Useful for WAEC, NECO and Cambridge-style English Language papers",
    ],
    priority: "0.8",
  },
  {
    file: "writing/blocks/index.html",
    section: "studio",
    name: "Sentence Studio",
    title: "Sentence Studio: Build Sentences & Essays from Blocks",
    desc: "Build English writing out of blocks. Snap subjects, verbs and phrases into sentences, sentences into paragraphs and paragraphs into a whole composition.",
    intro:
      "Sentence Studio shows how writing is put together by letting you build it. Snap a subject, a verb and a phrase into a sentence; sentences into a paragraph with a topic sentence; paragraphs into a complete composition. What you build is written out beside the blocks as you go.",
    points: [
      "Parts of speech and figures of speech as blocks",
      "Paragraph structure: topic sentence and supporting detail",
      "Narrative, descriptive, persuasive, expository, recount, procedure and explanation",
    ],
  },
  {
    file: "code/studio/index.html",
    section: "studio",
    name: "Game Studio",
    title: "Game Studio: Learn to Code by Building a Game with Blocks",
    desc: "Build a web page and a game out of blocks: HTML, CSS, JavaScript and Phaser. The real code is written out beside your blocks, and a live preview runs it.",
    intro:
      "Game Studio is block coding that does not hide the code. HTML blocks decide what is on the page, CSS blocks how it looks, JavaScript blocks what it does, and a Phaser extension adds sprites, physics and input. The code you have built is written out next to the blocks, and the preview runs it.",
    points: [
      "HTML, CSS and JavaScript as drag-and-drop blocks",
      "Make a real game with sprites and physics",
      "See the code your blocks produce",
    ],
  },
  {
    file: "flashcards/index.html",
    section: "studio",
    name: "AI Flashcards",
    title: "AI Flashcard Maker for Any Class, Subject & Topic",
    desc: "Make a deck of flashcards for any class, subject and topic in seconds, from Primary 1 to SS 3. Polish the wording and add images before you study the deck.",
    intro:
      "Choose a class, a subject and a topic, and a deck of flashcards is written for you. Tidy the wording, add pictures or regenerate a card, then study the deck. Teachers can prepare a deck before a lesson; students can make one for the topic they keep forgetting.",
    points: [
      "Decks for any subject and topic",
      "Edit every card and add images",
      "Primary 1 to SS 3, across science, arts and commercial subjects",
    ],
  },
  {
    file: "flashcards/facts.html",
    section: "studio",
    name: "Math Facts",
    title: "Maths Facts Flashcards: Times Tables & Number Bonds",
    desc: "Endless flashcard practice for multiplication, division, addition and subtraction facts. Pick an operation and the fact families you want and drill them.",
    intro:
      "Flashcards for number facts that never run out. Choose an operation and the fact families you want to work on, and the cards keep coming until the answers are automatic.",
    points: [
      "Multiplication and division tables",
      "Addition and subtraction facts",
      "Choose exactly which facts to drill",
    ],
  },

  /* ── Reading ───────────────────────────────────────────────────────── */
  {
    file: "editorials/index.html",
    section: "read",
    name: "Our Workshop",
    title: "Our Workshop: Maths & Science Workbooks You Work In",
    desc: "Not a shelf of PDFs. Every workbook here builds its own exercises, fresh each time, with an answer key — work them on screen and they mark as you go, or print them for paper.",
    intro:
      "Our Workshop is where the workbooks are made. Nothing here is a finished file waiting to be downloaded: every book writes its own exercises, new ones every time it is opened, and an answer key with them. Work a book on screen and it marks you as you go; print it when you want paper.",
    points: [
      "Maths, Geometry, Algebra and Statistics workbooks",
      "Mental Maths and Competition Word Problems",
      "A JavaScript workbook with a code editor on the page",
      "Worked on screen and marked, or printed with an answer key",
    ],
    access: "free",
    priority: "0.7",
  },
  {
    file: "blogs/index.html",
    section: "read",
    name: "Science Articles",
    title: "Science Articles for Students: Animals, Plants & the Human Body",
    desc: "Short, illustrated science articles for primary and secondary students: remarkable animals, plants and the human body, each written to a class level.",
    intro:
      "Science reading for curious students. Every article takes one remarkable thing, an animal, a plant or a part of the body, and explains the biology behind it at a level marked for primary, junior or senior secondary.",
    points: [
      "Animal biology: behaviour, adaptation and survival",
      "Plant science",
      "Written to a class level, from primary to SS 3",
    ],
    access: "free",
    priority: "0.7",
  },
];
