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
     flip a switch    tap it. A switch wears the POWER SIGN, a 1 inside a 0:
                      off, the 0 glows red and the 1 is dark; on, the 1 glows
                      green and the 0 goes dark. A wire carrying 1 glows.
     the output       a bulb lights (1), stays dark (0), or shows ? while
                      nothing reaches it
     a display        a DECIMAL DISPLAY from the tray reads the wires on its
                      pins as one binary number (the top pin the biggest:
                      8 4 2 1) and shows it in decimal. Its − and + take a
                      pin away or add one: 1 pin to 8.
     more switches    a switch dropped on empty workspace is an EXTRA input
                      (D, E, F …) — something to feed a display with. Extras
                      are not in the question's table: they count as off
                      when the circuit is marked.
     exchange         an input may be a power switch or a PRESS switch; the
                      output a bulb, a SPEAKER or a FAN. Drag one of these
                      from the tray onto the switch or the output it is to
                      replace (or tap it, then tap the part): it takes that
                      part's place, wires and all. What a part LOOKS like
                      never changes what the circuit does.

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

const MAX_BITS = 8;
const bitsOf = (p) => Math.min(MAX_BITS, Math.max(1, p.bits || 4));
const insOf = (p) => (p.kind === "SW" ? 0 : p.kind === "DISP" ? bitsOf(p) : p.kind === "BULB" || !GATES[p.kind].two ? 1 : 2);
const givesOut = (kind) => kind !== "BULB" && kind !== "DISP";

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
    const ins = Array.from({ length: insOf(p) }, (_, k) => { const w = feed(id, k); return w ? val(w.from, next) : null; });
    /* a display reads its pins as one binary number, the top pin the biggest; a pin with nothing on it is 0 */
    if (p.kind === "DISP") return (memo[id] = ins.reduce((n, v) => n * 2 + (v === 1 ? 1 : 0), 0));
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

/* ── the speaker's own voice ───────────────────────────────────────────────
   One audio context for the page, made the first time a speaker has to sound
   (which is always after a tap, so the browser allows it). Each board holds
   its own tone: a soft 440 Hz buzz that fades in and out rather than clicking. */
let audio = null;
function toneOn() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio ||= new AC();
    if (audio.state === "suspended") audio.resume();
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, audio.currentTime + 0.04);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    return { osc, gain };
  } catch { return null; }
}
function toneOff(t) {
  if (!t || !audio) return;
  try {
    t.gain.gain.cancelScheduledValues(audio.currentTime);
    t.gain.gain.setValueAtTime(t.gain.gain.value, audio.currentTime);
    t.gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.05);
    t.osc.stop(audio.currentTime + 0.08);
  } catch { /* already stopped */ }
}

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
const chip = (kind) => (kind === "DISP" ? `<svg viewBox="-17 -10 34 20" aria-hidden="true">${dispSvg({ bits: 2 }, 3, false)}</svg>`
  : `<svg viewBox="-17 -8.5 34 17" aria-hidden="true">${gateWithLegs(kind)}</svg>`);

/* ── the decimal display ───────────────────────────────────────────────── */
const PIN_GAP = 4.6;
const dispH = (p) => Math.max(15, bitsOf(p) * PIN_GAP + 3);
/** Where pin k of an n-pin display is, up or down from its middle. */
const dispY = (n, k) => (k - (n - 1) / 2) * PIN_GAP;
/**
 * A decimal display: a dark screen showing the number its pins make. Each
 * pin is marked with what it is worth (8, 4, 2, 1). With `controls`, a − and
 * a + under it take a pin away or add one.
 */
function dispSvg(p, value, controls = true) {
  const n = bitsOf(p), h = dispH(p);
  let s = "";
  for (let k = 0; k < n; k++) {
    const y = dispY(n, k).toFixed(2);
    s += `<path d="M-15 ${y}H-9" ${LEAD}/>` +
      `<text x="-6.6" y="${(+y + 0.95).toFixed(2)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.5" font-weight="700" fill="#b8c0c8">${2 ** (n - 1 - k)}</text>`;
  }
  const digits = String(value).length;
  return `<rect x="-9" y="${(-h / 2).toFixed(2)}" width="24" height="${h.toFixed(2)}" rx="1.6" fill="#24272b" stroke="${INK}" stroke-width="0.5"/>` + s +
    `<rect x="-3.6" y="${(-Math.min(h / 2 - 1.4, 6)).toFixed(2)}" width="17.2" height="${(Math.min(h / 2 - 1.4, 6) * 2).toFixed(2)}" rx="1" fill="#0d1a12"/>` +
    `<text x="5" y="${digits > 2 ? 2.6 : 3.1}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="${digits > 2 ? 7.4 : 9}" font-weight="800" fill="#4dff88">${value}</text>` +
    (controls
      ? `<g class="lb-bits" data-bits="-1"><circle cx="0.6" cy="${(h / 2 + 3.4).toFixed(2)}" r="2.3" fill="#fffdf8" stroke="${INK}" stroke-width="0.45"/><path d="M-0.6 ${(h / 2 + 3.4).toFixed(2)}h2.4" stroke="${INK}" stroke-width="0.6" stroke-linecap="round"/></g>` +
        `<g class="lb-bits" data-bits="1"><circle cx="6.6" cy="${(h / 2 + 3.4).toFixed(2)}" r="2.3" fill="#fffdf8" stroke="${INK}" stroke-width="0.45"/><path d="M5.4 ${(h / 2 + 3.4).toFixed(2)}h2.4M6.6 ${(h / 2 + 2.2).toFixed(2)}v2.4" stroke="${INK}" stroke-width="0.6" stroke-linecap="round"/></g>` +
        `<text x="11.4" y="${(h / 2 + 4.3).toFixed(2)}" text-anchor="start" font-family="JetBrains Mono, monospace" font-size="2.4" font-weight="700" fill="#6f685f">pins</text>`
      : "");
}
/** How far a part reaches up and down from its middle: what keeps it on the workspace. */
const halfOf = (p) => (p.kind === "DISP" ? dispH(p) / 2 + 6.4 : 9.5);

const MONO = `font-family="JetBrains Mono, monospace"`;
const tag = (x, y, text, size = 4.6) => `<text x="${x}" y="${y}" text-anchor="middle" ${MONO} font-size="${size}" font-weight="800" fill="${INK}">${text}</text>`;

/* What an input and an output may look like. The look is dress only. */
export const INPUT_LOOKS = ["power", "toggle", "press"];
export const OUTPUT_LOOKS = ["bulb", "speaker", "fan"];
const LOOK_NAME = { power: "power switch", toggle: "toggle switch", press: "press switch", bulb: "bulb", speaker: "speaker", fan: "fan" };
const RED_ON = "#f0443e", GREEN_ON = "#35c759", DARK = "#4b5057";

/**
 * A POWER SWITCH: the power sign, a 1 standing in a 0.
 *   off   the 0 glows red, the 1 is dark
 *   on    the 1 glows green, the 0 is dark
 */
function powerSvg(on) {
  const ring = "M-2.5 -3.3A4.4 4.4 0 1 0 2.5 -3.3";
  const zero = on ? DARK : RED_ON, one = on ? GREEN_ON : DARK;
  return `<path d="M7 0H15" ${LEAD}/>` +
    `<rect x="-7" y="-7" width="14" height="14" rx="3" fill="#24272b" stroke="${INK}" stroke-width="0.5"/>` +
    (on ? `<path d="M0 -5.6V-0.6" stroke="${GREEN_ON}" stroke-width="3.4" stroke-linecap="round" opacity="0.3"/>`
      : `<path d="${ring}" fill="none" stroke="${RED_ON}" stroke-width="3.4" stroke-linecap="round" opacity="0.3"/>`) +
    `<path d="${ring}" fill="none" stroke="${zero}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="M0 -5.6V-0.6" stroke="${one}" stroke-width="1.5" stroke-linecap="round"/>`;
}
/** A PRESS SWITCH: a round cap on a plate — up and red (0), pressed in and green (1). */
function pressSvg(on) {
  return `<path d="M7 0H15" ${LEAD}/>` +
    `<rect x="-7" y="-7" width="14" height="14" rx="2" fill="#d9d4c9" stroke="${INK}" stroke-width="0.5"/>` +
    `<circle cx="-4.9" cy="-4.9" r="0.6" fill="#8a837a"/><circle cx="4.9" cy="4.9" r="0.6" fill="#8a837a"/>` +
    `<circle cx="0" cy="0" r="5" fill="#2a2d31" stroke="${INK}" stroke-width="0.45"/>` +
    (on ? `<circle cx="0" cy="0" r="5" fill="${GREEN_ON}" opacity="0.3"/><circle cx="0" cy="0" r="3.5" fill="${GREEN_ON}" stroke="#1f8a3b" stroke-width="0.45"/>`
      : `<circle cx="0" cy="0.9" r="4.1" fill="#8f2622"/><circle cx="0" cy="-0.3" r="4.1" fill="${RED_ON}" stroke="#8f2622" stroke-width="0.45"/><path d="M-2.2 -2.2A3.2 3.2 0 0 1 1 -3.3" fill="none" stroke="#fff" stroke-width="0.6" stroke-linecap="round" opacity="0.7"/>`);
}
/**
 * A TOGGLE SWITCH, in the power switch's dress: a dark body with a track, the
 * knob slid to the 0 end and red when off, to the 1 end and green when on.
 */
function toggleSvg(on) {
  const x = on ? 2.9 : -2.9, lit = on ? GREEN_ON : RED_ON;
  return `<path d="M7 0H15" ${LEAD}/>` +
    `<rect x="-7" y="-7" width="14" height="14" rx="3" fill="#24272b" stroke="${INK}" stroke-width="0.5"/>` +
    `<rect x="-5.6" y="-2.9" width="11.2" height="5.8" rx="2.9" fill="#111315" stroke="${DARK}" stroke-width="0.4"/>` +
    `<circle cx="${x}" cy="0" r="4" fill="${lit}" opacity="0.3"/>` +
    `<circle cx="${x}" cy="0" r="2.5" fill="${lit}" stroke="#fffdf8" stroke-width="0.45"/>` +
    `<text x="-3.9" y="6" text-anchor="middle" ${MONO} font-size="2.5" font-weight="800" fill="${on ? DARK : RED_ON}">0</text>` +
    `<text x="3.9" y="6" text-anchor="middle" ${MONO} font-size="2.5" font-weight="800" fill="${on ? GREEN_ON : DARK}">1</text>`;
}
const inputSvg = (look, on) => (look === "press" ? pressSvg(on) : look === "toggle" ? toggleSvg(on) : powerSvg(on));
function switchSvg(name, on, look) {
  return inputSvg(look, on) + tag(-10.6, 1.6, name) +
    `<text x="0" y="11.2" text-anchor="middle" ${MONO} font-size="2.9" font-weight="700" fill="${on ? "#1f8a3b" : "#b3261e"}">${on ? 1 : 0}</text>`;
}

/** A lamp: glass, filament and a screw cap. */
function lampSvg(on) {
  const glass = on ? "#ffd84a" : "#f7f4ec";
  return `<path d="M-15 0H-6.5V5.4H-2.7" ${LEAD}/>` +
    (on ? `<circle cx="0" cy="-2.6" r="10.5" fill="#ffd84a" opacity="0.28"/><circle cx="0" cy="-2.6" r="8" fill="#ffd84a" opacity="0.35"/>` : "") +
    `<path d="M-2.7 3.4C-2.7 1.4 -5.6 0 -5.6 -3A5.6 5.6 0 0 1 5.6 -3C5.6 0 2.7 1.4 2.7 3.4Z" fill="${glass}" stroke="${on ? "#b97f00" : INK}" stroke-width="0.5" stroke-linejoin="round"/>` +
    `<path d="M-1.5 3.4V-0.6L-0.8 -2.6L0 -0.9L0.8 -2.6L1.5 -0.6V3.4" fill="none" stroke="${on ? "#b85c00" : "#8a837a"}" stroke-width="0.4" stroke-linejoin="round"/>` +
    `<rect x="-2.7" y="3.4" width="5.4" height="4" rx="0.5" fill="#a9afb5" stroke="${INK}" stroke-width="0.45"/>` +
    `<path d="M-2.7 4.8H2.7M-2.7 6.1H2.7" stroke="${INK}" stroke-width="0.3"/>` +
    `<path d="M-1.4 7.4H1.4L0.8 8.6H-0.8Z" fill="${INK}"/>`;
}
/** A speaker: a box and a cone; sounding, rings of sound leave it — and it is heard (toneOn). */
function speakerSvg(on) {
  const wave = (r) => `<path d="M${4.2 + r * 0.5} ${-r}A${r * 1.25} ${r * 1.25} 0 0 1 ${4.2 + r * 0.5} ${r}" fill="none" stroke="#d98c00" stroke-width="0.7" stroke-linecap="round"/>`;
  return `<path d="M-15 0H-6.4" ${LEAD}/>` +
    `<rect x="-6.4" y="-3.2" width="4" height="6.4" rx="0.6" fill="#5d646b" stroke="${INK}" stroke-width="0.45"/>` +
    `<path d="M-2.4 -3.2L3 -7.2V7.2L-2.4 3.2Z" fill="${on ? "#ffd84a" : "#c9ced3"}" stroke="${INK}" stroke-width="0.45" stroke-linejoin="round"/>` +
    (on ? `<g class="lb-sound">${wave(2.4)}${wave(4.4)}${wave(6.4)}</g>` : `<path d="M5 -2.6L8.4 2.6M8.4 -2.6L5 2.6" stroke="#8a837a" stroke-width="0.6" stroke-linecap="round"/>`);
}
/** A fan: three blades in a guard; running, it spins. */
function fanSvg(on) {
  const blade = (a) => `<path d="M0 0C-2.6 -1.6 -3 -5.4 0 -6.6C2.2 -5.6 2 -2.2 0 0Z" fill="${on ? "#58a6e0" : "#aeb6bd"}" stroke="${INK}" stroke-width="0.35" stroke-linejoin="round" transform="rotate(${a})"/>`;
  return `<path d="M-15 0H-7.6" ${LEAD}/>` +
    `<circle cx="0" cy="0" r="7.6" fill="#f7f4ec" stroke="${INK}" stroke-width="0.5"/>` +
    /* turned by the SVG itself, about the hub at (0, 0): a CSS turn goes about the middle of the blades' box, which is not the hub, and the fan wobbles */
    `<g>${on ? `<animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="0.28s" repeatCount="indefinite"/>` : ""}${blade(0)}${blade(120)}${blade(240)}<circle cx="0" cy="0" r="1.3" fill="${INK}"/></g>` +
    `<path d="M-2.2 7.3L-3.4 9H3.4L2.2 7.3" fill="#a9afb5" stroke="${INK}" stroke-width="0.4" stroke-linejoin="round"/>`;
}
const outputSvg = (look, on) => (look === "speaker" ? speakerSvg(on) : look === "fan" ? fanSvg(on) : lampSvg(on));
/** The output with its name and what it is doing. q is 1, 0 or null. */
function bulbSvg(q, look) {
  const on = q === 1;
  return outputSvg(look, on) + tag(11.6, -1.2, "Q", 4.4) +
    `<text x="11.6" y="4" text-anchor="middle" ${MONO} font-size="3.6" font-weight="700" fill="${on ? "#b97f00" : "#6f685f"}">${q == null ? "?" : q}</text>`;
}
/** A look as a chip for the tray. */
const lookChip = (look) => `<svg viewBox="-17 -10 34 20" aria-hidden="true">${INPUT_LOOKS.includes(look) ? inputSvg(look, false) : outputSvg(look, false)}</svg>`;

/** Where a part's pins are, on the workspace. */
function pinsOf(p) {
  const out = givesOut(p.kind) ? [{ pin: "out", x: p.x + 15, y: p.y }] : [];
  const n = insOf(p);
  if (p.kind === "DISP") return Array.from({ length: n }, (_, k) => ({ pin: k, x: p.x - 15, y: p.y + dispY(n, k) }));
  const ins = n === 2 ? [{ pin: 0, x: p.x - 15, y: p.y - 3.4 }, { pin: 1, x: p.x - 15, y: p.y + 3.4 }] : n === 1 ? [{ pin: 0, x: p.x - 15, y: p.y }] : [];
  return [...ins, ...out];
}
const pinAt = (st, id, pin) => { const p = st.parts.find((q) => q.id === id); return p ? pinsOf(p).find((q) => q.pin === pin) : null; };
const cable = (a, b) => { const d = Math.max(9, Math.abs(b.x - a.x) * 0.5); return `M${a.x} ${a.y}C${a.x + d} ${a.y} ${b.x - d} ${b.y} ${b.x} ${b.y}`; };

/** Everything on the workspace. `live`: the values, when it is being tested. */
function scene(st, { live = null, armed = null, rubber = null, lifted = null } = {}) {
  let parts = "", wires = "", pins = "";
  for (const p of st.parts) {
    const body = p.kind === "SW" ? switchSvg(p.id, st.sw[p.id] === 1, p.look) : p.kind === "BULB" ? bulbSvg(live ? live.Q ?? null : null, p.look)
      : p.kind === "DISP" ? dispSvg(p, live ? live[p.id] ?? 0 : 0) : gateWithLegs(p.kind);
    const hit = p.kind === "DISP" ? `<rect x="-15" y="${(-dispH(p) / 2 - 1).toFixed(2)}" width="31" height="${(dispH(p) + 8).toFixed(2)}" fill="transparent"/>`
      : `<rect x="-15" y="-9.5" width="30" height="21" fill="transparent"/>`;
    parts += `<g class="lb-part${lifted === p.id ? " is-lifted" : ""}" data-part="${p.id}" data-kind="${p.kind}" transform="translate(${p.x} ${p.y})">${hit}${body}</g>`;
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
  /* after the gates: what an input and the output may be exchanged for */
  tray.insertAdjacentHTML("beforeend", `<span class="lb-tray__gap" aria-hidden="true"></span>` +
    [...INPUT_LOOKS, ...OUTPUT_LOOKS].map((k) => `<span class="lb-chip lb-chip--look" data-look="${k}" title="${LOOK_NAME[k]}">${lookChip(k)}</span>`).join("") +
    `<span class="lb-chip lb-chip--look" data-gate="DISP" title="decimal display">${chip("DISP")}</span>`);
  const board = wrap.querySelector(".lb-board");
  const svg = board.querySelector(".lb-space");
  svg.removeAttribute("aria-hidden");
  const say = document.createElement("p");
  say.className = "lb-say";
  wrap.appendChild(say);

  const names = LAYOUTS[cfg.layout].inputs;
  /* a speaker that is ON is heard: the tone runs for as long as it is */
  let tone = null;
  function sound(on) {
    if (on && !tone) tone = toneOn();
    else if (!on && tone) { toneOff(tone); tone = null; }
  }
  const hush = () => sound(false);
  document.addEventListener("visibilitychange", hush);
  function paint() {
    const live = runBuilt(st, st.sw);
    sound(live.Q === 1 && st.parts.find((p) => p.id === "Q")?.look === "speaker");
    svg.innerHTML = scene(st, { live, armed, rubber: drag?.rubber || null, lifted: drag?.kind === "part" && drag.moved ? drag.id : null });
    tray.querySelectorAll(".lb-chip").forEach((c) => c.classList.toggle("is-held", held === (c.dataset.gate || `look:${c.dataset.look}`)));
    board.classList.toggle("is-placing", !!held);
    if (flashing) return;
    const q = live.Q ?? null;
    say.textContent = held && held.startsWith("look:") ? (INPUT_LOOKS.includes(held.slice(5))
      ? `Tap the switch the ${LOOK_NAME[held.slice(5)]} is to replace — or an empty spot, for an extra switch.`
      : `Tap the output the ${LOOK_NAME[held.slice(5)]} is to replace.`)
      : held ? `Tap the workspace where the ${held === "DISP" ? "display" : `${held} gate`} should go.`
      : armed ? "Now tap the pin this wire goes to."
        : q == null ? "Drag gates onto the workspace, then drag from pin to pin to wire them. Tap a wire to cut it; drag a gate off to remove it."
          : `Switches ${names.map((n) => `${n} = ${st.sw[n]}`).join(", ")}: the ${outName()} is ${q ? "ON (1)" : "off (0)"}.`;
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
  const clamp = (p, half = 9.5) => ({ x: Math.min(W - 16, Math.max(16, Math.round(p.x * 2) / 2)), y: Math.min(Math.max(half, H - half), Math.max(Math.min(half, H / 2), Math.round(p.y * 2) / 2)) });
  /* the switches and the output the question came with: they can be moved and exchanged, never removed */
  const FIXED = new Set([...LAYOUTS[cfg.layout].inputs, "Q"]);

  function addGate(kind, where) {
    const pre = kind === "DISP" ? "d" : "g";
    let n = 1;
    while (st.parts.some((p) => p.id === `${pre}${n}`)) n++;
    const part = kind === "DISP" ? { id: `d${n}`, kind, bits: 4 } : { id: `g${n}`, kind };
    change(() => { st.parts.push({ ...part, ...clamp(where, halfOf(part)) }); held = null; });
  }
  /** An extra switch, to feed a display with: the next free letter. */
  function addSwitch(look, where) {
    const id = "DEFGHIJKLMNOP".split("").find((c) => !st.parts.some((p) => p.id === c));
    if (!id) { held = null; flash("That is as many switches as the workspace holds."); return; }
    change(() => { st.parts.push({ id, kind: "SW", look, ...clamp(where) }); st.sw[id] = 0; held = null; });
  }
  /** A display's pins: one more, or one fewer (and the wire on a pin that goes, goes with it). */
  function resize(id, by) {
    const p = st.parts.find((q) => q.id === id);
    const n = bitsOf(p) + by;
    if (n < 1 || n > MAX_BITS) { flash(n < 1 ? "A display needs at least one pin." : `A display has at most ${MAX_BITS} pins.`); return; }
    change(() => {
      p.bits = n;
      st.wires = st.wires.filter((w) => !(w.to === id && w.pin >= n));
      Object.assign(p, clamp(p, halfOf(p)));
    });
  }
  const outName = () => st.parts.find((p) => p.id === "Q")?.look || "bulb";
  /** Exchange a switch or the output for another kind: same place, same wires. */
  function exchange(id, look) {
    const p = st.parts.find((q) => q.id === id);
    const fits = p && (p.kind === "SW" ? INPUT_LOOKS : p.kind === "BULB" ? OUTPUT_LOOKS : []).includes(look);
    if (!fits) { held = null; flash(INPUT_LOOKS.includes(look) ? `A ${LOOK_NAME[look]} goes in place of a switch: drop it on A or B.` : `A ${LOOK_NAME[look]} goes in place of the output: drop it on Q.`); return; }
    if ((p.look || (p.kind === "SW" ? "power" : "bulb")) === look) { held = null; paint(); return; }
    change(() => { p.look = look; held = null; });
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
      drag = { kind: "new", gate: c.dataset.gate || null, look: c.dataset.look || null, x: e.clientX, y: e.clientY, ghost: null, moved: false };
      return;
    }
    if (!board.contains(e.target)) return;
    const pin = e.target.closest?.("[data-pin]");
    const wire = e.target.closest?.("[data-wire]");
    const part = e.target.closest?.("[data-part]");
    const bits = e.target.closest?.("[data-bits]");
    if (bits && part) {
      e.preventDefault();
      resize(part.dataset.part, Number(bits.dataset.bits));
    } else if (pin) {
      e.preventDefault();
      const [id, p] = pin.dataset.pin.split(":");
      const a = pinAt(st, id, p === "out" ? "out" : Number(p));
      drag = { kind: "wire", pin: pin.dataset.pin, a, x: e.clientX, y: e.clientY, moved: false, rubber: null };
    } else if (wire) {
      drag = { kind: "cut", i: Number(wire.dataset.wire), x: e.clientX, y: e.clientY, moved: false };
    } else if (part && held && held.startsWith("look:")) {
      exchange(part.dataset.part, held.slice(5));
    } else if (part) {
      e.preventDefault();
      const p = st.parts.find((q) => q.id === part.dataset.part);
      const m = at(e);
      drag = { kind: "part", id: p.id, dx: p.x - m.x, dy: p.y - m.y, x: e.clientX, y: e.clientY, moved: false, before: clone(st) };
    } else if (held && held.startsWith("look:")) {
      if (INPUT_LOOKS.includes(held.slice(5))) addSwitch(held.slice(5), at(e));
      else exchange(null, held.slice(5));
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
        g.innerHTML = drag.look ? lookChip(drag.look) : chip(drag.gate);
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
      Object.assign(p, clamp({ x: m.x + drag.dx, y: m.y + drag.dy }, halfOf(p)));
      paint();
    }
  };
  const up = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    d.ghost?.remove();
    if (d.kind === "new") {
      const what = d.look ? `look:${d.look}` : d.gate;
      if (!d.moved) { held = held === what ? null : what; armed = null; paint(); return; }
      const m = at(e);
      if (d.look) {
        /* dropped on the switch or the output it replaces — or the nearest one that it fits */
        const under = document.elementFromPoint(e.clientX, e.clientY)?.closest?.("[data-part]")?.dataset.part || null;
        const role = INPUT_LOOKS.includes(d.look) ? "SW" : "BULB";
        const near = m.inside ? st.parts.filter((p) => p.kind === role).sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))[0] : null;
        const hit = st.parts.find((p) => p.id === under && p.kind === role) || (near && Math.hypot(near.x - m.x, near.y - m.y) < 18 ? near : null);
        if (!hit && !under && m.inside && role === "SW") addSwitch(d.look, m);
        else exchange(hit ? hit.id : under, d.look);
      } else if (m.inside) addGate(d.gate, m); else paint();
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
      if (!at(e).inside && !FIXED.has(p.id)) {
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
      hush();
      document.removeEventListener("visibilitychange", hush);
      wrap.classList.remove("is-live");
      wrap.innerHTML = printed;
    },
  };
}
