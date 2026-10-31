/* ============================================================================
   An answer field that can hold an equation
   ----------------------------------------------------------------------------
   Every answer on the paper (a blank, a short answer, a page of the booklet) is one of these: a field you type
   words into, that behaves like an <input> or a <textarea> to the rest of the page (.value, .disabled, "input"
   events) but is drawn as writing, so an equation can sit in the middle of the words.

   Equations are written EXACTLY as in the sticky notes (utils/components/sticky-note-editor.js):

     Alt + =   opens an equation where the caret is, a framed box that says "Type equation here."
               type it the way you would say it: 1/2, x^2, sqrt(x), 3x+2=11
               it is shown SET just under the box as you type
     Enter     puts it in, at once, as a typeset equation in the line of words
     Esc       closes the box and leaves the answer alone
     double-click on an equation, to open it again with your own writing back

   Underneath, the answer is still plain text with the equation between dollar signs ($\frac{1}{2}$), so it is kept,
   sent, marked and printed as text everywhere else.
   ========================================================================== */

import { toTeX } from "/utils/components/math-linear.js";
import { mathNode, mathReady, preloadMath, whenMathDrawn } from "/utils/components/sticky-math.js";

const CSS = `
.xp-rich { white-space: pre-wrap; overflow-wrap: anywhere; cursor: text; }
.xp-rich.is-off { cursor: default; }
.xp-rich .pp-note__eq { display: inline-block; vertical-align: middle; padding: 0 0.6mm; border-radius: 0; cursor: default; user-select: all; }
.xp-rich .pp-note__eq:hover { background: color-mix(in srgb, var(--c, #6fb7e8) 18%, transparent); }
.xp-rich .pp-note__eq svg { display: inline-block; vertical-align: middle; }
.xp-rich .pp-note__eqbox { display: inline-block; min-width: 1.4em; min-height: 1.15em; padding: 0 0.45em; line-height: 1.25; vertical-align: baseline; border: 1px solid rgba(20, 80, 140, 0.55); background: rgba(238, 244, 251, 0.92); border-radius: 0; font: 600 0.94em/1.25 var(--font-mono, "JetBrains Mono", monospace); white-space: pre-wrap; outline: none; }
.xp-rich .pp-note__eqbox:empty::before { content: attr(data-placeholder); color: rgba(20, 80, 140, 0.6); font-family: "STIX Two Text", "Cambria Math", Georgia, serif; font-style: italic; pointer-events: none; }
.xp-eqlive { position: fixed; z-index: 2147482000; max-width: min(26rem, 92vw); padding: 0.3rem 0.6rem; background: var(--surface-primary, #fffdf8); border: 1px solid rgba(20, 80, 140, 0.45); border-radius: 0; box-shadow: 0 6px 18px rgba(20, 19, 15, 0.2); color: #14130f; font-size: 1.05rem; pointer-events: none; white-space: nowrap; }
.xp-eqlive[hidden] { display: none; }
.xp-eqlive .pp-note__eq { display: inline-block; }
.xp-eqwait { font: italic 0.8rem Georgia, serif; opacity: 0.7; }
@media print { .xp-eqlive { display: none !important; } .xp-rich .pp-note__eq:hover { background: none; } }`;

const ZW = /​/g;
const EQ = "[data-tex]";
const BOX = "[data-eq]";

/** The field's answer as text: words as they are, each equation between dollar signs. */
function toText(root) {
  let out = "";
  const walk = (node) => {
    for (const n of node.childNodes) {
      if (n.nodeType === 3) out += n.nodeValue;
      else if (n.nodeType === 1) {
        if (n.matches(EQ)) out += `$${n.getAttribute("data-tex")}$`;
        else if (n.matches(BOX)) continue;                 // an equation still being typed is not part of the answer yet
        else if (n.tagName === "BR") out += "\n";
        else { if (out && !out.endsWith("\n") && /^(DIV|P)$/.test(n.tagName)) out += "\n"; walk(n); }
      }
    }
  };
  walk(root);
  return out.replace(ZW, "");
}

/** Text back into nodes: its words, and each $…$ as a typeset equation. */
function fill(root, text) {
  root.replaceChildren();
  String(text == null ? "" : text).split(/(\$[^$]+\$)/).forEach((part) => {
    if (!part) return;
    if (part.length > 2 && part[0] === "$" && part.endsWith("$")) {
      const eq = mathNode(part.slice(1, -1));
      eq.removeAttribute("title");
      root.appendChild(eq);
    } else root.appendChild(document.createTextNode(part));
  });
}

let live = null;   // the one floating preview of the equation being typed

function preview(box) {
  if (!live) { live = document.createElement("div"); live.className = "xp-eqlive"; live.hidden = true; live.setAttribute("aria-hidden", "true"); document.body.appendChild(live); }
  const typed = box ? box.textContent.trim() : "";
  if (!box || !typed) { live.hidden = true; live.replaceChildren(); return; }
  let shown = null;
  try { shown = mathNode(toTeX(typed), document, typed); } catch { shown = null; }
  if (!shown) { live.hidden = true; return; }
  shown.removeAttribute("title");
  if (shown.classList.contains("is-source") && !mathReady()) {
    const wait = document.createElement("span");
    wait.className = "xp-eqwait";
    wait.textContent = "Setting the maths…";
    live.replaceChildren(wait);
    whenMathDrawn(() => { if (box.isConnected) preview(box); });
  } else live.replaceChildren(shown);
  live.hidden = false;
  const r = box.getBoundingClientRect(), h = live.offsetHeight, w = live.offsetWidth;
  live.style.left = `${Math.max(6, Math.min(r.left, innerWidth - w - 6))}px`;
  const below = r.bottom + 6;
  live.style.top = `${below + h > innerHeight - 6 ? Math.max(6, r.top - h - 6) : below}px`;
}

/**
 * A new answer field.
 *   multiline  a page to write on (several lines), or a one-line blank
 * → an element that quacks like an input: .value, .disabled, .rows, focus(), and bubbling "input" events.
 */
export function richField({ multiline = false, className = "" } = {}) {
  if (!document.getElementById("xp-rich-css")) document.head.appendChild(Object.assign(document.createElement("style"), { id: "xp-rich-css", textContent: CSS }));
  preloadMath();
  const el = document.createElement("div");
  el.className = `xp-rich ${className}`.trim();
  el.setAttribute("contenteditable", "true");
  el.setAttribute("role", "textbox");
  el.setAttribute("aria-multiline", String(multiline));
  el.setAttribute("spellcheck", multiline ? "true" : "false");
  el.dataset.multiline = multiline ? "1" : "";
  if (!multiline) el.style.display = "inline-block";

  Object.defineProperties(el, {
    value: { get() { return toText(el); }, set(v) { fill(el, v); }, configurable: true },
    disabled: {
      get() { return el.getAttribute("contenteditable") === "false"; },
      set(v) { el.setAttribute("contenteditable", v ? "false" : "true"); el.classList.toggle("is-off", !!v); },
      configurable: true,
    },
    rows: { set(n) { el.style.minHeight = `${Math.max(1, n) * 7.5}mm`; }, configurable: true },
  });

  const changed = () => el.dispatchEvent(new Event("input", { bubbles: true }));
  const openBox = () => el.querySelector(BOX);

  const caretIn = (node) => { const r = document.createRange(); r.selectNodeContents(node); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
  const caretAfter = (node) => {
    // a place for the caret to stand after a thing that is not text
    let next = node.nextSibling;
    if (!next || next.nodeType !== 3) { next = document.createTextNode("​"); node.after(next); }
    const r = document.createRange(); r.setStart(next, next.nodeValue.length > 0 && next.nodeValue[0] === "​" ? 1 : 0); r.collapse(true);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  };

  /** Put the typed equation in, as a set equation, at once. An empty one was never an equation and goes. */
  function setEquation(refocus = true) {
    const box = openBox();
    if (!box) return false;
    const typed = box.textContent.trim();
    preview(null);
    if (!typed) { box.remove(); changed(); return true; }
    let eq;
    try { eq = mathNode(toTeX(typed), document, typed); } catch { eq = null; }
    if (!eq) { box.remove(); changed(); return true; }
    eq.removeAttribute("title");
    box.replaceWith(eq);
    if (refocus) { el.focus(); caretAfter(eq); }
    changed();
    if (eq.classList.contains("is-source")) whenMathDrawn(() => { if (el.isConnected) changed(); });
    return true;
  }

  /** Open an equation where the caret is. Words that are highlighted become its source. */
  function insertEquation(srcText = "") {
    setEquation(false);
    const box = document.createElement("span");
    box.className = "pp-note__eqbox";
    box.setAttribute("data-eq", "1");
    box.setAttribute("data-placeholder", "Type equation here.");
    box.setAttribute("spellcheck", "false");
    const sel = getSelection();
    let range = sel.rangeCount ? sel.getRangeAt(0) : null;
    if (!range || !el.contains(range.commonAncestorContainer)) { range = document.createRange(); range.selectNodeContents(el); range.collapse(false); }
    if (!srcText && !range.collapsed) { srcText = range.toString(); range.deleteContents(); }
    box.textContent = srcText;
    range.insertNode(box);
    caretIn(box);
    preview(box);
  }

  function editEquation(eq) {
    setEquation(false);
    const box = document.createElement("span");
    box.className = "pp-note__eqbox";
    box.setAttribute("data-eq", "1");
    box.setAttribute("data-placeholder", "Type equation here.");
    box.setAttribute("spellcheck", "false");
    box.textContent = eq.getAttribute("data-src") || eq.getAttribute("data-tex") || "";
    eq.replaceWith(box);
    el.focus();
    caretIn(box);
    preview(box);
  }

  const altEq = (e) => e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "=" || e.key === "+" || e.code === "Equal");

  el.addEventListener("keydown", (e) => {
    if (el.disabled) return;
    /* the key goes to the editing host, not to the box inside it: where the caret is says whether it is in the box */
    const box = openBox(), at = getSelection().anchorNode;
    const inBox = !!box && !!at && box.contains(at);
    if (altEq(e)) { e.preventDefault(); e.stopPropagation(); if (openBox()) setEquation(); else insertEquation(); return; }
    if (inBox) {
      if ((e.key === "a" || e.key === "A") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); caretIn(box); const r = document.createRange(); r.selectNodeContents(box); const s = getSelection(); s.removeAllRanges(); s.addRange(r); e.stopPropagation(); return; }
      if (e.key === "Enter") { e.preventDefault(); setEquation(); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); const b = openBox(); preview(null); if (b) { b.remove(); el.focus(); changed(); } }
      e.stopPropagation();     // the paper's own keys are not for here
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (multiline) document.execCommand("insertLineBreak");
    }
  });

  el.addEventListener("input", (e) => { const b = openBox(); if (b) preview(b); });
  // a plain paste: no styles, no pictures
  el.addEventListener("paste", (e) => {
    e.preventDefault();
    const t = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, multiline ? t : t.replace(/\s*\n\s*/g, " "));
  });
  // the same press that sets an equation down a word processor's way: leaving the box sets it
  el.addEventListener("pointerdown", (e) => { if (openBox() && !(e.target.closest && e.target.closest(BOX))) setEquation(false); });
  el.addEventListener("focusout", () => { setTimeout(() => { if (openBox() && !el.contains(document.activeElement)) setEquation(false); }, 0); });
  el.addEventListener("dblclick", (e) => {
    if (el.disabled) return;
    const eq = e.target.closest && e.target.closest(EQ);
    if (eq && el.contains(eq)) { e.preventDefault(); editEquation(eq); }
  });

  return el;
}

export const isRich = (n) => !!n && n.classList && n.classList.contains("xp-rich");
