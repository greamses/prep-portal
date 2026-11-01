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
import { createVoice, leaveWarning } from "/utils/components/exam-voice.js";
import { startGuard, showLeaveWarning } from "/utils/components/exam-guard.js";
import { showInstructions } from "/prep-math/activity/exam-maker/js/instructions.js";
import { sayNote } from "/utils/components/exam-watch-core.js";
import { createClock, minutesFor } from "/prep-math/activity/exam-maker/js/timer.js";
import { loadMath, mathify } from "/utils/components/workbook/mathify.js";
import { api, currentUser } from "/utils/components/workbook/account.js";
import { openRoom, idFor } from "/utils/live/index.js";
import { UI } from "/utils/components/ui-icons.js";
import { faceOf } from "/utils/components/workbook/icons.js";
import { mountTools } from "/prep-math/activity/exam-maker/js/tools.js";
import { mountAnnotator, annotatedView } from "/paper-play/annotate.js";

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
const voice = createVoice();     // the eight recorded warnings (static files; nothing is synthesised during an exam)
let guard = null;                // the page-leaving guard: back button, closing, going to another tab
let markPoll = 0, markWait = 0;    // AI marking: the timer of the next look, and how many looks so far               // the camera check, when the teacher set one (events only: see exam-watch.js)
let tries = 1, used = 0;          // the teacher's number of tries (0 = no limit), and how many this student has used
/* the owner may always sit their own paper; anyone else may sit it again while they have tries left */
const canTryAgain = () => isOwner || tries === 0 || used < tries;
/* a paper set to hold its results: the student hands it in and sees no marks until the teacher releases them */
const holds = () => !!(head && head.holdResults) && !isOwner;
let review = null;               // the released results (answers, the teacher's marks and notes), when this student's have been released
const paintMarkedUp = () => {
  if (!review) return;
  Object.keys(review.annotations || {}).forEach((qid) => {
    const notes = review.annotations[qid];
    if (!notes || !notes.length) return;
    const host = sheet.querySelector(`.xp-ans[data-qid="${qid}"]`) || sheet.querySelector(`.xp-q[data-qid="${qid}"]`);
    if (!host || host.querySelector(":scope > .an-student")) return;
    const box = document.createElement("div");
    box.className = "an-student";
    box.setAttribute("data-nomath", "");
    box.innerHTML = "<h4>Your teacher's marks</h4>";
    box.appendChild(annotatedView(String(review.answers[qid] ?? ""), notes));
    host.appendChild(box);
  });
};

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
  if (r.status === "held") return true;     // the teacher has not released the marks: nothing to show, nothing to wait for
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
  if (!holds()) say("Your written answers are being marked by AI. Keep this page open: your marks will appear here.");
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
  box.innerHTML = `<h2 class="pp-live__cap">AI marking <button type="button" class="pp-btn pp-watchlist__refresh"></button> <button type="button" class="pp-btn pp-watchlist__run"></button></h2>
    <p class="pp-watchlist__how">Finished scripts are marked in turn, at the rate the AI allows. Pressing the key checks on them and gives the line a push.</p>
    <div class="pp-watchlist__who"><p class="pp-live__none">Reading the line…</p></div>`;
  document.querySelector(".xm-preview").prepend(box);
  faceOf(box.querySelector(".pp-watchlist__refresh"), UI.refresh(16), "Check on the marking");
  faceOf(box.querySelector(".pp-watchlist__run"), UI.bolt(16), "Mark the waiting scripts now");
  const list = box.querySelector(".pp-watchlist__who");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TONE = { done: "ok", queued: "warn", working: "warn", failed: "danger" };
  let relBy = new Map();              // uid -> released? (only for a paper that holds its results)
  const relBtn = (uid, released, ready) => `<button type="button" class="pp-btn pp-mk__release${released ? " is-done" : ""}" data-uid="${esc(uid)}" ${released || !ready ? "disabled" : ""} data-tip="${released ? "Released: the student has been told" : ready ? "Release the results to this student" : "Wait until the marking has finished"}" aria-label="${released ? "Released" : "Release the results"}"></button>`;
  const qBtn = (uid, tip) => `<button type="button" class="pp-btn pp-mk__queue" data-uid="${esc(uid)}" data-tip="${esc(tip)}" aria-label="${esc(tip)}"></button>`;
  const faceQueue = (root) => root.querySelectorAll(".pp-mk__queue").forEach((b) => faceOf(b, UI.bolt(16), b.dataset.tip));
  const faceRelease = (root) => root.querySelectorAll(".pp-mk__release").forEach((b) => faceOf(b, b.classList.contains("is-done") ? UI.check(16) : UI.share(16), b.dataset.tip));
  const WORD = { done: "Marked", queued: "Waiting", working: "Being marked", failed: "Could not mark" };
  let at = 0;
  async function read(force) {
    if (!force && Date.now() - at < 20000) return;
    at = Date.now();
    try {
      const d = await api(`/api/workbooks/paper/${code}/marking`);
      relBy = new Map((d.submissions || []).map((x) => [x.uid, x.released]));
      const jobUids = new Set(d.students.map((x) => x.uid));
      const heldRows = d.hold ? (d.submissions || []).filter((x) => !jobUids.has(x.uid)) : [];
      list.innerHTML = d.total
        ? `<p class="pp-watchlist__how"><b>${d.done}</b> marked · <b>${d.queued + d.working}</b> waiting${d.failed ? ` · <b>${d.failed}</b> could not be marked` : ""} of ${d.total}</p>`
          + d.students.map((s) => `<details class="pp-watchlist__one" data-uid="${esc(s.uid)}" data-status="${esc(s.status)}"><summary><span class="pp-pill pp-pill--static pp-pill--${TONE[s.status] || "warn"}">${WORD[s.status] || s.status}</span> <b>${esc(s.name)}</b>${s.examNo ? ` <span class="pp-exno">No. ${esc(s.examNo)}</span>` : ""}${s.error ? ` · ${esc(s.error)}` : ""}${s.status === "failed" ? ` ${qBtn(s.uid, "Try the AI marking again")}` : ""}${d.hold ? ` ${relBtn(s.uid, relBy.get(s.uid) === true, s.status === "done")}` : ""}</summary><div class="pp-mk"></div></details>`).join("")
        : `<p class="pp-live__none">No script has been sent for marking yet.</p>`;
      if (heldRows.length) list.innerHTML += `<p class="pp-watchlist__how">Handed in with no written answers to mark:</p>` + heldRows.map((x) => `<div class="pp-watchlist__one pp-mk__plain"><b>${esc(x.name)}</b>${x.examNo ? ` <span class="pp-exno">No. ${esc(x.examNo)}</span>` : ""} · ${x.won} of ${x.outOf} ${qBtn(x.uid, "Send this script's written answers to the AI")} ${relBtn(x.uid, x.released, true)}</div>`).join("");
      if (d.hold && !d.total && !heldRows.length) list.innerHTML = `<p class="pp-live__none">Nobody has handed in yet.</p>`;
      faceRelease(list); faceQueue(list);
    } catch (e) { list.innerHTML = `<p class="pp-live__none">${esc(String((e && e.message) || e).slice(0, 120))}</p>`; }
  }
  box.querySelector(".pp-watchlist__refresh").addEventListener("click", () => read(true));
  /* MARK NOW: asks the server to work through the line, a few scripts at a time, until none is waiting (or it can go no further) */
  const runBtn = box.querySelector(".pp-watchlist__run");
  runBtn.addEventListener("click", async () => {
    if (runBtn.disabled) return;
    runBtn.disabled = true;
    const how = list.parentElement.querySelector(".pp-watchlist__how") || list;
    try {
      for (let i = 0; i < 12; i++) {
        const r = await api(`/api/workbooks/paper/${code}/marking/run`, {});
        how.textContent = `Marking: ${r.done} marked, ${r.queued + r.working} waiting${r.failed ? `, ${r.failed} could not be marked` : ""}…`;
        if (!r.queued && !r.working) break;
        if (!r.queued && r.working) await new Promise((res) => setTimeout(res, 4000));
        else if (!r.ran || (!r.ran.done && !r.ran.requeued && !r.ran.failed)) await new Promise((res) => setTimeout(res, 6000));   // the allowance is used up for the minute
      }
    } catch (err) { how.textContent = String((err && err.message) || err).slice(0, 140); }
    runBtn.disabled = false;
    read(true);
  });
  addEventListener("focus", () => read(false));
  read(true);

  list.addEventListener("click", async (e) => {
    const qb = e.target.closest(".pp-mk__queue");
    if (!qb) return;
    e.preventDefault(); e.stopPropagation();
    qb.disabled = true;
    try { await api(`/api/workbooks/paper/${code}/marking/${qb.dataset.uid}/queue`, {}); runBtn.click(); }
    catch (err) { qb.disabled = false; qb.dataset.tip = String((err && err.message) || err).slice(0, 100); }
  });

  /* Opening a student shows their script: each written answer, the AI's mark and why, and a place for the
     teacher's own mark and comment, which stands in place of the AI's (the AI's is kept beside it). */
  const clipText = (t, n) => (String(t).length > n ? `${String(t).slice(0, n)}…` : String(t));
  const paintItem = (it) => {
    const mine = it.by === "teacher";
    return `<div class="pp-mk__item" data-qid="${esc(it.id)}" data-max="${it.max}">
      <p class="pp-mk__q">${esc(clipText(it.text, 180))}</p>
      <div class="pp-mk__a pp-mk__an" data-ans></div>
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
      det._an = {}; det._text = {};
      const saveNotes = (qid) => { clearTimeout(det._t && det._t[qid]); (det._t = det._t || {})[qid] = setTimeout(() => api(`/api/workbooks/paper/${code}/marking/${det.dataset.uid}/annotate`, { qid, notes: det._an[qid].notes.map((n) => ({ s: n.s, e: n.e, kind: n.kind, text: n.text || "" })) }).catch(() => {}), 500); };
      det._mount = (qid, notes) => { const host = body.querySelector(`.pp-mk__item[data-qid="${qid}"] [data-ans]`); if (host) det._an[qid] = mountAnnotator(host, { text: det._text[qid], notes, onChange: () => saveNotes(qid) }); };
      d.items.forEach((it) => { det._text[it.id] = it.answer; det._mount(it.id, (d.annotations && d.annotations[it.id]) || []); });
      body.insertAdjacentHTML("beforeend", d.hold ? `<div class="pp-mk__foot">${relBtn(det.dataset.uid, d.released, true)}<span class="pp-mk__say">${d.released ? "Released to the student." : "Marked up? Release it to tell the student."}</span></div>` : "");
      faceRelease(body);
      body.querySelectorAll(".pp-mk__save").forEach((b) => faceOf(b, UI.save(16), "Save my mark"));
      det.dataset.loaded = "1";
    } catch (err) { body.innerHTML = `<p class="pp-live__none">${esc(String((err && err.message) || err).slice(0, 120))}</p>`; }
  }, true);
  list.addEventListener("click", async (e) => {
    const rel = e.target.closest(".pp-mk__release");
    if (rel) {
      e.preventDefault(); e.stopPropagation();
      if (rel.disabled) return;
      rel.disabled = true;
      try {
        await api(`/api/workbooks/paper/${code}/marking/${rel.dataset.uid}/release`, {});
        list.querySelectorAll(`.pp-mk__release[data-uid="${rel.dataset.uid}"]`).forEach((b) => { b.classList.add("is-done"); b.disabled = true; b.dataset.tip = "Released: the student has been told"; faceOf(b, UI.check(16), b.dataset.tip); });
        list.querySelectorAll(`details[data-uid="${rel.dataset.uid}"] .pp-mk__foot .pp-mk__say`).forEach((m) => { m.textContent = "Released to the student."; });
      } catch (err) { rel.disabled = false; rel.dataset.tip = String((err && err.message) || err).slice(0, 100); }
      return;
    }
    const btn = e.target.closest(".pp-mk__save"); if (!btn) return;
    const item = btn.closest(".pp-mk__item"), det = btn.closest("details"), say2 = item.querySelector(".pp-mk__say");
    const m = item.querySelector(".pp-mk__m").value;
    if (m === "" || !Number.isFinite(+m)) { say2.textContent = "Give the mark as a number."; return; }
    btn.disabled = true; say2.textContent = "Saving…";
    try {
      const r = await api(`/api/workbooks/paper/${code}/marking/${det.dataset.uid}/override`, { qid: item.dataset.qid, m: +m, note: item.querySelector(".pp-mk__c").value });
      const note = item.querySelector(".pp-mk__c").value.trim();
      const qid = item.dataset.qid, keepNotes = det._an && det._an[qid] ? det._an[qid].notes.map((n) => ({ ...n })) : [];
      item.outerHTML = paintItem({ id: qid, text: item.querySelector(".pp-mk__q").textContent, answer: "", max: +item.dataset.max, m: r.after, by: "teacher", ai: r.before, note });
      if (det._mount) det._mount(qid, keepNotes);
      det.querySelector(`[data-qid="${item.dataset.qid}"] .pp-mk__say`).textContent = `Saved. The student has been told${r.score ? ` and their score is now ${r.score.won} of ${r.score.outOf}` : ""}.`;
    } catch (err) { say2.textContent = String((err && err.message) || err).slice(0, 140); btn.disabled = false; }
  });
}

/* ── the teacher's list of camera-check notes ─────────────────────────────
   Read when the page opens, when the refresh key is pressed and when the tab is come back to (at most
   every 20 s): never on a timer. They are each student's own device reporting on itself, so they are
   shown as "worth a look", never as a finding. */
function mountWatchList(camera) {
  const box = document.createElement("section");
  box.className = "pp-live pp-watchlist";
  box.innerHTML = `<h2 class="pp-live__cap">${camera ? "Camera check" : "Leaving the page"} <button type="button" class="pp-btn pp-watchlist__refresh"></button></h2>
    <p class="pp-watchlist__how">${camera ? "Each student's camera is read on their own device. You get these notes and, when something is flagged, a still picture from that moment. They are a prompt to take a look, not proof." : "Students may not leave the exam page once it has started. Each time one does, it is noted here, and they are warned out loud."}</p>
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
        const pics = s.shots ? ` · ${s.shots} picture${s.shots === 1 ? "" : "s"}` : "";
        return `<details class="pp-watchlist__one"${s.flags || s.shots ? "" : " data-quiet"} data-uid="${esc(s.uid)}"${s.shots ? " data-shots" : ""}><summary><b>${esc(s.name)}</b>${s.examNo ? ` <span class="pp-exno">No. ${esc(s.examNo)}</span>` : ""} · ${n}${pics}${state}</summary>`
          + (s.events.length ? `<ul>${s.events.map((e) => `<li>${esc(sayNote(e))}</li>`).join("")}</ul>` : `<p>Nothing to look at.</p>`)
          + (s.shots ? `<div class="pp-shots"><p class="pp-live__none">Opening the pictures…</p></div>` : "") + `</details>`;
      }).join("") : `<p class="pp-live__none">Nobody has started the paper yet.</p>`;
    } catch (e) { list.innerHTML = `<p class="pp-live__none">${esc(String((e && e.message) || e).slice(0, 120))}</p>`; }
  }
  /* the pictures are fetched only when a student's line is opened: they are the heavy part */
  const when = (x) => sayNote({ k: x.k, t: x.t, d: 0 }).replace(/ for 0 s$/, "");
  list.addEventListener("toggle", async (e) => {
    const det = e.target;
    if (!det.matches || !det.matches("details[data-shots]") || !det.open || det.dataset.loaded) return;
    det.dataset.loaded = "1";
    const holder = det.querySelector(".pp-shots");
    try {
      const d = await api(`/api/workbooks/paper/${code}/watch/${encodeURIComponent(det.dataset.uid)}/shots`);
      holder.innerHTML = d.shots.length
        ? d.shots.map((x) => `<figure class="pp-shot"><a href="${x.img}" target="_blank" rel="noopener"><img src="${x.img}" alt="Camera picture, ${esc(when(x))}" loading="lazy" /></a><figcaption>${esc(when(x))}</figcaption></figure>`).join("")
        : `<p class="pp-live__none">No pictures.</p>`;
    } catch (err) { det.dataset.loaded = ""; holder.innerHTML = `<p class="pp-live__none">${esc(String((err && err.message) || err).slice(0, 120))}</p>`; }
  }, true);
  box.querySelector(".pp-watchlist__refresh").addEventListener("click", () => read(true));
  addEventListener("focus", () => read(false));
  read(true);
}

const live = createLive(sheet, { onChange: () => paintScore(), store: `xm-live-paper-${code}`, getAttempt: () => head && head.attempt,
  /* the OMR sheet is the learner's to open, even when the paper was shared without one */
  ensureOmr: () => { head.omr = true; draw(); },
  /* every question answered and the writing has stopped: score it, stamp it, suggest printing */
  /* every question has an answer: the paper is NOT handed in for the student (it only goes in when they press Check, or when the time
     is up); they are told it is ready, so they can look back over it first */
  onComplete: () => { if (!live.checked) say("Every question has an answer. Look back over your work, then press the tick to hand it in."); },
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
    try { await api(`/api/workbooks/paper/${code}/result`, { name: live.name, won: s.won, outOf: s.outOf, first, examNo: live.examNo, ...(holds() ? { answers: live.snapshot() } : {}) }); } catch { /* the page still works without it */ }
  }, 900);
}

function paintScore() {
  const el = $("xm-score");
  const s = live.score(questions);
  /* a student may shuffle their own copy until they have answered something; the order is theirs alone */
  $("xm-shuffle").hidden = locked || live.checked || s.answered > 0;
  if (live.checked) sendResult();
  tell();
  if (live.held) { el.textContent = "Handed in. Your teacher will release your results."; return; }
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
  paintMarkedUp();
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
    /* results held for the teacher: handed in and waiting, or released (the paper is shown marked, with the teacher's notes) */
    if (holds()) {
      let rv = null;
      try { rv = await api(`/api/workbooks/paper/${code}/review`); } catch { /* treated as not handed in */ }
      if (rv && rv.handedIn && !rv.released) {
        locked = true;
        sheet.dataset.paper = head.paper === "letter" ? "letter" : "a4";
        sheet.innerHTML = paperHtml(head, questions);
        typeset();
        $("xm-check").hidden = true; $("xm-clear").hidden = true;
        say("Your paper is in. Your teacher will go through it and release your results; you will be told.");
        return;
      }
      if (rv && rv.handedIn && rv.released) {
        locked = true; review = rv;
        live.setOn(true);
        live.loadAnswers(rv.answers);
        live.check(questions);
        draw(); faces();
        $("xm-check").hidden = true; $("xm-clear").hidden = true;
        say(`Your teacher has marked your paper: ${rv.score.won} of ${rv.score.outOf}, grade ${rv.score.grade}.`);
        api(`/api/workbooks/paper/${code}/mark`).then((r) => { if (r.status === "done" && r.result) live.applyAiMarks(r.result.marks); }).catch(() => {});
        return;
      }
    }
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
    if (head.instructions) {
      const seenKey = `xm-instr-${code}`;
      let seen = false;
      try { seen = sessionStorage.getItem(seenKey) === "1"; } catch { /* shown again */ }
      if (!seen) { await showInstructions({ head, questions, preview: isOwner }); try { sessionStorage.setItem(seenKey, "1"); } catch { /* shown again next time */ } }
    }
    /* Every student's exam is watched for leaving the page, and a camera is added when the teacher asked for one (read on
       this device; only a short list of notes is sent). The paper stays covered until the camera is allowed. The owner
       is not watched, but with a camera on is shown exactly what a student is: a test run, nothing sent anywhere. */
    if (!isOwner || head.camera) {
      voice.preload();
      const warn = (kind, info) => {
        if (kind === "left_tab") {
          voice.say(leaveWarning(info.count), { force: true });
          if (!isOwner) showLeaveWarning({ count: info.count, away: info.away });
        } else {
          voice.say(kind);
          /* a second face is shown as well as said: it is the one flag a student must act on at once */
          if (kind === "extra_face") showLeaveWarning({
            title: "Only you may be in the picture",
            text: isOwner
              ? "The camera can see more than one face. A student sees this, is told out loud, and a still picture is sent to you."
              : "The camera can see more than one face. Anyone with you must leave the room now: nobody may help you in an exam. A picture has been taken for your teacher.",
          });
        }
      };
      watcher = createWatch(isOwner
        ? { code, test: true, send: async () => {}, onWarn: warn }
        : { code, camera: !!head.camera, name: () => live.name, send: (p) => api(`/api/workbooks/paper/${code}/watch`, p), snap: (x) => api(`/api/workbooks/paper/${code}/watch/shot`, x), onWarn: warn });
      await watcher.begin();
    }
    if (!isOwner) {
      guard = startGuard({
        active: () => !live.checked && !locked,
        onAttempt: (why) => {
          if (why !== "back") return;
          voice.say("leave_attempt", { force: true });
          showLeaveWarning({ title: "Do not leave the exam", text: "Please do not leave or close the exam page. Finish your paper first." });
        },
      });
    }
    live.setOn(true);
    $("xm-check").hidden = false; $("xm-clear").hidden = false;
    /* the workbook tool rail, for working out beside the paper */
    mountTools({ sheet, viewport: document.querySelector(".xm-viewport"), toolbar: document.querySelector(".wb-toolbar"), families: head.railTools }).on();
    say(`${questions.length} questions · ${paperMarks(questions, head.attempt)} marks${triesNote()}.`);
    draw();
    syncClock();
    joinLive();
    if (isOwner) mountWatchList(!!head.camera);
    if (isOwner && (head.aiMark || head.holdResults)) mountMarkingList();
    if (!isOwner && head.aiMark) live.setAi({ on: true, status: "off", text: "" });
  } catch (e) {
    say(String((e && e.message) || e || "Could not open the paper.").slice(0, 200), true);
  }
}

/* the countdown, when the paper was set with a timer; the paper is checked when it runs out */
const clock = createClock($("xm-clock"), {
  onEnd: () => { if (!live.checked) { if (holds()) live.setHeld(true); live.check(questions); draw(); faces(); $("xm-score").textContent = "Time is up. " + $("xm-score").textContent; watcher && (watcher.flush(true), watcher.setActive(false)); queueMarking(); } },
  /* one minute left: said out loud, from the recording */
  onLow: () => voice.say("time_low", { force: true }),
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
  const spent = live.checked && (!canTryAgain() || live.held);
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
  if (live.checked) { if (!canTryAgain() || live.held) return; live.reopen(); }
  else { if (holds()) live.setHeld(true); live.check(questions); firstSend = true; if (!isOwner) used += 1; }
  draw(); faces(); syncClock();
  /* the notes go with the score; with no tries left the exam is over, so the camera is let go */
  /* once the paper is checked nothing is warned (the student may leave); sitting it again watches it again */
  if (watcher) watcher.setActive(!live.checked);
  if (watcher && live.checked) { watcher.flush(true); if (!canTryAgain()) watcher.stop(); }
  if (live.checked && !live.name.trim()) say("Type your name on the paper, so your teacher knows whose score this is.");
  else if (live.checked && !canTryAgain()) say(tries === 1 ? "That was your one try. Your score has gone to your teacher." : `You have used all ${tries} tries. Your score has gone to your teacher.`);
  else if (live.checked) say(`Scored${triesNote()}. Press the arrow to answer again.`);
  /* a paper that asks for an exam number: say so if it was not shaded, so the teacher can tell whose paper it is */
  if (live.checked && head.examNo && !isOwner && !live.examNo) say("Your exam number is not complete. Shade every digit on the OMR sheet so your teacher knows whose paper this is, then check again.", true);
  if (live.checked && live.held) say("Your paper is in. Your teacher will go through it and release your results; you will be told.");
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
