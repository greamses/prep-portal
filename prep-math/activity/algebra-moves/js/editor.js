/* ═══════════════════════════════════════════════════════════════════════════
   THE EQUATION EDITOR

   What is typed on the keypad is not a line of text with brackets in it. It is
   a set of BOXES, the way GeoGebra and Desmos hold it: a fraction is a
   numerator box over a denominator box; a power is a small box raised after its
   base; a number base has a box for the digits and a box for the base; a mixed
   number has three. The caret lives in one box at a time, → and ← go through
   them in reading order, and Backspace takes apart what it is standing in.

   Nothing here is ever shown. What the page draws is the equation this
   describes, through the same parser and layout as everything else — so what is
   on the screen is always typeset mathematics, never half a piece of syntax.
   `serialize()` is the bridge: it writes the boxes out as the line the parser
   reads (an empty box becomes ?, which the parser draws as an empty box), and
   hands back where the caret is in that line so the drawing can put it there.

   Pure: no document, no page. Tested in node.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── The model ────────────────────────────────────────────────────────────
   A BLOCK is a row of items. An ITEM is one character, or a TEMPLATE: a shape
   with boxes of its own (each a block). Every template knows the block it is
   in (`parent`) and every block knows the template that owns it (`owner`), so
   the caret can walk out of a box as easily as into one. */

const block = (owner = null) => ({ items: [], owner });
const chr = (c) => ({ t: "c", c });

/** How many boxes each kind of template has. */
const COUNT = {
  frac: 2, pow: 1, sqrt: 1, br: 1, fn: 1, base: 2, mixed: 3, choose: 2, logb: 2, nroot: 2, tet: 2,
  sigma: 4, list: 1, deriv: 1, int: 3, int0: 1, lim: 2,
};

function make(kind, o = {}) {
  const n = kind === "mat" ? o.rows * o.cols : COUNT[kind];
  const it = { t: "tpl", kind, blocks: [], parent: null };
  if (kind === "fn") it.name = o.name;
  if (kind === "choose") it.perm = !!o.perm;
  if (kind === "mat") { it.rows = o.rows; it.cols = o.cols; }
  for (let k = 0; k < n; k++) it.blocks.push(block(it));
  return it;
}

const adopt = (items, blk) => { for (const it of items) if (it.t === "tpl") it.parent = blk; };
const fillChars = (blk, s) => { for (const c of s) blk.items.push(chr(c)); };
const blockText = (blk) => blk.items.map((it) => (it.t === "c" ? it.c : "\u0000")).join("");

/** A box counts as empty when it holds nothing, or only what the key put there. */
const blank = (it) => it.blocks.every((b, k) => {
  const own = blockText(b);
  return own === "" || own === (it.def?.[k] ?? "");
});

/* characters that stand between terms: a power or a slash does not reach past them */
const OPERATOR = /[+\-*/=,(<>×÷·±\s]/;
/* characters a fraction takes upstairs with it, going back from where it is made */
const OPERAND = /[0-9A-Za-z.°%!Ͱ-Ͽ]/;
const ALNUM = /[0-9A-Za-z]/;

/* ── What is allowed in ─────────────────────────────────────────────────────
   Anything typed or pasted is cleaned first: the look-alike signs a word
   processor or a phone brings (a long minus, ×, ÷, ², ½, full-width brackets) are
   turned into the ones the page uses, invisible characters go, and what the page
   has no meaning for is dropped rather than carried along to be drawn as a
   mystery. */
const SAME_AS = {
  "−": "-", "–": "-", "—": "-", "﹣": "-", "×": "*", "·": "*", "⋅": "*", "∙": "*", "✕": "*", "÷": "/", "∕": "/", "⁄": "/",
  "＋": "+", "＝": "=", "（": "(", "）": ")", "［": "[", "］": "]", "｛": "{", "｝": "}", "，": ",", "．": ".",
  " ": " ", " ": " ", " ": " ", "\t": " ", "\n": " ", "\r": " ",
  "¼": "1/4", "½": "1/2", "¾": "3/4", "⅓": "1/3", "⅔": "2/3", "⅕": "1/5", "⅖": "2/5", "⅗": "3/5", "⅘": "4/5",
  "⅙": "1/6", "⅚": "5/6", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8",
  "𝑒": "ℯ", "ⅇ": "ℯ",                                   // the other italic e's are Euler's number
};
const SUPER = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUB = "₀₁₂₃₄₅₆₇₈₉";
const KEEP = /[0-9A-Za-z+\-*/=^_(){}\[\],.?°%!π±∫Σ√∠ℯ Ͱ-Ͽ]/;

/* Algebra Moves has no use for < > ≤ ≥ and the absolute-value bar, so they are dropped. A page
   that graphs (Cartesian Art) asks for them with createEditor({ relations: true }). */
const KEEP_RELATIONS = /[<>≤≥|]/;
const KEEP_INEQUALITIES = /[<>≤≥|]/;     // relations: "ineq" — the signs and the absolute-value bar

export function sanitize(input, relations = false) {
  let s = String(input ?? "");
  s = s.replace(/[​-‏⁠﻿­]/g, "");                          // zero-width and soft hyphens
  s = s.replace(new RegExp(`[${SUPER}⁺⁻]+`, "g"), (run) => `^(${[...run].map((c) => (c === "⁺" ? "+" : c === "⁻" ? "-" : SUPER.indexOf(c))).join("")})`);
  s = s.replace(new RegExp(`[${SUB}]+`, "g"), (run) => `_${[...run].map((c) => SUB.indexOf(c)).join("")}`);
  // the full-width forms a phone or an East Asian keyboard brings (２＋３) are the ordinary ones
  s = [...s].map((c) => { const k = c.charCodeAt(0); return k >= 0xff01 && k <= 0xff5e && SAME_AS[c] === undefined ? String.fromCharCode(k - 0xfee0) : c; }).join("");
  s = [...s].map((c) => (SAME_AS[c] !== undefined ? SAME_AS[c] : c)).join("");
  s = [...s].filter((c) => KEEP.test(c) || (relations && (relations === "ineq" ? KEEP_INEQUALITIES : KEEP_RELATIONS).test(c))).join("");                                  // what is left has a meaning here
  return s.replace(/ {2,}/g, " ");
}

export function createEditor({ relations = false } = {}) {
  let root = block();
  let caret = { block: root, i: 0 };

  const here = () => caret.block;
  const place = (item) => {
    const b = here();
    b.items.splice(caret.i, 0, item);
    if (item.t === "tpl") item.parent = b;
    caret.i++;
  };
  const indexOfIn = (it) => it.parent.items.indexOf(it);

  /** Build a template, filled as the key asks, and say where the caret goes. */
  function build(kind, o = {}) {
    const it = make(kind, o);
    if (o.fill) { o.fill.forEach((s, k) => { if (s) fillChars(it.blocks[k], s); }); it.def = o.fill.map((s) => s || ""); }
    let target = o.after ? null : it.blocks[o.focus ?? 0];
    if (o.inner) {
      const sub = build(o.inner.kind, o.inner);
      sub.item.parent = it.blocks[0];
      it.blocks[0].items.push(sub.item);
      target = o.after ? null : sub.target;
    }
    return { item: it, target };
  }

  /** A numeral's DIGITS box holds digits and letters only: anything else made there is made after
      the numeral. (Its base box holds any expression.) */
  function leaveBase() {
    const o = here().owner;
    if (o && o.kind === "base" && o.blocks[0] === here()) caret = { block: o.parent, i: indexOfIn(o) + 1 };
  }

  function template(kind, o = {}) {
    leaveBase();
    const made = build(kind, o);
    place(made.item);
    if (made.target) caret = { block: made.target, i: o.focusEnd ? made.target.items.length : 0 };
  }

  /* ── Typing ─────────────────────────────────────────────────────────── */

  /** The run of things just before the caret that a slash or a base takes with it. */
  function operandStart(b, i, only = OPERAND) {
    let j = i;
    while (j > 0) {
      const it = b.items[j - 1];
      if (it.t === "tpl" ? only === OPERAND : only.test(it.c)) j--;
      else break;
    }
    return j;
  }

  function slash() {
    const b = here();
    const j = operandStart(b, caret.i);
    const taken = b.items.splice(j, caret.i - j);
    const made = build("frac", { focus: taken.length ? 1 : 0 });
    made.item.blocks[0].items.push(...taken);
    adopt(taken, made.item.blocks[0]);
    caret.i = j;
    place(made.item);
    caret = { block: made.target, i: 0 };
  }

  function power() { template("pow"); }

  /** A number's base: whatever digits are just before the caret go in the first box. */
  function base(o = {}) {
    const b = here();
    const j = operandStart(b, caret.i, ALNUM);
    const taken = b.items.splice(j, caret.i - j);
    // digits already there: on to the base. Nothing yet: the digits box comes first.
    const made = build("base", { focus: taken.length ? 1 : 0, after: !!o.baseText });
    made.item.blocks[0].items.push(...taken);
    if (o.baseText) fillChars(made.item.blocks[1], o.baseText);
    caret.i = j;
    place(made.item);
    if (made.target) caret = { block: made.target, i: 0 };
  }

  /** ) or } : out of the nearest bracket of that kind, wherever the caret is inside it. */
  function closeUp(kind) {
    let b = here();
    while (b.owner) {
      const o = b.owner;
      if (o.kind === kind) { caret = { block: o.parent, i: indexOfIn(o) + 1 }; return true; }
      b = o.parent;
    }
    return false;
  }

  function ownerOfKind(kind) {
    for (let b = here(); b.owner; b = b.owner.parent) if (b.owner.kind === kind) return b.owner;
    return null;
  }

  function nextCell() {
    for (let b = here(); b.owner; b = b.owner.parent) {
      const o = b.owner;
      if (o.kind !== "mat") continue;
      const k = o.blocks.indexOf(b);
      if (k < o.blocks.length - 1) caret = { block: o.blocks[k + 1], i: 0 };
      return true;
    }
    return false;
  }

  function insertChar(c) {
    // A character that is really a few (², ½, a typographic minus) is read as the text it stands for.
    const clean = sanitize(c, relations);
    if (clean !== c) { if (clean) insertText(clean); return; }
    // A numeral and its base hold digits and letters only; a sign or a bracket
    // typed there is for what comes AFTER the numeral, so the boxes are left first.
    if (!ALNUM.test(c) && c !== "?" && c !== "_") leaveBase();
    switch (c) {
      case "(": template("br"); return;
      case ")": closeUp("br"); return;
      case "{": template("list"); return;
      case "}": closeUp("list"); return;
      case "/": slash(); return;
      case "^": power(); return;
      case "_": if (here().owner?.kind === "base" && here().owner.blocks[0] === here()) return; base(); return;
      case ",": if (ownerOfKind("mat")) { nextCell(); return; } break;
      case " ": if (caret.i === 0 || (here().items[caret.i - 1]?.t === "c" && here().items[caret.i - 1].c === " ")) return; break;
      default: break;
    }
    place(chr(c));
  }

  /* ── Taking apart ───────────────────────────────────────────────────── */

  function removeTemplate(it) {
    const pb = it.parent;
    const idx = pb.items.indexOf(it);
    pb.items.splice(idx, 1);
    caret = { block: pb, i: idx };
  }

  function backspace() {
    const b = here();
    if (caret.i > 0) {
      const it = b.items[caret.i - 1];
      if (it.t === "c") { b.items.splice(caret.i - 1, 1); caret.i--; return; }
      // A template with nothing in it goes at once; one with something in it is
      // stepped into from its right edge, so what is in it can be taken away first.
      if (blank(it)) { removeTemplate(it); return; }
      const last = it.blocks[it.blocks.length - 1];
      caret = { block: last, i: last.items.length };
      return;
    }
    const o = b.owner;
    if (!o) return;
    if (blank(o)) { removeTemplate(o); return; }
    const k = o.blocks.indexOf(b);
    // An empty base box with digits before it: the base goes, the digits stay (35_ becomes 35).
    if (o.kind === "base" && k === 1 && !b.items.length) {
      const pb0 = o.parent, at = pb0.items.indexOf(o), keep = o.blocks[0].items;
      pb0.items.splice(at, 1, ...keep);
      adopt(keep, pb0);
      caret = { block: pb0, i: at + keep.length };
      return;
    }
    if (k > 0) {                                 // back to the end of the box before
      const prev = o.blocks[k - 1];
      caret = { block: prev, i: prev.items.length };
      return;
    }
    const pb = o.parent, idx = pb.items.indexOf(o);
    if (o.kind === "br") {                       // brackets let go and keep what was inside
      pb.items.splice(idx, 1, ...b.items);
      adopt(b.items, pb);
      caret = { block: pb, i: idx };
      return;
    }
    caret = { block: pb, i: idx };               // anything else: out to before it
  }

  function del() {
    const b = here();
    if (caret.i >= b.items.length) return;
    const it = b.items[caret.i];
    if (it.t === "c") { b.items.splice(caret.i, 1); return; }
    if (blank(it)) { b.items.splice(caret.i, 1); return; }
    caret = { block: it.blocks[0], i: 0 };
  }

  /* ── Moving ─────────────────────────────────────────────────────────── */

  function right() {
    const b = here();
    if (caret.i < b.items.length) {
      const it = b.items[caret.i];
      if (it.t === "tpl") caret = { block: it.blocks[0], i: 0 };
      else caret.i++;
      return true;
    }
    const o = b.owner;
    if (!o) return false;
    const k = o.blocks.indexOf(b);
    if (k < o.blocks.length - 1) caret = { block: o.blocks[k + 1], i: 0 };
    else caret = { block: o.parent, i: indexOfIn(o) + 1 };
    return true;
  }

  function left() {
    const b = here();
    if (caret.i > 0) {
      const it = b.items[caret.i - 1];
      if (it.t === "tpl") { const last = it.blocks[it.blocks.length - 1]; caret = { block: last, i: last.items.length }; }
      else caret.i--;
      return true;
    }
    const o = b.owner;
    if (!o) return false;
    const k = o.blocks.indexOf(b);
    if (k > 0) { const prev = o.blocks[k - 1]; caret = { block: prev, i: prev.items.length }; }
    else caret = { block: o.parent, i: indexOfIn(o) };
    return true;
  }

  function vertical(dir) {            // dir -1 up, +1 down
    let b = here(), pos = caret.i;
    while (b.owner) {
      const o = b.owner;
      const k = o.blocks.indexOf(b);
      let t = null;
      if (o.kind === "frac") t = dir < 0 ? (k === 1 ? 0 : null) : (k === 0 ? 1 : null);
      else if (o.kind === "mat") {
        const r = Math.floor(k / o.cols), c = k % o.cols, nr = r + dir;
        if (nr >= 0 && nr < o.rows) t = nr * o.cols + c;
      } else if (o.kind === "sigma" || o.kind === "int") {
        const lo = o.kind === "sigma" ? 1 : 0, hi = lo + 1;
        if (dir < 0 && k === lo) t = hi;
        else if (dir > 0 && k === hi) t = lo;
      }
      if (t !== null) { caret = { block: o.blocks[t], i: Math.min(pos, o.blocks[t].items.length) }; return true; }
      pos = o.parent.items.indexOf(o);
      b = o.parent;
    }
    return false;
  }

  function move(dir) {
    if (dir === "right") return right();
    if (dir === "left") return left();
    if (dir === "up") return vertical(-1);
    if (dir === "down") return vertical(1);
    if (dir === "home") { caret = { block: root, i: 0 }; return true; }
    if (dir === "end") { caret = { block: root, i: root.items.length }; return true; }
    return false;
  }

  /** Every box in reading order. */
  function boxes() {
    const out = [];
    (function walk(b) { out.push(b); for (const it of b.items) if (it.t === "tpl") it.blocks.forEach(walk); })(root);
    return out;
  }

  /** Tab: on to the next empty box, or the next box at all. */
  function tab(dir = 1) {
    const all = boxes();
    const at = all.indexOf(here());
    const order = dir > 0 ? all.slice(at + 1) : all.slice(0, at).reverse();
    const target = order.find((b) => !b.items.length) || order[0];
    if (!target) return false;
    caret = { block: target, i: dir > 0 || !target.items.length ? 0 : target.items.length };
    return true;
  }

  /* ── Small edits ────────────────────────────────────────────────────── */

  /** ± : put a minus at the front of the term the caret is in, or take it off. */
  function flipSign() {
    const b = here();
    let j = caret.i;
    while (j > 0) {
      const it = b.items[j - 1];
      if (it.t === "c" && /[+\-=*/,(]/.test(it.c)) break;
      j--;
    }
    if (j > 0 && b.items[j - 1].t === "c" && b.items[j - 1].c === "-") {
      b.items.splice(j - 1, 1);
      caret.i--;
    } else {
      b.items.splice(j, 0, chr("-"));
      caret.i++;
    }
  }

  /** "mat 2x3" typed in letters becomes a 2 by 3 matrix of boxes (det mat 2x2 a determinant). */
  function matrixShorthand() {
    const b = here();
    let j = caret.i;
    while (j > 0 && b.items[j - 1].t === "c") j--;
    const s = b.items.slice(j, caret.i).map((it) => it.c).join("");
    const m = /(^|[^A-Za-z])(det\s*)?mat(?:rix)?\s*(\d{1,2})\s*[x×*]\s*(\d{1,2})$/i.exec(s);
    if (!m) return false;
    const rows = Number(m[3]), cols = Number(m[4]);
    if (rows < 1 || cols < 1 || rows > 8 || cols > 8) return false;
    const start = j + m.index + m[1].length;
    b.items.splice(start, caret.i - start);
    caret.i = start;
    if (m[2]) template("fn", { name: "det", inner: { kind: "mat", rows, cols } });
    else template("mat", { rows, cols });
    return true;
  }

  function clear() { root = block(); caret = { block: root, i: 0 }; }

  /* ── Reading text in ─────────────────────────────────────────────────
     Pasted text, a name to start from, an equation to edit: written as a line,
     it is read back into boxes — the same shapes the keys make, so a pasted
     (3x + 1)/(x − 2) is a fraction with a numerator and a denominator to move
     through, not a row of characters with brackets. Anything it does not
     recognise is kept as plain characters: nothing typed is ever lost. */

  const NAMES = ["abs", "arcsin", "arccos", "arctan", "transpose", "median", "mean", "mode", "range", "sum", "sin", "cos", "tan", "ln", "log", "det"];

  function closeAt(s, from) {          // index of the bracket that shuts s[from]
    const open = s[from], shut = { "(": ")", "[": "]", "{": "}" }[open];
    let d = 0;
    for (let k = from; k < s.length; k++) {
      if (s[k] === open) d++;
      else if (s[k] === shut && --d === 0) return k;
    }
    return -1;
  }
  function splitTop(s, sep = ",") {
    const parts = [];
    let d = 0, from = 0;
    for (let k = 0; k < s.length; k++) {
      if ("([{".includes(s[k])) d++;
      else if (")]}".includes(s[k])) d--;
      else if (s[k] === sep && d === 0) { parts.push(s.slice(from, k)); from = k + 1; }
    }
    parts.push(s.slice(from));
    return parts;
  }

  function importItems(s) {
    const out = [];
    const sub = (text) => importItems(text);
    const tplOf = (kind, texts, o = {}) => {
      const it = make(kind, o);
      texts.forEach((t, k) => { if (it.blocks[k] && t !== "?" && t !== "") { const items = sub(t); it.blocks[k].items.push(...items); adopt(items, it.blocks[k]); } });
      return it;
    };
    /** One factor after a slash or a ^ : a bracket, a number, a letter, with its own powers. */
    const factorAt = (i) => {
      let items = [], k = i;
      if (s[k] === "(") {
        const e = closeAt(s, k);
        if (e < 0) return { items: [], next: i };
        items = sub(s.slice(k + 1, e));
        k = e + 1;
      } else {
        const m = /^(-?[0-9.]+|-?[A-Za-zͰ-Ͽ])/.exec(s.slice(k));
        if (!m) return { items: [], next: i };
        for (const c of m[0]) items.push(chr(c));
        k += m[0].length;
      }
      while (s[k] === "^") {
        const ex = exponentAt(k + 1);
        if (!ex) break;
        const it = tplOf("pow", [ex.text]);
        items.push(it);
        k = ex.next;
      }
      return { items, next: k };
    };
    const exponentAt = (i) => {
      if (s[i] === "(") { const e = closeAt(s, i); return e < 0 ? null : { text: s.slice(i + 1, e), next: e + 1 }; }
      const m = /^(-?[0-9]+|[A-Za-zͰ-Ͽ])/.exec(s.slice(i));
      return m ? { text: m[0], next: i + m[0].length } : null;
    };
    const push = (it) => { out.push(it); };

    let i = 0;
    while (i < s.length) {
      const rest = s.slice(i);
      let m;
      if ((m = /^sqrt\(/.exec(rest))) {
        const e = closeAt(s, i + 4);
        if (e > 0) { push(tplOf("sqrt", [s.slice(i + 5, e)])); i = e + 1; continue; }
      }
      if ((m = new RegExp(`^(${NAMES.join("|")})\\(`).exec(rest)) && (i === 0 || !/[A-Za-z]/.test(s[i - 1]))) {
        const e = closeAt(s, i + m[1].length);
        if (e > 0) { push(tplOf("fn", [s.slice(i + m[1].length + 1, e)], { name: m[1] })); i = e + 1; continue; }
      }
      if ((m = /^n([PC])r\(/.exec(rest))) {
        const e = closeAt(s, i + 3);
        if (e > 0) { const parts = splitTop(s.slice(i + 4, e)); push(tplOf("choose", parts, { perm: m[1] === "P" })); i = e + 1; continue; }
      }
      if ((m = /^cbrt\(/.exec(rest))) {
        const e = closeAt(s, i + 4);
        if (e > 0) { push(tplOf("nroot", ["3", s.slice(i + 5, e)])); i = e + 1; continue; }
      }
      if ((m = /^root_/.exec(rest))) {
        let k = i + 5, idxText = null;
        if (s[k] === "(") { const e = closeAt(s, k); if (e > 0) { idxText = s.slice(k + 1, e); k = e + 1; } }
        else { const t = /^([0-9]+|[a-z])/.exec(s.slice(k)); if (t) { idxText = t[0]; k += t[0].length; } }
        if (idxText !== null && s[k] === "(") {
          const e = closeAt(s, k);
          if (e > 0) { push(tplOf("nroot", [idxText, s.slice(k + 1, e)])); i = e + 1; continue; }
        }
      }
      if (rest.startsWith("^^")) {
        const ex = exponentAt(i + 2);
        const j = operandStart({ items: out }, out.length);
        if (ex && j < out.length) {
          const taken = out.splice(j, out.length - j);
          const it = make("tet");
          const h = sub(ex.text);
          it.blocks[0].items.push(...h); adopt(h, it.blocks[0]);
          it.blocks[1].items.push(...taken); adopt(taken, it.blocks[1]);
          push(it); i = ex.next; continue;
        }
      }
      if ((m = /^log_/.exec(rest)) && (i === 0 || !/[A-Za-z]/.test(s[i - 1]))) {
        // log_2(8), log_(x + 1)(y): the base, then what it is taken of
        let k = i + 4, baseText = null;
        if (s[k] === "(") { const e = closeAt(s, k); if (e > 0) { baseText = s.slice(k + 1, e); k = e + 1; } }
        else { const t = /^([0-9]+|[a-z])/.exec(s.slice(k)); if (t) { baseText = t[0]; k += t[0].length; } }
        if (baseText !== null && s[k] === "(") {
          const e = closeAt(s, k);
          if (e > 0) { push(tplOf("logb", [baseText, s.slice(k + 1, e)])); i = e + 1; continue; }
        }
      }
      if ((m = /^mixed\(/.exec(rest))) {
        const e = closeAt(s, i + 5);
        if (e > 0) { push(tplOf("mixed", splitTop(s.slice(i + 6, e)))); i = e + 1; continue; }
      }
      if ((m = /^\{/.exec(rest))) {
        const e = closeAt(s, i);
        if (e > 0) { push(tplOf("list", [s.slice(i + 1, e)])); i = e + 1; continue; }
      }
      if (rest.startsWith("[[")) {
        const e = closeAt(s, i);
        if (e > 0) {
          const rows = splitTop(s.slice(i + 1, e)).map((r) => splitTop(r.trim().slice(1, -1)));
          if (rows.every((r) => r.length === rows[0].length)) {
            const it = tplOf("mat", rows.flat(), { rows: rows.length, cols: rows[0].length });
            push(it); i = e + 1; continue;
          }
        }
      }
      if (s[i] === "(") {
        const e = closeAt(s, i);
        if (e > 0) {
          // (a)/(b) is a fraction, not two brackets round a slash
          if (s[e + 1] === "/") {
            const d = factorAt(e + 2);
            if (d.items.length) {
              const it = make("frac");
              const top = sub(s.slice(i + 1, e));
              it.blocks[0].items.push(...top); adopt(top, it.blocks[0]);
              it.blocks[1].items.push(...d.items); adopt(d.items, it.blocks[1]);
              push(it); i = d.next; continue;
            }
          }
          push(tplOf("br", [s.slice(i + 1, e)])); i = e + 1; continue;
        }
      }
      if (s[i] === "^") {
        const ex = exponentAt(i + 1);
        if (ex) { push(tplOf("pow", [ex.text])); i = ex.next; continue; }
      }
      if (s[i] === "/") {
        const d = factorAt(i + 1);
        if (d.items.length) {
          const j = operandStart({ items: out }, out.length);
          const taken = out.splice(j, out.length - j);
          const it = make("frac");
          it.blocks[0].items.push(...taken); adopt(taken, it.blocks[0]);
          it.blocks[1].items.push(...d.items); adopt(d.items, it.blocks[1]);
          push(it); i = d.next; continue;
        }
      }
      if (s[i] === "_" && rest[1] === "(") {
        const e = closeAt(s, i + 1);
        const j = operandStart({ items: out }, out.length, ALNUM);
        if (e > 0 && j < out.length) {
          const taken = out.splice(j, out.length - j);
          const it = make("base");
          it.blocks[0].items.push(...taken); adopt(taken, it.blocks[0]);
          const inner = sub(s.slice(i + 2, e));
          it.blocks[1].items.push(...inner); adopt(inner, it.blocks[1]);
          push(it); i = e + 1; continue;
        }
      }
      if (s[i] === "_" && (m = /^_([0-9]+|[a-z])/.exec(rest))) {
        const j = operandStart({ items: out }, out.length, ALNUM);
        if (j < out.length) {
          const taken = out.splice(j, out.length - j);
          const it = make("base");
          it.blocks[0].items.push(...taken);
          fillChars(it.blocks[1], m[1]);
          push(it); i += m[0].length; continue;
        }
      }
      if (s[i] === "?") { i++; continue; }
      push(chr(s[i]));
      i++;
    }
    return out;
  }

  function insertText(str) {
    const items = importItems(sanitize(str, relations));
    for (const it of items) place(it);
  }

  function setText(str) { clear(); insertText(str); }

  /* ── Out again: the line the parser reads, and where the caret is in it ── */

  function serialize() {
    let text = "";
    const spots = [];
    const depthOf = (b) => { let d = 0; for (let x = b; x.owner; x = x.owner.parent) d++; return d; };
    const put = (s) => { text += s; };
    const spot = (b, i) => spots.push({ off: text.length, block: b, i, depth: depthOf(b) });

    /** A base written plainly when it is a number, a letter or nothing yet; in brackets when it is an expression. */
    function baseBox(b) {
      const txt = b.items.every((x) => x.t === "c") ? b.items.map((x) => x.c).join("") : null;
      if (txt !== null && (txt === "" || /^[0-9]+$/.test(txt) || /^[a-z]$/.test(txt))) { blk(b); return; }
      // a single bracket, function or root already shuts itself: no second pair round it
      if (b.items.length === 1 && b.items[0].t === "tpl" && ["br", "fn", "sqrt", "list", "choose", "logb", "nroot"].includes(b.items[0].kind)) { blk(b); return; }
      put("("); blk(b); put(")");
    }
    function blk(b) {
      spot(b, 0);
      if (!b.items.length) { put("?"); return; }
      b.items.forEach((it, k) => { item(it, b, k); spot(b, k + 1); });
    }
    function item(it, b, k) {
      if (it.t === "c") { put(it.c); return; }
      const B = it.blocks;
      switch (it.kind) {
        case "frac": put("("); blk(B[0]); put(")/("); blk(B[1]); put(")"); break;
        case "pow": {
          const prev = b.items[k - 1];
          if (!prev || (prev.t === "c" && OPERATOR.test(prev.c))) put("?");   // a power with nothing yet to raise
          put("^("); blk(B[0]); put(")"); break;
        }
        case "sqrt": put("sqrt("); blk(B[0]); put(")"); break;
        case "br": put("("); blk(B[0]); put(")"); break;
        case "fn": put(`${it.name}(`); blk(B[0]); put(")"); break;
        case "base": blk(B[0]); put("_"); baseBox(B[1]); break;
        case "logb": put("log_"); baseBox(B[0]); put("("); blk(B[1]); put(")"); break;
        case "nroot": put("root_"); baseBox(B[0]); put("("); blk(B[1]); put(")"); break;
        // the tower reads base first, though its height is the box the caret meets first
        case "tet": baseBox(B[1]); put("^^"); baseBox(B[0]); break;
        case "mixed": put("mixed("); blk(B[0]); put(","); blk(B[1]); put(","); blk(B[2]); put(")"); break;
        case "choose": put(it.perm ? "nPr(" : "nCr("); blk(B[0]); put(","); blk(B[1]); put(")"); break;
        case "sigma": put("Σ_("); blk(B[0]); put("="); blk(B[1]); put(")^("); blk(B[2]); put(")("); blk(B[3]); put(")"); break;
        case "list": put("{"); blk(B[0]); put("}"); break;
        case "deriv": put("d/dx("); blk(B[0]); put(")"); break;
        case "int": put("∫_("); blk(B[0]); put(")^("); blk(B[1]); put(")("); blk(B[2]); put(")dx"); break;
        case "int0": put("∫("); blk(B[0]); put(")dx"); break;
        case "lim": put("lim(h->"); blk(B[0]); put(")("); blk(B[1]); put(")"); break;
        case "mat": {
          put("[");
          for (let r = 0; r < it.rows; r++) {
            if (r) put(",");
            put("[");
            for (let c = 0; c < it.cols; c++) { if (c) put(","); blk(B[r * it.cols + c]); }
            put("]");
          }
          put("]");
          break;
        }
        default: break;
      }
    }
    // nothing typed at all is an empty line, not a box to fill
    if (!root.items.length) spot(root, 0); else blk(root);
    const mine = spots.filter((s) => s.block === caret.block && s.i === caret.i);
    return { text, spots, caret: mine.length ? mine[mine.length - 1].off : text.length };
  }

  /** Put the caret at the spot nearest a place in the written line (a tap on the drawing). */
  function setCaretAtOffset(off) {
    const { spots } = serialize();
    let best = null;
    for (const s of spots) {
      const d = Math.abs(s.off - off);
      if (!best || d < best.d || (d === best.d && s.depth > best.depth)) best = { d, depth: s.depth, s };
    }
    if (best) caret = { block: best.s.block, i: best.s.i };
  }

  const text = () => serialize().text;
  const isEmpty = () => root.items.length === 0;
  const hasEmptyBox = () => boxes().some((b) => !b.items.length && b !== root);

  return {
    insertChar, insertText, setText, template, backspace, del, move, tab, flipSign, matrixShorthand, clear,
    base, serialize, setCaretAtOffset, text, isEmpty, hasEmptyBox,
    get caret() { return caret; },
    get root() { return root; },
  };
}
