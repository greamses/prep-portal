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

import { REAGENTS, TASKS, newTube, add, heat, rinse, test, tasksDone, reagent, chemHtml, isEmpty, look, takeFrom, pourIn, roomIn, flameOf, massOf, boilOff, filterOut, sampleOf, gasMade, takeBottom, electrolyse } from "./chem.js";
import { DEFS, VESSELS, TOOLS, SUPPORTS, vesselSvg, paintVessel, bubble, reagentSvg, toolSvg, splintAfter, supportSvg, thumb, colourOf, mouthOf, capOf } from "./glass.js";
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
const STAYS = ["funnel", "bung", "tubing", "cap", "condenser", "electrode"];   // fitted, and left there
const PLUGS = ["funnel", "bung", "tubing"];           // one of these to a mouth
const IDLE = ["waste", "syringe", "power", "holder", "tongs"];                 // never used ON anything
const LIGHT = ["H2", "NH3"];                          // less dense than air: they rise
const GAS = { H2: "hydrogen", CO2: "carbon dioxide", O2: "oxygen", NH3: "ammonia" };
const CLAMP = -262;                                   // where a stand's clamp starts, above its foot
const NS = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** A sentence from chem.js; a formula inside it is written {Fe(OH)3}. */
const prose = (s) => esc(s).replace(/\{([^}]+)\}/g, (_, f) => chemHtml(f));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const cm3 = (portions) => `${(portions * 2).toFixed(portions * 2 >= 10 ? 0 : 1)} cm³`;

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
  away: UI.close(18),
  eye: UI.eye(18),
  eyeOff: UI.eyeOff(18),
  wipe: UI.eraser(18),
  turn: UI.rotateRight(18),
  dots: glyph(`<circle cx="5" cy="12" r="2.4" fill="var(--accent-secondary)"/><circle cx="12" cy="12" r="2.4" fill="var(--accent-primary)"/><circle cx="19" cy="12" r="2.4" fill="var(--accent-danger)"/>`, 18),
  flip: UI.upDown(18),
  fire: UI.fire(18),
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
  trough: "gas collection over water pneumatic", tubing: "delivery tube bung", bung: "bung cork", funnel: "filtration filter", burner: "bunsen heat", syringe: "gas volume measure",
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

const boxOf = (it) => (it.kind === "vessel" ? VESSELS[it.key].bbox : it.kind === "tool" ? TOOLS[it.key].bbox : it.kind === "rack" ? SUPPORTS[it.key].bbox : REAGENT_BOX[reagent(it.key).kind]);
const nameOf = (it) => (it.kind === "vessel" ? `${VESSELS[it.key].name} ${it.tag}` : it.key === "cap" ? "Stopper" : CATALOG.find((c) => c.kind === it.kind && c.key === it.key).name);
/** "test tube A", for the middle of a sentence. */
const plain = (v) => (v.kind === "vessel" ? `${VESSELS[v.key].name.replace(/ \(.*/, "").toLowerCase()} ${v.tag}` : nameOf(v).toLowerCase());

// ── guides: what an experiment needs and what to do. They put nothing out. ───
const GUIDES = [
  { name: "Test-tube reactions", needs: "test tube rack, test tubes, bottles of solutions", steps: ["Stand tubes in the rack.", "Pull the stopper out of a bottle, carry the bottle to a tube and hold it there to pour.", "Add a second solution and watch. Switch to drops to add a little at a time, then in excess."] },
  { name: "Titration", needs: "retort stand, burette, conical flask, pipette, an acid, an alkali, phenolphthalein", steps: ["Slide the stand's clamp up by its yellow boss and let the burette go at the clamp.", "Fill the burette: carry the acid to its top.", "Pipette 25 cm³ of alkali into the flask (the pipette fills straight from the bottle) and add the indicator.", "Stand the flask under the burette and press the blue tap. Near the end, switch to drops."] },
  { name: "Filtration", needs: "two beakers or a flask, funnel and filter paper, two solutions that give a precipitate", steps: ["Make the precipitate in a beaker.", "Let the funnel go at the mouth of the other vessel: it stays there.", "Pour the mixture in. The solid stays in the paper."] },
  { name: "Collecting a gas over water", needs: "flask, stopper and delivery tube, trough, gas jar, distilled water, a metal or marble, an acid", steps: ["Fill the trough from the water bottle.", "Let an empty gas jar go in the trough: it turns over and fills with water.", "Fit the delivery tube in the flask and drag its orange end to the gas jar.", "Put the solid and then the acid in the flask. Lift the jar out to test the gas."] },
  { name: "Other ways to collect a gas", needs: "delivery tube, gas syringe, or a boiling tube", steps: ["Lead the tube's end to a gas syringe to measure any gas.", "For a gas lighter than air (hydrogen, ammonia), turn an empty tube upside down from its menu and lead the tube up into it.", "For a gas denser than air (carbon dioxide), lead the tube down into an upright jar."] },
  { name: "Distillation", needs: "retort stand, distilling flask, Liebig condenser, a beaker, a burner, a lighted splint, a coloured solution", steps: ["Clamp the distilling flask high enough for a burner to go underneath.", "Push the condenser onto the flask's side arm.", "Stand a beaker under the condenser's lower end.", "Pour the solution in, light the burner with the splint, and hold it under the flask."] },
  { name: "Evaporating to crystals", needs: "tripod and gauze, evaporating dish, burner, lighted splint, a salt solution, balance", steps: ["Stand the dish on the tripod and pour the solution in.", "Light the burner and hold it underneath until the water has gone.", "Weigh the dish on the balance. The red T sets the reading to zero."] },
  { name: "Separating oil and water", needs: "retort stand, separating funnel, two beakers, cooking oil, water", steps: ["Hang the separating funnel in the clamp and stand a beaker under it.", "Pour in water, then oil. They settle into two layers.", "Press the tap. It shuts itself when the lower layer has run out."] },
  { name: "Electrolysis", needs: "beaker, two carbon electrodes, power pack, a solution", steps: ["Pour the solution into the beaker.", "Let each carbon rod go at the beaker's mouth: they hang in the liquid.", "Put the power pack on the bench: it wires itself to the rods.", "Hold down the red switch and watch each rod."] },
  { name: "Flame tests", needs: "burner, lighted splint, flame-test wire, salt solutions in tubes", steps: ["Light the burner.", "Dip the wire in a solution, then hold it in the flame."] },
  { name: "Pouring by hand", needs: "any two vessels", steps: ["Tap a vessel to select it, then drag the round arrow above it to tilt it.", "Tilt far enough and it pours on whatever is underneath, so have the other vessel there first."] },
];

// ── what is remembered between visits ───────────────────────────────────────
const state = { items: [], n: 0, dose: "portion", explain: true, done: [], log: [], cat: "glass" };
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
const plugIn = (v) => state.items.find((a) => a.on === v.id && PLUGS.includes(a.key));
const rodsIn = (v) => state.items.filter((a) => a.on === v.id && a.key === "electrode").sort((a, b) => (a.side || 0) - (b.side || 0));
const hostOf = (v) => (v.rack ? byId(v.rack[0]) : null);
/** An upturned jar standing in a trough with water in it: gas can be collected over the water. */
const overWater = (v) => { const h = v.flip && hostOf(v); return Boolean(h && h.key === "trough" && h.t.vol >= h.t.cap * 0.12); };

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

const isBehind = (it) => it.kind === "rack" || it.key === "syringe" || it.key === "trough";
function mount(it) {
  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", `cl-item cl-item--${it.kind}`);
  g.dataset.item = it.id;
  g.dataset.key = it.key;
  const node = (nodes[it.id] = { g });
  if (it.kind === "vessel") g.innerHTML = vesselSvg(it.key, it.id, it.tag);
  else if (it.kind === "reagent") { g.innerHTML = reagentSvg(it.key, it.id); g.dataset.rk = reagent(it.key).kind; }
  else if (it.kind === "tool") g.innerHTML = toolSvg(it.key, it);
  else {
    const r = supportSvg(it.key);
    g.innerHTML = r.back;
    node.front = document.createElementNS(NS, "g");
    node.front.setAttribute("class", "cl-item-front");
    node.front.innerHTML = r.front;
    L.front.appendChild(node.front);
  }
  (isBehind(it) ? L.back : L.items).appendChild(g);
  place(it);
  if (it.kind === "vessel") paint(it);
  dress(it);
}
/** How far up a piece its turning point is (it turns about its middle). */
const pivotOf = (it) => (it.kind === "vessel" ? VESSELS[it.key].top / 2 : -mouthOf(it.key) / 2);
function place(it, transform) {
  const n = nodes[it.id];
  if (!n) return;
  let t = transform;
  if (!t) {
    t = `translate(${it.x}px, ${it.y}px)`;
    // upturned: it.y is where the MOUTH is, and the closed end is above it
    if (it.flip) t += ` rotate(180deg) translate(0px, ${-VESSELS[it.key].top}px)`;
    else if (it.tilt) { const c = pivotOf(it); t += ` translate(0px, ${c}px) rotate(${it.tilt}deg) translate(0px, ${-c}px)`; }
  }
  n.g.style.transform = t;
  if (n.front) n.front.style.transform = t;
}
function paint(it, opts = {}) {
  const g = nodes[it.id].g;
  const out = paintVessel(g, it.key, it.t, { seed: Number(it.id.slice(1)) + 1, tilt: it.tilt || 0, ...opts });
  if (it.flip) {
    // an upturned jar over water is full of the trough's water, less whatever gas has pushed it down
    const def = VESSELS[it.key], Hh = -def.top, liq = g.querySelector(".cl-liquidg");
    if (overWater(it)) {
      const f = it.jar ? Math.min(1, it.jar.n / def.invert) : 0;
      liq.style.transform = `translateY(${-(Hh * f).toFixed(1)}px)`;
      const c = look(hostOf(it).t);
      g.querySelector(".cl-liquid").style.fill = `rgba(${c.rgb},${Math.max(c.a, 0.32)})`;
    } else liq.style.transform = `translateY(${Hh}px)`;
    g.querySelector(".cl-meniscus").setAttribute("rx", 0);
  }
  // a trough's water is also what stands in the jar upturned in it
  if (it.key === "trough") vessels().filter((v) => v.flip && v.rack && v.rack[0] === it.id && nodes[v.id]).forEach((v) => paint(v));
  return out;
}
/** Bring a piece to the front of its layer, and whatever is fitted to it in front of that. */
function raise(it, layer = L.items) {
  if (!nodes[it.id] || isBehind(it)) return;
  layer.appendChild(nodes[it.id].g);
  state.items.filter((o) => o.on === it.id).forEach((o) => raise(o, layer));
}
function glide(it, on = true) {
  const n = nodes[it.id];
  if (!n) return;
  n.g.classList.toggle("is-gliding", on);
  if (n.front) n.front.classList.toggle("is-gliding", on);
}
/** A piece shows the state it is in: what a dropper holds, whether a burner is lit, where a clamp is. */
function dress(it) {
  const n = nodes[it.id];
  if (!n) return;
  const g = n.g;
  if (TAKES[it.key]) g.querySelector(".cl-drop-liq").style.fill = it.sample ? `rgba(${it.rgb || [200, 224, 240]},0.9)` : "transparent";
  if (it.key === "wire") g.querySelector(".cl-loop").style.fill = it.sample ? "#f2f6fb" : "transparent";
  if (it.key === "funnel") g.querySelector(".cl-residue").style.fill = it.residue ? `rgb(${it.residue})` : "transparent";
  if (HEAT[it.key]) g.classList.toggle("is-unlit", !it.lit);
  if (it.key === "electrode") g.querySelector(".cl-coat").setAttribute("fill", it.coat === "Cu" ? "#b9683e" : it.coat === "Ag" ? "#d9dde2" : "transparent");
  if (it.key === "syringe") {
    const n2 = it.gas ? it.gas.n : 0;
    g.querySelector(".cl-plunger").style.transform = `translateX(${(Math.min(1, n2 / 8.34) * 104).toFixed(1)}px)`;
    g.querySelector(".cl-read").textContent = `${Math.round(n2 * 12)} cm³`;
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
    if (it.key === "burette") g.querySelector(".cl-read").textContent = it.t.vol > 0 ? `${((it.t.cap - it.t.vol) * 2).toFixed(2)} cm³` : "";
    else if (it.kind === "rack" && it.key === "balance") {
      const v = vessels().find((o) => o.rack && o.rack[0] === it.id);
      let m = 0;
      if (v) m = VESSELS[v.key].g + massOf(v.t) + state.items.filter((a) => a.on === v.id).length * 12;
      it.gross = m;
      g.querySelector(".cl-lcd").textContent = `${(m - (it.tare || 0)).toFixed(2)} g`;
    }
  }
}

// ── what stands on what, and what is fitted to what ─────────────────────────
function mouth(o) {
  if (o.kind === "vessel") return o.flip ? { x: o.x, y: o.y } : { x: o.x, y: o.y + VESSELS[o.key].top };
  if (o.kind === "reagent") return { x: o.x, y: o.y - mouthOf(o.key) };
  if (o.key === "syringe") return { x: o.x - 104, y: o.y - 128 };
  return { x: o.x, y: o.y - 66 };
}
const rimOf = (o) => (o.kind === "vessel" ? VESSELS[o.key].rTop : o.kind === "reagent" ? 12 : 50);
/** Where a fitted thing sits on its host: a condenser on the side arm, carbon rods left and right, anything else in the mouth. */
function seat(host, it) {
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
  if (host.kind === "rack" && host.key === "stand") return [sx, (host.clamp ?? CLAMP) - 1 - def.top - def.grip];
  return [sx, sy];
}
/** Whatever rides on `it`: vessels in its slots, things fitted to it, and whatever rides on those. */
function ridersOf(it, out = []) {
  for (const o of state.items) {
    if (o === it || out.includes(o)) continue;
    if ((o.rack && o.rack[0] === it.id) || o.on === it.id) { out.push(o); ridersOf(o, out); }
  }
  return out;
}
/** `it` has been put somewhere by the page, not the hand: its riders go with it. */
function follow(it, smooth = true) {
  for (const o of state.items) {
    if (o.on === it.id) { const m = seat(it, o); o.x = m.x; o.y = m.y; }
    else if (o.rack && o.rack[0] === it.id) { const [sx, sy] = slotAt(it, o.rack[1], VESSELS[o.key]); o.x = it.x + sx; o.y = it.y + sy; }
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
    if (it.flip && !(VESSELS[host.key] && VESSELS[host.key].upturns)) continue;      // an upturned tube only stands in a trough
    const taken = new Set(vessels().filter((v) => v !== it && v.rack && v.rack[0] === host.id).map((v) => v.rack[1]));
    for (let i = 0; i < S.slots.length; i++) {
      if (taken.has(i)) continue;
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
      if (up) { paint(it); say(overWater(it) ? `${cap1(plain(it))} is upside down in the trough, full of water. Lead a delivery tube to it.` : "The jar is upside down in the trough, but there is no water to hold in it. Fill the trough.", it); }
      return true;
    }
  }
  return false;
}

/** Where a delivery tube's free end is. */
function endOf(tube) {
  const o = tube.to && byId(tube.to);
  if (!o) return { x: tube.x + (tube.ex ?? 96), y: tube.y + (tube.ey ?? 30), dir: "free" };
  if (o.key === "syringe") return { x: o.x - 104, y: o.y - 128, dir: "side" };
  if (o.flip) return { x: o.x, y: o.y - 12, dir: "up" };
  return { x: o.x, y: o.y + VESSELS[o.key].top + 26, dir: "down" };
}
/** Rubber tubing and wires: the things that join two pieces. */
function drawLinks() {
  let html = "";
  for (const t of tools("tubing")) {
    if (!nodes[t.id]) continue;
    const a = { x: t.x + 30, y: t.y - 42 }, b = endOf(t);
    const sag = Math.max(36, Math.abs(b.x - a.x) * 0.25);
    const c2 = b.dir === "down" ? `${b.x} ${b.y - sag - 30}` : b.dir === "up" ? `${b.x} ${b.y + sag + 30}` : b.dir === "side" ? `${b.x - sag} ${b.y}` : `${b.x - 20} ${b.y - 30}`;
    html += `<path class="cl-link" d="M${a.x} ${a.y}C${a.x + sag} ${a.y - 6} ${c2} ${b.x} ${b.y}"/>`;
    html += `<g class="cl-end${b.dir === "free" ? " is-free" : ""}" data-end="${t.id}"><circle cx="${b.x}" cy="${b.y}" r="16" fill="transparent"/><circle class="cl-end__dot" cx="${b.x}" cy="${b.y}" r="6.5"/></g>`;
  }
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
    if (t) t.textContent = wired ? (rod.side < 0 ? "−" : "+") : "";
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
    addItem("tool", "cap", m.x, m.y, { v: capOf(key), on: it.id, of: it.id });
  }
  renderDrawer();
  $("cl-hint").hidden = true;
  return it;
}
function removeItem(it) {
  const n = nodes[it.id];
  if (n) { n.g.remove(); if (n.front) n.front.remove(); }
  delete nodes[it.id];
  state.items = state.items.filter((o) => o !== it);
  state.items.forEach((o) => {
    if (o.rack && o.rack[0] === it.id) { o.rack = null; if (o.flip) { o.flip = false; place(o); paint(o); } }
    if (o.on === it.id) o.on = null;
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
  Object.values(nodes).forEach((n) => { n.g.remove(); if (n.front) n.front.remove(); });
  for (const k of Object.keys(nodes)) delete nodes[k];
  state.items = [];
  L.fx.innerHTML = "";
  L.links.innerHTML = "";
  select(null);
  $("cl-hint").hidden = false;
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
/** A gas has come off in v. Where does it go? */
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
  if (!tube) return;
  const c = tube.to && byId(tube.to);
  const name = GAS[g.gas];
  if (!c) { res.obs.push({ text: "The gas comes out of the open end of the delivery tube and is lost.", why: "Drag the orange end of the tube to a gas jar, a gas syringe or a collecting tube." }); return; }
  if (c.key === "syringe") {
    c.gas = { k: g.gas, n: Math.min(8.34, (c.gas && c.gas.k === g.gas ? c.gas.n : 0) + g.n) };
    dress(c);
    res.obs.push({ text: `The plunger of the gas syringe is pushed out. It reads ${Math.round(c.gas.n * 12)} cm³.`, why: "A gas syringe measures the volume of a gas directly, whatever the gas is." });
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
    res.obs.push({ text: `Bubbles rise through the water into ${plain(c)}: ${Math.round(c.jar.n * 12)} cm³ collected.`, why: "Collection over water: the gas pushes the water down out of the jar. It works for gases that do not dissolve much." });
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
    const b = boxOf(it), cy = it.y + (b.y0 + b.y1) / 2;
    return nearest(open(), (v) => {
      const m = mouth(v), dx = Math.abs(it.x - m.x);
      return dx < VESSELS[v.key].rTop + 48 && cy > m.y - 160 && cy < m.y + 46 ? dx : -1;
    });
  }
  // ── tools ──
  if (IDLE.includes(it.key)) return null;
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
  if (PLUGS.includes(it.key)) {
    return nearest(open().filter((v) => !VESSELS[v.key].tap && !plugIn(v)), (v) => {
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
  if (it.key === "lit") list.push(...heaters().filter((b) => !b.lit));
  if (TAKES[it.key] && !it.sample) list.push(...state.items.filter((o) => o.kind === "reagent" && reagent(o.key).kind === "solution" && !reagent(o.key).oil));
  const atTip = MOUTH.includes(it.key) || it.key === "wire";
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
  if (STAYS.includes(it.key)) { const s = seat(v, { ...it, side: sideFor(v, it) }); return `translate(${s.x}px, ${s.y}px)`; }
  const m = HEAT[v.key] && it.key === "lit" ? { x: v.x, y: v.y - HEAT[v.key] + 46 } : mouth(v);
  if (it.kind === "vessel") return HEAT[v.key] ? `translate(${v.x}px, ${v.y - HEAT[v.key]}px)` : tipping(it, m);
  if (it.kind === "reagent") return reagent(it.key).kind === "indicator" ? `translate(${m.x}px, ${m.y - 24}px)` : tipping(it, m);
  if (HEAT[it.key]) return `translate(${v.x}px, ${Math.min(v.y + HEAT[it.key], H - 8)}px)`;
  if (it.key === "wire" && v.kind === "tool") return `translate(${v.x + 34}px, ${v.y - HEAT[v.key] + 26 + 58}px)`;
  const deep = v.kind === "vessel" && !v.flip ? Math.min((-VESSELS[v.key].top - (VESSELS[v.key].floor || 0)) * 0.62, 96) : v.kind === "reagent" ? 52 : 14;
  if (MOUTH.includes(it.key)) return `translate(${m.x + 34}px, ${m.y + 54 + (v.flip ? 8 : 0)}px)`;
  if (it.key === "wire") return `translate(${m.x + 34}px, ${m.y + 58 + deep}px)`;
  if (it.key === "thermo" || it.key === "meter") return `translate(${m.x}px, ${m.y + deep}px)`;
  if (TAKES[it.key]) return `translate(${m.x}px, ${m.y + (it.sample ? -4 : deep)}px)`;
  return `translate(${m.x}px, ${m.y + (v.flip ? 44 : 18)}px)`;
}
/** Which side of a beaker a carbon rod goes: the first on the left, the second on the right. */
const sideFor = (v, it) => (it.key !== "electrode" ? 0 : rodsIn(v).some((r) => r !== it && r.side < 0) ? 1 : -1);

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
/** Pour a measure from an open bottle into v. */
function pourReagent(bottle, v, amount) {
  const r = reagent(bottle.key);
  const res = add(v.t, bottle.key, r.kind === "solution" ? amount : state.dose, bottle.k || 1);
  if (res.refused) { say(res.refused, v, "no"); return null; }
  const painted = paint(v, { fresh: res.flags.some((f) => f.startsWith("ppt:")) });
  v._surface = v.y - Math.max(painted.level, 10);
  if (res.flags.some((f) => f.startsWith("gas:"))) bubble(nodes[v.id].g, v.key, v.t, res.flags.includes("gas:O2") ? 1.8 : 1);
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
    const res = deliver(v, takeFrom(it.t, n), plain(it), c);
    paint(it, { tilt: -108 });
    if (res) stream(mouth(v), v._surface, c);
    save();
    return Boolean(res) && it.t.vol + (it.t.oil || 0) > 0;
  }
  // ── a lighted splint, at a burner ──
  if (HEAT[v.key] && it.key === "lit") {
    v.lit = true;
    dress(v);
    say(`The ${nameOf(v).toLowerCase()} is lit.`);
    save();
    return false;
  }
  // ── the wire, in a flame ──
  if (it.key === "wire" && v.kind === "tool") {
    if (!v.lit) { say("The burner is not lit. Hold a lighted splint to it.", null, "no"); return false; }
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
    it.sample = sampleOf(v.key, TAKES[it.key], v.k || 1);
    it.rgb = colourOf(v.key);
    dress(it);
    say(`The ${nameOf(it).replace(/ \(.*/, "").toLowerCase()} is holding ${cm3(TAKES[it.key])} of ${reagent(v.key).name}. Carry it to a vessel.`);
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
    const c = colourOf(it.key);
    if (r.kind === "solution") stream(m, v._surface, c);
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
  else if (it.key === "ph") g.querySelector(".cl-paper").style.fill = `rgb(${a})`;
  else if (it.key === "meter") g.querySelector(".cl-lcd").textContent = a;
  else if (it.key === "thermo") { const len = 22 + Number(a) * 1.1; const col = g.querySelector(".cl-merc"); col.setAttribute("y", -4 - len); col.setAttribute("height", len); }
  else g.dataset.end = b;
}
/** Heat a vessel. A distilling flask sends water over; a dish boils down to crystals. Returns true to go on heating. */
function warm(heater, v) {
  if (!heater.lit) { say(`The ${nameOf(heater).toLowerCase()} is not lit. Hold a lighted splint to it, or light it from its menu.`, null, "no"); return false; }
  const def = VESSELS[v.key];
  const res = heat(v.t);
  if (res.refused) { say(res.refused, v, "no"); return false; }
  let more = false;
  const noNone = () => { res.obs = res.obs.filter((o) => !/No other change/.test(o.text)); };
  if (def.arm) {
    noNone();
    const cond = fittedTo(v, "condenser");
    if (!cond) {
      const w = boilOff(v.t, def.cap * 0.06);
      if (w.gone > 0) { res.obs.push({ text: "The liquid boils, and steam pours out of the side arm into the room.", why: "Push a condenser onto the side arm: it cools the steam back to water so that it can be collected." }); more = true; } else res.obs.push({ text: "Stop heating: the flask must not boil dry." });
    } else {
      const out = { x: cond.x + 229, y: cond.y + 114 };
      const recv = below(out.x, out.y, v);
      const coloured = look(v.t).name !== "colourless";
      const w = boilOff(v.t, Math.min(def.cap * 0.1, recv ? roomIn(recv.t) : def.cap));
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
    const w = boilOff(v.t, Math.max(1, def.cap * 0.3), { dry: true });
    noNone();
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
    drops([bur.x, bur.y], v._surface, c, 2.4);
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
  drops([bur.x, bur.y], v._surface, c, 2.2);
  const seen = res.obs.map((o) => o.text).filter((t) => t !== "No visible change.").join(" ");
  say(`${seen ? `${seen} ` : ""}The burette reads ${((bur.t.cap - bur.t.vol) * 2).toFixed(2)} cm³.`, v);
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
  if (res.flags.length) bubble(nodes[v.id].g, v.key, v.t, 1.4);
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
  if (what === "power") startTap(it, runCell, 900);
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
const canTurn = (it) => (it.kind === "vessel" && !VESSELS[it.key].fixed && !it.flip) || (it.kind === "reagent" && reagent(it.key).kind !== "indicator");
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
  if (isBottle ? fittedTo(it, "cap") : fittedTo(it, "bung")) { if (!turn.told) { turn.told = true; isBottle ? capped(it) : stoppered(it); } return; }
  if (!isBottle && it.t.vol + (it.t.oil || 0) <= 0) return;
  const lip = lipOf(it);
  const v = below(lip.x, lip.y, it);
  const c = isBottle ? colourOf(it.key) : look(it.t).rgb;
  const speed = 1 + Math.min(2, over / 25);
  if (v && !fittedTo(v, "bung")) {
    const n = (isBottle ? Math.max(0.5, VESSELS[v.key].cap / 30) : Math.min(it.t.vol + (it.t.oil || 0), Math.max(0.5, it.t.cap / 30))) * speed;
    const m = Math.min(n, roomIn(v.t));
    if (m <= 1e-6) { if (!turn.told) { turn.told = true; say("It is full, and running over.", v, "no"); } return; }
    const res = isBottle ? pourReagent(it, v, m) : deliver(v, takeFrom(it.t, m), plain(it), c, turn.spilt ? null : "tilted");
    if (!isBottle) paint(it);
    if (res) fx(`<rect class="cl-stream" x="${lip.x - 2.5}" y="${lip.y}" width="5" height="${Math.max(16, v._surface - lip.y)}" rx="2.5" fill="rgba(${c},0.85)"/>`, 520);
    return;
  }
  // nothing underneath: it goes on the bench
  if (!isBottle) { takeFrom(it.t, Math.max(0.5, it.t.cap / 30) * speed); paint(it); }
  fx(`<rect class="cl-stream" x="${lip.x - 2.5}" y="${lip.y}" width="5" height="${H - lip.y}" rx="2.5" fill="rgba(${c},0.85)"/><ellipse class="cl-puddle" cx="${lip.x}" cy="${H - 6}" rx="46" ry="6" fill="rgba(${c},0.5)"/>`, 900);
  if (!turn.spilt) { turn.spilt = true; say("It is pouring onto the bench! Hold it over a vessel before you tilt it.", isBottle ? null : it, "no"); }
  save();
}

// ── hands ───────────────────────────────────────────────────────────────────
let drag = null;
let selected = null;
let tileDrag = null;
let swallow = false;
let endDrag = null;                // the free end of a delivery tube, being led somewhere

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
  drag.over = null;
  drag.sits = false;
  drag.go = null;
}
function enter(target) {
  const { it } = drag;
  drag.over = target;
  // some things, once put there, stay: a vessel over a flame, and anything that is fitted
  drag.sits = (it.kind === "vessel" && Boolean(HEAT[target.key])) || STAYS.includes(it.key);
  glide(it, true);
  if (!drag.sits) nodes[it.id].g.classList.add("is-using");
  nodes[target.id].g.classList.add("is-target");
  place(it, poseOn(it, target));
  if (STAYS.includes(it.key)) return;
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
  if (e.button > 0) return;
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
    turn.it.tilt = Math.abs(a) < 4 ? 0 : clamp(Math.round(a), -150, 150);
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
    const w = world(e);
    endDrag.ex = w.x - endDrag.x;
    endDrag.ey = w.y - endDrag.y;
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
  if (turn) {
    const { it } = turn;
    clearTimeout(turn.timer);
    turn = null;
    it.tilt = 0;                                            // let go, and it stands up again
    glide(it, true);
    place(it);
    if (it.kind === "vessel") paint(it);
    save();
    setTimeout(() => { if (nodes[it.id]) select(it); }, 280);
    return;
  }
  if (slide) { const it = slide.it; slide = null; follow(it); save(); return; }
  if (endDrag) {
    const t = endDrag;
    endDrag = null;
    const p = endOf(t);
    const host = t.on && byId(t.on);
    const c = nearest([...tools("syringe"), ...vessels().filter((v) => v !== host && !VESSELS[v.key].tap)], (o) => {
      const m = mouth(o), d = Math.hypot(m.x - p.x, m.y - p.y);
      return d < (o.key === "syringe" ? 50 : VESSELS[o.key].rTop + 46) ? d : -1;
    });
    if (c) {
      t.to = c.id;
      say(c.key === "syringe" ? "The delivery tube leads to the gas syringe." : overWater(c) ? `The delivery tube leads under ${plain(c)}, over water.` : c.flip ? `The delivery tube leads up into ${plain(c)}: right for a gas lighter than air.` : `The delivery tube leads down into ${plain(c)}: right for a gas denser than air.`);
    }
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
  const front = () => raise(it);

  if (d.sits && fits) {
    // fitted, and left there
    const host = d.over;
    if (it.key === "electrode") it.side = sideFor(host, it);
    it.on = host.id;
    const m = seat(host, it);
    it.x = m.x;
    it.y = m.y;
    front();
    glide(it, true);
    place(it);
    const where = plain(host);
    say(it.key === "funnel" ? `The funnel and its filter paper are in ${where}. Whatever is poured in now is filtered.`
      : it.key === "tubing" ? `The delivery tube is in ${where}. Drag its orange end to where the gas should go.`
      : it.key === "cap" ? `The stopper is back in the ${reagent(host.key).name}.`
      : it.key === "condenser" ? `The condenser is on the side arm of ${where}. Stand a beaker under its lower end.`
      : it.key === "electrode" ? (rodsIn(host).length === 2 ? (tools("power").length ? `Both carbon rods are in ${where} and wired to the power pack. Hold down its red switch.` : `Both carbon rods are in ${where}. Put a power pack on the bench.`) : `One carbon rod is in ${where}. It needs a second.`)
      : `${cap1(where)} is stoppered.`, host.kind === "vessel" ? host : null);
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
      if (it.kind === "vessel") paint(it);
      follow(it);
      save();
      if (it.kind === "tool") setTimeout(() => resetTool(it), 2200);
    }, it.kind === "tool" ? 1100 : 380);
  } else {
    if (it.kind === "vessel" && snap(it)) glide(it, true);
    front();
    place(it);
    if (it.kind === "vessel") paint(it);
    follow(it);
    if (it.key === "cap" && d.on) say("The stopper is out. The bottle will pour now.");
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

function openMenu(it) {
  if (!it) return;
  const menu = $("cl-menu");
  const lines = [];
  const acts = [];
  const act = (id, tip, icon) => acts.push(`<button type="button" class="cl-ico cl-ico--paper" data-act="${id}" data-tip="${tip}" aria-label="${tip}">${icon}</button>`);
  let slider = "";
  if (it.kind === "vessel") {
    const def = VESSELS[it.key];
    if (isEmpty(it.t)) lines.push(it.flip ? (it.jar ? `Holds about ${Math.round(it.jar.n * 12)} cm³ of gas.` : overWater(it) ? "Upside down, and full of water. Lead a delivery tube to it." : "Upside down, with only air in it.") : it.t.gas ? "No liquid, but there is a gas in it. Test it." : "Empty.");
    else {
      const tot = it.t.vol + (it.t.oil || 0);
      lines.push(`Holds ${tot > 0 ? `${cm3(tot)}: ` : ""}${esc(it.t.added.map((id) => reagent(id).name).join(", "))}.`);
      if (it.t.vol > 0) lines.push(`${Math.round(it.t.temp ?? 25)} °C.`);
      act("empty", "Empty and rinse it", ICON.empty);
    }
    if (def.tap) lines.push("It cannot stand up: let it go at the clamp of a retort stand. Press the blue tap to run it out.");
    if (def.arm) lines.push(fittedTo(it, "condenser") ? "Heat it, with a beaker under the condenser's lower end." : "Push a condenser onto the side arm.");
    if (def.upturns) lines.push("Fill it with water, then let an empty gas jar go in it.");
    if (def.invert && isEmpty(it.t) && !it.rack && !fittedTo(it)) act("flip", it.flip ? "Turn it the right way up" : "Turn it upside down", ICON.flip);
  } else if (it.kind === "reagent") {
    const r = reagent(it.key);
    lines.push(capOf(it.key) && fittedTo(it, "cap") ? "Stoppered. Drag the stopper off before you pour." : r.kind === "indicator" ? "Carry it to a liquid and it drips a little in." : "Open. Carry it to a vessel and hold it there, or select it and turn it.");
    if (r.kind === "solution" && Object.keys(r.adds).length) {
      const k = it.k || 1;
      slider = `<label class="cl-range"><span>Concentration <b id="cl-k">${k.toFixed(2)}</b> mol/dm³</span><input type="range" min="0.25" max="2" step="0.25" value="${k}" data-act="strength" aria-label="Concentration"></label>`;
    }
  } else if (HEAT[it.key]) {
    lines.push(it.lit ? "Lit. Hold it under a vessel, or carry a vessel over the flame." : "Not lit. Hold a lighted splint to it, or light it here.");
    act("light", it.lit ? "Put it out" : "Light it", ICON.fire);
  } else if (it.sample) { lines.push(it.key === "wire" ? "Dipped, ready for the flame." : `Holding ${cm3(it.sample.vol + (it.sample.oil || 0))} of liquid.`); act("empty", "Empty it", ICON.empty); }
  else if (it.key === "syringe") { lines.push(it.gas ? `${Math.round(it.gas.n * 12)} cm³ of gas.` : "Drag the orange end of a delivery tube to its nozzle."); if (it.gas) act("empty", "Push the plunger back in", ICON.empty); }
  else if (it.key === "funnel") { lines.push(it.residue ? "There is residue in the filter paper." : "Let it go at the mouth of a flask or beaker."); if (it.residue) act("empty", "Fresh filter paper", ICON.empty); }
  else if (it.key === "tubing") lines.push(it.on ? "Drag the orange end to a gas jar, a gas syringe or a tube." : "Let it go at the mouth of the flask that makes the gas.");
  else if (it.key === "electrode") lines.push("Let it go at the mouth of a beaker. Two are needed, and a power pack.");
  else if (it.key === "power") lines.push(cellFor(it) ? "Wired up. Hold down the red switch." : "It wires itself to a beaker with two carbon electrodes in it.");
  else if (it.key === "condenser") lines.push(it.on ? "Cold water runs through the jacket. Stand a beaker under the lower end." : "Push it onto the side arm of a distilling flask.");
  else if (it.key === "cap") lines.push("Put it back by letting it go at the bottle's mouth.");
  else if (it.kind === "rack" && it.key === "balance") lines.push("Stand a vessel on the pan. The red T sets the reading to zero.");
  else if (it.kind === "rack" && it.key === "tripod") lines.push("Stand a beaker or a dish on the gauze, and hold a lit burner underneath.");
  else if (it.kind === "rack" && it.key === "stand") lines.push("Slide the clamp by its yellow boss. Let a tube, a flask, a burette or a separating funnel go at the clamp and it is held.");
  if (it.key !== "cap") act("remove", "Put it away", ICON.away);
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
  if (what === "light") { it.lit = !it.lit; dress(it); say(it.lit ? `The ${nameOf(it).toLowerCase()} is lit.` : `The ${nameOf(it).toLowerCase()} is out.`); }
  else if (what === "flip") { it.flip = !it.flip; it.jar = null; it.t.gas = null; glide(it, true); place(it); paint(it); say(it.flip ? `${cap1(plain(it))} is upside down. A gas lighter than air will stay in it.` : `${cap1(plain(it))} is the right way up.`, it); }
  else if (it.kind === "vessel") {
    const res = rinse(it.t);
    it.jar = null;
    nodes[it.id].g.querySelector(".cl-bubbles").innerHTML = "";
    paint(it);
    record(it, res);
  } else { it.sample = null; it.gas = null; it.residue = null; dress(it); }
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

// ── the notebook, things to try, guides ─────────────────────────────────────
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
    : `<li class="cl-entry cl-entry--none">Nothing written yet. Whatever you see happen is written down here.</li>`;
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
$("cl-setups").innerHTML = GUIDES.map((g) =>
  `<li class="cl-guide"><h3>${esc(g.name)}</h3><p class="cl-guide__needs">You need: ${esc(g.needs)}.</p><ol>${g.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></li>`
).join("");

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
  else if ((e.key === "Delete" || e.key === "Backspace") && selected && selected.key !== "cap") { e.preventDefault(); removeItem(selected); }
});

// ── go ──────────────────────────────────────────────────────────────────────
$("cl-rot").innerHTML = ICON.turn;
$("cl-dots").innerHTML = ICON.dots;
fitWorld();
if (restored) state.items.forEach((it) => { keepIn(it); mount(it); });
$("cl-hint").hidden = state.items.length > 0;
readouts();
drawLinks();
renderDrawer();
renderLog();
renderTasks();
renderDose();
onFull();
mountTooltips();
new ResizeObserver(fitWorld).observe(wrap);
