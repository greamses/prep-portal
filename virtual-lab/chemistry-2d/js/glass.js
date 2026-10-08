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
      ${(() => { let m = ""; for (let n = 0; n <= 50; n++) { const y = (-302 + (n / 50) * 258).toFixed(1); const w = n % 10 === 0 ? 7 : n % 5 === 0 ? 5 : 3; m += `<path class="cl-mark" d="M${-w} ${y}H0"/>`; if (n % 10 === 0) m += `<text class="cl-mark-n" x="-9.5" y="${(Number(y) + 2.4).toFixed(1)}" text-anchor="end">${n}</text>`; } return m; })()}
      <text class="cl-read" x="14" y="-200"></text>`,
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
          <rect class="cl-liquid" x="${-R * 4}" y="${def.top}" width="${R * 8}" height="${H * 4}"/>
          <rect class="cl-lshade" x="${-R}" y="${def.top}" width="${R * 2}" height="${H}" fill="url(#g-shade)"/>
          <rect x="${-R * 4}" y="${def.top}" width="${R * 8}" height="2.4" fill="#fff" fill-opacity="0.34"/>
          <rect x="${-R * 4}" y="${def.top + 2.4}" width="${R * 8}" height="5" fill="#000" fill-opacity="0.1"/>
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
    <ellipse class="cl-g-rim" cx="0" cy="${def.top}" rx="${rimRx}" ry="${f1(rimRy)}"/>
    ${glassy && def.rTop > 9 ? `<ellipse class="cl-g-lip" cx="0" cy="${f1(def.top + 0.5)}" rx="${f1(rimRx - 2.6)}" ry="${f1(Math.max(1.2, rimRy - 1.5))}"/><path class="cl-g-rimhi" d="M${f1(-rimRx * 0.72)} ${f1(def.top + rimRy * 0.7)}Q0 ${f1(def.top + rimRy * 1.5)} ${f1(rimRx * 0.72)} ${f1(def.top + rimRy * 0.7)}"/>` : ""}
    ${spout}
    <g class="cl-wisps"><path d="M-6 ${def.top - 6}q-5-8 0-15t0-15"/><path d="M0 ${def.top - 8}q5-8 0-15t0-15"/><path d="M6 ${def.top - 6}q-5-8 0-15t0-15"/></g>
    <g class="cl-tagg" transform="translate(0 ${H < 60 ? -36 : 0})"><rect x="-9" y="${def.top + 16}" width="18" height="14" rx="2.5"/><text x="0" y="${def.top + 23.5}">${tag}</text></g>
    ${def.front || ""}
    ${hit(def.bbox)}
    ${def.over || ""}`;
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
  const lev = g.querySelector(".cl-level");
  lev.style.transformOrigin = `0px ${-top}px`;
  lev.style.transform = tilt ? `rotate(${-tilt}deg)` : "";
  g.classList.toggle("is-tilted", Boolean(tilt));

  g.querySelector(".cl-liquidg").style.transform = `translateY(${H - level}px)`;
  g.querySelector(".cl-liquid").style.fill = rgba(lk.rgb, Math.max(lk.a, 0.32));       // clear water still has to be seen
  const men = g.querySelector(".cl-meniscus");
  men.setAttribute("cy", f1(-top));
  men.setAttribute("rx", top ? f1(Math.max(0, rAt(P, -top) - 1.2)) : 0);
  men.style.fill = rgba(lk.rgb.map((v) => Math.round(v + (255 - v) * 0.45)), Math.min(0.9, lk.a + 0.25));

  const total = stuff.ppt.reduce((a, p) => a + p.n, 0);
  const mix = total ? [0, 1, 2].map((k) => Math.round(stuff.ppt.reduce((a, p) => a + p.rgb[k] * p.n, 0) / total)) : [0, 0, 0];
  const fl = def.floor || 0;
  const bed = total ? Math.min(level ? level - fl : 40, Math.min(7, H * 0.12) + (H * 0.75 * total) / (t.cap || def.cap)) : 0;
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

/** A burst of bubbles up through the liquid. */
export function bubble(g, key, t, lively = 1) {
  const def = VESSELS[key];
  const level = levelOf(def, t);
  if (!level) return;
  const box = g.querySelector(".cl-bubbles");
  const spread = rAt(def.profile, -level * 0.4) * 0.75;
  let html = "";
  for (let k = 0; k < Math.round(12 * lively); k++) {
    html += `<circle class="cl-bubble" cx="${f1((Math.random() - 0.5) * 2 * spread)}" cy="${-(def.floor || 0) - 6}" r="${f1(1.3 + Math.random() * 2.2)}" style="--rise:${-Math.round(level - (def.floor || 0) - 5)}px;animation-delay:${(Math.random() * 2.4).toFixed(2)}s"/>`;
  }
  box.innerHTML = html;
  clearTimeout(box._t);
  box._t = setTimeout(() => (box.innerHTML = ""), 4600);
}

// ── bottles ─────────────────────────────────────────────────────────────────
const BOTTLE = [[0, 25], [-2, 29], [-7, 31], [-62, 31], [-70, 27], [-78, 15], [-82, 12], [-97, 12], [-99, 15], [-103, 15]];
const JAR = [[0, 26], [-2, 30], [-7, 32], [-56, 32], [-64, 25], [-68, 22], [-77, 22], [-79, 25], [-83, 25]];
const DROPPER = [[0, 16], [-2, 19], [-6, 21], [-46, 21], [-54, 14], [-58, 10], [-66, 10], [-68, 12], [-71, 12]];
const AMBER = ["agno3", "h2o2", "ki"];        // kept in brown glass, away from the light
const SOLID_FILL = {
  mg: [198, 202, 206], zn: [150, 158, 166], fe: [84, 84, 90], cu: [190, 106, 62],
  caco3: [238, 236, 228], cuo: [38, 36, 36], mno2: [58, 50, 48],
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
  const size = r.formula.length <= 4 ? 12.5 : r.formula.length <= 6 ? 10.5 : 8.6;
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
    <g clip-path="url(#clip-${uid})"><rect x="-32" y="-58" width="64" height="60" fill="${liquidOf(id)}"/><rect x="-32" y="-58" width="64" height="60" fill="url(#g-shade)"/></g>
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
  funnel: { name: "Funnel and filter paper", act: [0, 0], bbox: { x0: -40, y0: -66, x1: 40, y1: 34 } },
  bung: { name: "Rubber stopper", act: [0, 0], bbox: { x0: -16, y0: -12, x1: 16, y1: 12 } },
  tubing: { name: "Stopper and delivery tube", act: [0, 0], bbox: { x0: -18, y0: -52, x1: 36, y1: 12 } },
  syringe: { name: "Gas syringe", act: [0, -10], bbox: { x0: -108, y0: -36, x1: 150, y1: 8 } },
  condenser: { name: "Liebig condenser", act: [0, 0], bbox: { x0: -8, y0: -22, x1: 240, y1: 122 } },
  electrode: { name: "Carbon electrode", act: [0, 0], bbox: { x0: -9, y0: -30, x1: 9, y1: 104 } },
  power: { name: "Power pack (6 V)", act: [0, 0], bbox: { x0: -50, y0: -70, x1: 50, y1: 8 } },
  cap: { name: "Stopper", act: [0, 0], bbox: { x0: -28, y0: -22, x1: 28, y1: 14 }, hidden: true },
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
    return `<path d="M-1.6 0L-4 -22V-70h8V-22L1.6 0z" fill="#fff" fill-opacity="0.12" stroke="#fff" stroke-opacity="0.65" stroke-width="0.9"/>
      <path class="cl-drop-liq" d="M-1.1 -2L-2.8 -22V-52h5.6V-22L1.1 -2z" fill="transparent"/>
      <rect x="-6" y="-77" width="12" height="8" rx="2" fill="#2c3038"/><path d="M-5 -77c-5 -8 -5 -22 0 -27q5 -4 10 0c5 5 5 19 0 27z" fill="url(#g-rubber)"/>${hit(b)}`;
  }
  if (key === "thermo") {
    const ticks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => `<path d="M3.4 ${-26 - k * 11}h${k % 5 === 0 ? 4 : 2.4}" class="cl-mark"/>`).join("");
    return `<rect x="-3.2" y="-150" width="6.4" height="146" rx="3.2" fill="#fff" fill-opacity="0.14" stroke="#fff" stroke-opacity="0.62" stroke-width="0.8"/>
      <rect class="cl-merc" x="-1.1" y="-53" width="2.2" height="49" fill="#e23b3b"/><circle cx="0" cy="-4" r="4.6" fill="#e23b3b" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7"/>${ticks}${hit(b)}`;
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
    return `<path d="M-1.4 0L-2.6 -20V-64q-6 -6 -6 -22t6 -22V-150h5.200V-108q6 6 6 22t-6 22V-20L1.4 0z" fill="#fff" fill-opacity="0.12" stroke="#fff" stroke-opacity="0.65" stroke-width="0.9"/>
      <path class="cl-drop-liq" d="M-1 -2L-1.8 -20V-63q-5.4 -6 -5.4 -23t5.4 -23V-128h3.6V-109q5.4 6 5.4 23t-5.4 23V-20L1 -2z" fill="transparent"/>
      <path class="cl-mark" d="M-2.6 -130h5.2"/>
      <rect x="-5" y="-154" width="10" height="7" rx="2" fill="#2c3038"/><path d="M-5 -152c-8 -8 -8 -26 0 -34q5 -4 10 0c8 8 8 26 0 34z" fill="url(#g-rubber)"/>${hit(b)}`;
  }
  if (key === "funnel") {
    const d = "M-36 -58L-4.5 -12V30h9V-12L36 -58";
    return `<path d="${d}z" fill="url(#g-glass)"/><path d="M-31 -56L0 -15L31 -56z" fill="#f6f3ea" fill-opacity="0.92"/>
      <path d="M0 -15L-31 -56" stroke="#cfc8b6" stroke-width="0.8"/><path d="M0 -15L10 -56" stroke="#cfc8b6" stroke-width="0.8"/>
      <path class="cl-residue" d="M-15 -35L0 -16L15 -35q-15 7 -30 0z" fill="transparent"/>
      <path class="cl-g-edge" d="${d}"/><ellipse class="cl-g-rim" cx="0" cy="-58" rx="36" ry="5"/><path class="cl-g-shine" d="M-30 -52L-8 -18"/>${hit(b)}`;
  }
  if (key === "bung") return `<path d="M-13 -8h26l-3.5 16h-19z" fill="#c0563c" stroke="#fff" stroke-opacity="0.3" stroke-width="0.8"/><path d="M-10 -5h6l-1.5 10" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.6" stroke-linecap="round"/>${hit(b)}`;
  if (key === "tubing") {
    return `<path d="M0 8V-34q0 -8 8 -8h22" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="5" stroke-linecap="round"/><path d="M0 8V-34q0 -8 8 -8h22" fill="none" stroke="#2f3540" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M-13 -8h26l-3.5 16h-19z" fill="#c0563c" stroke="#fff" stroke-opacity="0.3" stroke-width="0.8"/>${hit(b)}`;
  }
  if (key === "cap") return `${CAPS[it.v || "bottle"](0, it.rgb)}${hit(CAP_BOX[it.v || "bottle"])}`;
  if (key === "condenser") {
    // drawn from the joint that pushes onto a flask's side arm, sloping down to the outlet
    return `<g transform="rotate(23.3)">
        <rect x="-4" y="-5" width="16" height="10" rx="2" fill="#c0563c" stroke="#fff" stroke-opacity="0.25" stroke-width="0.7"/>
        <rect x="6" y="-4" width="226" height="8" rx="4" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.6" stroke-width="0.9"/>
        <rect x="36" y="-12" width="166" height="24" rx="9" fill="rgba(110,176,255,0.2)" stroke="#fff" stroke-opacity="0.62" stroke-width="1.1"/>
        <rect x="36" y="-12" width="166" height="24" rx="9" fill="url(#g-glass)" opacity="0.6"/>
        <path d="M46 -8H192" stroke="#fff" stroke-opacity="0.45" stroke-width="2" stroke-linecap="round"/>
        <rect x="172" y="11" width="7" height="12" rx="2" fill="#fff" fill-opacity="0.14" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8"/><rect x="58" y="-23" width="7" height="12" rx="2" fill="#fff" fill-opacity="0.14" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8"/>
      </g>
      <path d="M213 92q14 5 16 22" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="7" stroke-linecap="round"/><path d="M213 92q14 5 16 22" fill="none" stroke="#2f3540" stroke-width="4.6" stroke-linecap="round"/>${hit(b)}`;
  }
  if (key === "electrode") {
    return `<rect x="-4" y="-18" width="8" height="118" rx="2" fill="#30343b" stroke="#fff" stroke-opacity="0.25" stroke-width="0.7"/><rect x="-2.5" y="-16" width="1.6" height="112" fill="#fff" fill-opacity="0.14"/>
      <rect class="cl-coat" x="-5.5" y="26" width="11" height="74" rx="2.5" fill="transparent"/>
      <rect x="-6" y="-28" width="12" height="11" rx="2" fill="#aab2bd" stroke="#fff" stroke-opacity="0.4" stroke-width="0.7"/><text class="cl-pole" x="0" y="-34"></text>${hit(b)}`;
  }
  if (key === "power") {
    return `${shadow(48)}<rect x="-46" y="-56" width="92" height="56" rx="5" fill="#3a424e" stroke="#fff" stroke-opacity="0.28"/><rect x="-46" y="-56" width="92" height="56" rx="5" fill="url(#g-shade)" opacity="0.6"/>
      <rect x="-19" y="-66" width="10" height="12" rx="2" fill="#23272e" stroke="#fff" stroke-opacity="0.4"/><rect x="9" y="-66" width="10" height="12" rx="2" fill="#c0453a" stroke="#fff" stroke-opacity="0.4"/>
      <text class="cl-pole" x="-14" y="-34">−</text><text class="cl-pole" x="14" y="-34">+</text><text class="cl-waste-t" x="-10" y="-9" font-size="8">6 V d.c.</text>${hit(b)}
      <g class="cl-press" data-press="power"><rect x="22" y="-46" width="18" height="30" rx="3" fill="#23272e" stroke="#fff" stroke-opacity="0.45"/><rect class="cl-switch" x="25" y="-43" width="12" height="12" rx="2" fill="#e2574c"/><rect x="14" y="-54" width="34" height="46" fill="transparent"/></g>`;
  }
  if (key === "syringe") {
    let ticks = "";
    for (let n = 0; n <= 100; n += 10) ticks += `<path class="cl-mark" d="M${-86 + n * 1.04} -20v${n % 50 === 0 ? 8 : 5}"/>${n % 50 === 0 ? `<text class="cl-mark-n" x="${-86 + n * 1.04}" y="-23" text-anchor="middle">${n}</text>` : ""}`;
    return `${shadow(64)}
      <g class="cl-plunger"><rect x="-88" y="-16" width="128" height="12" rx="2" fill="#fff" fill-opacity="0.2" stroke="#fff" stroke-opacity="0.5" stroke-width="0.8"/><rect x="-90" y="-19" width="6" height="18" rx="2" fill="#dfe6ee"/><rect x="38" y="-24" width="6" height="28" rx="2" fill="#dfe6ee"/></g>
      <rect x="-92" y="-20" width="116" height="20" rx="4" fill="url(#g-glass)"/><rect class="cl-g-edge" x="-92" y="-20" width="116" height="20" rx="4"/>
      <rect x="-86" y="-17" width="104" height="3" rx="1.5" fill="#fff" fill-opacity="0.45"/>
      <rect x="22" y="-23" width="6" height="26" rx="2" fill="#fff" fill-opacity="0.18" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8"/>
      <rect x="-104" y="-13" width="13" height="6" rx="2" fill="#fff" fill-opacity="0.16" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8"/>${ticks}
      <text class="cl-read" x="60" y="-28">0 cm\u00b3</text>${hit(b)}`;
  }
  if (key === "holder") {
    return `<path d="M-34 -4L30 -30" stroke="#c9975a" stroke-width="7" stroke-linecap="round"/><path d="M-34 -14L30 -34" stroke="#b98548" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="-6" cy="-19" rx="6" ry="9" fill="none" stroke="#aab2bd" stroke-width="2.4"/><path d="M26 -40q10 6 4 16" fill="none" stroke="#aab2bd" stroke-width="3" stroke-linecap="round"/>${hit(b)}`;
  }
  if (key === "tongs") {
    return `<path d="M-40 -2L6 -18q14 -6 30 -4" fill="none" stroke="#aab2bd" stroke-width="4" stroke-linecap="round"/><path d="M-40 -26L6 -14q14 6 30 -2" fill="none" stroke="#8d96a3" stroke-width="4" stroke-linecap="round"/>
      <circle cx="-2" cy="-16" r="3.4" fill="#5b6470"/><circle cx="-40" cy="-2" r="5" fill="none" stroke="#aab2bd" stroke-width="3"/><circle cx="-40" cy="-26" r="5" fill="none" stroke="#8d96a3" stroke-width="3"/>${hit(b)}`;
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
  tripod: { name: "Tripod and gauze", slots: [[0, -158]], fits: (d) => Boolean(d.flat) && !d.fixed && d.rMax < 90, bbox: { x0: -64, y0: -164, x1: 64, y1: 8 } },
  balance: { name: "Electronic balance", slots: [[0, -40]], fits: (d) => !d.fixed && d.rMax < 90, bbox: { x0: -78, y0: -50, x1: 78, y1: 8 } },
  // its one slot is wherever the clamp has been slid to (main.js works the height out for each vessel)
  stand: { name: "Retort stand and clamp", slots: [[44, 0]], clamp: [-340, -110], fits: (d) => !d.material && d.rMax <= 60 && !d.upturns, bbox: { x0: -56, y0: -376, x1: 80, y1: 8 } },
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
    return {
      back: `${shadow(76)}
        <path d="M-74 0v-22q0 -8 8 -8h132q8 0 8 8v22z" fill="#3a424e" stroke="#fff" stroke-opacity="0.28"/>
        <path d="M-74 0v-22q0 -8 8 -8h132q8 0 8 8v22z" fill="url(#g-shade)" opacity="0.6"/>
        <rect x="-7" y="-40" width="14" height="10" fill="url(#g-metal)"/>
        <ellipse cx="0" cy="-40" rx="60" ry="7.5" fill="#8d96a3"/><ellipse cx="0" cy="-41.5" rx="57" ry="6" fill="#d5dbe2"/>
        <rect x="-34" y="-25" width="68" height="19" rx="2" fill="#b9d7a8"/><text class="cl-lcd" x="0" y="-11">0.00 g</text>
        <circle cx="-52" cy="-15" r="4" fill="#8892a0"/>${hit(b)}
        <g class="cl-press" data-press="tare"><circle cx="52" cy="-15" r="8.5" fill="#e2574c" stroke="#fff" stroke-opacity="0.55"/><text class="cl-press-t" x="52" y="-11.5">T</text></g>`,
      front: "",
    };
  }
  if (key === "stand") {
    return {
      back: `${shadow(62)}
        <rect x="-52" y="-12" width="130" height="12" rx="2.5" fill="#4a525e" stroke="#fff" stroke-opacity="0.22"/>
        <rect x="-37" y="-372" width="7" height="362" rx="3" fill="url(#g-metal)"/>${hit(b)}
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
