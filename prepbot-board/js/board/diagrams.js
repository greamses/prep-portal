/* ============================================================================
   PrepBot Board — the drawn diagrams it can call on
   ----------------------------------------------------------------------------
   A plant cell or the inside of a heart is too much to build out of circles
   while talking. The site already has these drawn, part by part, for the Vocab
   game's picture topics (data/vocab/…): the artwork and, for every named part,
   where it is. The board borrows them as they are — one source of truth — and
   PrepBot points at their parts by name ({"op":"label","on":"d1","part":…}).

   Each loads on first use (they are large). The credits travel with them and
   are shown under the drawing: three are CC-BY-SA and must be credited.
   ========================================================================== */

const SRC = {
  "plant-cell": "/data/vocab/cells/plant-cell.js",
  "animal-cell": "/data/vocab/cells/animal-cell.js",
  heart: "/data/vocab/organs/heart.js",
  brain: "/data/vocab/organs/brain.js",
  "brain-section": "/data/vocab/organs/brain-section.js",
  ear: "/data/vocab/organs/ear.js",
};
export const DIAGRAM_NAMES = Object.keys(SRC);

const cache = new Map();

/** Load a diagram (once): { w, h, art, parts:[{ name, cx, cy, arrow }], credit } */
export function loadDiagram(name) {
  if (!SRC[name]) return Promise.resolve(null);
  if (!cache.has(name)) {
    cache.set(name, import(SRC[name]).then((m) => {
      let art;
      if (m.SVG) art = m.SVG; // a shaded illustration, embedded whole
      else {
        /* flat regions: each part a filled path in its own colour, over the outline */
        const decor = m.DECOR ? `<path d="${m.DECOR}" fill="#f1e4d4" stroke="#2a2723" stroke-width="2.4"/>` : "";
        art = decor + m.PARTS.map((p) => `<path d="${p.d}" fill="${p.fill || "#e9d6c4"}" stroke="#2a2723" stroke-width="2" stroke-linejoin="round"/>`).join("");
      }
      const parts = m.PARTS.map((p) => ({
        name: p.name,
        cx: p.cx ?? p.spot?.cx,
        cy: p.cy ?? p.spot?.cy,
        arrow: p.arrow ? [p.arrow.x1, p.arrow.y1, p.arrow.x2, p.arrow.y2] : null,
      }));
      return { name, w: m.MAP_W, h: m.MAP_H, art, parts, credit: String(m.CREDIT || "").replace(/<[^>]+>/g, "") };
    }).catch(() => null));
  }
  return cache.get(name);
}

/** A diagram already loaded (or undefined) — the board builds synchronously. */
export function loadedDiagram(name) {
  let v;
  const p = cache.get(name);
  if (!p) return undefined;
  p.then((d) => { v = d; });
  return p.__value ?? v;
}

/* keep the resolved value on the promise, so it can be read synchronously later */
export async function ensureDiagrams(names) {
  await Promise.all([...new Set(names)].map(async (n) => {
    const p = loadDiagram(n);
    const d = await p;
    if (p) p.__value = d;
  }));
}

/** A part by name, forgiving of case, plural and "the". */
export function findPart(diagram, name) {
  const norm = (s) => String(s || "").toLowerCase().replace(/^the\s+/, "").replace(/[^a-z ]/g, "").replace(/s$/, "").trim();
  const want = norm(name);
  return diagram.parts.find((p) => norm(p.name) === want)
    || diagram.parts.find((p) => norm(p.name).includes(want) || want.includes(norm(p.name)));
}
