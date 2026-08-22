/* ═══════════════════════════════════════════════════════════════════════════
   THE CANVAS

   An unbounded sheet you pan and zoom, with cards on it. Same idea as the
   manipulatives workbench: one surface, many things on it, nothing bounded by
   the window.

   The whole world is a single transformed layer, so a card only ever knows its
   own position in world coordinates and never has to think about the zoom.
   Screen-to-world conversion happens here and nowhere else.
   ═══════════════════════════════════════════════════════════════════════════ */

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.4;

export function createCanvas(host) {
  const world = document.createElement("div");
  world.className = "am-world";
  host.appendChild(world);

  const grid = document.createElement("div");
  grid.className = "am-grid";
  host.insertBefore(grid, world);

  let zoom = 1;
  let panX = 0;
  let panY = 0;
  const listeners = { move: [] };

  function paint() {
    world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    // The paper's ruling belongs to the world, so it has to move with it.
    grid.style.backgroundSize = `${28 * zoom}px ${28 * zoom}px`;
    grid.style.backgroundPosition = `${panX}px ${panY}px`;
    for (const fn of listeners.move) fn();
  }

  const toWorld = (sx, sy) => {
    const box = host.getBoundingClientRect();
    return { x: (sx - box.left - panX) / zoom, y: (sy - box.top - panY) / zoom };
  };

  /* ── Panning ─────────────────────────────────────────────────────────────
     Dragging the paper moves the world; dragging a card's grip moves the card.
     Both come through here so a card never has to undo the zoom itself. */
  let drag = null;

  host.addEventListener("pointerdown", (e) => {
    if (e.button === 2) return;
    // A button in the grip is a button, not a handle. Without this the drag
    // below captures the pointer on the host and the click never reaches the
    // card's own step-back and close — they simply stop working.
    if (e.target.closest?.("button")) return;
    const grip = e.target.closest?.(".am-card__grip");
    if (grip) {
      const card = grip.closest(".am-card");
      drag = {
        kind: "card", card,
        offX: parseFloat(card.style.left) - toWorld(e.clientX, e.clientY).x,
        offY: parseFloat(card.style.top) - toWorld(e.clientX, e.clientY).y,
      };
      card.classList.add("is-lifted");
      // A lifted card comes to the front and stays there.
      world.appendChild(card);
    } else if (!e.target.closest?.(".am-card")) {
      drag = { kind: "pan", x: e.clientX - panX, y: e.clientY - panY };
      host.classList.add("is-panning");
    } else {
      return;
    }
    host.setPointerCapture(e.pointerId);
  });

  host.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (drag.kind === "pan") {
      panX = e.clientX - drag.x;
      panY = e.clientY - drag.y;
      paint();
    } else {
      const w = toWorld(e.clientX, e.clientY);
      drag.card.style.left = `${w.x + drag.offX}px`;
      drag.card.style.top = `${w.y + drag.offY}px`;
      for (const fn of listeners.move) fn();
    }
  });

  const endDrag = () => {
    if (!drag) return;
    if (drag.kind === "card") drag.card.classList.remove("is-lifted");
    host.classList.remove("is-panning");
    drag = null;
  };
  host.addEventListener("pointerup", endDrag);
  host.addEventListener("pointercancel", endDrag);

  /* ── Zooming ─────────────────────────────────────────────────────────────
     Keep whatever is under the pointer under the pointer. */
  host.addEventListener("wheel", (e) => {
    e.preventDefault();
    const box = host.getBoundingClientRect();
    const sx = e.clientX - box.left;
    const sy = e.clientY - box.top;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * Math.exp(-e.deltaY * 0.0016)));
    panX = sx - (sx - panX) * (next / zoom);
    panY = sy - (sy - panY) * (next / zoom);
    zoom = next;
    paint();
  }, { passive: false });

  paint();

  return {
    world,
    get zoom() { return zoom; },

    add(cardEl) { world.appendChild(cardEl); },

    /** The middle of the visible area, in world terms — where a new card goes. */
    centre() {
      const box = host.getBoundingClientRect();
      return {
        x: (box.width / 2 - panX) / zoom,
        y: (box.height * 0.34 - panY) / zoom,
      };
    },

    /**
     * Somewhere free near the middle.
     *
     * `taken` is the cards' real boxes in world terms. Each is padded out to
     * ROOM before the test, because a card is not the size it will be: every
     * move adds a line under it and a reason to the right of it, so spacing
     * them by what they measure now guarantees they collide in three moves'
     * time. ROOM is roughly a solved five-line problem.
     */
    freeSpot(taken) {
      /* ROOM is not the size a card is, it is the size a card BECOMES: every
         move adds a line under it and a reason to the right of it, so spacing
         them by what they measure at birth guarantees they collide three moves
         later. Roughly a solved five-line problem. */
      const ROOM = { w: 540, h: 300 };
      const GAP = 28;
      const frame = host.getBoundingClientRect().width;
      // On a phone ROOM is wider than the window; there is no sense reserving
      // width the student can never see at once.
      const roomW = Math.min(ROOM.w, Math.max(280, frame - 40));
      const wide = frame >= 900;      // room for two cards abreast?

      const mid = this.centre();
      // A card is positioned by its top-left, so shift half a card left to put
      // the FIRST one in the middle of the window rather than starting there.
      const c = { x: mid.x - roomW / 2, y: mid.y };

      const grown = taken.map((t) => ({
        x: t.x, y: t.y,
        w: Math.max(t.w || 0, roomW), h: Math.max(t.h || 0, ROOM.h),
      }));
      const clash = (p) => grown.some((t) =>
        p.x - GAP < t.x + t.w && p.x + roomW + GAP > t.x &&
        p.y - GAP < t.y + t.h && p.y + ROOM.h + GAP > t.y);

      /* Slots a whole card apart, so the lattice IS the packing rather than
         something a search has to discover. Right before left, because that is
         the way reading runs. */
      const across = wide ? [0, 1, -1, 2, -2, 3, -3] : [0, 1, -1];
      const spots = [];
      for (let gy = 0; gy < 8; gy++) {
        for (const gx of across) {
          spots.push({ x: c.x + gx * (roomW + GAP), y: c.y + gy * (ROOM.h + GAP) });
        }
      }
      /* On a wide window going down costs more than going sideways — the next
         card is still on screen beside this one and would not be under it. On a
         narrow one it is the other way round, so the column becomes the answer.
         A stable sort keeps right-before-left among slots that cost the same. */
      const weight = wide ? 2.2 : 0.3;
      const cost = (p) => Math.hypot(p.x - c.x, (p.y - c.y) * weight);
      spots.sort((a, b) => cost(a) - cost(b));

      for (const p of spots) if (!clash(p)) return p;
      return { x: c.x, y: c.y };
    },

    zoomBy(factor) {
      const box = host.getBoundingClientRect();
      const sx = box.width / 2;
      const sy = box.height / 2;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
      panX = sx - (sx - panX) * (next / zoom);
      panY = sy - (sy - panY) * (next / zoom);
      zoom = next;
      paint();
    },

    reset() { zoom = 1; panX = 0; panY = 0; paint(); },

    /** Bring a card fully into view without changing the zoom. */
    revealCard(cardEl) {
      const box = host.getBoundingClientRect();
      const r = cardEl.getBoundingClientRect();
      const margin = 24;
      let dx = 0, dy = 0;
      if (r.right > box.right - margin) dx = box.right - margin - r.right;
      if (r.left + dx < box.left + margin) dx = box.left + margin - r.left;
      if (r.bottom > box.bottom - margin) dy = box.bottom - margin - r.bottom;
      if (r.top + dy < box.top + margin) dy = box.top + margin - r.top;
      if (!dx && !dy) return;
      panX += dx;
      panY += dy;
      paint();
    },

    onMove(fn) { listeners.move.push(fn); },
  };
}
