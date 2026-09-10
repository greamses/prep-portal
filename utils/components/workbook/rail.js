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

  /* A workbook that has grown chapters shows one chapter at a time, behind a
     row of tabs: the first group of a chapter carries `chapter`, and the rest
     follow it. What is ticked in the other chapters stays ticked — the paper
     is everything ticked, in every tab — and each tab says how many. */
  const TAB_KEY = `${store}:tab`;
  let tabAt = 0;
  try { tabAt = Number(localStorage.getItem(TAB_KEY)) || 0; } catch (_) {}

  function chaptersOf() {
    const out = [];
    groups.forEach((g) => {
      if (g.chapter || !out.length) out.push({ name: g.chapter || "", groups: [] });
      out[out.length - 1].groups.push(g);
    });
    return out;
  }

  function showTab(i) {
    const host = $("wb-picks");
    const panels = host.querySelectorAll(".wb-picks__flow");
    tabAt = clamp(i, 0, panels.length - 1);
    panels.forEach((p, j) => { p.hidden = j !== tabAt; });
    host.querySelectorAll(".wb-tabs .builder-tab").forEach((t, j) => {
      t.classList.toggle("is-active", j === tabAt);
      t.setAttribute("aria-selected", String(j === tabAt));
    });
    try { localStorage.setItem(TAB_KEY, String(tabAt)); } catch (_) {}
  }

  function countTabs() {
    const host = $("wb-picks");
    const tabs = host.querySelectorAll(".wb-tabs .builder-tab");
    host.querySelectorAll(".wb-picks__flow").forEach((p, j) => {
      const n = p.querySelectorAll('[data-role="on"]:checked').length;
      const badge = tabs[j] && tabs[j].querySelector(".wb-tab__n");
      if (badge) { badge.textContent = n; badge.hidden = !n; }
    });
  }

  function fillPicks(chosen) {
    const host = $("wb-picks");
    host.innerHTML = "";
    const chapters = chaptersOf();
    const tabbed = chapters.length > 1;
    if (tabbed) {
      const bar = document.createElement("div");
      bar.className = "builder-tabs builder-tabs--compact wb-tabs";
      bar.setAttribute("role", "tablist");
      chapters.forEach((ch, j) => {
        /* "Chapter 2 · Transversal angles" — the tab says the topic */
        const [num, topic] = ch.name.includes(" · ") ? ch.name.split(" · ") : ["", ch.name];
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "pp-pill builder-tab";
        tab.setAttribute("role", "tab");
        tab.title = ch.name;
        tab.innerHTML = `${topic}<b class="wb-tab__n" hidden></b>`;
        tab.setAttribute("aria-label", `${num} ${topic}`.trim());
        tab.addEventListener("click", () => showTab(j));
        bar.appendChild(tab);
      });
      host.appendChild(bar);
    }
    chapters.forEach((ch) => {
      const flow = document.createElement("div");
      flow.className = "wb-picks__flow";
      if (tabbed) flow.setAttribute("role", "tabpanel");
      host.appendChild(flow);
      ch.groups.forEach((g) => fillGroup(flow, g, chosen));
    });
    if (tabbed) { showTab(tabAt); countTabs(); }
  }

  /* A group is one box, so the list's columns never part a heading from its
     rows. The blurb under each exercise's name shows on hover (workbook.css). */
  function fillGroup(host, g, chosen) {
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
      modal?.count("Nothing ticked yet", false);
      fit();
      return;
    }

    const pages = renderWorkbook(sheet(), o, subject);
    $("wb-pages").textContent = pages === 1 ? "1 page" : `${pages} pages`;
    $("wb-print").disabled = false;
    modal?.count($("wb-pages").textContent, true);
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

  /* ── the booklet opens in a modal ───────────────────────────────────────
     The setup is the page; the booklet is built behind it as the setup
     changes, and opens over it — the paper, its toolbar, and interactive
     mode — from the bar at the foot of the setup. Closed, the booklet is
     still laid out (off screen, invisible, inert), because pagination
     measures the pages: a booklet hidden with display:none would measure
     nothing. The print styles put the paper back in any case. */
  let modal = null;
  function mountModal() {
    const preview = document.querySelector(".wb-work > .wb-preview");
    const toolbar = preview?.querySelector(".wb-toolbar");
    if (!preview || !toolbar || !document.querySelector(".wb-rail")) return null;

    /* the toolbar and (once it is mounted) the interactive tools stay in
       reach at the top of the booklet as it scrolls */
    const head = document.createElement("div");
    head.className = "wb-modal__head";
    toolbar.before(head);
    head.appendChild(toolbar);
    const close = document.createElement("button");
    close.type = "button";
    close.className = "pp-btn wb-tint-4 wb-modal__close";
    close.textContent = "Close";
    toolbar.appendChild(close);

    preview.classList.add("wb-modal");
    preview.setAttribute("role", "dialog");
    preview.setAttribute("aria-modal", "true");
    preview.setAttribute("aria-label", "The workbook");
    preview.inert = true;
    const backdrop = document.createElement("div");
    backdrop.className = "wb-modal__backdrop";
    backdrop.hidden = true;
    document.body.appendChild(backdrop);

    /* Floats at the foot of the window, so it is in reach from anywhere in
       the setup. On the body, not in the setup card: the card's paper clips,
       and a sticky bar inside it never sticks. */
    const bar = document.createElement("div");
    bar.className = "wb-openbar";
    bar.innerHTML =
      `<span class="wb-openbar__count"><span data-icon="page"></span><span class="wb-openbar__pages"></span></span>` +
      `<button type="button" class="pp-btn wb-tint-2 wb-openbar__go">Open the workbook</button>`;
    document.body.appendChild(bar);
    document.documentElement.classList.add("wb-has-openbar");
    const go = bar.querySelector(".wb-openbar__go");

    const open = () => {
      preview.inert = false;
      preview.classList.add("is-open");
      backdrop.hidden = false;
      document.documentElement.classList.add("wb-modal-on");
      requestAnimationFrame(() => { fit(); close.focus({ preventScroll: true }); });
    };
    const shut = () => {
      preview.classList.remove("is-open");
      preview.inert = true;
      backdrop.hidden = true;
      document.documentElement.classList.remove("wb-modal-on");
      go.focus({ preventScroll: true });
    };
    go.addEventListener("click", open);
    close.addEventListener("click", shut);
    backdrop.addEventListener("click", shut);
    document.addEventListener("keydown", (e) => {
      /* the payment and assign dialogs close themselves first */
      if (e.key !== "Escape" || !preview.classList.contains("is-open") || document.querySelector(".wb-pay")) return;
      shut();
    });
    return {
      open, shut,
      count(text, ready) {
        bar.querySelector(".wb-openbar__pages").textContent = text;
        go.disabled = !ready;
      },
    };
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
    /* before the print pass, the assign button and the interactive tools are
       mounted, so they are made inside the modal's head */
    modal = mountModal();
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
    rail.addEventListener("change", (e) => { if (e.target.dataset.role === "on") countTabs(); });

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
