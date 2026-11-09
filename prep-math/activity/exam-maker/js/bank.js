/* ============================================================================
   The question bank, in the Paper Test Builder
   ----------------------------------------------------------------------------
   The teacher's saved sets, in folders, one tree per subject, worked with the
   site's one file explorer (utils/components/file-explorer.js: views, path
   bar, search, drag and drop, right-click menu, keys). Under it, at a
   subject's top, the shared bank (every question the site holds for it) is
   browsed 30 at a time; in a Competitions folder the admin gets the links.
   Save puts the editor's questions in a set in the folder that is open.

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
import { mountExplorer, SHEET_SVG } from "/utils/components/file-explorer.js";
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
const errText = (e) => String((e && e.message) || e).slice(0, 140);

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
          <button type="submit" class="xm-qb__icon" id="xm-qb-go"${now.questions.length ? "" : " disabled"}></button>
        </form>
        <p class="xm-qb__msg" id="xm-qb-msg" role="status"></p>
        <div class="xm-bk__scroll xm-qb__body" id="xm-qb-body" tabindex="-1">
          <div id="xm-qb-fx"></div>
          <div id="xm-qb-extra"></div>
        </div>
        <div class="xm-qb__foot" id="xm-qb-foot" hidden>
          <span id="xm-qb-count"></span>
          <button type="button" class="xm-qb__icon xm-qb__add" id="xm-qb-add" disabled></button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(box);
  document.documentElement.classList.add("xm-bk-on");
  const $ = (id) => box.querySelector(`#${id}`);
  const extra = $("xm-qb-extra");
  let fx = null;
  const close = () => { if (fx) fx.destroy(); box.remove(); document.documentElement.classList.remove("xm-bk-on"); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape" && !e.defaultPrevented && !(fx && fx.busy())) close(); };
  document.addEventListener("keydown", onKey);
  box.addEventListener("click", (e) => { if (e.target === box || e.target.closest(".xm-qb__close")) close(); });
  faceOf(box.querySelector(".xm-qb__close"), UI.close(18), "Close");
  faceOf(box.querySelector(".xm-qb__back"), UI.chevronLeft(18), "Up a folder");
  faceOf($("xm-qb-go"), UI.archiveIn(18), "Save the editor's questions in the folder that is open");
  faceOf($("xm-qb-add"), UI.download(18), "Add the ticked questions to the editor");

  let sets = [], folders = {}, cards = { subjects: [], mine: 0 };
  let where = null;             // where the explorer is: null (the top) or { root, label, path }
  let bank = null;              // the shared bank's list for the open subject: { key, s, filters, items, next, loading }
  let links = null;             // the admin's competition links (null until asked)
  const picked = new Map();     // shared-bank question id -> question
  const msg = (t) => { $("xm-qb-msg").textContent = t || ""; };

  function subjects() {
    const map = new Map();
    const add = (k, label) => { if (!map.has(k)) map.set(k, { key: k, label, bank: 0, mine: 0, s: null }); return map.get(k); };
    for (const s of cards.subjects) Object.assign(add(s.key, s.label), { bank: s.count, s });
    for (const st of sets) add(keyOf(st.subject), String(st.subject || "General").split("·")[0].trim() || "General").mine += 1;
    for (const k of Object.keys(folders)) if ((folders[k] || []).length) add(k, k.charAt(0).toUpperCase() + k.slice(1));
    return [...map.values()].sort((a, b) => (b.mine - a.mine) || (b.bank - a.bank));
  }
  const refresh = async () => { const r = await api("/api/bank/sets"); sets = r.sets || []; folders = r.folders || {}; };

  /* ── loading sets into the editor ── */
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

  /* ── under the explorer: the shared bank (a subject's top) and the competition links ── */
  function filterRow(s) {
    if (!s) return "";
    const chips = (name, map, labels) => {
      const keys = Object.keys(map || {}).filter((k) => map[k] > 0);
      if (keys.length < 2) return "";
      return `<div class="xm-qb__chips">${[["", "All"], ...keys.map((k) => [k, labels ? labels[k] || k : k])]
        .map(([k, l]) => `<button type="button" class="xm-qb__chip${(bank.filters[name] || "") === k ? " is-on" : ""}" data-f="${name}" data-v="${esc(k)}">${esc(l)}</button>`).join("")}</div>`;
    };
    const select = (name, map, label) => {
      const keys = Object.keys(map || {}).filter((k) => map[k] > 0).sort();
      if (keys.length < 2) return "";
      return `<select class="xm-qb__line" data-f="${name}" aria-label="${label}"><option value="">${label}</option>${keys.map((k) => `<option value="${esc(k)}"${bank.filters[name] === k ? " selected" : ""}>${esc(name === "comp" ? compName(k) : k)}</option>`).join("")}</select>`;
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
  function paintExtra() {
    const top = where && !where.path;
    box.querySelector(".xm-qb__back").hidden = !where;
    $("xm-qb-title").textContent = !where ? "Question bank" : where.path ? where.path.slice(where.path.lastIndexOf("/") + 1) : where.label;
    const compLinks = where && /^Competitions(\/|$)/.test(where.path) && links && links.length ? links.filter((l) => (l.folder || "").startsWith(where.path)) : [];
    extra.innerHTML = `
      ${compLinks.length ? `<section class="xm-qb__sec xm-qb__links"><h3>Links</h3>
        <p class="xm-qb__linknote">${compLinks.length} ${compLinks.length === 1 ? "paper" : "papers"} · one try · camera on · OMR sheet</p>
        <button type="button" class="xm-qb__copyall" id="xm-qb-copy">Copy all for WhatsApp</button></section>` : ""}
      ${top && bank && bank.s ? `<section class="xm-qb__sec"><h3>Bank</h3>${filterRow(bank.s)}<div class="xm-qb__list" id="xm-qb-list"><p class="xm-bk__none">…</p></div></section>` : ""}`;
    $("xm-qb-foot").hidden = !(top && bank && bank.s);
    if (top && bank && bank.s) paintQuestions();
  }
  function paintQuestions() {
    const list = $("xm-qb-list");
    if (!list || !bank) return;
    if (!bank.items.length) { list.innerHTML = `<p class="xm-bk__none">${bank.loading ? "…" : "None."}</p>`; return; }
    list.innerHTML = bank.items.map(qRow).join("") + (bank.next ? `<button type="button" class="xm-qb__more">More</button>` : "");
    typeset(list);
  }
  async function loadPage(more = false) {
    const f = bank.filters, qs = new URLSearchParams({ subject: bank.key });
    for (const k of ["scheme", "source", "topic", "year", "comp"]) if (f[k]) qs.set(k, f[k]);
    if (more && bank.next) qs.set("after", bank.next);
    bank.loading = true;
    if (!more) paintQuestions();
    try {
      const r = await api(`/api/bank/browse?${qs}`);
      bank.items = more ? bank.items.concat(r.items) : r.items;
      bank.next = r.next;
    } catch (e) { msg(errText(e)); }
    bank.loading = false;
    paintQuestions();
  }

  function navigated(w) {
    where = w;
    if (w && (!bank || bank.key !== w.root)) {
      const s = subjects().find((x) => x.key === w.root);
      bank = { key: w.root, s: s && s.s, filters: {}, items: [], next: null, loading: false };
    }
    paintExtra();
    if (w && !w.path && bank && bank.s && !bank.items.length) loadPage();
    if (w && links === null && /^Competitions(\/|$)/.test(w.path)) {
      links = [];
      api("/api/bank/comp-links").then((r) => { links = r.links || []; if (where && /^Competitions/.test(where.path)) paintExtra(); }).catch(() => { links = []; });
    }
  }

  /* ── save, into the folder that is open ── */
  $("xm-qb-save").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("xm-qb-name").value.trim();
    const cur0 = bench();
    if (!name) { $("xm-qb-name").focus(); return; }
    if (!cur0.questions.length) { msg("The editor is empty."); return; }
    /* into the subject and folder that are open; at the top, under the editor's own subject */
    const label = where ? where.label : String(cur0.subject || "General").split("·")[0].trim() || "General";
    const folder = where ? where.path : "";
    const same = sets.find((s) => s.name.trim().toLowerCase() === name.toLowerCase());
    const goBtn = $("xm-qb-go");
    if (same && goBtn.dataset.armed !== "1") { goBtn.dataset.armed = "1"; msg("Replace it? Press again."); setTimeout(() => { goBtn.dataset.armed = ""; }, 5000); return; }
    goBtn.dataset.armed = ""; goBtn.disabled = true; msg("…");
    try {
      const r = await api("/api/bank/sets", { name, questions: cur0.questions, subject: label, level: cur0.level, folder });
      msg(`Saved · ${r.count}`);
      await refresh();
      if (where && where.root === keyOf(label)) fx.paint(); else fx.go({ root: keyOf(label) });
    } catch (err) { msg(errText(err)); }
    goBtn.disabled = false;
  });

  /* ── the panel's own buttons, the links, the shared bank ── */
  box.addEventListener("click", async (e) => {
    if (e.target.closest(".xm-qb__back")) { fx.goUp(); return; }
    if (e.target.closest("#xm-qb-copy")) {
      const here = where ? where.path : "";
      const list = (links || []).filter((l) => (l.folder || "").startsWith(here));
      const ok = await copyText(whatsappText(list));
      msg(ok ? `Copied ${list.length} links. Paste them into WhatsApp.` : "Could not copy here. Try another browser.");
      return;
    }
    const chip = e.target.closest(".xm-qb__chip");
    if (chip && bank) {
      bank.filters[chip.dataset.f] = chip.dataset.v;
      box.querySelectorAll(`.xm-qb__chip[data-f="${chip.dataset.f}"]`).forEach((c) => c.classList.toggle("is-on", c === chip));
      loadPage();
      return;
    }
    if (e.target.closest(".xm-qb__more")) loadPage(true);
  });
  box.addEventListener("change", (e) => {
    const s = e.target.closest("select[data-f]");
    if (s && bank) { bank.filters[s.dataset.f] = s.value; loadPage(); return; }
    const row = e.target.closest(".xm-qb__q");
    if (row && bank) {
      const it = bank.items.find((x) => x.id === row.dataset.id);
      if (!it) return;
      if (e.target.checked) picked.set(it.id, it.q); else picked.delete(it.id);
      row.classList.toggle("is-on", e.target.checked);
      $("xm-qb-count").textContent = picked.size ? String(picked.size) : "";
      $("xm-qb-add").disabled = !picked.size;
    }
  });
  $("xm-qb-add").addEventListener("click", () => {
    if (!picked.size) return;
    onLoad([...picked.values()], where ? where.label : "the question bank");
    close();
  });

  $("xm-qb-fx").innerHTML = `<p class="xm-bk__none">…</p>`;
  try {
    const [r, c] = await Promise.all([
      api("/api/bank/sets"),
      api("/api/bank/browse/subjects").catch(() => ({ subjects: [], mine: 0 })),
    ]);
    sets = r.sets || []; folders = r.folders || {}; cards = c;
  } catch (e) { msg(errText(e)); }

  const labelOf = (key) => (subjects().find((s) => s.key === key) || {}).label || key;
  fx = mountExplorer($("xm-qb-fx"), {
    key: "xm-qb",
    top: "Question bank",
    rootType: "Subject",
    roots: () => subjects().map((s) => ({ key: s.key, label: s.label, icon: subjectIcon(s.key), meta: `${s.mine ? `${s.mine} saved · ` : ""}${s.bank.toLocaleString()} in the bank` })),
    files: () => sets.map((st) => ({ id: st.id, root: keyOf(st.subject), folder: st.folder || "", name: st.name, count: st.count, date: st.savedAt || 0 })),
    folders: () => folders,
    file: { type: "Question set", icon: SHEET_SVG, word: ["question", "questions"], open: "Load into the editor" },
    openMany: (n) => `Load ${n} sets into the editor`,
    empty: "This folder is empty. Right-click for a new folder, or save the editor's questions here.",
    open: (ids) => loadSets(ids),
    msg,
    onNavigate: navigated,
    ops: {
      newFolder: (root, label, path) => api("/api/bank/folders", { subject: label || labelOf(root), path }),
      moveFolder: (root, label, from, to) => api("/api/bank/folders/move", { subject: label || labelOf(root), from, to }),
      deleteFolder: (root, label, path) => api("/api/bank/folders", { subject: label || labelOf(root), path, recursive: true }, "DELETE"),
      moveFiles: (ids, folder) => api("/api/bank/sets/move", { ids, folder }),
      renameFile: async (id, name) => { const r = await api(`/api/bank/sets/${id}/rename`, { name }); full.delete(id); return r; },
      copyFile: (id, folder) => api(`/api/bank/sets/${id}/copy`, { folder }),
      deleteFile: (id) => api(`/api/bank/sets/${id}`, {}, "DELETE"),
      refresh,
    },
  });
  paintExtra();
  if (focusSave) $("xm-qb-name").focus();
}
