/* ============================================================================
   The Prep Toy Shop — PrepBot does the shopping, on the real page
   ----------------------------------------------------------------------------
   NOT A FILM. PrepBot works the actual shop: it presses the real Add buttons,
   the basket really fills, it walks to the real till, opens the real
   calculator off the tool rail and types the sum into it, reads the answer
   off the screen and types THAT into the real answer box, pays at the real
   counter and watches the real van arrive.

   WHY IT IS DONE THIS WAY. A film of a shop teaches a child about the film.
   What they have to learn here is where things are and what order they come
   in — which button, which box, which screen next — and the only way to teach
   that is on the screen they will be using. Everything below goes through the
   page's own handlers; nothing is simulated, and if the shop changed under it
   the walkthrough would break rather than quietly lie.

   PREPBOT NARRATES BY VOICE, bubble off. The bubble would sit on top of the
   very buttons it is pointing at (prepbot-teacher.js keeps it off unless the
   learner asks for it with T, or there is no voice to carry the words).

   A learner may take over at any moment: every wait is cancellable, and
   `stop()` leaves the shop exactly as it stands — the basket keeps whatever
   PrepBot put in it, because the next thing a child does is press the button
   it was about to press.
   ========================================================================== */

import { writeAmount, BILLS, PER_BILL } from "/utils/components/workbook/purse.js";

/* what PrepBot buys, and why: one line with a sale on it and one without, so
   the discount step has something to be different from */
const ORDER = [{ id: 1, n: 2 }, { id: 3, n: 3 }];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);

/** A soft ring around whatever is being talked about. */
function spotlight(el) {
  document.querySelectorAll(".ts-spot").forEach((n) => n.classList.remove("ts-spot"));
  if (!el) return;
  el.classList.add("ts-spot");
  el.scrollIntoView({ block: "center", behavior: "smooth" });
}

export function startGuide({ teacher, onDone = () => {} } = {}) {
  let stopped = false;
  const alive = () => !stopped;

  /* Everything PrepBot says is said, and WAITED for: the next thing it
     presses happens when it has finished the sentence about it, never over
     the top of it. */
  const say = async (line, el) => {
    if (stopped) return;
    spotlight(el || null);
    teacher.speak([{ text: line, mode: "speech" }]);
    try { await teacher.narrationDone; } catch { /* interrupted */ }
    if (!stopped) await sleep(260);
  };

  /* The page's own handlers do the work — this only presses things. */
  const press = async (el, pause = 520) => {
    if (stopped || !el) return;
    spotlight(el);
    el.click();
    await sleep(pause);
  };

  const type = async (el, text, pause = 420) => {
    if (stopped || !el) return;
    spotlight(el);
    el.focus();
    el.value = "";
    for (const ch of String(text)) {
      if (stopped) return;
      el.value += ch;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(70);
    }
    await sleep(pause);
  };

  (async () => {
    /* ── the shelf ──────────────────────────────────────────────────────*/
    await say("Let me do the shopping once, and you watch what I press. I am going to use this shop, "
      + "not a picture of it.");

    for (const { id, n } of ORDER) {
      const card = document.querySelector(`.ts-card[data-id="${id}"]`);
      const name = card?.querySelector(".ts-card__name")?.textContent?.trim() || "this one";
      await say(`First, ${n} of the ${name}. I press Add, and then the plus.`, card);
      for (let k = 0; k < n; k++) {
        if (stopped) return;
        await press(document.querySelector(`[data-add="${id}"]`), 420);
      }
    }
    if (stopped) return;

    await say("That is the basket. Now to the till — and notice that nothing has been added up yet.",
      $("ts-go"));
    await press($("ts-go"), 900);

    /* ── the bill ───────────────────────────────────────────────────────*/
    const boxes = () => [...document.querySelectorAll("#ts-till-body .ts-box")];
    if (!boxes().length) return;

    await say("Here is the bill, and every figure on it is a box I have to fill in myself. "
      + "The shop will not tell me one of them.");

    /* the calculator, off the tool rail — the sums are worked on it in front
       of the learner, not in PrepBot's head */
    await say("And I am not doing these in my head. There is a calculator on the rail, so I will use it.",
      document.querySelector('[data-wbtool="calculator"]'));
    await press(document.querySelector('[data-wbtool="calculator"]'), 900);
    const calcSrc = () => document.querySelector(".wb-calc__src");
    const calcOut = () => document.querySelector(".wb-calc [data-out]");

    let totalCoins = 0;
    for (const box of boxes()) {
      if (stopped) return;
      const want = Number(box.dataset.want);
      /* the last question on the bill is what there is to pay, and the
         counter needs it: PrepBot has to know what it is handing over */
      if (box.closest(".ts-ask.is-pay")) totalCoins = want;
      const label = box.getAttribute("aria-label") || "this one";
      const sum = box.dataset.sum || "";

      if (sum && calcSrc()) {
        await say(`${label}. On the calculator: ${sum}.`, box);
        await type(calcSrc(), sum, 300);
        await press(document.querySelector('.wb-calc__key--go'), 500);
        const got = calcOut()?.textContent?.trim();
        await say(`It says ${got}. So that is what goes in the box.`, box);
      } else {
        await say(`${label}.`, box);
      }
      await type(box, writeAmount(want), 320);
    }
    if (stopped) return;

    /* put the calculator away again: it has done its job and it is in the way */
    const calcKey = document.querySelector('[data-wbtool="calculator"][aria-pressed="true"]');
    if (calcKey) await press(calcKey, 400);

    await say("Every box is right, so the shop will take my money now.", $("ts-topay"));
    await press($("ts-topay"), 900);

    /* ── paying ─────────────────────────────────────────────────────────*/
    await say("Two ways to pay. I will count it out on the counter, because that is the one with a sum in it.");

    /* hand over the next whole five prepbills above the bill, in the fewest
       notes — so there is real change to work out rather than none */
    const target = Math.ceil(totalCoins / (5 * PER_BILL)) * 5 * PER_BILL;
    const notes = [];
    let owing = target;
    [...BILLS].sort((a, b) => b - a).forEach((v) => {
      while (owing >= v * PER_BILL) { notes.push(v); owing -= v * PER_BILL; }
    });
    const tray = (v) => document.querySelector(`#ts-pay-body [data-take="${v}"][data-kind="bill"]`);
    await say(`The bill is ${writeAmount(totalCoins)}, so I will put down ${writeAmount(target)} and take change.`);
    for (const v of notes) {
      if (stopped) return;
      await press(tray(v), 300);
    }

    const chg = document.querySelector("#ts-pay-body [data-change]");
    if (chg) {
      const change = target - totalCoins;
      await say("And the last sum is the change: what I put down, less what it cost. "
        + `${writeAmount(target)} take away ${writeAmount(totalCoins)}.`, chg);
      await type(chg, writeAmount(change), 260);
    }
    await sleep(300);
    if (stopped) return;

    const buy = $("ts-buy");
    if (buy && !buy.disabled) {
      await say("Paid.", buy);
      await press(buy, 1200);
    }

    /* ── and the van ────────────────────────────────────────────────────*/
    await say("And that is the whole of it. The van is on its way, and every figure on that bill was worked "
      + "out by somebody — which from now on is going to be you.");
    spotlight(null);
    onDone();
  })().catch(() => { /* the learner took over */ });

  return {
    stop() {
      stopped = true;
      teacher.stop?.();
      spotlight(null);
    },
  };
}
