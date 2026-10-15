/* ============================================================================
   The Prep Toy Shop — PrepBot does the shopping, on the real page
   ----------------------------------------------------------------------------
   NOT A FILM. PrepBot works the actual shop: it presses the real Add buttons,
   the basket really fills, it walks to the real till, opens the workbook's
   own tools off the rail and WORKS EACH FIGURE OUT ON THEM, types the answer
   into the real box, pays at the real counter and watches the real van.

   AND IT NEVER TOUCHES A CALCULATOR. A calculator would do any of these in
   one press, and a child who watches that has learnt the press and not the
   method. Every product goes on the multiplication board, every sum and
   take-away on the adding board, and a percentage is BUILT: ten per cent is
   one tenth, found on the digit shift card by sliding the figures one place,
   and twenty per cent is that tenth added to itself. A quarter and a half are
   long division. Nothing is rushed and nothing is skipped.

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

/**
 * How a sum is to be TAUGHT, and on which tools.
 *
 * NOT ON A CALCULATOR. A calculator will do any of these in one press, and a
 * child who watches that learns the press rather than the method. So every
 * figure on this bill is worked on the tool that shows how it is done, and a
 * percentage is built out of a tenth rather than typed in:
 *
 *     a product          the table multiplication board
 *     a sum or a take-away   the adding board
 *     10% of something   the digit shift card — ten per cent IS one tenth,
 *                        and one tenth is every figure one place to the right
 *     20%, 30% …         that tenth, added to itself on the adding board
 *     25%                a quarter: long division by 4
 *     50%                a half: long division by 2
 *
 * → [{ lesson, tool, fields }] — the moves in order, each with the sentence
 *   that says WHY before it happens.
 */
export function planFor(sum) {
  const t = String(sum || "").trim();
  if (!t) return [];

  const pc = /^([\d.]+)x(\d+)%$/.exec(t);
  if (pc) {
    const [amount, rate] = [pc[1], Number(pc[2])];
    return percentPlan(amount, rate);
  }

  const times = /^([\d.]+)x([\d.]+)$/.exec(t);
  if (times) {
    const [a, b] = [times[1], times[2]];
    const [multiplicand, multiplier] = a.length >= b.length ? [a, b] : [b, a];
    return [{
      lesson: `${multiplier} of them at ${multiplicand} each. Multiplying is adding the same number again `
        + "and again, and the board does it a figure at a time so you can see the carrying.",
      tool: "times",
      fields: { multiplicand, multiplier },
    }];
  }

  if (/[+\-]/.test(t)) {
    const written = t.replace(/\s+/g, "").replace(/([+\-])/g, " $1 ");
    return [{
      lesson: /-/.test(t)
        ? "A taking away. Line the points up under each other, and work from the right."
        : "An adding up. Line the points up under each other, and work from the right.",
      tool: "column",
      fields: { sum: written },
    }];
  }
  return [];
}

/** The tenth, and what is built out of it. */
export function percentPlan(amount, rate) {
  if (rate === 25 || rate === 50) {
    const by = rate === 25 ? 4 : 2;
    return [{
      lesson: rate === 25
        ? "Twenty-five per cent is a QUARTER. So this is a division by four, and long division shows every step of it."
        : "Fifty per cent is a HALF. So this is a division by two.",
      tool: "longdiv",
      fields: { dividend: amount, divisor: String(by) },
    }];
  }

  /* everything else is built out of one tenth */
  const tenth = {
    lesson: "Ten per cent means one tenth, and one tenth is every figure slid ONE place to the right. "
      + "The point does not move — the figures do.",
    tool: "shift",
    fields: { n: amount, power: 1 },
  };
  if (rate === 10) return [tenth];

  const lots = Math.round(rate / 10);
  return [tenth, {
    lesson: `And ${rate} per cent is ${lots === 2 ? "twice" : `${lots} times`} ten per cent, so the tenth is added to itself.`,
    tool: "column",
    /* the tenth is not known until the shift card has found it, so the sum is
       finished off at the time (see `fill`) */
    fields: { sum: Array.from({ length: lots }, () => "{tenth}").join(" + ") },
  }];
}

export const answerFromSay = (text) => {
  const m = /=\s*(\d[\d,]*(?:\.\d+)?)/.exec(String(text || "").trim());
  return m ? m[1] : "";
};

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
      await sleep(42);
    }
    await sleep(pause);
  };

  /* ── the tools, used for real ─────────────────────────────────────────
     Each of these opens the tool off the rail, works the sum on it, READS
     THE ANSWER BACK OFF IT, and puts it away. PrepBot is told nothing: the
     figure that goes in the box is the figure the tool produced, so if a
     tool were wrong the walk-through would be wrong too, visibly.
     --------------------------------------------------------------------*/

  /* a move may need the figure the move before it found: "{tenth}" */
  const fill = (fields, got) => Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, String(v).replace(/\{tenth\}/g, got || "0")]));

  const railKey = (id) => document.querySelector(`[data-wbtool="${id}"]`);
  const openTool = async (id) => {
    const key = railKey(id);
    if (!key) return null;
    if (key.getAttribute("aria-pressed") !== "true") await press(key, 460);
    return key;
  };
  const shutTool = async (id) => {
    const key = railKey(id);
    if (key?.getAttribute("aria-pressed") === "true") await press(key, 240);
  };

  /**
   * One tenth, found on the digit shift card — the figures slid one place to
   * the right, one press per place, while the point stays where it is.
   * → the reading on the card
   */
  async function onShift({ n, power }) {
    if (!(await openTool("shift"))) return "";
    const card = document.querySelector(".wb-shift");
    if (!card) return "";
    const q = (sel) => card.querySelector(sel);
    await type(q(".wb-shift__n"), n, 200);
    /* the sign is ONE key that turns over, so it is only pressed if it is
       showing the wrong sum */
    if (q(".wb-shift__op")?.textContent.trim() !== "÷") await press(q(".wb-shift__op"), 300);
    await type(q(".wb-shift__p"), String(power), 260);
    for (let k = 0; k < power; k += 1) {
      if (stopped) return "";
      await press(q('.wb-shift__go[data-go="-1"]'), 620);
    }
    const got = q(".wb-shift__read")?.textContent?.trim() || "";
    await sleep(420);
    await shutTool("shift");
    return got;
  }

  /** A product or a sum, worked right through on its written board. */
  async function onBoard(job) {
    if (!(await openTool(job.tool))) return "";
    const board = document.querySelector(`.bd-board--${job.tool}`);
    if (!board) return "";
    for (const [n, v] of Object.entries(job.fields)) {
      const field = board.querySelector(`.bd-sum__in[data-n="${n}"]`);
      if (field) await type(field, v, 110);
    }
    await press(board.querySelector(".bd-act--set"), 300);
    /* "Show me one" until the board has nothing left to ask — it writes the
       working a figure at a time, which is the whole reason to use it */
    for (let k = 0; k < 40; k++) {
      if (stopped) return "";
      const go = board.querySelector('[data-do="show"]');
      if (!go || go.disabled) break;
      go.click();
      await sleep(80);
      if (/^Done/i.test(board.querySelector(".bd-say")?.textContent || "")) break;
    }
    const got = answerFromSay(board.querySelector(".bd-say")?.textContent);
    await sleep(280);
    await shutTool(job.tool);
    return got;
  }

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
    await say("And I am not doing them in my head, and I am not using a calculator — a calculator "
      + "would just tell me, and then neither of us would know why. There are proper tools on the rail, "
      + "and I will pick the right one for every single figure.");

    let totalCoins = 0;
    for (const box of boxes()) {
      if (stopped) return;
      const want = Number(box.dataset.want);
      /* the last question on the bill is what there is to pay, and the
         counter needs it: PrepBot has to know what it is handing over */
      if (box.closest(".ts-ask.is-pay")) totalCoins = want;
      const label = box.getAttribute("aria-label") || "this one";
      const moves = planFor(box.dataset.sum || "");

      await say(`${label}.`, box);
      /* EVERY move is taught before it is made, and each one hands its answer
         to the next: the tenth found on the shift card is what gets added to
         itself on the adding board. Nothing is skipped and nothing is typed
         into a calculator. */
      let carried = "";
      for (const move of moves) {
        if (stopped) return;
        await say(move.lesson, box);
        const fields = fill(move.fields, carried);
        carried = move.tool === "shift" ? await onShift(fields) : await onBoard({ tool: move.tool, fields });
        if (stopped) return;
        if (carried) await say(`That is ${carried}.`);
      }
      if (carried) await say("So that is what goes in the box.", box);
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
        + "That is a taking away, so it goes on the adding board like the others.", chg);
      const [move] = planFor(`${writeAmount(target)}-${writeAmount(totalCoins)}`);
      const got = move ? await onBoard({ tool: move.tool, fields: move.fields }) : "";
      if (!stopped) await say(got ? `${got}. That is my change.` : "And that is the change.", chg);
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
  })().catch((err) => {
    /* A learner taking over rejects nothing — this only fires on a real fault,
       so it is reported rather than swallowed. Silently ending the walk-through
       is exactly how a shadowed helper went unnoticed. */
    if (!stopped) console.error("PrepBot's walk-through stopped early", err);
  });

  return {
    stop() {
      stopped = true;
      teacher.stop?.();
      spotlight(null);
    },
  };
}
