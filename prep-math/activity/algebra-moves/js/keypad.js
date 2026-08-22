/* ═══════════════════════════════════════════════════════════════════════════
   THE KEYPAD

   A calculator you type equations on, with the equation drawn properly above
   the keys as you go. The source line underneath is the site's own linear
   syntax — 1/2, x^2, 3x — the same thing students type everywhere else here,
   so nothing new has to be learned and read-back stays exact.

   The caret is a real <input> caret rather than one we draw. That is the whole
   trick of this file: arrow keys, selection, dragging, tap-to-place, undo and a
   physical keyboard all keep working for free, and the keys below are only ever
   inserting text at a selection. `inputmode="none"` keeps the phone's own
   keyboard out of the way, since we are providing one.

   Keys that build a shape — a fraction, a power, a bracket — insert the whole
   shape and put the caret inside it, because a half-typed (3x+5)/ is a parse
   error the preview would have to apologise for.
   ═══════════════════════════════════════════════════════════════════════════ */

import { parse } from "./parse.js";
import { renderStatic } from "./render.js";

/* label, what it types, and how far back into it the caret goes.
   `wide` marks the keys that earn a double cell. */
const KEYS = [
  [
    { k: "7" }, { k: "8" }, { k: "9" },
    { k: "÷", t: "/" }, { k: "x²", t: "^(2)", back: 0, title: "squared" },
    { k: "( )", t: "()", back: 1, title: "brackets" },
    { k: "⌫", act: "back", title: "Delete", tone: "warn" },
  ],
  [
    { k: "4" }, { k: "5" }, { k: "6" },
    { k: "×", t: "*" }, { k: "aᵇ", t: "^()", back: 1, title: "to the power of" },
    { k: "x", t: "x", tone: "letter" }, { k: "y", t: "y", tone: "letter" },
  ],
  [
    { k: "1" }, { k: "2" }, { k: "3" },
    { k: "−", t: "-" },
    { k: "a⁄b", t: "()/()", back: 4, title: "fraction" },
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
  line.setAttribute("aria-label", "The equation you are typing");

  const say = document.createElement("p");
  say.className = "am-keysay";

  const pad = document.createElement("div");
  pad.className = "am-pad";

  const go = document.createElement("button");
  go.type = "button";
  go.className = "am-key am-key--go am-key--go-wide";
  go.textContent = "Put it on the canvas";

  host.append(preview, line, say, pad, go);

  let lastGood = null;

  /* An empty pair of brackets is a slot still to be filled, not a syntax error.
     Showing it as a box is what makes the fraction key usable: you can see the
     shape you are building before you have finished building it. */
  const withHoles = (src) => src.replace(/\(\s*\)/g, "(?)");
  const hasHoles = (src) => /\(\s*\)/.test(src);

  /* ── The picture above the keys ──────────────────────────────────────── */
  function draw() {
    const src = line.value.trim();
    preview.textContent = "";

    if (!src) {
      say.textContent = "Type an equation. It will be drawn here as you go.";
      say.className = "am-keysay";
      lastGood = null;
      return;
    }

    let eq;
    try {
      eq = parse(withHoles(src));
    } catch (err) {
      // Keep the last good drawing on screen, greyed — a half-typed line
      // should not make the picture vanish on every other keystroke.
      if (lastGood) {
        const ghost = renderStatic(lastGood, 40);
        ghost.classList.add("is-stale");
        preview.appendChild(ghost);
      }
      say.textContent = err.message;
      say.className = "am-keysay is-no";
      return;
    }

    preview.appendChild(renderStatic(eq, 40));
    lastGood = eq;
    if (hasHoles(src)) {
      say.textContent = "Fill in the empty box.";
      say.className = "am-keysay";
    } else {
      say.textContent = "Ready.";
      say.className = "am-keysay is-ok";
    }
  }

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
    } else {
      const back = /\)(\/?)\($/.exec(v.slice(0, at));
      at = back ? at - back[0].length : Math.max(0, at - 1);
    }

    line.setSelectionRange(at, at);
    line.focus();
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
      eq = parse(withHoles(src));
    } catch (err) {
      say.textContent = err.message;
      say.className = "am-keysay is-no";
      return;
    }
    onSubmit?.(eq, src);
    line.value = "";
    lastGood = null;
    draw();
  }

  const ACTS = { back: backspace, left: () => nudge(-1), right: () => nudge(1),
                 sign: flipSign, clear: () => { line.value = ""; draw(); line.focus(); },
                 enter: submit };

  for (const row of KEYS) {
    const rail = document.createElement("div");
    rail.className = "am-pad__row";
    for (const key of row) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `am-key${key.tone ? ` am-key--${key.tone}` : ""}${key.wide ? " am-key--wide" : ""}`;
      btn.textContent = key.k;
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
