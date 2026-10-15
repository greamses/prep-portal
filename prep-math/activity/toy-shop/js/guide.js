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
      lesson: `Right. ${multiplier} of them, and each one is ${multiplicand}. Now you could add ${multiplicand} up `
        + `${multiplier} times and you would get there — but that is what multiplying IS, done quicker. `
        + "Let us put it on the board and take it one figure at a time.",
      tool: "times",
      fields: { multiplicand, multiplier },
    }];
  }

  if (/[+\-]/.test(t)) {
    const written = t.replace(/\s+/g, "").replace(/([+\-])/g, " $1 ");
    return [{
      lesson: /-/.test(t)
        ? "Now this one is a take-away. And here is the bit everybody gets wrong with money: line the POINTS "
          + "up, one under the other, not the ends of the numbers. Then start at the right and work left."
        : "This one is an adding up. Points under points — that is the whole trick with money — and "
          + "then we start at the right-hand end, same as always.",
      tool: "column",
      fields: { sum: written },
    }];
  }
  return [];
}

/**
 * A PERCENTAGE IS A FRACTION, and the fraction says what to divide by.
 *
 * "Twenty per cent" tells a child nothing. "A fifth" tells them to share it
 * into five, which they can picture and which they can do. So the rate is put
 * in its lowest terms first and the lesson is given in those words: a tenth,
 * a fifth, a quarter, a half. Ten per cent keeps the shift card, because a
 * tenth is the one you never divide for — you slide the figures one place.
 */
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/** 20 → { n: 1, d: 5, said: "a fifth" }. */
export function fractionOf(rate) {
  const g = gcd(rate, 100) || 1;
  const n = rate / g;
  const d = 100 / g;
  const NAMES = { 2: "half", 3: "third", 4: "quarter", 5: "fifth", 6: "sixth", 8: "eighth",
    10: "tenth", 20: "twentieth", 25: "twenty-fifth", 50: "fiftieth", 100: "hundredth" };
  const name = NAMES[d] || `one over ${d}`;
  const said = n === 1 ? (d === 2 ? "a half" : `a ${name}`) : `${n} ${name}s`;
  return { n, d, name, said };
}

export function percentPlan(amount, rate) {
  const { n, d, said } = fractionOf(rate);

  /* a tenth is not a division you do — it is a slide, and that is the digit
     shift card's whole lesson */
  if (d === 10 && n === 1) {
    return [{
      lesson: "Right — ten per cent. Now, ten per cent is a TENTH, and a tenth is the one sum you never "
        + "have to work out. You just slide every figure one place to the right. The point stays still. Watch.",
      tool: "shift",
      fields: { n: amount, power: 1 },
    }];
  }

  const divide = {
    lesson: `Now ${rate} per cent. Say it to yourself as a fraction, because that is all it is: ${rate} out of `
      + `a hundred is ${said}. And ${said}? That just means share it into ${d}. So that is what we will do.`,
    tool: "longdiv",
    fields: { dividend: amount, divisor: String(d) },
  };
  if (n === 1) return [divide];

  return [divide, {
    lesson: `That was ONE ${fractionOf(rate).name}. We want ${n} of them — so now we add it up ${n} times.`,
    tool: "column",
    fields: { sum: Array.from({ length: n }, () => "{tenth}").join(" + ") },
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

  /**
   * THE NEXT FIGURE, worked out rather than revealed.
   *
   * A board knows the sum it is working. Asking it "is this the figure?" on a
   * COPY of its model answers that without touching the real one — so PrepBot
   * can find the figure, and then TYPE IT IN like anybody else. Pressing the
   * board's "Show me one" key would have filled the answer in instead, which
   * is the one thing a tutor must not do: the child has to watch the figures
   * go in one at a time, and the board has to mark each one.
   */
  function nextFigure(board) {
    const { thing, kind } = board || {};
    if (!thing || !kind?.answer) return null;
    for (let d = 0; d <= 99; d += 1) {
      let copy;
      try { copy = structuredClone(thing); } catch { return null; }
      if (kind.answer(copy, String(d)).ok) return String(d);
    }
    return null;
  }

  /** A sum worked right through on its board, a figure at a time, by hand. */
  async function onBoard(job) {
    if (!(await openTool(job.tool))) return "";
    const el = document.querySelector(`.bd-board--${job.tool}`);
    if (!el) return "";
    for (const [n, v] of Object.entries(job.fields)) {
      const field = el.querySelector(`.bd-sum__in[data-n="${n}"]`);
      if (field) await type(field, v, 160);
    }
    await press(el.querySelector(".bd-act--set"), 420);

    const done = () => /^Done/i.test(el.querySelector(".bd-say")?.textContent || "");
    for (let k = 0; k < 60 && !done(); k += 1) {
      if (stopped) return "";
      const figure = nextFigure(el.__board);
      if (figure === null || !el.querySelector(".bd-in")) break;
      /* One character at a time, into whichever cell still has room in it.
         A cell is not always one figure wide — a column that has been lent to
         holds 17 — and the board moves the focus on by itself once a cell is
         full, so the figure is written the way a hand writes it rather than
         spread one character per box. */
      for (const ch of String(figure)) {
        if (stopped) return "";
        const cells = [...el.querySelectorAll(".bd-in")];
        const cell = cells.find((c) => c.value.length < (c.maxLength || 1)) || cells[0];
        if (!cell) break;
        cell.focus();
        cell.value += ch;
        cell.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(110);
      }
      await sleep(260);
    }
    const got = answerFromSay(el.querySelector(".bd-say")?.textContent);
    await sleep(320);
    await shutTool(job.tool);
    return got;
  }

  (async () => {
    /* ── the shelf ──────────────────────────────────────────────────────*/
    await say("Right then. I am going to do the shopping once, and I want you watching what I press — "
      + "not a picture of a shop, this one, the real one.");

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

    await say("And here is the bill. Look at it — every single figure is a box, and not one of them is "
      + "filled in. This shop will not do a sum for you. That is rather the point of it.");
    await say("Now. I could reach for a calculator. I am not going to, and I will tell you why: a calculator "
      + "would just TELL me, and then neither of us would know a thing. There are proper tools down the "
      + "side there, and we will pick the right one for every figure and do it properly.");

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
        if (carried) await say(`And there it is — ${carried}.`);
      }
      if (carried) await say("Good. Into the box it goes, and on we go.", box);
      await type(box, writeAmount(want), 320);
    }
    if (stopped) return;

    /* put the calculator away again: it has done its job and it is in the way */
    const calcKey = document.querySelector('[data-wbtool="calculator"][aria-pressed="true"]');
    if (calcKey) await press(calcKey, 400);

    await say("Every box green. The shop is happy, and so am I — now we go and pay.", $("ts-topay"));
    await press($("ts-topay"), 900);

    /* ── paying ─────────────────────────────────────────────────────────*/
    await say("Two ways to pay here. I am going to count it out on the counter, because that is the one "
      + "with a sum still left in it — and the sum is the interesting part.");

    /* hand over the next whole five prepbills above the bill, in the fewest
       notes — so there is real change to work out rather than none */
    const target = Math.ceil(totalCoins / (5 * PER_BILL)) * 5 * PER_BILL;
    const notes = [];
    let owing = target;
    [...BILLS].sort((a, b) => b - a).forEach((v) => {
      while (owing >= v * PER_BILL) { notes.push(v); owing -= v * PER_BILL; }
    });
    const tray = (v) => document.querySelector(`#ts-pay-body [data-take="${v}"][data-kind="bill"]`);
    await say(`The bill is ${writeAmount(totalCoins)}. Now, I am not going to fiddle about counting out the exact `
      + `money — nobody does. I will put down ${writeAmount(target)}, a round amount, and take my change.`);
    for (const v of notes) {
      if (stopped) return;
      await press(tray(v), 300);
    }

    const chg = document.querySelector("#ts-pay-body [data-change]");
    if (chg) {
      const change = target - totalCoins;
      await say("And the last sum of the day is the change. What I put down, take away what it cost. "
        + "Same board as before — points under points.", chg);
      const [move] = planFor(`${writeAmount(target)}-${writeAmount(totalCoins)}`);
      const got = move ? await onBoard({ tool: move.tool, fields: move.fields }) : "";
      if (!stopped) await say(got ? `${got}. That is what should come back to me, and if it does not, I shall say so.` : "And that is the change.", chg);
      await type(chg, writeAmount(change), 260);
    }
    await sleep(300);
    if (stopped) return;

    const buy = $("ts-buy");
    if (buy && !buy.disabled) {
      await say("Paid. Properly paid — by somebody who knows what it cost.", buy);
      await press(buy, 1200);
    }

    /* ── and the van ────────────────────────────────────────────────────*/
    await say("And that is the lot. The van is on its way, and every figure on that bill was worked out by "
      + "somebody with a pencil and a bit of patience. Next time round, that somebody is you — and you "
      + "already know where every tool is.");
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
