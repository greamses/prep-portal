/* ============================================================================
   A PREPBOT FILM, WRITTEN DOWN
   ----------------------------------------------------------------------------
   Every lesson on this site has been a piece of JavaScript: a `build` that
   draws the screen and a list of steps whose `show` is a function. That is
   fine for the person who wrote it and no use at all to the person who wants
   to change a word, move a caption or hold a beat a second longer.

   So a film can also be a DOCUMENT — plain data, editable in the film editor
   (./film-editor.js), kept in Firestore (./film-store.js) and played on the
   same television as everything else (prepbot-tv.js).

   IT IS THE SAME KIT UNDERNEATH. The drawing primitives are the ones the
   coded films already use — `tile` and `art` place a thing at a percentage
   across and down the stage, and `acts` is the list of verbs that can happen
   to it (explain.js). A document is not a second way of making a film; it is
   those same calls, written as data instead of as code, so nothing can drift
   apart.

       {
         v: 1, title: "…",
         els:  [ { id, name, type, x, y, … } ],        what is on the stage
         steps:[ { say, hold, acts: [ { el, do, … } ] } ]   what happens, beat by beat
       }

   THE TIMELINE IS IN BEATS, NOT SECONDS, and that is not a shortcut. A step
   ends when PrepBot stops talking, so a film's clock is the voice: give a
   step a longer line and everything after it moves, which is exactly what you
   want and exactly what a seconds ruler would fight. Within a beat an act can
   be delayed by a fraction of a second, which is where the fine timing lives.

   EVERY STEP IS REPLAYED FROM THE START. The television rebuilds the stage
   and runs every earlier step instantly before animating the one you asked
   for, so an act must be safe to run twice and must only ever say where a
   thing ENDS UP. `acts` already does that — its `instant` path sets the final
   state and skips the animation.
   ========================================================================== */

import { tile, art, acts } from "/prep-math/activity/vedic-maths-workbook/js/explain.js";
import { esc } from "./video-kit.js";

export const DOC_VERSION = 1;

/* The ink a mark can take, named rather than numbered where it is chosen:
   these are the six the films already use (video.css .vm-t__in--c0…c5). */
export const INKS = [
  { c: 0, name: "Ink", hex: "#14130f" },
  { c: 1, name: "Plum", hex: "#7b4fa3" },
  { c: 2, name: "Leaf", hex: "#2e8b46" },
  { c: 3, name: "Sky", hex: "#2f6ea8" },
  { c: 4, name: "Orange", hex: "#d9632b" },
  { c: 5, name: "Teal", hex: "#1f8a8a" },
];
export const inkHex = (c) => (INKS[((c | 0) % INKS.length + INKS.length) % INKS.length] || INKS[0]).hex;

/** The tones a bar may be painted, the same five as the printed bar model. */
export const TONES = {
  sky: "#bfe3ff", butter: "#fff3a8", leaf: "#d6f0cf", peach: "#ffd9cf", plain: "#fffdf8",
};
const INK = "#2a2723";

/**
 * THE VERBS, and what each one needs. The editor reads this table to build
 * its own controls, so a verb added here grows a row in the inspector without
 * the editor being touched — and a verb the kit does not have cannot be
 * chosen at all.
 */
export const VERBS = {
  pop: { label: "Come on", needs: [] },
  fly: { label: "Fly in from", needs: ["from"] },
  move: { label: "Move to", needs: ["to"] },
  flip: { label: "Turn over and say", needs: ["text"] },
  roll: { label: "Roll over to", needs: ["text"] },
  pulse: { label: "Point at it", needs: [] },
  dim: { label: "Dim it", needs: ["amount"] },
  hide: { label: "Take it off", needs: [] },
  turn: { label: "Turn to", needs: ["degrees"] },
};
export const VERB_IDS = Object.keys(VERBS);

/** The kinds of thing that can stand on a stage. */
export const TYPES = {
  text: { label: "Words" },
  bar: { label: "Bar" },
  shape: { label: "Shape" },
  image: { label: "Picture" },
  svg: { label: "Drawing" },
};

/* ── a blank one ───────────────────────────────────────────────────────── */

let seq = 0;
/** An id that is unique within a document and readable in the editor. */
export const newId = (prefix = "e") => `${prefix}${Date.now().toString(36).slice(-4)}${(seq++).toString(36)}`;

export const blankEl = (type = "text") => ({
  id: newId(),
  name: TYPES[type]?.label || "Thing",
  type,
  x: 50,
  y: 28,
  c: 0,
  size: "m",
  w: 30,
  text: type === "text" ? "Words" : "",
  shape: "rect",
  fill: TONES.sky,
  stroke: INK,
  src: "",
  svg: "",
  parts: type === "bar" ? [{ n: 1, tone: "sky", label: "" }] : [],
});

export const blankStep = () => ({ say: "", hold: 0, acts: [] });

export const blankDoc = (title = "") => ({
  v: DOC_VERSION,
  title,
  els: [],
  steps: [blankStep()],
});

/** A document read back from anywhere: every field present, nothing trusted. */
export function normalise(raw, title = "") {
  const d = raw && typeof raw === "object" ? raw : {};
  const els = Array.isArray(d.els) ? d.els : [];
  const steps = Array.isArray(d.steps) && d.steps.length ? d.steps : [blankStep()];
  return {
    v: DOC_VERSION,
    title: typeof d.title === "string" ? d.title : title,
    els: els.map((e) => ({ ...blankEl(e?.type || "text"), ...e, id: e?.id || newId() })),
    steps: steps.map((s) => ({
      say: typeof s?.say === "string" ? s.say : "",
      hold: Number(s?.hold) || 0,
      acts: (Array.isArray(s?.acts) ? s.acts : [])
        .filter((a) => a && VERBS[a.do])
        .map((a) => ({ delay: 0, ...a })),
    })),
  };
}

/* ── drawing one thing ─────────────────────────────────────────────────── */

/** An arrow, a line, a box or a ring — the shapes a lesson actually points with. */
function shapeSvg(el) {
  const f = el.fill || "none";
  const s = el.stroke || INK;
  const sw = 3;
  if (el.shape === "ellipse") {
    return `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="47" ry="47" fill="${f}" stroke="${s}" stroke-width="${sw}"/></svg>`;
  }
  if (el.shape === "line") {
    return `<svg viewBox="0 0 100 12"><line x1="2" y1="6" x2="98" y2="6" stroke="${s}" stroke-width="${sw}" stroke-linecap="round"/></svg>`;
  }
  if (el.shape === "arrow") {
    return `<svg viewBox="0 0 100 24"><line x1="2" y1="12" x2="86" y2="12" stroke="${s}" stroke-width="${sw}" stroke-linecap="round"/>`
      + `<path d="M98 12 78 3v18Z" fill="${s}"/></svg>`;
  }
  return `<svg viewBox="0 0 100 60"><rect x="2" y="2" width="96" height="56" fill="${f}" stroke="${s}" stroke-width="${sw}"/></svg>`;
}

/**
 * A BAR, cut into its parts and labelled — the one drawing a maths lesson
 * cannot do without. It is drawn here rather than borrowed from the printed
 * workbook because a film's bar is measured in stage units and grows; the
 * printed one is measured in millimetres and does not.
 */
function barSvg(el) {
  const parts = (el.parts || []).filter(Boolean);
  if (!parts.length) return shapeSvg({ ...el, shape: "rect" });
  const total = parts.reduce((t, p) => t + Math.max(1, Number(p.n) || 1), 0);
  const H = 22;
  let x = 0;
  let out = "";
  parts.forEach((p) => {
    const w = (Math.max(1, Number(p.n) || 1) / total) * 100;
    out += `<rect x="${x.toFixed(2)}" y="1" width="${w.toFixed(2)}" height="${H - 2}"`
      + ` fill="${TONES[p.tone] || TONES.sky}" stroke="${INK}" stroke-width="0.5"/>`;
    if (p.label) {
      out += `<text x="${(x + w / 2).toFixed(2)}" y="${H / 2 + 2.4}" text-anchor="middle"`
        + ` font-family="JetBrains Mono, monospace" font-size="6" font-weight="700" fill="${INK}">${esc(p.label)}</text>`;
    }
    x += w;
  });
  return `<svg viewBox="0 0 100 ${H}">${out}</svg>`;
}

/** The inside of an element, as HTML — the one place its look is decided. */
export function elHtml(el) {
  if (el.type === "image") {
    return el.src ? `<img src="${esc(el.src)}" alt="" style="width:100%;display:block">` : shapeSvg({ ...el, shape: "rect", fill: "#eee" });
  }
  if (el.type === "svg") return el.svg || shapeSvg({ ...el, shape: "rect", fill: "#eee" });
  if (el.type === "bar") return barSvg(el);
  if (el.type === "shape") return shapeSvg(el);
  return "";
}

/** Put one element on a stage, hidden, ready for its act. */
export function mountEl(stage, el) {
  if (el.type === "text") {
    const box = tile(stage, el.id, el.text || "", el.x, el.y, { c: el.c || 0, size: el.size || "m" });
    return box;
  }
  return art(stage, el.id, el.x, el.y, Number(el.w) || 30, elHtml(el));
}

/* ── playing it ────────────────────────────────────────────────────────── */

/** Run one act against the kit's verbs. */
function run(a, k) {
  const d = Number(a.delay) || 0;
  switch (a.do) {
    case "pop": return k.pop(a.el, d);
    case "fly": return k.fly(a.el, Number(a.fx) || 0, Number(a.fy) || 0, d);
    case "move": return k.move(a.el, Number(a.tx) || 0, Number(a.ty) || 0, d);
    case "flip": return k.flip(a.el, a.text ?? "", a.c, d);
    case "roll": return k.roll(a.el, a.text ?? "", d);
    case "pulse": return k.pulse(a.el, d);
    case "dim": return k.dim(a.el, a.amount == null ? 0.35 : Number(a.amount), d);
    case "hide": return k.hide(a.el, d);
    case "turn": return k.turn(a.el, Number(a.deg) || 0, d);
    default: return undefined;
  }
}

/**
 * A document, as the television wants a film: a title, a `build` that lays the
 * stage out, and steps whose `show` runs that beat's acts.
 *
 *   playable(doc) → { title, build, steps }
 */
export function playable(raw, fallbackTitle = "") {
  const doc = normalise(raw, fallbackTitle);
  const build = (stage) => {
    const tv = document.createElement("div");
    tv.className = "vm-tv";
    stage.appendChild(tv);
    doc.els.forEach((el) => mountEl(stage, el));
  };
  const steps = doc.steps.map((s) => ({
    say: s.say,
    hold: s.hold || 0,
    show(stage, { gsap, instant } = {}) {
      const k = acts(stage, gsap, instant);
      s.acts.forEach((a) => run(a, k));
    },
  }));
  return { title: doc.title, build, steps };
}

/** Is there anything here worth playing? */
export const hasFilm = (doc) => !!(doc && Array.isArray(doc.steps) && doc.steps.some((s) => s?.say || s?.acts?.length));
