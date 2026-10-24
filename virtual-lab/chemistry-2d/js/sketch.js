/* ============================================================================
   CHEMISTRY BENCH — the structure pad (the drawer's "Structures" rail)
   ----------------------------------------------------------------------------
   Draw a molecule the way it is drawn on paper:

     PEN     tap the paper for an atom of the chosen element; drag out of an
             atom to grow a bond (it snaps to 30° and one bond's length, or
             lands on the atom under the finger); tap an atom to make it the
             chosen element; tap a bond to step it single → double → triple
     MOVE    drag an atom
     CHARGE  tap an atom: 0 → + → − → 2+ → 2− → 0
     RUBBER  tap an atom or a bond to take it away

   "Add H" puts in every hydrogen still missing; the Lewis key shows the lone
   pairs. Under the paper: the formula, Mr, and anything that cannot be (an
   atom with more bonds than it makes). The drawing is kept with the bench
   (state.sketch). Its chemistry is structures.js.
   ========================================================================== */

import { BOND, BOND_H, empty, clone, atomOf, addAtom, addBond, removeAtom, removeBond, bondBetween, fillH, formulaHtml, massOf, problems, hints, pieces, moleculeSvg, build, TEMPLATES, hiddenAtoms, dropH, noteOf } from "./structures.js";
import { bySymbol } from "./atoms.js";

const ELS = ["C", "H", "O", "N", "Cl", "Br", "I", "F", "S", "P", "B", "Na", "K", "Mg"];
const W = 560, H = 340;
const glyph = (inner, size = 18) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${inner}</svg>`;
const bondIco = (n) => glyph(`<circle cx="4" cy="12" r="3" fill="var(--text-tertiary)"/><circle cx="20" cy="12" r="3" fill="var(--text-tertiary)"/>${(n === 1 ? [0] : n === 2 ? [-2.4, 2.4] : [-3.6, 0, 3.6]).map((o) => `<path d="M7 ${12 + o}h10" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round"/>`).join("")}`);

export function initSketch({ $, state, save, openSheet, UI }) {
  const sheet = $("cl-sheet-sketch");
  const pad = $("cl-sk-pad");
  if (!state.sketch || !Array.isArray(state.sketch.atoms)) state.sketch = empty();
  const ui = { tool: "pen", el: "C", order: 1, lewis: false, skeleton: false };
  let m = state.sketch;
  const undo = [];
  const keep = () => { undo.push(clone(m)); if (undo.length > 60) undo.shift(); if (ui.skeleton) dropH(m); };
  const commit = () => { if (ui.skeleton) fillH(m); state.sketch = m; save(); render(); };

  // ── the keys ──
  const TOOLS = [
    ["pen", "Draw atoms and bonds", UI.pen(18)],
    ["move", "Move an atom", UI.move(18)],
    ["charge", "Give an atom a charge", glyph(`<circle cx="12" cy="12" r="9" fill="var(--accent-warning)"/><path d="M7.5 12h4M9.5 10v4M13.500 12h3.500" stroke="#14130f" stroke-width="2" stroke-linecap="round"/>`)],
    ["erase", "Rub out an atom or a bond", UI.eraser(18)],
  ];
  $("cl-sk-tools").innerHTML =
    TOOLS.map(([id, tip, ico]) => `<button type="button" class="cl-ico cl-ico--paper" data-tool="${id}" data-tip="${tip}" aria-label="${tip}" aria-pressed="false">${ico}</button>`).join("")
    + `<span class="cl-sk-sep"></span>`
    + [1, 2, 3].map((n) => `<button type="button" class="cl-ico cl-ico--paper" data-order="${n}" data-tip="${["Single", "Double", "Triple"][n - 1]} bond" aria-label="${["Single", "Double", "Triple"][n - 1]} bond" aria-pressed="false">${bondIco(n)}</button>`).join("")
    + `<span class="cl-sk-sep"></span>`
    + `<button type="button" class="cl-ico cl-ico--paper" data-do="fill" data-tip="Add every hydrogen still missing" aria-label="Add hydrogens">${glyph(`<text x="8.5" y="17.5" text-anchor="middle" font-family="var(--font-display)" font-weight="700" font-size="15" fill="var(--ink)">H</text><path d="M17.5 5.500v8M13.500 9.500h8" stroke="var(--accent-success)" stroke-width="2.600" stroke-linecap="round"/>`)}</button>`
    + `<button type="button" class="cl-ico cl-ico--paper" data-do="lewis" data-tip="Show the lone pairs (Lewis structure)" aria-label="Lewis structure" aria-pressed="false">${glyph(`<text x="12" y="17" text-anchor="middle" font-family="var(--font-display)" font-weight="700" font-size="13" fill="var(--accent-danger)">O</text><circle cx="10" cy="3.500" r="1.700" fill="var(--ink)"/><circle cx="14" cy="3.500" r="1.700" fill="var(--ink)"/><circle cx="10" cy="21" r="1.700" fill="var(--ink)"/><circle cx="14" cy="21" r="1.700" fill="var(--ink)"/><circle cx="3" cy="10.500" r="1.700" fill="var(--ink)"/><circle cx="3" cy="14.500" r="1.700" fill="var(--ink)"/>`)}</button>`
    + `<button type="button" class="cl-ico cl-ico--paper" data-do="skeleton" data-tip="Skeletal formula: carbons are the corners, hydrogens on carbon are left out" aria-label="Skeletal formula" aria-pressed="false">${glyph(`<path d="M2.500 16l5-8 5 8 5-8 4.500 5" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`)}</button>`
    + `<button type="button" class="cl-ico cl-ico--paper" data-do="undo" data-tip="Undo" aria-label="Undo">${UI.undo(18)}</button>`
    + `<button type="button" class="cl-ico cl-ico--paper" data-do="clear" data-tip="Clear the paper" aria-label="Clear the paper">${UI.trash(18)}</button>`;
  $("cl-sk-els").innerHTML = ELS.map((e, i) => `<button type="button" class="cl-sk-pick" data-el="${e}" style="--note:${noteOf(e)};--tilt:${[-2.2, 1.6, -1, 2.2, -1.8, 1.2][i % 6]}deg" aria-pressed="false" aria-label="${bySymbol(e).name}">${e}</button>`).join("");

  function keys() {
    sheet.querySelectorAll("[data-tool]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === ui.tool)));
    sheet.querySelectorAll("[data-order]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.order === ui.order)));
    sheet.querySelectorAll("[data-el]").forEach((b) => { const on = b.dataset.el === ui.el; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
    sheet.querySelector('[data-do="skeleton"]').setAttribute("aria-pressed", String(ui.skeleton));
    sheet.querySelector('[data-do="lewis"]').setAttribute("aria-pressed", String(ui.lewis));
    pad.dataset.tool = ui.tool;
  }

  // ── drawing ──
  let drag = null, hover = null;
  function render() {
    const bad = new Set(problems(m).map((p) => p.id));
    let rubber = "";
    if (drag && drag.kind === "bond" && drag.to) {
      const a = atomOf(m, drag.from);
      rubber = `<path class="cl-sk-rubber" d="M${a.x} ${a.y}L${drag.to.x.toFixed(1)} ${drag.to.y.toFixed(1)}"/>`;
      if (!drag.to.id) rubber += `<text class="cl-sk-ghost" x="${drag.to.x.toFixed(1)}" y="${drag.to.y.toFixed(1)}">${ui.el}</text>`;
    }
    pad.innerHTML = `<rect class="cl-sk-paper" x="0" y="0" width="${W}" height="${H}"/>${rubber}${moleculeSvg(m, { lewis: ui.lewis, skeleton: ui.skeleton, bad, sel: hover })}`
      + (m.atoms.length ? "" : `<text class="cl-sk-empty" x="${W / 2}" y="${H / 2}">Tap the paper to put an atom down, then drag out of it to make a bond.</text>`);
    info();
  }
  function info() {
    const out = $("cl-sk-info");
    if (!m.atoms.length) { out.innerHTML = ""; return; }
    const errs = problems(m);
    const n = pieces(m);
    const mr = Math.round(massOf(m) * 10) / 10;
    out.innerHTML = `<span>Formula <b>${formulaHtml(m)}</b></span><span>M<sub>r</sub> <b>${mr}</b></span>${n > 1 ? `<span>${n} separate pieces</span>` : ""}`
      + errs.map((e) => `<span class="cl-sk-err">${e.text}</span>`).join("")
      + (errs.length ? "" : hints(m).map((e) => `<span class="cl-sk-hint">${e.text}</span>`).join(""));
  }

  // ── the pointer ──
  const toPad = (e) => { const p = pad.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(pad.getScreenCTM().inverse()); return { x: q.x, y: q.y }; };
  const atomAt = (p, not) => { let best = null, d = 15; const hid = ui.skeleton ? hiddenAtoms(m) : new Set(); for (const a of m.atoms) { if (hid.has(a.id) && a.el === "H") continue; const k = Math.hypot(a.x - p.x, a.y - p.y); if (k < d && a.id !== not) { d = k; best = a; } } return best; };
  function bondAt(p) {
    let best = null, d = 7;
    const hid = ui.skeleton ? hiddenAtoms(m) : new Set();
    for (const b of m.bonds) {
      const A = atomOf(m, b.a), B = atomOf(m, b.b);
      if ((hid.has(A.id) && A.el === "H") || (hid.has(B.id) && B.el === "H")) continue;
      const dx = B.x - A.x, dy = B.y - A.y, L2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((p.x - A.x) * dx + (p.y - A.y) * dy) / L2));
      const k = Math.hypot(A.x + t * dx - p.x, A.y + t * dy - p.y);
      if (k < d) { d = k; best = b; }
    }
    return best;
  }
  const inside = (p) => ({ x: Math.max(14, Math.min(W - 14, p.x)), y: Math.max(14, Math.min(H - 14, p.y)) });
  // where a bond dragged out of `a` toward p would end: on an atom, or one bond's length at a 30° step
  function endOf(a, p) {
    const hit = atomAt(p, a.id);
    if (hit) return { x: hit.x, y: hit.y, id: hit.id };
    const t = Math.round(Math.atan2(p.y - a.y, p.x - a.x) / (Math.PI / 6)) * (Math.PI / 6);
    const L = ui.el === "H" || a.el === "H" ? BOND_H : BOND;
    return inside({ x: a.x + L * Math.cos(t), y: a.y + L * Math.sin(t) });
  }

  pad.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const p = toPad(e);
    const a = atomAt(p), b = a ? null : bondAt(p);
    pad.setPointerCapture(e.pointerId);
    if (ui.tool === "erase") {
      if (a) { keep(); removeAtom(m, a.id); commit(); }
      else if (b) { keep(); removeBond(m, b); commit(); }
      return;
    }
    if (ui.tool === "charge") {
      if (a) { keep(); const C = [0, 1, -1, 2, -2]; a.q = C[(C.indexOf(a.q) + 1) % C.length] ?? 0; commit(); }
      return;
    }
    if (ui.tool === "move") {
      if (a) { keep(); drag = { kind: "move", id: a.id, dx: a.x - p.x, dy: a.y - p.y }; }
      return;
    }
    // the pen
    if (b) { keep(); b.o = (b.o % 3) + 1; commit(); return; }
    keep();
    if (a) { drag = { kind: "bond", from: a.id, x: p.x, y: p.y, fresh: false }; return; }
    const q = inside(p);
    const made = addAtom(m, ui.el, q.x, q.y);
    drag = { kind: "bond", from: made.id, x: p.x, y: p.y, fresh: true };
    render();
  });
  pad.addEventListener("pointermove", (e) => {
    const p = toPad(e);
    if (!drag) {
      const a = ui.tool !== "pen" || e.pointerType === "touch" ? null : atomAt(p);
      if ((a ? a.id : null) !== hover) { hover = a ? a.id : null; render(); }
      return;
    }
    if (drag.kind === "move") {
      const a = atomOf(m, drag.id);
      Object.assign(a, inside({ x: p.x + drag.dx, y: p.y + drag.dy }));
      render();
      return;
    }
    if (Math.hypot(p.x - drag.x, p.y - drag.y) < 8) { if (drag.to) { drag.to = null; render(); } return; }
    drag.to = endOf(atomOf(m, drag.from), p);
    render();
  });
  const finish = () => {
    const d = drag;
    drag = null;
    if (!d) return;
    if (d.kind === "move") { commit(); return; }
    const a = atomOf(m, d.from);
    if (d.to) {
      if (d.to.id) {
        if (bondBetween(m, a.id, d.to.id)) bondBetween(m, a.id, d.to.id).o = ui.order;
        else addBond(m, a.id, d.to.id, ui.order);
      } else {
        const n = addAtom(m, ui.el, d.to.x, d.to.y);
        addBond(m, a.id, n.id, ui.el === "H" || a.el === "H" ? 1 : ui.order);
      }
    } else if (!d.fresh) {
      // a tap on an atom: make it the chosen element (a tap on one already that element changes nothing)
      if (a.el === ui.el) { undo.pop(); if (ui.skeleton) fillH(m); render(); return; }
      a.el = ui.el;
    }
    commit();
  };
  pad.addEventListener("pointerup", finish);
  pad.addEventListener("pointercancel", finish);
  pad.addEventListener("pointerleave", () => { if (hover != null && !drag) { hover = null; render(); } });

  sheet.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tool],[data-order],[data-el],[data-do]");
    if (!t) return;
    if (t.dataset.tool) ui.tool = t.dataset.tool;
    else if (t.dataset.order) { ui.order = +t.dataset.order; ui.tool = "pen"; }
    else if (t.dataset.el) { ui.el = t.dataset.el; ui.tool = "pen"; }
    else if (t.dataset.do === "lewis") ui.lewis = !ui.lewis;
    else if (t.dataset.do === "skeleton") { ui.skeleton = !ui.skeleton; if (ui.skeleton && ui.el === "H") ui.el = "C"; }
    else if (t.dataset.do === "fill") { keep(); if (!fillH(m)) undo.pop(); commit(); }
    else if (t.dataset.do === "undo") { if (undo.length) { m = undo.pop(); commit(); } }
    else if (t.dataset.do === "clear") { if (m.atoms.length) { keep(); m = empty(); commit(); } }
    keys();
    render();
  });
  // Delete / Backspace / Ctrl+Z while the pad is open (and nothing is being typed)
  window.addEventListener("keydown", (e) => {
    if (sheet.hidden || e.target.closest("input, textarea, select, [contenteditable]")) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.stopImmediatePropagation(); if (undo.length) { m = undo.pop(); commit(); } }
  }, true);

  /** Open the pad: with a starting molecule (it replaces the drawing, and Undo brings that back), or as it was. */
  function show(id) {
    if (id && TEMPLATES.some((t) => t.id === id)) {
      if (m.atoms.length) keep();
      m = build(id, W / 2, H / 2);
      state.sketch = m;
      save();
    }
    keys();
    render();
    if (sheet.hidden) openSheet("cl-sheet-sketch");
  }
  pad.setAttribute("viewBox", `0 0 ${W} ${H}`);
  keys();
  render();
  return { show };
}
