/* ============================================================================
   PrepBoard — everyday OBJECTS it can draw
   ----------------------------------------------------------------------------
   Asked to draw a light bulb free-hand, a model draws something nobody would
   call a bulb. These are drawn properly once, part by part, the way a teacher
   draws them on a board: a bulb, a battery, a switch, a beaker, a Bunsen
   burner… PrepBot places one with {"op":"object","name":"bulb","at":[5,5]},
   lights it ("active"), labels its parts, or builds it up a part at a time
   ("steps"), exactly like a diagram.

   Each object: { w, h, parts(active) → { name: { svg, cx, cy } } } in its own
   units (y down). In `svg`, "k-line" elements are traced by the pencil and
   "k-fill" ones laid in after (as in kits.js).
   ========================================================================== */

const INK = "#2a2723";
const L = (d, c = INK, w = 3.5) => `<path class="k-line" d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const F = (d, c, o = 1) => `<path class="k-fill" d="${d}" fill="${c}" opacity="${o}" stroke="none"/>`;
const rect = (x, y, w, h) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
const circ = (cx, cy, r) => `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;
const T = (x, y, t, size = 18, c = INK) => `<text class="k-fill" x="${x}" y="${y}" font-size="${size}" font-family="JetBrains Mono, monospace" font-weight="700" text-anchor="middle" fill="${c}">${t}</text>`;

export const OBJECTS = {
  bulb: {
    w: 100, h: 110,
    parts: (on) => {
      const glass = "M50 6C76 6 90 24 90 44C90 60 78 68 71 78L70 84H30L29 78C22 68 10 60 10 44C10 24 24 6 50 6Z";
      const p = {
        "glass bulb": { cx: 20, cy: 30, svg: F(glass, on ? "#fff1a8" : "#eaf4fa", 0.95) + L(glass) },
        "support wires": { cx: 42, cy: 72, svg: L("M42 84V56M58 84V56", "#6b6b6b", 3) },
        filament: { cx: 50, cy: 54, svg: L("M42 56Q44 47 46 56T50 56T54 56T58 56", on ? "#e5801a" : "#7a5a3a", 3.2) },
        "screw base": { cx: 70, cy: 92, svg: F(rect(30, 84, 40, 16), "#c3c8cd") + L(rect(30, 84, 40, 16)) + L("M30 89.5H70M30 95H70", "#7d848b", 2.5) },
        contact: { cx: 50, cy: 106, svg: F("M40 100H60L55 108H45Z", "#3b3b3b") + L("M40 100H60L55 108H45Z") },
      };
      if (on) p.light = { cx: 92, cy: 6, svg: L("M50 -12V-3M86 0L80 6M14 0L20 6M106 40H98M-6 40H2M98 72L92 68M2 72L8 68", "#e9b72f", 4) };
      return p;
    },
  },
  battery: {
    w: 60, h: 112,
    parts: () => ({
      casing: { cx: 52, cy: 66, svg: F(rect(10, 14, 40, 92), "#d9d9d9") + F(rect(10, 14, 40, 30), "#e9b72f") + L(rect(10, 14, 40, 92)) },
      "positive terminal": { cx: 30, cy: 6, svg: F(rect(22, 5, 16, 9), "#9aa0a6") + L(rect(22, 5, 16, 9)) + L("M30 22V36M23 29H37", INK, 3.2) },
      "negative terminal": { cx: 30, cy: 106, svg: L("M22 98H38", INK, 3.2) + L("M14 106H46", "#6b6b6b", 3) },
    }),
  },
  switch: {
    w: 120, h: 50,
    parts: (on) => ({
      base: { cx: 60, cy: 44, svg: F(rect(0, 34, 120, 14), "#dcc6a2") + L(rect(0, 34, 120, 14)) },
      terminals: { cx: 100, cy: 30, svg: F(circ(20, 30, 6), "#9aa0a6") + L(circ(20, 30, 6)) + F(circ(100, 30, 6), "#9aa0a6") + L(circ(100, 30, 6)) },
      lever: { cx: 58, cy: on ? 28 : 14, svg: L(on ? "M20 30L100 28" : "M20 30L94 4", INK, 5) },
    }),
  },
  magnet: {
    w: 140, h: 40,
    parts: () => ({
      "north pole": { cx: 20, cy: 20, svg: F(rect(0, 0, 70, 40), "#e35d5d") + L(rect(0, 0, 70, 40)) + T(35, 27, "N", 20, "#fff") },
      "south pole": { cx: 120, cy: 20, svg: F(rect(70, 0, 70, 40), "#5b8fd6") + L(rect(70, 0, 70, 40)) + T(105, 27, "S", 20, "#fff") },
    }),
  },
  beaker: {
    w: 90, h: 110,
    parts: () => ({
      beaker: { cx: 14, cy: 30, svg: L("M6 6Q12 8 14 14V100Q14 106 20 106H70Q76 106 76 100V8") },
      liquid: { cx: 45, cy: 82, svg: F("M14.5 50H75.5V100Q75.5 105.5 70 105.5H20Q14.5 105.5 14.5 100Z", "#9fd0f5", 0.85) + L("M15 50H75", "#5a9bd0", 2.5) },
      scale: { cx: 74, cy: 30, svg: L("M62 30H75M66 50H75M62 70H75M66 90H75", "#5a5a5a", 2) },
    }),
  },
  "test tube": {
    w: 40, h: 120,
    parts: () => ({
      "test tube": { cx: 8, cy: 40, svg: L("M8 4V100A12 12 0 0 0 32 100V4") + L("M3 4H37") },
      liquid: { cx: 20, cy: 96, svg: F("M8.5 70V100A11.5 11.5 0 0 0 31.5 100V70Z", "#f5a7b8", 0.9) + L("M9 70H31", "#c25454", 2.2) },
    }),
  },
  flask: {
    w: 100, h: 110,
    parts: () => ({
      neck: { cx: 62, cy: 20, svg: L("M38 4V40L8 98Q6 106 14 106H86Q94 106 92 98L62 40V4") + L("M33 4H67") },
      liquid: { cx: 50, cy: 90, svg: F("M23 70H77L91 98Q93 105 86 105H14Q7 105 9 98Z", "#9fdc8f", 0.9) + L("M23 70H77", "#3f8f3f", 2.2) },
    }),
  },
  "bunsen burner": {
    w: 80, h: 132,
    parts: (on = true) => {
      const p = {
        base: { cx: 68, cy: 120, svg: F(rect(8, 114, 64, 14), "#8a8f95") + L(rect(8, 114, 64, 14)) },
        barrel: { cx: 48, cy: 70, svg: F(rect(32, 42, 16, 72), "#c3c8cd") + L(rect(32, 42, 16, 72)) },
        "air hole": { cx: 40, cy: 98, svg: F(circ(40, 98, 4.5), INK) },
        "gas tube": { cx: 76, cy: 122, svg: L("M72 121H80", "#c25454", 5) },
      };
      if (on) p.flame = { cx: 40, cy: 20, svg: F("M40 2C51 17 55 28 51 36Q40 45 29 36C25 28 29 17 40 2Z", "#8fbaf5", 0.95) + F("M40 15C45 23 46 30 40 35C34 30 35 23 40 15Z", "#2f6fd6") };
      return p;
    },
  },
  thermometer: {
    w: 34, h: 130,
    parts: () => ({
      tube: { cx: 8, cy: 30, svg: F("M10 10A7 7 0 0 1 24 10V100H10Z", "#f4f7f9") + L("M10 100V10A7 7 0 0 1 24 10V100") },
      bulb: { cx: 17, cy: 113, svg: F(circ(17, 113, 12), "#e35d5d") + L(circ(17, 113, 12)) },
      "liquid column": { cx: 17, cy: 72, svg: F(rect(14, 50, 6, 56), "#e35d5d") },
      scale: { cx: 30, cy: 30, svg: L("M24 20H30M24 35H28M24 50H30M24 65H28M24 80H30", "#5a5a5a", 2) },
    }),
  },
  "convex lens": {
    w: 50, h: 120,
    parts: () => ({ lens: { cx: 25, cy: 60, svg: F("M25 4Q48 60 25 116Q2 60 25 4Z", "#d6ecf7", 0.95) + L("M25 4Q48 60 25 116Q2 60 25 4Z") } }),
  },
  "concave lens": {
    w: 50, h: 120,
    parts: () => ({ lens: { cx: 25, cy: 60, svg: F("M8 4H42Q30 60 42 116H8Q20 60 8 4Z", "#d6ecf7", 0.95) + L("M8 4H42Q30 60 42 116H8Q20 60 8 4Z") } }),
  },
  prism: {
    w: 110, h: 100,
    parts: () => ({ prism: { cx: 55, cy: 64, svg: F("M55 4L106 96H4Z", "#e3f1f7", 0.95) + L("M55 4L106 96H4Z") } }),
  },
  candle: {
    w: 50, h: 120,
    parts: (on = true) => {
      const p = {
        wax: { cx: 38, cy: 80, svg: F(rect(12, 40, 26, 78), "#f7f1e1") + L(rect(12, 40, 26, 78)) },
        wick: { cx: 25, cy: 35, svg: L("M25 40V30", INK, 2.5) },
      };
      if (on) p.flame = { cx: 25, cy: 16, svg: F("M25 3C33 15 34 23 25 30C16 23 17 15 25 3Z", "#f6b93b") + F("M25 14C28 20 28 24 25 27C22 24 22 20 25 14Z", "#e5801a") };
      return p;
    },
  },
  resistor: {
    w: 120, h: 40,
    parts: () => ({
      leads: { cx: 6, cy: 20, svg: L("M0 20H25M95 20H120", "#6b6b6b", 3) },
      resistor: { cx: 60, cy: 8, svg: F(rect(25, 8, 70, 24), "#e7d3a8") + L(rect(25, 8, 70, 24)) + L("M40 8V32M52 8V32M64 8V32", "#c25454", 4) + L("M80 8V32", "#b88a2a", 4) },
    }),
  },
};

export const OBJECT_NAMES = Object.keys(OBJECTS);

/** The object by name, forgiving: "light bulb", "lamp", "cell", "Bunsen"… */
const ALIAS = {
  "light bulb": "bulb", lamp: "bulb", "electric bulb": "bulb", "incandescent bulb": "bulb",
  cell: "battery", "dry cell": "battery", batteries: "battery",
  bunsen: "bunsen burner", burner: "bunsen burner",
  "conical flask": "flask", "erlenmeyer flask": "flask",
  lens: "convex lens", "magnifying glass": "convex lens", "bar magnet": "magnet",
  testtube: "test tube", "test-tube": "test tube",
};
export function objectNamed(name) {
  const n = String(name || "").toLowerCase().replace(/[^a-z -]/g, "").replace(/\s+/g, " ").trim();
  const key = OBJECTS[n] ? n : ALIAS[n] || (OBJECTS[n.replace(/s$/, "")] ? n.replace(/s$/, "") : null);
  return key ? { key, ...OBJECTS[key] } : null;
}
