import { pct, fmtDate } from "./utils.js";

export function assignmentItemHTML(t, showProgress = true) {
  const STATUS = {
    pending: { label: "Pending", cls: "pill-grey" },
    "in-progress": { label: "In Progress", cls: "pill-blue" },
    completed: { label: "Done", cls: "pill-green" },
    overdue: { label: "Overdue", cls: "pill-red" },
  };
  const s = STATUS[t.status] || STATUS.pending;
  const progress = pct(t.progress, t.status === "completed" ? 100 : 0);

  return `
    <div class="db-assign-item">
      <div class="db-assign-top">
        <div>
          <div class="db-assign-title">${t.title}</div>
          <div class="db-assign-meta">${t.subject || "General Math"} &bull; Due ${fmtDate(t.dueDate)}</div>
        </div>
        <span class="db-pill ${s.cls}">${s.label}</span>
      </div>
      ${
        showProgress
          ? `
        <div class="db-assign-progress-row">
          <div class="db-assign-track">
            <div class="db-assign-fill" style="width:${progress}%"></div>
          </div>
          <span class="db-assign-pct">${progress}%</span>
        </div>`
          : ""
      }
    </div>`;
}

export function perfBarHTML(label, score, color = "var(--blue)") {
  return `
    <div class="db-perf-row">
      <span class="db-perf-label">${label}</span>
      <div class="db-perf-track">
        <div class="db-perf-fill" style="width:${pct(score)}%;background:${color}"></div>
      </div>
      <span class="db-perf-val">${pct(score)}%</span>
    </div>`;
}
