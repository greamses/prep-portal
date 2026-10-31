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
export function createClock(el, { onEnd = () => {}, onLow = () => {} } = {}) {
  let left = 0;
  let total = 1;             // seconds the run began with, for the sand
  let lowSaid = false;       // onLow fires once per run, the first time a minute or less is left
  let timer = 0;
  let running = false;
  /* The clock is the site's pill, fixed to the edge of the window so the student sees it wherever they have scrolled to
     (the camera's self-view stacks under it: html.xm-clocked). It turns red in the last minute. In it is an hourglass whose sand
     falls as the time goes: the top bulb holds what is left, the bottom what has gone. */
  el.classList.add("pp-pill", "pp-pill--static");
  const id = `xmg${Math.random().toString(36).slice(2, 8)}`;
  const GLASS = "M5 3H19C19 11 14.5 14 12 16C14.5 18 19 21 19 29H5C5 21 9.5 18 12 16C9.5 14 5 11 5 3Z";
  el.innerHTML = `<span class="xm-glass" aria-hidden="true"><svg viewBox="0 0 24 32" width="18" height="24">
      <defs><clipPath id="${id}"><path d="${GLASS}"/></clipPath></defs>
      <g clip-path="url(#${id})"><rect class="sand-top" x="4" width="16" fill="#d9a441"/><rect class="sand-bottom" x="4" width="16" fill="#d9a441"/></g>
      <line class="stream" x1="12" x2="12" stroke="#d9a441" stroke-width="1.6" stroke-linecap="round"/>
      <path d="${GLASS}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M3 3H21M3 29H21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span><span class="xm-time"></span>`;
  const sandTop = el.querySelector(".sand-top"), sandBottom = el.querySelector(".sand-bottom"), stream = el.querySelector(".stream"), face = el.querySelector(".xm-time");
  const sand = () => {
    const f = Math.max(0, Math.min(1, left / total)), H = 13;
    sandTop.setAttribute("y", String(16 - H * f)); sandTop.setAttribute("height", String(H * f));
    sandBottom.setAttribute("y", String(29 - H * (1 - f))); sandBottom.setAttribute("height", String(H * (1 - f)));
    /* a thread of sand from the neck down to the heap, while there is sand above and room below */
    const falling = running && f > 0 && f < 1;
    stream.setAttribute("y1", "15"); stream.setAttribute("y2", String(Math.max(16, 29 - H * (1 - f))));
    stream.style.display = falling ? "" : "none";
  };
  const paint = () => {
    face.textContent = running ? fmt(left) : "";
    sand();
    el.classList.toggle("is-low", running && left <= 60);
    el.classList.toggle("pp-pill--danger", running && left <= 60);
    el.hidden = !running;
    document.documentElement.classList.toggle("xm-clocked", running);
    if (running && left <= 60 && !lowSaid) { lowSaid = true; onLow(); }
  };
  const stop = () => { clearInterval(timer); timer = 0; running = false; paint(); };
  return {
    get running() { return running; },
    start(seconds) {
      stop();
      left = Math.max(1, Math.round(seconds));
      total = left;
      lowSaid = false;
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
