/* =========================================================================
   PREP PORTAL — SITE MAP  (flat, searchable, AI-readable)
   -------------------------------------------------------------------------
   The mega nav (nav-config.js) is the curated *menu* — a tree shaped for
   dropdown rendering, with decorative SVG scenes attached. This file is the
   flat, load-light counterpart: every real page on the site as one entry
   with a title, URL, one-line blurb and search keywords. It exists so any
   feature that needs to "know the site" (right now: PrepBot's advertising
   and natural-language search — see utils/prepbot/prepbot.js) has one
   place to read from instead of hand-rolling its own partial route list.

   Entries mirror the copy in nav-config.js / toolbar.js / auth-icons.js
   where they overlap — keep wording in sync when those change.

   ▸ overview: true → included in the compact SITE_INFO summary sent to the
     AI on every turn (keep this set small — it is a token cost per message).
   ▸ role → omit for public/general pages; set to restrict from the default
     student-facing search ("admin", "partner").
========================================================================= */

export const SITE_INFO = {
  name: "Prep Portal",
  tagline: "AI-powered exam prep for Nigerian secondary school students",
  description:
    "Prep Portal helps students prepare for WAEC/WASSCE, NECO, UTME/JAMB, Common Entrance and Cambridge/IGCSE exams with original exam-style past-paper practice, interactive math and science activities, 3D virtual labs, an AI writing evaluator and theory-question marker, revision blogs, and a library of math learning games — all with PrepBot, an AI tutor built into every page.",
};

export const SITE_PAGES = [
  // ── Core ────────────────────────────────────────────────────────────
  {
    id: "home",
    title: "Home",
    href: "/",
    category: "core",
    overview: true,
    blurb: "Landing page — pick an exam track or explore any section.",
    keywords: ["home", "homepage", "main page", "start page", "landing page"],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard.html",
    category: "core",
    overview: true,
    blurb: "Personal home base after signing in — progress, classes, assignments and quick links. View adapts for students, parents, teachers and admins.",
    keywords: ["dashboard", "my account", "my dashboard", "my progress", "my classes", "my assignments"],
  },
  {
    id: "subscribe",
    title: "Subscription",
    href: "/subscribe.html",
    category: "core",
    overview: true,
    blurb: "Premium plans and tutoring add-ons — unlocks the virtual labs, writing evaluator, theory marking and more.",
    keywords: ["subscribe", "subscription", "premium", "upgrade", "pricing", "plans", "go premium", "tutoring", "cost", "how much"],
  },
  {
    id: "partner",
    title: "Partner Dashboard",
    href: "/partner.html",
    category: "core",
    role: "partner",
    blurb: "Referral/affiliate program — track commission earnings and payouts.",
    keywords: ["partner", "affiliate", "referral", "commission", "earnings", "payout"],
  },

  // ── Exams ───────────────────────────────────────────────────────────
  {
    id: "exams-national",
    title: "Nigerian Exams",
    href: "/exam-archive/national/exams/index.html",
    category: "exams",
    overview: true,
    blurb: "Original, exam-style CBT practice for Common Entrance, WASSCE/WAEC, UTME/JAMB and Post-UTME.",
    keywords: ["waec", "wassce", "neco", "ssce", "jamb", "utme", "post-utme", "common entrance", "senior school", "national exam", "national exams"],
  },
  {
    id: "exams-international",
    title: "International Exams",
    href: "/exam-archive/national/exams/index.html?cat=international",
    category: "exams",
    blurb: "SAT-, IGCSE- and A-Level-style practice.",
    keywords: ["sat", "igcse", "cambridge", "a-level", "alevel", "international exam", "international exams"],
  },
  {
    id: "exams-competitions",
    title: "Competitions",
    href: "/exam-archive/national/exams/index.html?cat=competition",
    category: "exams",
    blurb: "Math olympiad / competition-style past papers (ANMC, Scholastic and similar).",
    keywords: ["anmc", "competition", "competitions", "math contest", "olympiad", "scholastic"],
  },
  {
    id: "exams-practice",
    title: "Practice Bank",
    href: "/exam-archive/national/exams/index.html?cat=practice",
    category: "exams",
    blurb: "Mixed revision bank, all subjects, not tied to one exam.",
    keywords: ["practice questions", "revision bank", "mixed practice"],
  },
  {
    id: "theory-practice",
    title: "Theory Practice",
    href: "/theory-page/index.html",
    category: "exams",
    overview: true,
    blurb: "AI-marked theory & essay exam questions with model-answer guidance.",
    keywords: ["theory", "theory practice", "essay questions", "long answer", "structured answer", "mark scheme"],
  },
  {
    id: "drills",
    title: "Times-Tables Drills",
    href: "/exam-archive/national/drills/index.html",
    category: "exams",
    blurb: "Timed multiplayer multiplication & division drills — race friends or bots to the most correct answers.",
    keywords: ["drills", "times tables", "multiplication drill", "division drill", "multiplayer math", "versus", "1v1", "speed math", "timed practice"],
  },
  {
    id: "puzzles",
    title: "Puzzles — Sudoku",
    href: "/exam-archive/national/puzzles/index.html",
    category: "exams",
    blurb: "Timed multiplayer Sudoku — race friends or bots to correctly fill the most cells before time runs out.",
    keywords: ["puzzles", "sudoku", "logic puzzle", "multiplayer sudoku", "versus", "1v1", "brain teaser", "timed puzzle"],
  },
  {
    id: "geometry",
    title: "Geometry — Perimeter & Circumference",
    href: "/exam-archive/national/geometry/index.html",
    category: "exams",
    blurb: "Timed multiplayer perimeter/circumference drills — circle, semicircle, quadrant, sector, triangle, rectangle, square. Pi = 22/7.",
    keywords: ["geometry", "perimeter", "circumference", "circle", "triangle", "rectangle", "square", "sector", "multiplayer math", "versus", "1v1", "timed practice"],
  },
  {
    id: "vocab",
    title: "Vocab — A to Z Hangman",
    href: "/exam-archive/national/vocab/index.html",
    category: "exams",
    blurb: "Science & maths vocabulary hangman played straight through the alphabet — read the clue, you get the first letter, guess the rest. Multiplayer or 1v1.",
    keywords: ["vocab", "vocabulary", "hangman", "spelling", "word game", "definitions", "science words", "maths words", "multiplayer", "versus", "1v1", "alphabet"],
  },

  // ── Math & science activities ──────────────────────────────────────
  {
    id: "math-activities",
    title: "Prep-Math Activities",
    href: "/prep-math/activity/index.html",
    category: "math",
    overview: true,
    blurb: "Hub of hands-on math activities: fractions, angles, surface area, transversals and Cartesian art.",
    keywords: ["math activities", "math hub", "prep math", "prep-math"],
  },
  { id: "algebra-lab", title: "Algebra Lab", href: "/prep-math/drag/index.html", category: "math", blurb: "Drag-and-drop equation solving.", keywords: ["algebra lab", "drag and drop", "solve equations"] },
  { id: "equivalent-fractions", title: "Equivalent Fractions", href: "/prep-math/activity/equivalent-fractions/index.html", category: "math", blurb: "Visualize fraction equivalence.", keywords: ["equivalent fractions", "fractions"] },
  { id: "polygon-angles", title: "Polygon Angles", href: "/prep-math/activity/polygon-angles/index.html", category: "math", blurb: "Explore angle rules and sums.", keywords: ["polygon angles", "polygon", "angle sum", "geometry"] },
  { id: "surface-area", title: "Surface Area", href: "/prep-math/activity/surface-area/index.html", category: "math", blurb: "Calculate surface area on 3D shapes.", keywords: ["surface area", "3d shapes", "volume"] },
  { id: "transversals", title: "Transversals", href: "/prep-math/activity/transversals/index.html", category: "math", blurb: "Learn parallel lines and angles.", keywords: ["transversals", "parallel lines"] },
  { id: "cartesian-art", title: "Cartesian Art", href: "/prep-math/activity/cartesian-art/index.html", category: "math", blurb: "Plot points on a coordinate plane to draw, then paint, a picture.", keywords: ["cartesian art", "coordinate plane", "plotting points", "graph art"] },
  { id: "graphing", title: "Function Grapher", href: "/prep-math/graphing/index.html", category: "math", blurb: "Interactive function grapher and calculator.", keywords: ["graphing", "grapher", "plot a function", "graphing calculator"] },
  { id: "manim-lab", title: "Manim Lab", href: "/prep-math/manim-lab/index.html", category: "math", blurb: "Animated math concept explainer videos.", keywords: ["manim", "animation", "explainer video"] },
  {
    id: "virtual-lab",
    title: "Virtual Lab",
    href: "/virtual-lab/index.html",
    category: "science",
    overview: true,
    blurb: "3D virtual science lab — chemistry, biology and physics, first- or third-person.",
    keywords: ["virtual lab", "science lab", "3d lab"],
  },
  { id: "virtual-lab-chemistry", title: "Virtual Chemistry Lab", href: "/virtual-lab/chemistry/index.html", category: "science", blurb: "Mix reagents and run experiments in 3D.", keywords: ["chemistry lab", "chemistry", "reagents", "mix chemicals", "experiment"] },
  { id: "virtual-lab-biology", title: "Virtual Biology Lab", href: "/virtual-lab/biology/index.html", category: "science", blurb: "3D biology lab.", keywords: ["biology lab", "biology"] },
  { id: "virtual-lab-physics", title: "Virtual Physics Lab", href: "/virtual-lab/physics/index.html", category: "science", blurb: "3D physics lab.", keywords: ["physics lab", "physics"] },

  // ── Writing ─────────────────────────────────────────────────────────
  {
    id: "writing-evaluator",
    title: "Writing Evaluator",
    href: "/writing/index.html",
    category: "writing",
    overview: true,
    blurb: "AI writing evaluator — submit an essay or composition for scoring and red-pen feedback.",
    keywords: ["writing evaluator", "essay grader", "grade my essay", "composition", "marking my writing"],
  },
  { id: "writing-trainer", title: "Writing Trainer", href: "/writing/trainer.html", category: "writing", blurb: "Guided writing practice.", keywords: ["writing trainer", "writing practice"] },
  { id: "grammar-police", title: "Grammar Police", href: "/writing/activity/grammar-police/index.html", category: "writing", blurb: "Catch grammar mistakes in a fast-paced game.", keywords: ["grammar police", "grammar game", "grammar correction", "fix the grammar"] },

  // ── Reading ─────────────────────────────────────────────────────────
  {
    id: "blogs",
    title: "Blogs",
    href: "/blogs/index.html",
    category: "reading",
    overview: true,
    blurb: "Bite-sized study articles — Animal Biology, Plant Science and more.",
    keywords: ["blog", "blogs", "articles", "stories"],
  },
  { id: "blogs-animal", title: "Animal Biology Articles", href: "/blogs/index.html?s=animal", category: "reading", blurb: "Discover amazing creatures.", keywords: ["animal biology", "animals", "wildlife"] },
  { id: "blogs-plants", title: "Plant Science Articles", href: "/blogs/index.html?s=plants", category: "reading", blurb: "Explore green wonders.", keywords: ["plant science", "plants", "botany"] },
  { id: "blogs-human-body", title: "Human Body Facts", href: "/blogs/index.html?s=human-body", category: "reading", blurb: "Know your body.", keywords: ["human body", "anatomy"] },

  // ── Games (math learning games) ─────────────────────────────────────
  { id: "game-free-throw", title: "Free Throw", href: "/home/games/free-throw/index.html", category: "games", blurb: "Aim, shoot and score — a basketball math game.", keywords: ["free throw", "basketball game"] },
  { id: "game-aliens", title: "Alien Angle", href: "/home/games/aliens/index.html", category: "games", blurb: "Read the angle, aim the cannon, fire.", keywords: ["alien angle", "angles game", "aim cannon"] },
  { id: "game-snakes-ladders", title: "Snakes & Ladders", href: "/home/games/snakes-ladders/index.html", category: "games", blurb: "Roll, climb and slide.", keywords: ["snakes and ladders", "snakes ladders", "board game"] },
  { id: "game-rubiks-cube", title: "Speed Cube", href: "/home/games/rubiks-cube/index.html", category: "games", blurb: "Twist, turn and solve in 3D.", keywords: ["speed cube", "rubik's cube", "rubiks cube", "cube puzzle"] },
  { id: "game-chess", title: "Grand Chess", href: "/home/games/chess/index.html", category: "games", blurb: "Realistic 3D chess with full rules.", keywords: ["chess", "3d chess"] },
  { id: "game-maze", title: "3D Maze", href: "/home/games/maze/index.html", category: "games", blurb: "Escape a 3D maze in first person.", keywords: ["maze", "3d maze", "escape the maze"] },
  { id: "game-drone", title: "Bearing Courier", href: "/home/games/drone/index.html", category: "games", blurb: "Fly a delivery drone by compass bearing.", keywords: ["bearing courier", "drone game", "compass bearing"] },
  { id: "game-crossmath", title: "CrossMath", href: "/home/games/crossmath/index.html", category: "games", blurb: "Crossword-style arithmetic puzzle.", keywords: ["crossmath", "cross math", "math crossword"] },
  { id: "game-flip", title: "Flip", href: "/home/games/flip/index.html", category: "games", blurb: "Memory-match card game.", keywords: ["flip game", "memory game", "card match"] },
  { id: "game-slide", title: "Slide", href: "/home/games/slide/game.html", category: "games", blurb: "Sliding tile puzzle.", keywords: ["slide game", "sliding puzzle"] },
  { id: "game-block", title: "Block", href: "/home/games/block/tetris.html", category: "games", blurb: "Falling-block stacking game.", keywords: ["block game", "tetris"] },
  { id: "game-flappy-addition", title: "Flappy Bird — Addition", href: "/home/games/flappy-bird/flappy-bird-addition/index.html", category: "games", blurb: "Flappy Bird with addition facts.", keywords: ["flappy bird addition", "addition game"] },
  { id: "game-flappy-subtraction", title: "Flappy Bird — Subtraction", href: "/home/games/flappy-bird/flappy-bird-subtraction/index.html", category: "games", blurb: "Flappy Bird with subtraction facts.", keywords: ["flappy bird subtraction", "subtraction game"] },
  { id: "game-flappy-multiplication", title: "Flappy Bird — Multiplication", href: "/home/games/flappy-bird/flappy-bird-multiplication/index.html", category: "games", blurb: "Flappy Bird with multiplication facts.", keywords: ["flappy bird multiplication", "multiplication game", "times tables"] },
  { id: "game-flappy-division", title: "Flappy Bird — Division", href: "/home/games/flappy-bird/flappy-bird-division/index.html", category: "games", blurb: "Flappy Bird with division facts.", keywords: ["flappy bird division", "division game"] },
];

/* ── Compact overview for the AI system prompt ──
   Small and stable on purpose — every line here is a token cost paid on
   every PrepBot turn. Detailed/long-tail pages are looked up on demand via
   searchSitePages() instead of being sent up front. */
export function siteOverviewForPrompt() {
  const lines = SITE_PAGES.filter((p) => p.overview).map((p) => `- ${p.title} (${p.href}) — ${p.blurb}`);
  return `${SITE_INFO.name} — ${SITE_INFO.description}\n\nMain sections:\n${lines.join("\n")}`;
}

/* ── Keyword search over the full map ──
   Used both for exact "go to X" navigation commands and for grounding
   free-form "where can I find X" questions before/instead of an AI call. */
export function searchSitePages(query, { limit = 3, includeRoles = [] } = {}) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];
  const scored = [];
  for (const page of SITE_PAGES) {
    if (page.role && !includeRoles.includes(page.role)) continue;
    let score = 0;
    for (const kw of page.keywords) {
      if (q === kw) score = Math.max(score, kw.length * 3);
      else if (q.includes(kw)) score = Math.max(score, kw.length * 2);
      else if (kw.includes(q) && q.length > 2) score = Math.max(score, q.length);
    }
    if (score > 0) scored.push({ page, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.page);
}

/* Longest single-keyword match — mirrors the old exact-command matcher so
   "take me to the math hub" resolves deterministically to one page. */
export function bestSitePageMatch(query, opts) {
  return searchSitePages(query, { ...opts, limit: 1 })[0] || null;
}
