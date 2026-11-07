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

  /* ── the everyday world, for word problems and stories ── */
  person: {
    w: 60, h: 132,
    parts: () => ({
      legs: { cx: 22, cy: 108, svg: F(rect(18, 78, 10, 44), "#4a5a78") + F(rect(32, 78, 10, 44), "#4a5a78") + L("M18 78V122H28V78M32 78V122H42V78") + F("M14 122H29V128H14Z", INK) + F("M31 122H46V128H31Z", INK) },
      body: { cx: 46, cy: 52, svg: F("M18 30H42L45 80H15Z", "#5b8fd6") + L("M18 30H42L45 80H15Z") },
      arms: { cx: 54, cy: 60, svg: L("M19 34L8 66M41 34L52 66", INK, 4.5) },
      head: { cx: 30, cy: 14, svg: F(circ(30, 15, 12), "#e8b98a") + L(circ(30, 15, 12)) + F(circ(26, 14, 1.6), INK) + F(circ(34, 14, 1.6), INK) + L("M26 20Q30 23 34 20", INK, 1.8) },
    }),
  },
  tree: {
    w: 100, h: 132,
    parts: () => ({
      trunk: { cx: 58, cy: 104, svg: F("M43 70H57L60 126H40Z", "#8a5a3a") + L("M43 70L40 126H60L57 70") },
      roots: { cx: 76, cy: 128, svg: L("M41 124Q32 128 24 130M59 124Q68 128 76 130", "#6b4630", 3) },
      leaves: { cx: 14, cy: 38, svg: F("M50 6C72 6 88 20 86 38C98 46 96 68 80 74C70 86 30 86 20 74C4 68 2 46 14 38C12 20 28 6 50 6Z", "#7cc46a") + L("M50 6C72 6 88 20 86 38C98 46 96 68 80 74C70 86 30 86 20 74C4 68 2 46 14 38C12 20 28 6 50 6Z", "#3f8f3f") },
    }),
  },
  house: {
    w: 120, h: 110,
    parts: () => ({
      walls: { cx: 104, cy: 90, svg: F(rect(15, 46, 90, 61), "#f3e1c4") + L(rect(15, 46, 90, 61)) },
      roof: { cx: 96, cy: 30, svg: F("M6 49L60 7L114 49Z", "#c25454") + L("M6 49L60 7L114 49Z") },
      chimney: { cx: 88, cy: 16, svg: F(rect(82, 14, 12, 20), "#9a6b4b") + L("M82 30V14H94V24") },
      door: { cx: 60, cy: 88, svg: F(rect(50, 72, 20, 35), "#8a5a3a") + L(rect(50, 72, 20, 35)) + F(circ(65, 90, 1.8), INK) },
      window: { cx: 33, cy: 66, svg: F(rect(24, 58, 18, 16), "#9fd0f5") + L(rect(24, 58, 18, 16)) + L("M33 58V74M24 66H42", INK, 2) + F(rect(78, 58, 18, 16), "#9fd0f5") + L(rect(78, 58, 18, 16)) + L("M87 58V74M78 66H96", INK, 2) },
    }),
  },
  car: {
    w: 140, h: 72,
    parts: (on) => {
      const body = "M8 46Q8 34 20 32L40 30L56 12H100L116 30H128Q136 32 136 46V56H8Z";
      const p = {
        body: { cx: 128, cy: 48, svg: F(body, "#e35d5d") + L(body) },
        windows: { cx: 70, cy: 22, svg: F("M60 16H78V30H48Z", "#d6ecf7") + L("M60 16H78V30H48Z", INK, 2.5) + F("M82 16H98L110 30H82Z", "#d6ecf7") + L("M82 16H98L110 30H82Z", INK, 2.5) },
        wheels: { cx: 34, cy: 58, svg: F(circ(34, 58, 12), INK) + F(circ(34, 58, 5), "#c3c8cd") + F(circ(110, 58, 12), INK) + F(circ(110, 58, 5), "#c3c8cd") },
        headlight: { cx: 133, cy: 40, svg: F(circ(132, 40, 3.5), "#f6d55c") },
      };
      if (on) p.exhaust = { cx: 2, cy: 50, svg: L("M6 50Q0 46 -6 50T-18 50", "#9aa0a6", 2.5) };
      return p;
    },
  },
  sun: {
    w: 100, h: 100,
    parts: () => ({
      sun: { cx: 50, cy: 50, svg: F(circ(50, 50, 24), "#f6c544") + L(circ(50, 50, 24), "#e5801a", 3) },
      rays: { cx: 92, cy: 50, svg: L("M50 4V16M50 84V96M4 50H16M84 50H96M17 17L26 26M74 74L83 83M83 17L74 26M26 74L17 83", "#e5801a", 4) },
    }),
  },
  cloud: {
    w: 120, h: 96,
    parts: (on) => {
      const c = "M28 62C12 62 6 50 12 40C10 26 26 18 38 24C44 8 70 6 78 22C92 16 108 26 104 40C116 44 114 62 98 62Z";
      const p = { cloud: { cx: 60, cy: 30, svg: F(c, "#eef2f5") + L(c, "#7d848b", 3) } };
      if (on) p.rain = { cx: 60, cy: 86, svg: L("M30 70L26 82M50 70L46 82M70 70L66 82M90 70L86 82M40 84L36 94M60 84L56 94M80 84L76 94", "#5a9bd0", 3) };
      return p;
    },
  },
  flower: {
    w: 70, h: 132,
    parts: () => ({
      stem: { cx: 35, cy: 100, svg: L("M35 50V128", "#3f8f3f", 4) },
      leaf: { cx: 52, cy: 92, svg: F("M36 96Q50 78 62 84Q52 100 36 96Z", "#7cc46a") + L("M36 96Q50 78 62 84Q52 100 36 96Z", "#3f8f3f", 2.5) },
      petals: { cx: 56, cy: 18, svg: [[35, 12], [53, 25], [46, 46], [24, 46], [17, 25]].map(([x, y]) => F(circ(x, y, 12), "#f5a7b8") + L(circ(x, y, 12), "#c25484", 2.5)).join("") },
      centre: { cx: 35, cy: 30, svg: F(circ(35, 30, 9), "#f6c544") + L(circ(35, 30, 9), "#b88a2a", 2.5) },
    }),
  },
  leaf: {
    w: 110, h: 70,
    parts: () => ({
      "leaf blade": { cx: 60, cy: 12, svg: F("M14 35C36 2 84 2 104 35C84 68 36 68 14 35Z", "#7cc46a") + L("M14 35C36 2 84 2 104 35C84 68 36 68 14 35Z", "#3f8f3f") },
      midrib: { cx: 60, cy: 35, svg: L("M14 35H100", "#2f6f2f", 2.5) },
      veins: { cx: 76, cy: 22, svg: L("M36 35L46 20M56 35L66 18M76 35L84 21M36 35L46 50M56 35L66 52M76 35L84 49", "#2f6f2f", 2) },
      petiole: { cx: 6, cy: 38, svg: L("M14 35L0 42", "#3f8f3f", 4) },
    }),
  },
  mountain: {
    w: 140, h: 90,
    parts: () => ({
      mountain: { cx: 30, cy: 70, svg: F("M4 86L48 20L70 46L92 14L136 86Z", "#a7b3be") + L("M4 86L48 20L70 46L92 14L136 86Z") },
      peak: { cx: 92, cy: 14, svg: F("M92 14L104 33L96 30L89 35L82 29Z", "#fff") + L("M82 29L89 35L96 30L104 33", INK, 2) },
    }),
  },
  fish: {
    w: 124, h: 64,
    parts: () => ({
      body: { cx: 50, cy: 54, svg: F("M10 32C30 6 80 6 96 32C80 58 30 58 10 32Z", "#f7a35c") + L("M10 32C30 6 80 6 96 32C80 58 30 58 10 32Z") },
      tail: { cx: 114, cy: 32, svg: F("M94 32L120 12V52Z", "#e5801a") + L("M94 32L120 12V52Z") },
      fin: { cx: 54, cy: 8, svg: F("M44 14Q56 0 70 12Z", "#e5801a") + L("M44 14Q56 0 70 12", INK, 2.5) },
      gills: { cx: 32, cy: 32, svg: L("M32 20Q38 32 32 44", INK, 2.5) },
      eye: { cx: 22, cy: 28, svg: F(circ(22, 28, 3.5), INK) },
    }),
  },
  bird: {
    w: 110, h: 80,
    parts: () => ({
      body: { cx: 54, cy: 62, svg: F("M28 44C34 28 70 26 84 40C78 58 42 62 28 44Z", "#5b8fd6") + L("M28 44C34 28 70 26 84 40C78 58 42 62 28 44Z") },
      wing: { cx: 56, cy: 22, svg: F("M44 40Q58 8 76 18Q68 36 50 44Z", "#3d6fb8") + L("M44 40Q58 8 76 18Q68 36 50 44Z", INK, 2.5) },
      head: { cx: 92, cy: 26, svg: F(circ(88, 34, 10), "#5b8fd6") + L(circ(88, 34, 10)) + F(circ(91, 31, 2), INK) },
      beak: { cx: 106, cy: 36, svg: F("M97 31L108 36L97 39Z", "#f6c544") + L("M97 31L108 36L97 39Z", INK, 2) },
      tail: { cx: 12, cy: 40, svg: F("M30 44L8 34L12 50Z", "#3d6fb8") + L("M30 44L8 34L12 50Z", INK, 2.5) },
      legs: { cx: 58, cy: 74, svg: L("M50 54L48 72M62 54L64 72", INK, 2.5) },
    }),
  },
  ball: {
    w: 60, h: 60,
    parts: () => ({ ball: { cx: 30, cy: 30, svg: F(circ(30, 30, 26), "#fff") + L(circ(30, 30, 26)) + F("M30 18L41 26L37 39H23L19 26Z", INK) + L("M30 18V5M41 26L54 22M37 39L45 50M23 39L15 50M19 26L6 22", INK, 2.5) } }),
  },
  "water drop": {
    w: 52, h: 72,
    parts: () => ({ drop: { cx: 26, cy: 46, svg: F("M26 4C37 22 47 34 47 47A21 21 0 0 1 5 47C5 34 15 22 26 4Z", "#9fd0f5") + L("M26 4C37 22 47 34 47 47A21 21 0 0 1 5 47C5 34 15 22 26 4Z", "#2e6ea3") + L("M15 46Q15 38 21 33", "#fff", 3) } }),
  },
  apple: {
    w: 72, h: 80,
    parts: () => ({
      apple: { cx: 36, cy: 50, svg: F("M36 22C22 12 4 20 6 42C8 64 22 78 36 72C50 78 64 64 66 42C68 20 50 12 36 22Z", "#e35d5d") + L("M36 22C22 12 4 20 6 42C8 64 22 78 36 72C50 78 64 64 66 42C68 20 50 12 36 22Z") },
      stalk: { cx: 38, cy: 10, svg: L("M36 22Q36 10 42 4", "#6b4630", 3.5) },
      leaf: { cx: 52, cy: 10, svg: F("M40 12Q52 0 62 8Q52 18 40 12Z", "#7cc46a") + L("M40 12Q52 0 62 8Q52 18 40 12Z", "#3f8f3f", 2) },
    }),
  },
  ladder: {
    w: 50, h: 140,
    parts: () => ({
      rails: { cx: 6, cy: 70, svg: L("M8 4V136M42 4V136", "#8a5a3a", 5) },
      rungs: { cx: 25, cy: 40, svg: L([20, 40, 60, 80, 100, 120].map((y) => `M8 ${y}H42`).join(""), "#8a5a3a", 4) },
    }),
  },
  wall: {
    w: 60, h: 150,
    parts: () => ({ wall: { cx: 30, cy: 75, svg: F(rect(4, 4, 52, 142), "#e7c9a8") + L(rect(4, 4, 52, 142)) + L(Array.from({ length: 9 }, (_, i) => `M4 ${20 + i * 15}H56`).join("") + Array.from({ length: 10 }, (_, i) => `M${i % 2 ? 22 : 38} ${5 + i * 15}V${19 + i * 15}`).join(""), "#9a6b4b", 1.8) } }),
  },
  "plant pot": {
    w: 80, h: 120,
    parts: () => ({
      pot: { cx: 72, cy: 100, svg: F("M10 74H70L62 116H18Z", "#c8692b") + L("M10 74H70L62 116H18Z") + F(rect(6, 68, 68, 10), "#d98a4b") + L(rect(6, 68, 68, 10)) },
      soil: { cx: 40, cy: 70, svg: F(rect(10, 66, 60, 4), "#6b4630") },
      stem: { cx: 40, cy: 50, svg: L("M40 66V24", "#3f8f3f", 4) },
      leaves: { cx: 62, cy: 30, svg: F("M40 44Q24 26 10 34Q22 50 40 44Z", "#7cc46a") + L("M40 44Q24 26 10 34Q22 50 40 44Z", "#3f8f3f", 2.5) + F("M40 32Q56 12 70 20Q58 38 40 32Z", "#7cc46a") + L("M40 32Q56 12 70 20Q58 38 40 32Z", "#3f8f3f", 2.5) },
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
  man: "person", woman: "person", boy: "person", girl: "person", child: "person", human: "person", pupil: "person", student: "person",
  home: "house", building: "house", vehicle: "car", taxi: "car", bus: "car",
  raindrop: "water drop", drop: "water drop", droplet: "water drop", "rain cloud": "cloud",
  football: "ball", "soccer ball": "ball", hill: "mountain", plant: "plant pot", "potted plant": "plant pot", bricks: "wall",
};
export function objectNamed(name) {
  const n = String(name || "").toLowerCase().replace(/[^a-z -]/g, "").replace(/\s+/g, " ").trim();
  const key = OBJECTS[n] ? n : ALIAS[n] || (OBJECTS[n.replace(/s$/, "")] ? n.replace(/s$/, "") : null);
  return key ? { key, ...OBJECTS[key] } : null;
}
