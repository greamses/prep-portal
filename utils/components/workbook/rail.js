/* ============================================================================
   PRINTABLE WORKBOOK — the bench, wired up
   ----------------------------------------------------------------------------
   The rail is read into one options object, the options build the paper, and
   the paper is scaled down to fit the column. There is no Generate button:
   every control rebuilds the workbook as it is moved, because the whole point
   of a preview that is page-accurate is that you can see what "one more
   question" costs before you print it.

   Everything in here is true of every workbook: the list of exercises with a
   count beside each, the paper size, the name-and-date line, the answer key,
   the seed code, the print button, and fitting the sheet to its column. What
   differs between one workbook and the next is a handful of extra controls —
   which base, how much help — and those are passed in as `extra`, read and
   written by the page that owns them. The page never touches the rest.

     mountBuilder({
       subject   for engine.js — see the note at the top of that file
       store     localStorage key for this workbook's settings
       glyphs    { groupId: svg } for the headings in the exercise list
       groups    the registry's groups, in the order they should be listed
       title     what the title box says before anyone types in it
       starter   { exerciseId: count } a brand-new visitor's first workbook
       extra     { ids, read(), write(saved), onInput(e) } — the page's own
                 controls: which element ids to listen to, how to read them
                 into the options, how to put a saved workbook back into them
     print     { workbook, label } — this workbook is sold per print: the
                 Print button goes through the ₦5,000 pass (print-pass.js).
                 Without it the workbook prints free.
     interactive  { protractor } — the paper can be done on screen and
                 marked (interactive.js); `protractor` is the instrument's SVG
     })
   ========================================================================== */

import { renderWorkbook, PAPERS } from "./engine.js";
import { seedCode, seedFrom } from "./seed.js";
import { ICON } from "./icons.js";
import { printPass, guardPrinting, workbookKey } from "./print-pass.js";
import { mountInteractive } from "./interactive.js";
import { mountAssign } from "./assign.js";

const $ = (id) => document.getElementById(id);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export function mountBuilder(cfg) {
  const { subject, store, glyphs = {}, groups, title, starter = {}, extra = {} } = cfg;
  const exercises = subject.exercises;
  /* A workbook sold per print gets the pass; any other prints free, so its
     pages are always cleared for the printer. */
  let pass = null;
  let live = null;
  if (!cfg.print) document.documentElement.classList.add("wb-print-ok");

  /* ── the list of exercises, grouped, straight off the registry ──────────*/

  function fillPicks(chosen) {
    const host = $("wb-picks");
    host.innerHTML = "";
    groups.forEach((g) => {
      /* A workbook that has grown chapters marks where each one starts: the
         first group of a chapter carries `chapter`, and the rest follow it. */
      if (g.chapter) {
        const ch = document.createElement("p");
        ch.className = "wb-chapter__name";
        ch.textContent = g.chapter;
        host.appendChild(ch);
      }
      /* A group is one box, so the list's columns never part a heading from
         its rows. */
      const group = document.createElement("div");
      group.className = "wb-group";
      host.appendChild(group);
      const head = document.createElement("p");
      head.className = "wb-group__name";
      head.innerHTML = `${glyphs[g.id] || ""}${g.label}`;
      group.appendChild(head);

      exercises.filter((e) => e.group === g.id).forEach((ex) => {
        const row = document.createElement("label");
        row.className = "wb-pick";
        row.dataset.id = ex.id;
        const n = chosen[ex.id] ?? 0;
        row.innerHTML =
          `<input type="checkbox" data-role="on"${n ? " checked" : ""} />` +
          `<span class="wb-pick__label">` +
          `<span class="wb-pick__name">${ex.label}</span>` +
          `<span class="wb-pick__blurb">${ex.blurb}</span>` +
          `</span>` +
          `<input class="wb-pick__count" data-role="count" type="number" min="1" max="40" ` +
          `value="${n || ex.defaultCount}" aria-label="How many ${ex.label} questions" />`;
        group.appendChild(row);
      });
    });
  }

  /* ── reading and writing the options ────────────────────────────────────*/

  function readOptions() {
    const chosen = [];
    document.querySelectorAll(".wb-pick").forEach((row) => {
      const on = row.querySelector('[data-role="on"]');
      const count = row.querySelector('[data-role="count"]');
      if (!on.checked) return;
      chosen.push({ id: row.dataset.id, count: clamp(Number(count.value) || 1, 1, 40) });
    });
    return {
      title: $("wb-title").value.trim() || title,
      paper: $("wb-paper").value in PAPERS ? $("wb-paper").value : "a4",
      nameLine: $("wb-nameline").checked,
      answers: $("wb-answers").checked,
      seed: seedFrom($("wb-seedcode").value),
      code: $("wb-seedcode").value.trim().toUpperCase(),
      chosen,
      ...(extra.read ? extra.read() : {}),
    };
  }

  function save(o) {
    try {
      const { chosen, seed, code, ...rest } = o;
      localStorage.setItem(
        store,
        JSON.stringify({
          ...rest,
          code: $("wb-seedcode").value,
          chosen: Object.fromEntries(chosen.map((c) => [c.id, c.count])),
        })
      );
    } catch { /* a private window is not a reason to stop working */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(store);
      if (raw) return JSON.parse(raw);
    } catch { /* ditto */ }
    return null;
  }

  /**
   * An exercise that cannot run under these options is greyed out and SAID,
   * rather than removed. A menu that changes length when you change a setting
   * leaves you wondering what you lost; a line that stays put and says "base
   * ten only" tells you exactly what and why.
   */
  function markUnavailable(o) {
    document.querySelectorAll(".wb-pick").forEach((row) => {
      const ex = exercises.find((e) => e.id === row.dataset.id);
      const why = ex && subject.unavailable ? subject.unavailable(ex, o) : null;
      row.classList.toggle("is-off", !!why);
      row.querySelector('[data-role="on"]').disabled = !!why;
      row.querySelector('[data-role="count"]').disabled = !!why;
      const blurb = row.querySelector(".wb-pick__blurb");
      if (ex) blurb.innerHTML = why ? `<em>${why}</em> — ${ex.blurb}` : ex.blurb;
    });
  }

  /* ── build + fit ────────────────────────────────────────────────────────*/

  const sheet = () => $("wb-sheet");

  function render() {
    const o = readOptions();
    markUnavailable(o);
    save(o);

    if (!o.chosen.length) {
      sheet().replaceChildren();
      sheet().innerHTML =
        `<p class="wb-empty">Nothing chosen yet — tick an exercise and the paper appears.</p>`;
      $("wb-pages").textContent = "no pages";
      $("wb-print").disabled = true;
      fit();
      return;
    }

    const pages = renderWorkbook(sheet(), o, subject);
    $("wb-pages").textContent = pages === 1 ? "1 page" : `${pages} pages`;
    $("wb-print").disabled = false;
    if (pass) pass.update(o, { pages, sections: o.chosen.length, code: $("wb-seedcode").value });
    if (live) workbookKey(store, o).then((k) => live.afterRender(k));
    pageRule(o.paper);
    fit();
  }

  /**
   * Scale the sheet down to the width of its column. The pages themselves are
   * always real millimetres — a preview that is a different SIZE from the
   * print is fine, a preview that is a different SHAPE is not — so this is a
   * transform and never a change of layout.
   */
  function fit() {
    const viewport = $("wb-viewport");
    const scaler = $("wb-scaler");
    const width = viewport.clientWidth;
    if (!width) return;
    const natural = sheet().offsetWidth || 1;
    const zoom = Math.min(1, width / natural);
    scaler.style.transform = `scale(${zoom})`;
    /* the paper sits in the middle when there is room either side of it */
    scaler.style.left = `${Math.max(0, (width - natural * zoom) / 2)}px`;
    viewport.style.height = `${sheet().offsetHeight * zoom}px`;
  }

  /**
   * The paper size has to reach the printer as an @page rule; a CSS variable
   * cannot. One stylesheet element, rewritten when the menu changes.
   */
  function pageRule(paperId) {
    const paper = PAPERS[paperId] || PAPERS.a4;
    let tag = $("wb-page-rule");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "wb-page-rule";
      document.head.appendChild(tag);
    }
    tag.textContent = `@page { size: ${paper.w}mm ${paper.h}mm; margin: 0; }`;
  }

  /* Typing in the title box should not rebuild six pages per keystroke. */
  let pending = 0;
  const schedule = () => {
    clearTimeout(pending);
    pending = setTimeout(render, 140);
  };

  /* ── go ─────────────────────────────────────────────────────────────────*/

  function start() {
    const saved = load();
    if (extra.write) extra.write(saved || {});
    fillPicks(saved?.chosen || starter);

    $("wb-title").value = saved?.title ?? title;
    $("wb-paper").value = saved?.paper ?? "a4";
    $("wb-nameline").checked = saved?.nameLine !== false;
    $("wb-answers").checked = saved?.answers !== false;
    $("wb-seedcode").value = saved?.code || seedCode((Math.random() * 0xffffffff) >>> 0);

    /* The button's words change with the pass ("Print · ₦5,000"), its icon
       does not, so the words get their own span. */
    const printBtn = $("wb-print");
    if (!printBtn.querySelector(".wb-print__label")) {
      [...printBtn.childNodes].forEach((n) => { if (n.nodeType === 3) n.remove(); });
      printBtn.insertAdjacentHTML("afterbegin", `<span class="wb-print__label">Print</span> `);
    }
    if (cfg.print) {
      pass = printPass(cfg.print);
      guardPrinting(pass);
      /* a workbook that is sold can also be set for a class — teachers only */
      mountAssign({ workbook: cfg.print.workbook, label: cfg.print.label, getOptions: readOptions });
    }
    if (cfg.interactive) {
      live = mountInteractive({
        sheet: sheet(),
        viewport: $("wb-viewport"),
        scaler: $("wb-scaler"),
        toolbar: document.querySelector(".wb-toolbar"),
        refit: fit,
        protractor: cfg.interactive.protractor,
        places: cfg.interactive.places || "",
      });
    }

    document.querySelectorAll("[data-icon]").forEach((el) => {
      el.innerHTML = (cfg.icons || ICON)[el.dataset.icon] || "";
    });

    /* One listener on the rail: every control in it means the same thing —
       rebuild the paper. */
    const rail = document.querySelector(".wb-rail");
    rail.addEventListener("input", (e) => {
      if (e.target.id === "wb-seedcode") {
        const clean = e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5);
        if (clean !== e.target.value) e.target.value = clean;
      }
      if (extra.onInput) extra.onInput(e);
      schedule();
    });
    rail.addEventListener("change", schedule);

    $("wb-reseed").addEventListener("click", () => {
      $("wb-seedcode").value = seedCode((Math.random() * 0xffffffff) >>> 0);
      render();
    });

    $("wb-print").addEventListener("click", () => (pass ? pass.print() : window.print()));

    /* The printer gets the pages at full size; the preview's transform would
       otherwise be baked into the print in some browsers. Undo it for the
       print and put it back afterwards. */
    window.addEventListener("beforeprint", () => {
      $("wb-scaler").style.transform = "none";
    });
    window.addEventListener("afterprint", fit);

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fit, 120);
    });

    /* Measured pagination depends on the real metrics of every font on the
       paper, so the first build waits for them by NAME.
       
       document.fonts.ready is not enough on its own and the difference is not
       academic: it resolves when the fonts requested SO FAR have arrived, and
       the handwritten face is not requested until the first render has put a
       section letter on the page. So the honest sequence is — paginate against
       a fallback, request the real face, finish loading it, and never
       re-paginate — which leaves the last question of a page hanging over the
       edge. Asking for the three faces up front closes that window. */
    const faces = [
      '700 12pt "Shantell Sans"',
      '900 20pt Unbounded',
      '400 10pt "JetBrains Mono"',
      '700 10pt "JetBrains Mono"',
    ];
    if (document.fonts && document.fonts.load) {
      Promise.all(faces.map((f) => document.fonts.load(f).catch(() => {})))
        .then(() => document.fonts.ready)
        .then(render);
    }
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  return { render, fit };
}
