/* ============================================================================
   The question bank, in the Exam Maker
   ----------------------------------------------------------------------------
   Questions are kept with the teacher (the server's /api/bank), not with a
   paper, so a question written once can go on any paper. Saving is by what a
   question says: the same question twice is one. This is the picker that puts
   them back on a paper, and takes them out of the bank.
   ========================================================================== */

import { faceOf } from "/utils/components/workbook/icons.js";
import { UI } from "/utils/components/ui-icons.js";
import { TYPES, esc } from "./model.js";

/** Keep these questions in the bank. Quiet when it fails: a bank that is down must not stop a paper. */
export async function saveToBank(questions, meta = {}) {
  try {
    const { api } = await import("/utils/components/workbook/account.js");
    const r = await api("/api/bank", { questions, ...meta });
    return r.saved || 0;
  } catch { return -1; }
}

/**
 * Open the bank as a panel over the page.
 *   onAdd(items)  the chosen questions, to go on the paper
 */
export async function openBank({ onAdd }) {
  document.getElementById("xm-qbank")?.remove();
  const { api } = await import("/utils/components/workbook/account.js");

  const box = document.createElement("div");
  box.id = "xm-qbank";
  box.className = "xm-qbank";
  box.innerHTML = `
    <div class="pp-receipt xm-qbank__card" role="dialog" aria-modal="true" aria-label="My question bank">
      <div class="pp-receipt__paper xm-qbank__paper">
        <div class="xm-qbank__head"><h2>My question bank</h2><button type="button" class="pp-btn xm-qbank__close"></button></div>
        <div class="xm-qbank__filters">
          <input type="search" class="wb-input" id="xm-qb-q" placeholder="Search the questions" aria-label="Search the questions" autocomplete="off" />
          <select class="wb-select" id="xm-qb-type" aria-label="Kind of question"><option value="">All kinds</option>${Object.keys(TYPES).map((k) => `<option value="${k}">${esc(TYPES[k].label)}</option>`).join("")}</select>
          <select class="wb-select" id="xm-qb-subject" aria-label="Subject"><option value="">All subjects</option></select>
        </div>
        <p class="xm-qbank__msg" id="xm-qb-msg" role="status">Opening your bank…</p>
        <ul class="xm-qbank__list" id="xm-qb-list"></ul>
        <div class="xm-qbank__foot">
          <span id="xm-qb-count"></span>
          <span class="xm-qbank__sp"></span>
          <button type="button" class="pp-btn" id="xm-qb-add"></button>
          <button type="button" class="pp-btn" id="xm-qb-del"></button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(box);

  const $ = (id) => box.querySelector(`#${id}`);
  const picked = new Set();
  let items = [];
  let subjects = [];

  faceOf(box.querySelector(".xm-qbank__close"), UI.close(18), "Close the bank");
  faceOf($("xm-qb-add"), UI.plus(18), "Add the selected questions to the paper");
  faceOf($("xm-qb-del"), UI.trash(18), "Remove the selected questions from the bank");

  const close = () => { box.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  box.addEventListener("pointerdown", (e) => { if (e.target === box) close(); });
  box.querySelector(".xm-qbank__close").addEventListener("click", close);

  function paint() {
    const list = $("xm-qb-list");
    list.innerHTML = items.map((q) => `<li class="xm-qbank__item">`
      + `<label><input type="checkbox" data-id="${esc(q.id)}" ${picked.has(q.id) ? "checked" : ""} aria-label="Select this question" />`
      + `<span class="xm-qbank__kind">${esc(TYPES[q.type] ? TYPES[q.type].label : q.type)}</span>`
      + `<span class="xm-qbank__text">${esc(q.text.length > 220 ? q.text.slice(0, 220) + "…" : q.text)}</span></label>`
      + `<small>${esc([q.subject, q.topic].filter(Boolean).join(" · "))}</small></li>`).join("");
    $("xm-qb-count").textContent = `${picked.size} selected · ${items.length} shown`;
    $("xm-qb-add").disabled = !picked.size; $("xm-qb-del").disabled = !picked.size;
    $("xm-qb-msg").textContent = items.length ? "" : "Nothing here. Questions you write, generate or share are kept in your bank, and you can save the ones on this paper with the bank button.";
  }

  async function load() {
    const q = new URLSearchParams();
    if ($("xm-qb-type").value) q.set("type", $("xm-qb-type").value);
    if ($("xm-qb-subject").value) q.set("subject", $("xm-qb-subject").value);
    if ($("xm-qb-q").value.trim()) q.set("q", $("xm-qb-q").value.trim());
    try {
      const d = await api(`/api/bank?${q}`);
      items = d.items;
      if (!subjects.length && d.subjects.length) {
        subjects = d.subjects;
        $("xm-qb-subject").innerHTML = `<option value="">All subjects</option>` + subjects.map((s) => `<option>${esc(s)}</option>`).join("");
      }
      [...picked].forEach((id) => { if (!items.some((x) => x.id === id)) picked.delete(id); });
      paint();
    } catch (e) { $("xm-qb-msg").textContent = String((e && e.message) || e).slice(0, 160); }
  }

  let t = 0;
  $("xm-qb-q").addEventListener("input", () => { clearTimeout(t); t = setTimeout(load, 300); });
  $("xm-qb-type").addEventListener("change", load);
  $("xm-qb-subject").addEventListener("change", load);
  $("xm-qb-list").addEventListener("change", (e) => {
    const id = e.target.dataset.id; if (!id) return;
    e.target.checked ? picked.add(id) : picked.delete(id); paint();
  });
  $("xm-qb-add").addEventListener("click", () => {
    const chosen = items.filter((q) => picked.has(q.id));
    if (!chosen.length) return;
    onAdd(chosen);
    $("xm-qb-msg").textContent = `${chosen.length} added to the paper.`;
    picked.clear(); paint();
  });
  /* two presses to remove: the first only asks */
  let armed = 0;
  $("xm-qb-del").addEventListener("click", async () => {
    if (!picked.size) return;
    if (!armed) {
      armed = setTimeout(() => { armed = 0; faceOf($("xm-qb-del"), UI.trash(18), "Remove the selected questions from the bank"); }, 4000);
      faceOf($("xm-qb-del"), UI.trash(18), `Press again to remove ${picked.size} for good`);
      return;
    }
    clearTimeout(armed); armed = 0;
    faceOf($("xm-qb-del"), UI.trash(18), "Remove the selected questions from the bank");
    try {
      const r = await api("/api/bank", { ids: [...picked] }, "DELETE");
      picked.clear();
      await load();
      $("xm-qb-msg").textContent = `Removed ${r.removed}.`;
    } catch (e) { $("xm-qb-msg").textContent = String((e && e.message) || e).slice(0, 160); }
  });

  await load();
}
