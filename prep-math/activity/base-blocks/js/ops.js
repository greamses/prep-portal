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

import { CFG, placeDims, placeOf, baseWord } from "./config.js";
import { store, snapshot, say, nextId, selected } from "./state.js";
import { occupancy, findSpot, mark, tidy as tidyLayout } from "./layout.js";

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
  const grid = occupancy(kept);
  const homeless = [];
  for (const f of fresh) {
    const spot = findSpot(grid, f.l, f.w, f.near || null);
    if (spot) { f.x = spot.x; f.z = spot.z; mark(grid, spot.x, spot.z, f.l, f.w); }
    else homeless.push(f);
  }
  fresh.forEach((f) => delete f.near);
  if (!homeless.length) return true;

  const all = kept.concat(fresh);
  const before = all.map((b) => ({ b, x: b.x, z: b.z }));
  if (tidyLayout(all)) {
    say("The mat was getting crowded, so the pieces have been tidied into rows.");
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
    store.selection = new Set([b.id]);
    say(`Added one ${placeId} — ${d.l * d.w * d.h} unit${d.l * d.w * d.h === 1 ? "" : "s"}.`);
  }
  return b;
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

/* ── selection, colour, housekeeping ──────────────────────────────────────── */

export function tagSelected(tag) {
  const sel = selected();
  if (!sel.length) { say("Pick some blocks to highlight first.", "warn"); return false; }
  snapshot();
  sel.forEach((b) => { b.tag = tag; });
  say(tag == null ? "Highlight cleared." : `${sel.length} block${sel.length === 1 ? "" : "s"} highlighted.`, "ok");
  return true;
}

export function deleteSelected() {
  const sel = selected();
  if (!sel.length) { say("Pick some blocks to remove first.", "warn"); return false; }
  snapshot();
  const gone = new Set(sel.map((b) => b.id));
  store.blocks = store.blocks.filter((b) => !gone.has(b.id));
  store.selection = new Set();
  say(`Removed ${sel.length} block${sel.length === 1 ? "" : "s"}.`);
  return true;
}

export function clearMat() {
  if (!store.blocks.length) return false;
  snapshot();
  store.blocks = [];
  store.selection = new Set();
  say("Mat cleared.");
  return true;
}

export function tidyMat() {
  if (!store.blocks.length) { say("Nothing to tidy yet.", "warn"); return false; }
  snapshot();
  if (!tidyLayout(store.blocks)) {
    store.history.pop();
    say("Too many pieces to lay out in rows — merge or clear a few.", "warn");
    return false;
  }
  say("Tidied — one row per highlight colour, biggest first.", "ok");
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
  store.selection = new Set(store.blocks.map((b) => b.id));
  return true;
}

export function setBase(base) {
  const b = Math.max(CFG.minBase, Math.min(CFG.maxBase, Math.round(base)));
  if (b === store.base) return false;
  snapshot();
  store.base = b;
  say(`Working in base ${baseWord(b)} — ${b} of a piece now trade for the next one up.`, "ok");
  return true;
}
