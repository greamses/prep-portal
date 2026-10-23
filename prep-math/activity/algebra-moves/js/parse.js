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

function tokenise(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
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
    // Function names and lim, checked before letters for the same reason.
    const word = [...A.FUNCS, "lim"].find((w) => src.startsWith(w, i));
    if (word) { out.push({ t: word === "lim" ? "lim" : "fn", v: word, at: i }); i += word.length; continue; }
    // d/dx — a derivative with respect to the letter after it.
    if (src.startsWith("d/d", i) && isAlpha(src[i + 3] || "")) { out.push({ t: "deriv", v: src[i + 3], at: i }); i += 4; continue; }
    if (c === "∫") { out.push({ t: "int", v: "∫", at: i }); i++; continue; }
    if (c === "°") { out.push({ t: "deg", v: "°", at: i }); i++; continue; }
    if (c === "_") { out.push({ t: "_", v: "_", at: i }); i++; continue; }
    if (src.startsWith("->", i)) { out.push({ t: "to", v: "->", at: i }); i += 2; continue; }
    if (c === "→") { out.push({ t: "to", v: "→", at: i }); i++; continue; }
    if (c === "√") { out.push({ t: "root", v: "√", at: i }); i++; continue; }
    if (isAlpha(c)) { out.push({ t: "var", v: c, at: i }); i++; continue; }
    if ("+-*/^()=".includes(c)) { out.push({ t: c, v: c, at: i }); i++; continue; }
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

const STARTS_FACTOR = new Set(["ref", "num", "var", "(", "hole", "root", "fn", "deriv", "int", "lim"]);

export function parse(src) {
  const toks = tokenise(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = (t) => { if (toks[p].t !== t) throw new SyntaxError(`I expected ${t === "end" ? "the end" : `"${t}"`} here.`); return toks[p++]; };

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
    if (tk.t === "num") { p++; return span(mark, A.num(R.fromDecimal(tk.v), tk.v.includes(".") ? tk.v : null)); }
    // e and π are numbers, not letters.
    if (tk.t === "var" && (tk.v === "e" || tk.v === "π")) { p++; return span(mark, A.cnst(tk.v)); }
    if (tk.t === "var") { p++; return span(mark, A.vr(tk.v)); }
    if (tk.t === "fn") { p++; return span(mark, A.fn(tk.v, atom())); }
    if (tk.t === "ref") { p++; return span(mark, A.ref(tk.v)); }
    if (tk.t === "deriv") { p++; return span(mark, A.deriv(atom(), tk.v)); }
    if (tk.t === "lim") {
      p++;
      eat("(");
      const at = peek();
      if (at.t !== "var") throw new SyntaxError("A limit says which letter is moving: lim(h->0)(…).");
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
        throw new SyntaxError("An integral ends with what it is taken with respect to: ∫(…)dx.");
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
    throw new SyntaxError(tk.t === "end" ? "The line stops before it is finished." : `I did not expect "${tk.v}" here.`);
  }

  function power() {
    const mark = from();
    let base = atom();
    // 30° is an angle in degrees.
    if (peek().t === "deg") { p++; base = span(mark, A.deg(base)); }
    if (peek().t === "^") { p++; return span(mark, A.pow(base, factor())); }
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
