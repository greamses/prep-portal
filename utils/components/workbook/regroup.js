/* ============================================================================
   BLOCKS PUSHED INTO A DIFFERENT SHAPE
   ----------------------------------------------------------------------------
   A number of blocks, and two arrows. Press one and the blocks REGROUP into
   the next rectangle they will make — 12 goes 1 × 12, 2 × 6, 3 × 4, 4 × 3,
   6 × 2, 12 × 1 and back round — and the shape falls into place the way a
   tetromino drops into a row.

   IT IS THE SAME BLOCKS EVERY TIME. Nothing is added and nothing is taken
   away, which is the whole argument: a number is not changed by being
   arranged, so every rectangle it makes is a true sentence about it. A child
   who presses the arrow four times on 12 has seen every factor pair of 12
   without being told what a factor is.

   AND A PRIME WILL NOT GO. Press the arrow on 13 and the blocks stay exactly
   where they are, and the caption says so. That refusal is the lesson: it is
   not that the child has not found the arrangement yet, it is that there is
   not one. The arrows stay on the screen and stay pressable — a button that
   goes away has explained nothing.

   Not marked, ever. It is the experiment; the boxes under it are the answer,
   the same way the base-ten blocks and the dice are worked with and the
   writing beside them is what counts.
   ========================================================================== */

/** Every rectangle a number makes: [rows, in each], in order. */
export function shapesFor(n) {
  const out = [];
  for (let r = 1; r <= n; r++) if (n % r === 0) out.push([r, n / r]);
  return out;
}

/* One block, in millimetres, like every other drawing in these workbooks. */
const CELL = 4.2;
const PAD = 0.55;

/**
 * `n` blocks laid out in `per` to a row.
 *
 * NO WRAPPING, ever. One row of 27 blocks is ONE row, and a picture that
 * folds it onto a second line because the paper is narrow has said the
 * opposite of what the question is asking. A row too wide for the column is
 * drawn at full width and SCALED DOWN by the browser instead (the svg carries
 * a viewBox and the stylesheet caps it at 100%), so the blocks get smaller
 * and the row stays a row.
 */
export function blocksSvg(n, per, tone = 0) {
  const across = Math.max(1, per);
  const rows = Math.ceil(n / across);
  const w = across * CELL;
  const h = rows * CELL;
  const bits = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / across);
    const c = i % across;
    bits.push(`<rect x="${(c * CELL).toFixed(2)}" y="${(r * CELL).toFixed(2)}"`
      + ` width="${(CELL - PAD).toFixed(2)}" height="${(CELL - PAD).toFixed(2)}" rx="0.7"`
      + ` class="rg-cube rg-cube--${tone % 6}"/>`);
  }
  return `<svg class="rg-art" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}"`
    + ` width="${w.toFixed(1)}mm" height="${h.toFixed(1)}mm" aria-hidden="true">${bits.join("")}</svg>`;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The picture on the paper: the blocks in one long row, and a line under them
 * saying what that row is. On screen the arrows appear and it can be pushed
 * about; on paper the child rings the groups with a pencil, which is the same
 * thinking with a different tool.
 */
export function regroupHtml({ n, at = 0, label = "" } = {}) {
  const shapes = shapesFor(n);
  const [rows, per] = shapes[Math.min(at, shapes.length - 1)];
  return `<div class="rg wb-nomath" data-regroup="${n}"${label ? ` aria-label="${esc(label)}"` : ""}>`
    + `<div class="rg-stage">${blocksSvg(n, per, 0)}</div>`
    + `<p class="rg-say"><b>${rows}</b> ${rows === 1 ? "row" : "rows"} of <b>${per}</b></p>`
    + `</div>`;
}

/**
 * mountRegroup(el, { saved, onChange }) → { state(), set(i), clear(), dispose() }
 *
 * The arrows are buttons, not gestures: this is a picture to think with, and a
 * child who cannot find the swipe has lost the lesson to the interface.
 */
export function mountRegroup(el, { saved = null, onChange = () => {} } = {}) {
  const n = Number(el.dataset.regroup);
  const shapes = shapesFor(n);
  const prime = shapes.length === 2;     // 1 × n and n × 1, and nothing between
  let at = Number.isInteger(saved) ? ((saved % shapes.length) + shapes.length) % shapes.length : 0;

  el.classList.add("is-live");
  const stage = el.querySelector(".rg-stage");
  const said = el.querySelector(".rg-say");

  const bar = document.createElement("div");
  bar.className = "rg-bar";
  bar.innerHTML =
    `<button type="button" class="rg-btn" data-go="-1" aria-label="the shape before this one">`
    + `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`
    + `<button type="button" class="rg-btn" data-go="1" aria-label="the next shape">`
    + `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  el.insertBefore(bar, el.firstChild);

  const paint = (moved) => {
    const [rows, per] = shapes[at];
    stage.innerHTML = blocksSvg(n, per, at);
    said.innerHTML = `<b>${rows}</b> ${rows === 1 ? "row" : "rows"} of <b>${per}</b>`;
    if (moved) {
      stage.classList.remove("is-dropped");
      void stage.offsetWidth;            // let the animation start again
      stage.classList.add("is-dropped");
    }
  };

  const nope = () => {
    el.classList.remove("is-stuck");
    void el.offsetWidth;
    el.classList.add("is-stuck");
    said.innerHTML = `<b>${n}</b> will not go into equal rows — it is <b>prime</b>`;
  };

  bar.addEventListener("click", (e) => {
    const go = Number(e.target.closest("[data-go]")?.dataset.go || 0);
    if (!go) return;
    if (prime) { nope(); return; }
    /* round and round: the arrangements are a ring, not a list with ends */
    at = (at + go + shapes.length) % shapes.length;
    paint(true);
    onChange(at);
  });

  paint(false);

  return {
    state: () => at,
    set(i) { at = Number.isInteger(i) ? ((i % shapes.length) + shapes.length) % shapes.length : 0; paint(false); },
    clear() { at = 0; paint(false); onChange(0); },
    dispose() { el.classList.remove("is-live", "is-stuck"); bar.remove(); },
  };
}
