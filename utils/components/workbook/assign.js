/* ============================================================================
   PRINTABLE WORKBOOK — a teacher hands this workbook to their class
   ----------------------------------------------------------------------------
   Only a teacher sees the "Assign to my class" note (the server says who is
   one — /api/workbooks/teacher). It saves the workbook exactly as it is on the
   bench — the same sections, counts, code and dials — and hands back a short
   link. Students who open it do it on screen, free, and every time they check
   their answers the score comes back to the teacher, on the same link.

   A teacher without a subscription still sees the note; pressing it says
   what assigning needs rather than hiding that it exists.
   ========================================================================== */

import { api, onUser } from "./account.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const COSMETIC = new Set(["paper", "nameLine", "answers", "watermark", "title"]);

/**
 *   mountAssign({ workbook, label, getOptions })
 *     getOptions   the bench's current options (rail's readOptions)
 */
export function mountAssign({ workbook, label, getOptions }) {
  const toolbar = document.querySelector(".wb-toolbar");
  if (!toolbar) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pp-btn wb-tint-2 wb-assign-btn";
  btn.textContent = "Assign to my class";
  btn.hidden = true;
  toolbar.querySelector(".wb-toolbar__spacer")?.after(btn);

  let status = null;
  onUser(async (u) => {
    btn.hidden = true;
    if (!u) return;
    try {
      status = await api("/api/workbooks/teacher");
      btn.hidden = !status.teacher;
    } catch { /* not shown is the safe default */ }
  });

  btn.addEventListener("click", () => open());

  function open() {
    document.getElementById("wb-assign")?.remove();
    const host = document.fullscreenElement || document.body;
    const box = document.createElement("div");
    box.className = "wb-pay";
    box.id = "wb-assign";
    const o = getOptions();
    const sections = (o.chosen || []).length;
    box.innerHTML = `
      <div class="wb-pay__card pp-receipt" role="dialog" aria-modal="true" aria-labelledby="wb-assign-title">
        <div class="pp-receipt__paper">
          <p class="wb-pay__eyebrow">For your class</p>
          <h2 class="wb-pay__title" id="wb-assign-title">Assign this workbook</h2>
          ${status && !status.eligible
            ? `<p class="wb-pay__small">${esc(status.reason || "Assigning workbooks needs a subscription.")}</p>
               <div class="wb-pay__actions">
                 <button type="button" class="pp-btn wb-tint-4" data-x="close">Not now</button>
                 <a class="pp-btn" href="/subscribe.html#plans">See plans</a>
               </div>`
            : `<label class="wb-assign__field"><span>Title your students see</span>
                 <input class="wb-input" id="wb-assign-name" maxlength="80" value="${esc(o.title || label)}" /></label>
               <dl class="wb-pay__lines">
                 <div><dt>Workbook</dt><dd>${esc(label)}</dd></div>
                 <div><dt>Sections</dt><dd>${sections}</dd></div>
                 <div><dt>Code</dt><dd>${esc(o.code || "")}</dd></div>
               </dl>
               <p class="wb-pay__small">Your students do it on screen, free, and it is marked as
                 they go. Everyone already in your class finds it in their list; anyone else
                 you send the link to joins your class when they open it. Each time they
                 check their answers you see the score.</p>
               <p class="wb-pay__msg" id="wb-assign-msg" role="status"></p>
               <div class="wb-pay__actions">
                 <button type="button" class="pp-btn wb-tint-4" data-x="close">Not now</button>
                 <button type="button" class="pp-btn" id="wb-assign-go">Assign it</button>
               </div>
               <div class="wb-assign__mine" id="wb-assign-mine"></div>`}
        </div>
      </div>`;
    host.appendChild(box);
    const close = () => box.remove();
    box.addEventListener("click", (e) => { if (e.target === box || e.target.dataset.x === "close") close(); });
    const go = box.querySelector("#wb-assign-go");
    if (!go) return;
    listMine(box.querySelector("#wb-assign-mine"));
    go.addEventListener("click", async () => {
      const msg = box.querySelector("#wb-assign-msg");
      go.disabled = true;
      msg.textContent = "Saving it…";
      try {
        const options = {};
        Object.keys(o).forEach((k) => { if (!COSMETIC.has(k)) options[k] = o[k]; });
        const r = await api("/api/workbooks/assign", {
          workbook, options, title: box.querySelector("#wb-assign-name").value.trim(),
        });
        const link = `${location.origin}${r.url}`;
        box.querySelector(".pp-receipt__paper").innerHTML = `
          <p class="wb-pay__eyebrow">Assigned</p>
          <h2 class="wb-pay__title">Send this link to your class</h2>
          <p class="wb-assign__link"><b>${esc(link)}</b></p>
          <p class="wb-pay__small">${r.sent
            ? `${r.sent} student${r.sent === 1 ? "" : "s"} already in your class ${r.sent === 1 ? "has" : "have"} it in their list.`
            : "Nobody is in your class yet — whoever opens the link joins it."}
            Open the same link yourself to see everyone's scores.</p>
          <div class="wb-pay__actions">
            <button type="button" class="pp-btn wb-tint-3" id="wb-assign-copy">Copy link</button>
            <a class="pp-btn wb-tint-2" href="${esc(r.url)}" target="_blank" rel="noopener">See the scores</a>
            <button type="button" class="pp-btn wb-tint-4" data-x="close">Done</button>
          </div>`;
        box.querySelector("#wb-assign-copy").onclick = (e) =>
          navigator.clipboard?.writeText(link).then(() => (e.target.textContent = "Copied"));
      } catch (e) {
        msg.textContent = e.message;
        go.disabled = false;
      }
    });
  }

  async function listMine(el) {
    if (!el) return;
    try {
      const r = await api("/api/workbooks/assigned");
      if (!r.assignments.length) return;
      el.innerHTML = `<p class="wb-pay__eyebrow">Set before</p>` +
        r.assignments.slice(0, 8).map((a) =>
          `<a class="wb-assign__row" href="/wb/${esc(a.code)}" target="_blank" rel="noopener">` +
          `<span>${esc(a.title)}</span><span>${a.students} scored</span></a>`).join("");
    } catch { /* the list is a convenience */ }
  }
}
