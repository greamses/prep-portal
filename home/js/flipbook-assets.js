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
  { city: "Lagos",        note: "Where it began" },
  { city: "Abuja",        note: "Capital cohort" },
  { city: "Port Harcourt",note: "Garden City scholars" },
  { city: "Kano",         note: "Northern network" },
  { city: "Ibadan",       note: "Ancient city, modern prep" },
  { city: "Enugu",        note: "Coal City crew" },
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
