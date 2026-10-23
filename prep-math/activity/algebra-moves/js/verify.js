/* ═══════════════════════════════════════════════════════════════════════════
   THE VERIFIER

   This is the Tangram move, applied to algebra. There, generated figures are
   solver-verified rather than trusted; here, every rewrite is checked against
   the numbers before the student is allowed to see it.

   The check: an equation L = R is the same equation as L' = R' when L-R and
   L'-R' vanish in exactly the same places. For the rewrites in this spike the
   difference is either preserved or scaled by a non-zero constant, so we
   sample both differences at random points and insist the ratio between them
   is one consistent, non-zero number. A dropped term, a sign slip, or a
   half-applied distribution all break that ratio immediately.

   Floats are fine HERE and nowhere else: this is a check on a value, not a
   value. A rewrite that cannot be verified is refused, not shipped hopefully.
   ═══════════════════════════════════════════════════════════════════════════ */

import { varsIn, walk } from "./ast.js";

/** Float evaluation for sampling only. NaN means "this sample is unusable". */
function evalAt(node, env) {
  switch (node.kind) {
    case "num":  return Number(node.v.n) / Number(node.v.d);
    case "var":  return env[node.name];
    case "neg":  return -evalAt(node.k, env);
    case "sum":  return node.kids.reduce((a, k) => a + evalAt(k, env), 0);
    case "prod": return node.kids.reduce((a, k) => a * evalAt(k, env), 1);
    case "frac": {
      const b = evalAt(node.b, env);
      return Math.abs(b) < 1e-9 ? NaN : evalAt(node.a, env) / b;
    }
    case "pow":  return Math.pow(evalAt(node.b, env), evalAt(node.e, env));
    case "root": { const v = evalAt(node.k, env); return v < 0 ? NaN : Math.sqrt(v); }
    // The one ± choice of the line, set per branch by the caller.
    case "pm":   return env.__pm * evalAt(node.k, env);
    default:     return NaN;
  }
}

const hasPm = (root) => { let yes = false; walk(root, (n) => { if (n.kind === "pm") yes = true; }); return yes; };

/* An equation with a ± in it holds wherever EITHER branch holds, which is
   exactly where the product of the two branches' differences is zero. That is
   what lets A² = B become A = ±√B and still be checked: (A − √B)(A + √B) is
   A² − B. A line without a ± is just its one difference. */
const diffOf = (eq, env) => (hasPm(eq)
  ? diffAt(eq, { ...env, __pm: 1 }) * diffAt(eq, { ...env, __pm: -1 })
  : diffAt(eq, env));
const diffAt = (eq, env) => evalAt(eq.l, env) - evalAt(eq.r, env);

/** The value of a one-sided line. */
const value = (root, env) => evalAt(root.e, env);

/**
 * Does `next` say the same thing as `prev`?
 *
 * For an EQUATION that means the same solutions, checked as described above.
 * For an EXPRESSION it is a stricter question and a simpler one: two
 * expressions are the same when they have the same VALUE everywhere. The ratio
 * test would be actively wrong here — 2x and 4x differ by a consistent factor
 * of two, which is a fine thing to do to both sides of an equation and a
 * disaster to do to an expression that was only meant to be tidied.
 *
 * `given` fixes the letters a formula was handed values for. Putting 5 in for u
 * does not preserve the solutions of v = u + at in general; it preserves them
 * for the question actually being asked, which is the one where u IS 5. So the
 * samples hold those letters at their given values and vary the rest.
 *
 * Returns { ok, why } — `why` is written for the student, not the console.
 */
export function preservesSolutions(prev, next, { samples = 64, given = null, scaledBy = null } = {}) {
  const names = [...new Set([...varsIn(prev), ...varsIn(next), ...(scaledBy ? varsIn(scaledBy) : [])])].sort();
  const fixed = given || {};
  /* Every letter gets its OWN run of values. Giving them all the same value at
     each sample (as this once did) cannot tell a from b — a step that swapped
     them would pass — and it makes b² − 4ac come out −3s² every time, so every
     line after a square root would be impossible to check. */
  const slot = new Map(names.map((n, k) => [n, k]));
  const sample = (i, n) => {
    if (n in fixed) return fixed[n];
    const k = slot.get(n) ?? 0;
    return (((i * (3 + 2 * k) + 5 * k) % 13) / 2) - 3 + (((i * 0.37 + k * 0.61) % 1) * 0.9) + (i === 0 ? 0.5 : 0);
  };
  const branches = hasPm(prev) || hasPm(next) ? [1, -1] : [1];

  if (prev.kind === "expr" || next.kind === "expr") {
    if (prev.kind !== next.kind) return { ok: false, why: "that turns it into a different kind of thing" };
    let usable = 0;
    for (let i = 0; i < samples; i++) {
      const env = {};
      for (const n of names) env[n] = sample(i, n);
      for (const s of branches) {
        const a = value(prev, { ...env, __pm: s });
        const b = value(next, { ...env, __pm: s });
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        usable++;
        if (Math.abs(a - b) > 1e-7 * Math.max(1, Math.abs(a), Math.abs(b))) {
          return { ok: false, why: "that does not come to the same thing" };
        }
      }
    }
    if (usable < 6) return { ok: false, why: "I could not check that move, so I will not make it" };
    return { ok: true, why: "" };
  }

  /* A move that says what it multiplied both sides by gets checked against that
     claim rather than against a free constant: every sample must satisfy
     next = prev × k. That is the stricter test, and it is the only way to allow
     multiplying by a LETTER — which has no constant ratio at all, and which is
     the one move that gets an unknown out from under a fraction bar. */
  if (scaledBy) {
    let usable = 0;
    // Both sides with a ± are a product of two branches, each scaled by k.
    const power = hasPm(prev) && hasPm(next) ? 2 : 1;
    for (let i = 0; i < samples; i++) {
      const env = {};
      for (const n of names) env[n] = sample(i, n);
      const k = evalAt(scaledBy, env) ** power;
      const a = diffOf(prev, env);
      const b = diffOf(next, env);
      if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(k)) continue;
      if (Math.abs(k) < 1e-6) continue;
      usable++;
      if (Math.abs(b - a * k) > 1e-7 * Math.max(1, Math.abs(b), Math.abs(a * k))) {
        return { ok: false, why: "the two sides no longer match up the way they did" };
      }
    }
    if (usable < 6) return { ok: false, why: "I could not check that move, so I will not make it" };
    return { ok: true, why: "" };
  }

  let ratio = null;
  let usable = 0;

  for (let i = 0; i < samples; i++) {
    const env = {};
    // Spread the samples over awkward values too, not just tidy small ones.
    for (const n of names) env[n] = sample(i, n);

    const a = diffOf(prev, env);
    const b = diffOf(next, env);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;

    const scale = Math.max(1, Math.abs(a), Math.abs(b));
    const aZero = Math.abs(a) < 1e-7 * scale;
    const bZero = Math.abs(b) < 1e-7 * scale;

    if (aZero && bZero) continue;            // a shared root tells us nothing
    if (aZero !== bZero) return { ok: false, why: "that changes which numbers make the equation true" };

    usable++;
    const r = b / a;
    if (ratio === null) ratio = r;
    else if (Math.abs(r - ratio) > 1e-6 * Math.max(1, Math.abs(ratio))) {
      return { ok: false, why: "the two sides no longer match up the way they did" };
    }
  }

  if (usable < 6) return { ok: false, why: "I could not check that move, so I will not make it" };
  if (ratio === null || Math.abs(ratio) < 1e-9) return { ok: false, why: "that would flatten the equation" };
  return { ok: true, why: "" };
}
