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

/** Where a node sits, if it is one of the top-level terms of a side. */
function locate(eq, id) {
  for (const side of A.SIDES(eq)) {
    const terms = A.termsOf(eq[side]);
    const index = terms.findIndex((t) => t.id === id);
    if (index >= 0) return { side, other: side === "l" ? "r" : "l", index, terms, term: terms[index] };
  }
  return null;
}

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
  if (!loc) return { error: "That is not one of the terms." };
  const { side, other, index, terms, term } = loc;

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
  if (!la || !lb || la.side !== lb.side) return { error: "Those two are not on the same side." };
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

  const eqNext = A.setSide(eq, first.side, A.sideFromTerms(nextTerms, eq[first.side]));

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
  const eqNext = A.setSide(eq, loc.side, A.sideFromTerms(nextTerms, eq[loc.side]));

  // Each new term came out of the bracket, so they all fly from the old one.
  const from = new Map();
  for (const g of grown) if (g.id !== loc.term.id) from.set(g.id, [loc.term.id]);

  const opened = grown.map((g) => plain(g)).join(" + ").replace(/\+ −/g, "− ");
  return { eq: eqNext, from, mark: opened, note: `${plain(loc.term)} opens up to ${opened}` };
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
  const eqNext = A.setSide(eq, loc.side, A.sideFromTerms(rest, eq[loc.side]));
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

export function offers(eq, id, { given = null } = {}) {
  const loc = locate(eq, id);
  if (!loc) return [];
  const { side, terms, index, term } = loc;
  const out = [];

  const read = A.readTerm(term);
  const adding = term.kind === "neg" && !term.paren;
  // An expression has one side, so nothing can be carried across it, divided
  // through it or turned round. What is left is exactly the tidying moves —
  // which is the whole of what simplifying an expression is.
  const twoSided = A.isEquation(eq);

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

  void side;
  return out;
}
