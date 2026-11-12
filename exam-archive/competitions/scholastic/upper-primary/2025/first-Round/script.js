import setupQuiz from '../../../../question.js'

const quizData = [
{
  question: "Express \\( 2021 \\) in Roman numerals",
  image: null,
  options: [
    "MXI",
    "MXX",
    "MMXII",
    "MMXXI",
    "MMXII"
  ],
  correctIndex: 3,
  hint: "Break the number into thousands, hundreds, tens, and units: \\( \\text{M} = 1000 \\), \\( \\text{X} = 10 \\), \\( \\text{I} = 1 \\).",
  explanation: [
    "\\( 2021 = 2000 + 20 + 1 \\)",
    "\\( 2000 = \\text{MM} \\)",
    "\\( 20 = \\text{XX} \\)",
    "\\( 1 = \\text{I} \\)",
    "\\( \\therefore 2021 = \\text{MMXXI} \\)"
  ]
},
{
  question: "Express four thousand and sixty two in figures",
  image: null,
  options: [
    "\\( 40062 \\)",
    "\\( 4062 \\)",
    "\\( 460 \\)",
    "\\( 4602 \\)",
    "\\( 400062 \\)"
  ],
  correctIndex: 1,
  hint: "Identify the value of each digit based on its place value (thousands, hundreds, tens, units).",
  explanation: [
    "\\( \\text{Four thousand} = 4000 \\)",
    "\\( \\text{Sixty-two} = 62 \\)",
    "\\( 4000 + 62 = 4062 \\)"
  ]
},
{
  question: "Write in words: \\( 10079 \\)",
  image: null,
  options: [
    "One hundred and seventy nine",
    "Ten thousand and seventy nine",
    "Ten thousand seven hundred and nine",
    "One hundred and seven thousand and nine",
    "One thousand seven hundred and nine"
  ],
  correctIndex: 1,
  hint: "Group the digits into periods (thousands, ones) to read the number correctly.",
  explanation: [
    "\\( 10079 = 10{,}079 \\)",
    "\\( 10 \\) is in the thousands period \\( \\Rightarrow \\text{Ten thousand} \\)",
    "\\( 079 \\) is in the ones period \\( \\Rightarrow \\text{seventy-nine} \\)",
    "\\( \\therefore 10079 = \\text{Ten thousand and seventy nine} \\)"
  ]
},
{
  question: "The average of \\( 8, 8, 9, 11, 22 \\) and \\( 26 \\) is?",
  image: null,
  options: [
    "\\( 13 \\)",
    "\\( 14 \\)",
    "\\( 15 \\)",
    "\\( 16 \\)",
    "\\( 17 \\)"
  ],
  correctIndex: 1,
  hint: "Add all the numbers together and divide by the total number of items.",
  explanation: [
    "\\( \\text{Sum} = 8 + 8 + 9 + 11 + 22 + 26 \\)",
    "\\( = 84 \\)",
    "\\( n = 6 \\)",
    "\\( \\text{Average} = \\dfrac{84}{6} \\)",
    "\\( = 14 \\)"
  ]
},
{
  question: "Find the area of a circle of radius \\( 10 \\text{ cm} \\). (Take \\( \\pi = 3.14 \\))",
  image: null,
  options: [
    "\\( 10 \\text{ cm}^2 \\)",
    "\\( 100 \\text{ cm}^2 \\)",
    "\\( 30 \\text{ cm}^2 \\)",
    "\\( 31.4 \\text{ cm}^2 \\)",
    "\\( 314 \\text{ cm}^2 \\)"
  ],
  correctIndex: 4,
  hint: "Use the formula for the area of a circle: \\( A = \\pi r^2 \\).",
  explanation: [
    "\\( A = \\pi r^2 \\)",
    "\\( = 3.14 \\times (10)^2 \\)",
    "\\( = 3.14 \\times 100 \\)",
    "\\( = 314 \\text{ cm}^2 \\)"
  ]
},
{
  question: "How many faces does a triangular prism have?",
  image: './q6.svg',
  options: [
    "Four",
    "Five",
    "Six",
    "Eight",
    "Three"
  ],
  correctIndex: 1,
  hint: "A triangular prism has two triangular bases and rectangular sides connecting corresponding sides of the triangles.",
  explanation: [
    "\\( \\text{Triangular bases} = 2 \\)",
    "\\( \\text{Rectangular faces} = 3 \\)",
    "\\( \\text{Total faces} = 2 + 3 = 5 \\)"
  ]
},
{
  question: "What type of angle is \\( 98^{\\circ} \\)?",
  image: null,
  options: [
    "Acute angle",
    "Obtuse angle",
    "Right angle",
    "Reflex angle",
    "Angle at a point"
  ],
  correctIndex: 1,
  hint: "Recall the definitions of different types of angles based on their measure in degrees.",
  explanation: [
    "\\( \\text{Acute angle: } 0^{\\circ} < \\theta < 90^{\\circ} \\)",
    "\\( \\text{Right angle: } \\theta = 90^{\\circ} \\)",
    "\\( \\text{Obtuse angle: } 90^{\\circ} < \\theta < 180^{\\circ} \\)",
    "\\( \\text{Reflex angle: } 180^{\\circ} < \\theta < 360^{\\circ} \\)",
    "\\( 90^{\\circ} < 98^{\\circ} < 180^{\\circ} \\)",
    "\\( \\therefore 98^{\\circ} \\text{ is an Obtuse angle} \\)"
  ]
},
{
  question: "The triangle has a base of \\( 5 \\text{ m} \\) and a height of \\( 6 \\text{ m} \\). What is the area of the triangle in \\( \\text{m}^2 \\)?",
  image: './q8.svg',
  options: [
    "\\( 60 \\)",
    "\\( 30 \\)",
    "\\( 17 \\)",
    "\\( 15 \\)",
    "\\( 8.5 \\)"
  ],
  correctIndex: 3,
  hint: "Use the formula: \\( A = \\dfrac{1}{2} \\times b \\times h \\).",
  explanation: [
    "\\( A = \\dfrac{1}{2} \\times b \\times h \\)",
    "\\( = \\dfrac{1}{2} \\times 5 \\times 6 \\)",
    "\\( = \\dfrac{1}{2} \\times 30 \\)",
    "\\( = 15 \\text{ m}^2 \\)"
  ]
},
{
  question: "How many halves \\( \\left( \\dfrac{1}{2} \\right) \\) are contained in \\( 2 \\) wholes?",
  image: null,
  options: [
    "\\( 1 \\)",
    "\\( 2 \\)",
    "\\( 3 \\)",
    "\\( 4 \\)",
    "\\( 5 \\)"
  ],
  correctIndex: 3,
  hint: "Divide \\( 2 \\) by \\( \\dfrac{1}{2} \\) using the reciprocal.",
  explanation: [
    "\\( 2 \\div \\dfrac{1}{2} \\)",
    "\\( = 2 \\times 2 \\)",
    "\\( = 4 \\)"
  ]
},
{
  question: "In the triangle below, what is the value of the angle marked \\( x^{\\circ} \\)?",
  image: './q10.svg',
  options: [
    "\\( 30^{\\circ} \\)",
    "\\( 50^{\\circ} \\)",
    "\\( 60^{\\circ} \\)",
    "\\( 90^{\\circ} \\)",
    "\\( 120^{\\circ} \\)"
  ],
  correctIndex: 2,
  hint: "The sum of angles in a triangle is \\( 180^{\\circ} \\). One angle is \\( 90^{\\circ} \\) (right angle) and another is \\( 30^{\\circ} \\).",
  explanation: [
    "\\( x + 90^{\\circ} + 30^{\\circ} = 180^{\\circ} \\)",
    "\\( x + 120^{\\circ} = 180^{\\circ} \\)",
    "\\( x = 180^{\\circ} - 120^{\\circ} \\)",
    "\\( x = 60^{\\circ} \\)"
  ]
},
{
  question: "Calculate the LCM of \\( 2, 8 \\) and \\( 12 \\).",
  image: null,
  options: [
    "\\( 2 \\)",
    "\\( 24 \\)",
    "\\( 36 \\)",
    "\\( 72 \\)",
    "\\( 96 \\)"
  ],
  correctIndex: 1,
  hint: "List the multiples of each number or use prime factorization to find the least common multiple.",
  explanation: [
    "\\( 2 = 2^1 \\)",
    "\\( 8 = 2^3 \\)",
    "\\( 12 = 2^2 \\times 3 \\)",
    "\\( \\text{LCM} = 2^3 \\times 3 \\)",
    "\\( = 8 \\times 3 \\)",
    "\\( = 24 \\)"
  ]
},
{
  question: "The HCF of \\( 14 \\) and \\( 28 \\)",
  image: null,
  options: [
    "\\( 2 \\)",
    "\\( 7 \\)",
    "\\( 56 \\)",
    "\\( 28 \\)",
    "\\( 14 \\)"
  ],
  correctIndex: 4,
  hint: "Find the factors of each number and identify the highest factor common to both.",
  explanation: [
    "\\( \\text{Factors of } 14 = \\{1, 2, 7, 14\\} \\)",
    "\\( \\text{Factors of } 28 = \\{1, 2, 4, 7, 14, 28\\} \\)",
    "\\( \\text{Common factors} = \\{1, 2, 7, 14\\} \\)",
    "\\( \\text{HCF} = 14 \\)"
  ]
},
{
  question: "What is the value of \\( 2.75 + 0.003 + 0.158 \\)?",
  image: null,
  options: [
    "\\( 4.36 \\)",
    "\\( 2.911 \\)",
    "\\( 0.436 \\)",
    "\\( 2.938 \\)",
    "\\( 3.5 \\)"
  ],
  correctIndex: 1,
  hint: "Align the decimal points vertically before adding the numbers.",
  explanation: [
    "\\( \\phantom{+0.}2.750 \\)",
    "\\( + 0.003 \\)",
    "\\( + 0.158 \\)",
    "\\( = 2.911 \\)"
  ]
},
{
  question: "\\( 25 \\) added to a number makes it half a gross. What is the number?",
  image: null,
  options: [
    "\\( 35 \\)",
    "\\( 72 \\)",
    "\\( 97 \\)",
    "\\( 47 \\)",
    "\\( 100 \\)"
  ],
  correctIndex: 3,
  hint: "A gross \\( = 144 \\). Find half a gross, then set up \\( x + 25 = \\text{half gross} \\) and solve.",
  explanation: [
    "\\( 1 \\text{ gross} = 144 \\)",
    "\\( \\text{Half a gross} = \\dfrac{144}{2} = 72 \\)",
    "\\( x + 25 = 72 \\)",
    "\\( x = 72 - 25 \\)",
    "\\( x = 47 \\)"
  ]
},
{
  question: "A box weighs \\( 2.25 \\text{ kg} \\). What will \\( 20 \\) boxes weigh?",
  image: null,
  options: [
    "\\( 12.7 \\text{ kg} \\)",
    "\\( 25.4 \\text{ kg} \\)",
    "\\( 22.5 \\text{ kg} \\)",
    "\\( 45.0 \\text{ kg} \\)",
    "\\( 22.25 \\text{ kg} \\)"
  ],
  correctIndex: 3,
  hint: "Multiply the weight of one box by the total number of boxes.",
  explanation: [
    "\\( \\text{Total weight} = 2.25 \\times 20 \\)",
    "\\( 2.25 \\times 10 = 22.5 \\)",
    "\\( 22.5 \\times 2 = 45.0 \\)",
    "\\( = 45.0 \\text{ kg} \\)"
  ]
},
{
  question: "A 3-D shape has been opened up to a flat 2-D shape (a net) and is shown below. What was the 3-D shape?",
  image: './q16.svg',
  options: [
    "Sphere",
    "Cuboid",
    "Cone",
    "Cube",
    "Cylinder"
  ],
  correctIndex: 4,
  hint: "The net consists of one large rectangle and two identical circles — these form the body and bases of the shape.",
  explanation: [
    "\\( \\text{Net} = 1 \\text{ rectangle} + 2 \\text{ circles} \\)",
    "\\( \\text{Rectangle} \\Rightarrow \\text{curved surface (tube)} \\)",
    "\\( \\text{2 circles} \\Rightarrow \\text{top and bottom bases} \\)",
    "\\( \\therefore \\text{3-D shape} = \\text{Cylinder} \\)"
  ]
},
{
  question: "If there are \\( 9 \\) squares on each face of a Rubik's Cube, how many squares are there in total?",
  image: './q17.svg',
  options: [
    "\\( 15 \\)",
    "\\( 27 \\)",
    "\\( 45 \\)",
    "\\( 54 \\)",
    "\\( 60 \\)"
  ],
  correctIndex: 3,
  hint: "Determine the total number of faces on a cube, then multiply by the number of squares per face.",
  explanation: [
    "\\( \\text{Faces on a cube} = 6 \\)",
    "\\( \\text{Squares per face} = 9 \\)",
    "\\( \\text{Total squares} = 6 \\times 9 \\)",
    "\\( = 54 \\)"
  ]
},
{
  question: "The ________ of a circle is the distance from the center of a circle to any point on the circumference",
  image: null,
  options: [
    "Radius",
    "Diameter",
    "Center",
    "Chord",
    "Circumference"
  ],
  correctIndex: 0,
  hint: "Recall the basic terminology of a circle.",
  explanation: [
    "\\( \\text{Radius} = \\text{center} \\to \\text{any point on circumference} \\)",
    "\\( \\text{Diameter} = 2 \\times \\text{radius} \\)",
    "\\( \\therefore \\text{The answer is Radius.} \\)"
  ]
},
{
  question: "What fact makes a cube unique and makes its surface area easy to determine?",
  image: null,
  options: [
    "It's a three-dimensional shape",
    "It is the only three-dimensional shape whose area is expressed in square units.",
    "It always consists of six edges.",
    "Its surface always consists of six squares that are equal in size and area.",
    "None of the above"
  ],
  correctIndex: 3,
  hint: "Think about the specific properties of the faces of a cube compared to other 3D shapes like a cuboid.",
  explanation: [
    "\\( \\text{Cube: all faces are identical squares} \\)",
    "\\( \\text{Number of faces} = 6 \\)",
    "\\( \\text{SA} = 6 \\times s^2 \\)",
    "\\( \\therefore \\text{All 6 faces are equal squares — this is unique to a cube.} \\)"
  ]
},
{
  question: "The value of \\( 11^2 \\) is?",
  image: null,
  options: [
    "\\( 16 \\)",
    "\\( 22 \\)",
    "\\( 64 \\)",
    "\\( 81 \\)",
    "\\( 121 \\)"
  ],
  correctIndex: 4,
  hint: "Squaring a number means multiplying it by itself.",
  explanation: [
    "\\( 11^2 = 11 \\times 11 \\)",
    "\\( = 121 \\)"
  ]
},
{
  question: "One quintillion is?",
  image: null,
  options: [
    "\\( 1 \\times 10^9 \\)",
    "\\( 1 \\times 10^{12} \\)",
    "\\( 1 \\times 10^{15} \\)",
    "\\( 1 \\times 10^{18} \\)",
    "\\( 1 \\times 10^{100} \\)"
  ],
  correctIndex: 3,
  hint: "Recall the sequence: million \\( (10^6) \\), billion \\( (10^9) \\), trillion \\( (10^{12}) \\), quadrillion \\( (10^{15}) \\).",
  explanation: [
    "\\( \\text{Million} = 1 \\times 10^6 \\)",
    "\\( \\text{Billion} = 1 \\times 10^9 \\)",
    "\\( \\text{Trillion} = 1 \\times 10^{12} \\)",
    "\\( \\text{Quadrillion} = 1 \\times 10^{15} \\)",
    "\\( \\text{Quintillion} = 1 \\times 10^{18} \\)"
  ]
},
{
  question: "Which numeral is in the tenths place of the number \\( 53.04 \\)?",
  image: null,
  options: [
    "\\( 5 \\)",
    "\\( 4 \\)",
    "\\( 3 \\)",
    "\\( 0 \\)",
    "None of the above"
  ],
  correctIndex: 3,
  hint: "The first digit after the decimal point is the tenths place, the second is hundredths.",
  explanation: [
    "\\( 53.04 \\)",
    "\\( 5 \\Rightarrow \\text{tens place} \\)",
    "\\( 3 \\Rightarrow \\text{ones place} \\)",
    "\\( 0 \\Rightarrow \\text{tenths place} = 10^{-1} \\)",
    "\\( 4 \\Rightarrow \\text{hundredths place} = 10^{-2} \\)",
    "\\( \\therefore \\text{tenths digit} = 0 \\)"
  ]
},
{
  question: "George left home at \\( 7{:}30 \\text{ a.m.} \\) for school. School begins at \\( 8{:}45 \\text{ a.m.} \\) George was \\( 10 \\) minutes late. How long did George take to get to school?",
  image: null,
  options: [
    "\\( 1 \\text{ hr } 25 \\text{ mins} \\)",
    "\\( 1 \\text{ hr } 55 \\text{ mins} \\)",
    "\\( 3 \\text{ hrs } 25 \\text{ mins} \\)",
    "\\( 4 \\text{ hrs } 55 \\text{ mins} \\)",
    "\\( 30 \\text{ mins} \\)"
  ],
  correctIndex: 0,
  hint: "George arrived \\( 10 \\) minutes after \\( 8{:}45 \\). Find the difference between arrival time and departure time.",
  explanation: [
    "\\( \\text{Arrival time} = 8{:}45 + 10 \\text{ min} = 8{:}55 \\text{ a.m.} \\)",
    "\\( \\text{Departure time} = 7{:}30 \\text{ a.m.} \\)",
    "\\( 7{:}30 \\to 8{:}30 = 1 \\text{ hour} \\)",
    "\\( 8{:}30 \\to 8{:}55 = 25 \\text{ minutes} \\)",
    "\\( \\text{Total} = 1 \\text{ hr } 25 \\text{ mins} \\)"
  ]
},
{
  question: "At what speed does a man walk to cover \\( 12 \\text{ km} \\) in \\( 3 \\text{ hours} \\)?",
  image: null,
  options: [
    "\\( 36 \\text{ kph} \\)",
    "\\( 4 \\text{ kph} \\)",
    "\\( 6 \\text{ kph} \\)",
    "\\( 3 \\text{ kph} \\)",
    "\\( 2 \\text{ kph} \\)"
  ],
  correctIndex: 1,
  hint: "Use the formula: \\( \\text{Speed} = \\dfrac{\\text{Distance}}{\\text{Time}} \\).",
  explanation: [
    "\\( \\text{Speed} = \\dfrac{\\text{Distance}}{\\text{Time}} \\)",
    "\\( = \\dfrac{12 \\text{ km}}{3 \\text{ hrs}} \\)",
    "\\( = 4 \\text{ kph} \\)"
  ]
},
{
  question: "If \\( 7(x - 2) = 3x - 2 \\), what is the value of \\( x \\)?",
  image: null,
  options: [
    "\\( -4 \\)",
    "\\( -3 \\)",
    "\\( 2 \\)",
    "\\( 3 \\)",
    "\\( 4 \\)"
  ],
  correctIndex: 3,
  hint: "Expand the bracket on the left side first, then collect like terms to isolate \\( x \\).",
  explanation: [
    "\\( 7(x - 2) = 3x - 2 \\)",
    "\\( 7x - 14 = 3x - 2 \\)",
    "\\( 7x - 3x = -2 + 14 \\)",
    "\\( 4x = 12 \\)",
    "\\( x = \\dfrac{12}{4} \\)",
    "\\( x = 3 \\)"
  ]
},
{
  question: "Study the sample below and answer the given question (Find S):",
  image: './q26.svg',
  options: [
    "\\( 1 \\)",
    "\\( 65 \\)",
    "\\( 194 \\)",
    "\\( 169 \\)",
    "\\( 196 \\)"
  ],
  correctIndex: 1,
  hint: "Look for an arithmetic operation linking the values. Try multiplication.",
  explanation: [
    "\\( \\text{Left} = 13, \\quad \\text{Top} = 5 \\)",
    "\\( S = 13 \\times 5 \\)",
    "\\( = 65 \\)"
  ]
},
{
  question: "Study the sample carefully and answer the following question (Find ?):",
  image: './q27.svg',
  options: [
    "\\( 37 \\)",
    "\\( 30 \\)",
    "\\( 24 \\)",
    "\\( 14 \\)",
    "\\( 5 \\)"
  ],
  correctIndex: 2,
  hint: "Identify the mathematical rule combining the top number and the bottom number in the sequence.",
  explanation: [
    "\\( \\text{Following the operational rule of the sequence:} \\)",
    "\\( ? = 24 \\)"
  ]
},
{
  question: "Which of the following is an improper fraction?",
  image: null,
  options: [
    "\\( \\dfrac{2}{3} \\)",
    "\\( \\dfrac{3}{2} \\)",
    "\\( 1\\dfrac{2}{3} \\)",
    "\\( \\dfrac{1}{3} \\)",
    "\\( \\dfrac{1}{2} \\)"
  ],
  correctIndex: 1,
  hint: "An improper fraction has a numerator greater than or equal to its denominator.",
  explanation: [
    "\\( \\text{Improper fraction: numerator} \\geq \\text{denominator} \\)",
    "\\( \\dfrac{3}{2}: \\quad 3 > 2 \\)",
    "\\( \\therefore \\dfrac{3}{2} \\text{ is an improper fraction} \\)"
  ]
},
{
  question: "You had \\( \\$10{,}000.00 \\) in your account, you withdrew \\( 10\\% \\) of your current balance. How much money is your new balance?",
  image: null,
  options: [
    "\\( \\$1{,}000.00 \\)",
    "\\( \\$8{,}000.00 \\)",
    "\\( \\$9{,}000.00 \\)",
    "\\( \\$10{,}000.00 \\)",
    "\\( \\$11{,}000.00 \\)"
  ],
  correctIndex: 2,
  hint: "Calculate \\( 10\\% \\) of \\( \\$10{,}000 \\), then subtract from the original balance.",
  explanation: [
    "\\( \\text{Withdrawal} = 10\\% \\times 10{,}000 \\)",
    "\\( = \\dfrac{10}{100} \\times 10{,}000 \\)",
    "\\( = 1{,}000 \\)",
    "\\( \\text{New balance} = 10{,}000 - 1{,}000 \\)",
    "\\( = \\$9{,}000 \\)"
  ],
  film: "withdraw-10" // PrepBot works it two ways (utils/components/workbook/cbt-films.js)
},
{
  question: "A triangle in which two sides are equal is called a _____ triangle?",
  image: null,
  options: [
    "Equilateral",
    "Isosceles",
    "Right angle",
    "Scalene",
    "Isometric"
  ],
  correctIndex: 1,
  hint: "Recall the classification of triangles based on their side lengths.",
  explanation: [
    "\\( \\text{Equilateral: all 3 sides equal} \\)",
    "\\( \\text{Isosceles: exactly 2 sides equal} \\)",
    "\\( \\text{Scalene: all 3 sides different} \\)",
    "\\( \\therefore \\text{2 equal sides} \\Rightarrow \\text{Isosceles triangle} \\)"
  ]
},
{
  question: "Of the following fractions, which is less than \\( \\dfrac{2}{3} \\)?",
  image: null,
  options: [
    "\\( \\dfrac{7}{8} \\)",
    "\\( \\dfrac{5}{6} \\)",
    "\\( \\dfrac{3}{4} \\)",
    "\\( \\dfrac{3}{5} \\)",
    "\\( \\dfrac{5}{7} \\)"
  ],
  correctIndex: 3,
  hint: "Convert each fraction to a decimal and compare with \\( \\dfrac{2}{3} \\approx 0.667 \\).",
  explanation: [
    "\\( \\dfrac{2}{3} \\approx 0.667 \\)",
    "\\( \\dfrac{7}{8} = 0.875 > 0.667 \\)",
    "\\( \\dfrac{5}{6} \\approx 0.833 > 0.667 \\)",
    "\\( \\dfrac{3}{4} = 0.750 > 0.667 \\)",
    "\\( \\dfrac{3}{5} = 0.600 < 0.667 \\)",
    "\\( \\dfrac{5}{7} \\approx 0.714 > 0.667 \\)",
    "\\( \\therefore \\dfrac{3}{5} \\text{ is the only fraction less than } \\dfrac{2}{3} \\)"
  ]
},
{
  question: "How many factors does the number \\( 12 \\) have?",
  image: null,
  options: [
    "\\( 3 \\)",
    "\\( 6 \\)",
    "\\( 9 \\)",
    "\\( 12 \\)",
    "\\( 18 \\)"
  ],
  correctIndex: 1,
  hint: "List all whole numbers that divide evenly into \\( 12 \\) without leaving a remainder.",
  explanation: [
    "\\( 12 = 1 \\times 12 \\)",
    "\\( 12 = 2 \\times 6 \\)",
    "\\( 12 = 3 \\times 4 \\)",
    "\\( \\text{Factors} = \\{1, 2, 3, 4, 6, 12\\} \\)",
    "\\( \\text{Count} = 6 \\)"
  ]
},
{
  question: "The digits \\( 2, 3, 5, 6 \\) and \\( 9 \\) are each used once to form the greatest possible odd five-digit number. The digit in the tens place is?",
  image: null,
  options: [
    "\\( 5 \\)",
    "\\( 9 \\)",
    "\\( 3 \\)",
    "\\( 6 \\)",
    "\\( 2 \\)"
  ],
  correctIndex: 4,
  hint: "To maximise the number, arrange digits in descending order. The units digit must be odd — use the smallest odd digit available.",
  explanation: [
    "\\( \\text{Digits: } \\{2, 3, 5, 6, 9\\} \\)",
    "\\( \\text{Units digit must be odd} \\Rightarrow \\text{use smallest odd digit} = 3 \\)",
    "\\( \\text{Remaining: } \\{9, 6, 5, 2\\} \\Rightarrow \\text{arrange descending} \\)",
    "\\( \\text{Number} = 96523 \\)",
    "\\( \\text{Tens digit} = 2 \\)"
  ]
},
{
  question: "Which one is the equivalent fraction of \\( \\dfrac{1}{2} \\)?",
  image: null,
  options: [
    "\\( \\dfrac{6}{12} \\)",
    "\\( \\dfrac{3}{5} \\)",
    "\\( \\dfrac{1}{4} \\)",
    "\\( \\dfrac{2}{5} \\)",
    "\\( \\dfrac{2}{8} \\)"
  ],
  correctIndex: 0,
  hint: "Simplify each fraction to see which one reduces to \\( \\dfrac{1}{2} \\).",
  explanation: [
    "\\( \\dfrac{6}{12} = \\dfrac{6 \\div 6}{12 \\div 6} \\)",
    "\\( = \\dfrac{1}{2} \\)",
    "\\( \\therefore \\dfrac{6}{12} \\equiv \\dfrac{1}{2} \\)"
  ]
},
{
  question: "Write \\( 48 \\) in index form",
  image: null,
  options: [
    "\\( 2^4 \\times 3 \\)",
    "\\( 2^3 \\times 3 \\)",
    "\\( 2^5 \\times 3 \\)",
    "\\( 2^3 \\times 3^2 \\)",
    "\\( 2 \\times 24 \\)"
  ],
  correctIndex: 0,
  hint: "Find the prime factorization of \\( 48 \\) by repeatedly dividing by prime numbers.",
  explanation: [
    "\\( 48 \\div 2 = 24 \\)",
    "\\( 24 \\div 2 = 12 \\)",
    "\\( 12 \\div 2 = 6 \\)",
    "\\( 6 \\div 2 = 3 \\)",
    "\\( 48 = 2 \\times 2 \\times 2 \\times 2 \\times 3 \\)",
    "\\( = 2^4 \\times 3 \\)"
  ]
},
{
  question: "The smallest decimal among the following is?",
  image: null,
  options: [
    "\\( 0.0634 \\)",
    "\\( 0.634 \\)",
    "\\( 0.0643 \\)",
    "\\( 1.634 \\)",
    "\\( 0.6001 \\)"
  ],
  correctIndex: 0,
  hint: "Compare digits from left to right: integer part first, then tenths, hundredths, thousandths.",
  explanation: [
    "\\( 1.634 \\text{ — largest (integer part = 1)} \\)",
    "\\( 0.634, 0.6001 \\text{ — tenths digit = 6} \\)",
    "\\( 0.0634, 0.0643 \\text{ — tenths digit = 0 (smaller)} \\)",
    "\\( \\text{Compare thousandths: } 0.0634 \\text{ has } 3, \\quad 0.0643 \\text{ has } 4 \\)",
    "\\( 3 < 4 \\)",
    "\\( \\therefore 0.0634 \\text{ is the smallest} \\)"
  ]
},
{
  question: "The perimeter of a rectangle is \\( 60 \\text{ cm} \\). Its breadth is \\( 10 \\text{ cm} \\), find the length.",
  image: null,
  options: [
    "\\( 10 \\text{ cm} \\)",
    "\\( 20 \\text{ cm} \\)",
    "\\( 30 \\text{ cm} \\)",
    "\\( 40 \\text{ cm} \\)",
    "\\( 50 \\text{ cm} \\)"
  ],
  correctIndex: 1,
  hint: "Use the formula: \\( P = 2(l + b) \\). Substitute \\( P = 60 \\) and \\( b = 10 \\), then solve for \\( l \\).",
  explanation: [
    "\\( P = 2(l + b) \\)",
    "\\( 60 = 2(l + 10) \\)",
    "\\( \\dfrac{60}{2} = l + 10 \\)",
    "\\( 30 = l + 10 \\)",
    "\\( l = 30 - 10 \\)",
    "\\( l = 20 \\text{ cm} \\)"
  ]
},
{
  question: "Evaluate \\( 4 - 0.6 \\)",
  image: null,
  options: [
    "\\( 0.2 \\)",
    "\\( 2.0 \\)",
    "\\( 2.2 \\)",
    "\\( 3.4 \\)",
    "\\( 4.6 \\)"
  ],
  correctIndex: 3,
  hint: "Write \\( 4 \\) as \\( 4.0 \\) to align the decimal points, then subtract.",
  explanation: [
    "\\( 4.0 - 0.6 \\)",
    "\\( = 3.4 \\)"
  ]
},
{
  question: "Divide \\( 3.888 \\) by \\( 7.2 \\)",
  image: null,
  options: [
    "\\( 5.4 \\)",
    "\\( 0.54 \\)",
    "\\( 0.054 \\)",
    "\\( 0.0054 \\)",
    "\\( 54 \\)"
  ],
  correctIndex: 1,
  hint: "Multiply both numbers by \\( 10 \\) to remove the decimal from the divisor, then divide \\( 38.88 \\) by \\( 72 \\).",
  explanation: [
    "\\( \\dfrac{3.888}{7.2} = \\dfrac{3.888 \\times 10}{7.2 \\times 10} \\)",
    "\\( = \\dfrac{38.88}{72} \\)",
    "\\( = 0.54 \\)"
  ]
},
{
  question: "Which of the following is both a perfect cube and perfect square?",
  image: null,
  options: [
    "\\( 64 \\)",
    "\\( 81 \\)",
    "\\( 9 \\)",
    "\\( 40 \\)",
    "\\( 110 \\)"
  ],
  correctIndex: 0,
  hint: "A number that is both a perfect square and perfect cube satisfies \\( n = x^6 \\) for some integer \\( x \\).",
  explanation: [
    "\\( 64 = 8^2 \\Rightarrow \\text{perfect square} \\)",
    "\\( 64 = 4^3 \\Rightarrow \\text{perfect cube} \\)",
    "\\( 64 = 2^6 \\)",
    "\\( 81 = 9^2 \\text{ but } 81 \\neq n^3 \\text{ for integer } n \\)",
    "\\( 9 = 3^2 \\text{ but } 9 \\neq n^3 \\text{ for integer } n \\)",
    "\\( \\therefore 64 \\text{ is both a perfect square and perfect cube} \\)"
  ]
},
{
  question: "What is the value of \\( n \\) in \\( 1{,}420{,}628 + n = 3{,}928{,}716 \\)?",
  image: null,
  options: [
    "\\( 2{,}508{,}088 \\)",
    "\\( 2{,}508{,}188 \\)",
    "\\( 5{,}349{,}344 \\)",
    "\\( 2{,}408{,}088 \\)",
    "\\( 2{,}518{,}088 \\)"
  ],
  correctIndex: 0,
  hint: "Subtract \\( 1{,}420{,}628 \\) from both sides of the equation to isolate \\( n \\).",
  explanation: [
    "\\( 1{,}420{,}628 + n = 3{,}928{,}716 \\)",
    "\\( n = 3{,}928{,}716 - 1{,}420{,}628 \\)",
    "\\( n = 2{,}508{,}088 \\)"
  ]
},
{
  question: "Divide \\( 2.58 \\) by \\( 0.7 \\), giving the answer correct to \\( 2 \\) decimal places.",
  image: null,
  options: [
    "\\( 3.68 \\)",
    "\\( 3.69 \\)",
    "\\( 3.70 \\)",
    "\\( 0.37 \\)",
    "\\( 36.86 \\)"
  ],
  correctIndex: 1,
  hint: "Multiply both numbers by \\( 10 \\) to get \\( 25.8 \\div 7 \\). Calculate to 3 d.p., then round.",
  explanation: [
    "\\( \\dfrac{2.58}{0.7} = \\dfrac{25.8}{7} \\)",
    "\\( 25.8 \\div 7 = 3.685\\overline{7}\\ldots \\)",
    "\\( \\text{3rd decimal digit} = 5 \\geq 5 \\Rightarrow \\text{round up} \\)",
    "\\( \\approx 3.69 \\)"
  ]
},
{
  question: "Simplify \\( 7 \\times 6 + 8 \\div 2 \\)",
  image: null,
  options: [
    "\\( 25 \\)",
    "\\( 46 \\)",
    "\\( 38 \\)",
    "\\( 45 \\)",
    "\\( 50 \\)"
  ],
  correctIndex: 1,
  hint: "Follow BODMAS: perform division and multiplication before addition.",
  explanation: [
    "\\( 7 \\times 6 = 42 \\)",
    "\\( 8 \\div 2 = 4 \\)",
    "\\( 42 + 4 = 46 \\)"
  ]
},
{
  question: "Express \\( \\dfrac{1}{8} \\) as a percentage",
  image: null,
  options: [
    "\\( 12.5\\% \\)",
    "\\( 8\\% \\)",
    "\\( 0.125\\% \\)",
    "\\( 80\\% \\)",
    "\\( 1.25\\% \\)"
  ],
  correctIndex: 0,
  hint: "Multiply the fraction by \\( 100\\% \\) to convert it to a percentage.",
  explanation: [
    "\\( \\dfrac{1}{8} \\times 100\\% \\)",
    "\\( = \\dfrac{100}{8}\\% \\)",
    "\\( = 12.5\\% \\)"
  ]
},
{
  question: "Taiwo, Kehinde and Idowu are to share \\( \\$600 \\) in the ratio \\( 3:2:1 \\) respectively. What is Idowu's share?",
  image: null,
  options: [
    "\\( \\$100 \\)",
    "\\( \\$200 \\)",
    "\\( \\$300 \\)",
    "\\( \\$400 \\)",
    "\\( \\$50 \\)"
  ],
  correctIndex: 0,
  hint: "Find the total number of ratio parts, then determine the value of one part.",
  explanation: [
    "\\( \\text{Total parts} = 3 + 2 + 1 = 6 \\)",
    "\\( \\text{Value of 1 part} = \\dfrac{\\$600}{6} \\)",
    "\\( = \\$100 \\)",
    "\\( \\text{Idowu's share} = 1 \\times \\$100 \\)",
    "\\( = \\$100 \\)"
  ]
},
{
  question: "Ayodeji is thinking of two whole numbers. Their product is \\( 132 \\) and their sum is \\( 23 \\). What is the smaller number?",
  image: null,
  options: [
    "\\( 11 \\)",
    "\\( 12 \\)",
    "\\( 6 \\)",
    "\\( 22 \\)",
    "\\( 2 \\)"
  ],
  correctIndex: 0,
  hint: "Find factor pairs of \\( 132 \\) that add up to \\( 23 \\).",
  explanation: [
    "\\( x \\times y = 132, \\quad x + y = 23 \\)",
    "\\( 1 \\times 132 \\Rightarrow \\text{sum} = 133 \\)",
    "\\( 2 \\times 66 \\Rightarrow \\text{sum} = 68 \\)",
    "\\( 3 \\times 44 \\Rightarrow \\text{sum} = 47 \\)",
    "\\( 4 \\times 33 \\Rightarrow \\text{sum} = 37 \\)",
    "\\( 6 \\times 22 \\Rightarrow \\text{sum} = 28 \\)",
    "\\( 11 \\times 12 \\Rightarrow \\text{sum} = 23 \\checkmark \\)",
    "\\( \\therefore \\text{smaller number} = 11 \\)"
  ]
},
{
  question: "Find the value of \\( 6\\dfrac{1}{4}\\% \\) of \\( \\$1200 \\)",
  image: null,
  options: [
    "\\( \\$60 \\)",
    "\\( \\$72 \\)",
    "\\( \\$75 \\)",
    "\\( \\$80 \\)",
    "\\( \\$125 \\)"
  ],
  correctIndex: 2,
  hint: "Convert \\( 6\\dfrac{1}{4}\\% \\) to a fraction: \\( \\dfrac{25}{4}\\% = \\dfrac{25}{400} = \\dfrac{1}{16} \\), then multiply by \\( 1200 \\).",
  explanation: [
    "\\( 6\\dfrac{1}{4}\\% = \\dfrac{25}{4}\\% \\)",
    "\\( = \\dfrac{25}{400} \\)",
    "\\( = \\dfrac{1}{16} \\)",
    "\\( \\text{Value} = \\dfrac{1}{16} \\times 1200 \\)",
    "\\( = \\dfrac{1200}{16} \\)",
    "\\( = \\$75 \\)"
  ]
},
{
  question: "If \\( £120 \\) is shared between Cole, Ella, and Vicky. Cole receives \\( \\dfrac{5}{8} \\) of the money and Ella receives \\( \\dfrac{2}{3} \\) of the remainder while Vicky received the rest. How much more money does Cole receive than Vicky?",
  image: null,
  options: [
    "\\( £45 \\)",
    "\\( £50 \\)",
    "\\( £60 \\)",
    "\\( £75 \\)",
    "\\( £15 \\)"
  ],
  correctIndex: 2,
  hint: "Calculate Cole's share first, then find the remainder, then Ella's and Vicky's shares.",
  explanation: [
    "\\( \\text{Cole} = \\dfrac{5}{8} \\times 120 \\)",
    "\\( = £75 \\)",
    "\\( \\text{Remainder} = 120 - 75 \\)",
    "\\( = £45 \\)",
    "\\( \\text{Ella} = \\dfrac{2}{3} \\times 45 \\)",
    "\\( = £30 \\)",
    "\\( \\text{Vicky} = 45 - 30 \\)",
    "\\( = £15 \\)",
    "\\( \\text{Cole} - \\text{Vicky} = 75 - 15 \\)",
    "\\( = £60 \\)"
  ]
},
{
  question: "The diagram below shows \\( 3 \\) angles on a straight line. What is the sum of the two smaller angles?",
  image: './q49.svg',
  options: [
    "\\( 105^{\\circ} \\)",
    "\\( 75^{\\circ} \\)",
    "\\( 120^{\\circ} \\)",
    "\\( 45^{\\circ} \\)",
    "\\( 135^{\\circ} \\)"
  ],
  correctIndex: 0,
  hint: "Angles on a straight line add up to \\( 180^{\\circ} \\). The three angles are \\( 60^{\\circ} \\), \\( 5x^{\\circ} \\), and \\( 3x^{\\circ} \\).",
  explanation: [
    "\\( 60 + 5x + 3x = 180 \\)",
    "\\( 60 + 8x = 180 \\)",
    "\\( 8x = 120 \\)",
    "\\( x = \\dfrac{120}{8} \\)",
    "\\( x = 15 \\)",
    "\\( 5x = 5 \\times 15 = 75^{\\circ} \\)",
    "\\( 3x = 3 \\times 15 = 45^{\\circ} \\)",
    "\\( \\text{Two smaller angles} = 45^{\\circ} + 60^{\\circ} \\)",
    "\\( = 105^{\\circ} \\)"
  ]
},
{
  question: "What is the area of the square below in \\( \\text{cm}^2 \\)?",
  image: './q50.svg',
  options: [
    "\\( 10 \\)",
    "\\( 20 \\)",
    "\\( 25 \\)",
    "\\( 5 \\)",
    "\\( 15 \\)"
  ],
  correctIndex: 2,
  hint: "The area of a square is \\( s^2 \\), where \\( s \\) is the side length.",
  explanation: [
    "\\( s = 5 \\text{ cm} \\)",
    "\\( A = s^2 \\)",
    "\\( = 5^2 \\)",
    "\\( = 25 \\text{ cm}^2 \\)"
  ]
}];


setupQuiz(quizData, 3600)