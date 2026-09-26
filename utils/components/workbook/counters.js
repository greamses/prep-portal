/* ============================================================================
   PRINTABLE WORKBOOK — counters: a hundred, a ten and a one
   ----------------------------------------------------------------------------
   A mat with counters printed beside it — a circle that says 100, one that says
   10 and one that says 1 — and on screen you take as many of each as you want
   and push them about.

   WHAT MAKES IT WORTH HAVING over the blocks. A block is a picture of ten: you
   can SEE the ten ones in a rod. A counter is a token: it says 10 and it is
   worth ten because we agreed it is, and nothing about it looks like ten. That
   is the whole step from counting to place value, and a child who has built 34
   out of three tokens and four tokens has made the agreement themselves.

   WHAT IT DOES:
     take        tap a counter in the tray and you have one
     move        drag it anywhere on the mat
     join        drop ANY counter on ANY other and they become one pile worth
                 what the two came to — a ten dropped on four ones is a pile
                 that says 14. That is the adding, and it does not care whether
                 the two are the same kind.
     trade       tap a pile and it tidies itself the way a number does: ten of
                 its ones become one of its tens, ten of its tens become one of
                 its hundreds. It is worth the same afterwards; it is just
                 written the way we write numbers.
     put back    drag a counter right off the mat

   IT IS NEVER MARKED. It is working, like the blocks and the dice: what the
   child reads off it goes in an answer box beside it. What IS saved is the mat
   itself, so a page picked up again is the mat the child left.

   A PIECE IS { h, t, u } — how many hundreds, tens and ones are in that pile —
   and never one number, because "one ten and four ones" and "fourteen ones" are
   different things on a mat although both are worth 14, and the trade is how a
   child turns the one into the other.
   ========================================================================== */

export const KINDS = [100, 10, 1];
const FILL = { 100: "#8fd39a", 10: "#6fb7e8", 1: "#f4c95d" };
const EDGE = { 100: "#3f8f4f", 10: "#2a6ca8", 1: "#c9922f" };

/** What a pile is worth. */
export const worth = (p) => (p.h || 0) * 100 + (p.t || 0) * 10 + (p.u || 0);

/** The biggest kind in a pile — what colour it wears. */
export const kindOf = (p) => (p.h ? 100 : p.t ? 10 : 1);

/** How many counters are in it. A single counter is one. */
export const countOf = (p) => (p.h || 0) + (p.t || 0) + (p.u || 0);

/** A single counter of one kind, as a piece. */
const one = (n) => ({ h: n === 100 ? 1 : 0, t: n === 10 ? 1 : 0, u: n === 1 ? 1 : 0 });

/** One counter, drawn. The face is what it is worth. */
function discSvg(p, { mm = 11 } = {}) {
  const face = worth(p);
  const n = kindOf(p);
  const many = countOf(p) > 1;
  const size = String(face).length > 3 ? 7 : String(face).length > 2 ? 8.5
    : String(face).length > 1 ? 10 : 12;
  return `<svg viewBox="0 0 32 32" width="${mm}mm" height="${mm}mm" aria-hidden="true">`
    + `<circle cx="16" cy="16" r="14" fill="${FILL[n]}" stroke="${EDGE[n]}" stroke-width="2"/>`
    + (many ? `<circle cx="16" cy="16" r="10.5" fill="none" stroke="${EDGE[n]}" stroke-width="1" opacity="0.5"/>` : "")
    + `<text x="16" y="16" text-anchor="middle" dominant-baseline="central"`
    + ` font-family="JetBrains Mono, monospace" font-size="${size}" font-weight="700"`
    + ` fill="#14130f">${face}</text></svg>`;
}

/**
 * The mat, for the paper. On screen counters.js takes it over; printed, it is
 * a tray of counters and a space to lay them out in.
 *
 *   kinds   which counters the tray holds — [10, 1] unless the question is big
 *           enough to want hundreds
 */
export function mat({ say = "", mm = 44, kinds = [10, 1] } = {}) {
  return `<div class="ct-wrap" data-counters style="--ct-h:${mm}mm">`
    + `<div class="ct-tray">`
    + kinds.map((v) => `<button type="button" class="ct-take pp-plain" data-take="${v}"`
      + ` aria-label="Take a ${v}">${discSvg(one(v))}</button>`).join("")
    + `<span class="ct-tray__say">${say || "take as many as you like"}</span>`
    + `</div>`
    + `<div class="ct-mat" data-mat></div>`
    + `<p class="ct-read" data-read></p>`
    + `</div>`;
}

/** What a mat of counters comes to: how many of each kind, and their worth. */
export function totalOf(pieces) {
  const many = (k) => pieces.reduce((n, p) => n + (p[k] || 0), 0);
  const h = many("h");
  const t = many("t");
  const u = many("u");
  return { h, t, u, total: h * 100 + t * 10 + u };
}

/** How the mat says what it is holding, in words a child would use. */
export function sayMat(pieces) {
  if (!pieces.length) return "";
  const { h, t, u, total } = totalOf(pieces);
  const bits = [];
  if (h) bits.push(`${h} hundred${h === 1 ? "" : "s"}`);
  if (t) bits.push(`${t} ten${t === 1 ? "" : "s"}`);
  if (u) bits.push(`${u} one${u === 1 ? "" : "s"}`);
  return `${bits.join(" and ")} = ${total}`;
}

/** Can this pile be tidied? Ten ones for a ten, or ten tens for a hundred. */
export const canTrade = (p) => (p.u || 0) >= 10 || (p.t || 0) >= 10;

/** Tidy it — one trade at a time, lowest place first, the way a child does it. */
export function trade(p) {
  if ((p.u || 0) >= 10) return { ...p, u: p.u - 10, t: (p.t || 0) + 1 };
  if ((p.t || 0) >= 10) return { ...p, t: p.t - 10, h: (p.h || 0) + 1 };
  return { ...p };
}

/**
 * Bring a printed mat to life.
 *
 *   saved     the pieces from last time: [{ id, h, t, u, x, y }]
 *   onChange  (now, before) → for the page to save and to undo
 */
export function mountCounters(wrap, { saved = null, onChange = null } = {}) {
  const matEl = wrap.querySelector("[data-mat]");
  const read = wrap.querySelector("[data-read]");
  /* a mat saved by the older one said { n, of }: one kind, so many of them */
  const asPiece = (p) => (p.n
    ? { id: p.id, h: 0, t: p.n === 10 ? p.of : 0, u: p.n === 1 ? p.of : 0, x: p.x, y: p.y }
    : { id: p.id, h: p.h || 0, t: p.t || 0, u: p.u || 0, x: p.x, y: p.y });
  let pieces = Array.isArray(saved) ? saved.map(asPiece) : [];
  let seq = pieces.reduce((n, p) => Math.max(n, p.id + 1), 1);

  const snapshot = () => pieces.map((p) => ({ ...p }));
  const tell = (before) => { if (onChange) onChange(snapshot(), before); };

  function draw() {
    matEl.innerHTML = pieces.map((p) => {
      const tidy = canTrade(p);
      const many = countOf(p) > 1;
      return `<div class="ct-piece${tidy ? " is-trade" : ""}" data-id="${p.id}"`
        + ` data-n="${kindOf(p)}" data-face="${worth(p)}"`
        + ` style="left:${p.x}%;top:${p.y}%" tabindex="0" role="button"`
        + ` aria-label="${sayMat([p])}${tidy ? ", tap to trade ten of them for one of the next" : ""}">`
        + discSvg(p)
        + (many ? `<span class="ct-piece__n">${countOf(p)}</span>` : "")
        + `</div>`;
    }).join("");
    read.textContent = sayMat(pieces);
    wrap.classList.toggle("is-empty", !pieces.length);
  }

  const add = (n, x, y) => {
    const before = snapshot();
    pieces.push({ id: seq++, ...one(n), x, y });
    draw();
    tell(before);
  };

  /* ── taking one out of the tray ─────────────────────────────────────────*/
  wrap.querySelectorAll("[data-take]").forEach((b) => {
    b.addEventListener("click", () => {
      const n = Number(b.dataset.take);
      /* dealt into a row of its own kind, so twenty taps do not land in a heap */
      const row = KINDS.indexOf(n);
      const many = pieces.filter((p) => kindOf(p) === n && countOf(p) === 1).length;
      add(n, 6 + (many % 8) * 11, 4 + row * 28 + Math.floor(many / 8) * 12);
    });
  });

  /* ── moving, joining, trading, putting back ─────────────────────────────*/
  let drag = null;

  const at = (e) => {
    const box = matEl.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(94, ((e.clientX - box.left) / box.width) * 100)),
      y: Math.max(0, Math.min(86, ((e.clientY - box.top) / box.height) * 100)),
    };
  };

  const tidyUp = (p, before) => {
    if (!canTrade(p)) return false;
    Object.assign(p, trade(p));
    draw();
    tell(before);
    return true;
  };

  matEl.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(".ct-piece");
    if (!el) return;
    const p = pieces.find((q) => q.id === Number(el.dataset.id));
    if (!p) return;
    drag = { p, el, before: snapshot(), moved: false };
    el.classList.add("is-held");
    /* a pointer id that is no longer live (a flaky touch, a synthetic event)
       throws here, and a throw in a pointerdown handler loses the drag */
    try { el.setPointerCapture?.(e.pointerId); } catch { /* it moves without it */ }
    e.preventDefault();
  });

  matEl.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const { x, y } = at(e);
    drag.moved = true;
    drag.p.x = x;
    drag.p.y = y;
    drag.el.style.left = `${x}%`;
    drag.el.style.top = `${y}%`;
  });

  const drop = (e) => {
    if (!drag) return;
    const { p, el, before, moved } = drag;
    drag = null;
    el.classList.remove("is-held");
    /* TAPPED, not dragged: the pile tidies itself */
    if (!moved) { tidyUp(p, before); return; }
    /* DROPPED ON ANOTHER: they become one pile, whatever kinds they are — a
       ten dropped on four ones is a pile that says 14 */
    el.style.pointerEvents = "none";
    const under = document.elementFromPoint(e.clientX, e.clientY)?.closest(".ct-piece");
    el.style.pointerEvents = "";
    const onto = under && pieces.find((q) => q.id === Number(under.dataset.id));
    if (onto && onto.id !== p.id) {
      onto.h = (onto.h || 0) + (p.h || 0);
      onto.t = (onto.t || 0) + (p.t || 0);
      onto.u = (onto.u || 0) + (p.u || 0);
      pieces = pieces.filter((q) => q.id !== p.id);
    } else if (!under) {
      /* dragged right off the mat: it goes back in the tray */
      const box = matEl.getBoundingClientRect();
      const out = e.clientX < box.left - 8 || e.clientX > box.right + 8
        || e.clientY < box.top - 8 || e.clientY > box.bottom + 8;
      if (out) pieces = pieces.filter((q) => q.id !== p.id);
    }
    draw();
    tell(before);
  };
  matEl.addEventListener("pointerup", drop);
  matEl.addEventListener("pointercancel", drop);

  /* the keyboard: space trades, Delete puts a counter back in the tray */
  matEl.addEventListener("keydown", (e) => {
    const el = e.target.closest(".ct-piece");
    if (!el) return;
    const p = pieces.find((q) => q.id === Number(el.dataset.id));
    if (!p) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      tidyUp(p, snapshot());
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      const before = snapshot();
      pieces = pieces.filter((q) => q.id !== p.id);
      draw();
      tell(before);
    }
  });

  draw();

  return {
    get pieces() { return snapshot(); },
    total: () => totalOf(pieces).total,
    set(list) { pieces = Array.isArray(list) ? list.map(asPiece) : []; draw(); },
    clear() { pieces = []; draw(); },
    dispose() { matEl.innerHTML = ""; },
  };
}
