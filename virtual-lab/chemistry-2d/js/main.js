/* ============================================================================
   CHEMISTRY BENCH — the page
   ----------------------------------------------------------------------------
   An open bench and a drawer. Anything in the drawer can be put on the bench
   and stood anywhere; the experiment is whatever the student sets up.

   ONE RULE DOES ALL THE WORK: carry a thing to a vessel to use it on that
   vessel. A bottle tips and pours for as long as it is held there; a jar
   shakes in a measure of solid; a dropper bottle drips; a splint or a strip
   of litmus is held at the mouth; the burner goes underneath (or the vessel
   is carried over the flame). Let go and the thing goes back where it was.

   The chemistry is chem.js, the glass is glass.js. This file is hands,
   layout and the notebook.
   ========================================================================== */

import { REAGENTS, TASKS, newTube, add, heat, rinse, test, tasksDone, reagent, chemHtml, isEmpty } from "./chem.js";
import { DEFS, VESSELS, TOOLS, RACK, vesselSvg, paintVessel, bubble, reagentSvg, toolSvg, splintAfter, rackSvg, thumb, colourOf, mouthOf } from "./glass.js";
import { UI } from "/utils/components/ui-icons.js";

const KEY = "chem-bench-v2";
const LOG_MAX = 40;
const H = 720;                     // the bench is always 720 units tall; its width follows the window
let BASE = 600;                    // where things stand when the page puts them out: clear of the note along the bottom
let TOP = 215;                     // and where the first row of bottles stands: clear of the notes along the top
let W = 1100;
const NS = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** A sentence from chem.js; a formula inside it is written {Fe(OH)3}. */
const prose = (s) => esc(s).replace(/\{([^}]+)\}/g, (_, f) => chemHtml(f));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ── the drawer's catalogue ──────────────────────────────────────────────────
const CATS = [
  { id: "glass", label: "Glassware", icon: `<path d="M9 2.600h6v6.200l5 9.400a2.4 2.4 0 0 1-2.1 3.500H6.100A2.4 2.4 0 0 1 4 18.200l5-9.400z" fill="var(--accent-secondary)"/><path d="M7.4 14.600h9.200l1.9 3.700a1 1 0 0 1-.9 1.500H6.400a1 1 0 0 1-.9-1.500z" fill="#fff"/>` },
  { id: "kit", label: "Equipment", icon: `<rect x="9.6" y="13" width="4.8" height="7.6" rx="1.2" fill="var(--text-tertiary)"/><rect x="5" y="19" width="14" height="3" rx="1.5" fill="var(--text-tertiary)"/><path d="M12 1.800c2.6 3.6 4.8 5 4.8 8a4.8 4.8 0 0 1-9.6 0c0-3 2.2-4.4 4.8-8z" fill="var(--accent-danger)"/>` },
  { id: "liquid", label: "Liquids", icon: `<path d="M12 2.400s7.4 7.4 7.4 12.600a7.4 7.4 0 0 1-14.8 0C4.6 9.8 12 2.4 12 2.400z" fill="var(--accent-secondary)"/>` },
  { id: "solid", label: "Solids", icon: `<path d="M3.4 20.6 8 11.400l3.4 4.4 3-7 6.2 11.800z" fill="var(--accent-warning)"/><circle cx="6" cy="6.4" r="2.4" fill="var(--accent-primary)"/>` },
];
const CATALOG = [
  ...Object.entries(VESSELS).map(([key, v]) => ({ cat: "glass", kind: "vessel", key, name: v.name })),
  { cat: "kit", kind: "rack", key: "rack", name: RACK.name },
  ...Object.entries(TOOLS).map(([key, t]) => ({ cat: "kit", kind: "tool", key, name: t.name })),
  ...REAGENTS.map((r) => ({ cat: r.kind === "solid" ? "solid" : "liquid", kind: "reagent", key: r.id, name: r.name.charAt(0).toUpperCase() + r.name.slice(1) })),
];
const REAGENT_BOX = { solution: { x0: -35, y0: -125, x1: 35, y1: 8 }, solid: { x0: -36, y0: -96, x1: 36, y1: 8 }, indicator: { x0: -26, y0: -114, x1: 26, y1: 8 } };

const boxOf = (it) => (it.kind === "vessel" ? VESSELS[it.key].bbox : it.kind === "tool" ? TOOLS[it.key].bbox : it.kind === "rack" ? RACK.bbox : REAGENT_BOX[reagent(it.key).kind]);
const nameOf = (it) => (it.kind === "vessel" ? `${VESSELS[it.key].name} ${it.tag}` : CATALOG.find((c) => c.kind === it.kind && c.key === it.key).name);

// ── set-ups: a bench laid out ready ─────────────────────────────────────────
const PRESETS = [
  { id: "tubes", name: "Test-tube reactions", about: "A rack of tubes, an acid, two alkalis and four salts.", rack: 5, liquids: ["hcl", "naoh", "nh3", "cuso4", "feso4", "fecl3", "znso4"], tools: ["burner", "lit", "red"] },
  { id: "ions", name: "Tests for ions", about: "Sodium hydroxide, ammonia, barium chloride and silver nitrate against seven salts.", rack: 5, liquids: ["naoh", "nh3", "bacl2", "agno3", "hcl", "cuso4", "znso4", "also4", "cacl2", "nacl", "ki", "na2co3"], tools: [] },
  { id: "gases", name: "Making and testing gases", about: "Hydrogen, carbon dioxide, oxygen and ammonia, and the test for each.", vessels: ["boil", "boil", "boil", "boil"], liquids: ["hcl", "h2o2", "nh4cl", "naoh", "mg", "zn", "caco3", "mno2"], tools: ["burner", "lit", "glow", "red", "blue"] },
  { id: "metals", name: "Reactivity of metals", about: "Four metals, an acid, and the solutions of four metal salts.", rack: 5, liquids: ["hcl", "cuso4", "feso4", "znso4", "agno3", "mg", "zn", "fe", "cu"], tools: ["lit"] },
  { id: "neutral", name: "Neutralisation", about: "Acids, alkalis and three indicators. Use a few drops at a time near the end.", vessels: ["flask", "beaker100", "beaker250"], liquids: ["hcl", "h2so4", "naoh", "nh3", "ui", "phph", "mo"], tools: ["red", "blue"] },
  { id: "blank", name: "An empty bench", about: "Nothing out. Take what you want from the drawer.", liquids: [], tools: [] },
];

// ── what is remembered between visits ───────────────────────────────────────
const state = { items: [], n: 0, dose: "portion", explain: true, done: [], log: [], cat: "glass" };
let restored = false;
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "null");
  if (saved && Array.isArray(saved.items)) {
    Object.assign(state, saved);
    state.items.forEach((it) => { if (it.t) it.t = { ...newTube(VESSELS[it.key].cap), ...it.t, gas: null }; });
    restored = true;
  }
} catch { /* a bad save is just a fresh bench */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ } };

// ── the bench ───────────────────────────────────────────────────────────────
const wrap = $("cl-benchwrap");
const svg = $("cl-bench");
svg.innerHTML = `${DEFS}<g id="L-back"></g><g id="L-items"></g><g id="L-front"></g><g id="L-fx"></g>`;
const L = { back: $("L-back"), items: $("L-items"), front: $("L-front"), fx: $("L-fx") };
const nodes = {};                  // item id → { g, front? }
const byId = (id) => state.items.find((it) => it.id === id);
const vessels = () => state.items.filter((it) => it.kind === "vessel");

function fitWorld() {
  const r = wrap.getBoundingClientRect();
  if (!r.width || !r.height) return;
  W = clamp(Math.round((H * r.width) / r.height), 520, 1800);
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  // the notes float over the bench; on a phone they take a good part of it
  const k = H / r.height;
  TOP = Math.round(Math.max(215, (document.querySelector(".cl-bar").getBoundingClientRect().bottom - r.top) * k + 138));
  BASE = Math.round(clamp(($("cl-say").getBoundingClientRect().top - r.top) * k - 14, TOP + 180, 600));
  state.items.forEach((it) => { keepIn(it); place(it); });
}
function keepIn(it) {
  const b = boxOf(it);
  it.x = clamp(it.x, -b.x0 + 4, W - b.x1 - 4);
  it.y = clamp(it.y, -b.y0 + 4, H - 10);
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
  const node = (nodes[it.id] = { g });
  if (it.kind === "vessel") g.innerHTML = vesselSvg(it.key, it.id, it.tag);
  else if (it.kind === "reagent") { g.innerHTML = reagentSvg(it.key, it.id); g.dataset.rk = reagent(it.key).kind; }
  else if (it.kind === "tool") g.innerHTML = toolSvg(it.key);
  else {
    const r = rackSvg();
    g.innerHTML = r.back;
    node.front = document.createElementNS(NS, "g");
    node.front.setAttribute("class", "cl-item-front");
    node.front.innerHTML = r.front;
    L.front.appendChild(node.front);
  }
  (it.kind === "rack" ? L.back : L.items).appendChild(g);
  place(it);
  if (it.kind === "vessel") paint(it);
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
  n.g.classList.toggle("is-gliding", on);
  if (n.front) n.front.classList.toggle("is-gliding", on);
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
  const rows = it.kind === "reagent" ? [TOP, TOP + 150, TOP + 295] : it.kind === "tool" ? [BASE, 460] : [BASE, 430];
  for (const y of rows) for (let x = -b.x0 + 14; x < W + b.x0 - 4; x += 12) if (!overlaps(it, x, y)) return [x, y];
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
  if (it.kind === "rack") vessels().forEach((v) => { if (v.rack && v.rack[0] === it.id) v.rack = null; });
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
  let right = 40;
  if (p.rack) {
    const rack = addItem("rack", "rack", 180, BASE);
    for (let i = 0; i < p.rack; i++) {
      const v = addItem("vessel", "tube", rack.x + RACK.slots[i], rack.y + RACK.rest);
      v.rack = [rack.id, i];
    }
    right = rack.x + 190;
  }
  for (const key of p.vessels || []) {
    const b = VESSELS[key].bbox;
    addItem("vessel", key, right - b.x0 + 6, BASE);
    right += b.x1 - b.x0 + 22;
  }
  let x = 56, y = TOP;
  for (const key of p.liquids) {
    const b = REAGENT_BOX[reagent(key).kind];
    if (x + b.x1 > W - 10) { x = 56; y += 150; }
    addItem("reagent", key, x, y);
    x += 82;
  }
  let tx = Math.max(right + 60, W - 60 - p.tools.length * 78);
  for (const key of p.tools) {
    const b = TOOLS[key].bbox;
    addItem("tool", key, tx - b.x0, BASE);
    tx += b.x1 - b.x0 + 24;
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

function record(v, res) {
  const last = state.log[0];
  const same = last && last.id === v.id && last.title === res.title && JSON.stringify(last.obs) === JSON.stringify(res.obs);
  if (same) last.times = (last.times || 1) + 1;
  else state.log.unshift({ id: v.id, tag: v.tag, title: res.title, obs: res.obs });
  state.log.length = Math.min(state.log.length, LOG_MAX);
  const fresh = tasksDone(res, v.t).filter((id) => !state.done.includes(id));
  state.done.push(...fresh);
  renderLog();
  renderTasks(fresh);
  say(res.obs.map((o) => o.text).join(" ") || `${res.title}.`, v);
  save();
}

// ── using one thing on another ──────────────────────────────────────────────
const mouth = (v) => ({ x: v.x, y: v.y + VESSELS[v.key].top });

/** The vessel a carried thing is being held to, if any. */
function targetOf(it) {
  let best = null, bestD = Infinity;
  for (const v of vessels()) {
    if (v === it) continue;
    const def = VESSELS[v.key], m = mouth(v);
    let dx, ok;
    if (it.kind === "reagent") {
      const b = boxOf(it), cy = it.y + (b.y0 + b.y1) / 2;
      dx = Math.abs(it.x - m.x);
      ok = dx < def.rTop + 48 && cy > m.y - 160 && cy < m.y + 46;
    } else if (it.key === "burner") {
      dx = Math.abs(it.x - v.x);
      ok = dx < def.rMax + 26 && it.y - 146 > v.y - 40 && it.y - 146 < v.y + 90;
    } else if (it.key === "lit" || it.key === "glow") {
      dx = Math.abs(it.x - 34 - m.x);
      ok = dx < def.rTop + 32 && it.y - 58 > m.y - 80 && it.y - 58 < m.y + 44;
    } else {
      dx = Math.abs(it.x - m.x);
      ok = dx < def.rTop + 28 && it.y > m.y - 46 && it.y < m.y + 76;
    }
    if (ok && dx < bestD) { best = v; bestD = dx; }
  }
  return best;
}
/** How a thing is held while it is being used on vessel v. */
function poseOn(it, v) {
  const m = mouth(v);
  if (it.kind === "reagent") {
    const r = reagent(it.key);
    if (r.kind === "indicator") return `translate(${m.x}px, ${m.y - 24}px)`;
    return `translate(${m.x + 6}px, ${m.y - 10}px) rotate(-112deg) translate(0px, ${mouthOf(it.key)}px)`;
  }
  if (it.key === "burner") return `translate(${v.x}px, ${Math.min(v.y + 150, H - 8)}px)`;
  if (it.key === "lit" || it.key === "glow") return `translate(${m.x + 34}px, ${m.y + 54}px)`;
  return `translate(${m.x}px, ${m.y + 18}px)`;
}

function fx(html, ms = 900) {
  const g = document.createElementNS(NS, "g");
  g.innerHTML = html;
  L.fx.appendChild(g);
  setTimeout(() => g.remove(), ms);
}

/** Do the thing: `it` on vessel `v`. Returns false when there is no point going on. */
function use(it, v) {
  const node = nodes[v.id].g;
  const m = mouth(v);
  if (it.kind === "reagent") {
    const r = reagent(it.key);
    const res = add(v.t, it.key, state.dose);
    if (res.refused) { say(res.refused, v, "no"); return false; }
    const painted = paint(v, { fresh: res.flags.some((f) => f.startsWith("ppt:")) });
    const c = colourOf(it.key);
    const surface = v.y - Math.max(painted.level, 10);
    if (r.kind === "solution") {
      fx(`<rect class="cl-stream" x="${m.x + 3.5}" y="${m.y - 10}" width="5" height="${Math.max(24, surface - m.y + 10)}" rx="2.5" fill="rgba(${c},0.85)"/>`, 720);
    } else {
      const from = r.kind === "indicator" ? [m.x, m.y - 26] : [m.x + 6, m.y - 10];
      fx([0, 1, 2].map((k) => `<circle class="cl-dropin" cx="${from[0] + (r.kind === "solid" ? (k - 1) * 5 : 0)}" cy="${from[1]}" r="${r.kind === "solid" ? 3.4 : 2.6}" fill="rgb(${c})" style="--fall:${Math.round(surface - from[1])}px;animation-delay:${k * 0.13}s"/>`).join(""), 1000);
    }
    if (res.flags.some((f) => f.startsWith("gas:"))) bubble(node, v.key, v.t, res.flags.includes("gas:O2") ? 1.8 : 1);
    record(v, res);
    return r.kind !== "indicator";
  }
  if (it.key === "burner") {
    const res = heat(v.t);
    if (res.refused) { say(res.refused, v, "no"); return false; }
    paint(v);
    bubble(node, v.key, v.t, res.flags.some((f) => f.startsWith("gas:")) ? 1.3 : 0.5);
    record(v, res);
    return false;
  }
  const res = test(v.t, it.key);
  if (res.refused) { say(res.refused, v, "no"); return false; }
  const g = nodes[it.id].g;
  if (it.key === "lit" || it.key === "glow") {
    g.querySelector(".cl-after").innerHTML = splintAfter(res.fx);
    g.dataset.end = res.fx;
  } else g.dataset.end = res.fx.split("-")[2];
  paint(v);
  record(v, res);
  return false;
}
/** A splint or a paper back to how it was, for the next test. */
function resetTool(it) {
  const g = nodes[it.id] && nodes[it.id].g;
  if (!g) return;
  delete g.dataset.end;
  const after = g.querySelector(".cl-after");
  if (after) after.innerHTML = "";
}

// ── hands ───────────────────────────────────────────────────────────────────
let drag = null;
let selected = null;

function startDrag(it, e, fromDrawer = false) {
  const w = world(e);
  drag = {
    it, fromDrawer, cx: e.clientX, cy: e.clientY, dx: fromDrawer ? 0 : it.x - w.x, dy: fromDrawer ? -(boxOf(it).y0 / 2) : it.y - w.y,
    sx: it.x, sy: it.y, moved: fromDrawer, used: false, over: null, timer: null,
    riders: it.kind === "rack" ? vessels().filter((v) => v.rack && v.rack[0] === it.id) : [],
  };
  if (it.kind !== "rack") (it.kind === "vessel" ? L.items : L.fx).appendChild(nodes[it.id].g);
  glide(it, false);
  drag.riders.forEach((v) => glide(v, false));
}
function leave() {
  if (!drag || !drag.over) return;
  clearTimeout(drag.timer);
  nodes[drag.it.id].g.classList.remove("is-using");
  if (drag.over.kind === "vessel") { nodes[drag.over.id].g.classList.remove("is-target"); place(drag.over); }
  drag.over = null;
}
function enter(target) {
  const { it } = drag;
  drag.over = target;
  glide(it, true);
  nodes[it.id].g.classList.add("is-using");
  if (it.kind === "vessel") {
    // a vessel carried over the burner: it sits in the flame
    place(it, `translate(${target.x}px, ${target.y - 150}px)`);
    drag.timer = setTimeout(() => { drag.used = true; use(target, it); }, 900);
    return;
  }
  nodes[target.id].g.classList.add("is-target");
  place(it, poseOn(it, target));
  if (it.key === "burner") {
    // no room under it: the vessel is lifted into the flame instead
    const lift = target.y + 150 - Math.min(target.y + 150, H - 8);
    if (lift > 0) { glide(target, true); place(target, `translate(${target.x}px, ${target.y - lift}px)`); }
  }
  const go = () => {
    if (!drag || drag.over !== target) return;
    drag.used = true;
    const more = use(it, target);
    if (more && drag && drag.over === target) drag.timer = setTimeout(go, state.dose === "drops" ? 520 : 780);
  };
  drag.go = go;
  drag.wait = it.key === "burner" ? 900 : 420;
  drag.timer = setTimeout(go, drag.wait);
}

svg.addEventListener("pointerdown", (e) => {
  if (e.button > 0) return;
  const g = e.target.closest("[data-item]");
  if (!g) return select(null);
  e.preventDefault();
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

  let target = null;
  if (it.kind === "reagent" || it.kind === "tool") target = targetOf(it);
  else if (it.kind === "vessel") {
    it.rack = null;
    target = state.items.find((b) => b.kind === "tool" && b.key === "burner" && Math.abs(it.x - b.x) < 30 && Math.abs(it.y - (b.y - 150)) < 46) || null;
  }
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
});

window.addEventListener("pointerup", (e) => {
  if (tileDrag && !drag) return tileUp(e);
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

  const user = it.kind === "reagent" || it.kind === "tool";
  if (user && d.over && !d.used) { d.used = true; use(it, d.over); }      // let go at once: that is one measure
  if (d.over && d.over.kind === "vessel") {
    const v = d.over;
    nodes[v.id].g.classList.remove("is-target");
    setTimeout(() => nodes[v.id] && place(v), it.key === "burner" ? 1100 : 0);      // set back down once the burner has gone
  }
  nodes[it.id].g.classList.remove("is-using");

  if (it.kind === "vessel") {
    if (d.over) { it.x = d.over.x; it.y = d.over.y - 150; }
    else if (VESSELS[it.key].rack) {
      for (const rack of state.items.filter((o) => o.kind === "rack")) {
        const taken = new Set(vessels().filter((v) => v !== it && v.rack && v.rack[0] === rack.id).map((v) => v.rack[1]));
        const slot = RACK.slots.findIndex((sx, i) => !taken.has(i) && Math.abs(it.x - (rack.x + sx)) < 28 && Math.abs(it.y - (rack.y + RACK.rest)) < 70);
        if (slot >= 0) { it.rack = [rack.id, slot]; it.x = rack.x + RACK.slots[slot]; it.y = rack.y + RACK.rest; break; }
      }
    }
    glide(it, true);
    place(it);
  } else if (user && d.used) {
    // it was used: back to where it stands
    setTimeout(() => {
      if (!nodes[it.id]) return;
      it.x = d.sx; it.y = d.sy;
      if (d.fromDrawer) [it.x, it.y] = freeSpot(it);
      L.items.appendChild(nodes[it.id].g);
      glide(it, true);
      place(it);
      save();
      if (it.kind === "tool") setTimeout(() => resetTool(it), 1600);
    }, it.kind === "tool" ? 1100 : 380);
  } else {
    if (it.kind !== "rack") L.items.appendChild(nodes[it.id].g);
    place(it);
  }
  save();
});
window.addEventListener("pointercancel", () => {
  if (!drag) return;
  clearTimeout(drag.timer);
  nodes[drag.it.id].g.classList.remove("is-using");
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
  let holds = "";
  if (it.kind === "vessel") {
    holds = isEmpty(it.t) ? "Empty." : `Holds ${esc(it.t.added.map((id) => reagent(id).name).join(", "))}.`;
  }
  menu.innerHTML = `<p class="cl-menu__name">${esc(nameOf(it))}</p>${holds ? `<p class="cl-menu__holds">${holds}</p>` : ""}
    <div class="cl-menu__row">
      ${it.kind === "vessel" && !isEmpty(it.t) ? `<button type="button" class="pp-btn cl-note" data-act="empty">Empty it</button>` : ""}
      <button type="button" class="pp-btn pp-btn--ghost cl-note" data-act="remove">Put away</button>
    </div>`;
  menu.hidden = false;
  const r = nodes[it.id].g.querySelector(".cl-hit").getBoundingClientRect();
  const w = wrap.getBoundingClientRect();
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  let left = r.right - w.left + 10;
  if (left + mw > w.width - 8) left = r.left - w.left - mw - 10;
  menu.style.left = `${clamp(left, 8, w.width - mw - 8)}px`;
  menu.style.top = `${clamp(r.top - w.top, 56, w.height - mh - 8)}px`;
}
$("cl-menu").addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b || !selected) return;
  const it = selected;
  if (b.dataset.act === "remove") return removeItem(it);
  const res = rinse(it.t);
  nodes[it.id].g.querySelector(".cl-bubbles").innerHTML = "";
  paint(it);
  record(it, res);
  select(it);
});

// ── the drawer ──────────────────────────────────────────────────────────────
let tileDrag = null;
function renderDrawer() {
  const q = $("cl-search").value.trim().toLowerCase();
  const out = new Set(state.items.filter((it) => it.kind === "reagent").map((it) => it.key));
  const list = CATALOG.filter((c) => (q ? `${c.name} ${c.kind === "reagent" ? reagent(c.key).formula : ""}`.toLowerCase().includes(q) : c.cat === state.cat));
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
function tileUp() {
  tileDrag = null;
  document.body.classList.remove("cl-dragging");
}
let swallow = false;
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
  ex.textContent = state.explain ? "Hide the chemistry" : "Show the chemistry";
  ex.setAttribute("aria-pressed", String(state.explain));
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
document.querySelectorAll("[data-sheet]").forEach((b) => b.addEventListener("click", () => openSheet(b.dataset.sheet)));
document.querySelectorAll(".cl-sheet__close").forEach((b) => { b.innerHTML = UI.close(14); b.addEventListener("click", () => openSheet(null)); });
$("cl-setups").addEventListener("click", (e) => {
  const b = e.target.closest("[data-preset]");
  if (!b) return;
  const p = PRESETS.find((x) => x.id === b.dataset.preset);
  layOut(p);
  openSheet(null);
  say(p.id === "blank" ? "The bench is clear. Take what you want from the drawer." : `${p.name}: everything is out. Carry a bottle to a vessel and hold it there to pour.`);
});
$("cl-explain").addEventListener("click", () => { state.explain = !state.explain; renderLog(); save(); });
$("cl-clear-log").addEventListener("click", () => { state.log = []; renderLog(); save(); });

function renderDose() {
  document.querySelectorAll("[data-dose]").forEach((b) => {
    const on = b.dataset.dose === state.dose;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
document.querySelectorAll("[data-dose]").forEach((b) => b.addEventListener("click", () => { state.dose = b.dataset.dose; renderDose(); save(); }));

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
} else layOut(PRESETS[0]);
renderDrawer();
renderLog();
renderTasks();
renderDose();
new ResizeObserver(fitWorld).observe(wrap);
