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
export const eqn  = (l, r, id = freshId())           => ({ id, kind: "eq", l, r });
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
/** A named equation — E_1 — standing for the whole equation it names, in what
    is typed to combine equations (E_1 − E_2, 2E_1 + 3). Never left in a line:
    workspace.js swaps each one for that equation's left side, then its right. */
export const ref = (name, id = freshId()) => ({ id, kind: "ref", name });

export const FUNCS = ["arcsin", "arccos", "arctan", "sin", "cos", "tan", "ln", "log"];
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
    case "pm":   return [node.k];
    case "fn":
    case "deg":
    case "deriv": return [node.k];
    case "int":  return [node.k, ...(node.lo ? [node.lo, node.hi] : [])];
    case "lim":  return [node.to, node.k];
    case "sum":
    case "prod": return node.kids;
    case "frac": return [node.a, node.b];
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
        || ["const", "fn", "deg", "deriv", "int", "lim"].includes(n.kind)) { out.push(n); return; }
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
export function exactValue(node) {
  try {
    switch (node.kind) {
      case "num":  return node.v;
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
      case "frac": {
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
