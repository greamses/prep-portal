/* ============================================================================
   The teacher's saved exams, in the Exam Maker
   ----------------------------------------------------------------------------
   A whole paper (school heading, settings and every question) kept with the teacher's
   account (the server's /api/exams), not in this browser, so it can be opened again on
   any machine, changed and set again. The question bank (bank.js) keeps single
   questions; this keeps a finished exam.
   ========================================================================== */

import { faceOf } from "/utils/components/workbook/icons.js";
import { UI } from "/utils/components/ui-icons.js";
import { esc } from "./model.js";

const ID_KEY = "xm-exam-id";
/** The exam on the bench was opened from, or last saved to, this shelf entry. */
export const currentExamId = () => { try { return localStorage.getItem(ID_KEY) || ""; } catch { return ""; } };
export const setCurrentExamId = (id) => { try { id ? localStorage.setItem(ID_KEY, id) : localStorage.removeItem(ID_KEY); } catch { /* not kept */ } };

const when = (ms) => (ms ? new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

/**
 * Save the whole exam. With an id it overwrites that exam, without one it is a new exam.
 * Returns { id, title, questions } or throws with the server's words.
 */
export async function saveExam({ id = "", title = "", head, questions }) {
  const { api } = await import("/utils/components/workbook/account.js");
  const r = await api("/api/exams", { id, title, head, questions });
  setCurrentExamId(r.id);
  return r;
}

/**
 * Open the shelf as a panel over the page.
 *   onOpen(exam)  the full exam { id, title, head, questions }, to put on the bench
 *   onGone(id)    an exam was deleted
 */
export async function openExams({ onOpen, onGone = () => {} }) {
  document.getElementById("xm-exams")?.remove();
  const { api } = await import("/utils/components/workbook/account.js");

  const box = document.createElement("div");
  box.id = "xm-exams";
  box.className = "xm-qbank";
  box.innerHTML = `
    <div class="pp-receipt xm-qbank__card" role="dialog" aria-modal="true" aria-label="My exams">
      <div class="pp-receipt__paper xm-qbank__paper">
        <div class="xm-qbank__head"><h2>My exams</h2><button type="button" class="pp-btn xm-qbank__close"></button></div>
        <p class="xm-qbank__msg" id="xm-ex-msg" role="status">Opening your exams…</p>
        <ul class="xm-qbank__list" id="xm-ex-list"></ul>
      </div>
    </div>`;
  document.body.appendChild(box);

  const $ = (id) => box.querySelector(`#${id}`);
  faceOf(box.querySelector(".xm-qbank__close"), UI.close(18), "Close my exams");
  const close = () => { box.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  box.addEventListener("pointerdown", (e) => { if (e.target === box) close(); });
  box.querySelector(".xm-qbank__close").addEventListener("click", close);

  let items = [];
  const armed = new Map(); // id → timer of a delete waiting for its second press

  function paint() {
    const now = currentExamId();
    $("xm-ex-list").innerHTML = items.map((x) => `<li class="xm-qbank__item xm-ex" data-id="${esc(x.id)}">`
      + `<div class="xm-ex__main"><b class="xm-ex__title">${esc(x.title)}</b>`
      + `<small>${esc([x.subject, x.klass].filter(Boolean).join(" · "))}${x.subject || x.klass ? " · " : ""}${x.questions} question${x.questions === 1 ? "" : "s"} · ${x.marks} mark${x.marks === 1 ? "" : "s"} · saved ${esc(when(x.savedAt))}${x.id === now ? " · on the bench" : ""}</small></div>`
      + `<button type="button" class="pp-btn" data-do="open"></button><button type="button" class="pp-btn" data-do="del"></button></li>`).join("");
    box.querySelectorAll(".xm-ex").forEach((li) => {
      faceOf(li.querySelector('[data-do="open"]'), UI.open(18), "Open this exam on the bench");
      faceOf(li.querySelector('[data-do="del"]'), UI.trash(18), "Delete this exam");
    });
    $("xm-ex-msg").textContent = items.length ? "" : "Nothing saved yet. Build an exam, then press the save-exam key to keep the whole paper here.";
  }

  async function load() {
    try { items = (await api("/api/exams")).items; paint(); }
    catch (e) { $("xm-ex-msg").textContent = String((e && e.message) || e).slice(0, 160); }
  }

  $("xm-ex-list").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-do]"); if (!btn) return;
    const li = btn.closest(".xm-ex"), id = li.dataset.id;
    if (btn.dataset.do === "open") {
      try {
        $("xm-ex-msg").textContent = "Opening…";
        const full = await api(`/api/exams/${id}`);
        onOpen(full);
        close();
      } catch (err) { $("xm-ex-msg").textContent = String((err && err.message) || err).slice(0, 160); }
      return;
    }
    /* two presses to delete: the first only asks */
    if (!armed.has(id)) {
      armed.set(id, setTimeout(() => { armed.delete(id); faceOf(btn, UI.trash(18), "Delete this exam"); }, 4000));
      faceOf(btn, UI.trash(18), "Press again to delete this exam for good");
      return;
    }
    clearTimeout(armed.get(id)); armed.delete(id);
    try {
      await api(`/api/exams/${id}`, undefined, "DELETE");
      if (currentExamId() === id) setCurrentExamId("");
      onGone(id);
      await load();
      $("xm-ex-msg").textContent = "Deleted.";
    } catch (err) { $("xm-ex-msg").textContent = String((err && err.message) || err).slice(0, 160); }
  });

  await load();
}
