import { faceOf } from "/utils/components/workbook/icons.js";
import { ICON_PREPBOT } from "/prep-math/mental-math/shared/icons.js";
import { UI } from "/utils/components/ui-icons.js";
import { richField } from "./rich-field.js";
import { textHtml } from "./model.js";
import { toTeX } from "/utils/components/math-linear.js";

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

/** TeX as the plain thing it says, so an equation typed with Alt + = (a \\frac{1}{2}) is the answer "1/2". */
export function plainTex(s) {
  return String(s == null ? "" : s)
    .replace(/\\left|\\right/g, "")
    .replace(/\^\{([^{}]*)\}/g, "^$1")
    .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => `${/^[\w.]+$/.test(a) ? a : `(${a})`}/${/^[\w.]+$/.test(b) ? b : `(${b})`}`)
    .replace(/\\sqrt\{([^{}]*)\}/g, "sqrt($1)")
    .replace(/\\(?:times|cdot)/g, "*").replace(/\\div/g, "/").replace(/\\pi/g, "pi")
    .replace(/\^\\circ|\\degree/g, "\u00b0").replace(/\\%/g, "%");
}

/** "$\\text{12 cm}$", " 12  CM. " and "12 cm" are the same answer. */
export function norm(s) {
  return plainTex(s)
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
  /* "a / b" (spaces round the slash), "a | b", "a; b" and "a or b" are alternatives; "1/2" is one fraction */
  const options = String(answer || "").split(/\s*(?:\s\/\s|\||;|\bor\b)\s*/i).map(norm).filter(Boolean);
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
  let held = false;      // results held for the teacher: the paper is locked and handed in, but no marks are shown
  let lastQuestions = [];
  let announced = false;
  /* AI marking of the written answers (the page queues the script and reports how it is getting on, see setAi/applyAiMarks) */
  let ai = { on: false, status: "off", text: "", notes: {}, by: {}, was: {}, lines: {} };
  const drawn = new Set();        // answers whose line marks have already been drawn in (the pen draws them once, not on every redraw)
  /* PrepBot's film on writing maths: from the booklet's card, or from a corrected line on the marked script (with that line) */
  if (!window.__xpEqFilm) {
    window.__xpEqFilm = true;
    const go = (w) => (w.dataset.film === "exno"
      ? import("./exno-tutor.js").then((m) => m.openExamNoFilm({ no: w.dataset.no || "", n: +w.dataset.n || 8 }))
      : import("./eq-tutor.js").then((m) => m.openEquationFilm(w.dataset.fix ? { line: w.dataset.line || "", fix: w.dataset.fix } : {}))).catch(() => {});
    document.addEventListener("click", (e) => { const w = e.target.closest && e.target.closest(".xp-watch"); if (w) { e.preventDefault(); go(w); } });
    document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("xp-watch")) { e.preventDefault(); go(e.target); } });
  }
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

  /* Every answer field is a rich-field (rich-field.js): Alt + = writes an equation in place, as in the sticky notes */

  /* ── LOCKING AN ANSWER ──────────────────────────────────────────────────
     A small padlock by every question number (on the paper, in the booklet and on the OMR rows). Locked, the answer cannot be changed by
     a stray click or key; to change it the student unlocks it, and is asked first. The lock is kept with the answers. */
  const LOCK_SHUT = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="15.5" r="1.6" fill="#fff"/></svg>';
  const LOCK_OPEN = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10.5V8a4 4 0 0 1 7.6-1.7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  const isLocked = (id) => answers["lock:" + id] === true;
  function lockKey(id) {
    const k = document.createElement("span");
    k.className = "xp-lock";
    k.dataset.qid = id;
    k.setAttribute("role", "switch");
    k.tabIndex = 0;
    k.setAttribute("data-nomath", "");
    return k;
  }
  function paintLocks() {
    document.querySelectorAll(".xm-sheet .xp-lock, .xo-drawer .xp-lock").forEach((k) => {
      const shut = isLocked(k.dataset.qid);
      k.innerHTML = shut ? LOCK_SHUT : LOCK_OPEN;
      k.classList.toggle("is-shut", shut);
      k.setAttribute("aria-checked", String(shut));
      k.setAttribute("aria-label", shut ? "Answer locked. Unlock it to change it" : "Lock this answer");
      k.dataset.tip = shut ? "Locked. Press to unlock" : "Lock this answer";
      k.hidden = checked;
    });
    document.querySelectorAll(".xm-sheet [data-qid], .xo-drawer [data-qid]").forEach((el) => {
      if (el.classList.contains("xp-lock")) return;
      el.classList.toggle("is-locked", !checked && isLocked(el.dataset.qid));
    });
    document.querySelectorAll(".xm-sheet .xp-rich, .xo-drawer .xp-rich").forEach((f) => {
      const owner = f.closest("[data-qid]");
      if (owner) f.disabled = checked || isLocked(owner.dataset.qid);
    });
  }
  const numberOf = (id) => {
    const q = sheet.querySelector(`.xp-q[data-qid="${id}"] .xp-n`);
    return q ? q.textContent.trim() : "";
  };
  function askUnlock(key) {
    document.querySelector(".xp-unlock")?.remove();
    const id = key.dataset.qid, n = numberOf(id);
    const pop = document.createElement("div");
    pop.className = "pp-receipt xp-unlock";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Unlock this answer?");
    pop.innerHTML = `<div class="pp-receipt__paper"><b>Unlock ${n ? `question ${n}` : "this answer"}?</b><p>You locked this answer. Unlock it only if you mean to change it.</p>`
      + `<div class="xp-unlock__row"><button type="button" class="pp-btn pp-btn--ghost" data-no>Keep it locked</button><button type="button" class="pp-btn" data-ok>Unlock</button></div></div>`;
    document.body.appendChild(pop);
    const r = key.getBoundingClientRect();
    pop.style.left = `${Math.max(8, Math.min(r.left - 20, innerWidth - pop.offsetWidth - 8))}px`;
    pop.style.top = `${r.bottom + 8 + pop.offsetHeight > innerHeight - 8 ? Math.max(8, r.top - pop.offsetHeight - 8) : r.bottom + 8}px`;
    const close = () => { pop.remove(); document.removeEventListener("pointerdown", away, true); document.removeEventListener("keydown", esc, true); key.focus(); };
    const away = (e) => { if (!pop.contains(e.target)) close(); };
    const esc = (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    pop.querySelector("[data-no]").addEventListener("click", close);
    pop.querySelector("[data-ok]").addEventListener("click", () => { delete answers["lock:" + id]; keep(); paintLocks(); close(); onChange(); });
    document.addEventListener("pointerdown", away, true);
    document.addEventListener("keydown", esc, true);
    pop.querySelector("[data-ok]").focus();
  }
  if (!window.__xpLocks) {
    window.__xpLocks = true;
    const press = (k) => {
      if (checked) return;
      if (isLocked(k.dataset.qid)) askUnlock(k);
      else { answers["lock:" + k.dataset.qid] = true; keep(); paintLocks(); onChange(); }
    };
    document.addEventListener("click", (e) => { const k = e.target.closest && e.target.closest(".xp-lock"); if (k) { e.preventDefault(); e.stopPropagation(); press(k); } }, true);
    document.addEventListener("keydown", (e) => { const k = e.target.classList && e.target.classList.contains("xp-lock") ? e.target : null; if (k && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); press(k); } });
  }

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
            if (checked || isLocked(q.id)) return;
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
          const input = richField({ className: "xp-in" });
          input.setAttribute("aria-label", `Answer to question ${el.querySelector(".xp-n")?.textContent || ""}`);
          input.value = got || "";
          input.disabled = checked;
          input.addEventListener("input", () => { answers[q.id] = input.value; keep(); onChange(); });
          blank.replaceWith(input);
        }
      } else if (!el.classList.contains("xp-q--sheeted")) {
        const lines = el.querySelector(".xp-lines");
        const box = richField({ multiline: true, className: "xp-ta" });
        box.rows = Math.max(3, q.lines | 0 || 3);
        box.setAttribute("aria-label", `Answer to question ${el.querySelector(".xp-n")?.textContent || ""}`);
        box.value = got || "";
        box.disabled = checked;
        box.addEventListener("input", () => { answers[q.id] = box.value; keep(); onChange(); });
        if (lines) lines.replaceWith(box); else el.querySelector(".xp-body").appendChild(box);
      }
    });
    wireOmr(sheet);
    wireExamNo(sheet);
    /* the theory sheet: a page to write on, in the block for its question */
    sheet.querySelectorAll(".xp-ans[data-qid]").forEach((blk) => {
      const q = qs.get(blk.dataset.qid);
      if (!q) return;
      const lines = blk.querySelector(".xp-lines");
      const box = richField({ multiline: true, className: "xp-ta" });
      box.rows = Math.max(4, (lines ? lines.children.length : 4));
      box.setAttribute("aria-label", `Answer to ${blk.querySelector(".xp-ans__tag b")?.textContent || "the question"}`);
      box.value = answers[q.id] || "";
      box.disabled = checked;
      box.addEventListener("input", () => { answers[q.id] = box.value; keep(); onChange(); });
      if (lines) lines.replaceWith(box); else blk.appendChild(box);
    });
    /* a lock key by every question number, on the paper and in the booklet */
    sheet.querySelectorAll(".xp-q[data-qid]").forEach((el) => {
      const n = el.querySelector(":scope > .xp-n");
      if (n && !el.querySelector(":scope > .xp-lock")) n.after(lockKey(el.dataset.qid));
    });
    sheet.querySelectorAll(".xp-ans[data-qid]").forEach((blk) => {
      const tag = blk.querySelector(".xp-ans__tag b");
      if (tag && !blk.querySelector(".xp-lock")) tag.after(lockKey(blk.dataset.qid));
    });
    /* the drawer comes last: with an answer booklet it takes the booklet's pages (and the fields made on them) out of the paper */
    mountDrawer();
    paintLocks();
    paintAttempts();
    if (checked && !held) { showResults(questions); paintStamp(true); announce(); }
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
        document.querySelectorAll(".xp-name").forEach((o) => { if (o !== input) o.value = input.value; });
        onName(input.value);
      });
      line.replaceWith(input);
    });
  }

  /* ── the exam number ──────────────────────────────────────────────────────
     A box for each digit and a column of bubbles 0 to 9 under it, on the OMR sheet (and the same grid in the OMR
     drawer). One bubble to a column; the box above shows the digit. Kept as a string, "_" where none is shaded yet,
     under answers.examno. It is the student's, so "clear answers" leaves it. */
  const exnoValue = () => String(answers.examno || "");
  function paintExamNo() {
    document.querySelectorAll(".xp-exno").forEach((g) => {
      const v = exnoValue().padEnd(+g.dataset.n || 8, "_");
      g.querySelectorAll(".xp-exno__col").forEach((col, c) => {
        const d = v[c];
        col.querySelector(".xp-exno__box").textContent = d === "_" ? "" : d;
        col.querySelectorAll("b").forEach((b) => { b.classList.toggle("is-picked", b.dataset.d === d); b.setAttribute("aria-checked", String(b.dataset.d === d)); });
      });
    });
  }
  function wireExamNo(root) {
    root.querySelectorAll(".xp-exno .xp-exno__col b").forEach((b) => {
      b.tabIndex = 0; b.setAttribute("role", "radio");
      const pick = () => {
        if (checked) return;
        const g = b.closest(".xp-exno"), n = +g.dataset.n || 8, c = +b.closest(".xp-exno__col").dataset.c;
        const cur = exnoValue().padEnd(n, "_").split("");
        cur[c] = cur[c] === b.dataset.d ? "_" : b.dataset.d;
        answers.examno = cur.join(""); keep(); paintExamNo(); onChange();
      };
      b.addEventListener("click", pick);
      b.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); pick(); } });
    });
    paintExamNo();
  }

  /** The OMR rows under `root` (the page at the end, or the side drawer): the same answers, shaded there. */
  function wireOmr(root) {
    root.querySelectorAll(".xp-omr li[data-qid], .xo-omr li[data-qid]").forEach((li) => {
      const id = li.dataset.qid;
      if (!li.querySelector(":scope > .xp-lock")) li.appendChild(lockKey(id));
      li.querySelectorAll("b").forEach((b) => {
        b.classList.toggle("is-picked", answers[id] === Number(b.dataset.i));
        b.tabIndex = 0; b.setAttribute("role", "radio");
        const pick = () => {
          if (checked || isLocked(id)) return;
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
  /* With an answer booklet, the sliding sheet IS the booklet: its pages are moved into the drawer while the paper is
     answered, and go back into the paper to be printed. */
  let bookHome = null, bookPrint = null;
  function unmountDrawer() {
    const book = document.querySelector(".xo-drawer .xp-booklet");
    if (book && bookHome && bookHome.isConnected) bookHome.appendChild(book);     // back where it was made
    if (bookPrint) { removeEventListener("beforeprint", bookPrint.before); removeEventListener("afterprint", bookPrint.after); bookPrint = null; }
    bookHome = null;
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
    const book = sheet.querySelector(".xp-booklet");
    if (book) { mountBookDrawer(article, book, tab); return; }
    /* the paper's own rows, dealt into THREE sets side by side: a drawer one row wide
       is as tall as the paper, three wide puts a whole sheet in view */
    const rows = [...page.querySelectorAll(".xp-omr li[data-qid]")].map((li) => li.cloneNode(true));
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
    if (article.classList.contains("xp--wm")) drawer.classList.add("xp--wm");   // the school's logo, faint behind the sheet
    const head = document.createElement("div");
    head.className = "xo-drawer__head";
    head.innerHTML = "<b>OMR sheet</b><span>Shade one bubble for each question.</span>";
    const close = document.createElement("button");
    close.type = "button"; close.className = "pp-btn xo-close"; faceOf(close, UI.close(18), "Close the OMR sheet", "right");
    head.appendChild(close);
    const body = document.createElement("div");
    body.className = "xp-omr xo-omr";
    /* the exam number, when the paper asks for one, is shaded from the drawer too */
    const exno = page.querySelector(".xp-exno");
    if (exno) body.appendChild(exno.cloneNode(true));
    body.appendChild(grid);
    /* who is sitting: the school's logo, its name, the subject, and the student's name (one name, shared with the paper) */
    const who = document.createElement("div");
    who.className = "xo-who";
    const logo = article.querySelector(".xp-head__logo img");
    const school = article.querySelector(".xp-head__school"), subj = article.querySelector(".xp-head__subject");
    who.innerHTML = `${logo ? `<img src="${logo.getAttribute("src")}" alt="" />` : ""}<b></b><span></span>`;
    who.querySelector("b").textContent = school ? school.textContent : "";
    who.querySelector("span").textContent = subj ? subj.textContent : "";
    const nm = document.createElement("input");
    nm.type = "text"; nm.className = "xp-name"; nm.maxLength = 60; nm.autocomplete = "name"; nm.spellcheck = false;
    nm.placeholder = "Type your name"; nm.setAttribute("aria-label", "Your name");
    nm.value = (sheet.querySelector(".xp-name") || {}).value || savedName();
    nm.addEventListener("input", () => {
      keepName(nm.value);
      sheet.querySelectorAll(".xp-name").forEach((o) => { o.value = nm.value; });
      onName(nm.value);
    });
    who.appendChild(nm);
    drawer.append(head, who, body);
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
    wireExamNo(drawer);
  }

  /** The drawer as the answer booklet: the OMR sheet on page 1, then the lined pages, with a button for every page. */
  function mountBookDrawer(article, book, tab) {
    bookHome = article;
    const drawer = document.createElement("aside");
    drawer.className = "xo-drawer xo-drawer--book" + (drawerOpen ? " is-open" : "");
    drawer.setAttribute("aria-label", "Answer booklet");
    drawer.setAttribute("style", article.getAttribute("style") || "");
    if (article.classList.contains("xp--wm")) drawer.classList.add("xp--wm");
    const pages = [...book.querySelectorAll("[data-bpage]")];
    const head = document.createElement("div");
    head.className = "xo-drawer__head xo-bookhead";
    head.innerHTML = `<b>Answer booklet</b><nav class="xo-pager" aria-label="Booklet pages"><button type="button" class="xo-pg xo-pg--arrow" data-step="-1" aria-label="Previous page" data-tip="Previous page"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>${pages.map((p, k) => `<button type="button" class="xo-pg${k === 0 ? " is-on" : ""}" data-page="${k + 1}" aria-label="${k === 0 ? "OMR sheet, page 1" : `Page ${k + 1}`}" data-tip="${k === 0 ? "OMR sheet" : `Page ${k + 1}`}">${k + 1}</button>`).join("")}<button type="button" class="xo-pg xo-pg--arrow" data-step="1" aria-label="Next page" data-tip="Next page"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button></nav>`;
    const close = document.createElement("button");
    close.type = "button"; close.className = "pp-btn xo-close"; faceOf(close, UI.close(18), "Close the answer booklet", "right");
    head.appendChild(close);
    const wrap = document.createElement("div");
    wrap.className = `${article.className.replace(/\bxp--wm\b/, "").trim()} xp-live xo-book`;
    wrap.setAttribute("style", article.getAttribute("style") || "");
    wrap.dataset.tpl = article.dataset.tpl || "default";      // the booklet is dressed as the paper is
    wrap.appendChild(book);
    drawer.append(head, wrap);
    document.body.append(drawer, tab);

    const here = () => { let at = 1; const top = drawer.getBoundingClientRect().top + head.offsetHeight + 30; pages.forEach((p) => { if (p.getBoundingClientRect().top <= top) at = Number(p.dataset.bpage); }); if (drawer.scrollTop + drawer.clientHeight >= drawer.scrollHeight - 6 && drawer.scrollTop > 0) at = pages.length; return at; };
    const mark = () => { const n = here(); head.querySelectorAll(".xo-pg[data-page]").forEach((b) => b.classList.toggle("is-on", Number(b.dataset.page) === n)); };
    /* a page's place inside the scrolling drawer */
    const placeOf = (p) => p.getBoundingClientRect().top - drawer.getBoundingClientRect().top + drawer.scrollTop - head.offsetHeight - 8;
    const goTo = (n) => { const p = pages[Math.max(0, Math.min(pages.length - 1, n - 1))]; if (p) drawer.scrollTo({ top: Math.max(0, placeOf(p)), behavior: "smooth" }); };
    head.addEventListener("click", (e) => {
      const b = e.target.closest(".xo-pg"); if (!b) return;
      goTo(b.dataset.step ? here() + Number(b.dataset.step) : Number(b.dataset.page));
    });
    wrap.addEventListener("click", (e) => { const a = e.target.closest("a[data-goto]"); if (a) { e.preventDefault(); goTo(Number(a.dataset.goto)); } });
    drawer.addEventListener("scroll", () => requestAnimationFrame(mark), { passive: true });

    /* the pages are laid out at the paper's own width, shrunk to fit the drawer */
    const fit = () => {
      wrap.style.zoom = "";
      const w = (pages[0] ? pages[0].offsetWidth : 0) || 1, room = drawer.clientWidth - 24;
      wrap.style.zoom = room < w ? (room / w).toFixed(3) : "";
    };
    new ResizeObserver(fit).observe(drawer);
    requestAnimationFrame(fit);

    const set = (v) => { drawerOpen = v; drawer.classList.toggle("is-open", v); tab.setAttribute("aria-expanded", String(v)); tab.classList.toggle("is-open", v); if (v) requestAnimationFrame(fit); };
    tab.addEventListener("click", () => set(!drawerOpen));
    close.addEventListener("click", () => set(false));
    /* printing wants the booklet back behind the paper; afterwards it goes back in the drawer */
    bookPrint = {
      before: () => { if (book.isConnected && article.isConnected) article.appendChild(book); wrap.style.zoom = ""; },
      after: () => { wrap.appendChild(book); fit(); },
    };
    addEventListener("beforeprint", bookPrint.before);
    addEventListener("afterprint", bookPrint.after);
    if (drawerOpen) requestAnimationFrame(fit);
  }

  /* THE SCRIPT MARKED LINE BY LINE: the student's answer, each line on the ruled paper with a pen tick or cross at its end and the
     marker's word under a line that needs one. It takes the place of the answer field once the AI has marked it (the field comes back
     when the paper is answered again). */
  function paintScript(el, q) {
    const lines = ai.lines[q.id];
    const field = (document.querySelector(`.xp-ans[data-qid="${q.id}"] .xp-ta`)) || el.querySelector(".xp-ta");
    if (!field || !Array.isArray(lines) || !lines.length) return;
    field.parentElement.querySelector(":scope > .xp-script")?.remove();
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const box = document.createElement("div");
    box.className = "xp-script";
    box.setAttribute("data-nomath", "");
    box.setAttribute("aria-label", "Your answer, marked line by line");
    if (!drawn.has(q.id)) { box.classList.add("is-drawing"); drawn.add(q.id); }
    box.innerHTML = lines.map((l, k) => `<div class="xp-script__row${l.ok === true ? " is-ok" : l.ok === false ? " is-no" : ""}" style="--i:${k}">`
      + `<span class="xp-script__t">${textHtml(l.t)}</span>`
      + `<span class="xp-script__mk" aria-label="${l.ok === true ? "right" : l.ok === false ? "wrong" : ""}">${l.ok === true ? TICK : l.ok === false ? CROSS : ""}</span>`
      + (l.note ? `<span class="xp-script__note">${textHtml(l.note)}</span>` : "")
      + (l.fix ? `<span class="xp-script__fix"><em>Correct</em>${textHtml(l.fix)}${/\$[^$]+\$/.test(l.fix) ? `<span class="xp-watch" role="link" tabindex="0" data-line="${esc(l.t)}" data-fix="${esc(l.fix)}" aria-label="Watch PrepBot write this line" data-tip="Watch PrepBot write this line"><span class="xp-watch__bot" aria-hidden="true">${ICON_PREPBOT}</span><span class="xp-watch__play" aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span></span>` : ""}</span>` : "")
      + `</div>`).join("");
    field.after(box);
    field.classList.add("is-scripted");
  }

  /** Mark what can be marked and show the model answer where it cannot. */
  /* A blank's answer typed as plain maths (12x-8, 3/4, x^2) is SHOWN set, the way it would have looked written with Alt + =; words stay words */
  function asMaths(v) {
    const t = String(v == null ? "" : v).trim();
    if (!t || t.includes("$")) return t;
    if (!/^[\w\s.+\-*/^=()<>,÷×−]+$/.test(t) || /[A-Za-z]{4,}/.test(t) || !/[\d+\-*/^=]/.test(t)) return t;
    try { return "$" + toTeX(t) + "$"; } catch { return t; }
  }

  function showResults(questions) {
    const qs = byId(questions);
    /* WITH AN ANSWER BOOKLET the question paper is never marked: the written answers are marked in the booklet, the multiple choice on its
       OMR sheet, and the blanks in a small table on the booklet's front page. */
    const inBook = !!document.querySelector(".xp-booklet");
    const fills = [];
    sheet.querySelectorAll(".xp-q[data-qid]").forEach((el) => {
      const q = qs.get(el.dataset.qid);
      if (!q) return;
      const blk = inBook && (q.type === "sub" || q.type === "theory") ? document.querySelector(`.xp-ans[data-qid="${q.id}"]`) : null;
      const paperOnly = inBook && !blk;            // marked elsewhere (the OMR sheet, the blanks table): nothing on the paper
      el.querySelectorAll(".xp-reveal").forEach((n) => n.remove());
      if (blk) blk.querySelectorAll(":scope > .xp-reveal").forEach((n) => n.remove());
      if (inBook) el.classList.remove("is-unanswered", "is-ok", "is-no");
      const target = blk || el;
      const body = blk || el.querySelector(".xp-body");
      const say = (cls, html) => {
        if (paperOnly) return;
        const d = document.createElement("div");
        d.className = `xp-reveal ${cls}`; d.setAttribute("data-nomath", "");
        d.innerHTML = html;
        body.appendChild(d);
      };
      const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      const skipped = q.type === "mcq" ? answers[q.id] === undefined : !given(q);
      if (!paperOnly) target.classList.toggle("is-unanswered", skipped);
      if (q.type === "mcq") {
        document.querySelectorAll(`.xp-omr li[data-qid="${q.id}"]`).forEach((row) => row.classList.toggle("is-unanswered", skipped));
        const got = answers[q.id];
        [...el.querySelectorAll(".xp-opts li")].forEach((li, i) => {
          li.classList.toggle("is-right", !inBook && i === q.answer);
          li.classList.toggle("is-wrong", !inBook && got === i && i !== q.answer);
        });
        document.querySelectorAll(`.xp-omr li[data-qid="${q.id}"] b`).forEach((b) => {
          const i = Number(b.dataset.i);
          b.classList.toggle("is-right", i === q.answer);
          b.classList.toggle("is-wrong", got === i && i !== q.answer);
        });
        if (got === undefined) say("is-skipped", "Not answered.");
      } else if (q.type === "fill") {
        const ok = matches(answers[q.id], q.answer);
        if (inBook) fills.push({ n: el.querySelector(".xp-n")?.textContent || "", got: answers[q.id] || "", ok, answer: q.answer });
        else { el.classList.toggle("is-ok", ok); el.classList.toggle("is-no", !ok); }
        say(ok ? "is-ok" : "is-no", ok ? "Correct." : `Answer: ${textHtml(asMaths(q.answer))}`);
      } else if (ai.on && ai.status !== "failed") {
        /* marked by AI (queued): the model answer, and either the mark and why, or where it is in the line */
        if (!given(q)) say("is-skipped", "Not answered.");
        else {
          const m = answers["m:" + q.id];
          /* the verdict is a sticky note pinned beside the model answer, which is a receipt: the site's own two pieces */
          const done = m !== undefined && ai.status === "done";
          const teacher = ai.by[q.id] === "teacher";
          const tone = !done ? "wait" : m >= q.marks ? "ok" : m <= 0 ? "no" : "part";
          say("is-model xp-reveal--ai", `<div class="pp-receipt xp-modelrec"><div class="pp-receipt__paper"><span class="xp-reveal__k">Model answer</span><div class="xp-reveal__a">${textHtml(q.answer || "No model answer was written.")}</div></div></div>`
            + `<div class="pp-sticky xp-verdict xp-verdict--${tone}">${done
              ? `<span class="xp-verdict__k">${teacher ? "Teacher's mark" : "AI mark"}</span><b class="xp-verdict__m">${m}<small>/${q.marks}</small></b>`
                + (ai.notes[q.id] ? `<p class="xp-verdict__note">${textHtml(ai.notes[q.id])}</p>` : "")
                + (teacher ? `<small class="xp-verdict__was">The AI gave ${ai.was[q.id]}.</small>` : "")
              : `<span class="xp-verdict__k">AI marking</span><p class="xp-verdict__note">${esc(ai.text || "Waiting to be marked")}</p><span class="xp-verdict__dots" aria-hidden="true"><i></i><i></i><i></i></span>`}</div>`);
          if (m !== undefined && ai.status === "done") paintScript(el, q);
        }
      } else {
        say("is-model", `<span class="xp-reveal__k">Model answer</span><div class="xp-reveal__a">${textHtml(q.answer || "No model answer was written.")}</div>`
          + `<label class="xp-selfmark">Your mark <input type="number" min="0" max="${q.marks}" step="1" inputmode="numeric" aria-label="Your mark for this answer, out of ${q.marks}"> out of ${q.marks}</label>`);
        const box = body.querySelector(".xp-reveal.is-model .xp-selfmark input");
        if (box) {
          if (answers["m:" + q.id] !== undefined) box.value = answers["m:" + q.id];
          box.addEventListener("input", () => {
            if (box.value === "") delete answers["m:" + q.id];
            else answers["m:" + q.id] = Math.max(0, Math.min(q.marks, Math.round(+box.value) || 0));
            keep(); paintMark(target, q); paintStamp(false); announce(); onChange();
          });
        }
      }
    });
    sheet.querySelectorAll(".xp-q[data-qid]").forEach((el) => {
      const q = qs.get(el.dataset.qid);
      if (!q) return;
      const blk = inBook && (q.type === "sub" || q.type === "theory") ? document.querySelector(`.xp-ans[data-qid="${q.id}"]`) : null;
      if (inBook) el.querySelector(":scope > .xp-mark")?.remove();
      if (inBook && !blk) return;
      paintMark(blk || el, q);
    });
    /* the blanks, marked on the booklet's front page */
    document.querySelectorAll(".xp-bfill").forEach((n) => n.remove());
    const cover = inBook && document.querySelector(".xp-bcover");
    if (cover && fills.length) {
      const box = document.createElement("div");
      box.className = "xp-bfill";
      box.setAttribute("data-nomath", "");
      box.innerHTML = "<h3>Fill in the blank</h3>" + fills.map((f) => `<div class="xp-bfill__row ${f.ok ? "is-ok" : "is-no"}"><b>${f.n}</b>`
        + `<span>${f.got ? textHtml(asMaths(f.got)) : "<i>Not answered</i>"}</span><em>${f.ok ? TICK : CROSS}</em>`
        + (f.ok ? "" : `<small>Answer: ${textHtml(asMaths(f.answer || ""))}</small>`) + `</div>`).join("");
      cover.insertBefore(box, cover.querySelector(".xp-bindex") || cover.querySelector(".xp-bfoot"));
    }
    typesetReveals();
  }

  /* the model answers and notes under the marked questions are typeset too (they arrive after the paper was, and again when the marks do).
     Each formula is set as a SELF-CONTAINED picture (the sticky notes' own mathNode), not by a MathJax pass over the page: MathJax's
     shared glyph cache lives in the page and is lost when the paper is drawn again, and the booklet in the sliding sheet is outside the
     paper, so formulas set that way came out blank there. It runs a moment after the marks are painted, and once more, at once, just
     before printing, so a page printed straight away never shows the raw TeX. */
  let tsTimer = 0, mathMod = null;
  const loadMathMod = () => (mathMod ? Promise.resolve(mathMod) : import("/utils/components/sticky-math.js").then((m) => { mathMod = m; m.preloadMath(); return m; }));
  const MARKED = ".xm-sheet .xp-reveal, .xm-sheet .xp-script, .xo-drawer .xp-reveal, .xo-drawer .xp-script, .xp-bfill";
  function swapMath() {
    if (!mathMod) return;
    const { mathNode } = mathMod;
    document.querySelectorAll(MARKED).forEach((root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const hits = [];
      while (walker.nextNode()) if (/\\\(|\\\[/.test(walker.currentNode.nodeValue)) hits.push(walker.currentNode);
      hits.forEach((tn) => {
        const frag = document.createDocumentFragment();
        tn.nodeValue.split(/(\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/).forEach((part) => {
          if (!part) return;
          if (/^\\[([][\s\S]*\\[)\]]$/.test(part)) {
            const n = mathNode(part.slice(2, -2));
            n.removeAttribute("title"); n.removeAttribute("contenteditable");
            frag.appendChild(n);
          } else frag.appendChild(document.createTextNode(part));
        });
        tn.replaceWith(frag);
      });
    });
  }
  function typesetReveals() {
    clearTimeout(tsTimer);
    tsTimer = setTimeout(() => { loadMathMod().then(swapMath).catch(() => {}); }, 60);
  }
  loadMathMod().catch(() => {});
  addEventListener("beforeprint", () => { try { swapMath(); } catch { /* left as written */ } });

  /* ── the marker's tick or cross ─────────────────────────────────────────────
     Beside every marked question a pen's mark: a good green tick for a right answer, a red cross for
     a wrong one or one left blank. A written answer gets one once it has a mark: a tick for full marks,
     a cross for none, and a tick with the fraction between. The bubbles are filled the same way (css). */
  /* Marks as a teacher's pen leaves them: each stroke is a SHAPE, thin where the pen lands, full in the turn and tapering where it lifts off,
     and a little off the straight — not a line of even width. */
  const TICK = `<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(-5 12 12)"><path d="M2.9 13.7C4.1 12.8 5.7 13.3 6.9 14.9C7.8 16.1 8.5 17.4 9 18.8C10.5 13.9 14.2 8.5 20.7 3.5C21.2 3.2 21.6 3.7 21.2 4.1C15.9 9.6 12.4 15 10.7 20.5C10.4 21.4 9.2 21.5 8.8 20.6C7.9 18.6 6.5 16.6 4.9 15.3C4.1 14.7 3.3 14.7 2.8 14.2C2.5 13.9 2.6 13.8 2.9 13.7Z"/></g></svg>`;
  const CROSS = `<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(3 12 12)"><path d="M4.3 4.5C8 7.9 14 14.3 19.7 19.8C20.2 20.3 19.6 20.8 19.1 20.4C13.2 15.7 8.3 10.7 3.9 5.7C3.5 5.2 3.9 4.2 4.3 4.5Z"/><path d="M19.5 4.4C15.3 8.6 9.8 14.2 6.2 19.7C5.9 20.2 5.4 19.9 5.7 19.4C8.6 14 13.6 8.3 18.9 3.9C19.4 3.6 19.9 4.1 19.5 4.4Z"/></g></svg>`;
  function paintMark(el, q) {
    el.querySelector(":scope > .xp-mark")?.remove();
    if (!checked) return;
    let kind = null, label = "", part = "";
    if (q.type === "mcq") { const got = answers[q.id]; kind = got === q.answer ? "right" : "wrong"; label = got === undefined ? "Not answered" : kind === "right" ? "Correct" : "Wrong"; }
    else if (q.type === "fill") { kind = matches(answers[q.id], q.answer) ? "right" : "wrong"; label = given(q) ? (kind === "right" ? "Correct" : "Wrong") : "Not answered"; }
    else {
      const m = answers["m:" + q.id];
      if (!given(q)) { kind = "wrong"; label = "Not answered"; }
      else if (m !== undefined) {
        kind = m >= q.marks ? "right" : m <= 0 ? "wrong" : "part";
        label = `${m} of ${q.marks} marks`;
        if (kind === "part") part = `${m}/${q.marks}`;
      }
    }
    if (!kind) return;
    const span = document.createElement("span");
    span.className = `xp-mark xp-mark--${kind}`;
    span.setAttribute("data-nomath", "");
    span.setAttribute("role", "img");
    span.setAttribute("aria-label", label);
    span.innerHTML = (kind === "wrong" ? CROSS : TICK) + (part ? `<small>${part}</small>` : "");
    el.appendChild(span);
  }

  const GRADES = [
    { min: 70, g: "A", say: "Excellent" },
    { min: 60, g: "B", say: "Very good" },
    { min: 50, g: "C", say: "Good" },
    { min: 45, g: "D", say: "Fair" },
    { min: 40, g: "E", say: "Pass" },
    { min: 0, g: "F", say: "Try again" },
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
  /* the stamp's ink: a rubber stamp is never a clean print, so the shape is given a worn, mottled edge by an SVG filter (once per page) */
  function inkFilter() {
    if (document.getElementById("xp-ink-defs")) return;
    const d = document.createElement("div");
    d.id = "xp-ink-defs";
    d.setAttribute("aria-hidden", "true");
    d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    d.innerHTML = `<svg width="0" height="0"><filter id="xp-ink" x="-4%" y="-4%" width="108%" height="108%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.42" result="holes"/>
      <feComposite in="SourceGraphic" in2="holes" operator="in" result="worn"/>
      <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" seed="2" result="w"/>
      <feDisplacementMap in="worn" in2="w" scale="1.6"/></filter></svg>`;
    document.body.appendChild(d);
  }
  function paintStamp(animate) {
    document.querySelectorAll(".xm-sheet .xp-stamp, .xo-drawer .xp-stamp").forEach((n) => n.remove());
    if (!on || !checked) return;
    /* beside the Score box, in the name row: the one place in the header nothing is printed over. With an answer booklet the stamp
       goes on the booklet's front page, not on the question paper. */
    const bookHead = document.querySelector(".xp-bcover .xp-head .xp-student");
    const hosts = bookHead ? [bookHead] : [...sheet.querySelectorAll(".xp-head .xp-student")];
    const host = hosts.find((h) => h.offsetParent !== null) || hosts[0];
    const scoreLabel = host && [...host.querySelectorAll(":scope > span")].find((x) => /score/i.test(x.textContent));
    if (!host) return;
    const s = score(lastQuestions);
    const gr = gradeFor(s.pct);
    const st = document.createElement("div");
    inkFilter();
    st.className = `xp-stamp xp-stamp--${gr.g <= "B" ? "good" : gr.g <= "D" ? "mid" : "low"}` + (animate ? "" : " is-still");
    st.setAttribute("data-nomath", "");
    st.setAttribute("role", "img");
    st.setAttribute("aria-label", `Grade ${gr.g}, ${s.won} out of ${s.outOf} marks`);
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
    st.innerHTML = `<b>${gr.g}</b><span>${s.pct}%</span><i>${s.pending ? "Marking" : gr.say}</i><small>${today}</small>`;
    if (scoreLabel) scoreLabel.before(st); else host.appendChild(st);
    /* the Score box filled in: the marks out of the total. With a booklet, only the booklet's (the question paper stays clean) */
    const boxes = bookHead ? [...document.querySelectorAll(".xp-bcover .xp-student em")] : [...sheet.querySelectorAll(".xp-student em")];
    document.querySelectorAll(".xm-sheet .xp-student em, .xo-drawer .xp-student em").forEach((box) => { if (!boxes.includes(box)) box.textContent = ""; });
    boxes.forEach((box) => { box.textContent = `${s.won} / ${s.outOf}`; box.classList.add("is-scored"); });
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
    /* the stamp is on the header: if the learner has scrolled down the paper, take them to it */
    const heads = [...sheet.querySelectorAll(".xp-head")];
    const hd = heads.find((h) => h.offsetParent !== null) || heads[0];
    if (hd) {
      const r = hd.getBoundingClientRect();
      /* after the paper has been redrawn, or the move is lost to the layout shift */
      if (r.top < 90 || r.bottom > innerHeight) setTimeout(() => hd.scrollIntoView({ block: "start" }), 80);
    }
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
    document.querySelectorAll(".xm-sheet .xp-stamp, .xo-drawer .xp-stamp").forEach((n) => n.remove());
    document.querySelector(".xo-done")?.remove();
    document.querySelectorAll(".xm-sheet .xp-student em, .xo-drawer .xp-student em").forEach((box) => { box.textContent = ""; box.classList.remove("is-scored"); });
  }

  return {
    get on() { return on; },
    get checked() { return checked; },
    get held() { return held; },
    /** Hold the results: the paper is handed in and locked, but no marks, stamp or notes are shown until the teacher releases them. */
    setHeld(v) { held = !!v; sheet.classList.toggle("xp-held", held); },
    /** Every answer as given (not the marks), to send with a held paper so it can be shown again, anywhere, when it is released. */
    snapshot() { const o = {}; Object.keys(answers).forEach((k) => { if (!k.startsWith("m:") && k !== "examno") o[k] = answers[k]; }); if (answers.examno) o.examno = answers.examno; return o; },
    /** Put answers back (from the server), keeping the exam number as shaded. */
    loadAnswers(obj) { answers = { ...(obj || {}) }; keep(); },
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
    /** The AI marking's state: { on, status: off|queued|working|done|failed, text }. Redraws the marked paper. */
    setAi(next) { ai = { ...ai, ...next }; if (checked && !held) { showResults(lastQuestions); paintStamp(false); announce(); } },
    /** The AI's marks for the written answers: [{ id, m, of, note }]. They count like marks given by hand. */
    applyAiMarks(list) {
      (list || []).forEach((x) => { answers["m:" + x.id] = x.m; ai.notes[x.id] = x.note || ""; ai.by[x.id] = x.by || "ai"; ai.was[x.id] = x.ai; if (Array.isArray(x.lines)) ai.lines[x.id] = x.lines; });
      ai.status = "done"; keep();
      if (checked && !held) { showResults(lastQuestions); paintStamp(false); announce(); }
      onChange();
    },
    /** What the student wrote for the written questions: { id: text }, for the marking queue. */
    writtenAnswers(questions) {
      const out = {};
      questions.filter((q) => q.type === "sub" || q.type === "theory").forEach((q) => { if (given(q)) out[q.id] = String(answers[q.id]); });
      return out;
    },
    get ai() { return ai; },
    /** The mark now held for a written answer, or undefined. */
    writtenMark(id) { return answers["m:" + id]; },
    check(questions) { checked = true; return score(questions); },
    reopen() { checked = false; drawn.clear(); dropResult(); },
    clear() { const no = answers.examno; answers = {}; if (no) answers.examno = no; checked = false; dropResult(); keep(); paintExamNo(); },
    /** The exam number as shaded, or "" until every digit is. */
    get examNo() { const v = exnoValue(); return /^\d+$/.test(v) ? v : ""; },
    /** How many digits of the exam number are shaded so far, and of how many. */
    examNoProgress() { const g = document.querySelector(".xp-exno"); const n = g ? +g.dataset.n || 8 : 0; return { n, have: exnoValue().replace(/_/g, "").length }; },
    /** Has every question that is to be attempted been answered? */
    complete: (questions) => isComplete(questions),
    get name() { return savedName(); },
    gradeFor,
    score,
    apply,
    /** Just before printing: a box nobody wrote in goes back to the ruled lines the
        paper is designed with; what was written stays, as text. */
    forPrint() {
      document.querySelectorAll(".xm-sheet .xp-ta, .xo-drawer .xp-ta").forEach((box) => {
        if (box.value.trim()) return;
        const lines = document.createElement("div");
        lines.className = "xp-lines";
        lines.innerHTML = "<i></i>".repeat(Math.max(3, box.rows));
        box.replaceWith(lines);
      });
    },
  };
}
