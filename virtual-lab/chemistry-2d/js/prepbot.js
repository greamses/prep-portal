/* ============================================================================
   CHEMISTRY BENCH — PrepBot
   ----------------------------------------------------------------------------
   The shared teaching mascot (prep-math/mental-math/shared/prepbot-teacher.js),
   the same character as everywhere else on the site. Here it works LIVE ON THE
   BENCH: it takes the real pieces out of the drawer, pulls the real stoppers,
   pours, heats and tests with them, and says what it is doing and why. There
   is no film of an experiment; the experiment is done in front of the learner
   with the same things the learner will use.

   Then it clears the bench and it is the learner's turn. PrepBot watches what
   is written in the notebook, and says so when the same result turns up.

   A LESSON is { id, name, about, need, turn, run }:
     run({ say, b })  the demonstration — `say` speaks a line and waits for it;
                      `b` is the bench's own hands (main.js `actor`)
     need             the notebook flags that mean the learner has done it too
     turn             the steps, in words, shown while it is the learner's turn
   ========================================================================== */

import { PrepbotTeacher } from "/prep-math/mental-math/shared/prepbot-teacher.js";
import { ICON_PREPBOT, ICON_PLAY } from "/prep-math/mental-math/shared/icons.js";
import { UI } from "/utils/components/ui-icons.js";

const DONE_KEY = "chem-bench-bot-done";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const LESSONS = [
  {
    id: "precipitate",
    name: "Making a precipitate",
    about: "Two clear solutions meet and a solid appears.",
    need: ["ppt:CuOH"],
    turn: ["Stand a test tube in a rack.", "Take out copper(II) sulfate and sodium hydroxide, and pull out both stoppers.", "Pour a measure of copper(II) sulfate into the tube, then a measure of sodium hydroxide."],
    async run({ say, b }) {
      await say("Let us make a precipitate: a solid that appears when two solutions are mixed.");
      const rack = await b.take("rack", "rack", 250, b.BASE);
      const tube = await b.take("vessel", "tube", 250, b.BASE - 12);
      await b.into(tube, rack, 2);
      await say("First a test tube, standing in the rack.");
      const cu = await b.take("reagent", "cuso4", 110, b.TOP);
      const na = await b.take("reagent", "naoh", 240, b.TOP);
      await say("Copper(II) sulfate solution is blue. Sodium hydroxide solution has no colour.");
      await b.uncap(cu);
      await say("A bottle will not pour with its stopper in. So the stopper comes out first.");
      await b.pour(cu, tube);
      await say("One measure of copper(II) sulfate goes into the tube.");
      await b.uncap(na);
      await b.pour(na, tube);
      await say("Look at that! A pale blue solid. It is copper(II) hydroxide, which does not dissolve in water. A solid that forms like this is called a precipitate.");
      await b.pour(na, tube, 2);
      await say("More sodium hydroxide makes no difference. This precipitate does not dissolve in excess.");
    },
  },
  {
    id: "litmus",
    name: "Acid or alkali?",
    about: "Litmus paper tells an acid from an alkali.",
    need: ["test:acid", "test:alkali"],
    turn: ["Put an acid in one test tube and an alkali in another.", "Dip blue litmus paper in the acid.", "Dip red litmus paper in the alkali."],
    async run({ say, b }) {
      await say("How do you tell an acid from an alkali? They can look exactly the same. Litmus paper knows.");
      const rack = await b.take("rack", "rack", 250, b.BASE);
      const a = await b.take("vessel", "tube", 200, b.BASE - 12);
      await b.into(a, rack, 1);
      const k = await b.take("vessel", "tube", 300, b.BASE - 12);
      await b.into(k, rack, 3);
      const hcl = await b.take("reagent", "hcl", 110, b.TOP);
      const na = await b.take("reagent", "naoh", 240, b.TOP);
      await b.uncap(hcl);
      await b.pour(hcl, a, 2);
      await b.uncap(na);
      await b.pour(na, k, 2);
      await say("Hydrochloric acid in the first tube, sodium hydroxide in the second. Both are colourless.");
      const blue = await b.take("tool", "blue", 520, b.BASE);
      const red = await b.take("tool", "red", 580, b.BASE);
      await b.hold(blue, a, 1500);
      await say("Blue litmus turns red in the acid. Acids turn blue litmus red.");
      await b.hold(red, k, 1500);
      await say("And red litmus turns blue in the alkali. Alkalis turn red litmus blue.");
    },
  },
  {
    id: "hydrogen",
    name: "Making hydrogen",
    about: "A metal in an acid gives a gas that burns with a pop.",
    need: ["test:pop"],
    turn: ["Put some zinc in a boiling tube.", "Pour dilute hydrochloric acid on it.", "While it fizzes, hold a lighted splint at the mouth of the tube."],
    async run({ say, b }) {
      await say("Some metals fizz in an acid. Let us find out what the gas is.");
      const tube = await b.take("vessel", "boil", 300, b.BASE);
      const zn = await b.take("reagent", "zn", 110, b.TOP + 22);
      const hcl = await b.take("reagent", "hcl", 240, b.TOP);
      await b.uncap(zn);
      await b.pour(zn, tube);
      await say("A little zinc goes into a boiling tube.");
      await b.uncap(hcl);
      await b.pour(hcl, tube);
      await say("Now the acid. See the bubbles? A gas is coming off. It has no colour, so we have to test it.");
      const lit = await b.take("tool", "lit", 520, b.BASE);
      await b.hold(lit, tube, 1700);
      await say("A squeaky pop! That is the test for hydrogen. Zinc is more reactive than hydrogen, so it pushes hydrogen out of the acid.");
    },
  },
  {
    id: "filter",
    name: "Filtering",
    about: "A funnel and filter paper take a solid out of a liquid.",
    need: ["filtered"],
    turn: ["Make a precipitate in a beaker.", "Let a funnel go at the mouth of a flask: it stays there.", "Carry the beaker to the funnel and hold it there to pour."],
    async run({ say, b }) {
      await say("A precipitate floats about in its liquid. Filtering takes it out.");
      const bk = await b.take("vessel", "beaker100", 250, b.BASE);
      const cu = await b.take("reagent", "cuso4", 110, b.TOP);
      const na = await b.take("reagent", "naoh", 240, b.TOP);
      await b.uncap(cu);
      await b.pour(cu, bk);
      await b.uncap(na);
      await b.pour(na, bk);
      await say("Here is the pale blue precipitate again, this time in a beaker.");
      const fl = await b.take("vessel", "flask", 500, b.BASE);
      const fu = await b.take("tool", "funnel", 620, b.BASE - 60);
      await b.fit(fu, fl);
      await say("A funnel with filter paper sits in the mouth of a flask.");
      await b.pour(bk, fl, 6);
      await say("The blue solid cannot get through the paper. It stays behind: that is the residue. The clear liquid in the flask is the filtrate.");
    },
  },
  {
    id: "crystals",
    name: "Crystals from a solution",
    about: "Boil the water away and the salt is left.",
    need: ["crystals"],
    turn: ["Stand an evaporating dish on a tripod.", "Pour in some copper(II) sulfate solution.", "Turn a burner up with its + key and hold it under the dish until the water has gone."],
    async run({ say, b }) {
      await say("There is a solid hidden in every salt solution. Let us get it back.");
      const tp = await b.take("rack", "tripod", 330, b.BASE + 20);
      const dish = await b.take("vessel", "dish", 330, b.BASE - 140);
      await b.into(dish, tp, 0);
      await say("An evaporating dish stands on a tripod and gauze.");
      const cu = await b.take("reagent", "cuso4", 110, b.TOP);
      await b.uncap(cu);
      await b.pour(cu, dish, 2);
      await say("Blue copper(II) sulfate solution goes into the dish.");
      const bn = await b.take("tool", "burner", 560, b.BASE + 20);
      await b.flame(bn, 2);
      await say("The burner is turned up with its plus key.");
      await b.heat(bn, dish);
      await say("The water has boiled away, and blue crystals are left. Only the water can leave: the salt stays behind.");
    },
  },
];

class Stopped extends Error {}

export async function initPrepbot(bench) {
  const wrap = document.getElementById("cl-benchwrap");
  const root = document.createElement("div");
  root.className = "mm-prepbot cl-prepbot";
  root.innerHTML = `
    <div class="mm-prepbot-bubble mm-prepbot-bubble--speech mm-prepbot-bubble--hidden" aria-hidden="true"><p></p></div>
    <div class="mm-prepbot-avatar-wrap">
      <div class="mm-prepbot-menu">
        <button class="mm-prepbot-menu-btn" data-b="ask" type="button" title="Ask PrepBot a question" aria-label="Ask PrepBot a question"></button>
        <button class="mm-prepbot-menu-btn" data-b="voice" type="button" title="Beep or talking voice" aria-label="Toggle beep or talking voice"></button>
        <button class="mm-prepbot-menu-btn" data-b="sleep" type="button" title="Sleep" aria-label="Sleep PrepBot"></button>
        <button class="mm-prepbot-menu-btn" data-b="poke" type="button" title="Wiggle" aria-label="Wiggle PrepBot"></button>
      </div>
      <div class="mm-prepbot-avatar" aria-hidden="true"></div>
    </div>
    <button type="button" class="cl-ico cl-bot-stop" data-tip="Stop PrepBot" aria-label="Stop PrepBot" hidden>${UI.close(16)}</button>`;
  wrap.appendChild(root);
  const q = (k) => root.querySelector(`[data-b="${k}"]`);

  let auth = null;
  try { auth = (await import("/firebase-init.js")).auth || null; } catch { /* the free voice */ }
  const teacher = new PrepbotTeacher({ root, boundsEl: wrap, auth, menu: { ask: q("ask"), voice: q("voice"), sleep: q("sleep"), poke: q("poke") } });
  import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm")
    .then((m) => { teacher.gsap = m.default || m.gsap || m; teacher.scheduleIdle(); })
    .catch(() => { /* no idle animation; everything else still works */ });

  let done = [];
  try { done = JSON.parse(localStorage.getItem(DONE_KEY) || "[]"); } catch { /* none yet */ }
  let token = 0;          // every start and stop makes a new one; a demonstration that is not the latest stops
  let lines = 0;
  let turn = null;        // the lesson the learner is repeating, and what has been seen so far
  const stopKey = root.querySelector(".cl-bot-stop");

  /** Say one line and wait until it has been said. */
  async function speak(text, mine) {
    if (mine !== token) throw new Stopped();
    teacher.show();
    teacher.speak([{ text, mode: "speech" }], { colorSeed: lines++ });
    try { await teacher.narrationDone; } catch { /* cut short */ }
    if (mine !== token) throw new Stopped();
    await new Promise((r) => setTimeout(r, 260));
    if (mine !== token) throw new Stopped();
  }
  // the bench's hands, but every move first checks that PrepBot has not been stopped
  const hands = (mine) => new Proxy(bench, {
    get(target, prop) {
      const v = target[prop];
      if (typeof v !== "function") return v;
      return async (...args) => { if (mine !== token) throw new Stopped(); const out = await v.apply(target, args); if (mine !== token) throw new Stopped(); return out; };
    },
  });

  function stop() {
    token++;
    teacher.stop();
    bench.busy(false);
    stopKey.hidden = true;
  }
  stopKey.addEventListener("click", () => { stop(); teacher.show(); teacher.speak([{ text: "Stopped. Carry on yourself, or pick another experiment.", mode: "speech" }]); });

  async function play(lesson) {
    stop();
    const mine = ++token;
    turn = null;
    bench.closeSheets();
    bench.busy(true);
    stopKey.hidden = false;
    bench.clear();
    try {
      await lesson.run({ say: (t) => speak(t, mine), b: hands(mine) });
      await speak("Now it is your turn. I will clear the bench. Take the same things from the drawer and do what I did. I am watching.", mine);
      bench.clear();
      turn = { lesson, seen: new Set() };
      renderList();
      bench.openSheet("cl-sheet-bot");
    } catch (e) {
      if (!(e instanceof Stopped)) throw e;
    } finally {
      if (mine === token) { bench.busy(false); stopKey.hidden = true; }
    }
  }

  // what the learner does is written in the notebook; PrepBot reads it over their shoulder
  bench.onRecord = (flags) => {
    if (!turn || bench.isBusy()) return;
    flags.forEach((f) => turn.seen.add(f));
    if (!turn.lesson.need.every((f) => turn.seen.has(f))) return;
    const { lesson } = turn;
    turn = null;
    if (!done.includes(lesson.id)) { done.push(lesson.id); try { localStorage.setItem(DONE_KEY, JSON.stringify(done)); } catch { /* private mode */ } }
    renderList();
    teacher.show();
    teacher.speak([{ text: `You did it! That is exactly what I got. ${lesson.about}`, mode: "speech" }], { colorSeed: lines++ });
    teacher.poke?.();
  };

  const list = document.getElementById("cl-bot-list");
  function renderList() {
    list.innerHTML = LESSONS.map((l) => {
      const mine = turn && turn.lesson === l;
      return `<li class="cl-lesson${mine ? " is-turn" : ""}">
        <button type="button" class="cl-ico cl-ico--paper cl-lesson__play" data-lesson="${l.id}" data-tip="${mine ? "Watch it again" : "Watch PrepBot do it"}" aria-label="Watch PrepBot do: ${esc(l.name)}">${ICON_PLAY}</button>
        <div><h3>${esc(l.name)}${done.includes(l.id) ? `<span class="cl-lesson__done">${UI.check(14)}</span>` : ""}</h3>
          <p>${esc(l.about)}</p>
          ${mine ? `<p class="cl-lesson__turn">Your turn:</p><ol>${l.turn.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : ""}</div>
      </li>`;
    }).join("");
  }
  list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lesson]");
    if (b) play(LESSONS.find((l) => l.id === b.dataset.lesson));
  });
  renderList();
  document.getElementById("cl-bot").insertAdjacentHTML("afterbegin", ICON_PREPBOT.replace("<svg ", '<svg width="26" height="26" '));

  // a first hello, only on an empty bench
  if (bench.isEmptyBench()) {
    teacher.show();
    teacher.speak([{ text: "Hello! Press my picture at the top and I will do an experiment for you to copy.", mode: "speech" }]);
  }
}
