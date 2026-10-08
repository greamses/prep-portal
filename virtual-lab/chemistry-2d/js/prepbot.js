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
import { EXPERIMENTS } from "./waec.js";

/* A SETTING-UP lesson is the demonstration of a setting-up practical (waec.js, group "setup").
   The learner's turn is that practical's own steps, and it is done when every piece is in
   place: nothing is written in the notebook when a clamp is slid or a flask stood under a tip,
   so the bench is asked (bench.setupSteps) instead of the notebook being read. */
const setupSteps = (id) => (EXPERIMENTS.find((e) => e.id === id) || { steps: [] }).steps.map((st, i) => ({ text: st.text, done: (seen, b) => Boolean((b.setupSteps(id)[i] || {}).done) }));

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
    about: "A funnel with a filter paper in it takes a solid out of a liquid.",
    need: ["filtered"],
    steps: [
      { text: "Take a beaker from Glassware.", done: (seen, b) => b.count("vessel", "beaker") > 0 },
      { text: "Pour copper(II) sulfate and then sodium hydroxide into the beaker to make the precipitate.", done: (seen) => seen.has("ppt:CuOH") },
      { text: "Take a conical flask and a filter funnel. Let the funnel go at the mouth of the flask: it stays there.", done: (seen, b) => b.fitted("funnel") },
      { text: "Take a filter paper and let it go at the funnel. It folds into a cone and sits inside.", done: (seen, b) => b.fitted("paper") },
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
      await say("A glass funnel sits in the mouth of a flask.");
      const fp = await b.take("tool", "paper", 700, b.BASE);
      await say("This is a filter paper: a flat disc. It is folded in half, then in half again, and opened into a cone.");
      await b.fit(fp, fu);
      await say("The cone sits in the funnel, three layers of paper on one side and one on the other.");
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
  // ── the separating techniques ──
  // (laid out across the bench: `at` squeezes the layout on a narrow screen)
  {
    id: "sandsalt",
    name: "Sand from salt",
    about: "Dissolve, filter, evaporate: three techniques, one after another.",
    need: ["dissolved:salt", "filtered", "crystals"],
    steps: [
      { text: "Tip some of the sand and salt mixture (in Solids) into a beaker.", done: (seen) => seen.has("added:sandsalt") },
      { text: "Pour in distilled water. The salt dissolves; the sand does not.", done: (seen) => seen.has("dissolved:salt") },
      { text: "Stir with a glass rod, so that the sand is carried in the water.", done: (seen) => seen.has("swirled") },
      { text: "Fit a funnel in a flask, and let a filter paper go at the funnel.", done: (seen, b) => b.fitted("paper") },
      { text: "Pour the mixture through the funnel. The sand is caught by the paper.", done: (seen) => seen.has("filtered") },
      { text: "Stand an evaporating dish on a tripod. Lift the funnel out of the flask and pour the filtrate into the dish.", done: (seen, b) => b.count("vessel", "dish") > 0 && b.count("rack", "tripod") > 0 },
      { text: "Light a burner and hold it under the dish until the water has gone.", done: (seen) => seen.has("crystals") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Sand and salt, mixed. How do we get each one back? We use what is different about them.");
      const bk = await b.take("vessel", "beaker100", at(120), b.BASE);
      const mix = await b.take("reagent", "sandsalt", at(0), b.TOP + 22);
      const w = await b.take("reagent", "water", at(120), b.TOP);
      await b.uncap(mix);
      await b.pour(mix, bk);
      await say("Some of the mixture goes into a beaker.");
      await b.uncap(w);
      await b.pour(w, bk, 3);
      await say("Now water. Salt dissolves in water. Sand does not: look at it lying on the bottom.");
      const rod = await b.take("tool", "rod", at(250), b.BASE);
      await b.hold(rod, bk, 1300);
      await say("I stir it, so the sand is carried in the water when I pour.");
      const fl = await b.take("vessel", "flask100", at(360), b.BASE);
      const fu = await b.take("tool", "funnel", at(360), b.BASE - 220);
      await b.fit(fu, fl);
      const fp = await b.take("tool", "paper", at(470), b.BASE);
      await b.fit(fp, fu);
      await say("A funnel in a flask, and a filter paper folded into the funnel.");
      await b.pour(bk, fl, 12);
      await say("The sand cannot pass through the paper. It is the residue. The salt solution runs through: the filtrate.");
      const tp = await b.take("rack", "tripod", at(600), b.BASE + 20);
      const dish = await b.take("vessel", "dish", at(600), b.BASE - 140);
      await b.into(dish, tp, 0);
      await b.lift(fu, at(470), b.BASE - 30);
      await b.pour(fl, dish, 6);
      await say("The filtrate goes into an evaporating dish on a tripod.");
      const bn = await b.take("tool", "burner", at(740), b.BASE + 20);
      await b.flame(bn, 3);
      await b.heat(bn, dish);
      await say("The water has boiled away and white salt is left. Dissolving, filtering, evaporating: sand in the paper, salt in the dish.");
    },
  },
  {
    id: "decant",
    name: "Decanting",
    about: "Pour a liquid off a solid that has settled.",
    need: ["decanted"],
    steps: [
      { text: "Tip sand (in Solids) into a beaker.", done: (seen) => seen.has("added:sand") },
      { text: "Pour in distilled water. Do not stir: leave the sand on the bottom.", done: (seen) => seen.has("added:water") },
      { text: "Take a second beaker.", done: (seen, b) => b.count("vessel", "beaker") > 1 },
      { text: "Carry the first beaker to the second and pour the water off. The sand stays behind.", done: (seen) => seen.has("decanted") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Sometimes there is no need for a filter. If the solid has settled, the liquid can simply be poured off it.");
      const bk = await b.take("vessel", "beaker250", at(140), b.BASE);
      const sd = await b.take("reagent", "sand", at(0), b.TOP + 22);
      const w = await b.take("reagent", "water", at(120), b.TOP);
      await b.uncap(sd);
      await b.pour(sd, bk);
      await b.uncap(w);
      await b.pour(w, bk, 4);
      await say("Sand and water. I do not stir. The sand is heavy and lies on the bottom.");
      const b2 = await b.take("vessel", "beaker250", at(380), b.BASE);
      await say("A second beaker, to take the water.");
      await b.pour(bk, b2, 3);
      await say("The water pours off and the sand stays where it was. That is decanting. It is quick, but a little water is always left with the sand.");
    },
  },
  {
    id: "magnet",
    name: "Iron from sulfur",
    about: "A magnet picks one substance out of a mixture.",
    need: ["magnet"],
    steps: [
      { text: "Take an evaporating dish.", done: (seen, b) => b.count("vessel", "dish") > 0 },
      { text: "Tip iron filings and sulfur powder (both in Solids) into the dish.", done: (seen) => seen.has("added:fe") && seen.has("added:sulfur") },
      { text: "Take the horseshoe magnet from Equipment.", done: (seen, b) => b.count("tool", "magnet") > 0 },
      { text: "Hold the magnet over the dish. The iron jumps to it.", done: (seen) => seen.has("magnet") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Grey iron filings and yellow sulfur powder, stirred together. They are mixed, but they have not joined.");
      const dish = await b.take("vessel", "dish", at(200), b.BASE);
      const fe = await b.take("reagent", "fe", at(0), b.TOP + 22);
      const su = await b.take("reagent", "sulfur", at(120), b.TOP + 22);
      await b.uncap(fe);
      await b.pour(fe, dish);
      await b.uncap(su);
      await b.pour(su, dish);
      await say("Both go into a dish. Each still has its own properties, and one of iron's is that a magnet pulls it.");
      const mg = await b.take("tool", "magnet", at(380), b.BASE);
      await b.hold(mg, dish, 1500);
      await say("The iron jumps to the magnet and the sulfur is left. Nothing has changed into anything else. That is how we know it was only a mixture.");
    },
  },
  {
    id: "sublime",
    name: "Iodine from sand",
    about: "A solid that turns straight to vapour leaves the other one behind.",
    need: ["sublimed"],
    steps: [
      { text: "Take a dry boiling tube.", done: (seen, b) => b.count("vessel", "boil") > 0 },
      { text: "Tip iodine crystals and sand (both in Solids) into it.", done: (seen) => seen.has("added:iodine") && seen.has("added:sand") },
      { text: "Take a burner and press its plus key to light it.", done: (seen, b) => b.lit() },
      { text: "Hold the burner under the tube, and watch the top of the glass.", done: (seen) => seen.has("sublimed") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Dark iodine crystals mixed with sand. Water will not help us here. Heat will.");
      const tb = await b.take("vessel", "boil", at(200), b.BASE);
      const io = await b.take("reagent", "iodine", at(0), b.TOP + 22);
      const sd = await b.take("reagent", "sand", at(120), b.TOP + 22);
      await b.uncap(io);
      await b.pour(io, tb);
      await b.uncap(sd);
      await b.pour(sd, tb);
      await say("Both go into a dry boiling tube. No water at all.");
      const bn = await b.take("tool", "burner", at(380), b.BASE + 20);
      await b.flame(bn, 2);
      await say("A gentle flame under the tube. Watch the glass near the top.");
      await b.heat(bn, tb);
      await say("Purple vapour, and then dark shiny crystals on the cool glass. Iodine goes straight from solid to vapour and back: it sublimes. The sand has not moved.");
    },
  },
  {
    id: "chroma",
    name: "The dyes in black ink",
    about: "Paper chromatography pulls an ink apart into its colours.",
    need: ["chroma"],
    steps: [
      { text: "Take a 100 mL beaker.", done: (seen, b) => b.count("vessel", "beaker100") > 0 },
      { text: "Pour in a LITTLE distilled water: one measure, no more.", done: (seen) => seen.has("added:water") },
      { text: "Take the chromatography paper from Equipment and let it go at the mouth of the beaker.", done: (seen, b) => b.fitted("chroma") },
      { text: "Watch the water climb the paper. If the ink washes off, there was too much water: take a fresh strip from its note.", done: (seen) => seen.has("chroma") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Black ink looks like one colour. Is it? Paper chromatography will tell us.");
      const bk = await b.take("vessel", "beaker100", at(200), b.BASE);
      const w = await b.take("reagent", "water", at(40), b.TOP);
      await b.uncap(w);
      await b.pour(w, bk, 1);
      await say("A little water in a beaker. Only a little: it must not reach the ink.");
      const cp = await b.take("tool", "chroma", at(380), b.BASE - 120);
      await say("A strip of paper with a spot of black ink on a pencil line. Pencil, because pencil does not run.");
      await b.fit(cp, bk);
      await say("The rod lies across the beaker and the paper just touches the water. Now we wait, and watch the water climb.");
      await b.wait(7600);
      await say("Three spots: blue, red and yellow. Black ink is a mixture of dyes, and each one is carried a different distance. Measure them from the pencil line to find each Rf value.");
    },
  },
  // ── setting up apparatus ──
  {
    id: "setup-heat", setup: "setup-heat", group: "Setting up apparatus",
    name: "Set up: tripod, gauze and burner",
    about: "The gauze spreads the heat, and the burner stands under its middle.",
    need: [], steps: setupSteps("setup-heat"),
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Before anything is heated, the apparatus has to be right. This is the simplest: a tripod, a gauze and a burner.");
      const tp = await b.take("rack", "tripod", at(240), b.BASE + 20);
      await say("The tripod stands firmly on the bench with the gauze on top. The gauze spreads the heat, so the glass is not heated at one point.");
      const dish = await b.take("vessel", "dish", at(240), b.BASE - 140);
      await b.into(dish, tp, 0);
      await say("What is to be heated stands in the middle of the gauze.");
      const bn = await b.take("tool", "burner", at(430), b.BASE + 17);
      await b.flame(bn, 2);
      await say("The burner is lit away from the apparatus, and only then moved under it.");
      await b.move(bn, tp.x, b.BASE + 17, 700);
      await say("Directly under the middle. That is the whole set-up.");
    },
  },
  {
    id: "setup-filter", setup: "setup-filter", group: "Setting up apparatus",
    name: "Set up: filtration",
    about: "A funnel in a flask, and a paper folded into the funnel.",
    need: [], steps: setupSteps("setup-filter"),
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("To filter, three things: something to catch the liquid, a funnel, and a filter paper.");
      const fl = await b.take("vessel", "flask100", at(240), b.BASE);
      await say("A conical flask will catch the filtrate.");
      const fu = await b.take("tool", "funnel", at(240), b.BASE - 220);
      await b.fit(fu, fl);
      await say("The funnel sits in the mouth of the flask.");
      const fp = await b.take("tool", "paper", at(380), b.BASE);
      await b.fit(fp, fu);
      await say("The paper is folded in half, in half again, and opened into a cone: three layers on one side, one on the other.");
      await b.take("vessel", "beaker100", at(430), b.BASE);
      await say("And a beaker to pour the mixture from. Never pour above the top of the paper.");
    },
  },
  {
    id: "setup-titration", setup: "setup-titration", group: "Setting up apparatus",
    name: "Set up: a titration",
    about: "The burette hangs upright in a clamp with the flask under its tip.",
    need: [], steps: setupSteps("setup-titration"),
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("A titration needs a burette that hangs dead upright, with a flask under it.");
      const st = await b.take("rack", "stand", at(200), b.BASE + 20);
      await b.slide(st, -330);
      await say("A retort stand. I slide its clamp well up the rod: a burette is long.");
      const bu = await b.take("vessel", "burette", at(360), b.BASE - 60);
      await b.into(bu, st, 0);
      await say("The burette goes in the clamp, upright, with its scale facing me.");
      const acid = await b.take("reagent", "hcl", at(400), b.TOP);
      await b.uncap(acid);
      await b.pour(acid, bu, 3);
      await say("It is filled from the top. Its scale is read downwards, from nought at the top.");
      await b.take("vessel", "flask100", st.x + 44, b.BASE + 14);
      await say("The conical flask stands directly under the tip, so that nothing is lost.");
      await b.take("tool", "pipette", at(520), b.BASE + 10);
      await say("And a pipette, to measure the alkali into the flask. Now it is ready for the first reading.");
    },
  },
  {
    id: "setup-sepfunnel", setup: "setup-sepfunnel", group: "Setting up apparatus",
    name: "Set up: a separating funnel",
    about: "Held in a clamp, with a beaker under the tap.",
    need: [], steps: setupSteps("setup-sepfunnel"),
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("A separating funnel cannot stand up on its own. It has to be held.");
      const st = await b.take("rack", "stand", at(220), b.BASE + 20);
      await b.slide(st, -235);
      const fu = await b.take("vessel", "sepfunnel", at(400), b.BASE - 60);
      await b.into(fu, st, 0);
      await say("So it hangs in the clamp of a retort stand, tap downwards.");
      await b.take("vessel", "beaker100", st.x + 44, b.BASE + 20);
      await say("A beaker stands under the tap. Remember: the stopper comes out of the top before the tap is opened, or nothing will run.");
    },
  },
  {
    id: "setup-electrolysis", setup: "setup-electrolysis", group: "Setting up apparatus",
    name: "Set up: an electrolysis cell",
    about: "Two electrodes in the solution, not touching, wired to a supply.",
    need: [], steps: setupSteps("setup-electrolysis"),
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("To pass a current through a solution we build a cell.");
      const v = await b.take("vessel", "beaker250", at(240), b.BASE);
      const cu = await b.take("reagent", "cuso4", at(40), b.TOP);
      await b.uncap(cu);
      await b.pour(cu, v, 6);
      await say("The solution to be electrolysed is the electrolyte. It goes in a beaker.");
      const e1 = await b.take("tool", "electrode", at(180), b.BASE - 220);
      await b.fit(e1, v);
      const e2 = await b.take("tool", "electrode", at(300), b.BASE - 220);
      await b.fit(e2, v);
      await say("Two carbon electrodes dip into it. They must not touch each other.");
      await b.take("tool", "power", at(480), b.BASE);
      await b.move(v, v.x, v.y, 120);
      await say("The power pack is wired to them. The electrode on the negative terminal is the cathode; the one on the positive is the anode.");
    },
  },
  {
    id: "setup-water", setup: "setup-water", group: "Setting up apparatus",
    name: "Set up: collecting a gas over water",
    about: "A jar full of water, upturned in a trough, with the tube led under it.",
    need: [], steps: setupSteps("setup-water"),
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("This is the apparatus for a gas that does not dissolve much in water, such as hydrogen or oxygen.");
      const tr = await b.take("vessel", "trough", at(520), b.BASE + 20);
      const w = await b.take("reagent", "water", at(420), b.TOP);
      await b.uncap(w);
      await b.pour(w, tr, 6);
      await say("A trough, at least half full of water.");
      const jar = await b.take("vessel", "gasjar", at(520), b.BASE - 160);
      await b.upturnIn(jar, tr);
      await say("The gas jar is filled with water and turned over in the trough. There is no air in it now, only water.");
      const fl = await b.take("vessel", "flask", at(140), b.BASE + 20);
      const st = await b.take("tool", "bung1", at(260), b.BASE - 60);
      await b.fit(st, fl);
      await say("The gas will be made in this flask. A stopper with one hole goes in its mouth.");
      const tu = await b.take("tool", "tubing", at(260), b.BASE - 200);
      await b.fit(tu, st);
      await say("The glass of the delivery tube is pushed through the hole.");
      await b.lead(tu, jar);
      await say("And the rubber tube is led under the mouth of the jar. Each bubble that rises will push water out of the jar.");
    },
  },
  {
    id: "setup-upward", setup: "setup-upward", group: "Setting up apparatus",
    name: "Set up: upward delivery",
    about: "A gas lighter than air is caught in an upturned tube.",
    need: [], steps: setupSteps("setup-upward"),
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Ammonia dissolves in water, so it cannot be collected over water. But it is lighter than air.");
      const sd = await b.take("rack", "stand", at(140), b.BASE + 20);
      await b.slide(sd, -250);
      const v = await b.take("vessel", "boil", at(300), b.BASE - 40);
      await b.into(v, sd, 0);
      await say("The tube the gas is made in is held in a clamp.");
      const st = await b.take("tool", "bung1", at(320), b.BASE - 20);
      await b.fit(st, v);
      const tu = await b.take("tool", "tubing", at(320), b.BASE - 240);
      await b.fit(tu, st);
      await say("A one-hole stopper, with a delivery tube through it.");
      const v2 = await b.take("vessel", "boil", at(460), b.BASE - 90);
      await b.flip(v2);
      await say("A second, dry tube is turned upside down.");
      await b.lead(tu, v2);
      await say("The delivery tube leads up into it. The light gas rises to the top and pushes the air out at the bottom.");
    },
  },
  {
    id: "setup-syringe", setup: "setup-syringe", group: "Setting up apparatus",
    name: "Set up: a gas syringe",
    about: "The syringe is clamped level and joined to the flask.",
    need: [], steps: setupSteps("setup-syringe"),
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("To measure how much gas a reaction gives, we use a gas syringe.");
      const sd = await b.take("rack", "stand", at(520), b.BASE + 20);
      await b.slide(sd, -230);
      const sy = await b.take("tool", "syringe", at(600), b.BASE - 60);
      await b.clampSyringe(sy, sd);
      await say("It is clamped level, so that the plunger slides freely and its weight does not squeeze the gas.");
      const fl = await b.take("vessel", "flask", at(160), b.BASE + 20);
      const st = await b.take("tool", "bung1", at(280), b.BASE - 60);
      await b.fit(st, fl);
      const tu = await b.take("tool", "tubing", at(280), b.BASE - 200);
      await b.fit(tu, st);
      await say("The flask has a one-hole stopper and a delivery tube.");
      await b.lead(tu, sy);
      await say("The rubber tube goes on the nozzle of the syringe. Every joint must be airtight, and the plunger starts pushed right in.");
    },
  },
  {
    id: "setup-distil", setup: "setup-distil", group: "Setting up apparatus",
    name: "Set up: a distillation",
    about: "Flask in a clamp, condenser sloping down, receiver under it, burner beneath.",
    need: [], steps: setupSteps("setup-distil"),
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Distillation has the most apparatus of all. We build it from the flask outwards.");
      const st = await b.take("rack", "stand", at(120), b.BASE + 20);
      await say("A retort stand first.");
      const fl = await b.take("vessel", "distflask", at(300), b.BASE - 40);
      await b.into(fl, st, 0);
      await say("The distilling flask is held in the clamp by its neck, clear of the bench, so that a burner can go under it.");
      const co = await b.take("tool", "condenser", at(460), b.BASE - 240);
      await b.fit(co, fl);
      await say("The Liebig condenser pushes onto the side arm and slopes downwards. Cold water goes in at the bottom of its jacket and out at the top.");
      await b.take("vessel", "beaker100", co.x + 229, b.BASE + 20);
      await say("A beaker under its lower end is the receiver: the distillate drips into it.");
      const bn = await b.take("tool", "burner", at(360), b.BASE + 20);
      await b.flame(bn, 2);
      await b.move(bn, fl.x, b.BASE + 20, 700);
      await say("Last, a lit burner under the flask. Now it is ready, and the flask must never be heated dry.");
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
    teacher.wake();
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
  // a set-up has no result to write down: PrepBot looks at the bench each time something is moved
  bench.onChange = () => {
    if (!turn || !turn.lesson.setup || bench.isBusy()) return;
    if (!bench.setupDone(turn.lesson.setup)) { if (!turnBox.hidden) renderList(); return; }
    finish("You have set it up! Every piece is where it should be.");
  };
  bench.onRecord = (flags) => {
    if (!turn || bench.isBusy() || turn.lesson.setup) return;
    flags.forEach((f) => turn.seen.add(f));
    if (!turn.lesson.need.every((f) => turn.seen.has(f))) { renderList(); return; }
    finish("You did it! That is exactly what I got.");
  };
  function finish(praise) {
    const { lesson } = turn;
    turn = null;
    if (!done.includes(lesson.id)) { done.push(lesson.id); try { localStorage.setItem(DONE_KEY, JSON.stringify(done)); } catch { /* private mode */ } }
    renderList();
    teacher.show();
    teacher.speak([{ text: `${praise} ${lesson.about}`, mode: "speech" }], { colorSeed: lines++ });
    teacher.poke?.();
  }

  // ── stuck? H, or the H key beside PrepBot ──
  /** The step of the learner's turn to do now: the first one not done after the last one that is. */
  function nextOf(t) {
    const did = t.lesson.steps.map((st) => Boolean(st.done(t.seen, bench)));
    const i = did.indexOf(false, did.lastIndexOf(true) + 1);
    return { did, i };
  }
  function help() {
    if (bench.isBusy()) return;
    teacher.wake();
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
    return text;
  }
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
    burner: ["burner", "bunsen"], spirit: ["spirit lamp"], tubing: ["delivery tube"], bung: ["stopper", "bung", "cork"], bung1: ["one hole stopper", "holed stopper", "stopper with a hole"], lit: ["splint"], blue: ["litmus paper", "litmus"],
    electrode: ["electrode", "carbon rod"], power: ["power pack", "battery", "power supply"], rod: ["glass rod", "stirring rod", "stirrer"], wire: ["flame test wire", "wire"],
    condenser: ["condenser"], funnel: ["funnel"], water: ["water"], hcl: ["acid"], naoh: ["alkali"], nh3: ["ammonia solution", "ammonia"],
    unk: ["unknown salt", "unknown", "sample x"], caco3: ["calcium carbonate", "marble"], mno2: ["manganese dioxide", "manganese oxide"], h2o2: ["hydrogen peroxide", "peroxide"], oil: ["oil"],
    mg: ["magnesium"], zn: ["zinc"], fe: ["iron"], cu: ["copper"], cuo: ["copper oxide"],
    sandsalt: ["sand and salt", "salt and sand", "mixture"], sulfur: ["sulphur powder", "sulphur", "sulfur"], iodine: ["iodine"], magnet: ["magnet"], chroma: ["chromatography paper", "chromatography strip", "chromatography"],
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
  /** Every piece named in a sentence, in the order said: [{ c, n, tag }] — how many,
      and the letter that follows a vessel's name ("test tube B"). The longest name wins a word it shares. */
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
      const after = rest.slice(hit.index + hit[0].length).split(" ")[0] || "";
      const tag = pick.kind === "vessel" && /^[a-z]$/.test(after) ? after.toUpperCase() : "";
      if (!out.some((o) => o.c === pick)) out.push({ c: pick, n: said || 1, tag, at: hit.index });
      rest = `${rest.slice(0, hit.index)} ${"#".repeat(Math.max(1, hit[0].length - 2))} ${rest.slice(hit.index + hit[0].length)}`;
    }
    return out.sort((x, y) => x.at - y.at);
  }

  // ── the tutor's hands, by word ──
  // One command at a time: "get 2 test tube", "pour copper(II) sulfate solution into
  // test tube A", "light burner", "heat beaker B", "test blue litmus paper in test
  // tube A", "fit funnel on conical flask", "clear", "practical gas-h2", "demo
  // hydrogen". The AI's [DO: …] line and a learner's own plain order both end here.
  /** The piece on the bench that a name means; taken from the drawer if it is not there yet. */
  async function ensure(ref) {
    const all = bench.pieces();
    if (ref.tag) { const byTag = all.find((it) => it.kind === "vessel" && it.tag === ref.tag); if (byTag) return byTag; }
    const mine = all.filter((it) => it.kind === ref.c.kind && it.key === ref.c.key);
    if (mine.length) return mine[mine.length - 1];
    if (!ref.tag && ref.c.kind === "vessel") { const kin = all.filter((it) => it.kind === "vessel" && family(stock.find((k) => k.kind === "vessel" && k.key === it.key)) === family(ref.c)); if (kin.length) return kin[kin.length - 1]; }
    return bench.bring(ref.c);
  }
  const VERB = /^(get|bring|fetch|take out|pour|add|open|uncap|unstopper|light|flame|turn up|turn down|put out|turn off|heat|warm|boil|test|dip|hold|fit|clear|practical|demo|show|guide|notebook|results|table|graph|calculator|drawer|help)\b/i;
  async function command(raw) {
    const text = String(raw).trim();
    const verb = (VERB.exec(text) || [""])[0].toLowerCase();
    const args = text.slice(verb.length).trim();
    const [left, right] = args.split(/\s+(?:into|in|to|onto|on|under|at)\s+(?!.*\s(?:into|in|to|onto|on|under|at)\s)/i);
    switch (verb) {
      case "get": case "bring": case "fetch": case "take out": {
        const got = named(args);
        if (!got.length) return `I could not find "${args}" in the drawer.`;
        let room = 8;
        for (const { c, n } of got) for (let i = 0; i < n && room > 0; i++, room--) await bench.bring(c);
        return "";
      }
      case "open": case "uncap": case "unstopper": {
        for (const ref of named(args)) { const it = await ensure(ref); if (it.kind === "reagent") await bench.uncap(it); }
        return "";
      }
      case "pour": case "add": {
        const from = named(left || "")[0], into = named(right || "")[0];
        if (!from || !into) return `I did not understand "${text}".`;
        const dst = await ensure(into);
        const src = await ensure(from);
        if (src === dst) return "";
        if (src.kind === "reagent" && bench.capOn(src)) await bench.uncap(src);
        const times = Math.min(6, Number((/(\d+)\s*(measure|portion|time)/i.exec(text) || [])[1]) || from.n || 1);
        await bench.pour(src, dst, times);
        return "";
      }
      case "light": case "flame": case "turn up": case "turn down": case "put out": case "turn off": {
        const ref = named(args).find((r) => r.c.key === "burner" || r.c.key === "spirit") || { c: stock.find((k) => k.key === "burner"), n: 1, tag: "" };
        const bn = await ensure(ref);
        const level = /put out|turn off/.test(verb) ? 0 : verb === "turn down" ? 1 : Number((/\b([0-3])\b/.exec(args) || [])[1] || (verb === "turn up" ? 3 : 2));
        await bench.flame(bn, level);
        return "";
      }
      case "heat": case "warm": case "boil": {
        const v = named(args).find((r) => r.c.kind === "vessel");
        if (!v) return `I did not understand "${text}".`;
        const dst = await ensure(v);
        const bn = await ensure({ c: stock.find((k) => k.key === "burner"), n: 1, tag: "" });
        if (!(bn.flame > 0)) await bench.flame(bn, 2);
        await bench.heat(bn, dst);
        return "";
      }
      case "test": case "dip": case "hold": {
        const tool = named(left || "").find((r) => r.c.kind === "tool"), v = named(right || "").find((r) => r.c.kind === "vessel");
        if (!tool || !v) return `I did not understand "${text}".`;
        const dst = await ensure(v);
        await bench.hold(await ensure(tool), dst, 1500);
        return "";
      }
      case "fit": {
        const tool = named(left || "").find((r) => r.c.kind === "tool");
        const v = named(right || "").find((r) => (tool && tool.c.key === "paper" ? r.c.key === "funnel" : r.c.kind === "vessel"));
        if (!tool || !v) return `I did not understand "${text}".`;
        const dst = await ensure(v);
        if (tool.c.key === "tubing") {
          // a delivery tube goes through a one-hole stopper, and the stopper in the vessel
          const holed = stock.find((k) => k.key === "bung1");
          const st = bench.pieces().find((it) => it.key === "bung1" && it.on === dst.id) || (await bench.bring(holed));
          if (st.on !== dst.id) await bench.fit(st, dst);
          await bench.fit(await ensure(tool), st);
          return "";
        }
        await bench.fit(await ensure(tool), dst);
        return "";
      }
      case "clear": bench.clear(); return "";
      case "practical": return bench.pick(args.toLowerCase().trim()) ? "" : `There is no practical called "${args}".`;
      case "demo": case "show": {
        const l = LESSONS.find((x) => x.id === args.toLowerCase().trim());
        if (!l) return `I have no demonstration called "${args}".`;
        setTimeout(() => play(l), 600);
        return "";
      }
      case "results": case "table": case "graph": bench.openSheet("cl-sheet-table"); return "";
      case "calculator": bench.calculator?.(true); return "";
      case "guide": bench.openSheet("cl-sheet-setups"); return "";
      case "notebook": bench.openSheet("cl-sheet-notebook"); return "";
      case "drawer": bench.drawer(!/hide|close|shut|away/i.test(args)); return "";
      case "help": help(); return "";
      default: return `I do not know how to "${text}".`;
    }
  }
  /** Carry out a list of commands, one after another, as PrepBot (the bench is its own meanwhile). */
  async function act(commands) {
    if (bench.isBusy()) return "Let me finish this experiment first, then ask me again.";
    const mine = ++token;
    const notes = [];
    bench.busy(true);
    try {
      for (const cmd of [].concat(commands).slice(0, 14)) {
        if (mine !== token) break;
        try { const note = await command(cmd); if (note) notes.push(note); } catch { notes.push(`I could not ${cmd}.`); }
      }
    } finally {
      if (mine === token) bench.busy(false);
    }
    return notes.join(" ");
  }

  const FETCH = /\b(get|give|bring|fetch|pass|hand|grab|take out|put|place|add|i need|i want|can i have|may i have|could i have|let me have)\b/i;
  const WHERE = /\b(where|find|locate|look for|looking for|which (part|tab|section|drawer)|can ?not find|can't find|cant find)\b/i;
  const listOf = (cs) => cs.map(({ c, n }) => (n > 1 ? `${n} × ${c.name.toLowerCase()}` : c.name.toLowerCase())).join(cs.length > 2 ? ", " : " and ");
  let lastAsked = [];
  // a learner's own order, said plainly enough to carry out without asking the AI
  const ORDER = /^\s*(?:please\s+|prepbot,?\s+|can you\s+|could you\s+|now\s+)*(pour|add|light|turn up|turn down|put out|turn off|heat|warm|boil|uncap|unstopper|fit|dip|clear)\b/i;
  window.__prepbotPage = {
    title: "the Chemistry Bench",
    get actions() {
      return `You are the tutor on this bench and you can work it yourself. Commands (pieces by the exact names in the drawer lists; a vessel already on the bench by its name and letter, e.g. "test tube A"):
get <how many> <piece> | open <bottle> (pulls its stopper) | pour <bottle or vessel> into <vessel> (add "2 measures" for more) | light burner | flame <0-3> | put out burner | heat <vessel> (boils until nothing more happens) | test <lighted splint, glowing splint, red litmus paper, blue litmus paper, pH paper or thermometer> in <vessel> | fit <filter funnel, rubber stopper, one-hole stopper, delivery tube, condenser or electrode> on <vessel> (a delivery tube is put through a one-hole stopper for you) | fit filter paper on filter funnel (a funnel filters nothing without its paper) | clear (empties the bench) | guide | notebook | results (opens the student's own results table and graph) | calculator | drawer show | drawer hide | practical <id> (chooses it and opens its guide; ids: ${bench.practicals().map((e) => e.id).join(", ")}) | demo <id> (you do the whole experiment, then the student repeats it; ids: ${LESSONS.map((l) => l.id).join(", ")}).
A piece that is not on the bench yet is taken from the drawer when a command needs it. Do one small thing at a time when teaching, and ask the student what they see.`;
    },
    act,
    context() {
      const parts = ["Glassware", "Equipment", "Liquids", "Solids"].map((p) => `${p}: ${stock.filter((c) => c.part === p).map((c) => c.name + (c.formula && c.formula.length > 1 && c.kind === "reagent" ? ` (${c.formula})` : "")).join(", ")}.`).join("\n");
      const on = bench.standing();
      const exp = bench.chosen();
      const step = bench.nextStep();
      return `The student is on the Chemistry Bench, a 2D chemistry lab on this site. Nothing is set up for them: they take loose pieces from the DRAWER on the right and assemble the experiment themselves.
THE DRAWER has four parts (the rail on its left edge), and a search box at the top. An arrow on the edge of the bench hides and shows the drawer.
${parts}
The practicals include a group called Setting up apparatus (ids beginning setup-): heating on a tripod, filtration, titration, a separating funnel, an electrolysis cell, collecting a gas over water, upward delivery, a gas syringe, and distillation. In those the steps tick as each piece is put in the right place.
HOW THE BENCH WORKS: drag a piece to move it; drag it onto the drawer to put it away. Carry a bottle or a tool to a vessel and hold it there to use it. A bottle will not pour until its stopper is pulled out. Let a funnel, stopper, delivery tube, condenser or electrode go at a mouth and it stays fitted. Burners are lit and turned up with the + key on their base. A burette or a separating funnel hangs in the retort stand's clamp. A chosen piece shows a handle to tilt it and a "..." menu. The icons at the top left are: the Guide to the chosen practical, the lab notebook, the list of WAEC practicals, the Results table (the student rules their own table and can plot a graph of any two columns, with a line of best fit), a scientific calculator, and PrepBot's demonstrations. A burette and a measuring cylinder are READ BY EYE: choosing one shows a lens on the meniscus, and the reading is typed into the piece's menu. A funnel filters only with a filter paper in it; the paper is a separate piece. A delivery tube is pushed through a ONE-HOLE STOPPER, which goes in the vessel; the end of its rubber tube is dragged to the collector. A test tube holder (let go at a tube's neck) and crucible tongs (let go at the rim of a crucible or dish) pick the piece up, so that it can be carried and held in a flame. Pressing H gives the next step.
ON THE BENCH NOW: ${on.length ? on.join(", ") : "nothing"}.
${exp ? `CHOSEN PRACTICAL: ${exp.title}. Task: ${exp.task} It needs: ${exp.needs}.${step && !step.done ? ` Next step: ${step.text}` : ""}` : "No practical has been chosen."}
YOU CAN FETCH PIECES: if the student wants a piece, tell them to type "get me" and its name (for example "get me a 250 mL beaker and sodium hydroxide") and it is put on the bench for them. Only name pieces that are in the drawer lists above.`;
    },
    async handle(text) {
      if (/^\s*(help|what next|what now|what do i do|what should i do|i am stuck|i'm stuck|im stuck|next step)\b/i.test(text)) return help() || null;
      if (ORDER.test(text) && !/\?\s*$/.test(text) && (!/^\W*(?:\w+\W+)*?(pour|add)\b/i.test(text) || /\s(into|to|in|onto|on)\s/i.test(text))) {
        const cmd = text.replace(/^\s*(?:please\s+|prepbot,?\s+|can you\s+|could you\s+|now\s+)*/i, "").replace(/\b(the|a|an|some|please|for me)\b/gi, " ").replace(/[.!]+\s*$/, "").replace(/\s+/g, " ").trim();
        const note = await act([cmd]);
        return note || "Done. Watch what happens, and tell me what you see.";
      }
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
    const kindOf = (l) => l.group || (["sandsalt", "decant", "magnet", "sublime", "chroma", "filter", "crystals"].includes(l.id) ? "Separating mixtures" : "Reactions and tests");
    const order = ["Setting up apparatus", "Reactions and tests", "Separating mixtures"];
    const sorted = LESSONS.slice().sort((x, y) => order.indexOf(kindOf(x)) - order.indexOf(kindOf(y)));
    list.innerHTML = sorted.map((l, n) => {
      const mine = turn && turn.lesson === l;
      const head = n === 0 || kindOf(sorted[n - 1]) !== kindOf(l) ? `<li class="cl-cards__head">${esc(kindOf(l))}</li>` : "";
      return `${head}<li class="cl-card pp-sticky pp-sticky--c${n % 6}${mine ? " is-on" : ""}">
        <img src="shots/${l.setup || `bot-${l.id}`}.jpg" alt="" width="400" height="250" loading="lazy" />
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
    teacher.speak([{ text: `Hello! I am your tutor on this bench. Press my picture at the top and I will do an experiment for you to copy. Press H when you are stuck, and I will say what to do next. ${teacher.keysLine()} Ask me for a piece, or tell me what to do, and I will do it.`, mode: "speech" }]);
  }
}
