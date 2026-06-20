/**
 * Promo popup — "earn by referring" growth nudge, shown to everyone.
 *
 * Built from the site's own UI components: a torn-paper receipt card
 * (.pp-receipt), a handwritten sticky-note tag (.pp-sticky), a stat pill
 * (.pp-pill) and the yellow key button (.pp-btn) — so it matches the rest of
 * the site instead of looking like a generic modal. All iconography is our own
 * inline SVGs — no emoji.
 *
 * Self-contained: appears a few seconds after every home-page load, for every
 * visitor (logged in or not). It only loads on the home page, so "every load"
 * means every entry to the site's front door. CTA sends them to the partner
 * page where anyone can generate a referral code.
 */
(function () {
  const DELAY_MS = 3500;
  let shown = false; // guard against the timer + login event double-firing per page load

  // Make sure the shared component styles are present (they normally arrive via
  // the loader's @import, but link them defensively so the popup never degrades).
  function ensureComponents() {
    if (document.querySelector('link[href$="/utils/components/components.css"]')) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "/utils/components/components.css";
    document.head.appendChild(l);
  }

  function injectStyles() {
    if (document.getElementById("pp-promo-styles")) return;
    const s = document.createElement("style");
    s.id = "pp-promo-styles";
    s.textContent = `
      #pp-promo { position: fixed; inset: 0; z-index: 100000; display: flex;
        align-items: center; justify-content: center; padding: 1rem;
        background: rgba(42,39,35,.5); opacity: 0; transition: opacity .25s ease; }
      #pp-promo.show { opacity: 1; }
      #pp-promo .pp-receipt { width: min(400px, 100%);
        transform: translateY(14px) scale(.98); transition: transform .3s cubic-bezier(.16,1,.3,1); }
      #pp-promo.show .pp-receipt { transform: none; }
      .pp-promo__paper { text-align: center; padding: 2rem 1.6rem 1.6rem; font-family: var(--font-mono, ui-monospace, monospace); }
      .pp-promo__close { position: absolute; top: .6rem; right: .9rem; width: 30px; height: 30px;
        border: none; background: none; cursor: pointer; color: var(--text-secondary, #6b655c);
        font-size: 1.5rem; line-height: 1; z-index: 4; }
      .pp-promo__close:hover { color: var(--ink, #2a2723); }
      .pp-promo__tag { position: absolute; top: -14px; left: 18px; z-index: 4; font-size: .82rem;
        --pp-note-tilt: -5deg; }
      .pp-promo__coin { width: 56px; height: 56px; margin: .2rem auto .6rem; display: grid; place-items: center;
        border-radius: 50%; background: var(--surface-secondary, #f4f0e8); color: var(--accent-success, #7cc47c);
        box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.1)); }
      .pp-promo__coin svg { width: 32px; height: 32px; }
      .pp-promo__title { font-family: var(--font-display, system-ui), sans-serif; font-weight: 900;
        font-size: 1.25rem; margin: 0 0 .5rem; color: var(--ink, #2a2723); line-height: 1.1; }
      .pp-promo__text { font-size: .8rem; line-height: 1.6; color: var(--text-secondary, #6b655c); margin: 0 0 1.1rem; }
      .pp-promo__pill { margin: 0 auto 1.1rem; }
      .pp-promo__cta { width: 100%; box-sizing: border-box; }
      .pp-promo__later { display: block; margin: .8rem auto 0; background: none; border: none; cursor: pointer;
        font-family: var(--font-mono, monospace); font-size: .72rem; color: var(--text-tertiary, #9a948a); text-decoration: underline; }`;
    document.head.appendChild(s);
  }

  // Our own coin / commission glyph (matches the partner page + home doorway).
  const COIN_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="9"/><path d="M12 7v10"/>' +
      '<path d="M14.5 9.2c0-1-1.1-1.7-2.5-1.7s-2.5.7-2.5 1.7.9 1.4 2.5 1.8 2.5.8 2.5 1.8-1.1 1.7-2.5 1.7-2.5-.7-2.5-1.7"/>' +
    '</svg>';
  const ARROW_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

  function build() {
    if (shown || document.getElementById("pp-promo")) return;
    shown = true;
    ensureComponents();
    injectStyles();
    const root = document.createElement("div");
    root.id = "pp-promo";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Earn by referring friends");
    root.innerHTML =
      '<div class="pp-receipt">' +
        // tag + close sit OUTSIDE the masked paper (the mask clips descendants)
        '<span class="pp-sticky pp-sticky--c2 pp-sticky--tape pp-promo__tag">10%</span>' +
        '<button class="pp-promo__close" aria-label="Close">&times;</button>' +
        '<div class="pp-receipt__paper pp-promo__paper">' +
          '<div class="pp-promo__coin" aria-hidden="true">' + COIN_SVG + '</div>' +
          '<h2 class="pp-promo__title">Earn while they learn</h2>' +
          '<p class="pp-promo__text">Invite anyone to PrepPortal and earn <strong>10% of every subscription</strong> they pay — for their first 6 months. Students, parents, teachers, schools&mdash;everyone can join.</p>' +
          '<span class="pp-pill pp-pill--ok pp-pill--static pp-promo__pill">Free referral code</span>' +
          '<a class="pp-btn pp-promo__cta" href="/partner.html">Get my code ' + ARROW_SVG + '</a>' +
          '<button class="pp-promo__later" type="button">Maybe later</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    requestAnimationFrame(() => root.classList.add("show"));

    const close = () => { root.classList.remove("show"); setTimeout(() => root.remove(), 250); };
    root.querySelector(".pp-promo__close").onclick = close;
    root.querySelector(".pp-promo__later").onclick = close;
    root.addEventListener("click", (e) => { if (e.target === root) close(); });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
    });
  }

  // Show on every entry of the home page (this script only loads there), for
  // everyone — logged in or not. The `shown` guard keeps it to once per load.
  const start = () => setTimeout(build, DELAY_MS);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  // Also greet an in-page login immediately (e.g. signing in via the modal
  // before the timer fires); the guard prevents a duplicate.
  window.addEventListener("pp:login", build);
})();
