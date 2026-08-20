/* ============================================================================
   Sticky notes — the mathematics on one
   ----------------------------------------------------------------------------
   A note is paper you write on, and on real paper a formula is written in the
   middle of a sentence. This is the part that lets one be: TeX in, a picture of
   set mathematics out, drawable into any 2D context and into a contenteditable
   alike.

   MathJax is the site's typesetter everywhere else, so it is the typesetter
   here too — but used in a different mode. Everything else on the site TYPESETS
   AN ELEMENT ON THE PAGE, which needs the element to have a box to measure an
   ex in. A sticky note has no such element: it is painted into a WebGL texture.
   So this asks MathJax for ONE PIECE of mathematics with the em and the ex
   given to it outright (`tex2svg`), which is synchronous, measures nothing, and
   cannot be caught by the "typeset two things at once and get NaNex" trap the
   page-typesetting path has to be careful of.

   ── nothing here is required ──────────────────────────────────────────────
   MathJax is a script on a CDN and may be seconds away or never come at all,
   and a note is a note either way. Every call falls back to the SOURCE TEXT —
   which is what a learner typed, so it always says something — and the host is
   told when a picture has arrived so it can paint again. A note is never blank
   and never shows a raw \(…\).
   ========================================================================== */

/* How much bigger than its drawn size a formula is rasterised, so it stays
   crisp when a canvas scales it up — a note's texture is already drawn at 2×
   and the camera can come closer than that. */
const SHARPNESS = 3;

/* An ex is half an em here, and told to MathJax rather than measured off a
   page. Only the RATIO matters: it decides how big a superscript comes out
   next to its base, and a half is what the fonts this site uses actually have. */
const EX = 0.5;

const cache = new Map();       // "tex|px|ink" → { w, h, depth, img, failed }
const sizes = new Map();       // "tex|px" → { w, h, depth }
const waiting = new Set();     // hosts to tell when a picture lands

/**
 * Ask MathJax for one piece of mathematics, with its glyphs INSIDE it.
 *
 * This is load-bearing and cost an afternoon. The site configures MathJax with
 * a GLOBAL font cache: every formula on a page is drawn with `<use>` references
 * into one shared block of glyph outlines kept elsewhere in the document. That
 * is exactly right for a page and exactly wrong here — a formula that is going
 * to be serialised on its own, or drawn into a canvas as an image, is a
 * document of its own, and its references point at nothing. What you get is a
 * formula of precisely the right size with nothing whatever inside it.
 *
 * So the cache is switched to LOCAL for the one call and put back straight
 * after: every formula carries its own outlines, and the page's own typesetting
 * is left exactly as it was.
 */
function selfContained(tex, options) {
  const out = window.MathJax.startup?.output;
  const was = out?.options?.fontCache;
  if (out?.options) out.options.fontCache = "local";
  try {
    return window.MathJax.tex2svg(String(tex), options);
  } finally {
    if (out?.options && was !== undefined) out.options.fontCache = was;
  }
}

/** Is MathJax up and able to set a piece of mathematics this instant? */
export function mathReady() {
  return typeof window !== "undefined" && typeof window.MathJax?.tex2svg === "function";
}

/**
 * Be told when the next picture arrives.
 *
 * A host paints what it has and asks to be woken: exactly the way a note is
 * painted again when the web fonts turn up. One call, one wake — the host
 * repaints, and if anything is still missing it will ask again from there.
 */
export function whenMathDrawn(fn) {
  if (typeof fn === "function") waiting.add(fn);
}

function wake() {
  const all = [...waiting];
  waiting.clear();
  for (const fn of all) {
    try { fn(); } catch { /* a host that has gone away is not our business */ }
  }
}

/**
 * How big a piece of mathematics is, in note-pixels, written at `px`.
 *
 * `depth` is how far it hangs BELOW the baseline — the tail of a y, the bottom
 * half of a fraction — which is the one number needed to sit a formula on the
 * same line as the words round it.
 *
 * Without MathJax this is an estimate off the length of the source, which is
 * what will be drawn in that case anyway.
 */
export function measureMath(tex, px) {
  const key = tex + "|" + px;
  if (sizes.has(key)) return sizes.get(key);

  let out;
  if (!mathReady()) {
    // not cached: MathJax may arrive between one call and the next
    return { w: Math.max(px, String(tex).length * px * 0.5), h: px * 1.2, depth: px * 0.2, guess: true };
  }
  try {
    const svg = svgOf(tex, px);
    out = svg ? { w: svg.w, h: svg.h, depth: svg.depth } : null;
  } catch {
    out = null;
  }
  if (!out) out = { w: Math.max(px, String(tex).length * px * 0.5), h: px * 1.2, depth: px * 0.2, guess: true };
  sizes.set(key, out);
  return out;
}

/** MathJax's own SVG for one formula, with its size worked out in pixels. */
function svgOf(tex, px) {
  const container = selfContained(tex, {
    display: false,
    em: px,
    ex: px * EX,
    containerWidth: 100000, // never line-broken: a note wraps, a formula does not
  });
  const svg = container.querySelector("svg");
  if (!svg) return null;
  const ex = px * EX;
  const num = (v) => parseFloat(String(v || "0")) || 0;
  const w = num(svg.getAttribute("width")) * ex;
  const h = num(svg.getAttribute("height")) * ex;
  // MathJax says how far the box sits below the baseline as a negative align
  const depth = Math.max(0, -num(svg.style.verticalAlign) * ex);
  return { svg, w, h, depth };
}

/**
 * A picture of one formula, ready to draw — or null while it is being made.
 *
 * Cached by what it is, how big it is written and what colour it is written in,
 * because a note repaints on every keystroke and rasterising an SVG per press
 * would be a new image decode per press.
 */
export function mathPicture(tex, px, ink) {
  const key = tex + "|" + px + "|" + (ink || "");
  const had = cache.get(key);
  if (had) return had.img && had.img.complete && !had.failed ? had : null;
  if (!mathReady()) return null;

  const made = svgOf(tex, px);
  if (!made) { cache.set(key, { failed: true }); return null; }

  /* Serialised on its own, so `currentColor` has nothing to inherit from —
     the colour is put on the root, and the size is written in real pixels at a
     multiple of the drawn size so the picture is sharp when it is scaled up. */
  const svg = made.svg.cloneNode(true);
  /* Standing on its own it needs to say what it is: an image loaded from a data
     URL is parsed as a document, and one without these is not SVG at all. The
     xlink one matters as much — the glyph outlines are referenced with it. */
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  svg.setAttribute("width", made.w * SHARPNESS + "px");
  svg.setAttribute("height", made.h * SHARPNESS + "px");
  svg.setAttribute("color", ink || "#14130f");
  svg.style.color = ink || "#14130f";
  svg.style.verticalAlign = "";

  const entry = { w: made.w, h: made.h, depth: made.depth, img: new Image(), failed: false };
  entry.img.onload = () => wake();
  entry.img.onerror = () => { entry.failed = true; };
  entry.img.src = "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(new XMLSerializer().serializeToString(svg));
  cache.set(key, entry);
  return null; // this call gets the source text; the next one gets the picture
}

/**
 * The same formula as an element, for a contenteditable to hold.
 *
 * Falls back to the source in a monospace box, which is both honest and still
 * editable — the note says what the learner typed either way.
 */
export function mathNode(tex, doc = document, src = null) {
  const span = doc.createElement("span");
  span.className = "pp-note__eq";
  span.setAttribute("contenteditable", "false");
  span.setAttribute("data-tex", String(tex));
  /* What the learner actually TYPED, when that was not TeX — kept beside the
     TeX so opening the equation again gives back their own writing rather than
     the \frac{}{} it was turned into. See utils/components/math-linear.js. */
  if (src != null && String(src) !== String(tex)) span.setAttribute("data-src", String(src));
  span.setAttribute("title", "Tap to edit this equation");
  if (mathReady()) {
    try {
      const container = selfContained(tex, { display: false });
      const svg = container.querySelector("svg");
      if (svg) { span.appendChild(svg); return span; }
    } catch { /* fall through to the source */ }
  }
  span.textContent = String(tex);
  span.classList.add("is-source");
  return span;
}
