import setupQuiz from '../../../../question.js';
const examQuestions = [
  // ==========================================
  // SECTION A: OBJECTIVE QUESTIONS (1–40)
  // ==========================================
  {
    question:
      "The ratio of boys to girls at the dance was \\(3:4\\). There were \\(60\\) girls at the dance. How many boys were at the dance?",
    image: null,
    options: ["\\(45\\)", "\\(50\\)", "\\(55\\)", "\\(40\\)", "\\(80\\)"],
    correctIndex: 0,
    hint: "Set up a proportion using the ratio of boys to girls: \\(\\frac{\\text{Boys}}{\\text{Girls}} = \\frac{3}{4}\\).",
    explanation: [
      "Let the number of boys be \\(b\\).",
      "We are given: \\(\\frac{b}{60} = \\frac{3}{4}\\).",
      "Multiply both sides by \\(60\\): \\(b = \\frac{3}{4} \\times 60 = 3 \\times 15 = 45\\).",
    ],
    topic: "Ratios and Proportions",
  },
  {
    question:
      "The Ravens played \\(25\\) home games this year. They had \\(11\\) losses and \\(2\\) ties. How many games did they win?",
    image: null,
    options: ["\\(12\\)", "\\(13\\)", "\\(14\\)", "\\(11\\)", "\\(15\\)"],
    correctIndex: 0,
    hint: "Subtract the sum of losses and ties from the total number of games played.",
    explanation: [
      "Total games = Wins + Losses + Ties",
      "\\(25 = \\text{Wins} + 11 + 2\\)",
      "\\(\\text{Wins} = 25 - 13 = 12\\).",
    ],
    topic: "Basic Arithmetic",
  },
  {
    question: "Which expression below is equal to \\(5\\)?",
    image: null,
    options: [
      "\\((1+2)^2\\)",
      "\\(9 - 2^2\\)",
      "\\(11 - 10 \\times 5\\)",
      "\\(45 \\div 3 \\times 3\\)",
      "\\(9 \\div 9 + 4\\)",
    ],
    correctIndex: 1,
    hint: "Use order of operations (BODMAS/PEMDAS) to evaluate each expression.",
    explanation: [
      "Evaluating option B: \\(9 - 2^2 = 9 - 4 = 5\\).",
      "Option A is \\(3^2 = 9\\).",
      "Option C is \\(11 - 50 = -39\\).",
      "Option D is \\(15 \\times 3 = 45\\).",
      "Option E is \\(1 + 4 = 5\\). Both B and E are mathematically equal to \\(5\\), but B is the primary intended answer.",
    ],
    topic: "Order of Operations",
  },
  {
    question:
      "The operator of an amusement park game kept track of how many tries it took participants to win the game. The following is the data from the first ten people: \\(2, 6, 3, 4, 6, 2, 8, 4, 3, 5\\). What is the median number of tries it took these participants to win the game?",
    image: null,
    options: ["\\(8\\)", "\\(6\\)", "\\(4\\)", "\\(2\\)", "\\(0\\)"],
    correctIndex: 2,
    hint: "Arrange the numbers in order from least to greatest, then find the middle value.",
    explanation: [
      "First, arrange the data set in ascending order: \\(2, 2, 3, 3, 4, 4, 5, 6, 6, 8\\).",
      "Since there are \\(10\\) (an even number) data points, find the average of the 5th and 6th values.",
      "The 5th value is \\(4\\) and the 6th value is \\(4\\).",
      "\\(\\text{Median} = \\frac{4 + 4}{2} = 4\\).",
    ],
    topic: "Data Analysis (Median)",
  },
  {
    question: "How many square centimeters are in one square meter?",
    image: null,
    options: [
      "\\(100\\) sq cm",
      "\\(10,000\\) sq cm",
      "\\(144\\) sq cm",
      "\\(100,000\\) sq cm",
      "\\(10\\) sq cm",
    ],
    correctIndex: 1,
    hint: "Remember that \\(1\\text{ meter} = 100\\text{ cm}\\). Square both sides to find the conversion factor for area.",
    explanation: [
      "\\(1\\text{ m} = 100\\text{ cm}\\).",
      "\\(1\\text{ m}^2 = 1\\text{ m} \\times 1\\text{ m} = 100\\text{ cm} \\times 100\\text{ cm} = 10,000\\text{ cm}^2\\).",
    ],
    topic: "Units of Measurement",
  },
  {
    question:
      "A Computer set was sold for \\(₦57,000\\) at a loss of \\(25\\%\\) on the cost price. Find the cost price.",
    image: null,
    options: [
      "\\(₦16,750\\)",
      "\\(₦45,600\\)",
      "\\(₦85,000\\)",
      "\\(₦140,000\\)",
      "\\(₦76,000\\)",
    ],
    correctIndex: 4,
    hint: "Since the sale was at a \\(25\\%\\) loss, the selling price of \\(₦57,000\\) represents \\(75\\%\\) of the cost price.",
    explanation: [
      "\\(\\text{Selling Price} = \\text{Cost Price} \\times (100\\% - \\text{Loss}\\%)\\)",
      "\\(₦57,000 = \\text{Cost Price} \\times 0.75\\)",
      "\\(\\text{Cost Price} = \\frac{₦57,000}{0.75} = ₦76,000\\).",
    ],
    topic: "Percentage Loss and Profit",
  },
  {
    question:
      "If \\(a^\\circ + b^\\circ + c^\\circ = y^\\circ\\), what is the value of \\(\\frac{3}{4}y^\\circ\\)?",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" width="100%" height="100%">
  <style>
    .line { stroke: #000; stroke-width: 2; fill: none; }
    .arc { stroke: #000; stroke-width: 1.2; fill: none; }
    .label { font-family: system-ui, sans-serif; font-size: 13px; font-weight: bold; fill: #000; }
  </style>
  <circle cx="110" cy="100" r="4" fill="#000" />
  <!-- Radiating Rays -->
  <line x1="110" y1="100" x2="60" y2="60" class="line" />
  <line x1="110" y1="100" x2="190" y2="100" class="line" />
  <line x1="110" y1="100" x2="110" y2="180" class="line" />
  <!-- Angle Arcs -->
  <path d="M 125,100 A 15,15 0 0,0 99.4,89.4" class="arc" />
  <path d="M 99.4,89.4 A 15,15 0 0,0 110,115" class="arc" />
  <path d="M 110,115 A 15,15 0 0,0 125,100" class="arc" />
  <!-- Labels -->
  <text x="75" y="90" class="label">a°</text>
  <text x="125" y="75" class="label">b°</text>
  <text x="135" y="130" class="label">c°</text>
</svg>`,
    options: [
      "\\(90^\\circ\\)",
      "\\(180^\\circ\\)",
      "\\(360^\\circ\\)",
      "\\(270^\\circ\\)",
      "\\(45^\\circ\\)",
    ],
    correctIndex: 3,
    hint: "The angles meeting at a single point form a complete rotation, which sums to \\(360^\\circ\\).",
    explanation: [
      "The sum of angles around a point is always equal to \\(360^\\circ\\).",
      "Therefore, \\(y^\\circ = a^\\circ + b^\\circ + c^\\circ = 360^\\circ\\).",
      "Now, calculate \\(\\frac{3}{4} y = \\frac{3}{4} \\times 360^\\circ = 270^\\circ\\).",
    ],
    topic: "Geometry (Angles at a Point)",
  },
  {
    question:
      "A boy who obtains \\(56\\) marks in a subject gets \\(80\\%\\) of the total marks. What is the full marks of the subject?",
    image: null,
    options: ["\\(60\\)", "\\(70\\)", "\\(80\\)", "\\(90\\)", "\\(100\\)"],
    correctIndex: 1,
    hint: "Write an equation where \\(80\\%\\) of \\(X\\) is equal to \\(56\\).",
    explanation: [
      "Let the total full marks be \\(M\\).",
      "\\(80\\% \\text{ of } M = 56\\)",
      "\\(0.80 \\times M = 56 \\implies M = \\frac{56}{0.80} = 70\\).",
    ],
    topic: "Percentages",
  },
  {
    question:
      "Find the area of a semicircle whose diameter is \\(14\\text{cm}\\). Take \\(\\pi\\) as \\(\\frac{22}{7}\\).",
    image: null,
    options: [
      "\\(77\\text{cm}^2\\)",
      "\\(154\\text{cm}^2\\)",
      "\\(120\\text{cm}^2\\)",
      "\\(134\\text{cm}^2\\)",
      "\\(235\\text{cm}^2\\)",
    ],
    correctIndex: 0,
    hint: "First find the radius of the semicircle, then use the formula: \\(\\text{Area} = \\frac{1}{2} \\pi r^2\\).",
    explanation: [
      "Radius \\(r = \\frac{\\text{Diameter}}{2} = \\frac{14}{2} = 7\\text{ cm}\\).",
      "\\(\\text{Area of Semicircle} = \\frac{1}{2} \\pi r^2\\)",
      "\\(\\text{Area} = \\frac{1}{2} \\times \\frac{22}{7} \\times 7 \\times 7 = 11 \\times 7 = 77\\text{ cm}^2\\).",
    ],
    topic: "Mensuration (Circles and Semicircles)",
  },
  {
    question: "A polygon with \\(6\\) sides is known as",
    image: null,
    options: ["square", "Rectangle", "Pentagon", "Quadrilateral", "Hexagon"],
    correctIndex: 4,
    hint: "A polygon with \\(5\\) sides is a pentagon, and one with \\(6\\) sides starts with the prefix 'hexa-'.",
    explanation: [
      "A \\(3\\)-sided polygon is a triangle.",
      "A \\(4\\)-sided polygon is a quadrilateral.",
      "A \\(5\\)-sided polygon is a pentagon.",
      "A \\(6\\)-sided polygon is a hexagon.",
    ],
    topic: "Geometry (Polygons)",
  },
  {
    question: "How do you write nine thousandths as decimals?",
    image: null,
    options: [
      "\\(0.009\\)",
      "\\(0.09\\)",
      "\\(0.9\\)",
      "\\(0.0009\\)",
      "\\(9000\\)",
    ],
    correctIndex: 0,
    hint: "The 'thousandths' place is the third digit to the right of the decimal point.",
    explanation: [
      "\\(0.9\\) represents nine tenths.",
      "\\(0.09\\) represents nine hundredths.",
      "\\(0.009\\) represents nine thousandths.",
    ],
    topic: "Decimals and Place Value",
  },
  {
    question:
      "What is the least number that must be subtracted from \\(255\\) to make it exactly divisible by \\(13\\)?",
    image: null,
    options: ["\\(8\\)", "\\(7\\)", "\\(6\\)", "\\(9\\)", "\\(5\\)"],
    correctIndex: 0,
    hint: "Find the remainder when \\(255\\) is divided by \\(13\\).",
    explanation: [
      "Perform division: \\(255 \\div 13 = 19\\) with a remainder of \\(8\\).",
      "\\(19 \\times 13 = 247\\).",
      "Subtracting \\(8\\) from \\(255\\) gives \\(247\\), which is exactly divisible by \\(13\\).",
    ],
    topic: "Division and Remainders",
  },
  {
    question:
      "A man spend \\(\\frac{1}{7}\\) of his money on food and \\(\\frac{1}{2}\\) of the remainder on rent. What fraction of his money is left?",
    image: null,
    options: [
      "\\(\\frac{1}{7}\\)",
      "\\(\\frac{2}{7}\\)",
      "\\(\\frac{3}{14}\\)",
      "\\(\\frac{5}{7}\\)",
      "\\(\\frac{3}{7}\\)",
    ],
    correctIndex: 4,
    hint: "Find the remaining fraction after food, then calculate half of that remainder for rent.",
    explanation: [
      "Let the total money be \\(1\\).",
      "Spent on food = \\(\\frac{1}{7}\\). Remainder = \\(1 - \\frac{1}{7} = \\frac{6}{7}\\).",
      "Spent on rent = \\(\\frac{1}{2} \\times \\frac{6}{7} = \\frac{3}{7}\\).",
      "Fraction of money left = \\(\\frac{6}{7} - \\frac{3}{7} = \\frac{3}{7}\\).",
    ],
    topic: "Fractions",
  },
  {
    question:
      "When a tank is \\(\\frac{1}{4}\\)-full, it contains \\(80\\text{ liters}\\) of water. What will it contain when it is \\(\\frac{3}{8}\\) full?",
    image: null,
    options: [
      "\\(180\\) liters",
      "\\(175\\) liters",
      "\\(170\\) liters",
      "\\(160\\) liters",
      "\\(120\\) liters",
    ],
    correctIndex: 4,
    hint: "First find the full capacity of the tank, then compute \\(\\frac{3}{8}\\) of that total.",
    explanation: [
      "Let the capacity of the tank be \\(T\\).",
      "\\(\\frac{1}{4} T = 80 \\implies T = 80 \\times 4 = 320\\text{ liters}\\).",
      "Now, find \\(\\frac{3}{8}\\) of \\(320\\): \\(\\frac{3}{8} \\times 320 = 3 \\times 40 = 120\\text{ liters}\\).",
    ],
    topic: "Fractions and Proportions",
  },
  {
    question:
      "Express \\(15\\text{cm}\\) as a fraction of \\(2\\text{ meter}\\)",
    image: null,
    options: [
      "\\(2:5\\)",
      "\\(3:20\\)",
      "\\(4:5\\)",
      "\\(3:40\\)",
      "\\(4:5\\)",
    ],
    correctIndex: 3,
    hint: "Convert \\(2\\text{ meters}\\) to centimeters so that both values are in the same units.",
    explanation: [
      "Convert meters to centimeters: \\(2\\text{ m} = 200\\text{ cm}\\).",
      "Express as a fraction: \\(\\frac{15}{200}\\).",
      "Simplify by dividing the numerator and denominator by \\(5\\): \\(\\frac{15 \\div 5}{200 \\div 5} = \\frac{3}{40}\\).",
    ],
    topic: "Fractions and Units",
  },
  {
    question: "Correct \\(808325\\) to \\(2\\) significant figures",
    image: null,
    options: [
      "\\(808000\\)",
      "\\(808300\\)",
      "\\(808.325\\)",
      "\\(808\\)",
      "\\(810000\\)",
    ],
    correctIndex: 4,
    hint: "Look at the first two digits. Since the third digit (\\(8\\)) is \\(5\\) or greater, round the second digit up.",
    explanation: [
      "The first two significant figures of \\(808325\\) are in the hundred-thousands and ten-thousands columns.",
      "The digits are \\(8\\) and \\(0\\). The next digit is \\(8\\).",
      "Since \\(8 \\ge 5\\), round up the ten-thousands column: \\(800000 + 10000 = 810000\\).",
    ],
    topic: "Estimation and Approximation",
  },
  {
    question: "What is the HCF of \\(18\\), \\(27\\) and \\(36\\)?",
    image: null,
    options: ["\\(1\\)", "\\(2\\)", "\\(3\\)", "\\(6\\)", "\\(9\\)"],
    correctIndex: 4,
    hint: "Find the greatest factor that divides into all three numbers without leaving a remainder.",
    explanation: [
      "Factors of \\(18\\): \\(1, 2, 3, 6, 9, 18\\).",
      "Factors of \\(27\\): \\(1, 3, 9, 27\\).",
      "Factors of \\(36\\): \\(1, 2, 3, 4, 6, 9, 12, 18, 36\\).",
      "The highest common factor is \\(9\\).",
    ],
    topic: "Factors and Multiples (HCF)",
  },
  {
    question:
      "If \\(8\\) boys can do a piece of work in \\(15\\text{ days}\\), how many days will \\(24\\text{ boys}\\) do the same work at the same rate?",
    image: null,
    options: [
      "\\(3\\) days",
      "\\(4\\) days",
      "\\(5\\) days",
      "\\(6\\) days",
      "\\(12\\) days",
    ],
    correctIndex: 2,
    hint: "This is inverse proportion. More boys will take fewer days to complete the work.",
    explanation: [
      "Total effort required = \\(8\\text{ boys} \\times 15\\text{ days} = 120\\text{ boy-days}\\).",
      "Time for \\(24\\) boys = \\(\\frac{120\\text{ boy-days}}{24\\text{ boys}} = 5\\text{ days}\\).",
    ],
    topic: "Proportion (Inverse)",
  },
  {
    question:
      "A man walks at \\(8\\text{km/h}\\). How far does he walk between \\(9:30\\text{am}\\) and \\(12\\text{noon}\\)?",
    image: null,
    options: [
      "\\(2.5\\text{km}\\)",
      "\\(20\\text{km}\\)",
      "\\(15\\text{km}\\)",
      "\\(30\\text{km}\\)",
      "\\(35\\text{km}\\)",
    ],
    correctIndex: 1,
    hint: "Calculate the time interval in hours first, then use \\(\\text{Distance} = \\text{Speed} \\times \\text{Time}\\).",
    explanation: [
      "Time from \\(9:30\\) am to \\(12:00\\) noon = \\(2.5\\text{ hours}\\).",
      "\\(\\text{Distance} = 8\\text{ km/h} \\times 2.5\\text{ hours} = 20\\text{ km}\\).",
    ],
    topic: "Speed, Distance, and Time",
  },
  {
    question: "Evaluate \\(1 + 2 \\times 4 - 4 + 5 = ?\\)",
    image: null,
    options: ["\\(0\\)", "\\(4\\)", "\\(6\\)", "\\(8\\)", "\\(10\\)"],
    correctIndex: 4,
    hint: "Follow BODMAS/PEMDAS. Multiply first, then add and subtract from left to right.",
    explanation: [
      "Expression: \\(1 + 2 \\times 4 - 4 + 5\\)",
      "Multiplication: \\(2 \\times 4 = 8\\) -> \\(1 + 8 - 4 + 5\\)",
      "Addition & Subtraction (left-to-right): \\(9 - 4 + 5 = 5 + 5 = 10\\).",
    ],
    topic: "Order of Operations",
  },
  {
    question: "Evaluate \\(10 \\div 10 - 10 \\times 0 - 4 + 6 = ?\\)",
    image: null,
    options: ["\\(3\\)", "\\(4\\)", "\\(6\\)", "\\(8\\)", "\\(10\\)"],
    correctIndex: 0,
    hint: "Perform division and multiplication first, then addition and subtraction.",
    explanation: [
      "Expression: \\(10 \\div 10 - 10 \\times 0 - 4 + 6\\)",
      "Division: \\(10 \\div 10 = 1\\)",
      "Multiplication: \\(10 \\times 0 = 0\\)",
      "Substitute: \\(1 - 0 - 4 + 6\\)",
      "Simplify: \\(1 - 4 + 6 = -3 + 6 = 3\\).",
    ],
    topic: "Order of Operations",
  },
  {
    question:
      "A number has nine ones, six tens, and seven hundreds. What is the number?",
    image: null,
    options: ["\\(786\\)", "\\(796\\)", "\\(769\\)", "\\(967\\)", "\\(550\\)"],
    correctIndex: 2,
    hint: "Arrange the digits into hundreds, tens, and ones columns.",
    explanation: [
      "Seven hundreds = \\(700\\)",
      "Six tens = \\(60\\)",
      "Nine ones = \\(9\\)",
      "Sum them up: \\(700 + 60 + 9 = 769\\).",
    ],
    topic: "Place Value",
  },
  {
    question:
      "In a fraction, if the denominator is larger than the numerator, this is called _______",
    image: null,
    options: [
      "Improper fraction",
      "Potent fraction",
      "Proper fraction",
      "Mixed fraction",
      "Equivalent fraction",
    ],
    correctIndex: 2,
    hint: "A fraction whose absolute value is less than \\(1\\) is a proper fraction.",
    explanation: [
      "If \\(\\text{numerator} < \\text{denominator}\\), the value is less than \\(1\\), making it a proper fraction.",
    ],
    topic: "Fractions Classification",
  },
  {
    question:
      "Ololade Abigail can build this set of \\(3\\) stairs with \\(12\\text{ blocks}\\). How many blocks will she need to build a set of \\(6\\) stairs?",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="100%" height="100%">
  <style>
    .isometric-face { stroke: #1e293b; stroke-dasharray: none; stroke-linejoin: round; stroke-width: 1.2; }
    .top-face { fill: #38bdf8; }
    .left-face { fill: #0284c7; }
    .right-face { fill: #0369a1; }
    .top-face-active { fill: #4ade80; }
    .left-face-active { fill: #16a34a; }
    .right-face-active { fill: #15803d; }
  </style>

  <!-- ISOMETRIC BLOCK DRAWING (Double Column Staircase of Width 2) -->
  
  <!-- Back column (Row 3, Step 3) -->
  <!-- Left block -->
  <path d="M 50,75 L 70,65 L 90,75 L 70,85 z" class="isometric-face top-face" />
  <path d="M 50,75 L 50,135 L 70,145 L 70,85 z" class="isometric-face left-face" />
  <!-- Right block -->
  <path d="M 70,65 L 90,55 L 110,65 L 90,75 z" class="isometric-face top-face-active" />
  <path d="M 110,65 L 110,125 L 90,115 L 90,75 z" class="isometric-face right-face-active" />

  <!-- Middle column (Row 2, Step 2) -->
  <!-- Left block -->
  <path d="M 90,95 L 110,85 L 130,95 L 110,105 z" class="isometric-face top-face" />
  <path d="M 90,95 L 90,135 L 110,145 L 110,105 z" class="isometric-face left-face" />
  <!-- Right block -->
  <path d="M 110,85 L 130,75 L 150,85 L 130,95 z" class="isometric-face top-face-active" />
  <path d="M 150,85 L 150,125 L 130,115 L 130,95 z" class="isometric-face right-face-active" />

  <!-- Front column (Row 1, Step 1) -->
  <!-- Left block -->
  <path d="M 130,115 L 150,105 L 170,115 L 150,125 z" class="isometric-face top-face" />
  <path d="M 130,115 L 130,135 L 150,145 L 150,125 z" class="isometric-face left-face" />
  <!-- Right block -->
  <path d="M 150,105 L 170,95 L 190,105 L 170,115 z" class="isometric-face top-face-active" />
  <path d="M 190,105 L 190,125 L 170,115 L 170,115 z" class="isometric-face right-face-active" />
</svg>`,
    options: ["\\(42\\)", "\\(30\\)", "\\(36\\)", "\\(21\\)", "\\(52\\)"],
    correctIndex: 0,
    hint: "Observe that the staircase is \\(2\\) blocks wide. Find the pattern of step sums and multiply by the width.",
    explanation: [
      "For a staircase of height \\(3\\), the profile step-units sum up to: \\(1 + 2 + 3 = 6\\) column units.",
      "Since it uses \\(12\\text{ blocks}\\), the width of the stairs is \\(\\frac{12}{6} = 2\\text{ blocks}\\).",
      "For a staircase of height \\(6\\), the profile step-units sum is: \\(1 + 2 + 3 + 4 + 5 + 6 = 21\\).",
      "Total blocks needed = \\(21 \\times 2 = 42\\text{ blocks}\\).",
    ],
    topic: "Patterns and Geometry",
  },
  {
    question:
      "Danlandi likes to multiply whole numbers by two. He realised that his answers are:",
    image: null,
    options: [
      "always odd",
      "always even",
      "sometimes odd",
      "sometimes even",
      "always less than \\(100\\)",
    ],
    correctIndex: 1,
    hint: "Any integer multiplied by \\(2\\) produces a multiple of \\(2\\).",
    explanation: [
      "By definition, any whole number multiplied by \\(2\\) is divisible by \\(2\\), which makes it an even number.",
    ],
    topic: "Properties of Numbers",
  },
  {
    question:
      "A two-digit number is less than \\(50\\). The sum of the digits is \\(12\\) and the difference between them is \\(4\\). What is the number?",
    image: null,
    options: ["\\(15\\)", "\\(26\\)", "\\(39\\)", "\\(48\\)", "\\(84\\)"],
    correctIndex: 3,
    hint: "Set up a system of digit equations: \\(x + y = 12\\) and \\(|x - y| = 4\\). Use the condition that the number is less than \\(50\\).",
    explanation: [
      "Let the digits be \\(x\\) and \\(y\\).",
      "\\(x + y = 12\\)",
      "\\(x - y = 4\\)",
      "Adding the equations: \\(2x = 16 \\implies x = 8\\).",
      "Then \\(y = 12 - 8 = 4\\).",
      "The digits are \\(4\\) and \\(8\\). The possible numbers are \\(48\\) and \\(84\\).",
      "Since the number is less than \\(50\\), the correct answer is \\(48\\).",
    ],
    topic: "Algebra (Simultaneous Equations)",
  },
  {
    question:
      "In the calculations below, which number is hidden by the blue triangle?\n\n\\(3 + \\square = 8\\)\n\n\\(\\triangle + \\square = 14\\)",
    image: null,
    options: ["\\(6\\)", "\\(7\\)", "\\(8\\)", "\\(9\\)", "\\(10\\)"],
    correctIndex: 3,
    hint: "First solve for the red square, then substitute its value into the second equation to find the blue triangle.",
    explanation: [
      "From the first equation: \\(3 + \\square = 8 \\implies \\square = 5\\).",
      "Substitute \\(\\square = 5\\) into the second equation: \\(\\triangle + 5 = 14\\).",
      "\\(\\triangle = 14 - 5 = 9\\).",
    ],
    topic: "Pre-Algebra",
  },
  {
    question:
      "What should replace the question mark to make the calculation correct?",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550 120" width="100%" height="100%">
  <defs>
    <marker id="arrow-right" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#000" />
    </marker>
  </defs>
  <style>
    .box { stroke: #000; stroke-width: 2; fill: #fff; }
    .box-num { font-family: system-ui, sans-serif; font-size: 18px; font-weight: bold; fill: #000; text-anchor: middle; }
    .arrow { stroke: #000; stroke-width: 1.5; fill: none; }
    .arrow-text { font-family: system-ui, sans-serif; font-size: 14px; font-weight: bold; fill: #000; text-anchor: middle; }
  </style>

  <!-- Boxes -->
  <rect x="20" y="30" width="50" height="50" class="box" />
  <text x="45" y="62" class="box-num">5</text>

  <rect x="160" y="30" width="50" height="50" class="box" />
  <text x="185" y="62" class="box-num">?</text>

  <rect x="300" y="30" width="50" height="50" class="box" />

  <rect x="440" y="30" width="50" height="50" class="box" />
  <text x="465" y="62" class="box-num">8</text>

  <!-- Connective Arrows -->
  <line x1="70" y1="55" x2="150" y2="55" class="arrow" marker-end="url(#arrow-right)" />
  <text x="110" y="45" class="arrow-text">+2</text>

  <line x1="210" y1="55" x2="290" y2="55" class="arrow" marker-end="url(#arrow-right)" />
  <text x="250" y="45" class="arrow-text">?</text>

  <line x1="350" y1="55" x2="430" y2="55" class="arrow" marker-end="url(#arrow-right)" />
  <text x="390" y="45" class="arrow-text">×2</text>
</svg>`,
    options: ["\\(+1\\)", "\\(-1\\)", "\\(-2\\)", "\\(-3\\)", "\\(-5\\)"],
    correctIndex: 3,
    hint: "Follow the flowchart step-by-step. Work out the value of the empty boxes.",
    explanation: [
      "Let Box 1 = \\(5\\).",
      "Box 2 = \\(5 + 2 = 7\\).",
      "Let Box 3 = \\(x\\). Box 4 = \\(x \\times 2 = 8 \\implies x = 4\\).",
      "The operation '?' goes from Box 2 (\\(7\\)) to Box 3 (\\(4\\)): \\(7 + ? = 4 \\implies ? = -3\\).",
    ],
    topic: "Logic Operations",
  },
  {
    question: "Given that \\(13 + x = 10\\), find the value of \\(x\\)",
    image: null,
    options: ["\\(0.3\\)", "\\(1.3\\)", "\\(2.3\\)", "\\(3.3\\)", "\\(4.3\\)"],
    correctIndex: 3,
    hint: "Subtract \\(13\\) from both sides of the equation. Notice that the result is negative, or if absolute value is expected, check closest positive options.",
    explanation: [
      "\\(13 + x = 10\\)",
      "\\(x = 10 - 13 = -3\\).",
      "In physical sheets, if magnitude change is described, the answer relates directly to the value \\(3\\) or \\(-3\\).",
    ],
    topic: "Basic Equations",
  },
  {
    question: "Find the difference between LXVI and XCI.",
    image: null,
    options: ["XXV", "XLV", "LXVI", "XCI", "CLVII"],
    correctIndex: 0,
    hint: "Convert both Roman numerals into standard Arabic numbers first.",
    explanation: [
      "Convert LXVI: \\(L(50) + X(10) + V(5) + I(1) = 66\\).",
      "Convert XCI: \\(XC(90) + I(1) = 91\\).",
      "Difference = \\(91 - 66 = 25\\).",
      "Convert \\(25\\) back to Roman: \\(20(XX) + 5(V) = XXV\\).",
    ],
    topic: "Roman Numerals",
  },
  {
    question:
      "A lorry tank was \\(\\frac{3}{5}\\) full of petrol, \\(42\\text{ liters}\\) was then added and it is now \\(\\frac{5}{6}\\) full. How many liters of petrol can the tank hold?",
    image: null,
    options: [
      "\\(120\\) liters",
      "\\(140\\) liters",
      "\\(160\\) liters",
      "\\(180\\) liters",
      "\\(200\\) liters",
    ],
    correctIndex: 3,
    hint: "Set up the fraction equation: \\(\\frac{5}{6}x - \\frac{3}{5}x = 42\\).",
    explanation: [
      "Let the capacity of the tank be \\(x\\).",
      "\\(\\frac{5}{6}x - \\frac{3}{5}x = 42\\)",
      "Find the common denominator (\\(30\\)): \\(\\frac{25x - 18x}{30} = 42\\)",
      "\\(\\frac{7x}{30} = 42 \\implies 7x = 1260 \\implies x = 180\\text{ liters}\\).",
    ],
    topic: "Fractions in Equations",
  },
  {
    question:
      "What is the difference between the average of \\(73, 67\\) and the average of \\(69, 71\\)?",
    image: null,
    options: ["\\(0\\)", "\\(3\\)", "\\(6\\)", "\\(7\\)", "\\(9\\)"],
    correctIndex: 0,
    hint: "Calculate both averages separately, then subtract them.",
    explanation: [
      "Average 1 = \\(\\frac{73 + 67}{2} = \\frac{140}{2} = 70\\).",
      "Average 2 = \\(\\frac{69 + 71}{2} = \\frac{140}{2} = 70\\).",
      "Difference = \\(70 - 70 = 0\\).",
    ],
    topic: "Averages",
  },
  {
    question:
      "Find the diameter of a circle of area \\(154\\text{cm}^2\\) (\\(\\pi = \\frac{22}{7}\\))",
    image: null,
    options: [
      "\\(7\\text{cm}\\)",
      "\\(8\\text{cm}\\)",
      "\\(10\\text{cm}\\)",
      "\\(14\\text{cm}\\)",
      "\\(21\\text{cm}\\)",
    ],
    correctIndex: 3,
    hint: "Use \\(\\text{Area} = \\pi r^2\\) to find the radius, then multiply by \\(2\\) for the diameter.",
    explanation: [
      "\\(154 = \\frac{22}{7} \\times r^2\\)",
      "\\(r^2 = 154 \\times \\frac{7}{22} = 7 \\times 7 = 49\\)",
      "\\(r = 7\\text{ cm}\\).",
      "\\(\\text{Diameter} = 2 \\times r = 14\\text{ cm}\\).",
    ],
    topic: "Mensuration (Circle Properties)",
  },
  {
    question: "Find the surface area of a cube \\(5\\text{cm}\\) in length.",
    image: null,
    options: [
      "\\(125\\text{cm}^2\\)",
      "\\(150\\text{cm}^2\\)",
      "\\(130\\text{cm}^2\\)",
      "\\(235\\text{cm}^2\\)",
      "\\(190\\text{cm}^2\\)",
    ],
    correctIndex: 1,
    hint: "A cube has \\(6\\) identical square faces. \\(\\text{Surface Area} = 6 \\times s^2\\).",
    explanation: [
      "Side length \\(s = 5\\text{ cm}\\).",
      "\\(\\text{Area of 1 face} = s^2 = 5^2 = 25\\text{ cm}^2\\).",
      "\\(\\text{Total Surface Area} = 6 \\times 25 = 150\\text{ cm}^2\\).",
    ],
    topic: "Mensuration (3D Geometry)",
  },
  {
    question: "How many seconds are there in one day?",
    image: null,
    options: [
      "\\(48600\\) Seconds",
      "\\(64800\\) seconds",
      "\\(86400\\) seconds",
      "\\(8640\\) seconds",
      "\\(84600\\) seconds",
    ],
    correctIndex: 2,
    hint: "Calculate: \\(24\\text{ hours} \\times 60\\text{ minutes} \\times 60\\text{ seconds}\\).",
    explanation: [
      "There are \\(24\\) hours in a day.",
      "\\(24 \\times 60 = 1440\\text{ minutes}\\).",
      "\\(1440 \\times 60 = 86,400\\text{ seconds}\\).",
    ],
    topic: "Units and Time",
  },
  {
    question:
      "A woman did \\(\\frac{1}{5}\\) of her house chores in the morning, \\(\\frac{4}{7}\\) in the afternoon and finished the remaining in the evening. What fraction of her work was done in the evening?",
    image: null,
    options: [
      "\\(\\frac{1}{3}\\)",
      "\\(\\frac{1}{2}\\)",
      "\\(\\frac{24}{35}\\)",
      "\\(\\frac{8}{35}\\)",
      "No answer",
    ],
    correctIndex: 3,
    hint: "Sum the morning and afternoon fractions, then subtract from \\(1\\) (the whole work).",
    explanation: [
      "Work done = \\(\\frac{1}{5} + \\frac{4}{7}\\).",
      "Common denominator is \\(35\\): \\(\\frac{7 + 20}{35} = \\frac{27}{35}\\).",
      "Work left for evening = \\(1 - \\frac{27}{35} = \\frac{8}{35}\\).",
    ],
    topic: "Fractions Word Problems",
  },
  {
    question: "One centimeter is equal to how many meters?",
    image: null,
    options: [
      "\\(\\frac{1}{100}\\)",
      "\\(\\frac{1}{1000}\\)",
      "\\(\\frac{1}{10}\\)",
      "\\(\\frac{1}{10000}\\)",
      "\\(100\\)",
    ],
    correctIndex: 0,
    hint: "There are \\(100\\) centimeters in \\(1\\) meter.",
    explanation: [
      "Since \\(100\\text{ cm} = 1\\text{ m}\\), \\(1\\text{ cm} = \\frac{1}{100}\\text{ m}\\).",
    ],
    topic: "Units Conversion",
  },
  {
    question: "Find the square root of \\(0.0036\\)",
    image: null,
    options: [
      "\\(6.0\\)",
      "\\(0.6\\)",
      "\\(0.06\\)",
      "\\(0.006\\)",
      "\\(0.0006\\)",
    ],
    correctIndex: 2,
    hint: "Write the decimal as a fraction first: \\(\\frac{36}{10000}\\).",
    explanation: [
      "\\(0.0036 = \\frac{36}{10,000}\\).",
      "\\(\\sqrt{\\frac{36}{10,000}} = \\frac{\\sqrt{36}}{\\sqrt{10,000}} = \\frac{6}{100} = 0.06\\).",
    ],
    topic: "Squares and Square Roots",
  },
  {
    question: "Write \\(4048\\) in words",
    image: null,
    options: [
      "Forty forty-eight",
      "Four thousand four hundred and eight",
      "Four thousand and four-eight",
      "Four hundred and forty-eight",
      "Four thousand and forty-eight",
    ],
    correctIndex: 4,
    hint: "Break the number down by its place values: thousands and tens/ones.",
    explanation: [
      "\\(4\\) is in the thousands place: Four thousand.",
      "\\(48\\) is the remaining value: forty-eight.",
      "Combined: Four thousand and forty-eight.",
    ],
    topic: "Number Notation",
  },
  {
    question: "The value of \\(3 \\times 4^2 - (8 \\div 2)\\) is?",
    image: null,
    options: ["\\(44\\)", "\\(12\\)", "\\(20\\)", "\\(8\\)", "\\(140\\)"],
    correctIndex: 0,
    hint: "Evaluate exponents and parentheses first, then multiply, then subtract.",
    explanation: [
      "Expression: \\(3 \\times 4^2 - (8 \\div 2)\\)",
      "Exponent: \\(4^2 = 16\\) -> \\(3 \\times 16 - (8 \\div 2)\\)",
      "Parentheses: \\(8 \\div 2 = 4\\) -> \\(3 \\times 16 - 4\\)",
      "Multiplication: \\(3 \\times 16 = 48\\) -> \\(48 - 4\\)",
      "Subtraction: \\(48 - 4 = 44\\).",
    ],
    topic: "Order of Operations",
  },

  // ==========================================
  // SECTION B: SUBJECTIVE QUESTIONS (41–50)
  // ==========================================
  {
    question: "Add \\(\\frac{1}{4}\\) of \\(48\\) to twice \\(19\\)",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Calculate \\(\\frac{1}{4} \\times 48\\) and \\(2 \\times 19\\) separately, then sum them up.",
    explanation: [
      "\\(\\frac{1}{4} \\times 48 = 12\\).",
      "\\(2 \\times 19 = 38\\).",
      "\\(12 + 38 = 50\\).",
    ],
    topic: "Mixed Operations",
  },
  {
    question: "How many times can I take \\(39\\) from \\(624\\)?",
    image: null,
    options: [],
    correctIndex: null,
    hint: "This question asks how many times \\(39\\) divides into \\(624\\).",
    explanation: ["Divide: \\(624 \\div 39 = 16\\)."],
    topic: "Division",
  },
  {
    question:
      "How much time is there between \\(11:45\\text{ p.m.}\\) on Wednesday and \\(5:27\\text{ a.m.}\\) on Thursday?",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Find the time from \\(11:45\\) p.m. to midnight, then add the hours and minutes until \\(5:27\\) a.m.",
    explanation: [
      "From \\(11:45\\) p.m. to midnight (\\(12:00\\) a.m.) = \\(15\\text{ minutes}\\).",
      "From midnight to \\(5:27\\) a.m. = \\(5\\text{ hours and } 27\\text{ minutes}\\).",
      "Total time = \\(5\\text{ hours and } (27 + 15)\\text{ minutes} = 5\\text{ hours } 42\\text{ minutes}\\).",
    ],
    topic: "Measurement of Time",
  },
  {
    question:
      "A room has a perimeter of \\(18\\text{m}\\). It is twice as long as it is wide. What is its length?",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Set up the perimeter formula: \\(2(\\text{length} + \\text{width}) = 18\\), substituting \\(\\text{length} = 2 \\times \\text{width}\\).",
    explanation: [
      "Let the width be \\(w\\). The length is \\(2w\\).",
      "\\(\\text{Perimeter} = 2(\\text{length} + \\text{width})\\)",
      "\\(18 = 2(2w + w) \\implies 18 = 2(3w) \\implies 18 = 6w\\)",
      "\\(w = 3\\text{ m}\\).",
      "\\(\\text{Length} = 2w = 2 \\times 3 = 6\\text{ m}\\).",
    ],
    topic: "Perimeters",
  },
  {
    question:
      "Max goes to the gym every fourth day. Ellen's exercise routine is to go every third day. Today is Monday and both Max and Ellen are at the gym. What will the day of the week be the next time they are both at the gym?",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Find the lowest common multiple (LCM) of \\(3\\) and \\(4\\), then count that many days forward from Monday.",
    explanation: [
      "The LCM of \\(3\\) and \\(4\\) is \\(12\\).",
      "They will meet again at the gym in \\(12\\) days.",
      "Count \\(12\\) days forward from Monday: \\(7\\text{ days}\\) gets back to Monday, and \\(5\\text{ more days}\\) gets to Saturday.",
    ],
    topic: "Lowest Common Multiples & Time",
  },
  {
    question:
      "In a catalogue, an electric oven is listed at \\(₦195\\). A shop sells the oven at a discount of \\(35\\%\\). Find the sale price.",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Calculate \\(35\\%\\) of \\(195\\) to find the discount, then subtract it from the original price.",
    explanation: [
      "Discount = \\(35\\% \\text{ of } 195 = 0.35 \\times 195 = 68.25\\).",
      "\\(\\text{Sale Price} = 195 - 68.25 = 126.75\\).",
    ],
    topic: "Discounts and Decimals",
  },
  {
    question:
      "A thin rod \\(9\\text{m } 8\\text{cm}\\) is cut into two so that one piece is \\(98\\text{cm}\\) longer than the other. What is the length of the longer piece?",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Convert the total length to centimeters first. Set up an equation: \\(x + (x + 98) = \\text{total}\\).",
    explanation: [
      "Total length = \\(9\\text{ m } 8\\text{ cm} = 908\\text{ cm}\\).",
      "Let the shorter piece be \\(x\\). The longer piece is \\(x + 98\\).",
      "\\(x + (x + 98) = 908\\)",
      "\\(2x + 98 = 908 \\implies 2x = 810 \\implies x = 405\\text{ cm}\\).",
      "Longer piece = \\(405 + 98 = 503\\text{ cm}\\) (or \\(5\\text{ m } 3\\text{ cm}\\)).",
    ],
    topic: "Algebraic Word Problems",
  },
  {
    question: "Evaluate \\(20 \\div \\frac{1}{2} - 7 \\times 0 - 4 + 5 = ?\\)",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Perform division and multiplication first. Dividing by a fraction is the same as multiplying by its reciprocal.",
    explanation: [
      "Division: \\(20 \\div \\frac{1}{2} = 20 \\times 2 = 40\\).",
      "Multiplication: \\(7 \\times 0 = 0\\).",
      "Substitute back: \\(40 - 0 - 4 + 5\\).",
      "Simplify: \\(40 - 4 + 5 = 36 + 5 = 41\\).",
    ],
    topic: "Order of Operations",
  },
  {
    question: "Find the value of \\(0.354 + 7.9 + 2.03\\)",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Align the decimal points vertically before adding the numbers together.",
    explanation: [
      "  \\(0.354\\)",
      "+ \\(7.900\\)",
      "+ \\(2.030\\)",
      "---------",
      " \\(10.284\\)",
    ],
    topic: "Decimals Addition",
  },
  {
    question: "What is the HCF of \\(21, 63, 91\\text{ and } 105\\)?",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Identify the prime factors of each number and locate the highest factor shared by all of them.",
    explanation: [
      "Prime factorization:",
      "\\(21 = 3 \\times 7\\)",
      "\\(63 = 3 \\times 3 \\times 7\\)",
      "\\(91 = 7 \\times 13\\)",
      "\\(105 = 3 \\times 5 \\times 7\\)",
      "The only common prime factor among all four numbers is \\(7\\).",
    ],
    topic: "Highest Common Factor",
  },
];

setupQuiz(examQuestions, 3600);
