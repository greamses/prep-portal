/* ============================================================================
   Browse the ONE question bank, in the Exam Maker
   ----------------------------------------------------------------------------
   Every question the site holds (CBT, past papers, competitions, the teacher's
   own) is one bank on the server (server/lib/one-bank.js). This browses it
   without loading it: it opens on SUBJECT CARDS (an icon, a name and how many
   questions), and a card opens that subject, narrowed by exam, source, topic or
   year, 30 questions at a time. Tick questions and add them to the editor.

   GET /api/bank/browse/subjects   the cards
   GET /api/bank/browse?…          a page of one subject's questions
   ========================================================================== */

import { faceOf } from "/utils/components/workbook/icons.js";
import { UI } from "/utils/components/ui-icons.js";
import { subjectIcon } from "/utils/components/subject-icons.js";
import { TYPES, esc, textHtml } from "./model.js";

const EXAMS = { utme: "UTME", wassce: "WASSCE", postutme: "Post-UTME", cee: "Common Entrance", practice: "Practice", sat: "SAT", igcse: "IGCSE", alevel: "A Level", competition: "Competition", own: "Mine" };
const SOURCES = { past: "Past papers", ai: "Written for practice", manual: "Hand written", rephrased: "Reworded", competition: "Competition papers", teacher: "Mine" };
const plural = (n, w) => `${n.toLocaleString()} ${w}${n === 1 ? "" : "s"}`;
const compName = (k) => { const [c, , y, r] = String(k).split("|"); return `${c === "anmc" ? "ANMC" : c === "scholastic" ? "Scholastic" : c} ${y} ${String(r || "").replace(/-/g, " ")}`; };
const typeset = (el) => { if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([el]).catch(() => {}); };

/** Open the browser over the page. onAdd(questions, label) puts the ticked questions in the editor. */
export async function openBankBrowser({ onAdd }) {
  document.getElementById("xm-bb")?.remove();
  const { api } = await import("/utils/components/workbook/account.js");

  const box = document.createElement("div");
  box.id = "xm-bb";
  box.className = "xm-bk xm-bb";
  box.innerHTML = `
    <div class="pp-receipt xm-bk__card xm-bb__card" role="dialog" aria-modal="true" aria-labelledby="xm-bb-h">
      <div class="pp-receipt__paper xm-bk__paper">
        <header class="xm-bk__head">
          <div><p class="xm-bk__eyebrow">Exam Maker</p><h2 id="xm-bb-h">Question bank</h2></div>
          <button type="button" class="pp-btn pp-btn--ghost xm-bk__close"></button>
        </header>
        <div class="xm-bb__crumbs" id="xm-bb-crumbs"></div>
        <div class="xm-bb__filters" id="xm-bb-filters" hidden></div>
        <div class="xm-bk__scroll" id="xm-bb-body" tabindex="0"><p class="xm-bk__none">Opening the bank…</p></div>
        <div class="xm-bb__foot" id="xm-bb-foot" hidden>
          <span id="xm-bb-count">Nothing ticked yet</span>
          <button type="button" class="pp-btn" id="xm-bb-add" disabled></button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(box);
  document.documentElement.classList.add("xm-bk-on");
  const $ = (id) => box.querySelector(`#${id}`);
  const body = $("xm-bb-body");
  const close = () => { box.remove(); document.documentElement.classList.remove("xm-bk-on"); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  faceOf(box.querySelector(".xm-bk__close"), UI.close(18), "Close the bank");
  box.querySelector(".xm-bk__close").addEventListener("click", close);
  $("xm-bb-add").innerHTML = `<span class="xm-bk__ico">${UI.download(16)}</span><span id="xm-bb-addword">Add to the editor</span>`;

  let cards = null;          // the subjects, from the server
  let cur = null;            // { subject, label, filters, items, next }
  const picked = new Map();  // id -> Exam Maker question

  function updateFoot() {
    $("xm-bb-count").textContent = picked.size ? `${plural(picked.size, "question")} ticked` : "Nothing ticked yet";
    $("xm-bb-add").disabled = !picked.size;
  }

  /* ── the subject cards ── */
  function paintCards() {
    cur = null;
    $("xm-bb-filters").hidden = true;
    $("xm-bb-crumbs").innerHTML = `<b>Subjects</b>`;
    const all = [
      ...(cards.mine ? [{ key: "__mine", label: "My questions", count: cards.mine, icon: subjectIcon("mine") }] : []),
      ...cards.subjects.map((s) => ({ ...s, icon: subjectIcon(s.key) })),
    ];
    body.innerHTML = `<div class="xm-bb__grid">${all.map((s) => `
      <button type="button" class="xm-bb__subj" data-subj="${esc(s.key)}">
        <span class="xm-bb__icon">${s.icon}</span>
        <span class="xm-bb__name">${esc(s.label)}</span>
        <span class="xm-bb__num">${plural(s.count, "question")}</span>
      </button>`).join("")}</div>`;
  }

  /* ── one subject: filters + a page of questions ── */
  function filterBar(s) {
    const chips = (name, map, labels) => {
      const keys = Object.keys(map || {}).filter((k) => map[k] > 0);
      if (keys.length < 2) return "";
      return `<div class="xm-bb__row"><b>${name}</b>${[["", "All"], ...keys.map((k) => [k, labels ? labels[k] || k : k])]
        .map(([k, l]) => `<button type="button" class="xm-bb__chip${(cur.filters[name] || "") === k ? " is-on" : ""}" data-f="${name}" data-v="${esc(k)}">${esc(l)}${k ? ` <i>${map[k]}</i>` : ""}</button>`).join("")}</div>`;
    };
    const select = (name, map, label) => {
      const keys = Object.keys(map || {}).filter((k) => map[k] > 0).sort();
      if (keys.length < 2) return "";
      return `<label class="xm-bb__row"><b>${label}</b><select class="wb-input" data-f="${name}"><option value="">All</option>${keys.map((k) => `<option value="${esc(k)}"${cur.filters[name] === k ? " selected" : ""}>${esc(name === "comp" ? compName(k) : k)} (${map[k]})</option>`).join("")}</select></label>`;
    };
    return [chips("scheme", s.schemes, EXAMS), chips("source", s.sources, SOURCES), select("comp", s.comps, "Paper"), select("topic", s.topics, "Topic"), select("year", s.years, "Year")].join("");
  }

  function qHtml(it) {
    const q = it.q, m = it.meta;
    const tags = [
      TYPES[q.type] ? TYPES[q.type].label : q.type,
      m.mine ? "Mine" : SOURCES[m.source] || m.source,
      m.comp ? compName(m.comp) : EXAMS[m.scheme] || "",
      m.year, m.topic,
    ].filter(Boolean);
    const opts = q.type === "mcq" ? `<ol class="xm-bb__opts">${q.options.map((o, k) => `<li class="${k === q.answer ? "is-key" : ""}">${textHtml(o)}</li>`).join("")}</ol>` : "";
    return `<label class="xm-bb__q${picked.has(it.id) ? " is-on" : ""}" data-id="${esc(it.id)}">
      <input type="checkbox"${picked.has(it.id) ? " checked" : ""} />
      <span class="xm-bb__qbody"><span class="xm-bb__tags">${tags.map((t) => `<span class="xm-bk__tag">${esc(t)}</span>`).join("")}</span>
      <span class="xm-bb__text">${textHtml(q.text)}${q.svg ? ` <em class="xm-bk__dia">with a diagram</em>` : ""}</span>${opts}</span>
    </label>`;
  }

  async function loadPage(more = false) {
    const f = cur.filters;
    const qs = new URLSearchParams();
    if (cur.subject === "__mine") qs.set("mine", "1"); else qs.set("subject", cur.subject);
    for (const k of ["scheme", "source", "topic", "year", "comp"]) if (f[k]) qs.set(k, f[k]);
    if (more && cur.next) qs.set("after", cur.next);
    const btn = body.querySelector(".xm-bb__more");
    if (btn) { btn.disabled = true; btn.textContent = "Opening…"; }
    try {
      const r = await api(`/api/bank/browse?${qs}`);
      cur.items = more ? cur.items.concat(r.items) : r.items;
      cur.next = r.next;
      paintQuestions();
    } catch (e) {
      body.innerHTML = `<p class="xm-bk__none">${esc(String((e && e.message) || e).slice(0, 160))}</p>`;
    }
  }

  function paintQuestions() {
    if (!cur.items.length) { body.innerHTML = `<p class="xm-bk__none">No questions match. Try "All" on one of the filters.</p>`; return; }
    body.innerHTML = `<div class="xm-bb__list">${cur.items.map(qHtml).join("")}</div>
      <div class="xm-bb__listfoot">
        <button type="button" class="pp-btn pp-btn--ghost xm-bb__tickall">Tick all shown</button>
        ${cur.next ? `<button type="button" class="pp-btn pp-btn--ghost xm-bb__more">Show 30 more</button>` : `<span class="xm-bb__end">That is every question here.</span>`}
      </div>`;
    typeset(body);
  }

  function openSubject(key) {
    const s = key === "__mine" ? { key, label: "My questions", schemes: {}, sources: {}, topics: {}, years: {}, comps: {} } : cards.subjects.find((x) => x.key === key);
    if (!s) return;
    cur = { subject: key, label: s.label, s, filters: {}, items: [], next: null };
    $("xm-bb-crumbs").innerHTML = `<button type="button" class="xm-bb__back">Subjects</button><span aria-hidden="true">›</span><b>${esc(s.label)}</b>`;
    const fb = $("xm-bb-filters");
    fb.innerHTML = filterBar(s);
    fb.hidden = !fb.innerHTML.trim();
    $("xm-bb-foot").hidden = false;
    body.innerHTML = `<p class="xm-bk__none">Opening ${esc(s.label)}…</p>`;
    loadPage();
  }

  /* ── events ── */
  box.addEventListener("click", (e) => {
    const subj = e.target.closest("[data-subj]");
    if (subj) { openSubject(subj.dataset.subj); return; }
    if (e.target.closest(".xm-bb__back")) { paintCards(); return; }
    const chip = e.target.closest(".xm-bb__chip");
    if (chip && cur) {
      cur.filters[chip.dataset.f] = chip.dataset.v;
      $("xm-bb-filters").innerHTML = filterBar(cur.s);
      body.innerHTML = `<p class="xm-bk__none">Opening…</p>`;
      loadPage();
      return;
    }
    if (e.target.closest(".xm-bb__more")) { loadPage(true); return; }
    if (e.target.closest(".xm-bb__tickall") && cur) {
      cur.items.forEach((it) => picked.set(it.id, it.q));
      body.querySelectorAll(".xm-bb__q").forEach((el) => { el.classList.add("is-on"); el.querySelector("input").checked = true; });
      updateFoot();
    }
  });
  box.addEventListener("change", (e) => {
    const sel = e.target.closest("select[data-f]");
    if (sel && cur) { cur.filters[sel.dataset.f] = sel.value; body.innerHTML = `<p class="xm-bk__none">Opening…</p>`; loadPage(); return; }
    const row = e.target.closest(".xm-bb__q");
    if (row && cur) {
      const it = cur.items.find((x) => x.id === row.dataset.id);
      if (!it) return;
      if (e.target.checked) picked.set(it.id, it.q); else picked.delete(it.id);
      row.classList.toggle("is-on", e.target.checked);
      updateFoot();
    }
  });
  $("xm-bb-add").addEventListener("click", () => {
    if (!picked.size) return;
    onAdd([...picked.values()], cur ? cur.label : "the question bank");
    close();
  });

  try {
    cards = await api("/api/bank/browse/subjects");
    if (!cards.subjects.length && !cards.mine) { body.innerHTML = `<p class="xm-bk__none">The bank is empty.</p>`; return; }
    paintCards();
  } catch (e) {
    body.innerHTML = `<p class="xm-bk__none">${esc(String((e && e.message) || e).slice(0, 160))}</p>`;
  }
}
