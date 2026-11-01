/* ============================================================================
   The question bank, in the Exam Maker
   ----------------------------------------------------------------------------
   A bank is a whole set of questions kept under a name the teacher gives it (the server's /api/bank/sets),
   not single questions. Save puts every question on the bench into a bank of that name (the same name
   again replaces it). Load puts a bank's questions into the editor, AFTER what is already there, where
   they can be changed. To merge banks: load one, tick the questions to keep and delete the rest, load the
   next, and so on (main.js has the ticks and "Delete unticked").
   ========================================================================== */

import { faceOf } from "/utils/components/workbook/icons.js";
import { UI } from "/utils/components/ui-icons.js";
import { TYPES, esc, textHtml } from "./model.js";

const when = (ms) => (ms ? new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const typeLine = (types = {}) => Object.keys(TYPES).filter((k) => types[k]).map((k) => `${types[k]} ${TYPES[k].label.toLowerCase()}`).join(" · ");

/**
 * Open the bank over the page.
 *   bench()                   { questions, subject, level, name }: what is on the bench now (for Save)
 *   onLoad(questions, name)   a bank's questions, to add to the editor
 *   focusSave                 open with the name box ready (the Save key)
 */
export async function openBank({ bench, onLoad, focusSave = false }) {
  document.getElementById("xm-bk")?.remove();
  const { api } = await import("/utils/components/workbook/account.js");
  const now = bench();

  const box = document.createElement("div");
  box.id = "xm-bk";
  box.className = "xm-bk";
  box.innerHTML = `
    <div class="pp-receipt xm-bk__card" role="dialog" aria-modal="true" aria-labelledby="xm-bk-h">
      <div class="pp-receipt__paper xm-bk__paper">
        <header class="xm-bk__head">
          <div><p class="xm-bk__eyebrow">Exam Maker</p><h2 id="xm-bk-h">Question bank</h2></div>
          <button type="button" class="pp-btn pp-btn--ghost xm-bk__close"></button>
        </header>

        <section class="xm-bk__save">
          <label for="xm-bk-name"><b>Save the questions in the editor</b><span>${now.questions.length ? `${plural(now.questions.length, "question")} will be kept as one bank. Saving under a name you already used replaces that bank.` : "There are no questions in the editor yet."}</span></label>
          <div class="xm-bk__saverow">
            <input class="wb-input" id="xm-bk-name" maxlength="100" autocomplete="off" placeholder="Name the bank, for example JSS 2 Algebra, first term" value="${esc(now.name || "")}" />
            <button type="button" class="pp-btn" id="xm-bk-go"${now.questions.length ? "" : " disabled"}></button>
          </div>
          <p class="xm-bk__msg" id="xm-bk-savemsg" role="status"></p>
        </section>

        <div class="xm-bk__bar">
          <b>Your banks</b>
          <input type="search" class="wb-input" id="xm-bk-q" placeholder="Search by name or subject" aria-label="Search your banks" autocomplete="off" />
        </div>
        <div class="xm-bk__scroll" id="xm-bk-list" tabindex="0"><p class="xm-bk__none">Opening your banks…</p></div>
        <p class="xm-bk__foot">Load a bank to put its questions in the editor, after the ones already there. To combine banks, load one, tick the questions you want and press <b>Delete unticked</b>, then load the next.</p>
      </div>
    </div>`;
  document.body.appendChild(box);
  document.documentElement.classList.add("xm-bk-on");

  const $ = (id) => box.querySelector(`#${id}`);
  const list = $("xm-bk-list");
  let sets = [];
  const close = () => { box.remove(); document.documentElement.classList.remove("xm-bk-on"); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  faceOf(box.querySelector(".xm-bk__close"), UI.close(18), "Close the bank");
  box.querySelector(".xm-bk__close").addEventListener("click", close);
  faceOf($("xm-bk-go"), UI.save(18), "Save as a bank");
  $("xm-bk-go").insertAdjacentHTML("beforeend", "<span class=\"xm-bk__word\">Save</span>");

  function paint() {
    const q = $("xm-bk-q").value.trim().toLowerCase();
    const shown = sets.filter((s) => !q || `${s.name} ${s.subject} ${s.level}`.toLowerCase().includes(q));
    if (!sets.length) { list.innerHTML = `<p class="xm-bk__none">No banks yet. Write or generate some questions, give them a name above and press Save.</p>`; return; }
    if (!shown.length) { list.innerHTML = `<p class="xm-bk__none">No bank matches "${esc(q)}".</p>`; return; }
    list.innerHTML = shown.map((s) => `
      <article class="xm-bk__item" data-id="${s.id}">
        <div class="xm-bk__main">
          <h3>${esc(s.name)}</h3>
          <p class="xm-bk__meta"><span class="xm-bk__count">${plural(s.count, "question")}</span>${s.subject ? ` · ${esc(s.subject)}` : ""}${s.level ? ` · ${esc(s.level)}` : ""}${s.savedAt ? ` · ${when(s.savedAt)}` : ""}</p>
          ${typeLine(s.types) ? `<p class="xm-bk__types">${esc(typeLine(s.types))}</p>` : ""}
        </div>
        <div class="xm-bk__acts">
          <button type="button" class="pp-btn xm-bk__load" data-act="load"><span class="xm-bk__ico">${UI.download(16)}</span>Load into the editor</button>
          <button type="button" class="pp-btn pp-btn--ghost xm-bk__peek" data-act="peek" aria-expanded="false"><span class="xm-bk__ico">${UI.eye ? UI.eye(16) : ""}</span>Look inside</button>
          <button type="button" class="pp-btn pp-btn--ghost xm-bk__del" data-act="del" aria-label="Delete this bank" data-tip="Delete this bank">${UI.trash(16)}</button>
        </div>
        <ol class="xm-bk__peeklist" hidden></ol>
      </article>`).join("");
  }
  async function refresh() {
    try { sets = (await api("/api/bank/sets")).sets || []; paint(); }
    catch (e) { list.innerHTML = `<p class="xm-bk__none">${esc(String((e && e.message) || e).slice(0, 160))}</p>`; }
  }
  $("xm-bk-q").addEventListener("input", paint);

  /* Save: the whole editor under this name */
  async function doSave() {
    const name = $("xm-bk-name").value.trim(), msg = $("xm-bk-savemsg");
    if (!name) { msg.textContent = "Give the bank a name first."; $("xm-bk-name").focus(); return; }
    const cur = bench();
    if (!cur.questions.length) { msg.textContent = "There are no questions in the editor to keep."; return; }
    const same = sets.find((s) => s.name.trim().toLowerCase() === name.toLowerCase());
    const go = $("xm-bk-go");
    if (same && go.dataset.armed !== "1") { go.dataset.armed = "1"; msg.textContent = `A bank called "${same.name}" already has ${plural(same.count, "question")}. Press Save again to replace it.`; setTimeout(() => { go.dataset.armed = ""; }, 5000); return; }
    go.dataset.armed = ""; go.disabled = true; msg.textContent = "Saving…";
    try {
      const r = await api("/api/bank/sets", { name, questions: cur.questions, subject: cur.subject, level: cur.level });
      msg.textContent = `${r.replaced ? "Replaced" : "Saved"} "${r.name}" with ${plural(r.count, "question")}.`;
      await refresh();
      list.querySelector(`[data-id="${r.id}"]`)?.classList.add("is-new");
    } catch (e) { msg.textContent = String((e && e.message) || e).slice(0, 160); }
    go.disabled = false;
  }
  $("xm-bk-go").addEventListener("click", doSave);
  $("xm-bk-name").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doSave(); } });

  const full = new Map();
  const getSet = async (id) => { if (!full.has(id)) full.set(id, (await api(`/api/bank/sets/${id}`)).set); return full.get(id); };
  list.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const item = b.closest(".xm-bk__item"), id = item.dataset.id, s = sets.find((x) => x.id === id);
    if (b.dataset.act === "load") {
      b.disabled = true;
      try { const set = await getSet(id); onLoad(set.questions || [], set.name); close(); }
      catch (err) { b.disabled = false; item.querySelector(".xm-bk__meta").textContent = String((err && err.message) || err).slice(0, 120); }
    } else if (b.dataset.act === "peek") {
      const ol = item.querySelector(".xm-bk__peeklist"), open = ol.hidden;
      ol.hidden = !open; b.setAttribute("aria-expanded", String(open));
      if (open && !ol.dataset.done) {
        ol.innerHTML = "<li>Opening…</li>";
        try {
          const set = await getSet(id);
          ol.innerHTML = (set.questions || []).map((q) => `<li><span class="xm-bk__tag">${esc(TYPES[q.type] ? TYPES[q.type].label : q.type)}</span>${textHtml(q.text)}${q.svg ? ` <em class="xm-bk__dia">with a diagram</em>` : ""}</li>`).join("");
          ol.dataset.done = "1";
          if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([ol]).catch(() => {});
        } catch (err) { ol.innerHTML = `<li>${esc(String((err && err.message) || err))}</li>`; }
      }
    } else if (b.dataset.act === "del") {
      if (b.dataset.armed !== "1") { b.dataset.armed = "1"; b.classList.add("is-armed"); b.dataset.tip = `Press again to delete "${s ? s.name : "this bank"}"`; setTimeout(() => { b.dataset.armed = ""; b.classList.remove("is-armed"); b.dataset.tip = "Delete this bank"; }, 4000); return; }
      b.disabled = true;
      try { await api(`/api/bank/sets/${id}`, {}, "DELETE"); sets = sets.filter((x) => x.id !== id); paint(); }
      catch (err) { b.disabled = false; }
    }
  });

  await refresh();
  (focusSave ? $("xm-bk-name") : $("xm-bk-q")).focus();
}
