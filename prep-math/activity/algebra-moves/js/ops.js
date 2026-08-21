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
  for (const side of ["l", "r"]) {
    const terms = A.termsOf(eq[side]);
    const index = terms.findIndex((t) => t.id === id);
    if (index >= 0) return { side, other: side === "l" ? "r" : "l", index, terms, term: terms[index] };
  }
  return null;
}

const isPlainZero = (node) => node.kind === "num" && R.isZero(node.v);

/** Numbers written in prose use the same minus sign the equation does. */
const say = (r) => R.toText(r).replace(/-/g, "−");

/* ── Take a term from both sides ────────────────────────────────────────────
   The move everyone means when they say "move it across". We do not model it
   as movement: we subtract the term from both sides, it cancels on one and
   lands negated on the other. The picture happens to look like movement, which
   is the point — but the maths underneath is the balance rule. */

export function takeAcross(eq, id) {
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

  const eqNext = side === "l" ? A.eqn(nextSide, nextOther, eq.id) : A.eqn(nextOther, nextSide, eq.id);
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

  const nextSide = A.sideFromTerms(nextTerms, eq[first.side]);
  const eqNext =
    first.side === "l" ? A.eqn(nextSide, eq.r, eq.id) : A.eqn(eq.l, nextSide, eq.id);

  // Both old terms feed the new one, so both fly to it.
  const sources = [first.term.id, second.term.id].filter((x) => x !== combined.id);
  const from = new Map();
  if (sources.length) from.set(combined.id, sources);

  return {
    eq: eqNext,
    from,
    note: `${plain(first.term)} and ${plain(second.term)} make ${plain(combined)}`,
  };
}

/* ── Divide both sides ──────────────────────────────────────────────────────
   Only ever by a NUMBER. Dividing by an expression is where a tool like this
   quietly loses a root or divides by zero, and refusing it outright costs the
   student nothing at this level while making a whole class of wrong answers
   impossible. */

export function divideBoth(eq, value) {
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

  // Reuse the numerator's own variable nodes: the x never moves, the 3s go.
  const next = A.termFrom(R.div(top.c, den), top.vars.length ? A.varNodesOf(node.a) : []);
  if (plain(next) === plain(node)) return { error: "That will not cancel." };

  const from = next.id === node.id ? new Map() : new Map([[next.id, [node.id]]]);
  return { eq: A.replace(eq, id, next), from, note: `${plain(node)} is ${plain(next)}` };
}

/* ── Change every sign ──────────────────────────────────────────────────────
   Multiplying both sides by −1, which is what you actually want at −x = −3.
   Every term keeps its own id: the signs are the only thing that appears and
   disappears, so the writing sits still while the minuses flicker on and off. */

export function flipSigns(eq) {
  const flip = (side) =>
    A.sideFromTerms(
      A.termsOf(side).map((t) => (t.kind === "neg" && !t.paren ? t.k : A.neg(t))),
      side
    );
  return { eq: A.eqn(flip(eq.l), flip(eq.r), eq.id), from: new Map(), note: "Change every sign" };
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
  const nextSide = A.sideFromTerms(rest, eq[loc.side]);
  const eqNext = loc.side === "l" ? A.eqn(nextSide, eq.r, eq.id) : A.eqn(eq.l, nextSide, eq.id);
  return { eq: eqNext, from: new Map(), note: "Adding nothing changes nothing" };
}

/* ── Work out a number ──────────────────────────────────────────────────────
   Collapses a variable-free subtree to its exact value. 8/2 becomes 4; 2·5
   becomes 10; 1/3 stays 1/3 forever. */

export function workOut(eq, id) {
  const node = A.findById(eq, id);
  if (!node) return { error: "I have lost track of that." };
  if (!A.isNumeric(node)) return { error: "That still has a letter in it." };

  const value = A.exactValue(node);
  if (!value) return { error: "I cannot work that one out exactly." };

  const next = A.numberNode(value);
  if (plain(next) === plain(node)) return { error: "That is already as simple as it goes." };

  return {
    eq: A.replace(eq, id, next),
    from: new Map([[next.id, [node.id]]]),
    note: `${plain(node)} is ${plain(next)}`,
  };
}

/* ── What can I do with this? ───────────────────────────────────────────────
   The menu the student sees after tapping a term. Everything offered here is
   legal by construction and then checked by the verifier before it is applied,
   so there is no path from a tap to a wrong line. */

export function offers(eq, id) {
  const loc = locate(eq, id);
  if (!loc) return [];
  const { side, terms, index, term } = loc;
  const out = [];

  const read = A.readTerm(term);
  const adding = term.kind === "neg" && !term.paren;

  // A written zero can be swept up, but there is no sense in walking it across
  // the equals sign — that is a move that changes the writing and nothing else.
  if (isPlainZero(term)) {
    if (terms.length > 1) {
      out.push({ key: "dropzero", label: "Rub out the 0", hint: "adding nothing", run: () => dropZero(eq, id) });
    }
    return out;
  }

  out.push({
    key: "across",
    label: adding ? `Add ${plain(term.k)} to both sides` : `Take ${plain(term)} from both sides`,
    hint: "the balance rule",
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
      out.push({
        key: "combine",
        label: `Add it to ${plain(partner)}`,
        hint: "like terms",
        run: () => combine(eq, id, partner.id),
      });
    }
  }

  // The last step of a linear equation: one term left, with a number in front.
  // Divide by the SIGNED coefficient, the way it is taught — dividing −4x by 4
  // and then tidying the sign afterwards is two steps where one will do.
  if (read && terms.length === 1 && read.vars.length > 0 && !R.isOne(R.abs(read.c))) {
    out.push({
      key: "divide",
      label: `Divide both sides by ${say(read.c)}`,
      hint: "undo the multiplying",
      run: () => divideBoth(eq, read.c),
    });
  }

  // −x = −3 wants its signs changed, not a division by −1.
  if (read && terms.length === 1 && read.vars.length > 0 && R.isNegative(read.c) && R.isOne(R.abs(read.c))) {
    out.push({ key: "flip", label: "Change every sign", hint: "times both sides by −1", run: () => flipSigns(eq) });
  }

  // The fraction that dividing both sides left behind.
  if (term.kind === "frac" && read && read.vars.length > 0) {
    const trial = cancel(eq, id);
    if (!trial.error) out.push({ key: "cancel", label: "Cancel it down", hint: "same number top and bottom", run: () => trial });
  }

  // Anything numeric that is not already a single tidy number.
  if (A.isNumeric(term)) {
    const trial = workOut(eq, id);
    if (!trial.error) {
      out.push({ key: "workout", label: `Work out ${plain(term)}`, hint: "arithmetic", run: () => trial });
    }
  }

  void side;
  return out;
}
