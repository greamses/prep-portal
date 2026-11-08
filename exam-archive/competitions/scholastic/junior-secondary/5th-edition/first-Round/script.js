import setupQuiz from '../../../../question.js';

// Scholastic Champs Maths Competition — Junior Secondary, First Round, 5th Edition.
// 30 objective + 10 subjective questions. Transcribed from the paper.
const q = (question, options, correctIndex, explanation, topic, extra = {}) =>
  ({ question, image: null, options, correctIndex, explanation, topic, ...extra });
const s = (question, answer, explanation, topic, extra = {}) =>
  ({ question, image: null, options: [], correctIndex: null, answer, explanation, topic, ...extra });

const TABLE = "The table shows the scores of a certain number of students in a class. Score: \\(2, 4, 5, 6, 7\\); number of students: \\(5, 3, 6, 4, 2\\).";

const quizData = [
  q("Change the number \\(1010_{\\text{two}}\\) to base ten.", ["\\(40_{\\text{ten}}\\)", "\\(14_{\\text{ten}}\\)", "\\(18_{\\text{ten}}\\)", "\\(10_{\\text{ten}}\\)", "\\(36_{\\text{ten}}\\)"], 3, ["\\(8 + 0 + 2 + 0 = 10\\)."], "Number Bases"),
  q("The sum of three consecutive odd numbers is \\(105\\). The median of the three numbers is:", ["\\(15\\)", "\\(27\\)", "\\(35\\)", "\\(47\\)", "\\(59\\)"], 2, ["The middle number is \\(105 \\div 3 = 35\\)."], "Statistics"),
  q("If the bearing of \\(A\\) from \\(B\\) is \\(35^{\\circ}\\), what is the bearing of \\(B\\) from \\(A\\)?", ["\\(35^{\\circ}\\)", "\\(215^{\\circ}\\)", "\\(135^{\\circ}\\)", "\\(315^{\\circ}\\)", "\\(360^{\\circ}\\)"], 1, ["The back bearing is \\(35 + 180 = 215^{\\circ}\\)."], "Bearings"),
  q("Find the diameter of a circle whose circumference is \\(22\\text{ cm}\\).", ["\\(44\\text{ cm}\\)", "\\(28\\text{ cm}\\)", "\\(22\\text{ cm}\\)", "\\(14\\text{ cm}\\)", "\\(7\\text{ cm}\\)"], 4, ["\\(\\frac{22}{7} \\times d = 22\\), so \\(d = 7\\text{ cm}\\)."], "Circles"),
  q("Find the sum of the prime factors of \\(30\\).", ["\\(5\\)", "\\(7\\)", "\\(8\\)", "\\(10\\)", "\\(12\\)"], 3, ["\\(30 = 2 \\times 3 \\times 5\\); \\(2 + 3 + 5 = 10\\)."], "Prime Factors"),
  q("A rectangular room \\(6\\text{ m}\\) long by \\(5\\text{ m}\\) wide contains \\(120\\text{ m}^{3}\\) of air. Calculate the height of the room.", ["\\(3\\text{ m}\\)", "\\(4\\text{ m}\\)", "\\(5\\text{ m}\\)", "\\(6\\text{ m}\\)", "\\(12\\text{ m}\\)"], 1, ["\\(120 \\div (6 \\times 5) = 4\\text{ m}\\)."], "Mensuration"),
  q("Decrease \\(1500\\text{ kg}\\) by \\(15\\%\\).", ["\\(300\\text{ kg}\\)", "\\(1725\\text{ kg}\\)", "\\(3825\\text{ kg}\\)", "\\(1275\\text{ kg}\\)", "\\(22500\\text{ kg}\\)"], 3, ["\\(85\\%\\) of \\(1500 = 1275\\text{ kg}\\)."], "Percentages"),
  q("If \\(₦45,000.00\\) is shared among \\(3\\) people in the ratio \\(5 : 4 : 3\\), what is the least share?", ["\\(₦11,250.00\\)", "\\(₦15,000.00\\)", "\\(₦18,750.00\\)", "\\(₦24,800.00\\)", "\\(₦96,000.00\\)"], 0, ["\\(\\frac{3}{12} \\times 45\\,000 = ₦11,250\\)."], "Ratio"),
  q("Simplify \\(\\frac{3}{8}\\) of \\(2\\tfrac{2}{9} \\times 1\\tfrac{3}{5}\\).", ["\\(1\\tfrac{1}{3}\\)", "\\(1\\tfrac{2}{3}\\)", "\\(2\\tfrac{1}{3}\\)", "\\(2\\tfrac{2}{3}\\)", "\\(3\\tfrac{1}{3}\\)"], 0, ["\\(\\frac{3}{8} \\times \\frac{20}{9} \\times \\frac{8}{5} = \\frac{4}{3} = 1\\tfrac{1}{3}\\)."], "Fractions"),
  q("By how much is \\(75\\%\\) of \\(₦1000\\) greater than \\(25\\%\\) of \\(₦600\\)?", ["\\(₦160\\)", "\\(₦350\\)", "\\(₦90\\)", "\\(₦750\\)", "\\(₦600\\)"], 4, ["\\(750 - 150 = ₦600\\)."], "Percentages"),
  q("The temperature during the day in a cold country is \\(8^{\\circ}\\text{C}\\). At night the temperature falls by \\(10^{\\circ}\\text{C}\\). What is the night temperature?", ["\\(-2^{\\circ}\\text{C}\\)", "\\(+4^{\\circ}\\text{C}\\)", "\\(+18^{\\circ}\\text{C}\\)", "\\(-18^{\\circ}\\text{C}\\)", "\\(-80^{\\circ}\\text{C}\\)"], 0, ["\\(8 - 10 = -2^{\\circ}\\text{C}\\)."], "Directed Numbers"),
  q("Three-quarters of the eggs in a basket are good. If there are \\(300\\) eggs in the basket, how many eggs are bad?", ["\\(120\\)", "\\(125\\)", "\\(150\\)", "\\(75\\)", "\\(35\\)"], 3, ["One quarter is bad: \\(\\frac{1}{4} \\times 300 = 75\\)."], "Fractions"),
  q("Make \\(x\\) the subject of the formula in this equation: \\(2xy = w + x\\).", ["\\(\\frac{w}{2x + 1}\\)", "\\(\\frac{x}{2w + 3}\\)", "\\(\\frac{w}{2y - 1}\\)", "\\(\\frac{w}{2y - 3}\\)", "\\(\\frac{x}{2w - 3}\\)"], 2, ["\\(2xy - x = w\\), so \\(x(2y - 1) = w\\) and \\(x = \\frac{w}{2y - 1}\\)."], "Change of Subject"),
  q("Find the value of \\(y\\) if \\(\\frac{10}{y - 3} = -2\\).", ["\\(-2\\)", "\\(-0.5\\)", "\\(\\frac{1}{2}\\)", "\\(-2.5\\)", "\\(5.5\\)"], 0, ["\\(y - 3 = -5\\), so \\(y = -2\\)."], "Algebra"),
  q("The Lowest Common Multiple of \\(10a^{2}b\\) and \\(8ab\\) is:", ["\\(2a^{2}b\\)", "\\(2ab\\)", "\\(4a\\)", "\\(40a^{2}b\\)", "\\(18ab\\)"], 3, ["LCM of \\(10\\) and \\(8\\) is \\(40\\); highest powers \\(a^{2}\\) and \\(b\\). LCM \\(= 40a^{2}b\\)."], "HCF and LCM"),
  q("The probability of passing an examination is \\(0.11\\). What is the probability of failing the examination?", ["\\(0.99\\)", "\\(0.23\\)", "\\(0.89\\)", "\\(0.72\\)", "\\(0.77\\)"], 2, ["\\(1 - 0.11 = 0.89\\)."], "Probability"),
  q("Find the smallest number by which \\(60\\) must be multiplied so that the product is a perfect square.", ["\\(7\\)", "\\(12\\)", "\\(14\\)", "\\(8\\)", "\\(15\\)"], 4, ["\\(60 = 2^{2} \\times 3 \\times 5\\); multiply by \\(15\\) to get \\(900 = 30^{2}\\)."], "Indices"),
  q("A girl is standing at a point \\(8\\text{ m}\\) away from a building, making an angle of elevation of \\(45^{\\circ}\\) with the top of the building. Find the height of the building.", ["\\(4\\text{ m}\\)", "\\(5\\text{ m}\\)", "\\(8\\text{ m}\\)", "\\(37\\text{ m}\\)", "\\(53\\text{ m}\\)"], 2, ["\\(h = 8 \\tan 45^{\\circ} = 8\\text{ m}\\)."], "Trigonometry"),
  q("Approximate \\(234.657\\) to \\(2\\) significant figures.", ["\\(230.652\\)", "\\(230\\)", "\\(220\\)", "\\(234.66\\)", "\\(240\\)"], 1, ["The third figure is \\(4\\), so round down: \\(230\\)."], "Approximation"),
  q(TABLE + " Find the modal score.", ["\\(2\\)", "\\(4\\)", "\\(5\\)", "\\(6\\)", "\\(7\\)"], 2, ["The score \\(5\\) has the most students (\\(6\\))."], "Statistics"),
  q(TABLE + " If \\(70\\%\\) of the students failed, what is the pass mark?", ["\\(2\\)", "\\(4\\)", "\\(5\\)", "\\(6\\)", "\\(7\\)"], 3, ["There are \\(20\\) students; \\(70\\%\\) is \\(14\\).", "\\(5 + 3 + 6 = 14\\) students scored \\(5\\) or less, so the pass mark is \\(6\\)."], "Statistics"),
  q("The five-digit number \\(24X8Y\\) is divisible by \\(4\\), \\(5\\) and \\(9\\). What is the sum of \\(X\\) and \\(Y\\)?", ["\\(13\\)", "\\(10\\)", "\\(9\\)", "\\(5\\)", "\\(4\\)"], 4, ["Divisible by \\(5\\) and \\(4\\): \\(Y = 0\\) (\\(80\\) is a multiple of \\(4\\)).", "Digit sum \\(2 + 4 + X + 8 + 0 = 14 + X\\) must be a multiple of \\(9\\): \\(X = 4\\).", "\\(X + Y = 4\\)."], "Divisibility"),
  q("The inequality graph represents which of the given options?", ["\\(x > -2\\)", "\\(x < -1\\)", "\\(x < -2\\)", "\\(x > -1\\)", "\\(x \\le -1\\)"], 3, ["An open circle at \\(-1\\) with the arrow to the right: \\(x > -1\\)."], "Inequalities", { image: "./q23.svg" }),
  q("Find the sum of all the interior angles of a polygon having \\(9\\) sides.", ["\\(180^{\\circ}\\)", "\\(360^{\\circ}\\)", "\\(720^{\\circ}\\)", "\\(1260^{\\circ}\\)", "\\(900^{\\circ}\\)"], 3, ["\\((9 - 2) \\times 180^{\\circ} = 1260^{\\circ}\\)."], "Polygons"),
  q("A sector of a circle of radius \\(4\\text{ cm}\\) has an angle of \\(45^{\\circ}\\). What is its area in \\(\\text{cm}^{2}\\) in terms of \\(\\pi\\)?", ["\\(9\\pi\\)", "\\(2\\pi\\)", "\\(4\\pi\\)", "\\(8\\pi\\)", "\\(22\\pi\\)"], 1, ["\\(\\frac{45}{360} \\times \\pi \\times 4^{2} = 2\\pi\\)."], "Circles"),
  q("John has \\(6\\) sisters and \\(3\\) brothers. His sister Jane has \\(P\\) sisters and \\(Q\\) brothers. What is the sum of \\(P\\) and \\(Q\\)?", ["\\(3\\)", "\\(5\\)", "\\(9\\)", "\\(10\\)", "\\(11\\)"], 2, ["Jane has \\(5\\) sisters, and \\(4\\) brothers (John's \\(3\\) plus John).", "\\(5 + 4 = 9\\)."], "Logic"),
  q("Two angles of a triangle are \\(40^{\\circ}\\) and \\(80^{\\circ}\\). The triangle is:", ["Right angled", "Obtuse angled", "Equilateral", "Isosceles", "Scalene"], 4, ["The third angle is \\(60^{\\circ}\\). All three angles differ, so all sides differ: scalene."], "Triangles"),
  q("Fubara bought a bike for \\(₦200000\\). He wants to sell it making a \\(10\\%\\) profit. What is the selling price of the bike?", ["\\(₦200020\\)", "\\(₦220000\\)", "\\(₦210000\\)", "\\(₦200010\\)", "\\(₦202000\\)"], 1, ["\\(110\\%\\) of \\(200\\,000 = ₦220\\,000\\)."], "Profit and Loss"),
  q("Eight people meet for a particular programme. Each person shakes hands once with every other person present. How many handshakes took place?", ["\\(28\\)", "\\(29\\)", "\\(30\\)", "\\(60\\)", "\\(64\\)"], 0, ["\\(\\frac{8 \\times 7}{2} = 28\\)."], "Counting"),
  q("In the expansion of \\((x - 4)(x - 5)\\), what is the coefficient of \\(x\\)?", ["\\(-9\\)", "\\(-2\\)", "\\(+1\\)", "\\(+7\\)", "\\(+4\\)"], 0, ["\\(x^{2} - 5x - 4x + 20 = x^{2} - 9x + 20\\)."], "Expansion"),
  // ── SECTION B: SUBJECTIVE ──
  s("A trapezium has an area of \\(d\\text{ m}^{2}\\). Its two parallel sides are \\(19\\text{ m}\\) and \\(11\\text{ m}\\) long and the distance between them is \\(9\\text{ m}\\). Find the value of \\(d\\).", "\\(135\\)", ["\\(\\frac{1}{2}(19 + 11) \\times 9 = 135\\)."], "Mensuration"),
  s("In an examination, a student scored \\(60\\) marks out of a possible \\(80\\). What percentage is this?", "\\(75\\%\\)", ["\\(\\frac{60}{80} \\times 100 = 75\\%\\)."], "Percentages"),
  s("If \\(x = 2y - 1\\) and \\(2x = 3y + 2\\), find \\(y\\).", "\\(y = 4\\)", ["\\(2(2y - 1) = 3y + 2\\), so \\(4y - 2 = 3y + 2\\) and \\(y = 4\\)."], "Simultaneous Equations"),
  s("Factorise \\(8ax^{2}y - 16ay\\).", "\\(8ay(x^{2} - 2)\\)", ["The common factor is \\(8ay\\): \\(8ay(x^{2} - 2)\\)."], "Factorisation"),
  s("Solve \\(8(2d - 3) = 3(4d - 7)\\).", "\\(d = \\frac{3}{4}\\)", ["\\(16d - 24 = 12d - 21\\), so \\(4d = 3\\) and \\(d = \\frac{3}{4}\\)."], "Algebra"),
  s("A car travelled \\(80\\text{ km}\\) in \\(48\\) minutes. Find the speed of the car in km/h.", "\\(100\\text{ km/h}\\)", ["\\(48\\) minutes \\(= 0.8\\) hours; \\(80 \\div 0.8 = 100\\text{ km/h}\\)."], "Speed"),
  s("Express \\(0.0104\\) in standard form.", "\\(1.04 \\times 10^{-2}\\)", ["Move the point two places right: \\(1.04 \\times 10^{-2}\\)."], "Standard Form"),
  s("Calculate the size of the largest angle in the diagram.", "\\(80^{\\circ}\\)", ["The angles on the straight line at \\(O\\) add up to \\(180^{\\circ}\\): \\(20 + 2x + 5x + 3x = 180\\), so \\(x = 16\\).", "The largest is \\(5x = 80^{\\circ}\\)."], "Angles", { image: "./q38.svg" }),
  s("Calculate \\(\\frac{1}{2} - \\frac{3}{5} + \\frac{7}{10}\\).", "\\(\\frac{3}{5}\\)", ["\\(\\frac{5}{10} - \\frac{6}{10} + \\frac{7}{10} = \\frac{6}{10} = \\frac{3}{5}\\)."], "Fractions"),
  s("If \\(S = (5.42)^{2} - (4.58)^{2}\\), find \\(S\\).", "\\(8.4\\)", ["Difference of two squares: \\((5.42 - 4.58)(5.42 + 4.58) = 0.84 \\times 10 = 8.4\\)."], "Difference of Two Squares"),
];

setupQuiz(quizData, 2400);
