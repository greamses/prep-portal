/* ============================================================================
   Wrap bare maths in $…$
   ----------------------------------------------------------------------------
   A model that writes exam questions is told to put every number, expression, unit and symbol between single
   dollar signs so MathJax can typeset it. It often forgets. This is the safety net, run on what a model wrote
   (never on what a teacher typed): whatever maths is left OUTSIDE dollar signs is wrapped.

       wrapMaths("Find 15.75 ÷ 25.")        →  "Find $15.75 \div 25$."
       wrapMaths("area is 84 cm² and 40%")  →  "area is $84\ \text{cm}^2$ and $40\%$"

   It only ever touches text outside existing $…$ and outside the fill-in blank (______), so it is safe to run
   on text that is already right: that comes back unchanged. No imports, so it can be tested in node.
   ========================================================================== */

const NUM = String.raw`\d+(?:[.,]\d+)*`;
const UNIT = String.raw`(?:cm|mm|km|kg|mg|ml|m|g|l|s|°C|°F|%)(?:²|³|\^\d)?`;
/* a number, optionally with a letter (3x), a power (x^2) or a unit (8 cm) */
const TERM = String.raw`(?:${NUM}(?:\s?${UNIT})?(?![A-Za-z])|${NUM}[a-z](?:\^\d+|_\d+)?(?![A-Za-z])|[a-z](?:\^\d+|_\d+)?(?![A-Za-z]))`;
/* a bracketed part that holds an operator: (3m − 4), (x+2); optionally with a coefficient and a power */
const GROUP = String.raw`(?:${NUM})?\([^()$\n]*[0-9a-z][^()$\n]*[+\-−×÷*/^=][^()$\n]*\)(?:\^\d+)?`;
const ATOM = String.raw`(?:${GROUP}(?:${GROUP})*|${TERM})`;
const OP = String.raw`(?:\s*[+×÷*=<>≤≥≠−]\s*|\s+-\s+|(?<=[\d)a-z])-(?=[\d(a-z])|\s*/\s*)`;
/* an expression: a bracketed part (alone, or carrying on: 3(2a + 5) − 4a), or terms joined by operators */
const EXPR = new RegExp(String.raw`(?<![A-Za-z\d_\\$.])(?:(?:${GROUP})+(?:${OP}${ATOM})*|${TERM}(?:${OP}${ATOM})+)`, "g");

/** The TeX for a stretch of plain maths. */
function tex(m) {
  return m
    .replace(/(\d+)\s*\/\s*(\d+)/g, "\\frac{$1}{$2}")
    .replace(/×|\*/g, "\\times ").replace(/÷/g, "\\div ").replace(/−/g, "-")
    .replace(/≤/g, "\\le ").replace(/≥/g, "\\ge ").replace(/≠/g, "\\ne ")
    .replace(/²/g, "^2").replace(/³/g, "^3").replace(/π/g, "\\pi ").replace(/°C/g, "^\\circ\\text{C}").replace(/°F/g, "^\\circ\\text{F}").replace(/°/g, "^\\circ")
    .replace(/%/g, "\\%")
    .replace(/(\d)\s?(cm|mm|km|kg|mg|ml)(?![A-Za-z])/g, "$1\\ \\text{$2}")
    .replace(/(\d)\s?(m|g|l|s)(?=\^|$)/g, "$1\\ \\text{$2}")
    .replace(/(\d),(\d{3})(?!\d)/g, "$1{,}$2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const wrap = (m) => `$${tex(m)}$`;

/** Apply `fn` to the stretches outside $…$ only. */
function outside(s, fn) {
  return s.split("$").map((seg, i) => (i % 2 ? seg : fn(seg))).join("$");
}

/** Wrap what is left outside dollar signs. */
export function wrapMaths(src, opts) {
  const original = String(src == null ? "" : src);
  if (!/[0-9²³π°]|[a-z]\^|\b[xyz]\b/.test(original)) return original;      // no maths to find: nothing to do
  if (opts && opts.paren) return wrapParen(original);                         // the question bank's \( … \) style, money left alone
  const blanks = [], displays = [];
  /* display maths ($$…$$) and the fill-in blank are set aside, and put back at the end exactly as they were */
  let s = original
    .replace(/\$\$[\s\S]*?\$\$/g, (d) => { displays.push(d); return "\u0003"; })
    .replace(/_{3,}/g, (b) => { blanks.push(b); return "\u0002"; });

  const passes = [
    /* 1. an expression: terms joined by operators, or a bracketed part (15.75 ÷ 25, 2x + 3 = 11, 3/4 + 1/2, 7(3m − 4), (x+2)(x+5)) */
    (t) => t.replace(EXPR, (m) => wrap(m)),
    /* 3. a fraction: 3/4 */
    (t) => t.replace(/(?<![\w\\$./])(\d+)\/(\d+)(?![\w/])/g, (m) => wrap(m)),
    /* 4. a number with a unit, a percentage or a degree: 8 cm, 84 cm², 40%, 45°, 20°C */
    (t) => t.replace(new RegExp(String.raw`(?<![A-Za-z\d_\\$.])${NUM}\s?(?:°C|°F|°|%|(?:cm|mm|km|kg|mg|ml|m|g|l|s)(?:²|³|\^\d)?(?![A-Za-z]))`, "g"), (m) => wrap(m)),
    /* 5. a power or a subscript on its own: x^2, 10^3, a_1 */
    (t) => t.replace(/(?<![A-Za-z\d_\\$])(?:\d+|[a-z])(?:\^\d+|_\d+)(?![A-Za-z\d])/g, (m) => wrap(m)),
    /* 6. any number left, not part of a word (H2O, 3rd are left): 12, 1,200, 3.5 */
    (t) => t.replace(new RegExp(String.raw`(?<![A-Za-z\d_\\$.{])${NUM}(?![A-Za-z\d_}])`, "g"), (m) => wrap(m)),
    /* 7. a lone x, y or z standing for a number */
    (t) => t.replace(/(?<![A-Za-z\d_\\$'’-])([xyz])(?![A-Za-z\d_'’-])/g, (m) => wrap(m)),
  ];
  for (const pass of passes) s = outside(s, pass);

  /* two spans only a space apart ($3$ $4$) stay as written: they read as separate numbers */
  let i = 0, j = 0;
  return s.replace(/\u0002/g, () => blanks[i++]).replace(/\u0003/g, () => displays[j++]);
}

/* The question bank writes maths between \( … \) and keeps money as plain text (₦500, 20 naira). Existing \(…\), \[…\]
   and $…$ are set aside as written, so are amounts of money; what is left is wrapped as above and its $…$ turned into \(…\). */
function wrapParen(original) {
  const held = [];
  const hold = (m) => { held.push(m); return "\u0004" + String.fromCharCode(0xE000 + held.length - 1) + "\u0004"; };
  const s = original
    .replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g, hold)
    .replace(/[₦£€$]\s?\d+(?:[.,]\d+)*(?:\s?(?:k|million|billion))?/g, hold)
    .replace(/\$[^$]+\$/g, hold)
    .replace(/\d+(?:[.,]\d+)*\s?(?:naira|kobo|dollars?|pounds?|cents?|euros?)(?![A-Za-z])/gi, hold);
  const out = wrapMaths(s).replace(/\$([^$]*)\$/g, (m, a) => "\\(" + a + "\\)");
  return out.replace(/\u0004([-])\u0004/g, (m, c) => held[c.charCodeAt(0) - 0xE000]);
}

/** A question as the model wrote it, with the maths in each of its texts wrapped. */
export function wrapQuestion(q) {
  const w = (v) => (typeof v === "string" ? wrapMaths(v) : v);
  return { ...q, text: w(q.text), answer: typeof q.answer === "string" ? w(q.answer) : q.answer, options: Array.isArray(q.options) ? q.options.map(w) : q.options };
}
