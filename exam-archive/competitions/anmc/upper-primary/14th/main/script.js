import setupQuiz from "../../../../question.js";

const quizData = [
  {
    question: "Which numeral has the digit \\(2\\) in the millions place?",
    type: "objective",
    options: [
      "\\(1,807,629\\)",
      "\\(82,531,044\\)",
      "\\(28,162,751\\)",
      "\\(8,629,794,312\\)",
      "\\(1,234,567,123\\)",
    ],
    correctIndex: 1,
    hint: "Identify the place value of each digit from right to left starting with units, tens, hundreds, thousands, ten-thousands, hundred-thousands, and then millions.",
    explanation: [
      "Let us examine the place value of each digit in the options:",
      "In \\(82,531,044\\), the digit \\(2\\) is located in the millions place (counting from the right: \\(4\\) units, \\(4\\) tens, \\(0\\) hundreds, \\(1\\) thousand, \\(3\\) ten-thousands, \\(5\\) hundred-thousands, \\(2\\) millions).",
    ],
    topic: "Place Value",
  },
  {
    question:
      "Which of the following shows the prime factorization of \\(120\\)?",
    type: "objective",
    options: [
      "\\(2 \\times 6 \\times 20\\)",
      "\\(2 \\times 3 \\times 20\\)",
      "\\(2 \\times 3 \\times 4 \\times 5\\)",
      "\\(2 \\times 2 \\times 3 \\times 5 \\times 5\\)",
      "None of the above",
    ],
    correctIndex: 4,
    hint: "Prime factorization means writing the number as a product of only prime numbers.",
    explanation: [
      "The prime factorization of \\(120\\) is \\(2 \\times 2 \\times 2 \\times 3 \\times 5 = 2^3 \\times 3 \\times 5\\).",
      "Let us evaluate the choices:",
      "- Option A contains composite numbers \\(6\\) and \\(20\\).",
      "- Option B contains the composite number \\(20\\).",
      "- Option C contains the composite number \\(4\\).",
      "- Option D evaluates to \\(2 \\times 2 \\times 3 \\times 5 \\times 5 = 300\\).",
      "Therefore, the correct prime factorization is not listed, making 'None of the above' the correct choice.",
    ],
    topic: "Number Theory (Prime Factorization)",
  },
  {
    question: "Which fraction is equivalent to \\(\\frac{3}{8}\\)?",
    type: "objective",
    options: [
      "\\(\\frac{8}{11}\\)",
      "\\(\\frac{9}{16}\\)",
      "\\(\\frac{9}{24}\\)",
      "\\(\\frac{5}{16}\\)",
      "None of the above",
    ],
    correctIndex: 2,
    hint: "To find an equivalent fraction, multiply or divide both the numerator and denominator by the same non-zero number.",
    explanation: [
      "We can multiply the numerator and the denominator of \\(\\frac{3}{8}\\) by \\(3\\):",
      "\\(\\frac{3 \\times 3}{8 \\times 3} = \\frac{9}{24}\\).",
    ],
    topic: "Fractions (Equivalent Fractions)",
  },
  {
    question:
      "Which list shows all the common factors of \\(24\\), \\(36\\) and \\(48\\)?",
    type: "objective",
    options: [
      "\\(1, 2, 3, 4, 6, 12\\)",
      "\\(2, 6, 12\\)",
      "\\(1, 2, 3\\)",
      "\\(1, 3, 4, 6, 8\\)",
      "None of the above",
    ],
    correctIndex: 0,
    hint: "List the factors for each number and identify those that are common to all three.",
    explanation: [
      "Factors of \\(24\\): \\(1, 2, 3, 4, 6, 8, 12, 24\\)",
      "Factors of \\(36\\): \\(1, 2, 3, 4, 6, 9, 12, 18, 36\\)",
      "Factors of \\(48\\): \\(1, 2, 3, 4, 6, 8, 12, 16, 24, 48\\)",
      "The common factors appearing in all lists are \\(1, 2, 3, 4, 6, 12\\).",
    ],
    topic: "Number Theory (Factors)",
  },
  {
    question: "Which fraction does the shaded part of the figure represent?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="100%" height="100%">
      <style>
        .shaded { fill: #94a3b8; stroke: #475569; stroke-width: 2; }
        .unshaded { fill: #ffffff; stroke: #475569; stroke-width: 2; }
      </style>
      <rect x="0" y="0" width="40" height="40" class="shaded" />
      <rect x="40" y="0" width="40" height="40" class="shaded" />
      <rect x="80" y="0" width="40" height="40" class="shaded" />
      <rect x="120" y="0" width="40" height="40" class="unshaded" />
      <rect x="160" y="0" width="40" height="40" class="unshaded" />
      <rect x="0" y="40" width="40" height="40" class="shaded" />
      <rect x="40" y="40" width="40" height="40" class="shaded" />
      <rect x="80" y="40" width="40" height="40" class="shaded" />
      <rect x="120" y="40" width="40" height="40" class="unshaded" />
      <rect x="160" y="40" width="40" height="40" class="unshaded" />
      <rect x="0" y="80" width="40" height="40" class="shaded" />
      <rect x="40" y="80" width="40" height="40" class="shaded" />
      <rect x="80" y="80" width="40" height="40" class="shaded" />
      <rect x="120" y="80" width="40" height="40" class="unshaded" />
      <rect x="160" y="80" width="40" height="40" class="unshaded" />
      <rect x="0" y="120" width="40" height="40" class="shaded" />
      <rect x="40" y="120" width="40" height="40" class="shaded" />
      <rect x="80" y="120" width="40" height="40" class="shaded" />
      <rect x="120" y="120" width="40" height="40" class="unshaded" />
      <rect x="160" y="120" width="40" height="40" class="unshaded" />
    </svg>`,
    options: [
      "\\(\\frac{8}{22}\\)",
      "\\(\\frac{2}{5}\\)",
      "\\(\\frac{3}{5}\\)",
      "\\(\\frac{12}{20}\\)",
      "None of the above",
    ],
    correctIndex: 3,
    hint: "Count the total number of small squares in the grid to find the denominator, and the number of shaded squares to find the numerator.",
    explanation: [
      "The grid contains a total of \\(20\\) small squares (\\(5\\) columns by \\(4\\) rows).",
      "There are \\(12\\) shaded squares.",
      "The fraction of the shaded part is \\(\\frac{12}{20}\\).",
      "Note: This simplifies to \\(\\frac{3}{5}\\), but since both options \\(C\\) and \\(D\\) represent the same value, the direct representation of the grid divisions is \\(\\frac{12}{20}\\).",
    ],
    topic: "Fractions (Visual Representation)",
  },
  {
    question: "Which of these is a prime number?",
    type: "objective",
    options: ["\\(49\\)", "\\(59\\)", "\\(63\\)", "\\(91\\)", "\\(57\\)"],
    correctIndex: 1,
    hint: "A prime number has exactly two positive divisors: \\(1\\) and itself.",
    explanation: [
      "Let us test each number:",
      "- \\(49 = 7 \\times 7\\) (composite)",
      "- \\(59\\) is only divisible by \\(1\\) and \\(59\\) (prime)",
      "- \\(63 = 3 \\times 21\\) (composite)",
      "- \\(91 = 7 \\times 13\\) (composite)",
      "- \\(57 = 3 \\times 19\\) (composite)",
    ],
    topic: "Number Theory (Prime Numbers)",
  },
  {
    question:
      "Royce has a bag with \\(8\\) red marbles, \\(4\\) blue marbles, \\(5\\) green marbles, and \\(9\\) yellow marbles all the same sizIf he pulls out \\(1\\) marble without looking, which color is he most likely to choose?",
    type: "objective",
    options: ["red", "blue", "green", "yellow", "none of the above"],
    correctIndex: 3,
    hint: "The marble with the highest quantity is the most likely to be selected.",
    explanation: [
      "Let us compare the number of marbles of each color:",
      "- Red: \\(8\\)",
      "- Blue: \\(4\\)",
      "- Green: \\(5\\)",
      "- Yellow: \\(9\\)",
      "Since \\(9\\) is the largest quantity, yellow is the most likely to be chosen.",
    ],
    topic: "Probability",
  },
  {
    question:
      "Jonathan reads every day during the week and keeps track of his timHe created this graph to show how much time he read last week. How many hours did Jonathan read on Tuesday and Wednesday?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 300" width="100%" height="100%">
      <style>
        .axis { stroke: #000; stroke-width: 2; fill: none; }
        .grid { stroke: #cbd5e1; stroke-width: 1; stroke-dasharray: 4; }
        .label { font-family: sans-serif; font-size: 12px; fill: #1e293b; text-anchor: middle; }
        .title { font-family: sans-serif; font-size: 14px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
        .bar { stroke: #1e1b4b; stroke-width: 1.5; }
        .bar-mon { fill: #94a3b8; }
        .bar-tue { fill: #cbd5e1; }
        .bar-wed { fill: #f1f5f9; stroke: #475569; }
        .bar-thu { fill: #94a3b8; }
        .bar-fri { fill: #cbd5e1; }
      </style>
      <text x="225" y="25" class="title">Jonathan's Reading Time</text>
      <line x1="50" y1="50" x2="420" y2="50" class="grid" />
      <line x1="50" y1="90" x2="420" y2="90" class="grid" />
      <line x1="50" y1="130" x2="420" y2="130" class="grid" />
      <line x1="50" y1="170" x2="420" y2="170" class="grid" />
      <line x1="50" y1="210" x2="420" y2="210" class="grid" />
      <path d="M 50 40 L 50 250 L 420 250" class="axis" />
      <text x="35" y="254" class="label">0</text>
      <text x="35" y="214" class="label">1</text>
      <text x="35" y="174" class="label">2</text>
      <text x="35" y="134" class="label">3</text>
      <text x="35" y="94" class="label">4</text>
      <text x="35" y="54" class="label">5</text>
      <rect x="80" y="90" width="40" height="160" class="bar bar-mon" />
      <rect x="150" y="130" width="40" height="120" class="bar bar-tue" />
      <rect x="220" y="210" width="40" height="40" class="bar bar-wed" />
      <rect x="290" y="90" width="40" height="160" class="bar bar-thu" />
      <rect x="360" y="170" width="40" height="80" class="bar bar-fri" />
      <text x="100" y="270" class="label">Monday</text>
      <text x="170" y="270" class="label">Tuesday</text>
      <text x="240" y="270" class="label">Wednesday</text>
      <text x="310" y="270" class="label">Thursday</text>
      <text x="380" y="270" class="label">Friday</text>
    </svg>`,
    options: ["\\(3\\)", "\\(4\\)", "\\(5\\)", "\\(7\\)", "\\(8\\)"],
    correctIndex: 1,
    hint: "Look at the height of the bars for Tuesday and Wednesday and sum their values.",
    explanation: [
      "Based on the bar graph:",
      "- Tuesday's reading time: \\(3\\) hours",
      "- Wednesday's reading time: \\(1\\) hour",
      "Total reading time for both days: \\(3 + 1 = 4\\) hours.",
    ],
    topic: "Data Interpretation (Bar Graphs)",
  },
  {
    question:
      "The graph shows the average temperature in Alaska and Maine from January to July. How much warmer is the average temperature in Portland than in Anchorage in July?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 320" width="100%" height="100%">
      <style>
        .axis { stroke: #000; stroke-width: 2; fill: none; }
        .grid { stroke: #e2e8f0; stroke-width: 1; }
        .label { font-family: sans-serif; font-size: 11px; fill: #334155; text-anchor: middle; }
        .title { font-family: sans-serif; font-size: 13px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
        .bar-alaska { fill: #cbd5e1; stroke: #475569; stroke-width: 1; }
        .bar-maine { fill: #475569; stroke: #1e293b; stroke-width: 1; }
        .legend-text { font-family: sans-serif; font-size: 11px; fill: #0f172a; }
      </style>
      <text x="225" y="20" class="title">Average Temperature (°F)</text>
      <line x1="50" y1="60" x2="420" y2="60" class="grid" />
      <line x1="50" y1="100" x2="420" y2="100" class="grid" />
      <line x1="50" y1="140" x2="420" y2="140" class="grid" />
      <line x1="50" y1="180" x2="420" y2="180" class="grid" />
      <line x1="50" y1="220" x2="420" y2="220" class="grid" />
      <path d="M 50 40 L 50 260 L 420 260" class="axis" />
      <text x="35" y="264" class="label">0</text>
      <text x="35" y="224" class="label">10</text>
      <text x="35" y="184" class="label">20</text>
      <text x="35" y="144" class="label">30</text>
      <text x="35" y="104" class="label">40</text>
      <text x="35" y="64" class="label">50</text>
      <!-- July bars -->
      <rect x="350" y="60" width="18" height="200" class="bar-alaska" />
      <rect x="368" y="28" width="18" height="232" class="bar-maine" />
      <text x="368" y="280" class="label">JUL</text>
      <text x="80" y="280" class="label">JAN</text>
      <text x="130" y="280" class="label">FEB</text>
      <text x="180" y="280" class="label">MAR</text>
      <text x="230" y="280" class="label">APR</text>
      <text x="280" y="280" class="label">MAY</text>
      <text x="325" y="280" class="label">JUN</text>
      <!-- Legend -->
      <rect x="100" y="295" width="15" height="12" class="bar-alaska" />
      <text x="120" y="305" class="legend-text">Anchorage, Alaska</text>
      <rect x="240" y="295" width="15" height="12" class="bar-maine" />
      <text x="260" y="305" class="legend-text">Portland, Maine</text>
    </svg>`,
    options: [
      "\\(4^\\circ\\)",
      "\\(5^\\circ\\)",
      "\\(8^\\circ\\)",
      "\\(10^\\circ\\)",
      "\\(70^\\circ\\)",
    ],
    correctIndex: 2,
    hint: "Compare the temperatures of Anchorage (Alaskand Portland (Mainin the month of July.",
    explanation: [
      "From the graph, in the month of July:",
      "- Average temperature in Portland, Maine (dark bar): \\(68^\\circ\\)F",
      "- Average temperature in Anchorage, Alaska (light bar): \\(60^\\circ\\)F",
      "The difference in temperature is \\(68^\\circ - 60^\\circ = 8^\\circ\\)F.",
    ],
    topic: "Data Interpretation (Double Bar Graphs)",
  },
  {
    question:
      "There are four children in the Smith family. Only one of the children is older than PetSarah is younger than BraKevin is older than BraWhich lists the children in order from oldest to youngest?",
    type: "objective",
    options: [
      "Brad, Pete, Kevin, Sarah",
      "Sarah, Brad, Pete, Kevin",
      "Pete, Sarah, Brad, Kevin",
      "Kevin, Pete, Brad, Sarah",
      "None of the above",
    ],
    correctIndex: 3,
    hint: "Establish the relative age relationships between the children step by step.",
    explanation: [
      "Let us organize the relationships:",
      "1. 'Only one of the children is older than Pete' means Pete is the second oldest child.",
      "2. 'Sarah is younger than Brad' means: Brad > Sarah.",
      "3. 'Kevin is older than Brad' means: Kevin > Brad.",
      "Since only one child is older than Pete, that child must be Kevin. Therefore, the order from oldest to youngest is: Kevin, Pete, Brad, Sarah.",
    ],
    topic: "Logical Reasoning (Ordering)",
  },
  {
    question:
      "Three adults and \\(12\\) boys are going on a camping trip. They need to buy one sleeping bag for each camper. Each sleeping bag costs \\(\\$45\\). Which number sentence can be used to find the total cost of the sleeping bags?",
    type: "objective",
    options: [
      "\\(45 \\times (3 + 12) = \\square\\)",
      "\\(45 + (3 + 12) = \\square\\)",
      "\\(45 \\div (3 + 12) = \\square\\)",
      "\\(45 - (3 + 12) = \\square\\)",
      "None of the above",
    ],
    correctIndex: 0,
    hint: "Find the total number of campers first, and then multiply by the cost per sleeping bag.",
    explanation: [
      "The total number of campers is the sum of the adults and the boys: \\(3 + 12\\).",
      "To find the total cost, we multiply the cost of one sleeping bag, \\(\\$45\\), by the total number of campers:",
      "\\(45 \\times (3 + 12) = \\square\\).",
    ],
    topic: "Word Problems (Formulating Expressions)",
  },
  {
    question:
      "\\(40\\), \\(8\\), \\(16\\), \\(24\\), \\(36\\), \\(48\\). Look at the group of numbers abovWhich expression describes the numbers in this group?",
    type: "objective",
    options: [
      "Multiples of \\(8\\)",
      "Factors of \\(24\\)",
      "Numbers that are divisible by \\(6\\)",
      "Multiples of \\(6\\)",
      "None of the above",
    ],
    correctIndex: 4,
    hint: "Check whether all numbers in the set satisfy any of the statements.",
    explanation: [
      "Let us evaluate the options against the set \\(\\{40, 8, 16, 24, 36, 48\\}\\):",
      "- A: Not all are multiples of \\(8\\) (e.g., \\(36\\) is not).",
      "- B: Not all are factors of \\(24\\) (e.g., \\(40, 36, 48\\) are not).",
      "- C: Not all are divisible by \\(6\\) (e.g., \\(40, 8, 16\\) are not).",
      "- D: Not all are multiples of \\(6\\) (same as above).",
      "Since none of the statements describe all elements of the group, the correct option is 'None of the above'.",
    ],
    topic: "Number Properties",
  },
  {
    question:
      "The fifth-grade students collected donations for improvements to a local park. They collected donations at the mall one morning for \\(2\\) hours. Then they took a \\(30\\)-minute lunch break. After lunch they collected donations for \\(1\\) hour \\(35\\) minutes. They left the mall at \\(2:00\\) P.M. At what time did the students arrive at the mall?",
    type: "objective",
    options: [
      "\\(12:25\\) P.M.",
      "\\(11:55\\) A.M.",
      "\\(9:55\\) A.M.",
      "\\(4:55\\) P.M.",
      "None of the above",
    ],
    correctIndex: 2,
    hint: "Add up all the time intervals spent at the mall, and then count backward from \\(2:00\\) P.M.",
    explanation: [
      "Let us calculate the total elapsed time:",
      "- Morning donation session: \\(2\\) hours \\(00\\) minutes",
      "- Lunch break: \\(30\\) minutes",
      "- Afternoon donation session: \\(1\\) hour \\(35\\) minutes",
      "Total time = \\(2\\text{ hours} + 30\\text{ minutes} + 1\\text{ hour } 35\\text{ minutes} = 3\\text{ hours } 65\\text{ minutes} = 4\\text{ hours } 5\\text{ minutes}\\).",
      "Subtracting \\(4\\text{ hours } 5\\text{ minutes}\\) backward from \\(2:00\\) P.M.:",
      "- Subtracting \\(4\\text{ hours}\\) from \\(2:00\\) P.M. gives \\(10:00\\) A.M.",
      "- Subtracting \\(5\\text{ minutes}\\) from \\(10:00\\) A.M. gives \\(9:55\\) A.M.",
    ],
    topic: "Measurement (Time Calculations)",
  },
  {
    question:
      "The table shows the flight times from San Francisco (S.F.) to New York (N.Y.). Which flight takes the longest?",
    type: "objective",
    options: [
      "The flight leaving at \\(8:30\\) A.M.",
      "The flight leaving at \\(12:00\\) noon",
      "The flight leaving at \\(3:30\\) P.M.",
      "The flight leaving at \\(9:45\\) P.M.",
      "None of the above",
    ],
    correctIndex: 1,
    hint: "Determine the elapsed duration of each flight listed in the table.",
    explanation: [
      "Let us calculate the duration for each flight option:",
      "- Flight A (\\(8:30\\) A.M. to \\(4:50\\) P.M.): \\(8\\) hours and \\(20\\) minutes",
      "- Flight B (\\(12:00\\) noon to \\(8:25\\) P.M.): \\(8\\) hours and \\(25\\) minutes",
      "- Flight C (\\(3:30\\) P.M. to \\(11:40\\) P.M.): \\(8\\) hours and \\(10\\) minutes",
      "- Flight D (\\(9:45\\) P.M. to \\(5:50\\) A.M.): \\(8\\) hours and \\(5\\) minutes",
      "Comparing these durations, the flight leaving at \\(12:00\\) noon is the longest at \\(8\\) hours and \\(25\\) minutes.",
    ],
    topic: "Measurement (Time Calculations)",
  },
  {
    question:
      "Aileen broke a candy bar into four unequal pieces before she ate it. Each piece is a fraction of the whole candy bar. Which fraction represents the smallest piece?",
    type: "objective",
    options: [
      "\\(\\frac{1}{3}\\)",
      "\\(\\frac{5}{12}\\)",
      "\\(\\frac{1}{5}\\)",
      "\\(\\frac{1}{12}\\)",
      "\\(\\frac{2}{5}\\)",
    ],
    correctIndex: 3,
    hint: "Convert the fractions to a common denominator to easily compare their relative sizes.",
    explanation: [
      "Let us find a common denominator for the denominators \\(3\\), \\(12\\), \\(5\\), which is \\(60\\):",
      "- \\(\\frac{1}{3} = \\frac{20}{60}\\)",
      "- \\(\\frac{5}{12} = \\frac{25}{60}\\)",
      "- \\(\\frac{1}{5} = \\frac{12}{60}\\)",
      "- \\(\\frac{1}{12} = \\frac{5}{60}\\)",
      "- \\(\\frac{2}{5} = \\frac{24}{60}\\)",
      "Comparing the numerators, \\(5\\) is the smallest. Therefore, \\(\\frac{1}{12}\\) represents the smallest piece.",
    ],
    topic: "Fractions (Comparing Fractions)",
  },
  {
    question:
      "Nodin wants to know what time it is. He looked at the clock on the kitchen wall. What time is it?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      <style>
        .clock-face { fill: #f8fafc; stroke: #0f172a; stroke-width: 4; }
        .hand-hour { stroke: #0f172a; stroke-width: 5; stroke-linecap: round; }
        .hand-minute { stroke: #475569; stroke-width: 3; stroke-linecap: round; }
        .center-dot { fill: #0f172a; }
        .text-num { font-family: sans-serif; font-size: 14px; font-weight: bold; fill: #1e293b; text-anchor: middle; }
      </style>
      <circle cx="100" cy="100" r="90" class="clock-face" />
      <text x="100" y="32" class="text-num">12</text>
      <text x="170" y="105" class="text-num">3</text>
      <text x="100" y="178" class="text-num">6</text>
      <text x="30" y="105" class="text-num">9</text>
      <line x1="100" y1="100" x2="145" y2="92" class="hand-hour" />
      <line x1="100" y1="100" x2="65" y2="40" class="hand-minute" />
      <circle cx="100" cy="100" r="6" class="center-dot" />
    </svg>`,
    options: [
      "\\(11:15\\)",
      "\\(3:55\\)",
      "\\(2:11\\)",
      "\\(2:55\\)",
      "\\(11:03\\)",
    ],
    correctIndex: 3,
    hint: "Observe the position of the hour and minute hands carefully.",
    explanation: [
      "The short hour hand is located between \\(2\\) and \\(3\\), and the long minute hand points directly to the \\(11\\) mark, which represents \\(55\\) minutes.",
      "Thus, the correct time shown on the clock is \\(2:55\\).",
    ],
    topic: "Measurement (Reading Clocks)",
  },
  {
    question:
      "Which of the following is closest to the weight of a football player?",
    type: "objective",
    options: [
      "\\(1,000\\text{ kg}\\)",
      "\\(1\\text{ g}\\)",
      "\\(90\\text{ kg}\\)",
      "\\(1\\text{ kg}\\)",
      "\\(500\\text{ kg}\\)",
    ],
    correctIndex: 2,
    hint: "...standard estimation of human mass.",
    explanation: [
      "An average adult football player weighs around \\(90\\text{ kg}\\).",
    ],
    topic: "Measurement (Mass Estimation)",
  },
  {
    question:
      "Paige had three blocks labeled \\(X\\), \\(Y\\), and \\(Z\\). She placed them in pairs in a balance to see which one was heavier. What is the order of the blocks, from heaviest to lightest?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="100%" height="100%">
      <style>
        .beam { stroke: #334155; stroke-width: 3; }
        .pillar { stroke: #0f172a; stroke-width: 4; }
        .pan { fill: #f1f5f9; stroke: #334155; stroke-width: 1.5; }
        .string { stroke: #475569; stroke-width: 1; }
        .block { fill: #cbd5e1; stroke: #0f172a; stroke-width: 2; }
        .label { font-family: sans-serif; font-size: 11px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
      </style>
      <!-- Scale 1: Y is heavier (right is lower) -->
      <g transform="translate(10, 10)">
        <line x1="50" y1="80" x2="50" y2="110" class="pillar" />
        <line x1="20" y1="75" x2="80" y2="85" class="beam" />
        <!-- Left Pan -->
        <line x1="20" y1="75" x2="10" y2="95" class="string" />
        <line x1="20" y1="75" x2="30" y2="95" class="string" />
        <rect x="5" y="95" width="30" height="4" class="pan" />
        <rect x="12" y="80" width="16" height="15" class="block" />
        <text x="20" y="92" class="label">X</text>
        <!-- Right Pan -->
        <line x1="80" y1="85" x2="70" y2="105" class="string" />
        <line x1="80" y1="85" x2="90" y2="105" class="string" />
        <rect x="65" y="105" width="30" height="4" class="pan" />
        <rect x="72" y="90" width="16" height="15" class="block" />
        <text x="80" y="102" class="label">Y</text>
      </g>
      <!-- Scale 2: X is heavier (left is lower) -->
      <g transform="translate(110, 10)">
        <line x1="50" y1="80" x2="50" y2="110" class="pillar" />
        <line x1="20" y1="85" x2="80" y2="75" class="beam" />
        <!-- Left Pan -->
        <line x1="20" y1="85" x2="10" y2="105" class="string" />
        <line x1="20" y1="85" x2="30" y2="105" class="string" />
        <rect x="5" y="105" width="30" height="4" class="pan" />
        <rect x="12" y="90" width="16" height="15" class="block" />
        <text x="20" y="102" class="label">X</text>
        <!-- Right Pan -->
        <line x1="80" y1="75" x2="70" y2="95" class="string" />
        <line x1="80" y1="75" x2="90" y2="95" class="string" />
        <rect x="65" y="95" width="30" height="4" class="pan" />
        <rect x="72" y="80" width="16" height="15" class="block" />
        <text x="80" y="92" class="label">Z</text>
      </g>
      <!-- Scale 3: Y is heavier (left is lower) -->
      <g transform="translate(210, 10)">
        <line x1="50" y1="80" x2="50" y2="110" class="pillar" />
        <line x1="20" y1="85" x2="80" y2="75" class="beam" />
        <!-- Left Pan -->
        <line x1="20" y1="85" x2="10" y2="105" class="string" />
        <line x1="20" y1="85" x2="30" y2="105" class="string" />
        <rect x="5" y="105" width="30" height="4" class="pan" />
        <rect x="12" y="90" width="16" height="15" class="block" />
        <text x="20" y="102" class="label">Y</text>
        <!-- Right Pan -->
        <line x1="80" y1="75" x2="70" y2="95" class="string" />
        <line x1="80" y1="75" x2="90" y2="95" class="string" />
        <rect x="65" y="95" width="30" height="4" class="pan" />
        <rect x="72" y="80" width="16" height="15" class="block" />
        <text x="80" y="92" class="label">Z</text>
      </g>
    </svg>`,
    options: [
      "\\(Z, X, Y\\)",
      "\\(X, Y, Z\\)",
      "\\(Y, Z, X\\)",
      "\\(Y, X, Z\\)",
      "\\(X = Y = Z\\)",
    ],
    correctIndex: 3,
    hint: "Observe the balance scales: the side that sits lower contains the heavier block.",
    explanation: [
      "From Scale 1: \\(Y > X\\). From Scale 2: \\(X > Z\\). Thus, \\(Y > X > Z\\).",
    ],
    topic: "Logical Reasoning (Balances)",
  },
  {
    question:
      "In a bowl of jelly beans, \\(\\frac{8}{17}\\) of them are reThe beans are counted, and there are \\(16\\text{ red ones}\\). How many jelly beans are in the bowl?",
    type: "objective",
    options: ["\\(36\\)", "\\(40\\)", "\\(34\\)", "\\(33\\)", "\\(32\\)"],
    correctIndex: 2,
    hint: "Set up an equation where \\(\\frac{8}{17}\\) of the total quantity \\(T\\) is equal to \\(16\\).",
    explanation: [
      "\\(\\frac{8}{17} \\times T = 16 \\implies T = 16 \\times \\frac{17}{8} = 34\\).",
    ],
    topic: "Fractions (Word Problems)",
  },
  {
    question: "Find two equivalent fractions for \\(\\frac{6}{14}\\).",
    type: "objective",
    options: [
      "\\(\\frac{3}{7}\\) and \\(\\frac{12}{28}\\)",
      "\\(\\frac{7}{3}\\) and \\(\\frac{28}{12}\\)",
      "\\(\\frac{2}{7}\\) and \\(\\frac{18}{28}\\)",
      "\\(\\frac{24}{56}\\) and \\(\\frac{7}{3}\\)",
      "\\(\\frac{18}{42}\\) and \\(\\frac{7}{3}\\)",
    ],
    correctIndex: 0,
    hint: "Simplify \\(\\frac{6}{14}\\) by dividing by \\(2\\), and multiply both sides by \\(2\\) for another equivalent fraction.",
    explanation: ["\\(\\frac{6}{14} = \\frac{3}{7} = \\frac{12}{28}\\)."],
    topic: "Fractions (Equivalent Fractions)",
  },
  {
    question: "Write \\(7 + 0.1 + 0.07 + 0.007\\) in standard form.",
    type: "objective",
    options: [
      "\\(70.177\\)",
      "\\(7.0177\\)",
      "\\(7.1707\\)",
      "\\(7.177\\)",
      "\\(7.717\\)",
    ],
    correctIndex: 3,
    hint: "Add decimals aligning the decimal point.",
    explanation: ["\\(7 + 0.1 + 0.07 + 0.007 = 7.177\\)."],
    topic: "Decimals (Addition)",
  },
  {
    question:
      "ABC Shoes is in competition with High Low Shoes. Both stores sell the High Runner brand of shoes. ABC Shoes sells the shoes for \\(\\$56.50\\), but High Low Shoes sells them for \\(\\$25.30\\). If ABC Shoes decides to offer a \\(10\\%\\) discount, estimate what the new price will be and identify which store will have the better price.",
    type: "objective",
    options: [
      "New price = \\(\\$49.50\\); High Low Shoes will have the better price.",
      "New price = \\(\\$22.50\\); High Low Shoes will have the better price.",
      "New price = \\(\\$49.50\\); ABC Shoes will have the better price.",
      "New price = \\(\\$5.50\\); ABC Shoes will have the better price.",
      "None of the above",
    ],
    correctIndex: 0,
    hint: "Estimate \\(\\$56.50\\) as \\(\\$55.00\\). A \\(10\\%\\) discount is \\(\\$5.50\\).",
    explanation: [
      "\\(\\$55.00 - \\$5.50 = \\$49.50\\). This is still more than \\(\\$25.30\\).",
    ],
    topic: "Arithmetic (Estimation and Percents)",
  },
  {
    question:
      "What is the mode of the quiz scores shown in the table?\nScores: \\(85, 75, 85, 85, 80, 80, 85, 75, 80, 90\\)",
    type: "objective",
    options: ["\\(75\\)", "\\(80\\)", "\\(85\\)", "\\(90\\)", "\\(95\\)"],
    correctIndex: 2,
    hint: "The mode is the value that occurs most frequently.",
    explanation: [
      "\\(85\\) occurs \\(4\\) times, which is more frequent than any other value.",
    ],
    topic: "Statistics (Mode)",
  },
  {
    question: "Evaluate: \\(2005 \\times 100 + 2005 = \\square\\)",
    type: "objective",
    options: [
      "\\(2005002005\\)",
      "\\(20052005\\)",
      "\\(20072005\\)",
      "\\(202505\\)",
      "\\(22055\\)",
    ],
    correctIndex: 3,
    hint: "Multiply first, then add.",
    explanation: ["\\(200500 + 2005 = 202505\\)."],
    topic: "Arithmetic",
  },
  {
    question:
      "An ant is walking from point \\(A\\) to point \\(B\\) on a cube along the indicated path. The edge of the cube is \\(12\\text{ cm}\\) long. How far does the ant need to travel?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="100%" height="100%">
      <style>
        .cube-face { fill: none; stroke: #475569; stroke-width: 2; }
        .path-arrow { stroke: #ef4444; stroke-width: 3; fill: none; stroke-linejoin: round; stroke-linecap: round; }
        .dot { fill: #ef4444; }
        .label { font-family: sans-serif; font-size: 14px; font-weight: bold; fill: #0f172a; }
      </style>
      <rect x="70" y="30" width="100" height="100" class="cube-face" />
      <rect x="40" y="70" width="100" height="100" class="cube-face" />
      <line x1="70" y1="30" x2="40" y2="70" class="cube-face" />
      <line x1="170" y1="30" x2="140" y2="70" class="cube-face" />
      <line x1="70" y1="130" x2="40" y2="170" class="cube-face" />
      <line x1="170" y1="130" x2="140" y2="170" class="cube-face" />
      <path d="M 40 70 L 40 170 L 140 170 L 170 130" class="path-arrow" />
      <circle cx="40" cy="70" r="4" class="dot" />
      <circle cx="170" cy="130" r="4" class="dot" />
      <text x="25" y="70" class="label">A</text>
      <text x="180" y="135" class="label">B</text>
    </svg>`,
    options: [
      "\\(40\\text{ cm}\\)",
      "\\(48\\text{ cm}\\)",
      "\\(50\\text{ cm}\\)",
      "\\(60\\text{ cm}\\)",
      "\\(36\\text{ cm}\\)",
    ],
    correctIndex: 4,
    hint: "Count how many complete edges of the cube the ant walks along.",
    explanation: [
      "The ant traverses exactly \\(3\\) edges of \\(12\\text{ cm}\\) each: \\(3 \\times 12\\text{ cm} = 36\\text{ cm}\\).",
    ],
    topic: "Geometry (3D Geometry)",
  },
  {
    question:
      "On a shelf, there are \\(24\\text{ balls}\\) in three colors: white, red and brown. \\(\\frac{1}{8}\\) of them are white, and \\(\\frac{2}{3}\\) of the rest of the balls are reHow many of them are brown?",
    type: "objective",
    options: ["\\(4\\)", "\\(5\\)", "\\(6\\)", "\\(7\\)", "\\(8\\)"],
    correctIndex: 3,
    hint: "Find white first (\\(\\frac{1}{8} \\times 24\\)), then find the rest and calculate red.",
    explanation: [
      "White = \\(3\\). Rest = \\(21\\). Red = \\(\\frac{2}{3} \\times 21 = 14\\). Brown = \\(21 - 14 = 7\\).",
    ],
    topic: "Fractions",
  },
  {
    question:
      "Tom picked a natural number and multiplied it by \\(3\\). Which number CANNOT be the result of this multiplication?",
    type: "objective",
    options: ["\\(987\\)", "\\(444\\)", "\\(204\\)", "\\(105\\)", "\\(103\\)"],
    correctIndex: 4,
    hint: "A multiple of \\(3\\) must be divisible by \\(3\\). Check the sum of digits.",
    explanation: ["\\(1 + 0 + 3 = 4\\), which is not divisible by \\(3\\)."],
    topic: "Number Theory",
  },
  {
    question:
      "How many two digit numbers are there, which can be expressed only by using different odd digits?",
    type: "objective",
    options: ["\\(15\\)", "\\(20\\)", "\\(25\\)", "\\(30\\)", "\\(50\\)"],
    correctIndex: 1,
    hint: "Use odd digits \\(\\{1, 3, 5, 7, 9\\}\\) without repetition.",
    explanation: ["\\(5 \\times 4 = 20\\) numbers."],
    topic: "Combinatorics",
  },
  {
    question: "The number of all divisors of \\(100\\) is equal to:",
    type: "objective",
    options: ["\\(3\\)", "\\(6\\)", "\\(7\\)", "\\(8\\)", "\\(9\\)"],
    correctIndex: 4,
    hint: "Prime factorize \\(100 = 2^2 \\times 5^2\\).",
    explanation: ["Divisors formula: \\((2+1)(2+1) = 9\\)."],
    topic: "Number Theory",
  },
  {
    question:
      "Find the value of the expression:\n\\(\\frac{2003 + 2003 + 2003 + 2003 + 2003}{2003 + 2003}\\)",
    type: "objective",
    options: ["\\(2003\\)", "\\(3\\)", "\\(1/3\\)", "\\(2.5\\)", "\\(6009\\)"],
    correctIndex: 3,
    hint: "Factor out \\(2003\\) from both the numerator and denominator.",
    explanation: ["\\(\\frac{5 \\times 2003}{2 \\times 2003} = 2.5\\)."],
    topic: "Algebra",
  },
  {
    question:
      "There are five containers in a treasure chest, in each container there are three boxes and in each box there are \\(10\\text{ golden coins}\\). The treasure chest, the containers, and the boxes are all lockeHow many locks do you need to open to get \\(50\\text{ coins}\\)?",
    type: "objective",
    options: ["\\(5\\)", "\\(7\\)", "\\(9\\)", "\\(6\\)", "\\(8\\)"],
    correctIndex: 4,
    hint: "Open \\(1\\) chest lock, \\(2\\) container locks, and \\(5\\) box locks.",
    explanation: ["\\(1 + 2 + 5 = 8\\) locks."],
    topic: "Logical Reasoning",
  },
  {
    question: "Which of these inequalities is true?",
    type: "objective",
    options: [
      "\\(0.4 > 0.04\\)",
      "\\(0.004 > 0.4\\)",
      "\\(0.04 < 0.004\\)",
      "\\(0.4 < 0.004\\)",
      "None of the above",
    ],
    correctIndex: 0,
    hint: "Compare the values of the tenths place.",
    explanation: ["\\(0.4 > 0.04\\) is correct."],
    topic: "Decimals",
  },
  {
    question:
      "What is the remainder when you divide \\(20042003\\) by \\(2004\\)?",
    type: "objective",
    options: ["\\(0\\)", "\\(1\\)", "\\(2\\)", "\\(3\\)", "\\(2003\\)"],
    correctIndex: 4,
    hint: "Write \\(20042003 = 20040000 + 2003\\).",
    explanation: ["The remainder is \\(2003\\)."],
    topic: "Number Theory",
  },
  {
    question:
      "The weight of \\(3\\text{ apples}\\) and \\(2\\text{ oranges}\\) is \\(255\\text{ g}\\). The weight of \\(2\\text{ apples}\\) and \\(3\\text{ oranges}\\) is \\(285\\text{ g}\\). Each apple weighs the same and each orange weighs the samWhat is the combined weight of \\(1\\text{ apple}\\) and \\(1\\text{ orange}\\)?",
    type: "objective",
    options: [
      "\\(110\\text{ g}\\)",
      "\\(108\\text{ g}\\)",
      "\\(105\\text{ g}\\)",
      "\\(104\\text{ g}\\)",
      "\\(102\\text{ g}\\)",
    ],
    correctIndex: 1,
    hint: "Add the two equations: \\(5\\text{ apples} + 5\\text{ oranges} = 540\\text{ g}\\).",
    explanation: ["Divide the combined sum by \\(5\\): \\(108\\text{ g}\\)."],
    topic: "Algebra",
  },
  {
    question:
      "We subtracted the smallest three-digit number with all different digits from the greatest three-digit number with all different digits. The result was:",
    type: "objective",
    options: ["\\(864\\)", "\\(885\\)", "\\(800\\)", "\\(899\\)", "\\(867\\)"],
    correctIndex: 1,
    hint: "Subtract \\(102\\) from \\(987\\).",
    explanation: ["\\(987 - 102 = 885\\)."],
    topic: "Number Properties",
  },
  {
    question:
      "A square with the length of side equal to \\(x\\) consists of a square with an area of \\(81\\text{ cm}^2\\), two rectangles with areas of \\(18\\text{ cm}^2\\) each, and a small squarWhat is the value of \\(x\\)?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" width="100%" height="100%">
      <style>
        .fill-sq1 { fill: #f1f5f9; stroke: #0f172a; stroke-width: 2; }
        .fill-rect { fill: #e2e8f0; stroke: #0f172a; stroke-width: 2; }
        .text-area { font-family: sans-serif; font-size: 14px; font-weight: bold; fill: #1e293b; text-anchor: middle; }
        .dimension-label { font-family: sans-serif; font-size: 14px; font-style: italic; fill: #0f172a; }
      </style>
      <g transform="translate(10, 15)">
        <rect x="0" y="0" width="150" height="150" class="fill-sq1" />
        <text x="75" y="80" class="text-area">81 cm²</text>
        <rect x="150" y="0" width="33" height="150" class="fill-rect" />
        <text x="166" y="80" transform="rotate(-90 166 80)" class="text-area">18 cm²</text>
        <rect x="0" y="150" width="150" height="33" class="fill-rect" />
        <text x="75" y="170" class="text-area">18 cm²</text>
        <rect x="150" y="150" width="33" height="33" class="fill-sq1" />
        <line x1="0" y1="-5" x2="183" y2="-5" stroke="#000" stroke-width="1" />
        <text x="91" y="-12" class="dimension-label" text-anchor="middle">x</text>
      </g>
    </svg>`,
    options: [
      "\\(2\\text{ cm}\\)",
      "\\(7\\text{ cm}\\)",
      "\\(9\\text{ cm}\\)",
      "\\(10\\text{ cm}\\)",
      "\\(11\\text{ cm}\\)",
    ],
    correctIndex: 4,
    hint: "Inner square side is \\(9\\text{ cm}\\). The rectangle width is \\(2\\text{ cm}\\).",
    explanation: ["\\(x = 9 + 2 = 11\\text{ cm}\\)."],
    topic: "Geometry",
  },
  {
    question:
      "Justin drew a cross-shaped polygon. How many lines of symmetry does this polygon have?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
      <style>
        .cross { fill: #f1f5f9; stroke: #0f172a; stroke-width: 2.5; }
      </style>
      <path d="M 60 20 L 100 20 L 100 60 L 140 60 L 140 100 L 100 100 L 100 140 L 60 140 L 60 100 L 20 100 L 20 60 L 60 60 Z" class="cross" />
    </svg>`,
    options: ["\\(1\\)", "\\(2\\)", "\\(3\\)", "\\(4\\)", "\\(5\\)"],
    correctIndex: 3,
    hint: "Count vertical, horizontal, and both diagonal axes.",
    explanation: ["A regular cross has \\(4\\text{ axes}\\) of symmetry."],
    topic: "Geometry (Symmetry)",
  },
  {
    question:
      "How many more vertices does a cube have than a triangular prism?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 140" width="100%" height="100%">
      <style>
        .shape { fill: none; stroke: #475569; stroke-width: 2; }
      </style>
      <!-- Cube -->
      <g transform="translate(10, 10)">
        <rect x="20" y="20" width="80" height="80" class="shape" />
        <rect x="40" y="40" width="80" height="80" class="shape" />
        <line x1="20" y1="20" x2="40" y2="40" class="shape" />
        <line x1="100" y1="20" x2="120" y2="40" class="shape" />
        <line x1="20" y1="100" x2="40" y2="120" class="shape" />
        <line x1="100" y1="100" x2="120" y2="120" class="shape" />
      </g>
      <!-- Triangular Prism -->
      <g transform="translate(180, 10)">
        <polygon points="40,20 120,40 40,80" class="shape" />
        <polygon points="80,60 160,80 80,120" class="shape" />
        <line x1="40" y1="20" x2="80" y2="60" class="shape" />
        <line x1="120" y1="40" x2="160" y2="80" class="shape" />
        <line x1="40" y1="80" x2="80" y2="120" class="shape" />
      </g>
    </svg>`,
    options: ["\\(2\\)", "\\(6\\)", "\\(8\\)", "\\(14\\)", "\\(10\\)"],
    correctIndex: 0,
    hint: "A cube has \\(8\\) vertices, a triangular prism has \\(6\\).",
    explanation: ["\\(8 - 6 = 2\\)."],
    topic: "Geometry",
  },
  {
    question:
      "Which of the following figures appears to have two obtuse angles and two acute angles inside the figure?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 100" width="100%" height="100%">
      <style>
        .poly { fill: #f1f5f9; stroke: #0f172a; stroke-width: 2; }
      </style>
      <polygon points="30,20 60,10 80,45 60,80 30,70" class="poly" /> <!-- A -->
      <rect x="110" y="15" width="60" height="70" class="poly" /> <!-- B -->
      <polygon points="210,15 270,15 250,75 190,75" class="poly" /> <!-- C -->
      <polygon points="310,20 330,40 330,70 310,90 290,70 290,40" class="poly" /> <!-- D -->
    </svg>`,
    options: ["Pentagon", "Rectangle", "Rhombus", "Hexagon", "none"],
    correctIndex: 2,
    hint: "Obtuse angles are greater than \\(90^\\circ\\); acute angles are less than \\(90^\\circ\\).",
    explanation: [
      "The rhombus (has \\(2\\) obtuse and \\(2\\) acute interior angles.",
    ],
    topic: "Geometry",
  },
  {
    question: "Find the volume of the triangular prism.",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 160" width="100%" height="100%">
      <style>
        .prism { fill: none; stroke: #334155; stroke-width: 1.5; }
        .dashed { stroke-dasharray: 4; }
        .label { font-family: sans-serif; font-size: 12px; fill: #0f172a; }
      </style>
      <polygon points="40,120 110,120 80,40" class="prism" />
      <polygon points="160,80 230,80 200,0" class="prism" />
      <line x1="40" y1="120" x2="160" y2="80" class="prism" />
      <line x1="110" y1="120" x2="230" y2="80" class="prism" />
      <line x1="80" y1="40" x2="200" y2="0" class="prism" />
      <line x1="80" y1="40" x2="80" y2="120" class="prism dashed" stroke="#ef4444" />
      <text x="50" y="80" class="label">h = 3 cm</text>
      <text x="55" y="135" class="label">7.9 cm</text>
      <text x="140" y="45" class="label">12.5 cm</text>
    </svg>`,
    options: [
      "\\(148.125\\text{ cm}^3\\)",
      "\\(296.25\\text{ cm}^3\\)",
      "\\(24.35\\text{ cm}^3\\)",
      "\\(319.95\\text{ cm}^3\\)",
      "None of the above",
    ],
    correctIndex: 0,
    hint: "Volume = \\(\\frac{1}{2} \\times \\text{base} \\times \\text{height} \\times \\text{length}\\).",
    explanation: [
      "\\(\\text{Volume} = 0.5 \\times 7.9 \\times 3 \\times 12.5 = 148.125\\text{ cm}^3\\).",
    ],
    topic: "Geometry",
  },
  {
    question:
      "If the length of the rectangle is increased by \\(2\\text{ units}\\), what must happen to the perimeter of the rectangle?",
    type: "objective",
    options: [
      "The perimeter must increase by \\(2\\text{ units}\\).",
      "The perimeter must decrease by \\(2\\text{ units}\\).",
      "The perimeter must increase by \\(4\\text{ units}\\).",
      "The perimeter must decrease by \\(4\\text{ units}\\).",
      "None of the above",
    ],
    correctIndex: 2,
    hint: "Recall: \\(P = 2(l + w)\\). Adding \\(2\\) to \\(l\\) adds \\(2 \\times 2\\) to \\(P\\).",
    explanation: ["The perimeter increases by \\(4\\text{ units}\\)."],
    topic: "Geometry",
  },
  {
    question:
      "The polygon below has a perimeter of \\(116\\text{ units}\\). What is the length of \\(x\\)?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" width="100%" height="100%">
      <style>
        .outline { fill: #f1f5f9; stroke: #000; stroke-width: 2.5; }
        .label { font-family: sans-serif; font-size: 14px; font-weight: bold; fill: #000; }
      </style>
      <path d="M 60 50 L 180 50 L 180 180 L 110 180 L 110 140 L 90 140 L 90 110 L 60 110 Z" class="outline" />
      <text x="110" y="40" class="label">26</text>
      <text x="190" y="120" class="label">26</text>
      <text x="140" y="200" class="label">20</text>
      <text x="100" y="165" class="label">6</text>
      <text x="75" y="130" class="label">x</text>
      <text x="40" y="85" class="label">14</text>
      <text x="75" y="105" class="label">6</text>
    </svg>`,
    options: [
      "\\(6\\text{ units}\\)",
      "\\(18\\text{ units}\\)",
      "\\(12\\text{ units}\\)",
      "\\(10\\text{ units}\\)",
      "\\(22\\text{ units}\\)",
    ],
    correctIndex: 2,
    hint: "Sum all outer segments: \\(26 + 26 + 20 + 6 + 6 + 6 + 14 + x = 116\\).",
    explanation: ["\\(104 + x = 116 \\implies x = 12\\text{ units}\\)."],
    topic: "Geometry",
  },
  {
    question:
      "Triangle \\(ABC\\) is shown below. Sides \\(AB\\) and \\(BC\\) are congruent. Find \\(m(\\hat{C})\\).",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="100%" height="100%">
      <style>
        .line { stroke: #000; stroke-width: 2; }
        .triangle { fill: none; stroke: #000; stroke-width: 2.5; }
        .label { font-family: sans-serif; font-size: 14px; fill: #000; }
      </style>
      <polygon points="40,140 180,40 280,140" class="triangle" />
      <text x="30" y="145" class="label">A</text>
      <text x="180" y="30" class="label">B</text>
      <text x="290" y="145" class="label">C</text>
      <!-- Protractor angle indicator -->
      <path d="M 40 140 L 100 140" class="line" />
    </svg>`,
    options: [
      "\\(30^\\circ\\)",
      "\\(50^\\circ\\)",
      "\\(100^\\circ\\)",
      "\\(80^\\circ\\)",
      "\\(70^\\circ\\)",
    ],
    correctIndex: 1,
    hint: "Since \\(AB = BC\\), the triangle is isosceles, making \\(m(\\hat{A}) = m(\\hat{C}) = 50^\\circ\\).",
    explanation: [
      "The base angles are equal, so \\(m(\\hat{C}) = 50^\\circ\\).",
    ],
    topic: "Geometry",
  },
  {
    question:
      "The drawing shows \\(2\\text{ circles}\\) that share a common center point. Which expression can be used to find the approximate circumference of the outer circle in centimeters?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      <circle cx="100" cy="100" r="40" fill="none" stroke="#000" stroke-width="1.5" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="#000" stroke-width="2" />
      <line x1="100" y1="100" x2="100" y2="60" stroke="#ef4444" stroke-width="2" />
      <line x1="100" y1="60" x2="100" y2="10" stroke="#3b82f6" stroke-width="2" />
      <text x="105" y="85" font-family="sans-serif" font-size="12">3 cm</text>
      <text x="105" y="40" font-family="sans-serif" font-size="12">8 cm</text>
    </svg>`,
    options: [
      "\\(\\pi(3 + 8)\\)",
      "\\(\\frac{1}{2}(3 + 8)\\)",
      "\\(2\\pi(3 + 8)\\)",
      "\\(2(3 + 8)\\)",
      "None of the above",
    ],
    correctIndex: 2,
    hint: "Radius \\(R = 3 + 8\\). Circumference \\(C = 2\\pi R\\).",
    explanation: ["\\(C = 2\\pi(3 + 8)\\)."],
    topic: "Geometry",
  },
  {
    question: "How much wire did Mr. Gold use to complete her piece of art?",
    type: "objective",
    options: [
      "\\(90\\text{ cm}\\)",
      "\\(104\\text{ cm}\\)",
      "\\(120\\text{ cm}\\)",
      "\\(144\\text{ cm}\\)",
      "\\(169\\text{ cm}\\)",
    ],
    correctIndex: 2,
    hint: "Count total line segments of \\(4\\text{ cm}\\) each. There are \\(30\\) segments.",
    explanation: ["\\(30 \\times 4\\text{ cm} = 120\\text{ cm}\\)."],
    topic: "Geometry",
  },
  {
    question:
      "Find the perimeter of the square whose area is \\((A+1)^2\\text{ cm}^2\\).",
    type: "objective",
    options: [
      "\\(A\\text{ cm}\\)",
      "\\(4A\\text{ cm}\\)",
      "\\((4A + 1)\\text{ cm}\\)",
      "\\((4A + 4)\\text{ cm}\\)",
      "\\((2A + 4)\\text{ cm}\\)",
    ],
    correctIndex: 3,
    hint: "The side length is \\(A+1\\).",
    explanation: ["\\(P = 4(A+1) = 4A + 4\\)."],
    topic: "Geometry",
  },
  {
    question:
      "Triangle \\(PQR\\) is an isosceles trianglThe length of side \\(PQ\\) is equal to the length of side \\(QR\\). If \\(m(\\hat{P}) = 55^\\circ\\), what is \\(m(\\hat{Q})\\)?",
    type: "objective",
    options: [
      "\\(55^\\circ\\)",
      "\\(70^\\circ\\)",
      "\\(110^\\circ\\)",
      "\\(180^\\circ\\)",
      "\\(65^\\circ\\)",
    ],
    correctIndex: 1,
    hint: "Base angles: \\(55^\\circ\\) and \\(55^\\circ\\). Subtract from \\(180^\\circ\\).",
    explanation: ["\\(180^\\circ - 110^\\circ = 70^\\circ\\)."],
    topic: "Geometry",
  },
  {
    question:
      "Which statement about the figures shown below is true?\nFigures: \\(Q\\) (trapezoid), \\(S\\) (rectangle), \\(R\\) (slanted parallelogram), \\(P\\) (right triangle)",
    type: "objective",
    options: [
      "Figures \\(R\\) and \\(S\\) are similar.",
      "Figures \\(Q\\) and \\(P\\) each have parallel sides.",
      "Figures \\(Q\\) and \\(R\\) each have at least \\(2\\) obtuse angles.",
      "Figures \\(S\\) and \\(P\\) each have all acute angles.",
      "None of the above",
    ],
    correctIndex: 2,
    hint: "Identify the properties of the angles for each figure.",
    explanation: [
      "Trapezoids and parallelograms have at least \\(2\\) obtuse interior angles.",
    ],
    topic: "Geometry",
  },
  {
    question:
      "Out of which figure below can you make the box shown in the picture?",
    type: "objective",
    options: ["Net A", "Net B", "Net C", "Net D", "Net E"],
    correctIndex: 3,
    hint: "A standard \\(4 \\times 1\\) cross layout works.",
    explanation: ["Net D folds perfectly into a cube."],
    topic: "Geometry",
  },
  {
    question:
      "What is the area of the vegetable section, if the flower part has an area of \\(10\\text{ m}^2\\)?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="100%" height="100%">
      <style>
        .border { fill: #f8fafc; stroke: #000; stroke-width: 2; }
        .text { font-family: sans-serif; font-size: 14px; fill: #000; }
      </style>
      <rect x="20" y="20" width="260" height="160" class="border" />
      <line x1="100" y1="20" x2="100" y2="180" stroke="#000" stroke-width="2" />
      <line x1="100" y1="120" x2="280" y2="120" stroke="#000" stroke-width="2" />
      <text x="45" y="100" class="text" transform="rotate(-90 45 100)">Kwiaty</text>
      <text x="160" y="70" class="text">Warzywa</text>
      <text x="160" y="155" class="text">Truskawki</text>
      <text x="290" y="150" class="text">3 m</text>
      <text x="60" y="15" class="text">2 m</text>
    </svg>`,
    options: [
      "\\(4\\text{ m}^2\\)",
      "\\(6\\text{ m}^2\\)",
      "\\(8\\text{ m}^2\\)",
      "\\(10\\text{ m}^2\\)",
      "\\(12\\text{ m}^2\\)",
    ],
    correctIndex: 2,
    hint: "Width of Flowers = \\(2\\text{ m}\\), Area = \\(10\\text{ m}^2\\) \\(\\implies\\) Height = \\(5\\text{ m}\\). Total area = \\(30\\text{ m}^2\\) \\(\\implies\\) Total Width = \\(6\\text{ m}\\).",
    explanation: [
      "Remaining Width = \\(4\\text{ m}\\). Vegetable Height = \\(5 - 3 = 2\\text{ m}\\). Area = \\(4 \\times 2 = 8\\text{ m}^2\\).",
    ],
    topic: "Geometry",
  },
  {
    question: "What is the color of the twenty-ninth flower drawn by Aisha?",
    type: "objective",
    options: ["Blue", "White", "Red", "Pink", "Yellow"],
    correctIndex: 0,
    hint: "Find \\(29 \\pmod 4\\).",
    explanation: ["\\(29 = 4 \\times 7 + 1\\), which corresponds to Blue."],
    topic: "Logical Reasoning",
  },
  {
    question:
      "Today the date is \\(04.03.2017\\) and the time is \\(22:03\\) (\\(10:03\\) P.M.). What will be the date after \\(2017\\text{ minutes}\\)?",
    type: "objective",
    options: [
      "\\(04.03.2017\\)",
      "\\(05.03.2017\\)",
      "\\(06.03.2017\\)",
      "\\(04.04.2017\\)",
      "\\(06.04.2017\\)",
    ],
    correctIndex: 2,
    hint: "Calculate hours: \\(2017 \\div 60 = 33\\text{ hours and } 37\\text{ minutes}\\).",
    explanation: ["Add to starting date: brings us to \\(06.03.2017\\)."],
    topic: "Measurement",
  },
  {
    question:
      "John is writing the numbers from \\(0\\) to \\(109\\) into a five-column tablWhich of the pieces below cannot be filled in with numbers to fit John's table?",
    type: "objective",
    options: ["Piece A", "Piece B", "Piece C", "Piece D", "Piece E"],
    correctIndex: 3,
    hint: "Check horizontal and vertical differences in the John table.",
    explanation: ["Piece D contains contradictions of parity and spacing."],
    topic: "Logical Reasoning",
  },
  {
    question: "How many more triangles than squares are shown in the picture?",
    type: "objective",
    options: [
      "\\(4\\text{ more}\\)",
      "\\(2\\text{ more}\\)",
      "\\(1\\text{ more}\\)",
      "\\(5\\text{ more}\\)",
      "\\(3\\text{ more}\\)",
    ],
    correctIndex: 4,
    hint: "Count total squares and total triangles.",
    explanation: [
      "Triangles = \\(6\\), Squares = \\(3\\). Difference = \\(3\\).",
    ],
    topic: "Logical Reasoning",
  },
  {
    question:
      "According to the pattern, how many pattern tiles will Scott use all together in the \\(6\\text{th step}\\)?",
    type: "objective",
    options: ["\\(13\\)", "\\(18\\)", "\\(21\\)", "\\(28\\)", "\\(32\\)"],
    correctIndex: 1,
    hint: "Even step \\(n\\) has exactly \\(\\frac{n^2}{2}\\) pattern tiles.",
    explanation: ["\\(\\frac{6^2}{2} = 18\\)."],
    topic: "Logical Reasoning",
  },
  {
    question: "How many problems did they answer correctly all together?",
    type: "objective",
    options: ["\\(17\\)", "\\(1\\)", "\\(15\\)", "\\(13\\)", "\\(21\\)"],
    correctIndex: 0,
    hint: "Score \\(= 5c - 3(10 - = 8c - 30\\).",
    explanation: [
      "Mathew \\(c=8\\), Philip \\(c=5\\), John \\(c=4\\). Sum = \\(17\\).",
    ],
    topic: "Algebra",
  },
  {
    question:
      "What number should she put in the square marked with an \\(x\\)?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
      <style>
        .grid { fill: none; stroke: #000; stroke-width: 1.5; }
        .text { font-family: sans-serif; font-size: 16px; font-weight: bold; fill: #000; text-anchor: middle; }
      </style>
      <rect x="10" y="10" width="140" height="140" class="grid" />
      <line x1="45" y1="10" x2="45" y2="150" class="grid" />
      <line x1="80" y1="10" x2="80" y2="150" class="grid" />
      <line x1="115" y1="10" x2="115" y2="150" class="grid" />
      <line x1="10" y1="45" x2="150" y2="45" class="grid" />
      <line x1="10" y1="80" x2="150" y2="80" class="grid" />
      <line x1="10" y1="115" x2="150" y2="115" class="grid" />
      <text x="27.5" y="32.5" class="text">1</text>
      <text x="62.5" y="32.5" class="text">x</text>
      <text x="97.5" y="32.5" class="text">2</text>
      <text x="27.5" y="67.5" class="text">4</text>
      <text x="62.5" y="67.5" class="text">1</text>
      <text x="62.5" y="102.5" class="text">3</text>
      <text x="62.5" y="137.5" class="text">2</text>
    </svg>`,
    options: [
      "\\(1\\)",
      "\\(2\\)",
      "\\(3\\)",
      "\\(4\\)",
      "Cannot be determined",
    ],
    correctIndex: 3,
    hint: "Identify the missing value in the second column which has \\(\\{1, 2, 3\\}\\).",
    explanation: ["The value must be \\(4\\)."],
    topic: "Logical Reasoning",
  },
  {
    question: "Which four beads below need to be added to this string?",
    type: "objective",
    options: [
      "Solid, Hollow, Hollow, Solid",
      "Solid, Hollow, Hollow, Hollow",
      "Solid, Hollow, Solid, Solid",
      "Hollow, Hollow, Hollow, Hollow",
      "Hollow, Solid, Solid, Hollow",
    ],
    correctIndex: 0,
    hint: "The pattern alternates growing blocks of solid and hollow beads.",
    explanation: [
      "To continue, we need \\(2\\text{ hollow}\\) and \\(2\\text{ solid}\\) beads.",
    ],
    topic: "Logical Reasoning",
  },
  {
    question:
      "A train has four cars in four colors: red, green, white and yellow. What is the order of the cars in that train?",
    type: "objective",
    options: [
      "White, green, red, yellow",
      "White, yellow, green, red",
      "Green, yellow, red, white",
      "Red, white, green, yellow",
      "White, red, green, yellow",
    ],
    correctIndex: 4,
    hint: "First car is WhitYellow can't be next to White, so it's last.",
    explanation: [
      "The unique order satisfying all rules is: White, red, green, yellow.",
    ],
    topic: "Logical Reasoning",
  },
  {
    question: "Which figure is next in the sequence?",
    type: "objective",
    options: [
      "\\(4 \\times 4\\text{ grid}\\)",
      "\\(2 \\times 4\\text{ grid}\\)",
      "\\(3 \\times 4\\text{ grid}\\)",
      "\\(2 \\times 2\\text{ grid}\\)",
      "\\(1 \\times 1\\text{ grid}\\)",
    ],
    correctIndex: 0,
    hint: "Look at the size of the previous grids: \\(1\\times1\\), \\(2\\times2\\), \\(3\\times3\\).",
    explanation: ["The next step is \\(4 \\times 4\\)."],
    topic: "Logical Reasoning",
  },
  {
    question:
      "How many blocks were used to build the figure shown in the picture above?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="100%" height="100%">
      <style>
        .cube { fill: #cbd5e1; stroke: #0f172a; stroke-width: 1.5; }
      </style>
      <!-- Draw block structures -->
      <polygon points="40,100 60,90 80,100 60,110" class="cube" />
    </svg>`,
    options: ["\\(7\\)", "\\(12\\)", "\\(13\\)", "\\(14\\)", "\\(16\\)"],
    correctIndex: 2,
    hint: "Count systematically, factoring in blocks obscured from direct view.",
    explanation: ["There are \\(13\\) blocks total."],
    topic: "Geometry",
  },
  {
    question:
      "What is the greatest number we can get arranging six cards in one row, one after another, with numbers shown in the picture?",
    type: "objective",
    options: [
      "\\(6\\,475\\,413\\,092\\)",
      "\\(4\\,130\\,975\\,642\\)",
      "\\(3\\,097\\,564\\,241\\)",
      "\\(7\\,564\\,413\\,092\\)",
      "\\(7\\,645\\,413\\,092\\)",
    ],
    correctIndex: 4,
    hint: "Arrange cards starting with the largest lexicographical digits: \\(7\\), \\(64\\), \\(5\\), \\(41\\), \\(309\\), \\(2\\).",
    explanation: ["Concatenation results in \\(7\\,645\\,413\\,092\\)."],
    topic: "Logical Reasoning",
  },
  {
    question:
      "With how many ways can you get the number \\(2006\\) while following the arrows on the figure?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="100%" height="100%">
      <style>
        .num { font-family: sans-serif; font-size: 14px; font-weight: bold; fill: #000; text-anchor: middle; }
      </style>
      <text x="90" y="30" class="num">2</text>
      <text x="65" y="70" class="num">0</text>
      <text x="115" y="70" class="num">0</text>
      <text x="40" y="110" class="num">0</text>
      <text x="90" y="110" class="num">0</text>
      <text x="140" y="110" class="num">0</text>
      <text x="15" y="150" class="num">6</text>
      <text x="65" y="150" class="num">6</text>
      <text x="115" y="150" class="num">6</text>
      <text x="165" y="150" class="num">6</text>
    </svg>`,
    options: ["\\(12\\)", "\\(11\\)", "\\(10\\)", "\\(8\\)", "\\(6\\)"],
    correctIndex: 3,
    hint: "Three binary choices: \\(2 \\times 2 \\times 2\\).",
    explanation: ["\\(2^3 = 8\\) pathways."],
    topic: "Combinatorics",
  },
  {
    question:
      "When the same thing happens to number \\(5\\), what do we get in the place of the question mark?",
    type: "objective",
    options: ["Shape A", "Shape B", "Shape C", "Shape D", "Shape E"],
    correctIndex: 3,
    hint: "Horizontally mirror, then vertically mirror.",
    explanation: ["Flipping both axes results in the shape shown in D."],
    topic: "Geometry",
  },
  {
    question: "Which of the following numbers cannot be his result?",
    type: "objective",
    options: ["\\(9\\)", "\\(10\\)", "\\(11\\)", "\\(12\\)", "\\(13\\)"],
    correctIndex: 4,
    hint: "Find combinations of sums: \\(\\{1, 2\\} + \\{3, 4\\} + \\{5, 6\\}\\).",
    explanation: [
      "Maximum sum is \\(2 + 4 + 6 = 12\\). Therefore, \\(13\\) is impossible.",
    ],
    topic: "Arithmetic",
  },
  {
    question: "Which number did he select?",
    type: "objective",
    options: ["\\(7\\)", "\\(111\\)", "\\(722\\)", "\\(567\\)", "\\(728\\)"],
    correctIndex: 4,
    hint: "Work backwards: \\(((\\frac{x}{7}) + 7) \\times 7 = 777\\).",
    explanation: [
      "\\(\\frac{x}{7} + 7 = 111 \\implies \\frac{x}{7} = 104 \\implies x = 728\\).",
    ],
    topic: "Algebra",
  },
  {
    question:
      "By what can the symbol be replaced to have: Symbol \\(\\times\\) Symbol \\(= 2 \\times 2 \\times 3 \\times 3\\)?",
    type: "objective",
    options: [
      "\\(2\\)",
      "\\(3\\)",
      "\\(2 \\times 3\\)",
      "\\(2 \\times 2\\)",
      "\\(3 \\times 3\\)",
    ],
    correctIndex: 2,
    hint: "Take the square root of both sides: \\(S^2 = 36 \\implies S = 6\\).",
    explanation: ["\\(6 = 2 \\times 3\\)."],
    topic: "Arithmetic",
  },
  {
    question:
      "What is the value of \\(1 + 3 + 5 + 7 + \\dots + 17 + 19 + 21\\)?",
    type: "objective",
    options: [
      "\\(10 \\times 10\\)",
      "\\(11 \\times 11\\)",
      "\\(12 \\times 12\\)",
      "\\(13 \\times 13\\)",
      "\\(14 \\times 14\\)",
    ],
    correctIndex: 1,
    hint: "Sum of the first \\(n\\) odd integers is \\(n^2\\). Here, \\(n = 11\\).",
    explanation: ["\\(11^2 = 11 \\times 11\\)."],
    topic: "Number Theory",
  },
  {
    question: "Which of the following expressions has a different value?",
    type: "objective",
    options: [
      "\\(20 \\times 10 + 20 \\times 10\\)",
      "\\(20 \\div 10 \\times 20 \\times 10\\)",
      "\\(20 \\times 10 \\times 20 \\div 10\\)",
      "\\(20 \\times 10 + 10 \\times 20\\)",
      "\\(20 \\div 10 \\times 20 + 10\\)",
    ],
    correctIndex: 4,
    hint: "Evaluate each option using PEMDAS.",
    explanation: ["A, B, C, and D equal \\(400\\). E equals \\(50\\)."],
    topic: "Arithmetic",
  },
  {
    question: "On what day of the week did Jas have his birthday?",
    type: "objective",
    options: [
      "On Monday",
      "On Tuesday",
      "On Wednesday",
      "On Thursday",
      "On Friday",
    ],
    correctIndex: 0,
    hint: "If the day after tomorrow is Thursday, today is Tuesday.",
    explanation: ["Jas's birthday was yesterday (Monday)."],
    topic: "Logical Reasoning",
  },
  {
    question: "What number should replace \\(x\\)?",
    type: "objective",
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      <style>
        .circle { fill: none; stroke: #000; stroke-width: 1.5; }
        .text { font-family: sans-serif; font-size: 11px; fill: #000; text-anchor: middle; }
      </style>
      <circle cx="100" cy="20" r="14" class="circle" />
      <text x="100" y="24" class="text" font-weight="bold">x</text>
      <!-- Draw pyarmid levels ... -->
    </svg>`,
    options: ["\\(32\\)", "\\(50\\)", "\\(55\\)", "\\(82\\)", "\\(100\\)"],
    correctIndex: 3,
    hint: "Calculate systematically from the bottom row upward.",
    explanation: ["The puzzle resolves to \\(x = 82\\)."],
    topic: "Number Theory",
  },
  {
    question:
      "Six cars are parked in a parking lot in two rows. Which of the paths from S to F is the shortest?",
    type: "objective",
    options: ["Path A", "Path B", "Path C", "Path D", "All are equal"],
    correctIndex: 4,
    hint: "Count total forward and vertical steps for each path.",
    explanation: [
      "All paths represent identical grid step sizes, making them equal.",
    ],
    topic: "Geometry",
  },
  {
    question:
      "How many moves do you need to make so that the cards are arranged in the way shown in the bottom row?",
    type: "objective",
    options: ["\\(2\\)", "\\(4\\)", "\\(1\\)", "\\(3\\)", "\\(5\\)"],
    correctIndex: 0,
    hint: "Find the minimum number of swaps to sort \\([1, 3, 5, 4, 2]\\) to \\([1, 2, 3, 4, 5]\\).",
    explanation: [
      "Swap \\(3 \\leftrightarrow 2\\), then swap \\(5 \\leftrightarrow 3\\). Total of \\(2\\) moves.",
    ],
    topic: "Logical Reasoning",
  },
  {
    question:
      "What is the sum of the numbers represented by the square and the circle?\nAddition:\n  [S][S][S]\n  [S][S][C]\n+ [S][T][T]\n= 2 0 0 3",
    type: "objective",
    options: ["\\(6\\)", "\\(7\\)", "\\(8\\)", "\\(9\\)", "\\(13\\)"],
    correctIndex: 0,
    hint: "Equation: \\(321S + 11T + C = 2003\\). Try \\(S = 6\\).",
    explanation: [
      "\\(S = 6\\), \\(T = 7\\), \\(C = 0\\). Sum \\(S + C = 6 + 0 = 6\\).",
    ],
    topic: "Arithmetic",
  },
  {
    question:
      "During the race, right before the finish line, I passed the runner who won the third placWhat place did I win?",
    type: "objective",
    options: ["\\(1\\)", "\\(2\\)", "\\(3\\)", "\\(4\\)", "\\(5\\)"],
    correctIndex: 2,
    hint: "Overtaking the person in third place puts you in third place.",
    explanation: ["You finished in \\(3\\text{rd}\\) place."],
    topic: "Logical Reasoning",
  },
];

setupQuiz(quizData, 5400);
