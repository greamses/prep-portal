/* ============================================================================
   PRINTABLE WORKBOOK — a LOGIC CIRCUIT you build, wire and test
   ----------------------------------------------------------------------------
   A free WORKSPACE. Toggle switches and a bulb are on it to begin with; gates
   come from the tray. Nothing has a set place and nothing is wired: the child
   lays the parts out and connects them, as on a bench.

     drag a gate      from the tray onto the workspace (or tap it, then tap
                      where it should go). As many of each as are wanted.
     drag a part      anywhere on the workspace. A gate dragged off it is gone.
     wire             drag from one pin to another — a pin that gives (the
                      right of a switch or gate) to a pin that takes (the left
                      of a gate or of the bulb). Or tap one pin, then the other.
                      An output may feed many wires; an input takes one.
     cut a wire       tap it
     flip a switch    tap it: down is 0, up is 1 — a wire carrying 1 glows
     the bulb         lights (1), stays dark (0), or shows ? while nothing
                      reaches it

   On paper the same board is printed with the switches and the bulb on it and
   the gates beside it: the child draws the gates and the wires.

   Every gate has its own colour, the same in the tray, on the workspace and in
   the pictures the workbook prints:

     AND blue · OR green · NOT red · XOR purple · NAND orange · NOR teal · XNOR pink

   It is MARKED BY WHAT IT DOES, not by what is in it: the circuit is right
   when the bulb does what the question's truth table says for every setting
   of the switches (circuitRight). So a NAND is as good as an AND with a NOT
   after it, and any layout that works is right.

   A question still names a LAYOUT — one, then-not, not-in, two — but only to
   say how many switches there are and what the answer key's own circuit is
   (tableOf); the workspace itself has no layout.

     [data-gates]     JSON: { layout, palette: ["AND", …] } — what was printed
                      in it comes back on dispose()
   ========================================================================== */

export const GATES = {
  AND: { col: "#2f6ea8", tint: "#d6e8f7", two: true, fn: (a, b) => a & b },
  OR: { col: "#3d8a4a", tint: "#d9efd9", two: true, fn: (a, b) => a | b },
  NOT: { col: "#c0453f", tint: "#f9d9d6", two: false, fn: (a) => 1 - a },
  XOR: { col: "#7b4fa3", tint: "#e7dbf3", two: true, fn: (a, b) => a ^ b },
  NAND: { col: "#d9822b", tint: "#fbe6cf", two: true, fn: (a, b) => 1 - (a & b) },
  NOR: { col: "#1f8a8a", tint: "#d2eeee", two: true, fn: (a, b) => 1 - (a | b) },
  XNOR: { col: "#c2478f", tint: "#f8dcec", two: true, fn: (a, b) => 1 - (a ^ b) },
};

/* The answer key's own circuits: which switches, and which gate feeds which. */
const LAYOUTS = {
  one: { inputs: ["A", "B"], slots: [{ id: "g1", two: true, from: ["A", "B"] }], out: "g1" },
  "then-not": { inputs: ["A", "B"], slots: [{ id: "g1", two: true, from: ["A", "B"] }, { id: "g2", two: false, from: ["g1"] }], out: "g2" },
  "not-in": { inputs: ["A", "B"], slots: [{ id: "g1", two: false, from: ["A"] }, { id: "g2", two: true, from: ["g1", "B"] }], out: "g2" },
  two: { inputs: ["A", "B", "C"], slots: [{ id: "g1", two: true, from: ["A", "B"] }, { id: "g2", two: true, from: ["g1", "C"] }], out: "g2" },
};

/* the workspace, in millimetres */
const W = 150;
const heightOf = (layout) => (LAYOUTS[layout].inputs.length > 2 ? 74 : 60);
const SW_X = 15, BULB_X = 135;

/** What a layout's own circuit gives for these switches (the answer key). */
export function runCircuit(layout, slots, sw) {
  const L = LAYOUTS[layout];
  const val = { ...sw };
  for (const s of L.slots) {
    const ins = s.from.map((f) => val[f]);
    const g = slots[s.id];
    if (ins.some((v) => v == null)) { val[s.id] = null; continue; }
    if (!g) { val[s.id] = s.two ? null : ins[0]; continue; }
    val[s.id] = GATES[g].two ? GATES[g].fn(ins[0], ins[1]) : GATES[g].fn(ins[0]);
  }
  return val;
}
/** Every setting of the switches, in table order: 00, 01, 10, 11 (A the big end). */
export function settings(layout) {
  const ins = LAYOUTS[layout].inputs;
  return Array.from({ length: 2 ** ins.length }, (_, k) => Object.fromEntries(ins.map((n, i) => [n, (k >> (ins.length - 1 - i)) & 1])));
}
/** The output column of a layout's own circuit: what a question asks for. */
export const tableOf = (layout, slots) => settings(layout).map((sw) => runCircuit(layout, slots, sw)[LAYOUTS[layout].out]);

/* ── a circuit somebody BUILT: parts and wires ─────────────────────────────
     parts   [{ id, kind, x, y }]   kind: "SW" | "BULB" | a gate's name
     wires   [{ from, to, pin }]    from a part's output to input `pin` of another
     sw      { A: 0, B: 1 }         how the switches are set (testing, not answer) */

const insOf = (kind) => (kind === "SW" ? 0 : kind === "BULB" || !GATES[kind].two ? 1 : 2);
const givesOut = (kind) => kind !== "BULB";

/** What every part gives for these switches; null where nothing reaches it. */
export function runBuilt(st, sw) {
  const memo = {};
  const part = Object.fromEntries((st?.parts || []).map((p) => [p.id, p]));
  const feed = (id, pin) => (st?.wires || []).find((w) => w.to === id && w.pin === pin);
  const val = (id, seen) => {
    if (id in memo) return memo[id];
    const p = part[id];
    if (!p || seen.has(id)) return null;
    if (p.kind === "SW") return (memo[id] = sw[id] ? 1 : 0);
    const next = new Set(seen).add(id);
    const ins = Array.from({ length: insOf(p.kind) }, (_, k) => { const w = feed(id, k); return w ? val(w.from, next) : null; });
    if (ins.some((v) => v == null)) return (memo[id] = null);
    return (memo[id] = p.kind === "BULB" ? ins[0] : GATES[p.kind].two ? GATES[p.kind].fn(ins[0], ins[1]) : GATES[p.kind].fn(ins[0]));
  };
  (st?.parts || []).forEach((p) => val(p.id, new Set()));
  return memo;
}
/** The built circuit's whole output column: what the bulb does on every row. */
export const builtTable = (layout, st) => settings(layout).map((sw) => runBuilt(st, sw).Q ?? null);
/** Does the built circuit do what the target column says, on every row? */
export const circuitRight = (layout, st, target) => builtTable(layout, st).every((v, i) => v === target[i]);

/** The workspace as it starts: the switches down the left, the bulb on the right. */
function fresh(layout) {
  const ins = LAYOUTS[layout].inputs;
  const H = heightOf(layout);
  return {
    parts: [
      ...ins.map((n, i) => ({ id: n, kind: "SW", x: SW_X, y: Math.round((H * (i + 1)) / (ins.length + 1)) })),
      { id: "Q", kind: "BULB", x: BULB_X, y: H / 2 },
    ],
    wires: [],
    sw: Object.fromEntries(ins.map((n) => [n, 0])),
  };
}
/** A saved circuit made whole: its switches and bulb are always there. */
function whole(layout, saved) {
  const base = fresh(layout);
  if (!saved || !Array.isArray(saved.parts)) return base;
  const st = JSON.parse(JSON.stringify(saved));
  base.parts.forEach((p) => { if (!st.parts.some((q) => q.id === p.id)) st.parts.push(p); });
  st.wires = (st.wires || []).filter((w) => st.parts.some((p) => p.id === w.from) && st.parts.some((p) => p.id === w.to));
  st.sw = { ...base.sw, ...(st.sw || {}) };
  Object.keys(st.sw).forEach((n) => { st.sw[n] = st.sw[n] ? 1 : 0; });
  return st;
}

/* ── drawing ───────────────────────────────────────────────────────────── */

const INK = "#2a2723";
const LEAD = `stroke="${INK}" stroke-width="0.55" stroke-linecap="round" fill="none"`;

/** A gate's symbol in its own colour, about 24 × 14, centred on (0, 0). */
export function gateSvg(kind) {
  const { col, tint } = GATES[kind];
  const s = `stroke="${col}" stroke-width="0.8" fill="${tint}" stroke-linejoin="round"`;
  const bubble = (x) => `<circle cx="${x}" cy="0" r="1.5" ${s}/>`;
  const and = `<path d="M-9 -6.5H-1A6.5 6.5 0 0 1 -1 6.5H-9Z" ${s}/>`;
  const or = `<path d="M-9 -6.5Q2 -6.5 7 0Q2 6.5 -9 6.5Q-5.5 0 -9 -6.5Z" ${s}/>`;
  const arc = `<path d="M-11.4 -6.5Q-7.9 0 -11.4 6.5" fill="none" stroke="${col}" stroke-width="0.8"/>`;
  const body = kind === "NOT" ? `<path d="M-8 -6L5 0L-8 6Z" ${s}/>` + bubble(6.5)
    : kind === "AND" ? and : kind === "NAND" ? and + bubble(7)
      : kind === "OR" ? or : kind === "NOR" ? or + bubble(8.5)
        : kind === "XOR" ? or + arc : or + arc + bubble(8.5);
  return body + `<text x="${kind === "NOT" ? -3.4 : -2.4}" y="1.3" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="${kind.length > 3 ? 2.9 : 3.3}" font-weight="800" fill="${col}">${kind}</text>`;
}
/** A gate with its legs: two wires in (one for a NOT), one out. */
function gateWithLegs(kind) {
  const two = GATES[kind].two;
  const curved = kind !== "AND" && kind !== "NAND" && kind !== "NOT";
  const inX = curved ? -7.6 : kind === "NOT" ? -8 : -9;
  const outX = kind === "AND" ? 5.5 : kind === "OR" || kind === "XOR" ? 7 : kind === "NOT" ? 8 : kind === "NAND" ? 8.5 : 10;
  const legs = (two ? [-3.4, 3.4] : [0]).map((y) => `<path d="M-15 ${y}H${inX}" ${LEAD}/>`).join("") + `<path d="M${outX} 0H15" ${LEAD}/>`;
  return legs + gateSvg(kind);
}
const chip = (kind) => `<svg viewBox="-17 -8.5 34 17" aria-hidden="true">${gateWithLegs(kind)}</svg>`;

/** A toggle switch: a plate, a lever thrown down (0) or up (1), one leg out. */
function switchSvg(name, on) {
  const tipY = on ? -5.6 : 5.6;
  return `<path d="M6.5 0H15" ${LEAD}/>` +
    `<rect x="-7" y="-7.5" width="13.5" height="15" rx="1.6" fill="#d9d4c9" stroke="${INK}" stroke-width="0.5"/>` +
    `<circle cx="-4.6" cy="-5.2" r="0.7" fill="#8a837a"/><circle cx="4.1" cy="5.2" r="0.7" fill="#8a837a"/>` +
    `<circle cx="-0.3" cy="0" r="3" fill="#8f979e" stroke="${INK}" stroke-width="0.45"/>` +
    `<path d="M-0.3 0L-0.3 ${tipY}" stroke="${on ? "#3d8a4a" : "#5d646b"}" stroke-width="2.3" stroke-linecap="round"/>` +
    `<circle cx="-0.3" cy="${tipY}" r="1.7" fill="${on ? "#58b368" : "#c9ced3"}" stroke="${INK}" stroke-width="0.45"/>` +
    `<text x="4" y="-3.6" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.6" font-weight="700" fill="${INK}">1</text>` +
    `<text x="-4.4" y="5.2" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.6" font-weight="700" fill="${INK}">0</text>` +
    `<text x="-10.5" y="1.6" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="4.6" font-weight="800" fill="${INK}">${name}</text>`;
}
/** A lamp: glass, filament and a screw cap; one leg in. q is 1, 0 or null. */
function bulbSvg(q) {
  const on = q === 1;
  const glass = on ? "#ffd84a" : "#f7f4ec";
  return `<path d="M-15 0H-6.5V5.4H-2.7" ${LEAD}/>` +
    (on ? `<circle cx="0" cy="-2.6" r="10.5" fill="#ffd84a" opacity="0.28"/><circle cx="0" cy="-2.6" r="8" fill="#ffd84a" opacity="0.35"/>` : "") +
    `<path d="M-2.7 3.4C-2.7 1.4 -5.6 0 -5.6 -3A5.6 5.6 0 0 1 5.6 -3C5.6 0 2.7 1.4 2.7 3.4Z" fill="${glass}" stroke="${on ? "#b97f00" : INK}" stroke-width="0.5" stroke-linejoin="round"/>` +
    `<path d="M-1.5 3.4V-0.6L-0.8 -2.6L0 -0.9L0.8 -2.6L1.5 -0.6V3.4" fill="none" stroke="${on ? "#b85c00" : "#8a837a"}" stroke-width="0.4" stroke-linejoin="round"/>` +
    `<rect x="-2.7" y="3.4" width="5.4" height="4" rx="0.5" fill="#a9afb5" stroke="${INK}" stroke-width="0.45"/>` +
    `<path d="M-2.7 4.8H2.7M-2.7 6.1H2.7" stroke="${INK}" stroke-width="0.3"/>` +
    `<path d="M-1.4 7.4H1.4L0.8 8.6H-0.8Z" fill="${INK}"/>` +
    `<text x="9.2" y="-1.2" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="4.4" font-weight="800" fill="${INK}">Q</text>` +
    `<text x="9.2" y="4" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.6" font-weight="700" fill="${on ? "#b97f00" : "#6f685f"}">${q == null ? "?" : q}</text>`;
}

/** Where a part's pins are, on the workspace. */
function pinsOf(p) {
  const out = givesOut(p.kind) ? [{ pin: "out", x: p.x + 15, y: p.y }] : [];
  const n = insOf(p.kind);
  const ins = n === 2 ? [{ pin: 0, x: p.x - 15, y: p.y - 3.4 }, { pin: 1, x: p.x - 15, y: p.y + 3.4 }] : n === 1 ? [{ pin: 0, x: p.x - 15, y: p.y }] : [];
  return [...ins, ...out];
}
const pinAt = (st, id, pin) => { const p = st.parts.find((q) => q.id === id); return p ? pinsOf(p).find((q) => q.pin === pin) : null; };
const cable = (a, b) => { const d = Math.max(9, Math.abs(b.x - a.x) * 0.5); return `M${a.x} ${a.y}C${a.x + d} ${a.y} ${b.x - d} ${b.y} ${b.x} ${b.y}`; };

/** Everything on the workspace. `live`: the values, when it is being tested. */
function scene(st, { live = null, armed = null, rubber = null, lifted = null } = {}) {
  let parts = "", wires = "", pins = "";
  for (const p of st.parts) {
    const body = p.kind === "SW" ? switchSvg(p.id, st.sw[p.id] === 1) : p.kind === "BULB" ? bulbSvg(live ? live.Q ?? null : null) : gateWithLegs(p.kind);
    parts += `<g class="lb-part${lifted === p.id ? " is-lifted" : ""}" data-part="${p.id}" data-kind="${p.kind}" transform="translate(${p.x} ${p.y})">` +
      `<rect x="-15" y="-9" width="30" height="18" fill="transparent"/>${body}</g>`;
    for (const q of pinsOf(p)) {
      const key = `${p.id}:${q.pin}`;
      pins += `<g class="lb-pin${armed === key ? " is-armed" : ""}" data-pin="${key}">` +
        `<circle cx="${q.x}" cy="${q.y}" r="3.4" fill="transparent"/>` +
        `<circle cx="${q.x}" cy="${q.y}" r="1.35" fill="${q.pin === "out" ? "#fffdf8" : "#2a2723"}" stroke="${INK}" stroke-width="0.5"/></g>`;
    }
  }
  st.wires.forEach((w, i) => {
    const a = pinAt(st, w.from, "out"), b = pinAt(st, w.to, w.pin);
    if (!a || !b) return;
    const hot = live && live[w.from] === 1;
    const d = cable(a, b);
    wires += `<g class="lb-wire${hot ? " is-hot" : ""}" data-wire="${i}">` +
      `<path d="${d}" fill="none" stroke="transparent" stroke-width="4.2"/>` +
      (hot ? `<path d="${d}" fill="none" stroke="#ffd84a" stroke-width="2.2" opacity="0.55" stroke-linecap="round"/>` : "") +
      `<path d="${d}" fill="none" stroke="${hot ? "#d98c00" : "#3f4a56"}" stroke-width="0.95" stroke-linecap="round"/></g>`;
  });
  if (rubber) wires += `<path d="${cable(rubber.a, rubber.b)}" fill="none" stroke="#8a837a" stroke-width="0.8" stroke-dasharray="1.6 1.2" stroke-linecap="round"/>`;
  return parts + wires + pins;
}

/** The board as it is PRINTED: switches and bulb on an empty workspace. */
export function gatesBoardHtml({ layout, palette }) {
  const H = heightOf(layout);
  const cfg = JSON.stringify({ layout, palette }).replace(/"/g, "&quot;");
  return `<div class="lb-wrap"><div class="lb-tray lb-tray--print">${palette.map((g) => `<span class="lb-chip" data-gate="${g}">${chip(g)}</span>`).join("")}</div>` +
    `<div class="lb-board" data-gates="${cfg}" style="width:${W}mm;aspect-ratio:${W} / ${H}">` +
    `<svg class="lb-space" viewBox="0 0 ${W} ${H}" aria-hidden="true">${scene(fresh(layout))}</svg></div></div>`;
}

/**
 *   mountGates(el, { saved, onChange })
 *     saved                 { parts, wires, sw } or null
 *     onChange(now, before) after a part is added, moved or removed, or a wire
 *                           made or cut (switches are not a "change": flipping
 *                           them is the testing, not the answer)
 *   → { state(), set(s), clear(), dispose() }
 */
export function mountGates(el, { saved = null, onChange = () => {} } = {}) {
  const cfg = JSON.parse(el.dataset.gates);
  const H = heightOf(cfg.layout);
  const wrap = el.closest(".lb-wrap") || el.parentElement;
  const printed = wrap.innerHTML;
  const clone = (s) => JSON.parse(JSON.stringify(s));
  let st = whole(cfg.layout, saved);
  let held = null;       // a gate picked up from the tray by a tap, waiting for a spot
  let armed = null;      // a pin tapped, waiting for the pin it is wired to
  let drag = null;

  wrap.classList.add("is-live");
  const tray = wrap.querySelector(".lb-tray");
  tray.classList.remove("lb-tray--print");
  const board = wrap.querySelector(".lb-board");
  const svg = board.querySelector(".lb-space");
  svg.removeAttribute("aria-hidden");
  const say = document.createElement("p");
  say.className = "lb-say";
  wrap.appendChild(say);

  const names = Object.keys(st.sw);
  function paint() {
    const live = runBuilt(st, st.sw);
    svg.innerHTML = scene(st, { live, armed, rubber: drag?.rubber || null, lifted: drag?.kind === "part" && drag.moved ? drag.id : null });
    tray.querySelectorAll(".lb-chip").forEach((c) => c.classList.toggle("is-held", held === c.dataset.gate));
    board.classList.toggle("is-placing", !!held);
    if (flashing) return;
    const q = live.Q ?? null;
    say.textContent = held ? `Tap the workspace where the ${held} gate should go.`
      : armed ? "Now tap the pin this wire goes to."
        : q == null ? "Drag gates onto the workspace, then drag from pin to pin to wire them. Tap a wire to cut it; drag a gate off to remove it."
          : `Switches ${names.map((n) => `${n} = ${st.sw[n]}`).join(", ")}: the bulb is ${q ? "ON (1)" : "off (0)"}.`;
  }
  let flashing = 0;
  function flash(text) {
    say.textContent = text;
    say.classList.add("is-loud");
    clearTimeout(flashing);
    flashing = setTimeout(() => { flashing = 0; say.classList.remove("is-loud"); paint(); }, 1900);
  }
  /** One change to the circuit: made, painted, and told to the page. */
  function change(fn) {
    const before = clone(st);
    fn();
    paint();
    onChange(clone(st), before);
  }

  /** A pointer's place on the workspace, in millimetres. */
  function at(e) {
    const r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom };
  }
  const clamp = (p) => ({ x: Math.min(W - 16, Math.max(16, Math.round(p.x * 2) / 2)), y: Math.min(H - 9.5, Math.max(9.5, Math.round(p.y * 2) / 2)) });

  function addGate(kind, where) {
    let n = 1;
    while (st.parts.some((p) => p.id === `g${n}`)) n++;
    change(() => { st.parts.push({ id: `g${n}`, kind, ...clamp(where) }); held = null; });
  }
  function removePart(id) {
    change(() => { st.parts = st.parts.filter((p) => p.id !== id); st.wires = st.wires.filter((w) => w.from !== id && w.to !== id); });
  }
  const feeds = (from, to) => from === to || st.wires.some((w) => w.from === to && feeds(from, w.to));
  /** Wire two pins, whichever way round they were picked. */
  function connect(k1, k2) {
    const [a, b] = [k1, k2].map((k) => { const [id, pin] = k.split(":"); return { id, pin: pin === "out" ? "out" : Number(pin) }; });
    const src = a.pin === "out" ? a : b.pin === "out" ? b : null;
    const dst = a.pin === "out" ? b : a;
    if (!src || dst.pin === "out") { flash(src ? "A wire goes from a pin that gives (on the right) to a pin that takes (on the left)." : "One end of a wire must be an output: the pin on the right of a switch or a gate."); return; }
    if (src.id === dst.id) { flash("A gate cannot feed itself."); return; }
    if (feeds(dst.id, src.id)) { flash("That wire would make a loop."); return; }
    change(() => {
      st.wires = st.wires.filter((w) => !(w.to === dst.id && w.pin === dst.pin));
      st.wires.push({ from: src.id, to: dst.id, pin: dst.pin });
    });
  }
  const pinUnder = (e) => document.elementFromPoint(e.clientX, e.clientY)?.closest?.("[data-pin]")?.dataset.pin || null;

  const down = (e) => {
    const c = e.target.closest?.(".lb-chip");
    if (c && tray.contains(c)) {
      e.preventDefault();
      drag = { kind: "new", gate: c.dataset.gate, x: e.clientX, y: e.clientY, ghost: null, moved: false };
      return;
    }
    if (!board.contains(e.target)) return;
    const pin = e.target.closest?.("[data-pin]");
    const wire = e.target.closest?.("[data-wire]");
    const part = e.target.closest?.("[data-part]");
    if (pin) {
      e.preventDefault();
      const [id, p] = pin.dataset.pin.split(":");
      const a = pinAt(st, id, p === "out" ? "out" : Number(p));
      drag = { kind: "wire", pin: pin.dataset.pin, a, x: e.clientX, y: e.clientY, moved: false, rubber: null };
    } else if (wire) {
      drag = { kind: "cut", i: Number(wire.dataset.wire), x: e.clientX, y: e.clientY, moved: false };
    } else if (part) {
      e.preventDefault();
      const p = st.parts.find((q) => q.id === part.dataset.part);
      const m = at(e);
      drag = { kind: "part", id: p.id, dx: p.x - m.x, dy: p.y - m.y, x: e.clientX, y: e.clientY, moved: false, before: clone(st) };
    } else if (held) {
      addGate(held, at(e));
    } else if (armed) {
      armed = null;
      paint();
    }
  };
  const move = (e) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) return;
    drag.moved = true;
    if (drag.kind === "new") {
      if (!drag.ghost) {
        const g = document.createElement("span");
        g.className = "lb-chip lb-ghost";
        g.dataset.gate = drag.gate;
        g.innerHTML = chip(drag.gate);
        document.body.appendChild(g);
        drag.ghost = g;
      }
      drag.ghost.style.left = `${e.clientX}px`;
      drag.ghost.style.top = `${e.clientY}px`;
    } else if (drag.kind === "wire") {
      const m = at(e);
      const out = drag.pin.endsWith(":out");
      drag.rubber = out ? { a: drag.a, b: m } : { a: m, b: drag.a };
      paint();
    } else if (drag.kind === "part") {
      const m = at(e);
      const p = st.parts.find((q) => q.id === drag.id);
      Object.assign(p, clamp({ x: m.x + drag.dx, y: m.y + drag.dy }));
      paint();
    }
  };
  const up = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    d.ghost?.remove();
    if (d.kind === "new") {
      if (!d.moved) { held = held === d.gate ? null : d.gate; armed = null; paint(); return; }
      const m = at(e);
      if (m.inside) addGate(d.gate, m); else paint();
    } else if (d.kind === "wire") {
      const other = pinUnder(e);
      if (d.moved) {
        armed = null;
        if (other && other !== d.pin) connect(d.pin, other); else paint();
      } else if (armed && armed !== d.pin) {
        const first = armed;
        armed = null;
        connect(first, d.pin);
        paint();
      } else {
        armed = armed === d.pin ? null : d.pin;
        held = null;
        paint();
      }
    } else if (d.kind === "cut") {
      if (!d.moved && st.wires[d.i]) change(() => { st.wires.splice(d.i, 1); });
    } else if (d.kind === "part") {
      const p = st.parts.find((q) => q.id === d.id);
      if (!d.moved) {
        if (p.kind === "SW") { st.sw[p.id] = 1 - st.sw[p.id]; paint(); }
        return;
      }
      const now = clone(st);
      if (!at(e).inside && p.kind !== "SW" && p.kind !== "BULB") {
        st = d.before;
        removePart(d.id);
      } else {
        paint();
        onChange(now, d.before);
      }
    }
  };
  const key = (e) => { if (e.key === "Escape" && (held || armed)) { held = null; armed = null; paint(); } };
  wrap.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("keydown", key);

  paint();
  return {
    state: () => clone(st),
    set(s) { st = whole(cfg.layout, s); held = null; armed = null; paint(); },
    clear() { st = fresh(cfg.layout); held = null; armed = null; paint(); },
    dispose() {
      wrap.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", key);
      clearTimeout(flashing);
      wrap.classList.remove("is-live");
      wrap.innerHTML = printed;
    },
  };
}
