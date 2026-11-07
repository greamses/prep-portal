/* ============================================================================
   PrepBot Board — where things go
   ----------------------------------------------------------------------------
   The model never chooses a coordinate. The board is a page with two regions:
   MAIN, the column a teacher writes down line after line, and FIGURE, the
   panel the graph or diagram is drawn in. A cursor walks down MAIN; a line
   that is too wide is shrunk a little, then broken at an "=", and when MAIN is
   full the board turns a page. So two things placed here can never overlap.

   Logical units only (the SVG viewBox); the page scales the whole board.
   Pure: no DOM — node-testable.
   ========================================================================== */

export const CANVAS = {
  landscape: {
    w: 1600, h: 900,
    main: { x: 70, y: 64, w: 780, h: 790 },
    figure: { x: 920, y: 96, w: 610, h: 610 },
  },
  portrait: {
    w: 900, h: 1600,
    figure: { x: 110, y: 70, w: 680, h: 680 },
    main: { x: 64, y: 820, w: 772, h: 730 },
  },
};

/* The writing sizes, in logical units: what a marker on a real board looks like
   from a desk at the back. */
export const SIZES = {
  title: { font: 38, gap: 20 },
  step: { font: 29, gap: 12 },
  note: { font: 25, gap: 10 },
};

/**
 * A canvas the SHAPE of the space the board is shown in, so the paper fills
 * it edge to edge (a panel, a phone, a wide screen) instead of sitting in it
 * letterboxed. The height (landscape) or width (portrait) stays 900 units, so
 * writing is the same size everywhere; the other side grows with the space.
 */
export function makeCanvas(aspect = 16 / 9) {
  const a = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
  if (a >= 1.05) {
    const h = 900;
    const w = Math.round(Math.min(2400, Math.max(1000, h * a)));
    /* the ribbon sits along the top and the status line at the bottom: the
       writing starts below the ribbon and stops above the status line */
    const s = Math.round(Math.min(h - 260, w * 0.4));
    const figure = { x: w - s - 60, y: 130, w: s, h: s };
    return { w, h, main: { x: 70, y: 120, w: figure.x - 70 - 50, h: 680 }, figure };
  }
  const w = 900;
  const h = Math.round(Math.min(2400, Math.max(1000, w / a)));
  const s = Math.round(Math.min(600, h * 0.36));
  /* to the right, leaving room on the left for the names of its parts */
  const figure = { x: w - s - 40, y: 230, w: s, h: s };
  const top = figure.y + s + 50;
  return { w, h, figure, main: { x: 44, y: top, w: 900 - 44 - 36, h: h - top - 120 } };
}

/** The smallest a line may be shrunk to fit before it is broken instead. */
export const MIN_SCALE = 0.7;

export function createLayout(shape = "landscape") {
  /* a named shape, or a canvas made by makeCanvas() */
  const C = typeof shape === "object" && shape ? shape : CANVAS[shape] || CANVAS.landscape;
  let y = C.main.y;
  const placed = [];

  return {
    canvas: C,
    orient: C.h > C.w ? "portrait" : "landscape",

    /** A new page: the cursor goes back to the top. */
    reset() {
      y = C.main.y;
      placed.length = 0;
    },

    /** How a line of this width would have to be drawn: its scale, and whether
        it would still not fit (and so wants breaking). */
    fit(w) {
      if (w <= C.main.w) return { scale: 1, tooWide: false };
      const s = C.main.w / w;
      return s >= MIN_SCALE ? { scale: s, tooWide: false } : { scale: MIN_SCALE, tooWide: true };
    },

    /**
     * Place one line of writing of size {w, h} (unscaled). Returns where it
     * goes, or { turn: true } when MAIN has no room left and the board must turn
     * a page first (then call again).
     */
    place(kind, size, { force = false } = {}) {
      const gap = (SIZES[kind] || SIZES.step).gap;
      const { scale } = this.fit(size.w);
      const h = size.h * scale;
      const top = placed.length ? y + gap : y;
      if (!force && placed.length && top + h > C.main.y + C.main.h) return { turn: true };
      const box = { x: C.main.x, y: top, w: size.w * scale, h, scale };
      placed.push(box);
      y = top + h;
      return box;
    },

    /** Room left in MAIN, in logical units. */
    room() {
      return C.main.y + C.main.h - y;
    },

    placed,
  };
}

/** Greedy word wrap with a measuring function — words never split. */
export function wrapWords(words, measure, maxW) {
  const lines = [];
  let cur = [];
  for (const w of words) {
    const next = cur.length ? [...cur, w] : [w];
    if (cur.length && measure(next.join(" ")) > maxW) {
      lines.push(cur.join(" "));
      cur = [w];
    } else cur = next;
  }
  if (cur.length) lines.push(cur.join(" "));
  return lines;
}

/**
 * Break a line of linear maths at its top-level "=" signs (not inside brackets),
 * keeping the "=" at the start of each continuation: "y = a = b" → ["y", "= a", "= b"].
 */
export function splitAtEquals(src) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of String(src)) {
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth = Math.max(0, depth - 1);
    if (ch === "=" && depth === 0 && cur.trim()) {
      out.push(cur.trim());
      cur = "=";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Do two boxes overlap (touching edges do not count)? */
export function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}
