import setupQuiz from "../../../../question.js";
const examQuestions = [
  // ==========================================
  // SECTION A: OBJECTIVE QUESTIONS (1-14)
  // ==========================================
  {
    question:
      "A rotating sprinkler sprays water \\(11\\) feet as it rotates in a circle. How much grass (in square feet) will the sprinkler water?",
    image: null,
    type: "objective",
    options: [
      "\\(22\\pi\\)",
      "\\(100\\pi\\)",
      "\\(12\\pi\\)",
      "\\(121\\pi\\)",
      "\\(242\\pi\\)",
    ],
    correctIndex: 3,
    hint: "The area watered forms a complete circle with a radius of \\(11\\) feet. Use the formula: \\(\\text{Area} = \\pi r^2\\).",
    explanation: [
      "Radius of the circular region \\(r = 11\\text{ feet}\\).",
      "\\(\\text{Area} = \\pi r^2 = \\pi (11)^2 = 121\\pi\\text{ square feet}\\).",
    ],
    topic: "Mensuration (Circle Area)",
  },
  {
    question:
      "Nathan can type a 30-page document in \\(40\\) minutes, Anny can type it in \\(30\\) minutes, and Ray can type it in \\(24\\) minutes. Working together, how much time will it take them to type the same document?",
    image: null,
    type: "objective",
    options: [
      "\\(5\\) minutes",
      "\\(10\\) minutes",
      "\\(15\\) minutes",
      "\\(18\\) minutes",
      "\\(20\\) minutes",
    ],
    correctIndex: 1,
    hint: "Add their individual rates of typing (pages per minute) to find their combined rate.",
    explanation: [
      "Let the total work be \\(W = 30\\text{ pages}\\).",
      "Nathan's rate: \\(R_N = \\frac{30}{40} = \\frac{3}{4}\\text{ pages/min}\\).",
      "Anny's rate: \\(R_A = \\frac{30}{30} = 1\\text{ page/min}\\).",
      "Ray's rate: \\(R_R = \\frac{30}{24} = \\frac{5}{4}\\text{ pages/min}\\).",
      "Combined rate: \\(R_{\\text{total}} = \\frac{3}{4} + 1 + \\frac{5}{4} = 3\\text{ pages/min}\\).",
      "Time taken working together = \\(\\frac{\\text{Total Work}}{\\text{Combined Rate}} = \\frac{30}{3} = 10\\text{ minutes}\\).",
    ],
    topic: "Work and Rates",
  },
  {
    question: "Find the value of \\(t\\) if \\(\\frac{t}{-3} + 13 = 9\\)",
    image: null,
    type: "objective",
    options: ["\\(-21\\)", "\\(-12\\)", "\\(39\\)", "\\(12\\)", "\\(24\\)"],
    correctIndex: 3,
    hint: "Subtract \\(13\\) from both sides of the equation first, then multiply by \\(-3\\).",
    explanation: [
      "\\(\\frac{t}{-3} + 13 = 9\\)",
      "\\(\\frac{t}{-3} = 9 - 13\\)",
      "\\(\\frac{t}{-3} = -4\\)",
      "\\(t = -4 \\times -3 = 12\\)",
    ],
    topic: "Algebraic Equations",
  },
  {
    question:
      "There are \\(49\\) dogs signed up for a dog show. There are \\(35\\) more small dogs than large dogs. How many small dogs have signed up to compete?",
    image: null,
    type: "objective",
    options: ["\\(14\\)", "\\(84\\)", "\\(42\\)", "\\(28\\)", "\\(30\\)"],
    correctIndex: 2,
    hint: "Set up a system of linear equations: \\(S + L = 49\\) and \\(S - L = 35\\).",
    explanation: [
      "Let the number of small dogs be \\(S\\) and large dogs be \\(L\\).",
      "We have: \\(S + L = 49\\) and \\(S - L = 35\\).",
      "Add the two equations: \\(2S = 84 \\implies S = 42\\).",
    ],
    topic: "Algebra (Simultaneous Equations)",
  },
  {
    question:
      "A number is thrice the second number. The second number is also twice the third number. If the average of the three numbers is \\(18\\), find the numbers.",
    image: null,
    type: "objective",
    options: [
      "\\(6, 12, 18\\)",
      "\\(3, 9, 27\\)",
      "\\(9, 18, 36\\)",
      "\\(4, 8, 42\\)",
      "\\(6, 12, 36\\)",
    ],
    correctIndex: 4,
    hint: "Let the third number be \\(x\\). Express the other two numbers in terms of \\(x\\), sum them, and set up an average equation.",
    explanation: [
      "Let the third number be \\(x\\).",
      "Second number = \\(2x\\).",
      "First number = \\(3 \\times 2x = 6x\\).",
      "Average = \\(\\frac{x + 2x + 6x}{3} = \\frac{9x}{3} = 3x\\).",
      "Since the average is \\(18\\): \\(3x = 18 \\implies x = 6\\).",
      "The numbers are: \\(6x = 36\\), \\(2x = 12\\), and \\(x = 6\\) (which are \\(6, 12, 36\\)).",
    ],
    topic: "Averages & Word Problems",
  },
  {
    question:
      "What is the minor angle between the hour and minute hand of a clock when it is \\(11:35\\)?",
    image: null,
    type: "objective",
    options: [
      "\\(137.5^\\circ\\)",
      "\\(120^\\circ\\)",
      "\\(117^\\circ\\)",
      "\\(180^\\circ\\)",
      "\\(153.5^\\circ\\)",
    ],
    correctIndex: 0,
    hint: "Find the positional angles of the hour hand and minute hand in degrees from \\(12:00\\), then find their difference.",
    explanation: [
      "Minute hand position: \\(35\\text{ mins} \\times 6^\\circ/\\text{min} = 210^\\circ\\).",
      "Hour hand position: \\((11 \\times 30^\\circ) + (35 \\times 0.5^\\circ) = 330^\\circ + 17.5^\\circ = 347.5^\\circ\\).",
      "Difference = \\(347.5^\\circ - 210^\\circ = 137.5^\\circ\\).",
    ],
    topic: "Geometry (Clock Angles)",
  },
  {
    question:
      "A father said to his son, 'I was as old as you are at present at the time of your birth'. If the father's age is \\(48\\) years now, the son's age \\(6\\) years back was:",
    image: null,
    type: "objective",
    options: [
      "\\(24\\) yrs",
      "\\(18\\) yrs",
      "\\(42\\) yrs",
      "\\(48\\) yrs",
      "\\(34\\) yrs",
    ],
    correctIndex: 1,
    hint: "If the father was the son's current age when the son was born, the father is currently twice as old as the son.",
    explanation: [
      "Let the son's current age be \\(S\\).",
      "At the son's birth, the father's age was \\(48 - S\\).",
      "Given: \\(48 - S = S \\implies 2S = 48 \\implies S = 24\\).",
      "Son's age 6 years ago = \\(24 - 6 = 18\\text{ years}\\).",
    ],
    topic: "Algebraic Word Problems",
  },
  {
    question:
      "What is the value of the missing number in: \\(67, 35, ?, 11, 7, 5\\)",
    image: null,
    type: "objective",
    options: ["\\(17\\)", "\\(28\\)", "\\(22\\)", "\\(19\\)", "\\(23\\)"],
    correctIndex: 3,
    hint: "Examine the relationship from right to left: how does \\(5\\) become \\(7\\), and \\(7\\) become \\(11\\)?",
    explanation: [
      "Looking at the sequence from right to left: \\(5, 7, 11, ?, 35, 67\\).",
      "Rule: \\(\\text{Term}_{n+1} = 2 \\times \\text{Term}_n - 3\\).",
      "\\(2 \\times 5 - 3 = 7\\)",
      "\\(2 \\times 7 - 3 = 11\\)",
      "\\(2 \\times 11 - 3 = 19\\). Let's verify: \\(2 \\times 19 - 3 = 35\\) and \\(2 \\times 35 - 3 = 67\\).",
      "The missing value is \\(19\\).",
    ],
    topic: "Number Series",
  },
  {
    question: "The area of polygon \\(ABCDEF\\), in square units, is",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%">
  <style>
    .poly { stroke: #000; stroke-width: 2; fill: #f1f5f9; }
    .dim-line { stroke: #475569; stroke-width: 1; stroke-dasharray: 2,2; }
    .text { font-family: system-ui, sans-serif; font-size: 14px; fill: #000; }
  </style>
  <polygon points="40,30 160,30 160,170 110,170 110,110 40,110" class="poly" />
  <text x="30" y="25" class="text">A</text>
  <text x="165" y="25" class="text">B</text>
  <text x="165" y="175" class="text">C</text>
  <text x="100" y="185" class="text">D</text>
  <text x="115" y="105" class="text">E</text>
  <text x="25" y="115" class="text">F</text>
  <text x="95" y="23" class="text">6</text>
  <text x="25" y="75" class="text">5</text>
  <text x="130" y="185" class="text">4</text>
  <text x="168" y="105" class="text">9</text>
</svg>`,
    type: "objective",
    options: ["\\(24\\)", "\\(30\\)", "\\(46\\)", "\\(66\\)", "\\(74\\)"],
    correctIndex: 2,
    hint: "Divide the L-shaped polygon into two simple rectangles: a top horizontal rectangle and a bottom vertical step.",
    explanation: [
      "Top rectangle height = \\(5\\), width = \\(6\\). Area = \\(5 \\times 6 = 30\\).",
      "The remaining vertical step on the right has width = \\(4\\) (given by bottom dimension \\(CD\\)).",
      "Its height = \\(9 - 5 = 4\\). Area = \\(4 \\times 4 = 16\\).",
      "Total Area = \\(30 + 16 = 46\\text{ square units}\\).",
    ],
    topic: "Mensuration (Composite Areas)",
  },
  {
    question:
      "Luka is making lemonade to sell at a school fundraiser. His recipe requires \\(4\\) times as much water as sugar and twice as much sugar as lemon juice. He uses \\(3\\) cups of lemon juice. How many cups of water does he need?",
    image: null,
    type: "objective",
    options: ["\\(6\\)", "\\(8\\)", "\\(12\\)", "\\(18\\)", "\\(24\\)"],
    correctIndex: 4,
    hint: "Use the amount of lemon juice to find the amount of sugar, then use the amount of sugar to find the required water.",
    explanation: [
      "Lemon juice used = \\(3\\text{ cups}\\).",
      "Sugar required = \\(2 \\times \\text{Lemon juice} = 2 \\times 3 = 6\\text{ cups}\\).",
      "Water required = \\(4 \\times \\text{Sugar} = 4 \\times 6 = 24\\text{ cups}\\).",
    ],
    topic: "Ratios and Proportions",
  },
  {
    question:
      "Simplify the following:\n\n\\(\\frac{3 \\times 5}{9 \\times 11} \\times \\frac{7 \\times 9 \\times 11}{3 \\times 5 \\times 7} = \\)",
    image: null,
    type: "objective",
    options: [
      "\\(1\\)",
      "\\(0\\)",
      "\\(49\\)",
      "\\(\\frac{1}{49}\\)",
      "\\(50\\)",
    ],
    correctIndex: 0,
    hint: "Cancel common factors shared between the numerators and denominators.",
    explanation: [
      "We can rewrite the multiplication of fractions as: \\(\\frac{3 \\times 5 \\times 7 \\times 9 \\times 11}{9 \\times 11 \\times 3 \\times 5 \\times 7}\\).",
      "Every term in the numerator cancels out exactly with its counterpart in the denominator.",
      "The expression simplifies to \\(1\\).",
    ],
    topic: "Fractions Simplification",
  },
  {
    question:
      "Four friends do yardwork for their neighbors over the weekend, earning \\(\\$15\\), \\(\\$20\\), \\(\\$25\\), and \\(\\$40\\), respectively. They decide to split their earnings equally among themselves. In total, how much will the friend who earned \\(\\$40\\) give to the others?",
    image: null,
    type: "objective",
    options: [
      "\\(\\$5\\)",
      "\\(\\$10\\)",
      "\\(\\$15\\)",
      "\\(\\$20\\)",
      "\\(\\$25\\)",
    ],
    correctIndex: 2,
    hint: "Calculate the average/equal share first. The difference between the highest earner's money and this average is what they give away.",
    explanation: [
      "Total earnings = \\(15 + 20 + 25 + 40 = \\$100\\).",
      "Equal share for each friend = \\(\\frac{100}{4} = \\$25\\).",
      "The friend who earned \\(\\$40\\) keeps their fair share of \\(\\$25\\) and gives the remainder to the group: \\(40 - 25 = \\$15\\).",
    ],
    topic: "Word Problems (Averages)",
  },
  {
    question:
      "Find the mean of all the multiples of \\(5\\) less than \\(26\\).",
    image: null,
    type: "objective",
    options: ["\\(10\\)", "\\(12\\)", "\\(15\\)", "\\(20\\)", "\\(25\\)"],
    correctIndex: 2,
    hint: "List all positive multiples of \\(5\\) that are less than \\(26\\), then find their average.",
    explanation: [
      "The positive multiples of \\(5\\) less than \\(26\\) are: \\(5, 10, 15, 20, 25\\).",
      "Sum of these values = \\(5 + 10 + 15 + 20 + 25 = 75\\).",
      "Number of values = \\(5\\).",
      "Mean = \\(\\frac{75}{5} = 15\\).",
    ],
    topic: "Statistics (Mean)",
  },
  {
    question: "\\(MMCDIX\\) represent what number.",
    image: null,
    type: "objective",
    options: [
      "\\(2419\\)",
      "\\(2159\\)",
      "\\(2411\\)",
      "\\(2409\\)",
      "\\(1609\\)",
    ],
    correctIndex: 3,
    hint: "Break down the Roman numeral into parts: \\(MM\\), \\(CD\\), and \\(IX\\).",
    explanation: [
      "\\(MM = 2000\\)",
      "\\(CD = 400\\) (\\(500 - 100\\))",
      "\\(IX = 9\\) (\\(10 - 1\\))",
      "Combining these: \\(2000 + 400 + 9 = 2409\\).",
    ],
    topic: "Roman Numerals",
  },

  // ==========================================
  // SECTION B: OBJECTIVE QUESTIONS (15-26)
  // ==========================================
  {
    question: "Find the reciprocal of \\(2.5\\)",
    image: null,
    type: "objective",
    options: ["\\(4\\)", "\\(0.4\\)", "\\(0.04\\)", "\\(0.004\\)", "\\(25\\)"],
    correctIndex: 1,
    hint: "The reciprocal of a number \\(x\\) is \\(\\frac{1}{x}\\). Write \\(2.5\\) as a fraction first.",
    explanation: [
      "\\(2.5 = \\frac{5}{2}\\).",
      "The reciprocal of \\(\\frac{5}{2}\\) is \\(\\frac{2}{5} = 0.4\\).",
    ],
    topic: "Fractions & Decimals",
  },
  {
    question: "Change \\(\\frac{12}{30}\\) into percentage",
    image: null,
    type: "objective",
    options: [
      "\\(40\\%\\)",
      "\\(50\\%\\)",
      "\\(60\\%\\)",
      "\\(70\\%\\)",
      "\\(100\\%\\)",
    ],
    correctIndex: 0,
    hint: "To convert any fraction to a percentage, multiply it by \\(100\\).",
    explanation: [
      "\\(\\text{Percentage} = \\frac{12}{30} \\times 100\\%\\)",
      "\\(\\frac{12}{30} = \\frac{2}{5}\\)",
      "\\(\\frac{2}{5} \\times 100\\% = 40\\%\\)",
    ],
    topic: "Percentages Conversion",
  },
  {
    question: "The complement of \\(65^\\circ\\) is --------?",
    image: null,
    type: "objective",
    options: [
      "\\(35^\\circ\\)",
      "\\(25^\\circ\\)",
      "\\(115^\\circ\\)",
      "\\(80^\\circ\\)",
      "\\(90^\\circ\\)",
    ],
    correctIndex: 1,
    hint: "Two complementary angles add up to \\(90^\\circ\\).",
    explanation: [
      "\\(\\text{Complement} = 90^\\circ - 65^\\circ = 25^\\circ\\).",
    ],
    topic: "Geometry (Angles)",
  },
  {
    question: "Which of the graphs/charts below shows a histogram?",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 365">
  <style>
    .border { stroke: #cbd5e1; stroke-width: 1.5; fill: #f8fafc; rx: 6px; }
    .axis { stroke: #475569; stroke-width: 1.5; stroke-linecap: round; }
    .grid { stroke: #e2e8f0; stroke-width: 1; stroke-dasharray: 3,3; }
    .chart-label { font-family: system-ui, -apple-system, sans-serif; font-size: 16px; font-weight: 700; fill: #1e293b; }
    .bar-chart-rect { fill: #3b82f6; stroke: #1d4ed8; stroke-width: 1.5; rx: 3px; }
    .hist-rect { fill: #10b981; stroke: #047857; stroke-width: 1.5; }
    .line { stroke: #ef4444; stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .point { fill: #ffffff; stroke: #ef4444; stroke-width: 2.5; }
    .pie-slice-1 { fill: #3b82f6; stroke: #ffffff; stroke-width: 1.5; }
    .pie-slice-2 { fill: #ec4899; stroke: #ffffff; stroke-width: 1.5; }
    .pie-slice-3 { fill: #eab308; stroke: #ffffff; stroke-width: 1.5; }
    .picto-icon { fill: #8b5cf6; stroke: #6d28d9; stroke-width: 1; }
    .text-main { font-family: system-ui, -apple-system, sans-serif; font-size: 11px; fill: #334155; font-weight: 500; }
    .text-title { font-family: system-ui, -apple-system, sans-serif; font-size: 12px; font-weight: 700; fill: #1e293b; }
  </style>

  <g transform="translate(10, 10)">
    <rect x="0" y="0" width="130" height="140" class="border" />
    <line x1="15" y1="40" x2="115" y2="40" class="grid" />
    <line x1="15" y1="80" x2="115" y2="80" class="grid" />
    <rect x="22" y="55" width="20" height="70" class="bar-chart-rect" />
    <rect x="55" y="30" width="20" height="95" class="bar-chart-rect" />
    <rect x="88" y="70" width="20" height="55" class="bar-chart-rect" />
    <line x1="15" y1="125" x2="115" y2="125" class="axis" />
    <line x1="15" y1="20" x2="15" y2="125" class="axis" />
    <text x="65" y="165" class="chart-label" text-anchor="middle">A</text>
  </g>

  <g transform="translate(160, 10)">
    <rect x="0" y="0" width="130" height="140" class="border" />
    <line x1="15" y1="40" x2="115" y2="40" class="grid" />
    <line x1="15" y1="80" x2="115" y2="80" class="grid" />
    <line x1="15" y1="125" x2="115" y2="125" class="axis" />
    <line x1="15" y1="20" x2="15" y2="125" class="axis" />
    <path d="M 25,100 L 52,45 L 80,80 L 108,30" class="line" />
    <circle cx="25" cy="100" r="4.5" class="point" />
    <circle cx="52" cy="45" r="4.5" class="point" />
    <circle cx="80" cy="80" r="4.5" class="point" />
    <circle cx="108" cy="30" r="4.5" class="point" />
    <text x="65" y="165" class="chart-label" text-anchor="middle">B</text>
  </g>

  <g transform="translate(310, 10)">
    <rect x="0" y="0" width="130" height="140" class="border" />
    <line x1="15" y1="40" x2="115" y2="40" class="grid" />
    <line x1="15" y1="80" x2="115" y2="80" class="grid" />
    <rect x="19" y="85" width="23" height="40" class="hist-rect" />
    <rect x="42" y="35" width="23" height="90" class="hist-rect" />
    <rect x="65" y="55" width="23" height="70" class="hist-rect" />
    <rect x="88" y="95" width="23" height="30" class="hist-rect" />
    <line x1="15" y1="125" x2="115" y2="125" class="axis" />
    <line x1="15" y1="20" x2="15" y2="125" class="axis" />
    <text x="65" y="165" class="chart-label" text-anchor="middle">C</text>
  </g>

  <g transform="translate(75, 185)">
    <rect x="0" y="0" width="130" height="140" class="border" />
    <g transform="translate(65, 65)">
      <path d="M 0,0 L 0,-48 A 48,48 0 0,1 41.57,24 Z" class="pie-slice-1" />
      <path d="M 0,0 L 41.57,24 A 48,48 0 0,1 -41.57,24 Z" class="pie-slice-2" />
      <path d="M 0,0 L -41.57,24 A 48,48 0 0,1 0,-48 Z" class="pie-slice-3" />
    </g>
    <text x="65" y="165" class="chart-label" text-anchor="middle">D</text>
  </g>

  <g transform="translate(235, 185)">
    <rect x="0" y="0" width="150" height="140" class="border" />
    <text x="75" y="22" class="text-title" text-anchor="middle">Favorite Fruits</text>
    
    <text x="15" y="46" class="text-main">Apples</text>
    <path d="M 65,46 A 7,7 0 0,0 79,46 Z" class="picto-icon" />
    <path d="M 84,46 A 7,7 0 0,0 98,46 Z" class="picto-icon" />
    <path d="M 103,46 A 7,7 0 0,0 117,46 Z" class="picto-icon" />
    <path d="M 122,46 A 7,7 0 0,0 136,46 Z" class="picto-icon" />
    
    <text x="15" y="71" class="text-main">Bananas</text>
    <path d="M 65,71 A 7,7 0 0,0 79,71 Z" class="picto-icon" />
    <path d="M 84,71 A 7,7 0 0,0 98,71 Z" class="picto-icon" />
    
    <text x="15" y="96" class="text-main">Oranges</text>
    <path d="M 65,96 A 7,7 0 0,0 79,96 Z" class="picto-icon" />
    <path d="M 84,96 A 7,7 0 0,0 98,96 Z" class="picto-icon" />
    <path d="M 103,96 A 7,7 0 0,0 117,96 Z" class="picto-icon" />
    
    <line x1="15" y1="112" x2="135" y2="112" stroke="#e2e8f0" stroke-width="1" />
    <text x="15" y="127" class="text-title" font-size="10px">Key:</text>
    <path d="M 45,126 A 6,6 0 0,0 57,126 Z" class="picto-icon" />
    <text x="64" y="127" class="text-main" font-size="10px">= 2 fruits</text>
    
    <text x="75" y="165" class="chart-label" text-anchor="middle">E</text>
  </g>
</svg>
`,
    type: "objective",
    options: ["A", "B", "C", "D", "E"],
    correctIndex: 2,
    hint: "Histograms display continuous frequency distribution data using adjacent bars with no spaces in between them.",
    explanation: [
      "Option A is a standard bar chart because the bars are separated by gaps.",
      "Option B is a line graph showing trends over time.",
      "Option C is a histogram because the vertical bars are continuous and adjacent (no spaces), representing frequency distribution.",
      "Option D is a pie chart showing parts of a whole.",
      "Option E is a pictogram using semicircles to represent data, with a key showing that each semicircle equals 2 fruits.",
    ],
    topic: "Statistics (Graphs)",
  },
  {
    question: "Which of these is a type of graph in Statistics?",
    image: null,
    type: "objective",
    options: [
      "Bar chart",
      "Line graph",
      "Pie-chart",
      "Histogram",
      "All of the above",
    ],
    correctIndex: 4,
    hint: "All options listed are commonly used visual statistical data representation graphs.",
    explanation: [
      "Bar charts, line graphs, pie charts, and histograms are all standard types of statistical graphics.",
    ],
    topic: "Statistics Overview",
  },
  {
    question:
      "Give the answer to the question in Roman Numerals: \\(XI + VI \\times CC\\).",
    image: null,
    type: "objective",
    options: [
      "\\(DCCXVII\\)",
      "\\(MCXVII\\)",
      "\\(MCCXI\\)",
      "\\(MMMCD\\)",
      "\\(CCXVII\\)",
    ],
    correctIndex: 2,
    hint: "Evaluate the operations using BODMAS rules first (multiply before adding), then convert to Roman numerals.",
    explanation: [
      "\\(XI = 11\\), \\(VI = 6\\), \\(CC = 200\\).",
      "Expression: \\(11 + 6 \\times 200\\).",
      "Multiply first: \\(6 \\times 200 = 1200\\).",
      "Add: \\(11 + 1200 = 1211\\).",
      "Convert \\(1211\\) to Roman numerals: \\(1000 = M\\), \\(200 = CC\\), \\(11 = XI \\rightarrow MCCXI\\).",
    ],
    topic: "Roman Numerals & Arithmetic",
  },
  {
    question:
      "In an examination, a student was asked to find \\(\\frac{3}{14}\\) of a certain number. By mistake he found \\(\\frac{3}{4}\\) of the number. His answer was \\(150\\) more than the correct answer. The answer the boy got by mistake is?",
    image: null,
    type: "objective",
    options: ["\\(210\\)", "\\(280\\)", "\\(180\\)", "\\(320\\)", "\\(150\\)"],
    correctIndex: 0,
    hint: "Let the number be \\(x\\). Formulate the equation: \\(\\frac{3}{4}x - \\frac{3}{14}x = 150\\). Make sure to solve for the mistaken answer (\\(\\frac{3}{4}x\\)), not just \\(x\\).",
    explanation: [
      "Let the number be \\(x\\).",
      "Equation: \\(\\frac{3}{4}x - \\frac{3}{14}x = 150\\).",
      "Find common denominator (\\(28\\)): \\(\\frac{21x - 6x}{28} = 150\\).",
      "\\(\\frac{15x}{28} = 150 \\implies 15x = 4200 \\implies x = 280\\).",
      "We want the mistaken answer: \\(\\frac{3}{4} \\times 280 = 210\\).",
    ],
    topic: "Algebraic Equations",
  },
  {
    question:
      "Given that \\(d = a^3bc\\), find the value of \\(d\\) if \\(a = -3\\), \\(b = 11\\) and \\(c = 2\\)",
    image: null,
    type: "objective",
    options: [
      "\\(-594\\)",
      "\\(594\\)",
      "\\(-354\\)",
      "\\(354\\)",
      "\\(-198\\)",
    ],
    correctIndex: 0,
    hint: "Substitute the values of the variables into the formula. Remember that raising a negative number to an odd power retains the negative sign.",
    explanation: [
      "\\(d = (-3)^3 \\times 11 \\times 2\\).",
      "\\((-3)^3 = -27\\).",
      "\\(d = -27 \\times 22 = -594\\).",
    ],
    topic: "Algebraic Substitution",
  },
  {
    question: "Solve \\(0.9 + 1\\frac{1}{2} = 3y\\).",
    image: null,
    type: "objective",
    options: ["\\(0.6\\)", "\\(0.8\\)", "\\(1.2\\)", "\\(1.5\\)", "\\(2.4\\)"],
    correctIndex: 1,
    hint: "Convert the mixed fraction to a decimal: \\(1\\frac{1}{2} = 1.5\\). Add to \\(0.9\\), then divide by \\(3\\).",
    explanation: [
      "\\(0.9 + 1.5 = 3y\\)",
      "\\(2.4 = 3y\\)",
      "\\(y = \\frac{2.4}{3} = 0.8\\)",
    ],
    topic: "Decimals and Fractions",
  },
  {
    question:
      "The length of a rectangle is \\(5\\) times its width. The perimeter of the rectangle is \\(144\\text{ m}\\). How wide is the rectangle?",
    image: null,
    type: "objective",
    options: [
      "\\(10\\text{ m}\\)",
      "\\(12\\text{ m}\\)",
      "\\(15\\text{ m}\\)",
      "\\(18\\text{ m}\\)",
      "\\(24\\text{ m}\\)",
    ],
    correctIndex: 1,
    hint: "Perimeter is \\(2(L + W)\\). Substitute \\(L = 5W\\) into the equation.",
    explanation: [
      "Let the width be \\(W\\). The length is \\(L = 5W\\).",
      "\\(\\text{Perimeter} = 2(L + W) = 2(5W + W) = 2(6W) = 12W\\).",
      "Given: \\(12W = 144 \\implies W = 12\\text{ m}\\).",
    ],
    topic: "Mensuration (Rectangles)",
  },
  {
    question:
      "If the cost of a bat and a baseball combined is \\(\\$1.10\\) and the bat costs \\(\\$1.00\\) more than the ball, how much is the ball?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: 1,
    hint: "Let the ball cost \\(x\\) and the bat cost \\(x + 1.00\\). Set up their sum to equal \\(1.10\\).",
    explanation: [
      "Equation: \\(\\text{Ball} + \\text{Bat} = 1.10\\).",
      "\\(x + (x + 1.00) = 1.10\\)",
      "\\(2x + 1.00 = 1.10 \\implies 2x = 0.10 \\implies x = 0.05\\)",
      "The ball costs \\(\\$0.05\\) (or \\(5\\) cents).",
    ],
    topic: "Logical Algebra Word Problems",
  },
  {
    question: "Using the diagram below, calculate the height of the table.",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%">
  <style>
    .table-wood { stroke: #7c2d12; stroke-width: 3; fill: #b45309; }
    .cat-blue { fill: #2563eb; }
    .turtle-green { fill: #22c55e; }
    .dim-label { font-family: system-ui, sans-serif; font-size: 13px; font-weight: bold; }
    .meas-line { stroke: #000; stroke-width: 1; fill: none; }
  </style>
  <g transform="translate(20, 20)">
    <line x1="10" y1="150" x2="160" y2="150" stroke="#000" stroke-width="2" />
    <rect x="50" y="80" width="70" height="8" class="table-wood" />
    <line x1="60" y1="88" x2="60" y2="150" stroke="#7c2d12" stroke-width="4" />
    <line x1="110" y1="88" x2="110" y2="150" stroke="#7c2d12" stroke-width="4" />
    <path d="M 75,80 C 75,60 85,50 85,45 C 85,55 90,65 90,80 Z" class="cat-blue" />
    <circle cx="85" cy="45" r="4" class="cat-blue" />
    <path d="M 125,150 A 10,10 0 0,1 145,150 Z" class="turtle-green" />
    <path d="M 155,45 V 150" class="meas-line" />
    <text x="160" y="100" class="dim-label">170 cm</text>
  </g>
  <g transform="translate(240, 20)">
    <line x1="10" y1="150" x2="160" y2="150" stroke="#000" stroke-width="2" />
    <rect x="50" y="80" width="70" height="8" class="table-wood" />
    <line x1="60" y1="88" x2="60" y2="150" stroke="#7c2d12" stroke-width="4" />
    <line x1="110" y1="88" x2="110" y2="150" stroke="#7c2d12" stroke-width="4" />
    <path d="M 75,80 A 10,10 0 0,1 95,80 Z" class="turtle-green" />
    <path d="M 125,150 C 125,130 135,120 135,115 C 135,125 140,135 140,150 Z" class="cat-blue" />
    <circle cx="135" cy="115" r="4" class="cat-blue" />
    <path d="M 155,70 V 150" class="meas-line" />
    <text x="160" y="115" class="dim-label">130 cm</text>
  </g>
</svg>`,
    type: "subjective",
    options: [],
    correctIndex: 1,
    hint: "Express both systems as equations: \\(\\text{Table} + \\text{Cat} - \\text{Turtle} = 170\\) and \\(\\text{Table} + \\text{Turtle} - \\text{Cat} = 130\\). Add them together.",
    explanation: [
      "Let the heights of the table, cat, and turtle be \\(T\\), \\(C\\), and \\(U\\) respectively.",
      "Left setup: \\(T + C - U = 170\\).",
      "Right setup: \\(T + U - C = 130\\).",
      "Add the two equations together: \\(2T + (C - C) + (U - U) = 170 + 130\\).",
      "\\(2T = 300 \\implies T = 150\\text{ cm}\\).",
    ],
    topic: "Algebraic Systems (Visual Puzzle)",
  },

  // ==========================================
  // SECTION C: SUBJECTIVE QUESTIONS (27-45)
  // ==========================================
  {
    question:
      "A 'stair-step' figure is made of alternating black and white squares in each row. Rows \\(1\\) through \\(4\\) are shown. All rows begin and end with a white square. The number of black squares in the \\(37^{\\text{th}}\\) row is?",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%">
  <style>
    .sq-white { fill: #fff; stroke: #000; stroke-width: 1.5; }
    .sq-black { fill: #000; stroke: #000; stroke-width: 1.5; }
  </style>
  <rect x="90" y="10" width="20" height="20" class="sq-white" />
  <rect x="80" y="30" width="20" height="20" class="sq-white" />
  <rect x="100" y="30" width="20" height="20" class="sq-black" />
  <rect x="120" y="30" width="20" height="20" class="sq-white" />
  <rect x="70" y="50" width="20" height="20" class="sq-white" />
  <rect x="90" y="50" width="20" height="20" class="sq-black" />
  <rect x="110" y="50" width="20" height="20" class="sq-white" />
  <rect x="130" y="50" width="20" height="20" class="sq-black" />
  <rect x="150" y="50" width="20" height="20" class="sq-white" />
</svg>`,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Identify the pattern of black squares in each row: Row \\(1\\) has \\(0\\), Row \\(2\\) has \\(1\\), Row \\(3\\) has \\(2\\). Generalize this to Row \\(n\\).",
    explanation: [
      "Let's count the black squares in each row:",
      "Row \\(1\\): \\(0\\) black squares.",
      "Row \\(2\\): \\(1\\) black square.",
      "Row \\(3\\): \\(2\\) black squares.",
      "Row \\(4\\): \\(3\\) black squares.",
      "The formula for the number of black squares in Row \\(n\\) is \\(n - 1\\).",
      "For the \\(37^{\\text{th}}\\) row: \\(37 - 1 = 36\\text{ black squares}\\).",
    ],
    topic: "Arithmetic Progressions",
  },
  {
    question:
      "Mr. Joseph bought a cell phone for \\(\\$8000\\) and sold it to Mr. Emeka at a loss of \\(20\\%\\). Mr. Emeka sold it to Mr. Ola at a gain of \\(10\\%\\). What did Mr. Ola pay for it?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Calculate the price paid by Mr. Emeka first (\\(80\\%\\) of \\(\\$8000\\)), then apply a \\(10\\%\\) gain to that intermediate value.",
    explanation: [
      "Amount paid by Mr. Emeka = \\(8000 \\times (100\\% - 20\\%) = 8000 \\times 0.80 = \\$6400\\).",
      "Amount paid by Mr. Ola = \\(6400 \\times (100\\% + 10\\%) = 6400 \\times 1.10 = \\$7040\\).",
    ],
    topic: "Profit and Loss Chain",
  },
  {
    question:
      "After reading \\(175\\) pages of a book a boy found he had read \\(4\\) pages more than \\(\\frac{3}{5}\\) of the whole. How many pages were left to be read?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Formulate the equation: \\(175 = \\frac{3}{5}P + 4\\) to find the total pages \\(P\\), then subtract \\(175\\) from that total.",
    explanation: [
      "Let total pages be \\(P\\).",
      "Equation: \\(\\frac{3}{5}P + 4 = 175\\).",
      "\\(\\frac{3}{5}P = 171\\).",
      "\\(P = \\frac{171 \\times 5}{3} = 57 \\times 5 = 285\\text{ pages}\\).",
      "Pages remaining to be read = \\(285 - 175 = 110\\text{ pages}\\).",
    ],
    topic: "Fraction Word Problems",
  },
  {
    question: "Simplify \\(\\frac{0.064}{0.008} + \\frac{5.04}{0.006}\\)",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Evaluate each fraction separately. Multiply the numerators and denominators by powers of \\(10\\) to clear the decimals.",
    explanation: [
      "First term: \\(\\frac{0.064}{0.008} = \\frac{64}{8} = 8\\).",
      "Second term: \\(\\frac{5.04}{0.006} = \\frac{5040}{6} = 840\\).",
      "Combined sum: \\(8 + 840 = 848\\).",
    ],
    topic: "Decimals Arithmetic",
  },
  {
    question:
      "A Maths quiz consists of \\(15\\) questions. \\(2\\) points are awarded for every correct answer and \\(1\\) point is deducted for every wrong answer. Kelly scores \\(21\\) points on the Maths quiz. How many questions does he answer wrongly?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Set up simultaneous equations: \\(C + W = 15\\) and \\(2C - W = 21\\).",
    explanation: [
      "Let the correct answers be \\(C\\) and wrong answers be \\(W\\).",
      "Total questions: \\(C + W = 15\\).",
      "Total score: \\(2C - W = 21\\).",
      "Add the two equations together: \\(3C = 36 \\implies C = 12\\).",
      "Find \\(W\\): \\(12 + W = 15 \\implies W = 3\\text{ wrong answers}\\).",
    ],
    topic: "Simultaneous Word Problems",
  },
  {
    question:
      "A trapezium has parallel sides \\(a = 5\\text{ cm}\\), \\(b = 6\\text{ cm}\\) and a height of \\(4\\text{ cm}\\). Calculate the area.",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Use the trapezium area formula: \\(\\text{Area} = \\frac{1}{2}(a + b)h\\).",
    explanation: [
      "\\(\\text{Area} = \\frac{1}{2} \\times (5 + 6) \\times 4\\)",
      "\\(\\text{Area} = 2 \\times 11 = 22\\text{ cm}^2\\).",
    ],
    topic: "Mensuration (Trapezium)",
  },
  {
    question:
      "Five congruent rectangles are attached as shown. What is the perimeter of the larger rectangle they create?",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%">
  <style>
    .rect { stroke: #000; stroke-width: 1.5; fill: #f1f5f9; }
    .meas { stroke: #000; stroke-width: 1; fill: none; }
    .text { font-family: system-ui, sans-serif; font-size: 14px; font-weight: bold; }
  </style>
  <rect x="20" y="20" width="140" height="35" class="rect" />
  <rect x="20" y="55" width="140" height="35" class="rect" />
  <rect x="20" y="90" width="140" height="35" class="rect" />
  <rect x="20" y="125" width="140" height="35" class="rect" />
  <rect x="160" y="20" width="35" height="140" class="rect" />
  <path d="M 210,20 V 160" class="meas" />
  <path d="M 205,20 H 215 M 205,160 H 215" class="meas" />
  <text x="220" y="95" class="text">22 cm</text>
</svg>`,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Find the dimensions of one of the small rectangles first. The total height is \\(22\\text{ cm}\\), which represents \\(4\\) widths of a small rectangle.",
    explanation: [
      "From the diagram, the height of the composite shape is \\(22\\text{ cm}\\).",
      "This height is composed of \\(4\\) widths of the horizontal rectangles, so: \\(4w = 22 \\implies w = 5.5\\text{ cm}\\).",
      "The length of the horizontal rectangle is equal to the height of the vertical rectangle, which is \\(22\\text{ cm}\\).",
      "Total width of the large composite rectangle = \\(l + w = 22 + 5.5 = 27.5\\text{ cm}\\).",
      "Total height of the large composite rectangle = \\(22\\text{ cm}\\).",
      "\\(\\text{Perimeter} = 2 \\times (\\text{Total Width} + \\text{Total Height}) = 2 \\times (27.5 + 22) = 2 \\times 49.5 = 99\\text{ cm}\\).",
    ],
    topic: "Geometry & Perimeter",
  },
  {
    question:
      "A car covers a distance of \\(200\\text{ km}\\) in \\(2\\) hours \\(40\\) minutes whereas a jeep covers the same distance in \\(2\\) hours. What is the ratio of their speed?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Express both times in hours first, then find their speeds using \\(\\text{Speed} = \\frac{\\text{Distance}}{\\text{Time}}\\). Ratio is \\(\\frac{\\text{Car Speed}}{\\text{Jeep Speed}}\\).",
    explanation: [
      "Car's time: \\(2\\text{h } 40\\text{m} = 2\\frac{2}{3}\\text{ hours} = \\frac{8}{3}\\text{ hours}\\).",
      "Car's speed: \\(\\frac{200}{8/3} = 200 \\times \\frac{3}{8} = 75\\text{ km/h}\\).",
      "Jeep's speed: \\(\\frac{200}{2} = 100\\text{ km/h}\\).",
      "Ratio of speeds (Car to Jeep): \\(\\frac{75}{100} = \\frac{3}{4} = 3:4\\).",
    ],
    topic: "Rates and Ratios",
  },
  {
    question:
      "The average weight of six girls is \\(41\\text{ kg}\\). If the weights of five of them are \\(42\\text{ kg}\\), \\(44\\text{ kg}\\), \\(40\\text{ kg}\\), \\(38\\text{ kg}\\) and \\(40\\text{ kg}\\), what is the weight of the sixth child?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Find the total weight of the six girls (average \\(\\times 6\\)), then subtract the sum of the five given weights.",
    explanation: [
      "Total weight of \\(6\\) girls = \\(6 \\times 41 = 246\\text{ kg}\\).",
      "Sum of \\(5\\) girls = \\(42 + 44 + 40 + 38 + 40 = 204\\text{ kg}\\).",
      "Weight of the \\(6^{\\text{th}}\\) child = \\(246 - 204 = 42\\text{ kg}\\).",
    ],
    topic: "Statistics (Averages)",
  },
  {
    question: "What is the cube root of \\(10648\\)?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Identify the number which, when multiplied by itself three times, equals \\(10648\\).",
    explanation: [
      "Let the cube root be \\(x\\). \\(x^3 = 10648\\).",
      "Since \\(20^3 = 8000\\) and \\(30^3 = 27000\\), the value is between \\(20\\) and \\(30\\).",
      "The last digit is \\(8\\), which indicates that the cube root ends in \\(2\\) (since \\(2^3 = 8\\)).",
      "Testing \\(22\\): \\(22 \\times 22 \\times 22 = 484 \\times 22 = 10648\\).",
      "The cube root of \\(10648\\) is \\(22\\).",
    ],
    topic: "Arithmetic (Roots)",
  },
  {
    question:
      "A hat cost me \\(55\\) kobo. At what price must I sell it to make a profit of \\(30\\%\\)?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Selling price is \\(130\\%\\) of the cost price. Calculate \\(55 \\times 1.30\\).",
    explanation: [
      "\\(\\text{Selling Price} = \\text{Cost Price} \\times (100\\% + \\text{Profit}\\%)\\).",
      "\\(\\text{Selling Price} = 55 \\times 1.30 = 71.5\\text{ kobo}\\).",
    ],
    topic: "Business Mathematics",
  },
  {
    question:
      "Today is Saturday \\(26^{\\text{th}}\\) March \\(2022\\), what day of the week will it be on the \\(10^{\\text{th}}\\) of April, \\(2022\\)?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Find the total number of days between March \\(26^{\\text{th}}\\) and April \\(10^{\\text{th}}\\), then find the remainder when divided by \\(7\\).",
    explanation: [
      "Days remaining in March = \\(31 - 26 = 5\\text{ days}\\).",
      "Days in April = \\(10\\text{ days}\\).",
      "Total days = \\(5 + 10 = 15\\text{ days}\\).",
      "Find the weekly remainder: \\(15 \\div 7 = 2\\) weeks with a remainder of \\(1\\text{ day}\\).",
      "Saturday + \\(1\\) day = Sunday.",
    ],
    topic: "Logic (Calendar)",
  },
  {
    question:
      "Evaluate \\(7 \\times a + 18 \\div (a + b)\\) given that \\(a = 6\\) and \\(b = 3\\).",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Substitute the values of \\(a\\) and \\(b\\) into the expression first, then perform the operations inside the brackets.",
    explanation: [
      "Expression: \\(7 \\times 6 + 18 \\div (6 + 3)\\).",
      "Parentheses first: \\(6 + 3 = 9 \\rightarrow 7 \\times 6 + 18 \\div 9\\).",
      "Multiplication & Division: \\(7 \\times 6 = 42\\) and \\(18 \\div 9 = 2\\).",
      "Add the terms: \\(42 + 2 = 44\\).",
    ],
    topic: "Algebraic Substitution",
  },
  {
    question:
      "A container filled with sugar weighs \\(800\\text{ g}\\). The same container, three-fifths full, weighs \\(500\\text{ g}\\). How much does the empty container weigh?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Formulate the two states as equations: \\(C + S = 800\\) and \\(C + \\frac{3}{5}S = 500\\). Subtract them to isolate the weight of the sugar.",
    explanation: [
      "Let the weight of the container be \\(C\\) and the sugar be \\(S\\).",
      "Full: \\(C + S = 800\\).",
      "Three-fifths: \\(C + \\frac{3}{5}S = 500\\).",
      "Subtract: \\(S - \\frac{3}{5}S = 800 - 500 \\implies \\frac{2}{5}S = 300\\).",
      "\\(S = 300 \\times \\frac{5}{2} = 750\\text{ g}\\).",
      "Weight of the container: \\(C = 800 - 750 = 50\\text{ g}\\).",
    ],
    topic: "Algebra Word Problems",
  },
  {
    question:
      "Josephine earned \\(\\$2.60\\) for working \\(6\\) hours. How much will he earn if he works for \\(7.5\\) hours?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Calculate the hourly rate first: \\(\\frac{2.60}{6}\\). Then multiply that rate by \\(7.5\\).",
    explanation: [
      "Hourly rate = \\(\\frac{2.60}{6}\\text{ per hour}\\).",
      "Earnings for \\(7.5\\) hours = \\(\\frac{2.60}{6} \\times 7.5 = 2.60 \\times 1.25 = \\$3.25\\).",
    ],
    topic: "Unitary Method",
  },
  {
    question:
      "The average of three person's age is \\(9\\) years. Find the sum of their ages.",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Average = \\(\\frac{\\text{Sum of terms}}{\\text{Number of terms}}\\). Use this to find the sum.",
    explanation: [
      "\\(9 = \\frac{\\text{Sum of ages}}{3}\\).",
      "\\(\\text{Sum of ages} = 9 \\times 3 = 27\\text{ years}\\).",
    ],
    topic: "Statistics (Averages)",
  },
  {
    question:
      "Each side of a square is \\(6\\frac{2}{3}\\text{ m}\\) long, find its perimeter.",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "A square has four equal sides. Multiply the length of one side by \\(4\\).",
    explanation: [
      "Side length \\(s = 6\\frac{2}{3} = \\frac{20}{3}\\text{ m}\\).",
      "\\(\\text{Perimeter} = 4 \\times s = 4 \\times \\frac{20}{3} = \\frac{80}{3} = 26\\frac{2}{3}\\text{ m}\\).",
    ],
    topic: "Mensuration (Square)",
  },
  {
    question: "What is the ratio of \\(1\\) hour to \\(300\\) seconds?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "Convert \\(1\\) hour to seconds first: \\(1\\text{ hour} = 3600\\text{ seconds}\\). Find their simplified ratio.",
    explanation: [
      "Convert units: \\(1\\text{ hour} = 60 \\times 60 = 3600\\text{ seconds}\\).",
      "Ratio = \\(\\frac{3600}{300} = \\frac{36}{3} = 12 = 12:1\\).",
    ],
    topic: "Ratios",
  },
  {
    question:
      "If a shoe cost \\(\\$20\\) and is reduced by \\(20\\%\\), how much will the new price be?",
    image: null,
    type: "subjective",
    options: [],
    correctIndex: null,
    hint: "The new price is \\(80\\%\\) of the original cost.",
    explanation: [
      "\\(\\text{New Price} = 20 \\times (100\\% - 20\\%) = 20 \\times 0.80 = \\$16\\).",
    ],
    topic: "Percentages (Discount)",
  },
];

setupQuiz(examQuestions, 3600);
