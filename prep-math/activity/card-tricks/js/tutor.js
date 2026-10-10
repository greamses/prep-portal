/* ============================================================================
   CARD TRICKS — PrepBot teaches each trick, on its TV
   ----------------------------------------------------------------------------
   PrepBot never explains from thin air: it stands in its TV, speaks in its
   own voice, and what it is talking about happens on the screen beside it
   (/prep-math/mental-math/shared/prepbot-tv.js and prepbot-teacher.js — the
   same set and the same PrepBot as every other lesson on the site). Nothing
   here draws a TV or a bot. This file only says what PrepBot SAYS and what
   the cards on the screen DO while it says it.

   Two rules for these lessons, both the user's:

     NOTHING IS SKIPPED. Every card that moves in the trick moves on the
     screen: all 27 are dealt one at a time, three times; all 52 are there
     for Eleven, and every card turned or counted is turned or counted.

     THE WHY IS SHOWN WITH THE CARDS. The reason a trick works is not a
     sentence at the end: the cards are coloured, counted and moved until it
     can be seen.

   Each lesson is the REAL trick, played by the same arithmetic as the table
   (deck.js) — so what is shown is what will happen.

   A step states where every card is. It can therefore be shown again at
   once, which is how the set goes back a step.
   ========================================================================== */

import { openTv } from "/prep-math/mental-math/shared/prepbot-tv.js";
import { faceSvg, backSvg } from "./art.js";
import { fullDeck, seeded, dealRound, gather, base3, playEleven, valueOf, nameOf } from "./deck.js";

const art = (what) => (what === "back" ? backSvg("red") : what === "blue" ? backSvg("blue") : faceSvg(what, { label: false }));
const SAY = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
const piles = (k) => (k === 0 ? "no piles" : k === 1 ? "one pile" : "two piles");

/**
 * The few things a step does to the screen. Everything is found by a key, so
 * a step that runs again finds what it made the first time.
 */
function kit(stage, { gsap, instant }) {
  const root = stage.querySelector(".ct-tv");
  const live = !!gsap && !instant;

  function piece(key, cls) {
    let el = root.querySelector(`[data-k="${key}"]`);
    const fresh = !el;
    if (fresh) {
      el = document.createElement("div");
      el.dataset.k = key;
      el.className = cls;
      root.appendChild(el);
    }
    return { el, fresh };
  }

  /** Bring a piece to a place (percent of the screen), arriving if it is new. */
  function bring(el, fresh, x, y, { delay = 0, dur = 0.5 } = {}) {
    const end = { left: `${x}%`, top: `${y}%`, opacity: 1 };
    if (!gsap) { el.style.left = end.left; el.style.top = end.top; el.style.opacity = "1"; return; }
    if (!live) { gsap.killTweensOf(el); gsap.set(el, { ...end, scaleX: 1 }); return; }
    if (fresh) gsap.fromTo(el, { left: end.left, top: `${y - 5}%`, opacity: 0 }, { ...end, duration: 0.35, delay, ease: "power2.out", overwrite: "auto" });
    else gsap.to(el, { ...end, duration: dur, delay, ease: "power2.inOut", overwrite: "auto" });
  }

  const api = {
    /**
     * A card: "back", "blue", or a face like "7H". `size` "s" (one of many)
     * or "m". If it is showing something else it turns over on the way.
     */
    card(key, what, x, y, { delay = 0, z = 1, size = "s", dur = 0.5 } = {}) {
      const { el, fresh } = piece(key, `ct-tv__card ct-tv__card--${size}`);
      /* a card can grow when it is picked out of the line */
      el.classList.toggle("ct-tv__card--s", size === "s");
      el.classList.toggle("ct-tv__card--m", size === "m");
      /* What it is MEANT to show is settled at once; what it shows catches
         up on the way. A card told twice in one step (laid in the line, then
         picked out and turned) therefore ends as the last telling had it. */
      /* A card can be told more than once in a step: dealt FACE UP, and a
         few seconds later turned face down with the rest of its pile. Each
         telling happens at its own moment, and a telling never undoes one
         that was timed after it — so the card is seen face up, and then
         seen to turn. */
      const when = live && !fresh ? delay + dur * 0.4 : 0;
      const swap = () => {
        if (when < (el.turnedAt || 0)) return;
        el.turnedAt = when;
        if (el.dataset.art !== what) { el.dataset.art = what; el.innerHTML = art(what); }
      };
      if (!live) { el.turnedAt = 0; swap(); }
      else if (fresh) swap();
      else gsap.delayedCall(when, () => { if (el.isConnected) swap(); });
      if (live && !fresh) gsap.delayedCall(delay, () => { el.style.zIndex = String(z + 500); });
      if (live && !fresh) gsap.delayedCall(delay + dur, () => { el.style.zIndex = String(z); });
      else el.style.zIndex = String(z);
      bring(el, fresh, x, y, { delay, dur });
      return el;
    },
    /** Words or a number on the cloth. `cls`: "big", "gold", "small", "row". */
    text(key, words, x, y, cls = "", opts = {}) {
      const { el, fresh } = piece(key, `ct-tv__txt ${cls ? `ct-tv__txt--${cls}` : ""}`);
      el.innerHTML = words;
      bring(el, fresh, x, y, opts);
      return el;
    },
    /** Everything written so far is wiped: a step then writes what it wants seen. */
    wipe() {
      root.querySelectorAll(".ct-tv__txt").forEach((el) => {
        if (live) gsap.to(el, { opacity: 0, duration: 0.25, overwrite: "auto" }); else if (gsap) { gsap.killTweensOf(el); gsap.set(el, { opacity: 0 }); } else el.style.opacity = "0";
      });
    },
    gone(key) {
      const el = root.querySelector(`[data-k="${key}"]`);
      if (!el) return;
      if (live) gsap.to(el, { opacity: 0, duration: 0.3, overwrite: "auto" }); else if (gsap) { gsap.killTweensOf(el); gsap.set(el, { opacity: 0 }); } else el.style.opacity = "0";
    },
    /** The gold light on a card, on or off — after a wait, if one is given. */
    lit(key, on = true, delay = 0) {
      const el = root.querySelector(`[data-k="${key}"]`);
      if (!el) return;
      if (live && delay) gsap.delayedCall(delay, () => el.classList.toggle("is-lit", on)); else el.classList.toggle("is-lit", on);
    },
    /** A colour on a card (0, 1, 2) or none (-1): which nine it belongs to. */
    band(key, n) {
      const el = root.querySelector(`[data-k="${key}"]`);
      if (!el) return;
      el.classList.remove("is-b0", "is-b1", "is-b2");
      if (n >= 0) el.classList.add(`is-b${n}`);
    },
    /**
     * A number that counts: it is written at each place in turn, a beat
     * apart, and stays at the last one.
     */
    count(key, n, at, { gap = 0.3, delay = 0, cls = "gold", from = 1 } = {}) {
      if (n < from) return;
      const set = (i) => api.text(key, String(i), ...at(i), cls, { dur: 0.12 });
      if (!live) { set(n); return; }
      for (let i = from; i <= n; i++) gsap.delayedCall(delay + (i - from) * gap, () => { if (root.isConnected) set(i); });
    },
  };
  return api;
}

const build = (stage) => { stage.innerHTML = `<div class="ct-tv"></div>`; };
const step = (say, show) => ({ say, show: (stage, ctx) => show(kit(stage, ctx)) });

/* ══ 27 CARDS ═════════════════════════════════════════════════════════════
   The whole pack is on the screen the whole time: as a column down the left
   when it is a pack (the top of the column is the top of the pack, card 1),
   and as three columns of nine when it is dealt. */

const DECK27 = ["7S", "KD", "3C", "9H", "2S", "JC", "5D", "AH", "8C", "4D", "QS", "6H", "10C", "3S", "KH", "7D", "2C", "9S", "5H", "QH", "AC", "8D", "4S", "JH", "6C", "10D", "AS"];
const MINE27 = "QH";

const packAt = (i) => [9, 16 + i * 2.85];   // clear of the set's "Step 3 of 21" sticker
const pileAt = (p, r) => [34 + p * 15, 13 + r * 8.6];

/** The real trick, worked for this number: every pack and every deal on the way. */
function play27(n) {
  const ks = base3(n);
  let pack = DECK27.slice();
  const rounds = [];
  for (let r = 0; r < 3; r++) {
    const dealt = dealRound(pack, 3);
    const mine = dealt.findIndex((p) => p.includes(MINE27));
    const order = [0, 1, 2].filter((i) => i !== mine);
    order.splice(ks[r], 0, mine);
    const next = gather(dealt, order);
    rounds.push({ pack, dealt, mine, order, next, k: ks[r] });
    pack = next;
  }
  return { ks, rounds, last: pack };
}

/* the pack, as a column: every card to its place, a moment after the one above */
function layPack(k, pack, { gap = 0, block = 0 } = {}) {
  pack.forEach((id, i) => k.card(id, "back", ...packAt(i), { z: i + 1, delay: Math.floor(i / 9) * block + (block ? (i % 9) * 0.04 : i * gap) }));
  k.lit(MINE27);
}
/* dealt: off the top one at a time, turned face up, to each pile in turn */
function layPiles(k, pack, dealt, gap = 0.11) {
  dealt.forEach((pile, p) => pile.forEach((id, r) => k.card(id, id, ...pileAt(p, r), { z: r + 1, delay: pack.indexOf(id) * gap, dur: 0.42 })));
  k.lit(MINE27);
}

function lesson27(n) {
  const { ks, rounds, last } = play27(n);
  const [ones, threes, nines] = ks;
  const m = n - 1;
  const PLACE = ["ones", "threes", "nines"];
  const ORD = ["first", "second", "third"];
  const out = [];

  out.push(step("Here are twenty seven cards in a pack, face down. I have laid the pack out in a line so that you can see every card. The top of the line is the top of the pack. That is card one. The bottom is card twenty seven.", (k) => {
    k.wipe();
    DECK27.forEach((id, i) => k.card(id, "back", ...packAt(i), { z: i + 1, delay: i * 0.05 }));
    k.text("top", "card 1", 20, packAt(0)[1], "small", { delay: 1.4 });
    k.text("bot", "card 27", 20, packAt(26)[1], "small", { delay: 1.6 });
  }));

  out.push(step(`I am thinking of one of these cards. In the real trick you cannot see which. Here I will light it up in gold, so that you can follow it. Your number is ${n}. Your job is to move my gold card to place ${n}, without ever touching it on its own.`, (k) => {
    k.wipe();
    layPack(k, DECK27);
    k.text("want", `place ${n}`, 21, packAt(n - 1)[1], "gold");
    k.text("n", String(n), 84, 16, "big");
    k.text("nl", "your number", 84, 30, "small");
  }));

  rounds.forEach((round, r) => {
    const want = `place ${n}`;
    out.push(step(`${r === 0 ? "Now the first deal" : `The ${ORD[r]} deal is done the same way`}. Take the cards off the top, one at a time, and turn each one face up. One for the first pile. One for the second. One for the third. Then round again, until all twenty seven are down.`, (k) => {
      k.wipe();
      layPiles(k, round.pack, round.dealt);
      k.text("dn", `deal ${r + 1}`, 84, 16, "big");
    }));

    out.push(step("Every pile has nine cards. Now I tell you which pile my card is in. It is this one. I always tell you.", (k) => {
      k.wipe();
      layPiles(k, round.pack, round.dealt, 0);
      k.text("dn", `deal ${r + 1}`, 84, 16, "big");
      k.text("arrow", "my card is here", pileAt(round.mine, 0)[0], 4, "gold");
    }));

    out.push(step(`Now you gather the piles into one pack again. This is where you steer. ${r === 0
      ? `Take one away from your number. ${n} take away one is ${m}. Split ${m} into nines, threes and ones. That is ${nines} nines, ${threes} threes and ${ones} ones. The first gather uses the ones. So`
      : `This gather uses the ${PLACE[r]}. You have ${round.k} ${PLACE[r]}. So`} ${piles(round.k)} ${round.k === 1 ? "goes" : "go"} on top of my pile, and the rest go underneath.`, (k) => {
      k.wipe();
      layPiles(k, round.pack, round.dealt, 0);
      k.text("sum", `${n} − 1 = ${m}`, 84, 12, "gold");
      k.text("s9", `${nines} nines`, 84, 24, r === 2 ? "big" : "small");
      k.text("s3", `${threes} threes`, 84, 35, r === 1 ? "big" : "small");
      k.text("s1", `${ones} ones`, 84, 46, r === 0 ? "big" : "small");
      k.text("use", `${piles(round.k)} on top`, 84, 60, "gold");
    }));

    out.push(step(`Watch. ${round.order.map((p, i) => `${i === 0 ? "On top goes" : i === 1 ? "Then" : "And at the bottom,"} ${p === round.mine ? "my pile" : `the ${["first", "second", "third"][p]} pile`}`).join(". ")}. The pack is turned face down again. Keep your eye on the gold card.`, (k) => {
      k.wipe();
      layPack(k, round.next, { block: 1.1 });
      k.text("want", want, 21, packAt(n - 1)[1], "gold");
      k.text("use", `${piles(round.k)} on top of mine`, 84, 16, "small");
    }));
  });

  out.push(step(`Three deals and three gathers are done. Now count down from the top of the pack, one card at a time. ${n <= 8 ? Array.from({ length: n }, (_, i) => SAY[i + 1] || i + 1).join(", ") : `One, two, three, and on, all the way to ${n}`}. There it is. My gold card is at place ${n}, exactly where you sent it.`, (k) => {
    k.wipe();
    layPack(k, last);
    k.count("tick", n, (i) => [20, packAt(i - 1)[1]], { gap: Math.min(0.3, 4.5 / n) });
  }));

  out.push(step("Pull that card out and turn it over. It is the queen of hearts. Lay it against my copy, and turn my copy over. They are the same card. You win.", (k) => {
    k.wipe();
    layPack(k, last);
    k.card(MINE27, MINE27, 50, 40, { z: 900, size: "m", dur: 0.8 });
    k.card("copy", "blue", 64, 40, { z: 800, size: "m" });
    k.card("copy", MINE27, 64, 40, { z: 800, size: "m", delay: 1.4 });
    k.text("win", "a match", 57, 68, "gold", { delay: 1.9 });
  }));

  /* ── WHY, with the cards ─────────────────────────────────────────────── */

  out.push(step("Now, why does it work? Let me show you with the cards. Here is the pack again. I will colour the top nine cards blue, the middle nine green, and the bottom nine pink. Nine cards is one whole pile.", (k) => {
    k.wipe();
    k.gone("copy");
    layPack(k, last);
    last.forEach((id, i) => k.band(id, Math.floor(i / 9)));
    k.text("b0", "top nine: places 1 to 9", 30, packAt(4)[1], "small");
    k.text("b1", "middle nine: places 10 to 18", 31, packAt(13)[1], "small");
    k.text("b2", "bottom nine: places 19 to 27", 31, packAt(22)[1], "small");
  }));

  out.push(step(`Think about the last gather. If you put no piles on top of mine, my pile is the blue nine, and my card is somewhere in places one to nine. One pile on top, and mine is the green nine: places ten to eighteen. Two piles on top, and mine is the pink nine: nineteen to twenty seven. You put ${piles(nines)} on top. So the last gather chooses which nine.`, (k) => {
    k.wipe();
    layPack(k, last);
    last.forEach((id, i) => k.band(id, Math.floor(i / 9)));
    k.text("c0", "0 piles on top → 1 to 9", 62, 22, nines === 0 ? "gold" : "small");
    k.text("c1", "1 pile on top → 10 to 18", 62, 38, nines === 1 ? "gold" : "small");
    k.text("c2", "2 piles on top → 19 to 27", 62, 54, nines === 2 ? "gold" : "small");
    k.text("cw", "the last gather chooses which NINE", 62, 74, "row");
  }));

  const again = dealRound(last, 3);
  out.push(step("Now watch what a deal does to those colours. I deal this pack once more. One, two, three, and round. Look where the blue cards land. They are the top three cards of every pile. The green cards are the middle three. The pink cards are the bottom three.", (k) => {
    k.wipe();
    again.forEach((pile, p) => pile.forEach((id, r) => { k.card(id, id, ...pileAt(p, r), { z: r + 1, delay: last.indexOf(id) * 0.11, dur: 0.42 }); k.band(id, Math.floor(last.indexOf(id) / 9)); }));
    k.lit(MINE27);
    k.text("r0", "top three", 84, pileAt(0, 1)[1], "small", { delay: 3 });
    k.text("r1", "middle three", 84, pileAt(0, 4)[1], "small", { delay: 3 });
    k.text("r2", "bottom three", 84, pileAt(0, 7)[1], "small", { delay: 3 });
  }));

  out.push(step("So a deal shrinks nine places into three. Where my pile sat in the pack, top, middle or bottom, now says how deep my card is inside its new pile: in the top three, the middle three, or the bottom three. That is why the gather before the last one chooses which three. And the very first gather, shrunk twice, chooses which one.", (k) => {
    k.wipe();
    again.forEach((pile, p) => pile.forEach((id, r) => { k.card(id, id, ...pileAt(p, r), { z: r + 1 }); k.band(id, Math.floor(last.indexOf(id) / 9)); }));
    k.lit(MINE27);
    k.text("w3", "last gather → which NINE", 84, 20, "small");
    k.text("w2", "gather before → which THREE", 84, 34, "small");
    k.text("w1", "first gather → which ONE", 84, 48, "small");
  }));

  out.push(step(`Nines, threes and ones. That is counting in threes, the way we usually count in tens. For your number: ${n} take away one is ${m}. ${nines} nines, ${threes} threes, ${ones} ones. First gather, ${piles(ones)} on top. Second gather, ${piles(threes)}. Third gather, ${piles(nines)}. Now you try it at the table. One tip: tap each pile to turn it face down before you stack them, so that on top really means on top.`, (k) => {
    k.wipe();
    again.forEach((pile, p) => pile.forEach((id, r) => { k.card(id, id, ...pileAt(p, r), { z: r + 1 }); k.band(id, -1); }));
    k.lit(MINE27);
    k.text("sum", `${n} − 1 = ${m}`, 84, 10, "gold");
    k.text("d1", `gather 1: <b>${ones}</b> on top`, 84, 26, "row");
    k.text("d2", `gather 2: <b>${threes}</b> on top`, 84, 40, "row");
    k.text("d3", `gather 3: <b>${nines}</b> on top`, 84, 54, "row");
  }));

  return out;
}

/* ══ ELEVEN ═══════════════════════════════════════════════════════════════
   All 52 cards, as a column down the left. The four countdown piles are
   columns in the middle, each card with the number that was said for it
   beside it. The cards counted off at the end are a column on the right. */

const deckAt = (i) => [7, 16 + i * 1.46];
const pileElevenAt = (p, r) => [37 + p * 11.5, 9 + r * 7.4];
const offAt = (i) => [89, 6 + i * 2.7];

/**
 * A pack that tells the story well: the first pile stops after a few cards,
 * the second runs longer, the third runs out, the fourth stops at once — and
 * there are not too many to count at the end. Found by trying shuffles, with
 * the real countdown (deck.js), until one fits; the same one every time.
 */
function storyEleven() {
  for (let seed = 1; seed < 60000; seed++) {
    const rnd = seeded(seed);
    const mixed = fullDeck().map((id) => [rnd(), id]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const nine = mixed.slice(0, 9);            // nine[0] is the computer's card: on top of the nine
    const over = mixed.slice(9);               // the 43, as they end up after the shuffle and the cuts
    const pack = over.concat(nine);
    const game = playEleven(pack);
    const [a, b, c, d] = game.piles;
    const fits = a.match >= 7 && a.match <= 8 && b.match >= 3 && b.match <= 6 && c.match === 0 && d.match === 10 && d.cards.length === 1
      && "JQK".includes(d.cards[0].slice(0, -1)) && game.sum <= 23 && valueOf(nine[0]) <= 9;
    if (!fits) continue;
    /* seven packets, stacked in a mixed order: work back to how the 43 lay before the cuts */
    const sizes = [6, 7, 5, 6, 7, 6, 6];
    const order = [3, 0, 5, 1, 6, 2, 4];       // which packet is on top, then under it, …
    const packets = [];
    let at = 0;
    order.forEach((p) => { packets[p] = over.slice(at, at + sizes[p]); at += sizes[p]; });
    const cut = packets.flat();                 // after the shuffle, before the cuts
    const start = fullDeck().filter((id) => !nine.includes(id));   // the 43 before the shuffle
    const nineStart = [nine[3], nine[6], nine[1], nine[8], nine[0], nine[2], nine[5], nine[7], nine[4]];
    return { nine, nineStart, start, cut, packets, order, over, pack, game };
  }
  return null;
}

function lessonEleven() {
  const S = storyEleven();
  if (!S) return [step("The lesson could not be set up. Try the trick at the table.", () => {})];
  const mine = S.nine[0];
  const { game } = S;
  const out = [];
  const val = (id) => valueOf(id);
  const what = (id) => { const r = id.slice(0, -1); return "JQK".includes(r) ? `${nameOf(id)}, and a picture card counts ten` : r === "A" ? `${nameOf(id)}, and an ace counts one` : nameOf(id); };

  /* where each of the 52 is, at the stages of the set-up */
  const layStart = (k, gap = 0) => {
    S.start.forEach((id, i) => k.card(id, "back", ...deckAt(i), { z: i + 1, delay: i * gap }));
    S.nineStart.forEach((id, i) => k.card(id, "back", ...deckAt(43 + i), { z: 44 + i, delay: (43 + i) * gap }));
  };
  const layNineAside = (k, order) => order.forEach((id, i) => k.card(id, "back", 21, deckAt(43 + i)[1], { z: 44 + i, delay: i * 0.05 }));
  const layPack = (k) => { S.pack.forEach((id, i) => k.card(id, "back", ...deckAt(i), { z: i + 1 })); k.lit(mine); };
  const copy = (k, face = "blue", delay = 0) => k.card("copy", face, 22, 30, { size: "m", z: 700, delay });

  out.push(step("Here is a whole pack of cards. Fifty two of them, face down. I have laid them in a line so that you can see every one. The top of the line is the top of the pack.", (k) => {
    k.wipe();
    layStart(k, 0.03);
    k.text("top", "top: card 1", 17, deckAt(0)[1], "small", { delay: 1.6 });
    k.text("bot", "bottom: card 52", 18, deckAt(51)[1], "small", { delay: 1.8 });
  }));

  out.push(step("Watch how I hide my card. First I take nine cards off the bottom of the pack, and set them to one side. Count them with me. One, two, three, four, five, six, seven, eight, nine.", (k) => {
    k.wipe();
    layStart(k);
    S.nineStart.forEach((id, i) => k.card(id, "back", 21, deckAt(43 + i)[1], { z: 44 + i, delay: i * 0.3 }));
    k.count("c9", 9, (i) => [28, deckAt(42 + i)[1]], { gap: 0.3, delay: 0.3 });
  }));

  out.push(step("I choose one of those nine. In the real trick you never see which. Here I light it in gold so that you can follow it. And I put it on top of the other eight. Remember that. My card is on top of the nine.", (k) => {
    k.wipe();
    layStart(k);
    layNineAside(k, S.nineStart);
    k.lit(mine);
    S.nine.forEach((id, i) => k.card(id, "back", 21, deckAt(43 + i)[1], { z: 44 + i, delay: 1.2, dur: 0.7 }));
    k.text("on", "mine, on top of the nine", 36, deckAt(43)[1], "gold", { delay: 2 });
  }));

  out.push(step("This is a copy of my card. It stays face down until the very end.", (k) => {
    k.wipe();
    layStart(k);
    layNineAside(k, S.nine);
    k.lit(mine);
    copy(k);
    k.text("cl", "a copy of my card", 22, 47, "small");
  }));

  out.push(step("Now the other forty three cards are shuffled. Every one of them moves. Nobody knows what order they are in now. Not you, and not me.", (k) => {
    k.wipe();
    layNineAside(k, S.nine);
    k.lit(mine);
    copy(k);
    S.cut.forEach((id, i) => k.card(id, "back", ...deckAt(i), { z: i + 1, delay: (i % 7) * 0.12, dur: 0.7 }));
    k.text("sh", "43 cards, shuffled", 24, 60, "small");
  }));

  out.push(step("Then they are cut into seven little packets. One, two, three, four, five, six, seven.", (k) => {
    k.wipe();
    layNineAside(k, S.nine);
    k.lit(mine);
    copy(k);
    let i = 0;
    S.packets.forEach((packet, p) => packet.forEach((id) => { k.card(id, "back", p % 2 ? 13 : 7, deckAt(i)[1] + p * 0.5, { z: i + 1, delay: p * 0.35 }); i += 1; }));
  }));

  out.push(step("And the seven packets are stacked on top of the nine, in any order at all. All forty three cards are now on top of my gold card.", (k) => {
    k.wipe();
    copy(k);
    S.nine.forEach((id, i) => k.card(id, "back", ...deckAt(43 + i), { z: 44 + i }));
    k.lit(mine);
    S.order.forEach((p, t) => S.packets[p].forEach((id) => k.card(id, "back", ...deckAt(S.over.indexOf(id)), { z: S.over.indexOf(id) + 1, delay: 0.5 + (6 - t) * 0.45, dur: 0.6 })));
  }));

  out.push(step("So count from the top. There are forty three cards above my card. That makes my card number forty four. However the others were shuffled, mine is the forty fourth card. Keep that number in your head: forty four.", (k) => {
    k.wipe();
    layPack(k);
    copy(k);
    k.text("a43", "43 cards above it", 19, deckAt(21)[1], "small");
    k.text("a44", "card 44", 16, deckAt(43)[1], "gold");
  }));

  out.push(step("Now it is your turn, and you do all of it. You are going to make four piles. For each pile you turn cards face up and count down from ten. An ace counts one. A number card counts its number. A jack, a queen or a king counts ten.", (k) => {
    k.wipe();
    layPack(k);
    copy(k);
    k.card("x1", "AD", 44, 40, { size: "m", z: 600 });
    k.card("x2", "7C", 58, 40, { size: "m", z: 600, delay: 0.3 });
    k.card("x3", "KS", 72, 40, { size: "m", z: 600, delay: 0.6 });
    k.text("v1", "1", 44, 62, "big", { delay: 0.2 });
    k.text("v2", "7", 58, 62, "big", { delay: 0.5 });
    k.text("v3", "10", 72, 62, "big", { delay: 0.8 });
  }));

  /* the cards of the piles, as far as pile `upto`, card `last` of it */
  const layPiles = (k, upto, lastCard, { animate = null, turnedDead = true, said = true } = {}) => {
    ["x1", "x2", "x3"].forEach(k.gone);
    game.piles.forEach((pile, p) => {
      if (p > upto) return;
      pile.cards.forEach((id, r) => {
        if (p === upto && r > lastCard) return;
        const moving = animate && animate(p, r);
        const dead = pile.match === 0 && (p < upto || (turnedDead && lastCard >= 11));
        k.card(id, dead ? "back" : id, ...pileElevenAt(p, r), { z: 100 + r, delay: moving ? moving.delay : 0, dur: 0.45 });
        /* the number said for each card — and for the card after "one", nought */
        if (said) k.text(`n${p}-${r}`, String(10 - r), pileElevenAt(p, r)[0] - 4.4, pileElevenAt(p, r)[1], "tiny", { delay: moving ? moving.delay : 0 });
      });
    });
  };
  const layRest = (k) => {
    const used = new Set(game.piles.flatMap((p) => p.cards));
    S.pack.forEach((id, i) => { if (!used.has(id)) k.card(id, "back", ...deckAt(i), { z: i + 1 }); });
    k.lit(mine);
    copy(k);
  };
  const stops = (k, upto) => game.piles.forEach((pile, p) => {
    if (p <= upto) k.text(`st${p}`, pile.match ? `stop: ${pile.match}` : "out: 0", pileElevenAt(p, 0)[0], 96, "tiny");
  });

  /* pile one, a card at a time */
  game.piles[0].cards.forEach((id, r) => {
    const count = 10 - r;
    const hit = val(id) === count;
    out.push(step(`${r === 0 ? "The first pile. Turn the top card face up and say ten." : `Turn the next card and say ${SAY[count]}.`} It is ${what(id)}. ${hit
      ? `You said ${SAY[count]}, and the card says ${SAY[count]}. They match! So you stop. This pile is finished. It stopped on ${SAY[count]}.`
      : `You said ${SAY[count]}, but the card says ${SAY[val(id)]}. They do not match. So you keep going.`}`, (k) => {
      k.wipe();
      layRest(k);
      layPiles(k, 0, r, { animate: (p, rr) => (rr === r ? { delay: 0.2 } : null) });
      if (hit) { k.lit(id, true, 0.9); stops(k, 0); }
    }));
  });

  const telling = (pile) => pile.cards.slice(0, 10).map((_, r) => SAY[10 - r]).join(", ");
  [1, 2, 3].forEach((p) => {
    const pile = game.piles[p];
    const said = pile.match
      ? `${telling(pile)}. The card says ${SAY[pile.match]} and you said ${SAY[pile.match]}. A match. This pile stops on ${SAY[pile.match]}.`
      : `${telling(pile)}. You got all the way down to one, and no card matched. So you turn one more card, face up like the others, and say nought. Now look at them all: not one card matched its number. So the whole pile is turned face down. That pile is out. It counts nothing.`;
    out.push(step(`${["", "The second pile. Start again at ten.", "The third pile. Ten again.", "The last pile. Ten."][p]} ${p === 3 ? `It is ${what(pile.cards[0])}. You said ten, and it counts ten. A match on the very first card. This pile stops on ten.` : said}`, (k) => {
      k.wipe();
      layRest(k);
      layPiles(k, p, 99, { animate: (pp, r) => (pp === p ? { delay: 0.2 + r * 0.55 } : null), turnedDead: false });
      /* the pile that ran out is turned over once its eleventh card is down */
      /* every card of it has been dealt FACE UP and counted, the eleventh
         too; only then, after a look, is the pile turned over */
      if (!pile.match) pile.cards.forEach((id, r) => k.card(id, "back", ...pileElevenAt(p, r), { z: 100 + r, delay: 0.2 + 11 * 0.55 + 2.4 }));
      else k.lit(pile.cards[pile.cards.length - 1], true, 0.2 + pile.cards.length * 0.55);
      game.piles.forEach((q, i) => { if (i < p && q.match) k.lit(q.cards[q.cards.length - 1]); });
      stops(k, p - 1);
      k.text(`st${p}`, pile.match ? `stop: ${pile.match}` : "out: 0", pileElevenAt(p, 0)[0], 96, "tiny", { delay: 0.2 + pile.cards.length * 0.55 + (pile.match ? 0.5 : 2.8) });
    }));
  });

  const sumLine = `${game.piles.map((p) => p.match).join(" + ")} = ${game.sum}`;
  const layAllPiles = (k) => { layPiles(k, 3, 99); game.piles.forEach((q) => { if (q.match) k.lit(q.cards[q.cards.length - 1]); }); stops(k, 3); };
  out.push(step(`Four piles. Now add up the numbers the piles stopped on. ${game.piles.map((p) => SAY[p.match] || "nothing").join(", and ")}. That makes ${game.sum}.`, (k) => {
    k.wipe();
    layRest(k);
    layAllPiles(k);
    k.text("add", sumLine, 30, 64, "gold");
  }));

  const rest = S.pack.slice(game.used);
  out.push(step(`So count ${game.sum} cards off the top of the pack, one at a time. ${game.sum <= 12 ? Array.from({ length: game.sum }, (_, i) => SAY[i + 1] || i + 1).join(", ") : `One, two, three, and on, all the way to ${game.sum}`}. At the table you can double tap the pack and type the number, to deal them all at once.`, (k) => {
    k.wipe();
    layRest(k);
    layAllPiles(k);
    k.text("add", sumLine, 30, 64, "gold");
    rest.slice(0, game.sum).forEach((id, i) => k.card(id, "back", ...offAt(i), { z: 300 + i, delay: 0.3 + i * 0.22, dur: 0.4 }));
    k.count("oc", game.sum, (i) => [82.5, offAt(i - 1)[1]], { gap: 0.22, delay: 0.5, cls: "tiny" });
  }));

  out.push(step(`The last card you counted is the gold one. Turn it over. It is ${nameOf(mine)}. Lay it against my copy, and turn the copy over. The same card. You win.`, (k) => {
    k.wipe();
    layRest(k);
    layAllPiles(k);
    rest.slice(0, game.sum).forEach((id, i) => k.card(id, "back", ...offAt(i), { z: 300 + i }));
    k.card(mine, mine, 22, 60, { size: "m", z: 900, dur: 0.9 });
    copy(k, mine, 1.5);
    k.text("win", "a match", 22, 80, "gold", { delay: 2 });
  }));

  /* ── WHY, with the cards ─────────────────────────────────────────────── */

  const whyBase = (k) => {
    k.wipe();
    layRest(k);
    layPiles(k, 3, 99, { said: false });
    game.piles.forEach((q) => { if (q.match) k.lit(q.cards[q.cards.length - 1]); });
    rest.slice(0, game.sum).forEach((id, i) => k.card(id, "back", ...offAt(i), { z: 300 + i }));
    k.card(mine, mine, 22, 60, { size: "m", z: 900 });
    copy(k, mine);
  };
  game.piles.forEach((pile, p) => {
    const cards = pile.cards.length;
    out.push(step(`${p === 0 ? "Now, why does it always work? Count the cards in each pile. " : ""}${["The first pile", "The second pile", "The third pile", "The last pile"][p]}. ${cards === 1 ? "Just one card." : `${Array.from({ length: cards }, (_, i) => SAY[i + 1]).join(", ")}. ${SAY[cards][0].toUpperCase() + SAY[cards].slice(1)} cards.`} ${pile.match ? `It stopped on ${SAY[pile.match]}.` : "It counts nothing."} ${SAY[cards]} and ${pile.match ? SAY[pile.match] : "nothing"} make eleven.`, (k) => {
      whyBase(k);
      game.piles.forEach((q, i) => { if (i < p) k.text(`e${i}`, `${q.cards.length} + ${q.match} = 11`, pileElevenAt(i, 0)[0], 96, "tiny"); });
      k.count(`pc${p}`, cards, (i) => [pileElevenAt(p, i - 1)[0] - 4.4, pileElevenAt(p, i - 1)[1]], { gap: 0.4, delay: 0.6, cls: "tiny" });
      k.text(`e${p}`, `${cards} + ${pile.match} = 11`, pileElevenAt(p, 0)[0], 96, "tiny", { delay: 0.6 + cards * 0.4 + 0.3 });
    }));
  });

  out.push(step("Every pile, with its number, makes eleven. That is not luck. Counting down from ten, a pile that stops early has few cards and a big number. A pile that stops late has many cards and a small number. Together they are always eleven.", (k) => {
    whyBase(k);
    game.piles.forEach((q, i) => k.text(`e${i}`, `${q.cards.length} + ${q.match} = 11`, pileElevenAt(i, 0)[0], 96, "tiny"));
  }));

  const inPiles = game.used;
  out.push(step(`Four piles. Four elevens. Eleven, twenty two, thirty three, forty four. Now look at the cards. There are ${inPiles} cards in the piles, and you counted off ${game.sum}. ${inPiles} and ${game.sum} make forty four. It is always forty four. And which card is the forty fourth from the top? Mine. That is why I put it on top of nine cards at the start.`, (k) => {
    whyBase(k);
    game.piles.forEach((q, i) => k.text(`e${i}`, "11", pileElevenAt(i, 0)[0], 96, "gold"));
    k.text("tot", `${inPiles} in the piles + ${game.sum} counted = 44`, 30, 88, "row", { delay: 1.2 });
  }));

  out.push(step("To do this with a real pack, peek at the ninth card from the bottom before you start. Let your friend shuffle only the cards above it. Then let them count down and add, and you already know the card they will stop at. Now you try it at the table.", (k) => {
    whyBase(k);
    k.text("tot", "peek at the 9th card from the bottom", 30, 88, "row");
  }));

  return out;
}

/* ══ THE TABLE ════════════════════════════════════════════════════════════ */

function lessonTable() {
  const T = ["AS", "8D", "KH", "4C", "9S"];
  const lay = (k, n, up = []) => T.forEach((id, i) => { if (i < n) k.card(id, up.includes(i) ? id : "back", 30 + i * 0.5, 45 - i * 0.6, { size: "m", z: 10 + i }); });
  return [
    step("This is a pile of cards, face down. The table is yours. Everything is done the way your hands would do it. Drag the top card, and it comes off the pile.", (k) => {
      k.wipe();
      lay(k, 5);
      k.card(T[4], "back", 56, 45, { size: "m", z: 50, delay: 0.8, dur: 0.8 });
    }),
    step("Tap a card, and it turns over.", (k) => {
      k.wipe();
      lay(k, 4);
      k.card(T[4], T[4], 56, 45, { size: "m", z: 50, delay: 0.4 });
    }),
    step("Drag another card, and let it go over the first one. It lands on top. Now those two are a pile.", (k) => {
      k.wipe();
      lay(k, 3);
      k.card(T[4], T[4], 56, 45, { size: "m", z: 50 });
      k.card(T[3], "back", 56.6, 44.3, { size: "m", z: 51, delay: 0.5, dur: 0.8 });
    }),
    step("Tap a pile, and the whole pile turns over together. Look closely. The card that was underneath is now on top, just as it would be in your hand.", (k) => {
      k.wipe();
      lay(k, 3);
      k.card(T[3], T[3], 56, 45, { size: "m", z: 50, delay: 0.4 });
      k.card(T[4], "back", 56.6, 44.3, { size: "m", z: 51, delay: 0.4 });
    }),
    step("Under every pile there is a small gold tab. Drag the tab, and the whole pile comes with you.", (k) => {
      k.wipe();
      lay(k, 3);
      k.card(T[3], T[3], 78, 45, { size: "m", z: 50, delay: 0.5, dur: 0.9 });
      k.card(T[4], "back", 78.6, 44.3, { size: "m", z: 51, delay: 0.5, dur: 0.9 });
      k.text("tab", "the gold tab", 78, 68, "small");
    }),
    step("Flip deal is the switch with two arrows. When it is on, every card turns over as you draw it. Face down cards come out face up, and face up cards come out face down.", (k) => {
      k.wipe();
      lay(k, 2);
      k.card(T[3], T[3], 78, 45, { size: "m", z: 50 });
      k.card(T[4], "back", 78.6, 44.3, { size: "m", z: 51 });
      k.card(T[2], T[2], 54, 45, { size: "m", z: 60, delay: 0.5, dur: 0.8 });
      k.text("fd", "flip deal: on", 54, 68, "gold");
    }),
    step("To deal several cards at once, double tap a pile and type how many. They are counted off, one at a time, beside it. And the shuffle key riffles the pile you touched last. That is everything. Go and play.", (k) => {
      k.wipe();
      k.card(T[0], "back", 30, 45, { size: "m", z: 10 });
      k.card(T[1], T[1], 44, 45, { size: "m", z: 20, delay: 0.3 });
      k.card(T[2], T[2], 44.6, 44.3, { size: "m", z: 21, delay: 0.7 });
      k.card(T[3], T[3], 78, 45, { size: "m", z: 50 });
      k.card(T[4], "back", 78.6, 44.3, { size: "m", z: 51 });
      k.text("ds", "double tap → how many?", 37, 70, "gold");
    }),
  ];
}

const TITLES = { base3: "27 cards", eleven: "Eleven", free: "The card table" };

/** Put PrepBot's TV up, teaching one of the tricks. */
export function openTutorial(trick, n = 14) {
  const steps = trick === "base3" ? lesson27(n) : trick === "eleven" ? lessonEleven() : lessonTable();
  return openTv({ title: TITLES[trick] || "Card Tricks", build, steps });
}
