/* ============================================================================
   Algebra Workbook — the drawings for CHAPTER 5, properties and identities
   ----------------------------------------------------------------------------
   Every law in the chapter is first SEEN, and each drawing here is the object
   that makes one law obvious:

     dots        an array of dots: 3 rows of 5 is the same dots as 5 rows of 3
                 (turned round) — the commutative law for ×; with a dashed cut
                 down it, 3 × (4 + 2) is 3 × 4 and 3 × 2 — the distributive law
     bars        strips of paper end to end: 3 then 5 is as long as 5 then 3
     counters    yellow +1s and red −1s; a yellow and a red make a zero pair —
                 the additive inverse; counters in rings show how a sum is
                 grouped — the associative law
     area        a rectangle cut into parts, lengths along the top and the side:
                 k(x + b), (x + a)(x + b), (a + b)² — on centimetre squares when
                 the squares are to be counted
     diffSq      a² − b²: the square with a corner cut off, and the same two
                 pieces moved into an (a + b) by (a − b) rectangle

   An unknown length is never drawn to its value (the rule the bar model and
   the balance keep): x is drawn a fixed, longer-than-anything length.

   Millimetres at the paper's own size, like barart.js and balanceart.js.
   ========================================================================== */

const INK = "#2a2723";
const GREY = "#8a837a";
const BUTTER = "#fff3a8";   // the unknown, as everywhere in this book
const SKY = "#bfe3ff";      // a number we were told
const LEAF = "#c8f0c0";
const PEACH = "#ffd7a3";
const RED = "#f2a39b";
const YEL = "#ffe27a";
const GRID = "#d9d3c7";
const FILLS = [BUTTER, SKY, LEAF, PEACH];

const f = (n) => (+n).toFixed(2);

const text = (x, y, t, { size = 3.8, col = INK, weight = 700, anchor = "middle", italic = false } = {}) =>
  `<text x="${f(x)}" y="${f(y + size * 0.36)}" text-anchor="${anchor}" font-family="${italic ? "'Times New Roman', serif" : "JetBrains Mono, monospace"}" ` +
  `${italic ? 'font-style="italic" ' : ""}font-size="${size}" font-weight="${italic ? 500 : weight}" fill="${col}">${t}</text>`;

/* A letter is set in italic, the way the paper's own mathematics is set. */
const word = (t) => /^[a-z]$/.test(String(t));
const label = (x, y, t, opts = {}) => text(x, y, t, { ...opts, italic: word(t) || opts.italic });

const svg = (w, h, body, aria, extra = "") =>
  `<svg class="ap-fig" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}mm" height="${f(h)}mm" role="img" aria-label="${aria}"${extra}>${body}</svg>`;

/* ── dots ──────────────────────────────────────────────────────────────── */

/**
 * An array of dots, `rows` by `cols`, with an optional dashed cut after column
 * `split` (the distributive law) and a bracket for each part.
 */
export function dotsSvg(rows, cols, { split = null, step = 5.2, label: aria = "An array of dots" } = {}) {
  const pad = 5;
  const w = pad * 2 + (cols - 1) * step;
  const h = pad * 2 + (rows - 1) * step + (split ? 6 : 0);
  let body = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const part = split && c >= split ? 1 : 0;
      body += `<circle cx="${f(pad + c * step)}" cy="${f(pad + r * step)}" r="1.7" fill="${part ? SKY : YEL}" stroke="${INK}" stroke-width="0.35"/>`;
    }
  }
  if (split) {
    const x = pad + (split - 0.5) * step;
    body += `<line x1="${f(x)}" y1="1.5" x2="${f(x)}" y2="${f(pad * 2 + (rows - 1) * step - 1.5)}" stroke="${INK}" stroke-width="0.45" stroke-dasharray="1.4 1"/>`;
  }
  return svg(w, h, body, aria);
}

/* ── bars ──────────────────────────────────────────────────────────────── */

/** Rows of strips end to end, each strip `mm` per unit, labelled with its number. */
export function barsSvg(rows, { mm = 5 } = {}) {
  const H = 8;
  const gap = 4;
  const most = Math.max(...rows.map((r) => r.reduce((a, b) => a + b, 0)));
  const w = most * mm + 4;
  const h = rows.length * (H + gap) + 2;
  let body = "";
  rows.forEach((r, i) => {
    let x = 2;
    const y = 2 + i * (H + gap);
    r.forEach((v, j) => {
      body += `<rect x="${f(x)}" y="${f(y)}" width="${f(v * mm)}" height="${H}" fill="${FILLS[(j + i) % 2 ? 1 : 2]}" stroke="${INK}" stroke-width="0.4"/>`;
      body += text(x + (v * mm) / 2, y + H / 2, v, { size: 3.6 });
      x += v * mm;
    });
  });
  return svg(w, h, body, "Strips of paper end to end");
}

/* ── counters ──────────────────────────────────────────────────────────── */

const counter = (x, y, plus) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="2.3" fill="${plus ? YEL : RED}" stroke="${INK}" stroke-width="0.35"/>` +
  `<text x="${f(x)}" y="${f(y + 1.25)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.6" font-weight="700" fill="${INK}">${plus ? "+" : "−"}</text>`;

/** Yellow +1s on top, red −1s under them, so each pair is a column. */
export function zeroPairsSvg(pos, neg) {
  /* closer together when there are many, so a row of twelve still fits half a page */
  const step = Math.min(6, 62 / Math.max(pos, neg, 1));
  const n = Math.max(pos, neg);
  const w = 6 + (n - 1) * step + 6;
  let body = "";
  for (let i = 0; i < pos; i++) body += counter(6 + i * step, 6, true);
  for (let i = 0; i < neg; i++) body += counter(6 + i * step, 13, false);
  return svg(w, 19, body, `${pos} positive and ${neg} negative counters`);
}

/**
 * Counters grouped in rings: `groups` is a list whose items are numbers (loose
 * counters) or arrays of numbers (a ring round them) — [[2, 3], 4] is
 * (2 + 3) + 4 and [2, [3, 4]] is 2 + (3 + 4).
 */
export function groupsSvg(groups) {
  const step = 5.4;
  const gap = 5;
  let x = 4;
  let body = "";
  const lay = (n) => {
    const out = [];
    for (let i = 0; i < n; i++) { out.push(counter(x + 2.4, 9, true)); x += step; }
    return out.join("");
  };
  for (const g of groups) {
    if (Array.isArray(g)) {
      const x0 = x - 1.4;
      let inner = "";
      g.forEach((n, k) => { inner += lay(n); if (k < g.length - 1) x += 2; });
      const x1 = x - step + 6.2;
      body += `<rect x="${f(x0)}" y="3.2" width="${f(x1 - x0)}" height="11.6" rx="5.8" fill="${LEAF}" fill-opacity="0.55" stroke="${INK}" stroke-width="0.4" stroke-dasharray="1.2 0.9"/>` + inner;
    } else body += lay(g);
    x += gap;
  }
  return svg(x, 18, body, "Counters in groups");
}

/* ── area ──────────────────────────────────────────────────────────────── */

const X_LEN = 26;           // mm: how long x is drawn, whatever it is — see the top

/**
 * A rectangle cut into parts. `top` and `side` are the lengths along the top
 * and down the left: numbers, or "x" (drawn X_LEN long). Each part is tinted by
 * what it is (x·x butter, x·number sky, number·number leaf) and can carry words.
 *
 *   top, side   [{ v: 3 | "x", label }]
 *   inside      inside[row][col] — words in each part, or null
 *   grid        true: numbers are drawn 1 cm to 1 and the squares shown, to count
 *   mm          mm per unit when not on a grid
 */
export function areaSvg({ top, side, inside = null, grid = false, mm = 6 }) {
  const unit = grid ? 10 : mm;
  const len = (p) => (p.v === "x" ? X_LEN : p.v * unit);
  const L = 9;               // room for the labels along the top and the side
  const W = top.reduce((s, p) => s + len(p), 0);
  const H = side.reduce((s, p) => s + len(p), 0);
  let body = "";
  let y = L;
  side.forEach((sp, r) => {
    let x = L;
    top.forEach((tp, c) => {
      const w = len(tp);
      const h = len(sp);
      const kinds = (tp.v === "x" ? 1 : 0) + (sp.v === "x" ? 1 : 0);
      const fill = kinds === 2 ? BUTTER : kinds === 1 ? SKY : LEAF;
      body += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" stroke="${INK}" stroke-width="0.5"/>`;
      if (grid && tp.v !== "x" && sp.v !== "x") {
        for (let gx = 1; gx < tp.v; gx++) body += `<line x1="${f(x + gx * unit)}" y1="${f(y)}" x2="${f(x + gx * unit)}" y2="${f(y + h)}" stroke="${GRID}" stroke-width="0.3"/>`;
        for (let gy = 1; gy < sp.v; gy++) body += `<line x1="${f(x)}" y1="${f(y + gy * unit)}" x2="${f(x + w)}" y2="${f(y + gy * unit)}" stroke="${GRID}" stroke-width="0.3"/>`;
        body += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="none" stroke="${INK}" stroke-width="0.5"/>`;
      }
      const words = inside?.[r]?.[c];
      if (words != null && words !== "") {
        body += `<rect x="${f(x + w / 2 - words.length * 1.3 - 1.4)}" y="${f(y + h / 2 - 2.6)}" width="${f(words.length * 2.6 + 2.8)}" height="5.2" rx="1" fill="#fffdf8" opacity="0.85"/>`;
        body += text(x + w / 2, y + h / 2, words, { size: 3.6 });
      }
      x += w;
    });
    y += len(sp);
  });
  /* the lengths: along the top, each over its own part; down the side */
  let x = L;
  top.forEach((p) => { body += label(x + len(p) / 2, L - 4, p.label ?? p.v, { size: 4 }); x += len(p); });
  y = L;
  side.forEach((p) => { body += label(L - 4.2, y + len(p) / 2, p.label ?? p.v, { size: 4 }); y += len(p); });
  return svg(L + W + 3, L + H + 3, body, "A rectangle cut into parts", grid ? ` data-true-size="1"` : "");
}

/* ── a² − b² ───────────────────────────────────────────────────────────── */

/**
 * The square a by a with a b by b corner cut away (hatched), and beside it the
 * two pieces that are left moved into one rectangle, (a + b) by (a − b). The
 * pieces keep their colours across, so the eye can follow each one.
 */
export function diffSqSvg(a, b, { mm = 5, letters = false } = {}) {
  const A = a * mm;
  const B = b * mm;
  const L = 8;
  const say = (n, l) => (letters ? l : String(n));
  let body = "";
  /* the square with its corner cut */
  body += `<defs><pattern id="ap-hatch" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2" stroke="${GREY}" stroke-width="0.5"/></pattern></defs>`;
  body += `<rect x="${L}" y="${L}" width="${f(A)}" height="${f(A - B)}" fill="${SKY}" stroke="${INK}" stroke-width="0.5"/>`;
  body += `<rect x="${L}" y="${f(L + A - B)}" width="${f(A - B)}" height="${f(B)}" fill="${PEACH}" stroke="${INK}" stroke-width="0.5"/>`;
  body += `<rect x="${f(L + A - B)}" y="${f(L + A - B)}" width="${f(B)}" height="${f(B)}" fill="url(#ap-hatch)" stroke="${INK}" stroke-width="0.4" stroke-dasharray="1.2 0.9"/>`;
  body += label(L + A / 2, L - 3.8, say(a, "a"), { size: 4 });
  body += label(L - 3.8, L + A / 2, say(a, "a"), { size: 4 });
  body += label(L + A - B / 2, L + A + 4, say(b, "b"), { size: 3.6 });
  /* the arrow across */
  const ax = L + A + 7;
  body += `<path d="M${f(ax)} ${f(L + A / 2)}h9" stroke="${INK}" stroke-width="0.6"/><path d="M${f(ax + 9)} ${f(L + A / 2 - 2)}l3 2-3 2z" fill="${INK}"/>`;
  /* the rectangle they make */
  const x2 = ax + 16;
  body += `<rect x="${f(x2)}" y="${L}" width="${f(A)}" height="${f(A - B)}" fill="${SKY}" stroke="${INK}" stroke-width="0.5"/>`;
  body += `<rect x="${f(x2 + A)}" y="${L}" width="${f(B)}" height="${f(A - B)}" fill="${PEACH}" stroke="${INK}" stroke-width="0.5"/>`;
  body += label(x2 + (A + B) / 2, L - 3.8, letters ? "a + b" : `${a} + ${b}`, { size: 3.8, italic: letters });
  body += label(x2 + A + B + 6, L + (A - B) / 2, letters ? "a − b" : `${a} − ${b}`, { size: 3.8, anchor: "start", italic: letters });
  const W = x2 + A + B + 22;
  return svg(W, L + A + 8, body, "A square with a corner cut off, and the pieces moved into a rectangle");
}
