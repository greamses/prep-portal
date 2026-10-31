/* ============================================================================
   Weekly results — a teacher's compiler
   ----------------------------------------------------------------------------
   Asks the server (/api/workbooks/compile) for a run of weeks, four by default,
   Monday to Sunday: for every student, the assignments and shared papers they
   completed in each week and the score of each. Draws a class table, a class
   graph and one card per student with a graph of their weekly average, and
   prints as a report (one student to a page if asked).

   A completed assignment counts in the week of its LAST attempt, at that
   attempt's score. Scores come from the learners' browsers, like every score
   on this site: practice feedback, and the page says so.
   ========================================================================== */

import { api } from "/utils/components/workbook/account.js";
import { faceOf } from "/utils/components/workbook/icons.js";
import { UI } from "/utils/components/ui-icons.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* the same scale the paper's grade stamp uses */
const GRADES = [[70, "A", "Excellent"], [60, "B", "Very good"], [50, "C", "Good"], [45, "D", "Fair"], [40, "E", "Pass"], [0, "F", "Try again"]];
const gradeOf = (pct) => (GRADES.find(([min]) => pct >= min) || GRADES[GRADES.length - 1]);
const tone = (pct) => (pct == null ? "none" : pct >= 70 ? "good" : pct >= 50 ? "mid" : "low");
const FILL = { good: "#7cc47c", mid: "#f4c95d", low: "#e8837a", none: "#d9d3c8" };

const day = (iso, opts) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });
const short = (iso) => day(iso, { day: "numeric", month: "short" });
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

let data = null;

/** Bars for each week's average, a line through them, and how many were completed under each. */
function chart(avgs, counts, labels, { w = 320, h = 160 } = {}) {
  const L = 30, R = 8, T = 16, B = 38;
  const iw = w - L - R, ih = h - T - B;
  const n = avgs.length;
  const bw = Math.min(46, (iw / n) * 0.62);
  const y = (v) => T + ih - (v / 100) * ih;
  const cx = (i) => L + (iw * (i + 0.5)) / n;
  let g = "";
  [0, 50, 100].forEach((v) => {
    g += `<line x1="${L}" x2="${w - R}" y1="${y(v)}" y2="${y(v)}" stroke="#cfc8bb" stroke-width="1"${v ? ' stroke-dasharray="3 3"' : ""}/>`
      + `<text x="${L - 6}" y="${y(v) + 3}" text-anchor="end" font-size="9" fill="#6b655c">${v}</text>`;
  });
  const pts = [];
  avgs.forEach((a, i) => {
    if (a == null) {
      g += `<line x1="${cx(i) - bw / 3}" x2="${cx(i) + bw / 3}" y1="${y(0) - 2}" y2="${y(0) - 2}" stroke="#a39b8c" stroke-width="2"/>`;
    } else {
      g += `<rect x="${cx(i) - bw / 2}" y="${y(a)}" width="${bw}" height="${Math.max(1, y(0) - y(a))}" fill="${FILL[tone(a)]}" stroke="#2a2723" stroke-width="1"/>`
        + `<text x="${cx(i)}" y="${y(a) - 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#2a2723">${a}%</text>`;
      pts.push(`${cx(i)},${y(a)}`);
    }
    g += `<text x="${cx(i)}" y="${h - 22}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#2a2723">${esc(labels[i])}</text>`
      + `<text x="${cx(i)}" y="${h - 10}" text-anchor="middle" font-size="9" fill="#6b655c">${counts[i]} done</text>`;
  });
  if (pts.length > 1) g += `<polyline points="${pts.join(" ")}" fill="none" stroke="#2a2723" stroke-width="1.6" stroke-linejoin="round" stroke-dasharray="4 3"/>`;
  return `<svg class="rc-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Average score for each week">${g}</svg>`;
}

function render(d) {
  data = d;
  const labels = d.weekStarts.map((s, i) => `Wk ${i + 1}`);
  const cells = (arr, f) => arr.map(f).join("");
  const cell = (wk) => (wk.completed
    ? `<td class="rc-cell rc-cell--${tone(wk.avg)}"><b>${wk.avg}%</b><small>${wk.completed} done</small></td>`
    : `<td class="rc-cell rc-cell--none"><span>–</span></td>`);

  const rows = d.students.map((s) => {
    const g = s.avg == null ? null : gradeOf(s.avg);
    return `<tr><th scope="row">${esc(s.name)}</th>${cells(s.weeks, cell)}`
      + `<td class="rc-num">${s.completed}</td><td class="rc-num rc-avg">${s.avg == null ? "–" : s.avg + "%"}</td>`
      + `<td class="rc-grade">${g ? `<i class="rc-pill rc-pill--${tone(s.avg)}">${g[1]}</i>` : ""}</td></tr>`;
  }).join("");
  const cls = d.classWeeks;
  const classTotals = `<tr class="rc-total"><th scope="row">Whole class</th>${cells(cls, cell)}<td class="rc-num">${cls.reduce((n, w) => n + w.completed, 0)}</td><td class="rc-num rc-avg">–</td><td></td></tr>`;

  const cards = d.students.map((s) => {
    const g = s.avg == null ? null : gradeOf(s.avg);
    const weekList = s.weeks.map((wk, i) => wk.items.length
      ? `<li><b>${labels[i]}</b> <span class="rc-dates">${short(d.weekStarts[i])}</span><ul>${wk.items.map((it) =>
        `<li><span class="rc-kind rc-kind--${it.kind}">${it.kind === "paper" ? "Paper" : "Workbook"}</span> ${esc(it.title)} <b class="rc-score rc-score--${tone(it.pct)}">${it.pct}%</b></li>`).join("")}</ul></li>`
      : "").join("");
    return `<article class="rc-student">
      <header class="rc-student__head">
        <h3>${esc(s.name)}</h3>
        <span class="rc-student__sum">${s.completed} completed${s.avg == null ? "" : ` · average ${s.avg}%`}</span>
        ${g ? `<i class="rc-stamp rc-stamp--${tone(s.avg)}" title="${g[2]}">${g[1]}</i>` : ""}
      </header>
      ${chart(s.weeks.map((w) => w.avg), s.weeks.map((w) => w.completed), labels)}
      ${weekList ? `<ul class="rc-weeks">${weekList}</ul>` : `<p class="rc-none">Nothing completed in these weeks.</p>`}
    </article>`;
  }).join("");

  /* one report card per student: every task they did, its score, grade and remark */
  const when = (at) => (at ? new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");
  const reports = d.students.map((s, si) => {
    const g = s.avg == null ? null : gradeOf(s.avg);
    const items = s.weeks.flatMap((wk) => wk.items).sort((a, b) => (a.at || 0) - (b.at || 0));
    const lines = items.map((it, n) => {
      const ig = gradeOf(it.pct);
      return `<tr><td class="rc-num">${n + 1}</td><td class="rc-rc__title">${esc(it.title)}</td><td>${it.kind === "paper" ? "Paper" : "Workbook"}</td><td>${when(it.at)}</td>`
        + `<td class="rc-num"><b>${it.pct}%</b></td><td class="rc-grade"><i class="rc-pill rc-pill--${tone(it.pct)}">${ig[1]}</i></td><td class="rc-rc__remark">${ig[2]}</td></tr>`;
    }).join("");
    return `<article class="rc-card" data-i="${si}">
      <header class="rc-card__head">
        <div><p class="rc-head__eyebrow">Report card</p><h3>${esc(s.name)}</h3>
          <p class="rc-card__sub">${esc(short(d.from))} to ${esc(day(d.to, { day: "numeric", month: "short", year: "numeric" }))}${d.teacher ? ` · Teacher: ${esc(d.teacher)}` : ""}</p></div>
        ${g ? `<i class="rc-stamp rc-stamp--${tone(s.avg)}" title="${g[2]}">${g[1]}</i>` : ""}
        <button type="button" class="pp-btn no-print rc-card__print" data-i="${si}"></button>
      </header>
      ${items.length ? `<table class="rc-table rc-rc"><thead><tr><th>#</th><th>Task</th><th>Kind</th><th>Date</th><th>Score</th><th>Grade</th><th>Remark</th></tr></thead><tbody>${lines}</tbody></table>`
        : `<p class="rc-none">No task completed in these weeks.</p>`}
      <div class="rc-card__sum"><span>Tasks completed <b>${s.completed}</b></span><span>Average <b>${s.avg == null ? "–" : s.avg + "%"}</b></span><span>Overall <b>${g ? g[1] + " · " + g[2] : "–"}</b></span></div>
      ${chart(s.weeks.map((w) => w.avg), s.weeks.map((w) => w.completed), labels)}
      <div class="rc-card__sign"><span>Teacher's comment</span><span>Signature</span></div>
    </article>`;
  }).join("");

  $("rc-report").innerHTML = `
    <div class="rc-sheet">
      <header class="rc-head">
        <div>
          <p class="rc-head__eyebrow">${d.weeks}-week project results</p>
          <h2>${esc(short(d.from))} to ${esc(day(d.to, { day: "numeric", month: "short", year: "numeric" }))}</h2>
        </div>
        <p class="rc-head__by">${d.teacher ? `Teacher: ${esc(d.teacher)}<br>` : ""}${d.students.length} student${d.students.length === 1 ? "" : "s"} · ${d.assignments} assignment${d.assignments === 1 ? "" : "s"} and papers with scores</p>
      </header>
      <section class="rc-block">
        <h3 class="rc-h">The class, week by week</h3>
        <div class="rc-classrow">
          <div class="rc-tablewrap"><table class="rc-table">
            <thead><tr><th>Student</th>${d.weekStarts.map((s, i) => `<th>${labels[i]}<small>${esc(short(s))}</small></th>`).join("")}<th>Done</th><th>Avg</th><th>Grade</th></tr></thead>
            <tbody>${rows}${classTotals}</tbody></table></div>
          <figure class="rc-classchart">${chart(cls.map((w) => w.avg), cls.map((w) => w.completed), labels, { w: 300, h: 170 })}<figcaption>Class average each week</figcaption></figure>
        </div>
      </section>
      <section class="rc-block">
        <h3 class="rc-h">Each student</h3>
        <div class="rc-students">${cards || `<p class="rc-none">No students yet.</p>`}</div>
      </section>
      <section class="rc-block rc-cards">
        <h3 class="rc-h">Report cards</h3>
        <div class="rc-cardlist">${reports || `<p class="rc-none">No students yet.</p>`}</div>
      </section>
      <p class="rc-foot">Scores are worked out in the student's browser: practice feedback, not an invigilated exam. A completed assignment counts in the week of its last attempt.</p>
    </div>`;
  document.querySelectorAll(".rc-card__print").forEach((b) => faceOf(b, UI.print(16), "Print this report card"));
  $("rc-start").value = d.from;
  $("rc-msg").textContent = d.assignments ? "" : "No scores came in during these weeks. Try other dates, or check that students have opened your assignment links.";
}

async function load(start) {
  $("rc-msg").textContent = "Gathering the scores…";
  const q = new URLSearchParams({ weeks: $("rc-weeks").value });
  if (start) q.set("start", start);
  try {
    render(await api(`/api/workbooks/compile?${q}`));
  } catch (e) {
    $("rc-report").innerHTML = "";
    $("rc-msg").textContent = /teacher/i.test(String(e && e.message)) ? "This page is for teachers." : String((e && e.message) || "Could not load the results.");
  }
}

faceOf($("rc-prev"), UI.arrowLeft(18), "The weeks before");
faceOf($("rc-next"), UI.arrowRight(18), "The weeks after");
faceOf($("rc-print"), UI.print(18), "Print the report");
$("rc-prev").addEventListener("click", () => data && load(addDays(data.from, -7 * data.weeks)));
$("rc-next").addEventListener("click", () => data && load(addDays(data.from, 7 * data.weeks)));
$("rc-start").addEventListener("change", (e) => e.target.value && load(e.target.value));
$("rc-weeks").addEventListener("change", () => load(data ? data.from : ""));
$("rc-pages").addEventListener("change", (e) => document.documentElement.classList.toggle("rc-per-page", e.target.checked));
$("rc-print").addEventListener("click", () => window.print());
/* a single report card: print only that one */
$("rc-report").addEventListener("click", (e) => {
  const b = e.target.closest(".rc-card__print"); if (!b) return;
  const card = b.closest(".rc-card"), root = document.documentElement;
  card.classList.add("is-solo"); root.classList.add("rc-solo");
  const undo = () => { card.classList.remove("is-solo"); root.classList.remove("rc-solo"); window.removeEventListener("afterprint", undo); };
  window.addEventListener("afterprint", undo);
  window.print();
});

load("");
