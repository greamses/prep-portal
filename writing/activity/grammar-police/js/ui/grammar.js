import { state } from "../utils/state.js";

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

  const trigger = wrapper.querySelector(".pp-select-trigger");
  const rect = trigger.getBoundingClientRect();

  const menu = document.createElement("div");
  menu.className = "pp-select-menu";

  options.forEach((opt) => {
    const item = document.createElement("div");
    item.className = "pp-select-item";
    const current = (wrapper.dataset.value || "").toLowerCase();
    if (current && current === opt.toLowerCase()) item.classList.add("active");
    item.textContent = opt;
    item.addEventListener("mousedown", (e) => e.preventDefault());
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      wrapper.dataset.value = opt.toLowerCase();
      trigger.querySelector(".pp-select-val").textContent = opt;
      wrapper.classList.add("has-value");
      closeInlineMenu();
      updateProgress(passageIdx);
    });
    menu.appendChild(item);
  });

  // Fixed menu anchored to the trigger. We MUST set right:auto + an explicit
  // width, otherwise select.css's `.pp-select-menu{right:0}` stretches it to the
  // viewport edge. Append hidden first so we can measure it, then open below or
  // (when there isn't room) flip above and clamp into the viewport — so a low
  // blank's menu is never hidden behind the page foot / Check button.
  const minW = Math.max(rect.width, 84);
  const M = 6;
  menu.style.cssText =
    `position:fixed;display:flex;flex-direction:column;right:auto;` +
    `width:max-content;min-width:${minW}px;max-width:240px;z-index:99999;` +
    `visibility:hidden;left:${rect.left}px;top:0;`;
  _activeMenu = menu;
  document.body.appendChild(menu);

  const mh = menu.offsetHeight;
  const mw = menu.offsetWidth;
  const spaceBelow = window.innerHeight - rect.bottom - M;
  const spaceAbove = rect.top - M;

  let top;
  if (mh <= spaceBelow) top = rect.bottom + 3; // fits below
  else if (mh <= spaceAbove) top = rect.top - mh - 3; // flip above
  else top = spaceBelow >= spaceAbove ? window.innerHeight - mh - M : M;
  top = Math.max(M, Math.min(top, window.innerHeight - mh - M));

  const left = Math.max(M, Math.min(rect.left, window.innerWidth - mw - M));

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
  menu.style.visibility = "";

  setTimeout(
    () => document.addEventListener("click", closeInlineMenu, { once: true }),
    0,
  );
}

// ── Blank builder ────────────────────────────────────────────
export function buildBlank(seg, passageIdx) {
  const group = state.wordGroups[seg.group];
  const correct = seg.correct.toLowerCase();
  const options = [...group.options].sort(() => Math.random() - 0.5);

  // Kid-friendly multicolour highlighter — colour keyed to the word group.
  const COLOR = { theyre: "blue", were: "green", youre: "purple", its: "pink", totwo: "orange", thanthen: "teal", inon: "orange" };
  const wrapper = document.createElement("span");
  wrapper.className = `pp-select pp-select--sm gp-blank gp-hl gp-hl--${COLOR[seg.group] || "blue"}`;
  wrapper.dataset.correct = correct;
  wrapper.dataset.passage = passageIdx;
  wrapper.dataset.value = "";

  const trigger = document.createElement("button");
  trigger.className = "pp-select-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-label", `Choose: ${group.label}`);
  trigger.innerHTML = `<span class="pp-select-val">pick…</span><svg class="pp-select-chevron chevron-svg" viewBox="0 0 10 6" width="10" height="10" fill="none" aria-hidden="true"><polyline points="1,1 5,5.5 9,1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
    `.gp-blank[data-passage="${passageIdx}"]`,
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
    `.gp-blank[data-passage="${passageIdx}"]`,
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
    .querySelectorAll(`.gp-blank[data-passage="${passageIdx}"]`)
    .forEach((sel) => {
      sel.dataset.value = "";
      const val = sel.querySelector(".pp-select-val");
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
