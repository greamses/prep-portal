/* ============================================================================
   CARD TRICKS — the page
   ----------------------------------------------------------------------------
   A table of real cards (table.js) and, beside it, somebody to do a trick
   with. Three things to choose from:

     the table     a pack and nothing else — pull, stack, turn, shuffle
     27 cards      the computer keeps a card; YOU are the magician, and steer
                   it to the number you chose by how you gather three piles.
                   The steering is counting in base 3.
     eleven        you shuffle, the computer lays down a card, and the card
                   you count to is that card. Every pile and its number make
                   eleven, four times over.

   The tricks never move a card to make themselves come true. They read the
   piles on the table and say what is there — so a trick that was gathered
   the wrong way comes out wrong, and the page says where the card really was.
   ========================================================================== */

import { UI } from "/utils/components/ui-icons.js";
import { heroPaint } from "/utils/components/nav-icons.js";
import { createTable } from "./table.js";
import { fullDeck, nameOf, base3, dealtInTurn, pileState } from "./deck.js";

const $ = (sel, root = document) => root.querySelector(sel);
const KEEP = "prep-portal:card-tricks";
const COPY = "copy";   // the computer's own card: a second seven of hearts, from another pack

const S = { trick: "base3", open: false, g: null };

const table = createTable($("#ct-table"), {
  onChange: (what) => { guide().changed(what); sync(); },
  onRefuse: (what) => { guide().refused(what); },
});

const guide = () => GUIDES[S.trick];

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

function glow(stack) {
  table.cards.forEach((c) => c.el.classList.toggle("is-mine", !!stack && c.stack === stack));
}

function layCopy(face) {
  table.addStack([COPY], { mat: "mine", tone: "blue", locked: true, face });
}

const steps = (list, now) =>
  `<ol class="ct-steps">${list.map((t, i) =>
    `<li class="${i < now ? "is-done" : i === now ? "is-now" : ""}">${t}</li>`).join("")}</ol>`;

const btn = (act, label, icon = "", tone = "c2", extra = "") =>
  `<button type="button" class="pp-sticky pp-note-btn pp-sticky--${tone} ct-act" data-act="${act}"${extra}>${icon}<span>${label}</span></button>`;

const secret = (title, body) =>
  `<details class="ct-secret"${S.open ? " open" : ""}><summary>${UI.bulb(15)}<span>${title}</span></summary>${body}</details>`;


/* ══ THE TABLE, AND NOTHING ELSE ══════════════════════════════════════════ */

const FREE = {
  name: "The table",
  setup() {
    table.setup({ card: { wide: 0.105, narrow: 0.19 } });
    table.addStack(mixed(fullDeck()), { x: 0.5, y: 0.5 });
    table.turn = false;
    table.canShuffle = true;
    say("A full pack, face down. It is yours.");
  },
  changed() {},
  refused() {},
  act() {},
  panel() {
    return `<h2 class="ct-guide__title">The table</h2>
      <p class="ct-guide__lead">Fifty-two cards and room to lay them out. Everything here is done the way hands do it.</p>
      <ul class="ct-tips">
        <li><b>Pull</b> a card by dragging it off the top of a pile.</li>
        <li><b>Stack</b> by letting a card go over another: it lands on top.</li>
        <li><b>Turn</b> a card over with a tap. Tap a pile and the whole pile turns over together, so the bottom card comes to the top.</li>
        <li><b>Carry</b> a whole pile by the numbered tab under it.</li>
        <li><b>Shuffle</b> riffles the pile you touched last.</li>
        <li><b>Turn as I deal</b> turns each card over as you deal it off a pile.</li>
      </ul>`;
  },
};

/* ══ 27 CARDS: A NUMBER IN BASE 3 ═════════════════════════════════════════ */

const B3_MATS = {
  wide: [
    { id: "pack", label: "Pack", x: 0.13, y: 0.28 },
    { id: "mine", label: "My card", x: 0.13, y: 0.75, hold: true },
    { id: "a", label: "Pile 1", x: 0.42, y: 0.28 },
    { id: "b", label: "Pile 2", x: 0.62, y: 0.28 },
    { id: "c", label: "Pile 3", x: 0.82, y: 0.28 },
    { id: "off", label: "Counted", x: 0.47, y: 0.75 },
    { id: "show", label: "Your card", x: 0.72, y: 0.75 },
  ],
  narrow: [
    { id: "pack", x: 0.2, y: 0.17 }, { id: "mine", x: 0.8, y: 0.17 },
    { id: "a", x: 0.2, y: 0.51 }, { id: "b", x: 0.5, y: 0.51 }, { id: "c", x: 0.8, y: 0.51 },
    { id: "off", x: 0.3, y: 0.85 }, { id: "show", x: 0.7, y: 0.85 },
  ],
};

const BASE3 = {
  name: "27 cards",
  setup() {
    const was = S.g && S.g.kind === "base3" ? S.g.n : recalled().n;
    const pack = mixed(fullDeck()).slice(0, 27);
    const mine = pack[Math.floor(Math.random() * 27)];
    S.g = { kind: "base3", n: was || 14, mine, round: 0, phase: "pack", before: null, ks: [], at: null, shown: null };
    table.setup({ mats: B3_MATS, card: { wide: 0.105, narrow: 0.19 } });
    table.addStack(pack, { mat: "pack" });
    layCopy(mine);
    table.turn = true;
    S.g.before = table.topFirst(piles()[0]);
    say("I have picked one of your 27 cards. A copy of it is lying face down.");
  },

  changed(what) {
    const g = S.g;
    const mine = piles();
    if (g.phase === "shown") {
      if (table.cards.get(COPY).up) { g.phase = "done"; this.verdict(); }
      return;
    }
    if (g.phase !== "pack" && g.phase !== "dealt") return;

    if (mine.length === 1 && mine[0].cards.length === 27) {
      const pack = mine[0];
      if (g.phase === "pack") {
        if (allDown(pack)) g.before = table.topFirst(pack);
        if (what && what.type === "shuffle") say("Shuffled. My card is still in there somewhere.");
        return;
      }
      /* gathered */
      if (!allDown(pack)) {
        say(allUp(pack) ? "Now turn the pack face down: tap it." : "Some cards are face up and some face down. Get the whole pack face down.");
        return;
      }
      glow(null);
      table.clearNotes();
      /* back to where the pack lives, so the three places are clear to deal on */
      table.moveTo(pack, "pack");
      g.before = table.topFirst(pack);
      g.at = g.before.indexOf(g.mine);
      g.ks.push(Math.floor(g.at / 9));
      g.round += 1;
      g.phase = g.round === 3 ? "count" : "pack";
      say(g.round === 3
        ? `Three deals done. Count down to card ${g.n}.`
        : `That is deal ${g.round}. Deal the three piles again.`);
      return;
    }

    if (mine.length === 3 && mine.every((s) => s.cards.length === 9)) {
      if (g.phase === "dealt") return;
      if (!g.before || !dealtInTurn(g.before, mine.map((s) => s.cards))) {
        g.round = 0;
        g.ks = [];
        say("Those piles were not dealt one card to each in turn, so the trick has lost its place. Gather them up and begin the three deals again.", "warn");
        return;
      }
      g.phase = "dealt";
      const pile = mine.find((s) => s.cards.includes(g.mine));
      glow(pile);
      if (pile.mat) table.setMatNote(pile.mat, "my card is in here", "ok");
      say("My card is in the pile that is lit. Gather the three piles into one pack, face down.");
    }
  },

  refused(what) {
    if (what.why === "shuffle") say("No shuffling now. It would undo the deals you have made.", "warn");
    else if (S.g.phase !== "shown") say("Not yet. Find my card first.", "warn");
  },

  async act(act) {
    const g = S.g;
    if (act === "less" || act === "more") {
      g.n = Math.max(1, Math.min(27, g.n + (act === "more" ? 1 : -1)));
      remember();
    }
    if (act === "deal") {
      const mine = piles();
      if (mine.length !== 1 || !allDown(mine[0])) { say("Get all 27 cards into one face-down pack first.", "warn"); return; }
      table.moveTo(mine[0], "pack");
      if (["a", "b", "c"].includes(mine[0].mat)) { say("Move the pack off the three places first.", "warn"); return; }
      await table.deal(mine[0], ["a", "b", "c"], { turn: true });
    }
    if (act === "count") {
      const pack = piles()[0];
      g.phase = "counting";
      sync();
      g.shown = await table.countOff(pack, g.n, "off", "show");
      g.phase = "shown";
      table.unlock(table.cards.get(COPY).stack);
      say(`Card ${g.n} is ${nameOf(g.shown)}. Now turn my card over: tap it.`);
    }
  },

  verdict() {
    const g = S.g;
    if (g.shown === g.mine) {
      say(`${nameOf(g.mine)[0].toUpperCase()}${nameOf(g.mine).slice(1)}, at card ${g.n}, exactly where you sent it.`, "win");
    } else {
      say(`Mine was ${nameOf(g.mine)}. It was lying at card ${g.at + 1}, not ${g.n}. Open the secret and see which gather went the other way.`, "warn");
    }
    S.open = true;
  },

  canShuffle: () => S.g.phase === "pack" && S.g.round === 0,

  panel() {
    const g = S.g;
    const want = base3(g.n);
    const locked = g.round > 0 || g.phase !== "pack";
    const now = g.phase === "done" ? 5 : g.phase === "shown" ? 4 : g.phase === "count" || g.phase === "counting" ? 3 : g.round;
    const list = ["First deal and gather", "Second deal and gather", "Third deal and gather", `Count to card ${g.n}`, "Turn my card over"];

    let body = "";
    if (g.phase === "pack" || g.phase === "dealt") {
      body += `<div class="ct-number">
          <span class="ct-number__label">Your number</span>
          <button type="button" class="pp-sticky pp-note-btn pp-sticky--c3 ct-act ct-number__key" data-act="less" aria-label="One less"${locked || g.n <= 1 ? " disabled" : ""}>${UI.chevronLeft(15)}</button>
          <b class="ct-number__n" aria-live="polite">${g.n}</b>
          <button type="button" class="pp-sticky pp-note-btn pp-sticky--c3 ct-act ct-number__key" data-act="more" aria-label="One more"${locked || g.n >= 27 ? " disabled" : ""}>${UI.chevronRight(15)}</button>
        </div>`;
      body += g.phase === "pack"
        ? `<p class="ct-guide__do">Deal the pack into <b>three piles of nine</b>: one card to Pile 1, one to Pile 2, one to Pile 3, and round again. Drag them, or let me.</p>
           ${btn("deal", "Deal for me", UI.cards(15))}`
        : `<p class="ct-guide__do">My card is in the lit pile. Gather the three piles into <b>one pack, face down</b>. How many piles go on top of mine is the whole trick.</p>
           <p class="ct-guide__hint">Easiest: tap each pile to turn it face down, then carry them together by their tabs.</p>`;
    } else if (g.phase === "count" || g.phase === "counting") {
      body += `<p class="ct-guide__do">Three deals, three gathers. If you steered it right, my card is now card <b>${g.n}</b> from the top.</p>
        ${btn("count", `Count to ${g.n}`, UI.play(15), "c2", g.phase === "counting" ? " disabled" : "")}`;
    } else if (g.phase === "shown") {
      body += `<p class="ct-guide__do">Card ${g.n} is <b>${nameOf(g.shown)}</b>. Tap my face-down card to see whether it is the one I picked.</p>`;
    } else {
      body += `<p class="ct-guide__do">${g.shown === g.mine
        ? "You steered a card you never saw to a place you chose. Try another number."
        : "It went astray this time. The secret below shows what each gather needed."}</p>
        ${btn("again", "Do it again", UI.again(15))}`;
    }

    const did = (r) => (g.ks[r] === undefined ? "" : g.ks[r] === want[r] ? `<em class="ct-ok">you put ${g.ks[r]}</em>` : `<em class="ct-no">you put ${g.ks[r]}</em>`);
    const m = g.n - 1;
    const why = `
      <p>Each time you gather, you decide how many piles lie <b>on top of mine</b> once the pack is face down: 0, 1 or 2. Three gathers, three ways each: 3 × 3 × 3 = <b>27</b>, one way for every place in the pack.</p>
      <p>Take 1 from your number and write what is left in <b>nines, threes and ones</b>. That is the number in base 3.</p>
      <p class="ct-sum">${g.n} − 1 = ${m} = ${want[2]} × 9 + ${want[1]} × 3 + ${want[0]} × 1</p>
      <table class="ct-places">
        <thead><tr><th>Deal</th><th>Place</th><th>Piles on top of mine</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>ones</td><td><b>${want[0]}</b> ${did(0)}</td></tr>
          <tr><td>2</td><td>threes</td><td><b>${want[1]}</b> ${did(1)}</td></tr>
          <tr><td>3</td><td>nines</td><td><b>${want[2]}</b> ${did(2)}</td></tr>
        </tbody>
      </table>
      <p>Why it works: dealing into three shares the pack out, so a card that was 9 places down is only 3 down in its pile. Every deal divides by 3; every gather adds whole piles of 9 on top. After three deals nothing is left of where the card began, only your three choices.</p>
      <p class="ct-guide__hint">If you stack the piles face up and turn the whole pack over, everything swaps: the pile that was underneath ends up on top.</p>`;

    return `<h2 class="ct-guide__title">27 cards</h2>
      <p class="ct-guide__lead">I keep a card to myself. You choose a number. Three deals later my card is lying at exactly your number, and you put it there.</p>
      ${steps(list, now)}
      <div class="ct-guide__now">${body}</div>
      ${secret("The secret: counting in threes", why)}`;
  },
};

/* ══ ELEVEN ═══════════════════════════════════════════════════════════════ */

const EL_MATS = {
  wide: [
    { id: "pack", label: "Pack", x: 0.11, y: 0.28 },
    { id: "mine", label: "My card", x: 0.11, y: 0.75, hold: true },
    { id: "p1", label: "Pile 1", x: 0.34, y: 0.28 },
    { id: "p2", label: "Pile 2", x: 0.51, y: 0.28 },
    { id: "p3", label: "Pile 3", x: 0.68, y: 0.28 },
    { id: "p4", label: "Pile 4", x: 0.85, y: 0.28 },
    { id: "off", label: "Counted", x: 0.43, y: 0.75 },
    { id: "show", label: "Your card", x: 0.68, y: 0.75 },
  ],
  narrow: [
    { id: "pack", x: 0.2, y: 0.16 }, { id: "mine", x: 0.8, y: 0.16 },
    { id: "p1", x: 0.14, y: 0.51 }, { id: "p2", x: 0.38, y: 0.51 }, { id: "p3", x: 0.62, y: 0.51 }, { id: "p4", x: 0.86, y: 0.51 },
    { id: "off", x: 0.3, y: 0.86 }, { id: "show", x: 0.7, y: 0.86 },
  ],
};
const EL_PILES = ["p1", "p2", "p3", "p4"];

const ELEVEN = {
  name: "Eleven",
  setup() {
    S.g = { kind: "eleven", phase: "shuffle", mine: null, states: [], sum: 0, shown: null, tried: false };
    table.setup({ mats: EL_MATS, card: { wide: 0.098, narrow: 0.185 } });
    table.addStack(mixed(fullDeck()), { mat: "pack" });
    table.turn = true;
    say("Shuffle the pack as much as you like. Tell me when you have done.");
  },

  /** How each of the four piles stands, read off the table. */
  read() {
    return EL_PILES.map((id) => {
      const s = table.matStack(id);
      if (!s) return { id, state: "open", count: 10, match: 0, cards: 0 };
      const n = s.cards.length;
      /* a pile that ran out is turned face down, eleven cards thick */
      if (allDown(s)) return n === 11 ? { id, state: "dead", match: 0, cards: n } : { id, state: "down", match: 0, cards: n };
      if (!allUp(s)) return { id, state: "down", match: 0, cards: n };
      return { id, cards: n, ...pileState(s.cards) };
    });
  },

  changed(what) {
    const g = S.g;
    if (g.phase === "shown") {
      if (table.cards.get(COPY).up) { g.phase = "done"; this.verdict(); }
      return;
    }
    if (g.phase !== "deal" && g.phase !== "sum") return;
    /* the last card put on a pile — it is the answer when no pile stops */
    if (what && what.type === "drop" && EL_PILES.includes(what.stack.mat) && allUp(what.stack)) {
      g.last = what.stack.cards[what.stack.cards.length - 1];
    }
    g.states = this.read();
    const NOTE = {
      open: (s) => [s.cards ? `say ${s.count}` : "start at 10", ""],
      match: (s) => [`stopped on ${s.match}`, "ok"],
      over: (s) => [`past the match: take ${s.extra} back`, "warn"],
      cover: () => ["no match: one more card", "warn"],
      dead: () => ["out: counts 0", "ok"],
      long: (s) => [`too many: take ${s.extra} back`, "warn"],
      down: () => ["turn these face up", "warn"],
    };
    g.states.forEach((s) => table.setMatNote(s.id, ...NOTE[s.state](s)));
    const done = g.states.every((s) => s.state === "match" || s.state === "dead");
    g.sum = g.states.reduce((t, s) => t + s.match, 0);
    g.phase = done ? "sum" : "deal";
    if (done) { say("Four piles. Add up the numbers they stopped on."); return; }
    const i = g.states.findIndex((s) => s.state !== "match" && s.state !== "dead");
    const s = g.states[i];
    const pile = `Pile ${i + 1}`;
    say({
      open: s.cards ? `${pile}: the next card is ${s.count}.` : `${pile}: turn a card onto it and say 10.`,
      over: `${pile} had already stopped. Drag the extra card${s.extra === 1 ? "" : "s"} back to the pack.`,
      cover: `${pile} reached 1 with no match. Put one more card on top, then tap the pile to turn it face down. It is out.`,
      long: `${pile} has too many cards. Drag ${s.extra} back to the pack.`,
      down: `${pile} needs its cards face up.`,
    }[s.state], s.state === "open" ? "" : "warn");
  },

  refused(what) {
    if (what.why === "shuffle") say("No shuffling now: I have already laid my card down.", "warn");
    else if (S.g.phase !== "shown") say("Not yet. Count your way to a card first.", "warn");
  },

  async act(act, root) {
    const g = S.g;
    if (act === "shuffled") {
      const mine = piles();
      if (mine.length !== 1 || mine[0].cards.length !== 52 || !allDown(mine[0])) {
        say("Get all 52 cards into one face-down pack first.", "warn");
        return;
      }
      /* the only card looked at: the ninth from the bottom, the 44th from the top */
      g.mine = table.topFirst(mine[0])[43];
      layCopy(g.mine);
      g.phase = "deal";
      this.changed();
    }
    if (act === "sum") {
      const typed = Number($("#ct-sum", root).value);
      g.tried = true;
      if ($("#ct-sum", root).value.trim() === "" || typed !== g.sum) {
        say("Add them again. A picture card is 10, an ace is 1, and a pile that is out counts nothing.", "warn");
        return;
      }
      g.phase = "count";
      say(g.sum ? `${g.sum} it is. Count ${g.sum} cards off the pack.` : "Nothing at all. So there is nothing to count.");
    }
    if (act === "count") {
      g.phase = "counting";
      sync();
      if (g.sum === 0) {
        /* no pile stopped: 44 cards are down, and the 44th is the last one dealt */
        g.shown = this.lastDealt();
        table.send(g.shown, "show", { up: true });
      } else {
        const pack = table.matStack("pack") || piles().sort((a, b) => b.cards.length - a.cards.length)[0];
        g.shown = await table.countOff(pack, g.sum, "off", "show");
      }
      g.phase = "shown";
      table.unlock(table.cards.get(COPY).stack);
      say(`You stopped at ${nameOf(g.shown)}. Now turn my card over: tap it.`);
    }
  },

  /** With every pile out, the card is the last one that was put down. */
  lastDealt() {
    if (S.g.last) return S.g.last;
    const s = table.matStack("p4");
    return allDown(s) ? s.cards[0] : s.cards[s.cards.length - 1];
  },

  verdict() {
    const g = S.g;
    if (g.shown === g.mine) say(`${nameOf(g.mine)[0].toUpperCase()}${nameOf(g.mine).slice(1)}. I laid it down before you turned a single card.`, "win");
    else say(`Mine was ${nameOf(g.mine)}. Somewhere a pile was miscounted. Open the secret and check each pile makes 11.`, "warn");
    S.open = true;
  },

  canShuffle: () => S.g.phase === "shuffle",

  panel() {
    const g = S.g;
    const now = { shuffle: 0, deal: 1, sum: 2, count: 3, counting: 3, shown: 4, done: 5 }[g.phase];
    const list = ["Shuffle", "Four countdown piles", "Add the numbers", "Count that many", "Turn my card over"];

    let body = "";
    if (g.phase === "shuffle") {
      body = `<p class="ct-guide__do">Shuffle the pack, as many times as you like. I am not touching it.</p>
        ${btn("shuffle", "Shuffle", UI.shuffle(15), "c1")} ${btn("shuffled", "I have shuffled", UI.check(15))}`;
    } else if (g.phase === "deal") {
      body = `<p class="ct-guide__do">I have laid one card face down. Now turn cards from the pack onto a pile, <b>counting down from 10</b>: ten, nine, eight …</p>
        <p class="ct-guide__do">When the card says the number you are on, <b>stop</b>, and start the next pile.</p>
        <p class="ct-guide__hint">Ace is 1. Jack, Queen and King are 10. Reach 1 with no match? One more card on top, then tap the pile to turn it face down: that pile is out.</p>`;
    } else if (g.phase === "sum") {
      body = `<p class="ct-guide__do">Add the numbers the piles stopped on. A pile that is out counts nothing.</p>
        <div class="ct-add"><label for="ct-sum">They add up to</label>
          <input id="ct-sum" class="ct-add__in" type="text" inputmode="numeric" autocomplete="off" maxlength="2" />
          ${btn("sum", "Check", UI.check(15))}</div>`;
    } else if (g.phase === "count" || g.phase === "counting") {
      body = g.sum
        ? `<p class="ct-guide__do">${g.states.map((s) => s.match).join(" + ")} = <b>${g.sum}</b>. Count ${g.sum} cards off the pack; the last one is yours.</p>
           ${btn("count", `Count ${g.sum}`, UI.play(15), "c2", g.phase === "counting" ? " disabled" : "")}`
        : `<p class="ct-guide__do">No pile stopped, so there is nothing to count: your card is the very last one you put down.</p>
           ${btn("count", "Show it", UI.play(15), "c2", g.phase === "counting" ? " disabled" : "")}`;
    } else if (g.phase === "shown") {
      body = `<p class="ct-guide__do">You stopped at <b>${nameOf(g.shown)}</b>. Tap my face-down card.</p>`;
    } else {
      body = `<p class="ct-guide__do">${g.shown === g.mine ? "However you shuffle, it comes out. Now find out why, then do it to somebody with a real pack." : "It did not land this time."}</p>
        ${btn("again", "Do it again", UI.again(15))}`;
    }

    const rows = (g.states || []).filter((s) => s.state === "match" || s.state === "dead").map((s) =>
      `<tr><td>${s.id.replace("p", "Pile ")}</td><td>${s.cards}</td><td>${s.match}</td><td><b>${s.cards + s.match}</b></td></tr>`).join("");
    const why = `
      <p>A pile that stops on 7 has four cards in it: ten, nine, eight, seven. Four cards and the number 7 make <b>11</b>.</p>
      <p>Stop on 3 and the pile is eight cards thick: 8 + 3 = <b>11</b>. A pile that is out has eleven cards and counts nothing: <b>11</b> again.</p>
      ${rows ? `<table class="ct-places"><thead><tr><th>Yours</th><th>Cards</th><th>Number</th><th>Together</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
      <p>Four piles, so the cards you turned and the numbers you add come to 4 × 11 = <b>44</b>, every time. Counting the numbers off the pack takes you to the 44th card.</p>
      <p>So I looked at one card only: the 44th, which is the <b>ninth from the bottom</b> of the pack you shuffled. With a real pack, glimpse that card and you can do this to anybody.</p>`;

    return `<h2 class="ct-guide__title">Eleven</h2>
      <p class="ct-guide__lead">Shuffle as much as you like. I will lay a card down, and it will be the one you stop at.</p>
      ${steps(list, now)}
      <div class="ct-guide__now">${body}</div>
      ${secret("The secret: every pile makes 11", why)}`;
  },
};

const GUIDES = { free: FREE, base3: BASE3, eleven: ELEVEN };

/* ── the page around them ─────────────────────────────────────────────────*/

function recalled() {
  try { return JSON.parse(localStorage.getItem(KEEP) || "null") || {}; } catch { return {}; }
}
function remember() {
  try {
    localStorage.setItem(KEEP, JSON.stringify({ trick: S.trick, n: S.g && S.g.kind === "base3" ? S.g.n : recalled().n }));
  } catch { /* a browser that refuses storage still plays perfectly */ }
}

/** Redraw everything that is not a card. */
function sync() {
  const g = guide();
  table.canShuffle = g.canShuffle ? g.canShuffle() : true;
  /* What to do NOW is lifted out of the slip and set beside the table — above
     it on a phone, where the slip is a long way below the cards and a button
     down there would be pressed without seeing what it did. */
  const slip = document.createElement("div");
  slip.innerHTML = g.panel();
  const now = slip.querySelector(".ct-guide__now");
  $("#ct-now").replaceChildren(...(now ? [now] : []));
  $("#ct-guide").replaceChildren(...slip.childNodes);
  $("#ct-turn").setAttribute("aria-pressed", String(table.turn));
  $("#ct-turn").classList.toggle("is-on", table.turn);
  document.querySelectorAll(".ct-tab").forEach((el) => {
    const on = el.dataset.trick === S.trick;
    el.classList.toggle("is-on", on);
    el.setAttribute("aria-pressed", String(on));
  });
}

function begin(trick = S.trick) {
  S.trick = trick;
  S.open = false;
  guide().setup();
  remember();
  sync();
}

function start() {
  $("#ct-paint").innerHTML = heroPaint();
  $("#ct-eyebrow-icon").innerHTML = UI.cards();
  $("#ct-shuffle").innerHTML = `${UI.shuffle(15)}<span>Shuffle</span>`;
  $("#ct-turn").innerHTML = `${UI.refresh(15)}<span>Turn as I deal</span>`;
  $("#ct-again").innerHTML = `${UI.again(15)}<span>Start again</span>`;
  $("#ct-tabs").innerHTML = Object.entries(GUIDES)
    .map(([id, g], i) => `<button type="button" class="pp-sticky pp-note-btn pp-sticky--c${[5, 0, 4][i]} ct-tab" data-trick="${id}">${g.name}</button>`)
    .join("");

  $("#ct-tabs").addEventListener("click", (e) => {
    const el = e.target.closest(".ct-tab");
    if (el && !table.busy) begin(el.dataset.trick);
  });
  $("#ct-shuffle").addEventListener("click", () => table.shuffle());
  $("#ct-turn").addEventListener("click", () => { table.turn = !table.turn; sync(); });
  $("#ct-again").addEventListener("click", () => { if (!table.busy) begin(); });

  const panel = $("#ct-work");
  panel.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled || table.busy) return;
    const act = el.dataset.act;
    if (act === "again") { begin(); return; }
    if (act === "shuffle") { table.shuffle(); return; }
    await guide().act(act, panel);
    sync();
  });
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.id === "ct-sum") $('[data-act="sum"]', panel).click();
  });
  /* the secret stays open, or shut, through every redraw */
  panel.addEventListener("toggle", (e) => { if (e.target.matches(".ct-secret")) S.open = e.target.open; }, true);

  const was = recalled().trick;
  begin(GUIDES[was] ? was : "base3");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
