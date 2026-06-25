/* =========================================
   NAV CONFIG – PURE DATA
   -----------------------------------------
   Icons reference the shared custom icon set in `nav-icons.js` (sticker
   style). To swap an icon, change the `I.<name>` reference here; to change
   how an icon is drawn, edit `nav-icons.js`. The big right-hand `image`
   illustrations are per-section "scenes" drawn entirely from theme tokens,
   so they re-tint automatically with the active (light/dark) theme.
   ========================================= */

import { NAV_ICONS as I } from "/utils/components/nav-icons.js";

const NAV_CONFIG = [
  /* =========================
      EXAMS
  ========================= */
  {
    text: "Exams",
    icon: I.exams,

    image: `
    <svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" fill="none">
      <ellipse cx="300" cy="291" rx="180" ry="15" fill="var(--ink)" opacity="0.06"/>
      <!-- tilted back card -->
      <rect x="214" y="64" width="176" height="196" rx="20" fill="var(--accent-secondary)" opacity="0.3" transform="rotate(7 300 162)"/>
      <!-- exam paper with a coloured header -->
      <rect x="206" y="52" width="188" height="200" rx="20" fill="#fff"/>
      <path d="M206 72a20 20 0 0 1 20-20h148a20 20 0 0 1 20 20v20H206z" fill="var(--accent-secondary)"/>
      <rect x="230" y="116" width="120" height="12" rx="6" fill="var(--text-tertiary)" opacity="0.5"/>
      <rect x="230" y="144" width="140" height="12" rx="6" fill="var(--text-tertiary)" opacity="0.4"/>
      <rect x="230" y="172" width="100" height="12" rx="6" fill="var(--text-tertiary)" opacity="0.4"/>
      <!-- check badge -->
      <circle cx="356" cy="206" r="32" fill="var(--accent-success)"/>
      <path d="M343 206l9 9 17-19" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- gold star medal -->
      <path d="M150 108l11 22 24 3.5-17.5 17 4 24L150 201l-21.5 11.5 4-24-17.5-17 24-3.5z" fill="var(--accent-primary)"/>
      <circle cx="150" cy="133" r="9" fill="#fff" opacity="0.9"/>
      <!-- pencil -->
      <g transform="rotate(40 120 232)">
        <rect x="60" y="223" width="118" height="18" rx="9" fill="var(--accent-warning)"/>
        <rect x="60" y="223" width="24" height="18" rx="9" fill="var(--accent-danger)"/>
        <path d="M178 223l22 9-22 9z" fill="#fff"/>
        <path d="M193 229.5l7 2.5-7 2.5z" fill="var(--ink)"/>
      </g>
    </svg>`,

    description: "Ace every test",

    children: [
      {
        text: "Nigerian",
        icon: I.national,
        description: "Original, exam-style CBT",
        children: [
          { text: "Common Entrance style", href: "/exam-archive/national/exams/index.html", description: "Junior-secondary entrance practice" },
          { text: "UTME-style", href: "/exam-archive/national/exams/index.html", description: "University matriculation practice" },
          { text: "WASSCE-style", href: "/exam-archive/national/exams/index.html", description: "Senior-school certificate practice" },
          { text: "Post-UTME style", href: "/exam-archive/national/exams/index.html?cat=national", description: "University screening practice" },
        ],
      },
      {
        text: "International",
        icon: I.international,
        description: "Original, exam-style CBT",
        children: [
          { text: "SAT-style", href: "/exam-archive/national/exams/index.html?cat=international", description: "US college-admissions practice" },
          { text: "IGCSE-style", href: "/exam-archive/national/exams/index.html?cat=international", description: "International GCSE practice" },
          { text: "A-Level-style", href: "/exam-archive/national/exams/index.html?cat=international", description: "Advanced-level practice" },
        ],
      },
      {
        text: "Practice",
        icon: I.tools,
        description: "Mixed revision bank — not exam-specific",
        children: [
          { text: "Practice questions", href: "/exam-archive/national/exams/index.html?cat=practice", description: "All subjects, mixed difficulty" },
        ],
      },
    ],
  },

  /* =========================
      BLOGS
  ========================= */
  {
    text: "Blogs",
    icon: I.blogs,

    image: `
    <svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" fill="none">
      <ellipse cx="300" cy="292" rx="195" ry="15" fill="var(--ink)" opacity="0.06"/>
      <!-- page -->
      <rect x="120" y="86" width="360" height="168" rx="22" fill="#fff"/>
      <rect x="294" y="86" width="12" height="168" fill="var(--accent-secondary)" opacity="0.22"/>
      <!-- left column of text -->
      <rect x="150" y="116" width="110" height="12" rx="6" fill="var(--accent-secondary)" opacity="0.7"/>
      <rect x="150" y="144" width="120" height="10" rx="5" fill="var(--text-tertiary)" opacity="0.4"/>
      <rect x="150" y="166" width="104" height="10" rx="5" fill="var(--text-tertiary)" opacity="0.4"/>
      <rect x="150" y="188" width="118" height="10" rx="5" fill="var(--text-tertiary)" opacity="0.4"/>
      <!-- right column: a little framed picture -->
      <rect x="330" y="116" width="120" height="74" rx="14" fill="var(--accent-primary)" opacity="0.5"/>
      <circle cx="352" cy="150" r="11" fill="#fff" opacity="0.75"/>
      <path d="M330 190v-12l20-18 16 13 14-11 12 10v18z" fill="var(--accent-success)" opacity="0.6"/>
      <rect x="330" y="202" width="118" height="10" rx="5" fill="var(--text-tertiary)" opacity="0.4"/>
      <!-- chat bubble -->
      <g>
        <rect x="372" y="40" width="128" height="64" rx="20" fill="var(--accent-danger)"/>
        <path d="M404 102v24l24-24z" fill="var(--accent-danger)"/>
        <circle cx="408" cy="72" r="6" fill="#fff"/>
        <circle cx="436" cy="72" r="6" fill="#fff"/>
        <circle cx="464" cy="72" r="6" fill="#fff"/>
      </g>
    </svg>`,

    description: "Learn with stories",

    children: [
      {
        text: "Science",
        icon: I.science,
        description: "Science made fun",
        children: [
          { text: "Animal Biology Articles", href: "/blogs/index.html?s=animal", description: "Discover amazing creatures" },
          { text: "Plant Science Articles", href: "/blogs/index.html?s=plants", description: "Explore green wonders" },
          { text: "Human Body Facts", href: "/blogs/index.html?s=human-body", description: "Know your body" },
        ],
      },
      {
        text: "Math",
        icon: I.math,
        description: "Numbers made easy",
        children: [
          { text: "Math Tricks", href: "#math-tricks", description: "Quick calculation tips" },
        ],
      },
    ],
  },

  /* =========================
      ACTIVITIES
  ========================= */
  {
    text: "Activities",
    icon: I.activities,

    image: `
    <svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" fill="none">
      <ellipse cx="300" cy="286" rx="175" ry="16" fill="var(--ink)" opacity="0.06"/>
      <g transform="rotate(-8 300 172)">
        <!-- gamepad body -->
        <path d="M196 120h208a56 56 0 0 1 55 45l9 46a30 30 0 0 1-55 21l-15-22H202l-15 22a30 30 0 0 1-55-21l9-46a56 56 0 0 1 55-45z" fill="var(--accent-secondary)"/>
        <!-- d-pad -->
        <rect x="214" y="168" width="56" height="18" rx="9" fill="#fff"/>
        <rect x="233" y="149" width="18" height="56" rx="9" fill="#fff"/>
        <!-- action buttons -->
        <circle cx="362" cy="158" r="15" fill="var(--accent-danger)"/>
        <circle cx="398" cy="186" r="15" fill="var(--accent-primary)"/>
        <circle cx="326" cy="186" r="15" fill="#fff"/>
      </g>
      <!-- sparkles -->
      <path d="M120 70l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" fill="var(--accent-primary)"/>
      <path d="M474 58l5 11 11 5-11 5-5 11-5-11-11-5 11-5z" fill="var(--accent-warning)"/>
    </svg>`,

    description: "Play, learn, grow",

    children: [
      {
        text: "Prep-Math Games",
        icon: I.games,
        description: "Math practice games",
        children: [
          { text: "Free Throw", href: "/home/games/free-throw/index.html", description: "Aim, shoot, and score" },
          { text: "Alien Angle", href: "/home/games/aliens/index.html", description: "Read the angle, aim the cannon, fire" },
          { text: "Snakes & Ladders", href: "/home/games/snakes-ladders/index.html", description: "Roll, climb, and slide" },
          { text: "Rubik's Cube", href: "/home/games/rubiks-cube/index.html", description: "Twist, turn, and solve in 3D" },
          { text: "Grand Chess", href: "/home/games/chess/index.html", description: "Realistic 3D chess with full rules" },
          { text: "3D Maze", href: "/home/games/maze/index.html", description: "Escape a 3D maze in first person" },
        ],
      },
      {
        text: "Prep-Math Activities",
        icon: I.shapes,
        description: "Hands-on math practice",
        children: [
          { text: "Algebra Lab", href: "/prep-math/drag/index.html", description: "Drag-and-drop equation solving" },
          { text: "Equivalent Fractions", href: "/prep-math/activity/equivalent-fractions/index.html", description: "Visualize fraction equivalence" },
          { text: "Polygon Angles", href: "/prep-math/activity/polygon-angles/index.html", description: "Explore angle rules and sums" },
          { text: "Surface Area", href: "/prep-math/activity/surface-area/index.html", description: "Calculate area on 3D shapes" },
          { text: "Transversals", href: "/prep-math/activity/transversals/index.html", description: "Learn parallel lines and angles" },
          { text: "Cartesian Art", href: "/prep-math/activity/cartesian-art/index.html", description: "Plot points to draw, then paint" },
        ],
      },
      {
        text: "Learning Tools",
        icon: I.tools,
        description: "Smart study helpers",
        children: [
          { text: "Writing Evaluator", href: "/writing/index.html", description: "Grade essays with red pen feedback" },
          { text: "Theory Practice", href: "/theory-page/index.html", description: "AI-marked theory & essay questions" },
          { text: "AI Flashcards", href: "#flashcards", description: "Remember everything fast" },
        ],
      },
    ],
  },

  /* =========================
      EDITORIALS  (admin-only)
      A single, direct link — hidden from the nav unless the designated admin
      is signed in. See `adminOnly` handling in nav-builder.js and the
      `.admin-only` rules in nav.css.
  ========================= */
  {
    text: "Editorials",
    href: "/editorials/index.html",
    adminOnly: true,
    icon: I.editorial,
    description: "The digital magazine edition",
  },
];

export default NAV_CONFIG;
