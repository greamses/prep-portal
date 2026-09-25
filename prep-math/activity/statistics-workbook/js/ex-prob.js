/* ============================================================================
   Statistics Workbook — CHAPTER 6: Probability
   ----------------------------------------------------------------------------
   Probability is where a workbook usually has to lie. It says "roll a die 60
   times and see how close you get to 10 sixes", and nobody ever does, so the
   idea that the experiment drifts towards the theory is taken on trust. Here
   the die really rolls (utils/components/workbook/chance.js) and the tally
   fills itself, so a child can watch 12 rolls disagree with the theory and 120
   rolls agree with it.

     how likely?        the words first — impossible, unlikely, even chance,
                        likely, certain — and where they sit on a 0 to 1 line
     one die            list what can happen, then count the ways: P(3),
                        P(even), P(more than 4), all out of 6
     roll it            the experiment: roll, tally, write the relative
                        frequency, and say whether it is near the theory
     a pack of cards    52 cards, 4 suits, 12 pictures: P(red), P(heart),
                        P(king), P(picture) — and drawing one to see
     not happening      P(not A) = 1 − P(A), on both the die and the pack
     two dice           (Middle+) the 36 ways, the table of totals, and why 7
                        is the one to bet on

   Every probability here is a fraction in its lowest terms, worked out by
   oddsOf() in chance.js — the same function the answer key uses, so the key
   and the question can never disagree.
   ========================================================================== */

import { dieSvg, cardSvg, rollHtml, packHtml, PACK, cardsMatching, oddsOf, waysToMake, sumTable } from "/utils/components/workbook/chance.js";
import { tableHtml } from "./pictoart.js";
import { levelOf, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

/* ── the paper's furniture ───────────────────────────────────────────────── */

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const art = (html) => `<div class="sw-art">${html}</div>`;
const side = (figure, words) => `<div class="sw-side">${figure}<div class="sw-lines">${words}</div></div>`;

const tier = (o) => levelOf(o).id;
const LV = { gentle: 0, middle: 1, stretch: 2 };

/* ── what the chapter talks about ────────────────────────────────────────── */

/* Everyday events, and where they belong on the scale. `at` is the word, and
   `p` is roughly where it sits from 0 to 1 — used only for the scale question,
   where anything in the right band is right. */
const EVENTS = [
  { text: "The sun will rise tomorrow", at: "certain", p: 1 },
  { text: "A dropped stone falls down", at: "certain", p: 1 },
  { text: "You roll a 7 on an ordinary die", at: "impossible", p: 0 },
  { text: "A goat lays an egg", at: "impossible", p: 0 },
  { text: "A tossed coin lands on heads", at: "even chance", p: 0.5 },
  { text: "A die shows an even number", at: "even chance", p: 0.5 },
  { text: "It rains in Lagos in July", at: "likely", p: 0.8 },
  { text: "You are given homework this week", at: "likely", p: 0.85 },
  { text: "You roll a 6 on an ordinary die", at: "unlikely", p: 1 / 6 },
  { text: "The first person you meet was born in December", at: "unlikely", p: 1 / 12 },
];

const WORDS = ["impossible", "unlikely", "even chance", "likely", "certain"];

/* What can be asked about one die: the description, and which faces it fits */
const DIE_ASKS = [
  { text: "a 3", hits: [3], tier: 0 },
  { text: "an even number", hits: [2, 4, 6], tier: 0 },
  { text: "a number bigger than 4", hits: [5, 6], tier: 0 },
  { text: "a 1 or a 2", hits: [1, 2], tier: 0 },
  { text: "an odd number", hits: [1, 3, 5], tier: 0 },
  { text: "a number less than 3", hits: [1, 2], tier: 1 },
  { text: "a multiple of 3", hits: [3, 6], tier: 1 },
  { text: "a number that is not a 6", hits: [1, 2, 3, 4, 5], tier: 1 },
  { text: "a factor of 6", hits: [1, 2, 3, 6], tier: 2 },
  { text: "a square number", hits: [1, 4], tier: 2 },
];

/* What can be asked about a pack of cards */
const CARD_ASKS = [
  { text: "a red card", what: "red", tier: 0 },
  { text: "a heart", what: "heart", tier: 0 },
  { text: "a king", what: "king", tier: 0 },
  { text: "a spade", what: "spade", tier: 0 },
  { text: "a picture card (J, Q or K)", what: "picture", tier: 1 },
  { text: "an ace", what: "ace", tier: 1 },
  { text: "a black card", what: "black", tier: 1 },
  { text: "a red king", what: "red king", tier: 2 },
  { text: "a black picture card", what: "black picture", tier: 2 },
  { text: "a 10", what: "ten", tier: 2 },
];

const poolFor = (list, o) => list.filter((x) => x.tier <= (LV[tier(o)] ?? 0));
/* ONE DEALER PER BANK. A dealer keeps a shuffled pack and only reshuffles when
   the list it is handed changes LENGTH — so a single dealer shared between the
   dice bank and the cards bank (both ten long at Stretch) hands out a die
   question when asked for a card. */
const dealDie = dealer();
const dealCard = dealer();

export const PB_GROUPS = [
  { id: "pb-words", chapter: "Chapter 6 · Probability", label: "How likely is it?", blurb: "Impossible, unlikely, even chance, likely, certain." },
  { id: "pb-die", label: "One die", blurb: "Six things can happen. How many of them are the one you want?" },
  { id: "pb-roll", label: "Roll it and see", blurb: "The experiment: roll, tally, and compare with the theory." },
  { id: "pb-cards", label: "A pack of cards", blurb: "52 cards, 4 suits, 12 pictures." },
  { id: "pb-not", label: "The chance of NOT", blurb: "Everything that can happen adds up to 1." },
  { id: "pb-two", label: "Two dice", blurb: "36 ways to land, and why 7 is the one to bet on." },
];

/* ═══ 1. how likely is it? ═════════════════════════════════════════════════*/

const pbWords = {
  id: "pb-words",
  group: "pb-words",
  label: "Put it in words",
  blurb: "Five events: which word fits each one?",
  heading: "How likely is it?",
  instruction: () =>
    "Some things cannot happen (<b>impossible</b>), some are bound to (<b>certain</b>), and the rest are " +
    "somewhere between. If something is just as likely to happen as not, that is an <b>even chance</b>. Write " +
    "impossible, unlikely, even chance, likely or certain for each one.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const pick = [];
    const pool = r.shuffle(EVENTS.slice());
    /* one of each word where the bank allows, so a list is never all one thing */
    WORDS.forEach((w) => {
      const one = pool.find((e) => e.at === w && !pick.includes(e));
      if (one) pick.push(one);
    });
    return { es: pick.slice(0, 5).map((e) => EVENTS.indexOf(e)) };
  },
  render(item) {
    const rows = item.es.map((n) => [EVENTS[n].text, box()]);
    return tableHtml(["What might happen", "How likely?"], rows);
  },
  worked() {
    return worked(say("A tossed coin lands on heads: there are two ways it can land and one of them is heads, " +
      "so it is an <b>even chance</b>. Rolling a 7 on an ordinary die is <b>impossible</b> — there is no 7 on it."));
  },
  key(item) {
    return item.es.map((n) => want.text(EVENTS[n].at, EVENTS[n].at.replace(" ", "")));
  },
  answer(item) {
    return [item.es.map((n) => `${EVENTS[n].text} → ${EVENTS[n].at}`).join("; ")];
  },
};

/* ═══ 2. one die ═══════════════════════════════════════════════════════════*/

const pbDie = {
  id: "pb-die",
  group: "pb-die",
  label: "The chance on one die",
  blurb: "Count the ways it can happen, out of 6.",
  heading: "One die",
  instruction: () =>
    "A die has six faces, and each one is just as likely as the others. To find a probability, count how many " +
    "of the six faces give you what you want, and write it over 6: <b>ways it can happen / ways it can land</b>. " +
    "Then cancel the fraction down if you can.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const pool = poolFor(DIE_ASKS, o);
    const a = dealDie(r, pool, i * 2);
    let b = dealDie(r, pool, i * 2 + 1);
    if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length];
    return { a: DIE_ASKS.indexOf(a), b: DIE_ASKS.indexOf(b) };
  },
  render(item) {
    const faces = [1, 2, 3, 4, 5, 6].map((f) => dieSvg(f, { mm: 11 })).join("");
    const one = DIE_ASKS[item.a];
    const two = DIE_ASKS[item.b];
    return side(art(`<div class="pb-faces">${faces}</div>`),
      ask(`The die is rolled once.`) +
      ask(`How many faces give ${one.text}? ${box()}`) +
      ask(`So P(${one.text}) = ${box()}`) +
      ask(`And P(${two.text}) = ${box()}`));
  },
  worked() {
    return worked(say(`An even number is 2, 4 or 6 — that is <b>3</b> of the six faces, so P(even) = ` +
      `3/6, which cancels to <b>1/2</b>. Always cancel: 3/6 and 1/2 are the same chance, and 1/2 says it plainer.`));
  },
  key(item) {
    const one = DIE_ASKS[item.a];
    const two = DIE_ASKS[item.b];
    const p1 = oddsOf(one.hits.length, 6);
    const p2 = oddsOf(two.hits.length, 6);
    return [
      want.num(one.hits.length),
      want.text(p1.text, `${one.hits.length}/6`, p1.d === 1 ? String(p1.n) : p1.text),
      want.text(p2.text, `${two.hits.length}/6`, p2.d === 1 ? String(p2.n) : p2.text),
    ];
  },
  answer(item) {
    const one = DIE_ASKS[item.a];
    const two = DIE_ASKS[item.b];
    return [`${one.hits.length} faces; P = ${oddsOf(one.hits.length, 6).text}; P(${two.text}) = ${oddsOf(two.hits.length, 6).text}`];
  },
};

/* ═══ 3. roll it and see ═══════════════════════════════════════════════════*/

const rollsFor = (o) => ({ gentle: 10, middle: 30, stretch: 60 }[tier(o)] || 10);

const pbRoll = {
  id: "pb-roll",
  group: "pb-roll",
  label: "Roll it and see",
  blurb: "The experiment, and how near it lands to the theory.",
  heading: "Roll it and see",
  instruction: (o) =>
    `Roll the die ${rollsFor(o)} times and tally what comes up. On screen the Roll note does it for you and fills ` +
    "the chart in. Then count: how many were sixes? That many out of your rolls is the <b>relative frequency</b> — " +
    "what actually happened, not what should happen. A few rolls can be miles out; keep rolling and it creeps " +
    "towards the theory.",
  cols: 1,
  defaultCount: 1,
  make(r, o) {
    return { n: rollsFor(o), face: r.int(1, 6) };
  },
  render(item, o) {
    return rollHtml({ dice: 1, rolls: item.n, label: "A die to roll, and a tally chart" }) +
      ask(`How many times did you roll a ${item.face}? ${box()}`) +
      ask(`The theory says P(${item.face}) = ${box()}, so in ${item.n} rolls you would expect about ${box()} of them.`) +
      ask(`Was your experiment close to that?`) + tick("Yes, close", "Not very close");
  },
  worked(o) {
    const n = rollsFor(o);
    return worked(say(`P(6) = 1/6, so in ${n} rolls you would expect about ${Math.round(n / 6)} sixes. ` +
      `Getting ${Math.round(n / 6) + 2} or ${Math.max(0, Math.round(n / 6) - 2)} is perfectly ordinary — ` +
      "it is the SHAPE of the whole chart that settles down, and only after a lot of rolls."));
  },
  key(item) {
    return [
      want.chance({ says: `${item.n} rolls tallied` }),
      want.free(),
      want.text("1/6"),
      want.num(Math.round(item.n / 6), 1),
      want.free(),
    ];
  },
  answer(item) {
    return [`P(${item.face}) = 1/6, so about ${Math.round(item.n / 6)} in ${item.n} rolls`];
  },
};

/* ═══ 4. a pack of cards ═══════════════════════════════════════════════════*/

const pbCards = {
  id: "pb-cards",
  group: "pb-cards",
  label: "A pack of cards",
  blurb: "52 cards: how many of them are the one you want?",
  heading: "A pack of cards",
  instruction: () =>
    "A pack has <b>52</b> cards: four suits (♥ ♦ ♣ ♠) of thirteen each. Hearts and diamonds are red, clubs and " +
    "spades are black, and the J, Q and K of each suit are the picture cards — twelve of them. Same rule as the " +
    "die: how many of the 52 are the one you want, over 52, cancelled down.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const pool = poolFor(CARD_ASKS, o);
    const a = dealCard(r, pool, i * 2);
    let b = dealCard(r, pool, i * 2 + 1);
    if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length];
    return { a: CARD_ASKS.indexOf(a), b: CARD_ASKS.indexOf(b), show: r.int(0, 51) };
  },
  render(item) {
    const one = CARD_ASKS[item.a];
    const two = CARD_ASKS[item.b];
    return side(art(cardSvg(PACK[item.show], { mm: 24 }) + packHtml({ label: "A pack to draw from" })),
      ask(`One card is taken without looking.`) +
      ask(`How many of the 52 are ${one.text}? ${box()}`) +
      ask(`So P(${one.text}) = ${box()}`) +
      ask(`And P(${two.text}) = ${box()}`));
  },
  worked() {
    return worked(say("A heart: there are 13 hearts in the 52, so P(heart) = 13/52 = <b>1/4</b> — one suit out " +
      "of four, which you could have said without counting. P(king) = 4/52 = <b>1/13</b>."));
  },
  key(item) {
    const one = CARD_ASKS[item.a];
    const two = CARD_ASKS[item.b];
    const n1 = cardsMatching(one.what);
    const n2 = cardsMatching(two.what);
    const p1 = oddsOf(n1, 52);
    const p2 = oddsOf(n2, 52);
    return [
      want.chance({ says: "a card drawn" }),
      want.num(n1),
      want.text(p1.text, `${n1}/52`),
      want.text(p2.text, `${n2}/52`),
    ];
  },
  answer(item) {
    const one = CARD_ASKS[item.a];
    const two = CARD_ASKS[item.b];
    return [`${cardsMatching(one.what)} of 52 → ${oddsOf(cardsMatching(one.what), 52).text}; ` +
      `P(${two.text}) = ${oddsOf(cardsMatching(two.what), 52).text}`];
  },
};

/* ═══ 5. the chance of NOT ═════════════════════════════════════════════════*/

const pbNot = {
  id: "pb-not",
  group: "pb-not",
  label: "The chance of NOT",
  blurb: "Everything that can happen adds up to 1.",
  heading: "The chance of NOT",
  instruction: () =>
    "Something either happens or it does not, and between them that is certain. So the two chances add up to " +
    "<b>1</b>: P(not it) = 1 − P(it). It saves counting — the chance of NOT rolling a six is 1 − 1/6 = 5/6, and " +
    "you never had to list the other five faces.",
  cols: 1,
  defaultCount: 2,
  minLevel: "middle",
  make(r, o, k, i) {
    const d = dealDie(r, poolFor(DIE_ASKS, o), i);
    const c = dealCard(r, poolFor(CARD_ASKS, o), i);
    return { d: DIE_ASKS.indexOf(d), c: CARD_ASKS.indexOf(c) };
  },
  render(item) {
    const d = DIE_ASKS[item.d];
    const c = CARD_ASKS[item.c];
    return ask(`A die is rolled. P(${d.text}) = ${box()}, so P(NOT ${d.text}) = ${box()}`) +
      ask(`A card is drawn. P(${c.text}) = ${box()}, so P(NOT ${c.text}) = ${box()}`) +
      ask(`The two chances of one event always add up to`) + tick("0", "1", "it depends");
  },
  worked() {
    return worked(say("P(even) on a die is 1/2, so P(NOT even) = 1 − 1/2 = <b>1/2</b>. P(heart) = 1/4, so " +
      "P(NOT a heart) = 1 − 1/4 = <b>3/4</b>. Take the top from the bottom and keep the bottom: 4/4 − 1/4 = 3/4."));
  },
  key(item) {
    const d = DIE_ASKS[item.d];
    const c = CARD_ASKS[item.c];
    const pd = oddsOf(d.hits.length, 6);
    const npd = oddsOf(6 - d.hits.length, 6);
    const n = cardsMatching(c.what);
    const pc = oddsOf(n, 52);
    const npc = oddsOf(52 - n, 52);
    return [
      want.text(pd.text, `${d.hits.length}/6`),
      want.text(npd.text, `${6 - d.hits.length}/6`),
      want.text(pc.text, `${n}/52`),
      want.text(npc.text, `${52 - n}/52`),
      want.tick(1),
    ];
  },
  answer(item) {
    const d = DIE_ASKS[item.d];
    const c = CARD_ASKS[item.c];
    return [`die ${oddsOf(d.hits.length, 6).text} and ${oddsOf(6 - d.hits.length, 6).text}; ` +
      `cards ${oddsOf(cardsMatching(c.what), 52).text} and ${oddsOf(52 - cardsMatching(c.what), 52).text}`];
  },
};

/* ═══ 6. two dice ══════════════════════════════════════════════════════════*/

const pbTwo = {
  id: "pb-two",
  group: "pb-two",
  label: "Two dice",
  blurb: "The 36 ways, and the total that comes up most.",
  heading: "Two dice",
  instruction: () =>
    "Two dice can land 6 × 6 = <b>36</b> ways, and every one of those ways is just as likely. The totals are not: " +
    "there is only one way to make 2 (1 and 1) but six ways to make 7. Fill in the table of totals, then count the " +
    "ways and write each chance out of 36.",
  cols: 1,
  defaultCount: 1,
  minLevel: "middle",
  make(r, o) {
    const totals = tier(o) === "stretch" ? [r.int(4, 6), 7, r.int(9, 11)] : [7, r.pick([2, 12]), r.pick([5, 6, 8])];
    return { totals: [...new Set(totals)].slice(0, 3) };
  },
  render(item) {
    const T = sumTable();
    /* the table is printed with three of its cells missing, to be worked out */
    const hide = new Set(["1,3", "3,4", "5,2"]);
    const head = ["+", "1", "2", "3", "4", "5", "6"];
    const rows = T.map((row, a) => [String(a + 1), ...row.map((v, b) =>
      (hide.has(`${a},${b}`) ? `<span class="wb-cell"></span>` : String(v)))]);
    const qs = item.totals.map((t) =>
      ask(`P(total is ${t}) = ${box()}`)).join("");
    return side(art(tableHtml(head, rows, "pb-grid")),
      ask(`How many ways can two dice land altogether? ${box()}`) + qs +
      ask(`Which total comes up most often?`) + tick("2", "7", "12"));
  },
  worked() {
    return worked(say("A total of 7 can be made 1+6, 2+5, 3+4, 4+3, 5+2 and 6+1 — <b>six</b> ways out of 36, " +
      "so P(7) = 6/36 = <b>1/6</b>. A total of 2 has only 1+1, so P(2) = <b>1/36</b>. That is why 7 is the total " +
      "to bet on, and 2 or 12 the worst."));
  },
  key(item) {
    return [
      want.cell(String(sumTable()[1][3])),
      want.cell(String(sumTable()[3][4])),
      want.cell(String(sumTable()[5][2])),
      want.num(36),
      ...item.totals.map((t) => want.text(oddsOf(waysToMake(t), 36).text, `${waysToMake(t)}/36`)),
      want.tick(1),
    ];
  },
  answer(item) {
    return [item.totals.map((t) => `P(${t}) = ${oddsOf(waysToMake(t), 36).text}`).join(", ")];
  },
};

export const PB_EXERCISES = [pbWords, pbDie, pbRoll, pbCards, pbNot, pbTwo];
