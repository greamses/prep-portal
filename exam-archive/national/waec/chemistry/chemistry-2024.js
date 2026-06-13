const chemistryObjective = [
  {
    question: "Which of the following gases could be collected by downward displacement of air?",
    image: null,
    options: ["Chlorine", "Hydrogen", "hydrogen chloride", "Sulphur(IV) oxide"],
    correctIndex: 1,
    hint: "Gases collected by downward displacement of air (upward delivery) must be lighter than air.",
    explanation: [
      "The average molar mass of air is approximately 29 g/mol.",
      "Gases with a molar mass less than 29 will rise and can be collected this way. Hydrogen ($H_2$) has a molar mass of 2 g/mol, which is significantly lighter than air.",
      "Chlorine ($Cl_2 \\approx 71$), hydrogen chloride ($HCl \\approx 36.5$), and sulfur(IV) oxide ($SO_2 \\approx 64$) are all heavier than air and would be collected by upward displacement of air (downward delivery)."
    ]
  },
  {
    question: "Which of the following substances has the lowest boiling point?",
    image: null,
    options: ["Aqueous sodium chloride", "Ethanol", "Tetrachloromethane", "Water"],
    correctIndex: 2,
    hint: "Compare the intermolecular forces and standard boiling point values for these liquids.",
    explanation: [
      "Water boils at 100°C. Aqueous sodium chloride will have a boiling point above 100°C due to boiling point elevation.",
      "Ethanol boils at approximately 78.4°C.",
      "Tetrachloromethane ($CCl_4$) boils at approximately 76.7°C, which is the lowest among the options provided."
    ]
  },
  {
    question: "The branch of science that deals with the nature and properties of substances and how one substance can be converted to another is known as",
    image: null,
    options: ["biology", "chemistry", "geography", "physics"],
    correctIndex: 1,
    hint: "Think of the science primarily focused on matter and its transformations.",
    explanation: [
      "Chemistry is defined as the study of matter, its properties, its structure, and the changes (chemical reactions) it undergoes."
    ]
  },
  {
    question: "The electron configuration $1s^2 2s^2 2p_x^2$ contravenes the",
    image: null,
    options: ["Pauli's exclusion principle", "Aufbau's principle", "octet rule", "Hund's rule"],
    correctIndex: 3,
    hint: "Consider how degenerate orbitals (orbitals of the same energy level) should be filled.",
    explanation: [
      "Hund's rule of maximum multiplicity states that orbitals in a subshell are singly occupied with one electron before any one orbital is doubly occupied.",
      "In the $2p$ subshell ($2p_x, 2p_y, 2p_z$), electrons should occupy each orbital singly before pairing. Having two electrons in $2p_x$ while $2p_y$ and $2p_z$ are empty violates this rule."
    ]
  },
  {
    question: "The oxidation number of Chromium in $Na_2Cr_2O_7$ is",
    image: null,
    options: ["+2", "+6", "+7", "+12"],
    correctIndex: 1,
    hint: "Set up an equation where the sum of oxidation numbers equals zero for a neutral compound.",
    explanation: [
      "The sum of oxidation numbers in $Na_2Cr_2O_7$ is 0.",
      "Let $x$ be the oxidation number of Cr. Oxidation number of Na is +1 and O is -2.",
      "$2(+1) + 2(x) + 7(-2) = 0$",
      "$2 + 2x - 14 = 0$",
      "$2x = 12 \\Rightarrow x = +6$."
    ]
  },
  {
    question: "The most important ore of aluminium is",
    image: null,
    options: ["bauxite", "haematite", "magnetite", "monazite"],
    correctIndex: 0,
    hint: "Identify the primary raw material used for refining aluminum.",
    explanation: [
      "Bauxite is the main ore used for the industrial production of aluminum.",
      "Haematite and magnetite are ores of iron, while monazite is primarily an ore of rare-earth elements."
    ]
  },
  {
    question: "Bases normally",
    image: null,
    options: ["are corrosive", "turn litmus paper from blue to red", "turn litmus paper from red to blue", "are non-metal oxides"],
    correctIndex: 2,
    hint: "Recall the characteristic effect of bases on pH indicators like litmus.",
    explanation: [
      "A classic test for bases is their ability to turn red litmus paper blue.",
      "Acids turn blue litmus red. Non-metal oxides are generally acidic, not basic."
    ]
  },
  {
    question: "The product formed when concentrated sodium chloride solution is electrolysed using carbon electrodes is",
    image: null,
    options: ["chloride water", "hydrochloric acid", "sodium hydroxide", "sodium oxochlorate (I)"],
    correctIndex: 2,
    hint: "Consider the ions left in solution after hydrogen and chlorine are discharged.",
    explanation: [
      "During the electrolysis of concentrated brine (NaCl solution), chlorine gas is produced at the anode and hydrogen gas at the cathode.",
      "The removal of $H^+$ and $Cl^-$ ions leaves behind $Na^+$ and $OH^-$ ions in the solution, forming sodium hydroxide ($NaOH$)."
    ]
  },
  {
    question: "The product of the reaction between ethanol and excess acidified $K_2Cr_2O_7$ is",
    image: null,
    options: ["$CH_2=CH_2$", "$CH_3OCH_3$", "$CH_3COOH$", "$CH_3CH_3$"],
    correctIndex: 2,
    hint: "Identify the result of the complete oxidation of a primary alcohol.",
    explanation: [
      "Ethanol is a primary alcohol. With excess oxidizing agent like acidified $K_2Cr_2O_7$ under reflux, it is oxidized completely to ethanoic acid ($CH_3COOH$)."
    ]
  },
  {
    question: "Which of the following statements about ammonium salt is correct? It",
    image: null,
    options: ["dissolves in water to form solution of $pH > 1$", "dissolves in water to form solution of $pH < 7$", "does not decompose on heating", "is insoluble in water"],
    correctIndex: 1,
    hint: "Consider the nature of the solution formed when a salt of a strong acid and a weak base undergoes hydrolysis.",
    explanation: [
      "Common ammonium salts like $NH_4Cl$ are salts of a strong acid and a weak base. In water, the ammonium ion ($NH_4^+$) undergoes hydrolysis to produce an acidic solution ($pH < 7$)."
    ]
  },
  {
    question: "Ethanedioic acid is an organic solid that can be purified by",
    image: null,
    options: ["decantation", "distillation", "crystallization", "filtration"],
    correctIndex: 2,
    hint: "Identify the standard laboratory technique used to purify crystalline organic solids.",
    explanation: [
      "Crystallization (or recrystallization) is the standard method for purifying solid organic compounds like ethanedioic acid (oxalic acid) from soluble impurities."
    ]
  },
  {
    question: "Which of the following functional groups is present in alkanoic acid?",
    image: null,
    options: ["-COOH", "-OH", "-COOR", "-CHO"],
    correctIndex: 0,
    hint: "Recall the general formula for carboxylic acids.",
    explanation: [
      "Alkanoic acids (carboxylic acids) are characterized by the carboxyl functional group, $-COOH$."
    ]
  },
  {
    question: "In ethanol, the attractive forces between adjacent molecules are",
    image: null,
    options: ["covalent bonds only", "hydrogen bonds only", "hydrogen bonding and Van der Waal's forces", "Van der Waal's forces only"],
    correctIndex: 2,
    hint: "Think about both the polar -OH group and the non-polar hydrocarbon tail of the molecule.",
    explanation: [
      "Ethanol molecules can form hydrogen bonds due to the polar -OH group and also experience Van der Waal's forces (specifically London dispersion forces) due to their hydrocarbon structure."
    ]
  },
  {
    question: "At 25°C, the saturated solution of a salt in water was found to contain 0.24g of the salt in $100cm^3$. What is the solubility of the salt in $gdm^{-3}$?",
    image: null,
    options: ["0.024", "0.240", "2.40", "24.0"],
    correctIndex: 2,
    hint: "Convert grams per $100cm^3$ to grams per $1000cm^3$ ($1dm^3$).",
    explanation: [
      "If $100cm^3$ contains $0.24g$ of salt, then $1dm^3$ ($1000cm^3$) will contain $(0.24g / 100cm^3) \\times 1000cm^3 = 2.40g$.",
      "Thus, the solubility is $2.40 gdm^{-3}$."
    ]
  },
  {
    question: "The reaction represented by the equation: $Ni^{2+}(aq) + Fe(s) \\rightarrow Ni(s) + Fe^{2+}(aq)$ is a redox reaction because",
    image: null,
    options: [
      "$Ni^{2+}$ ions are oxidized and $Fe$ acts as a oxidizing agent",
      "$Ni^{2+}$ ions are oxidized and $Fe$ acts as a reducing agent",
      "$Ni^{2+}$ ions are reduced and $Fe$ acts as an oxidizing agent",
      "$Ni^{2+}$ ions are reduced and $Fe$ acts as a reducing agent."
    ],
    correctIndex: 3,
    hint: "Analyze the change in oxidation states for both Nickel and Iron.",
    explanation: [
      "In this reaction, $Ni^{2+}$ gains electrons to become neutral $Ni$ (reduction). $Fe$ loses electrons to become $Fe^{2+}$ (oxidation).",
      "The species being oxidized ($Fe$) acts as the reducing agent."
    ]
  },
  {
    question: "Which of the following statements describes transition elements? They",
    image: null,
    options: ["are very reactive", "have low melting points", "possess variable oxidation state", "form colourless salts"],
    correctIndex: 2,
    hint: "Recall the unique chemical characteristics of transition metals.",
    explanation: [
      "A primary characteristic of transition elements is their ability to exhibit multiple (variable) oxidation states (e.g., $Fe$ as $+2$ and $+3$)."
    ]
  },
  {
    question: "Aluminium is suitable for making alloys for aircraft construction because it",
    image: null,
    options: ["is hard and brittle", "is light and very resistant to corrosion", "has high density and also a non-conductor of electricity", "is amphoteric and allotropic"],
    correctIndex: 1,
    hint: "Consider the properties necessary for materials used in flight.",
    explanation: [
      "Aluminum is used in aircraft due to its low density ('lightness') and high corrosion resistance."
    ]
  },
  {
    question: "Which of the following arrangements of elements is in order of increasing ionization energy?",
    image: null,
    options: ["Si, Al, S, P", "S, P, Si, Al", "Al, Si, P, S", "P, Si, S, Al"],
    correctIndex: 2,
    hint: "Recall the periodic trend for ionization energy across a period from left to right.",
    explanation: [
      "Ionization energy generally increases across a period. For the Period 3 elements provided ($Al, Si, P, S$), the order following the general trend is $Al < Si < P < S$."
    ]
  },
  {
    question: "Consider the reaction: $C_3H_8 + 5O_2 \\rightarrow 3CO_2 + 4H_2O$. If 0.1 mole of $C_3H_8$ was completely burnt, what volume of $CO_2$ would be produced at stp? [stp volume = $22.4 dm^3 mol^{-1}$].",
    image: null,
    options: ["$6.72dm^3$", "$2.24dm^3$", "$0.30dm^3$", "$0.10dm^3$"],
    correctIndex: 0,
    hint: "Use the stoichiometric ratio between propane and carbon dioxide.",
    explanation: [
      "1 mole of $C_3H_8$ produces 3 moles of $CO_2$. Therefore, 0.1 mole of $C_3H_8$ produces 0.3 moles of $CO_2$.",
      "Volume = $0.3 \\text{ mol} \\times 22.4 \\text{ dm}^3/\\text{mol} = 6.72 \\text{ dm}^3$."
    ]
  },
  {
    question: "Naturally occurring Boron is made up of 19.9% $^{10}B$ and 80.1% $^{11}B$. The relative atomic mass of Boron is",
    image: null,
    options: ["21.0", "10.8", "10.5", "10.0"],
    correctIndex: 1,
    hint: "Calculate the weighted average of the isotopic masses.",
    explanation: [
      "Relative Atomic Mass = $(19.9/100 \\times 10) + (80.1/100 \\times 11) = 1.99 + 8.811 = 10.801$."
    ]
  },
  {
    question: "The number of shared pair of electrons in a molecule of methane is",
    image: null,
    options: ["2", "4", "6", "8"],
    correctIndex: 1,
    hint: "Draw the structure of $CH_4$ and count the covalent bonds.",
    explanation: [
      "Methane ($CH_4$) has 4 C-H covalent bonds. Each bond is a shared pair, so there are 4 shared pairs in total."
    ]
  },
  {
    question: "Isotopes of the same element have similar chemical properties because they have the same number of",
    image: null,
    options: ["nuclides", "protons", "neutrons", "atoms"],
    correctIndex: 1,
    hint: "Recall what determines an element's electron configuration.",
    explanation: [
      "Chemical properties depend on electron configuration, which is determined by the atomic number (number of protons)."
    ]
  },
  {
    question: "Which liquid would be effective in treating someone with too much acid in the stomach?",
    image: null,
    options: ["Strong salt solution with pH 7.0", "Tomato juice with pH 4.1", "Milk of Magnesia with pH 10.5", "Black coffee with pH 5.0"],
    correctIndex: 2,
    hint: "Identify a basic substance (pH > 7) to neutralize excess acid.",
    explanation: [
      "Milk of Magnesia has a pH of 10.5, making it basic. It acts as an antacid to neutralize excess stomach acid."
    ]
  },
  {
    question: "The percentage by mass of Oxygen in $MgSO_4 \\cdot 7H_2O$ is [ $M_r$ = 246 ]",
    image: null,
    options: ["26.0%", "45.5%", "71.5%", "84.0%"],
    correctIndex: 2,
    hint: "Count all oxygen atoms in the formula and divide their total mass by the molar mass.",
    explanation: [
      "There are 4 oxygens in $SO_4$ and 7 in $7H_2O$, totaling 11. Total oxygen mass = $11 \\times 16 = 176$.",
      "Percentage = $(176 / 246) \\times 100 \\approx 71.5\\%$."
    ]
  },
  {
    question: "Catalysts alter reaction rates by",
    image: null,
    options: ["providing an alternative reaction pathway", "lowering the energy of reaction", "increasing the surface area of reactants", "aligning the reactant molecules properly"],
    correctIndex: 0,
    hint: "Think about how a catalyst lowers the activation energy.",
    explanation: [
      "A catalyst provides an alternative reaction pathway with a lower activation energy, allowing the reaction to proceed faster."
    ]
  },
  {
    question: "Ethane of $400 cm^3$ was burnt: $2C_2H_6(g) + 7O_2(g) \\rightarrow 6H_2O(g) + 4CO_2(g)$. Calculate the volume of steam produced.",
    image: null,
    options: ["$200 cm^3$", "$400 cm^3$", "$600 cm^3$", "$1200 cm^3$"],
    correctIndex: 3,
    hint: "Use the mole ratio from the balanced equation for gaseous volumes.",
    explanation: [
      "The ratio of $C_2H_6$ to $H_2O$ is 2:6 (or 1:3). Thus, $400 cm^3$ of ethane produces $3 \\times 400 = 1200 cm^3$ of steam."
    ]
  },
  {
    question: "A saturated solution at 30°C will normally produce crystals at a temperature of",
    image: null,
    options: ["50°C", "40°C", "35°C", "20°C"],
    correctIndex: 3,
    hint: "Consider how solubility generally changes when a solution is cooled.",
    explanation: [
      "Solubility of most solids decreases as temperature drops. Cooling a saturated solution (e.g., to 20°C) will cause excess solute to crystallize out."
    ]
  },
  {
    question: "The following organic compounds are polymers except",
    image: null,
    options: ["rubber", "starch", "proteins", "fats"],
    correctIndex: 3,
    hint: "Identify which molecule is not made of long repeating monomer chains.",
    explanation: [
      "Rubber, starch, and proteins are natural polymers. Fats (triglycerides) are large molecules but do not fit the repeating-chain definition of polymers."
    ]
  },
  {
    question: "According to collision theory, which condition is not required for molecules to react?",
    image: null,
    options: [
      "come into contact without loss of energy on colliding",
      "collide with enough energy to overcome activation energy",
      "collide in an orientation that makes product possible",
      "possess enough speed to overcome intermolecular forces"
    ],
    correctIndex: 0,
    hint: "Focus on the fundamental requirements for 'effective collisions'.",
    explanation: [
      "Effective collisions require sufficient energy and correct orientation. Collisions 'without loss of energy' (elastic collisions) are an ideal gas assumption, not a requirement for reaction."
    ]
  },
  {
    question: "A weak acid is one which",
    image: null,
    options: ["is not corrosive", "completely ionizes in water", "does not produce salt with alkali", "slightly ionizes in water"],
    correctIndex: 3,
    hint: "Define acid strength in terms of degree of ionization.",
    explanation: [
      "A weak acid is defined as one that only partially or slightly ionizes in water."
    ]
  },
  {
    question: "Which conditions are necessary for the preparation of alkanoates?",
    image: null,
    options: ["Water and NaOH", "Conc. $H_2SO_4$ and heat", "NaOH and heat", "water and aqueous HCl"],
    correctIndex: 1,
    hint: "Recall the reactants and catalyst for esterification.",
    explanation: [
      "Esterification (preparing alkanoates) requires reacting an alcohol and carboxylic acid with concentrated $H_2SO_4$ as a catalyst and heat."
    ]
  },
  {
    question: "The volume of 22g of $CO_2$ at stp is equivalent to [ $M_r$ = 44, stp volume = $22.4 dm^3$ ]",
    image: null,
    options: ["22.0 $dm^3$", "22.4 $dm^3$", "11.2 $dm^3$", "5.6 $dm^3$"],
    correctIndex: 2,
    hint: "Convert mass to moles, then moles to volume.",
    explanation: [
      "Moles of $CO_2 = 22g / 44g/mol = 0.5$ mol. Volume = $0.5 \\text{ mol} \\times 22.4 \\text{ dm}^3/\\text{mol} = 11.2 \\text{ dm}^3$."
    ]
  },
  {
    question: "Pairs of outermost shell electrons which are not used in bonding are",
    image: null,
    options: ["lone pairs", "bonding pairs", "valence electrons", "electrovalent electrons"],
    correctIndex: 0,
    hint: "Identify the term for non-bonding valence electron pairs.",
    explanation: [
      "Lone pairs are pairs of valence electrons that do not participate in chemical bonding."
    ]
  },
  {
    question: "$_8X^{2-}$ and $_{10}Y$ are",
    image: null,
    options: ["isomers", "isotopes", "allotropes", "isoelectronic"],
    correctIndex: 3,
    hint: "Compare the total number of electrons in both species.",
    explanation: [
      "Atom X (8 protons) in $X^{2-}$ state has 10 electrons. Neutral atom Y (10 protons) also has 10 electrons. Species with the same electron count are isoelectronic."
    ]
  },
  {
    question: "Pure water contaminated with quicklime will have a pH of",
    image: null,
    options: ["1", "6", "7", "8"],
    correctIndex: 3,
    hint: "Determine the nature of the solution formed from CaO and water.",
    explanation: [
      "Quicklime ($CaO$) forms basic $Ca(OH)_2$ in water. Thus, the pH must be greater than 7."
    ]
  },
  {
    question: "The electron configuration of $_{29}Cu$ is",
    image: null,
    options: [
      "$1s^2 2s^2 2p^6 3s^2 3p^6 4s^1 3d^{10}$",
      "$1s^2 2s^2 2p^6 3s^2 3p^6 4s^2 3d^9$",
      "$1s^2 2s^2 2p^5 3s^2 3p^6 4s^2 3d^{10}$",
      "$1s^2 2s^2 2p^6 3s^2 3p^2 4s^1 3d^{10}$"
    ],
    correctIndex: 0,
    hint: "Recall the exception for copper's filled d-subshell.",
    explanation: [
      "Copper is an exception where an electron from the 4s orbital moves to the 3d to achieve a stable, full $3d^{10}$ subshell."
    ]
  },
  {
    question: "When s and p block elements react, the bond formed is",
    image: null,
    options: ["electrovalent", "covalent", "metallic", "dative-covalent"],
    correctIndex: 0,
    hint: "Typical bonding between a reactive metal and non-metal.",
    explanation: [
      "Reactive s-block metals and p-block non-metals generally form electrovalent (ionic) bonds through electron transfer."
    ]
  },
  {
    question: "The hardest form of carbon is",
    image: null,
    options: ["charcoal", "coke", "diamond", "graphite"],
    correctIndex: 2,
    hint: "Identify the carbon allotrope with a rigid tetrahedral lattice.",
    explanation: [
      "Diamond's 3D covalent structure makes it the hardest natural form of carbon."
    ]
  },
  {
    question: "Metallic bonding in aluminium is strong because of a large number of",
    image: null,
    options: ["delocalized electrons", "immobile electrons", "lone pair electrons", "valence electrons"],
    correctIndex: 0,
    hint: "What holds metal ions together in a 'sea'?",
    explanation: [
      "Metallic bond strength depends on the 'sea' of shared, delocalized electrons. Aluminum contributes 3 valence electrons per atom to this pool."
    ]
  },
  {
    question: "How many covalent bonds are formed by Nitrogen?",
    image: null,
    options: ["1", "2", "3", "4"],
    correctIndex: 2,
    hint: "Check Nitrogen's valency (needs 3 to complete octet).",
    explanation: [
      "Nitrogen typically forms 3 covalent bonds to complete its outer shell."
    ]
  },
  {
    question: "When an element exists in multiple forms in the same state, it exhibits",
    image: null,
    options: ["isotopy", "allotropy", "isobars", "isomerism"],
    correctIndex: 1,
    hint: "Recall the term for carbon as diamond vs. graphite.",
    explanation: [
      "Allotropy is the ability of an element to exist in different structural forms in the same physical state."
    ]
  },
  {
    question: "An atom with 8 valence electrons in the ground state is a",
    image: null,
    options: ["metal", "semi-metal", "noble gas", "halogen"],
    correctIndex: 2,
    hint: "Identify the group with a full valence octet.",
    explanation: [
      "Noble gases (Group 18) are characterized by having 8 valence electrons."
    ]
  },
  {
    question: "The main function of limestone in a blast furnace is to",
    image: null,
    options: ["act as catalyst", "remove impurities", "act as a reducing agent", "supply Carbon(IV) oxide"],
    correctIndex: 1,
    hint: "Consider how sandy impurities are dealt with.",
    explanation: [
      "Limestone reacts with sandy impurities (like $SiO_2$) to form slag, thus removing them from the furnace."
    ]
  },
  {
    question: "Which of the following is a monomer of polythene?",
    image: null,
    options: ["Ethanol", "Vinyl chloride", "Ethene", "Ethane"],
    correctIndex: 2,
    hint: "Check the name 'poly-ethene'.",
    explanation: [
      "Polythene is produced by the polymerization of ethene monomers."
    ]
  },
  {
    question: "Which compound is formed by the oxidation of ethanol?",
    image: null,
    options: ["$C_2H_4CO_2H$", "$C_2H_5OH$", "$CH_3OH$", "$CH_3CO_2H$"],
    correctIndex: 3,
    hint: "Determine the carboxylic acid corresponding to ethanol.",
    explanation: [
      "Ethanol ($CH_3CH_2OH$) oxidizes to ethanoic acid ($CH_3COOH$ or $CH_3CO_2H$)."
    ]
  },
  {
    question: "Tetraoxosulphate (VI) acid is a heavy chemical because",
    image: null,
    options: ["molecular mass is high", "high tonnage is produced annually", "it is an inorganic chemical", "it's used for heavy chemicals"],
    correctIndex: 1,
    hint: "Industrial definition of 'heavy chemical'.",
    explanation: [
      "Heavy chemicals are those produced industrially on a very large scale (high tonnage)."
    ]
  },
  {
    question: "How many isomers can be formed from $C_5H_{12}$?",
    image: null,
    options: ["One", "Two", "Three", "Four"],
    correctIndex: 2,
    hint: "Try drawing all carbon chain arrangements for pentane.",
    explanation: [
      "Pentane has 3 isomers: n-pentane, 2-methylbutane, and 2,2-dimethylpropane."
    ]
  },
  {
    question: "The oxidation number of iron in its free state is",
    image: null,
    options: ["0", "+1", "+2", "+3"],
    correctIndex: 0,
    hint: "Rule for oxidation state of uncombined elements.",
    explanation: [
      "Elemental atoms in their free, uncombined state have an oxidation number of zero."
    ]
  },
  {
    question: "Water pipes are produced from",
    image: null,
    options: ["polyethene", "Perspex", "polystyrene", "poly vinyl chloride"],
    correctIndex: 3,
    hint: "Common plumbing plastic.",
    explanation: [
      "Poly vinyl chloride (PVC) is the standard plastic used for modern piping."
    ]
  },
  {
    question: "Balance the reaction: $xAl + yCl_2 \\rightarrow zAlCl_3$",
    image: null,
    options: ["2, 3 and 2", "2, 2 and 3", "1, 2 and 1", "1, 1 and 1"],
    correctIndex: 0,
    hint: "Equalize atoms on both sides.",
    explanation: [
      "Balancing leads to $2Al + 3Cl_2 \\rightarrow 2AlCl_3$. Coefficients are 2, 3, 2."
    ]
  }
];