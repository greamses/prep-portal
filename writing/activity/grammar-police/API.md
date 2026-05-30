# Grammar Police — Textbook API

Yes, the Grammar Police activity is **API-driven**. It is a digital flipbook
("textbook maker") whose content is authored as structured JSON on the server
and rendered client-side. There are three things to understand:

1. **The HTTP API** — three endpoints under `/api/grammar/*`.
2. **The content schema** — how a book/unit is authored (the "textbook maker").
3. **The render pipeline** — how the front end turns the JSON into pages.

---

## 1. HTTP API

Base URL convention (see `js/services/book-service.js`):

```js
const API_BASE = window.location.port === "5500"
  ? "http://127.0.0.1:5000"  // Live Server → local Express
  : "";                       // production → same-origin /api
```

Routes are defined in `server/routes/grammar.js` and mounted at `/api/grammar`.

### `GET /api/grammar/book` — public

Returns the full book content (the JSON in `server/content/grammarBook.js`).
Cached `public, max-age=3600`.

```bash
curl https://www.prepportal.com.ng/api/grammar/book
```

Response: the **Book object** (see §2).

> Offline fallback: the browser ships an auto-generated mirror at
> `js/data/book.fallback.js`. `loadBook()` uses it only when the API is
> unreachable. Regenerate it after editing content (see §4).

### `GET /api/grammar/video?topic=<text>` — public

Finds one English learning video for a topic. Runs **server-side** using the
app's `GEMINI_API_KEY` (plans the query) + `YOUTUBE_API_KEY` (search). No
sign-in needed. Cached `public, max-age=86400`.

```bash
curl "https://www.prepportal.com.ng/api/grammar/video?topic=they're%20their%20there"
```

Response (a video was found):
```json
{ "video": {
  "videoId": "abc123",
  "title": "They're / Their / There — English lesson",
  "channel": "Grammar Songs by Melissa",
  "thumb": "https://i.ytimg.com/…",
  "embedUrl": "https://www.youtube-nocookie.com/embed/abc123?rel=0&modestbranding=1"
} }
```

Response (no key / no match — fallback to a channel search link):
```json
{ "channel": "Grammar Songs by Melissa",
  "search": "https://www.youtube.com/@grammarsongsmelissa/search?query=…" }
```

### `POST /api/grammar/check` — authenticated (Firebase)

AI grammar/punctuation check on the student's own writing. Requires a Firebase
ID token: `Authorization: Bearer <token>`. Provider fallback chain Groq → Claude
→ Gemini (server keys). Max 4000 chars.

```bash
curl -X POST https://www.prepportal.com.ng/api/grammar/check \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"text":"me and my freind went too the shop"}'
```

Response:
```json
{
  "provider": "groq",
  "summary": "Good effort — a few confusables to fix.",
  "corrected": "My friend and I went to the shop.",
  "errors": [
    { "type": "confusable", "wrong": "too", "fix": "to", "why": "\"too\" means also; here you need \"to\"." }
  ]
}
```
`type` is one of: `confusable | punctuation | capital | spelling | agreement`.

### Server environment variables

| Var | Used by |
|-----|---------|
| `GEMINI_API_KEY` | `/video` (query planning), `/check` (Gemini fallback) |
| `YOUTUBE_API_KEY` | `/video` (search) |
| `GROQ_API_KEY` | `/check` (primary) |
| `ANTHROPIC_API_KEY` | `/check` (Claude fallback) |

---

## 2. Content schema — authoring a book

Edit `server/content/grammarBook.js` and export a **Book object**:

```js
module.exports = {
  meta:  { title, subtitle, edition, version },
  media: { cover, hero, video: { id, title } },   // Unsplash photo IDs + a video id
  wordGroups: { … },                              // dropdown option sets (grammar)
  units: [ … ],                                   // the chapters
};
```

### `wordGroups` (grammar dropdowns)

Each key maps a group name to the choices shown in a passage blank:

```js
wordGroups: {
  theyre: { options: ["they're", "their", "there"], label: "they're / their / there" },
  totwo:  { options: ["to", "too", "two"],          label: "to / too / two" },
  // …
}
```

### `units[]`

Every unit (grammar **or** punctuation) shares these fields:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | unique, e.g. `"u-theyre"` |
| `kind` | `"grammar"` \| `"punctuation"` | selects the practice type |
| `number` | number | display number |
| `color` | string | theme: `blue/green/purple/pink/orange/teal` (drives `gp-c-*`) |
| `title` | string | unit title |
| `focus` | string | one-line focus |
| `mainIdea` | string | shown in the "Main Idea" aside |
| `keyVocab` | `[{ term, def }]` | "Key Vocabulary" aside |
| `realWorld` | `{ title, text, image }` | photo-backed "Real-World Link" (`image` = Unsplash id) |
| `studyTip` | string | "Study Tip" aside |
| `hot` | `string[]` | "H.O.T. Problems" list |
| `lesson` | `{ leftHTML, rightHTML }` | teaching HTML (see classes below) |
| `teach` | string (HTML) | extra teaching HTML, flows after the lesson |
| `passage` | object | **grammar only** (see below) |
| `exercise` | object | **punctuation only** (see below) |

#### Grammar: `passage`

```js
passage: {
  id, title, focus,
  groups: ["theyre"],          // wordGroups used here
  paragraphs: [                 // array of "segments"
    "The students could not sit still. ",          // plain text
    { correct: "They're", group: "theyre" },        // a fill-in blank (dropdown)
    " going on a trip and ",
    { correct: "their", group: "theyre" },
    " bags were packed."
  ],
}
```
A **blank** is `{ correct, group }`: the dropdown shows `wordGroups[group].options`
and the right answer is `correct`.

#### Punctuation: `exercise`

```js
exercise: {
  id, title, focus,
  pool: ["?", "."],            // the marks the student can drag
  items: [                      // each item is an array of segments
    ["Is the sky blue", { correct: "?" }],
    ["She is ready", { correct: "." }]
  ],
}
```
A **slot** is `{ correct }`: the student drags a mark from `pool` into it;
`correct` is the expected mark.

#### Teaching HTML classes (`leftHTML` / `rightHTML` / `teach`)

Use these classes so the editorial styling applies (see `css/book-explanation.css`):
`exp-heading`, `exp-intro`, `exp-word-block exp-word-block--{blue|yellow|green}`,
`exp-word` (`exp-word--punct`), `exp-eq`, `exp-eg`, `exp-rule-summary`,
`exp-pairs-grid` → `exp-pair` (`exp-pair-a` / `exp-pair-sep` / `exp-pair-b`),
`exp-secret-box`, `exp-trick-box`, `exp-quicktest` → `exp-qt-row` / `exp-qt-q`,
`exp-test-rows` → `exp-test-row`. Keep blocks as separate top-level elements —
the renderer paginates by flowing those blocks across two columns.

---

## 3. Render pipeline (front end)

`js/main.js` → `ensureBook()` (via `book-service.loadBook()`) → `buildBookPages()`
in `js/ui/pages.js`, then StPageFlip drives the flip. Page order:

```
Front cover (hard) · Contents · How-to ·
  [per grammar unit]  Opener · Lesson(s) · Passage practice
  Crossword · Rebus · Section divider (soft)
  [per punctuation unit] Opener · Lesson(s) · Exercise practice
Check-my-writing (AI) · Back cover (hard)
```

Key behaviours:
- **Pagination**: lesson/practice content is measured offscreen at the real page
  size and flowed across two columns onto as many pages as needed (no overflow).
- **Covers are `hard` density; everything else is `soft`.** Do **not** make a
  mid-book page hard (e.g. the divider) — a hard page mid-book breaks the spread
  and makes pages split when flipping.
- **Video** (`js/ui/video.js`) and **AI checker** (`js/ui/checker.js`) call the
  endpoints above.
- Puzzle data (crossword + rebus) lives in `js/ui/puzzles.js` (client-side only).

---

## 4. Workflow: change content / add a unit

1. Edit `server/content/grammarBook.js` (add a unit to `units[]`, plus any new
   `wordGroups`).
2. Regenerate the offline mirror so Live Server / offline still works:
   ```bash
   node scripts/gen-book-fallback.js
   ```
3. The API serves the new content immediately on the next deploy; the browser
   picks it up via `GET /api/grammar/book` (no front-end rebuild needed).

---

## 5. Create ANOTHER book (reuse the engine)

The renderer is fully content-driven — it reads a `Book` object and draws pages.
So a brand-new book needs **no renderer changes**: author content, register it,
and point a page at it. The API is multi-book aware:

```
GET /api/grammar/book?book=<id>     # ?book omitted → the default grammar-police
```

### Step 1 — Author the content

Create `server/content/<yourBook>.js` exporting a `Book` object (same schema as
§2). Example `server/content/mathsMagic.js`:

```js
module.exports = {
  meta: { title: "Maths Magic", subtitle: "Number Patrol", edition: "Prep Portal Maths", version: 1 },
  media: { cover: "photo-…", hero: "photo-…", video: { id: "…", title: "…" } },
  wordGroups: {},                 // grammar dropdowns; {} if the book has none
  units: [ /* same unit shape as §2 */ ],
};
```

### Step 2 — Register it on the server

In `server/routes/grammar.js`, add one line to the `BOOKS` registry:

```js
const BOOKS = {
  "grammar-police": BOOK,
  "maths-magic": require("../content/mathsMagic"),   // ← add this
};
```

Now `GET /api/grammar/book?book=maths-magic` serves it. `/video` and `/check`
are book-agnostic and work as-is (note: `/video`'s channel list is tuned for
English — adjust `VIDEO_CHANNELS` if your book is another subject).

### Step 3 — Give it a page (reuse the front end)

The whole front end (`js/`, `css/`) is generic. Two ways to surface the new book:

**A. New instance page (recommended).** Create `writing/activity/maths-magic/`
with an `index.html` that is a copy of the grammar-police one, but set the book
id **before** `main.js` loads:

```html
<script>window.GP_BOOK_ID = "maths-magic";</script>
<script type="module" src="/writing/activity/grammar-police/js/main.js"></script>
```

Point the stylesheet/script `src`s at the shared `grammar-police/js` and
`grammar-police/css` (or copy them). `book-service.js` reads `window.GP_BOOK_ID`
and requests `/api/grammar/book?book=maths-magic`; everything else just works.

**B. Same page, switchable.** Set `window.GP_BOOK_ID` from a query param, e.g.
`?book=maths-magic`, in the existing page before `main.js` runs.

### Step 4 — Offline mirror (optional)

`book.fallback.js` mirrors only the default book (used when the API is
unreachable). For a second book either skip the offline fallback or generalise
`scripts/gen-book-fallback.js` to emit one mirror per registered book.

### What you DON'T touch

Covers (`cover.js`), page building/pagination (`pages.js`), grammar/punctuation
interactions, the crossword/rebus puzzles, the checker, and all CSS are shared
and content-agnostic — they render whatever `Book` object the API returns.
