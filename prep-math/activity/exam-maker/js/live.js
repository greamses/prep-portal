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

/* The student's own name, typed on the line at the top of the paper. It is kept on this device for
   every paper (a learner types it once), and it is the name a shared paper's score goes to the
   teacher under. */
const NAME_KEY = "pp-student-name";
export const savedName = () => { try { return (localStorage.getItem(NAME_KEY) || "").slice(0, 60); } catch { return ""; } };
const keepName = (v) => { try { localStorage.setItem(NAME_KEY, String(v).slice(0, 60)); } catch { /* private window */ } };

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
export function createLive(sheet, { onChange = () => {}, store = KEY, getAttempt = () => ({}), ensureOmr = () => {}, onComplete = null, onPrint = null, onName = () => {} } = {}) {
  let answers = load(store);
  let on = false;
  let checked = false;
  let lastQuestions = [];
  let announced = false;
  let idle = 0;
  const keep = () => {
    try { localStorage.setItem(store, JSON.stringify(answers)); } catch { /* storage full or off */ }
    paintAttempts();
    /* DONE is when every question the paper asks to be attempted has an answer. The paper is then
       scored on its own once the learner has stopped writing for a few seconds (more writing
       puts the wait back), so nobody has to find a button. "Answer again" reopens it. */
    clearTimeout(idle);
    if (on && !checked && onComplete && isComplete(lastQuestions)) {
      idle = setTimeout(() => { if (on && !checked && isComplete(lastQuestions)) onComplete(); }, 3500);
    }
  };

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
    lastQuestions = questions;
    const qs = byId(questions);
    sheet.classList.add("xp-live");
    wireName();
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
    paintAttempts();
    if (checked) { showResults(questions); paintStamp(true); announce(); }
  }

  /* "Attempted 2 of 3" in the heading of a section that says "answer any 3"; it turns to a warning
     when more are answered than count, and says only the best ones are marked */
  function paintAttempts() {
    if (!on) return;
    const att = getAttempt() || {};
    ["mcq", "fill", "sub", "theory"].forEach((type) => {
      const list = lastQuestions.filter((q) => q.type === type);
      const sec = sheet.querySelector(`.xp-sec--${type} .xp-banner`);
      if (!sec) return;
      sec.querySelector(".xp-banner__att")?.remove();
      const n = Math.round(Number(att[type]) || 0);
      if (!(n > 0 && n < list.length)) return;
      const done = list.filter((q) => answers[q.id] !== undefined && String(answers[q.id]).trim() !== "").length;
      const span = document.createElement("span");
      span.className = "xp-banner__att" + (done > n ? " is-over" : "");
      span.setAttribute("data-nomath", "");
      span.textContent = done > n ? `Attempted ${done}, only ${n} count` : `Attempted ${done} of ${n}`;
      sec.appendChild(span);
    });
  }

  /* the "Student's name" line, here and on the OMR sheet, becomes a place to type; they share one name */
  function wireName() {
    sheet.querySelectorAll(".xp-student > i:first-of-type").forEach((line) => {
      if (line.classList.contains("xp-sheetwho__short")) return;
      const input = document.createElement("input");
      input.type = "text"; input.className = "xp-name"; input.maxLength = 60;
      input.autocomplete = "name"; input.spellcheck = false;
      input.setAttribute("aria-label", "Your name");
      input.placeholder = "Type your name";
      input.value = savedName();
      input.addEventListener("input", () => {
        keepName(input.value);
        sheet.querySelectorAll(".xp-name").forEach((o) => { if (o !== input) o.value = input.value; });
        onName(input.value);
      });
      line.replaceWith(input);
    });
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
    if (!on) return;
    const page = sheet.querySelector(".xp-sheetpage.xp-omr");

    /* The toggle sits at the BOTTOM of the edge the sheet slides in from, and moves out with it.
       Without a sheet on the paper it makes one (ensureOmr) and opens it. */
    const tab = document.createElement("button");
    tab.type = "button"; tab.className = "pp-btn xo-tab" + (drawerOpen && page ? " is-open" : "");
    faceOf(tab, UI.target(20), "OMR sheet", "left");
    tab.setAttribute("aria-expanded", String(drawerOpen && !!page));
    if (!page) {
      tab.addEventListener("click", () => { drawerOpen = true; ensureOmr(); });
      document.body.appendChild(tab);
      return;
    }
    const article = page.closest(".xp");
    /* the paper's own rows, dealt into THREE sets side by side: a drawer one row wide
       is as tall as the paper, three wide puts a whole sheet in view */
    const rows = [...page.querySelectorAll(".xp-omr li")].map((li) => li.cloneNode(true));
    const grid = document.createElement("div");
    grid.className = "xp-omr__grid";
    const per = Math.max(1, Math.ceil(rows.length / 3));
    for (let i = 0; i < rows.length; i += per) {
      const ol = document.createElement("ol");
      rows.slice(i, i + per).forEach((li) => ol.appendChild(li));
      grid.appendChild(ol);
    }

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
      tab.classList.toggle("is-open", v);
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
        say("is-model", `<b>Model answer</b> ${esc(q.answer || "No model answer was written.")}`
          + `<label class="xp-selfmark">Your mark <input type="number" min="0" max="${q.marks}" step="1" inputmode="numeric" aria-label="Your mark for this answer, out of ${q.marks}"> out of ${q.marks}</label>`);
        const box = body.querySelector(".xp-reveal.is-model .xp-selfmark input");
        if (box) {
          if (answers["m:" + q.id] !== undefined) box.value = answers["m:" + q.id];
          box.addEventListener("input", () => {
            if (box.value === "") delete answers["m:" + q.id];
            else answers["m:" + q.id] = Math.max(0, Math.min(q.marks, Math.round(+box.value) || 0));
            keep(); paintStamp(false); announce(); onChange();
          });
        }
      }
    });
  }

  const GRADES = [
    { min: 70, g: "A", say: "Excellent" },
    { min: 60, g: "B", say: "Very good" },
    { min: 50, g: "C", say: "Good" },
    { min: 45, g: "D", say: "Fair" },
    { min: 40, g: "E", say: "Pass" },
    { min: 0, g: "F", say: "Keep practising" },
  ];
  const gradeFor = (pct) => GRADES.find((x) => pct >= x.min) || GRADES[GRADES.length - 1];

  /* how many of a kind are to be attempted ("answer any 3"), and whether a question has an answer */
  const nFor = (att, type, count) => { const n0 = Math.round(Number(att[type]) || 0); return n0 > 0 && n0 < count ? n0 : count; };
  const given = (q) => answers[q.id] !== undefined && String(answers[q.id]).trim() !== "";

  /** Has every question that is to be attempted been answered? */
  function isComplete(questions) {
    if (!questions.length) return false;
    const att = getAttempt() || {};
    return ["mcq", "fill", "sub", "theory"].every((type) => {
      const list = questions.filter((q) => q.type === type);
      return !list.length || list.filter(given).length >= nFor(att, type, list.length);
    });
  }

  /** Marks won, what the paper is out of, and what is still to be marked by hand.
      A section that says "answer any 3" counts its 3 best answers and is out of its 3 best-paying.
      The multiple choice and the one-word blanks are marked by the page; a written answer carries the
      mark its marker gave it (the number beside the model answer). */
  function score(questions) {
    const att = getAttempt() || {};
    const top = (nums, n) => nums.sort((a, b) => b - a).slice(0, n).reduce((s, m) => s + m, 0);
    let won = 0, outOf = 0, auto = 0, manual = 0, answered = 0, total = 0, pending = 0;
    for (const type of ["mcq", "fill", "sub", "theory"]) {
      const list = questions.filter((q) => q.type === type);
      if (!list.length) continue;
      const n = nFor(att, type, list.length);
      total += n;
      const got = list.filter(given);
      answered += Math.min(n, got.length);
      const out = top(list.map((q) => q.marks), n);
      outOf += out;
      if (type === "mcq" || type === "fill") {
        const right = (q) => (type === "mcq" ? answers[q.id] === q.answer : matches(answers[q.id], q.answer));
        auto += out;
        won += top(got.filter(right).map((q) => q.marks), n);
      } else {
        manual += n;
        const mark = (q) => Math.max(0, Math.min(q.marks, Number(answers["m:" + q.id]) || 0));
        won += top(got.map(mark), n);
        pending += Math.min(n, got.filter((q) => answers["m:" + q.id] === undefined).length);
      }
    }
    return { won, outOf, auto, manual, answered, total, pending, pct: outOf ? Math.round((100 * won) / outOf) : 0 };
  }

  /* ── the grade stamp ────────────────────────────────────────────────────
     When the paper is checked, a rubber stamp comes down on the header: the grade, the marks, and
     a word. The same marks go in the score box. It prints with the paper. */
  function paintStamp(animate) {
    sheet.querySelectorAll(".xp-stamp").forEach((n) => n.remove());
    if (!on || !checked) return;
    const host = sheet.querySelector(".xp-receipt__paper");
    if (!host) return;
    const s = score(lastQuestions);
    const gr = gradeFor(s.pct);
    const st = document.createElement("div");
    st.className = "xp-stamp" + (animate ? "" : " is-still");
    st.setAttribute("data-nomath", "");
    st.setAttribute("role", "img");
    st.setAttribute("aria-label", `Grade ${gr.g}, ${s.won} out of ${s.outOf} marks`);
    st.innerHTML = `<b>${gr.g}</b><span>${s.won} / ${s.outOf}</span><i>${s.pending ? "marking" : gr.say}</i>`;
    host.appendChild(st);
    const box = sheet.querySelector(".xp-student em");
    if (box) box.textContent = `${s.won} / ${s.outOf}`;
  }

  /* ── done: the result, and a suggestion to print it ────────────────────────
     A note comes up with the score and grade and offers to print the marked paper. It follows the marks
     as they are given to the written answers. */
  function noticeText() {
    const s = score(lastQuestions);
    const gr = gradeFor(s.pct);
    return s.pending
      ? `Scored ${s.won} of ${s.outOf} so far. Mark your ${s.pending} written answer${s.pending === 1 ? "" : "s"}, then print the paper.`
      : `Done: ${s.won} of ${s.outOf} marks, grade ${gr.g} (${gr.say}). Print your marked paper to keep it.`;
  }
  function announce() {
    if (!on || !checked) return;
    const say = document.querySelector(".xo-done .xo-done__say");
    if (say) { say.textContent = noticeText(); return; }
    if (announced) return;
    announced = true;
    const box = document.createElement("div");
    box.className = "xo-done";
    box.setAttribute("role", "status");
    box.innerHTML = `<span class="xo-done__say"></span>`;
    const print = document.createElement("button");
    print.type = "button"; print.className = "pp-btn xo-done__print";
    faceOf(print, UI.print(18), "Print your marked paper");
    print.addEventListener("click", () => (onPrint ? onPrint() : window.print()));
    const close = document.createElement("button");
    close.type = "button"; close.className = "pp-btn pp-btn--ghost xo-done__close";
    faceOf(close, UI.close(16), "Close");
    close.addEventListener("click", () => box.remove());
    box.append(print, close);
    document.body.appendChild(box);
    box.querySelector(".xo-done__say").textContent = noticeText();
  }
  function dropResult() {
    announced = false;
    clearTimeout(idle);
    sheet.querySelectorAll(".xp-stamp").forEach((n) => n.remove());
    document.querySelector(".xo-done")?.remove();
  }

  return {
    get on() { return on; },
    get checked() { return checked; },
    setOn(v) { on = !!v; if (!on) { checked = false; sheet.classList.remove("xp-live"); unmountDrawer(); dropResult(); } },
    /** The OMR drawer, opened or shut from a toolbar button (it opens by itself when a sheet exists). */
    get omrOpen() { return drawerOpen; },
    setOmrOpen(v) {
      drawerOpen = !!v;
      document.querySelector(".xo-drawer")?.classList.toggle("is-open", drawerOpen);
      const t = document.querySelector(".xo-tab");
      t?.setAttribute("aria-expanded", String(drawerOpen));
      t?.classList.toggle("is-open", drawerOpen);
    },
    check(questions) { checked = true; return score(questions); },
    reopen() { checked = false; dropResult(); },
    clear() { answers = {}; checked = false; dropResult(); keep(); },
    /** Has every question that is to be attempted been answered? */
    complete: (questions) => isComplete(questions),
    get name() { return savedName(); },
    gradeFor,
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
