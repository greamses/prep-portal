/* ============================================================================
   Manipulatives — a long division, laid out in blocks
   ----------------------------------------------------------------------------
   Divide, Multiply, Subtract, Bring down. The page says what happened; this is
   what it LOOKS like on the paper, and it is the half that answers "but where
   did the 4 come from?".

   ── the divisor is how many PILES there are ───────────────────────────────
   305 shared between 7 makes SEVEN piles. Not four groups of seven — seven
   groups, one for each share, and the answer is how much ends up in each of
   them. That is the whole picture, and it is the one the sum is written to
   produce: 43 in every pile, and 4 that would not go round.

   The piles are there from the first moment and they never move. Each stage of
   the working deals ONE PLACE into them:

       3 hundreds will not go between 7, so they are broken: THIRTY TENS.
       Deal the tens round: four to each pile — that is the 4 in the answer —
       and 2 tens will not go round again. Those 2 tens BREAK THERE AND THEN
       into 20 ones, the 5 comes down to join them, and 25 ones are dealt
       round: three each, which is the 3, and 4 left over.

   ── what is over is broken at once ───────────────────────────────
   The moment a round has been dealt, whatever would not go round is broken into
   the next place down — the 2 tens become 20 ones while you are looking at them,
   because that is the only reason the working can carry on at all. The one
   exception is the FINAL remainder: 4 ones at the end of 305 ÷ 7 are the answer
   to the sum, and breaking them would answer a question nobody asked.

   The digit waiting to come down stands apart from the broken pieces until it is
   brought down, so the blocks never say more than the page does.

       ┌──────┐ ┌──────┐ ┌──────┐        the working heap
       │ ▭▭▭▭ │ │ ▭▭▭▭ │ │ ▭▭▭▭ │        ▪▪▪▪
       │  ▪▪▪ │ │  ▪▪▪ │ │  ▪▪▪ │        4 over
       └──────┘ └──────┘ └──────┘
        43       43       43   … seven of them

   ── how it is animated ────────────────────────────────────────────────────
   Pieces KEEP THEIR IDENTITY across a stage, so a ten that goes into a pile is
   the same block gliding out of the heap and into the pile — not one block
   vanishing and another appearing somewhere else. And they are dealt in ROUNDS:
   every pile gets its first ten together, then its second, then its third. That
   stagger is the whole argument for why the answer is four — you watch four
   rounds go out and the fifth will not go round.

   The frame the picture lives in is measured from the WHOLE sum before the first
   piece is laid, so nothing shifts about half way through: a pile that has been
   dealt to stays exactly where it is for the rest of the working.

   ── what is counted ───────────────────────────────────────────────────────
   A piece dealt into a pile is marked `aside` once the subtraction is written.
   It is still on the paper and still in view — that is the point — but it is no
   longer part of what is LEFT to share, so it is not in the canvas total.
   Counting it again would say the sum had never moved. So the canvas reads 305,
   then 25, then 4, while all 305 stay where you can see them.

   ── colour is not used to say "pile" ──────────────────────────────────────
   On this canvas colour says which PLACE a piece is and nothing else, so the
   piles are told apart by the GAPS between them. A pile is a slab of pieces that
   touch; the space is the grouping.

   ── when it stands aside ──────────────────────────────────────────────────
   Too many piles to read, more pieces in a place than the canvas will hold, or
   working in a place bigger than a cube: none of those is laid out at all and
   the caller falls back to simply showing the number. Half a picture is worse
   than none here.
   ========================================================================== */

import { CFG, placeAt, placeDims } from "./config.js";
import { store, nextId } from "./state.js";
import { occupancy, findSpot, footprint } from "./layout.js";
import { planOf, leftToShare } from "./longdiv.js";

/* Cells left between one pile and the next. Two, not one: one cell is the gap
   the canvas already leaves between any two pieces, and a grouping you have to
   measure is not a grouping you can see. */
const GROUP_GAP = 2;

/* Between the places WITHIN a pile — the tens and the ones of the same 43. One
   cell, so they read as one pile with two kinds of piece in it. */
const ROW_GAP = 1;

/* Between one block-of-the-base and the next within a single place: thirty tens
   are three hundreds standing apart, not one column of thirty. */
const BLOCK_GAP = 1;

/* Between the piles and the heap that is still to be shared. Wider than any gap
   inside the picture, because that is the one division that matters: what has
   been given out, and what has not. */
const APART = 4;

/* Past this many pieces in the working place the heap is wider than the paper is
   useful, and the picture stops teaching anything. */
const MAX_HEAP = 40;

/* More piles than this and you cannot see them as piles — you see a wall. */
const MAX_GROUPS = 12;

/* Piles to a row. Four, because a row of four is countable at a glance and a
   seventh pile then reads as "one row and three" rather than as a queue. */
const PER_ROW = 4;

/* Loose pieces the heap will hold. Bigger than MAX_HEAP because breaking a
   place down multiplies the count by the base while making every piece smaller:
   six tens are six rods, but sixty ones pack into a square. */
const MAX_LOOSE = 130;

/* The four places blocks come in. Beyond a cube there is no piece to lay out. */
const TOP_POWER = 3;

/** Ten, a hundred, a thousand — said the way the sentence wants it. */
const PLACE_WORDS = ["ones", "tens", "hundreds", "thousands"];

const wordFor = (power, base) => PLACE_WORDS[power] || `lots of ${base ** power}`;
const oneOf = (power, n, base) => {
  const w = wordFor(power, base);
  return n === 1 ? w.replace(/s$/, "") : w;
};

/**
 * What the paper should be showing at this stage of the working.
 *
 * Returns null when the stage will not lay out and the caller should fall back
 * to the plain number. When the sum is FINISHED it still returns a stage — the
 * finished picture, seven piles of 43 and a remainder of 4, is the one worth
 * looking at longest and it would be a poor joke to sweep it away at the end.
 */
/**
 * The loose pieces at a given point in the working, and the digits not yet
 * brought down.
 *
 * Written apart from `stageOf` because the FRAME has to know how big the heap
 * ever gets before the first piece is laid, and asking the same question of
 * every entry in the plan is how it finds out.
 */
function heapAt(plan, done) {
  const len = plan.digits.length;
  const later = (from) => {
    const out = [];
    for (let k = from; k < len; k++) {
      if (plan.digits[k]) out.push({ power: len - 1 - k, n: plan.digits[k] });
    }
    return out;
  };
  const e = plan.entries[done];
  if (!e) return { power: 0, n: plan.remainder, waiting: [] };
  const s = e.step;
  const power = len - 1 - s.i;

  /* Waiting to be brought down. The digit is NOT in the heap yet — bringing it
     down is a move the learner makes, and blocks that have already made it for
     them are blocks telling them the answer. */
  if (e.kind === "b") {
    return { power, n: s.cur - plan.digits[s.i], waiting: later(s.i) };
  }
  /* Before the round is dealt: the whole heap, unbroken, which IS the question. */
  if (e.kind === "q") return { power, n: s.cur, waiting: later(s.i + 1) };

  /* The round has been dealt and what would not go round is standing there in
     the place it was dealt from — 2 TENS, not 20 ones. It is broken at the very
     next entry, once the subtraction has been written: the page is asking
     "30 take away 28" and blocks that had already broken themselves down would
     be answering a question in ones that was asked in tens.

     At the last step there IS no next entry, and what is over is the remainder
     and the answer to the sum. It is never broken. */
  return { power, n: s.rem, waiting: later(s.i + 1) };
}

/**
 * What the paper should be showing at this stage of the working.
 *
 * Returns null when the stage will not lay out and the caller should fall back
 * to the plain number. When the sum is FINISHED it still returns a stage — the
 * finished picture, seven piles of 43 and a remainder of 4, is the one worth
 * looking at longest and it would be a poor joke to sweep it away at the end.
 */
export function stageOf(thing) {
  const plan = planOf(thing);
  if (plan.divisor < 2 || plan.divisor > MAX_GROUPS) return null;

  const e = plan.entries[thing.done];
  const done = !e;
  const s = done ? plan.steps[plan.steps.length - 1] : e.step;
  const power = done ? 0 : plan.digits.length - 1 - s.i;
  if (power > TOP_POWER) return null;

  /* DEALT once the answer's figure is known — which is exactly after the D of
     DMSB and before the S. Ask it first and the heap is unbroken, which is the
     question: thirty tens, seven piles, how many each? */
  const grouped = done || e.kind === "p" || e.kind === "d";
  const heap = done ? plan.remainder : s.cur;
  if (heap > MAX_HEAP) return null;

  const groups = plan.divisor;
  const per = done || !grouped ? 0 : s.q;
  const spare = done ? plan.remainder : heap - per * groups;

  /* What every pile is holding already, from the stages that are done with. */
  const had = [];
  for (const st of plan.steps) {
    if (st.q <= 0) continue;
    if (!done && st.i >= s.i) continue;      // this stage's round is `per`
    const p = plan.digits.length - 1 - st.i;
    if (p > TOP_POWER) return null;
    had.push({ power: p, n: st.q });
  }

  /* The loose pieces, and the digits still to come down. */
  const loose = heapAt(plan, thing.done);
  if (loose.power < 0) return null;
  const rest = loose.waiting;
  const spread = loose.n + rest.reduce((n, r) => n + r.n, 0);
  if (spread > MAX_LOOSE) return null;

  const each = had.reduce((n, h) => n + h.n, 0) + per;
  const pieces = groups * each + spread;
  if (pieces > CFG.maxBlocks) return null;

  return {
    power, groups, per, spare, had, rest, heap, grouped, done,
    loose: loose.n,                         // how many loose pieces
    loosePower: loose.power,                // and what place they are in
    each,                                   // what one pile is holding now
    total: done ? plan.remainder : leftToShare(thing),
  };
}

/** "4 tens each for the 7 piles, and 2 tens over." */
export function stageSentence(stage, base) {
  if (!stage) return "";
  if (stage.done) {
    const each = stage.had.map((h) => `${h.n} ${wordFor(h.power, base)}`).join(" and ");
    const over = stage.spare
      ? `, and ${stage.spare} ${oneOf(0, stage.spare, base)} left over`
      : ", and nothing left over";
    return `${stage.groups} piles with ${each} in each${over}.`;
  }
  if (!stage.grouped) {
    /* Between the subtraction and the bring-down the blocks say LESS than the
       page: what was over has been broken down, but the next digit has not come
       down to join it yet. Say what is actually there. */
    const wait = stage.rest.reduce((n, r) => n + r.n, 0);
    if (wait && stage.loose !== stage.heap) {
      return `${stage.loose} ${oneOf(stage.loosePower, stage.loose, base)} `
        + `on the paper, and ${wait} still to come down.`;
    }
    return `${stage.heap} ${wordFor(stage.power, base)} on the paper, `
      + `${stage.groups} piles — how many each?`;
  }
  const over = stage.spare
    ? `, and ${stage.spare} ${oneOf(stage.power, stage.spare, base)} over`
    : ", with none over";
  return `${stage.per} ${oneOf(stage.power, stage.per, base)} each `
    + `for the ${stage.groups} piles${over}.`;
}

/**
 * The note that goes beside the piles when a round has been dealt.
 *
 * The piles themselves are the record and they stay; this only LABELS them, so
 * that at the end the notes read down the page as the working: what went into
 * each pile at this stage, what that came to altogether, and what would not go
 * round. It never replaces the blocks.
 */
export function groupNote(stage, base) {
  if (!stage || !stage.grouped || stage.done || !stage.per) return "";
  const word = wordFor(stage.power, base);
  const worth = stage.per * stage.groups * base ** stage.power;
  const over = stage.spare
    ? `\n${stage.spare} ${oneOf(stage.power, stage.spare, base)} over`
    : "\nnone over";
  return `${stage.per} ${word} each\n× ${stage.groups} piles = `
    + `${stage.per * stage.groups} ${word}\n= ${worth}${over}`;
}

/* ── laying it out ────────────────────────────────────────────────────────── */

/**
 * The round that has just been dealt is no longer part of what is left.
 *
 * Nothing moves and nothing is deleted: the pieces stay in the piles they were
 * dealt into, which is the whole point — the learner watched four tens go into
 * every pile and they are still there to be counted. All that changes is that
 * they stop counting as "still to share", which is what the subtraction says.
 */
export function setAside(thing) {
  let n = 0;
  for (const b of store.blocks) {
    if (b.group == null || b.aside) continue;
    b.aside = true;
    n += 1;
  }
  return n;
}

/** One piece of the place at `power`, in this base. */
function pieceOf(power, base) {
  return placeDims(placeAt(power).id, base);
}

/**
 * How `n` pieces of one place lie together.
 *
 * A row as wide as the base: ten units line up in a row of ten, and ten rods —
 * which are already a base long each — stack one under another into the square
 * they make. That is how the pieces are meant to go together, so the shape of a
 * pile is the shape the blocks themselves argue for.
 *
 * And a place never runs deeper than the base: the eleventh row starts a new
 * block beside the first. Thirty tens is not a column thirty deep, it is THREE
 * HUNDREDS standing side by side, which is exactly the fact the first line of
 * this division turns on.
 */
function stackOf(power, n, base) {
  const dim = pieceOf(power, base);
  /* A ROD STANDS ACROSS THE PAPER, not along it. Turned a quarter turn it is one
     cell wide and a base deep, so rods sit side by side like palings and you can
     count them along a row at a glance — four rods in a pile read as four. Laid
     end-on and stacked they make the same square, but you have to count DOWN a
     column to see how many, which is the one thing this picture is for. Only a
     piece that is longer than it is wide is turned; a unit and a flat are square
     and there is nothing to turn. */
  const turn = dim.l !== dim.w ? Math.PI / 2 : 0;
  const pw = turn ? dim.w : dim.l;         // how wide it is LYING LIKE THIS
  const pd = turn ? dim.l : dim.w;         // and how deep
  const perRow = Math.max(1, Math.round(base / pw));
  /* A block is a square of the base: ten units across and ten down, or ten
     turned rods side by side, both of which come to one hundred. */
  const cap = Math.max(1, Math.floor(base / pd));
  const rows = Math.max(1, Math.ceil(n / perRow));
  const blocks = Math.max(1, Math.ceil(rows / cap));
  const blockWide = perRow * pw;
  return {
    dim, turn, pw, pd, perRow, cap, blockWide,
    /* A single part-filled block is only as wide as what is in it — four rods
       measure four, not the ten a full row would. Two or more and every block
       but the last IS full, so the row is its true width. */
    wide: blocks > 1
      ? blocks * blockWide + (blocks - 1) * BLOCK_GAP
      : Math.max(1, Math.min(n, perRow)) * pw,
    deep: Math.max(1, Math.min(rows, cap)) * pd,
  };
}

/** Where the k-th piece of a stack sits, measured from its top-left corner. */
function posIn(s, k) {
  const row = Math.floor(k / s.perRow);
  return {
    dx: Math.floor(row / s.cap) * (s.blockWide + BLOCK_GAP) + (k % s.perRow) * s.pw,
    dz: (row % s.cap) * s.pd,
  };
}

/**
 * The shape of ONE pile, measured from what it will hold when the sum is done.
 *
 * Measured from the END and not from the stage in hand, so that the tens dealt
 * in the first round sit in the same cells for the rest of the working and the
 * ones dealt in the second go UNDER them rather than shoving them along. A
 * picture whose earlier steps move while you are looking at the later ones is
 * not a record of anything.
 */
function slotOf(places, base) {
  const rows = [];
  let wide = 0;
  let deep = 0;
  for (const p of places) {
    if (!p.n) continue;
    const s = stackOf(p.power, p.n, base);
    rows.push({ ...s, power: p.power, dz: deep });
    wide = Math.max(wide, s.wide);
    deep += s.deep + ROW_GAP;
  }
  return { rows, wide: Math.max(1, wide), deep: Math.max(1, deep - (rows.length ? ROW_GAP : 0)) };
}

/** The heap still to be shared: what is over at this place, then what has not come down. */
function heapOf(power, loose, rest, base) {
  const parts = [];
  let x = 0;
  let deep = 0;
  if (loose > 0) {
    const s = stackOf(power, loose, base);
    parts.push({ ...s, power, n: loose, dx: 0 });
    x = s.wide + APART;
    deep = s.deep;
  }
  for (const r of rest) {
    const s = stackOf(r.power, r.n, base);
    parts.push({ ...s, power: r.power, n: r.n, dx: x });
    x += s.wide + APART;
    deep = Math.max(deep, s.deep);
  }
  return { parts, wide: Math.max(1, x ? x - APART : 1), deep: Math.max(1, deep) };
}

/**
 * The rectangle the whole picture lives in, measured from the plan.
 *
 * Every stage is laid inside this one frame, and the frame is found a home on
 * the canvas ONCE. That is what stops the piles wandering: they are not looked
 * up a fresh place each time the working moves on.
 */
function frameOf(plan, base) {
  const ends = [];
  for (const st of plan.steps) {
    if (st.q > 0) ends.push({ power: plan.digits.length - 1 - st.i, n: st.q });
  }
  const slot = slotOf(ends, base);
  const cols = Math.max(1, Math.min(plan.divisor, PER_ROW));
  const rows = Math.ceil(plan.divisor / cols);

  /* Room for the biggest the heap ever gets, so it never pushes the piles about
     when a place is broken down and twenty ones appear where two tens were.
     Asked of every entry in the plan, because the heap changes shape WITHIN a
     step as well as between them. */
  let heapWide = 1;
  let heapDeep = 1;
  for (let i = 0; i <= plan.entries.length; i++) {
    const h = heapAt(plan, i);
    if (h.power < 0) continue;
    const box = heapOf(h.power, h.n, h.waiting, base);
    heapWide = Math.max(heapWide, box.wide);
    heapDeep = Math.max(heapDeep, box.deep);
  }

  const pilesWide = cols * slot.wide + (cols - 1) * GROUP_GAP;
  const pilesDeep = rows * slot.deep + (rows - 1) * GROUP_GAP;
  return {
    slot, cols, rows, heapWide, heapDeep,
    wide: Math.max(1, Math.round(Math.max(pilesWide, heapWide))),
    deep: Math.max(1, Math.round(pilesDeep + APART + heapDeep)),
  };
}

/**
 * Put the stage on the canvas as blocks.
 *
 * Pieces already on the paper are REUSED wherever one of the right place is
 * free — the nearest one, and a piece already in the pile it is wanted in for
 * preference. That is what makes the picture animate rather than blink: the
 * canvas glides every block from where it was to where it now belongs, so a ten
 * being dealt is a ten travelling out of the heap and into a pile.
 *
 * Returns false if there is nowhere the frame will go.
 */
export function layStage(thing, stage) {
  const base = store.base;
  const plan = planOf(thing);
  const frame = frameOf(plan, base);

  /* The frame is found a home once per sum. Change the sum and it is a different
     picture and gets a fresh place; work the same sum on and the piles do not
     move a cell from the first round to the last. */
  const key = `${thing.dividend}/${thing.divisor}/${thing.base}/${base}`;
  let at = thing.blockFrame && thing.blockFrame.key === key ? thing.blockFrame : null;
  if (!at) {
    /* THE BLOCKS GO ON THE LEFT AND THE PAGE ON THE RIGHT. They are two halves
       of one argument and have to be read together - a picture found a home
       wherever there happened to be room is a picture you go looking for. Lined
       up along their top edges, so the first round dealt and the first line of
       working are level with each other.

       findSpot searches outward from there, so if something is already standing
       in that space the picture lands as near to it as it can rather than on top
       of it. */
    const f = footprint(thing);
    const want = {
      x: Math.round(thing.x - frame.wide - APART),
      z: Math.round(thing.z + f.w - frame.deep),
    };
    const spot = findSpot(occupancy(store.things), frame.wide, frame.deep, want);
    if (!spot) return false;
    at = { key, x: spot.x, z: spot.z };
    thing.blockFrame = at;
  }

  /* What each pile is holding at this stage, by place. Each stage of a division
     deals a different place, so a place names its row without ambiguity. */
  const held = new Map(stage.had.map((h) => [h.power, h.n]));
  if (stage.grouped && stage.per) held.set(stage.power, stage.per);

  /* Rows are laid from the FAR edge downwards, because z runs up the screen and
     the piles should read before the heap, top to bottom. */
  const targets = [];
  const top = at.z + frame.deep;
  for (let g = 0; g < stage.groups; g++) {
    const gx = at.x + (g % frame.cols) * (frame.slot.wide + GROUP_GAP);
    const gz = top - Math.floor(g / frame.cols) * (frame.slot.deep + GROUP_GAP);
    for (const r of frame.slot.rows) {
      const n = held.get(r.power) || 0;
      if (!n) continue;
      /* The round being dealt THIS stage: it is what animates, and it is not yet
         off the working total — the subtraction has not been written. */
      const fresh = stage.grouped && stage.per > 0 && r.power === stage.power;
      for (let k = 0; k < n; k++) {
        const p = posIn(r, k);
        targets.push({
          dim: r.dim, turn: r.turn,
          x: gx + p.dx,
          z: gz - r.dz - p.dz - r.pd,
          group: g,
          aside: !fresh,
          /* Which round it goes out in. Every pile's first piece travels
             together, then every pile's second — so you watch the tens go round
             four times and see for yourself that a fifth will not. */
          deal: fresh ? k : 0,
        });
      }
    }
  }

  const heap = heapOf(stage.loosePower, stage.loose, stage.rest, base);
  for (const p of heap.parts) {
    for (let k = 0; k < p.n; k++) {
      const q = posIn(p, k);
      targets.push({
        dim: p.dim, turn: p.turn,
        x: at.x + p.dx + q.dx,
        z: at.z + frame.heapDeep - q.dz - p.pd,
        group: null, aside: false, deal: 0,
      });
    }
  }

  /* ── give every target a piece ──────────────────────────────────────────
     A piece already sitting in the pile the target belongs to is left exactly
     where it is; otherwise the nearest loose piece of the right place is the one
     a hand would reach for, and reaching for the nearest is also what stops the
     blocks crossing over one another on their way. */
  const sig = (d) => `${d.l}|${d.w}|${d.h}`;
  const spare = store.blocks.slice();
  const taken = new Set();
  const laid = [];
  for (const t of targets) {
    const want = sig(t.dim);
    let best = null;
    let score = Infinity;
    for (const b of spare) {
      if (taken.has(b.id) || sig(b) !== want) continue;
      const home = b.group === t.group ? 0 : 1e7;
      const far = (b.x - t.x) ** 2 + (b.z - t.z) ** 2;
      if (home + far < score) { score = home + far; best = b; }
    }
    if (best) {
      taken.add(best.id);
      Object.assign(best, {
        x: t.x, z: t.z, y: 0, angle: t.turn, tip: 0,
        group: t.group, aside: t.aside, deal: t.deal,
      });
      laid.push(best);
    } else {
      laid.push({
        id: nextId(), ...t.dim, x: t.x, z: t.z, y: 0, angle: t.turn, tip: 0, tag: null,
        group: t.group, aside: t.aside, deal: t.deal,
      });
    }
  }

  store.blocks = laid;
  /* Pieces that were traded away are gone and their ids with them, so a
     selection naming one is stale — the same rule sync.js follows. */
  store.selection = new Set(
    [...store.selection].filter((id) => store.things.some((t) => t.id === id))
  );
  return true;
}
