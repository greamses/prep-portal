/* ============================================================================
   PRINTABLE WORKBOOK — PREPCOINS AND PREPBILLS, and a purse to handle them in
   ----------------------------------------------------------------------------
   The currency the money chapter is counted in, and the tray a child takes it
   out of on screen. The pieces are here rather than in the workbook because
   both halves need them: the paper draws them, and the live purse hands them
   over.

   ONE HUNDRED PREPCOINS MAKE ONE PREPBILL. That is the only fact to learn, and
   it is the fact that makes a price a decimal: 4.50 is four bills and fifty
   coins, and the point between them is the same point as on the digit-shift
   card (shift.js) and in the written sums.

   THE DENOMINATIONS ARE THE 1-2-5 SERIES, which is what almost every currency
   on earth uses and is not an accident: with 1, 2, 5 at each power of ten you
   can pay any amount with at most three pieces per power, and greedy change —
   take the biggest that fits, again and again — is always the fewest pieces.
   `payWith` relies on that, and the scratchpad check proves it against an
   exhaustive search.

     prepcoins   1  2  5  10  20  50
     prepbills   1  2  5  10  20  50  100

   EVERY AMOUNT HERE IS A WHOLE NUMBER OF PREPCOINS. Money in floating point is
   money that loses a coin: 0.1 + 0.2 is not 0.3 and a till that says so is a
   till nobody trusts. Only `writeAmount` ever puts the point in.

   THE PURSE is a manipulative and is NEVER MARKED — working, like the counters
   and the dice. It says what you are holding, because counting money is the
   skill and lying about it would be no help; what the child does with that
   goes in an answer box beside it.
   ========================================================================== */

const INK = "#2a2723";
const FAINT = "rgba(42,39,35,.3)";

/** Prepcoins in one prepbill. The whole currency hangs off this one number. */
export const PER_BILL = 100;

export const COINS = [1, 2, 5, 10, 20, 50];
export const BILLS = [1, 2, 5, 10, 20, 50, 100];

/** Every piece there is, biggest first — in prepcoins, so they are comparable. */
export const PIECES = BILLS.map((b) => b * PER_BILL).concat(COINS).sort((a, b) => b - a);

/** Bills, as a number of prepcoins. */
export const bill = (n) => n * PER_BILL;

/* ── writing an amount ─────────────────────────────────────────────────────*/

/** 450 → "4.50". Money is always written to the coin, even when it is round. */
export function writeAmount(coins) {
  const n = Math.round(coins);
  const sign = n < 0 ? "−" : "";
  const a = Math.abs(n);
  return `${sign}${Math.floor(a / PER_BILL)}.${String(a % PER_BILL).padStart(2, "0")}`;
}

/** 450 → "4 prepbills and 50 prepcoins" — the amount said out loud. */
export function sayAmount(coins) {
  const n = Math.abs(Math.round(coins));
  const b = Math.floor(n / PER_BILL);
  const c = n % PER_BILL;
  const bs = `${b} prepbill${b === 1 ? "" : "s"}`;
  const cs = `${c} prepcoin${c === 1 ? "" : "s"}`;
  if (!b) return cs;
  if (!c) return bs;
  return `${bs} and ${cs}`;
}

/* ── paying ────────────────────────────────────────────────────────────────*/

/**
 * The FEWEST pieces that make an amount — biggest first, as anybody pays.
 * → [{ value, kind }] where kind is "bill" or "coin", one entry per piece.
 */
export function payWith(coins) {
  let left = Math.round(coins);
  const out = [];
  for (const p of PIECES) {
    while (left >= p) {
      out.push({ value: p >= PER_BILL ? p / PER_BILL : p, kind: p >= PER_BILL ? "bill" : "coin" });
      left -= p;
    }
  }
  return out;
}

/** What is handed back when `paid` covers `price`. */
export const changeFrom = (paid, price) => payWith(Math.max(0, paid - price));

/**
 * The smallest sensible note or coin a shopper would hand over for an amount —
 * the next piece up, so there is change to count. That is the question worth
 * asking: nobody learns anything from paying the exact money.
 */
export function roundUpPiece(coins) {
  const n = Math.round(coins);
  for (const p of [...PIECES].reverse()) if (p >= n) return p;
  return PIECES[0];
}

/* ── the pieces, drawn ─────────────────────────────────────────────────────*/

/* Each denomination its own colour and its own size, the way real money is
   told apart at a glance — and bigger is worth more, which is a lie real
   currencies also tell and children find helpful. */
const COIN_FACE = { 1: "#d9a97a", 2: "#cb9360", 5: "#e3bc85", 10: "#c7ced5", 20: "#aab5c0", 50: "#f4c95d" };
const COIN_EDGE = { 1: "#a97a4e", 2: "#9c6a3c", 5: "#b18e58", 10: "#98a2ac", 20: "#7f8b97", 50: "#c9922f" };
const BILL_FACE = { 1: "#9fd9a4", 2: "#bfe0b0", 5: "#9ed2f2", 10: "#f5c094", 20: "#d6bdf3", 50: "#f7dc96", 100: "#f0a9ac" };
const BILL_EDGE = { 1: "#3f8f4f", 2: "#5a8f3f", 5: "#2a6ca8", 10: "#c9752f", 20: "#7a56a8", 50: "#c9922f", 100: "#c0453f" };

const COIN_MM = { 1: 7.4, 2: 8.2, 5: 9, 10: 9.8, 20: 10.6, 50: 11.4 };
const BILL_MM = { 1: 17, 2: 17.5, 5: 18, 10: 19, 20: 20, 50: 21, 100: 22 };

/**
 * ONE PREPCOIN, drawn: a milled disc with its worth on it. The word is on the
 * coin because a coin that only says "5" is a counter, not money.
 */
export function coinSvg(value, { mm = 0 } = {}) {
  const d = mm || COIN_MM[value] || 9;
  const face = COIN_FACE[value] || "#d9d9d9";
  const edge = COIN_EDGE[value] || "#999";
  return `<svg class="mo-piece mo-piece--coin" viewBox="0 0 40 40" width="${d}mm" height="${d}mm"`
    + ` role="img" aria-label="${value} prepcoin${value === 1 ? "" : "s"}">`
    + `<circle cx="20" cy="20" r="18.6" fill="${edge}"/>`
    + `<circle cx="20" cy="20" r="16.2" fill="${face}" stroke="${edge}" stroke-width="1"/>`
    + `<text x="20" y="19.4" text-anchor="middle" dominant-baseline="central" fill="${INK}"`
    + ` font-size="17" font-weight="800" font-family="JetBrains Mono, ui-monospace, monospace">${value}</text>`
    + `<text x="20" y="31" text-anchor="middle" dominant-baseline="central" fill="${INK}"`
    + ` font-size="5.4" font-weight="700" letter-spacing="0.2">PREPCOIN${value === 1 ? "" : "S"}</text>`
    + `</svg>`;
}

/**
 * ONE PREPBILL, drawn: a note with its worth in two corners the way a note
 * carries it, so it can be read from a handful held fanned out.
 */
export function billSvg(value, { mm = 0 } = {}) {
  const w = mm || BILL_MM[value] || 19;
  const face = BILL_FACE[value] || "#e4e4e4";
  const edge = BILL_EDGE[value] || "#777";
  return `<svg class="mo-piece mo-piece--bill" viewBox="0 0 64 32" width="${w}mm" height="${w / 2}mm"`
    + ` role="img" aria-label="${value} prepbill${value === 1 ? "" : "s"}">`
    + `<rect x="0.8" y="0.8" width="62.4" height="30.4" fill="${face}" stroke="${edge}" stroke-width="1.6"/>`
    + `<rect x="4" y="4" width="56" height="24" fill="none" stroke="${edge}" stroke-width="0.7" stroke-dasharray="2.4 1.8"/>`
    + `<circle cx="32" cy="16" r="8.4" fill="none" stroke="${edge}" stroke-width="0.9"/>`
    + `<text x="32" y="16" text-anchor="middle" dominant-baseline="central" fill="${INK}"`
    + ` font-size="12" font-weight="800" font-family="JetBrains Mono, ui-monospace, monospace">${value}</text>`
    + `<text x="10.6" y="9.6" text-anchor="middle" dominant-baseline="central" fill="${INK}" font-size="7" font-weight="800">${value}</text>`
    + `<text x="53.4" y="23" text-anchor="middle" dominant-baseline="central" fill="${INK}" font-size="7" font-weight="800">${value}</text>`
    + `<text x="32" y="27.4" text-anchor="middle" dominant-baseline="central" fill="${INK}"`
    + ` font-size="4.6" font-weight="700" letter-spacing="0.3">PREPBILL${value === 1 ? "" : "S"}</text>`
    + `</svg>`;
}

/** Whichever kind of piece this is. */
export const pieceSvg = (p, opts) => (p.kind === "bill" ? billSvg(p.value, opts) : coinSvg(p.value, opts));

/**
 * A HANDFUL: the pieces that make an amount, laid out biggest first, notes
 * before coins the way they come out of a purse.
 */
export function moneySvg(coins, { max = 14 } = {}) {
  const pieces = payWith(coins);
  const shown = pieces.slice(0, max);
  const over = pieces.length - shown.length;
  return `<span class="mo-hand">${shown.map((p) => pieceSvg(p)).join("")}`
    + (over ? `<span class="mo-hand__more">+${over} more</span>` : "")
    + `</span>`;
}

/** One of each piece there is — the currency itself, for the chart. */
export function currencySvg() {
  return `<span class="mo-hand mo-hand--all">`
    + BILLS.map((b) => billSvg(b)).join("")
    + COINS.map((c) => coinSvg(c)).join("")
    + `</span>`;
}


/* ── the purse, on screen ──────────────────────────────────────────────────*/

/**
 * THE PAPER SIDE: a tray of every piece there is, an empty space to lay money
 * out on, and a line that says what is lying there. On paper it is a tray and
 * an empty box — somewhere to put real coins, or to draw them. On screen
 * `mountPurse` makes it work.
 *
 *   say   what the tray is for, in the child's own question's words
 *   mm    how deep the space to lay money out on is
 */
export function purse({ say = "", mm = 40 } = {}) {
  const key = (v, kind) => `<button type="button" class="pu-take pp-plain" data-take="${v}" data-kind="${kind}"`
    + ` aria-label="Take a ${v} ${kind === "bill" ? "prepbill" : "prepcoin"}">`
    + (kind === "bill" ? billSvg(v, { mm: 13 }) : coinSvg(v, { mm: 7.4 })) + `</button>`;
  return `<div class="pu-wrap" data-purse style="--pu-h:${mm}mm">`
    + `<div class="pu-tray">`
    + `<span class="pu-tray__row">${BILLS.map((v) => key(v, "bill")).join("")}</span>`
    + `<span class="pu-tray__row">${COINS.map((v) => key(v, "coin")).join("")}</span>`
    + `<span class="pu-tray__say">${say || "take out as much money as you like"}</span>`
    + `</div>`
    + `<div class="pu-mat" data-mat></div>`
    + `<p class="pu-read" data-read></p>`
    + `</div>`;
}

/** What a list of pieces comes to, in prepcoins. */
export const heldTotal = (pieces) =>
  pieces.reduce((t, p) => t + (p.kind === "bill" ? p.value * PER_BILL : p.value), 0);

/** What is lying on the mat, said out loud. */
export function sayHeld(pieces) {
  if (!pieces.length) return "nothing taken out yet";
  const n = pieces.length;
  return `${writeAmount(heldTotal(pieces))} — ${n} piece${n === 1 ? "" : "s"}`;
}

/**
 * Bring a purse to life.
 *
 *   saved     what was lying on the mat last time
 *   onChange  (now, before) — the same shape the counters use, so the page can
 *             keep it and undo it
 *
 * → { pieces, total(), set(list), clear(), dispose() }
 */
export function mountPurse(wrap, { saved = null, onChange = null } = {}) {
  const matEl = wrap.querySelector("[data-mat]");
  const read = wrap.querySelector("[data-read]");
  let pieces = Array.isArray(saved)
    ? saved.map((p) => ({ id: p.id, value: p.value, kind: p.kind, x: p.x, y: p.y }))
    : [];
  let seq = pieces.reduce((n, p) => Math.max(n, p.id + 1), 1);

  const snapshot = () => pieces.map((p) => ({ ...p }));
  const tell = (before) => { if (onChange) onChange(snapshot(), before); };

  function draw() {
    matEl.innerHTML = pieces.map((p) => `<div class="pu-piece" data-id="${p.id}"`
      + ` style="left:${p.x}%;top:${p.y}%" tabindex="0" role="button"`
      + ` aria-label="${p.value} ${p.kind === "bill" ? "prepbill" : "prepcoin"}, drag it, or press Delete to put it back">`
      + (p.kind === "bill" ? billSvg(p.value, { mm: 15 }) : coinSvg(p.value, { mm: 9 }))
      + `</div>`).join("");
    read.textContent = sayHeld(pieces);
    wrap.classList.toggle("is-empty", !pieces.length);
  }

  /* ── taking a piece out of the tray ────────────────────────────────────*/
  wrap.querySelectorAll("[data-take]").forEach((b) => {
    b.addEventListener("click", () => {
      const value = Number(b.dataset.take);
      const kind = b.dataset.kind;
      /* Laid out in rows so that twenty taps do not land in one heap: notes
         along the top and coins under them, the way a purse empties. A note is
         wider than a coin, so it gets a wider step and fewer to a row — with
         one step for both, the notes overlapped and a purse of notes read as
         one fat note. */
      const same = pieces.filter((p) => p.kind === kind).length;
      const [step, perRow, top] = kind === "bill" ? [23, 4, 4] : [13, 6, 46];
      const before = snapshot();
      pieces.push({
        id: seq++, value, kind,
        x: 3 + (same % perRow) * step,
        y: top + Math.floor(same / perRow) * 16,
      });
      draw();
      tell(before);
    });
  });

  /* ── moving a piece, and putting it back ───────────────────────────────*/
  let drag = null;
  const at = (e) => {
    const box = matEl.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(90, ((e.clientX - box.left) / box.width) * 100)),
      y: Math.max(0, Math.min(80, ((e.clientY - box.top) / box.height) * 100)),
    };
  };

  matEl.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(".pu-piece");
    if (!el) return;
    const p = pieces.find((q) => q.id === Number(el.dataset.id));
    if (!p) return;
    drag = { p, el, before: snapshot() };
    el.classList.add("is-held");
    /* a pointer id that is no longer live throws here, and a throw in a
       pointerdown handler loses the drag */
    try { el.setPointerCapture?.(e.pointerId); } catch { /* it moves without it */ }
    e.preventDefault();
  });

  matEl.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const { x, y } = at(e);
    drag.p.x = x;
    drag.p.y = y;
    drag.el.style.left = `${x}%`;
    drag.el.style.top = `${y}%`;
  });

  const drop = (e) => {
    if (!drag) return;
    const { p, el, before } = drag;
    drag = null;
    el.classList.remove("is-held");
    /* dragged right off the mat: it goes back in the tray */
    const box = matEl.getBoundingClientRect();
    const out = e.clientX < box.left - 8 || e.clientX > box.right + 8
      || e.clientY < box.top - 8 || e.clientY > box.bottom + 8;
    if (out) pieces = pieces.filter((q) => q.id !== p.id);
    draw();
    tell(before);
  };
  matEl.addEventListener("pointerup", drop);
  matEl.addEventListener("pointercancel", drop);

  matEl.addEventListener("keydown", (e) => {
    const el = e.target.closest(".pu-piece");
    if (!el) return;
    if (e.key !== "Delete" && e.key !== "Backspace") return;
    e.preventDefault();
    const before = snapshot();
    pieces = pieces.filter((q) => q.id !== Number(el.dataset.id));
    draw();
    tell(before);
  });

  draw();

  return {
    get pieces() { return snapshot(); },
    total: () => heldTotal(pieces),
    set(list) { pieces = Array.isArray(list) ? list.map((p) => ({ ...p })) : []; draw(); },
    clear() { pieces = []; draw(); },
    dispose() { matEl.innerHTML = ""; },
  };
}
