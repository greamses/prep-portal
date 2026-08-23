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
const KEYS = [
  [
    { k: "7" }, { k: "8" }, { k: "9" },
    { k: "÷", t: "/" }, { k: "x²", t: "^(2)", back: 0, title: "squared", math: "x^2" },
    { k: "( )", t: "()", back: 1, title: "brackets", math: "(?)" },
    { k: "⌫", act: "back", title: "Delete", tone: "warn" },
  ],
  [
    { k: "4" }, { k: "5" }, { k: "6" },
    { k: "×", t: "*" }, { k: "aᵇ", t: "^()", back: 1, title: "to the power of", math: "a^b" },
    { k: "x", t: "x", tone: "letter" }, { k: "y", t: "y", tone: "letter" },
  ],
  [
    { k: "1" }, { k: "2" }, { k: "3" },
    { k: "−", t: "-" },
    { k: "a⁄b", t: "()/()", back: 4, title: "fraction", math: "a/b" },
    { k: "←", act: "left", title: "Move left" },
    { k: "→", act: "right", title: "Move right" },
  ],
  [
    // A double-width zero, the way a calculator has one — which also makes the
    // row come to exactly seven columns.
    { k: "0", wide: true }, { k: ".", t: "." },
    { k: "±", act: "sign", title: "Change the sign" },
    { k: "+", t: "+" }, { k: "=", t: "=" },
    { k: "CLR", act: "clear", title: "Clear", tone: "warn" },
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

  const go = document.createElement("button");
  go.type = "button";
  go.className = "pp-sticky pp-note-btn am-go";
  go.textContent = "Put it on the canvas";

  host.append(preview, line, say, give, pad, go);

  const SIZE = 40;                // the drawing's font size, in CSS pixels
  const KEY_SIZE = 19;            // and on a key face, which has a cell to fit
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

    for (let i = 0; i < src.length; i++) {
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

  const hasHoles = (src) => /\(\s*\)/.test(src);

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
    const src = line.value;
    preview.textContent = "";
    anchors = [];
    // The <input> holding the source is not the thing on screen, so the ring
    // that says "this is where your typing goes" has to be put on the drawing.
    preview.classList.toggle("is-live", document.activeElement === line);

    if (!src.trim()) {
      letters([]);
      preview.classList.add("is-empty");
      say.textContent = "Type an equation, or an expression to tidy up. It is drawn here as you go.";
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

    letters(A.varsIn(eq).sort());

    const row = buildRow(eq, SIZE);
    const svg = paintRow(row, { live: false });
    anchors = anchorsOf(eq, row, fixed.back);
    drawCaret(svg);
    preview.appendChild(svg);
    followCaret();

    // Whatever the repair had to invent is exactly what is still to be typed.
    const todo =
      fixed.slots    ? "Fill in the empty box."
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
  function type(text, back = 0) {
    const a = line.selectionStart ?? line.value.length;
    const b = line.selectionEnd ?? a;
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
      // Sitting between an empty pair, take both.
      const pair = line.value.slice(a - 1, a + 1);
      const span = pair === "()" ? 1 : 0;
      line.value = line.value.slice(0, a - 1) + line.value.slice(a + span);
      line.setSelectionRange(a - 1, a - 1);
    }
    line.focus();
    draw();
  }

  function nudge(by) {
    const v = line.value;
    let at = line.selectionStart ?? 0;

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
    const src = line.value.trim();
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

  const ACTS = { back: backspace, left: () => nudge(-1), right: () => nudge(1),
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

  for (const row of KEYS) {
    const rail = document.createElement("div");
    rail.className = "am-pad__row";
    for (const key of row) {
      const btn = document.createElement("button");
      btn.type = "button";
      // A key that DOES something to the keypad rather than typing maths is
      // labelled, not set: it gets the mono face a caption has.
      btn.className = `am-key${key.act ? " am-key--act" : ""}` +
                      `${key.tone ? ` am-key--${key.tone}` : ""}${key.wide ? " am-key--wide" : ""}`;
      if (key.math) btn.appendChild(face(key.math));
      else btn.textContent = key.k;
      if (key.title) btn.title = key.title;
      btn.setAttribute("aria-label", key.title || key.k);
      // pointerdown, not click: never let the caret leave the line.
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (key.act) ACTS[key.act]();
        else type(key.t ?? key.k, key.back ?? 0);
      });
      rail.appendChild(btn);
    }
    pad.appendChild(rail);
  }

  go.addEventListener("pointerdown", (e) => { e.preventDefault(); submit(); });
  line.addEventListener("input", draw);
  // The caret is ours to draw, so every way it can move has to redraw it: the
  // arrow keys and Home/End on a real keyboard, a selection, gaining or losing
  // the focus. `select` alone does not fire for a plain arrow press.
  for (const ev of ["keyup", "select", "focus", "blur"]) line.addEventListener(ev, draw);
  line.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
  });

  draw();

  return {
    focus() { line.focus(); },
    set(src) { line.value = src; draw(); line.focus(); },
    get value() { return line.value; },
  };
}
