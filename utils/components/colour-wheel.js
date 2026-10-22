/* ============================================================================
   A COLOUR WHEEL
   ----------------------------------------------------------------------------
   The browser's own colour control is a button that opens the operating
   system's picker — a different shape on every machine, nothing like the rest
   of this site, and on a phone a sheet that covers what you are colouring. So
   this is ours: a wheel that is always open, beside the thing it is colouring,
   so a colour is chosen by looking at the drawing rather than at a dialog.

   HOW IT READS. Hue runs round the wheel and saturation runs out from the
   middle, which is the arrangement everybody already knows from a paint box:
   the centre is grey, the rim is as strong as the colour gets, and going round
   is going through the spectrum. Lightness is the slider under it, because it
   is the one of the three that is not a direction on a disc.

   THE HOUSE INKS SIT BESIDE IT. Six of them, and they are the right answer
   most of the time; matching one by eye on a wheel is a job nobody should
   have. The hex box is there for the time somebody has a colour written down.

     mountWheel(host, { value, inks, onChange }) → { set(hex), destroy() }

   `onChange` is called as the pointer moves, so what is being coloured keeps
   up with the hand.
   ========================================================================== */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const hex2 = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");

/** #rgb or #rrggbb → { h, s, l }, all 0–1 except h in degrees. */
export function hexToHsl(hex) {
  let h = String(hex || "").trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return { h: 0, s: 0, l: 0.1 };
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  return { h: (hue * 60 + 360) % 360, s, l };
}

/** { h, s, l } → #rrggbb. */
export function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const k = Math.floor(((h % 360) + 360) % 360 / 60);
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k] || [0, 0, 0];
  return `#${hex2((r + m) * 255)}${hex2((g + m) * 255)}${hex2((b + m) * 255)}`;
}

/**
 * THE DISC IS ALWAYS PAINTED AT HALF LIGHT, whatever colour is chosen.
 *
 * Painting it at the chosen lightness is the obvious thing and it is wrong:
 * pick the house ink, which is nearly black, and the whole wheel goes black
 * — every hue on it still there and none of them visible. A wheel is a map of
 * where the colours ARE, and a map has to stay legible when you are standing
 * in a dark corner of it. So the disc shows the spectrum at full strength and
 * the slider under it says how light the colour you are taking from it is.
 *
 * It is drawn pixel by pixel rather than with a conic gradient because the
 * saturation has to fall off towards the middle as well, and two gradients
 * stacked leave a grey cast at the rim on every browser that blends them in
 * sRGB.
 */
function paintDisc(canvas, l = 0.5) {
  const n = canvas.width;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  const img = ctx.createImageData(n, n);
  const mid = (n - 1) / 2;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const dx = x - mid;
      const dy = y - mid;
      const r = Math.sqrt(dx * dx + dy * dy) / mid;
      const i = (y * n + x) * 4;
      if (r > 1) { img.data[i + 3] = 0; continue; }
      const hue = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      const hexed = hslToHex((hue + 360) % 360, Math.min(1, r), l);
      img.data[i] = parseInt(hexed.slice(1, 3), 16);
      img.data[i + 1] = parseInt(hexed.slice(3, 5), 16);
      img.data[i + 2] = parseInt(hexed.slice(5, 7), 16);
      /* the last pixel-width of the rim is faded, so the disc has an edge
         rather than a staircase */
      img.data[i + 3] = r > 0.98 ? Math.round(255 * (1 - (r - 0.98) / 0.02)) : 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Hang a wheel on `host`.
 *
 *   value    the colour to start on
 *   inks     [{ name, hex }] — the swatches beside it, or none
 *   onChange called with a #rrggbb as the colour changes
 */
export function mountWheel(host, { value = "#2a2723", inks = [], onChange = () => {} } = {}) {
  let { h, s, l } = hexToHsl(value);
  const el = document.createElement("div");
  el.className = "cw";
  el.innerHTML = `
    <div class="cw__disc">
      <canvas class="cw__canvas" width="150" height="150" role="application"
              aria-label="Colour wheel: hue round, strength out from the middle"></canvas>
      <span class="cw__spot" aria-hidden="true"></span>
    </div>
    <label class="cw__light"><span>Light</span>
      <input type="range" min="2" max="98" step="1" value="${Math.round(l * 100)}" aria-label="How light"></label>
    <div class="cw__foot">
      <input class="cw__hex" value="${value}" spellcheck="false" aria-label="The colour, written down">
      <span class="cw__now" aria-hidden="true"></span>
    </div>
    ${inks.length ? `<div class="cw__inks">${inks.map((i) => `<button type="button" class="pp-plain cw__ink"`
      + ` style="background:${i.hex}" data-hex="${i.hex}" aria-label="${i.name}" data-tip="${i.name}"></button>`).join("")}</div>` : ""}`;
  host.appendChild(el);

  const canvas = el.querySelector(".cw__canvas");
  const spot = el.querySelector(".cw__spot");
  const light = el.querySelector("input[type=range]");
  const hexBox = el.querySelector(".cw__hex");
  const now = el.querySelector(".cw__now");

  const hex = () => hslToHex(h, s, l);
  /** Where the marker sits for the hue and strength now chosen. */
  function place() {
    const a = ((h - 90) * Math.PI) / 180;
    spot.style.left = `${50 + Math.cos(a) * s * 50}%`;
    spot.style.top = `${50 + Math.sin(a) * s * 50}%`;
    spot.style.background = hex();
    now.style.background = hex();
  }
  function tell(fromHex = false) {
    if (!fromHex) hexBox.value = hex();
    place();
    onChange(hex());
  }

  paintDisc(canvas);
  place();

  /* the disc is read in its own coordinates, so it works at any size */
  const pickAt = (e) => {
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    const rad = Math.min(0.5, Math.sqrt(dx * dx + dy * dy)) / 0.5;
    h = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
    s = clamp(rad, 0, 1);
    /* YOU GET THE COLOUR YOU CAN SEE. The disc is painted at half light, so
       from a near-black or near-white starting colour a click would hand back
       something nothing like the patch under the finger — click red, get a
       near-black olive. From a tone you can actually see on the disc the
       lightness is left alone, because changing hue without losing your shade
       is the other thing a wheel is for. */
    if (l < 0.18 || l > 0.88) {
      l = 0.5;
      light.value = "50";
    }
    tell();
  };
  let down = false;
  canvas.addEventListener("pointerdown", (e) => {
    down = true;
    canvas.setPointerCapture(e.pointerId);
    pickAt(e);
  });
  canvas.addEventListener("pointermove", (e) => { if (down) pickAt(e); });
  const up = () => { down = false; };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);

  light.addEventListener("input", () => {
    l = Number(light.value) / 100;
    tell();
  });

  hexBox.addEventListener("input", () => {
    const v = hexBox.value.trim();
    if (!/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v)) return;
    ({ h, s, l } = hexToHsl(v));
    light.value = String(Math.round(l * 100));
    tell(true);
  });

  el.addEventListener("click", (e) => {
    const ink = e.target.closest("[data-hex]")?.dataset.hex;
    if (!ink) return;
    ({ h, s, l } = hexToHsl(ink));
    light.value = String(Math.round(l * 100));
    tell();
  });

  return {
    el,
    set(v) {
      ({ h, s, l } = hexToHsl(v));
      light.value = String(Math.round(l * 100));
      hexBox.value = v;
      place();
    },
    destroy() { el.remove(); },
  };
}
