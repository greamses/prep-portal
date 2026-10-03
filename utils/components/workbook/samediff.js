/* ============================================================================
   PRINTABLE WORKBOOK — the SAME DIFFERENCE slider
   ----------------------------------------------------------------------------
   A take-away is a DISTANCE on the number line: 503 − 278 is how far it is
   from 278 to 503. Slide both numbers along by the same amount and the
   distance does not change — so slide until the number being taken away is
   a round one (the nearest, up or down), and the sum needs no regrouping:

       503 − 278   slide both up 22   525 − 300   = 225

   The figure is a number line with the difference drawn as a bar from the
   smaller number to the bigger, and the column sum beside it. On paper the
   bar sits where the question puts it, with a dashed outline where the round
   number would take it. On screen the bar SLIDES (drag it, or the buttons):
   both ends move together, the column sum rewrites itself to the numbers at
   the bar's ends, and a column that would need regrouping is shown in red
   until none does.

   It is working, never marked — the boxes beside it are the answers.

     sameDiffFigure(a, b, { goal })   the printed figure (goal = the shift to
                                      the round number, + up or − down,
                                      drawn dashed)
     mountSameDiff(el, { saved, onChange })  → { shift(), set(s), clear(), dispose() }
   ========================================================================== */

const INK = "#2a2723";
const GREY = "#8a837a";
const BAR = "#bfe3ff";
const RED = "#c0453f";
const GREEN = "#3f8f4f";
const LINE_W = 128;    // mm of number line
const H = 30;

const f = (n) => (+n).toFixed(2);
const NICE = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];

/** The stretch of number line a question needs: room to slide to the goal
    (up or down — the nearest round number may be either way) and a little past. */
function rangeOf(a, b, goal) {
  const span = a - b;
  const pad = Math.max(2, Math.ceil((span + Math.abs(goal)) * 0.12));
  const lo = Math.max(0, b + Math.min(goal, 0) - pad);
  const hi = a + Math.max(goal, 0) + pad;
  const step = NICE.find((s) => (hi - lo) / s <= 12) || 10000;
  return { lo: Math.floor(lo / step) * step, hi: Math.ceil(hi / step) * step, step };
}

/** Does a − b need regrouping? Which columns (units first) borrow. */
export function borrows(a, b) {
  const A = String(a).split("").reverse().map(Number);
  const B = String(b).split("").reverse().map(Number);
  return A.map((d, i) => d < (B[i] || 0));
}

/** The number line, the bar from b + s to a + s, and (on paper) the goal dashed. */
function lineSvg(a, b, s, goal, { live = false } = {}) {
  const { lo, hi, step } = rangeOf(a, b, goal);
  const x = (v) => 2 + ((v - lo) / (hi - lo)) * LINE_W;
  const y = 21;
  let out = `<line x1="${f(x(lo))}" x2="${f(x(hi))}" y1="${y}" y2="${y}" stroke="${INK}" stroke-width="0.45"/>`;
  for (let v = lo; v <= hi; v += step) {
    out += `<line x1="${f(x(v))}" x2="${f(x(v))}" y1="${y - 1.4}" y2="${y + 1.4}" stroke="${INK}" stroke-width="0.35"/>` +
      `<text x="${f(x(v))}" y="${y + 5}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.8" fill="${GREY}">${v}</text>`;
  }
  if (goal && !live) {
    out += `<rect x="${f(x(b + goal))}" y="${y - 9}" width="${f(x(a + goal) - x(b + goal))}" height="6" fill="none" stroke="${GREY}" stroke-width="0.35" stroke-dasharray="1.2 1"/>`;
  }
  const x0 = x(b + s), x1 = x(a + s);
  out += `<g class="sd-bar"${live ? ' data-sd-bar="1"' : ""}>` +
    `<rect x="${f(x0)}" y="${y - 9}" width="${f(x1 - x0)}" height="6" fill="${BAR}" stroke="${INK}" stroke-width="0.45"/>` +
    `<text x="${f((x0 + x1) / 2)}" y="${y - 4.9}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3" font-weight="700" fill="${INK}">difference</text>` +
    `<line x1="${f(x0)}" x2="${f(x0)}" y1="${y - 9}" y2="${y}" stroke="${INK}" stroke-width="0.35" stroke-dasharray="0.8 0.6"/>` +
    `<line x1="${f(x1)}" x2="${f(x1)}" y1="${y - 9}" y2="${y}" stroke="${INK}" stroke-width="0.35" stroke-dasharray="0.8 0.6"/>` +
    `<text x="${f(x0)}" y="${y - 10.5}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.4" font-weight="700" fill="${INK}">${b + s}</text>` +
    `<text x="${f(x1)}" y="${y - 10.5}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.4" font-weight="700" fill="${INK}">${a + s}</text>` +
    `</g>`;
  return `<svg class="sd-line" viewBox="0 0 ${LINE_W + 4} ${H}" width="${LINE_W + 4}mm" height="${H}mm" role="img" aria-label="${a + s} take away ${b + s} on a number line">${out}</svg>`;
}

/** The column sum for the numbers at the bar's ends; red where a column borrows. */
function columnsHtml(a, b, live) {
  const n = String(a).length;
  const top = String(a).padStart(n, " ").split("");
  const bot = String(b).padStart(n, " ").split("");
  const owe = borrows(a, b).reverse();
  const cell = (d, i, row) => `<span class="sd-cell${live && owe[i] && row ? " is-owe" : ""}">${d === " " ? "" : d}</span>`;
  const none = !owe.some(Boolean);
  return `<div class="sd-cols wb-nomath" aria-label="${a} take away ${b}">` +
    `<div class="sd-row"><span class="sd-sign"></span>${top.map((d, i) => cell(d, i, 1)).join("")}</div>` +
    `<div class="sd-row sd-row--take"><span class="sd-sign">−</span>${bot.map((d, i) => cell(d, i, 1)).join("")}</div>` +
    (live ? `<p class="sd-say ${none ? "is-easy" : "is-owe"}">${none ? "No regrouping" : `${owe.filter(Boolean).length} column${owe.filter(Boolean).length > 1 ? "s" : ""} to regroup`}</p>` : "") +
    `</div>`;
}

/** The figure as printed. */
export function sameDiffFigure(a, b, { goal = 0 } = {}) {
  return `<div class="wb-samediff" data-samediff="${a},${b},${goal}">` +
    `<div class="sd-body">${lineSvg(a, b, 0, goal)}${columnsHtml(a, b, false)}</div></div>`;
}

/**
 *   mountSameDiff(el, { saved, onChange })
 *     saved                 the shift from before, or null
 *     onChange(now, before) after every slide, for Undo
 */
export function mountSameDiff(el, { saved = null, onChange = () => {} } = {}) {
  const [a, b, goal] = el.dataset.samediff.split(",").map(Number);
  const printed = el.innerHTML;
  const { lo, hi } = rangeOf(a, b, goal);
  const minS = lo - b, maxS = hi - a;
  let s = Number.isFinite(saved) ? saved : 0;
  const big = a - lo > 400;

  el.classList.add("is-live");
  el.innerHTML =
    `<div class="sd-body"></div>` +
    `<div class="sd-tools">` +
    (big ? `<button type="button" class="pp-btn wb-tint-1" data-sd="-100">−100</button>` : "") +
    `<button type="button" class="pp-btn wb-tint-1" data-sd="-10">−10</button>` +
    `<button type="button" class="pp-btn wb-tint-1" data-sd="-1">−1</button>` +
    `<span class="sd-moved" role="status"></span>` +
    `<button type="button" class="pp-btn wb-tint-2" data-sd="1">+1</button>` +
    `<button type="button" class="pp-btn wb-tint-2" data-sd="10">+10</button>` +
    (big ? `<button type="button" class="pp-btn wb-tint-2" data-sd="100">+100</button>` : "") +
    `</div>`;
  const body = el.querySelector(".sd-body");
  const moved = el.querySelector(".sd-moved");

  function paint() {
    body.innerHTML = lineSvg(a, b, s, goal, { live: true }) + columnsHtml(a + s, b + s, true);
    moved.textContent = s === 0 ? "slide the bar" : `both moved ${s > 0 ? "up" : "down"} ${Math.abs(s)}`;
  }
  const to = (next) => Math.max(minS, Math.min(maxS, Math.round(next)));
  function commit(before) { if (before !== s) onChange(s, before); }

  el.querySelector(".sd-tools").addEventListener("click", (e) => {
    const d = Number(e.target.closest("[data-sd]")?.dataset.sd);
    if (!d) return;
    const before = s;
    s = to(s + d);
    paint();
    commit(before);
  });

  let drag = null;
  body.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("[data-sd-bar]")) return;
    const svg = body.querySelector("svg");
    const r = svg.getBoundingClientRect();
    drag = { x: e.clientX, s, per: (hi - lo) / ((LINE_W / (LINE_W + 4)) * r.width), id: e.pointerId };
    body.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  body.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const next = to(drag.s + (e.clientX - drag.x) * drag.per);
    if (next !== s) { s = next; paint(); }
  });
  const up = () => { if (!drag) return; const before = drag.s; drag = null; commit(before); };
  body.addEventListener("pointerup", up);
  body.addEventListener("pointercancel", up);

  paint();
  return {
    shift: () => s,
    set(v) { s = Number.isFinite(v) ? v : 0; paint(); },
    clear() { s = 0; paint(); },
    dispose() { el.classList.remove("is-live"); el.innerHTML = printed; },
  };
}
