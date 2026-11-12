/* ============================================================================
   STUDIO KEYS — one small way for a studio page to take the keyboard
   ----------------------------------------------------------------------------
     studioKeys({ ArrowUp: () => nudge("sl-sides", 1), p: () => flip("t-grid") },
                { help: "Keys: ↑ ↓ sides · P protractors …" })

   A key is its lower-case letter, or its name ("ArrowUp", "Enter", " ").
   Never while typing in a box, never with Ctrl / Alt / Cmd held, and never
   while a tool panel (the side rail's calculator, a written board…) has it.
   "?" shows the help in a small receipt for a few seconds.
   ========================================================================== */

const TYPING = "input:not([type=range]):not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable='true'], [contenteditable='']";

export function studioKeys(map, { help = "" } = {}) {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.(TYPING) || e.target.closest?.(".wb-panel, .wb-tools, .wb-tools__fly")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "?" && help) { e.preventDefault(); toast(help); return; }
    const fn = map[k];
    if (!fn) return;
    e.preventDefault();
    fn(e);
  });
}

/** Move a slider by `by` of its own steps, as a drag would (its input and change both fire). */
export function nudge(id, by) {
  const el = document.getElementById(id);
  if (!el || el.disabled) return;
  const step = Number(el.step) || 1;
  const min = el.min === "" ? -Infinity : Number(el.min);
  const max = el.max === "" ? Infinity : Number(el.max);
  el.value = String(Math.min(max, Math.max(min, Number(el.value) + by * step)));
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Tick or untick a checkbox, as a click would. */
export function flip(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.checked = !el.checked;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Press a button (or pick a radio) by selector. */
export const press = (sel) => document.querySelector(sel)?.click();

let shown = null;
let timer = 0;
export function toast(text) {
  if (!shown) {
    shown = document.createElement("div");
    shown.className = "pp-receipt";
    shown.setAttribute("role", "status");
    shown.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;max-width:min(40rem,92vw)";
    shown.innerHTML = `<div class="pp-receipt__paper" style="padding:.8rem 1.1rem;font-family:var(--font-mono,monospace);font-size:.8rem;line-height:1.5;color:#2a2723"></div>`;
    document.body.appendChild(shown);
  }
  shown.firstElementChild.textContent = text;
  shown.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => { shown.hidden = true; }, 6000);
}
