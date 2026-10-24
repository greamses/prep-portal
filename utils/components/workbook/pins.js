/* ============================================================================
   PINNED NOTES — a sticky note stuck anywhere on the page
   ----------------------------------------------------------------------------
   The pin key on the side rail (workbook/toolbar.js). Every press sticks another
   sticky note on the page; write on it, drag it by its tape to wherever it is
   wanted, change its paper, or take it down. Notes belong to the PAGE they were
   stuck on and are kept on this machine, so they are still there after a
   reload. Algebra Moves pins notes on its own canvas instead: it hands its
   own `pin` to the rail.
   ========================================================================== */

const KEY = () => `wb-pins:${location.pathname}`;
const PAPERS = 6;            // .pp-sticky--c0 … c5
let pins = null, styled = false;

const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY()) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
const save = () => { try { localStorage.setItem(KEY(), JSON.stringify(pins)); } catch { /* not kept */ } };
const X = `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
const SWATCH = `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M12 2.500c4.500 5 7 8 7 11a7 7 0 0 1-14 0c0-3 2.500-6 7-11z" fill="currentColor"/></svg>`;

function ensureStyle() {
  if (styled) return;
  styled = true;
  const st = document.createElement("style");
  st.textContent = `
.wb-pin { position: absolute; z-index: 58; width: 190px; padding: 1.5rem 0.8rem 0.8rem; box-sizing: border-box; display: block; }
.wb-pin__grip { position: absolute; left: 0; right: 0; top: 0; height: 1.5rem; cursor: grab; touch-action: none; }
.wb-pin__grip:active { cursor: grabbing; }
.wb-pin__text { min-height: 4.5rem; font: 600 0.9rem/1.35 "Shantell Sans", "Segoe Print", "Bradley Hand", cursive; outline: none; overflow-wrap: anywhere; white-space: pre-wrap; cursor: text; }
.wb-pin__text:empty::before { content: "Write here"; opacity: 0.4; }
.wb-pin__keys { position: absolute; right: 4px; top: 3px; display: flex; gap: 2px; }
.wb-pin__keys button { display: grid; place-items: center; width: 20px; height: 20px; padding: 0; color: #14130f; background: rgba(255,255,255,0.45); border: 0; border-radius: 0; cursor: pointer; opacity: 0.75; }
.wb-pin__keys button:hover, .wb-pin__keys button:focus-visible { opacity: 1; background: rgba(255,255,255,0.8); }
`;
  document.head.appendChild(st);
}

function mount(p) {
  const el = document.createElement("div");
  el.className = `wb-pin pp-sticky pp-sticky--tape pp-sticky--c${p.c % PAPERS}`;
  el.dataset.pin = p.id;
  el.style.left = `${p.x}px`;
  el.style.top = `${p.y}px`;
  el.innerHTML = `<div class="wb-pin__grip" aria-hidden="true"></div>
    <div class="wb-pin__keys"><button type="button" data-k="paper" aria-label="Change the paper" title="Change the paper">${SWATCH}</button><button type="button" data-k="del" aria-label="Take the note down" title="Take the note down">${X}</button></div>
    <div class="wb-pin__text" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Pinned note" spellcheck="true"></div>`;
  const text = el.querySelector(".wb-pin__text");
  text.textContent = p.t || "";
  text.addEventListener("input", () => { p.t = text.innerText; save(); });
  el.addEventListener("click", (e) => {
    const k = e.target.closest("[data-k]")?.dataset.k;
    if (k === "paper") { el.classList.remove(`pp-sticky--c${p.c % PAPERS}`); p.c = (p.c + 1) % PAPERS; el.classList.add(`pp-sticky--c${p.c}`); save(); }
    if (k === "del") { pins = pins.filter((q) => q !== p); el.remove(); save(); }
  });
  // carried by its tape
  let grab = null;
  const grip = el.querySelector(".wb-pin__grip");
  grip.addEventListener("pointerdown", (e) => {
    const r = el.getBoundingClientRect();
    grab = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    grip.setPointerCapture(e.pointerId);
    document.body.appendChild(el);                // on top of the others
    e.preventDefault();
  });
  grip.addEventListener("pointermove", (e) => {
    if (!grab) return;
    const w = Math.max(document.documentElement.scrollWidth, window.innerWidth);
    const h = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    p.x = Math.round(Math.max(0, Math.min(e.clientX + window.scrollX - grab.dx, w - el.offsetWidth)));
    p.y = Math.round(Math.max(0, Math.min(e.clientY + window.scrollY - grab.dy, h - 40)));
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
  });
  const drop = () => { if (grab) { grab = null; pins = pins.filter((q) => q !== p).concat(p); save(); } };
  grip.addEventListener("pointerup", drop);
  grip.addEventListener("pointercancel", drop);
  document.body.appendChild(el);
  return el;
}

/** Put back the notes this page had. Called once, when the rail is hung. */
export function restorePins() {
  ensureStyle();
  if (pins) return;
  pins = load();
  pins.forEach(mount);
}

/** Stick another note on the page, in view, a little off the last one. */
export function dropPin() {
  restorePins();
  const n = pins.length % 6;
  const p = {
    id: Date.now().toString(36), c: pins.length % PAPERS, t: "",
    x: Math.round(window.scrollX + Math.max(80, window.innerWidth / 2 - 95) + n * 22),
    y: Math.round(window.scrollY + Math.max(80, window.innerHeight / 3) + n * 22),
  };
  pins.push(p);
  save();
  mount(p).querySelector(".wb-pin__text").focus();
}
