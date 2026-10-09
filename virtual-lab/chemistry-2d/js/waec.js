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

   A SETTING-UP practical is about the apparatus, not the chemistry: its steps
   have `check(q)` in place of `need`. `q` is the bench itself, asked what is
   standing on what (main.js `Q`), so a step is ticked while the piece is
   really in place and unticked if it is taken away again.

   The GUIDE on the bench is always the guide to the experiment that has been
   chosen: its task, what it needs, and these steps ticking off as they are done.
   ========================================================================== */

export const GROUPS = [
  { id: "setup", label: "Setting up apparatus" },
  { id: "vol", label: "Volumetric analysis" },
  { id: "qual", label: "Qualitative analysis" },
  { id: "gas", label: "Preparing and testing gases" },
  { id: "react", label: "Reactivity of metals and non-metals" },
  { id: "sep", label: "Separating mixtures" },
  { id: "more", label: "Energy and electricity" },
  { id: "safe", label: "Concentrated acids and safety" },
  { id: "fun", label: "Fun science, with things from the kitchen" },
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
  // ── setting up apparatus: from one burner to a whole distillation ──
  {
    id: "setup-heat", group: "setup", title: "Set up: heating on a tripod and gauze",
    task: "Set up the apparatus for heating a liquid in an evaporating dish.",
    needs: "tripod and gauze, evaporating dish (or a beaker), Bunsen burner",
    steps: [
      { text: "Stand a tripod and gauze on the bench.", check: (q) => q.count("rack", "tripod") > 0 },
      { text: "Let an evaporating dish or a beaker go on the gauze: it stands there.", check: (q) => q.anyOn("tripod") },
      { text: "Take a Bunsen burner and press its + key to light it.", check: (q) => q.lit() },
      { text: "Put the lit burner on the bench under the gauze, in the middle.", check: (q) => q.litUnderHost("tripod") },
    ],
    record: "The gauze spreads the heat so that the glass or porcelain is not heated at one point and cracked. The burner stands directly under the middle of the gauze. A dish is never filled more than half full: a boiling liquid spits.",
  },
  {
    id: "setup-filter", group: "setup", title: "Set up: filtration",
    task: "Set up the apparatus for filtering a mixture of a solid and a liquid.",
    needs: "conical flask, filter funnel, filter paper, a beaker to pour from",
    steps: [
      { text: "Stand a conical flask on the bench: it will collect the filtrate.", check: (q) => q.count("vessel", "flask") > 0 },
      { text: "Let a filter funnel go at the mouth of the flask.", check: (q) => q.fitted("funnel", "flask") },
      { text: "Let a filter paper go at the funnel. It is folded in half, in half again, and opened into a cone.", check: (q) => q.paperIn() },
      { text: "Have a beaker beside it, ready to pour the mixture from.", check: (q) => q.count("vessel", "beaker") > 0 },
    ],
    record: "The paper is folded in quarters and opened so that there are three thicknesses on one side and one on the other. It must sit below the rim of the funnel, and the liquid is never poured above the top of the paper, or it runs down outside it unfiltered.",
  },
  {
    id: "setup-titration", group: "setup", title: "Set up: a titration",
    task: "Set up the apparatus for an acid-alkali titration, ready for the first reading.",
    needs: "retort stand and clamp, burette, conical flask, pipette, an acid, an alkali, an indicator",
    kit: "stand burette pipette flask100 hcl naoh phph",
    steps: [
      { text: "Stand a retort stand on the bench and slide its clamp well up the rod (drag the yellow boss).", check: (q) => q.count("rack", "stand") > 0 },
      { text: "Let a burette go at the clamp: it hangs upright.", check: (q) => q.clamped("burette") },
      { text: "Fill the burette: pull the stopper out of the acid and carry the bottle to the top of the burette.", check: (q) => q.holds("burette") },
      { text: "Measure the alkali into a conical flask with the pipette: hold the pipette in the open bottle to fill it, then over the flask to empty it.", check: (q) => q.holds("flask") },
      { text: "Add two drops of indicator to the flask: pull the dropper out of its bottle and hold it over the flask.", check: (q) => q.indicated("flask") },
      { text: "Let the flask go on the base of the stand: it stands there, directly under the tip of the burette.", check: (q) => q.under("burette") },
    ],
    record: "The alkali is measured with a pipette because the amount must be known exactly; the indicator shows the end point. The burette is clamped upright so that its scale can be read at eye level, and its tip is just inside the neck of the flask so that nothing is lost. Before the first reading the tap is run for a moment to fill the tip and drive out the air bubble.",
  },
  {
    id: "setup-sepfunnel", group: "setup", title: "Set up: a separating funnel",
    task: "Set up the apparatus for separating two liquids that do not mix.",
    needs: "retort stand and clamp, separating funnel, beaker",
    steps: [
      { text: "Stand a retort stand on the bench.", check: (q) => q.count("rack", "stand") > 0 },
      { text: "Let a separating funnel go at the clamp: it cannot stand up on its own.", check: (q) => q.clamped("sepfunnel") },
      { text: "Let a beaker go on the base of the stand, directly under the tap.", check: (q) => q.under("sepfunnel") },
    ],
    record: "The stopper is taken out of the top before the tap is opened, or the liquid will not run. The lower layer is run into one beaker and the tap closed at the boundary; the upper layer is then run into a second beaker.",
  },
  {
    id: "setup-electrolysis", group: "setup", title: "Set up: an electrolysis cell",
    task: "Set up a cell for the electrolysis of a solution.",
    needs: "beaker (250 mL), two carbon electrodes, power pack, a salt solution",
    steps: [
      { text: "Pour a salt solution into a 250 mL beaker: this is the electrolyte.", check: (q) => q.holds("beaker") },
      { text: "Let a carbon electrode go at the mouth of the beaker. It hangs in the solution.", check: (q) => q.fitted("electrode", "beaker") },
      { text: "Fit a second electrode. The two must not touch.", check: (q) => q.rods() },
      { text: "Put a power pack on the bench. It wires itself to the two electrodes.", check: (q) => q.wired() },
    ],
    record: "The electrode joined to the negative terminal is the cathode and the one joined to the positive terminal is the anode. The electrodes must dip into the electrolyte and must not touch, or the current takes the short way and nothing is electrolysed.",
  },
  {
    id: "setup-water", group: "setup", title: "Set up: collecting a gas over water",
    task: "Set up the apparatus for preparing a gas and collecting it over water.",
    needs: "conical flask, one-hole stopper, delivery tube, trough, gas jar, distilled water",
    steps: [
      { text: "Stand a trough on the bench and fill it at least half full with distilled water.", check: (q) => q.troughReady() },
      { text: "Let an empty gas jar go in the trough. It turns over and stands full of water.", check: (q) => q.jarOverWater() },
      { text: "Stand a conical flask beside the trough and let a one-hole stopper go at its mouth.", check: (q) => q.stoppered("flask") },
      { text: "Push a delivery tube into the hole of the stopper.", check: (q) => q.tubeIn("flask") },
      { text: "Drag the end of the rubber tube to the gas jar, so that it leads under the jar.", check: (q) => q.leads("water") },
    ],
    record: "The jar is filled with water and turned over so that it holds no air: every bubble that rises into it is the gas. This works for gases that do not dissolve much in water, such as hydrogen and oxygen, and not for ammonia. The reagents go into the flask last, and the stopper straight back in.",
  },
  {
    id: "setup-upward", group: "setup", title: "Set up: upward delivery of a gas",
    task: "Set up the apparatus for collecting a gas that is less dense than air and soluble in water.",
    needs: "retort stand and clamp, two boiling tubes, one-hole stopper, delivery tube",
    steps: [
      { text: "Stand a retort stand on the bench and let a boiling tube go at its clamp.", check: (q) => q.clamped("boil") },
      { text: "Let a one-hole stopper go at the mouth of the clamped tube, and push a delivery tube into it.", check: (q) => q.tubeIn("boil") },
      { text: "Take a second boiling tube and turn it upside down (it is in the tube's own note).", check: (q) => q.upturned("boil") },
      { text: "Drag the end of the rubber tube up into the upturned tube.", check: (q) => q.leads("up") },
    ],
    record: "A gas less dense than air, such as ammonia or hydrogen, rises: it collects at the top of an upturned vessel and pushes the air out at the bottom. Ammonia cannot be collected over water, because it dissolves in it.",
  },
  {
    id: "setup-syringe", group: "setup", title: "Set up: measuring a gas with a syringe",
    task: "Set up the apparatus for measuring the volume of gas given off in a reaction.",
    needs: "retort stand and clamp, gas syringe, conical flask, one-hole stopper, delivery tube",
    steps: [
      { text: "Stand a retort stand on the bench.", check: (q) => q.count("rack", "stand") > 0 },
      { text: "Let a gas syringe go at the clamp, so that it is held level.", check: (q) => q.syringeClamped() },
      { text: "Stand a conical flask on the bench and let a one-hole stopper go at its mouth.", check: (q) => q.stoppered("flask") },
      { text: "Push a delivery tube into the hole of the stopper.", check: (q) => q.tubeIn("flask") },
      { text: "Drag the end of the rubber tube to the nozzle of the syringe.", check: (q) => q.leads("syringe") },
    ],
    record: "The syringe is clamped level so that its plunger moves freely and the weight of the plunger does not squeeze or stretch the gas. Every joint must be airtight. The plunger is pushed right in before the reaction is started, so that the reading starts at nought.",
  },
  {
    id: "setup-distil", group: "setup", title: "Set up: a distillation",
    task: "Set up the apparatus for simple distillation of a solution.",
    needs: "retort stand and clamp, distilling flask, Liebig condenser, beaker, Bunsen burner",
    steps: [
      { text: "Stand a retort stand on the bench and slide its clamp up the rod.", check: (q) => q.count("rack", "stand") > 0 },
      { text: "Let a distilling flask go at the clamp. It is held by its neck, clear of the bench.", check: (q) => q.clamped("distflask") },
      { text: "Push a Liebig condenser onto the side arm of the flask. It slopes down, away from the flask.", check: (q) => q.fitted("condenser", "distflask") },
      { text: "Stand a beaker on the bench under the lower end of the condenser: the receiver.", check: (q) => q.receiver() },
      { text: "Take a Bunsen burner, light it, and put it on the bench under the flask.", check: (q) => q.litUnder("distflask") },
    ],
    record: "Cooling water goes IN at the lower end of the condenser jacket and OUT at the upper end, so that the jacket stays full and the coldest water meets the last of the vapour. The condenser slopes downward so that the distillate runs into the receiver. The bulb of a thermometer, when one is used, is level with the side arm, where it reads the temperature of the vapour that is passing over. The flask is never heated dry.",
  },
  // ── volumetric analysis ──
  {
    id: "titr-strong", group: "vol", title: "Titration: acid against alkali",
    task: "A is dilute hydrochloric acid. B is sodium hydroxide solution. Put A into the burette and titrate it against 25.0 cm³ portions of B, using phenolphthalein as indicator. Record the volume of A used.",
    needs: "retort stand, burette, pipette, conical flask, dilute hydrochloric acid, sodium hydroxide solution, phenolphthalein",
    kit: "stand burette pipette flask100 hcl naoh phph",
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
    kit: "stand burette pipette flask100 hcl na2co3 mo",
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
    needs: "test tube rack, four test tubes, a dropper, the four salt solutions, sodium hydroxide solution",
    kit: "rack tube*4 dropper cuso4 feso4 fecl3 znso4 naoh",
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
    needs: "test tube rack, three test tubes, a dropper, the three salt solutions, aqueous ammonia",
    kit: "rack tube*3 dropper cuso4 znso4 also4 nh3",
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
    kit: "rack tube*3 znso4 nacl na2co3 bacl2 agno3 hcl nh3 lit",
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
    kit: "boil nh4cl naoh burner red",
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
    kit: "rack tube*4 unk naoh nh3 bacl2 agno3 hcl burner red",
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
    kit: "trough gasjar flask100 bung1 tubing water zn hcl lit",
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
    kit: "boil caco3 hcl lit blue",
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
    kit: "boil h2o2 mno2 glow",
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
    kit: "boil*2 bung1 tubing nh4cl naoh burner red",
    steps: [
      { text: "Turn an empty boiling tube upside down from its menu, and lead the delivery tube from the other one up into it.", need: [], test: (seen) => seen.has("piped:up") },
      { text: "Put both solutions in the first tube and warm it.", need: ["gas:NH3"] },
      { text: "Hold red litmus paper at the mouth of the upturned tube: it turns blue.", need: ["test:gasblue", "at:up"] },
    ],
    record: "Ammonia is less dense than air and very soluble in water, so it is collected in a dry, upturned tube and never over water.",
  },
  // ── reactivity: which metal, and which non-metal, pushes which out ──
  {
    id: "metal-water", group: "react", title: "Metals and cold water",
    task: "Add a small piece of each of potassium, sodium, calcium and magnesium to cold water in separate beakers. Record your observations, test one of the solutions left behind, and place the four metals in order of reactivity.",
    needs: "four small beakers, water (distilled, or from the sink's tap), potassium, sodium, calcium and magnesium (in Solids), phenolphthalein",
    kit: "beaker100*4 water k na ca mg phph",
    steps: [
      { text: "Put water in a beaker (two measures, or run it in from the tap) and add a small piece of sodium. Watch the surface.", need: ["water:Na"] },
      { text: "Add two drops of phenolphthalein to that beaker: the water has turned alkaline.", need: [], test: (seen) => seen.has("water:Na") && seen.has("colour:pink") },
      { text: "A fresh beaker of water, and a small piece of potassium.", need: ["water:K"] },
      { text: "A fresh beaker of water, and calcium.", need: ["water:Ca"] },
      { text: "A fresh beaker of water, and magnesium ribbon. Nothing is seen to happen.", need: ["nowater:Mg"] },
    ],
    record: "Potassium catches fire, sodium melts and skates about, calcium fizzes steadily and magnesium hardly reacts at all: in order of reactivity, potassium, sodium, calcium, magnesium. Each gives the metal hydroxide and hydrogen, 2Na(s) + 2H2O(l) → 2NaOH(aq) + H2(g), so the water is left alkaline.",
  },
  {
    id: "metal-acid", group: "react", title: "Metals and dilute acid",
    task: "Add magnesium, zinc, iron and copper to separate portions of dilute hydrochloric acid. Compare how fast each reacts, test the gas, and place the four metals in order of reactivity.",
    needs: "test tube rack, four test tubes, dilute hydrochloric acid, magnesium, zinc, iron filings and copper turnings (in Solids), a lighted splint",
    kit: "rack tube*4 hcl mg zn fe cu lit",
    steps: [
      { text: "Magnesium in dilute hydrochloric acid: it fizzes quickly.", need: ["fizz:Mg"] },
      { text: "Zinc in the acid: it fizzes steadily.", need: ["fizz:Zn"] },
      { text: "Iron in the acid: it fizzes slowly.", need: ["fizz:Fe"] },
      { text: "Copper in the acid: nothing happens.", need: ["noacid:Cu"] },
      { text: "Hold a lighted splint at the mouth of a tube while it is fizzing.", need: ["test:pop"] },
    ],
    record: "The faster the fizzing, the more reactive the metal: magnesium, zinc, iron, and then copper, which is below hydrogen and does not react at all. The gas is hydrogen: Mg(s) + 2HCl(aq) → MgCl2(aq) + H2(g).",
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
    kit: "beaker250*2 sand water",
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
    kit: "boil iodine sand burner holder",
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
    id: "centrifuge", group: "sep", title: "Centrifugation",
    task: "Separate a fine precipitate from its liquid by centrifuging, and pour off the clear liquid.",
    needs: "three test tubes, centrifuge and stop-watch (both in Equipment), copper(II) sulfate solution, sodium hydroxide solution, distilled water",
    kit: "tube*3 centrifuge stopwatch cuso4 naoh water",
    steps: [
      { text: "Make a precipitate in a test tube: a measure of copper(II) sulfate, then a measure of sodium hydroxide.", need: [], test: (seen) => [...seen].some((f) => f.startsWith("ppt:")) },
      { text: "Stand the tube in a well of the centrifuge. In the well OPPOSITE stand a second test tube holding the same amount of water (two measures), to balance it.", check: (q) => q.inHost("centrifuge") >= 2 },
      { text: "Press START on the centrifuge and the crown of the stop-watch together. Watch the rotor go round. After at least 10 seconds press STOP, and wait for it to come to rest.", need: ["spun"] },
      { text: "Lift the tube out and pour the clear liquid off the pellet into an empty test tube.", need: ["supernatant"] },
    ],
    record: "A centrifuge separates a solid from a liquid by spinning: the denser solid is thrown to the bottom of the tube as a pellet, and the clear liquid above it, the supernatant, is poured off. It is used when the solid is too fine to settle or to filter, and it takes time: stopped too soon, the liquid is still cloudy. The tubes are always balanced in opposite pairs, or the spinning rotor shakes itself to pieces.",
  },
  {
    id: "evaporate", group: "sep", title: "Evaporation to crystals",
    task: "Obtain a solid sample of copper(II) sulfate from its solution by evaporation.",
    needs: "tripod and gauze, evaporating dish, a burner, copper(II) sulfate solution",
    kit: "tripod dish burner cuso4",
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
    kit: "stand distflask condenser beaker100 burner cuso4",
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
    kit: "stand sepfunnel beaker100 water oil",
    steps: [
      { text: "Hang the separating funnel in the clamp, with a beaker under it.", need: ["clamped:sepfunnel"] },
      { text: "Pour in water and then oil. They settle into two layers.", need: ["in:sepfunnel:oil"] },
      { text: "Press the tap and run off the lower layer.", need: ["separated"] },
    ],
    record: "Water is the denser liquid, so it is the lower layer and is run off first.",
  },
  {
    id: "indicator", group: "sep", title: "Extraction: an indicator from hibiscus petals",
    task: "Extract the red colouring from dried hibiscus (zobo) petals and show that it can be used as an acid-alkali indicator.",
    needs: "blender (in Glassware), hibiscus petals (in Solids), distilled water, conical flask, filter funnel, filter paper, two test tubes and a rack, dilute hydrochloric acid, sodium hydroxide solution",
    kit: "blender zobo water flask funnel paper rack tube*2 hcl naoh",
    steps: [
      { text: "Tip hibiscus petals into the blender and pour in distilled water.", need: ["added:zobo", "in:blender:water"] },
      { text: "Press BLEND. The petals are cut to a pulp and the water turns deep red.", need: ["extract"] },
      { text: "Fit a funnel and a filter paper in a flask and pour the mixture through. The pulp is the residue.", need: ["filtered"] },
      { text: "Pour a little of the red filtrate into a test tube and add dilute hydrochloric acid.", need: ["petal:acid"] },
      { text: "Pour a little into a second test tube and add sodium hydroxide solution: it turns green.", need: ["petal:alkali"] },
    ],
    record: "Blending breaks the cells open so that the colouring dissolves in the water, and filtering takes out the pulp. The extract is red in an acid and green in an alkali, so it is an indicator. Many plant colours behave like this; litmus itself is extracted from lichens.",
  },
  // ── energy and electricity ──
  {
    id: "heat", group: "more", title: "Heat of neutralisation",
    task: "Measure the temperature rise when dilute hydrochloric acid is added to an equal volume of sodium hydroxide solution.",
    needs: "beaker, thermometer, dilute hydrochloric acid, sodium hydroxide solution",
    kit: "beaker100 thermo naoh hcl",
    steps: [
      { text: "Put sodium hydroxide solution in a beaker and take its temperature.", need: [], test: (seen) => [...seen].some((f) => f.startsWith("temp:")) },
      { text: "Add an equal amount of the acid.", need: ["neutral"] },
      { text: "Take the temperature again straight away: it has gone up.", need: [], test: hot },
    ],
    record: "Neutralisation is exothermic: H^+(aq) + OH^-(aq) → H2O(l) gives out heat.",
  },
  {
    id: "displace", group: "react", title: "Metals: displacement and the reactivity series",
    task: "Add zinc to copper(II) sulfate solution, copper to silver nitrate solution, and copper to zinc sulfate solution. Record your observations and place the three metals in order of reactivity.",
    needs: "three test tubes and a rack, zinc, copper turnings, copper(II) sulfate solution, silver nitrate solution, zinc sulfate solution",
    kit: "rack tube*3 zn cu cuso4 agno3 znso4",
    steps: [
      { text: "Zinc in copper(II) sulfate solution: a red-brown coating, and the blue fades.", need: ["deposit:Cu"] },
      { text: "Copper in silver nitrate solution: silvery crystals, and the liquid turns blue.", need: ["deposit:Ag"] },
      { text: "Copper in zinc sulfate solution: nothing happens. It does not work the other way round.", need: ["nodisplace:Cu<Zn"] },
    ],
    record: "Zinc displaces copper, and copper displaces silver, but copper cannot displace zinc. A metal displaces from solution only the metals below it. In order of reactivity: zinc, copper, silver.",
  },
  {
    id: "halogens", group: "react", title: "Non-metals: which halogen displaces which",
    task: "Add chlorine water to potassium bromide solution and to potassium iodide solution. Add bromine water to potassium iodide solution and to sodium chloride solution. Record your observations and place chlorine, bromine and iodine in order of reactivity.",
    needs: "test tube rack, four test tubes, chlorine water and bromine water (in Liquids), potassium bromide, potassium iodide and sodium chloride solutions",
    kit: "rack tube*4 clw brw kbr ki nacl",
    steps: [
      { text: "Chlorine water added to potassium bromide solution: it turns orange.", need: ["halogen:Cl>Br"] },
      { text: "Chlorine water added to potassium iodide solution: it turns brown.", need: ["halogen:Cl>I"] },
      { text: "Bromine water added to potassium iodide solution: it turns brown.", need: ["halogen:Br>I"] },
      { text: "Bromine water added to sodium chloride solution: no reaction. The orange is only the bromine water's own.", need: ["nohalogen:Br>Cl"] },
    ],
    record: "A halogen displaces from its salts any halogen below it in Group 7: Cl2(aq) + 2KBr(aq) → 2KCl(aq) + Br2(aq). Chlorine displaces both bromine and iodine, bromine displaces only iodine, and iodine displaces neither. In order of reactivity: chlorine, bromine, iodine. For non-metals the order runs the other way from the metals: the most reactive is the one that GAINS electrons most readily.",
  },
  {
    id: "electrolysis", group: "more", title: "Electrolysis with carbon electrodes",
    task: "Electrolyse copper(II) sulfate solution, and then concentrated sodium chloride solution, using carbon electrodes. State what is formed at each electrode.",
    needs: "beaker, two carbon electrodes, power pack, copper(II) sulfate solution, sodium chloride solution",
    kit: "beaker250 electrode*2 power cuso4 nacl",
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
    kit: "burner wire rack tube*3 nacl cacl2 cuso4",
    steps: [
      { text: "Sodium chloride: dip the wire, then hold it in the flame.", need: ["flame:Na"] },
      { text: "Calcium chloride.", need: ["flame:Ca"] },
      { text: "Copper(II) sulfate.", need: ["flame:Cu"] },
    ],
    record: "Sodium golden yellow, calcium brick red, copper blue-green. Clean the wire between tests: sodium's yellow hides the others.",
  },

  // ── concentrated acids: which is poured into which, and what the acid does to paper ──
  {
    id: "acid-to-water", group: "safe", title: "Diluting an acid: acid to water",
    task: "Dilute concentrated sulfuric acid the safe way, and measure how hot it gets.",
    needs: "beaker, thermometer, distilled water, concentrated sulfuric acid (in Acids)",
    steps: [
      { text: "Half fill a beaker with distilled water and take its temperature.", need: ["added:water"], test: (seen) => seen.has("added:water") && [...seen].some((f) => f.startsWith("temp:")) },
      { text: "Pour concentrated sulfuric acid INTO the water, one measure at a time.", need: ["dilute:right"] },
      { text: "Take the temperature again: the liquid is hot, but it stayed calm.", need: [], test: hot },
    ],
    record: "Diluting concentrated sulfuric acid is strongly exothermic. The acid is always added to the water, slowly and with stirring: it is the denser liquid, so it sinks and mixes, and the heat is shared by all the water.",
  },
  {
    id: "water-to-acid", group: "safe", title: "Water to acid: why it is never done",
    task: "See what happens when water is poured onto concentrated sulfuric acid. On this bench it is safe to find out.",
    needs: "boiling tube or beaker, concentrated sulfuric acid (in Acids), distilled water",
    steps: [
      { text: "Pour a measure of concentrated sulfuric acid into an empty, dry vessel.", need: ["conc"] },
      { text: "Now pour distilled water onto the acid, and watch the mouth of the vessel.", need: ["dilute:wrong"] },
    ],
    record: "Water is less dense than the acid and lies on top of it. The heat of mixing is given out in that thin layer of water, which boils at once and throws hot acid out. The rule: add acid to water, never water to acid.",
  },
  {
    id: "conc-metal", group: "safe", title: "Copper and concentrated sulfuric acid",
    task: "Show that concentrated sulfuric acid is an oxidising agent: hot, it attacks a metal that dilute acid cannot touch.",
    needs: "two boiling tubes, copper turnings (in Solids), dilute and concentrated sulfuric acid, a burner, a holder, blue litmus paper",
    kit: "boil*2 cu h2so4 ch2so4 burner holder blue",
    steps: [
      { text: "Put copper in a boiling tube and add DILUTE sulfuric acid. Nothing happens, even on heating.", need: ["added:cu", "added:h2so4"] },
      { text: "Put copper in a dry boiling tube and add CONCENTRATED sulfuric acid. Cold, nothing happens.", need: ["added:ch2so4"] },
      { text: "Heat the tube. The copper is attacked and a choking gas comes off.", need: ["gas:SO2"] },
      { text: "Hold damp blue litmus at the mouth: it turns red.", need: ["test:so2"] },
    ],
    record: "Cu(s) + 2H2SO4(l) → CuSO4(aq) + SO2(g) + 2H2O(l). Copper is below hydrogen and never gives hydrogen with an acid. Hot concentrated sulfuric acid oxidises it instead, and is reduced to sulfur dioxide, an acidic gas.",
  },
  {
    id: "char", group: "safe", title: "Concentrated sulfuric acid chars paper",
    task: "Show that concentrated sulfuric acid is corrosive, and that the dilute acid does not do the same.",
    needs: "two test tubes, strips of paper (in Equipment), concentrated and dilute sulfuric acid",
    kit: "rack tube*2 slip h2so4 ch2so4",
    steps: [
      { text: "Pour concentrated sulfuric acid into one test tube and dilute sulfuric acid into another.", need: ["added:ch2so4", "added:h2so4"] },
      { text: "Dip a strip of paper in the dilute acid. It only gets wet.", need: ["slip:dilute"] },
      { text: "Dip a fresh strip in the concentrated acid. It turns black.", need: ["charred"] },
    ],
    record: "Concentrated sulfuric acid is a dehydrating agent: it takes the elements of water out of the cellulose in paper and leaves carbon, C6H10O5(s) → 6C(s) + 5H2O(l). It chars cloth, wood, sugar and skin in the same way.",
  },
  // ── fun science: the experiments young children do, with things from the kitchen ──
  {
    id: "volcano", group: "fun", title: "Make a volcano erupt",
    task: "Make the model volcano erupt with red, foaming lava.",
    needs: "model volcano (in Glassware), baking soda (in Solids), washing-up liquid, red food colouring and vinegar (in Liquids)",
    kit: "volcano bicarb soap dye vinegar",
    steps: [
      { text: "Tip baking soda into the crater of the volcano.", need: ["added:bicarb"] },
      { text: "Add red food colouring and a squirt of washing-up liquid.", need: ["added:dye", "added:soap"] },
      { text: "Now pour in the vinegar, and stand back.", need: ["erupt"] },
    ],
    record: "Vinegar is an acid. Baking soda fizzes in an acid and gives off a gas, carbon dioxide. The soap catches the gas in bubbles, so it comes out as foam, and the colouring makes the foam look like lava. A real volcano is not a chemical reaction: its lava is melted rock, pushed out by gas.",
  },
  {
    id: "balloon", group: "fun", title: "Blow up a balloon without blowing",
    task: "Inflate a balloon using vinegar and baking soda.",
    needs: "conical flask (100 mL), balloon (in Equipment), vinegar (in Liquids), baking soda (in Solids)",
    kit: "flask100 balloon vinegar bicarb",
    steps: [
      { text: "Pour vinegar into the conical flask.", need: ["in:flask100:vinegar"] },
      { text: "Tip in baking soda. It fizzes at once.", need: ["gas:CO2"] },
      { text: "Quickly stretch the balloon over the mouth of the flask: let it go at the mouth.", need: ["balloon:up"] },
    ],
    record: "The fizzing is a gas, carbon dioxide, being made. A gas takes up far more room than the powder and the liquid it came from. With the balloon over the mouth it has nowhere else to go, so it blows the balloon up.",
  },
  {
    id: "lemon", group: "fun", title: "The floating lemon",
    task: "Find out whether a lemon floats, and what happens when it is peeled.",
    needs: "beaker (500 mL), water (from the tap, or distilled), a lemon and a peeled lemon (in Equipment)",
    kit: "beaker500 water lemon peeled",
    steps: [
      { text: "Half fill a big beaker with water.", need: ["in:beaker500:water"] },
      { text: "Let the whole lemon go into the water.", need: ["float:lemon"] },
      { text: "Take it out, and let the peeled lemon go in.", need: ["sink:peeled"] },
    ],
    record: "The lemon with its peel on floats, and the peeled lemon sinks. The peel is full of tiny pockets of air, like a life-jacket: with them the lemon is less dense than water. Without them it is denser than water, so it sinks.",
  },
  {
    id: "egg", group: "fun", title: "The egg that floats",
    task: "Make an egg float in water.",
    needs: "beaker (250 mL), water, an egg (in Equipment), table salt (in Solids), a glass rod",
    kit: "beaker250 water egg salt rod",
    steps: [
      { text: "Put water in the beaker and let the egg go into it. It sinks.", need: ["sink:egg"] },
      { text: "Tip in table salt, a spoonful at a time, and swirl or stir. Keep adding salt.", need: ["dissolved:salt"] },
      { text: "Watch the egg: when there is enough salt in the water, it rises and floats.", need: ["float:egg"] },
    ],
    record: "An egg is a little denser than fresh water, so it sinks. Salt dissolved in the water makes the water denser. When the salt water is denser than the egg, it holds the egg up. That is why it is easier to float in the sea than in a river.",
  },
  {
    id: "toothpaste", group: "fun", title: "Elephant's toothpaste",
    task: "Make a tower of foam shoot out of a measuring cylinder.",
    needs: "measuring cylinder (100 mL), hydrogen peroxide solution, washing-up liquid and red food colouring (in Liquids), dried yeast (in Solids)",
    kit: "cyl100 h2o2 soap dye yeast",
    steps: [
      { text: "Pour hydrogen peroxide solution into the measuring cylinder.", need: ["in:cyl100:h2o2"] },
      { text: "Add washing-up liquid and red food colouring.", need: ["added:soap", "added:dye"] },
      { text: "Tip in the yeast.", need: ["foam"] },
    ],
    record: "Hydrogen peroxide slowly breaks down into water and oxygen. Yeast makes it happen all at once. The soap catches the oxygen in bubbles, and the foam is squeezed up and out of the narrow cylinder like toothpaste from a tube. The cylinder gets warm: the reaction gives out heat.",
  },
  {
    id: "lava", group: "fun", title: "A lava lamp",
    task: "Make coloured blobs rise and fall through oil.",
    needs: "measuring cylinder (100 mL), vinegar, red food colouring and cooking oil (in Liquids), baking soda (in Solids)",
    kit: "cyl100 vinegar dye oil bicarb",
    steps: [
      { text: "Pour vinegar into the cylinder and colour it red.", need: ["in:cyl100:vinegar", "added:dye"] },
      { text: "Pour cooking oil on top. It floats: two layers.", need: ["in:cyl100:oil"] },
      { text: "Tip in baking soda. It falls through the oil and fizzes when it reaches the vinegar.", need: ["lava"] },
    ],
    record: "Oil and water do not mix, and oil floats because it is less dense. The baking soda fizzes in the vinegar and makes bubbles of gas. Each bubble carries a blob of red liquid up through the oil. At the top the gas escapes, and the blob, heavy again, sinks back.",
  },
];

/** Is this step done, given the flags seen so far? */
export function stepDone(step, seen, q) {
  if (step.check) { try { return Boolean(q && step.check(q)); } catch { return false; } }
  if (step.test) return step.test(seen);
  if (step.any) return step.any.some((set) => set.every((f) => seen.has(f)));
  return step.need.every((f) => seen.has(f));
}

/** What every experiment relies on: how the bench is worked. Shown when no experiment has been chosen. */
export const HOWTO = [
  "Ask PrepBot (press A) to DO an experiment and it will, so long as the drawer holds what it needs, even one that is in no list. It says what it is doing, and then tells you what was really seen.",
  "Fun science: a model volcano, a balloon, a lemon and an egg are in the drawer, with baking soda, vinegar, washing-up liquid and food colouring. A lemon or an egg let go at the mouth of a beaker drops into the water; a balloon let go at the mouth of a flask stretches over it.",
  "Teachers: open PrepBot's experiments and choose Set a practical for your class. Your students get a link, PrepBot teaches them, and what each one did comes back to you.",
  "PrepBot can set any practical out for you: press PrepBot, set it up in the guide, or ask it (press A) to set up the experiment you want.",
  "Take pieces from the drawer: tap a tile, or drag it onto the bench. Drag a piece back onto the drawer to put it away.",
  "Pull the stopper out of a bottle before pouring. Carry the bottle to a vessel and hold it there. What is poured out is gone from the bottle: when one runs out, refill it from its own note. A bottle pours a full measure: for a few drops, fill the dropper from it.",
  "Nothing is poured on the bench, and nothing is poured away for you. Take the sink from Equipment and tilt the vessel over it. An emptied vessel still has drops of the last liquid in it.",
  "To wash a vessel, stand it in the sink under the tap and press the tap's blue key. Turn the tap off, shake the vessel, and tilt it to pour the water away. Then dry it over a flame, or push the cloth into it and rub.",
  "The bench goes on to left and right, and there is no end to the room above it. Drag the empty bench to move about, zoom out to see more, and press the middle zoom key to see everything at once.",
  "The blender (in Glassware) cuts soft things up in a liquid: press BLEND on its base. It mixes; it cannot make an insoluble solid dissolve.",
  "Bottles marked CONC. in red are concentrated. Pour a concentrated acid INTO water, never water onto the acid. A strip of plain paper (in Equipment) shows what the concentrated acid does to anything it touches.",
  "Let a vessel go at a rack, a tripod, a clamp or a balance pan and it stands there. Slide a stand's clamp by its yellow boss.",
  "Let a funnel, a stopper, a condenser or a carbon rod go at a mouth or a joint and it stays there. A filter paper goes in a funnel, and a delivery tube in the hole of a one-hole stopper.",
  "Move a vessel quickly to and fro to shake it: the faster the hand, the harder it is shaken and the better it mixes.",
  "A lit burner put under a vessel stays there and goes on heating it. Turn it down or off with its \u2212 key, or drag it away.",
  "A test tube holder grips a tube by its neck, and tongs take a crucible or a dish by its rim: let the tool go at the piece, then carry it by the tool. Over a lit burner it is heated.",
  "What you see happen comes up on a yellow note and is written in the notebook. Tap the note to put it away; its key on the bar (or the O key) hides the note altogether, and brings the last one back.",
  "A burette and a measuring cylinder are read by eye: choose one and a lens shows its scale. Read the bottom of the meniscus and type the reading into its menu.",
  "Tap a piece for two handles: one tilts it (tilt far enough and it pours), the other opens what can be done with it.",
  "A burner's + and − keys light it and turn it up and down. A burette's blue tap is pressed.",
];
