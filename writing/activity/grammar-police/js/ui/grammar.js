import { WORD_GROUPS } from "../data/grammarData.js";

// ── Floating menu state ──────────────────────────────────────
let _activeMenu = null;
let _activeWrapper = null;

function closeInlineMenu() {
  if (_activeMenu) {
    _activeMenu.remove();
    _activeMenu = null;
  }
  if (_activeWrapper) {
    _activeWrapper.classList.remove("open");
    _activeWrapper = null;
  }
}

function openInlineMenu(wrapper, options, passageIdx) {
  closeInlineMenu();
  _activeWrapper = wrapper;
  wrapper.classList.add("open");

  const trigger = wrapper.querySelector(".gp-inline-trigger");
  const rect = trigger.getBoundingClientRect();

  const menu = document.createElement("div");
  menu.className = "gp-inline-menu";

  const spaceBelow = window.innerHeight - rect.bottom;
  if (spaceBelow < 150 && rect.top > spaceBelow) {
    menu.style.cssText = `position:fixed;left:${rect.left}px;bottom:${window.innerHeight - rect.top + 3}px;min-width:${Math.max(rect.width, 88)}px;z-index:99999;`;
  } else {
    menu.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.bottom + 3}px;min-width:${Math.max(rect.width, 88)}px;z-index:99999;`;
  }

  options.forEach((opt) => {
    const item = document.createElement("div");
    item.className = "gp-inline-item";
    const current = (wrapper.dataset.value || "").toLowerCase();
    if (current && current === opt.toLowerCase()) item.classList.add("active");
    item.textContent = opt;
    item.addEventListener("mousedown", (e) => e.preventDefault());
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      wrapper.dataset.value = opt.toLowerCase();
      trigger.querySelector(".gp-inline-val").textContent = opt;
      wrapper.classList.add("has-value");
      closeInlineMenu();
      updateProgress(passageIdx);
    });
    menu.appendChild(item);
  });

  _activeMenu = menu;
  document.body.appendChild(menu);

  setTimeout(
    () => document.addEventListener("click", closeInlineMenu, { once: true }),
    0,
  );
}

// ── Blank builder ────────────────────────────────────────────
export function buildBlank(seg, passageIdx) {
  const group = WORD_GROUPS[seg.group];
  const correct = seg.correct.toLowerCase();
  const options = [...group.options].sort(() => Math.random() - 0.5);

  const wrapper = document.createElement("span");
  wrapper.className = "gp-inline-select";
  wrapper.dataset.correct = correct;
  wrapper.dataset.passage = passageIdx;
  wrapper.dataset.value = "";

  const trigger = document.createElement("button");
  trigger.className = "gp-inline-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-label", `Choose: ${group.label}`);
  trigger.innerHTML = `<span class="gp-inline-val">pick…</span><svg class="gp-inline-chev" viewBox="0 0 10 6" width="8" height="8" fill="none" aria-hidden="true"><polyline points="1,1 5,5.5 9,1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  trigger.addEventListener("mousedown", (e) => e.stopPropagation());
  trigger.addEventListener("touchstart", (e) => e.stopPropagation(), {
    passive: true,
  });
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    openInlineMenu(wrapper, options, passageIdx);
  });

  wrapper.appendChild(trigger);
  return wrapper;
}

// ── Progress tracking ────────────────────────────────────────
export function updateProgress(passageIdx) {
  const blanks = document.querySelectorAll(
    `.gp-inline-select[data-passage="${passageIdx}"]`,
  );
  const filled = [...blanks].filter((b) => b.dataset.value).length;
  const total = blanks.length;
  const pct = total ? (filled / total) * 100 : 0;

  const fill = document.getElementById(`prog-${passageIdx}`);
  const text = document.getElementById(`prog-text-${passageIdx}`);
  if (fill) fill.style.width = pct + "%";
  if (text) text.textContent = `${filled} / ${total} filled`;
}

// ── Check ────────────────────────────────────────────────────
export function checkPassage(passageIdx) {
  const blanks = document.querySelectorAll(
    `.gp-inline-select[data-passage="${passageIdx}"]`,
  );
  let correct = 0,
    answered = 0;

  blanks.forEach((sel) => {
    sel.classList.remove(
      "gp-blank--correct",
      "gp-blank--wrong",
      "gp-blank--unfilled",
    );
    const val = sel.dataset.value || "";
    if (!val) {
      sel.classList.add("gp-blank--unfilled");
      return;
    }
    answered++;
    const ok = val === sel.dataset.correct;
    sel.classList.add(ok ? "gp-blank--correct" : "gp-blank--wrong");
    if (ok) correct++;
  });

  setTimeout(() => {
    document
      .querySelectorAll(".gp-blank--unfilled")
      .forEach((b) => b.classList.remove("gp-blank--unfilled"));
  }, 800);

  const pct = answered ? Math.round((correct / answered) * 100) : 0;
  const tier = pct === 100 ? "perfect" : pct >= 70 ? "good" : "low";
  const scoreEl = document.getElementById(`score-${passageIdx}`);
  if (scoreEl) {
    scoreEl.innerHTML = `<span class="pc-score-pill pc-score-pill--${tier}">${pct === 100 ? "✨ " : ""}${correct} / ${answered} correct</span>`;
  }
}

// ── Reset ────────────────────────────────────────────────────
export function resetPassage(passageIdx) {
  document
    .querySelectorAll(`.gp-inline-select[data-passage="${passageIdx}"]`)
    .forEach((sel) => {
      sel.dataset.value = "";
      const val = sel.querySelector(".gp-inline-val");
      if (val) val.textContent = "pick…";
      sel.classList.remove(
        "has-value",
        "gp-blank--correct",
        "gp-blank--wrong",
        "gp-blank--unfilled",
      );
    });
  const scoreEl = document.getElementById(`score-${passageIdx}`);
  if (scoreEl) scoreEl.innerHTML = "";
  updateProgress(passageIdx);
}

// ── Paragraph renderer ───────────────────────────────────────
export function renderParas(paraArray, passageIdx, container) {
  paraArray.forEach((para) => {
    const p = document.createElement("p");
    p.className = "book-para";
    para.forEach((seg) => {
      if (typeof seg === "string") {
        p.appendChild(document.createTextNode(seg));
      } else {
        p.appendChild(buildBlank(seg, passageIdx));
      }
    });
    container.appendChild(p);
  });
}
