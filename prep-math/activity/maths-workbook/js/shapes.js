/* ============================================================================
   Remainders Workbook — the things you group, and the mat you group them on
   ----------------------------------------------------------------------------
   The whole workbook rests on one picture: a pile of objects, a pencil, and a
   ring drawn round every group of five. Everything else — the division
   sentence, the remainder, the fraction — is that picture written down.

   Three rules the drawing has to obey, and they are all about not giving the
   answer away:

   THE OBJECTS ARE NOT IN ROWS OF THE DIVISOR. Lay seventeen counters out in
   rows of five and the child has not grouped anything; the page grouped them.
   So they sit on a jittered grid whose row length has nothing to do with the
   divisor, which is what a real handful of counters looks like anyway.

   THEY ARE FAR ENOUGH APART TO DRAW ROUND. A ring drawn in pencil round five
   objects needs a couple of millimetres of clear paper on every side, or the
   child's own working covers the thing they are counting.

   THEY ARE ALL THE SAME SHAPE AND SIZE WITHIN ONE QUESTION. The shape changes
   between questions so the page is not monotonous, but a pile that is half
   stars and half circles is a sorting question, and this is not one.
   ========================================================================== */

const INK = "#2a2723";

/* Fixed pastels, like everything on the paper: it prints the same from a
   dark-mode browser as from a light one. One per question, rotated, so eight
   questions are eight colours and not one wall of yellow. */
const PAPER_COLOURS = ["#f4c95d", "#6fb7e8", "#7cc47c", "#f0a868", "#c9a3ee", "#7fd7c6"];

/* ── the shapes themselves ─────────────────────────────────────────────────
   Drawn in a box of side 100 centred on the origin, so one number scales them
   all and a star is never bigger than a square by accident. */

const SHAPES = {
  circle: () => `<circle cx="0" cy="0" r="42"/>`,
  square: () => `<rect x="-38" y="-38" width="76" height="76" rx="4"/>`,
  triangle: () => `<path d="M0 -44 L42 34 H-42 Z"/>`,
  diamond: () => `<path d="M0 -46 L40 0 L0 46 L-40 0 Z"/>`,
  star: () => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 46 : 19;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(`${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(" ")}"/>`;
  },
  hexagon: () => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push(`${(43 * Math.cos(a)).toFixed(1)},${(43 * Math.sin(a)).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(" ")}"/>`;
  },
};

export const SHAPE_NAMES = Object.keys(SHAPES);

/** What a pile of these is called in the sentence above it. */
export const SHAPE_WORDS = {
  circle: "counters",
  square: "tiles",
  triangle: "flags",
  diamond: "gems",
  star: "stars",
  hexagon: "tiles",
};

/* ── the pile ──────────────────────────────────────────────────────────────*/

const CELL_MM = 13; // room to draw a ring without touching the next object
const SIZE_MM = 8.4; // the object inside that cell
const OUTLINE_MM = 0.4; // enough to survive a photocopier, not enough to shout
const COLS = 8; // never a divisor this workbook uses — see the note above

/**
 * n objects, laid out to be grouped.
 *
 * `jit` is a number, not a random function: the wobble has to be the same
 * every time this question is printed, and the caller already has a seeded
 * stream to take it from.
 */
export function pileSvg(n, { shape = "circle", colour = 0, jit = [], rings = 0 } = {}) {
  const draw = SHAPES[shape] || SHAPES.circle;
  const fill = PAPER_COLOURS[colour % PAPER_COLOURS.length];
  const rows = Math.ceil(n / COLS);
  const cols = Math.min(n, COLS);

  let body = "";
  for (let i = 0; i < n; i++) {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    const j = jit[i] || { x: 0, y: 0, a: 0 };
    const x = (c + 0.5) * CELL_MM + j.x;
    const y = (r + 0.5) * CELL_MM + j.y;
    const s = SIZE_MM / 100;
    body +=
      `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${j.a}) scale(${s})" ` +
      `fill="${fill}" stroke="${INK}" stroke-width="${(OUTLINE_MM / s).toFixed(1)}" ` +
      `stroke-linejoin="round">${draw()}</g>`;
  }

  /* The worked example's rings, drawn in the pile's own coordinates so they sit
     on the objects. Only ever asked for when the groups fall inside single
     rows — see ringsFit — because a ring that wraps round the end of a row and
     back to the start of the next reads as two groups. */
  if (rings && ringsFit(rings)) {
    for (let g = 0; g + rings <= n; g += rings) {
      const c0 = g % COLS;
      const row = Math.floor(g / COLS);
      const cx = (c0 + rings / 2) * CELL_MM;
      const cy = (row + 0.5) * CELL_MM;
      body +=
        `<ellipse cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" ` +
        `rx="${(rings * CELL_MM) / 2 - 0.7}" ry="${CELL_MM / 2 - 0.7}" ` +
        `fill="none" stroke="#c0453f" stroke-width="0.5"/>`;
    }
  }

  const w = cols * CELL_MM;
  const h = rows * CELL_MM;
  return (
    `<svg viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm" class="rw-pile" ` +
    `role="img" aria-label="${n} things to group">${body}</svg>`
  );
}

/** Whether every group of this size lands inside one row of the pile. */
export function ringsFit(d) {
  return COLS % d === 0;
}

/** The wobble for one pile, drawn off the question's own seeded stream. */
export function jitterFor(r, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: (r.raw() - 0.5) * 2.1,
      y: (r.raw() - 0.5) * 2.1,
      a: Math.round((r.raw() - 0.5) * 24),
    });
  }
  return out;
}

/* ── the trays you share into ──────────────────────────────────────────────*/

/**
 * `d` empty trays in a row, for the OTHER kind of division — not "how many
 * groups of five", but "share these between five". Both are division and both
 * leave the same remainder, and a child who has only met one of them is
 * stuck the first time a word problem uses the other.
 */
export function traysSvg(d, { tall = 22 } = {}) {
  const w = Math.min(30, Math.floor(150 / d));
  const gap = 3;
  const total = d * w + (d - 1) * gap;
  let body = "";
  for (let i = 0; i < d; i++) {
    const x = i * (w + gap);
    body +=
      `<rect x="${x}" y="0" width="${w}" height="${tall}" rx="2" ` +
      `fill="#fffdf8" stroke="${INK}" stroke-width="1" stroke-dasharray="3 2"/>`;
  }
  return (
    `<svg viewBox="-0.6 -0.6 ${total + 1.2} ${tall + 1.2}" width="${total}mm" height="${tall}mm" ` +
    `class="rw-trays" role="img" aria-label="${d} empty trays to share into">${body}</svg>`
  );
}
