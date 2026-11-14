/* ============================================================================
   THE WORD PROBLEM ON THE TV — typed out, set in MathJax, and marked up
   ----------------------------------------------------------------------------
     askHtml(text)          the question as markup: centred words, every number
                            and expression in MathJax, and the teacher's marks
                            waiting on it (circle, box, highlight, underline)
     typeAsk(box, gsap)     write it out a letter at a time, then draw the marks
                            one after another, the way a teacher reads a
                            question with a pen in hand

   The user asked for it in so many words: *"use center alignment for
   questions. Add emphasis like circling, highlighting, underlining, boxing.
   Format the numbers and equations in them using mathjax. Also type them
   out."*

   WHAT GETS WHICH MARK, so the same kind of thing always looks the same:
     a NUMBER (a quantity, a price, a percentage)  → CIRCLED
     a LIST or an EXPRESSION (1, 2, 2, 3 … / n(n+1)/2) → BOXED
     a WORD THAT DECIDES THE SUM ("equally", "more than", "the rest") → HIGHLIGHTED
     the sentence that ASKS (ends in ? or starts Find / Evaluate …) → UNDERLINED
   A few of each at most: a question with every word marked has nothing marked.

   THREE STATES, because a film steps back by rebuilding the screen at once:
     .fa--typing   letters and marks hidden, about to be written
     .fa--ink      the marks drawing themselves, one after another
     (neither)     everything there, finished — a replayed step lands here
   ========================================================================== */

import { texInline } from "./film-math.js";
import { stackText } from "./stackfrac.js";
import { sfx } from "./film-fx.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CUR = "[₱₦$£€]";
const NUMBER = "(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?";
/* order matters: the longest kind of thing first */
const MATH = new RegExp([
  `\\d+(?:,\\s\\d+){2,}(?:,\\s(?:\\.\\.\\.|…))?`,                                   // a list: 1, 2, 2, 3, ...
  `[a-z]\\([a-z0-9+\\-\\s]+\\)(?:\\/\\d+)?`,
  `\\d+(?:\\s?:\\s?\\d+)+`,                                                          // a ratio: 3:2:1                                        // a formula: n(n+1)/2
  `(?:${NUMBER}|[a-z])(?:(?:\\s*[+×÷=]\\s*|\\s[-−]\\s)(?:${NUMBER}|\\.\\.\\.|…|[a-z]))+`, // 1 + 2 + ... + 200
  `${CUR}?${NUMBER}(?:\\/\\d+)?%?(?:st|nd|rd|th)?`,                                 // 750, ₱800, 3/4, 35%, 37th
].join("|"), "g");

/* the longer phrase first: "twice more than" is ONE relationship, not "twice" and "more than" */
const KEYWORDS = ["twice more than", "times more than", "twice as many as", "twice as many", "more than", "less than", "fewer than",
  "times as many", "times as much", "equally", "each", "share", "gets", "receives",
  "the rest", "left over", "is left", "are left", "altogether", "in all", "in total", "total", "remaining", "twice", "half",
  "discount", "profit", "loss", "repeated", "alternating", "begin and end", "sum", "difference", "product", "per"];
const KEY_RE = new RegExp(`\\b(${KEYWORDS.map((k) => k.replace(/ /g, "\\s+")).join("|")})\\b`, "gi");
const ASKING = /^(find|evaluate|calculate|work out|simplify|solve|what|how|which|who|when|where|show)\b/i;

const LIMIT = { circle: 4, box: 2, hl: 4 };

/** One run of maths as TeX, its currency sign kept OUT of the maths (₦ breaks MathJax). */
function texOfToken(tok) {
  const cur = tok.match(new RegExp(`^${CUR}`))?.[0] || "";
  let t = tok.slice(cur.length);
  const ord = t.match(/(st|nd|rd|th)$/)?.[0] || "";
  if (ord) t = t.slice(0, -ord.length);
  let tex;
  const formula = t.match(/^([a-z]\([^)]*\))\/(\d+)$/);
  if (formula) tex = `\\frac{${formula[1]}}{${formula[2]}}`;
  else if (/^\d+\/\d+%?$/.test(t)) tex = t.replace(/^(\d+)\/(\d+)/, "\\frac{$1}{$2}");
  else tex = t;
  tex = tex.replace(/(\d),(\d{3})/g, "$1{,}$2").replace(/,\s/g, ",\\ ")
    .replace(/\.\.\.|…/g, "\\ldots").replace(/%/g, "\\%").replace(/×/g, "\\times ").replace(/÷/g, "\\div ")
    .replace(/−/g, "-");
  if (ord) tex += `^{\\text{${ord}}}`;
  return { cur, tex };
}

/** The maths as markup: a MathJax svg, or the figures as words if MathJax cannot be had. */
function mathHtml(tok) {
  const { cur, tex } = texOfToken(tok);
  const svg = texInline(tex);
  const curHtml = esc(cur);
  if (svg) return { html: `${curHtml}<span class="fa-mj" data-tex="${esc(tex)}">${svg}</span>`, tall: /\\frac/.test(tex) };
  return { html: curHtml + stackText(esc(tok.slice(cur.length))), tall: false };
}

/* the pen's marks, drawn as strokes so they can be DRAWN rather than appear */
/* drawn at the size of what they go round (fitInk), never stretched: a stretched stroke dashes
   unevenly, and the pen visibly skipped half a box */
const CIRCLE = `<svg class="fa-ink" data-ink="circle" aria-hidden="true"><path pathLength="1"/></svg>`;
const BOX = `<svg class="fa-ink" data-ink="box" aria-hidden="true"><path pathLength="1"/></svg>`;

/** Each mark drawn to the measured size of its words, in pixels, a little loose like a pen. */
export function fitInk(inner) {
  inner?.querySelectorAll?.(".fa-ink").forEach((svg) => {
    const host = svg.parentElement;
    const w = host.offsetWidth, h = host.offsetHeight;
    if (!w || !h) return;
    const px = Math.max(4, h * 0.22), py = Math.max(3, h * 0.2);
    const W = w + px * 2, H = h + py * 2;
    svg.setAttribute("viewBox", `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`);
    svg.style.left = `${-px}px`; svg.style.top = `${-py}px`;
    svg.style.width = `${W}px`; svg.style.height = `${H}px`;
    const f = (n) => n.toFixed(1);
    let d;
    if (svg.dataset.ink === "box") {
      d = `M${f(3)} ${f(4)} L${f(W - 3)} ${f(3)} L${f(W - 2)} ${f(H - 3)} L${f(2)} ${f(H - 2)} L${f(3)} ${f(2)}`;
    } else {
      const cx = W / 2, cy = H / 2, rx = W / 2 - 2.5, ry = H / 2 - 2.5;
      /* round once and a little past where it began, the way a hand closes a ring */
      d = `M${f(cx + rx * 0.2)} ${f(cy - ry)} C${f(cx + rx * 1.02)} ${f(cy - ry * 1.02)} ${f(cx + rx)} ${f(cy + ry * 0.1)} ${f(cx + rx)} ${f(cy)}`
        + ` C${f(cx + rx)} ${f(cy + ry * 0.62)} ${f(cx + rx * 0.55)} ${f(cy + ry)} ${f(cx)} ${f(cy + ry)}`
        + ` C${f(cx - rx * 0.55)} ${f(cy + ry)} ${f(cx - rx)} ${f(cy + ry * 0.6)} ${f(cx - rx)} ${f(cy)}`
        + ` C${f(cx - rx)} ${f(cy - ry * 0.6)} ${f(cx - rx * 0.5)} ${f(cy - ry * 1.04)} ${f(cx + rx * 0.05)} ${f(cy - ry * 0.98)}`
        + ` C${f(cx + rx * 0.4)} ${f(cy - ry * 0.95)} ${f(cx + rx * 0.62)} ${f(cy - ry * 0.85)} ${f(cx + rx * 0.72)} ${f(cy - ry * 0.7)}`;
    }
    svg.querySelector("path").setAttribute("d", d);
  });
}

/** Words that are not maths: keywords picked out, everything else as it is. */
function wordsHtml(str, used, marks) {
  let out = "";
  let last = 0;
  KEY_RE.lastIndex = 0;
  for (let m; (m = KEY_RE.exec(str));) {
    const key = m[1].toLowerCase().replace(/\s+/g, " ");
    out += esc(str.slice(last, m.index));
    if (used.hl < LIMIT.hl && !used.keys.has(key)) {
      used.hl++; used.keys.add(key);
      /* named, so a film can point at it while it is talked about: data-k="kw-more-than" */
      out += `<span class="fa-em fa-em--hl" data-k="kw-${key.replace(/ /g, "-")}" style="--d:${marks.n++}">${esc(m[1])}</span>`;
    } else out += esc(m[1]);
    last = m.index + m[0].length;
  }
  return out + esc(str.slice(last));
}

/** One sentence as markup, its maths set and marked. */
function sentenceHtml(s, used, marks, state) {
  let out = "";
  let last = 0;
  MATH.lastIndex = 0;
  for (let m; (m = MATH.exec(s));) {
    const tok = m[0];
    /* a lone letter is a word ("a", "I"), not a variable */
    if (/^[a-z]$/i.test(tok)) continue;
    out += wordsHtml(s.slice(last, m.index), used, marks);
    const { html, tall } = mathHtml(tok);
    if (tall) state.tall = true;
    const kind = /,\s|[+×÷=:]|\s[-−]\s|\(/.test(tok) ? "box" : "circle";
    if (used[kind] < LIMIT[kind]) {
      used[kind]++;
      out += `<span class="fa-em fa-em--${kind}" style="--d:${marks.n++}">${html}${kind === "box" ? BOX : CIRCLE}</span>`;
    } else out += `<span class="fa-nb">${html}</span>`;
    last = m.index + tok.length;
  }
  return out + wordsHtml(s.slice(last), used, marks);
}

/**
 * The question as markup. `raw` text is markup already (a film that marks its own words, e.g. the
 * context-clue films): it is centred and typed, but its words are its own.
 */
export function askHtml(text, raw = false) {
  if (raw) return { html: String(text), tall: false };
  /* a sentence ends at . ? ! before a capital, not at the "..." inside 1 + 2 + ... + 200 */
  const sentences = String(text).split(/(?<=[^.][.?!])\s+(?=[A-Z])/).filter(Boolean);
  let asks = sentences.map((s) => /\?$/.test(s.trim()) || ASKING.test(s.trim()));
  if (!asks.some(Boolean)) asks = sentences.map((_, i) => i === sentences.length - 1);
  const used = { circle: 0, box: 0, hl: 0, keys: new Set() };
  const marks = { n: 0 };
  const state = { tall: false };
  /* the sentences are marked in reading order, but the UNDERLINE is drawn last: it is the pen
     coming back to what is being asked, once the facts have been picked out */
  const parts = sentences.map((s, i) => ({ s, ask: asks[i], html: sentenceHtml(s, used, marks, state) }));
  const html = parts.map((p) => (p.ask
    ? `<span class="fa-em fa-em--ul" style="--d:${marks.n++}">${p.html}</span>`
    : p.html)).join(" ");
  return { html, tall: state.tall };
}

/**
 * Write the question out: every letter its own, a formula as one stroke of the pen, then the
 * marks drawn in the order they were made. Returns the seconds it all takes.
 */
export function typeAsk(box, gsap, { cps = 34 } = {}) {
  const inner = box?.firstChild;
  if (!inner || !gsap) return 0;
  /* split the words into letters (once: a replayed step builds the box again from scratch) */
  if (!inner.dataset.faSplit) {
    inner.dataset.faSplit = "1";
    const walker = document.createTreeWalker(inner, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest("svg, .fa-mj") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const texts = [];
    for (let n; (n = walker.nextNode());) texts.push(n);
    texts.forEach((t) => {
      const frag = document.createDocumentFragment();
      /* a word stays whole across a line end: its letters sit in a no-wrap word */
      t.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
        const word = document.createElement("span");
        word.className = "fa-w";
        [...w].forEach((ch) => {
          const c = document.createElement("span");
          c.className = "fa-ch";
          c.textContent = ch;
          word.appendChild(c);
        });
        frag.appendChild(word);
      });
      t.replaceWith(frag);
    });
  }
  fitInk(inner);
  const units = [...inner.querySelectorAll(".fa-ch, .fa-mj")];
  units.forEach((u) => u.classList.remove("is-on"));
  inner.classList.remove("fa--ink");
  inner.classList.add("fa--typing");

  const tl = gsap.timeline();
  let t = 0.15;
  units.forEach((u) => {
    tl.add(() => u.classList.add("is-on"), t);
    t += u.classList.contains("fa-mj") ? 0.14 : (/[.,?!]/.test(u.textContent) ? 2.2 : 1) / cps;
  });
  const marks = [...inner.querySelectorAll(".fa-em")];
  const gap = 0.42;
  tl.add(() => {
    if (!inner.isConnected) return;
    inner.classList.remove("fa--typing");
    inner.classList.add("fa--ink");
    marks.forEach((m) => sfx("draw", Number(m.style.getPropertyValue("--d") || 0) * gap));
  }, t + 0.25);
  const total = t + 0.25 + marks.length * gap + 0.6;
  /* finished: the marks simply ARE there now, so nothing depends on an animation having run */
  tl.add(() => inner.classList.remove("fa--ink"), total);
  return total;
}

/* ── the look ─────────────────────────────────────────────────────────────── */
export function askCss() {
  if (typeof document === "undefined" || document.getElementById("fa-css")) return;
  const st = document.createElement("style");
  st.id = "fa-css";
  st.textContent = `
.vm-ask .vm-t__in { text-align: center; text-wrap: balance; }
.vm-ask--tall .vm-t__in { line-height: 1.75; }
.fa-w, .fa-nb, .fa-em--circle, .fa-em--box { white-space: nowrap; }
.fa-mj { display: inline-block; }
.fa-mj svg { display: inline-block; overflow: visible; }

/* typing: letters wait their turn (opacity, so nothing moves as they arrive) */
.fa--typing .fa-ch, .fa--typing .fa-mj { opacity: 0; }
.fa--typing .fa-ch.is-on, .fa--typing .fa-mj.is-on { opacity: 1; }

/* the pen's marks */
.fa-em { position: relative; }
.fa-em--circle, .fa-em--box { display: inline-block; padding: 0 0.22em; margin: 0 0.06em; }
.fa-ink { position: absolute; left: 0; top: 0; width: 0; height: 0; overflow: visible; pointer-events: none; }
.fa-ink path { fill: none; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round;
  stroke-dasharray: 1; stroke-dashoffset: 0; }
.fa-em--circle .fa-ink path { stroke: #c0453f; stroke-width: 2.4; }
.fa-em--box .fa-ink path { stroke: #2f6f8f; }
/* a word turned over in place (swapWord) */
.fa-w.fa-swap { display: inline-block; animation: fa-swap 0.6s ease both; color: #c0453f; }
@keyframes fa-swap { 0% { transform: scaleY(1); } 45% { transform: scaleY(0); } 100% { transform: scaleY(1); } }
/* THE ACTION ON A KEYWORD: when PrepBot says it, it jumps, and a red ring goes round it */
.fa-em--hl { display: inline-block; }
.fa-em--hl.fa-act { animation: fa-act 1.8s ease both; }
@keyframes fa-act {
  0% { transform: none; box-shadow: 0 0 0 0 rgba(192,69,63,0); }
  20% { transform: translateY(-0.18em) scale(1.18) rotate(-2deg); box-shadow: 0 0 0 0.12em #c0453f; }
  75% { transform: translateY(-0.08em) scale(1.08); box-shadow: 0 0 0 0.12em #c0453f; }
  100% { transform: none; box-shadow: 0 0 0 0.1em rgba(192,69,63,.85); }
}
.fa-em--hl { background: linear-gradient(transparent 52%, #ffe27a 52%, #ffe27a 92%, transparent 92%) no-repeat 0 0 / 100% 100%;
  -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.fa-em--ul { background: linear-gradient(#2f8f4e, #2f8f4e) no-repeat 0 100% / 100% 0.12em; padding-bottom: 0.06em;
  -webkit-box-decoration-break: clone; box-decoration-break: clone; }

.fa--typing .fa-ink path { stroke-dashoffset: 1; }
.fa--typing .fa-em--hl { background-size: 0% 100%; }
.fa--typing .fa-em--ul { background-size: 0% 0.12em; }
.fa--ink .fa-ink path { animation: fa-pen 0.5s ease-out calc(var(--d) * 0.42s) both; }
.fa--ink .fa-em--hl { animation: fa-hl 0.45s ease-out calc(var(--d) * 0.42s) both; }
.fa--ink .fa-em--ul { animation: fa-ul 0.6s ease-out calc(var(--d) * 0.42s) both; }
@keyframes fa-pen { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes fa-hl { from { background-size: 0% 100%; } to { background-size: 100% 100%; } }
@keyframes fa-ul { from { background-size: 0% 0.12em; } to { background-size: 100% 0.12em; } }
@media (prefers-reduced-motion: reduce) {
  .fa--ink .fa-ink path, .fa--ink .fa-em--hl, .fa--ink .fa-em--ul { animation: none; }
}
`;
  document.head.appendChild(st);
}

/**
 * ROLL A NUMBER IN THE QUESTION to a new value, like a counter: *"If you are doing examples with
 * same question but different numbers ... just role up the number to the new one."* The same
 * question stays on the screen; only its figure turns over, up or down, and its circle is redrawn
 * to the new size. `from` is the figure as the question was written (its TeX), `to` the new one.
 */
export function rollAsk(inner, from, to, { instant = false, secs = 1, suffix = "" } = {}) {
  const el = [...(inner?.querySelectorAll(".fa-mj") || [])].find((e) => e.dataset.tex === String(from));
  if (!el) return;
  const start = Number(el.dataset.now ?? String(from).replace(/[^\d.]/g, ""));
  /* `suffix`: what follows the figure in its TeX (a percentage keeps its sign: "20\%" rolls to "50\%") */
  const put = (v) => { const svg = texInline(`${v}${suffix}`); if (svg) el.innerHTML = svg; el.dataset.now = String(v); };
  if (instant || start === to || typeof requestAnimationFrame !== "function") { put(to); fitInk(inner); return; }
  const t0 = performance.now();
  let last = start;
  const tick = (now) => {
    if (!el.isConnected) return;
    const k = Math.min(1, (now - t0) / (secs * 1000));
    const v = Math.round(start + (to - start) * (1 - Math.pow(1 - k, 3)));
    if (v !== last) { put(v); last = v; }
    if (k < 1) requestAnimationFrame(tick); else { put(to); fitInk(inner); }
  };
  requestAnimationFrame(tick);
  sfx("tick", 0);
}

/** ROLL A RATIO in the question ("5:4" to 3:4): each side counts to its new value, in its own box. */
export function rollAskRatio(inner, from, to, { instant = false, secs = 1 } = {}) {
  const el = [...(inner?.querySelectorAll(".fa-mj") || [])].find((e) => e.dataset.tex === String(from));
  if (!el) return;
  const start = (el.dataset.now || String(from)).split(":").map(Number);
  const put = (v) => { const svg = texInline(v.join(":")); if (svg) el.innerHTML = svg; el.dataset.now = v.join(":"); };
  if (instant || typeof requestAnimationFrame !== "function") { put(to); fitInk(inner); return; }
  const t0 = performance.now();
  let last = start.join(":");
  const tick = (now) => {
    if (!el.isConnected) return;
    const k = Math.min(1, (now - t0) / (secs * 1000)), e = 1 - Math.pow(1 - k, 3);
    const v = start.map((s, i) => Math.round(s + (to[i] - s) * e));
    if (v.join(":") !== last) { put(v); last = v.join(":"); }
    if (k < 1) requestAnimationFrame(tick); else { put(to); fitInk(inner); }
  };
  requestAnimationFrame(tick);
  sfx("tick", 0);
}

/** TURN A WORD in the question over to another ("increased" to "decreased"), where it stands. */
export function swapWord(inner, from, to, { instant = false } = {}) {
  let w = [...(inner?.querySelectorAll(".fa-w") || [])].find((x) => x.textContent === from || x.dataset.was === from);
  /* a question built again for a later step was never typed, so its words are plain text: wrap this one */
  if (!w && inner) {
    const walker = document.createTreeWalker(inner, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest("svg, .fa-mj") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n; !w && (n = walker.nextNode());) {
      const i = n.data.search(new RegExp(`\\b${from}\\b`));
      if (i < 0) continue;
      const rest = n.splitText(i);
      rest.splitText(from.length);
      w = document.createElement("span");
      w.className = "fa-w";
      rest.replaceWith(w);
      w.textContent = from;
    }
  }
  if (!w) return;
  w.dataset.was = from;
  w.innerHTML = [...to].map((ch) => `<span class="fa-ch is-on">${ch.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>`).join("");
  if (!instant) { w.classList.remove("fa-swap"); void w.offsetWidth; w.classList.add("fa-swap"); sfx("flip", 0); }
  fitInk(inner);
}
