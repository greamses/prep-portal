/* ============================================================================
   THE SOROBAN, DRAWN — the site's one 2D soroban
   ----------------------------------------------------------------------------
   The look the user chose for Drills ("We already have a soroban in this
   website. Use the 2d look"): the Manipulatives workbench's measures
   (base-blocks/js/abacus.js) — orange timber frame, grey rods, a beam with a
   unit dot on every third rod, bicone beads in place colours (ones yellow,
   tens blue, hundreds green), the heaven bead darker.
   One drawing for Drills (a still soroban showing a number), PrepBot's soroban
   films and the practice board under them (beads that slide).

   Every bead is a <g data-bead="{place}{h|e0..e3}"> drawn AWAY from the beam;
   a bead that counts is moved toward the beam by a translate (the attribute
   for a still drawing; a style transform, which wins, for a moving one).
   ========================================================================== */
export const PITCH = 1.55, SLOT = 1.1, TRAVEL = 1.45, BAR_GAP = 1.0, EDGE = 1.1, BEAD_T = 1.0, BEAD_D = 1.3, EYE = 0.07, TIMBER = 0.55;
const PLACE = [["--accent-primary", "#f4c95d"], ["--accent-secondary", "#6fb7e8"], ["--accent-success", "#7cc47c"]];

/** The measures of a soroban with `rods` rods, in drawing units of `U` (place 0 = the ones, on the right). */
export function sorobanGeom(rods, U = 22) {
  const heaven = BAR_GAP + TRAVEL + BEAD_T / 2, earth = BAR_GAP + 3 * SLOT + TRAVEL + BEAD_T / 2;
  const W = rods * PITCH + EDGE * 2, H = heaven + earth + EDGE * 2, barY = EDGE + heaven;
  return {
    U, rods, W: W * U, H: H * U, barY: barY * U, travel: TRAVEL * U,
    cx: (p) => (EDGE + PITCH * (rods - 1 - p + 0.5)) * U,
    heavenY: (barY - (BAR_GAP + TRAVEL)) * U,                       // the five bead, away
    earthY: (i) => (barY + BAR_GAP + i * SLOT + TRAVEL) * U,          // the i-th one bead (0 = nearest the beam), away
    timber: TIMBER * U,
  };
}
/** how far each bead of a rod showing v is moved (toward the beam) */
export const heavenDy = (v, g) => (v >= 5 ? g.travel : 0);
export const earthDy = (i, v, g) => (i < v % 5 ? -g.travel : 0);

/** The drawing's inside (no <svg> wrapper): frame, rods, beam, dots, beads showing `value`. */
export function sorobanMarkup(rods, { value = 0, U = 22, labels = false } = {}) {
  const g = sorobanGeom(rods, U);
  const s = (v) => v.toFixed(1);
  const digits = String(Math.abs(value)).padStart(rods, "0").slice(-rods).split("").map(Number).reverse(); // [ones, tens, …]
  const bead = (x, y, fill, dark) => {
    const rr = (BEAD_D / 2) * U, tt = (BEAD_T / 2) * U, e = EYE * U;
    const pts = [[-rr, 0], [-rr * 0.62, -tt * 0.44], [-e, -tt], [e, -tt], [rr * 0.62, -tt * 0.44], [rr, 0], [rr * 0.62, tt * 0.44], [e, tt], [-e, tt], [-rr * 0.62, tt * 0.44]]
      .map(([a, b]) => `${s(x + a)},${s(y + b)}`).join(" ");
    return `<polygon class="sb-body" points="${pts}" fill="${fill}" stroke="rgba(42,39,35,.55)" stroke-width="${s(U / 22)}"/>`
      + `<path d="M${s(x - rr * 0.62)} ${s(y - tt * 0.3)} L${s(x + rr * 0.3)} ${s(y - tt * 0.3)}" stroke="rgba(255,255,255,.55)" stroke-width="${s(2 * U / 22)}" stroke-linecap="round" pointer-events="none"/>`
      + (dark ? `<polygon points="${pts}" fill="rgba(0,0,0,.34)" pointer-events="none"/>` : "");
  };
  const T = g.timber, k = U / 22;
  let out = "";
  out += `<rect data-sk="frame" x="${s(T / 2)}" y="${s(T / 2)}" width="${s(g.W - T)}" height="${s(g.H - T)}" fill="none" stroke="var(--accent-warning, #f0a868)" stroke-width="${s(T)}"/>`;
  out += `<rect x="${s(T / 2)}" y="${s(T / 2)}" width="${s(g.W - T)}" height="${s(g.H - T)}" fill="none" stroke="rgba(42,39,35,.35)" stroke-width="${s(1.2 * k)}"/>`;
  for (let p = 0; p < rods; p++) out += `<line data-sk="rod${p}" x1="${s(g.cx(p))}" y1="${s(T)}" x2="${s(g.cx(p))}" y2="${s(g.H - T)}" stroke="var(--text-tertiary, #9a948a)" stroke-width="${s(2.4 * k)}"/>`;
  out += `<rect data-sk="beam" x="${s(T)}" y="${s(g.barY - 0.2 * U)}" width="${s(g.W - 2 * T)}" height="${s(0.4 * U)}" fill="var(--accent-warning, #f0a868)" stroke="rgba(42,39,35,.4)" stroke-width="${s(k)}"/>`;
  out += `<rect x="${s(T)}" y="${s(g.barY - 0.2 * U)}" width="${s(g.W - 2 * T)}" height="${s(0.4 * U)}" fill="rgba(0,0,0,.28)" pointer-events="none"/>`;
  for (let p = 0; p < rods; p++) if (p % 3 === 0) out += `<circle data-sk="dot${p}" cx="${s(g.cx(p))}" cy="${s(g.barY)}" r="${s(2.6 * k)}" fill="#2a2723"/>`;
  for (let p = 0; p < rods; p++) {
    const [tok, fb] = PLACE[p % 3], fill = `var(${tok}, ${fb})`, x = g.cx(p), v = digits[p];
    const hd = heavenDy(v, g);
    out += `<g data-bead="${p}h"${hd ? ` transform="translate(0 ${s(hd)})"` : ""}>${bead(x, g.heavenY, fill, true)}</g>`;
    for (let i = 0; i < 4; i++) {
      const ed = earthDy(i, v, g);
      out += `<g data-bead="${p}e${i}"${ed ? ` transform="translate(0 ${s(ed)})"` : ""}>${bead(x, g.earthY(i), fill, false)}</g>`;
    }
  }
  return out;
}

/** A still soroban showing n on `rods` rods (Drills, the bee hall's thinking cloud). */
export function sorobanSvg(n, rods, U = 22) {
  const g = sorobanGeom(rods, U);
  return `<svg class="sor-abacus" viewBox="0 0 ${g.W.toFixed(1)} ${g.H.toFixed(1)}" width="${g.W.toFixed(1)}" height="${g.H.toFixed(1)}" role="img" aria-label="${Math.abs(n)} on a soroban">${sorobanMarkup(rods, { value: n, U })}</svg>`;
}

/** Slide the beads of one rod to show v (a moving soroban). `instant` skips the slide. */
export function slideRod(root, p, v, g, { instant = false, ms = 420 } = {}) {
  const set = (b, dy) => {
    if (!b) return;
    b.style.transition = instant ? "none" : `transform ${ms}ms cubic-bezier(.3,1.25,.55,1)`;
    b.style.transform = `translate(0px, ${dy}px)`;
  };
  set(root.querySelector(`[data-bead="${p}h"]`), heavenDy(v, g));
  for (let i = 0; i < 4; i++) set(root.querySelector(`[data-bead="${p}e${i}"]`), earthDy(i, v, g));
}
