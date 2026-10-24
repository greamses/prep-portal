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
import { slotEdit, slotTypingForInput, cellMove, matrixTemplate } from "/utils/components/slot-typing.js";
import { UI } from "/utils/components/ui-icons.js";
import * as A from "./ast.js";

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
    { k: "x", t: "x", tone: "letter", sticky: 3 }, { k: "y", t: "y", tone: "letter", sticky: 1 }, { k: "z", t: "z", tone: "letter", sticky: 2 },
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
    { k: "a b⁄c", act: "mixed", title: "A mixed number: a whole number and a fraction, in boxes to fill (2 1/3)", math: "2 1/3" },
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
  { k: "_b", t: "_", title: "Base: type 1011_2 for 1011 in base two", tone: "act", fixed: true },
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
    { k: "x", t: "x", tone: "letter", sticky: 3 }, { k: "h", t: "h", tone: "letter", sticky: 4 },
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
    { k: "_b", t: "_", title: "base: 1011_2 is 1011 in base two" },
    { k: "a b⁄c", act: "mixed", title: "A mixed number: a whole number and a fraction, in boxes to fill (2 1/3)", math: "2 1/3" },
    { k: "e", t: "e", title: "e, the number 2.718…", math: "e" },
    { k: "π", t: "π", title: "pi", math: "π" },
    { k: "∠", t: "°", title: "degrees" },
    { k: "y", t: "y", tone: "letter", sticky: 1 },
    { k: "z", t: "z", tone: "letter", sticky: 2 },
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
];

export function createKeypad(host, { onSubmit } = {}) {
  const preview = document.createElement("div");
  preview.className = "am-preview";

  const line = document.createElement("input");
  line.className = "am-line";
  line.type = "text";
  line.inputMode = "none";        // our keys are the keyboard
  line.autocomplete = "off";
  line.spellcheck = false;
  line.setAttribute("aria-label", "The line you are typing");

  const say = document.createElement("p");
  say.className = "am-keysay";

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
        ? "Type it — a number, a letter, (b/(2a))^2 — then Enter."
        : "Type an equation, or an expression to tidy up. It is drawn here as you go.";
      say.className = "am-keysay";
      return;
    }
    preview.classList.remove("is-empty");

    const fixed = repair(src);
    toDrawn = fixed.forward;

    let eq;
    try {
      eq = parse(fixed.text);
    } catch (err) {
      // Nothing can be drawn, so show the letters themselves rather than an
      // empty box: whatever is wrong, the student has to be able to see it.
      const raw = document.createElement("p");
      raw.className = "am-preview__raw";
      raw.textContent = src;
      preview.appendChild(raw);
      letters([]);
      say.textContent = err.message;
      say.className = "am-keysay is-no";
      return;
    }

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
      fixed.slots || src.includes("?") ? "Fill in the empty boxes — type, or use the arrows to go from box to box."
      : fixed.dangling ? "Something still has to come after that."
      : null;
    say.textContent = todo ?? (fixed.noEquals ? "Ready — no equals sign, so this one gets tidied up." : "Ready.");
    say.className = todo ? "am-keysay" : "am-keysay is-ok";
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
    line.setSelectionRange(best.typed, best.typed);
    draw();
  });

  /* ── Typing ──────────────────────────────────────────────────────────── */
  /* The keyboard and the on-screen keys type the same way: after a ^ or a / the
     cursor stays in the power or the bottom until → is pressed (slot-typing.js). */
  const slots = slotTypingForInput(line, { onChange: () => draw() });

  function type(text, back = 0) {
    const a = line.selectionStart ?? line.value.length;
    const b = line.selectionEnd ?? a;
    if (text.length === 1) {
      const edit = slotEdit(line.value, a, b, text);
      if (edit) { line.focus(); slots.apply(edit); return; }
    }
    line.value = line.value.slice(0, a) + text + line.value.slice(b);
    const at = a + text.length - back;
    line.setSelectionRange(at, at);
    line.focus();
    draw();
  }

  function backspace() {
    const a = line.selectionStart ?? 0;
    const b = line.selectionEnd ?? a;
    if (a !== b) {
      line.value = line.value.slice(0, a) + line.value.slice(b);
      line.setSelectionRange(a, a);
    } else if (a > 0) {
      // Brackets go as pairs (slot-typing.js): an empty pair whole with the ^ or /
      // it belonged to, an opening bracket with its closer, a closing bracket not
      // at all — the cursor steps inside it instead.
      const edit = slotEdit(line.value, a, b, "Backspace");
      if (edit) {
        line.focus();
        slots.apply(edit);
        return;
      } else {
        line.value = line.value.slice(0, a - 1) + line.value.slice(a);
        line.setSelectionRange(a - 1, a - 1);
      }
    }
    line.focus();
    draw();
  }

  function nudge(by, dir = by > 0 ? "right" : "left") {
    const v = line.value;
    let at = line.selectionStart ?? 0;
    // In a matrix the arrows go from box to box.
    const hop = cellMove(v, at, line.selectionEnd ?? at, dir);
    if (hop) { line.setSelectionRange(hop.a, hop.b); line.focus(); draw(); return; }
    if (!by) return;
    if (hopBox(by)) return;

    // ")(" and ")/(" are one seam, not two or three steps. Without this, coming
    // out of a numerator and into the denominator is an arrow-key counting
    // exercise, which is exactly the fiddliness a keypad is supposed to remove.
    if (by > 0) {
      const seam = /^\)(\/?)\(/.exec(v.slice(at));
      at = seam ? at + seam[0].length : Math.min(v.length, at + 1);
      while (at < v.length && v[at] === " ") at++;
    } else {
      const back = /\)(\/?)\($/.exec(v.slice(0, at));
      at = back ? at - back[0].length : Math.max(0, at - 1);
      while (at > 0 && v[at - 1] === " ") at--;
    }

    // Space is not a place: the caret is drawn beside the writing now, so a
    // press that only crossed a gap looks like a press that did nothing.
    line.setSelectionRange(at, at);
    line.focus();
    draw();
  }

  /** Flip the sign of the thing the caret is sitting in. */
  function flipSign() {
    const at = line.selectionStart ?? line.value.length;
    // Back up to the start of this term.
    let i = at;
    while (i > 0 && !"+-=*/(".includes(line.value[i - 1])) i--;
    if (line.value[i - 1] === "-") {
      line.value = line.value.slice(0, i - 1) + line.value.slice(i);
      line.setSelectionRange(at - 1, at - 1);
    } else {
      line.value = line.value.slice(0, i) + "-" + line.value.slice(i);
      line.setSelectionRange(at + 1, at + 1);
    }
    line.focus();
    draw();
  }

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
      say.textContent = err.message;
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
      line.value = "";
      draw();
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
    line.value = "";
    for (const input of values.values()) input.value = "";
    kept.clear();
    draw();
  }

  /* ── Matrices: ask the size, leave boxes ────────────────────────────────
     A matrix is not typed with its brackets. The key asks how big, writes it
     with every entry a ? box, and selects the first; arrows go from box to box
     (cellMove, slot-typing.js) and typing fills the one that is selected. */
  let picker = null;
  function closePicker() { picker?.remove(); picker = null; }

  function placeMatrix(rows, cols, prefix = "") {
    const text = prefix + matrixTemplate(rows, cols);
    const a = line.selectionStart ?? line.value.length;
    const b = line.selectionEnd ?? a;
    line.value = line.value.slice(0, a) + text + line.value.slice(b);
    const first = a + prefix.length + 2;               // the first ? : after [[
    line.setSelectionRange(first, first + 1);
    line.focus();
    draw();
  }

  /** A mixed number as three boxes: whole, top, bottom — ? ?/? — the first one
      selected, so typing fills it and → goes on to the next. */
  function placeMixed() {
    const a = line.selectionStart ?? line.value.length;
    const b = line.selectionEnd ?? a;
    line.value = line.value.slice(0, a) + "? ?/?" + line.value.slice(b);
    line.setSelectionRange(a, a + 1);
    line.focus();
    draw();
  }

  /** → (or ←) from the end of one filled box to the next ? box: the one that
      comes next once a space and a / are stepped over. Selected whole, so what
      is typed replaces it. */
  function hopBox(dir) {
    const v = line.value, a = line.selectionStart ?? 0, b = line.selectionEnd ?? a;
    const m = dir > 0 ? /^\s*\/?\s*\?/.exec(v.slice(b)) : /\?\s*\/?\s*$/.exec(v.slice(0, a));
    if (!m) return false;
    const at = dir > 0 ? b + m[0].length - 1 : a - m[0].length;
    line.setSelectionRange(at, at + 1);
    line.focus();
    draw();
    return true;
  }

  /** mat 2x3 typed on the line becomes a 2 by 3 matrix of boxes. */
  function expandSize() {
    const at = line.selectionStart ?? 0;
    const m = /(^|[^A-Za-z])(det\s*)?mat(?:rix)?\s*(\d{1,2})\s*[x×*]\s*(\d{1,2})\s*$/i.exec(line.value.slice(0, at));
    if (!m) return false;
    const rows = Number(m[3]), cols = Number(m[4]);
    if (rows < 1 || cols < 1 || rows > 8 || cols > 8) return false;
    const start = m.index + m[1].length;
    const prefix = m[2] ? "det" : "";
    line.value = line.value.slice(0, start) + line.value.slice(at);
    line.setSelectionRange(start, start);
    placeMatrix(rows, cols, prefix);
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
    setTimeout(() => document.addEventListener("pointerdown", closePicker, { once: true }), 0);
  }

  const ACTS = { back: backspace, left: () => nudge(-1), right: () => nudge(1),
                 up: () => nudge(0, "up"), down: () => nudge(0, "down"),
                 matrix: (btn) => openPicker(btn), detmatrix: (btn) => openPicker(btn, "det"),
                 mixed: placeMixed,
                 sign: flipSign, clear: () => { line.value = ""; draw(); line.focus(); },
                 enter: submit };

  /** A key's face, typeset rather than spelled out. */
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
      else type(key.t ?? key.k, key.back ?? 0);
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

  line.addEventListener("input", draw);
  // The caret is ours to draw, so every way it can move has to redraw it: the
  // arrow keys and Home/End on a real keyboard, a selection, gaining or losing
  // the focus. `select` alone does not fire for a plain arrow press.
  for (const ev of ["keyup", "select", "focus", "blur"]) line.addEventListener(ev, draw);
  line.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); if (!expandSize()) submit(); return; }
    // mat 2x3 then Space: the same as the key.
    if (e.key === " " && expandSize()) { e.preventDefault(); return; }
    const dir = { ArrowRight: "right", ArrowLeft: "left", ArrowUp: "up", ArrowDown: "down" }[e.key];
    if (dir && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const hop = cellMove(line.value, line.selectionStart ?? 0, line.selectionEnd ?? 0, dir);
      if (hop) { e.preventDefault(); line.setSelectionRange(hop.a, hop.b); draw(); }
      else if ((dir === "right" || dir === "left") && hopBox(dir === "right" ? 1 : -1)) e.preventDefault();
    }
    // Tab goes to the next box to fill, when there is one.
    if (e.key === "Tab" && !e.shiftKey && line.value.includes("?") && hopBox(1)) e.preventDefault();
  });

  draw();

  return {
    focus() { line.focus(); },
    /** Draw what is typed again — the multiplication sign was switched. */
    redraw() { draw(); },
    set(src) { line.value = src; draw(); line.focus(); },
    /** Put the keypad into "both sides" mode ({ label, accept(node) }), or out
        of it with null. */
    setMode(m) {
      mode = m;
      banner.hidden = !m;
      banner.textContent = m ? m.label : "";
      give.hidden = true;
      line.value = "";
      draw();
      if (m) line.focus();
    },
    get mode() { return mode; },
    get value() { return line.value; },
  };
}
