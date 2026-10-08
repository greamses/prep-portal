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
     steps            the learner's turn, one step at a time: { text, done }.
                      `done(seen, b)` looks at the flags seen so far and at
                      what is standing on the bench. A learner who is stuck
                      presses H, and PrepBot says the first step not yet done.
   ========================================================================== */

import { PrepbotTeacher } from "/prep-math/mental-math/shared/prepbot-teacher.js";
import { ICON_PREPBOT } from "/prep-math/mental-math/shared/icons.js";
import { UI } from "/utils/components/ui-icons.js";

const DONE_KEY = "chem-bench-bot-done";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const LESSONS = [
  {
    id: "precipitate",
    name: "Making a precipitate",
    about: "Two clear solutions meet and a solid appears.",
    need: ["ppt:CuOH"],
    steps: [
      { text: "Take a test tube from Glassware and stand it in a rack.", done: (seen, b) => b.count("vessel", "tube") > 0 },
      { text: "Take copper(II) sulfate and sodium hydroxide from Liquids, and pull the stopper out of each bottle.", done: (seen, b) => b.open("cuso4") && b.open("naoh") },
      { text: "Carry the copper(II) sulfate bottle to the mouth of the test tube and hold it there until it pours.", done: (seen) => seen.has("added:cuso4") },
      { text: "Now pour sodium hydroxide into the same tube, and watch for the solid.", done: (seen) => seen.has("ppt:CuOH") },
    ],
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
    steps: [
      { text: "Stand two test tubes in a rack.", done: (seen, b) => b.count("vessel", "tube") > 1 },
      { text: "Pull the stopper out of dilute hydrochloric acid and pour some into the first tube.", done: (seen) => seen.has("added:hcl") },
      { text: "Pull the stopper out of sodium hydroxide and pour some into the second tube.", done: (seen) => seen.has("added:naoh") },
      { text: "Take blue litmus paper from Equipment and hold it in the acid.", done: (seen) => seen.has("test:acid") },
      { text: "Take red litmus paper and hold it in the alkali.", done: (seen) => seen.has("test:alkali") },
    ],
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
    steps: [
      { text: "Take a boiling tube from Glassware.", done: (seen, b) => b.count("vessel", "boil") > 0 },
      { text: "Take zinc from Solids, pull its lid off and tip some into the boiling tube.", done: (seen) => seen.has("added:zn") },
      { text: "Pull the stopper out of dilute hydrochloric acid and pour it on the zinc.", done: (seen) => seen.has("added:hcl") },
      { text: "While it fizzes, take a lighted splint from Equipment and hold it at the mouth of the tube.", done: (seen) => seen.has("test:pop") },
    ],
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
    steps: [
      { text: "Take a beaker from Glassware.", done: (seen, b) => b.count("vessel", "beaker") > 0 },
      { text: "Pour copper(II) sulfate and then sodium hydroxide into the beaker to make the precipitate.", done: (seen) => seen.has("ppt:CuOH") },
      { text: "Take a conical flask and a funnel. Let the funnel go at the mouth of the flask: it stays there.", done: (seen, b) => b.fitted("funnel") },
      { text: "Carry the beaker to the funnel and hold it there until it pours.", done: (seen) => seen.has("filtered") },
    ],
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
    steps: [
      { text: "Take a tripod and an evaporating dish, and stand the dish on the tripod.", done: (seen, b) => b.count("vessel", "dish") > 0 && b.count("rack", "tripod") > 0 },
      { text: "Pull the stopper out of copper(II) sulfate and pour some into the dish.", done: (seen) => seen.has("added:cuso4") },
      { text: "Take a burner from Equipment and press its plus key to light it.", done: (seen, b) => b.lit() },
      { text: "Hold the burner under the dish, and keep it there until all the water has gone.", done: (seen) => seen.has("crystals") },
    ],
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
        <button class="mm-prepbot-menu-btn" data-b="ask" type="button" title="Ask PrepBot: where is a piece, or have it fetched" aria-label="Ask PrepBot a question"></button>
        <button class="mm-prepbot-menu-btn" data-b="voice" type="button" title="Beep or talking voice" aria-label="Toggle beep or talking voice"></button>
        <button class="mm-prepbot-menu-btn" data-b="sleep" type="button" title="Sleep" aria-label="Sleep PrepBot"></button>
        <button class="mm-prepbot-menu-btn" data-b="poke" type="button" title="Wiggle" aria-label="Wiggle PrepBot"></button>
      </div>
      <div class="mm-prepbot-avatar" aria-hidden="true"></div>
    </div>
    <button type="button" class="cl-ico cl-bot-ask" data-tip="Ask PrepBot a question, or have a piece fetched (A)" aria-label="Ask PrepBot a question">A</button>
    <button type="button" class="cl-ico cl-bot-help" data-tip="Stuck? PrepBot says what to do next (H)" aria-label="Help: what do I do next?">H</button>
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
      await speak("Now it is your turn. I will clear the bench. Take the same things from the drawer and do what I did. If you get stuck, press H and I will tell you what to do next.", mine);
      bench.clear();
      turn = { lesson, seen: new Set() };
      renderList();
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
    if (!turn.lesson.need.every((f) => turn.seen.has(f))) { renderList(); return; }
    const { lesson } = turn;
    turn = null;
    if (!done.includes(lesson.id)) { done.push(lesson.id); try { localStorage.setItem(DONE_KEY, JSON.stringify(done)); } catch { /* private mode */ } }
    renderList();
    teacher.show();
    teacher.speak([{ text: `You did it! That is exactly what I got. ${lesson.about}`, mode: "speech" }], { colorSeed: lines++ });
    teacher.poke?.();
  };

  // ── stuck? H, or the H key beside PrepBot ──
  /** The step of the learner's turn to do now: the first one not done after the last one that is. */
  function nextOf(t) {
    const did = t.lesson.steps.map((st) => Boolean(st.done(t.seen, bench)));
    const i = did.indexOf(false, did.lastIndexOf(true) + 1);
    return { did, i };
  }
  function help() {
    if (bench.isBusy()) return;
    let text;
    if (turn) {
      const { i } = nextOf(turn);
      const st = turn.lesson.steps[i];
      text = st ? `${i === 0 ? "Start here." : `Step ${i + 1}.`} ${st.text}` : "You have done every step. Look at what is in front of you: is it what I got?";
    } else {
      const p = bench.nextStep();
      text = !p ? "Nothing has been chosen yet. Open the practicals, or press my picture at the top, and press Try on one of the cards."
        : p.done ? `You have finished ${p.title}. Choose another practical when you are ready.`
        : `${p.n === 1 ? "Start here." : `Step ${p.n} of ${p.of}.`} ${p.text}`;
    }
    teacher.show();
    teacher.speak([{ text, mode: "speech" }], { colorSeed: lines++ });
  }
  root.querySelector(".cl-bot-help").addEventListener("click", help);
  root.querySelector(".cl-bot-ask").addEventListener("click", () => teacher.openChat());
  window.addEventListener("keydown", (e) => {
    if (e.key !== "h" && e.key !== "H") return;
    if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    e.preventDefault();
    help();
  });

  // ── A: the site's PrepBot chat, as a small window beside PrepBot ──
  // (the window itself is the shared teacher's; this is only what the BENCH
  // tells it.) The chat asks the page first: "where is the burette?" and "get
  // me a beaker" are answered here, by pointing into the drawer or by taking
  // the piece out — no AI needed. Everything else goes to the AI, which is told
  // what the drawer holds and what is standing on the bench.
  const norm = (s) => ` ${String(s).toLowerCase().replace(/(\d)([a-z])/g, "$1 $2").replace(/[^a-z0-9]+/g, " ").trim()} `;
  const EXTRA = {
    tube: ["test tube", "tube"], flask: ["conical flask", "flask"], cyl100: ["measuring cylinder", "cylinder"], distflask: ["distillation flask"],
    rack: ["rack"], stand: ["retort stand", "clamp stand", "stand", "clamp", "retort"], balance: ["balance", "scale", "weighing balance"],
    burner: ["burner", "bunsen"], spirit: ["spirit lamp"], tubing: ["delivery tube"], bung: ["stopper", "bung", "cork"], lit: ["splint"], blue: ["litmus paper", "litmus"],
    electrode: ["electrode", "carbon rod"], power: ["power pack", "battery", "power supply"], rod: ["glass rod", "stirring rod", "stirrer"], wire: ["flame test wire", "wire"],
    condenser: ["condenser"], funnel: ["filter paper", "filter funnel"], water: ["water"], hcl: ["acid"], naoh: ["alkali"], nh3: ["ammonia solution", "ammonia"],
    unk: ["unknown salt", "unknown", "sample x"], caco3: ["calcium carbonate", "marble"], mno2: ["manganese dioxide", "manganese oxide"], h2o2: ["hydrogen peroxide", "peroxide"], oil: ["oil"],
    mg: ["magnesium"], zn: ["zinc"], fe: ["iron"], cu: ["copper"], cuo: ["copper oxide"],
  };
  const stock = bench.catalog();
  const words = [];
  stock.forEach((c, order) => {
    const set = new Set([c.name, c.name.replace(/\(.*?\)/g, " "), c.name.replace(/ and .*/, ""), ...(EXTRA[c.key] || [])]);
    if (c.kind === "reagent") {
      const bare = c.name.replace(/^dilute |^aqueous | solution$/gi, "");
      set.add(bare);
      set.add(bare.replace(/\((ii|iii|iv)\)/i, " "));
      set.add(c.formula.replace(/[^A-Za-z0-9]/g, ""));
    }
    [...set].map((w) => norm(w).trim()).filter((w) => w.length > 1).forEach((w) => words.push({ w, c, order }));
  });
  words.sort((x, y) => y.w.length - x.w.length || x.order - y.order);
  const COUNT = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
  const sizes = (c) => c.name.match(/\d+/g) || [];
  const family = (c) => c.name.replace(/\(.*?\)/g, "").trim();
  /** Every piece named in a sentence, with how many: [{ c, n }]. The longest name wins a word it shares. */
  function named(text) {
    const whole = norm(text);
    let rest = whole;
    const out = [];
    for (const { w, c } of words) {
      if (out.some((o) => o.c === c)) continue;
      const hit = new RegExp(` ${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(e?s)? `).exec(rest);
      if (!hit) continue;
      // "a 250 mL beaker": the size may be said before the name, so look for it anywhere in the sentence
      const kin = stock.filter((k) => k.kind === c.kind && family(k) === family(c));
      const sized = kin.find((k) => sizes(k).length && sizes(k).every((d) => whole.includes(` ${d} `)));
      const pick = sized && !sizes(c).every((d) => whole.includes(` ${d} `)) ? sized : c;
      // "two test tubes", "3 250 mL beakers": the word just before the name, sizes aside
      const before = rest.slice(0, hit.index).trim().split(" ");
      while (before.length && (before[before.length - 1] === "ml" || sizes(pick).includes(before[before.length - 1]))) before.pop();
      const word = before.pop() || "";
      const said = COUNT[word] || (word.length === 1 && "123456".includes(word) ? Number(word) : 0);
      if (!out.some((o) => o.c === pick)) out.push({ c: pick, n: said || 1 });
      rest = `${rest.slice(0, hit.index)} # ${rest.slice(hit.index + hit[0].length)}`;
    }
    return out;
  }
  const FETCH = /\b(get|give|bring|fetch|pass|hand|grab|take out|put|place|add|i need|i want|can i have|may i have|could i have|let me have)\b/i;
  const WHERE = /\b(where|find|locate|look for|looking for|which (part|tab|section|drawer)|can ?not find|can't find|cant find)\b/i;
  const listOf = (cs) => cs.map(({ c, n }) => (n > 1 ? `${n} × ${c.name.toLowerCase()}` : c.name.toLowerCase())).join(cs.length > 2 ? ", " : " and ");
  let lastAsked = [];
  window.__prepbotPage = {
    title: "the Chemistry Bench",
    context() {
      const parts = ["Glassware", "Equipment", "Liquids", "Solids"].map((p) => `${p}: ${stock.filter((c) => c.part === p).map((c) => c.name + (c.formula && c.formula.length > 1 && c.kind === "reagent" ? ` (${c.formula})` : "")).join(", ")}.`).join("\n");
      const on = bench.standing();
      const exp = bench.chosen();
      const step = bench.nextStep();
      return `The student is on the Chemistry Bench, a 2D chemistry lab on this site. Nothing is set up for them: they take loose pieces from the DRAWER on the right and assemble the experiment themselves.
THE DRAWER has four parts (the rail on its left edge), and a search box at the top. An arrow on the edge of the bench hides and shows the drawer.
${parts}
HOW THE BENCH WORKS: drag a piece to move it. Carry a bottle or a tool to a vessel and hold it there to use it. A bottle will not pour until its stopper is pulled out. Let a funnel, stopper, delivery tube, condenser or electrode go at a mouth and it stays fitted. Burners are lit and turned up with the + key on their base. A burette or a separating funnel hangs in the retort stand's clamp. A chosen piece shows a handle to tilt it and a "..." menu. The icons at the top left are: the Guide to the chosen practical, the lab notebook, the list of WAEC practicals, and PrepBot's demonstrations. Pressing H gives the next step.
ON THE BENCH NOW: ${on.length ? on.join(", ") : "nothing"}.
${exp ? `CHOSEN PRACTICAL: ${exp.title}. Task: ${exp.task} It needs: ${exp.needs}.${step && !step.done ? ` Next step: ${step.text}` : ""}` : "No practical has been chosen."}
YOU CAN FETCH PIECES: if the student wants a piece, tell them to type "get me" and its name (for example "get me a 250 mL beaker and sodium hydroxide") and it is put on the bench for them. Only name pieces that are in the drawer lists above.`;
    },
    async handle(text) {
      let found = named(text);
      const fetch = FETCH.test(text), where = WHERE.test(text);
      if (!found.length && lastAsked.length && /^\s*(yes|ok|okay|please|yes please|get it|bring it|get them|bring them|fetch it|do it)\b/i.test(text)) return give(lastAsked);
      if (!found.length || (!fetch && !where)) return null;      // a real question: the AI's
      if (where) {
        lastAsked = found;
        bench.point(found[0].c);
        const lines = found.map(({ c }) => `${c.name} is in the drawer under ${c.part}.`);
        return `${lines.join(" ")} I have opened that part of the drawer and marked ${found.length > 1 ? "the first one" : "it"}. Shall I put ${found.length > 1 ? "them" : "it"} on the bench for you? Say "get it".`;
      }
      return give(found);
    },
  };
  async function give(cs) {
    if (bench.isBusy()) return "Let me finish this experiment first, then ask me again.";
    lastAsked = [];
    const got = cs.slice(0, 6);
    let room = 8;       // never more than a benchful at once
    for (const { c, n } of got) for (let i = 0; i < n && room > 0; i++, room--) await bench.bring(c);
    const bottles = got.some(({ c }) => c.kind === "reagent");
    return `Here you are: ${listOf(got)}. ${got.length > 1 || got[0].n > 1 ? "They are" : "It is"} on the bench now.${bottles ? " Pull the stopper out of a bottle before you pour from it." : ""}`;
  }

  const list = document.getElementById("cl-bot-list");
  const turnBox = document.getElementById("cl-bot-turn");
  function renderList() {
    list.innerHTML = LESSONS.map((l, n) => {
      const mine = turn && turn.lesson === l;
      return `<li class="cl-card pp-sticky pp-sticky--c${n % 6}${mine ? " is-on" : ""}">
        <img src="shots/bot-${l.id}.jpg" alt="" width="400" height="250" loading="lazy" />
        <h3>${esc(l.name)}${done.includes(l.id) ? `<span class="cl-card__done">${UI.check(14)}</span>` : ""}</h3>
        <p>${esc(l.about)}</p>
        <button type="button" class="cl-try" data-lesson="${l.id}" aria-label="Try: ${esc(l.name)}. PrepBot does it first.">${mine ? "Try again" : "Try"}</button>
      </li>`;
    }).join("");
    turnBox.hidden = !turn;
    if (!turn) return;
    const { did, i } = nextOf(turn);
    turnBox.innerHTML = `<h3>Your turn: ${esc(turn.lesson.name)}</h3>
      <ol>${turn.lesson.steps.map((st, k) => `<li class="${did[k] ? "is-done" : k === i ? "is-next" : ""}">${esc(st.text)}</li>`).join("")}</ol>
      <p>Stuck? Press <kbd>H</kbd> and PrepBot tells you what to do next.</p>`;
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
    teacher.speak([{ text: "Hello! Press my picture at the top and I will do an experiment for you to copy. Stuck? Press H. To ask me anything, or have me fetch a piece, press A.", mode: "speech" }]);
  }
}
