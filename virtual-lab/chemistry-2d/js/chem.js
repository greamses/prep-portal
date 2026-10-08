/* ============================================================================
   CHEMISTRY BENCH — the chemistry, and nothing else
   ----------------------------------------------------------------------------
   Pure JavaScript: no DOM, no drawing. It runs under node, which is how it is
   checked. main.js asks it what happened; draw.js paints what it says.

   THE UNIT. Everything is counted in EQUIVALENTS (moles of charge), and one
   portion of any bench solution carries one equivalent of its cation and one of
   its anion. So one portion of acid exactly neutralises one portion of alkali,
   one portion of sodium hydroxide exactly precipitates one portion of copper(II)
   sulfate, and "in excess" means what it says: more portions than that.

   TWO KINDS OF CHANGE.
   - settle()   — what cannot be undone: a gas leaves, a metal dissolves, a
                  carbonate is destroyed. These CHANGE the tube.
   - speciate() — what is in equilibrium: which ions are out of solution as a
                  precipitate, which have gone back in as a complex. This is
                  WORKED OUT from the tube each time and never stored — so
                  adding acid to a dissolved zincate brings the white
                  precipitate back, with no rule written for it.

   An observation is the difference between the tube before and after, plus the
   gases that left. That is what a student writes down, so that is what is said.
   ========================================================================== */

export const CAP = 12;          // portions of liquid a test tube holds (other glassware passes its own to newTube)
export const SOLID_CAP = 6;     // equivalents of solid a tube will take
export const TUBE_NAMES = ["A", "B", "C", "D", "E"];
export const DOSES = { drops: 0.25, portion: 1 };
const EPS = 1e-6;

// ── the shelf ───────────────────────────────────────────────────────────────
// kind: solution (adds liquid) | solid (a spatula measure) | indicator (drops)
export const GROUPS = [
  { id: "acid", label: "Acids" },
  { id: "alkali", label: "Alkalis" },
  { id: "salt", label: "Salt solutions" },
  { id: "other", label: "Other liquids" },
  { id: "solid", label: "Solids" },
  { id: "indicator", label: "Indicators" },
];

export const REAGENTS = [
  { id: "hcl", group: "acid", kind: "solution", name: "dilute hydrochloric acid", formula: "HCl", adds: { H: 1, Cl: 1 } },
  { id: "h2so4", group: "acid", kind: "solution", name: "dilute sulfuric acid", formula: "H2SO4", adds: { H: 1, SO4: 1 } },

  { id: "naoh", group: "alkali", kind: "solution", name: "sodium hydroxide solution", formula: "NaOH", adds: { Na: 1, OH: 1 } },
  { id: "nh3", group: "alkali", kind: "solution", name: "aqueous ammonia", formula: "NH3", adds: { NH3: 1 } },

  { id: "cuso4", group: "salt", kind: "solution", name: "copper(II) sulfate solution", formula: "CuSO4", adds: { Cu: 1, SO4: 1 } },
  { id: "feso4", group: "salt", kind: "solution", name: "iron(II) sulfate solution", formula: "FeSO4", adds: { Fe2: 1, SO4: 1 } },
  { id: "fecl3", group: "salt", kind: "solution", name: "iron(III) chloride solution", formula: "FeCl3", adds: { Fe3: 1, Cl: 1 } },
  { id: "znso4", group: "salt", kind: "solution", name: "zinc sulfate solution", formula: "ZnSO4", adds: { Zn: 1, SO4: 1 } },
  { id: "also4", group: "salt", kind: "solution", name: "aluminium sulfate solution", formula: "Al2(SO4)3", adds: { Al: 1, SO4: 1 } },
  { id: "pbno3", group: "salt", kind: "solution", name: "lead(II) nitrate solution", formula: "Pb(NO3)2", adds: { Pb: 1, NO3: 1 } },
  { id: "cacl2", group: "salt", kind: "solution", name: "calcium chloride solution", formula: "CaCl2", adds: { Ca: 1, Cl: 1 } },
  { id: "bacl2", group: "salt", kind: "solution", name: "barium chloride solution", formula: "BaCl2", adds: { Ba: 1, Cl: 1 } },
  { id: "agno3", group: "salt", kind: "solution", name: "silver nitrate solution", formula: "AgNO3", adds: { Ag: 1, NO3: 1 } },
  { id: "na2co3", group: "salt", kind: "solution", name: "sodium carbonate solution", formula: "Na2CO3", adds: { Na: 1, CO3: 1 } },
  { id: "nacl", group: "salt", kind: "solution", name: "sodium chloride solution", formula: "NaCl", adds: { Na: 1, Cl: 1 } },
  { id: "ki", group: "salt", kind: "solution", name: "potassium iodide solution", formula: "KI", adds: { K: 1, I: 1 } },
  { id: "nh4cl", group: "salt", kind: "solution", name: "ammonium chloride solution", formula: "NH4Cl", adds: { NH4: 1, Cl: 1 } },

  // the unknown of the qualitative-analysis question: main.js decides which salt it is (setUnknown)
  { id: "unk", group: "other", kind: "solution", name: "sample X", formula: "X", adds: {} },
  { id: "water", group: "other", kind: "solution", name: "distilled water", formula: "H2O", adds: {} },
  { id: "h2o2", group: "other", kind: "solution", name: "hydrogen peroxide solution", formula: "H2O2", adds: { H2O2: 1 } },
  // the one liquid that does not mix with the rest: it is kept apart, as t.oil, and floats
  { id: "oil", group: "other", kind: "solution", name: "cooking oil", formula: "Oil", adds: {}, oil: true },

  { id: "mg", group: "solid", kind: "solid", name: "magnesium ribbon", formula: "Mg", metal: { Mg: 2 } },
  { id: "zn", group: "solid", kind: "solid", name: "zinc granules", formula: "Zn", metal: { Zn: 2 } },
  { id: "fe", group: "solid", kind: "solid", name: "iron filings", formula: "Fe", metal: { Fe: 2 } },
  { id: "cu", group: "solid", kind: "solid", name: "copper turnings", formula: "Cu", metal: { Cu: 2 } },
  { id: "caco3", group: "solid", kind: "solid", name: "marble chips", formula: "CaCO3", solid: { CaCO3: 2 } },
  { id: "cuo", group: "solid", kind: "solid", name: "copper(II) oxide", formula: "CuO", solid: { CuO: 1 } },
  { id: "mno2", group: "solid", kind: "solid", name: "manganese(IV) oxide", formula: "MnO2", solid: { MnO2: 1 } },

  { id: "ui", group: "indicator", kind: "indicator", name: "universal indicator", formula: "UI" },
  { id: "phph", group: "indicator", kind: "indicator", name: "phenolphthalein", formula: "Ph" },
  { id: "mo", group: "indicator", kind: "indicator", name: "methyl orange", formula: "MO" },
];
const BY_ID = Object.fromEntries(REAGENTS.map((r) => [r.id, r]));
export const reagent = (id) => BY_ID[id];
/** Make sample X a solution of this salt. */
export function setUnknown(saltId) { BY_ID.unk.adds = { ...BY_ID[saltId].adds }; }

// ── precipitates ────────────────────────────────────────────────────────────
// colour = the word a student writes; rgb = what the drawing uses.
const WHITE = [246, 246, 240];
export const PPT = {
  CuOH: { formula: "Cu(OH)2", name: "copper(II) hydroxide", colour: "pale blue", rgb: [120, 178, 228], eq: "Cu^2+(aq) + 2OH^-(aq) -> Cu(OH)2(s)" },
  Fe2OH: { formula: "Fe(OH)2", name: "iron(II) hydroxide", colour: "dirty green", rgb: [108, 138, 92], eq: "Fe^2+(aq) + 2OH^-(aq) -> Fe(OH)2(s)" },
  Fe3OH: { formula: "Fe(OH)3", name: "iron(III) hydroxide", colour: "reddish-brown", rgb: [160, 82, 45], eq: "Fe^3+(aq) + 3OH^-(aq) -> Fe(OH)3(s)" },
  ZnOH: { formula: "Zn(OH)2", name: "zinc hydroxide", colour: "white", rgb: WHITE, eq: "Zn^2+(aq) + 2OH^-(aq) -> Zn(OH)2(s)" },
  AlOH: { formula: "Al(OH)3", name: "aluminium hydroxide", colour: "white", rgb: WHITE, eq: "Al^3+(aq) + 3OH^-(aq) -> Al(OH)3(s)" },
  PbOH: { formula: "Pb(OH)2", name: "lead(II) hydroxide", colour: "white", rgb: WHITE, eq: "Pb^2+(aq) + 2OH^-(aq) -> Pb(OH)2(s)" },
  CaOH: { formula: "Ca(OH)2", name: "calcium hydroxide", colour: "white", rgb: WHITE, eq: "Ca^2+(aq) + 2OH^-(aq) -> Ca(OH)2(s)" },
  MgOH: { formula: "Mg(OH)2", name: "magnesium hydroxide", colour: "white", rgb: WHITE, eq: "Mg^2+(aq) + 2OH^-(aq) -> Mg(OH)2(s)" },
  Ag2O: { formula: "Ag2O", name: "silver oxide", colour: "brown", rgb: [104, 76, 52], eq: "2Ag^+(aq) + 2OH^-(aq) -> Ag2O(s) + H2O(l)" },
  AgCl: { formula: "AgCl", name: "silver chloride", colour: "white", rgb: WHITE, eq: "Ag^+(aq) + Cl^-(aq) -> AgCl(s)" },
  AgI: { formula: "AgI", name: "silver iodide", colour: "pale yellow", rgb: [236, 226, 150], eq: "Ag^+(aq) + I^-(aq) -> AgI(s)" },
  BaSO4: { formula: "BaSO4", name: "barium sulfate", colour: "white", rgb: WHITE, eq: "Ba^2+(aq) + SO4^2-(aq) -> BaSO4(s)" },
  PbI2: { formula: "PbI2", name: "lead(II) iodide", colour: "bright yellow", rgb: [244, 208, 34], eq: "Pb^2+(aq) + 2I^-(aq) -> PbI2(s)" },
  PbSO4: { formula: "PbSO4", name: "lead(II) sulfate", colour: "white", rgb: WHITE, eq: "Pb^2+(aq) + SO4^2-(aq) -> PbSO4(s)" },
  PbCl2: { formula: "PbCl2", name: "lead(II) chloride", colour: "white", rgb: WHITE, eq: "Pb^2+(aq) + 2Cl^-(aq) -> PbCl2(s)" },
  BaCO3: { formula: "BaCO3", name: "barium carbonate", colour: "white", rgb: WHITE, eq: "Ba^2+(aq) + CO3^2-(aq) -> BaCO3(s)" },
  CaCO3: { formula: "CaCO3", name: "calcium carbonate", colour: "white", rgb: WHITE, eq: "Ca^2+(aq) + CO3^2-(aq) -> CaCO3(s)" },
  PbCO3: { formula: "PbCO3", name: "lead(II) carbonate", colour: "white", rgb: WHITE, eq: "Pb^2+(aq) + CO3^2-(aq) -> PbCO3(s)" },
  ZnCO3: { formula: "ZnCO3", name: "zinc carbonate", colour: "white", rgb: WHITE, eq: "Zn^2+(aq) + CO3^2-(aq) -> ZnCO3(s)" },
  MgCO3: { formula: "MgCO3", name: "magnesium carbonate", colour: "white", rgb: WHITE, eq: "Mg^2+(aq) + CO3^2-(aq) -> MgCO3(s)" },
  CuCO3: { formula: "CuCO3", name: "copper(II) carbonate", colour: "blue-green", rgb: [104, 190, 160], eq: "Cu^2+(aq) + CO3^2-(aq) -> CuCO3(s)" },
  FeCO3: { formula: "FeCO3", name: "iron(II) carbonate", colour: "grey-green", rgb: [150, 170, 132], eq: "Fe^2+(aq) + CO3^2-(aq) -> FeCO3(s)" },
  Ag2CO3: { formula: "Ag2CO3", name: "silver carbonate", colour: "pale yellow", rgb: [238, 232, 176], eq: "2Ag^+(aq) + CO3^2-(aq) -> Ag2CO3(s)" },
};

// Order matters only where two things want the same ion: the least soluble first.
const SALTS_FIRST = [["Ag", "I", "AgI"], ["Ag", "Cl", "AgCl"], ["Ba", "SO4", "BaSO4"], ["Pb", "I", "PbI2"], ["Pb", "SO4", "PbSO4"]];
// [cation, precipitate, does aqueous ammonia bring it down too?]
const HYDROXIDES = [
  ["Fe3", "Fe3OH", true], ["Al", "AlOH", true], ["Cu", "CuOH", true], ["Zn", "ZnOH", true], ["Pb", "PbOH", true],
  ["Fe2", "Fe2OH", true], ["Ag", "Ag2O", true], ["Mg", "MgOH", true], ["Ca", "CaOH", false],
];
const SALTS_LAST = [
  ["Ba", "CO3", "BaCO3"], ["Ca", "CO3", "CaCO3"], ["Pb", "CO3", "PbCO3"], ["Cu", "CO3", "CuCO3"], ["Zn", "CO3", "ZnCO3"],
  ["Fe2", "CO3", "FeCO3"], ["Ag", "CO3", "Ag2CO3"], ["Mg", "CO3", "MgCO3"], ["Pb", "Cl", "PbCl2"],
];

// A precipitate that goes back into solution when there is reagent to spare.
export const COMPLEX = {
  ZnOH4: { from: "ZnOH", by: "OH", per: 1, look: "colourless", reagent: "sodium hydroxide", why: "Zinc hydroxide is amphoteric: it dissolves in excess alkali as the zincate ion.", eq: "Zn(OH)2(s) + 2OH^-(aq) -> [Zn(OH)4]^2-(aq)" },
  AlOH4: { from: "AlOH", by: "OH", per: 1, look: "colourless", reagent: "sodium hydroxide", why: "Aluminium hydroxide is amphoteric: it dissolves in excess alkali as the aluminate ion.", eq: "Al(OH)3(s) + OH^-(aq) -> [Al(OH)4]^-(aq)" },
  PbOH4: { from: "PbOH", by: "OH", per: 1, look: "colourless", reagent: "sodium hydroxide", why: "Lead(II) hydroxide is amphoteric: it dissolves in excess alkali as the plumbate(II) ion.", eq: "Pb(OH)2(s) + 2OH^-(aq) -> [Pb(OH)4]^2-(aq)" },
  CuNH3: { from: "CuOH", by: "NH3", per: 2, look: "deep blue", reagent: "ammonia", why: "Ammonia molecules bond to the copper(II) ion, making the deep blue tetraamminecopper(II) ion.", eq: "Cu(OH)2(s) + 4NH3(aq) -> [Cu(NH3)4]^2+(aq) + 2OH^-(aq)" },
  ZnNH3: { from: "ZnOH", by: "NH3", per: 2, look: "colourless", reagent: "ammonia", why: "Ammonia molecules bond to the zinc ion, making the colourless tetraamminezinc ion.", eq: "Zn(OH)2(s) + 4NH3(aq) -> [Zn(NH3)4]^2+(aq) + 2OH^-(aq)" },
  AgONH3: { from: "Ag2O", by: "NH3", per: 2, look: "colourless", reagent: "ammonia", why: "Ammonia molecules bond to the silver ion, making the colourless diamminesilver ion.", eq: "Ag2O(s) + 4NH3(aq) + H2O(l) -> 2[Ag(NH3)2]^+(aq) + 2OH^-(aq)" },
  AgClNH3: { from: "AgCl", by: "NH3", per: 2, look: "colourless", reagent: "ammonia", why: "Silver chloride dissolves in ammonia as the diamminesilver ion. Silver iodide does not.", eq: "AgCl(s) + 2NH3(aq) -> [Ag(NH3)2]^+(aq) + Cl^-(aq)" },
};
const COMPLEX_ORDER = ["ZnOH4", "AlOH4", "PbOH4", "CuNH3", "ZnNH3", "AgONH3", "AgClNH3"];

// ── metals ──────────────────────────────────────────────────────────────────
// Most reactive first. A metal pushes out of solution any metal below it.
export const SERIES = ["Mg", "Zn", "Fe", "Pb", "Cu", "Ag"];
export const METAL = {
  Mg: { ion: "Mg", name: "magnesium", sym: "Mg", charge: 2, rgb: [198, 202, 206], coat: "grey" },
  Zn: { ion: "Zn", name: "zinc", sym: "Zn", charge: 2, rgb: [150, 158, 166], coat: "grey" },
  Fe: { ion: "Fe2", name: "iron", sym: "Fe", charge: 2, rgb: [84, 84, 90], coat: "dark grey" },
  Pb: { ion: "Pb", name: "lead", sym: "Pb", charge: 2, rgb: [112, 116, 126], coat: "grey" },
  Cu: { ion: "Cu", name: "copper", sym: "Cu", charge: 2, rgb: [190, 106, 62], coat: "red-brown" },
  Ag: { ion: "Ag", name: "silver", sym: "Ag", charge: 1, rgb: [204, 208, 214], coat: "silvery-grey" },
};
const WITH_ACID = { Mg: "fizzes quickly", Zn: "fizzes steadily", Fe: "fizzes slowly" };
export const SOLID = {
  CaCO3: { name: "marble chips", rgb: [238, 236, 228] },
  CuO: { name: "copper(II) oxide", rgb: [38, 36, 36] },
  MnO2: { name: "manganese(IV) oxide", rgb: [52, 46, 44] },
  crystals: { name: "crystals", rgb: [244, 244, 240] },      // what is left when the water has boiled away; coloured by t.crystal
};

const ION_TEX = { Mg: "Mg^2+", Zn: "Zn^2+", Fe2: "Fe^2+", Pb: "Pb^2+", Cu: "Cu^2+", Ag: "Ag^+" };

// ── a tube ──────────────────────────────────────────────────────────────────
export function newTube(cap = CAP) {
  return { cap, temp: 25, extra: 0, oil: 0, vol: 0, aq: {}, metal: {}, deposit: [], solid: {}, ind: [], gas: null, added: [], said: [] };
}
export const isEmpty = (t) => t.vol <= EPS && !(t.oil > EPS) && !hasSolids(t) && !t.ind.length;
const hasSolids = (t) => Object.values(t.metal).some((n) => n > EPS) || Object.values(t.solid).some((n) => n > EPS);
const solidTotal = (t) => [...Object.values(t.metal), ...Object.values(t.solid)].reduce((a, b) => a + b, 0);

const get = (o, k) => o[k] || 0;
const bump = (o, k, n) => { o[k] = (o[k] || 0) + n; if (Math.abs(o[k]) < EPS) delete o[k]; };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** What is in solution, what is out of it, and the pH. Derived; changes nothing. */
export function speciate(t) {
  const f = { ...t.aq };
  const ppt = {}, cx = {};
  const drop = (cat, an, key) => {
    const n = Math.min(get(f, cat), get(f, an));
    if (n > EPS) { f[cat] -= n; f[an] -= n; ppt[key] = get(ppt, key) + n; }
  };
  SALTS_FIRST.forEach((s) => drop(...s));

  let oh = get(f, "OH"), nh3 = get(f, "NH3");
  for (const [m, key, ammoniaToo] of HYDROXIDES) {
    const need = get(f, m);
    if (need <= EPS) continue;
    const a = Math.min(need, oh);
    oh -= a;
    const b = ammoniaToo ? Math.min(need - a, nh3) : 0;
    nh3 -= b;
    if (a + b > EPS) { ppt[key] = a + b; f[m] -= a + b; }
  }
  for (const id of COMPLEX_ORDER) {
    const c = COMPLEX[id];
    const have = c.by === "OH" ? oh : nh3;
    const d = Math.min(get(ppt, c.from), have / c.per);
    if (d <= EPS) continue;
    ppt[c.from] -= d;
    if (c.by === "OH") oh -= d * c.per; else nh3 -= d * c.per;
    cx[id] = d;
  }
  f.OH = oh;
  f.NH3 = nh3;
  SALTS_LAST.forEach((s) => drop(...s));

  for (const k of Object.keys(ppt)) if (ppt[k] <= EPS) delete ppt[k];
  for (const k of Object.keys(f)) if (f[k] <= EPS) delete f[k];
  return { ppt, cx, free: f, pH: pHof(t, f, cx) };
}

function pHof(t, f, cx) {
  if (t.vol <= EPS) return null;
  const conc = (n) => (0.1 * n) / t.vol;         // bench solutions are about 0.1 mol/dm3
  if (get(f, "H") > EPS) return clamp(-Math.log10(conc(f.H)), 0, 6.5);
  if (get(f, "OH") > EPS) return clamp(14 + Math.log10(conc(f.OH)), 7.5, 14);
  if (cx.ZnOH4 || cx.AlOH4 || cx.PbOH4) return 12;
  if (cx.CuNH3 || cx.ZnNH3 || cx.AgONH3 || cx.AgClNH3) return 10;
  if (get(f, "NH3") > EPS) return clamp(11 + 0.5 * Math.log10(f.NH3 / t.vol), 9.5, 11.5);
  if (get(f, "CO3") > EPS) return clamp(11 + 0.5 * Math.log10(f.CO3 / t.vol), 9.5, 11.5);
  if (get(f, "Fe3") > EPS || get(f, "Al") > EPS) return 3;
  if (["Cu", "Zn", "Pb", "Fe2", "Ag", "NH4"].some((k) => get(f, k) > EPS)) return 5;
  return 7;
}

// ── what the tube looks like ────────────────────────────────────────────────
const TINT = [
  // [where, key, rgb, strength, the word]
  ["free", "Cu", [58, 150, 222], 2.6, "blue"],
  ["free", "Fe2", [156, 204, 140], 1.5, "pale green"],
  ["free", "Fe3", [214, 150, 44], 3.2, "yellow-brown"],
  ["cx", "CuNH3", [28, 52, 190], 7, "deep blue"],
  ["free", "I2", [150, 84, 30], 5, "brown"],
];
const UNIVERSAL = [
  [2.5, [226, 54, 44], "red"], [4.5, [240, 138, 36], "orange"], [6.5, [240, 208, 30], "yellow"], [7.5, [76, 176, 80], "green"],
  [9.5, [44, 150, 190], "blue-green"], [11.5, [52, 96, 208], "blue"], [15, [106, 52, 150], "violet"],
];

/** The liquid's colour and the word for it. */
export function look(t, sp = speciate(t)) {
  if (t.vol <= EPS) return { rgb: [200, 224, 240], a: 0, name: "empty" };
  let rgb = [200, 224, 240], a = 0.2, name = "colourless", best = 0.12;
  for (const [where, key, c, k, word] of TINT) {
    const n = get(sp[where], key);
    if (n <= EPS) continue;
    const s = 1 - Math.exp((-k * n) / t.vol);
    const w = s / (a + s);
    rgb = rgb.map((v, i) => v * (1 - w) + c[i] * w);
    a = Math.min(0.92, a + s * (1 - a));
    if (s > best) { best = s; name = s < 0.3 && word === "blue" ? "pale blue" : word; }
  }
  const over = (c, strength, word) => {
    rgb = rgb.map((v, i) => v * (1 - strength) + c[i] * strength);
    a = Math.max(a, 0.72);
    name = word;
  };
  if (t.ind.includes("ui")) {
    const [, c, word] = UNIVERSAL.find(([top]) => sp.pH < top);
    over(c, 0.85, word);
  }
  if (t.ind.includes("mo")) {
    if (sp.pH < 3.1) over([226, 60, 50], 0.7, "red");
    else if (sp.pH < 4.4) over([240, 140, 40], 0.7, "orange");
    else over([244, 206, 44], 0.7, "yellow");
  }
  if (t.ind.includes("phph") && sp.pH > 8.3) over([226, 70, 160], 0.75, "pink");
  return { rgb: rgb.map(Math.round), a, name };
}

// ── what cannot be undone ───────────────────────────────────────────────────
function settle(t, heated) {
  const ev = [];
  const aq = t.aq;
  for (let pass = 0; pass < 12; pass++) {
    let moved = false;
    const did = (e) => { ev.push(e); moved = true; };
    let n;

    if ((n = Math.min(get(aq, "H"), get(aq, "OH"))) > EPS) { bump(aq, "H", -n); bump(aq, "OH", -n); did({ id: "neutral", n }); }
    if ((n = Math.min(get(aq, "H"), get(aq, "NH3"))) > EPS) { bump(aq, "H", -n); bump(aq, "NH3", -n); bump(aq, "NH4", n); did({ id: "neutralNH3", n }); }
    // an ammonium salt and an alkali: ammonia is set free in the solution (and driven off by heat)
    if ((n = Math.min(get(aq, "NH4"), get(aq, "OH"))) > EPS) { bump(aq, "NH4", -n); bump(aq, "OH", -n); bump(aq, "NH3", n); moved = true; }
    if ((n = Math.min(get(aq, "H"), get(aq, "CO3"))) > EPS) { bump(aq, "H", -n); bump(aq, "CO3", -n); t.gas = "CO2"; did({ id: "carbonate", n }); }
    if ((n = Math.min(get(aq, "H"), get(t.solid, "CaCO3"))) > EPS) { bump(aq, "H", -n); bump(t.solid, "CaCO3", -n); bump(aq, "Ca", n); t.gas = "CO2"; did({ id: "marble", n }); }
    if ((n = Math.min(get(aq, "H"), get(t.solid, "CuO"))) > EPS) { bump(aq, "H", -n); bump(t.solid, "CuO", -n); bump(aq, "Cu", n); did({ id: "oxide", n }); }
    for (const m of ["Mg", "Zn", "Fe"]) {
      if ((n = Math.min(get(t.metal, m), get(aq, "H"))) > EPS) {
        bump(t.metal, m, -n); bump(aq, "H", -n); bump(aq, METAL[m].ion, n); t.gas = "H2"; did({ id: "metalAcid", n, m });
      }
    }
    // displacement: only ions actually in solution can be pushed out
    const free = speciate(t).free;
    // iron(III) and aluminium carbonates do not exist: the hydroxide comes down and CO2 leaves
    for (const m of ["Fe3", "Al"]) {
      if ((n = Math.min(get(free, m), get(free, "CO3"))) > EPS) { bump(aq, "CO3", -n); bump(aq, "OH", n); t.gas = "CO2"; did({ id: "hydrolysis", n, m }); break; }
    }
    if (moved) continue;
    for (const m of ["Mg", "Zn", "Fe", "Cu"]) {
      if ((n = Math.min(get(t.metal, m), get(free, "Fe3") / 3)) > EPS) {
        bump(t.metal, m, -n); bump(aq, METAL[m].ion, n); bump(aq, "Fe3", -3 * n); bump(aq, "Fe2", 2 * n);
        did({ id: "reduceFe3", n, m });
        break;
      }
    }
    if (!moved) {
      outer: for (let i = 0; i < SERIES.length; i++) {
        const m = SERIES[i];
        if (get(t.metal, m) <= EPS) continue;
        for (let j = SERIES.length - 1; j > i; j--) {
          const low = SERIES[j];
          if ((n = Math.min(get(t.metal, m), get(free, METAL[low].ion))) > EPS) {
            bump(t.metal, m, -n); bump(aq, METAL[m].ion, n); bump(aq, METAL[low].ion, -n); bump(t.metal, low, n);
            if (!t.deposit.includes(low)) t.deposit.push(low);
            did({ id: "displace", n, m, low });
            break outer;
          }
        }
      }
    }
    if (get(aq, "H2O2") > EPS && get(t.solid, "MnO2") > EPS) { n = aq.H2O2; delete aq.H2O2; t.gas = "O2"; did({ id: "oxygen", n }); }

    if (heated) {
      const sp = speciate(t);
      if ((n = get(sp.ppt, "CuOH")) > EPS) {
        const fromOH = Math.min(n, get(aq, "OH"));
        bump(aq, "Cu", -n); bump(aq, "OH", -fromOH);
        if (n - fromOH > EPS) { bump(aq, "NH3", -(n - fromOH)); bump(aq, "NH4", n - fromOH); }
        bump(t.solid, "CuO", n);
        did({ id: "bakeHydroxide", n });
      }
      if ((n = get(sp.ppt, "CuCO3")) > EPS) {
        bump(aq, "Cu", -n); bump(aq, "CO3", -n); bump(t.solid, "CuO", n); t.gas = "CO2";
        did({ id: "bakeCarbonate", n });
      }
      // only the ammonia that is spare leaves: what holds a precipitate or a complex stays
      if (!moved && (n = get(speciate(t).free, "NH3")) > EPS) { bump(aq, "NH3", -n); t.gas = "NH3"; did({ id: "ammonia", n }); }
    }
    if (!moved) break;
  }
  t.deposit = t.deposit.filter((m) => get(t.metal, m) > EPS);
  return ev;
}

// ── saying what happened ────────────────────────────────────────────────────
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const an = (word) => (/^[aeiou]/i.test(word) ? "an" : "a");
const FIZZ = "Bubbles of a colourless gas are given off.";

function snapshot(t) {
  const sp = speciate(t);
  return { sp, look: look(t, sp), vol: t.vol, metal: { ...t.metal }, solid: { ...t.solid }, empty: isEmpty(t) };
}

/**
 * Do something to a tube and report it.
 * @returns {{ obs: {text, why?, eq?}[], flags: string[], events: object[] }}
 */
function act(t, change, { heated = false, adding = null } = {}) {
  const before = snapshot(t);
  change();
  const events = settle(t, heated);
  // warmth: what the thermometer will read. It cools a little every time the vessel is touched.
  t.temp = 25 + ((t.temp ?? 25) - 25) * 0.75;
  if (t.vol > EPS) {
    const warm = (id, k) => (events.filter((e) => e.id === id).reduce((a, e) => a + e.n, 0) * k) / t.vol;
    t.temp += warm("neutral", 26) + warm("neutralNH3", 22) + warm("metalAcid", 30) + warm("displace", 16) + warm("oxygen", 14);
  }
  if (heated) t.temp = Math.max(t.temp, 82);
  t.temp = Math.min(100, t.temp);
  // mass: what a balance will read. A gas that leaves takes its mass with it;
  // a solid that dissolves hands its mass to the liquid.
  for (const e of events) {
    const k = e.id === "metalAcid" ? EQ_MASS[e.m] - 1 : e.id === "marble" ? 50 - 22 : e.id === "oxide" ? 39.8 : e.id === "carbonate" || e.id === "hydrolysis" || e.id === "bakeCarbonate" ? -22
      : e.id === "oxygen" ? -16 : e.id === "ammonia" ? -17 : e.id === "reduceFe3" ? EQ_MASS[e.m] : e.id === "displace" ? EQ_MASS[e.m] - EQ_MASS[e.low] : e.id === "bakeHydroxide" ? -39.8 - 9 : 0;
    t.extra = (t.extra || 0) + k * e.n * 0.01;
  }
  const after = snapshot(t);
  const obs = [];
  const flags = [];
  const say = (text, why, eq) => obs.push({ text, why, eq });
  const has = (id) => events.some((e) => e.id === id);
  const sum = (id) => events.filter((e) => e.id === id).reduce((a, e) => a + e.n, 0);

  // gases and other one-way changes, in the order a student would notice them
  if (has("carbonate")) { say(`Fizzing. ${FIZZ}`, "The acid destroys the carbonate ion; the gas is carbon dioxide.", "CO3^2-(aq) + 2H^+(aq) -> H2O(l) + CO2(g)"); flags.push("gas:CO2"); }
  if (has("marble")) {
    const left = get(t.solid, "CaCO3") > EPS;
    say(`The marble chips fizz${left ? "" : " and dissolve away"}. ${FIZZ}`, "Calcium carbonate reacts with the acid; the gas is carbon dioxide.", "CaCO3(s) + 2H^+(aq) -> Ca^2+(aq) + H2O(l) + CO2(g)");
    flags.push("gas:CO2");
  }
  if (has("hydrolysis")) { say(`Fizzing. ${FIZZ}`, "Iron(III) and aluminium carbonates do not exist: the hydroxide comes down and carbon dioxide escapes."); flags.push("gas:CO2"); }
  for (const e of events.filter((x) => x.id === "metalAcid")) {
    if (obs.some((o) => o.metal === e.m)) continue;
    const M = METAL[e.m];
    const gone = get(t.metal, e.m) <= EPS;
    obs.push({ metal: e.m, text: `The ${M.name} ${WITH_ACID[e.m]}${gone ? " and dissolves away" : ""}. ${FIZZ}`, why: `${cap(M.name)} is above hydrogen in the reactivity series, so it displaces hydrogen from the acid.`, eq: `${M.sym}(s) + 2H^+(aq) -> ${ION_TEX[M.ion]}(aq) + H2(g)` });
    flags.push("gas:H2");
  }
  if (has("oxygen")) { say(`Rapid fizzing. ${FIZZ} The black powder is still there at the end.`, "Manganese(IV) oxide is a catalyst: it speeds up the breakdown of hydrogen peroxide and is not used up. The gas is oxygen.", "2H2O2(aq) -> 2H2O(l) + O2(g)"); flags.push("gas:O2"); }
  if (has("oxide")) say("The black powder dissolves in the acid.", "Copper(II) oxide is a base: it reacts with the acid to give a copper(II) salt and water.", "CuO(s) + 2H^+(aq) -> Cu^2+(aq) + H2O(l)");
  for (const e of events.filter((x) => x.id === "reduceFe3")) {
    if (flags.includes("reduceFe3")) break;
    say(`The ${METAL[e.m].name} slowly dissolves.`, `${cap(METAL[e.m].name)} reduces iron(III) ions to iron(II) ions.`, `${METAL[e.m].sym}(s) + 2Fe^3+(aq) -> ${ION_TEX[METAL[e.m].ion]}(aq) + 2Fe^2+(aq)`);
    flags.push("reduceFe3");
  }
  for (const e of events.filter((x) => x.id === "displace")) {
    if (flags.includes(`deposit:${e.low}`)) continue;
    const hi = METAL[e.m], lo = METAL[e.low];
    const gone = get(t.metal, e.m) <= EPS;
    const k = lo.charge === 1 ? 2 : 1;
    say(
      gone ? `${cap(an(lo.coat))} ${lo.coat} solid forms as the ${hi.name} dissolves away.` : `${cap(an(lo.coat))} ${lo.coat} coating forms on the ${hi.name}.`,
      `${cap(hi.name)} is more reactive than ${lo.name}, so it displaces ${lo.name} from the solution.`,
      `${hi.sym}(s) + ${k > 1 ? k : ""}${ION_TEX[lo.ion]}(aq) -> ${ION_TEX[hi.ion]}(aq) + ${k > 1 ? k : ""}${lo.sym}(s)`
    );
    flags.push(`deposit:${e.low}`);
  }
  if (has("ammonia")) { say("A colourless gas with a sharp, choking smell is given off.", "Heating drives ammonia gas out of the solution. It is the only common alkaline gas.", t.added.includes("nh4cl") ? "NH4^+(aq) + OH^-(aq) -> NH3(g) + H2O(l)" : "NH3(aq) -> NH3(g)"); flags.push("gas:NH3"); }
  if (has("bakeHydroxide")) { say("The pale blue precipitate turns black.", "Heat decomposes copper(II) hydroxide to black copper(II) oxide.", "Cu(OH)2(s) -> CuO(s) + H2O(l)"); flags.push("heat:CuO"); }
  if (has("bakeCarbonate")) { say("The blue-green precipitate turns black.", "Heat decomposes copper(II) carbonate to black copper(II) oxide and carbon dioxide.", "CuCO3(s) -> CuO(s) + CO2(g)"); flags.push("heat:CuO", "gas:CO2"); }

  // complexes: a precipitate going back into solution
  const explained = new Set();
  if (has("bakeHydroxide")) explained.add("CuOH");
  if (has("bakeCarbonate")) explained.add("CuCO3");
  for (const id of COMPLEX_ORDER) {
    const was = get(before.sp.cx, id), now = get(after.sp.cx, id);
    if (now <= was + EPS) continue;
    const c = COMPLEX[id], p = PPT[c.from];
    const left = get(after.sp.ppt, c.from) > EPS;
    explained.add(c.from);
    if (get(before.sp.ppt, c.from) <= EPS && !left && was <= EPS && before.vol > EPS) {
      // it formed and dissolved in one go: there was that much reagent already
      say(`${cap(an(p.colour))} ${p.colour} precipitate forms and at once dissolves in the excess ${c.reagent}, leaving a ${c.look} solution.`, c.why, c.eq);
    } else if (left) {
      say(`Some of the ${p.colour} precipitate dissolves. Add more ${c.reagent} to dissolve it all.`, c.why, c.eq);
    } else {
      say(`The ${p.colour} precipitate dissolves in excess ${c.reagent}, giving a ${c.look} solution.`, c.why, c.eq);
    }
    flags.push(`dissolve:${c.from}`, `cx:${id}`);
  }

  // precipitates: new, more, or gone
  const keys = new Set([...Object.keys(before.sp.ppt), ...Object.keys(after.sp.ppt)]);
  for (const key of keys) {
    const was = get(before.sp.ppt, key), now = get(after.sp.ppt, key);
    const p = PPT[key];
    if (now > was + EPS) {
      if (explained.has(key) && was <= EPS) continue;
      say(was <= EPS ? `${cap(an(p.colour))} ${p.colour} precipitate forms.` : `More of the ${p.colour} precipitate forms.`, `The precipitate is ${p.name}, {${p.formula}}, which is insoluble.`, p.eq);
      flags.push(`ppt:${key}`);
    } else if (now < was - EPS && !explained.has(key)) {
      const byAcid = has("neutral") || has("neutralNH3") || has("carbonate");
      const how = byAcid ? " in the acid" : "";
      say(now <= EPS ? `The ${p.colour} precipitate dissolves${how}.` : `Some of the ${p.colour} precipitate dissolves${how}.`, byAcid ? `${cap(p.name)} is a base, so the acid reacts with it and it goes back into solution.` : undefined);
      flags.push(`gone:${key}`);
    }
  }

  // a precipitate that sits there however much alkali goes in: say so, once
  if (adding && (adding.id === "naoh" || adding.id === "nh3")) {
    const spare = adding.id === "naoh" ? get(after.sp.free, "OH") : get(after.sp.free, "NH3");
    for (const [m, key] of HYDROXIDES) {
      const now = get(after.sp.ppt, key);
      const tag = `${key}/${adding.id}`;
      if (now <= EPS || Math.abs(now - get(before.sp.ppt, key)) > EPS || spare < now - EPS || get(after.sp.free, m) > EPS || t.said.includes(tag)) continue;
      t.said.push(tag);
      say(`The ${PPT[key].colour} precipitate does not dissolve in excess ${adding.id === "naoh" ? "sodium hydroxide" : "ammonia"}.`, `${cap(PPT[key].name)} is insoluble in excess ${adding.id === "naoh" ? "sodium hydroxide" : "aqueous ammonia"}.`);
      flags.push(`insoluble:${tag}`);
    }
  }

  // the colour of the liquid
  if (after.vol > EPS && before.look.name !== after.look.name && !obs.some((o) => o.text.includes(`${after.look.name} solution`))) {
    const ind = adding && adding.kind === "indicator";
    if (before.vol > EPS || ind) {
      const pH = after.sp.pH;
      const why = t.ind.length && pH != null ? (t.ind.includes("ui") ? `Universal indicator: about pH ${Math.round(pH)}, ${pH < 6.5 ? "acidic" : pH > 7.5 ? "alkaline" : "neutral"}.` : undefined) : undefined;
      say(ind ? `The indicator turns the liquid ${after.look.name}.` : `The liquid turns ${after.look.name}.`, why);
      flags.push(`colour:${after.look.name}`);
    }
  }
  if (sum("neutral") + sum("neutralNH3") >= 0.5 - EPS) {
    say("It feels warmer.", "Neutralisation gives out heat. An acid and an alkali make a salt and water.", has("neutral") ? "H^+(aq) + OH^-(aq) -> H2O(l)" : "NH3(aq) + H^+(aq) -> NH4^+(aq)");
    flags.push("neutral");
  } else if (has("neutral") || has("neutralNH3")) flags.push("neutral");

  if (!obs.length && !before.empty) {
    if (heated) say("The liquid gets hot. No other change.");
    else {
      const idle = ["Cu", "Ag", "Pb"].find((m) => get(t.metal, m) > EPS && get(after.sp.free, "H") > EPS && !t.deposit.includes(m));
      say("No visible change.", idle ? `${cap(METAL[idle].name)} is below hydrogen in the reactivity series, so it cannot displace hydrogen from a dilute acid.` : undefined);
    }
  }
  return { obs: obs.map(({ text, why, eq }) => ({ text, why, eq })), flags, events, state: after };
}

// ── the things a student can do ─────────────────────────────────────────────
/** Add a reagent. `dose` is "drops" or "portion" (solutions only). */
export function add(t, id, dose = "portion", strength = 1) {
  const r = BY_ID[id];
  if (!r) throw new Error(`No such reagent: ${id}`);
  const amount = r.kind === "solution" ? (typeof dose === "number" ? dose : DOSES[dose] ?? 1) : 1;
  if (r.kind === "solution" && amount > roomIn(t) + EPS) return { refused: "It is full. Empty it, or use another one." };
  if (r.oil) {
    const first = !(t.oil > EPS);
    t.oil = (t.oil || 0) + amount;
    if (!t.added.includes(id)) t.added.push(id);
    const obs = t.vol > EPS
      ? [{ text: first ? "The oil does not mix with the liquid. It floats on top as a separate, pale yellow layer." : "The layer of oil on top gets deeper.", why: "Oil and water are immiscible: they do not dissolve in each other. Oil is the less dense, so it is the upper layer." }]
      : [{ text: "Cooking oil is a pale yellow liquid." }];
    return { title: `Added ${r.name}`, obs, flags: ["oil"], events: [], state: { look: look(t) } };
  }
  if (r.kind === "solid" && solidTotal(t) + 1 > SOLID_CAP + EPS) return { refused: "There is enough solid in there already." };
  if (r.kind === "indicator" && t.vol <= EPS) return { refused: "Put a liquid in first, then add the indicator." };
  if (r.kind === "indicator" && t.ind.includes(id)) return { refused: `There is ${r.name} in there already.` };

  const wasDry = t.vol <= EPS;
  const crystals = r.kind === "solution" && get(t.solid, "crystals") > EPS;
  const res = act(t, () => {
    t.gas = null;
    if (r.kind === "solution") {
      undry(t);
      t.vol += amount;
      for (const [k, n] of Object.entries(r.adds)) bump(t.aq, k, n * amount * strength);
    } else if (r.kind === "solid") {
      for (const [k, n] of Object.entries(r.metal || {})) bump(t.metal, k, n);
      for (const [k, n] of Object.entries(r.solid || {})) bump(t.solid, k, n);
    } else t.ind.push(id);
    if (!t.added.includes(id)) t.added.push(id);
  }, { adding: r });

  const how = r.kind === "solution" ? (dose === "drops" || dose <= 0.25 ? "a few drops of " : "") : r.kind === "indicator" ? "a few drops of " : "";
  res.title = `Added ${how}${r.name}`;
  if (crystals) res.obs = [{ text: "The crystals dissolve." }, ...res.obs.filter((o) => o.text !== "No visible change.")];
  if (wasDry && r.kind === "solution" && res.state.look.name !== "colourless") {
    if (res.obs.length) res.obs.push({ text: `The liquid is ${res.state.look.name}.` });
    else res.obs.push({ text: `${cap(r.name)} is ${res.state.look.name}.` });
  }
  return res;
}

/** Hold the tube in the flame. */
export function heat(t) {
  if (isEmpty(t)) return { refused: "There is nothing in there to heat." };
  if (t.vol <= EPS) return { refused: "Add a liquid first: these solids do not change in a Bunsen flame." };
  const res = act(t, () => { t.gas = null; }, { heated: true });
  res.title = "Heated gently";
  return res;
}

/** Empty the tube down the sink. */
export function rinse(t) {
  Object.assign(t, newTube(t.cap));
  return { title: "Emptied and rinsed", obs: [], flags: [] };
}

// ── weighing, filtering, boiling away, collecting ────────────────────────────────
// Grams per equivalent, for the balance. One portion of liquid is 2 cm3 and weighs 2 g.
const EQ_MASS = { Mg: 12.2, Zn: 32.7, Fe: 27.9, Pb: 103.6, Cu: 31.8, Ag: 107.9, CaCO3: 50, CuO: 39.8, MnO2: 87 };
const SALT_IONS = ["Cu", "Fe2", "Fe3", "Zn", "Al", "Pb", "Ca", "Ba", "Ag", "Mg", "Na", "K", "NH4"];
const saltIn = (t) => SALT_IONS.reduce((a, k) => a + get(t.aq, k), 0);

/** What the contents of a vessel weigh, in grams (the glass is the drawing's business). */
export function massOf(t) {
  let m = 2 * t.vol + 1.84 * (t.oil || 0) + (t.extra || 0);
  for (const [k, n] of Object.entries(t.metal)) m += n * EQ_MASS[k] * 0.01;
  for (const [k, n] of Object.entries(t.solid)) m += k === "crystals" ? 0.1 * saltIn(t) : n * EQ_MASS[k] * 0.01;
  return Math.max(0, m);
}

/** Liquid has come back to a vessel that had boiled dry: the crystals are solution again. */
function undry(t) {
  delete t.solid.crystals;
  delete t.crystal;
}

/**
 * Boil water away: `n` portions of it, and nothing that was dissolved.
 * dry = let it go all the way, leaving crystals (an evaporating dish);
 * otherwise a little is always left (a distillation flask must not boil dry).
 */
export function boilOff(t, n, { dry = false } = {}) {
  const was = look(t);
  const take = dry ? Math.min(n, t.vol) : Math.min(n, Math.max(0, t.vol - Math.max(1, (t.cap || CAP) * 0.04)));
  if (take <= EPS) return { gone: 0 };
  t.vol -= take;
  t.gas = null;
  if (t.vol > EPS) return { gone: take };
  t.vol = 0;
  t.ind = [];
  const salt = saltIn(t);
  if (salt <= EPS) { t.aq = {}; return { gone: take, dried: true, colour: null }; }
  const colour = was.name === "colourless" || was.name === "empty" ? "white" : was.name.replace("pale ", "");
  t.solid.crystals = Math.min(4, Math.max(1.5, salt));
  t.crystal = colour === "white" ? [244, 244, 240] : was.rgb;
  return { gone: take, dried: true, colour };
}

/** A filter paper: the precipitate is taken out of a sample and handed back as the residue. */
export function filterOut(s) {
  const parts = {};
  for (const [c, a, k] of [...SALTS_FIRST, ...SALTS_LAST]) parts[k] = [c, a];
  for (const [m, k] of HYDROXIDES) parts[k] = [m, "OH"];
  const out = [];
  for (const [key, n] of Object.entries(speciate(s).ppt)) {
    const [c, a] = parts[key];
    bump(s.aq, c, -n);
    if (a === "OH") {
      const fromOH = Math.min(n, get(s.aq, "OH"));
      bump(s.aq, "OH", -fromOH);
      if (n - fromOH > EPS) { bump(s.aq, "NH3", -(n - fromOH)); bump(s.aq, "NH4", n - fromOH); }
    } else bump(s.aq, a, -n);
    out.push({ key, n, rgb: PPT[key].rgb, colour: PPT[key].colour, name: PPT[key].name, formula: PPT[key].formula });
  }
  return out;
}

/** A measured amount of a reagent straight from its bottle (a pipette, a dropper). */
export function sampleOf(id, n, strength = 1) {
  const r = BY_ID[id];
  const s = newTube(n);
  s.vol = n;
  for (const [k, v] of Object.entries(r.adds)) bump(s.aq, k, v * n * strength);
  s.added = [id];
  return s;
}

const GAS_FROM = { carbonate: "CO2", marble: "CO2", hydrolysis: "CO2", bakeCarbonate: "CO2", metalAcid: "H2", oxygen: "O2", ammonia: "NH3" };
/** The gas an action gave off and how much (in equivalents; 12 cm3 each), or null. */
export function gasMade(res) {
  let gas = null, n = 0;
  for (const e of res.events || []) {
    const g = GAS_FROM[e.id];
    if (!g) continue;
    if (g !== gas) { gas = g; n = 0; }
    n += e.n;
  }
  return gas ? { gas, n } : null;
}

// ── electrolysis ────────────────────────────────────────────────────────────
/**
 * Pass a current through the liquid for a moment, between two carbon rods.
 * The school rules: at the negative rod a metal below hydrogen (copper, silver) is
 * plated out, otherwise hydrogen comes off; at the positive rod a halide gives the
 * halogen, otherwise oxygen. What is left behind changes too — brine goes alkaline,
 * copper(II) sulfate goes acidic and loses its blue.
 */
export function electrolyse(t, n = 1) {
  if (t.vol <= EPS) return { refused: "There is nothing in the cell. Pour in a solution first." };
  const free = speciate(t).free;
  const ions = Object.entries(free).filter(([k, v]) => v > EPS && !["NH3", "H2O2", "I2"].includes(k));
  if (!ions.length) return { title: "Switched on the current", obs: [{ text: "Nothing happens at either rod.", why: "Pure water has almost no ions in it, so it barely conducts. Add an acid, an alkali or a salt." }], flags: [], events: [] };
  const before = look(t);
  const obs = [], flags = [];
  const say = (text, why, eq) => obs.push({ text, why, eq });

  // the negative rod (cathode): reduction
  const metal = get(free, "Ag") > EPS ? "Ag" : get(free, "Cu") > EPS ? "Cu" : null;
  if (metal) {
    const m = Math.min(n, free[metal]);
    bump(t.aq, metal, -m);
    t.plated = metal;
    t.extra = (t.extra || 0) - m * EQ_MASS[metal] * 0.01 * 0;      // the plate stays in the cell: no mass leaves
    say(metal === "Cu" ? "A pink-brown coating of copper grows on the negative rod." : "Silvery crystals of silver grow on the negative rod.",
      `${metal === "Cu" ? "Copper" : "Silver"} is below hydrogen in the reactivity series, so its ions are discharged in preference to hydrogen ions.`,
      metal === "Cu" ? "Cu^2+(aq) + 2e^- -> Cu(s)" : "Ag^+(aq) + e^- -> Ag(s)");
    flags.push(`electro:${metal}`);
  } else {
    if (get(t.aq, "H") > EPS) bump(t.aq, "H", -Math.min(n, t.aq.H));
    else bump(t.aq, "OH", n);                                      // water is reduced: hydroxide is left behind
    say("Bubbles of a colourless gas stream off the negative rod.", "Hydrogen. The metal in solution is above hydrogen in the reactivity series, so hydrogen ions from the water are discharged instead.", "2H^+(aq) + 2e^- -> H2(g)");
    flags.push("electro:H2");
    t.extra = (t.extra || 0) - n * 0.01;
  }
  // the positive rod (anode): oxidation
  const halide = get(free, "I") > EPS ? "I" : get(free, "Cl") > EPS ? "Cl" : null;
  if (halide === "I") {
    const m = Math.min(n, free.I);
    bump(t.aq, "I", -m);
    bump(t.aq, "I2", m);
    say("A brown colour spreads from the positive rod.", "Iodide ions are discharged as iodine, which is brown in solution.", "2I^-(aq) -> I2(aq) + 2e^-");
    flags.push("electro:I2");
  } else if (halide === "Cl") {
    const m = Math.min(n, free.Cl);
    bump(t.aq, "Cl", -m);
    say("Bubbles of a pale green gas with a swimming-pool smell come off the positive rod.", "Chlorine. From a concentrated chloride solution, chloride ions are discharged in preference to hydroxide ions.", "2Cl^-(aq) -> Cl2(g) + 2e^-");
    flags.push("electro:Cl2");
    t.extra = (t.extra || 0) - m * 0.355;
  } else {
    if (get(t.aq, "OH") > EPS) bump(t.aq, "OH", -Math.min(n, t.aq.OH));
    else bump(t.aq, "H", n);                                       // water is oxidised: acid is left behind
    say("Bubbles of a colourless gas come off the positive rod, about half as fast.", "Oxygen. Sulfate and nitrate ions are not discharged; hydroxide ions from the water are.", "4OH^-(aq) -> 2H2O(l) + O2(g) + 4e^-");
    flags.push("electro:O2");
    t.extra = (t.extra || 0) - n * 0.08;
  }
  t.gas = null;
  // an acid and an alkali made at the two rods meet in the middle
  const k = Math.min(get(t.aq, "H"), get(t.aq, "OH"));
  if (k > EPS) { bump(t.aq, "H", -k); bump(t.aq, "OH", -k); }
  const after = look(t);
  if (after.name !== before.name) { say(`The liquid turns ${after.name}.`); flags.push(`colour:${after.name}`); }
  return { title: "Switched on the current", obs, flags, events: [] };
}

/** How much more liquid a vessel will take. */
export const roomIn = (t) => (t.cap || CAP) - t.vol - (t.oil || 0);

/** Take some of the liquid out (a dropper, or tipping the vessel). What is left stays put. */
export function takeFrom(t, amount) {
  // tipped or sucked up, both layers come together, in the proportion they are there
  const total = t.vol + (t.oil || 0);
  const n = Math.min(amount, total);
  if (n <= EPS) return null;
  const f = n / total;
  const s = newTube(n);
  s.vol = t.vol * f;
  s.oil = (t.oil || 0) * f;
  s.temp = t.temp ?? 25;
  s.ind = [...t.ind];
  s.added = [...t.added];
  s.extra = (t.extra || 0) * f;
  t.extra = (t.extra || 0) * (1 - f);
  for (const [k, v] of Object.entries(t.aq)) { bump(s.aq, k, v * f); bump(t.aq, k, -v * f); }
  t.vol -= s.vol;
  t.oil = (t.oil || 0) - s.oil;
  if (t.oil <= EPS) t.oil = 0;
  t.gas = null;
  if (t.vol <= EPS) { t.vol = 0; t.ind = []; t.aq = {}; if (!hasSolids(t)) t.added = t.oil > EPS ? ["oil"] : []; }
  return s;
}

/**
 * Run liquid out of the BOTTOM (the tap of a separating funnel): the lower, watery layer
 * comes first and the oil only when that has gone. Returns { s, layer, last }.
 */
export function takeBottom(t, n) {
  if (t.vol > EPS) {
    const oil = t.oil || 0;
    t.oil = 0;
    const s = takeFrom(t, Math.min(n, t.vol));
    t.oil = oil;
    if (oil > EPS && !t.added.includes("oil")) t.added.push("oil");
    s.added = s.added.filter((id) => id !== "oil");
    return { s, layer: "water", last: t.vol <= EPS && oil > EPS };
  }
  if (t.oil > EPS) {
    const m = Math.min(n, t.oil);
    const s = newTube(m);
    s.oil = m;
    s.added = ["oil"];
    t.oil -= m;
    if (t.oil <= EPS) { t.oil = 0; t.added = t.added.filter((id) => id !== "oil"); }
    return { s, layer: "oil", last: false };
  }
  return null;
}

/** Pour a sample (from takeFrom) into a vessel. */
export function pourIn(t, s, from = "another vessel") {
  if (s.vol + (s.oil || 0) > roomIn(t) + EPS) return { refused: "It is full. Empty it, or use another one." };
  const wasDry = t.vol <= EPS;
  const crystals = get(t.solid, "crystals") > EPS;
  const res = act(t, () => {
    t.gas = null;
    undry(t);
    t.extra = (t.extra || 0) + (s.extra || 0);
    if (t.vol + s.vol > EPS) t.temp = ((t.temp ?? 25) * t.vol + (s.temp ?? 25) * s.vol) / (t.vol + s.vol);
    t.oil = (t.oil || 0) + (s.oil || 0);
    t.vol += s.vol;
    for (const [k, v] of Object.entries(s.aq)) bump(t.aq, k, v);
    for (const id of s.ind) if (!t.ind.includes(id)) t.ind.push(id);
    for (const id of s.added) if (!t.added.includes(id)) t.added.push(id);
  });
  res.title = `Added liquid from ${from}`;
  if (crystals) res.obs = [{ text: "The crystals dissolve." }, ...res.obs.filter((o) => o.text !== "No visible change.")];
  if (wasDry && res.state.look.name !== "colourless") res.obs.push({ text: `The liquid is ${res.state.look.name}.` });
  return res;
}

// The colour a salt gives a flame. Sodium's yellow hides the others.
const FLAME = [
  ["Na", "sodium", "golden yellow", [255, 196, 40]], ["Cu", "copper", "blue-green", [60, 208, 170]], ["Ba", "barium", "apple green", [156, 224, 90]],
  ["Ca", "calcium", "brick red", [232, 92, 50]], ["K", "potassium", "lilac", [196, 150, 244]], ["Pb", "lead", "blue-white", [170, 200, 255]],
];
/** What a flame-test wire dipped in this liquid will show, or null for no colour. */
export function flameOf(t) {
  const sp = speciate(t);
  const hit = FLAME.find(([ion]) => get(t.aq, ion) > EPS && (get(sp.free, ion) > EPS || ion === "Cu" || ion === "Ca" || ion === "Ba" || ion === "Pb"));
  return hit ? { ion: hit[0], metal: hit[1], name: hit[2], rgb: hit[3] } : null;
}

const GAS_NAME = { H2: "hydrogen", CO2: "carbon dioxide", O2: "oxygen", NH3: "ammonia" };

/** A test: "lit" | "glow" | "red" | "blue". */
export function test(t, tool) {
  const obs = [], flags = [];
  const say = (text, why, eq) => obs.push({ text, why, eq });
  const gas = t.gas;
  let fx = "none";
  if (tool === "lit") {
    if (gas === "H2") { say("The gas burns with a squeaky pop.", "Hydrogen. It burns explosively in air to make water.", "2H2(g) + O2(g) -> 2H2O(l)"); flags.push("test:pop"); fx = "pop"; t.gas = null; }
    else if (gas === "CO2") { say("The flame goes out.", "Carbon dioxide does not burn and does not let things burn in it."); flags.push("test:out"); fx = "out"; }
    else if (gas === "O2") { say("The splint burns much more brightly.", "Oxygen. Things burn far better in it than in air."); flags.push("test:bright"); fx = "bright"; }
    else if (gas === "NH3") { say("The flame goes out.", "Ammonia does not burn in air. Test it with damp red litmus instead."); fx = "out"; }
    else { say("The splint carries on burning. No gas is coming off."); fx = "burn"; }
    return { title: "Held a lighted splint at the mouth", obs, flags, fx };
  }
  if (tool === "glow") {
    if (gas === "O2") { say("The glowing splint relights.", "Oxygen. This is the test for it.", "C(s) + O2(g) -> CO2(g)"); flags.push("test:relight"); fx = "relight"; }
    else if (gas) { say("The splint does not relight.", `The gas is not oxygen.`); fx = "glow"; }
    else { say("The splint carries on glowing. No gas is coming off."); fx = "glow"; }
    return { title: "Held a glowing splint at the mouth", obs, flags, fx };
  }
  if (tool === "red" || tool === "blue") {
    const paper = tool;
    let turned = null;
    if (gas) {
      if (gas === "NH3" && paper === "red") { say("At the mouth, the damp red litmus turns blue.", "Ammonia is an alkaline gas. This is the test for it."); flags.push("test:gasblue"); turned = "blue"; }
      else if (gas === "CO2" && paper === "blue") { say("At the mouth, the damp blue litmus turns faintly red.", "Carbon dioxide is a weakly acidic gas."); turned = "red"; }
      else say(`At the mouth, the damp ${paper} litmus does not change.`, gas === "H2" || gas === "O2" ? `The gas is neutral.` : undefined);
    }
    if (t.vol > EPS) {
      const pH = speciate(t).pH;
      if (paper === "blue" && pH < 6.6) { say("Dipped in the liquid, the blue litmus turns red.", "The liquid is acidic."); flags.push("test:acid"); turned = "red"; }
      else if (paper === "red" && pH > 7.4) { say("Dipped in the liquid, the red litmus turns blue.", "The liquid is alkaline."); flags.push("test:alkali"); turned = "blue"; }
      else say(`Dipped in the liquid, the ${paper} litmus stays ${paper}.`, pH > 6.6 && pH < 7.4 ? "Neither paper changes in a neutral liquid." : paper === "red" ? "Red litmus only changes in an alkali." : "Blue litmus only changes in an acid.");
    } else if (!gas) return { refused: "There is no liquid or gas in there to test." };
    return { title: `Tested with ${paper} litmus paper`, obs, flags, fx: turned ? `litmus-${paper}-${turned}` : `litmus-${paper}-${paper}` };
  }
  if (tool === "ph" || tool === "meter" || tool === "thermo") {
    if (t.vol <= EPS) return { refused: "There is no liquid in there to test." };
    const pH = speciate(t).pH;
    const kind = pH < 6.5 ? "acidic" : pH > 7.5 ? "alkaline" : "neutral";
    if (tool === "ph") {
      const [, c, word] = UNIVERSAL.find(([top]) => pH < top);
      say(`The pH paper turns ${word}.`, `About pH ${Math.round(pH)}: ${kind}.`);
      return { title: "Tested with pH paper", obs, flags: ["test:ph"], fx: `ph-${c.join(",")}` };
    }
    if (tool === "meter") {
      say(`The pH meter reads ${pH.toFixed(1)}.`, `The liquid is ${kind}.`);
      return { title: "Dipped in the pH meter", obs, flags: ["test:ph"], fx: `meter-${pH.toFixed(1)}` };
    }
    const T = Math.round(t.temp ?? 25);
    say(`The thermometer reads ${T} °C.`, T >= 30 ? "Warmer than the room (25 °C)." : "Room temperature.");
    return { title: "Took the temperature", obs, flags: [`temp:${T}`], fx: `thermo-${T}` };
  }
  throw new Error(`No such test: ${tool}`);
}
export const gasName = (g) => GAS_NAME[g];

/** What is lying in the bottom of the tube, for the drawing. */
export function sediment(t, sp = speciate(t)) {
  const ppt = Object.entries(sp.ppt).map(([key, n]) => ({ key, n, rgb: PPT[key].rgb }));
  const metal = Object.entries(t.metal).filter(([, n]) => n > EPS).map(([key, n]) => ({ key, n, rgb: METAL[key].rgb, deposit: t.deposit.includes(key) }));
  const solid = Object.entries(t.solid).filter(([, n]) => n > EPS).map(([key, n]) => ({ key, n, rgb: key === "crystals" && t.crystal ? t.crystal : SOLID[key].rgb }));
  return { ppt, metal, solid };
}

/** "Cu(OH)2 + 2H^+ -> ..." as HTML: subscripts, charges, an arrow. Input is our own text. */
export function chemHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/\^(\d*[+-])/g, "<sup>$1</sup>")
    .replace(/([A-Za-z)\]])(\d+)/g, "$1<sub>$2</sub>")
    .replace(/<sup>(\d*)-<\/sup>/g, "<sup>$1−</sup>")
    .replace(/->/g, "→");
}
