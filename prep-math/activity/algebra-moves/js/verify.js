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

import { varsIn, walk, baseValue } from "./ast.js";
const baseValueOf = (n) => baseValue(n.digits, n.base);

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
    case "mixed": return evalAt(node.w, env) + evalAt(node.f, env);
    case "pct":  return evalAt(node.k, env) / 100;
    case "base": { const v = baseValueOf(node); return v === null ? NaN : Number(v); }
    case "const": return node.name === "e" ? Math.E : Math.PI;
    case "deg":  return evalAt(node.k, env) * Math.PI / 180;
    case "fn": {
      const v = evalAt(node.k, env);
      switch (node.name) {
        case "sin": return Math.sin(v);
        case "cos": return Math.cos(v);
        // Near an asymptote tan is too steep to compare samples on.
        case "tan": return Math.abs(Math.cos(v)) < 1e-3 ? NaN : Math.tan(v);
        case "ln":  return v > 0 ? Math.log(v) : NaN;
        case "log": return v > 0 ? Math.log10(v) : NaN;
        case "arcsin": return Math.abs(v) <= 1 ? Math.asin(v) : NaN;
        case "arccos": return Math.abs(v) <= 1 ? Math.acos(v) : NaN;
        case "arctan": return Math.atan(v);
        default:    return NaN;
      }
    }
    /* The calculus is checked the way it is defined, by numbers: a derivative
       as a central difference, an integral by Simpson's rule, a limit from both
       sides of where it is going. */
    case "deriv": {
      const x = env[node.x];
      if (!Number.isFinite(x)) return NaN;
      const h = 1e-4 * Math.max(1, Math.abs(x));
      return (evalAt(node.k, { ...env, [node.x]: x + h }) - evalAt(node.k, { ...env, [node.x]: x - h })) / (2 * h);
    }
    case "int": {
      // An indefinite integral is taken from a fixed starting point, so it is
      // ONE of the antiderivatives; the moves that drop the ∫ are checked up to
      // a constant (see `upToConstant` below).
      let a = node.lo ? evalAt(node.lo, env) : INT_FROM;
      let b = node.lo ? evalAt(node.hi, env) : env[node.x];
      // Integrated in u after u = g(x): from g(start) to g(x), which is the
      // same number the ∫ in x gave before the substitution.
      if (node.back) { a = evalAt(node.back.g, { ...env, [node.back.x]: INT_FROM }); b = evalAt(node.back.g, env); }
      return simpson((t) => evalAt(node.k, { ...env, [node.x]: t }), a, b);
    }
    case "lim": {
      const to = evalAt(node.to, env);
      const d = 1e-5 * Math.max(1, Math.abs(to));
      const up = evalAt(node.k, { ...env, [node.x]: to + d });
      const dn = evalAt(node.k, { ...env, [node.x]: to - d });
      return (up + dn) / 2;
    }
    default:     return NaN;
  }
}

const INT_FROM = 0.5;

/** The letters an integral in u is still really about: the x of its u = g(x). */
const backVars = (root) => { const out = []; walk(root, (n) => { if (n.kind === "int" && n.back) out.push(...varsIn(n.back.g)); }); return out; };
function simpson(f, a, b, n = 256) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

const CALCULUS = new Set(["deriv", "int", "lim", "fn"]);
const hasCalculus = (root) => { let yes = false; walk(root, (n) => { if (CALCULUS.has(n.kind)) yes = true; }); return yes; };

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
export function preservesSolutions(prev, next, { samples = 64, given = null, scaledBy = null, upToConstant = null, inverse = null, defs = null } = {}) {
  const names = [...new Set([...varsIn(prev), ...varsIn(next), ...backVars(prev), ...backVars(next), ...(scaledBy ? varsIn(scaledBy) : []),
                             ...(upToConstant ? [upToConstant] : [])])].sort();
  // Numbers worked out by a difference or a sum of slices carry their own small
  // error, so a line with any calculus in it is compared a little more loosely.
  const tol = hasCalculus(prev) || hasCalculus(next) ? 1e-5 : 1e-7;
  const fixed = given || {};
  /* Every letter gets its OWN run of values. Giving them all the same value at
     each sample (as this once did) cannot tell a from b — a step that swapped
     them would pass — and it makes b² − 4ac come out −3s² every time, so every
     line after a square root would be impossible to check. */
  const slot = new Map(names.map((n, k) => [n, k]));
  /* `defs` says a letter IS an expression — y = 2x + 1 from another equation.
     That letter is never sampled: it is worked out from the others, so putting
     2x + 1 where the y was is checked like any other substitution. */
  const defined = defs || {};
  const sample = (i, n) => {
    if (n in fixed) return fixed[n];
    const k = slot.get(n) ?? 0;
    return (((i * (3 + 2 * k) + 5 * k) % 13) / 2) - 3 + (((i * 0.37 + k * 0.61) % 1) * 0.9) + (i === 0 ? 0.5 : 0);
  };
  const branches = hasPm(prev) || hasPm(next) ? [1, -1] : [1];

  /* sin u = k becomes u = sin⁻¹ k: true for the ONE angle sin⁻¹ gives, not for
     every angle with that sine, so no sampling of solutions could pass it. It is
     checked as what it is — sin⁻¹ applied to both sides — at the samples where
     u lies in sin⁻¹'s own range, where that really does undo the sin. */
  if (inverse) {
    const f = { arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan }[inverse.fn];
    const inRange = (u) => (inverse.fn === "arccos" ? u >= 0 && u <= Math.PI : Math.abs(u) <= Math.PI / 2);
    let usable = 0;
    for (let i = 0; i < samples; i++) {
      const env = {};
      for (const n of names) env[n] = sample(i, n);
      for (const [n, d] of Object.entries(defined)) env[n] = evalAt(d, env);
      const u = evalAt(next[inverse.side], env);
      if (!Number.isFinite(u) || !inRange(u)) continue;
      const a = f(evalAt(prev.l, env)) - f(evalAt(prev.r, env));
      const b = diffAt(next, env);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      usable++;
      if (Math.abs(a - b) > tol * Math.max(1, Math.abs(a), Math.abs(b))) {
        return { ok: false, why: "that is not the same function undone on both sides" };
      }
    }
    if (usable < 6) return { ok: false, why: "I could not check that move, so I will not make it" };
    return { ok: true, why: "" };
  }

  /* Integrating is only ever right "plus a constant", so a move that takes an
     ∫ away is checked by what defines it: the slope, in the integral's letter,
     of what is written must be the same before and after. */
  if (upToConstant) {
    const slope = (root, env) => {
      const f = (t) => (root.kind === "expr" ? value(root, { ...env, [upToConstant]: t }) : diffAt(root, { ...env, [upToConstant]: t }));
      const x = env[upToConstant], h = 1e-3 * Math.max(1, Math.abs(x));
      return (f(x + h) - f(x - h)) / (2 * h);
    };
    let usable = 0;
    for (let i = 0; i < samples; i++) {
      const env = {};
      for (const n of names) env[n] = sample(i, n);
      for (const [n, d] of Object.entries(defined)) env[n] = evalAt(d, env);
      const a = slope(prev, env), b = slope(next, env);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      usable++;
      if (Math.abs(a - b) > 1e-4 * Math.max(1, Math.abs(a), Math.abs(b))) {
        return { ok: false, why: "that is not what you get back when you differentiate" };
      }
    }
    if (usable < 6) return { ok: false, why: "I could not check that move, so I will not make it" };
    return { ok: true, why: "" };
  }

  if (prev.kind === "expr" || next.kind === "expr") {
    if (prev.kind !== next.kind) return { ok: false, why: "that turns it into a different kind of thing" };
    let usable = 0;
    for (let i = 0; i < samples; i++) {
      const env = {};
      for (const n of names) env[n] = sample(i, n);
      for (const [n, d] of Object.entries(defined)) env[n] = evalAt(d, env);
      for (const s of branches) {
        const a = value(prev, { ...env, __pm: s });
        const b = value(next, { ...env, __pm: s });
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        usable++;
        if (Math.abs(a - b) > tol * Math.max(1, Math.abs(a), Math.abs(b))) {
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
      for (const [n, d] of Object.entries(defined)) env[n] = evalAt(d, env);
      const k = evalAt(scaledBy, env) ** power;
      const a = diffOf(prev, env);
      const b = diffOf(next, env);
      if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(k)) continue;
      if (Math.abs(k) < 1e-6) continue;
      usable++;
      if (Math.abs(b - a * k) > tol * Math.max(1, Math.abs(b), Math.abs(a * k))) {
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
      for (const [n, d] of Object.entries(defined)) env[n] = evalAt(d, env);

    const a = diffOf(prev, env);
    const b = diffOf(next, env);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;

    const scale = Math.max(1, Math.abs(a), Math.abs(b));
    const aZero = Math.abs(a) < tol * scale;
    const bZero = Math.abs(b) < tol * scale;

    if (aZero && bZero) continue;            // a shared root tells us nothing
    if (aZero !== bZero) return { ok: false, why: "that changes which numbers make the equation true" };

    usable++;
    const r = b / a;
    if (ratio === null) ratio = r;
    else if (Math.abs(r - ratio) > tol * 10 * Math.max(1, Math.abs(ratio))) {
      return { ok: false, why: "the two sides no longer match up the way they did" };
    }
  }

  if (usable < 6) return { ok: false, why: "I could not check that move, so I will not make it" };
  if (ratio === null || Math.abs(ratio) < 1e-9) return { ok: false, why: "that would flatten the equation" };
  return { ok: true, why: "" };
}

/** The value of a letter-free node, or NaN — sin 30°, π/6, e². */
export const numericValue = (node) => evalAt(node, {});

/** A node valued with some letters given — what calculus.js samples with. */
export const valueAt = (node, env) => evalAt(node, env);
