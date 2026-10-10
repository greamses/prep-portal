/* ============================================================================
   CARD TRICKS — the table
   ----------------------------------------------------------------------------
   Cards lying on a table, and the four things hands do with them:

     PULL    drag the top card off a pile
     STACK   let a card (or a whole pile, carried by its tab) go over another
             and it lands on top
     TURN    tap a card to turn it over; tap a pile and the WHOLE pile turns
             over together — so what was underneath is now on top, exactly as
             it would be in your hand
     SHUFFLE a riffle: the pile is cut in two and the halves fall together

   The table knows nothing about any trick. It keeps piles honest — a pile is
   an ordered list, bottom card first — and tells whoever is listening when
   something has changed. The tricks (main.js) read the piles and say what
   they see.

   Places on the table are kept as SHARES of its width and height, so a pile
   stays where it was put when the window changes size.
   ========================================================================== */

import { faceSvg, backSvg } from "./art.js";
import { nameOf, riffle } from "./deck.js";

const wait = (ms) => new Promise((done) => setTimeout(done, ms));
const NARROW = 620;   // below this the table stands up instead of lying down

export function createTable(root, { onChange = () => {}, onRefuse = () => {} } = {}) {
  const cards = new Map();   // id → card
  let stacks = [];           // every pile, even a pile of one
  let mats = [];             // the marked places of the trick being played
  let matSpec = { wide: [], narrow: [] };
  let cardFrac = { wide: 0.105, narrow: 0.19 };
  let geo = { W: 1, H: 1, cw: 1, ch: 1, narrow: false };
  let nextStack = 1;
  let topZ = 1;
  let active = null;
  let drag = null;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const api = {
    /** Turn a card over as it is dealt from one place to another. */
    turn: false,
    canShuffle: true,
    busy: false,
    setup, addStack, layout, shuffle, deal, countOff, send, moveTo, flip, unlock,
    setMatNote, clearNotes, matStack, activeStack, topFirst,
    get stacks() { return stacks; },
    get cards() { return cards; },
  };

  /* ── building ───────────────────────────────────────────────────────────*/

  /**
   * Clear the table and mark out its places.
   *   mats   { wide: [{ id, label, x, y, hold? }], narrow: [...] }
   *   card   { wide, narrow } — a card's width as a share of the table's
   */
  function setup({ mats: spec = { wide: [], narrow: [] }, card = cardFrac } = {}) {
    root.innerHTML = "";
    cards.clear();
    stacks = [];
    active = null;
    drag = null;
    api.busy = false;
    matSpec = spec;
    cardFrac = card;
    mats = spec.wide.map((m) => {
      const el = document.createElement("div");
      el.className = "ct-mat";
      el.dataset.mat = m.id;
      el.innerHTML = `<span class="ct-mat__label">${m.label}</span><span class="ct-mat__note"></span>`;
      root.appendChild(el);
      return { ...m, el };
    });
    measure();
    layout(false);
  }

  function cardEl(card) {
    const el = document.createElement("div");
    /* pp-plain: a card answers to the keyboard, so the site-wide button sheet
       would dress it as a sticky note, with tape across the king of spades */
    el.className = "ct-card pp-plain";
    el.dataset.card = card.id;
    el.innerHTML =
      `<div class="ct-card__in">` +
      `<div class="ct-card__face">${faceSvg(card.face, { label: false })}</div>` +
      `<div class="ct-card__back">${backSvg(card.tone)}</div></div>`;
    return el;
  }

  /**
   * Put a pile down. `ids` are bottom card first.
   *   { mat } or { x, y }, up, tone ("red" | "blue"), locked, face (for a copy)
   */
  function addStack(ids, { mat = null, x = 0.5, y = 0.5, up = false, tone = "red", locked = false, face = null } = {}) {
    const stack = { id: nextStack++, x, y, mat, cards: [], z: ++topZ, locked };
    ids.forEach((id) => {
      const card = { id, face: face || id, up, tone, locked, stack, el: null, fx: null };
      card.el = cardEl(card);
      cards.set(id, card);
      stack.cards.push(id);
      root.appendChild(card.el);
    });
    stacks.push(stack);
    seat(stack);
    layout(false);
    return stack;
  }

  /* ── where things are ───────────────────────────────────────────────────*/

  function measure() {
    const r = root.getBoundingClientRect();
    const narrow = r.width < NARROW;
    root.classList.toggle("is-narrow", narrow);
    const W = r.width || 1;
    const H = root.getBoundingClientRect().height || 1;
    const cw = W * (narrow ? cardFrac.narrow : cardFrac.wide);
    geo = { W, H, cw, ch: cw * 1.4, narrow };
    root.style.setProperty("--ct-cw", `${cw}px`);
    const spec = narrow ? matSpec.narrow : matSpec.wide;
    mats.forEach((m) => {
      const at = spec.find((s) => s.id === m.id) || m;
      m.x = at.x; m.y = at.y;
      m.el.style.left = `${m.x * 100}%`;
      m.el.style.top = `${m.y * 100}%`;
    });
    stacks.forEach(seat);
  }

  /** A pile on a marked place sits exactly on it. */
  function seat(stack) {
    if (!stack.mat) return;
    const m = mats.find((x) => x.id === stack.mat);
    if (m) { stack.x = m.x; stack.y = m.y; }
  }

  function matStack(id) { return stacks.find((s) => s.mat === id) || null; }

  /** A face-down pile read the way you would deal it: top card first. */
  function topFirst(stack) { return stack.cards.slice().reverse(); }

  /** How far each card sits above the one under it — the pile's thickness. */
  const rise = () => Math.max(0.2, geo.cw * 0.0028);

  function place(card, i) {
    const s = card.stack;
    const d = rise();
    const fx = card.fx || {};
    const x = s.x * geo.W - geo.cw / 2 - i * d * 0.3 + (fx.dx || 0);
    const y = s.y * geo.H - geo.ch / 2 - i * d + (fx.dy || 0);
    const el = card.el;
    el.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
    el.style.rotate = `${fx.rot || 0}deg`;
    el.style.zIndex = String(s.z * 100 + i + (fx.z || 0));
    el.classList.toggle("is-up", card.up);
    const top = i === s.cards.length - 1;
    el.classList.toggle("is-top", top);
    el.classList.toggle("is-base", i === 0);
    el.classList.toggle("is-active", top && s === active && s.cards.length > 1);
    if (top) {
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      const what = card.up ? nameOf(card.face) : "a face-down card";
      el.setAttribute("aria-label", s.cards.length > 1 ? `A pile of ${s.cards.length}, ${what} on top` : what);
    } else {
      el.removeAttribute("tabindex");
      el.removeAttribute("role");
      el.removeAttribute("aria-label");
    }
  }

  function layout(animate = true) {
    root.classList.toggle("is-still", !animate);
    stacks.forEach((s) => s.cards.forEach((id, i) => place(cards.get(id), i)));
    grips();
    if (!animate) { void root.offsetWidth; root.classList.remove("is-still"); }
  }

  /* The tab under a pile: how many cards are in it, and the handle that
     carries the whole pile. One per pile of two or more. */
  function grips() {
    const have = new Map([...root.querySelectorAll(".ct-grip")].map((el) => [Number(el.dataset.stack), el]));
    stacks.forEach((s) => {
      let el = have.get(s.id);
      have.delete(s.id);
      if (s.cards.length < 2 || s.locked) { if (el) el.remove(); return; }
      if (!el) {
        el = document.createElement("div");
        el.className = "ct-grip";
        el.dataset.stack = String(s.id);
        root.appendChild(el);
      }
      el.textContent = String(s.cards.length);
      el.title = `Carry all ${s.cards.length} cards`;
      el.style.translate = `${(s.x * geo.W).toFixed(1)}px ${(s.y * geo.H + geo.ch / 2).toFixed(1)}px`;
      el.style.zIndex = String(s.z * 100 + 90);
      el.classList.toggle("is-active", s === active);
    });
    have.forEach((el) => el.remove());
  }

  /** The pile the Shuffle button means: the one last touched, else the biggest. */
  function activeStack() {
    if (active && stacks.includes(active) && active.cards.length > 1) return active;
    return stacks.filter((s) => !s.locked && s.cards.length > 1)
      .sort((a, b) => b.cards.length - a.cards.length)[0] || null;
  }

  /* ── turning over ───────────────────────────────────────────────────────*/

  /**
   * Turn a pile over, all of it together: every card shows its other side and
   * the order reverses, because the bottom card is now the one on top.
   */
  function flip(stack, { quiet = false } = {}) {
    stack.cards.reverse();
    stack.cards.forEach((id) => { const c = cards.get(id); c.up = !c.up; });
    stack.z = ++topZ;
    layout();
    if (!quiet) onChange({ type: "flip", stack });
  }

  function unlock(stack) {
    stack.locked = false;
    stack.cards.forEach((id) => { cards.get(id).locked = false; });
  }

  /* ── moving, by the program ─────────────────────────────────────────────*/

  function dropEmpty() {
    stacks = stacks.filter((s) => s.cards.length);
    if (active && !stacks.includes(active)) active = null;
  }

  /** Slide a whole pile onto a marked place, if nothing is lying there. */
  function moveTo(stack, matId) {
    if (stack.mat === matId || matStack(matId)) return;
    stack.mat = matId;
    seat(stack);
    stack.z = ++topZ;
    layout();
  }

  /** Take one card to a marked place, on top of whatever lies there. */
  function send(cardId, matId, { up = null } = {}) {
    const card = cards.get(cardId);
    const from = card.stack;
    from.cards.splice(from.cards.indexOf(cardId), 1);
    let to = matStack(matId);
    if (!to) {
      to = { id: nextStack++, x: 0, y: 0, mat: matId, cards: [], z: ++topZ, locked: false };
      stacks.push(to);
      seat(to);
    }
    to.cards.push(cardId);
    to.z = ++topZ;
    card.stack = to;
    if (up !== null) card.up = up;
    dropEmpty();
    layout();
  }

  /**
   * Deal a pile out, top card first, one to each place in turn — the way a
   * dealer does it. `turn` turns each card over as it lands.
   */
  async function deal(stack, matIds, { turn = true, gap = 75 } = {}) {
    if (api.busy) return;
    api.busy = true;
    const n = stack.cards.length;
    for (let i = 0; i < n; i++) {
      const id = stack.cards[stack.cards.length - 1];
      const card = cards.get(id);
      send(id, matIds[i % matIds.length], { up: turn ? !card.up : card.up });
      await wait(still ? 0 : gap);
    }
    await wait(still ? 0 : 260);
    api.busy = false;
    onChange({ type: "deal" });
  }

  /**
   * Count cards off the top of a pile onto one place, and turn the last of
   * them face up on another. Returns the card that was turned.
   */
  async function countOff(stack, n, toMat, showMat) {
    if (api.busy || stack.cards.length < n) return null;
    api.busy = true;
    for (let i = 1; i < n; i++) {
      send(stack.cards[stack.cards.length - 1], toMat);
      setMatNote(toMat, String(i));
      await wait(still ? 0 : 170);
    }
    const id = stack.cards[stack.cards.length - 1];
    await wait(still ? 0 : 320);
    send(id, showMat, { up: true });
    setMatNote(showMat, `card ${n}`, "ok");
    await wait(still ? 0 : 420);
    api.busy = false;
    onChange({ type: "count", card: id });
    return id;
  }

  /* ── the shuffle ────────────────────────────────────────────────────────
     Three riffles and a cut. Each riffle is the real thing (deck.js): the
     pile is split where the coin tosses put the cut, the two halves are held
     apart and tipped toward each other, and the cards drop from one half or
     the other in the very order the new pile will have. What you watch is
     the shuffle that happened, not a flourish laid over a random order. */

  async function shuffle(stack = activeStack(), rnd = Math.random) {
    if (api.busy || !stack || stack.cards.length < 2) return false;
    if (!api.canShuffle) { onRefuse({ why: "shuffle" }); return false; }
    api.busy = true;
    stack.z = ++topZ;
    root.classList.add("is-shuffling");
    const d = rise();
    const n = stack.cards.length;
    const spread = geo.cw * 0.62;

    for (let round = 0; round < 3 && !still; round++) {
      const before = stack.cards.slice();
      const { order, from, cut: at } = riffle(before, rnd);
      /* held apart: the lower half goes left, the upper comes down to the
         table on the right */
      before.forEach((id, i) => {
        const left = i < at;
        cards.get(id).fx = { dx: left ? -spread : spread, dy: left ? 0 : at * d, rot: left ? 7 : -7 };
      });
      layout();
      await wait(300);
      /* and let fall, one card at a time, into the new order */
      stack.cards = order;
      const beat = Math.min(26, 520 / n);
      const seen = [0, 0];
      order.forEach((id, i) => {
        const card = cards.get(id);
        const side = from[i];
        /* until its turn it waits in its half, at the height it has there */
        const inHalf = seen[side]++;
        card.fx = { dx: side ? spread : -spread, dy: (i - inHalf) * d, rot: side ? -7 : 7 };
        setTimeout(() => { card.fx = null; place(card, i); }, i * beat);
      });
      layout(false);
      await wait(n * beat + 300);
    }

    if (still) {
      for (let i = 0; i < 3; i++) stack.cards = riffle(stack.cards, rnd).order;
    }

    /* the cut: the top packet is lifted off, and goes underneath */
    const cutAt = 1 + Math.floor(rnd() * (n - 1));
    if (!still) {
      stack.cards.forEach((id, i) => { cards.get(id).fx = i >= cutAt ? { dx: geo.cw * 1.12, dy: cutAt * d } : null; });
      layout();
      await wait(300);
    }
    stack.cards = stack.cards.slice(cutAt).concat(stack.cards.slice(0, cutAt));
    if (!still) {
      /* what was lifted is on the table now; the rest comes over onto it */
      const lifted = n - cutAt;
      stack.cards.forEach((id, i) => { cards.get(id).fx = i < lifted ? { dx: geo.cw * 1.12 } : { dy: lifted * d }; });
      layout(false);
      await wait(30);
      stack.cards.forEach((id, i) => { cards.get(id).fx = i < lifted ? { dx: geo.cw * 1.12 } : { dx: geo.cw * 1.12, dy: 0 }; });
      layout();
      await wait(300);
      stack.cards.forEach((id) => { cards.get(id).fx = null; });
    }
    layout();
    await wait(still ? 0 : 280);
    root.classList.remove("is-shuffling");
    api.busy = false;
    onChange({ type: "shuffle", stack });
    return true;
  }

  /* ── the marked places ──────────────────────────────────────────────────*/

  function setMatNote(id, text = "", tone = "") {
    const m = mats.find((x) => x.id === id);
    if (!m) return;
    const note = m.el.querySelector(".ct-mat__note");
    note.textContent = text;
    m.el.dataset.tone = tone;
  }
  function clearNotes() { mats.forEach((m) => setMatNote(m.id)); }

  /* ── hands ──────────────────────────────────────────────────────────────*/

  /** The pile a carried pile would land on: its centre is over it. */
  function stackUnder(moving) {
    let best = null;
    let bestD = Infinity;
    stacks.forEach((s) => {
      if (s === moving || s.locked) return;
      const dx = Math.abs(s.x - moving.x) * geo.W;
      const dy = Math.abs(s.y - moving.y) * geo.H;
      if (dx > geo.cw * 0.62 || dy > geo.ch * 0.62) return;
      const dist = Math.hypot(dx, dy);
      if (dist < bestD) { best = s; bestD = dist; }
    });
    return best;
  }

  function matUnder(moving) {
    let best = null;
    let bestD = Infinity;
    mats.forEach((m) => {
      if (m.hold || matStack(m.id)) return;
      const dx = Math.abs(m.x - moving.x) * geo.W;
      const dy = Math.abs(m.y - moving.y) * geo.H;
      if (dx > geo.cw * 0.62 || dy > geo.ch * 0.62) return;
      const dist = Math.hypot(dx, dy);
      if (dist < bestD) { best = m; bestD = dist; }
    });
    return best;
  }

  function showTarget(moving) {
    const s = moving ? stackUnder(moving) : null;
    const m = moving && !s ? matUnder(moving) : null;
    root.querySelectorAll(".ct-card.is-over").forEach((el) => el.classList.remove("is-over"));
    mats.forEach((x) => x.el.classList.toggle("is-over", x === m));
    if (s) cards.get(s.cards[s.cards.length - 1]).el.classList.add("is-over");
  }

  function carry(stack, on) {
    stack.cards.forEach((id) => cards.get(id).el.classList.toggle("is-dragging", on));
    const grip = root.querySelector(`.ct-grip[data-stack="${stack.id}"]`);
    if (grip) grip.classList.toggle("is-dragging", on);
    root.classList.toggle("is-carrying", on);
  }

  function down(e) {
    if (api.busy || drag) return;
    const gripEl = e.target.closest(".ct-grip");
    const el = gripEl || e.target.closest(".ct-card");
    if (!el || !root.contains(el)) return;
    const stack = gripEl
      ? stacks.find((s) => s.id === Number(gripEl.dataset.stack))
      : cards.get(el.dataset.card).stack;
    if (!stack) return;
    e.preventDefault();
    const r = root.getBoundingClientRect();
    drag = {
      kind: gripEl ? "stack" : "card",
      stack, origin: null, fromMat: null, pulled: false, moved: false,
      pointer: e.pointerId, x0: e.clientX, y0: e.clientY,
      /* where on the pile it was taken, so it does not jump to the finger */
      dx: e.clientX - (r.left + stack.x * geo.W), dy: e.clientY - (r.top + stack.y * geo.H),
    };
    if (!stack.locked && stack.cards.length > 1) active = stack;
  }

  function move(e) {
    if (!drag || e.pointerId !== drag.pointer) return;
    if (!drag.moved) {
      /* A press that has not travelled is still a tap. */
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      if (drag.stack.locked) { const s = drag.stack; drag = null; onRefuse({ why: "locked", stack: s }); return; }
      drag.moved = true;
      const from = drag.stack;
      if (drag.kind === "card" && from.cards.length > 1) {
        /* PULL: the top card comes away and is a pile of one in the hand */
        const id = from.cards.pop();
        const one = { id: nextStack++, x: from.x, y: from.y - (from.cards.length * rise()) / geo.H, mat: null, cards: [id], z: 0, locked: false };
        cards.get(id).stack = one;
        stacks.push(one);
        drag.origin = from;
        drag.pulled = true;
        drag.stack = one;
      } else {
        drag.fromMat = from.mat;
        from.mat = null;
      }
      drag.stack.z = ++topZ;
      carry(drag.stack, true);
    }
    const r = root.getBoundingClientRect();
    drag.stack.x = (e.clientX - drag.dx - r.left) / geo.W;
    drag.stack.y = (e.clientY - drag.dy - r.top) / geo.H;
    layout(false);
    carry(drag.stack, true);
    showTarget(drag.stack);
  }

  function up(e) {
    if (!drag || e.pointerId !== drag.pointer) return;
    const d = drag;
    drag = null;
    if (!d.moved) { tap(d.stack); return; }
    const moving = d.stack;
    carry(moving, false);
    showTarget(null);

    /* A card is DEALT when it leaves a pile, or a marked place, for another. */
    const dealt = api.turn && d.kind === "card" && (d.pulled || d.fromMat);
    const onto = stackUnder(moving);
    const mat = onto ? null : matUnder(moving);
    let landed = moving;

    if (onto) {
      if (dealt && onto !== d.origin) moving.cards.forEach((id) => { const c = cards.get(id); c.up = !c.up; });
      moving.cards.forEach((id) => { cards.get(id).stack = onto; onto.cards.push(id); });
      moving.cards = [];
      onto.z = ++topZ;
      landed = onto;
    } else if (mat) {
      if (dealt && mat.id !== d.fromMat) moving.cards.forEach((id) => { const c = cards.get(id); c.up = !c.up; });
      moving.mat = mat.id;
      seat(moving);
    } else {
      /* anywhere else: it lies where it was let go, kept on the table */
      const mx = (geo.cw / 2) / geo.W;
      const my = (geo.ch / 2) / geo.H;
      moving.x = Math.max(mx, Math.min(1 - mx, moving.x));
      moving.y = Math.max(my, Math.min(1 - my, moving.y));
    }
    dropEmpty();
    if (!landed.locked && landed.cards.length > 1) active = landed;
    layout();
    onChange({ type: "drop", stack: landed });
  }

  function tap(stack) {
    if (api.busy) return;
    if (stack.locked) { onRefuse({ why: "locked", stack }); return; }
    flip(stack);
  }

  root.addEventListener("pointerdown", down);
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
  document.addEventListener("pointercancel", up);

  /* Enter or Space on a card turns it, as a tap does. */
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = e.target.closest(".ct-card");
    if (!el) return;
    e.preventDefault();
    tap(cards.get(el.dataset.card).stack);
  });

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => { if (!drag) { measure(); layout(false); } }).observe(root);
  }

  return api;
}
