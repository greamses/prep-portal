/* ============================================================================
   CHEMISTRY BENCH — the page
   ----------------------------------------------------------------------------
   An open bench and a drawer. Anything in the drawer can be put on the bench
   and stood anywhere; the experiment is whatever the student sets up.

   ONE RULE DOES MOST OF THE WORK: carry a thing to another thing to use it there.
     a bottle, a jar, a dropper bottle  → a vessel: it pours, for as long as held
     a vessel with liquid in it         → another vessel: it pours across
                                        → the waste tub: it is emptied
                                        → a burner: it sits in the flame
     a burner                           → under a vessel: it heats
     a splint, litmus                   → a vessel's mouth, or the gas jar
     pH paper, pH meter, thermometer    → into a vessel
     a dropper, a pipette               → a liquid (or a bottle), then another vessel
     the flame-test wire                → a liquid, and then a burner flame
     a funnel, a stopper, a delivery
     tube                               → a vessel's mouth: it stays there
   Let go, and whatever was carried goes back where it stood (unless it is the
   kind of thing that stays). Nothing happens on the way past: the hand has to
   come to rest first.

   WHAT STANDS ON WHAT. A rack, a tripod, a clamp, a balance pan, the space
   under a burette and under a condenser are all SLOTS: a vessel let go near one
   snaps to it and rides along when its host is moved.

   The only thing that is pressed rather than carried is a burette's tap.

   The chemistry is chem.js, the glass is glass.js. This file is hands,
   layout and the notebook.
   ========================================================================== */

import { REAGENTS, TASKS, newTube, add, heat, rinse, test, tasksDone, reagent, chemHtml, isEmpty, look, takeFrom, pourIn, roomIn, flameOf, massOf, boilOff, filterOut, sampleOf, gasMade, takeBottom, electrolyse } from "./chem.js";
import { DEFS, VESSELS, TOOLS, SUPPORTS, vesselSvg, paintVessel, bubble, reagentSvg, toolSvg, splintAfter, supportSvg, thumb, colourOf, mouthOf } from "./glass.js";
import { UI } from "/utils/components/ui-icons.js";
import { mountTooltips } from "/utils/components/tooltip.js";

const KEY = "chem-bench-v2";
const LOG_MAX = 40;
const H = 720;                     // the bench is always 720 units tall; its width follows the window
let W = 1100;
let BASE = 600;                    // where things stand when the page puts them out: clear of the note along the bottom
let TOP = 215;                     // and where the first row of bottles stands: clear of the icons along the top
const HEAT = { burner: 150, spirit: 116 };            // how far above its foot a burner's flame reaches
const MOUTH = ["lit", "glow"];                        // held at the mouth
const TAKES = { dropper: 0.5, pipette: 12.5 };        // portions drawn up (a portion is 2 cm3)
const STAYS = ["funnel", "bung", "tubing"];           // fitted into a mouth, and left there
const IDLE = ["waste", "trough", "syringe", "up", "down", "holder", "tongs"];   // never used ON anything
// Where a gas can be piped to. cap = equivalents it holds (12 cm3 each); inlet = where the rubber tube
// joins; mouth = where a splint is held; test = whether what is in it can be tested there.
const COLLECT = {
  trough: { cap: 8, inlet: [-96, -84], mouth: [44, -196], rim: 20, test: true, name: "gas jar" },
  syringe: { cap: 8.34, inlet: [-104, -128], mouth: [0, -128], rim: 0, test: false, name: "gas syringe" },
  up: { cap: 4, inlet: [-2, -70], mouth: [0, -100], rim: 18, test: true, name: "upturned tube" },
  down: { cap: 6, inlet: [-2, -182], mouth: [0, -160], rim: 30, test: true, name: "gas jar" },
};
const LIGHT = ["H2", "NH3"];                           // less dense than air: they rise
const GAS = { H2: "hydrogen", CO2: "carbon dioxide", O2: "oxygen", NH3: "ammonia" };
const NS = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** A sentence from chem.js; a formula inside it is written {Fe(OH)3}. */
const prose = (s) => esc(s).replace(/\{([^}]+)\}/g, (_, f) => chemHtml(f));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const cm3 = (portions) => `${(portions * 2).toFixed(portions * 2 >= 10 ? 0 : 1)} cm³`;

// ── icons: every control on the bench is one ────────────────────────────────
const glyph = (inner) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${inner}</svg>`;
const ICON = {
  back: UI.arrowLeft(20),
  setups: UI.shapes(20),
  notebook: UI.book(20),
  tasks: UI.task(20),
  drops: UI.droplet(20),
  measure: glyph(`<path d="M5 3h14v2.2h-1.4V18a3 3 0 0 1-3 3H9.4a3 3 0 0 1-3-3V5.2H5z" fill="var(--text-tertiary)"/><path d="M8.6 9h6.8v8.6a1.4 1.4 0 0 1-1.4 1.4h-4a1.4 1.4 0 0 1-1.4-1.4z" fill="var(--accent-secondary)"/>`),
  clear: UI.trash(20),
  fs: UI.expand(20),
  fsOff: UI.shrink(20),
  empty: glyph(`<path d="M3.4 5.6 13 2.8l.6 2-1.3.4 3.2 11a2.6 2.6 0 0 1-1.8 3.2l-4 1.2a2.6 2.6 0 0 1-3.2-1.8L3.3 7.8 2 8.2z" fill="var(--text-tertiary)" transform="rotate(-38 9 12)"/><path d="M18.6 13.4s2.6 3 2.6 4.8a2.6 2.6 0 0 1-5.2 0c0-1.8 2.6-4.8 2.6-4.8z" fill="var(--accent-secondary)"/>`),
  away: UI.close(18),
  eye: UI.eye(18),
  eyeOff: UI.eyeOff(18),
  wipe: UI.eraser(18),
};

// ── the drawer's catalogue ──────────────────────────────────────────────────
const CATS = [
  { id: "glass", label: "Glassware", icon: `<path d="M9 2.6h6v6.2l5 9.4a2.4 2.4 0 0 1-2.1 3.5H6.1A2.4 2.4 0 0 1 4 18.2l5-9.4z" fill="var(--accent-secondary)"/><path d="M7.4 14.6h9.2l1.9 3.7a1 1 0 0 1-.9 1.5H6.4a1 1 0 0 1-.9-1.5z" fill="#fff"/>` },
  { id: "kit", label: "Equipment", icon: `<rect x="9.6" y="13" width="4.8" height="7.6" rx="1.2" fill="var(--text-tertiary)"/><rect x="5" y="19" width="14" height="3" rx="1.5" fill="var(--text-tertiary)"/><path d="M12 1.8c2.6 3.6 4.8 5 4.8 8a4.8 4.8 0 0 1-9.6 0c0-3 2.2-4.4 4.8-8z" fill="var(--accent-danger)"/>` },
  { id: "liquid", label: "Liquids", icon: `<path d="M12 2.4s7.4 7.4 7.4 12.6a7.4 7.4 0 0 1-14.8 0C4.6 9.8 12 2.4 12 2.4z" fill="var(--accent-secondary)"/>` },
  { id: "solid", label: "Solids", icon: `<path d="M3.4 20.6 8 11.400l3.4 4.4 3-7 6.2 11.800z" fill="var(--accent-warning)"/><circle cx="6" cy="6.4" r="2.4" fill="var(--accent-primary)"/>` },
];
// other words a student might search by
const ALSO = {
  stand: "clamp stand boss", burette: "titration", pipette: "titration", still: "distillation condenser liebig", balance: "weighing scale mass",
  trough: "gas collection over water pneumatic", syringe: "gas volume measure", up: "upward delivery downward displacement of air ammonia hydrogen", down: "downward delivery upward displacement of air carbon dioxide",
  sepfunnel: "separating separation immiscible oil", cell: "electrolysis electrodes battery power cathode anode", tubing: "delivery tube bung", bung: "bung cork", funnel: "filtration filter", burner: "bunsen heat",
  spirit: "alcohol lamp heat", flask: "erlenmeyer", flask100: "erlenmeyer", cyl10: "graduated", cyl100: "graduated", dish: "basin", tripod: "gauze", holder: "tongs peg", waste: "sink bin",
};
const CATALOG = [
  ...Object.entries(VESSELS).map(([key, v]) => ({ cat: v.fixed ? "kit" : "glass", kind: "vessel", key, name: v.name })),
  ...Object.entries(SUPPORTS).map(([key, s]) => ({ cat: "kit", kind: "rack", key, name: s.name })),
  ...Object.entries(TOOLS).map(([key, t]) => ({ cat: "kit", kind: "tool", key, name: t.name })),
  ...REAGENTS.map((r) => ({ cat: r.kind === "solid" ? "solid" : "liquid", kind: "reagent", key: r.id, name: cap1(r.name) })),
];
const REAGENT_BOX = { solution: { x0: -35, y0: -125, x1: 35, y1: 8 }, solid: { x0: -36, y0: -96, x1: 36, y1: 8 }, indicator: { x0: -26, y0: -114, x1: 26, y1: 8 } };

const boxOf = (it) => (it.kind === "vessel" ? VESSELS[it.key].bbox : it.kind === "tool" ? TOOLS[it.key].bbox : it.kind === "rack" ? SUPPORTS[it.key].bbox : REAGENT_BOX[reagent(it.key).kind]);
const nameOf = (it) => (it.kind === "vessel" ? `${VESSELS[it.key].name} ${it.tag}` : CATALOG.find((c) => c.kind === it.kind && c.key === it.key).name);
/** "test tube A", for the middle of a sentence. */
const plain = (v) => (v.kind === "vessel" ? `${VESSELS[v.key].name.replace(/ \(.*/, "").toLowerCase()} ${v.tag}` : nameOf(v).toLowerCase());

// ── set-ups: a bench laid out ready ─────────────────────────────────────────
// vessels: "@x" stands x in the slot of the piece before it. fit: [tool, index of the vessel it is fitted to].
const PRESETS = [
  { id: "tubes", name: "Test-tube reactions", about: "A rack of tubes, an acid, two alkalis and four salts.", rack: 5, liquids: ["hcl", "naoh", "nh3", "cuso4", "feso4", "fecl3", "znso4"], tools: ["burner", "lit", "red", "waste"] },
  { id: "ions", name: "Tests for ions", about: "Sodium hydroxide, ammonia, barium chloride and silver nitrate against seven salts.", rack: 5, liquids: ["naoh", "nh3", "bacl2", "agno3", "hcl", "cuso4", "znso4", "also4", "cacl2", "nacl", "ki", "na2co3"], tools: ["waste"] },
  { id: "titration", name: "Titration", about: "Pipette 25 cm³ of alkali into the flask, add an indicator, then run acid in from the burette.", tall: true, vessels: ["beaker100", "burette", "@flask100"], liquids: ["hcl", "naoh", "phph", "mo"], tools: ["pipette", "waste"] },
  { id: "filter", name: "Filtration", about: "Make a precipitate in the beaker, then pour it through the filter paper.", vessels: ["beaker100", "flask", "beaker100"], fit: [["funnel", 1]], liquids: ["cuso4", "naoh", "bacl2", "znso4"], tools: ["waste"] },
  { id: "gases", name: "Making and testing gases", about: "Hydrogen, carbon dioxide, oxygen and ammonia, and the test for each.", vessels: ["boil", "boil", "boil", "boil"], liquids: ["hcl", "h2o2", "nh4cl", "naoh", "mg", "zn", "caco3", "mno2"], tools: ["burner", "lit", "glow", "red", "blue"] },
  { id: "collect", name: "Collecting a gas", about: "The flask is piped to a gas jar full of water. Put a solid in, then the acid, and test what collects.", vessels: ["flask"], fit: [["tubing", 0]], liquids: ["hcl", "h2o2", "zn", "caco3", "mno2"], tools: ["trough", "lit", "glow"] },
  { id: "syringe", name: "Measuring a gas", about: "The flask is piped to a gas syringe. Add a metal, then acid, and read the volume.", vessels: ["flask"], fit: [["tubing", 0]], liquids: ["hcl", "h2so4", "mg", "zn", "caco3"], tools: ["syringe"] },
  { id: "ammonia", name: "Collecting ammonia", about: "Ammonia is lighter than air and dissolves in water, so it is collected in a dry, upturned tube. Add both solutions, then heat.", vessels: ["boil"], fit: [["tubing", 0]], liquids: ["nh4cl", "naoh"], tools: ["up", "burner", "red"] },
  { id: "separate", name: "Separating oil and water", about: "Pour both liquids into the funnel, then press the tap to run off the lower layer.", tall: true, vessels: ["beaker100", "sepfunnel", "@beaker100"], liquids: ["water", "oil", "cuso4"], tools: ["waste"] },
  { id: "electro", name: "Electrolysis", about: "Pour a solution into the cell and hold down the red switch. Watch each rod.", tall: true, vessels: ["cell"], liquids: ["cuso4", "nacl", "h2so4", "ki", "water", "ui"], tools: ["waste"] },
  { id: "distil", name: "Distillation", about: "Pour a coloured solution into the flask and heat it. Clear water comes over into the receiver.", tall: true, vessels: ["beaker100", "still", "@flask100"], liquids: ["cuso4", "nacl", "water"], tools: ["burner", "waste"] },
  { id: "crystal", name: "Evaporating to crystals", about: "Heat a solution in the dish on the tripod until the water has gone. Weigh what is left.", vessels: ["beaker100"], stands: [["tripod", "dish"], ["balance", "watch"]], liquids: ["cuso4", "nacl", "caco3", "mg"], tools: ["burner", "waste"] },
  { id: "metals", name: "Reactivity of metals", about: "Four metals, an acid, and the solutions of four metal salts.", rack: 5, liquids: ["hcl", "cuso4", "feso4", "znso4", "agno3", "mg", "zn", "fe", "cu"], tools: ["lit", "waste"] },
  { id: "neutral", name: "Neutralisation", about: "Acids, alkalis, indicators, a pH meter and a thermometer. Use a few drops at a time near the end.", vessels: ["flask", "beaker100", "cyl100"], liquids: ["hcl", "h2so4", "naoh", "nh3", "ui", "phph", "mo"], tools: ["thermo", "meter", "ph", "dropper"] },
  { id: "flame", name: "Flame tests", about: "Dip the wire in a salt solution, then hold it in the flame.", rack: 5, liquids: ["nacl", "ki", "cacl2", "bacl2", "cuso4"], tools: ["burner", "wire", "waste"] },
  { id: "blank", name: "An empty bench", about: "Nothing out. Take what you want from the drawer.", liquids: [], tools: [] },
];

// ── what is remembered between visits ───────────────────────────────────────
const state = { items: [], n: 0, dose: "portion", explain: true, done: [], log: [], cat: "glass" };
let restored = false;
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "null");
  if (saved && Array.isArray(saved.items)) {
    Object.assign(state, saved);
    state.items = state.items.filter((it) => (it.kind === "vessel" ? VESSELS[it.key] : it.kind === "tool" ? TOOLS[it.key] : it.kind === "rack" ? SUPPORTS[it.key] : reagent(it.key)));
    // a vessel remembers its own size, but the sizes themselves can change between versions
    state.items.forEach((it) => { if (it.t) it.t = { ...newTube(), ...it.t, cap: VESSELS[it.key].cap, gas: null }; });
    restored = true;
  }
} catch { /* a bad save is just a fresh bench */ }

// ── the bench ───────────────────────────────────────────────────────────────
const wrap = $("cl-benchwrap");
const svg = $("cl-bench");
svg.innerHTML = `${DEFS}<g id="L-back"></g><g id="L-items"></g><g id="L-front"></g><g id="L-links"></g><g id="L-fx"></g>`;
const L = { back: $("L-back"), items: $("L-items"), front: $("L-front"), links: $("L-links"), fx: $("L-fx") };
const nodes = {};                  // item id → { g, front? }
const byId = (id) => state.items.find((it) => it.id === id);
const vessels = () => state.items.filter((it) => it.kind === "vessel");
const heaters = () => state.items.filter((it) => it.kind === "tool" && HEAT[it.key]);
const tools = (key) => state.items.filter((it) => it.kind === "tool" && it.key === key);
const collectors = () => state.items.filter((it) => it.kind === "tool" && COLLECT[it.key]);
/** The collector a delivery tube leads to: the nearest one. */
const collectorFor = (tube) => collectors().reduce((best, c) => (!best || Math.hypot(c.x - tube.x, c.y - tube.y) < Math.hypot(best.x - tube.x, best.y - tube.y) ? c : best), null);
const fittedTo = (v, key) => state.items.find((a) => a.on === v.id && (!key || a.key === key));
const inSlot = (host) => vessels().find((v) => v.rack && v.rack[0] === host.id);

function save() {
  readouts();
  drawLinks();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

function fitWorld() {
  const r = wrap.getBoundingClientRect();
  if (!r.width || !r.height) return;
  W = clamp(Math.round((H * r.width) / r.height), 520, 1800);
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  // the icons and the note float over the bench; on a phone they take a good part of it
  const k = H / r.height;
  TOP = Math.round(Math.max(200, (document.querySelector(".cl-bar").getBoundingClientRect().bottom - r.top) * k + 138));
  BASE = Math.round(clamp(($("cl-say").getBoundingClientRect().top - r.top) * k - 14, TOP + 180, 600));
  state.items.forEach((it) => { keepIn(it); place(it); });
  drawLinks();
}
function keepIn(it) {
  const b = boxOf(it);
  it.x = clamp(it.x, -b.x0 + 4, Math.max(-b.x0 + 4, W - b.x1 - 4));
  // a long tool (a pipette, a thermometer) may poke off the top of the bench: it has to reach into a bottle up there
  it.y = clamp(it.y, Math.min(it.kind === "tool" ? Math.min(-b.y0 + 4, 80) : -b.y0 + 4, H - 10), H - 10);
}
/** A pointer's place on the bench, in bench units. */
function world(e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function mount(it) {
  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", `cl-item cl-item--${it.kind}`);
  g.dataset.item = it.id;
  g.dataset.key = it.key;
  const node = (nodes[it.id] = { g });
  if (it.kind === "vessel") g.innerHTML = vesselSvg(it.key, it.id, it.tag);
  else if (it.kind === "reagent") { g.innerHTML = reagentSvg(it.key, it.id); g.dataset.rk = reagent(it.key).kind; }
  else if (it.kind === "tool") g.innerHTML = toolSvg(it.key);
  else {
    const r = supportSvg(it.key);
    g.innerHTML = r.back;
    node.front = document.createElementNS(NS, "g");
    node.front.setAttribute("class", "cl-item-front");
    node.front.innerHTML = r.front;
    L.front.appendChild(node.front);
  }
  // supports, the trough and the tall fixed sets go behind everything that can stand on or in front of them
  const behind = it.kind === "rack" || Boolean(COLLECT[it.key]) || (it.kind === "vessel" && VESSELS[it.key].fixed);
  (behind ? L.back : L.items).appendChild(g);
  place(it);
  if (it.kind === "vessel") paint(it);
  if (it.kind === "tool") dress(it);
}
function place(it, transform) {
  const n = nodes[it.id];
  if (!n) return;
  const t = transform || `translate(${it.x}px, ${it.y}px)`;
  n.g.style.transform = t;
  if (n.front) n.front.style.transform = t;
}
const paint = (it, opts = {}) => paintVessel(nodes[it.id].g, it.key, it.t, { seed: Number(it.id.slice(1)) + 1, ...opts });
function glide(it, on = true) {
  const n = nodes[it.id];
  if (!n) return;
  n.g.classList.toggle("is-gliding", on);
  if (n.front) n.front.classList.toggle("is-gliding", on);
}
/** A tool shows what it is carrying or holding. */
function dress(it) {
  const g = nodes[it.id] && nodes[it.id].g;
  if (!g) return;
  if (TAKES[it.key]) g.querySelector(".cl-drop-liq").style.fill = it.sample ? `rgba(${it.rgb || [200, 224, 240]},0.9)` : "transparent";
  if (it.key === "wire") g.querySelector(".cl-loop").style.fill = it.sample ? "#f2f6fb" : "transparent";
  if (it.key === "funnel") g.querySelector(".cl-residue").style.fill = it.residue ? `rgb(${it.residue})` : "transparent";
  if (COLLECT[it.key]) {
    const n = it.gas ? it.gas.n : 0, f = Math.min(1, n / COLLECT[it.key].cap);
    if (it.key === "trough") {
      const w = g.querySelector(".cl-jar-water");
      w.setAttribute("y", -194 + f * 140);
      w.setAttribute("height", 140 * (1 - f));
    } else if (it.key === "syringe") g.querySelector(".cl-plunger").style.transform = `translateX(${(f * 104).toFixed(1)}px)`;
    else g.querySelector(".cl-gasfill").setAttribute("fill-opacity", (f * 0.16).toFixed(3));
    g.querySelector(".cl-read").textContent = n || it.key === "syringe" ? `${Math.round(n * 12)} cm\u00b3` : "";
  }
}
/** The numbers that pieces show: a burette's reading, a still's thermometer, a balance. */
function readouts() {
  for (const it of state.items) {
    const g = nodes[it.id] && nodes[it.id].g;
    if (!g) continue;
    if (it.key === "burette") g.querySelector(".cl-read").textContent = it.t.vol > 0 ? `${((it.t.cap - it.t.vol) * 2).toFixed(2)} cm³` : "";
    else if (it.key === "still") g.querySelector(".cl-read").textContent = it.t.vol > 0 ? `${Math.round(it.t.temp ?? 25)} °C` : "";
    else if (it.key === "cell") g.querySelector(".cl-coat").setAttribute("fill", it.t.plated === "Cu" ? "#b9683e" : it.t.plated === "Ag" ? "#d9dde2" : "transparent");
    else if (it.kind === "rack" && it.key === "balance") {
      const v = inSlot(it);
      let m = 0;
      if (v) m = VESSELS[v.key].g + massOf(v.t) + (fittedTo(v, "funnel") ? 34 : 0) + (fittedTo(v, "bung") ? 6 : 0) + (fittedTo(v, "tubing") ? 14 : 0);
      it.gross = m;
      g.querySelector(".cl-lcd").textContent = `${(m - (it.tare || 0)).toFixed(2)} g`;
    }
  }
}

// ── what stands on what ─────────────────────────────────────────────────────
const mouth = (o) => (o.kind === "vessel" ? { x: o.x, y: o.y + VESSELS[o.key].top } : o.kind === "reagent" ? { x: o.x, y: o.y - mouthOf(o.key) } : COLLECT[o.key] ? { x: o.x + COLLECT[o.key].mouth[0], y: o.y + COLLECT[o.key].mouth[1] } : { x: o.x, y: o.y - 66 });
const rimOf = (o) => (o.kind === "vessel" ? VESSELS[o.key].rTop : o.kind === "reagent" ? 12 : COLLECT[o.key] ? COLLECT[o.key].rim : 50);
/** Everything with a slot a vessel can stand in: racks, stands, a balance, under a burette or a condenser. */
const hosts = () => state.items.filter((o) => o.kind === "rack" || (o.kind === "vessel" && VESSELS[o.key].slots));
const hostDef = (o) => (o.kind === "rack" ? SUPPORTS[o.key] : { slots: VESSELS[o.key].slots, fits: VESSELS[o.key].slotFits });
/** Whatever rides on `it`: vessels in its slots, things fitted into its mouth, and whatever rides on those. */
function ridersOf(it, out = []) {
  for (const o of state.items) {
    if (o === it || out.includes(o)) continue;
    if ((o.rack && o.rack[0] === it.id) || o.on === it.id) { out.push(o); ridersOf(o, out); }
  }
  return out;
}
/** `it` has been put somewhere by the page, not the hand: its riders go with it. */
function follow(it) {
  for (const o of state.items) {
    if (o.on === it.id) { const m = mouth(it); o.x = m.x; o.y = m.y; }
    else if (o.rack && o.rack[0] === it.id) { const [sx, sy] = hostDef(it).slots[o.rack[1]]; o.x = it.x + sx; o.y = it.y + sy; }
    else continue;
    glide(o, true);
    place(o);
    follow(o);
  }
}
/** A vessel let go near a free slot that fits it stands in the slot. */
function snap(it) {
  const def = VESSELS[it.key];
  for (const host of hosts()) {
    if (host === it) continue;
    const S = hostDef(host);
    if (!S.fits(def)) continue;
    const taken = new Set(vessels().filter((v) => v !== it && v.rack && v.rack[0] === host.id).map((v) => v.rack[1]));
    const slot = S.slots.findIndex(([sx, sy], i) => !taken.has(i) && Math.abs(it.x - (host.x + sx)) < 30 + def.rMax * 0.3 && Math.abs(it.y - (host.y + sy)) < 70);
    if (slot >= 0) { it.rack = [host.id, slot]; it.x = host.x + S.slots[slot][0]; it.y = host.y + S.slots[slot][1]; return true; }
  }
  return false;
}
/** The rubber tube from every fitted delivery tube to whatever it leads to. */
function drawLinks() {
  L.links.innerHTML = tools("tubing").filter((t) => t.on && nodes[t.id]).map((t) => {
    const c = collectorFor(t);
    if (!c) return "";
    const [ix, iy] = COLLECT[c.key].inlet;
    const a = { x: t.x + 30, y: t.y - 42 }, b = { x: c.x + ix, y: c.y + iy };
    const sag = Math.max(40, Math.abs(b.x - a.x) * 0.25);
    // into a trough the tube comes down from above; into the others it comes up from below, or in from the side
    const end = c.key === "trough" || c.key === "down" ? `${b.x} ${b.y - sag}` : c.key === "up" ? `${b.x} ${b.y + sag}` : `${b.x - sag} ${b.y}`;
    return `<path class="cl-link" d="M${a.x} ${a.y}C${a.x + sag} ${a.y - 10} ${end} ${b.x} ${b.y}"/>`;
  }).join("");
}

/** The next free letter for a vessel's label. */
function nextTag() {
  const used = new Set(vessels().map((v) => v.tag));
  for (let i = 0; i < 26; i++) { const c = String.fromCharCode(65 + i); if (!used.has(c)) return c; }
  return "?";
}
function overlaps(it, x, y) {
  const b = boxOf(it);
  return state.items.some((o) => {
    if (o === it) return false;
    const c = boxOf(o);
    return x + b.x0 < o.x + c.x1 + 6 && x + b.x1 > o.x + c.x0 - 6 && y + b.y0 < o.y + c.y1 && y + b.y1 > o.y + c.y0;
  });
}
/** Somewhere sensible that is not already taken. */
function freeSpot(it) {
  const b = boxOf(it);
  const rows = it.kind === "reagent" ? [TOP, TOP + 150, TOP + 295] : it.kind === "tool" ? [BASE, 460, 330] : [BASE, 430];
  for (const y of rows) for (let x = -b.x0 + 14; x < W - b.x1 - 4; x += 12) if (!overlaps(it, x, y)) return [x, y];
  return [W / 2 + (Math.random() - 0.5) * 200, 420];
}

function addItem(kind, key, x, y) {
  if (kind === "reagent") {
    const have = state.items.find((it) => it.kind === "reagent" && it.key === key);
    if (have) { flash(have); say(`${nameOf(have)} is already out on the bench.`, null, "no"); return null; }
  }
  const it = { id: `i${++state.n}`, kind, key, x: 0, y: 0 };
  if (kind === "vessel") { it.tag = nextTag(); it.t = newTube(VESSELS[key].cap); }
  state.items.push(it);
  [it.x, it.y] = x == null ? freeSpot(it) : [x, y];
  keepIn(it);
  mount(it);
  renderDrawer();
  $("cl-hint").hidden = true;
  return it;
}
function removeItem(it) {
  const n = nodes[it.id];
  n.g.remove();
  if (n.front) n.front.remove();
  delete nodes[it.id];
  state.items = state.items.filter((o) => o !== it);
  state.items.forEach((o) => { if (o.rack && o.rack[0] === it.id) o.rack = null; if (o.on === it.id) o.on = null; });
  if (selected === it) select(null);
  renderDrawer();
  $("cl-hint").hidden = state.items.length > 0;
  save();
}
function flash(it) {
  const g = nodes[it.id].g;
  g.classList.remove("is-flash");
  void g.getBoundingClientRect();
  g.classList.add("is-flash");
}

function clearBench() {
  Object.values(nodes).forEach((n) => { n.g.remove(); if (n.front) n.front.remove(); });
  for (const k of Object.keys(nodes)) delete nodes[k];
  state.items = [];
  L.fx.innerHTML = "";
  select(null);
}
/** Lay a set-up out across the bench as it is now. */
function layOut(p) {
  clearBench();
  const widthOf = (key) => VESSELS[key].bbox.x1 - VESSELS[key].bbox.x0 + 22;
  const row = (p.vessels || []).filter((k) => k[0] !== "@");
  const total = row.reduce((a, k) => a + widthOf(k), 0) + (p.stands || []).reduce((a, [s]) => a + SUPPORTS[s].bbox.x1 - SUPPORTS[s].bbox.x0 + 26, 0);
  // tall pieces (a burette, a still) stand to the right, clear of the row of bottles
  let right = p.tall ? Math.max(40, W - total - 24) : 40;
  const edge = p.tall ? Math.max(260, right - 16) : W - 10;
  const placed = [];
  if (p.rack) {
    const rack = addItem("rack", "rack", 180, BASE);
    SUPPORTS.rack.slots.slice(0, p.rack).forEach(([sx, sy], i) => {
      const v = addItem("vessel", "tube", rack.x + sx, rack.y + sy);
      v.rack = [rack.id, i];
    });
    right = rack.x + 190;
  }
  let prev = null;
  for (const entry of p.vessels || []) {
    if (entry[0] === "@") {
      const [sx, sy] = VESSELS[prev.key].slots[0];
      const v = addItem("vessel", entry.slice(1), prev.x + sx, prev.y + sy);
      v.rack = [prev.id, 0];
      placed.push(v);
      continue;
    }
    const b = VESSELS[entry].bbox;
    prev = addItem("vessel", entry, right - b.x0 + 6, BASE);
    placed.push(prev);
    right += widthOf(entry);
  }
  for (const [sup, key] of p.stands || []) {
    const b = SUPPORTS[sup].bbox;
    const host = addItem("rack", sup, right - b.x0 + 8, BASE);
    const [sx, sy] = SUPPORTS[sup].slots[0];
    const v = addItem("vessel", key, host.x + sx, host.y + sy);
    v.rack = [host.id, 0];
    right += b.x1 - b.x0 + 26;
  }
  for (const [key, i] of p.fit || []) {
    const m = mouth(placed[i]);
    const a = addItem("tool", key, m.x, m.y);
    a.on = placed[i].id;
  }
  let x = 56, y = TOP;
  for (const key of p.liquids) {
    const b = REAGENT_BOX[reagent(key).kind];
    if (x + b.x1 > edge) { x = 56; y += 150; }
    addItem("reagent", key, x, y);
    x += 82;
  }
  const wide = p.tools.reduce((a, key) => a + TOOLS[key].bbox.x1 - TOOLS[key].bbox.x0 + 22, 0);
  let tx = Math.max(right + 40, W - 30 - wide);
  for (const key of p.tools) {
    const b = TOOLS[key].bbox;
    // no room left along the bottom (a phone, or a tall set): it goes wherever there is a gap
    if (p.tall || tx + b.x1 - b.x0 > W - 6) { addItem("tool", key); continue; }
    addItem("tool", key, tx - b.x0, BASE);
    tx += b.x1 - b.x0 + 22;
  }
  $("cl-hint").hidden = state.items.length > 0;
  renderDrawer();
  save();
}

// ── the note that says what was just seen ───────────────────────────────────
function say(text, v = null, kind = "") {
  $("cl-say-tag").textContent = v ? nameOf(v) : "Chemistry bench";
  $("cl-say-text").textContent = text;
  const note = $("cl-say");
  note.classList.remove("is-new", "is-no");
  void note.offsetWidth;
  note.classList.add(kind === "no" ? "is-no" : "is-new");
}

/** Write an action down. Gas that came off goes wherever the vessel is piped to first. */
function record(v, res) {
  if (v.kind === "vessel") gasFlow(v, res);
  const last = state.log[0];
  const same = last && last.id === v.id && last.title === res.title && JSON.stringify(last.obs) === JSON.stringify(res.obs);
  if (same) last.times = (last.times || 1) + 1;
  else state.log.unshift({ id: v.id, tag: v.tag, title: res.title, obs: res.obs });
  state.log.length = Math.min(state.log.length, LOG_MAX);
  const fresh = tasksDone(res, v.t).filter((id) => !state.done.includes(id));
  state.done.push(...fresh);
  renderLog();
  renderTasks(fresh);
  say(res.obs.map((o) => o.text).join(" ") || `${res.title}.`, v.kind ? v : null);
  save();
}
function gasFlow(v, res) {
  const g = gasMade(res);
  if (!g) return;
  const bung = fittedTo(v, "bung");
  if (bung) {
    bung.on = null;
    bung.x = v.x + VESSELS[v.key].rMax + 34;
    bung.y = v.y;
    keepIn(bung);
    glide(bung, true);
    place(bung);
    res.obs.push({ text: "The gas pushes the stopper out.", why: "A gas takes up far more room than the solid and liquid it came from. Never stopper a vessel that is making a gas." });
    return;
  }
  const tube = fittedTo(v, "tubing");
  const c = tube && collectorFor(tube);
  if (!c) return;
  // each way of collecting suits some gases and not others
  if (c.key === "trough" && g.gas === "NH3") {
    res.obs.push({ text: "Nothing collects in the gas jar.", why: "Ammonia is very soluble in water, so it dissolves in the trough. Collect it in a dry, upturned tube instead." });
    return;
  }
  if (c.key === "up" && !LIGHT.includes(g.gas)) {
    res.obs.push({ text: "Nothing stays in the upturned tube.", why: `${cap1(GAS[g.gas])} is denser than air, so it falls straight out of an upturned tube. Collect it in a jar with its mouth up, or over water.` });
    return;
  }
  if (c.key === "down" && LIGHT.includes(g.gas)) {
    res.obs.push({ text: "Nothing stays in the jar.", why: `${cap1(GAS[g.gas])} is less dense than air, so it rises straight out of an open jar. Collect it in an upturned tube${g.gas === "H2" ? ", or over water" : ""}.` });
    return;
  }
  c.gas = { k: g.gas, n: Math.min(COLLECT[c.key].cap, (c.gas && c.gas.k === g.gas ? c.gas.n : 0) + g.n) };
  dress(c);
  const vol = Math.round(c.gas.n * 12);
  if (c.key === "trough") {
    bubble(nodes[c.id].g, "gasjar", { vol: 60, cap: 150 }, 1);
    nodes[c.id].g.querySelector(".cl-bubbles").setAttribute("transform", "translate(44 -20)");
    res.obs.push({ text: `Bubbles rise through the water into the gas jar: ${vol} cm\u00b3 collected.`, why: "Collection over water: the gas pushes the water down out of the jar. It works for gases that do not dissolve much." });
  } else if (c.key === "syringe") {
    res.obs.push({ text: `The plunger of the gas syringe is pushed out. It reads ${vol} cm\u00b3.`, why: "A gas syringe measures the volume of a gas directly, whatever the gas is." });
    res.flags.push("measured");
  } else if (c.key === "up") {
    res.obs.push({ text: "The gas rises into the upturned tube and pushes the air out at the bottom.", why: `Upward delivery: ${GAS[g.gas]} is less dense than air, so it collects at the top of the tube.` });
  } else {
    res.obs.push({ text: "The gas sinks into the jar and pushes the air out at the top.", why: `Downward delivery: ${GAS[g.gas]} is denser than air, so it collects at the bottom of the jar.` });
  }
  res.flags.push("collected");
}

// ── using one thing on another ──────────────────────────────────────────────
function nearest(list, score) {
  let best = null, bestD = Infinity;
  for (const o of list) { const d = score(o); if (d >= 0 && d < bestD) { best = o; bestD = d; } }
  return best;
}
/** What a carried thing is being held to, if anything. */
function targetOf(it) {
  if (it.kind === "rack") return null;
  if (it.kind === "vessel") {
    const def = VESSELS[it.key];
    if (def.fixed) return null;
    const h = heaters().find((b) => Math.abs(it.x - b.x) < 30 && Math.abs(it.y - (b.y - HEAT[b.key])) < 46);
    if (h) return h;
    if (isEmpty(it.t)) return null;
    const cy = it.y + def.top / 2;
    const tub = tools("waste").find((o) => Math.abs(it.x - o.x) < 84 && cy > o.y - 66 - 170 && cy < o.y - 20);
    if (tub) return tub;
    if (it.t.vol <= 0) return null;
    return nearest(vessels().filter((v) => v !== it), (v) => {
      const m = mouth(v), dx = Math.abs(it.x - m.x);
      return dx < VESSELS[v.key].rTop + def.rMax + 16 && cy > m.y - 170 && cy < m.y + 30 ? dx : -1;
    });
  }
  if (it.kind === "reagent") {
    const b = boxOf(it), cy = it.y + (b.y0 + b.y1) / 2;
    return nearest(vessels(), (v) => {
      const m = mouth(v), dx = Math.abs(it.x - m.x);
      return dx < VESSELS[v.key].rTop + 48 && cy > m.y - 160 && cy < m.y + 46 ? dx : -1;
    });
  }
  // ── tools ──
  if (IDLE.includes(it.key)) return null;
  if (STAYS.includes(it.key)) {
    return nearest(vessels().filter((v) => v.key !== "burette" && !fittedTo(v)), (v) => {
      const m = mouth(v), dx = Math.abs(it.x - m.x);
      return dx < VESSELS[v.key].rTop + 34 && Math.abs(it.y - m.y) < 64 ? dx : -1;
    });
  }
  if (it.key === "wire" && it.sample) {
    return nearest(heaters(), (b) => {
      const dx = Math.abs(it.x - 34 - b.x), dy = Math.abs(it.y - 58 - (b.y - HEAT[b.key] + 26));
      return dx < 30 && dy < 60 ? dx : -1;
    });
  }
  if (HEAT[it.key]) {
    return nearest(vessels(), (v) => {
      const def = VESSELS[v.key], foot = v.y - (def.lift || 0), dx = Math.abs(it.x - v.x), tip = it.y - HEAT[it.key];
      return v.key !== "burette" && dx < Math.min(def.rMax, 60) + 26 && tip > foot - 84 && tip < foot + 90 ? dx : -1;
    });
  }
  // what is offered to: vessels always; the gas jar to splints and litmus; a bottle to an empty dropper or pipette
  const list = [...vessels()];
  if (MOUTH.includes(it.key) || it.key === "red" || it.key === "blue") list.push(...collectors().filter((c) => COLLECT[c.key].test));
  if (TAKES[it.key] && !it.sample) list.push(...state.items.filter((o) => o.kind === "reagent" && reagent(o.key).kind === "solution"));
  const atTip = MOUTH.includes(it.key) || it.key === "wire";
  return nearest(list, (o) => {
    const m = mouth(o), r = rimOf(o);
    if (atTip) { const dx = Math.abs(it.x - 34 - m.x), tip = it.y - 58; return dx < r + 32 && tip > m.y - 80 && tip < m.y + 60 ? dx : -1; }
    const dx = Math.abs(it.x - m.x);
    return dx < r + 28 && it.y > m.y - 46 && it.y < m.y + 110 ? dx : -1;
  });
}
const tipping = (it, at) => `translate(${at.x + 6}px, ${at.y - 10}px) rotate(-108deg) translate(0px, ${it.kind === "vessel" ? -VESSELS[it.key].top : mouthOf(it.key)}px)`;

/** How a thing is held while it is being used on `v`. */
function poseOn(it, v) {
  const m = mouth(v);
  if (it.kind === "vessel") return HEAT[v.key] ? `translate(${v.x}px, ${v.y - HEAT[v.key]}px)` : tipping(it, m);
  if (it.kind === "reagent") return reagent(it.key).kind === "indicator" ? `translate(${m.x}px, ${m.y - 24}px)` : tipping(it, m);
  if (STAYS.includes(it.key)) return `translate(${m.x}px, ${m.y}px)`;
  if (HEAT[it.key]) return `translate(${v.x}px, ${Math.min(v.y - (VESSELS[v.key].lift || 0) + HEAT[it.key], H - 8)}px)`;
  if (it.key === "wire" && v.kind === "tool") return `translate(${v.x + 34}px, ${v.y - HEAT[v.key] + 26 + 58}px)`;
  const deep = v.kind === "vessel" ? Math.min((-VESSELS[v.key].top - (VESSELS[v.key].floor || 0)) * 0.62, 96) : v.kind === "reagent" ? 52 : 14;
  if (MOUTH.includes(it.key)) return `translate(${m.x + 34}px, ${m.y + 54}px)`;
  if (it.key === "wire") return `translate(${m.x + 34}px, ${m.y + 58 + deep}px)`;
  if (it.key === "thermo" || it.key === "meter") return `translate(${m.x}px, ${m.y + deep}px)`;
  if (TAKES[it.key]) return `translate(${m.x}px, ${m.y + (it.sample ? -4 : deep)}px)`;
  return `translate(${m.x}px, ${m.y + 18}px)`;
}

function fx(html, ms = 900) {
  const g = document.createElementNS(NS, "g");
  g.innerHTML = html;
  L.fx.appendChild(g);
  setTimeout(() => g.remove(), ms);
}
const stream = (m, to, c) => fx(`<rect class="cl-stream" x="${m.x + 3.5}" y="${m.y - 10}" width="5" height="${Math.max(24, to - m.y + 10)}" rx="2.5" fill="rgba(${c},0.85)"/>`, 720);
const drops = (from, to, c, r = 2.6, spread = 0) => fx([0, 1, 2].map((k) => `<circle class="cl-dropin" cx="${from[0] + (k - 1) * spread}" cy="${from[1]}" r="${r}" fill="rgb(${c})" style="--fall:${Math.round(to - from[1])}px;animation-delay:${k * 0.13}s"/>`).join(""), 1000);

/** How much goes in at a time: a few drops, or a twelfth of what the vessel holds. */
const measure = (v) => (state.dose === "drops" ? 0.25 : Math.max(1, VESSELS[v.key].cap / 12));
/** A plain stopper is in the way. (A delivery tube's stopper has a second hole, for a funnel.) */
function stoppered(v) {
  if (!fittedTo(v, "bung")) return false;
  say("Take the stopper out first.", v, "no");
  return true;
}
/**
 * Put a sample of liquid into vessel v — through the filter paper, if a funnel is sitting in it.
 * Returns the result (already painted and written down), or null if it would not go in.
 */
function deliver(v, s, from, c, flag) {
  if (roomIn(v.t) < s.vol - 1e-6) { say("It is full. Empty it, or use another one.", v, "no"); return null; }
  const funnel = fittedTo(v, "funnel");
  const residue = funnel ? filterOut(s) : [];
  const res = pourIn(v.t, s, from);
  if (flag) res.flags.push(flag);
  if (residue.length) {
    const big = residue.reduce((a, b) => (b.n > a.n ? b : a));
    funnel.residue = big.rgb;
    dress(funnel);
    res.obs.unshift({ text: `${cap1(big.colour)} solid is left behind in the filter paper. The liquid that runs through is clear.`, why: `Filtration: the residue is ${big.name}, {${big.formula}}, which is insoluble and too big to pass through the paper. What runs through is the filtrate.` });
    res.obs = res.obs.filter((o) => o.text !== "No visible change.");
    res.flags.push("filtered");
  }
  const painted = paint(v, { fresh: res.flags.some((f) => f.startsWith("ppt:")) });
  if (res.flags.some((f) => f.startsWith("gas:"))) bubble(nodes[v.id].g, v.key, v.t);
  if (c) v._surface = v.y - Math.max(painted.level, 10);
  record(v, res);
  return res;
}

/**
 * Do the thing: `it` on `v`. Returns true when holding it there should do it again
 * (a bottle goes on pouring), false when once is all there is.
 */
function use(it, v) {
  // ── a vessel is the thing being carried ──
  if (it.kind === "vessel") {
    if (HEAT[v.key]) return warm(v, it);
    if (v.key === "waste") {
      const res = rinse(it.t);
      nodes[it.id].g.querySelector(".cl-bubbles").innerHTML = "";
      paint(it);
      record(it, { ...res, title: "Poured into the waste tub" });
      return false;
    }
    if (stoppered(v)) return false;
    const n = Math.min(measure(v), it.t.vol);
    if (n <= 0) return false;
    if (roomIn(v.t) < n - 1e-6) { say("It is full. Empty it, or use another one.", v, "no"); return false; }
    const c = look(it.t).rgb;
    const res = deliver(v, takeFrom(it.t, n), plain(it), c);
    paint(it);
    if (res) stream(mouth(v), v._surface, c);
    save();
    return Boolean(res) && it.t.vol > 0;
  }
  // ── the wire, in a flame ──
  if (it.key === "wire" && v.kind === "tool") {
    const f = it.sample.f;
    const g = nodes[v.id].g;
    if (f) {
      g.style.setProperty("--flame", `rgb(${f.rgb})`);
      g.classList.add("is-coloured");
      setTimeout(() => g.classList.remove("is-coloured"), 2600);
    }
    const from = byId(it.sample.vid) || { id: "gone", tag: it.sample.tag, t: newTube() };
    record(from, {
      title: "Flame test",
      obs: [f ? { text: `The flame turns ${f.name}.`, why: `${cap1(f.metal)} ions colour a flame ${f.name}.` } : { text: "The flame does not change colour.", why: "None of the metal ions in this liquid colours a flame." }],
      flags: f ? [`flame:${f.ion}`] : [],
    });
    it.sample = null;
    dress(it);
    return false;
  }
  // ── a splint or litmus at the gas jar ──
  if (COLLECT[v.key]) {
    const jar = { ...newTube(), gas: v.gas ? v.gas.k : null };
    const where = COLLECT[v.key].name;
    const res = test(jar, it.key);
    if (res.refused) { say(`There is no gas in the ${where} to test yet.`, v, "no"); return false; }
    showTest(it, res);
    if (!jar.gas && v.gas) { v.gas = null; dress(v); }       // hydrogen is burnt in the test
    res.flags.push(`at:${v.key}`);
    record({ ...v, tag: v.key === "up" ? "tube" : "jar", t: jar }, { ...res, title: res.title.replace("at the mouth", `at the ${where}`) });
    return false;
  }
  // ── a dropper or pipette, filling from a bottle ──
  if (v.kind === "reagent") {
    it.sample = sampleOf(v.key, TAKES[it.key]);
    it.rgb = colourOf(v.key);
    dress(it);
    say(`The ${nameOf(it).replace(/ \(.*/, "").toLowerCase()} is holding ${cm3(TAKES[it.key])} of ${reagent(v.key).name}. Carry it to a vessel.`);
    save();
    return false;
  }

  const node = nodes[v.id].g;
  const m = mouth(v);
  if (it.kind === "reagent") {
    if (stoppered(v)) return false;
    const r = reagent(it.key);
    const res = add(v.t, it.key, r.kind === "solution" ? measure(v) : state.dose);
    if (res.refused) { say(res.refused, v, "no"); return false; }
    const painted = paint(v, { fresh: res.flags.some((f) => f.startsWith("ppt:")) });
    const c = colourOf(it.key);
    const surface = v.y - Math.max(painted.level, 10);
    if (r.kind === "solution") stream(m, surface, c);
    else if (r.kind === "indicator") drops([m.x, m.y - 26], surface, c);
    else drops([m.x + 6, m.y - 10], surface, c, 3.4, 5);
    if (res.flags.some((f) => f.startsWith("gas:"))) bubble(node, v.key, v.t, res.flags.includes("gas:O2") ? 1.8 : 1);
    record(v, res);
    return r.kind !== "indicator";
  }
  if (HEAT[it.key]) return warm(it, v);

  if (TAKES[it.key]) {
    const what = nameOf(it).replace(/ \(.*/, "").toLowerCase();
    if (!it.sample) {
      const c = look(v.t).rgb;
      const s = takeFrom(v.t, TAKES[it.key]);
      if (!s) { say("There is no liquid in there to draw up.", v, "no"); return false; }
      it.sample = s;
      it.rgb = c;
      dress(it);
      paint(v);
      say(`The ${what} is holding ${cm3(s.vol)} of the liquid from ${plain(v)}. Carry it to another vessel.`, v);
      save();
      return false;
    }
    if (stoppered(v)) return false;
    const c = it.rgb || [200, 224, 240];
    const res = deliver(v, it.sample, `the ${what}`, c);
    if (!res) return false;
    drops([m.x, m.y - 2], v._surface, c);
    it.sample = null;
    dress(it);
    save();
    return false;
  }
  if (it.key === "wire") {
    if (v.t.vol <= 0) { say("There is no liquid in there to dip the wire in.", v, "no"); return false; }
    it.sample = { f: flameOf(v.t), vid: v.id, tag: v.tag };
    dress(it);
    say(`The wire has a little of the liquid from ${plain(v)} on it. Hold it in a burner flame.`, v);
    save();
    return false;
  }

  const res = test(v.t, it.key);
  if (res.refused) { say(res.refused, v, "no"); return false; }
  showTest(it, res);
  paint(v);
  record(v, res);
  return false;
}
/** A test tool shows its answer: the splint flares, the paper turns, the meter reads. */
function showTest(it, res) {
  const g = nodes[it.id].g;
  const [, a, b] = res.fx.split("-");
  if (MOUTH.includes(it.key)) { g.querySelector(".cl-after").innerHTML = splintAfter(res.fx); g.dataset.end = res.fx; }
  else if (it.key === "ph") g.querySelector(".cl-paper").style.fill = `rgb(${a})`;
  else if (it.key === "meter") g.querySelector(".cl-lcd").textContent = a;
  else if (it.key === "thermo") { const len = 22 + Number(a) * 1.1; const col = g.querySelector(".cl-merc"); col.setAttribute("y", -4 - len); col.setAttribute("height", len); }
  else g.dataset.end = b;
}
/** Heat a vessel. A still sends water over; a dish boils down to crystals. Returns true to go on heating. */
function warm(heater, v) {
  const def = VESSELS[v.key];
  const res = heat(v.t);
  if (res.refused) { say(res.refused, v, "no"); return false; }
  let more = false;
  if (def.still) {
    res.obs = res.obs.filter((o) => !/No other change/.test(o.text));
    const recv = inSlot(v);
    if (!recv) res.obs.push({ text: "The liquid boils, and drops fall from the end of the condenser onto the bench. Stand a flask under it to catch them." });
    else if (roomIn(recv.t) < 1) res.obs.push({ text: `${cap1(plain(recv))} is full. Empty it before you distil any more.` });
    else {
      const coloured = look(v.t).name !== "colourless";
      const w = boilOff(v.t, Math.min(def.cap * 0.1, roomIn(recv.t)));
      if (w.gone > 0) {
        const s = newTube(w.gone);
        s.vol = w.gone;
        s.temp = 40;
        v.t.temp = 100;
        pourIn(recv.t, s, "the condenser");
        paint(recv);
        drops([v.x + 262, v.y - 170], recv.y - 12, [200, 224, 240]);
        res.obs = res.obs.filter((o) => !/No other change/.test(o.text));
        res.obs.push({ text: `The liquid boils at 100 °C. Clear, colourless drops run down the condenser into ${plain(recv)}.`, why: "Distillation: the water boils off as steam and the cold condenser turns it back to liquid. Whatever was dissolved stays behind in the flask, more concentrated than before." });
        if (coloured) res.flags.push("distilled");
        more = true;
      } else res.obs.push({ text: "Stop heating: the flask must not boil dry." });
    }
  } else if (def.material === "porcelain" || v.key === "watch") {
    const w = boilOff(v.t, Math.max(1, def.cap * 0.3), { dry: true });
    res.obs = res.obs.filter((o) => !/No other change/.test(o.text));
    if (w.dried) {
      res.obs.push(w.colour ? { text: `The last of the water boils away. ${cap1(w.colour)} crystals are left behind.`, why: "Evaporation: only the water leaves. The dissolved salt cannot boil off, so it is left as a solid." } : { text: "The water boils away and nothing is left behind.", why: "There was nothing dissolved in it." });
      if (w.colour) res.flags.push("crystals");
    } else if (w.gone > 0) { res.obs.push({ text: "The liquid boils and there is less of it." }); more = true; }
  }
  paint(v);
  bubble(nodes[v.id].g, v.key, v.t, res.flags.some((f) => f.startsWith("gas:")) ? 1.3 : 0.5);
  record(v, res);
  return more;
}
/** A splint, a paper or a meter back to how it was, for the next test. */
function resetTool(it) {
  const g = nodes[it.id] && nodes[it.id].g;
  if (!g) return;
  delete g.dataset.end;
  const q = (s) => g.querySelector(s);
  if (q(".cl-after")) q(".cl-after").innerHTML = "";
  if (it.key === "ph") q(".cl-paper").style.fill = "";
  if (it.key === "meter") q(".cl-lcd").textContent = "--.-";
  if (it.key === "thermo") { q(".cl-merc").setAttribute("y", -53); q(".cl-merc").setAttribute("height", 49); }
}

// ── things that are pressed: a tap, a balance's tare key, a power switch ─────
let tap = null;
function runTap(bur) {
  const sep = bur.key === "sepfunnel";
  const v = inSlot(bur) || nearest(vessels().filter((o) => o !== bur && !VESSELS[o.key].fixed), (o) => {
    const dx = Math.abs(o.x - bur.x);
    return dx < VESSELS[o.key].rTop + 6 && Math.abs(o.y - bur.y) < 40 && -VESSELS[o.key].top <= 164 ? dx : -1;
  });
  if (isEmpty(bur.t)) { say(sep ? "The separating funnel is empty. Pour the mixture in at the top." : "The burette is empty. Fill it from a bottle: carry the bottle to the top.", bur, "no"); return false; }
  if (!v) { say(`Stand a beaker or a flask under the ${sep ? "funnel" : "burette"} first.`, bur, "no"); return false; }
  if (sep) {
    const n = state.dose === "drops" ? 0.25 : 1.5;
    if (roomIn(v.t) < n) { say("It is full. Stand an empty beaker under the funnel.", v, "no"); return false; }
    const out = takeBottom(bur.t, n);
    const c = out.layer === "oil" ? [232, 200, 90] : out.s.vol > 0 ? look(out.s).rgb : [200, 224, 240];
    const res = deliver(v, out.s, "the separating funnel", c);
    if (!res) return false;
    paint(bur);
    drops([bur.x, bur.y - 164], v._surface, c, 2.4);
    if (out.last) {
      const done = { title: "Ran off the lower layer", obs: [{ text: "The last of the lower layer has run out. Only the oil is left in the funnel.", why: "The two liquids do not mix, and the denser one sinks. Running it out through the tap leaves the other behind: that is how a separating funnel separates them." }], flags: ["separated"] };
      record(bur, done);
      return false;                                         // the tap is closed at the boundary
    }
    save();
    return true;
  }
  const n = Math.min(state.dose === "drops" ? 1 / 16 : 0.5, bur.t.vol);
  if (n <= 0) { say("There is only oil in the burette. Empty it.", bur, "no"); return false; }
  if (roomIn(v.t) < n - 1e-6) { say("The flask is full. Empty it, or use another one.", v, "no"); return false; }
  const c = look(bur.t).rgb;
  const res = deliver(v, takeFrom(bur.t, n), "the burette", c, "by:burette");
  if (!res) return false;
  paint(bur);
  drops([bur.x, bur.y - 162], v._surface, c, 2.2);
  const seen = res.obs.map((o) => o.text).filter((t) => t !== "No visible change.").join(" ");
  say(`${seen ? `${seen} ` : ""}The burette reads ${((bur.t.cap - bur.t.vol) * 2).toFixed(2)} cm\u00b3.`, v);
  save();
  return true;
}
/** One moment of current through the electrolysis cell. */
function runCell(cell) {
  const res = electrolyse(cell.t, Math.max(0.5, cell.t.vol / 20));
  if (res.refused) { say(res.refused, cell, "no"); return false; }
  paint(cell);
  if (res.flags.length) bubble(nodes[cell.id].g, "cell", cell.t, 1.4);
  record(cell, res);
  return res.flags.length > 0;
}
/** A press on something that is not carried. Returns true if it was one. */
function press(e, it) {
  const key = e.target.closest("[data-press]");
  if (e.target.closest(".cl-tap")) { startTap(it, runTap); return true; }
  if (!key) return false;
  if (key.dataset.press === "power") { startTap(it, runCell, 900); return true; }
  if (key.dataset.press === "tare") {
    select(null);
    it.tare = it.gross && Math.abs((it.tare || 0) - it.gross) > 1e-9 ? it.gross : 0;
    save();
    say(it.tare ? "Tared: the balance reads zero with this on the pan. What you add now is weighed on its own." : "The balance is back to reading everything on the pan.");
    return true;
  }
  return false;
}
function startTap(bur, run, every) {
  select(null);
  nodes[bur.id].g.classList.add("is-open");
  const go = () => { if (!run(bur)) return stopTap(); tap.timer = setTimeout(go, every || (state.dose === "drops" ? 240 : 320)); };
  tap = { bur, timer: null };
  go();
}
function stopTap() {
  if (!tap) return;
  clearTimeout(tap.timer);
  nodes[tap.bur.id] && nodes[tap.bur.id].g.classList.remove("is-open");
  tap = null;
}

// ── hands ───────────────────────────────────────────────────────────────────
let drag = null;
let selected = null;
let tileDrag = null;
let swallow = false;

function startDrag(it, e, fromDrawer = false) {
  const w = world(e);
  drag = {
    it, fromDrawer, cx: e.clientX, cy: e.clientY, dx: fromDrawer ? 0 : it.x - w.x, dy: fromDrawer ? -(boxOf(it).y0 / 2) : it.y - w.y,
    sx: it.x, sy: it.y, rack: it.rack || null, on: it.on || null, moved: fromDrawer, used: false, sits: false, over: null, timer: null,
    riders: ridersOf(it),
  };
  const behind = it.kind === "rack" || Boolean(COLLECT[it.key]) || (it.kind === "vessel" && VESSELS[it.key].fixed);
  if (!behind) (it.kind === "vessel" ? L.items : L.fx).appendChild(nodes[it.id].g);
  glide(it, false);
  drag.riders.forEach((v) => glide(v, false));
}
function leave() {
  if (!drag || !drag.over) return;
  clearTimeout(drag.timer);
  nodes[drag.it.id].g.classList.remove("is-using");
  nodes[drag.over.id].g.classList.remove("is-target");
  if (drag.over.kind === "vessel") place(drag.over);
  drag.over = null;
  drag.sits = false;
  drag.go = null;
}
function enter(target) {
  const { it } = drag;
  drag.over = target;
  // some things, once put there, stay: a vessel over a flame, a funnel or stopper in a mouth
  drag.sits = (it.kind === "vessel" && Boolean(HEAT[target.key])) || STAYS.includes(it.key);
  glide(it, true);
  if (!drag.sits) nodes[it.id].g.classList.add("is-using");
  nodes[target.id].g.classList.add("is-target");
  place(it, poseOn(it, target));
  if (STAYS.includes(it.key)) return;
  if (HEAT[it.key]) {
    // no room under it: the vessel is lifted into the flame instead
    const foot = target.y - (VESSELS[target.key].lift || 0);
    const lift = foot + HEAT[it.key] - Math.min(foot + HEAT[it.key], H - 8);
    if (lift > 0) { glide(target, true); place(target, `translate(${target.x}px, ${target.y - lift}px)`); }
  }
  const go = () => {
    if (!drag || drag.over !== target) return;
    drag.used = true;
    const more = use(it, target);
    if (more && drag && drag.over === target) drag.timer = setTimeout(go, state.dose === "drops" ? 520 : 780);
  };
  drag.go = go;
  drag.wait = (it.kind === "vessel" && HEAT[target.key]) || HEAT[it.key] ? 900 : 420;
  drag.timer = setTimeout(go, drag.wait);
}

svg.addEventListener("pointerdown", (e) => {
  if (e.button > 0) return;
  const g = e.target.closest("[data-item]");
  if (!g) return select(null);
  e.preventDefault();
  if (press(e, byId(g.dataset.item))) return;
  startDrag(byId(g.dataset.item), e);
});

window.addEventListener("pointermove", (e) => {
  if (tileDrag && !drag) return tileMove(e);
  if (!drag) return;
  const { it } = drag;
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.cx, e.clientY - drag.cy) < 5) return;
    drag.moved = true;
    select(null);
    if (it.kind === "tool") resetTool(it);
  }
  const w = world(e);
  const ox = it.x, oy = it.y;
  it.x = w.x + drag.dx;
  it.y = w.y + drag.dy;
  keepIn(it);
  for (const v of drag.riders) { v.x += it.x - ox; v.y += it.y - oy; place(v); }
  if (it.kind === "vessel") it.rack = null;
  if (it.on) it.on = null;

  const target = targetOf(it);
  if (target !== drag.over) {
    leave();
    if (target) enter(target);
  }
  if (!drag.over) { glide(it, false); place(it); }
  else if (!drag.used && drag.go) {
    // still on the way past: nothing happens until the hand has come to rest
    clearTimeout(drag.timer);
    drag.timer = setTimeout(drag.go, drag.wait);
  }
  drawLinks();
});

window.addEventListener("pointerup", (e) => {
  stopTap();
  if (tileDrag && !drag) { tileDrag = null; document.body.classList.remove("cl-dragging"); return; }
  if (!drag) return;
  const d = drag;
  const { it } = d;
  clearTimeout(d.timer);
  drag = null;
  tileDrag = null;
  document.body.classList.remove("cl-dragging");

  if (d.fromDrawer) {
    const r = wrap.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return removeItem(it);
  }
  if (!d.moved) return select(it);

  const fits = STAYS.includes(it.key);
  if (d.over && !d.used && !fits) { d.used = true; use(it, d.over); }         // let go at once: that is one measure
  if (d.over) {
    const o = d.over;
    nodes[o.id].g.classList.remove("is-target");
    if (o.kind === "vessel") setTimeout(() => nodes[o.id] && place(o), HEAT[it.key] ? 1100 : 0);   // set back down once the burner has gone
  }
  nodes[it.id].g.classList.remove("is-using");
  const front = () => { if (nodes[it.id] && nodes[it.id].g.parentNode === L.fx) L.items.appendChild(nodes[it.id].g); };

  if (d.sits && fits) {
    // fitted into the mouth, and left there
    const m = mouth(d.over);
    it.on = d.over.id;
    it.x = m.x;
    it.y = m.y;
    front();
    glide(it, true);
    place(it);
    say(it.key === "funnel" ? `The funnel and its filter paper are in ${plain(d.over)}. Whatever is poured in now is filtered.`
      : it.key === "tubing" ? (collectors().length ? `${cap1(plain(d.over))} is piped to the ${COLLECT[collectorFor(it).key].name}. Any gas it makes from now on goes there.` : `The delivery tube is in ${plain(d.over)}. Put a gas jar, a gas syringe or a collecting tube on the bench.`)
      : `${cap1(plain(d.over))} is stoppered.`, d.over);
  } else if (d.sits) {
    // a vessel left over a flame stays there
    it.x = d.over.x;
    it.y = d.over.y - HEAT[d.over.key];
    glide(it, true);
    place(it);
    follow(it);
  } else if (d.used) {
    // it was used: back to where it stands
    setTimeout(() => {
      if (!nodes[it.id]) return;
      it.x = d.sx; it.y = d.sy; it.rack = d.rack;
      if (d.fromDrawer) [it.x, it.y] = freeSpot(it);
      front();
      glide(it, true);
      place(it);
      follow(it);
      save();
      if (it.kind === "tool") setTimeout(() => resetTool(it), 2200);
    }, it.kind === "tool" ? 1100 : 380);
  } else {
    if (it.kind === "vessel" && !VESSELS[it.key].fixed && snap(it)) glide(it, true);
    front();
    place(it);
    follow(it);
  }
  save();
});
window.addEventListener("pointercancel", () => {
  stopTap();
  if (!drag) return;
  clearTimeout(drag.timer);
  nodes[drag.it.id].g.classList.remove("is-using");
  if (drag.over) nodes[drag.over.id].g.classList.remove("is-target");
  place(drag.it);
  drag = null;
});

// ── the little menu beside a chosen piece ───────────────────────────────────
function select(it) {
  if (selected && nodes[selected.id]) nodes[selected.id].g.classList.remove("is-sel");
  selected = it;
  const menu = $("cl-menu");
  if (!it) { menu.hidden = true; return; }
  nodes[it.id].g.classList.add("is-sel");
  let holds = "", can = false;
  if (it.kind === "vessel") {
    can = !isEmpty(it.t);
    holds = can ? `Holds ${it.t.vol > 0 ? `${cm3(it.t.vol)}: ` : ""}${esc(it.t.added.map((id) => reagent(id).name).join(", "))}.` : "Empty.";
    if (it.key === "burette") holds += " Press the blue tap to run it out. Hold it down to keep it running.";
    if (it.key === "sepfunnel") holds += " Press the blue tap to run out the lower layer. It stops by itself when that layer has gone.";
    if (it.key === "cell") holds += " Pour a solution in, then hold down the red switch to pass a current.";
    if (it.key === "still") holds += " Fill the flask, stand a receiver under the condenser, and put a burner underneath.";
  } else if (it.sample) { can = true; holds = it.key === "wire" ? "Dipped, ready for the flame." : `Holding ${cm3(it.sample.vol)} of liquid.`; }
  else if (it.key === "syringe") { can = Boolean(it.gas); holds = it.gas ? `${Math.round(it.gas.n * 12)} cm\u00b3 of gas in the syringe.` : "Pipe a flask to it with the delivery tube. The plunger moves out as gas is made."; }
  else if (it.key === "up" || it.key === "down") { can = Boolean(it.gas); holds = it.gas ? "There is gas in it. Test it with a splint or damp litmus." : it.key === "up" ? "For gases less dense than air (hydrogen, ammonia). Pipe a flask to it with the delivery tube." : "For gases denser than air (carbon dioxide, oxygen). Pipe a flask to it with the delivery tube."; }
  else if (it.key === "trough") { can = Boolean(it.gas); holds = it.gas ? `${Math.round(it.gas.n * 12)} cm³ of gas in the jar. Test it with a splint.` : "The jar is full of water. Pipe a stoppered flask to it with the delivery tube."; }
  else if (it.key === "funnel") { can = Boolean(it.residue); holds = it.residue ? "There is residue in the filter paper." : "A clean filter paper. Put it in the mouth of a flask."; }
  else if (it.key === "balance") holds = "Stand a vessel on the pan. Press the red T to tare: the reading goes to zero, so what you add next is weighed alone.";
  else if (it.key === "tripod") holds = "Stand a beaker or a dish on the gauze, and a burner underneath.";
  else if (it.key === "stand") holds = "Let a tube or flask go at the clamp and it is held there, with room for a burner underneath.";
  const tip = it.kind === "vessel" ? "Empty and rinse it" : it.key === "funnel" ? "Fresh filter paper" : "Empty it";
  menu.innerHTML = `<p class="cl-menu__name">${esc(nameOf(it))}</p>${holds ? `<p class="cl-menu__holds">${holds}</p>` : ""}
    <div class="cl-menu__row">
      ${can ? `<button type="button" class="cl-ico cl-ico--paper" data-act="empty" data-tip="${tip}" aria-label="${tip}">${ICON.empty}</button>` : ""}
      <button type="button" class="cl-ico cl-ico--paper" data-act="remove" data-tip="Put it away" aria-label="Put it away">${ICON.away}</button>
    </div>`;
  menu.hidden = false;
  const r = nodes[it.id].g.querySelector(".cl-hit").getBoundingClientRect();
  const w = wrap.getBoundingClientRect();
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  let left = r.right - w.left + 10;
  if (left + mw > w.width - 8) left = r.left - w.left - mw - 10;
  menu.style.left = `${clamp(left, 8, w.width - mw - 8)}px`;
  menu.style.top = `${clamp(r.top - w.top, 60, w.height - mh - 8)}px`;
}
$("cl-menu").addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b || !selected) return;
  const it = selected;
  if (b.dataset.act === "remove") return removeItem(it);
  if (it.kind === "vessel") {
    const res = rinse(it.t);
    nodes[it.id].g.querySelector(".cl-bubbles").innerHTML = "";
    paint(it);
    record(it, res);
  } else {
    it.sample = null;
    it.gas = null;
    it.residue = null;
    dress(it);
    save();
  }
  select(it);
});

// ── the drawer ──────────────────────────────────────────────────────────────
function renderDrawer() {
  const q = $("cl-search").value.trim().toLowerCase();
  const out = new Set(state.items.filter((it) => it.kind === "reagent").map((it) => it.key));
  const list = CATALOG.filter((c) => (q ? `${c.name} ${c.kind === "reagent" ? reagent(c.key).formula : ALSO[c.key] || ""}`.toLowerCase().includes(q) : c.cat === state.cat));
  $("cl-rail").innerHTML = CATS.map((c) =>
    `<button type="button" class="cl-cat${!q && c.id === state.cat ? " is-on" : ""}" data-cat="${c.id}" aria-pressed="${!q && c.id === state.cat}"><svg viewBox="0 0 24 24" aria-hidden="true">${c.icon}</svg><span>${c.label}</span></button>`
  ).join("");
  $("cl-grid").innerHTML = list.length
    ? list.map((c) => {
        const used = c.kind === "reagent" && out.has(c.key);
        return `<button type="button" class="cl-tile${used ? " is-out" : ""}" data-kind="${c.kind}" data-key="${c.key}" aria-label="${esc(c.name)}${used ? " (on the bench)" : ""}">${thumb(c.kind, c.key)}<span>${esc(c.name)}</span></button>`;
      }).join("")
    : `<p class="cl-none">Nothing in the drawer by that name.</p>`;
}
$("cl-rail").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  state.cat = b.dataset.cat;
  $("cl-search").value = "";
  renderDrawer();
  $("cl-grid").scrollTop = 0;
  save();
});
$("cl-search").addEventListener("input", renderDrawer);

// a tile: tap to put the piece out; with a mouse, drag it to where it should stand
$("cl-grid").addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".cl-tile");
  if (!b || e.pointerType === "touch" || e.button !== 0) return;
  tileDrag = { kind: b.dataset.kind, key: b.dataset.key, x: e.clientX, y: e.clientY };
});
function tileMove(e) {
  if (Math.hypot(e.clientX - tileDrag.x, e.clientY - tileDrag.y) < 8) return;
  const r = wrap.getBoundingClientRect();
  if (e.clientX > r.right || e.clientX < r.left) { document.body.classList.add("cl-dragging"); return; }
  const w = world(e);
  const it = addItem(tileDrag.kind, tileDrag.key, w.x, w.y);
  if (!it) { tileDrag = null; document.body.classList.remove("cl-dragging"); return; }
  swallow = true;
  startDrag(it, e, true);
}
$("cl-grid").addEventListener("click", (e) => {
  const b = e.target.closest(".cl-tile");
  if (swallow) { swallow = false; return; }
  if (!b) return;
  const it = addItem(b.dataset.kind, b.dataset.key);
  if (it) { flash(it); save(); }
});

// ── the notebook, things to try, set-ups ────────────────────────────────────
function renderLog() {
  const list = $("cl-log");
  list.innerHTML = state.log.length
    ? state.log.map((e) => `
      <li class="cl-entry">
        <p class="cl-entry__head"><span class="cl-entry__tube">${esc(e.tag)}</span>${esc(e.title)}${e.times > 1 ? ` <span class="cl-entry__times">&times; ${e.times}</span>` : ""}</p>
        ${e.obs.map((o) => `
          <p class="cl-obs">${esc(o.text)}</p>
          ${o.why || o.eq ? `<p class="cl-why">${o.why ? prose(o.why) : ""}${o.eq ? `<span class="cl-eq">${chemHtml(o.eq)}</span>` : ""}</p>` : ""}`).join("")}
      </li>`).join("")
    : `<li class="cl-entry cl-entry--none">Nothing written yet. Carry a bottle to a test tube and hold it there.</li>`;
  $("cl-sheet-notebook").classList.toggle("is-plain", !state.explain);
  const ex = $("cl-explain");
  const tip = state.explain ? "Hide the chemistry" : "Show the chemistry";
  ex.innerHTML = state.explain ? ICON.eye : ICON.eyeOff;
  ex.dataset.tip = tip;
  ex.setAttribute("aria-label", tip);
  $("cl-count-log").textContent = state.log.length || "";
}
function renderTasks(fresh = []) {
  $("cl-tasks").innerHTML = TASKS.map((t) => {
    const done = state.done.includes(t.id);
    return `<li class="cl-task${done ? " is-done" : ""}${fresh.includes(t.id) ? " is-fresh" : ""}"><span class="cl-task__box">${done ? UI.check(16) : ""}</span><span>${esc(t.text)}</span></li>`;
  }).join("");
  $("cl-count-tasks").textContent = `${state.done.length}/${TASKS.length}`;
}
$("cl-setups").innerHTML = PRESETS.map((p) =>
  `<li><button type="button" class="pp-btn cl-note cl-setup" data-preset="${p.id}">${esc(p.name)}</button><span>${esc(p.about)}</span></li>`
).join("");

function openSheet(id) {
  document.querySelectorAll(".cl-sheet").forEach((s) => (s.hidden = s.id !== id || !s.hidden));
  document.querySelectorAll("[data-sheet]").forEach((b) => b.setAttribute("aria-pressed", String(!$(b.dataset.sheet).hidden)));
}
document.querySelectorAll("[data-ico]").forEach((b) => b.insertAdjacentHTML("afterbegin", ICON[b.dataset.ico]));
document.querySelectorAll("[data-sheet]").forEach((b) => b.addEventListener("click", () => openSheet(b.dataset.sheet)));
document.querySelectorAll(".cl-sheet__close").forEach((b) => { b.innerHTML = UI.close(14); b.addEventListener("click", () => openSheet(null)); });
$("cl-setups").addEventListener("click", (e) => {
  const b = e.target.closest("[data-preset]");
  if (!b) return;
  const p = PRESETS.find((x) => x.id === b.dataset.preset);
  layOut(p);
  openSheet(null);
  say(p.id === "blank" ? "The bench is clear. Take what you want from the drawer." : `${p.name}. ${p.about}`);
});
$("cl-explain").addEventListener("click", () => { state.explain = !state.explain; renderLog(); save(); });
$("cl-clear-log").addEventListener("click", () => { state.log = []; renderLog(); save(); });
$("cl-clear").addEventListener("click", () => {
  layOut(PRESETS[PRESETS.length - 1]);
  say("The bench is clear. Take what you want from the drawer, or pick a set-up.");
});

function renderDose() {
  document.querySelectorAll("[data-dose]").forEach((b) => {
    const on = b.dataset.dose === state.dose;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
document.querySelectorAll("[data-dose]").forEach((b) => b.addEventListener("click", () => { state.dose = b.dataset.dose; renderDose(); save(); }));

// ── the whole screen ────────────────────────────────────────────────────────
// The page always fills the window (the site's bar is put away on this page).
// A browser will only hand over the WHOLE screen in answer to a touch or a
// click, so that is asked for the first time the student touches anything.
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
function goFull() {
  const el = document.documentElement;
  const ask = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!ask) return;
  try { const p = ask.call(el); if (p && p.catch) p.catch(() => {}); } catch { /* not allowed here */ }
}
function leaveFull() {
  const out = document.exitFullscreen || document.webkitExitFullscreen;
  if (out) try { const p = out.call(document); if (p && p.catch) p.catch(() => {}); } catch { /* already out */ }
}
let askedFull = false;
window.addEventListener("pointerdown", (e) => {
  if (askedFull || fsEl() || e.target.closest("#cl-fs")) return;
  askedFull = true;
  goFull();
}, true);
$("cl-fs").addEventListener("click", () => { askedFull = true; if (fsEl()) leaveFull(); else goFull(); });
function onFull() {
  const b = $("cl-fs");
  const tip = fsEl() ? "Leave full screen" : "Full screen";
  b.innerHTML = fsEl() ? ICON.fsOff : ICON.fs;
  b.dataset.tip = tip;
  b.setAttribute("aria-label", tip);
}
document.addEventListener("fullscreenchange", onFull);
document.addEventListener("webkitfullscreenchange", onFull);

window.addEventListener("keydown", (e) => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
  if (e.key === "Escape") { select(null); openSheet(null); }
  else if ((e.key === "Delete" || e.key === "Backspace") && selected) { e.preventDefault(); removeItem(selected); }
});

// ── go ──────────────────────────────────────────────────────────────────────
fitWorld();
if (restored) {
  state.items.forEach((it) => { keepIn(it); mount(it); });
  $("cl-hint").hidden = state.items.length > 0;
  readouts();
  drawLinks();
} else layOut(PRESETS[0]);
renderDrawer();
renderLog();
renderTasks();
renderDose();
onFull();
mountTooltips();
new ResizeObserver(fitWorld).observe(wrap);
