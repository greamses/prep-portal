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


/* ── the mark ──────────────────────────────────────────────────────────────
   A CURRENCY HAS A MARK, NOT A WORD WRITTEN OUT. Nobody prints "five dollars"
   across a five-dollar bill: it carries a $ and a 5, and the word is only ever
   said out loud. So the money here carries a mark too, and the words come off
   the pieces.

   The major unit — the prepbill — is a P struck through twice, which is how
   almost every currency mark is built: a letter with a bar through it. The
   minor unit — the prepcoin — is its small c, struck once.

   Both are DRAWN and never typed. A made-up currency has no character in any
   font, and an empty box where the mark should be is worse than no mark. */
const MARK = {
  bill: '<path d="M6.2 3.2v13.6M6.2 3.2h4.4a3.6 3.6 0 0 1 0 7.2H6.2" fill="none"'
    + ' stroke="CC" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M2.6 7.4h10.6M2.6 11h10.6" fill="none" stroke="CC" stroke-width="1.5" stroke-linecap="round"/>',
  /* The minor mark is struck VERTICALLY, the way ¢ is. Struck across, a c with
     a bar through it is a €, and a currency whose small change reads as euros
     is a currency that teaches the wrong thing. */
  coin: '<path d="M12.6 6.4a4.9 4.9 0 1 0 0 8" fill="none" stroke="CC"'
    + ' stroke-width="2.6" stroke-linecap="round"/>'
    + '<path d="M7.9 3.4v13.8" fill="none" stroke="CC" stroke-width="1.5" stroke-linecap="round"/>',
};

/** The mark on its own, to set beside a number. */
export function markSvg(kind = "bill", { em = 1, fill = "currentColor" } = {}) {
  return `<svg class="mo-mark" viewBox="0 0 16 20" width="${(0.8 * em).toFixed(2)}em"`
    + ` height="${em}em" role="img" aria-label="${kind === "bill" ? "prepbills" : "prepcoins"}">`
    + MARK[kind].replaceAll("CC", fill) + `</svg>`;
}

/** An amount written the way money is written: the mark, then the figures. */
export const priceHtml = (coins) =>
  `<span class="mo-amt">${markSvg("bill", { em: 0.92 })}${writeAmount(coins)}</span>`;

/* ── what is printed on the money ──────────────────────────────────────────*/

/* THE HOUSE EMBLEM — the site's own flower, five petals round a middle. Real
   money carries a crest, because a crest is the one thing on a note that says
   who stands behind it. */
const EMBLEM = (c) => {
  const pet = [0, 1, 2, 3, 4].map((i) => {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    return `<circle cx="${(Math.cos(a) * 2.5).toFixed(2)}" cy="${(Math.sin(a) * 2.5).toFixed(2)}"`
      + ` r="1.75" fill="${c}"/>`;
  }).join("");
  return `${pet}<circle cx="0" cy="0" r="1.15" fill="${c}" opacity="0.5"/>`;
};

/* GUILLOCHE — the fine engine-turned line work that makes a banknote look like
   a banknote. It is a rosette: one closed curve swung round a circle so that it
   folds over itself. It is the single cheapest thing that stops a coloured
   rectangle reading as a label. */
function rosette(cx, cy, r, c, { petals = 11, squash = 0.36, rings = 3, w = 0.28 } = {}) {
  let out = "";
  for (let k = 0; k < rings; k++) {
    const rr = r * (1 - k * 0.2);
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * Math.PI * 2;
      const rad = rr * (1 - squash + squash * Math.cos(petals * t + k * 0.6));
      pts.push(`${(cx + rad * Math.cos(t)).toFixed(2)},${(cy + rad * Math.sin(t)).toFixed(2)}`);
    }
    out += `<polyline points="${pts.join(" ")}" fill="none" stroke="${c}" stroke-width="${w}" opacity="0.5"/>`;
  }
  return out;
}

/** The fine wavy ruling across a note's field. */
function ruling(x, y, w, h, c, lines = 8) {
  let out = "";
  for (let i = 0; i < lines; i++) {
    const yy = (y + (h / (lines - 1)) * i).toFixed(2);
    const amp = (1.4 + (i % 3) * 0.5).toFixed(2);
    let d = `M${x} ${yy}`;
    for (let s = 0; s < w; s += 12) d += ` q3 -${amp} 6 0 q3 ${amp} 6 0`;
    out += `<path d="${d}" fill="none" stroke="${c}" stroke-width="0.26" opacity="0.4"/>`;
  }
  return out;
}

/* Each denomination its own colour and its own size, the way real money is
   told apart at a glance — and bigger is worth more, which is a lie real
   currencies also tell and children find helpful. The note faces are paler
   than they were: a note is mostly PAPER with ink drawn on it, and a slab of
   saturated colour is what made them read as plastic counters. */
const COIN_FACE = { 1: "#d9a97a", 2: "#cb9360", 5: "#e3bc85", 10: "#c7ced5", 20: "#aab5c0", 50: "#f4c95d" };
const COIN_EDGE = { 1: "#a97a4e", 2: "#9c6a3c", 5: "#b18e58", 10: "#98a2ac", 20: "#7f8b97", 50: "#c9922f" };
const BILL_FACE = { 1: "#dcefdd", 2: "#e4eed2", 5: "#d9eafb", 10: "#fbe6d2", 20: "#eae0fa", 50: "#fdf1d4", 100: "#fadfdf" };
const BILL_EDGE = { 1: "#3f8f4f", 2: "#5a8f3f", 5: "#2a6ca8", 10: "#c9752f", 20: "#7a56a8", 50: "#c9922f", 100: "#c0453f" };

const COIN_MM = { 1: 7.4, 2: 8.2, 5: 9, 10: 9.8, 20: 10.6, 50: 11.4 };
const BILL_MM = { 1: 17, 2: 17.5, 5: 18, 10: 19, 20: 20, 50: 21, 100: 22 };

/**
 * ONE PREPCOIN: a struck disc. A milled edge, a raised rim, a ring of beads, a
 * rosette struck into the field, the house emblem and the figure with its mark
 * — everything a real coin has and nothing it does not. The word is not on it
 * any more, because the mark is.
 */
export function coinSvg(value, { mm = 0 } = {}) {
  const d = mm || COIN_MM[value] || 9;
  const face = COIN_FACE[value] || "#d9d9d9";
  const edge = COIN_EDGE[value] || "#999";
  /* the milling: the fine flutes round the edge of a struck coin */
  let mill = "";
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    mill += `<path d="M${(32 + 29.2 * Math.cos(a)).toFixed(2)} ${(32 + 29.2 * Math.sin(a)).toFixed(2)}`
      + `L${(32 + 31.5 * Math.cos(a)).toFixed(2)} ${(32 + 31.5 * Math.sin(a)).toFixed(2)}"`
      + ` stroke="${edge}" stroke-width="1.15" stroke-linecap="round"/>`;
  }
  const cFs = String(value).length >= 2 ? 21 : 26;
  const cNumW = String(value).length * cFs * 0.6;
  const cMs = 0.62;
  const cLeft = 32 - (cNumW + 1.6 + 16 * cMs) / 2;
  /* the beading inside the rim, as a struck coin carries */
  let beads = "";
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    beads += `<circle cx="${(32 + 24.6 * Math.cos(a)).toFixed(2)}" cy="${(32 + 24.6 * Math.sin(a)).toFixed(2)}"`
      + ` r="0.82" fill="${edge}" opacity="0.6"/>`;
  }
  return `<svg class="mo-piece mo-piece--coin" viewBox="0 0 64 64" width="${d}mm" height="${d}mm"`
    + ` role="img" aria-label="${value} prepcoin${value === 1 ? "" : "s"}">`
    + mill
    + `<circle cx="32" cy="32" r="29.8" fill="${edge}"/>`
    + `<circle cx="32" cy="32" r="27.2" fill="${face}"/>`
    + rosette(32, 32, 21, edge, { petals: 9, squash: 0.26, rings: 2, w: 0.34 })
    + beads
    + `<g transform="translate(32 16.5)">${EMBLEM(edge)}</g>`
    /* the figure and its mark, measured and centred together — a 50 set from a
       fixed point ran into its own mark */
    + `<text x="${cLeft.toFixed(1)}" y="36.5" dominant-baseline="central" fill="${INK}"`
    + ` font-size="${cFs}" font-weight="800" font-family="JetBrains Mono, ui-monospace, monospace">${value}</text>`
    + `<g transform="translate(${(cLeft + cNumW + 1.6).toFixed(1)} ${(36.5 - 10 * cMs).toFixed(1)}) scale(${cMs})">`
    + `${MARK.coin.replaceAll("CC", INK)}</g>`
    /* the laurel a struck coin carries under its figure */
    + `<path d="M20 47.5q12 7 24 0" fill="none" stroke="${edge}" stroke-width="1.1" opacity="0.75"/>`
    + `<path d="M23 49.6q9 4.6 18 0" fill="none" stroke="${edge}" stroke-width="0.8" opacity="0.5"/>`
    + `</svg>`;
}

/**
 * ONE PREPBILL: a note, built the way a note is built — an engraved field, a
 * rosette where the watermark goes, the emblem in a medallion, the figure
 * large with its mark, the figure again in two corners so it reads from a
 * fanned handful, a security strip and a serial number.
 *
 * The serial is worked out FROM the denomination, so the same note is always
 * the same note, and a child who notices that is right to.
 */
export function billSvg(value, { mm = 0 } = {}) {
  const w = mm || BILL_MM[value] || 19;
  const face = BILL_FACE[value] || "#e4e4e4";
  const edge = BILL_EDGE[value] || "#777";
  const serial = `PP ${String((value * 7919) % 100000).padStart(5, "0")}`;
  /* THE FIGURE AND ITS MARK ARE SET AS ONE, right-aligned in the panel and
     MEASURED — the mark sized to the figure, the figure sized to how many
     figures it has. Placed at fixed points instead, a 100 grew out through
     the edge of the note and the mark printed on top of the 1. */
  const digits = String(value).length;
  const fs = digits >= 3 ? 18 : 25;
  const numW = digits * fs * 0.6;
  const ms = (fs / 25) * 0.95;
  const markX = 137 - (16 * ms + 2.5 + numW);
  return `<svg class="mo-piece mo-piece--bill" viewBox="0 0 144 72" width="${w}mm" height="${(w / 2).toFixed(2)}mm"`
    + ` role="img" aria-label="${value} prepbill${value === 1 ? "" : "s"}">`
    + `<rect x="0.9" y="0.9" width="142.2" height="70.2" fill="${face}" stroke="${edge}" stroke-width="1.8"/>`
    + ruling(6, 13, 132, 46, edge, 9)
    + `<rect x="4.6" y="4.6" width="134.8" height="62.8" fill="none" stroke="${edge}" stroke-width="0.9" opacity="0.85"/>`
    + `<rect x="7.6" y="7.6" width="128.8" height="56.8" fill="none" stroke="${edge}" stroke-width="0.35" opacity="0.55"/>`
    /* the watermark, left, where a portrait would be */
    + rosette(36, 36, 22, edge, { petals: 13, squash: 0.34, rings: 3 })
    + `<circle cx="36" cy="36" r="13.6" fill="${face}" opacity="0.78"/>`
    + `<circle cx="36" cy="36" r="13.6" fill="none" stroke="${edge}" stroke-width="0.8"/>`
    + `<circle cx="36" cy="36" r="11.4" fill="none" stroke="${edge}" stroke-width="0.35" opacity="0.7"/>`
    + `<g transform="translate(36 36) scale(1.62)">${EMBLEM(edge)}</g>`
    /* the security strip */
    + `<path d="M86 3v66" stroke="${edge}" stroke-width="2.2" stroke-dasharray="4.5 3" opacity="0.45"/>`
    /* who stands behind it */
    + `<text x="111" y="16" text-anchor="middle" fill="${edge}" font-size="6.2" font-weight="800"`
    + ` letter-spacing="1">PREP PORTAL</text>`
    /* the figure, large, with its mark */
    + `<g transform="translate(${markX.toFixed(1)} ${(39 - 10 * ms).toFixed(1)}) scale(${ms.toFixed(3)})">`
    + `${MARK.bill.replaceAll("CC", INK)}</g>`
    + `<text x="137" y="39" text-anchor="end" dominant-baseline="central" fill="${INK}"`
    + ` font-size="${fs}" font-weight="800" font-family="JetBrains Mono, ui-monospace, monospace">${value}</text>`
    /* and again in the corners, for a hand of notes held fanned */
    + `<text x="15.5" y="13.5" text-anchor="middle" dominant-baseline="central" fill="${INK}" font-size="9" font-weight="800">${value}</text>`
    + `<text x="128" y="62" text-anchor="middle" dominant-baseline="central" fill="${INK}" font-size="9" font-weight="800">${value}</text>`
    /* the serial, as every note carries */
    + `<text x="56" y="64.5" fill="${edge}" font-size="5.4" font-weight="700"`
    + ` font-family="JetBrains Mono, ui-monospace, monospace" opacity="0.95">${serial}</text>`
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
