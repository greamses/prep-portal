/* ============================================================================
   PRINTABLE WORKBOOK — dice and a pack of cards
   ----------------------------------------------------------------------------
   Probability is the one topic where the paper cannot keep its promise. A page
   can say "roll a die 60 times and see how close you get", and no child has
   ever done it. So the die and the pack live here, drawn for the paper and
   rollable on screen:

     on paper   a die (or two), a card, and a tally chart with empty boxes
     on screen  a sticky note that says ROLL, the die turning, and the tally
                filling itself in as the rolls come — sixty rolls in a minute

   The experiment is NOT marked. It cannot be: the whole point is that it comes
   out differently every time. What is marked is what the child reads OFF it —
   the fraction, the relative frequency, whether it is close to what the theory
   said — and those are ordinary answer boxes beside it.

   The maths of a die and of a pack has no DOM in it, so the answer checks run
   it all in Node: `oddsOf`, `cardsMatching`, `sumTable`.
   ========================================================================== */

/* ── a die ───────────────────────────────────────────────────────────────── */

/* Where the pips sit on each face, in thirds of the square. */
const PIPS = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [3, 1], [1, 3], [3, 3]],
  5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]],
  6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
};

/**
 * One die face, `mm` across.
 *   face   1–6, or 0 for a blank die (one to be rolled on screen)
 */
export function dieSvg(face, { mm = 16, label = "" } = {}) {
  const pips = (PIPS[face] || []).map(([c, r]) =>
    `<circle cx="${(c * 25).toFixed(1)}" cy="${(r * 25).toFixed(1)}" r="8" fill="#2a2723"/>`).join("");
  return `<svg class="ch-die" viewBox="0 0 100 100" width="${mm}mm" height="${mm}mm" role="img"` +
    ` aria-label="${label || (face ? `A die showing ${face}` : "A die")}" data-face="${face || 0}">` +
    `<rect x="4" y="4" width="92" height="92" rx="18" fill="#fffdf8" stroke="#2a2723" stroke-width="4"/>` +
    pips + `</svg>`;
}

/* ── a pack of cards ─────────────────────────────────────────────────────── */

export const SUITS = [
  { id: "hearts", sign: "♥", name: "Hearts", red: true },
  { id: "diamonds", sign: "♦", name: "Diamonds", red: true },
  { id: "clubs", sign: "♣", name: "Clubs", red: false },
  { id: "spades", sign: "♠", name: "Spades", red: false },
];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

/** The 52 cards, in pack order: 0–51. */
export const PACK = SUITS.flatMap((s, si) => RANKS.map((r, ri) => ({
  id: si * 13 + ri, rank: r, suit: s.id, sign: s.sign, red: s.red,
  face: r === "J" || r === "Q" || r === "K",
  value: ri + 1,
})));

/** How many cards in the pack answer to this description. */
export function cardsMatching(what) {
  const test = {
    red: (c) => c.red,
    black: (c) => !c.red,
    heart: (c) => c.suit === "hearts",
    diamond: (c) => c.suit === "diamonds",
    club: (c) => c.suit === "clubs",
    spade: (c) => c.suit === "spades",
    king: (c) => c.rank === "K",
    queen: (c) => c.rank === "Q",
    jack: (c) => c.rank === "J",
    ace: (c) => c.rank === "A",
    picture: (c) => c.face,
    number: (c) => !c.face && c.rank !== "A",
    even: (c) => !c.face && c.rank !== "A" && Number(c.rank) % 2 === 0,
    "red king": (c) => c.red && c.rank === "K",
    "black picture": (c) => !c.red && c.face,
    ten: (c) => c.rank === "10",
  }[what];
  if (!test) return 0;
  return PACK.filter(test).length;
}

/** A playing card, `mm` wide. `card` is null for the back of the card. */
export function cardSvg(card, { mm = 20, label = "" } = {}) {
  const w = 100;
  const h = 144;
  if (!card) {
    return `<svg class="ch-card is-back" viewBox="0 0 ${w} ${h}" width="${mm}mm" height="${(mm * h / w).toFixed(1)}mm"` +
      ` role="img" aria-label="${label || "The back of a card"}">` +
      `<rect x="3" y="3" width="94" height="138" rx="10" fill="#bfe3ff" stroke="#2a2723" stroke-width="3"/>` +
      `<rect x="13" y="13" width="74" height="118" rx="6" fill="none" stroke="#2a2723" stroke-width="2" stroke-dasharray="6 5"/>` +
      `</svg>`;
  }
  const col = card.red ? "#c0453f" : "#2a2723";
  /* A real pack turns its second index upside down; here it stays upright,
     because an upside-down ♥ reads as a ♠ and the suits are the lesson. */
  const corner = (x, y) =>
    `<g transform="translate(${x} ${y})">` +
    `<text x="0" y="0" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="22" font-weight="800" fill="${col}">${card.rank}</text>` +
    `<text x="0" y="20" text-anchor="middle" font-size="20" fill="${col}">${card.sign}</text></g>`;
  return `<svg class="ch-card" viewBox="0 0 ${w} ${h}" width="${mm}mm" height="${(mm * h / w).toFixed(1)}mm"` +
    ` role="img" aria-label="${label || `The ${card.rank} of ${card.suit}`}" data-card="${card.id}">` +
    `<rect x="3" y="3" width="94" height="138" rx="10" fill="#fffdf8" stroke="#2a2723" stroke-width="3"/>` +
    corner(20, 30) + corner(80, 114) +
    `<text x="50" y="84" text-anchor="middle" font-size="44" fill="${col}">${card.sign}</text>` +
    `</svg>`;
}

/* ── the maths, with no DOM in it ────────────────────────────────────────── */

/** Cancel a fraction down: oddsOf(3, 6) → { n: 1, d: 2, text: "1/2" }. */
export function oddsOf(hits, all) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  if (!hits) return { n: 0, d: 1, text: "0" };
  if (hits === all) return { n: 1, d: 1, text: "1" };
  const g = gcd(hits, all);
  const n = hits / g;
  const d = all / g;
  return { n, d, text: `${n}/${d}` };
}

/** Every total two dice can make, as a 6×6 table of sums. */
export const sumTable = () =>
  Array.from({ length: 6 }, (_, a) => Array.from({ length: 6 }, (_, b) => a + b + 2));

/** How many of the 36 ways two dice land give this total. */
export const waysToMake = (total) =>
  sumTable().flat().filter((s) => s === total).length;

/* ── on screen ───────────────────────────────────────────────────────────── */

const DICE_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4" fill="#fffdf8" stroke="#2a2723" stroke-width="2"/><circle cx="8.4" cy="8.4" r="1.8" fill="#2a2723"/><circle cx="15.6" cy="15.6" r="1.8" fill="#2a2723"/><circle cx="12" cy="12" r="1.8" fill="#2a2723"/></svg>`;

/**
 * A rolling die (or two), with the tally that fills itself.
 *
 *   div.ch-roll[data-roll][data-dice="1|2"][data-rolls="60"]
 *     div.ch-roll__stage   the dice
 *     table.ch-tally       a row per outcome, its count, and a bar
 *
 * `roll()` uses Math.random deliberately: an experiment that came out the same
 * every time would teach the opposite of the lesson. The SEED belongs to the
 * paper (which questions are asked), never to the dice.
 */
export function mountChance(wrap, { saved = null, onChange = () => {} } = {}) {
  const printed = wrap.innerHTML;
  const dice = Number(wrap.dataset.dice) || 1;
  const perPress = Number(wrap.dataset.rolls) || 1;
  const faces = dice === 2 ? sumTable().flat() : [1, 2, 3, 4, 5, 6];
  const outcomes = [...new Set(faces)].sort((a, b) => a - b);

  let state = saved && saved.counts ? { ...saved } : { counts: {}, rolls: 0, last: null };

  wrap.classList.add("is-live");
  wrap.innerHTML =
    `<div class="ch-roll__bar">` +
    `<button class="ch-btn" type="button" data-act="roll">${DICE_ICON}<b>Roll${perPress > 1 ? ` ${perPress}` : ""}</b></button>` +
    `<button class="ch-btn ch-btn--quiet" type="button" data-act="clear"><b>Start again</b></button>` +
    `<span class="ch-count" data-count></span></div>` +
    `<div class="ch-roll__stage"></div>` +
    `<table class="ch-tally"><thead><tr><th>${dice === 2 ? "Total" : "Face"}</th><th>How many</th><th></th></tr></thead>` +
    `<tbody></tbody></table>`;

  const stage = wrap.querySelector(".ch-roll__stage");
  const body = wrap.querySelector(".ch-tally tbody");
  const count = wrap.querySelector("[data-count]");

  const paint = () => {
    const most = Math.max(1, ...outcomes.map((o) => state.counts[o] || 0));
    body.innerHTML = outcomes.map((o) => {
      const n = state.counts[o] || 0;
      return `<tr><th>${o}</th><td>${n || ""}</td>` +
        `<td class="ch-bar"><span style="width:${((n / most) * 100).toFixed(1)}%"></span></td></tr>`;
    }).join("");
    count.textContent = state.rolls ? `${state.rolls} roll${state.rolls === 1 ? "" : "s"}` : "";
    stage.innerHTML = (state.last || Array.from({ length: dice }, () => 0))
      .map((f) => dieSvg(f, { mm: dice === 2 ? 14 : 18 })).join("");
  };

  let spinning = false;
  const roll = () => {
    if (spinning) return;
    spinning = true;
    wrap.classList.add("is-rolling");
    /* a moment of turning, so a child sees it happen rather than just the
       number changing */
    let ticks = 0;
    const shake = setInterval(() => {
      stage.innerHTML = Array.from({ length: dice }, () => dieSvg(1 + Math.floor(Math.random() * 6), { mm: dice === 2 ? 14 : 18 })).join("");
      if (++ticks < 6) return;
      clearInterval(shake);
      const before = { counts: { ...state.counts }, rolls: state.rolls, last: state.last };
      for (let i = 0; i < perPress; i++) {
        const thrown = Array.from({ length: dice }, () => 1 + Math.floor(Math.random() * 6));
        const key = dice === 2 ? thrown[0] + thrown[1] : thrown[0];
        state.counts[key] = (state.counts[key] || 0) + 1;
        state.rolls++;
        state.last = thrown;
      }
      wrap.classList.remove("is-rolling");
      spinning = false;
      paint();
      onChange({ counts: { ...state.counts }, rolls: state.rolls, last: state.last }, before);
    }, 60);
  };

  const clear = () => {
    const before = { counts: { ...state.counts }, rolls: state.rolls, last: state.last };
    state = { counts: {}, rolls: 0, last: null };
    paint();
    onChange({ ...state }, before);
  };

  const onClick = (e) => {
    if (e.target.closest('[data-act="roll"]')) roll();
    if (e.target.closest('[data-act="clear"]')) clear();
  };
  wrap.addEventListener("click", onClick);
  paint();

  return {
    state: () => ({ counts: { ...state.counts }, rolls: state.rolls, last: state.last }),
    roll,
    set(next) { state = next && next.counts ? { ...next } : { counts: {}, rolls: 0, last: null }; paint(); },
    clear,
    dispose() {
      wrap.removeEventListener("click", onClick);
      wrap.classList.remove("is-live", "is-rolling");
      wrap.innerHTML = printed;
    },
  };
}

/**
 * A pack to draw from: the back of the card, a DRAW note, and what has come
 * out so far. Drawn WITHOUT replacement until the pack is empty (a child who
 * draws every card can see the 52 are really there), with a note saying so.
 */
export function mountPack(wrap, { saved = null, onChange = () => {} } = {}) {
  const printed = wrap.innerHTML;
  let state = saved && Array.isArray(saved.drawn) ? { drawn: [...saved.drawn] } : { drawn: [] };

  wrap.classList.add("is-live");
  wrap.innerHTML =
    `<div class="ch-roll__bar">` +
    `<button class="ch-btn" type="button" data-act="draw"><b>Draw a card</b></button>` +
    `<button class="ch-btn ch-btn--quiet" type="button" data-act="shuffle"><b>Put them back</b></button>` +
    `<span class="ch-count" data-count></span></div>` +
    `<div class="ch-pack"></div>` +
    `<div class="ch-drawn"></div>`;

  const pack = wrap.querySelector(".ch-pack");
  const out = wrap.querySelector(".ch-drawn");
  const count = wrap.querySelector("[data-count]");

  const paint = () => {
    const last = state.drawn.length ? PACK[state.drawn[state.drawn.length - 1]] : null;
    pack.innerHTML = cardSvg(null, { mm: 22 }) + (last ? cardSvg(last, { mm: 22 }) : "");
    out.innerHTML = state.drawn.slice(0, -1).map((id) => cardSvg(PACK[id], { mm: 11 })).join("");
    const left = 52 - state.drawn.length;
    count.textContent = state.drawn.length
      ? `${state.drawn.length} drawn · ${left} left` : "";
  };

  const draw = () => {
    if (state.drawn.length >= 52) return;
    const before = { drawn: [...state.drawn] };
    const left = PACK.map((c) => c.id).filter((id) => !state.drawn.includes(id));
    state.drawn.push(left[Math.floor(Math.random() * left.length)]);
    paint();
    onChange({ drawn: [...state.drawn] }, before);
  };

  const shuffle = () => {
    const before = { drawn: [...state.drawn] };
    state = { drawn: [] };
    paint();
    onChange({ drawn: [] }, before);
  };

  const onClick = (e) => {
    if (e.target.closest('[data-act="draw"]')) draw();
    if (e.target.closest('[data-act="shuffle"]')) shuffle();
  };
  wrap.addEventListener("click", onClick);
  paint();

  return {
    state: () => ({ drawn: [...state.drawn] }),
    draw,
    set(next) { state = next && Array.isArray(next.drawn) ? { drawn: [...next.drawn] } : { drawn: [] }; paint(); },
    clear: shuffle,
    dispose() {
      wrap.removeEventListener("click", onClick);
      wrap.classList.remove("is-live");
      wrap.innerHTML = printed;
    },
  };
}

/* ── the markup the paper prints ─────────────────────────────────────────── */

/** A die (or two) to roll, with a tally chart under it. */
export function rollHtml({ dice = 1, rolls = 10, outcomes = null, label = "" } = {}) {
  const list = outcomes || (dice === 2 ? [...new Set(sumTable().flat())].sort((a, b) => a - b) : [1, 2, 3, 4, 5, 6]);
  /* `ch-write`, not `wb-cell`: the tally is the experiment's own record —
     filled in by hand on paper, filled by the component on screen — and it
     is never marked, so it must not count as an answer place. */
  const rows = list.map((o) => `<tr><th>${o}</th><td class="ch-write"></td><td class="ch-bar"></td></tr>`).join("");
  return `<div class="ch-roll wb-nomath" data-roll="1" data-dice="${dice}" data-rolls="${rolls}"` +
    `${label ? ` aria-label="${label}"` : ""}>` +
    `<div class="ch-roll__stage">${Array.from({ length: dice }, () => dieSvg(0, { mm: dice === 2 ? 14 : 18 })).join("")}</div>` +
    `<table class="ch-tally"><thead><tr><th>${dice === 2 ? "Total" : "Face"}</th><th>How many</th><th></th></tr></thead>` +
    `<tbody>${rows}</tbody></table></div>`;
}

/** A pack to draw from. */
export function packHtml({ label = "" } = {}) {
  return `<div class="ch-pack-wrap wb-nomath" data-pack="1"${label ? ` aria-label="${label}"` : ""}>` +
    `<div class="ch-pack">${cardSvg(null, { mm: 22 })}</div></div>`;
}
