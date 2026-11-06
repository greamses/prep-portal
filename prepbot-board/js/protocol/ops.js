/* ============================================================================
   PrepBot Board — what a beat may ask the board to do
   ----------------------------------------------------------------------------
   The tutor speaks in BEATS: one sentence, and the strokes drawn while it is
   said. A beat comes from a language model, so nothing in it is trusted: every
   field is checked here, numbers are clamped, strings are cut short, and an op
   the board does not know is simply dropped — the sentence is still spoken.

     { say: "A kicked ball does two things at once.", do: [op, ...] }
     { ask: "What happens to the forward speed?",     do: [op, ...] }   stop and wait
     { end: true }

   Positions are SEMANTIC. The model says "write the next line" or "a point at
   (2, 3) on graph g", never a pixel: the board does the placing, so nothing it
   draws can land on top of anything else.

   Pure: no DOM, no imports — node-testable (scripts/check-whiteboard.mjs).
   ========================================================================== */

export const TONES = ["ink", "blue", "red", "green", "orange", "yellow"];

const ID_RE = /^[a-z][a-z0-9_-]{0,23}$/i;
const LIMIT = 1e6;

const str = (v, max) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const num = (v) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.max(-LIMIT, Math.min(LIMIT, n)) : null;
};
const pair = (v) => {
  if (!Array.isArray(v) || v.length !== 2) return null;
  const a = num(v[0]), b = num(v[1]);
  return a === null || b === null ? null : [a, b];
};
const range = (v) => {
  const p = pair(v);
  if (!p || p[0] === p[1]) return null;
  return p[0] < p[1] ? p : [p[1], p[0]];
};
const tone = (v) => (TONES.includes(v) ? v : null);

/* A line written without its $…$ that is plainly an equation ("2x + 5 - 5 = 17 - 5")
   is set as maths, so it reads like the working it is. Words keep the hand. */
const FN_WORDS = new Set(["sin", "cos", "tan", "log", "ln", "sqrt", "theta", "pi", "alpha", "beta"]);
function looksLikeMaths(text) {
  if (!text || text.includes("$") || !/[=<>]/.test(text)) return text;
  if (!/^[\w\s().,+\-*/^=<>]+$/.test(text)) return text;
  const words = text.match(/[a-z]{2,}/gi) || [];
  if (words.some((w) => !FN_WORDS.has(w.toLowerCase()))) return text;
  return `$${text}$`;
}

let auto = 0;
let penTurn = 0;
const idOf = (v, prefix) => (typeof v === "string" && ID_RE.test(v) ? v : `${prefix}${++auto}`);

/* Each op: what it needs, made safe. Returning null drops the op. */
const SPEC = {
  /* A line of writing on the main column: words, maths, or both. Maths sits
     between $…$ (linear, 1/2 and x^2, or TeX); `math` is the shorthand for a
     line that is only maths. */
  write(o) {
    let text = looksLikeMaths(str(o.text, 180));
    const math = str(o.math, 140);
    if (math) text = text ? `${text} $${math}$` : `$${math}$`;
    if (!text) return null;
    const as = ["title", "step", "note"].includes(o.as) ? o.as : "step";
    return { op: "write", id: idOf(o.id, "w"), text, as, tone: tone(o.tone) || (as === "note" ? "blue" : "ink") };
  },

  /* Axes in the figure panel. One graph to a page. */
  graph(o) {
    const x = range(o.x) || [-1, 10];
    const y = range(o.y) || [-1, 10];
    return {
      op: "graph", id: idOf(o.id, "g"), x, y,
      xlabel: str(o.xlabel, 30), ylabel: str(o.ylabel, 30),
      grid: o.grid !== false,
    };
  },

  /* A curve, computed from its equation — never guessed. */
  plot(o) {
    const expr = str(o.expr, 120);
    if (!expr || typeof o.on !== "string") return null;
    return { op: "plot", id: idOf(o.id, "p"), on: o.on, expr, x: range(o.x), tone: tone(o.tone) || "blue", label: str(o.label, 30) };
  },

  point(o) {
    const x = num(o.x), y = num(o.y);
    if (x === null || y === null || typeof o.on !== "string") return null;
    return { op: "point", id: idOf(o.id, "pt"), on: o.on, x, y, label: str(o.label, 30), tone: tone(o.tone) || "red" };
  },

  /* An arrow (or plain line, `head:false`) — on a graph in its own units, or on
     the figure panel's 0–10 grid when there is no graph to stand on. */
  arrow(o) {
    const from = pair(o.from), to = pair(o.to);
    if (!from || !to || (from[0] === to[0] && from[1] === to[1])) return null;
    const on = typeof o.on === "string" && o.on !== "grid" ? o.on : "grid";
    const clampGrid = (p) => (on === "grid" ? p.map((v) => Math.max(0, Math.min(10, v))) : p);
    return {
      op: "arrow", id: idOf(o.id, "a"), on, from: clampGrid(from), to: clampGrid(to),
      label: str(o.label, 30), dashed: !!o.dashed, head: o.head !== false, tone: tone(o.tone) || "red",
    };
  },

  /* A PICTURE, built from shapes the way a teacher draws one: on the figure
     panel's 0–10 grid ("on":"grid", the default) or on a graph in its units.
     circle {at, r, shade}  ellipse {at, w, h}  rect {at, w, h}  (at = centre)
     polygon {points}  curve {points} (a smooth line through them)
     sector {at, r, from, to} (a slice, degrees anticlockwise from 3 o'clock) */
  shape(o) {
    const KINDS = ["circle", "ellipse", "rect", "polygon", "curve", "sector"];
    const kind = KINDS.includes(o.kind) ? o.kind : null;
    if (!kind) return null;
    const on = typeof o.on === "string" && o.on !== "grid" ? o.on : "grid";
    const size = (v, d) => { const n = num(v); return n === null ? d : Math.max(0.05, Math.min(on === "grid" ? 10 : LIMIT, Math.abs(n))); };
    const out = { op: "shape", id: idOf(o.id, "s"), kind, on, tone: tone(o.tone) || "ink", label: str(o.label, 30), dashed: !!o.dashed };
    out.fill = o.fill === "none" || !o.fill ? null : tone(o.fill) || null;
    if (["circle", "ellipse", "rect", "sector"].includes(kind)) {
      out.at = pair(o.at) || [5, 5];
      if (kind === "circle" || kind === "sector") out.r = size(o.r, 2);
      else { out.w = size(o.w, 3); out.h = size(o.h, 2); }
      if (kind === "circle") out.shade = ["left", "right", "top", "bottom", "full"].includes(o.shade) ? o.shade : null;
      if (kind === "sector") {
        const f = num(o.from), t = num(o.to);
        out.from = f === null ? 0 : f;
        out.to = t === null ? 90 : t;
        if (out.to === out.from) return null;
      }
    } else {
      const pts = (Array.isArray(o.points) ? o.points : []).slice(0, 24).map(pair).filter(Boolean);
      if (pts.length < 2 || (kind === "polygon" && pts.length < 3)) return null;
      out.points = pts;
    }
    return out;
  },

  /* A highlighter swept behind something already on the board. */
  /* (no tone given: the highlighters are used in turn, as a teacher picks up the next pen) */
  highlight(o) {
    if (typeof o.target !== "string") return null;
    const pens = ["yellow", "green", "blue", "orange", "red"];
    const given = tone(o.tone);
    return { op: "highlight", id: idOf(o.id, "h"), target: o.target, tone: given && given !== "ink" ? given : pens[(penTurn++) % pens.length] };
  },

  /* Go back to an earlier SECTION of the canvas (1, 2, …) to point at what is
     there: the camera moves to it, and marks and writing go into it. */
  look(o) {
    const n = Math.round(num(o.section) || 0);
    return n >= 1 ? { op: "look", section: n } : null;
  },

  underline(o) {
    if (typeof o.target !== "string") return null;
    return { op: "underline", id: idOf(o.id, "u"), target: o.target, tone: tone(o.tone) || "orange" };
  },

  circle(o) {
    if (typeof o.target !== "string") return null;
    return { op: "circle", id: idOf(o.id, "c"), target: o.target, tone: tone(o.tone) || "red" };
  },

  /* A fresh board. The old one is kept in the lesson's history. */
  clear() {
    return { op: "clear" };
  },
};

export const OP_NAMES = Object.keys(SPEC);

/** One op, made safe — or null when it cannot be drawn. */
export function cleanOp(raw) {
  if (!raw || typeof raw !== "object") return null;
  const fn = SPEC[raw.op];
  if (!fn) return null;
  try {
    return fn(raw);
  } catch {
    return null;
  }
}

/** One beat, made safe — or null when it has nothing to say or draw. */
export function cleanBeat(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.end === true) return { end: true, say: str(raw.say, 300), do: [] };
  /* what is SAID never carries maths markup: "$g$" is spoken as "g" */
  const spoken = (v) => str(v, 300).replace(/\$/g, "");
  const ask = spoken(raw.ask);
  const say = ask || spoken(raw.say);
  const ops = (Array.isArray(raw.do) ? raw.do : []).slice(0, 8).map(cleanOp).filter(Boolean);
  if (!say && !ops.length) return null;
  const beat = { say, do: ops };
  if (ask) beat.ask = true;
  return beat;
}

/**
 * What is on the board, for the NEXT turn's prompt: the model has to be able to
 * point back at what it wrote ("underline w3"), so each item carries its id,
 * its kind and the words or equation it holds — and nothing it does not need.
 */
export function boardSummary(items, max = 40) {
  return items.slice(-max).map((it) => {
    const out = { id: it.id, kind: it.op };
    if (it.text) out.text = it.text;
    if (it.expr) out.expr = it.expr;
    if (it.on) out.on = it.on;
    if (it.op === "graph") { out.x = it.x; out.y = it.y; }
    if (it.label) out.label = it.label;
    return out;
  });
}
