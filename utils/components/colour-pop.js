/* ============================================================================
   OUR COLOUR WHEEL, WHEREVER A COLOUR IS CHOSEN
   ----------------------------------------------------------------------------
   colour-wheel.js is the site's own picker: a wheel, a lightness slider, the
   colour written down, and the house inks beside it. It used to be mounted in
   one place (the film editor's side panel). This opens the same wheel in a small
   receipt beside whatever is being coloured, so every colour choice can use it
   instead of the operating system's dialog, and the presets stay: they are the
   inks beside the wheel.

     pickColour(anchor, { value, presets, onChange, onClose }) → { close }
         the wheel in a receipt under `anchor`; `presets` are [{ name, hex }]

     upgradeColourInputs(root, { presets })
         every <input type="color"> under root becomes a swatch button that opens
         the wheel. The input stays in the page, hidden, and keeps its value and its
         `input` / `change` events, so the code that reads it needs no change (and
         setting `input.value` from code repaints the swatch).
   ========================================================================== */

import { mountWheel } from "/utils/components/colour-wheel.js";

/** The six inks the films, notes and wheel already share. */
export const HOUSE_INKS = [
  { name: "Ink", hex: "#14130f" },
  { name: "Plum", hex: "#7b4fa3" },
  { name: "Leaf", hex: "#2e8b46" },
  { name: "Sky", hex: "#2f6ea8" },
  { name: "Orange", hex: "#d9632b" },
  { name: "Teal", hex: "#1f8a8a" },
];

/* the wheel's stylesheet, added the first time one is needed; resolves once it is in (measuring a
   popover before that measures an unstyled block) */
function needCss() {
  const have = document.querySelector('link[href*="colour-wheel.css"]');
  if (have && (have.sheet || have.dataset.loaded)) return Promise.resolve();
  return new Promise((resolve) => {
    const l = have || document.createElement("link");
    l.addEventListener("load", () => { l.dataset.loaded = "1"; resolve(); }, { once: true });
    l.addEventListener("error", resolve, { once: true });
    if (!have) { l.rel = "stylesheet"; l.href = "/utils/components/colour-wheel.css"; document.head.appendChild(l); }
    else setTimeout(resolve, 400);
  });
}

let current = null;

export function pickColour(anchor, { value = "#2a2723", presets = HOUSE_INKS, onChange = () => {}, onClose = () => {} } = {}) {
  current?.close();
  const styled = needCss();

  const pop = document.createElement("div");
  pop.className = "pp-receipt cw-pop";
  pop.innerHTML = `<div class="pp-receipt__paper cw-pop__paper"></div>`;
  pop.style.visibility = "hidden";
  document.body.appendChild(pop);
  const wheel = mountWheel(pop.firstElementChild, { value, inks: presets, onChange });

  /* under the anchor, or over it when there is no room below; never off the window */
  const place = () => {
    const a = anchor.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const left = Math.max(8, Math.min(a.left, innerWidth - w - 8));
    let top = a.bottom + 8;
    if (top + h > innerHeight - 8) top = Math.max(8, a.top - h - 8);
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  };
  styled.then(() => { if (!pop.isConnected) return; place(); pop.style.visibility = ""; });
  addEventListener("resize", place);

  let closed = false;
  const away = (e) => { if (!pop.contains(e.target) && !anchor.contains(e.target)) close(); };
  const key = (e) => { if (e.key === "Escape") close(); };
  /* after this click has finished, or the click that opened it would close it */
  const arm = setTimeout(() => document.addEventListener("pointerdown", away, true), 0);
  document.addEventListener("keydown", key);

  function close() {
    if (closed) return;
    closed = true;
    clearTimeout(arm);
    document.removeEventListener("pointerdown", away, true);
    document.removeEventListener("keydown", key);
    removeEventListener("resize", place);
    wheel.destroy?.();
    pop.remove();
    if (current && current.pop === pop) current = null;
    onClose();
  }
  current = { close, pop };
  return { close, set: wheel.set };
}

/** Turn every native colour input under `root` into a swatch that opens the wheel. */
export function upgradeColourInputs(root = document, { presets = HOUSE_INKS } = {}) {
  needCss();
  root.querySelectorAll('input[type="color"]:not([data-cw])').forEach((input) => {
    input.dataset.cw = "1";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pp-plain cw-btn";
    btn.setAttribute("aria-label", input.title || input.getAttribute("aria-label") || "Colour");
    btn.dataset.tip = btn.getAttribute("aria-label");
    const paint = () => { btn.style.background = input.value; };
    /* code that sets input.value (a loaded drawing, a reset) repaints the swatch too */
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    Object.defineProperty(input, "value", {
      configurable: true,
      get() { return desc.get.call(this); },
      set(v) { desc.set.call(this, v); paint(); },
    });
    input.classList.add("cw-upgraded");
    input.before(btn);
    paint();
    btn.addEventListener("click", () => {
      pickColour(btn, {
        value: input.value,
        presets: input.dataset.presets ? JSON.parse(input.dataset.presets) : presets,
        onChange: (hex) => {
          desc.set.call(input, hex);
          paint();
          input.dispatchEvent(new Event("input", { bubbles: true }));
        },
        onClose: () => input.dispatchEvent(new Event("change", { bubbles: true })),
      });
    });
  });
}
