/* ============================================================================
   Statistics Workbook — the drawings for CHAPTER 1, pictograms
   ----------------------------------------------------------------------------
   Four pictures, in the order the chapter needs them:

     scatter     a jumble of shapes to sort and count — tapped one by one on
                 screen (each is a data-part the workbook's colouring picks up)
     tally       tally marks, in gates of five
     pictogram   rows of symbols beside their labels, with a key; a symbol can
                 be whole, a half, a quarter or three quarters
     builder     the same pictogram with empty dashed boxes in the rows still
                 to be drawn — drawn into on paper, tapped on screen
                 (utils/components/workbook/picto.js)

   The symbols are drawn to be told apart photocopied in black and white: each
   has its own outline, not only its own colour. A part-symbol is the whole one
   cut off from the left — the way a pictogram's reader is taught to see it.

   Millimetres at the paper's own size, like every workbook drawing.
   ========================================================================== */

const INK = "#2a2723";
const GREY = "#8a837a";
const BUTTER = "#fff3a8";
const SKY = "#bfe3ff";
const LEAF = "#c8f0c0";
const PEACH = "#ffd7a3";
const ROSE = "#f6c9c4";
const LILAC = "#e3d4f7";

const f = (n) => (+n).toFixed(2);
const text = (x, y, t, { size = 3.6, col = INK, weight = 700, anchor = "middle" } = {}) =>
  `<text x="${f(x)}" y="${f(y + size * 0.36)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" font-size="${size}" font-weight="${weight}" fill="${col}">${t}</text>`;
const svg = (w, h, body, aria, extra = "") =>
  `<svg class="sw-fig" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}mm" height="${f(h)}mm" role="img" aria-label="${aria}"${extra}>${body}</svg>`;

/* ── the symbols: each drawn in a 10 × 10 box ─────────────────────────────── */

const S = 0.45; // outline width
export const SYMBOLS = {
  smiley: {
    name: "a face",
    draw: () => `<circle cx="5" cy="5" r="4.3" fill="${BUTTER}" stroke="${INK}" stroke-width="${S}"/>` +
      `<circle cx="3.6" cy="4" r="0.6" fill="${INK}"/><circle cx="6.4" cy="4" r="0.6" fill="${INK}"/>` +
      `<path d="M3.2 6a2.2 2.2 0 0 0 3.6 0" fill="none" stroke="${INK}" stroke-width="${S}" stroke-linecap="round"/>`,
  },
  book: {
    name: "a book",
    draw: () => `<rect x="1.4" y="1.2" width="7.2" height="7.6" rx="0.6" fill="${SKY}" stroke="${INK}" stroke-width="${S}"/>` +
      `<rect x="1.4" y="1.2" width="1.4" height="7.6" fill="${INK}" opacity="0.25"/>` +
      `<rect x="3.8" y="3" width="3.6" height="1" rx="0.5" fill="#fffdf8"/>`,
  },
  fish: {
    name: "a fish",
    draw: () => `<path d="M1.4 5c1.6-2.6 4.4-3 6.2-1.4l1.8-1.4v4.8l-1.8-1.4C5.8 7.2 3 7.6 1.4 5z" fill="${PEACH}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>` +
      `<circle cx="3.2" cy="4.4" r="0.55" fill="${INK}"/>`,
  },
  car: {
    name: "a car",
    draw: () => `<path d="M1 7V5.4l1.4-.4 1.4-2.2h3.4l1.6 2.2 1.2.4V7z" fill="${ROSE}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>` +
      `<circle cx="3" cy="7.2" r="1.2" fill="${INK}"/><circle cx="7.2" cy="7.2" r="1.2" fill="${INK}"/>`,
  },
  sun: {
    name: "a sun",
    draw: () => [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
      const t = (a * Math.PI) / 180;
      return `<line x1="${f(5 + 3.3 * Math.cos(t))}" y1="${f(5 + 3.3 * Math.sin(t))}" x2="${f(5 + 4.6 * Math.cos(t))}" y2="${f(5 + 4.6 * Math.sin(t))}" stroke="${INK}" stroke-width="0.6" stroke-linecap="round"/>`;
    }).join("") + `<circle cx="5" cy="5" r="2.6" fill="${BUTTER}" stroke="${INK}" stroke-width="${S}"/>`,
  },
  ball: {
    name: "a ball",
    draw: () => `<circle cx="5" cy="5" r="4.2" fill="#fffdf8" stroke="${INK}" stroke-width="${S}"/>` +
      `<path d="M5 3.3 6.6 4.5 6 6.4H4L3.4 4.5z" fill="${INK}"/>`,
  },
  cup: {
    name: "a cup",
    draw: () => `<path d="M1.8 2.4h5.4l-.6 5.6a1 1 0 0 1-1 .8H3.4a1 1 0 0 1-1-.8z" fill="${LILAC}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>` +
      `<path d="M7.1 3.6h.9a1.4 1.4 0 0 1 0 2.8h-1.2" fill="none" stroke="${INK}" stroke-width="${S}"/>`,
  },
  star: {
    name: "a star",
    draw: () => `<path d="M5 0.9l1.2 2.6 2.9.3-2.2 1.9.7 2.8L5 7.1 2.4 8.5l.7-2.8L.9 3.8l2.9-.3z" fill="${BUTTER}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>`,
  },
};

/* the part of a symbol that is drawn: the whole thing cut off from the left */
const PARTS = { 0.25: "pc-q1", 0.5: "pc-q2", 0.75: "pc-q3" };
const clips =
  `<defs>` +
  `<clipPath id="pc-q1"><rect x="0" y="0" width="2.5" height="10"/></clipPath>` +
  `<clipPath id="pc-q2"><rect x="0" y="0" width="5" height="10"/></clipPath>` +
  `<clipPath id="pc-q3"><rect x="0" y="0" width="7.5" height="10"/></clipPath>` +
  `</defs>`;

/** One symbol, `size` mm, at (x, y); `part` of it (1, 0.75, 0.5, 0.25). */
export function symbolAt(name, x, y, size, part = 1) {
  const k = size / 10;
  const body = SYMBOLS[name].draw();
  const clip = part < 1 ? ` clip-path="url(#${PARTS[part]})"` : "";
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})"><g${clip}>${body}</g></g>`;
}

/* ── a scatter of shapes to sort ──────────────────────────────────────────── */

export const SHAPES = {
  circle: { name: "circle", plural: "circles", fill: SKY, draw: () => `<circle cx="5" cy="5" r="3.8"/>` },
  triangle: { name: "triangle", plural: "triangles", fill: BUTTER, draw: () => `<path d="M5 1.2 9 8.6H1z"/>` },
  square: { name: "square", plural: "squares", fill: LEAF, draw: () => `<rect x="1.6" y="1.6" width="6.8" height="6.8"/>` },
  star: { name: "star", plural: "stars", fill: PEACH, draw: () => `<path d="M5 0.9l1.2 2.6 2.9.3-2.2 1.9.7 2.8L5 7.1 2.4 8.5l.7-2.8L.9 3.8l2.9-.3z"/>` },
  heart: { name: "heart", plural: "hearts", fill: ROSE, draw: () => `<path d="M5 8.6C1.4 6 .8 4.2 1.4 3a2 2 0 0 1 3.6-.2A2 2 0 0 1 8.6 3c.6 1.2 0 3-3.6 5.6z"/>` },
};

/**
 * Place `counts` shapes of each kind at random, none overlapping, in a box
 * `w` by `h` mm. Done once when the question is made (it must print the same
 * every time), so it returns positions to keep: [{ kind, x, y, turn }].
 */
export function scatter(r, counts, { w = 96, h = 44, size = 8 } = {}) {
  const out = [];
  const kinds = Object.keys(counts);
  const all = kinds.flatMap((k) => Array.from({ length: counts[k] }, () => k));
  const shuffled = r.shuffle(all);
  for (const kind of shuffled) {
    let x; let y; let tries = 0;
    do {
      x = r.int(2, Math.floor(w - size - 2));
      y = r.int(2, Math.floor(h - size - 2));
      tries++;
    } while (tries < 800 && out.some((p) => Math.abs(p.x - x) < size + 1.2 && Math.abs(p.y - y) < size + 1.2));
    out.push({ kind, x, y, turn: r.int(-3, 3) * 10 });
  }
  return out;
}

/** The scatter drawn: each shape a data-part, so it can be tapped. */
export function scatterSvg(items, { w = 96, h = 44, size = 8 } = {}) {
  let body = `<rect x="0.3" y="0.3" width="${f(w - 0.6)}" height="${f(h - 0.6)}" rx="2" fill="#fffdf8" stroke="${GREY}" stroke-width="0.3" stroke-dasharray="1.2 1"/>`;
  items.forEach((p, i) => {
    const s = SHAPES[p.kind];
    const k = size / 10;
    body += `<g transform="translate(${f(p.x)} ${f(p.y)}) scale(${f(k)}) rotate(${p.turn} 5 5)">` +
      s.draw().replace("/>", ` data-part="${i}" data-kind="${p.kind}" fill="${s.fill}" stroke="${INK}" stroke-width="0.5" stroke-linejoin="round"/>`) + `</g>`;
  });
  return svg(w, h, body, "A jumble of shapes to sort and count");
}

/** One shape, small, to stand in a table beside its name. */
export const shapeIcon = (kind, size = 5) =>
  `<svg class="sw-icon" viewBox="0 0 10 10" width="${size}mm" height="${size}mm" aria-hidden="true">` +
  SHAPES[kind].draw().replace("/>", ` fill="${SHAPES[kind].fill}" stroke="${INK}" stroke-width="0.6"/>`) + `</svg>`;

/* ── tally marks ──────────────────────────────────────────────────────────── */

/** Tally marks for n, in gates of five: four upright and one across — five
    gates to a line, so a big tally wraps instead of running off the page. */
export function tallySvg(n, { h = 7, perLine = 5 } = {}) {
  const step = 1.8;
  const gateW = 4 * step + 1.6;
  const gates = Math.ceil(n / 5);
  const lines = Math.max(1, Math.ceil(gates / perLine));
  let body = "";
  let widest = 0;
  for (let g = 0; g < gates; g++) {
    const line = Math.floor(g / perLine);
    const y0 = line * (h + 1.5);
    let x = 1.4 + (g % perLine) * gateW;
    const inGate = Math.min(5, n - g * 5);
    const x0 = x;
    for (let i = 0; i < Math.min(inGate, 4); i++) {
      body += `<line x1="${f(x)}" y1="${f(y0 + 1)}" x2="${f(x)}" y2="${f(y0 + h - 1)}" stroke="${INK}" stroke-width="0.5" stroke-linecap="round"/>`;
      x += step;
    }
    if (inGate === 5) body += `<line x1="${f(x0 - 1)}" y1="${f(y0 + h - 1.6)}" x2="${f(x - step + 1)}" y2="${f(y0 + 1.6)}" stroke="${INK}" stroke-width="0.5" stroke-linecap="round"/>`;
    widest = Math.max(widest, x + 1);
  }
  return svg(Math.max(widest, 4), lines * (h + 1.5), body, `${n} tally marks`);
}

/* ── the pictogram ────────────────────────────────────────────────────────── */

const CELL = 9;         // mm per symbol
const ROW = 10.5;       // mm per row

/**
 * A pictogram.
 *
 *   rows     [{ label, n }] — n in SYMBOLS (4.5 is four and a half), or
 *            { label, build: true } for a row to be drawn in (empty boxes)
 *   symbol   one of SYMBOLS
 *   key      { n, noun } — one symbol stands for n nouns; null for no key
 *   title    over the top
 *   cols     how many boxes a row to be built gets
 *   sizes    [scale per row] — for the "what is wrong" pictograms only
 *   ragged   true — symbols not lined up in columns (also for "what is wrong")
 */
export function pictoSvg({ rows, symbol, key = null, title = "", cols = 8, sizes = null, ragged = false }) {
  const labelW = Math.max(16, ...rows.map((r) => r.label.length * 2.3 + 5));
  const most = Math.max(cols, ...rows.map((r) => Math.ceil(r.n || 0)));
  const x0 = labelW + 2;
  const top = title ? 9 : 2;
  /* room for a row that is spread out or shifted (the "not lined up" one) */
  const W = x0 + most * CELL * (ragged ? 1.35 : 1) + (ragged ? 6 : 0) + 8;
  let body = clips;
  const build = rows.some((r) => r.build);
  if (title) body += text(W / 2, 4, title, { size: 3.6 });
  rows.forEach((r, i) => {
    const y = top + i * ROW;
    body += `<line x1="1" y1="${f(y + ROW)}" x2="${f(W - 1)}" y2="${f(y + ROW)}" stroke="${GREY}" stroke-width="0.2" opacity="0.6"/>`;
    body += text(x0 - 2.5, y + ROW / 2, r.label, { size: 3.3, anchor: "end", weight: 600 });
    if (r.build) {
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * CELL;
        body += `<g class="pc-cell" data-row="${i}" data-col="${c}">` +
          `<rect class="pc-slot" x="${f(x + 0.4)}" y="${f(y + 0.9)}" width="${f(CELL - 0.8)}" height="${f(ROW - 1.8)}" rx="1" fill="#fffdf8" stroke="${GREY}" stroke-width="0.3" stroke-dasharray="1 0.8"/>` +
          `<g class="pc-whole">${symbolAt(symbol, x + 0.5, y + 0.75, 8)}</g>` +
          `<g class="pc-half">${symbolAt(symbol, x + 0.5, y + 0.75, 8, 0.5)}</g>` +
          `</g>`;
      }
      body += `<circle class="pc-row-mark" data-row="${i}" cx="${f(x0 + cols * CELL + 3)}" cy="${f(y + ROW / 2)}" r="1.4"/>`;
      return;
    }
    const whole = Math.floor(r.n + 1e-9);
    const part = Math.round((r.n - whole) * 4) / 4;
    const scale = sizes ? sizes[i] : 1;
    /* not lined up: each row starts somewhere else and spaces its symbols
       differently, so rows cannot be compared by their length */
    const shift = ragged ? [0, 6, 2.5][i % 3] : 0;
    const spread = ragged ? [1, 1.35, 1.05][i % 3] : 1;
    for (let c = 0; c < whole + (part ? 1 : 0); c++) {
      const size = 8 * scale;
      const x = x0 + shift + c * CELL * (sizes ? scale : spread);
      body += symbolAt(symbol, x + 0.5, y + ROW / 2 - size / 2, size, c < whole ? 1 : part);
    }
  });
  const H0 = top + rows.length * ROW;
  let H = H0 + 2;
  if (key) {
    const ky = H0 + 3;
    body += `<rect x="${f(x0 - 1)}" y="${f(ky)}" width="${f(Math.min(W - x0, 62))}" height="10" rx="1.4" fill="#fffdf8" stroke="${INK}" stroke-width="0.35"/>`;
    body += text(x0 + 1, ky + 5, "Key:", { size: 3.2, anchor: "start" });
    body += symbolAt(symbol, x0 + 12, ky + 1, 8);
    body += text(x0 + 22, ky + 5, `= ${key.n} ${key.noun}`, { size: 3.4, anchor: "start" });
    H = ky + 12;
  }
  return svg(W, H, body, title || "A pictogram", build ? ` data-picto="1"` : "");
}

/** A table: a header row and body rows of cells (HTML strings). */
export function tableHtml(head, rows, cls = "") {
  return `<table class="sw-table ${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>` +
    `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
