/* ============================================================================
   PRINTABLE WORKBOOK — a LOGIC PATH you build and test
   ----------------------------------------------------------------------------
   Switches on the left, a bulb on the right, and between them wires with
   empty places for gates. On paper the child draws a gate in each place. On
   screen the gates are pieces:

     drag a gate      from the tray into a place (or tap the gate, then the
                      place); drag it out again, or tap it, to take it back
     flip a switch    0 is off, 1 is on — a wire carrying 1 lights up
     the bulb         lights (1) or stays dark (0) as the circuit says

   Every gate has its own colour, the same in the tray, on the board and in
   the pictures the workbook prints:

     AND blue · OR green · NOT red · XOR purple · NAND orange · NOR teal · XNOR pink

   A circuit is one of four LAYOUTS (which wires there are):

     one       A, B → [gate] → bulb
     then-not  A, B → [gate] → [not?] → bulb
     not-in    A → [not?] ; that and B → [gate] → bulb
     two       A, B → [gate] ; that and C → [gate] → bulb

   A place for a NOT may be left empty: then it is just the wire.

   It is MARKED BY WHAT IT DOES, not by which gates are in it: the circuit is
   right when the bulb does what the question's truth table says for every
   setting of the switches (circuitRight). So a NAND is as good as an AND with
   a NOT after it.

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

/* where things are, in millimetres on a 150 × H board */
const LAYOUTS = {
  one: { inputs: ["A", "B"], h: 40, slots: [{ id: "g1", two: true, x: 66, y: 20, from: ["A", "B"] }], out: "g1" },
  "then-not": { inputs: ["A", "B"], h: 40, slots: [{ id: "g1", two: true, x: 52, y: 20, from: ["A", "B"] }, { id: "g2", two: false, x: 96, y: 20, from: ["g1"] }], out: "g2" },
  "not-in": { inputs: ["A", "B"], h: 40, slots: [{ id: "g1", two: false, x: 44, y: 12, from: ["A"] }, { id: "g2", two: true, x: 92, y: 20, from: ["g1", "B"] }], out: "g2" },
  two: { inputs: ["A", "B", "C"], h: 54, slots: [{ id: "g1", two: true, x: 50, y: 20, from: ["A", "B"] }, { id: "g2", two: true, x: 96, y: 34, from: ["g1", "C"] }], out: "g2" },
};
const W = 150;
const INPUT_Y = { A: 12, B: 28, C: 44 };
const SW_X = 12, BULB_X = 136;
const SLOT_W = 28, SLOT_H = 17;

/** What the circuit gives for these switches: 0, 1 — or null if a two-input place is empty. */
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
/** The circuit's whole output column. */
export const tableOf = (layout, slots) => settings(layout).map((sw) => runCircuit(layout, slots, sw)[LAYOUTS[layout].out]);
/** Does the built circuit do what the target column says, on every row? */
export const circuitRight = (layout, slots, target) => tableOf(layout, slots || {}).every((v, i) => v === target[i]);

/* ── drawing ───────────────────────────────────────────────────────────── */

/** A gate's symbol in its own colour, about 24 × 14, centred on (0, 0). */
export function gateSvg(kind) {
  const { col, tint } = GATES[kind];
  const s = `stroke="${col}" stroke-width="0.7" fill="${tint}" stroke-linejoin="round"`;
  const bubble = (x) => `<circle cx="${x}" cy="0" r="1.5" ${s}/>`;
  const and = `<path d="M-9 -6.5H-1A6.5 6.5 0 0 1 -1 6.5H-9Z" ${s}/>`;
  const or = `<path d="M-9 -6.5Q2 -6.5 7 0Q2 6.5 -9 6.5Q-5.5 0 -9 -6.5Z" ${s}/>`;
  const arc = `<path d="M-11.4 -6.5Q-7.9 0 -11.4 6.5" fill="none" stroke="${col}" stroke-width="0.7"/>`;
  const body = kind === "NOT" ? `<path d="M-8 -6L5 0L-8 6Z" ${s}/>` + bubble(6.5)
    : kind === "AND" ? and : kind === "NAND" ? and + bubble(7)
      : kind === "OR" ? or : kind === "NOR" ? or + bubble(8.5)
        : kind === "XOR" ? or + arc : or + arc + bubble(8.5);
  return body + `<text x="${kind === "NOT" ? -3.4 : -2.4}" y="1.3" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="${kind.length > 3 ? 2.9 : 3.3}" font-weight="800" fill="${col}">${kind}</text>`;
}
const chip = (kind) => `<svg viewBox="-13 -8.5 26 17" aria-hidden="true">${gateSvg(kind)}</svg>`;

function wires(layout, live = null) {
  const L = LAYOUTS[layout];
  const on = (id) => (live && live[id] === 1 ? "#e0a100" : "#2a2723");
  const wide = (id) => (live && live[id] === 1 ? 0.9 : 0.5);
  const src = (id) => (id in INPUT_Y ? [SW_X + 7, INPUT_Y[id]] : (() => { const s = L.slots.find((q) => q.id === id); return [s.x + SLOT_W / 2, s.y]; })());
  let out = "";
  for (const s of L.slots) {
    s.from.forEach((f, i) => {
      const [x1, y1] = src(f);
      const x2 = s.x - SLOT_W / 2, y2 = s.two ? s.y + (i === 0 ? -4.4 : 4.4) : s.y;
      const mid = x1 + (x2 - x1) * (0.45 + i * 0.12);
      out += `<path d="M${x1} ${y1}H${mid}V${y2}H${x2}" fill="none" stroke="${on(f)}" stroke-width="${wide(f)}"/>`;
    });
  }
  const [ox, oy] = src(L.out);
  out += `<path d="M${ox} ${oy}H${BULB_X - 6}" fill="none" stroke="${on(L.out)}" stroke-width="${wide(L.out)}"/>`;
  return out;
}

/** The board as it is PRINTED: places empty, switches and bulb outlined. */
export function gatesBoardHtml({ layout, palette }) {
  const L = LAYOUTS[layout];
  const pct = (x, y) => `left:${(x / W) * 100}%;top:${(y / L.h) * 100}%`;
  const cfg = JSON.stringify({ layout, palette }).replace(/"/g, "&quot;");
  let over = "";
  L.inputs.forEach((n) => { over += `<span class="lb-switch" style="${pct(SW_X, INPUT_Y[n])}"><b>${n}</b></span>`; });
  L.slots.forEach((s) => { over += `<span class="lb-slot${s.two ? "" : " lb-slot--one"}" style="${pct(s.x, s.y)}"></span>`; });
  over += `<span class="lb-bulb" style="${pct(BULB_X, LAYOUTS[layout].slots.find((s) => s.id === L.out).y)}"><b>Q</b></span>`;
  return `<div class="lb-wrap"><div class="lb-tray lb-tray--print">${palette.map((g) => `<span class="lb-chip" data-gate="${g}">${chip(g)}</span>`).join("")}</div>` +
    `<div class="lb-board" data-gates="${cfg}" style="width:${W}mm;height:${L.h}mm">` +
    `<svg class="lb-wires" viewBox="0 0 ${W} ${L.h}" aria-hidden="true">${wires(layout)}</svg>${over}</div></div>`;
}

/**
 *   mountGates(el, { saved, onChange })
 *     saved                 { slots: { g1: "AND" }, sw: { A: 0, B: 1 } } or null
 *     onChange(now, before) after a gate moves (switches are not a "change":
 *                           flipping them is the testing, not the answer)
 *   → { state(), set(s), clear(), dispose() }
 */
export function mountGates(el, { saved = null, onChange = () => {} } = {}) {
  const cfg = JSON.parse(el.dataset.gates);
  const L = LAYOUTS[cfg.layout];
  const wrap = el.closest(".lb-wrap") || el.parentElement;
  const printed = wrap.innerHTML;
  const clone = (s) => JSON.parse(JSON.stringify(s));
  let st = saved ? clone(saved) : { slots: {}, sw: {} };
  L.inputs.forEach((n) => { st.sw[n] = st.sw[n] ? 1 : 0; });
  let held = null;       // a gate picked up by a tap, waiting for a place

  wrap.classList.add("is-live");
  const tray = wrap.querySelector(".lb-tray");
  tray.classList.remove("lb-tray--print");
  const board = wrap.querySelector(".lb-board");
  const svg = board.querySelector(".lb-wires");
  const say = document.createElement("p");
  say.className = "lb-say";
  wrap.appendChild(say);

  function paint() {
    const val = runCircuit(cfg.layout, st.slots, st.sw);
    svg.innerHTML = wires(cfg.layout, val);
    board.querySelectorAll(".lb-switch").forEach((n, i) => {
      const name = L.inputs[i];
      n.classList.toggle("is-on", st.sw[name] === 1);
      n.innerHTML = `<b>${name}</b><i>${st.sw[name]}</i>`;
      n.setAttribute("role", "switch");
      n.setAttribute("aria-checked", String(st.sw[name] === 1));
      n.tabIndex = 0;
    });
    board.querySelectorAll(".lb-slot").forEach((n, i) => {
      const s = L.slots[i];
      const g = st.slots[s.id];
      n.dataset.slot = s.id;
      n.classList.toggle("is-full", !!g);
      n.innerHTML = g ? `<span class="lb-chip" data-gate="${g}" data-from="${s.id}">${chip(g)}</span>` : "";
    });
    const q = val[L.out];
    const bulb = board.querySelector(".lb-bulb");
    bulb.classList.toggle("is-on", q === 1);
    bulb.classList.toggle("is-open", q == null);
    bulb.innerHTML = `<b>Q</b><i>${q == null ? "?" : q}</i>`;
    tray.querySelectorAll(".lb-chip").forEach((c) => c.classList.toggle("is-held", held === c.dataset.gate));
    say.textContent = q == null ? "Put a gate in every two-wire place, then flip the switches."
      : `Switches ${L.inputs.map((n) => `${n} = ${st.sw[n]}`).join(", ")}: the bulb is ${q ? "ON (1)" : "off (0)"}.`;
  }

  function place(slotId, gate) {
    const s = L.slots.find((q) => q.id === slotId);
    if (!s || GATES[gate].two !== s.two) { flash(s && !s.two ? "Only a NOT fits a one-wire place." : "A NOT has one wire in: it does not fit here."); return; }
    const before = clone(st);
    st.slots[slotId] = gate;
    held = null;
    paint();
    onChange(clone(st), before);
  }
  function take(slotId) {
    if (!st.slots[slotId]) return;
    const before = clone(st);
    delete st.slots[slotId];
    paint();
    onChange(clone(st), before);
  }
  let flashing = 0;
  function flash(text) {
    say.textContent = text;
    say.classList.add("is-loud");
    clearTimeout(flashing);
    flashing = setTimeout(() => { say.classList.remove("is-loud"); paint(); }, 1800);
  }

  /* ── dragging a gate: from the tray into a place, or out of one ────────── */
  let drag = null;
  const down = (e) => {
    const c = e.target.closest(".lb-chip");
    const sw = e.target.closest(".lb-switch");
    if (sw && board.contains(sw)) {
      const name = L.inputs[[...board.querySelectorAll(".lb-switch")].indexOf(sw)];
      st.sw[name] = 1 - st.sw[name];
      paint();
      return;
    }
    if (!c || !wrap.contains(c)) {
      const slot = e.target.closest(".lb-slot");
      if (slot && held) place(slot.dataset.slot, held);
      return;
    }
    e.preventDefault();
    drag = { gate: c.dataset.gate, from: c.dataset.from || null, x: e.clientX, y: e.clientY, ghost: null, moved: false };
  };
  const move = (e) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) return;
    if (!drag.ghost) {
      drag.moved = true;
      const g = document.createElement("span");
      g.className = "lb-chip lb-ghost";
      g.dataset.gate = drag.gate;
      g.innerHTML = chip(drag.gate);
      document.body.appendChild(g);
      drag.ghost = g;
    }
    drag.ghost.style.left = `${e.clientX}px`;
    drag.ghost.style.top = `${e.clientY}px`;
  };
  const up = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    d.ghost?.remove();
    if (!d.moved) {
      /* a tap: a gate in a place comes out; a gate in the tray is picked up */
      if (d.from) take(d.from);
      else { held = held === d.gate ? null : d.gate; paint(); }
      return;
    }
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const slot = under?.closest?.(".lb-slot");
    if (slot && board.contains(slot)) {
      const target = L.slots.find((q) => q.id === slot.dataset.slot);
      if (GATES[d.gate].two !== target.two) { flash(target.two ? "A NOT has one wire in: it does not fit here." : "Only a NOT fits a one-wire place."); return; }
      if (d.from === target.id) return;
      /* out of the place it came from (if any) and into this one */
      const before = clone(st);
      if (d.from) delete st.slots[d.from];
      st.slots[target.id] = d.gate;
      held = null;
      paint();
      onChange(clone(st), before);
    } else if (d.from) take(d.from);
  };
  const key = (e) => {
    const sw = e.target.closest?.(".lb-switch");
    if (sw && (e.key === " " || e.key === "Enter")) { e.preventDefault(); down({ target: sw, preventDefault() {} }); }
  };
  wrap.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  wrap.addEventListener("keydown", key);

  paint();
  return {
    state: () => clone(st),
    set(s) { st = s ? clone(s) : { slots: {}, sw: {} }; L.inputs.forEach((n) => { st.sw[n] = st.sw[n] ? 1 : 0; }); held = null; paint(); },
    clear() { st = { slots: {}, sw: Object.fromEntries(L.inputs.map((n) => [n, 0])) }; held = null; paint(); },
    dispose() {
      wrap.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      wrap.removeEventListener("keydown", key);
      wrap.classList.remove("is-live");
      wrap.innerHTML = printed;
    },
  };
}
