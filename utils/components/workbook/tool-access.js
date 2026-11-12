/* ============================================================================
   WHICH TOOLS STUDENTS SEE — one list for every side rail on the site
   ----------------------------------------------------------------------------
   The admin ticks tools on and off (a key at the foot of any rail); the
   choice is one Firestore doc, config/tools { hidden: [toolId…] }, read by
   every rail: the shared tools rail (toolbar.js, on PrepBoard, the Toy Shop,
   the studios…) and the workbook's own rail (interactive.js). A tool id is
   the same on both ("calculator", "column", "barmodel"…), so one tick hides
   it everywhere.

   Students never see a hidden tool. The admin always sees every tool (so it
   can be tried before it is opened), with the hidden ones marked.
   ========================================================================== */

import { getDoc, saveDoc, invalidateDoc } from "/utils/data-service.js";
import { auth } from "/firebase-init.js";
import { isAdminUser } from "/utils/features.js";

const PATH = "config/tools";

/** { hidden: Set<id>, admin: boolean } — the hidden list, and whether this is the admin. */
export async function toolAccess() {
  try { if (auth?.authStateReady) await Promise.race([auth.authStateReady(), new Promise((r) => setTimeout(r, 3000))]); } catch { /* signed out */ }
  const admin = isAdminUser({ email: auth?.currentUser?.email || null });
  let hidden = [];
  try { hidden = (await getDoc(PATH, { ttl: 5 * 60 * 1000 }))?.hidden || []; } catch { /* none hidden */ }
  return { hidden: new Set(hidden), admin };
}

async function saveHidden(set) {
  await saveDoc(PATH, { hidden: [...set].sort(), updatedAt: Date.now() }, { merge: false });
  invalidateDoc(PATH);
}

const GEAR = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z" fill="#fff"/><path d="M10.4 2.6h3.2l.5 2.6 1.8.8 2.2-1.5 2.3 2.3-1.5 2.2.8 1.8 2.6.5v3.2l-2.6.5-.8 1.8 1.5 2.2-2.3 2.3-2.2-1.5-1.8.8-.5 2.6h-3.2l-.5-2.6-1.8-.8-2.2 1.5-2.3-2.3 1.5-2.2-.8-1.8-2.6-.5v-3.2l2.6-.5.8-1.8-1.5-2.2 2.3-2.3 2.2 1.5 1.8-.8z" fill="var(--accent-secondary, #6fb7e8)"/><circle cx="12" cy="12" r="3" fill="#fff"/></svg>`;

/**
 * The admin's key on a rail: opens the list of every tool (with a tick for
 * each one students may see). `tools` = [{ id, label }]; `onChange(hidden)`
 * is told after a save so the rail can mark the keys again.
 */
export function adminKey(rail, { tools, hidden, onChange = () => {}, side = "right", className = "" }) {
  const key = document.createElement("button");
  key.type = "button";
  key.className = `pp-tool-admin ${className}`.trim();
  key.innerHTML = GEAR;
  key.setAttribute("aria-label", "Choose the tools students see");
  key.dataset.tip = "Choose the tools students see (admin)";
  key.dataset.tipSide = side;
  rail.appendChild(key);

  const pop = document.createElement("div");
  pop.className = "pp-tool-access pp-receipt";
  pop.hidden = true;
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "Tools students can see");
  document.body.appendChild(pop);

  const seen = new Set();
  const list = tools.filter((t) => t && t.id && !seen.has(t.id) && seen.add(t.id));
  const draw = () => {
    pop.innerHTML = `<div class="pp-receipt__paper pp-tool-access__paper">
      <p class="pp-tool-access__title">Tools students can see</p>
      <p class="pp-tool-access__note">On every side rail on the site. You always see them all.</p>
      <div class="pp-tool-access__list">${list.map((t) => `
        <label class="pp-tool-access__row"><input type="checkbox" data-id="${t.id}" ${hidden.has(t.id) ? "" : "checked"}/><span>${t.label}</span></label>`).join("")}
      </div>
      <div class="pp-tool-access__acts">
        <button type="button" class="pp-btn pp-worded" data-act="all">All on</button>
        <button type="button" class="pp-btn pp-worded" data-act="save">Save</button>
      </div>
      <p class="pp-tool-access__said" role="status"></p>
    </div>`;
  };
  const place = () => {
    const r = key.getBoundingClientRect();
    pop.style.top = `${Math.max(12, Math.min(window.innerHeight - pop.offsetHeight - 12, r.top - 40))}px`;
    pop.style.left = side === "right" ? `${r.right + 12}px` : `${Math.max(12, r.left - pop.offsetWidth - 12)}px`;
  };
  key.addEventListener("click", () => {
    if (!pop.hidden) { pop.hidden = true; return; }
    draw();
    pop.hidden = false;
    place();
  });
  pop.addEventListener("click", async (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "all") { pop.querySelectorAll("input[data-id]").forEach((c) => { c.checked = true; }); return; }
    if (act !== "save") return;
    const next = new Set();
    pop.querySelectorAll("input[data-id]").forEach((c) => { if (!c.checked) next.add(c.dataset.id); });
    const said = pop.querySelector(".pp-tool-access__said");
    try {
      said.textContent = "Saving…";
      await saveHidden(next);
      hidden.clear(); next.forEach((id) => hidden.add(id));
      said.textContent = "Saved. Students see these tools from their next page load.";
      onChange(hidden);
    } catch (err) {
      said.textContent = "Couldn't save: " + (err?.message || "try again");
    }
  });
  document.addEventListener("pointerdown", (e) => {
    if (!pop.hidden && !pop.contains(e.target) && !key.contains(e.target)) pop.hidden = true;
  });
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
.pp-tool-access { position: fixed; z-index: 60; width: min(19rem, calc(100vw - 24px)); }
.pp-tool-access[hidden] { display: none; }
.pp-tool-access__paper { padding: 1rem 1.1rem 1.2rem; }
.pp-tool-access__title { margin: 0; font-family: var(--font-display, Unbounded, sans-serif); font-size: 0.95rem; color: #2a2723; }
.pp-tool-access__note { margin: 0.2rem 0 0.6rem; font-size: 0.75rem; color: #6b655c; }
.pp-tool-access__list { max-height: min(52vh, 24rem); overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.pp-tool-access__row { display: flex; gap: 0.5rem; align-items: center; font-family: var(--font-mono, monospace); font-size: 0.8rem; color: #2a2723; padding: 3px 0; cursor: pointer; }
.pp-tool-access__acts { display: flex; gap: 0.6rem; margin-top: 0.7rem; }
.pp-tool-access__said { margin: 0.5rem 0 0; font-size: 0.75rem; color: #2f8f4e; min-height: 1em; }
/* the admin sees a hidden tool, struck through, so it can still be tried */
.is-off-for-students { opacity: 0.4; outline: 1px dashed rgba(194,84,84,0.7); outline-offset: 2px; }`;
  document.head.appendChild(css);
}
