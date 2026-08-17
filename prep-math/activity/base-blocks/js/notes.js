/* ============================================================================
   Manipulatives — sticky notes
   ----------------------------------------------------------------------------
   A note is a piece of paper a teacher sticks on the canvas: "start here",
   "trade these three", "what is this in base five?". It is an ITEM like any
   other — it takes cells, it is picked up, dragged, turned, tidied and thrown
   away by exactly the machinery the blocks and the frames use — which is why
   this file has no interaction code in it at all. All it knows is how big a note
   is for the words on it, and how to draw one.

   It is the site's own note (.pp-sticky in components.css) and not an
   approximation: the same six papers, the same hand, the same -2deg, the same
   two shadows, the same strip of tape. Paper is paper in the light and in the
   dark, so these colours are fixed rather than theme tokens.
   ========================================================================== */

import { footprint } from "./layout.js";

const B = () => window.BABYLON;

/* .pp-sticky--c0…c5, in the order the panel offers them. */
export const NOTE_PAPERS = [
  "#fff3a8", "#e8c8ff", "#c8f0c0", "#bfe3ff", "#ffd7a3", "#b8ece2",
];

const INK = "#14130f";
const HAND = '"Shantell Sans", "Segoe Print", "Bradley Hand", cursive';
const TILT = -0.035; // the -2deg every note on this site is stuck on at

/* A note lies FLAT on the paper like everything else here, so the 2D view reads
   it straight on. It is a sheet with no thickness, lifted a whisker so it does
   not fight the mat's own lines for the same pixels. */
const LIFT = 0.03;

/* Measured in canvas cells, so a note sits in the grid with the blocks. A line
   of about this many characters is what fits across the narrow note; past that
   the note gets wider, and only then taller. */
const WRAP = 20;
const MIN_W = 7;
const MAX_W = 15;
const PAD = 1.2;   // cells of margin inside the paper
const LINE = 1.5;  // cells per line of writing

export const MAX_CHARS = 220;

/**
 * How many cells of paper the words need.
 *
 * The note grows with what is written on it — that is the whole behaviour a
 * paper note has — so this is worked out from the text and nothing else, and
 * `makeNote` and `setNoteText` both come here rather than guessing.
 */
export function noteSize(text) {
  const lines = wrap(String(text || " "), WRAP);
  const widest = lines.reduce((n, s) => Math.max(n, s.length), 1);
  const l = Math.round(Math.min(MAX_W, Math.max(MIN_W, widest * 0.55 + PAD * 2)));
  const w = Math.round(Math.max(4, lines.length * LINE + PAD * 2));
  return { l, w, lines };
}

/** Break text into lines: honour the returns that were typed, wrap the rest. */
function wrap(text, cols) {
  const out = [];
  for (const para of String(text).split("\n")) {
    if (!para.trim()) { out.push(""); continue; }
    let line = "";
    for (const word of para.split(/\s+/)) {
      const next = line ? line + " " + word : word;
      if (next.length <= cols) { line = next; continue; }
      if (line) out.push(line);
      line = word;
    }
    if (line) out.push(line);
  }
  return out.length ? out : [""];
}

/* ── the thing on the canvas ──────────────────────────────────────────────── */

export function makeNote(text, paper = 0) {
  const size = noteSize(text);
  return {
    kind: "note",
    text: String(text || "").slice(0, MAX_CHARS),
    paper: ((paper % NOTE_PAPERS.length) + NOTE_PAPERS.length) % NOTE_PAPERS.length,
    tag: null,
    x: 0, z: 0, angle: 0,
    l: size.l, w: size.w, h: 0.02,
  };
}

/**
 * Rewrite a note. The paper is recut to the new words, so view.js has to build
 * the rig again — it watches `thing.shape`, which is what changes here.
 */
export function setNoteText(thing, text, paper) {
  thing.text = String(text || "").slice(0, MAX_CHARS);
  if (paper != null) {
    thing.paper = ((paper % NOTE_PAPERS.length) + NOTE_PAPERS.length) % NOTE_PAPERS.length;
  }
  const size = noteSize(thing.text);
  thing.l = size.l;
  thing.w = size.w;
  return thing;
}

/* ── meshes ───────────────────────────────────────────────────────────────── */

export function buildNote(ctx, thing) {
  const BJS = B();
  const scene = ctx.scene;
  const root = new BJS.TransformNode("nt" + thing.id, scene);

  const sheet = BJS.MeshBuilder.CreateGround("note",
    { width: thing.l, height: thing.w }, scene);
  sheet.position.y = LIFT;
  sheet.parent = root;
  sheet.metadata = { itemId: thing.id };

  const k = Math.min(64, 2048 / thing.l, 2048 / thing.w);
  const tex = new BJS.DynamicTexture("ntTex" + thing.id,
    { width: Math.round(thing.l * k), height: Math.round(thing.w * k) }, scene, false);
  tex.wrapU = BJS.Texture.CLAMP_ADDRESSMODE;
  tex.wrapV = BJS.Texture.CLAMP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 4;

  /* Transparent round the paper so the mat shows through the corners the tilt
     leaves bare — and therefore NOT a shadow caster, because the shadow map
     ignores alpha and would drop a full rectangle under a tilted note. */
  tex.hasAlpha = true;
  const m = new BJS.StandardMaterial("ntMat" + thing.id, scene);
  m.diffuseTexture = tex;
  m.useAlphaFromDiffuseTexture = true;
  m.specularColor = new BJS.Color3(0, 0, 0);
  m.emissiveColor = new BJS.Color3(0.22, 0.22, 0.22); // paper does not go grey in a corner
  m.backFaceCulling = false;
  sheet.material = m;

  /* view.js glows `parts.slab` for anything that is not an abacus, and a note is
     one mesh — so the sheet answers to both names. */
  const parts = { root, slab: sheet, sheet, tex, mat: m };
  paintNote(thing, parts);
  return parts;
}

export function placeNote(parts, thing) {
  const f = footprint(thing);
  parts.root.position.x = thing.x + f.l / 2;
  parts.root.position.z = thing.z + f.w / 2;
  parts.root.position.y = 0;
  parts.root.rotation.y = thing.angle || 0;
}

export function paintNote(thing, parts) {
  const tex = parts.tex;
  const g = tex.getContext();
  const W = tex.getSize().width;
  const H = tex.getSize().height;
  const k = W / thing.l; // pixels per cell, the same both ways

  g.clearRect(0, 0, W, H);

  const { lines } = noteSize(thing.text);
  const paper = NOTE_PAPERS[thing.paper] || NOTE_PAPERS[0];
  const pw = W - PAD * 0.5 * k;
  const ph = H - PAD * 0.5 * k;

  g.save();
  g.translate(W / 2, H / 2);
  g.rotate(TILT);

  // .pp-sticky's two shadows, one pass each — canvas only takes one at a time
  const put = () => g.fillRect(-pw / 2, -ph / 2, pw, ph);
  g.fillStyle = paper;
  g.shadowColor = "rgba(20,19,15,0.3)";
  g.shadowBlur = k * 0.5;
  g.shadowOffsetX = k * 0.16;
  g.shadowOffsetY = k * 0.28;
  put();
  g.shadowColor = "rgba(20,19,15,0.1)";
  g.shadowBlur = k * 0.05;
  g.shadowOffsetX = 0;
  g.shadowOffsetY = k * 0.05;
  put();
  g.shadowColor = "transparent";

  // the strip of tape across the top, as .pp-sticky--tape wears it
  const tapeW = Math.min(pw * 0.42, k * 4);
  const tapeH = k * 0.8;
  g.save();
  g.translate(0, -ph / 2);
  g.rotate(-0.061);
  g.fillStyle = "rgba(255,255,255,0.45)";
  g.fillRect(-tapeW / 2, -tapeH * 0.55, tapeW, tapeH);
  g.strokeStyle = "rgba(0,0,0,0.1)";
  g.lineWidth = Math.max(1, tapeH * 0.06);
  g.strokeRect(-tapeW / 2, -tapeH * 0.55, tapeW, tapeH);
  g.restore();

  /* Written by hand, and sized so the longest line just fits the paper — a note
     is read from across a room, so it takes as much of its paper as it can. */
  const room = pw * 0.84;
  let size = Math.min(k * 0.9, (ph * 0.78) / Math.max(1, lines.length));
  g.font = `600 ${size}px ${HAND}`;
  const widest = lines.reduce((n, s) => Math.max(n, g.measureText(s).width), 1);
  if (widest > room) {
    size = Math.max(8, size * (room / widest));
    g.font = `600 ${size}px ${HAND}`;
  }

  g.fillStyle = INK;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const step = size * 1.22;
  const top = -((lines.length - 1) * step) / 2 + tapeH * 0.25;
  lines.forEach((line, i) => g.fillText(line, 0, top + i * step));
  g.restore();

  tex.update(true);
}
