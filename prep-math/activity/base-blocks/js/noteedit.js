/* ============================================================================
   Manipulatives — writing on a note where it lies
   ----------------------------------------------------------------------------
   The editor itself is the shared component
   (/utils/components/sticky-note-editor.js). This file is the part that could
   only be written here: WHERE the paper floats, which is over the 3D note it
   belongs to, and the fact that the 3D note is switched off while you write on
   it so there is one note on the canvas and not two.

   It is pinned by projecting the four corners of the note's CELL-SPACE box, the
   way turn.js pins its handle — an item's patch of paper is the one thing every
   kind of item has, and an item with no mesh of its own has no bounding box.
   Re-pinned after every render, because the camera can orbit without the store
   ever changing.
   ========================================================================== */

import { createStickyEditor } from "/utils/components/sticky-note-editor.js";
import { footprint } from "./layout.js";
import { measure } from "./notes.js";

const B = () => window.BABYLON;

export function createNoteEditor(ctx, view, stage, { onInput = () => {}, onCommit = () => {} } = {}) {
  const { scene, camera } = ctx;
  let note = null;

  const editor = createStickyEditor({
    host: stage,
    onInput: (n) => {
      /* The paper is recut to the words as they are typed, so the note you are
         writing on is always the size the note will be. */
      measure(n);
      onInput(n);
      /* The host has just redrawn, and a note whose words changed is a note
         whose rig was BUILT AGAIN — switched on, as a new rig is. So it is put
         back out here, or the 3D note comes up behind the paper you are typing
         on and you are looking at the same note twice. */
      show3D(n, false);
      place();
    },
    onDone: (n, info) => {
      show3D(n, true);
      note = null;
      onCommit(n, info);
    },
  });

  function project(x, y, z) {
    const BJS = B();
    const engine = scene.getEngine();
    const rect = stage.getBoundingClientRect();
    const vp = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const p = BJS.Vector3.Project(
      new BJS.Vector3(x, y, z), BJS.Matrix.Identity(), scene.getTransformMatrix(), vp);
    return {
      x: p.x * (rect.width / engine.getRenderWidth()),
      y: p.y * (rect.height / engine.getRenderHeight()),
    };
  }

  /**
   * Sit the paper on the note's own patch of canvas.
   *
   * The box is the note's footprint projected to the screen, so the paper grows
   * as you zoom in — the note you are writing on is the note that is there. Below
   * a legible size it stops shrinking and just sits there: you should be able to
   * write on a note you have zoomed away from.
   */
  function place() {
    if (!note || !editor.isOpen()) return;
    const f = footprint(note);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const x of [note.x, note.x + f.l]) {
      for (const z of [note.z, note.z + f.w]) {
        const p = project(x, 0, z);
        x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x);
        y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
      }
    }
    if (!isFinite(x0)) return;

    const rect = stage.getBoundingClientRect();
    const w = Math.max(200, Math.min(rect.width - 24, x1 - x0));
    const h = Math.max(96, Math.min(rect.height - 96, y1 - y0));
    editor.place({
      left: Math.max(12, Math.min(rect.width - w - 12, (x0 + x1) / 2 - w / 2)),
      top: Math.max(56, Math.min(rect.height - h - 12, (y0 + y1) / 2 - h / 2)),
      width: w,
      minHeight: h,
    });
  }

  /** The 3D note is switched off while you are writing on the DOM one. */
  function show3D(thing, on) {
    view.rigOf(thing?.id)?.parts?.root?.setEnabled(on);
  }

  function open(thing) {
    if (!thing || thing.kind !== "note") return;
    if (note && note !== thing) editor.close(true);
    note = thing;
    show3D(thing, false);
    editor.open(thing);
    place();
  }

  /* A press anywhere else is the end of writing — caught on the way DOWN so the
     click still does its own job as well. */
  function onDocDown(e) {
    if (!editor.isOpen() || editor.owns(e.target)) return;
    editor.close(true);
  }
  document.addEventListener("pointerdown", onDocDown, true);

  const obs = scene.onAfterRenderObservable.add(place);

  return {
    open,
    close: (commit = true) => editor.close(commit),
    isOpen: () => editor.isOpen(),
    get note() { return note; },
    destroy() {
      document.removeEventListener("pointerdown", onDocDown, true);
      scene.onAfterRenderObservable.remove(obs);
      editor.destroy();
    },
  };
}
