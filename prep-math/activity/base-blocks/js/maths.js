/* ============================================================================
   Manipulatives — numbers set as mathematics
   ----------------------------------------------------------------------------
   Every number this page shows a learner is typeset by MathJax, the same way
   the rest of the site sets its mathematics: a total, a number written in
   another base, a place written as a power, and the expression a canvas of
   algebra tiles comes to. A page about place value that writes 10^2 as "10²"
   in one corner and "10 squared" in another is teaching two notations.

   THE PLAIN TEXT COMES FIRST AND STAYS IF MATHJAX NEVER ARRIVES. MathJax is a
   script on a CDN: on a slow phone it is seconds away and on a bad connection
   it never comes at all. So `math()` writes readable Unicode into the page and
   hangs the TeX off the element in a data attribute; `typesetIn()` swaps the
   two over once the library is up. Nobody is ever shown a raw \(…\).
   ========================================================================== */

const WAIT_MS = 10000; // stop hoping after this and leave the plain text alone

let ready = null;

/** Resolves when MathJax has started; rejects if it never turns up. */
function whenMathJax() {
  if (ready) return ready;
  ready = new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.MathJax?.startup?.promise) {
        window.MathJax.startup.promise.then(resolve, reject);
      } else if (Date.now() - started > WAIT_MS) {
        reject(new Error("MathJax unavailable"));
      } else {
        setTimeout(tick, 60);
      }
    };
    tick();
  });
  return ready;
}

/* MathJax must be given ONE job at a time. Its typesetting walks a document
   state machine, and two calls in flight together come out as SVGs sized
   "NaNex" — which is what a canvas that repaints its total on every touch will
   do to it within a second. So every request goes through one chain. */
let chain = Promise.resolve();
function queue(job) {
  chain = chain.then(job).catch(() => {});
  return chain;
}

/* Nothing is typeset while it is off the page: MathJax measures the size of an
   ex in the element it is writing into, and an element with no box measures
   nothing. The plain text is already there, and the next redraw will set it. */
const onPage = (el) => !!el && el.getClientRects().length > 0;

const attr = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * One piece of mathematics, for building into a string of HTML.
 * `plain` is what stands there until MathJax has it — so it must READ.
 */
export function math(tex, plain) {
  return `<span class="bb-math" data-tex="${attr(tex)}">${plain}</span>`;
}

/** Set every piece of mathematics inside an element that has just been built. */
export async function typesetIn(root) {
  if (!root) return;
  const nodes = [...root.querySelectorAll(".bb-math[data-tex]")];
  if (!nodes.length) return;
  try {
    await whenMathJax();
  } catch {
    return; // the Unicode is already on the page and is what stays
  }
  await queue(async () => {
    const live = nodes.filter(onPage);
    if (!live.length) return;
    for (const n of live) n.innerHTML = "\\(" + n.dataset.tex + "\\)";
    await window.MathJax.typesetPromise(live);
  });
}

/**
 * Set one element that is rewritten over and over — the running total in the
 * pill changes on every touch of the canvas, so it is typeset in place and
 * only when what it says has actually changed.
 */
export function setMath(el, tex, plain) {
  if (!el) return;
  if (el.dataset.tex === tex) return;
  el.dataset.tex = tex;
  el.textContent = plain;
  whenMathJax()
    .then(() => queue(async () => {
      if (el.dataset.tex !== tex) return; // a newer number arrived while we waited
      if (!onPage(el)) { el.dataset.tex = ""; return; } // set it once it is shown
      el.innerHTML = "\\(" + tex + "\\)";
      await window.MathJax.typesetPromise([el]);
    }))
    .catch(() => {});
}

/** A number as it is written in a base: plain in ten, with its subscript elsewhere. */
export function numTex(text, base) {
  return base === 10 ? String(text) : `${text}_{${base}}`;
}
