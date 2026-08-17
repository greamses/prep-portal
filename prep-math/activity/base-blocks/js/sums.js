/* ============================================================================
   Manipulatives — adding and taking away on a counting frame
   ----------------------------------------------------------------------------
   Type a number, press + or −, and the frame works it out the way it is actually
   taught: one rod at a time, using the SMALL FRIEND when a digit will not fit
   but five will help, and the BIG FRIEND when even that will not do.

   The two friends are complements, and the whole method is in them:

     small friend of d  =  5 − d   (only for d under five)
       "Add four" with no room for four: put the five-bead IN and take ONE out,
       because 4 = 5 − 1. Nothing leaves the rod.

     big friend of d    =  10 − d
       "Add seven" with no room even for that: carry ONE to the rod on the left
       and take THREE off this one, because 7 = 10 − 3. The carry is not an
       afterthought — it is half of the move.

   Taking away is the same two friends read backwards: −4 = −5 + 1, and −7 =
   −10 + 3 with a borrow from the left.

   Only frames with a bead worth five above the bar can do this, which is the
   soroban and the suanpan. A schoty is a wire of plain ones and has no five to
   lend, so it is not offered the method — the same reason it is the only frame
   that travels to other bases.

   The whole sum is PLANNED against a copy of the rods before a single bead
   moves. A frame that runs out of wires, or a subtraction that would go below
   nought, is refused whole — never half-worked and left wrong.
   ========================================================================== */

import { specOf } from "./abacus.js";

/** The five above the bar. Everything here is base ten, which is the point. */
const W = 5;
const BASE = 10;

const PLACES = [
  "ones", "tens", "hundreds", "thousands", "ten thousands",
  "hundred thousands", "millions", "ten millions", "hundred millions",
];

/** What to call rod `r` of a frame with `n` rods — the last one is the ones. */
function placeName(r, n) {
  return PLACES[n - 1 - r] || `rod ${r + 1}`;
}

/** Which frames know the method. */
export function canWorkSums(thing) {
  return thing.kind === "abacus" && thing.variant !== "schoty" && (thing.base || 10) === 10;
}

/* ── planning ─────────────────────────────────────────────────────────────── */

/**
 * Work `n` on to (or off) a frame and return the moves it takes.
 *
 * Rods are done from the ONES END leftwards, so a carry always lands on a rod
 * that has not been reached yet and merges into the digit waiting there.
 *
 * Returns { ok, steps, message }. Every step is one hand movement:
 *   { rod, dh, de, kind, text } — beads in or out of heaven and earth on one rod.
 */
export function planSum(thing, n, sign = 1) {
  const spec = specOf(thing.variant, 10);
  const heavenN = spec.tiers.heaven ? spec.tiers.heaven.n : 0;
  const earthN = spec.tiers.earth.n;
  const rods = thing.rods.length;
  if (!heavenN) return { ok: false, steps: [], message: "This frame has no five to lend." };

  // a copy to plan against: nothing on the canvas moves until the plan is whole
  const state = thing.rods.map((r) => ({ h: r.heaven, e: r.earth }));
  const steps = [];
  const ctx = { state, steps, heavenN, earthN, rods, W, name: (r) => placeName(r, rods) };

  const digits = String(Math.abs(Math.round(n))).split("").map(Number);
  const first = rods - digits.length;
  if (first < 0) {
    return { ok: false, steps: [], message: `${n} has more digits than this frame has rods.` };
  }

  /* Right to left: the ones first, so every carry goes to a rod still to come. */
  for (let i = digits.length - 1; i >= 0; i--) {
    const d = digits[i];
    if (!d) continue;
    const r = first + i;
    const done = sign > 0 ? addOn(ctx, r, d) : takeOff(ctx, r, d);
    if (!done.ok) return { ok: false, steps: [], message: done.message };
  }

  return { ok: true, steps, message: null };
}

const room = (ctx, h, e) => h >= 0 && h <= ctx.heavenN && e >= 0 && e <= ctx.earthN;

function push(ctx, r, dh, de, kind, text) {
  const rod = ctx.state[r];
  rod.h += dh;
  rod.e += de;
  ctx.steps.push({ rod: r, dh, de, kind, text });
}

/**
 * A step that says something and moves nothing.
 *
 * The big friend is announced before either half of it happens, because the
 * carry and the take-away only make sense as one move — and a beat with the
 * sentence up and the beads still is where the learner gets to think.
 */
function note(ctx, r, text) {
  ctx.steps.push({ rod: r, dh: 0, de: 0, kind: "big", text });
}

/**
 * Add `d` (1…9) to one rod.
 *
 * Three moves are tried in the order a hand would try them: straight in, then
 * the small friend, then the big friend. The order is the teaching.
 */
function addOn(ctx, r, d) {
  if (r < 0) return { ok: false, message: "The carry ran off the end of the frame." };
  const rod = ctx.state[r];
  const where = ctx.name(r);

  /* 1 — straight in. Spend the digit on the biggest beads first, as a hand does:
     seven is the five-bead and two ones. */
  const dh = Math.min(ctx.heavenN - rod.h, Math.floor(d / W));
  const de = d - dh * W;
  if (room(ctx, rod.h + dh, rod.e + de)) {
    push(ctx, r, dh, de, "direct", `${where}: add ${d}. There is room, so straight in.`);
    return { ok: true };
  }

  /* 2 — the small friend: 5 − d. Put the five in and take the friend out. */
  const small = W - d;
  if (d < W && room(ctx, rod.h + 1, rod.e - small)) {
    push(ctx, r, 1, -small, "small",
      `${where}: no room for ${d}. Its SMALL FRIEND is ${small} — put five in, take ${small} out.`);
    return { ok: true };
  }

  /* 3 — the big friend: 10 − d. Carry one to the left and take the friend off
     here. The carry may need a friend of ITS own, which is why this recurses,
     and every step of that cascade still says its own piece. */
  const big = BASE - d;
  note(ctx, r,
    `${where}: no room for ${d} even with the five. Its BIG FRIEND is ${big} — `
    + `carry one to the ${ctx.name(r - 1)} and take ${big} off here, because ${d} = 10 − ${big}.`);
  const carried = addOn(ctx, r - 1, 1);
  if (!carried.ok) return carried;
  const off = takeOff(ctx, r, big, { borrow: false });
  if (!off.ok) return off;
  return { ok: true };
}

/** Take `d` (1…9) off one rod — the same three moves, read backwards. */
function takeOff(ctx, r, d, { borrow = true } = {}) {
  if (r < 0) return { ok: false, message: "The frame cannot show a number below nought." };
  const rod = ctx.state[r];
  const where = ctx.name(r);

  // 1 — straight out
  const dh = Math.min(rod.h, Math.floor(d / W));
  const de = d - dh * W;
  if (room(ctx, rod.h - dh, rod.e - de)) {
    push(ctx, r, -dh, -de, "direct", `${where}: take ${d} off. The beads are there, so straight out.`);
    return { ok: true };
  }

  // 2 — the small friend: take the five out and give the friend back
  const small = W - d;
  if (d < W && room(ctx, rod.h - 1, rod.e + small)) {
    push(ctx, r, -1, small, "small",
      `${where}: not enough ones for ${d}. Its SMALL FRIEND is ${small} — take five out, put ${small} back.`);
    return { ok: true };
  }

  /* 3 — the big friend: borrow one from the left and give this rod back 10 − d.
     Only reached when the rod really is short; the complement subtraction inside
     a big-friend ADDITION never gets here, which is why it may say no. */
  if (!borrow) return { ok: false, message: "That rod could not spare it." };
  const big = BASE - d;
  note(ctx, r,
    `${where}: not enough here for ${d} even with the five. Its BIG FRIEND is ${big} — `
    + `borrow one from the ${ctx.name(r - 1)} and give ${big} back here, because −${d} = −10 + ${big}.`);
  const borrowed = takeOff(ctx, r - 1, 1);
  if (!borrowed.ok) return borrowed;
  const back = addOn(ctx, r, big);
  if (!back.ok) return back;
  return { ok: true };
}

/** Play one planned step on the real frame. */
export function applyStep(thing, step) {
  const rod = thing.rods[step.rod];
  if (!rod) return;
  rod.heaven += step.dh;
  rod.earth += step.de;
}
