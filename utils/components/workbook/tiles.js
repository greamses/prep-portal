/* ============================================================================
   PRINTABLE WORKBOOK — algebra tiles, and a square to complete
   ----------------------------------------------------------------------------
   x² + 6x is a square of side x with two strips of 3 x laid along it, and the
   corner where the strips meet is empty. Fill that corner — 3 by 3, nine ones
   — and the whole thing is a square of side x + 3. That is completing the
   square, and it is a thing you can do with your hands before it is a thing
   you do to an equation.

   The frame says what goes where, and nothing else fits:

     the x² tile      the big square, one of it
     an x strip       along the right and along the bottom — half of the x
                      each way, which is WHY b is halved
     a one            in the corner, a by a of them

   The tray's three tiles are never used up: dragging one takes a COPY, so a
   child may take as many ones as the corner needs (and find out how many that
   is by filling it). A tile can be turned round — shift-click, or its ±
   handle — for a square with a minus middle: x² − 6x + 9 is (x − 3)².

   The drawing says what it is, and mountTiles() makes it live:

     div.tl-wrap[data-tiles][data-a][data-sign]
       div.tl-zone[data-zone="x2"|"xr"|"xb"|"one"][data-i]
       span.tl-tile[data-kind="x2"|"x"|"one"][data-sign]
       div.tl-tray > span.tl-tile (the three that copy themselves)

   tilesRight() has no DOM, so the checks run it in Node.
   ========================================================================== */

/** What a finished square of side (x + a) holds. */
export const needsOf = (a) => ({ x2: 1, x: 2 * a, one: a * a });

/** The zones a frame of side (x + a) has, in the order they are drawn. */
export function zonesOf(a) {
  const out = [{ zone: "x2", i: 0 }];
  for (let i = 0; i < a; i++) out.push({ zone: "xr", i });
  for (let i = 0; i < a; i++) out.push({ zone: "xb", i });
  for (let i = 0; i < a * a; i++) out.push({ zone: "one", i });
  return out;
}

/** The tile each zone takes. */
export const wants = (zone) => (zone === "x2" ? "x2" : zone === "one" ? "one" : "x");

/**
 * Is the square finished? `filled` is what lies in each zone, as
 * "zone:i" → { kind, sign }. Every zone must hold its own kind, and every
 * tile must be the way round the question asks (a minus middle wants minus
 * strips, and minus ones — the corner of a minus square is still a plus).
 */
export function tilesRight(filled, a, sign = 1) {
  return zonesOf(a).every(({ zone, i }) => {
    const t = filled[`${zone}:${i}`];
    if (!t || t.kind !== wants(zone)) return false;
    /* the x² and the corner ones are always plus; only the strips turn round */
    const want = zone === "xr" || zone === "xb" ? sign : 1;
    return (t.sign ?? 1) === want;
  });
}

/* ── the drawing ────────────────────────────────────────────────────────── */

const face = (kind) => (kind === "x2" ? "x²" : kind === "x" ? "x" : "1");

/* No tooltip on a tile: they lie edge to edge, and a tip would sit across the
   square you are trying to look at. Only the strips (and the x²) carry a ±
   handle — the corner ones are always plus, and nine handles is nine too many. */
export const tileHtml = (kind, { sign = 1, source = false, flip = false } = {}) =>
  `<span class="tl-tile tl-tile--${kind}${sign < 0 ? " is-minus" : ""}${source ? " is-source" : ""}"` +
  ` data-kind="${kind}" data-sign="${sign}">` +
  `<b>${sign < 0 ? "−" : ""}${face(kind)}</b>${flip && kind !== "one" ? `<i class="tl-flip" data-flip="1">±</i>` : ""}</span>`;

/**
 * A square frame of side (x + a), with what is already laid in it.
 *   given   what the question prints in place: { x2: true, strips: true }
 *   sign    −1 for a square with a minus middle
 */
export function tilesHtml({ a, given = {}, sign = 1, label = "" } = {}) {
  /* where each zone sits in the grid, worked out here rather than in the
     stylesheet: a cell's row and column are plain numbers, and every browser
     can lay those out */
  const at = (zone, i) => {
    if (zone === "x2") return [1, 1];
    if (zone === "xr") return [i + 2, 1];
    if (zone === "xb") return [1, i + 2];
    return [(i % a) + 2, Math.floor(i / a) + 2];
  };
  const cell = (zone, i) => {
    const has = zone === "x2" ? given.x2 : (zone === "one" ? given.ones : given.strips);
    const [c, r] = at(zone, i);
    return `<div class="tl-zone tl-zone--${zone}" data-zone="${zone}" data-i="${i}"` +
      ` style="--tl-c:${c};--tl-r:${r}">${has ? tileHtml(wants(zone), { sign: zone === "xr" || zone === "xb" ? sign : 1 }) : ""}</div>`;
  };
  const zones = zonesOf(a).map(({ zone, i }) => cell(zone, i)).join("");
  const tray = ["x2", "x", "one"].map((k) => tileHtml(k, { source: true })).join("");
  return `<div class="tl-wrap" data-tiles="1" data-a="${a}" data-sign="${sign}"${label ? ` aria-label="${label}"` : ""}>` +
    `<div class="tl-square" style="--tl-a:${a}">${zones}</div>` +
    `<div class="tl-tray"><span class="tl-tray__tag">Tiles</span>${tray}` +
    `<span class="tl-tray__note">Take as many as you need — each one copies itself.</span></div>` +
    `</div>`;
}

/* ── on screen ──────────────────────────────────────────────────────────── */

/**
 *   mountTiles(wrap, { saved, onChange })
 *     saved   what lies in each zone, { "one:3": { kind, sign }, … }
 *   → { filled(), set(), clear(), dispose() }
 */
export function mountTiles(wrap, { saved = null, onChange = () => {} } = {}) {
  const printed = wrap.innerHTML;
  const a = Number(wrap.dataset.a) || 1;
  const sign = Number(wrap.dataset.sign) || 1;
  let filled = {};
  wrap.dataset.tilesLive = "1";

  /* what the paper was printed with counts as laid already */
  wrap.querySelectorAll(".tl-zone").forEach((z) => {
    const t = z.querySelector(".tl-tile");
    if (t) filled[`${z.dataset.zone}:${z.dataset.i}`] = { kind: t.dataset.kind, sign: Number(t.dataset.sign) || 1 };
  });
  if (saved) filled = { ...saved };

  const paint = () => {
    wrap.querySelectorAll(".tl-zone").forEach((z) => {
      const key = `${z.dataset.zone}:${z.dataset.i}`;
      const t = filled[key];
      z.innerHTML = t ? tileHtml(t.kind, { sign: t.sign, flip: true }) : "";
      z.classList.toggle("is-full", !!t);
    });
  };

  const put = (key, tile) => {
    const before = { ...filled };
    if (tile) filled[key] = tile; else delete filled[key];
    paint();
    onChange({ ...filled }, before);
  };

  const zoneAt = (x, y) => document.elementsFromPoint(x, y)
    .map((el) => el.closest?.(".tl-zone"))
    .find((z) => z && wrap.contains(z)) || null;

  /* ── dragging: out of the tray a COPY comes, out of a zone the tile itself ── */
  let drag = null;
  const onDown = (e) => {
    const tile = e.target.closest(".tl-tile");
    if (!tile || !wrap.dataset.tilesLive) return;
    e.preventDefault();
    /* the ± handle, or shift-click: the tile turns round where it lies */
    const zone = tile.closest(".tl-zone");
    if (zone && (e.target.closest(".tl-flip") || e.shiftKey || e.altKey)) {
      const key = `${zone.dataset.zone}:${zone.dataset.i}`;
      const was = filled[key];
      if (was) put(key, { ...was, sign: -(was.sign ?? 1) });
      return;
    }
    const r = tile.getBoundingClientRect();
    drag = {
      kind: tile.dataset.kind,
      sign: Number(tile.dataset.sign) || 1,
      from: zone ? `${zone.dataset.zone}:${zone.dataset.i}` : null,
      dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height,
      x0: e.clientX, y0: e.clientY, moved: false, pointer: e.pointerId,
    };
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.moved = true;
      drag.ghost = document.createElement("span");
      drag.ghost.className = `tl-tile tl-tile--${drag.kind} tl-ghost${drag.sign < 0 ? " is-minus" : ""}`;
      drag.ghost.innerHTML = `<b>${drag.sign < 0 ? "−" : ""}${face(drag.kind)}</b>`;
      drag.ghost.style.width = `${drag.w}px`;
      drag.ghost.style.height = `${drag.h}px`;
      document.body.appendChild(drag.ghost);
    }
    drag.ghost.style.left = `${e.clientX - drag.dx}px`;
    drag.ghost.style.top = `${e.clientY - drag.dy}px`;
    const z = zoneAt(e.clientX, e.clientY);
    wrap.querySelectorAll(".tl-zone.is-over").forEach((n) => n.classList.remove("is-over"));
    if (z && !z.classList.contains("is-full")) z.classList.add("is-over");
  };
  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const d = drag;
    drag = null;
    wrap.querySelectorAll(".tl-zone.is-over").forEach((n) => n.classList.remove("is-over"));
    d.ghost?.remove();
    if (!d.moved) return;
    const z = zoneAt(e.clientX, e.clientY);
    const key = z ? `${z.dataset.zone}:${z.dataset.i}` : null;
    if (!key) { if (d.from) put(d.from, null); return; }     // dragged out: taken off
    if (key === d.from) return;
    if (filled[key]) { wobble(z); return; }                  // that place is taken
    if (wants(z.dataset.zone) !== d.kind) { wobble(z); return; }
    if (d.from) delete filled[d.from];
    put(key, { kind: d.kind, sign: d.sign });
  };
  const wobble = (z) => {
    z.classList.remove("is-no"); void z.offsetWidth; z.classList.add("is-no");
    setTimeout(() => z.classList.remove("is-no"), 420);
  };

  wrap.addEventListener("pointerdown", onDown);
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onUp);
  paint();

  return {
    filled: () => ({ ...filled }),
    right: () => tilesRight(filled, a, sign),
    set(next) { filled = { ...next }; paint(); },
    clear() { filled = {}; paint(); onChange({}, {}); },
    dispose() {
      delete wrap.dataset.tilesLive;
      wrap.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      wrap.innerHTML = printed;
    },
  };
}
