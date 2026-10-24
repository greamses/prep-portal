/* ============================================================================
   SLOT TYPING — the cursor stays where the maths is being written
   ----------------------------------------------------------------------------
   Typing x^ in GeoGebra or Graspable Math puts the cursor INSIDE the power, and
   it stays there for as long as the exponent is being written — 2n + 1, not
   just 2 — until you press → to come back down. The same for the bottom of a
   fraction and for brackets. Here the maths is written as text (x^(2n+1),
   a/(b+c)), so the same thing is done with the brackets that the text needs
   anyway: typing the opening sign writes the closing one too and leaves the
   cursor between them. → steps out, the way it steps over any character.

     (        writes ( ) and waits between them   — unless a letter or number is
                                                    next, which means the
                                                    bracket is going in FRONT
                                                    of something already typed
     )        steps over a ) that is already there, instead of adding another
     ^        writes ^( ) with the cursor in the exponent
     /        writes /( ) with the cursor in the denominator — when something
              (a number, a letter, a bracket) stands to its left to be the top
     =        leaves every open slot first: x/2 = 5 is not x/(2 = 5)
     Backspace on an empty pair takes both away

   The decisions are made by `slotEdit` below, which knows nothing about the
   page: it is given the text and where the cursor is, and says what to do. The
   bindings after it apply that to a text box and to a contenteditable box.
   ========================================================================== */

const TOP = /[0-9A-Za-z.)%\]²³°']/;   // what a "/" can stand under
const WORDY = /[0-9A-Za-z.(]/;         // what a "(" must not be put in front of

/**
 * What typing `key` at this cursor should do, or null for "nothing special —
 * let the character go in as it is".
 *
 *   { insert: "x", back: n }   put `insert` at the selection, then move the
 *                              cursor back n characters
 *   { step: n }                just move the cursor forward n (over a ")" or a ",")
 *   { exit: true, insert: "=" } go to the end of the closing brackets, then insert
 *   { remove: [from, to] }     take this stretch of text away
 */
export function slotEdit(text, start, end, key) {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const selected = text.slice(start, end);
  const prev = before.slice(-1);
  const next = after.slice(0, 1);

  if (key === "(") {
    // Around what is selected: (x + 1)
    if (selected) return { insert: `(${selected})`, back: 0 };
    if (WORDY.test(next)) return null;
    return { insert: "()", back: 1 };
  }
  if (key === ")" || key === "]") {
    if (!selected && next === key) return { step: 1 };
    return null;
  }
  // In a matrix, "," is the key for "on to the next entry": over a comma the
  // template already holds, or across ],[ from the end of one row to the next.
  if (key === ",") {
    if (selected) return null;
    if (next === ",") return { step: 1 };
    if (after.startsWith("],[")) return { step: 3 };
    return null;
  }
  // [ ] work the same way — a matrix is [[1,2],[3,4]], typed without closing one.
  if (key === "[") {
    if (selected) return { insert: `[${selected}]`, back: 0 };
    if (WORDY.test(next)) return null;
    return { insert: "[]", back: 1 };
  }
  if (key === "^") {
    if (selected) return null;
    return { insert: "^()", back: 1 };
  }
  if (key === "/") {
    if (selected || !TOP.test(prev)) return null;
    // Something already written on the right makes this an edit, not new typing.
    if (WORDY.test(next)) return null;
    return { insert: "/()", back: 1 };
  }
  if (key === "=") {
    // Anything but closing brackets after the cursor: an ordinary =.
    if (!/^[)\]]+$/.test(after)) return null;
    return { exit: true, insert: "=" };
  }
  if (key === "Backspace") {
    if (selected) return null;
    /* Backspace must never leave a bracket without its partner: half a pair
       cannot be drawn, so the typeset equation would be thrown away for raw
       text. So — over an opening bracket, the pair goes and what was inside it
       stays; over a closing one, the cursor steps inside (so what is in there
       can be taken away first) instead of deleting the bracket. */
    if (prev === "(" || prev === "[") {
      const close = next === (prev === "(" ? ")" : "]") ? start : closeOf(text, start - 1);
      if (close > start - 1 && close !== start) {
        const lead = before.slice(-2, -1);
        const from = start - 1;
        return { replace: [from, close + 1, text.slice(start, close)], caret: from };
      }
    }
    if ((prev === ")" || prev === "]") && openOf(text, start - 1) >= 0 && !(next === prev && false)) {
      // an empty pair, ( | ), is taken whole just below
      const open = openOf(text, start - 1);
      if (open !== start - 2) return { step: -1 };
    }
    // ( | )  — an empty pair, together
    if ((prev === "(" && next === ")") || (prev === "[" && next === "]")) {
      // the ^ or / the pair belonged to goes with it: x^( | ) is just x
      const lead = before.slice(-2, -1);
      return { remove: [start - (lead === "^" || lead === "/" ? 2 : 1), start + 1] };
    }
    return null;
  }
  return null;
}

/* ── moving between the entries of a matrix ─────────────────────────────────
   A matrix written as text, [[1,2],[3,4]], is a grid to whoever is typing it:
   → goes to the next entry (and, from the end of a row, to the start of the
   next), ← to the one before, ↑ and ↓ to the entry above and below. An entry
   that is still a ? is selected whole, so typing replaces it; one already filled
   gets the cursor at its end. Inside an entry the arrows move a character, as
   they always do — they only change entry from the end of one (→) or the start
   of one (←). */
function closeOf(text, i) {
  const open = text[i], shut = open === "[" ? "]" : open === "(" ? ")" : "}";
  let depth = 0;
  for (let k = i; k < text.length; k++) {
    if (text[k] === open) depth++;
    else if (text[k] === shut && --depth === 0) return k;
  }
  return -1;
}

/** The index of the opening bracket that the closer at `i` shuts, or -1. */
function openOf(text, i) {
  const shut = text[i], open = shut === "]" ? "[" : shut === ")" ? "(" : "{";
  let depth = 0;
  for (let k = i; k >= 0; k--) {
    if (text[k] === shut) depth++;
    else if (text[k] === open && --depth === 0) return k;
  }
  return -1;
}

/** Every matrix in the text, with the [from, to) of each entry. */
export function matrixCells(text) {
  const out = [];
  for (let i = 0; i < text.length - 1; i++) {
    if (text[i] !== "[" || text[i + 1] !== "[") continue;
    const end = closeOf(text, i);
    if (end < 0) continue;
    const rows = [];
    let k = i + 1;
    while (k < end && text[k] === "[") {
      const rowEnd = closeOf(text, k);
      if (rowEnd < 0 || rowEnd > end) break;
      const cells = [];
      let from = k + 1, depth = 0;
      for (let q = k + 1; q <= rowEnd; q++) {
        const ch = text[q];
        if ("([{".includes(ch)) depth++;
        else if (")]}".includes(ch) && q < rowEnd) depth--;
        if ((ch === "," && depth === 0) || q === rowEnd) { cells.push({ from, to: q }); from = q + 1; }
      }
      rows.push(cells);
      k = rowEnd + 1;
      if (text[k] === ",") k++;
    }
    if (rows.length) out.push({ from: i, to: end, rows });
    i = end;
  }
  return out;
}

/**
 * Where an arrow takes the selection [a, b], or null when it is not a move
 * between entries (the arrow then does what it ordinarily does).
 * `dir` is "left", "right", "up" or "down".
 */
export function cellMove(text, a, b, dir) {
  for (const m of matrixCells(text)) {
    if (a < m.from || b > m.to) continue;
    let r = -1, c = -1;
    m.rows.forEach((row, i) => row.forEach((cell, j) => { if (a >= cell.from && b <= cell.to) { r = i; c = j; } }));
    if (r < 0) continue;
    const cell = m.rows[r][c];
    let target = null;
    if (dir === "right" && b === cell.to) target = m.rows[r][c + 1] || (m.rows[r + 1] && m.rows[r + 1][0]);
    else if (dir === "left" && a === cell.from) target = m.rows[r][c - 1] || (m.rows[r - 1] && m.rows[r - 1][m.rows[r - 1].length - 1]);
    else if (dir === "down") target = m.rows[r + 1] && m.rows[r + 1][c];
    else if (dir === "up") target = m.rows[r - 1] && m.rows[r - 1][c];
    if (!target) return null;
    const content = text.slice(target.from, target.to);
    // a ? is selected whole, so that typing replaces it
    return content.trim() === "?" ? { a: target.from, b: target.to } : { a: target.to, b: target.to };
  }
  return null;
}

/** [[?,?],[?,?]] — a matrix of the size asked for, every entry still to fill. */
export const matrixTemplate = (rows, cols) =>
  "[" + Array.from({ length: rows }, () => "[" + Array(cols).fill("?").join(",") + "]").join(",") + "]";

/* ── a text box (<input> or <textarea>) ──────────────────────────────────── */

/**
 * Make a text box type like this. Works on beforeinput, so it behaves on a
 * phone's keyboard as well as a laptop's, and on pasted text not at all (a
 * paste is taken as it comes).
 */
export function slotTypingForInput(input, { onChange = () => {} } = {}) {
  const apply = (edit) => {
    const a = input.selectionStart ?? input.value.length;
    const b = input.selectionEnd ?? a;
    let value = input.value;
    let at;
    if (edit.step) {
      at = Math.max(0, a + edit.step);
    } else if (edit.replace) {
      const [from, to, inner] = edit.replace;
      value = value.slice(0, from) + inner + value.slice(to);
      at = edit.caret ?? from;
    } else if (edit.remove) {
      value = value.slice(0, edit.remove[0]) + value.slice(edit.remove[1]);
      at = edit.remove[0];
    } else if (edit.exit) {
      value = value + edit.insert;
      at = value.length;
    } else {
      value = value.slice(0, a) + edit.insert + value.slice(b);
      at = a + edit.insert.length - (edit.back || 0);
    }
    input.value = value;
    input.setSelectionRange(at, at);
    onChange();
  };
  input.addEventListener("beforeinput", (e) => {
    if (e.isComposing) return;
    const a = input.selectionStart ?? 0;
    const b = input.selectionEnd ?? a;
    let key = null;
    if (e.inputType === "insertText" && e.data && e.data.length === 1) key = e.data;
    else if (e.inputType === "deleteContentBackward") key = "Backspace";
    if (!key) return;
    const edit = slotEdit(input.value, a, b, key);
    if (!edit) return;
    e.preventDefault();
    apply(edit);
  });
  return { apply };
}

/* ── a contenteditable box (the equation in a sticky note) ───────────────── */

/**
 * `owns(node)` says whether the selection is in the box being typed in — the
 * paper holds many things and only the open equation is typed this way.
 * Edits go through execCommand so the browser's own undo still works.
 */
/** Select the text between two offsets of a box. */
function selectOffsets(box, from, to, sel) {
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  let pos = 0, a = null, b = null;
  while (walker.nextNode()) {
    const n = walker.currentNode, len = n.nodeValue.length;
    if (!a && from <= pos + len) a = [n, from - pos];
    if (!b && to <= pos + len) { b = [n, to - pos]; break; }
    pos += len;
  }
  if (!a || !b) return;
  const r = document.createRange();
  r.setStart(a[0], a[1]);
  r.setEnd(b[0], b[1]);
  sel.removeAllRanges();
  sel.addRange(r);
}

export function slotTypingForEditable(paper, { box, onChange = () => {} } = {}) {
  const textOf = (b) => b.textContent.replace(/​/g, "");
  const offsets = (b, sel) => {
    const r = sel.getRangeAt(0);
    const pre = document.createRange();
    pre.selectNodeContents(b);
    pre.setEnd(r.startContainer, r.startOffset);
    const a = pre.toString().replace(/​/g, "").length;
    return [a, a + r.toString().replace(/​/g, "").length];
  };
  const move = (sel, n) => { for (let i = 0; i < Math.abs(n); i++) sel.modify("move", n < 0 ? "backward" : "forward", "character"); };

  paper.addEventListener("beforeinput", (e) => {
    if (e.isComposing) return;
    const b = box();
    const sel = window.getSelection();
    if (!b || !sel.rangeCount || !b.contains(sel.anchorNode)) return;
    let key = null;
    if (e.inputType === "insertText" && e.data && e.data.length === 1) key = e.data;
    else if (e.inputType === "deleteContentBackward") key = "Backspace";
    if (!key) return;
    const [start, end] = offsets(b, sel);
    const edit = slotEdit(textOf(b), start, end, key);
    if (!edit) return;
    e.preventDefault();
    if (edit.step) move(sel, edit.step);
    else if (edit.replace) {
      const [from, to, inner] = edit.replace;
      selectOffsets(b, from, to, sel);
      if (inner) document.execCommand("insertText", false, inner); else document.execCommand("delete");
      move(sel, -((inner || "").length - ((edit.caret ?? from) - from)));
    } else if (edit.remove) {
      // Select the stretch and delete it as one edit.
      const len = edit.remove[1] - edit.remove[0];
      move(sel, edit.remove[1] - start);
      for (let i = 0; i < len; i++) document.execCommand("delete");
    } else if (edit.exit) {
      const r = document.createRange();
      r.selectNodeContents(b);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
      document.execCommand("insertText", false, edit.insert);
    } else {
      document.execCommand("insertText", false, edit.insert);
      move(sel, -(edit.back || 0));
    }
    onChange();
  });
}
