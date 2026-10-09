/* ============================================================================
   CHEMISTRY BENCH — the glassware, drawn
   ----------------------------------------------------------------------------
   Every piece that can stand on the bench: test tubes, beakers, a conical
   flask, reagent bottles, jars of solids, dropper bottles, a Bunsen burner,
   splints, litmus paper and a test-tube rack. All of it is our own SVG.

   A VESSEL is drawn from a PROFILE — its half-width at each height, from the
   bottom up. One profile gives the outline, the clip the liquid sits behind,
   the highlight that runs down the wall, and the width of the meniscus at any
   level, so a conical flask and a test tube are the same code with different
   numbers.

   Local space: x = 0 is the piece's centre line, y = 0 is where it stands,
   up is negative. The bench (main.js) puts a piece somewhere with a CSS
   transform; nothing here knows where it is.

   Glass is drawn light-on-dark because the bench is a dark slate — that is
   what lets clear glass be seen at all. Chemical colours come from chem.js.
   ========================================================================== */

import { speciate, look, sediment, newTube, add, reagent, REAGENTS } from "./chem.js";

const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const f1 = (n) => Number(n.toFixed(1));

// ── profiles ────────────────────────────────────────────────────────────────
/** A round-bottomed tube: radius R, height H. */
function tubeProfile(R, H) {
  const p = [];
  for (let k = 0; k <= 8; k++) {
    const a = (k / 8) * (Math.PI / 2);
    p.push([f1(-(R - R * Math.cos(a))), f1(R * Math.sin(a))]);
  }
  p.push([-H, R]);
  return p;
}
const beakerProfile = (R, H) => [[0, R - 7], [-2, R - 2.5], [-7, R], [-H, R]];
/** A bulb with a neck: a sphere of radius R whose centre is `cy` above the bench (cy < R cuts it flat). */
function bulb(R, cy, neckR, neckTop) {
  const p = [];
  const a0 = cy < R ? Math.acos(cy / R) : 0;
  const a1 = Math.PI - Math.asin(neckR / R);
  for (let k = 0; k <= 14; k++) {
    const a = a0 + ((a1 - a0) * k) / 14;
    p.push([f1(-(cy - R * Math.cos(a))), f1(R * Math.sin(a))]);
  }
  p.push([-neckTop, neckR], [-(neckTop + 3), neckR + 3]);
  return p;
}
/** A measuring cylinder: the tube stands on a foot 8 thick. */
const cylProfile = (R, H) => [[-8, R - 3], [-10.5, R], [-H, R], [-(H + 3), R + 2.5]];

/** The half-width of a profile at height y. */
export function rAt(P, y) {
  if (y >= P[0][0]) return P[0][1];
  for (let i = 1; i < P.length; i++) {
    const [y1, r1] = P[i - 1], [y2, r2] = P[i];
    if (y <= y1 && y >= y2) return y1 === y2 ? r2 : r1 + ((r2 - r1) * (y1 - y)) / (y1 - y2);
  }
  return P[P.length - 1][1];
}
/** The closed outline of a profile. */
function outline(P, open = false) {
  const left = P.map(([y, r]) => `${f1(-r)} ${y}`);
  const right = [...P].reverse().map(([y, r]) => `${f1(r)} ${y}`);
  return open ? `M${left.reverse().join("L")}L${right.reverse().join("L")}` : `M${left.join("L")}L${right.join("L")}z`;
}
/** A line that follows one wall, a little inside it: the shine on the glass. */
/** A strip between two insets of one wall: a highlight with some width to it. */
function band(P, side, a, b, from, to) {
  const outer = wall(P, side, a, from, to).slice(1).split("L");
  const inner = wall(P, side, b, from, to).slice(1).split("L").reverse();
  return `M${outer.join("L")}L${inner.join("L")}z`;
}
function wall(P, side, inset, from, to) {
  const top = P[P.length - 1][0];
  const lo = top * to, hi = top * from;          // up is negative: lo is the higher end
  const ys = [lo, ...P.map(([y]) => y).filter((y) => y > lo && y < hi), hi].sort((a, b) => a - b);
  return "M" + ys.map((y) => `${f1(side * Math.max(0, rAt(P, y) - inset))} ${f1(y)}`).join("L");
}

// ── vessels ─────────────────────────────────────────────────────────────────
// cap = portions of liquid it holds; fill = how far up the glass "full" comes
export const VESSELS = {
  tube: { name: "Test tube", cap: 12, g: 18, profile: tubeProfile(13, 150), fill: 0.86, rack: true, invert: 1.5 },
  boil: { name: "Boiling tube", cap: 25, g: 30, profile: tubeProfile(18, 176), fill: 0.86, invert: 3 },
  beaker100: { name: "Beaker (100 mL)", cap: 50, g: 48, profile: beakerProfile(40, 96), fill: 0.84, flat: true, spout: true, marks: [[20, 0.2], [40, 0.4], [60, 0.6], [80, 0.8]], volume: "100 mL" },
  beaker250: { name: "Beaker (250 mL)", cap: 125, g: 96, profile: beakerProfile(55, 132), fill: 0.84, flat: true, spout: true, marks: [[50, 0.2], [100, 0.4], [150, 0.6], [200, 0.8]], volume: "250 mL" },
  beaker500: { name: "Beaker (500 mL)", cap: 250, g: 180, profile: beakerProfile(68, 150), fill: 0.84, flat: true, spout: true, marks: [[100, 0.2], [200, 0.4], [300, 0.6], [400, 0.8]], volume: "500 mL" },
  flask100: { name: "Conical flask (100 mL)", cap: 50, g: 52, profile: [[0, 40], [-3, 44], [-8, 45], [-68, 15], [-78, 13], [-114, 13], [-117, 16]], fill: 0.58, flat: true, marks: [[50, 0.5], [75, 0.75]], volume: "100 mL" },
  flask: { name: "Conical flask (250 mL)", cap: 125, g: 104, profile: [[0, 54], [-3, 59], [-9, 60], [-92, 19], [-104, 17], [-150, 17], [-153, 20]], fill: 0.6, flat: true, marks: [[100, 0.4], [150, 0.6], [200, 0.8]], volume: "250 mL" },
  rbf: { name: "Round-bottom flask", cap: 125, g: 92, profile: bulb(52, 52, 15, 166), fill: 0.5, volume: "250 mL" },
  fbf: { name: "Flat-bottom flask", cap: 125, g: 96, profile: bulb(52, 46, 15, 160), fill: 0.5, flat: true, foot: 22, volume: "250 mL" },
  vol100: { name: "Volumetric flask (100 mL)", cap: 50, g: 58, profile: bulb(40, 36, 7.5, 178), fill: 0.83, flat: true, foot: 15, ring: -150, volume: "100 mL" },
  cyl10: { name: "Measuring cylinder (10 mL)", cap: 5, g: 24, profile: cylProfile(9, 124), fill: 0.86, floor: 8, footR: 24, spout: true, marks: [[2, 0.2], [4, 0.4], [6, 0.6], [8, 0.8]] },
  cyl100: { name: "Measuring cylinder (100 mL)", cap: 50, g: 110, profile: cylProfile(16, 196), fill: 0.86, floor: 8, footR: 34, spout: true, marks: [[20, 0.2], [40, 0.4], [60, 0.6], [80, 0.8]] },
  gasjar: { name: "Gas jar", invert: 8, cap: 150, g: 210, profile: [[0, 34], [-2, 38], [-6, 40], [-150, 40], [-152, 47], [-156, 47]], fill: 0.86, flat: true },
  dish: { name: "Evaporating dish", cap: 30, g: 62, profile: [[0, 20], [-2, 32], [-10, 48], [-26, 59], [-30, 61]], fill: 0.74, flat: true, foot: 18, material: "porcelain" },
  crucible: { name: "Crucible", cap: 10, g: 24, profile: [[0, 14], [-2, 17], [-40, 26], [-43, 27]], fill: 0.8, flat: true, foot: 13, material: "porcelain" },
  mortar: { name: "Mortar and pestle", cap: 30, g: 240, profile: [[0, 26], [-3, 35], [-12, 46], [-40, 58], [-46, 60]], fill: 0.7, flat: true, foot: 24, material: "porcelain",
    front: `<path d="M12 -30L46 -88" stroke="#eef1f4" stroke-width="10" stroke-linecap="round"/><path d="M14 -30L47 -86" stroke="#fff" stroke-opacity="0.5" stroke-width="2" stroke-linecap="round"/><circle cx="11" cy="-28" r="8" fill="#e3e7ec"/>`,
    box: { x0: -66, y0: -98, x1: 66, y1: 8 } },
  // A burette and a separating funnel cannot stand up: clamp them in a retort stand. The tap is pressed.
  burette: {
    name: "Burette (50 mL)", cap: 25, g: 0, fixed: true, tap: true, grip: 70, profile: [[-36, 2.5], [-44, 7], [-310, 7], [-313, 9]], floor: 36, fill: 0.972, shadow: 12,
    box: { x0: -26, y0: -322, x1: 26, y1: 6 },
    front: `<path d="M-2.5 -24L-1.1 0h2.2L2.5 -24z" fill="#fff" fill-opacity="0.14" stroke="#fff" stroke-opacity="0.65" stroke-width="0.8"/>
      ${(() => { let m = ""; for (let n = 0; n <= 50; n++) { const y = (-302 + (n / 50) * 258).toFixed(1); const w = n % 10 === 0 ? 7 : n % 5 === 0 ? 5 : 3; m += `<path class="cl-mark" d="M${-w} ${y}H0"/>`; if (n % 10 === 0) m += `<text class="cl-mark-n" x="-9.5" y="${(Number(y) + 2.4).toFixed(1)}" text-anchor="end">${n}</text>`; } return m; })()}`,
    over: `<g class="cl-tap"><rect x="-6" y="-37" width="12" height="13" rx="2.5" fill="#dfe6ee" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/><rect class="cl-tap-key" x="-17" y="-33.5" width="34" height="6" rx="3" fill="#3d7fd0"/><rect x="-26" y="-50" width="52" height="40" fill="transparent"/></g>`,
  },
  sepfunnel: {
    name: "Separating funnel", cap: 50, g: 0, fixed: true, tap: true, grip: 150, floor: 30, fill: 0.86, shadow: 30,
    profile: [[-30, 3], [-44, 7], [-92, 36], [-132, 45], [-164, 38], [-182, 15], [-204, 13], [-207, 16]],
    box: { x0: -50, y0: -232, x1: 50, y1: 6 },
    front: `<path d="M-2.5 -17L-1.2 0h2.4L2.5 -17z" fill="#fff" fill-opacity="0.14" stroke="#fff" stroke-opacity="0.65" stroke-width="0.8"/>
      <path d="M-10 -221h20l-2.5 14h-15z" fill="url(#g-frost)" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/><rect x="-13" y="-229" width="26" height="9" rx="3" fill="url(#g-frost)"/>`,
    over: `<g class="cl-tap"><rect x="-6" y="-31" width="12" height="14" rx="2.5" fill="#dfe6ee" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/><rect class="cl-tap-key" x="-17" y="-27" width="34" height="6" rx="3" fill="#3d7fd0"/><rect x="-26" y="-44" width="52" height="40" fill="transparent"/></g>`,
  },
  // the flask a distillation starts in: a side arm for the vapour to leave by
  distflask: {
    name: "Distilling flask", cap: 125, g: 96, profile: bulb(46, 46, 13, 152), fill: 0.5, grip: 22, volume: "250 mL", arm: [72, -108],
    box: { x0: -52, y0: -164, x1: 78, y1: 8 },
    front: `<path d="M12 -128L72 -108" stroke="#fff" stroke-opacity="0.62" stroke-width="9" stroke-linecap="round"/><path d="M12 -128L72 -108" stroke="#2f3540" stroke-width="6.4" stroke-linecap="round"/><path d="M16 -129.500L68 -112" stroke="#fff" stroke-opacity="0.35" stroke-width="1.2" stroke-linecap="round"/>`,
  },
  // filled with water, an upturned jar stands in it to collect a gas
  trough: {
    name: "Trough", cap: 300, g: 480, profile: beakerProfile(118, 78), fill: 0.82, flat: true, shadow: 124,
    slots: [[46, -12]], slotFits: (d) => Boolean(d.invert), upturns: true,
    back: `<rect x="14" y="-12" width="64" height="9" rx="2" fill="#fff" fill-opacity="0.2" stroke="#fff" stroke-opacity="0.35" stroke-width="0.7"/>`,
  },
  watch: { name: "Watch glass", cap: 5, g: 20, profile: [[0, 10], [-3, 32], [-9, 50], [-12, 55]], fill: 0.7, flat: true, foot: 9 },
};
for (const v of Object.values(VESSELS)) {
  v.top = v.profile[v.profile.length - 1][0];
  v.rTop = v.profile[v.profile.length - 1][1];
  v.rMax = Math.max(...v.profile.map(([, r]) => r));
  v.grip = v.grip ?? Math.min(40, -v.top * 0.25);     // how far below its rim a clamp takes hold
  v.bbox = v.box || { x0: -v.rMax - 6, y0: v.top - 8, x1: v.rMax + 6, y1: 8 };
}
/** How high the liquid stands above the bench (the foot of a cylinder counts). */
const levelOf = (def, t) => {
  const fl = def.floor || 0;
  const inner = -def.top - fl;
  return t.vol > 0 ? fl + Math.max(Math.min(7, inner * 0.3), inner * def.fill * Math.min(1, t.vol / (t.cap || def.cap))) : 0;
};

/** The gradients every piece borrows. Put once into the bench's own <svg>. */
export const DEFS = `
<defs>
  <linearGradient id="g-glass" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0.5"/><stop offset="0.035" stop-color="#fff" stop-opacity="0.16"/>
    <stop offset="0.085" stop-color="#000" stop-opacity="0.2"/><stop offset="0.2" stop-color="#fff" stop-opacity="0"/>
    <stop offset="0.5" stop-color="#fff" stop-opacity="0.04"/><stop offset="0.8" stop-color="#fff" stop-opacity="0"/>
    <stop offset="0.905" stop-color="#000" stop-opacity="0.18"/><stop offset="0.96" stop-color="#fff" stop-opacity="0.12"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0.46"/>
  </linearGradient>
  <linearGradient id="g-glass-v" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.06" stop-color="#fff" stop-opacity="0.18"/>
    <stop offset="0.14" stop-color="#000" stop-opacity="0.2"/><stop offset="0.3" stop-color="#fff" stop-opacity="0.02"/>
    <stop offset="0.55" stop-color="#fff" stop-opacity="0.05"/><stop offset="0.82" stop-color="#000" stop-opacity="0.2"/>
    <stop offset="0.94" stop-color="#fff" stop-opacity="0.14"/><stop offset="1" stop-color="#fff" stop-opacity="0.45"/>
  </linearGradient>
  <linearGradient id="g-water-v" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#9fd0ff" stop-opacity="0.34"/><stop offset="0.5" stop-color="#6fb0ee" stop-opacity="0.2"/><stop offset="1" stop-color="#4f8fd6" stop-opacity="0.36"/>
  </linearGradient>
  <linearGradient id="g-shine-v" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.15" stop-color="#fff" stop-opacity="0.8"/><stop offset="0.7" stop-color="#fff" stop-opacity="0.4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="g-streak" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.1" stop-color="#fff" stop-opacity="0.8"/>
    <stop offset="0.62" stop-color="#fff" stop-opacity="0.34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="g-base" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.05"/><stop offset="0.7" stop-color="#fff" stop-opacity="0.2"/><stop offset="1" stop-color="#fff" stop-opacity="0.42"/>
  </linearGradient>
  <linearGradient id="g-amber" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#b8782c" stop-opacity="0.85"/><stop offset="0.3" stop-color="#7a4718" stop-opacity="0.72"/>
    <stop offset="0.7" stop-color="#6a3c12" stop-opacity="0.74"/><stop offset="1" stop-color="#a86a24" stop-opacity="0.86"/>
  </linearGradient>
  <linearGradient id="g-shade" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#000" stop-opacity="0.4"/><stop offset="0.08" stop-color="#000" stop-opacity="0.2"/><stop offset="0.3" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.48" stop-color="#fff" stop-opacity="0.16"/><stop offset="0.7" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.3"/>
  </linearGradient>
  <linearGradient id="g-frost" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#dfe6ee" stop-opacity="0.95"/><stop offset="0.35" stop-color="#f8fbff" stop-opacity="0.85"/>
    <stop offset="1" stop-color="#aeb9c6" stop-opacity="0.9"/>
  </linearGradient>
  <linearGradient id="g-metal" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#6c7480"/><stop offset="0.35" stop-color="#e2e7ee"/><stop offset="0.6" stop-color="#9aa3af"/><stop offset="1" stop-color="#565d68"/>
  </linearGradient>
  <linearGradient id="g-brass" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#8a6a24"/><stop offset="0.4" stop-color="#f0d27a"/><stop offset="1" stop-color="#7a5c1c"/>
  </linearGradient>
  <linearGradient id="g-wood" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#d9a866"/><stop offset="1" stop-color="#a87438"/>
  </linearGradient>
  <linearGradient id="g-rubber" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#b02a1c"/><stop offset="0.4" stop-color="#f0604a"/><stop offset="1" stop-color="#8e1f14"/>
  </linearGradient>
  <linearGradient id="g-flame" x1="0" x2="0" y1="1" y2="0">
    <stop offset="0" stop-color="#4aa8ff" stop-opacity="0.85"/><stop offset="0.6" stop-color="#6f7cff" stop-opacity="0.5"/><stop offset="1" stop-color="#b08cff" stop-opacity="0.12"/>
  </linearGradient>
  <linearGradient id="g-porcelain" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0.82"/><stop offset="0.3" stop-color="#eef1f4" stop-opacity="0.5"/>
    <stop offset="0.7" stop-color="#dfe4ea" stop-opacity="0.5"/><stop offset="1" stop-color="#fff" stop-opacity="0.78"/>
  </linearGradient>
  <radialGradient id="g-ember"><stop offset="0" stop-color="#ffe9a8"/><stop offset="0.45" stop-color="#ff7a2a"/><stop offset="1" stop-color="#ff3a1a" stop-opacity="0"/></radialGradient>
  <filter id="g-soft" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="3.2"/></filter>
  <filter id="g-cloud" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4.2"/></filter>
  <linearGradient id="g-feather" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.42" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff"/>
  </linearGradient>
  <mask id="m-feather" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#g-feather)"/></mask>
  <filter id="g-fibre" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9 0.35" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.42  0 0 0 0 0.34  0 0 0 -1.5 0.82"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <linearGradient id="g-paper-sheen" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6d6654" stop-opacity="0.28"/>
  </linearGradient>
  <linearGradient id="g-steel" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#7f8894"/><stop offset="0.18" stop-color="#e9edf2"/><stop offset="0.42" stop-color="#b3bbc6"/>
    <stop offset="0.62" stop-color="#f4f6f9"/><stop offset="0.85" stop-color="#a4adb9"/><stop offset="1" stop-color="#6d7581"/>
  </linearGradient>
  <linearGradient id="g-case" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#f6f7f9"/><stop offset="0.5" stop-color="#dfe3e8"/><stop offset="1" stop-color="#b4bac3"/>
  </linearGradient>
  <linearGradient id="g-bung" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#7c3220"/><stop offset="0.28" stop-color="#d06a4e"/><stop offset="0.62" stop-color="#b04e35"/><stop offset="1" stop-color="#6f2b1b"/>
  </linearGradient>
  <linearGradient id="g-psu" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#5a6675"/><stop offset="0.12" stop-color="#465160"/><stop offset="1" stop-color="#2b323c"/>
  </linearGradient>
  <radialGradient id="g-knob" cx="0.35" cy="0.3" r="0.8">
    <stop offset="0" stop-color="#f1f4f7"/><stop offset="0.45" stop-color="#8f98a4"/><stop offset="1" stop-color="#3b424c"/>
  </radialGradient>
  <linearGradient id="g-lcd" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#9fb58c"/><stop offset="0.25" stop-color="#c9dbb4"/><stop offset="1" stop-color="#bcd0a6"/>
  </linearGradient>
</defs>`;

const shadow = (rx) => `<ellipse class="cl-ground" cx="0" cy="1" rx="${rx}" ry="6" filter="url(#g-soft)"/>`;
const hit = (b) => `<rect class="cl-hit" x="${b.x0}" y="${b.y0}" width="${b.x1 - b.x0}" height="${b.y1 - b.y0}"/>`;

/** A vessel: glass, a place for liquid, sediment, solids and bubbles behind it. */
export function vesselSvg(key, uid, tag = "") {
  const def = VESSELS[key];
  const P = def.profile, R = def.rMax, H = -def.top;
  const body = outline(P);
  const glassy = def.material !== "porcelain";
  const rimRx = def.rTop + 1.5, rimRy = Math.max(2.6, def.rTop * 0.15);
  const k = Math.min(1, def.rTop / 14);                   // a narrow tube has narrow highlights
  const marks = (def.marks || []).map(([n, at]) => {
    const y = f1(-((def.floor || 0) + (H - (def.floor || 0)) * def.fill * at));
    const r = rAt(P, y);
    return `<path d="M${f1(r * 0.3)} ${y}H${f1(r * 0.62)}" class="cl-mark"/><path d="M${f1(r * 0.46)} ${f1(y + (def.top * def.fill * 0.1))}H${f1(r * 0.62)}" class="cl-mark" opacity="0.6"/><text class="cl-mark-n" x="${f1(r * 0.24)}" y="${y + 2.4}" text-anchor="end">${n}</text>`;
  }).join("");
  const spout = def.spout ? `<path class="cl-g-edge" d="M${-def.rTop + 2} ${def.top + 1}q-9 -3 -10 -7q8 1 13 3"/>` : "";
  const footPath = def.flat && !def.foot && glassy ? outline(P.filter(([y]) => y >= -7).concat([[-5, P[2][1]]])) : "";
  return `
    ${shadow(def.shadow || R + 8)}
    ${glassy && !def.fixed ? `<ellipse cx="${f1(R * 0.25)}" cy="4" rx="${f1(R * 0.62)}" ry="2.6" fill="#fff" fill-opacity="0.07"/>` : ""}
    ${def.back || ""}
    <clipPath id="clip-${uid}"><path d="${body}"/></clipPath>
    <path d="${body}" fill="#fff" fill-opacity="0.025"/>
    <g clip-path="url(#clip-${uid})">
      <g class="cl-level">
        <rect class="cl-oil" x="${-R * 4}" y="${def.top}" width="${R * 8}" height="${H * 4}" transform="translate(0 ${H})"/>
        <g class="cl-liquidg">
          <path class="cl-liquid" d=""/>
          <rect class="cl-lshade" x="${-R}" y="${def.top + 4}" width="${R * 2}" height="${H}" fill="url(#g-shade)"/>
          <path class="cl-men-lo" d=""/><path class="cl-men-hi" d=""/>
          <clipPath id="under-${uid}"><rect x="${-R * 4}" y="${def.top}" width="${R * 8}" height="${H * 4}"/></clipPath>
          <g class="cl-bloom" clip-path="url(#under-${uid})">
            <ellipse class="cl-bloom__a" cx="0" cy="${def.top}" rx="${f1(R * 1.7)}" ry="${f1(H * 1.15)}" filter="url(#g-cloud)" style="transform-origin: 0px ${def.top}px"/>
            <ellipse class="cl-bloom__b" cx="${f1(-def.rTop * 0.22)}" cy="${def.top}" rx="${f1(Math.max(3, def.rTop * 0.2))}" ry="${f1(H * 0.9)}" filter="url(#g-cloud)" style="transform-origin: ${f1(-def.rTop * 0.22)}px ${def.top}px"/>
            <ellipse class="cl-bloom__c" cx="${f1(def.rTop * 0.26)}" cy="${def.top}" rx="${f1(Math.max(2.4, def.rTop * 0.15))}" ry="${f1(H * 0.7)}" filter="url(#g-cloud)" style="transform-origin: ${f1(def.rTop * 0.26)}px ${def.top}px"/>
          </g>
          <g class="cl-vortex"><ellipse cx="0" cy="${def.top + 9}" rx="${f1(def.rTop * 0.72)}" ry="3.6"/><ellipse cx="0" cy="${def.top + 22}" rx="${f1(def.rTop * 0.5)}" ry="3"/><ellipse cx="0" cy="${def.top + 36}" rx="${f1(def.rTop * 0.3)}" ry="2.4"/></g>
        </g>
        <rect class="cl-cloud" x="${-R * 4}" y="${def.top}" width="${R * 8}" height="${H * 4}"/>
      </g>
      <rect class="cl-sediment" x="${-R}" y="${def.top}" width="${R * 2}" height="${H}"/>
      <g class="cl-solids"></g>
      <g class="cl-bubbles"></g>
    </g>
    <ellipse class="cl-meniscus" cx="0" cy="0" rx="0" ry="2.4"/>
    <path d="${body}" fill="url(#${glassy ? "g-glass" : "g-porcelain"})"/>
    ${glassy ? `<path d="${band(P, -1, 3.2 * k, 7.8 * k, 0.1, 0.94)}" fill="url(#g-streak)"/><path d="${band(P, 1, 5 * k, 13 * k, 0.16, 0.9)}" fill="#fff" fill-opacity="0.07"/><path class="cl-g-spark" d="${wall(P, -1, 3 * k, 0.9, 0.97)}"/>` : ""}
    <path class="cl-g-edge" d="${outline(P, true)}"/>
    ${!glassy || def.rMax < 12 ? "" : `<path class="cl-g-inner" d="${outline(P.map(([y, r]) => [Math.min(y, def.flat ? -5 : -2.6), Math.max(0, r - 2.6)]), true)}"/>`}
    ${footPath ? `<path d="${footPath}" fill="url(#g-base)"/><path d="M${f1(-(P[2][1] - 2.6))} -5H${f1(P[2][1] - 2.6)}" stroke="#fff" stroke-opacity="0.34" stroke-width="1"/><path d="M${f1(-P[0][1] + 3)} -0.8H${f1(P[0][1] - 3)}" stroke="#fff" stroke-opacity="0.7" stroke-width="1.2" stroke-linecap="round"/>` : ""}
    ${def.footR ? `<path d="M${-def.footR} 0h${def.footR * 2}l-5 ${-def.floor}h${-(def.footR * 2 - 10)}z" fill="url(#g-base)"/><path class="cl-g-edge" d="M${-def.footR} 0h${def.footR * 2}l-5 ${-def.floor}h${-(def.footR * 2 - 10)}z"/>` : ""}
    ${def.flat ? `<ellipse class="cl-g-foot" cx="0" cy="-2.5" rx="${f1(def.foot || P[2][1] * 0.94)}" ry="${def.foot ? 2.4 : 3.6}"/>` : ""}
    ${!def.flat && glassy && !def.floor ? `<path d="M${f1(-P[4][1])} ${P[4][0]}Q0 ${f1(P[0][0] + 1.5)} ${f1(P[4][1])} ${P[4][0]}" fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="2.2" stroke-linecap="round"/>` : ""}
    ${def.ring ? `<path class="cl-mark" d="M${-rAt(P, def.ring)} ${def.ring}H${rAt(P, def.ring)}"/>` : ""}
    ${marks}
    ${def.volume ? `<text class="cl-mark-v" x="${def.spout ? f1(-rAt(P, def.top * 0.5) * 0.45) : 0}" y="${f1(def.spout ? def.top * (def.fill + 0.06) : def.top * 0.3)}">${def.volume}</text>` : ""}
    ${def.spout && def.marks && R > 30 ? `<text class="cl-mark-b" x="${f1(-R * 0.42)}" y="${f1(def.top * 0.2)}">PREP</text>` : ""}
    <g class="cl-sublimate">${[0.06, 0.1, 0.15, 0.19, 0.24].map((at, i) => { const y = def.top * (1 - at), r = Math.max(2, rAt(P, y) - 2.4), s = i % 2 ? 1 : -1; return `<path d="M${f1(s * r)} ${f1(y)}l${-s * 3.2} -2.400l${-s * 1.6} 3l${s * 2.4} 2.400z" fill="#2c2233" stroke="#b9a8d8" stroke-opacity="0.8" stroke-width="0.5"/><path d="M${f1(-s * r)} ${f1(y + 5)}l${s * 2.6} -2l${s * 1.4} 2.600l${-s * 2} 2z" fill="#3a2d45" stroke="#b9a8d8" stroke-opacity="0.7" stroke-width="0.5"/>`; }).join("")}</g>
    <ellipse class="cl-g-rim" cx="0" cy="${def.top}" rx="${rimRx}" ry="${f1(rimRy)}"/>
    ${glassy && def.rTop > 9 ? `<ellipse class="cl-g-lip" cx="0" cy="${f1(def.top + 0.5)}" rx="${f1(rimRx - 2.6)}" ry="${f1(Math.max(1.2, rimRy - 1.5))}"/><path class="cl-g-rimhi" d="M${f1(-rimRx * 0.72)} ${f1(def.top + rimRy * 0.7)}Q0 ${f1(def.top + rimRy * 1.5)} ${f1(rimRx * 0.72)} ${f1(def.top + rimRy * 0.7)}"/>` : ""}
    ${spout}
    <g class="cl-wisps"><path d="M-6 ${def.top - 6}q-5-8 0-15t0-15"/><path d="M0 ${def.top - 8}q5-8 0-15t0-15"/><path d="M6 ${def.top - 6}q-5-8 0-15t0-15"/></g>
    <g class="cl-tagg" transform="translate(0 ${H < 60 ? -36 : 0})"><rect x="-9" y="${def.top + 16}" width="18" height="14" rx="2.5"/><text x="0" y="${def.top + 23.5}">${tag}</text></g>
    ${def.front || ""}
    ${hit(def.bbox)}
    ${def.over || ""}`;
}

/**
 * The front of a vessel: the liquid and the front wall, once more, to be drawn OVER whatever
 * has been put inside it (a stopper in the neck, a delivery tube, carbon rods, a thermometer).
 * Without it those things are painted on top of the glass and look as if they were stuck to
 * the front. main.js keeps this just after the vessel and its fittings in the drawing order.
 */
export function veilSvg(key, uid) {
  const def = VESSELS[key];
  const P = def.profile, R = def.rMax, H = -def.top;
  const body = outline(P);
  const glassy = def.material !== "porcelain";
  const k = Math.min(1, def.rTop / 14);
  const rimRx = def.rTop + 1.5, rimRy = Math.max(2.6, def.rTop * 0.15);
  return `<clipPath id="vclip-${uid}"><path d="${body}"/></clipPath>
    <g clip-path="url(#vclip-${uid})"><path class="cl-veil__liq" d="" style="display:none"/></g>
    <path d="${body}" fill="url(#${glassy ? "g-glass" : "g-porcelain"})" opacity="${glassy ? 0.75 : 1}"/>
    ${glassy ? `<path d="${band(P, -1, 3.2 * k, 7.8 * k, 0.1, 0.94)}" fill="url(#g-streak)"/><path class="cl-g-spark" d="${wall(P, -1, 3 * k, 0.9, 0.97)}"/>` : ""}
    <path class="cl-g-edge" d="${outline(P, true)}"/>
    <path class="cl-g-rimfront" d="M${f1(-rimRx)} ${def.top}A${f1(rimRx)} ${f1(rimRy)} 0 0 0 ${f1(rimRx)} ${def.top}"/>`;
}

function scatter(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280), s / 233280);
}

/** Paint a vessel from its chemistry. `fresh` = a precipitate has just come down. */
export function paintVessel(g, key, t, { fresh = false, seed = 1, tilt = 0 } = {}) {
  const def = VESSELS[key];
  const P = def.profile, H = -def.top;
  const sp = speciate(t);
  const lk = look(t, sp);
  const stuff = sediment(t, sp);
  // oil floats: the two layers share the height in the proportion they are there
  const oil = t.oil || 0;
  const top = levelOf(def, { vol: t.vol + oil, cap: t.cap });
  const level = oil > 0 ? (t.vol > 0 ? (def.floor || 0) + (top - (def.floor || 0)) * (t.vol / (t.vol + oil)) : 0) : top;
  const oilEl = g.querySelector(".cl-oil");
  oilEl.removeAttribute("transform");
  oilEl.style.transform = `translateY(${H - (oil > 0 ? top : 0)}px)`;
  // (the liquid, the oil and the cloud are sheets parked just under the vessel when there is none:
  // turned or tipped, a parked sheet came into view and an empty vessel looked full)
  oilEl.style.display = oil > 0 ? "" : "none";
  g.querySelector(".cl-liquidg").style.display = t.vol > 0 ? "" : "none";
  g.querySelector(".cl-cloud").style.display = t.vol > 0 ? "" : "none";
  const lev = g.querySelector(".cl-level");
  lev.style.transformOrigin = `0px ${-top}px`;
  lev.style.transform = tilt ? `rotate(${-tilt}deg)` : "";
  g.classList.toggle("is-tilted", Boolean(tilt));

  g.querySelector(".cl-liquidg").style.transform = `translateY(${H - level}px)`;
  // A liquid does not change colour all at once. Where the colour really is different from the
  // one showing (an indicator going in, an end point reached), the new colour BLOOMS: a cloud
  // spreads from the surface and streaks sink through the old colour, which then follows it.
  const fillNow = rgba(lk.rgb, Math.max(lk.a, 0.32));       // clear water still has to be seen
  const shown = (g.dataset.rgb || "").split(",").map(Number);
  const far = shown.length === 3 ? Math.abs(shown[0] - lk.rgb[0]) + Math.abs(shown[1] - lk.rgb[1]) + Math.abs(shown[2] - lk.rgb[2]) : 0;
  const bloom = g.querySelector(".cl-bloom");
  if (bloom && t.vol > 0 && far > 46) {
    bloom.style.fill = rgba(lk.rgb, Math.max(lk.a, 0.5));
    g.classList.remove("is-blooming");
    void g.getBoundingClientRect();
    g.classList.add("is-blooming");
    bloom.firstElementChild.onanimationend = () => g.classList.remove("is-blooming");
  } else if (t.vol <= 0) g.classList.remove("is-blooming");
  g.dataset.rgb = t.vol > 0 ? lk.rgb.join(",") : "";
  g.querySelector(".cl-liquid").style.fill = fillNow;
  // THE MENISCUS. Water wets glass, so where the surface meets the wall it climbs a little: seen
  // from the side the surface is level across the middle and curls UP at each wall, and in a
  // narrow tube the two curls meet and the whole surface is a curve. Along it there is a bright
  // line (the surface catching the light) with a darker band just under it (light bent away),
  // and the far edge of the surface shows through the glass as a flattened ellipse.
  const rxS = top ? Math.max(2, rAt(P, -top) - 1.2) : def.rMax;
  const curl = Math.min(rxS * 0.92, 9), dip = Math.min(3.4, Math.max(1.2, curl * 0.4));
  const y0 = def.top, y1 = def.top + dip;
  const edge = `M${f1(-rxS)} ${y0}C${f1(-rxS + curl * 0.16)} ${f1(y0 + dip * 0.82)} ${f1(-rxS + curl * 0.5)} ${f1(y1)} ${f1(-rxS + curl)} ${f1(y1)}H${f1(rxS - curl)}C${f1(rxS - curl * 0.5)} ${f1(y1)} ${f1(rxS - curl * 0.16)} ${f1(y0 + dip * 0.82)} ${f1(rxS)} ${y0}`;
  g.querySelector(".cl-liquid").setAttribute("d", `M${-def.rMax * 4} ${y0}H${f1(-rxS)}${edge.slice(edge.indexOf("C"))}H${def.rMax * 4}V${y0 + H * 4}H${-def.rMax * 4}z`);
  g.querySelector(".cl-men-hi").setAttribute("d", edge);
  const lo = g.querySelector(".cl-men-lo");
  lo.setAttribute("d", edge);
  lo.setAttribute("transform", `translate(0 ${rxS < 14 ? 2.2 : 1.8})`);
  lo.style.strokeWidth = rxS < 14 ? "2.6" : "1.9";
  const men = g.querySelector(".cl-meniscus");
  men.setAttribute("cy", f1(-top));
  men.setAttribute("rx", top ? f1(Math.max(0, rAt(P, -top) - 1.2)) : 0);
  men.setAttribute("ry", f1(rxS < 14 ? 0.6 : Math.min(4.6, rxS * 0.085)));
  men.style.fill = rgba(lk.rgb.map((v) => Math.round(v + (255 - v) * 0.45)), Math.min(0.9, lk.a + 0.25));

  const total = stuff.ppt.reduce((a, p) => a + p.n, 0);
  const mix = total ? [0, 1, 2].map((k) => Math.round(stuff.ppt.reduce((a, p) => a + p.rgb[k] * p.n, 0) / total)) : [0, 0, 0];
  const fl = def.floor || 0;
  // (a centrifuged solid is a pellet: half the depth of one that has only settled)
  const bed = total ? Math.min(level ? level - fl : 40, Math.min(7, H * 0.12) + (H * 0.75 * total) / (t.cap || def.cap)) * (t.packed ? 0.5 : 1) : 0;
  const sed = g.querySelector(".cl-sediment");
  const cloud = g.querySelector(".cl-cloud");
  sed.style.fill = rgba(mix, 0.97);
  sed.style.transform = `translateY(${H - bed - fl}px)`;
  cloud.style.fill = rgba(mix, 0.82);
  cloud.style.transform = `translateY(${H - level}px)`;
  if (fresh && total) {
    for (const el of [cloud, sed]) {
      el.classList.remove("is-settling");
      void el.getBoundingClientRect();          // restart the film
      el.classList.add("is-settling");
    }
  }
  g.classList.toggle("has-ppt", total > 0);
  g.classList.toggle("is-packed", Boolean(t.packed));

  const floor = -fl - bed - 2;
  const spread = Math.max(6, rAt(P, Math.min(-6, floor - 4)) * 0.72);
  const rnd = scatter(seed);
  const spot = () => [f1((rnd() - 0.5) * 2 * spread), f1(floor - rnd() * 8)];
  let html = "";
  for (const m of stuff.metal) {
    const fill = rgba(m.rgb);
    const count = Math.max(1, Math.min(9, Math.round(m.n * 2)));
    for (let k = 0; k < count; k++) {
      const [x, y] = spot();
      if (m.deposit) html += `<circle cx="${x}" cy="${y + 3}" r="${f1(1.6 + rnd() * 1.6)}" fill="${fill}"/>`;
      else if (m.key === "Mg") html += `<rect x="${x - 8}" y="${y - 7}" width="16" height="3.6" rx="1" fill="${fill}" transform="rotate(${Math.round(rnd() * 70 - 35)} ${x} ${y})"/>`;
      else if (m.key === "Fe") html += `<rect x="${x - 3}" y="${y}" width="6" height="1.6" fill="${fill}" transform="rotate(${Math.round(rnd() * 180)} ${x} ${y})"/>`;
      else if (m.key === "Cu") html += `<path d="M${x - 5} ${y}q5-7 10 0" fill="none" stroke="${fill}" stroke-width="2.4" stroke-linecap="round"/>`;
      else html += `<circle cx="${x}" cy="${y}" r="${f1(3 + rnd() * 1.6)}" fill="${fill}" stroke="#fff" stroke-opacity="0.25" stroke-width="0.6"/>`;
    }
  }
  for (const s of stuff.solid) {
    const fill = rgba(s.rgb);
    const count = Math.max(2, Math.min(8, Math.round(s.n * 2.5)));
    for (let k = 0; k < count; k++) {
      const [x, y] = spot();
      if (s.key === "CaCO3") html += `<path d="M${x - 5} ${y + 3}l2-7 6-1 3 6-4 4z" fill="${fill}" stroke="#9aa0a8" stroke-width="0.6"/>`;
      else html += `<circle cx="${x}" cy="${y + 2}" r="${f1(2 + rnd() * 2)}" fill="${fill}" stroke="#fff" stroke-opacity="0.18" stroke-width="0.5"/>`;
    }
  }
  g.querySelector(".cl-solids").innerHTML = html;
  g.classList.toggle("has-gas", Boolean(t.gas));
  return { sp, look: lk, level: top };
}

/**
 * Bubbles up through the liquid: they start small where the gas is made (the solid on the
 * bottom, or `xs` \u2014 the rods of a cell), wobble and grow as they rise, and break at the
 * surface. A lively reaction also raises a froth. `steam` adds the wisps over a boiling liquid.
 */
export function bubble(g, key, t, lively = 1, { xs = null, steam = false } = {}) {
  const def = VESSELS[key];
  const level = levelOf(def, t);
  if (!level) return;
  const box = g.querySelector(".cl-bubbles");
  const fl = def.floor || 0;
  const spread = rAt(def.profile, -fl - (level - fl) * 0.35) * 0.78;
  const top = level - fl - 4;
  const count = Math.round(16 * lively);
  let html = "";
  for (let k = 0; k < count; k++) {
    const x = xs ? xs[k % xs.length] + (Math.random() - 0.5) * 7 : (Math.random() - 0.5) * 2 * spread;
    const r = 1 + Math.random() * 2.4 * Math.min(1.4, lively);
    const rise = (0.9 + Math.random() * 0.9) / Math.min(1.6, 0.7 + lively * 0.4);
    html += `<g class="cl-bub" style="--rise:${-Math.round(top)}px;--t:${rise.toFixed(2)}s;--d:${(Math.random() * 2.8).toFixed(2)}s"><circle class="cl-bub__c" cx="${f1(x)}" cy="${-fl - 5}" r="${f1(r)}" style="--w:${f1((Math.random() - 0.5) * 9)}px"/></g>`;
  }
  if (lively >= 1) {
    const wr = rAt(def.profile, -level) - 2;
    for (let k = 0; k < Math.round(7 * lively); k++) {
      html += `<circle class="cl-foam" cx="${f1((Math.random() - 0.5) * 2 * wr)}" cy="${f1(-level - Math.random() * 3.5 * lively)}" r="${f1(1.4 + Math.random() * 2.2)}" style="--d:${(Math.random() * 1.6).toFixed(2)}s"/>`;
    }
  }
  box.innerHTML = html;
  clearTimeout(box._t);
  box._t = setTimeout(() => (box.innerHTML = ""), 5200);
  if (steam) {
    g.classList.add("is-steaming");
    clearTimeout(g._steam);
    g._steam = setTimeout(() => g.classList.remove("is-steaming"), 3000);
  }
}

// ── bottles ─────────────────────────────────────────────────────────────────
const BOTTLE = [[0, 25], [-2, 29], [-7, 31], [-62, 31], [-70, 27], [-78, 15], [-82, 12], [-97, 12], [-99, 15], [-103, 15]];
const JAR = [[0, 26], [-2, 30], [-7, 32], [-56, 32], [-64, 25], [-68, 22], [-77, 22], [-79, 25], [-83, 25]];
const DROPPER = [[0, 16], [-2, 19], [-6, 21], [-46, 21], [-54, 14], [-58, 10], [-66, 10], [-68, 12], [-71, 12]];
const AMBER = ["agno3", "h2o2", "ki"];        // kept in brown glass, away from the light
const SOLID_FILL = {
  mg: [198, 202, 206], zn: [150, 158, 166], fe: [84, 84, 90], cu: [190, 106, 62],
  caco3: [238, 236, 228], cuo: [38, 36, 36], mno2: [58, 50, 48],
  sandsalt: [226, 208, 172], sand: [214, 186, 132], sulfur: [236, 214, 74], iodine: [58, 46, 66],
};
const DROPPER_FILL = { ui: [76, 176, 80], phph: [226, 232, 238], mo: [240, 140, 40] };
const SHORT = { ui: "Univ.", phph: "Phph", mo: "M.O." };

/** A reagent's own colour: one portion of it, in a tube. */
export function colourOf(id) {
  const r = reagent(id);
  if (r.kind === "indicator") return DROPPER_FILL[id];
  if (r.kind === "solid") return SOLID_FILL[id];
  const t = newTube();
  add(t, id);
  return look(t).rgb;
}
function liquidOf(id) {
  const t = newTube();
  add(t, id);
  const lk = look(t);
  return rgba(lk.rgb, Math.max(0.3, lk.a));
}

/** "Cu(OH)2" as svg text: the digits dropped and shrunk. */
function formula(f) {
  return f.replace(/([A-Za-z)])(\d+)/g, `$1<tspan dy="2.6" font-size="70%">$2</tspan><tspan dy="-2.6">​</tspan>`);
}
const label = (text, y, w, h, size) =>
  `<rect class="cl-label" x="${-w / 2}" y="${y}" width="${w}" height="${h}" rx="4"/><rect x="${-w / 2}" y="${y}" width="${w}" height="${h}" rx="4" fill="url(#g-shade)" opacity="0.4"/>` +
  `<text class="cl-label-t" x="0" y="${y + h / 2 + size * 0.36}" font-size="${size}">${text}</text>`;

/** How far a bottle's mouth is above its base: the point it pours from. */
export const mouthOf = (id) => (reagent(id).kind === "solid" ? 83 : reagent(id).kind === "indicator" ? 71 : 103);

// A stopper, drawn with its seat (where it meets the mouth) at y. On the bench it is its own piece.
const CAPS = {
  bottle: (y) => `<g class="cl-stopper" transform="translate(0 ${y})"><path d="M-10 3h20l1.5 -9h-23z" fill="url(#g-frost)"/><rect x="-16" y="-19" width="32" height="14" rx="3.5" fill="url(#g-frost)" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8"/><path d="M-11 -15v6" stroke="#fff" stroke-opacity="0.8" stroke-width="1.6" stroke-linecap="round"/></g>`,
  // a dropper: the collar that sits on the bottle, the rubber teat above it, the glass tube that reaches down inside
  drop: (y, rgb = [226, 232, 238]) => `<g class="cl-stopper" transform="translate(0 ${y})">
      <path d="M-2.2 0V50L-1 58h2L2.2 50V0z" fill="#fff" fill-opacity="0.16" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>
      <path d="M-1.3 22V50L-0.6 56h1.2L1.3 50V22z" fill="rgb(${rgb})" fill-opacity="0.9"/>
      <rect x="-11" y="-9" width="22" height="10" rx="2" fill="#2c3038" stroke="#fff" stroke-opacity="0.25" stroke-width="0.6"/>
      <path d="M-6 -9c-5 -8 -6 -24 0 -30q6 -5 12 0c6 6 5 22 0 30z" fill="url(#g-rubber)"/><path d="M-3 -34q-3 8 -1 20" fill="none" stroke="#fff" stroke-opacity="0.4" stroke-width="1.4" stroke-linecap="round"/></g>`,
  jar: (y) => `<g class="cl-stopper" transform="translate(0 ${y})"><path d="M-20 3h40l-2 9h-36z" fill="url(#g-frost)" transform="translate(0 0)"/><rect x="-27" y="-10" width="54" height="11" rx="3.5" fill="url(#g-frost)" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8"/></g>`,
};
/** Which stopper a reagent's container takes: a glass stopper, a jar's lid, or a dropper bottle's dropper. */
export const capOf = (id) => (reagent(id).kind === "solid" ? "jar" : reagent(id).kind === "solution" ? "bottle" : "drop");
export const CAP_BOX = { bottle: { x0: -20, y0: -22, x1: 20, y1: 8 }, jar: { x0: -30, y0: -14, x1: 30, y1: 16 }, drop: { x0: -13, y0: -44, x1: 13, y1: 62 } };

export function reagentSvg(id, uid, capped = false) {
  const r = reagent(id);
  const size = r.formula.length <= 4 ? 12.5 : r.formula.length <= 6 ? 10.5 : r.formula.length <= 8 ? 8.6 : 7;
  if (r.kind === "solid") {
    const fill = rgba(SOLID_FILL[id]);
    return `
      ${shadow(38)}
      <clipPath id="clip-${uid}"><path d="${outline(JAR)}"/></clipPath>
      <path d="${outline(JAR)}" fill="#fff" fill-opacity="0.03"/>
      <g clip-path="url(#clip-${uid})">
        <path d="M-34 0V-30q10-9 22-4t22-5 24 3V0z" fill="${fill}"/>
        <path d="M-34 0V-30q10-9 22-4t22-5 24 3V0z" fill="url(#g-shade)"/>
        <circle cx="-14" cy="-37" r="3" fill="${fill}"/><circle cx="12" cy="-41" r="2.4" fill="${fill}"/><circle cx="2" cy="-36" r="2" fill="${fill}"/>
      </g>
      <path d="${outline(JAR)}" fill="url(#g-glass)"/>
      <path class="cl-g-edge" d="${outline(JAR, true)}"/>
      <path d="${band(JAR, -1, 3.6, 9, 0.1, 0.72)}" fill="url(#g-streak)"/><path d="${band(JAR, 1, 5, 13, 0.2, 0.72)}" fill="#fff" fill-opacity="0.07"/>
${capped ? CAPS.jar(-83) : ""}
      ${label(formula(r.formula), -30, 46, 20, size)}
      ${hit({ x0: -36, y0: -96, x1: 36, y1: 8 })}`;
  }
  if (r.kind === "indicator") {
    return `
      ${shadow(26)}
      <clipPath id="clip-${uid}"><path d="${outline(DROPPER)}"/></clipPath>
      <path d="${outline(DROPPER)}" fill="#fff" fill-opacity="0.03"/>
      <g clip-path="url(#clip-${uid})"><rect x="-22" y="-40" width="44" height="42" fill="${rgba(DROPPER_FILL[id], id === "phph" ? 0.3 : 0.85)}"/><rect x="-22" y="-40" width="44" height="42" fill="url(#g-shade)"/></g>
      <path d="${outline(DROPPER)}" fill="url(#g-glass)"/>
      <path class="cl-g-edge" d="${outline(DROPPER, true)}"/>
      <path d="${band(DROPPER, -1, 3, 7, 0.1, 0.62)}" fill="url(#g-streak)"/><path d="${band(DROPPER, 1, 5, 13, 0.2, 0.62)}" fill="#fff" fill-opacity="0.07"/>
      ${capped ? CAPS.drop(-71, DROPPER_FILL[id]) : ""}
      ${label(SHORT[id], -32, 34, 15, 8.4)}
      ${hit({ x0: -26, y0: -114, x1: 26, y1: 8 })}`;
  }
  const amber = AMBER.includes(id);
  return `
    ${shadow(36)}
    <clipPath id="clip-${uid}"><path d="${outline(BOTTLE)}"/></clipPath>
    <path d="${outline(BOTTLE)}" fill="#fff" fill-opacity="0.03"/>
    <g clip-path="url(#clip-${uid})"><g class="cl-level" style="transform-origin:0px -58px"><rect x="-128" y="-58" width="256" height="240" fill="${liquidOf(id)}"/><rect x="-128" y="-58" width="256" height="2.2" fill="#fff" fill-opacity="0.3"/></g><rect x="-32" y="-58" width="64" height="60" fill="url(#g-shade)"/></g>
    <ellipse cx="0" cy="-58" rx="29.5" ry="2.2" fill="#fff" fill-opacity="${amber ? 0.1 : 0.28}"/>
    <path d="${outline(BOTTLE)}" fill="url(#${amber ? "g-amber" : "g-glass"})"/>
    <path class="cl-g-edge" d="${outline(BOTTLE, true)}"/>
    <path d="${band(BOTTLE, -1, 3.6, 9, 0.08, 0.66)}" fill="url(#g-streak)"/><path d="${band(BOTTLE, 1, 5, 13, 0.2, 0.66)}" fill="#fff" fill-opacity="0.07"/>
    <ellipse class="cl-g-foot" cx="0" cy="-2.5" rx="27" ry="3"/>
${capped ? CAPS.bottle(-103) : ""}
    ${label(formula(r.formula), -50, 50, 26, size)}
    ${hit({ x0: -35, y0: -125, x1: 35, y1: 8 })}`;
}

// ── tools ───────────────────────────────────────────────────────────────────
// act = the point of the tool that does the work, in its own space
export const TOOLS = {
  burner: { name: "Bunsen burner", act: [0, -146], bbox: { x0: -34, y0: -150, x1: 46, y1: 8 } },
  spirit: { name: "Spirit burner", act: [0, -112], bbox: { x0: -36, y0: -116, x1: 36, y1: 8 } },
  dropper: { name: "Dropper", act: [0, 0], bbox: { x0: -10, y0: -108, x1: 10, y1: 6 } },
  thermo: { name: "Thermometer", act: [0, 0], bbox: { x0: -9, y0: -154, x1: 9, y1: 6 } },
  ph: { name: "pH paper", act: [0, 0], bbox: { x0: -10, y0: -70, x1: 10, y1: 6 } },
  meter: { name: "pH meter", act: [0, 0], bbox: { x0: -22, y0: -156, x1: 22, y1: 6 } },
  wire: { name: "Flame-test wire", act: [-34, -58], bbox: { x0: -44, y0: -68, x1: 40, y1: 8 } },
  waste: { name: "Waste tub", act: [0, -66], bbox: { x0: -62, y0: -78, x1: 62, y1: 8 } },
  pipette: { name: "Pipette (25 mL) and filler", act: [0, 0], bbox: { x0: -12, y0: -190, x1: 12, y1: 6 } },
  funnel: { name: "Filter funnel", act: [0, 0], bbox: { x0: -40, y0: -66, x1: 40, y1: 34 } },
  paper: { name: "Filter paper", act: [0, 0], bbox: { x0: -34, y0: -62, x1: 34, y1: 6 } },
  magnet: { name: "Horseshoe magnet", act: [0, 0], bbox: { x0: -24, y0: -64, x1: 24, y1: 8 } },
  chroma: { name: "Chromatography paper", act: [0, 0], bbox: { x0: -42, y0: -10, x1: 42, y1: 108 } },
  bung: { name: "Rubber stopper", act: [0, 0], bbox: { x0: -18, y0: -14, x1: 18, y1: 13 } },
  bung1: { name: "One-hole stopper", act: [0, 0], bbox: { x0: -18, y0: -14, x1: 18, y1: 13 } },
  tubing: { name: "Delivery tube", act: [0, 0], bbox: { x0: -12, y0: -66, x1: 46, y1: -13 } },
  syringe: { name: "Gas syringe", act: [0, -11], bbox: { x0: -110, y0: -40, x1: 150, y1: 8 } },
  condenser: { name: "Liebig condenser", act: [0, 0], bbox: { x0: -8, y0: -22, x1: 240, y1: 122 } },
  electrode: { name: "Carbon electrode", act: [0, 0], bbox: { x0: -9, y0: -30, x1: 9, y1: 104 } },
  power: { name: "Power pack (6 V)", act: [0, 0], bbox: { x0: -50, y0: -70, x1: 50, y1: 8 } },
  cap: { name: "Stopper", act: [0, 0], bbox: { x0: -28, y0: -22, x1: 28, y1: 14 }, hidden: true },
  rod: { name: "Glass stirring rod", act: [-34, -58], bbox: { x0: -44, y0: -66, x1: 44, y1: 8 } },
  holder: { name: "Test tube holder", act: [0, 0], bbox: { x0: -40, y0: -40, x1: 40, y1: 8 } },
  tongs: { name: "Crucible tongs", act: [0, 0], bbox: { x0: -44, y0: -34, x1: 44, y1: 8 } },
  lit: { name: "Lighted splint", act: [-34, -58], bbox: { x0: -44, y0: -84, x1: 40, y1: 8 } },
  glow: { name: "Glowing splint", act: [-34, -58], bbox: { x0: -44, y0: -70, x1: 40, y1: 8 } },
  red: { name: "Red litmus paper", act: [0, 0], bbox: { x0: -10, y0: -70, x1: 10, y1: 6 } },
  blue: { name: "Blue litmus paper", act: [0, 0], bbox: { x0: -10, y0: -70, x1: 10, y1: 6 } },
};

const splint = (tip) => `
  <path d="M-34 -58L32 -2" stroke="url(#g-wood)" stroke-width="5" stroke-linecap="round"/>
  <path d="M-34 -58L-20 -46" stroke="#3a2a1c" stroke-width="5" stroke-linecap="round"/>
  ${tip}`;

export function toolSvg(key, it = {}) {
  const b = TOOLS[key].bbox;
  if (key === "burner") {
    return `
      ${shadow(34)}
      <path d="M7 -12h26v6h-26z" fill="url(#g-metal)"/><rect x="31" y="-14" width="14" height="10" rx="4" fill="#d9772e"/>
      <path d="M-30 0q0-8 12-12l6-8h24l6 8q12 4 12 12z" fill="url(#g-metal)"/>
      <ellipse cx="0" cy="0" rx="30" ry="4.5" fill="#3d434d"/>
      <rect x="-7.5" y="-96" width="15" height="78" rx="2" fill="url(#g-brass)"/>
      <rect x="-10" y="-40" width="20" height="13" rx="2" fill="url(#g-metal)"/><circle cx="0" cy="-33.5" r="3" fill="#23272e"/>
      <rect x="-9" y="-99" width="18" height="5" rx="2" fill="url(#g-metal)"/>
      <g class="cl-flame">
        <path d="M-8.5 -98C-14 -116 -4 -130 0 -148C4 -130 14 -116 8.5 -98z" fill="url(#g-flame)"/>
        <path d="M-4.5 -98C-6 -108 -1.5 -114 0 -122C1.5 -114 6 -108 4.5 -98z" fill="#d6f0ff" fill-opacity="0.92"/>
      </g>
      ${hit(b)}
      <g class="cl-press" data-press="down"><circle cx="-18" cy="-7" r="7.5" fill="#23272e" stroke="#fff" stroke-opacity="0.55"/><path d="M-21 -7h7" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>
      <g class="cl-press" data-press="up"><circle cx="18" cy="-7" r="7.5" fill="#23272e" stroke="#fff" stroke-opacity="0.55"/><path d="M14 -7h7M18 -10.500v7" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>`;
  }
  if (key === "spirit") {
    const d = "M-31 0q-5 -24 7 -42q8 -11 13 -14h22q5 3 13 14q12 18 7 42z";
    return `${shadow(34)}
      <path d="${d}" fill="rgba(176,128,226,0.38)"/><path d="${d}" fill="url(#g-shade)"/><path d="${d}" fill="url(#g-glass)"/><path class="cl-g-edge" d="${d}"/>
      <path class="cl-g-shine" d="M-24 -8q-3 -18 5 -32"/>
      <rect x="-12" y="-67" width="24" height="11" rx="2" fill="url(#g-metal)"/><rect x="-3" y="-76" width="6" height="11" rx="1" fill="#efe6d0"/>
      <g class="cl-flame"><path d="M0 -112c7 12 11 18 11 26a11 11 0 0 1-22 0c0-8 4-14 11-26z" fill="#ff9a2a" fill-opacity="0.86"/><path d="M0 -97c4 7 6 10 6 15a6 6 0 0 1-12 0c0-5 2-8 6-15z" fill="#ffe27a"/></g>
      ${hit(b)}
      <g class="cl-press" data-press="down"><circle cx="-16" cy="-7" r="7.5" fill="#23272e" stroke="#fff" stroke-opacity="0.55"/><path d="M-19 -7h7" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>
      <g class="cl-press" data-press="up"><circle cx="16" cy="-7" r="7.5" fill="#23272e" stroke="#fff" stroke-opacity="0.55"/><path d="M12 -7h7M16 -10.500v7" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>`;
  }
  if (key === "dropper") {
    const glass = "M-1.6 0L-4.2 -22V-70h8.4V-22L1.6 0z";
    return `<path class="cl-drop-liq" d="M-1.1 -2L-3 -22V-52h6V-22L1.1 -2z" fill="transparent"/>
      <path d="${glass}" fill="url(#g-glass)" stroke="#fff" stroke-opacity="0.72" stroke-width="0.9" stroke-linejoin="round"/>
      <path d="M-2.4 -66V-26" stroke="#fff" stroke-opacity="0.75" stroke-width="1.1" stroke-linecap="round"/>
      <rect x="-6.5" y="-78" width="13" height="9" rx="2" fill="#2c3038" stroke="#fff" stroke-opacity="0.3" stroke-width="0.6"/><ellipse cx="0" cy="-78" rx="6.5" ry="1.8" fill="#3d434d"/>
      <path d="M-5.5 -78c-5 -8 -5 -22 0 -27q5.5 -4 11 0c5 5 5 19 0 27z" fill="url(#g-rubber)"/><path d="M-3 -100q-3 8 -1 18" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="1.4" stroke-linecap="round"/>${hit(b)}`;
  }
  if (key === "thermo") {
    const ticks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => `<path d="M3.6 ${-26 - k * 11}h${k % 5 === 0 ? 4.5 : 2.6}" class="cl-mark"/>`).join("");
    return `<rect x="-3.6" y="-150" width="7.2" height="146" rx="3.6" fill="#fff" fill-opacity="0.05"/>
      <rect class="cl-merc" x="-1.1" y="-53" width="2.2" height="49" fill="#e23b3b"/>
      <rect x="-3.6" y="-150" width="7.2" height="146" rx="3.6" fill="url(#g-glass)" stroke="#fff" stroke-opacity="0.72" stroke-width="0.8"/>
      <path d="M-2 -144V-18" stroke="#fff" stroke-opacity="0.7" stroke-width="1" stroke-linecap="round"/>
      <circle cx="0" cy="-4" r="5" fill="#e23b3b"/><circle cx="0" cy="-4" r="5" fill="url(#g-glass)" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/><circle cx="-1.6" cy="-5.6" r="1.3" fill="#fff" fill-opacity="0.7"/>
      <ellipse cx="0" cy="-150" rx="3.6" ry="1.2" fill="#fff" fill-opacity="0.5"/>${ticks}${hit(b)}`;
  }
  if (key === "meter") {
    return `<rect x="-2.4" y="-86" width="4.8" height="80" rx="2" fill="url(#g-metal)"/><circle cx="0" cy="-5" r="4.4" fill="#cfe8ff" fill-opacity="0.7" stroke="#fff" stroke-opacity="0.75" stroke-width="0.8"/>
      <rect x="-20" y="-154" width="40" height="72" rx="6" fill="#2b3340" stroke="#fff" stroke-opacity="0.38"/>
      <rect x="-15" y="-146" width="30" height="20" rx="2" fill="#b9d7a8"/><text class="cl-lcd" x="0" y="-131.5">--.-</text>
      <circle cx="-7" cy="-106" r="3.6" fill="#e2574c"/><circle cx="7" cy="-106" r="3.6" fill="#8892a0"/>${hit(b)}`;
  }
  if (key === "wire") {
    return `<path d="M-4 -33L32 -2" stroke="#fff" stroke-opacity="0.4" stroke-width="5.5" stroke-linecap="round"/><path d="M-4 -33L32 -2" stroke="#fff" stroke-opacity="0.75" stroke-width="1" stroke-linecap="round"/>
      <path d="M-31.5 -56L-4 -33" stroke="#cfd4db" stroke-width="1.5" stroke-linecap="round"/><circle class="cl-loop" cx="-34" cy="-58" r="3.4" fill="transparent" stroke="#cfd4db" stroke-width="1.5"/>${hit(b)}`;
  }
  if (key === "waste") {
    const d = "M-56 -66h112l-10 62a6 6 0 0 1-6 4h-80a6 6 0 0 1-6-4z";
    return `${shadow(60)}<path d="${d}" fill="#56606e" stroke="#fff" stroke-opacity="0.3"/><path d="${d}" fill="url(#g-shade)"/>
      <ellipse class="cl-g-rim" cx="0" cy="-66" rx="56" ry="7"/><ellipse cx="0" cy="-66" rx="52" ry="5" fill="#1b1f26"/>
      <text class="cl-waste-t" x="0" y="-26">WASTE</text>${hit(b)}`;
  }
  if (key === "pipette") {
    const glass = "M-1.4 0L-2.8 -20V-64q-6.5 -6 -6.5 -22t6.5 -22V-150h5.600V-108q6.5 6 6.5 22t-6.5 22V-20L1.4 0z";
    return `<path class="cl-drop-liq" d="M-1 -2L-1.9 -20V-63q-5.8 -6 -5.8 -23t5.8 -23V-128h3.800V-109q5.8 6 5.8 23t-5.8 23V-20L1 -2z" fill="transparent"/>
      <path d="${glass}" fill="url(#g-glass)" stroke="#fff" stroke-opacity="0.72" stroke-width="0.9" stroke-linejoin="round"/>
      <path d="M-5.6 -98q-2.6 12 0 24" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round"/><path d="M-1.3 -146V-112M-1.3 -60V-24" stroke="#fff" stroke-opacity="0.7" stroke-width="0.9" stroke-linecap="round"/>
      <path class="cl-mark" d="M-2.8 -130h5.6"/><ellipse cx="0" cy="-86" rx="6.2" ry="2" fill="none" stroke="#fff" stroke-opacity="0.18"/>
      <rect x="-5.5" y="-155" width="11" height="8" rx="2" fill="#2c3038"/><ellipse cx="0" cy="-155" rx="5.5" ry="1.6" fill="#3d434d"/>
      <path d="M-5 -154c-8 -8 -8 -26 0 -34q5 -4 10 0c8 8 8 26 0 34z" fill="url(#g-rubber)"/><path d="M-3 -182q-4 10 -1 22" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="1.5" stroke-linecap="round"/>${hit(b)}`;
  }
  if (key === "funnel") {
    // plain glass: a cone at sixty degrees and a stem cut on the slant. The paper is a piece of its own.
    const d = "M-36 -58L-4.5 -12V26l9 4V-12L36 -58";
    return `<path d="${d}z" fill="#fff" fill-opacity="0.03"/>
      <ellipse cx="0" cy="-58" rx="36" ry="6" fill="#fff" fill-opacity="0.05"/>
      <path d="M-36 -58A36 6 0 0 1 36 -58" fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="0.9"/>
      <path d="${d}z" fill="url(#g-glass)"/><path class="cl-g-edge" d="${d}"/>
      <path d="M-30 -55.500L-6 -18" stroke="#fff" stroke-opacity="0.5" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M-2.6 -10V22" stroke="#fff" stroke-opacity="0.55" stroke-width="1" stroke-linecap="round"/>
      <path d="M22 -50.500L7 -25" stroke="#fff" stroke-opacity="0.14" stroke-width="3" stroke-linecap="round"/>
      <path d="M-36 -58A36 6 0 0 0 36 -58" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="1.3"/>${hit(b)}`;
  }
  if (key === "paper") {
    // FLAT: a disc lying on the bench, creased where it was folded in half and in half again.
    // CONE: opened out of that quarter fold: one thickness on one side, three on the other,
    // which is why one side is whiter and stiffer and shows the stepped edges of the layers.
    const cone = "M-30 -55Q0 -48 30 -55L0 -15z";
    return `<g class="cl-paper-flat">
        <ellipse cx="1" cy="-3" rx="31" ry="7.5" fill="#000" fill-opacity="0.28" filter="url(#g-soft)"/>
        <ellipse cx="0" cy="-6" rx="30" ry="7.5" fill="#f7f4ec"/><ellipse cx="0" cy="-6" rx="30" ry="7.5" fill="url(#g-paper-sheen)"/>
        <ellipse cx="0" cy="-6" rx="30" ry="7.5" filter="url(#g-fibre)" opacity="0.5"/>
        <path d="M-30 -6H30M0 -13.500V1.5" stroke="#b9b29f" stroke-opacity="0.75" stroke-width="0.7"/>
        <path d="M-29 -5H29M1 -13V1" stroke="#fff" stroke-opacity="0.7" stroke-width="0.5"/>
        <ellipse cx="0" cy="-6" rx="30" ry="7.5" fill="none" stroke="#d6d0bf" stroke-width="0.6"/>
      </g>
      <g class="cl-paper-cone">
        <path d="M-30 -55A30 5 0 0 1 30 -55Q0 -48 -30 -55z" fill="#d9d3c2"/>
        <path d="${cone}" fill="#f7f4ec"/><path d="${cone}" fill="url(#g-paper-sheen)"/>
        <path d="M5 -50.600Q18 -52 30 -55L0 -15z" fill="#ebe6d8"/><path d="M15 -52Q23 -53.2 30 -55L0 -15z" fill="#e0dac9"/>
        <path d="${cone}" filter="url(#g-fibre)" opacity="0.55"/>
        <path class="cl-wet" d="M-22 -46Q0 -40 22 -46L0 -15z" fill="transparent"/>
        <path class="cl-residue" d="M-13 -33Q0 -27 13 -33L0 -15.500z" fill="transparent"/>
        <path d="M0 -15L5 -50.600M0 -15L15 -52" stroke="#bdb5a0" stroke-width="0.7" fill="none"/>
        <path d="M0 -15L-30 -55" stroke="#fff" stroke-opacity="0.8" stroke-width="0.8"/>
        <path d="M5 -50.600q1 -2.4 3.4 -2.600M15 -52q1 -2 3 -2.2" stroke="#a9a18c" stroke-width="0.7" fill="none"/>
        <path d="M-30 -55Q0 -48 30 -55" fill="none" stroke="#fff" stroke-opacity="0.9" stroke-width="0.9"/>
        <path d="M-30 -55A30 5 0 0 1 30 -55" fill="none" stroke="#c9c2af" stroke-width="0.7"/>
      </g>
      <g class="cl-paper-fold" transform="translate(0 -92)">
        <path class="pf pf-under" d="M-26 0A26 26 0 0 0 26 0z"/>
        <path class="pf pf-over" d="M-26 0A26 26 0 0 1 26 0z"/>
        <path class="pf pf-crease pf-crease1" d="M-26 0H26"/>
        <path class="pf pf-right" d="M0 0H26A26 26 0 0 1 0 26z"/>
        <path class="pf pf-left" d="M0 0H-26A26 26 0 0 0 0 26z"/>
        <path class="pf pf-crease pf-crease2" d="M0 0V26"/>
        <g class="pf-wedge"><path class="pf" d="M0 0H26A26 26 0 0 1 0 26z"/><path class="pf pf-layer" d="M0 0L18.4 18.4A26 26 0 0 1 0 26z"/><path class="pf pf-crease" d="M0 0H26M0 0V26"/></g>
      </g>${hit(b)}`;
  }
  if (key === "bung" || key === "bung1") {
    // a rubber stopper: a tapered plug with a flat top, the mould line round it, a sheen down one
    // side. The one-hole kind is bored through for a glass tube. (.cl-bung-body is widened or
    // narrowed by main.js to fit the neck it is pushed into.)
    return `<g class="cl-bung-body">
        <path d="M-9.5 9a9.5 2.4 0 0 0 19 0L13 -9H-13z" fill="url(#g-bung)" stroke="#5b2416" stroke-width="0.7" stroke-linejoin="round"/>
        <path d="M-12.3 -5.500h24.600M-11.2 0h22.400M-10.3 5h20.6" stroke="#4a1c10" stroke-opacity="0.22" stroke-width="0.5"/>
        <path d="M-10.6 -6L-8 8" stroke="#fff" stroke-opacity="0.42" stroke-width="1.7" stroke-linecap="round"/>
        <ellipse cx="0" cy="-9" rx="13" ry="3" fill="#cf6a4d" stroke="#5b2416" stroke-width="0.6"/>
        <ellipse cx="-2" cy="-9.6" rx="8.5" ry="1.5" fill="#fff" fill-opacity="0.2"/>
        ${key === "bung1" ? `<ellipse cx="0" cy="-9" rx="3.6" ry="1.2" fill="#190c08"/><path d="M-3.6 -9a3.6 1.2 0 0 0 7.2 0" fill="none" stroke="#e9967d" stroke-opacity="0.7" stroke-width="0.5"/>` : ""}
      </g>${hit(b)}`;
  }
  if (key === "tubing") {
    // glass tubing bent at a right angle: one leg goes down through the stopper, the other takes
    // the rubber tube, which is pushed a little way over it. The rubber tube itself is drawn by
    // main.js, because it hangs and swings.
    const run = "M0 18V-42Q0 -56 14 -56H36";
    // (only the hand-hold above the stopper takes the pointer: the leg that goes down through the
    // stopper must not, or the stopper under it could never be picked up)
    return `<g pointer-events="none"><path d="${run}" fill="none" stroke="#fff" stroke-opacity="0.78" stroke-width="5.4" stroke-linecap="butt" stroke-linejoin="round"/>
      <path d="${run}" fill="none" stroke="#2a313b" stroke-width="3.4" stroke-linecap="butt" stroke-linejoin="round"/>
      <path d="${run}" fill="none" stroke="#9fc4e0" stroke-opacity="0.16" stroke-width="3.4"/>
      <path d="M-1.3 16V-42Q-1.3 -57.3 14 -57.3H34" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="0.9" stroke-linecap="round"/>
      <ellipse cx="0" cy="18" rx="2.7" ry="0.9" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.7"/>
      <rect x="29" y="-60.2" width="10" height="8.4" rx="2.6" fill="#8a4f1f"/><rect x="29" y="-60.2" width="10" height="8.4" rx="2.6" fill="url(#g-shade)" opacity="0.5"/>
      <path d="M30.5 -58.6h7" stroke="#fff" stroke-opacity="0.4" stroke-width="1" stroke-linecap="round"/></g>${hit(b)}`;
  }
  if (key === "cap") return `${CAPS[it.v || "bottle"](0, it.rgb)}${hit(CAP_BOX[it.v || "bottle"])}`;
  if (key === "condenser") {
    // drawn from the joint that pushes onto a flask's side arm, sloping down to the outlet.
    // Everything is a cylinder seen from the side: shaded across its width, with an ellipse at each end.
    const cyl = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"${extra}/>`;
    return `<g transform="rotate(23.3)">
        ${cyl(4, -4.5, 230, 9, "#fff", ' fill-opacity="0.04"')}${cyl(4, -4.5, 230, 9, "url(#g-glass-v)", ' stroke="#fff" stroke-opacity="0.7" stroke-width="0.8"')}
        <rect x="-5" y="-6" width="18" height="12" rx="2.5" fill="#c0563c"/><rect x="-5" y="-6" width="18" height="12" rx="2.5" fill="url(#g-glass-v)" opacity="0.7"/><ellipse cx="-5" cy="0" rx="1.8" ry="6" fill="#8e3a28"/>
        <rect x="172" y="12" width="8" height="14" rx="2" fill="url(#g-glass)" stroke="#fff" stroke-opacity="0.65" stroke-width="0.8"/><ellipse cx="176" cy="26" rx="4" ry="1.4" fill="#1d2128" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>
        <rect x="58" y="-26" width="8" height="14" rx="2" fill="url(#g-glass)" stroke="#fff" stroke-opacity="0.65" stroke-width="0.8"/><ellipse cx="62" cy="-26" rx="4" ry="1.4" fill="#1d2128" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>
        ${cyl(34, -13, 170, 26, "url(#g-water-v)")}
        ${cyl(34, -13, 170, 26, "url(#g-glass-v)", ' stroke="#fff" stroke-opacity="0.8" stroke-width="1.1"')}
        <rect x="46" y="-10.5" width="146" height="2.6" rx="1.3" fill="url(#g-shine-v)"/><rect x="60" y="7.5" width="110" height="1.6" rx="0.8" fill="#fff" fill-opacity="0.22"/>
        <ellipse cx="37" cy="0" rx="3.4" ry="12.5" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="0.9"/><ellipse cx="201" cy="0" rx="3.4" ry="12.5" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="0.9"/>
        <rect x="14" y="-2.2" width="212" height="1.3" rx="0.6" fill="#fff" fill-opacity="0.55"/>
      </g>
      <path d="M213 92q14 5 16 22" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="8" stroke-linecap="round"/><path d="M213 92q14 5 16 22" fill="none" stroke="#2f3540" stroke-width="5.4" stroke-linecap="round"/>
      <path d="M214.5 90.500q11 5 13.5 20" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="1.1" stroke-linecap="round"/><ellipse cx="229" cy="114" rx="3.8" ry="1.3" fill="#1d2128" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>${hit(b)}`;
  }
  if (key === "electrode") {
    return `<rect x="-4" y="-18" width="8" height="118" rx="2" fill="#30343b" stroke="#fff" stroke-opacity="0.25" stroke-width="0.7"/><rect x="-2.5" y="-16" width="1.6" height="112" fill="#fff" fill-opacity="0.14"/>
      <rect class="cl-coat" x="-5.5" y="26" width="11" height="74" rx="2.5" fill="transparent"/>
      <rect x="-6" y="-28" width="12" height="11" rx="2" fill="#aab2bd" stroke="#fff" stroke-opacity="0.4" stroke-width="0.7"/><text class="cl-pole" x="0" y="-34"></text>${hit(b)}`;
  }
  if (key === "power") {
    // a bench low-voltage supply: a pressed-steel case with cooling slots, a red LED read-out, a
    // voltage knob, a rocker switch, and two 4 mm binding posts on top (black −, red +) that the leads go to
    const slots = [-49, -44, -39, -34, -29, -24].map((y) => `<rect x="-43" y="${y}" width="15" height="2.2" rx="1.1" fill="#0c0e11"/><rect x="-43" y="${y + 2.2}" width="15" height="0.6" fill="#fff" fill-opacity="0.14"/>`).join("");
    const ticks = [-130, -95, -60, -25, 10, 45].map((d, i) => `<path d="M0 -10.500V-13" transform="translate(-9 -17) rotate(${d})" stroke="#cfd5dc" stroke-width="${i === 2 ? 1.3 : 0.8}"/>`).join("");
    const post = (x, col, dark) => `<rect x="${x - 6}" y="-59" width="12" height="4" rx="1" fill="url(#g-metal)"/><rect x="${x - 4.5}" y="-69" width="9" height="11" rx="1.5" fill="${col}"/>
      <rect x="${x - 4.5}" y="-69" width="9" height="11" rx="1.5" fill="url(#g-shade)" opacity="0.5"/>
      <path d="M${x - 3} -68V-59M${x - 1} -68V-59M${x + 1} -68V-59M${x + 3} -68V-59" stroke="${dark}" stroke-width="0.7"/>
      <ellipse cx="${x}" cy="-69" rx="4.5" ry="1.4" fill="${col}" stroke="#fff" stroke-opacity="0.45" stroke-width="0.6"/><circle cx="${x}" cy="-69" r="1.3" fill="#0c0e11"/>`;
    return `${shadow(54)}
      <rect x="-42" y="-2" width="14" height="4" rx="1.5" fill="#14171b"/><rect x="28" y="-2" width="14" height="4" rx="1.5" fill="#14171b"/>
      <rect x="-48" y="-56" width="96" height="55" rx="3" fill="url(#g-psu)" stroke="#fff" stroke-opacity="0.32" stroke-width="0.8"/>
      <rect x="-48" y="-56" width="96" height="3" rx="1.5" fill="#fff" fill-opacity="0.2"/><rect x="-48" y="-5" width="96" height="4" fill="#000" fill-opacity="0.25"/>
      <rect x="-48" y="-56" width="96" height="55" rx="3" fill="url(#g-shade)" opacity="0.45"/>
      <circle cx="-45" cy="-53" r="1" fill="#0c0e11"/><circle cx="45" cy="-53" r="1" fill="#0c0e11"/><circle cx="-45" cy="-4" r="1" fill="#0c0e11"/><circle cx="45" cy="-4" r="1" fill="#0c0e11"/>
      ${slots}
      <rect x="-24" y="-50" width="40" height="17" rx="1.5" fill="#0a0c0f" stroke="#5b6470" stroke-width="0.8"/><rect x="-22.5" y="-48.5" width="37" height="14" rx="1" fill="#1c0b0b"/>
      <text class="cl-psu cl-psu--ghost" x="5" y="-37.5">88.8</text><text class="cl-psu cl-psu--off" x="5" y="-37.5">0.0</text><text class="cl-psu cl-psu--on" x="5" y="-37.5">6.0</text><text class="cl-psu-u" x="10.5" y="-37.5">V</text>
      <rect x="-22.5" y="-48.5" width="37" height="4" fill="#fff" fill-opacity="0.07"/>
      ${ticks}
      <circle cx="-9" cy="-17" r="8.4" fill="#0c0e11"/><circle cx="-9" cy="-17" r="7.2" fill="url(#g-knob)"/><circle cx="-9" cy="-17" r="7.2" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="0.6"/>
      <path d="M-9 -17L-12.6 -23" stroke="#f4c95d" stroke-width="1.6" stroke-linecap="round"/><circle cx="-9" cy="-17" r="2.2" fill="#23272e"/>
      <text class="cl-plate cl-plate--l" x="-9" y="-4.5">VOLTS d.c.</text><text class="cl-plate cl-plate--l" x="-35.5" y="-13">PREP</text><text class="cl-plate cl-plate--l" x="-35.5" y="-8">LV-6</text>
      <text class="cl-plate cl-plate--l" x="7" y="-22">2 A max</text>
      ${post(-14, "#23272e", "#000")}${post(14, "#c0453a", "#7a241c")}${hit(b)}
      <g class="cl-press" data-press="power"><rect x="21" y="-48" width="20" height="33" rx="2" fill="#0c0e11" stroke="#5b6470" stroke-width="0.8"/><rect x="23" y="-46" width="16" height="29" rx="1.5" fill="#1d2127"/>
        <rect class="cl-switch" x="24.5" y="-44.5" width="13" height="12.5" rx="1.5" fill="#e2574c"/><path d="M27 -9.500h8" stroke="#cfd5dc" stroke-width="0.8"/><text class="cl-plate cl-plate--l" x="31" y="-5">ON</text>
        <rect x="14" y="-54" width="34" height="46" fill="transparent"/></g>`;
  }
  if (key === "syringe") {
    // a glass barrel lying on its side: shaded across, an ellipse where each end is seen, a plunger with a ground-glass head
    let ticks = "";
    for (let n = 0; n <= 100; n += 5) ticks += `<path class="cl-mark" d="M${-86 + n * 1.04} -21v${n % 50 === 0 ? 9 : n % 10 === 0 ? 6 : 3.5}"/>${n % 50 === 0 ? `<text class="cl-mark-n" x="${-86 + n * 1.04}" y="-25" text-anchor="middle">${n}</text>` : ""}`;
    return `${shadow(64)}
      <g class="cl-plunger">
        <rect x="-84" y="-17" width="126" height="12" rx="6" fill="#fff" fill-opacity="0.1"/><rect x="-84" y="-17" width="126" height="12" rx="6" fill="url(#g-glass-v)" stroke="#fff" stroke-opacity="0.55" stroke-width="0.8"/>
        <rect x="-90" y="-20" width="9" height="18" rx="2.5" fill="url(#g-frost)" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/><ellipse cx="-90" cy="-11" rx="2" ry="9" fill="#cfd6de"/>
        <rect x="38" y="-27" width="7" height="32" rx="3" fill="url(#g-frost)" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8"/><ellipse cx="45" cy="-11" rx="2.2" ry="15.5" fill="#e8edf3" fill-opacity="0.8"/>
      </g>
      <rect x="-92" y="-22" width="116" height="22" rx="5" fill="#fff" fill-opacity="0.035"/>
      <rect x="-92" y="-22" width="116" height="22" rx="5" fill="url(#g-glass-v)" stroke="#fff" stroke-opacity="0.82" stroke-width="1.1"/>
      <rect x="-84" y="-19.5" width="98" height="2.6" rx="1.3" fill="url(#g-shine-v)"/><rect x="-70" y="-4.5" width="70" height="1.5" rx="0.7" fill="#fff" fill-opacity="0.25"/>
      <ellipse cx="-88" cy="-11" rx="3" ry="10.5" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="0.9"/>
      <rect x="20" y="-27" width="6" height="32" rx="2.5" fill="url(#g-glass)" stroke="#fff" stroke-opacity="0.75" stroke-width="0.8"/><ellipse cx="26" cy="-11" rx="2" ry="15.5" fill="#fff" fill-opacity="0.12"/>
      <path d="M-92 -15h-8l-5 2.500v3l5 2.500h8z" fill="url(#g-glass-v)" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8"/><ellipse cx="-105" cy="-11" rx="1" ry="1.7" fill="#1d2128" stroke="#fff" stroke-opacity="0.6" stroke-width="0.6"/>${ticks}
      <text class="cl-read" x="60" y="-32">0 cm\u00b3</text>${hit(b)}`;
  }
  if (key === "rod") {
    return `<path d="M-34 -58L40 2" stroke="#fff" stroke-opacity="0.16" stroke-width="6" stroke-linecap="round"/><path d="M-34 -58L40 2" stroke="url(#g-streak)" stroke-width="5" stroke-linecap="round" opacity="0.5"/>
      <path d="M-34 -58L40 2" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="0.9" stroke-linecap="round" transform="translate(-1.6 2)"/><path d="M-34 -58L40 2" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="0.9" stroke-linecap="round" transform="translate(1.6 -2)"/>${hit(b)}`;
  }
  if (key === "magnet") {
    // a horseshoe magnet, poles down: red enamel, bare steel pole pieces, and the beard of
    // filings it picks up
    const beard = [-15, -11, -8, 8, 11, 15].map((x, i) => `<path d="M${x} 0l${(i % 3) - 1} ${5 + (i % 2) * 3}M${x + 1.5} 0l${1 - (i % 3)} ${7 - (i % 2) * 2}M${x - 1.5} 0l${(i % 2) - 0.5} 6" stroke="#3a3d44" stroke-width="1.1" stroke-linecap="round"/>`).join("");
    return `<ellipse cx="0" cy="2" rx="22" ry="3.5" fill="#000" fill-opacity="0.3" filter="url(#g-soft)"/>
      <path d="M-18 -12V-40a18 18 0 0 1 36 0V-12H7V-40a7 7 0 0 0 -14 0V-12z" fill="#c8382f" stroke="#7a1f19" stroke-width="0.8"/>
      <path d="M-18 -12V-40a18 18 0 0 1 36 0V-12H7V-40a7 7 0 0 0 -14 0V-12z" fill="url(#g-shade)" opacity="0.55"/>
      <path d="M-15.5 -14V-40a15.5 15.5 0 0 1 11 -14.8" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>
      <rect x="-18" y="-12" width="11" height="12" fill="url(#g-metal)" stroke="#4a515b" stroke-width="0.6"/><rect x="7" y="-12" width="11" height="12" fill="url(#g-metal)" stroke="#4a515b" stroke-width="0.6"/>
      <text class="cl-pole-n" x="-12.5" y="-3">N</text><text class="cl-pole-n" x="12.5" y="-3">S</text>
      <g class="cl-beard">${beard}</g>${hit(b)}`;
  }
  if (key === "chroma") {
    // a strip of chromatography paper hung from a glass rod laid across a beaker: a pencil line
    // near the bottom with the ink spot on it, and millimetres marked up the edge to measure by
    let rule = "";
    for (let mm = 0; mm <= 80; mm += 5) rule += `<path d="M${mm % 10 === 0 ? 7 : 9} ${86 - mm}H12" stroke="#8d8672" stroke-width="0.5"/>${mm % 20 === 0 && mm ? `<text class="cl-mm" x="5.5" y="${88 - mm}">${mm}</text>` : ""}`;
    return `<rect x="-38" y="-5" width="76" height="5" rx="2.5" fill="url(#g-glass-v)" stroke="#fff" stroke-opacity="0.7" stroke-width="0.7"/><rect x="-36" y="-4.2" width="72" height="1.1" rx="0.5" fill="#fff" fill-opacity="0.7"/>
      <path d="M-12 -5.500V100H12V-5.500q-12 -4 -24 0z" fill="#f7f4ec" stroke="#cfc8b6" stroke-width="0.6"/>
      <path d="M-12 -5.500V100H12V-5.500q-12 -4 -24 0z" fill="url(#g-paper-sheen)" opacity="0.7"/>
      <clipPath id="cp-${it && it.id ? it.id : "tile"}"><rect x="-12" y="0" width="24" height="100"/></clipPath>
      <g clip-path="url(#cp-${it && it.id ? it.id : "tile"})">
        <rect class="cl-wetfront" x="-12" y="100" width="24" height="0" fill="#5b7fa8" fill-opacity="0.2"/>
        <ellipse class="cl-dye" data-n="0" cx="0" cy="86" rx="5" ry="3.6" opacity="0"/><ellipse class="cl-dye" data-n="1" cx="0" cy="86" rx="5" ry="3.6" opacity="0"/><ellipse class="cl-dye" data-n="2" cx="0" cy="86" rx="5" ry="3.6" opacity="0"/>
        <path class="cl-front" d="M-12 100H12" stroke="#5b7fa8" stroke-opacity="0.75" stroke-width="0.9"/>
      </g>
      <path d="M-12 86H12" stroke="#7c7868" stroke-width="0.6" stroke-dasharray="1.5 1.2"/>
      <circle class="cl-ink" cx="0" cy="86" r="3" fill="#1c1c22"/>${rule}${hit(b)}`;
  }
  if (key === "holder") {
    // the wooden kind: two beech arms hinged like a clothes peg on a coiled steel spring, a round
    // notch cut in the jaws for the tube, lying on the bench
    return `<ellipse cx="0" cy="-1" rx="40" ry="4" fill="#000" fill-opacity="0.32" filter="url(#g-soft)"/>
      <path d="M-40 -9.500q-2 -1 -1 -3.500l1 -1.500h49l6 2.500h22q3 0 3 3v2.500q0 2.5 -3 2.500h-74q-3 0 -4 -2z" fill="url(#g-wood)" stroke="#6f4a1e" stroke-width="0.7"/>
      <path d="M-38 -11.500h74M-36 -8.500h70" stroke="#7d5425" stroke-opacity="0.45" stroke-width="0.5"/><path d="M-39 -13.500h47" stroke="#fff" stroke-opacity="0.4" stroke-width="0.8"/>
      <path d="M-40 -30q-2 1 -2 3l1 2.500l49 9l6 -3.500l22 4q3 0.5 3.5 -2.200l0.4 -2.200q0.4 -2.6 -2.5 -3.200l-73 -13.400q-3 -0.6 -4.4 1z" fill="url(#g-wood)" stroke="#6f4a1e" stroke-width="0.7"/>
      <path d="M-38 -27.500l72 13M-37 -30.500l70 12.8" stroke="#7d5425" stroke-opacity="0.45" stroke-width="0.5"/><path d="M-38 -32l72 13.2" stroke="#fff" stroke-opacity="0.45" stroke-width="0.8"/>
      <circle cx="29" cy="-12.5" r="5.2" fill="#262b33"/><path d="M24 -13.500a5.2 5.2 0 0 1 9.5 -2" fill="none" stroke="#6f4a1e" stroke-width="0.8"/><path d="M24.5 -10a5.2 5.2 0 0 0 9 0.5" fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="0.7"/>
      <path d="M-16 -3.500V-12M-16 -29.500V-23" stroke="#5d6570" stroke-width="2.6" stroke-linecap="round"/><path d="M-16 -3.500V-12M-16 -29.500V-23" stroke="#e2e7ee" stroke-width="1.2" stroke-linecap="round"/>
      ${[-20, -17, -14, -11].map((x) => `<ellipse cx="${x}" cy="-19" rx="2.2" ry="5.6" fill="none" stroke="#5d6570" stroke-width="2.2"/><ellipse cx="${x}" cy="-19" rx="2.2" ry="5.6" fill="none" stroke="#dfe5ec" stroke-width="1"/>`).join("")}
      <path d="M-22 -22.500q1 -3 3 -3" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.7" stroke-linecap="round"/>${hit(b)}`;
  }
  if (key === "tongs") {
    // nickel-plated steel, like long scissors: two finger bows, a riveted joint, arms that
    // bow out and come back to a pair of curved jaws that close round a crucible
    const armA = "M-34 -22.500C-24 -20 -14 -17 -6 -16C8 -14 20 -6.5 30 -8.500C35 -9.5 38 -12.5 40 -15";
    const armB = "M-34 -9.500C-24 -12 -14 -15 -6 -16C8 -18 20 -25.5 30 -23.500C35 -22.5 38 -19.5 40 -17";
    const steel = (d, w = 3.6) => `<path d="${d}" fill="none" stroke="#4a515b" stroke-width="${w + 1.4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#b9c1cb" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="${(w * 0.28).toFixed(1)}" stroke-linecap="round" transform="translate(0 -0.9)"/>`;
    const bow = (cy) => `<ellipse cx="-38.5" cy="${cy}" rx="5.4" ry="4.6" fill="none" stroke="#4a515b" stroke-width="4.4"/><ellipse cx="-38.5" cy="${cy}" rx="5.4" ry="4.6" fill="none" stroke="#b9c1cb" stroke-width="3"/><path d="M-43 ${cy - 2.5}a5.4 4.6 0 0 1 8 -1.5" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.9" stroke-linecap="round"/>`;
    return `<ellipse cx="0" cy="-2" rx="42" ry="4" fill="#000" fill-opacity="0.3" filter="url(#g-soft)"/>
      ${bow(-8)}${steel(armB)}${bow(-24)}${steel(armA)}
      <circle cx="-6" cy="-16" r="4.2" fill="#4a515b"/><circle cx="-6" cy="-16" r="3.3" fill="url(#g-knob)"/><circle cx="-7" cy="-17" r="1.1" fill="#fff" fill-opacity="0.8"/>
      <path d="M36 -11.500q3 -1.5 4 -3.500M36 -20.500q3 1.5 4 3.5" fill="none" stroke="#4a515b" stroke-width="1" stroke-linecap="round"/>${hit(b)}`;
  }
  if (key === "lit") {
    return `${splint(`<g class="cl-tip"><circle cx="-34" cy="-62" r="15" fill="url(#g-ember)" opacity="0.55"/>
      <path class="cl-flame" d="M-34 -84c6 9 9 12 9 18a9 9 0 0 1-18 0c0-6 3-9 9-18z" fill="#ff9a2a"/>
      <path class="cl-flame" d="M-34 -72c3 4 4 6 4 9a4 4 0 0 1-8 0c0-3 1-5 4-9z" fill="#ffe27a"/></g>
      <g class="cl-after"></g>`)}${hit(b)}`;
  }
  if (key === "glow") {
    return `${splint(`<g class="cl-tip"><circle cx="-34" cy="-58" r="13" fill="url(#g-ember)" opacity="0.8"/><circle cx="-34" cy="-58" r="3.6" fill="#ffb24a"/></g><g class="cl-after"></g>`)}${hit(b)}`;
  }
  return `<rect class="cl-paper cl-paper--${key}" x="-7" y="-64" width="14" height="64" rx="1.2"/>
    <rect class="cl-turn" x="-7" y="-40" width="14" height="40" mask="url(#m-feather)"/>
    <rect class="cl-wet" x="-7" y="-34" width="14" height="34" mask="url(#m-feather)"/>
    <rect x="-7" y="-64" width="14" height="64" rx="1.2" fill="url(#g-shade)" opacity="0.5"/>${hit(b)}`;
}

/** What a splint shows once it has been held at a mouth. */
export function splintAfter(end) {
  const flame = (s) => `<g transform="translate(-34 -58) scale(${s})"><path d="M0 -30c7 10 11 14 11 21a11 11 0 0 1-22 0c0-7 4-11 11-21z" fill="#ff9a2a"/><path d="M0 -15c4 5 5 7 5 11a5 5 0 0 1-10 0c0-4 1-6 5-11z" fill="#ffe27a"/></g>`;
  if (end === "pop") return [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-35.5" y="-84" width="3" height="13" rx="1.5" fill="#ffe27a" transform="rotate(${a} -34 -60)"/>`).join("");
  if (end === "out") return `<path d="M-34 -64q-7-9 0-17t0-16" fill="none" stroke="#c9d0d8" stroke-opacity="0.75" stroke-width="2.6" stroke-linecap="round"/>`;
  if (end === "bright" || end === "relight") return flame(1.25);
  return "";
}

// ── things that hold other things ───────────────────────────────────────────
// slots = where a vessel's foot rests, in the support's own space; fits = which vessels it will take
export const SUPPORTS = {
  rack: { name: "Test tube rack", slots: [-110, -55, 0, 55, 110].map((x) => [x, -12]), fits: (d) => Boolean(d.rack), bbox: { x0: -156, y0: -92, x1: 156, y1: 8 } },
  // four tubes at a time, two and two opposite each other: (0, 3) and (1, 2) are the pairs
  centrifuge: { name: "Centrifuge", slots: [-48, -16, 16, 48].map((x) => [x, -6]), fits: (d) => Boolean(d.rack), bbox: { x0: -86, y0: -150, x1: 86, y1: 8 } },
  tripod: { name: "Tripod and gauze", slots: [[0, -158]], fits: (d) => Boolean(d.flat) && !d.fixed && d.rMax < 90, bbox: { x0: -64, y0: -164, x1: 64, y1: 8 } },
  balance: { name: "Electronic balance", slots: [[0, -46]], fits: (d) => !d.fixed && d.rMax < 90, bbox: { x0: -84, y0: -58, x1: 84, y1: 8 } },
  // its one slot is wherever the clamp has been slid to (main.js works the height out for each vessel)
  stand: { name: "Retort stand and clamp", slots: [[44, 0]], clamp: [-452, -110], fits: (d) => !d.material && d.rMax <= 60 && !d.upturns, bbox: { x0: -56, y0: -486, x1: 80, y1: 8 } },
};
/** In two halves: the back goes behind what it holds, the front in front of it. */
export function supportSvg(key) {
  const b = SUPPORTS[key].bbox;
  if (key === "tripod") {
    return {
      back: `${shadow(62)}
        <path d="M-42 -150L-56 0M42 -150L56 0M0 -150V-8" stroke="#8d96a3" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M-41 -150L-55 0M43 -150L57 0" stroke="#fff" stroke-opacity="0.3" stroke-width="1.2" stroke-linecap="round" fill="none"/>
        <ellipse cx="0" cy="-150" rx="46" ry="6" fill="none" stroke="#aab2bd" stroke-width="4"/>
        <rect x="-54" y="-158" width="108" height="5" rx="1" fill="#7d8691"/><path d="M-50 -155.5h100" stroke="#fff" stroke-opacity="0.25" stroke-dasharray="2 3"/>
        <rect x="-27" y="-159" width="54" height="6" rx="2" fill="#e9e6df"/>${hit(b)}`,
      front: "",
    };
  }
  if (key === "balance") {
    // a top-pan electronic balance: a low moulded case, a dark control panel with a liquid-crystal
    // window, a brushed steel pan on its post, a levelling bubble, and the TARE key
    const brush = [-48, -36, -24, -12, 0, 12, 24, 36, 48].map((x) => `<path d="M${x} -51.400q${-x * 0.04} 5.6 ${-x * 0.02} 11" stroke="#fff" stroke-opacity="0.22" stroke-width="0.6" fill="none"/>`).join("");
    return {
      back: `${shadow(86)}
        <rect x="-70" y="-3" width="16" height="4" rx="1.5" fill="#1d2127"/><rect x="54" y="-3" width="16" height="4" rx="1.5" fill="#1d2127"/>
        <path d="M-82 -3v-17q0 -4 4 -5l12 -11h132l12 11q4 1 4 5v17z" fill="url(#g-case)" stroke="#fff" stroke-opacity="0.55" stroke-width="0.8"/>
        <path d="M-66 -36h132l12 11h-156z" fill="#fbfcfd"/><path d="M-66 -36h132l12 11h-156z" fill="url(#g-shade)" opacity="0.18"/>
        <path d="M-78 -25h156" stroke="#9aa1ab" stroke-width="0.7"/><path d="M-82 -3h164" stroke="#7d848e" stroke-width="1"/>
        <rect x="-76" y="-23" width="152" height="18" rx="2" fill="#262b33"/><rect x="-76" y="-23" width="152" height="2" fill="#fff" fill-opacity="0.08"/>
        <rect x="-44" y="-21" width="72" height="14" rx="1.5" fill="#11151a"/>
        <rect x="-42.5" y="-19.8" width="69" height="11.6" rx="1" fill="url(#g-lcd)"/>
        <text class="cl-lcd cl-lcd--ghost" x="18" y="-10.6">888.88</text>
        <text class="cl-lcd cl-lcd--bal" x="18" y="-10.6">0.00</text><text class="cl-lcd-u" x="24" y="-10.6">g</text>
        <circle cx="-60" cy="-14" r="5" fill="#10141a"/><circle cx="-60" cy="-14" r="4.2" fill="#bfe29a"/><circle cx="-60" cy="-14" r="4.2" fill="url(#g-shade)" opacity="0.4"/>
        <circle cx="-60" cy="-14" r="2" fill="none" stroke="#1d2a14" stroke-opacity="0.6" stroke-width="0.4"/><circle cx="-59.5" cy="-14.4" r="1.5" fill="#fff" fill-opacity="0.85"/>
        <circle cx="70" cy="-18.5" r="1.3" fill="#5fe08a"/><text class="cl-plate" x="70" y="-8">ON</text>
        <text class="cl-plate" x="-8" y="-27.6">PREP  PB-602   Max 600 g   d = 0.01 g</text>
        <rect x="-6" y="-46" width="12" height="11" fill="url(#g-metal)"/><ellipse cx="0" cy="-36" rx="13" ry="2.4" fill="#8c95a1"/>
        <path d="M-64 -46a64 8.5 0 0 0 128 0v3a64 8.5 0 0 1 -128 0z" fill="#6f7884"/>
        <ellipse cx="0" cy="-46" rx="64" ry="8.5" fill="url(#g-steel)"/>
        <ellipse cx="0" cy="-46" rx="58" ry="6.8" fill="#fff" fill-opacity="0.16"/>${brush}
        <ellipse cx="0" cy="-46" rx="64" ry="8.5" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="0.9"/>
        <ellipse cx="0" cy="-46" rx="58" ry="6.8" fill="none" stroke="#5d6570" stroke-opacity="0.45" stroke-width="0.6"/>${hit(b)}
        <g class="cl-press" data-press="tare"><rect x="34" y="-20.5" width="28" height="13" rx="2.5" fill="#e2574c" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7"/><rect x="35" y="-19.5" width="26" height="4" rx="2" fill="#fff" fill-opacity="0.2"/><text class="cl-press-t cl-press-t--s" x="48" y="-11.3">TARE</text></g>`,
      front: "",
    };
  }
  if (key === "centrifuge") {
    // a bench centrifuge, seen from the front: tubes drop into four wells in the top (their lower
    // halves are inside, behind the case), a lid closes over them while it spins, and the panel
    // has a speed dial, a run light and the green START key
    const wells = [-48, -16, 16, 48].map((x) => `<ellipse cx="${x}" cy="-128" rx="17" ry="4.5" fill="#12161b"/>`).join("");
    const lips = [-48, -16, 16, 48].map((x) => `<path d="M${x - 17} -128a17 4.5 0 0 0 34 0v4a17 4.5 0 0 1 -34 0z" fill="#8c95a1"/>`).join("");
    return {
      back: `${shadow(88)}
        <path d="M-80 0v-112q0 -16 16 -16h128q16 0 16 16v112z" fill="#3d4652" stroke="#fff" stroke-opacity="0.25"/>
        <ellipse cx="0" cy="-128" rx="78" ry="9" fill="#59626e"/>${wells}${hit(b)}
        <g class="cl-press" data-press="spin"><rect x="34" y="-58" width="38" height="30" fill="transparent"/></g>`,
      front: `${lips}
        <path d="M-80 0v-108q0 -16 16 -16h128q16 0 16 16v108z" fill="url(#g-case)" stroke="#fff" stroke-opacity="0.5" stroke-width="0.8"/>
        <path d="M-80 0v-108q0 -16 16 -16h128q16 0 16 16v108z" fill="url(#g-shade)" opacity="0.35"/>
        <path d="M-78 -112q0 -10 14 -10h128q14 0 14 10" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="1"/>
        <rect x="-70" y="-3" width="18" height="5" rx="1.5" fill="#1d2127"/><rect x="52" y="-3" width="18" height="5" rx="1.5" fill="#1d2127"/>
        <rect x="-72" y="-68" width="144" height="50" rx="3" fill="#262b33"/><rect x="-72" y="-68" width="144" height="2.5" fill="#fff" fill-opacity="0.1"/>
        <circle cx="-44" cy="-43" r="15" fill="#0c0e11"/><circle cx="-44" cy="-43" r="12.5" fill="url(#g-knob)"/><path d="M-44 -43l6 -9" stroke="#f4c95d" stroke-width="2" stroke-linecap="round"/>
        ${[-150, -110, -70, -30, 10, 50].map((d) => `<path d="M0 -17.500V-20.5" transform="translate(-44 -43) rotate(${d})" stroke="#cfd5dc" stroke-width="0.9"/>`).join("")}
        <text class="cl-plate cl-plate--l" x="-44" y="-22">SPEED</text>
        <rect x="-18" y="-58" width="40" height="17" rx="1.5" fill="#0a0c0f" stroke="#5b6470" stroke-width="0.8"/>
        <text class="cl-psu cl-psu--ghost" x="18" y="-45">8888</text><text class="cl-psu cl-rpm cl-rpm--off" x="18" y="-45">0</text><text class="cl-psu cl-rpm cl-rpm--on" x="18" y="-45">3000</text>
        <text class="cl-plate cl-plate--l" x="2" y="-33">rev / min</text>
        <rect x="36" y="-56" width="34" height="26" rx="3" fill="#2f9e5b" stroke="#fff" stroke-opacity="0.5" stroke-width="0.8"/><rect x="38" y="-54" width="30" height="7" rx="2.5" fill="#fff" fill-opacity="0.22"/>
        <text class="cl-press-t cl-press-t--s" x="53" y="-39">START</text>
        <text class="cl-plate" x="0" y="-78" style="font-size:4.2px">PREP  CF-4   balance the tubes</text>
        <g class="cl-lid"><path d="M-74 -124q0 -40 74 -40t74 40z" fill="#aab8c8" fill-opacity="0.5" stroke="#fff" stroke-opacity="0.7" stroke-width="1"/><path d="M-60 -130q8 -22 40 -27" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="2.4" stroke-linecap="round"/><rect x="-10" y="-168" width="20" height="6" rx="3" fill="#59626e"/>
          <path class="cl-whirl" d="M-56 -136h30M-10 -146h44M20 -134h34M-40 -150h22" stroke="#fff" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/></g>`,
    };
  }
  if (key === "stand") {
    return {
      back: `${shadow(62)}
        <rect x="-52" y="-12" width="130" height="12" rx="2.5" fill="#4a525e" stroke="#fff" stroke-opacity="0.22"/>
        <rect x="-37" y="-482" width="7" height="472" rx="3" fill="url(#g-metal)"/><rect x="-36" y="-480" width="1.6" height="466" fill="#fff" fill-opacity="0.35"/>
        <rect x="-41" y="-16" width="15" height="6" rx="1.5" fill="#39404a" stroke="#fff" stroke-opacity="0.2"/>${hit(b)}
        <g class="cl-clampg"><rect x="-24" y="-4" width="56" height="6" rx="3" fill="url(#g-metal)"/>
          <g class="cl-press" data-press="clamp"><rect x="-44" y="-10" width="22" height="18" rx="3" fill="#6b7480" stroke="#f4c95d" stroke-opacity="0.85" stroke-width="1"/><path d="M-33 -6v10M-36 -3l3 -3 3 3M-36 1l3 3 3 -3" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="-52" y="-18" width="38" height="34" fill="transparent"/></g></g>`,
      front: `<g class="cl-clampg"><rect x="26" y="-6" width="36" height="10" rx="5" fill="#aab2bd"/><rect x="26" y="-6" width="36" height="3" rx="1.5" fill="#fff" fill-opacity="0.35"/></g>`,
    };
  }
  const xs = SUPPORTS.rack.slots.map(([x]) => x);
  const holes = xs.map((x) => `<ellipse cx="${x}" cy="-76" rx="17" ry="4.5" fill="#1d2128" fill-opacity="0.75"/>`).join("");
  const lips = xs.map((x) => `<path d="M${x - 17} -76a17 4.5 0 0 0 34 0v5a17 4.5 0 0 1-34 0z" fill="#b98548"/>`).join("");
  return {
    back: `${shadow(150)}
      <rect x="-150" y="-84" width="10" height="84" rx="2" fill="#a87438"/><rect x="140" y="-84" width="10" height="84" rx="2" fill="#a87438"/>
      <rect x="-152" y="-84" width="304" height="14" rx="3" fill="url(#g-wood)"/>${holes}${hit(b)}`,
    front: `${lips}<rect x="-154" y="-14" width="308" height="16" rx="4" fill="url(#g-wood)"/><rect x="-154" y="-14" width="308" height="3" rx="1.5" fill="#fff" fill-opacity="0.18"/>`,
  };
}

/** A picture of any piece on its own, for the drawer. */
export function thumb(kind, key) {
  const uid = `th-${kind}-${key}`;
  let inner, b;
  if (kind === "vessel") { inner = vesselSvg(key, uid); b = VESSELS[key].bbox; }
  else if (kind === "reagent") { inner = reagentSvg(key, uid, true); b = { x0: -38, y0: -126, x1: 38, y1: 8 }; }
  else if (kind === "tool") { inner = toolSvg(key); b = TOOLS[key].bbox; }
  else { const r = supportSvg(key); inner = r.back + r.front; b = SUPPORTS[key].bbox; }
  return `<svg viewBox="${b.x0 - 4} ${b.y0 - 4} ${b.x1 - b.x0 + 8} ${b.y1 - b.y0 + 8}" aria-hidden="true">${inner}</svg>`;
}

export { REAGENTS };
