/* ============================================================================
   Place Value Workbook — the builder, wired up
   ----------------------------------------------------------------------------
   The rail is read into one options object, the options build the paper, and
   the paper is scaled down to fit the column. There is no Generate button:
   every control rebuilds the workbook as it is moved, because the whole point
   of a preview that is page-accurate is that you can see what "one more
   question" costs before you print it.

   The code in the corner is the seed. A teacher who prints, loses the file and
   comes back tomorrow types five letters and gets the identical paper — and,
   crucially, the identical answer key. That is why the code is printed at the
   foot of every page and at the head of the answers.
   ========================================================================== */

import { EXERCISES, GROUPS, unavailable } from "./exercises.js";
import { buildSections, blocksOf, paginate, PAPERS } from "./workbook.js";
import { seedCode, seedFrom, placeName } from "./numbers.js";
import { CFG, baseWord } from "../../base-blocks/js/config.js";
import { ICON } from "./icons.js";

const $ = (id) => document.getElementById(id);
const STORE = "pv-workbook-v1";

/* Which exercises a brand-new visitor gets: one from each stage, so the first
   workbook anyone prints already runs blocks → chart → number. */
const STARTER = {
  "blocks-count": 4,
  "blocks-chart": 3,
  "chart-write": 5,
  "chart-value": 6,
  expanded: 6,
  compare: 6,
};

/* ── the form ──────────────────────────────────────────────────────────────*/

/** Fill the base and places menus, which depend on each other's wording. */
function fillMenus() {
  const base = $("pv-base");
  base.innerHTML = "";
  for (let b = CFG.minBase; b <= CFG.maxBase; b++) {
    const o = document.createElement("option");
    o.value = String(b);
    o.textContent = b === 10 ? "Ten (ordinary numbers)" : `${b} — base ${baseWord(b)}`;
    base.appendChild(o);
  }
  base.value = "10";
  fillPlaces(10);
}

/** The places menu names its options, because "5" alone means nothing. */
function fillPlaces(b) {
  const sel = $("pv-places");
  const keep = sel.value;
  sel.innerHTML = "";
  for (let p = 2; p <= 7; p++) {
    const o = document.createElement("option");
    o.value = String(p);
    o.textContent = `${p} — up to ${placeName(p - 1, b).toLowerCase()}`;
    sel.appendChild(o);
  }
  sel.value = keep && keep >= 2 && keep <= 7 ? keep : "3";
}

/** The list of exercises, grouped, straight off the registry. */
function fillPicks(chosen) {
  const host = $("pv-picks");
  host.innerHTML = "";
  const glyph = { blocks: ICON.blocks, charts: ICON.table, numbers: ICON.figures };

  GROUPS.forEach((g) => {
    const head = document.createElement("p");
    head.className = "pv-group__name";
    head.innerHTML = `${glyph[g.id] || ""}${g.label}`;
    host.appendChild(head);

    EXERCISES.filter((e) => e.group === g.id).forEach((ex) => {
      const row = document.createElement("label");
      row.className = "pv-pick";
      row.dataset.id = ex.id;
      const n = chosen[ex.id] ?? 0;
      row.innerHTML =
        `<input type="checkbox" data-role="on"${n ? " checked" : ""} />` +
        `<span class="pv-pick__label">` +
        `<span class="pv-pick__name">${ex.label}</span>` +
        `<span class="pv-pick__blurb">${ex.blurb}</span>` +
        `</span>` +
        `<input class="pv-pick__count" data-role="count" type="number" min="1" max="40" ` +
        `value="${n || ex.defaultCount}" aria-label="How many ${ex.label} questions" />`;
      host.appendChild(row);
    });
  });
}

/* ── reading and writing the options ───────────────────────────────────────*/

function readOptions() {
  const base = Number($("pv-base").value);
  const chosen = [];
  document.querySelectorAll(".pv-pick").forEach((row) => {
    const on = row.querySelector('[data-role="on"]');
    const count = row.querySelector('[data-role="count"]');
    if (!on.checked) return;
    chosen.push({ id: row.dataset.id, count: clamp(Number(count.value) || 1, 1, 40) });
  });
  return {
    title: $("pv-title").value.trim() || "Place Value",
    base,
    places: Number($("pv-places").value),
    zeros: Number($("pv-zeros").value),
    paper: $("pv-paper").value in PAPERS ? $("pv-paper").value : "a4",
    nameLine: $("pv-nameline").checked,
    blocksKey: $("pv-blockskey").checked,
    answers: $("pv-answers").checked,
    seed: seedFrom($("pv-seedcode").value),
    chosen,
  };
}

function save(o) {
  try {
    localStorage.setItem(
      STORE,
      JSON.stringify({
        title: o.title, base: o.base, places: o.places, zeros: o.zeros,
        paper: o.paper, nameLine: o.nameLine, blocksKey: o.blocksKey,
        answers: o.answers, code: $("pv-seedcode").value,
        chosen: Object.fromEntries(o.chosen.map((c) => [c.id, c.count])),
      })
    );
  } catch { /* a private window is not a reason to stop working */ }
}

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return JSON.parse(raw);
  } catch { /* ditto */ }
  return null;
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* ── an exercise that cannot run in this base ──────────────────────────────*/

/**
 * Greyed out and SAID, rather than removed. A menu that changes length when
 * you change the base leaves you wondering what you lost; a line that stays
 * put and says "base ten only" tells you exactly what and why.
 */
function markUnavailable(o) {
  document.querySelectorAll(".pv-pick").forEach((row) => {
    const ex = EXERCISES.find((e) => e.id === row.dataset.id);
    const why = ex ? unavailable(ex, o) : null;
    row.classList.toggle("is-off", !!why);
    row.querySelector('[data-role="on"]').disabled = !!why;
    row.querySelector('[data-role="count"]').disabled = !!why;
    const blurb = row.querySelector(".pv-pick__blurb");
    blurb.innerHTML = why ? `<em>${why}</em> — ${ex.blurb}` : ex.blurb;
  });
}

/* ── build + fit ───────────────────────────────────────────────────────────*/

const sheet = () => $("pv-sheet");

function render() {
  const o = readOptions();
  markUnavailable(o);
  save(o);

  if (!o.chosen.length) {
    sheet().replaceChildren();
    sheet().innerHTML = `<p class="pv-empty">Nothing chosen yet — tick an exercise and the paper appears.</p>`;
    $("pv-pages").textContent = "no pages";
    $("pv-print").disabled = true;
    fit();
    return;
  }

  const sections = buildSections(o);
  const pages = paginate(sheet(), blocksOf(sections, o), o);
  $("pv-pages").textContent = pages === 1 ? "1 page" : `${pages} pages`;
  $("pv-print").disabled = false;
  pageRule(o.paper);
  fit();
}

/**
 * Scale the sheet down to the width of its column. The pages themselves are
 * always real millimetres — a preview that is a different SIZE from the print
 * is fine, a preview that is a different SHAPE is not — so this is a transform
 * and never a change of layout.
 */
function fit() {
  const viewport = $("pv-viewport");
  const scaler = $("pv-scaler");
  const width = viewport.clientWidth;
  if (!width) return;
  const natural = sheet().offsetWidth || 1;
  const zoom = Math.min(1, width / natural);
  scaler.style.transform = `scale(${zoom})`;
  viewport.style.height = `${sheet().offsetHeight * zoom}px`;
}

/**
 * The paper size has to reach the printer as an @page rule; a CSS variable
 * cannot. One stylesheet element, rewritten when the menu changes.
 */
function pageRule(paperId) {
  const paper = PAPERS[paperId] || PAPERS.a4;
  let tag = document.getElementById("pv-page-rule");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "pv-page-rule";
    document.head.appendChild(tag);
  }
  tag.textContent = `@page { size: ${paper.w}mm ${paper.h}mm; margin: 0; }`;
}

/* ── go ────────────────────────────────────────────────────────────────────*/

function start() {
  fillMenus();
  const saved = load();
  fillPicks(saved?.chosen || STARTER);

  if (saved) {
    $("pv-title").value = saved.title ?? "Place Value";
    $("pv-base").value = String(saved.base ?? 10);
    fillPlaces(saved.base ?? 10);
    $("pv-places").value = String(saved.places ?? 3);
    $("pv-zeros").value = String(saved.zeros ?? 0.25);
    $("pv-paper").value = saved.paper ?? "a4";
    $("pv-nameline").checked = saved.nameLine !== false;
    $("pv-blockskey").checked = saved.blocksKey !== false;
    $("pv-answers").checked = saved.answers !== false;
  }
  $("pv-seedcode").value = saved?.code || seedCode((Math.random() * 0xffffffff) >>> 0);

  document.querySelectorAll("[data-icon]").forEach((el) => {
    el.innerHTML = ICON[el.dataset.icon] || "";
  });

  /* One listener on the rail: every control in it means the same thing —
     rebuild the paper. */
  const rail = document.querySelector(".pv-rail");
  rail.addEventListener("input", (e) => {
    if (e.target.id === "pv-base") fillPlaces(Number(e.target.value));
    if (e.target.id === "pv-seedcode") {
      const clean = e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5);
      if (clean !== e.target.value) e.target.value = clean;
    }
    schedule();
  });
  rail.addEventListener("change", schedule);

  $("pv-reseed").addEventListener("click", () => {
    $("pv-seedcode").value = seedCode((Math.random() * 0xffffffff) >>> 0);
    render();
  });

  $("pv-print").addEventListener("click", () => window.print());

  /* The printer gets the pages at full size; the preview's transform would
     otherwise be baked into the print in some browsers. Undo it for the print
     and put it back afterwards. */
  window.addEventListener("beforeprint", () => {
    $("pv-scaler").style.transform = "none";
  });
  window.addEventListener("afterprint", fit);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fit, 120);
  });

  /* Measured pagination depends on the real metrics of Unbounded and JetBrains
     Mono, so the first build waits for them. Without this the first render
     paginates against the fallback font and every page is a line out. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  render();
}

/* Typing in the title box should not rebuild six pages per keystroke. */
let pending = 0;
function schedule() {
  clearTimeout(pending);
  pending = setTimeout(render, 140);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
