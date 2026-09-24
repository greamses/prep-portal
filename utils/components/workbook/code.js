/* ============================================================================
   PRINTABLE WORKBOOK — a listing, an editor and a console
   ----------------------------------------------------------------------------
   A programming workbook needs the one thing a paper workbook cannot do: RUN
   the program. So a code box has two lives, like every other piece here.

     on paper   a listing in a mono face with its line numbers, and under it a
                console box with ruled lines to write what it will print
     on screen  the listing becomes an editor, the console fills itself, and
                a Run button (or Ctrl/Cmd + Enter) does what a computer does

   HOW IT RUNS. Never in this page, and never on this thread. Every run
   happens in a fresh WORKER: no document, no window, no parent, no cookies —
   and the network is taken away from it before the program starts, so there
   is nothing there to reach the signed-in user with. It gets the source by
   postMessage, sends back the console lines, and is terminated.

   The thread matters as much as the walls. A worker runs beside the page, so
   a beginner's `while (true) {}` spins in a room of its own: after RUN_MS the
   worker is terminated, the console says what happened, and the workbook has
   not so much as flickered. In an iframe — which shares this thread — that
   same program would freeze the whole page, and no timer could stop it.

   HOW IT IS MARKED. `codeRight(run, prints)` compares the console lines the
   program produced with the lines the question wants — nothing about HOW the
   code is written, because there are many right programs and only one right
   behaviour. It has no DOM in it, so the answer checks run it in Node.
   ========================================================================== */

const RUN_MS = 1500;

/* ── what a value looks like in a console ────────────────────────────────── */

/* Written as source (and kept as source) because it runs INSIDE the worker,
   where nothing from this module exists. Strings print bare at the top level
   ("hi", not "hi" in quotes) and quoted inside an array or an object — which
   is exactly what a browser console does, and what chapter 1 is about. */
const FORMATTER = `
  const fmt = (v, deep) => {
    if (typeof v === "string") return deep ? JSON.stringify(v) : v;
    if (typeof v === "bigint") return String(v) + "n";
    if (v === null) return "null";
    if (v === undefined) return "undefined";
    if (typeof v === "number") return Object.is(v, -0) ? "-0" : String(v);
    if (typeof v === "function") return "function " + (v.name || "anonymous") + "()";
    if (Array.isArray(v)) return "[" + v.map((x) => fmt(x, true)).join(", ") + "]";
    if (v instanceof Error) return v.name + ": " + v.message;
    if (typeof v === "object") {
      try {
        const keys = Object.keys(v);
        if (!keys.length) return "{}";
        return "{ " + keys.map((k) => k + ": " + fmt(v[k], true)).join(", ") + " }";
      } catch (e) { return String(v); }
    }
    return String(v);
  };`;

const RUNNER = `
${FORMATTER}
  /* A worker has no DOM, no cookies, no window and no parent. What it DOES
     have is the network, so those doors are taken off their hinges before any
     of the child's program runs — and once they are gone there is nothing in
     here to get them back from. */
  self.fetch = undefined;
  self.XMLHttpRequest = undefined;
  self.WebSocket = undefined;
  self.importScripts = undefined;
  self.indexedDB = undefined;
  self.caches = undefined;
  self.EventSource = undefined;
  self.Worker = undefined;
  const out = [];
  const say = (kind) => (...a) => out.push({ kind, text: a.map((x) => fmt(x, false)).join(" ") });
  self.console = { log: say("log"), info: say("log"), debug: say("log"), warn: say("warn"), error: say("bad") };
  self.onmessage = (e) => {
    const d = e.data || {};
    out.length = 0;
    let threw = null;
    /* Function, not eval: the program gets a scope of its own, so a child
       may name a variable after something the worker already has (name,
       status, origin) without the declaration colliding with it. */
    try { (0, Function)(String(d.src || ""))(); }
    catch (err) { threw = err && err.name ? err.name + ": " + err.message : String(err); }
    self.postMessage({ id: d.id, out: out.slice(0, 200), threw });
  };
`;

/**
 * Run source away from this page.
 *   → { out: [{ kind, text }], threw, slow }
 * `slow` is a program that never came back: there was a loop with no way out.
 *
 * It runs in a WORKER, and that is the whole point: a worker is its own
 * thread, so `while (true) {}` spins there and the page stays alive — and
 * terminate() really does stop it. (An iframe cannot do this: it shares this
 * thread, and a program that never returns would freeze the workbook.)
 */
export function runCode(src) {
  if (typeof Worker === "undefined" || typeof Blob === "undefined") {
    return Promise.resolve({ out: [], threw: "no browser", slow: false });
  }
  return new Promise((resolve) => {
    let url = "";
    let worker = null;
    let done = false;
    const id = `r${Math.random().toString(36).slice(2)}`;
    const finish = (res) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { worker?.terminate(); } catch (e) { /* already gone */ }
      if (url) URL.revokeObjectURL(url);
      resolve(res);
    };
    const timer = setTimeout(() => finish({ out: [], threw: null, slow: true }), RUN_MS);
    try {
      url = URL.createObjectURL(new Blob([RUNNER], { type: "text/javascript" }));
      worker = new Worker(url);
      worker.onmessage = (e) => {
        const d = e.data || {};
        if (d.id !== id) return;
        finish({ out: Array.isArray(d.out) ? d.out : [], threw: d.threw || null, slow: false });
      };
      worker.onerror = (e) => finish({ out: [], threw: e.message || "something went wrong", slow: false });
      worker.postMessage({ id, src: String(src || "") });
    } catch (err) {
      finish({ out: [], threw: String(err && err.message ? err.message : err), slow: false });
    }
  });
}

/* ── marking: by what it printed, never by how it was written ────────────── */

/** The console lines a run printed, trimmed — warnings and errors included. */
export const linesOf = (run) => (run && Array.isArray(run.out) ? run.out.map((l) => String(l.text).trim()) : []);

/**
 * Did this run print what the question asked for?
 *   run     { src, out, threw, slow } — the LAST run, and the source it ran
 *   prints  the console lines wanted, in order
 *   src     the source in the editor now; a run of older source does not count
 *   must    words the program has to use itself ("let", "typeof"), so a task
 *           about a variable cannot be answered by printing the answer
 */
export function codeRight(run, prints, src = null, must = []) {
  if (!run || run.threw || run.slow) return false;
  if (src !== null && String(run.src ?? "") !== String(src)) return false;
  const wrote = String(run.src ?? "");
  if ((must || []).some((w) => !wrote.includes(w))) return false;
  const got = linesOf(run);
  const want = (prints || []).map((s) => String(s).trim());
  return got.length === want.length && want.every((w, i) => got[i] === w);
}

/* ── the drawing ─────────────────────────────────────────────────────────── */

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

/** The source with a number down the side, the way a listing is printed. */
const listing = (src) => src.split("\n")
  .map((ln, i) => `<span class="js-ln"><b>${i + 1}</b><code>${esc(ln) || " "}</code></span>`).join("");

/**
 * A code box.
 *   src     the program, printed as a listing (and what the editor starts with)
 *   edit    true when the child writes the program (the box is theirs)
 *   mark    true when the console output is what gets marked (want.code)
 *   rows    how tall the editor is, in lines
 *   out     how many ruled console lines to print on the paper
 *   file    the little name on the tab, e.g. "types.js"
 */
export function codeHtml({ src = "", edit = false, mark = false, rows = 0, out = 2, file = "script.js", label = "" } = {}) {
  const height = rows || Math.max(3, src.split("\n").length);
  const ruled = Array.from({ length: out }, () => `<span class="js-rule"></span>`).join("");
  return `<div class="js-box wb-nomath"${mark ? ' data-code="1"' : ' data-try="1"'}` +
    `${edit ? ' data-edit="1"' : ""} data-rows="${height}" data-src="${esc(src)}"` +
    `${label ? ` aria-label="${esc(label)}"` : ""}>` +
    `<div class="js-bar"><span class="js-file">${esc(file)}</span></div>` +
    `<pre class="js-src">${listing(src || " ".repeat(0))}</pre>` +
    `<div class="js-console"><span class="js-console__tag">Console</span>` +
    `<div class="js-out">${ruled}</div></div>` +
    `</div>`;
}

/* ── on screen ───────────────────────────────────────────────────────────── */

const PLAY = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M6.6 3.8 20.4 12 6.6 20.2z" fill="var(--accent-success)"/></svg>`;
const BACK = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M9 6.5 4 11.5l5 5" fill="none" stroke="var(--accent-primary)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.6 11.5H14a5.4 5.4 0 0 1 0 10.8h-3" fill="none" stroke="var(--accent-primary)" stroke-width="2.6" stroke-linecap="round"/></svg>`;

/**
 *   mountCode(box, { saved, onChange })
 *     saved   { src, out, threw, slow } from before, or null
 *   → { src(), run(), set(state), clear(), dispose() }
 *
 * The console is kept in step with the editor by running a moment after the
 * typing stops, so what is marked is always what is on screen.
 */
export function mountCode(box, { saved = null, onChange = () => {} } = {}) {
  const printed = box.innerHTML;
  const start = box.dataset.src || "";
  const editable = box.dataset.edit === "1";
  let state = saved && typeof saved.src === "string" ? { ...saved } : { src: start, out: [], threw: null, slow: false };

  box.classList.add("is-live");
  box.innerHTML =
    `<div class="js-bar"><span class="js-file">${esc(box.querySelector(".js-file")?.textContent || "script.js")}</span>` +
    `<span class="js-bar__gap"></span>` +
    (editable ? `<button class="js-btn js-btn--back" type="button" data-tip="Put the program back as it was">${BACK}</button>` : "") +
    `<button class="js-btn js-btn--run" type="button" data-tip="Run it (Ctrl + Enter)">${PLAY}<b>Run</b></button></div>` +
    `<div class="js-pad"><textarea class="js-edit" spellcheck="false" autocapitalize="off" autocomplete="off"` +
    ` rows="${box.dataset.rows || 4}"${editable ? "" : " readonly"}></textarea></div>` +
    `<div class="js-console"><span class="js-console__tag">Console</span><div class="js-out"></div></div>`;

  const pad = box.querySelector(".js-edit");
  const out = box.querySelector(".js-out");
  pad.value = state.src;

  const grow = () => { pad.style.height = "auto"; pad.style.height = `${pad.scrollHeight + 2}px`; };

  const paint = () => {
    const lines = state.out || [];
    if (state.slow) {
      out.innerHTML = `<span class="js-line is-bad">That program never finished — is there a loop with no way out?</span>`;
    } else if (state.threw) {
      out.innerHTML = `<span class="js-line is-bad">${esc(state.threw)}</span>`;
    } else if (!lines.length) {
      out.innerHTML = `<span class="js-line is-quiet">${state.ran ? "It printed nothing." : "Press Run."}</span>`;
    } else {
      out.innerHTML = lines.map((l) => `<span class="js-line${l.kind === "bad" ? " is-bad" : l.kind === "warn" ? " is-warn" : ""}">${esc(l.text)}</span>`).join("");
    }
  };

  let busy = false;
  const go = async () => {
    if (busy) return;
    busy = true;
    box.classList.add("is-running");
    const src = pad.value;
    const res = await runCode(src);
    busy = false;
    box.classList.remove("is-running");
    const before = { ...state };
    state = { src, ...res, ran: true };
    paint();
    onChange({ ...state }, before);
  };

  /* typing changes the answer, so the console goes stale until it re-runs */
  let timer = null;
  const typed = () => {
    grow();
    clearTimeout(timer);
    box.classList.add("is-stale");
    timer = setTimeout(() => { box.classList.remove("is-stale"); go(); }, 700);
  };

  const onKey = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); clearTimeout(timer); go(); return; }
    /* Tab types two spaces: in a box this small, leaving the box is worse */
    if (e.key === "Tab") {
      e.preventDefault();
      const a = pad.selectionStart;
      pad.setRangeText("  ", a, pad.selectionEnd, "end");
      typed();
    }
  };
  const onRun = (e) => {
    if (e.target.closest(".js-btn--run")) { clearTimeout(timer); go(); }
    if (e.target.closest(".js-btn--back")) { pad.value = start; typed(); }
  };

  pad.addEventListener("input", typed);
  pad.addEventListener("keydown", onKey);
  box.addEventListener("click", onRun);
  requestAnimationFrame(grow);
  paint();
  /* A box the child WRITES in runs as they type, so they see their own
     program working. A printed listing does NOT: the question above it asks
     what the program will print, and a console that answered before they had
     read the code would be handing over the answer. They press Run. */
  if (!saved && editable) go();

  return {
    src: () => pad.value,
    state: () => ({ ...state }),
    run: go,
    set(next) {
      state = next && typeof next.src === "string" ? { ...next } : { src: start, out: [], threw: null, slow: false };
      pad.value = state.src;
      grow();
      paint();
    },
    clear() {
      state = { src: start, out: [], threw: null, slow: false };
      pad.value = start;
      grow();
      paint();
      onChange({ ...state }, { ...state });
      go();
    },
    dispose() {
      clearTimeout(timer);
      pad.removeEventListener("input", typed);
      pad.removeEventListener("keydown", onKey);
      box.removeEventListener("click", onRun);
      box.classList.remove("is-live", "is-stale", "is-running");
      box.innerHTML = printed;
    },
  };
}
