/* ============================================================================
   MY WORKBOOKS — a workbook's setup, kept under a name, in folders
   ----------------------------------------------------------------------------
   Every printable workbook (rail.js) can save what is set on it now (the
   exercises and how many of each, the title, the paper, the code that makes
   the same questions again, the page's own choices) under a name, and open it
   again later, on this page or another. The saves live on the server
   (/api/wbfiles), one tree per workbook, worked with the site's one file
   explorer (utils/components/file-explorer.js).

   Opening a saved workbook puts its settings where its page keeps them (the
   page's localStorage key) and loads that page: the page then builds exactly
   what was saved, the same way it rebuilds what was there last time.

     openMyWorkbooks({ wb, wbName, store, settings: () => json, count: () => n, focusSave })
   ========================================================================== */

import { faceOf } from "./icons.js";
import { UI } from "/utils/components/ui-icons.js";
import { mountExplorer, BOOK_SVG } from "/utils/components/file-explorer.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const errText = (e) => String((e && e.message) || e).slice(0, 140);

/** This page's workbook key: the folder the page lives in ("maths-workbook"). */
export function workbookId() {
  const bits = location.pathname.split("/").filter(Boolean);
  const last = bits[bits.length - 1] || "";
  return (/\.html?$/.test(last) ? bits[bits.length - 2] : last) || "workbook";
}

export async function openMyWorkbooks({ wb, wbName, store, settings, count, focusSave = false }) {
  document.getElementById("wb-mw")?.remove();
  const { api } = await import("/utils/components/workbook/account.js");

  const box = document.createElement("div");
  box.id = "wb-mw";
  box.className = "wb-mw";
  box.innerHTML = `
    <div class="pp-receipt wb-mw__card" role="dialog" aria-modal="true" aria-label="My workbooks">
      <div class="pp-receipt__paper wb-mw__paper">
        <header class="wb-mw__head">
          <h2>My workbooks</h2>
          <button type="button" class="wb-mw__icon" data-mw="close"></button>
        </header>
        <form class="wb-mw__save" data-mw="save">
          <input class="pp-fx__line" data-mw="name" maxlength="100" autocomplete="off" placeholder="Name this workbook" aria-label="Name for this workbook" />
          <button type="submit" class="wb-mw__icon" data-mw="go"></button>
        </form>
        <p class="wb-mw__msg" data-mw="msg" role="status"></p>
        <div class="wb-mw__scroll"><div data-mw="fx"></div></div>
      </div>
    </div>`;
  document.body.appendChild(box);
  document.documentElement.classList.add("wb-mw-on");
  const q = (k) => box.querySelector(`[data-mw="${k}"]`);
  const msg = (t) => { q("msg").textContent = t || ""; };
  let fx = null;
  const close = () => { if (fx) fx.destroy(); box.remove(); document.documentElement.classList.remove("wb-mw-on"); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape" && !e.defaultPrevented && !(fx && fx.busy())) close(); };
  document.addEventListener("keydown", onKey);
  box.addEventListener("click", (e) => { if (e.target === box || e.target.closest('[data-mw="close"]')) close(); });
  faceOf(q("close"), UI.close(18), "Close");
  faceOf(q("go"), UI.savePlus(18), "Save this workbook in the folder that is open");

  let files = [], folders = {};
  const refresh = async () => { const r = await api("/api/wbfiles"); files = r.files || []; folders = r.folders || {}; };

  /* the workbooks there are folders for: this one, and every one something was saved from */
  function roots() {
    const map = new Map([[wb, wbName]]);
    for (const f of files) if (!map.has(f.wb)) map.set(f.wb, f.wbName || f.wb);
    for (const k of Object.keys(folders)) if (!map.has(k) && (folders[k] || []).length) map.set(k, k.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()));
    return [...map].map(([key, label]) => ({ key, label, icon: BOOK_SVG, meta: `${files.filter((f) => f.wb === key).length} saved${key === wb ? " · this one" : ""}` }))
      .sort((a, b) => (b.key === wb) - (a.key === wb) || a.label.localeCompare(b.label));
  }

  /* opening one: its settings go where its page keeps them, and that page is loaded */
  async function open(ids) {
    msg("…");
    try {
      const { file } = await api(`/api/wbfiles/${ids[0]}`);
      try { localStorage.setItem(file.store || store, file.settings || "{}"); } catch { msg("This browser will not keep the settings."); return; }
      const here = location.pathname.replace(/index\.html?$/, "");
      const there = String(file.url || "").replace(/index\.html?$/, "");
      if (!there || there === here) location.reload(); else location.href = there;
    } catch (e) { msg(errText(e)); }
  }

  /* save: into the workbook and folder that are open (a name already there is replaced, after asking) */
  q("save").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = q("name").value.trim();
    if (!name) { q("name").focus(); return; }
    const where = fx && fx.where();
    if (where && where.root !== wb) { msg(`Open ${wbName}'s folder to save this workbook.`); return; }
    const folder = where ? where.path : "";
    const same = files.find((f) => f.wb === wb && f.name.trim().toLowerCase() === name.toLowerCase());
    const goBtn = q("go");
    if (same && goBtn.dataset.armed !== "1") { goBtn.dataset.armed = "1"; msg("Replace it? Press again."); setTimeout(() => { goBtn.dataset.armed = ""; }, 5000); return; }
    goBtn.dataset.armed = ""; goBtn.disabled = true; msg("…");
    try {
      await api("/api/wbfiles", { name, wb, wbName, url: location.pathname, store, settings: settings(), folder, count: count() });
      msg(`Saved "${name}".`);
      q("name").value = "";
      await refresh();
      if (where) fx.paint(); else fx.go({ root: wb });
    } catch (err) { msg(errText(err)); }
    goBtn.disabled = false;
  });

  q("fx").innerHTML = `<p class="wb-mw__none">…</p>`;
  try { await refresh(); } catch (e) { msg(errText(e)); }
  fx = mountExplorer(q("fx"), {
    key: "wb-mw",
    top: "My workbooks",
    rootType: "Workbook",
    roots,
    files: () => files.map((f) => ({ id: f.id, root: f.wb, folder: f.folder || "", name: f.name, count: f.count, date: f.savedAt || 0 })),
    folders: () => folders,
    file: { type: "Saved workbook", icon: BOOK_SVG, word: ["question", "questions"], open: "Open this workbook" },
    empty: "Nothing saved here yet. Name this workbook above and save it, or right-click for a new folder.",
    open,
    msg,
    ops: {
      newFolder: (root, label, path) => api("/api/wbfiles/folders", { wb: root, path }),
      moveFolder: (root, label, from, to) => api("/api/wbfiles/folders/move", { wb: root, from, to }),
      deleteFolder: (root, label, path) => api("/api/wbfiles/folders", { wb: root, path, recursive: true }, "DELETE"),
      moveFiles: (ids, folder) => api("/api/wbfiles/move", { ids, folder }),
      renameFile: (id, name) => api(`/api/wbfiles/${id}/rename`, { name }),
      copyFile: (id, folder) => api(`/api/wbfiles/${id}/copy`, { folder }),
      deleteFile: (id) => api(`/api/wbfiles/${id}`, {}, "DELETE"),
      refresh,
    },
  });
  fx.go({ root: wb });
  if (focusSave) q("name").focus();
}
