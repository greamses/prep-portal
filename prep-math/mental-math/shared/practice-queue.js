/* ═══════════════════════════════════════════════════════
   MENTAL MATH — ENDLESS PRACTICE QUEUE
   Same shape as flashcards/js/facts.js's queue: grows forward only, never
   regenerates a problem you've already seen when paging back and forth.
═══════════════════════════════════════════════════════ */

export function createPracticeQueue({ generate }) {
  let queue = [];
  let idx = -1;

  function goNext() {
    idx += 1;
    if (idx >= queue.length) queue.push(generate());
    return queue[idx];
  }

  function goPrev() {
    if (idx > 0) idx -= 1;
    return queue[idx];
  }

  function current() { return queue[idx]; }

  function reset() {
    queue = [];
    idx = -1;
  }

  return {
    goNext,
    goPrev,
    current,
    reset,
    get index() { return idx; },
  };
}

// Swipe-left/right paging for touch devices, copied from
// flashcards/js/config.js's attachSwipeNav (kept local so this feature
// stays self-contained rather than importing across /flashcards).
export function attachSwipeNav(el, { onPrev, onNext } = {}) {
  const THRESHOLD = 40;
  let startX = 0;
  let startY = 0;
  let tracking = false;
  let swiping = false;

  el.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
    swiping = false;
  }, { passive: true });

  el.addEventListener("touchmove", (e) => {
    if (!tracking) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (!swiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) swiping = true;
    if (swiping) e.preventDefault();
  }, { passive: false });

  el.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;
    if (!swiping) return;
    const dx = (e.changedTouches[0]?.clientX ?? startX) - startX;
    if (Math.abs(dx) < THRESHOLD) return;
    if (dx < 0) onNext?.();
    else onPrev?.();
  });
}
