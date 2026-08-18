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

   The editing itself is `document.execCommand`. It is deprecated and it emits
   whatever markup it feels like, and it is still the only thing in a browser
   that will bold a selection spanning three elements correctly. We never read
   that markup back: `runsFromDOM` asks for the COMPUTED style of each piece of
   text, which is right whatever produced it.
   ========================================================================== */

import {
  PAPERS, INKS, MARKS, FONTS, SIZES,
  runsToHTML, runsFromDOM, editNote, noteText,
} from "./sticky-note.js";

const SIZE_TOKEN = "7"; // the legacy size we hijack, then rewrite to real px

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
      <button type="button" class="pp-note__key" data-do="smaller" title="Smaller writing"
              aria-label="Smaller writing"><span class="pp-note__a pp-note__a--sm">A</span></button>
      <button type="button" class="pp-note__key" data-do="bigger" title="Bigger writing"
              aria-label="Bigger writing"><span class="pp-note__a pp-note__a--lg">A</span></button>
      <i class="pp-note__sep"></i>
      <button type="button" class="pp-note__key pp-note__key--b" data-do="bold"
              title="Bold" aria-label="Bold">B</button>
      <button type="button" class="pp-note__key pp-note__key--i" data-do="italic"
              title="Slanted" aria-label="Slanted">I</button>
      <button type="button" class="pp-note__key pp-note__key--u" data-do="underline"
              title="Underlined" aria-label="Underlined">U</button>
      <button type="button" class="pp-note__key pp-note__key--font" data-do="font"
              title="Another face" aria-label="Another face">Aa</button>
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

  /** Run `fn` over whatever is highlighted, or over the lot if nothing is. */
  function onSelection(fn) {
    paper.focus();
    const sel = window.getSelection();
    const whole = !inPaper() || sel.isCollapsed;
    if (whole) selectAll();
    const at = saveSel();
    fn();
    if (whole) {
      // put the caret back at the end rather than leaving the note highlighted
      const range = document.createRange();
      range.selectNodeContents(paper);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      // the same words stay chosen, so a run of keys dresses ONE stretch of text
      restoreSel(at);
    }
    harvest();
  }

  const cmd = (name, value = null) => {
    try { document.execCommand(name, false, value); } catch { /* nothing to do */ }
  };

  /* ── the pens ───────────────────────────────────────────────────────────── */

  /**
   * Writing size, the one thing execCommand cannot express in pixels.
   *
   * The legacy `fontSize` command is used purely to MARK the selection — it is
   * the only way to wrap exactly the highlighted text, spans and all — and then
   * every mark it left is rewritten to the size we actually wanted.
   */
  function setSize(px) {
    cmd("styleWithCSS", "false");
    cmd("fontSize", SIZE_TOKEN);
    cmd("styleWithCSS", "true");
    root.querySelectorAll(`font[size="${SIZE_TOKEN}"]`).forEach((f) => {
      const span = document.createElement("span");
      span.style.fontSize = px + "px";
      while (f.firstChild) span.appendChild(f.firstChild);
      f.replaceWith(span);
    });
    // some engines honour styleWithCSS even here, so catch the CSS form too
    root.querySelectorAll('[style*="xxx-large"]').forEach((el) => {
      el.style.fontSize = px + "px";
    });
  }

  /** The size the highlighted text is now, so a step moves from where you are. */
  function sizeIndexNow() {
    const sel = window.getSelection();
    let el = sel && sel.rangeCount ? sel.getRangeAt(0).startContainer : paper;
    if (el && el.nodeType === Node.TEXT_NODE) el = el.parentElement;
    if (!el || !paper.contains(el)) el = paper;
    const px = parseFloat(getComputedStyle(el).fontSize) || SIZES[1];
    let best = 0;
    SIZES.forEach((s, i) => {
      if (Math.abs(s - px) < Math.abs(SIZES[best] - px)) best = i;
    });
    return best;
  }

  const DO = {
    bold: () => cmd("bold"),
    italic: () => cmd("italic"),
    underline: () => cmd("underline"),
    bigger: () => setSize(SIZES[Math.min(SIZES.length - 1, sizeIndexNow() + 1)]),
    smaller: () => setSize(SIZES[Math.max(0, sizeIndexNow() - 1)]),
    font: () => {
      const now = root.querySelector(".pp-note__key--font").dataset.font || FONTS[0].id;
      const next = FONTS[(FONTS.findIndex((f) => f.id === now) + 1) % FONTS.length];
      root.querySelector(".pp-note__key--font").dataset.font = next.id;
      root.querySelector(".pp-note__key--font").title = next.name;
      cmd("fontName", next.css);
    },
  };

  bar.addEventListener("pointerdown", (e) => e.preventDefault()); // keep the caret
  bar.addEventListener("click", (e) => {
    const key = e.target.closest("[data-do]");
    if (key) { closePick(); cmd("styleWithCSS", "true"); onSelection(DO[key.dataset.do]); return; }
    const picker = e.target.closest("[data-pick]");
    if (picker) openPick(picker.dataset.pick, picker);
  });

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
    cmd("styleWithCSS", "true");
    onSelection(() => {
      if (which === "ink") cmd("foreColor", hex);
      // clearing a highlight is setting it to nothing, which needs the literal
      else cmd("hiliteColor", hex || "transparent");
    });
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
      cmd("styleWithCSS", "true");
      onSelection(DO[{ b: "bold", i: "italic", u: "underline" }[e.key.toLowerCase()]]);
      return;
    }
    e.stopPropagation(); // a page's own single-letter shortcuts are not for here
  });
  // paste as plain text: a note is not a place for someone else's markup
  paper.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    cmd("insertText", text);
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
    paper.innerHTML = runsToHTML(note.runs);
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
    destroy: () => root.remove(),
  };
}
