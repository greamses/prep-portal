/* ── THE LAWS BANK ───────────────────────────────────────────────────────
   A study set of the named laws and principles a secondary-school learner
   meets in Physics, Chemistry and Biology. Each entry carries:

     name      — the law's common name.
     statement — a PLAIN-LANGUAGE paraphrase in our own words (never a verbatim
                 textbook line — see the copyright stance), so a learner can
                 read it as a sentence.
     formula   — its formula as a TeX string (rendered with MathJax), or null
                 when the law is a conceptual statement with no single formula.
                 The Laws page's "Formulas" view falls back to the statement
                 for these, so a formula-less law still reads as text.
     where     — an optional plain-text legend naming the symbols in `formula`.

   Symbols are stored WITHOUT $-delimiters; the page wraps each in display
   math when it typesets. Keep TeX escaped for a JS string (\\frac, \\times…).
*/

export const SUBJECTS = [
  {
    key: 'physics',
    label: 'Physics',
    laws: [
      {
        name: "Newton's First Law (Inertia)",
        statement:
          'A body stays at rest, or keeps moving in a straight line at a steady speed, until a net external force makes it change.',
        formula: null,
      },
      {
        name: "Newton's Second Law",
        statement:
          'The net force on a body equals its mass multiplied by the acceleration that force produces.',
        formula: '\\vec{F} = m\\,\\vec{a}',
        where: 'F = net force, m = mass, a = acceleration',
      },
      {
        name: "Newton's Third Law",
        statement:
          'When one body pushes or pulls on another, the second pushes or pulls back with an equal force in the opposite direction.',
        formula: '\\vec{F}_{AB} = -\\,\\vec{F}_{BA}',
        where: 'the force A exerts on B is opposite to the force B exerts on A',
      },
      {
        name: 'Law of Universal Gravitation',
        statement:
          'Every two masses attract each other with a force that grows with each mass and falls off with the square of the distance between them.',
        formula: 'F = G\\,\\dfrac{m_1 m_2}{r^{2}}',
        where: 'G = gravitational constant, m = mass, r = separation',
      },
      {
        name: "Hooke's Law",
        statement:
          'The stretch or squash of a spring is proportional to the force applied, as long as it is not pushed past its elastic limit.',
        formula: 'F = -k\\,x',
        where: 'k = spring constant, x = extension from rest',
      },
      {
        name: "Ohm's Law",
        statement:
          'For many conductors, the current through them is proportional to the voltage across them, at constant temperature.',
        formula: 'V = I\\,R',
        where: 'V = voltage, I = current, R = resistance',
      },
      {
        name: 'Conservation of Energy',
        statement:
          'Energy is never created or destroyed, only changed from one form to another; the total energy of an isolated system stays the same.',
        formula: 'E_{k} + E_{p} = \\text{constant}',
        where: 'E_k = kinetic energy, E_p = potential energy',
      },
      {
        name: 'Conservation of Momentum',
        statement:
          'With no outside force, the total momentum of a system before an interaction equals the total momentum after it.',
        formula: '\\sum \\vec{p}_{\\text{before}} = \\sum \\vec{p}_{\\text{after}}',
        where: 'p = momentum = mass × velocity',
      },
      {
        name: "Coulomb's Law",
        statement:
          'Two electric charges attract or repel with a force that grows with each charge and shrinks with the square of the distance between them.',
        formula: 'F = k\\,\\dfrac{q_1 q_2}{r^{2}}',
        where: 'k = Coulomb constant, q = charge, r = separation',
      },
      {
        name: "Archimedes' Principle",
        statement:
          'A body in a fluid feels an upward push equal to the weight of the fluid it pushes out of the way.',
        formula: 'F_{b} = \\rho\\,V\\,g',
        where: 'ρ = fluid density, V = volume displaced, g = gravity',
      },
      {
        name: "Snell's Law",
        statement:
          'When light crosses from one material into another it bends, and the ratio of the sines of the angles matches the ratio of the two refractive indices.',
        formula: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2',
        where: 'n = refractive index, θ = angle to the normal',
      },
      {
        name: "Faraday's Law of Induction",
        statement:
          'A changing magnetic field through a loop drives a voltage around it, and the faster the field changes, the larger that voltage.',
        formula: '\\varepsilon = -\\dfrac{d\\Phi_{B}}{dt}',
        where: 'ε = induced e.m.f., Φ_B = magnetic flux, t = time',
      },
      {
        name: "Kepler's Third Law",
        statement:
          "The square of a planet's orbital period is proportional to the cube of its average distance from the Sun.",
        formula: 'T^{2} \\propto a^{3}',
        where: 'T = orbital period, a = mean orbital radius',
      },
      {
        name: 'Stefan–Boltzmann Law',
        statement:
          'The power radiated by a hot body rises with the fourth power of its absolute temperature.',
        formula: 'P = \\sigma\\,A\\,T^{4}',
        where: 'σ = Stefan constant, A = area, T = absolute temperature',
      },
    ],
  },
  {
    key: 'chemistry',
    label: 'Chemistry',
    laws: [
      {
        name: 'Conservation of Mass',
        statement:
          'In a closed reaction, matter is neither gained nor lost: the total mass of the products equals the total mass of the reactants.',
        formula: 'm_{\\text{reactants}} = m_{\\text{products}}',
        where: 'm = total mass',
      },
      {
        name: 'Definite Proportions',
        statement:
          'A given compound always holds the same elements combined in the same fixed ratio by mass, no matter how it was made.',
        formula: null,
      },
      {
        name: 'Multiple Proportions',
        statement:
          'When two elements form more than one compound, the masses of one that combine with a fixed mass of the other are in small whole-number ratios.',
        formula: null,
      },
      {
        name: "Avogadro's Law",
        statement:
          'Equal volumes of gases, at the same temperature and pressure, contain equal numbers of molecules.',
        formula: '\\dfrac{V_1}{n_1} = \\dfrac{V_2}{n_2}',
        where: 'V = volume, n = amount in moles',
      },
      {
        name: "Boyle's Law",
        statement:
          'At constant temperature, the volume of a fixed mass of gas is inversely proportional to its pressure.',
        formula: 'P_1 V_1 = P_2 V_2',
        where: 'P = pressure, V = volume',
      },
      {
        name: "Charles's Law",
        statement:
          'At constant pressure, the volume of a fixed mass of gas is proportional to its absolute temperature.',
        formula: '\\dfrac{V_1}{T_1} = \\dfrac{V_2}{T_2}',
        where: 'V = volume, T = absolute temperature',
      },
      {
        name: "Gay-Lussac's Law",
        statement:
          'At constant volume, the pressure of a fixed mass of gas is proportional to its absolute temperature.',
        formula: '\\dfrac{P_1}{T_1} = \\dfrac{P_2}{T_2}',
        where: 'P = pressure, T = absolute temperature',
      },
      {
        name: 'Combined Gas Law',
        statement:
          'For a fixed mass of gas, pressure times volume divided by absolute temperature stays constant.',
        formula: '\\dfrac{P_1 V_1}{T_1} = \\dfrac{P_2 V_2}{T_2}',
        where: 'P = pressure, V = volume, T = absolute temperature',
      },
      {
        name: 'Ideal Gas Law',
        statement:
          'Pressure times volume equals the amount of gas times the gas constant times the absolute temperature.',
        formula: 'PV = nRT',
        where: 'P = pressure, V = volume, n = moles, R = gas constant, T = temperature',
      },
      {
        name: "Dalton's Law of Partial Pressures",
        statement:
          'The total pressure of a gas mixture is the sum of the pressures each gas would exert on its own.',
        formula: 'P_{\\text{total}} = \\sum P_i',
        where: 'P_i = partial pressure of each gas',
      },
      {
        name: "Graham's Law of Effusion",
        statement:
          'A lighter gas escapes through a small hole faster than a heavier one; the rate goes as the inverse square root of the molar mass.',
        formula: '\\dfrac{r_1}{r_2} = \\sqrt{\\dfrac{M_2}{M_1}}',
        where: 'r = rate of effusion, M = molar mass',
      },
      {
        name: "Hess's Law",
        statement:
          'The total enthalpy change of a reaction is the same whatever route it takes, so step changes can simply be added.',
        formula: '\\Delta H_{\\text{rxn}} = \\sum \\Delta H_{\\text{steps}}',
        where: 'ΔH = enthalpy change',
      },
      {
        name: "Le Chatelier's Principle",
        statement:
          'When a system at equilibrium is disturbed, it shifts to partly oppose the change and settle at a new balance.',
        formula: null,
      },
      {
        name: "Raoult's Law",
        statement:
          "The vapour pressure of a solvent above a solution is its pure vapour pressure scaled by its mole fraction.",
        formula: 'P_A = x_A\\,P_A^{\\circ}',
        where: 'x_A = mole fraction, P_A° = pure-solvent vapour pressure',
      },
    ],
  },
  {
    key: 'biology',
    label: 'Biology',
    laws: [
      {
        name: "Mendel's Law of Segregation",
        statement:
          'Each parent carries two copies of a gene that separate during the making of sex cells, so each cell receives just one copy.',
        formula: null,
      },
      {
        name: "Mendel's Law of Independent Assortment",
        statement:
          'Genes for different traits are passed on independently of one another, so one trait does not fix which version of another is inherited.',
        formula: null,
      },
      {
        name: 'Law of Dominance',
        statement:
          'When two different versions of a gene meet, the dominant one shows in the organism while the recessive one is hidden.',
        formula: null,
      },
      {
        name: 'Hardy–Weinberg Principle',
        statement:
          'In a large population with no evolutionary pressures, the allele and genotype frequencies stay steady from generation to generation.',
        formula: 'p^{2} + 2pq + q^{2} = 1',
        where: 'p, q = the two allele frequencies (with p + q = 1)',
      },
      {
        name: 'Cell Theory',
        statement:
          'All living things are made of cells, the cell is the basic unit of life, and every cell arises from a pre-existing cell.',
        formula: null,
      },
      {
        name: 'Law of Biogenesis',
        statement:
          'Living things come only from other living things, not from non-living matter.',
        formula: null,
      },
      {
        name: "Liebig's Law of the Minimum",
        statement:
          'Growth is limited not by the total resources available but by the single resource in shortest supply.',
        formula: null,
      },
      {
        name: 'Competitive Exclusion (Gause)',
        statement:
          'Two species competing for exactly the same limited resource cannot coexist indefinitely; one will edge the other out.',
        formula: null,
      },
      {
        name: "Bergmann's Rule",
        statement:
          'Within a warm-blooded group, animals living in colder climates tend to have larger bodies, which lose heat more slowly.',
        formula: null,
      },
      {
        name: "Allen's Rule",
        statement:
          'Warm-blooded animals in colder climates tend to have shorter limbs and extremities, reducing heat loss.',
        formula: null,
      },
    ],
  },
];
