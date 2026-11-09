/* ============================================================================
   THE FILE EXPLORER — one for the whole site
   ----------------------------------------------------------------------------
   Folders and files the way a computer's file explorer shows them, for any
   page that keeps named things for a teacher: the Paper Test Builder's
   question sets, the workbooks' saved workbooks.

     • four views (large icons, medium icons, list, details), sorted by name,
       items or date, remembered on this machine;
     • roots (a subject, a workbook) and folders inside them, as deep as wanted;
     • a path bar to climb back up, and a search through the folders below;
     • click to select, Ctrl/Shift-click for more, double-click (or Enter) to
       open; one tap opens on a touch screen;
     • drag files and folders onto a folder, or onto the path bar, to move them;
     • right-click (a long press on a phone) for Open, Cut, Copy, Paste,
       Rename, Delete, New folder, View, Sort, Select all and Refresh;
     • the keys: Enter, F2, Delete, Ctrl+A / X / C / V, Backspace, arrows.

   The page owns the data; this draws it and asks the page to change it:

     const fx = mountExplorer(host, {
       key        localStorage prefix for the view and sort ("xm-qb")
       top        the name of the top level ("Question bank")
       roots()    [{ key, label, icon, meta }]                 the top level
       files()    [{ id, root, folder, name, count, date }]    every file
       folders()  { [rootKey]: [path, …] }                     every folder
       file       { type: "Question set", icon: svg, word: ["question", "questions"], open: "Load into the editor" }
       open(ids)                 open these files
       ops: { newFolder(root, label, path), moveFolder(root, label, from, to), deleteFolder(root, label, path),
              moveFiles(ids, folder), renameFile(id, name) → { id }, copyFile(id, folder), deleteFile(id), refresh() }
       msg(text)                 a line to show the teacher
       onNavigate(where)         where = null (the top) or { root, label, path }
       empty                     what an empty folder says
     })
     fx.where()     → null | { root, label, path }
     fx.go(where)   "~" (the top) | { root } | { path }
     fx.paint()     after the page's data changed
     fx.destroy()
   ========================================================================== */

import { faceOf } from "/utils/components/workbook/icons.js";
import { UI } from "/utils/components/ui-icons.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const parentOf = (p) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "");
const leaf = (p) => p.slice(p.lastIndexOf("/") + 1);
const join = (a, b) => (a ? `${a}/${b}` : b);
const errText = (e) => String((e && e.message) || e).slice(0, 140);
const when = (ms) => (ms ? new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");

/* the pictures: a folder (tab, body), and a file (a sheet) */
export const FOLDER_SVG = `<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M2 6h16l4 5h24v27H2z" fill="#e8b84a"/><path d="M2 14h44v24H2z" fill="#f4cf6b"/><path d="M2 14h44v3H2z" fill="#fff" opacity=".35"/></svg>`;
export const SHEET_SVG = `<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M6 2h20l10 10v34H6z" fill="#fffdf6" stroke="#9fb8d8" stroke-width="2"/><path d="M26 2v10h10" fill="#dce8f6" stroke="#9fb8d8" stroke-width="2" stroke-linejoin="round"/><path d="M12 22h18M12 28h18M12 34h12" stroke="#6fa8dc" stroke-width="2.4" stroke-linecap="round"/></svg>`;
export const BOOK_SVG = `<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M6 4h26a2 2 0 0 1 2 2v38H8a2 2 0 0 1-2-2z" fill="#cfe6ff" stroke="#6fa8dc" stroke-width="2"/><path d="M6 38a4 4 0 0 1 4-4h24" fill="none" stroke="#6fa8dc" stroke-width="2"/><path d="M12 12h16M12 18h16M12 24h10" stroke="#6fa8dc" stroke-width="2.4" stroke-linecap="round"/></svg>`;

const VIEWS = [["large", "Large icons"], ["medium", "Medium icons"], ["list", "List"], ["details", "Details"]];
const SORTS = [["name", "Name"], ["date", "Date modified"], ["count", "Items"]];
const store = {
  get(k, d) { try { return localStorage.getItem(k) || d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* not kept */ } },
};
let cssIn = false;
function needCss() {
  if (cssIn || document.querySelector('link[href*="/utils/components/file-explorer.css"]')) { cssIn = true; return; }
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = "/utils/components/file-explorer.css";
  document.head.appendChild(l);
  cssIn = true;
}

export function mountExplorer(host, a) {
  needCss();
  const K = a.key || "fx";
  const word = (n) => `${n} ${n === 1 ? a.file.word[0] : a.file.word[1]}`;
  const msg = (t) => (a.msg ? a.msg(t) : 0);
  let cur = null;               // null (the top), or { root, label, path }
  let view = store.get(`${K}-view`, "large");
  let [sortBy, sortDir] = store.get(`${K}-sort`, "name:asc").split(":");
  let query = "";
  let sel = new Set();          // selected keys: "f:<path>" | "s:<id>" | "j:<root>"
  let anchor = null;
  let clip = null;              // { op, root, keys }
  let dragging = null;

  const files = () => a.files() || [];
  const inRoot = (r) => files().filter((f) => f.root === r);
  const under = (r, path) => inRoot(r).filter((f) => (f.folder || "") === path || (f.folder || "").startsWith(path + "/"));
  const allFolders = (r) => [...new Set((a.folders() || {})[r] || [])];
  const childFolders = (r, path) => allFolders(r).filter((f) => parentOf(f) === path);

  function items() {
    if (!cur) return (a.roots() || []).map((r) => ({ k: `j:${r.key}`, kind: "root", name: r.label, root: r.key, icon: r.icon, count: inRoot(r.key).length, date: 0, meta: r.meta }));
    const q = query.trim().toLowerCase();
    const fs = q ? allFolders(cur.root).filter((f) => (!cur.path || f.startsWith(cur.path + "/")) && leaf(f).toLowerCase().includes(q)) : childFolders(cur.root, cur.path);
    const ss = q ? under(cur.root, cur.path).filter((f) => f.name.toLowerCase().includes(q)) : inRoot(cur.root).filter((f) => (f.folder || "") === cur.path);
    const fItems = fs.map((f) => {
      const inside = under(cur.root, f);
      return { k: `f:${f}`, kind: "folder", path: f, name: leaf(f), count: inside.length, date: Math.max(0, ...inside.map((x) => x.date || 0)), where: q ? parentOf(f) : null };
    });
    const sItems = ss.map((f) => ({ k: `s:${f.id}`, kind: "file", id: f.id, name: f.name, count: f.count || 0, date: f.date || 0, where: q ? f.folder || "" : null, icon: f.icon }));
    const by = (x, y) => {
      const d = sortBy === "date" ? x.date - y.date : sortBy === "count" ? x.count - y.count : x.name.localeCompare(y.name, undefined, { numeric: true });
      return sortDir === "desc" ? -d : d;
    };
    return [...fItems.sort(by), ...sItems.sort(by)];
  }

  /* ── drawing ── */
  function crumbs() {
    const parts = [`<a href="#" class="pp-fx__crumb" data-crumb="~"${cur ? "" : ' aria-current="page"'}>${esc(a.top)}</a>`];
    if (cur) {
      parts.push(`<a href="#" class="pp-fx__crumb" data-crumb=""${cur.path ? "" : ' aria-current="page"'}>${esc(cur.label)}</a>`);
      const bits = cur.path ? cur.path.split("/") : [];
      bits.forEach((b, i) => { const p = bits.slice(0, i + 1).join("/"); parts.push(`<a href="#" class="pp-fx__crumb" data-crumb="${esc(p)}"${i === bits.length - 1 ? ' aria-current="page"' : ""}>${esc(b)}</a>`); });
    }
    return parts.join('<span class="pp-fx__sep" aria-hidden="true">›</span>');
  }

  function itemHtml(it) {
    const ico = it.kind === "root" ? it.icon || FOLDER_SVG : it.kind === "folder" ? FOLDER_SVG : it.icon || a.file.icon || SHEET_SVG;
    const type = it.kind === "root" ? a.rootType || "Folder" : it.kind === "folder" ? "Folder" : a.file.type;
    const meta = it.kind === "root" ? it.meta || `${it.count} saved` : it.kind === "folder" ? `${it.count} ${it.count === 1 ? "item" : "items"}` : word(it.count);
    const cut = clip && clip.op === "cut" && cur && clip.root === cur.root && clip.keys.includes(it.k);
    return `<div class="pp-fx__item${sel.has(it.k) ? " is-sel" : ""}${cut ? " is-cut" : ""}" role="option" aria-selected="${sel.has(it.k)}" tabindex="-1"
        data-k="${esc(it.k)}" data-kind="${it.kind}"${it.kind !== "root" ? ' draggable="true"' : ""}>
      <span class="pp-fx__ico">${ico}</span>
      <span class="pp-fx__name">${esc(it.name)}${it.where != null ? `<small>${esc(it.where ? it.where.split("/").join(" › ") : cur.label)}</small>` : ""}</span>
      <span class="pp-fx__date">${esc(when(it.date))}</span>
      <span class="pp-fx__type">${esc(type)}</span>
      <span class="pp-fx__meta">${esc(meta)}</span>
    </div>`;
  }

  function paint() {
    const list = items();
    host.innerHTML = `
      <div class="pp-fx__bar">
        <nav class="pp-fx__crumbs" aria-label="Where you are">${crumbs()}</nav>
        <label class="pp-fx__find"><span class="pp-fx__findico" aria-hidden="true">${UI.search(15)}</span><input class="pp-fx__line" data-fx="q" placeholder="Search" value="${esc(query)}" autocomplete="off" aria-label="Search this folder"${cur ? "" : " disabled"} /></label>
        <button type="button" class="pp-fx__tool" data-tool="newfolder"${cur ? "" : " disabled"}></button>
        <button type="button" class="pp-fx__tool" data-tool="view"></button>
        <button type="button" class="pp-fx__tool" data-tool="sort"></button>
      </div>
      <div class="pp-fx" data-fx="list" data-view="${view}" role="listbox" aria-multiselectable="true" tabindex="0" aria-label="Folders and files">
        ${view === "details" ? `<div class="pp-fx__head" aria-hidden="true"><span>Name</span><span>Date modified</span><span>Type</span><span>Size</span></div>` : ""}
        ${list.length ? list.map(itemHtml).join("") : `<p class="pp-fx__empty">${query ? "Nothing here by that name." : cur ? esc(a.empty || "This folder is empty. Right-click for a new folder.") : "Nothing saved yet."}</p>`}
      </div>`;
    faceOf(host.querySelector('[data-tool="newfolder"]'), UI.folderPlus(16), "New folder");
    faceOf(host.querySelector('[data-tool="view"]'), UI.gridlines(16), "View");
    faceOf(host.querySelector('[data-tool="sort"]'), UI.upDown(16), "Sort by");
  }
  const listEl = () => host.querySelector('[data-fx="list"]');

  /* ── going places ── */
  function go(where) {
    sel.clear(); anchor = null; query = "";
    if (where === "~") cur = null;
    else if (where && where.root) {
      const r = (a.roots() || []).find((x) => x.key === where.root);
      cur = { root: where.root, label: r ? r.label : where.root, path: where.path || "" };
    } else if (cur) cur.path = where.path ?? "";
    paint();
    if (a.onNavigate) a.onNavigate(cur ? { ...cur } : null);
    listEl()?.focus({ preventScroll: true });
  }
  const goUp = () => { if (!cur) return; if (cur.path) go({ path: parentOf(cur.path) }); else go("~"); };

  function openItem(k) {
    const t = k.slice(0, 1), ref = k.slice(2);
    if (t === "j") return go({ root: ref });
    if (t === "f") return go({ path: ref });
    if (t === "s") return a.open([ref]);
  }

  /* ── selection ── */
  const itemEls = () => [...host.querySelectorAll(".pp-fx__item")];
  const keyAt = (el) => el && el.dataset.k;
  const elOf = (k) => host.querySelector(`.pp-fx__item[data-k="${CSS.escape(k)}"]`);
  function paintSel() { itemEls().forEach((el) => { const on = sel.has(el.dataset.k); el.classList.toggle("is-sel", on); el.setAttribute("aria-selected", on); }); }
  function pick(el, e) {
    const k = keyAt(el);
    if (e && (e.ctrlKey || e.metaKey)) { if (sel.has(k)) sel.delete(k); else sel.add(k); anchor = k; }
    else if (e && e.shiftKey && anchor) {
      const ks = itemEls().map(keyAt), x = ks.indexOf(anchor), y = ks.indexOf(k);
      sel = new Set(ks.slice(Math.min(x, y), Math.max(x, y) + 1));
    } else { sel = new Set([k]); anchor = k; }
    paintSel();
    el.focus({ preventScroll: true });
  }
  const selected = () => itemEls().filter((el) => sel.has(el.dataset.k)).map((el) => ({ k: el.dataset.k, kind: el.dataset.kind, ref: el.dataset.k.slice(2) }));

  /* ── the file operations ── */
  async function moveInto(keys, target) {
    if (!cur) return;
    const ids = keys.filter((k) => k.startsWith("s:")).map((k) => k.slice(2));
    const fold = keys.filter((k) => k.startsWith("f:")).map((k) => k.slice(2));
    for (const f of fold) if (target === f || target.startsWith(f + "/")) { msg("A folder cannot go inside itself."); return; }
    msg("…");
    try {
      if (ids.length) await a.ops.moveFiles(ids, target);
      for (const f of fold) {
        if (parentOf(f) === target) continue;
        let to = join(target, leaf(f)), n = 2;
        while (allFolders(cur.root).includes(to)) to = join(target, `${leaf(f)} (${n++})`);
        await a.ops.moveFolder(cur.root, cur.label, f, to);
      }
      await a.ops.refresh();
      const n = ids.length + fold.length;
      msg(`Moved ${n} ${n === 1 ? "item" : "items"} to ${target ? leaf(target) : cur.label}.`);
    } catch (e) { msg(errText(e)); await a.ops.refresh().catch(() => {}); }
    sel.clear(); paint();
  }
  async function copyInto(keys, target) {
    const ids = keys.filter((k) => k.startsWith("s:")).map((k) => k.slice(2));
    if (!ids.length) { msg("Folders are moved, not copied: use Cut."); return; }
    msg("…");
    try {
      for (const id of ids) await a.ops.copyFile(id, target);
      await a.ops.refresh();
      msg(`Copied ${ids.length} ${ids.length === 1 ? "item" : "items"}.`);
    } catch (e) { msg(errText(e)); }
    paint();
  }
  async function paste(target = cur ? cur.path : "") {
    if (!clip || !cur || clip.root !== cur.root) return;
    const { op, keys } = clip;
    if (op === "cut") { clip = null; await moveInto(keys, target); } else await copyInto(keys, target);
  }
  async function newFolder() {
    if (!cur) return;
    let name = "New folder", n = 2;
    while (allFolders(cur.root).includes(join(cur.path, name))) name = `New folder (${n++})`;
    const path = join(cur.path, name);
    try {
      await a.ops.newFolder(cur.root, cur.label, path);
      await a.ops.refresh();
      query = ""; paint();
      const el = elOf(`f:${path}`);
      if (el) { sel = new Set([`f:${path}`]); paintSel(); rename(el); }
    } catch (e) { msg(errText(e)); }
  }
  function rename(el) {
    if (!el || el.dataset.kind === "root" || !cur) return;
    const k = el.dataset.k, nameEl = el.querySelector(".pp-fx__name");
    const old = k.startsWith("f:") ? leaf(k.slice(2)) : (files().find((f) => f.id === k.slice(2)) || {}).name || "";
    const inp = document.createElement("input");
    inp.className = "pp-fx__line pp-fx__rename"; inp.value = old; inp.maxLength = k.startsWith("f:") ? 60 : 100;
    inp.setAttribute("aria-label", "New name");
    nameEl.replaceChildren(inp);
    el.draggable = false;
    inp.focus(); inp.select();
    let done = false;
    const finish = async (keep) => {
      if (done) return; done = true;
      const v = inp.value.replace(/\//g, " ").replace(/\s+/g, " ").trim();
      if (!keep || !v || v === old) { paint(); return; }
      try {
        if (k.startsWith("f:")) {
          const from = k.slice(2), to = join(parentOf(from), v);
          await a.ops.moveFolder(cur.root, cur.label, from, to);
          await a.ops.refresh();
          sel = new Set([`f:${to}`]);
        } else {
          const r = await a.ops.renameFile(k.slice(2), v);
          await a.ops.refresh();
          sel = new Set([`s:${(r && r.id) || k.slice(2)}`]);
        }
        msg("");
      } catch (e) { msg(errText(e)); }
      paint();
    };
    inp.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      else if (e.key === "Escape") { e.preventDefault(); finish(false); }
    });
    inp.addEventListener("blur", () => finish(true));
    inp.addEventListener("click", (e) => e.stopPropagation());
    inp.addEventListener("dblclick", (e) => e.stopPropagation());
  }
  /* a question asked in the explorer itself, not the browser's own dialog */
  function confirmIn(text, yes = "Delete") {
    return new Promise((resolve) => {
      host.querySelector(".pp-fx__ask")?.remove();
      const bar = document.createElement("div");
      bar.className = "pp-fx__ask"; bar.setAttribute("role", "alertdialog");
      bar.innerHTML = `<span>${esc(text)}</span><button type="button" class="pp-btn" data-yes>${esc(yes)}</button><button type="button" class="pp-btn pp-btn--ghost" data-no>Cancel</button>`;
      host.prepend(bar);
      bar.querySelector("[data-yes]").focus();
      bar.addEventListener("click", (e) => {
        const y = e.target.closest("[data-yes]"), n = e.target.closest("[data-no]");
        if (!y && !n) return;
        bar.remove(); resolve(!!y);
      });
    });
  }
  async function remove(list) {
    if (!list.length || !cur) return;
    const fs = list.filter((x) => x.kind === "folder"), ss = list.filter((x) => x.kind === "file");
    const inside = fs.reduce((n, f) => n + under(cur.root, f.ref).length, 0);
    const what = list.length === 1
      ? `Delete "${list[0].kind === "folder" ? leaf(list[0].ref) : (files().find((f) => f.id === list[0].ref) || {}).name}"${inside ? ` and the ${inside} ${inside === 1 ? "item" : "items"} in it` : ""}?`
      : `Delete these ${list.length} items${inside ? ` (and ${inside} inside folders)` : ""}?`;
    if (!(await confirmIn(what))) return;
    msg("…");
    try {
      for (const s of ss) await a.ops.deleteFile(s.ref);
      for (const f of fs) await a.ops.deleteFolder(cur.root, cur.label, f.ref);
      await a.ops.refresh();
      msg(`Deleted ${list.length} ${list.length === 1 ? "item" : "items"}.`);
    } catch (e) { msg(errText(e)); await a.ops.refresh().catch(() => {}); }
    sel.clear(); paint();
  }

  /* ── the right-click menu ── */
  let menu = null;
  function shutMenu() { if (menu) { menu.remove(); menu = null; } }
  function showMenu(x, y, entries) {
    shutMenu();
    menu = document.createElement("div");
    menu.className = "pp-fx__menu";
    menu.setAttribute("role", "menu");
    menu.innerHTML = entries.map((e, i) => (e === "-" ? `<hr />`
      : e.head ? `<p class="pp-fx__mhead">${esc(e.head)}</p>`
      : `<a href="#" role="menuitem" class="pp-fx__mi${e.on ? " is-on" : ""}${e.off ? " is-off" : ""}" data-i="${i}"${e.off ? ' aria-disabled="true"' : ""}><span class="pp-fx__mico">${e.ico || ""}</span><span>${esc(e.label)}</span>${e.key ? `<kbd>${esc(e.key)}</kbd>` : ""}</a>`)).join("");
    document.body.appendChild(menu);
    const r = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(6, Math.min(x, innerWidth - r.width - 6))}px`;
    menu.style.top = `${Math.max(6, Math.min(y, innerHeight - r.height - 6))}px`;
    menu.querySelector(".pp-fx__mi:not(.is-off)")?.focus();
    menu.addEventListener("click", (ev) => {
      ev.preventDefault();
      const it = ev.target.closest(".pp-fx__mi");
      if (!it || it.classList.contains("is-off")) return;
      const e = entries[Number(it.dataset.i)];
      shutMenu();
      e.run();
    });
    const m = menu; // the page's own Escape may have shut the menu already
    m.addEventListener("keydown", (ev) => {
      const all = [...m.querySelectorAll(".pp-fx__mi:not(.is-off)")], i = all.indexOf(document.activeElement);
      if (ev.key === "ArrowDown") { ev.preventDefault(); all[(i + 1) % all.length]?.focus(); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); all[(i - 1 + all.length) % all.length]?.focus(); }
      else if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); shutMenu(); listEl()?.focus(); }
    });
  }
  const viewEntries = () => [{ head: "View" }, ...VIEWS.map(([v, l]) => ({ label: l, on: view === v, ico: view === v ? UI.check(14) : "", run: () => { view = v; store.set(`${K}-view`, v); paint(); } }))];
  const sortEntries = () => [{ head: "Sort by" }, ...SORTS.map(([v, l]) => ({ label: l, on: sortBy === v, ico: sortBy === v ? UI.check(14) : "", run: () => { sortBy = v; store.set(`${K}-sort`, `${sortBy}:${sortDir}`); paint(); } })),
    { label: sortDir === "asc" ? "Ascending" : "Descending", ico: UI.upDown(14), run: () => { sortDir = sortDir === "asc" ? "desc" : "asc"; store.set(`${K}-sort`, `${sortBy}:${sortDir}`); paint(); } }];
  function itemMenu(x, y) {
    const list = selected();
    const one = list.length === 1 ? list[0] : null;
    const onlyFiles = list.length > 0 && list.every((i) => i.kind === "file");
    const keys = list.map((i) => i.k);
    if (list.some((i) => i.kind === "root")) { showMenu(x, y, [{ label: "Open", ico: UI.open(14), key: "Enter", run: () => openItem(keys[0]) }]); return; }
    const canPaste = !!(clip && cur && clip.root === cur.root && one && one.kind === "folder");
    showMenu(x, y, [
      one && one.kind === "folder" ? { label: "Open", ico: UI.open(14), key: "Enter", run: () => openItem(one.k) }
        : { label: onlyFiles && list.length > 1 && a.openMany ? a.openMany(list.length) : a.file.open || "Open", ico: UI.open(14), key: "Enter", off: !onlyFiles || (list.length > 1 && !a.openMany), run: () => a.open(list.map((i) => i.ref)) },
      "-",
      { label: "Cut", ico: UI.move(14), key: "Ctrl+X", run: () => { clip = { op: "cut", root: cur.root, keys }; msg(`${keys.length} cut. Open a folder and paste.`); paint(); } },
      { label: "Copy", ico: UI.copy(14), key: "Ctrl+C", off: !onlyFiles, run: () => { clip = { op: "copy", root: cur.root, keys }; msg(`${keys.length} copied.`); } },
      ...(canPaste ? [{ label: "Paste into this folder", ico: UI.archiveIn(14), run: () => paste(one.ref) }] : []),
      "-",
      { label: "Rename", ico: UI.edit(14), key: "F2", off: !one, run: () => rename(elOf(one.k)) },
      { label: "Delete", ico: UI.trash(14), key: "Del", run: () => remove(list) },
    ]);
  }
  function backMenu(x, y) {
    showMenu(x, y, [
      ...viewEntries(), "-", ...sortEntries(), "-",
      { label: "New folder", ico: UI.folderPlus(14), off: !cur, run: newFolder },
      { label: "Paste", ico: UI.archiveIn(14), key: "Ctrl+V", off: !(clip && cur && clip.root === cur.root), run: () => paste() },
      { label: "Select all", ico: UI.check(14), key: "Ctrl+A", run: () => { sel = new Set(itemEls().map(keyAt)); paintSel(); } },
      { label: "Refresh", ico: UI.refresh(14), run: async () => { await a.ops.refresh().catch(() => {}); paint(); } },
    ]);
  }

  /* ── the mouse, the finger and the keys ── */
  let lastTouch = 0;
  const onPointer = (e) => { if (e.pointerType === "touch") lastTouch = Date.now(); };
  const onClick = (e) => {
    const crumb = e.target.closest("[data-crumb]");
    if (crumb) { e.preventDefault(); const c = crumb.dataset.crumb; if (c === "~") go("~"); else go({ path: c }); return; }
    const tool = e.target.closest("[data-tool]");
    if (tool && !tool.disabled) {
      const r = tool.getBoundingClientRect();
      if (tool.dataset.tool === "newfolder") newFolder();
      else if (tool.dataset.tool === "view") showMenu(r.left, r.bottom + 4, viewEntries());
      else if (tool.dataset.tool === "sort") showMenu(r.left, r.bottom + 4, sortEntries());
      return;
    }
    const el = e.target.closest(".pp-fx__item");
    if (el && !e.target.closest(".pp-fx__rename")) {
      if (Date.now() - lastTouch < 600 && !e.ctrlKey && !e.shiftKey && sel.size <= 1) { openItem(el.dataset.k); return; }
      pick(el, e);
      return;
    }
    if (e.target.closest('[data-fx="list"]') && !el) { sel.clear(); paintSel(); }
  };
  const onDbl = (e) => { const el = e.target.closest(".pp-fx__item"); if (el && !e.target.closest(".pp-fx__rename")) openItem(el.dataset.k); };
  const onMenu = (e) => {
    if (!e.target.closest('[data-fx="list"]')) return;
    e.preventDefault();
    const el = e.target.closest(".pp-fx__item");
    if (el) { if (!sel.has(el.dataset.k)) pick(el); itemMenu(e.clientX, e.clientY); }
    else { sel.clear(); paintSel(); backMenu(e.clientX, e.clientY); }
  };
  const onInput = (e) => {
    if (e.target.dataset.fx !== "q") return;
    query = e.target.value;
    const at = e.target.selectionStart;
    sel.clear(); paint();
    const q = host.querySelector('[data-fx="q"]'); if (q) { q.focus(); q.setSelectionRange(at, at); }
  };
  const onDragStart = (e) => {
    const el = e.target.closest && e.target.closest('.pp-fx__item[draggable="true"]');
    if (!el) return;
    if (!sel.has(el.dataset.k)) { sel = new Set([el.dataset.k]); paintSel(); }
    dragging = [...sel].filter((k) => !k.startsWith("j:"));
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", dragging.join("\n")); } catch { /* the drag still works here */ }
    itemEls().forEach((x) => { if (dragging.includes(x.dataset.k)) x.classList.add("is-drag"); });
  };
  const dropTarget = (e) => {
    if (!dragging) return null;
    const f = e.target.closest && e.target.closest('.pp-fx__item[data-kind="folder"]');
    if (f && !dragging.includes(f.dataset.k)) return { el: f, path: f.dataset.k.slice(2) };
    const c = e.target.closest && e.target.closest("[data-crumb]");
    if (c && c.dataset.crumb !== "~" && cur && c.dataset.crumb !== cur.path) return { el: c, path: c.dataset.crumb };
    return null;
  };
  const onDragOver = (e) => {
    const t = dropTarget(e);
    host.querySelectorAll(".is-drop").forEach((x) => { if (!t || x !== t.el) x.classList.remove("is-drop"); });
    if (!t) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    t.el.classList.add("is-drop");
  };
  const onDrop = (e) => {
    const t = dropTarget(e);
    if (!t) return;
    e.preventDefault();
    const keys = dragging;
    dragging = null;
    moveInto(keys, t.path);
  };
  const onDragEnd = () => { dragging = null; host.querySelectorAll(".is-drag, .is-drop").forEach((x) => x.classList.remove("is-drag", "is-drop")); };

  /* the keys; returns true when the explorer used the key (the page can then leave it alone) */
  function key(e) {
    if (menu && e.key === "Escape") { e.preventDefault(); shutMenu(); return true; }
    const typing = e.target.matches && e.target.matches("input, textarea, select");
    if (e.key === "Escape") {
      if (host.querySelector(".pp-fx__ask")) { host.querySelector(".pp-fx__ask [data-no]").click(); e.preventDefault(); return true; }
      if (sel.size && !typing) { sel.clear(); paintSel(); e.preventDefault(); return true; }
      return false;
    }
    if (typing || !e.target.closest || !e.target.closest('[data-fx="list"]') || !host.contains(e.target)) return false;
    const els = itemEls(), at = els.indexOf(document.activeElement);
    const ctrl = e.ctrlKey || e.metaKey;
    const cols = () => {
      if (!(view === "large" || view === "medium" || view === "list") || els.length < 2) return 1;
      const top = els[0].offsetTop, n = els.findIndex((x) => x.offsetTop !== top);
      return n < 0 ? els.length : n;
    };
    const step = (d) => { e.preventDefault(); const n = Math.max(0, Math.min(els.length - 1, at < 0 ? 0 : at + d)); if (els[n]) pick(els[n], e.shiftKey ? { shiftKey: true } : null); };
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowDown") step(cols());
    else if (e.key === "ArrowUp") step(-cols());
    else if (e.key === "Enter") { e.preventDefault(); const list = selected(); if (list.length === 1) openItem(list[0].k); else if (list.length && a.openMany && list.every((i) => i.kind === "file")) a.open(list.map((i) => i.ref)); }
    else if (e.key === "Backspace" || (e.altKey && e.key === "ArrowUp")) { e.preventDefault(); goUp(); }
    else if (e.key === "F2") { e.preventDefault(); const list = selected(); if (list.length === 1) rename(elOf(list[0].k)); }
    else if (e.key === "Delete") { e.preventDefault(); if (cur) remove(selected().filter((i) => i.kind !== "root")); }
    else if (ctrl && e.key.toLowerCase() === "a") { e.preventDefault(); sel = new Set(els.map(keyAt)); paintSel(); }
    else if (ctrl && e.key.toLowerCase() === "x" && cur && sel.size) { e.preventDefault(); clip = { op: "cut", root: cur.root, keys: [...sel] }; msg(`${sel.size} cut. Open a folder and paste.`); paint(); }
    else if (ctrl && e.key.toLowerCase() === "c" && cur && sel.size) { e.preventDefault(); clip = { op: "copy", root: cur.root, keys: [...sel] }; msg(`${sel.size} copied.`); }
    else if (ctrl && e.key.toLowerCase() === "v") { e.preventDefault(); paste(); }
    else return false;
    return true;
  }
  const onKey = (e) => { if (host.isConnected && host.contains(document.activeElement || e.target)) key(e); else if (menu && e.key === "Escape") { shutMenu(); e.preventDefault(); } };
  const onAway = (e) => { if (menu && !menu.contains(e.target)) shutMenu(); };

  host.addEventListener("pointerdown", onPointer);
  host.addEventListener("click", onClick);
  host.addEventListener("dblclick", onDbl);
  host.addEventListener("contextmenu", onMenu);
  host.addEventListener("input", onInput);
  host.addEventListener("dragstart", onDragStart);
  host.addEventListener("dragover", onDragOver);
  host.addEventListener("drop", onDrop);
  host.addEventListener("dragend", onDragEnd);
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("pointerdown", onAway, true);
  addEventListener("blur", shutMenu);

  paint();
  return {
    where: () => (cur ? { ...cur } : null),
    go,
    goUp,
    paint,
    /** does the explorer have something to undo with Escape (a menu, a question, a selection)? */
    busy: () => !!(menu || host.querySelector(".pp-fx__ask") || sel.size),
    destroy() {
      shutMenu();
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onAway, true);
      removeEventListener("blur", shutMenu);
    },
  };
}
