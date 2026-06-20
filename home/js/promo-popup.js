/**
 * Promo popup — "earn by referring" growth nudge, shown to everyone.
 *
 * Self-contained (no deps): injects its own styles + modal, appears a few
 * seconds after load, and is throttled via localStorage so it doesn't nag —
 * dismissing hides it for several days. CTA sends them to the partner page where
 * anyone can generate their own referral code.
 */
(function () {
  const KEY = "pp_promo_until";
  const SNOOZE_DAYS = 4;
  const DELAY_MS = 3500;

  try {
    const until = +localStorage.getItem(KEY) || 0;
    if (Date.now() < until) return; // still snoozed
  } catch (_) {}

  function snooze() {
    try { localStorage.setItem(KEY, String(Date.now() + SNOOZE_DAYS * 864e5)); } catch (_) {}
  }

  function injectStyles() {
    if (document.getElementById("pp-promo-styles")) return;
    const s = document.createElement("style");
    s.id = "pp-promo-styles";
    s.textContent = `
      #pp-promo { position: fixed; inset: 0; z-index: 100000; display: flex;
        align-items: center; justify-content: center; padding: 1rem;
        background: rgba(28,24,21,.55); opacity: 0; transition: opacity .25s ease; }
      #pp-promo.show { opacity: 1; }
      .pp-promo__card { position: relative; width: min(420px, 100%);
        background: var(--surface-primary, #fffdf8); color: var(--ink, #2a2723);
        border: var(--border-subtle, 1px solid rgba(42,39,35,.12)); border-radius: 18px;
        box-shadow: 0 24px 60px rgba(28,24,21,.35); padding: 1.6rem 1.4rem 1.4rem;
        transform: translateY(14px) scale(.98); transition: transform .28s cubic-bezier(.16,1,.3,1);
        font-family: var(--font-mono, ui-monospace, monospace); text-align: center; }
      #pp-promo.show .pp-promo__card { transform: none; }
      .pp-promo__close { position: absolute; top: .7rem; right: .7rem; width: 30px; height: 30px;
        border: none; border-radius: 9px; cursor: pointer; background: var(--surface-secondary, #f4f0e8);
        color: var(--ink, #2a2723); font-size: 1rem; line-height: 1; }
      .pp-promo__emoji { font-size: 2.2rem; }
      .pp-promo__title { font-size: 1.15rem; font-weight: 800; margin: .5rem 0 .1rem; }
      .pp-promo__big { color: var(--accent-success, #6db58f); }
      .pp-promo__text { font-size: .82rem; line-height: 1.55; opacity: .9; margin: .4rem 0 1.1rem; }
      .pp-promo__cta { display: inline-flex; align-items: center; gap: .4rem; width: 100%;
        justify-content: center; box-sizing: border-box; padding: .7rem 1rem; border: none;
        border-radius: 12px; cursor: pointer; font-family: inherit; font-weight: 800; font-size: .85rem;
        background: var(--accent-primary, #f4c95d); color: var(--text-on-accent, #2a2723); text-decoration: none; }
      .pp-promo__later { display: block; margin: .7rem auto 0; background: none; border: none; cursor: pointer;
        font-family: inherit; font-size: .72rem; color: var(--text-secondary, #6b655c); text-decoration: underline; }`;
    document.head.appendChild(s);
  }

  function build() {
    injectStyles();
    const root = document.createElement("div");
    root.id = "pp-promo";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Earn by referring friends");
    root.innerHTML =
      '<div class="pp-promo__card">' +
        '<button class="pp-promo__close" aria-label="Close">&times;</button>' +
        '<div class="pp-promo__emoji">🎉</div>' +
        '<h2 class="pp-promo__title">Earn while they learn</h2>' +
        '<p class="pp-promo__text">Invite anyone to PrepPortal and earn <span class="pp-promo__big">10% of every subscription</span> they pay — for their first 6 months. Students, parents, teachers, schools… everyone can join. Grab your free referral code and start sharing.</p>' +
        '<a class="pp-promo__cta" href="/partner.html">Get my referral code →</a>' +
        '<button class="pp-promo__later" type="button">Maybe later</button>' +
      '</div>';
    document.body.appendChild(root);
    requestAnimationFrame(() => root.classList.add("show"));

    const close = () => { snooze(); root.classList.remove("show"); setTimeout(() => root.remove(), 250); };
    root.querySelector(".pp-promo__close").onclick = close;
    root.querySelector(".pp-promo__later").onclick = close;
    root.querySelector(".pp-promo__cta").onclick = () => { snooze(); }; // let the link navigate
    root.addEventListener("click", (e) => { if (e.target === root) close(); });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
    });
  }

  const start = () => setTimeout(build, DELAY_MS);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
