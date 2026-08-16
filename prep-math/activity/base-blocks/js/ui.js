/* ============================================================================
   Manipulatives — the controls
   ----------------------------------------------------------------------------
   Everything the learner can press lives inside the canvas, so the workbench is
   still whole in fullscreen. Actions mutate the store and then emit; the view and
   this panel both re-read from the store, nothing draws itself mid-operation.
   ========================================================================== */

import { CFG, PLACES, TAGS, placeDims, toBase, baseWord } from "./config.js";
import { ICON } from "./icons.js";
import { store, subscribe, emit, say, undo, canUndo, selected, selectedItems } from "./state.js";
import * as ops from "./ops.js";
import { renderBoard } from "./readout.js";
import { splitAxis, mergeCheck, regroupPlan } from "./ops.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function mountUI({
  pointer, stage,
  onFit = () => {}, onFlat = () => {},
  onZoom = () => {}, onPan = () => {}, onHand = () => {}, onTurn = () => {},
}) {
  paintIcons(document);

  const el = {
    count: $("#bb-count-n"),
    countSub: $("#bb-count-sub"),
    baseBtn: $("#bb-base-btn"),
    baseLabel: $("#bb-base-label"),
    baseNote: $("#bb-base-note"),
    bases: $("#bb-bases"),
    strict: $("#bb-strict"),
    strictN: $("#bb-strict-n"),
    popBase: $("#bb-pop-base"),
    popOwn: $("#bb-pop-own"),
    board: $("#bb-board"),
    boardBody: $("#bb-board-body"),
    boardBtn: $("#bb-board-btn"),
    viewBtn: $("#bb-view-btn"),
    viewLabel: $("#bb-view-label"),
    toast: $("#bb-toast"),
    tagdots: $("#bb-tagdots"),
    rail: $(".bb-rail"),
    dock: $(".bb-dock"),
  };

  /* ── build the repeated bits ────────────────────────────────────────────── */

  el.tagdots.innerHTML = TAGS.map(
    (t) =>
      `<button class="bb-tagdot" type="button" data-tag="${t.id}" title="Highlight ${t.name}"
        style="--dot:${t.hex}"><span class="sr-only">${t.name}</span></button>`
  ).join("");

  el.bases.innerHTML = Array.from({ length: CFG.maxBase - CFG.minBase + 1 }, (_, i) => {
    const b = CFG.minBase + i;
    return `<button class="bb-base" type="button" data-base="${b}">${b}</button>`;
  }).join("");

  /* ── actions ────────────────────────────────────────────────────────────── */

  const run = (fn) => { fn(); emit(); };

  const ACTIONS = {
    // pressing Regroup on the rail is a deliberate "sort this out" — the answer
    // it lands may be nowhere near where the blocks were, so bring the camera
    regroup: () => { if (ops.regroupToBest()) onFit(); },
    split: () => ops.splitSelected(),
    merge: () => ops.mergeSelected(),
    break: () => ops.breakToUnits(),
    match: () => ops.selectLike(),
    tidy: () => { if (ops.tidyMat()) onFit(); },
    undo: () => { if (undo()) say("Stepped back."); },
    delete: () => ops.deleteSelected(),
    lasso: () => {
      pointer.setLasso(!pointer.lasso);
      say(pointer.lasso ? "Box pick on — drag on the paper to sweep things up." : "Box pick off.");
    },
  };

  el.rail.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    const fn = ACTIONS[btn.dataset.act];
    if (fn) run(fn);
  });

  // the highlight dots live in the dock, beside whichever family is showing
  el.dock.addEventListener("click", (e) => {
    const dot = e.target.closest("[data-tag]");
    if (!dot) return;
    const raw = dot.dataset.tag;
    run(() => ops.tagSelected(raw === "none" ? null : Number(raw)));
  });

  /* ── popovers ───────────────────────────────────────────────────────────── */

  function openPop(pop, trigger) {
    closePops(pop);
    // the base popover and the board claim the same corner — only one at a time
    if (pop === el.popBase && !el.board.hidden) toggleBoard(false);
    pop.hidden = false;
    trigger?.setAttribute("aria-expanded", "true");
  }
  function closePops(except = null) {
    for (const pop of [el.popBase, el.popOwn]) {
      if (pop === except) continue;
      pop.hidden = true;
    }
    el.baseBtn.setAttribute("aria-expanded", "false");
    $("#bb-own-btn")?.setAttribute("aria-expanded", "false");
  }

  el.baseBtn.addEventListener("click", () =>
    el.popBase.hidden ? openPop(el.popBase, el.baseBtn) : closePops()
  );
  $$("[data-close]").forEach((b) => b.addEventListener("click", () => closePops()));

  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".bb-pop") || e.target.closest("#bb-base-btn") || e.target.closest("#bb-own-btn")) return;
    closePops();
  });

  el.bases.addEventListener("click", (e) => {
    const b = e.target.closest("[data-base]");
    if (!b) return;
    run(() => ops.setBase(Number(b.dataset.base)));
  });

  el.strict.addEventListener("change", () => {
    store.strict = el.strict.checked;
    say(
      store.strict
        ? `Trade rules on — merge exactly ${store.base} alike blocks.`
        : "Trade rules off — any matching blocks may be joined."
    );
    emit();
  });

  /* ── own-size builder ───────────────────────────────────────────────────── */

  const dims = { l: $("#bb-dim-l"), w: $("#bb-dim-w"), h: $("#bb-dim-h") };
  const dimsOut = $("#bb-dims-out");

  function readDims() {
    const v = (input) => Math.max(1, Math.min(CFG.maxDim, Math.round(Number(input.value) || 1)));
    return { l: v(dims.l), w: v(dims.w), h: v(dims.h) };
  }
  function showDims() {
    const d = readDims();
    dimsOut.innerHTML = `<b>${d.l} × ${d.w} × ${d.h}</b> = ${d.l * d.w * d.h} unit${d.l * d.w * d.h === 1 ? "" : "s"}`;
    const chip = $("[data-size='own']");
    if (chip) chip.textContent = `${d.l}×${d.w}×${d.h}`;
  }

  $(".bb-dims").addEventListener("click", (e) => {
    const step = e.target.closest("[data-step]");
    if (!step) return;
    const input = dims[step.dataset.dim];
    input.value = Math.max(1, Math.min(CFG.maxDim, (Number(input.value) || 1) + Number(step.dataset.step)));
    showDims();
  });
  Object.values(dims).forEach((i) => i.addEventListener("input", showDims));

  $("#bb-add-own").addEventListener("click", () => {
    const d = readDims();
    run(() => ops.addCustom(d.l, d.w, d.h));
  });

  /* ── place-value board ──────────────────────────────────────────────────── */

  function toggleBoard(on) {
    const show = on ?? el.board.hidden;
    if (show) closePops();
    el.board.hidden = !show;
    el.boardBtn.setAttribute("aria-expanded", String(show));
    el.boardBtn.classList.toggle("is-on", show);
    if (show) renderBoard(el.boardBody, store);
  }
  el.boardBtn.addEventListener("click", () => toggleBoard());
  $("[data-close-board]").addEventListener("click", () => toggleBoard(false));

  /* ── 2D ⇄ 3D ────────────────────────────────────────────────────────────── */

  function toggleFlat(on) {
    const want = on ?? !store.flat;
    if (want === store.flat) return;
    store.flat = want;
    onFlat(want);
    say(want ? "Flat view — straight down on the paper." : "Solid view.");
    emit();
  }
  el.viewBtn.addEventListener("click", () => toggleFlat());

  /* ── keyboard ───────────────────────────────────────────────────────────── */

  window.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    const k = e.key.toLowerCase();

    if ((e.ctrlKey || e.metaKey) && k === "z") { e.preventDefault(); return run(ACTIONS.undo); }
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    /* Getting about the canvas: the arrows slide it and +/− zoom. These move the
       camera only — nothing on the paper changes — so they never emit. */
    const PAN = {
      arrowleft: [-1, 0], arrowright: [1, 0],
      arrowup: [0, -1], arrowdown: [0, 1],
    };
    if (PAN[k]) { e.preventDefault(); onPan(...PAN[k]); return; }
    if (k === "+" || k === "=") { e.preventDefault(); onZoom(0.8); return; }
    if (k === "-" || k === "_") { e.preventDefault(); onZoom(1.25); return; }
    if (k === "h") { e.preventDefault(); onHand(); return; }

    if (k === "r") { e.preventDefault(); run(ACTIONS.regroup); }
    else if (k === "s") { e.preventDefault(); run(ACTIONS.split); }
    else if (k === "m") { e.preventDefault(); run(ACTIONS.merge); }
    else if (k === "b") { e.preventDefault(); run(ACTIONS.break); }
    else if (k === "t") { e.preventDefault(); run(ACTIONS.tidy); }
    else if (k === "v") { e.preventDefault(); toggleFlat(); }
    else if (k === "q") { e.preventDefault(); onTurn(); }
    else if (k === "a") { e.preventDefault(); run(() => { ops.selectAll(); say("Everything selected."); }); }
    else if (k === "escape") { closePops(); run(() => { store.selection = new Set(); }); }
    else if (k === "delete" || k === "backspace") { e.preventDefault(); run(ACTIONS.delete); }
    else if (k >= "1" && k <= "6") { run(() => ops.tagSelected(Number(k) - 1)); }
    else if (k === "0") { run(() => ops.tagSelected(null)); }
  });

  /* ── redraw ─────────────────────────────────────────────────────────────── */

  let toastTimer = 0;
  let lastMessage = 0;

  function update() {
    const base = store.base;
    const total = store.blocks.reduce((n, b) => n + b.l * b.w * b.h, 0);

    el.count.textContent = total;
    el.countSub.textContent =
      base === 10
        ? `unit${total === 1 ? "" : "s"} on the canvas`
        : `units · ${toBase(total, base)} in base ${baseWord(base)}`;

    // the chip shows the number; what it means is on the tooltip and in the popover
    el.baseLabel.textContent = base;
    el.baseBtn.title = `Working base — base ${baseWord(base)}`;
    el.strictN.textContent = base;
    el.strict.checked = store.strict;
    $$(".bb-base", el.bases).forEach((b) =>
      b.classList.toggle("is-on", Number(b.dataset.base) === base)
    );
    el.baseNote.innerHTML =
      `In base ${baseWord(base)}, <b>${base} units</b> trade for one rod, ` +
      `<b>${base} rods</b> for one flat and <b>${base} flats</b> for one cube — ` +
      `a cube is ${base * base * base} units.`;

    el.viewLabel.textContent = store.flat ? "3D" : "2D";
    el.viewBtn.setAttribute("aria-pressed", String(store.flat));
    el.viewBtn.setAttribute("aria-label", store.flat ? "Back to the solid view (V)" : "Flat 2D view (V)");
    el.viewBtn.title = store.flat ? "Solid 3D view (V)" : "Flat 2D view (V)";
    el.viewBtn.classList.toggle("is-on", store.flat);
    const viewIcon = el.viewBtn.querySelector("[data-icon]");
    if (viewIcon) viewIcon.innerHTML = store.flat ? ICON.solid : ICON.flat;

    for (const p of PLACES) {
      const chip = $(`[data-size='${p.id}']`);
      if (!chip) continue;
      const d = placeDims(p.id, base);
      chip.textContent = d.l * d.w * d.h;
    }

    // tool availability
    const sel = selected();
    const anything = selectedItems();
    const canSplit = sel.some((b) => splitAxis(b));
    const merge = mergeCheck(sel, base, store.strict);
    setEnabled("regroup", sel.length > 0 && !regroupPlan(sel, base).same);
    setEnabled("split", canSplit);
    setEnabled("merge", merge.ok);
    setEnabled("break", canSplit);
    setEnabled("match", sel.length > 0);
    setEnabled("delete", anything.length > 0);
    setEnabled("tidy", store.blocks.length + store.things.length > 0);
    setEnabled("undo", canUndo());
    const lassoBtn = $("[data-act='lasso']");
    lassoBtn.setAttribute("aria-pressed", String(pointer.lasso));
    lassoBtn.classList.toggle("is-on", pointer.lasso);

    $$(".bb-tagdot").forEach((d) => d.classList.toggle("is-live", sel.length > 0));

    if (!el.board.hidden) renderBoard(el.boardBody, store);
    showDims();

    // one line of feedback
    const msg = store.message;
    if (msg && msg.at !== lastMessage) {
      lastMessage = msg.at;
      el.toast.textContent = msg.text;
      el.toast.dataset.kind = msg.kind;
      el.toast.classList.add("is-on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.toast.classList.remove("is-on"), 3600);
    }
  }

  function setEnabled(act, on) {
    const b = $(`[data-act='${act}']`);
    if (b) b.disabled = !on;
  }

  subscribe(update);
  update();

  return {
    update,
    toggleBoard,
    toggleFlat,
    openOwn: (trigger) => (el.popOwn.hidden ? openPop(el.popOwn, trigger) : closePops()),
    refreshIcons: () => paintIcons(document),
  };
}

/** Fill every <span data-icon="…"> with our own SVG. */
export function paintIcons(root) {
  $$("[data-icon]", root).forEach((el) => {
    const svg = ICON[el.dataset.icon];
    if (svg) el.innerHTML = svg;
  });
}
