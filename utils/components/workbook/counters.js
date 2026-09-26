/* ============================================================================
   PRINTABLE WORKBOOK — counters: a ten and a one, as many as you like
   ----------------------------------------------------------------------------
   A mat with two counters printed beside it — a circle that says 10 and a
   circle that says 1 — and on screen you take as many of each as you want and
   push them about.

   WHAT MAKES IT WORTH HAVING over the blocks. A block is a picture of ten: you
   can SEE the ten ones in a rod. A counter is a token: it says 10 and it is
   worth ten because we agreed it is, and nothing about it looks like ten. That
   is the whole step from counting to place value, and a child who has built 34
   out of three tokens and four tokens has made the agreement themselves.

   WHAT IT DOES:
     take        tap a counter in the tray, or drag it out, and you have one
     move        drag it anywhere on the mat
     join        drop one counter onto another and they become a pile, with
                 what the pile comes to written on it — this is the adding
     trade       a pile of ten ones can be swapped for a single ten (the pile
                 says so, and taps to do it)
     put back    drag a counter off the mat, or onto the bin

   IT IS NEVER MARKED. It is working, like the blocks and the dice: what the
   child reads off it goes in an answer box beside it. What IS saved is the mat
   itself, so a page picked up again is the mat the child left.

   The paper prints the tray, the empty mat and the two counters, so the same
   question can be done with real counters on a table.
   ========================================================================== */

const VALUES = [10, 1];
const FILL = { 10: "#6fb7e8", 1: "#f4c95d" };
const EDGE = { 10: "#2a6ca8", 1: "#c9922f" };

/** One counter, drawn. `n` is what it is worth; a pile says what it comes to. */
function discSvg(n, { mm = 11, pile = 0 } = {}) {
  const face = pile || n;
  const size = String(face).length > 2 ? 8 : String(face).length > 1 ? 10 : 12;
  return `<svg viewBox="0 0 32 32" width="${mm}mm" height="${mm}mm" aria-hidden="true">`
    + `<circle cx="16" cy="16" r="14" fill="${FILL[n]}" stroke="${EDGE[n]}" stroke-width="2"/>`
    + (pile ? `<circle cx="16" cy="16" r="10.5" fill="none" stroke="${EDGE[n]}" stroke-width="1" opacity="0.5"/>` : "")
    + `<text x="16" y="16" text-anchor="middle" dominant-baseline="central"`
    + ` font-family="JetBrains Mono, monospace" font-size="${size}" font-weight="700"`
    + ` fill="#14130f">${face}</text></svg>`;
}

/**
 * The mat, for the paper. On screen counters.js takes it over; printed, it is
 * a tray of counters and a space to lay them out in.
 */
export function mat({ say = "", mm = 44 } = {}) {
  return `<div class="ct-wrap" data-counters style="--ct-h:${mm}mm">`
    + `<div class="ct-tray">`
    + VALUES.map((v) => `<button type="button" class="ct-take pp-plain" data-take="${v}"`
      + ` aria-label="Take a ${v}">${discSvg(v)}</button>`).join("")
    + `<span class="ct-tray__say">${say || "take as many as you like"}</span>`
    + `</div>`
    + `<div class="ct-mat" data-mat></div>`
    + `<p class="ct-read" data-read></p>`
    + `</div>`;
}

/**
 * What a mat of counters comes to. `tens` and `ones` are COUNTS of counters —
 * how many of each are on the mat — and the total is what they are worth.
 */
export function totalOf(pieces) {
  const many = (n) => pieces.filter((p) => p.n === n).reduce((t, p) => t + p.of, 0);
  const tens = many(10);
  const ones = many(1);
  return { tens, ones, total: tens * 10 + ones };
}

/** How the mat says what it is holding, in words a child would use. */
export function sayMat(pieces) {
  const { tens, ones, total } = totalOf(pieces);
  if (!pieces.length) return "";
  const bits = [];
  if (tens) bits.push(`${tens} ten${tens === 1 ? "" : "s"}`);
  if (ones) bits.push(`${ones} one${ones === 1 ? "" : "s"}`);
  return `${bits.join(" and ")} = ${total}`;
}

/**
 * Bring a printed mat to life.
 *
 *   saved     the pieces from last time: [{ id, n, of, x, y }]
 *   onChange  (now, before) → for the page to save and to undo
 *
 * `of` is how many counters are in that pile (1 for a single one). A pile is
 * always of one KIND: you cannot put a ten and a one in the same pile, because
 * what it came to would be a number and not a count of tens.
 */
export function mountCounters(wrap, { saved = null, onChange = null } = {}) {
  const matEl = wrap.querySelector("[data-mat]");
  const read = wrap.querySelector("[data-read]");
  let pieces = Array.isArray(saved) ? saved.map((p) => ({ ...p })) : [];
  let seq = pieces.reduce((n, p) => Math.max(n, p.id + 1), 1);

  const tell = (before) => {
    if (onChange) onChange(pieces.map((p) => ({ ...p })), before);
  };
  const snapshot = () => pieces.map((p) => ({ ...p }));

  function draw() {
    matEl.innerHTML = pieces.map((p) => {
      const trade = p.n === 1 && p.of >= 10;
      return `<div class="ct-piece${trade ? " is-trade" : ""}" data-id="${p.id}"`
        + ` data-n="${p.n}" data-of="${p.of}"`
        + ` style="left:${p.x}%;top:${p.y}%" tabindex="0" role="button"`
        + ` aria-label="${p.of > 1 ? `A pile of ${p.of} ${p.n}s` : `A ${p.n}`}${trade ? ", tap to trade for a ten" : ""}">`
        + discSvg(p.n, { pile: p.of > 1 ? p.of * p.n : 0 })
        + (p.of > 1 ? `<span class="ct-piece__n">×${p.of}</span>` : "")
        + `</div>`;
    }).join("");
    read.textContent = sayMat(pieces);
    wrap.classList.toggle("is-empty", !pieces.length);
  }

  const add = (n, x = 50, y = 50) => {
    const before = snapshot();
    pieces.push({ id: seq++, n, of: 1, x, y });
    draw();
    tell(before);
  };

  /* ── taking one out of the tray ─────────────────────────────────────────*/
  wrap.querySelectorAll("[data-take]").forEach((b) => {
    b.addEventListener("click", () => {
      const n = Number(b.dataset.take);
      /* dealt into the mat in rows, so twenty taps do not land in one heap */
      const many = pieces.filter((p) => p.n === n).length;
      add(n, 8 + (many % 8) * 11, n === 10 ? 16 + Math.floor(many / 8) * 26 : 58 + Math.floor(many / 8) * 26);
    });
  });

  /* ── moving, joining, trading, throwing away ────────────────────────────*/
  let drag = null;

  const at = (e) => {
    const box = matEl.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(94, ((e.clientX - box.left) / box.width) * 100)),
      y: Math.max(0, Math.min(88, ((e.clientY - box.top) / box.height) * 100)),
    };
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
    /* TAPPED, not dragged: a pile of ten ones trades itself for a ten */
    if (!moved) {
      if (p.n === 1 && p.of >= 10) {
        p.of -= 10;
        pieces.push({ id: seq++, n: 10, of: 1, x: Math.min(92, p.x + 6), y: p.y });
        if (!p.of) pieces = pieces.filter((q) => q.id !== p.id);
        draw();
        tell(before);
      }
      return;
    }
    /* DROPPED ON ANOTHER COUNTER OF THE SAME KIND: they join into a pile */
    el.style.pointerEvents = "none";
    const under = document.elementFromPoint(e.clientX, e.clientY)?.closest(".ct-piece");
    el.style.pointerEvents = "";
    const onto = under && pieces.find((q) => q.id === Number(under.dataset.id));
    if (onto && onto.id !== p.id && onto.n === p.n) {
      onto.of += p.of;
      pieces = pieces.filter((q) => q.id !== p.id);
    } else if (!matEl.contains(e.target) && !under) {
      /* dragged off the mat: put it back in the tray */
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

  /* the keyboard: space trades a pile of ten, Delete puts a counter back */
  matEl.addEventListener("keydown", (e) => {
    const el = e.target.closest(".ct-piece");
    if (!el) return;
    const p = pieces.find((q) => q.id === Number(el.dataset.id));
    if (!p) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (p.n === 1 && p.of >= 10) {
        const before = snapshot();
        p.of -= 10;
        pieces.push({ id: seq++, n: 10, of: 1, x: Math.min(92, p.x + 6), y: p.y });
        if (!p.of) pieces = pieces.filter((q) => q.id !== p.id);
        draw();
        tell(before);
      }
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
    set(list) { pieces = Array.isArray(list) ? list.map((p) => ({ ...p })) : []; draw(); },
    clear() { pieces = []; draw(); },
    dispose() { matEl.innerHTML = ""; },
  };
}
