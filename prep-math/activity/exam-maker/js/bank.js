/* ============================================================================
   The question bank, in the Paper Test Builder — a file explorer
   ----------------------------------------------------------------------------
   The teacher's saved sets live in FOLDERS, one tree per subject, worked the
   way a computer's file explorer is worked:

     • four views (large icons, medium icons, list, details), sorted by name,
       items or date, remembered on this machine;
     • a path bar to climb back up, and a search through the folders below;
     • click to select, Ctrl/Shift-click for more, double-click (or Enter) to
       open a folder or load a set; one tap opens on a touch screen;
     • drag sets and folders onto a folder, or onto the path bar, to move them;
     • right-click (a long press on a phone) for Open, Cut, Copy, Paste,
       Rename, Delete, New folder, View, Sort, Select all and Refresh;
     • the keys: Enter, F2, Delete, Ctrl+A / X / C / V, Backspace, arrows.

   At a subject's top the shared bank (every question the site holds for it)
   is browsed underneath, 30 at a time. Save puts the editor's questions in a
   set in the folder that is open.

     GET  /api/bank/sets, /api/bank/sets/:id       the teacher's sets and folders
     POST /api/bank/sets                           save a set { …, folder }
     POST /api/bank/sets/move, /sets/:id/rename, /sets/:id/copy, DELETE /sets/:id
     POST /api/bank/folders, /folders/move, DELETE /folders { recursive }
     GET  /api/bank/browse/subjects, /browse?…    the shared bank
     GET  /api/bank/comp-links                     the admin: competition links + passwords
   ========================================================================== */

import { faceOf } from "/utils/components/workbook/icons.js";
import { UI } from "/utils/components/ui-icons.js";
import { subjectIcon } from "/utils/components/subject-icons.js";
import { esc, textHtml } from "./model.js";

const EXAMS = { utme: "UTME", wassce: "WASSCE", postutme: "Post-UTME", cee: "Common Entrance", practice: "Practice", sat: "SAT", igcse: "IGCSE", alevel: "A Level", competition: "Competition" };
const SOURCES = { past: "Past", ai: "Practice", manual: "Written", rephrased: "Reworded", competition: "Competition", teacher: "Mine" };
const SCHOLASTIC_EDITION = { 2022: "1st Edition", 2025: "2nd Edition", "2nd-edition": "2nd Edition", "3rd-edition": "3rd Edition", "4th-edition": "4th Edition", "5th-edition": "5th Edition" };
const compName = (k) => {
  const [c, , y, r] = String(k).split("|");
  const w = c === "scholastic" ? SCHOLASTIC_EDITION[y] || y : y;
  return `${c === "anmc" ? "ANMC" : c === "scholastic" ? "Scholastic" : c} ${w} ${String(r || "").replace(/-/g, " ")}`;
};
/** "Mathematics · General" -> "mathematics" (the same rule the server uses) */
const keyOf = (s) => String(s || "").split("·")[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, "") || "general";
const typeset = (el) => { if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([el]).catch(() => {}); };
const parentOf = (p) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "");
const leaf = (p) => p.slice(p.lastIndexOf("/") + 1);
const join = (a, b) => (a ? `${a}/${b}` : b);
const errText = (e) => String((e && e.message) || e).slice(0, 140);
const when = (ms) => (ms ? new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");

/* the pictures: a folder (tab, body), and a set (a sheet of questions) */
const FOLDER = `<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M2 6h16l4 5h24v27H2z" fill="#e8b84a"/><path d="M2 14h44v24H2z" fill="#f4cf6b"/><path d="M2 14h44v3H2z" fill="#fff" opacity=".35"/></svg>`;
const SHEET = `<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M6 2h20l10 10v34H6z" fill="#fffdf6" stroke="#9fb8d8" stroke-width="2"/><path d="M26 2v10h10" fill="#dce8f6" stroke="#9fb8d8" stroke-width="2" stroke-linejoin="round"/><path d="M12 22h18M12 28h18M12 34h12" stroke="#6fa8dc" stroke-width="2.4" stroke-linecap="round"/></svg>`;

const VIEWS = [["large", "Large icons"], ["medium", "Medium icons"], ["list", "List"], ["details", "Details"]];
const SORTS = [["name", "Name"], ["date", "Date modified"], ["count", "Items"]];
const store = {
  get(k, d) { try { return localStorage.getItem(k) || d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* not kept */ } },
};

/** The competition links as one message to paste into WhatsApp. */
export function whatsappText(links) {
  const mins = (m) => (m >= 60 ? `${m / 60} hour${m > 60 ? "s" : ""}` : `${m} minutes`);
  return [
    "*Prep Portal · Competition practice papers*",
    "One try each. Your camera stays on, and you shade your answers on the OMR sheet.",
    "Open the link, sign in, and type the password.",
    "",
    ...links.map((l) => [`*${l.name}* (${mins(l.minutes)})`, l.url, `Password: ${l.password}`, ""].join("\n")),
  ].join("\n").trim();
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* the old way */ }
  const t = document.createElement("textarea");
  t.value = text; t.style.cssText = "position:fixed;opacity:0;top:0;left:0";
  document.body.appendChild(t); t.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { /* no clipboard */ }
  t.remove();
  return ok;
}

/**
 * Open the bank over the page.
 *   bench()                   { questions, subject, level, name }: the editor now (for Save)
 *   onLoad(questions, name)   questions to add to the editor
 *   focusSave                 open with the name line ready
 */
export async function openBank({ bench, onLoad, focusSave = false }) {
  document.getElementById("xm-bk")?.remove();
  const { api } = await import("/utils/components/workbook/account.js");
  const now = bench();

  const box = document.createElement("div");
  box.id = "xm-bk";
  box.className = "xm-bk xm-qb";
  box.innerHTML = `
    <div class="pp-receipt xm-bk__card xm-qb__card" role="dialog" aria-modal="true" aria-label="Question bank">
      <div class="pp-receipt__paper xm-bk__paper">
        <header class="xm-qb__head">
          <button type="button" class="xm-qb__back" hidden></button>
          <h2 id="xm-qb-title">Question bank</h2>
          <button type="button" class="xm-qb__icon xm-qb__close"></button>
        </header>
        <form class="xm-qb__save" id="xm-qb-save">
          <input class="xm-qb__line" id="xm-qb-name" maxlength="100" autocomplete="off" placeholder="Name" value="${esc(now.name || "")}" aria-label="Name for these questions" />
          <select class="xm-qb__line xm-qb__subj" id="xm-qb-subj" aria-label="Subject"></select>
          <button type="submit" class="xm-qb__icon" id="xm-qb-go"${now.questions.length ? "" : " disabled"}></button>
        </form>
        <p class="xm-qb__msg" id="xm-qb-msg" role="status"></p>
        <div class="xm-bk__scroll xm-qb__body" id="xm-qb-body" tabindex="-1"></div>
        <div class="xm-qb__foot" id="xm-qb-foot" hidden>
          <span id="xm-qb-count"></span>
          <button type="button" class="xm-qb__icon xm-qb__add" id="xm-qb-add" disabled></button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(box);
  document.documentElement.classList.add("xm-bk-on");
  const $ = (id) => box.querySelector(`#${id}`);
  const body = $("xm-qb-body");
  const close = () => { shutMenu(); box.remove(); document.documentElement.classList.remove("xm-bk-on"); document.removeEventListener("keydown", onKey, true); };
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  faceOf(box.querySelector(".xm-qb__close"), UI.close(18), "Close");
  faceOf(box.querySelector(".xm-qb__back"), UI.chevronLeft(18), "Up a folder");
  faceOf($("xm-qb-go"), UI.archiveIn(18), "Save the editor's questions in this folder");
  faceOf($("xm-qb-add"), UI.download(18), "Add the ticked questions to the editor");

  let sets = [], folders = {}, cards = { subjects: [], mine: 0 };
  let cur = null;               // the open subject and folder: { key, label, s, path, filters, items, next }
  let links = null;             // the admin's competition links (null until asked)
  let view = store.get("xm-qb-view", "large");
  let [sortBy, sortDir] = store.get("xm-qb-sort", "name:asc").split(":");
  let query = "";
  let sel = new Set();          // selected item keys: "f:<path>" | "s:<id>" | "j:<subject>"
  let anchor = null;            // where a Shift-click range starts
  let clip = null;              // { op: "cut" | "copy", subject, keys: [] }
  let dragging = null;          // the keys being dragged
  const picked = new Map();     // shared-bank question id -> question
  const msg = (t) => { $("xm-qb-msg").textContent = t || ""; };

  /* ── what there is ── */
  function subjects() {
    const map = new Map();
    const add = (k, label) => { if (!map.has(k)) map.set(k, { key: k, label, bank: 0, mine: 0, s: null }); return map.get(k); };
    for (const s of cards.subjects) Object.assign(add(s.key, s.label), { bank: s.count, s });
    for (const st of sets) add(keyOf(st.subject), String(st.subject || "General").split("·")[0].trim() || "General").mine += 1;
    for (const k of Object.keys(folders)) if ((folders[k] || []).length) add(k, k.charAt(0).toUpperCase() + k.slice(1));
    return [...map.values()];
  }
  const inSubject = (key) => sets.filter((st) => keyOf(st.subject) === key);
  const under = (key, path) => inSubject(key).filter((st) => (st.folder || "") === path || (st.folder || "").startsWith(path + "/"));
  const allFolders = (key) => [...new Set(folders[key] || [])];
  const childFolders = (key, path) => allFolders(key).filter((f) => parentOf(f) === path);

  /* the items to draw where we are: subjects at the top, else this folder's folders and sets (or what the search finds below it) */
  function items() {
    if (!cur) {
      return subjects().sort((a, b) => (b.mine - a.mine) || (b.bank - a.bank))
        .map((s) => ({ k: `j:${s.key}`, kind: "subj", name: s.label, key: s.key, count: s.mine, date: 0, meta: `${s.mine ? `${s.mine} saved · ` : ""}${s.bank.toLocaleString()} in the bank` }));
    }
    const q = query.trim().toLowerCase();
    const fs = q ? allFolders(cur.key).filter((f) => (!cur.path || f.startsWith(cur.path + "/")) && leaf(f).toLowerCase().includes(q)) : childFolders(cur.key, cur.path);
    const ss = q ? under(cur.key, cur.path).filter((st) => st.name.toLowerCase().includes(q)) : inSubject(cur.key).filter((st) => (st.folder || "") === cur.path);
    const fItems = fs.map((f) => {
      const inside = under(cur.key, f);
      return { k: `f:${f}`, kind: "folder", path: f, name: leaf(f), count: inside.length, date: Math.max(0, ...inside.map((x) => x.savedAt || 0)), where: q ? parentOf(f) : null };
    });
    const sItems = ss.map((st) => ({ k: `s:${st.id}`, kind: "set", id: st.id, name: st.name, count: st.count, date: st.savedAt || 0, where: q ? st.folder || "" : null }));
    const by = (a, b) => {
      const d = sortBy === "date" ? a.date - b.date : sortBy === "count" ? a.count - b.count : a.name.localeCompare(b.name, undefined, { numeric: true });
      return sortDir === "desc" ? -d : d;
    };
    return [...fItems.sort(by), ...sItems.sort(by)];
  }

  function fillSubjectSelect() {
    const s_ = $("xm-qb-subj");
    const want = cur ? cur.key : keyOf(now.subject);
    const list = subjects().sort((a, b) => a.label.localeCompare(b.label));
    if (!list.some((s) => s.key === want)) list.unshift({ key: want, label: String(now.subject || "General").split("·")[0].trim() || "General" });
    s_.innerHTML = list.map((s) => `<option value="${esc(s.key)}"${s.key === want ? " selected" : ""}>${esc(s.label)}</option>`).join("");
  }

  /* ── drawing ── */
  function crumbs() {
    const parts = [`<a href="#" class="xm-fx__crumb" data-crumb="~"${cur ? "" : ' aria-current="page"'}>Question bank</a>`];
    if (cur) {
      parts.push(`<a href="#" class="xm-fx__crumb" data-crumb=""${cur.path ? "" : ' aria-current="page"'}>${esc(cur.label)}</a>`);
      const bits = cur.path ? cur.path.split("/") : [];
      bits.forEach((b, i) => { const p = bits.slice(0, i + 1).join("/"); parts.push(`<a href="#" class="xm-fx__crumb" data-crumb="${esc(p)}"${i === bits.length - 1 ? ' aria-current="page"' : ""}>${esc(b)}</a>`); });
    }
    return parts.join('<span class="xm-fx__sep" aria-hidden="true">›</span>');
  }

  function itemHtml(it) {
    const ico = it.kind === "subj" ? subjectIcon(it.key) : it.kind === "folder" ? FOLDER : SHEET;
    const type = it.kind === "subj" ? "Subject" : it.kind === "folder" ? "Folder" : "Question set";
    const meta = it.kind === "subj" ? it.meta : it.kind === "folder" ? `${it.count} ${it.count === 1 ? "set" : "sets"}` : `${it.count} ${it.count === 1 ? "question" : "questions"}`;
    const cut = clip && clip.op === "cut" && cur && clip.subject === cur.key && clip.keys.includes(it.k);
    return `<div class="xm-fx__item${sel.has(it.k) ? " is-sel" : ""}${cut ? " is-cut" : ""}" role="option" aria-selected="${sel.has(it.k)}" tabindex="-1"
        data-k="${esc(it.k)}" data-kind="${it.kind}"${it.kind !== "subj" ? ' draggable="true"' : ""}>
      <span class="xm-fx__ico">${ico}</span>
      <span class="xm-fx__name">${esc(it.name)}${it.where != null ? `<small>${esc(it.where ? it.where.split("/").join(" › ") : cur.label)}</small>` : ""}</span>
      <span class="xm-fx__date">${esc(when(it.date))}</span>
      <span class="xm-fx__type">${type}</span>
      <span class="xm-fx__meta">${esc(meta)}</span>
    </div>`;
  }

  function filterRow(s) {
    if (!s) return "";
    const chips = (name, map, labels) => {
      const keys = Object.keys(map || {}).filter((k) => map[k] > 0);
      if (keys.length < 2) return "";
      return `<div class="xm-qb__chips">${[["", "All"], ...keys.map((k) => [k, labels ? labels[k] || k : k])]
        .map(([k, l]) => `<button type="button" class="xm-qb__chip${(cur.filters[name] || "") === k ? " is-on" : ""}" data-f="${name}" data-v="${esc(k)}">${esc(l)}</button>`).join("")}</div>`;
    };
    const select = (name, map, label) => {
      const keys = Object.keys(map || {}).filter((k) => map[k] > 0).sort();
      if (keys.length < 2) return "";
      return `<select class="xm-qb__line" data-f="${name}" aria-label="${label}"><option value="">${label}</option>${keys.map((k) => `<option value="${esc(k)}"${cur.filters[name] === k ? " selected" : ""}>${esc(name === "comp" ? compName(k) : k)}</option>`).join("")}</select>`;
    };
    const s_ = [select("comp", s.comps, "Paper"), select("topic", s.topics, "Topic"), select("year", s.years, "Year")].join("");
    return chips("scheme", s.schemes, EXAMS) + chips("source", s.sources, SOURCES) + (s_ ? `<div class="xm-qb__selects">${s_}</div>` : "");
  }

  function qRow(it) {
    const q = it.q, m = it.meta;
    const tag = [m.comp ? compName(m.comp) : EXAMS[m.scheme] || "", m.year].filter(Boolean).join(" · ");
    const opts = q.type === "mcq" ? `<ol class="xm-bb__opts">${q.options.map((o, k) => `<li class="${k === q.answer ? "is-key" : ""}">${textHtml(o)}</li>`).join("")}</ol>` : "";
    return `<label class="xm-qb__q${picked.has(it.id) ? " is-on" : ""}" data-id="${esc(it.id)}">
      <input type="checkbox"${picked.has(it.id) ? " checked" : ""} />
      <span class="xm-qb__qbody"><span class="xm-qb__text">${textHtml(q.text)}</span>${opts}${tag ? `<span class="xm-qb__tag">${esc(tag)}</span>` : ""}</span>
    </label>`;
  }

  /* the whole panel for where we are */
  function paint() {
    const list = items();
    const top = cur && !cur.path && !query;
    box.querySelector(".xm-qb__back").hidden = !cur;
    $("xm-qb-title").textContent = !cur ? "Question bank" : cur.path ? leaf(cur.path) : cur.label;
    fillSubjectSelect();
    const compLinks = cur && /^Competitions(\/|$)/.test(cur.path) && links && links.length ? links.filter((l) => (l.folder || "").startsWith(cur.path)) : [];
    body.innerHTML = `
      <div class="xm-fx__bar">
        <nav class="xm-fx__crumbs" aria-label="Where you are">${crumbs()}</nav>
        <label class="xm-fx__find"><span class="xm-fx__findico" aria-hidden="true">${UI.search(15)}</span><input class="xm-qb__line" id="xm-fx-q" placeholder="Search" value="${esc(query)}" autocomplete="off" aria-label="Search this folder"${cur ? "" : " disabled"} /></label>
        <button type="button" class="xm-qb__icon" data-tool="newfolder"${cur ? "" : " disabled"}></button>
        <button type="button" class="xm-qb__icon" data-tool="view"></button>
        <button type="button" class="xm-qb__icon" data-tool="sort"></button>
      </div>
      <div class="xm-fx" id="xm-fx" data-view="${view}" role="listbox" aria-multiselectable="true" tabindex="0" aria-label="Folders and sets">
        ${view === "details" ? `<div class="xm-fx__head" aria-hidden="true"><span>Name</span><span>Date modified</span><span>Type</span><span>Size</span></div>` : ""}
        ${list.length ? list.map(itemHtml).join("") : `<p class="xm-fx__empty">${query ? "Nothing here by that name." : cur ? "This folder is empty. Right-click for a new folder, or save the editor's questions here." : "Empty."}</p>`}
      </div>
      ${compLinks.length ? `<section class="xm-qb__sec xm-qb__links"><h3>Links</h3>
        <p class="xm-qb__linknote">${compLinks.length} ${compLinks.length === 1 ? "paper" : "papers"} · one try · camera on · OMR sheet</p>
        <button type="button" class="xm-qb__copyall" id="xm-qb-copy">Copy all for WhatsApp</button></section>` : ""}
      ${top && cur.s ? `<section class="xm-qb__sec"><h3>Bank</h3>${filterRow(cur.s)}<div class="xm-qb__list" id="xm-qb-list"><p class="xm-bk__none">…</p></div></section>` : ""}`;
    faceOf(body.querySelector('[data-tool="newfolder"]'), UI.folderPlus(16), "New folder");
    faceOf(body.querySelector('[data-tool="view"]'), UI.gridlines(16), "View");
    faceOf(body.querySelector('[data-tool="sort"]'), UI.upDown(16), "Sort by");
    $("xm-qb-foot").hidden = !(top && cur.s);
    if (top && cur.s) paintQuestions();
  }

  function paintQuestions() {
    const list = $("xm-qb-list");
    if (!list) return;
    if (!cur.items.length) { list.innerHTML = `<p class="xm-bk__none">${cur.loading ? "…" : "None."}</p>`; return; }
    list.innerHTML = cur.items.map(qRow).join("") + (cur.next ? `<button type="button" class="xm-qb__more">More</button>` : "");
    typeset(list);
  }

  async function loadPage(more = false) {
    const f = cur.filters, qs = new URLSearchParams({ subject: cur.key });
    for (const k of ["scheme", "source", "topic", "year", "comp"]) if (f[k]) qs.set(k, f[k]);
    if (more && cur.next) qs.set("after", cur.next);
    cur.loading = true;
    if (!more) paintQuestions();
    try {
      const r = await api(`/api/bank/browse?${qs}`);
      cur.items = more ? cur.items.concat(r.items) : r.items;
      cur.next = r.next;
    } catch (e) { msg(errText(e)); }
    cur.loading = false;
    paintQuestions();
  }

  /* ── going places ── */
  function go(where) {
    sel.clear(); anchor = null; query = "";
    if (where === "~") { cur = null; paint(); $("xm-fx")?.focus({ preventScroll: true }); return; }
    if (where && where.subject) {
      const s = subjects().find((x) => x.key === where.subject);
      if (!s) return;
      cur = { key: s.key, label: s.label, s: s.s, path: "", filters: {}, items: [], next: null, loading: false };
    } else if (cur) cur.path = where.path ?? "";
    paint();
    if (cur && !cur.path && cur.s && !cur.items.length) loadPage();
    /* the admin's competition links: asked once, when a Competitions folder is first opened */
    if (cur && links === null && /^Competitions(\/|$)/.test(cur.path)) {
      links = [];
      api("/api/bank/comp-links").then((r) => { links = r.links || []; if (cur && /^Competitions/.test(cur.path)) paint(); }).catch(() => { links = []; });
    }
    $("xm-fx")?.focus({ preventScroll: true });
  }
  const goUp = () => { if (!cur) return; if (cur.path) go({ path: parentOf(cur.path) }); else go("~"); };

  const refresh = async () => { const r = await api("/api/bank/sets"); sets = r.sets || []; folders = r.folders || {}; };

  function openItem(k) {
    const t = k.slice(0, 1), ref = k.slice(2);
    if (t === "j") return go({ subject: ref });
    if (t === "f") return go({ path: ref });
    if (t === "s") return loadSets([ref]);
  }
  const full = new Map();
  const getSet = async (id) => { if (!full.has(id)) full.set(id, (await api(`/api/bank/sets/${id}`)).set); return full.get(id); };
  async function loadSets(ids) {
    msg("…");
    try {
      const got = await Promise.all(ids.map(getSet));
      onLoad(got.flatMap((s) => s.questions || []), got.length === 1 ? got[0].name : `${got.length} sets`);
      close();
    } catch (e) { msg(errText(e)); }
  }

  /* ── selection ── */
  const itemEls = () => [...body.querySelectorAll(".xm-fx__item")];
  const keyAt = (el) => el && el.dataset.k;
  const elOf = (k) => body.querySelector(`.xm-fx__item[data-k="${CSS.escape(k)}"]`);
  function paintSel() {
    itemEls().forEach((el) => { const on = sel.has(el.dataset.k); el.classList.toggle("is-sel", on); el.setAttribute("aria-selected", on); });
  }
  function pick(el, e) {
    const k = keyAt(el);
    if (e && (e.ctrlKey || e.metaKey)) { if (sel.has(k)) sel.delete(k); else sel.add(k); anchor = k; }
    else if (e && e.shiftKey && anchor) {
      const ks = itemEls().map(keyAt), a = ks.indexOf(anchor), b = ks.indexOf(k);
      sel = new Set(ks.slice(Math.min(a, b), Math.max(a, b) + 1));
    } else { sel = new Set([k]); anchor = k; }
    paintSel();
    el.focus({ preventScroll: true });
  }
  const selected = () => itemEls().filter((el) => sel.has(el.dataset.k)).map((el) => ({ k: el.dataset.k, kind: el.dataset.kind, ref: el.dataset.k.slice(2) }));

  /* ── the file operations ── */
  async function moveInto(keys, target) {
    if (!cur) return;
    const setIds = keys.filter((k) => k.startsWith("s:")).map((k) => k.slice(2));
    const fold = keys.filter((k) => k.startsWith("f:")).map((k) => k.slice(2));
    for (const f of fold) {
      if (target === f || target.startsWith(f + "/")) { msg("A folder cannot go inside itself."); return; }
    }
    msg("…");
    try {
      if (setIds.length) {
        await api("/api/bank/sets/move", { ids: setIds, folder: target });
        sets.forEach((st) => { if (setIds.includes(st.id)) st.folder = target; });
      }
      for (const f of fold) {
        if (parentOf(f) === target) continue;
        let to = join(target, leaf(f)), n = 2;
        while (allFolders(cur.key).includes(to)) to = join(target, `${leaf(f)} (${n++})`);
        await api("/api/bank/folders/move", { subject: cur.label, from: f, to });
      }
      if (fold.length) await refresh();
      const n = setIds.length + fold.length;
      msg(`Moved ${n} ${n === 1 ? "item" : "items"} to ${target ? leaf(target) : cur.label}.`);
    } catch (e) { msg(errText(e)); await refresh().catch(() => {}); }
    sel.clear(); paint();
  }

  async function copyInto(keys, target) {
    const ids = keys.filter((k) => k.startsWith("s:")).map((k) => k.slice(2));
    if (!ids.length) { msg("Folders are moved, not copied: use Cut."); return; }
    msg("…");
    try {
      for (const id of ids) await api(`/api/bank/sets/${id}/copy`, { folder: target });
      await refresh();
      msg(`Copied ${ids.length} ${ids.length === 1 ? "set" : "sets"}.`);
    } catch (e) { msg(errText(e)); }
    paint();
  }

  async function paste(target = cur ? cur.path : "") {
    if (!clip || !cur || clip.subject !== cur.key) return;
    const { op, keys } = clip;
    if (op === "cut") { clip = null; await moveInto(keys, target); } else await copyInto(keys, target);
  }

  async function newFolder() {
    if (!cur) return;
    let name = "New folder", n = 2;
    while (allFolders(cur.key).includes(join(cur.path, name))) name = `New folder (${n++})`;
    const path = join(cur.path, name);
    try {
      await api("/api/bank/folders", { subject: cur.label, path });
      folders[cur.key] = [...new Set([...(folders[cur.key] || []), path])];
      query = ""; paint();
      const el = elOf(`f:${path}`);
      if (el) { sel = new Set([`f:${path}`]); paintSel(); rename(el); }
    } catch (e) { msg(errText(e)); }
  }

  /* rename in place: the name becomes a line to type on; Enter keeps it, Escape puts it back */
  function rename(el) {
    if (!el || el.dataset.kind === "subj" || !cur) return;
    const k = el.dataset.k, nameEl = el.querySelector(".xm-fx__name");
    const old = k.startsWith("f:") ? leaf(k.slice(2)) : (sets.find((s) => s.id === k.slice(2)) || {}).name || "";
    const inp = document.createElement("input");
    inp.className = "xm-qb__line xm-fx__rename"; inp.value = old; inp.maxLength = k.startsWith("f:") ? 60 : 100;
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
          await api("/api/bank/folders/move", { subject: cur.label, from, to });
          await refresh();
          sel = new Set([`f:${to}`]);
        } else {
          const r = await api(`/api/bank/sets/${k.slice(2)}/rename`, { name: v });
          const st = sets.find((s) => s.id === k.slice(2));
          if (st) { st.id = r.id; st.name = r.name; }
          full.delete(k.slice(2));
          sel = new Set([`s:${r.id}`]);
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

  /* a question asked in the panel itself, not the browser's own dialog */
  function confirmIn(text, yes = "Delete") {
    return new Promise((resolve) => {
      body.querySelector(".xm-fx__ask")?.remove();
      const bar = document.createElement("div");
      bar.className = "xm-fx__ask"; bar.setAttribute("role", "alertdialog");
      bar.innerHTML = `<span>${esc(text)}</span><button type="button" class="pp-btn" data-yes>${esc(yes)}</button><button type="button" class="pp-btn pp-btn--ghost" data-no>Cancel</button>`;
      body.prepend(bar);
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
    const fs = list.filter((x) => x.kind === "folder"), ss = list.filter((x) => x.kind === "set");
    const inside = fs.reduce((n, f) => n + under(cur.key, f.ref).length, 0);
    const what = list.length === 1
      ? `Delete "${list[0].kind === "folder" ? leaf(list[0].ref) : (sets.find((s) => s.id === list[0].ref) || {}).name}"${inside ? ` and the ${inside} ${inside === 1 ? "set" : "sets"} in it` : ""}?`
      : `Delete these ${list.length} items${inside ? ` (and ${inside} ${inside === 1 ? "set" : "sets"} inside folders)` : ""}?`;
    if (!(await confirmIn(what))) return;
    msg("…");
    try {
      for (const s of ss) await api(`/api/bank/sets/${s.ref}`, {}, "DELETE");
      for (const f of fs) await api("/api/bank/folders", { subject: cur.label, path: f.ref, recursive: true }, "DELETE");
      await refresh();
      msg(`Deleted ${list.length} ${list.length === 1 ? "item" : "items"}.`);
    } catch (e) { msg(errText(e)); await refresh().catch(() => {}); }
    sel.clear(); paint();
  }

  /* ── the right-click menu ── */
  let menu = null;
  function shutMenu() { if (menu) { menu.remove(); menu = null; } }
  function showMenu(x, y, entries) {
    shutMenu();
    menu = document.createElement("div");
    menu.className = "xm-fx__menu";
    menu.setAttribute("role", "menu");
    menu.innerHTML = entries.map((e, i) => (e === "-" ? `<hr />`
      : e.head ? `<p class="xm-fx__mhead">${esc(e.head)}</p>`
      : `<a href="#" role="menuitem" class="xm-fx__mi${e.on ? " is-on" : ""}${e.off ? " is-off" : ""}" data-i="${i}"${e.off ? ' aria-disabled="true"' : ""}><span class="xm-fx__mico">${e.ico || ""}</span><span>${esc(e.label)}</span>${e.key ? `<kbd>${esc(e.key)}</kbd>` : ""}</a>`)).join("");
    document.body.appendChild(menu);
    const r = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(6, Math.min(x, innerWidth - r.width - 6))}px`;
    menu.style.top = `${Math.max(6, Math.min(y, innerHeight - r.height - 6))}px`;
    menu.querySelector(".xm-fx__mi:not(.is-off)")?.focus();
    menu.addEventListener("click", (ev) => {
      ev.preventDefault();
      const a = ev.target.closest(".xm-fx__mi");
      if (!a || a.classList.contains("is-off")) return;
      const e = entries[Number(a.dataset.i)];
      shutMenu();
      e.run();
    });
    menu.addEventListener("keydown", (ev) => {
      const all = [...menu.querySelectorAll(".xm-fx__mi:not(.is-off)")], i = all.indexOf(document.activeElement);
      if (ev.key === "ArrowDown") { ev.preventDefault(); all[(i + 1) % all.length]?.focus(); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); all[(i - 1 + all.length) % all.length]?.focus(); }
      else if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); shutMenu(); $("xm-fx")?.focus(); }
    });
  }
  const viewEntries = () => [{ head: "View" }, ...VIEWS.map(([v, l]) => ({ label: l, on: view === v, ico: view === v ? UI.check(14) : "", run: () => { view = v; store.set("xm-qb-view", v); paint(); } }))];
  const sortEntries = () => [{ head: "Sort by" }, ...SORTS.map(([v, l]) => ({ label: l, on: sortBy === v, ico: sortBy === v ? UI.check(14) : "", run: () => { sortBy = v; store.set("xm-qb-sort", `${sortBy}:${sortDir}`); paint(); } })),
    { label: sortDir === "asc" ? "Ascending" : "Descending", ico: UI.upDown(14), run: () => { sortDir = sortDir === "asc" ? "desc" : "asc"; store.set("xm-qb-sort", `${sortBy}:${sortDir}`); paint(); } }];

  function itemMenu(x, y) {
    const list = selected();
    const one = list.length === 1 ? list[0] : null;
    const onlySets = list.length > 0 && list.every((i) => i.kind === "set");
    const keys = list.map((i) => i.k);
    if (list.some((i) => i.kind === "subj")) { showMenu(x, y, [{ label: "Open", ico: UI.open(14), key: "Enter", run: () => openItem(keys[0]) }]); return; }
    const canPaste = !!(clip && cur && clip.subject === cur.key && one && one.kind === "folder");
    showMenu(x, y, [
      one && one.kind === "folder" ? { label: "Open", ico: UI.open(14), key: "Enter", run: () => openItem(one.k) }
        : { label: onlySets && list.length > 1 ? `Load ${list.length} sets into the editor` : "Load into the editor", ico: UI.download(14), key: "Enter", off: !onlySets, run: () => loadSets(list.map((i) => i.ref)) },
      "-",
      { label: "Cut", ico: UI.move(14), key: "Ctrl+X", run: () => { clip = { op: "cut", subject: cur.key, keys }; msg(`${keys.length} cut. Open a folder and paste.`); paint(); } },
      { label: "Copy", ico: UI.copy(14), key: "Ctrl+C", off: !onlySets, run: () => { clip = { op: "copy", subject: cur.key, keys }; msg(`${keys.length} copied.`); } },
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
      { label: "Paste", ico: UI.archiveIn(14), key: "Ctrl+V", off: !(clip && cur && clip.subject === cur.key), run: () => paste() },
      { label: "Select all", ico: UI.check(14), key: "Ctrl+A", run: () => { sel = new Set(itemEls().map(keyAt)); paintSel(); } },
      { label: "Refresh", ico: UI.refresh(14), run: async () => { await refresh().catch(() => {}); paint(); } },
    ]);
  }

  /* ── the mouse, the finger and the keys ── */
  let lastTouch = 0;
  body.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") lastTouch = Date.now(); });
  body.addEventListener("click", (e) => {
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
    const el = e.target.closest(".xm-fx__item");
    if (el && !e.target.closest(".xm-fx__rename")) {
      /* a tap on a touch screen opens; a click selects (a double-click opens) */
      if (Date.now() - lastTouch < 600 && !e.ctrlKey && !e.shiftKey && sel.size <= 1) { openItem(el.dataset.k); return; }
      pick(el, e);
      return;
    }
    if (e.target.closest("#xm-fx") && !el) { sel.clear(); paintSel(); }
  });
  body.addEventListener("dblclick", (e) => {
    const el = e.target.closest(".xm-fx__item");
    if (el && !e.target.closest(".xm-fx__rename")) openItem(el.dataset.k);
  });
  body.addEventListener("contextmenu", (e) => {
    if (!e.target.closest("#xm-fx")) return;
    e.preventDefault();
    const el = e.target.closest(".xm-fx__item");
    if (el) { if (!sel.has(el.dataset.k)) pick(el); itemMenu(e.clientX, e.clientY); }
    else { sel.clear(); paintSel(); backMenu(e.clientX, e.clientY); }
  });
  body.addEventListener("input", (e) => {
    if (e.target.id !== "xm-fx-q") return;
    query = e.target.value;
    const at = e.target.selectionStart;
    sel.clear(); paint();
    const q = $("xm-fx-q"); if (q) { q.focus(); q.setSelectionRange(at, at); }
  });

  /* drag and drop: onto a folder, or onto the path bar */
  body.addEventListener("dragstart", (e) => {
    const el = e.target.closest && e.target.closest('.xm-fx__item[draggable="true"]');
    if (!el) return;
    if (!sel.has(el.dataset.k)) { sel = new Set([el.dataset.k]); paintSel(); }
    dragging = [...sel].filter((k) => !k.startsWith("j:"));
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", dragging.join("\n")); } catch { /* the drag still works here */ }
    itemEls().forEach((x) => { if (dragging.includes(x.dataset.k)) x.classList.add("is-drag"); });
  });
  const dropTarget = (e) => {
    if (!dragging) return null;
    const f = e.target.closest && e.target.closest('.xm-fx__item[data-kind="folder"]');
    if (f && !dragging.includes(f.dataset.k)) return { el: f, path: f.dataset.k.slice(2) };
    const c = e.target.closest && e.target.closest("[data-crumb]");
    if (c && c.dataset.crumb !== "~" && cur && c.dataset.crumb !== cur.path) return { el: c, path: c.dataset.crumb };
    return null;
  };
  body.addEventListener("dragover", (e) => {
    const t = dropTarget(e);
    body.querySelectorAll(".is-drop").forEach((x) => { if (!t || x !== t.el) x.classList.remove("is-drop"); });
    if (!t) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    t.el.classList.add("is-drop");
  });
  body.addEventListener("drop", (e) => {
    const t = dropTarget(e);
    if (!t) return;
    e.preventDefault();
    const keys = dragging;
    dragging = null;
    moveInto(keys, t.path);
  });
  body.addEventListener("dragend", () => { dragging = null; body.querySelectorAll(".is-drag, .is-drop").forEach((x) => x.classList.remove("is-drag", "is-drop")); });

  function onKey(e) {
    if (menu && e.key === "Escape") { e.preventDefault(); e.stopPropagation(); shutMenu(); return; }
    if (!box.isConnected) return;
    const typing = e.target.matches && e.target.matches("input, textarea, select");
    if (e.key === "Escape") {
      if (body.querySelector(".xm-fx__ask")) { body.querySelector(".xm-fx__ask [data-no]").click(); e.preventDefault(); return; }
      if (sel.size && !typing) { sel.clear(); paintSel(); e.preventDefault(); return; }
      close(); return;
    }
    if (typing || !e.target.closest || !e.target.closest("#xm-fx")) return;
    const els = itemEls(), at = els.indexOf(document.activeElement);
    const ctrl = e.ctrlKey || e.metaKey;
    const grid = view === "large" || view === "medium";
    const cols = () => {
      if (!grid || els.length < 2) return 1;
      const top = els[0].offsetTop;
      const n = els.findIndex((x) => x.offsetTop !== top);
      return n < 0 ? els.length : n;
    };
    const step = (d) => {
      e.preventDefault();
      const n = Math.max(0, Math.min(els.length - 1, at < 0 ? 0 : at + d));
      if (els[n]) pick(els[n], e.shiftKey ? { shiftKey: true } : null);
    };
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowDown") step(cols());
    else if (e.key === "ArrowUp") step(-cols());
    else if (e.key === "Enter") { e.preventDefault(); const list = selected(); if (list.length === 1) openItem(list[0].k); else if (list.length && list.every((i) => i.kind === "set")) loadSets(list.map((i) => i.ref)); }
    else if (e.key === "Backspace" || (e.altKey && e.key === "ArrowUp")) { e.preventDefault(); goUp(); }
    else if (e.key === "F2") { e.preventDefault(); const list = selected(); if (list.length === 1) rename(elOf(list[0].k)); }
    else if (e.key === "Delete") { e.preventDefault(); if (cur) remove(selected().filter((i) => i.kind !== "subj")); }
    else if (ctrl && e.key.toLowerCase() === "a") { e.preventDefault(); sel = new Set(els.map(keyAt)); paintSel(); }
    else if (ctrl && e.key.toLowerCase() === "x" && cur && sel.size) { e.preventDefault(); clip = { op: "cut", subject: cur.key, keys: [...sel] }; msg(`${sel.size} cut. Open a folder and paste.`); paint(); }
    else if (ctrl && e.key.toLowerCase() === "c" && cur && sel.size) { e.preventDefault(); clip = { op: "copy", subject: cur.key, keys: [...sel] }; msg(`${sel.size} copied.`); }
    else if (ctrl && e.key.toLowerCase() === "v") { e.preventDefault(); paste(); }
  }
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("pointerdown", (e) => { if (menu && !menu.contains(e.target)) shutMenu(); }, true);
  addEventListener("blur", shutMenu);

  /* ── save, into the folder that is open ── */
  $("xm-qb-save").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("xm-qb-name").value.trim();
    const cur0 = bench();
    if (!name) { $("xm-qb-name").focus(); return; }
    if (!cur0.questions.length) { msg("The editor is empty."); return; }
    const s_ = $("xm-qb-subj");
    const label = s_.options[s_.selectedIndex] ? s_.options[s_.selectedIndex].textContent : (cur0.subject || "");
    const folder = cur && cur.key === keyOf(label) ? cur.path : "";
    const same = sets.find((s) => s.name.trim().toLowerCase() === name.toLowerCase());
    const goBtn = $("xm-qb-go");
    if (same && goBtn.dataset.armed !== "1") { goBtn.dataset.armed = "1"; msg("Replace it? Press again."); setTimeout(() => { goBtn.dataset.armed = ""; }, 5000); return; }
    goBtn.dataset.armed = ""; goBtn.disabled = true; msg("…");
    try {
      const r = await api("/api/bank/sets", { name, questions: cur0.questions, subject: label, level: cur0.level, folder });
      msg(`Saved · ${r.count}`);
      await refresh();
      if (cur && cur.key === keyOf(label)) paint(); else go({ subject: keyOf(label) });
    } catch (err) { msg(errText(err)); }
    goBtn.disabled = false;
  });

  /* ── the shared bank, the links, the panel's own buttons ── */
  box.addEventListener("click", async (e) => {
    if (e.target.closest(".xm-qb__back")) { goUp(); return; }
    if (e.target.closest("#xm-qb-copy")) {
      const here = cur ? cur.path : "";
      const list = (links || []).filter((l) => (l.folder || "").startsWith(here));
      const ok = await copyText(whatsappText(list));
      msg(ok ? `Copied ${list.length} links. Paste them into WhatsApp.` : "Could not copy here. Try another browser.");
      return;
    }
    const chip = e.target.closest(".xm-qb__chip");
    if (chip && cur) {
      cur.filters[chip.dataset.f] = chip.dataset.v;
      box.querySelectorAll(`.xm-qb__chip[data-f="${chip.dataset.f}"]`).forEach((c) => c.classList.toggle("is-on", c === chip));
      loadPage();
      return;
    }
    if (e.target.closest(".xm-qb__more")) loadPage(true);
  });
  box.addEventListener("change", (e) => {
    const s = e.target.closest("select[data-f]");
    if (s && cur) { cur.filters[s.dataset.f] = s.value; loadPage(); return; }
    const row = e.target.closest(".xm-qb__q");
    if (row && cur) {
      const it = cur.items.find((x) => x.id === row.dataset.id);
      if (!it) return;
      if (e.target.checked) picked.set(it.id, it.q); else picked.delete(it.id);
      row.classList.toggle("is-on", e.target.checked);
      $("xm-qb-count").textContent = picked.size ? String(picked.size) : "";
      $("xm-qb-add").disabled = !picked.size;
    }
  });
  $("xm-qb-add").addEventListener("click", () => {
    if (!picked.size) return;
    onLoad([...picked.values()], cur ? cur.label : "the question bank");
    close();
  });

  body.innerHTML = `<p class="xm-bk__none">…</p>`;
  try {
    const [r, c] = await Promise.all([
      api("/api/bank/sets"),
      api("/api/bank/browse/subjects").catch(() => ({ subjects: [], mine: 0 })),
    ]);
    sets = r.sets || []; folders = r.folders || {}; cards = c;
  } catch (e) { msg(errText(e)); }
  paint();
  if (focusSave) $("xm-qb-name").focus();
}
