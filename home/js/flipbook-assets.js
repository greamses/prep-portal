// ============================================================================
// MAGAZINE ASSETS — all imagery & media links in ONE place for easy updating.
// Swap any `src` below to change a photo. Each image has a `fallback` that is
// used automatically if the primary link ever fails to load.
// ============================================================================

// Helpers build the final URLs so the list below stays short & editable.
const U = (id, w = 1300) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const P = (seed, w = 900, h = 1200) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const pic = (id, seed, alt, w) => ({ src: U(id, w), fallback: P(seed), alt });

// ── Featured video (resolved at runtime from /api/youtube/featured; this is
//    only the fallback shown if the API is unconfigured/unreachable) ──────────
export const VIDEO = {
  id: "M7lc1UVf-VE",
  title: "Inside Prep Portal — a day in the life",
  poster: U("photo-1522202176988-66273c2fd55f", 1300),
};

// ── Photography ─────────────────────────────────────────────────────────────
export const IMG = {
  cover:    pic("photo-1523240795612-9a054b0db644", "pp-cover", "Students learning together", 1500),
  back:     pic("photo-1503676260728-1c00da094a0b", "pp-back", "Study desk at golden hour", 1500),

  // Contents page — three small thumbnails
  contents: [
    pic("photo-1456513080510-7bf3a84b82f8", "pp-c1", "Reading by the window"),
    pic("photo-1513258496099-48168024aec0", "pp-c2", "A stack of books"),
    pic("photo-1434030216411-0b793f4b4173", "pp-c3", "Writing in a notebook"),
  ],

  // Editor's note — three small thumbnails
  editor: [
    pic("photo-1497633762265-9d179a990aa6", "pp-e1", "Open notebook"),
    pic("photo-1488190211105-8b0e65b80b4e", "pp-e2", "Laptop and coffee"),
    pic("photo-1531545514256-b1400bc00f31", "pp-e3", "Students collaborating"),
  ],

  who:   pic("photo-1522071820081-009f0129c71c", "pp-who", "The team at work", 1200),
  story: pic("photo-1531545514256-b1400bc00f31", "pp-story", "Students collaborating", 1200),
  essay: pic("photo-1509062522246-3755977927d7", "pp-essay", "A bright classroom", 1600),

  mission: pic("photo-1488190211105-8b0e65b80b4e", "pp-mission", "Planning the work", 1200),
  day:     pic("photo-1524178232363-1fb2b075b655", "pp-day", "A tutoring session", 1600),
  quote:   pic("photo-1497633762265-9d179a990aa6", "pp-quote", "Notes and ideas", 1600),

  // What We Do — one lead photo per feature spread
  features: [
    pic("photo-1546410531-bb4caa6b424d", "pp-f1", "Practising on a laptop", 1200),
    pic("photo-1524178232363-1fb2b075b655", "pp-f2", "One-to-one tutoring", 1200),
    pic("photo-1513258496099-48168024aec0", "pp-f3", "A library of past papers", 1200),
    pic("photo-1531545514256-b1400bc00f31", "pp-f4", "A community of learners", 1200),
  ],

  // What We Do — editorial photo grid
  what: [
    pic("photo-1503676260728-1c00da094a0b", "pp-w1", "Focused practice session"),
    pic("photo-1427504494785-3a9ca7044f45", "pp-w2", "A lecture hall"),
    pic("photo-1546410531-bb4caa6b424d", "pp-w3", "Sitting an exam"),
    pic("photo-1524178232363-1fb2b075b655", "pp-w4", "One-to-one tutoring"),
  ],

  // Closing gallery
  gallery: [
    pic("photo-1497486751825-1233686d5d80", "pp-g1", "Notebook and coffee"),
    pic("photo-1513475382585-d06e58bcb0e0", "pp-g2", "Quiet study corner"),
    pic("photo-1522202176988-66273c2fd55f", "pp-g3", "Friends studying together"),
    pic("photo-1456513080510-7bf3a84b82f8", "pp-g4", "Reading a book"),
  ],

  // Second gallery spread
  gallery2: [
    pic("photo-1434030216411-0b793f4b4173", "pp-h1", "Writing in a notebook"),
    pic("photo-1427504494785-3a9ca7044f45", "pp-h2", "Inside a lecture hall"),
    pic("photo-1500648767791-00dcc994a43e", "pp-h3", "A confident student"),
    pic("photo-1509062522246-3755977927d7", "pp-h4", "A bright classroom"),
  ],
};

// ── The flagship magazine edition (homepage) ─────────────────────────────────
// The homepage "Who We Are & What We Do" issue. `kind: "magazine"` selects the
// editorial page set; the yearbooks below use `kind: "yearbook"` instead.
export const DEFAULT_EDITION = {
  kind: "magazine",
  id: "portal-2026",
  volume: "Vol. I",
  year: "2026",
  yearShort: "2026",
  sub: "Who We Are &amp; What We Do",
  editionName: "The Portal Edition",
  blurb: "The flagship issue — who we are, what we do and who we do it for.",
  meta: ["25 Pages", "Digital Edition", "Featuring Video"],
  cover: IMG.cover,
  back: IMG.back,
};

// ── Yearbooks ────────────────────────────────────────────────────────────────
// A real school yearbook: a cover, the Head's foreword, then the graduating
// SETS — each shown by its nice name (never the class name) with a portrait
// grid of every graduand. The three sets are the leavers of Nursery 3, Grade 6
// and SS 3, styled as Early Years, Primary and Senior School.

// Name pools used to generate the (placeholder) graduand rosters. Swap the
// generated `students` arrays for real names + photos when available.
const FIRST_GIRL = [
  "Amina", "Ngozi", "Funke", "Chioma", "Aisha", "Zainab", "Bisi", "Adaeze",
  "Halima", "Yetunde", "Nneka", "Folake", "Temiloluwa", "Ifeoma", "Sade",
  "Maryam", "Blessing", "Chiamaka", "Damilola", "Hauwa", "Oluwaseun", "Ronke",
  "Ezinne", "Fatima",
];
const FIRST_BOY = [
  "Chidi", "Tunde", "Emeka", "Ifeanyi", "Babatunde", "Sani", "Musa", "Kunle",
  "Obinna", "Yusuf", "Segun", "Uchechukwu", "Adewale", "Femi", "Nnamdi",
  "Kelechi", "Tobiloba", "Dayo", "Ibrahim", "Chinedu", "Olumide", "Abdul",
  "Ekene", "Gbenga",
];
const SURNAMES = [
  "Okafor", "Adeyemi", "Bello", "Okonkwo", "Eze", "Abubakar", "Balogun",
  "Nwosu", "Ogunleye", "Ibrahim", "Olawale", "Mohammed", "Chukwu", "Adebayo",
  "Okeke", "Lawal", "Obi", "Danjuma", "Afolabi", "Uzochukwu", "Aliyu",
  "Onyeka", "Bamidele", "Nwachukwu",
];

// Deterministic so every (year, set) gets a distinct but stable roster.
function makeStudent(i, seed) {
  const girl = (seed + i) % 2 === 0;
  const firsts = girl ? FIRST_GIRL : FIRST_BOY;
  const first = firsts[(seed * 7 + i * 5) % firsts.length];
  const last = SURNAMES[(seed * 3 + i * 11) % SURNAMES.length];
  const num = (seed * 17 + i * 23) % 100;
  const folder = girl ? "women" : "men";
  const name = `${first} ${last}`;
  return {
    name,
    portrait: {
      src: `https://randomuser.me/api/portraits/${folder}/${num}.jpg`,
      fallback: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&size=256&background=ece7dc&color=1b1a17&bold=true&length=2`,
      alt: name,
    },
  };
}
const roster = (seed, count) =>
  Array.from({ length: count }, (_, i) => makeStudent(i, seed));

// The three graduating sets — shared identities, fresh faces each year.
function setsFor(seed) {
  return [
    {
      stage: "Early Years",
      name: "The Sunbeams",
      note: "Our littlest graduands — first big steps and the brightest of smiles.",
      summary:
        "We came in shy and tiny, and somewhere between nap time, story corner and a hundred new friends, we grew brave. This was our very first big adventure — thank you for holding our little hands all the way.",
      photo: pic("photo-1456513080510-7bf3a84b82f8", "yb-sun", "Early years class", 1200),
      students: roster(seed + 1, 18),
    },
    {
      stage: "Primary",
      name: "The Trailblazers",
      note: "Six years of curiosity, courage and quiet, daily discovery.",
      summary:
        "Six years flew by in a blur of spelling tests, science fairs and best friends made for life. We arrived as little kids and we&rsquo;re leaving as a team that knows it can do hard things. Onward, together!",
      photo: pic("photo-1427504494785-3a9ca7044f45", "yb-trail", "Primary class", 1200),
      students: roster(seed + 2, 12),
    },
    {
      stage: "Senior School",
      name: "The Luminaries",
      note: "Ready, at last, to carry their light beyond our gates.",
      summary:
        "From nervous juniors to the seniors who led the way, we studied late, laughed harder, and slowly figured out who we wanted to be. We&rsquo;re ready now — and we&rsquo;ll carry this place with us wherever we go.",
      photo: pic("photo-1523240795612-9a054b0db644", "yb-lum", "Senior class", 1200),
      students: roster(seed + 3, 12),
    },
  ];
}

export const YEARBOOKS = [
  {
    kind: "yearbook",
    id: "yearbook-2023-24",
    volume: "Vol. I",
    year: "2023 / 24",
    yearShort: "2023–24",
    classOf: "2024",
    sub: "The Yearbook · Class of 2024",
    editionName: "Yearbook 2023/24",
    blurb: "Our founding graduands — the very first to walk the stage.",
    meta: ["The Sunbeams", "The Trailblazers", "The Luminaries"],
    themeClass: "yb-theme-coral",
    decor: "doodle",
    motif: "stars",
    cardStyle: "side",
    headName: "Mrs. Adaeze Okafor",
    foreword: [
      "To our very first graduating sets: you were brave enough to begin with us when we were still finding our feet, and you taught us as much as we ever taught you. Watching you cross this stage is the proudest moment of our young story.",
      "Carry the Sunbeams&rsquo; wonder, the Trailblazers&rsquo; daring and the Luminaries&rsquo; light wherever you go next. You will always be the class that started it all &mdash; and our doors will always be open to you.",
    ],
    signoff: "You were the first to believe in us. Go now and let the world see what we already know.",
    highlights: [
      ["Founders&rsquo; Day", "The morning we opened our gates &mdash; ribbon, rain and a hundred nervous, hopeful faces."],
      ["First Speech &amp; Prize", "Our inaugural prize-giving, where the Luminaries set a standard the school still measures itself against."],
      ["The Garden Project", "The Sunbeams planted a flame tree by the hall. It is taller than them now, and still growing."],
    ],
    highlightSet: "what",
    cover: pic("photo-1503676260728-1c00da094a0b", "yb1", "Graduation morning", 1500),
    back: pic("photo-1497486751825-1233686d5d80", "yb1b", "A quiet desk", 1500),
    cohorts: setsFor(2024),
  },
  {
    kind: "yearbook",
    id: "yearbook-2024-25",
    volume: "Vol. II",
    year: "2024 / 25",
    yearShort: "2024–25",
    classOf: "2025",
    sub: "The Yearbook · Class of 2025",
    editionName: "Yearbook 2024/25",
    blurb: "The year our sets grew, stretched and truly found their stride.",
    meta: ["The Sunbeams", "The Trailblazers", "The Luminaries"],
    themeClass: "yb-theme-citrus",
    decor: "paint",
    motif: "waves",
    cardStyle: "beneath",
    headName: "Dr. Ibrahim Bello",
    foreword: [
      "This was the year we found our stride. The Sunbeams filled the corridors with song, the Trailblazers carried home their first national trophies, and the Luminaries proved that ambition and kindness can walk hand in hand.",
      "As you leave us, remember that every result on these pages began with a single, ordinary act of effort, repeated. Keep repeating it. We cannot wait to read the next chapter you write &mdash; and to welcome you home to tell it.",
    ],
    signoff: "You grew into yourselves this year. Now go and grow into the world.",
    highlights: [
      ["National Finals", "The Trailblazers&rsquo; quiz team brought home silver &mdash; and the loudest assembly we have ever held."],
      ["Mentor Mornings", "Senior Luminaries began coaching the juniors &mdash; a tradition that has quietly become our heartbeat."],
      ["The Arts Festival", "A week of music, masks and murals that turned the whole school into a stage."],
    ],
    highlightSet: "gallery",
    cover: pic("photo-1509062522246-3755977927d7", "yb2", "A bright classroom", 1500),
    back: pic("photo-1456513080510-7bf3a84b82f8", "yb2b", "Reading by the window", 1500),
    cohorts: setsFor(2025),
  },
  {
    kind: "yearbook",
    id: "yearbook-2025-26",
    volume: "Vol. III",
    year: "2025 / 26",
    yearShort: "2025–26",
    classOf: "2026",
    sub: "The Yearbook · Class of 2026",
    editionName: "Yearbook 2025/26",
    blurb: "A confident, far-reaching set ready for whatever comes next.",
    meta: ["The Sunbeams", "The Trailblazers", "The Luminaries"],
    themeClass: "yb-theme-violet",
    decor: "doodle",
    motif: "loops",
    cardStyle: "side",
    headName: "Mr. Tunde Adeyemi",
    foreword: [
      "What a horizon you have brought into view. This set has reached further than any before it &mdash; new subjects, new cities, new dreams &mdash; without ever losing the warmth that makes this place home.",
      "Sunbeams, Trailblazers, Luminaries: you leave us braver than you found us. Go and meet the future on your own terms. And whenever you need a place that still believes in you, you know exactly where we are.",
    ],
    signoff: "The horizon is yours. Walk towards it boldly, and look back kindly.",
    highlights: [
      ["The Innovation Fair", "Robotics, recycled art and a solar oven that genuinely cooked &mdash; the Trailblazers do not do things by halves."],
      ["Outreach Week", "The Luminaries tutored across three communities, proving leadership is something you give away."],
      ["Sports Day", "A photo finish, a record broken, and a Sunbeam who finished last to the biggest cheer of all."],
    ],
    highlightSet: "gallery2",
    cover: pic("photo-1513475382585-d06e58bcb0e0", "yb3", "A quiet study corner", 1500),
    back: pic("photo-1522202176988-66273c2fd55f", "yb3b", "Friends studying together", 1500),
    cohorts: setsFor(2026),
  },
];

// ── Editorial copy data (kept here so words live beside the imagery) ──────────
// Headline stats for the "By the Numbers" page.
export const STATS = [
  { num: "50k+", label: "Learners guided across Nigeria" },
  { num: "1,200", label: "Matched tutors and mentors" },
  { num: "98%",  label: "Of parents would recommend us" },
  { num: "4",    label: "Exam tracks: JAMB, WAEC, NECO, IGCSE" },
];

// Cities for the "Our Reach" page.
export const REACH = [
  { city: "Lagos",        note: "Where it all began &mdash; our largest community of learners and tutors." },
  { city: "Abuja",        note: "A fast-growing capital cohort sitting JAMB, WAEC and IGCSE alike." },
  { city: "Port Harcourt",note: "Garden City scholars proving the model works far beyond Lagos." },
  { city: "Kano",         note: "A thriving northern network, tutoring in the subjects that matter most." },
  { city: "Ibadan",       note: "An ancient city of learning meets thoroughly modern preparation." },
  { city: "Enugu",        note: "A close-knit Coal City crew turning quiet effort into loud results." },
];

// ── Voices (testimonials) with portrait photos ──────────────────────────────
export const VOICES = [
  {
    portrait: pic("photo-1500648767791-00dcc994a43e", "pp-v1", "Chidi K.", 700),
    quote: "My son went from a D7 to an A1 in WAEC Mathematics. The weekly updates kept us in the loop the whole way.",
    name: "Chidi K.",
    role: "Parent — Surulere, Lagos",
  },
  {
    portrait: pic("photo-1494790108377-be9c29b29330", "pp-v2", "Amina Y.", 700),
    quote: "The video libraries simplified Chemistry in minutes. I scored three A*s and two As in my IGCSE finals.",
    name: "Amina Y.",
    role: "Student — Gwarinpa, Abuja",
  },
  {
    portrait: pic("photo-1507003211169-0a1dd7228f2d", "pp-v3", "Tunde O.", 700),
    quote: "I scored 342 in JAMB. The CBT practice felt exactly like the real UTME — nothing surprised me.",
    name: "Tunde O.",
    role: "Student — Port Harcourt",
  },
];
