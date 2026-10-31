/* ============================================================================
   The clock on an exam paper
   ----------------------------------------------------------------------------
   "Timer" in the setup puts a countdown in the toolbar while the paper is being
   answered on screen. Its length is the paper's "Time allowed" if that says a
   time ("1 hour", "90 minutes", "1 h 30 min", "45"); a paper that says nothing
   gets about a minute a question, the same rule the CBT quiz uses. When it runs
   out the paper is checked, as an invigilator would take it in.
   ========================================================================== */

/** Minutes the paper allows, from its "Time allowed" text, or a minute a question when it names none. */
export function minutesFor(timeText, questionCount) {
  const t = String(timeText || "").toLowerCase();
  let mins = 0;
  const h = t.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
  if (h) mins += parseFloat(h[1].replace(",", ".")) * 60;
  const m = t.match(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/);
  if (m) mins += parseInt(m[1], 10);
  if (!mins) {
    const bare = t.match(/^\s*(\d+)\s*$/);
    if (bare) mins = parseInt(bare[1], 10);
  }
  return mins > 0 ? Math.round(mins) : Math.max(5, Math.round(questionCount || 0));
}

const fmt = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const two = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${two(m)}:${two(r)}` : `${two(m)}:${two(r)}`;
};

/** A countdown shown in `el`. start(seconds) begins it, stop() clears it; onEnd() fires once at zero. */
export function createClock(el, { onEnd = () => {} } = {}) {
  let left = 0;
  let timer = 0;
  let running = false;
  /* The clock is the site's pill, fixed to the edge of the window so the student sees it wherever they have scrolled to
     (the camera's self-view stacks under it: html.xm-clocked). It turns red in the last minute. */
  el.classList.add("pp-pill", "pp-pill--static");
  const paint = () => {
    el.textContent = running ? fmt(left) : "";
    el.classList.toggle("is-low", running && left <= 60);
    el.classList.toggle("pp-pill--danger", running && left <= 60);
    el.hidden = !running;
    document.documentElement.classList.toggle("xm-clocked", running);
  };
  const stop = () => { clearInterval(timer); timer = 0; running = false; paint(); };
  return {
    get running() { return running; },
    start(seconds) {
      stop();
      left = Math.max(1, Math.round(seconds));
      running = true;
      paint();
      timer = setInterval(() => {
        left -= 1;
        if (left <= 0) { stop(); onEnd(); return; }
        paint();
      }, 1000);
    },
    stop,
  };
}
