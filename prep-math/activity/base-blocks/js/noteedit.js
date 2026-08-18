/* ============================================================================
   Manipulatives — writing on a note where it lies
   ----------------------------------------------------------------------------
   You drag a note out of the rail, drop it where it belongs, and type on it.
   Click away when you are done. Double-tap it to write on it again.

   The writing happens in a DOM sticky note pinned exactly over the 3D one and
   made contenteditable — for the same reason the turn handle and the trade card
   are DOM: everything on this canvas is drawn into a WebGL texture, and a text
   caret is not something to reimplement in one. While it is open the 3D note is
   switched OFF, so there is one note on the paper and not two.

   It is pinned by projecting the four corners of the note's CELL-SPACE box, the
   way turn.js pins its handle — an item's patch of paper is the one thing every
   kind of item has. Re-pinned after every render, because the camera can orbit
   without the store ever changing.
   ========================================================================== */

import { footprint } from "./layout.js";
import { NOTE_PAPERS, recut } from "./notes.js";

const B = () => window.BABYLON;

export function createNoteEditor(ctx, view, stage, { onCommit = () => {} } = {}) {
  const { scene, camera } = ctx;

  const root = document.createElement("div");
  root.className = "bb-noteedit";
  root.hidden = true;
  root.innerHTML = `
    <div class="bb-noteedit__bar" role="toolbar" aria-label="How the note is written">
      <button type="button" class="bb-noteedit__key" data-fmt="smaller"
              title="Smaller writing" aria-label="Smaller writing">A</button>
      <button type="button" class="bb-noteedit__key bb-noteedit__key--big" data-fmt="bigger"
              title="Bigger writing" aria-label="Bigger writing">A</button>
      <button type="button" class="bb-noteedit__key bb-noteedit__key--b" data-fmt="bold"
              title="Bold" aria-label="Bold" aria-pressed="false">B</button>
      <button type="button" class="bb-noteedit__key bb-noteedit__key--i" data-fmt="italic"
              title="Slanted" aria-label="Slanted" aria-pressed="false">I</button>
      <span class="bb-noteedit__gap"></span>
      <button type="button" class="bb-noteedit__paperkey" data-fmt="paper"
              title="Another paper" aria-label="Another paper"></button>
    </div>
    <div class="bb-noteedit__paper" id="bb-noteedit-paper" contenteditable="plaintext-only"
         role="textbox" aria-multiline="true" aria-label="What the note says"
         spellcheck="true"></div>`;
  stage.appendChild(root);

  const bar = root.querySelector(".bb-noteedit__bar");
  const paperKey = root.querySelector(".bb-noteedit__paperkey");
  const paper = root.querySelector(".bb-noteedit__paper");

  let note = null;

  /* ── where it sits ──────────────────────────────────────────────────────── */

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
   * The box is the note's footprint projected to the screen, so it grows as you
   * zoom in and the writing you are doing is the size the writing will be. Below
   * a legible size it stops shrinking and just sits there — you should be able to
   * type on a note you have zoomed away from.
   */
  function place() {
    if (root.hidden || !note) return;
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
    const w = Math.max(190, Math.min(rect.width - 24, x1 - x0));
    const h = Math.max(96, Math.min(rect.height - 90, y1 - y0));
    const cx = Math.max(12, Math.min(rect.width - w - 12, (x0 + x1) / 2 - w / 2));
    const cy = Math.max(52, Math.min(rect.height - h - 12, (y0 + y1) / 2 - h / 2));

    root.style.width = Math.round(w) + "px";
    /* The tilt has to be part of THIS transform: an inline `transform` replaces
       the stylesheet's, so setting only the translate quietly straightened every
       note the moment it was opened. */
    root.style.transform = `translate(${Math.round(cx)}px, ${Math.round(cy)}px) rotate(-2deg)`;
    paper.style.minHeight = Math.round(h) + "px";

    /* The writing is sized off the PAPER, exactly as notes.js sizes it when it
       paints the real one: a note's text fills its note. Sizing it off the
       chosen scale instead left a zoomed-in note as a huge sheet with a few
       small words adrift in the middle of it — the two disagreed on screen. */
    const lines = Math.max(1, (paper.textContent.match(/\n/g) || []).length + 1);
    const perCell = w / Math.max(1, footprint(note).l);
    paper.style.fontSize =
      Math.max(11, Math.min(perCell * 0.9, (h * 0.7) / lines)) + "px";
  }

  /* ── opening and closing ────────────────────────────────────────────────── */

  /** The 3D note is switched off while you are writing on the DOM one. */
  function show3D(on) {
    const rig = note && view.rigOf(note.id);
    rig?.parts?.root?.setEnabled(on);
  }

  function dress() {
    if (!note) return;
    paper.style.background = NOTE_PAPERS[note.paper];
    paper.style.fontWeight = note.bold ? 800 : 600;
    paper.style.fontStyle = note.italic ? "italic" : "normal";
    // the writing SIZE is set in place(), off the paper the note was recut to
    paperKey.style.background = NOTE_PAPERS[(note.paper + 1) % NOTE_PAPERS.length];
    root.querySelector("[data-fmt=bold]").setAttribute("aria-pressed", String(!!note.bold));
    root.querySelector("[data-fmt=italic]").setAttribute("aria-pressed", String(!!note.italic));
  }

  function open(thing) {
    if (!thing || thing.kind !== "note") return;
    if (note && note !== thing) close(true);
    note = thing;
    root.hidden = false;
    show3D(false);
    paper.textContent = note.text || "";
    dress();
    place();
    paper.focus();
    // the caret goes to the end, so carrying on writing is the default
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(paper);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Put the pen down. A note left with nothing on it is thrown away rather than
   * left as a blank rectangle nobody meant to make.
   */
  function close(commit = true) {
    if (!note) return;
    const was = note;
    const text = commit ? paper.textContent.replace(/ /g, " ").trim() : was.text;
    show3D(true); // while `note` still points at it
    note = null;
    root.hidden = true;
    if (commit) recut(was, { text });
    onCommit(was, { empty: !text });
  }

  const isOpen = () => !root.hidden;

  /* ── the format keys ────────────────────────────────────────────────────── */

  bar.addEventListener("pointerdown", (e) => {
    // keep the caret in the paper: a toolbar press must not blur what it edits
    e.preventDefault();
  });

  bar.addEventListener("click", (e) => {
    const key = e.target.closest("[data-fmt]");
    if (!key || !note) return;
    const how = key.dataset.fmt;
    if (how === "smaller") recut(note, { scale: note.scale - 1 });
    else if (how === "bigger") recut(note, { scale: note.scale + 1 });
    else if (how === "bold") recut(note, { bold: !note.bold });
    else if (how === "italic") recut(note, { italic: !note.italic });
    else if (how === "paper") recut(note, { paper: note.paper + 1 });
    dress();
    place();
    paper.focus();
  });

  /* Typing recuts the paper as you go, so the note you are writing on is always
     the size the note will be — but only the DOM one moves until you are done. */
  paper.addEventListener("input", () => {
    if (!note) return;
    recut(note, { text: paper.textContent });
    place();
  });

  paper.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); close(true); return; }
    // Enter makes a new line; Ctrl/Cmd+Enter is "done", the way a comment box is
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); close(true); }
    e.stopPropagation(); // the canvas's own single-letter shortcuts are not for here
  });

  /* A press anywhere else is the end of writing — that is what "click outside"
     means, and it is caught on the way DOWN so the click also does its own job. */
  function onDocDown(e) {
    if (root.hidden) return;
    if (root.contains(e.target)) return;
    close(true);
  }
  document.addEventListener("pointerdown", onDocDown, true);

  const obs = scene.onAfterRenderObservable.add(place);

  return {
    open,
    close,
    isOpen,
    get note() { return note; },
    destroy() {
      document.removeEventListener("pointerdown", onDocDown, true);
      scene.onAfterRenderObservable.remove(obs);
      root.remove();
    },
  };
}
