/* ============================================================================
   Manipulatives — keeping the tools telling the same story
   ----------------------------------------------------------------------------
   Sync is off by default and is a deliberate press. With it on, whatever you
   change becomes THE number, and every other thing on the canvas is rewritten
   to show that same number its own way: the beads slide, the counters land in
   their columns, the blocks are laid out in the best grouping the base allows.

   That is the whole point of having seven tools on one sheet of paper. Slide a
   bead from nine to ten on a schoty and watch the units column of the chart
   empty into the rods column at the same instant.

   One rule keeps it honest: the thing you touched is never written back to.
   Everything else re-reads.
   ========================================================================== */

import { CFG, placeDims, PLACES, toBase, baseWord } from "./config.js";
import { store, snapshot, say, nextId } from "./state.js";
import { setAbacusValue, abacusValue } from "./abacus.js";
import { placeReading, placeOrder, growChart, MAX_DOTS, MAX_PLACES } from "./grids.js";
import { bestGrouping, settleThings } from "./ops.js";
import { sheetFor } from "./sheets.js";
import { occupancy, findSpot, fits, mark, footprint, arrange } from "./layout.js";

/**
 * Everything sync writes to — the frames, the charts, and the written sums.
 *
 * A long division and a column addition hold a number as much as a soroban
 * does; they just say it as a piece of working rather than as a row of beads.
 */
function targets(exceptId) {
  return store.things.filter(
    (t) => t.id !== exceptId
      && (t.kind === "abacus" || t.variant === "place" || !!sheetFor(t))
  );
}

/** What one thing is currently reading. */
export function valueOf(thing) {
  if (thing.kind === "abacus") return abacusValue(thing);
  if (thing.variant === "place") return placeReading(thing, store.blocks, store.base).total;
  const sheet = sheetFor(thing);
  if (sheet) return sheet.value(thing);
  return 0;
}

/**
 * Write `n` into every tool but the one that produced it.
 * Returns a short note on anything that could not take it, or null.
 */
export function syncFrom(n, exceptId, { blocks = true, force = false } = {}) {
  // `force` is for a number that was TYPED: asking for it is asking for all of
  // it, whether or not the tools are tied together the rest of the time
  if (!store.sync && !force) return null;
  const missed = [];
  const recut = [];

  for (const t of targets(exceptId)) {
    const sheet = sheetFor(t);
    if (t.kind === "abacus") {
      if (!setAbacusValue(t, n)) missed.push("the " + t.variant);
    } else if (sheet) {
      if (sheet.setValue(t, n)) recut.push(t);
      else missed.push("the " + sheet.name);
    } else if (!setChartValue(t, n)) {
      missed.push("the chart");
    }
  }

  /* A written sum is cut to fit the sum on it, so a new number makes it a
     different size — and a board that grew has to be put down again before
     something else is standing where it now reaches. */
  if (recut.length) settleThings(recut);

  // the blocks are only rewritten when they are not themselves the source
  if (blocks && exceptId !== "blocks" && !setBlocksValue(n)) missed.push("the blocks");

  return missed.length ? `${n} is more than ${missed.join(" and ")} can show.` : null;
}

/** Stand `n` in a place-value chart's columns, widening it if it needs to. */
export function setChartValue(thing, n) {
  const base = store.base;
  const digits = [];
  let v = Math.max(0, Math.round(n));
  while (v > 0) { digits.unshift(v % base); v = Math.floor(v / base); }

  while (digits.length > (thing.places || PLACES.length) && thing.places < MAX_PLACES) {
    growChart(thing);
  }
  const order = placeOrder(thing);
  if (digits.length > order.length) return false;
  if (digits.some((d) => d > MAX_DOTS)) return false;

  const counters = order.map(() => 0);
  const off = order.length - digits.length;
  for (let i = 0; i < digits.length; i++) counters[off + i] = digits[i];
  thing.counters = counters;
  return true;
}

/**
 * Lay `n` out in blocks: the best grouping the base allows, tidied into rows.
 * The blocks already on the canvas are replaced, which is what sync means —
 * it is off unless you asked for it.
 */
export function setBlocksValue(n) {
  const base = store.base;
  const want = Math.max(0, Math.round(n));
  /* COUNT the pieces before making any. A cube is the biggest block there is,
     so a big enough number wants millions of them — and building that array to
     find out it is too long is how you hang the page. */
  const plan = bestGrouping(want, base);
  const many = plan.reduce((s, part) => s + part.n, 0);
  if (many > CFG.maxBlocks) return false;

  const pieces = [];
  for (const part of plan) {
    for (let i = 0; i < part.n; i++) pieces.push({ ...part.dims });
  }

  /* Pieces SET ASIDE are kept. They are a record of what a long division has
     already dealt out (js/divblocks.js), not part of the number being written —
     and the last line of a division comes through here, so without this the
     whole working is swept up at the very moment it is finished. */
  const kept = store.blocks.filter((b) => b.aside);

  // keep the highlight tags of what was there, in order, so colours survive
  const tags = store.blocks.filter((b) => !b.aside).map((b) => b.tag);
  store.blocks = kept.concat(pieces.map((d, i) => ({
    id: nextId(), ...d, x: 0, z: 0, angle: 0, tag: tags[i] ?? null,
  })));

  /* Laid out clear of everything else on the canvas rather than tidied over the
     whole of it — the frames and charts are where they were put, and sync must
     not shuffle them about every time a bead moves.

     The whole FOOTPRINT has to be clear, not just the corner cell: a block that
     overlaps a place-value chart is standing in one of its columns, and the
     chart counts it — so a sloppy check here makes the chart read more than the
     number sync just handed it. */
  /* Laid out clear of the record as well as of the things: a group that has been
     dealt out stays exactly where it was dealt. */
  const live = store.blocks.filter((b) => !b.aside);
  arrange(live, store.things.concat(kept));
  const grid = occupancy(store.things.concat(kept));
  for (const b of live) {
    const f = footprint(b);
    if (!fits(grid, b.x, b.z, f.l, f.w, CFG.gap)) {
      const spot = findSpot(grid, f.l, f.w, b);
      if (spot) { b.x = spot.x; b.z = spot.z; }
    }
    mark(grid, b.x, b.z, f.l, f.w);
  }
  /* The BLOCKS are gone and their ids with them, so a selection that named one
     is stale — but a board, a frame or a note is still exactly where it was and
     still in your hand. Clearing the lot used to put down whatever you were
     holding every time a number went round, which on a written sum takes the
     strip and the answer boxes away in the middle of the working. */
  store.selection = new Set(
    [...store.selection].filter((id) => store.things.some((t) => t.id === id))
  );
  return true;
}

/**
 * Build a number that was typed in. Everything shows it — blocks, beads and
 * counters — whether or not sync is on, because typing 1234 and pressing Build
 * is not a subtle request.
 */
export function buildNumber(n) {
  const want = Math.max(0, Math.round(n));
  /* Typing a number REPLACES what is on the canvas, so it is a change like any
     other and has to be one step back — without this, undoing after typing one
     stepped over it to whatever had been done before, which is the sort of
     thing that makes people stop trusting undo. */
  snapshot();
  const missed = syncFrom(want, null, { force: true });
  if (missed) store.history.pop(); // nothing happened, so there is nothing to undo
  if (missed) return { ok: false, message: missed };
  // in base ten "1234 is 1234 in base ten" is nothing to say
  const said = store.base === 10
    ? `${want} units`
    : `${toBase(want, store.base)} in base ${baseWord(store.base)} — ${want} units`;
  return { ok: true, message: `${said}, on every tool on the canvas.` };
}

/** The blocks have changed; with sync on, let the other tools catch up. */
export function afterBlocks() {
  if (!store.sync) return null;
  return syncFrom(totalUnits(), "blocks");
}

export function totalUnits() {
  // the same rule state.js follows: what has been dealt out is not what is left
  return store.blocks.reduce((s, b) => (b.aside ? s : s + b.l * b.w * b.h), 0);
}

/** Turn sync on or off, and bring everything into line the moment it goes on. */
export function toggleSync(on) {
  store.sync = on ?? !store.sync;
  if (!store.sync) { say("Sync off — each tool goes its own way again."); return; }

  /* Something has to be the truth when sync starts. The first frame or chart
     that is showing anything wins, and the blocks are the fallback — otherwise
     turning sync on would silently blank whatever you had counted out. */
  const lead = targets(null).find((t) => valueOf(t) > 0);
  const n = lead ? valueOf(lead) : totalUnits();
  const missed = syncFrom(n, lead ? lead.id : "blocks");
  say(missed || `Sync on — every tool is showing ${n}.`, missed ? "warn" : "ok");
}
