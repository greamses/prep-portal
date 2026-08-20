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

   ── an equation is typed the way a word processor types one ───────────────
   ALT + = opens an equation where the caret is — the same key a word processor
   has used for this for twenty years — and so does the x² key on the bar. What
   you type into it is LINEAR MATHEMATICS: `1/2`, `x^(2n+1)`, `sqrt(b^2-4ac)`,
   said the way it would be said out loud. It is translated to TeX and SET the
   moment you leave it — Enter, Tab, Escape, or a press anywhere else on the
   paper — and what you typed is kept beside the TeX, so a press on a set
   equation opens it again with YOUR OWN WRITING back rather than the
   \frac{}{} it was turned into. Nothing has to be deleted and retyped to be
   corrected. Raw TeX still goes in untouched, for anyone who prefers it.

   The `?` key beside it opens the card of signs: every shape and symbol that
   can be typed, each SET by the same typesetter from the same translation, so
   the card cannot describe something the parser does not do. Pressing a row
   types its source into the equation.

   Set, it is one element that cannot be typed into, so the caret steps over it
   and backspace takes the whole of it — an equation is one thing, and half an
   equation is not a smaller equation.
   ========================================================================== */

import {
  PAPERS, INKS, MARKS, FONTS, SIZES, DEFAULT_SIZE,
  runsToNodes, runsFromDOM, editNote, noteText, snapSize,
  restyle, toggleOver, runsOver,
} from "./sticky-note.js";
import { mathNode } from "./sticky-math.js";
import { toTeX, SIGNS } from "./math-linear.js";

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
      <button type="button" class="pp-note__key pp-note__key--eq" data-do="math"
              title="Equation (Alt + =)" aria-label="Write an equation">x²</button>
      <button type="button" class="pp-note__key pp-note__key--signs" data-do="signs"
              title="Every sign you can type" aria-label="Every sign you can type"
              aria-haspopup="true" aria-expanded="false">?</button>
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
    <div class="pp-note__signs" hidden role="dialog"
         aria-label="Every sign you can type in an equation"></div>
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

  /* What counts as a character, and it must be EXACTLY what `runsFromDOM`
     counts: the words, one for every line break, and an equation as the whole
     of its source. The two are the same ruler read from either end — the model
     counts the runs, this counts the paper — and a pen dresses the wrong words
     the moment they disagree. */
  function walkerOver(root) {
    return document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode(n) {
        if (n.nodeType === Node.ELEMENT_NODE && n.hasAttribute?.("data-tex")) {
          return NodeFilter.FILTER_ACCEPT;
        }
        const el = n.nodeType === Node.ELEMENT_NODE ? n : n.parentElement;
        if (el && el.closest && el.closest("[data-tex]")) return NodeFilter.FILTER_REJECT;
        if (n.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
        return n.tagName === "BR" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
  }

  const lenOf = (node) =>
    node.nodeType === Node.TEXT_NODE ? node.nodeValue.length
      : node.hasAttribute?.("data-tex") ? (node.getAttribute("data-tex") || "").length
      : 1; // a line break is one character, the way the model holds it

  function charsIn(root) {
    const walk = walkerOver(root);
    let n = 0;
    let node = walk.nextNode();
    while (node) { n += lenOf(node); node = walk.nextNode(); }
    return n;
  }

  /**
   * Where a point in the paper is, in characters from the start of the note.
   *
   * Measured by counting everything BEFORE it rather than by walking to it: a
   * selection may be anchored to an element and an index of its children, which
   * a walk over text nodes cannot find at all.
   */
  function offsetOf(container, offset) {
    const r = document.createRange();
    r.setStart(paper, 0);
    try { r.setEnd(container, offset); } catch { return charsIn(paper); }
    return charsIn(r.cloneContents());
  }

  function saveSel() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !inPaper()) return null;
    const r = sel.getRangeAt(0);
    return { a: offsetOf(r.startContainer, r.startOffset), b: offsetOf(r.endContainer, r.endOffset) };
  }

  function restoreSel(at) {
    if (!at) return;
    const walk = walkerOver(paper);
    const range = document.createRange();
    let n = 0;
    let node = walk.nextNode();
    let started = false;
    while (node) {
      const len = lenOf(node);
      const text = node.nodeType === Node.TEXT_NODE;
      if (!started && at.a <= n + len) {
        /* An equation and a line break are not typed into, so an offset that
           lands anywhere inside one goes to the near side or the far side of
           it — there is no "half way through" an equation to point at. */
        if (text) range.setStart(node, Math.max(0, at.a - n));
        else if (at.a <= n) range.setStartBefore(node);
        else range.setStartAfter(node);
        started = true;
      }
      if (started && at.b <= n + len) {
        if (text) range.setEnd(node, Math.max(0, at.b - n));
        else if (at.b <= n) range.setEndBefore(node);
        else range.setEndAfter(node);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      n += len;
      node = walk.nextNode();
    }
    // past the end of everything: the caret belongs at the end
    range.selectNodeContents(paper);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
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

  /* ── equations ──────────────────────────────────────────────────────────── */

  /** The equation being typed, if one is open. */
  const openEq = () => paper.querySelector("[data-eq]");

  /** Put the caret inside an element (at its end). */
  function caretIn(el, atEnd = true) {
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(!atEnd);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }

  function caretAfter(node) {
    const r = document.createRange();
    r.setStartAfter(node);
    r.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }

  /**
   * Open an equation where the caret is.
   *
   * Anything highlighted becomes its source, so selecting `x^2 + 1` and
   * pressing the key turns those words into that equation — which is the other
   * way people expect this to work, and costs nothing to allow.
   */
  function insertEquation(tex = "") {
    setEquation(); // one at a time
    paper.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !inPaper()) {
      const r = document.createRange();
      r.selectNodeContents(paper);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    const r = window.getSelection().getRangeAt(0);
    const picked = String(r.toString() || "").trim();
    r.deleteContents();

    const box = document.createElement("span");
    box.className = "pp-note__eqbox";
    box.setAttribute("data-eq", "1");
    box.setAttribute("spellcheck", "false");
    box.textContent = tex || picked;
    r.insertNode(box);
    caretIn(box);
    harvest();
  }

  /**
   * Set whatever equation is open — the moment you leave it, as a word
   * processor does. An empty one was never an equation and simply goes.
   *
   * What was typed is TRANSLATED on the way in (see math-linear.js), so `1/2`
   * becomes a fraction and `x^(2n+1)` an index of more than one character —
   * and it is kept beside the TeX, so opening the equation again gives back
   * the learner's own writing rather than the \frac{}{} we made of it.
   */
  function setEquation() {
    const box = openEq();
    if (!box) return false;
    const typed = box.textContent.trim();
    if (!typed) { box.remove(); harvest(); return true; }
    const eq = mathNode(toTeX(typed), document, typed);
    box.replaceWith(eq);
    caretAfter(eq);
    harvest();
    return true;
  }

  /** Open a set equation again, with what was typed back, to be corrected. */
  function editEquation(el) {
    setEquation();
    const box = document.createElement("span");
    box.className = "pp-note__eqbox";
    box.setAttribute("data-eq", "1");
    box.setAttribute("spellcheck", "false");
    box.textContent = el.getAttribute("data-src") || el.getAttribute("data-tex") || "";
    el.replaceWith(box);
    caretIn(box);
    harvest();
  }

  /* A press on a set equation opens it; a press anywhere else on the paper
     closes whichever one was open. Caught on the way down, so the caret lands
     where the press was rather than inside the equation that just closed. */
  paper.addEventListener("pointerdown", (e) => {
    const eq = e.target.closest?.("[data-tex]");
    if (eq && paper.contains(eq)) { e.preventDefault(); editEquation(eq); return; }
    if (!e.target.closest?.("[data-eq]")) setEquation();
  });

  /* A press on the bar must not take the caret out of the paper — except on a
     dropdown, which cannot open at all if its own pointerdown is cancelled. */
  bar.addEventListener("pointerdown", (e) => {
    if (e.target.closest("select")) { held = saveSel(); return; }
    e.preventDefault();
  });
  bar.addEventListener("click", (e) => {
    const key = e.target.closest("[data-do]");
    if (key && key.dataset.do === "signs") { closePick(); toggleSigns(); return; }
    if (key && key.dataset.do === "math") { closePick(); closeSigns(); insertEquation(); return; }
    if (key) { closePick(); dressSelection(DO[key.dataset.do]); return; }
    const picker = e.target.closest("[data-pick]");
    if (picker) { closeSigns(); openPick(picker.dataset.pick, picker); }
  });

  /* ── the card of signs ──────────────────────────────────────────────────── */

  /* What may be typed into an equation, shown as the thing it produces rather
     than described — every row is SET by the same typesetter that will set it
     on the note, from the same translation, so the card cannot drift out of
     step with what the parser actually does. Pressing a row types it for you,
     which is what makes it a palette and not only a list. */
  const signsEl = root.querySelector(".pp-note__signs");
  const signsKey = root.querySelector("[data-do='signs']");
  let signsBuilt = false;

  function buildSigns() {
    if (signsBuilt) return;
    signsBuilt = true;
    for (const group of SIGNS) {
      const box = document.createElement("div");
      box.className = "pp-note__signset";
      const head = document.createElement("p");
      head.className = "pp-note__signhead";
      head.innerHTML = `<b>${group.name}</b><span>${group.hint}</span>`;
      box.appendChild(head);

      const list = document.createElement("div");
      list.className = "pp-note__signrows";
      for (const item of group.items) {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "pp-note__sign";
        row.dataset.type = item.type;
        row.title = item.says ? `${item.says} — type ${item.type}` : `Type ${item.type}`;

        const typed = document.createElement("code");
        typed.textContent = item.type;
        const shows = mathNode(toTeX(item.type));
        shows.removeAttribute("title");
        shows.classList.add("pp-note__signeq");

        row.append(typed, shows);
        list.appendChild(row);
      }
      box.appendChild(list);
      signsEl.appendChild(box);
    }
  }

  /* A press inside the card must not put the caret down: the equation being
     written is the whole reason the card is open. */
  signsEl.addEventListener("pointerdown", (e) => e.preventDefault());
  signsEl.addEventListener("click", (e) => {
    const row = e.target.closest("[data-type]");
    if (!row) return;
    typeIntoEquation(row.dataset.type);
  });

  /**
   * Put a sign into the equation being written — opening one first if none is.
   *
   * Typed as the SOURCE, not as the answer: what lands in the box is `1/2`,
   * the same thing the learner would have typed, so it can be edited, built on
   * and learnt from. A palette that pasted \frac{1}{2} would teach nothing.
   */
  function typeIntoEquation(text) {
    if (!openEq()) insertEquation();
    const box = openEq();
    if (!box) return;
    paper.focus();
    const sel = window.getSelection();
    let r = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    if (!r || !box.contains(r.commonAncestorContainer)) { caretIn(box); r = sel.getRangeAt(0); }
    r.deleteContents();
    const node = document.createTextNode(text);
    r.insertNode(node);
    caretAfter(node);
    harvest();
  }

  function closeSigns() {
    signsEl.hidden = true;
    signsKey.setAttribute("aria-expanded", "false");
  }

  function toggleSigns() {
    if (!signsEl.hidden) { closeSigns(); return; }
    buildSigns();
    signsEl.hidden = false;
    signsKey.setAttribute("aria-expanded", "true");
  }

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
    /* ALT + = opens an equation — the key a word processor has used for this
       since before any of these learners were born. */
    if (e.altKey && (e.key === "=" || e.key === "+")) {
      e.preventDefault();
      insertEquation();
      return;
    }
    /* Inside one, the keys that mean "done" set it and stay on the note. Escape
       especially: it must not close a note you were only halfway through
       writing an equation on. */
    if (openEq() && ["Enter", "Tab", "Escape"].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      setEquation();
      return;
    }
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
    closeSigns();
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
    setEquation(); // an equation left open is still an equation
    const was = note;
    if (commit) editNote(was, { runs: runsFromDOM(paper) });
    note = null;
    root.hidden = true;
    closePick();
    closeSigns();
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
