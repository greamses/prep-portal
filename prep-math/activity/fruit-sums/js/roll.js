/* ============================================================================
   FRUIT SUMS — rolling a number up and down
   ----------------------------------------------------------------------------
   Any answer box can be rolled like a counter as well as typed into:
     drag it UP or DOWN (finger or mouse) — one step every STEP pixels,
     the mouse WHEEL while the box has the focus (never otherwise, so the
     page still scrolls under a passing mouse),
     the ARROW keys.
   Each step rolls the figures: the old number slides out and the new one
   slides in from the side it is coming from, like an odometer.

   The new value is written into the box and an `input` event is sent, so the
   page treats a roll exactly as if the number had been typed.
   ========================================================================== */

const STEP = 14;     // pixels of drag per step
const SLOP = 6;      // a smaller movement is a tap, which focuses the box

function rollFigures(box, from, to, dir) {
  const slot = box.parentElement;
  slot.querySelector(".fs-roll")?.remove();
  const roll = document.createElement("span");
  roll.className = `fs-roll fs-roll--${dir > 0 ? "up" : "down"}`;
  roll.setAttribute("aria-hidden", "true");
  roll.style.font = getComputedStyle(box).font;
  roll.style.width = `${box.offsetWidth}px`;
  roll.style.height = `${box.offsetHeight}px`;
  roll.innerHTML = `<span class="fs-roll__old">${from}</span><span class="fs-roll__new">${to}</span>`;
  slot.appendChild(roll);
  box.classList.add("is-rolling");
  roll.addEventListener("animationend", () => {
    roll.remove();
    if (!slot.querySelector(".fs-roll")) box.classList.remove("is-rolling");
  }, { once: true });
}

/**
 * Roll a box one step. A blank box rolls up to 1 and down to 0.
 */
export function rollBox(box, dir, { min = 0, max = 9999 } = {}) {
  const was = box.value.trim();
  const n = was === "" || isNaN(+was) ? (dir > 0 ? Math.max(min, 1) : min) : Math.min(max, Math.max(min, +was + dir));
  if (String(n) === was) return;
  rollFigures(box, was, n, dir);
  box.value = String(n);
  box.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Make every box matching `sel` under `root` rollable. */
export function mountRolling(root, sel, opts = {}) {
  root.addEventListener("keydown", (e) => {
    const b = e.target.closest?.(sel);
    if (!b || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    rollBox(b, e.key === "ArrowUp" ? 1 : -1, opts);
  });

  root.addEventListener("wheel", (e) => {
    const b = e.target.closest?.(sel);
    if (!b || document.activeElement !== b || !e.deltaY) return;
    e.preventDefault();
    rollBox(b, e.deltaY < 0 ? 1 : -1, opts);
  }, { passive: false });

  root.addEventListener("pointerdown", (e) => {
    const b = e.target.closest?.(sel);
    if (!b || e.button > 0) return;
    const y0 = e.clientY;
    let done = 0;
    let dragging = false;
    const move = (ev) => {
      const dy = y0 - ev.clientY;
      if (!dragging) {
        if (Math.abs(dy) < SLOP) return;
        dragging = true;
        b.classList.add("is-dragging");
        try { b.setPointerCapture(e.pointerId); } catch { /* fine */ }
      }
      ev.preventDefault();
      const want = Math.trunc(dy / STEP);
      while (done !== want) {
        const dir = want > done ? 1 : -1;
        rollBox(b, dir, opts);
        done += dir;
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      b.classList.remove("is-dragging");
      /* a roll is not a tap: no keyboard popping up on a phone afterwards */
      if (dragging) b.blur();
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  });
}
