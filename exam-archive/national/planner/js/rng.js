/* ═══════════════════════════════════════════════════════
   PLANNER — seeded scenario generation

   planAt(seed, difficulty) builds the whole brief for a round: N events, a
   HIDDEN true schedule (rising 30-min times), and the clues that pin it. Seeded
   off the shared room seed via /utils/games/rng.js, so every client derives the
   identical brief with zero network — the same contract as the other games'
   rng.js.

   The clues are guaranteed to have exactly ONE solution by construction: one
   absolute anchor ("Registration is at 9:00 AM") plus a SPANNING TREE of exact,
   DIRECTIONAL relative offsets ("Lunch is 1 hour after Team Games"). The anchor
   fixes one absolute time; each tree edge fixes another event relative to one
   already fixed — so every time is uniquely determined. (Directional matters:
   an undirected "there are 30 minutes between A and B" would leave a sign
   ambiguity, so those are never used for tree edges.)
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, CONTENT_NS } from '/utils/games/rng.js';
import { EVENT_POOL, DIFFICULTY } from '/data/planner/scenarios.js';

const GRID = 30; // minutes per slot
const DAY_START = 7 * 60; // 07:00 — first selectable time
const DAY_END = 19 * 60; // 19:00 — last selectable time
const BASE_LATEST = 9 * 60; // the day's first event starts 07:00–09:00

function shuffled(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// minutes-since-midnight → "9:00 AM"
export function fmtTime(min) {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ap = h24 < 12 ? 'AM' : 'PM';
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}

// minutes → "30 minutes" / "1 hour" / "1 hour 30 minutes" / "2 hours"
function fmtDur(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const parts = [];
  if (h) parts.push(`${h} hour${h > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} minutes`);
  return parts.join(' ') || '0 minutes';
}

// The day's selectable times, for the per-event <select>.
export function daySlots() {
  const out = [];
  for (let t = DAY_START; t <= DAY_END; t += GRID) out.push({ min: t, label: fmtTime(t) });
  return out;
}

function absClue(rng, e) {
  const t = fmtTime(e.time);
  return pick(rng, [
    `${e.name} is at ${t}.`,
    `${e.name} starts at ${t}.`,
    `${e.name} is scheduled for ${t}.`,
  ]);
}

function relClue(rng, x, y) {
  const diff = x.time - y.time;
  const dur = fmtDur(Math.abs(diff));
  if (diff > 0) {
    return pick(rng, [
      `${x.name} is ${dur} after ${y.name}.`,
      `${x.name} begins ${dur} after ${y.name}.`,
      `${x.name} comes ${dur} after ${y.name}.`,
    ]);
  }
  return pick(rng, [
    `${x.name} is ${dur} before ${y.name}.`,
    `${x.name} begins ${dur} before ${y.name}.`,
    `${x.name} comes ${dur} before ${y.name}.`,
  ]);
}

export function planAt(seed, difficulty) {
  const rng = mulberry32(hashSeed(seed, CONTENT_NS));
  const N = (DIFFICULTY[difficulty] || DIFFICULTY.medium).count;

  // Pick N distinct events, then lay them on a rising 30-min schedule.
  const chosen = shuffled(EVENT_POOL, rng).slice(0, N);
  const base = DAY_START + Math.floor(rng() * ((BASE_LATEST - DAY_START) / GRID + 1)) * GRID;
  let t = base;
  const order = chosen.map((e, i) => {
    if (i > 0) t += (rng() < 0.5 ? 30 : 60);
    return { id: e.id, name: e.name, time: t, rank: i };
  });
  const byId = Object.fromEntries(order.map((e) => [e.id, e]));

  // One absolute anchor…
  const clues = [];
  const anchor = order[Math.floor(rng() * N)];
  clues.push(absClue(rng, anchor));

  // …then a spanning tree of directional offsets: each event links once to one
  // already-pinned event, so all times resolve from the anchor.
  const added = [anchor.id];
  for (const x of shuffled(order.filter((e) => e.id !== anchor.id), rng)) {
    const y = byId[added[Math.floor(rng() * added.length)]];
    clues.push(relClue(rng, x, y));
    added.push(x.id);
  }

  // One order-only flavour line for readability (redundant — never affects the
  // unique solution).
  clues.push(rng() < 0.5
    ? `${order[0].name} is the first event of the day.`
    : `${order[N - 1].name} is the last event of the day.`);

  return {
    N,
    order, // chronological — the answer sequence
    bank: shuffled(order.map((e) => ({ id: e.id, name: e.name })), rng),
    clues: shuffled(clues, rng),
    slots: daySlots(),
    // Grading map: each event's true time and chronological rank.
    answer: Object.fromEntries(order.map((e) => [e.id, { time: e.time, rank: e.rank }])),
  };
}
