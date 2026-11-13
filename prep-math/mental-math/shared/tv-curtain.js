/* ============================================================================
   THE TV'S CURTAIN — a theatre curtain that opens like a real one
   ----------------------------------------------------------------------------
   (*"The curtains dont look and open like real curtains. MS powerpoint give
   this highly detailed curtain opening"*)

     const c = makeCurtain(host);   // draws the curtain closed, filling `host`
     await c.open();                // gathers the drapes to the sides, then fades
     c.close();                     // back to closed, at once

   Two velvet drapes, each made of pleats: every pleat is a strip with its own
   light (a rounded fold catching light from the front, darker in its valleys).
   Opening, each drape is gathered towards its own side: the pleats crowd
   together and deepen, and the LOWER part of the drape lags behind the top
   (cloth is pulled from the rail, so its hem follows), which curves the inner
   edge the way a real curtain swings. A scalloped valance with a gold fringe
   hangs across the top. Drawn in SVG, frame by frame, so nothing is faked by
   squashing a picture.
   ========================================================================== */

const W = 1600, H = 900;
const PLEATS = 13;               // per drape
const VALANCE = 112;             // the valance's depth

const NS = "http://www.w3.org/2000/svg";
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function defs() {
  const pleat = (id, a, b, c) => `<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0">`
    + `<stop offset="0" stop-color="${a}"/><stop offset=".22" stop-color="${b}"/><stop offset=".5" stop-color="${c}"/>`
    + `<stop offset=".78" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient>`;
  return `<defs>`
    + pleat("ppC1", "#3d070c", "#8e1820", "#c8343c")
    + pleat("ppC2", "#33060a", "#7d141b", "#b52a32")
    /* light from above and the front: the drape darkens towards the floor */
    + `<linearGradient id="ppCshade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".18" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient>`
    + `<linearGradient id="ppCval" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5a0c12"/><stop offset=".55" stop-color="#a5222b"/><stop offset="1" stop-color="#6d0f16"/></linearGradient>`
    + `<linearGradient id="ppCgold" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f7dd8a"/><stop offset=".5" stop-color="#d4a536"/><stop offset="1" stop-color="#8f6716"/></linearGradient>`
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
  for (let k = 0; k < PLEATS; k++) {
    const a = k / PLEATS, b = (k + 1) / PLEATS;
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
    out.push(`<path d="${d}" fill="url(#${k % 3 === 1 ? "ppC2" : "ppC1"})"/>`);
  }
  /* the whole drape in shade from top and bottom, and a soft shadow at its inner edge */
  const edge = Array.from({ length: ROWS + 1 }, (_, r) => {
    const y = (H * r) / ROWS, w = width(y);
    return side < 0 ? [w, y] : [W - w, y];
  });
  const body = side < 0
    ? `M0,0L${edge.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L")}L0,${H + 20}Z`
    : `M${W},0L${edge.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L")}L${W},${H + 20}Z`;
  out.push(`<path d="${body}" fill="url(#ppCshade)"/>`);
  return out.join("");
}

function valance() {
  /* three deep swags across the rail, a gold rope under them and a fringe */
  const swags = 3, sw = W / swags;
  let d = `M0,0H${W}V${VALANCE * 0.62}`;
  for (let i = swags - 1; i >= 0; i--) d += `Q${(i * sw + sw / 2).toFixed(1)},${(VALANCE * 1.08).toFixed(1)} ${(i * sw).toFixed(1)},${(VALANCE * 0.62).toFixed(1)}`;
  d += "Z";
  let rope = `M0,${VALANCE * 0.62}`;
  for (let i = 0; i < swags; i++) rope += `Q${(i * sw + sw / 2).toFixed(1)},${(VALANCE * 1.08).toFixed(1)} ${((i + 1) * sw).toFixed(1)},${(VALANCE * 0.62).toFixed(1)}`;
  let fringe = "";
  for (let x = 6; x < W; x += 14) {
    const i = Math.floor(x / sw), t = (x - i * sw) / sw;
    /* the rope's height under this x (a quadratic swag) */
    const y = VALANCE * 0.62 + 2 * t * (1 - t) * (VALANCE * 1.08 - VALANCE * 0.62) * 2;
    fringe += `<rect x="${x}" y="${(y + 4).toFixed(1)}" width="5" height="${18 + (x % 3) * 3}" fill="url(#ppCgold)"/>`;
  }
  const folds = Array.from({ length: 18 }, (_, k) => `<path d="M${(k * W / 18 + 40).toFixed(0)},0V${VALANCE * 0.55}" stroke="#000" stroke-opacity=".16" stroke-width="10" filter="url(#ppCsoft)"/>`).join("");
  return `<path d="${d}" fill="url(#ppCval)"/>${folds}`
    + `<path d="${rope}" fill="none" stroke="url(#ppCgold)" stroke-width="9" stroke-linecap="round"/>${fringe}`
    + `<rect x="0" y="0" width="${W}" height="10" fill="#3a070b"/>`;
}

export function makeCurtain(host) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  const back = `<rect width="${W}" height="${H}" fill="#14090a" opacity="0"/>`;
  const draw = (p, sway = 0) => {
    svg.innerHTML = defs() + back + drape(-1, p, sway) + drape(1, p, -sway) + valance();
  };
  host.replaceChildren(svg);
  draw(0);
  let running = null;
  return {
    draw,
    close() { cancelAnimationFrame(running); host.style.opacity = "1"; host.style.display = ""; draw(0); },
    /** Gather the drapes to the sides (with a little sway as they come to rest), then let the curtain go. */
    open({ secs = 1.6, fade = 0.45 } = {}) {
      return new Promise((done) => {
        const t0 = performance.now();
        const tick = (now) => {
          if (!host.isConnected) { done(); return; }
          const t = (now - t0) / 1000;
          const p = clamp01(t / secs);
          /* the swing: the drapes overshoot a touch and settle */
          const sway = p < 1 ? Math.sin(p * Math.PI) * 0.9 : Math.max(0, 0.6 - (t - secs) * 2) * Math.sin((t - secs) * 9);
          draw(p, sway);
          if (t < secs + 0.35) { running = requestAnimationFrame(tick); return; }
          /* then the whole curtain fades away to give the lesson the screen */
          host.style.transition = `opacity ${fade}s ease`;
          host.style.opacity = "0";
          setTimeout(() => { host.style.display = "none"; host.style.transition = ""; done(); }, fade * 1000);
        };
        running = requestAnimationFrame(tick);
      });
    },
  };
}
