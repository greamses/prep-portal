/* ============================================================================
   CHEMISTRY BENCH — the drawing
   ----------------------------------------------------------------------------
   The rack, the five test tubes, the bottles on the shelf and the short films
   that play when something is done to a tube (a pour, a flame, a splint, a strip
   of litmus). It draws what chem.js says is in a tube and decides nothing.

   The liquid and the sediment are tall rectangles slid up and down behind the
   tube's own outline (a clip), so a level rises with a CSS transition instead
   of being redrawn. Chemical colours are the chemicals' own; everything else
   — glass, wood, labels — is a theme token.
   ========================================================================== */

import { CAP, TUBE_NAMES, speciate, look, sediment, newTube, add } from "./chem.js";

const NS = "http://www.w3.org/2000/svg";
export const VIEW = { w: 620, h: 330 };
const TOP = 70;            // the rim
const FLOOR = 256;         // the lowest point of the round bottom
const HALF = 20;           // half the tube's inner width
const DEPTH = FLOOR - TOP;
export const tubeX = (i) => 90 + i * 110;

const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const tubePath = (cx) => `M${cx - HALF} ${TOP}V${FLOOR - HALF}a${HALF} ${HALF} 0 0 0 ${HALF * 2} 0V${TOP}z`;

/** A repeatable scatter, so a tube's solids do not jump about between paints. */
function scatter(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280), s / 233280);
}

/** The whole bench: rack, tubes, and an empty place on each tube for effects. */
export function benchSvg() {
  const tubes = TUBE_NAMES.map((name, i) => {
    const cx = tubeX(i);
    return `
    <g class="cl-tube" data-tube="${i}" tabindex="0" role="button" aria-label="Test tube ${name}">
      <clipPath id="cl-clip-${i}"><path d="${tubePath(cx)}"/></clipPath>
      <path class="cl-pick" d="M${cx - 9} 30h18l-9 12z"/>
      <g class="cl-tube__body">
        <path class="cl-glass-back" d="${tubePath(cx)}"/>
        <g clip-path="url(#cl-clip-${i})">
          <rect class="cl-liquid" x="${cx - HALF}" y="${TOP}" width="${HALF * 2}" height="${DEPTH}"/>
          <rect class="cl-cloud" x="${cx - HALF}" y="${TOP}" width="${HALF * 2}" height="${DEPTH}"/>
          <rect class="cl-sediment" x="${cx - HALF}" y="${TOP}" width="${HALF * 2}" height="${DEPTH}"/>
          <g class="cl-solids"></g>
          <g class="cl-bubbles"></g>
        </g>
        <path class="cl-glass" d="M${cx - HALF} ${TOP}V${FLOOR - HALF}a${HALF} ${HALF} 0 0 0 ${HALF * 2} 0V${TOP}"/>
        <rect class="cl-rim" x="${cx - HALF - 4}" y="${TOP - 5}" width="${HALF * 2 + 8}" height="6" rx="3"/>
        <path class="cl-shine" d="M${cx - 12} ${TOP + 14}V${FLOOR - 40}"/>
        <g class="cl-wisps">
          <path d="M${cx - 8} 58q-5-8 0-15t0-15"/><path d="M${cx} 56q5-8 0-15t0-15"/><path d="M${cx + 8} 58q-5-8 0-15t0-15"/>
        </g>
      </g>
      <g class="cl-fx"></g>
      <circle class="cl-letter-bg" cx="${cx}" cy="306" r="13"/>
      <text class="cl-letter" x="${cx}" y="306">${name}</text>
      <rect class="cl-hit" x="${cx - 46}" y="20" width="92" height="304"/>
    </g>`;
  }).join("");

  const last = tubeX(TUBE_NAMES.length - 1);
  return `
  <svg id="cl-bench" viewBox="0 0 ${VIEW.w} ${VIEW.h}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="A rack of five test tubes">
    <ellipse class="cl-shadow" cx="${VIEW.w / 2}" cy="286" rx="${VIEW.w / 2 - 20}" ry="9"/>
    <rect class="cl-rack cl-rack--post" x="${tubeX(0) - 62}" y="140" width="12" height="136" rx="3"/>
    <rect class="cl-rack cl-rack--post" x="${last + 50}" y="140" width="12" height="136" rx="3"/>
    <rect class="cl-rack cl-rack--bar" x="${tubeX(0) - 62}" y="150" width="${last - tubeX(0) + 124}" height="14" rx="4"/>
    <rect class="cl-rack cl-rack--base" x="${tubeX(0) - 70}" y="262" width="${last - tubeX(0) + 140}" height="18" rx="5"/>
    ${tubes}
  </svg>`;
}

/** Paint one tube from its state. `fresh` = a precipitate has just come down. */
export function paintTube(g, t, { fresh = false } = {}) {
  const i = Number(g.dataset.tube);
  const cx = tubeX(i);
  const sp = speciate(t);
  const lk = look(t, sp);
  const stuff = sediment(t, sp);

  const level = t.vol > 0 ? 14 + (t.vol / CAP) * 150 : 0;
  const liquid = g.querySelector(".cl-liquid");
  liquid.style.transform = `translateY(${DEPTH - level}px)`;
  liquid.style.fill = rgba(lk.rgb, lk.a);

  // precipitates: one layer, the colours mixed by how much of each there is
  const total = stuff.ppt.reduce((a, p) => a + p.n, 0);
  const mix = total ? [0, 1, 2].map((k) => Math.round(stuff.ppt.reduce((a, p) => a + p.rgb[k] * p.n, 0) / total)) : [0, 0, 0];
  const bed = total ? Math.min(level || 70, 10 + 12 * total) : 0;
  const sed = g.querySelector(".cl-sediment");
  const cloud = g.querySelector(".cl-cloud");
  sed.style.fill = rgba(mix, 0.96);
  sed.style.transform = `translateY(${DEPTH - bed}px)`;
  cloud.style.fill = rgba(mix, 0.8);
  cloud.style.transform = `translateY(${DEPTH - level}px)`;
  if (fresh && total) {
    cloud.classList.remove("is-settling");
    void cloud.getBoundingClientRect();           // restart the film
    cloud.classList.add("is-settling");
    sed.classList.remove("is-settling");
    void sed.getBoundingClientRect();
    sed.classList.add("is-settling");
  }
  g.classList.toggle("has-ppt", total > 0);
  // a white solid on cream paper needs an edge to be seen
  sed.classList.toggle("is-pale", total > 0 && mix[0] + mix[1] + mix[2] > 660);

  // loose solids, lying on the bed
  const floor = FLOOR - bed - 2;
  const rnd = scatter(i + 1);
  let html = "";
  const spot = (spread = 13) => [cx + (rnd() - 0.5) * 2 * spread, floor - rnd() * 9];
  for (const m of stuff.metal) {
    const fill = rgba(m.rgb);
    const count = Math.max(1, Math.min(9, Math.round(m.n * 2)));
    for (let k = 0; k < count; k++) {
      const [x, y] = spot();
      if (m.deposit) html += `<circle cx="${x.toFixed(1)}" cy="${(y + 3).toFixed(1)}" r="${(1.6 + rnd() * 1.6).toFixed(1)}" fill="${fill}"/>`;
      else if (m.key === "Mg") html += `<rect x="${(x - 9).toFixed(1)}" y="${(y - 8).toFixed(1)}" width="18" height="4" rx="1" fill="${fill}" transform="rotate(${(rnd() * 70 - 35).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      else if (m.key === "Fe") html += `<rect x="${(x - 3).toFixed(1)}" y="${y.toFixed(1)}" width="6" height="1.6" fill="${fill}" transform="rotate(${(rnd() * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      else if (m.key === "Cu") html += `<path d="M${(x - 5).toFixed(1)} ${y.toFixed(1)}q5-7 10 0" fill="none" stroke="${fill}" stroke-width="2.4" stroke-linecap="round"/>`;
      else html += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3 + rnd() * 1.6).toFixed(1)}" fill="${fill}"/>`;
    }
  }
  for (const s of stuff.solid) {
    const fill = rgba(s.rgb);
    const count = Math.max(2, Math.min(8, Math.round(s.n * 2.5)));
    for (let k = 0; k < count; k++) {
      const [x, y] = spot();
      if (s.key === "CaCO3") html += `<path d="M${(x - 5).toFixed(1)} ${(y + 3).toFixed(1)}l2-7 6-1 3 6-4 4z" fill="${fill}" stroke="var(--text-tertiary)" stroke-width="0.6"/>`;
      else html += `<circle cx="${x.toFixed(1)}" cy="${(y + 2).toFixed(1)}" r="${(2 + rnd() * 2).toFixed(1)}" fill="${fill}"/>`;
    }
  }
  g.querySelector(".cl-solids").innerHTML = html;
  g.classList.toggle("has-gas", Boolean(t.gas));
  g.classList.toggle("is-empty", t.vol <= 0 && !html);
  return { sp, look: lk };
}

/** A burst of bubbles up through the liquid. */
export function bubble(g, t, lively = 1) {
  const i = Number(g.dataset.tube);
  const cx = tubeX(i);
  const box = g.querySelector(".cl-bubbles");
  const level = t.vol > 0 ? 14 + (t.vol / CAP) * 150 : 0;
  if (!level) return;
  const count = Math.round(12 * lively);
  let html = "";
  for (let k = 0; k < count; k++) {
    const x = cx + (Math.random() - 0.5) * 30;
    const r = 1.4 + Math.random() * 2.2;
    html += `<circle class="cl-bubble" cx="${x.toFixed(1)}" cy="${FLOOR - 8}" r="${r.toFixed(1)}" style="--rise:${-(level - 6).toFixed(0)}px;animation-delay:${(Math.random() * 2.4).toFixed(2)}s"/>`;
  }
  box.innerHTML = html;
  clearTimeout(box._t);
  box._t = setTimeout(() => (box.innerHTML = ""), 4600);
}

// ── the short films ─────────────────────────────────────────────────────────
const flame = (x, y, s = 1) =>
  `<g class="cl-flame" transform="translate(${x} ${y}) scale(${s})">` +
  `<path d="M0-22c5 8 9 10 9 16a9 9 0 0 1-18 0c0-6 4-8 9-16z" fill="var(--accent-warning)"/>` +
  `<path d="M0-10c3 4 4 5 4 8a4 4 0 0 1-8 0c0-3 1-4 4-8z" fill="var(--accent-primary)"/></g>`;

const FILMS = {
  pour: (cx, { rgb, level }) => `<rect class="cl-stream" x="${cx - 2.5}" y="6" width="5" height="${Math.max(30, FLOOR - level - 6)}" rx="2.5" fill="${rgba(rgb, 0.9)}"/>`,
  drop: (cx, { rgb }) => [0, 1, 2].map((k) => `<circle class="cl-dropin" cx="${cx + (k - 1) * 6}" cy="20" r="3.4" fill="${rgba(rgb)}" style="animation-delay:${k * 0.12}s"/>`).join(""),
  heat: (cx) =>
    `<rect x="${cx - 7}" y="262" width="14" height="40" rx="3" fill="var(--text-tertiary)"/>` +
    `<rect x="${cx - 16}" y="296" width="32" height="8" rx="3" fill="var(--text-secondary)"/>` + flame(cx, 262, 1.25),
  splint: (cx, { tip, end }) =>
    `<g class="cl-splint cl-splint--${end}">` +
    `<rect x="${cx + 4}" y="50" width="62" height="4.5" rx="2" fill="var(--accent-warning)" transform="rotate(-38 ${cx + 6} 52)"/>` +
    `<g class="cl-splint__tip">${tip === "lit" ? flame(cx + 6, 54, 0.62) : `<circle cx="${cx + 6}" cy="52" r="4.6" fill="var(--accent-danger)"/><circle cx="${cx + 6}" cy="52" r="2" fill="var(--accent-primary)"/>`}</g>` +
    `<g class="cl-splint__after">${
      end === "pop" ? [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="${cx + 5}" y="26" width="3" height="12" rx="1.5" fill="var(--accent-primary)" transform="rotate(${a} ${cx + 6.5} 50)"/>`).join("")
      : end === "out" ? `<path d="M${cx + 6} 46q-6-8 0-15t0-14" fill="none" stroke="var(--text-tertiary)" stroke-width="2.6" stroke-linecap="round"/>`
      : end === "bright" || end === "relight" ? flame(cx + 6, 54, 1.25)
      : ""
    }</g></g>`,
  litmus: (cx, { from, to }) =>
    `<rect class="cl-paper cl-paper--from-${from} cl-paper--to-${to}" x="${cx - 6}" y="22" width="12" height="42" rx="1.5"/>`,
};

/** Play a film over tube `g`; it removes itself. */
export function film(g, name, detail = {}, ms = 2200) {
  const cx = tubeX(Number(g.dataset.tube));
  const box = g.querySelector(".cl-fx");
  box.innerHTML = FILMS[name](cx, detail);
  box.dataset.film = name;
  g.classList.toggle("is-heating", name === "heat");
  clearTimeout(box._t);
  box._t = setTimeout(() => {
    box.innerHTML = "";
    g.classList.remove("is-heating");
  }, ms);
}

// ── the shelf ───────────────────────────────────────────────────────────────
const CAP_COLOUR = {
  acid: "var(--accent-danger)", alkali: "var(--accent-purple)", salt: "var(--accent-secondary)",
  other: "var(--text-tertiary)", solid: "var(--accent-warning)", indicator: "var(--accent-success)",
};
const SOLID_FILL = {
  mg: [198, 202, 206], zn: [150, 158, 166], fe: [84, 84, 90], cu: [190, 106, 62],
  caco3: [238, 236, 228], cuo: [38, 36, 36], mno2: [52, 46, 44],
};
const DROPPER_FILL = { ui: [76, 176, 80], phph: [226, 232, 238], mo: [240, 140, 40] };

/** A reagent's own colour: one portion of it in a tube. */
function colourOf(r) {
  const t = newTube();
  add(t, r.id);
  const lk = look(t);
  return rgba(lk.rgb, Math.max(0.35, lk.a));
}

/** The picture on a shelf button: a bottle, a jar of solid, or a dropper. */
export function bottleSvg(r) {
  const top = CAP_COLOUR[r.group];
  if (r.kind === "solid") {
    const fill = rgba(SOLID_FILL[r.id]);
    return `<svg viewBox="0 0 40 48" aria-hidden="true">
      <rect x="9" y="3" width="22" height="7" rx="2" fill="${top}"/>
      <path class="cl-b-glass" d="M7 14a3 3 0 0 1 3-3h20a3 3 0 0 1 3 3v28a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3z"/>
      <path d="M8.5 43V31q5-5 11-2t12-1v15a1.5 1.5 0 0 1-1.5 1.5h-20A1.5 1.5 0 0 1 8.5 43z" fill="${fill}"/>
      <circle cx="15" cy="27.5" r="2.4" fill="${fill}"/><circle cx="26" cy="26.5" r="2" fill="${fill}"/>
    </svg>`;
  }
  if (r.kind === "indicator") {
    const fill = rgba(DROPPER_FILL[r.id]);
    return `<svg viewBox="0 0 40 48" aria-hidden="true">
      <ellipse cx="20" cy="7" rx="5" ry="6" fill="${top}"/>
      <rect x="15.5" y="11" width="9" height="6" rx="1.5" fill="var(--text-secondary)"/>
      <path class="cl-b-glass" d="M12 21a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v21a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3z"/>
      <path d="M13.5 28h13v14a1.5 1.5 0 0 1-1.5 1.5H15a1.5 1.5 0 0 1-1.5-1.5z" fill="${fill}"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 40 48" aria-hidden="true">
    <rect x="13" y="2" width="14" height="7" rx="2" fill="${top}"/>
    <path class="cl-b-glass" d="M15.5 8h9v6q8 2 8 9v19a3 3 0 0 1-3 3h-19a3 3 0 0 1-3-3V23q0-7 8-9z"/>
    <path d="M9 26h22v16a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 9 42z" fill="${colourOf(r)}"/>
    <rect class="cl-b-label" x="12" y="30" width="16" height="9" rx="1"/>
  </svg>`;
}

// ── the tools, in the site's icon language (24×24, filled, token colours) ────
const icon = (inner) => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">${inner}</svg>`;
const STICK = `<rect x="2.4" y="15.4" width="17" height="3" rx="1.5" fill="var(--text-tertiary)" transform="rotate(-38 4 17)"/>`;
export const TOOL_ICON = {
  heat: icon(`<rect x="9.6" y="14" width="4.8" height="7" rx="1.2" fill="var(--text-tertiary)"/><rect x="5" y="19.4" width="14" height="3" rx="1.5" fill="var(--text-tertiary)"/><path d="M12 1.8c2.6 3.6 4.8 5 4.8 8a4.8 4.8 0 0 1-9.6 0c0-3 2.2-4.4 4.8-8z" fill="var(--accent-danger)"/><path d="M12 7.4c1.2 1.8 2 2.4 2 3.8a2 2 0 0 1-4 0c0-1.4.8-2 2-3.8z" fill="var(--accent-primary)"/>`),
  lit: icon(`${STICK}<path d="M17 1.6c2.2 3 4 4.2 4 6.8a4 4 0 0 1-8 0c0-2.6 1.8-3.8 4-6.8z" fill="var(--accent-warning)"/><path d="M17 6.2c1 1.5 1.7 2 1.7 3.1a1.7 1.7 0 0 1-3.4 0c0-1.1.7-1.6 1.7-3.1z" fill="var(--accent-primary)"/>`),
  glow: icon(`${STICK}<circle cx="17" cy="8" r="3.6" fill="var(--accent-danger)"/>`),
  red: icon(`<rect x="8" y="2.4" width="8" height="19.2" rx="1.4" fill="var(--accent-danger)" transform="rotate(14 12 12)"/>`),
  blue: icon(`<rect x="8" y="2.4" width="8" height="19.2" rx="1.4" fill="var(--accent-secondary)" transform="rotate(14 12 12)"/>`),
};

export const svgEl = (name) => document.createElementNS(NS, name);
