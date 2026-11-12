/* ============================================================================
   WHICH TOOLS STUDENTS SEE — every rail carries EVERY tool; the admin decides
   ----------------------------------------------------------------------------
   Every side rail on the site (the shared tools rail, toolbar.js, and the
   workbook's rail, interactive.js) is built with the complete set of tools.
   The admin sees them all, always. Students see:

     - on a page the admin has chosen for: exactly the tools ticked for it;
     - on any other page: the tools that page was made with (its own list),
     - and never a tool the admin has switched off on EVERY page.

   One Firestore doc, config/tools:
     { hidden: [id…],                 // off on every page
       pages:  { "<page>": [id…] } }  // the tools students see on that page

   The admin's gear key on a rail opens the rail's own icons, ticked when
   students see them; "This page" or "Every page" says which list is changed.
   ========================================================================== */

import { getDoc, saveDoc, invalidateDoc } from "/utils/data-service.js";
import { auth } from "/firebase-init.js";
import { isAdminUser } from "/utils/features.js";

const PATH = "config/tools";

/** The page's key in the list: its path, without the slashes Firestore dislikes in a field name. */
export const pageKey = (path = location.pathname) => String(path || "/").replace(/index\.html$/, "").replace(/\//g, "|") || "|";

/** Is the signed-in user the admin, if it can be told at once (for building a rail synchronously)? */
export const adminNow = () => isAdminUser({ email: auth?.currentUser?.email || null });

/** { admin, cfg: { hidden:Set, pages:{} } } */
export async function toolAccess() {
  try { if (auth?.authStateReady) await Promise.race([auth.authStateReady(), new Promise((r) => setTimeout(r, 3000))]); } catch { /* signed out */ }
  const admin = isAdminUser({ email: auth?.currentUser?.email || null });
  let doc = null;
  try { doc = await getDoc(PATH, { ttl: 5 * 60 * 1000 }); } catch { /* nothing chosen yet */ }
  return { admin, cfg: { hidden: new Set(doc?.hidden || []), pages: { ...(doc?.pages || {}) } } };
}

/** Does a student see this tool on this page? */
export function studentSees(cfg, id, { page = pageKey(), pageDefault = [] } = {}) {
  if (cfg.hidden.has(id)) return false;
  const chosen = cfg.pages[page];
  return Array.isArray(chosen) ? chosen.includes(id) : pageDefault.includes(id);
}

async function save(cfg) {
  await saveDoc(PATH, { hidden: [...cfg.hidden].sort(), pages: cfg.pages, updatedAt: Date.now() }, { merge: false });
  invalidateDoc(PATH);
}

const GEAR = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M10.4 2.6h3.2l.5 2.6 1.8.8 2.2-1.5 2.3 2.3-1.5 2.2.8 1.8 2.6.5v3.2l-2.6.5-.8 1.8 1.5 2.2-2.3 2.3-2.2-1.5-1.8.8-.5 2.6h-3.2l-.5-2.6-1.8-.8-2.2 1.5-2.3-2.3 1.5-2.2-.8-1.8-2.6-.5v-3.2l2.6-.5.8-1.8-1.5-2.2 2.3-2.3 2.2 1.5 1.8-.8z" fill="var(--accent-secondary, #6fb7e8)"/><circle cx="12" cy="12" r="3" fill="#fff"/></svg>`;

/**
 * THE ADMIN CHOOSES ON THE RAIL ITSELF. A key at the foot of the rail turns
 * checkboxes on over the rail's own icons (and over the ones in its folded
 * groups); tapping an icon then ticks or unticks it for students on THIS page
 * instead of opening the tool, and is saved at once. The key again puts the
 * checkboxes away.
 *   keys()  → every key element of this rail (in the rail and in its group receipts)
 *   idOf(k) → the tool id of a key (or null for a key that is not a tool)
 */
export function adminChooser(rail, { keys, idOf, cfg, pageDefault = [], onChange = () => {}, side = "right" }) {
  const page = pageKey();
  const key = document.createElement("button");
  key.type = "button";
  key.className = "pp-tool-admin";
  key.innerHTML = GEAR;
  key.setAttribute("aria-pressed", "false");
  key.setAttribute("aria-label", "Choose the tools students see");
  key.dataset.tip = "Choose the tools students see on this page (admin)";
  key.dataset.tipSide = side;
  rail.appendChild(key);

  let choosing = false;
  let timer = null;
  const sees = (id) => studentSees(cfg, id, { page, pageDefault });
  const paint = () => keys().forEach((k) => {
    const id = idOf(k);
    if (!id) return;
    k.classList.toggle("pp-choose", choosing);
    k.classList.toggle("pp-choose--on", choosing && sees(id));
  });
  const saveSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try { await save(cfg); key.dataset.tip = "Saved. Tap to put the checkboxes away"; }
      catch (err) { key.dataset.tip = "Couldn't save: " + (err?.message || "try again"); }
      onChange();
    }, 500);
  };
  key.addEventListener("click", () => {
    choosing = !choosing;
    key.setAttribute("aria-pressed", String(choosing));
    key.dataset.tip = choosing ? "Tap icons to tick the ones students see. Tap here when done" : "Choose the tools students see on this page (admin)";
    document.body.classList.toggle("pp-choosing-tools", choosing);
    paint();
    if (!choosing) onChange();
  });
  /* while choosing, a tap on a tool ticks it rather than opening it */
  document.addEventListener("click", (e) => {
    if (!choosing) return;
    const k = keys().find((n) => n.contains(e.target));
    const id = k && idOf(k);
    if (!id) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const list = Array.isArray(cfg.pages[page]) ? cfg.pages[page] : keys().map(idOf).filter((x) => x && sees(x));
    const now = new Set(list);
    if (now.has(id)) now.delete(id); else now.add(id);
    cfg.hidden.delete(id); // ticking a tool on this page also undoes an "every page" switch-off
    cfg.pages[page] = [...now];
    paint();
    saveSoon();
  }, true);
  return key;
}

/* the dress, once per page */
let dressed = false;
export function dressAccess() {
  if (dressed) return;
  dressed = true;
  const css = document.createElement("style");
  css.textContent = `
.pp-tool-admin { display: grid; place-items: center; width: 2.3rem; height: 2.3rem; padding: 0; margin-top: 0.4rem;
  border: 1px dashed rgba(42,39,35,0.35); background: #fffdf8; cursor: pointer; }
.pp-tool-access { position: fixed; z-index: 60; width: min(19.5rem, calc(100vw - 24px)); }
.pp-tool-access[hidden] { display: none; }
.pp-tool-access__paper { padding: 1rem 1.1rem 1.2rem; }
.pp-tool-access__title { margin: 0; font-family: var(--font-display, Unbounded, sans-serif); font-size: 0.95rem; color: #2a2723; }
.pp-tool-access__scope { display: flex; gap: 0.5rem; margin: 0.6rem 0 0.2rem; }
.pp-tool-access__scope .is-picked { outline: 2px solid #2a2723; outline-offset: 2px; }
.pp-tool-access__note { margin: 0.3rem 0 0.6rem; font-size: 0.75rem; color: #6b655c; }
.pp-tool-access__grid { max-height: min(48vh, 22rem); overflow-y: auto; display: grid; grid-template-columns: repeat(5, 2.4rem); gap: 0.55rem; padding: 8px 6px; }
.pp-tool-access__ico { position: relative; display: grid; place-items: center; width: 2.4rem; height: 2.4rem; padding: 0; cursor: pointer;
  background: #fffdf8; border: 1px solid rgba(42,39,35,0.25); opacity: 0.4; }
.pp-tool-access__ico.is-on { opacity: 1; }
.pp-tool-access__ico.is-off-everywhere { outline: 1px dashed rgba(194,84,84,0.8); outline-offset: 2px; }
.pp-tool-access__ico.is-on::after { content: ""; position: absolute; right: -6px; top: -6px; width: 14px; height: 14px; border-radius: 50%;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='8' fill='%232f8f4e'/%3E%3Cpath d='M4.4 8.3l2.4 2.4 4.8-5' fill='none' stroke='%23fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / 100% 100% no-repeat; }
.pp-tool-access__acts { display: flex; gap: 0.6rem; margin-top: 0.7rem; }
.pp-tool-access__said { margin: 0.5rem 0 0; font-size: 0.75rem; color: #2f8f4e; min-height: 1em; }
/* the checkboxes, ON the icons while the admin is choosing */
.pp-choose { position: relative; opacity: 1 !important; outline: none !important; }
.pp-choose::before { content: ""; position: absolute; right: -6px; top: -6px; width: 15px; height: 15px; z-index: 2;
  background: #fff; border: 2px solid #2a2723; box-sizing: border-box; }
.pp-choose.pp-choose--on::before { background: #2f8f4e url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 8.4l2.9 2.9 6-6.3' fill='none' stroke='%23fff' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / 100% 100% no-repeat; border-color: #2f8f4e; }
.pp-choose::after { display: none !important; } /* the open-tool tick steps aside for the checkbox */
.pp-tool-admin[aria-pressed="true"] { border-style: solid; border-color: #2a2723; background: #fff3a8; }
/* the admin sees a tool students do not, faded with a dashed outline, so it can still be tried */
.is-off-for-students { opacity: 0.4; outline: 1px dashed rgba(194,84,84,0.7); outline-offset: 2px; }`;
  document.head.appendChild(css);
}
