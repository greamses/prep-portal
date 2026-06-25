/* ============================================================================
   Cartesian Art — coordinate text parsing
   ----------------------------------------------------------------------------
   Lets admins type or paste coordinates instead of clicking. Two shapes of
   input are understood:
     • A plain point list for one shape: "(-4,-11), (-6,-6), (-7,4)"
     • The worksheet format, one shape ("Line") per line, each with a colour
       spec: "Line 1 {Orange with light yellow fill}: (-4,-11), (-6,-6), …"
   Colour words map onto the studio palette so a pasted picture comes in already
   coloured. Everything is forgiving about spacing, brackets and separators.
   ========================================================================== */

/* Named colours → palette (and a few lighter tints not in the dot palette). */
const COLORS = {
  red: "#f07a7a",
  orange: "#f0a868",
  "light orange": "#f6c69a",
  yellow: "#f4c95d",
  "light yellow": "#f8e6a8",
  gold: "#f4c95d",
  green: "#7cc47c",
  "light green": "#aedcae",
  turquoise: "#6fd0c0",
  teal: "#6fd0c0",
  cyan: "#6fd0c0",
  blue: "#6fb7e8",
  "light blue": "#a7d4f2",
  indigo: "#8aa0e8",
  purple: "#b89ae8",
  violet: "#b89ae8",
  pink: "#f29ec4",
  brown: "#b08968",
  black: "#2a2723",
  white: "#fffdf8",
  grey: "#b8b2a6",
  gray: "#b8b2a6",
};

/** Resolve a colour phrase ("light yellow", "orange") to a hex, or null. */
export function colorFromWords(phrase) {
  if (!phrase) return null;
  const p = phrase.toLowerCase().replace(/\bfill\b/g, "").replace(/\bcolou?r\b/g, "").trim();
  if (!p) return null;
  if (COLORS[p]) return COLORS[p];
  // try two-word then single-word keys found anywhere in the phrase
  const words = p.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const two = words[i] + " " + words[i + 1];
    if (COLORS[two]) return COLORS[two];
  }
  for (const w of words) if (COLORS[w]) return COLORS[w];
  return null;
}

/** Split a "{...}" spec into { strokeColor, fillColor }. */
export function parseColorSpec(spec) {
  if (!spec) return { strokeColor: null, fillColor: null };
  const s = spec.toLowerCase().trim();
  if (s.includes(" with ")) {
    const [a, b] = s.split(" with ");
    return { strokeColor: colorFromWords(a), fillColor: colorFromWords(b) };
  }
  if (/\bfill\b/.test(s)) {
    // "turquoise fill" → fill only
    return { strokeColor: null, fillColor: colorFromWords(s) };
  }
  return { strokeColor: colorFromWords(s), fillColor: null };
}

/** Pull every (x, y) pair out of a string. Tolerant of brackets / separators. */
export function parsePoints(text) {
  const pts = [];
  const re = /\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    pts.push({ x: +m[1], y: +m[2] }); // keep fractional coordinates
  }
  return pts;
}

/** Parse a whole worksheet (or a single point list) into an array of shapes:
 *  [{ points:[{x,y}], closed, fillColor, strokeColor }]. A shape is treated as
 *  closed when its last point repeats the first. */
export function parseWorksheet(text) {
  const shapes = [];
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // If there are no "Line"/"Shape" labels at all, treat the whole blob as one shape.
  const labelled = lines.some((l) => /^(line|shape)\b/i.test(l) || /\{[^}]*\}/.test(l));
  const groups = labelled ? lines : [lines.join(" ")];

  for (const raw of groups) {
    const specMatch = raw.match(/\{([^}]*)\}/);
    const { strokeColor, fillColor } = parseColorSpec(specMatch ? specMatch[1] : "");
    // strip any "Line N {…}:" prefix before reading points
    const body = raw.replace(/^[^:(]*:/, "").replace(/\{[^}]*\}/, "");
    const points = parsePoints(body);
    if (points.length < 2) continue;
    let closed = false;
    const f = points[0], l = points[points.length - 1];
    if (points.length > 2 && f.x === l.x && f.y === l.y) {
      points.pop(); // drop the duplicate closing vertex
      closed = true;
    }
    shapes.push({ points, closed, fillColor, strokeColor });
  }
  return shapes;
}
