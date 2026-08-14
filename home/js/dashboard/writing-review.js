/* ════════════════════════════════════════════════════
   writing-review.js
   The teacher's side of the writing evaluator: what the class handed in, and
   the last word on it.

   The machine marks first — that is the point of the page — but its number is
   a proposal, not a verdict. Here a teacher reads the marked paper, approves
   the score or replaces it, writes a comment on the piece, and writes a
   comment on any paragraph of it. The AI's score is never overwritten; both
   sit on the record, which is the only honest way to show a student "the
   computer said 68, I said 74" and the only way to tell over a term whether
   the machine is marking well.

   Paragraph comments are keyed by the paragraph's INDEX in the marked text,
   because that is the one thing both sides can agree on without storing a
   second copy of the essay.

   Hangs off classroom-client.js for api/esc/modal rather than growing a third
   copy of all three.
   ════════════════════════════════════════════════════ */
import { api, esc, modal } from "./classroom-client.js";

/* ── The marked paper, read-only ──
   The writing page renders these tags into something clickable (popovers,
   one-tap fixes). None of that belongs here: a teacher is reading, not
   editing the student's copy. So the marks become plain coloured spans with
   the reason on hover, and every tag that only exists to offer the student a
   choice — <sub>, <sent> — is unwrapped to the words underneath. */
function paperHtml(annotated) {
  let html = esc(String(annotated || ""));
  // esc() turned the tags into entities; bring back only the ones we render.
  /* Every attribute here is matched with a LAZY any-character run, not with
     [^&]. esc() has already turned each quote into &quot;, so an attribute
     value is surrounded by ampersands — a "not an ampersand" class stops dead
     at the opening quote and matches nothing, which is exactly the bug this
     comment exists to stop somebody reintroducing. */
  html = html
    .replace(/&lt;mark\s+type=&quot;([a-z]+)&quot;([\s\S]*?)&gt;([\s\S]*?)&lt;\/mark&gt;/gi, (_, type, attrs, inner) => {
      const fix = (attrs.match(/fix=&quot;([\s\S]*?)&quot;/i) || [])[1] || "";
      const loss = (attrs.match(/loss=&quot;([\s\S]*?)&quot;/i) || [])[1] || "";
      return `<span class="wr-mark wr-mark--${type}" title="${type}${fix ? ` → ${fix}` : ""}">${inner}${loss ? `<sup>${loss}</sup>` : ""}</span>`;
    })
    .replace(/&lt;good\s+reason=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/good&gt;/gi, (_, reason, inner) => `<span class="wr-good" title="${reason}">${inner}</span>`)
    .replace(/&lt;hl\s+cat=&quot;[\s\S]*?&quot;&gt;([\s\S]*?)&lt;\/hl&gt;/gi, "$1")
    .replace(/&lt;sub\s+opts=&quot;[\s\S]*?&quot;&gt;([\s\S]*?)&lt;\/sub&gt;/gi, "$1")
    .replace(/&lt;sent\s+opts=&quot;[\s\S]*?&quot;&gt;([\s\S]*?)&lt;\/sent&gt;/gi, "$1")
    .replace(/&lt;comment\s+text=&quot;([\s\S]*?)&quot;&gt;[\s\S]*?&lt;\/comment&gt;/gi, (_, t) => `<span class="wr-note">${t}</span>`);
  return html;
}

const paragraphsOf = (annotated) =>
  String(annotated || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

const when = (msVal) => (msVal ? new Date(msVal).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "");

/* ── The panel on the dashboard ── */
export async function mountWritingReview(layout) {
  const host = layout.querySelector("#db-writing-inbox");
  if (!host) return;
  injectStyles();

  try {
    const { inbox, waiting } = await api("/api/writing/submissions/inbox");
    const badge = layout.querySelector("#db-writing-waiting");
    if (badge) badge.textContent = waiting ? `${waiting} waiting` : "All reviewed";

    host.innerHTML = inbox.length
      ? inbox.map(taskRow).join("")
      : `<div class="db-empty">Nothing handed in yet. Set a task from the Writing page and assign it to your class.</div>`;
    host.querySelectorAll("[data-task]").forEach((b) => {
      b.onclick = () => openTask(b.dataset.task, b.dataset.prompt);
    });
  } catch (e) {
    host.innerHTML = `<div class="db-empty">Couldn't load writing submissions.</div>`;
  }
}

function taskRow(g) {
  return `<div class="db-assign-item">
      <div class="db-assign-top">
        <div>
          <div class="db-assign-title">${esc(g.prompt || "Writing task")}</div>
          <div class="db-assign-meta">${esc([g.formLabel, g.levelLabel].filter(Boolean).join(" · "))} · ${g.count} handed in</div>
        </div>
        ${g.waiting
          ? `<span class="db-pill pill-yellow">${g.waiting} to mark</span>`
          : `<span class="db-pill pill-green">Reviewed</span>`}
      </div>
      <div class="db-assign-progress-row" style="gap:.5rem;flex-wrap:wrap">
        <button class="db-pill pill-blue" type="button" data-task="${esc(g.taskId)}"
                data-prompt="${esc(g.prompt || "Writing task")}" style="border:none;cursor:pointer">Open ${g.count}</button>
      </div>
    </div>`;
}

/* ── One task's class list ── */
async function openTask(taskId, prompt) {
  const { root, close } = reviewModal(`
    <div class="cc-rev__hd"><strong>${esc(prompt)}</strong>
      <button class="cc-rev__x" type="button" aria-label="Close">&times;</button></div>
    <div class="cc-rev__body"><div class="db-empty">Loading…</div></div>`);
  root.querySelector(".cc-rev__x").onclick = close;
  const body = root.querySelector(".cc-rev__body");

  let data;
  try {
    data = await api(`/api/writing/task/${encodeURIComponent(taskId)}/submissions`);
  } catch (e) {
    body.innerHTML = `<div class="db-empty">Couldn't load: ${esc(e.message)}</div>`;
    return;
  }

  const { submissions } = data;
  if (!submissions.length) { body.innerHTML = `<div class="db-empty">No submissions yet.</div>`; return; }
  body.innerHTML = submissions.map((s) => subCard(taskId, s)).join("");
  submissions.forEach((s) => wireCard(body, taskId, s));
}

function subCard(taskId, s) {
  const paras = paragraphsOf(s.annotatedText || s.text);
  const shown = s.score != null ? `${s.score}%` : "—";
  const pill = s.reviewed ? "pill-green" : "pill-yellow";
  return `<details class="cc-rev__sub wr-sub" data-uid="${esc(s.studentUid)}">
      <summary>
        <span class="cc-rev__name">${esc(s.studentName)}</span>
        <span class="db-pill ${pill}">${shown}</span>
        <span class="cc-rev__date">${esc(when(s.submittedAt))}</span>
      </summary>

      <div class="wr-scores">
        <span class="wr-ai">Marked by AI: <strong>${s.aiScore == null ? "—" : `${s.aiScore}%`}</strong>${s.passes ? ` · ${s.passes} pass${s.passes === 1 ? "" : "es"}` : ""}</span>
        <span class="wr-meta">${esc([s.levelLabel, `${s.words} words`, s.attempts > 1 ? `attempt ${s.attempts}` : ""].filter(Boolean).join(" · "))}</span>
      </div>

      ${(s.rubric || []).length ? `<div class="wr-rubric">${s.rubric.map((r) => `
        <div class="wr-rubric__row">
          <span class="wr-rubric__cat">${esc(r.category)}</span>
          <span class="wr-rubric__num">${r.outOf ? `${r.score} / ${r.outOf}` : "not marked"}</span>
          <p class="wr-rubric__fb">${esc(r.feedback || "")}</p>
        </div>`).join("")}</div>` : ""}

      <div class="wr-paper">
        ${paras.map((p, i) => `
          <div class="wr-para">
            <div class="wr-para__n">${i + 1}</div>
            <div class="wr-para__text">${paperHtml(p)}</div>
            <textarea class="wr-para__c" data-para="${i}" rows="1"
              placeholder="Comment on paragraph ${i + 1}…">${esc((s.paragraphComments || {})[String(i)] || "")}</textarea>
          </div>`).join("")}
      </div>

      <label class="wr-lbl" for="wr-c-${esc(s.studentUid)}">Your comment on the whole piece</label>
      <textarea class="wr-comment" id="wr-c-${esc(s.studentUid)}" rows="3"
        placeholder="What should they do differently next time?">${esc(s.teacherComment || "")}</textarea>

      <div class="wr-actions">
        <label class="wr-lbl wr-lbl--inline" for="wr-s-${esc(s.studentUid)}">Score</label>
        <input class="wr-score" id="wr-s-${esc(s.studentUid)}" type="number" min="0" max="100" inputmode="numeric"
          value="${s.teacherScore == null ? (s.aiScore == null ? "" : s.aiScore) : s.teacherScore}" />
        <span class="wr-pct">%</span>
        <button class="btn btn-yellow wr-save" type="button">Save</button>
        <button class="btn btn-ghost wr-approve" type="button" title="Keep the score as marked and sign it off">Approve as marked</button>
        <span class="wr-msg" role="status" aria-live="polite"></span>
      </div>
    </details>`;
}

function wireCard(body, taskId, s) {
  const card = body.querySelector(`.wr-sub[data-uid="${CSS.escape(s.studentUid)}"]`);
  if (!card) return;
  const msg = card.querySelector(".wr-msg");
  const scoreEl = card.querySelector(".wr-score");

  // Comment boxes grow with what is typed in them — a teacher writing three
  // lines should not be reading them through a one-line window.
  card.querySelectorAll("textarea").forEach((t) => {
    const grow = () => { t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; };
    t.addEventListener("input", grow);
    if (t.value) setTimeout(grow, 0);
  });

  const send = async (btn, payload, done) => {
    btn.disabled = true;
    msg.textContent = "Saving…";
    msg.className = "wr-msg";
    try {
      const out = await api(
        `/api/writing/task/${encodeURIComponent(taskId)}/submissions/${encodeURIComponent(s.studentUid)}/review`,
        { method: "POST", body: JSON.stringify(payload) },
      );
      msg.textContent = done;
      msg.className = "wr-msg is-ok";
      // The pill in the summary line is the score the student will now see.
      const pill = card.querySelector("summary .db-pill");
      if (pill && out.submission) {
        pill.textContent = out.submission.score == null ? "—" : `${out.submission.score}%`;
        pill.className = "db-pill pill-green";
      }
    } catch (e) {
      msg.textContent = e.message;
      msg.className = "wr-msg is-bad";
    }
    btn.disabled = false;
  };

  const paragraphComments = () => {
    const out = {};
    card.querySelectorAll(".wr-para__c").forEach((t) => {
      if (t.value.trim()) out[t.dataset.para] = t.value.trim();
    });
    return out;
  };

  card.querySelector(".wr-save").onclick = (e) => {
    const raw = scoreEl.value.trim();
    const n = Number(raw);
    if (raw !== "" && (!Number.isFinite(n) || n < 0 || n > 100)) {
      msg.textContent = "A score is 0 to 100.";
      msg.className = "wr-msg is-bad";
      return;
    }
    send(e.currentTarget, {
      // An empty box means "take my override off" — back to the AI's number,
      // which is a thing a teacher must be able to undo.
      score: raw === "" ? null : n,
      approved: true,
      comment: card.querySelector(".wr-comment").value,
      paragraphComments: paragraphComments(),
    }, "Saved — the student sees this.");
  };

  card.querySelector(".wr-approve").onclick = (e) =>
    send(e.currentTarget, { approved: true, score: null }, "Approved as marked.");
}

function reviewModal(html) {
  const { root, close } = modal("");
  root.querySelector(".cc-modal__card").className = "cc-modal__card cc-rev wr-rev";
  root.querySelector(".cc-modal__card").innerHTML = html;
  return { root, close };
}

function injectStyles() {
  if (document.getElementById("wr-styles")) return;
  const s = document.createElement("style");
  s.id = "wr-styles";
  s.textContent = `
    .wr-rev { width: min(760px,100%); }
    .wr-scores { display:flex; flex-wrap:wrap; gap:.6rem; justify-content:space-between; font-size:.7rem;
      color:var(--text-secondary,#6b655c); margin:.6rem 0 .4rem; }
    .wr-ai strong { color: var(--ink,#2a2723); }
    .wr-rubric { display:grid; gap:.4rem; margin:.4rem 0 .8rem; }
    .wr-rubric__row { display:grid; grid-template-columns:1fr auto; gap:.2rem .6rem; }
    .wr-rubric__cat { font-family:var(--font-display,sans-serif); font-weight:700; font-size:.74rem; }
    .wr-rubric__num { font-size:.74rem; color:var(--text-secondary,#6b655c); }
    .wr-rubric__fb { grid-column:1/-1; margin:0; font-size:.72rem; line-height:1.45; color:var(--text-secondary,#6b655c); }
    .wr-paper { border-top:1px dashed color-mix(in srgb, var(--ink) 14%, transparent); padding-top:.6rem; }
    .wr-para { display:grid; grid-template-columns:1.4rem 1fr; gap:.4rem .5rem; margin-bottom:.8rem; }
    .wr-para__n { font-family:var(--font-display,sans-serif); font-weight:900; font-size:.7rem;
      color:var(--text-tertiary,#9a948a); padding-top:.15rem; }
    .wr-para__text { font-size:.84rem; line-height:1.7; white-space:pre-wrap; }
    .wr-para__c { grid-column:2; resize:none; overflow:hidden; }
    .wr-mark { border-bottom:2px solid var(--accent-danger,#e07a5f); }
    .wr-mark sup { font-size:.6em; color:var(--accent-danger,#e07a5f); margin-left:1px; }
    .wr-good { background:color-mix(in srgb, var(--accent-success,#6db58f) 22%, transparent); }
    .wr-note { display:inline-block; font-size:.7rem; font-style:italic; color:var(--text-secondary,#6b655c); }
    .wr-lbl { display:block; font-size:.6rem; text-transform:uppercase; letter-spacing:.06em;
      color:var(--text-secondary,#6b655c); margin:.6rem 0 .25rem; }
    .wr-lbl--inline { display:inline; margin:0; }
    .wr-rev textarea, .wr-rev input[type=number] { width:100%; box-sizing:border-box; padding:.45rem .6rem; border-radius:9px;
      font-family:inherit; font-size:.78rem; line-height:1.5; background:var(--surface-primary,#fffdf8); color:var(--ink,#2a2723);
      border:2px solid color-mix(in srgb, var(--ink) 12%, transparent); text-transform:none; letter-spacing:normal; }
    .wr-actions { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; margin-top:.7rem; }
    /* Beats .wr-rev input[type=number] above, which is width:100% for the
       comment boxes — a score is two digits and must not take a whole row. */
    .wr-rev .wr-actions input.wr-score { width:5.5rem; }
    .wr-pct { font-size:.78rem; color:var(--text-secondary,#6b655c); margin-left:-.3rem; }
    .wr-msg { font-size:.7rem; color:var(--text-secondary,#6b655c); }
    .wr-msg.is-ok { color:var(--accent-success,#6db58f); }
    .wr-msg.is-bad { color:var(--accent-danger,#e07a5f); }`;
  document.head.appendChild(s);
}
