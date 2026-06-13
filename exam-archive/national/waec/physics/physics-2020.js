const examQuestions = [
  // Page 1 (Questions 1–5)
  {
    question:
      "In collision between two objects, kinetic energy is conserved only if",
    image: null,
    options: [
      "one of the objects was initially at rest",
      "potential energy is converted to work",
      "the collision is inelastic",
      "the collision is elastic",
    ],
    correctIndex: 3,
    hint: "Kinetic energy is conserved only in perfectly elastic collisions.",
    explanation: [
      "In an elastic collision, both momentum and kinetic energy are conserved.",
      "In inelastic collisions, some kinetic energy is converted to other forms (e.g., heat, sound).",
    ],
  },
  {
    question: "The quantity of motion of a body is its",
    image: null,
    options: ["acceleration", "displacement", "momentum", "velocity"],
    correctIndex: 2,
    hint: "Quantity of motion refers to momentum, which is mass times velocity.",
    explanation: [
      "Momentum \\( = m \\times v \\), representing the 'quantity of motion'.",
    ],
  },
  {
    question:
      "The volume of a fixed mass of a gas varies inversely as the pressure on it provided the temperature is constant. This statement is",
    image: null,
    options: ["Pressure law", "Charles law", "Boyle's law", "General gas law"],
    correctIndex: 2,
    hint: "Boyle's law states that at constant temperature, pressure and volume are inversely proportional.",
    explanation: [
      "Boyle's law: \\( P \\propto \\frac{1}{V} \\) at constant temperature.",
    ],
  },
  {
    question: "An image formed on a screen is always?",
    image: null,
    options: ["inverted", "magnified", "upright", "virtual"],
    correctIndex: 0,
    hint: "A real image formed on a screen is always inverted.",
    explanation: [
      "Real images are formed when light rays actually converge, and they are inverted relative to the object.",
    ],
  },
  {
    question:
      "How would the capacitance of a parallel plate capacitor be affected if the distance of separation of its plates is decreased? It will",
    image: null,
    options: [
      "increase in value",
      "decrease slightly",
      "remain unchanged",
      "drop to zero",
    ],
    correctIndex: 0,
    hint: "Capacitance \\( C = \\frac{\\varepsilon A}{d} \\), so decreasing \\( d \\) increases \\( C \\).",
    explanation: [
      "\\( C \\propto \\frac{1}{d} \\) → smaller distance gives larger capacitance.",
    ],
  },

  // Page 2 (Questions 6–10)
  {
    question:
      "Which of the following machines does not apply the lever principle?",
    image: null,
    options: ["Claw hammer", "Wheelbarrow", "Single pulley", "sugar tong"],
    correctIndex: 2,
    hint: "A single fixed pulley changes direction but does not act as a lever; it is based on the wheel and axle principle.",
    explanation: [
      "Claw hammer, wheelbarrow, and sugar tongs all use lever action. A single pulley is not a lever.",
    ],
  },
  {
    question:
      "The average distance moved by a molecule between collisions is called",
    image: null,
    options: [
      "molecular distance",
      "intermolecular distance",
      "mean distance",
      "mean free path",
    ],
    correctIndex: 3,
    hint: "Mean free path is the average distance a molecule travels between collisions.",
    explanation: [
      "In kinetic theory, mean free path \\( \\lambda = \\frac{1}{\\sqrt{2} n \\pi d^{2}} \\).",
    ],
  },
  {
    question:
      "Which of the following waves requires a material medium for its propagation?",
    image: null,
    options: ["Radio waves", "Light waves", "Sound waves", "X-rays"],
    correctIndex: 2,
    hint: "Mechanical waves (like sound) require a medium; electromagnetic waves do not.",
    explanation: [
      "Sound is a mechanical wave that needs a medium (solid, liquid, gas) to travel.",
    ],
  },
  {
    question: "The depolarising agent in a Leclanche cell is?",
    image: null,
    options: [
      "carbon rod",
      "ammonium chloride",
      "manganese (IV) oxide",
      "zinc plate",
    ],
    correctIndex: 2,
    hint: "Manganese(IV) oxide (\\( \\text{MnO}_2 \\)) acts as a depolarizer to prevent hydrogen bubble buildup.",
    explanation: [
      "\\( \\text{MnO}_2 \\) oxidizes hydrogen to water, removing polarization.",
    ],
  },
  {
    question:
      "The material used to slow down the neutrons in a nuclear reactor is",
    image: null,
    options: ["boron", "copper", "graphite", "uranium"],
    correctIndex: 2,
    hint: "Graphite is a common moderator that slows neutrons via elastic collisions.",
    explanation: [
      "Moderators like graphite, heavy water, or beryllium slow fast neutrons to thermal energies.",
    ],
  },

  // Page 3 (Questions 11–15)
  {
    question:
      "Which of the following statements explain why hot soapy water is more effective in cleaning oil-stained dishes?",
    image: null,
    options: [
      "The oil on the dishes repels the soap",
      "soap and heat decrease the surface tension of oil",
      "soap increases the surface tension of oil and water",
      "Hot water increases the surface tension of oil",
    ],
    correctIndex: 1,
    hint: "Soap acts as a surfactant, reducing surface tension, and heat lowers viscosity.",
    explanation: [
      "Both soap and heat reduce the surface tension of oil, allowing it to be emulsified and washed away.",
    ],
  },
  {
    question:
      "The diagram above illustrates a beam of parallel rays from a distant object O, incident on one side of the total reflecting prism. Which diagram does not represent the correct path of the beam when it emerges from the prism?",
    image: "MZ5SwnRA1P0BESJWEEIWkROp7k2zoRW6ng2W9yjq.png",
    options: ["W", "X", "Y", "Z"],
    correctIndex: null,
    hint: "Examine each diagram for correct total internal reflection at the prism faces.",
    explanation: [],
  },
  {
    question:
      "An electrical device has \\( 50 \\) turns in its primary coil and \\( 20 \\) turns in the secondary coil. The device can be a/an?",
    image: null,
    options: [
      "step-up transformer",
      "step-down transformer",
      "d.c generator",
      "a.c generator",
    ],
    correctIndex: 1,
    hint: "Primary turns > secondary turns ⇒ step-down transformer.",
    explanation: [
      "\\( \\frac{V_s}{V_p} = \\frac{N_s}{N_p} = \\frac{20}{50} = 0.4 \\), so voltage is stepped down.",
    ],
  },
  {
    question: "The earpiece of a telephone handset converts energy from",
    image: null,
    options: [
      "electrical to sound",
      "sound to electrical",
      "sound to electrical",
      "sound to radio wave",
    ],
    correctIndex: 0,
    hint: "The earpiece (speaker) converts electrical signals to sound waves.",
    explanation: [
      "In a telephone, the earpiece contains a loudspeaker that transforms electrical energy into acoustic energy.",
    ],
  },
  {
    question:
      "Two identical cups containing the same volume of water at \\( 45^{\\circ} \\text{C} \\) and \\( 5^{\\circ} \\text{C} \\), are left in a room at \\( 25^{\\circ} \\text{C} \\). Which of the following graphs correctly illustrates the variation of temperature with time?",
    image: "data:image/jpeg;base64,...", // truncated in original, keep as is
    options: ["A", "B", "C", "D"],
    correctIndex: null,
    hint: "Both approach room temperature exponentially; the hotter one cools, the cooler one warms.",
    explanation: [],
  },

  // Page 4 (Questions 16–20)
  {
    question:
      "A ray of light traveling from glass into ethyl alcohol is incident at the boundary at an angle of incidence \\( 30^{\\circ} \\). Calculate the angle of refraction.\n[Refractive index of glass = \\( 1.5 \\); refractive index of ethyl alcohol = \\( 1.36 \\)]",
    image: null,
    options: [
      "\\( 27^{\\circ} \\)",
      "\\( 33.5^{\\circ} \\)",
      "\\( 51.7^{\\circ} \\)",
      "\\( 72.8^{\\circ} \\)",
    ],
    correctIndex: 1,
    hint: "Use Snell's law: \\( n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2 \\).",
    explanation: [
      "\\( 1.5 \\times \\sin 30^{\\circ} = 1.36 \\times \\sin\\theta_2 \\)",
      "\\( 1.5 \\times 0.5 = 0.75 \\)",
      "\\( \\sin\\theta_2 = \\frac{0.75}{1.36} \\approx 0.55147 \\)",
      "\\( \\theta_2 = \\arcsin(0.55147) \\approx 33.5^{\\circ} \\)",
    ],
  },
  {
    question:
      "A \\( 60\\,\\text{kg} \\) man stands on a weighing balance in an elevator. If the elevator accelerates upwards at \\( 5\\,\\text{ms}^{-2} \\), determine the reading of the scale. \\([g = 10\\,\\text{ms}^{-2}]\\)",
    image: null,
    options: [
      "\\( 300\\,\\text{N} \\)",
      "\\( 600\\,\\text{N} \\)",
      "\\( 800\\,\\text{N} \\)",
      "\\( 900\\,\\text{N} \\)",
    ],
    correctIndex: 3,
    hint: "Apparent weight = \\( m(g + a) \\).",
    explanation: [
      "\\( R = m(g + a) = 60 \\times (10 + 5) = 60 \\times 15 = 900\\,\\text{N} \\)",
    ],
  },
  {
    question:
      "The length of an iron bar is \\( 100\\,\\text{cm} \\) at \\( 20^{\\circ}\\text{C} \\). At what temperature will its length increase by \\( 0.01\\% \\)? [Linear expansivity of iron = \\( 1.2 \\times 10^{-5}\\,\\text{°C}^{-1} \\)]",
    image: null,
    options: [
      "\\( 48.0^{\\circ}\\text{C} \\)",
      "\\( 38.0^{\\circ}\\text{C} \\)",
      "\\( 28.3^{\\circ}\\text{C} \\)",
      "\\( 23.0^{\\circ}\\text{C} \\)",
    ],
    correctIndex: 2,
    hint: "\\( \\frac{\\Delta L}{L} = \\alpha \\Delta T \\). \\( 0.01\\% = 0.0001 \\).",
    explanation: [
      "\\( \\Delta T = \\frac{0.0001}{1.2 \\times 10^{-5}} = \\frac{0.0001}{0.000012} = 8.333\\,\\text{°C} \\)",
      "\\( T_2 = 20 + 8.333 = 28.3^{\\circ}\\text{C} \\)",
    ],
  },
  {
    question:
      "A moving-coil galvanometer which gives a full-scale deflection with \\( 0.005\\,\\text{A} \\) is converted to a voltmeter reading up to \\( 5\\,\\text{V} \\) using an external resistance of \\( 975\\,\\Omega \\). What is the resistance of the meter?",
    image: null,
    options: [
      "\\( 0.25\\,\\Omega \\)",
      "\\( 2.50\\,\\Omega \\)",
      "\\( 25.00\\,\\Omega \\)",
      "\\( 250.00\\,\\Omega \\)",
    ],
    correctIndex: 2,
    hint: "Total resistance for voltmeter = \\( V/I = 5/0.005 = 1000\\,\\Omega \\). Subtract external resistance.",
    explanation: [
      "\\( R_{\\text{total}} = \\frac{5}{0.005} = 1000\\,\\Omega \\)",
      "\\( R_g = R_{\\text{total}} - 975 = 25\\,\\Omega \\)",
    ],
  },
  {
    question:
      "A beam consisting of \\( \\alpha \\)-particles, \\( \\beta \\)-particles and \\( \\gamma \\)-rays pass through a magnetic field at right angles to the direction of the field. Which of the following observations would be made about the \\( \\alpha \\)-particles, \\( \\beta \\)-particles, and \\( \\gamma \\)-rays respectively?",
    image: null,
    options: [
      "Deflected, deflected, deflected",
      "Deflected, deflected, not deflected",
      "Deflected, not deflected, deflected",
      "Not deflected, deflected, deflected",
    ],
    correctIndex: 1,
    hint: "\\( \\alpha \\) and \\( \\beta \\) are charged particles and are deflected oppositely; \\( \\gamma \\) rays are uncharged and not deflected.",
    explanation: [
      "\\( \\alpha \\) (positive) and \\( \\beta \\) (negative) experience magnetic force; \\( \\gamma \\) (neutral) is unaffected.",
    ],
  },

  // Page 5 (Questions 21–25)
  {
    question:
      "A parallel plate capacitor is charged and the charging battery is subsequently disconnected. If the plates of the capacitor are moved farther apart by means of insulating handles, the",
    image: null,
    options: [
      "capacitance would increase",
      "capacitance would decrease",
      "charge on the capacitor would increase",
      "charge on the capacitor would decrease",
    ],
    correctIndex: 1,
    hint: "With battery disconnected, charge \\( Q \\) is constant. \\( C = \\frac{\\varepsilon A}{d} \\) → increasing \\( d \\) decreases \\( C \\).",
    explanation: [
      "\\( C = \\frac{\\varepsilon A}{d} \\) → larger \\( d \\) gives smaller \\( C \\).",
      "\\( Q \\) remains constant because the circuit is open.",
    ],
  },
  {
    question:
      "The velocity of sound in air at \\( 15^{\\circ}\\text{C} \\) is \\( 340\\,\\text{ms}^{-1} \\). Calculate the velocity at \\( 47^{\\circ}\\text{C} \\)",
    image: null,
    options: [
      "\\( 790\\,\\text{ms}^{-1} \\)",
      "\\( 602\\,\\text{ms}^{-1} \\)",
      "\\( 358\\,\\text{ms}^{-1} \\)",
      "\\( 322\\,\\text{ms}^{-1} \\)",
    ],
    correctIndex: 2,
    hint: "\\( v \\propto \\sqrt{T} \\) (absolute temperature).",
    explanation: [
      "\\( T_1 = 15 + 273 = 288\\,\\text{K} \\), \\( T_2 = 47 + 273 = 320\\,\\text{K} \\)",
      "\\( v_2 = v_1 \\sqrt{\\frac{T_2}{T_1}} = 340 \\times \\sqrt{\\frac{320}{288}} \\)",
      "\\( \\sqrt{1.1111} \\approx 1.054 \\)",
      "\\( v_2 \\approx 340 \\times 1.054 = 358.36\\,\\text{ms}^{-1} \\)",
    ],
  },
  {
    question:
      "Which of the current-voltage characteristics shown above is that exhibited by an ohmic conductor?",
    image: "HdEF4oiLCMQA9ZlSlNOBmCvzbXljyZvfmEvl4x4t.jpeg",
    options: ["A", "B", "C", "D"],
    correctIndex: null,
    hint: "Ohmic conductor has a linear \\( I-V \\) graph passing through the origin.",
    explanation: [],
  },
  {
    question:
      "A \\( 500\\,\\text{N} \\) box rests on a horizontal floor. A constant horizontal force is exerted on the box so that it moves through \\( 8\\,\\text{m} \\). If the coefficient of kinetic friction between the floor and the box is \\( 0.22 \\), calculate the work done on the box",
    image: null,
    options: [
      "\\( 880\\,\\text{J} \\)",
      "\\( 440\\,\\text{J} \\)",
      "\\( 400\\,\\text{J} \\)",
      "\\( 110\\,\\text{J} \\)",
    ],
    correctIndex: 0,
    hint: "Work = friction force × distance. Friction = \\( \\mu N = 0.22 \\times 500 = 110\\,\\text{N} \\).",
    explanation: [
      "\\( F_f = \\mu N = 0.22 \\times 500 = 110\\,\\text{N} \\)",
      "\\( W = F_f \\times d = 110 \\times 8 = 880\\,\\text{J} \\)",
    ],
  },
  {
    question:
      "The diagram illustrates a ball of mass \\( m \\) sliding down a plank inclined at an angle of \\( \\theta \\) to the horizontal. The kinetic friction between the ball and the plank is \\( F \\), and the acceleration of free fall is \\( g \\). The normal force on the ball is?",
    image: "V2TK1qMNwfrvdZQGySvR9rhtNmTr1NU848XQ2B5Z.png",
    options: [
      "\\( mg\\sin\\theta \\)",
      "\\( mg\\tan\\theta \\)",
      "\\( mg\\cos\\theta \\)",
      "\\( mg\\cot\\theta \\)",
    ],
    correctIndex: 2,
    hint: "Normal force on an inclined plane is \\( mg\\cos\\theta \\).",
    explanation: [
      "Resolving weight perpendicular to the plane: \\( N = mg\\cos\\theta \\)",
    ],
  },

  // Page 6 (Questions 26–30)
  {
    question:
      "The diagram above illustrates a ball of mass \\( m \\) sliding down a plank inclined at an angle of \\( \\theta \\) to the horizontal. The kinetic friction between the ball and the plank is \\( F \\) and the acceleration of free fall is \\( g \\). The net force on the ball along the plank is?",
    image: "CxuF07TpO7bjc3rkXnYetjrZmgdihjKeXJdyhsqR.jpeg",
    options: [
      "\\( mg\\sin\\theta + F \\)",
      "\\( F - mg\\cos\\theta \\)",
      "\\( mg\\sin\\theta - F \\)",
      "\\( F + mg\\cos\\theta \\)",
    ],
    correctIndex: 2,
    hint: "Component of weight down the plane is \\( mg\\sin\\theta \\); friction opposes motion, so net = \\( mg\\sin\\theta - F \\).",
    explanation: [
      "Along the plane: \\( F_{\\text{net}} = mg\\sin\\theta - F \\)",
    ],
  },
  {
    question:
      "What factors determine the frequency of a note emitted by a vibrating string?",
    image: null,
    options: [
      "Amplitude of vibration, force constant of string and length of string",
      "Amplitude of vibration, force constant of string, and tension in string",
      "Mass per unit length of string, tension in string and length of string",
      "Force constant of string, tension in string, and length of string.",
    ],
    correctIndex: 2,
    hint: "Frequency of a stretched string: \\( f = \\frac{1}{2L} \\sqrt{\\frac{T}{\\mu}} \\).",
    explanation: [
      "\\( f \\) depends on length (\\( L \\)), tension (\\( T \\)), and linear mass density (\\( \\mu \\)).",
    ],
  },
  {
    question:
      "The magnitude of the force experienced by a charge of \\( 1.6 \\times 10^{-8}\\,\\text{C} \\) in a uniform electric field of intensity \\( 5 \\times 10^{5}\\,\\text{NC}^{-1} \\) is",
    image: null,
    options: [
      "\\( 3.2 \\times 10^{-14}\\,\\text{N} \\)",
      "\\( 8.0 \\times 10^{-13}\\,\\text{N} \\)",
      "\\( 8.0 \\times 10^{-3}\\,\\text{N} \\)",
      "\\( 3.1 \\times 10^{13}\\,\\text{N} \\)",
    ],
    correctIndex: 2,
    hint: "\\( F = qE \\).",
    explanation: [
      "\\( F = (1.6 \\times 10^{-8}) \\times (5 \\times 10^{5}) = 8.0 \\times 10^{-3}\\,\\text{N} \\)",
    ],
  },
  {
    question:
      "A motorcycle starting from rest is uniformly accelerated such that its velocity in \\( 10\\,\\text{s} \\) is \\( 72\\,\\text{kmh}^{-1} \\). What is its acceleration?",
    image: null,
    options: [
      "\\( 108\\,\\text{ms}^{-2} \\)",
      "\\( 86\\,\\text{ms}^{-2} \\)",
      "\\( 4\\,\\text{ms}^{-2} \\)",
      "\\( 2\\,\\text{ms}^{-2} \\)",
    ],
    correctIndex: 3,
    hint: "Convert \\( 72\\,\\text{km/h} \\) to \\( \\text{m/s} \\): \\( 72 \\times \\frac{1000}{3600} = 20\\,\\text{m/s} \\). Then \\( a = \\frac{v - u}{t} \\).",
    explanation: [
      "\\( v = 20\\,\\text{m/s} \\), \\( u = 0 \\), \\( t = 10\\,\\text{s} \\)",
      "\\( a = \\frac{20 - 0}{10} = 2\\,\\text{m/s}^2 \\)",
    ],
  },
  {
    question:
      "The temperature of an object is raised by \\( 120^{\\circ}\\text{C} \\). The resulting increase in its absolute temperature is",
    image: null,
    options: [
      "\\( 50\\,\\text{K} \\)",
      "\\( 120\\,\\text{K} \\)",
      "\\( 200\\,\\text{K} \\)",
      "\\( 393\\,\\text{K} \\)",
    ],
    correctIndex: 1,
    hint: "A change of \\( 1^{\\circ}\\text{C} \\) equals a change of \\( 1\\,\\text{K} \\).",
    explanation: [
      "\\( \\Delta T \\) (in Kelvin) = \\( \\Delta T \\) (in Celsius) = \\( 120\\,\\text{K} \\)",
    ],
  },
  // ========== PAGE 1 (Questions 1–5) ==========
  {
    question:
      "In collision between two objects, kinetic energy is conserved only if",
    image: null,
    options: [
      "one of the objects was initially at rest",
      "potential energy is converted to work",
      "the collision is inelastic",
      "the collision is elastic",
    ],
    correctIndex: null,
    hint: "Kinetic energy is conserved only in perfectly elastic collisions.",
    explanation: [
      "In an elastic collision, both momentum and kinetic energy are conserved.",
      "In inelastic collisions, some kinetic energy is converted to other forms.",
    ],
  },
  {
    question: "The quantity of motion of a body is its",
    image: null,
    options: ["acceleration", "displacement", "momentum", "velocity"],
    correctIndex: null,
    hint: "Momentum is defined as mass times velocity.",
    explanation: [
      "Momentum \\( = m \\times v \\) represents the 'quantity of motion'.",
    ],
  },
  {
    question:
      "The volume of a fixed mass of a gas varies inversely as the pressure on it provided the temperature is constant. This statement is",
    image: null,
    options: ["Pressure law", "Charles law", "Boyle's law", "General gas law"],
    correctIndex: null,
    hint: "Boyle's law states \\( P \\propto 1/V \\) at constant temperature.",
    explanation: [
      "Boyle's law: \\( P V = \\text{constant} \\) for a fixed mass of gas at constant temperature.",
    ],
  },
  {
    question: "An image formed on a screen is always?",
    image: null,
    options: ["inverted", "magnified", "upright", "virtual"],
    correctIndex: null,
    hint: "Real images (formed on a screen) are always inverted.",
    explanation: [
      "Real images are formed when light rays actually converge, and they are inverted relative to the object.",
    ],
  },
  {
    question:
      "How would the capacitance of a parallel plate capacitor be affected if the distance of separation of its plates is decreased? It will",
    image: null,
    options: [
      "increase in value",
      "decrease slightly",
      "remain unchanged",
      "drop to zero",
    ],
    correctIndex: null,
    hint: "Capacitance \\( C = \\frac{\\varepsilon A}{d} \\), so decreasing \\( d \\) increases \\( C \\).",
    explanation: [
      "\\( C \\propto 1/d \\), thus smaller distance gives larger capacitance.",
    ],
  },

  // ========== PAGE 2 (Questions 6–10) ==========
  {
    question:
      "Which of the following machines does not apply the lever principle?",
    image: null,
    options: ["Claw hammer", "Wheelbarrow", "Single pulley", "sugar tong"],
    correctIndex: null,
    hint: "A single fixed pulley changes direction but does not act as a lever.",
    explanation: [
      "Claw hammer, wheelbarrow, and sugar tongs are levers; a single pulley is based on the wheel and axle.",
    ],
  },
  {
    question:
      "The average distance moved by a molecule between collisions is called",
    image: null,
    options: [
      "molecular distance",
      "intermolecular distance",
      "mean distance",
      "mean free path",
    ],
    correctIndex: null,
    hint: "Mean free path is the average distance a molecule travels between collisions.",
    explanation: [
      "\\( \\lambda = \\frac{1}{\\sqrt{2} n \\pi d^2} \\) in kinetic theory.",
    ],
  },
  {
    question:
      "Which of the following waves requires a material medium for its propagation?",
    image: null,
    options: ["Radio waves", "Light waves", "Sound waves", "X-rays"],
    correctIndex: null,
    hint: "Mechanical waves need a medium; electromagnetic waves do not.",
    explanation: [
      "Sound is a mechanical wave that requires a medium (solid, liquid, or gas).",
    ],
  },
  {
    question: "The depolarising agent in a Leclanche cell is?",
    image: null,
    options: [
      "carbon rod",
      "ammonium chloride",
      "manganese (IV) oxide",
      "zinc plate",
    ],
    correctIndex: null,
    hint: "Manganese(IV) oxide (\\( \\text{MnO}_2 \)) acts as a depolarizer.",
    explanation: [
      "\\( \\text{MnO}_2 \\) removes hydrogen gas by oxidation, preventing polarization.",
    ],
  },
  {
    question:
      "The material used to slow down the neutrons in a nuclear reactor is",
    image: null,
    options: ["boron", "copper", "graphite", "uranium"],
    correctIndex: null,
    hint: "Graphite is a common moderator that slows neutrons via elastic collisions.",
    explanation: [
      "Moderators like graphite, heavy water, or beryllium reduce neutron speed to thermal energies.",
    ],
  },

  // ========== PAGE 3 (Questions 11–15) ==========
  {
    question:
      "Which of the following statements explain why hot soapy water is more effective in cleaning oil-stained dishes?",
    image: null,
    options: [
      "The oil on the dishes repels the soap",
      "soap and heat decrease the surface tension of oil",
      "soap increases the surface tension of oil and water",
      "Hot water increases the surface tension of oil",
    ],
    correctIndex: null,
    hint: "Soap is a surfactant, and heat reduces viscosity and surface tension.",
    explanation: [
      "Both soap and heat reduce the surface tension of oil, allowing emulsification and easier washing.",
    ],
  },
  {
    question:
      "The diagram above illustrates a beam of parallel rays from a distant object O, incident on one side of the total reflecting prism. Which diagram does not represent the correct path of the beam when it emerges from the prism?",
    image: "MZ5SwnRA1P0BESJWEEIWkROp7k2zoRW6ng2W9yjq.png",
    options: ["W", "X", "Y", "Z"],
    correctIndex: null,
    hint: "Check each diagram for correct total internal reflection at the prism faces.",
    explanation: [],
  },
  {
    question:
      "An electrical device has \\( 50 \\) turns in its primary coil and \\( 20 \\) turns in the secondary coil. The device can be a/an?",
    image: null,
    options: [
      "step-up transformer",
      "step-down transformer",
      "d.c generator",
      "a.c generator",
    ],
    correctIndex: null,
    hint: "\\( N_p > N_s \\) indicates a step-down transformer.",
    explanation: [
      "\\( \\frac{V_s}{V_p} = \\frac{N_s}{N_p} = \\frac{20}{50} = 0.4 \\), so voltage is stepped down.",
    ],
  },
  {
    question: "The earpiece of a telephone handset converts energy from",
    image: null,
    options: [
      "electrical to sound",
      "sound to electrical",
      "sound to electrical",
      "sound to radio wave",
    ],
    correctIndex: null,
    hint: "The earpiece (speaker) converts electrical signals to sound waves.",
    explanation: [
      "The earpiece contains a loudspeaker that transforms electrical energy into acoustic energy.",
    ],
  },
  {
    question:
      "Two identical cups containing the same volume of water at \\( 45^{\\circ} \\text{C} \\) and \\( 5^{\\circ} \\text{C} \\), are left in a room at \\( 25^{\\circ} \\text{C} \\). Which of the following graphs correctly illustrates the variation of temperature with time?",
    image: "data:image/jpeg;base64,...", // truncated as in original
    options: ["A", "B", "C", "D"],
    correctIndex: null,
    hint: "Both approach room temperature exponentially; the hotter one cools, the cooler one warms.",
    explanation: [],
  },

  // ========== PAGE 4 (Questions 16–20) ==========
  {
    question:
      "A ray of light traveling from glass into ethyl alcohol is incident at the boundary at an angle of incidence \\( 30^{\\circ} \\). Calculate the angle of refraction.\n[Refractive index of glass = \\( 1.5 \\); refractive index of ethyl alcohol = \\( 1.36 \\)]",
    image: null,
    options: [
      "\\( 27^{\\circ} \\)",
      "\\( 33.5^{\\circ} \\)",
      "\\( 51.7^{\\circ} \\)",
      "\\( 72.8^{\\circ} \\)",
    ],
    correctIndex: null,
    hint: "Use Snell's law: \\( n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2 \\).",
    explanation: [
      "\\( 1.5 \\times \\sin 30^{\\circ} = 1.36 \\times \\sin\\theta_2 \\)",
      "\\( 0.75 = 1.36 \\sin\\theta_2 \\)",
      "\\( \\sin\\theta_2 = 0.75/1.36 \\approx 0.55147 \\)",
      "\\( \\theta_2 \\approx 33.5^{\\circ} \\)",
    ],
  },
  {
    question:
      "A \\( 60\\,\\text{kg} \\) man stands on a weighing balance in an elevator. If the elevator accelerates upwards at \\( 5\\,\\text{ms}^{-2} \\), determine the reading of the scale. \\([g = 10\\,\\text{ms}^{-2}]\\)",
    image: null,
    options: [
      "\\( 300\\,\\text{N} \\)",
      "\\( 600\\,\\text{N} \\)",
      "\\( 800\\,\\text{N} \\)",
      "\\( 900\\,\\text{N} \\)",
    ],
    correctIndex: null,
    hint: "Apparent weight = \\( m(g + a) \\).",
    explanation: ["\\( R = 60 \\times (10 + 5) = 900\\,\\text{N} \\)"],
  },
  {
    question:
      "The length of an iron bar is \\( 100\\,\\text{cm} \\) at \\( 20^{\\circ}\\text{C} \\). At what temperature will its length increase by \\( 0.01\\% \\)? [Linear expansivity of iron = \\( 1.2 \\times 10^{-5}\\,\\text{°C}^{-1} \\)]",
    image: null,
    options: [
      "\\( 48.0^{\\circ}\\text{C} \\)",
      "\\( 38.0^{\\circ}\\text{C} \\)",
      "\\( 28.3^{\\circ}\\text{C} \\)",
      "\\( 23.0^{\\circ}\\text{C} \\)",
    ],
    correctIndex: null,
    hint: "\\( \\frac{\\Delta L}{L} = \\alpha \\Delta T \\). \\( 0.01\\% = 0.0001 \\).",
    explanation: [
      "\\( \\Delta T = \\frac{0.0001}{1.2\\times10^{-5}} = 8.333\\,\\text{°C} \\)",
      "\\( T_2 = 20 + 8.333 = 28.3^{\\circ}\\text{C} \\)",
    ],
  },
  {
    question:
      "A moving-coil galvanometer which gives a full-scale deflection with \\( 0.005\\,\\text{A} \\) is converted to a voltmeter reading up to \\( 5\\,\\text{V} \\) using an external resistance of \\( 975\\,\\Omega \\). What is the resistance of the meter?",
    image: null,
    options: [
      "\\( 0.25\\,\\Omega \\)",
      "\\( 2.50\\,\\Omega \\)",
      "\\( 25.00\\,\\Omega \\)",
      "\\( 250.00\\,\\Omega \\)",
    ],
    correctIndex: null,
    hint: "Total resistance = \\( V/I = 5/0.005 = 1000\\,\\Omega \\). Subtract external resistance.",
    explanation: ["\\( R_g = 1000 - 975 = 25\\,\\Omega \\)"],
  },
  {
    question:
      "A beam consisting of \\( \\alpha \\)-particles, \\( \\beta \\)-particles and \\( \\gamma \\)-rays pass through a magnetic field at right angles to the direction of the field. Which of the following observations would be made about the \\( \\alpha \\)-particles, \\( \\beta \\)-particles, and \\( \\gamma \\)-rays respectively?",
    image: null,
    options: [
      "Deflected, deflected, deflected",
      "Deflected, deflected, not deflected",
      "Deflected, not deflected, deflected",
      "Not deflected, deflected, deflected",
    ],
    correctIndex: null,
    hint: "\\( \\alpha \\) and \\( \\beta \\) are charged; \\( \\gamma \\) is neutral.",
    explanation: [
      "\\( \\alpha \\) (positive) and \\( \\beta \\) (negative) are deflected; \\( \\gamma \\) (neutral) is not deflected.",
    ],
  },

  // ========== PAGE 5 (Questions 21–25) ==========
  {
    question:
      "A parallel plate capacitor is charged and the charging battery is subsequently disconnected. If the plates of the capacitor are moved farther apart by means of insulating handles, the",
    image: null,
    options: [
      "capacitance would increase",
      "capacitance would decrease",
      "charge on the capacitor would increase",
      "charge on the capacitor would decrease",
    ],
    correctIndex: null,
    hint: "\\( C = \\varepsilon A/d \\). With battery disconnected, charge \\( Q \\) is constant.",
    explanation: [
      "Increasing \\( d \\) decreases \\( C \\), and \\( Q \\) remains constant because the circuit is open.",
    ],
  },
  {
    question:
      "The velocity of sound in air at \\( 15^{\\circ}\\text{C} \\) is \\( 340\\,\\text{ms}^{-1} \\). Calculate the velocity at \\( 47^{\\circ}\\text{C} \\)",
    image: null,
    options: [
      "\\( 790\\,\\text{ms}^{-1} \\)",
      "\\( 602\\,\\text{ms}^{-1} \\)",
      "\\( 358\\,\\text{ms}^{-1} \\)",
      "\\( 322\\,\\text{ms}^{-1} \\)",
    ],
    correctIndex: null,
    hint: "\\( v \\propto \\sqrt{T} \\) (absolute temperature).",
    explanation: [
      "\\( T_1 = 288\\,\\text{K}, T_2 = 320\\,\\text{K} \\)",
      "\\( v_2 = 340 \\times \\sqrt{320/288} \\approx 358\\,\\text{ms}^{-1} \\)",
    ],
  },
  {
    question:
      "Which of the current-voltage characteristics shown above is that exhibited by an ohmic conductor?",
    image: "HdEF4oiLCMQA9ZlSlNOBmCvzbXljyZvfmEvl4x4t.jpeg",
    options: ["A", "B", "C", "D"],
    correctIndex: null,
    hint: "Ohmic conductor has a linear \\( I-V \\) graph through the origin.",
    explanation: [],
  },
  {
    question:
      "A \\( 500\\,\\text{N} \\) box rests on a horizontal floor. A constant horizontal force is exerted on the box so that it moves through \\( 8\\,\\text{m} \\). If the coefficient of kinetic friction between the floor and the box is \\( 0.22 \\), calculate the work done on the box",
    image: null,
    options: [
      "\\( 880\\,\\text{J} \\)",
      "\\( 440\\,\\text{J} \\)",
      "\\( 400\\,\\text{J} \\)",
      "\\( 110\\,\\text{J} \\)",
    ],
    correctIndex: null,
    hint: "Work = friction force × distance. Friction = \\( \\mu N \\).",
    explanation: [
      "\\( F_f = 0.22 \\times 500 = 110\\,\\text{N} \\), \\( W = 110 \\times 8 = 880\\,\\text{J} \\)",
    ],
  },
  {
    question:
      "The diagram illustrates a ball of mass \\( m \\) sliding down a plank inclined at an angle of \\( \\theta \\) to the horizontal. The kinetic friction between the ball and the plank is \\( F \\), and the acceleration of free fall is \\( g \\). The normal force on the ball is?",
    image: "V2TK1qMNwfrvdZQGySvR9rhtNmTr1NU848XQ2B5Z.png",
    options: [
      "\\( mg\\sin\\theta \\)",
      "\\( mg\\tan\\theta \\)",
      "\\( mg\\cos\\theta \\)",
      "\\( mg\\cot\\theta \\)",
    ],
    correctIndex: null,
    hint: "Normal force on an inclined plane is \\( mg\\cos\\theta \\).",
    explanation: [
      "Resolving weight perpendicular to the plane gives \\( N = mg\\cos\\theta \\).",
    ],
  },

  // ========== PAGE 6 (Questions 26–30) ==========
  {
    question:
      "The diagram above illustrates a ball of mass \\( m \\) sliding down a plank inclined at an angle of \\( \\theta \\) to the horizontal. The kinetic friction between the ball and the plank is \\( F \\) and the acceleration of free fall is \\( g \\). The net force on the ball along the plank is?",
    image: "CxuF07TpO7bjc3rkXnYetjrZmgdihjKeXJdyhsqR.jpeg",
    options: [
      "\\( mg\\sin\\theta + F \\)",
      "\\( F - mg\\cos\\theta \\)",
      "\\( mg\\sin\\theta - F \\)",
      "\\( F + mg\\cos\\theta \\)",
    ],
    correctIndex: null,
    hint: "Component of weight down the plane is \\( mg\\sin\\theta \\); friction opposes motion.",
    explanation: ["Net force = \\( mg\\sin\\theta - F \\)"],
  },
  {
    question:
      "What factors determine the frequency of a note emitted by a vibrating string?",
    image: null,
    options: [
      "Amplitude of vibration, force constant of string and length of string",
      "Amplitude of vibration, force constant of string, and tension in string",
      "Mass per unit length of string, tension in string and length of string",
      "Force constant of string, tension in string, and length of string.",
    ],
    correctIndex: null,
    hint: "Frequency of a stretched string: \\( f = \\frac{1}{2L} \\sqrt{\\frac{T}{\\mu}} \\).",
    explanation: [
      "\\( f \\) depends on length \\( L \\), tension \\( T \\), and linear mass density \\( \\mu \\).",
    ],
  },
  {
    question:
      "The magnitude of the force experienced by a charge of \\( 1.6 \\times 10^{-8}\\,\\text{C} \\) in a uniform electric field of intensity \\( 5 \\times 10^{5}\\,\\text{NC}^{-1} \\) is",
    image: null,
    options: [
      "\\( 3.2 \\times 10^{-14}\\,\\text{N} \\)",
      "\\( 8.0 \\times 10^{-13}\\,\\text{N} \\)",
      "\\( 8.0 \\times 10^{-3}\\,\\text{N} \\)",
      "\\( 3.1 \\times 10^{13}\\,\\text{N} \\)",
    ],
    correctIndex: null,
    hint: "\\( F = qE \\).",
    explanation: [
      "\\( F = (1.6\\times10^{-8}) \\times (5\\times10^{5}) = 8.0\\times10^{-3}\\,\\text{N} \\)",
    ],
  },
  {
    question:
      "A motorcycle starting from rest is uniformly accelerated such that its velocity in \\( 10\\,\\text{s} \\) is \\( 72\\,\\text{kmh}^{-1} \\). What is its acceleration?",
    image: null,
    options: [
      "\\( 108\\,\\text{ms}^{-2} \\)",
      "\\( 86\\,\\text{ms}^{-2} \\)",
      "\\( 4\\,\\text{ms}^{-2} \\)",
      "\\( 2\\,\\text{ms}^{-2} \\)",
    ],
    correctIndex: null,
    hint: "Convert \\( 72\\,\\text{km/h} \\) to \\( 20\\,\\text{m/s} \\). Then \\( a = (v-u)/t \\).",
    explanation: ["\\( a = (20 - 0)/10 = 2\\,\\text{ms}^{-2} \\)"],
  },
  {
    question:
      "The temperature of an object is raised by \\( 120^{\\circ}\\text{C} \\). The resulting increase in its absolute temperature is",
    image: null,
    options: [
      "\\( 50\\,\\text{K} \\)",
      "\\( 120\\,\\text{K} \\)",
      "\\( 200\\,\\text{K} \\)",
      "\\( 393\\,\\text{K} \\)",
    ],
    correctIndex: null,
    hint: "A change of \\( 1^{\\circ}\\text{C} \\) equals a change of \\( 1\\,\\text{K} \\).",
    explanation: [
      "\\( \\Delta T (\\text{K}) = \\Delta T (^{\\circ}\\text{C}) = 120\\,\\text{K} \\)",
    ],
  },

  // ========== PAGE 7 (Questions 31–35) ==========
  {
    question:
      "Which of the following statements about the motion of a simple pendulum is true?",
    image: null,
    options: [
      "It is a simple harmonic motion when the angle of displacement is large",
      "It passes the equilibrium position with minimum speed",
      "It possesses maximum kinetic energy at the extreme positions",
      "lt swings faster at the poles than at the equator",
    ],
    correctIndex: null,
    hint: "The period of a simple pendulum depends on \\( g \\), which is slightly greater at the poles.",
    explanation: [
      "\\( T = 2\\pi\\sqrt{L/g} \\), so larger \\( g \\) gives shorter period (faster swing).",
    ],
  },
  {
    question:
      "An electron of mass \\( m \\) and charge \\( e \\) moves in a circular path in a magnetic field of flux density \\( B \\). How long does it take to complete one orbit?",
    image: null,
    options: [
      "\\( \\frac{2me}{B\\pi} \\)",
      "\\( \\frac{2B}{me\\pi} \\)",
      "\\( \\frac{2\\pi m}{Be} \\)",
      "\\( \\frac{Be}{2\\pi m} \\)",
    ],
    correctIndex: null,
    hint: "Magnetic force provides centripetal force: \\( Bev = \\frac{mv^2}{r} \\). Period \\( T = \\frac{2\\pi r}{v} \\).",
    explanation: ["\\( T = \\frac{2\\pi m}{Be} \\)"],
  },
  {
    question:
      "Which of the following statements about photoelectrons is correct?",
    image: null,
    options: [
      "A faint green light produces photoelectrons with less kinetic energy than a bright red light",
      "A red light releases a smaller number of electrons than a green light",
      "A faint green light produces photoelectrons with greater kinetic energy than a bright red light",
      "A red light produces more photoelectrons than a green light",
    ],
    correctIndex: null,
    hint: "Photoelectric effect: kinetic energy depends on frequency, not intensity.",
    explanation: [
      "Green light has higher frequency than red light, so photoelectrons have greater kinetic energy regardless of intensity.",
    ],
  },
  {
    question:
      "The sketched graph above illustrates the heating curve of a 0.02kg of water. Determine the approximate value of the specific latent heat of vaporization of water",
    image: "1wOTol8NT1MhDdtJdaUbRTvD806jOQ5BUfcc6bSe.png",
    options: [
      "\\( 2.25 \\times 10^{6}\\,\\text{J kg}^{-1} \\)",
      "\\( 4.17 \\times 10^{3}\\,\\text{J kg}^{-1} \\)",
      "\\( 2.00 \\times 10^{3}\\,\\text{J kg}^{-1} \\)",
      "\\( 1.00 \\times 10^{3}\\,\\text{J kg}^{-1} \\)",
    ],
    correctIndex: null,
    hint: "From the graph, read the heat energy added during the plateau (vaporization) and divide by mass.",
    explanation: [
      "Without numerical values from the graph, a typical value for water is \\( 2.26 \\times 10^{6}\\,\\text{J kg}^{-1} \\).",
    ],
  },
  {
    question:
      "In the hydraulic press, the force \\( F \\) applied is related to the diameter \\( d \\) of the cylinder by",
    image: null,
    options: [
      "\\( F \\propto d^2 \\)",
      "\\( F \\propto d \\)",
      "\\( F \\propto d^{-1} \\)",
      "\\( F \\propto d^{-2} \\)",
    ],
    correctIndex: null,
    hint: "Pressure = force/area, and pressure is transmitted equally. Area \\( \\propto d^2 \\).",
    explanation: ["\\( F = P \\times A \\propto d^2 \\)."],
  },

  // ========== PAGE 8 (Questions 36–40) ==========
  {
    question:
      "In an electric circuit, an inductor of inductance 0.5 H and resistance \\( 50\\,\\Omega \\) is connected to an alternating current source of frequency 60 Hz. Calculate the impedance of the circuit.",
    image: null,
    options: [
      "\\( 50.0\\,\\Omega \\)",
      "\\( 450.5\\,\\Omega \\)",
      "\\( 195.0\\,\\Omega \\)",
      "\\( 1950.1\\,\\Omega \\)",
    ],
    correctIndex: null,
    hint: "Impedance \\( Z = \\sqrt{R^2 + (\\omega L)^2} \\), with \\( \\omega = 2\\pi f \\).",
    explanation: [
      "\\( \\omega = 2\\pi \\times 60 \\approx 377\\,\\text{rad/s} \\), \\( \\omega L \\approx 188.5\\,\\Omega \\), \\( Z = \\sqrt{50^2 + 188.5^2} \\approx 195\\,\\Omega \\).",
    ],
  },
  {
    question:
      "Which of the following statements correctly explains why a total solar eclipse would be seen by people on only a small portion of the earth's surface? The",
    image: null,
    options: [
      "moon is larger in diameter than the earth",
      "earth is larger in diameter than the sun",
      "earth revolves around the sun",
      "earth is larger in diameter than the moon.",
    ],
    correctIndex: null,
    hint: "The moon's umbra is very small where it hits the Earth.",
    explanation: [
      "Because the Earth is larger than the Moon, the Moon's shadow covers only a small area.",
    ],
  },
  {
    question:
      "Water waves have a wavelength of 3.6 cm and speed of 18 cm/s in deep water. If the waves enter shallow water with wavelength of 2.0 cm, calculate the speed of the waves in the shallow water.",
    image: null,
    options: [
      "\\( 0.4\\,\\text{cm/s} \\)",
      "\\( 2.5\\,\\text{cm/s} \\)",
      "\\( 10.0\\,\\text{cm/s} \\)",
      "\\( 10.8\\,\\text{cm/s} \\)",
    ],
    correctIndex: null,
    hint: "Frequency remains constant: \\( f = v_1/\\lambda_1 \\), then \\( v_2 = f \\lambda_2 \\).",
    explanation: [
      "\\( f = 18/3.6 = 5\\,\\text{Hz} \\), \\( v_2 = 5 \\times 2.0 = 10\\,\\text{cm/s} \\)",
    ],
  },
  {
    question:
      "An a.c. generator can be converted to a d.c. electric motor by replacing the",
    image: null,
    options: [
      "slip rings with a split ring and connecting a battery",
      "split ring with slip rings and connecting a battery",
      "a.c. with d.c. source and connecting slip rings",
      "a.c. with d.c. source and connecting split rings",
    ],
    correctIndex: null,
    hint: "A d.c. motor uses a split-ring commutator and a d.c. supply.",
    explanation: [
      "An a.c. generator has slip rings; replacing them with split rings and using a battery makes it a d.c. motor.",
    ],
  },
  {
    question:
      "A ray of light travels obliquely from a less dense medium to a denser medium. Which of the following statements is true about the light?",
    image: null,
    options: [
      "The wavelength of the light increases in the second medium",
      "The speed of the light increases in the second medium",
      "The light refracts towards the normal",
      "There Is a change in the frequency of the light",
    ],
    correctIndex: null,
    hint: "When light enters a denser medium, it bends toward the normal.",
    explanation: [
      "\\( n = c/v \\), so speed decreases, wavelength decreases, frequency remains constant, and the ray bends toward the normal.",
    ],
  },

  // ========== PAGE 9 (Questions 41–45) ==========
  {
    question:
      "An electron of mass \\( 9.1 \\times 10^{-31}\\,\\text{kg} \\) is travelling at a speed of \\( 2.0 \\times 10^{6}\\,\\text{ms}^{-1} \\). Calculate the associated wavelength of the electron. \\([h = 6.6 \\times 10^{-34}\\,\\text{Js}]\\)",
    image: null,
    options: [
      "\\( 3.63 \\times 10^{-10}\\,\\text{m} \\)",
      "\\( 3.63 \\times 10^{-8}\\,\\text{m} \\)",
      "\\( 3.63 \\times 10^{-7}\\,\\text{m} \\)",
      "\\( 6.89 \\times 10^{-4}\\,\\text{m} \\)",
    ],
    correctIndex: null,
    hint: "De Broglie wavelength: \\( \\lambda = h/(mv) \\).",
    explanation: [
      "\\( \\lambda = \\frac{6.6 \\times 10^{-34}}{(9.1 \\times 10^{-31}) \\times (2.0 \\times 10^{6})} \\approx 3.63 \\times 10^{-10}\\,\\text{m} \\)",
    ],
  },
  {
    question:
      "Which of the following statements about the process of melting of a solid are true? The temperature of the solid will\nI. remain steady until melting starts.\nII. keep rising until melting starts,\nIII. remain steady as melting proceeds.\nIV. keep rising as melting proceeds.",
    image: null,
    options: [
      "I and III only",
      "III and IV only",
      "I, II and III only",
      "II and IV only",
    ],
    correctIndex: null,
    hint: "During melting, temperature remains constant until all solid has melted.",
    explanation: [
      "Temperature rises until melting point, then remains constant during phase change, then rises again.",
    ],
  },
  {
    question:
      "A diver steps off a diving platform that is 10 m above the water. If there is no air resistance during the fall, there will be a decrease in the diver's",
    image: null,
    options: [
      "gravitational potential energy",
      "total mechanical energy",
      "kinetic energy",
      "momentum",
    ],
    correctIndex: null,
    hint: "Gravitational potential energy decreases as height decreases.",
    explanation: [
      "Total mechanical energy is conserved (no air resistance), so PE decreases while KE increases.",
    ],
  },
  {
    question:
      "Which of the following actions would increase the electric force between two positively charged particles?",
    image: null,
    options: [
      "Decreasing the mass of the particles",
      "Decreasing the distance between the particles",
      "Increasing the assistance between the particles",
      "Increasing the mass of the particles",
    ],
    correctIndex: null,
    hint: "Coulomb's law: \\( F = k q_1 q_2 / r^2 \\).",
    explanation: ["Decreasing the distance \\( r \\) increases the force."],
  },
  {
    question: "A luminous object is one that",
    image: null,
    options: [
      "gives off dim blue-green light only in the dark.",
      "gives out light of its own",
      "shines by reflected light only",
      "glows only in the presence of light",
    ],
    correctIndex: null,
    hint: "Luminous objects produce their own light.",
    explanation: [
      "The Sun, a light bulb, and a flame are luminous; the Moon is non-luminous (reflects light).",
    ],
  },

  // ========== PAGE 10 (Questions 46–50) ==========
  {
    question: "Which of the following units is not fundamental?",
    image: null,
    options: ["Metre", "Kilogram", "Joule", "Candela"],
    correctIndex: null,
    hint: "Fundamental (base) units in SI: metre, kilogram, second, ampere, kelvin, mole, candela.",
    explanation: ["Joule is a derived unit (kg·m²/s²)."],
  },
  {
    question:
      "The vacuum between the double walls of a thermos flask reduces heat loss through",
    image: null,
    options: [
      "conduction and radiation",
      "convection and conduction",
      "radiation only",
      "conduction only",
    ],
    correctIndex: null,
    hint: "Vacuum eliminates conduction and convection, but not radiation.",
    explanation: [
      "Heat transfer by conduction and convection requires a medium; vacuum prevents both, but radiation still occurs (silvered surfaces reduce it).",
    ],
  },
  {
    question:
      "In photoelectric effect, the number of electrons emitted per second from a metallic surface is proportional to the",
    image: null,
    options: [
      "intensity of the incident radiation",
      "frequency of the incident radiation",
      "energy of the incident radiation",
      "work function of the metal.",
    ],
    correctIndex: null,
    hint: "Number of photoelectrons depends on intensity (number of photons), not frequency.",
    explanation: [
      "Increasing intensity increases the rate of photon arrival, hence more electrons emitted, provided frequency is above threshold.",
    ],
  },
  {
    question:
      "When two cells of negligible internal resistances and equal e.m.f. denoted by \\( E_1 \\) and \\( E_2 \\) are connected in parallel, combined e.m.f. \\( E \\) is given by",
    image: null,
    options: [
      "\\( E = E_1 + E_2 \\)",
      "\\( \\frac{1}{E} = \\frac{1}{E_1} + \\frac{1}{E_2} \\)",
      "\\( E = E_1 = E_2 \\)",
      "\\( E = \\frac{E_1}{E_2} \\)",
    ],
    correctIndex: null,
    hint: "For cells in parallel with equal internal resistance (negligible), the effective e.m.f. is the same as each cell's e.m.f.",
    explanation: [
      "If \\( E_1 = E_2 \\), the parallel combination gives \\( E = E_1 = E_2 \\).",
    ],
  },
  {
    question:
      "Which of the following statement about viscosity is not true? It",
    image: null,
    options: [
      "depends on areas of the surfaces in contact",
      "occurs in fluids",
      "is independent of the relative velocity of the layers",
      "depends on the tangential force between the layers",
    ],
    correctIndex: null,
    hint: "Viscosity is the resistance to flow; it depends on velocity gradient (relative velocity).",
    explanation: [
      "Viscosity is not independent of relative velocity; the viscous force is proportional to velocity gradient.",
    ],
  },

  // ========== PAGE 11 (Questions 51–55) ==========
  {
    question:
      "An elastic material of length 3m is to be stretched to reduce an extension three times its original length. Calculate the force required to produce the extension",
    image: null,
    options: [], // No options provided in the HTML – likely a theory question; leaving empty.
    correctIndex: null,
    hint: "Incomplete data; need spring constant or Young's modulus.",
    explanation: [],
  },
  {
    question:
      "In a solar panel for heat supply, state the function of each of the following parts: (a) metal flat plate; (b) thermal insulator: (c) tubes.",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Metal plate absorbs radiation; insulator reduces heat loss; tubes carry fluid.",
    explanation: [],
  },
  {
    question:
      "(a) In the design of an optical fibre, what type of material is most suitable for the design of the core?\n(b) State one condition necessary to confine signals to the core of an optical fibre.",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Core must have higher refractive index than cladding.",
    explanation: [],
  },
  {
    question:
      "The velocity v, of a wave in a stretched string, depends on the tension T, in the spring and the mass per unit length of the spring. Obtain an expression for v in terms of T and μ, using the method of dimensions.",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Use dimensional analysis: \\( v \\propto T^{a} \\mu^{b} \\).",
    explanation: ["\\( v = k \\sqrt{\\frac{T}{\\mu}} \\)"],
  },
  {
    question:
      "A satellite launched with velocity \\( V_E \\) just escapes the earth's gravitational attraction. Given that the radius of the earth is R, show that \\( V_E = \\sqrt{20R} \\) \\([g = 10\\,\\text{ms}^{-2}]\\)",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Escape velocity \\( v_e = \\sqrt{2gR} \\). With \\( g = 10 \\), \\( v_e = \\sqrt{20R} \\).",
    explanation: [],
  },

  // ========== PAGE 12 (Questions 56–60) ==========
  {
    question:
      "A bullet is fired from a gun at \\( 30^{\\circ} \\) to the horizontal. The bullet remains in flight for 25 s before touching the ground. Calculate the velocity of projection. \\([g = 10\\,\\text{ms}^{-2}]\\)",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Time of flight \\( T = \\frac{2u\\sin\\theta}{g} \\).",
    explanation: [
      "\\( 25 = \\frac{2u \\sin 30^{\\circ}}{10} = \\frac{u}{10} \\) → \\( u = 250\\,\\text{ms}^{-1} \\)",
    ],
  },
  {
    question:
      "State three properties of lasers that make them preferable to ordinary light beam.",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Coherence, monochromaticity, directionality.",
    explanation: [],
  },
  {
    question:
      "(a)i) Define a torque.\n(ii) State three factors that determine a torque.\n(b)(i) Define free fall.\n(ii) A body is thrown vertically upwards from the top of a tower 40.0 m high with a velocity of 10.0 ms⁻¹. Calculate the time taken for the body to reach the ground. [g = 10.0 ms⁻²]\n(c) A cube of wood of side 8.0 cm floats at the interface between oil and water with 2.0 cm of its surface below the interface. Given that the relative densities of oil and water are 0.72 and 1.00 respectively, calculate the mass of the wood.",
    image: true,
    options: [],
    correctIndex: null,
    hint: "Multiple parts: use equations of motion and Archimedes' principle.",
    explanation: [],
  },
  {
    question:
      "(a)Explain resonance frequency as applied in RLC series Circuit.\n(ii) Sketch a diagram to illustrate the variation of frequency, f, with the resistance, R, the capacitive reactance, Xc, and the inductive reactance XL, in RLC series circuit.\n(iii) Using the diagram drawn in (a)(ii) state whether the current in the circuit leads, lags or is in phase with the supply voltage when: (α) f = fo; (β) f < fo; (γ) f > fo when fo is the resonant frequency.\n(b)(i) Define mutual inductance.\n(ii) The coil of an electric generator has 500 turns and 8.0 cm diameter. If it rotates in a magnetic field of density 0.25 T, calculate the angular speed when its peak voltage is 480 V. [π = 3.142]",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Peak voltage = NBAω.",
    explanation: [],
  },
  {
    question:
      "(a) (i) Define Optical angle.\n(ii) Explain two conditions necessary for total internal reflection to occur.\n(iii) List three practical applications of total internal reflection.\n(b) State two effects of refraction.\n(c)(i) Define progressive waves.\n(ii) A plane progressive wave is represented by the equation y = 0.5 sin(1000π t - (100πλ/17)x) where y is in millimetres, t in seconds and x in metres. Calculate the: (α) frequency of the wave; (β) period of the wave; (γ) speed of the wave",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Compare with standard wave equation y = A sin(ωt - kx).",
    explanation: [],
  },

  // ========== PAGE 13 (Questions 61–65) – Theory/Practical ==========
  // These are not multiple-choice; we include them with empty options but keep them for completeness.
  {
    question:
      "(a) In an experiment to measure the specific latent heat of vaporisation of water, a student places a heater in a beaker containing water. The beaker stands on an electronic balance so that the mass of the beaker and water could be measured. The heater is switched on and readings were taken every 100s when the water starts boiling. The table below shows the readings.\n\n(i) Fill in the mass of water evaporated.\n(ii) Given that the heater supplies energy at the rate of 38 J/s, fill in the values of the energy supplied by the heater in 100s, 200s, 300s, and 400s.\n(iii) Plot a graph of energy supplied on the vertical axis and mass of water evaporated on the horizontal axis, starting both axes from the origin (0,0).\n(iv) Determine the slope of the graph.\n(v) what does the value of the slope mean?",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Slope gives specific latent heat.",
    explanation: [],
  },
  {
    question:
      "(a) Define isotopes.\n(b) Mention two uses of radioactive tracers in each of the following areas: (α) medicine (β) industry (γ) agriculture.\n(c) State three features of electromagnetic waves.\n(d) Mention four components of the nuclear reactor.\n(i) State the functions of each of the components stated in (d)(i).",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Isotopes: same atomic number, different mass number.",
    explanation: [],
  },
  {
    question:
      "You are provided with a metre rule, a knife-edge, set of masses, inextensible string, retort support and other necessary apparatus. (Full experimental procedure to determine M0 using moments)",
    image: true,
    options: [],
    correctIndex: null,
    hint: "Experiment to verify principle of moments.",
    explanation: [],
  },
  {
    question:
      "You are provided with a glass block, plane mirror, and optical pins. (Experiment to determine refractive index using a glass block and plane mirror)",
    image: true,
    options: [],
    correctIndex: null,
    hint: "Use Snell's law and geometry to find refractive index.",
    explanation: [],
  },
  {
    question:
      "You are provided with a resistance box R, voltmeter, key, cell of e.m.f. E, constantan wire, standard resistor, RX, an ammeter, and other necessary apparatus. (Circuit experiment to determine internal resistance or unknown resistance)",
    image: true,
    options: [],
    correctIndex: null,
    hint: "Plot V vs I; slope gives internal resistance.",
    explanation: [],
  },
];
