/* ============================================================================
   HOME — what is actually inside
   ----------------------------------------------------------------------------
   Someone landing on the front page sees a hero, some faces and a price list,
   and leaves believing this is a tutoring sign-up. It is a workshop: balances
   you take weights off, trains you send numbers through, squares you build out
   of tiles, maps you drag states onto, workbooks that print.

   So: a wall of SNAPSHOTS. Each one is a small drawing of the thing itself —
   not a photograph, not an icon, but a little scene a person recognises when
   they get there — and the whole card is the link to it.

   Every snapshot is drawn from the site's own tokens, so it re-tints with the
   theme, and each is one function returning SVG: nothing to load, nothing to
   go missing, and a new card is one entry in the list below.
   ========================================================================== */

const INK = "var(--ink)";
const GOLD = "var(--accent-primary)";
const PAPER = "var(--accent-secondary)";
const LOUD = "var(--accent-danger)";
const LEAF = "var(--accent-success)";
const QUIET = "var(--text-tertiary)";

const frame = (body, tint) =>
  `<svg class="shot__art" viewBox="0 0 120 76" role="img" aria-hidden="true">` +
  `<rect x="0" y="0" width="120" height="76" rx="6" fill="${tint}" opacity="0.22"/>${body}</svg>`;

const r = (x, y, w, h, fill, rx = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const line = (x1, y1, x2, y2, col, w = 2.4) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
const dot = (cx, cy, rad, fill) => `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fill}"/>`;

/* ── the snapshots ───────────────────────────────────────────────────────── */

const ART = {
  /* a balance with a bag on one pan and weights on the other */
  balance: () => frame(
    line(20, 30, 100, 30, INK, 3) + line(60, 30, 60, 58, QUIET, 3) + r(46, 58, 28, 4, INK, 2) +
    line(20, 30, 20, 40, QUIET, 1.6) + line(100, 30, 100, 40, QUIET, 1.6) +
    r(8, 40, 24, 3, INK, 1.5) + r(88, 40, 24, 3, INK, 1.5) +
    `<path d="M16 40c0-6 3-9 4-12h4c1 3 4 6 4 12z" fill="${GOLD}" stroke="${INK}" stroke-width="1.2"/>` +
    r(90, 30, 9, 10, PAPER, 1.5) + r(101, 32, 8, 8, PAPER, 1.5),
    PAPER,
  ),
  /* a train of coaches with a number card above it */
  train: () => frame(
    r(6, 60, 108, 2.4, QUIET, 1.2) +
    r(14, 38, 26, 18, PAPER, 3) + r(46, 38, 26, 18, PAPER, 3) +
    r(78, 34, 30, 22, LOUD, 4) + r(96, 24, 7, 10, INK, 1.5) +
    dot(22, 58, 3.6, INK) + dot(34, 58, 3.6, INK) + dot(54, 58, 3.6, INK) + dot(66, 58, 3.6, INK) + dot(88, 58, 4.2, INK) + dot(100, 58, 4.2, INK) +
    r(20, 8, 26, 16, GOLD, 3) + `<text x="33" y="20" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="800" fill="${INK}">7</text>`,
    GOLD,
  ),
  /* the square of algebra tiles, one corner still empty */
  tiles: () => frame(
    r(16, 10, 34, 34, PAPER, 2) +
    r(54, 10, 10, 34, LEAF, 2) + r(68, 10, 10, 34, LEAF, 2) +
    r(16, 48, 34, 10, LEAF, 2) + r(16, 62, 34, 10, LEAF, 2) +
    r(54, 48, 10, 10, GOLD, 2) + r(68, 48, 10, 10, GOLD, 2) +
    `<rect x="54" y="62" width="24" height="10" rx="2" fill="none" stroke="${LOUD}" stroke-width="2" stroke-dasharray="3 3"/>`,
    LEAF,
  ),
  /* axes with a line and its points */
  graph: () => frame(
    line(18, 62, 106, 62, QUIET, 2) + line(18, 10, 18, 62, QUIET, 2) +
    line(24, 56, 98, 18, LOUD, 3) +
    dot(38, 48, 3.4, GOLD) + dot(60, 37, 3.4, GOLD) + dot(82, 26, 3.4, GOLD),
    LOUD,
  ),
  /* a pie beside two bars */
  stats: () => frame(
    `<circle cx="36" cy="40" r="24" fill="${PAPER}"/>` +
    `<path d="M36 40 36 16a24 24 0 0 1 20.8 36z" fill="${GOLD}"/>` +
    r(72, 30, 12, 32, LEAF, 2) + r(90, 18, 12, 44, LOUD, 2) + line(66, 62, 110, 62, QUIET, 2),
    GOLD,
  ),
  /* sticky notes pinned on a grid */
  notes: () => frame(
    r(10, 10, 100, 56, "#fffdf8", 4) +
    line(10, 28, 110, 28, QUIET, 1) + line(10, 47, 110, 47, QUIET, 1) +
    line(43, 10, 43, 66, QUIET, 1) + line(76, 10, 76, 66, QUIET, 1) +
    `<g transform="rotate(-6 26 20)">${r(14, 12, 24, 16, GOLD, 2)}</g>` +
    `<g transform="rotate(5 60 40)">${r(48, 32, 24, 16, LEAF, 2)}</g>` +
    `<g transform="rotate(-3 93 58)">${r(81, 50, 24, 14, PAPER, 2)}</g>`,
    PAPER,
  ),
  /* base-ten blocks: a flat, a rod and ones */
  blocks: () => frame(
    r(12, 22, 34, 34, PAPER, 2) +
    r(54, 22, 10, 34, LEAF, 2) +
    r(72, 22, 9, 9, GOLD, 1.5) + r(84, 22, 9, 9, GOLD, 1.5) + r(72, 34, 9, 9, GOLD, 1.5) + r(84, 34, 9, 9, GOLD, 1.5) + r(72, 46, 9, 9, GOLD, 1.5),
    PAPER,
  ),
  /* a map with a piece being dropped in */
  map: () => frame(
    `<path d="M14 20h40l10 8h36v34H24l-10-9z" fill="${LEAF}" opacity="0.8" stroke="${INK}" stroke-width="1.6"/>` +
    `<path d="M58 28h24v20H58z" fill="${GOLD}" stroke="${INK}" stroke-width="1.6"/>` +
    dot(96, 18, 5, LOUD),
    LEAF,
  ),
  /* a gamepad */
  game: () => frame(
    `<path d="M26 26h68a18 18 0 0 1 17 14l3 14a10 10 0 0 1-18 7l-5-7H29l-5 7a10 10 0 0 1-18-7l3-14a18 18 0 0 1 17-14z" fill="${PAPER}"/>` +
    r(30, 40, 18, 5, "#fff", 2.5) + r(36, 34, 5, 17, "#fff", 2.5) +
    dot(84, 38, 5, LOUD) + dot(96, 46, 5, GOLD) + dot(72, 46, 5, "#fff"),
    LOUD,
  ),
  /* a sheet of paper coming out of a press: the printable workbooks */
  print: () => frame(
    r(34, 8, 52, 20, "#fffdf8", 2) + line(42, 16, 78, 16, QUIET, 2) + line(42, 22, 66, 22, QUIET, 2) +
    r(22, 30, 76, 22, PAPER, 4) + dot(86, 41, 3.4, GOLD) +
    r(34, 52, 52, 18, "#fffdf8", 2) + line(42, 60, 78, 60, QUIET, 2) + line(42, 66, 60, 66, QUIET, 2),
    GOLD,
  ),
  /* a marked-up piece of writing */
  writing: () => frame(
    r(20, 8, 80, 60, "#fffdf8", 3) +
    line(28, 22, 92, 22, QUIET, 2) + line(28, 32, 92, 32, QUIET, 2) + line(28, 42, 76, 42, QUIET, 2) + line(28, 52, 92, 52, QUIET, 2) +
    `<path d="M30 40c8 6 16 6 24 0" fill="none" stroke="${LOUD}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M66 48l10-10 5 5-10 10z" fill="${GOLD}"/>`,
    LOUD,
  ),
  /* an exam paper with a tick */
  exam: () => frame(
    r(26, 6, 68, 64, "#fffdf8", 3) + r(26, 6, 68, 12, PAPER, 3) +
    line(36, 30, 84, 30, QUIET, 2) + line(36, 40, 84, 40, QUIET, 2) + line(36, 50, 70, 50, QUIET, 2) +
    `<path d="M62 54l8 8 16-18" fill="none" stroke="${LEAF}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
    PAPER,
  ),
};

/* ── what is on the wall ─────────────────────────────────────────────────── */

export const SHOWCASE = [
  { art: "balance", tag: "Algebra", title: "Balance scales", line: "Take the same off both pans and watch it stay level. Two scales for two equations.", href: "/prep-math/activity/algebra-workbook/index.html" },
  { art: "tiles", tag: "Algebra", title: "Completing the square", line: "Lay the tiles, fill the corner, and see why the middle number is halved.", href: "/prep-math/activity/algebra-workbook/index.html" },
  { art: "train", tag: "Functions", title: "Function machines", line: "A coach for every job. Send a number along the train and watch it change.", href: "/prep-math/activity/algebra-workbook/index.html" },
  { art: "graph", tag: "Graphs", title: "Graphs of functions", line: "Plot the points by tapping, rule the line, read it back.", href: "/prep-math/activity/algebra-workbook/index.html" },
  { art: "stats", tag: "Statistics", title: "Charts you build", line: "Pictograms, bars, pie charts and scatter graphs — tapped into place and marked.", href: "/prep-math/activity/statistics-workbook/index.html" },
  { art: "print", tag: "Workbooks", title: "Printable workbooks", line: "Maths, geometry, algebra and statistics — a fresh paper every time, with answers.", href: "/prep-math/activity/maths-workbook/index.html" },
  { art: "blocks", tag: "Number", title: "Manipulatives", line: "Blocks, abacuses, place-value charts and written boards on one endless table.", href: "/prep-math/activity/base-blocks/index.html" },
  { art: "notes", tag: "Number", title: "Number Match", line: "Every way of writing a number, poured onto the table to be matched.", href: "/prep-math/activity/number-match/index.html" },
  { art: "map", tag: "Puzzles", title: "Map of Nigeria jigsaw", line: "Drag all 37 states home — and slider puzzles, tangrams and shikaku beside it.", href: "/exam-archive/national/puzzles/index.html" },
  { art: "game", tag: "Games", title: "Games that drill", line: "Races against the clock and 3D worlds where the maths is the controls.", href: "/home/games/index.html" },
  { art: "writing", tag: "English", title: "Writing evaluator", line: "Plan it, write it, and get it marked paragraph by paragraph in red pen.", href: "/writing/index.html" },
  { art: "exam", tag: "Exams", title: "Past papers & CBT", line: "Exam-style questions by class, subject and topic, timed like the real thing.", href: "/exam-archive/national/exams/index.html" },
];

/** Draw the wall into `.showcase-grid`. */
export function mountShowcase(root = document) {
  const grid = root.querySelector(".showcase-grid");
  if (!grid) return 0;
  grid.innerHTML = SHOWCASE.map((s) => (
    `<a class="shot" href="${s.href}">` +
    `<span class="shot__frame">${(ART[s.art] || ART.exam)()}</span>` +
    `<span class="shot__tag">${s.tag}</span>` +
    `<span class="shot__title">${s.title}</span>` +
    `<span class="shot__line">${s.line}</span>` +
    `</a>`
  )).join("");
  return SHOWCASE.length;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mountShowcase());
  else mountShowcase();
}
