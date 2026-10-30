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
import { clean, paperMarks, BLANK_HEAD } from "/prep-math/activity/exam-maker/js/model.js";
import { createLive } from "/prep-math/activity/exam-maker/js/live.js";
import { createClock, minutesFor } from "/prep-math/activity/exam-maker/js/timer.js";
import { loadMath, mathify } from "/utils/components/workbook/mathify.js";
import { api } from "/utils/components/workbook/account.js";
import { UI } from "/utils/components/ui-icons.js";
import { faceOf } from "/utils/components/workbook/icons.js";
import { mountTools } from "/prep-math/activity/exam-maker/js/tools.js";

const $ = (id) => document.getElementById(id);
const sheet = $("xm-sheet");

const code = (location.pathname.match(/\/paper\/([A-Za-z2-9]{6})/) || [])[1]
  || new URLSearchParams(location.search).get("c") || "";

const say = (t, bad = false) => { const m = $("pp-msg"); m.textContent = t; m.classList.toggle("is-bad", bad); };

let head = null;
let questions = [];

const live = createLive(sheet, { onChange: () => paintScore(), store: `xm-live-paper-${code}`, getAttempt: () => head && head.attempt,
  /* the OMR sheet is the learner's to open, even when the paper was shared without one */
  ensureOmr: () => { head.omr = true; draw(); },
  /* every question answered and the writing has stopped: score it, stamp it, suggest printing */
  onComplete: () => { if (!live.checked) $("xm-check").click(); },
  onPrint: () => window.print(),
  /* a name typed after the score went in is sent along, without counting as a new attempt */
  onName: () => { if (live.checked) sendResult(); } });

/* A finished paper's score goes back to the teacher who shared it, under the name typed on the paper.
   It is sent again, a moment after, as the written answers are marked (not counted as a new attempt). */
let sendTimer = 0, firstSend = false;
function sendResult() {
  clearTimeout(sendTimer);
  sendTimer = setTimeout(async () => {
    if (!live.checked) return;
    const s = live.score(questions);
    if (!s.outOf) return;
    const first = firstSend; firstSend = false;
    try { await api(`/api/workbooks/paper/${code}/result`, { name: live.name, won: s.won, outOf: s.outOf, first }); } catch { /* the page still works without it */ }
  }, 900);
}

function paintScore() {
  const el = $("xm-score");
  const s = live.score(questions);
  if (live.checked) sendResult();
  el.textContent = live.checked
    ? `${s.won} of ${s.outOf} marks` + (s.pending ? ` · mark your ${s.pending} written answer${s.pending === 1 ? "" : "s"}` : "")
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
    /* the paper is the learner's: its tools (framed activity pages) are let in without a subscription */
    document.documentElement.dataset.ppPaperPass = "1";
    /* whoever holds the link has the paper free, and that includes printing it marked */
    document.documentElement.classList.add("wb-print-ok");
    live.setOn(true);
    $("xm-check").hidden = false; $("xm-clear").hidden = false;
    /* the workbook tool rail, for working out beside the paper */
    mountTools({ sheet, viewport: document.querySelector(".xm-viewport"), toolbar: document.querySelector(".wb-toolbar") }).on();
    say(`${questions.length} questions · ${paperMarks(questions, head.attempt)} marks.`);
    draw();
    syncClock();
  } catch (e) {
    say(String((e && e.message) || e || "Could not open the paper.").slice(0, 200), true);
  }
}

/* the countdown, when the paper was set with a timer; the paper is checked when it runs out */
const clock = createClock($("xm-clock"), {
  onEnd: () => { if (!live.checked) { live.check(questions); draw(); faces(); $("xm-score").textContent = "Time is up. " + $("xm-score").textContent; } },
});
function syncClock() {
  if (head && head.timer && !live.checked) { if (!clock.running) clock.start(minutesFor(head.time, questions.length) * 60); }
  else clock.stop();
}

/* the buttons are glyphs with their names in the site's tooltip, like the rest of the site */
function faces() {
  faceOf($("xm-check"), live.checked ? UI.undo(18) : UI.check(18), live.checked ? "Answer again" : "Check answers");
  faceOf($("xm-clear"), UI.eraser(18), "Clear answers");
}
$("xm-check").addEventListener("click", () => {
  if (live.checked) live.reopen(); else { live.check(questions); firstSend = true; }
  draw(); faces(); syncClock();
  if (live.checked && !live.name.trim()) say("Type your name on the paper, so your teacher knows whose score this is.");
});
$("xm-clear").addEventListener("click", () => { live.clear(); draw(); faces(); clock.stop(); syncClock(); });
faces();

open();
