/* ============================================================================
   Equations in an answer
   ----------------------------------------------------------------------------
   In any answer field on the paper (a blank, a short answer, a theory answer, a page of the
   answer booklet) Alt + = opens an equation box, the same key and the same way of writing as in
   the sticky notes: type it as you would say it (1/2, x^2, sqrt(x), 3x+2=11), see it typeset as
   you type, and Enter puts it in. Esc closes the box and leaves the answer alone.

   It goes into the answer as TeX between dollar signs ($\\frac{1}{2}$), so the answer is still
   plain text everywhere it is kept and sent. Under any field that holds one, the answer is shown
   again typeset, and that is what is printed.

   The notes' own pieces do the work: math-linear.js turns the typing into TeX, sticky-math.js
   draws it with MathJax (and asks for MathJax by itself if the page has none yet).
   ========================================================================== */

import { toTeX } from "/utils/components/math-linear.js";
import { mathNode, mathReady, preloadMath, whenMathDrawn } from "/utils/components/sticky-math.js";

const FIELD = "input.xp-in, textarea.xp-ta";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** An equation as an element, with the "tap to edit" tooltip the notes give it taken off. */
function drawn(tex) {
  const n = mathNode(tex);
  n.removeAttribute("title");
  n.removeAttribute("contenteditable");
  return n;
}

/** The answer as nodes: its words as text, each $…$ as a typeset equation. */
function renderAnswer(value) {
  const frag = document.createDocumentFragment();
  String(value).split(/(\$[^$]+\$)/).forEach((part) => {
    if (!part) return;
    if (part.length > 2 && part[0] === "$" && part.endsWith("$")) frag.appendChild(drawn(part.slice(1, -1)));
    else frag.appendChild(document.createTextNode(part));
  });
  return frag;
}

/** Keep the typeset copy under one field in step with what is in it. */
export function refreshField(field) {
  const next = field.nextElementSibling;
  const mirror = next && next.classList.contains("xp-eqshow") ? next : null;
  const has = field.value.includes("$");
  field.classList.toggle("has-eq", has);
  if (!has) { mirror?.remove(); return; }
  const box = mirror || Object.assign(document.createElement(field.tagName === "TEXTAREA" ? "div" : "span"), { className: "xp-eqshow" });
  box.setAttribute("data-nomath", "");
  box.setAttribute("aria-hidden", "true");
  box.replaceChildren(renderAnswer(field.value));
  if (!mirror) field.after(box);
  /* an equation set before MathJax arrived is its source for now; set it when the picture lands */
  if (!mathReady()) { preloadMath(); whenMathDrawn(() => refreshField(field)); }
  else if (box.querySelector(".is-source")) whenMathDrawn(() => refreshField(field));
}

/** Every field under `root` that holds an equation. */
export function refreshAll(root) {
  root.querySelectorAll(FIELD).forEach((f) => { if (f.value.includes("$") || f.classList.contains("has-eq")) refreshField(f); });
}

/* ── the box ───────────────────────────────────────────────────────────── */

const CSS = `
/* the box is a small .pp-receipt (two classes, since .pp-receipt sets position: relative) */
.pp-eqpop.pp-receipt { position: fixed; z-index: 2147482000; width: min(24rem, 92vw); }
.pp-eqpop .pp-receipt__paper { --tooth: 9px; padding: 1.35rem 1.5rem 1.25rem; font-family: var(--font-mono, "JetBrains Mono", monospace); }
.pp-eqpop input { width: 100%; box-sizing: border-box; margin-top: 0.55rem; padding: 0.45rem 0.55rem; font: 600 0.95rem var(--font-mono, "JetBrains Mono", monospace); border: var(--border-subtle, 1px solid rgba(42, 39, 35, 0.12)); border-radius: 0; background: var(--surface-secondary, #f4f0e8); color: var(--ink, #2a2723); }
.pp-eqpop input:focus { outline: 2px solid color-mix(in srgb, var(--accent-secondary, #6fb7e8) 70%, transparent); outline-offset: 1px; }
.pp-eqpop__view { min-height: 2.6rem; margin: 0.55rem 0; padding: 0.4rem 0.55rem; background: var(--surface-secondary, #f4f0e8); color: var(--ink, #2a2723); font-size: 1.25rem; overflow-x: auto; }
.pp-eqpop__view .is-source { font: 600 0.8rem var(--font-mono, monospace); opacity: 0.7; }
.pp-eqpop__hint { margin: 0; font-size: 0.68rem; font-weight: 400; color: var(--text-secondary, #6b655c); }
.pp-eqpop__row { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.6rem; }
.xp-eqshow { display: inline-block; margin-left: 1.2mm; vertical-align: baseline; color: #1d1b18; }
div.xp-eqshow { display: block; margin: 0.5mm 0 2mm; padding: 1.2mm 2mm; border-left: 0.9mm solid var(--c, #b9b2a5); background: #f6f3ec; white-space: pre-wrap; line-height: 1.8; }
.xp-eqshow .pp-note__eq { display: inline-block; vertical-align: middle; }
.xp-eqshow .pp-note__eq svg { display: inline-block; vertical-align: middle; }
@media print {
  .pp-eqpop { display: none !important; }
  .xp-ta.has-eq, .xp-in.has-eq { display: none !important; }
  div.xp-eqshow { background: #f6f3ec !important; border-left: 0.9mm solid #b9b2a5 !important; }
}`;

let open = null;

/** Open the equation box under a field; Enter puts the equation into the answer at the caret. */
export function openEquation(field) {
  if (open) open.close();
  document.getElementById("pp-eqpop-css") || document.head.appendChild(Object.assign(document.createElement("style"), { id: "pp-eqpop-css", textContent: CSS }));
  preloadMath();
  const from = field.selectionStart ?? field.value.length, to = field.selectionEnd ?? from;

  const pop = document.createElement("div");
  pop.className = "pp-eqpop pp-receipt";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "Write an equation");
  pop.innerHTML = `<div class="pp-receipt__paper">
    <span class="pp-pill pp-pill--static">Equation</span>
    <input type="text" autocomplete="off" spellcheck="false" aria-label="The equation, typed as you would say it" placeholder="for example 1/2 or x^2 or sqrt(x)" />
    <div class="pp-eqpop__view" aria-hidden="true"></div>
    <p class="pp-eqpop__hint">Enter puts it in your answer. Esc closes this without it.</p>
    <div class="pp-eqpop__row"><button type="button" class="pp-btn pp-btn--ghost" data-no>Cancel</button><button type="button" class="pp-btn" data-ok>Put it in</button></div>
  </div>`;
  document.body.appendChild(pop);
  /* the field in view first (it may be anywhere on a long paper), then the box beside it, kept on screen */
  field.scrollIntoView({ block: "center", behavior: "instant" });
  const r = field.getBoundingClientRect();
  const h = pop.offsetHeight, w = pop.offsetWidth;
  pop.style.left = `${Math.max(8, Math.min(r.left, innerWidth - w - 8))}px`;
  const below = r.bottom + 8;
  const top = below + h > innerHeight - 8 ? r.top - h - 8 : below;
  pop.style.top = `${Math.max(8, Math.min(top, innerHeight - h - 8))}px`;

  const input = pop.querySelector("input"), view = pop.querySelector(".pp-eqpop__view");
  const show = () => {
    const tex = toTeX(input.value);
    view.replaceChildren(tex ? drawn(tex) : "");
    if (!mathReady() || view.querySelector(".is-source")) whenMathDrawn(show);
  };
  const close = () => { pop.remove(); open = null; document.removeEventListener("pointerdown", away, true); };
  const away = (e) => { if (!pop.contains(e.target)) close(); };
  const put = () => {
    const tex = toTeX(input.value);
    close();
    field.focus();
    if (!tex) return;
    const piece = `$${tex}$`;
    field.value = field.value.slice(0, from) + piece + field.value.slice(to);
    const at = from + piece.length;
    field.setSelectionRange(at, at);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  };
  input.addEventListener("input", show);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); put(); }
    else if (e.key === "Escape") { e.preventDefault(); close(); field.focus(); }
    e.stopPropagation(); // the paper's own keys are not for here
  });
  pop.querySelector("[data-ok]").addEventListener("click", put);
  pop.querySelector("[data-no]").addEventListener("click", () => { close(); field.focus(); });
  document.addEventListener("pointerdown", away, true);
  open = { close };
  input.focus();
}

export const isAltEquals = (e) => e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "=" || e.key === "+" || e.code === "Equal");
export const isAnswerField = (el) => !!el && typeof el.matches === "function" && el.matches(FIELD);
