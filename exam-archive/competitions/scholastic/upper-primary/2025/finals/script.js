import setupQuiz from '../../../../question.js'

const quizData = [
  {
    question: "How many months are there in a century?",
    image: null,
    options: [
      "\\( 1200 \\)",
      "\\( 120 \\)",
      "\\( 12000 \\)",
      "\\( 12 \\)",
      "\\( 100 \\)"
    ],
    correctIndex: 0,
    hint: "Determine the number of years in a century: \\( 1 \\text{ century} = 100 \\text{ years} \\). Then multiply by the number of months in a year: \\( 12 \\text{ months/year} \\).",
    explanation: [
      "\\( 1 \\text{ century} \\)",
      "\\( = 100 \\text{ years} \\)",
      "\\( 1 \\text{ year} \\)",
      "\\( = 12 \\text{ months} \\)",
      "\\( \\text{Total months} \\)",
      "\\( = 100 \\times 12 \\)",
      "\\( = 1200 \\)"
    ]
  },
  {
    question: "Which value of \\( x \\) makes the equation true? \\( x - 7 = -13 \\)",
    image: null,
    options: [
      "\\( -20 \\)",
      "\\( 20 \\)",
      "\\( 6 \\)",
      "\\( -6 \\)",
      "\\( -9 \\)"
    ],
    correctIndex: 3,
    hint: "Isolate \\( x \\) by adding \\( 7 \\) to both sides: \\( x - 7 + 7 = -13 + 7 \\).",
    explanation: [
      "\\( x - 7 = -13 \\)",
      "\\( x - 7 + 7 = -13 + 7 \\)",
      "\\( x = -6 \\)"
    ]
  },
  {
    question: "The perimeter of a circle is known as",
    image: null,
    options: [
      "Square",
      "Radius",
      "Diameter",
      "Area",
      "Circumference"
    ],
    correctIndex: 4,
    hint: "Recall the specific geometric term used for the boundary length of a circle. It is calculated as \\( C = 2\\pi r \\).",
    explanation: [
      "\\( C = 2\\pi r \\)",
      "\\( C = \\pi d \\)",
      "\\( \\text{The boundary length of a circle is its Circumference.} \\)"
    ]
  },
  {
    question: "Two numbers are in the ratio \\( 4:5 \\). If the sum of the numbers is \\( 135 \\), find the numbers.", film: "ratio-sum-135",
    image: null,
    options: [
      "\\( 60 \\text{ and } 65 \\)",
      "\\( 60 \\text{ and } 75 \\)",
      "\\( 70 \\text{ and } 85 \\)",
      "\\( 50 \\text{ and } 85 \\)",
      "\\( 65 \\text{ and } 75 \\)"
    ],
    correctIndex: 1,
    hint: "Represent the numbers as \\( 4x \\) and \\( 5x \\), set \\( 4x + 5x = 135 \\), and solve for \\( x \\).",
    explanation: [
      "\\( \\text{Let the numbers be } 4x \\text{ and } 5x \\)",
      "\\( 4x + 5x = 135 \\)",
      "\\( 9x = 135 \\)",
      "\\( x = \\dfrac{135}{9} \\)",
      "\\( x = 15 \\)",
      "\\( 4x = 4 \\times 15 \\)",
      "\\( = 60 \\)",
      "\\( 5x = 5 \\times 15 \\)",
      "\\( = 75 \\)"
    ]
  },
  {
    question: "Find the common factors of \\( 9 \\), \\( 15 \\) and \\( 21 \\)",
    image: null,
    options: [
      "\\( 3, 5 \\)",
      "\\( 1, 3 \\)",
      "\\( 3, 7 \\)",
      "\\( 3 \\)",
      "\\( 1, 3, 5 \\)"
    ],
    correctIndex: 1,
    hint: "List the factors of each number and identify which ones appear in all three lists.",
    explanation: [
      "\\( 9 = 1 \\times 9 = 3 \\times 3 \\)",
      "\\( \\Rightarrow \\text{Factors of } 9: \\{1, 3, 9\\} \\)",
      "\\( 15 = 1 \\times 15 = 3 \\times 5 \\)",
      "\\( \\Rightarrow \\text{Factors of } 15: \\{1, 3, 5, 15\\} \\)",
      "\\( 21 = 1 \\times 21 = 3 \\times 7 \\)",
      "\\( \\Rightarrow \\text{Factors of } 21: \\{1, 3, 7, 21\\} \\)",
      "\\( \\text{Common factors} \\)",
      "\\( = \\{1,3,9\\} \\cap \\{1,3,5,15\\} \\cap \\{1,3,7,21\\} \\)",
      "\\( = \\{1, 3\\} \\)"
    ]
  },
  {
    question: "What comes after trillion and quadrillion?",
    image: null,
    options: [
      "Sextillion",
      "Pentillion",
      "Quadrillion",
      "Quintillion",
      "Lakhs"
    ],
    correctIndex: 3,
    hint: "Recall the standard naming sequence for large numbers based on powers of \\( 1000 \\): million \\( (10^6) \\), billion \\( (10^9) \\), trillion \\( (10^{12}) \\), ...",
    explanation: [
      "\\( 10^6 = \\text{Million} \\)",
      "\\( 10^9 = \\text{Billion} \\)",
      "\\( 10^{12} = \\text{Trillion} \\)",
      "\\( 10^{15} = \\text{Quadrillion} \\)",
      "\\( 10^{18} = \\text{Quintillion} \\)",
      "\\( \\therefore \\text{After Trillion and Quadrillion comes Quintillion} \\)"
    ]
  },
  {
    question: "\\( 16 \\text{ cm} \\) and \\( 12 \\text{ cm} \\) are the measure of the diagonals of a rhombus. Therefore the length of each side of the rhombus is",
    image: null,
    options: [
      "\\( 4 \\text{ cm} \\)",
      "\\( 8 \\text{ cm} \\)",
      "\\( 9 \\text{ cm} \\)",
      "\\( 10 \\text{ cm} \\)",
      "\\( 12 \\text{ cm} \\)"
    ],
    correctIndex: 3,
    hint: "The diagonals of a rhombus bisect each other at right angles, forming four right triangles with legs \\( \\frac{16}{2} = 8 \\text{ cm} \\) and \\( \\frac{12}{2} = 6 \\text{ cm} \\). Apply the Pythagorean theorem.",
    explanation: [
      "\\( \\text{Half of diagonal}_1 = \\dfrac{16}{2} \\)",
      "\\( = 8 \\text{ cm} \\)",
      "\\( \\text{Half of diagonal}_2 = \\dfrac{12}{2} \\)",
      "\\( = 6 \\text{ cm} \\)",
      "\\( \\text{Side}^2 = 8^2 + 6^2 \\)",
      "\\( = 64 + 36 \\)",
      "\\( = 100 \\)",
      "\\( \\text{Side} = \\sqrt{100} \\)",
      "\\( = 10 \\text{ cm} \\)"
    ]
  },
  {
    question: "A farmer plants \\( 4 \\) apple trees for every \\( 3 \\) pecan trees in the orchard. She plants \\( 2 \\) peach trees for every \\( 5 \\) pecan trees. If the farmer plants \\( 24 \\) peach trees, how many apple trees are in the orchard?",
    image: null,
    options: [
      "\\( 60 \\) apple trees",
      "\\( 96 \\) apple trees",
      "\\( 80 \\) apple trees",
      "\\( 48 \\) apple trees",
      "None of the above"
    ],
    correctIndex: 2,
    hint: "Use the ratio \\( \\text{peach} : \\text{pecan} = 2:5 \\) to find the number of pecan trees, then use \\( \\text{apple} : \\text{pecan} = 4:3 \\) to find the apple trees.",
    explanation: [
      "\\( \\text{peach} : \\text{pecan} = 2 : 5 \\)",
      "\\( \\text{pecan} = \\dfrac{24}{2} \\times 5 \\)",
      "\\( = 60 \\)",
      "\\( \\text{apple} : \\text{pecan} = 4 : 3 \\)",
      "\\( \\text{apple} = \\dfrac{60}{3} \\times 4 \\)",
      "\\( = 80 \\)"
    ]
  },
  {
    question: "A pudding recipe for \\( 50 \\) people calls for \\( 4 \\) cups of sugar. Each bag of sugar contains \\( 6 \\) cups. How many bags of sugar will be needed to make this recipe for \\( 300 \\) people?",
    image: null,
    options: [
      "\\( 24 \\)",
      "\\( 13 \\)",
      "\\( 10 \\)",
      "\\( 8 \\)",
      "\\( 4 \\)"
    ],
    correctIndex: 4,
    hint: "Scale up the sugar using \\( \\dfrac{300}{50} \\times 4 \\) to get total cups, then divide by \\( 6 \\) cups per bag.",
    explanation: [
      "\\( \\text{Scale factor} = \\dfrac{300}{50} \\)",
      "\\( = 6 \\)",
      "\\( \\text{Cups needed} = 6 \\times 4 \\)",
      "\\( = 24 \\text{ cups} \\)",
      "\\( \\text{Bags needed} = \\dfrac{24}{6} \\)",
      "\\( = 4 \\text{ bags} \\)"
    ]
  },
  {
    question: "Of which subject are there the maximum books? (Based on the provided bar graph)",
    image: './q10.svg',
    options: [
      "Hindi",
      "English",
      "Maths",
      "Science",
      "Social science"
    ],
    correctIndex: 0,
    hint: "Identify the tallest bar in the graph — its subject has the maximum number of books.",
    explanation: [
      "\\( \\text{Read the height of each bar from the graph.} \\)",
      "\\( \\text{Hindi bar} > \\text{all other bars} \\)",
      "\\( \\therefore \\text{Hindi has the maximum number of books.} \\)"
    ]
  },
  {
    question: "How many books are there of the subject whose books are maximum? (Based on the provided bar graph)",
    image: './q10.svg',
    options: [
      "\\( 100 \\)",
      "\\( 200 \\)",
      "\\( 300 \\)",
      "\\( 400 \\)",
      "\\( 500 \\)"
    ],
    correctIndex: 3,
    hint: "Read the \\( y \\)-axis value at the top of the tallest bar (Hindi).",
    explanation: [
      "\\( \\text{Maximum subject} = \\text{Hindi} \\)",
      "\\( \\text{Height of Hindi bar on } y\\text{-axis} \\)",
      "\\( = 400 \\)",
      "\\( \\therefore \\text{Number of Hindi books} = 400 \\)"
    ]
  },
  {
    question: "Observe the pie chart given below and answer the following questions: The central angle for sector A is",
    image: './q12.svg',
    options: [
      "\\( 108^{\\circ} \\)",
      "\\( 144^{\\circ} \\)",
      "\\( 72^{\\circ} \\)",
      "\\( 150^{\\circ} \\)",
      "\\( 30^{\\circ} \\)"
    ],
    correctIndex: 0,
    hint: "Multiply the percentage of sector A by the total degrees in a circle: \\( \\theta = \\dfrac{\\%}{100} \\times 360^{\\circ} \\).",
    explanation: [
      "\\( \\text{Sector A} = 30\\% \\)",
      "\\( \\text{Full circle} = 360^{\\circ} \\)",
      "\\( \\theta = \\dfrac{30}{100} \\times 360^{\\circ} \\)",
      "\\( = 0.30 \\times 360^{\\circ} \\)",
      "\\( = 108^{\\circ} \\)"
    ]
  },
  {
    question: "The angles opposite to the equal sides of a triangle are:",
    image: null,
    options: [
      "Sum up to \\( 180^{\\circ} \\)",
      "Equal",
      "Unequal",
      "Supplementary angles",
      "Complementary angles"
    ],
    correctIndex: 1,
    hint: "Recall the properties of an isosceles triangle where two sides are equal.",
    explanation: [
      "\\( \\text{In } \\triangle ABC, \\text{ if } AB = AC \\)",
      "\\( \\Rightarrow \\angle B = \\angle C \\)",
      "\\( \\therefore \\text{Angles opposite equal sides are equal.} \\)"
    ]
  },
  {
    question: "A shopkeeper buys \\( 5 \\) bangles for \\( \\$8880 \\) and later sells them for \\( \\$9875 \\). How much profit does the shopkeeper make per bangle?",
    image: null,
    options: [
      "\\( \\$205 \\)",
      "\\( \\$191 \\)",
      "\\( \\$199 \\)",
      "\\( \\$213 \\)",
      "None of these"
    ],
    correctIndex: 2,
    hint: "Calculate the total profit: \\( \\text{Profit} = \\text{SP} - \\text{CP} \\), then divide by \\( 5 \\).",
    explanation: [
      "\\( \\text{Total Profit} = \\$9875 - \\$8880 \\)",
      "\\( = \\$995 \\)",
      "\\( \\text{Profit per bangle} = \\dfrac{995}{5} \\)",
      "\\( = \\$199 \\)"
    ]
  },
  {
    question: "In the decimal number \\( 1234.567 \\), the digit \\( 1 \\) is in the thousand position. What position is the digit \\( 6 \\) in?",
    image: null,
    options: [
      "Hundredth",
      "Tenth",
      "Hundred",
      "Tens",
      "Unit"
    ],
    correctIndex: 0,
    hint: "Digits after the decimal point occupy: \\( \\text{tenths} \\to \\text{hundredths} \\to \\text{thousandths} \\).",
    explanation: [
      "\\( 1234.\\underbrace{5}_{\\text{tenths}}\\underbrace{6}_{\\text{hundredths}}\\underbrace{7}_{\\text{thousandths}} \\)",
      "\\( \\text{Position of } 5 = \\text{tenths} = 10^{-1} \\)",
      "\\( \\text{Position of } 6 = \\text{hundredths} = 10^{-2} \\)",
      "\\( \\therefore \\text{Digit } 6 \\text{ is in the hundredths position.} \\)"
    ]
  },
  {
    question: "Which statement is TRUE of a right angled triangle?",
    image: null,
    options: [
      "Its three angles are right angles",
      "It has a pair of parallel lines",
      "One of its angles is obtuse",
      "It has a pair of perpendicular lines",
      "The sum of its angles is \\( 90^{\\circ} \\)"
    ],
    correctIndex: 3,
    hint: "A right angle is \\( 90^{\\circ} \\). Consider the relationship between the two sides that form it.",
    explanation: [
      "\\( \\text{A right-angled triangle contains one angle} = 90^{\\circ} \\)",
      "\\( \\angle A + \\angle B + \\angle C = 180^{\\circ} \\)",
      "\\( \\text{If } \\angle C = 90^{\\circ} \\)",
      "\\( \\Rightarrow \\text{the two sides forming } \\angle C \\text{ are perpendicular} \\)",
      "\\( \\therefore \\text{A right-angled triangle has a pair of perpendicular lines.} \\)"
    ]
  },
  {
    question: "In the multiplication question, the sum of the digits in the four boxes is? (Referring to the calculation \\( 879 \\times 492 \\))",
    image: './q17.svg',
    options: [
      "\\( 13 \\)",
      "\\( 12 \\)",
      "\\( 27 \\)",
      "\\( 9 \\)",
      "\\( 22 \\)"
    ],
    correctIndex: 0,
    hint: "Perform each step of the long multiplication: \\( 879 \\times 2 \\), \\( 879 \\times 90 \\), \\( 879 \\times 400 \\), then add to get the product.",
    explanation: [
      "\\( 879 \\times 2 = 1758 \\)",
      "\\( \\Rightarrow \\text{Box}_1 = 1 \\)",
      "\\( 879 \\times 90 = 79110 \\)",
      "\\( \\Rightarrow \\text{Box}_2 = 9 \\)",
      "\\( 879 \\times 400 = 351600 \\)",
      "\\( \\Rightarrow \\text{Box}_3 = 1 \\)",
      "\\( 1758 + 79110 + 351600 = 432468 \\)",
      "\\( \\Rightarrow \\text{Box}_4 = 2 \\)",
      "\\( \\text{Sum} = 1 + 9 + 1 + 2 = 13 \\)"
    ]
  },
  {
    question: "Kalyn cut rectangle R from a sheet of paper. A smaller rectangle is then cut from the large rectangle R to produce figure S. In comparing R to S",
    image: './q18.svg',
    options: [
      "The area and perimeter both decrease",
      "The area decreases and the perimeter increases",
      "The area and perimeter both increase",
      "The area increases and the perimeter decreases",
      "The area decreases and the perimeter stays the same"
    ],
    correctIndex: 4,
    hint: "Calculate the perimeter of both R and S. When a corner rectangle is removed, the two new edges exactly replace the two removed edges, keeping the perimeter constant. The area, however, decreases.",
    explanation: [
      "\\( P_R = 2(8 + 6) \\)",
      "\\( = 28 \\text{ units} \\)",
      "\\( \\text{Removing a corner adds 2 edges but removes 2 equal edges:} \\)",
      "\\( P_S = 8 + 6 + 4 + 1 + 4 + 5 \\)",
      "\\( = 28 \\text{ units} \\)",
      "\\( \\therefore P_R = P_S \\quad (\\text{Perimeter stays the same}) \\)",
      "\\( A_R = 8 \\times 6 \\)",
      "\\( = 48 \\text{ units}^2 \\)",
      "\\( A_S = 48 - (4 \\times 1) \\)",
      "\\( = 44 \\text{ units}^2 \\)",
      "\\( \\therefore A_S < A_R \\quad (\\text{Area decreases}) \\)"
    ]
  },
  {
    question: "Convert \\( 250 \\) centimeters to kilometers.",
    image: null,
    options: [
      "\\( 0.025 \\text{ km} \\)",
      "\\( 2.50 \\text{ km} \\)",
      "\\( 0.0025 \\text{ km} \\)",
      "\\( 0.250 \\text{ km} \\)",
      "\\( 25000000 \\text{ km} \\)"
    ],
    correctIndex: 2,
    hint: "Use: \\( 1 \\text{ km} = 1000 \\text{ m} = 100{,}000 \\text{ cm} \\), so divide by \\( 100{,}000 \\).",
    explanation: [
      "\\( 1 \\text{ km} = 100{,}000 \\text{ cm} \\)",
      "\\( 250 \\text{ cm} = \\dfrac{250}{100{,}000} \\text{ km} \\)",
      "\\( = 0.0025 \\text{ km} \\)"
    ]
  },
  {
    question: "In the diagram, the percentage of small squares that are shaded is?",
    image: './q20.svg',
    options: [
      "\\( 9\\% \\)",
      "\\( 33\\% \\)",
      "\\( 36\\% \\)",
      "\\( 56.25\\% \\)",
      "\\( 64\\% \\)"
    ],
    correctIndex: 2,
    hint: "Count shaded squares, divide by the total number of squares, then multiply by \\( 100 \\).",
    explanation: [
      "\\( \\text{Grid} = 5 \\times 5 = 25 \\text{ squares} \\)",
      "\\( \\text{Shaded squares} = 9 \\)",
      "\\( \\% = \\dfrac{9}{25} \\times 100 \\)",
      "\\( = 0.36 \\times 100 \\)",
      "\\( = 36\\% \\)"
    ]
  },
  {
    question: "Tammy spent \\( \\dfrac{2}{5} \\) of her savings on a watch. She then spent \\( \\dfrac{1}{6} \\) of the remainder on a bag. What fraction of her money did she have left?",
    image: null,
    options: [
      "\\( \\dfrac{1}{2} \\)",
      "\\( \\dfrac{1}{3} \\)",
      "\\( \\dfrac{2}{5} \\)",
      "\\( \\dfrac{5}{6} \\)"
    ],
    correctIndex: 0,
    hint: "After the watch: \\( 1 - \\dfrac{2}{5} = \\dfrac{3}{5} \\) remains. Then \\( \\dfrac{1}{6} \\) of that is spent on the bag.",
    explanation: [
      "\\( \\text{After watch} = 1 - \\dfrac{2}{5} \\)",
      "\\( = \\dfrac{3}{5} \\)",
      "\\( \\text{Spent on bag} = \\dfrac{1}{6} \\times \\dfrac{3}{5} \\)",
      "\\( = \\dfrac{3}{30} \\)",
      "\\( = \\dfrac{1}{10} \\)",
      "\\( \\text{Total spent} = \\dfrac{2}{5} + \\dfrac{1}{10} \\)",
      "\\( = \\dfrac{4}{10} + \\dfrac{1}{10} \\)",
      "\\( = \\dfrac{5}{10} \\)",
      "\\( = \\dfrac{1}{2} \\)",
      "\\( \\text{Fraction left} = 1 - \\dfrac{1}{2} \\)",
      "\\( = \\dfrac{1}{2} \\)"
    ]
  },
  {
    question: "Which of the following is the solution to the equation \\( -9(k - 17) = -54 \\)?",
    image: null,
    options: [
      "\\( 6 \\)",
      "\\( 11 \\)",
      "\\( 23 \\)",
      "\\( -23 \\)"
    ],
    correctIndex: 2,
    hint: "Divide both sides by \\( -9 \\) to simplify, then isolate \\( k \\).",
    explanation: [
      "\\( -9(k - 17) = -54 \\)",
      "\\( k - 17 = \\dfrac{-54}{-9} \\)",
      "\\( k - 17 = 6 \\)",
      "\\( k = 6 + 17 \\)",
      "\\( k = 23 \\)"
    ]
  },
  {
    question: "A cube has volume \\( 125 \\text{ cm}^3 \\). What is the area of one of its faces?",
    image: null,
    options: [
      "\\( 5 \\text{ cm}^2 \\)",
      "\\( 20 \\text{ cm}^2 \\)",
      "\\( 25 \\text{ cm}^2 \\)",
      "\\( 150 \\text{ cm}^2 \\)"
    ],
    correctIndex: 2,
    hint: "Use \\( V = s^3 \\) to find the side length \\( s \\), then \\( A = s^2 \\).",
    explanation: [
      "\\( V = s^3 = 125 \\)",
      "\\( s = \\sqrt[3]{125} \\)",
      "\\( s = 5 \\text{ cm} \\)",
      "\\( A = s^2 \\)",
      "\\( = 5^2 \\)",
      "\\( = 25 \\text{ cm}^2 \\)"
    ]
  },
  {
    question: "Aaron is twice as old as Ryan. In \\( 3 \\) years, the sum of their ages will be \\( 30 \\) years. Find Aaron's age \\( 3 \\) years ago.",
    image: null,
    options: [
      "\\( 8 \\)",
      "\\( 13 \\)",
      "\\( 16 \\)",
      "\\( 19 \\)"
    ],
    correctIndex: 1,
    hint: "Let Ryan's age \\( = R \\), Aaron's age \\( = 2R \\). Set up: \\( (2R+3) + (R+3) = 30 \\), solve for \\( R \\), then find Aaron's age \\( 3 \\) years ago.",
    explanation: [
      "\\( \\text{Let Ryan} = R, \\quad \\text{Aaron} = 2R \\)",
      "\\( (2R + 3) + (R + 3) = 30 \\)",
      "\\( 3R + 6 = 30 \\)",
      "\\( 3R = 24 \\)",
      "\\( R = 8 \\)",
      "\\( \\text{Aaron's current age} = 2 \\times 8 \\)",
      "\\( = 16 \\)",
      "\\( \\text{Aaron's age 3 years ago} = 16 - 3 \\)",
      "\\( = 13 \\)"
    ]
  },
  {
    question: "Jessie baked \\( p \\) cupcakes on Saturday. She baked \\( (p + 3) \\) more cupcakes on Sunday than on Saturday. She baked \\( 30 \\) cupcakes altogether. How many cupcakes did Jessie bake on Saturday?",
    image: null,
    options: [
      "\\( 6 \\)",
      "\\( 9 \\)",
      "\\( 12 \\)",
      "\\( 15 \\)"
    ],
    correctIndex: 1,
    hint: "Sunday's total \\( = p + (p+3) \\). Set \\( p + [p + (p+3)] = 30 \\) and solve.",
    explanation: [
      "\\( \\text{Saturday} = p \\)",
      "\\( \\text{Sunday} = p + (p + 3) \\)",
      "\\( = 2p + 3 \\)",
      "\\( p + (2p + 3) = 30 \\)",
      "\\( 3p + 3 = 30 \\)",
      "\\( 3p = 27 \\)",
      "\\( p = 9 \\)"
    ]
  },
  {
    question: "How many times can \\( \\dfrac{4}{5} \\) be taken from \\( 20 \\)?",
    image: null,
    options: [
      "\\( 16 \\)",
      "\\( 20 \\)",
      "\\( 24 \\)",
      "\\( 25 \\)"
    ],
    correctIndex: 3,
    hint: "Divide \\( 20 \\) by \\( \\dfrac{4}{5} \\): multiply by the reciprocal \\( \\dfrac{5}{4} \\).",
    explanation: [
      "\\( 20 \\div \\dfrac{4}{5} \\)",
      "\\( = 20 \\times \\dfrac{5}{4} \\)",
      "\\( = \\dfrac{20 \\times 5}{4} \\)",
      "\\( = \\dfrac{100}{4} \\)",
      "\\( = 25 \\)"
    ]
  },
  {
    question: "From the difference between \\( \\#37.58 \\) and \\( \\#27.21 \\) take away \\( \\#1.85 \\)",
    image: null,
    options: [
      "\\( \\#8.52 \\)",
      "\\( \\#10.37 \\)",
      "\\( \\#12.22 \\)",
      "\\( \\#8.25 \\)"
    ],
    correctIndex: 0,
    hint: "First compute \\( 37.58 - 27.21 \\), then subtract \\( 1.85 \\) from that result.",
    explanation: [
      "\\( 37.58 - 27.21 \\)",
      "\\( = 10.37 \\)",
      "\\( 10.37 - 1.85 \\)",
      "\\( = 8.52 \\)",
      "\\( \\therefore \\text{Answer} = \\#8.52 \\)"
    ]
  },
  {
    question: "Find the cost of \\( 30 \\text{ cm} \\) of cloth at \\( \\#4.20 \\) a meter?",
    image: null,
    options: [
      "\\( \\#1.20 \\)",
      "\\( \\#1.26 \\)",
      "\\( \\#1.40 \\)",
      "\\( \\#12.60 \\)"
    ],
    correctIndex: 1,
    hint: "Convert \\( 30 \\text{ cm} \\) to meters: \\( 30 \\text{ cm} = 0.3 \\text{ m} \\). Then multiply by \\( \\#4.20/\\text{m} \\).",
    explanation: [
      "\\( 30 \\text{ cm} = \\dfrac{30}{100} \\text{ m} \\)",
      "\\( = 0.3 \\text{ m} \\)",
      "\\( \\text{Cost} = 0.3 \\times \\#4.20 \\)",
      "\\( = \\#1.26 \\)"
    ]
  },
  {
    question: "Calculate \\( \\dfrac{1}{2} - \\dfrac{3}{5} + \\dfrac{7}{10} \\)",
    image: null,
    options: [
      "\\( \\dfrac{1}{10} \\)",
      "\\( \\dfrac{3}{10} \\)",
      "\\( \\dfrac{3}{5} \\)",
      "\\( 1 \\)"
    ],
    correctIndex: 2,
    hint: "Find the LCM of \\( 2, 5, 10 \\) to get a common denominator, then perform the operations.",
    explanation: [
      "\\( \\text{LCM}(2, 5, 10) = 10 \\)",
      "\\( \\dfrac{1}{2} = \\dfrac{5}{10} \\)",
      "\\( \\dfrac{3}{5} = \\dfrac{6}{10} \\)",
      "\\( \\dfrac{5}{10} - \\dfrac{6}{10} + \\dfrac{7}{10} \\)",
      "\\( = \\dfrac{5 - 6 + 7}{10} \\)",
      "\\( = \\dfrac{6}{10} \\)",
      "\\( = \\dfrac{3}{5} \\)"
    ]
  },
  {
    question: "A boy spent \\( \\dfrac{3}{4} \\) of his money and found he had \\( \\#1.25 \\) left. What had he at first?",
    image: null,
    options: [
      "\\( \\#3.75 \\)",
      "\\( \\#4.00 \\)",
      "\\( \\#5.00 \\)",
      "\\( \\#6.25 \\)"
    ],
    correctIndex: 2,
    hint: "If \\( \\dfrac{3}{4} \\) was spent, then \\( \\dfrac{1}{4} \\) is left. Set \\( \\dfrac{1}{4}x = \\#1.25 \\) and solve.",
    explanation: [
      "\\( \\text{Fraction spent} = \\dfrac{3}{4} \\)",
      "\\( \\text{Fraction left} = 1 - \\dfrac{3}{4} \\)",
      "\\( = \\dfrac{1}{4} \\)",
      "\\( \\dfrac{1}{4}x = \\#1.25 \\)",
      "\\( x = \\#1.25 \\times 4 \\)",
      "\\( x = \\#5.00 \\)"
    ]
  },
  {
    question: "In the given figure, if the exterior angle is \\( 135^{\\circ} \\) then \\( \\angle P \\) is:",
    image: './q31.svg',
    options: [
      "\\( 45^{\\circ} \\)",
      "\\( 60^{\\circ} \\)",
      "\\( 90^{\\circ} \\)",
      "\\( 135^{\\circ} \\)"
    ],
    correctIndex: 2,
    hint: "The interior angle at R \\( = 180^{\\circ} - 135^{\\circ} \\). Since \\( PQ = PR \\), the triangle is isosceles and \\( \\angle Q = \\angle R \\). Use the angle sum property.",
    explanation: [
      "\\( \\angle R_{\\text{interior}} = 180^{\\circ} - 135^{\\circ} \\)",
      "\\( = 45^{\\circ} \\)",
      "\\( PQ = PR \\)",
      "\\( \\Rightarrow \\triangle PQR \\text{ is isosceles} \\)",
      "\\( \\Rightarrow \\angle Q = \\angle R = 45^{\\circ} \\)",
      "\\( \\angle P = 180^{\\circ} - \\angle Q - \\angle R \\)",
      "\\( = 180^{\\circ} - 45^{\\circ} - 45^{\\circ} \\)",
      "\\( = 90^{\\circ} \\)"
    ]
  },
  {
    question: "What is the positive difference between the values of \\( (42 \\div 0.6) \\) and \\( (0.7 \\times 0.2 \\div 0.0028) \\)?",
    image: null,
    options: [
      "\\( 20 \\)",
      "\\( 30 \\)",
      "\\( 50 \\)",
      "\\( 120 \\)"
    ],
    correctIndex: 0,
    hint: "Evaluate each expression separately: \\( 42 \\div 0.6 \\) and \\( \\dfrac{0.7 \\times 0.2}{0.0028} \\), then subtract.",
    explanation: [
      "\\( 42 \\div 0.6 = \\dfrac{420}{6} \\)",
      "\\( = 70 \\)",
      "\\( 0.7 \\times 0.2 = 0.14 \\)",
      "\\( 0.14 \\div 0.0028 = \\dfrac{1400}{28} \\)",
      "\\( = 50 \\)",
      "\\( \\text{Difference} = 70 - 50 \\)",
      "\\( = 20 \\)"
    ]
  },
  {
    question: "An alloy contains \\( 26\\% \\) of copper. What quantity of alloy is required to get \\( 130 \\text{ g} \\) of copper?",
    film: "alloy-26",
    image: null,
    options: [
      "\\( 33.8 \\text{ g} \\)",
      "\\( 260 \\text{ g} \\)",
      "\\( 500 \\text{ g} \\)",
      "\\( 5000 \\text{ g} \\)"
    ],
    correctIndex: 2,
    hint: "Set up \\( 26\\% \\times Q = 130 \\text{ g} \\) and solve for \\( Q \\).",
    explanation: [
      "\\( 26\\% \\times Q = 130 \\)",
      "\\( 0.26 \\times Q = 130 \\)",
      "\\( Q = \\dfrac{130}{0.26} \\)",
      "\\( = \\dfrac{13000}{26} \\)",
      "\\( = 500 \\text{ g} \\)"
    ]
  },
  {
    question: "The average of three numbers is \\( 120 \\). What number must be added so that the average will become \\( 110 \\)?",
    image: null,
    options: [
      "\\( 80 \\)",
      "\\( 90 \\)",
      "\\( 100 \\)",
      "\\( 110 \\)"
    ],
    correctIndex: 0,
    hint: "Find the original sum \\( = 3 \\times 120 \\). Then set \\( \\dfrac{\\text{sum} + x}{4} = 110 \\) and solve for \\( x \\).",
    explanation: [
      "\\( \\text{Sum of 3 numbers} = 3 \\times 120 \\)",
      "\\( = 360 \\)",
      "\\( \\dfrac{360 + x}{4} = 110 \\)",
      "\\( 360 + x = 440 \\)",
      "\\( x = 440 - 360 \\)",
      "\\( x = 80 \\)"
    ]
  },
  {
    question: "The average of five numbers is \\( 120 \\). The average of the five numbers is \\( 18 \\) when one of the numbers is changed to \\( 4 \\). What is the original value of the changed number?",
    image: null,
    options: [
      "\\( 114 \\)",
      "\\( 510 \\)",
      "\\( 514 \\)",
      "\\( 600 \\)"
    ],
    correctIndex: 2,
    hint: "Original sum \\( = 5 \\times 120 \\). New sum \\( = 5 \\times 18 \\). The decrease in sum \\( = \\text{original number} - 4 \\).",
    explanation: [
      "\\( \\text{Original sum} = 5 \\times 120 \\)",
      "\\( = 600 \\)",
      "\\( \\text{New sum} = 5 \\times 18 \\)",
      "\\( = 90 \\)",
      "\\( \\text{Decrease in sum} = 600 - 90 \\)",
      "\\( = 510 \\)",
      "\\( \\text{Original number} - 4 = 510 \\)",
      "\\( \\text{Original number} = 510 + 4 \\)",
      "\\( = 514 \\)"
    ]
  },
  {
    question: "Simplify \\( 20 - 12\\dfrac{1}{2} + 4\\dfrac{1}{3} \\)",
    image: null,
    options: [
      "\\( 11\\dfrac{1}{6} \\)",
      "\\( 11\\dfrac{5}{6} \\)",
      "\\( 12\\dfrac{1}{6} \\)",
      "\\( 12\\dfrac{5}{6} \\)"
    ],
    correctIndex: 1,
    hint: "Convert all numbers to improper fractions with denominator \\( 6 \\) (the LCM of \\( 1, 2, 3 \\)).",
    explanation: [
      "\\( 20 = \\dfrac{120}{6} \\)",
      "\\( 12\\dfrac{1}{2} = \\dfrac{25}{2} = \\dfrac{75}{6} \\)",
      "\\( 4\\dfrac{1}{3} = \\dfrac{13}{3} = \\dfrac{26}{6} \\)",
      "\\( \\dfrac{120}{6} - \\dfrac{75}{6} + \\dfrac{26}{6} \\)",
      "\\( = \\dfrac{120 - 75 + 26}{6} \\)",
      "\\( = \\dfrac{71}{6} \\)",
      "\\( = 11\\dfrac{5}{6} \\)"
    ]
  },
  {
    question: "Evaluate \\( (6 - 3\\dfrac{2}{3}) \\div (6 + 3\\dfrac{2}{3}) \\)",
    image: null,
    options: [
      "\\( \\dfrac{7}{29} \\)",
      "\\( \\dfrac{11}{29} \\)",
      "\\( \\dfrac{7}{18} \\)",
      "\\( 1 \\)"
    ],
    correctIndex: 0,
    hint: "Convert \\( 3\\dfrac{2}{3} = \\dfrac{11}{3} \\) and \\( 6 = \\dfrac{18}{3} \\). Simplify numerator and denominator, then divide.",
    explanation: [
      "\\( 3\\dfrac{2}{3} = \\dfrac{11}{3} \\)",
      "\\( \\text{Numerator: } 6 - \\dfrac{11}{3} \\)",
      "\\( = \\dfrac{18}{3} - \\dfrac{11}{3} \\)",
      "\\( = \\dfrac{7}{3} \\)",
      "\\( \\text{Denominator: } 6 + \\dfrac{11}{3} \\)",
      "\\( = \\dfrac{18}{3} + \\dfrac{11}{3} \\)",
      "\\( = \\dfrac{29}{3} \\)",
      "\\( \\dfrac{7}{3} \\div \\dfrac{29}{3} \\)",
      "\\( = \\dfrac{7}{3} \\times \\dfrac{3}{29} \\)",
      "\\( = \\dfrac{7}{29} \\)"
    ]
  },
  {
    question: "If the length of a rectangle is four times the width and the area is \\( 36 \\text{ m}^2 \\), what is the length?",
    image: null,
    options: [
      "\\( 3 \\text{ m} \\)",
      "\\( 9 \\text{ m} \\)",
      "\\( 12 \\text{ m} \\)",
      "\\( 18 \\text{ m} \\)"
    ],
    correctIndex: 2,
    hint: "Let width \\( = W \\), length \\( = 4W \\). Set \\( 4W \\times W = 36 \\) and solve.",
    explanation: [
      "\\( L = 4W \\)",
      "\\( A = L \\times W \\)",
      "\\( = 4W \\times W \\)",
      "\\( = 4W^2 \\)",
      "\\( 4W^2 = 36 \\)",
      "\\( W^2 = \\dfrac{36}{4} \\)",
      "\\( = 9 \\)",
      "\\( W = \\sqrt{9} \\)",
      "\\( = 3 \\text{ m} \\)",
      "\\( L = 4 \\times 3 \\)",
      "\\( = 12 \\text{ m} \\)"
    ]
  },
  {
    question: "How many sixths are there in \\( 5 \\) wholes?",
    image: null,
    options: [
      "\\( 5 \\)",
      "\\( 6 \\)",
      "\\( 11 \\)",
      "\\( 30 \\)"
    ],
    correctIndex: 3,
    hint: "Divide \\( 5 \\) by \\( \\dfrac{1}{6} \\): multiply by the reciprocal \\( 6 \\).",
    explanation: [
      "\\( 5 \\div \\dfrac{1}{6} \\)",
      "\\( = 5 \\times 6 \\)",
      "\\( = 30 \\)"
    ]
  },
  {
    question: "Express \\( 0.007 \\) as a percentage.",
    image: null,
    options: [
      "\\( 0.007\\% \\)",
      "\\( 0.07\\% \\)",
      "\\( 0.7\\% \\)",
      "\\( 7\\% \\)"
    ],
    correctIndex: 2,
    hint: "Multiply by \\( 100 \\) to convert a decimal to a percentage: \\( 0.007 \\times 100 \\).",
    explanation: [
      "\\( \\% = \\text{decimal} \\times 100 \\)",
      "\\( = 0.007 \\times 100 \\)",
      "\\( = 0.7\\% \\)"
    ]
  },
  {
    question: "The ratio of boys to girls in a school is \\( 3:5 \\). If there are \\( 312 \\) boys, how many girls are in the school?", film: "ratio-girls-35",
    image: null,
    options: [
      "\\( 104 \\)",
      "\\( 187 \\)",
      "\\( 520 \\)",
      "\\( 832 \\)"
    ],
    correctIndex: 2,
    hint: "Find \\( 1 \\) part \\( = \\dfrac{312}{3} \\), then multiply by \\( 5 \\) for the girls.",
    explanation: [
      "\\( \\text{Boys} : \\text{Girls} = 3 : 5 \\)",
      "\\( 1 \\text{ part} = \\dfrac{312}{3} \\)",
      "\\( = 104 \\)",
      "\\( \\text{Girls} = 5 \\times 104 \\)",
      "\\( = 520 \\)"
    ]
  },
  {
    question: "Calculate the value of \\( 3 \\times (4 \\times 5^2) \\div 6 + 7 - 8 \\)",
    image: null,
    options: [
      "\\( 41 \\)",
      "\\( 49 \\)",
      "\\( 51 \\)",
      "\\( 149 \\)"
    ],
    correctIndex: 1,
    hint: "Follow BODMAS: evaluate \\( 5^2 \\) first, then the bracket, then multiply/divide left to right, then add/subtract.",
    explanation: [
      "\\( 5^2 = 25 \\)",
      "\\( 4 \\times 25 = 100 \\)",
      "\\( 3 \\times 100 \\div 6 + 7 - 8 \\)",
      "\\( = 300 \\div 6 + 7 - 8 \\)",
      "\\( = 50 + 7 - 8 \\)",
      "\\( = 57 - 8 \\)",
      "\\( = 49 \\)"
    ]
  },
  {
    question: "The total mass of a block of butter and a box of cherries is \\( 384 \\text{ g} \\). The mass of the block of butter is twice the mass of the box of cherries. Find the mass of the block of butter.",
    image: null,
    options: [
      "\\( 128 \\text{ g} \\)",
      "\\( 192 \\text{ g} \\)",
      "\\( 256 \\text{ g} \\)",
      "\\( 300 \\text{ g} \\)"
    ],
    correctIndex: 2,
    hint: "Let cherries \\( = C \\), butter \\( = 2C \\). Set \\( 2C + C = 384 \\) and solve.",
    explanation: [
      "\\( \\text{Let cherries} = C, \\quad \\text{butter} = 2C \\)",
      "\\( 2C + C = 384 \\)",
      "\\( 3C = 384 \\)",
      "\\( C = \\dfrac{384}{3} \\)",
      "\\( = 128 \\text{ g} \\)",
      "\\( \\text{Butter} = 2C \\)",
      "\\( = 2 \\times 128 \\)",
      "\\( = 256 \\text{ g} \\)"
    ]
  },
  {
    question: "Approximate \\( 0.003325 \\) to \\( 1 \\) significant figure",
    image: null,
    options: [
      "\\( 0.0 \\)",
      "\\( 0.003 \\)",
      "\\( 0.0033 \\)",
      "\\( 0.004 \\)"
    ],
    correctIndex: 1,
    hint: "The first significant figure is the first non-zero digit. Look at the digit after it to decide whether to round up or keep it.",
    explanation: [
      "\\( 0.003325 \\)",
      "\\( \\text{First significant figure: } 3 \\text{ (3rd decimal place)} \\)",
      "\\( \\text{Next digit: } 3 < 5 \\)",
      "\\( \\Rightarrow \\text{round down (keep as is)} \\)",
      "\\( \\therefore 0.003325 \\approx 0.003 \\text{ (1 s.f.)} \\)"
    ]
  },
  {
    question: "A triangle has an area of \\( 72 \\text{ square inches} \\) with a height of \\( 4 \\text{ inches} \\). How long is the base associated with this height?",
    image: null,
    options: [
      "\\( 9 \\text{ inches} \\)",
      "\\( 18 \\text{ inches} \\)",
      "\\( 36 \\text{ inches} \\)",
      "\\( 72 \\text{ inches} \\)"
    ],
    correctIndex: 2,
    hint: "Use \\( A = \\dfrac{1}{2} \\times b \\times h \\) and solve for \\( b \\).",
    explanation: [
      "\\( A = \\dfrac{1}{2} \\times b \\times h \\)",
      "\\( 72 = \\dfrac{1}{2} \\times b \\times 4 \\)",
      "\\( 72 = 2b \\)",
      "\\( b = \\dfrac{72}{2} \\)",
      "\\( = 36 \\text{ inches} \\)"
    ]
  },
  {
    question: "I think of a number then add \\( 24 \\). The answer is \\( 45 \\). What is my number?",
    image: null,
    options: [
      "\\( 19 \\)",
      "\\( 21 \\)",
      "\\( 24 \\)",
      "\\( 69 \\)"
    ],
    correctIndex: 1,
    hint: "Let the number \\( = n \\). Set up: \\( n + 24 = 45 \\) and solve.",
    explanation: [
      "\\( n + 24 = 45 \\)",
      "\\( n = 45 - 24 \\)",
      "\\( n = 21 \\)"
    ]
  },
  {
    question: "It costs \\( \\pounds 4.16 \\) to post two parcels. One parcel costs \\( \\pounds 3.32 \\) to post. How much does the other parcel cost to post?",
    image: null,
    options: [
      "\\( \\pounds 0.84 \\)",
      "\\( \\pounds 1.16 \\)",
      "\\( \\pounds 3.32 \\)",
      "\\( \\pounds 7.48 \\)"
    ],
    correctIndex: 0,
    hint: "Subtract the known cost from the total: \\( \\pounds 4.16 - \\pounds 3.32 \\).",
    explanation: [
      "\\( \\text{Total} = \\pounds 4.16 \\)",
      "\\( \\text{Known parcel} = \\pounds 3.32 \\)",
      "\\( \\text{Other parcel} = 4.16 - 3.32 \\)",
      "\\( = \\pounds 0.84 \\)"
    ]
  },
  {
    question: "Find the median of the given data: \\( 13, 16, 12, 14, 19, 12, 14, 13 \\) and \\( 14 \\)",
    image: null,
    options: [
      "\\( 13 \\)",
      "\\( 13.5 \\)",
      "\\( 14 \\)",
      "\\( 14.5 \\)"
    ],
    correctIndex: 2,
    hint: "Sort the data in ascending order, then find the middle value. For \\( n = 9 \\), the median is the \\( \\left(\\dfrac{9+1}{2}\\right)^{\\text{th}} = 5^{\\text{th}} \\) value.",
    explanation: [
      "\\( \\text{Sorted: } 12, 12, 13, 13, 14, 14, 14, 16, 19 \\)",
      "\\( n = 9 \\)",
      "\\( \\text{Median position} = \\dfrac{9+1}{2} \\)",
      "\\( = 5^{\\text{th}} \\text{ value} \\)",
      "\\( 5^{\\text{th}} \\text{ value} = 14 \\)",
      "\\( \\therefore \\text{Median} = 14 \\)"
    ]
  },
  {
    question: "What day of the week was it a fortnight ago if today is Wednesday?",
    image: null,
    options: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday"
    ],
    correctIndex: 2,
    hint: "Recall: \\( 1 \\text{ fortnight} = 2 \\text{ weeks} = 14 \\text{ days} \\). The day of the week repeats every \\( 7 \\) days.",
    explanation: [
      "\\( 1 \\text{ fortnight} = 14 \\text{ days} \\)",
      "\\( 14 \\div 7 = 2 \\text{ complete weeks} \\)",
      "\\( \\text{Remainder} = 0 \\)",
      "\\( \\therefore \\text{The day is the same: Wednesday} \\)"
    ]
  },
  {
    question: "If \\( 3 \\) men can dig a garden in \\( 4 \\) days, how many men would be needed to dig it in \\( 2 \\) days?",
    image: null,
    options: [
      "\\( 1.5 \\)",
      "\\( 5 \\)",
      "\\( 6 \\)",
      "\\( 8 \\)"
    ],
    correctIndex: 2,
    hint: "This is inverse proportion. Compute total man-days \\( = 3 \\times 4 \\), then divide by the new number of days.",
    explanation: [
      "\\( \\text{Total man-days} = 3 \\times 4 \\)",
      "\\( = 12 \\)",
      "\\( \\text{Men needed} = \\dfrac{12}{2} \\)",
      "\\( = 6 \\)"
    ]
  }
];

setupQuiz(quizData, 2400)