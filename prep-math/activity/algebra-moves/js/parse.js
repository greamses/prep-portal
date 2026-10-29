/* ═══════════════════════════════════════════════════════════════════════════
   PARSER

   The same linear syntax the rest of the site already asks students to type
   (utils/components/math-linear.js): 1/2 for a fraction, x^2 for a power, 3x
   for implicit multiplication. The difference is what comes out — that module
   transpiles to TeX for MathJax to set, which is a dead end here because we
   need a tree with stable node ids, not a picture.

   Grammar:

     line     := expr ("=" expr)?          <- an equation, or just an expression
     expr     := term (("+" | "-") term)*
     term     := factor (("*" | "/") factor | factor)*      <- juxtaposition
     factor   := "-" factor | power
     power    := atom ("^" factor)?
     atom     := number | letter | "(" expr ")"

   A slash takes the next FACTOR, not the rest of the term, so 3/4x reads as
   (3/4)x. That matches how it is written on paper and how the site's existing
   linear input already behaves.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as A from "./ast.js";
import * as R from "./rational.js";

const isDigit = (c) => c >= "0" && c <= "9";
// The full Greek alphabet, lowercase only: an uppercase Greek letter is
// indistinguishable on the page from the Latin one it happens to look like
// (Α is "A", Β is "B"), which would make two different variables share a
// glyph. Lowercase has no such collision. Final sigma (ς) is left out — it
// is a spelling rule for the end of a word, not a different variable.
const GREEK = "αβγδεζηθικλμνξοπρστυφχψω";
const isAlpha = (c) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || GREEK.includes(c);

/* A function's name inside a run of letters (3log_2(x), 2sin_…) means the run is a product with a
   function in it, not a numeral with unknown digits. */
const HAS_FN_NAME = /sin|cos|tan|ln|log|det|sqrt|mean|median|mode|range|sum|arc|mixed|nCr|nPr|transpose/;

function tokenise(src, lenient = false) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    /* A number in another base: 1011_2, 2A_16 — digits (and capital letters
       for digits past 9), an underscore, the base. Only when every digit
       belongs in that base, so nothing else written with an underscore is
       taken for one. 1011₂ with a subscript base reads the same. */
    {
      // log_2(8), log_(x + 1)(y): a logarithm to any base — the base, then what it is taken of.
      if (src.startsWith("log_", i)) { out.push({ t: "logb", v: "log_", at: i }); i += 4; continue; }
      // root_3(27), root_n(x), cbrt(27), ∛27, ∜16: the nth root, index first
      if (src.startsWith("root_", i)) { out.push({ t: "nroot", v: "root_", at: i }); i += 5; continue; }
      if (src.startsWith("cbrt", i) && src[i + 4] === "(") { out.push({ t: "nroot", v: "cbrt", at: i }); i += 4; continue; }
      if (src[i] === "∛" || src[i] === "∜") { out.push({ t: "nroot", v: src[i], at: i }); i++; continue; }
      // 3^^4: tetration, a power tower — checked before a single ^
      if (src.startsWith("^^", i)) { out.push({ t: "^^", v: "^^", at: i }); i += 2; continue; }
      // 101_(x + 1): digits whose base is a whole expression, in brackets — the "(" is left to be read as one.
      const bx = /^([0-9A-Za-z?]+)_(?=\()/.exec(src.slice(i));
      if (bx && (i === 0 || !/[A-Za-z0-9]/.test(src[i - 1])) && !REFS.some((r) => src.startsWith(r, i)) && /^[0-9?a-z]/.test(bx[1]) && !HAS_FN_NAME.test(bx[1])) {
        out.push({ t: "basex", v: bx[1], at: i });
        i += bx[0].length;
        continue;
      }
      // ?_8, 35_?, ?_?: a numeral and its base with a box still empty — only ever on the keypad's own drawing.
      const ph = /^(\?|[0-9A-Za-z]+)_(\?|[0-9]+|[a-z])(?![A-Za-z0-9_?])/.exec(src.slice(i));
      if (ph && (ph[1] === "?" || ph[2] === "?") && (i === 0 || !/[A-Za-z0-9]/.test(src[i - 1]))) {
        out.push({ t: "base", v: ph[1], base: /^[0-9]+$/.test(ph[2]) ? Number(ph[2]) : null, name: /^[a-z]$/.test(ph[2]) ? ph[2] : null, empty: ph[2] === "?", at: i });
        i += ph[0].length;
        continue;
      }
      // y7_8: a numeral with an unknown digit (a lowercase letter), in a numeral base.
      const uv = /^([0-9A-Za-z]*[a-z][0-9A-Za-z]*)_([0-9]+)(?![A-Za-z0-9_])/.exec(src.slice(i));
      if (uv && (i === 0 || !/[A-Za-z0-9]/.test(src[i - 1])) && !REFS.some((r) => src.startsWith(r, i)) && !HAS_FN_NAME.test(uv[1])) {
        const b = Number(uv[2]);
        if (b >= 2 && b <= 36) {
          const bad = [...uv[1]].find((ch) => !/[a-z]/.test(ch) && parseInt(ch, 36) >= b);
          if (bad && !lenient) throw new SyntaxError(`${bad} is not a digit in base ${b} — base ${b} uses ${b <= 10 ? `0 to ${b - 1}` : `0 to 9 and A to ${(b - 1).toString(36).toUpperCase()}`}.`);
          out.push({ t: "base", v: uv[1], base: b, at: i });
          i += uv[0].length;
          continue;
        }
      }
      // 35_y: digits whose base is a letter (what the equation is about)
      const lv = /^([0-9a-z]+)_([a-z])(?![A-Za-z0-9_])/.exec(src.slice(i));
      if (lv && (i === 0 || !/[A-Za-z0-9]/.test(src[i - 1])) && !HAS_FN_NAME.test(lv[1])) {
        out.push({ t: "base", v: lv[1], base: null, name: lv[2], at: i });
        i += lv[0].length;
        continue;
      }
      const m = /^([0-9A-Z]+)(?:_([0-9]+)|([₀-₉]+))/.exec(src.slice(i));
      if (m && (i === 0 || !/[A-Za-z0-9]/.test(src[i - 1]))) {
        const base = Number(m[2] || [...m[3]].map((c) => "₀₁₂₃₄₅₆₇₈₉".indexOf(c)).join(""));
        if (!lenient && base >= 2 && base <= 36 && /[0-9]/.test(m[1][0]) && A.baseValue(m[1], base) === null) {
          const bad = [...m[1]].find((ch) => parseInt(ch, 36) >= base);
          throw new SyntaxError(`${bad} is not a digit in base ${base} — base ${base} uses ${base <= 10 ? `0 to ${base - 1}` : `0 to 9 and A to ${(base - 1).toString(36).toUpperCase()}`}.`);
        }
        if (base >= 2 && base <= 36 && (lenient || A.baseValue(m[1], base) !== null) && /[0-9]/.test(m[1][0])) {
          out.push({ t: "base", v: m[1], base, at: i });
          i += m[0].length;
          continue;
        }
      }
    }
    if (c === " " || c === "\t" || c === "\n") { i++; continue; }
    if (isDigit(c) || (c === "." && isDigit(src[i + 1]))) {
      let j = i;
      while (j < src.length && (isDigit(src[j]) || src[j] === ".")) j++;
      out.push({ t: "num", v: src.slice(i, j), at: i });
      i = j;
      continue;
    }
    // A square root, written the site's way (sqrt(…)) or as the glyph itself.
    // Checked before letters, or sqrt would read as s·q·r·t.
    // The names of equations on the canvas (E_1, A2), longest first, so E_12
    // is not read as E_1 and a 2.
    const named = REFS.find((r) => src.startsWith(r, i));
    if (named) { out.push({ t: "ref", v: named, at: i }); i += named.length; continue; }
    if (src.startsWith("sqrt", i)) { out.push({ t: "root", v: "sqrt", at: i }); i += 4; continue; }
    // mixed(w,n,d): a whole number and a fraction side by side — the keypad's three boxes.
    if (src.startsWith("mixed(", i)) { out.push({ t: "mixed", v: "mixed", at: i }); i += 5; continue; }
    // nCr(8,3) and nPr(8,3): choices and arrangements.
    {
      const m = /^n([PC])r\(/.exec(src.slice(i));
      if (m && (i === 0 || !isAlpha(src[i - 1]))) { out.push({ t: "choose", v: m[1], at: i }); i += 3; continue; }
    }
    // Function names and lim, checked before letters for the same reason.
    // det and transpose are only the names of functions when something to
    // work on follows them; otherwise d·e·t is three letters.
    const word = [...A.FUNCS, "lim"].find((w) => src.startsWith(w, i)
      && (w !== "det" && w !== "transpose" && !A.LIST_FNS.includes(w) || (A.LIST_FNS.includes(w) ? "([{" : "([").includes(src[i + w.length] || "")));
    if (word) { out.push({ t: word === "lim" ? "lim" : "fn", v: word, at: i }); i += word.length; continue; }
    // d/dx — a derivative with respect to the letter after it.
    if (src.startsWith("d/d", i) && isAlpha(src[i + 3] || "")) { out.push({ t: "deriv", v: src[i + 3], at: i }); i += 4; continue; }
    if (c === "∫") { out.push({ t: "int", v: "∫", at: i }); i++; continue; }
    if (c === "Σ") { out.push({ t: "sigma", v: "Σ", at: i }); i++; continue; }
    if (c === "°") { out.push({ t: "deg", v: "°", at: i }); i++; continue; }
    if (c === "%") { out.push({ t: "pct", v: "%", at: i }); i++; continue; }
    if (c === "!") { out.push({ t: "fact", v: "!", at: i }); i++; continue; }
    if (c === "_") { out.push({ t: "_", v: "_", at: i }); i++; continue; }
    if (src.startsWith("->", i)) { out.push({ t: "to", v: "->", at: i }); i += 2; continue; }
    if (c === "→") { out.push({ t: "to", v: "→", at: i }); i++; continue; }
    if (c === "√") { out.push({ t: "root", v: "√", at: i }); i++; continue; }
    if (isAlpha(c)) { out.push({ t: "var", v: c, at: i }); i++; continue; }
    if ("+-*/^()=[],{}".includes(c)) { out.push({ t: c, v: c, at: i }); i++; continue; }
    // The keypad's placeholder for a slot you have not filled in yet.
    if (c === "?") { out.push({ t: "hole", v: "?", at: i }); i++; continue; }
    // Typed with the keys a phone offers instead of the ones we expect.
    if (c === "×" || c === "·") { out.push({ t: "*", v: "*", at: i }); i++; continue; }
    if (c === "÷") { out.push({ t: "/", v: "/", at: i }); i++; continue; }
    if (c === "−") { out.push({ t: "-", v: "-", at: i }); i++; continue; }
    if (c === "±") { out.push({ t: "pm", v: "±", at: i }); i++; continue; }
    throw new SyntaxError(`I do not know what to do with "${c}".`);
  }
  out.push({ t: "end", v: "", at: src.length });
  return out;
}

/** Tokens that can begin a factor — a "-" cannot, or 3 - 2 would read as 3(-2). */
/* Names the tokenizer reads as whole equations — set by the page from the
   cards it holds (setRefs). Empty everywhere else, so nothing changes there. */
let REFS = [];
export function setRefs(names) {
  REFS = [...new Set(names.filter(Boolean))].sort((a, b) => b.length - a.length);
}

const STARTS_FACTOR = new Set(["[", "{", "sigma", "logb", "nroot", "basex", "choose", "base", "ref", "num", "var", "(", "hole", "root", "fn", "deriv", "int", "lim"]);

/** `lenient` draws a numeral whose digit is not one of its base's (the keypad shows it, and says why)
    rather than refusing the whole line. */
export function parse(src, { lenient = false } = {}) {
  const toks = tokenise(src, lenient);
  let p = 0;
  const peek = () => toks[p];
  const eat = (t) => {
    if (toks[p].t !== t) throw Object.assign(new SyntaxError(`I expected ${t === "end" ? "the end" : `"${t}"`} here.`), { at: toks[p].at, expected: t });
    return toks[p++];
  };

  /* Where in the typed line each node came from, as [start, end).
     The keypad needs it and nothing else does: it is what lets a caret in the
     DRAWN equation know which characters of the source it is standing between.
     Recorded here because this is the only place that still knows — by the
     time there is a tree, the string is gone.

     A production that hands its child straight back re-stamps the same span
     over itself, which costs nothing and is why this is one line per rule. */
  const from = () => p;
  const span = (mark, node) => {
    // A BRACKETED node keeps the span of its contents, without the brackets —
    // see atom(). A production that hands its child straight back would
    // otherwise quietly widen it to include them, and then a caret inside (?)
    // is a caret standing at the edge of the whole (?) instead of in the box.
    if (node && !node.paren) {
      node.src = [toks[mark].at, p > mark ? toks[p - 1].at + String(toks[p - 1].v).length : toks[mark].at];
    }
    return node;
  };

  function atom() {
    const mark = from();
    const tk = peek();
    /* 2 1/3 — a whole number, a SPACE, then a fraction of two whole numbers —
       is the mixed number two and a third. Without the space (21/3) it is
       twenty-one thirds, and 2·1/3 is still two thirds. */
    if (tk.t === "num") {
      const [n1, sl, n2] = [toks[p + 1], toks[p + 2], toks[p + 3]];
      const whole = (t) => t && t.t === "num" && /^\d+$/.test(t.v);
      if (whole(tk) && whole(n1) && sl?.t === "/" && whole(n2) && n1.at > tk.at + tk.v.length
          && !(toks[p + 4] && toks[p + 4].t === "^")) {
        p += 4;
        return span(mark, A.mixed(A.num(R.fromDecimal(tk.v)), A.frac(A.num(R.fromDecimal(n1.v)), A.num(R.fromDecimal(n2.v)))));
      }
      p++;
      return span(mark, A.num(R.fromDecimal(tk.v), tk.v.includes(".") ? tk.v : null));
    }
    // e and π are numbers, not letters.
    if (tk.t === "var" && (tk.v === "e" || tk.v === "π")) { p++; return span(mark, A.cnst(tk.v)); }
    if (tk.t === "var") { p++; return span(mark, A.vr(tk.v)); }
    if (tk.t === "fn") { p++; return span(mark, A.fn(tk.v, atom())); }
    if (tk.t === "ref") { p++; return span(mark, A.ref(tk.v)); }
    if (tk.t === "{") {
      p++;
      const items = [expr()];
      while (peek().t === ",") { p++; items.push(expr()); }
      eat("}");
      return span(mark, A.list(items));
    }
    if (tk.t === "sigma") {
      p++;
      eat("_");
      eat("(");
      const v = peek();
      if (v.t !== "var") throw new SyntaxError("A sum needs the letter it counts with in its first box.");
      p++;
      eat("=");
      const lo = expr();
      eat(")");
      eat("^");
      const hi = atom();
      return span(mark, A.sigma(atom(), v.v, lo, hi));
    }
    if (tk.t === "choose") {
      p++;
      eat("(");
      const n = expr();
      eat(",");
      const r = expr();
      eat(")");
      return span(mark, A.choose(n, r, tk.v === "P"));
    }
    if (tk.t === "nroot") {
      p++;
      const idx = tk.v === "root_" ? atom() : A.num(R.rat(tk.v === "∜" ? 4n : 3n));   // root_n(x): the index first
      return span(mark, A.nroot(idx, atom()));
    }
    if (tk.t === "logb") {
      p++;
      const b = atom();                    // 2, y, (x + 1)
      const k = atom();                    // what the logarithm is taken of
      return span(mark, A.logb(b, k));
    }
    if (tk.t === "basex") {
      p++;
      return span(mark, A.basedExpr(tk.v, atom()));
    }
    if (tk.t === "mixed") {
      p++;
      eat("(");
      const w = expr();
      eat(",");
      const n = expr();
      eat(",");
      const d = expr();
      eat(")");
      return span(mark, A.mixed(w, A.frac(n, d)));
    }
    if (tk.t === "base") {
      p++;
      if (tk.empty) { const n = A.based(tk.v, null); n.v = A.hole(); return span(mark, n); }     // the base is a box still to fill
      return span(mark, tk.name ? A.basedVar(tk.v, tk.name) : A.based(tk.v, tk.base));
    }
    if (tk.t === "deriv") { p++; return span(mark, A.deriv(atom(), tk.v)); }
    if (tk.t === "lim") {
      p++;
      eat("(");
      const at = peek();
      if (at.t !== "var") throw new SyntaxError("A limit needs the letter that is moving.");
      p++;
      eat("to");
      const to = expr();
      eat(")");
      return span(mark, A.lim(atom(), at.v, to));
    }
    if (tk.t === "int") {
      p++;
      let lo = null, hi = null;
      if (peek().t === "_") { p++; lo = atom(); eat("^"); hi = atom(); }
      const body = atom();
      const d = peek(), x = toks[p + 1];
      if (d.t !== "var" || d.v !== "d" || !x || x.t !== "var") {
        throw new SyntaxError("An integral ends with the letter it is taken with respect to.");
      }
      p += 2;
      return span(mark, A.integ(body, x.v, lo, hi));
    }
    if (tk.t === "hole") { p++; return span(mark, A.hole()); }
    // A root takes the next atom: √3x is (√3)x, √(3x) roots all of it — the
    // same "a bracket is a parcel" rule the site's linear input uses.
    if (tk.t === "root") { p++; return span(mark, A.root(atom())); }
    // A bracket the student typed is a bracket they keep seeing: mark it here
    // rather than have the layout guess later where brackets belong.
    // The span stays the content's own, WITHOUT the brackets. It is where the
    // caret may stand, and inside the brackets is exactly where a student
    // wanting to add another digit to (4) means to be.
    if (tk.t === "(") { p++; const e = expr(); eat(")"); e.paren = true; return e; }
    /* A matrix: [[1,2],[3,4]] — rows in brackets, entries on commas, every
       entry any expression. */
    if (tk.t === "[") {
      p++;
      const rows = [];
      for (;;) {
        eat("[");
        const row = [expr()];
        while (peek().t === ",") { p++; row.push(expr()); }
        eat("]");
        rows.push(row);
        if (peek().t === ",") { p++; continue; }
        break;
      }
      eat("]");
      if (rows.some((r) => r.length !== rows[0].length)) {
        throw new SyntaxError("Every row of a matrix needs the same number of entries.");
      }
      return span(mark, A.mat(rows));
    }
    throw Object.assign(new SyntaxError(tk.t === "end" ? "The line stops before it is finished." : `I did not expect "${tk.v}" here.`), { at: tk.at, atEnd: tk.t === "end" });
  }

  function power() {
    const mark = from();
    let base = atom();
    // 30° is an angle in degrees.
    if (peek().t === "deg") { p++; base = span(mark, A.deg(base)); }
    // 25% is twenty-five out of a hundred.
    if (peek().t === "pct") { p++; base = span(mark, A.pct(base)); }
    // 3^^4 is three tetrated four times: 3^(3^(3^3)), the index raised before the base
    if (peek().t === "^^") { p++; base = span(mark, A.tet(base, factor())); }
    // 5! is five factorial.
    while (peek().t === "fact") { p++; base = span(mark, A.fact(base)); }
    if (peek().t === "^") {
      p++;
      const e = factor();
      // A^T is the matrix turned on its side.
      if (base.kind === "mat" && e.kind === "var" && e.name === "T") return span(mark, A.fn("transpose", base));
      return span(mark, A.pow(base, e));
    }
    return base;
  }

  function factor() {
    const mark = from();
    if (peek().t === "-") { p++; return span(mark, A.neg(factor())); }
    if (peek().t === "pm") { p++; return span(mark, A.pm(factor())); }
    if (peek().t === "+") { p++; return span(mark, factor()); }
    return power();
  }

  function term() {
    const mark = from();
    let node = factor();
    for (;;) {
      const tk = peek();
      if (tk.t === "*") { p++; node = span(mark, mul(node, factor())); continue; }
      if (tk.t === "/") { p++; node = span(mark, A.frac(node, factor())); continue; }
      if (STARTS_FACTOR.has(tk.t)) { node = span(mark, mul(node, factor())); continue; }
      return node;
    }
  }

  // Keep a run of factors as ONE flat product, the way it is written — but a
  // product the student bracketed stays its own thing.
  const mul = (a, b) =>
    a.kind === "prod" && !a.paren ? A.prod([...a.kids, b], a.id) : A.prod([a, b]);

  function expr() {
    const mark = from();
    const terms = [term()];
    for (;;) {
      const tk = peek();
      const at = from();
      if (tk.t === "+") { p++; terms.push(term()); continue; }
      if (tk.t === "-") { p++; terms.push(span(at, A.neg(term()))); continue; }
      if (tk.t === "pm") { p++; terms.push(span(at, A.pm(term()))); continue; }
      break;
    }
    return span(mark, terms.length === 1 ? terms[0] : A.sum(terms));
  }

  /* An equals sign is what makes it an equation; without one the line is an
     EXPRESSION, and the tool tidies it instead of solving it. Refusing that
     used to be the first thing this parser did, which meant half the algebra a
     student is asked to do could not be typed in at all. */
  const start = from();
  const left = expr();
  if (peek().t === "end") return span(start, A.expression(left));
  eat("=");
  const right = expr();
  eat("end");
  return span(start, A.eqn(left, right));
}
