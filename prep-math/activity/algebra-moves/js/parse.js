/* ═══════════════════════════════════════════════════════════════════════════
   PARSER

   The same linear syntax the rest of the site already asks students to type
   (utils/components/math-linear.js): 1/2 for a fraction, x^2 for a power, 3x
   for implicit multiplication. The difference is what comes out — that module
   transpiles to TeX for MathJax to set, which is a dead end here because we
   need a tree with stable node ids, not a picture.

   Grammar:

     equation := expr ("=" expr)?
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
const isAlpha = (c) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");

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
    if (isAlpha(c)) { out.push({ t: "var", v: c, at: i }); i++; continue; }
    if ("+-*/^()=".includes(c)) { out.push({ t: c, v: c, at: i }); i++; continue; }
    // The keypad's placeholder for a slot you have not filled in yet.
    if (c === "?") { out.push({ t: "hole", v: "?", at: i }); i++; continue; }
    // Typed with the keys a phone offers instead of the ones we expect.
    if (c === "×" || c === "·") { out.push({ t: "*", v: "*", at: i }); i++; continue; }
    if (c === "÷") { out.push({ t: "/", v: "/", at: i }); i++; continue; }
    if (c === "−") { out.push({ t: "-", v: "-", at: i }); i++; continue; }
    throw new SyntaxError(`I do not know what to do with "${c}".`);
  }
  out.push({ t: "end", v: "", at: src.length });
  return out;
}

/** Tokens that can begin a factor — a "-" cannot, or 3 - 2 would read as 3(-2). */
const STARTS_FACTOR = new Set(["num", "var", "(", "hole"]);

export function parse(src) {
  const toks = tokenise(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = (t) => { if (toks[p].t !== t) throw new SyntaxError(`I expected ${t === "end" ? "the end" : `"${t}"`} here.`); return toks[p++]; };

  function atom() {
    const tk = peek();
    if (tk.t === "num") { p++; return A.num(R.fromDecimal(tk.v), tk.v.includes(".") ? tk.v : null); }
    if (tk.t === "var") { p++; return A.vr(tk.v); }
    if (tk.t === "hole") { p++; return A.hole(); }
    // A bracket the student typed is a bracket they keep seeing: mark it here
    // rather than have the layout guess later where brackets belong.
    if (tk.t === "(") { p++; const e = expr(); eat(")"); e.paren = true; return e; }
    throw new SyntaxError(tk.t === "end" ? "The line stops before it is finished." : `I did not expect "${tk.v}" here.`);
  }

  function power() {
    const base = atom();
    if (peek().t === "^") { p++; return A.pow(base, factor()); }
    return base;
  }

  function factor() {
    if (peek().t === "-") { p++; return A.neg(factor()); }
    if (peek().t === "+") { p++; return factor(); }
    return power();
  }

  function term() {
    let node = factor();
    for (;;) {
      const tk = peek();
      if (tk.t === "*") { p++; node = mul(node, factor()); continue; }
      if (tk.t === "/") { p++; node = A.frac(node, factor()); continue; }
      if (STARTS_FACTOR.has(tk.t)) { node = mul(node, factor()); continue; }
      return node;
    }
  }

  // Keep a run of factors as ONE flat product, the way it is written — but a
  // product the student bracketed stays its own thing.
  const mul = (a, b) =>
    a.kind === "prod" && !a.paren ? A.prod([...a.kids, b], a.id) : A.prod([a, b]);

  function expr() {
    const terms = [term()];
    for (;;) {
      const tk = peek();
      if (tk.t === "+") { p++; terms.push(term()); continue; }
      if (tk.t === "-") { p++; terms.push(A.neg(term())); continue; }
      break;
    }
    return terms.length === 1 ? terms[0] : A.sum(terms);
  }

  const left = expr();
  if (peek().t !== "=") throw new SyntaxError("This needs an equals sign — the tool works on equations.");
  p++;
  const right = expr();
  eat("end");
  return A.eqn(left, right);
}
