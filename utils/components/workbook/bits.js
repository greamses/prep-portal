/* ============================================================================
   PRINTABLE WORKBOOK — BIT BULBS on a breadboard
   ----------------------------------------------------------------------------
   A row of LEDs pushed into a breadboard, each one a BIT: lit is 1, dark is 0.
   Under each is what it is worth — 8, 4, 2, 1 — so the number the row shows is
   the worths of the lit ones added up.

   On paper the bulbs are outlines to colour in (or, for a "read the bulbs"
   question, printed already lit). On screen a tap lights a bulb and another
   tap puts it out.

     binary   the worths double leftwards: … 16 8 4 2 1
     octal    the bulbs stand in THREES, each three worth 4 2 1: one octal
              digit is exactly three bits, which is why octal is used at all

   It is marked by the NUMBER the bulbs show (bitsRight), read as one binary
   number from left to right whichever way the worths are printed.

     [data-bits]   how many bulbs; data-mode "binary" | "octal"
   ========================================================================== */

/** The bulbs as one binary number. */
export const bitsValue = (bits) => bits.reduce((v, b) => v * 2 + (b ? 1 : 0), 0);
export const bitsRight = (bits, value) => bitsValue(bits || []) === value;
/** n as its bits, n bulbs wide. */
export const toBits = (value, n) => Array.from({ length: n }, (_, i) => (value >> (n - 1 - i)) & 1);

const worths = (n, mode) => Array.from({ length: n }, (_, i) => (mode === "octal" ? [4, 2, 1][i % 3] : 2 ** (n - 1 - i)));

/**
 * The strip of bulbs.
 *   n       how many
 *   mode    "binary" | "octal"
 *   lit     a number to show already lit (a picture to READ: not tappable)
 */
export function bitsHtml({ n, mode = "binary", lit = null }) {
  const w = worths(n, mode);
  const on = lit == null ? null : toBits(lit, n);
  const leds = w.map((v, i) =>
    `${mode === "octal" && i % 3 === 0 && i ? '<span class="bt-gap"></span>' : ""}` +
    `<span class="bt-led${on && on[i] ? " is-on" : ""}"><i></i><b>${v}</b></span>`).join("");
  const attrs = lit == null ? ` data-bits="${n}" data-mode="${mode}"` : "";
  return `<div class="bt-board"${attrs}><div class="bt-row">${leds}</div></div>`;
}

/**
 *   mountBits(el, { saved, onChange })
 *     saved                 [0, 1, 1, 0 …] or null
 *     onChange(now, before) after every tap
 *   → { bits(), set(b), clear(), dispose() }
 */
export function mountBits(el, { saved = null, onChange = () => {} } = {}) {
  const n = Number(el.dataset.bits);
  let bits = Array.isArray(saved) && saved.length === n ? saved.slice() : Array(n).fill(0);
  const leds = () => [...el.querySelectorAll(".bt-led")];
  el.classList.add("is-live");

  const paint = () => leds().forEach((led, i) => {
    led.classList.toggle("is-on", !!bits[i]);
    led.setAttribute("role", "switch");
    led.setAttribute("aria-checked", String(!!bits[i]));
    led.setAttribute("aria-label", `the bulb worth ${led.querySelector("b").textContent}`);
    led.tabIndex = 0;
  });
  const flip = (i) => {
    const before = bits.slice();
    bits[i] = bits[i] ? 0 : 1;
    paint();
    onChange(bits.slice(), before);
  };
  const click = (e) => {
    const led = e.target.closest(".bt-led");
    if (led) flip(leds().indexOf(led));
  };
  const key = (e) => {
    const led = e.target.closest?.(".bt-led");
    if (led && (e.key === " " || e.key === "Enter")) { e.preventDefault(); flip(leds().indexOf(led)); }
  };
  el.addEventListener("click", click);
  el.addEventListener("keydown", key);
  paint();

  return {
    bits: () => bits.slice(),
    set(b) { bits = Array.isArray(b) && b.length === n ? b.slice() : Array(n).fill(0); paint(); },
    clear() { bits = Array(n).fill(0); paint(); },
    dispose() {
      el.removeEventListener("click", click);
      el.removeEventListener("keydown", key);
      el.classList.remove("is-live");
      leds().forEach((led) => { led.classList.remove("is-on"); led.removeAttribute("role"); led.removeAttribute("tabindex"); led.removeAttribute("aria-checked"); });
    },
  };
}
