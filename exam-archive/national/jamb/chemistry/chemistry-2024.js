const examQuestions = [
  {
    question:
      "The molecule with the highest number of lone pair of electrons is",
    image: null,
    options: ["\\( H_2O \\)", "\\( NH_3 \\)", "\\( CH_4 \\)", "\\( CO_2 \\)"],
    correctIndex: 3,
    hint: "Draw Lewis structures for each molecule and count all non-bonding electron pairs across all atoms.",
    explanation: [
      "In \\( H_2O \\), oxygen has 2 lone pairs.",
      "In \\( NH_3 \\), nitrogen has 1 lone pair.",
      "In \\( CH_4 \\), carbon has 0 lone pairs.",
      "In \\( CO_2 \\) (\\( O=C=O \\)), the carbon atom has 0 lone pairs, but each oxygen atom has 2 lone pairs, totaling 4 lone pairs for the whole molecule.",
    ],
  },
  {
    question: "The composition of petroleum varies because it is a",
    image: null,
    options: ["hydrocarbon", "liquid", "mixture", "natural resource"],
    correctIndex: 2,
    hint: "Consider the fundamental chemical definition of substances that do not have a fixed, constant formula.",
    explanation: [
      "Petroleum is a complex mixture of many different hydrocarbons and other organic compounds.",
      "Unlike pure compounds, mixtures do not have a fixed chemical composition; their constituents can vary depending on their geological source.",
    ],
  },
  {
    question:
      "Based on the functional groups (I: \\( ROH \\), II: \\( RCOR' \\), III: \\( ROR' \\), IV: \\( RCOOH \\), V: \\( RCOOR' \\)), the two compounds that will combine in the presence of an acid catalyst to produce compound V are",
    image: "../jamb/chemistry/2024/q3.svg",
    options: ["I and IV", "III and IV", "I and II", "II and III"],
    correctIndex: 0,
    hint: "Recall the reaction process known as esterification.",
    explanation: [
      "Esterification is the reaction between an alkanol (alcohol) and an alkanoic acid (carboxylic acid) in the presence of an acid catalyst to produce an ester (alkanoate) and water.",
      "In the provided list, I is an alkanol (\\( ROH \\)) and IV is an alkanoic acid (\\( RCOOH \\)). Compound V is an ester (\\( RCOOR' \\)).",
    ],
  },
  {
    question: "An example of an alkaline gas is",
    image: null,
    options: ["\\( HCl \\)", "\\( N_2 \\)", "\\( NH_3 \\)", "\\( NO_2 \\)"],
    correctIndex: 2,
    hint: "Think of a common gas that turns moist red litmus paper blue.",
    explanation: [
      "Ammonia (\\( NH_3 \\)) is a classic example of a basic or alkaline gas.",
      "When dissolved in water, it forms ammonium hydroxide, which contains hydroxide ions (\\( OH^- \\)), giving it its alkaline property.",
    ],
  },
  {
    question:
      "The dusty and sand particles present in the air is an example of",
    image: null,
    options: [
      "a suspension",
      "a dispersion",
      "an emulsion",
      "a saturated solution",
    ],
    correctIndex: 0,
    hint: "Consider the type of heterogeneous mixture where solid particles are large enough to eventually settle out.",
    explanation: [
      "A suspension is a heterogeneous mixture containing large solid particles that will eventually settle out over time.",
      "Dust and sand in the air are solid particles suspended in a gaseous medium, fitting this description.",
    ],
  },
  {
    question: "The property of metal that makes it suitable as a catalyst is",
    image: null,
    options: [
      "filled f-orbital",
      "partially filled d-orbitals",
      "partially filled f-orbital",
      "filled d-orbital",
    ],
    correctIndex: 1,
    hint: "Think about why transition metals are commonly used in industrial catalytic processes like the Haber process.",
    explanation: [
      "Many metals, particularly transition metals, are effective catalysts because they have partially filled d-orbitals.",
      "These d-orbitals allow the metal to form temporary, intermediate bonds with reactant molecules, providing an alternative reaction pathway with a lower activation energy.",
    ],
  },
  {
    question:
      "When \\( \\Delta H \\) is positive and small, and \\( \\Delta S \\) is positive and large, the reaction will be",
    image: null,
    options: [
      "Non-spontaneous",
      "favour forward reaction only",
      "favour backward reaction only",
      "spontaneous",
    ],
    correctIndex: 3,
    hint: "Evaluate the Gibbs free energy equation: \\( \\Delta G = \\Delta H - T\\Delta S \\).",
    explanation: [
      "Spontaneity is determined by the sign of the Gibbs free energy change (\\( \\Delta G \\)). A reaction is spontaneous if \\( \\Delta G \\) is negative.",
      "In the equation \\( \\Delta G = \\Delta H - T\\Delta S \\), if \\( \\Delta H \\) is a small positive value and \\( \\Delta S \\) is a large positive value, the term \\( -T\\Delta S \\) will likely outweigh \\( \\Delta H \\) at most temperatures, resulting in a negative \\( \\Delta G \\).",
    ],
  },
  {
    question: "Calculate the pH of \\( 0.001M \\) \\( KOH \\) solution.",
    image: null,
    options: ["11", "14", "12", "3"],
    correctIndex: 0,
    hint: "First calculate the pOH using the concentration of hydroxide ions, then use the relation \\( pH + pOH = 14 \\).",
    explanation: [
      "\\( KOH \\) is a strong base that dissociates completely: \\( [OH^-] = 0.001M = 10^{-3} M \\).",
      "Calculate pOH: \\( pOH = -\\log[OH^-] = -\\log(10^{-3}) = 3 \\).",
      "Calculate pH: Since \\( pH + pOH = 14 \\), then \\( pH = 14 - 3 = 11 \\).",
    ],
  },
  {
    question: "The acid used in making baking soda and soft drink is",
    image: null,
    options: ["tartaric acid", "fatty acid", "boric acid", "citric acid"],
    correctIndex: 3,
    hint: "Consider a common organic acid found in citrus fruits used widely in the food industry.",
    explanation: [
      "Citric acid is a common organic acid used as an acidulant in many soft drinks.",
      "It is also often used in combination with sodium bicarbonate (baking soda) in effervescent products to create carbon dioxide gas bubbles.",
    ],
  },
  {
    question:
      "For the reaction \\( NH_3(g) + HCl(g) \\rightarrow NH_4Cl(g) \\), an increase in pressure will",
    image: null,
    options: [
      "lower the equilibrium constant",
      "favour the product",
      "favour the reactant",
      "increase the equilibrium constant",
    ],
    correctIndex: 1,
    hint: "Apply Le Chatelier's principle regarding total moles of gaseous reactants versus products.",
    explanation: [
      "According to Le Chatelier's Principle, increasing pressure shifts the equilibrium towards the side with fewer moles of gas.",
      "The reactants consist of 2 moles of gas, while the product is 1 mole of gas. Therefore, an increase in pressure shifts the equilibrium to the right, favoring the product side.",
    ],
  },
  {
    question:
      "The compound \\( CH_3CH(NH_2)CH_2CH_2CH_3 \\) is an example of a",
    image: null,
    options: [
      "primary amine",
      "tertiary amine",
      "quaternary amine",
      "secondary amine",
    ],
    correctIndex: 0,
    hint: "Count how many carbon (alkyl) groups are directly bonded to the nitrogen atom.",
    explanation: [
      "Amines are classified based on the number of alkyl groups attached to the nitrogen atom.",
      "In this structure, the nitrogen is bonded to one large alkyl group and two hydrogen atoms. This makes it a primary amine.",
    ],
  },
  {
    question:
      "Nitrogen, a component of air, is primarily used for the industrial",
    image: null,
    options: [
      "production of cooling agent",
      "production of margarine",
      "production of \\( HNO_3 \\)",
      "manufacturing of oil",
    ],
    correctIndex: 2,
    hint: "Think about the major industrial chemical pathway starting from atmospheric nitrogen via the Haber process.",
    explanation: [
      "Nitrogen is used to produce ammonia (\\( NH_3 \\)) in the Haber process.",
      "Ammonia is then used as the primary starting material in the Ostwald process for manufacturing nitric acid (\\( HNO_3 \\)), an essential industrial chemical.",
    ],
  },
  {
    question:
      "In the reaction \\( 2Na + Cl_2 \\rightarrow 2NaCl \\), the species that undergoes reduction is",
    image: null,
    options: ["\\( Na \\)", "\\( NaCl \\)", "\\( Cl^- \\)", "\\( Cl_2 \\)"],
    correctIndex: 3,
    hint: "Reduction involves a gain of electrons, which is reflected as a decrease in oxidation state.",
    explanation: [
      "The oxidation state of Sodium (\\( Na \\)) changes from 0 to +1 (oxidation).",
      "The oxidation state of Chlorine in \\( Cl_2 \\) changes from 0 to -1 in \\( NaCl \\). This decrease in oxidation state signifies reduction, meaning \\( Cl_2 \\) is the species reduced.",
    ],
  },
  {
    question: "The sublimation of a solid to a gas involves",
    image: null,
    options: [
      "energy absorption",
      "vapourization",
      "melting",
      "osmotic diffusion",
    ],
    correctIndex: 0,
    hint: "Consider whether heat energy must be added to a system for a solid to become a gas.",
    explanation: [
      "Sublimation is a phase change from solid directly to gas. To overcome the intermolecular forces of the solid phase, the substance must take in heat from its surroundings.",
      "Therefore, sublimation is an endothermic process that involves the absorption of energy.",
    ],
  },
  {
    question:
      "The products of the thermal decomposition of ammonium trioxonitrate(V) are",
    image: null,
    options: [
      "\\( N_2O \\) and \\( H_2O \\)",
      "\\( NO_2 \\) and \\( H_2O \\)",
      "\\( N_2O \\) and \\( O_2 \\)",
      "\\( NO_3 \\) and \\( H_2O \\)",
    ],
    correctIndex: 0,
    hint: "Recall the balanced chemical equation for the controlled heating of ammonium nitrate.",
    explanation: [
      "Ammonium trioxonitrate(V) is the chemical name for ammonium nitrate (\\( NH_4NO_3 \\)).",
      "Upon controlled heating, it decomposes according to the equation: \\( NH_4NO_3 \\rightarrow N_2O + 2H_2O \\), yielding dinitrogen monoxide and water vapor.",
    ],
  },
  {
    question:
      "In the chemical equation \\( 2X + 2HCl \\rightarrow 2XCl + H_2 \\), X is",
    image: null,
    options: ["K", "Mg", "Ca", "Ba"],
    correctIndex: 0,
    hint: "Examine the stoichiometry and the formula of the product chloride to determine the metal's valency.",
    explanation: [
      "The product \\( XCl \\) indicates that the metal \\( X \\) has a valency of +1.",
      "Potassium (\\( K \\)) is a Group 1 alkali metal with a valency of +1. The other options (\\( Mg, Ca, Ba \\)) are Group 2 alkaline earth metals with a valency of +2, which would form chlorides with the formula \\( XCl_2 \\).",
    ],
  },
  {
    question:
      "Alkanoic acids have higher boiling points than alkanols of similar molecular weight because",
    image: null,
    options: [
      "alkanoic acids are more volatile than alkanols",
      "alkanols are more polar than alkanoic acids",
      "alkanoic acids are larger molecules",
      "alkanoic acids form stronger hydrogen bonds",
    ],
    correctIndex: 3,
    hint: "Consider the ability of carboxylic acids to form stable dimers through hydrogen bonding.",
    explanation: [
      "While both have hydroxyl groups for hydrogen bonding, alkanoic acids can form stable dimers where two hydrogen bonds hold a pair of molecules together.",
      "This double hydrogen bonding significantly increases the amount of energy required to boil the substance compared to alkanols.",
    ],
  },
  {
    question: "Water drops are spherical in shape because of",
    image: null,
    options: ["polarity", "viscocity", "density", "surface tension"],
    correctIndex: 3,
    hint: "Recall the physical property that causes a liquid surface to minimize its area.",
    explanation: [
      "Surface tension is a force that pulls surface molecules toward the interior of a liquid, causing the surface to contract.",
      "This force results in the liquid adopting a shape that minimizes surface area for a given volume, which is a sphere.",
    ],
  },
  {
    question:
      "In the electrolysis of brine using a neutral electrode, which ion is discharged at the anode?",
    image: null,
    options: ["\\( 2H^+ \\)", "\\( Na^+ \\)", "\\( Cl^- \\)", "\\( OH^- \\)"],
    correctIndex: 2,
    hint: "Consider how ion concentration affects the preferential discharge of anions in an electrolytic cell.",
    explanation: [
      "Brine is a concentrated \\( NaCl \\) solution containing \\( Cl^- \\) and \\( OH^- \\) anions. At the anode, these ions compete for discharge.",
      "Due to its high concentration in brine, the chloride ion (\\( Cl^- \\)) is preferentially discharged over the hydroxide ion (\\( OH^- \\)) to form chlorine gas.",
    ],
  },
  {
    question:
      "The time required to deposit \\( 4.5g \\) of copper from \\( CuSO_4 \\) solution by passing a current of \\( 2.5 \\) Amperes is (\\( Cu = 64g \\); \\( 1F = 96500C/mol \\))",
    image: null,
    options: ["2714 sec", "2527 sec", "5428 sec", "6785 sec"],
    correctIndex: 2,
    hint: "Apply Faraday's first law equation: \\( m = \\frac{I \\cdot t \\cdot M}{n \\cdot F} \\).",
    explanation: [
      "Using the formula \\( m = \\frac{I \\cdot t \\cdot M}{n \\cdot F} \\), for \\( Cu^{2+} \\), \\( n = 2 \\). Rearrange to find time: \\( t = \\frac{m \\cdot n \\cdot F}{I \\cdot M} \\).",
      "Plugging in the values: \\( t = \\frac{4.5 \\cdot 2 \\cdot 96500}{2.5 \\cdot 64} = \\frac{868500}{160} = 5428.125 \\) seconds.",
      "Rounding to the nearest whole number gives \\( 5428 \\) sec.",
    ],
  },
  {
    question:
      "Which of the following pairs of elements will exhibit diagonal relationship?",
    image: null,
    options: ["Be and Si", "Na and Be", "Li and Al", "B and Si"],
    correctIndex: 3,
    hint: "Think about elements from different periods and groups that share similar chemical properties due to similar charge-to-radius ratios.",
    explanation: [
      "Diagonal relationships occur between certain elements of the second and third periods that are positioned diagonally to each other.",
      "The common pairs are Lithium and Magnesium, Beryllium and Aluminum, and Boron and Silicon.",
    ],
  },
  {
    question: "The following is not a water pollutant?",
    image: null,
    options: [
      "warm water affluent",
      "inorganic fertilizers",
      "oxygen gas",
      "biodegradable waste",
    ],
    correctIndex: 2,
    hint: "Identify a substance that is a natural part of aquatic ecosystems and essential for the survival of fish.",
    explanation: [
      "Oxygen gas is naturally dissolved in water and is vital for aquatic life.",
      "In contrast, thermal pollution (warm water), nutrient pollution (fertilizers), and high organic load (biodegradable waste) all degrade water quality.",
    ],
  },
  {
    question: "Acid radicals are present in",
    image: null,
    options: [
      "\\( CO_3^{2-}, PO_4^{3-}, Mg^{2+} \\)",
      "\\( CO_3^{2-}, SO_4^{2-}, Na^+ \\)",
      "\\( CO_3^{2-}, SO_4^{2-}, NO_3^- \\)",
      "\\( CO_3^{2-}, SO_4^{2-}, K^+ \\)",
    ],
    correctIndex: 2,
    hint: "Acid radicals are negatively charged ions (anions) that remain after an acid dissociates and loses its hydrogen ions.",
    explanation: [
      "An acid radical is the anion part of a salt. For example, carbonate (\\( CO_3^{2-} \\)) is from carbonic acid, sulfate (\\( SO_4^{2-} \\)) from sulfuric acid, and nitrate (\\( NO_3^- \\)) from nitric acid.",
      "Option C contains only anions derived from acids.",
    ],
  },
  {
    question:
      "What accounts for the low melting and boiling points of covalent molecules?",
    image: null,
    options: [
      "They have weak intermolecular forces",
      "They have definite shapes",
      "They are three dimensional structures",
      "They possess shared electron pairs",
    ],
    correctIndex: 0,
    hint: "Consider the strength of the forces holding separate molecules together in the solid and liquid phases.",
    explanation: [
      "Covalent molecules are held together by relatively weak intermolecular forces, such as van der Waals forces or hydrogen bonds.",
      "Because these forces are weak, only a small amount of thermal energy is needed to overcome them and cause a phase change, resulting in low melting and boiling points.",
    ],
  },
  {
    question: "Iron produced directly from a blast furnace is",
    image: null,
    options: ["wrought iron", "cast iron", "pig iron", "carbon steel"],
    correctIndex: 2,
    hint: "This is the crude, impure form of iron obtained immediately after the smelting process.",
    explanation: [
      "The iron that is tapped directly from the bottom of a blast furnace contains around 3-4% carbon and other impurities.",
      "This specific form of iron is referred to as pig iron.",
    ],
  },
  {
    question:
      "What is the molecular mass of an alkanoic acid, if 0.5 mole of the acid weighs 44g?",
    image: null,
    options: ["72", "88", "60", "46"],
    correctIndex: 1,
    hint: "Use the standard relationship: Molar mass = Mass / Number of moles.",
    explanation: [
      "Molar mass is the mass of exactly one mole of a substance.",
      "Calculation: \\( \text{Molecular Mass} = \frac{44\text{ g}}{0.5\text{ mol}} = 88\text{ g/mol} \\).",
    ],
  },
  {
    question: "Alkenes are represented with the general molecular formula",
    image: null,
    options: [
      "\\( C_n H_{2n} \\)",
      "\\( C_n H_{2n-2} \\)",
      "\\( C_n H_{2n+2} \\)",
      "\\( C_n H_{2n+1}OH \\)",
    ],
    correctIndex: 0,
    hint: "Alkenes are unsaturated hydrocarbons that contain exactly one carbon-carbon double bond.",
    explanation: [
      "The presence of one double bond reduces the number of hydrogen atoms by two compared to alkanes.",
      "The general formula for alkanes is \\( C_n H_{2n+2} \\), thus for alkenes, it is \\( C_n H_{2n} \\).",
    ],
  },
  {
    question:
      "The major product when 2-methylpropene reacts with \\( HCl \\) is",
    image: null,
    options: [
      "2-chloro-2-methylpropane",
      "1-chloro-2-methylpropane",
      "3-chloro-2-methylpropane",
      "2-chloro-3-methylbutane",
    ],
    correctIndex: 0,
    hint: "Apply Markovnikov's rule, which states that in addition to an unsymmetrical alkene, the halide adds to the more substituted carbon.",
    explanation: [
      "2-methylpropene is \\( (CH_3)_2C=CH_2 \\). During hydrohalogenation, the hydrogen atom adds to the \\( CH_2 \\) carbon (which has more hydrogens).",
      "The chlorine atom then adds to the central carbon atom, forming 2-chloro-2-methylpropane (also known as tert-butyl chloride).",
    ],
  },
  {
    question:
      "In the laboratory preparation of Chlorine, the gas is passed through a wash bottle of water to",
    image: null,
    options: [
      "dilute it",
      "absorb HCl gas",
      "neutralize it",
      "absorb the \\( Cl_2 \\) gas",
    ],
    correctIndex: 1,
    hint: "Identify a gaseous by-product that is highly soluble in water, whereas chlorine gas is only moderately soluble.",
    explanation: [
      "In the preparation using \\( MnO_2 \\) and conc. \\( HCl \\), some \\( HCl \\) gas escapes with the chlorine.",
      "Passing the mixture through water removes the unwanted hydrogen chloride gas because it is extremely soluble, leaving purer chlorine gas.",
    ],
  },
  {
    question:
      "Carbohydrates can generally be represented by the general formula \\( C_x(H_2O)_y \\), for fructose the value for 'X' is",
    image: null,
    options: ["3", "12", "5", "6"],
    correctIndex: 3,
    hint: "Recall the molecular formula for a typical hexose sugar like glucose or fructose.",
    explanation: [
      "Fructose is a monosaccharide with six carbon atoms, giving it the molecular formula \\( C_6H_{12}O_6 \\).",
      "In the general carbohydrate formula, this is represented as \\( C_6(H_2O)_6 \\), so \\( x = 6 \\).",
    ],
  },
  {
    question:
      "If a gold bar and a silver bar are tied together firmly and left for years, some of the gold particles will be found in the silver bar due to",
    image: null,
    options: ["Brownian movement", "diffusion", "displacement", "osmosis"],
    correctIndex: 1,
    hint: "Consider the natural movement of particles from a region of higher concentration to a region of lower concentration.",
    explanation: [
      "Even in solids, atoms are in constant motion and can slowly move into adjacent materials over long periods.",
      "This process of spontaneous intermingling of particles is called diffusion.",
    ],
  },
  {
    question: "A metal that can be found in the free state in nature is",
    image: null,
    options: ["silver", "Zinc", "Iron", "copper"],
    correctIndex: 0,
    hint: "Identify a highly unreactive noble metal located near the very bottom of the electrochemical reactivity series.",
    explanation: [
      "Highly unreactive metals do not readily form compounds with oxygen or sulfur in the environment.",
      "Silver, gold, and platinum are frequently found as pure 'native' metals in the Earth's crust.",
    ],
  },
  {
    question: "Which of the following has the highest boiling point?",
    image: null,
    options: [
      "\\( CH_3CH_2OH \\)",
      "\\( CH_3CH_2CH_2Cl \\)",
      "\\( CH_3CH_2CH_2CH_2CH_2CH_3 \\)",
      "\\( CH_3CH_2CH_2OH \\)",
    ],
    correctIndex: 3,
    hint: "Look for a molecule capable of strong intermolecular hydrogen bonding and has a longer carbon chain.",
    explanation: [
      "Alcohols (options A and D) have higher boiling points due to intermolecular hydrogen bonding. Alkanes and alkyl halides do not.",
      "Between the two alcohols, propan-1-ol (D) has a longer carbon chain and higher molar mass than ethanol (A), resulting in stronger dispersion forces and a higher boiling point.",
    ],
  },
  {
    question:
      "Based on the solubility curve graph provided, it can be inferred that",
    image: "../jamb/chemistry/2024/q34.svg",
    options: [
      "the solubility of X and Y is the same at all temperature",
      "the solubility of X, Y and Z is temperature dependent",
      "solubility of Z increases as temperature increases",
      "solubility of Y increases steadily as temperature increases",
    ],
    correctIndex: 3,
    hint: "Examine the slope of the individual curves on the graph as the temperature values increase.",
    explanation: [
      "The graph shows that the curve for substance Y has a positive slope throughout the temperature range.",
      "This indicates that more of substance Y dissolves as the temperature of the solvent increases.",
    ],
  },
  {
    question:
      "The gas that is commonly used to demonstrate the fountain experiment is",
    image: null,
    options: [
      "hydrogen chloride",
      "hydrogen sulphide",
      "dinitrogen(I) oxide",
      "nitrogen(II) oxide",
    ],
    correctIndex: 0,
    hint: "The fountain experiment is a classic demonstration of the extreme solubility of certain gases in water.",
    explanation: [
      "Hydrogen chloride (\\( HCl \\)) and ammonia (\\( NH_3 \\)) are exceptionally soluble in water.",
      "When a small amount of water enters a flask filled with these gases, a vacuum is created, drawing in more water and forming a 'fountain'.",
    ],
  },
  {
    question: "Which of the following statements is false about hard water?",
    image: null,
    options: [
      "Helps animals to build strong teeth",
      "Cannot be supplied in pipes made of lead",
      "Tastes better than soft water",
      "Helps animals to build strong bones",
    ],
    correctIndex: 1,
    hint: "Consider the chemical interaction between lead metal and the minerals dissolved in hard water versus soft water.",
    explanation: [
      "Hard water contains calcium and magnesium ions which react with lead to form a protective coating of insoluble lead(II) carbonate scale.",
      "This coating prevents the lead from dissolving into the drinking water, making it safer to supply in lead pipes than soft water.",
    ],
  },
  {
    question:
      "The empirical mass of \\( C_6H_{12}O_6 \\) is (where H = 1, C = 12, O = 16)",
    image: null,
    options: ["90", "180", "45", "30"],
    correctIndex: 3,
    hint: "The empirical formula is the simplest integer ratio of atoms in a molecule. First find this formula, then calculate its molar mass.",
    explanation: [
      "The molecular formula \\( C_6H_{12}O_6 \\) can be simplified by dividing all subscripts by 6, giving the empirical formula \\( CH_2O \\).",
      "Calculation: \\( \text{Empirical Mass} = 12 + (2 \times 1) + 16 = 30\text{ g/mol} \\).",
    ],
  },
  {
    question:
      "The nitrogenous compound in dead materials in the soil is converted to",
    image: null,
    options: [
      "ammonia",
      "trioxonitrate(V)",
      "ammonium salts",
      "dioxonitrate(III)",
    ],
    correctIndex: 2,
    hint: "This is the 'ammonification' step of the nitrogen cycle where decomposers break down organic nitrogen.",
    explanation: [
      "Saprophytic bacteria and fungi decompose proteins in dead organic matter, releasing nitrogen in the form of ammonium ions.",
      "These ammonium ions typically exist in the soil as ammonium salts.",
    ],
  },
  {
    question:
      "The IUPAC nomenclature of the compound \\( CH_3C \\equiv CCH(CH_3)_2 \\) is",
    image: null,
    options: [
      "3-ethyl but-2-yne",
      "4-methylpent-2-yne",
      "2-ethyl but-2-yne",
      "2-methyl pent-2-yne",
    ],
    correctIndex: 1,
    hint: "Identify the longest chain containing the triple bond and number it from the end that gives the triple bond the lowest possible locant.",
    explanation: [
      "The longest continuous carbon chain has 5 carbons, so the root name is 'pentyne'.",
      "Numbering from the left gives the triple bond locant 2. This leaves a methyl branch at carbon 4, resulting in 4-methylpent-2-yne.",
    ],
  },
  {
    question:
      "In the laboratory preparation of oxygen using potassium trioxochlorate(V), adding tetraoxomanganate(VII) is usually not recommended in modern laboratories because",
    image: null,
    options: [
      "it forms explosive mixture with carbonaceous materials",
      "it is explosive",
      "it reacts with the catalyst",
      "it is hazardous",
    ],
    correctIndex: 0,
    hint: "Think about the extreme reactivity of powerful oxidizers at high temperatures, especially when in contact with organic contaminants.",
    explanation: [
      "Potassium chlorate (\\( KClO_3 \\)) is an extremely strong oxidizing agent.",
      "Heating it with even small amounts of organic impurities (like carbon, dust, or grease) can lead to a violent and unpredictable explosion.",
    ],
  },
  {
    question:
      "The type of bond between the complex cation and chlorine in \\( [Cu(NH_3)_4]Cl_2 \\) is",
    image: null,
    options: ["dative", "van der Waals", "ionic", "covalent"],
    correctIndex: 2,
    hint: "Identify the type of chemical bond that exists between a positively charged complex ion and negatively charged anions.",
    explanation: [
      "The square brackets denote a complex cation, \\( [Cu(NH_3)_4]^{2+} \\). The chloride ions, \\( Cl^- \\), exist outside this sphere.",
      "The attraction between the oppositely charged complex cation and the simple chloride anions is a purely electrostatic ionic bond.",
    ],
  },
  {
    question:
      "In the reaction \\( Mg(s) + 2HCl(aq) \\rightarrow MgCl_2(aq) + H_2(g) \\), magnesium is a reducing agent because it is",
    image: null,
    options: ["oxidized", "reduced", "a metal", "a solid"],
    correctIndex: 0,
    hint: "A reducing agent is a chemical species that donates electrons to another substance in a redox reaction.",
    explanation: [
      "The oxidation state of Magnesium increases from 0 in \\( Mg(s) \\) to +2 in \\( MgCl_2 \\).",
      "Since an increase in oxidation state indicates a loss of electrons (oxidation), and the species that loses electrons is the reducing agent, Magnesium is oxidized.",
    ],
  },
  {
    question: "An example of a physical change is",
    image: null,
    options: [
      "addition of water to calcium oxide",
      "corrosion of iron",
      "dissolving sodium chloride in water",
      "burning of charcoal",
    ],
    correctIndex: 2,
    hint: "Look for a process where no new chemical substance is created and the original substance can be recovered through simple physical means.",
    explanation: [
      "Dissolving salt in water does not change the chemical identity of the \\( NaCl \\). The process is easily reversible by evaporating the solvent.",
      "The other options involve chemical reactions that produce entirely new substances like calcium hydroxide, iron rust, or carbon dioxide.",
    ],
  },
  {
    question:
      "When air is passed through alkaline pyrogallol, potash, and finally fused calcium chloride, the unabsorbed components are",
    image: null,
    options: [
      "nitrogen and carbon(IV) oxide",
      "noble gases and carbon(IV) oxide",
      "noble gases and nitrogen",
      "noble gases, nitrogen and carbon(IV) oxide",
    ],
    correctIndex: 2,
    hint: "Potash absorbs \\( CO_2 \\), alkaline pyrogallol absorbs \\( O_2 \\), and calcium chloride removes moisture. What is left over?",
    explanation: [
      "Potassium hydroxide (potash) removes acidic carbon dioxide gas. Alkaline pyrogallol is a specific absorber for oxygen gas.",
      "Calcium chloride is a desiccant that removes water vapor. Since nitrogen and noble gases are chemically unreactive toward these reagents, they remain behind.",
    ],
  },
  {
    question:
      "An atom of an element with the electron configuration \\( 1s^2 2s^2 2p^6 3s^2 3p^5 \\) is likely to belong to",
    image: null,
    options: ["group 7", "group 5", "group 2", "group 3"],
    correctIndex: 0,
    hint: "Determine the group by counting the total number of electrons in the outermost (highest numbered) shell.",
    explanation: [
      "The outermost shell for this element is the third shell (\\( n=3 \\)).",
      "The number of valence electrons is the sum of electrons in the \\( 3s \\) and \\( 3p \\) orbitals: \\( 2 + 5 = 7 \\). This places the element in Group 7 (halogens).",
    ],
  },
  {
    question: "A molecule with a polar covalent bond between atoms exhibits",
    image: null,
    options: [
      "unequal sharing of electron pair",
      "equal sharing of electron pair",
      "equal sharing of electron lone pair",
      "unequal sharing of electron lone pair",
    ],
    correctIndex: 0,
    hint: "Polarity arises when shared electrons are pulled closer to one atom than the other due to differences in electronegativity.",
    explanation: [
      "In a polar bond, the more electronegative atom attracts the shared electron cloud more strongly.",
      "This results in an unequal sharing of the bonding electrons, creating partial positive and negative charges at either end of the bond.",
    ],
  },
  {
    question:
      "What is the cell notation for the cell reaction: \\( Mg + Pb^{2+} \\rightarrow Mg^{2+} + Pb \\)?",
    image: null,
    options: [
      "\\( Mg|Pb^{2+} || Mg^{2+}|Pb \\)",
      "\\( Mg|Mg^{2+} || Pb|Pb^{2+} \\)",
      "\\( Mg|Mg^{2+} || Pb^{2+}|Pb \\)",
      "\\( Mg|Mg^+ || Pb|Pb^+ \\)",
    ],
    correctIndex: 2,
    hint: "Standard notation follows the format: Anode Electrode | Anode Solution || Cathode Solution | Cathode Electrode.",
    explanation: [
      "Magnesium is oxidized to \\( Mg^{2+} \\) at the anode (left side of notation).",
      "Lead ions (\\( Pb^{2+} \\)) are reduced to lead metal at the cathode (right side). The single vertical line represents a phase boundary, and the double line represents a salt bridge.",
    ],
  },
  {
    question:
      "The correct arrangement of gases in order of increasing rate of diffusion is (given H=1, C=12, N=14, O=16, S=32)",
    image: null,
    options: [
      "\\( CO_2, H_2, SO_2, CO \\)",
      "\\( SO_2, O_2, NH_3, H_2 \\)",
      "\\( NH_3, NO_2, N_2, CO_2 \\)",
      "\\( CO_2, NH_3, O_2, SO_2 \\)",
    ],
    correctIndex: 1,
    hint: "According to Graham's Law, lighter gas molecules diffuse faster than heavier ones. Calculate the molar mass of each gas.",
    explanation: [
      "Molar masses: \\( SO_2 \\) = 64, \\( O_2 \\) = 32, \\( NH_3 \\) = 17, \\( H_2 \\) = 2.",
      "Since the rate of diffusion is inversely proportional to the molar mass, the gas with the highest mass (\\( SO_2 \\)) is slowest and the lightest (\\( H_2 \\)) is fastest.",
    ],
  },
  {
    question:
      "In a series of solutions with pH values of 2.5, 3.5, 7.0, and 8.0, which one is likely to turn red moist litmus paper blue?",
    image: null,
    options: ["3.5", "8.0", "2.5", "7.0"],
    correctIndex: 1,
    hint: "Red litmus paper turns blue when exposed to basic or alkaline substances. Look for a pH value greater than 7.",
    explanation: [
      "The pH scale ranges from 0 to 14. Values below 7 are acidic, exactly 7 is neutral, and values above 7 are basic.",
      "A pH of 8.0 indicates a basic solution, which has the chemical property of changing red litmus paper to blue.",
    ],
  },
  {
    question: "The chemical process by which iron corrodes is known as",
    image: null,
    options: ["rusting", "burning", "galvanizing", "alloying"],
    correctIndex: 0,
    hint: "This term specifically refers to the electrochemical oxidation of iron in the presence of water and atmospheric oxygen.",
    explanation: [
      "Rusting is a common form of corrosion that results in the formation of reddish-brown hydrated iron(III) oxide on the metal's surface.",
      "It is a spontaneous redox reaction that requires both moisture and oxygen to proceed.",
    ],
  },
];
