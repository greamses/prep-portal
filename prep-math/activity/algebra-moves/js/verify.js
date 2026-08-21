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

import { varsIn } from "./ast.js";

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
    default:     return NaN;
  }
}

const diff = (eq, env) => evalAt(eq.l, env) - evalAt(eq.r, env);

/**
 * Does `next` have the same solutions as `prev`?
 * Returns { ok, why } — `why` is written for the student, not the console.
 */
export function preservesSolutions(prev, next, samples = 64) {
  const names = [...new Set([...varsIn(prev), ...varsIn(next)])];
  let ratio = null;
  let usable = 0;

  for (let i = 0; i < samples; i++) {
    const env = {};
    // Spread the samples over awkward values too, not just tidy small ones.
    for (const n of names) env[n] = (i % 7) - 3 + (i * 0.37) % 1.9 + (i === 0 ? 0.5 : 0);

    const a = diff(prev, env);
    const b = diff(next, env);
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
