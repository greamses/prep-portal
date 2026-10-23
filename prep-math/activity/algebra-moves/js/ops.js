/* ═══════════════════════════════════════════════════════════════════════════
   THE MOVES

   The student names the move; we do the mechanics. Nothing here has to work
   out what a drag meant, which is the single biggest source of both difficulty
   and wrongness in a drag-driven tool — and the reason this one is not.

   Every move returns { eq, from, note }:

     eq   the new equation, sharing every node object it did not have to touch
     from newNodeId -> [oldNodeId, ...] for nodes that are the OLD node in a new
          shape, so the picture can move them rather than replace them
     note what to write in the working, in words

   `from` is only needed where a node could not keep its own id. Anywhere a
   subtree came through untouched it is literally the same object, so its id
   carries and the animation is automatic. That is the whole reason ast.js
   insists on structural sharing.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as A from "./ast.js";
import * as R from "./rational.js";
import { plain } from "./layout.js";

/** Where a node sits, if it is one of the terms of SOME container — a true
    side of the line, or the numerator/denominator of a fraction anywhere in
    it (see A.containersOf). `topSide` is "l"/"r"/"e" only when the container
    IS a true side, which is what the balance-rule moves (across, divide,
    times, flip, swap) need and the tidying ones (combine, expand, drop a
    zero) do not — those rebuild whichever container actually owns the term,
    with A.replace, wherever in the tree it happens to be. */
function locate(eq, id) {
  const sides = A.SIDES(eq);
  for (const container of A.containersOf(eq)) {
    const terms = A.termsOf(container);
    const index = terms.findIndex((t) => t.id === id);
    if (index < 0) continue;
    const topSide = sides.find((s) => eq[s] === container) ?? null;
    return {
      container, topSide,
      other: topSide ? (topSide === "l" ? "r" : "l") : null,
      index, terms, term: terms[index],
    };
  }
  return null;
}

/** Put a container's rebuilt terms back wherever it actually sits in the
    tree — the top of a side, same as always, or buried in a fraction. */
const setContainer = (eq, loc, nextTerms) =>
  A.replace(eq, loc.container.id, A.sideFromTerms(nextTerms, loc.container));

const isPlainZero = (node) => node.kind === "num" && R.isZero(node.v);

/** Numbers written in prose use the same minus sign the equation does. */
const say = (r) => R.toText(r).replace(/-/g, "−");

/** The same number as it goes in a MARGIN, where a minus needs holding. */
const mul = (r) => (R.isNegative(r) ? `(${say(r)})` : say(r));

/* ── Take a term from both sides ────────────────────────────────────────────
   The move everyone means when they say "move it across". We do not model it
   as movement: we subtract the term from both sides, it cancels on one and
   lands negated on the other. The picture happens to look like movement, which
   is the point — but the maths underneath is the balance rule. */

/* The four moves below act on BOTH sides, so a one-sided line has nothing for
   them to do. They are never offered on an expression; the guard is here as
   well because ops.js is a public surface — the HTTP API reaches these by name. */
const TWO_SIDED = "There is only one side here — that is an expression, not an equation.";

export function takeAcross(eq, id) {
  if (!A.isEquation(eq)) return { error: TWO_SIDED };
  const loc = locate(eq, id);
  if (!loc || !loc.topSide) return { error: "That is not one of the terms." };
  const { topSide: side, other, index, terms, term } = loc;

  // −5 taken from both sides means +5 arrives; the 5 keeps its own id and slides,
  // and the minus sign it used to wear is what dies.
  const moved = term.kind === "neg" && !term.paren ? term.k : A.neg(term);

  const rest = terms.filter((_, i) => i !== index);
  const nextSide = A.sideFromTerms(rest, eq[side]);

  const otherTerms = A.termsOf(eq[other]);
  // A lone 0 on the far side is a placeholder, not a term worth keeping.
  const nextOther =
    otherTerms.length === 1 && isPlainZero(otherTerms[0])
      ? moved
      : A.sideFromTerms([...otherTerms, moved], eq[other]);

  const eqNext = A.setSide(A.setSide(eq, side, nextSide), other, nextOther);
  const adding = term.kind === "neg" && !term.paren;
  const what = plain(adding ? term.k : term);

  return {
    eq: eqNext,
    from: new Map(),
    note: adding ? `Add ${what} to both sides` : `Take ${what} from both sides`,
  };
}

/* ── Fold two like terms into one ───────────────────────────────────────────
   3x + 5x is 8x. Also 2 + 3 is 5, because two plain numbers are like terms
   with an empty variable part — one rule, not two. */

export function combine(eq, aId, bId) {
  const la = locate(eq, aId);
  const lb = locate(eq, bId);
  if (!la || !lb || la.container.id !== lb.container.id) return { error: "Those two are not on the same side." };
  if (la.index === lb.index) return { error: "That is the same term twice." };

  const [first, second] = la.index < lb.index ? [la, lb] : [lb, la];
  const ra = A.readTerm(first.term);
  const rb = A.readTerm(second.term);
  if (!ra || !rb) return { error: "I cannot read one of those as a term." };
  if (ra.sig !== rb.sig) return { error: "Those are not like terms." };

  const total = R.add(ra.c, rb.c);
  // Reuse the FIRST term's own variable nodes, so the x stays exactly where it
  // is and only the number in front of it changes.
  const combined = A.termFrom(total, ra.vars.length ? A.varNodesOf(first.term) : []);

  const nextTerms = first.terms
    .map((t, i) => (i === first.index ? combined : t))
    .filter((_, i) => i !== second.index);

  const eqNext = setContainer(eq, first, nextTerms);

  // Both old terms feed the new one, so both fly to it.
  const sources = [first.term.id, second.term.id].filter((x) => x !== combined.id);
  const from = new Map();
  if (sources.length) from.set(combined.id, sources);

  return {
    eq: eqNext,
    from,
    mark: plain(combined),
    note: `${plain(first.term)} and ${plain(second.term)} make ${plain(combined)}`,
  };
}

/* ── Divide both sides ──────────────────────────────────────────────────────
   Only ever by a NUMBER. Dividing by an expression is where a tool like this
   quietly loses a root or divides by zero, and refusing it outright costs the
   student nothing at this level while making a whole class of wrong answers
   impossible. */

export function divideBoth(eq, value) {
  if (!A.isEquation(eq)) return { error: TWO_SIDED };
  if (R.isZero(value)) return { error: "Nothing can be divided by zero." };
  if (R.isOne(value)) return { error: "Dividing by one changes nothing." };

  // Each side keeps its id, so both sides slide up into their numerators.
  const eqNext = A.eqn(
    A.frac(eq.l, A.numberNode(value)),
    A.frac(eq.r, A.numberNode(value)),
    eq.id
  );

  return { eq: eqNext, from: new Map(), note: `Divide both sides by ${say(value)}` };
}

/* ── Times both sides ───────────────────────────────────────────────────────
   The other half of dividing, and the only way past (3x + 5)/4 = 5: the top is
   a sum, so there is nothing to cancel it down to, and every other move leaves
   the fraction exactly where it was.

   Only by a NUMBER, and never by zero, for the same reason as dividing —
   multiplying an equation by something that might be zero turns it into one
   that every number solves. */

/** Brackets a numerator wore inside a fraction are not wanted once it is a
    side of its own. Same id, so the writing still travels. */
const unbracket = (node) => (node.paren ? { ...node, paren: false } : node);

export function timesBoth(eq, value) {
  if (!A.isEquation(eq)) return { error: TWO_SIDED };
  if (R.isZero(value)) return { error: "Multiplying by zero loses the equation." };
  if (R.isOne(value)) return { error: "Multiplying by one changes nothing." };

  const from = new Map();

  const grow = (side) => {
    // A fraction over exactly this number simply loses its bottom, and its top
    // comes up wearing its own id — so the numerator's writing does not move.
    if (side.kind === "frac") {
      const den = A.exactValue(side.b);
      if (den && R.same(den, value)) return unbracket(side.a);
    }
    const next = A.prod([A.numberNode(value), side]);
    from.set(next.id, [side.id]);
    return next;
  };

  return {
    eq: A.eqn(grow(eq.l), grow(eq.r), eq.id),
    from,
    note: `Multiply both sides by ${say(value)}`,
  };
}

/* ── Times both sides by a letter ───────────────────────────────────
   d = m/V, find V. The unknown is underneath a bar, and no number moves it: the
   only way out is to multiply both sides by V itself.

   Multiplying an equation by something that might be zero normally turns it
   into one that every number solves, which is why this is refused everywhere
   else. It is safe HERE and only here: the letter is the bottom of a fraction
   in the equation being multiplied, so the equation already says nothing at all
   about the case where that letter is zero. Nothing is gained and nothing lost.

   The verifier is not asked to take that on trust. The move declares WHAT IT
   SCALED BY and the check becomes exact — every sample must satisfy
   next = prev × V — which is a stronger test than the constant-ratio one it
   replaces, not a weaker one. */

export function timesByTerm(eq, node) {
  if (!A.isEquation(eq)) return { error: TWO_SIDED };
  if (node.kind !== "var") return { error: "I only multiply both sides by a single letter." };

  const from = new Map();
  const grow = (side) => {
    if (side.kind === "frac" && side.b.kind === "var" && side.b.name === node.name) {
      return unbracket(side.a);
    }
    // A fresh letter each side: the same node object in two places would give
    // the tree one id standing in two spots, and every lookup after that is a
    // coin toss.
    const next = A.prod([side, A.vr(node.name)]);
    from.set(next.id, [side.id]);
    return next;
  };

  return {
    eq: A.eqn(grow(eq.l), grow(eq.r), eq.id),
    from,
    scaledBy: A.vr(node.name),
    note: `Multiply both sides by ${node.name}`,
  };
}

/* ── Cancel a fraction down ─────────────────────────────────────────────────
   What dividing both sides leaves behind: 3x/3. The numerator has to READ as a
   term and the denominator has to be a plain non-zero number, so there is no
   route here to cancelling something that might be zero. */

export function cancel(eq, id) {
  const node = A.findById(eq, id);
  if (!node || node.kind !== "frac") return { error: "That is not a fraction." };

  const den = A.exactValue(node.b);
  if (!den) return { error: "The bottom is not a plain number." };
  if (R.isZero(den)) return { error: "The bottom is zero." };

  const top = A.readTerm(node.a);
  if (!top) return { error: "I cannot read the top as a term." };

  /* Cancelling has to leave a WHOLE number in front, because that is what the
     word means to a student. Without this, x/3 "cancels" to 1/3x and 2x/5 to
     2/5x — the bar goes away and a worse fraction takes its place, and the
     working that follows is unreadable. Those are the fractions you clear by
     multiplying both sides instead. */
  const c = R.div(top.c, den);
  if (!R.isInt(c)) return { error: "The bottom does not divide into the top." };

  // Reuse the numerator's own variable nodes: the x never moves, the 3s go.
  const next = A.termFrom(c, top.vars.length ? A.varNodesOf(node.a) : []);
  if (plain(next) === plain(node)) return { error: "That will not cancel." };

  const from = next.id === node.id ? new Map() : new Map([[next.id, [node.id]]]);
  return { eq: A.replace(eq, id, next), from, mark: plain(next), note: `${plain(node)} is ${plain(next)}` };
}

/* ── Change every sign ──────────────────────────────────────────────────────
   Multiplying both sides by −1, which is what you actually want at −x = −3.
   Every term keeps its own id: the signs are the only thing that appears and
   disappears, so the writing sits still while the minuses flicker on and off. */

export function flipSigns(eq) {
  if (!A.isEquation(eq)) return { error: TWO_SIDED };
  const flip = (side) =>
    A.sideFromTerms(
      A.termsOf(side).map((t) => (t.kind === "neg" && !t.paren ? t.k : A.neg(t))),
      side
    );
  return { eq: A.eqn(flip(eq.l), flip(eq.r), eq.id), from: new Map(), note: "Change every sign" };
}

/* ── Open the brackets ──────────────────────────────────────────────────────
   3(x + 1) becomes 3x + 3. Only a NUMBER may be multiplied in, which keeps
   this to the case a student meets and away from the ones where distributing
   is where the wrong answers live.

   The result is spliced into the side rather than nested inside it, or the
   line would read 3x + 3 + 2 while the tree still thought the first two were
   one lump and no further move could touch them separately. */

export function expand(eq, id) {
  const loc = locate(eq, id);
  if (!loc) return { error: "That is not one of the terms." };

  // −3(x + 1) is the same job with the sign folded into the multiplier.
  const flipped = loc.term.kind === "neg" && !loc.term.paren;
  const body = flipped ? loc.term.k : loc.term;

  /* A bracket with nothing in front of it still has something to open. −(3 − x)
     is a minus times a bracket, and it is most of what "simplify this" asks for
     in the year brackets first appear; (x + 1) + 2 is the same move with nothing
     to multiply by, and taking the brackets off is a line a student writes down.
     Both are this rule with a factor of ∓1. */
  let inner;
  let others;
  if (body.kind === "sum") {
    inner = A.termsOf(body);
    others = [];
    // A bare sum that was never bracketed is already written out.
    if (!flipped && !body.paren) return { error: "There are no brackets to open there." };
  } else if (body.kind === "prod") {
    const at = body.kids.findIndex((k) => k.kind === "sum");
    if (at < 0) return { error: "There are no brackets to open there." };
    others = body.kids.filter((_, i) => i !== at);
    if (!others.length || !others.every(A.isNumeric)) {
      return { error: "I only multiply a number into a bracket." };
    }
    inner = A.termsOf(body.kids[at]);
  } else {
    return { error: "There are no brackets to open there." };
  }

  let factor = flipped ? R.neg(R.ONE) : R.ONE;
  for (const k of others) {
    const v = A.exactValue(k);
    if (!v) return { error: "I cannot work out what is multiplying the bracket." };
    factor = R.mul(factor, v);
  }

  const grown = inner.map((t) => {
    const read = A.readTerm(t);
    // A term we can read gets its number changed; one we cannot keeps its
    // shape and simply gains a multiplier out in front.
    return read
      ? A.termFrom(R.mul(read.c, factor), read.vars.length ? A.varNodesOf(t) : [])
      : A.prod([A.numberNode(factor), t]);
  });

  const nextTerms = [...loc.terms.slice(0, loc.index), ...grown, ...loc.terms.slice(loc.index + 1)];
  const eqNext = setContainer(eq, loc, nextTerms);

  // Each new term came out of the bracket, so they all fly from the old one.
  const from = new Map();
  for (const g of grown) if (g.id !== loc.term.id) from.set(g.id, [loc.term.id]);

  const opened = grown.map((g) => plain(g)).join(" + ").replace(/\+ −/g, "− ");
  return { eq: eqNext, from, mark: opened, note: `${plain(loc.term)} opens up to ${opened}` };
}

/* ── Split a fraction over its top ──────────────────────────────────────────
   (3x + 5)/4 is 3x/4 + 5/4. It is the move that lets anything written on top
   of a bar be reached at all: until the fraction is split, the 5 in the
   numerator cannot cross the equals sign on its own; afterwards 5/4 can.

   The bottom is written again under every piece, and each copy is a FRESH
   node — one node object standing in two places would give the tree one id
   in two spots (see ast.js). A minus on top comes out in front of its piece,
   so (3x − 5)/4 reads 3x/4 − 5/4 rather than 3x/4 + (−5)/4. */

const freshCopy = (n) => {
  switch (n.kind) {
    case "num":  return A.num(n.v, n.text);
    case "var":  return A.vr(n.name);
    case "neg":  return A.neg(freshCopy(n.k));
    case "sum":  return A.sum(n.kids.map(freshCopy));
    case "prod": return A.prod(n.kids.map(freshCopy));
    case "frac": return A.frac(freshCopy(n.a), freshCopy(n.b));
    case "pow":  return A.pow(freshCopy(n.b), freshCopy(n.e));
    case "root": return A.root(freshCopy(n.k));
    default:     return n;
  }
};

export function splitFraction(eq, id) {
  const loc = locate(eq, id);
  if (!loc) return { error: "That is not one of the terms." };
  const flipped = loc.term.kind === "neg" && !loc.term.paren;
  const fr = flipped ? loc.term.k : loc.term;
  if (fr.kind !== "frac") return { error: "That is not a fraction." };
  const tops = A.termsOf(fr.a);
  if (tops.length < 2) return { error: "There is only one thing on top, so there is nothing to split." };

  const pieces = tops.map((t, i) => {
    const den = i === 0 ? fr.b : freshCopy(fr.b);
    const isNeg = t.kind === "neg" && !t.paren;
    let piece = isNeg ? A.neg(A.frac(t.k, den)) : A.frac(t, den);
    if (flipped) piece = piece.kind === "neg" ? piece.k : A.neg(piece);
    return piece;
  });

  const nextTerms = [...loc.terms.slice(0, loc.index), ...pieces, ...loc.terms.slice(loc.index + 1)];
  const eqNext = setContainer(eq, loc, nextTerms);

  // Every piece of new writing comes out of the old fraction.
  const from = new Map();
  for (const p of pieces) A.walk(p, (n) => { if (!A.findById(eq, n.id)) from.set(n.id, [fr.id]); });

  const opened = pieces.map((p) => plain(p)).join(" + ").replace(/\+ −/g, "− ");
  return { eq: eqNext, from, mark: opened, note: `${plain(loc.term)} splits into ${opened}` };
}

/* ── The laws of indices ────────────────────────────────────────────────────
   Same base: add the powers when multiplying, take them away when dividing,
   multiply them for a power of a power. A power of 0 is 1, a power of 1 is the
   thing itself, a negative power is one over the positive one, and a power of
   a product or a fraction goes onto every piece of it.

   A factor counts as a power of its base when it can be read as one: x is x¹,
   x³ is itself, 2⁵ is base 2. Plain numbers are only gathered when one of them
   is written as a power already — 2 × 2³ is 2⁴, but 2 × 3 is just arithmetic,
   and "work it out" is the move for that. Every exponent here is exact; a
   power we cannot read exactly is left alone, never guessed at. */

const baseKey = (b) => (b.kind === "var" ? `v:${b.name}` : b.kind === "num" ? `n:${R.toText(b.v)}` : null);

function asPower(f) {
  if (f.kind === "pow") {
    const e = A.exactValue(f.e);
    const key = baseKey(f.b);
    return e && key ? { key, base: f.b, e, isPow: true } : null;
  }
  const key = baseKey(f);
  return key ? { key, base: f, e: R.ONE, isPow: false } : null;
}

const powerOf = (base, e) => (R.isZero(e) ? A.num(R.ONE) : R.isOne(e) ? base : A.pow(base, A.numberNode(e)));
const gatherable = (members) => members[0].p.key.startsWith("v:") || members.some((m) => m.p.isPow);
const packFactors = (fs) => (fs.length === 0 ? A.num(R.ONE) : fs.length === 1 ? fs[0] : A.prod(fs));

function productLaw(node) {
  const groups = new Map();
  node.kids.forEach((f, i) => {
    const p = asPower(f);
    if (!p) return;
    if (!groups.has(p.key)) groups.set(p.key, []);
    groups.get(p.key).push({ i, p });
  });
  const merged = new Map();
  const drop = new Set();
  for (const ms of groups.values()) {
    if (ms.length < 2 || !gatherable(ms)) continue;
    const total = ms.reduce((s, m) => R.add(s, m.p.e), R.ZERO);
    merged.set(ms[0].i, powerOf(ms[0].p.base, total));
    for (const m of ms.slice(1)) drop.add(m.i);
  }
  if (!merged.size) return null;
  const kids = [];
  node.kids.forEach((f, i) => {
    if (drop.has(i)) return;
    const r = merged.has(i) ? merged.get(i) : f;
    if (merged.has(i) && r.kind === "num" && R.isOne(r.v)) return;   // x⁰ goes
    kids.push(r);
  });
  return packFactors(kids);
}

function quotientLaw(node) {
  const top = node.a.kind === "prod" && !node.a.paren ? [...node.a.kids] : [node.a];
  const bot = node.b.kind === "prod" && !node.b.paren ? [...node.b.kids] : [node.b];
  let changed = false;
  for (let i = 0; i < top.length; i++) {
    const p = top[i] && asPower(top[i]);
    if (!p) continue;
    const j = bot.findIndex((f) => f && asPower(f)?.key === p.key);
    if (j < 0) continue;
    const q = asPower(bot[j]);
    if (!gatherable([{ p }, { p: q }])) continue;
    const d = R.sub(p.e, q.e);
    changed = true;
    if (R.isNegative(d)) { top[i] = null; bot[j] = powerOf(q.base, R.neg(d)); }
    else { top[i] = R.isZero(d) ? null : powerOf(p.base, d); bot[j] = null; }
  }
  if (!changed) return null;
  const a = packFactors(top.filter(Boolean));
  const b = packFactors(bot.filter(Boolean));
  return b.kind === "num" && R.isOne(b.v) ? a : A.frac(a, b);
}

function powerLaw(node) {
  const e = A.exactValue(node.e);
  if (!e) return null;
  const b = node.b;
  if (R.isZero(e)) return { next: A.num(R.ONE), why: "Anything to the power 0 is 1" };
  if (R.isOne(e)) return { next: b, why: "To the power 1 is the thing itself" };
  if (b.kind === "pow") {
    const m = A.exactValue(b.e);
    if (m) return { next: powerOf(b.b, R.mul(m, e)), why: "A power of a power: multiply the powers" };
  }
  if (R.isNegative(e)) {
    return { next: A.frac(A.num(R.ONE), powerOf(b, R.neg(e))), why: "A negative power is one over the positive power" };
  }
  if (b.kind === "root" && R.same(e, R.rat(2n))) return { next: b.k, why: "A square root squared is what was under it" };
  if (R.isInt(e) && b.kind === "prod") {
    return { next: A.prod(b.kids.map((k) => A.pow(k, A.numberNode(e)))), why: "A power of a product: every factor takes the power" };
  }
  if (R.isInt(e) && b.kind === "frac") {
    return { next: A.frac(A.pow(b.a, A.numberNode(e)), A.pow(b.b, A.numberNode(e))), why: "A power of a fraction: top and bottom both take it" };
  }
  return null;
}

/** Everything new in `next` came out of the node it replaced. */
const flyFrom = (eq, next, id) => {
  const from = new Map();
  A.walk(next, (n) => { if (!A.findById(eq, n.id)) from.set(n.id, [id]); });
  return from;
};

export function indexLaw(eq, id) {
  const node = A.findById(eq, id);
  if (!node) return { error: "I have lost track of that." };
  let next = null;
  let why = "";
  if (node.kind === "pow") ({ next = null, why = "" } = powerLaw(node) || {});
  else if (node.kind === "prod") { next = productLaw(node); why = "Same base: add the powers"; }
  else if (node.kind === "frac") { next = quotientLaw(node); why = "Same base: take the powers away"; }
  if (!next) return { error: "No law of indices applies there." };
  return { eq: A.replace(eq, id, next), from: flyFrom(eq, next, id), mark: plain(next), note: `${why}: ${plain(node)} is ${plain(next)}` };
}

/* ── Surds ──────────────────────────────────────────────────────────────────
   Take the square factor out (√12 = 2√3), multiply and divide roots (√a × √b
   = √(ab)), and clear a root off the bottom of a fraction. Like surds already
   fold the way like terms do — 2√3 + 5√3 is 7√3 — because readTerm counts a
   surd as part of a term's "letter" part. Only a number under a root is ever
   simplified: √(x²) is |x|, not x, and the verifier would rightly refuse x. */

export function simplifySurd(eq, id) {
  const node = A.findById(eq, id);
  if (!node || node.kind !== "root") return { error: "That is not a square root." };
  const v = A.exactValue(node.k);
  if (!v || R.isNegative(v)) return { error: "I only simplify the square root of a number." };
  // √(p/q) is √(pq)/q, so a fraction under the root comes out rationalised.
  const { out, inside } = R.squareSplit(v.n * v.d);
  // Judged on the number, not the writing — (√3) typed in brackets is √3 already.
  if (out === 1n && v.d === 1n && inside !== 1n) return { error: "That surd is as simple as it goes." };
  const core = inside === 1n ? A.num(R.rat(out))
    : out === 1n ? A.root(A.num(R.rat(inside)))
    : A.prod([A.num(R.rat(out)), A.root(A.num(R.rat(inside)))]);
  const next = v.d === 1n ? core : A.frac(core, A.num(R.rat(v.d)));
  if (plain(next) === plain(node)) return { error: "That surd is as simple as it goes." };
  return { eq: A.replace(eq, id, next), from: flyFrom(eq, next, id), mark: plain(next), note: `${plain(node)} is ${plain(next)}` };
}

export function multiplySurds(eq, id) {
  const node = A.findById(eq, id);
  if (!node || node.kind !== "prod") return { error: "That is not a product." };
  const at = node.kids.flatMap((k, i) => (k.kind === "root" ? [i] : []));
  if (at.length < 2) return { error: "There are not two roots there to multiply." };
  const radicands = at.map((i) => node.kids[i].k);
  const values = radicands.map((k) => A.exactValue(k));
  const under = values.every(Boolean) ? A.numberNode(values.reduce((s, v) => R.mul(s, v), R.ONE)) : A.prod(radicands);
  const merged = A.root(under);
  const kids = node.kids.flatMap((k, i) => (i === at[0] ? [merged] : at.includes(i) ? [] : [k]));
  const next = packFactors(kids);
  return { eq: A.replace(eq, id, next), from: flyFrom(eq, next, id), mark: plain(next), note: `Roots multiply under one root: ${plain(node)} is ${plain(next)}` };
}

export function divideSurds(eq, id) {
  const node = A.findById(eq, id);
  if (!node || node.kind !== "frac" || node.a.kind !== "root" || node.b.kind !== "root") {
    return { error: "That is not one root over another." };
  }
  const a = A.exactValue(node.a.k), b = A.exactValue(node.b.k);
  const under = a && b && !R.isZero(b) ? A.numberNode(R.div(a, b)) : A.frac(node.a.k, node.b.k);
  const next = A.root(under);
  return { eq: A.replace(eq, id, next), from: flyFrom(eq, next, id), mark: plain(next), note: `Roots divide under one root: ${plain(node)} is ${plain(next)}` };
}

export function rationalise(eq, id) {
  const node = A.findById(eq, id);
  if (!node || node.kind !== "frac") return { error: "That is not a fraction." };
  const den = node.b;
  let r = null;
  let rest = [];
  if (den.kind === "root") r = den;
  else if (den.kind === "prod") {
    const roots = den.kids.filter((k) => k.kind === "root");
    if (roots.length === 1 && den.kids.every((k) => k.kind === "root" || A.isNumeric(k))) {
      r = roots[0];
      rest = den.kids.filter((k) => k !== r);
    }
  }
  if (!r) return { error: "There is no root on the bottom to clear." };
  // Times top and bottom by the root: the bottom's root squares away.
  const extra = A.root(freshCopy(r.k));
  const top = node.a.kind === "num" && R.isOne(node.a.v) ? extra : A.prod([node.a, extra]);
  const bottomTree = rest.length ? A.prod([...rest, r.k]) : r.k;
  const bv = A.exactValue(bottomTree);
  const next = A.frac(top, bv ? A.numberNode(bv) : bottomTree);
  return {
    eq: A.replace(eq, id, next), from: flyFrom(eq, next, id), mark: plain(next),
    note: `Multiply top and bottom by ${plain(r)}: ${plain(node)} is ${plain(next)}`,
  };
}

/** The tidy-ups that act on one node in place — the laws of indices and the
    surd rules. Offered from the term (so the solver and "is this tidy?" see
    them) and from any glyph sitting inside the node they act on. */
function nodeTidies(eq, node) {
  const out = [];
  const t = (key, label, hint, trial) => {
    if (trial && !trial.error) out.push({ key, label, hint, mark: trial.mark, run: () => trial });
  };
  if (node.kind === "pow" || node.kind === "prod" || node.kind === "frac") {
    t("indices", "Use the laws of indices", "same base", indexLaw(eq, node.id));
  }
  if (node.kind === "root") t("surd", "Simplify the surd", "take out the square factor", simplifySurd(eq, node.id));
  if (node.kind === "prod") t("surd", "Multiply the roots", "√a × √b = √(ab)", multiplySurds(eq, node.id));
  if (node.kind === "frac") {
    t("surd", "Divide the roots", "√a ÷ √b = √(a/b)", divideSurds(eq, node.id));
    t("surd", "Clear the root off the bottom", "multiply top and bottom by it", rationalise(eq, node.id));
  }
  return out;
}

/* ── More than one at once ──────────────────────────────────────────────────
   Pick 3x AND 5, and they cross the equals sign together in one line of
   working; pick 2x, 3x and −x and they fold into one term. Each is just the
   one-term move done in turn, so the verifier checks the whole line exactly
   as it checks any other. */

const listOf = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export function takeManyAcross(eq, ids) {
  if (!A.isEquation(eq)) return { error: TWO_SIDED };
  let next = eq;
  const whats = [];
  const faces = [];
  const sides = new Set();
  for (const id of ids) {
    const loc = locate(next, id);
    if (!loc || !loc.topSide) return { error: "Only whole terms on a side can be carried over." };
    const r = takeAcross(next, id);
    if (r.error) return r;
    const adding = loc.term.kind === "neg" && !loc.term.paren;
    const what = plain(adding ? loc.term.k : loc.term);
    whats.push(what);
    faces.push({ op: adding ? "+" : "−", src: what });
    sides.add(loc.topSide);
    next = r.eq;
  }
  return {
    eq: next, from: new Map(), faces,
    mark: faces.map((f) => `${f.op}${f.src}`).join(" "),
    dir: sides.size === 1 ? (sides.has("l") ? "r" : "l") : "both",
    note: `Carry ${listOf(whats)} across`,
  };
}

export function combineMany(eq, ids) {
  const locs = ids.map((id) => locate(eq, id));
  if (locs.some((l) => !l) || new Set(locs.map((l) => l.container.id)).size !== 1) {
    return { error: "Those are not all on the same side." };
  }
  const reads = locs.map((l) => A.readTerm(l.term));
  if (reads.some((r) => !r) || new Set(reads.map((r) => r.sig)).size !== 1) return { error: "Those are not all like terms." };
  const order = locs.map((l, i) => ({ l, r: reads[i] })).sort((a, b) => a.l.index - b.l.index);
  const first = order[0];
  const total = order.reduce((s, o) => R.add(s, o.r.c), R.ZERO);
  const combined = A.termFrom(total, first.r.vars.length ? A.varNodesOf(first.l.term) : []);
  const drop = new Set(order.slice(1).map((o) => o.l.index));
  const nextTerms = first.l.terms.map((t, i) => (i === first.l.index ? combined : t)).filter((_, i) => !drop.has(i));
  const from = new Map([[combined.id, order.map((o) => o.l.term.id).filter((x) => x !== combined.id)]]);
  return {
    eq: setContainer(eq, first.l, nextTerms), from, mark: plain(combined),
    note: `${listOf(order.map((o) => plain(o.l.term)))} make ${plain(combined)}`,
  };
}

/* ── Turn it round ──────────────────────────────────────────────────────────
   5 = x is a finished answer, but it is not how anyone writes one down. Both
   sides keep their ids, so they slide past each other rather than blink. */

export function swapSides(eq) {
  if (!A.isEquation(eq)) return { error: TWO_SIDED };
  return { eq: A.eqn(eq.r, eq.l, eq.id), from: new Map(), note: "Turn it round" };
}

/* ── Drop a zero ────────────────────────────────────────────────────────────
   Adding nothing is still written down until someone says to stop writing it.
   Without this the leftovers of a cancelled term sit there forever, and the
   tool cheerfully offers to shuffle them across the equals sign. */

export function dropZero(eq, id) {
  const loc = locate(eq, id);
  if (!loc) return { error: "That is not one of the terms." };
  if (!isPlainZero(loc.term)) return { error: "That is not a zero." };
  if (loc.terms.length < 2) return { error: "That is the only thing on that side." };

  const rest = loc.terms.filter((_, i) => i !== loc.index);
  const eqNext = setContainer(eq, loc, rest);
  return { eq: eqNext, from: new Map(), note: "Adding nothing changes nothing" };
}

/* ── Work out a number ──────────────────────────────────────────────────────
   Collapses a variable-free subtree to its exact value. 8/2 becomes 4; 2·5
   becomes 10; 1/3 stays 1/3 forever. */

export function workOut(eq, id) {
  const node = A.findById(eq, id);
  if (!node) return { error: "I have lost track of that." };

  if (A.isNumeric(node)) {
    const value = A.exactValue(node);
    if (!value) return { error: "I cannot work that one out exactly." };

    const next = A.numberNode(value);
    if (plain(next) === plain(node)) return { error: "That is already as simple as it goes." };

    return {
      eq: A.replace(eq, id, next),
      from: new Map([[next.id, [node.id]]]),
      mark: plain(next),
      note: `${plain(node)} is ${plain(next)}`,
    };
  }

  /* A term with a letter in it can still have arithmetic buried in it that has
     not been done: (6 + 10)h is 16h, and until somebody does that sum there is
     no coefficient to divide by and the working stops. So collapse the BIGGEST
     letter-free parts inside the term — biggest first, because 2(3 + 4) is 14
     rather than a 3 + 4 that becomes 7 and waits another turn. */
  const targets = [];
  const scan = (n) => {
    if (n !== node && A.isNumeric(n) && A.kidsOf(n).length) { targets.push(n); return; }
    for (const k of A.kidsOf(n)) scan(k);
  };
  scan(node);

  const from = new Map();
  let next = eq;
  let did = 0;
  for (const t of targets) {
    const v = A.exactValue(t);
    if (!v) continue;
    const put = A.numberNode(v);
    if (plain(put) === plain(t)) continue;
    A.walk(put, (n) => from.set(n.id, [t.id]));
    next = A.replace(next, t.id, put);
    did++;
  }
  if (!did) return { error: "There is no sum in there waiting to be done." };

  const grown = A.findById(next, id);
  return { eq: next, from, mark: plain(grown), note: `${plain(node)} is ${plain(grown)}` };
}

/* ── Put the numbers in ─────────────────────────────────────────────────────
   Substitution: the step that turns a formula into arithmetic. Given u = 5 and
   a = 2 and t = 3, tapping the `at` of v = u + at writes 2·3 in its place.

   It is done a TERM at a time rather than all at once, because a term is what
   the student taps and because seeing 5 arrive where the u was is the whole
   picture — every number flies into the letter it replaced.

   This is the one move that does not preserve the equation in general, and it
   is not meant to: v = u + at and v = 5 + at are different equations for every
   u but the one we were given. The verifier is told which letters are pinned
   (see verify.js, `given`), so the check is still a real check — a substitution
   that put 6 where the 5 belonged would be caught exactly like a sign slip. */

/** The letters of a term that have been given a value, in writing order. */
function givenVarsIn(node, given) {
  const out = [];
  A.walk(node, (n) => { if (n.kind === "var" && given && given[n.name]) out.push(n); });
  return out;
}

export function substitute(eq, id, given = {}) {
  const loc = locate(eq, id);
  if (!loc) return { error: "That is not one of the terms." };

  const vars = givenVarsIn(loc.term, given);
  if (!vars.length) return { error: "There is no letter here that has been given a value." };

  const from = new Map();
  let next = eq;
  let grown = null;

  for (const v of vars) {
    const put = A.numberNode(given[v.name]);
    // A negative value arrives as a minus over a number, so every piece of the
    // new writing has to know which letter it came out of or half of it fades
    // in from nowhere instead of flying.
    A.walk(put, (n) => from.set(n.id, [v.id]));
    if (v.id === id) grown = put;
    next = A.replace(next, v.id, put);
  }

  grown = grown || A.findById(next, id);
  const said = vars.map((v) => `${v.name} = ${say(given[v.name])}`);
  return {
    eq: next,
    from,
    mark: plain(grown),
    note: said.length === 1 ? `Put ${said[0]} in` : `Put ${said.slice(0, -1).join(", ")} and ${said[said.length - 1]} in`,
  };
}

/** Rationals as plain numbers, which is all the verifier's sampler can use. */
export const asNumbers = (given) =>
  Object.fromEntries(Object.entries(given || {}).map(([k, v]) => [k, R.toNumber(v)]));

/** Is there still a number waiting to go into this line? */
export const hasSubstitutions = (eq, given) =>
  !!given && A.allTerms(eq).some((t) => givenVarsIn(t, given).length > 0);

/* ── What can I do with this? ───────────────────────────────────────────────
   The moves available on a term. Everything offered here is legal by
   construction and then checked by the verifier before it is applied, so there
   is no path from a tap to a wrong line.

   Every offer carries a MARK: two or three characters for the button, because
   a button that has to be read is a button that slows the working down. Two
   kinds, and between them they cover everything:

     what is being DONE to both sides     +5   −3x   ÷3   ×4   ×(−1)
     what the term BECOMES                20   x     3x + 3   2·3

   The sentence is still there as `label`, for what the tool says out loud when
   the move lands and for the API. It is just not what you have to read to make
   a move.

   solve.js turns this list into the ONE move worth offering — see bestOffers.
*/

/* ── Where do you want it? ──────────────────────────────────────────
   Tap a term, then tap where it should end up. Two of the moves are ABOUT a
   destination and nothing else — carrying a term over the equals sign, and
   folding it into a like term — and for those two, saying where is saying which.

   It is a second way in, not a replacement for the chip: naming the move is
   still what the tool is for, and this is the same naming done by pointing.
   Nothing is loosened — the move it works out goes through the verifier like
   everything else, so pointing somewhere silly gets you a refusal, not a
   wrong line.

   ONLY TWO DESTINATIONS COUNT, and the restriction is the whole design:

     the equals sign      carry it across
     a LIKE term beside it   fold the two together

   Everything else is still just a tap that picks something up. That matters
   because a second tap already meant something — changing your mind — and a
   gesture that quietly eats it would make the tool feel possessed. Tapping the
   5 and then the 20 has to go on meaning "actually, the 20". The two cases
   above cannot mean that: the equals sign was never something you could pick
   up, and folding a term into its like neighbour is the same move the chip on
   either of them already offers.

   `toId` is another term's id, or "=" for the equals sign itself. */

export const EQUALS = "=";

export function offerTo(eq, fromId, toId) {
  const from = locate(eq, fromId);
  if (!from || fromId === toId) return null;

  const cross = () => {
    const trial = takeAcross(eq, fromId);
    if (trial.error) return null;
    const adding = from.term.kind === "neg" && !from.term.paren;
    const what = plain(adding ? from.term.k : from.term);
    return {
      key: "across",
      label: adding ? `Add ${what} to both sides` : `Take ${what} from both sides`,
      hint: "the balance rule",
      mark: adding ? `+${what}` : `−${what}`,
      run: () => trial,
    };
  };

  if (toId === EQUALS) return A.isEquation(eq) ? cross() : null;

  const to = locate(eq, toId);
  // A term in a different container is a term you might simply have meant to
  // pick up instead. Crossing is what the equals sign is for.
  if (!to || to.container.id !== from.container.id) return null;

  const trial = combine(eq, fromId, toId);
  if (trial.error) return null;
  return {
    key: "combine",
    label: `Add it to ${plain(to.term)}`,
    hint: "like terms",
    mark: trial.mark,
    run: () => trial,
  };
}

export function offers(eq, id, { given = null } = {}) {
  const loc = locate(eq, id);
  if (!loc) return [];
  const { terms, index, term } = loc;
  const out = [];

  const read = A.readTerm(term);
  const adding = term.kind === "neg" && !term.paren;
  // The balance-rule moves — across, divide, times, flip, swap — only mean
  // anything on a TRUE side of an equation: there is nothing on the other
  // side of a numerator to balance against. Everything else here (combine,
  // expand, drop a zero, cancel, work it out) is just as much at home inside
  // a fraction as it is at the top of the line, which is the whole of what
  // makes every part of a term targetable rather than only the outermost
  // layer of it.
  const twoSided = A.isEquation(eq) && !!loc.topSide;
  // Which way a move across the = goes, for the arrow drawn over its chip.
  const dir = loc.topSide === "r" ? "l" : "r";

  // Numbers waiting to go in come first: there is no sense reshaping a formula
  // that is one tap away from being arithmetic.
  if (given) {
    const trial = substitute(eq, id, given);
    if (!trial.error) {
      out.push({ key: "substitute", label: trial.note, hint: "substitution", mark: trial.mark, run: () => trial });
    }
  }

  // A written zero can be swept up, but there is no sense in walking it across
  // the equals sign — that is a move that changes the writing and nothing else.
  if (isPlainZero(term)) {
    if (terms.length > 1) {
      out.push({ key: "dropzero", label: "Rub out the 0", hint: "adding nothing", mark: "⌫", run: () => dropZero(eq, id) });
    }
    return out;
  }

  if (twoSided) out.push({
    key: "across",
    label: adding ? `Add ${plain(term.k)} to both sides` : `Take ${plain(term)} from both sides`,
    hint: "the balance rule",
    // What gets written beside the line. Only the four moves that DO something
    // to both sides get one, because those are the four a person writing this
    // out by hand would annotate; the tidying steps speak for themselves and a
    // sentence beside every line only makes the card wide and the working hard
    // to read down.
    mark: adding ? `+${plain(term.k)}` : `−${plain(term)}`,
    dir,
    run: () => takeAcross(eq, id),
  });

  // The first like partner on this side, if there is one.
  if (read) {
    const partner = terms.find((t, i) => {
      if (i === index) return false;
      const r = A.readTerm(t);
      return r && r.sig === read.sig;
    });
    if (partner) {
      const trial = combine(eq, id, partner.id);
      if (!trial.error) {
        out.push({
          key: "combine",
          label: `Add it to ${plain(partner)}`,
          hint: "like terms",
          mark: trial.mark,
          run: () => trial,
        });
      }
    }
  }

  /* A fraction with a letter in it that is the whole of its side: clear it by
     multiplying. This is the only way out of (3x + 5)/4 = 5 — the top is a sum,
     so there is nothing to cancel down and nothing else touches the bottom.

     A numeric fraction is deliberately left alone. x = 5/2 is a finished
     answer, and offering to multiply it away turns two lines of working into
     seven for nothing. */
  let clearsByTimes = false;
  if (twoSided && term.kind === "frac" && terms.length === 1 && !A.isNumeric(term)) {
    const den = A.exactValue(term.b);
    if (den && !R.isZero(den) && !R.isOne(den)) {
      clearsByTimes = true;
      out.push({
        key: "times",
        label: `Multiply both sides by ${say(den)}`,
        hint: "undo the dividing",
        mark: `×${mul(den)}`,
        dir,
        run: () => timesBoth(eq, den),
      });
    }
  }

  /* The unknown IS the bottom of the fraction — see timesByTerm. Same "whole of
     its side" gate as above, for the same reason. */
  if (twoSided && term.kind === "frac" && terms.length === 1 && term.b.kind === "var") {
    const trial = timesByTerm(eq, term.b);
    if (!trial.error) {
      clearsByTimes = true;
      out.push({
        key: "times",
        label: `Multiply both sides by ${term.b.name}`,
        hint: "get it out from under the bar",
        mark: `×${term.b.name}`,
        dir,
        run: () => trial,
      });
    }
  }

  /* The last step of a linear equation: one term left, with a number in front.
     Divide by the SIGNED coefficient, the way it is taught — dividing −4x by 4
     and then tidying the sign afterwards is two steps where one will do.

     Never offered as "divide both sides by 1/3", though: that is x/3 = 4 read
     inside out, nobody writes it, and the offer just above is the move
     everybody does write. */
  if (twoSided && read && terms.length === 1 && read.vars.length > 0 && !R.isOne(R.abs(read.c))
      && !(clearsByTimes && !R.isInt(read.c))) {
    out.push({
      key: "divide",
      label: `Divide both sides by ${say(read.c)}`,
      hint: "undo the multiplying",
      mark: `÷${mul(read.c)}`,
      dir,
      run: () => divideBoth(eq, read.c),
    });
  }

  // −x = −3 wants its signs changed, not a division by −1.
  if (twoSided && read && terms.length === 1 && read.vars.length > 0 && R.isNegative(read.c) && R.isOne(R.abs(read.c))) {
    out.push({ key: "flip", label: "Change every sign", hint: "times both sides by −1", mark: "×(−1)", run: () => flipSigns(eq) });
  }

  // The fraction that dividing both sides left behind.
  if (term.kind === "frac" && read && read.vars.length > 0) {
    const trial = cancel(eq, id);
    if (!trial.error) out.push({ key: "cancel", label: "Cancel it down", hint: "same number top and bottom", mark: trial.mark, run: () => trial });
  }

  // A bracket with a number in front of it.
  {
    const trial = expand(eq, id);
    if (!trial.error) {
      out.push({ key: "expand", label: "Open the brackets", hint: "multiply it through", mark: trial.mark, run: () => trial });
    }
  }

  // The letters have ended up on the right and the answer is written backwards.
  if (twoSided && A.isNumeric(eq.l) && !A.isNumeric(eq.r)) {
    out.push({ key: "swap", label: "Turn it round", hint: "same equation, read the other way", mark: "⇄", run: () => swapSides(eq) });
  }

  // The laws of indices and the surd rules, anywhere inside the term.
  {
    const marks = new Set(out.map((o) => o.mark));
    A.walk(term, (n) => {
      for (const o of nodeTidies(eq, n)) if (!marks.has(o.mark)) { marks.add(o.mark); out.push(o); }
    });
  }

  // A sum waiting to be done, whether it is the whole term or buried in it.
  {
    const trial = workOut(eq, id);
    if (!trial.error) {
      out.push({
        key: "workout",
        label: A.isNumeric(term) ? `Work out ${plain(term)}` : "Work out the numbers in it",
        hint: "arithmetic",
        mark: trial.mark,
        run: () => trial,
      });
    }
  }

  return out;
}

/* ── Every glyph is a handle ────────────────────────────────────────────────
   In 3x + 5 = 4 the student can put a finger on the 3, the x, the +, the 5,
   the = or the 4, and each one offers what it MEANS. A key is the layout's own
   atom key (nodeId#slot), so the thing tapped is exactly the thing drawn — a
   multi-digit number is one atom, never broken up.

     a number or a letter     transfers: the term it belongs to crosses the
                              equals sign; a coefficient crosses as a division;
                              a number under a bar crosses as a multiplication
     a + or − between terms   simplify or transfer what it links: fold the two
                              terms it joins, or carry the one it introduces
     a fraction bar           cancel it down, work it out, or clear it
     a dot or a bracket       work it out, or open it up
     the = itself             the both-sides moves: turn it round, change every
                              sign, divide or multiply the lone term through

   Nothing new is decided here: every offer is one the term-level engine
   already makes, or one of its own functions run on the exact node tapped,
   and every one still goes through the verifier before it is drawn. */

const keyParts = (key) => {
  const i = key.indexOf("#");
  return { nodeId: key.slice(0, i), slot: key.slice(i + 1) };
};

const nodeSize = (n) => { let c = 0; A.walk(n, () => { c += 1; }); return c; };

/** Every term, in any container, whose subtree holds `nodeId` — innermost first. */
function termChain(eq, nodeId) {
  const seen = new Set();
  const out = [];
  for (const c of A.containersOf(eq)) {
    for (const t of A.termsOf(c)) {
      if (seen.has(t.id) || !A.findById(t, nodeId)) continue;
      seen.add(t.id);
      out.push(t);
    }
  }
  return out.sort((a, b) => nodeSize(a) - nodeSize(b));
}

export const isEqualsKey = (key) => !!key && keyParts(key).slot === "eq";

/** The term a glyph speaks for: its own innermost term, or — for a + between
    terms — the term that + introduces. The = speaks for no one term. */
export function atomTerm(eq, key) {
  if (!key) return null;
  const { nodeId, slot } = keyParts(key);
  if (slot === "eq") return null;
  if (slot.startsWith("op")) {
    const kid = A.findById(eq, nodeId)?.kids?.[Number(slot.slice(2))];
    return kid ? termChain(eq, kid.id)[0] || null : null;
  }
  return termChain(eq, nodeId)[0] || null;
}

/** Is `leaf` one of the factors its term is written as — the 3 of 3x or −3x? */
function isFactorOf(term, leaf) {
  const body = term.kind === "neg" && !term.paren ? term.k : term;
  return body.kind === "prod" && body.kids.includes(leaf);
}

export function atomOffers(eq, key, { given = null } = {}) {
  if (!key) return [];
  const { nodeId, slot } = keyParts(key);
  const out = [];
  const marks = new Set();

  const add = (o) => {
    if (!o) return;
    const tag = o.mark || o.label;
    if (marks.has(tag)) return;      // two routes to the same line are one choice
    marks.add(tag);
    out.push(o);
  };
  const pool = (term) => (term ? offers(eq, term.id, { given }) : []);
  const pick = (list, ...keys) => { for (const k of keys) for (const o of list) if (o.key === k) add(o); };
  const direct = (k, label, hint, trial) =>
    trial && !trial.error ? { key: k, label, hint, mark: trial.mark, run: () => trial } : null;
  const workOffer = (id) => {
    const n = A.findById(eq, id);
    if (!n) return null;
    return direct("workout", A.isNumeric(n) ? `Work out ${plain(n)}` : "Work out the numbers in it", "arithmetic", workOut(eq, id));
  };
  // The fraction a term is (or the fraction under its minus).
  const fracOf = (T) => (T.kind === "frac" ? T : T.kind === "neg" && !T.paren && T.k.kind === "frac" ? T.k : null);
  // Anything written on top of a bar can be reached by splitting the fraction.
  const splitOffer = (fracTerm) =>
    direct("split", "Split it over the bottom", "one fraction for each piece on top", splitFraction(eq, fracTerm.id));
  // The laws of indices and the surd rules for every node from this glyph up to
  // its term — the exponent of x³ in x²·x³ reaches the product it sits in.
  const tidiesAbove = (id) => {
    const T = termChain(eq, id)[0];
    let n = A.findById(eq, id);
    while (n) {
      for (const o of nodeTidies(eq, n)) add(o);
      if (!T || n.id === T.id) break;
      n = A.parentOf(eq, n.id);
    }
  };

  if (slot === "eq") {
    if (A.isEquation(eq)) {
      add({ key: "swap", label: "Turn it round", hint: "same equation, read the other way", mark: "⇄", run: () => swapSides(eq) });
      add({ key: "flip", label: "Change every sign", hint: "times both sides by −1", mark: "×(−1)", run: () => flipSigns(eq) });
      for (const side of ["l", "r"]) {
        const terms = A.termsOf(eq[side]);
        if (terms.length === 1) pick(pool(terms[0]), "divide", "times");
      }
    }
  } else if (slot.startsWith("op")) {
    const sum = A.findById(eq, nodeId);
    const i = Number(slot.slice(2));
    const kid = sum?.kids?.[i];
    const prev = sum?.kids?.[i - 1];
    const isContainer = !!sum && A.containersOf(eq).some((c) => c.id === sum.id);
    if (isContainer && kid && prev) {
      add(direct("combine", `${plain(prev)} and ${plain(kid)} together`, "like terms", combine(eq, prev.id, kid.id)));
    }
    pick(pool(atomTerm(eq, key)), "combine", "workout", "dropzero", "expand", "across");
    // A + on top of a bar: the fraction it sits in can be split at it.
    const parent = sum && A.parentOf(eq, sum.id);
    if (parent && parent.kind === "frac" && parent.a === sum) {
      const fracTerm = termChain(eq, parent.id)[0];
      if (fracTerm) add(splitOffer(fracTerm));
    }
  } else if (slot === "sign") {
    pick(pool(atomTerm(eq, key)), "across", "flip", "expand", "combine", "workout");
  } else if (slot === "bar") {
    const T = atomTerm(eq, key);
    add(direct("cancel", "Cancel it down", "same number top and bottom", cancel(eq, nodeId)));
    tidiesAbove(nodeId);
    add(workOffer(nodeId));
    if (T && fracOf(T)?.id === nodeId) add(splitOffer(T));
    if (T && T.id === nodeId) pick(pool(T), "times", "across");
  } else if (slot === "rad" || slot === "vinc") {
    // The √ itself, or the bar over what it roots.
    tidiesAbove(nodeId);
    add(workOffer(nodeId));
    pick(pool(atomTerm(eq, key)), "combine", "across");
  } else if (slot.startsWith("dot")) {
    tidiesAbove(nodeId);
    add(workOffer(nodeId));
    pick(pool(atomTerm(eq, key)), "expand");
  } else if (slot === "lp" || slot === "rp") {
    pick(pool(atomTerm(eq, key)), "expand");
    tidiesAbove(nodeId);
    add(workOffer(nodeId));
  } else {
    // A number or a letter.
    const chain = termChain(eq, nodeId);
    const T = chain[0];
    const leaf = A.findById(eq, nodeId);
    const p = pool(T);
    pick(p, "substitute");
    if (leaf && leaf.kind === "num" && T && isFactorOf(T, leaf)) {
      pick(p, "divide");
      /* Move ONLY the coefficient: the 3 of 3x crosses as ÷3 even when other
         terms share the side — both sides are divided by it, and the line says
         so honestly as (3x + 5)/3 = 20/3, ready to be split and cancelled. */
      const at = locate(eq, T.id);
      if (A.isEquation(eq) && at?.topSide && !R.isZero(leaf.v) && !R.isOne(leaf.v)) {
        const d = divideBoth(eq, leaf.v);
        if (!d.error) {
          add({
            key: "divide", label: `Divide both sides by ${say(leaf.v)}`, hint: "move just the number in front",
            mark: `÷${mul(leaf.v)}`, dir: at.topSide === "r" ? "l" : "r", run: () => d,
          });
        }
      }
    }
    for (const F of chain) {
      if (F.kind === "frac" && A.findById(F.b, nodeId)) pick(pool(F), "times");
      // Written on top of a bar: split the fraction so this piece is free.
      const f = fracOf(F);
      if (f && A.findById(f.a, nodeId)) add(splitOffer(F));
    }
    pick(p, "across", "combine", "dropzero");
    tidiesAbove(nodeId);
    // Arithmetic still waiting around it — an exponent, a bracketed sum.
    if (leaf && T) {
      let n = leaf;
      let numericAbove = null;
      while (n && n.id !== T.id) {
        const parent = A.parentOf(eq, n.id);
        if (!parent) break;
        if (A.isNumeric(parent) && A.kidsOf(parent).length) numericAbove = parent;
        n = parent;
      }
      if (numericAbove) add(workOffer(numericAbove.id));
    }
  }

  // A formula with a number still to go in has one move anywhere: putting it in.
  return hasSubstitutions(eq, given) ? out.filter((o) => o.key === "substitute") : out;
}

/** What a SELECTION of glyphs means together: the terms they belong to cross
    the = as one move, or fold into one term when they are like. One glyph
    picked is just atomOffers. */
export function multiOffers(eq, keys, { given = null } = {}) {
  const terms = [];
  for (const k of keys) {
    const t = atomTerm(eq, k);
    if (t && !terms.some((x) => x.id === t.id)) terms.push(t);
  }
  if (terms.length < 2) return atomOffers(eq, keys[keys.length - 1], { given });
  const ids = terms.map((t) => t.id);
  const out = [];
  const many = takeManyAcross(eq, ids);
  if (!many.error) {
    out.push({ key: "across", label: many.note, hint: "the balance rule", mark: many.mark, faces: many.faces, dir: many.dir, run: () => many });
  }
  const folded = combineMany(eq, ids);
  if (!folded.error) out.push({ key: "combine", label: folded.note, hint: "like terms", mark: folded.mark, run: () => folded });
  return hasSubstitutions(eq, given) ? [] : out;
}
