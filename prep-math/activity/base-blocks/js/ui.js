/* ============================================================================
   Manipulatives — the controls
   ----------------------------------------------------------------------------
   Everything the learner can press lives inside the canvas, so the workbench is
   still whole in fullscreen. Actions mutate the store and then emit; the view and
   this panel both re-read from the store, nothing draws itself mid-operation.
   ========================================================================== */

import { CFG, DIGITS, PLACES, TAGS, placeDims, toBase, baseWord } from "./config.js";
import { ICON } from "./icons.js";
import { store, subscribe, emit, say, undo, canUndo, selected, selectedItems } from "./state.js";
import * as ops from "./ops.js";
import { renderBoard } from "./readout.js";
import { splitAxis, mergeCheck, regroupPlan } from "./ops.js";
import { toggleSync, afterBlocks, totalUnits, buildNumber } from "./sync.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function mountUI({
  pointer, stage,
  onFit = () => {}, onFlat = () => {},
  onZoom = () => {}, onPan = () => {}, onHand = () => {}, onTurn = () => {},
  onBack = () => {},
}) {
  paintIcons(document);

  const el = {
    count: $("#bb-count-n"),
    countSub: $("#bb-count-sub"),
    baseBtn: $("#bb-base-btn"),
    baseLabel: $("#bb-base-label"),
    bases: $("#bb-bases"),
    strict: $("#bb-strict"),
    strictN: $("#bb-strict-n"),
    strictRow: $("#bb-strict-row"),
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
    flyAdd: $("#bb-fly-add"),
    flyPaint: $("#bb-fly-paint"),
    flyType: $("#bb-fly-type"),
    keyin: $("#bb-keyin"),
    keyinBox: $("#bb-keyin-n"),
    keyinNote: $("#bb-keyin-note"),
  };

  /* Every panel the rail can open, by the key that opens it. Only one is ever
     out at a time — they all live in the same strip beside the rail. */
  const MENUS = {
    add: el.flyAdd,
    paint: el.flyPaint,
    base: el.popBase,
    type: el.flyType,
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

  /* Any action that moves the block total is a change to THE number, so with
     sync on the frames and charts are brought along before anything redraws. */
  const run = (fn) => {
    const before = totalUnits();
    fn();
    if (totalUnits() !== before) {
      const missed = afterBlocks();
      if (missed) say(missed, "warn");
    }
    emit();
  };

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
    // the three that used to be chips on a bar of their own
    back: () => { closeMenus(); onBack(); },
    read: () => toggleBoard(),
    view: () => toggleFlat(),
    sync: () => toggleSync(),
  };

  el.rail.addEventListener("click", (e) => {
    const menu = e.target.closest("[data-menu]");
    if (menu) { toggleMenu(menu.dataset.menu, menu); return; }
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    const fn = ACTIONS[btn.dataset.act];
    if (fn) run(fn);
  });

  // the highlight dots are one of the rail's panels now
  el.flyPaint.addEventListener("click", (e) => {
    const dot = e.target.closest("[data-tag]");
    if (!dot) return;
    const raw = dot.dataset.tag;
    run(() => ops.tagSelected(raw === "none" ? null : Number(raw)));
  });

  /* ── the rail's panels ──────────────────────────────────────────────────── */

  let openMenu = null;

  /**
   * Put a panel beside the key that opened it, and keep it on the stage.
   * It clears whatever the key is IN — the rail, or another panel — rather than
   * the key itself, so a column of keys opens a column of panels in line.
   */
  function anchor(panel, btn) {
    const s = stage.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    const host = (btn.closest(".bb-rail") || btn.closest(".bb-fly") || btn).getBoundingClientRect();
    // measured after it is shown, so offsetWidth/Height are the real ones
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const left = Math.min(host.right - s.left + 8, s.width - w - 8);
    panel.style.left = Math.round(Math.max(8, left)) + "px";
    const want = r.top - s.top - 6;
    panel.style.top = Math.round(Math.max(8, Math.min(s.height - h - 8, want))) + "px";
  }

  function closeMenus(except = null) {
    for (const [name, panel] of Object.entries(MENUS)) {
      if (name === except) continue;
      panel.hidden = true;
      $(`[data-menu='${name}']`)?.setAttribute("aria-expanded", "false");
      $(`[data-menu='${name}']`)?.classList.remove("is-on");
    }
    if (except == null) openMenu = null;
    // the own-size builder hangs off the Add panel, so it goes with it
    if (except !== "add") el.popOwn.hidden = true;
  }

  function toggleMenu(name, btn) {
    const panel = MENUS[name];
    if (!panel) return;
    if (openMenu === name) { closeMenus(); return; }
    closeMenus(name);
    openMenu = name;
    panel.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    btn.classList.add("is-on");
    anchor(panel, btn);
    // a box you opened to type in should be ready to type in
    panel.querySelector("input[type='text']")?.focus();
  }

  $$("[data-close]").forEach((b) => b.addEventListener("click", () => closeMenus()));

  /* A press on the paper puts the panels away. The rail and the panels
     themselves are exempt, or opening one would immediately shut it. */
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".bb-fly") || e.target.closest(".bb-pop") || e.target.closest(".bb-rail")) return;
    closeMenus();
  });

  el.bases.addEventListener("click", (e) => {
    const b = e.target.closest("[data-base]");
    if (!b) return;
    run(() => {
      if (!ops.setBase(Number(b.dataset.base))) return;
      /* A base change moves no blocks, so run()'s before/after check will not
         fire — but every PLACE now means something else, and a schoty has just
         been cleared to be rebuilt. The blocks are the one reading that does
         not depend on the base, so with sync on they lead. */
      const missed = afterBlocks();
      if (missed) say(missed, "warn");
    });
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

  /* ── type a number and watch it get built ───────────────────────────────── */

  /* Read in the WORKING BASE, not always in ten: in base five, typing 1234
     should build 1234₅. Digits above nine are A and B, the way the readout
     writes them. */
  function readTyped(raw) {
    const s = String(raw).trim().toUpperCase().replace(/[\s,]/g, "");
    if (!s) return null;
    let n = 0;
    for (const ch of s) {
      const d = DIGITS.indexOf(ch);
      if (d < 0 || d >= store.base) return null;
      n = n * store.base + d;
      if (n > 1e12) return null;
    }
    return n;
  }

  el.keyin.addEventListener("submit", (e) => {
    e.preventDefault();
    const n = readTyped(el.keyinBox.value);
    if (n == null) {
      el.keyinNote.textContent =
        `Base ${baseWord(store.base)} is written with ${DIGITS.slice(0, store.base).split("").join(" ")}.`;
      el.keyinNote.dataset.kind = "warn";
      return;
    }
    const done = buildNumber(n);
    el.keyinNote.textContent = done.message;
    el.keyinNote.dataset.kind = done.ok ? "ok" : "warn";
    say(done.message, done.ok ? "ok" : "warn");
    emit();
  });

  /* The tools were just told to show something, so say what that is under the
     box as well — the canvas may be scrolled away from all of them. */
  el.keyinBox.addEventListener("input", () => {
    const n = readTyped(el.keyinBox.value);
    el.keyinNote.dataset.kind = "";
    el.keyinNote.textContent = n == null || store.base === 10
      ? ""
      : `${el.keyinBox.value.trim()} in base ${baseWord(store.base)} is ${n} units.`;
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
    if (show) closeMenus();
    el.board.hidden = !show;
    el.boardBtn.setAttribute("aria-expanded", String(show));
    el.boardBtn.classList.toggle("is-on", show);
    if (show) renderBoard(el.boardBody, store);
  }
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

  /* ── keyboard ───────────────────────────────────────────────────────────── */

  window.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
      /* Every letter belongs to the box while you are in it — except Escape,
         which has to get you back out. Without this the panel stays open, and
         pressing its own key again reads as "close" when you meant "open". */
      if (e.key === "Escape") { e.preventDefault(); t.blur(); closeMenus(); }
      return;
    }
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
    else if (k === "y") { e.preventDefault(); run(ACTIONS.sync); }
    else if (k === "q") { e.preventDefault(); onTurn(); }
    else if (k === "a") { e.preventDefault(); run(() => { ops.selectAll(); say("Everything selected."); }); }
    else if (k === "escape") { closeMenus(); run(() => { store.selection = new Set(); }); }
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
    /* Both explanations are tooltips. They say the same thing every time you
       open the panel, and once you have read one you are only ever here to
       press a number. */
    el.bases.title =
      `In base ${baseWord(base)}, ${base} units trade for one rod, ` +
      `${base} rods for one flat and ${base} flats for one cube — ` +
      `a cube is ${base * base * base} units.`;
    el.strictRow.title = store.strict
      ? `Trade rules on — only exactly ${base} alike blocks may be merged. `
        + "Turn this off to join any blocks that match."
      : "Trade rules off — any matching blocks may be joined. "
        + `Turn it on to require exactly ${base}.`;

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

    const syncBtn = $("#bb-sync-btn");
    syncBtn.setAttribute("aria-pressed", String(store.sync));
    syncBtn.classList.toggle("is-on", store.sync);

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
    /* The own-size builder opens off the Add panel, so it is anchored to that
       button rather than to the rail key — and it leaves Add open behind it. */
    openOwn: (trigger) => {
      const show = el.popOwn.hidden;
      el.popOwn.hidden = !show;
      trigger?.setAttribute("aria-expanded", String(show));
      if (show) anchor(el.popOwn, trigger || el.flyAdd);
    },
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
