/* ============================================================================
   A GRID OF NUMBERS WITH SOME OF THEM STRUCK OUT
   ----------------------------------------------------------------------------
   The oldest exercise in arithmetic: look along a row of numbers and cross out
   the ones that are not what you are hunting for — or, here, the ones that
   ARE. It is a sieve, and a child who does it by hand once knows what a prime
   is in a way no definition gives them.

   Struck, not ticked. A tick beside a number is a claim about it; a line
   through it is the number treated as finished, which is what the method does
   and what the child's pencil does on the paper. The screen draws the same
   line the pencil would.

   `strikeRight` is pure — it compares two sets of numbers — so the checks run
   it in Node. The grid is ONE mark: half a sieve is not half a sieve, it is a
   wrong sieve, and a child who struck six of the eight primes has not "nearly"
   found the primes.
   ========================================================================== */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The grid on the paper.
 *   numbers  what is in it, in order
 *   cols     how many across (the paper's own column decides how many fit)
 *   answer   true prints it already struck, for the one done for you
 *   struck   which numbers are struck when it is printed as the answer
 */
export function strikeHtml({ numbers, cols = 10, answer = false, struck = [], label = "" } = {}) {
  const hit = new Set(struck.map(Number));
  /* figures in a grid, not sums: the typesetter keeps out (mathify.js) */
  return `<div class="wb-sieve wb-nomath" data-strike="${esc(JSON.stringify({ cols }))}"`
    + `${label ? ` aria-label="${esc(label)}"` : ""} style="--sv-cols:${cols}">`
    + numbers.map((n) => `<span class="wb-sieve__n${answer && hit.has(Number(n)) ? " is-struck" : ""}" data-n="${n}">${n}</span>`).join("")
    + `</div>`;
}

/** Exactly these numbers struck out, and no others. */
export function strikeRight(state, entry) {
  const got = new Set((state || []).map(Number));
  const want = new Set((entry.numbers || []).map(Number));
  if (got.size !== want.size) return false;
  for (const v of want) if (!got.has(v)) return false;
  return true;
}

/**
 * mountStrike(el, { saved, onChange }) → { state(), set(s), clear(), dispose() }
 *
 * A tap strikes a number; a tap on a struck one puts it back, because a sieve
 * done in pencil is done with a rubber beside it.
 */
export function mountStrike(el, { saved = null, onChange = () => {} } = {}) {
  let state = Array.isArray(saved) ? saved.slice() : [];
  el.classList.add("is-live");

  const paint = () => {
    const hit = new Set(state.map(Number));
    el.querySelectorAll(".wb-sieve__n").forEach((cell) => {
      cell.classList.toggle("is-struck", hit.has(Number(cell.dataset.n)));
    });
  };

  el.querySelectorAll(".wb-sieve__n").forEach((cell) => {
    if (cell.__wbStrike) return;
    cell.__wbStrike = true;
    cell.addEventListener("click", () => {
      const n = Number(cell.dataset.n);
      state = state.includes(n) ? state.filter((x) => x !== n) : state.concat([n]);
      paint();
      onChange(state.slice());
    });
  });
  paint();

  return {
    state: () => state.slice(),
    set(s) { state = Array.isArray(s) ? s.slice() : []; paint(); },
    clear() { state = []; paint(); onChange([]); },
    dispose() { el.classList.remove("is-live"); },
  };
}
