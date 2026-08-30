/* ============================================================================
   Manipulatives — writing in the cells of the page itself
   ----------------------------------------------------------------------------
   The answer is not typed into a box beside the working. It is typed into the
   working: ONE BOX FOR ONE FIGURE, standing in the very cell of the page that
   figure belongs to.

   That is not decoration. Both these methods are arguments about place value,
   and a single box holding "28" is a number with no places in it — the 2 has
   stopped being two tens and gone back to being a 2. Two boxes in two columns
   keep the argument intact, and the board can then outline exactly as many
   cells as there are figures to write.

   ── where a cell is ───────────────────────────────────────────────────────
   The page is painted into a texture, so there is nothing here to hang a box
   off. A cell's four corners are worked out in the board's OWN space — the face
   is a ground of `l - 0.12` by `w - 0.12`, centred on the root, and the texture
   is drawn with invertY so the drawing's row 0 is the far edge — then turned by
   the board's angle, projected to screen pixels, and the box is laid over the
   bounding box of the four. Re-done after every render, because the camera can
   orbit without the store changing.

   ── and one thing you do not type ─────────────────────────────────────────
   Bringing a digit down is a MOVEMENT, not a calculation. So it is dragged: the
   waiting digit stands up out of the dividend as a chip you can pick up and put
   where it goes. A tap on it does the same thing, because a drag is a hard
   gesture to make on a phone and this is not the skill being tested.
   ========================================================================== */

import { selectedItems } from "./state.js";
import { footprint } from "./layout.js";
import { sheetFor } from "./sheets.js";

const B = () => window.BABYLON;

/* The face is inset from the slab by this much all round (grids.js cuts the
   ground `l - 0.12` by `w - 0.12`), and the boxes have to sit on the face and
   not on the slab's edge. */
const INSET = 0.12;

/* How much of a cell the box fills. Well under one, and for two reasons: the
   dashed outline painted into the page has to still show round it, so the box
   reads as something written INTO the cell rather than a control stuck over the
   top of it — and a cell seen in perspective projects to a bounding box BIGGER
   than the cell itself, so a box that filled it would hang over the edge. */
const FILL = 0.7;

/* How far outside the target a drop still counts, as a share of the cell. A
   digit let go near enough to where it is going has been brought down. */
const CATCH = 0.9;

export function createCellLayer(ctx, view, stage, {
  onWrite = () => {}, onBring = () => {},
} = {}) {
  const { scene, camera } = ctx;

  const layer = document.createElement("div");
  layer.className = "bb-cells";
  layer.hidden = true;
  stage.appendChild(layer);

  /* What is standing in the layer at the moment, as a string. Rebuilding the
     DOM on every refresh would take the caret out of the box being typed in and
     drop a drag half way through, so it is rebuilt only when this changes. */
  let key = "";
  let open = null;      // the cells the sheet is asking for
  let boxes = [];       // the inputs, left to right
  let chip = null;      // the digit being brought down
  let target = null;    // where it is going
  let drag = null;

  /** The one worked sheet that is picked up, if that is what is picked up. */
  function only() {
    const picked = selectedItems();
    if (picked.length !== 1) return null;
    return sheetFor(picked[0]) ? picked[0] : null;
  }

  /* ── from a cell of the page to a rectangle of the screen ───────────────── */

  function project(v) {
    const BJS = B();
    const engine = scene.getEngine();
    const rect = stage.getBoundingClientRect();
    const vp = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const p = BJS.Vector3.Project(v, BJS.Matrix.Identity(), scene.getTransformMatrix(), vp);
    return {
      x: p.x * (rect.width / engine.getRenderWidth()),
      y: p.y * (rect.height / engine.getRenderHeight()),
    };
  }

  /**
   * The screen box a cell covers.
   *
   * `u` runs across the face and `v` down the DRAWING — row 0 at the far edge,
   * which is where the texture's invertY puts it. The board's own turn is
   * applied about its centre, so a cell of a board lying at an angle is found
   * at an angle too.
   */
  function cellBox(board, grid, row, col) {
    const BJS = B();
    const fw = board.l - INSET;
    const fh = board.w - INSET;
    /* The same centre placeBoard uses — the FOOTPRINT's, not l and w's. They
       agree only while the board is square to the paper, and a turned board
       would put every box a little way off the page. */
    const f = footprint(board);
    const cx = board.x + f.l / 2;
    const cz = board.z + f.w / 2;
    const y = (board.y || 0) + (board.h || 0.22) + 0.002;
    const a = board.angle || 0;
    const cos = Math.cos(a);
    const sin = Math.sin(a);

    const u0 = (grid.gutter + col) / grid.cols;
    const u1 = (grid.gutter + col + 1) / grid.cols;
    const v0 = row / grid.rows;
    const v1 = (row + 1) / grid.rows;

    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const u of [u0, u1]) {
      for (const v of [v0, v1]) {
        const lx = (u - 0.5) * fw;
        const lz = (0.5 - v) * fh;   // the drawing counts down, the ground counts up
        const p = project(new BJS.Vector3(
          cx + lx * cos + lz * sin, y, cz - lx * sin + lz * cos));
        left = Math.min(left, p.x);
        right = Math.max(right, p.x);
        top = Math.min(top, p.y);
        bottom = Math.max(bottom, p.y);
      }
    }
    return { x: left, y: top, w: right - left, h: bottom - top };
  }

  /** Put `el` in the middle of a cell, filling `share` of it. */
  function lay(el, box, share = FILL) {
    const w = Math.max(14, box.w * share);
    const h = Math.max(16, box.h * share);
    el.style.width = `${Math.round(w)}px`;
    el.style.height = `${Math.round(h)}px`;
    el.style.fontSize = `${Math.max(11, Math.round(Math.min(w, h) * 0.66))}px`;
    el.style.transform =
      `translate(${Math.round(box.x + (box.w - w) / 2)}px, ${Math.round(box.y + (box.h - h) / 2)}px)`;
  }

  /* ── typing ─────────────────────────────────────────────────────────────── */

  /** Everything typed so far, in page order — which is the number being written. */
  function written() {
    return boxes.map((b) => b.value.trim()).join("");
  }

  function clear() {
    for (const b of boxes) b.value = "";
    boxes[0]?.focus();
  }

  function submit() {
    const board = only();
    if (!board || !boxes.length) return;
    const text = written();
    /* Cleared right away, right or wrong. A refused figure that stayed in the
       box would invite the next attempt to be typed on the end of it. */
    clear();
    onWrite(board, text);
  }

  function onType(i) {
    const box = boxes[i];
    /* One character to a box: a paste or a fast typist can put two in, and the
       one that belongs here is the last one they meant. */
    if (box.value.length > 1) box.value = box.value.slice(-1);
    if (!box.value) return;
    /* Full is full, whichever box was filled last — someone who went back to
       correct the first figure should not have to walk past the second one
       again to send it. */
    if (boxes.every((b) => b.value)) { submit(); return; }
    const next = boxes.slice(i + 1).find((b) => !b.value) || boxes.find((b) => !b.value);
    next?.focus();
    next?.select();
  }

  function keyed(e, i) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (boxes.every((b) => b.value)) submit();
      else (boxes.find((b) => !b.value) || boxes[0]).focus();
      return;
    }
    if (e.key === "Backspace" && !boxes[i].value && i > 0) {
      e.preventDefault();
      boxes[i - 1].value = "";
      boxes[i - 1].focus();
      return;
    }
    if (e.key === "ArrowLeft" && i > 0) { e.preventDefault(); boxes[i - 1].focus(); }
    if (e.key === "ArrowRight" && boxes[i + 1]) { e.preventDefault(); boxes[i + 1].focus(); }
  }

  /* ── bringing a digit down ──────────────────────────────────────────────── */

  function catches(px, py) {
    if (!open || open.mode !== "bring") return false;
    const board = only();
    if (!board) return false;
    const box = cellBox(board, open.grid, open.to.row, open.to.col);
    const mx = box.w * CATCH;
    const my = box.h * CATCH;
    return px >= box.x - mx && px <= box.x + box.w + mx
      && py >= box.y - my && py <= box.y + box.h + my;
  }

  function startDrag(e) {
    e.stopPropagation();
    e.preventDefault();
    chip.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, moved: false };
    chip.classList.add("is-held");
  }

  function moveDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x0;
    drag.dy = e.clientY - drag.y0;
    if (Math.abs(drag.dx) > 3 || Math.abs(drag.dy) > 3) drag.moved = true;
    chip.style.marginLeft = `${drag.dx}px`;
    chip.style.marginTop = `${drag.dy}px`;
    const rect = stage.getBoundingClientRect();
    target?.classList.toggle("is-over",
      catches(e.clientX - rect.left, e.clientY - rect.top));
  }

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const rect = stage.getBoundingClientRect();
    const landed = catches(e.clientX - rect.left, e.clientY - rect.top);
    chip.style.marginLeft = "";
    chip.style.marginTop = "";
    chip.classList.remove("is-held");
    target?.classList.remove("is-over");
    const tapped = !drag.moved;
    drag = null;
    /* A tap counts as a drag that arrived. The gesture being taught here is
       "this digit comes down", not "can you hold a finger steady". */
    if (landed || tapped) {
      const board = only();
      if (board) onBring(board);
    }
  }

  /* ── building the layer ─────────────────────────────────────────────────── */

  function shapeOf(board, cells) {
    if (!cells) return `${board.id}:done`;
    return cells.mode === "bring"
      ? `${board.id}:bring:${cells.from.row},${cells.from.col}>${cells.to.row},${cells.to.col}`
      : `${board.id}:type:${cells.cells.map((c) => `${c.row},${c.col}`).join("|")}`;
  }

  function build(cells) {
    layer.innerHTML = "";
    boxes = [];
    chip = null;
    target = null;
    if (!cells) return;

    if (cells.mode === "bring") {
      target = document.createElement("div");
      target.className = "bb-cells__drop";
      target.setAttribute("aria-hidden", "true");
      layer.appendChild(target);

      chip = document.createElement("button");
      chip.className = "bb-cells__chip";
      chip.type = "button";
      chip.textContent = cells.ch;
      chip.title = `Bring the ${cells.ch} down`;
      chip.setAttribute("aria-label", `Bring the ${cells.ch} down`);
      chip.addEventListener("pointerdown", startDrag);
      chip.addEventListener("pointermove", moveDrag);
      chip.addEventListener("pointerup", endDrag);
      chip.addEventListener("pointercancel", endDrag);
      /* A keyboard never makes a pointer event, and a digit that can only be
         brought down by dragging is a step of the working nobody on a keyboard
         can take. It is a button; pressing it brings the digit down. */
      chip.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        const board = only();
        if (board) onBring(board);
      });
      layer.appendChild(chip);
      return;
    }

    cells.cells.forEach((c, i) => {
      const box = document.createElement("input");
      box.className = "bb-cells__box";
      box.inputMode = "numeric";
      box.autocomplete = "off";
      box.spellcheck = false;
      box.maxLength = 1;
      box.setAttribute("aria-label",
        cells.cells.length === 1 ? "The figure that goes here"
          : `Figure ${i + 1} of ${cells.cells.length}`);
      /* A press in a box is a press in the box and nothing else: without this
         the canvas takes it as a press on bare paper, puts the board down, and
         the boxes vanish from under the finger aiming at them. */
      box.addEventListener("pointerdown", (e) => e.stopPropagation());
      box.addEventListener("input", () => onType(i));
      box.addEventListener("keydown", (e) => keyed(e, i));
      box.addEventListener("focus", () => box.select());
      layer.appendChild(box);
      boxes.push(box);
    });
  }

  function place() {
    const board = only();
    if (!board || !open) { layer.hidden = true; return; }
    if (open.mode === "bring") {
      if (chip) lay(chip, cellBox(board, open.grid, open.from.row, open.from.col), FILL);
      if (target) lay(target, cellBox(board, open.grid, open.to.row, open.to.col), 1);
      return;
    }
    open.cells.forEach((c, i) => {
      if (boxes[i]) lay(boxes[i], cellBox(board, open.grid, c.row, c.col));
    });
  }

  function refresh() {
    const board = only();
    const sheet = board && sheetFor(board);
    const cells = sheet && sheet.cells ? sheet.cells(board) : null;
    layer.hidden = !cells;
    if (!board) { key = ""; open = null; return; }

    const shape = shapeOf(board, cells);
    if (shape !== key) {
      const had = boxes.some((b) => b === document.activeElement);
      key = shape;
      open = cells;
      build(cells);
      /* Carry the caret across to the next thing being asked for, but only if
         it was in this layer already — otherwise picking a board up would steal
         the keyboard from whatever the user was actually typing in. */
      if (had) boxes[0]?.focus();
    } else {
      open = cells;
    }
    place();
  }

  /** Put the caret in the first box, for a tap on the page or on the strip. */
  function focus() {
    if (layer.hidden) return;
    boxes[0]?.focus();
    boxes[0]?.select();
  }

  const obs = scene.onAfterRenderObservable.add(() => { if (!layer.hidden) place(); });

  return {
    refresh,
    focus,
    destroy() {
      scene.onAfterRenderObservable.remove(obs);
      layer.remove();
    },
  };
}
