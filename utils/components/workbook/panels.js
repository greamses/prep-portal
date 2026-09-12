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

const ICON_CLOSE =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" '
  + 'stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';

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
  document.body.appendChild(el);

  const raise = () => { el.style.zIndex = String(10070 + (top += 1)); };
  raise();

  const close = () => {
    el.remove();
    if (onClose) onClose();
  };
  el.querySelector(".wb-panel__close").addEventListener("click", close);
  el.addEventListener("pointerdown", raise, true);

  /* dragging, by the head only — the body is being typed into */
  const head = el.querySelector(".wb-panel__head");
  let from = null;
  head.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".wb-panel__close")) return;
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
