/* ============================================================================
   Manipulatives — a sticky note as a thing on the canvas
   ----------------------------------------------------------------------------
   What a note IS and how one is DRAWN belongs to the shared component
   (/utils/components/sticky-note.js). All that is left here is the ADAPTER: how
   a note of a given size in note-pixels becomes a patch of squared paper in
   cells, and how it is put on a Babylon mesh.

   Everything else a note does on this canvas — being picked up, dragged,
   turned, tidied, thrown away — is the machinery every item already has, which
   is why there is still no interaction code in this file.
   ========================================================================== */

import {
  makeNote as makeStickyNote, layoutNote, paintSticky, noteText, editNote,
  PAPERS, MAX_W,
} from "/utils/components/sticky-note.js";
import { whenMathDrawn } from "/utils/components/sticky-math.js";
import { footprint } from "./layout.js";

const B = () => window.BABYLON;

export { noteText, editNote as recut, PAPERS as NOTE_PAPERS };

/* How many note-pixels fit across one cell of squared paper. Sized so a note
   written at the default hand is about as tall as a rod is long — a note reads
   as a note beside the blocks rather than as a poster behind them. */
const PX_PER_CELL = 26;

/* A note lies FLAT on the paper like everything else here, so the 2D view reads
   it straight on. It is a sheet with no thickness, lifted a whisker so it does
   not fight the mat's own lines for the same pixels. */
const LIFT = 0.03;

/** How wide a note is allowed to get before it starts growing downwards. */
const MAX_CELLS = Math.round(MAX_W / PX_PER_CELL);

/**
 * Lay a note out and say how many cells of paper it covers.
 *
 * The layout is kept ON the note (`note.at`) so the mesh, the texture and the
 * footprint are all cut from the one measurement rather than three that might
 * disagree by a pixel.
 */
export function measure(note) {
  const at = layoutNote(note, { maxWidth: MAX_CELLS * PX_PER_CELL });
  note.at = at;
  note.l = Math.max(2, Math.ceil(at.width / PX_PER_CELL));
  note.w = Math.max(2, Math.ceil(at.height / PX_PER_CELL));
  return note;
}

export function makeNote(text = "", paper = 0) {
  const note = makeStickyNote({ text, paper });
  return measure(Object.assign(note, {
    kind: "note",
    tag: null,
    x: 0, z: 0, angle: 0,
    h: 0.02,
  }));
}

/* ── meshes ───────────────────────────────────────────────────────────────── */

export function buildNote(ctx, thing) {
  const BJS = B();
  const scene = ctx.scene;
  measure(thing);
  const root = new BJS.TransformNode("nt" + thing.id, scene);

  const sheet = BJS.MeshBuilder.CreateGround("note",
    { width: thing.l, height: thing.w }, scene);
  sheet.position.y = LIFT;
  sheet.parent = root;
  sheet.metadata = { itemId: thing.id };

  /* The texture is the note's own pixel size, twice over so the writing stays
     crisp when the camera comes in close. Cells and note-pixels agree exactly,
     which is what keeps the drawn note the size the layout said it was. */
  const px = Math.min(2048, Math.round(thing.l * PX_PER_CELL * 2));
  const py = Math.min(2048, Math.round(thing.w * PX_PER_CELL * 2));
  const tex = new BJS.DynamicTexture("ntTex" + thing.id, { width: px, height: py }, scene, false);
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
  parts.root.position.y = thing.y || 0;
  parts.root.rotation.y = thing.angle || 0;
}

export function paintNote(thing, parts) {
  const tex = parts.tex;
  /* A rig is disposed and built again whenever a note changes, so a repaint
     queued behind something slow — the fonts arriving — can land on a texture
     that is already gone. A disposed one has no context. */
  const g = tex && tex.getContext ? tex.getContext() : null;
  if (!g) return;
  const W = tex.getSize().width;
  const H = tex.getSize().height;
  const k = W / (thing.l * PX_PER_CELL); // texture pixels per note-pixel

  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, H);
  g.scale(k, k);
  const waiting = paintSticky(g, thing, thing.at || measure(thing).at, {
    width: thing.l * PX_PER_CELL,
    height: thing.w * PX_PER_CELL,
  });
  g.setTransform(1, 0, 0, 1, 0, 0);

  // invertY: a 2D canvas counts rows down and a ground's V runs up
  tex.update(true);

  /* A face that has not arrived yet is drawn in whatever the browser falls back
     to, and a canvas texture is painted once and kept — so a note written in
     Times or in the maths face came out in the wrong one for the rest of the
     session. Paint it again when the fonts are in. `ready` settles once, and
     `status` is "loaded" by then, so this cannot loop. */
  if (document.fonts && document.fonts.status !== "loaded") {
    document.fonts.ready.then(() => paintNote(thing, parts));
  }

  /* And again when a formula on it has been set. An equation is drawn as a
     picture of typeset mathematics, and making that picture is a round trip
     through an image — so the note is painted with the SOURCE showing and
     painted again the moment the mathematics arrives. The same one-shot
     arrangement as the fonts, and it cannot loop: nothing wakes us unless a
     picture actually landed. */
  if (waiting) {
    whenMathDrawn(() => {
      measure(thing); // a set formula is a different size from its source
      paintNote(thing, parts);
    });
  }
}

/** What view.js watches to know a note has changed under it. */
export function noteShape(thing) {
  return `${thing.rev || 0}/${thing.l}x${thing.w}`;
}
