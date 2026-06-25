/* ============================================================================
   Cartesian Art — scale helpers (pure, no imports)
   ----------------------------------------------------------------------------
   The "nice" gridline spacing and the matching cursor step. Shared by grid.js
   (drawing) and state.js (movement) so the mascot's stride adapts to the zoom:
   one press moves by one fine gridline cell — big strides when zoomed out to
   ±1000, tiny fractional strides when zoomed in past a single unit.
   ========================================================================== */

/** A "nice" gridline spacing (1, 2, 5 ×10ⁿ) aiming for ~target divisions. */
export function niceStep(span, target = 14) {
  const raw = span / target;
  const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = raw / pow;
  let step;
  if (n < 1.5) step = 1;
  else if (n < 3) step = 2;
  else if (n < 7) step = 5;
  else step = 10;
  return step * pow; // may be fractional for deep zoom (e.g. 0.001)
}

/** Sub-step for the fainter "inner" gridlines drawn between labelled lines. */
export function subStep(major) {
  if (major >= 2) {
    if (major % 5 === 0) return major / 5;
    if (major % 4 === 0) return major / 4;
    if (major % 2 === 0) return major / 2;
    return 0;
  }
  if (major < 1) { // deep zoom — subdivide the fractional major (0.5→0.1, 0.2→0.05…)
    const m = Math.round(major / Math.pow(10, Math.floor(Math.log10(major) + 1e-9)));
    if (m === 1 || m === 5) return major / 5;
    if (m === 2) return major / 4;
    return 0;
  }
  return 0; // major === 1: keep the integer grid clean
}

/** The cursor/snap increment for a given span — the finest visible cell. */
export function snapStep(span) {
  const major = niceStep(span);
  return subStep(major) || major;
}

/** Snap a value to the nearest multiple of `step`, cleaning float noise. */
export function snap(v, step) {
  const r = Math.round(v / step) * step;
  return step < 1 ? Number(r.toFixed(6)) : Math.round(r);
}

/** Short coordinate text (integers stay plain; fractions trimmed). */
export function fmtCoord(v) {
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4)));
}
