/* ============================================================================
   PRINTABLE WORKBOOK — the floating sheets the sidebar opens
   ----------------------------------------------------------------------------
   Two kinds of thing come out of the sidebar. An INSTRUMENT — a ruler, a
   protractor, a set square — is laid on the paper itself, at the paper's own
   scale, and lives in the scaler (interactive.js). A SHEET — a long division,
   a table addition, a table multiplication, an algebra canvas — is working
   paper of its own: it is not measured against the figure, it sits beside the
   question while the question is answered.

   So a sheet opens in a panel: a little window over the page that can be
   dragged out of the way by its head, put away with its ×, and brought to the
   front by touching it. It is not modal — the whole point is to work the sum
   out here and type the answer in over there.
   ========================================================================== */

/* the put-away cross, in the house style (see icons.js): two filled bars */
const ICON_CLOSE =
  '<svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
  + '<rect x="10.6" y="3.6" width="2.8" height="16.8" rx="1.4" fill="var(--accent-danger)" transform="rotate(45 12 12)"/>'
  + '<rect x="10.6" y="3.6" width="2.8" height="16.8" rx="1.4" fill="var(--accent-danger)" transform="rotate(-45 12 12)"/></svg>';

import { UI } from "/utils/components/ui-icons.js";

let top = 0;

/**
 * Open a panel.
 *
 *   title     what it says on the head
 *   size      { w, h } in pixels — it is clamped to the window
 *   at        { x, y } where to put it, or none for a place near the middle
 *   onClose   called when it is put away
 *
 * → { el, body, close(), raise() }
 */
export function openPanel({ title, size = { w: 460, h: 400 }, at = null, onClose = null } = {}) {
  const el = document.createElement("section");
  el.className = "wb-panel";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", title);
  /* Dressed as every other piece of paper the site hands you: the receipt
     wrapper carries the shadow and the torn edge, the paper inside carries the
     writing. The x is a sticky note, like every other button on the bench. */
  el.innerHTML = `
    <div class="pp-receipt wb-panel__paper">
      <div class="pp-receipt__paper">
        <header class="wb-panel__head">
          <h2 class="wb-panel__title">${title}</h2>
          <button type="button" class="pp-btn pp-sticky pp-note-btn wb-panel__min"
                  aria-label="Fold the ${title.toLowerCase()} up" aria-pressed="false" data-tip="Fold it up">${UI.minimize(14)}</button>
          <button type="button" class="pp-btn pp-sticky pp-note-btn wb-panel__expand"
                  aria-label="Make the ${title.toLowerCase()} bigger" aria-pressed="false" data-tip="Make it bigger">${UI.expand(14)}</button>
          <button type="button" class="pp-btn pp-sticky pp-note-btn wb-panel__close"
                  aria-label="Put the ${title.toLowerCase()} away">${ICON_CLOSE}</button>
        </header>
        <div class="wb-panel__body"></div>
      </div>
    </div>`;

  const w = Math.min(size.w, Math.max(260, window.innerWidth - 24));
  const h = Math.min(size.h, Math.max(220, window.innerHeight - 24));
  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  /* Out where the reader is looking, and never off the edge — a panel opened
     past the side of the window is a panel nobody can drag back. */
  const spot = at || {
    x: Math.max(8, window.innerWidth - w - 28),
    y: Math.max(80, Math.min(window.innerHeight - h - 16, 120)),
  };
  el.style.left = `${Math.max(4, Math.min(window.innerWidth - w - 4, spot.x))}px`;
  el.style.top = `${Math.max(4, Math.min(window.innerHeight - h - 4, spot.y))}px`;
  // Inside whatever fills the screen, or it opens behind it and cannot be seen.
  (document.fullscreenElement || document.webkitFullscreenElement || document.body).appendChild(el);

  const raise = () => { el.style.zIndex = String(10070 + (top += 1)); };
  raise();

  const close = () => {
    el.remove();
    if (onClose) onClose();
  };
  el.querySelector(".wb-panel__close").addEventListener("click", close);
  el.addEventListener("pointerdown", raise, true);

  /* Expanding: the sheet grows to nearly the whole window, easing there, and
     goes back to the place and size it had. Dragging is off while it is big. */
  const head = el.querySelector(".wb-panel__head");
  const bigBtn = el.querySelector(".wb-panel__expand");
  let small = null;
  const bigRect = () => {
    const bw = Math.min(window.innerWidth - 24, 1500), bh = window.innerHeight - 24;
    return { left: Math.round((window.innerWidth - bw) / 2), top: 12, width: bw, height: bh };
  };
  const put = (r) => { el.style.left = `${r.left}px`; el.style.top = `${r.top}px`; el.style.width = `${r.width}px`; el.style.height = `${r.height}px`; };
  const settle = () => window.dispatchEvent(new Event("resize"));   // whatever is inside measures itself again
  /* Folding up: only the head stays, so the sheet is out of the way but still alive (nothing inside is reset). */
  const minBtn = el.querySelector(".wb-panel__min");
  let folded = null;
  const fold = (on) => {
    if (on === !!folded) return;
    if (on) { folded = el.offsetHeight; el.classList.add("is-folded"); el.style.height = "auto"; }
    else { el.classList.remove("is-folded"); el.style.height = `${folded}px`; folded = null; settle(); }
    minBtn.setAttribute("aria-pressed", String(!!folded));
    minBtn.dataset.tip = folded ? "Open it again" : "Fold it up";
    minBtn.setAttribute("aria-label", `${folded ? "Open" : "Fold up"} the ${title.toLowerCase()}`);
    minBtn.innerHTML = UI.minimize(14);
    raise();
  };
  minBtn.addEventListener("click", () => fold(!folded));
  head.addEventListener("dblclick", (e) => { if (!e.target.closest("button")) fold(!folded); });
  bigBtn.addEventListener("click", () => {
    if (folded) fold(false);
    el.classList.add("is-easing");
    if (!small) {
      small = { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
      put(bigRect());
      el.classList.add("is-expanded");
    } else {
      put(small);
      small = null;
      el.classList.remove("is-expanded");
    }
    bigBtn.setAttribute("aria-pressed", String(!!small));
    bigBtn.dataset.tip = small ? "Make it smaller" : "Make it bigger";
    bigBtn.innerHTML = small ? UI.shrink(14) : UI.expand(14);
    raise();
    setTimeout(() => { el.classList.remove("is-easing"); settle(); }, 300);
  });
  window.addEventListener("resize", () => { if (small && el.isConnected) put(bigRect()); });

  /* dragging, by the head only — the body is being typed into */
  let from = null;
  head.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".wb-panel__close, .wb-panel__expand, .wb-panel__min") || small) return;
    e.preventDefault();
    head.setPointerCapture(e.pointerId);
    from = { px: e.clientX, py: e.clientY, x: el.offsetLeft, y: el.offsetTop };
  });
  head.addEventListener("pointermove", (e) => {
    if (!from) return;
    const x = from.x + (e.clientX - from.px);
    const y = from.y + (e.clientY - from.py);
    el.style.left = `${Math.max(4 - w + 60, Math.min(window.innerWidth - 60, x))}px`;
    el.style.top = `${Math.max(4, Math.min(window.innerHeight - 40, y))}px`;
  });
  const drop = () => { from = null; };
  head.addEventListener("pointerup", drop);
  head.addEventListener("pointercancel", drop);

  return { el, body: el.querySelector(".wb-panel__body"), close, raise };
}

/* ── the stylesheet a sheet needs, fetched once ───────────────────────────── */

const sheets = new Set();

/** Put a stylesheet on the page if it is not there already. */
export function needCss(href) {
  if (sheets.has(href)) return;
  sheets.add(href);
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}
