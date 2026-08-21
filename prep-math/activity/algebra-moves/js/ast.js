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

/** A rational as a tree: an integer is one node, anything else is a fraction. */
export function numberNode(r) {
  if (R.isNegative(r)) return neg(numberNode(R.neg(r)));
  if (R.isInt(r)) return num(r);
  return frac(num(R.rat(r.n)), num(R.rat(r.d)));
}

export function kidsOf(node) {
  switch (node.kind) {
    case "neg":  return [node.k];
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
      case "sum":  { const ks = n.kids.map(rec); return ks.every((k, i) => k === n.kids[i]) ? n : sum(ks, n.id); }
      case "prod": { const ks = n.kids.map(rec); return ks.every((k, i) => k === n.kids[i]) ? n : prod(ks, n.id); }
      case "frac": { const a = rec(n.a), b = rec(n.b); return a === n.a && b === n.b ? n : frac(a, b, n.id); }
      case "pow":  { const b = rec(n.b), e = rec(n.e); return b === n.b && e === n.e ? n : pow(b, e, n.id); }
      case "eq":   { const l = rec(n.l), r = rec(n.r); return l === n.l && r === n.r ? n : eqn(l, r, n.id); }
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
      default:
        return false;
    }
  };

  if (!go(node, false)) return null;
  const sorted = vars.slice().sort();
  return { c, vars: sorted, sig: sorted.join("*") };
}

/** The variable nodes of a term, in the order they were written. */
export function varNodesOf(node) {
  const out = [];
  walk(node, (n) => { if (n.kind === "var" || (n.kind === "pow" && n.b.kind === "var")) out.push(n); });
  return out.filter((n, i, all) => !all.some((o, j) => j < i && o.kind === "pow" && o.b === n));
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
      default: return null;
    }
  } catch {
    return null;
  }
}
