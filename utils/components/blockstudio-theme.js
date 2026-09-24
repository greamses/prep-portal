/* ============================================================================
   BLOCK STUDIOS — the blocks, in the site's colours
   ----------------------------------------------------------------------------
   The two studios (Sentence Studio, Game Studio) name a colour on every block
   they define — the Material palette they were written with: #1565C0 blue,
   #C62828 red, #2E7D32 green and so on. Blockly paints a block from that
   colour, so no stylesheet can reach it: by the time the SVG exists the fill
   is already decided.

   So this file is loaded BETWEEN Blockly and the block definitions, and wraps
   the one method every definition goes through. Each Material colour is
   translated to the pastel this site uses for the same idea (the badge
   palette in theme.css), and anything it does not recognise is simply washed
   out toward paper. Blocks then read as our sticky notes do: a soft colour
   with ink written on it — and blockstudio.css turns the block text to ink to
   match.

   One place, one map. A studio that adds a block in a new colour gets a
   sensible wash without anyone editing this file.
   ========================================================================== */

(function (global) {
  "use strict";

  /* Material (what the studios were written in) → ours (theme.css badges) */
  const MAP = {
    "#1565c0": "#bfe3ff", // blue    — structure, the page itself
    "#1976d2": "#bfe3ff",
    "#2196f3": "#cfe9ff",
    "#00897b": "#b8ece2", // teal    — text and content
    "#00bfa5": "#b8ece2",
    "#009688": "#b8ece2",
    "#2e7d32": "#c8f0c0", // green   — lists, loops, things that hold things
    "#388e3c": "#c8f0c0",
    "#43a047": "#d3f3cd",
    "#c62828": "#f6c9c4", // red     — links, events, the loud ones
    "#e53935": "#f6c9c4",
    "#d32f2f": "#f6c9c4",
    "#ad1457": "#f7cfe3", // pink    — figures of speech, flourishes
    "#c2185b": "#f7cfe3",
    "#7b1fa2": "#e8c8ff", // purple  — media, images
    "#6a1b9a": "#e8c8ff",
    "#8e24aa": "#efdcff",
    "#ffb800": "#fff3a8", // yellow  — the studio's own accent
    "#f9a825": "#fff3a8",
    "#fb8c00": "#ffd7a3", // orange  — attributes, style
    "#ff6000": "#ffd7a3",
    "#ef6c00": "#ffd7a3",
    "#455a64": "#dfe4e6", // slate   — plumbing
    "#607d8b": "#dfe4e6",
  };

  const hex = (n) => `#${Math.round(n).toString(16).padStart(2, "0")}`;

  /** A colour washed toward paper: still its own hue, soft enough for ink. */
  function wash(colour) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(colour).trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const mix = (c) => c + (0xff - c) * 0.62;
    return hex(mix((n >> 16) & 255)) + hex(mix((n >> 8) & 255)).slice(1) + hex(mix(n & 255)).slice(1);
  }

  /** hsv → hex, for the blocks that name a hue instead of a colour. */
  function fromHsv(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
      : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return hex((r + m) * 255) + hex((g + m) * 255).slice(1) + hex((b + m) * 255).slice(1);
  }

  /** The hue of a hex colour, 0–360 (0 when it is grey). */
  function hueOf(colour) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(colour).trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const r = ((n >> 16) & 255) / 255; const g = ((n >> 8) & 255) / 255; const b = (n & 255) / 255;
    const hi = Math.max(r, g, b); const lo = Math.min(r, g, b); const d = hi - lo;
    if (!d) return 0;
    const h = hi === r ? ((g - b) / d) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  }

  /** The pastel this site would use for that colour. */
  function ours(colour) {
    const key = String(colour ?? "").trim().toLowerCase();
    if (MAP[key]) return MAP[key];
    /* Blockly also takes a HUE ("250"), which is how a few blocks in the Game
       Studio are coloured; those came out loud while every hex block was
       soft, so they are washed the same way. */
    if (/^\d{1,3}$/.test(key)) return fromHsv(Number(key) % 360, 0.3, 0.98);
    if (!/^#[0-9a-f]{6}$/i.test(key)) return null;
    return wash(key);
  }

  /* The rail of categories is not a block: its glyphs are drawn in white, so
     its squares keep a mid-tone — one of the site's accents, by hue. */
  const ACCENTS = [
    [0, "#f07a7a"], [28, "#f0a868"], [48, "#f4c95d"], [95, "#7cc47c"],
    [165, "#5ec9bd"], [200, "#6fb7e8"], [265, "#b8a8e8"], [320, "#f0a8c9"],
  ];

  /** One of the site's accent colours, nearest in hue to what was asked for. */
  function accent(colour) {
    const h = hueOf(colour);
    if (h === null) return null;
    let best = ACCENTS[0];
    let gap = 999;
    for (const a of ACCENTS) {
      const d = Math.min(Math.abs(a[0] - h), 360 - Math.abs(a[0] - h));
      if (d < gap) { gap = d; best = a; }
    }
    return best[1];
  }

  function dress(Blockly) {
    const proto = Blockly && Blockly.Block && Blockly.Block.prototype;
    if (!proto || proto.__ppDressed) return false;
    const original = proto.setColour;
    proto.setColour = function (colour) {
      return original.call(this, ours(colour) || colour);
    };
    proto.__ppDressed = true;
    return true;
  }

  /* Blockly is a plain script tag above this one, so it is already here; the
     retry is only for a page that loads it late. */
  if (!dress(global.Blockly)) {
    let tries = 0;
    const t = setInterval(() => {
      if (dress(global.Blockly) || ++tries > 40) clearInterval(t);
    }, 50);
  }

  global.BlockStudioTheme = { ours, wash, accent, hueOf, MAP };
})(typeof window !== "undefined" ? window : globalThis);
