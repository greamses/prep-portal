/* ============================================================================
   CHEMISTRY BENCH — things that flow: vapour and foam
   ----------------------------------------------------------------------------
   Nothing here is a drawing of steam or of foam. Each is a few hundred small
   particles that are MOVED, every frame, by the forces that move the real
   thing, and the picture is whatever that comes to.

   VAPOUR (steam over a boiling liquid, the mist over fuming acid, iodine's
   violet vapour) is a plume. It leaves the mouth warm and fast, is slowed as it
   mixes with the air, wanders as the air does, and spreads as it rises: a
   plume widens roughly in proportion to the height it has climbed, and thins as
   the square of that, which is why steam is thick at the mouth and gone a hand's
   breadth above it. A vapour denser than air (iodine, the acid mist) barely
   rises: it rolls over the rim and sinks.

   FOAM is gas caught in liquid films. It is made at the surface of the liquid,
   fills the vessel above it, and is pushed out over the rim by the foam still
   being made underneath. It weighs almost nothing and is very viscous, so once
   out it does not fall: it clings to the glass and creeps down it, piles up on
   the bench, and spreads a little. Then it drains and its bubbles burst, so it
   slowly sinks away. Its particles are drawn through a filter that runs
   neighbouring ones together, so it is one mass with an edge, not a heap of
   balls.

   main.js says what is happening (this vessel is steaming; that one has just
   foamed over). This file only moves the particles.
   ========================================================================== */

const NS = "http://www.w3.org/2000/svg";
const rnd = (a, b) => a + Math.random() * (b - a);

/** The filters these draw through. They go once into the bench's own <defs>. */
export const FLUID_DEFS = `
  <filter id="f-vapour" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5.5"/></filter>
  <filter id="f-foam" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="soft"/>
    <feColorMatrix in="soft" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" result="mass"/>
    <feGaussianBlur in="mass" stdDeviation="1.6" result="edge"/>
    <feSpecularLighting in="edge" surfaceScale="2.4" specularConstant="0.55" specularExponent="14" lighting-color="#ffffff" result="shine"><feDistantLight azimuth="235" elevation="52"/></feSpecularLighting>
    <feComposite in="shine" in2="mass" operator="in" result="lit"/>
    <feMerge><feMergeNode in="mass"/><feMergeNode in="lit"/></feMerge>
  </filter>`;

// What each kind of vapour is like. rise: the speed it settles to (bench units a second, up is negative);
// burst: how fast it leaves the mouth; spread: how fast a puff grows; drift: how far the air carries it sideways.
const KINDS = {
  steam: { rgb: "255,255,255", a: 0.26, rate: 30, rise: -26, burst: -46, spread: 12, life: [1.2, 2.2], drift: 12 },
  gas: { rgb: "214,236,255", a: 0.2, rate: 15, rise: -30, burst: -52, spread: 11, life: [1.6, 2.7], drift: 11 },
  fumes: { rgb: "250,250,246", a: 0.11, rate: 7, rise: -6, burst: -18, spread: 13, life: [2, 3.2], drift: 20 },
  iodine: { rgb: "132,70,186", a: 0.4, rate: 18, rise: -7, burst: -30, spread: 10, life: [2.2, 3.4], drift: 9 },
};

let layer = null, gVapour = null, raf = 0, last = 0, quiet = false;
const emitters = new Map();        // id → { kind, x, y, w, owed }
const puffs = [];                  // vapour particles
const foams = [];                  // bodies of foam

/** Give the engine the layer it draws in (the bench's effects layer). */
export function initFluid(fxLayer) {
  layer = fxLayer;
  try { quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { quiet = false; }
}
function vapourGroup() {
  if (!gVapour || !gVapour.isConnected) {
    gVapour = document.createElementNS(NS, "g");
    gVapour.setAttribute("filter", "url(#f-vapour)");
    gVapour.setAttribute("pointer-events", "none");
    layer.insertBefore(gVapour, layer.firstChild);
    puffs.length = 0;
  }
  return gVapour;
}
function wake() { if (!raf && layer) { last = performance.now(); raf = requestAnimationFrame(tick); } }

/**
 * A vessel is giving off vapour (or has stopped: kind = null).
 * (x, y) is the middle of its mouth and w the mouth's half-width, in bench units.
 */
export function setVapour(id, kind, x, y, w) {
  if (!kind || !KINDS[kind]) { emitters.delete(id); return; }
  const e = emitters.get(id) || { owed: 0 };
  Object.assign(e, { kind, x, y, w });
  emitters.set(id, e);
  wake();
}
/** One puff of vapour, all at once: a splash of water on hot acid, a wet tube held in a flame. */
export function puff(kind, x, y, w, count = 14) {
  if (!layer || !KINDS[kind]) return;
  for (let i = 0; i < count; i++) spawnPuff(KINDS[kind], x, y, w, 1.5);
  wake();
}
function spawnPuff(K, x, y, w, push = 1) {
  if (puffs.length > 420) return;
  const el = document.createElementNS(NS, "circle");
  el.setAttribute("fill", `rgb(${K.rgb})`);
  vapourGroup().appendChild(el);
  const r = Math.max(2.5, w * rnd(0.28, 0.5));
  puffs.push({
    el, K, x: x + rnd(-1, 1) * w * 0.7, y: y - rnd(0, 3), r, r0: r,
    vx: rnd(-1, 1) * K.drift * 0.4, vy: K.burst * rnd(0.7, 1.2) * push,
    age: 0, life: rnd(K.life[0], K.life[1]), ph: rnd(0, 6.28), lean: rnd(-1, 1),
  });
}

/**
 * Foam (or, with soapy = false, a fizzing liquid) is forced out of a vessel.
 * @param {object} o
 * @param {number} o.x        the middle of the vessel
 * @param {number} o.rim      y of its rim
 * @param {number} o.surface  y of the liquid in it, where the foam is made
 * @param {number} o.floor    y of the bench it stands on
 * @param {number} o.rIn      half-width of the mouth
 * @param {(y: number) => number} o.outer  half-width of the OUTSIDE of the vessel at bench height y
 * @param {number[]} o.rgb    the colour of the liquid
 * @param {boolean} o.soapy   a lasting foam, or only a liquid full of gas
 * @param {number} [o.amount] how much comes out (1 = a good eruption)
 * @param {number} [o.jet]    thrown up out of the mouth at about this speed (a volcano), not just pushed over the rim
 * @param {boolean} [o.face]  what comes down lands on the FRONT of the thing and runs down it in streams (a mountain seen from the front), not only down its two edges
 */
export function erupt(o) {
  if (!layer) return;
  const g = document.createElementNS(NS, "g");
  g.setAttribute("pointer-events", "none");
  const mass = document.createElementNS(NS, "g"), cells = document.createElementNS(NS, "g");
  mass.setAttribute("filter", "url(#f-foam)");
  g.append(mass, cells);
  layer.appendChild(g);
  const white = o.soapy ? 0.58 : 0.16;
  const rgb = o.rgb.map((c) => Math.round(c + (255 - c) * white));
  foams.push({ ...o, g, mass, cells, rgb, parts: [], t: 0, owed: 0, amount: o.amount || 1, made: 0 });
  wake();
}

function tick(now) {
  raf = 0;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!layer.isConnected) { emitters.clear(); puffs.length = 0; foams.length = 0; return; }

  // ── vapour ──
  for (const e of emitters.values()) {
    const K = KINDS[e.kind];
    e.owed += K.rate * Math.max(0.5, e.w / 16) * dt * (quiet ? 0.3 : 1);
    while (e.owed >= 1) { e.owed -= 1; spawnPuff(K, e.x, e.y, e.w); }
  }
  for (let i = puffs.length - 1; i >= 0; i--) {
    const p = puffs[i], K = p.K;
    p.age += dt;
    if (p.age >= p.life || !p.el.isConnected) { p.el.remove(); puffs.splice(i, 1); continue; }
    // slowed by the air it is mixing with, towards the speed its buoyancy alone would give it
    p.vy += (K.rise - p.vy) * Math.min(1, dt * 1.9);
    // the room's air is never still: two slow eddies, different for every puff
    const eddy = Math.sin(p.ph + p.age * 2.3) * 0.6 + Math.sin(p.ph * 1.7 + p.age * 0.9) * 0.4;
    p.vx += (eddy * K.drift + p.lean * K.drift * 0.5 - p.vx) * Math.min(1, dt * 1.4);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.r += K.spread * dt;                                   // it entrains air and widens as it goes
    const k = p.age / p.life;
    const thin = (p.r0 / p.r) ** 1.6;                        // the same vapour in a bigger puff is fainter
    const a = K.a * Math.min(1, p.age / 0.1) * (1 - k) ** 1.3 * (0.35 + 0.65 * thin);
    p.el.setAttribute("cx", p.x.toFixed(1));
    p.el.setAttribute("cy", p.y.toFixed(1));
    p.el.setAttribute("r", p.r.toFixed(1));
    p.el.setAttribute("fill-opacity", a.toFixed(3));
  }

  // ── foam ──
  for (let f = foams.length - 1; f >= 0; f--) {
    const F = foams[f];
    if (!F.g.isConnected) { foams.splice(f, 1); continue; }
    F.t += dt;
    // the reaction is fiercest at the start and dies away: so does the foam it pushes out
    const want = (F.soapy ? 120 : 70) * F.amount;
    if (F.made < want) {
      F.owed += want * 0.62 * Math.exp(-F.t / 1.5) * dt;
      while (F.owed >= 1 && F.made < want) { F.owed -= 1; F.made += 1; spawnFoam(F); }
    }
    const push = Math.exp(-F.t / 1.7);                       // how hard the gas below is still pushing
    for (let i = F.parts.length - 1; i >= 0; i--) {
      const p = F.parts[i];
      p.age += dt;
      if (p.state === "in") {
        // rising up the inside of the vessel on the foam being made beneath it
        p.vy += (-(26 + 70 * push) - p.vy) * Math.min(1, dt * 3);
        p.y += p.vy * dt;
        p.x += (F.x + p.off * F.rIn * 0.8 - p.x) * Math.min(1, dt * 2);
        if (p.y < F.rim - p.r * 0.4) { p.state = "over"; p.vx = p.side * rnd(14, 38) * (0.5 + push); p.vy *= 0.5; }
      } else if (p.state === "face") {
        // on the front of the mountain: it runs down in its own stream, widening with the slope, slower as it cools
        const top = (F.soapy ? 40 + 60 * push : 120) * p.slip;
        p.vy += (top - p.vy) * Math.min(1, dt * 2.4);
        p.y += p.vy * dt;
        const want = F.x + p.u * F.outer(Math.min(F.floor, p.y)) * 0.9 + Math.sin(p.y * 0.045 + p.wind) * 5;
        p.x += (want - p.x) * Math.min(1, dt * 5);
        if (p.y >= F.floor - p.r * 0.55) { p.state = "floor"; p.y = F.floor - p.r * 0.55; p.side = p.u < 0 ? -1 : 1; p.vx = p.side * rnd(4, 22); }
      } else if (p.state === "over") {
        // above the rim: thrown up, it comes down as anything does; only pushed out, it has almost no weight and is shouldered sideways by what comes after
        p.vy += (p.jet ? 430 : F.soapy ? 46 : 260) * dt;
        p.vx *= 1 - Math.min(1, dt * (p.jet ? 0.5 : F.soapy ? 1.1 : 0.4));
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (F.face && p.vy > 0 && p.y >= F.rim + 2) { p.state = "face"; p.vy = Math.min(p.vy, 60); continue; }
        const edge = F.outer(Math.min(F.floor, Math.max(F.rim, p.y)));
        if (p.y > F.rim && Math.abs(p.x - F.x) >= edge - p.r * 0.3) { p.state = "wall"; p.vy = Math.max(8, p.vy * 0.4); }
        else if (p.y > F.rim + 2 && Math.abs(p.x - F.x) < edge) { p.y = F.rim + 2; p.vy = 0; p.vx += p.side * 30 * dt; }      // it cannot fall back through the glass
        if (p.y >= F.floor - p.r * 0.5) { p.state = "floor"; p.y = F.floor - p.r * 0.5; }
      } else if (p.state === "wall") {
        // clinging to the outside of the glass and creeping down it: slower as it drains and stiffens
        const top = F.soapy ? 34 + 46 * push : 150;
        p.vy += ((top * p.slip) - p.vy) * Math.min(1, dt * 2.2);
        p.y += p.vy * dt;
        p.x = F.x + p.side * (F.outer(Math.min(F.floor, p.y)) + p.r * (0.15 + p.thick));
        if (p.y >= F.floor - p.r * 0.55) { p.state = "floor"; p.y = F.floor - p.r * 0.55; p.vx = p.side * rnd(8, 34) * (F.soapy ? 1 : 2.2); }
      } else {
        // on the bench: it spreads a little way and stops
        p.vx *= 1 - Math.min(1, dt * 1.6);
        p.x += p.vx * dt;
      }
      // drainage: the films thin, the bubbles burst, the foam sinks away (a liquid without soap simply runs flat)
      if (p.age > p.keep) p.r -= (F.soapy ? 1.1 : 3.4) * dt;
      else if (p.r < p.full) p.r = Math.min(p.full, p.r + p.full * dt * 3.5);       // each bubble swells as it leaves the liquid
      if (p.r < 0.9 || !p.el.isConnected) { p.el.remove(); if (p.cell) p.cell.remove(); F.parts.splice(i, 1); continue; }
      p.el.setAttribute("cx", p.x.toFixed(1));
      p.el.setAttribute("cy", p.y.toFixed(1));
      p.el.setAttribute("r", p.r.toFixed(1));
      if (p.cell) {
        p.cell.setAttribute("cx", (p.x + p.cx * p.r).toFixed(1));
        p.cell.setAttribute("cy", (p.y + p.cy * p.r).toFixed(1));
        p.cell.setAttribute("r", (p.r * p.cr).toFixed(1));
      }
    }
    if (F.made >= want && !F.parts.length) { F.g.remove(); foams.splice(f, 1); }
  }
  if (emitters.size || puffs.length || foams.length) raf = requestAnimationFrame(tick);
}
function spawnFoam(F) {
  const el = document.createElementNS(NS, "circle");
  el.setAttribute("fill", `rgb(${F.rgb})`);
  F.mass.appendChild(el);
  const off = rnd(-1, 1), full = F.soapy ? rnd(5.5, 10.5) : rnd(2.4, 4.6);
  const p = {
    el, state: "in", off, side: off < 0 ? -1 : 1, x: F.x + off * F.rIn * 0.8, y: F.surface, vx: 0, vy: -30, r: full * 0.35, full,
    age: 0, keep: F.soapy ? rnd(5.5, 10.5) : rnd(0.9, 2), slip: rnd(0.55, 1.15), thick: rnd(0, 0.9),
  };
  if (F.face) {
    // the streams it runs down in: five of them, fanning out from the crater
    const lane = [-0.72, -0.36, 0, 0.34, 0.7][Math.floor(Math.random() * 5)];
    p.u = lane + rnd(-0.1, 0.1);
    p.wind = lane * 9;
    p.keep += 2;
  }
  // thrown clear of the mouth while the gas is still coming hard (less and less as it dies down)
  if (F.jet && Math.random() < 0.75 * Math.exp(-F.t / 1.6) + 0.1) {
    p.jet = true;
    p.state = "over";
    p.y = F.rim;
    p.vy = -F.jet * rnd(0.45, 1) * (0.55 + 0.45 * Math.exp(-F.t / 1.4));
    p.vx = rnd(-1, 1) * F.jet * 0.2;
    p.r = full * 0.6;
  }
  // the cells of the foam: a few of its bubbles are big enough to be seen as bubbles
  if (F.soapy && Math.random() < 0.55) {
    p.cell = document.createElementNS(NS, "circle");
    p.cell.setAttribute("fill", "rgba(255,255,255,0.10)");
    p.cell.setAttribute("stroke", "rgba(255,255,255,0.5)");
    p.cell.setAttribute("stroke-width", "0.6");
    F.cells.appendChild(p.cell);
    p.cx = rnd(-0.35, 0.35); p.cy = rnd(-0.4, 0.25); p.cr = rnd(0.25, 0.5);
  }
  F.parts.push(p);
}
