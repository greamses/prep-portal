/* ============================================================================
   CHEMISTRY BENCH — the page
   ----------------------------------------------------------------------------
   An open bench and a drawer of loose parts. NOTHING COMES READY-MADE: there is
   no "distillation set" and no "titration set". A student takes a stand, slides
   its clamp, hangs a burette in it, pulls the stopper out of a bottle, and
   builds the experiment. The guides say what an experiment needs; they do not
   put it out.

   HOW THINGS ARE HANDLED
   - DRAG a piece to move it. Let a vessel go at a rack, a tripod, a clamp, a
     balance pan or (a gas jar) a trough of water, and it stands there.
   - CARRY one thing to another and hold it there to use it: an open bottle or
     a vessel pours; a burner heats; a splint, litmus, a meter or a thermometer
     tests; a dropper or pipette draws up and delivers.
   - FIT a thing by letting it go at a mouth or a joint, and it stays: a
     stopper, a funnel, a delivery tube, a condenser on a side arm, carbon rods
     in a beaker. Drag it off again to take it out.
   - SELECT a piece (tap it) for two handles: one TURNS it — tilt a beaker far
     enough and it pours onto whatever is underneath, bench included — and the
     other opens what can be set on it (how strong a bottle is, lighting a
     burner, emptying, putting away).
   - PRESS a tap, a power switch, a balance's tare key. SLIDE a stand's clamp
     by its boss. DRAG the free end of a delivery tube to where the gas should go.

   The chemistry is chem.js, the glass is glass.js. This file is hands and the
   notebook.
   ========================================================================== */

import { REAGENTS, newTube, add, heat, rinse, test, speciate, magnetOut, centrifuge, setUnknown, reagent, chemHtml, isEmpty, look, takeFrom, pourIn, roomIn, flameOf, massOf, boilOff, filterOut, sampleOf, gasMade, takeBottom, electrolyse } from "./chem.js";
import { DEFS, VESSELS, TOOLS, SUPPORTS, vesselSvg, veilSvg, paintVessel, bubble, reagentSvg, toolSvg, splintAfter, supportSvg, thumb, colourOf, mouthOf, capOf, CAP_BOX } from "./glass.js";
import { EXPERIMENTS, GROUPS, UNKNOWNS, CATIONS, ANIONS, HOWTO, stepDone } from "./waec.js";
import { UI } from "/utils/components/ui-icons.js";
import { mountTooltips } from "/utils/components/tooltip.js";

const KEY = "chem-bench-v3";
const LOG_MAX = 40;
const H = 720;                     // the bench is always 720 units tall; its width follows the window
let W = 1100;
let BASE = 600;                    // where a piece taken from the drawer first stands: clear of the note along the bottom
let TOP = 215;                     // and where the first row of bottles stands: clear of the icons along the top
const HEAT = { burner: 150, spirit: 116 };            // how far above its foot a burner's flame reaches
const MOUTH = ["lit", "glow"];                        // held at the mouth
const TAKES = { dropper: 0.5, pipette: 12.5 };        // portions drawn up (a portion is 2 cm3)
const STAYS = ["funnel", "paper", "chroma", "bung", "bung1", "tubing", "cap", "condenser", "electrode"];   // fitted, and left there
const PLUGS = ["funnel", "bung", "bung1"];            // one of these to a mouth (a delivery tube goes in a one-hole stopper)
const IDLE = ["waste", "syringe", "power", "holder", "tongs"];                 // never used ON anything
// Things that PICK UP: a test tube holder grips a tube by its neck, tongs take a crucible or a
// dish by its rim. The piece is then carried by the tool (it is the tool's rider, `held`), and
// carried over a flame it is heated there. jaw = where the grip is, in the tool's own drawing.
const GRIPS = {
  holder: { jaw: [29, -12.5], takes: (key) => key === "tube" || key === "boil", says: "its neck" },
  tongs: { jaw: [40, -16], takes: (key) => key === "crucible" || key === "dish" || key === "watch", says: "its rim" },
};
const LIGHT = ["H2", "NH3"];                          // less dense than air: they rise
const GAS = { H2: "hydrogen", CO2: "carbon dioxide", O2: "oxygen", NH3: "ammonia" };
const FLAME = ["off", "low", "medium", "roaring"];     // a burner's it.flame, 0 to 3
const lit = (b) => (b.flame || 0) > 0;
const CLAMP = -262;                                   // where a stand's clamp starts, above its foot
const NS = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** A sentence from chem.js; a formula inside it is written {Fe(OH)3}. */
const prose = (s) => esc(s).replace(/\{([^}]+)\}/g, (_, f) => chemHtml(f));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const cm3 = (portions) => `${(portions * 2).toFixed(portions * 2 >= 10 ? 0 : 1)} cm\u00b3`;

// ── icons: every control on the bench is one ────────────────────────────────
const glyph = (inner, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${inner}</svg>`;
const ICON = {
  back: UI.arrowLeft(20),
  setups: UI.list(20),
  notebook: UI.book(20),
  tasks: UI.task(20),
  drops: UI.droplet(20),
  measure: glyph(`<path d="M5 3h14v2.2h-1.4V18a3 3 0 0 1-3 3H9.4a3 3 0 0 1-3-3V5.2H5z" fill="var(--text-tertiary)"/><path d="M8.6 9h6.8v8.6a1.4 1.4 0 0 1-1.4 1.4h-4a1.4 1.4 0 0 1-1.4-1.4z" fill="var(--accent-secondary)"/>`),
  clear: UI.trash(20),
  fs: UI.expand(20),
  fsOff: UI.shrink(20),
  empty: glyph(`<path d="M3.4 5.6 13 2.8l.6 2-1.3.4 3.2 11a2.6 2.6 0 0 1-1.8 3.2l-4 1.2a2.6 2.6 0 0 1-3.2-1.8L3.3 7.8 2 8.2z" fill="var(--text-tertiary)" transform="rotate(-38 9 12)"/><path d="M18.6 13.4s2.6 3 2.6 4.8a2.6 2.6 0 0 1-5.2 0c0-1.8 2.6-4.8 2.6-4.800z" fill="var(--accent-secondary)"/>`),
  away: UI.box(18),
  eye: UI.eye(18),
  eyeOff: UI.eyeOff(18),
  wipe: UI.eraser(18),
  turn: UI.rotateRight(18),
  dots: glyph(`<circle cx="5" cy="12" r="2.4" fill="var(--accent-secondary)"/><circle cx="12" cy="12" r="2.4" fill="var(--accent-primary)"/><circle cx="19" cy="12" r="2.4" fill="var(--accent-danger)"/>`, 18),
  flip: UI.upDown(18),
  swirl: UI.loop(18),
  fire: UI.fire(18),
  note: glyph(`<path d="M4 3h16v12l-6 6H4z" fill="var(--accent-primary)"/><path d="M14 21v-6h6z" fill="var(--text-tertiary)"/><path d="M7.5 8h9M7.5 11.5h6" stroke="#14130f" stroke-opacity="0.6" stroke-width="1.6" stroke-linecap="round"/>`),
  table: UI.plot(20),
  calc: UI.keypad(20),
};

// ── the drawer's catalogue ──────────────────────────────────────────────────
const CATS = [
  { id: "glass", label: "Glassware", icon: `<path d="M9 2.6h6v6.2l5 9.400a2.4 2.4 0 0 1-2.1 3.500H6.1A2.4 2.4 0 0 1 4 18.2l5-9.400z" fill="var(--accent-secondary)"/><path d="M7.4 14.6h9.2l1.9 3.700a1 1 0 0 1-.9 1.5H6.4a1 1 0 0 1-.9-1.5z" fill="#fff"/>` },
  { id: "kit", label: "Equipment", icon: `<rect x="9.6" y="13" width="4.8" height="7.6" rx="1.2" fill="var(--text-tertiary)"/><rect x="5" y="19" width="14" height="3" rx="1.5" fill="var(--text-tertiary)"/><path d="M12 1.800c2.6 3.6 4.8 5 4.8 8a4.8 4.8 0 0 1-9.6 0c0-3 2.2-4.4 4.8-8z" fill="var(--accent-danger)"/>` },
  { id: "liquid", label: "Liquids", icon: `<path d="M12 2.4s7.4 7.4 7.4 12.6a7.4 7.4 0 0 1-14.8 0C4.6 9.8 12 2.4 12 2.4z" fill="var(--accent-secondary)"/>` },
  { id: "solid", label: "Solids", icon: `<path d="M3.4 20.6 8 11.4l3.4 4.4 3-7 6.2 11.800z" fill="var(--accent-warning)"/><circle cx="6" cy="6.4" r="2.4" fill="var(--accent-primary)"/>` },
];
// other words a student might search by
const ALSO = {
  stand: "clamp stand boss", burette: "titration", pipette: "titration", distflask: "distillation side arm", condenser: "distillation liebig", balance: "weighing scale mass tare",
  trough: "gas collection over water pneumatic", tubing: "delivery tube glass rubber tubing gas", bung: "bung cork", bung1: "bung cork holed bored delivery", funnel: "filtration filter", paper: "filtration filter", magnet: "magnetic separation iron filings", centrifuge: "centrifugation spin separate precipitate pellet supernatant", chroma: "chromatography ink dyes separation", burner: "bunsen heat", syringe: "gas volume measure",
  spirit: "alcohol lamp heat", flask: "erlenmeyer", flask100: "erlenmeyer", cyl10: "graduated", cyl100: "graduated", dish: "basin", tripod: "gauze", holder: "tongs peg", waste: "sink bin",
  sepfunnel: "separating separation immiscible oil", electrode: "electrolysis carbon rod graphite cathode anode", power: "electrolysis battery cell supply", gasjar: "gas collection",
};
const CATALOG = [
  ...Object.entries(VESSELS).map(([key, v]) => ({ cat: "glass", kind: "vessel", key, name: v.name })),
  ...Object.entries(SUPPORTS).map(([key, s]) => ({ cat: "kit", kind: "rack", key, name: s.name })),
  ...Object.entries(TOOLS).filter(([, t]) => !t.hidden).map(([key, t]) => ({ cat: "kit", kind: "tool", key, name: t.name })),
  ...REAGENTS.map((r) => ({ cat: r.kind === "solid" ? "solid" : "liquid", kind: "reagent", key: r.id, name: cap1(r.name) })),
];
const REAGENT_BOX = { solution: { x0: -35, y0: -125, x1: 35, y1: 8 }, solid: { x0: -36, y0: -96, x1: 36, y1: 8 }, indicator: { x0: -26, y0: -114, x1: 26, y1: 8 } };

const boxOf = (it) => (it.key === "cap" ? CAP_BOX[it.v || "bottle"] : it.kind === "vessel" ? VESSELS[it.key].bbox : it.kind === "tool" ? TOOLS[it.key].bbox : it.kind === "rack" ? SUPPORTS[it.key].bbox : REAGENT_BOX[reagent(it.key).kind]);
const nameOf = (it) => (it.kind === "vessel" ? `${VESSELS[it.key].name} ${it.tag}` : it.key === "cap" ? (it.v === "drop" ? "Dropper" : "Stopper") : CATALOG.find((c) => c.kind === it.kind && c.key === it.key).name);
/** "test tube A", for the middle of a sentence. */
const plain = (v) => (v.kind === "vessel" ? `${VESSELS[v.key].name.replace(/ \(.*/, "").toLowerCase()} ${v.tag}` : nameOf(v).toLowerCase());

// ── what is remembered between visits ───────────────────────────────────────
// exp = the practical that has been chosen; seen = what has been done towards it; unknown = which salt sample X is
const state = { items: [], n: 0, dose: "portion", explain: true, done: [], log: [], cat: "glass", exp: null, seen: [], unknown: null };
let restored = false;
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "null");
  if (saved && Array.isArray(saved.items)) {
    Object.assign(state, saved);
    state.items = state.items.filter((it) => (it.kind === "vessel" ? VESSELS[it.key] : it.kind === "tool" ? TOOLS[it.key] : it.kind === "rack" ? SUPPORTS[it.key] : reagent(it.key)));
    state.items.forEach((it) => { delete it.tilt; if (it.t) it.t = { ...newTube(), ...it.t, cap: VESSELS[it.key].cap }; });
    restored = true;
  }
} catch { /* a bad save is just a fresh bench */ }

if (!UNKNOWNS.some((u) => u.id === state.unknown)) state.unknown = UNKNOWNS[Math.floor(Math.random() * UNKNOWNS.length)].id;
setUnknown(state.unknown);

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
const fittedTo = (v, key) => state.items.find((a) => a.on === v.id && (!key || a.key === key));
/** Whatever is stopping a vessel's mouth: a solid stopper, or one with a hole. */
const stopperOf = (v) => fittedTo(v, "bung") || fittedTo(v, "bung1");
/** The delivery tube that leads out of a vessel: the one pushed through its stopper. */
const tubeOf = (v) => { const s = fittedTo(v, "bung1"); return s ? fittedTo(s, "tubing") : null; };
/** …and the vessel a delivery tube leads out of, if its stopper is in one. */
const vesselOfTube = (t) => { const s = t.on && byId(t.on); const v = s && s.on && byId(s.on); return v && v.kind === "vessel" ? v : null; };
/** What a holder or a pair of tongs is carrying. */
const loadOf = (tool) => state.items.find((o) => o.held === tool.id) || null;
/** Where a vessel hangs when a gripping tool at (x, y) has hold of it. */
function hangsAt(tool, v, x = tool.x, y = tool.y) {
  const [jx, jy] = GRIPS[tool.key].jaw, def = VESSELS[v.key];
  return tool.key === "holder" ? { x: x + jx, y: y + jy - 20 - def.top } : { x: x + jx + def.rTop - 5, y: y + jy - 2 - def.top };
}
/** The piece a gripping tool could take hold of, where it is now. */
function grabbable(tool) {
  if (loadOf(tool)) return null;
  const [jx, jy] = GRIPS[tool.key].jaw;
  // generous: anywhere on the piece will do, and the nearest one wins
  return nearest(vessels().filter((v) => GRIPS[tool.key].takes(v.key) && !v.held && !v.flip), (v) => {
    const def = VESSELS[v.key], x = tool.x + jx, y = tool.y + jy;
    if (Math.abs(x - v.x) > def.rMax + 26 || y < v.y + def.top - 30 || y > v.y + 14) return -1;
    const gx = tool.key === "holder" ? v.x : v.x - def.rTop + 5, gy = tool.key === "holder" ? v.y + def.top + 20 : v.y + def.top + 2;
    return Math.hypot(x - gx, y - gy);
  });
}
function grab(tool, v) {
  v.rack = null;
  v.held = tool.id;
  // the tool closes on the piece where the piece is: it is the tool that moves the last little way
  const at = hangsAt(tool, v, 0, 0);
  tool.x = v.x - at.x;
  tool.y = v.y - at.y;
  glide(tool, true);
  place(tool);
  raise(tool);
  say(`The ${nameOf(tool).toLowerCase()} ${tool.key === "tongs" ? "have" : "has"} ${plain(v)} by ${GRIPS[tool.key].says}. Carry it by the ${tool.key === "tongs" ? "tongs" : "holder"}: over a lit burner it is heated. Drag the piece itself away to let go.`);
  noteFlags([`held:${v.key}`]);
  save();
}
const plugIn = (v) => state.items.find((a) => a.on === v.id && PLUGS.includes(a.key));
const rodsIn = (v) => state.items.filter((a) => a.on === v.id && a.key === "electrode").sort((a, b) => (a.side || 0) - (b.side || 0));
const hostOf = (v) => (v.rack ? byId(v.rack[0]) : null);
/** An upturned jar standing in a trough with water in it: gas can be collected over the water. */
const overWater = (v) => { const h = v.flip && hostOf(v); return Boolean(h && h.key === "trough" && h.t.vol >= h.t.cap * 0.12); };

/** A burette or a separating funnel whose tip is down inside the neck of the flask under it is drawn before the flask, so that the tip is seen through the glass and not on top of it. */
function tipsIn() {
  for (const top of vessels().filter((v) => VESSELS[v.key].tap && nodes[v.id])) {
    const v = below(top.x, top.y, top, 90);
    if (!v || !nodes[v.id] || top.y < mouth(v).y - 1) continue;
    const a = nodes[top.id], bn = nodes[v.id];
    if (a.g.parentNode !== L.items || bn.g.parentNode !== L.items) continue;
    if (a.g.compareDocumentPosition(bn.g) & Node.DOCUMENT_POSITION_FOLLOWING) continue;      // already behind it
    L.items.insertBefore(a.g, bn.g);
    if (a.veil) L.items.insertBefore(a.veil, bn.g);
  }
}
let ticking = false;
function save() {
  readouts();
  drawLinks();
  tipsIn();
  // a piece may have been put in place, or taken away: the guide to a setting-up practical follows
  if (!ticking && typeof noteFlags === "function" && state.exp) { ticking = true; try { noteFlags([]); } catch { /* the guide is not up yet */ } finally { ticking = false; } }
  if (!ticking) { ticking = true; try { if (actor.onChange) actor.onChange(); } catch { /* PrepBot is not up yet */ } finally { ticking = false; } }
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
  BASE = clamp(620, TOP + 180, 640);
  state.items.forEach((it) => { keepIn(it); place(it); });
  drawLinks();
  showHandles();
}
function keepIn(it) {
  const b = boxOf(it);
  it.x = clamp(it.x, -b.x0 + 4, Math.max(-b.x0 + 4, W - b.x1 - 4));
  // a long thing (a pipette, a burette) may poke off the top of the bench: it has to reach into a bottle, or hang in a clamp
  const tall = it.kind === "tool" || (it.kind === "vessel" && VESSELS[it.key].fixed);
  it.y = clamp(it.y, Math.min(tall ? Math.min(-b.y0 + 4, 80) : -b.y0 + 4, H - 10), H - 10);
}
/** A pointer's place on the bench, in bench units; and a bench point's place on the screen. */
function world(e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
function screenOf(x, y) {
  const pt = svg.createSVGPoint();
  pt.x = x;
  pt.y = y;
  return pt.matrixTransform(svg.getScreenCTM());
}

const isBehind = (it) => it.kind === "rack" || it.key === "trough";
function mount(it) {
  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", `cl-item cl-item--${it.kind}`);
  g.dataset.item = it.id;
  g.dataset.key = it.key;
  const node = (nodes[it.id] = { g });
  if (it.kind === "vessel") g.innerHTML = vesselSvg(it.key, it.id, it.tag);
  else if (it.kind === "reagent") { g.innerHTML = reagentSvg(it.key, it.id); g.dataset.rk = reagent(it.key).kind; }
  else if (it.kind === "tool") {
    // a tool that grips is drawn in two halves, and what it holds goes between them
    const art = toolSvg(it.key, it), cut = art.indexOf("<!--front-->");
    g.innerHTML = cut < 0 ? art : art.slice(0, cut);
    if (cut >= 0) {
      node.front = document.createElementNS(NS, "g");
      node.front.setAttribute("class", "cl-item-front");
      node.front.innerHTML = art.slice(cut + 12);
      node.near = true;                     // its front lives in the same layer, just after what it holds
    }
  }
  else {
    const r = supportSvg(it.key);
    g.innerHTML = r.back;
    node.front = document.createElementNS(NS, "g");
    node.front.setAttribute("class", "cl-item-front");
    node.front.innerHTML = r.front;
    L.front.appendChild(node.front);
  }
  (isBehind(it) ? L.back : L.items).appendChild(g);
  if (node.near) L.items.appendChild(node.front);
  if (it.kind === "vessel" && !isBehind(it)) {
    // its front wall and liquid, once more, over whatever is put inside it (see veilSvg)
    node.veil = document.createElementNS(NS, "g");
    node.veil.setAttribute("class", "cl-veil");
    node.veil.innerHTML = veilSvg(it.key, it.id);
    L.items.appendChild(node.veil);
  }
  place(it);
  if (it.kind === "vessel") paint(it);
  dress(it);
}
/** How far up a piece its turning point is (it turns about its middle). */
const pivotOf = (it) => (it.kind === "vessel" ? VESSELS[it.key].top / 2 : -mouthOf(it.key) / 2);
function place(it, transform) {
  if ((it.key === "bung" || it.key === "bung1") && nodes[it.id]) {
    // a stopper is the width of the neck it is in
    const h = it.on != null && byId(it.on);
    nodes[it.id].g.style.setProperty("--k", h && h.kind === "vessel" ? clamp(VESSELS[h.key].rTop / 12.5, 0.62, 1.7).toFixed(2) : "1");
  }
  if (it.key === "paper" && nodes[it.id]) nodes[it.id].g.classList.toggle("is-cone", it.on != null);
  const n = nodes[it.id];
  if (!n) return;
  let t = transform;
  if (!t) {
    t = `translate(${it.x}px, ${it.y}px)`;
    // upturned: it.y is where the MOUTH is, and the closed end is above it
    if (it.flip) t += ` rotate(180deg) translate(0px, ${-VESSELS[it.key].top}px)`;
    // a stopper in an upturned tube is upside down with it
    else if ((it.key === "bung" || it.key === "bung1") && it.on != null && byId(it.on) && byId(it.on).flip) t += " rotate(180deg)";
    else if (it.tilt) { const c = pivotOf(it); t += ` translate(0px, ${c}px) rotate(${it.tilt}deg) translate(0px, ${-c}px)`; }
  }
  n.g.style.transform = t;
  if (n.front) n.front.style.transform = t;
  if (n.veil) n.veil.style.transform = t;
}
function paint(it, opts = {}) {
  const g = nodes[it.id].g;
  g.classList.toggle("has-sublimate", (it.t.sublimate || 0) > 0);
  const out = paintVessel(g, it.key, it.t, { seed: Number(it.id.slice(1)) + 1, tilt: it.tilt || 0, ...opts });
  if (it.flip) {
    // an upturned jar over water is full of the trough's water, less whatever gas has pushed it down
    const def = VESSELS[it.key], Hh = -def.top, liq = g.querySelector(".cl-liquidg");
    if (overWater(it)) {
      liq.style.display = "";
      const f = it.jar ? Math.min(1, it.jar.n / def.invert) : 0;
      liq.style.transform = `translateY(${-(Hh * f).toFixed(1)}px)`;
      const c = look(hostOf(it).t);
      g.querySelector(".cl-liquid").style.fill = `rgba(${c.rgb},${Math.max(c.a, 0.32)})`;
    } else liq.style.transform = `translateY(${Hh}px)`;
    g.querySelector(".cl-meniscus").setAttribute("rx", 0);
  }
  // the liquid in the vessel's front (drawn over what is inside it): the same level, a lighter wash
  const veil = nodes[it.id].veil && nodes[it.id].veil.querySelector(".cl-veil__liq");
  if (veil) {
    const lg = g.querySelector(".cl-liquidg");
    const rgb = (g.dataset.rgb || "").split(",");
    const wet = lg.style.display !== "none" && rgb.length === 3 && !it.tilt;
    veil.style.display = wet ? "" : "none";
    if (wet) { veil.setAttribute("d", g.querySelector(".cl-liquid").getAttribute("d") || ""); veil.style.transform = lg.style.transform; veil.style.fill = `rgba(${rgb},0.34)`; }
  }
  // a trough's water is also what stands in the jar upturned in it
  if (it.key === "trough") vessels().filter((v) => v.flip && v.rack && v.rack[0] === it.id && nodes[v.id]).forEach((v) => paint(v));
  return out;
}
/** Bring a piece to the front of its layer, and whatever is fitted to it in front of that. */
function raise(it, layer = L.items) {
  if (!nodes[it.id] || isBehind(it)) return;
  // a thing fitted INTO a piece, or HELD by a tool, is drawn with it: the whole stack goes up together
  let root = it;
  while (layer === L.items) {
    const up = root.on != null ? byId(root.on) : root.held ? byId(root.held) : null;
    if (!up || !nodes[up.id] || isBehind(up)) break;
    root = up;
  }
  // back of the piece, what is fitted in it, its own front; and for a gripping tool: far jaw, what it holds, near jaw
  const put = (o) => {
    const n = nodes[o.id];
    layer.appendChild(n.g);
    state.items.filter((c) => c.on === o.id && nodes[c.id]).forEach(put);
    if (n.veil) layer.appendChild(n.veil);
    state.items.filter((c) => c.held === o.id && nodes[c.id]).forEach(put);
    if (n.near) layer.appendChild(n.front);
  };
  put(root);
}
/** A tool held in a vessel goes INSIDE it for as long as it is there: behind the vessel's front. */
function tuck(tool, v) {
  const n = nodes[v.id];
  if (!n || !n.veil || tool.kind !== "tool" || HEAT[tool.key] || MOUTH.includes(tool.key) || GRIPS[tool.key] || tool.key === "magnet" || v.flip) return false;
  raise(v);
  L.items.insertBefore(nodes[tool.id].g, n.veil);
  return true;
}
function glide(it, on = true) {
  const n = nodes[it.id];
  if (!n) return;
  n.g.classList.toggle("is-gliding", on);
  if (n.front) n.front.classList.toggle("is-gliding", on);
  if (n.veil) n.veil.classList.toggle("is-gliding", on);
}
/** A piece shows the state it is in: what a dropper holds, whether a burner is lit, where a clamp is. */
function dress(it) {
  const n = nodes[it.id];
  if (!n) return;
  const g = n.g;
  if (TAKES[it.key]) g.querySelector(".cl-drop-liq").style.fill = it.sample ? `rgba(${it.rgb || [200, 224, 240]},0.9)` : "transparent";
  if (it.key === "wire") g.querySelector(".cl-loop").style.fill = it.sample ? "#f2f6fb" : "transparent";
  if (it.kind === "reagent") g.style.setProperty("--drop", `${((1 - leftIn(it) / fullOf(it)) * DROP[reagent(it.key).kind]).toFixed(1)}px`);
  if (it.key === "magnet") g.classList.toggle("has-filings", Boolean(it.sample));
  if (it.key === "chroma") {
    const ink = INKS[it.ink || "black"], p = it.washed ? 0 : it.p || 0;
    const front = 100 - (100 - FRONT_Y) * p;
    g.querySelector(".cl-ink").style.fill = `rgb(${ink.rgb})`;
    g.querySelector(".cl-ink").style.opacity = it.washed ? 0.12 : Math.max(0.1, 1 - p * 1.6);
    const wet = g.querySelector(".cl-wetfront");
    wet.setAttribute("y", front.toFixed(1));
    wet.setAttribute("height", (100 - front).toFixed(1));
    g.querySelector(".cl-front").setAttribute("d", `M-12 ${front.toFixed(1)}H12`);
    g.querySelectorAll(".cl-dye").forEach((d, i) => {
      const dye = ink.dyes[i];
      if (!dye) { d.setAttribute("opacity", 0); return; }
      // a spot cannot be ahead of the water that carries it
      const y = Math.max(front + 3, 86 - dye[2] * (86 - FRONT_Y) * p);
      d.setAttribute("cy", y.toFixed(1));
      d.setAttribute("ry", (3.6 + p * 2.4).toFixed(1));
      d.style.fill = `rgb(${dye[1]})`;
      d.setAttribute("opacity", Math.min(0.9, p * 4).toFixed(2));
    });
  }
  if (it.key === "paper") {
    g.classList.toggle("is-cone", it.on != null);
    g.querySelector(".cl-residue").style.fill = it.residue ? `rgb(${it.residue})` : "transparent";
    g.querySelector(".cl-wet").style.fill = it.wet ? `rgba(${it.wet},0.3)` : "transparent";
  }
  if (HEAT[it.key]) { g.classList.toggle("is-unlit", !lit(it)); g.style.setProperty("--fl", [1, 0.62, 0.86, 1.14][it.flame || 0]); }
  if (it.key === "electrode") g.querySelector(".cl-coat").setAttribute("fill", it.coat === "Cu" ? "#b9683e" : it.coat === "Ag" ? "#d9dde2" : "transparent");
  if (it.key === "syringe") {
    const n2 = it.gas ? it.gas.n : 0;
    g.querySelector(".cl-plunger").style.transform = `translateX(${(Math.min(1, n2 / 8.34) * 104).toFixed(1)}px)`;
    g.querySelector(".cl-read").textContent = `${Math.round(n2 * 12)} cm\u00b3`;
  }
  if (it.kind === "rack" && it.key === "stand") {
    const t = `translateY(${it.clamp ?? CLAMP}px)`;
    g.querySelector(".cl-clampg").style.transform = t;
    n.front.querySelector(".cl-clampg").style.transform = t;
  }
}
/** The numbers that pieces show: a burette's reading, a balance. */
function readouts() {
  for (const it of state.items) {
    const g = nodes[it.id] && nodes[it.id].g;
    if (!g) continue;
    if (it.kind === "rack" && it.key === "balance") {
      const v = vessels().find((o) => o.rack && o.rack[0] === it.id);
      let m = 0;
      if (v) m = VESSELS[v.key].g + massOf(v.t) + state.items.filter((a) => a.on === v.id).length * 12;
      it.gross = m;
      g.querySelector(".cl-lcd--bal").textContent = (m - (it.tare || 0)).toFixed(2);
    }
  }
  lens();
}

// ── paper chromatography ────────────────────────────────────────────────────
// The strip hangs in a beaker from a rod across its mouth. With a LITTLE water in the
// beaker (enough to touch the paper, not enough to reach the ink) the water climbs the
// paper and carries each dye of the ink a different distance. Distances are in mm from the
// pencil line, so that Rf can be worked out: spot ÷ solvent front.
const FRONT_Y = 12;                // where the water stops: 74 mm above the pencil line
const INKS = {
  black: { name: "black", rgb: [28, 28, 34], dyes: [["blue", [58, 110, 200], 0.84], ["red", [214, 60, 70], 0.55], ["yellow", [232, 196, 40], 0.27]] },
  green: { name: "green", rgb: [40, 120, 70], dyes: [["blue", [58, 110, 200], 0.84], ["yellow", [232, 196, 40], 0.27]] },
  purple: { name: "purple", rgb: [108, 60, 140], dyes: [["blue", [58, 110, 200], 0.84], ["red", [214, 60, 70], 0.55]] },
  orange: { name: "orange", rgb: [226, 120, 40], dyes: [["red", [214, 60, 70], 0.55], ["yellow", [232, 196, 40], 0.27]] },
};
const running = new Map();          // strip id → its animation frame
function runChroma(paper) {
  const host = byId(paper.on);
  if (!host || paper.p >= 1 || paper.washed || running.has(paper.id)) return;
  const def = VESSELS[host.key];
  if (host.t.vol + (host.t.oil || 0) <= 0) { say("The strip hangs in an empty beaker. Pour in a LITTLE water: enough to touch the bottom of the paper, but not to reach the ink spot."); return; }
  const depth = -def.top - Math.abs(Number(nodes[host.id].g.querySelector(".cl-meniscus").getAttribute("cy")));   // from the rim down to the water
  if (depth > 100) { say("The water does not reach the paper yet. Add a little more."); return; }
  if (depth < 88) {
    paper.washed = true;
    dress(paper);
    record(host, { title: "Hung a chromatography strip in the water", obs: [{ text: "The water covers the ink spot, and the ink just washes off into the water. Nothing separates.", why: "The spot must start ABOVE the water, so that the water has to climb the paper past it. Take a fresh strip and use less water." }], flags: ["chroma:washed"] });
    return;
  }
  const t0 = performance.now() - (paper.p || 0) * 9000;
  const step = (now) => {
    if (!nodes[paper.id] || paper.on == null) { running.delete(paper.id); return; }
    paper.p = Math.min(1, (now - t0) / 9000);
    dress(paper);
    if (paper.p < 1) { running.set(paper.id, requestAnimationFrame(step)); return; }
    running.delete(paper.id);
    const ink = INKS[paper.ink || "black"], run = 86 - FRONT_Y;
    record(host, {
      title: `Ran a chromatogram of ${ink.name} ink`,
      obs: [
        { text: `The water climbs the paper and carries the ink up with it. The ${ink.name} ink separates into ${ink.dyes.length} spots: ${ink.dyes.map((d) => d[0]).join(", ")}.`, why: "The ink is a mixture of dyes. Each is carried a different distance: the more soluble a dye is in the water and the less it clings to the paper, the further it travels." },
        { text: `From the pencil line: solvent front ${run} mm; ${ink.dyes.map((d) => `${d[0]} ${Math.round(d[2] * run)} mm`).join(", ")}.`, why: "Rf = distance moved by the spot ÷ distance moved by the solvent front. It is always less than 1, and it identifies the dye." },
      ],
      flags: ["chroma"],
    });
  };
  say("The water has reached the paper and is climbing it. Watch the ink.");
  running.set(paper.id, requestAnimationFrame(step));
}

// ── a filter paper is FOLDED into its cone ──────────────────────────────────
// Let go at a funnel, the disc is folded in half, in half again, turned point down and
// opened: three thicknesses on one side, one on the other. (glass.js draws the stages,
// bench.css times them; here the film is only started and, when it is over, put away.)
const FOLD_MS = 2600;
const folding = new Map();        // paper id → the timer that ends its film
function foldIn(paper) {
  const n = nodes[paper.id];
  if (!n || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  n.g.classList.remove("is-folding");
  void n.g.getBoundingClientRect();
  n.g.classList.add("is-folding");
  clearTimeout(folding.get(paper.id));
  folding.set(paper.id, setTimeout(() => nodes[paper.id] && nodes[paper.id].g.classList.remove("is-folding"), FOLD_MS));
}

// ── reading a scale: the lens ───────────────────────────────────────────────
// A burette and a measuring cylinder do not say what they hold. A chosen one shows a
// lens on its liquid surface: the scale, magnified, and the curve of the meniscus. The
// reading is taken by eye at the BOTTOM of the curve, and typed into the piece's menu.
const SCALES = {
  burette: { per: 0.1, label: 1, down: true, dp: 2, tol: 0.06, value: (it) => (it.t.cap - it.t.vol) * 2 },
  cyl10: { per: 0.1, label: 1, down: false, dp: 1, tol: 0.06, value: (it) => (it.t.vol + (it.t.oil || 0)) * 2 },
  cyl100: { per: 1, label: 10, down: false, dp: 0, tol: 0.6, value: (it) => (it.t.vol + (it.t.oil || 0)) * 2 },
  // Two pieces have no scale, only ONE etched line: they hold their volume when the bottom of
  // the meniscus sits on it, and not otherwise. The lens shows the line and where the liquid is.
  vol100: { per: 1, mark: 100, down: false, dp: 0, tol: 0.6, near: 9, value: (it) => (it.t.vol + (it.t.oil || 0)) * 2 },
  pipette: { per: 1, mark: 25, down: false, dp: 0, tol: 0.6, value: (it) => (it.sample.vol + (it.sample.oil || 0)) * 2, at: -130, half: 14 },
};
/** The scale a piece can be read by, just now: it has to hold liquid, stand upright, and (with one mark) be near it. */
function scaleOf(it) {
  const sc = it && SCALES[it.key];
  if (!sc) return null;
  if (it.kind === "vessel" ? it.t.vol + (it.t.oil || 0) <= 0 || it.tilt : !it.sample) return null;
  if (sc.near && Math.abs(sc.value(it) - sc.mark) > sc.near) return null;
  return sc;
}
let lensEl = null;
function lens() {
  const it = selected, sc = scaleOf(it);
  if (!sc || !nodes[it.id] || drag) { if (lensEl) { lensEl.remove(); lensEl = null; } return; }
  if (!lensEl) { lensEl = document.createElementNS(NS, "g"); lensEl.setAttribute("class", "cl-lens"); }
  L.fx.appendChild(lensEl);
  const R = 68, PX = 6;                                    // the lens, and how far apart two small divisions are drawn
  const v = sc.value(it);
  const hw = sc.half || 30;                                // half the width of the glass, as the lens shows it
  const surface = it.y + (sc.at ?? Number(nodes[it.id].g.querySelector(".cl-meniscus").getAttribute("cy")));
  const side = it.x + 150 > W - 20 ? -1 : 1;
  const cx = it.x + side * 112, cy = clamp(surface, TOP - 60, H - R - 22);
  const c = it.kind === "vessel" ? look(it.t).rgb : it.rgb || [200, 224, 240];
  const alpha = it.kind === "vessel" ? Math.max(look(it.t).a, 0.42) : 0.7;
  const yOf = (tv) => ((tv - v) / sc.per) * PX * (sc.down ? 1 : -1);
  let ticks = "";
  if (sc.mark) {
    // one line, right round the glass
    const y = yOf(sc.mark);
    if (Math.abs(y) < R) ticks = `<path class="cl-lens__ring" d="M${-hw} ${y.toFixed(1)}H${hw}"/><text x="0" y="${(y - 5).toFixed(1)}" text-anchor="middle">${sc.mark}</text>`;
  } else {
    const first = Math.floor(v / sc.per) - 13;
    for (let k = first; k <= first + 27; k++) {
      const tv = k * sc.per;
      if (tv < -1e-9) continue;
      const y = yOf(tv);
      if (Math.abs(y) > R) continue;
      const whole = Math.abs(tv / sc.label - Math.round(tv / sc.label)) < 1e-6;
      const half = Math.abs((tv / sc.label) * 2 - Math.round((tv / sc.label) * 2)) < 1e-6;
      ticks += `<path d="M-30 ${y.toFixed(1)}H${whole ? 6 : half ? -6 : -16}"/>`;
      if (whole) ticks += `<text x="12" y="${(y + 3.6).toFixed(1)}">${Math.round(tv / sc.label) * sc.label}</text>`;
    }
  }
  const dip = hw * 0.27;
  const uid = `lens-${it.id}`;
  lensEl.setAttribute("transform", `translate(${cx.toFixed(1)} ${cy.toFixed(1)})`);
  lensEl.innerHTML = `<path class="cl-lens__arm" d="M${(-side * R).toFixed(1)} 0L${(it.x - cx).toFixed(1)} ${(surface - cy).toFixed(1)}"/>
    <circle r="${R + 5}" fill="#11151a" fill-opacity="0.7"/>
    <clipPath id="${uid}"><circle r="${R}"/></clipPath>
    <g clip-path="url(#${uid})">
      <rect x="${-R}" y="${-R}" width="${R * 2}" height="${R * 2}" fill="#232a33"/>
      <rect x="${-hw}" y="${-R}" width="${hw * 2}" height="${R * 2}" fill="#fff" fill-opacity="0.06"/>
      <path d="M${-hw} ${-dip}Q0 ${dip} ${hw} ${-dip}V${R}H${-hw}z" fill="rgba(${c},${alpha})"/>
      <path d="M${-hw} ${-dip}Q0 ${dip} ${hw} ${-dip}V${-dip + 3.5}Q0 ${dip + 3.5} ${-hw} ${-dip + 3.5}z" fill="#000" fill-opacity="0.24"/>
      <path d="M${-hw} ${-dip}Q0 ${dip} ${hw} ${-dip}" fill="none" stroke="#fff" stroke-opacity="0.9" stroke-width="1.3"/>
      <rect x="${-hw}" y="${-R}" width="5" height="${R * 2}" fill="url(#g-shine-v)" opacity="0.7"/>
      <path d="M${-hw} ${-R}V${R}M${hw} ${-R}V${R}" stroke="#fff" stroke-opacity="0.7" stroke-width="1.4"/>
      <g class="cl-lens__scale">${ticks}</g>
      <path class="cl-lens__eye" d="M${hw + 2} 0H${R}"/>
    </g>
    <circle r="${R}" fill="none" stroke="url(#g-metal)" stroke-width="4.5"/><circle r="${R - 2.6}" fill="none" stroke="#fff" stroke-opacity="0.28" stroke-width="0.8"/>
    <path d="M${-R * 0.72} ${-R * 0.5}A${R * 0.9} ${R * 0.9} 0 0 1 ${-R * 0.2} ${-R * 0.86}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="2.4" stroke-linecap="round"/>
    <text class="cl-lens__note" y="${R + 17}">${sc.mark ? "the curve must sit on the line" : "read the bottom of the curve"}</text>`;
}
/** A reading has been typed in: is it what the scale says? */
function checkReading(it, typed) {
  const sc = scaleOf(it);
  if (!sc) return;
  const got = Number(String(typed).replace(",", "."));
  if (!Number.isFinite(got)) { say("Type the number you read off the scale.", it.kind === "vessel" ? it : null, "no"); return; }
  const real = sc.value(it);
  const off = got - real;
  const where = it.kind === "vessel" ? it : null;
  if (sc.mark && Math.abs(real - sc.mark) > sc.tol) {
    // with one mark there is nothing to read until the liquid is ON it
    say(`The bottom of the meniscus is ${real < sc.mark ? "below" : "above"} the line, so it does not hold ${sc.mark} cm\u00b3 yet. ${real < sc.mark ? "Add distilled water a few drops at a time until the curve sits on the line." : "It is overfilled: empty it and make it up again."}`, where, "no");
    return;
  }
  if (Math.abs(off) <= sc.tol) {
    noteFlags([`read:${it.key}`]);
    state.log.unshift({ id: it.id, tag: it.tag || "", title: `Read ${plain(it)}`, obs: [{ text: `Reading: ${got.toFixed(sc.dp)} cm\u00b3.`, why: sc.mark ? `The bottom of the meniscus sits on the line, so it holds exactly ${sc.mark} cm\u00b3.` : `Read at eye level, at the bottom of the meniscus. The scale says ${real.toFixed(2)} cm\u00b3.` }] });
    renderLog();
    say(`Good reading: ${got.toFixed(sc.dp)} cm\u00b3. It is written in the notebook.`, where);
  } else if (sc.mark) say(`The curve is sitting on the line. What volume is this piece made to hold? It is marked on the glass.`, where, "no");
  else if (Math.abs(off) <= sc.tol * 4) say(`Close, but look again. Read the BOTTOM of the curve, and count the small divisions: each one is ${sc.per} cm\u00b3.`, where, "no");
  else say(sc.down ? "Not yet. A burette is numbered from the top down: the numbers get bigger going down." : `Not yet. Find the numbered line just below the liquid, then count up the small divisions: each one is ${sc.per} cm\u00b3.`, where, "no");
  save();
}

// ── what stands on what, and what is fitted to what ─────────────────────────
function mouth(o) {
  if (o.kind === "vessel") return o.flip ? { x: o.x, y: o.y } : { x: o.x, y: o.y + VESSELS[o.key].top };
  if (o.kind === "reagent") return { x: o.x, y: o.y - mouthOf(o.key) };
  if (o.key === "syringe") return { x: o.x - 104, y: o.y - 10 };
  return { x: o.x, y: o.y - 66 };
}
const rimOf = (o) => (o.kind === "vessel" ? VESSELS[o.key].rTop : o.kind === "reagent" ? 12 : 50);
/** Where a fitted thing sits on its host: a condenser on the side arm, carbon rods left and right, anything else in the mouth. */
function seat(host, it) {
  if (it.key === "paper" || it.key === "tubing") return { x: host.x, y: host.y };
  if (it.key === "condenser") { const [ax, ay] = VESSELS[host.key].arm; return { x: host.x + ax, y: host.y + ay }; }
  const m = mouth(host);
  if (it.key === "electrode") return { x: m.x + (it.side || -1) * Math.min(VESSELS[host.key].rTop * 0.5, 30), y: m.y };
  return m;
}
/** Everything with a slot a vessel can stand in. */
const hosts = () => state.items.filter((o) => o.kind === "rack" || (o.kind === "vessel" && VESSELS[o.key].slots));
const hostDef = (o) => (o.kind === "rack" ? SUPPORTS[o.key] : { slots: VESSELS[o.key].slots, fits: VESSELS[o.key].slotFits });
/** Where slot i of a host is, for a given vessel. A clamp holds a vessel by its neck, so tall and short hang differently. */
function slotAt(host, i, def) {
  const [sx, sy] = hostDef(host).slots[i];
  if (host.kind === "rack" && host.key === "stand" && i === 0) return [sx, (host.clamp ?? CLAMP) - 1 - def.top - def.grip];
  return [sx, sy];
}
/** Whatever rides on `it`: vessels in its slots, things fitted to it, and whatever rides on those. */
function ridersOf(it, out = []) {
  for (const o of state.items) {
    if (o === it || out.includes(o)) continue;
    if ((o.rack && o.rack[0] === it.id) || o.on === it.id || o.held === it.id) { out.push(o); ridersOf(o, out); }
  }
  return out;
}
/** `it` has been put somewhere by the page, not the hand: its riders go with it. */
function follow(it, smooth = true) {
  for (const o of state.items) {
    if (o.on === it.id) { const m = seat(it, o); o.x = m.x; o.y = m.y; }
    else if (o.held === it.id) { const at = hangsAt(it, o); o.x = at.x; o.y = at.y; }
    else if (o.rack && o.rack[0] === it.id) { const [sx, sy] = o.key === "syringe" ? [78, (it.clamp ?? CLAMP) + 9] : slotAt(it, o.rack[1], VESSELS[o.key]); o.x = it.x + sx; o.y = it.y + sy; }
    else continue;
    glide(o, smooth);
    place(o);
    follow(o, smooth);
  }
}
/** A vessel let go near a free slot that fits it stands in the slot. */
function snap(it) {
  const def = VESSELS[it.key];
  for (const host of hosts()) {
    if (host === it) continue;
    const S = hostDef(host);
    if (!S.fits(def)) continue;
    if (it.flip && !(VESSELS[host.key] && VESSELS[host.key].upturns) && !(host.kind === "rack" && host.key === "stand")) continue;      // an upturned tube stands in a trough, or is held in a clamp
    const taken = new Set(state.items.filter((v) => v !== it && v.rack && v.rack[0] === host.id).map((v) => v.rack[1]));
    for (let i = 0; i < S.slots.length; i++) {
      if (taken.has(i)) continue;
      // a stand's base plate takes only what can stand on it: flat-bottomed, and the right way up
      if (host.kind === "rack" && host.key === "stand" && i === 1 && !(def.flat && !it.flip)) continue;
      const [sx, sy] = slotAt(host, i, def);
      const up = VESSELS[host.key] && VESSELS[host.key].upturns;
      // a jar going into a trough is judged by where its middle is; everything else by its foot
      const near = up ? Math.abs(it.x - (host.x + sx)) < 60 && Math.abs(it.y + def.top / 2 - (host.y - 40)) < 90
        : Math.abs(it.x - (host.x + sx)) < 34 + def.rMax * 0.3 && Math.abs(it.y - (host.y + sy)) < 80;
      if (!near) continue;
      if (up) {
        if (!isEmpty(it.t)) { say("Empty the jar before you turn it over in the trough.", it, "no"); return false; }
        it.flip = true;
        it.jar = null;
        it.t.gas = null;
      }
      it.rack = [host.id, i];
      it.x = host.x + sx;
      it.y = host.y + sy;
      if (host.kind === "rack" && host.key === "stand" && i === 0) setTimeout(() => noteFlags([`clamped:${it.key}`]), 0);
      if (up) { paint(it); say(overWater(it) ? `${cap1(plain(it))} is upside down in the trough, full of water. Lead a delivery tube to it.` : "The jar is upside down in the trough, but there is no water to hold in it. Fill the trough.", it); }
      return true;
    }
  }
  return false;
}

/** A gas syringe let go at a free clamp is held there, level. */
function clampSyringe(it) {
  for (const st of state.items.filter((o) => o.kind === "rack" && o.key === "stand")) {
    if (state.items.some((o) => o !== it && o.rack && o.rack[0] === st.id)) continue;
    const c = st.clamp ?? CLAMP;
    if (Math.abs(it.x - 34 - (st.x + 44)) > 60 || Math.abs(it.y - 10 - (st.y + c)) > 60) continue;
    it.rack = [st.id, 0];
    it.x = st.x + 78;
    it.y = st.y + c + 9;
    return true;
  }
  return false;
}
// ── the rubber tube of a delivery tube ──────────────────────────────────────
// It is a real length of rubber: a chain of short links, each pulled down by its weight
// and held to its neighbours, pinned to the glass at one end and to wherever it has been
// led at the other. So it hangs in a curve, swings when either end is moved, lies on the
// bench where it reaches it, and will not stretch: led too far, it pulls out.
const HOSE_LEN = 470, HOSE_N = 22;
const hoses = new Map();          // tubing id → { p: [{ x, y, px, py }], gas: time until which gas is seen passing }
let hosing = 0, hoseStill = 0;
const hoseStart = (t) => ({ x: t.x + 38, y: t.y - 56 });
/** Where a delivery tube's free end is. */
function endOf(tube) {
  const o = tube.to && byId(tube.to);
  if (!o) return { x: tube.x + (tube.ex ?? 150), y: tube.y + (tube.ey ?? 44), dir: "free" };
  if (o.key === "syringe") return { x: o.x - 104, y: o.y - 10, dir: "side" };
  if (o.flip) return { x: o.x, y: o.y - 12, dir: "up" };
  return { x: o.x, y: o.y + VESSELS[o.key].top + 26, dir: "down" };
}
function hoseOf(t) {
  let h = hoses.get(t.id);
  if (!h) {
    const a = hoseStart(t), b = endOf(t);
    h = { p: Array.from({ length: HOSE_N + 1 }, (_, i) => { const x = a.x + ((b.x - a.x) * i) / HOSE_N, y = a.y + ((b.y - a.y) * i) / HOSE_N + Math.sin((Math.PI * i) / HOSE_N) * 50; return { x, y, px: x, py: y }; }), gas: 0 };
    hoses.set(t.id, h);
    for (let k = 0; k < 120; k++) hoseStep(t, h);           // let it hang before it is first seen
  }
  return h;
}
/** One moment of the tube's life. Returns how much it moved. */
function hoseStep(t, h) {
  const a = hoseStart(t), b = endOf(t), seg = HOSE_LEN / HOSE_N, P = h.p, N = HOSE_N;
  let moved = 0;
  for (const q of P) {
    const vx = (q.x - q.px) * 0.93, vy = (q.y - q.py) * 0.93;
    q.px = q.x; q.py = q.y;
    q.x += vx; q.y += vy + 0.42;                             // its own weight
    moved += Math.abs(vx) + Math.abs(vy);
  }
  // where it is held: on the glass (and coming straight off it), and at the far end (going straight in)
  const pin = new Map([[0, a], [1, { x: a.x + seg * 0.92, y: a.y }], [N, b]]);
  if (b.dir === "down") pin.set(N - 1, { x: b.x, y: b.y - seg * 0.92 });
  else if (b.dir === "up") pin.set(N - 1, { x: b.x, y: b.y + seg * 0.92 });
  else if (b.dir === "side") pin.set(N - 1, { x: b.x - seg * 0.92, y: b.y });
  for (let pass = 0; pass < 16; pass++) {
    for (const [i, at] of pin) { P[i].x = at.x; P[i].y = at.y; }
    for (let i = 0; i < N; i++) {
      const p = P[i], q = P[i + 1], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 0.001;
      const off = (d - seg) / d, wp = pin.has(i) ? 0 : 1, wq = pin.has(i + 1) ? 0 : 1;
      if (!wp && !wq) continue;
      p.x += dx * off * (wp / (wp + wq)); p.y += dy * off * (wp / (wp + wq));
      q.x -= dx * off * (wq / (wp + wq)); q.y -= dy * off * (wq / (wp + wq));
    }
    for (const q of P) if (q.y > H - 5) { q.y = H - 5; q.x += (q.px - q.x) * 0.35; }      // it lies on the bench, and drags
  }
  return moved;
}
/** Gas is passing down this tube: for a moment it is seen to. */
function hoseGas(t) { hoseOf(t).gas = performance.now() + 2600; hoseWake(); }
function hoseWake() { hoseStill = 0; if (!hosing) hosing = requestAnimationFrame(hoseTick); }
function hoseTick() {
  hosing = 0;
  let moved = 0, busy = false;
  for (const t of tools("tubing")) {
    if (!nodes[t.id]) continue;
    const h = hoseOf(t);
    moved += hoseStep(t, h) + hoseStep(t, h);
    if (h.gas > performance.now()) busy = true;
    // pulled further than it is long: it comes out of whatever it was led to
    const a = hoseStart(t), b = endOf(t);
    if (t.to && Math.hypot(b.x - a.x, b.y - a.y) > HOSE_LEN * 1.02) {
      t.to = null;
      t.ex = a.x + ((b.x - a.x) * 0.8 * HOSE_LEN) / Math.hypot(b.x - a.x, b.y - a.y) - t.x;
      t.ey = a.y + 60 - t.y;
      say("The rubber tube has pulled out: it will not stretch that far. Bring the two closer together.", null, "no");
      save();
    }
  }
  drawLinks(true);
  hoseStill = moved < 0.6 ? hoseStill + 1 : 0;
  if (busy || hoseStill < 40) hosing = requestAnimationFrame(hoseTick);
}
function hoseSvg(t) {
  const h = hoseOf(t), P = h.p, b = endOf(t), f = (n) => n.toFixed(1);
  // a smooth line through the links: each link is the handle of a curve between the midpoints either side
  let d = `M${f(P[0].x)} ${f(P[0].y)}L${f((P[0].x + P[1].x) / 2)} ${f((P[0].y + P[1].y) / 2)}`;
  for (let i = 1; i < P.length - 1; i++) d += `Q${f(P[i].x)} ${f(P[i].y)} ${f((P[i].x + P[i + 1].x) / 2)} ${f((P[i].y + P[i + 1].y) / 2)}`;
  const e = P[P.length - 1], e1 = P[P.length - 2];
  d += `L${f(e.x)} ${f(e.y)}`;
  // a short glass jet in the far end, pointing the way the tube arrives
  const n = Math.hypot(e.x - e1.x, e.y - e1.y) || 1, ux = (e.x - e1.x) / n, uy = (e.y - e1.y) / n;
  const jet = `M${f(e.x - ux * 2)} ${f(e.y - uy * 2)}L${f(e.x + ux * 13)} ${f(e.y + uy * 13)}`;
  const gas = h.gas > performance.now() ? `<path class="cl-hose__gas" d="${d}" stroke-dashoffset="${f(-(performance.now() / 9) % 40)}"/>` : "";
  return `<path class="cl-hose__edge" d="${d}"/><path class="cl-hose" d="${d}"/><path class="cl-hose__hi" d="${d}" transform="translate(-0.8 -1.5)"/>${gas}
    <path class="cl-jet" d="${jet}"/><path class="cl-jet__bore" d="${jet}"/>
    <g class="cl-end${b.dir === "free" ? " is-free" : ""}" data-end="${t.id}"><circle cx="${f(e.x + ux * 6)}" cy="${f(e.y + uy * 6)}" r="17" fill="transparent"/><circle class="cl-end__dot" cx="${f(e.x + ux * 6)}" cy="${f(e.y + uy * 6)}" r="9"/></g>`;
}
/** Rubber tubing and wires: the things that join two pieces. */
function drawLinks(fromTick = false) {
  let html = "";
  for (const t of tools("tubing")) {
    if (!nodes[t.id]) continue;
    html += hoseSvg(t);
  }
  for (const id of hoses.keys()) if (!byId(id)) hoses.delete(id);
  if (!fromTick && tools("tubing").length) hoseWake();
  for (const p of tools("power")) {
    const v = cellFor(p);
    if (!v) continue;
    const [neg, pos] = rodsIn(v);
    const wire = (rod, tx, cls) => `<path class="cl-wire ${cls}" d="M${p.x + tx} ${p.y - 66}C${p.x + tx} ${p.y - 150} ${rod.x} ${rod.y - 110} ${rod.x} ${rod.y - 28}"/>`;
    html += wire(neg, -14, "is-neg") + wire(pos, 14, "is-pos");
  }
  L.links.innerHTML = html;
  // the rods say which is which once they are wired
  for (const rod of tools("electrode")) {
    const v = rod.on && byId(rod.on);
    const wired = v && rodsIn(v).length === 2 && tools("power").some((p) => cellFor(p) === v);
    const t = nodes[rod.id] && nodes[rod.id].g.querySelector(".cl-pole");
    if (t) t.textContent = wired ? (rod.side < 0 ? "\u2212" : "+") : "";
  }
}
/** The beaker a power pack is wired to: the nearest one with two carbon rods in it. */
function cellFor(p) {
  return nearest(vessels().filter((v) => rodsIn(v).length === 2), (v) => Math.hypot(v.x - p.x, v.y - p.y));
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
    if (o === it || o.on) return false;
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

function addItem(kind, key, x, y, extra = {}) {
  if (kind === "reagent") {
    const have = state.items.find((it) => it.kind === "reagent" && it.key === key);
    if (have) { flash(have); say(`${nameOf(have)} is already out on the bench.`, null, "no"); return null; }
  }
  const it = { id: `i${++state.n}`, kind, key, x: 0, y: 0, ...extra };
  if (kind === "vessel") { it.tag = nextTag(); it.t = newTube(VESSELS[key].cap); }
  state.items.push(it);
  [it.x, it.y] = x == null ? freeSpot(it) : [x, y];
  keepIn(it);
  mount(it);
  // a bottle comes with its stopper in: a piece of its own, to be pulled out
  if (kind === "reagent" && capOf(key)) {
    const m = mouth(it);
    addItem("tool", "cap", m.x, m.y, { v: capOf(key), on: it.id, of: it.id, rgb: colourOf(key) });
  }
  renderDrawer();
  $("cl-hint").hidden = true;
  return it;
}
function removeItem(it) {
  const n = nodes[it.id];
  if (n) { n.g.remove(); if (n.front) n.front.remove(); if (n.veil) n.veil.remove(); }
  delete nodes[it.id];
  state.items = state.items.filter((o) => o !== it);
  state.items.forEach((o) => {
    if (o.rack && o.rack[0] === it.id) { o.rack = null; if (o.flip) { o.flip = false; place(o); paint(o); } }
    if (o.on === it.id) o.on = null;
    if (o.held === it.id) o.held = null;
    if (o.to === it.id) o.to = null;
  });
  state.items.filter((o) => o.key === "cap" && o.of === it.id).forEach(removeItem);     // a bottle takes its stopper with it
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
  Object.values(nodes).forEach((n) => { n.g.remove(); if (n.front) n.front.remove(); if (n.veil) n.veil.remove(); });
  for (const k of Object.keys(nodes)) delete nodes[k];
  state.items = [];
  L.fx.innerHTML = "";
  L.links.innerHTML = "";
  select(null);
  $("cl-hint").hidden = false;
  renderDrawer();
  save();
}

// ── two voices: the sticky note pops up for an OBSERVATION and nothing else;
//    help, hints and refusals are a small line that comes and goes ──
let noteTimer = 0, helpTimer = 0, noteHeld = false;
/** The equations of what has just been seen: the whole one, and the ionic one under it. */
function equationsHtml(obs) {
  const seen = new Set();
  return obs.filter((o) => (o.full || o.eq) && !seen.has(o.full || o.eq) && seen.add(o.full || o.eq)).slice(0, 3).map((o) => `<span class="cl-eqn">${chemHtml(o.full || o.eq)}</span>${o.full && o.eq ? `<span class="cl-eqn cl-eqn--ion"><i>ionic</i>${chemHtml(o.eq)}</span>` : ""}`).join("");
}
function tell(text, v = null, eqs = "") {
  $("cl-say-tag").textContent = v ? nameOf(v) : "Observation";
  $("cl-say-text").textContent = text;
  $("cl-say-eq").innerHTML = eqs;
  $("cl-say-eq").hidden = !eqs;
  noteHeld = true;                  // there is an observation to show
  if (state.notes === false) return;            // put away by the learner: it is in the notebook, and comes back when asked for
  showNote(eqs ? 14000 : 9000);
}
/** Bring the observation note up, for a while. */
function showNote(ms = 12000) {
  const note = $("cl-say");
  note.classList.remove("is-new");
  void note.offsetWidth;
  note.classList.add("is-shown", "is-new");
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => note.classList.remove("is-shown"), ms);
}
/** The learner hides or shows the observation note (its key on the bar, the O key, or a tap on the note itself). */
function setNotes(on) {
  state.notes = on;
  const b = $("cl-note-key");
  const tip = on ? "Hide the observation note (O)" : "Show the observation note (O)";
  b.setAttribute("aria-pressed", String(on));
  b.classList.toggle("is-on", on);
  b.dataset.tip = tip;
  b.setAttribute("aria-label", tip);
  clearTimeout(noteTimer);
  if (!on) $("cl-say").classList.remove("is-shown");
  else if (noteHeld) showNote();
  else say("The observation note is on. It comes up whenever something is seen to happen.");
  save();
}
function say(text, v = null, kind = "") {
  const t = $("cl-toast");
  t.textContent = text;
  t.hidden = false;
  t.classList.toggle("is-no", kind === "no");
  t.classList.remove("is-new");
  void t.offsetWidth;
  t.classList.add("is-new");
  clearTimeout(helpTimer);
  helpTimer = setTimeout(() => (t.hidden = true), 5600);
}

/** Write an action down. Gas that came off goes wherever the vessel is piped to first. */
function record(v, res) {
  if (v.kind === "vessel") gasFlow(v, res);
  const last = state.log[0];
  const same = last && last.id === v.id && last.title === res.title && JSON.stringify(last.obs) === JSON.stringify(res.obs);
  if (same) last.times = (last.times || 1) + 1;
  else state.log.unshift({ id: v.id, tag: v.tag, title: res.title, obs: res.obs, secret: Boolean(v.t && v.t.added && v.t.added.includes("unk")) });
  state.log.length = Math.min(state.log.length, LOG_MAX);
  if (v.kind === "vessel" && v.t.vol > 0) {
    const sp = speciate(v.t);
    if (sp.ppt.BaSO4 && (sp.free.H || 0) > 0.4) res.flags.push("acidproof:BaSO4");
  }
  renderLog();
  noteFlags(res.flags || []);
  const seen = res.obs.map((o) => o.text).join(" ");
  if (actor.onRecord) actor.onRecord(res.flags || [], v);
  // "nothing happened" is worth a line, not a note
  const secret = Boolean(v.t && v.t.added && v.t.added.includes("unk"));
  if (seen && seen !== "No visible change.") tell(seen, v.kind ? v : null, state.explain && !secret ? equationsHtml(res.obs) : "");
  else if (seen) say(seen);
  save();
}
/**
 * A gas has come off in v. Where does it go?
 * A solid stopper is blown out. A one-hole stopper lets it out by the hole, or down the delivery
 * tube that is in the hole. From an OPEN vessel it goes into the room — but a reaction goes on
 * fizzing for a few seconds, so a stopper and tube fitted quickly still catch most of it (catchPuff).
 */
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
    res.obs.push({ text: "The gas pushes the stopper out.", why: "A gas takes up far more room than the solid and liquid it came from. Never stopper a vessel that is making a gas, unless the stopper has a tube through it." });
    return;
  }
  if (!fittedTo(v, "bung1")) { v.puff = { gas: g.gas, n: g.n, at: Date.now() }; return; }
  routeGas(v, g, res);
}
/** The stopper and tube have just been fitted to a vessel that is still fizzing: what is still coming off goes down the tube. */
function catchPuff(v) {
  const p = v && v.puff, tube = v && tubeOf(v);
  if (!p || !tube || !tube.to) return;
  const age = (Date.now() - p.at) / 1000;
  v.puff = null;
  if (age > 10) return;
  const res = { title: "Stoppered while it was still fizzing", obs: [], flags: [], events: [] };
  routeGas(v, { gas: p.gas, n: p.n * (age < 3 ? 1 : 1 - (age - 3) / 7) }, res);
  if (res.obs.length) record(v, res);
}
function routeGas(v, g, res) {
  const tube = tubeOf(v);
  if (!tube) { res.obs.push({ text: "The gas escapes through the hole in the stopper.", why: "The hole is for a delivery tube. Push one into it, and lead its rubber tube to where the gas is to be collected." }); return; }
  hoseGas(tube);
  const c = tube.to && byId(tube.to);
  const name = GAS[g.gas];
  if (!c) { res.obs.push({ text: "The gas comes out of the open end of the rubber tube and is lost.", why: "Drag the end of the rubber tube to a gas jar, a gas syringe or a collecting tube." }); return; }
  if (c.key === "syringe") {
    c.gas = { k: g.gas, n: Math.min(8.34, (c.gas && c.gas.k === g.gas ? c.gas.n : 0) + g.n) };
    dress(c);
    res.obs.push({ text: `The plunger of the gas syringe is pushed out. It reads ${Math.round(c.gas.n * 12)} cm\u00b3.`, why: "A gas syringe measures the volume of a gas directly, whatever the gas is." });
    res.flags.push("measured", "collected:any");
    return;
  }
  const room = VESSELS[c.key].invert || 4;
  const keep = () => {
    c.jar = { k: g.gas, n: Math.min(room, (c.jar && c.jar.k === g.gas ? c.jar.n : 0) + g.n) };
    c.t.gas = g.gas;
    paint(c);
  };
  if (overWater(c)) {
    if (g.gas === "NH3") { res.obs.push({ text: "Nothing collects in the jar.", why: "Ammonia is very soluble in water, so it dissolves in the trough. Collect it in a dry, upturned tube instead." }); return; }
    keep();
    bubble(nodes[c.id].g, c.key, { vol: c.t.cap * 0.5, cap: c.t.cap }, 1);
    res.obs.push({ text: `Bubbles rise through the water into ${plain(c)}: ${Math.round(c.jar.n * 12)} cm\u00b3 collected.`, why: "Collection over water: the gas pushes the water down out of the jar. It works for gases that do not dissolve much." });
    res.flags.push("collected");
  } else if (c.flip) {
    if (!LIGHT.includes(g.gas)) { res.obs.push({ text: `Nothing stays in ${plain(c)}.`, why: `${cap1(name)} is denser than air, so it falls straight out of an upturned tube. Lead the tube down into an upright jar, or collect it over water.` }); return; }
    keep();
    res.obs.push({ text: `The gas rises into ${plain(c)} and pushes the air out at the bottom.`, why: `Upward delivery: ${name} is less dense than air, so it collects at the top of an upturned tube.` });
  } else {
    if (LIGHT.includes(g.gas)) { res.obs.push({ text: `Nothing stays in ${plain(c)}.`, why: `${cap1(name)} is less dense than air, so it rises straight out of an open vessel. Collect it in an upturned tube${g.gas === "H2" ? ", or over water" : ""}.` }); return; }
    keep();
    res.obs.push({ text: `The gas sinks into ${plain(c)} and pushes the air out at the top.`, why: `Downward delivery: ${name} is denser than air, so it collects at the bottom of an open jar.` });
  }
}

// ── using one thing on another ──────────────────────────────────────────────
function nearest(list, score) {
  let best = null, bestD = Infinity;
  for (const o of list) { const d = score(o); if (d >= 0 && d < bestD) { best = o; bestD = d; } }
  return best;
}
/** Vessels that can have something put INTO them: right way up. */
const open = () => vessels().filter((v) => !v.flip);
/** The open vessel whose mouth is straight below a point. */
function below(x, y, not, slack = 14) {
  return nearest(open().filter((v) => v !== not), (v) => {
    const m = mouth(v);
    return Math.abs(m.x - x) < VESSELS[v.key].rTop + 5 && m.y > y - slack ? m.y - y + slack : -1;
  });
}
/** What a carried thing is being held to, if anything. */
function targetOf(it) {
  if (it.kind === "rack") return null;
  if (it.kind === "vessel") {
    const def = VESSELS[it.key];
    if (def.fixed || it.flip) return null;
    const h = heaters().find((b) => Math.abs(it.x - b.x) < 30 && Math.abs(it.y - (b.y - HEAT[b.key])) < 46);
    if (h) return h;
    if (isEmpty(it.t)) return null;
    const cy = it.y + def.top / 2;
    const tub = tools("waste").find((o) => Math.abs(it.x - o.x) < 84 && cy > o.y - 66 - 170 && cy < o.y - 20);
    if (tub) return tub;
    if (it.t.vol + (it.t.oil || 0) <= 0) return null;
    return nearest(open().filter((v) => v !== it && v.id !== (it.rack && it.rack[0])), (v) => {
      const m = mouth(v), dx = Math.abs(it.x - m.x);
      return dx < VESSELS[v.key].rTop + def.rMax + 16 && cy > m.y - 170 && cy < m.y + 30 ? dx : -1;
    });
  }
  if (it.kind === "reagent") {
    if (reagent(it.key).kind === "indicator") return null;      // its dropper is what goes to the liquid
    const b = boxOf(it), cy = it.y + (b.y0 + b.y1) / 2;
    return nearest(open(), (v) => {
      const m = mouth(v), dx = Math.abs(it.x - m.x);
      return dx < VESSELS[v.key].rTop + 48 && cy > m.y - 160 && cy < m.y + 46 ? dx : -1;
    });
  }
  // ── tools ──
  if (GRIPS[it.key]) {
    // carrying something: the only thing it can be taken to is a flame
    const v = loadOf(it);
    if (!v) return null;
    return heaters().find((b) => Math.abs(v.x - b.x) < 34 && Math.abs(v.y - (b.y - HEAT[b.key])) < 52) || null;
  }
  if (IDLE.includes(it.key)) return null;
  if (it.key === "cap" && it.v === "drop") {
    // back into its own bottle, or over a liquid to drip a little in
    const own = byId(it.of);
    if (own && !fittedTo(own, "cap")) { const m = mouth(own); if (Math.abs(it.x - m.x) < 30 && Math.abs(it.y - m.y) < 56) return own; }
    return nearest(open(), (v) => {
      const m = mouth(v), dx = Math.abs(it.x - m.x), tip = it.y + 58;
      return dx < VESSELS[v.key].rTop + 26 && tip > m.y - 50 && tip < m.y + 90 ? dx : -1;
    });
  }
  if (it.key === "cap") {
    return nearest(state.items.filter((o) => o.kind === "reagent" && capOf(o.key) === it.v && !fittedTo(o, "cap")), (o) => {
      const m = mouth(o), dx = Math.abs(it.x - m.x);
      return dx < 34 && Math.abs(it.y - m.y) < 56 ? dx : -1;
    });
  }
  if (it.key === "condenser") {
    return nearest(vessels().filter((v) => VESSELS[v.key].arm && !fittedTo(v, "condenser")), (v) => {
      const s = seat(v, it), d = Math.hypot(it.x - s.x, it.y - s.y);
      return d < 60 ? d : -1;
    });
  }
  if (it.key === "electrode") {
    return nearest(open().filter((v) => { const d = VESSELS[v.key]; return !d.fixed && d.rTop >= 28 && -d.top >= 90 && rodsIn(v).length < 2; }), (v) => {
      const m = mouth(v), dx = Math.abs(it.x - m.x);
      return dx < VESSELS[v.key].rTop + 20 && Math.abs(it.y - m.y) < 70 ? dx : -1;
    });
  }
  if (it.key === "tubing") {
    return nearest(tools("bung1").filter((s) => !fittedTo(s, "tubing")), (s) => {
      const dx = Math.abs(it.x - s.x), dy = Math.abs(it.y - s.y);
      return dx < 36 && dy < 70 ? dx + dy * 0.2 : -1;
    });
  }
  if (it.key === "chroma") {
    // the rod lies across the mouth of a beaker, and the strip hangs inside
    return nearest(open().filter((v) => { const d = VESSELS[v.key]; return !d.fixed && d.rTop >= 26 && -d.top >= 90 && !fittedTo(v, "chroma") && !plugIn(v); }), (v) => {
      const mo = mouth(v), dx = Math.abs(it.x - mo.x);
      return dx < VESSELS[v.key].rTop + 24 && Math.abs(it.y - mo.y) < 70 ? dx : -1;
    });
  }
  if (it.key === "paper") {
    // a filter paper goes in a funnel, and nowhere else
    return nearest(tools("funnel").filter((f) => !fittedTo(f, "paper")), (f) => {
      const dx = Math.abs(it.x - f.x), dy = Math.abs(it.y - (f.y - 28));
      return dx < 52 && dy < 76 ? dx : -1;
    });
  }
  if (PLUGS.includes(it.key)) {
    // a stopper also goes in the mouth of an upturned tube (which is underneath); a funnel does not
    const mouths = it.key === "funnel" ? open() : vessels().filter((v) => !overWater(v));
    return nearest(mouths.filter((v) => !VESSELS[v.key].tap && !plugIn(v)), (v) => {
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
    return nearest(vessels().filter((v) => !VESSELS[v.key].tap && !v.flip), (v) => {
      const def = VESSELS[v.key], dx = Math.abs(it.x - v.x), tip = it.y - HEAT[it.key];
      return dx < Math.min(def.rMax, 60) + 26 && tip > v.y - 84 && tip < v.y + 90 ? dx : -1;
    });
  }
  // what is offered to: open vessels; upturned ones too, to a splint or litmus; an unlit burner to a lighted splint;
  // an open bottle to an empty dropper or pipette
  const atGas = MOUTH.includes(it.key) || it.key === "red" || it.key === "blue";
  const list = atGas ? [...vessels()] : [...open()];
  if (it.key === "lit") list.push(...heaters().filter((b) => !lit(b)));
  if (TAKES[it.key] && !it.sample) list.push(...state.items.filter((o) => o.kind === "reagent" && reagent(o.key).kind === "solution" && !reagent(o.key).oil));
  const atTip = MOUTH.includes(it.key) || it.key === "wire" || it.key === "rod";
  return nearest(list, (o) => {
    const m = HEAT[o.key] ? { x: o.x, y: o.y - HEAT[o.key] + 46 } : mouth(o), r = HEAT[o.key] ? 8 : rimOf(o);
    if (atTip) { const dx = Math.abs(it.x - 34 - m.x), tip = it.y - 58; return dx < r + 32 && tip > m.y - 80 && tip < m.y + 60 ? dx : -1; }
    const dx = Math.abs(it.x - m.x);
    return dx < r + 28 && it.y > m.y - 46 && it.y < m.y + 110 ? dx : -1;
  });
}
const tipping = (it, at) => `translate(${at.x + 6}px, ${at.y - 10}px) rotate(-108deg) translate(0px, ${it.kind === "vessel" ? -VESSELS[it.key].top : mouthOf(it.key)}px)`;

/** How a thing is held while it is being used on `v`. */
function poseOn(it, v) {
  if (GRIPS[it.key]) return `translate(${it.x}px, ${it.y}px)`;                // a tool with something in its grip stays in the hand
  if (fitsOn(it, v)) { const s = seat(v, { ...it, side: sideFor(v, it) }); return `translate(${s.x}px, ${s.y}px)`; }
  if (it.key === "cap") { const m = mouth(v); return `translate(${m.x}px, ${m.y - 62}px)`; }      // a dropper, held over a liquid
  const m = HEAT[v.key] && it.key === "lit" ? { x: v.x, y: v.y - HEAT[v.key] + 46 } : mouth(v);
  if (it.kind === "vessel") return HEAT[v.key] ? `translate(${v.x}px, ${v.y - HEAT[v.key]}px)` : tipping(it, m);
  if (it.kind === "reagent") return reagent(it.key).kind === "indicator" ? `translate(${m.x}px, ${m.y - 24}px)` : tipping(it, m);
  if (HEAT[it.key]) return `translate(${v.x}px, ${Math.min(v.y + HEAT[it.key], H - 8)}px)`;
  if (it.key === "wire" && v.kind === "tool") return `translate(${v.x + 34}px, ${v.y - HEAT[v.key] + 26 + 58}px)`;
  const deep = v.kind === "vessel" && !v.flip ? Math.min((-VESSELS[v.key].top - (VESSELS[v.key].floor || 0)) * 0.62, 96) : v.kind === "reagent" ? 52 : 14;
  if (MOUTH.includes(it.key)) return `translate(${m.x + 34}px, ${m.y + 54 + (v.flip ? 8 : 0)}px)`;
  if (it.key === "wire" || it.key === "rod") return `translate(${m.x + 34}px, ${m.y + 58 + deep}px)`;
  if (it.key === "thermo" || it.key === "meter") return `translate(${m.x}px, ${m.y + deep}px)`;
  if (TAKES[it.key]) return `translate(${m.x}px, ${m.y + (it.sample ? -4 : deep)}px)`;
  return `translate(${m.x}px, ${m.y + (v.flip ? 44 : 18)}px)`;
}
/** Is this a thing being FITTED to that (and left there), rather than used on it? A dropper over a liquid is being used. */
const fitsOn = (it, target) => STAYS.includes(it.key) && !(it.key === "cap" && target.kind === "vessel");
/** Which side of a beaker a carbon rod goes: the first on the left, the second on the right. */
const sideFor = (v, it) => (it.key !== "electrode" ? 0 : rodsIn(v).some((r) => r !== it && r.side < 0) ? 1 : -1);

function fx(html, ms = 900) {
  const g = document.createElementNS(NS, "g");
  g.innerHTML = html;
  L.fx.appendChild(g);
  setTimeout(() => g.remove(), ms);
}
// ── liquid in the air ───────────────────────────────────────────────────────
// A stream is a line of PARCELS of liquid. Each is let go at the lip and then belongs to
// gravity: it speeds up as it falls, so the stream stretches and thins on the way down
// (the same volume passing every second, going faster, must be narrower), and where the
// parcels have drawn too far apart it breaks into drops. Where it lands it throws up
// droplets that fly and fall on their own, and rings spread on the surface.
// VISCOSITY (mu, 0 water … 1 a thick oil) holds a liquid back: it falls slower, as a
// fatter rope that does not break or splash, wavers as it lands and heaps up a little.
const GRAV = 2300;                 // bench units a second, each second
const flows = {};
let flowing = 0, flowAt = 0;
const THICK = { oil: 0.9, h2so4: 0.24, h2o2: 0.08 };
const OIL_RGB = [226, 196, 92];
const viscOf = (it) => (it.kind === "reagent" ? THICK[it.key] ?? 0.04 : it.t && it.t.oil > 0 ? 0.9 : 0.04);
/**
 * Liquid running from the lip `a` to the surface at `b`. Called again and again while the
 * pouring goes on; left alone, the last of it falls and the stream is gone. `dir` is the way
 * the lip faces (-1 left, 1 right).
 */
function flow(key, a, b, c, dir = -1, mu = 0.04, thin = 1) {
  let f = flows[key];
  if (!f) {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "cl-flow");
    g.innerHTML = `<path class="cl-flow__plume"/><g class="cl-flow__fizz"></g><ellipse class="cl-flow__ring"/><ellipse class="cl-flow__ring"/><path class="cl-flow__heap"/><path class="cl-flow__body"/><path class="cl-flow__core"/><path class="cl-flow__shine"/><g class="cl-flow__drops"></g>`;
    L.fx.appendChild(g);
    f = flows[key] = { g, parts: [], spray: [], fizz: [], rings: [0.3, 0], owed: 0, hits: 0, t: 0 };
  }
  Object.assign(f, { a, b, c, dir, mu, thin, until: performance.now() + (thin < 1 ? 520 : 900) });
  if (!flowing) { flowAt = performance.now(); flowing = requestAnimationFrame(flowTick); }
}
function flowTick(now) {
  flowing = 0;
  const dt = Math.min(0.034, Math.max(0.001, (now - flowAt) / 1000));
  flowAt = now;
  for (const [key, f] of Object.entries(flows)) {
    const on = now < f.until;
    const mu = f.mu;
    const g = GRAV * (1 - 0.55 * mu), drag = 5.5 * mu;
    const [plume, fizzEl, ring1, ring2, heap, body, core, shine, dropsEl] = f.g.children;
    f.t += dt;
    if (on) {
      f.owed += dt * 120;
      while (f.owed >= 1) {
        f.owed -= 1;
        // a bottle does not pour evenly: air has to get in as the liquid gets out, so the
        // stream swells and narrows, and the swellings travel down it (a thick liquid, less)
        const glug = f.thin < 1 ? 1 : 1 + (1 - mu) * (0.2 * Math.sin(f.t * 15) + 0.1 * Math.sin(f.t * 37 + 1));      // a tap runs evenly
        f.parts.push({ ax: f.a.x, ay: f.a.y, bx: f.b.x, fall: Math.max(10, f.b.y - f.a.y), x: f.a.x, y: f.a.y, vy: 40 * (1 - 0.6 * mu), k: glug, ph: Math.random() * 6.28 });
      }
    }
    // fall
    for (const p of f.parts) {
      p.vy += (g - drag * p.vy) * dt;
      p.y += p.vy * dt;
      const u = clamp((p.y - p.ay) / p.fall, 0, 1);
      // sideways it keeps the speed it left with, so across goes as the square root of down: a parabola
      p.u = u;
      p.x = p.ax + (p.bx - p.ax) * Math.sqrt(u) + (mu > 0.5 ? Math.sin(now * 0.016 + p.ph * 0.2) * 2.6 * u * u : 0);
    }
    // land
    let hitV = 0;
    while (f.parts.length && f.parts[0].y >= f.parts[0].ay + f.parts[0].fall) {
      const p = f.parts.shift();
      f.hits++;
      hitV = p.vy;
      const hard = clamp(p.vy / 620, 0.25, 1.7) * (1 - mu);
      if (mu < 0.5 && f.hits % 2 === 0) {
        // the crown: droplets thrown up and out, the harder the liquid lands
        const s = Math.random() < 0.5 ? -1 : 1;
        f.spray.push({ x: p.bx + s * (1 + Math.random() * 5), y: p.ay + p.fall, vx: s * (30 + Math.random() * 150) * hard, vy: -(130 + Math.random() * 260) * hard, r: 0.9 + Math.random() * 2, life: 0 });
      }
      if (mu < 0.5 && f.hits % 3 === 0) {
        // and air carried under: bubbles that go down with the jet and then rise
        f.fizz.push({ x: p.bx + (Math.random() - 0.5) * 9, y: p.ay + p.fall + 3, vy: 60 + Math.random() * 110 * hard, r: 0.8 + Math.random() * 1.6, life: 0 });
      }
    }
    const box = f.walls;                                 // the glass it is falling into, if it is falling into any
    for (const d of f.spray) {
      d.vy += GRAV * 0.8 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life += dt;
      if (!box) continue;
      // a droplet meets the wall and runs back; none of it leaves by the mouth
      const up = clamp((box.surface - d.y) / Math.max(1, box.surface - box.rim), 0, 1);
      const half = Math.max(2, box.half + (box.rimHalf - box.half) * up - d.r - 1);
      if (d.x < box.x - half) { d.x = box.x - half; d.vx = Math.abs(d.vx) * 0.3; d.vy *= 0.6; }
      else if (d.x > box.x + half) { d.x = box.x + half; d.vx = -Math.abs(d.vx) * 0.3; d.vy *= 0.6; }
      if (d.y < box.rim + 5) { d.y = box.rim + 5; d.vy = Math.abs(d.vy) * 0.2; }
    }
    f.spray = f.spray.filter((d) => d.life < 0.7 && d.y < f.b.y + 3);
    for (const q of f.fizz) { q.vy -= 420 * dt; q.y += q.vy * dt; q.x += Math.sin(q.life * 22 + q.r * 9) * 0.4; q.life += dt; }
    const bed = f.floor ?? f.b.y + 26;          // the bottom of what it is falling into
    if (box) for (const q of f.fizz) q.x = clamp(q.x, box.x - box.half + q.r + 1, box.x + box.half - q.r - 1);
    f.fizz = f.fizz.filter((q) => q.life < 0.75 && q.y > f.b.y + 1 && q.y < bed - 2);
    // draw: from the lip downwards, the newest parcel first
    const pts = f.parts.slice().reverse().map((p) => ({ x: p.x, y: p.y, v: p.vy, k: p.k, u: p.u || 0 }));
    if (on && pts.length) pts.unshift({ x: f.a.x, y: f.a.y, v: 40, k: pts[0].k, u: 0 });
    const w0 = 8.4 * (1 + 0.5 * mu) * f.thin;
    // the same amount passes every point each second, so where it goes faster it is narrower;
    // just at the lip it is still a flat sheet, wider than the round stream it gathers into
    const width = (p) => w0 * p.k * clamp(Math.sqrt(140 / Math.max(140, p.v)), 0.34 + 0.4 * mu, 1) * (1 + 0.45 * Math.max(0, 1 - p.u * 9));
    const gapMax = 11 + 60 * mu + (f.thin < 1 ? 5 : 0);
    const strands = [];
    let cur = [];
    pts.forEach((p, i) => {
      if (i && Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > gapMax) { strands.push(cur); cur = []; }
      cur.push(p);
    });
    if (cur.length) strands.push(cur);
    let d = "", mid = "", hi = "", blobs = "";
    for (const s of strands) {
      if (s.length < 3) {
        // a parcel on its own is a drop, drawn out along the way it is falling
        for (const p of s) { const r = width(p) * 0.6; blobs += `<ellipse cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * clamp(1 + p.v / 800, 1, 2)).toFixed(1)}"/>`; }
        continue;
      }
      const left = [], right = [];
      s.forEach((p, i) => {
        const q = s[Math.min(s.length - 1, i + 1)], o = s[Math.max(0, i - 1)];
        const tx = q.x - o.x, ty = q.y - o.y, n = Math.hypot(tx, ty) || 1, h = width(p) / 2;
        left.push(`${(p.x - (ty / n) * h).toFixed(1)} ${(p.y + (tx / n) * h).toFixed(1)}`);
        right.push(`${(p.x + (ty / n) * h).toFixed(1)} ${(p.y - (tx / n) * h).toFixed(1)}`);
      });
      const end = s[s.length - 1], er = width(end) / 2;
      d += `M${left.join("L")}A${er.toFixed(1)} ${er.toFixed(1)} 0 0 0 ${right[right.length - 1]}L${right.reverse().join("L")}z`;
      mid += `M${s.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L")}`;
      hi += `M${s.map((p) => `${(p.x - width(p) * 0.26).toFixed(1)} ${p.y.toFixed(1)}`).join("L")}`;
    }
    const dark = f.c.map((n) => Math.round(n * 0.55));
    body.setAttribute("d", d);
    body.style.fill = `rgba(${f.c},${0.8 + 0.16 * mu})`;
    body.style.stroke = `rgba(${dark},0.75)`;          // glass-clear liquid is darkest at its edges, where the light is bent away
    core.setAttribute("d", mid);
    core.style.strokeWidth = (w0 * 0.3).toFixed(1);
    shine.setAttribute("d", hi);
    dropsEl.innerHTML = blobs + f.spray.map((s) => `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.r.toFixed(1)}" opacity="${(1 - s.life / 0.7).toFixed(2)}"/>`).join("");
    dropsEl.style.fill = `rgba(${f.c},0.94)`;
    fizzEl.innerHTML = f.fizz.map((q) => `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${q.r.toFixed(1)}" opacity="${(1 - q.life / 0.75).toFixed(2)}"/>`).join("");
    // where it lands: a pale jet driven under, rings on a thin liquid, a small heap on a thick one
    const landing = f.hits > 0 && (on || f.parts.length > 0);
    if (hitV) f.deep = Math.min(clamp(hitV / 30, 6, 30) * (1 - 0.7 * mu), Math.max(0, (bed - f.b.y) / 2.2));
    const dp = landing ? f.deep || 0 : 0, pw = w0 * 0.9;
    plume.setAttribute("d", dp > 2 ? `M${(f.b.x - pw).toFixed(1)} ${f.b.y.toFixed(1)}Q${f.b.x.toFixed(1)} ${(f.b.y + dp * 2.1).toFixed(1)} ${(f.b.x + pw).toFixed(1)} ${f.b.y.toFixed(1)}z` : "");
    f.rings = f.rings.map((t, i) => (landing || t > 0 ? (t + dt / (0.5 + 0.6 * mu)) % 1 : i ? 0 : 0.5));
    [ring1, ring2].forEach((el, i) => {
      const t = f.rings[i];
      el.setAttribute("cx", f.b.x.toFixed(1));
      el.setAttribute("cy", f.b.y.toFixed(1));
      el.setAttribute("rx", Math.min(box ? Math.max(3, Math.min(box.x + box.half - f.b.x, f.b.x - (box.x - box.half)) - 1) : 99, 4 + t * 26 * (1 - 0.5 * mu)).toFixed(1));
      el.setAttribute("ry", (1 + t * 3.8).toFixed(1));
      el.style.opacity = landing ? ((1 - t) * 0.7 * (1 - 0.5 * mu)).toFixed(2) : "0";
    });
    heap.setAttribute("d", landing && mu > 0.5 ? `M${(f.b.x - 11).toFixed(1)} ${(f.b.y + 0.5).toFixed(1)}q11 -9 22 0z` : "");
    heap.style.fill = `rgba(${f.c},0.95)`;
    if (!on && !f.parts.length && !f.spray.length && !f.fizz.length) { f.g.remove(); delete flows[key]; }
  }
  if (Object.keys(flows).length) flowing = requestAnimationFrame(flowTick);
}
/** The inside of a vessel, as far as a splash is concerned: where the liquid is, how wide, and where the mouth is. */
function wallsOf(v) {
  const def = VESSELS[v.key], n = nodes[v.id];
  const rx = n ? Number(n.g.querySelector(".cl-meniscus").getAttribute("rx")) : 0;
  return { x: v.x, half: rx > 2 ? rx : def.rTop - 2, rimHalf: def.rTop - 2, rim: v.y + def.top, surface: v._surface ?? v.y - 8 };
}
/** From the tip of a burette or a separating funnel, straight down into `v`: a thin, even thread. */
function tapStream(bur, v, c, mu) {
  const key = `tap-${bur.id}`;
  flow(key, { x: bur.x, y: bur.y + 1 }, { x: bur.x, y: Math.max(bur.y + 12, v._surface) }, c, 1, mu, 0.34);
  flows[key].floor = v.y - (VESSELS[v.key].floor || 0);
  flows[key].walls = wallsOf(v);
}
/** A bottle or a vessel held tipped at the mouth of `v`: out over the lip, and down in an arc. */
function stream(v, c, mu) {
  const m = mouth(v), reach = Math.min(16, VESSELS[v.key].rTop * 0.5);
  flow("pour", { x: m.x + 7, y: m.y - 11 }, { x: m.x - reach, y: v._surface }, c, -1, mu);
  flows.pour.floor = v.y - (VESSELS[v.key].floor || 0);
  flows.pour.walls = wallsOf(v);
}

// ── shaking ─────────────────────────────────────────────────────────────────
// A vessel moved quickly to and fro in the hand is being SHAKEN. How hard is the hand's own
// speed: the faster the mouse, the further the liquid is thrown and the more it froths. Let go,
// it has been mixed: a precipitate or sand is thrown up through it, a pellet is broken up.
function shakeWatch(v, dx, dy) {
  const now = performance.now();
  const s = (drag.shake = drag.shake || { t: now, dir: [0, 0], flips: [], speed: 0, fx: 0, peak: 0, v });
  const dt = Math.max(8, now - s.t);
  s.t = now;
  s.speed = s.speed * 0.72 + ((Math.hypot(dx, dy) / dt) * 1000) * 0.28;          // bench units a second, smoothed
  [dx, dy].forEach((d, k) => {
    if (Math.abs(d) < 1.2) return;
    const way = Math.sign(d);
    if (s.dir[k] && way !== s.dir[k] && s.speed > 240) s.flips.push(now);      // the hand has turned back on itself, at speed
    s.dir[k] = way;
  });
  s.flips = s.flips.filter((t) => now - t < 900);
  if (s.flips.length < 3 || v.t.vol + (v.t.oil || 0) <= 0 || !nodes[v.id]) return;
  const hard = clamp(s.speed / 850, 0.25, 1.7);
  s.peak = Math.max(s.peak, hard);
  kick(v, (way0(dx) || (Math.random() < 0.5 ? -1 : 1)) * -150 * hard);
  if (now - s.fx > 300) {
    s.fx = now;
    bubble(nodes[v.id].g, v.key, v.t, 0.4 + hard * 1.4);
    if (Object.keys(speciate(v.t).ppt).length) paint(v, { fresh: true });
  }
}
const way0 = (d) => (Math.abs(d) < 0.5 ? 0 : Math.sign(d));
/** It has been shaken, and put down. */
function shaken(v, hard) {
  if (!nodes[v.id] || v.t.vol + (v.t.oil || 0) <= 0) return;
  v.t.packed = false;
  v._poured = false;
  const sandy = (v.t.solid.sand || 0) > 0 && v.t.vol > 0;
  if (sandy) v.t.susp = true;
  const cloudy = Object.keys(speciate(v.t).ppt).length > 0;
  if (cloudy) paint(v, { fresh: true });
  const oily = (v.t.oil || 0) > 0 && v.t.vol > 0;
  const text = cloudy ? "Shaken: the precipitate is thrown up all through the liquid, and slowly settles again."
    : sandy ? "Shaken: the sand is thrown up through the water. Poured now, it goes over with the liquid."
    : oily ? "Shaken: the oil breaks into droplets all through the water, then rises and gathers on top again." : "";
  const why = cloudy || sandy ? "Shaking mixes, but it cannot make an insoluble solid dissolve. Left alone it settles." : oily ? "Oil and water do not mix. Shaking only breaks the oil into droplets for a while: an emulsion that separates again." : undefined;
  record(v, { title: hard > 0.9 ? "Shaken hard" : "Shaken", obs: text ? [{ text, why }] : [], flags: ["swirled", "shaken"] });
  if (!text) say(hard > 0.9 ? "Shaken hard: it is thoroughly mixed." : "Shaken gently: the liquid is mixed. Shake faster to mix it harder.", v);
}

// ── liquid has weight: it lags behind a vessel that is moved, and rocks until it settles ──
const waves = new Map();           // item id → { a: the surface's tilt in degrees, w: how fast it is turning }
let waving = 0;
/** Give the liquid in a piece a push. */
function kick(it, push) {
  if (!nodes[it.id] || !nodes[it.id].g.querySelector(".cl-level")) return;
  const wv = waves.get(it.id) || { a: 0, w: 0 };
  wv.w = clamp(wv.w + push, -260, 260);
  waves.set(it.id, wv);
  if (!waving) waving = requestAnimationFrame(rock);
}
function rock() {
  waving = 0;
  const dt = 1 / 60;
  for (const [id, wv] of waves) {
    const n = nodes[id];
    wv.w += (-150 * wv.a - 5.2 * wv.w) * dt;      // a spring, lightly damped: about two rocks a second, gone in a second and a half
    wv.a = clamp(wv.a + wv.w * dt, -24, 24);
    const done = !n || (Math.abs(wv.a) < 0.05 && Math.abs(wv.w) < 0.6);
    if (n) n.g.querySelector(".cl-level").style.rotate = done ? "" : `${wv.a.toFixed(2)}deg`;
    if (done) waves.delete(id);
  }
  if (waves.size) waving = requestAnimationFrame(rock);
}
/** Swirl a vessel: it is moved in a small circle and the liquid goes round after it. */
function swirl(v, by = "hand") {
  const g = nodes[v.id].g;
  g.classList.remove("is-swirling");
  void g.getBoundingClientRect();
  g.classList.add("is-swirling");
  let n = 0;
  const push = () => { if (!nodes[v.id] || n > 12) return; kick(v, (n % 2 ? -1 : 1) * (70 - n * 4)); n++; setTimeout(push, 130); };
  push();
  setTimeout(() => nodes[v.id] && nodes[v.id].g.classList.remove("is-swirling"), 1900);
  v.t.packed = false;                // stirring breaks a pellet up
  v._poured = false;
  const sandy = (v.t.solid.sand || 0) > 0 && v.t.vol > 0;
  if (sandy) v.t.susp = true;
  const cloudy = Object.keys(speciate(v.t).ppt).length > 0;
  if (cloudy) paint(v, { fresh: true });
  if (sandy && !cloudy) { record(v, { title: by === "rod" ? "Stirred with a glass rod" : "Swirled", obs: [{ text: "The sand is stirred up through the water. Poured now, it goes over with the liquid.", why: "Sand does not dissolve: stirring only spreads it through the water for a while. Left alone it settles, and the water can be poured off it." }], flags: ["swirled"] }); return; }
  record(v, { title: by === "rod" ? "Stirred with a glass rod" : "Swirled", obs: cloudy ? [{ text: "The precipitate is stirred up through the liquid, and slowly settles again.", why: "A precipitate is a solid that does not dissolve: stirring spreads it out but cannot make it go into solution." }] : [], flags: ["swirled"] });
  if (!cloudy) say(v.t.vol > 0 ? "The liquid swirls round and mixes." : "There is no liquid in it to swirl.");
}
const drops = (from, to, c, r = 2.6, spread = 0) => fx([0, 1, 2].map((k) => `<circle class="cl-dropin" cx="${from[0] + (k - 1) * spread}" cy="${from[1]}" r="${r}" fill="rgb(${c})" style="--fall:${Math.round(to - from[1])}px;animation-delay:${k * 0.13}s"/>`).join(""), 1000);

// ── a bottle holds only so much ─────────────────────────────────────────────
// What is poured out of a bottle is no longer in it: its level falls as the vessel's rises, and
// an empty bottle pours nothing until it is refilled (from its own note). A solution bottle
// holds 250 cm³ (125 portions), a jar twelve spatula measures, an indicator bottle thirty squirts.
const FULL = { solution: 125, solid: 12, indicator: 30 };
const DROP = { solution: 58, solid: 37, indicator: 41 };          // how far the contents sink in the drawing, full to empty
const fullOf = (it) => FULL[reagent(it.key).kind];
const leftIn = (it) => it.left ?? fullOf(it);
function takeStock(it, n) {
  it.left = Math.max(0, leftIn(it) - n);
  if (it.left < 1e-6) it.left = 0;
  dress(it);
}
/** An empty bottle says so. */
function ranOut(bottle) {
  if (leftIn(bottle) > 1e-6) return false;
  say(`The ${reagent(bottle.key).name} has run out. Refill the ${reagent(bottle.key).kind === "solid" ? "jar" : "bottle"}: it is in its own note.`, null, "no");
  flash(bottle);
  return true;
}
/** How much goes in at a time: a few drops, or a twelfth of what the vessel holds. */
const measure = (v) => (state.dose === "drops" ? 0.25 : Math.max(1, VESSELS[v.key].cap / 12));
/** A stopper is in the way. */
function stoppered(v) {
  const s = stopperOf(v);
  if (!s) return false;
  say(s.key === "bung1" ? "The stopper is in the way. Take it out, pour, and put it straight back: a reaction goes on fizzing for a few seconds, and the tube will still catch the gas." : "Take the stopper out first.", v, "no");
  return true;
}
/** A bottle with its stopper still in pours nothing. */
function capped(bottle) {
  if (!fittedTo(bottle, "cap")) return false;
  say(`Pull the stopper out of the ${reagent(bottle.key).name} first: drag it off and put it down.`, null, "no");
  flash(bottle);
  return true;
}
/**
 * Put a sample of liquid into vessel v — through the filter paper, if a funnel is sitting in it.
 * Returns the result (already painted and written down), or null if it would not go in.
 */
function deliver(v, s, from, c, flag) {
  if (roomIn(v.t) < s.vol + (s.oil || 0) - 1e-6) { say("It is full. Empty it, or use another one.", v, "no"); return null; }
  const funnel = fittedTo(v, "funnel");
  const paper = funnel && fittedTo(funnel, "paper");
  let cloudy = false;
  if (funnel && !paper) { try { cloudy = Object.keys(speciate(s).ppt).length > 0; } catch { cloudy = false; } }
  const residue = paper ? filterOut(s) : [];
  const res = pourIn(v.t, s, from);
  if (flag) res.flags.push(flag);
  if (paper) { paper.wet = c || [200, 224, 240]; dress(paper); }
  if (cloudy) say("There is no filter paper in the funnel, so the solid runs straight through with the liquid.", v, "no");
  if (residue.length) {
    const big = residue.reduce((a, b) => (b.n > a.n ? b : a));
    paper.residue = big.rgb;
    dress(paper);
    res.obs.unshift({ text: `${cap1(big.colour)} solid is left behind in the filter paper. The liquid that runs through is clear.`, why: `Filtration: the residue is ${big.name}, {${big.formula}}, which is insoluble and too big to pass through the paper. What runs through is the filtrate.` });
    res.obs = res.obs.filter((o) => o.text !== "No visible change.");
    res.flags.push("filtered");
  }
  const painted = paint(v, { fresh: res.flags.some((f) => f.startsWith("ppt:")) });
  kick(v, (Math.random() < 0.5 ? -1 : 1) * 26);
  if (res.flags.some((f) => f.startsWith("gas:"))) bubble(nodes[v.id].g, v.key, v.t);
  if (c) v._surface = v.y - Math.max(painted.level, 10);
  record(v, res);
  const strip = fittedTo(v, "chroma");
  if (strip) setTimeout(() => nodes[strip.id] && runChroma(strip), 700);
  return res;
}
/** Pour a measure from an open bottle into v. */
function pourReagent(bottle, v, amount) {
  const r = reagent(bottle.key);
  if (ranOut(bottle)) return null;
  if (r.kind === "solution") amount = Math.min(amount, leftIn(bottle));          // the last of it
  const res = add(v.t, bottle.key, r.kind === "solution" ? amount : state.dose, bottle.k || 1);
  if (res.refused) { say(res.refused, v, "no"); return null; }
  takeStock(bottle, r.kind === "solution" ? amount : 1);
  res.flags.push(`added:${bottle.key}`, `in:${v.key}:${bottle.key}`);
  const painted = paint(v, { fresh: res.flags.some((f) => f.startsWith("ppt:")) });
  kick(v, (Math.random() < 0.5 ? -1 : 1) * 26);
  v._surface = v.y - Math.max(painted.level, 10);
  if (res.flags.some((f) => f.startsWith("gas:"))) bubble(nodes[v.id].g, v.key, v.t, res.flags.includes("gas:O2") ? 1.8 : 1);
  record(v, res);
  const strip = fittedTo(v, "chroma");
  if (strip) setTimeout(() => nodes[strip.id] && runChroma(strip), 700);
  return res;
}

/**
 * Do the thing: `it` on `v`. Returns true when holding it there should do it again
 * (a bottle goes on pouring), false when once is all there is.
 */
function use(it, v) {
  // ── a holder or tongs with something in its grip, held in a flame ──
  if (GRIPS[it.key]) {
    const held = loadOf(it);
    return held && HEAT[v.key] ? warm(v, held) : false;
  }
  // ── a vessel is the thing being carried ──
  if (it.kind === "vessel") {
    if (HEAT[v.key]) return warm(v, it);
    if (v.key === "waste") {
      const res = rinse(it.t);
      it.jar = null;
      nodes[it.id].g.querySelector(".cl-bubbles").innerHTML = "";
      paint(it);
      record(it, { ...res, title: "Poured into the waste tub" });
      return false;
    }
    if (stoppered(v) || stoppered(it)) return false;
    const n = Math.min(measure(v), it.t.vol + (it.t.oil || 0));
    if (n <= 0) return false;
    if (roomIn(v.t) < n - 1e-6) { say("It is full. Empty it, or use another one.", v, "no"); return false; }
    const c = look(it.t).rgb;
    const hadSand = (it.t.solid.sand || 0) > 0;
    const pellet = Boolean(it.t.packed) && Object.keys(speciate(it.t).ppt).length > 0;
    const part = takeFrom(it.t, n);
    const res = deliver(v, part, plain(it), c);
    paint(it, { tilt: -108 });
    if (res) stream(v, c, viscOf(it));
    if (res && pellet && !it._poured) {
      it._poured = true;
      noteFlags(["supernatant"]);
      if (actor.onRecord) actor.onRecord(["supernatant"], it);
      say("The clear supernatant pours off, and the pellet stays at the bottom of the tube.", it);
    }
    if (res && hadSand && (it.t.solid.sand || 0) > 0 && !state.seen.includes("decanted:" + it.id)) {
      state.seen.push("decanted:" + it.id);
      noteFlags(["decanted"]);
      if (actor.onRecord) actor.onRecord(["decanted"], it);
      say("The clear liquid pours off and the sand stays where it settled: that is decanting.", it);
    }
    save();
    return Boolean(res) && it.t.vol + (it.t.oil || 0) > 0;
  }
  // ── a dropper from an indicator bottle, over a liquid ──
  if (it.key === "cap") {
    const bottle = byId(it.of);
    if (!bottle) return false;
    if (ranOut(bottle)) return false;
    const res = add(v.t, bottle.key);
    if (res.refused) { say(res.refused, v, "no"); return false; }
    takeStock(bottle, 1);
    res.flags.push(`ind:${bottle.key}`);
    const m = mouth(v), painted = paint(v);
    drops([m.x, m.y - 4], v.y - Math.max(painted.level, 10), colourOf(bottle.key));
    record(v, res);
    return false;
  }
  // ── a lighted splint, at a burner ──
  if (HEAT[v.key] && it.key === "lit") {
    v.flame = 1;
    dress(v);
    say(`The ${nameOf(v).toLowerCase()} is lit.`);
    save();
    return false;
  }
  // ── the wire, in a flame ──
  if (it.key === "wire" && v.kind === "tool") {
    if (!lit(v)) { say("The burner is not lit. Turn it up with its + key.", null, "no"); return false; }
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
  // ── a dropper or pipette, filling from a bottle ──
  if (v.kind === "reagent") {
    if (capped(v)) return false;
    if (ranOut(v)) return false;
    const drawn = Math.min(TAKES[it.key], leftIn(v));
    it.sample = sampleOf(v.key, drawn, v.k || 1);
    takeStock(v, drawn);
    it.rgb = colourOf(v.key);
    dress(it);
    say(`The ${nameOf(it).replace(/ \(.*/, "").toLowerCase()} is holding ${cm3(drawn)} of ${reagent(v.key).name}. Carry it to a vessel.`);
    save();
    return false;
  }

  const node = nodes[v.id].g;
  const m = mouth(v);
  if (it.kind === "reagent") {
    if (capped(it) || stoppered(v)) return false;
    const r = reagent(it.key);
    const res = pourReagent(it, v, measure(v));
    if (!res) return false;
    const c = it.key === "oil" ? OIL_RGB : colourOf(it.key);
    if (r.kind === "solution") stream(v, c, viscOf(it));
    else if (r.kind === "indicator") drops([m.x, m.y - 26], v._surface, c);
    else drops([m.x + 6, m.y - 10], v._surface, c, 3.4, 5);
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
      say(`The ${what} is holding ${cm3(s.vol + (s.oil || 0))} of the liquid from ${plain(v)}. Carry it to another vessel.`, v);
      save();
      return false;
    }
    if (stoppered(v)) return false;
    const c = it.rgb || [200, 224, 240];
    const res = deliver(v, it.sample, `the ${what}`, c, it.key === "pipette" ? `pipetted:${(it.sample.added || []).join("+")}` : null);
    if (!res) return false;
    drops([m.x, m.y - 2], v._surface, c);
    it.sample = null;
    dress(it);
    save();
    return false;
  }
  if (it.key === "rod") { swirl(v, "rod"); return false; }
  if (it.key === "magnet") {
    if (it.sample) { say("The magnet is already bearded with filings. Wipe them off first: it is in the magnet's own note.", null, "no"); return false; }
    const rest = Object.keys(v.t.solid).filter((k) => (v.t.solid[k] || 0) > 0).map((k) => ({ sand: "sand", rocksalt: "salt", S: "sulfur", I2: "iodine", CaCO3: "marble", CuO: "copper(II) oxide", MnO2: "manganese(IV) oxide", crystals: "crystals" }[k]));
    const got = magnetOut(v.t);
    if (!got) { say(isEmpty(v.t) ? "There is nothing in there." : "Nothing in there is pulled to the magnet.", v); return false; }
    it.sample = { fe: got };
    dress(it);
    paint(v);
    record(v, { title: "Held a magnet over it", obs: [{ text: `The iron filings jump up and cling to the poles of the magnet.${rest.length ? ` The ${rest.join(" and ")} ${rest.length > 1 ? "are" : "is"} left behind.` : ""}`, why: "Iron is magnetic. Sulfur, sand and salt are not. In a MIXTURE each substance keeps its own properties, so a magnet takes the iron out and changes nothing." }], flags: ["magnet"] });
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
  if (res.refused) { say(v.flip ? "There is no gas in there to test yet." : res.refused, v, "no"); return false; }
  showTest(it, res);
  if (v.flip) res.flags.push("at:up");
  if (!v.t.gas && v.jar) v.jar = null;                       // hydrogen is burnt in the test
  paint(v);
  record(v, res);
  return false;
}
/** A test tool shows its answer: the splint flares, the paper turns, the meter reads. */
function showTest(it, res) {
  const g = nodes[it.id].g;
  const [, a, b] = res.fx.split("-");
  if (MOUTH.includes(it.key)) { g.querySelector(".cl-after").innerHTML = splintAfter(res.fx); g.dataset.end = res.fx; }
  else if (it.key === "ph") dipPaper(g, `rgb(${a})`);
  else if (it.key === "meter") g.querySelector(".cl-lcd").textContent = a;
  else if (it.key === "thermo") { const len = 22 + Number(a) * 1.1; const col = g.querySelector(".cl-merc"); col.setAttribute("y", -4 - len); col.setAttribute("height", len); }
  else dipPaper(g, b === it.key ? "" : b === "blue" ? "#4f84d6" : "#de5a52");
}
/** A strip of test paper has touched something: the end darkens as it wets, and its new colour (if it has one) creeps up from there. */
const PAPERS = ["red", "blue", "ph"];
const freshening = new Map();
/** A used strip is thrown away and a fresh one taken: the paper is its own colour again. */
function freshLater(it, ms = 2600) {
  if (!PAPERS.includes(it.key)) return;
  clearTimeout(freshening.get(it.id));
  freshening.set(it.id, setTimeout(() => { if (nodes[it.id] && !(drag && drag.it === it && drag.over)) resetTool(it); }, ms));
}
function dipPaper(g, colour) {
  const turn = g.querySelector(".cl-turn");
  if (!turn) return;
  turn.style.fill = colour || "transparent";
  g.classList.remove("is-dipped");
  void g.getBoundingClientRect();
  g.classList.add("is-dipped");
}
/** Heat a vessel. A distilling flask sends water over; a dish boils down to crystals. Returns true to go on heating. */
function warm(heater, v) {
  if (!lit(heater)) { say(`The ${nameOf(heater).toLowerCase()} is not lit. Turn it up with its + key, or hold a lighted splint to it.`, null, "no"); return false; }
  const power = [0, 0.6, 1, 1.6][heater.flame];             // a bigger flame boils things away faster
  const def = VESSELS[v.key];
  const res = heat(v.t);
  if (res.refused) { say(res.refused, v, "no"); return false; }
  if (res.flags.includes("sublimed")) {
    const gv = nodes[v.id].g;
    gv.classList.add("is-iodine");
    setTimeout(() => nodes[v.id] && nodes[v.id].g.classList.remove("is-iodine"), 6000);
    paint(v);
    record(v, res);
    return false;
  }
  let more = false;
  const noNone = () => { res.obs = res.obs.filter((o) => !/No other change/.test(o.text)); };
  if (def.arm) {
    noNone();
    const cond = fittedTo(v, "condenser");
    if (!cond) {
      const w = boilOff(v.t, def.cap * 0.06 * power);
      if (w.gone > 0) { res.obs.push({ text: "The liquid boils, and steam pours out of the side arm into the room.", why: "Push a condenser onto the side arm: it cools the steam back to water so that it can be collected." }); more = true; } else res.obs.push({ text: "Stop heating: the flask must not boil dry." });
    } else {
      const out = { x: cond.x + 229, y: cond.y + 114 };
      const recv = below(out.x, out.y, v);
      const coloured = look(v.t).name !== "colourless";
      const w = boilOff(v.t, Math.min(def.cap * 0.1 * power, recv ? roomIn(recv.t) : def.cap));
      if (w.gone <= 0) res.obs.push({ text: recv && roomIn(recv.t) < 1 ? `${cap1(plain(recv))} is full. Empty it before you distil any more.` : "Stop heating: the flask must not boil dry." });
      else if (!recv) { fx(`<circle class="cl-dropin" cx="${out.x}" cy="${out.y}" r="2.6" fill="rgb(200,224,240)" style="--fall:${H - out.y}px"/>`, 900); res.obs.push({ text: "The liquid boils. Clear drops run down the condenser and fall on the bench.", why: "Stand a beaker under the lower end of the condenser to catch the distillate." }); more = true; }
      else {
        const s = newTube(w.gone);
        s.vol = w.gone;
        s.temp = 40;
        v.t.temp = 100;
        pourIn(recv.t, s, "the condenser");
        paint(recv);
        drops([out.x, out.y], recv.y - 12, [200, 224, 240]);
        res.obs.push({ text: `The liquid boils at 100 °C. Clear, colourless drops run down the condenser into ${plain(recv)}.`, why: "Distillation: the water boils off as steam and the cold condenser turns it back to liquid. Whatever was dissolved stays behind in the flask, more concentrated than before." });
        if (coloured) res.flags.push("distilled");
        more = true;
      }
    }
  } else if (def.material === "porcelain" || v.key === "watch") {
    const w = boilOff(v.t, Math.max(1, def.cap * 0.3 * power), { dry: true });
    noNone();
    if (w.dried) {
      res.obs.push(w.colour ? { text: `The last of the water boils away. ${cap1(w.colour)} crystals are left behind.`, why: "Evaporation: only the water leaves. The dissolved salt cannot boil off, so it is left as a solid." } : { text: "The water boils away and nothing is left behind.", why: "There was nothing dissolved in it." });
      if (w.colour) res.flags.push("crystals");
    } else if (w.gone > 0) { res.obs.push({ text: "The liquid boils and there is less of it." }); more = true; }
  }
  paint(v);
  bubble(nodes[v.id].g, v.key, v.t, res.flags.some((f) => f.startsWith("gas:")) ? 1.5 : 0.9, { steam: true });
  kick(v, (Math.random() < 0.5 ? -1 : 1) * 14);
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
  g.classList.remove("is-dipped");
  if (q(".cl-turn")) q(".cl-turn").style.fill = "transparent";
  if (it.key === "meter") q(".cl-lcd").textContent = "--.-";
  if (it.key === "thermo") { q(".cl-merc").setAttribute("y", -53); q(".cl-merc").setAttribute("height", 49); }
}

// ── a lit burner left under a vessel goes on heating it ─────────────────────
// (nobody has to hold it there). It says what happens once, and then nothing more until
// something changes: the vessel's contents, or the flame.
const heatSig = (h, v) => `${v.id}|${v.t.vol.toFixed(2)}|${(v.t.oil || 0).toFixed(2)}|${v.t.added.join()}|${Object.keys(v.t.solid).filter((k) => v.t.solid[k] > 0).join()}|${h.flame}`;
setInterval(() => {
  if (botBusy || drag || turn || tap) return;
  for (const h of heaters()) {
    if (!lit(h) || !nodes[h.id]) continue;
    const v = vessels().find((o) => !o.flip && !o.held && !VESSELS[o.key].tap && Math.abs(o.x - h.x) < 30 && Math.abs(o.y - (h.y - HEAT[h.key])) < 30);
    if (!v) { h.heated = null; continue; }
    if (h.heated === heatSig(h, v)) continue;
    const more = warm(h, v);
    h.heated = more ? null : heatSig(h, v);
  }
}, 900);

// ── a centrifuge ────────────────────────────────────────────────────────────
// Tubes stand in its four wells. It must be BALANCED before it will run: every tube needs
// another opposite it holding about the same amount (a tube of water will do).
function spinCentrifuge(c) {
  const n = nodes[c.id];
  if (!n || c.spinning) return false;
  const inWell = (i) => vessels().find((v) => v.rack && v.rack[0] === c.id && v.rack[1] === i) || null;
  const tubes = [0, 1, 2, 3].map(inWell);
  if (!tubes.some(Boolean)) { say("The centrifuge is empty. Let a test tube go at one of its wells.", null, "no"); return false; }
  for (const [a, b] of [[0, 3], [1, 2]]) {
    const x = tubes[a], y = tubes[b];
    if (Boolean(x) !== Boolean(y)) { say("It is not balanced, and will not run. Put a second test tube in the well OPPOSITE, with the same amount of water in it.", null, "no"); flash(c); return false; }
    if (x && y && Math.abs(x.t.vol + (x.t.oil || 0) - (y.t.vol + (y.t.oil || 0))) > 1.05) { say(`It is not balanced: ${plain(x)} and ${plain(y)} do not hold the same amount. Make them level.`, null, "no"); flash(c); return false; }
  }
  if (tubes.some((v) => v && stopperOf(v))) { /* stoppered is fine */ }
  c.spinning = true;
  select(null);
  for (const el of [n.g, n.front]) el.classList.add("is-spinning");
  say("The lid is down and it is spinning at 3000 revolutions a minute.");
  setTimeout(() => {
    c.spinning = false;
    if (!nodes[c.id]) return;
    for (const el of [n.g, n.front]) el.classList.remove("is-spinning");
    for (const v of tubes.filter(Boolean)) {
      if (!nodes[v.id]) continue;
      const res = centrifuge(v.t);
      paint(v);
      record(v, res);
    }
    save();
  }, 3400);
  return true;
}

// ── things that are pressed: a tap, a power switch, a tare key ──────────────
let tap = null;
function runTap(bur) {
  const sep = bur.key === "sepfunnel";
  const v = below(bur.x, bur.y, bur, 90);                   // the tip may be down inside the flask's neck
  if (isEmpty(bur.t)) { say(sep ? "The separating funnel is empty. Pour the mixture in at the top." : "The burette is empty. Fill it: carry a bottle to its top.", bur, "no"); return false; }
  if (!v) { say(`Stand a beaker or a flask under the ${sep ? "funnel" : "burette"} first, or what runs out is lost.`, bur, "no"); return false; }
  if (stoppered(v)) return false;
  if (sep) {
    const n = state.dose === "drops" ? 0.25 : 1.5;
    if (roomIn(v.t) < n) { say("It is full. Stand an empty beaker under the funnel.", v, "no"); return false; }
    const out = takeBottom(bur.t, n);
    const c = out.layer === "oil" ? [232, 200, 90] : out.s.vol > 0 ? look(out.s).rgb : [200, 224, 240];
    const res = deliver(v, out.s, "the separating funnel", c);
    if (!res) return false;
    paint(bur);
    if (state.dose === "drops") drops([bur.x, bur.y], v._surface, c, 2.4); else tapStream(bur, v, c, out.layer === "oil" ? 0.9 : 0.04);
    if (out.last) {
      record(bur, { title: "Ran off the lower layer", obs: [{ text: "The last of the lower layer has run out. Only the oil is left in the funnel.", why: "The two liquids do not mix, and the denser one sinks. Running it out through the tap leaves the other behind: that is how a separating funnel separates them." }], flags: ["separated"] });
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
  if (state.dose === "drops") drops([bur.x, bur.y], v._surface, c, 2.2); else tapStream(bur, v, c, 0.04);
  const seen = res.obs.map((o) => o.text).filter((t) => t !== "No visible change.").join(" ");
  if (res.flags.some((f) => f.startsWith("colour:"))) noteFlags(["endpoint"]);
  const reads = `The burette reads ${((bur.t.cap - bur.t.vol) * 2).toFixed(2)} cm\u00b3.`;
  if (seen) tell(`${seen} ${reads}`, v); else say(reads);
  save();
  return true;
}
/** One moment of current from a power pack through the beaker it is wired to. */
function runCell(p) {
  const v = cellFor(p);
  if (!v) { say("The power pack is not wired to anything. Hang two carbon electrodes in a beaker of solution.", null, "no"); return false; }
  const res = electrolyse(v.t, Math.max(0.5, v.t.vol / 20));
  if (res.refused) { say("There is no liquid for the rods to dip in. Pour a solution into the beaker.", v, "no"); return false; }
  paint(v);
  const [neg] = rodsIn(v);
  if (v.t.plated) { neg.coat = v.t.plated; dress(neg); }
  if (res.flags.length) bubble(nodes[v.id].g, v.key, v.t, 1.2, { xs: rodsIn(v).filter((r) => !(r.side < 0 && v.t.plated)).map((r) => r.x - v.x) });
  record(v, res);
  return res.flags.length > 0;
}
function startTap(it, run, every) {
  select(null);
  nodes[it.id].g.classList.add("is-open");
  const go = () => { if (!run(it)) return stopTap(); tap.timer = setTimeout(go, every || (state.dose === "drops" ? 240 : 320)); };
  tap = { bur: it, timer: null };
  go();
}
function stopTap() {
  if (!tap) return;
  clearTimeout(tap.timer);
  nodes[tap.bur.id] && nodes[tap.bur.id].g.classList.remove("is-open");
  tap = null;
}
let slide = null;                  // a stand's clamp being slid up or down its rod
/** A press on something that is not carried. Returns true if it was one. */
function press(e, it) {
  if (e.target.closest(".cl-tap")) { startTap(it, runTap); return true; }
  const key = e.target.closest("[data-press]");
  if (!key) return false;
  const what = key.dataset.press;
  if (what === "up" || what === "down") {
    select(null);
    it.flame = clamp((it.flame || 0) + (what === "up" ? 1 : -1), 0, 3);
    dress(it);
    say(lit(it) ? `${nameOf(it)}: a ${FLAME[it.flame]} flame.` : `The ${nameOf(it).toLowerCase()} is out.`);
    save();
  } else if (what === "power") startTap(it, runCell, 900);
  else if (what === "spin") spinCentrifuge(it);
  else if (what === "clamp") { select(null); slide = { it, y0: world(e).y, c0: it.clamp ?? CLAMP }; }
  else if (what === "tare") {
    select(null);
    it.tare = it.gross && Math.abs((it.tare || 0) - it.gross) > 1e-9 ? it.gross : 0;
    save();
    say(it.tare ? "Tared: the balance reads zero with this on the pan. What you add now is weighed on its own." : "The balance is back to reading everything on the pan.");
  }
  return true;
}

// ── turning a piece by hand: tilt it far enough and it pours ────────────────
let turn = null;
// a bottle with its stopper in does not tip; a dropper bottle never does
const canTurn = (it) => (it.kind === "vessel" && !VESSELS[it.key].fixed && !it.flip) || (it.kind === "reagent" && reagent(it.key).kind !== "indicator" && !fittedTo(it, "cap"));
/** The angle at which a tilted piece starts to pour: a full beaker sooner than a nearly empty one. */
function pourAngle(it) {
  if (it.kind === "reagent") return 62;
  const f = Math.min(1, (it.t.vol + (it.t.oil || 0)) / it.t.cap);
  return 34 + (1 - f) * 58;
}
/** Where the pouring lip of a tilted piece is, on the bench. */
function lipOf(it) {
  const a = (it.tilt * Math.PI) / 180, c = pivotOf(it), s = Math.sign(it.tilt) || 1;
  const lx = s * (it.kind === "vessel" ? VESSELS[it.key].rTop : 12), ly = (it.kind === "vessel" ? VESSELS[it.key].top : -mouthOf(it.key)) - c;
  return { x: it.x + lx * Math.cos(a) - ly * Math.sin(a), y: it.y + c + lx * Math.sin(a) + ly * Math.cos(a) };
}
function pourTick() {
  if (!turn) return;
  const { it } = turn;
  turn.timer = setTimeout(pourTick, 260);
  const over = Math.abs(it.tilt || 0) - pourAngle(it);
  if (over < 0) return;
  const isBottle = it.kind === "reagent";
  if (isBottle ? fittedTo(it, "cap") : stopperOf(it)) { if (!turn.told) { turn.told = true; isBottle ? capped(it) : stoppered(it); } return; }
  if (!isBottle && it.t.vol + (it.t.oil || 0) <= 0) return;
  const lip = lipOf(it);
  const v = below(lip.x, lip.y, it);
  const c = isBottle ? colourOf(it.key) : look(it.t).rgb;
  const speed = 1 + Math.min(2, over / 25);
  if (v && !stopperOf(v)) {
    const n = (isBottle ? Math.max(0.5, VESSELS[v.key].cap / 30) : Math.min(it.t.vol + (it.t.oil || 0), Math.max(0.5, it.t.cap / 30))) * speed;
    const m = Math.min(n, roomIn(v.t));
    if (m <= 1e-6) { if (!turn.told) { turn.told = true; say("It is full, and running over.", v, "no"); } return; }
    const res = isBottle ? pourReagent(it, v, m) : deliver(v, takeFrom(it.t, m), plain(it), c, turn.spilt ? null : "tilted");
    if (!isBottle) paint(it);
    if (res) { const m = mouth(v), r = VESSELS[v.key].rTop - 3; flow("tilt", lip, { x: clamp(lip.x + Math.sign(it.tilt) * 8, m.x - r, m.x + r), y: v._surface }, c, Math.sign(it.tilt), viscOf(it)); flows.tilt.floor = v.y - (VESSELS[v.key].floor || 0); flows.tilt.walls = wallsOf(v); }
    return;
  }
  // nothing underneath: it goes on the bench
  if (isBottle) { if (leftIn(it) <= 1e-6) { if (!turn.told) { turn.told = true; ranOut(it); } return; } takeStock(it, 2 * speed); }
  if (!isBottle) { takeFrom(it.t, Math.max(0.5, it.t.cap / 30) * speed); paint(it); }
  flow("tilt", lip, { x: lip.x + Math.sign(it.tilt) * 14, y: H - 8 }, c, Math.sign(it.tilt), viscOf(it));
  flows.tilt.walls = null;
  fx(`<ellipse class="cl-puddle" cx="${lip.x + Math.sign(it.tilt) * 14}" cy="${H - 6}" rx="46" ry="6" fill="rgba(${c},0.5)"/>`, 900);
  if (!turn.spilt) { turn.spilt = true; say("It is pouring onto the bench! Hold it over a vessel before you tilt it.", isBottle ? null : it, "no"); }
  save();
}

// ── hands ───────────────────────────────────────────────────────────────────
let drag = null;
let selected = null;
let tileDrag = null;
let swallow = false;
let endDrag = null;                // the free end of a delivery tube, being led somewhere

/** Is the hand over the drawer? (Shut, the drawer is nowhere, and nothing can be dropped in it.) */
function overDrawer(e) {
  const el = document.querySelector(".cl-drawer");
  if (!el || document.querySelector(".cl-stage").classList.contains("is-shut")) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
}
function startDrag(it, e, fromDrawer = false) {
  const w = world(e);
  drag = {
    it, fromDrawer, cx: e.clientX, cy: e.clientY, dx: fromDrawer ? 0 : it.x - w.x, dy: fromDrawer ? -(boxOf(it).y0 / 2) : it.y - w.y,
    sx: it.x, sy: it.y, rack: it.rack || null, on: it.on || null, moved: fromDrawer, used: false, sits: false, over: null, timer: null,
    riders: ridersOf(it),
  };
  raise(it, it.kind === "vessel" ? L.items : L.fx);
  glide(it, false);
  drag.riders.forEach((v) => glide(v, false));
}
function leave() {
  if (!drag || !drag.over) return;
  clearTimeout(drag.timer);
  nodes[drag.it.id].g.classList.remove("is-using");
  nodes[drag.over.id].g.classList.remove("is-target");
  if (drag.over.kind === "vessel") place(drag.over);
  if (drag.it.kind === "vessel") paint(drag.it);
  if (drag.tucked) { L.fx.appendChild(nodes[drag.it.id].g); drag.tucked = false; }       // out of the vessel, and in the hand again
  freshLater(drag.it);
  drag.over = null;
  drag.shut = false;
  drag.told = false;
  drag.sits = false;
  drag.go = null;
}
function enter(target) {
  const { it } = drag;
  drag.over = target;
  // some things, once put there, stay: a vessel over a flame, and anything that is fitted
  drag.sits = (it.kind === "vessel" && Boolean(HEAT[target.key])) || fitsOn(it, target);
  // a stoppered bottle is only being carried past: it does not tip, it just says why it will not pour
  drag.shut = it.kind === "reagent" && Boolean(fittedTo(it, "cap"));
  if (drag.shut) { nodes[target.id].g.classList.add("is-target"); drag.go = () => { if (drag && drag.over === target && !drag.told) { drag.told = true; capped(it); } }; drag.wait = 420; drag.timer = setTimeout(drag.go, 420); return; }
  glide(it, true);
  if (!drag.sits) nodes[it.id].g.classList.add("is-using");
  nodes[target.id].g.classList.add("is-target");
  place(it, poseOn(it, target));
  drag.tucked = target.kind === "vessel" && tuck(it, target);
  if (fitsOn(it, target)) return;
  if (it.kind === "vessel" && !HEAT[target.key] && target.key !== "waste") paint(it, { tilt: -108 });
  if (HEAT[it.key]) {
    // no room under it: the vessel is lifted into the flame instead
    const lift = target.y + HEAT[it.key] - Math.min(target.y + HEAT[it.key], H - 8);
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
  if (e.button > 0 || botBusy) return;
  const end = e.target.closest("[data-end]");
  if (end) { e.preventDefault(); select(null); endDrag = byId(end.dataset.end); endDrag.to = null; return; }
  const w = world(e);
  const tapped = vessels().find((v) => { const d = VESSELS[v.key]; return d.tap && Math.abs(w.x - v.x) < 24 && w.y > v.y - d.floor - 14 && w.y < v.y - d.floor + 24; });
  if (tapped) { e.preventDefault(); startTap(tapped, runTap); return; }
  const g = e.target.closest("[data-item]");
  if (!g) return select(null);
  e.preventDefault();
  if (press(e, byId(g.dataset.item))) return;
  startDrag(byId(g.dataset.item), e);
});

window.addEventListener("pointermove", (e) => {
  if (turn) {
    // the handle is dragged round the piece's middle
    const a = (Math.atan2(e.clientX - turn.px, -(e.clientY - turn.py)) * 180) / Math.PI;
    turn.it.tilt = Math.abs(a) < 4 ? 0 : clamp(Math.round(a), -180, 180);
    place(turn.it);
    if (turn.it.kind === "vessel") paint(turn.it);
    const h = $("cl-rot");
    h.style.left = `${e.clientX - wrap.getBoundingClientRect().left - 17}px`;
    h.style.top = `${e.clientY - wrap.getBoundingClientRect().top - 17}px`;
    return;
  }
  if (slide) {
    const [lo, hi] = SUPPORTS.stand.clamp;
    slide.it.clamp = clamp(Math.round(slide.c0 + world(e).y - slide.y0), lo, hi);
    dress(slide.it);
    follow(slide.it, false);
    drawLinks();
    return;
  }
  if (endDrag) {
    const w = world(e), a = hoseStart(endDrag);
    let dx = w.x - a.x, dy = w.y - a.y;
    const far = Math.hypot(dx, dy), max = HOSE_LEN * 0.96;
    if (far > max) { dx *= max / far; dy *= max / far; }
    endDrag.ex = a.x + dx - endDrag.x;
    endDrag.ey = clamp(a.y + dy, 40, H - 8) - endDrag.y;
    drawLinks();
    return;
  }
  if (tileDrag && !drag) return tileMove(e);
  if (!drag) return;
  const { it } = drag;
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.cx, e.clientY - drag.cy) < 5) return;
    drag.moved = true;
    select(null);
    if (it.kind === "tool") resetTool(it);
    // lifted out of a trough, an upturned jar is the right way up again, with whatever gas is in it
    if (it.kind === "vessel" && it.flip && it.rack) { it.flip = false; paint(it); }
  }
  // carried over the drawer, a piece is on its way back into it: let go there and it is put away
  if (!overDrawer(e)) drag.left = true;            // a piece just taken OUT of the drawer is not on its way back until it has left it
  const home = overDrawer(e) && it.key !== "cap" && (!drag.fromDrawer || Boolean(drag.left));
  if (home !== Boolean(drag.home)) {
    drag.home = home;
    document.querySelector(".cl-drawer").classList.toggle("is-home", home);
    nodes[it.id].g.classList.toggle("is-leaving", home);
    drag.riders.forEach((v) => nodes[v.id] && nodes[v.id].g.classList.toggle("is-leaving", home));
  }
  const w = world(e);
  const ox = it.x, oy = it.y;
  it.x = w.x + drag.dx;
  it.y = w.y + drag.dy;
  keepIn(it);
  for (const v of drag.riders) { v.x += it.x - ox; v.y += it.y - oy; place(v); kick(v, -(it.x - ox) * 3.4); }
  kick(it, -(it.x - ox) * 3.4);
  if (it.kind === "vessel" && !drag.over) shakeWatch(it, it.x - ox, it.y - oy);
  else if (GRIPS[it.key] && loadOf(it)) shakeWatch(loadOf(it), it.x - ox, it.y - oy);
  if (it.kind === "vessel" || it.key === "syringe") it.rack = null;
  if (it.held) it.held = null;                       // pulled out of the holder or the tongs
  if (it.on) it.on = null;
  if (GRIPS[it.key]) {
    // an empty holder or tongs: show what it would take hold of here
    const c = grabbable(it);
    if (c !== (drag.grab || null)) {
      if (drag.grab && nodes[drag.grab.id]) nodes[drag.grab.id].g.classList.remove("is-target");
      drag.grab = c;
      if (c) nodes[c.id].g.classList.add("is-target");
    }
  }

  const target = targetOf(it);
  if (target !== drag.over) {
    leave();
    if (target) enter(target);
  }
  if (!drag.over || drag.shut) { glide(it, false); place(it); }
  else if (!drag.used && drag.go) {
    // still on the way past: nothing happens until the hand has come to rest
    clearTimeout(drag.timer);
    drag.timer = setTimeout(drag.go, drag.wait);
  }
  drawLinks();
});

window.addEventListener("pointerup", (e) => {
  stopTap();
  if (turn) {
    const { it } = turn;
    clearTimeout(turn.timer);
    turn = null;
    // let go right over (past 165°), an empty tube or jar STAYS upside down; anything else stands up again
    const over = Math.abs(it.tilt || 0) >= 165 && it.kind === "vessel" && VESSELS[it.key].invert && isEmpty(it.t) && !it.rack && !state.items.some((o) => o.on === it.id && o.key !== "bung" && !(o.key === "bung1" && !fittedTo(o, "tubing")));
    it.tilt = 0;
    if (over) {
      // (upturned, a piece is placed by its MOUTH, which is where its closed end was)
      it.flip = true;
      if (!fittedTo(it, "bung")) { it.jar = null; it.t.gas = null; }
      say(`${cap1(plain(it))} is upside down. Turn it the right way up from its note.`, it);
    }
    glide(it, true);
    place(it);
    if (it.kind === "vessel") paint(it);
    follow(it);
    save();
    setTimeout(() => { if (nodes[it.id]) select(it); }, 280);
    return;
  }
  if (slide) { const it = slide.it; slide = null; follow(it); save(); return; }
  if (endDrag) {
    const t = endDrag;
    endDrag = null;
    const p = endOf(t);
    const host = vesselOfTube(t);
    const c = nearest([...tools("syringe"), ...vessels().filter((v) => v !== host && !VESSELS[v.key].tap)], (o) => {
      const m = mouth(o), d = Math.hypot(m.x - p.x, m.y - p.y);
      return d < (o.key === "syringe" ? 50 : VESSELS[o.key].rTop + 46) ? d : -1;
    });
    if (c) {
      t.to = c.id;
      const a0 = hoseStart(t), b0 = endOf(t);
      if (Math.hypot(b0.x - a0.x, b0.y - a0.y) > HOSE_LEN) { t.to = null; say("The rubber tube will not reach that far. Bring the two closer together.", null, "no"); drawLinks(); save(); return; }
      noteFlags(["piped", c.flip && !overWater(c) ? "piped:up" : "piped:other"]);
      say(c.key === "syringe" ? "The delivery tube leads to the gas syringe." : overWater(c) ? `The delivery tube leads under ${plain(c)}, over water.` : c.flip ? `The delivery tube leads up into ${plain(c)}: right for a gas lighter than air.` : `The delivery tube leads down into ${plain(c)}: right for a gas denser than air.`);
      catchPuff(host);
    }
    drawLinks();
    save();
    return;
  }
  if (tileDrag && !drag) { tileDrag = null; document.body.classList.remove("cl-dragging"); return; }
  if (!drag) return;
  const d = drag;
  const { it } = d;
  clearTimeout(d.timer);
  drag = null;
  tileDrag = null;
  document.body.classList.remove("cl-dragging");

  document.querySelector(".cl-drawer").classList.remove("is-home");
  if (nodes[it.id]) nodes[it.id].g.classList.remove("is-leaving");
  d.riders.forEach((v) => nodes[v.id] && nodes[v.id].g.classList.remove("is-leaving"));
  // let go over the drawer: back it goes (a stopper is not put away without its bottle)
  if (d.moved && it.key !== "cap" && overDrawer(e) && (!d.fromDrawer || d.left)) {
    if (d.over) { nodes[d.over.id] && nodes[d.over.id].g.classList.remove("is-target"); }
    removeItem(it);
    if (!d.fromDrawer) say(`${cap1(nameOf(it).replace(/ [A-Z]$/, ""))} is back in the drawer.`);
    return;
  }
  if (d.fromDrawer) {
    const r = wrap.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return removeItem(it);
  }
  if (!d.moved) return select(it);

  if (d.shake && d.shake.peak) shaken(d.shake.v, d.shake.peak);
  const fits = Boolean(d.over) && fitsOn(it, d.over);
  if (d.over && !d.used && !fits && !d.shut) { d.used = true; use(it, d.over); }   // let go at once: that is one measure
  if (d.shut && d.over && !d.told) capped(it);
  if (d.over) {
    const o = d.over;
    nodes[o.id].g.classList.remove("is-target");
    if (o.kind === "vessel") setTimeout(() => nodes[o.id] && place(o), HEAT[it.key] ? 1100 : 0);   // set back down once the burner has gone
  }
  nodes[it.id].g.classList.remove("is-using");
  const front = () => raise(it);

  if (HEAT[it.key] && d.over && d.over.kind === "vessel" && d.over.y + HEAT[it.key] <= H - 8) {
    // a burner put under a vessel STAYS there (there is room for it), and goes on heating it
    it.x = d.over.x;
    it.y = d.over.y + HEAT[it.key];
    it.heated = null;
    front();
    glide(it, true);
    place(it);
    follow(it);
    save();
    return;
  }
  if (d.sits && fits) {
    // fitted, and left there
    const host = d.over;
    if (it.key === "electrode") it.side = sideFor(host, it);
    it.on = host.id;
    noteFlags([`fitted:${it.key}`]);
    const m = seat(host, it);
    it.x = m.x;
    it.y = m.y;
    front();
    glide(it, true);
    place(it);
    const where = plain(host);
    say(it.key === "funnel" ? (fittedTo(it, "paper") ? `The funnel is in ${where}, with its filter paper. Whatever is poured in now is filtered.` : `The funnel is in ${where}. It needs a filter paper: let one go at the funnel.`)
      : it.key === "chroma" ? `The strip hangs in ${where} from its rod.`
      : it.key === "paper" ? `The filter paper is folded into a cone and opened out in the funnel: three layers on one side, one on the other. ${host.on ? "Whatever is poured in now is filtered." : "Stand the funnel in the mouth of a flask."}`
      : it.key === "tubing" ? `The delivery tube is pushed through the stopper. Drag the end of its rubber tube to where the gas should go.`
      : it.key === "bung1" ? `The one-hole stopper is in ${where}.${fittedTo(it, "tubing") ? "" : " Push a delivery tube into its hole."}`
      : it.key === "cap" ? `The ${it.v === "drop" ? "dropper" : "stopper"} is back in the ${reagent(host.key).name}.`
      : it.key === "condenser" ? `The condenser is on the side arm of ${where}. Stand a beaker under its lower end.`
      : it.key === "electrode" ? (rodsIn(host).length === 2 ? (tools("power").length ? `Both carbon rods are in ${where} and wired to the power pack. Hold down its red switch.` : `Both carbon rods are in ${where}. Put a power pack on the bench.`) : `One carbon rod is in ${where}. It needs a second.`)
      : `${cap1(where)} is stoppered.`, host.kind === "vessel" ? host : null);
    dress(it);
    if (it.key === "paper") foldIn(it);
    if (it.key === "chroma") runChroma(it);
    if (it.key === "bung1") catchPuff(host);
    if (it.key === "tubing") catchPuff(vesselOfTube(it));
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
      // a dropper taken straight from its bottle goes straight back into it
      const home = d.on && byId(d.on);
      if (home && !fittedTo(home, it.key)) { it.on = home.id; const m = seat(home, it); it.x = m.x; it.y = m.y; }
      if (d.fromDrawer) [it.x, it.y] = freeSpot(it);
      front();
      glide(it, true);
      place(it);
      if (it.kind === "vessel") paint(it);
      follow(it);
      save();
      if (it.kind === "tool") setTimeout(() => resetTool(it), 2200);
    }, it.kind === "tool" ? 1100 : 380);
  } else {
    if ((it.kind === "vessel" && snap(it)) || (it.key === "syringe" && clampSyringe(it))) glide(it, true);
    front();
    place(it);
    freshLater(it, 1800);
    if (d.grab && nodes[d.grab.id]) { nodes[d.grab.id].g.classList.remove("is-target"); if (!loadOf(it) && !d.grab.held) grab(it, d.grab); }
    // a delivery tube let go at a vessel that has no stopper for it
    if (it.key === "tubing" && it.on == null && open().some((v) => { const mo = mouth(v); return Math.abs(it.x - mo.x) < VESSELS[v.key].rTop + 30 && Math.abs(it.y - mo.y) < 70; })) say("A delivery tube goes through a one-hole stopper. Fit a one-hole stopper in the mouth first, then push the tube into its hole.", null, "no");
    if (it.kind === "vessel") paint(it);
    follow(it);
    if (it.key === "cap" && d.on) say(it.v === "drop" ? "The dropper is out. Carry it to a liquid and hold it there." : "The stopper is out. The bottle will pour now.");
  }
  save();
});
window.addEventListener("pointercancel", () => {
  stopTap();
  turn = slide = endDrag = null;
  if (!drag) return;
  clearTimeout(drag.timer);
  nodes[drag.it.id].g.classList.remove("is-using");
  if (drag.over) nodes[drag.over.id].g.classList.remove("is-target");
  place(drag.it);
  drag = null;
});

// ── a chosen piece: its name, a handle to turn it, and a handle for what can be set on it ──
function showHandles() {
  const box = $("cl-handles");
  const it = selected;
  if (!it || !nodes[it.id]) { box.hidden = true; $("cl-name").hidden = true; return; }
  const r = nodes[it.id].g.querySelector(".cl-hit").getBoundingClientRect();
  const w = wrap.getBoundingClientRect();
  box.hidden = false;
  $("cl-name").hidden = false;
  $("cl-name").textContent = nameOf(it);
  const rot = $("cl-rot"), dots = $("cl-dots");
  rot.hidden = !canTurn(it);
  rot.style.left = `${clamp(r.left + r.width / 2 - w.left - 17, 6, w.width - 40)}px`;
  rot.style.top = `${clamp(r.top - w.top - 44, 58, w.height - 40)}px`;
  dots.style.left = `${clamp(r.right - w.left + 8, 6, w.width - 40)}px`;
  dots.style.top = `${clamp(r.top + r.height / 2 - w.top - 17, 58, w.height - 40)}px`;
}
function select(it) {
  if (selected && nodes[selected.id]) nodes[selected.id].g.classList.remove("is-sel");
  selected = it;
  $("cl-menu").hidden = true;
  if (it) nodes[it.id].g.classList.add("is-sel");
  showHandles();
  lens();
}
$("cl-rot").addEventListener("pointerdown", (e) => {
  const it = selected;
  if (!it || !canTurn(it)) return;
  e.preventDefault();
  e.stopPropagation();
  $("cl-menu").hidden = true;
  if (it.kind === "vessel" && it.rack) it.rack = null;      // lifted out of its rack or clamp to be tilted
  const p = screenOf(it.x, it.y + pivotOf(it));
  turn = { it, px: p.x, py: p.y, timer: null };
  glide(it, false);
  raise(it);
  pourTick();
});
$("cl-dots").addEventListener("click", () => {
  const menu = $("cl-menu");
  if (!menu.hidden) { menu.hidden = true; return; }
  openMenu(selected);
});

const readingBox = (it) => `<label class="cl-range cl-reading"><span>Your reading, from the lens (cm\u00b3)</span><span class="cl-reading__row"><input type="number" inputmode="decimal" step="${SCALES[it.key].dp === 0 ? 1 : SCALES[it.key].dp === 1 ? 0.1 : 0.05}" min="0" id="cl-reading" autocomplete="off" /><button type="button" class="cl-ico cl-ico--paper" data-act="read" data-tip="Check my reading" aria-label="Check my reading">${UI.check(18)}</button></span></label>`;
function openMenu(it) {
  if (!it) return;
  const menu = $("cl-menu");
  const lines = [];
  const acts = [];
  const SHORT = { empty: "Empty", swirl: "Swirl", flip: "Turn over", light: "Light", remove: "Put away", ink: "Another ink", drop: "Let go", refill: "Refill" };
  const act = (id, tip, icon) => acts.push(`<button type="button" class="cl-act" data-act="${id}" aria-label="${tip}">${icon}<span>${id === "light" && /out/i.test(tip) ? "Put out" : id === "empty" && /fresh|plunger|wipe/i.test(tip) ? (/strip/i.test(tip) ? "Fresh strip" : /fresh/i.test(tip) ? "Fresh paper" : /wipe/i.test(tip) ? "Wipe off" : "Push in") : SHORT[id] || tip}</span></button>`);
  let slider = "";
  if (it.kind === "vessel") {
    const def = VESSELS[it.key];
    if (isEmpty(it.t)) lines.push(it.flip ? (it.jar ? `Holds about ${Math.round(it.jar.n * 12)} cm\u00b3 of gas.` : overWater(it) ? "Upside down, and full of water. Lead a delivery tube to it." : "Upside down, with only air in it.") : it.t.gas ? "No liquid, but there is a gas in it. Test it." : "Empty.");
    else {
      const tot = it.t.vol + (it.t.oil || 0);
      lines.push(`Holds ${tot > 0 ? `${cm3(tot)}: ` : ""}${esc(it.t.added.map((id) => reagent(id).name).join(", "))}.`);
      if (it.t.vol > 0) lines.push(`${Math.round(it.t.temp ?? 25)} °C.`);
      act("empty", "Empty and rinse it", ICON.empty);
    }
    if (scaleOf(it)) slider = readingBox(it);
    if (def.tap) lines.push("It cannot stand up: let it go at the clamp of a retort stand. Press the blue tap to run it out.");
    if (def.arm) lines.push(fittedTo(it, "condenser") ? "Heat it, with a beaker under the condenser's lower end." : "Push a condenser onto the side arm.");
    if (def.upturns) lines.push("Fill it with water, then let an empty gas jar go in it.");
    if (!def.fixed && !it.flip && it.t.vol > 0) act("swirl", "Swirl it", ICON.swirl);
    if (def.invert) {
      // it can be turned over empty, standing free or held in a clamp, and with a stopper in it
      const host = it.rack && hostOf(it), inClamp = host && host.kind === "rack" && host.key === "stand" && it.rack[1] === 0;
      const busy = state.items.some((o) => o.on === it.id && o.key !== "bung" && !(o.key === "bung1" && !fittedTo(o, "tubing")));
      if (!isEmpty(it.t)) lines.push("Empty it before turning it upside down.");
      else if (host && !inClamp) lines.push("Lift it out before turning it upside down. (In a retort clamp it can be turned over where it is.)");
      else if (busy) lines.push("Take out what is fitted in it before turning it over. A stopper can stay in.");
      else act("flip", it.flip ? "Turn it the right way up" : "Turn it upside down", ICON.flip);
    }
  } else if (it.kind === "reagent") {
    const r = reagent(it.key);
    lines.push(r.kind === "indicator" ? (fittedTo(it, "cap") ? "Pull the dropper out and carry it to a liquid." : "Its dropper is out. Let the dropper go at the bottle to put it back.") : fittedTo(it, "cap") ? "Stoppered. Drag the stopper off before you pour: it will not tip with the stopper in." : "Open. Carry it to a vessel and hold it there, or select it and turn it.");
    const left = leftIn(it), full = fullOf(it);
    lines.push(left <= 1e-6 ? `<b>Empty.</b> Refill it to go on using it.` : r.kind === "solution" ? `${cm3(left)} left of ${cm3(full)}.` : r.kind === "solid" ? `About ${Math.round(left)} of ${full} measures left.` : `About ${Math.round(left)} of ${full} squirts left.`);
    if (left < full - 1e-6) act("refill", "Refill it", ICON.measure);
    if (r.kind === "solution" && Object.keys(r.adds).length) {
      const k = it.k || 1;
      slider = `<label class="cl-range"><span>Concentration <b id="cl-k">${k.toFixed(2)}</b> mol/dm\u00b3</span><input type="range" min="0.25" max="2" step="0.25" value="${k}" data-act="strength" aria-label="Concentration"></label>`;
    }
  } else if (HEAT[it.key]) {
    lines.push(lit(it) ? `Lit: a ${FLAME[it.flame]} flame. Its \u2212 and + keys turn it down and up. Hold it under a vessel, or carry a vessel over the flame.` : "Not lit. Press its + key to light it and turn it up.");
    act("light", lit(it) ? "Put it out" : "Light it", ICON.fire);
  } else if (it.sample) { if (scaleOf(it)) slider = readingBox(it); lines.push(it.key === "wire" ? "Dipped, ready for the flame." : `Holding ${cm3(it.sample.vol + (it.sample.oil || 0))} of liquid.`); act("empty", "Empty it", ICON.empty); }
  else if (it.key === "syringe") { lines.push(it.gas ? `${Math.round(it.gas.n * 12)} cm\u00b3 of gas.` : "Let it go at a stand's clamp to hold it level, then drag the orange end of a delivery tube to its nozzle."); if (it.gas) act("empty", "Push the plunger back in", ICON.empty); }
  else if (GRIPS[it.key]) {
    const held = loadOf(it);
    lines.push(held ? `Holding ${plain(held)} by ${GRIPS[it.key].says}. Carry it over a lit burner to heat it.` : it.key === "holder" ? "Let it go at the neck of a test tube or a boiling tube and it grips it." : "Let them go at the rim of a crucible, an evaporating dish or a watch glass and they take hold of it.");
    if (held) act("drop", "Let go", ICON.flip);
  }
  else if (it.key === "magnet") { lines.push(it.sample ? "Iron filings cling to both poles." : "Hold it over a mixture. Only iron is pulled to it."); if (it.sample) act("empty", "Wipe the filings off", ICON.empty); }
  else if (it.key === "chroma") {
    lines.push(`A spot of ${INKS[it.ink || "black"].name} ink on the pencil line. ${it.washed ? "The ink has washed off: take a fresh strip." : it.p >= 1 ? "Run: measure each spot, and the solvent front, from the pencil line." : it.on ? "It needs a little water in the beaker: touching the paper, below the ink." : "Let it go at the mouth of a beaker and the rod lies across the rim."}`);
    act("ink", "Another ink", ICON.swirl);
    if (it.p || it.washed) act("empty", "A fresh strip", ICON.empty);
  }
  else if (it.key === "funnel") lines.push(fittedTo(it, "paper") ? (it.on ? "Paper in, and sitting in a vessel: ready to filter." : "Paper in. Let the funnel go at the mouth of a flask or beaker.") : "Plain glass. It needs a filter paper: let one go at the funnel.");
  else if (it.key === "paper") { lines.push(it.residue ? "There is residue in the paper: the solid that could not pass through." : it.on ? "Folded in half, in half again, and opened into a cone in the funnel." : "A flat disc of filter paper. Let it go at a funnel and it is folded into a cone."); if (it.residue || it.wet) act("empty", "A fresh filter paper", ICON.empty); }
  else if (it.key === "tubing") lines.push(it.on ? "Glass through the stopper, rubber on the glass. Drag the end of the rubber tube to a gas jar, a gas syringe or a collecting tube: it will not stretch." : "A bent glass tube with a length of rubber tube on it. Push it into the hole of a one-hole stopper.");
  else if (it.key === "bung1") lines.push(fittedTo(it, "tubing") ? "Bored through, with a delivery tube in the hole." : "Bored through for a delivery tube. With nothing in the hole, a gas simply escapes by it.");
  else if (it.key === "bung") lines.push("Solid rubber. A vessel that is making a gas will blow it out.");
  else if (it.key === "electrode") lines.push("Let it go at the mouth of a beaker. Two are needed, and a power pack.");
  else if (it.key === "power") lines.push(cellFor(it) ? "Wired up. Hold down the red switch." : "It wires itself to a beaker with two carbon electrodes in it.");
  else if (it.key === "condenser") lines.push(it.on ? "Cold water runs through the jacket. Stand a beaker under the lower end." : "Push it onto the side arm of a distilling flask.");
  else if (it.key === "cap") lines.push("Put it back by letting it go at the bottle's mouth.");
  else if (it.kind === "rack" && it.key === "balance") lines.push("Stand a vessel on the pan. The red TARE key sets the reading to zero.");
  else if (it.kind === "rack" && it.key === "centrifuge") lines.push("Stand test tubes in its wells, each with another OPPOSITE holding the same amount, and press the green START key. It will not run out of balance.");
  else if (it.kind === "rack" && it.key === "tripod") lines.push("Stand a beaker or a dish on the gauze, and hold a lit burner underneath.");
  else if (it.kind === "rack" && it.key === "stand") lines.push("Slide the clamp by its yellow boss. Let a tube, a flask, a burette or a separating funnel go at the clamp and it is held.");
  if (it.key !== "cap") lines.push(`<span class="cl-menu__hint">Drag it onto the drawer to put it away.</span>`);
  menu.className = `cl-menu pp-sticky pp-sticky--tape pp-sticky--c${{ vessel: 3, reagent: 0, tool: 2, rack: 4 }[it.kind] ?? 0}`;
  menu.innerHTML = `<p class="cl-menu__name">${esc(nameOf(it))}</p>${lines.map((l) => `<p class="cl-menu__holds">${l}</p>`).join("")}${slider}<div class="cl-menu__row">${acts.join("")}</div>`;
  menu.hidden = false;
  const r = $("cl-dots").getBoundingClientRect();
  const w = wrap.getBoundingClientRect();
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  let left = r.right - w.left + 8;
  if (left + mw > w.width - 8) left = r.left - w.left - mw - 8;
  menu.style.left = `${clamp(left, 8, w.width - mw - 8)}px`;
  menu.style.top = `${clamp(r.top - w.top - 10, 60, w.height - mh - 8)}px`;
}
$("cl-menu").addEventListener("input", (e) => {
  if (e.target.dataset.act !== "strength" || !selected) return;
  selected.k = Number(e.target.value);
  $("cl-k").textContent = selected.k.toFixed(2);
  save();
});
$("cl-menu").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-act]");
  if (!b || !selected) return;
  const it = selected;
  const what = b.dataset.act;
  if (what === "remove") return removeItem(it);
  if (what === "read") { checkReading(it, $("cl-reading").value); return; }
  if (what === "refill") { it.left = fullOf(it); dress(it); flash(it); say(`The ${reagent(it.key).name} is full again.`); save(); select(it); return; }
  if (what === "drop") { const held = loadOf(it); if (held) { held.held = null; say(`${cap1(plain(held))} is let go.`); } save(); select(it); return; }
  if (what === "ink") { const names = Object.keys(INKS); it.ink = names[(names.indexOf(it.ink || "black") + 1) % names.length]; it.p = 0; it.washed = false; cancelAnimationFrame(running.get(it.id)); running.delete(it.id); dress(it); if (it.on != null) runChroma(it); save(); select(it); openMenu(it); return; }
  if (what === "swirl") { $("cl-menu").hidden = true; swirl(it); return; }
  if (what === "light") { it.flame = lit(it) ? 0 : 2; dress(it); say(lit(it) ? `The ${nameOf(it).toLowerCase()} is lit.` : `The ${nameOf(it).toLowerCase()} is out.`); }
  else if (what === "flip") { it.flip = !it.flip; if (!fittedTo(it, "bung")) { it.jar = null; it.t.gas = null; } glide(it, true); place(it); paint(it); follow(it); say(it.flip ? `${cap1(plain(it))} is upside down. A gas lighter than air will stay in it. A stopper can be pushed into its mouth from below.` : `${cap1(plain(it))} is the right way up.`, it); }
  else if (it.kind === "vessel") {
    const res = rinse(it.t);
    it.jar = null;
    nodes[it.id].g.querySelector(".cl-bubbles").innerHTML = "";
    paint(it);
    record(it, res);
  } else {
    it.sample = null; it.gas = null; it.residue = null; it.wet = null;
    if (it.key === "chroma") { it.p = 0; it.washed = false; cancelAnimationFrame(running.get(it.id)); running.delete(it.id); }
    dress(it);
    if (it.key === "chroma" && it.on != null) runChroma(it);
  }
  save();
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
  if (botBusy || !b || e.pointerType === "touch" || e.button !== 0) return;
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
  if (botBusy) return;
  const b = e.target.closest(".cl-tile");
  if (swallow) { swallow = false; return; }
  if (!b) return;
  const it = addItem(b.dataset.kind, b.dataset.key);
  if (it) { flash(it); save(); }
});

// ── the notebook, things to try, guides ─────────────────────────────────────
function renderLog() {
  const list = $("cl-log");
  list.innerHTML = state.log.length
    ? state.log.map((e) => `
      <li class="cl-entry">
        <p class="cl-entry__head"><span class="cl-entry__tube">${esc(e.tag)}</span>${esc(e.title)}${e.times > 1 ? ` <span class="cl-entry__times">&times; ${e.times}</span>` : ""}</p>
        ${e.obs.map((o) => `
          <p class="cl-obs">${esc(o.text)}</p>
          ${!e.secret && (o.why || o.eq || o.full) ? `<p class="cl-why">${o.why ? prose(o.why) : ""}${o.full ? `<span class="cl-eq">${chemHtml(o.full)}</span>` : ""}${o.eq ? `<span class="cl-eq${o.full ? " cl-eq--ion" : ""}">${o.full ? "<i>ionic</i>" : ""}${chemHtml(o.eq)}</span>` : ""}</p>` : ""}`).join("")}
      </li>`).join("")
    : `<li class="cl-entry cl-entry--none">Nothing written yet. Whatever you see happen is written down here.</li>`;
  $("cl-sheet-notebook").classList.toggle("is-plain", !state.explain);
  const ex = $("cl-explain");
  const tip = state.explain ? "Hide the chemistry" : "Show the chemistry";
  ex.innerHTML = state.explain ? ICON.eye : ICON.eyeOff;
  ex.dataset.tip = tip;
  ex.setAttribute("aria-label", tip);
  $("cl-count-log").textContent = state.log.length || "";
}
/** Ions for a plain-text choice: Cu^2+ as Cu\u00b2\u207a. */
const SUP = { "+": "\u207a", "-": "\u207b", 2: "\u00b2", 3: "\u00b3" }, SUB = { 2: "\u2082", 3: "\u2083", 4: "\u2084" };
const ion = (t) => t.replace(/([A-Za-z])(\d)/g, (_, a, d) => a + (SUB[d] || d)).replace(/\^(\d?)([+-])/, (_, d, sg) => (d ? SUP[d] : "") + SUP[sg]);
const expNow = () => EXPERIMENTS.find((e) => e.id === state.exp) || null;

/** Something has been done: tick whatever steps of the chosen practical it completes. */
// What is standing on what, for the setting-up practicals (waec.js steps with `check`).
const hostKeyOf = (v) => { const h = v.rack && hostOf(v); return h ? h.key : ""; };
const Q = {
  count: (kind, key) => state.items.filter((it) => it.kind === kind && it.key.startsWith(key)).length,
  /** a vessel of this kind held in a stand's clamp */
  clamped: (key) => vessels().some((v) => v.key.startsWith(key) && hostKeyOf(v) === "stand" && v.rack[1] === 0),
  syringeClamped: () => tools("syringe").some((s) => { const h = s.rack && byId(s.rack[0]); return h && h.key === "stand"; }),
  anyOn: (hostKey) => vessels().some((v) => hostKeyOf(v) === hostKey),
  fitted: (toolKey, hostKey) => tools(toolKey).some((t) => { const h = t.on && byId(t.on); return h && (!hostKey || h.key.startsWith(hostKey)); }),
  paperIn: () => tools("paper").some((p) => { const f = p.on && byId(p.on); return Boolean(f && f.on); }),
  holds: (key) => vessels().some((v) => v.key.startsWith(key) && v.t.vol + (v.t.oil || 0) > 0),
  /** something stands under the tip of a burette or a separating funnel */
  under: (topKey) => vessels().some((v) => v.key === topKey && hostKeyOf(v) === "stand" && below(v.x, v.y, v, 90)),
  lit: () => heaters().some((h) => lit(h)),
  litUnder: (key) => vessels().some((v) => v.key.startsWith(key) && heaters().some((h) => lit(h) && Math.abs(h.x - v.x) < 48 && h.y > v.y - 20 && h.y - v.y < 280)),
  litUnderHost: (hostKey) => state.items.some((s) => s.kind === "rack" && s.key === hostKey && heaters().some((h) => lit(h) && Math.abs(h.x - s.x) < 40 && Math.abs(h.y - s.y) < 40)),
  troughReady: () => vessels().some((v) => v.key === "trough" && v.t.vol >= v.t.cap * 0.5),
  jarOverWater: () => vessels().some((v) => v.flip && overWater(v)),
  upturned: (key) => vessels().some((v) => v.key.startsWith(key) && v.flip && !overWater(v)),
  stoppered: (key) => vessels().some((v) => v.key.startsWith(key) && fittedTo(v, "bung1")),
  tubeIn: (key) => vessels().some((v) => v.key.startsWith(key) && tubeOf(v)),
  /** the delivery tube of some vessel has been led: "water" (under a jar over water), "up", "down", "syringe" */
  leads: (how) => tools("tubing").some((t) => {
    const c = t.to && byId(t.to);
    if (!c || !vesselOfTube(t)) return false;
    return how === "syringe" ? c.key === "syringe" : how === "water" ? Boolean(overWater(c)) : how === "up" ? Boolean(c.flip) && !overWater(c) : !c.flip && c.key !== "syringe";
  }),
  rods: () => vessels().some((v) => rodsIn(v).length === 2),
  wired: () => tools("power").some((p) => cellFor(p)),
  inHost: (hostKey) => vessels().filter((v) => hostKeyOf(v) === hostKey).length,
  /** a vessel stands under the lower end of a fitted condenser */
  receiver: () => tools("condenser").some((c) => { const f = c.on && byId(c.on); return Boolean(f && below(c.x + 229, c.y + 114, f)); }),
};
/**
 * Something has been done, or something has been moved: tick whatever steps of the chosen
 * practical are now done. (A setting-up step is ticked only while the piece is in place.)
 */
function noteFlags(flags = []) {
  const exp = expNow();
  if (!exp) return;
  const seen = new Set(state.seen);
  if (flags.length) { flags.forEach((f) => seen.add(f)); state.seen = [...seen]; }
  const was = state.ticks && state.ticks.id === exp.id ? state.ticks.done : exp.steps.map(() => false);
  const after = exp.steps.map((st) => stepDone(st, seen, Q));
  if (after.every((d, i) => d === Boolean(was[i]))) return;
  const fresh = after.map((d, i) => d && !was[i]);
  state.ticks = { id: exp.id, done: after };
  renderGuide(fresh);
  if (!fresh.some(Boolean)) return;
  if (after.every(Boolean)) {
    if (!state.done.includes(exp.id)) state.done.push(exp.id);
    renderExperiments();
    say(`${exp.group === "setup" ? "Set up correctly" : "Practical complete"}: ${exp.title.replace(/^Set up: /, "")}.`);
  } else say(`Step ${after.filter(Boolean).length} of ${exp.steps.length} done.`);
}
function choose(id) {
  state.exp = id;
  state.seen = [];
  state.ticks = null;
  renderExperiments();
  renderGuide();
  save();
}
/** The practicals: the things to try, each a note with a picture of its bench. */
function renderExperiments() {
  let n = 0;
  $("cl-tasks").innerHTML = GROUPS.map((g) => `
    <li class="cl-expgroup"><h3>${esc(g.label)}</h3><ul class="cl-cards">${EXPERIMENTS.filter((e) => e.group === g.id).map((e) => {
      const done = state.done.includes(e.id), on = e.id === state.exp;
      return `<li class="cl-card pp-sticky pp-sticky--c${n++ % 6}${on ? " is-on" : ""}">
        <img src="shots/${e.id}.jpg" alt="" width="400" height="250" loading="lazy" />
        <h3>${esc(e.title)}${done ? `<span class="cl-card__done">${UI.check(14)}</span>` : ""}</h3>
        <button type="button" class="cl-try" data-exp="${e.id}" aria-label="Try: ${esc(e.title)}">${on ? "Open guide" : "Try"}</button>
      </li>`;
    }).join("")}</ul></li>`).join("");
  $("cl-count-tasks").textContent = `${state.done.filter((id) => EXPERIMENTS.some((e) => e.id === id)).length}/${EXPERIMENTS.length}`;
}
/** The guide: always the guide to the practical that has been chosen. */
function renderGuide(fresh = []) {
  const exp = expNow();
  const box = $("cl-setups");
  if (!exp) {
    box.innerHTML = `<li class="cl-guide"><p class="cl-guide__needs">No practical has been chosen yet. Pick one from the list of practicals (the tick icon, top left) and its guide appears here.</p>
      <h3>How the bench works</h3><ol>${HOWTO.map((t) => `<li>${chemHtml(t)}</li>`).join("")}</ol></li>`;
    return;
  }
  const seen = new Set(state.seen);
  const steps = exp.steps.map((st, i) => {
    const done = stepDone(st, seen, Q);
    return `<li class="cl-task${done ? " is-done" : ""}${fresh[i] ? " is-fresh" : ""}"><span class="cl-task__box">${done ? UI.check(16) : ""}</span><span>${chemHtml(st.text)}</span></li>`;
  }).join("");
  const answer = exp.unknown ? `<div class="cl-answer">
      <label>Cation <select id="cl-cation" class="cl-select" data-native><option value="">?</option>${CATIONS.map((c) => `<option value="${c}">${ion(c)}</option>`).join("")}</select></label>
      <label>Anion <select id="cl-anion" class="cl-select" data-native><option value="">?</option>${ANIONS.map((c) => `<option value="${c}">${ion(c)}</option>`).join("")}</select></label>
      <button type="button" class="cl-ico cl-ico--paper" data-guide="check" data-tip="Check my answer" aria-label="Check my answer">${UI.check(18)}</button>
      <button type="button" class="cl-ico cl-ico--paper" data-guide="fresh" data-tip="Give me a new sample X" aria-label="Give me a new sample X">${UI.refresh(18)}</button>
    </div>` : "";
  const all = exp.steps.every((st) => stepDone(st, seen, Q));
  box.innerHTML = `<li class="cl-guide">
    <div class="cl-guide__head"><h3>${esc(exp.title)}</h3><button type="button" class="cl-ico cl-ico--paper" data-guide="again" data-tip="Start this practical again" aria-label="Start this practical again">${UI.again(18)}</button></div>
    <p class="cl-guide__task">${chemHtml(exp.task)}</p>
    <p class="cl-guide__needs">You need: ${chemHtml(exp.needs)}.</p>
    <ul class="cl-tasks cl-guide__steps">${steps}</ul>${answer}
    ${all ? `<p class="cl-guide__record"><b>To record:</b> ${chemHtml(exp.record)}</p>` : ""}
  </li>`;
}
$("cl-tasks").addEventListener("click", (e) => {
  const b = e.target.closest("[data-exp]");
  if (!b) return;
  if (b.dataset.exp !== state.exp) choose(b.dataset.exp);
  openSheet("cl-sheet-setups");
});
$("cl-setups").addEventListener("click", (e) => {
  const b = e.target.closest("[data-guide]");
  if (!b) return;
  const what = b.dataset.guide;
  if (what === "again") { choose(state.exp); return; }
  if (what === "fresh") {
    state.items.filter((it) => it.kind === "reagent" && it.key === "unk").forEach(removeItem);
    const others = UNKNOWNS.filter((u) => u.id !== state.unknown);
    state.unknown = others[Math.floor(Math.random() * others.length)].id;
    setUnknown(state.unknown);
    choose("unknown");
    renderDrawer();
    say("A new sample X is in the drawer, under Liquids. Rinse out anything left from the old one.");
    return;
  }
  const u = UNKNOWNS.find((x) => x.id === state.unknown);
  const cat = $("cl-cation").value, an = $("cl-anion").value;
  if (!cat || !an) { say("Choose a cation and an anion first.", null, "no"); return; }
  if (cat === u.cation && an === u.anion) { noteFlags(["unknown:right"]); say(`Correct. X is ${reagent(u.id).name}.`); save(); }
  else say(cat === u.cation ? "The cation is right. Look again at the tests for the anion." : an === u.anion ? "The anion is right. Look again at what sodium hydroxide and ammonia did." : "Neither ion is right yet. Go back over your observations.", null, "no");
});

function openSheet(id) {
  document.querySelectorAll(".cl-sheet").forEach((s) => (s.hidden = s.id !== id || !s.hidden));
  document.querySelectorAll("[data-sheet]").forEach((b) => b.setAttribute("aria-pressed", String(!$(b.dataset.sheet).hidden)));
}
document.querySelectorAll("[data-ico]").forEach((b) => b.insertAdjacentHTML("afterbegin", ICON[b.dataset.ico]));
document.querySelectorAll("[data-sheet]").forEach((b) => b.addEventListener("click", () => openSheet(b.dataset.sheet)));
document.querySelectorAll(".cl-sheet__close").forEach((b) => { b.innerHTML = UI.close(14); b.addEventListener("click", () => openSheet(null)); });
$("cl-explain").addEventListener("click", () => { state.explain = !state.explain; renderLog(); save(); });
$("cl-clear-log").addEventListener("click", () => { state.log = []; renderLog(); save(); });
$("cl-clear").addEventListener("click", () => {
  clearBench();
  say("The bench is clear. Take what you want from the drawer and set it up.");
});

function renderDose() {
  document.querySelectorAll("[data-dose]").forEach((b) => {
    const on = b.dataset.dose === state.dose;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
document.querySelectorAll("[data-dose]").forEach((b) => b.addEventListener("click", () => { state.dose = b.dataset.dose; renderDose(); save(); }));

// ── PrepBot's hands ─────────────────────────────────────────────────────────
// PrepBot (prepbot.js) does experiments LIVE, with the real pieces. These are
// the same things a learner's hand does — take, move, pull a stopper, carry
// and pour, hold a splint, fit a funnel, turn a burner up — done by a script,
// each one taking a moment so that it can be watched.
let botBusy = false;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const actor = {
  onRecord: null,
  get W() { return W; },
  get BASE() { return BASE; },
  get TOP() { return TOP; },
  isBusy: () => botBusy,
  isEmptyBench: () => state.items.length === 0,
  busy(on) { botBusy = on; document.querySelector(".cl-stage").classList.toggle("is-bot", on); if (on) select(null); },
  clear() { clearBench(); },
  openSheet(id) { if ($(id).hidden) openSheet(id); },
  closeSheets() { openSheet(null); },
  // what is standing on the bench, for PrepBot's help
  count: (kind, key) => state.items.filter((it) => it.kind === kind && it.key.startsWith(key)).length,
  open: (key) => state.items.some((it) => it.kind === "reagent" && it.key === key && !fittedTo(it, "cap")),
  fitted: (key) => state.items.some((it) => it.key === key && it.on != null),
  lit: () => state.items.some((it) => (it.key === "burner" || it.key === "spirit") && it.flame > 0),
  // for the chat (A): what the drawer holds, where it is, and fetching it
  catalog: () => CATALOG.map((c) => ({ ...c, part: CATS.find((k) => k.id === c.cat).label, formula: c.kind === "reagent" ? reagent(c.key).formula : "", also: ALSO[c.key] || "" })),
  standing: () => state.items.filter((it) => it.key !== "cap").map((it) => plain(it)),
  chosen: () => { const e = expNow(); return e ? { title: e.title, task: e.task, needs: e.needs } : null; },
  // for the tutor's commands: the pieces themselves, the practicals, the drawer
  pieces: () => state.items.filter((it) => it.key !== "cap"),
  capOn: (bottle) => Boolean(fittedTo(bottle, "cap")),
  practicals: () => EXPERIMENTS.map((e) => ({ id: e.id, title: e.title })),
  pick(id) { if (!EXPERIMENTS.some((e) => e.id === id)) return false; choose(id); if ($("cl-sheet-setups").hidden) openSheet("cl-sheet-setups"); return true; },
  drawer(open) { setDrawer(!open); },
  /** Take a piece out of the drawer for the learner and stand it in a free place. */
  async bring(c) {
    const n = state.items.filter((it) => it.key !== "cap").length;
    const x = 120 + ((n * 97) % Math.max(200, W - 260));
    const it = await this.take(c.kind, c.key, x, c.kind === "reagent" ? TOP + (c.cat === "solid" ? 22 : 0) : BASE);
    $("cl-hint").hidden = true;
    if (it) flash(it);
    return it;
  },
  /** Open the drawer at the part that holds a piece, and mark the piece. */
  point(c) {
    setDrawer(false);
    $("cl-search").value = "";
    state.cat = c.cat;
    renderDrawer();
    const tile = document.querySelector(`.cl-tile[data-kind="${c.kind}"][data-key="${c.key}"]`);
    if (!tile) return;
    tile.scrollIntoView({ block: "center" });
    tile.classList.add("is-found");
    setTimeout(() => tile.classList.remove("is-found"), 4200);
  },
  /** The step of the chosen practical to do now; null when none has been chosen. */
  nextStep() {
    const exp = expNow();
    if (!exp) return null;
    const seen = new Set(state.seen);
    const did = exp.steps.map((st) => stepDone(st, seen, Q));
    const i = did.indexOf(false, did.lastIndexOf(true) + 1);
    if (i < 0) return { title: exp.title, done: true };
    return { title: exp.title, text: exp.steps[i].text, n: i + 1, of: exp.steps.length };
  },
  /** Take a piece out of the drawer: it comes in from the drawer's side and goes to its place. */
  async take(kind, key, x, y) {
    const it = addItem(kind, key, W - 70, 330) || state.items.find((o) => o.kind === kind && o.key === key);
    await pause(140);
    await this.move(it, x, y);
    return it;
  },
  async move(it, x, y, ms = 520) {
    raise(it);
    it.x = x;
    it.y = y;
    keepIn(it);
    glide(it, true);
    place(it);
    follow(it);
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { drawLinks(); await pause(60); }
    save();
  },
  /** Stand a vessel in a slot of a rack, a tripod, a clamp, a balance. */
  async into(v, host, slot = 0) {
    const [sx, sy] = slotAt(host, slot, VESSELS[v.key]);
    await this.move(v, host.x + sx, host.y + sy, 420);
    v.rack = [host.id, slot];
    save();
  },
  /** Pull the stopper (or the dropper) out and put it down beside the bottle. */
  async uncap(bottle) {
    const cap = fittedTo(bottle, "cap");
    if (!cap) return;
    cap.on = null;
    await this.move(cap, bottle.x + 54, bottle.y + (cap.v === "drop" ? -62 : cap.v === "jar" ? -16 : -8), 420);
  },
  /** Carry a bottle or a vessel to another vessel and pour `times` measures. */
  async pour(src, v, times = 1) {
    if (src.kind === "reagent" && leftIn(src) < fullOf(src) * 0.4) { src.left = fullOf(src); dress(src); }
    raise(src, src.kind === "vessel" ? L.items : L.fx);
    glide(src, true);
    nodes[v.id].g.classList.add("is-target");
    place(src, poseOn(src, v));
    if (src.kind === "vessel") paint(src, { tilt: -108 });
    await pause(520);
    for (let i = 0; i < times; i++) {
      const more = use(src, v);
      await pause(780);
      if (!more) break;
    }
    nodes[v.id] && nodes[v.id].g.classList.remove("is-target");
    raise(src);
    place(src);
    if (src.kind === "vessel") paint(src);
    await pause(380);
    save();
  },
  /** Hold a tool to a vessel (a splint at its mouth, litmus in it), then put it back. */
  async hold(tool, v, ms = 1400) {
    raise(tool, L.fx);
    glide(tool, true);
    place(tool, poseOn(tool, v));
    if (v.kind === "vessel") tuck(tool, v);
    await pause(520);
    use(tool, v);
    await pause(ms);
    raise(tool);
    place(tool);
    await pause(420);
    setTimeout(() => resetTool(tool), 1800);
  },
  /** Fit a funnel, a stopper, a delivery tube, a condenser or a carbon rod to a vessel. */
  async fit(tool, v) {
    if (tool.key === "electrode") tool.side = sideFor(v, tool);
    const m = seat(v, tool);
    await this.move(tool, m.x, m.y, 460);
    tool.on = v.id;
    place(tool);
    dress(tool);
    if (tool.key === "chroma") runChroma(tool);
    if (tool.key === "bung1") catchPuff(v);
    if (tool.key === "tubing") catchPuff(vesselOfTube(tool));
    drawLinks();
    if (tool.key === "paper") { foldIn(tool); await pause(FOLD_MS); }
    noteFlags([`fitted:${tool.key}`]);
    save();
  },
  /** Take a fitted thing off again (a funnel out of a flask) and put it down. */
  async lift(tool, x, y) {
    tool.on = null;
    await this.move(tool, x, y, 460);
    dress(tool);
  },
  inHost: (hostKey) => Q.inHost(hostKey),
  /** Run a centrifuge and wait for it to stop. */
  async spin(c) {
    if (!spinCentrifuge(c)) return false;
    await pause(4200);
    return true;
  },
  /** Slide a retort stand's clamp up or down its rod. */
  async slide(stand, to) {
    stand.clamp = clamp(to, SUPPORTS.stand.clamp[0], SUPPORTS.stand.clamp[1]);
    dress(stand);
    follow(stand);
    flash(stand);
    await pause(520);
    save();
  },
  /** Hold a gas syringe level in a stand's clamp. */
  async clampSyringe(sy, stand) {
    await this.move(sy, stand.x + 78, stand.y + (stand.clamp ?? CLAMP) + 9, 460);
    sy.rack = [stand.id, 0];
    follow(stand);
    save();
  },
  /** Turn an empty tube upside down. */
  async flip(v) {
    v.flip = true;
    v.jar = null;
    glide(v, true);
    place(v);
    paint(v);
    follow(v);
    await pause(520);
    save();
  },
  /** Let an empty gas jar go in a trough: it turns over and stands there. */
  async upturnIn(jar, trough) {
    jar.flip = true;
    jar.jar = null;
    await this.into(jar, trough, 0);
    place(jar);
    paint(jar);
    save();
  },
  /** Lead the end of a delivery tube's rubber to a collector. */
  async lead(tube, target) {
    const e = endOf(tube), m = mouth(target), a = { x: e.x - tube.x, y: e.y - tube.y }, z = { x: m.x - tube.x, y: m.y - tube.y };
    for (let i = 1; i <= 12; i++) { tube.ex = a.x + ((z.x - a.x) * i) / 12; tube.ey = a.y + ((z.y - a.y) * i) / 12; drawLinks(); await pause(45); }
    tube.to = target.id;
    drawLinks();
    await pause(500);
    save();
  },
  // the setting-up practicals, as PrepBot sees them
  setupSteps: (id) => { const e = EXPERIMENTS.find((x) => x.id === id); return e ? e.steps.map((st) => ({ text: st.text, done: stepDone(st, new Set(), Q) })) : []; },
  setupDone(id) { const s = this.setupSteps(id); return s.length > 0 && s.every((x) => x.done); },
  onChange: null,
  /** Stand and watch (a chromatogram running). */
  async wait(ms) { await pause(ms); },
  async flame(burner, level) {
    burner.flame = level;
    dress(burner);
    flash(burner);
    await pause(500);
    save();
  },
  /** Hold a lit burner under a vessel until there is nothing more to boil off. */
  async heat(burner, v) {
    const home = [burner.x, burner.y];
    await this.move(burner, v.x, Math.min(v.y + HEAT[burner.key], H - 8), 520);
    for (let i = 0; i < 12; i++) {
      await pause(820);
      if (!use(burner, v)) break;
    }
    await pause(600);
    await this.move(burner, home[0], home[1], 520);
  },
};
import("./prepbot.js").then((m) => m.initPrepbot(actor)).catch((e) => console.warn("PrepBot did not load", e));

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
  else if ((e.key === "o" || e.key === "O") && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); setNotes(state.notes === false); }
  else if ((e.key === "Delete" || e.key === "Backspace") && selected && selected.key !== "cap") { e.preventDefault(); removeItem(selected); }
});

// ── the observation note, put away and brought back ──
$("cl-note-key").addEventListener("click", () => setNotes(state.notes === false));
$("cl-say").addEventListener("click", () => { clearTimeout(noteTimer); $("cl-say").classList.remove("is-shown"); });
{
  const on = state.notes !== false, b = $("cl-note-key");
  b.setAttribute("aria-pressed", String(on));
  b.classList.toggle("is-on", on);
  b.dataset.tip = on ? "Hide the observation note (O)" : "Show the observation note (O)";
}

// ── the drawer's arrow ──────────────────────────────────────────────────────
const DRAWER_KEY = "chem-bench-drawer";
function setDrawer(shut) {
  document.querySelector(".cl-stage").classList.toggle("is-shut", shut);
  const b = $("cl-drawer-key");
  const tip = shut ? "Show the drawer" : "Hide the drawer";
  b.dataset.tip = tip;
  b.setAttribute("aria-label", tip);
  b.setAttribute("aria-expanded", String(!shut));
  try { localStorage.setItem(DRAWER_KEY, shut ? "shut" : "open"); } catch { /* private mode */ }
}
$("cl-drawer-key").innerHTML = UI.chevronRight(18);
$("cl-drawer-key").addEventListener("click", () => setDrawer(!document.querySelector(".cl-stage").classList.contains("is-shut")));
{
  let was = "open";
  try { was = localStorage.getItem(DRAWER_KEY) || "open"; } catch { /* private mode */ }
  if (was === "shut") setDrawer(true);
}

// ── the desk: the results table, its graph, and the calculator (desk.js) ────
import("./desk.js").then((d) => {
  const desk = d.initDesk({ state, save, say });
  actor.calculator = (on) => desk.toggleCalc(on);
  const bars = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="${d}" fill="none" stroke="var(--text-tertiary)" stroke-width="2.2" stroke-linecap="round"/><path d="M18 14v8M14 18h8" fill="none" stroke="var(--accent-success)" stroke-width="2.6" stroke-linecap="round"/></svg>`;
  document.querySelectorAll("[data-table]").forEach((b) => { b.innerHTML = { row: bars("M3 5h18M3 11h18M3 17h7"), col: bars("M5 3v18M11 3v18M17 3v7"), wipe: UI.eraser(16) }[b.dataset.table]; });
}).catch((e) => console.warn("The desk did not load", e));

// ── go ──────────────────────────────────────────────────────────────────────
$("cl-rot").innerHTML = ICON.turn;
$("cl-dots").innerHTML = ICON.dots;
fitWorld();
if (restored) {
  state.items.forEach((it) => { keepIn(it); mount(it); });
  // a bench saved before droppers pulled out: give each dropper bottle its dropper
  state.items.filter((it) => it.kind === "reagent" && !state.items.some((c) => c.key === "cap" && c.of === it.id)).forEach((it) => {
    const m = mouth(it);
    addItem("tool", "cap", m.x, m.y, { v: capOf(it.key), on: it.id, of: it.id, rgb: colourOf(it.key) });
  });
}
if (restored) {
  state.items.filter((t) => t.key === "tubing" && t.on && byId(t.on) && byId(t.on).kind === "vessel").forEach((t) => {
    const v = byId(t.on), mo = mouth(v);
    const s = addItem("tool", "bung1", mo.x, mo.y, { on: v.id });
    t.on = s.id; t.x = s.x; t.y = s.y;
    place(s); place(t);
    save();
  });
}
if (restored && !state.papers) {
  state.items.filter((it) => it.key === "funnel").forEach((f) => addItem("tool", "paper", f.x, f.y, { on: f.id }));
}
state.papers = true;
$("cl-hint").hidden = state.items.length > 0;
readouts();
drawLinks();
renderDrawer();
renderLog();
renderExperiments();
renderGuide();
renderDose();
onFull();
mountTooltips();
new ResizeObserver(fitWorld).observe(wrap);
