/* ============================================================================
   THE TV'S CURTAIN — a theatre curtain that opens like a real one
   ----------------------------------------------------------------------------
   (*"The curtains dont look and open like real curtains. MS powerpoint give
   this highly detailed curtain opening"*)

     const c = makeCurtain(host);   // draws the curtain closed, filling `host`
     await c.open();                // gathers the drapes to the sides, then fades
     c.close();                     // back to closed, at once

   (*"Use white curtain"*, with a screen recording to match: white satin on a white
   ground, fine pleats with soft grey valleys, no pelmet; the drapes gather to the
   sides with the hem swinging in, then slide away off the edges.)

   Two satin drapes, each made of pleats: every pleat is a strip with its own
   light (a rounded fold catching light from the front, darker in its valleys).
   Opening, each drape is gathered towards its own side: the pleats crowd
   together and deepen, and the LOWER part of the drape lags behind the top
   (cloth is pulled from the rail, so its hem follows), which curves the inner
   edge the way a real curtain swings. Then both drapes slide out of the frame.
   Drawn in SVG, frame by frame, so nothing is faked by
   squashing a picture.
   ========================================================================== */

const W = 1600, H = 900;
const PLEATS = 22;               // per drape: fine satin folds

const NS = "http://www.w3.org/2000/svg";
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function defs() {
  const pleat = (id, a, b, c) => `<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0">`
    + `<stop offset="0" stop-color="${a}"/><stop offset=".22" stop-color="${b}"/><stop offset=".5" stop-color="${c}"/>`
    + `<stop offset=".78" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient>`;
  return `<defs>`
    + pleat("ppC1", "#d6d6d6", "#efefef", "#ffffff")
    + pleat("ppC2", "#cbcbcb", "#e9e9e9", "#fdfdfd")
    + pleat("ppC3", "#e1e1e1", "#f4f4f4", "#ffffff")
    /* light from above and the front: the drape darkens towards the floor */
    + `<linearGradient id="ppCshade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".2" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".02"/><stop offset="1" stop-color="#000" stop-opacity=".1"/></linearGradient>`
    + `<filter id="ppCsoft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="6"/></filter>`
    + `</defs>`;
}

/* one drape: `side` -1 (left) or +1 (right); p = how far it is gathered (0 closed .. 1 open) */
function drape(side, p, sway) {
  const out = [];
  const ROWS = 9;                       // the drape's edge is a curve through these heights
  const gathered = 0.13;                // a fully open drape keeps this much of the half-width
  /* how open each height is: the hem lags the rail, so lower rows open later */
  const at = (y) => {
    const lag = 0.32 * (y / H);
    const q = clamp01((p - lag) / (1 - lag * 0.6));
    return ease(q);
  };
  /* the inner edge's x for a height y, measured from the drape's own side */
  const width = (y) => (W / 2) * (1 - (1 - gathered) * at(y)) + sway * Math.sin((y / H) * Math.PI) * 18;
  /* the drape's outline, filled first in pale satin so no seam between two pleats ever shows the screen */
  const edge = Array.from({ length: ROWS + 1 }, (_, r) => {
    const y = (H * r) / ROWS, w = width(y);
    return side < 0 ? [w, y] : [W - w, y];
  });
  const body = side < 0
    ? `M0,0L${edge.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L")}L0,${H + 20}Z`
    : `M${W},0L${edge.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L")}L${W},${H + 20}Z`;
  out.push(`<path d="${body}" fill="#ececec"/>`);
  /* pleats of uneven width, so the cloth does not read as stripes */
  const cuts = [0];
  for (let k = 1; k < PLEATS; k++) cuts.push((k + 0.32 * Math.sin(k * 2.7 + 1.1)) / PLEATS);
  cuts.push(1);
  for (let k = 0; k < PLEATS; k++) {
    const a = cuts[k], b = cuts[k + 1];
    const left = [], right = [];
    for (let r = 0; r <= ROWS; r++) {
      const y = (H * r) / ROWS;
      const w = width(y);
      /* a gathered pleat bulges: its edges ripple a little more the tighter it is pulled */
      const pleatW = w / PLEATS;
      const ripple = Math.sin(r * 1.3 + k * 2.1) * Math.min(2 + 6 * at(y), pleatW * 0.22);
      const xa = a * w + ripple * (k ? 1 : 0), xb = b * w + ripple;
      left.push(side < 0 ? [xa, y] : [W - xa, y]);
      right.push(side < 0 ? [xb, y] : [W - xb, y]);
    }
    /* the hem: each pleat hangs a little lower in its middle */
    const hemDip = 10 + 12 * (1 - at(H));
    const lastL = left[left.length - 1], lastR = right[right.length - 1];
    const d = `M${left.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L")}`
      + `Q${((lastL[0] + lastR[0]) / 2).toFixed(1)},${(H + hemDip).toFixed(1)} ${lastR[0].toFixed(1)},${lastR[1].toFixed(1)}`
      + `L${right.slice().reverse().map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L")}Z`;
    out.push(`<path d="${d}" fill="url(#ppC${1 + ((k * 7) % 5) % 3})"/>`);
  }
  /* the whole drape lit from above, a touch greyer towards the hem */
  out.push(`<path d="${body}" fill="url(#ppCshade)"/>`);
  return out.join("");
}

export function makeCurtain(host) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  /* `out` 0..1 slides the gathered drapes off the edges of the frame */
  const draw = (p, sway = 0, out = 0) => {
    const dx = (out * out * W * 0.24).toFixed(1);
    svg.innerHTML = defs()
      + `<g transform="translate(-${dx},0)">${drape(-1, p, sway)}</g>`
      + `<g transform="translate(${dx},0)">${drape(1, p, -sway)}</g>`;
  };
  host.replaceChildren(svg);
  draw(0);
  let running = null;
  return {
    draw,
    close() { cancelAnimationFrame(running); host.style.opacity = "1"; host.style.display = ""; draw(0); },
    /** Gather the drapes to the sides (the hem swinging in), then slide them out of the frame. */
    open({ secs = 1.7, slide = 0.6, fade = 0.2 } = {}) {
      return new Promise((done) => {
        const t0 = performance.now();
        const tick = (now) => {
          if (!host.isConnected) { done(); return; }
          const t = (now - t0) / 1000;
          const p = clamp01(t / secs);
          /* the swing: the drapes overshoot a touch and settle */
          const sway = p < 1 ? Math.sin(p * Math.PI) * 0.9 : Math.max(0, 0.6 - (t - secs) * 2) * Math.sin((t - secs) * 9);
          /* the slide starts as the gather finishes, so the motion never stops dead */
          const out = ease(clamp01((t - secs * 0.85) / slide));
          draw(p, sway, out);
          if (t < secs * 0.85 + slide) { running = requestAnimationFrame(tick); return; }
          /* gone off the edges: let the curtain layer go */
          host.style.transition = `opacity ${fade}s ease`;
          host.style.opacity = "0";
          setTimeout(() => { host.style.display = "none"; host.style.transition = ""; done(); }, fade * 1000);
        };
        running = requestAnimationFrame(tick);
      });
    },
  };
}
