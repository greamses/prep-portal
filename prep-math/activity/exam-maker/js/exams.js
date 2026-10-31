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
        <div class="xm-qbank__head"><h2>Everything I have built</h2><button type="button" class="pp-btn xm-qbank__close"></button></div>
        <div class="xm-ex__scope" id="xm-ex-scope" role="group" aria-label="Whose work" hidden>
          <button type="button" class="pp-btn" data-scope="mine" aria-pressed="true">Mine</button>
          <button type="button" class="pp-btn" data-scope="all" aria-pressed="false">All teachers</button>
        </div>
        <p class="xm-qbank__msg" id="xm-ex-msg" role="status">Opening your work…</p>
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
  let scope = "mine";
  const KIND = { exam: "Exam", paper: "Paper link", workbook: "Workbook" };
  const LINK = { paper: (c) => `/paper/${c}`, workbook: (c) => `/wb/${c}` };
  const armed = new Map(); // "kind:id" → timer of a delete waiting for its second press

  function paint() {
    const now = currentExamId();
    $("xm-ex-list").innerHTML = items.map((x, i) => {
      const bits = [[x.subject, x.klass].filter(Boolean).join(" · ")];
      if (x.kind !== "workbook") bits.push(`${x.questions} question${x.questions === 1 ? "" : "s"}`, `${x.marks} mark${x.marks === 1 ? "" : "s"}`);
      if (x.kind !== "exam") bits.push(`${x.students} student${x.students === 1 ? "" : "s"} sent it back`);
      bits.push(`${x.kind === "exam" ? "saved" : "shared"} ${when(x.savedAt)}`);
      if (scope === "all" && x.owner) bits.push(`by ${x.owner}`);
      if (x.kind === "exam" && x.id === now) bits.push("on the bench");
      return `<li class="xm-qbank__item xm-ex" data-i="${i}">`
        + `<div class="xm-ex__main"><b class="xm-ex__title"><span class="xm-qbank__kind">${KIND[x.kind]}</span> ${esc(x.title)}</b>`
        + `<small>${esc(bits.filter(Boolean).join(" · "))}</small></div>`
        + (x.kind === "exam" ? `<button type="button" class="pp-btn" data-do="open"></button>` : `<a class="pp-btn" data-do="link" href="${esc(LINK[x.kind](x.id))}" target="_blank" rel="noopener"></a>`)
        + `<button type="button" class="pp-btn" data-do="del"></button></li>`;
    }).join("");
    box.querySelectorAll(".xm-ex").forEach((li) => {
      const x = items[+li.dataset.i];
      if (x.kind === "exam") faceOf(li.querySelector('[data-do="open"]'), UI.open(18), "Open this exam on the bench");
      else faceOf(li.querySelector('[data-do="link"]'), UI.external(18), x.kind === "paper" ? "Open the paper link" : "Open the workbook link");
      faceOf(li.querySelector('[data-do="del"]'), UI.trash(18), `Delete this ${KIND[x.kind].toLowerCase()}`);
    });
    $("xm-ex-msg").textContent = items.length ? "" : "Nothing yet. Save an exam with the save-exam key, share a paper, or assign a workbook, and it appears here.";
  }

  async function load() {
    try {
      const d = await api(`/api/exams/built?scope=${scope}`);
      items = d.items;
      $("xm-ex-scope").hidden = !d.admin;
      paint();
    } catch (e) { $("xm-ex-msg").textContent = String((e && e.message) || e).slice(0, 160); }
  }

  /* the administrator's switch between their own work and every teacher's */
  $("xm-ex-scope").addEventListener("click", (e) => {
    const b = e.target.closest("[data-scope]"); if (!b || b.dataset.scope === scope) return;
    scope = b.dataset.scope;
    $("xm-ex-scope").querySelectorAll("[data-scope]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("xm-ex-msg").textContent = "Gathering…"; $("xm-ex-list").innerHTML = "";
    load();
  });

  $("xm-ex-list").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-do]"); if (!btn) return;
    if (btn.dataset.do === "link") return; // an ordinary link: the browser opens it
    const li = btn.closest(".xm-ex"), x = items[+li.dataset.i], id = x.id, key = `${x.kind}:${id}`;
    if (btn.dataset.do === "open") {
      try {
        $("xm-ex-msg").textContent = "Opening…";
        const full = await api(`/api/exams/${id}${scope === "all" && x.ownerUid ? `?ownerUid=${encodeURIComponent(x.ownerUid)}` : ""}`);
        onOpen(full);
        close();
      } catch (err) { $("xm-ex-msg").textContent = String((err && err.message) || err).slice(0, 160); }
      return;
    }
    /* two presses to delete: the first only asks */
    const what = KIND[x.kind].toLowerCase();
    if (!armed.has(key)) {
      armed.set(key, setTimeout(() => { armed.delete(key); faceOf(btn, UI.trash(18), `Delete this ${what}`); }, 4000));
      faceOf(btn, UI.trash(18), x.kind === "exam" ? "Press again to delete this exam for good" : `Press again: the ${what} and the scores sent back to it go for good`);
      return;
    }
    clearTimeout(armed.get(key)); armed.delete(key);
    try {
      await api("/api/exams/built", { kind: x.kind, id, ownerUid: x.ownerUid }, "DELETE");
      if (x.kind === "exam" && currentExamId() === id) setCurrentExamId("");
      onGone(id);
      await load();
      $("xm-ex-msg").textContent = "Deleted.";
    } catch (err) { $("xm-ex-msg").textContent = String((err && err.message) || err).slice(0, 160); }
  });

  await load();
}
