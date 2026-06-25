/* ============================================================================
   Cartesian Art — range slider fill
   ----------------------------------------------------------------------------
   Sets a `--p` custom property (0–100%) on every range input so the CSS can
   paint a filled track up to the thumb (WebKit has no native progress element).
   Call paintRange() after changing a slider's value programmatically.
   ========================================================================== */

export function paintRange(el) {
  if (!el) return;
  const min = el.min !== "" ? +el.min : 0;
  const max = el.max !== "" ? +el.max : 100;
  const v = +el.value;
  const p = max > min ? ((v - min) / (max - min)) * 100 : 0;
  el.style.setProperty("--p", p.toFixed(1) + "%");
}

export function initRangeFills(scope = document) {
  scope.querySelectorAll('input[type="range"]').forEach((el) => {
    paintRange(el);
    el.addEventListener("input", () => paintRange(el));
  });
}
