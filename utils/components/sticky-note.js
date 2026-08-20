/* ============================================================================
   Sticky notes — the site's note, as a component
   ----------------------------------------------------------------------------
   A note is paper you write on. This module owns what one IS and how one is
   DRAWN, and knows nothing about where it is being used: it has no imports, no
   framework beyond its own maths sibling, and never touches the page except
   through a 2D canvas context you hand it. The Manipulatives canvas paints
   notes into a WebGL texture with it; a plain page can paint one into an
   ordinary <canvas>; anything that can give it a context can show one.

   The look is .pp-sticky's (components.css): the same six papers, the -2deg
   tilt, the two shadows, the strip of tape. Paper is PAPER — the same pale
   colour in the light and in the dark — so these are fixed, not theme tokens.

   ── the model ─────────────────────────────────────────────────────────────
   A note's words are RUNS, not a string, because formatting belongs to a
   stretch of text and not to the whole note:

     run = { text, px, bold, italic, underline, font, ink, mark, tex }

   A run with a `tex` is MATHEMATICS: an equation written in the middle of the
   words, the way one is on real paper. It is ONE THING — it is never split,
   never wrapped and never half-formatted, because half an equation is not an
   equation. Its `text` is the source that was typed, so a note still reads as
   something everywhere a note is read as text, and js/sticky-math.js turns it
   into set mathematics wherever there is a MathJax to do it.

   `px`, `font`, `ink` and `mark` hold CSS-ready values rather than keys into the
   registries below, so a note is lossless: whatever a browser's own editing
   produced, we can store it and draw it back. SIZE IS A FORMAT LIKE ANY OTHER —
   it belongs to a stretch of text, so a heading word can sit in a sentence.

   ── the sizing rule ───────────────────────────────────────────────────────
   THE WRITING IS THE FIXED THING AND THE PAPER GROWS. Text that shrank to fit
   its note meant a long note was an unreadable one and the "bigger" key made
   the letters smaller, which is exactly backwards: on real paper you choose how
   big to write and the note is however big it needs to be. So a note is laid
   out at the size you asked for, wrapped at a maximum width, and the paper is
   cut to the result — WIDER until it reaches that maximum, and TALLER after.
   ========================================================================== */

import { measureMath, mathPicture, mathNode } from "./sticky-math.js";

/* ── registries ───────────────────────────────────────────────────────────── */

/** The six papers, as .pp-sticky--c0…c5 wears them. */
export const PAPERS = [
  { id: "butter", hex: "#fff3a8" },
  { id: "lilac", hex: "#e8c8ff" },
  { id: "leaf", hex: "#c8f0c0" },
  { id: "sky", hex: "#bfe3ff" },
  { id: "peach", hex: "#ffd7a3" },
  { id: "mint", hex: "#b8ece2" },
];

/** What you write WITH. Dark enough to read on every paper above. */
export const INKS = [
  { id: "ink", hex: "#14130f", name: "Ink" },
  { id: "red", hex: "#b3261e", name: "Red" },
  { id: "blue", hex: "#14508c", name: "Blue" },
  { id: "green", hex: "#1c6b3a", name: "Green" },
  { id: "plum", hex: "#6b2d7a", name: "Plum" },
  { id: "grey", hex: "#5c5750", name: "Grey" },
];

/** What you draw OVER it with. Pale enough that ink still reads through. */
export const MARKS = [
  { id: "none", hex: null, name: "No highlight" },
  { id: "yellow", hex: "#ffe870", name: "Yellow" },
  { id: "green", hex: "#a8f0a0", name: "Green" },
  { id: "pink", hex: "#ffb8d4", name: "Pink" },
  { id: "blue", hex: "#a8dcff", name: "Blue" },
];

/**
 * The faces a note may be written in.
 *
 * The site's own three first, then the two everyone reaches for, then the one
 * mathematics is set in: STIX Two is what MathJax renders with, so a note
 * beside a formula can be written in the same face as the formula. A host that
 * wants it web-safe should load "STIX Two Text" — it falls back through Cambria
 * Math and Latin Modern Math to a plain serif where it is missing.
 */
export const FONTS = [
  { id: "hand", name: "Hand", css: '"Shantell Sans", "Segoe Print", cursive' },
  { id: "display", name: "Display", css: '"Unbounded", system-ui, sans-serif' },
  { id: "mono", name: "Mono", css: '"JetBrains Mono", "Courier New", monospace' },
  { id: "calibri", name: "Calibri", css: 'Calibri, Carlito, "Segoe UI", sans-serif' },
  { id: "times", name: "Times New Roman", css: '"Times New Roman", Tinos, Times, serif' },
  { id: "math", name: "Math (STIX Two)", css: '"STIX Two Text", "STIX Two Math", "Cambria Math", "Latin Modern Math", serif' },
];

/** How big you are writing, in note-pixels — the twelve a word processor offers. */
export const SIZES = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48];
export const DEFAULT_SIZE = 4; // 16px

/* Paper geometry, in note-pixels. A note-pixel is the unit everything here is
   measured in; the caller decides how big one is on ITS surface. */
export const PAD_X = 18;
export const PAD_TOP = 22;   // room for the tape
export const PAD_BOTTOM = 16;
export const MIN_W = 120;
export const MAX_W = 460;
export const MIN_H = 78;
export const LINE = 1.34;    // line height, as a multiple of the writing size
export const TILT = -0.035;  // the -2deg every note on this site is stuck on at

export const MAX_CHARS = 2000;

/* ── the model ────────────────────────────────────────────────────────────── */

const clampIndex = (n, len) => Math.max(0, Math.min(len - 1, n | 0));

export function blankRun(over = {}) {
  return {
    text: "",
    px: SIZES[DEFAULT_SIZE],   // how big this stretch is written, in note-pixels
    bold: false,
    italic: false,
    underline: false,
    font: FONTS[0].css,
    ink: INKS[0].hex,
    mark: null,
    tex: null,     // set, and this stretch is an equation rather than words
    src: null,     // what was TYPED, when that was not the TeX — see mathNode
    ...over,
  };
}

/** One equation, as a run. Its text is the source, so it reads as something. */
export function mathRun(tex, over = {}) {
  const body = String(tex || "").trim();
  return blankRun({ ...over, text: body, tex: body });
}

/** Is this stretch an equation rather than words? */
export const isMath = (run) => !!(run && run.tex);

/** The nearest size we offer to a measured one. */
export function snapSize(px) {
  let best = SIZES[DEFAULT_SIZE];
  for (const s of SIZES) if (Math.abs(s - px) < Math.abs(best - px)) best = s;
  return best;
}

/** One plain unformatted run — the note you get by just typing. */
export function plainRuns(text, over = {}) {
  return [blankRun({ ...over, text: String(text || "") })];
}

export function makeNote({ text = "", runs = null, paper = 0, size = DEFAULT_SIZE } = {}) {
  return {
    runs: runs && runs.length ? normalise(runs) : plainRuns(text),
    paper: ((paper % PAPERS.length) + PAPERS.length) % PAPERS.length,
    size: clampIndex(size, SIZES.length),
    rev: 0,
  };
}

/** The words with the formatting taken off — for titles, search, aria labels. */
export function noteText(note) {
  return (note.runs || []).map((r) => r.text).join("");
}

/**
 * Change a note. Every edit comes through here so `rev` is always bumped —
 * that counter is what tells a view its note has changed, and a view that
 * watched the text alone would miss a note that only went bold.
 */
export function editNote(note, { runs, text, paper, size } = {}) {
  if (runs) note.runs = normalise(runs);
  else if (text != null) note.runs = plainRuns(text, note.runs?.[0] || {});
  if (paper != null) note.paper = ((paper % PAPERS.length) + PAPERS.length) % PAPERS.length;
  if (size != null) note.size = clampIndex(size, SIZES.length);
  note.rev = (note.rev || 0) + 1;
  return note;
}

/** Drop empty runs, weld neighbours that are dressed alike, and cap the length. */
export function normalise(runs) {
  const out = [];
  let left = MAX_CHARS;
  for (const r of runs) {
    if (!r || !r.text) continue;
    const text = r.text.slice(0, Math.max(0, left));
    if (!text) break;
    left -= text.length;
    const last = out[out.length - 1];
    if (last && sameStyle(last, r)) last.text += text;
    else out.push(blankRun({ ...r, text }));
  }
  return out.length ? out : plainRuns("");
}

const STYLE_KEYS = ["px", "bold", "italic", "underline", "font", "ink", "mark"];
export function sameStyle(a, b) {
  /* Two equations are two equations however alike they are dressed: welded
     together they would be one formula reading "x+1x+1", which is a different
     piece of mathematics from the two that were written. */
  if (isMath(a) || isMath(b)) return false;
  return STYLE_KEYS.every((k) => (a[k] || null) === (b[k] || null));
}

/* ── dressing a stretch of text ───────────────────────────────────────────── */

/** The runs covering characters [a, b) — for asking what is already there. */
export function runsOver(runs, a, b) {
  const out = [];
  let at = 0;
  for (const r of runs) {
    const end = at + r.text.length;
    if (end > a && at < b) out.push(r);
    at = end;
  }
  return out;
}

/**
 * Dress characters [a, b) and leave the rest alone.
 *
 * This is how EVERY pen works, rather than `document.execCommand`. The browser's
 * own editing is the only thing that will bold a selection spanning three
 * elements — but it rewrites the markup as it pleases while doing it, and an
 * underline put on before a size change simply vanished when the size change
 * restructured the nodes around it. Splitting runs at two character offsets
 * cannot lose anything: the words do not move and every other run is copied
 * across untouched.
 */
export function restyle(runs, a, b, patch) {
  if (b <= a) return runs.map((r) => ({ ...r }));
  const out = [];
  let at = 0;
  for (const r of runs) {
    const start = at;
    const end = at + r.text.length;
    at = end;
    if (end <= a || start >= b) { out.push({ ...r }); continue; }

    /* An equation is dressed WHOLE or not at all. Cutting one at a character
       offset would leave two runs each holding half a formula, and half a
       formula does not typeset — so a highlight that touches an equation at
       all takes the whole of it with it. */
    if (isMath(r)) { out.push({ ...r, ...patch, tex: r.tex, text: r.text }); continue; }

    const pre = Math.max(0, a - start);
    const post = Math.min(r.text.length, Math.max(0, b - start));
    if (pre) out.push({ ...r, text: r.text.slice(0, pre) });
    out.push({ ...r, ...patch, text: r.text.slice(pre, post) });
    if (post < r.text.length) out.push({ ...r, text: r.text.slice(post) });
  }
  return normalise(out);
}

/**
 * What a toggle should do to a stretch: turn it OFF when every bit of it is
 * already on, and ON otherwise — so a half-bold selection goes fully bold
 * before it goes plain, which is what every editor does.
 */
export function toggleOver(runs, a, b, key) {
  const covered = runsOver(runs, a, b);
  if (!covered.length) return true;
  return !covered.every((r) => !!r[key]);
}

/* ── measuring and laying out ─────────────────────────────────────────────── */

let scratch = null;
function measurer() {
  if (!scratch) {
    const c = typeof document !== "undefined" ? document.createElement("canvas") : null;
    scratch = c ? c.getContext("2d") : null;
  }
  return scratch;
}

/* The two weights a note is written at.

   PLAIN MUST BE UNDER 600. A browser calls anything from 600 up "bold", so a
   note whose ordinary writing was 600 had its bold key inverted: pressing it on
   plain text turned the weight DOWN, and reading the result back said the plain
   text had been bold all along. 500 and 700 are unambiguous on both counts. */
export const WEIGHT_PLAIN = 500;
export const WEIGHT_BOLD = 700;

/** The CSS font string for a run — the size is the run's own. */
export function fontOf(run) {
  const px = run.px || SIZES[DEFAULT_SIZE];
  const weight = run.bold ? WEIGHT_BOLD : WEIGHT_PLAIN;
  return `${run.italic ? "italic " : ""}${weight} ${px}px ${run.font || FONTS[0].css}`;
}

/**
 * Break a note's runs into lines that fit, and say how big its paper must be.
 *
 * Words are wrapped; a newline that was typed is honoured. Nothing is ever
 * shrunk — if a single word is longer than the widest line allowed it simply
 * sticks out into the margin, which is what a felt pen does on real paper.
 *
 * Returns { width, height, lines }, all in note-pixels, where each line is
 * { frags: [{ run, text, w }], w, h }.
 */
export function layoutNote(note, { maxWidth = MAX_W } = {}) {
  const g = measurer();
  const room = Math.max(60, maxWidth - PAD_X * 2);
  const runs = note.runs && note.runs.length ? note.runs : plainRuns("");
  const pxOf = (run) => run.px || SIZES[DEFAULT_SIZE];

  /* One flat list of pieces: a word, a run of spaces, or a hard break. Keeping
     the spaces as pieces is what lets a line be measured exactly as it will be
     drawn, rather than re-joined with assumed gaps. */
  const pieces = [];
  for (const run of runs) {
    /* An equation is ONE piece: never broken at a space, never wrapped in the
       middle of itself. "x + 1" is three words and one formula. */
    if (isMath(run)) { pieces.push({ run, text: run.text, math: true }); continue; }
    for (const bit of String(run.text).split(/(\n|[^\S\n]+)/)) {
      if (bit === "") continue;
      pieces.push({ run, text: bit, br: bit === "\n", space: /^[^\S\n]+$/.test(bit) });
    }
  }

  /* A line is as tall as the BIGGEST thing written on it, so a heading word in
     the middle of a sentence pushes its own line apart and nothing else. */
  const lines = [];
  let line = { frags: [], w: 0, px: 0, tall: 0 };
  const wrap = () => {
    line.px = line.px || SIZES[DEFAULT_SIZE];
    /* A line is as tall as the biggest thing on it — and a formula with a
       fraction in it is taller than the writing it is set at, so it pushes its
       own line apart rather than being clipped by the line above. */
    line.h = Math.max(line.px * LINE, line.tall * 1.12);
    lines.push(line);
    line = { frags: [], w: 0, px: 0, tall: 0 };
  };

  for (const p of pieces) {
    if (p.br) { wrap(); continue; }
    const px = pxOf(p.run);
    let w;
    let box = null;
    if (p.math) {
      box = measureMath(p.run.tex, px);
      w = box.w;
    } else if (g) {
      g.font = fontOf(p.run);
      w = g.measureText(p.text).width;
    } else {
      w = p.text.length * px * 0.55;
    }
    // a space that would push the line over is simply where the line ends
    if (line.w + w > room && line.frags.length) {
      if (p.space) { wrap(); continue; }
      wrap();
    }
    line.frags.push({ run: p.run, text: p.text, w, px, math: !!p.math, box });
    line.w += w;
    line.px = Math.max(line.px, px);
    if (box) line.tall = Math.max(line.tall, box.h);
  }
  wrap();

  // trailing spaces must not widen the paper they hang off the end of
  for (const l of lines) {
    while (l.frags.length && /^[^\S\n]+$/.test(l.frags[l.frags.length - 1].text)) {
      l.w -= l.frags.pop().w;
    }
  }

  const widest = lines.reduce((n, l) => Math.max(n, l.w), 0);
  const tall = lines.reduce((n, l) => n + l.h, 0);
  return {
    lines,
    width: Math.max(MIN_W, Math.min(maxWidth, Math.ceil(widest + PAD_X * 2))),
    height: Math.max(MIN_H, Math.ceil(tall + PAD_TOP + PAD_BOTTOM)),
  };
}

/* ── drawing ──────────────────────────────────────────────────────────────── */

/**
 * Paint a note into any 2D context.
 *
 * `width`/`height` are the note-pixel size of the SURFACE, which should be the
 * layout's own size or bigger; the note is drawn centred in it, so a caller
 * that has to round up to a grid gets even margins rather than a shifted note.
 *
 * `tilt` is the -2deg the paper is stuck on at. A caller that has already
 * rotated its own surface passes 0.
 *
 * Returns true when a formula on the note is still being made into a picture,
 * so the caller knows to paint again once it is.
 */
export function paintSticky(g, note, layout, { width, height, tilt = TILT, shadow = true } = {}) {
  const W = width ?? layout.width;
  const H = height ?? layout.height;
  const paper = PAPERS[note.paper]?.hex || PAPERS[0].hex;
  const pw = layout.width;
  const ph = layout.height;

  g.save();
  g.translate(W / 2, H / 2);
  if (tilt) g.rotate(tilt);
  g.textAlign = "left";
  g.textBaseline = "middle";

  /* .pp-sticky's two shadows. Canvas takes one at a time, so the rectangle is
     laid down twice — the soft one thrown down and right, then the hairline
     right under the paper. */
  const put = () => g.fillRect(-pw / 2, -ph / 2, pw, ph);
  g.fillStyle = paper;
  if (shadow) {
    g.shadowColor = "rgba(20,19,15,0.3)";
    g.shadowBlur = 14;
    g.shadowOffsetX = 4;
    g.shadowOffsetY = 8;
    put();
    g.shadowColor = "rgba(20,19,15,0.1)";
    g.shadowBlur = 2;
    g.shadowOffsetX = 0;
    g.shadowOffsetY = 2;
  }
  put();
  g.shadowColor = "transparent";
  g.shadowBlur = 0;
  g.shadowOffsetX = 0;
  g.shadowOffsetY = 0;

  // the strip of tape across the top, as .pp-sticky--tape wears it
  const tapeW = Math.min(pw * 0.42, 92);
  const tapeH = 15;
  g.save();
  g.translate(0, -ph / 2);
  g.rotate(-0.061);
  g.fillStyle = "rgba(255,255,255,0.45)";
  g.fillRect(-tapeW / 2, -tapeH * 0.55, tapeW, tapeH);
  g.strokeStyle = "rgba(0,0,0,0.1)";
  g.lineWidth = 1;
  g.strokeRect(-tapeW / 2, -tapeH * 0.55, tapeW, tapeH);
  g.restore();

  const waiting = paintRuns(g, layout, -pw / 2, -ph / 2);
  g.restore();
  return waiting;
}

/**
 * The writing itself, from the top-left corner of the paper.
 *
 * Returns true when something on the note is not drawn yet — a formula whose
 * picture is still being made. The caller paints again when it is told the
 * picture has arrived, exactly the way a note is painted again when the web
 * fonts turn up.
 */
export function paintRuns(g, layout, x0, y0) {
  let y = y0 + PAD_TOP;
  let waiting = false;

  for (const line of layout.lines) {
    let x = x0 + PAD_X;
    const mid = y + line.h / 2;
    for (const frag of line.frags) {
      const run = frag.run;
      const px = frag.px;

      if (frag.math) {
        if (!paintMath(g, frag, x, mid)) waiting = true;
        x += frag.w;
        continue;
      }

      g.font = fontOf(run);

      /* The highlighter goes down FIRST and behind — it is a pen drawn over the
         paper, under the writing, not a colour the letters are set on. */
      if (run.mark) {
        g.fillStyle = run.mark;
        g.fillRect(x, mid - px * 0.62, frag.w, px * 1.12);
      }

      g.fillStyle = run.ink || INKS[0].hex;
      g.fillText(frag.text, x, mid);

      if (run.underline) {
        const uy = Math.round(mid + px * 0.46) + 0.5;
        g.strokeStyle = run.ink || INKS[0].hex;
        g.lineWidth = Math.max(1, px * 0.06);
        g.beginPath();
        g.moveTo(x, uy);
        g.lineTo(x + frag.w, uy);
        g.stroke();
      }
      x += frag.w;
    }
    y += line.h;
  }
  return waiting;
}

/**
 * One equation, drawn where the words would have been.
 *
 * It sits on the line's BASELINE rather than in the middle of it: a formula
 * that hangs below the line (a fraction, a y with a tail) has to hang below the
 * words too, or the note reads as though the mathematics were floating. The
 * baseline of a line drawn "middle" is a shade under a third of the writing
 * size below the middle, which is close enough for every face here.
 *
 * Returns false while the picture is still being made — the source text is
 * drawn in the meantime, so the note always says what was typed.
 */
function paintMath(g, frag, x, mid) {
  const px = frag.px;
  const box = frag.box || { w: frag.w, h: px * 1.2, depth: px * 0.2 };
  const base = mid + px * 0.32;
  const pic = mathPicture(frag.run.tex, px, frag.run.ink || INKS[0].hex);

  if (frag.run.mark) {
    g.fillStyle = frag.run.mark;
    g.fillRect(x, base - (box.h - box.depth), frag.w, box.h);
  }
  if (pic && pic.img) {
    g.drawImage(pic.img, x, base - (box.h - box.depth), box.w, box.h);
    return true;
  }
  /* No picture yet, or no MathJax at all: the source, in the maths face, so it
     is legible as mathematics and obviously the thing that was typed. */
  g.font = `${WEIGHT_PLAIN} ${px}px ${FONTS[5].css}`;
  g.fillStyle = frag.run.ink || INKS[0].hex;
  g.fillText(frag.text, x, mid);
  return false;
}

/* ── the bridge to editable HTML ──────────────────────────────────────────── */

/**
 * Runs → nodes for a contenteditable.
 *
 * BUILT, not concatenated. A font stack has double quotes in it ("Shantell
 * Sans"), and putting one inside style="…" ends the attribute right there — the
 * colour, the weight and the underline after it were thrown away, so a note
 * reopened to be edited came up plain and the next keystroke made that real.
 * Setting the properties on a real element cannot go wrong that way.
 */
export function runsToNodes(runs, doc = document) {
  const frag = doc.createDocumentFragment();
  for (const r of runs || []) {
    /* An equation goes in as ONE element that cannot be typed into: the caret
       steps over it, backspace takes the whole of it, and a press on it opens
       it to be edited — which is what a word processor does with one. */
    if (isMath(r)) {
      const eq = mathNode(r.tex, doc, r.src || null);
      eq.style.fontSize = (r.px || SIZES[DEFAULT_SIZE]) + "px";
      eq.style.color = r.ink || INKS[0].hex;
      if (r.mark) eq.style.backgroundColor = r.mark;
      frag.appendChild(eq);
      continue;
    }
    const lines = String(r.text).split("\n");
    lines.forEach((line, i) => {
      if (i) frag.appendChild(doc.createElement("br"));
      if (!line) return;
      const span = doc.createElement("span");
      const s = span.style;
      s.fontSize = (r.px || SIZES[DEFAULT_SIZE]) + "px";
      s.fontFamily = r.font || FONTS[0].css;
      s.color = r.ink || INKS[0].hex;
      s.fontWeight = r.bold ? WEIGHT_BOLD : WEIGHT_PLAIN;
      s.fontStyle = r.italic ? "italic" : "normal";
      s.textDecoration = r.underline ? "underline" : "none";
      if (r.mark) s.backgroundColor = r.mark;
      span.textContent = line;
      frag.appendChild(span);
    });
  }
  return frag;
}

/** The same, as a string — for anywhere that needs one (a preview, an export). */
export function runsToHTML(runs, doc = document) {
  const box = doc.createElement("div");
  box.appendChild(runsToNodes(runs, doc));
  return box.innerHTML;
}

const HEX = (css) => {
  const m = String(css || "").match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!m) return /^#[0-9a-f]{3,8}$/i.test(css) ? css.toLowerCase() : null;
  if (m[4] !== undefined && Number(m[4]) === 0) return null; // transparent
  const h = (n) => Number(n).toString(16).padStart(2, "0");
  return "#" + h(m[1]) + h(m[2]) + h(m[3]);
};

/**
 * An edited contenteditable → runs.
 *
 * Read off the COMPUTED style of each text node's parent rather than by
 * unpicking the markup: a browser's own editing produces whatever nesting of
 * spans, <b>s and <font>s it likes, and the computed style is the one answer
 * that is right whatever it produced.
 */
export function runsFromDOM(root) {
  const runs = [];
  /* Everything INSIDE an equation is refused: it is a picture of mathematics
     and not writing, and reading its paths back would put a page of SVG into
     the note. The equation element itself is still visited, and what it holds
     is the source it was typeset from. */
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute?.("data-tex")) {
        return NodeFilter.FILTER_ACCEPT;
      }
      const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      if (el && el.closest && el.closest("[data-tex]")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node = walk.nextNode();
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName;
      if (node.hasAttribute?.("data-tex")) {
        const cs = getComputedStyle(node);
        runs.push(mathRun(node.getAttribute("data-tex"), {
          // what was typed, when that was not the TeX itself — see mathNode
          src: node.getAttribute("data-src") || null,
          px: snapSize(parseFloat(cs.fontSize) || SIZES[DEFAULT_SIZE]),
          ink: HEX(cs.color) || INKS[0].hex,
          /* The highlighter is read off the equation's OWN style and never off
             the computed one: an equation lights up under the pointer to say it
             can be opened, and a note read back while the pointer happened to
             be over it would take that hover for a highlighter and keep it. */
          mark: HEX(node.style.backgroundColor) || null,
        }));
      }
      else if (tag === "BR") runs.push(blankRun({ text: "\n" }));
      else if (tag === "DIV" || tag === "P") {
        // a block the editor started: everything before it ended a line
        if (runs.length && !/\n$/.test(runs[runs.length - 1].text)) {
          runs.push(blankRun({ text: "\n" }));
        }
      }
      node = walk.nextNode();
      continue;
    }
    const text = node.nodeValue;
    if (text) {
      const el = node.parentElement;
      const cs = el ? getComputedStyle(el) : null;
      const bg = cs ? HEX(cs.backgroundColor) : null;
      runs.push(blankRun({
        text,
        px: cs ? snapSize(parseFloat(cs.fontSize) || SIZES[DEFAULT_SIZE]) : SIZES[DEFAULT_SIZE],
        bold: cs ? Number(cs.fontWeight) >= 600 : false,
        italic: cs ? cs.fontStyle === "italic" : false,
        underline: cs ? /underline/.test(cs.textDecorationLine || cs.textDecoration || "") : false,
        font: cs ? nearestFont(cs.fontFamily) : FONTS[0].css,
        ink: (cs ? HEX(cs.color) : null) || INKS[0].hex,
        mark: bg && bg !== "#ffffff" ? bg : null,
      }));
    }
    node = walk.nextNode();
  }
  return normalise(runs);
}

/** Whichever of our faces a computed font-family is — we only offer three. */
function nearestFont(family) {
  const f = String(family || "").toLowerCase();
  for (const font of FONTS) {
    const first = font.css.split(",")[0].replace(/["']/g, "").trim().toLowerCase();
    if (f.includes(first)) return font.css;
  }
  return FONTS[0].css;
}
