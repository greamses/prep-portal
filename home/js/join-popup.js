/**
 * Join popup: the home page's sign-up card, for visitors who are not signed in.
 *
 * The same small receipt as the "Refer & earn 10%" card (promo-popup.js): a torn-paper .pp-receipt, a taped
 * sticky-note tag, our own icon, one line and one sticky-note button. It slides up in the lower RIGHT corner
 * (the 10% card has the left), never blocks the page, and opens the site's own sign-up form. Closing it keeps
 * it away for a day. Anyone signed in never sees it, and it goes the moment someone signs in.
 */
import { auth } from "/firebase-init.js";

const DELAY_MS = 2500;
const SNOOZE_KEY = "pp-join-snoozed";
const DAY = 24 * 60 * 60 * 1000;

const BOOK_SVG =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
  '<path d="M2.4 4.4A1.4 1.4 0 0 1 3.8 3H9a3 3 0 0 1 3 3v15a2.4 2.4 0 0 0-2.4-2.4H3.8a1.4 1.4 0 0 1-1.4-1.4z" fill="var(--accent-secondary)"/>' +
  '<path d="M21.6 4.4A1.4 1.4 0 0 0 20.2 3H15a3 3 0 0 0-3 3v15a2.4 2.4 0 0 1 2.4-2.4h5.8a1.4 1.4 0 0 0 1.4-1.4z" fill="var(--accent-primary)"/></svg>';
const ARROW_SVG =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="rotate(90 12 12)"><rect x="10.6" y="9" width="2.8" height="12" rx="1.4" fill="var(--accent-secondary)"/><path d="M12 2.6 19.4 11H4.6z" fill="var(--accent-danger)"/></g></svg>';

function snoozed() {
  try { return Date.now() - Number(localStorage.getItem(SNOOZE_KEY) || 0) < DAY; } catch { return false; }
}

function injectStyles() {
  if (document.getElementById("pp-join-styles")) return;
  const s = document.createElement("style");
  s.id = "pp-join-styles";
  s.textContent = `
    #pp-join { position: fixed; right: 18px; bottom: 18px; z-index: 100000;
      opacity: 0; transform: translateY(14px) scale(.98); pointer-events: none;
      transition: opacity .25s ease, transform .3s cubic-bezier(.16,1,.3,1); }
    #pp-join.show { opacity: 1; transform: none; pointer-events: auto; }
    body:has(.nav-links.open, .nav-links > li.open, .user-menu.open, .log-in.active) #pp-join.show { opacity: 0; pointer-events: none; }
    #pp-join .pp-receipt { width: min(240px, calc(100vw - 36px)); }
    .pp-join__paper { text-align: center; padding: 1.1rem 1rem .95rem; font-family: var(--font-mono, ui-monospace, monospace); }
    .pp-join__close { position: absolute; top: .35rem; right: .5rem; width: 26px; height: 26px; border: none; background: none;
      cursor: pointer; color: var(--text-secondary, #6b655c); font-size: 1.25rem; line-height: 1; z-index: 4; }
    .pp-join__close:hover { color: var(--ink, #2a2723); }
    .pp-join__tag { position: absolute; top: -12px; left: 14px; z-index: 4; font-size: .72rem; --pp-note-tilt: -5deg; }
    .pp-join__ico { width: 40px; height: 40px; margin: .1rem auto .5rem; display: grid; place-items: center; border-radius: 50%;
      background: var(--surface-secondary, #f4f0e8); box-shadow: var(--shadow-sm, 0 2px 5px rgba(42,39,35,.1)); }
    .pp-join__ico svg { width: 22px; height: 22px; }
    .pp-join__title { font-family: var(--font-display, system-ui), sans-serif; font-weight: 900; font-size: 1rem; margin: 0 0 .35rem;
      color: var(--ink, #2a2723); line-height: 1.15; }
    .pp-join__text { font-size: .72rem; line-height: 1.5; color: var(--text-secondary, #6b655c); margin: 0 0 .8rem; }
    .pp-join__cta { display: inline-flex; width: auto; box-sizing: border-box; font-size: .78rem; padding: .5rem .95rem .55rem; cursor: pointer; }
    .pp-join__fine { margin: .55rem 0 0; font-size: .62rem; color: var(--text-tertiary, #8a8174); }
    @media print { #pp-join { display: none !important; } }`;
  document.head.appendChild(s);
}

let shown = false;
function build() {
  if (shown || snoozed() || document.getElementById("pp-join")) return;
  shown = true;
  injectStyles();
  const root = document.createElement("div");
  root.id = "pp-join";
  root.setAttribute("role", "complementary");
  root.setAttribute("aria-label", "Create a free account");
  root.innerHTML =
    '<div class="pp-receipt">' +
      '<span class="pp-sticky pp-sticky--c1 pp-sticky--tape pp-join__tag">Free</span>' +
      '<button class="pp-join__close" type="button" aria-label="Close">&times;</button>' +
      '<div class="pp-receipt__paper pp-join__paper">' +
        '<div class="pp-join__ico" aria-hidden="true">' + BOOK_SVG + '</div>' +
        '<h2 class="pp-join__title">Your free Prep Portal desk</h2>' +
        '<p class="pp-join__text">CBT practice papers, maths games and workbooks for Grades 1 to 12.</p>' +
        '<button type="button" class="pp-sticky pp-sticky--tape pp-note-btn pp-sticky--c0 pp-join__cta">Create my free account ' + ARROW_SVG + '</button>' +
        '<p class="pp-join__fine">Already have one? <a href="#" data-join-login>Log in</a></p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(root);
  requestAnimationFrame(() => root.classList.add("show"));

  const close = (snooze) => {
    if (snooze) { try { localStorage.setItem(SNOOZE_KEY, String(Date.now())); } catch { /* shown again next visit */ } }
    root.classList.remove("show");
    setTimeout(() => root.remove(), 250);
    document.removeEventListener("keydown", esc);
  };
  const esc = (e) => { if (e.key === "Escape" && !document.querySelector(".log-in.active")) close(true); };
  document.addEventListener("keydown", esc);
  root.querySelector(".pp-join__close").onclick = () => close(true);
  const open = (mode) => { if (window.openAuthModal) window.openAuthModal(mode); };
  root.querySelector(".pp-join__cta").onclick = () => open("signup");
  root.querySelector("[data-join-login]").onclick = (e) => { e.preventDefault(); open("login"); };
  /* signed in (in the modal or anywhere): the card has done its job */
  window.addEventListener("pp:login", () => close(false), { once: true });
}

/* only for a visitor who is NOT signed in: wait for Firebase to say who is here (a returning account is
   restored a moment after the page loads) before deciding */
let decided = false;
auth.onAuthStateChanged((user) => {
  if (user) { document.getElementById("pp-join")?.remove(); decided = true; return; }
  if (decided) return;
  decided = true;
  setTimeout(() => { if (!auth.currentUser) build(); }, DELAY_MS);
});
