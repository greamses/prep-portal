/* ============================================================================
   CHEMISTRY BENCH — the practicals
   ----------------------------------------------------------------------------
   The things to try are the experiments of the WAEC / SSCE chemistry practical
   paper: volumetric analysis, qualitative analysis (the tests for cations,
   anions and gases, and naming an unknown salt), and the practical techniques
   the theory-of-practical question asks about.

   The wording is our own, written the way such questions are set; none of it
   is copied from a past paper.

   An EXPERIMENT is { id, group, title, task, needs, steps, record }:
     task    the instruction, as an examiner would give it
     needs   what to take from the drawer
     steps   what to do, in order. A step is done when every flag in `need`
             has been seen (the notebook's flags, plus a few the bench adds:
             in:<vessel>:<reagent>, pipetted:<reagent>, ind:<indicator>,
             endpoint, clamped:<vessel>, acidproof:<precipitate>) — or when its
             own `test(seen)` says so.
     record  what a candidate would write down or work out

   The GUIDE on the bench is always the guide to the experiment that has been
   chosen: its task, what it needs, and these steps ticking off as they are done.
   ========================================================================== */

export const GROUPS = [
  { id: "vol", label: "Volumetric analysis" },
  { id: "qual", label: "Qualitative analysis" },
  { id: "gas", label: "Preparing and testing gases" },
  { id: "sep", label: "Separating mixtures" },
  { id: "more", label: "Energy and electricity" },
];

/** The salts sample X may be, and the ions a candidate has to name. */
export const UNKNOWNS = [
  { id: "cuso4", cation: "Cu^2+", anion: "SO4^2-" }, { id: "feso4", cation: "Fe^2+", anion: "SO4^2-" },
  { id: "fecl3", cation: "Fe^3+", anion: "Cl^-" }, { id: "znso4", cation: "Zn^2+", anion: "SO4^2-" },
  { id: "also4", cation: "Al^3+", anion: "SO4^2-" }, { id: "pbno3", cation: "Pb^2+", anion: "NO3^-" },
  { id: "cacl2", cation: "Ca^2+", anion: "Cl^-" }, { id: "nh4cl", cation: "NH4^+", anion: "Cl^-" },
];
export const CATIONS = ["Cu^2+", "Fe^2+", "Fe^3+", "Zn^2+", "Al^3+", "Pb^2+", "Ca^2+", "NH4^+"];
export const ANIONS = ["SO4^2-", "Cl^-", "NO3^-", "CO3^2-"];

const hot = (seen) => [...seen].some((f) => f.startsWith("temp:") && Number(f.slice(5)) >= 30);

export const EXPERIMENTS = [
  // ── volumetric analysis ──
  {
    id: "titr-strong", group: "vol", title: "Titration: acid against alkali",
    task: "A is dilute hydrochloric acid. B is sodium hydroxide solution. Put A into the burette and titrate it against 25.0 cm³ portions of B, using phenolphthalein as indicator. Record the volume of A used.",
    needs: "retort stand, burette, pipette, conical flask, dilute hydrochloric acid, sodium hydroxide solution, phenolphthalein",
    steps: [
      { text: "Slide the stand's clamp up and let the burette go at it, so that it hangs.", need: ["clamped:burette"] },
      { text: "Fill the burette with A: pull the stopper out of the acid and carry the bottle to the top of the burette.", need: ["in:burette:hcl"] },
      { text: "Pipette 25.0 cm³ of B into a conical flask. The pipette fills straight from the open bottle.", need: ["pipetted:naoh"] },
      { text: "Add two drops of phenolphthalein: pull the dropper out of its bottle and hold it over the flask. The liquid turns pink.", need: ["ind:phph"] },
      { text: "Stand the flask under the burette and press the blue tap. Near the end, switch to drops. Stop when the pink just disappears.", need: ["endpoint"] },
    ],
    record: "The burette reading at the end point is the titre. These bench solutions are the same strength, so 25.00 cm³ of A neutralises 25.0 cm³ of B. Change a bottle's concentration from its menu and the titre changes in proportion.",
  },
  {
    id: "titr-carbonate", group: "vol", title: "Titration: acid against sodium carbonate",
    task: "A is dilute hydrochloric acid. C is sodium carbonate solution. Titrate 25.0 cm³ portions of C with A, using methyl orange as indicator. Record the volume of A used.",
    needs: "retort stand, burette, pipette, conical flask, dilute hydrochloric acid, sodium carbonate solution, methyl orange",
    steps: [
      { text: "Clamp the burette in the retort stand.", need: ["clamped:burette"] },
      { text: "Fill the burette with A.", need: ["in:burette:hcl"] },
      { text: "Pipette 25.0 cm³ of C into a conical flask.", need: ["pipetted:na2co3"] },
      { text: "Add two drops of methyl orange. The liquid turns yellow.", need: ["ind:mo"] },
      { text: "Run in A, a drop at a time near the end, until the yellow just turns orange-red.", need: ["endpoint"] },
    ],
    record: "Methyl orange is yellow in alkali and red in acid. It is the right indicator for a strong acid against a carbonate; phenolphthalein would change too soon.",
  },
  // ── qualitative analysis ──
  {
    id: "cations-naoh", group: "qual", title: "Cations: sodium hydroxide solution",
    task: "Put about 2 cm³ of each of copper(II) sulfate, iron(II) sulfate, iron(III) chloride and zinc sulfate solutions into separate test tubes. To each add sodium hydroxide solution in drops, and then in excess. Record your observations.",
    needs: "test tube rack, four test tubes, the four salt solutions, sodium hydroxide solution",
    steps: [
      { text: "Copper(II) sulfate with a few drops of NaOH(aq).", need: ["ppt:CuOH"] },
      { text: "Iron(II) sulfate with a few drops of NaOH(aq).", need: ["ppt:Fe2OH"] },
      { text: "Iron(III) chloride with a few drops of NaOH(aq).", need: ["ppt:Fe3OH"] },
      { text: "Zinc sulfate with a few drops of NaOH(aq).", need: ["ppt:ZnOH"] },
      { text: "Add NaOH(aq) in excess to the zinc tube: one precipitate goes back into solution.", need: ["cx:ZnOH4"] },
      { text: "Add NaOH(aq) in excess to the copper tube: its precipitate stays.", need: ["insoluble:CuOH/naoh"] },
    ],
    record: "Cu^2+ pale blue precipitate, insoluble in excess. Fe^2+ dirty green, insoluble. Fe^3+ reddish-brown, insoluble. Zn^2+ white, soluble in excess (amphoteric).",
  },
  {
    id: "cations-nh3", group: "qual", title: "Cations: aqueous ammonia",
    task: "To about 2 cm³ portions of copper(II) sulfate, zinc sulfate and aluminium sulfate solutions in separate test tubes, add aqueous ammonia in drops and then in excess. Record your observations.",
    needs: "test tube rack, three test tubes, the three salt solutions, aqueous ammonia",
    steps: [
      { text: "Copper(II) sulfate with a few drops of NH3(aq).", need: ["ppt:CuOH"] },
      { text: "NH3(aq) in excess: the precipitate dissolves to a deep blue solution.", need: ["cx:CuNH3"] },
      { text: "Zinc sulfate: a white precipitate that dissolves in excess NH3(aq).", need: ["cx:ZnNH3"] },
      { text: "Aluminium sulfate: a white precipitate that does NOT dissolve in excess NH3(aq).", need: ["insoluble:AlOH/nh3"] },
    ],
    record: "Ammonia tells zinc from aluminium: both give white precipitates that dissolve in excess sodium hydroxide, but only zinc's dissolves in excess ammonia.",
  },
  {
    id: "anions", group: "qual", title: "Tests for anions",
    task: "Carry out the test for a sulfate, a chloride and a carbonate, using zinc sulfate solution, sodium chloride solution and sodium carbonate solution. Record your observations and inferences.",
    needs: "test tubes and rack, the three solutions, barium chloride solution, silver nitrate solution, dilute hydrochloric acid, aqueous ammonia, a lighted splint",
    steps: [
      { text: "Sulfate: add barium chloride solution to zinc sulfate. A white precipitate.", need: ["ppt:BaSO4"] },
      { text: "Then add dilute hydrochloric acid in excess: the precipitate stays.", need: ["acidproof:BaSO4"] },
      { text: "Chloride: add silver nitrate solution to sodium chloride. A white precipitate.", need: ["ppt:AgCl"] },
      { text: "Then add aqueous ammonia in excess: the precipitate dissolves.", need: ["cx:AgClNH3"] },
      { text: "Carbonate: add dilute hydrochloric acid to sodium carbonate. It fizzes.", need: ["gas:CO2"] },
      { text: "Hold a lighted splint at the mouth while it fizzes: the flame goes out.", need: ["test:out"] },
    ],
    record: "SO4^2- white precipitate with BaCl2(aq), insoluble in dilute HCl. Cl^- white precipitate with AgNO3(aq), soluble in excess NH3(aq). CO3^2- effervescence with dilute acid; the gas is carbon dioxide.",
  },
  {
    id: "ammonium", group: "qual", title: "Test for the ammonium ion",
    task: "To about 2 cm³ of ammonium chloride solution add sodium hydroxide solution and warm. Test any gas given off with damp red litmus paper.",
    needs: "boiling tube, ammonium chloride solution, sodium hydroxide solution, a burner, red litmus paper",
    steps: [
      { text: "Put ammonium chloride solution and sodium hydroxide solution in the tube.", need: ["in:boil:nh4cl"], any: [["in:boil:nh4cl"], ["in:tube:nh4cl"]] },
      { text: "Turn the burner up and warm the tube. A gas with a sharp smell comes off.", need: ["gas:NH3"] },
      { text: "Hold red litmus paper at the mouth of the tube: it turns blue.", need: ["test:gasblue"] },
    ],
    record: "A gas that turns damp red litmus blue is ammonia, the only common alkaline gas. It shows NH4^+ in the solution.",
  },
  {
    id: "unknown", group: "qual", title: "Identify an unknown salt",
    task: "X is a solution of a single salt. Carry out tests on portions of X to identify the cation and the anion present. Record each test, observation and inference.",
    needs: "sample X (in Liquids), test tubes and rack, sodium hydroxide solution, aqueous ammonia, barium chloride solution, silver nitrate solution, dilute hydrochloric acid, a burner and red litmus",
    unknown: true,
    steps: [
      { text: "Put portions of X in several test tubes. Note its colour.", need: ["in:tube:unk"] },
      { text: "To one portion add sodium hydroxide solution in drops, then in excess. If nothing forms, warm it and test for ammonia.", need: ["added:naoh"] },
      { text: "To another add aqueous ammonia in drops, then in excess.", need: ["added:nh3"] },
      { text: "To another add barium chloride solution, then dilute hydrochloric acid.", need: ["added:bacl2"] },
      { text: "To another add silver nitrate solution.", need: ["added:agno3"] },
      { text: "Name the two ions below.", need: ["unknown:right"] },
    ],
    record: "No precipitate with barium chloride or with silver nitrate means the anion is neither sulfate nor chloride: of the choices here, that leaves nitrate.",
  },
  // ── gases ──
  {
    id: "gas-h2", group: "gas", title: "Hydrogen: prepare, collect over water, test",
    task: "Prepare hydrogen by the action of dilute hydrochloric acid on zinc. Collect the gas over water and carry out the test for hydrogen.",
    needs: "conical flask, one-hole stopper, delivery tube, trough, gas jar, distilled water, zinc, dilute hydrochloric acid, a lighted splint",
    steps: [
      { text: "Fill the trough with water and let an empty gas jar go in it: it turns over and fills.", need: ["in:trough:water"] },
      { text: "Push the delivery tube into the one-hole stopper and drag the end of its rubber tube to the gas jar. Have it ready: the stopper goes into the flask as soon as the acid is in.", need: [] , test: (seen) => seen.has("piped") },
      { text: "Put zinc in the flask, then the acid. Gas collects in the jar.", need: ["collected"] },
      { text: "Lift the jar out and hold a lighted splint at its mouth.", need: ["test:pop"] },
    ],
    record: "Zn(s) + 2HCl(aq) → ZnCl2(aq) + H2(g). Hydrogen is collected over water because it is insoluble in it. It burns with a squeaky pop.",
  },
  {
    id: "gas-co2", group: "gas", title: "Carbon dioxide: prepare and test",
    task: "Prepare carbon dioxide by the action of dilute hydrochloric acid on marble chips. Test the gas with a lighted splint and with damp blue litmus paper.",
    needs: "boiling tube or flask, marble chips, dilute hydrochloric acid, a lighted splint, blue litmus paper",
    steps: [
      { text: "Put marble chips in the vessel and pour the acid on them.", need: ["gas:CO2"] },
      { text: "While it fizzes, hold a lighted splint at the mouth: it goes out.", need: ["test:out"] },
    ],
    record: "CaCO3(s) + 2HCl(aq) → CaCl2(aq) + H2O(l) + CO2(g). Carbon dioxide is denser than air, so it can be collected by downward delivery: lead a delivery tube down into an upright jar.",
  },
  {
    id: "gas-o2", group: "gas", title: "Oxygen: prepare and test",
    task: "Prepare oxygen by the catalytic decomposition of hydrogen peroxide solution using manganese(IV) oxide. Carry out the test for oxygen.",
    needs: "boiling tube or flask, hydrogen peroxide solution, manganese(IV) oxide, a glowing splint",
    steps: [
      { text: "Put hydrogen peroxide solution in the vessel, then add manganese(IV) oxide.", need: ["gas:O2"] },
      { text: "Hold a glowing splint at the mouth: it relights.", need: ["test:relight"] },
    ],
    record: "2H2O2(aq) → 2H2O(l) + O2(g). The black powder is a catalyst: it is still there, unchanged, at the end.",
  },
  {
    id: "gas-nh3", group: "gas", title: "Ammonia: prepare, collect, test",
    task: "Prepare ammonia by warming ammonium chloride solution with sodium hydroxide solution. Collect it by upward delivery and test it.",
    needs: "boiling tube, one-hole stopper, delivery tube, a second boiling tube, ammonium chloride and sodium hydroxide solutions, a burner, red litmus paper",
    steps: [
      { text: "Turn an empty boiling tube upside down from its menu, and lead the delivery tube from the other one up into it.", need: [], test: (seen) => seen.has("piped:up") },
      { text: "Put both solutions in the first tube and warm it.", need: ["gas:NH3"] },
      { text: "Hold red litmus paper at the mouth of the upturned tube: it turns blue.", need: ["test:gasblue", "at:up"] },
    ],
    record: "Ammonia is less dense than air and very soluble in water, so it is collected in a dry, upturned tube and never over water.",
  },
  // ── separating mixtures ──
  {
    id: "filter", group: "sep", title: "Filtration",
    task: "Prepare a precipitate of copper(II) hydroxide and separate it from the solution by filtration. Name the residue and the filtrate.",
    needs: "beaker, conical flask, filter funnel, filter paper, copper(II) sulfate solution, sodium hydroxide solution",
    steps: [
      { text: "Make the precipitate in the beaker.", need: ["ppt:CuOH"] },
      { text: "Let the funnel go at the mouth of the flask, and a filter paper go at the funnel. Then pour the mixture through it.", need: ["filtered"] },
    ],
    record: "Residue: copper(II) hydroxide. Filtrate: sodium sulfate solution. Filtration separates an insoluble solid from a liquid.",
  },
  {
    id: "sandsalt", group: "sep", title: "Sand and salt: dissolve, filter, evaporate",
    task: "You are given a mixture of sand and common salt. Obtain a dry sample of each.",
    needs: "beaker, glass rod, conical flask, filter funnel, filter paper, evaporating dish, tripod and gauze, a burner, distilled water, the sand and salt mixture (in Solids)",
    steps: [
      { text: "Tip some of the mixture into a beaker and add distilled water. The salt dissolves; the sand does not.", need: ["dissolved:salt"] },
      { text: "Stir with the glass rod (or swirl the beaker) so that the sand is carried in the water.", need: ["swirled"] },
      { text: "Fit a funnel and a filter paper in a flask, and pour the mixture through. The sand is the residue.", need: ["filtered"] },
      { text: "Pour the filtrate into an evaporating dish on a tripod and heat it until the water has gone. The salt is left.", need: ["crystals"] },
    ],
    record: "Three techniques in a row: dissolving (salt is soluble, sand is not), filtration (the insoluble sand is the residue, the salt solution the filtrate) and evaporation (the water leaves, the salt crystallises).",
  },
  {
    id: "decant", group: "sep", title: "Decanting",
    task: "Separate sand from water without a filter.",
    needs: "two beakers, sand (in Solids), distilled water",
    steps: [
      { text: "Tip sand into a beaker and add water. Do NOT stir: let the sand lie on the bottom.", need: ["added:sand"], test: (seen) => seen.has("added:sand") && seen.has("added:water") },
      { text: "Carry the beaker to a second beaker and pour the water off gently. The sand stays behind.", need: ["decanted"] },
    ],
    record: "Decanting pours a liquid off a solid that has settled. It is quick, but less complete than filtering: some liquid always stays with the solid.",
  },
  {
    id: "magnet", group: "sep", title: "Magnetic separation: iron and sulfur",
    task: "Separate a mixture of iron filings and sulfur powder.",
    needs: "evaporating dish or watch glass, iron filings and sulfur powder (in Solids), a horseshoe magnet",
    steps: [
      { text: "Tip iron filings and sulfur powder into the same dish: a grey and yellow mixture.", need: ["added:fe", "added:sulfur"] },
      { text: "Hold the magnet over the mixture. The iron jumps to it; the sulfur does not.", need: ["magnet"] },
    ],
    record: "A magnet separates a magnetic substance from the others in a mixture. It works only because iron and sulfur have NOT combined: heated together they form iron(II) sulfide, a compound, which a magnet cannot separate.",
  },
  {
    id: "sublime", group: "sep", title: "Sublimation: iodine from sand",
    task: "Separate iodine from a mixture of iodine crystals and sand.",
    needs: "boiling tube, iodine crystals and sand (in Solids), a burner",
    steps: [
      { text: "Tip iodine crystals and sand into a dry boiling tube.", need: ["added:iodine", "added:sand"] },
      { text: "Light a burner and hold it under the tube. Purple vapour rises, and crystals form on the cool glass above.", need: ["sublimed"] },
    ],
    record: "A solid that sublimes turns straight to vapour when heated and straight back to solid on cooling, so it leaves behind a solid that does not. Ammonium chloride can be separated from common salt in the same way.",
  },
  {
    id: "chroma", group: "sep", title: "Paper chromatography of an ink",
    task: "Find out how many dyes there are in black ink, and work out the Rf value of each.",
    needs: "beaker (100 mL), chromatography paper (in Equipment), distilled water",
    steps: [
      { text: "Pour a LITTLE water into a 100 mL beaker: one measure, no more.", need: ["in:beaker100:water"] },
      { text: "Let the chromatography strip go at the mouth of the beaker. Its rod lies across the rim and the paper hangs in the water, with the ink spot above the surface.", need: ["fitted:chroma"] },
      { text: "Watch the water climb. When it stops, read the distances in the notebook.", need: ["chroma"] },
    ],
    record: "Rf = distance moved by the spot ÷ distance moved by the solvent front, both measured from the pencil line. Use the calculator, and put the values in a results table. The line is drawn in pencil because pencil does not dissolve and run.",
  },
  {
    id: "evaporate", group: "sep", title: "Evaporation to crystals",
    task: "Obtain a solid sample of copper(II) sulfate from its solution by evaporation.",
    needs: "tripod and gauze, evaporating dish, a burner, copper(II) sulfate solution",
    steps: [
      { text: "Stand the dish on the tripod and pour the solution in.", need: ["in:dish:cuso4"] },
      { text: "Turn the burner up and hold it under the dish until the water has gone.", need: ["crystals"] },
    ],
    record: "Evaporation separates a dissolved solid from its solvent. Only the water leaves.",
  },
  {
    id: "distil", group: "sep", title: "Simple distillation",
    task: "Set up the apparatus for simple distillation and use it to obtain water from copper(II) sulfate solution.",
    needs: "retort stand, distilling flask, Liebig condenser, beaker, a burner, copper(II) sulfate solution",
    steps: [
      { text: "Clamp the distilling flask high enough for a burner to go under it.", need: ["clamped:distflask"] },
      { text: "Push the condenser onto the side arm and stand a beaker under its lower end.", need: [], test: (seen) => seen.has("fitted:condenser") },
      { text: "Pour in the solution, turn the burner up and hold it under the flask.", need: ["distilled"] },
    ],
    record: "The distillate is water. Cold water goes into the condenser at the lower end and out at the top, so that the jacket stays full.",
  },
  {
    id: "sepfunnel", group: "sep", title: "Separating two liquids that do not mix",
    task: "Separate a mixture of cooking oil and water using a separating funnel.",
    needs: "retort stand, separating funnel, beaker, cooking oil, distilled water",
    steps: [
      { text: "Hang the separating funnel in the clamp, with a beaker under it.", need: ["clamped:sepfunnel"] },
      { text: "Pour in water and then oil. They settle into two layers.", need: ["in:sepfunnel:oil"] },
      { text: "Press the tap and run off the lower layer.", need: ["separated"] },
    ],
    record: "Water is the denser liquid, so it is the lower layer and is run off first.",
  },
  // ── energy and electricity ──
  {
    id: "heat", group: "more", title: "Heat of neutralisation",
    task: "Measure the temperature rise when dilute hydrochloric acid is added to an equal volume of sodium hydroxide solution.",
    needs: "beaker, thermometer, dilute hydrochloric acid, sodium hydroxide solution",
    steps: [
      { text: "Put sodium hydroxide solution in a beaker and take its temperature.", need: [], test: (seen) => [...seen].some((f) => f.startsWith("temp:")) },
      { text: "Add an equal amount of the acid.", need: ["neutral"] },
      { text: "Take the temperature again straight away: it has gone up.", need: [], test: hot },
    ],
    record: "Neutralisation is exothermic: H^+(aq) + OH^-(aq) → H2O(l) gives out heat.",
  },
  {
    id: "displace", group: "more", title: "Displacement and the reactivity series",
    task: "Add zinc to copper(II) sulfate solution, and copper to silver nitrate solution. Record your observations and place the three metals in order of reactivity.",
    needs: "two test tubes or beakers, zinc, copper turnings, copper(II) sulfate solution, silver nitrate solution",
    steps: [
      { text: "Zinc in copper(II) sulfate solution: a red-brown coating, and the blue fades.", need: ["deposit:Cu"] },
      { text: "Copper in silver nitrate solution: silvery crystals, and the liquid turns blue.", need: ["deposit:Ag"] },
    ],
    record: "Zinc displaces copper, and copper displaces silver. In order of reactivity: zinc, copper, silver.",
  },
  {
    id: "electrolysis", group: "more", title: "Electrolysis with carbon electrodes",
    task: "Electrolyse copper(II) sulfate solution, and then concentrated sodium chloride solution, using carbon electrodes. State what is formed at each electrode.",
    needs: "beaker, two carbon electrodes, power pack, copper(II) sulfate solution, sodium chloride solution",
    steps: [
      { text: "Hang both carbon rods in a beaker of copper(II) sulfate solution and hold down the power pack's switch.", need: ["electro:Cu"] },
      { text: "Empty the beaker, pour in sodium chloride solution, and pass the current again.", need: ["electro:Cl2"] },
    ],
    record: "Copper(II) sulfate: copper at the cathode, oxygen at the anode. Brine: hydrogen at the cathode, chlorine at the anode, and sodium hydroxide is left in solution.",
  },
  {
    id: "flame", group: "more", title: "Flame tests",
    task: "Carry out flame tests on solutions of sodium chloride, calcium chloride and copper(II) sulfate. Record the colour each gives.",
    needs: "a burner, flame-test wire, the three solutions in test tubes",
    steps: [
      { text: "Sodium chloride: dip the wire, then hold it in the flame.", need: ["flame:Na"] },
      { text: "Calcium chloride.", need: ["flame:Ca"] },
      { text: "Copper(II) sulfate.", need: ["flame:Cu"] },
    ],
    record: "Sodium golden yellow, calcium brick red, copper blue-green. Clean the wire between tests: sodium's yellow hides the others.",
  },
];

/** Is this step done, given the flags seen so far? */
export function stepDone(step, seen) {
  if (step.test) return step.test(seen);
  if (step.any) return step.any.some((set) => set.every((f) => seen.has(f)));
  return step.need.every((f) => seen.has(f));
}

/** What every experiment relies on: how the bench is worked. Shown when no experiment has been chosen. */
export const HOWTO = [
  "Take pieces from the drawer: tap a tile, or drag it onto the bench. Drag a piece back onto the drawer to put it away.",
  "Pull the stopper out of a bottle before pouring. Carry the bottle to a vessel and hold it there.",
  "Let a vessel go at a rack, a tripod, a clamp or a balance pan and it stands there. Slide a stand's clamp by its yellow boss.",
  "Let a funnel, a stopper, a condenser or a carbon rod go at a mouth or a joint and it stays there. A filter paper goes in a funnel, and a delivery tube in the hole of a one-hole stopper.",
  "A test tube holder grips a tube by its neck, and tongs take a crucible or a dish by its rim: let the tool go at the piece, then carry it by the tool. Over a lit burner it is heated.",
  "A burette and a measuring cylinder are read by eye: choose one and a lens shows its scale. Read the bottom of the meniscus and type the reading into its menu.",
  "Tap a piece for two handles: one tilts it (tilt far enough and it pours), the other opens what can be done with it.",
  "A burner's + and − keys light it and turn it up and down. A burette's blue tap is pressed.",
];
