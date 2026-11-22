/* ============================================================================
   PrepBoard — the drawn diagrams it can call on
   ----------------------------------------------------------------------------
   A plant cell or the inside of a heart is too much to build out of circles
   while talking. The site already has these drawn, part by part, for the Vocab
   game's picture topics (data/vocab/…): the artwork and, for every named part,
   where it is. The board borrows them as they are — one source of truth — and
   PrepBot points at their parts by name ({"op":"label","on":"d1","part":…}).

   Each loads on first use (they are large). The credits travel with them and
   are shown under the drawing when a figure has one (the brain's outside view
   is CC-BY-SA). The ear, eye, heart and brain-section are TRACED from our own
   pictures (tools/figure-trace): one whole painting plus each part's real
   outline (`shape`), so they too can be drawn part by part.
   ========================================================================== */

const SRC = {
  "plant-cell": "/data/vocab/cells/plant-cell.js",
  "animal-cell": "/data/vocab/cells/animal-cell.js",
  heart: "/data/vocab/organs/heart.js",
  brain: "/data/vocab/organs/brain.js",
  "brain-section": "/data/vocab/organs/brain-section.js",
  ear: "/data/vocab/organs/ear.js",
  eye: "/data/vocab/organs/eye.js",
};
export const DIAGRAM_NAMES = Object.keys(SRC);
import { KITS } from "./kits.js";

const cache = new Map();

/** Load a diagram (once): { w, h, art, parts:[{ name, cx, cy, arrow }], credit } */
export function loadDiagram(name) {
  if (!SRC[name]) return Promise.resolve(null);
  if (!cache.has(name)) {
    cache.set(name, import(SRC[name]).then((m) => {
      let art;
      /* a traced figure: every part has its own outline over one painting */
      const traced = !!m.SVG && m.PARTS.every((p) => p.shape);
      const artId = `pb-art-${name}`;
      if (m.SVG) art = m.SVG; // a shaded illustration, embedded whole
      else {
        /* flat regions: each part a filled path in its own colour, over the outline */
        const decor = m.DECOR ? `<path d="${m.DECOR}" fill="#f1e4d4" stroke="#2a2723" stroke-width="2.4"/>` : "";
        art = decor + m.PARTS.map((p) => `<path d="${p.d}" fill="${p.fill || "#e9d6c4"}" stroke="#2a2723" stroke-width="2" stroke-linejoin="round"/>`).join("");
      }
      const parts = m.PARTS.map((p, i) => ({
        name: p.name,
        cx: p.cx ?? p.spot?.cx,
        cy: p.cy ?? p.spot?.cy,
        arrow: p.arrow ? [p.arrow.x1, p.arrow.y1, p.arrow.x2, p.arrow.y2] : null,
        /* a flat drawing's part can be drawn on its own: its outline, then its colour */
        svg: traced
          /* the pencil traces the part's outline, then the painting fills in
             inside it (one painting, defined once in `decor`, clipped per part) */
          ? `<clipPath id="${artId}-c${i}"><path d="${p.shape}"/></clipPath>`
            + `<g class="k-fill" clip-path="url(#${artId}-c${i})"><use href="#${artId}"/></g>`
            + `<path class="k-line" d="${p.shape}" fill="none" stroke="#2a2723" stroke-width="1.6" stroke-linejoin="round"/>`
          : !m.SVG && p.d ? `<path class="k-fill" d="${p.d}" fill="${p.fill || "#e9d6c4"}"/><path class="k-line" d="${p.d}" fill="none" stroke="#2a2723" stroke-width="2" stroke-linejoin="round"/>` : null,
      }));
      const decor = traced
        ? `<defs><g id="${artId}">${m.SVG}</g></defs>` // nothing shows until a part is named
        : !m.SVG && m.DECOR ? `<path class="k-line" d="${m.DECOR}" fill="#f1e4d4" stroke="#2a2723" stroke-width="2.4"/>` : "";
      return { name, w: m.MAP_W, h: m.MAP_H, art, parts, decor, credit: String(m.CREDIT || "").replace(/<[^>]+>/g, "") };
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

/* other names a teacher (or the model) uses for a part, and Latin plurals */
const ALIASES = {
  mitochondria: "mitochondrion", mitochondrias: "mitochondrion", powerhouse: "mitochondrion",
  nuclei: "nucleus", nucleoli: "nucleolus", vacuoles: "vacuole", "central vacuole": "vacuole", "sap vacuole": "vacuole",
  "golgi body": "golgi apparatus", golgi: "golgi apparatus", "golgi complex": "golgi apparatus",
  er: "rough endoplasmic reticulum", "endoplasmic reticulum": "rough endoplasmic reticulum", "rough er": "rough endoplasmic reticulum", "smooth er": "smooth endoplasmic reticulum",
  "plasma membrane": "cell membrane", membrane: "cell membrane", "cell surface membrane": "cell membrane",
  wall: "cell wall", grana: "thylakoid membrane", granum: "thylakoid membrane", thylakoid: "thylakoid membrane",
  starch: "starch grain", plasmodesmata: "plasmodesma", lysosomes: "lysosome", ribosomes: "ribosome", centrioles: "centrosome", centriole: "centrosome",
  chromosomes: "chromatin", dna: "chromatin", vesicles: "vesicle",
  /* the ear and eye's textbook names */
  auricle: "pinna", "outer ear": "pinna", "external auditory canal": "ear canal", "auditory canal": "ear canal",
  "tympanic membrane": "eardrum", "tympanic cavity": "middle ear", hammer: "malleus", anvil: "incus", stirrup: "stapes",
  ossicles: "malleus", "cochlear nerve": "auditory nerve", "vestibular nerve": "auditory nerve", "vestibulocochlear nerve": "auditory nerve",
  "eustachian tube": "Eustachian tube", "auditory tube": "Eustachian tube",
  eyelid: "eyelids", "aqueous humor": "aqueous humour", "vitreous humor": "vitreous humour", vitreous: "vitreous humour",
  "eye muscle": "eye muscles", "white of the eye": "sclera",
};
/** A part by name, forgiving of case, plural, "the" and other names for it. */
export function findPart(diagram, name) {
  const norm = (s) => String(s || "").toLowerCase().replace(/^the\s+/, "").replace(/[^a-z ]/g, "").replace(/s$/, "").trim();
  const raw = String(name || "").toLowerCase().replace(/^the\s+/, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  const want = norm(ALIASES[raw] || ALIASES[raw.replace(/s$/, "")] || raw);
  return diagram.parts.find((p) => norm(p.name) === want)
    || diagram.parts.find((p) => norm(p.name).includes(want) || want.includes(norm(p.name)));
}

/**
 * A diagram to be drawn IN STEPS, one part at a time as PrepBot names it:
 * the two cells from the step kits (kits.js); the brain, heart, ear, eye
 * and brain-section from their own per-part outlines. A drawing with no
 * per-part outlines has no step form: null, and the whole drawing is used.
 */
export function stepDiagram(name) {
  const kit = KITS[name];
  if (kit) {
    return { name, w: kit.w, h: kit.h, art: "", decor: "", steps: true, credit: "",
      parts: Object.entries(kit.parts).map(([n, p]) => ({ name: n, cx: p.cx, cy: p.cy, arrow: null, svg: p.svg })) };
  }
  const d = loadedDiagram(name);
  if (!d || !d.parts.every((p) => p.svg)) return null;
  return { ...d, art: d.decor, steps: true };
}
/** Does this diagram need its library file loaded first? (a kit does not) */
export const needsLoad = (name, steps) => !(steps && KITS[name]);
