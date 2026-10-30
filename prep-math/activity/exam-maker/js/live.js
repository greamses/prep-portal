import { faceOf } from "/utils/components/workbook/icons.js";
import { UI } from "/utils/components/ui-icons.js";

/* ============================================================================
   The paper, answered on screen
   ----------------------------------------------------------------------------
   The same paper, the same design: the bubbles can be shaded by clicking, the
   blank is a line you can type on, the ruled lines are a page you can write on.
   Nothing about how the paper looks changes; this only makes it answerable.

   Answers are kept by question id, so editing the paper (or the paper being
   drawn again) never loses what was written. Checking marks the multiple choice
   and the one-word blanks; a written answer is shown beside the model answer
   for the learner or teacher to mark, because no code can mark an argument.
   ========================================================================== */

const KEY = "xm-live-v1";

const load = (key) => { try { return JSON.parse(localStorage.getItem(key) || "null") || {}; } catch { return {}; } };

/** "$\text{12 cm}$", " 12  CM. " and "12 cm" are the same answer. */
export function norm(s) {
  return String(s == null ? "" : s)
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\[,;! ]/g, "")
    .replace(/[$\s{}]/g, "")
    .replace(/[.,;:]+$/g, "")
    .toLowerCase();
}

/** Does what was typed match the answer? Alternatives may be written "a / b" or "a or b". */
export function matches(typed, answer) {
  const t = norm(typed);
  if (!t) return false;
  const options = String(answer || "").split(/\s*(?:\/|\||;|\bor\b)\s*/i).map(norm).filter(Boolean);
  return options.some((o) => {
    if (o === t) return true;
    const a = parseFloat(o), b = parseFloat(t);
    return Number.isFinite(a) && Number.isFinite(b) && a === b && /^-?[\d.]+$/.test(o) && /^-?[\d.]+$/.test(t);
  });
}

/* `store` is where this paper's answers are kept; a shared paper has its own, so
   it never mixes with the papers made on the bench */
export function createLive(sheet, { onChange = () => {}, store = KEY } = {}) {
  let answers = load(store);
  let on = false;
  let checked = false;
  const keep = () => { try { localStorage.setItem(store, JSON.stringify(answers)); } catch { /* storage full or off */ } };

  const byId = (questions) => new Map(questions.map((q) => [q.id, q]));

  /* a shaded choice shows on the question AND on the OMR sheet, whichever was clicked */
  const paintPick = (id, got) => {
    sheet.querySelectorAll(`.xp-q--mcq[data-qid="${id}"] .xp-opts li`).forEach((li, k) => {
      li.classList.toggle("is-picked", k === got); li.setAttribute("aria-checked", String(k === got));
    });
    document.querySelectorAll(`.xp-omr li[data-qid="${id}"] b`).forEach((b) => b.classList.toggle("is-picked", Number(b.dataset.i) === got));
  };

  /** Make every question on the sheet answerable (the sheet has just been drawn). */
  function apply(questions) {
    if (!on) return;
    const qs = byId(questions);
    sheet.classList.add("xp-live");
    sheet.querySelectorAll(".xp-q[data-qid]").forEach((el) => {
      const q = qs.get(el.dataset.qid);
      if (!q) return;
      const got = answers[q.id];

      if (q.type === "mcq") {
        const items = [...el.querySelectorAll(".xp-opts li")];
        items.forEach((li, i) => {
          li.tabIndex = 0;
          li.setAttribute("role", "radio");
          li.classList.toggle("is-picked", got === i);
          li.setAttribute("aria-checked", String(got === i));
          const pick = () => {
            if (checked) return;
            answers[q.id] = i; keep();
            paintPick(q.id, i);
            onChange();
          };
          li.addEventListener("click", pick);
          li.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); pick(); } });
        });
      } else if (q.type === "fill") {
        const blank = el.querySelector(".xp-blank");
        if (blank) {
          const input = document.createElement("input");
          input.type = "text"; input.className = "xp-in"; input.autocomplete = "off"; input.spellcheck = false;
          input.setAttribute("aria-label", `Answer to question ${el.querySelector(".xp-n")?.textContent || ""}`);
          input.value = got || "";
          input.disabled = checked;
          input.addEventListener("input", () => { answers[q.id] = input.value; keep(); onChange(); });
          blank.replaceWith(input);
        }
      } else if (!el.classList.contains("xp-q--sheeted")) {
        const lines = el.querySelector(".xp-lines");
        const box = document.createElement("textarea");
        box.className = "xp-ta";
        box.rows = Math.max(3, q.lines | 0 || 3);
        box.setAttribute("aria-label", `Answer to question ${el.querySelector(".xp-n")?.textContent || ""}`);
        box.value = got || "";
        box.disabled = checked;
        box.addEventListener("input", () => { answers[q.id] = box.value; keep(); onChange(); });
        if (lines) lines.replaceWith(box); else el.querySelector(".xp-body").appendChild(box);
      }
    });
    wireOmr(sheet);
    mountDrawer();
    /* the theory sheet: a page to write on, in the block for its question */
    sheet.querySelectorAll(".xp-ans[data-qid]").forEach((blk) => {
      const q = qs.get(blk.dataset.qid);
      if (!q) return;
      const lines = blk.querySelector(".xp-lines");
      const box = document.createElement("textarea");
      box.className = "xp-ta";
      box.rows = Math.max(4, (lines ? lines.children.length : 4));
      box.setAttribute("aria-label", `Answer to ${blk.querySelector(".xp-ans__tag b")?.textContent || "the question"}`);
      box.value = answers[q.id] || "";
      box.disabled = checked;
      box.addEventListener("input", () => { answers[q.id] = box.value; keep(); onChange(); });
      if (lines) lines.replaceWith(box); else blk.appendChild(box);
    });
    if (checked) showResults(questions);
  }

  /** The OMR rows under `root` (the page at the end, or the side drawer): the same answers, shaded there. */
  function wireOmr(root) {
    root.querySelectorAll(".xp-omr li[data-qid], .xo-omr li[data-qid]").forEach((li) => {
      const id = li.dataset.qid;
      li.querySelectorAll("b").forEach((b) => {
        b.classList.toggle("is-picked", answers[id] === Number(b.dataset.i));
        b.tabIndex = 0; b.setAttribute("role", "radio");
        const pick = () => {
          if (checked) return;
          answers[id] = Number(b.dataset.i); keep(); paintPick(id, answers[id]); onChange();
        };
        b.addEventListener("click", pick);
        b.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); pick(); } });
      });
    });
  }

  /* ── the OMR sheet, from the side ───────────────────────────────────────
     While the paper is being answered, the OMR sheet is not a page at the end
     to scroll to: it is a drawer on the right edge with a tab to open it, so the
     questions and the sheet are in view together. It is built from the sheet the
     paper already carries (so the numbering is the paper's own) and the page at
     the end is hidden on screen while this is up; printing still gets the page. */
  let drawerOpen = false;
  function unmountDrawer() {
    document.querySelector(".xo-drawer")?.remove();
    document.querySelector(".xo-tab")?.remove();
  }
  function mountDrawer() {
    unmountDrawer();
    const page = sheet.querySelector(".xp-sheetpage.xp-omr");
    if (!on || !page) return;
    const article = page.closest(".xp");
    const grid = page.querySelector(".xp-omr__grid").cloneNode(true);

    const tab = document.createElement("button");
    tab.type = "button"; tab.className = "pp-btn xo-tab"; faceOf(tab, UI.target(20), "OMR sheet", "left");
    tab.setAttribute("aria-expanded", String(drawerOpen));

    const drawer = document.createElement("aside");
    drawer.className = "xo-drawer" + (drawerOpen ? " is-open" : "");
    drawer.setAttribute("aria-label", "OMR answer sheet");
    drawer.setAttribute("style", article.getAttribute("style") || "");
    const head = document.createElement("div");
    head.className = "xo-drawer__head";
    head.innerHTML = "<b>OMR sheet</b><span>Shade one bubble for each question.</span>";
    const close = document.createElement("button");
    close.type = "button"; close.className = "pp-btn xo-close"; faceOf(close, UI.close(18), "Close the OMR sheet", "right");
    head.appendChild(close);
    const body = document.createElement("div");
    body.className = "xp-omr xo-omr";
    body.appendChild(grid);
    drawer.append(head, body);
    document.body.append(drawer, tab);

    const set = (v) => {
      drawerOpen = v;
      drawer.classList.toggle("is-open", v);
      tab.setAttribute("aria-expanded", String(v));
    };
    tab.addEventListener("click", () => set(!drawerOpen));
    close.addEventListener("click", () => set(false));
    wireOmr(drawer);
  }

  /** Mark what can be marked and show the model answer where it cannot. */
  function showResults(questions) {
    const qs = byId(questions);
    sheet.querySelectorAll(".xp-q[data-qid]").forEach((el) => {
      const q = qs.get(el.dataset.qid);
      if (!q) return;
      el.querySelector(".xp-reveal")?.remove();
      const body = el.querySelector(".xp-body");
      const say = (cls, html) => {
        const d = document.createElement("div");
        d.className = `xp-reveal ${cls}`; d.setAttribute("data-nomath", "");
        d.innerHTML = html;
        body.appendChild(d);
      };
      const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      if (q.type === "mcq") {
        const got = answers[q.id];
        [...el.querySelectorAll(".xp-opts li")].forEach((li, i) => {
          li.classList.toggle("is-right", i === q.answer);
          li.classList.toggle("is-wrong", got === i && i !== q.answer);
        });
        document.querySelectorAll(`.xp-omr li[data-qid="${q.id}"] b`).forEach((b) => {
          const i = Number(b.dataset.i);
          b.classList.toggle("is-right", i === q.answer);
          b.classList.toggle("is-wrong", got === i && i !== q.answer);
        });
        if (got === undefined) say("is-skipped", "Not answered.");
      } else if (q.type === "fill") {
        const ok = matches(answers[q.id], q.answer);
        el.classList.toggle("is-ok", ok); el.classList.toggle("is-no", !ok);
        say(ok ? "is-ok" : "is-no", ok ? "Correct." : `Answer: ${esc(q.answer)}`);
      } else {
        say("is-model", `<b>Model answer</b> ${esc(q.answer || "No model answer was written.")}<br><i>Mark this one yourself: it is worth ${q.marks} mark${q.marks === 1 ? "" : "s"}.</i>`);
      }
    });
  }

  /** Marks won on the questions code can mark, and how many are left to the learner. */
  function score(questions) {
    let won = 0, auto = 0, manual = 0, answered = 0;
    questions.forEach((q) => {
      const got = answers[q.id];
      if (got !== undefined && got !== "") answered++;
      if (q.type === "mcq") { auto += q.marks; if (got === q.answer) won += q.marks; }
      else if (q.type === "fill") { auto += q.marks; if (matches(got, q.answer)) won += q.marks; }
      else manual++;
    });
    return { won, auto, manual, answered, total: questions.length };
  }

  return {
    get on() { return on; },
    get checked() { return checked; },
    setOn(v) { on = !!v; if (!on) { checked = false; sheet.classList.remove("xp-live"); unmountDrawer(); } },
    check(questions) { checked = true; return score(questions); },
    reopen() { checked = false; },
    clear() { answers = {}; checked = false; keep(); },
    score,
    apply,
    /** Just before printing: a box nobody wrote in goes back to the ruled lines the
        paper is designed with; what was written stays, as text. */
    forPrint() {
      sheet.querySelectorAll(".xp-ta").forEach((box) => {
        if (box.value.trim()) return;
        const lines = document.createElement("div");
        lines.className = "xp-lines";
        lines.innerHTML = "<i></i>".repeat(Math.max(3, box.rows));
        box.replaceWith(lines);
      });
    },
  };
}
