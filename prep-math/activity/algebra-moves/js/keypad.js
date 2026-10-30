/* ═══════════════════════════════════════════════════════════════════════════
   THE KEYPAD

   A calculator you type maths on — an equation, or an expression with no equals
   sign in it at all — with the line drawn properly above the keys as you go. The source line underneath is the site's own linear
   syntax — 1/2, x^2, 3x — the same thing students type everywhere else here,
   so nothing new has to be learned and read-back stays exact.

   You type INTO the drawing. There is still a real <input> underneath holding
   the source — that is what keeps arrow keys, selection, a physical keyboard
   and the keys below all working on plain text — but it is not shown, and the
   caret you see is drawn into the equation itself.

   Which needs one thing the drawing does not otherwise have: a way back from a
   position in the SOURCE to a position on the PAGE. parse.js stamps every node
   with the characters it came from and layout.js already gives every node a
   box, so the two together say where character 7 of "(3x + 5)/4 = 5" is sitting
   — halfway down a fraction, as it happens. Everything below is that idea.

   Keys that build a shape — a fraction, a power, a bracket — insert the whole
   shape and put the caret inside it, because a half-typed (3x+5)/ is a parse
   error the drawing would have to apologise for.
   ═══════════════════════════════════════════════════════════════════════════ */

import { parse } from "./parse.js";
import { buildRow, paintRow, el } from "./render.js";
import { readValue } from "./formulas.js";
import { createEditor } from "./editor.js";
import { UI } from "/utils/components/ui-icons.js";
import { mathNode, mathReady, whenMathDrawn } from "/utils/components/sticky-math.js";
import * as A from "./ast.js";
import { texToLinear, looksLikeTeX } from "./tex.js";

/* label, what it types, and how far back into it the caret goes.
   `wide` marks the keys that earn a double cell.

   `math` is the key's FACE, written in the same linear syntax as everything
   else and set by the same typesetter the canvas uses — so the fraction key is
   a real fraction with a real bar over a real denominator, not an "a/b" with a
   slash in it, and the power keys carry real raised exponents. A key that shows
   you a slash and then draws you a bar has told you a small lie about what it
   does. The brackets key draws the empty slot it is about to give you.

   Everything else is a single glyph, already set in the equation's own face by
   .am-key, so drawing it through the typesetter would produce exactly the same
   picture at more cost. */
// Eight columns on every row, so the keys line up down the pad.
const KEYS = [
  [
    { k: "7" }, { k: "8" }, { k: "9" },
    { k: "÷", t: "/" },
    { k: "( )", t: "()", back: 1, title: "brackets", math: "(?)" },
    { k: "x²", t: "^(2)", back: 0, title: "squared", math: "x^2" },
    // A square root types the site's own sqrt(…) and leaves the caret inside.
    { k: "√", t: "sqrt()", back: 1, title: "square root", math: "sqrt(?)" },
    { k: "⌫", act: "back", title: "Delete", tone: "warn" },
  ],
  [
    { k: "4" }, { k: "5" }, { k: "6" },
    { k: "×", t: "*" }, { k: "aᵇ", t: "^()", back: 1, title: "to the power of", math: "a^b" },
    { k: "x", t: "x", tone: "letter" }, { k: "y", t: "y", tone: "letter" }, { k: "z", t: "z", tone: "letter" },
  ],
  [
    { k: "1" }, { k: "2" }, { k: "3" },
    { k: "−", t: "-" },
    { k: "a⁄b", t: "()/()", back: 4, title: "fraction", math: "a/b" },
    { k: "±", act: "sign", title: "Change the sign" },
    { k: "←", act: "left", title: "Move left" },
    { k: "→", act: "right", title: "Move right" },
  ],
  [
    { k: "0" }, { k: ".", t: "." },
    { k: "+", t: "+" }, { k: "=", t: "=" },
    { k: "CLR", act: "clear", icon: "trash", title: "Clear", tone: "warn" },
    { k: "a b⁄c", act: "mixed", title: "A mixed number: a whole number and a fraction, in boxes to fill (a b/c)", mixedFace: true },
    // Enter is a key here, not a button living somewhere else below the
    // pad — and a wide one, the way a laptop's Return key is.
    { k: "Enter", act: "enter", icon: "enter", title: "Put it on the canvas", tone: "go", wide: true },
  ],
];

/** Rows of up to `n`, for a flat list of keys nobody has hand-laid-out. Each
    row is handed its own column count rather than assuming seven, so a row
    that ends in one extra key (Enter, CAPS) is still a tidy grid. */
const rowsOf = (keys, n = 7) => {
  const out = [];
  for (let i = 0; i < keys.length; i += n) out.push(keys.slice(i, i + n));
  return out;
};

const asLetter = (ch, title) => ({ k: ch, t: ch, tone: "letter", title });

/* The Latin alphabet. CAPS is a key at the end of it rather than a separate
   control, the same way Enter is a key on the number pad — press it and the
   row it is sitting on relabels itself in capitals. */
const LETTER_ROWS = rowsOf([..."abcdefghijklmnopqrstuvwxyz"].map((ch) => asLetter(ch)));
LETTER_ROWS[LETTER_ROWS.length - 1] = [
  ...LETTER_ROWS[LETTER_ROWS.length - 1],
  { k: "caps", act: "caps", icon: "arrowUp", title: "Capitals", tone: "act" },
  // A number in another base: 1011_2 is 1011 in base two (capitals for
  // digits past 9: 2A_16).
  { k: "_b", act: "base", title: "Base: pick the base of a number — a number (1011_2) or a letter (35_y)", tone: "act", fixed: true, tex: "q_b" },
];

/* The full Greek alphabet — a circle's π, an angle's θ, the unknowns geometry
   reaches for once x, y and z are all taken. Named on the key's title, since
   "chi" and "xi" are not a glyph anyone is expected to read on sight. See
   parse.js for why it stops at lowercase. */
const GREEK_NAMES = {
  α: "alpha", β: "beta", γ: "gamma", δ: "delta", ε: "epsilon", ζ: "zeta",
  η: "eta", θ: "theta", ι: "iota", κ: "kappa", λ: "lambda", μ: "mu",
  ν: "nu", ξ: "xi", ο: "omicron", π: "pi", ρ: "rho", σ: "sigma",
  τ: "tau", υ: "upsilon", φ: "phi", χ: "chi", ψ: "psi", ω: "omega",
};
const GREEK = rowsOf([...Object.keys(GREEK_NAMES)].map((g) => asLetter(g, GREEK_NAMES[g])));

/* Functions and calculus: each key types its whole shape with the caret left
   where the student writes next — inside sin( ), inside d/dx( ), on the bottom
   limit of a definite integral. e and π are numbers here, not letters. */
const fnKey = (name, title, face = name) => ({ k: face, t: `${name}()`, back: 1, title, math: `${name}(?)` });
const FUNCS = [
  [
    fnKey("sin", "sine"), fnKey("cos", "cosine"), fnKey("tan", "tangent"),
    fnKey("arcsin", "inverse sine"), fnKey("arccos", "inverse cosine"), fnKey("arctan", "inverse tangent"),
    { k: "°", t: "°", title: "degrees" },
    { k: "⌫", act: "back", title: "Delete", tone: "warn" },
  ],
  [
    fnKey("ln", "natural log"), fnKey("log", "log base 10"),
    { k: "e", t: "e", title: "e, the number 2.718…", math: "e" },
    { k: "π", t: "π", title: "pi, the number 3.14159…", math: "π" },
    { k: "aᵇ", t: "^()", back: 1, title: "to the power of", math: "a^b" },
    { k: "( )", t: "()", back: 1, title: "brackets", math: "(?)" },
    { k: "←", act: "left", title: "Move left" },
    { k: "→", act: "right", title: "Move right" },
  ],
  [
    { k: "d/dx", t: "d/dx()", back: 1, title: "differentiate", math: "d/dx(?)" },
    { k: "∫", t: "∫()dx", back: 3, title: "integrate", math: "∫(?)dx" },
    { k: "∫ₐᵇ", t: "∫_()^()()dx", back: 8, title: "integrate from a to b", math: "∫_(?)^(?)(?)dx" },
    { k: "lim", t: "lim(h->0)()", back: 1, title: "limit as h goes to 0", math: "lim(h->0)(?)" },
    { k: "x", t: "x", tone: "letter" }, { k: "h", t: "h", tone: "letter" },
    { k: "=", t: "=" },
    { k: "CLR", act: "clear", icon: "trash", title: "Clear", tone: "warn" },
  ],
  [
    { k: "+", t: "+" }, { k: "−", t: "-" }, { k: "×", t: "*" }, { k: "÷", t: "/" },
    { k: "a⁄b", t: "()/()", back: 4, title: "fraction", math: "a/b" },
    { k: "Enter", act: "enter", icon: "enter", title: "Put it on the canvas", tone: "go", wide: true },
    { k: "√", t: "sqrt()", back: 1, title: "square root", math: "sqrt(?)" },
  ],
  [
    { k: "%", t: "%", title: "percent: 25% is 25 out of 100" },
    { k: "_b", act: "base", title: "Base: pick the base of a number — a number (1011_2) or a letter (35_y)", tex: "q_b" },
    { k: "a b⁄c", act: "mixed", title: "A mixed number: a whole number and a fraction, in boxes to fill (a b/c)", mixedFace: true },
    { k: "e", t: "e", title: "e, the number 2.718…", math: "e" },
    { k: "π", t: "π", title: "pi", math: "π" },
    { k: "∠", t: "°", title: "degrees" },
    { k: "y", t: "y", tone: "letter" },
    { k: "z", t: "z", tone: "letter" },
  ],
  /* Matrices: a template with the cursor in its first entry, then , to move
     along a row and → to leave. */
  [
    { k: "▦", act: "matrix", title: "A matrix: pick how many rows and columns, then fill in the boxes (or type mat 2x3 and press Enter)", math: "[[a,b],[c,d]]" },
    { k: "det", act: "detmatrix", title: "The determinant of a matrix: pick its size", math: "det(?)" },
    { k: "ᵀ", t: "^T", title: "transpose: rows become columns" },
    { k: "⁻¹", t: "^(-1)", title: "inverse of a matrix" },
    { k: "↑", act: "up", title: "Up to the box above" },
    { k: "↓", act: "down", title: "Down to the box below" },
    { k: "←", act: "left", title: "Move left, box to box in a matrix" },
    { k: "→", act: "right", title: "Move right, box to box in a matrix" },
  ],
  /* Sums and lists: Σ with its limits to fill, a list in braces, the comma
     between its numbers, and the things taken of a list. */
  [
    { k: "Σ", t: "Σ_(i=1)^()()", back: 3, title: "sum: add up a body for each whole number from the start to the stop", math: "Σ_(i=1)^(?)(?)" },
    { k: "{ }", t: "{}", back: 1, title: "a list of numbers in braces", math: "{?}" },
    { k: ",", t: ",", title: "comma: on to the next number in a list" },
    { k: "mean", t: "mean({})", back: 2, title: "the mean of a list", math: "mean({?})" },
    { k: "median", t: "median({})", back: 2, title: "the median of a list", math: "median({?})" },
    { k: "mode", t: "mode({})", back: 2, title: "the mode of a list", math: "mode({?})" },
    { k: "range", t: "range({})", back: 2, title: "the range of a list", math: "range({?})" },
    { k: "sum", t: "sum({})", back: 2, title: "the sum of a list", math: "sum({?})" },
  ],
  /* Counting: n factorial, and the arrangements and choices of r from n. The
     last two put two boxes on the line and → goes from one to the next. */
  [
    { k: "n!", t: "!", title: "factorial: 5! is 5 × 4 × 3 × 2 × 1", math: "n!" },
    { k: "nPr", act: "perm", title: "Arrangements of r things from n, in order: nPr", tex: "{}^{n}P_{r}" },
    { k: "nCr", act: "comb", title: "Choices of r things from n, order not mattering: nCr", tex: "{}^{n}C_{r}" },
    { k: "log_b", t: "logb()", title: "Logarithm to any base: the base, then what it is taken of — log_2(8) is 3", math: "log_b(x)" },
    { k: "←", act: "left", title: "Move left" },
    { k: "→", act: "right", title: "Move right" },
  ],
  /* Roots of any index, and power towers. */
  [
    { k: "∛", t: "cbrt()", title: "Cube root", math: "root_3(x)" },
    { k: "ⁿ√", t: "nroot()", title: "Root of any index: the index, then what it is taken of", math: "root_n(x)" },
    { k: "ⁿa", t: "tet()", title: "A power tower (tetration): the height, then the base — ³2 is 2^(2^2)", math: "a^^n" },
    { k: "←", act: "left", title: "Move left" },
    { k: "→", act: "right", title: "Move right" },
  ],
];

export function createKeypad(host, { onSubmit, relations = false } = {}) {
  const preview = document.createElement("div");
  preview.className = "am-preview";

  const line = document.createElement("input");
  line.className = "am-line";
  line.type = "text";
  line.inputMode = "none";        // our keys are the keyboard
  line.autocomplete = "off";
  /* A browser's autofill and a password manager look for a field to fill, and a
     text field with nothing around it is a candidate. Say, in every dialect, that
     this one is not a form field (it is only where the keyboard's focus sits). */
  line.name = `am-line-${Math.random().toString(36).slice(2)}`;
  line.autocapitalize = "off";
  line.setAttribute("autocorrect", "off");
  line.setAttribute("aria-autocomplete", "none");
  for (const a of ["data-lpignore", "data-1p-ignore", "data-bwignore", "data-form-type"]) line.setAttribute(a, a === "data-form-type" ? "other" : "true");
  line.spellcheck = false;
  line.setAttribute("aria-label", "The line you are typing");

  const say = document.createElement("p");
  say.className = "am-keysay";

  /* What is typed lives in BOXES (editor.js), not in this field. The field is
     only where the keyboard's focus sits; after every edit the boxes are written
     out into it as the line the parser reads, and the caret with them. Nothing in
     it is ever shown — the drawing above the keys is. */
  const ed = createEditor({ relations });
  function sync(focus = true) {
    const { text, caret } = ed.serialize();
    line.value = text;
    line.setSelectionRange(caret, caret);
    if (focus) line.focus();
    draw();
  }

  /* Values for the letters in whatever has been typed. The formula shelf is not
     the only place a substitution belongs: a line a student wrote themselves has
     letters of their own, and "work it out when x is 3" is the same question
     asked about their own algebra. The row builds itself out of the line — type
     a y and a box for y appears. */
  const give = document.createElement("div");
  give.className = "am-give";
  give.hidden = true;
  const values = new Map();      // letter -> its input
  const kept = new Map();        // letter -> what was typed, across redraws

  const pad = document.createElement("div");
  pad.className = "am-pad";

  /* "Both sides" mode: the = asked for something to apply to both sides, and
     whatever is typed now is THAT — an expression, not a new problem. The
     banner says which operation, and Enter hands the typed thing back. */
  const banner = document.createElement("p");
  banner.className = "am-keymode";
  banner.hidden = true;
  let mode = null;

  host.append(banner, preview, line, say, give, pad);

  const SIZE = 40;                // the drawing's font size, in CSS pixels
  const KEY_SIZE = 15;            // and on a key face, which has a cell to fit
  let anchors = [];               // where each source offset sits on the page
  let toDrawn = [];               // typed offset -> repaired offset

  /* -- Repairing a half-typed line ------------------------------------------
     The parser wants a finished equation; a student halfway through typing one
     has not got there yet. Two repairs cover nearly everything this keypad can
     produce, because its shape keys insert whole shapes rather than halves:

       ( )     a slot still to fill      ->  (?)
       3x +    a dangling operator       ->  3x + (?)

     Both move the characters about, so the repair also hands back the two maps
     between the typed line and the repaired one: one to put the caret on the
     page, the other to put it back in the text when a tap lands. */
  function repair(src) {
    let text = "";
    const origin = [];                     // origin[j] = typed offset of drawn char j
    const put = (ch, at) => { text += ch; origin.push(at); };

    // A closing bracket with nothing open to close is left out of the drawing,
    // so a stray one cannot throw the whole equation back to raw text.
    const strays = new Set();
    {
      const stack = [];
      for (let i = 0; i < src.length; i++) {
        if (src[i] === "(" || src[i] === "[") stack.push(src[i]);
        else if (src[i] === ")" || src[i] === "]") {
          if (stack.length && stack[stack.length - 1] === (src[i] === ")" ? "(" : "[")) stack.pop();
          else strays.add(i);
        }
      }
    }
    for (let i = 0; i < src.length; i++) {
      if (strays.has(i)) continue;
      // An operator left dangling just before a closing bracket (2n+) has
      // something still to come after it: a box stands in for it.
      if ((src[i] === ")" || src[i] === "]" || src[i] === ",") && /[+\-*/^=]\s*$/.test(text)) { put(" ", i); put("?", i); }
      put(src[i], i);
      if (src[i] !== "(") continue;
      const gap = /^\s*\)/.exec(src.slice(i + 1));
      if (!gap) continue;
      // Nothing but space before the closing bracket: that is an empty slot.
      for (let k = 0; k < gap[0].length - 1; k++) put(src[i + 1 + k], i + 1 + k);
      i += gap[0].length - 1;
      put("?", i + 1);
    }
    // A bare "?" rather than "(?)": the box is standing in for something not
    // typed yet, and brackets nobody asked for would be drawn round it.
    const dangling = /[+\-*/^=]\s*$/.test(text);
    if (dangling) for (const ch of " ?") put(ch, src.length);
    // Brackets still open are closed for the drawing, so half a line is drawn
    // as far as it goes rather than as an error until the last one is typed.
    for (const ch of unclosed(text)) put(ch, src.length);
    /* No equals sign is not a line half-typed — it is an expression, which is a
       perfectly good thing to put on the canvas and tidy. This used to stand an
       empty box where the other side "should" go, which was the keypad quietly
       insisting on a kind of problem the tool no longer only does. */
    const noEquals = !text.includes("=");

    // typed -> drawn: the first drawn character that came from here or later.
    const forward = new Array(src.length + 1).fill(text.length);
    for (let j = text.length - 1; j >= 0; j--) forward[origin[j]] = j;
    for (let i = src.length - 1; i >= 0; i--) {
      if (forward[i] === text.length) forward[i] = forward[i + 1];
    }
    // A space is not a place — the same rule the arrow keys work by. Landing on
    // one puts the caret beside whatever character it was standing next to
    // rather than in the thing that comes after it, which for the space this
    // repair invents in front of a slot means beside the last letter typed
    // instead of inside the box waiting for the next one.
    for (let i = 0; i <= src.length; i++) {
      while (forward[i] < text.length && text[forward[i]] === " ") forward[i]++;
    }
    return {
      text, forward, dangling, noEquals,
      slots: /\(\s*\)/.test(src),
      back: (j) => (j < origin.length ? origin[j] : src.length),
    };
  }

  // An empty pair of brackets, or a ? box that is still to be filled in.
  /** The closers a line is still owed, innermost first: ")" or "]" for every
      "(" or "[" that was opened and not shut. */
  const unclosed = (text) => {
    const stack = [];
    for (const ch of text) {
      if (ch === "(" || ch === "[") stack.push(ch === "(" ? ")" : "]");
      else if ((ch === ")" || ch === "]") && stack[stack.length - 1] === ch) stack.pop();
    }
    return stack.reverse().join("");
  };
  const hasHoles = (src) => /\(\s*\)|\?/.test(src);

  /* -- Where a source offset sits on the page -------------------------------
     One entry per node: the characters it was written with, and the box the
     layout gave it. A leaf is flagged because the caret can stand INSIDE one --
     between the 2 and the 0 of 20 -- where everything else can only be stood
     beside. */
  function anchorsOf(eq, row, back) {
    const rp = new Map();
    for (const a of row.atoms) if (a.key.endsWith("#rp")) rp.set(a.nodeId, a.x);

    // The dashed box a slot is drawn as, so the caret can be put INSIDE it
    // rather than beside it.
    const slots = new Map();
    for (const a of row.atoms) if (a.kind === "hole") slots.set(a.nodeId, a);

    const out = [];
    A.walk(eq, (n) => {
      const box = row.boxes.get(n.id);
      if (!box || !n.src) return;
      let left = box.x;
      let right = box.x + box.w;
      // A node the student bracketed is boxed WITH its brackets, and its source
      // span is what is between them. Stand the ends just inside the brackets,
      // or a caret after the last character of (x + 1) is drawn after the ")"
      // and reads as being outside it.
      const bar = rp.get(n.id);
      if (bar !== undefined) { const w = right - bar; left += w; right = bar; }
      out.push({
        from: n.src[0], to: n.src[1], box, left, right,
        leaf: A.kidsOf(n).length === 0,
        slot: slots.get(n.id) || null,
        typedFrom: back(n.src[0]), typedTo: back(n.src[1]),
      });
      // A numeral's empty digit box and empty base box are places the caret can stand
      // too, though neither is a node of its own: their spots are read off the line.
      if (n.kind === "base") {
        for (const h of row.atoms.filter((a) => a.nodeId === n.id && a.kind === "hole")) {
          const d = /#d(\d+)$/.exec(h.key);
          const pos = h.key.endsWith("#radix") ? n.src[0] + n.digits.length + 1 : d ? n.src[0] + Number(d[1]) : null;
          if (pos === null) continue;
          out.push({
            from: pos, to: pos + 1, box: { x: h.x, y: h.y, w: h.w, h: h.h }, left: h.x, right: h.x + h.w,
            leaf: false, slot: h, typedFrom: back(pos), typedTo: back(pos + 1),
          });
        }
      }
    });
    return out;
  }

  /** Where the caret goes, for a position in the REPAIRED line. */
  function caretFor(k) {
    // Inside a leaf, walk across its own box: the characters it was typed with
    // are the characters it is drawn with, so the share of one is the share of
    // the other.
    for (const a of anchors) {
      if (a.leaf && k > a.from && k < a.to) {
        return { x: a.left + ((k - a.from) / (a.to - a.from)) * (a.right - a.left), y: a.box.y, h: a.box.h };
      }
    }
    // Otherwise stand beside the nearest edge of the nearest node. Ties go to
    // the smallest box, which is the most specific thing that edge belongs to.
    let best = null;
    for (const a of anchors) {
      for (const [at, x] of [[a.from, a.left], [a.to, a.right]]) {
        const d = Math.abs(at - k);
        if (!best || d < best.d || (d === best.d && a.box.w < best.w)) {
          best = { d, x, y: a.box.y, h: a.box.h, w: a.box.w, slot: a.slot };
        }
      }
    }

    /* A slot is not a character to stand beside — it is a box with nothing in
       it yet, and the caret belongs in the MIDDLE of it. Left where the rule
       above puts it, the caret is drawn along the box's own dashed left edge,
       which reads as standing outside the very thing it is about to fill.
       The box's own rectangle is used rather than the node's, because a slot
       the student bracketed is boxed with its brackets and its middle would
       otherwise be measured across those too. */
    if (best && best.slot) {
      const s = best.slot;
      return { x: s.x + s.w / 2, y: s.y, h: s.h };
    }
    return best;
  }

  /* -- Boxes for the letters that are in the line --------------------------
     Rebuilt only when the SET of letters changes, never on every keystroke:
     replacing an input the student is typing into takes the focus away from
     them mid-number. */
  function letters(names) {
    const now = names.join("");
    give.hidden = names.length === 0;
    if (give.dataset.of === now) return;
    give.dataset.of = now;

    for (const [letter, input] of values) kept.set(letter, input.value);
    values.clear();
    give.textContent = "";
    if (!names.length) return;

    const cap = document.createElement("span");
    cap.className = "am-give__cap";
    cap.textContent = "let";
    give.appendChild(cap);

    for (const name of names) {
      const row = document.createElement("label");
      row.className = "am-give__row";
      row.innerHTML = `<b></b><i>=</i>`;
      row.querySelector("b").textContent = name;
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.autocomplete = "off";
      input.name = `am-value-${Math.random().toString(36).slice(2)}`;
      input.setAttribute("data-lpignore", "true");
      input.setAttribute("data-1p-ignore", "true");
      input.className = "am-give__value";
      input.placeholder = "?";
      input.value = kept.get(name) ?? "";
      input.setAttribute("aria-label", `A value for ${name}`);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
      row.appendChild(input);
      give.appendChild(row);
      values.set(name, input);
    }
  }

  /** What is in those boxes: the letters given a value, and the ones left out. */
  function given() {
    const out = {};
    const blank = [];
    const wrong = [];
    for (const [letter, input] of values) {
      const raw = input.value.trim();
      if (!raw) { blank.push(letter); continue; }
      const v = readValue(raw);
      if (!v) wrong.push(letter);
      else out[letter] = v;
    }
    return { given: Object.keys(out).length ? out : null, blank, wrong };
  }

  /* -- The picture above the keys ------------------------------------------ */
  /** The line the parser reads, mended until it will: a box where something is
      still to come at the end, nothing where a character does not belong. Returns
      the tree and which characters were left out (so the caret still lands right). */
  function tolerant(text) {
    let t = text;
    const gone = [];                      // indexes, in the ORIGINAL text, that were left out
    let note = null;                      // something to say about a line that is drawn but not right
    const originalAt = (i) => gone.reduce((k, idx) => (idx <= k ? k + 1 : k), i);
    for (let n = 0; n < 16; n++) {
      try { return { eq: parse(t), gone, note }; } catch (err) {
        // A digit that is not one of its base's (8 in base 6): drawn as written, and said in words.
        if (/is not a digit in base/.test(err.message || "") && !note) {
          note = err.message;
          try { return { eq: parse(t, { lenient: true }), gone, note }; } catch { /* fall through to mending */ }
        }
        // 3. is a number still being typed: drawn as 3 until the digits after the point come
        if (/^not a number/.test(err.message || "")) {
          const dot = t.search(/\.(?![0-9])/);
          if (dot >= 0) { gone.push(originalAt(dot)); gone.sort((x, y) => x - y); t = t.slice(0, dot) + t.slice(dot + 1); continue; }
        }
        if (err.atEnd || err.at === undefined || err.at >= t.length) {
          if (/\?$/.test(t)) return null;
          t += " ?";
          continue;
        }
        gone.push(originalAt(err.at));
        gone.sort((x, y) => x - y);
        t = t.slice(0, err.at) + t.slice(err.at + 1);
      }
    }
    return null;
  }

  /** What went wrong, in words — never the symbols it was made of. */
  function friendly(err) {
    const m = String(err?.message || "");
    if (/is not a digit in base/.test(m)) return m;
    if (/^I do not know what to do with/.test(m)) return "That is not a symbol this keypad can use.";
    if (/^I did not expect/.test(m)) return "Something is out of place there.";
    if (/^I expected|stops before it is finished/.test(m)) return "That is not finished yet — there is more to fill in.";
    return m;
  }

  function draw() {
    // A mode may read what is typed its own way first: "+ 3" after an
    // equation's name means E_1 + 3.
    const src = mode?.translate ? mode.translate(line.value) : line.value;
    preview.textContent = "";
    anchors = [];
    // The <input> holding the source is not the thing on screen, so the ring
    // that says "this is where your typing goes" has to be put on the drawing.
    preview.classList.toggle("is-live", document.activeElement === line);

    if (!src.trim()) {
      letters([]);
      preview.classList.add("is-empty");
      say.textContent = mode
        ? "Type it — a number, a letter or an expression — then Enter."
        : "Type an equation, or an expression to tidy up. It is drawn here as you go.";
      say.className = "am-keysay";
      return;
    }
    preview.classList.remove("is-empty");

    const fixed = repair(src);
    toDrawn = fixed.forward;

    /* Whatever has been typed is DRAWN — never shown as the characters it was
       written with. A line the parser still will not take (a stray sign from a
       paste, say) is drawn without the piece that does not belong, and the
       message says so in words; if nothing at all can be drawn, the picture stays
       empty. There is no "raw" fallback to see. */
    const read = tolerant(fixed.text);
    if (!read) {
      letters([]);
      preview.classList.add("is-empty");
      say.textContent = "That is not something I can draw yet — keep typing, or press Clear.";
      say.className = "am-keysay is-no";
      return;
    }
    const eq = read.eq;
    fixed.back = ((back, gone) => (j) => back(gone.reduce((k, idx) => (idx <= k ? k + 1 : k), j)))(fixed.back, read.gone);

    // No "let x = …" boxes in both-sides mode: what is typed is applied, not solved.
    letters(mode ? [] : A.varsIn(eq).sort());

    const row = buildRow(eq, SIZE);
    const svg = paintRow(row, { live: false });
    anchors = anchorsOf(eq, row, fixed.back);
    drawCaret(svg);
    preview.appendChild(svg);
    followCaret();

    // Whatever the repair had to invent is exactly what is still to be typed.
    const todo =
      read.note ? read.note
      : read.gone.length ? "Part of that does not fit there yet, so it is not drawn."
      : fixed.slots || src.includes("?") ? "Fill in the empty boxes — type, or use the arrows to go from box to box."
      : fixed.dangling ? "Something still has to come after that."
      : null;
    say.textContent = todo ?? (fixed.noEquals ? "Ready — no equals sign, so this one gets tidied up." : "Ready.");
    say.className = read.note ? "am-keysay is-no" : todo ? "am-keysay" : "am-keysay is-ok";
  }

  /** The caret, and the band behind a selection, drawn into the equation. */
  let caretX = null;
  function drawCaret(svg) {
    caretX = null;
    if (document.activeElement !== line) return;
    const end = Math.min(toDrawn.length - 1, line.selectionEnd ?? 0);
    const start = Math.min(toDrawn.length - 1, line.selectionStart ?? 0);
    const head = caretFor(toDrawn[end]);
    if (!head) return;

    if (start !== end) {
      const tail = caretFor(toDrawn[start]);
      // Only when both ends sit on one line of the drawing: a selection running
      // from a numerator into a denominator has no single band to draw.
      if (tail && tail.y === head.y && tail.h === head.h) {
        svg.appendChild(el("rect", {
          class: "am-band", x: Math.min(tail.x, head.x), y: head.y,
          width: Math.abs(head.x - tail.x), height: head.h, rx: 2,
        }));
      }
    }
    svg.appendChild(el("rect", {
      class: "am-caret", x: head.x - 1, y: head.y, width: 2, height: head.h, rx: 1,
    }));
    caretX = head.x;
  }

  /** A long equation scrolls sideways; the caret has to stay in the window. */
  function followCaret() {
    if (caretX === null) return;
    const room = preview.clientWidth;
    const svg = preview.querySelector("svg");
    if (!svg || svg.getBoundingClientRect().width <= room) return;
    const margin = 48;
    if (caretX - preview.scrollLeft > room - margin) preview.scrollLeft = caretX - room + margin;
    else if (caretX - preview.scrollLeft < margin) preview.scrollLeft = Math.max(0, caretX - margin);
  }

  /* -- Tapping the drawing puts the caret there ---------------------------- */
  preview.addEventListener("pointerdown", (e) => {
    e.preventDefault();                     // never let the caret leave the line
    line.focus();
    const svg = preview.querySelector("svg");
    if (!svg || !anchors.length) { draw(); return; }

    // Into the drawing's own coordinates, so its CSS size does not matter.
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const at = pt.matrixTransform(svg.getScreenCTM().inverse());

    let best = null;
    for (const a of anchors) {
      for (const [typed, x] of [[a.typedFrom, a.left], [a.typedTo, a.right]]) {
        // Distance to the box's own line first and along it second, or a tap in
        // a numerator lands in the denominator underneath it. Ties go to the
        // smallest box: the innermost thing you could have meant.
        const dy = Math.max(0, a.box.y - at.y, at.y - (a.box.y + a.box.h));
        const d = Math.hypot(x - at.x, dy * 2.2);
        if (!best || d < best.d || (d === best.d && a.box.w < best.w)) {
          best = { d, typed, w: a.box.w };
        }
      }
    }
    ed.setCaretAtOffset(best.typed);
    sync();
  });

  /* ── Typing ──────────────────────────────────────────────────────────── */
  /* The keyboard and the on-screen keys type the same way: after a ^ or a / the
     cursor stays in the power or the bottom until → is pressed (slot-typing.js). */

  /* The keys that make a shape, by what the old line typed for them. Each now
     makes the boxes of that shape, with the caret in the first one to fill. */
  const SHAPES = {
    "()": () => ed.template("br"),
    "()/()": () => ed.insertChar("/"),
    "^(2)": () => ed.template("pow", { fill: ["2"], after: true }),
    "^()": () => ed.template("pow"),
    "^T": () => ed.template("pow", { fill: ["T"], after: true }),
    "^(-1)": () => ed.template("pow", { fill: ["-1"], after: true }),
    "sqrt()": () => ed.template("sqrt"),
    "d/dx()": () => ed.template("deriv"),
    "∫()dx": () => ed.template("int0"),
    "∫_()^()()dx": () => ed.template("int"),
    "lim(h->0)()": () => ed.template("lim", { fill: ["0", ""], focus: 1 }),
    "Σ_(i=1)^()()": () => ed.template("sigma", { fill: ["i", "1", "", ""], focus: 2 }),
    "{}": () => ed.template("list"),
    "logb()": () => ed.template("logb"),
    "cbrt()": () => ed.template("nroot", { fill: ["3", ""], focus: 1 }),
    "nroot()": () => ed.template("nroot"),
    "tet()": () => ed.template("tet"),
  };

  /** A key, or a piece of text: into the boxes. */
  function type(text) {
    let m;
    if (SHAPES[text]) SHAPES[text]();
    else if ((m = /^([a-z]+)\(\)$/.exec(text))) ed.template("fn", { name: m[1] });
    else if ((m = /^([a-z]+)\(\{\}\)$/.exec(text))) ed.template("fn", { name: m[1], inner: { kind: "list" } });
    else if ([...text].length === 1) ed.insertChar(text);
    else ed.insertText(text);
    sync();
  }

  function backspace() { ed.backspace(); sync(); }

  function nudge(by, dir = by > 0 ? "right" : "left") {
    ed.move(dir);
    sync();
  }

  function flipSign() { ed.flipSign(); sync(); }

  function submit() {
    if (expandSize()) return;
    const typed = (mode?.translate ? mode.translate(line.value) : line.value).trim();
    // A bracket left open is shut for you, as it is in the drawing.
    const src = typed + unclosed(typed);
    if (!src) return;
    if (hasHoles(src)) {
      say.textContent = "There is still an empty box to fill in.";
      say.className = "am-keysay is-no";
      return;
    }
    let eq;
    try {
      eq = parse(src);
    } catch (err) {
      say.textContent = friendly(err);
      say.className = "am-keysay is-no";
      return;
    }

    if (mode && mode.whole) {
      const r = mode.accept(eq, src);
      if (r && r.refused) {
        say.textContent = `I will not do that — ${r.refused}.`;
        say.className = "am-keysay is-no";
      }
      return;
    }

    if (mode) {
      if (eq.kind === "eq") {
        say.textContent = "Just what to apply to both sides — no equals sign.";
        say.className = "am-keysay is-no";
        return;
      }
      const r = mode.accept(eq.e, src);
      if (r && r.refused) {
        say.textContent = `I will not do that — ${r.refused}.`;
        say.className = "am-keysay is-no";
        return;
      }
      ed.clear();
      sync(false);
      return;
    }

    const vals = given();
    if (vals.wrong.length) {
      say.textContent = `${vals.wrong.join(" and ")} — I cannot read that as a number.`;
      say.className = "am-keysay is-no";
      return;
    }

    // One letter left without a value is the thing being looked for, and worth
    // writing on the card. Two or more and there is no one answer to name.
    onSubmit?.(eq, src, vals.given, vals.given && vals.blank.length === 1 ? vals.blank[0] : "");
    ed.clear();
    for (const input of values.values()) input.value = "";
    kept.clear();
    sync(false);
  }

  /* ── Matrices: ask the size, leave boxes ────────────────────────────────
     A matrix is not typed with its brackets. The key asks how big, writes it
     with every entry a ? box, and selects the first; arrows go from box to box
     (cellMove, slot-typing.js) and typing fills the one that is selected. */
  let picker = null;
  /* A press anywhere else puts the picker away. That listener is taken off the
     moment the picker closes any other way (a pick), or it would still be
     waiting and close the NEXT picker the instant it opened. */
  let pickerOut = null;
  function closePicker() {
    picker?.remove();
    picker = null;
    if (pickerOut) { document.removeEventListener("pointerdown", pickerOut); pickerOut = null; }
  }
  function closePickerOnOutside() {
    setTimeout(() => {
      if (!picker) return;
      pickerOut = () => closePicker();
      document.addEventListener("pointerdown", pickerOut);
    }, 0);
  }

  function placeMatrix(rows, cols, prefix = "") {
    if (prefix === "det") ed.template("fn", { name: "det", inner: { kind: "mat", rows, cols } });
    else ed.template("mat", { rows, cols });
    sync();
  }

  function placeMixed() { ed.template("mixed", { focus: 0 }); sync(); }

  function placeChoose(letter) { ed.template("choose", { perm: letter === "P" }); sync(); }

  function expandSize() {
    if (!ed.matrixShorthand()) return false;
    sync();
    return true;
  }

  function openPicker(anchor, prefix = "") {
    if (picker) { closePicker(); return; }
    const N = 5;
    picker = document.createElement("div");
    picker.className = "am-matpick pp-sticky pp-sticky--c0";
    const label = document.createElement("p");
    label.className = "am-matpick__say";
    label.textContent = "How big?";
    const grid = document.createElement("div");
    grid.className = "am-matpick__grid";
    grid.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    const cells = [];
    const light = (r, c) => {
      cells.forEach((d) => d.classList.toggle("is-in", d.dataset.r <= r && d.dataset.c <= c));
      label.textContent = r ? `${r} row${r > 1 ? "s" : ""} × ${c} column${c > 1 ? "s" : ""}` : "How big?";
    };
    for (let r = 1; r <= N; r++) {
      for (let c = 1; c <= N; c++) {
        // A div, not a button: sixteen small notes would be the wrong picture of a grid.
        const d = document.createElement("div");
        d.className = "am-matpick__cell";
        d.dataset.r = r; d.dataset.c = c;
        d.setAttribute("aria-label", `${r} by ${c}`);
        d.addEventListener("pointerenter", () => light(r, c));
        d.addEventListener("pointerdown", (e) => { e.preventDefault(); closePicker(); placeMatrix(r, c, prefix); });
        grid.appendChild(d);
        cells.push(d);
      }
    }
    picker.append(label, grid);
    pad.appendChild(picker);
    const box = pad.getBoundingClientRect(), key = anchor.getBoundingClientRect();
    picker.style.left = `${Math.max(0, Math.min(box.width - picker.offsetWidth, key.left - box.left))}px`;
    picker.style.top = `${Math.max(0, key.top - box.top - picker.offsetHeight - 6)}px`;
    picker.addEventListener("pointerdown", (e) => e.stopPropagation());
    closePickerOnOutside();
  }

  /** The base key: a small sheet of bases to pick from — the numbers people
      count in, and the letters an equation might be about (35_y = 29). */
  function openBasePicker(anchor) {
    if (picker) { closePicker(); return; }
    picker = document.createElement("div");
    picker.className = "am-matpick am-basepick pp-sticky pp-sticky--c0";
    const label = document.createElement("p");
    label.className = "am-matpick__say";
    label.textContent = "In which base?";
    picker.appendChild(label);
    const row = (items, letters) => {
      const box = document.createElement("div");
      box.className = "am-basepick__row";
      for (const b of items) {
        // divs, not buttons: a row of small notes would be the wrong picture of a choice of base
        const d = document.createElement("div");
        d.className = `am-basepick__cell${letters ? " is-letter" : ""}`;
        d.textContent = b;
        d.setAttribute("aria-label", letters ? `base ${b}, a letter` : `base ${b}`);
        d.addEventListener("pointerdown", (e) => { e.preventDefault(); closePicker(); ed.base({ baseText: String(b) }); sync(); });
        box.appendChild(d);
      }
      return box;
    };
    picker.append(row(["2", "3", "4", "5", "6", "7", "8", "9", "12", "16"], false), row(["n", "b", "x", "y", "k", "m"], true));
    // ...or a base that is a whole expression (x + 1): its own box, to be filled with the keys
    const own = document.createElement("div");
    own.className = "am-basepick__cell am-basepick__own";
    own.textContent = "an expression";
    own.setAttribute("aria-label", "a base that is an expression");
    own.addEventListener("pointerdown", (e) => { e.preventDefault(); closePicker(); ed.base(); sync(); });
    picker.appendChild(own);
    pad.appendChild(picker);
    const box = pad.getBoundingClientRect(), key = anchor.getBoundingClientRect();
    picker.style.left = `${Math.max(0, Math.min(box.width - picker.offsetWidth, key.left - box.left))}px`;
    picker.style.top = `${Math.max(0, key.top - box.top - picker.offsetHeight - 6)}px`;
    picker.addEventListener("pointerdown", (e) => e.stopPropagation());
    closePickerOnOutside();
  }

  const ACTS = { back: backspace, base: (btn) => openBasePicker(btn), left: () => nudge(-1), right: () => nudge(1),
                 up: () => nudge(0, "up"), down: () => nudge(0, "down"),
                 matrix: (btn) => openPicker(btn), detmatrix: (btn) => openPicker(btn, "det"),
                 mixed: placeMixed, perm: () => placeChoose("P"), comb: () => placeChoose("C"),
                 sign: flipSign, clear: () => { ed.clear(); sync(); },
                 enter: submit };

  /** A key's face, typeset rather than spelled out. */
  /** The mixed-number key's face: a whole beside a fraction, all letters — a b/c. */
  function mixedFace() {
    const holder = document.createElement("span");
    holder.className = "am-key__ink";
    holder.setAttribute("aria-hidden", "true");
    const node = A.expression(A.mixed(A.vr("a"), A.frac(A.vr("b"), A.vr("c"))));
    holder.appendChild(paintRow(buildRow(node, KEY_SIZE), { live: false }));
    return holder;
  }

  function face(src) {
    const holder = document.createElement("span");
    holder.className = "am-key__ink";
    // The face is a picture of the key, not its name: without this a screen
    // reader reads the fraction key as "ab" and the power key as "x2".
    holder.setAttribute("aria-hidden", "true");
    try {
      holder.appendChild(paintRow(buildRow(parse(src), KEY_SIZE), { live: false }));
    } catch {
      holder.textContent = src;   // a face that will not parse is a bug, not a crash
    }
    return holder;
  }

  /** A key face set by MathJax itself, for what the site's own typesetter has
      no word for — the base key, q with a subscript b. Until MathJax arrives it
      shows the source, and is set again when it lands. */
  function texFace(tex) {
    const holder = document.createElement("span");
    holder.className = "am-key__ink am-key__ink--tex";
    holder.setAttribute("aria-hidden", "true");
    const set = () => {
      const eq = mathNode(tex);
      // the note's "tap to edit this equation" has no place on a key
      for (const att of ["data-tip", "title", "aria-label"]) eq.removeAttribute(att);
      holder.replaceChildren(eq);
    };
    set();
    if (!mathReady()) whenMathDrawn(set);
    return holder;
  }

  /** One key, built the one way every key on the pad is built — numbers,
      Greek and ordinary letters all go through this, so there is one place
      that knows how a key types and nothing to drift apart. CAPS is the one
      exception; see buildLetters, below, for why. */
  function keyButton(key) {
    const btn = document.createElement("button");
    btn.type = "button";
    // A key that DOES something to the keypad rather than typing maths is
    // labelled, not set: it gets the mono face a caption has.
    btn.className = `am-key${key.act ? " am-key--act" : ""}` +
                    `${key.tone ? ` am-key--${key.tone}` : ""}${key.wide ? " am-key--wide" : ""}`;
    if (key.icon) btn.innerHTML = UI[key.icon](18);
    else if (key.mixedFace) btn.appendChild(mixedFace());
    else if (key.tex) btn.appendChild(texFace(key.tex));
    else if (key.math) btn.appendChild(face(key.math));
    else btn.textContent = key.k;
    // The letters x, y, z are notes stuck on the pad, each on its own paper.
    if (key.sticky !== undefined) btn.classList.add("pp-sticky", "pp-note-btn", `pp-sticky--c${key.sticky}`, "am-key--sticky");
    if (key.title) btn.title = key.title;
    btn.setAttribute("aria-label", key.title || key.k);
    // pointerdown, not click: never let the caret leave the line.
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (key.act) ACTS[key.act](btn);
      else type(key.t ?? key.k);
    });
    return btn;
  }

  /** How many grid cells a row needs — a wide key counts for two — so a row
      that ends in one extra key (Enter, CAPS) still lays out evenly instead
      of assuming every row has seven. */
  const cellsOf = (row) => row.reduce((n, k) => n + (k.wide ? 2 : 1), 0);

  /** One row of keys, each built through `keyButton` — the one thing every
      grid of keys on the pad is made of. */
  function buildPadRow(row) {
    const rail = document.createElement("div");
    rail.className = "am-pad__row";
    rail.style.gridTemplateColumns = `repeat(${cellsOf(row)}, 1fr)`;
    for (const key of row) rail.appendChild(keyButton(key));
    return rail;
  }

  /** A plain alphabet of keys: every row, in order. */
  function buildGrid(rows) {
    const section = document.createElement("div");
    section.className = "am-pad__grid";
    for (const row of rows) section.appendChild(buildPadRow(row));
    return section;
  }

  /** The Latin alphabet, with CAPS as the last key on it. Pressing it
      relabels and retypes every letter in capitals — rebuilt in place, the
      same way a real keyboard's shift key is a stylesheet, not a new key.
      CAPS is built by hand rather than through `keyButton`: it does not
      type anything itself, which is the one thing every other key does. */
  function buildLetters() {
    const section = document.createElement("div");
    section.className = "am-pad__grid";
    let caps = false;

    function render() {
      section.textContent = "";
      for (const row of LETTER_ROWS) {
        const rail = document.createElement("div");
        rail.className = "am-pad__row";
        rail.style.gridTemplateColumns = `repeat(${cellsOf(row)}, 1fr)`;
        for (const key of row) {
          if (key.act === "caps") {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `am-key am-key--act${caps ? " is-on" : ""}`;
            btn.innerHTML = UI.arrowUp(18);
            btn.title = "Capitals";
            btn.setAttribute("aria-label", "Capitals");
            btn.setAttribute("aria-pressed", String(caps));
            btn.addEventListener("pointerdown", (e) => {
              e.preventDefault();
              caps = !caps;
              render();
              line.focus();
            });
            rail.appendChild(btn);
          } else {
            if (key.fixed) { rail.appendChild(keyButton(key)); continue; }
            const ch = caps ? key.k.toUpperCase() : key.k;
            rail.appendChild(keyButton({ ...key, k: ch, t: ch }));
          }
        }
        section.appendChild(rail);
      }
    }
    render();
    return section;
  }

  /* Numbers, English letters, Greek letters — one alphabet on the pad at a
     time, the same toggle a phone keyboard uses, rather than three grids
     stacked fighting each other for room. */
  function buildPad() {
    const wrap = document.createElement("div");
    wrap.className = "am-pad__modes";

    const tabs = document.createElement("div");
    tabs.className = "am-subtabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Which keys");

    const MODES = [
      { label: "123", el: buildGrid(KEYS) },
      { label: "ABC", el: buildLetters() },
      { label: "αβγ", el: buildGrid(GREEK) },
      { label: "f(x)", el: buildGrid(FUNCS) },
    ];

    let active = 0;
    const tabBtns = MODES.map((m, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "tab");
      // Four notes in four papers; the one in use sits straighter and lifted.
      btn.className = `pp-sticky pp-note-btn am-subtab pp-sticky--c${[0, 3, 1, 4][i % 4]}`;
      btn.textContent = m.label;
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (active === i) return;
        active = i;
        sync();
        line.focus();
      });
      tabs.appendChild(btn);
      return btn;
    });

    function sync() {
      MODES.forEach((m, i) => { m.el.hidden = i !== active; });
      tabBtns.forEach((btn, i) => {
        btn.classList.toggle("is-on", i === active);
        btn.setAttribute("aria-selected", String(i === active));
      });
    }

    sync();
    wrap.append(tabs, ...MODES.map((m) => m.el));
    return wrap;
  }

  pad.appendChild(buildPad());

  /* The keyboard is the same keys as the pad: each press goes into the boxes and
     the field's own editing is switched off, so what is on screen can never be
     half a piece of syntax. (A virtual keyboard that skips keydown comes through
     beforeinput; anything that still changes the field is read back as a line.) */
  const ARROWS = { ArrowRight: "right", ArrowLeft: "left", ArrowUp: "up", ArrowDown: "down", Home: "home", End: "end" };
  line.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;           // the browser's own shortcuts
    const k = e.key;
    if (k === "Enter") { e.preventDefault(); if (!expandSize()) submit(); return; }
    if (k === "Backspace") { e.preventDefault(); ed.backspace(); sync(); return; }
    if (k === "Delete") { e.preventDefault(); ed.del(); sync(); return; }
    if (ARROWS[k]) { e.preventDefault(); ed.move(ARROWS[k]); sync(); return; }
    if (k === "Tab") { if (ed.tab(e.shiftKey ? -1 : 1)) { e.preventDefault(); sync(); } return; }
    if (k === " " && expandSize()) { e.preventDefault(); return; }
    if ([...k].length === 1) { e.preventDefault(); ed.insertChar(k === "×" || k === "·" ? "*" : k === "−" ? "-" : k); sync(); }
  });
  /** Text that arrives whole — pasted, dropped, dictated, a TeX worksheet line — is
      read into boxes the way it was written, TeX turned into the page's own line first. */
  const insertWhole = (t) => {
    const text = String(t || "");
    ed.insertText(looksLikeTeX(text) ? texToLinear(text) : text);
    sync();
  };
  line.addEventListener("beforeinput", (e) => {
    const type = e.inputType || "";
    if (type === "insertText" && e.data) {
      e.preventDefault();
      if ([...e.data].length > 1) insertWhole(e.data);
      else { ed.insertChar(e.data); sync(); }
    } else if (type === "deleteContentBackward") {
      e.preventDefault(); ed.backspace(); sync();
    } else if (type.startsWith("insertFrom") || type === "insertReplacementText") {
      e.preventDefault();
      insertWhole(e.dataTransfer?.getData("text") || e.data || "");
    }
  });
  line.addEventListener("paste", (e) => {
    e.preventDefault();
    insertWhole(e.clipboardData?.getData("text") || "");
  });
  line.addEventListener("input", (e) => {
    if (line.value === ed.text()) return;
    /* An `input` that is not an InputEvent is not typing: it is the browser filling
       the field in (autofill, a password manager, a saved suggestion). What the
       student typed is in the boxes; the field is put back to match them. */
    if (!(e instanceof InputEvent)) { sync(false); return; }
    ed.setText(looksLikeTeX(line.value) ? texToLinear(line.value) : line.value);
    sync();
  });
  line.addEventListener("change", () => { if (line.value !== ed.text()) sync(false); });
  // The caret is ours to draw, so every way it can gain or lose the focus redraws it.
  for (const ev of ["focus", "blur"]) line.addEventListener(ev, draw);

  draw();

  return {
    focus() { line.focus(); },
    /** Draw what is typed again — the multiplication sign was switched. */
    redraw() { draw(); },
    set(src) { ed.setText(src); sync(); },
    /** Put the keypad into "both sides" mode ({ label, accept(node) }), or out
        of it with null. */
    setMode(m) {
      mode = m;
      banner.hidden = !m;
      banner.textContent = m ? m.label : "";
      give.hidden = true;
      ed.clear();
      sync(false);
      if (m) line.focus();
    },
    get mode() { return mode; },
    get value() { return line.value; },
  };
}
