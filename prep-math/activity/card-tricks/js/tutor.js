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
import { BOT_FINGER } from "./finger.js";
import { fullDeck, seeded, dealRound, gather, base3, playEleven, valueOf, nameOf, packetCut, packetTurnTop, packetTurnTwo, packetSays } from "./deck.js";

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
const pileAt = (p, r) => [34 + p * 15, 19 + r * 7.9];   // room above the piles for PrepBot's hand

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
      /* PrepBot's own hand comes down and points at the pile */
      k.text("arrow", BOT_FINGER, pileAt(round.mine, 0)[0] + 1.6, 6.2, "finger");
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

/* ══ ANY NUMBER ═══════════════════════════════════════════════════════════
   The top twenty cards of the pack, as a line down the left. The pile the
   player deals is a column in the middle, built from the bottom up — the
   first card dealt is at the bottom, each next one lands on top — so the
   pile can be seen turning the cards upside down. The cards counted off it
   are a column on the right. */

const TOP20 = ["4C", "JD", "7S", "2H", "9D", "KC", "5S", "AH", "8D", "QS", "3D", "10H", "6C", "KS", "2D", "7H", "JC", "4S", "9H", "AD"];
const MINE_ANY = TOP20[9];
const lineAt = (i) => [9, 17 + i * 3.85];                 // the pack: place 1 at the top
const dealtAt = (j, n) => [36, 17 + (n - j) * 3.85 + (20 - n) * 1.9];   // the j-th card dealt, in a pile of n: later ones higher
const takenAt = (i) => [63, 22 + i * 7.5];

function lessonAny() {
  const out = [];
  const line = (k, from = 0) => TOP20.forEach((id, i) => { if (i >= from) k.card(id, "back", ...lineAt(i), { z: i + 1 }); });
  /* deal n off the line into the pile, one at a time (or all at once) */
  const deal = (k, n, gap = 0.32) => {
    for (let j = 1; j <= n; j++) k.card(TOP20[j - 1], "back", ...dealtAt(j, n), { z: 100 + j, delay: (j - 1) * gap, dur: 0.4 });
    line(k, n);
    k.lit(MINE_ANY);
  };
  /* where the gold card lies in a pile of n, counted from the top */
  const where = (n) => n - 9;
  const ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
  const copy = (k, face = "blue", delay = 0) => k.card("copy", face, 86, 30, { size: "m", z: 700, delay });

  out.push(step("Here is the top of a shuffled pack. I have laid the first twenty cards in a line so that you can see each one. The top of the line is the top of the pack. That is card one.", (k) => {
    k.wipe();
    TOP20.forEach((id, i) => k.card(id, "back", ...lineAt(i), { z: i + 1, delay: i * 0.06 }));
    k.text("top", "card 1", 19, lineAt(0)[1], "small", { delay: 1.3 });
  }));

  out.push(step("I am thinking of one card. In the real trick you never see which. Here I light it in gold, so that you can follow it. Count down with me. One, two, three, four, five, six, seven, eight, nine, ten. My card is the tenth card. There are nine cards on top of it.", (k) => {
    k.wipe();
    line(k);
    k.count("c", 10, (i) => [18, lineAt(i - 1)[1]], { gap: 0.42, delay: 2.2 });
    k.lit(MINE_ANY, true, 2.2 + 9 * 0.42);
    copy(k, "blue", 0.4);
    k.text("cl", "a copy of my card", 86, 48, "small", { delay: 0.6 });
  }));

  out.push(step("Now you think of a number, anything from ten to nineteen, and you do not tell me. Let us say you think of fourteen. Deal fourteen cards off the top, one at a time, into a pile. Watch how each card lands on top of the one before it. One, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve, thirteen, fourteen.", (k) => {
    k.wipe();
    copy(k);
    line(k);
    k.lit(MINE_ANY);
    deal(k, 14, 0.42);
    k.text("num", "14", 36, 6, "big");
    k.count("dc", 14, (j) => [44.5, dealtAt(j, 14)[1]], { gap: 0.42, delay: 0.2, cls: "tiny" });
  }));

  out.push(step("Look where my gold card is now. It was the tenth card you dealt. Then four more cards landed on top of it. So, counting from the top of your pile: one, two, three, four, five. It is the fifth card.", (k) => {
    k.wipe();
    copy(k);
    deal(k, 14, 0);
    k.text("num", "14", 36, 6, "big");
    k.count("pc", 5, (i) => [44.5, dealtAt(15 - i, 14)[1]], { gap: 0.5, delay: 2.4 });
  }));

  out.push(step("Now add the two figures of your number. Fourteen is a one and a four. One and four make five. So deal five cards off your pile. One, two, three, four, five. And the fifth one is my gold card.", (k) => {
    k.wipe();
    copy(k);
    deal(k, 14, 0);
    k.text("num", "14", 36, 6, "big");
    k.text("add", "1 + 4 = 5", 63, 8, "gold");
    for (let i = 1; i <= 5; i++) k.card(TOP20[14 - i], "back", ...takenAt(i - 1), { z: 300 + i, delay: 2.2 + (i - 1) * 0.5, dur: 0.4 });
    k.lit(MINE_ANY);
    k.count("tc", 5, (i) => [70, takenAt(i - 1)[1]], { gap: 0.5, delay: 2.4, cls: "tiny" });
  }));

  out.push(step(`Turn it over. It is ${nameOf(MINE_ANY)}. Lay it against my copy, and turn the copy over. The same card. And I never knew your number.`, (k) => {
    k.wipe();
    deal(k, 14, 0);
    for (let i = 1; i <= 4; i++) k.card(TOP20[14 - i], "back", ...takenAt(i - 1), { z: 300 + i });
    k.card(MINE_ANY, MINE_ANY, 73, 30, { size: "m", z: 900, dur: 0.8 });
    copy(k, MINE_ANY, 1.4);
    k.text("win", "a match", 79.5, 50, "gold", { delay: 1.9 });
  }));

  /* ── WHY, with the cards ─────────────────────────────────────────────── */

  [10, 11, 12].forEach((n, t) => {
    const first = ["Now, why does it work for every number? Let us try the smallest one, ten. I put the cards back and deal ten.", "Now eleven. Deal eleven.", "Now twelve. Deal twelve."][t];
    const tell = n === 10
      ? "My gold card is the tenth card, so it is the very last one you deal. It lands on top. It is the first card of your pile. And the figures of ten are one and nought. One and nought make one. Deal one card, and it is mine."
      : `This time ${n === 11 ? "one more card" : "two more cards"} land${n === 11 ? "s" : ""} on top of my gold card. So it is the ${ORD[where(n)]} card of your pile. And the figures of ${SAY[n] || n} are one and ${SAY[n - 10]}. One and ${SAY[n - 10]} make ${SAY[where(n)]}. Deal ${SAY[where(n)]}, and you are on my card again.`;
    out.push(step(`${first} ${tell}`, (k) => {
      k.wipe();
      k.gone("copy");
      line(k);
      deal(k, n, 0.3);
      k.text("num", String(n), 36, 6, "big");
      k.text("pos", `gold is card ${where(n)}`, 63, 30, "row", { delay: n * 0.3 + 0.4 });
      k.text("add", `1 + ${n - 10} = ${where(n)}`, 63, 44, "gold", { delay: n * 0.3 + 1.6 });
      /* what was tried before stays written, so the pattern can be seen growing */
      [10, 11, 12].forEach((m, i) => { if (m < n) k.text(`h${m}`, `${m} → card ${where(m)} → 1 + ${m - 10} = ${where(m)}`, 78, 66 + i * 8, "small"); });
    }));
  });

  out.push(step("Do you see it? Every time your number goes up by one, one more card covers my gold card. And every time your number goes up by one, its figures add up to one more. The two climb together, one step at a time. So they always meet on my card.", (k) => {
    k.wipe();
    line(k);
    deal(k, 12, 0);
    [10, 11, 12, 13, 14, 19].forEach((m, i) => k.text(`h${m}`, `${m} → card ${where(m)} → 1 + ${m - 10} = ${where(m)}`, 72, 14 + i * 12, m === 14 ? "gold" : "row", { delay: i * 0.5 }));
  }));

  out.push(step("Here is the short way to say it. Take the figures of your number away from the number itself, and you always get nine. Fourteen take away five is nine. Nineteen take away ten is nine. Nine cards were on top of my card at the start. To do this with a real pack, peek at the tenth card before you begin. Now you try it at the table.", (k) => {
    k.wipe();
    line(k);
    deal(k, 12, 0);
    k.text("n1", "14 − (1 + 4) = 9", 68, 22, "gold");
    k.text("n2", "19 − (1 + 9) = 9", 68, 38, "gold", { delay: 0.8 });
    k.text("n3", "always 9", 68, 56, "big", { delay: 1.6 });
  }));

  return out;
}

/* ══ THE ODD ONE OUT ══════════════════════════════════════════════════════
   Four cards in a row: the left end is the top of the packet, the right end
   the bottom. Every move is played with the same three moves the table uses
   (deck.js), so the row on the screen is the packet as it really is. */

const FOUR = ["9C", "QH", "4S", "JD"];
const MINE_ODD = "QH";
const slotAt = (i) => [24 + i * 15.5, 36];

function lessonOdd() {
  const out = [];
  /* the row: each card where it is in the packet, showing what it shows */
  const row = (k, p, delay = 0, dur = 0.6) => {
    p.forEach((c, i) => k.card(c.id, c.up ? c.id : "back", ...slotAt(i), { size: "m", z: 20 + i, delay, dur }));
    k.lit(MINE_ODD);
  };
  const ends = (k) => { k.text("top", "top", slotAt(0)[0], 13, "small"); k.text("bot", "bottom", slotAt(3)[0], 13, "small"); };
  /* the mats under the four places, and what each card on them "says" */
  const mats = (k, p, delay = 0) => {
    const says = packetSays(p);
    p.forEach((c, i) => {
      k.text(`mat${i}`, "&nbsp;", slotAt(i)[0], 64, i % 2 ? "pink" : "blue");
      k.text(`say${i}`, says[i] ? "says UP" : "says DOWN", slotAt(i)[0], 74, c.id === MINE_ODD ? "gold" : "small", { delay });
    });
  };

  const start = FOUR.map((id) => ({ id, up: true }));
  const down = FOUR.filter((id) => id !== MINE_ODD).concat(MINE_ODD).map((id) => ({ id, up: false }));
  const moved = packetCut(down, 1);
  const ready = packetTurnTop(moved);
  const MIX = [2, 1, 3];
  const mixes = [];
  let p = ready;
  MIX.forEach((cutAt) => { const cut = packetCut(p, cutAt); const turned = packetTurnTwo(cut); mixes.push({ cutAt, from: p, cut, turned }); p = turned; });
  const mixed = p;
  const f1 = packetCut(packetTurnTop(mixed), 1);
  const f2 = packetCut(f1, 1);
  const last = packetTurnTop(f2);

  out.push(step("Here are four cards, face up. You choose one of them. Let us say you choose the queen of hearts. I light it in gold, so that you can follow it all the way through.", (k) => {
    k.wipe();
    start.forEach((c, i) => k.card(c.id, c.id, ...slotAt(i), { size: "m", z: 20 + i, delay: i * 0.2 }));
    k.lit(MINE_ODD, true, 1.6);
  }));

  out.push(step("All four are turned face down. And your card goes to the bottom of the packet. In this row, the left end is the top of the packet, and the right end is the bottom.", (k) => {
    k.wipe();
    row(k, start.map((c) => ({ ...c, up: false })));
    row(k, down, 1.3);
    ends(k);
  }));

  out.push(step("Now the first of my two moves. The top card goes to the bottom.", (k) => { k.wipe(); ends(k); row(k, moved, 0.3); }));
  out.push(step("And the second. The new top card is turned face up. That is all I do. The rest of the mixing is yours.", (k) => { k.wipe(); ends(k); row(k, ready, 0.3); }));

  mixes.forEach((m, t) => {
    const n = ["", "one card goes", "two cards go", "three cards go"][m.cutAt];
    out.push(step(`${["Now you mix. You say where to cut. Say you choose two.", "Mix again. This time you say one.", "And once more. You say three."][t]} So ${n} from the top to the bottom. Then the top two are turned over together. Each one shows its other side, and they change places.`, (k) => {
      k.wipe();
      ends(k);
      row(k, m.from, 0, 0);
      row(k, m.cut, 0.4);
      row(k, m.turned, 2.2);
      k.text("what", `cut ${m.cutAt}`, 47, 70, "gold", { delay: 0.4 });
      k.text("what2", "turn the top two over", 47, 82, "row", { delay: 2.2 });
    }));
  });

  out.push(step("You can do that as often as you like. Nobody could say which way up the cards are now. When you have had enough, there are three small moves to finish. The top card is turned over, and goes to the bottom.", (k) => {
    k.wipe(); ends(k); row(k, mixed, 0, 0); row(k, packetTurnTop(mixed), 0.6); row(k, f1, 1.8);
  }));
  out.push(step("The next card goes to the bottom, just as it is.", (k) => { k.wipe(); ends(k); row(k, f2, 0.3); }));
  out.push(step("And the top card is turned over.", (k) => { k.wipe(); ends(k); row(k, last, 0.3); }));

  const mineUp = last.find((c) => c.id === MINE_ODD).up;
  out.push(step(`Now look at the four cards. Three of them face one way. One of them faces the other way. Which one? The gold one. ${mineUp ? "It is the only card face up" : "It is the only card face down. Turn it over"}. The queen of hearts. Your card.`, (k) => {
    k.wipe();
    row(k, last, 0, 0);
    k.card(MINE_ODD, MINE_ODD, slotAt(last.findIndex((c) => c.id === MINE_ODD))[0], 36, { size: "m", z: 60, delay: 2.4 });
    k.text("win", "the odd one out is yours", 47, 72, "gold", { delay: 2.8 });
  }));

  /* ── WHY, with the cards ─────────────────────────────────────────────── */

  out.push(step("Why does it always work? Go back to the moment before you mixed. Under the four places I put four mats. Blue, pink, blue, pink. Now a pretend game. A card on a blue mat says what it shows. A card on a pink mat says the opposite of what it shows. So a face down card on a pink mat says: up.", (k) => {
    k.wipe();
    row(k, ready, 0, 0);
    mats(k, ready, 1.5);
  }));

  out.push(step("Read what they say. Up. Up. Down. Up. Three cards say up. Only your gold card says down. Your card is already the odd one out. You just cannot see it yet.", (k) => {
    k.wipe();
    row(k, ready, 0, 0);
    mats(k, ready);
    k.text("see", "three agree · gold disagrees", 47, 88, "row", { delay: 1.2 });
  }));

  const t2 = packetTurnTwo(ready);
  out.push(step("Now turn the top two over together. Watch those two cards. Each one flips. And each one moves onto the other colour of mat. Flipped once, and changed colour once. Two changes undo each other. So both cards still say exactly what they said before.", (k) => {
    k.wipe();
    row(k, ready, 0, 0);
    row(k, t2, 0.8);
    mats(k, t2, 2);
    k.text("see", "flip + change colour = says the same", 47, 88, "row", { delay: 2.4 });
  }));

  const c1 = packetCut(t2, 1);
  out.push(step("Now cut one card to the bottom. Every card moves one mat along. So every card changes colour. So every card changes what it says, all four together. They said up, up, down, up. Now they say down, down, up, down. Your gold card is still the one that disagrees.", (k) => {
    k.wipe();
    row(k, t2, 0, 0);
    row(k, c1, 0.8);
    mats(k, c1, 2);
    k.text("see", "all four change together · gold still disagrees", 47, 88, "row", { delay: 2.4 });
  }));

  out.push(step("So it does not matter how you cut, or how many times. No mix can change which card is the odd one. My last three moves only turn the pretend game into real turning. And that is why one card ends up facing the other way, and it is always yours. This trick was invented by Bob Hummer, about eighty years ago. Now try it at the table.", (k) => {
    k.wipe();
    row(k, last, 0, 0);
    k.text("see", "one card always disagrees", 47, 72, "gold");
  }));

  return out;
}

/* ══ THE FINAL THREE ══════════════════════════════════════════════════════
   Thirty-three cards, every one on the screen. A pile is a column with its
   TOP card at the top, so a card dealt onto a pile lands above the one
   before it. The cards in the hand are a line down the left; the cards kept
   by an up-down deal are a column in the middle; the ones thrown out are a
   heap on the right. */

const F3 = (() => {
  const rnd = seeded(33);
  const all = fullDeck().map((id) => [rnd(), id]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const piles = [0, 1, 2].map((p) => Array.from({ length: 10 }, (_, j) => all[j * 3 + p]));   // in the order dealt
  const mine = all.slice(30, 33);
  /* three off the top of each pile (the last three dealt), a chosen card on each seven, stacked, the nine on top */
  const nine = piles.flatMap((p) => p.slice(7).reverse());
  const body = [0, 1, 2].flatMap((p) => [mine[p], ...piles[p].slice(0, 7).reverse()]);
  const stack = nine.slice().reverse().concat(body);      // top first: 9, then card + 7, three times
  const passes = [];
  let hand = stack.slice(4);
  while (hand.length > 3) {
    const out = hand.filter((_, i) => i % 2 === 0);
    const kept = hand.filter((_, i) => i % 2 === 1).reverse();   // dealt one on another: the last kept is on top
    passes.push({ hand, out, kept });
    hand = kept;
  }
  return { all, piles, mine, nine, stack, passes, left: hand };
})();

const f3Line = (i, n = 33) => [9, 16 + i * (n > 20 ? 2.25 : 4)];
const f3Pile = (p, row) => [30 + p * 11, 26 + row * 5.6];        // row 0 is the top of the pile
const f3Kept = (j) => [38, 16 + j * 4.4];
const f3Out = (i) => [62 + (i % 6) * 0.5, 22 + Math.floor(i / 6) * 0.6];

function lessonFinal3() {
  const out = [];
  const { piles, mine, nine, stack, passes, left } = F3;
  const isMine = (id) => mine.includes(id);
  const gold = (k) => mine.forEach((id) => k.lit(id));
  const places = (k, list, at, cls = "gold") => list.forEach((id, i) => { if (isMine(id)) k.text(`pl${mine.indexOf(id)}`, String(i + 1), at(i)[0] + 7.5, at(i)[1], cls); });
  const line = (k, list, { delay = 0, dur = 0.6, face = "back" } = {}) => list.forEach((id, i) => k.card(id, face === "back" ? "back" : id, ...f3Line(i, list.length), { z: i + 1, delay, dur }));
  /* the three piles as dealt: `upto` cards of each are down, `taken` have been lifted off the top */
  const laidPiles = (k, { gap = 0, taken = 0, chosen = false } = {}) => {
    piles.forEach((pile, p) => pile.forEach((id, j) => {
      if (j >= 10 - taken) return;
      k.card(id, "back", ...f3Pile(p, 9 - j), { z: 10 + j, delay: (j * 3 + p) * gap, dur: 0.4 });
    }));
    if (chosen) mine.forEach((id, p) => k.card(id, "back", ...f3Pile(p, 2), { z: 40, delay: 0 }));
  };
  const nineAside = (k, delay = 0) => nine.forEach((id, i) => k.card(id, "back", 72, 26 + i * 4.4, { z: 60 + i, delay: delay ? delay + Math.floor(i / 3) * 0.8 + (i % 3) * 0.12 : 0 }));

  out.push(step("I deal three piles of ten cards, face down. One, two, three, and round again, until each pile has ten. In each pile, the newest card is on top.", (k) => {
    k.wipe();
    laidPiles(k, { gap: 0.13 });
    ["pile 1", "pile 2", "pile 3"].forEach((t, p) => k.text(`pn${p}`, t, f3Pile(p, 0)[0], 14, "small"));
  }));

  out.push(step("Now I take three cards off the top of each pile, and put them to one side. Three, and three, and three. That is nine cards. And each pile has seven left.", (k) => {
    k.wipe();
    laidPiles(k, { taken: 3 });
    nineAside(k, 0.6);
    k.text("n9", "9", 72, 14, "big", { delay: 3 });
    [0, 1, 2].forEach((p) => k.text(`c7${p}`, "7", f3Pile(p, 0)[0], 14, "big", { delay: 3 }));
  }));

  out.push(step("You choose any three cards from the rest of the pack. Here they are. I light them in gold, so that you can follow them. They are turned face down, and one goes on top of each pile.", (k) => {
    k.wipe();
    laidPiles(k, { taken: 3 });
    nineAside(k);
    mine.forEach((id, p) => { k.card(id, id, 86, 22 + p * 14, { z: 90, size: "m", delay: p * 0.3 }); k.card(id, "back", ...f3Pile(p, 2), { z: 40, delay: 3 + p * 0.7, dur: 0.7 }); });
    gold(k);
  }));

  out.push(step("Now the piles are put together. The third pile, the second pile on it, the first pile on that, and the nine cards on the very top. Thirty three cards in one stack. I lay it in a line: the top of the line is the top of the stack.", (k) => {
    k.wipe();
    stack.forEach((id, i) => k.card(id, "back", ...f3Line(i), { z: i + 1, delay: (i < 9 ? 3 : i < 17 ? 2 : i < 25 ? 1 : 0) * 0.9 + 0.2, dur: 0.7 }));
    gold(k);
  }));

  out.push(step("Count down from the top to find your cards. Nine cards, and then your first card: it is card ten. Seven more cards, and your second: card eighteen. Seven more, and your third: card twenty six. They are always at ten, eighteen and twenty six. It does not matter which cards you chose.", (k) => {
    k.wipe();
    line(k, stack, { dur: 0 });
    gold(k);
    places(k, stack, (i) => f3Line(i));
    k.text("t9", "9 on top", 30, f3Line(4)[1], "small");
    k.text("t7a", "7 between", 30, f3Line(13)[1], "small");
    k.text("t7b", "7 between", 30, f3Line(21)[1], "small");
  }));

  const after4 = stack.slice(4);
  out.push(step("Four cards come off the top. One, two, three, four. They are out. So your cards have each moved up four places. They are now card six, card fourteen and card twenty two.", (k) => {
    k.wipe();
    stack.slice(0, 4).forEach((id, i) => k.card(id, "back", ...f3Out(i), { z: 200 + i, delay: 0.4 + i * 0.4 }));
    after4.forEach((id, i) => k.card(id, "back", ...f3Line(i, 29), { z: i + 1, delay: 2.2 }));
    gold(k);
    places(k, after4, (i) => f3Line(i, 29));
  }));

  let thrown = 4;
  passes.forEach((pass, t) => {
    const before = thrown;
    const n = pass.hand.length;
    const told = pass.kept.map((id, j) => (isMine(id) ? j + 1 : 0)).filter(Boolean);
    out.push(step(`${["Now the dealing. One card face up, one card face down. Up, down, up, down, all the way through. Every face up card is out. The face down cards are kept, in a pile.",
      "The kept cards are picked up, and dealt the same way. Up, down, up, down.",
      "And once more with the cards that are left. Up, down, up, down."][t]} ${n} cards went in. ${pass.kept.length} are kept. ${pass.kept.length > 3 ? `And look where your gold cards are in the kept pile: card ${told.join(", card ")}.` : "Three cards. And every one of them is gold."}`, (k) => {
      k.wipe();
      /* what was thrown out before stays in its heap */
      stack.filter((id) => !pass.hand.includes(id)).forEach((id, i) => k.card(id, i < 4 ? "back" : id, ...f3Out(i), { z: 200 + i, dur: 0 }));
      /* the hand, as a line … */
      pass.hand.forEach((id, i) => k.card(id, "back", ...f3Line(i, n), { z: i + 1, dur: t ? 0.6 : 0 }));
      /* … and dealt off it: up is out, down is kept, each kept card landing above the last */
      pass.hand.forEach((id, i) => {
        const delay = 1.2 + i * (n > 20 ? 0.22 : 0.4);
        if (i % 2 === 0) k.card(id, id, ...f3Out(before + i / 2), { z: 200 + before + i / 2, delay, dur: 0.4 });
        else k.card(id, "back", ...f3Kept(pass.kept.indexOf(id)), { z: 100 + (pass.kept.length - pass.kept.indexOf(id)), delay, dur: 0.4 });
      });
      gold(k);
      pass.kept.forEach((id, j) => { if (isMine(id)) k.text(`pl${mine.indexOf(id)}`, String(j + 1), f3Kept(j)[0] + 7.5, f3Kept(j)[1], "gold", { delay: 1.2 + n * (n > 20 ? 0.22 : 0.4) }); });
      k.text("kl", "kept", 49, 12, "small");
      k.text("ol", "out", 63, 12, "small");
    }));
    thrown += pass.out.length;
  });

  out.push(step(`Turn the three over. ${mine.map((id) => nameOf(id)).join(", ")}. Your three cards, and no others.`, (k) => {
    k.wipe();
    stack.filter((id) => !left.includes(id)).forEach((id, i) => k.card(id, i < 4 ? "back" : id, ...f3Out(i), { z: 200 + i, dur: 0 }));
    left.forEach((id, j) => k.card(id, id, 30 + j * 13, 44, { size: "m", z: 500 + j, delay: j * 0.5, dur: 0.8 }));
    gold(k);
    k.text("win", "the final three", 43, 72, "gold", { delay: 1.8 });
  }));

  /* ── WHY, with the cards ─────────────────────────────────────────────── */

  out.push(step("Why were they the last three? Look at the dealing again, slowly. Up, down, up, down. The first card is thrown out. The second is kept. The third is out. The fourth is kept. So the cards in places two, four, six, eight and so on are kept. I ring those in green. The even places survive.", (k) => {
    k.wipe();
    k.gone("x");
    stack.slice(0, 4).forEach((id, i) => k.card(id, "back", ...f3Out(i), { z: 200 + i, dur: 0 }));
    after4.forEach((id, i) => { k.card(id, "back", ...f3Line(i, 29), { z: i + 1, size: "s" }); k.band(id, i % 2 ? 1 : -1); });
    gold(k);
    places(k, after4, (i) => f3Line(i, 29));
    k.text("ev", "green = even places = kept", 36, 30, "row");
  }));

  out.push(step("And where were your cards? Six, fourteen and twenty two. All even numbers. So all three are kept. That is the first deal.", (k) => {
    k.wipe();
    stack.slice(0, 4).forEach((id, i) => k.card(id, "back", ...f3Out(i), { z: 200 + i, dur: 0 }));
    after4.forEach((id, i) => { k.card(id, "back", ...f3Line(i, 29), { z: i + 1 }); k.band(id, i % 2 ? 1 : -1); });
    gold(k);
    places(k, after4, (i) => f3Line(i, 29));
    k.text("ev", "6 · 14 · 22 &nbsp; all even", 38, 30, "gold");
  }));

  passes.slice(1).forEach((pass, t) => {
    const n = pass.hand.length;
    const at = pass.hand.map((id, i) => (isMine(id) ? i + 1 : 0)).filter(Boolean);
    out.push(step(`${t === 0 ? "Fourteen cards were kept. Dealing them into a pile turned them upside down, so the order is the other way round. Even so," : "Seven cards were kept. Turned upside down again. And"} your cards are at ${at.map((x) => SAY[x] || x).join(", ")}. Even numbers again. ${t === 0 ? "So they are kept again." : "And among seven cards, the even places are two, four and six: just three places. Yours."}`, (k) => {
      k.wipe();
      stack.filter((id) => !pass.hand.includes(id)).forEach((id, i) => k.card(id, i < 4 ? "back" : id, ...f3Out(i), { z: 200 + i, dur: 0 }));
      pass.hand.forEach((id, i) => { k.card(id, "back", ...f3Line(i, n), { z: i + 1 }); k.band(id, i % 2 ? 1 : -1); });
      gold(k);
      places(k, pass.hand, (i) => f3Line(i, n));
      k.text("ev", `${at.join(" · ")} &nbsp; all even`, 38, 30, "gold");
    }));
  });

  out.push(step("So that is the whole secret. Ten, eighteen and twenty six. Take four away: six, fourteen, twenty two. Then four, eight, twelve. Then two, four, six. Even places every time, and the even places are the ones that are kept. That is why I took three cards off each pile at the start: it puts your cards exactly where they need to be. Now try it at the table.", (k) => {
    k.wipe();
    stack.filter((id) => !left.includes(id)).forEach((id, i) => k.card(id, i < 4 ? "back" : id, ...f3Out(i), { z: 200 + i, dur: 0 }));
    left.forEach((id, j) => { k.card(id, id, 14 + j * 12, 44, { size: "m", z: 500 + j }); k.band(id, -1); });
    gold(k);
    ["10 · 18 · 26", "6 · 14 · 22", "4 · 8 · 12", "2 · 4 · 6"].forEach((t, i) => k.text(`s${i}`, t, 86, 20 + i * 13, i === 3 ? "gold" : "row", { delay: i * 0.7 }));
  }));

  return out;
}

/* ══ THE FINAL THREE, WITH THE WHOLE PACK ═════════════════════════════════
   The second way of doing it: piles of ten, fifteen, fifteen and nine, and
   the player cuts wherever they like. All 52 cards are on the screen. A pile
   is a column standing on its bottom card, so cards put on it land on top.

   The cards of the second pile are ringed blue and the third pile pink, all
   the way through — which is the whole explanation of why the cuts make no
   difference: every blue card ends up between the same two gold cards. */

const F3B = (() => {
  const rnd = seeded(52);
  const all = fullDeck().map((id) => [rnd(), id]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  /* each pile top first */
  const p1 = all.slice(0, 10), p2 = all.slice(10, 25), p3 = all.slice(25, 40), p4 = all.slice(40, 49);
  const mine = all.slice(49);
  const a = 5, b = 9;                                    // the two cuts of the example
  const A = [...p2.slice(0, a), mine[0], ...p1];
  const B = [...p3.slice(0, b), mine[1], ...p2.slice(a)];
  const C = [...p4, mine[2], ...p3.slice(b)];
  const stack = [...C, ...B, ...A];
  const under = stack.slice(4).concat(stack.slice(0, 4));   // four from the top to the bottom
  const passes = [];
  let hand = under;
  while (hand.length > 3) {
    const out = hand.filter((_, i) => i % 2 === 0);
    const kept = hand.filter((_, i) => i % 2 === 1).reverse();
    passes.push({ hand, out, kept });
    hand = kept;
  }
  return { p1, p2, p3, p4, mine, a, b, A, B, C, stack, under, passes, left: hand };
})();

const wLine = (i) => [9, 16 + i * 1.46];
const wCol = (p, j, n) => [28 + p * 13, 88 - (n - 1 - j) * 3.5];      // card j from the top, in a pile of n standing at the bottom
const wKept = (j, n) => [38, 16 + j * (n > 14 ? 2.7 : 4.4)];

function lessonFinal3B() {
  const out = [];
  const { p1, p2, p3, p4, mine, a, b, A, B, C, stack, under, passes, left } = F3B;
  const isMine = (id) => mine.includes(id);
  const gold = (k) => mine.forEach((id) => k.lit(id));
  /* which pile a card began in: the second is blue, the third pink, the nine green */
  const tint = (k, on = true) => stack.forEach((id) => k.band(id, !on ? -1 : p2.includes(id) ? 0 : p3.includes(id) ? 2 : p4.includes(id) ? 1 : -1));
  const col = (k, list, p, { delay = () => 0, dur = 0.5 } = {}) => list.forEach((id, j) => k.card(id, "back", ...wCol(p, j, list.length), { z: 10 + (list.length - j), delay: delay(j, list.length), dur }));
  const places = (k, list, at) => list.forEach((id, i) => { if (isMine(id)) k.text(`pl${mine.indexOf(id)}`, String(i + 1), at(i)[0] + 7.5, at(i)[1], "gold"); });
  const waiting = (k, from = 0) => mine.forEach((id, i) => { if (i >= from) k.card(id, id, 86, 22 + i * 15, { size: "m", z: 300 + i }); });
  const heads = (k) => [["10", 0], ["15", 1], ["15", 2], ["9", 3]].forEach(([t, p]) => k.text(`h${p}`, t, wCol(p, 0, 1)[0], 96, "small"));
  const heap = (k, list) => list.forEach((id, i) => k.card(id, "back", 62 + (i % 8) * 0.45, 22 + Math.floor(i / 8) * 0.55, { z: 200 + i, dur: 0 }));

  out.push(step("This is the second way to do the final three, and it uses the whole pack. First I make four piles. Ten cards. Fifteen cards. Fifteen cards. And the nine that are left. I ring the second pile in blue, the third in pink and the nine in green, so that you can see where they go.", (k) => {
    k.wipe();
    let n = 0;
    [p1, p2, p3, p4].forEach((pile, p) => { const from = n; col(k, pile, p, { delay: (j, len) => (from + (len - 1 - j)) * 0.07 }); n += pile.length; });
    tint(k);
    heads(k);
  }));

  out.push(step("You choose any three cards. Here they are. I light them in gold, so that you can follow them.", (k) => {
    k.wipe();
    [p1, p2, p3, p4].forEach((pile, p) => col(k, pile, p));
    tint(k);
    heads(k);
    mine.forEach((id, i) => k.card(id, id, 86, 22 + i * 15, { size: "m", z: 300 + i, delay: i * 0.4 }));
    gold(k);
  }));

  out.push(step(`Your first card goes face down on the pile of ten. Now you bury it. You tell me how many cards to cut off the second pile. Any number you like. Say you tell me ${SAY[a]}. ${SAY[a][0].toUpperCase() + SAY[a].slice(1)} blue cards come off the second pile, and land on your card.`, (k) => {
    k.wipe();
    col(k, [mine[0], ...p1], 0, { delay: (j) => (j === 0 ? 0.4 : 0), dur: 0.8 });
    col(k, p2, 1); col(k, p3, 2); col(k, p4, 3);
    col(k, A, 0, { delay: (j) => (j < a ? 4.2 + (a - 1 - j) * 0.25 : 0.4), dur: 0.7 });
    col(k, p2.slice(a), 1, { delay: () => 4.2 });
    tint(k); gold(k); waiting(k, 1);
    k.text("cut", `cut ${a}`, wCol(1, 0, 1)[0], 12, "gold", { delay: 4 });
  }));

  out.push(step(`Your second card goes on what is left of the second pile. And you bury that one too. This time you say ${SAY[b]}. ${SAY[b][0].toUpperCase() + SAY[b].slice(1)} pink cards come off the third pile, and land on your second card.`, (k) => {
    k.wipe();
    col(k, A, 0);
    col(k, [mine[1], ...p2.slice(a)], 1, { delay: (j) => (j === 0 ? 0.4 : 0), dur: 0.8 });
    col(k, p3, 2); col(k, p4, 3);
    col(k, B, 1, { delay: (j) => (j < b ? 4 + (b - 1 - j) * 0.22 : 0.4), dur: 0.7 });
    col(k, p3.slice(b), 2, { delay: () => 4 });
    tint(k); gold(k); waiting(k, 2);
    k.text("cut", `cut ${b}`, wCol(2, 0, 1)[0], 12, "gold", { delay: 3.8 });
  }));

  out.push(step("Your third card goes on what is left of the third pile. And the nine green cards go on top of it.", (k) => {
    k.wipe();
    col(k, A, 0); col(k, B, 1);
    col(k, [mine[2], ...p3.slice(b)], 2, { delay: (j) => (j === 0 ? 0.4 : 0), dur: 0.8 });
    col(k, p4, 3);
    col(k, C, 2, { delay: (j) => (j < 9 ? 3 + (8 - j) * 0.2 : 0.4), dur: 0.7 });
    tint(k); gold(k);
  }));

  out.push(step("Now the three piles are put together into one pack. The third pile goes on the second, and both go on the first. I lay the pack in a line. The top of the line is the top of the pack.", (k) => {
    k.wipe();
    stack.forEach((id, i) => k.card(id, "back", ...wLine(i), { z: i + 1, delay: (i < C.length ? 2 : i < C.length + B.length ? 1 : 0) * 1 + 0.2, dur: 0.8 }));
    tint(k); gold(k);
  }));

  out.push(step("Count down to your cards. Nine green cards, and then your third card: it is card ten. Then fifteen pink cards, and your second card: card twenty six. Then fifteen blue cards, and your first card: card forty two.", (k) => {
    k.wipe();
    stack.forEach((id, i) => k.card(id, "back", ...wLine(i), { z: i + 1, dur: 0 }));
    tint(k); gold(k);
    places(k, stack, wLine);
    k.text("g9", "9 green", 30, wLine(4)[1], "small");
    k.text("p15", "15 pink", 30, wLine(17)[1], "small", { delay: 3 });
    k.text("b15", "15 blue", 30, wLine(33)[1], "small", { delay: 6 });
  }));

  out.push(step(`Now here is the clever part. You cut ${SAY[b]} pink cards and ${SAY[a]} blue cards. What if you had cut different numbers? Look at the pink cards. The ones you cut off are above your second card's pile, and the ones you left are below your third card. Either way, every pink card is between those two gold cards. All fifteen, always. The same for the blue. So however you cut, your cards are at ten, twenty six and forty two.`, (k) => {
    k.wipe();
    stack.forEach((id, i) => k.card(id, "back", ...wLine(i), { z: i + 1, dur: 0 }));
    tint(k); gold(k);
    places(k, stack, wLine);
    k.text("w1", "cut any number:", 52, 30, "row");
    k.text("w2", "15 pink are still between", 52, 42, "row", { delay: 1.5 });
    k.text("w3", "15 blue are still between", 52, 54, "row", { delay: 3 });
    k.text("w4", "10 · 26 · 42", 52, 70, "big", { delay: 5 });
  }));

  out.push(step("Four cards go from the top of the pack to the bottom. One, two, three, four. So each of your cards has moved up four places. They are now card six, card twenty two and card thirty eight.", (k) => {
    k.wipe();
    stack.forEach((id, i) => k.card(id, "back", ...wLine(i), { z: i + 1, dur: 0 }));
    under.forEach((id, i) => k.card(id, "back", ...wLine(i), { z: i + 1, delay: i >= 48 ? 0.6 + (i - 48) * 0.5 : 2.8, dur: 0.8 }));
    tint(k, false); gold(k);
    places(k, under, wLine);
  }));

  passes.forEach((pass, t) => {
    const n = pass.hand.length;
    const gone = under.filter((id) => !pass.hand.includes(id));
    const told = pass.kept.map((id, j) => (isMine(id) ? j + 1 : 0)).filter(Boolean);
    const beat = n > 30 ? 0.14 : n > 16 ? 0.22 : 0.4;
    out.push(step(`${["Now the dealing. One card face up, one card face down. Up, down, up, down, all the way through the pack. Every face up card is out. The face down cards are kept.",
      "The kept cards are picked up, and dealt the same way. Up, down, up, down.",
      "Again, with the cards that are left.",
      "And one last time."][t]} ${n} cards went in. ${pass.kept.length} are kept. ${pass.kept.length > 3 ? `Your gold cards are now card ${told.join(", card ")}.` : "Three cards. And every one of them is gold."}`, (k) => {
      k.wipe();
      heap(k, gone);
      pass.hand.forEach((id, i) => k.card(id, "back", t ? wKept(i, n)[0] - 29 : wLine(i)[0], t ? 16 + i * (n > 14 ? 2.7 : 4.4) : wLine(i)[1], { z: i + 1, dur: t ? 0.6 : 0 }));
      pass.hand.forEach((id, i) => {
        const delay = 1.2 + i * beat;
        if (i % 2 === 0) k.card(id, id, 62 + ((gone.length + i / 2) % 8) * 0.45, 22 + Math.floor((gone.length + i / 2) / 8) * 0.55, { z: 200 + gone.length + i / 2, delay, dur: 0.4 });
        else k.card(id, "back", ...wKept(pass.kept.indexOf(id), pass.kept.length), { z: 100 + (pass.kept.length - pass.kept.indexOf(id)), delay, dur: 0.4 });
      });
      tint(k, false); gold(k);
      pass.kept.forEach((id, j) => { if (isMine(id)) k.text(`pl${mine.indexOf(id)}`, String(j + 1), wKept(j, pass.kept.length)[0] + 7.5, wKept(j, pass.kept.length)[1], "gold", { delay: 1.2 + n * beat }); });
      k.text("kl", "kept", 49, 12, "small");
      k.text("ol", "out", 63, 12, "small");
    }));
  });

  out.push(step(`Turn the three over. ${mine.map((id) => nameOf(id)).join(", ")}. Your three cards, and no others. Out of fifty two.`, (k) => {
    k.wipe();
    heap(k, under.filter((id) => !left.includes(id)));
    left.forEach((id, j) => k.card(id, id, 26 + j * 13, 46, { size: "m", z: 500 + j, delay: j * 0.5, dur: 0.8 }));
    gold(k);
    k.text("win", "the final three", 39, 74, "gold", { delay: 1.8 });
  }));

  /* ── WHY, with the cards ─────────────────────────────────────────────── */

  out.push(step("Why those three? Look at the dealing again. Up, down, up, down. The first card is out. The second is kept. The third is out. The fourth is kept. So the cards in places two, four, six and so on are the ones kept. I ring them in green. The even places survive. And your cards were at six, twenty two and thirty eight. All even.", (k) => {
    k.wipe();
    under.forEach((id, i) => { k.card(id, "back", ...wLine(i), { z: i + 1, size: "s" }); k.band(id, i % 2 ? 1 : -1); });
    gold(k);
    places(k, under, wLine);
    k.text("ev", "green = even places = kept", 44, 30, "row");
    k.text("ev2", "6 · 22 · 38 &nbsp; all even", 44, 44, "gold", { delay: 4 });
  }));

  passes.slice(1).forEach((pass, t) => {
    const n = pass.hand.length;
    const at = pass.hand.map((id, i) => (isMine(id) ? i + 1 : 0)).filter(Boolean);
    const last = t === passes.length - 2;
    out.push(step(`${SAY[n] ? SAY[n][0].toUpperCase() + SAY[n].slice(1) : n} cards were kept, and dealing them into a pile turned them upside down. Even so, your cards are at ${at.join(", ")}. Even numbers again. ${last ? "And among six cards the even places are two, four and six. Three places. All three are yours." : "So they are kept again."}`, (k) => {
      k.wipe();
      heap(k, under.filter((id) => !pass.hand.includes(id)));
      pass.hand.forEach((id, i) => { k.card(id, "back", 9, 16 + i * (n > 14 ? 2.7 : 4.4), { z: i + 1 }); k.band(id, i % 2 ? 1 : -1); });
      gold(k);
      pass.hand.forEach((id, i) => { if (isMine(id)) k.text(`pl${mine.indexOf(id)}`, String(i + 1), 16.5, 16 + i * (n > 14 ? 2.7 : 4.4), "gold"); });
      k.text("ev", `${at.join(" · ")} &nbsp; all even`, 40, 30, "gold");
    }));
  });

  out.push(step("So that is the whole of it. The piles of ten, fifteen, fifteen and nine put your cards at ten, twenty six and forty two, wherever you cut. Four to the bottom makes that six, twenty two and thirty eight. Then eight, sixteen, twenty four. Then two, six, ten. Then two, four, six. Even places every time, and the even places are the ones that are kept. Now try it at the table, and cut wherever you like.", (k) => {
    k.wipe();
    heap(k, under.filter((id) => !left.includes(id)));
    left.forEach((id, j) => { k.card(id, id, 14 + j * 12, 46, { size: "m", z: 500 + j }); k.band(id, -1); });
    gold(k);
    ["10 · 26 · 42", "6 · 22 · 38", "8 · 16 · 24", "2 · 6 · 10", "2 · 4 · 6"].forEach((t, i) => k.text(`s${i}`, t, 86, 16 + i * 11, i === 4 ? "gold" : "row", { delay: i * 0.7 }));
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

const TITLES = { base3: "27 cards", eleven: "Eleven", any: "Any number", odd: "The odd one out", final3: "The final three: three piles", final3b: "The final three: the whole pack", free: "The card table" };

/** Put PrepBot's TV up, teaching one of the tricks. */
export function openTutorial(trick, n = 14) {
  const steps = trick === "base3" ? lesson27(n) : trick === "eleven" ? lessonEleven() : trick === "any" ? lessonAny() : trick === "odd" ? lessonOdd() : trick === "final3" ? lessonFinal3() : trick === "final3b" ? lessonFinal3B() : lessonTable();
  return openTv({ title: TITLES[trick] || "Card Tricks", build, steps });
}
