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
function wall(P, side, inset, from, to) {
  const top = P[P.length - 1][0];
  const lo = top * to, hi = top * from;          // up is negative: lo is the higher end
  const ys = [lo, ...P.map(([y]) => y).filter((y) => y > lo && y < hi), hi].sort((a, b) => a - b);
  return "M" + ys.map((y) => `${f1(side * Math.max(0, rAt(P, y) - inset))} ${f1(y)}`).join("L");
}

// ── vessels ─────────────────────────────────────────────────────────────────
// cap = portions of liquid it holds; fill = how far up the glass "full" comes
export const VESSELS = {
  tube: { name: "Test tube", cap: 12, profile: tubeProfile(13, 150), fill: 0.86, rack: true },
  boil: { name: "Boiling tube", cap: 20, profile: tubeProfile(18, 176), fill: 0.86 },
  beaker100: { name: "Beaker (100 mL)", cap: 30, profile: beakerProfile(40, 96), fill: 0.84, flat: true, spout: true, marks: [[20, 0.2], [40, 0.4], [60, 0.6], [80, 0.8]], volume: "100 mL" },
  beaker250: { name: "Beaker (250 mL)", cap: 60, profile: beakerProfile(55, 132), fill: 0.84, flat: true, spout: true, marks: [[50, 0.2], [100, 0.4], [150, 0.6], [200, 0.8]], volume: "250 mL" },
  flask: { name: "Conical flask (250 mL)", cap: 50, profile: [[0, 54], [-3, 59], [-9, 60], [-92, 19], [-104, 17], [-150, 17], [-153, 20]], fill: 0.6, flat: true, marks: [[100, 0.4], [150, 0.6], [200, 0.8]], volume: "250 mL" },
};
for (const v of Object.values(VESSELS)) {
  v.top = v.profile[v.profile.length - 1][0];
  v.rTop = v.profile[v.profile.length - 1][1];
  v.rMax = Math.max(...v.profile.map(([, r]) => r));
  v.bbox = { x0: -v.rMax - 6, y0: v.top - 8, x1: v.rMax + 6, y1: 8 };
}
const levelOf = (def, t) => (t.vol > 0 ? Math.max(7, -def.top * def.fill * Math.min(1, t.vol / (t.cap || def.cap))) : 0);

/** The gradients every piece borrows. Put once into the bench's own <svg>. */
export const DEFS = `
<defs>
  <linearGradient id="g-glass" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0.26"/><stop offset="0.14" stop-color="#fff" stop-opacity="0.06"/>
    <stop offset="0.55" stop-color="#fff" stop-opacity="0.02"/><stop offset="0.86" stop-color="#fff" stop-opacity="0.08"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0.24"/>
  </linearGradient>
  <linearGradient id="g-amber" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#b8782c" stop-opacity="0.85"/><stop offset="0.3" stop-color="#7a4718" stop-opacity="0.72"/>
    <stop offset="0.7" stop-color="#6a3c12" stop-opacity="0.74"/><stop offset="1" stop-color="#a86a24" stop-opacity="0.86"/>
  </linearGradient>
  <linearGradient id="g-shade" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#000" stop-opacity="0.28"/><stop offset="0.3" stop-color="#000" stop-opacity="0"/>
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
  const rimRy = Math.max(2.6, def.rTop * 0.15);
  const marks = (def.marks || []).map(([n, at]) => {
    const y = f1(def.top * def.fill * at);
    const r = rAt(P, y);
    return `<path d="M${f1(r * 0.3)} ${y}H${f1(r * 0.62)}" class="cl-mark"/><text class="cl-mark-n" x="${f1(r * 0.24)}" y="${y + 2.4}" text-anchor="end">${n}</text>`;
  }).join("");
  const spout = def.spout ? `<path class="cl-g-edge" d="M${-def.rTop + 2} ${def.top + 1}q-9 -3 -10 -7q8 1 13 3"/>` : "";
  return `
    ${shadow(R + 8)}
    <clipPath id="clip-${uid}"><path d="${body}"/></clipPath>
    <path d="${body}" fill="#fff" fill-opacity="0.03"/>
    <g clip-path="url(#clip-${uid})">
      <g class="cl-liquidg">
        <rect class="cl-liquid" x="${-R}" y="${def.top}" width="${R * 2}" height="${H}"/>
        <rect x="${-R}" y="${def.top}" width="${R * 2}" height="${H}" fill="url(#g-shade)"/>
      </g>
      <rect class="cl-cloud" x="${-R}" y="${def.top}" width="${R * 2}" height="${H}"/>
      <rect class="cl-sediment" x="${-R}" y="${def.top}" width="${R * 2}" height="${H}"/>
      <g class="cl-solids"></g>
      <g class="cl-bubbles"></g>
    </g>
    <ellipse class="cl-meniscus" cx="0" cy="0" rx="0" ry="2.4"/>
    <path d="${body}" fill="url(#g-glass)"/>
    <path class="cl-g-edge" d="${outline(P, true)}"/>
    ${def.flat ? `<ellipse class="cl-g-foot" cx="0" cy="-2.5" rx="${f1(P[2][1] * 0.94)}" ry="3.6"/>` : ""}
    <path class="cl-g-shine" d="${wall(P, -1, 4.5, 0.12, 0.93)}"/>
    <path class="cl-g-glint" d="${wall(P, 1, 5, 0.2, 0.86)}"/>
    ${marks}
    ${def.volume ? `<text class="cl-mark-v" x="${f1(-rAt(P, def.top * 0.5) * 0.45)}" y="${f1(def.top * (def.fill + 0.06))}">${def.volume}</text>` : ""}
    <ellipse class="cl-g-rim" cx="0" cy="${def.top}" rx="${def.rTop + 1.5}" ry="${f1(rimRy)}"/>
    ${spout}
    <g class="cl-wisps"><path d="M-6 ${def.top - 6}q-5-8 0-15t0-15"/><path d="M0 ${def.top - 8}q5-8 0-15t0-15"/><path d="M6 ${def.top - 6}q-5-8 0-15t0-15"/></g>
    <g class="cl-tagg"><rect x="-9" y="${def.top + 16}" width="18" height="14" rx="2.5"/><text x="0" y="${def.top + 23.5}">${tag}</text></g>
    ${hit(def.bbox)}`;
}

function scatter(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280), s / 233280);
}

/** Paint a vessel from its chemistry. `fresh` = a precipitate has just come down. */
export function paintVessel(g, key, t, { fresh = false, seed = 1 } = {}) {
  const def = VESSELS[key];
  const P = def.profile, H = -def.top;
  const sp = speciate(t);
  const lk = look(t, sp);
  const stuff = sediment(t, sp);
  const level = levelOf(def, t);

  g.querySelector(".cl-liquidg").style.transform = `translateY(${H - level}px)`;
  g.querySelector(".cl-liquid").style.fill = rgba(lk.rgb, Math.max(lk.a, 0.24));
  const men = g.querySelector(".cl-meniscus");
  men.setAttribute("cy", f1(-level));
  men.setAttribute("rx", level ? f1(Math.max(0, rAt(P, -level) - 1.2)) : 0);
  men.style.fill = rgba(lk.rgb.map((v) => Math.round(v + (255 - v) * 0.45)), Math.min(0.9, lk.a + 0.25));

  const total = stuff.ppt.reduce((a, p) => a + p.n, 0);
  const mix = total ? [0, 1, 2].map((k) => Math.round(stuff.ppt.reduce((a, p) => a + p.rgb[k] * p.n, 0) / total)) : [0, 0, 0];
  const bed = total ? Math.min(level || 40, 7 + (H * 0.75 * total) / (t.cap || def.cap)) : 0;
  const sed = g.querySelector(".cl-sediment");
  const cloud = g.querySelector(".cl-cloud");
  sed.style.fill = rgba(mix, 0.97);
  sed.style.transform = `translateY(${H - bed}px)`;
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

  const floor = -bed - 2;
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
  return { sp, look: lk, level };
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
    html += `<circle class="cl-bubble" cx="${f1((Math.random() - 0.5) * 2 * spread)}" cy="-6" r="${f1(1.3 + Math.random() * 2.2)}" style="--rise:${-Math.round(level - 5)}px;animation-delay:${(Math.random() * 2.4).toFixed(2)}s"/>`;
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
  `<rect class="cl-label" x="${-w / 2}" y="${y}" width="${w}" height="${h}" rx="4"/>` +
  `<text class="cl-label-t" x="0" y="${y + h / 2 + size * 0.36}" font-size="${size}">${text}</text>`;

/** How far a bottle's mouth is above its base: the point it pours from. */
export const mouthOf = (id) => (reagent(id).kind === "solid" ? 83 : reagent(id).kind === "indicator" ? 71 : 103);

export function reagentSvg(id, uid) {
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
      <path class="cl-g-shine" d="${wall(JAR, -1, 5, 0.1, 0.72)}"/>
      <g class="cl-stopper"><path d="M-20 -80h40l-2 9h-36z" fill="url(#g-frost)"/><rect x="-27" y="-93" width="54" height="11" rx="3.5" fill="url(#g-frost)" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8"/></g>
      ${label(formula(r.formula), -30, 46, 20, size)}
      ${hit({ x0: -36, y0: -96, x1: 36, y1: 8 })}`;
  }
  if (r.kind === "indicator") {
    return `
      ${shadow(26)}
      <clipPath id="clip-${uid}"><path d="${outline(DROPPER)}"/></clipPath>
      <path d="${outline(DROPPER)}" fill="#fff" fill-opacity="0.03"/>
      <g clip-path="url(#clip-${uid})"><rect x="-22" y="-40" width="44" height="42" fill="${rgba(DROPPER_FILL[id], id === "phph" ? 0.3 : 0.85)}"/><rect x="-22" y="-40" width="44" height="42" fill="url(#g-shade)"/></g>
      <rect x="-2.2" y="-70" width="4.4" height="58" rx="2" fill="#fff" fill-opacity="0.16" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7"/>
      <path d="${outline(DROPPER)}" fill="url(#g-glass)"/>
      <path class="cl-g-edge" d="${outline(DROPPER, true)}"/>
      <path class="cl-g-shine" d="${wall(DROPPER, -1, 4, 0.1, 0.62)}"/>
      <g class="cl-stopper"><rect x="-11" y="-80" width="22" height="10" rx="2" fill="#2c3038" stroke="#fff" stroke-opacity="0.25" stroke-width="0.6"/><path d="M-6 -80c-5 -8 -6 -24 0 -30q6 -5 12 0c6 6 5 22 0 30z" fill="url(#g-rubber)"/></g>
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
    <path class="cl-g-shine" d="${wall(BOTTLE, -1, 5, 0.08, 0.66)}"/>
    <ellipse class="cl-g-foot" cx="0" cy="-2.5" rx="27" ry="3"/>
    <g class="cl-stopper"><path d="M-10 -100h20l1.5 -9h-23z" fill="url(#g-frost)"/><rect x="-16" y="-122" width="32" height="14" rx="3.5" fill="url(#g-frost)" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8"/><path d="M-11 -118v6" stroke="#fff" stroke-opacity="0.8" stroke-width="1.6" stroke-linecap="round"/></g>
    ${label(formula(r.formula), -50, 50, 26, size)}
    ${hit({ x0: -35, y0: -125, x1: 35, y1: 8 })}`;
}

// ── tools ───────────────────────────────────────────────────────────────────
// act = the point of the tool that does the work, in its own space
export const TOOLS = {
  burner: { name: "Bunsen burner", act: [0, -146], bbox: { x0: -34, y0: -150, x1: 46, y1: 8 } },
  lit: { name: "Lighted splint", act: [-34, -58], bbox: { x0: -44, y0: -84, x1: 40, y1: 8 } },
  glow: { name: "Glowing splint", act: [-34, -58], bbox: { x0: -44, y0: -70, x1: 40, y1: 8 } },
  red: { name: "Red litmus paper", act: [0, 0], bbox: { x0: -10, y0: -70, x1: 10, y1: 6 } },
  blue: { name: "Blue litmus paper", act: [0, 0], bbox: { x0: -10, y0: -70, x1: 10, y1: 6 } },
};

const splint = (tip) => `
  <path d="M-34 -58L32 -2" stroke="url(#g-wood)" stroke-width="5" stroke-linecap="round"/>
  <path d="M-34 -58L-20 -46" stroke="#3a2a1c" stroke-width="5" stroke-linecap="round"/>
  ${tip}`;

export function toolSvg(key) {
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
      ${hit(b)}`;
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

// ── the rack ────────────────────────────────────────────────────────────────
export const RACK = { name: "Test tube rack", slots: [-110, -55, 0, 55, 110], rest: -12, bbox: { x0: -156, y0: -92, x1: 156, y1: 8 } };
/** In two halves: the back goes behind the tubes, the front in front of them. */
export function rackSvg() {
  const holes = RACK.slots.map((x) => `<ellipse cx="${x}" cy="-76" rx="17" ry="4.5" fill="#1d2128" fill-opacity="0.75"/>`).join("");
  const lips = RACK.slots.map((x) => `<path d="M${x - 17} -76a17 4.5 0 0 0 34 0v5a17 4.5 0 0 1-34 0z" fill="#b98548"/>`).join("");
  return {
    back: `${shadow(150)}
      <rect x="-150" y="-84" width="10" height="84" rx="2" fill="#a87438"/><rect x="140" y="-84" width="10" height="84" rx="2" fill="#a87438"/>
      <rect x="-152" y="-84" width="304" height="14" rx="3" fill="url(#g-wood)"/>${holes}${hit(RACK.bbox)}`,
    front: `${lips}<rect x="-154" y="-14" width="308" height="16" rx="4" fill="url(#g-wood)"/><rect x="-154" y="-14" width="308" height="3" rx="1.5" fill="#fff" fill-opacity="0.18"/>`,
  };
}

/** A picture of any piece on its own, for the drawer. */
export function thumb(kind, key) {
  const uid = `th-${kind}-${key}`;
  let inner, b;
  if (kind === "vessel") { inner = vesselSvg(key, uid); b = VESSELS[key].bbox; }
  else if (kind === "reagent") { inner = reagentSvg(key, uid); b = { x0: -38, y0: -126, x1: 38, y1: 8 }; }
  else if (kind === "tool") { inner = toolSvg(key); b = TOOLS[key].bbox; }
  else { const r = rackSvg(); inner = r.back + r.front; b = RACK.bbox; }
  return `<svg viewBox="${b.x0 - 4} ${b.y0 - 4} ${b.x1 - b.x0 + 8} ${b.y1 - b.y0 + 8}" aria-hidden="true">${inner}</svg>`;
}

export { REAGENTS };
