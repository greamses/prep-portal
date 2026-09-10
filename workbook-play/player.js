/* ============================================================================
   The assignment player — /wb/<code>
   ----------------------------------------------------------------------------
   A teacher assigned one exact workbook. This page asks the server for it (the
   options that build it — see /api/workbooks/a/:code), builds the SAME paper
   the teacher saw with that workbook's own subject (its js/subject.js), and
   opens it straight into the interactive workspace. Every "Check my answers"
   sends the score back for the teacher.

   Free: a student needs an account and the link, not a subscription. So this
   page lives outside /prep-math/activity (which the premium guard covers) and
   loads the workbook's modules, not its page. It never prints — the paper's
   print stylesheet blanks itself without a print pass, and nothing here gives
   one.

   The teacher who set it, opening the same link, sees every student's score
   above the paper, and can try it themselves.
   ========================================================================== */

import { renderWorkbook } from "/utils/components/workbook/engine.js";
import { mountInteractive } from "/utils/components/workbook/interactive.js";
import { api } from "/utils/components/workbook/account.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const code = (location.pathname.match(/\/wb\/([A-Za-z2-9]{6})/) || [])[1]
  || new URLSearchParams(location.search).get("c") || "";

const say = (t, bad = false) => {
  const m = $("wp-msg");
  m.textContent = t;
  m.classList.toggle("is-bad", bad);
};

/* The paper, fitted to the column — the rail does the same on the builder. */
function fit() {
  const viewport = $("wb-viewport");
  const scaler = $("wb-scaler");
  const sheet = $("wb-sheet");
  const width = viewport.clientWidth;
  if (!width) return;
  const natural = sheet.offsetWidth || 1;
  const zoom = Math.min(1, width / natural);
  scaler.style.transform = `scale(${zoom})`;
  /* the paper sits in the middle when there is room either side of it */
  scaler.style.left = `${Math.max(0, (width - natural * zoom) / 2)}px`;
  viewport.style.height = `${sheet.offsetHeight * zoom}px`;
}

/* ── the teacher's view: who has done it, and how well ─────────────────────*/

async function showResults() {
  const box = $("wp-results");
  box.hidden = false;
  box.innerHTML = `<div class="pp-receipt"><div class="pp-receipt__paper"><p class="wp-results__eyebrow">Scores</p><p>Loading…</p></div></div>`;
  try {
    const r = await api(`/api/workbooks/a/${code}/results`, undefined, "GET");
    const when = (ms) => (ms ? new Date(ms).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
    const rows = r.results.map((x) =>
      `<tr><td>${esc(x.name)}</td><td class="wp-num">${x.bestPct}%</td>` +
      `<td class="wp-num">${x.lastRight}/${x.lastTotal} · ${x.lastPct}%</td>` +
      `<td class="wp-num">${x.attempts}</td><td>${when(x.lastAt)}</td></tr>`).join("");
    const link = `${location.origin}/wb/${code}`;
    box.innerHTML = `
      <div class="pp-receipt"><div class="pp-receipt__paper">
        <p class="wp-results__eyebrow">Your assignment · scores</p>
        <h2 class="wp-results__title">${esc(r.title)}</h2>
        <p class="wp-results__link">Students open <b>${esc(link)}</b>
          <button type="button" class="pp-btn wb-tint-3" id="wp-copy">Copy link</button></p>
        ${r.results.length
          ? `<div class="wp-table-wrap"><table class="wp-table"><thead><tr><th>Student</th><th>Best</th><th>Last check</th><th>Tries</th><th>When</th></tr></thead><tbody>${rows}</tbody></table></div>`
          : `<p>Nobody has checked their answers yet.</p>`}
        ${r.waiting.length ? `<p class="wp-small">In your class, no score yet: ${r.waiting.map(esc).join(", ")}</p>` : ""}
        <p class="wp-small">Scores are worked out on the student's screen by the same answer key the
          paper uses. They are practice feedback, not an exam.</p>
        <button type="button" class="pp-btn wb-tint-2" id="wp-refresh">Refresh scores</button>
      </div></div>`;
    $("wp-copy").onclick = () => navigator.clipboard?.writeText(link).then(() => ($("wp-copy").textContent = "Copied"));
    $("wp-refresh").onclick = showResults;
  } catch (e) {
    box.innerHTML = `<div class="pp-receipt"><div class="pp-receipt__paper"><p>${esc(e.message)}</p></div></div>`;
  }
}

/* ── go ────────────────────────────────────────────────────────────────────*/

async function start() {
  if (!/^[A-Za-z2-9]{6}$/.test(code)) { say("That link isn't right — ask your teacher for it again.", true); return; }
  let a;
  try {
    a = await api(`/api/workbooks/a/${code.toUpperCase()}`, undefined, "GET");
  } catch (e) {
    say(e.message, true);
    return;
  }
  const mod = await import(`/prep-math/activity/${a.workbook}/js/subject.js`);
  const { SUBJECT, LIVE, WORKBOOK } = mod;

  /* the workbook's own drawings are styled by its own sheet */
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = WORKBOOK.style;
  document.head.appendChild(css);
  document.title = `Prep Portal | ${a.title}`;
  $("wp-eyebrow").textContent = a.owner ? `Your assignment · ${WORKBOOK.label}` : `From ${a.teacherName} · ${WORKBOOK.label}`;
  $("wp-title").innerHTML = `${esc(a.title)}<em>.</em>`;

  /* Measured pagination needs the real fonts first (see rail.js). */
  const faces = ['700 12pt "Shantell Sans"', '900 20pt Unbounded', '400 10pt "JetBrains Mono"', '700 10pt "JetBrains Mono"'];
  await Promise.all(faces.map((f) => document.fonts?.load(f).catch(() => {})));
  await document.fonts?.ready;
  await new Promise((r) => (css.sheet ? r() : css.addEventListener("load", r, { once: true })));

  const o = {
    ...a.options,
    title: a.title,
    paper: "a4",
    nameLine: false,
    answers: false,
    watermark: true,
  };
  const pages = renderWorkbook($("wb-sheet"), o, SUBJECT);
  $("wb-pages").textContent = pages === 1 ? "1 page" : `${pages} pages`;
  fit();
  window.addEventListener("resize", fit);

  let saving = null;
  const live = mountInteractive({
    sheet: $("wb-sheet"),
    viewport: $("wb-viewport"),
    scaler: $("wb-scaler"),
    toolbar: document.querySelector(".wb-toolbar"),
    refit: fit,
    protractor: LIVE.protractor,
    places: LIVE.places || "",
    locked: true,
    onCheck: ({ right, total }) => {
      if (a.owner) { say("This is your own assignment — your score is not recorded."); return; }
      clearTimeout(saving);
      saving = setTimeout(() => {
        api(`/api/workbooks/a/${code}/result`, { right, total })
          .then((r) => say(`Saved: ${right} out of ${total} (${r.pct}%). Your best so far is ${r.bestPct}%. Your teacher can see it.`))
          .catch((e) => say(`Your score could not be saved: ${e.message}`, true));
      }, 400);
    },
  });
  live.afterRender(`assign-${code}`);
  live.enter();
  say(a.owner ? "" : "Your answers are kept on this device until you check them.");
  if (a.owner) showResults();
}

start();
