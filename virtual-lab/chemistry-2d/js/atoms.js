/* ============================================================================
   CHEMISTRY BENCH — atoms: electronic configuration and Lewis structures
   ----------------------------------------------------------------------------
   The drawer's "Atoms" rail. Each element opens a sheet with
     · its Lewis (dot) structure — and an ion's, dot-and-cross, in brackets
     · its configuration three ways: shells (2,8,1), s p d f, noble-gas core
     · its electrons in boxes (Hund's rule: singly first, then paired)
     · a shell diagram with the nucleus counted (protons, neutrons)

   The configuration is BUILT, not typed: subshells fill in the Aufbau
   (Madelung) order, with the real exceptions (Cr, Cu, Mo, Ag …) as a short
   table. An ion is made from the atom: a cation loses from the outermost
   shell first (so iron loses 4s before 3d), an anion gains into the next
   space. The top half is pure and runs in node.
   ========================================================================== */

// [symbol, name, relative atomic mass (school values, Cl = 35.5), mass number of the commonest isotope]
const DATA = [
  null,
  ["H", "Hydrogen", 1, 1], ["He", "Helium", 4, 4], ["Li", "Lithium", 7, 7], ["Be", "Beryllium", 9, 9],
  ["B", "Boron", 11, 11], ["C", "Carbon", 12, 12], ["N", "Nitrogen", 14, 14], ["O", "Oxygen", 16, 16],
  ["F", "Fluorine", 19, 19], ["Ne", "Neon", 20, 20], ["Na", "Sodium", 23, 23], ["Mg", "Magnesium", 24, 24],
  ["Al", "Aluminium", 27, 27], ["Si", "Silicon", 28, 28], ["P", "Phosphorus", 31, 31], ["S", "Sulfur", 32, 32],
  ["Cl", "Chlorine", 35.5, 35], ["Ar", "Argon", 40, 40], ["K", "Potassium", 39, 39], ["Ca", "Calcium", 40, 40],
  ["Sc", "Scandium", 45, 45], ["Ti", "Titanium", 48, 48], ["V", "Vanadium", 51, 51], ["Cr", "Chromium", 52, 52],
  ["Mn", "Manganese", 55, 55], ["Fe", "Iron", 56, 56], ["Co", "Cobalt", 59, 59], ["Ni", "Nickel", 59, 58],
  ["Cu", "Copper", 63.5, 63], ["Zn", "Zinc", 65, 64], ["Ga", "Gallium", 70, 69], ["Ge", "Germanium", 73, 74],
  ["As", "Arsenic", 75, 75], ["Se", "Selenium", 79, 80], ["Br", "Bromine", 80, 79], ["Kr", "Krypton", 84, 84],
  ["Rb", "Rubidium", 85.5, 85], ["Sr", "Strontium", 88, 88], ["Y", "Yttrium", 89, 89], ["Zr", "Zirconium", 91, 90],
  ["Nb", "Niobium", 93, 93], ["Mo", "Molybdenum", 96, 98], ["Tc", "Technetium", 98, 98], ["Ru", "Ruthenium", 101, 102],
  ["Rh", "Rhodium", 103, 103], ["Pd", "Palladium", 106, 106], ["Ag", "Silver", 108, 107], ["Cd", "Cadmium", 112, 114],
  ["In", "Indium", 115, 115], ["Sn", "Tin", 119, 120], ["Sb", "Antimony", 122, 121], ["Te", "Tellurium", 128, 130],
  ["I", "Iodine", 127, 127], ["Xe", "Xenon", 131, 132], ["Cs", "Caesium", 133, 133], ["Ba", "Barium", 137, 138],
];
// and a few heavy ones a school meets (no lanthanides in between)
const HEAVY = { 78: ["Pt", "Platinum", 195, 195], 79: ["Au", "Gold", 197, 197], 80: ["Hg", "Mercury", 201, 202], 81: ["Tl", "Thallium", 204, 205], 82: ["Pb", "Lead", 207, 208], 83: ["Bi", "Bismuth", 209, 209] };

export const ELEMENTS = [
  ...DATA.slice(1).map((d, i) => ({ z: i + 1, sym: d[0], name: d[1], ar: d[2], a: d[3] })),
  ...Object.entries(HEAVY).map(([z, d]) => ({ z: +z, sym: d[0], name: d[1], ar: d[2], a: d[3] })),
];
export const element = (z) => ELEMENTS.find((e) => e.z === z);
export const bySymbol = (s) => ELEMENTS.find((e) => e.sym === s);

// the ions a school meets for each element (charge numbers)
export const IONS = {
  H: [1, -1], Li: [1], Be: [2], N: [-3], O: [-2], F: [-1], Na: [1], Mg: [2], Al: [3], P: [-3], S: [-2], Cl: [-1],
  K: [1], Ca: [2], Sc: [3], Cr: [3], Mn: [2], Fe: [2, 3], Co: [2], Ni: [2], Cu: [1, 2], Zn: [2], Ga: [3], Se: [-2], Br: [-1],
  Rb: [1], Sr: [2], Ag: [1], Cd: [2], Sn: [2, 4], I: [-1], Cs: [1], Ba: [2], Pt: [2], Au: [1, 3], Hg: [2], Pb: [2, 4],
};

// ── building the configuration ──────────────────────────────────────────────
const L = "spdf";
const CAP = { s: 2, p: 6, d: 10, f: 14 };
// the Aufbau order: lowest n + l first, and for equal n + l the lower n
const ORDER = [];
for (let n = 1; n <= 7; n++) for (let l = 0; l < Math.min(n, 4); l++) ORDER.push({ n, l });
ORDER.sort((a, b) => a.n + a.l - (b.n + b.l) || a.n - b.n);
// atoms that do not follow it: a half-full or full d set is worth an s electron
const ODD = {
  24: { "4s": 1, "3d": 5 }, 29: { "4s": 1, "3d": 10 }, 41: { "5s": 1, "4d": 4 }, 42: { "5s": 1, "4d": 5 },
  44: { "5s": 1, "4d": 7 }, 45: { "5s": 1, "4d": 8 }, 46: { "5s": 0, "4d": 10 }, 47: { "5s": 1, "4d": 10 },
  78: { "6s": 1, "5d": 9 }, 79: { "6s": 1, "5d": 10 },
};
const nameOf = (n, l) => `${n}${L[l]}`;

/** The electrons of an atom (charge 0) or ion: [{ n, l, e }] in n-then-l order. */
export function configOf(z, charge = 0) {
  const fill = new Map();
  let left = z;
  for (const o of ORDER) {
    if (left <= 0) break;
    const e = Math.min(CAP[L[o.l]], left);
    fill.set(nameOf(o.n, o.l), { n: o.n, l: o.l, e });
    left -= e;
  }
  for (const [k, e] of Object.entries(ODD[z] || {})) {
    const n = +k[0], l = L.indexOf(k[1]);
    if (e) fill.set(k, { n, l, e }); else fill.delete(k);
  }
  let subs = [...fill.values()];
  if (charge > 0) {
    // a cation loses from the OUTERMOST shell first: highest n, and in it the highest l
    for (let i = 0; i < charge; i++) {
      subs.sort((a, b) => b.n - a.n || b.l - a.l);
      const top = subs.find((s) => s.e > 0);
      if (!top) break;
      top.e--;
    }
    subs = subs.filter((s) => s.e > 0);
  } else if (charge < 0) {
    let more = -charge;
    for (const o of ORDER) {
      if (!more) break;
      const k = nameOf(o.n, o.l);
      const s = fill.get(k) || { n: o.n, l: o.l, e: 0 };
      const add = Math.min(CAP[L[o.l]] - s.e, more);
      if (add > 0) { s.e += add; more -= add; fill.set(k, s); }
    }
    subs = [...fill.values()];
  }
  return subs.sort((a, b) => a.n - b.n || a.l - b.l);
}

/** Electrons in each shell: [2, 8, 1]. */
export const shellsOf = (subs) => { const out = []; for (const s of subs) out[s.n - 1] = (out[s.n - 1] || 0) + s.e; return Array.from(out, (x) => x || 0); };

const NOBLE = [[2, "He"], [10, "Ne"], [18, "Ar"], [36, "Kr"], [54, "Xe"]];
/** The configuration written out, as HTML: "1s<sup>2</sup> 2s<sup>2</sup> …", or with a noble-gas core. */
export function spdfHtml(subs, short = false) {
  let core = "", rest = subs;
  if (short) {
    const total = subs.reduce((t, s) => t + s.e, 0);
    for (const [z, sym] of NOBLE) {
      if (z > total) break;
      const inner = configOf(z);
      // the core is the noble gas's own subshells, all still full in this atom
      if (inner.every((c) => subs.some((s) => s.n === c.n && s.l === c.l && s.e === c.e))) {
        core = `[${sym}] `;
        rest = subs.filter((s) => !inner.some((c) => c.n === s.n && c.l === s.l));
      }
    }
  }
  return (core + rest.map((s) => `${nameOf(s.n, s.l)}<sup>${s.e}</sup>`).join(" ")).trim();
}

/** Where the element sits, and how many electrons are in its outer shell (the Lewis dots). */
export function placeOf(z) {
  const subs = configOf(z);
  const period = Math.max(...subs.map((s) => s.n));
  const outer = subs.filter((s) => s.n === period);
  const sE = (outer.find((s) => s.l === 0) || { e: 0 }).e;
  const pE = (outer.find((s) => s.l === 1) || { e: 0 }).e;
  const dBlock = (z >= 21 && z <= 30) || (z >= 39 && z <= 48) || (z >= 78 && z <= 80);
  if (dBlock) return { period, block: "d", valence: sE, group: null };
  const valence = sE + pE;
  const block = pE ? "p" : "s";
  // groups 1–7, and 0 for the noble gases (helium has only two)
  const group = z === 2 || valence === 8 ? 0 : valence;
  return { period, block, valence, group };
}

// ── drawing ─────────────────────────────────────────────────────────────────
const sup = (c) => (c === 0 ? "" : `${Math.abs(c) === 1 ? "" : Math.abs(c)}${c > 0 ? "+" : "−"}`);
export const ionName = (sym, c) => `${sym}${sup(c)}`;
export const ionHtml = (sym, c) => `${sym}${c ? `<sup>${sup(c)}</sup>` : ""}`;

const DOT = (x, y, mine = true) => mine
  ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="var(--ink)"/>`
  : `<path d="M${(x - 3.4).toFixed(1)} ${(y - 3.4).toFixed(1)}l6.8 6.8m0-6.8-6.8 6.8" stroke="var(--accent-danger)" stroke-width="2.2" stroke-linecap="round"/>`;

/**
 * The Lewis structure of an atom or ion: the symbol with its outer electrons on four
 * sides, one to a side before any pairs up. An ion is put in square brackets with its
 * charge; the electrons it GAINED are crosses, so a dot-and-cross diagram reads right.
 */
export function lewisSvg(z, charge = 0) {
  const el = element(z), p = placeOf(z);
  let mine, gained = 0;
  if (charge > 0) mine = Math.max(0, p.valence - charge);
  else { mine = p.valence; gained = -charge; }
  // a cation that lost its whole outer shell shows nothing; the shell under it is full but is not drawn
  const n = mine + gained;
  const W = 150, H = 150, cx = W / 2, cy = H / 2 + 2;
  const side = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const count = [0, 0, 0, 0];
  // helium and the hydride ion: the pair sits together on one side
  if (n === 2 && (z === 1 || z === 2)) count[1] = 2;
  else for (let i = 0; i < Math.min(n, 8); i++) count[i < 4 ? i : i - 4]++;
  const R = 30;
  let dots = "", k = 0;
  side.forEach(([dx, dy], i) => {
    for (let j = 0; j < count[i]; j++) {
      const off = count[i] === 2 ? (j ? 7 : -7) : 0;
      const x = cx + dx * R + (dy ? off : 0), y = cy + dy * R + (dx ? off : 0);
      dots += DOT(x, y, k < mine);
      k++;
    }
  });
  const font = el.sym.length > 1 ? 40 : 46;
  let txt = `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="var(--font-display)" font-weight="700" font-size="${font}" fill="var(--ink)">${el.sym}</text>`;
  if (charge) {
    txt += `<path d="M28 26h-8v100h8M122 26h8v100h-8" fill="none" stroke="var(--ink)" stroke-width="3"/>`
      + `<text x="136" y="24" font-family="var(--font-mono)" font-weight="700" font-size="20" fill="var(--ink)">${sup(charge)}</text>`;
  }
  return `<svg class="cl-lewis" viewBox="0 0 ${W + 14} ${H}" role="img" aria-label="Lewis structure of ${ionName(el.sym, charge)}">${txt}${dots}</svg>`;
}

/** A shell (Bohr) diagram: the nucleus counted, each shell a ring, its electrons spaced round it. */
export function bohrSvg(z, charge = 0) {
  const el = element(z);
  const shells = shellsOf(configOf(z, charge));
  const base = shellsOf(configOf(z));
  const r0 = 28, step = 21, R = r0 + step * shells.length + 6;
  const S = R * 2, c = R;
  let out = `<circle cx="${c}" cy="${c}" r="${r0 - 6}" fill="color-mix(in srgb, var(--accent-warning) 38%, var(--surface-primary))" stroke="var(--ink)" stroke-width="1.5"/>`
    + `<text x="${c}" y="${c - 5}" text-anchor="middle" font-family="var(--font-mono)" font-weight="700" font-size="10" fill="var(--ink)">${z}p</text>`
    + `<text x="${c}" y="${c + 9}" text-anchor="middle" font-family="var(--font-mono)" font-weight="700" font-size="10" fill="var(--ink)">${el.a - z}n</text>`;
  shells.forEach((e, i) => {
    const r = r0 + step * (i + 1) - 6;
    out += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--text-tertiary)" stroke-width="1.2"/>`;
    const own = charge < 0 && i === shells.length - 1 ? base[i] || 0 : e;
    for (let j = 0; j < e; j++) {
      const t = -Math.PI / 2 + (j / e) * Math.PI * 2;
      out += DOT(c + r * Math.cos(t), c + r * Math.sin(t), j < own).replace('r="3.6"', 'r="3.4"');
    }
  });
  return `<svg class="cl-bohr" viewBox="0 0 ${S} ${S}" role="img" aria-label="Shell diagram of ${ionName(el.sym, charge)}: ${shells.join(", ")}">${out}</svg>`;
}

/** Electrons in boxes: one box per orbital, an up arrow in each before any is paired. */
export function boxesHtml(subs) {
  const arrow = (up) => `<svg viewBox="0 0 10 18" aria-hidden="true"><path d="${up ? "M5 17V3M1.500 6.500 5 2.500l3.500 4" : "M5 1v14M1.500 11.500 5 15.500l3.500-4"}" fill="none" stroke="currentColor" stroke-width="1.700" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return subs.map((s) => {
    const k = 2 * s.l + 1;
    const box = Array.from({ length: k }, (_, i) => {
      const up = s.e > i, down = s.e > k + i;
      return `<span class="cl-orb">${up ? arrow(true) : ""}${down ? arrow(false) : ""}</span>`;
    }).join("");
    return `<span class="cl-orbs"><span class="cl-orbs__row">${box}</span><i>${nameOf(s.n, s.l)}</i></span>`;
  }).join("");
}

/** A drawer tile's picture: the box of a periodic table. */
export function elementTile(e) {
  return `<svg viewBox="0 0 60 44" aria-hidden="true"><text x="4" y="11" font-family="var(--font-mono)" font-size="9" fill="currentColor" opacity="0.7">${e.z}</text><text x="30" y="33" text-anchor="middle" font-family="var(--font-display)" font-weight="700" font-size="${e.sym.length > 1 ? 20 : 23}" fill="currentColor">${e.sym}</text></svg>`;
}

// ── the sheet ───────────────────────────────────────────────────────────────
const words = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight"];
const blockColour = { s: "var(--accent-danger)", p: "var(--accent-secondary)", d: "var(--accent-warning)" };
export const blockOf = (z) => placeOf(z).block;
export const tint = (z) => blockColour[blockOf(z)];

/** What the sheet says about the element, in a sentence or two. */
function about(z, charge) {
  const el = element(z), p = placeOf(z);
  const where = p.block === "d" ? `A transition metal in period ${p.period}.` : `Group ${p.group === 0 ? "0 (the noble gases)" : p.group}, period ${p.period}.`;
  const v = p.valence;
  let how = "";
  if (!charge) {
    if (p.group === 0) how = ` Its outer shell is full (${words[v]} electrons), so it hardly reacts.`;
    else if (p.block === "d") how = ` It has ${words[v] || v} electron${v === 1 ? "" : "s"} in its outer shell, and loses ${v === 1 ? "it" : "them"} first when it forms an ion.`;
    else if (z === 1) how = " One electron: it can lose it (H<sup>+</sup>), gain one (H<sup>−</sup>), or share it in a covalent bond.";
    else if (v <= 3) how = ` It has ${words[v]} outer electron${v === 1 ? "" : "s"}, and loses ${v === 1 ? "it" : "them"} to form ${ionHtml(el.sym, v)}.`;
    else if (v === 4) how = " Four outer electrons: it shares them, making four covalent bonds.";
    else how = ` It has ${words[v]} outer electrons, and gains ${words[8 - v]} to fill the shell as ${ionHtml(el.sym, v - 8)}, or shares to make ${words[8 - v]} covalent bond${8 - v === 1 ? "" : "s"}.`;
  } else if (charge > 0) {
    how = ` ${ionHtml(el.sym, charge)} has lost ${words[charge]} electron${charge === 1 ? "" : "s"}${p.block === "d" ? ", from the outermost shell first" : ""}.`;
  } else {
    how = ` ${ionHtml(el.sym, charge)} has gained ${words[-charge]} electron${charge === -1 ? "" : "s"} (the crosses), which fills its outer shell.`;
  }
  return where + how;
}

/**
 * The atom sheet. `show(z)` fills it and opens it (the page's own openSheet keeps
 * one sheet up at a time); the arrows step through the table, the chips pick an ion.
 */
export function initAtoms({ $, openSheet, esc = (s) => s, icons }) {
  const sheet = $("cl-sheet-atom");
  let z = 11, charge = 0;
  function render() {
    const el = element(z);
    const subs = configOf(z, charge);
    const ions = IONS[el.sym] || [];
    const total = subs.reduce((t, s) => t + s.e, 0);
    $("cl-atom-title").innerHTML = `${esc(el.name)} <span class="cl-atom__sym">${ionHtml(el.sym, charge)}</span>`;
    $("cl-atom-body").innerHTML = `
      <div class="cl-atom__chips" role="group" aria-label="Atom or ion">
        <button type="button" class="cl-act${charge === 0 ? " is-on" : ""}" data-ion="0" aria-pressed="${charge === 0}">Atom</button>
        ${ions.map((c) => `<button type="button" class="cl-act${charge === c ? " is-on" : ""}" data-ion="${c}" aria-pressed="${charge === c}">${ionHtml(el.sym, c)} ion</button>`).join("")}
      </div>
      <p class="cl-atom__facts"><span>Atomic number <b>${z}</b></span><span>Relative atomic mass <b>${el.ar}</b></span><span>Electrons <b>${total}</b></span></p>
      <p class="cl-sheet__lead">${about(z, charge)}</p>
      <div class="cl-atom__pics">
        <figure><figcaption>Lewis structure</figcaption>${lewisSvg(z, charge)}</figure>
        <figure><figcaption>Shells</figcaption>${bohrSvg(z, charge)}</figure>
      </div>
      <h3 class="cl-h3">Electronic configuration</h3>
      <dl class="cl-atom__config">
        <dt>Shells</dt><dd>${shellsOf(subs).join(", ") || "none: a bare proton"}</dd>
        <dt>Subshells</dt><dd>${spdfHtml(subs) || "none"}</dd>
        ${total > 2 ? `<dt>Short form</dt><dd>${spdfHtml(subs, true)}</dd>` : ""}
      </dl>
      ${subs.length ? `<h3 class="cl-h3">Electrons in boxes</h3><div class="cl-atom__boxes">${boxesHtml(subs)}</div>` : ""}`;
  }
  function show(nz, nc = 0) {
    z = nz; charge = nc;
    render();
    if (sheet.hidden) openSheet("cl-sheet-atom");
    sheet.querySelector(".pp-receipt__paper").scrollTop = 0;
  }
  const step = (d) => { const i = ELEMENTS.findIndex((e) => e.z === z); show(ELEMENTS[(i + d + ELEMENTS.length) % ELEMENTS.length].z); };
  $("cl-atom-prev").innerHTML = icons.prev;
  $("cl-atom-next").innerHTML = icons.next;
  $("cl-atom-prev").addEventListener("click", () => step(-1));
  $("cl-atom-next").addEventListener("click", () => step(1));
  $("cl-atom-body").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ion]");
    if (b) { charge = +b.dataset.ion; render(); }
  });
  return { show };
}
