/* ============================================================================
   A shared mock paper — /paper/<code>
   ----------------------------------------------------------------------------
   Someone made a paper in the Exam Maker and shared it. This page asks the
   server for it (/api/workbooks/paper/:code), draws it with the Exam Maker's own
   paper (the same design) and makes it answerable (live.js). Free: it needs an
   account and the link, not a subscription. It has no print button, and the
   print stylesheet blanks itself without a subscriber's clearance.

   The answers come with the paper and the learner's browser marks it: practice
   for mock preparation, not an invigilated exam.
   ========================================================================== */

import { paperHtml } from "/prep-math/activity/exam-maker/js/paper.js";
import { clean, totalMarks, BLANK_HEAD } from "/prep-math/activity/exam-maker/js/model.js";
import { createLive } from "/prep-math/activity/exam-maker/js/live.js";
import { loadMath, mathify } from "/utils/components/workbook/mathify.js";
import { api } from "/utils/components/workbook/account.js";

const $ = (id) => document.getElementById(id);
const sheet = $("xm-sheet");

const code = (location.pathname.match(/\/paper\/([A-Za-z2-9]{6})/) || [])[1]
  || new URLSearchParams(location.search).get("c") || "";

const say = (t, bad = false) => { const m = $("pp-msg"); m.textContent = t; m.classList.toggle("is-bad", bad); };

let head = null;
let questions = [];

const live = createLive(sheet, { onChange: () => paintScore(), store: `xm-live-paper-${code}` });

function paintScore() {
  const el = $("xm-score");
  const s = live.score(questions);
  el.textContent = live.checked
    ? `${s.won} of ${s.auto} marks on the questions marked for you` + (s.manual ? ` · ${s.manual} written to mark yourself` : "")
    : `${s.answered} of ${s.total} answered`;
}

/* MathJax one paper at a time, then the workbooks' mathify for plain maths left over */
let queue = Promise.resolve();
function typeset() {
  queue = queue.then(async () => {
    if (!(await loadMath())) return;
    try {
      await window.MathJax.startup.promise;
      await window.MathJax.typesetPromise([sheet]);
    } catch {
      for (const el of sheet.querySelectorAll(".xp-q")) {
        try { await window.MathJax.typesetPromise([el]); } catch { /* this one stays as text */ }
      }
    }
    for (const el of sheet.querySelectorAll(".xp-q")) {
      if (/\\\(|\\\[/.test(el.textContent)) continue;
      try { mathify(el); } catch { /* nothing to set */ }
    }
  });
  return queue;
}

function draw() {
  const mj = window.MathJax;
  try { mj && mj.typesetClear && mj.typesetClear([sheet]); } catch { /* nothing typeset yet */ }
  sheet.dataset.paper = head.paper === "letter" ? "letter" : "a4";
  sheet.innerHTML = paperHtml(head, questions);
  live.apply(questions);
  paintScore();
  typeset();
}

async function open() {
  if (!code) { say("That link isn't right.", true); return; }
  try {
    const r = await api(`/api/workbooks/paper/${code}`);
    head = { ...BLANK_HEAD, ...r.head, key: false };
    questions = (r.questions || []).map(clean);
    $("pp-title").innerHTML = `${(r.title || "Mock paper").replace(/[<>&]/g, "")}<em>.</em>`;
    $("pp-eyebrow").textContent = r.ownerName ? `A mock paper from ${r.ownerName}` : "A mock paper";
    document.title = `Prep Portal | ${r.title || "Mock paper"}`;
    live.setOn(true);
    $("xm-check").hidden = false; $("xm-clear").hidden = false;
    say(`${questions.length} questions · ${totalMarks(questions)} marks.`);
    draw();
  } catch (e) {
    say(String((e && e.message) || e || "Could not open the paper.").slice(0, 200), true);
  }
}

$("xm-check").addEventListener("click", () => {
  if (live.checked) { live.reopen(); $("xm-check").textContent = "Check answers"; }
  else { live.check(questions); $("xm-check").textContent = "Answer again"; }
  draw();
});
$("xm-clear").addEventListener("click", () => { live.clear(); $("xm-check").textContent = "Check answers"; draw(); });

open();
