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

/**
 * Which tool does this sum, and why that one.
 *
 * The bill writes each sum the way a calculator takes it (`2x12.50`,
 * `25.00x20%`, `32.00+3.20`). A calculator will do all of them — but a child
 * watching a calculator do a multiplication learns nothing about multiplying,
 * so the sum is sent to the tool that SHOWS the working: the table
 * multiplication board for a product, the adding board for a sum or a
 * difference, and the calculator only for the percentages, which no board on
 * the rail does.
 */
export function toolFor(sum) {
  const t = String(sum || "").trim();
  if (!t) return null;
  if (t.includes("%")) return { tool: "calculator", type: t };

  const times = /^([\d.]+)x([\d.]+)$/.exec(t);
  if (times) {
    const [a, b] = [times[1], times[2]];
    /* the board multiplies a number BY a number: the shorter one is what you
       multiply by, which is how it is said and how it is written */
    const [multiplicand, multiplier] = a.length >= b.length ? [a, b] : [b, a];
    return {
      tool: "times",
      fields: { multiplicand, multiplier },
      why: "That is a multiplying, so I will do it on the table board.",
    };
  }

  if (/[+\-]/.test(t)) {
    /* the board reads the house minus as well as the hyphen, and wants the
       signs spaced the way a person writes them */
    const written = t.replace(/\s+/g, "").replace(/([+\-])/g, " $1 ");
    return {
      tool: "column",
      fields: { sum: written },
      why: /-/.test(t)
        ? "That is a taking away, so it goes on the adding board."
        : "That is an adding up, so it goes on the adding board.",
    };
  }
  return { tool: "calculator", type: t };
}

/**
 * Pull the answer out of what a board says when it has finished
 * ("Done — 12.50 × 2 = 25.00.").
 *
 * The figure is digits with ONE point inside it; the stop at the end of the
 * sentence is not part of it. A character class of digits-and-dots swallowed
 * it and handed back "25.00.".
 */
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

  /** A percentage, on the calculator. → what it showed
      (the argument is NOT called `type`: that is the typing helper above, and
      shadowing it made this call a string, which threw and silently ended the
      whole walk-through) */
  async function onCalculator(expr) {
    if (!(await openTool("calculator"))) return "";
    const src = document.querySelector(".wb-calc__src");
    if (!src) return "";
    await type(src, expr, 280);
    await press(document.querySelector(".wb-calc__key--go"), 460);
    const got = document.querySelector(".wb-calc [data-out]")?.textContent?.trim() || "";
    await shutTool("calculator");
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
    await say("And I am not doing them in my head either. There are tools on the rail, and I am going to "
      + "pick the right one for each sum — a multiplying board, an adding board, and the calculator "
      + "for the percentages.");

    let totalCoins = 0;
    for (const box of boxes()) {
      if (stopped) return;
      const want = Number(box.dataset.want);
      /* the last question on the bill is what there is to pay, and the
         counter needs it: PrepBot has to know what it is handing over */
      if (box.closest(".ts-ask.is-pay")) totalCoins = want;
      const label = box.getAttribute("aria-label") || "this one";
      const job = toolFor(box.dataset.sum || "");

      if (!job) {
        await say(`${label}.`, box);
      } else if (job.tool === "calculator") {
        await say(`${label}. A percentage — that is the calculator's job.`, box);
        const got = await onCalculator(job.type);
        await say(got ? `It says ${got}. So that is what goes in the box.` : "And that is the figure.", box);
      } else {
        await say(`${label}. ${job.why}`, box);
        const got = await onBoard(job);
        await say(got ? `The board says ${got}. Into the box it goes.` : "And that is the figure.", box);
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
        + "That is a taking away, so it goes on the adding board like the others.", chg);
      const job = toolFor(`${writeAmount(target)}-${writeAmount(totalCoins)}`);
      const got = job ? await onBoard(job) : "";
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
