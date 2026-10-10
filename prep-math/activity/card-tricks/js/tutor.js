/* ============================================================================
   CARD TRICKS — PrepBot teaches each trick, on its TV
   ----------------------------------------------------------------------------
   PrepBot never explains from thin air: it stands in its TV, speaks in its
   own voice, and what it is talking about happens on the screen beside it
   (/prep-math/mental-math/shared/prepbot-tv.js and prepbot-teacher.js — the
   same set and the same PrepBot as every other lesson on the site). Nothing
   here draws a TV or a bot. This file only says what PrepBot SAYS and what
   the cards on the screen DO while it says it.

   A step's `show` only ever adds to what the steps before it left, and can
   be asked to do so instantly — that is how the set goes back a step.

   The cards on the screen are the real ones (art.js), small.
   ========================================================================== */

import { openTv } from "/prep-math/mental-math/shared/prepbot-tv.js";
import { faceSvg, backSvg } from "./art.js";
import { base3 } from "./deck.js";

const art = (what) => (what === "back" ? backSvg("red") : what === "blue" ? backSvg("blue") : faceSvg(what, { label: false }));

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
  function bring(el, fresh, x, y, { delay = 0, rot = 0, z = null } = {}) {
    if (z !== null) el.style.zIndex = String(z);
    const end = { left: `${x}%`, top: `${y}%`, opacity: 1, rotation: rot };
    if (!gsap) { el.style.left = end.left; el.style.top = end.top; el.style.opacity = "1"; return; }
    if (!live) { gsap.set(el, end); return; }
    if (fresh) gsap.fromTo(el, { left: end.left, top: `${y - 8}%`, opacity: 0, rotation: rot }, { ...end, duration: 0.45, delay, ease: "power2.out" });
    else gsap.to(el, { ...end, duration: 0.6, delay, ease: "power2.inOut" });
  }

  return {
    /** A card: "back", "blue", or a face like "7H". */
    card(key, what, x, y, opts = {}) {
      const { el, fresh } = piece(key, "ct-tv__card");
      if (el.dataset.art !== what) { el.dataset.art = what; el.innerHTML = art(what); }
      bring(el, fresh, x, y, opts);
      return el;
    },
    /** Turn a card over to show something else. */
    turn(key, what, delay = 0) {
      const el = root.querySelector(`[data-k="${key}"]`);
      if (!el || el.dataset.art === what) return;
      const swap = () => { el.dataset.art = what; el.innerHTML = art(what); };
      if (!live) { swap(); return; }
      gsap.to(el, { scaleX: 0, duration: 0.18, delay, onComplete: () => { swap(); gsap.to(el, { scaleX: 1, duration: 0.18 }); } });
    },
    /** Words or a number on the cloth. `cls`: "big", "gold", "small". */
    text(key, words, x, y, cls = "", opts = {}) {
      const { el, fresh } = piece(key, `ct-tv__txt ${cls ? `ct-tv__txt--${cls}` : ""}`);
      el.innerHTML = words;
      bring(el, fresh, x, y, opts);
      return el;
    },
    gone(key) {
      const el = root.querySelector(`[data-k="${key}"]`);
      if (!el) return;
      if (live) gsap.to(el, { opacity: 0, duration: 0.3 }); else el.style.opacity = "0";
    },
    ring(key, on = true) {
      const el = root.querySelector(`[data-k="${key}"]`);
      if (el) el.classList.toggle("is-lit", on);
    },
  };
}

const build = (stage) => { stage.innerHTML = `<div class="ct-tv"></div>`; };
const step = (say, show) => ({ say, show: (stage, ctx) => show(kit(stage, ctx)) });

/* three face-up piles, as the top card of each */
const TOPS = ["9C", "QH", "4S"];
const PILE_X = [38, 55, 72];

function lesson27(n) {
  const [ones, threes, nines] = base3(n);
  const m = n - 1;
  const times = (k) => (k === 0 ? "no piles" : k === 1 ? "one pile" : "two piles");
  return [
    step(`This trick uses twenty seven cards. I keep one of them in mind, and here is a copy of it, face down. You choose a number. Yours is ${n}.`, (k) => {
      k.card("pack", "back", 16, 40);
      k.card("copy", "blue", 16, 78, { delay: 0.3 });
      k.text("n", String(n), 86, 30, "big", { delay: 0.5 });
      k.text("nl", "your number", 86, 47, "small", { delay: 0.5 });
    }),
    step("Deal the pack face up into three piles of nine. One card to each pile in turn, and round again.", (k) => {
      k.gone("pack");
      TOPS.forEach((id, i) => { k.card(`p${i}`, id, PILE_X[i], 40, { delay: i * 0.25 }); k.text(`c${i}`, "9", PILE_X[i], 62, "small", { delay: i * 0.25 }); });
    }),
    step("When the three piles are down, I point to the pile my card is in.", (k) => {
      k.text("arrow", "my card", PILE_X[1], 15, "gold");
      k.ring("p1");
    }),
    step("Now gather the three piles into one pack, face down. Here is the whole secret. You decide how many piles go on top of mine: none, one, or two.", (k) => {
      k.text("choice", "0 &nbsp;·&nbsp; 1 &nbsp;·&nbsp; 2", 55, 80, "big");
      k.text("choicel", "piles on top of mine", 55, 93, "small");
    }),
    step(`Take one away from your number, and split what is left into nines, threes and ones. ${n} take away one is ${m}. That is ${nines} nines, ${threes} threes and ${ones} ones.`, (k) => {
      ["p0", "p1", "p2", "c0", "c1", "c2", "arrow", "choice", "choicel"].forEach(k.gone);
      k.text("sum", `${n} − 1 = ${m}`, 52, 22, "big");
      k.text("split", `${nines} × 9 &nbsp;+&nbsp; ${threes} × 3 &nbsp;+&nbsp; ${ones} × 1`, 52, 40, "gold", { delay: 0.4 });
    }),
    step(`The first time you gather, use the ones: put ${times(ones)} on top of mine. The second time, the threes: ${times(threes)}. The third time, the nines: ${times(nines)}.`, (k) => {
      k.text("d1", `deal 1 &nbsp;→&nbsp; ones &nbsp;→&nbsp; <b>${ones}</b> on top`, 52, 58, "row");
      k.text("d2", `deal 2 &nbsp;→&nbsp; threes &nbsp;→&nbsp; <b>${threes}</b> on top`, 52, 70, "row", { delay: 0.5 });
      k.text("d3", `deal 3 &nbsp;→&nbsp; nines &nbsp;→&nbsp; <b>${nines}</b> on top`, 52, 82, "row", { delay: 1 });
    }),
    step(`After the third gather, count down to card ${n} yourself, and drag it onto my copy. If the two match, you win.`, (k) => {
      ["sum", "split", "d1", "d2", "d3", "n", "nl"].forEach(k.gone);
      k.card("pack", "back", 30, 40);
      k.card("yours", "QH", 62, 60, { delay: 0.3 });
      k.card("copy", "blue", 74, 60);
      k.turn("copy", "QH", 0.9);
      k.text("win", "a match", 68, 90, "gold", { delay: 1.2 });
    }),
    step("Two tips. Tap each pile to turn it face down before you stack them, so that on top really means on top. And double tap a pile to deal several cards at once.", (k) => {
      k.text("t1", "tap a pile: it turns over", 30, 84, "small");
      k.text("t2", "double tap: deal several", 30, 93, "small", { delay: 0.4 });
    }),
  ];
}

function lessonEleven() {
  const COUNT = [["3D", 10], ["KS", 9], ["2C", 8], ["7H", 7]];
  return [
    step("Watch how I hide my card. Nine cards go to one side, and my card goes on top of them. Here is a copy of it, face down.", (k) => {
      k.card("pack", "back", 16, 34);
      k.text("packn", "43", 16, 56, "small");
      k.card("nine", "back", 36, 34, { delay: 0.3 });
      k.text("ninen", "9, mine on top", 36, 56, "small", { delay: 0.3 });
      k.card("copy", "blue", 16, 80, { delay: 0.6 });
    }),
    step("The other forty three cards are shuffled, cut into seven, and stacked on top. However they fall, my card is now the forty fourth from the top.", (k) => {
      k.gone("nine"); k.gone("ninen");
      k.text("packn", "mine is 44th", 16, 56, "gold");
    }),
    step("Now it is your turn. Turn cards face up onto a pile, counting down from ten. Ten. Nine. Eight. Seven.", (k) => {
      COUNT.forEach(([id, c], i) => {
        k.card(`a${i}`, id, 40 + i * 8, 34, { delay: i * 0.55, z: 10 + i });
        k.text(`an${i}`, String(c), 40 + i * 8, 9, "big", { delay: i * 0.55 });
      });
    }),
    step("When the card says the number you are saying, stop. This card is a seven, and you said seven. So this pile stops on seven.", (k) => {
      k.ring("a3");
      k.text("stop", "stop: 7", 52, 58, "gold");
    }),
    step("An ace counts one. A jack, queen or king counts ten. If you get all the way down to one with no match, put one more card on top and turn the pile face down. That pile counts nothing.", (k) => {
      k.card("dead", "back", 86, 34);
      k.text("deadn", "out: 0", 86, 58, "gold");
    }),
    step("Make four piles like that. Then add up the four numbers in your head.", (k) => {
      [0, 1, 2, 3].forEach((i) => { k.gone(`a${i}`); k.gone(`an${i}`); });
      ["stop", "dead", "deadn"].forEach(k.gone);
      [["7H", 7], ["back", 0], ["10S", 10], ["3C", 3]].forEach(([id, v], i) => {
        k.card(`f${i}`, id, 40 + i * 15, 34, { delay: i * 0.2 });
        k.text(`fn${i}`, String(v), 40 + i * 15, 57, "big", { delay: i * 0.2 });
      });
      k.text("add", "7 + 0 + 10 + 3 = 20", 62, 76, "gold", { delay: 1 });
    }),
    step("Count that many cards off the pack, one at a time. To go faster, double tap the pack and type how many to deal.", (k) => {
      k.card("off", "5D", 36, 80);
      k.text("offn", "20 counted", 36, 97, "small");
    }),
    step("The last card you counted is the one. Drag it onto my copy. If they match, you win.", (k) => {
      k.card("off", "5D", 24, 80);
      k.turn("copy", "5D", 0.6);
      k.text("win", "a match", 20, 97, "gold", { delay: 0.9 });
      k.gone("offn");
    }),
    step("Why does it work? A pile that stops on seven has four cards in it. Four and seven make eleven. Every pile and its number make eleven, and four elevens are forty four.", (k) => {
      k.text("why", "4 × 11 = 44", 62, 92, "big");
    }),
  ];
}

function lessonTable() {
  return [
    step("This is a full pack of fifty two cards, face down, and the table is yours. Drag the top card to pull it off the pile.", (k) => {
      k.card("pack", "back", 30, 45);
      k.card("one", "back", 55, 45, { delay: 0.4 });
    }),
    step("Tap a card to turn it over.", (k) => { k.turn("one", "AS", 0.2); }),
    step("Let a card go over another, and it lands on top. Now it is a pile.", (k) => {
      k.card("two", "8D", 56.5, 43, { delay: 0.2, z: 5 });
      k.text("cnt", "2", 55.8, 68, "small", { delay: 0.5 });
    }),
    step("Tap a pile, and the whole pile turns over together. The card that was underneath is now on top.", (k) => {
      k.turn("two", "back", 0.2);
      k.turn("one", "back", 0.2);
    }),
    step("Drag the gold tab under a pile to carry all of it. Double tap a pile to deal several cards at once.", (k) => {
      k.card("one", "back", 78, 45);
      k.card("two", "back", 79.5, 43);
      k.text("cnt", "2", 78.8, 68, "small");
    }),
    step("The shuffle key riffles the pile you touched last. And with flip deal on, every card turns over as you draw it.", (k) => {
      k.text("tip", "shuffle &nbsp;·&nbsp; flip deal", 50, 88, "gold");
    }),
  ];
}

const TITLES = { base3: "27 cards", eleven: "Eleven", free: "The card table" };

/** Put PrepBot's TV up, teaching one of the tricks. */
export function openTutorial(trick, n = 14) {
  const steps = trick === "base3" ? lesson27(n) : trick === "eleven" ? lessonEleven() : lessonTable();
  return openTv({ title: TITLES[trick] || "Card Tricks", build, steps });
}
