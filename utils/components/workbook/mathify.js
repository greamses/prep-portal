/* ============================================================================
   PRINTABLE WORKBOOK — every number and expression, set by MathJax
   ----------------------------------------------------------------------------
   The questions are written as plain sentences ("3x + 4 = 19", "180 − 110",
   "a 60° angle"), which is how they read in the code and how they are marked.
   On the PAPER the mathematics in them is typeset: a real minus, italic x, a
   raised ², fractions stacked — so the workbook reads like a textbook and not
   like a form.

   This finds the mathematics in the text of a finished block and swaps each
   run of it for MathJax's own drawing of it. Words stay words.

   WHAT COUNTS AS MATHEMATICS. A run of: numbers (3, 4.5, 1,000, 3 407),
   operators (+ − × ÷ = ≈ < > ≤ ≥ · : / %), brackets, √, π, ², ³, ^n, °,
   and single-letter unknowns — but a lone letter only when it is plainly one
   (next to a number or an operator: 3x, x + 4, a : b), or one of x, y, z, n on
   its own. "a triangle" and "corner A" are left alone.

   WHERE IT DOES NOT LOOK. Inside drawings (the figures set their own labels),
   answer boxes, the question numbers and section letters, and anything marked
   `.wb-nomath` / `[data-nomath]` — a written board or a place-value chart
   whose digits must stay in their columns.

   WHEN. After a block is built and BEFORE the pages are cut: typesetting
   changes how tall a line is, and pagination measures. MathJax's tex2svg is
   synchronous once MathJax has started, so this is too, and every formula is
   cached by its TeX — a page of "= 12"s is typeset once.

   MathJax is a script on a CDN and may be late or never come. The paper is
   plain text until it arrives, and whoever renders the paper is told once it
   has (whenMath) so it can render again. Nothing here throws.
   ========================================================================== */

const SRC = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
const SKIP = "svg, input, textarea, script, style, code, [contenteditable], .wb-answer, .wb-cell, .wb-line, " +
  ".wb-item__no, .wb-sec__letter, .wb-answers__no, .wb-nomath, [data-nomath], .wb-m";

/** Is MathJax up and able to set a formula this instant? */
export const mathReady = () => typeof window !== "undefined" && typeof window.MathJax?.tex2svg === "function";

let loading = null;
const waiting = new Set();

/** Load MathJax (once), configured the way the rest of the site configures it. */
export function loadMath() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (loading) return loading;
  loading = new Promise((resolve) => {
    const started = () => {
      const p = window.MathJax?.startup?.promise;
      if (p) p.then(() => resolve(true), () => resolve(false));
      else resolve(mathReady());
    };
    if (mathReady()) return resolve(true);
    if (!window.MathJax) {
      window.MathJax = {
        tex: { inlineMath: [["\\(", "\\)"]], displayMath: [["\\[", "\\]"]] },
        svg: { fontCache: "global", scale: 1.0 },
        startup: { typeset: false },
      };
    }
    let tag = document.querySelector(`script[src*="mathjax"]`);
    if (!tag) {
      tag = document.createElement("script");
      tag.src = SRC;
      tag.async = true;
      document.head.appendChild(tag);
    }
    if (window.MathJax?.startup?.promise) started();
    else {
      tag.addEventListener("load", started, { once: true });
      tag.addEventListener("error", () => resolve(false), { once: true });
    }
  }).then((ok) => {
    if (ok) {
      const all = [...waiting];
      waiting.clear();
      all.forEach((fn) => { try { fn(); } catch { /* a host that has gone is not our business */ } });
    }
    return ok;
  });
  return loading;
}

/** Be told once, when MathJax has arrived — to render the paper again, set. */
export function whenMath(fn) {
  if (mathReady()) return;
  waiting.add(fn);
  loadMath();
}

/* ── finding the mathematics ───────────────────────────────────────────── */

const OPS = { "+": "+", "−": "-", "–": "-", "×": "\\times ", "÷": "\\div ", "=": "=", "≈": "\\approx ", "<": "<", ">": ">",
  "≤": "\\le ", "≥": "\\ge ", ":": ":", "≠": "\\ne " };
/* not "·": on this paper it is the separator between phrases ("6 sides · π as
   22/7"), and multiplication is always written × */
const SUP = { "²": "2", "³": "3" };
const VULGAR = { "½": "\\tfrac{1}{2}", "¼": "\\tfrac{1}{4}", "¾": "\\tfrac{3}{4}", "⅓": "\\tfrac{1}{3}", "⅔": "\\tfrac{2}{3}" };
const LONE = new Set(["x", "y", "z", "n"]);
const isLetter = (c) => !!c && /\p{L}/u.test(c);
const isDigit = (c) => !!c && c >= "0" && c <= "9";

/**
 * Break a string into runs: [{ math: false, text }, { math: true, text, tex }].
 * A scanner rather than one regular expression, because what a letter IS
 * depends on what is next to it.
 */
export function splitMath(s) {
  const out = [];
  let plain = "";
  let i = 0;
  const n = s.length;

  /* one token at i, or null: [kind, text, tex, end] */
  function token(j) {
    const c = s[j];
    /* a number glued to letters is a name, not a number: A4, a code like K7Q2M */
    if (isDigit(c) && isLetter(s[j - 1])) return null;
    if (isDigit(c)) {
      let k = j;
      /* 1,000 and 3 407 are one number; 3, 4 is two */
      while (k < n) {
        if (isDigit(s[k])) { k++; continue; }
        if (s[k] === "." && isDigit(s[k + 1])) { k++; continue; }
        if (s[k] === "," && isDigit(s[k + 1]) && isDigit(s[k + 2]) && isDigit(s[k + 3]) && !isDigit(s[k + 4])) { k++; continue; }
        break;
      }
      const text = s.slice(j, k);
      return ["num", text, text.replace(/,/g, "{,}"), k];
    }
    if (isLetter(c) && !isLetter(s[j - 1]) && !isLetter(s[j + 1]) && !isDigit(s[j + 1]) && /[a-zA-Z]/.test(c)) return ["var", c, c, j + 1];
    if (c === "%") return ["post", c, "\\%", j + 1];
    if (c in OPS) return ["op", c, OPS[c], j + 1];
    if (c === "-" && (isDigit(s[j + 1]) || s[j + 1] === " ") && (j === 0 || s[j - 1] === " " || isDigit(s[j - 1]))) return ["op", c, "-", j + 1];
    if (c === "/") return ["slash", c, "/", j + 1];
    if (c in SUP) return ["sup", c, `^{${SUP[c]}}`, j + 1];
    if (c === "^" && isDigit(s[j + 1])) { let k = j + 1; while (isDigit(s[k])) k++; return ["sup", s.slice(j, k), `^{${s.slice(j + 1, k)}}`, k]; }
    if (c === "°") return ["deg", c, "^{\\circ}", j + 1];
    if (c === "(" ) return ["open", c, "(", j + 1];
    if (c === ")") return ["close", c, ")", j + 1];
    if (c === "√") return ["sqrt", c, "\\sqrt", j + 1];
    if (c === "π") return ["num", c, "\\pi ", j + 1];
    if (c in VULGAR) return ["num", c, VULGAR[c], j + 1];
    return null;
  }

  while (i < n) {
    const first = token(i);
    if (!first || first[0] === "close" || first[0] === "sup" || first[0] === "deg" || first[0] === "slash" || first[0] === "post" ||
        (first[0] === "op" && !["−", "-", "=", "<", ">", "≈", "≤", "≥", "≠"].includes(first[1]))) {
      plain += s[i];
      i++;
      continue;
    }
    /* grow a run: tokens, with at most one space between them */
    const toks = [];
    let j = i;
    let depth = 0;
    while (j < n) {
      let k = j;
      if (toks.length && s[k] === " ") k++;
      const t = token(k);
      if (!t) break;
      if (t[0] === "close" && depth === 0) break;
      /* a space then a letter that starts a WORD ends the run */
      if (t[0] === "var" && toks.length && k > j && !["op", "open", "slash"].includes(toks[toks.length - 1][0]) && !LONE.has(t[1])) break;
      /* two terms side by side with a space and nothing between them are two
         things, not one expression ("a 4-sided shape") — except the space that
         groups digits, 3 407 */
      const prev = toks[toks.length - 1];
      if (prev && k > j && ["var", "num", "close", "sup", "deg", "post"].includes(prev[0]) && ["var", "num", "open", "sqrt"].includes(t[0]) &&
          !(prev[0] === "num" && t[0] === "num" && /^\d{3}$/.test(t[1]))) break;
      if (t[0] === "open") depth++;
      if (t[0] === "close") depth--;
      toks.push([...t, k > j]);
      j = t[3];
    }
    /* never end on an operator, an open bracket or a colon of a sentence —
       unless the text ENDS there: "x =" then an answer box is an expression
       carrying on into the box, and is set whole */
    const intoBox = (t) => t && ["op", "slash"].includes(t[0]) && t[1] !== ":" && !s.slice(t[3]).trim();
    while (toks.length && ["op", "open", "slash", "sqrt"].includes(toks[toks.length - 1][0]) && !(toks.length > 1 && intoBox(toks[toks.length - 1]))) { toks.pop(); }
    while (toks.length && depth > 0 && toks[toks.length - 1][0] === "open") { toks.pop(); depth--; }
    const hasNum = toks.some((t) => t[0] === "num");
    const hasOp = toks.some((t) => t[0] === "op" || t[0] === "slash");
    const vars = toks.filter((t) => t[0] === "var");
    const balanced = toks.filter((t) => t[0] === "open").length === toks.filter((t) => t[0] === "close").length;
    const ok = toks.length && balanced && (hasNum || (vars.length && hasOp) || (toks.length === 1 && vars.length === 1 && LONE.has(vars[0][1])) ||
      (vars.length && toks.some((t) => t[0] === "sup")));
    if (!ok) {
      plain += s[i];
      i++;
      continue;
    }
    const end = toks[toks.length - 1][3];
    if (plain) { out.push({ math: false, text: plain }); plain = ""; }
    out.push({ math: true, text: s.slice(i, end), tex: texOf(toks) });
    i = end;
  }
  if (plain) out.push({ math: false, text: plain });
  return out;
}

/** The TeX for a run of tokens: fractions stacked, roots over what follows. */
function texOf(toks) {
  let tex = "";
  for (let k = 0; k < toks.length; k++) {
    const [kind, , t, , spaced] = toks[k];
    /* 3 407: a space between two numbers is a digit-group space */
    if (spaced && kind === "num" && toks[k - 1]?.[0] === "num") tex += "\\,";
    if (kind === "slash" && toks[k - 1]?.[0] === "num" && toks[k + 1]?.[0] === "num" && !toks[k][4] && !toks[k + 1][4]) {
      /* 22/7 → a small stacked fraction: take back the numerator */
      const top = toks[k - 1][2];
      tex = tex.slice(0, tex.length - top.length) + `\\tfrac{${top}}{${toks[k + 1][2]}}`;
      k++;
      continue;
    }
    if (kind === "sqrt") {
      const next = toks[k + 1];
      if (next?.[0] === "open") {
        let d = 0; let m = k + 1; let inner = "";
        for (; m < toks.length; m++) {
          if (toks[m][0] === "open") d++;
          if (toks[m][0] === "close") d--;
          if (m > k + 1 && d === 0) break;
          if (m > k + 1) inner += toks[m][2];
        }
        tex += `\\sqrt{${inner}}`;
        k = m;
        continue;
      }
      if (next) { tex += `\\sqrt{${next[2]}}`; k++; continue; }
    }
    tex += t;
  }
  return tex;
}

/* ── typesetting ───────────────────────────────────────────────────────── */

const cache = new Map();   // tex → an <svg> to clone, or null if MathJax refused it

/**
 * MathJax's drawing of one formula, with its glyphs INSIDE it. The site's
 * MathJax keeps one shared font cache for the page; a formula cloned about on
 * its own needs its own outlines or it is an empty box of the right size (the
 * same trap utils/components/sticky-math.js documents).
 */
function svgFor(tex) {
  if (cache.has(tex)) return cache.get(tex);
  let svg = null;
  try {
    const out = window.MathJax.startup?.output;
    const was = out?.options?.fontCache;
    if (out?.options) out.options.fontCache = "local";
    try {
      svg = window.MathJax.tex2svg(tex, { display: false }).querySelector("svg");
    } finally {
      if (out?.options && was !== undefined) out.options.fontCache = was;
    }
    if (svg && svg.querySelector("[data-mjx-error], merror")) svg = null;
  } catch {
    svg = null;
  }
  cache.set(tex, svg);
  return svg;
}

/**
 * Typeset every piece of mathematics in the text under `root`. Returns how
 * many formulas were set. Does nothing (and returns 0) until MathJax is up.
 */
export function mathify(root) {
  if (!mathReady() || !root) return 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (t) => {
      if (!t.nodeValue || !/[0-9½¼¾⅓⅔πxyzn√=+−×÷]/.test(t.nodeValue)) return NodeFilter.FILTER_REJECT;
      return t.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  let set = 0;
  for (const t of texts) {
    const parts = splitMath(t.nodeValue);
    if (!parts.some((p) => p.math)) continue;
    const frag = document.createDocumentFragment();
    for (const p of parts) {
      if (!p.math) { frag.appendChild(document.createTextNode(p.text)); continue; }
      const svg = svgFor(p.tex);
      if (!svg) { frag.appendChild(document.createTextNode(p.text)); continue; }
      const span = document.createElement("span");
      span.className = "wb-m";
      span.dataset.tex = p.tex;
      const pic = svg.cloneNode(true);
      pic.setAttribute("aria-hidden", "true");
      span.appendChild(pic);
      /* What it said, kept as TEXT beside the picture and hidden from the eye:
         MathJax's drawing has no text in it, and a screen reader, a copy and
         paste, and the interactive layer (which reads a tick's words to say
         the right answer) all need the words. */
      const src = document.createElement("span");
      src.className = "wb-m__src";
      src.textContent = p.text;
      span.appendChild(src);
      frag.appendChild(span);
      set++;
    }
    t.replaceWith(frag);
  }
  return set;
}
