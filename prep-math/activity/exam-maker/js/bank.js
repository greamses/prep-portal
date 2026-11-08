/* ============================================================================
   The question bank, in the Paper Test
   ----------------------------------------------------------------------------
   One panel, organised by SUBJECT CARDS. A card holds two things for that
   subject: the teacher's own saved sets (questions kept under a name) and the
   shared bank (every question the site holds for it), browsed 30 at a time.
   Save puts the editor's questions in a set under the subject chosen beside
   the name. Few words: icons carry the actions, a line under each input.

     GET  /api/bank/sets, /api/bank/sets/:id      the teacher's sets
     POST /api/bank/sets                          save a set
     GET  /api/bank/browse/subjects, /browse?…   the shared bank (server/routes/bank.js)
   ========================================================================== */

import { faceOf } from "/utils/components/workbook/icons.js";
import { UI } from "/utils/components/ui-icons.js";
import { subjectIcon } from "/utils/components/subject-icons.js";
import { TYPES, esc, textHtml } from "./model.js";

const EXAMS = { utme: "UTME", wassce: "WASSCE", postutme: "Post-UTME", cee: "Common Entrance", practice: "Practice", sat: "SAT", igcse: "IGCSE", alevel: "A Level", competition: "Competition" };
const SOURCES = { past: "Past", ai: "Practice", manual: "Written", rephrased: "Reworded", competition: "Competition", teacher: "Mine" };
const SCHOLASTIC_EDITION = { 2022: "1st Edition", 2025: "2nd Edition", "2nd-edition": "2nd Edition", "3rd-edition": "3rd Edition", "4th-edition": "4th Edition", "5th-edition": "5th Edition" };
const compName = (k) => {
  const [c, , y, r] = String(k).split("|");
  const when = c === "scholastic" ? SCHOLASTIC_EDITION[y] || y : y;
  return `${c === "anmc" ? "ANMC" : c === "scholastic" ? "Scholastic" : c} ${when} ${String(r || "").replace(/-/g, " ")}`;
};
/** "Mathematics · General" -> "mathematics" (the same rule the server uses) */
const keyOf = (s) => String(s || "").split("·")[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, "") || "general";
const typeset = (el) => { if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([el]).catch(() => {}); };

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
        <div class="xm-bk__scroll xm-qb__body" id="xm-qb-body" tabindex="0"></div>
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
  const close = () => { box.remove(); document.documentElement.classList.remove("xm-bk-on"); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  faceOf(box.querySelector(".xm-qb__close"), UI.close(18), "Close");
  faceOf(box.querySelector(".xm-qb__back"), UI.chevronLeft ? UI.chevronLeft(18) : UI.arrowLeft(18), "All subjects");
  faceOf($("xm-qb-go"), UI.archiveIn(18), "Save the editor's questions");
  faceOf($("xm-qb-add"), UI.download(18), "Add the ticked questions to the editor");

  let sets = [], cards = { subjects: [], mine: 0 };
  let cur = null;               // the open subject: { key, label, filters, items, next }
  const picked = new Map();     // shared-bank question id -> question
  const msg = (t) => { $("xm-qb-msg").textContent = t || ""; };

  /* every subject: the shared bank's, and any the teacher has saved under */
  function subjects() {
    const map = new Map();
    for (const s of cards.subjects) map.set(s.key, { key: s.key, label: s.label, bank: s.count, mine: 0, s });
    for (const st of sets) {
      const k = keyOf(st.subject);
      if (!map.has(k)) map.set(k, { key: k, label: String(st.subject || "General").split("·")[0].trim() || "General", bank: 0, mine: 0, s: null });
      map.get(k).mine += 1;
    }
    return [...map.values()].sort((a, b) => (b.mine - a.mine) || (b.bank - a.bank));
  }

  function fillSubjectSelect() {
    const sel = $("xm-qb-subj");
    const want = cur ? cur.key : keyOf(now.subject);
    const list = subjects();
    if (!list.some((s) => s.key === want)) list.unshift({ key: want, label: String(now.subject || "General").split("·")[0].trim() || "General" });
    sel.innerHTML = list.map((s) => `<option value="${esc(s.key)}"${s.key === want ? " selected" : ""}>${esc(s.label)}</option>`).join("");
  }

  /* ── the cards ── */
  function paintCards() {
    cur = null;
    box.querySelector(".xm-qb__back").hidden = true;
    $("xm-qb-title").textContent = "Question bank";
    $("xm-qb-foot").hidden = true;
    fillSubjectSelect();
    const list = subjects();
    if (!list.length) { body.innerHTML = `<p class="xm-bk__none">Empty.</p>`; return; }
    body.innerHTML = `<div class="xm-bb__grid">${list.map((s) => `
      <button type="button" class="xm-bb__subj" data-subj="${esc(s.key)}">
        <span class="xm-bb__icon">${subjectIcon(s.key)}</span>
        <span class="xm-bb__name">${esc(s.label)}</span>
        <span class="xm-bb__num">${s.mine ? `${s.mine} saved · ` : ""}${s.bank.toLocaleString()}</span>
      </button>`).join("")}</div>`;
  }

  /* ── one subject: the teacher's sets, then the shared bank ── */
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
    const sel = [select("comp", s.comps, "Paper"), select("topic", s.topics, "Topic"), select("year", s.years, "Year")].join("");
    return chips("scheme", s.schemes, EXAMS) + chips("source", s.sources, SOURCES) + (sel ? `<div class="xm-qb__selects">${sel}</div>` : "");
  }

  function setRow(st) {
    return `<div class="xm-qb__set" data-id="${esc(st.id)}">
      <span class="xm-qb__setname">${esc(st.name)}</span>
      <span class="xm-qb__setnum">${st.count}</span>
      <button type="button" class="xm-qb__icon" data-act="load"></button>
      <button type="button" class="xm-qb__icon" data-act="del"></button>
    </div>`;
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

  function paintSubject() {
    const mine = sets.filter((st) => keyOf(st.subject) === cur.key);
    body.innerHTML = `
      ${mine.length ? `<section class="xm-qb__sec"><h3>Saved</h3>${mine.map(setRow).join("")}</section>` : ""}
      ${cur.s ? `<section class="xm-qb__sec"><h3>Bank</h3>${filterRow(cur.s)}<div class="xm-qb__list" id="xm-qb-list"><p class="xm-bk__none">…</p></div></section>` : ""}`;
    body.querySelectorAll('[data-act="load"]').forEach((b) => faceOf(b, UI.download(16), "Load into the editor"));
    body.querySelectorAll('[data-act="del"]').forEach((b) => faceOf(b, UI.trash(16), "Delete"));
    $("xm-qb-foot").hidden = !cur.s;
    if (cur.s) paintQuestions();
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
    } catch (e) { msg(String((e && e.message) || e).slice(0, 140)); }
    cur.loading = false;
    paintQuestions();
  }

  function openSubject(key) {
    const s = subjects().find((x) => x.key === key);
    if (!s) return;
    cur = { key, label: s.label, s: s.s, filters: {}, items: [], next: null, loading: false };
    box.querySelector(".xm-qb__back").hidden = false;
    $("xm-qb-title").textContent = s.label;
    fillSubjectSelect();
    paintSubject();
    if (cur.s) loadPage();
  }

  function updateFoot() {
    $("xm-qb-count").textContent = picked.size ? String(picked.size) : "";
    $("xm-qb-add").disabled = !picked.size;
  }

  /* ── save ── */
  $("xm-qb-save").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("xm-qb-name").value.trim();
    const cur0 = bench();
    if (!name) { $("xm-qb-name").focus(); return; }
    if (!cur0.questions.length) { msg("The editor is empty."); return; }
    const sel = $("xm-qb-subj");
    const label = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent : (cur0.subject || "");
    const same = sets.find((s) => s.name.trim().toLowerCase() === name.toLowerCase());
    const go = $("xm-qb-go");
    if (same && go.dataset.armed !== "1") { go.dataset.armed = "1"; msg("Replace it? Press again."); setTimeout(() => { go.dataset.armed = ""; }, 5000); return; }
    go.dataset.armed = ""; go.disabled = true; msg("…");
    try {
      const r = await api("/api/bank/sets", { name, questions: cur0.questions, subject: label, level: cur0.level });
      msg(`Saved · ${r.count}`);
      sets = (await api("/api/bank/sets")).sets || [];
      if (cur && cur.key === keyOf(label)) paintSubject(); else openSubject(keyOf(label));
    } catch (err) { msg(String((err && err.message) || err).slice(0, 140)); }
    go.disabled = false;
  });

  /* ── clicks ── */
  const full = new Map();
  const getSet = async (id) => { if (!full.has(id)) full.set(id, (await api(`/api/bank/sets/${id}`)).set); return full.get(id); };
  box.addEventListener("click", async (e) => {
    const subj = e.target.closest("[data-subj]");
    if (subj) { openSubject(subj.dataset.subj); return; }
    if (e.target.closest(".xm-qb__back")) { paintCards(); return; }
    const chip = e.target.closest(".xm-qb__chip");
    if (chip && cur) {
      cur.filters[chip.dataset.f] = chip.dataset.v;
      box.querySelectorAll(`.xm-qb__chip[data-f="${chip.dataset.f}"]`).forEach((c) => c.classList.toggle("is-on", c === chip));
      loadPage();
      return;
    }
    if (e.target.closest(".xm-qb__more")) { loadPage(true); return; }
    const act = e.target.closest("[data-act]");
    if (act) {
      const row = act.closest(".xm-qb__set"), id = row.dataset.id;
      if (act.dataset.act === "load") {
        act.disabled = true;
        try { const set = await getSet(id); onLoad(set.questions || [], set.name); close(); }
        catch (err) { act.disabled = false; msg(String((err && err.message) || err).slice(0, 140)); }
      } else if (act.dataset.act === "del") {
        if (act.dataset.armed !== "1") { act.dataset.armed = "1"; act.classList.add("is-armed"); msg("Delete? Press again."); setTimeout(() => { act.dataset.armed = ""; act.classList.remove("is-armed"); }, 4000); return; }
        act.disabled = true;
        try { await api(`/api/bank/sets/${id}`, {}, "DELETE"); sets = sets.filter((x) => x.id !== id); msg(""); paintSubject(); }
        catch (err) { act.disabled = false; }
      }
    }
  });
  box.addEventListener("change", (e) => {
    const sel = e.target.closest("select[data-f]");
    if (sel && cur) { cur.filters[sel.dataset.f] = sel.value; loadPage(); return; }
    const row = e.target.closest(".xm-qb__q");
    if (row && cur) {
      const it = cur.items.find((x) => x.id === row.dataset.id);
      if (!it) return;
      if (e.target.checked) picked.set(it.id, it.q); else picked.delete(it.id);
      row.classList.toggle("is-on", e.target.checked);
      updateFoot();
    }
  });
  $("xm-qb-add").addEventListener("click", () => {
    if (!picked.size) return;
    onLoad([...picked.values()], cur ? cur.label : "the question bank");
    close();
  });

  body.innerHTML = `<p class="xm-bk__none">…</p>`;
  try {
    [sets, cards] = await Promise.all([
      api("/api/bank/sets").then((r) => r.sets || []),
      api("/api/bank/browse/subjects").catch(() => ({ subjects: [], mine: 0 })),
    ]);
  } catch (e) { msg(String((e && e.message) || e).slice(0, 140)); }
  paintCards();
  if (focusSave) $("xm-qb-name").focus();
}
