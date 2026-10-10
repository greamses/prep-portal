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
import { EXPERIMENTS, GROUPS, stepDone } from "./waec.js";
import { PROCEDURES } from "./procedures.js";
import { groqGenerate, groqText, geminiGenerate, geminiText } from "/utils/ai-client.js";
import { GEMINI_MODELS_QUALITY_FIRST } from "/utils/ai-models.js";
import { initAssign } from "./assign.js";

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
  {
    id: "acid-to-water",
    name: "Diluting an acid: acid to water",
    group: "Concentrated acids and safety",
    about: "The acid is poured into the water, a little at a time. It gets hot, and stays calm.",
    need: ["dilute:right"],
    steps: [
      { text: "Half fill a beaker with distilled water.", done: (seen) => seen.has("added:water") },
      { text: "Pour concentrated sulfuric acid (in Liquids, marked CONC.) into the water, a measure at a time.", done: (seen) => seen.has("dilute:right") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Concentrated sulfuric acid is the most dangerous bottle on this bench. There is one rule for diluting it.");
      const bk = await b.take("vessel", "beaker250", at(160), b.BASE);
      const w = await b.take("reagent", "water", at(40), b.TOP);
      const ac = await b.take("reagent", "ch2so4", at(150), b.TOP);
      const th = await b.take("tool", "thermo", at(330), b.BASE);
      await b.uncap(w);
      await b.pour(w, bk, 4);
      await say("First the water. Plenty of it.");
      await b.hold(th, bk, 1500);
      await say("Room temperature, to begin with.");
      await b.uncap(ac);
      await b.pour(ac, bk);
      await say("Now the acid, into the water. It is heavy and oily: it sinks, and it mixes as it goes.");
      await b.pour(ac, bk);
      await b.hold(th, bk, 1500);
      await say("The beaker is hot, but nothing boils and nothing spits. The heat is shared by all that water. Acid to water, always.");
    },
  },
  {
    id: "water-to-acid",
    name: "Water to acid: why it is never done",
    group: "Concentrated acids and safety",
    about: "Water poured onto concentrated acid floats, boils at once and throws the acid out.",
    need: ["dilute:wrong"],
    steps: [
      { text: "Pour a measure of concentrated sulfuric acid into an empty, dry boiling tube.", done: (seen) => seen.has("conc") },
      { text: "Pour distilled water onto the acid, and watch the mouth of the tube.", done: (seen) => seen.has("dilute:wrong") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Now the wrong way round. On this bench it is safe to find out what happens. In a real laboratory it is not.");
      const bt = await b.take("vessel", "boil", at(200), b.BASE);
      const ac = await b.take("reagent", "ch2so4", at(60), b.TOP);
      const w = await b.take("reagent", "water", at(170), b.TOP);
      await b.uncap(ac);
      await b.pour(ac, bt, 2);
      await say("The acid first, in a dry tube. Colourless, and as thick as oil.");
      await b.uncap(w);
      await say("Now water, on top of it. Watch the mouth of the tube.");
      await b.pour(w, bt);
      await say("It spits. Water is lighter than the acid, so it floats. All the heat is made in that thin layer, which boils in an instant and throws hot acid out. That would be on your hands and your face. Never water to acid.");
    },
  },
  {
    id: "char",
    name: "Concentrated sulfuric acid chars paper",
    group: "Concentrated acids and safety",
    about: "The concentrated acid takes the water out of paper and leaves carbon. The dilute acid only wets it.",
    need: ["slip:dilute", "charred"],
    steps: [
      { text: "Pour dilute sulfuric acid into one test tube and concentrated sulfuric acid into another.", done: (seen) => seen.has("added:h2so4") && seen.has("added:ch2so4") },
      { text: "Dip a strip of paper (in Equipment) in the dilute acid.", done: (seen) => seen.has("slip:dilute") },
      { text: "Dip a fresh strip in the concentrated acid.", done: (seen) => seen.has("charred") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("The same acid, dilute and concentrated, and a strip of plain white paper.");
      const rack = await b.take("rack", "rack", at(230), b.BASE);
      const t1 = await b.take("vessel", "tube", at(180), b.BASE - 30);
      await b.into(t1, rack, 1);
      const t2 = await b.take("vessel", "tube", at(290), b.BASE - 30);
      await b.into(t2, rack, 3);
      const dil = await b.take("reagent", "h2so4", at(120), b.TOP);
      const con = await b.take("reagent", "ch2so4", at(240), b.TOP);
      await b.uncap(dil);
      await b.pour(dil, t1, 3);
      await b.uncap(con);
      await b.pour(con, t2, 3);
      const slip = await b.take("tool", "slip", at(470), b.BASE);
      await say("First the dilute acid.");
      await b.hold(slip, t1, 2400);
      await say("The paper is wet, and that is all.");
      await b.wait(2600);
      await say("A fresh strip, and the concentrated acid.");
      await b.hold(slip, t2, 3400);
      await say("Black. The acid has pulled the hydrogen and oxygen out of the paper as water, and what is left is carbon. It does the same to cloth and to skin. That is what corrosive means.");
    },
  },
  {
    id: "conc-metal",
    name: "Copper and concentrated sulfuric acid",
    group: "Concentrated acids and safety",
    about: "Hot concentrated sulfuric acid attacks copper and gives sulfur dioxide, never hydrogen.",
    need: ["gas:SO2", "test:so2"],
    steps: [
      { text: "Clamp a dry boiling tube in a retort stand and put copper turnings (in Solids) in it.", done: (seen) => seen.has("added:cu") },
      { text: "Pour concentrated sulfuric acid on the copper. Cold, nothing happens.", done: (seen) => seen.has("added:ch2so4") },
      { text: "Light a burner and heat the tube.", done: (seen) => seen.has("gas:SO2") },
      { text: "Hold blue litmus paper at the mouth of the tube.", done: (seen) => seen.has("test:so2") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Copper never gives hydrogen with an acid. It is below hydrogen in the reactivity series. But concentrated sulfuric acid has another way of attacking it.");
      const st = await b.take("rack", "stand", at(260), b.BASE);
      const bt = await b.take("vessel", "boil", at(260), b.BASE - 120);
      await b.into(bt, st);
      const cu = await b.take("reagent", "cu", at(60), b.TOP + 22);
      const ac = await b.take("reagent", "ch2so4", at(170), b.TOP);
      await b.uncap(cu);
      await b.pour(cu, bt);
      await b.uncap(ac);
      await b.pour(ac, bt, 2);
      await say("Copper, and the cold concentrated acid. Nothing happens: there is almost no water in the acid, so it has hardly any hydrogen ions.");
      const bu = await b.take("tool", "burner", at(470), b.BASE);
      await b.flame(bu, 2);
      await say("Now I heat it.");
      await b.heat(bu, bt);
      await say("The copper is attacked, the liquid turns blue, and a gas with a sharp, choking smell comes off. Hot, the acid is an oxidising agent.");
      const bl = await b.take("tool", "blue", at(560), b.BASE);
      await b.hold(bl, bt, 2200);
      await say("Damp blue litmus turns red at the mouth of the tube. An acidic gas: sulfur dioxide. No hydrogen at all.");
    },
  },
  {
    id: "metal-water",
    name: "Metals and cold water",
    group: "Reactivity of metals and non-metals",
    about: "Sodium skates on water, potassium catches fire, calcium fizzes and magnesium does nothing.",
    need: ["water:Na", "water:K", "water:Ca", "nowater:Mg"],
    steps: [
      { text: "Put water in a small beaker and add a small piece of sodium (in Solids).", done: (seen) => seen.has("water:Na") },
      { text: "Add two drops of phenolphthalein to that beaker.", done: (seen) => seen.has("water:Na") && seen.has("colour:pink") },
      { text: "A fresh beaker of water, and a small piece of potassium.", done: (seen) => seen.has("water:K") },
      { text: "A fresh beaker of water, and calcium.", done: (seen) => seen.has("water:Ca") },
      { text: "A fresh beaker of water, and magnesium ribbon.", done: (seen) => seen.has("nowater:Mg") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Four metals and plain cold water. The more reactive the metal, the more it has to say.");
      const w = await b.take("reagent", "water", at(0), b.TOP);
      await b.uncap(w);
      const bks = [];
      for (let i = 0; i < 4; i++) { const bk = await b.take("vessel", "beaker100", at(130 + i * 150), b.BASE); await b.pour(w, bk, 3); bks.push(bk); }
      await say("Four beakers, each with the same amount of water.");
      const mg = await b.take("reagent", "mg", at(110), b.TOP + 22);
      await b.uncap(mg);
      await b.pour(mg, bks[0]);
      await say("Magnesium first. Nothing. Left for a long time it gives a few bubbles, and that is all.");
      const ca = await b.take("reagent", "ca", at(220), b.TOP + 22);
      await b.uncap(ca);
      await b.pour(ca, bks[1]);
      await say("Calcium sinks and fizzes steadily. The water goes cloudy: that is calcium hydroxide, which hardly dissolves.");
      const na = await b.take("reagent", "na", at(330), b.TOP + 22);
      await b.uncap(na);
      await b.pour(na, bks[2]);
      await b.wait(3200);
      await say("Sodium floats, melts into a silver ball and skates about, hissing, until it is gone. The gas is hydrogen.");
      const ph = await b.take("reagent", "phph", at(560), b.TOP);
      await b.drip(ph, bks[2]);
      await say("Phenolphthalein turns pink. What the sodium left in the water is an alkali: sodium hydroxide.");
      const k = await b.take("reagent", "k", at(440), b.TOP + 22);
      await b.uncap(k);
      await b.pour(k, bks[3]);
      await b.wait(2600);
      await say("Potassium catches fire at once, with a lilac flame. So the order of reactivity is potassium, sodium, calcium, magnesium.");
    },
  },
  {
    id: "metal-acid",
    name: "Metals and dilute acid",
    group: "Reactivity of metals and non-metals",
    about: "Magnesium fizzes fast, zinc steadily, iron slowly, and copper not at all.",
    need: ["fizz:Mg", "fizz:Zn", "fizz:Fe", "noacid:Cu", "test:pop"],
    steps: [
      { text: "Stand four test tubes in a rack. Put magnesium, zinc, iron and copper (in Solids) in one each.", done: (seen) => ["mg", "zn", "fe", "cu"].every((m) => seen.has(`added:${m}`)) },
      { text: "Pour dilute hydrochloric acid on the magnesium, the zinc and the iron, and compare the fizzing.", done: (seen) => seen.has("fizz:Mg") && seen.has("fizz:Zn") && seen.has("fizz:Fe") },
      { text: "Pour the acid on the copper: nothing happens.", done: (seen) => seen.has("noacid:Cu") },
      { text: "Add more acid to a tube that still has metal in it and hold a lighted splint at its mouth while it fizzes.", done: (seen) => seen.has("test:pop") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("The same acid on four metals. How fast each one fizzes puts them in order.");
      const rack = await b.take("rack", "rack", at(300), b.BASE);
      const tubes = [];
      for (let i = 0; i < 4; i++) { const t = await b.take("vessel", "tube", at(200 + i * 60), b.BASE - 30); await b.into(t, rack, i); tubes.push(t); }
      const ids = ["mg", "zn", "fe", "cu"];
      for (let i = 0; i < 4; i++) { const jar = await b.take("reagent", ids[i], at(i * 105), b.TOP + 22); await b.uncap(jar); await b.pour(jar, tubes[i]); }
      await say("Magnesium, zinc, iron and copper, one in each tube.");
      const hcl = await b.take("reagent", "hcl", at(470), b.TOP);
      await b.uncap(hcl);
      await b.pour(hcl, tubes[0], 2);
      await say("Magnesium fizzes fast.");
      await b.pour(hcl, tubes[1], 2);
      await say("Zinc fizzes steadily.");
      await b.pour(hcl, tubes[2], 2);
      await say("Iron fizzes slowly, and the liquid turns pale green.");
      await b.pour(hcl, tubes[3], 2);
      await say("Copper does nothing at all. It is below hydrogen in the reactivity series, so it cannot push hydrogen out of the acid.");
      const lit = await b.take("tool", "lit", at(640), b.BASE);
      await b.pour(hcl, tubes[1], 1);
      await b.hold(lit, tubes[1], 1700);
      await say("A squeaky pop: the gas is hydrogen. In order of reactivity: magnesium, zinc, iron, copper.");
    },
  },
  {
    id: "halogens",
    name: "Which halogen displaces which",
    group: "Reactivity of metals and non-metals",
    about: "Chlorine pushes out bromine and iodine. Bromine pushes out only iodine.",
    need: ["halogen:Cl>Br", "halogen:Cl>I", "halogen:Br>I", "nohalogen:Br>Cl"],
    steps: [
      { text: "Pour potassium bromide solution into a test tube and add chlorine water (in Liquids).", done: (seen) => seen.has("halogen:Cl>Br") },
      { text: "Pour potassium iodide solution into a second tube and add chlorine water.", done: (seen) => seen.has("halogen:Cl>I") },
      { text: "Pour potassium iodide solution into a third tube and add bromine water.", done: (seen) => seen.has("halogen:Br>I") },
      { text: "Pour sodium chloride solution into a fourth tube and add bromine water.", done: (seen) => seen.has("nohalogen:Br>Cl") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Metals are not the only elements with an order of reactivity. Here are three non-metals: chlorine, bromine and iodine.");
      const rack = await b.take("rack", "rack", at(300), b.BASE);
      const tubes = [];
      for (let i = 0; i < 4; i++) { const t = await b.take("vessel", "tube", at(200 + i * 60), b.BASE - 30); await b.into(t, rack, i); tubes.push(t); }
      const kbr = await b.take("reagent", "kbr", at(0), b.TOP);
      const ki = await b.take("reagent", "ki", at(105), b.TOP);
      const nacl = await b.take("reagent", "nacl", at(210), b.TOP);
      for (const x of [kbr, ki, nacl]) await b.uncap(x);
      await b.pour(kbr, tubes[0], 2);
      await b.pour(ki, tubes[1], 2);
      await b.pour(ki, tubes[2], 2);
      await b.pour(nacl, tubes[3], 2);
      await say("Potassium bromide, potassium iodide twice, and sodium chloride. All four are colourless.");
      const cl = await b.take("reagent", "clw", at(470), b.TOP);
      const br = await b.take("reagent", "brw", at(575), b.TOP);
      await b.uncap(cl);
      await b.pour(cl, tubes[0], 2);
      await say("Chlorine water into the bromide: orange. That is bromine, pushed out of its salt by chlorine.");
      await b.pour(cl, tubes[1], 2);
      await say("Chlorine water into the iodide: brown. That is iodine. Chlorine displaces both.");
      await b.uncap(br);
      await b.pour(br, tubes[2], 2);
      await say("Bromine water into the iodide: brown again. Bromine displaces iodine.");
      await b.pour(br, tubes[3], 2);
      await say("Bromine water into the chloride: only the bromine's own orange. Nothing happens, because bromine is less reactive than chlorine. The order is chlorine, bromine, iodine.");
    },
  },
  {
    id: "indicator",
    name: "An indicator from hibiscus petals",
    about: "A blender and a filter get the red colouring out of zobo petals. It is red in acid and green in alkali.",
    need: ["extract", "petal:acid", "petal:alkali"],
    steps: [
      { text: "Take the blender from Glassware. Tip in hibiscus petals (in Solids) and pour in distilled water.", done: (seen) => seen.has("added:zobo") && seen.has("in:blender:water") },
      { text: "Press BLEND on the base of the blender.", done: (seen) => seen.has("extract") },
      { text: "Fit a funnel and a filter paper in a flask and pour the mixture through.", done: (seen) => seen.has("filtered") },
      { text: "Pour some of the red filtrate into a test tube and add dilute hydrochloric acid.", done: (seen) => seen.has("petal:acid") },
      { text: "Pour some into a second test tube and add sodium hydroxide solution.", done: (seen) => seen.has("petal:alkali") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Litmus comes from a plant. So can our own indicator: dried hibiscus petals, the ones zobo is made from.");
      const bl = await b.take("vessel", "blender", at(120), b.BASE);
      const zo = await b.take("reagent", "zobo", at(0), b.TOP + 22);
      const w = await b.take("reagent", "water", at(120), b.TOP);
      await b.uncap(zo);
      await b.pour(zo, bl, 2);
      await b.uncap(w);
      await b.pour(w, bl, 5);
      await say("Petals and water in the jug of a blender.");
      await b.blend(bl);
      await say("The blades break the petals open and the red colouring goes into the water. The pulp is still floating in it.");
      const fl = await b.take("vessel", "flask", at(330), b.BASE);
      const fu = await b.take("tool", "funnel", at(430), b.BASE - 60);
      await b.fit(fu, fl);
      const fp = await b.take("tool", "paper", at(430), b.BASE);
      await b.fit(fp, fu);
      await b.pour(bl, fl, 8);
      await say("Filtering holds the pulp back. The clear red filtrate is the extract.");
      await b.lift(fu, at(430), b.BASE);
      const rack = await b.take("rack", "rack", at(640), b.BASE);
      const t1 = await b.take("vessel", "tube", at(590), b.BASE - 30);
      await b.into(t1, rack, 1);
      const t2 = await b.take("vessel", "tube", at(700), b.BASE - 30);
      await b.into(t2, rack, 3);
      await b.pour(fl, t1, 3);
      await b.pour(fl, t2, 3);
      const hcl = await b.take("reagent", "hcl", at(560), b.TOP);
      const naoh = await b.take("reagent", "naoh", at(670), b.TOP);
      await b.uncap(hcl);
      await b.pour(hcl, t1, 1);
      await say("With an acid it is bright red.");
      await b.uncap(naoh);
      await b.pour(naoh, t2, 1);
      await say("With an alkali it turns green. One colour in acid, another in alkali: that is an indicator, and we made it ourselves.");
    },
  },
  {
    id: "volcano",
    name: "Make a volcano erupt",
    group: "Fun science",
    about: "Baking soda, vinegar, a squirt of soap and some red colouring: foaming lava pours down the mountain.",
    need: ["erupt"],
    steps: [
      { text: "Take the model volcano from Glassware and tip baking soda (in Solids) into its crater.", done: (seen) => seen.has("added:bicarb") },
      { text: "Add red food colouring and washing-up liquid (in Liquids).", done: (seen) => seen.has("added:dye") && seen.has("added:soap") },
      { text: "Pour in the vinegar.", done: (seen) => seen.has("erupt") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Let us make a volcano erupt. Everything we need comes from the kitchen.");
      const vo = await b.take("vessel", "volcano", at(360), b.BASE);
      const bs = await b.take("reagent", "bicarb", at(40), b.TOP + 22);
      await b.uncap(bs);
      await b.pour(bs, vo);
      await say("First, baking soda goes into the crater.");
      const dy = await b.take("reagent", "dye", at(150), b.TOP);
      const so = await b.take("reagent", "soap", at(250), b.TOP);
      await b.uncap(dy);
      await b.pour(dy, vo);
      await b.uncap(so);
      await b.pour(so, vo);
      await say("Red colouring to make it look like lava, and a squirt of washing-up liquid to make it foam.");
      const vi = await b.take("reagent", "vinegar", at(620), b.TOP);
      await b.uncap(vi);
      await say("Now the vinegar. Watch the top of the mountain!");
      await b.pour(vi, vo, 3);
      await b.wait(4200);
      await say("It erupts! Vinegar is an acid, and baking soda fizzes in an acid: it gives off a gas. The soap catches the gas in bubbles, and out it comes as foam.");
    },
  },
  {
    id: "balloon",
    name: "Blow up a balloon without blowing",
    group: "Fun science",
    about: "The gas from vinegar and baking soda fills a balloon stretched over a flask.",
    need: ["balloon:up"],
    steps: [
      { text: "Take a conical flask (100 mL) and pour vinegar (in Liquids) into it.", done: (seen) => seen.has("added:vinegar") },
      { text: "Tip in baking soda (in Solids).", done: (seen) => seen.has("gas:CO2") },
      { text: "Quickly let the balloon (in Equipment) go at the mouth of the flask.", done: (seen) => seen.has("balloon:up") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Can a balloon be blown up with no one blowing into it? Watch.");
      const fl = await b.take("vessel", "flask100", at(330), b.BASE);
      const vi = await b.take("reagent", "vinegar", at(60), b.TOP);
      const bs = await b.take("reagent", "bicarb", at(180), b.TOP + 22);
      const ba = await b.take("tool", "balloon", at(520), b.BASE);
      await b.uncap(vi);
      await b.pour(vi, fl, 3);
      await say("Vinegar in the flask, and a balloon ready beside it.");
      await b.uncap(bs);
      await b.pour(bs, fl);
      await b.fit(ba, fl);
      await b.wait(1800);
      await say("In goes the baking soda, and the balloon goes straight over the mouth. The fizzing makes a gas, and the gas has nowhere to go but into the balloon.");
    },
  },
  {
    id: "lemon",
    name: "The floating lemon",
    group: "Fun science",
    about: "A lemon floats. Peel it, and it sinks. The secret is in the peel.",
    need: ["float:lemon", "sink:peeled"],
    steps: [
      { text: "Take a beaker (500 mL) and half fill it with water.", done: (seen) => seen.has("added:water") },
      { text: "Let the lemon (in Equipment) go into the water.", done: (seen) => seen.has("float:lemon") },
      { text: "Take the lemon out and let the peeled lemon go in.", done: (seen) => seen.has("sink:peeled") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Does a lemon float or sink? And does it matter if it has its peel on?");
      const bk = await b.take("vessel", "beaker500", at(330), b.BASE);
      const w = await b.take("reagent", "water", at(60), b.TOP);
      await b.uncap(w);
      await b.pour(w, bk, 6);
      const le = await b.take("tool", "lemon", at(560), b.BASE);
      const pe = await b.take("tool", "peeled", at(650), b.BASE);
      await say("A big beaker of water, a lemon, and a lemon with its peel taken off.");
      await b.fit(le, bk);
      await b.wait(4200);
      await say("The whole lemon floats.");
      await b.lift(le, at(560), b.BASE);
      await b.fit(pe, bk);
      await b.wait(3600);
      await say("The peeled lemon sinks! The peel is full of tiny pockets of air, like a life-jacket. Take it off, and the lemon is heavier than the water it pushes aside.");
    },
  },
  {
    id: "egg",
    name: "The egg that floats",
    group: "Fun science",
    about: "An egg sinks in water. Add enough salt and it rises and floats.",
    need: ["sink:egg", "float:egg"],
    steps: [
      { text: "Take a beaker (250 mL), put water in it, and let the egg (in Equipment) go in.", done: (seen) => seen.has("sink:egg") },
      { text: "Tip in table salt (in Solids), a spoonful at a time.", done: (seen) => seen.has("dissolved:salt") },
      { text: "Keep adding salt until the egg floats.", done: (seen) => seen.has("float:egg") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("An egg sinks in water. Can we make it float without touching it?");
      const bk = await b.take("vessel", "beaker250", at(330), b.BASE);
      const w = await b.take("reagent", "water", at(60), b.TOP);
      await b.uncap(w);
      await b.pour(w, bk, 5);
      const eg = await b.take("tool", "egg", at(540), b.BASE);
      await b.fit(eg, bk);
      await b.wait(3200);
      await say("In plain water the egg goes straight to the bottom.");
      const sa = await b.take("reagent", "salt", at(180), b.TOP + 22);
      await b.uncap(sa);
      await b.pour(sa, bk, 2);
      await say("Salt goes in, and dissolves. Not enough yet.");
      await b.pour(sa, bk, 3);
      await b.wait(4200);
      await say("There it goes! Salt makes the water denser. When the water is denser than the egg, it holds the egg up. That is why you float so easily in the sea.");
    },
  },
  {
    id: "toothpaste",
    name: "Elephant's toothpaste",
    group: "Fun science",
    about: "Yeast, soap and hydrogen peroxide: a tower of foam shoots out of the cylinder.",
    need: ["foam"],
    steps: [
      { text: "Take a measuring cylinder (100 mL) and pour hydrogen peroxide solution into it.", done: (seen) => seen.has("added:h2o2") },
      { text: "Add washing-up liquid and red food colouring.", done: (seen) => seen.has("added:soap") && seen.has("added:dye") },
      { text: "Tip in dried yeast (in Solids).", done: (seen) => seen.has("foam") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("This one is called elephant's toothpaste. You will see why.");
      const cy = await b.take("vessel", "cyl100", at(360), b.BASE);
      const hp = await b.take("reagent", "h2o2", at(40), b.TOP);
      const so = await b.take("reagent", "soap", at(150), b.TOP);
      const dy = await b.take("reagent", "dye", at(260), b.TOP);
      await b.uncap(hp);
      await b.pour(hp, cy, 4);
      await b.uncap(so);
      await b.pour(so, cy);
      await b.uncap(dy);
      await b.pour(dy, cy);
      await say("Hydrogen peroxide, washing-up liquid, and some colouring, in a tall narrow cylinder.");
      const ye = await b.take("reagent", "yeast", at(620), b.TOP + 22);
      await b.uncap(ye);
      await say("Now the yeast.");
      await b.pour(ye, cy);
      await b.wait(4200);
      await say("Whoosh! The yeast makes the hydrogen peroxide give up its oxygen all at once. The soap catches the oxygen in bubbles, and the foam is squeezed out like toothpaste from a tube.");
    },
  },
  {
    id: "lava",
    name: "A lava lamp",
    group: "Fun science",
    about: "Coloured blobs ride up through oil on bubbles of gas, and sink back again.",
    need: ["lava"],
    steps: [
      { text: "Take a measuring cylinder (100 mL). Pour in vinegar and add red food colouring.", done: (seen) => seen.has("added:vinegar") && seen.has("added:dye") },
      { text: "Pour cooking oil on top.", done: (seen) => seen.has("added:oil") },
      { text: "Tip in baking soda (in Solids).", done: (seen) => seen.has("lava") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Oil and water do not mix. That is what makes a lava lamp work.");
      const cy = await b.take("vessel", "cyl100", at(360), b.BASE);
      const vi = await b.take("reagent", "vinegar", at(40), b.TOP);
      const dy = await b.take("reagent", "dye", at(150), b.TOP);
      const oi = await b.take("reagent", "oil", at(260), b.TOP);
      await b.uncap(vi);
      await b.pour(vi, cy, 2);
      await b.uncap(dy);
      await b.pour(dy, cy);
      await b.uncap(oi);
      await b.pour(oi, cy, 5);
      await say("Red vinegar at the bottom, and oil floating on top of it: two layers.");
      const bs = await b.take("reagent", "bicarb", at(620), b.TOP + 22);
      await b.uncap(bs);
      await b.pour(bs, cy);
      await b.wait(2600);
      await say("The baking soda sinks through the oil and fizzes in the vinegar. Each bubble of gas carries a red blob up with it. At the top the gas escapes, and the blob sinks back down.");
    },
  },
  {
    id: "washing",
    name: "Washing glassware at the sink",
    about: "Pour away, rinse under the tap, shake, pour again, and dry. A vessel that was only emptied is not clean.",
    need: ["washed", "dried"],
    steps: [
      { text: "Take the sink from Equipment. Tilt the used vessel over it by its handle and pour the liquid away.", done: (seen, b) => b.count("rack", "sink") > 0 },
      { text: "Stand the vessel in the sink under the tap and press the tap's blue key. Press it again when there is enough water.", done: (seen) => seen.has("added:water") },
      { text: "Shake the vessel: move it quickly to and fro.", done: (seen) => seen.has("shaken") },
      { text: "Tilt it over the sink and pour the water away.", done: (seen) => seen.has("washed") },
      { text: "Take the drying cloth, push it into the vessel and rub it about.", done: (seen) => seen.has("dried") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("A vessel that has only been emptied is not clean. Here is how glassware is washed up.");
      const sink = await b.take("rack", "sink", at(470), b.BASE + 30);
      const bk = await b.take("vessel", "beaker100", at(150), b.BASE);
      const cu = await b.take("reagent", "cuso4", at(20), b.TOP);
      await b.uncap(cu);
      await b.pour(cu, bk, 3);
      await say("A beaker with some copper(II) sulfate solution left in it.");
      await b.into(bk, sink, 1);
      await say("It stands in the sink. Nothing is ever poured on the bench.");
      await b.tip(bk, -112);
      await say("Tilted over, the liquid runs away down the sink. But look at the glass: blue drops are still clinging to it. Whatever went in next would be mixed with them.");
      await b.into(bk, sink, 0);
      await say("So it goes under the tap, and the tap is turned on.");
      await b.tap(sink, 2400);
      await say("That is enough water. The tap is turned off: water is not left running.");
      await b.shake(bk);
      await say("Now it is shaken, so that the water goes all round the inside of the glass and takes the drops with it.");
      await b.tip(bk, -112);
      await say("The rinse water is poured away. The beaker is clean now, but it is wet.");
      const cl = await b.take("tool", "cloth", at(740), b.BASE);
      await b.move(bk, at(640), b.BASE, 500);
      await b.rub(cl, bk);
      await say("A clean cloth is pushed in and rubbed about until the glass is dry. A wet vessel can also be dried over a flame. Clean and dry: ready for the next experiment.");
    },
  },
  {
    id: "centrifuge",
    name: "Centrifuging",
    about: "Spinning packs a fine solid into a pellet, and the clear liquid is poured off.",
    need: ["supernatant"],
    steps: [
      { text: "Take a test tube and make a precipitate in it: three measures of copper(II) sulfate, then three of sodium hydroxide.", done: (seen) => seen.has("ppt:CuOH") },
      { text: "Take a second test tube and pour six measures of distilled water into it, to balance the first.", done: (seen) => seen.has("added:water") },
      { text: "Take the centrifuge from Equipment. Stand the two tubes in wells OPPOSITE each other: the two outside wells.", done: (seen, b) => b.count("rack", "centrifuge") > 0 && b.inHost("centrifuge") >= 2 },
      { text: "Take the stop-watch. Press START on the centrifuge and the crown of the stop-watch. After at least 10 seconds press STOP, and wait for the rotor to come to rest.", done: (seen) => seen.has("spun") },
      { text: "Lift the tube out and pour the clear liquid off the pellet into an empty test tube.", done: (seen) => seen.has("supernatant") },
    ],
    async run({ say, b }) {
      const at = (n) => 110 + n * Math.min(1, (b.W - 240) / 780);
      await say("Some precipitates are too fine to settle and too fine to filter. For those there is the centrifuge.");
      const t1 = await b.take("vessel", "tube", at(120), b.BASE);
      const cu = await b.take("reagent", "cuso4", at(0), b.TOP);
      const na = await b.take("reagent", "naoh", at(110), b.TOP);
      await b.uncap(cu);
      await b.pour(cu, t1, 3);
      await b.uncap(na);
      await b.pour(na, t1, 3);
      await say("A pale blue precipitate, hanging in the liquid. The tube is half full.");
      const t2 = await b.take("vessel", "tube", at(220), b.BASE);
      const w = await b.take("reagent", "water", at(220), b.TOP);
      await b.uncap(w);
      await b.pour(w, t2, 6);
      await say("A second tube with the same amount of water. It is there only to balance the first.");
      const cf = await b.take("rack", "centrifuge", at(440), b.BASE + 10);
      await b.into(t1, cf, 0);
      await b.into(t2, cf, 3);
      await say("They go in wells opposite each other. A centrifuge out of balance shakes itself to pieces, so it will not run until it is balanced.");
      const sw = await b.take("tool", "stopwatch", at(590), b.BASE);
      await say("It takes time, so I time it with a stop-watch. Watch the tubes swing out as the rotor picks up speed.");
      await b.watch(sw, true);
      await b.spin(cf);
      await b.watch(sw, false);
      await say("Ten seconds, and stop. The solid is packed into a pellet at the bottom, and the liquid above is clear.");
      const t3 = await b.take("vessel", "tube", at(660), b.BASE);
      await b.move(t1, at(580), b.BASE, 500);
      await b.pour(t1, t3, 3);
      await say("The clear liquid, the supernatant, pours off and the pellet stays behind. That is centrifugation.");
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
    about: "The burette is clamped and filled, the alkali is pipetted into the flask with its indicator, and the flask stands under the tip.",
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
      const cf = await b.take("vessel", "flask100", at(560), b.BASE);
      const alk = await b.take("reagent", "naoh", at(520), b.TOP);
      const pip = await b.take("tool", "pipette", at(660), b.BASE + 10);
      await b.uncap(alk);
      await say("Now the alkali. It has to be measured exactly, so it is drawn up in a pipette: 25.0 cubic centimetres, no more and no less.");
      await b.hold(pip, alk, 1100);
      await b.hold(pip, cf, 1300);
      await say("The pipette empties into a clean conical flask.");
      const ind = await b.take("reagent", "phph", at(630), b.TOP);
      await b.drip(ind, cf);
      await say("Two drops of indicator. Phenolphthalein is pink in the alkali, and will lose its colour at the end point.");
      await b.into(cf, st, 1);
      await say("The flask stands on the base of the stand, directly under the tip of the burette, so that nothing is lost. Now it is complete, and ready for the first reading.");
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
      const bk = await b.take("vessel", "beaker100", st.x + 160, b.BASE);
      await b.into(bk, st, 1);
      await say("A beaker stands on the base, under the tap. Remember: the stopper comes out of the top before the tap is opened, or nothing will run.");
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
        <button class="mm-prepbot-menu-btn" data-b="voice" type="button" title="Mute or speak" aria-label="Mute PrepBot, or let it speak"></button>
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

  const hooks = {};       // what a practical set for a class wants to be told (assign.js)
  /** PrepBot is for premium members. The bench and its practicals are free without it. */
  const LOCKED = "I am part of the premium plan. The bench and every practical on it are free: open the guide for the steps. Subscribe, and I will demonstrate, set things up and help you when you are stuck.";
  function locked() {
    if (bench.botAllowed()) return false;
    teacher.wake();
    teacher.show();
    teacher.speak([{ text: LOCKED, mode: "speech" }], { colorSeed: lines++ });
    bench.openSheet("cl-sheet-bot");
    return true;
  }
  /** While PrepBot works on the bench, the chat window is out of the way. */
  const closeChat = () => { try { window.PrepBot?.close?.(); } catch { /* no chat open */ } };
  async function play(lesson) {
    if (locked()) return;
    teacher.wake();
    stop();
    const mine = ++token;
    turn = null;
    closeChat();
    bench.closeSheets();
    bench.busy(true);
    stopKey.hidden = false;
    bench.clear();
    bench.demo(true);
    bench.page(`PrepBot shows: ${lesson.name}`);
    try {
      await lesson.run({ say: (t) => speak(t, mine), b: hands(mine) });
      await speak("Now it is your turn. I will clear the bench. Take the same things from the drawer and do what I did. If you get stuck, press H and I will tell you what to do next.", mine);
      bench.demo(false);
      bench.clear();
      if (lesson.practical) bench.pick(lesson.practical, true);      // its guide ticks as well, but is not thrown open
      bench.page(`My turn: ${lesson.name}`);
      turn = { lesson, seen: new Set() };
      renderList();
    } catch (e) {
      if (!(e instanceof Stopped)) throw e;
    } finally {
      bench.demo(false);
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
  bench.onRecord = bench.onFlags = (flags) => {
    if (!turn || bench.isBusy() || turn.lesson.setup) return;
    const before = turn.seen.size;
    flags.forEach((f) => turn.seen.add(f));
    if (turn.seen.size === before) return;
    // (a practical done from its own steps is finished when every one of them is; a lesson, when its results are in)
    const all = turn.lesson.practical ? turn.lesson.steps.every((st) => st.done(turn.seen, bench)) : turn.lesson.need.every((f) => turn.seen.has(f));
    if (!all) { renderList(); return; }
    finish("You did it! That is exactly what I got.");
  };
  function finish(praise) {
    const { lesson } = turn;
    turn = null;
    if (!done.includes(lesson.id)) { done.push(lesson.id); try { localStorage.setItem(DONE_KEY, JSON.stringify(done)); } catch { /* private mode */ } }
    renderList();
    teacher.show();
    teacher.speak([{ text: `${praise} ${lesson.about}`, mode: "speech" }], { colorSeed: lines++ });
    if (hooks.lessonDone) setTimeout(() => hooks.lessonDone(lesson), 2600);
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
    if (locked()) return LOCKED;
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
    unk: ["unknown salt", "unknown", "sample x"], caco3: ["calcium carbonate", "marble"], mno2: ["manganese dioxide", "manganese oxide"], h2o2: ["hydrogen peroxide", "peroxide"], oil: ["oil"], ch2so4: ["concentrated sulfuric acid", "conc sulfuric acid", "concentrated acid", "conc acid"], chcl: ["concentrated hydrochloric acid", "conc hydrochloric acid"], cnaoh: ["concentrated sodium hydroxide", "conc sodium hydroxide", "concentrated alkali"], slip: ["strip of paper", "plain paper", "paper strip"],
    bicarb: ["baking soda", "bicarbonate of soda", "sodium bicarbonate", "sodium hydrogencarbonate", "bicarb"], soap: ["washing up liquid", "dish soap", "detergent", "soap"], dye: ["food colouring", "food coloring", "food colour", "colouring"], salt: ["table salt", "salt"], yeast: ["yeast"], lemonj: ["lemon juice"], volcano: ["volcano"], balloon: ["balloon"], peeled: ["peeled lemon"], lemon: ["lemon"], egg: ["egg"],
    mg: ["magnesium"], zn: ["zinc"], fe: ["iron"], cu: ["copper"], cuo: ["copper oxide"],
    sandsalt: ["sand and salt", "salt and sand", "mixture"], sulfur: ["sulphur powder", "sulphur", "sulfur"], iodine: ["iodine"], magnet: ["magnet"], centrifuge: ["centrifuge"], stopwatch: ["stop watch", "stopwatch", "timer"], watch: ["watch glass"], holder: ["test tube holder", "holder"], sink: ["sink", "tap", "basin"], cloth: ["cloth", "rag", "towel", "duster"], tongs: ["tongs"], tripod: ["tripod"], dish: ["evaporating dish", "evaporating basin", "dish"], chroma: ["chromatography paper", "chromatography strip", "chromatography"],
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
    // (asked for a second carbon rod, the one already hanging in the beaker is not it)
    if (mine.length) return [...mine].reverse().find((it) => it.on == null) || mine[mine.length - 1];
    if (!ref.tag && ref.c.kind === "vessel") { const kin = all.filter((it) => it.kind === "vessel" && family(stock.find((k) => k.kind === "vessel" && k.key === it.key)) === family(ref.c)); if (kin.length) return kin[kin.length - 1]; }
    return bench.bring(ref.c);
  }
  const VERB = /^(experiment|pipette|flame ?test|receiver|set ?up|assemble|prepare|say|wait|shake|swirl|stir|drip|drop|blend|tap|rinse|empty|tip|dry|rub|wipe|spin|centrifuge|run|titrate|current|electrolyse|switch on|upturn|invert|flip|lead|stand|clamp|place|put|get|bring|fetch|take out|pour|add|open|uncap|unstopper|light|flame|turn up|turn down|put out|turn off|heat|warm|boil|test|dip|hold|fit|clear|practical|demo|show|guide|notebook|results|table|graph|calculator|drawer|help)\b/i;
  async function command(raw) {
    const text = String(raw).trim();
    const verb = (VERB.exec(text) || [""])[0].toLowerCase();
    const args = text.slice(verb.length).trim();
    const [left, right] = args.split(/\s+(?:into|in|to|onto|on|under|at)\s+(?!.*\s(?:into|in|to|onto|on|under|at)\s)/i);
    const piece = (key) => ({ c: stock.find((k) => k.key === key), n: 1, tag: "" });
    const vesselIn = (s) => named(s || "").find((r) => r.c.kind === "vessel");
    /** A sink on the bench (brought out if there is none), for anything that is poured away or washed. */
    const sinkNow = () => ensure(piece("sink"));
    switch (verb.replace(/\s+/g, "")) {
      case "setup": case "assemble": case "prepare": return setUp(args);
      // what the tutor says ALOUD on the bench while it works: one short sentence
      case "say": await speak(args.replace(/^["'“]|["'”]$/g, ""), actToken); return "";
      case "pipette": {
        // 25.0 cm3 drawn up from a bottle and run into a vessel
        const from = named(left || "").find((r) => r.c.kind === "reagent"), into = vesselIn(right);
        if (!from || !into) return `I did not understand "${text}".`;
        const dst = await ensure(into), src = await ensure(from), pip = await ensure(piece("pipette"));
        if (bench.capOn(src)) await bench.uncap(src);
        await bench.hold(pip, src, 1100);
        await bench.hold(pip, dst, 1300);
        return "";
      }
      case "flametest": {
        // the wire is dipped in the liquid, then held in the flame
        const v = vesselIn(args);
        if (!v) return `I did not understand "${text}".`;
        const dst = await ensure(v), wire = await ensure(piece("wire")), bn = await ensure(piece("burner"));
        if (!(bn.flame > 0)) await bench.flame(bn, 2);
        await bench.hold(wire, dst, 900);
        await bench.hold(wire, bn, 2400);
        return "";
      }
      case "receiver": {
        // a beaker goes under the lower end of the condenser
        const v = vesselIn(args), end = bench.condenserEnd();
        if (!v || !end) return end ? `I did not understand "${text}".` : "There is no condenser fitted yet.";
        await bench.move(await ensure(v), end.x, end.y, 520);
        return "";
      }
      case "wait": await bench.wait(Math.min(15, Math.max(0.5, Number((/[\d.]+/.exec(args) || [2])[0]))) * 1000); return "";
      case "shake": case "swirl": case "stir": {
        const v = vesselIn(args);
        if (!v) return `I did not understand "${text}".`;
        const it = await ensure(v);
        if (verb === "shake") await bench.shake(it); else await bench.swirl(it);
        return "";
      }
      case "drip": case "drop": {
        // an indicator, by its own dropper
        const from = named(left || "").find((r) => r.c.kind === "reagent"), into = vesselIn(right);
        if (!from || !into) return `I did not understand "${text}".`;
        const dst = await ensure(into), src = await ensure(from);
        if (src.rk !== "indicator" && !/indicator|phenolphthalein|methyl orange/i.test(from.c.name)) return command(`pour ${args}`);
        await bench.drip(src, dst);
        return "";
      }
      case "blend": {
        const bl = await ensure(piece("blender"));
        await bench.blend(bl);
        return "";
      }
      case "tap": case "rinse": {
        // water from the sink's tap into a vessel: it is stood under the nozzle first
        const v = vesselIn(args);
        if (!v) return `I did not understand "${text}".`;
        const it = await ensure(v), sink = await sinkNow();
        await bench.into(it, sink, 0);
        await bench.tap(sink, Math.min(8, Math.max(1, Number((/(\d+(?:\.\d+)?)\s*s/i.exec(args) || [0, 2.4])[1]))) * 1000);
        if (verb === "rinse") { await bench.shake(it); await bench.tip(it, -112); }
        return "";
      }
      case "empty": case "tip": {
        // poured away down the sink, by tilting it there
        const v = vesselIn(args);
        if (!v) return `I did not understand "${text}".`;
        const it = await ensure(v), sink = await sinkNow();
        await bench.into(it, sink, 1);
        await bench.tip(it, -112);
        return "";
      }
      case "dry": case "rub": case "wipe": {
        const v = vesselIn(args);
        if (!v) return `I did not understand "${text}".`;
        const it = await ensure(v), cloth = await ensure(piece("cloth"));
        if (it.rack) { it.rack = null; await bench.move(it, it.x + 190, bench.BASE, 420); }
        await bench.rub(cloth, it);
        return "";
      }
      case "spin": case "centrifuge": {
        const cf = await ensure(piece("centrifuge"));
        return (await bench.spin(cf)) ? "" : "The centrifuge would not run: it needs test tubes in wells opposite each other, holding the same amount.";
      }
      case "run": case "titrate": {
        const v = named(args).find((r) => r.c.key === "burette" || r.c.key === "sepfunnel");
        if (!v) return `I did not understand "${text}".`;
        const n = Math.min(40, Number((/(\d+)/.exec(args.replace(/\(.*?\)/g, "")) || [0, 4])[1]) || 4);
        await bench.run(await ensure(v), n, /drop/i.test(args));
        return "";
      }
      case "current": case "electrolyse": case "switchon": {
        const pack = await ensure(piece("power"));
        await bench.current(pack, 3);
        return "";
      }
      case "upturn": case "invert": case "flip": {
        const v = vesselIn(left || args);
        if (!v) return `I did not understand "${text}".`;
        const it = await ensure(v), host = named(right || "").find((r) => r.c.key === "trough");
        if (host) await bench.upturnIn(it, await ensure(host)); else await bench.flip(it);
        return "";
      }
      case "lead": {
        // the rubber end of a delivery tube, to the vessel that collects the gas
        const v = vesselIn(right || args);
        const tube = bench.pieces().find((it) => it.key === "tubing");
        if (!v || !tube) return tube ? `I did not understand "${text}".` : "There is no delivery tube fitted yet.";
        await bench.lead(tube, await ensure(v));
        return "";
      }
      case "stand": case "clamp": case "place": case "put": {
        // a vessel on a rack, a tripod or a stand; anything else that is "put" somewhere is fitted there
        const what = named(left || "")[0], where = named(right || "")[0];
        if (!what || !where) return `I did not understand "${text}".`;
        if (where.c.kind !== "rack") return command(`${what.c.kind === "reagent" ? "pour" : "fit"} ${args}`);
        const host = await ensure(where), v = await ensure(what);
        if (v.kind !== "vessel") return `Only glassware stands on ${where.c.name.toLowerCase()}.`;
        const slot = bench.freeSlot(host);
        if (slot < 0) return `There is no room left on the ${where.c.name.toLowerCase()}.`;
        // a burette or a separating funnel hangs high, so that a flask can stand on the base under its tip
        if (host.key === "stand" && slot === 0 && (v.key === "burette" || v.key === "sepfunnel")) await bench.slide(host, v.key === "burette" ? -330 : -235);
        await bench.into(v, host, slot);
        return "";
      }
      case "get": case "bring": case "fetch": case "takeout": {
        const got = named(args);
        if (!got.length) return `I could not find "${args}" in the drawer.`;
        let room = 8;
        for (const { c, n } of got) for (let i = 0; i < n && room > 0; i++, room--) await bench.bring(c);
        return "";
      }
      case "turnup": case "turndown": case "putout": case "turnoff": return command(`${verb === "turn up" ? "flame 3" : verb === "turn down" ? "flame 1" : "flame 0"} ${args}`);
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
        if (src.kind === "reagent" && /indicator|phenolphthalein|methyl orange/i.test(from.c.name)) { await bench.drip(src, dst); return ""; }
        if (src.kind === "reagent" && bench.capOn(src)) await bench.uncap(src);
        const times = Math.min(12, Number((/(\d+)\s*(measure|portion|time)/i.exec(text) || [])[1]) || from.n || 1);
        await bench.pour(src, dst, times);
        return "";
      }
      case "light": case "flame": {
        const ref = named(args).find((r) => r.c.key === "burner" || r.c.key === "spirit") || { c: stock.find((k) => k.key === "burner"), n: 1, tag: "" };
        const bn = await ensure(ref);
        const level = Number((/\b([0-3])\b/.exec(args) || [])[1] || 2);
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
        if (tool && tool.c.key === "tubing" && !v && /stopper|bung/i.test(right || "")) {
          // the delivery tube into its stopper, wherever the stopper is: on the bench, or already in a mouth
          const st = bench.pieces().find((it) => it.key === "bung1") || (await bench.bring(stock.find((k) => k.key === "bung1")));
          await bench.fit(await ensure(tool), st);
          return "";
        }
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
      case "experiment": { const what = args; setTimeout(() => aiExperiment(what).catch((e) => console.warn("PrepBot:", e)), 400); return ""; }
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
  // ── setting an experiment up ──
  // Any practical can be laid out, so long as the drawer holds what it needs: the pieces it lists
  // are taken out, bottles are opened, test tubes go in their rack, and the practical is chosen so
  // that its steps tick. The nine apparatus set-ups are ASSEMBLED, by the same hands that demonstrate
  // them. Anything the drawer does not hold is said, not guessed at.
  const practicals = bench.practicals();
  // THE WHOLE OF EVERY PRACTICAL. A practical with no hand-written demonstration above has its full
  // method in procedures.js. Each becomes a lesson like the others: PrepBot lays its pieces out and
  // does it one step at a time, saying what it is doing; then the student's turn is the practical's
  // own steps.
  for (const exp of EXPERIMENTS) {
    const script = PROCEDURES[exp.id];
    if (!script || LESSONS.some((l) => l.id === exp.id)) continue;
    LESSONS.push({
      id: exp.id,
      name: exp.title,
      practical: exp.id,
      group: (GROUPS.find((g) => g.id === exp.group) || {}).label || "Reactions and tests",
      about: exp.record.split(/(?<=\.)\s/)[0],
      need: [],
      steps: exp.steps.map((st, i) => ({ text: st.text, done: (seen, b) => (st.check ? Boolean((b.setupSteps(exp.id)[i] || {}).done) : stepDone(st, seen)) })),
      async run({ say, b }) {
        const { have } = kitFor(practicals.find((e) => e.id === exp.id));
        await layOut(have, b);
        for (const line of script) {
          await b.wait(60);                                  // (a stopped demonstration stops here)
          if (/^say\s/i.test(line)) { await say(line.slice(4)); continue; }
          const note = await command(line);
          if (note) console.warn("PrepBot:", exp.id, line, "→", note);
        }
      },
    });
  }
  /** The demonstration a sentence means: by its id, or by the words of its name. */
  function lessonFor(text) {
    const said = norm(String(text)).trim();
    const byId = LESSONS.find((l) => said === l.id || said.split(/\s+/).includes(l.id));
    if (byId) return byId;
    const want = wordsOf(said);
    if (!want.length) return null;
    let best = null, top = 0;
    for (const l of LESSONS) {
      const name = wordsOf(`${l.name} ${l.id.replace(/-/g, " ")}`), about = wordsOf(l.about || "");
      // ("wash" is "washing", "titrate" is "titration": the first four letters decide)
      const like = (t, w) => t === w || (w.length >= 4 && t.length >= 4 && t.slice(0, 4) === w.slice(0, 4));
      const score = want.reduce((a, w) => a + (name.some((t) => like(t, w)) ? 2 : about.includes(w) ? 0.5 : 0), 0) / want.length;
      if (score > top) { top = score; best = l; }
    }
    return top >= 1.2 ? best : null;
  }

  // ── an experiment that is in no list: the AI does it, ONE STAGE AT A TIME ──
  // It is asked for one small stage (a sentence to say, and a few commands), the bench does it, and
  // what was really seen (and anything the bench refused) goes back with the next question. So it
  // works from results, not from a guess at them, and a small model has only a small thing to get
  // right each time.
  const STAGES = 16;
  const RULES = () => `You are PrepBot, a chemistry teacher doing an experiment for a student on a virtual laboratory bench, with your own hands. You work ONE SMALL STAGE at a time.
Reply with ONLY a JSON object: {"say": "...", "do": ["command", "command"], "done": false}
- "say": one or two short sentences for the student. Before a stage: what you are about to do and what to watch for. After a result has come back: what it shows. Plain words, no symbols.
- "do": 1 to 5 commands for this stage, from the COMMANDS below, spelled exactly, pieces named exactly as in the DRAWER. A vessel on the bench is named with its letter, for example "test tube A".
- When the experiment is finished, reply {"say": "<what was seen and what it proves>", "do": [], "done": true}.
- If the DRAWER does not hold something the experiment needs, reply done:true and say exactly what is missing and which experiment like it could be done here instead.
- NEVER describe a result you have not been shown under SEEN. If the bench REFUSED a command, put it right in your next stage.
- Work as a careful chemist: the right vessel, small amounts (a test tube holds 12 measures; 2 is a normal portion), acid into water, test a gas at once while it is still coming off.
COMMANDS:
get <piece> | stand <vessel> on <test tube rack, tripod, retort stand or sink> | pour <bottle, jar or vessel> into <vessel> [N measures] | drip <indicator> into <vessel> | pipette <bottle> into <vessel> | shake <vessel> | swirl <vessel> | light burner | heat <vessel> | test <lighted splint | glowing splint | red litmus paper | blue litmus paper | pH paper | thermometer | strip of paper> in <vessel> | flametest <vessel> | fit <filter funnel | filter paper | rubber stopper | one-hole stopper | delivery tube | condenser | carbon electrode | balloon | lemon | egg> on <vessel> | lead to <vessel> | upturn <gas jar> in trough | flip <test tube or boiling tube> | run burette <N> | run separating funnel <N> | current | spin | blend | tap <vessel> | empty <vessel> | rinse <vessel> | dry <vessel> | wait <seconds>
DRAWER:
${["Glassware", "Equipment", "Liquids", "Solids"].map((p) => `${p}: ${stock.filter((c) => c.part === p).map((c) => c.name).join("; ")}.`).join("\n")}`;
  function parseStage(raw) {
    let o = null;
    try { o = JSON.parse(raw); } catch { const m = /\{[\s\S]*\}/.exec(String(raw)); if (m) { try { o = JSON.parse(m[0]); } catch { /* not JSON */ } } }
    if (!o || typeof o !== "object") return null;
    return { say: String(o.say || "").slice(0, 400), do: (Array.isArray(o.do) ? o.do : []).map((c) => String(c).trim()).filter(Boolean).slice(0, 6), done: Boolean(o.done) };
  }
  let limitSeen = "";        // a model that said "too many requests" during this experiment
  async function askStage(system, prompt) {
    // The student's own choice of model first (the star key in the chat window); else Gemini's newest
    // (it plans a method better), with Groq's biggest behind it.
    let pick = "";
    try { pick = localStorage.getItem("prepbot.model") || ""; } catch { /* private mode */ }
    if (pick.startsWith("groq:")) {
      try { return parseStage(groqText(await groqGenerate({ body: { model: pick.slice(5), messages: [{ role: "system", content: system }, { role: "user", content: prompt }], temperature: 0.2, max_tokens: 500, response_format: { type: "json_object" } } }))); }
      catch (e) { console.warn("PrepBot: the chosen model did not answer", e.message); if (/429/.test(e.message)) limitSeen = pick.slice(5); }
    }
    const first = pick.startsWith("gemini:") ? [`https://generativelanguage.googleapis.com/v1beta/models/${pick.slice(7)}:generateContent`] : [];
    try {
      const data = await geminiGenerate({ models: [...first, ...GEMINI_MODELS_QUALITY_FIRST.filter((u) => !first.includes(u))], body: { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 600, responseMimeType: "application/json" } } });
      const st = parseStage(geminiText(data));
      if (st) return st;
      throw new Error("no stage in the reply");
    } catch (e) {
      console.warn("PrepBot: first AI did not answer", e.message);
      return parseStage(groqText(await groqGenerate({ system, prompt, json: true, temperature: 0.2, maxTokens: 500 })));
    }
  }
  /** Do an experiment the lists do not have. Resolves to what PrepBot concluded. */
  async function aiExperiment(ask) {
    if (locked()) return LOCKED;
    if (bench.isBusy()) return "Let me finish this experiment first, then ask me again.";
    teacher.wake();
    stop();
    const mine = ++token;
    actToken = mine;
    turn = null;
    closeChat();
    bench.closeSheets();
    bench.busy(true);
    stopKey.hidden = false;
    bench.clear();
    bench.demo(true);
    bench.page(`PrepBot does: ${ask.slice(0, 60)}`);
    const system = RULES(), log = [];
    let last = "";
    limitSeen = "";
    try {
      await speak("Let me work out how to do that with what is in the drawer.", mine);
      for (let n = 1; n <= STAGES; n++) {
        if (mine !== token) throw new Stopped();
        const prompt = `EXPERIMENT ASKED FOR: ${ask}\n${log.length ? `STAGES DONE SO FAR:\n${log.join("\n")}` : "Nothing has been done yet. The bench is empty."}\nON THE BENCH NOW: ${bench.standing().join(", ") || "nothing"}.\nStage ${n} of at most ${STAGES}. Give the next stage${n >= STAGES - 1 ? " (this must be the last: finish with done true)" : ""}.`;
        let st = null;
        try { st = await askStage(system, prompt); } catch (e) { console.warn("PrepBot: the AI did not answer", e.message); }
        if (mine !== token) throw new Stopped();
        if (!st) { last = "The AI models I use are busy or at their limit just now. Wait a minute and ask again, choose another model with the star key in my chat window, or pick an experiment from my list."; await speak(last, mine); break; }
        if (limitSeen && !log.toldLimit) { log.toldLimit = true; await speak("The model you chose is at its limit for the moment, so another one is helping me with this. You can choose a different model with the star key in my chat window.", mine); }
        if (st.say) { last = st.say; await speak(st.say, mine); }
        if (st.done || !st.do.length) break;
        if (st.do.join(";") === (log.lastDo || "")) { last = "I am going round in circles, so I will stop here."; await speak(last, mine); break; }
        log.lastDo = st.do.join(";");
        const refused = [], notes = [];
        bench.onRefuse = (why) => { if (!refused.includes(why)) refused.push(why); };
        for (const cmd of st.do) {
          if (mine !== token) throw new Stopped();
          if (/^(clear|demo|show|practical|set ?up)\b/i.test(cmd)) continue;                 // one experiment, on this bench
          try { const note = await command(cmd); if (note) notes.push(note); } catch (e) { if (e instanceof Stopped) throw e; console.warn("PrepBot:", cmd, e); notes.push(`"${cmd}" could not be done.`); }
        }
        bench.onRefuse = null;
        const seen = bench.recent(st.do.length + 1).filter((l) => !/nothing to see$/.test(l)).slice(-4);
        log.push(`${n}. DID: ${st.do.join("; ")}\n   SEEN: ${seen.join(" | ") || "nothing visible"}${refused.length || notes.length ? `\n   REFUSED: ${[...refused, ...notes].join(" | ")}` : ""}`);
      }
    } catch (e) {
      if (!(e instanceof Stopped)) throw e;
    } finally {
      bench.onRefuse = null;
      bench.demo(false);
      if (mine === token) { bench.busy(false); stopKey.hidden = true; }
    }
    return last;
  }
  /** "Do the flame tests", "show me how to make hydrogen", "demonstrate rusting": one of mine, or the AI's. */
  const DO_IT = /^\s*(?:please\s+|prepbot,?\s+|can you\s+|could you\s+|will you\s+|now\s+|i want you to\s+|i want to see\s+|let me see\s+)*(do|show me how to|show me|show|demonstrate|carry out|perform|conduct|teach me how to|teach me|try)\b(.*)$/i;
  function doExperiment(text) {
    const m = DO_IT.exec(text);
    if (!m || /^\s*(you|we|i|they|it|not)\b/i.test(m[2]) || /^\s*(what|why|how|when|where|which|who)\b/i.test(text)) return null;
    const rest = m[2].replace(/\b(for me|please|the experiment on|an experiment on|experiment on|the practical on|how to|experiment|practical|demonstration|the|a|an|me|us|it again|again)\b/gi, " ").replace(/[.!?]+\s*$/, "").replace(/\s+/g, " ").trim();
    if (rest.length < 3) return null;
    if (!bench.botAllowed()) return LOCKED;
    if (bench.isBusy()) return "Let me finish this experiment first, then ask me again.";
    const lesson = lessonFor(rest);
    if (lesson) { setTimeout(() => play(lesson), 250); return `Watch the bench: I will do "${lesson.name}" now, one step at a time. Then it is your turn.`; }
    setTimeout(() => aiExperiment(rest).catch((e) => console.warn("PrepBot:", e)), 250);
    return "That one is not on my list, so I will work it out and do it on the bench, one stage at a time. Watch.";
  }
  const wordsOf = (s) => norm(s).trim().split(" ").filter((w) => w.length > 2 && !["the", "and", "for", "with", "experiment", "practical", "set", "this", "that", "please", "test", "tests"].includes(w));
  /** The practical a sentence means: by its id, or by the words of its title. */
  function practicalFor(text) {
    const said = String(text).toLowerCase().trim();
    const byId = practicals.find((e) => said === e.id || said.split(/\s+/).includes(e.id));
    if (byId) return byId;
    const want = wordsOf(said);
    if (!want.length) return null;
    let best = null, top = 0;
    for (const e of practicals) {
      const title = wordsOf(`${e.title} ${e.id.replace(/-/g, " ")}`), task = wordsOf(e.task);
      const score = want.reduce((a, w) => a + (title.some((t) => t === w || (w.length > 5 && t.startsWith(w.slice(0, 6)))) ? 2 : task.includes(w) ? 0.5 : 0), 0) / want.length;
      if (score > top) { top = score; best = e; }
    }
    return top >= 1 ? best : null;
  }
  /** What a practical's list of needs comes to in pieces from the drawer, and what is not there. */
  function kitFor(exp) {
    const have = [], missing = [];
    // where the wording is loose ("the three solutions"), the practical carries its own list: key*count
    if (exp.kit) {
      for (const word of exp.kit.split(" ")) { const [key, n] = word.split("*"); const c = stock.find((k) => k.key === key); if (c) have.push({ c, n: Number(n) || 1, tag: "" }); else missing.push(key); }
      return { have, missing };
    }
    for (const chunk of exp.needs.replace(/\([^)]*\)/g, " ").split(/,|;| and (?=a |an |the |two |three |\d)/)) {
      const part = chunk.split(/ or /)[0].trim();
      if (!part) continue;
      const got = named(part);
      if (got.length) got.forEach((r) => { if (!have.some((h) => h.c === r.c)) have.push(r); });
      else if (!/^(the |a |an )?(three|two|\d+)? ?(solutions?|samples?|mixture)/.test(part)) missing.push(part.replace(/^(a|an|the|some) /, ""));
    }
    return { have, missing };
  }
  /** Lay a practical's pieces out in two rows (bottles behind, glassware in front), tubes in their rack, bottles open. */
  async function layOut(have, h) {
    // laid out in two rows: bottles and jars along the back, glassware and equipment along the front
    const all = [];
    for (const { c, n } of have) for (let i = 0; i < n && all.length < 18; i++) all.push(c);
    const hasRack = all.some((c) => c.kind === "rack" && c.key === "rack");
    const inRack = (c) => hasRack && c.kind === "vessel" && (c.key === "tube" || c.key === "boil");
    const WIDE = { rack: 340, centrifuge: 200, stand: 210, tripod: 150, trough: 300, balance: 200, condenser: 260, syringe: 260 };
    const widthOf = (c) => WIDE[c.key] || (/^(beaker|flask|rbf|fbf|distflask|gasjar|dish|vol|sepfunnel|mortar|blender|volcano)/.test(c.key) ? 130 : 84);
    const row = (cs, y) => {
      const total = cs.reduce((s, c) => s + widthOf(c), 0), room = bench.W - 200, k = Math.min(1, room / Math.max(1, total));
      let x = 100 + Math.max(0, (room - total * k) / 2);
      return cs.map((c) => { const w = widthOf(c) * k; const at = { c, x: x + w / 2, y: typeof y === "function" ? y(c) : y }; x += w; return at; });
    };
    const spots = [...row(all.filter((c) => c.kind === "reagent").map((c) => ({ ...c, key: c.key })), (c) => bench.TOP + (c.cat === "solid" ? 22 : 0)), ...row(all.filter((c) => c.kind !== "reagent" && !inRack(c)), bench.BASE)];
    const out = [];
    for (const s of spots) { const it = await h.take(s.c.kind, s.c.key, s.x, s.y); if (it) out.push(it); }
    const rackAt = out.find((it) => it.kind === "rack" && it.key === "rack");
    for (const c of all.filter(inRack)) { const it = await h.take(c.kind, c.key, rackAt.x, bench.BASE - 30); if (it) out.push(it); }
    // tubes go in the rack; bottles are opened, ready to pour
    const rack = out.find((it) => it.kind === "rack" && it.key === "rack");
    if (rack) for (const t of out.filter((it) => it.kind === "vessel" && (it.key === "tube" || it.key === "boil"))) { const slot = bench.freeSlot(rack); if (slot >= 0) await h.into(t, rack, slot); }
    for (const it of out.filter((x) => x.kind === "reagent")) if (bench.capOn(it)) await h.uncap(it);
    return out;
  }
  let actToken = 0;
  async function setUp(args) {
    const exp = practicalFor(args) || (/^\s*(it|this|that|the experiment|the practical)?\s*$/i.test(args) ? practicals.find((e) => e.title === (bench.chosen() || {}).title) : null);
    if (!exp) return `I do not have a practical called "${args}". Tell me the pieces you want and I will get them.`;
    const mine = actToken;
    closeChat();
    bench.closeSheets();
    bench.clear();
    bench.pick(exp.id, true);
    const lesson = LESSONS.find((l) => l.setup === exp.id);
    if (lesson) {
      // an apparatus: build it, piece by piece
      await lesson.run({ say: (t) => speak(t, mine), b: hands(mine) });
      return `${exp.title} is ready.`;
    }
    const { have, missing } = kitFor(exp);
    if (!have.length) return `I could not work out what ${exp.title} needs.`;
    await speak(`I will set out what ${exp.title} needs.`, mine);
    await layOut(have, hands(mine));
    const first = (bench.nextStep() || {}).text;
    const told = `Everything for ${exp.title} is on the bench${missing.length ? `, except ${missing.join(", ")}, which the drawer does not hold` : ""}. ${first ? `Start here. ${first}` : ""} Press H whenever you want the next step.`;
    await speak(told, mine);
    return told;
  }
  /** Carry out a list of commands, one after another, as PrepBot (the bench is its own meanwhile). */
  async function act(commands) {
    if (locked()) return LOCKED;
    if (bench.isBusy()) return "Let me finish this experiment first, then ask me again.";
    const mine = ++token;
    actToken = mine;
    closeChat();
    const notes = [], refused = [];
    bench.busy(true);
    bench.onRefuse = (why) => { if (!refused.includes(why)) refused.push(why); };
    try {
      for (const cmd of [].concat(commands).slice(0, 60)) {
        if (mine !== token) break;
        try { const note = await command(cmd); if (note) notes.push(note); } catch (e) { if (e instanceof Stopped) break; console.warn("PrepBot:", cmd, e); notes.push(`I could not ${cmd}.`); }
      }
    } finally {
      bench.onRefuse = null;
      if (mine === token) bench.busy(false);
    }
    // what the bench would not do, in its own words: the tutor's next reply can put it right
    if (refused.length) notes.push(`The bench refused: ${refused.slice(0, 4).join(" | ")}`);
    // what was actually SEEN, read back from the notebook, so that the student (and the tutor's next reply) has the real result
    const did = [].concat(commands).filter((c) => !/^(say|wait|get|bring|fetch|open|uncap|clear|guide|notebook|drawer|results|calculator)\b/i.test(c)).length;
    const seen = did ? bench.recent(Math.min(8, did)).filter((line) => !/nothing to see$|No visible change\.$/.test(line)) : [];
    if (seen.length) notes.push(`What was seen: ${seen.slice(-5).join(" | ")}`);
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
MORE HANDS: say <one short sentence> (you say it aloud on the bench, in step with what you are doing) | wait <seconds> | shake <vessel> | swirl <vessel> | drip <indicator> into <vessel> (a few drops from its dropper) | blend (runs the blender) | tap <vessel> (stands it in the sink and runs water into it from the tap; add "5 s" for longer) | empty <vessel> (tilts it over the sink to pour it away) | rinse <vessel> (tap, shake, pour away: it is then clean) | dry <vessel> (rubs it with the cloth) | spin (runs the centrifuge; the tubes must already stand in wells opposite each other) | run burette 5 (opens its tap five times, 1 cm3 each; "run burette 3 drops" for single drops) (first clamp it: "stand burette on retort stand", fill it by pouring into it, and "stand conical flask on retort stand" puts the flask on the base, under its tip) | run separating funnel 3 | current (passes current from the power pack through the cell) | upturn <gas jar> in trough | flip <test tube or boiling tube> (upside down, to collect a light gas) | lead to <vessel> (leads the delivery tube's rubber end to the collector).
DOING AN EXPERIMENT YOURSELF: when the student asks you to do, show, demonstrate or carry out an experiment, do it, whatever it is, so long as the drawer lists hold what it needs. If it is one of the demo ids, use "demo <id>" and nothing else. If it is in no list, the simplest way is the single command "experiment <what was asked for, in a few words>": the bench then does it one stage at a time. Or work it out from your own chemistry and write the whole thing as ONE [DO: ...] line: start with "clear", then get, stand, fit and pour in the order a careful chemist would, with a "say" before each stage telling the student what you are about to do and what to watch for. Use the real method: the right vessel, sensible amounts (a test tube takes about 6 measures), acid into water, heat only what should be heated, test a gas while it is still coming off. Up to 60 commands. Do NOT state the result in advance as if you had seen it: the bench works the chemistry out, and what was really seen is shown to the student after your commands have run and is given to you under RECENTLY SEEN on your next turn, so explain the result then. If the drawer lacks something the experiment needs, say exactly what is missing, and offer the nearest experiment that can be done with what is there. Never pretend a piece or a chemical exists.
SETTING UP: "setup <practical id>" clears the bench and lays out (or, for the setup- ids, assembles) one of these practicals: ${practicals.map((e) => `${e.id} = ${e.title}`).join("; ")}. "stand <vessel> on <rack, tripod or retort stand>" puts glassware on a support. If the student asks for an experiment that is NOT in that list, set it up yourself, one command for each piece (get, stand, fit, pour), using only what the drawer lists hold. If something it needs is not in the drawer, say which thing, and use the nearest thing the drawer does hold or say that it cannot be done here.
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
RECENTLY SEEN (from the notebook, newest last): ${bench.recent(8).join(" | ") || "nothing yet"}.
${exp ? `CHOSEN PRACTICAL: ${exp.title}. Task: ${exp.task} It needs: ${exp.needs}.${step && !step.done ? ` Next step: ${step.text}` : ""}` : "No practical has been chosen."}
YOU CAN FETCH PIECES: if the student wants a piece, tell them to type "get me" and its name (for example "get me a 250 mL beaker and sodium hydroxide") and it is put on the bench for them. Only name pieces that are in the drawer lists above.`;
    },
    async handle(text) {
      if (!bench.botAllowed()) return LOCKED;
      // "set up the titration", "prepare the hydrogen experiment for me", "set it up"
      const su = /\b(set(?:ting)? (?:it |this |that |me )?up|setup|assemble|prepare|lay out|arrange)\b(.*)$/i.exec(text);
      if (su && !/\bhow\b|\bwhy\b|\?\s*$/i.test(text)) {
        const rest = su[2].replace(/\b(for me|please|the apparatus for|apparatus for|an?|the|experiment|practical|on|of)\b/gi, " ").replace(/[.!]+\s*$/, "").replace(/\s+/g, " ").trim();
        if (!rest ? bench.chosen() : practicalFor(rest)) return (await act([`setup ${rest}`])) || "It is set up.";
      }
      if (/^\s*(help|what next|what now|what do i do|what should i do|i am stuck|i'm stuck|im stuck|next step)\b/i.test(text)) return help() || null;
      { const told = doExperiment(text); if (told) return told; }
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
    const kindOf = (l) => l.group || (["sandsalt", "decant", "magnet", "sublime", "chroma", "centrifuge", "filter", "crystals"].includes(l.id) ? "Separating mixtures" : "Reactions and tests");
    const order = ["Fun science", "Reactions and tests", "Volumetric analysis", "Qualitative analysis", "Preparing and testing gases", "Reactivity of metals and non-metals", "Separating mixtures", "Energy and electricity", "Concentrated acids and safety", "Setting up apparatus"];
    const rank = (l) => { const i = order.indexOf(kindOf(l)); return i < 0 ? order.length : i; };
    const sorted = LESSONS.slice().sort((x, y) => rank(x) - rank(y));
    list.innerHTML = sorted.map((l, n) => {
      const mine = turn && turn.lesson === l;
      const head = n === 0 || kindOf(sorted[n - 1]) !== kindOf(l) ? `<li class="cl-cards__head">${esc(kindOf(l))}</li>` : "";
      return `${head}<li class="cl-card pp-sticky pp-sticky--c${n % 6}${mine ? " is-on" : ""}">
        <img src="shots/${l.setup || (l.practical ? l.id : `bot-${l.id}`)}.jpg" alt="" width="400" height="250" loading="lazy" />
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

  // practicals a teacher sets for a class, and the ones a student has been set
  try {
    initAssign({ bench, lessons: LESSONS, play, act, hooks, say: (text) => { teacher.wake(); teacher.show(); teacher.speak([{ text, mode: "speech" }], { colorSeed: lines++ }); } });
  } catch (e) { console.warn("PrepBot: class practicals did not start", e); }

  // a first hello, only on an empty bench
  if (bench.isEmptyBench()) {
    teacher.show();
    teacher.speak([{ text: `Hello! I am your tutor on this bench. Press my picture at the top and I will do an experiment for you to copy. Press H when you are stuck, and I will say what to do next. ${teacher.keysLine()} Ask me for a piece, or tell me what to do, and I will do it.`, mode: "speech" }]);
  }
}
