/* ============================================================================
   Base Blocks — the operations (the mathematics of the mat)
   ----------------------------------------------------------------------------
   SPLIT  cuts a block across its longest side: into `base` equal pieces when
          that side divides by the base, otherwise into slices one unit thick.
          A cube gives flats, a flat gives rods, a rod gives units — in any base.
   MERGE  is the trade going the other way. The blocks must be identical, and
          under trade rules there must be exactly `base` of them. They join
          along the block's SHORTEST side (ties: length, then width, then
          height), which is what turns units→rod→flat→cube and nothing else.
   ========================================================================== */

import { CFG, PLACES, placeDims, placeOf, baseWord, toBase } from "./config.js";
import { store, snapshot, say, nextId, selected, selectedItems, items } from "./state.js";
import { occupancy, findSpot, fits, mark, footprint, arrange } from "./layout.js";
import { rebaseAbacus, worksInBase } from "./abacus.js";
import { rebaseBoard, tableMax } from "./grids.js";
import { makeTile, tileSpec, zeroPairs, tilesReading } from "./tiles.js";

const MAX_SIDE = 64;

/* ── axes ─────────────────────────────────────────────────────────────────── */

/** The side a split cuts: the longest, ties going height → width → length. */
export function splitAxis(b) {
  const m = Math.max(b.l, b.w, b.h);
  if (m < 2) return null; // already a single unit cube
  if (b.h === m) return "h";
  if (b.w === m) return "w";
  return "l";
}

/** The side a merge grows: the shortest, ties going length → width → height. */
export function mergeAxis(b) {
  const m = Math.min(b.l, b.w, b.h);
  if (b.l === m) return "l";
  if (b.w === m) return "w";
  return "h";
}

/** How many pieces a split of this block would make, and how big each is. */
export function splitPlan(b, base) {
  const axis = splitAxis(b);
  if (!axis) return null;
  const len = b[axis];
  const n = len % base === 0 ? base : len;
  const size = len / n;
  return { axis, n, size };
}

/* ── adding ───────────────────────────────────────────────────────────────── */

/**
 * Give every piece a home. Pieces are laid beside the block they came from, but
 * a mat that has grown patchy can refuse a big one — in that case the whole mat
 * is tidied into rows and the layout is taken from there. Returns false only
 * when even the tidy layout will not hold them, and then nothing has moved.
 */
function seat(kept, fresh) {
  // abacus frames and chart boards hold cells too, so blocks must go round them
  const standing = kept.concat(store.things);
  const grid = occupancy(standing);
  const homeless = [];
  for (const f of fresh) {
    const spot = findSpot(grid, f.l, f.w, f.near || null);
    if (spot) { f.x = spot.x; f.z = spot.z; mark(grid, spot.x, spot.z, f.l, f.w); }
    else homeless.push(f);
  }
  fresh.forEach((f) => delete f.near);
  if (!homeless.length) return true;

  const all = standing.concat(fresh);
  const before = all.map((b) => ({ b, x: b.x, z: b.z }));
  if (arrange(kept.concat(fresh), store.things)) {
    say("The mat was getting crowded, so everything has been set out again.");
    return true;
  }
  before.forEach((s) => { s.b.x = s.x; s.b.z = s.z; });
  return false;
}

function room(extra) {
  if (store.blocks.length + extra <= CFG.maxBlocks) return true;
  say(`The mat only holds ${CFG.maxBlocks} pieces. Merge or clear a few first.`, "warn");
  return false;
}

/** Put a new l×w×h block on the mat. Returns the block, or null if there is no room. */
export function addBlock(l, w, h, opts = {}) {
  if (!room(1)) return null;
  const b = { id: nextId(), l, w, h, x: 0, z: 0, tag: opts.tag ?? null, near: opts.near || null };
  if (!seat(store.blocks, [b])) {
    say("No clear space left on the mat — merge or clear some pieces first.", "warn");
    return null;
  }
  store.blocks.push(b);
  return b;
}

/** Add one of the named places (unit / rod / flat / cube) for the working base. */
export function addPlace(placeId) {
  snapshot();
  const d = placeDims(placeId, store.base);
  const b = addBlock(d.l, d.w, d.h);
  if (b) {
    /* Slot it into the reading order rather than dropping it in the first hole
       going: a canvas of blocks is meant to be read biggest place first. */
    arrange(store.blocks, store.things);
    store.selection = new Set([b.id]);
    say(`Added one ${placeId} — ${d.l * d.w * d.h} unit${d.l * d.w * d.h === 1 ? "" : "s"}.`);
  }
  return b;
}

/**
 * Put one algebra tile on the canvas.
 *
 * Tiles are THINGS, not blocks: they take cells and they drag and turn like
 * everything else, but they are not places and must never be counted into the
 * unit total or traded by the base — x is not a number of units, which is the
 * one thing the whole family exists to say.
 */
export function addTile(id, sign = 1) {
  const tile = addThing(makeTile(id, sign));
  arrange(store.blocks, store.things);
  const spec = tileSpec(id);
  say(`Added one ${sign < 0 ? "−" : ""}${spec.label} tile.`);
  return tile;
}

/**
 * Cancel every zero pair in the selection — a tile and its opposite are
 * nothing, and taking them off the canvas together is what says so.
 */
export function cancelPairs() {
  const tiles = selectedItems().filter((t) => t.kind === "tile");
  if (tiles.length < 2) {
    say("Pick a tile and its opposite — a red one and a plain one of the same size.", "warn");
    return false;
  }
  const gone = zeroPairs(tiles);
  if (!gone.size) {
    say("Nothing cancels there: a zero pair is one tile and its opposite.", "warn");
    return false;
  }
  snapshot();
  store.things = store.things.filter((t) => !gone.has(t.id));
  store.selection = new Set([...store.selection].filter((id) => !gone.has(id)));
  const pairs = gone.size / 2;
  const left = tilesReading(store.things.filter((t) => t.kind === "tile"));
  say(`${pairs} zero pair${pairs === 1 ? "" : "s"} cancelled — the canvas reads ${left.text}.`, "ok");
  return true;
}

/** Add a block the learner has sized themselves. */
export function addCustom(l, w, h) {
  const cl = clampSide(l), cw = clampSide(w), ch = clampSide(h);
  snapshot();
  const b = addBlock(cl, cw, ch);
  if (b) {
    store.selection = new Set([b.id]);
    say(`Added a ${cl} × ${cw} × ${ch} block — ${cl * cw * ch} units.`);
  }
  return b;
}

function clampSide(v) {
  const n = Math.round(Number(v) || 1);
  return Math.max(1, Math.min(CFG.maxDim, n));
}

/* ── splitting ────────────────────────────────────────────────────────────── */

export function splitSelected() {
  const sel = selected();
  if (!sel.length) { say("Pick a block to split first.", "warn"); return false; }

  const splittable = sel.filter((b) => splitAxis(b));
  if (!splittable.length) { say("A single unit cube cannot be split any further.", "warn"); return false; }

  const plans = splittable.map((b) => ({ b, plan: splitPlan(b, store.base) }));
  const made = plans.reduce((n, p) => n + p.plan.n, 0);
  if (!room(made - splittable.length)) return false;

  snapshot();
  const keep = new Set(splittable.map((b) => b.id));
  const kept = store.blocks.filter((b) => !keep.has(b.id));
  const fresh = [];

  for (const { b, plan } of plans) {
    const dims = { l: b.l, w: b.w, h: b.h };
    dims[plan.axis] = plan.size;
    for (let i = 0; i < plan.n; i++) {
      fresh.push({ id: nextId(), ...dims, x: 0, z: 0, tag: b.tag, near: { x: b.x, z: b.z } });
    }
  }

  if (!seat(kept, fresh)) {
    store.history.pop();
    say("Not enough room to lay all the pieces out — clear a few blocks first.", "warn");
    return false;
  }

  store.blocks = kept.concat(fresh);
  store.selection = new Set(fresh.map((b) => b.id));

  const first = plans[0];
  const from = placeOf(first.b, store.base);
  const toDims = { ...first.b };
  toDims[first.plan.axis] = first.plan.size;
  const to = placeOf(toDims, store.base);
  say(
    from && to
      ? `1 ${from} = ${first.plan.n} ${to}s in base ${baseWord(store.base)}.`
      : `Split into ${first.plan.n} pieces of ${first.plan.size === 1 ? "one unit" : first.plan.size + " units"} thick.`,
    "ok"
  );
  return true;
}

/** Smash every selected block all the way down to single unit cubes. */
export function breakToUnits() {
  const sel = selected();
  if (!sel.length) { say("Pick a block to break up first.", "warn"); return false; }
  const units = sel.reduce((n, b) => n + b.l * b.w * b.h, 0);
  if (units > CFG.maxBreak) {
    say(`That would make ${units} unit cubes — more than the mat can show. Split it a step at a time.`, "warn");
    return false;
  }
  if (!room(units - sel.length)) return false;

  snapshot();
  const keep = new Set(sel.map((b) => b.id));
  const kept = store.blocks.filter((b) => !keep.has(b.id));
  const fresh = [];
  for (const b of sel) {
    for (let i = 0; i < b.l * b.w * b.h; i++) {
      fresh.push({ id: nextId(), l: 1, w: 1, h: 1, x: 0, z: 0, tag: b.tag, near: { x: b.x, z: b.z } });
    }
  }
  if (!seat(kept, fresh)) {
    store.history.pop();
    say("Not enough room for all those unit cubes — clear a few blocks first.", "warn");
    return false;
  }
  store.blocks = kept.concat(fresh);
  store.selection = new Set(fresh.map((b) => b.id));
  say(`Broken into ${fresh.length} unit cubes.`, "ok");
  return true;
}

/* ── merging ──────────────────────────────────────────────────────────────── */

/** Why a merge can or cannot happen — used for the button state and the nudge. */
export function mergeCheck(sel = selected(), base = store.base, strict = store.strict) {
  if (sel.length < 2) return { ok: false, why: "Pick two or more blocks to merge." };
  const a = sel[0];
  const same = sel.every((b) => b.l === a.l && b.w === a.w && b.h === a.h);
  if (!same) return { ok: false, why: "A trade only works on blocks that are exactly alike." };
  if (strict && sel.length !== base) {
    return {
      ok: false,
      why: `In base ${baseWord(base)} you trade ${base} alike blocks for one — you have ${sel.length}.`,
    };
  }
  const axis = mergeAxis(a);
  if (a[axis] * sel.length > MAX_SIDE) return { ok: false, why: "That would make a block too big for the mat." };
  const dims = { l: a.l, w: a.w, h: a.h };
  dims[axis] = a[axis] * sel.length;
  return { ok: true, dims, axis, from: a };
}

export function mergeSelected() {
  /* Merge means "put these together and see what they come to", and on algebra
     tiles what a tile and its opposite come to is nothing. Same key, same
     question, the answer the family gives. */
  if (selectedItems().some((t) => t.kind === "tile")) return cancelPairs();

  const sel = selected();
  const check = mergeCheck(sel);
  if (!check.ok) { say(check.why, "warn"); return false; }

  snapshot();
  const keep = new Set(sel.map((b) => b.id));
  const kept = store.blocks.filter((b) => !keep.has(b.id));
  const anchor = sel.reduce((m, b) => (b.z < m.z || (b.z === m.z && b.x < m.x) ? b : m), sel[0]);
  const tag = sel.every((b) => b.tag === sel[0].tag) ? sel[0].tag : null;
  const merged = { id: nextId(), ...check.dims, x: 0, z: 0, tag, near: { x: anchor.x, z: anchor.z } };

  if (!seat(kept, [merged])) {
    store.history.pop();
    say("No clear space for the joined block — clear a few pieces first.", "warn");
    return false;
  }

  store.blocks = kept.concat([merged]);
  store.selection = new Set([merged.id]);

  const from = placeOf(check.from, store.base);
  const to = placeOf(merged, store.base);
  say(
    from && to
      ? `${sel.length} ${from}s = 1 ${to} in base ${baseWord(store.base)}.`
      : `${sel.length} blocks joined into one ${merged.l} × ${merged.w} × ${merged.h}.`,
    "ok"
  );
  return true;
}

/* ── regrouping ───────────────────────────────────────────────────────────────
   ONE question asked of whatever is highlighted: is this a trade in the working
   base, and which way does it go? Split and merge are two halves of the same
   idea — regrouping — and a learner who has to decide which button they need
   has been made to do the thinking the manipulative was supposed to do for
   them. Highlight ten units and the mat says "10 units = 1 rod". Highlight the
   rod and it says the same sentence backwards.

   WHICH WAY WINS. Ten rods are both mergeable (into a flat) and splittable
   (into a hundred units), so the two are not exclusive and something has to
   choose. Merging does, always: it is the direction that makes the mat
   simpler, and turning ten rods into a hundred loose cubes is a thing to ask
   for deliberately rather than to be handed.

   WHAT DOES NOT COUNT. A trade is a trade in the BASE. Splitting a hand-made
   7-long block into seven units is a fair thing to do — the Split button still
   does it — but it is not regrouping, so no offer is made for it. That is the
   whole reason splitPlan's `n` is checked against the base here.
   ────────────────────────────────────────────────────────────────────────── */

/**
 * The best grouping of `total` units in this base: as many of the biggest piece
 * as it will take, then the next, down to loose units. Largest first.
 * 35 in base ten → 3 rods and 5 units; 35 in base five → 1 flat and 2 rods.
 * The top place has no ceiling — there is no piece above a cube, so 12000 units
 * in base ten is twelve cubes, not something that cannot be shown.
 */
export function bestGrouping(total, base) {
  const out = [];
  let left = total;
  for (const p of [...PLACES].reverse()) {
    const dims = placeDims(p.id, base);
    const value = dims.l * dims.w * dims.h;
    const n = Math.floor(left / value);
    if (n) out.push({ place: p.id, dims, value, n });
    left -= n * value;
  }
  return out;
}

const dimsKey = (b) => `${b.l}x${b.w}x${b.h}`;

/** What regrouping this selection would produce, and whether it changes anything. */
export function regroupPlan(sel, base) {
  const total = sel.reduce((n, b) => n + b.l * b.w * b.h, 0);
  const pieces = bestGrouping(total, base);
  const count = pieces.reduce((n, p) => n + p.n, 0);

  const have = new Map();
  for (const b of sel) have.set(dimsKey(b), (have.get(dimsKey(b)) || 0) + 1);
  const want = new Map();
  for (const p of pieces) want.set(dimsKey(p.dims), p.n);
  const same =
    have.size === want.size && [...want].every(([k, n]) => have.get(k) === n);

  return { total, pieces, count, same };
}

/** Read the highlight as a trade: { ok, dir, from, to, groups, … }. */
export function regroupCheck(sel = selected(), base = store.base) {
  if (!sel.length) return { ok: false, why: "Highlight some blocks to trade them." };

  const a = sel[0];
  const alike = sel.every((b) => b.l === a.l && b.w === a.w && b.h === a.h);

  // UP: whatever is highlighted, worth so many units, written the best way this
  // base can write it. Ten alike units becoming one rod is the special case of
  // that, not a separate rule — which is why thirty-five loose units, or a
  // hand-made 4×3×2, or a heap of mixed pieces all have an answer here too.
  const plan = regroupPlan(sel, base);
  if (!plan.same) {
    const from = placeOf(a, base);
    const to = plan.pieces.length === 1 ? placeOf(plan.pieces[0].dims, base) : null;
    return {
      ok: true,
      dir: "merge",
      ...plan,
      // the classic one-for-many trade, which gets to keep its own sentence
      exact: !!(alike && from && to),
      from,
      to,
      count: sel.length, // blocks going in (plan.count is what comes out)
      groups: plan.count,
    };
  }

  // DOWN: each block breaks into exactly `base` of the piece below it.
  const plans = sel.map((b) => splitPlan(b, base));
  if (plans.every((p) => p && p.n === base)) {
    const p = plans[0];
    const dims = { l: a.l, w: a.w, h: a.h };
    dims[p.axis] = p.size;
    return {
      ok: true,
      dir: "split",
      axis: p.axis,
      dims,
      groups: sel.length,
      from: placeOf(a, base),
      to: placeOf(dims, base),
      count: sel.length,
      // Only meaningful when the selection is alike; the sentence below
      // falls back to a plain count when it is not.
      alike,
    };
  }

  return { ok: false, why: `That is not a trade in base ${baseWord(base)}.` };
}

/* The trade in words. Totals on both sides rather than "…, three times over":
   "30 units = 3 rods" is the equation the learner is meant to carry away, and
   it stays true whether they traded one group or five. */
const many = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "1 flat, 2 rods and 3 units" — the right-hand side of a regrouping. */
export function piecesInWords(pieces) {
  const parts = pieces.map((p) => many(p.n, p.place));
  if (parts.length < 2) return parts[0] || "nothing";
  return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
}

export function regroupSentence(check, base = store.base) {
  if (!check.ok) return check.why || "";

  if (check.dir === "merge") {
    // A tidy one-kind-for-another trade keeps the sentence that names both
    // pieces; anything mixed is stated from its worth in units, which is the
    // only description that is true of every heap.
    return check.exact
      ? `${many(check.count, check.from)} = ${many(check.groups, check.to)}`
      : `${many(check.total, "unit")} = ${piecesInWords(check.pieces)}`;
  }
  const made = check.count * base;
  return check.from && check.to
    ? `${many(check.count, check.from)} = ${many(made, check.to)}`
    : `${many(check.count, "block")} = ${many(made, "piece")}`;
}

/**
 * Do the trade the highlight is asking for. Merging several groups at once is
 * one undo step, not one per group — the learner asked for a single thing.
 */
export function regroupSelected() {
  const check = regroupCheck();
  if (!check.ok) { say(check.why, "warn"); return false; }
  if (check.dir === "split") return splitSelected();
  return regroupToBest();
}

/**
 * Rewrite the highlighted blocks as the best grouping this base can make of
 * them — biggest pieces first, nothing left over. This is the whole of the
 * upward direction: ten units become a rod, thirty-five units become three rods
 * and five units, and a hand-made 4×3×2 becomes two rods and four units,
 * because all three are the same question asked of a different heap.
 */
export function regroupToBest() {
  const sel = selected();
  if (!sel.length) { say("Highlight some blocks to regroup them.", "warn"); return false; }

  const base = store.base;
  const plan = regroupPlan(sel, base);
  if (plan.same) {
    say(`Those blocks are already grouped as well as base ${baseWord(base)} allows.`);
    return false;
  }
  if (!room(plan.count - sel.length)) return false;

  const sentence = regroupSentence(regroupCheck(sel, base), base);
  snapshot();
  const gone = new Set(sel.map((b) => b.id));
  const kept = store.blocks.filter((b) => !gone.has(b.id));

  /* Reading order, so pieces picked out of a scattered mat come together where
     the eye would put them: top row first, then left to right. */
  const queue = [...sel].sort((p, q) => (p.z - q.z) || (p.x - q.x));
  const anchor = queue[0];
  const tag = sel.every((b) => b.tag === sel[0].tag) ? sel[0].tag : null;

  const fresh = [];
  for (const piece of plan.pieces) {
    for (let i = 0; i < piece.n; i++) {
      fresh.push({
        id: nextId(),
        ...piece.dims,
        x: 0,
        z: 0,
        tag,
        near: { x: anchor.x, z: anchor.z },
      });
    }
  }

  if (!seat(kept, fresh)) {
    store.history.pop();
    say("No clear space for the regrouped pieces — clear a few blocks first.", "warn");
    return false;
  }

  store.blocks = kept.concat(fresh);
  store.selection = new Set(fresh.map((b) => b.id));
  say(`${sentence} in base ${baseWord(base)}.`, "ok");
  return true;
}

/* ── selection, colour, housekeeping ──────────────────────────────────────── */

export function tagSelected(tag) {
  const sel = selected();
  if (!sel.length) { say("Pick some blocks to highlight first.", "warn"); return false; }
  snapshot();
  sel.forEach((b) => { b.tag = tag; });
  say(tag == null ? "Highlight cleared." : `${sel.length} block${sel.length === 1 ? "" : "s"} highlighted.`, "ok");
  return true;
}

/** Put an abacus frame or a chart board on the canvas. */
/** `want` is where it should go if it can — a thing dropped on the paper. */
export function addThing(thing, want = null) {
  snapshot();
  thing.id = nextId();
  const spot = findSpot(occupancy(items()), thing.l, thing.w, want);
  thing.x = spot ? spot.x : 0;
  thing.z = spot ? spot.z : 0;
  store.things.push(thing);
  store.selection = new Set([thing.id]);
  return thing;
}

export function deleteSelected() {
  const sel = selectedItems();
  if (!sel.length) { say("Pick something to remove first.", "warn"); return false; }
  snapshot();
  const gone = new Set(sel.map((b) => b.id));
  store.blocks = store.blocks.filter((b) => !gone.has(b.id));
  store.things = store.things.filter((b) => !gone.has(b.id));
  store.selection = new Set();
  say(`Removed ${sel.length} thing${sel.length === 1 ? "" : "s"}.`);
  return true;
}

export function clearMat() {
  if (!store.blocks.length && !store.things.length) return false;
  snapshot();
  store.blocks = [];
  store.things = [];
  store.selection = new Set();
  say("Canvas cleared.");
  return true;
}

export function tidyMat() {
  const all = items();
  if (!all.length) { say("Nothing to tidy yet.", "warn"); return false; }
  snapshot();
  arrange(store.blocks, store.things);
  say("Tidied — the blocks above, biggest place first; the tools below.", "ok");
  return true;
}

/**
 * Turn everything picked a quarter turn clockwise.
 *
 * A turn swaps a thing's two floor measurements, so the space it needs changes
 * shape — it can easily no longer fit where it is standing. Each one is turned
 * on the spot when there is room and moved to the nearest spot that has room
 * when there is not, which is the same rule placement uses everywhere else.
 *
 * The two kinds turn differently and have to: a BLOCK is a plain box, so
 * swapping its measurements IS the turn and the mesh is rebuilt from them. A
 * frame or a board is not symmetrical — a soroban's rods have to end up running
 * the other way — so those carry a `turn` and the rig is spun by it.
 */
export function rotateSelected(radians = Math.PI / 2) {
  const sel = selectedItems();
  if (!sel.length) { say("Pick something first, then turn it.", "warn"); return false; }
  snapshot();
  for (const b of sel) b.angle = (b.angle || 0) + radians;
  settleSelected();
  return true;
}

/**
 * Give everything picked a patch of paper it actually fits on again.
 *
 * A turn changes the shape of the space a thing needs — a rod lying across the
 * paper wants a long thin patch, the same rod at forty-five degrees wants a
 * square one — so after turning, each is left where it is when the new shape
 * still fits and moved to the nearest spot that has room when it does not.
 */
export function settleSelected() {
  return settle(selectedItems());
}

/**
 * Re-fit a list of items whose shape has just changed — by turning, or by
 * following the base into a size they were not before. Each is left exactly
 * where it is while its new shape still fits, and moved to the nearest spot with
 * room only when it does not, so nothing slides about for no reason.
 */
export function settleThings(list) {
  return settle(list);
}

function settle(list) {
  if (!list.length) return false;
  const moving = new Set(list.map((b) => b.id));
  const grid = occupancy(items(), moving);

  for (const b of list) {
    const f = footprint(b);
    if (!fits(grid, b.x, b.z, f.l, f.w, CFG.gap)) {
      const spot = findSpot(grid, f.l, f.w, { x: b.x, z: b.z });
      if (spot) { b.x = spot.x; b.z = spot.z; }
    }
    mark(grid, b.x, b.z, f.l, f.w);
  }
  return true;
}

/** Select every block the same size as the one already picked. */
export function selectLike() {
  const sel = selected();
  if (!sel.length) { say("Pick one block first, then match it.", "warn"); return false; }
  const a = sel[0];
  const like = store.blocks.filter((b) => b.l === a.l && b.w === a.w && b.h === a.h);
  store.selection = new Set(like.map((b) => b.id));
  say(`${like.length} matching block${like.length === 1 ? "" : "s"} selected.`);
  return true;
}

export function selectAll() {
  store.selection = new Set(items().map((b) => b.id));
  return true;
}

export function setBase(base) {
  const b = Math.max(CFG.minBase, Math.min(CFG.maxBase, Math.round(base)));
  if (b === store.base) return false;
  snapshot();
  store.base = b;

  /* Counting frames follow the base where they can. A schoty is a wire of plain
     ones, so it simply grows or loses beads; a soroban keeps a bead worth five
     above its bar, which is a fact about ten, so it stays where it is. */
  let moved = 0;
  let stuck = 0;
  let tables = 0;
  const resized = [];
  for (const t of store.things) {
    if (t.kind === "abacus") {
      if (rebaseAbacus(t, b)) { moved += 1; resized.push(t); }
      else if (!worksInBase(t.variant, b)) stuck += 1;
    } else if (rebaseBoard(t, b)) {
      resized.push(t);
      /* A times table IS the base it is written in, so every one of them moves —
         four rows in base five, eleven in base twelve, and every product on the
         board rewritten to match. */
      tables += 1;
    }
  }
  /* Everything that just changed size gets re-fitted, or a table that grew from
     four rows to eleven would be standing through its neighbours. */
  settle(resized);

  let note = `Working in base ${baseWord(b)} — ${b} of a piece now trade for the next one up.`;
  if (moved) note += ` ${moved} schoty ${moved === 1 ? "wire has" : "wires have"} ${b} beads now.`;
  if (tables) {
    const m = toBase(tableMax(b), b);
    note += ` ${tables} table${tables === 1 ? "" : "s"} `
      + `${tables === 1 ? "runs" : "run"} to ${m} × ${m} now.`;
  }
  if (stuck) {
    note += ` ${stuck} frame${stuck === 1 ? "" : "s"} still count${stuck === 1 ? "s" : ""} in tens — `
      + "only the schoty counts in other bases.";
  }
  say(note, stuck ? "warn" : "ok");
  return true;
}
