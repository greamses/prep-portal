/* ============================================================================
   Sticky notes — writing on one
   ----------------------------------------------------------------------------
   The editing half of the sticky-note component: a contenteditable piece of
   paper with a small bar of pens over it. It knows nothing about where it is
   floating — the caller says WHERE with `place()` — so the same editor serves a
   note lying on a 3D canvas, a note pinned to a page, and a note in a panel.

   ── formatting applies to what is HIGHLIGHTED ─────────────────────────────
   Select some words and the pens act on those words only. With nothing
   selected they act on the WHOLE note, which is what pressing "bigger" on a
   note you have just written plainly means — rather than the browser default of
   silently arming the pen for whatever you type next, which looks like the key
   did nothing.

   ── the pens work on the MODEL, not the markup ────────────────────────────
   Not `document.execCommand`. That is the obvious way to format a selection and
   it was the first way this worked, but it rewrites the markup as it pleases:
   an underline put on before a size change simply vanished when the size change
   restructured the nodes around it, and no amount of care about the order of
   operations fixes that.

   So every pen reads the runs off the paper, splits them at the two CHARACTER
   OFFSETS the highlight covers, dresses that stretch, and writes the paper back
   from the runs. Nothing is handed to the browser to restructure, so no pen can
   undo another. Typing is still the browser's own — `runsFromDOM` reads it back
   off the COMPUTED style of each piece of text, which is right whatever
   produced it.
   ========================================================================== */

import {
  PAPERS, INKS, MARKS, FONTS, SIZES, DEFAULT_SIZE,
  runsToNodes, runsFromDOM, editNote, noteText, snapSize,
  restyle, toggleOver, runsOver,
} from "./sticky-note.js";

/**
 * @param {object} opts
 * @param {HTMLElement} opts.host   where the editor is appended
 * @param {(note)=>void} [opts.onInput]  called as the words change
 * @param {(note, info)=>void} [opts.onDone]  called when the pen is put down
 */
export function createStickyEditor({ host, onInput = () => {}, onDone = () => {} }) {
  const root = document.createElement("div");
  root.className = "pp-note";
  root.hidden = true;
  root.innerHTML = `
    <div class="pp-note__bar" role="toolbar" aria-label="How the note is written">
      <select class="pp-note__pickfont" data-set="font" title="Face" aria-label="Face">
        ${FONTS.map((f) => `<option value="${f.id}" style="font-family:${f.css}">${f.name}</option>`).join("")}
      </select>
      <select class="pp-note__picksize" data-set="size" title="Size" aria-label="Size">
        ${SIZES.map((s) => `<option value="${s}">${s}</option>`).join("")}
      </select>
      <i class="pp-note__sep"></i>
      <button type="button" class="pp-note__key pp-note__key--b" data-do="bold"
              title="Bold" aria-label="Bold">B</button>
      <button type="button" class="pp-note__key pp-note__key--i" data-do="italic"
              title="Slanted" aria-label="Slanted">I</button>
      <button type="button" class="pp-note__key pp-note__key--u" data-do="underline"
              title="Underlined" aria-label="Underlined">U</button>
      <i class="pp-note__sep"></i>
      <button type="button" class="pp-note__swatch" data-pick="ink"
              title="Colour of the writing" aria-label="Colour of the writing"
              aria-haspopup="true"><b></b></button>
      <button type="button" class="pp-note__swatch pp-note__swatch--mark" data-pick="mark"
              title="Highlighter" aria-label="Highlighter" aria-haspopup="true"><b></b></button>
      <i class="pp-note__sep"></i>
      <button type="button" class="pp-note__swatch pp-note__swatch--paper" data-pick="paper"
              title="Colour of the paper" aria-label="Colour of the paper"
              aria-haspopup="true"><b></b></button>
    </div>
    <div class="pp-note__pick" hidden></div>
    <div class="pp-note__paper" contenteditable="true" role="textbox" aria-multiline="true"
         aria-label="What the note says" spellcheck="true"></div>`;
  host.appendChild(root);

  const bar = root.querySelector(".pp-note__bar");
  const pick = root.querySelector(".pp-note__pick");
  const paper = root.querySelector(".pp-note__paper");
  const swatch = (name) => root.querySelector(`[data-pick="${name}"] b`);

  let note = null;
  let pending = null; // the swatch strip that is open

  /* ── selection: nothing chosen means the whole note ─────────────────────── */

  function inPaper() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    return paper.contains(sel.getRangeAt(0).commonAncestorContainer);
  }

  function selectAll() {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(paper);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /* Where the selection is, counted in CHARACTERS from the start of the note.
     Element-and-offset would do — until an operation rewrites the very nodes it
     points at, which changing the writing size has to do. Character offsets
     survive any amount of re-marking, because the words do not move. */

  function offsetOf(container, offset) {
    const walk = document.createTreeWalker(paper, NodeFilter.SHOW_TEXT);
    let n = 0;
    let node = walk.nextNode();
    while (node) {
      if (node === container) return n + offset;
      n += node.nodeValue.length;
      node = walk.nextNode();
    }
    return n;
  }

  function saveSel() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !inPaper()) return null;
    const r = sel.getRangeAt(0);
    return { a: offsetOf(r.startContainer, r.startOffset), b: offsetOf(r.endContainer, r.endOffset) };
  }

  function restoreSel(at) {
    if (!at) return;
    const walk = document.createTreeWalker(paper, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let n = 0;
    let node = walk.nextNode();
    let started = false;
    while (node) {
      const len = node.nodeValue.length;
      if (!started && at.a <= n + len) {
        range.setStart(node, Math.max(0, at.a - n));
        started = true;
      }
      if (started && at.b <= n + len) {
        range.setEnd(node, Math.max(0, at.b - n));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      n += len;
      node = walk.nextNode();
    }
  }

  /* ── the pens ───────────────────────────────────────────────────────────── */

  /** How many characters the note holds — the end of "everything". */
  const plainLength = () => paper.textContent.length;

  /**
   * Dress what is highlighted, or the whole note when nothing is.
   *
   * Everything the bar does goes through here: read the runs off the paper,
   * restyle the chosen stretch, write the paper back from the runs. Nothing is
   * ever handed to the browser to restructure, so no pen can undo another.
   */
  function dressSelection(make, at = null) {
    paper.focus();
    if (at) restoreSel(at);
    let where = saveSel();
    if (!where || where.a === where.b) where = { a: 0, b: plainLength() };
    if (where.b <= where.a) return;

    const runs = runsFromDOM(paper);
    const patch = typeof make === "function" ? make(runs, where) : make;
    if (!patch) return;

    editNote(note, { runs: restyle(runs, where.a, where.b, patch) });
    paper.replaceChildren(runsToNodes(note.runs));
    restoreSel(where);
    readBack();
    onInput(note);
  }

  const DO = {
    bold: (runs, at) => ({ bold: toggleOver(runs, at.a, at.b, "bold") }),
    italic: (runs, at) => ({ italic: toggleOver(runs, at.a, at.b, "italic") }),
    underline: (runs, at) => ({ underline: toggleOver(runs, at.a, at.b, "underline") }),
  };

  /* A press on the bar must not take the caret out of the paper — except on a
     dropdown, which cannot open at all if its own pointerdown is cancelled. */
  bar.addEventListener("pointerdown", (e) => {
    if (e.target.closest("select")) { held = saveSel(); return; }
    e.preventDefault();
  });
  bar.addEventListener("click", (e) => {
    const key = e.target.closest("[data-do]");
    if (key) { closePick(); dressSelection(DO[key.dataset.do]); return; }
    const picker = e.target.closest("[data-pick]");
    if (picker) openPick(picker.dataset.pick, picker);
  });

  /* ── the two dropdowns ──────────────────────────────────────────────────── */

  /* Opening a native dropdown blurs the paper and loses the highlight, so the
     highlight is remembered on the way IN and put back before the change is
     applied. Native rather than a menu of our own on purpose: it is the control
     a phone and a screen reader already know how to work. */
  let held = null;

  const fontSel = root.querySelector("[data-set=font]");
  const sizeSel = root.querySelector("[data-set=size]");

  for (const sel of [fontSel, sizeSel]) {
    sel.addEventListener("focus", () => { if (!held) held = saveSel(); });
    sel.addEventListener("change", () => {
      const at = held;
      held = null;
      closePick();
      dressSelection(sel === sizeSel
        ? { px: Number(sizeSel.value) }
        : { font: FONTS.find((f) => f.id === fontSel.value)?.css || FONTS[0].css }, at);
    });
  }

  /** Show what the writing under the caret actually is, as it moves. */
  function readBack() {
    if (root.hidden) return;
    const s = window.getSelection();
    let el = s && s.rangeCount ? s.getRangeAt(0).startContainer : null;
    if (el && el.nodeType === Node.TEXT_NODE) el = el.parentElement;
    if (!el || !paper.contains(el)) return;
    const cs = getComputedStyle(el);
    sizeSel.value = String(snapSize(parseFloat(cs.fontSize) || SIZES[DEFAULT_SIZE]));
    const fam = cs.fontFamily.toLowerCase();
    const hit = FONTS.find((f) =>
      fam.includes(f.css.split(",")[0].replace(/["']/g, "").trim().toLowerCase()));
    if (hit) fontSel.value = hit.id;
  }
  document.addEventListener("selectionchange", readBack);

  /* ── the three swatch strips ────────────────────────────────────────────── */

  const SETS = {
    ink: () => INKS.map((c) => ({ hex: c.hex, name: c.name })),
    mark: () => MARKS.map((c) => ({ hex: c.hex, name: c.name })),
    paper: () => PAPERS.map((c, i) => ({ hex: c.hex, name: c.id, index: i })),
  };

  function closePick() {
    pick.hidden = true;
    pending = null;
  }

  function openPick(which, from) {
    if (pending === which) { closePick(); return; }
    pending = which;
    pick.innerHTML = SETS[which]().map((c, i) => `
      <button type="button" class="pp-note__chip${c.hex ? "" : " is-none"}"
        data-hex="${c.hex || ""}" data-index="${c.index ?? i}" title="${c.name}"
        style="${c.hex ? `background:${c.hex}` : ""}"><span class="sr-only">${c.name}</span></button>`).join("");
    pick.hidden = false;
    pick.style.left = Math.max(0, from.offsetLeft - 30) + "px";
  }

  pick.addEventListener("pointerdown", (e) => e.preventDefault());
  pick.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-hex]");
    if (!chip || !note) return;
    const hex = chip.dataset.hex || null;
    const which = pending;
    closePick();
    if (which === "paper") {
      editNote(note, { paper: Number(chip.dataset.index) });
      dress();
      onInput(note);
      return;
    }
    dressSelection(which === "ink" ? { ink: hex } : { mark: hex });
    swatch(which).style.background = hex || "transparent";
  });

  /* ── reading the paper back ─────────────────────────────────────────────── */

  function harvest() {
    if (!note) return;
    editNote(note, { runs: runsFromDOM(paper) });
    onInput(note);
  }

  paper.addEventListener("input", harvest);
  paper.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); close(true); return; }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); close(true); return; }
    if ((e.ctrlKey || e.metaKey) && "biu".includes(e.key.toLowerCase())) {
      e.preventDefault();
      dressSelection(DO[{ b: "bold", i: "italic", u: "underline" }[e.key.toLowerCase()]]);
      return;
    }
    e.stopPropagation(); // a page's own single-letter shortcuts are not for here
  });
  // paste as plain text: a note is not a place for someone else's markup
  paper.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !inPaper()) return;
    const r = sel.getRangeAt(0);
    r.deleteContents();
    const node = document.createTextNode(text);
    r.insertNode(node);
    r.setStartAfter(node);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
    harvest();
  });

  /* ── opening, dressing and closing ──────────────────────────────────────── */

  function dress() {
    if (!note) return;
    paper.style.background = PAPERS[note.paper].hex;
    swatch("paper").style.background = PAPERS[note.paper].hex;
  }

  function open(thing) {
    if (!thing) return;
    if (note && note !== thing) close(true);
    note = thing;
    root.hidden = false;
    closePick();
    paper.replaceChildren(runsToNodes(note.runs));
    swatch("ink").style.background = note.runs?.[0]?.ink || INKS[0].hex;
    swatch("mark").style.background = note.runs?.[0]?.mark || "transparent";
    dress();
    paper.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(paper);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    readBack();
  }

  function close(commit = true) {
    if (!note) return;
    const was = note;
    if (commit) editNote(was, { runs: runsFromDOM(paper) });
    note = null;
    root.hidden = true;
    closePick();
    onDone(was, { empty: !noteText(was).trim() });
  }

  /** The caller says where. Everything here is in stage pixels. */
  function place({ left, top, width, minHeight }) {
    root.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px) rotate(-2deg)`;
    if (width != null) root.style.width = Math.round(width) + "px";
    if (minHeight != null) paper.style.minHeight = Math.round(minHeight) + "px";
  }

  return {
    el: root,
    paperEl: paper,
    open,
    close,
    place,
    isOpen: () => !root.hidden,
    get note() { return note; },
    /** Is this event inside the editor? — for a host's own click-away rule. */
    owns: (target) => root.contains(target),
    destroy: () => {
      document.removeEventListener("selectionchange", readBack);
      root.remove();
    },
  };
}
