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
     any number    you think of a number from 10 to 19 and never say it; the
                   card you count to is the one the computer copied first.
                   A number less the sum of its figures is always nine.

   The computer takes its card where you can watch: a card is drawn out of the
   pack, a blue-backed copy is made on top of it, and the card goes back.

   The tricks never move a card to make themselves come true. They read the
   piles on the table and say what they see — so a trick that was gathered
   the wrong way comes out wrong, and the page says where the card really was.
   ========================================================================== */

import { UI } from "/utils/components/ui-icons.js";
import { heroPaint } from "/utils/components/nav-icons.js";
import { ICON_PREPBOT } from "/prep-math/mental-math/shared/icons.js";
import { createTable } from "./table.js";
import { BOT_FINGER } from "./finger.js";
import { fullDeck, nameOf, base3, dealtInTurn, pileState } from "./deck.js";

const $ = (sel, root = document) => root.querySelector(sel);
const wait = (ms) => new Promise((done) => setTimeout(done, ms));
const KEEP = "prep-portal:card-tricks";
const COPY = "copy";   // the computer's own card: a second seven of hearts, from another pack

/* counts: whether the number of cards is written under each pile. Off unless
   asked for — counting the cards is part of doing a trick. */
/* who: who does the magic in the 27-card trick — "me" (the player steers the
   computer's card) or "bot" (the player chooses a card and PrepBot finds it). */
const S = { trick: "base3", who: "me", n: 14, counts: false, open: false, g: null, begun: false, run: 0 };

const table = createTable($("#ct-table"), {
  onChange: (what) => { guide().changed(what); sync(); },
  onRefuse: (what) => { guide().refused(what); },
  onDouble: (stack) => { askHowMany(stack); },
});

const guide = () => (S.trick === "base3" && S.who === "bot" ? BOT27 : GUIDES[S.trick]);
const pause = (ms) => wait(table.still ? 0 : ms);

/* ── the line of talk, written and spoken ─────────────────────────────────
   Whatever is written at the top of the table is SAID, in PrepBot's own
   voice, by the shared teacher (mental-math/shared/prepbot-teacher.js) — the
   same PrepBot, the same voice and the same mute key (V) as everywhere else.
   Its speech bubble is kept shut here: the written line is its words.

   `say` gives back a promise that is kept when the line has been spoken, so
   a run of lines (the set-up of a trick) can wait for each to finish rather
   than talk over itself. A line that is merely a reaction does not wait, and
   a newer line cuts an older one short. */

let teacher = null;

async function mountVoice() {
  try {
    const [{ PrepbotTeacher }, fire] = await Promise.all([
      import("/prep-math/mental-math/shared/prepbot-teacher.js"),
      import("/firebase-init.js").catch(() => ({})),
    ]);
    const root = $("#ct-bot");
    teacher = new PrepbotTeacher({
      root, boundsEl: $("#ct-play"), auth: fire.auth || null,
      menu: { voice: $('[data-b="voice"]', root) },
      /* no chat, no sleeping and no wandering on a card table: only its voice */
      skipKeys: ["a", "m", "t", "s", "w"],
    });
    teacher.toggleBubble(true);
    teacher.onVoiceChange = () => teacher.stop();
  } catch { /* no voice: the line is still written */ }
}

function say(words = "", tone = "") {
  const el = $("#ct-say");
  el.textContent = words;
  el.dataset.tone = tone;
  if (!teacher) return Promise.resolve();
  if (!words || $("#ct-play").hidden) { teacher.stop(); return Promise.resolve(); }
  /* said as it is written, less the marks a voice trips on */
  teacher.speak([{ text: words.replace(/…/g, "").replace(/[()]/g, "").trim(), mode: "speech" }]);
  return Promise.race([teacher.narrationDone.catch(() => {}), wait(table.still ? 0 : 9000)]);
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
 * The computer's card. Which card it chose is its own business and is not
 * shown: a copy of it simply arrives on the table, face down, and stays
 * there until the player lays a card against it.
 */
async function makeCopy(cardId) {
  const run = S.run;
  table.busy = true;
  const stack = table.addStack([COPY], { spot: "copy", tone: "blue", locked: true, face: cardId });
  /* it cannot be moved or turned, but a card can be laid against it */
  stack.accepts = true;
  const el = table.cards.get(COPY).el;
  el.classList.add("is-born");
  await pause(950);
  if (run !== S.run) return null;
  el.classList.remove("is-born");
  table.busy = false;
  return stack;
}

/**
 * THE CONFIRMATION. The player lays the card they have arrived at against
 * the computer's copy; the copy is turned over; they match or they do not.
 * Returns the card that was offered.
 */
async function confirm(what) {
  const run = S.run;
  const card = what.stack.cards[0];
  const copy = table.cards.get(COPY).stack;
  copy.accepts = false;
  table.frozen = true;
  table.point(null);
  glow(null);
  /* the two lie side by side, face down, for a breath — then both are
     turned over together. Neither is seen before the other. */
  await pause(800);
  if (run !== S.run) return null;
  if (!table.cards.get(card).up) table.flip(what.stack, { quiet: true });
  table.flip(copy, { quiet: true });
  await pause(500);
  if (run !== S.run) return null;
  table.frozen = false;
  return card;
}

/** A guide's ending: the offered card is confirmed, then the guide says how it went. */
function settle(g, owner, what) {
  g.phase = "reveal";
  confirm(what).then((card) => {
    if (card === null) return;
    g.shown = card;
    g.phase = "done";
    owner.verdict();
    sync();
  });
}

/* ── dealing several ───────────────────────────────────────────────────────
   Double-tap a pile and a small box opens on it: type a number, and that
   many cards are counted off beside it. */

let asking = null;

function askHowMany(stack) {
  if (stack.cards.length < 2) return;
  const box = $("#ct-ask");
  const input = $("#ct-ask-n");
  const at = table.where(stack);
  const play = $("#ct-play").getBoundingClientRect();
  asking = stack;
  input.value = "";
  input.max = String(stack.cards.length);
  /* how many are in the pile is only said if the count is being shown */
  input.placeholder = S.counts ? `1–${stack.cards.length}` : "how many";
  box.hidden = false;
  box.style.left = `${Math.max(90, Math.min(play.width - 90, at.x - play.left))}px`;
  box.style.top = `${Math.max(60, at.y - play.top)}px`;
  input.focus();
}

function closeAsk() {
  asking = null;
  $("#ct-ask").hidden = true;
}

async function dealAsked() {
  const stack = asking;
  const n = Number($("#ct-ask-n").value);
  closeAsk();
  if (!stack || !table.stacks.includes(stack) || !(n >= 1)) return;
  await table.dealOff(stack, n);
}

/* ── PrepBot's lesson ──────────────────────────────────────────────────────
   The tutorial is PrepBot on its TV, speaking in its own voice, with the
   cards doing on the screen what it is saying. Loaded only when asked for. */

async function watch() {
  /* the TV is put up on the page, which a full-screen table would hide */
  if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
  closeAsk();
  /* one PrepBot speaks at a time: the one on the table gives way to the one on the TV */
  if (teacher) teacher.stop();
  const { openTutorial } = await import("./tutor.js");
  openTutorial(S.trick, S.n);
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
  ${row(UI.move(18), "Drag the gold tab under a pile to carry all of it.")}
  ${row(UI.cards(18), "Double-tap a pile to deal several: type how many.")}
  ${row(UI.shuffle(18), "Riffles the pile you touched last.")}
</ul>`;

/* How big a card is: the smaller of a share of the table's width and of its
   height. The 27-card trick is laid out in ONE row, so its cards can be tall. */
const CARD = { wide: [0.14, 0.3], narrow: [0.27, 0.19] };
const CARD_ROW = { wide: [0.15, 0.36], narrow: [0.29, 0.19] };
const CARD_TWO = { wide: [0.13, 0.255], narrow: [0.235, 0.165] };

/** What the computer points with: PrepBot's own hand (finger.js). */
const POINT = BOT_FINGER;

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
    await say("I have one of these 27 cards in mind…");
    if (run !== S.run) return;
    const copied = say("…and this is a copy of it.");
    await makeCopy(g.mine);
    await copied;
    if (run !== S.run) return;
    say("Deal three piles of nine.");
    g.phase = "pack";
    g.before = table.topFirst(piles()[0]);
  },

  changed(what) {
    const g = S.g;
    if (what && what.type === "offer") {
      if (g.phase === "wait" || g.phase === "done" || g.phase === "reveal") return;
      settle(g, this, what);
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

    let said = say("Nine cards to one side.");
    await pause(500);
    if (gone()) return;
    const nine = table.take(pack, 9, { spot: "nine", tag: "nine" });
    await pause(900);
    await said;
    if (gone()) return;

    /* which of the nine is nobody's business: it goes to the top of them
       without being shown, and only its copy is seen */
    g.mine = nine.cards[Math.floor(Math.random() * 9)];
    table.send(g.mine, "nine");
    said = say("My card is one of these nine. This is a copy of it.");
    await makeCopy(g.mine);
    if (gone()) return;
    await pause(700);
    await said;
    if (gone()) return;

    said = say("Now the other 43 are shuffled.");
    table.canShuffle = true;
    await table.shuffle(pack);
    await said;
    if (gone()) return;

    said = say("Cut into seven…");
    const packets = [];
    const sizes = sevenCuts();
    for (let i = 0; i < 7; i++) {
      packets.push(table.take(table.tagged("pack"), sizes[i], { spot: `k${i}` }));
      await pause(170);
      if (gone()) return;
    }
    await pause(600);
    await said;
    if (gone()) return;

    said = say("…and stacked on the nine, in any order.");
    for (const packet of mixed(packets)) {
      await table.stackOnto(packet, nine);
      if (gone()) return;
    }
    nine.tag = "pack";
    table.moveTo(nine, "pack");
    await pause(500);
    await said;
    if (gone()) return;

    table.frozen = false;
    g.phase = "deal";
    say("My card is in there. Over to you.");
  },

  /** The piles the player laid out, oldest first — read only once it is over, for the secret. */
  read() {
    return piles().filter((s) => !s.tag).sort((a, b) => a.id - b.id).slice(0, 4).map((s) => {
      const n = s.cards.length;
      if (allDown(s) && n === 11) return { state: "dead", match: 0, cards: n };
      if (!allUp(s)) return { state: "down", match: 0, cards: n };
      return { cards: n, ...pileState(s.cards) };
    });
  },

  /* The counting down and the adding up are the player's to do: nothing is
     written under the piles and nothing is said about them. The only thing
     listened for is a card laid against the copy. */
  changed(what) {
    const g = S.g;
    if (!what || what.type !== "offer" || g.phase !== "deal") return;
    g.states = this.read();
    settle(g, this, what);
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
    const now = { wait: 0, staging: 0, deal: 1, done: 5 }[g.phase];
    const rows = (g.phase === "done" ? g.states : []).filter((p) => p.state === "match" || p.state === "dead").map((p, i) =>
      `<tr><td>${i + 1}</td><td>${p.cards}</td><td>${p.match}</td><td><b>${p.cards + p.match}</b></td></tr>`).join("");
    const why = `
      <p>My card lies on top of nine cards, with the other 43 over it. However those 43 are shuffled, it is the <b>44th</b> card from the top.</p>
      <p>A pile that stops on 7 has four cards: ten, nine, eight, seven. Four cards and the number 7 make <b>11</b>.</p>
      <p>Stop on 3 and it is eight cards thick: 8 + 3 = <b>11</b>. A pile that is out has eleven cards and counts 0: <b>11</b> again.</p>
      ${rows ? `<table class="ct-places"><thead><tr><th>Pile</th><th>Cards</th><th>Number</th><th>Together</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
      <p>Four piles: cards turned plus numbers added is 4 × 11 = <b>44</b>, every time. So counting the numbers off the pack always ends on the 44th card.</p>
      <p>With a real pack: glimpse the <b>ninth card from the bottom</b>, let anyone shuffle the rest, and you can do this to them.</p>`;

    return `<p class="ct-lead">I hide one card in the pack, in front of you. The counting down and the adding up are yours to do. Find it.</p>
      ${steps([
        [UI.shuffle(18), "Watch: nine cards aside with mine on top of them, the other 43 shuffled, cut in seven and stacked over it"],
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

/* ══ ANY NUMBER ═══════════════════════════════════════════════════════════
   The player thinks of a number from 10 to 19 and never says it. They deal
   that many cards into a pile, add the two figures of their number, and deal
   that many off the pile. The card they land on is the one the computer
   copied before they had thought of anything.

   Dealing a pile turns it upside down. The computer's card is the TENTH
   from the top, so in a pile of n cards it lies n − 9 from the top. And the
   figures of a number from 10 to 19 add up to 1 + (n − 10): n − 9 again.
   The number cancels itself out. */

const ANY_SPOTS = {
  wide: [{ id: "pack", x: 0.2, y: 0.53 }, { id: "copy", x: 0.84, y: 0.53 }],
  narrow: [{ id: "pack", x: 0.26, y: 0.26 }, { id: "copy", x: 0.74, y: 0.26 }],
};

const ANY = {
  name: "Any number",
  blurb: "Think of a number. I already know the card.",
  setup() {
    S.g = { kind: "any", phase: "wait", mine: null, shown: null };
    table.setup({ spots: ANY_SPOTS, card: CARD });
    table.addStack(mixed(fullDeck()), { spot: "pack" });
    /* dealt face down, as the trick is done: the card is only seen at the end */
    table.turn = false;
    say("");
  },

  async intro() {
    const g = S.g;
    const run = S.run;
    const gone = () => run !== S.run;
    g.phase = "staging";
    table.frozen = true;
    const pack = table.tagged("pack");

    let said = say("First the pack is shuffled.");
    table.canShuffle = true;
    await table.shuffle(pack);
    await said;
    if (gone()) return;

    /* the only card looked at: the tenth from the top */
    g.mine = table.topFirst(pack)[9];
    said = say("I have one card in mind. This is a copy of it.");
    await makeCopy(g.mine);
    await said;
    if (gone()) return;

    table.frozen = false;
    g.phase = "play";
    await say("Think of any number from ten to nineteen. Do not tell me.");
    if (gone()) return;
    say("Deal that many cards into a pile. Then add its two figures, and deal that many off the pile.");
  },

  /* Nothing is counted for the player and nothing is checked on the way:
     the only thing listened for is a card laid against the copy. */
  changed(what) {
    const g = S.g;
    if (!what || what.type !== "offer" || g.phase !== "play") return;
    settle(g, this, what);
  },

  refused(what) {
    if (what.why === "shuffle") say("No shuffling now. My card is in its place.", "warn");
    else if (what.why === "one") say("One card only: the one you think is mine.", "warn");
    else if (S.g.phase !== "done") say("Mine stays face down. Drag the card you think it is onto it.", "warn");
  },

  act() {},

  verdict() {
    const g = S.g;
    if (g.shown === g.mine) say(`${Name(g.mine)}. A match: you win. And I never knew your number.`, "win");
    else say(`No match. Mine was ${nameOf(g.mine)}. Deal the cards one at a time, and count again.`, "warn");
    S.open = true;
    $("#ct-help").classList.add("is-nudge");
  },

  canShuffle: () => S.g.phase === "staging",

  dock() {
    return S.g.phase === "done" ? key("again", UI.again(20), "Do it again") : "";
  },

  guide() {
    const g = S.g;
    const now = { wait: 0, staging: 0, play: 1, done: 5 }[g.phase];
    const why = `
      <p>My card is the <b>tenth</b> from the top of the pack. Nine cards lie on it.</p>
      <p>Dealing cards one at a time into a pile turns them <b>upside down</b>: the first card dealt ends at the bottom, the last on top.</p>
      <p>Deal ten, and my card is the last one down: it is on <b>top</b>. Deal eleven, and one card covers it: it is <b>second</b>. Twelve: <b>third</b>. Every card past ten puts one more on top of mine.</p>
      <table class="ct-places">
        <thead><tr><th>You deal</th><th>Mine is</th><th>Figures add to</th></tr></thead>
        <tbody>
          <tr><td>10</td><td>1st</td><td>1 + 0 = <b>1</b></td></tr>
          <tr><td>11</td><td>2nd</td><td>1 + 1 = <b>2</b></td></tr>
          <tr><td>14</td><td>5th</td><td>1 + 4 = <b>5</b></td></tr>
          <tr><td>19</td><td>10th</td><td>1 + 9 = <b>10</b></td></tr>
        </tbody>
      </table>
      <p>The figures of your number climb exactly as my card sinks. Whatever you choose, the two meet. Take the figures of a number from 10 to 19 away from the number itself and you always get <b>9</b>.</p>
      <p>With a real pack: peek at the tenth card from the top, and you can do this to anybody.</p>`;

    return `<p class="ct-lead">Think of a number and keep it to yourself. The card you count your way to is one I copied before you had thought of anything.</p>
      ${steps([
        [UI.shuffle(18), "Watch: the pack is shuffled, and I lay down a copy of one card"],
        [UI.bulb(18), "Think of any number from 10 to 19. Do not say it"],
        [UI.cards(18), "Deal that many cards off the pack into a pile, one at a time"],
        [UI.plus(18), "Add the two figures of your number, and deal that many off your new pile"],
        [UI.layers(18), "Drag the last card you dealt onto my card. If they match, you win"],
      ], now)}
      <p class="ct-hint">Fourteen? Deal 14 cards. Then 1 + 4 = 5, so deal 5 off that pile. To deal several at once, double-tap a pile and type how many.</p>
      ${secret("The secret: your number cancels itself", why)}
      ${HANDS}`;
  },
};

/* ══ PREPBOT FINDS IT ═════════════════════════════════════════════════════
   The other way round. The player chooses a card — and can see a copy of
   it, face up, the whole time — and PREPBOT does the magic.

   PrepBot plays fair. It is told which card was chosen only so that the
   copy can be made and the ending checked; what it DOES is decided by what
   a magician would know and nothing else: in the 27-card trick, which pile
   the player says the card is in; in the four-card trick, that the card
   began at the bottom. Point to the wrong pile and PrepBot finds the wrong
   card, as a magician would. */

/** The player's own card, copied face up where they can always see it. */
async function showCopy(cardId) {
  const run = S.run;
  table.addStack([COPY], { spot: "copy", tone: "blue", locked: true, face: cardId, up: true });
  const el = table.cards.get(COPY).el;
  el.classList.add("is-born");
  await pause(950);
  if (run === S.run) el.classList.remove("is-born");
}

/* ── 27 cards, PrepBot the magician ───────────────────────────────────────
   The piles are dealt as COLUMNS, every card showing, so the player can
   find their card in them. */

const BOT_SPOTS = {
  wide: [
    { id: "pack", x: 0.1, y: 0.3 }, { id: "copy", x: 0.1, y: 0.72 },
    { id: "a", x: 0.36, y: 0.26 }, { id: "b", x: 0.56, y: 0.26 }, { id: "c", x: 0.76, y: 0.26 },
    { id: "off", x: 0.4, y: 0.5 }, { id: "show", x: 0.64, y: 0.5 },
  ],
  narrow: [
    { id: "pack", x: 0.2, y: 0.22 }, { id: "copy", x: 0.8, y: 0.22 },
    { id: "a", x: 0.18, y: 0.42 }, { id: "b", x: 0.5, y: 0.42 }, { id: "c", x: 0.82, y: 0.42 },
    { id: "off", x: 0.3, y: 0.58 }, { id: "show", x: 0.7, y: 0.58 },
  ],
};
const FAN = 0.2;   // how much of each card shows in a column

const BOT27 = {
  name: "27 cards",
  blurb: "Choose a card. PrepBot finds it.",
  setup() {
    S.g = { kind: "bot27", n: S.n, phase: "wait", round: 0, mine: null, told: [], shown: null };
    table.setup({ spots: BOT_SPOTS, card: { wide: [0.12, 0.214], narrow: [0.25, 0.17] } });
    table.addStack(mixed(fullDeck()).slice(0, 27), { spot: "pack" });
    table.turn = false;
    table.frozen = true;
    say("");
  },

  async intro() {
    const g = S.g;
    const run = S.run;
    await say("I deal twenty seven cards into three piles.");
    if (run !== S.run) return;
    await this.dealOut();
    if (run !== S.run) return;
    g.phase = "choose";
    table.pick = (id, stack) => this.picked(id, stack);
    say(`Choose any card you like, and tap it. I will put it at place ${g.n}.`);
  },

  /** All 27 off the pack, one to each pile in turn, face up, in columns. */
  async dealOut() {
    await table.deal(table.tagged("pack"), ["a", "b", "c"], { turn: true, fan: FAN, gap: 95 });
  },

  async picked(id, stack) {
    const g = S.g;
    const run = S.run;
    if (!["a", "b", "c"].includes(stack.mat)) return;
    table.pick = null;
    if (g.phase === "choose") {
      g.mine = id;
      const told = say("That is your card. Here is a copy of it. Now all I need to know is which pile it is in.");
      await showCopy(id);
      await told;
      if (run !== S.run) return;
    } else if (g.phase !== "which") return;
    await this.gather(stack);
  },

  /* The steering: so many piles on top of the one the player pointed to. */
  async gather(pile) {
    const g = S.g;
    const run = S.run;
    const gone = () => run !== S.run;
    g.phase = "gather";
    g.told.push(pile.cards.includes(g.mine));
    const k = base3(g.n)[g.round];
    const others = ["a", "b", "c"].map((id) => table.spotStack(id)).filter((s) => s !== pile);
    const order = others.slice();
    order.splice(k, 0, pile);          // from the top of the pack downward

    const said = say(["I pick the piles up.", "I pick them up again.", "And once more."][g.round]);
    /* squared up and turned face down, one pile at a time */
    for (const s of [pile, ...others]) {
      s.fan = 0;
      table.layout();
      await pause(260);
      if (gone()) return;
      table.flip(s, { quiet: true });
      await pause(320);
      if (gone()) return;
    }
    const base = order[2];
    table.slide(base, "pack");
    await pause(420);
    if (gone()) return;
    await table.stackOnto(order[1], base);
    if (gone()) return;
    await table.stackOnto(order[0], base);
    if (gone()) return;
    base.tag = "pack";
    await said;
    if (gone()) return;

    g.round += 1;
    if (g.round < 3) {
      await say(g.round === 1 ? "I deal them again." : "And a third time.");
      if (gone()) return;
      await this.dealOut();
      if (gone()) return;
      g.phase = "which";
      table.pick = (id, stack) => this.picked(id, stack);
      say("Which pile is your card in now? Tap it.");
      sync();
      return;
    }
    await this.reveal();
  },

  async reveal() {
    const g = S.g;
    const run = S.run;
    const gone = () => run !== S.run;
    g.phase = "count";
    sync();
    const pack = table.tagged("pack");
    const said = say(`You asked for place ${g.n}. Count with me.`);
    for (let i = 1; i < g.n; i++) {
      table.send(pack.cards[pack.cards.length - 1], "off");
      await pause(210);
      if (gone()) return;
    }
    await said;
    if (gone()) return;
    g.shown = pack.cards[pack.cards.length - 1];
    table.send(g.shown, "show", { up: true });
    await pause(700);
    if (gone()) return;
    table.frozen = false;
    g.phase = "done";
    if (g.shown === g.mine) say(`Card ${g.n}: ${nameOf(g.shown)}. Your card, exactly where you asked for it.`, "win");
    else say(`Card ${g.n} is ${nameOf(g.shown)}. That is not your card. I was pointed to a pile it was not in.`, "warn");
    S.open = true;
    $("#ct-help").classList.add("is-nudge");
    sync();
  },

  changed() {},
  refused() { if (S.g.phase !== "done") say("That is the copy of your card. It stays where you can see it."); },
  act() {},
  canShuffle: () => false,
  dock() { return S.g.phase === "done" ? key("again", UI.again(20), "Do it again") : ""; },

  guide() {
    const g = S.g;
    const [ones, threes, nines] = base3(g.n);
    const now = g.phase === "done" || g.phase === "count" ? 4 : g.phase === "wait" || g.phase === "choose" ? 0 : 1 + g.round;
    const m = g.n - 1;
    const why = `
      <p>I never look for your card. All I use is <b>which pile</b> you point to, three times.</p>
      <p>Each time I pick the piles up, I choose how many of them go <b>on top of yours</b>: 0, 1 or 2. For place ${g.n}, I take 1 away and write what is left in nines, threes and ones.</p>
      <p class="ct-sum">${g.n} − 1 = ${m} = ${nines} × 9 + ${threes} × 3 + ${ones} × 1</p>
      <table class="ct-places">
        <thead><tr><th>Pick-up</th><th>Place</th><th>Piles I put on yours</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>ones</td><td><b>${ones}</b></td></tr>
          <tr><td>2</td><td>threes</td><td><b>${threes}</b></td></tr>
          <tr><td>3</td><td>nines</td><td><b>${nines}</b></td></tr>
        </tbody>
      </table>
      <p>Dealing into three shrinks nine places into three; picking up adds whole piles of nine on top. Three deals later your card can only be at place ${g.n}.</p>
      <p class="ct-hint">Want to be the magician? Choose "I do the magic" in the settings.</p>`;
    return `<p class="ct-lead">You choose a card and a place. PrepBot puts your card at that place without ever being shown where it is.</p>
      ${steps([
        [UI.hand(18), "Tap any card you like. A copy of it stays face up for you"],
        [UI.cards(18), "PrepBot picks the piles up and deals again. Tap the pile your card is in"],
        [UI.cards(18), "And again: tap the pile your card is in"],
        [UI.layers(18), "PrepBot picks them up one last time"],
        [UI.play(18), `PrepBot counts to card ${g.n}. It is yours`],
      ], now)}
      ${secret("The secret: counting in threes", why)}`;
  },
};

/* ── The odd one out (Bob Hummer's four-card trick) ───────────────────────
   Four cards. The player's goes to the bottom, the top card to the bottom,
   the new top card is turned face up — and then the PLAYER mixes them:
   cut anywhere, turn the top two over together, as often as they like.
   Three small moves at the end, and one card faces the other way from the
   rest. It is always theirs. (deck.js proves it for every mix.) */

const ODD_SPOTS = {
  wide: [0, 1, 2, 3].map((i) => ({ id: `h${i}`, x: 0.12 + i * 0.15, y: 0.55 })).concat([{ id: "copy", x: 0.9, y: 0.55 }, { id: "win", x: 0.745, y: 0.55 }]),
  narrow: [0, 1, 2, 3].map((i) => ({ id: `h${i}`, x: 0.14 + i * 0.24, y: 0.62 })).concat([{ id: "copy", x: 0.74, y: 0.27 }, { id: "win", x: 0.3, y: 0.27 }]),
};

const ODD = {
  name: "The odd one out",
  blurb: "Mix them any way. PrepBot still finds yours.",
  setup() {
    const four = mixed(fullDeck()).slice(0, 4);
    S.g = { kind: "odd", phase: "wait", row: four.slice(), mine: null, moves: 0, shown: null };
    table.setup({ spots: ODD_SPOTS, card: { wide: [0.13, 0.32], narrow: [0.22, 0.19] } });
    four.forEach((id, i) => table.addStack([id], { spot: `h${i}`, up: true }));
    table.turn = false;
    table.frozen = true;
    say("");
  },

  /* the packet is a row: the left end is the top */
  at(i) { return table.cards.get(S.g.row[i]).stack; },
  lay() {
    S.g.row.forEach((id, i) => {
      const s = table.cards.get(id).stack;
      table.slide(s, `h${i}`);
      table.setNote(s, i === 0 ? "top" : i === 3 ? "bottom" : "");
    });
  },
  async cut(k) {
    const g = S.g;
    if (!k) return;
    g.row = g.row.slice(k).concat(g.row.slice(0, k));
    this.lay();
    await pause(520);
  },
  async turnTop() { table.flip(this.at(0), { quiet: true }); await pause(480); },
  /** The top two, turned over together: each shows its other side, and they change places. */
  async turnTwo() {
    const g = S.g;
    table.flip(this.at(0), { quiet: true });
    table.flip(this.at(1), { quiet: true });
    [g.row[0], g.row[1]] = [g.row[1], g.row[0]];
    this.lay();
    await pause(560);
  },

  async intro() {
    const g = S.g;
    this.lay();
    g.phase = "choose";
    table.pick = (id) => this.picked(id);
    say("Four cards. Choose one, and tap it.");
  },

  async picked(id) {
    const g = S.g;
    const run = S.run;
    const gone = () => run !== S.run;
    if (g.phase !== "choose") return;
    table.pick = null;
    g.phase = "start";
    g.mine = id;
    let said = say("That is your card. Here is a copy of it, so you cannot forget it.");
    await showCopy(id);
    await said;
    if (gone()) return;

    said = say("All four are turned face down, and your card goes to the bottom of the packet.");
    for (let i = 0; i < 4; i++) { table.flip(this.at(i), { quiet: true }); await pause(160); }
    if (gone()) return;
    g.row = g.row.filter((c) => c !== id).concat(id);
    this.lay();
    await pause(600);
    await said;
    if (gone()) return;

    said = say("The top card goes to the bottom.");
    await this.cut(1);
    await said;
    if (gone()) return;
    said = say("And the new top card is turned face up.");
    await this.turnTop();
    await said;
    if (gone()) return;

    g.phase = "mix";
    sync();
    say("Now you mix them. Choose where I cut. Each time, I turn the top two over together.");
  },

  async act(act) {
    const g = S.g;
    const run = S.run;
    const gone = () => run !== S.run;
    if (g.phase !== "mix") return;
    if (/^cut[123]$/.test(act)) {
      const k = Number(act.slice(3));
      g.phase = "moving";
      sync();
      const said = say(`Cut ${SAY_N[k]}, and the top two turned over together.`);
      await this.cut(k);
      if (gone()) return;
      await this.turnTwo();
      await said;
      if (gone()) return;
      g.moves += 1;
      g.phase = "mix";
      say(g.moves < 2 ? "Again? Or press the tick when you have mixed enough." : "As often as you like. Press the tick when you are done.");
      return;
    }
    if (act !== "done") return;

    g.phase = "finish";
    sync();
    let said = say("Three small moves to finish. The top card is turned over, and goes to the bottom.");
    await this.turnTop();
    await this.cut(1);
    await said;
    if (gone()) return;
    said = say("The next card goes to the bottom.");
    await this.cut(1);
    await said;
    if (gone()) return;
    said = say("And the top card is turned over.");
    await this.turnTop();
    await said;
    if (gone()) return;

    /* read off the table, not remembered: which card faces the other way? */
    const ups = g.row.map((c) => table.cards.get(c).up);
    const count = ups.filter(Boolean).length;
    const odd = count === 1 ? g.row[ups.indexOf(true)] : count === 3 ? g.row[ups.indexOf(false)] : null;
    await say("Look at them. Three cards face one way. One card faces the other way.");
    if (gone()) return;
    g.phase = "done";
    table.frozen = false;
    if (!odd) { say("They did not come out one against three. Something went wrong with my moves.", "warn"); sync(); return; }
    const s = table.cards.get(odd).stack;
    table.clearNotes();
    table.slide(s, "win");
    if (!table.cards.get(odd).up) { await pause(500); table.flip(s, { quiet: true }); }
    g.shown = odd;
    await pause(500);
    if (odd === g.mine) say(`${Name(odd)}. The odd one out is your card.`, "win");
    else say(`The odd one is ${nameOf(odd)}. That is not your card.`, "warn");
    S.open = true;
    $("#ct-help").classList.add("is-nudge");
    sync();
  },

  changed() {},
  refused() { if (S.g.phase !== "done") say("That is the copy of your card. It stays where you can see it."); },
  canShuffle: () => false,

  dock() {
    const g = S.g;
    if (g.phase === "mix") {
      return [1, 2, 3].map((k) => key(`cut${k}`, UI.layers(20), `Cut ${k} card${k === 1 ? "" : "s"} to the bottom, then turn the top two over`, { text: String(k), tone: `c${k}` })).join("")
        + key("done", UI.check(20), "I have mixed them enough", { tone: "c2" });
    }
    return g.phase === "done" ? key("again", UI.again(20), "Do it again") : "";
  },

  guide() {
    const g = S.g;
    const now = { wait: 0, choose: 0, start: 1, mix: 2, moving: 2, finish: 3, done: 5 }[g.phase];
    const why = `
      <p>Think of the four places in the packet as <b>blue, pink, blue, pink</b>. Pretend a card on a pink place always says the opposite of what it shows.</p>
      <p>After my first two moves, three cards "say" the same thing and yours says the opposite. Yours is already the odd one out; you just cannot see it yet.</p>
      <p><b>Turning the top two over together</b> flips both cards and swaps their colours. Two changes cancel: each card still says what it said.</p>
      <p><b>Cutting</b> moves every card along. Cut an odd number and every card changes colour, so every card changes what it says, all together. Yours is still the one that disagrees.</p>
      <p>So no mix can ever change which card is the odd one. My last three moves turn the pretending into real turning, and there it is.</p>
      <p class="ct-hint">This is Bob Hummer's trick, from the 1940s. With real cards: let a friend look at the bottom card of four, and do exactly these moves.</p>`;
    return `<p class="ct-lead">Four cards, and you do the mixing. However you mix them, one card ends up facing the other way: yours.</p>
      ${steps([
        [UI.hand(18), "Tap the card you want. A copy of it stays face up for you"],
        [UI.refresh(18), "PrepBot turns them face down, puts yours at the bottom, moves one card and turns one up"],
        [UI.layers(18), "You mix: press 1, 2 or 3 to cut there. Each time the top two are turned over together"],
        [UI.check(18), "Press the tick when you have mixed enough"],
        [UI.bulb(18), "One card faces the other way. It is yours"],
      ], now)}
      ${secret("The secret: one card always disagrees", why)}`;
  },
};

const SAY_N = ["nought", "one", "two", "three"];

/* ── The final three, two ways ────────────────────────────────────────────
   The player chooses three cards. They are buried in the pack, the pack is
   dealt UP, DOWN, UP, DOWN — every face-up card out, the face-down ones
   dealt again — and when three cards are left, they are the player's three.

   THREE PILES (33 cards). Three piles of ten; three cards come off the top
   of each and are put aside; one chosen card goes on each pile of seven; the
   piles are stacked and the nine go on top. The cards lie at places 10, 18
   and 26. Four are dealt OFF: 6, 14, 22 of 29 — all even places, and the
   up-down deal keeps the even places. 29 → 14 → 7 → 3.

   THE WHOLE PACK (52 cards). Piles of 10, 15, 15 and 9. A card on the ten;
   the player cuts ANY number off the second pile onto it; a card on what is
   left; ANY number off the third pile onto that; a card on what is left;
   the nine on top; stack. Wherever the cuts were made the cards lie at 10,
   26 and 42, because whatever is cut off one pile is still between the same
   two cards. Four go from the top to the BOTTOM: 6, 22, 38 of 52.
   52 → 26 → 13 → 6 → 3.

   Both are proved in the test for every choice the player has. */

const F3_SPOTS = {
  wide: [
    { id: "pack", x: 0.08, y: 0.27 }, { id: "a", x: 0.24, y: 0.27 }, { id: "b", x: 0.38, y: 0.27 }, { id: "c", x: 0.52, y: 0.27 },
    { id: "nine", x: 0.68, y: 0.27 }, { id: "out", x: 0.86, y: 0.27 },
    { id: "row1", x: 0.08, y: 0.6 }, { id: "row2", x: 0.08, y: 0.84 },
    { id: "rest", x: 0.08, y: 0.74 }, { id: "keep", x: 0.26, y: 0.74 }, { id: "up", x: 0.42, y: 0.74 },
    ...[0, 1, 2].map((i) => ({ id: `k${i}`, x: 0.6 + i * 0.13, y: 0.79 })),
    ...[0, 1, 2].map((i) => ({ id: `r${i}`, x: 0.6 + i * 0.13, y: 0.54 })),
  ],
  narrow: [
    { id: "pack", x: 0.12, y: 0.2 }, { id: "a", x: 0.34, y: 0.2 }, { id: "b", x: 0.56, y: 0.2 }, { id: "c", x: 0.78, y: 0.2 },
    { id: "nine", x: 0.22, y: 0.345 }, { id: "out", x: 0.5, y: 0.345 }, { id: "rest", x: 0.78, y: 0.345 },
    /* the rows to choose from, the cards waiting and the copies each have a band of their own */
    { id: "row1", x: 0.13, y: 0.49 }, { id: "row2", x: 0.13, y: 0.635 },
    { id: "keep", x: 0.25, y: 0.49 }, { id: "up", x: 0.6, y: 0.49 },
    ...[0, 1, 2].map((i) => ({ id: `k${i}`, x: 0.2 + i * 0.3, y: 0.895 })),
    ...[0, 1, 2].map((i) => ({ id: `r${i}`, x: 0.2 + i * 0.3, y: 0.765 })),
  ],
};
const COPIES = ["copy", "copy1", "copy2"];

/** Two piles opened out face up, to choose from. */
function openRows(a, b) {
  [[a, "row1"], [b, "row2"]].forEach(([s, spot]) => { s.tag = "row"; s.fanX = 0.3; table.slide(s, spot); table.flip(s, { quiet: true }); });
  table.layout();
}

function finalThree(whole) {
  return {
    name: whole ? "The final three: the whole pack" : "The final three: three piles",
    blurb: "Choose three cards. PrepBot deals until only they are left.",

    setup() {
      S.g = { kind: whole ? "final3b" : "final3", phase: "wait", mine: [], left: [], cut: 0 };
      table.setup({ spots: F3_SPOTS, card: { wide: [0.095, 0.2], narrow: [0.2, 0.13] } });
      table.addStack(mixed(fullDeck()), { spot: "pack" });
      table.turn = false;
      table.frozen = true;
      say("");
    },

    async intro() {
      const g = S.g;
      const run = S.run;
      const gone = () => run !== S.run;
      const pack = table.tagged("pack");

      if (!whole) {
        let said = say("I deal three piles of ten cards.");
        await table.deal(table.take(pack, 30, { tag: "thirty" }), ["a", "b", "c"], { turn: false, gap: 70 });
        await said;
        if (gone()) return;
        said = say("From the top of each pile I take three cards, and put them to one side. That makes nine.");
        let nine = null;
        for (const id of ["a", "b", "c"]) {
          const three = table.take(table.spotStack(id), 3, { spot: "nine" });
          if (!nine) { nine = three; nine.tag = "nine"; await pause(450); } else { three.mat = null; await table.stackOnto(three, nine); }
          if (gone()) return;
        }
        await said;
        if (gone()) return;
        /* the rest of the pack, opened out to choose from */
        openRows(pack, table.take(pack, 11));
        g.phase = "choose";
        table.pick = (id, stack) => this.picked(id, stack);
        sync();
        say("Here is the rest of the pack. Choose any three cards, and tap them.");
        return;
      }

      /* the whole pack: the choosing comes first */
      openRows(table.take(pack, 11), table.take(pack, 11));
      g.phase = "choose";
      table.pick = (id, stack) => this.picked(id, stack);
      sync();
      say("Here are some of the cards. Choose any three, and tap them.");
    },

    async picked(id, stack) {
      const g = S.g;
      const run = S.run;
      if (g.phase !== "choose" || stack.tag !== "row" || g.busyPick) return;
      g.busyPick = true;
      const i = g.mine.length;
      g.mine.push(id);
      /* a copy of it, face up, for the player to keep an eye on */
      table.addStack([COPIES[i]], { spot: `k${i}`, tone: "blue", locked: true, face: id, up: true });
      const el = table.cards.get(COPIES[i]).el;
      el.classList.add("is-born");
      if (whole) {
        /* it waits, face down, above its copy until the piles are made */
        table.send(id, `r${i}`, { up: false });
        say(["One.", "Two.", "Three."][i]);
      } else {
        table.send(id, ["a", "b", "c"][i], { up: false });
        say(["One. It goes face down on the first pile.", "Two. On the second pile.", "Three. On the third pile."][i]);
      }
      await pause(900);
      if (run !== S.run) return;
      el.classList.remove("is-born");
      g.busyPick = false;
      if (g.mine.length < 3) return;
      table.pick = null;
      g.phase = "stack";
      sync();
      if (whole) await this.pilesOfWholePack(); else await this.stackThreePiles();
    },

    /* ── three piles: stacked, the nine on top, four dealt off ────────────*/
    async stackThreePiles() {
      const run = S.run;
      const gone = () => run !== S.run;
      const rows = table.stacks.filter((s) => s.tag === "row");
      rows.forEach((s) => { s.fanX = 0; table.flip(s, { quiet: true }); });
      table.slide(rows[0], "rest");
      if (rows[1]) await table.stackOnto(rows[1], rows[0]);
      rows[0].tag = "rest";
      if (gone()) return;

      let said = say("Your three cards are on the three piles. Now I put the piles together, one on another.");
      const [a, b, c] = ["a", "b", "c"].map((id) => table.spotStack(id));
      await table.stackOnto(b, c);
      if (gone()) return;
      await table.stackOnto(a, c);
      await said;
      if (gone()) return;
      said = say("And the nine cards go on top.");
      await table.stackOnto(table.tagged("nine"), c);
      c.tag = "pack";
      table.slide(c, "pack");
      await pause(500);
      await said;
      if (gone()) return;

      said = say("Four cards off the top. One, two, three, four. They are out.");
      for (let i = 0; i < 4; i++) { table.send(c.cards[c.cards.length - 1], "out"); await pause(330); if (gone()) return; }
      await said;
      if (gone()) return;
      await this.upDown(c);
    },

    /* ── the whole pack: 10, 15, 15 and 9, and the player cuts ────────────*/
    async pilesOfWholePack() {
      const g = S.g;
      const run = S.run;
      const gone = () => run !== S.run;
      /* the cards not chosen go back on the pack: 49 */
      const pack = table.tagged("pack");
      for (const s of table.stacks.filter((x) => x.tag === "row")) {
        s.fanX = 0;
        table.flip(s, { quiet: true });
        await table.stackOnto(s, pack);
        if (gone()) return;
      }
      const said = say("Now four piles. Ten cards. Fifteen. Fifteen. And the nine that are left.");
      table.take(pack, 10, { spot: "a" });
      await pause(650);
      table.take(pack, 15, { spot: "b" });
      await pause(650);
      table.take(pack, 15, { spot: "c" });
      await pause(650);
      if (gone()) return;
      pack.tag = "nine";
      table.slide(pack, "nine");
      await said;
      if (gone()) return;

      await say("Your first card goes on the pile of ten.");
      if (gone()) return;
      table.send(g.mine[0], "a", { up: false });
      await pause(600);
      if (gone()) return;
      g.phase = "cut";
      g.cut = 1;
      sync();
      say("Now bury it. How many cards shall I cut off the second pile? Any number from 1 to 14.");
    },

    async act(act, root) {
      const g = S.g;
      const run = S.run;
      const gone = () => run !== S.run;
      if (act !== "cut" || g.phase !== "cut") return;
      const n = Math.floor(Number($("#ct-cut", root).value));
      if (!(n >= 1 && n <= 14)) { say("Any number from 1 to 14.", "warn"); return; }
      g.phase = "stack";
      sync();
      const [a, b, c] = ["a", "b", "c"].map((id) => table.spotStack(id));
      if (g.cut === 1) {
        let said = say(`${n} card${n === 1 ? "" : "s"} off the second pile, onto your card.`);
        await table.stackOnto(table.take(b, n), a);
        await said;
        if (gone()) return;
        said = say("Your second card goes on what is left of the second pile.");
        table.send(g.mine[1], "b", { up: false });
        await pause(600);
        await said;
        if (gone()) return;
        g.phase = "cut";
        g.cut = 2;
        sync();
        say("And how many shall I cut off the third pile, to bury that one? Any number from 1 to 14.");
        return;
      }
      let said = say(`${n} card${n === 1 ? "" : "s"} off the third pile, onto your second card.`);
      await table.stackOnto(table.take(c, n), b);
      await said;
      if (gone()) return;
      said = say("Your third card goes on what is left of the third pile. And the nine cards go on top of it.");
      table.send(g.mine[2], "c", { up: false });
      await pause(600);
      await table.stackOnto(table.tagged("nine"), c);
      await said;
      if (gone()) return;
      said = say("Now the piles are put together into one pack.");
      await table.stackOnto(b, a);
      if (gone()) return;
      await table.stackOnto(c, a);
      a.tag = "pack";
      table.slide(a, "pack");
      await pause(500);
      await said;
      if (gone()) return;

      /* four from the top to the bottom: lifted off together, and the pack set down on them */
      said = say("Four cards go from the top to the bottom.");
      const four = table.take(a, 4, { spot: "nine" });
      await pause(700);
      if (gone()) return;
      await table.stackOnto(a, four);
      four.tag = "pack";
      table.slide(four, "pack");
      await pause(500);
      await said;
      if (gone()) return;
      await this.upDown(four);
    },

    /* ── UP, DOWN: the face-up ones are out; the face-down ones are dealt again ─*/
    async upDown(pack) {
      const g = S.g;
      const run = S.run;
      const gone = () => run !== S.run;
      g.phase = "deal";
      sync();
      let hand = pack;
      for (let pass = 0; hand.cards.length > 3; pass++) {
        const said = say(["Now I deal them: one face up, one face down. Up, down, up, down. Every face-up card is out.",
          "The face-down cards are picked up, and dealt the same way. Up, down, up, down.",
          "And again with the ones that are left. Up, down, up, down.",
          "And one last time."][Math.min(pass, 3)]);
        await pause(900);
        const quick = hand.cards.length > 30 ? 130 : hand.cards.length > 16 ? 200 : 300;
        for (let i = 0; hand.cards.length; i++) {
          const id = hand.cards[hand.cards.length - 1];
          if (i % 2 === 0) table.send(id, "up", { up: true }); else table.send(id, "keep", { up: false });
          await pause(quick);
          if (gone()) return;
        }
        await said;
        if (gone()) return;
        hand = table.spotStack("keep");
        hand.tag = "pack";
        table.slide(hand, "pack");
        await pause(600);
        if (gone()) return;
      }

      await say("Three cards are left. Only three.");
      if (gone()) return;
      g.left = table.topFirst(hand);
      /* each is laid above the copy it matches, if it matches one; else wherever is free */
      const free = [0, 1, 2];
      const where = g.left.map((id) => { const at = g.mine.indexOf(id); if (at >= 0) free.splice(free.indexOf(at), 1); return at; }).map((at) => (at >= 0 ? at : free.shift()));
      for (let i = 0; i < g.left.length; i++) {
        table.send(g.left[i], `r${where[i]}`, { up: true });
        await pause(700);
        if (gone()) return;
      }
      table.frozen = false;
      g.phase = "done";
      const found = g.left.filter((id) => g.mine.includes(id)).length;
      if (found === 3) say(`${Name(g.left[0])}, ${nameOf(g.left[1])} and ${nameOf(g.left[2])}. Your three cards, and no others.`, "win");
      else say(`Only ${found} of these ${found === 1 ? "is" : "are"} yours. Something went wrong with my dealing.`, "warn");
      S.open = true;
      $("#ct-help").classList.add("is-nudge");
      sync();
    },

    changed() {},
    refused() { if (S.g.phase !== "done") say("Those are the copies of your cards. They stay where you can see them."); },
    canShuffle: () => false,

    dock() {
      const g = S.g;
      if (g.phase === "cut") {
        return `<label class="ct-add" title="How many cards to cut off">${UI.layers(18)}
            <input id="ct-cut" class="ct-add__in" type="text" inputmode="numeric" autocomplete="off" maxlength="2" placeholder="1–14" aria-label="How many cards to cut off, from 1 to 14" /></label>
          ${key("cut", UI.check(20), "Cut that many")}`;
      }
      return g.phase === "done" ? key("again", UI.again(20), "Do it again") : "";
    },

    guide() {
      const g = S.g;
      const now = { wait: 0, choose: whole ? 0 : 1, cut: 1, stack: 2, deal: 3, done: 5 }[g.phase];
      const table3 = whole
        ? [[52, "6, 22, 38"], [26, "8, 16, 24"], [13, "2, 6, 10"], [6, "2, 4, 6"], [3, "<b>all three</b>"]]
        : [[29, "6, 14, 22"], [14, "4, 8, 12"], [7, "2, 4, 6"], [3, "<b>all three</b>"]];
      const why = `
        ${whole
          ? `<p>The cuts change nothing. Whatever you cut off the second pile lands between your first two cards, and what is left of it lies between them too: <b>fifteen cards</b> between them, however you cut. The same for the third pile.</p>
             <p>So your cards are always at places <b>10</b>, <b>26</b> and <b>42</b>: nine cards on top, then fifteen between each.</p>
             <p>Four cards go from the top to the bottom. Now yours are at <b>6</b>, <b>22</b> and <b>38</b>: all <b>even</b> places.</p>`
          : `<p>Count where your cards lie in the stack. Nine cards are on top, so your first is at place <b>10</b>. Seven cards lie between each of yours, so the others are at <b>18</b> and <b>26</b>. That is why I took three off each pile of ten: it leaves piles of seven.</p>
             <p>Four cards come off the top. Now yours are at <b>6</b>, <b>14</b> and <b>22</b>: all <b>even</b> places.</p>`}
        <p>Up, down, up, down: the 1st, 3rd, 5th… cards are turned up and thrown out. The 2nd, 4th, 6th… are kept. <b>The even places survive.</b></p>
        <table class="ct-places">
          <thead><tr><th>Cards left</th><th>Yours are at</th></tr></thead>
          <tbody>${table3.map(([n, at]) => `<tr><td>${n}</td><td>${at}</td></tr>`).join("")}</tbody>
        </table>
        <p>Dealing turns the kept pile upside down each time, and still your cards land on even places, every pass, until they are the only three left.</p>
        <p class="ct-hint">${whole
          ? "With a real pack: piles of 10, 15, 15 and 9. A card on the ten, cut some of the next pile onto it, a card on the rest, cut again, a card on the rest, the nine on top. Stack them, four to the bottom, then up-down until three remain."
          : "With a real pack: three piles of ten, three off each, a chosen card on each pile, stack them, the nine on top, four off, then up-down until three remain."}</p>`;
      const how = whole
        ? [[UI.hand(18), "Tap any three cards. Copies of them stay face up for you"],
          [UI.layers(18), "PrepBot makes four piles. You say how many cards to cut, twice, to bury your cards"],
          [UI.cards(18), "The piles are put together, and four cards go to the bottom"],
          [UI.refresh(18), "Up, down, up, down: face-up cards are out, face-down cards are dealt again"],
          [UI.bulb(18), "Three cards are left. They are yours"]]
        : [[UI.cards(18), "PrepBot deals three piles of ten, and takes three cards off each"],
          [UI.hand(18), "Tap any three cards from the rest. Copies of them stay face up for you"],
          [UI.layers(18), "Your cards go on the piles; the piles are stacked; the nine go on top; four come off"],
          [UI.refresh(18), "Up, down, up, down: face-up cards are out, face-down cards are dealt again"],
          [UI.bulb(18), "Three cards are left. They are yours"]];
      return `<p class="ct-lead">Choose any three cards. PrepBot buries them${whole ? " where you say" : ""}, and deals the pack away until only three cards are left: yours.</p>
        ${steps(how, now)}
        ${secret("The secret: the even places survive", why)}`;
    },
  };
}

const FINAL3 = finalThree(false);
const FINAL3B = finalThree(true);

const GUIDES = { base3: BASE3, eleven: ELEVEN, any: ANY, final3: FINAL3, final3b: FINAL3B, odd: ODD, free: FREE };

/* ── the two screens ──────────────────────────────────────────────────────*/

function recall() {
  try {
    const was = JSON.parse(localStorage.getItem(KEEP) || "null") || {};
    if (GUIDES[was.trick]) S.trick = was.trick;
    if (was.n >= 1 && was.n <= 27) S.n = Math.round(was.n);
    if (was.who === "bot") S.who = "bot";
    S.counts = was.counts === true;
  } catch { /* a browser that refuses storage still plays perfectly */ }
}
function remember() {
  try { localStorage.setItem(KEEP, JSON.stringify({ trick: S.trick, who: S.who, n: S.n, counts: S.counts })); } catch { /* the same */ }
}

function drawSetup() {
  document.querySelectorAll('input[name="ct-trick"]').forEach((el) => { el.checked = el.value === S.trick; });
  $("#ct-number-field").hidden = S.trick !== "base3";
  $("#ct-who-field").hidden = S.trick !== "base3";
  document.querySelectorAll('input[name="ct-who"]').forEach((el) => { el.checked = el.value === S.who; });
  $("#ct-n-note").textContent = S.who === "bot" ? "Any place from 1 to 27. PrepBot will put your card there." : "Any place from 1 to 27. My card will end up there.";
  $("#ct-counts").checked = S.counts;
  $("#ct-n").textContent = String(S.n);
  $("#ct-less").disabled = S.n <= 1;
  $("#ct-more").disabled = S.n >= 27;
}

/** Redraw everything on the table screen that is not a card. */
function sync() {
  const g = guide();
  table.canShuffle = g.canShuffle ? g.canShuffle() : true;
  const keys = S.begun ? g.dock() : "";
  if ($("#ct-dock").dataset.is !== keys) { $("#ct-dock").dataset.is = keys; $("#ct-dock").innerHTML = keys; }
  $("#ct-guide").innerHTML = g.guide();
  $("#ct-guide-title").textContent = g.name;
  /* a table PrepBot is working at has no use for the shuffle and flip-deal keys */
  const bot = g === BOT27 || g === ODD || g === FINAL3 || g === FINAL3B;
  $("#ct-shuffle").hidden = bot;
  $("#ct-turn").hidden = bot;
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
  closeAsk();
  S.open = false;
  S.begun = false;
  guide().setup();
  sync();
  showGuide(true);
}

function play() {
  remember();
  document.body.classList.add("ct-playing");
  $("#ct-table").classList.toggle("show-counts", S.counts);
  $("#ct-play").hidden = false;
  begin();
}

function leave() {
  S.run += 1;
  if (teacher) teacher.stop();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  $("#ct-play").hidden = true;
  document.body.classList.remove("ct-playing");
  /* The cards are cleared off the hidden table. Every card is printed with
     the same named inks (art.js), and a browser takes a named ink from the
     first place it finds it: left on a table that is not being shown, the
     cards there would leave the ones on PrepBot's TV without their colours. */
  table.setup();
  drawSetup();
}

function start() {
  $("#ct-paint").innerHTML = heroPaint();
  $("#ct-start").insertAdjacentHTML("afterbegin", UI.play(16));
  $("#ct-less").innerHTML = UI.chevronLeft(16);
  $("#ct-more").innerHTML = UI.chevronRight(16);
  $("#ct-min").innerHTML = UI.chevronDown(16);
  $("#ct-watch-bot").innerHTML = ICON_PREPBOT;
  $("#ct-tv").innerHTML = ICON_PREPBOT;
  $("#ct-watch").insertAdjacentHTML("beforeend", UI.play(14));
  $("#ct-watch").addEventListener("click", watch);
  $("#ct-tv").addEventListener("click", watch);
  const ICON = { "ct-exit": UI.arrowLeft, "ct-shuffle": UI.shuffle, "ct-turn": UI.refresh, "ct-again": UI.again, "ct-help": UI.doc, "ct-full": UI.expand };
  Object.entries(ICON).forEach(([id, icon]) => { $(`#${id}`).innerHTML = icon(20); });

  recall();
  drawSetup();
  mountVoice();

  /* setup */
  $("#ct-setup").addEventListener("change", (e) => {
    if (e.target.name === "ct-trick") { S.trick = e.target.value; drawSetup(); }
    if (e.target.id === "ct-counts") S.counts = e.target.checked;
    if (e.target.name === "ct-who") { S.who = e.target.value; drawSetup(); }
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

  $("#ct-ask-go").innerHTML = UI.check(18);
  $("#ct-ask").addEventListener("submit", (e) => { e.preventDefault(); dealAsked(); });
  $("#ct-ask-n").addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); closeAsk(); } });
  /* a press anywhere else puts the box away */
  document.addEventListener("pointerdown", (e) => { if (asking && !e.target.closest("#ct-ask")) closeAsk(); }, true);

  const dock = $("#ct-dock");
  dock.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled || table.busy) return;
    const act = el.dataset.act;
    if (act === "again") { begin(); return; }
    await guide().act(act, dock);
    sync();
  });
  dock.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.id === "ct-cut") $('[data-act="cut"]', dock).click();
  });
  /* the secret stays open, or shut, through every redraw */
  $("#ct-guide").addEventListener("toggle", (e) => { if (e.target.matches(".ct-secret")) S.open = e.target.open; }, true);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
