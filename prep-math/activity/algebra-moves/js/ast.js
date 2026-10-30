/* ═══════════════════════════════════════════════════════════════════════════
   THE TREE

   Two rules govern everything in this file, and both are load-bearing:

   1. NOTHING IS CANONICALISED. If the student writes 2 + 3x + 1, the tree is
      sum[2, 3x, 1] and it stays that way until they act on it. No sorting, no
      folding, no tidying. Every algorithm downstream has to cope with
      student-shaped trees, which is exactly why a normalising CAS cannot be
      dropped in underneath this.

   2. EVERY NODE CARRIES AN ID, AND A REWRITE THAT LEAVES A SUBTREE ALONE MUST
      REUSE THE SAME NODE OBJECT. That is what lets the layout match a term in
      the new picture to the same term in the old one and slide it there. Build
      a brand-new node where an old one would have done and that term teleports
      instead of moving, which is the whole point of the tool, lost.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as R from "./rational.js";

let seq = 0;
export const freshId = () => `n${++seq}`;

export const num  = (v, text = null, id = freshId()) => ({ id, kind: "num", v, text });
export const vr   = (name, id = freshId())           => ({ id, kind: "var", name });
export const neg  = (k, id = freshId())              => ({ id, kind: "neg", k });
export const sum  = (kids, id = freshId())           => ({ id, kind: "sum", kids });
export const prod = (kids, id = freshId())           => ({ id, kind: "prod", kids });
export const frac = (a, b, id = freshId())           => ({ id, kind: "frac", a, b });
export const pow  = (b, e, id = freshId())           => ({ id, kind: "pow", b, e });
/* An equation — or an INEQUALITY: the same node with a relation that is < > ≤ or ≥ instead of =.
   Every move builds its next line with eqn(l, r, eq.id), so the relation rides on the id: a line
   keeps its relation unless the move says otherwise (see flipRel). */
const RELATION = new Map();
export const flipRel = (rel) => ({ "<": ">", ">": "<", "≤": "≥", "≥": "≤" }[rel] || "=");
export const eqn  = (l, r, id = freshId(), rel) => {
  const kept = rel || RELATION.get(id) || "=";
  if (kept !== "=") RELATION.set(id, kept);
  return kept === "=" ? { id, kind: "eq", l, r } : { id, kind: "eq", l, r, rel: kept };
};
export const relOf = (root) => (root && root.kind === "eq" && root.rel) || "=";
/* A square root — a surd when what is under it is not a perfect square. Its
   own node rather than a power of 1/2: x^(1/2) and √x are the same number but
   not the same writing, and a student who typed one expects to keep seeing it. */
export const root = (k, id = freshId())              => ({ id, kind: "root", k });
/* Plus-or-minus: ONE ± choice for the whole line, so x = −b ± √D is two
   answers written as one. Its own node, drawn like a minus sign and verified
   by checking both branches at once (see verify.js). */
export const pm   = (k, id = freshId())              => ({ id, kind: "pm", k });

/* ── Functions, constants and calculus ─────────────────────────────────────
   e and π are NUMBERS, not letters — the verifier gives them their values and
   never samples them. A function (sin, cos, tan, ln, log) wraps its argument;
   an angle written in degrees is a deg node around it, so sin(30°) is exact.
   d/dx(…), ∫(…)dx, ∫ from a to b, and lim(h→0) each wrap the thing they act
   on and name the letter they act WITH. */
// arcsin before sin is not needed for the tokenizer (they start differently),
// but the longer names must not be read as letters: a·r·c·sin.
/** A matrix, [[1,2],[3,4]]: `rows` is a list of rows, each a list of entries
    (any expression). Every row is the same length. */
export const mat = (rows, id = freshId()) => ({ id, kind: "mat", rows });
export const matSize = (m) => [m.rows.length, m.rows[0].length];

/** A percentage, 25%: the number `k` out of a hundred. */
export const pct = (k, id = freshId()) => ({ id, kind: "pct", k });
/* n! — the factorial — and nPr / nCr: arrangements and choices of r from n. */
export const fact = (k, id = freshId()) => ({ id, kind: "fact", k });
/* log_b(x): the power b must be raised to to give x. The base `b` is any expression. */
export const logb = (b, k, id = freshId()) => ({ id, kind: "logb", b, k });
/* The nth root: ∛27 is nroot(3, 27). The index is any expression. */
export const nroot = (n, k, id = freshId()) => ({ id, kind: "nroot", n, k });
/* Tetration, a power tower: ³2 is 2^(2^2). `b` the base, `n` how many high. */
/** a ÷ b written as a division, for the ÷ between stacked fractions: (a/b) ÷ (c/d). */
export const div = (a, b, id = freshId()) => ({ id, kind: "div", a, b });
export const tet = (b, n, id = freshId()) => ({ id, kind: "tet", b, n });
/* {4, 7, 9}: a list of numbers, for the mean and the median to be taken of. */
export const list = (items, id = freshId()) => ({ id, kind: "list", items });
/* Σ_(i=1)^(5)(2i + 1): the terms of the body for each whole number from lo to hi. */
export const sigma = (k, x, lo, hi, id = freshId()) => ({ id, kind: "sigma", x, lo, hi, k });
export const choose = (n, r, perm = false, id = freshId()) => ({ id, kind: "choose", n, r, perm });

/** A decimal as it is written: 0.25 — a number that keeps the text it was typed
    as, so it is drawn as a decimal and not as the fraction it is worth. */
export function decimalNode(r) {
  if (R.isNegative(r)) return neg(decimalNode(R.neg(r)));
  const text = decimalText(r);
  return text === null ? null : num(r, text);
}

/** The ending decimal of a rational, or null when it never ends (1/3). */
export function decimalText(r) {
  let d = r.d, twos = 0, fives = 0;
  while (d % 2n === 0n) { d /= 2n; twos++; }
  while (d % 5n === 0n) { d /= 5n; fives++; }
  if (d !== 1n) return null;
  const places = Math.max(twos, fives);
  const scaled = (r.n * 10n ** BigInt(places)) / r.d;
  const digits = String(scaled).padStart(places + 1, "0");
  return places === 0 ? digits : `${digits.slice(0, -places)}.${digits.slice(-places)}`;
}

/** A number written in another base: 1011₂ is { digits: "1011", base: 2 }.
    Digits past 9 are the letters A–Z (A is 10), so base 16 has 0–9 and A–F. */
/* A digit that is a lowercase LETTER is an unknown digit: y7_8 is y·8¹ + 7·8⁰.
   Each such letter is a node of its own (`dv`, one slot per digit) so every walk
   over the tree finds it; the other digits are numerals, kept in capitals. */
const tidyDigits = (digits) => [...String(digits)].map((c) => (/[a-z]/.test(c) ? c : c.toUpperCase())).join("");
const digitVars = (digits) => {
  const dv = [...digits].map((c) => (/[a-z]/.test(c) ? vr(c) : null));
  return dv.some(Boolean) ? dv : null;
};
export const based = (digits, base, id = freshId()) => {
  const d = tidyDigits(digits), dv = digitVars(d);
  return { id, kind: "base", digits: d, base, ...(dv ? { dv } : {}) };
};
/* 35_y: digits in a base that is a LETTER — 3y + 5 once it is written out. The
   letter is a node of its own (`v`) so every walk over the tree finds it. */
/* 101_(x + 1): digits in a base that is any EXPRESSION — a letter, a sum, anything. */
export const basedExpr = (digits, v, id = freshId()) => {
  const d = tidyDigits(digits), dv = digitVars(d);
  return { id, kind: "base", digits: d, base: null, v, ...(dv ? { dv } : {}) };
};
export const basedVar = (digits, name, id = freshId()) => {
  const d = tidyDigits(digits), dv = digitVars(d);
  return { id, kind: "base", digits: d, base: null, v: vr(name), ...(dv ? { dv } : {}) };
};

/** Its value, exactly, or null when a digit does not belong in that base. */
export function baseValue(digits, base) {
  if (base == null) return null;             // a base that is a letter has no number yet
  if (/[a-z]/.test(String(digits))) return null;   // an unknown digit has no number yet
  let v = 0n;
  for (const ch of String(digits).toUpperCase()) {
    const d = parseInt(ch, 36);
    if (Number.isNaN(d) || d >= base) return null;
    v = v * BigInt(base) + BigInt(d);
  }
  return v;
}

/** A mixed number, 2⅓: a whole number `w` and a proper fraction `f` (a frac
    of two whole numbers) written side by side, meaning w + f. */
export const mixed = (w, f, id = freshId()) => ({ id, kind: "mixed", w, f });

/** A named equation — E_1 — standing for the whole equation it names, in what
    is typed to combine equations (E_1 − E_2, 2E_1 + 3). Never left in a line:
    workspace.js swaps each one for that equation's left side, then its right. */
export const ref = (name, id = freshId()) => ({ id, kind: "ref", name });

export const FUNCS = ["arcsin", "arccos", "arctan", "transpose", "sin", "cos", "tan", "ln", "log", "det",
  "median", "mean", "mode", "range", "sum"];
/** The functions of a list of numbers; each is only a function when a bracket follows. */
export const LIST_FNS = ["median", "mean", "mode", "range", "sum"];
/** How a function's name is drawn: arcsin is written sin⁻¹. */
export const FN_FACE = { arcsin: "sin⁻¹", arccos: "cos⁻¹", arctan: "tan⁻¹" };
export const cnst  = (name, id = freshId())          => ({ id, kind: "const", name });
export const fn    = (name, k, id = freshId())       => ({ id, kind: "fn", name, k });
export const deg   = (k, id = freshId())             => ({ id, kind: "deg", k });
export const deriv = (k, x, id = freshId())          => ({ id, kind: "deriv", x, k });
export const integ = (k, x, lo = null, hi = null, id = freshId()) => ({ id, kind: "int", x, k, lo, hi });
export const lim   = (k, x, to, id = freshId())      => ({ id, kind: "lim", x, to, k });

/* A line with only one side: 3x + 5 − x, put on the canvas to be tidied rather
   than solved. It is a node of its own rather than an equation with a missing
   half, so that nothing downstream can forget to check and go looking for eq.r.
   Everything that walks a root asks SIDES what sides it has, and gets one. */
export const expression = (e, id = freshId())        => ({ id, kind: "expr", e });

/* An empty slot in a half-typed line — the box a fraction key leaves behind
   before anything has been put in it. It only ever exists in the keypad's
   preview: nothing with a hole in it can be put on the canvas, so no move and
   no verifier ever meets one. */
export const hole = (id = freshId())                 => ({ id, kind: "hole" });

/** A rational as a tree: an integer is one node, anything else is a fraction. */
export function numberNode(r) {
  if (R.isNegative(r)) return neg(numberNode(R.neg(r)));
  if (R.isInt(r)) return num(r);
  return frac(num(R.rat(r.n)), num(R.rat(r.d)));
}

export function kidsOf(node) {
  switch (node.kind) {
    case "expr": return [node.e];
    case "neg":  return [node.k];
    case "root": return [node.k];
    case "mixed": return [node.w, node.f];
    case "base":  return [...(node.v ? [node.v] : []), ...(node.dv || []).filter(Boolean)];
    case "pct":  return [node.k];
    case "fact": return [node.k];
    case "logb": return [node.b, node.k];
    case "nroot": return [node.n, node.k];
    case "tet": return [node.n, node.b];
    case "list": return node.items;
    case "sigma": return [node.lo, node.hi, node.k];
    case "choose": return [node.n, node.r];
    case "mat":  return node.rows.flat();
    case "pm":   return [node.k];
    case "fn":
    case "deg":
    case "deriv": return [node.k];
    case "int":  return [node.k, ...(node.lo ? [node.lo, node.hi] : [])];
    case "lim":  return [node.to, node.k];
    case "sum":
    case "prod": return node.kids;
    case "frac":
    case "div": return [node.a, node.b];
    case "pow":  return [node.b, node.e];
    case "eq":   return [node.l, node.r];
    default:     return [];
  }
}

export function walk(node, visit, parent = null) {
  visit(node, parent);
  for (const k of kidsOf(node)) walk(k, visit, node);
}

export function findById(root, id) {
  let hit = null;
  walk(root, (n) => { if (n.id === id) hit = n; });
  return hit;
}

export function parentOf(root, id) {
  let hit = null;
  walk(root, (n, p) => { if (n.id === id) hit = p; });
  return hit;
}

/** Replace one node by id, reusing every node object that is not on the path. */
export function replace(root, id, next) {
  const rebuild = (n) => {
    switch (n.kind) {
      case "neg":  { const k = rec(n.k); return k === n.k ? n : neg(k, n.id); }
      // Built literally: this function's own parameter is called `root`.
      case "root": { const k = rec(n.k); return k === n.k ? n : { id: n.id, kind: "root", k }; }
      case "pm":   { const k = rec(n.k); return k === n.k ? n : { id: n.id, kind: "pm", k }; }
      case "mixed": { const w = rec(n.w), f = rec(n.f); return w === n.w && f === n.f ? n : { ...n, w, f }; }
      case "pct":  { const k = rec(n.k); return k === n.k ? n : { ...n, k }; }
      case "base": {
        const v = n.v && rec(n.v);
        const dv = n.dv && n.dv.map((d) => d && rec(d));
        const same = v === n.v && (!dv || dv.every((d, i) => d === n.dv[i]));
        return same ? n : { ...n, ...(n.v ? { v } : {}), ...(dv ? { dv } : {}) };
      }
      case "fact": { const k = rec(n.k); return k === n.k ? n : { ...n, k }; }
      case "logb": { const b = rec(n.b), k = rec(n.k); return b === n.b && k === n.k ? n : { ...n, b, k }; }
      case "nroot": { const a = rec(n.n), k = rec(n.k); return a === n.n && k === n.k ? n : { ...n, n: a, k }; }
      case "tet": { const b = rec(n.b), a = rec(n.n); return b === n.b && a === n.n ? n : { ...n, b, n: a }; }
      case "list": { const items = n.items.map(rec); return items.every((k, i) => k === n.items[i]) ? n : { ...n, items }; }
      case "sigma": { const lo = rec(n.lo), hi = rec(n.hi), k = rec(n.k); return lo === n.lo && hi === n.hi && k === n.k ? n : { ...n, lo, hi, k }; }
      case "choose": { const a = rec(n.n), b = rec(n.r); return a === n.n && b === n.r ? n : { ...n, n: a, r: b }; }
      case "mat": {
        let changed = false;
        const rows = n.rows.map((r) => r.map((c) => { const k = rec(c); if (k !== c) changed = true; return k; }));
        return changed ? { ...n, rows } : n;
      }
      case "fn":
      case "deg":
      case "deriv": { const k = rec(n.k); return k === n.k ? n : { ...n, k }; }
      case "int": {
        const k = rec(n.k), lo = n.lo && rec(n.lo), hi = n.hi && rec(n.hi);
        return k === n.k && lo === n.lo && hi === n.hi ? n : { ...n, k, lo, hi };
      }
      case "lim": { const k = rec(n.k), to = rec(n.to); return k === n.k && to === n.to ? n : { ...n, k, to }; }
      case "sum":  { const ks = n.kids.map(rec); return ks.every((k, i) => k === n.kids[i]) ? n : sum(ks, n.id); }
      case "prod": { const ks = n.kids.map(rec); return ks.every((k, i) => k === n.kids[i]) ? n : prod(ks, n.id); }
      case "frac": { const a = rec(n.a), b = rec(n.b); return a === n.a && b === n.b ? n : frac(a, b, n.id); }
      case "div": { const a = rec(n.a), b = rec(n.b); return a === n.a && b === n.b ? n : { ...n, a, b }; }
      case "pow":  { const b = rec(n.b), e = rec(n.e); return b === n.b && e === n.e ? n : pow(b, e, n.id); }
      case "eq":   { const l = rec(n.l), r = rec(n.r); return l === n.l && r === n.r ? n : eqn(l, r, n.id); }
      case "expr": { const e = rec(n.e); return e === n.e ? n : expression(e, n.id); }
      default:     return n;
    }
  };
  const rec = (n) => (n.id === id ? next : rebuild(n));
  return rec(root);
}

/* ── Terms ──────────────────────────────────────────────────────────────────
   The top-level terms of a side are what the student acts on: the things that
   can cross the equals sign or fold into each other. A side that is not a sum
   is a single term. */

export const termsOf = (side) => (side.kind === "sum" ? side.kids : [side]);

/* ── The sides of a line ────────────────────────────────────────────────────
   Two for an equation, one for an expression. Every walk over "both sides" in
   the tool goes through here, which is what let expressions arrive without a
   `.r` being read somewhere and coming back undefined. */

export const SIDES = (root) => (root.kind === "expr" ? ["e"] : ["l", "r"]);

export const isEquation = (root) => root.kind === "eq";
/** A line that says one side is smaller or bigger than the other, not equal to it. */
export const isInequality = (root) => root.kind === "eq" && !!root.rel && root.rel !== "=";

/** The same line with one side replaced, keeping the root's own id. */
export function setSide(root, side, next) {
  if (root.kind === "expr") return next === root.e ? root : expression(next, root.id);
  if (side === "l") return next === root.l ? root : eqn(next, root.r, root.id);
  return next === root.r ? root : eqn(root.l, next, root.id);
}

/* ── Containers ─────────────────────────────────────────────────────────────
   A container is whatever `termsOf` splits into terms: each side of the line
   is one, and so is the numerator and the denominator of every fraction,
   however deep it is buried — inside a bracket, inside another fraction's
   own numerator, it makes no difference. That is the whole of what "every
   part of a term is targetable, even in fractions" means structurally: a
   term is tappable the moment SOME container owns it, and a fraction hands
   out two more containers the instant it exists. */
export function containersOf(root) {
  const out = [];
  for (const s of SIDES(root)) out.push(root[s]);
  walk(root, (n) => {
    if (n.kind === "frac") { out.push(n.a); out.push(n.b); }
    // What a d/dx, an ∫ or a lim acts on is worked on like a side of its own.
    if (n.kind === "deriv" || n.kind === "int" || n.kind === "lim") out.push(n.k);
    // Every entry of a matrix is worked on like a side of its own.
    if (n.kind === "mat") for (const cell of n.rows.flat()) out.push(cell);
  });
  return out;
}

/** Every term a student can tap, in every container — both true sides of the
    line, and recursively, the numerator and denominator of every fraction
    anywhere in it. */
export const allTerms = (root) => containersOf(root).flatMap(termsOf);

/** Rebuild a side from its terms, keeping the sum's own id if there still is one. */
export function sideFromTerms(terms, oldSide) {
  if (terms.length === 0) return num(R.ZERO);
  if (terms.length === 1) return terms[0];
  return sum(terms, oldSide && oldSide.kind === "sum" ? oldSide.id : freshId());
}

/* ── Reading a term ─────────────────────────────────────────────────────────
   Splits a term into an exact coefficient and a signature of its variable part
   ("x", "x*y", "x*x"). Returns null for anything it cannot read that way. An
   unreadable term is simply one the student gets fewer offers on, never one we
   guess about.

   The signature is sorted, but ONLY for comparing two terms. It never feeds
   back into the tree, so the student's own ordering survives. */

export function readTerm(node) {
  const vars = [];
  let c = R.ONE;

  const go = (n, flip) => {
    switch (n.kind) {
      case "num":
        c = R.mul(c, flip ? R.neg(n.v) : n.v);
        return true;
      // 25% is a number like any other: a quarter. So is 5!, and so is nCr.
      case "fact":
      case "choose":
      case "pct": {
        const v = exactValue(n);
        if (!v) return false;
        c = R.mul(c, flip ? R.neg(v) : v);
        return true;
      }
      // 1011₂ is a number like any other: eleven.
      case "base": {
        const v = exactValue(n);
        if (!v) return false;
        c = R.mul(c, flip ? R.neg(v) : v);
        return true;
      }
      // 2⅓ is a number like any other: 7/3.
      case "mixed": {
        const v = exactValue(n);
        if (!v) return false;
        c = R.mul(c, flip ? R.neg(v) : v);
        return true;
      }
      case "var":
        vars.push(n.name);
        if (flip) c = R.neg(c);
        return true;
      case "neg":
        return go(n.k, !flip);
      case "prod":
        if (flip) c = R.neg(c);
        return n.kids.every((k) => go(k, false));
      case "pow": {
        if (n.b.kind !== "var" || n.e.kind !== "num" || !R.isInt(n.e.v)) return false;
        const k = Number(n.e.v.n);
        if (k < 1 || k > 32) return false;
        for (let i = 0; i < k; i++) vars.push(n.b.name);
        if (flip) c = R.neg(c);
        return true;
      }
      case "frac": {
        const a = readTerm(n.a);
        const b = readTerm(n.b);
        if (!a || !b || b.vars.length || R.isZero(b.c)) return false;
        c = R.mul(c, R.div(a.c, b.c));
        if (flip) c = R.neg(c);
        vars.push(...a.vars);
        return true;
      }
      case "const":
        vars.push(n.name);
        if (flip) c = R.neg(c);
        return true;
      case "fn":
      case "mat":
      case "deg":
      case "deriv":
      case "int":
      case "lim":
        vars.push(`#${shapeKey(n)}`);
        if (flip) c = R.neg(c);
        return true;
      /* A surd counts as part of the "letter" part of a term, so 2√3 and 5√3
         are like terms the same way 2x and 5x are — and fold to 7√3. Only a
         number or a single letter under the root is read; anything else is a
         term this rule does not guess about. */
      case "root": {
        const k = n.k;
        if (k.kind === "num") vars.push(`√${R.toText(k.v)}`);
        else if (k.kind === "var") vars.push(`√${k.name}`);
        else return false;
        if (flip) c = R.neg(c);
        return true;
      }
      default:
        return false;
    }
  };

  if (!go(node, false)) return null;
  const sorted = vars.slice().sort();
  return { c, vars: sorted, sig: sorted.join("*") };
}

/** A node's shape with every id stripped, so two writings of sin(x) compare equal. */
export const shapeKey = (n) =>
  JSON.stringify(n, (k, v) => (k === "id" || k === "src" || k === "paren" ? undefined : typeof v === "bigint" ? String(v) : v));

/** The "letter part" nodes of a term, in the order they were written — a
    letter, a power of a letter, or a surd. Not descended into: the x of x² and
    the 3 of √3 belong to the node above them. */
export function varNodesOf(node) {
  const out = [];
  const go = (n) => {
    if (n.kind === "var" || n.kind === "root" || (n.kind === "pow" && n.b.kind === "var")
        || ["const", "fn", "mat", "deg", "deriv", "int", "lim"].includes(n.kind)) { out.push(n); return; }
    for (const k of kidsOf(n)) go(k);
  };
  go(node);
  return out;
}

/** Rebuild a term as coefficient times variable part, reusing the given var nodes. */
export function termFrom(c, varNodes) {
  // Nothing times x is nothing, not "0x".
  if (R.isZero(c)) return numberNode(R.ZERO);
  if (varNodes.length === 0) return numberNode(c);
  if (R.isNegative(c)) return neg(termFrom(R.neg(c), varNodes));
  if (R.isOne(c)) return varNodes.length === 1 ? varNodes[0] : prod(varNodes);
  return prod([numberNode(c), ...varNodes]);
}

/** Every variable name in a tree. */
export function varsIn(root) {
  const set = new Set();
  walk(root, (n) => { if (n.kind === "var") set.add(n.name); });
  return [...set];
}

/** True when a subtree contains no variables at all. */
export function isNumeric(node) {
  let ok = true;
  walk(node, (n) => { if (n.kind === "var") ok = false; });
  return ok;
}

/** The exact value of a variable-free subtree, or null when it has none. */
/** The nth root of a whole number as a whole number, or null: 27, 3 -> 3 (binary search, so no float error). */
export function intRoot(m, n) {
  if (m < 0n || n < 1n) return null;
  if (m < 2n) return m;
  let lo = 1n, hi = 1n;
  while (hi ** n <= m) hi *= 2n;
  while (lo < hi) {
    const mid = (lo + hi) / 2n;
    if (mid ** n < m) lo = mid + 1n; else hi = mid;
  }
  return lo ** n === m ? lo : null;
}
/** ⁿ√x exactly, when numerator and denominator are both perfect nth powers (∛(8/27) is 2/3; ∛−8 is −2). */
function nrootValue(node) {
  const nv = exactValue(node.n), x = exactValue(node.k);
  if (!nv || !x || !R.isInt(nv) || nv.n < 2n || nv.n > 64n) return null;
  const n = nv.n, neg = R.isNegative(x);
  if (neg && n % 2n === 0n) return null;
  const top = intRoot(neg ? -x.n : x.n, n), bottom = intRoot(x.d, n);
  if (top === null || bottom === null) return null;
  return R.rat(neg ? -top : top, bottom);
}
/** ⁿa, the tower a^a^…^a n high, when it stays small enough to write down. */
function tetValue(node) {
  const a = exactValue(node.b), nv = exactValue(node.n);
  if (!a || !nv || !R.isInt(nv) || nv.n < 0n || nv.n > 12n) return null;
  const n = Number(nv.n);
  if (n === 0) return R.ONE;
  let t = a;
  for (let i = 1; i < n; i++) {
    if (!R.isInt(t) || t.n > 32n || t.n < -32n) return null;       // the exponent has grown past what is worth writing out
    if (R.isZero(a) && R.isNegative(t)) return null;
    t = R.ipow(a, Number(t.n));
    if (R.toNumber(t) > 1e30) return null;
  }
  return t;
}

/** log_b x as a whole number, when b^n is exactly x for some whole n (log₂ 8 is 3, log₂ ¼ is −2); null otherwise. */
function logValue(node) {
  const b = exactValue(node.b), x = exactValue(node.k);
  if (!b || !x || R.isZero(b) || R.isNegative(b) || R.isNegative(x) || R.isZero(x) || R.isOne(b)) return null;
  if (R.isOne(x)) return R.ZERO;
  for (let n = 1; n <= 64; n++) {
    const up = R.ipow(b, n);
    if (R.same(up, x)) return R.rat(BigInt(n));
    if (R.same(R.ipow(b, -n), x)) return R.rat(BigInt(-n));
    // past the target in both directions: no whole answer
    if (R.toNumber(up) > 1e18 && R.toNumber(R.ipow(b, -n)) < 1e-18) break;
  }
  return null;
}

const BIG_FACT = 170n;            // past this a factorial is not worth writing down
function factorialBig(k) { let f = 1n; for (let i = 2n; i <= k; i++) f *= i; return f; }
/** n! and nPr / nCr for whole numbers, exactly; null when they have no such value. */
function countingValue(node) {
  const whole = (v) => v && R.isInt(v) && v.n >= 0n && v.n <= BIG_FACT ? v.n : null;
  if (node.kind === "fact") {
    const k = whole(exactValue(node.k));
    return k === null ? null : R.rat(factorialBig(k));
  }
  const n = whole(exactValue(node.n)), r = whole(exactValue(node.r));
  if (n === null || r === null || r > n) return null;
  const top = factorialBig(n);
  return R.rat(node.perm ? top / factorialBig(n - r) : top / (factorialBig(r) * factorialBig(n - r)));
}

/** The mean, median, mode, range or sum of a list of exact numbers, or null. */
function listValue(node) {
  if (!LIST_FNS.includes(node.name) || node.k.kind !== "list" || !node.k.items.length) return null;
  const vs = node.k.items.map(exactValue);
  if (vs.some((v) => !v)) return null;
  const sign = (a, b) => { const d = R.sub(a, b); return d.n < 0n ? -1 : d.n > 0n ? 1 : 0; };
  const sorted = [...vs].sort(sign);
  const total = vs.reduce((a, v) => R.add(a, v), R.ZERO);
  switch (node.name) {
    case "sum": return total;
    case "mean": return R.div(total, R.rat(BigInt(vs.length)));
    case "range": return R.sub(sorted[sorted.length - 1], sorted[0]);
    case "median": {
      const m = sorted.length >> 1;
      return sorted.length % 2 ? sorted[m] : R.div(R.add(sorted[m - 1], sorted[m]), R.rat(2n));
    }
    case "mode": {
      const counts = new Map();
      for (const v of vs) { const key = `${v.n}/${v.d}`; counts.set(key, { v, c: (counts.get(key)?.c || 0) + 1 }); }
      const best = Math.max(...[...counts.values()].map((e) => e.c));
      const top = [...counts.values()].filter((e) => e.c === best);
      return top.length === 1 ? top[0].v : null;     // two modes is not one number
    }
    default: return null;
  }
}

export function exactValue(node) {
  try {
    switch (node.kind) {
      case "fn": return listValue(node);
      case "fact":
      case "choose": return countingValue(node);
      case "num":  return node.v;
      case "base": {
        // a base that is an expression with a whole-number value (101_(1+2)) is that number's base
        let b = node.base;
        if (node.v) { const bv = exactValue(node.v); b = bv && R.isInt(bv) && bv.n >= 2n && bv.n <= 1000n ? Number(bv.n) : null; }
        const v = b === null ? null : baseValue(node.digits, b);
        return v === null ? null : R.rat(v);
      }
      case "logb": return logValue(node);
      case "nroot": return nrootValue(node);
      case "tet": return tetValue(node);
      case "pct":  { const k = exactValue(node.k); return k ? R.div(k, R.rat(100n)) : null; }
      case "mixed": { const w = exactValue(node.w), f = exactValue(node.f); return w && f ? R.add(w, f) : null; }
      case "neg":  { const k = exactValue(node.k); return k ? R.neg(k) : null; }
      case "sum": {
        let acc = R.ZERO;
        for (const k of node.kids) { const v = exactValue(k); if (!v) return null; acc = R.add(acc, v); }
        return acc;
      }
      case "prod": {
        let acc = R.ONE;
        for (const k of node.kids) { const v = exactValue(k); if (!v) return null; acc = R.mul(acc, v); }
        return acc;
      }
      case "frac":
      case "div": {
        const a = exactValue(node.a), b = exactValue(node.b);
        return a && b && !R.isZero(b) ? R.div(a, b) : null;
      }
      case "pow": {
        const b = exactValue(node.b), e = exactValue(node.e);
        if (!b || !e || !R.isInt(e)) return null;
        const k = Number(e.n);
        if (Math.abs(k) > 32 || (k < 0 && R.isZero(b))) return null;
        return R.ipow(b, k);
      }
      // Exact only when it comes out exact: √16 is 4 and √(9/4) is 3/2, but √3
      // has no rational value and stays a surd.
      case "root": {
        const v = exactValue(node.k);
        if (!v || R.isNegative(v)) return null;
        const top = R.squareSplit(v.n), bottom = R.squareSplit(v.d);
        return top.inside === 1n && bottom.inside === 1n ? R.rat(top.out, bottom.out) : null;
      }
      default: return null;
    }
  } catch {
    return null;
  }
}
