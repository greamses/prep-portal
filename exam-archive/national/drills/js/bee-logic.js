/* ═══════════════════════════════════════════════════════
   DRILLS — the Spelling Bee's rules, with no screen in them.

   A bee is a hall of spellers with numbered tags. Round by round, each one
   still in walks to the microphone, is given a word, and spells it once. A
   wrong spelling and they walk off the stage. The last speller standing at the
   end of a round is the champion.

   Two rules a real bee has, kept here:
     - a round is always finished: nobody wins half-way through one;
     - if EVERYONE left misses in the same round, nobody goes out. They all
       come back for the next round (otherwise there would be no champion).

   Everything is worked out from the room's seed, the same on every device:
   who sits where, which word each turn gets, and how each bot spells. Only a
   real player's spelling has to travel (js/bee.js sends it through the live
   room); a bot's turn is never sent anywhere.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed } from '/utils/games/rng.js';
import { botName } from './bots.js';

/* Seconds at the microphone, by the setup's difficulty level. */
export const BEE_SECONDS = { easy: 60, medium: 45, hard: 30, expert: 20 };
export const beeSeconds = (level) => BEE_SECONDS[level] || BEE_SECONDS.easy;

/**
 * Who sits where. `humans` is [{ uid, name }] (any order: it is sorted here, so
 * every device seats them alike); bots fill the rest. The seats are shuffled by
 * the seed so real players are not always numbers 1 and 2.
 * → [{ seat, tag, name, uid | null, bot: slot | null, kid: 'boy' | 'girl' | 'boy2' | 'girl2' | 'girl3' }]
 */
export function seatSpellers(seed, humans, botsNeeded) {
  const people = [...humans].sort((a, b) => (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0))
    .map((h) => ({ name: h.name || 'Player', uid: h.uid, bot: null, chosen: h.kid || null }));
  for (let slot = 0; slot < botsNeeded; slot++) people.push({ name: botName(seed, slot), uid: null, bot: slot });
  const rng = mulberry32(hashSeed(seed, 7001));
  for (let i = people.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [people[i], people[j]] = [people[j], people[i]];
  }
  // boys and girls sit turn about, and the four children (js/bee.js KIDS) take turns
  const KINDS = ['boy', 'girl', 'boy2', 'girl2', 'boy3', 'girl3', 'boy2', 'girl', 'boy3', 'girl3'];
  const first = Math.floor(rng() * 4) * 2;
  // a player's own choice of speller wins; everyone else takes the seat's turn
  return people.map(({ chosen, ...p }, seat) => ({ ...p, seat, tag: seat + 1, kid: chosen || KINDS[(seat + first) % KINDS.length] }));
}

/**
 * The bee itself: whose turn it is, and what a right or wrong spelling does.
 *   bee.current    the seat at the microphone (null once there is a champion)
 *   bee.turn       how many turns have been taken: turn k gets word k
 *   bee.round      1, 2, 3...
 *   bee.alive      seats still in, in seat order
 *   bee.apply(ok)  → { out, roundEnd, reinstated: [seats], champion: seat | null }
 *   bee.placings   [{ seat, place, round }] as spellers go out; the champion is place 1
 */
export function createBee(count) {
  let alive = Array.from({ length: count }, (_, i) => i);
  let queue = [...alive];
  let missed = [];
  const bee = {
    turn: 0,
    round: 1,
    champion: null,
    placings: [],
    get current() { return bee.champion != null ? null : queue[0]; },
    get alive() { return [...alive]; },
    get waiting() { return [...queue]; },
    apply(ok) {
      const seat = queue.shift();
      bee.turn++;
      if (!ok) { alive = alive.filter((s) => s !== seat); missed.push(seat); }
      const ev = { seat, out: !ok, roundEnd: false, reinstated: [], champion: null };
      if (queue.length) return ev;
      // the round is over
      ev.roundEnd = true;
      if (!alive.length) {
        // everyone left missed: they all come back
        alive = [...missed].sort((a, b) => a - b);
        ev.reinstated = [...alive];
      } else {
        for (const s of missed) bee.placings.push({ seat: s, place: alive.length + 1, round: bee.round });
      }
      missed = [];
      if (alive.length === 1) {
        bee.champion = alive[0];
        bee.placings.push({ seat: alive[0], place: 1, round: bee.round });
        ev.champion = alive[0];
        return ev;
      }
      bee.round++;
      queue = [...alive];
      return ev;
    },
  };
  // a hall of one has nobody to beat: they still spell a round
  return bee;
}

/* ── Bots ─────────────────────────────────────────────────────────────
   A bot is a speller of fixed ability (it gets 60% to 86% of words right),
   and what happens on turn k depends only on the seed, the bot and k. */
const letters = 'abcdefghijklmnopqrstuvwxyz';
/** A believable wrong spelling: a doubled letter dropped or added, two swapped, a vowel changed. */
function misspell(word, rng) {
  const w = word.toLowerCase();
  const at = 1 + Math.floor(rng() * Math.max(1, w.length - 1));
  const kind = Math.floor(rng() * 4);
  let out = w;
  if (kind === 0 && w.length > 3) out = w.slice(0, at) + w.slice(at + 1);                       // a letter left out
  else if (kind === 1) out = w.slice(0, at) + w[at - 1] + w.slice(at);                         // a letter doubled
  else if (kind === 2 && at < w.length - 1) out = w.slice(0, at) + w[at + 1] + w[at] + w.slice(at + 2);   // two swapped
  else {
    const vowels = 'aeiou';
    const i = [...w].findIndex((c, n) => n >= at - 1 && vowels.includes(c));
    const n = i < 0 ? at : i;
    const pool = vowels.includes(w[n]) ? vowels : letters;
    let c = pool[Math.floor(rng() * pool.length)];
    if (c === w[n]) c = pool[(pool.indexOf(c) + 1) % pool.length];
    out = w.slice(0, n) + c + w.slice(n + 1);
  }
  return out === w ? `${w}e` : out;
}
/**
 * A bot's turn k on `word` → { ok, typed, ms } (ms: how long it stands at the mic).
 */
export function botSpelling(seed, slot, k, word) {
  const ability = 0.6 + mulberry32(hashSeed(seed, 7100 + slot))() * 0.26;
  const rng = mulberry32(hashSeed(hashSeed(seed, 7200 + slot), k));
  const ok = rng() < ability;
  const ms = 2600 + Math.round(rng() * 2400) + word.length * 260;
  return { ok, typed: ok ? word.toLowerCase() : misspell(word, rng), ms };
}
