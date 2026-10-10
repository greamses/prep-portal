/* ============================================================================
   CARD TRICKS — the page
   ----------------------------------------------------------------------------
   Two screens, the way the Drills are: a SETUP receipt where the trick is
   chosen, and the TABLE — the whole screen, black cloth, nothing on it but
   cards, a row of icons and one line of talk.

     the table     a pack and nothing else — pull, stack, turn, shuffle
     27 cards      the computer keeps a card; YOU are the magician, and steer
                   it to the number you chose by how you gather three piles.
                   The steering is counting in base 3.
     eleven        you shuffle, the computer lays down a card, and the card
                   you count to is that card. Every pile and its number make
                   eleven, four times over.

   The computer takes its card where you can watch: a card is drawn out of the
   pack, a blue-backed copy is made on top of it, and the card goes back.

   The tricks never move a card to make themselves come true. They read the
   piles on the table and say what they see — so a trick that was gathered
   the wrong way comes out wrong, and the page says where the card really was.
   ========================================================================== */

import { UI } from "/utils/components/ui-icons.js";
import { heroPaint } from "/utils/components/nav-icons.js";
import { createTable } from "./table.js";
import { fullDeck, nameOf, base3, dealtInTurn, pileState } from "./deck.js";

const $ = (sel, root = document) => root.querySelector(sel);
const wait = (ms) => new Promise((done) => setTimeout(done, ms));
const KEEP = "prep-portal:card-tricks";
const COPY = "copy";   // the computer's own card: a second seven of hearts, from another pack

const S = { trick: "base3", n: 14, open: false, g: null, begun: false, run: 0 };

const table = createTable($("#ct-table"), {
  onChange: (what) => { guide().changed(what); sync(); },
  onRefuse: (what) => { guide().refused(what); },
});

const guide = () => GUIDES[S.trick];
const pause = (ms) => wait(table.still ? 0 : ms);

function say(words = "", tone = "") {
  const el = $("#ct-say");
  el.textContent = words;
  el.dataset.tone = tone;
}

/** Any order at all — for laying a pack out, before the visible shuffle. */
function mixed(ids) {
  const a = ids.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Every pile that is the player's — not the computer's own card. */
const piles = () => table.stacks.filter((s) => !s.cards.includes(COPY));
const allDown = (stack) => stack.cards.every((id) => !table.cards.get(id).up);
const allUp = (stack) => stack.cards.every((id) => table.cards.get(id).up);
const Name = (id) => { const n = nameOf(id); return n[0].toUpperCase() + n.slice(1); };

function glow(stack) {
  table.cards.forEach((c) => c.el.classList.toggle("is-mine", !!stack && c.stack === stack));
}

/**
 * The computer takes its card, where it can be watched: the card is drawn
 * out of the pack face down, a copy is made on top of it, and the card goes
 * back to exactly where it was.
 */
async function drawAndCopy(cardId) {
  const run = S.run;
  table.busy = true;
  table.lift(cardId, "copy");
  await pause(950);
  if (run !== S.run) return null;
  const stack = table.addStack([COPY], { spot: "copy", tone: "blue", locked: true, face: cardId });
  /* it cannot be moved or turned, but a card can be laid against it */
  stack.accepts = true;
  const el = table.cards.get(COPY).el;
  el.classList.add("is-born");
  await pause(900);
  if (run !== S.run) return null;
  el.classList.remove("is-born");
  table.settle(cardId);
  await pause(450);
  table.busy = false;
  return stack;
}

/**
 * THE CONFIRMATION. The player lays the card they have arrived at against
 * the computer's copy; the copy is turned over; they match or they do not.
 * Returns the card that was offered.
 */
function confirm(what) {
  const card = what.stack.cards[0];
  if (!table.cards.get(card).up) table.flip(what.stack, { quiet: true });
  const copy = table.cards.get(COPY).stack;
  copy.accepts = false;
  table.flip(copy, { quiet: true });
  table.point(null);
  glow(null);
  return card;
}

/* ── the pieces a guide is written with ───────────────────────────────────*/

const row = (icon, words, state = "") => `<li class="${state}"><i>${icon}</i><span>${words}</span></li>`;
const steps = (list, now) =>
  `<ol class="ct-steps">${list.map(([icon, words], i) => row(icon, words, i < now ? "is-done" : i === now ? "is-now" : "")).join("")}</ol>`;

/** An icon key on the dock. `label` is spoken and shown as a tooltip; `text` is the few characters worth showing. */
const key = (act, icon, label, { text = "", tone = "c2", off = false } = {}) =>
  `<button type="button" class="pp-sticky pp-note-btn pp-sticky--${tone} ct-key" data-act="${act}" title="${label}" aria-label="${label}"${off ? " disabled" : ""}>${icon}${text ? `<b>${text}</b>` : ""}</button>`;

const secret = (title, body) =>
  `<details class="ct-secret"${S.open ? " open" : ""}><summary><i>${UI.bulb(16)}</i><span>${title}</span></summary>${body}</details>`;

const HANDS = `<ul class="ct-hands">
  ${row(UI.hand(18), "Drag the top card to pull it off a pile.")}
  ${row(UI.layers(18), "Let it go over a card and it lands on top.")}
  ${row(UI.refresh(18), "Tap to turn over. A pile turns over together. With flip deal on, a card turns as you draw it.")}
  ${row(UI.move(18), "Drag the number under a pile to carry all of it.")}
  ${row(UI.shuffle(18), "Riffles the pile you touched last.")}
</ul>`;

/* How big a card is: the smaller of a share of the table's width and of its
   height. The 27-card trick is laid out in ONE row, so its cards can be tall. */
const CARD = { wide: [0.14, 0.3], narrow: [0.27, 0.19] };
const CARD_ROW = { wide: [0.15, 0.36], narrow: [0.29, 0.19] };
const CARD_TWO = { wide: [0.13, 0.255], narrow: [0.235, 0.165] };

/** The arrow the computer points with. */
const POINT = `${UI.arrowDown(34)}<b>my card</b>`;

/* ══ THE TABLE, AND NOTHING ELSE ══════════════════════════════════════════ */

const FREE = {
  name: "The table",
  blurb: "A full pack and room to play.",
  setup() {
    S.g = { kind: "free" };
    table.setup({ card: CARD });
    table.addStack(mixed(fullDeck()), { x: 0.5, y: 0.5 });
    table.turn = false;
    say("");
  },
  async intro() { say("A full pack. It is yours."); },
  changed() {},
  refused() {},
  act() {},
  dock: () => "",
  guide: () => `<p class="ct-lead">Fifty-two cards and a bare table. Everything is done the way hands do it.</p>${HANDS}`,
};

/* ══ 27 CARDS: A NUMBER IN BASE 3 ═════════════════════════════════════════ */

/* One row on a wide table: the pack, the three piles, the computer's card.
   The counting is done where the piles were — they are back in the pack by then. */
const B3_SPOTS = {
  wide: [
    { id: "pack", x: 0.11, y: 0.53 }, { id: "copy", x: 0.89, y: 0.53 },
    { id: "a", x: 0.31, y: 0.53 }, { id: "b", x: 0.5, y: 0.53 }, { id: "c", x: 0.69, y: 0.53 },
    { id: "off", x: 0.37, y: 0.53 }, { id: "show", x: 0.61, y: 0.53 },
  ],
  narrow: [
    { id: "pack", x: 0.24, y: 0.24 }, { id: "copy", x: 0.76, y: 0.24 },
    { id: "a", x: 0.18, y: 0.52 }, { id: "b", x: 0.5, y: 0.52 }, { id: "c", x: 0.82, y: 0.52 },
    { id: "off", x: 0.28, y: 0.8 }, { id: "show", x: 0.72, y: 0.8 },
  ],
};

const BASE3 = {
  name: "27 cards",
  blurb: "Steer a hidden card to your number.",
  setup() {
    const pack = mixed(fullDeck()).slice(0, 27);
    S.g = { kind: "base3", n: S.n, mine: pack[Math.floor(Math.random() * 27)], round: 0, phase: "wait", before: null, ks: [], at: null, shown: null };
    table.setup({ spots: B3_SPOTS, card: CARD_ROW });
    table.addStack(pack, { spot: "pack" });
    table.turn = true;
    say("");
  },

  async intro() {
    const g = S.g;
    const run = S.run;
    say("I take one card…");
    await pause(500);
    const drawn = drawAndCopy(g.mine);
    await pause(950);
    if (run !== S.run) return;
    say("…copy it…");
    await drawn;
    if (run !== S.run) return;
    say("…and put it back. Deal three piles of nine.");
    g.phase = "pack";
    g.before = table.topFirst(piles()[0]);
  },

  changed(what) {
    const g = S.g;
    if (what && what.type === "offer") {
      if (g.phase === "wait" || g.phase === "done") return;
      g.shown = confirm(what);
      g.phase = "done";
      this.verdict();
      return;
    }
    const mine = piles();
    if (g.phase !== "pack" && g.phase !== "dealt") return;

    if (mine.length === 1 && mine[0].cards.length === 27) {
      const pack = mine[0];
      if (g.phase === "pack") {
        /* the order the pack would be dealt in, whichever way up it is lying */
        if (allDown(pack) || allUp(pack)) g.before = table.topFirst(pack);
        if (what && what.type === "shuffle") say("Shuffled. My card is still in there.");
        return;
      }
      /* gathered */
      if (!allDown(pack)) {
        say(allUp(pack) ? "Now turn the pack face down." : "Get the whole pack face down.", "warn");
        return;
      }
      glow(null);
      table.point(null);
      table.clearNotes();
      /* back to where the pack lives, clear of where the piles are dealt */
      table.moveTo(pack, "pack");
      g.before = table.topFirst(pack);
      g.at = g.before.indexOf(g.mine);
      g.ks.push(Math.floor(g.at / 9));
      g.round += 1;
      g.phase = g.round === 3 ? "count" : "pack";
      say(g.round === 3 ? `Three deals. Count down to card ${g.n} and drag it onto my card.` : `Deal ${g.round + 1} of 3.`);
      return;
    }

    if (mine.length === 3 && mine.every((s) => s.cards.length === 9)) {
      if (g.phase === "dealt") return;
      /* Three piles of nine: the computer ALWAYS says which one its card is
         in, however they were made. If they were not dealt one to each in
         turn the count will not come out, and it says that too — but it
         still points. */
      const fair = !!g.before && dealtInTurn(g.before, mine.map((s) => s.cards));
      if (!fair) g.loose = true;
      g.phase = "dealt";
      const pile = mine.find((s) => s.cards.includes(g.mine));
      glow(pile);
      table.point(pile, POINT);
      say(fair
        ? "My card is in this pile. Now gather all three, face down."
        : "My card is in this pile. (Deal one to each pile in turn, or the count will not work.)", fair ? "" : "warn");
    }
  },

  refused(what) {
    if (what.why === "shuffle") say("No shuffling now. It would undo your deals.", "warn");
    else if (what.why === "one") say("One card only: the one you think is mine.", "warn");
    else if (S.g.phase !== "done") say("Mine stays face down. Drag the card you think it is onto it.", "warn");
  },

  async act(act) {
    const g = S.g;
    if (act === "deal") {
      const mine = piles();
      if (mine.length !== 1 || !allDown(mine[0])) { say("One face-down pack first.", "warn"); return; }
      table.moveTo(mine[0], "pack");
      await table.deal(mine[0], ["a", "b", "c"], { turn: true });
    }
  },

  verdict() {
    const g = S.g;
    if (g.shown === g.mine) say(`${Name(g.mine)}. A match: you win. You sent it to card ${g.n}.`, "win");
    else if (g.round === 3) say(`No match. Mine was ${nameOf(g.mine)}, lying at card ${g.at + 1}.${g.loose ? " A pile was not dealt in turn." : ""}`, "warn");
    else say(`No match. Mine was ${nameOf(g.mine)}.`, "warn");
    S.open = true;
    $("#ct-help").classList.add("is-nudge");
  },

  canShuffle: () => S.g.phase === "pack" && S.g.round === 0,

  dock() {
    const g = S.g;
    if (g.phase === "pack") return key("deal", UI.cards(20), "Deal three piles of nine for me", { text: "3 × 9" });
    if (g.phase === "done") return key("again", UI.again(20), "Do it again");
    return "";
  },

  guide() {
    const g = S.g;
    const want = base3(g.n);
    const now = g.phase === "done" ? 5 : g.phase === "count" ? 3 : g.round;
    const dealing = [UI.cards(18), "Deal three piles of nine, then gather them face down"];
    const did = (r) => (g.ks[r] === undefined ? "" : `<em class="${g.ks[r] === want[r] ? "ct-ok" : "ct-no"}">you put ${g.ks[r]}</em>`);
    const m = g.n - 1;
    const why = `
      <p>Each time you gather, you choose how many piles lie <b>on top of mine</b> once the pack is face down: 0, 1 or 2.</p>
      <p>Take 1 from your number and write it in <b>nines, threes and ones</b>. That is the number in base 3.</p>
      <p class="ct-sum">${g.n} − 1 = ${m} = ${want[2]} × 9 + ${want[1]} × 3 + ${want[0]} × 1</p>
      <table class="ct-places">
        <thead><tr><th>Deal</th><th>Place</th><th>Piles on top of mine</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>ones</td><td><b>${want[0]}</b> ${did(0)}</td></tr>
          <tr><td>2</td><td>threes</td><td><b>${want[1]}</b> ${did(1)}</td></tr>
          <tr><td>3</td><td>nines</td><td><b>${want[2]}</b> ${did(2)}</td></tr>
        </tbody>
      </table>
      <p>Dealing into three divides a card's place by 3. Gathering adds whole piles of 9 on top. After three deals nothing is left of where the card began, only your three choices.</p>
      <p class="ct-hint">Tap each pile to turn it face down before you stack them, and "on top" means on top. Stack them face up and turn the lot, and it is the other way round.</p>`;

    return `<p class="ct-lead">I keep a card. You chose <b>${g.n}</b>. Deal and gather three times so that my card lies at card ${g.n}, then prove it.</p>
      ${steps([dealing, dealing, dealing, [UI.hand(18), `Count down to card ${g.n} yourself, one card at a time`], [UI.layers(18), "Drag that card onto my card. If they match, you win"]], now)}
      ${secret("The secret: counting in threes", why)}
      ${HANDS}`;
  },
};

/* ══ ELEVEN ═══════════════════════════════════════════════════════════════
   The set-up is done in the open, so there is nothing up a sleeve:

     nine cards are set to one side;
     the computer draws one of the nine, copies it, and lays it back ON TOP
       of the nine;
     the other 43 are shuffled, cut into seven packets, and the packets are
       stacked on the nine in any order at all.

   Forty-three cards over it: the computer's card is the 44th, however the
   43 were shuffled and stacked. The rest is the player's to do. */

const EL_SPOTS = {
  wide: [
    { id: "pack", x: 0.12, y: 0.31 }, { id: "nine", x: 0.34, y: 0.31 }, { id: "copy", x: 0.12, y: 0.73 },
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({ id: `k${i}`, x: 0.3 + i * 0.097, y: 0.73 })),
  ],
  narrow: [
    { id: "pack", x: 0.18, y: 0.23 }, { id: "nine", x: 0.5, y: 0.23 }, { id: "copy", x: 0.82, y: 0.23 },
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => (i < 4 ? { id: `k${i}`, x: 0.14 + i * 0.24, y: 0.52 } : { id: `k${i}`, x: 0.26 + (i - 4) * 0.24, y: 0.76 })),
  ],
};

/** 43 cards as seven packets, none of them thin. */
function sevenCuts(total = 43, parts = 7, least = 3) {
  const sizes = Array(parts).fill(least);
  for (let left = total - parts * least; left > 0; left--) sizes[Math.floor(Math.random() * parts)] += 1;
  return sizes;
}

const ELEVEN = {
  name: "Eleven",
  blurb: "Shuffle all you like. I still know.",
  setup() {
    S.g = { kind: "eleven", phase: "wait", mine: null, states: [], sum: 0, shown: null };
    table.setup({ spots: EL_SPOTS, card: CARD_TWO });
    table.addStack(mixed(fullDeck()), { spot: "pack" });
    table.turn = true;
    say("");
  },

  async intro() {
    const g = S.g;
    const run = S.run;
    const gone = () => run !== S.run;
    g.phase = "staging";
    table.frozen = true;
    const pack = table.tagged("pack");

    say("Nine cards to one side.");
    await pause(500);
    if (gone()) return;
    const nine = table.take(pack, 9, { spot: "nine", tag: "nine" });
    await pause(900);
    if (gone()) return;

    g.mine = nine.cards[Math.floor(Math.random() * 9)];
    say("I draw one of the nine…");
    const drawn = drawAndCopy(g.mine);
    await pause(950);
    if (gone()) return;
    say("…copy it…");
    await drawn;
    if (gone()) return;
    table.send(g.mine, "nine");
    say("…and lay it on top of the nine.");
    await pause(1100);
    if (gone()) return;

    say("Now the other 43 are shuffled.");
    table.canShuffle = true;
    await table.shuffle(pack);
    if (gone()) return;

    say("Cut into seven…");
    const packets = [];
    const sizes = sevenCuts();
    for (let i = 0; i < 7; i++) {
      packets.push(table.take(table.tagged("pack"), sizes[i], { spot: `k${i}` }));
      await pause(170);
      if (gone()) return;
    }
    await pause(600);
    if (gone()) return;

    say("…and stacked on the nine, in any order.");
    for (const packet of mixed(packets)) {
      await table.stackOnto(packet, nine);
      if (gone()) return;
    }
    nine.tag = "pack";
    table.moveTo(nine, "pack");
    await pause(500);
    if (gone()) return;

    table.frozen = false;
    g.phase = "deal";
    say("My card is in there. Over to you: turn a card and say 10.");
  },

  /** The countdown piles: everything the player has laid out, oldest first. */
  laid: () => piles().filter((s) => !s.tag).sort((a, b) => a.id - b.id),

  /** How each pile stands, read off the table. */
  read() {
    return this.laid().map((s) => {
      const n = s.cards.length;
      /* a pile that ran out is turned face down, eleven cards thick */
      if (allDown(s)) return n === 11 ? { s, state: "dead", match: 0, cards: n } : { s, state: "down", match: 0, cards: n };
      if (!allUp(s)) return { s, state: "down", match: 0, cards: n };
      return { s, cards: n, ...pileState(s.cards) };
    });
  },

  changed(what) {
    const g = S.g;
    if (what && what.type === "offer") {
      if (g.phase !== "deal" && g.phase !== "ready") return;
      g.shown = confirm(what);
      g.phase = "done";
      this.verdict();
      return;
    }
    if (g.phase !== "deal" && g.phase !== "ready") return;
    g.states = this.read();
    const finished = (p) => p.state === "match" || p.state === "dead";
    const done = g.states.length >= 4 && g.states.slice(0, 4).every(finished);

    /* Once the four piles stand, whatever else is laid out is the player
       counting cards off the pack: the piles keep their numbers, the counted
       cards get none. */
    const NOTE = {
      open: (p) => [`say ${p.count}`, ""],
      match: (p) => [`stop: ${p.match}`, "ok"],
      over: (p) => [`${p.extra} too many`, "warn"],
      cover: () => ["1 more", "warn"],
      dead: () => ["out: 0", "ok"],
      long: (p) => [`${p.extra} too many`, "warn"],
      down: () => ["face up", "warn"],
    };
    g.states.forEach((p, i) => { if (done && i >= 4) table.setNote(p.s); else table.setNote(p.s, ...NOTE[p.state](p)); });
    g.sum = g.states.slice(0, 4).reduce((t, p) => t + p.match, 0);
    g.phase = done ? "ready" : "deal";

    if (done) {
      say("Four piles. Add their numbers, count that many off the pack, and drag the last one onto my card.");
      return;
    }
    const p = g.states.find((x) => !finished(x));
    if (!p) { say(`Pile ${g.states.length + 1}: turn a card and say 10.`); return; }
    say({
      open: `The next card is ${p.count}.`,
      over: "That pile had stopped. Drag the extra back to the pack.",
      cover: "Down to 1 and no match. One more card, then tap the pile to turn it over.",
      long: "Too many. Drag the extra back to the pack.",
      down: "Those cards need to be face up.",
    }[p.state], p.state === "open" ? "" : "warn");
  },

  refused(what) {
    if (what.why === "shuffle") say("No shuffling now. My card is in its place.", "warn");
    else if (what.why === "one") say("One card only: the one you think is mine.", "warn");
    else if (S.g.phase !== "done") say("Mine stays face down. Drag the card you think it is onto it.", "warn");
  },

  act() {},

  verdict() {
    const g = S.g;
    if (g.shown === g.mine) say(`${Name(g.mine)}. A match: you win.`, "win");
    else say(`No match. Mine was ${nameOf(g.mine)}. Check that every pile and its number make 11.`, "warn");
    S.open = true;
    $("#ct-help").classList.add("is-nudge");
  },

  canShuffle: () => S.g.phase === "staging",

  dock() {
    return S.g.phase === "done" ? key("again", UI.again(20), "Do it again") : "";
  },

  guide() {
    const g = S.g;
    const now = { wait: 0, staging: 0, deal: 1, ready: 2, done: 5 }[g.phase];
    const rows = (g.states || []).slice(0, 4).filter((p) => p.state === "match" || p.state === "dead").map((p, i) =>
      `<tr><td>${i + 1}</td><td>${p.cards}</td><td>${p.match}</td><td><b>${p.cards + p.match}</b></td></tr>`).join("");
    const why = `
      <p>My card lies on top of nine cards, with the other 43 over it. However those 43 are shuffled, it is the <b>44th</b> card from the top.</p>
      <p>A pile that stops on 7 has four cards: ten, nine, eight, seven. Four cards and the number 7 make <b>11</b>.</p>
      <p>Stop on 3 and it is eight cards thick: 8 + 3 = <b>11</b>. A pile that is out has eleven cards and counts 0: <b>11</b> again.</p>
      ${rows ? `<table class="ct-places"><thead><tr><th>Pile</th><th>Cards</th><th>Number</th><th>Together</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
      <p>Four piles: cards turned plus numbers added is 4 × 11 = <b>44</b>, every time. So counting the numbers off the pack always ends on the 44th card.</p>
      <p>With a real pack: glimpse the <b>ninth card from the bottom</b>, let anyone shuffle the rest, and you can do this to them.</p>`;

    return `<p class="ct-lead">I hide one card in the pack, in front of you. Then the magic is yours to do: find it.</p>
      ${steps([
        [UI.shuffle(18), "Watch: nine aside, my card drawn and copied, the rest shuffled and stacked on top"],
        [UI.cards(18), "Turn cards onto a pile, counting down from 10. Stop when the card says your number. Make four piles"],
        [UI.plus(18), "Add the four numbers in your head"],
        [UI.hand(18), "Count that many cards off the pack, one at a time"],
        [UI.layers(18), "Drag the last one onto my card. If they match, you win"],
      ], now)}
      <p class="ct-hint">Ace is 1. Jack, Queen and King are 10. Reach 1 with no match? One more card on top, then tap the pile to turn it face down: it is out. If no pile stops at all, your card is the last one you put down.</p>
      ${secret("The secret: every pile makes 11", why)}
      ${HANDS}`;
  },
};

const GUIDES = { base3: BASE3, eleven: ELEVEN, free: FREE };

/* ── the two screens ──────────────────────────────────────────────────────*/

function recall() {
  try {
    const was = JSON.parse(localStorage.getItem(KEEP) || "null") || {};
    if (GUIDES[was.trick]) S.trick = was.trick;
    if (was.n >= 1 && was.n <= 27) S.n = Math.round(was.n);
  } catch { /* a browser that refuses storage still plays perfectly */ }
}
function remember() {
  try { localStorage.setItem(KEEP, JSON.stringify({ trick: S.trick, n: S.n })); } catch { /* the same */ }
}

function drawSetup() {
  document.querySelectorAll('input[name="ct-trick"]').forEach((el) => { el.checked = el.value === S.trick; });
  $("#ct-number-field").hidden = S.trick !== "base3";
  $("#ct-n").textContent = String(S.n);
  $("#ct-less").disabled = S.n <= 1;
  $("#ct-more").disabled = S.n >= 27;
}

/** Redraw everything on the table screen that is not a card. */
function sync() {
  const g = guide();
  table.canShuffle = g.canShuffle ? g.canShuffle() : true;
  $("#ct-dock").innerHTML = S.begun ? g.dock() : "";
  $("#ct-guide").innerHTML = g.guide();
  $("#ct-guide-title").textContent = g.name;
  $("#ct-turn").setAttribute("aria-pressed", String(table.turn));
  $("#ct-turn").classList.toggle("is-on", table.turn);
}

/**
 * The instructions: a slip of paper over the table that folds away to the
 * icon it came from. The first time it is put away the trick begins — so
 * whatever the computer does first is done where it can be watched.
 */
async function showGuide(on) {
  $("#ct-modal").classList.toggle("is-min", !on);
  $("#ct-modal").setAttribute("aria-hidden", String(!on));
  $("#ct-help").classList.toggle("is-on", on);
  $("#ct-help").classList.remove("is-nudge");
  if (on) { $("#ct-min").focus(); return; }
  if (S.begun) return;
  S.begun = true;
  await guide().intro();
  sync();
}

function begin() {
  S.run += 1;
  S.open = false;
  S.begun = false;
  guide().setup();
  sync();
  showGuide(true);
}

function play() {
  remember();
  document.body.classList.add("ct-playing");
  $("#ct-play").hidden = false;
  begin();
}

function leave() {
  S.run += 1;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  $("#ct-play").hidden = true;
  document.body.classList.remove("ct-playing");
  drawSetup();
}

function start() {
  $("#ct-paint").innerHTML = heroPaint();
  $("#ct-start").insertAdjacentHTML("afterbegin", UI.play(16));
  $("#ct-less").innerHTML = UI.chevronLeft(16);
  $("#ct-more").innerHTML = UI.chevronRight(16);
  $("#ct-min").innerHTML = UI.chevronDown(16);
  const ICON = { "ct-exit": UI.arrowLeft, "ct-shuffle": UI.shuffle, "ct-turn": UI.refresh, "ct-again": UI.again, "ct-help": UI.doc, "ct-full": UI.expand };
  Object.entries(ICON).forEach(([id, icon]) => { $(`#${id}`).innerHTML = icon(20); });

  recall();
  drawSetup();

  /* setup */
  $("#ct-setup").addEventListener("change", (e) => {
    if (e.target.name === "ct-trick") { S.trick = e.target.value; drawSetup(); }
  });
  $("#ct-less").addEventListener("click", () => { S.n = Math.max(1, S.n - 1); drawSetup(); });
  $("#ct-more").addEventListener("click", () => { S.n = Math.min(27, S.n + 1); drawSetup(); });
  $("#ct-start").addEventListener("click", play);

  /* the table */
  $("#ct-exit").addEventListener("click", leave);
  $("#ct-shuffle").addEventListener("click", () => { if (!table.frozen) table.shuffle(); });
  $("#ct-turn").addEventListener("click", () => { table.turn = !table.turn; sync(); say(table.turn ? "Flip deal is on: a card turns over as you draw it." : "Flip deal is off: a card comes out as it lies."); });
  $("#ct-again").addEventListener("click", () => { if (!table.busy) begin(); });
  $("#ct-help").addEventListener("click", () => showGuide($("#ct-modal").classList.contains("is-min")));
  $("#ct-min").addEventListener("click", () => showGuide(false));
  $("#ct-modal").addEventListener("click", (e) => { if (e.target === e.currentTarget) showGuide(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#ct-play").hidden && !$("#ct-modal").classList.contains("is-min")) showGuide(false);
  });

  const full = $("#ct-full");
  if (!document.documentElement.requestFullscreen) full.hidden = true;
  full.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else $("#ct-play").requestFullscreen().catch(() => {});
  });
  document.addEventListener("fullscreenchange", () => { full.innerHTML = (document.fullscreenElement ? UI.shrink : UI.expand)(20); });

  const dock = $("#ct-dock");
  dock.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled || table.busy) return;
    const act = el.dataset.act;
    if (act === "again") { begin(); return; }
    await guide().act(act, dock);
    sync();
  });
  /* the secret stays open, or shut, through every redraw */
  $("#ct-guide").addEventListener("toggle", (e) => { if (e.target.matches(".ct-secret")) S.open = e.target.open; }, true);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
