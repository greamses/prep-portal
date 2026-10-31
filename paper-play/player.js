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
import { clean, paperMarks, shuffled, BLANK_HEAD } from "/prep-math/activity/exam-maker/js/model.js";
import { createLive } from "/prep-math/activity/exam-maker/js/live.js";
import { examGate } from "/utils/components/exam-gate.js";
import { createWatch } from "/utils/components/exam-watch.js";
import { showInstructions } from "/prep-math/activity/exam-maker/js/instructions.js";
import { sayNote } from "/utils/components/exam-watch-core.js";
import { createClock, minutesFor } from "/prep-math/activity/exam-maker/js/timer.js";
import { loadMath, mathify } from "/utils/components/workbook/mathify.js";
import { api, currentUser } from "/utils/components/workbook/account.js";
import { openRoom, idFor } from "/utils/live/index.js";
import { UI } from "/utils/components/ui-icons.js";
import { faceOf } from "/utils/components/workbook/icons.js";
import { mountTools } from "/prep-math/activity/exam-maker/js/tools.js";

const $ = (id) => document.getElementById(id);
const sheet = $("xm-sheet");

/* exam mode: tablets and laptops, landscape only */
examGate();

const code = (location.pathname.match(/\/paper\/([A-Za-z2-9]{6})/) || [])[1]
  || new URLSearchParams(location.search).get("c") || "";

const say = (t, bad = false) => { const m = $("pp-msg"); m.textContent = t; m.classList.toggle("is-bad", bad); };

let head = null;
let questions = [];
let base = [];                    // the paper in the order the teacher wrote it
const seedKey = () => `xm-shuffle-${code}`;
let isOwner = false;
let room = null;
let watcher = null;
let markPoll = 0, markWait = 0;    // AI marking: the timer of the next look, and how many looks so far               // the camera check, when the teacher set one (events only: see exam-watch.js)
let tries = 1, used = 0;          // the teacher's number of tries (0 = no limit), and how many this student has used
/* the owner may always sit their own paper; anyone else may sit it again while they have tries left */
const canTryAgain = () => isOwner || tries === 0 || used < tries;

/* ── live ─────────────────────────────────────────────────────────────────
   Everyone on the paper joins one room (namespace "paper", the share code). A student says how far on
   they are and, once checked, what they got; the teacher who shared it watches "Working now".
   Chatty and worth seconds, never stored: the score still goes through the result route. */
async function joinLive() {
  try {
    const me = await currentUser().catch(() => null);
    room = await openRoom({ ns: "paper", code, role: isOwner ? "teacher" : "student", me: { id: idFor(me && me.uid), name: live.name || (me && me.displayName) || "Someone" } });
    room.presence.set({ on: isOwner ? "watching" : "the paper" });
    addEventListener("pagehide", () => { room && room.leave(); });
    if (isOwner) watchTheRoom(room); else tell();
  } catch { /* a paper must work without the live room */ }
}
let tellTimer = 0;
function tell() {
  if (!room || isOwner) return;
  clearTimeout(tellTimer);
  tellTimer = setTimeout(() => {
    const s = live.score(questions);
    room.state.patch({ [room.id]: { name: live.name || "Someone", filled: s.answered, total: s.total, ...(live.checked ? { right: s.won, marked: s.outOf } : {}) } });
  }, 400);
}

function watchTheRoom(r) {
  const box = document.createElement("section");
  box.className = "pp-live";
  box.innerHTML = `<h2 class="pp-live__cap">Working now</h2><div class="pp-live__who"></div>`;
  document.querySelector(".xm-preview").prepend(box);
  const list = box.querySelector(".pp-live__who");
  let here = [], work = {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const paint = () => {
    const others = here.filter((p) => p.role === "student");
    if (!others.length) { list.innerHTML = `<p class="pp-live__none">Nobody is on it at the moment. Share the link and they will appear here.</p>`; return; }
    list.innerHTML = others.map((p) => {
      const w = work[p.id] || {};
      const done = w.total ? Math.round((w.filled / w.total) * 100) : 0;
      const marked = w.right !== undefined && w.marked ? `<em class="pp-live__marked">scored ${w.right} of ${w.marked}</em>` : "";
      return `<div class="pp-live__one"><b>${esc(w.name || p.name)}</b><span class="pp-live__bar"><i style="width:${done}%"></i></span><span class="pp-live__pct">${w.total ? `${w.filled} of ${w.total}` : "just arrived"}</span>${marked}</div>`;
    }).join("");
  };
  r.on("presence", (people) => { here = people; paint(); });
  r.on("state", (s) => { work = s || {}; paint(); });
  paint();
}

/* ── AI marking of the written answers ──────────────────────────────────────
   When the paper is checked, the written answers join the server's marking queue (lib/mark-queue.js) and
   this page waits for the marks, looking again after 3 s, then 5, 8, 12 and every 15, only while the
   page is open and visible. Nobody is turned away: if the AI is busy the script simply waits its turn. */
const SAY = {
  queued: (r) => (r.position > 1 ? `In the marking line: ${r.position - 1} ${r.position === 2 ? "script is" : "scripts are"} ahead of yours` : "Next in the marking line"),
  working: () => "Being marked now",
};
function takeMarkStatus(r) {
  if (r.status === "done" && r.result) { live.applyAiMarks(r.result.marks); say("Your written answers have been marked."); return true; }
  if (r.status === "failed") { live.setAi({ on: true, status: "failed", text: "" }); say(`${r.error || "The AI could not mark your answers."} You can mark them yourself against the model answers.`, true); return true; }
  if (r.status === "queued" || r.status === "working") { live.setAi({ on: true, status: r.status, text: SAY[r.status](r) }); return false; }
  return true;
}
function lookAtMarking() {
  clearTimeout(markPoll);
  if (!live.checked || !head || !head.aiMark || isOwner) return;
  const next = () => { markPoll = setTimeout(lookAtMarking, [3, 5, 8, 12, 15][Math.min(markWait++, 4)] * 1000 || 20000); };
  if (document.hidden) { document.addEventListener("visibilitychange", lookAtMarking, { once: true }); return; }
  api(`/api/workbooks/paper/${code}/mark`).then((r) => { if (!takeMarkStatus(r)) next(); }).catch(() => next());
}
async function queueMarking() {
  if (!head || !head.aiMark || isOwner) return;
  const answers = live.writtenAnswers(questions);
  if (!Object.keys(answers).length) { live.setAi({ on: true, status: "done", text: "" }); return; }
  live.setAi({ on: true, status: "queued", text: "Joining the marking line…" });
  say("Your written answers are being marked by AI. Keep this page open: your marks will appear here.");
  markWait = 0;
  try {
    const r = await api(`/api/workbooks/paper/${code}/mark`, { answers, name: live.name });
    if (!takeMarkStatus(r)) { markPoll = setTimeout(lookAtMarking, 3000); }
  } catch (e) {
    live.setAi({ on: true, status: "failed", text: "" });
    say(`${String((e && e.message) || "The marking could not be started.")} You can mark your answers yourself against the model answers.`, true);
  }
}
/* a mark the teacher changes after the student's page has the AI's: looked for once each time the tab is come back to */
let marksAt = 0;
addEventListener("focus", () => {
  if (isOwner || !head || !head.aiMark || !live.checked || live.ai.status !== "done" || Date.now() - marksAt < 30000) return;
  marksAt = Date.now();
  api(`/api/workbooks/paper/${code}/mark`).then((r) => {
    if (r.status !== "done" || !r.result) return;
    const changed = r.result.marks.some((x) => x.by === "teacher" && live.ai.by[x.id] !== "teacher" || (live.ai.by[x.id] === "teacher" && x.m !== live.writtenMark(x.id)));
    if (changed) { live.applyAiMarks(r.result.marks); say("Your teacher changed a mark."); }
  }).catch(() => { /* looked again next time */ });
});
function stopMarking() { clearTimeout(markPoll); live.setAi({ on: !!(head && head.aiMark && !isOwner), status: "off", text: "" }); }

/* the teacher's view of the marking line: every script and how it stands. Read when the page opens, when the
   key is pressed and when the tab is come back to; each look also gives the queue a push. */
function mountMarkingList() {
  const box = document.createElement("section");
  box.className = "pp-live pp-watchlist";
  box.innerHTML = `<h2 class="pp-live__cap">AI marking <button type="button" class="pp-btn pp-watchlist__refresh"></button></h2>
    <p class="pp-watchlist__how">Finished scripts are marked in turn, at the rate the AI allows. Pressing the key checks on them and gives the line a push.</p>
    <div class="pp-watchlist__who"><p class="pp-live__none">Reading the line…</p></div>`;
  document.querySelector(".xm-preview").prepend(box);
  faceOf(box.querySelector(".pp-watchlist__refresh"), UI.refresh(16), "Check on the marking");
  const list = box.querySelector(".pp-watchlist__who");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TONE = { done: "ok", queued: "warn", working: "warn", failed: "danger" };
  const WORD = { done: "Marked", queued: "Waiting", working: "Being marked", failed: "Could not mark" };
  let at = 0;
  async function read(force) {
    if (!force && Date.now() - at < 20000) return;
    at = Date.now();
    try {
      const d = await api(`/api/workbooks/paper/${code}/marking`);
      list.innerHTML = d.total
        ? `<p class="pp-watchlist__how"><b>${d.done}</b> marked · <b>${d.queued + d.working}</b> waiting${d.failed ? ` · <b>${d.failed}</b> could not be marked` : ""} of ${d.total}</p>`
          + d.students.map((s) => `<details class="pp-watchlist__one" data-uid="${esc(s.uid)}" data-status="${esc(s.status)}"><summary><span class="pp-pill pp-pill--static pp-pill--${TONE[s.status] || "warn"}">${WORD[s.status] || s.status}</span> <b>${esc(s.name)}</b>${s.error ? ` · ${esc(s.error)}` : ""}</summary><div class="pp-mk"></div></details>`).join("")
        : `<p class="pp-live__none">No script has been sent for marking yet.</p>`;
    } catch (e) { list.innerHTML = `<p class="pp-live__none">${esc(String((e && e.message) || e).slice(0, 120))}</p>`; }
  }
  box.querySelector(".pp-watchlist__refresh").addEventListener("click", () => read(true));
  addEventListener("focus", () => read(false));
  read(true);

  /* Opening a student shows their script: each written answer, the AI's mark and why, and a place for the
     teacher's own mark and comment, which stands in place of the AI's (the AI's is kept beside it). */
  const clipText = (t, n) => (String(t).length > n ? `${String(t).slice(0, n)}…` : String(t));
  const paintItem = (it) => {
    const mine = it.by === "teacher";
    return `<div class="pp-mk__item" data-qid="${esc(it.id)}" data-max="${it.max}">
      <p class="pp-mk__q">${esc(clipText(it.text, 180))}</p>
      <p class="pp-mk__a">${esc(it.answer)}</p>
      <div class="pp-mk__row"><span class="pp-pill pp-pill--static pp-pill--${mine ? "ok" : "warn"}">${mine ? "Your mark" : "AI mark"}: ${it.m} of ${it.max}</span>${mine ? `<span class="pp-mk__was">The AI gave ${it.ai}.</span>` : ""}<span class="pp-mk__note">${esc(it.note || "")}</span></div>
      <div class="pp-mk__edit"><label>Your mark <input type="number" class="pp-mk__m" min="0" max="${it.max}" step="1" value="${it.m}" aria-label="Your mark out of ${it.max}"></label>
        <input type="text" class="pp-mk__c" maxlength="200" placeholder="A comment for the student (optional)" aria-label="A comment for the student">
        <button type="button" class="pp-btn pp-mk__save"></button><span class="pp-mk__say" role="status"></span></div>
    </div>`;
  };
  list.addEventListener("toggle", async (e) => {
    const det = e.target;
    if (!det.matches || !det.matches("details.pp-watchlist__one") || !det.open || det.dataset.loaded) return;
    const body = det.querySelector(".pp-mk");
    if (det.dataset.status !== "done") { body.innerHTML = `<p class="pp-live__none">${det.dataset.status === "failed" ? "The AI could not mark this script." : "This script has not been marked yet."}</p>`; return; }
    body.innerHTML = `<p class="pp-live__none">Opening the script…</p>`;
    try {
      const d = await api(`/api/workbooks/paper/${code}/marking/${det.dataset.uid}`);
      body.innerHTML = d.items.map(paintItem).join("");
      body.querySelectorAll(".pp-mk__save").forEach((b) => faceOf(b, UI.save(16), "Save my mark"));
      det.dataset.loaded = "1";
    } catch (err) { body.innerHTML = `<p class="pp-live__none">${esc(String((err && err.message) || err).slice(0, 120))}</p>`; }
  }, true);
  list.addEventListener("click", async (e) => {
    const btn = e.target.closest(".pp-mk__save"); if (!btn) return;
    const item = btn.closest(".pp-mk__item"), det = btn.closest("details"), say2 = item.querySelector(".pp-mk__say");
    const m = item.querySelector(".pp-mk__m").value;
    if (m === "" || !Number.isFinite(+m)) { say2.textContent = "Give the mark as a number."; return; }
    btn.disabled = true; say2.textContent = "Saving…";
    try {
      const r = await api(`/api/workbooks/paper/${code}/marking/${det.dataset.uid}/override`, { qid: item.dataset.qid, m: +m, note: item.querySelector(".pp-mk__c").value });
      const note = item.querySelector(".pp-mk__c").value.trim();
      item.outerHTML = paintItem({ id: item.dataset.qid, text: item.querySelector(".pp-mk__q").textContent, answer: item.querySelector(".pp-mk__a").textContent, max: +item.dataset.max, m: r.after, by: "teacher", ai: r.before, note });
      det.querySelector(`[data-qid="${item.dataset.qid}"] .pp-mk__say`).textContent = `Saved. The student has been told${r.score ? ` and their score is now ${r.score.won} of ${r.score.outOf}` : ""}.`;
    } catch (err) { say2.textContent = String((err && err.message) || err).slice(0, 140); btn.disabled = false; }
  });
}

/* ── the teacher's list of camera-check notes ─────────────────────────────
   Read when the page opens, when the refresh key is pressed and when the tab is come back to (at most
   every 20 s): never on a timer. They are each student's own device reporting on itself, so they are
   shown as "worth a look", never as a finding. */
function mountWatchList() {
  const box = document.createElement("section");
  box.className = "pp-live pp-watchlist";
  box.innerHTML = `<h2 class="pp-live__cap">Camera check <button type="button" class="pp-btn pp-watchlist__refresh"></button></h2>
    <p class="pp-watchlist__how">Each student's camera is read on their own device. Nothing but these notes reaches you, and they are a prompt to take a look, not proof.</p>
    <div class="pp-watchlist__who"><p class="pp-live__none">Reading the notes…</p></div>`;
  document.querySelector(".xm-preview").prepend(box);
  faceOf(box.querySelector(".pp-watchlist__refresh"), UI.refresh(16), "Read the notes again");
  const list = box.querySelector(".pp-watchlist__who");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let at = 0;
  async function read(force) {
    if (!force && Date.now() - at < 20000) return;
    at = Date.now();
    try {
      const d = await api(`/api/workbooks/paper/${code}/watch`);
      list.innerHTML = d.students.length ? d.students.map((s) => {
        const state = s.state === "unavailable" ? " · the face check could not run on their device" : s.state === "starting" ? " · only just started" : "";
        const n = s.flags ? `${s.flags} note${s.flags === 1 ? "" : "s"}` : "no notes";
        return `<details class="pp-watchlist__one"${s.flags ? "" : " data-quiet"}><summary><b>${esc(s.name)}</b> · ${n}${state}</summary>`
          + (s.events.length ? `<ul>${s.events.map((e) => `<li>${esc(sayNote(e))}</li>`).join("")}</ul>` : `<p>Nothing to look at.</p>`) + `</details>`;
      }).join("") : `<p class="pp-live__none">Nobody has started the paper yet.</p>`;
    } catch (e) { list.innerHTML = `<p class="pp-live__none">${esc(String((e && e.message) || e).slice(0, 120))}</p>`; }
  }
  box.querySelector(".pp-watchlist__refresh").addEventListener("click", () => read(true));
  addEventListener("focus", () => read(false));
  read(true);
}

const live = createLive(sheet, { onChange: () => paintScore(), store: `xm-live-paper-${code}`, getAttempt: () => head && head.attempt,
  /* the OMR sheet is the learner's to open, even when the paper was shared without one */
  ensureOmr: () => { head.omr = true; draw(); },
  /* every question answered and the writing has stopped: score it, stamp it, suggest printing */
  onComplete: () => { if (!live.checked) $("xm-check").click(); },
  onPrint: () => window.print(),
  /* a name typed after the score went in is sent along, without counting as a new attempt */
  onName: () => { if (live.checked) sendResult(); tell(); } });

/* A finished paper's score goes back to the teacher who shared it, under the name typed on the paper.
   It is sent again, a moment after, as the written answers are marked (not counted as a new attempt). */
let sendTimer = 0, firstSend = false;
function sendResult() {
  if (isOwner) return; // the teacher's own run of it is not a score
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
  /* a student may shuffle their own copy until they have answered something; the order is theirs alone */
  $("xm-shuffle").hidden = locked || live.checked || s.answered > 0;
  if (live.checked) sendResult();
  tell();
  el.textContent = live.checked
    ? `${s.won} of ${s.outOf} marks · grade ${live.gradeFor(s.pct).g}` + (s.pending ? ` · mark your ${s.pending} written answer${s.pending === 1 ? "" : "s"}` : "")
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
    base = (r.questions || []).map(clean);
    questions = base;
    try { const seed = Number(localStorage.getItem(seedKey())); if (seed) questions = shuffled(base, seed); } catch { /* shown as written */ }
    $("pp-title").innerHTML = `${(r.title || "Mock paper").replace(/[<>&]/g, "")}<em>.</em>`;
    $("pp-eyebrow").textContent = r.ownerName ? `A mock paper from ${r.ownerName}` : "A mock paper";
    document.title = `Prep Portal | ${r.title || "Mock paper"}`;
    /* the paper is the learner's: its tools (framed activity pages) are let in without a subscription */
    document.documentElement.dataset.ppPaperPass = "1";
    /* whoever holds the link has the paper free, and that includes printing it marked */
    document.documentElement.classList.add("wb-print-ok");
    isOwner = !!r.owner;
    tries = r.tries == null ? 1 : r.tries; used = r.used || 0;
    /* back with every try spent: the paper is shown, and nothing on it can be answered */
    locked = !isOwner && tries > 0 && used >= tries;
    if (locked) {
      sheet.dataset.paper = head.paper === "letter" ? "letter" : "a4";
      sheet.innerHTML = paperHtml(head, questions);
      typeset();
      $("xm-check").hidden = true; $("xm-clear").hidden = true;
      say(`You have used ${tries === 1 ? "your one try" : `all ${tries} tries`} on this paper, so it cannot be answered again. Your teacher has your score.`);
      return;
    }
    /* the instructions page, when the teacher set one: read first, then Begin. Once per tab, so a
       reload mid-exam does not send the student back through it */
    if (head.instructions && !isOwner) {
      const seenKey = `xm-instr-${code}`;
      let seen = false;
      try { seen = sessionStorage.getItem(seenKey) === "1"; } catch { /* shown again */ }
      if (!seen) { await showInstructions({ head, questions }); try { sessionStorage.setItem(seenKey, "1"); } catch { /* shown again next time */ } }
    }
    /* a camera check is read on this device and only a short list of notes is sent; the paper stays
       covered until the camera is allowed, so it is not drawn before then */
    if (head.camera && !isOwner) {
      watcher = createWatch({ code, name: () => live.name, send: (p) => api(`/api/workbooks/paper/${code}/watch`, p) });
      await watcher.begin();
    }
    live.setOn(true);
    $("xm-check").hidden = false; $("xm-clear").hidden = false;
    /* the workbook tool rail, for working out beside the paper */
    mountTools({ sheet, viewport: document.querySelector(".xm-viewport"), toolbar: document.querySelector(".wb-toolbar") }).on();
    say(`${questions.length} questions · ${paperMarks(questions, head.attempt)} marks${triesNote()}.`);
    draw();
    syncClock();
    joinLive();
    if (isOwner && head.camera) mountWatchList();
    if (isOwner && head.aiMark) mountMarkingList();
    if (!isOwner && head.aiMark) live.setAi({ on: true, status: "off", text: "" });
  } catch (e) {
    say(String((e && e.message) || e || "Could not open the paper.").slice(0, 200), true);
  }
}

/* the countdown, when the paper was set with a timer; the paper is checked when it runs out */
const clock = createClock($("xm-clock"), {
  onEnd: () => { if (!live.checked) { live.check(questions); draw(); faces(); $("xm-score").textContent = "Time is up. " + $("xm-score").textContent; watcher && watcher.flush(true); queueMarking(); } },
});
function syncClock() {
  if (head && head.timer && !live.checked) { if (!clock.running) clock.start(minutesFor(head.time, questions.length) * 60); }
  else clock.stop();
}

/* the buttons are glyphs with their names in the site's tooltip, like the rest of the site */
function faces() {
  faceOf($("xm-check"), live.checked ? UI.undo(18) : UI.check(18), live.checked ? "Answer again" : "Check answers");
  faceOf($("xm-clear"), UI.eraser(18), "Clear answers");
  faceOf($("xm-shuffle"), UI.shuffle(18), "Shuffle the questions and their answers");
  /* out of tries: nothing on the paper can be opened again */
  const spent = live.checked && !canTryAgain();
  $("xm-check").hidden = spent || locked; $("xm-clear").hidden = spent || locked;
}
let locked = false;               // came back with no tries left: the paper is shown, not answerable
function triesNote() {
  if (isOwner || tries === 0) return "";
  const left = Math.max(0, tries - used);
  return left ? ` · ${left} ${left === 1 ? "try" : "tries"} left` : ` · no tries left`;
}
$("xm-shuffle").addEventListener("click", () => {
  if (live.checked || live.score(questions).answered) return;
  const seed = Math.floor(Math.random() * 4294967296);
  try { localStorage.setItem(seedKey(), String(seed)); } catch { /* private window: it lasts this visit */ }
  questions = shuffled(base, seed);
  draw();
});
$("xm-check").addEventListener("click", () => {
  if (live.checked) { if (!canTryAgain()) return; live.reopen(); }
  else { live.check(questions); firstSend = true; if (!isOwner) used += 1; }
  draw(); faces(); syncClock();
  /* the notes go with the score; with no tries left the exam is over, so the camera is let go */
  if (watcher && live.checked) { watcher.flush(true); if (!canTryAgain()) watcher.stop(); }
  if (live.checked && !live.name.trim()) say("Type your name on the paper, so your teacher knows whose score this is.");
  else if (live.checked && !canTryAgain()) say(tries === 1 ? "That was your one try. Your score has gone to your teacher." : `You have used all ${tries} tries. Your score has gone to your teacher.`);
  else if (live.checked) say(`Scored${triesNote()}. Press the arrow to answer again.`);
  /* written answers go to the AI marking line (after the messages above, so its own message is the one left showing) */
  if (live.checked) queueMarking(); else stopMarking();
});
$("xm-clear").addEventListener("click", () => { if (live.checked && !canTryAgain()) return; live.clear(); draw(); faces(); clock.stop(); syncClock(); });
faces();

open();

/* Fit the sheet to the screen: on a wide screen the paper is shown larger than its printed size
   (never smaller, a phone scrolls instead); printing is untouched (see style.css). */
function fitSheet() {
  sheet.style.zoom = "";
  const room = ($("xm-sheet").closest(".xm-preview") || document.body).clientWidth - 24;
  const z = Math.max(1, Math.min(1.6, room / sheet.offsetWidth));
  sheet.style.zoom = z > 1.02 ? z.toFixed(3) : "";
}
let fitTimer = 0;
window.addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitSheet, 120); });
window.addEventListener("beforeprint", () => { sheet.style.zoom = ""; });
window.addEventListener("afterprint", fitSheet);
fitSheet();
/* a box nobody wrote in goes back to the paper's ruled lines for printing; what was written stays */
addEventListener("beforeprint", () => { if (live.on) live.forPrint(); });
new MutationObserver(() => { clearTimeout(fitTimer); fitTimer = setTimeout(fitSheet, 60); }).observe(sheet, { attributes: true, attributeFilter: ["data-paper"] });
