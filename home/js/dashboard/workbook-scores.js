/* ════════════════════════════════════════════════════
   workbook-scores.js
   Every workbook a teacher has set, and how the class has done on it — on the
   dashboard, where they already are.

   Before this, the scores lived one page per assignment: you opened /wb/<code>
   yourself, waited for the whole paper to build, and read the table above it.
   That is a fine place to watch ONE class working, and it stays. It is a poor
   place to find out whether anybody has done anything, because it answers for
   one assignment at a time and you have to still have the link.

   So the server gathers the lot in one call (/api/workbooks/results) and this
   lays it out: newest activity first, each workbook opening to the students
   who have checked their answers, and under them the names in the class who
   have not. A hand-in also leaves a NOTICE behind (/api/workbooks/notices),
   which is the part that answers "has anything come in since I last looked" —
   it waits, unread, until the teacher reads it.

   Hangs off classroom-client.js for api/esc rather than growing a third copy.
   ════════════════════════════════════════════════════ */
import { api, esc } from "./classroom-client.js";
import { I } from "./icons.js";

const when = (ms) => (ms
  ? new Date(ms).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  : "—");

const scorePill = (p) => `<span class="db-pill ${p >= 70 ? "pill-green" : p >= 40 ? "pill-yellow" : "pill-red"}">${p}%</span>`;

/* The panel's shell. It is returned as markup rather than appended later
   because the dashboard reflows its tiles into columns the moment the role
   builder returns — a panel that arrives after that lands outside them. */
export function workbookScoresPanelHTML() {
  return `
    <div class="db-panel span-full" id="db-wb-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker" id="db-wb-kicker">Workbooks</p>
          <h2 class="db-panel-title">Scores</h2>
        </div>
        <a class="db-icon-btn ib-blue" href="/prep-math/activity/maths-workbook/index.html"
           title="Set a workbook for your class">${I.plus}</a>
      </div>
      <div id="db-wb-notices"></div>
      <div class="db-assign-list" id="db-wb-list"><div class="db-empty">Loading…</div></div>
    </div>`;
}

export async function mountWorkbookScores(layout) {
  const host = layout.querySelector("#db-wb-list");
  if (!host) return;
  injectStyles();
  fillNotices(layout);

  try {
    const { assignments, students, scored } = await api("/api/workbooks/results");
    const kicker = layout.querySelector("#db-wb-kicker");
    if (kicker) {
      kicker.textContent = assignments.length
        ? `${assignments.length} set · ${scored} score${scored === 1 ? "" : "s"} in · ${students} in the class`
        : "Workbooks";
    }
    host.innerHTML = assignments.length
      ? assignments.map(row).join("")
      : `<div class="db-empty">You have not set a workbook yet. Build one, then press
           <b>Assign to my class</b> on the paper — the scores come back here.</div>`;
    host.querySelectorAll("[data-copy]").forEach((b) => {
      b.onclick = (e) => {
        e.preventDefault();
        navigator.clipboard?.writeText(`${location.origin}/wb/${b.dataset.copy}`)
          .then(() => { b.textContent = "Link copied"; setTimeout(() => (b.textContent = "Copy link"), 1400); });
      };
    });
  } catch (e) {
    host.innerHTML = `<div class="db-empty">Couldn't load the scores: ${esc(e.message)}</div>`;
  }
}

/* ── one workbook ──────────────────────────────────────────────────────── */
function row(a) {
  const best = a.results.length
    ? Math.round(a.results.reduce((n, r) => n + (r.bestPct || 0), 0) / a.results.length)
    : null;
  const head = `
    <div class="db-assign-top">
      <div>
        <div class="db-assign-title">${esc(a.title)}</div>
        <div class="db-assign-meta">${a.results.length} scored${
          a.waiting.length ? ` · ${a.waiting.length} not yet` : ""
        }${a.lastAt ? ` · last ${when(a.lastAt)}` : ""}</div>
      </div>
      ${a.results.length ? `<span class="db-pill pill-green">Class average ${best}%</span>`
        : `<span class="db-pill pill-grey">Nothing in yet</span>`}
    </div>`;

  const table = a.results.length
    ? `<table class="wbs-table">
         <thead><tr><th>Student</th><th>Best</th><th>Last check</th><th>Tries</th><th>When</th></tr></thead>
         <tbody>${a.results.map((r) => `
           <tr>
             <td>${esc(r.name)}</td>
             <td>${scorePill(r.bestPct ?? 0)}</td>
             <td class="wbs-num">${r.lastRight}/${r.lastTotal} · ${r.lastPct}%</td>
             <td class="wbs-num">${r.attempts}</td>
             <td class="wbs-when">${when(r.lastAt)}</td>
           </tr>`).join("")}
         </tbody>
       </table>`
    : `<p class="wbs-none">Nobody has pressed <b>Check my answers</b> on this one yet. A score is
         only recorded when a signed-in student checks their work — opening the paper is not enough.</p>`;

  return `
    <details class="db-assign-item wbs-one">
      <summary>${head}</summary>
      ${table}
      ${a.waiting.length
        ? `<p class="wbs-wait">In your class, no score yet: ${a.waiting.map(esc).join(", ")}</p>` : ""}
      <div class="wbs-links">
        <a class="db-pill pill-blue" href="${esc(a.url)}" target="_blank" rel="noopener">Open the paper</a>
        <button class="db-pill pill-grey" type="button" data-copy="${esc(a.code)}">Copy link</button>
        <span class="wbs-code">${esc(a.code)}</span>
      </div>
    </details>`;
}

/* ── what has come in since you last looked ────────────────────────────── */
async function fillNotices(layout) {
  const host = layout.querySelector("#db-wb-notices");
  if (!host) return;
  let data;
  try { data = await api("/api/workbooks/notices"); } catch { return; }
  const fresh = data.notices.filter((n) => !n.seen);
  if (!fresh.length) { host.innerHTML = ""; return; }

  host.innerHTML = `
    <div class="wbs-new" role="status">
      <p class="wbs-new__cap">${fresh.length} handed in since you last looked</p>
      <ul class="wbs-new__list">${fresh.slice(0, 8).map((n) => `
        <li><b>${esc(n.name)}</b> checked <em>${esc(n.title)}</em> —
          ${n.right} of ${n.total} (${n.pct}%)${n.attempts > 1 ? `, try ${n.attempts}` : ""}
          <span class="wbs-when">${when(n.at)}</span></li>`).join("")}
      </ul>
      ${fresh.length > 8 ? `<p class="wbs-new__more">…and ${fresh.length - 8} more.</p>` : ""}
      <button class="db-pill pill-yellow" type="button" id="db-wb-seen">Mark them read</button>
    </div>`;
  host.querySelector("#db-wb-seen").onclick = async (e) => {
    e.target.textContent = "…";
    try {
      await api("/api/workbooks/notices/seen", { method: "POST", body: "{}" });
      host.innerHTML = "";
      clearFlag();
    } catch { e.target.textContent = "Couldn't mark them"; }
  };
  flag(fresh.length, host);
}

/* ── the same news, where it is seen without scrolling ──────────────────
   A panel halfway down a dashboard is not a notification: you have to already
   be looking at it. So the count also goes on the toolbar at the top — a
   button that takes you to the panel — and on the tab itself, which is what a
   teacher with the dashboard open in a background tab actually sees. */
const TITLE = document.title;

function flag(n, host) {
  document.title = `(${n}) ${TITLE}`;
  const bar = document.getElementById("dashboard-toolbar");
  if (!bar) return;
  /* the toolbar is rebuilt from scratch on every profile tick, which would
     quietly take the count away again */
  if (!flag.watching) {
    flag.watching = new MutationObserver(() => {
      if (flag.count && !document.getElementById("db-wb-flag")) flag(flag.count, flag.host);
    });
    flag.watching.observe(bar, { childList: true });
  }
  flag.count = n;
  flag.host = host;
  if (document.getElementById("db-wb-flag")) return;
  const pill = document.createElement("button");
  pill.type = "button";
  pill.id = "db-wb-flag";
  pill.className = "pp-pill";
  pill.style.setProperty("--tile", "var(--accent-primary)");
  pill.innerHTML = `${I.papers || ""}<span>${n} handed in</span>`;
  pill.onclick = () => {
    document.getElementById("db-wb-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    host.querySelector("#db-wb-seen")?.focus({ preventScroll: true });
  };
  bar.prepend(pill);
}

function clearFlag() {
  document.title = TITLE;
  flag.count = 0;
  document.getElementById("db-wb-flag")?.remove();
}

/* ── the look ──────────────────────────────────────────────────────────── */
function injectStyles() {
  if (document.getElementById("wbs-styles")) return;
  const s = document.createElement("style");
  s.id = "wbs-styles";
  s.textContent = `
    .wbs-one { padding: 0.75rem; }
    .wbs-one + .wbs-one { margin-top: 0.5rem; }
    .wbs-one > summary { list-style: none; cursor: pointer; }
    .wbs-one > summary::-webkit-details-marker { display: none; }
    .wbs-one[open] > summary { border-bottom: 1px dashed color-mix(in srgb, var(--ink) 14%, transparent);
      padding-bottom: 0.5rem; margin-bottom: 0.5rem; }
    .wbs-table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.72rem; }
    .wbs-table th { text-align: left; font-size: 0.6rem; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--text-secondary); font-weight: 700; padding: 0.2rem 0.4rem 0.3rem 0; }
    .wbs-table td { padding: 0.28rem 0.4rem 0.28rem 0; border-top: 1px dashed color-mix(in srgb, var(--ink) 10%, transparent); }
    .wbs-num { white-space: nowrap; }
    .wbs-when { color: var(--text-tertiary, #9a948a); white-space: nowrap; }
    .wbs-none, .wbs-wait { font-family: var(--font-mono); font-size: 0.7rem; line-height: 1.55;
      color: var(--text-secondary); margin: 0.4rem 0 0; }
    .wbs-links { display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; margin-top: 0.6rem; }
    .wbs-links a { text-decoration: none; }
    .wbs-links button { border: 0; cursor: pointer; }
    .wbs-code { font-family: var(--font-mono); font-size: 0.66rem; letter-spacing: 0.12em;
      color: var(--text-tertiary, #9a948a); }
    .wbs-new { border: 2px dashed color-mix(in srgb, var(--accent-primary, #ffd76a) 60%, var(--ink));
      border-radius: 0; padding: 0.7rem 0.85rem; margin-bottom: 0.7rem;
      background: color-mix(in srgb, var(--accent-primary, #ffd76a) 18%, var(--surface-primary, #fffdf8)); }
    .wbs-new__cap { font-family: var(--font-display); font-weight: 900; font-size: 0.8rem; margin: 0 0 0.4rem; }
    .wbs-new__list { list-style: none; margin: 0 0 0.5rem; padding: 0;
      font-family: var(--font-mono); font-size: 0.72rem; line-height: 1.6; }
    .wbs-new__list em { font-style: normal; color: var(--text-secondary); }
    .wbs-new__more { font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-secondary); margin: 0 0 0.4rem; }
    @media (max-width: 560px) {
      .wbs-table th:nth-child(4), .wbs-table td:nth-child(4) { display: none; }
    }`;
  document.head.appendChild(s);
}
