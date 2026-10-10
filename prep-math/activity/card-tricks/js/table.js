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

   The table is FREE: there are no marked places and nothing snaps. A card
   lies where it is let go. The program has a few places of its own in mind
   (`spots`) for where IT puts things — the pack, a dealt pile, a counted
   card — but they are not drawn and a pile can be carried off any of them.

   The table knows nothing about any trick. It keeps piles honest — a pile is
   an ordered list, bottom card first — and tells whoever is listening when
   something has changed. The tricks (main.js) read the piles and say what
   they see.

   Places are kept as SHARES of the table's width and height, so a pile stays
   where it was put when the window changes size.
   ========================================================================== */

import { faceSvg, backSvg } from "./art.js";
import { nameOf, riffle } from "./deck.js";

const wait = (ms) => new Promise((done) => setTimeout(done, ms));
const between = (lo, hi) => lo + Math.random() * (hi - lo);

export function createTable(root, { onChange = () => {}, onRefuse = () => {}, onDouble = () => {} } = {}) {
  const cards = new Map();   // id → card
  let stacks = [];           // every pile, even a pile of one
  let spotSpec = { wide: [], narrow: [] };
  let spots = [];
  let size = { wide: [0.13, 0.19], narrow: [0.24, 0.15] };
  let geo = { W: 1, H: 1, cw: 1, ch: 1, narrow: false };
  let nextStack = 1;
  let topZ = 1;
  let active = null;
  let drag = null;
  let lastTap = { stack: null, at: 0 };
  /* Every time the table is cleared a new ERA begins. A shuffle or a deal
     that was half way through when that happened belongs to the old one: its
     cards are gone, and it stops at its next breath instead of reaching for
     them. */
  let era = 0;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const api = {
    /** Flip deal: a card drawn off a pile turns over as it is put down, whichever way up it was. */
    turn: false,
    /** While the program is doing something of several steps, hands are kept off. */
    frozen: false,
    /** CHOOSING: when this is set, a press on any card is handed to it (the card, its pile) and nothing is moved. */
    pick: null,
    canShuffle: true,
    busy: false,
    still,
    setup, addStack, layout, shuffle, deal, dealOff, where, slide, countOff, send, moveTo, take, stackOnto, flip, unlock,
    lift, settle, setNote, clearNotes, point, tagged, spotStack, activeStack, topFirst,
    get stacks() { return stacks; },
    get cards() { return cards; },
  };

  /* ── building ───────────────────────────────────────────────────────────*/

  /**
   * Clear the table.
   *   spots  { wide: [{ id, x, y }], narrow: [...] } — where the program puts things
   *   card   { wide: [w, h], narrow: [w, h] } — a card is as wide as the smaller
   *          of w × the table's width and h × its height
   */
  function setup({ spots: spec = { wide: [], narrow: [] }, card = size } = {}) {
    era += 1;
    root.innerHTML = "";
    cards.clear();
    stacks = [];
    active = null;
    drag = null;
    api.busy = false;
    api.frozen = false;
    api.pick = null;
    spotSpec = spec;
    size = card;
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

  /* No hand squares a card perfectly. Each card lies a hair off true. */
  const lean = (loose = false) => ({ r: between(-1, 1) * (loose ? 2.6 : 1.1), x: between(-1, 1), y: between(-0.6, 0.6) });

  /**
   * Put a pile down. `ids` are bottom card first.
   *   { spot } or { x, y }, up, tone ("red" | "blue"), locked, face (for a copy),
   *   tag (a name the pile keeps wherever it is carried)
   */
  function addStack(ids, { spot = null, x = 0.5, y = 0.5, up = false, tone = "red", locked = false, face = null, tag = null } = {}) {
    const stack = { id: nextStack++, x, y, mat: spot, tag: tag || spot, cards: [], z: ++topZ, locked, note: null, wasPile: ids.length > 1 };
    ids.forEach((id) => {
      const card = { id, face: face || id, up, tone, locked, stack, el: null, fx: null, j: lean() };
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
    const W = r.width || 1;
    const H = r.height || 1;
    const narrow = W < H * 0.85;
    const [fw, fh] = narrow ? size.narrow : size.wide;
    const cw = Math.max(54, Math.min(W * fw, H * fh, 240));
    geo = { W, H, cw, ch: cw * 1.4, narrow };
    root.classList.toggle("is-narrow", narrow);
    root.style.setProperty("--ct-cw", `${cw}px`);
    spots = (narrow ? spotSpec.narrow : spotSpec.wide).map((s) => ({ ...s }));
    stacks.forEach(seat);
  }

  const spotAt = (id) => spots.find((s) => s.id === id) || null;

  /** A pile the program put somewhere, and nobody has carried off, sits exactly there. */
  function seat(stack) {
    const s = stack.mat && spotAt(stack.mat);
    if (s) { stack.x = s.x; stack.y = s.y; }
  }

  /** The pile lying on one of the program's places. */
  function spotStack(id) { return stacks.find((s) => s.mat === id) || null; }
  /** The pile that carries a name, wherever it has been carried. */
  function tagged(tag) { return stacks.find((s) => s.tag === tag) || null; }

  /** A face-down pile read the way you would deal it: top card first. */
  function topFirst(stack) { return stack.cards.slice().reverse(); }

  /** How far each card sits above the one under it — the pile's thickness. */
  const rise = () => Math.max(0.2, geo.cw * 0.0026);

  function place(card, i) {
    const s = card.stack;
    const d = rise();
    const fx = card.fx || {};
    const j = card.fx ? { r: 0, x: 0, y: 0 } : card.j;
    /* A pile is a heap, each card a hair above the last — unless it is
       FANNED: laid out as a column, the first card at the top and a strip of
       every card showing, so that all of them can be read. */
    /* … or opened out sideways (fanX), a hand of cards to choose from. */
    const x = s.x * geo.W - geo.cw / 2 + (s.fanX ? i * s.fanX * geo.cw : s.fan ? 0 : -i * d * 0.3) + (fx.dx || 0) + j.x;
    const y = s.y * geo.H - geo.ch / 2 + (s.fan ? i * s.fan * geo.ch : s.fanX ? 0 : -i * d) + (fx.dy || 0) + j.y;
    const el = card.el;
    el.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
    el.style.rotate = `${((fx.rot || 0) + j.r).toFixed(2)}deg`;
    el.style.zIndex = String(s.z * 100 + i + (fx.z || 0));
    el.classList.toggle("is-up", card.up);
    const top = i === s.cards.length - 1;
    el.classList.toggle("is-top", top);
    el.classList.toggle("is-base", i === 0);
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
    tabs();
    if (!animate) { void root.offsetWidth; root.classList.remove("is-still"); }
  }

  /* Under a pile: the TAB — how many cards are in it, and the handle that
     carries all of them — and, when a trick has something to say about this
     pile, a word or a number beneath that. */
  function tabs() {
    const have = new Map([...root.querySelectorAll(".ct-tab")].map((el) => [Number(el.dataset.stack), el]));
    stacks.forEach((s) => {
      let el = have.get(s.id);
      have.delete(s.id);
      const many = s.cards.length > 1 && !s.locked && !s.fanX;
      if (!many && !s.note && !s.point) { if (el) el.remove(); return; }
      if (!el) {
        el = document.createElement("div");
        el.className = "ct-tab";
        el.dataset.stack = String(s.id);
        el.innerHTML = `<span class="ct-grip"></span><span class="ct-note"></span><span class="ct-point" hidden></span>`;
        root.appendChild(el);
      }
      const grip = el.firstChild;
      const note = grip.nextSibling;
      const hand = el.lastChild;
      hand.hidden = !s.point;
      if (s.point && hand.dataset.is !== s.point) { hand.dataset.is = s.point; hand.innerHTML = s.point; }
      /* it stands clear of the top of the pile, however thick the pile is */
      hand.style.bottom = `${(geo.ch + s.cards.length * rise() + 10).toFixed(1)}px`;
      grip.hidden = !many;
      grip.textContent = String(s.cards.length);
      grip.title = "Carry the whole pile";
      grip.classList.toggle("is-active", s === active);
      note.hidden = !s.note;
      note.textContent = s.note ? s.note.text : "";
      note.dataset.tone = s.note ? s.note.tone : "";
      el.style.translate = `${(s.x * geo.W).toFixed(1)}px ${(s.y * geo.H + geo.ch / 2 + (s.fan ? (s.cards.length - 1) * s.fan * geo.ch : 0)).toFixed(1)}px`;
      el.style.zIndex = String(s.z * 100 + 90);
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

  /** Slide a pile to one of the program's places, whatever else is there. */
  function slide(stack, spotId) {
    stack.mat = spotId;
    seat(stack);
    stack.z = ++topZ;
    layout();
  }

  /** Slide a whole pile onto one of the program's places, if nothing is lying there. */
  function moveTo(stack, spotId) {
    if (stack.mat === spotId || spotStack(spotId) || !spotAt(spotId)) return;
    stack.mat = spotId;
    seat(stack);
    stack.z = ++topZ;
    layout();
  }

  /**
   * Lift the top `n` cards off a pile, as one packet, and set them down as a
   * pile of their own — on one of the program's places, or where they are.
   */
  function take(stack, n, { spot = null, tag = null } = {}) {
    const ids = stack.cards.splice(stack.cards.length - n, n);
    const packet = { id: nextStack++, x: stack.x, y: stack.y, mat: spot, tag, cards: ids, z: ++topZ, locked: false, note: null, wasPile: n > 1 };
    ids.forEach((id) => { cards.get(id).stack = packet; });
    stacks.push(packet);
    seat(packet);
    dropEmpty();
    layout();
    return packet;
  }

  /** Carry one pile over another and set it down on top. */
  async function stackOnto(moving, onto) {
    const mine = era;
    moving.mat = null;
    moving.x = onto.x;
    moving.y = onto.y - (onto.cards.length * rise()) / geo.H;
    moving.z = ++topZ;
    layout();
    await wait(still ? 0 : 330);
    if (era !== mine) return null;
    moving.cards.forEach((id) => { const c = cards.get(id); c.stack = onto; c.j = lean(); onto.cards.push(id); });
    if (moving.tag && !onto.tag) onto.tag = moving.tag;
    moving.cards = [];
    onto.z = ++topZ;
    onto.wasPile = true;
    dropEmpty();
    layout();
    await wait(still ? 0 : 110);
    if (era !== mine) return null;
  }

  /** Take one card to one of the program's places, on top of whatever lies there. */
  function send(cardId, spotId, { up = null } = {}) {
    const card = cards.get(cardId);
    const from = card.stack;
    from.cards.splice(from.cards.indexOf(cardId), 1);
    let to = spotStack(spotId);
    if (!to) {
      to = { id: nextStack++, x: 0.5, y: 0.5, mat: spotId, tag: spotId, cards: [], z: ++topZ, locked: false, note: null, wasPile: false };
      stacks.push(to);
      seat(to);
    }
    to.cards.push(cardId);
    to.z = ++topZ;
    card.stack = to;
    card.j = lean();
    if (up !== null) card.up = up;
    dropEmpty();
    layout();
  }

  /**
   * Draw a card out of its pile to one of the program's places, without
   * taking it out of the order: it is still the 44th card, it is just where
   * it can be seen. `settle` lets it go back.
   */
  function lift(cardId, spotId) {
    const card = cards.get(cardId);
    const s = spotAt(spotId);
    if (!s) return;
    const i = card.stack.cards.indexOf(cardId);
    card.fx = {
      dx: (s.x - card.stack.x) * geo.W + i * rise() * 0.3,
      dy: (s.y - card.stack.y) * geo.H + i * rise(),
    };
    layout();
  }
  function settle(cardId) {
    cards.get(cardId).fx = null;
    layout();
  }

  /**
   * Deal a pile out, top card first, one to each place in turn — the way a
   * dealer does it. `turn` turns each card over as it lands.
   */
  async function deal(stack, spotIds, { turn = true, gap = 80, fan = 0 } = {}) {
    const mine = era;
    if (api.busy) return;
    api.busy = true;
    const n = stack.cards.length;
    for (let i = 0; i < n; i++) {
      const id = stack.cards[stack.cards.length - 1];
      const card = cards.get(id);
      send(id, spotIds[i % spotIds.length], { up: turn ? !card.up : card.up });
      /* dealt as columns, if asked: each card lands below the last */
      const to = spotStack(spotIds[i % spotIds.length]);
      if (fan && to && to.fan !== fan) { to.fan = fan; layout(); }
      await wait(still ? 0 : gap);
      if (era !== mine) return null;
    }
    await wait(still ? 0 : 260);
    if (era !== mine) return null;
    api.busy = false;
    onChange({ type: "deal" });
  }

  /** Where a pile is on the screen: the middle of its top card, and a card's size. */
  function where(stack) {
    const r = root.getBoundingClientRect();
    return { x: r.left + stack.x * geo.W, y: r.top + stack.y * geo.H - stack.cards.length * rise(), cw: geo.cw, ch: geo.ch };
  }

  /**
   * DEAL SEVERAL: count `n` cards off the top of a pile, one at a time, onto
   * a pile beside it — the way a hand counts cards down. Each is flip-dealt if
   * flip deal is on, and the last one counted ends up on top. Asking again
   * goes on counting onto the same pile, unless it has been carried away.
   */
  async function dealOff(stack, n) {
    const mine = era;
    if (api.busy || api.frozen || stack.locked) return null;
    n = Math.max(0, Math.min(Math.floor(n) || 0, stack.cards.length));
    if (!n) return null;
    api.busy = true;
    let to = stack.dealtTo;
    if (!to || !stacks.includes(to) || to.x !== to.hx || to.y !== to.hy) {
      /* beside the pile, on whichever side has room: toward the middle of
         the table first, then under it, then the other side, then over it */
      const mx = (geo.cw / 2) / geo.W;
      const my = (geo.ch / 2) / geo.H;
      const sx = (geo.cw * 1.14) / geo.W;
      const sy = (geo.ch * 1.16) / geo.H;
      const side = stack.x < 0.5 ? 1 : -1;
      const free = ([x, y]) => x >= mx && x <= 1 - mx && y >= my && y <= 1 - my
        && !stacks.some((o) => Math.abs(o.x - x) * geo.W < geo.cw * 0.9 && Math.abs(o.y - y) * geo.H < geo.ch * 0.9);
      const tries = [[stack.x + side * sx, stack.y], [stack.x, stack.y + sy], [stack.x - side * sx, stack.y], [stack.x, stack.y - sy]];
      const [x, y] = tries.find(free) || [Math.max(mx, Math.min(1 - mx, tries[0][0])), stack.y];
      to = { id: nextStack++, x, y, mat: null, tag: null, cards: [], z: ++topZ, locked: false, note: null, wasPile: false };
      to.hx = to.x;
      to.hy = to.y;
      stacks.push(to);
      stack.dealtTo = to;
    }
    for (let i = 0; i < n; i++) {
      const id = stack.cards.pop();
      const card = cards.get(id);
      card.stack = to;
      to.cards.push(id);
      if (api.turn) card.up = !card.up;
      card.j = lean();
      to.z = ++topZ;
      layout();
      await wait(still ? 0 : Math.max(60, 150 - n * 3));
      if (era !== mine) return null;
    }
    if (to.cards.length > 1) to.wasPile = true;
    dropEmpty();
    active = to.cards.length > 1 ? to : active;
    layout();
    api.busy = false;
    onChange({ type: "drop", stack: to });
    return to;
  }

  /**
   * Count cards off the top of a pile onto one place, and turn the last of
   * them face up on another. Returns the card that was turned.
   */
  async function countOff(stack, n, toSpot, showSpot) {
    const mine = era;
    if (api.busy || stack.cards.length < n) return null;
    api.busy = true;
    for (let i = 1; i < n; i++) {
      /* the tab under the counted pile is the count */
      send(stack.cards[stack.cards.length - 1], toSpot);
      await wait(still ? 0 : 190);
      if (era !== mine) return null;
    }
    const id = stack.cards[stack.cards.length - 1];
    await wait(still ? 0 : 340);
    if (era !== mine) return null;
    send(id, showSpot, { up: true });
    setNote(spotStack(showSpot), String(n), "ok");
    await wait(still ? 0 : 440);
    if (era !== mine) return null;
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
    const mine = era;
    if (api.busy || !stack || stack.cards.length < 2) return false;
    if (!api.canShuffle) { onRefuse({ why: "shuffle" }); return false; }
    api.busy = true;
    stack.z = ++topZ;
    root.classList.add("is-shuffling");
    const d = rise();
    const n = stack.cards.length;
    const spread = geo.cw * 0.6;

    /* the mesh: how far a card dropped from one half stands off the middle
       before the halves are pushed home — what makes a riffle look like one */
    const mesh = geo.cw * 0.13;
    for (let round = 0; round < 3 && !still; round++) {
      const before = stack.cards.slice();
      const { order, from, cut: at } = riffle(before, rnd);
      /* cut: the upper half is lifted clear … */
      before.forEach((id, i) => { cards.get(id).fx = i < at ? null : { dy: -geo.ch * 0.16 }; });
      layout();
      await wait(170);
      if (era !== mine) return null;
      /* … and the two are held apart, tipped in toward each other, the lower
         half on the left and the upper come down to the table on the right */
      before.forEach((id, i) => {
        const left = i < at;
        cards.get(id).fx = { dx: left ? -spread : spread, dy: left ? 0 : at * d, rot: left ? 9 : -9 };
      });
      layout();
      await wait(330);
      if (era !== mine) return null;
      /* let fall, a card at a time and in the order the new pile will have:
         each lands a little to its own side, so the two halves are seen woven */
      stack.cards = order;
      const beat = Math.max(14, Math.min(30, 760 / n));
      const seen = [0, 0];
      order.forEach((id, i) => {
        const card = cards.get(id);
        const side = from[i];
        /* until its turn it waits in its half, at the height it has there */
        const inHalf = seen[side]++;
        card.fx = { dx: side ? spread : -spread, dy: (i - inHalf) * d, rot: side ? -9 : 9 };
        setTimeout(() => { card.fx = { dx: side ? mesh : -mesh, rot: side ? -2.5 : 2.5 }; place(card, i); }, i * beat);
      });
      layout(false);
      await wait(n * beat + 260);
      if (era !== mine) return null;
      /* pushed home and squared */
      root.classList.add("is-squaring");
      order.forEach((id) => { const card = cards.get(id); card.fx = null; card.j = { r: 0, x: 0, y: 0 }; });
      layout();
      await wait(240);
      if (era !== mine) return null;
      root.classList.remove("is-squaring");
    }

    if (still) {
      for (let i = 0; i < 3; i++) stack.cards = riffle(stack.cards, rnd).order;
    }

    /* the cut: the top packet is lifted off, and goes underneath — somewhere
       near the middle, as a hand does it, not one card off the top */
    const cutAt = n < 6 ? 1 + Math.floor(rnd() * (n - 1)) : Math.round(n * (0.3 + rnd() * 0.4));
    const aside = geo.cw * 1.1 * (stack.x > 0.6 ? -1 : 1);
    if (!still) {
      stack.cards.forEach((id, i) => { cards.get(id).fx = i >= cutAt ? { dx: aside, dy: cutAt * d } : null; });
      layout();
      await wait(300);
      if (era !== mine) return null;
    }
    stack.cards = stack.cards.slice(cutAt).concat(stack.cards.slice(0, cutAt));
    if (!still) {
      /* what was lifted is on the table now; the rest comes over onto it */
      const lifted = n - cutAt;
      stack.cards.forEach((id, i) => { cards.get(id).fx = i < lifted ? { dx: aside } : { dy: lifted * d }; });
      layout(false);
      await wait(30);
      if (era !== mine) return null;
      stack.cards.forEach((id) => { cards.get(id).fx = { dx: aside }; });
      layout();
      await wait(300);
      if (era !== mine) return null;
      stack.cards.forEach((id) => { const card = cards.get(id); card.fx = null; card.j = lean(); });
    }
    layout();
    await wait(still ? 0 : 300);
    if (era !== mine) return null;
    root.classList.remove("is-shuffling");
    api.busy = false;
    onChange({ type: "shuffle", stack });
    return true;
  }

  /* ── what a trick says about a pile ─────────────────────────────────────*/

  function setNote(stack, text = "", tone = "") {
    if (!stack) return;
    stack.note = text ? { text, tone } : null;
    tabs();
  }
  function clearNotes() {
    stacks.forEach((s) => { s.note = null; s.point = null; });
    tabs();
  }
  /** Point at one pile, from above, with whatever is handed in (an arrow, a word). */
  function point(stack, html = "") {
    stacks.forEach((s) => { s.point = s === stack ? html : null; });
    tabs();
  }

  /* ── hands ──────────────────────────────────────────────────────────────*/

  /** The pile a carried pile would land on: its centre is over it. */
  function stackUnder(moving) {
    let best = null;
    let bestD = Infinity;
    stacks.forEach((s) => {
      if (s === moving || (s.locked && !s.accepts)) return;
      const dx = Math.abs(s.x - moving.x) * geo.W;
      const dy = Math.abs(s.y - moving.y) * geo.H;
      if (dx > geo.cw * 0.6 || dy > geo.ch * 0.6) return;
      const dist = Math.hypot(dx, dy);
      if (dist < bestD) { best = s; bestD = dist; }
    });
    return best;
  }

  function showTarget(moving) {
    const s = moving ? stackUnder(moving) : null;
    root.querySelectorAll(".ct-card.is-over").forEach((el) => el.classList.remove("is-over"));
    if (s) cards.get(s.cards[s.cards.length - 1]).el.classList.add("is-over");
  }

  function carry(stack, on) {
    stack.cards.forEach((id) => cards.get(id).el.classList.toggle("is-dragging", on));
    const tab = root.querySelector(`.ct-tab[data-stack="${stack.id}"]`);
    if (tab) tab.classList.toggle("is-dragging", on);
    root.classList.toggle("is-carrying", on);
  }

  function down(e) {
    /* CHOOSING: a press on a card is an answer, not the start of a drag */
    if (api.pick && !drag) {
      const chosen = e.target.closest(".ct-card");
      if (chosen && root.contains(chosen) && !api.busy) {
        e.preventDefault();
        const card = cards.get(chosen.dataset.card);
        if (card && !card.locked) api.pick(card.id, card.stack);
      }
      return;
    }
    if (api.busy || api.frozen || drag) return;
    const gripEl = e.target.closest(".ct-grip");
    const el = gripEl || e.target.closest(".ct-card");
    if (!el || !root.contains(el)) return;
    const stack = gripEl
      ? stacks.find((s) => s.id === Number(gripEl.parentNode.dataset.stack))
      : cards.get(el.dataset.card).stack;
    if (!stack) return;
    e.preventDefault();
    const r = root.getBoundingClientRect();
    drag = {
      kind: gripEl ? "stack" : "card",
      stack, origin: null, pulled: false, moved: false,
      pointer: e.pointerId, x0: e.clientX, y0: e.clientY,
      /* where on the pile it was taken, so it does not jump to the finger */
      dx: e.clientX - (r.left + stack.x * geo.W), dy: e.clientY - (r.top + stack.y * geo.H),
    };
    if (!stack.locked && stack.cards.length > 1) { active = stack; tabs(); }
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
        const up = from.cards.length * rise();
        const one = { id: nextStack++, x: from.x, y: from.y - up / geo.H, mat: null, tag: null, cards: [id], z: 0, locked: false, note: null, wasPile: false };
        cards.get(id).stack = one;
        stacks.push(one);
        drag.origin = from;
        drag.pulled = true;
        drag.stack = one;
        drag.dy += up;
      } else {
        /* the last card of a pile that has been dealt down to one is still
           being dealt; a card that was always on its own is just being moved */
        drag.pulled = drag.kind === "card" && !!from.wasPile;
        from.mat = null;
      }
      /* FLIP DEAL is settled now, as the card comes off its pile — but the
         card is not turned until it is put DOWN. In the hand it shows what it
         showed on the pile, so a card carried face down to the computer's
         copy is not seen until the two are turned over together. */
      drag.deal = api.turn && drag.pulled;
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

    let onto = stackUnder(moving);
    let landed = moving;

    /* OFFERED: a single card let go over a pile that takes offers is not
       stacked on it. It is laid beside it, and whoever is listening is told. */
    if (onto && onto.accepts) {
      if (moving.cards.length === 1) {
        moving.x = onto.x + (geo.cw * 0.42 * (onto.x > 0.7 ? -1 : 1)) / geo.W;
        moving.y = onto.y + (geo.ch * 0.1) / geo.H;
        moving.z = ++topZ;
        moving.wasPile = false;
        layout();
        onChange({ type: "offer", stack: moving, onto });
        return;
      }
      onRefuse({ why: "one", stack: onto });
      onto = null;
    }

    if (onto) {
      /* dealt onto another pile: it turns over as it lands. Put straight
         back where it came from, it was never dealt. */
      if (d.deal && onto !== d.origin) moving.cards.forEach((id) => { const c = cards.get(id); c.up = !c.up; });
      moving.cards.forEach((id) => { const c = cards.get(id); c.stack = onto; c.j = lean(); onto.cards.push(id); });
      /* a pile that has a name keeps it when it is put on another */
      if (moving.tag && !onto.tag) onto.tag = moving.tag;
      moving.cards = [];
      onto.z = ++topZ;
      landed = onto;
    } else {
      if (d.deal) moving.cards.forEach((id) => { const c = cards.get(id); c.up = !c.up; });
      /* it lies where it was let go, kept on the table */
      const mx = (geo.cw / 2) / geo.W;
      const my = (geo.ch / 2) / geo.H;
      moving.x = Math.max(mx, Math.min(1 - mx, moving.x));
      moving.y = Math.max(my, Math.min(1 - my, moving.y));
      if (moving.cards.length === 1) { cards.get(moving.cards[0]).j = lean(true); moving.wasPile = false; }
    }
    if (landed.cards.length > 1) landed.wasPile = true;
    dropEmpty();
    if (!landed.locked && landed.cards.length > 1) active = landed;
    layout();
    onChange({ type: "drop", stack: landed });
  }

  function tap(stack) {
    if (api.busy || api.frozen) return;
    if (stack.locked) { onRefuse({ why: "locked", stack }); return; }
    /* A second tap on the same pile, straight after the first, is a DOUBLE
       tap: the first tap's turn is taken back, and the pile is offered up to
       be dealt from. */
    const now = Date.now();
    if (lastTap.stack === stack && now - lastTap.at < 380) {
      lastTap = { stack: null, at: 0 };
      flip(stack);
      onDouble(stack);
      return;
    }
    lastTap = { stack, at: now };
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
