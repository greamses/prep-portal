/* ============================================================================
   Manipulatives — a long division, laid out in blocks
   ----------------------------------------------------------------------------
   Divide, Multiply, Subtract, Bring down. The page says what happened; this is
   what it LOOKS like on the paper, and it is the half that answers "but where
   did the 4 come from?".

   305 shared between 7. You cannot share 3 hundreds between 7, so you break
   them: THIRTY TENS. Now the question is one anybody can act out — how many
   groups of 7 tens can you make out of 30? Four, with 2 tens over. That is the
   4 in the answer and that is the remainder, and both of them are sitting on
   the paper in front of you:

       ▭▭▭▭▭▭▭   ▭▭▭▭▭▭▭   ▭▭▭▭▭▭▭   ▭▭▭▭▭▭▭     ▭▭    ▪▪▪▪▪
       ── 4 groups of 7 tens ─────────────────    over   the 5
                                                         not yet
                                                         brought down

   ── the blocks are the same number, arranged ──────────────────────────────
   Nothing is added or taken away to make the groups: 4×7 + 2 tens + 5 units is
   305, the number the page is still holding. The stage does not change WHAT is
   on the paper, only how it is laid out — until the subtraction, when the
   grouped tens are taken away and 25 is what is left. That is why the count
   drops exactly when the S of DMSB is written and not before.

   ── colour is not used to say "group" ─────────────────────────────────────
   On this canvas colour says which PLACE a piece is and nothing else, so the
   groups are told apart by the GAPS between them. A group is a slab of pieces
   that touch; the space is the grouping.

   ── when it stands aside ──────────────────────────────────────────────────
   A stage with more pieces than the canvas will hold, or working in a place
   bigger than a cube, is not laid out at all — the caller falls back to simply
   showing the number. Half a picture is worse than none here.
   ========================================================================== */

import { CFG, placeAt, placeDims } from "./config.js";
import { store, nextId } from "./state.js";
import { occupancy, findSpot, mark } from "./layout.js";
import { planOf, leftToShare } from "./longdiv.js";

/* Cells left between one group and the next. Two, not one: one cell is the gap
   the canvas already leaves between any two pieces, and a grouping you have to
   measure is not a grouping you can see. */
const GROUP_GAP = 2;

/* Past this many pieces in the working place the groups are wider than the
   paper is useful, and the picture stops teaching anything. */
const MAX_HEAP = 40;

/* The four places blocks come in. Beyond a cube there is no piece to lay out. */
const TOP_POWER = 3;

/** Ten, a hundred, a thousand — said the way the sentence wants it. */
const PLACE_WORDS = ["ones", "tens", "hundreds", "thousands"];

/**
 * What the paper should be showing at this stage of the working.
 *
 * Returns null when there is nothing to show or the stage will not lay out, and
 * the caller should fall back to the plain number.
 */
export function stageOf(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return null;                       // finished; the remainder is all
  const s = e.step;
  const tail = plan.digits.length - 1 - s.i; // digits not yet brought down
  if (tail > TOP_POWER) return null;         // no block is worth that much

  /* GROUPED once the answer's figure is known — which is exactly after the D of
     DMSB and before the S. Ask it first and the heap is unbroken, which is the
     question: how many groups of seven can you make out of these? */
  const grouped = e.kind === "p" || e.kind === "d";
  const heap = s.cur;                        // pieces of the working place
  if (heap > MAX_HEAP) return null;

  const per = plan.divisor;
  const groups = grouped ? s.q : 0;
  const spare = heap - groups * per;

  /* The digits still to come down, each at its own place, kept to one side. */
  const rest = [];
  for (let k = s.i + 1; k < plan.digits.length; k++) {
    const power = plan.digits.length - 1 - k;
    if (plan.digits[k]) rest.push({ power, n: plan.digits[k] });
  }

  const pieces = groups * per + spare + rest.reduce((n, r) => n + r.n, 0);
  if (pieces > CFG.maxBlocks) return null;

  return {
    power: tail, per, groups, spare, rest, heap,
    total: leftToShare(thing),
    grouped,
  };
}

/** "4 groups of 7 tens, and 2 tens over." */
export function stageSentence(stage, base) {
  if (!stage) return "";
  const word = PLACE_WORDS[stage.power] || `${base}s`;
  const one = word.replace(/s$/, "");
  if (!stage.grouped) {
    return `${stage.heap} ${word} on the paper — how many groups of ${stage.per}?`;
  }
  const over = stage.spare
    ? `, and ${stage.spare} ${stage.spare === 1 ? one : word} over`
    : ", with none over";
  return `${stage.groups} group${stage.groups === 1 ? "" : "s"} of ${stage.per} `
    + `${word} on the paper${over}.`;
}

/* ── laying it out ────────────────────────────────────────────────────────── */

/** One piece of the place at `power`, in this base. */
function pieceOf(power, base) {
  return placeDims(placeAt(power).id, base);
}

/**
 * Put the stage on the canvas as blocks.
 *
 * Everything is measured first and given ONE clear rectangle, rather than each
 * piece being found a home of its own: the whole point is the shape of the
 * arrangement, and a group that got pushed round a chart is not a group any
 * more. Returns false if there is nowhere it will go.
 */
export function layStage(thing, stage) {
  const base = store.base;
  const dim = pieceOf(stage.power, base);

  /* The groups WRAP into rows rather than running off in one line. Four groups
     of seven rods on a single line is sixty-six cells by seven — a strip so long
     and thin that on screen you are looking down a corridor of it. Squared up it
     reads at a glance, which is the whole job.

     What is OVER goes on a row of its own under them, with a bigger gap: put a
     spare piece directly beneath a group and it looks like part of it, which is
     exactly the mistake this picture exists to prevent. */
  const step = dim.l + GROUP_GAP;
  const rowDeep = dim.w * stage.per + GROUP_GAP;
  const perRow = Math.max(1, Math.ceil(Math.sqrt(stage.groups)));
  const rows = Math.ceil(stage.groups / perRow);
  const apart = GROUP_GAP * 2;          // between the groups and what is over

  /* The last row: what is over, then the digits not yet brought down. */
  const overDeep = stage.spare ? dim.w * stage.spare : 0;
  let overWide = stage.spare ? dim.l + GROUP_GAP : 0;
  for (const r of stage.rest) overWide += apart + pieceOf(r.power, base).l * r.n;
  const restDeep = Math.max(0, ...stage.rest.map((r) => pieceOf(r.power, base).w));

  const wide = Math.max(1, Math.round(Math.max(perRow * step, overWide)));
  const lastDeep = Math.max(overDeep, restDeep);
  const deep = Math.max(1, Math.round(rows * rowDeep + (lastDeep ? apart + lastDeep : 0)));

  const grid = occupancy(store.things);
  const spot = findSpot(grid, wide, deep, { x: 0, z: 0 });
  if (!spot) return false;

  const made = [];
  const put = (d, x, z) => made.push({
    id: nextId(), ...d, x, z, y: 0, angle: 0, tip: 0, tag: null,
  });

  /* Rows are laid from the FAR edge downwards, because z runs up the screen and
     the groups should read before what is left over, top to bottom. */
  for (let g = 0; g < stage.groups; g++) {
    const row = Math.floor(g / perRow);
    const col = g % perRow;
    const z = spot.z + deep - (row + 1) * rowDeep + GROUP_GAP;
    for (let k = 0; k < stage.per; k++) put(dim, spot.x + col * step, z + k * dim.w);
  }

  let x = spot.x;
  const z = spot.z;
  for (let k = 0; k < stage.spare; k++) put(dim, x, z + k * dim.w);
  if (stage.spare) x += dim.l + GROUP_GAP;
  for (const r of stage.rest) {
    x += apart;
    const d = pieceOf(r.power, base);
    for (let k = 0; k < r.n; k++) put(d, x + k * d.l, z);
    x += d.l * r.n;
  }

  store.blocks = made;
  mark(grid, spot.x, spot.z, wide, deep);
  /* The blocks that were there are gone and their ids with them, so a selection
     naming one is stale — the same rule sync.js follows. */
  store.selection = new Set(
    [...store.selection].filter((id) => store.things.some((t) => t.id === id))
  );
  return true;
}
