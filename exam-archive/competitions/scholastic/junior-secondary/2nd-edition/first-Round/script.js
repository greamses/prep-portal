import setupQuiz from '../../../../question.js';

// Scholastic Champs Maths Competition — Junior Secondary, First Round, 2nd Edition.
// 40 objective + 10 subjective questions. Transcribed from the paper.
const q = (question, options, correctIndex, explanation, topic, extra = {}) =>
  ({ question, image: null, options, correctIndex, explanation, topic, ...extra });
const s = (question, answer, explanation, topic, extra = {}) =>
  ({ question, image: null, options: [], correctIndex: null, answer, explanation, topic, ...extra });

const quizData = [
  q("Write in figures: Ninety-seven million, three hundred and five thousand, five hundred and thirty-four.", ["\\(93750534\\)", "\\(97305534\\)", "\\(9743745\\)", "\\(9475035\\)", "\\(9535034\\)"], 1, ["\\(97\\,000\\,000 + 305\\,000 + 534 = 97\\,305\\,534\\)."], "Place Value"),
  q("The temperature during the day in a cold country is \\(9^{\\circ}\\text{C}\\). At night the temperature falls by \\(13^{\\circ}\\text{C}\\). What is the night temperature?", ["\\(-4^{\\circ}\\text{C}\\)", "\\(+4^{\\circ}\\text{C}\\)", "\\(+13^{\\circ}\\text{C}\\)", "\\(-13^{\\circ}\\text{C}\\)", "\\(-117^{\\circ}\\text{C}\\)"], 0, ["\\(9 - 13 = -4^{\\circ}\\text{C}\\)."], "Directed Numbers"),
  q("The sum of \\(5\\) consecutive integers is \\(9000\\). What is the value of the greatest of these integers?", ["\\(8995\\)", "\\(1801\\)", "\\(1800\\)", "\\(1802\\)", "\\(1798\\)"], 3, ["The middle one is \\(9000 \\div 5 = 1800\\); the integers are \\(1798\\) to \\(1802\\).", "The greatest is \\(1802\\)."], "Number"),
  q("What is the answer to \\(\\sqrt{0.36}\\)?", ["\\(0.9\\)", "\\(0.6\\)", "\\(0.5\\)", "\\(0.4\\)", "\\(0.06\\)"], 1, ["\\(0.6 \\times 0.6 = 0.36\\)."], "Square Roots"),
  q("Express \\(\\$2\\tfrac{3}{4}\\) billion in digits only.", ["\\(\\$2\\,750\\,000\\)", "\\(\\$2\\,750\\,000\\,000\\)", "\\(\\$2\\,750\\,000\\,000\\,000\\)", "\\(\\$2\\,350\\,000\\,000\\)", "\\(\\$7\\,250\\,000\\,000\\)"], 1, ["\\(2.75 \\times 1\\,000\\,000\\,000 = 2\\,750\\,000\\,000\\)."], "Place Value"),
  q("Arrange \\(\\frac{3}{4}, \\frac{5}{6}, \\frac{7}{12}\\) and \\(\\frac{2}{3}\\) in ascending order.", ["\\(\\frac{3}{4}, \\frac{2}{3}, \\frac{5}{6}, \\frac{7}{12}\\)", "\\(\\frac{2}{3}, \\frac{7}{12}, \\frac{5}{6}, \\frac{3}{4}\\)", "\\(\\frac{5}{6}, \\frac{3}{4}, \\frac{2}{3}, \\frac{7}{12}\\)", "\\(\\frac{7}{12}, \\frac{2}{3}, \\frac{3}{4}, \\frac{5}{6}\\)", "\\(\\frac{7}{12}, \\frac{2}{3}, \\frac{5}{6}, \\frac{3}{4}\\)"], 3, ["In twelfths: \\(\\frac{9}{12}, \\frac{10}{12}, \\frac{7}{12}, \\frac{8}{12}\\).", "Smallest first: \\(\\frac{7}{12}, \\frac{2}{3}, \\frac{3}{4}, \\frac{5}{6}\\)."], "Fractions"),
  q("What is \\(702\\) thousandths as a decimal fraction?", ["\\(0.00702\\)", "\\(0.0072\\)", "\\(0.0702\\)", "\\(0.000702\\)", "\\(0.702\\)"], 4, ["\\(\\frac{702}{1000} = 0.702\\)."], "Decimals"),
  q("Express \\(\\frac{1}{8}\\) as a percentage.", ["\\(15.4\\%\\)", "\\(25\\%\\)", "\\(12.5\\%\\)", "\\(37.5\\%\\)", "\\(52.3\\%\\)"], 2, ["\\(\\frac{1}{8} \\times 100 = 12.5\\%\\)."], "Percentages"),
  q("Simplify: \\(2\\tfrac{2}{5} + 1\\tfrac{7}{10} - 2\\tfrac{1}{2}\\)", ["\\(1\\tfrac{3}{5}\\)", "\\(2\\tfrac{1}{5}\\)", "\\(3\\tfrac{1}{2}\\)", "\\(1\\tfrac{3}{4}\\)", "\\(4\\tfrac{2}{3}\\)"], 0, ["\\(2.4 + 1.7 - 2.5 = 1.6 = 1\\tfrac{3}{5}\\)."], "Fractions"),
  q("By how much is \\(25\\%\\) of \\(₦1000\\) greater than \\(15\\%\\) of \\(₦600\\)?", ["\\(₦160\\)", "\\(₦250\\)", "\\(₦90\\)", "\\(₦340\\)", "\\(₦180\\)"], 0, ["\\(250 - 90 = ₦160\\)."], "Percentages"),
  q("What is \\(\\frac{2}{3}\\) of \\(2\\tfrac{1}{2}\\) hours in minutes?", ["\\(90\\)", "\\(120\\)", "\\(100\\)", "\\(150\\)", "\\(60\\)"], 2, ["\\(2\\tfrac{1}{2}\\) hours \\(= 150\\) minutes; \\(\\frac{2}{3} \\times 150 = 100\\)."], "Time"),
  q("Convert \\(\\frac{7}{9}\\) to a decimal fraction.", ["\\(0.751\\)", "\\(0.778\\)", "\\(0.763\\)", "\\(0.749\\)", "\\(0.872\\)"], 1, ["\\(7 \\div 9 = 0.777\\ldots \\approx 0.778\\)."], "Decimals"),
  q("Find the smallest number which when divided by \\(7\\), \\(8\\) and \\(9\\) leaves a remainder of \\(2\\).", ["\\(450\\)", "\\(720\\)", "\\(504\\)", "\\(605\\)", "\\(506\\)"], 4, ["LCM of \\(7, 8, 9 = 504\\); \\(504 + 2 = 506\\)."], "HCF and LCM"),
  q("The first common multiple of \\(15\\) and \\(20\\) is?", ["\\(45\\)", "\\(40\\)", "\\(30\\)", "\\(80\\)", "\\(60\\)"], 4, ["LCM of \\(15\\) and \\(20 = 60\\)."], "HCF and LCM"),
  q("Find the \\(5^{\\text{th}}\\) multiple of a number if the \\(3^{\\text{rd}}\\) multiple is \\(72\\).", ["\\(48\\)", "\\(96\\)", "\\(120\\)", "\\(24\\)", "\\(36\\)"], 2, ["The number is \\(72 \\div 3 = 24\\); \\(5 \\times 24 = 120\\)."], "Factors and Multiples"),
  q("Express \\(240\\) as a product of its prime factors in index form.", ["\\(2^{4} \\times 3 \\times 5\\)", "\\(2^{3} \\times 3^{2} \\times 5\\)", "\\(2^{4} \\times 5 \\times 7\\)", "\\(2^{3} \\times 3 \\times 5\\)", "\\(2^{4} \\times 3^{2} \\times 5\\)"], 0, ["\\(240 = 16 \\times 15 = 2^{4} \\times 3 \\times 5\\)."], "Prime Factors"),
  q("Three-quarters of the eggs in a basket are good. If there are \\(120\\) eggs in the basket, how many eggs are bad?", ["\\(40\\)", "\\(30\\)", "\\(90\\)", "\\(25\\)", "\\(35\\)"], 1, ["One quarter is bad: \\(\\frac{1}{4} \\times 120 = 30\\)."], "Fractions"),
  q("Which of the following is sensible?", ["My pencil is 18 m long", "The car weighs about 1 tonne", "My mother is 150 mm tall", "He took 2 hours to tie his shoelaces", "The chicken cost #5"], 1, ["A car weighing about one tonne is sensible; the others are far too big or too small."], "Measurement"),
  q("Which one of the following is NOT equivalent to \\(\\frac{1}{2}\\)?", ["\\(\\frac{9}{18}\\)", "\\(\\frac{11}{22}\\)", "\\(\\frac{15}{21}\\)", "\\(\\frac{16}{32}\\)", "\\(\\frac{12}{24}\\)"], 2, ["\\(\\frac{15}{21} = \\frac{5}{7}\\), not \\(\\frac{1}{2}\\). The others all simplify to \\(\\frac{1}{2}\\)."], "Fractions"),
  q("If \\(13 = x - 5\\), then \\(x =\\)", ["\\(1\\)", "\\(8\\)", "\\(9\\)", "\\(16\\)", "\\(18\\)"], 4, ["\\(x = 13 + 5 = 18\\)."], "Algebra"),
  q("Jenna uses \\(36\\) beads to make \\(4\\) bracelets. How many of the same type of bracelet can Jenna make with \\(216\\) beads?", ["\\(12\\)", "\\(24\\)", "\\(27\\)", "\\(432\\)", "\\(972\\)"], 1, ["Each bracelet uses \\(9\\) beads; \\(216 \\div 9 = 24\\)."], "Proportion"),
  q("What is the value of \\(x\\) in the equation \\(3x + 5 = 17\\)?", ["\\(-4\\)", "\\(-3\\)", "\\(3\\)", "\\(4\\)", "\\(5\\)"], 3, ["\\(3x = 17 - 5 = 12\\), so \\(x = 4\\)."], "Algebra"),
  q("Write \\(1101_{\\text{two}}\\) in base \\(10\\).", ["\\(15\\)", "\\(14\\)", "\\(13\\)", "\\(12\\)", "\\(11\\)"], 2, ["\\(8 + 4 + 0 + 1 = 13\\)."], "Number Bases"),
  q("The next term in the sequence \\(2, 3, 5, 8, 12, 17, \\ldots\\) is", ["\\(18\\)", "\\(19\\)", "\\(22\\)", "\\(23\\)", "\\(24\\)"], 3, ["The differences are \\(1, 2, 3, 4, 5\\); next \\(17 + 6 = 23\\)."], "Sequences", { film: "seq-next-17" }),
  q("The LCM of \\(5ab^{2}\\) and \\(3a^{2}b\\) is:", ["\\(ab\\)", "\\(\\frac{3a}{5b}\\)", "\\(\\frac{5b}{3a}\\)", "\\(15a^{2}b^{2}\\)", "\\(15a^{3}b^{3}\\)"], 3, ["LCM \\(= 15 \\times a^{2} \\times b^{2}\\)."], "HCF and LCM"),
  q("Which one of the following is the inverse operation of add \\(8\\)?", ["Subtract \\(-8\\)", "Add \\(-\\frac{1}{8}\\)", "Subtract \\(-\\frac{1}{8}\\)", "Add \\(\\frac{1}{8}\\)", "Subtract \\(8\\)"], 4, ["Adding \\(8\\) is undone by subtracting \\(8\\)."], "Number"),
  q("What percentage of \\(4\\) is \\(5\\)?", ["\\(125\\%\\)", "\\(120\\%\\)", "\\(80\\%\\)", "\\(25\\%\\)", "\\(20\\%\\)"], 0, ["\\(\\frac{5}{4} \\times 100 = 125\\%\\)."], "Percentages"),
  q("What is the value of \\(5(a + b) - 3(b + c)\\) if \\(a = 4\\), \\(b = 3\\) and \\(c = 2\\)?", ["\\(50\\)", "\\(20\\)", "\\(18\\)", "\\(14\\)", "\\(10\\)"], 1, ["\\(5 \\times 7 - 3 \\times 5 = 35 - 15 = 20\\)."], "Algebra"),
  q("Which of the following is not a quadrilateral?", ["Parallelogram", "Rectangle", "Rhombus", "Regular pentagon", "Kite"], 3, ["A pentagon has five sides; a quadrilateral has four."], "Polygons"),
  q("Find the value of \\(y\\) if \\(\\frac{10}{y - 3} = -4\\).", ["\\(-2\\)", "\\(-0.5\\)", "\\(\\frac{1}{2}\\)", "\\(-2.5\\)", "\\(5.5\\)"], 2, ["\\(y - 3 = -2.5\\), so \\(y = 0.5\\)."], "Algebra"),
  q("Make \\(x\\) the subject of the formula \\(2xy = w + x\\).", ["\\(\\frac{w}{2x + 1}\\)", "\\(\\frac{x}{2w + 3}\\)", "\\(\\frac{w}{2y - 1}\\)", "\\(\\frac{w}{2y - 3}\\)", "\\(\\frac{x}{2w - 3}\\)"], 2, ["\\(2xy - x = w\\), so \\(x(2y - 1) = w\\) and \\(x = \\frac{w}{2y - 1}\\)."], "Change of Subject"),
  q("Evaluate \\(\\sqrt{7\\tfrac{1}{9}}\\).", ["\\(2\\tfrac{3}{7}\\)", "\\(3\\tfrac{4}{5}\\)", "\\(2\\tfrac{2}{3}\\)", "\\(1\\tfrac{4}{7}\\)", "\\(1\\tfrac{2}{3}\\)"], 2, ["\\(7\\tfrac{1}{9} = \\frac{64}{9}\\); \\(\\sqrt{\\frac{64}{9}} = \\frac{8}{3} = 2\\tfrac{2}{3}\\)."], "Square Roots"),
  q("Calculate \\(110_{\\text{two}} \\times 101_{\\text{two}}\\).", ["\\(11110_{\\text{two}}\\)", "\\(11101_{\\text{two}}\\)", "\\(11001_{\\text{two}}\\)", "\\(10101_{\\text{two}}\\)", "None of the above"], 0, ["\\(6 \\times 5 = 30 = 11110_{\\text{two}}\\)."], "Number Bases"),
  q("Find the sum of all the factors of \\(19\\).", ["\\(17\\)", "\\(18\\)", "\\(19\\)", "\\(20\\)", "\\(21\\)"], 3, ["\\(19\\) is prime: its factors are \\(1\\) and \\(19\\); \\(1 + 19 = 20\\)."], "Factors and Multiples"),
  q("Solve the equation \\(8y = 96\\).", ["\\(12\\)", "\\(10\\)", "\\(8\\)", "\\(6\\)", "\\(11\\)"], 0, ["\\(y = 96 \\div 8 = 12\\)."], "Algebra"),
  q("\\(9.058\\) to the nearest tenth is?", ["\\(10\\)", "\\(9\\)", "\\(9.1\\)", "\\(9.06\\)", "\\(9.0\\)"], 2, ["The hundredths digit is \\(5\\), so round up: \\(9.1\\)."], "Approximation"),
  q("Convert \\(37_{\\text{ten}}\\) to a number in base two.", ["\\(101001_{2}\\)", "\\(100101_{2}\\)", "\\(11101_{2}\\)", "\\(110010_{2}\\)", "\\(101101_{2}\\)"], 1, ["\\(37 = 32 + 4 + 1 = 100101_{2}\\)."], "Number Bases"),
  q("How much interest does \\(₦600\\) make in \\(5\\) years at \\(7\\%\\) per annum?", ["\\(₦140\\)", "\\(₦21\\)", "\\(₦300\\)", "\\(₦210\\)", "\\(₦165\\)"], 3, ["\\(\\frac{600 \\times 7 \\times 5}{100} = ₦210\\)."], "Simple Interest"),
  q("What is the reciprocal of \\(0.5\\)?", ["\\(1\\)", "\\(4\\)", "\\(\\frac{1}{2}\\)", "\\(0.25\\)", "\\(2\\)"], 4, ["\\(1 \\div 0.5 = 2\\)."], "Number"),
  q("Emeka bought a PS4 for \\(₦165,500\\). He sold it to Kelechi at a \\(20\\%\\) loss. What did Kelechi pay?", ["\\(₦180000\\)", "\\(₦135600\\)", "\\(₦132400\\)", "\\(₦140000\\)", "\\(₦152400\\)"], 2, ["\\(80\\%\\) of \\(165\\,500 = ₦132\\,400\\)."], "Profit and Loss", { film: "ps4-loss-20" }),
  // ── SECTION B: SUBJECTIVE ──
  s("A photograph measures \\(8\\text{ cm}\\) by \\(10\\text{ cm}\\). It is enlarged so that the shorter side becomes \\(12\\text{ cm}\\) and the longer side \\(x\\text{ cm}\\). Find \\(x\\).", "\\(15\\)", ["Scale factor \\(= 12 \\div 8 = 1.5\\); \\(x = 10 \\times 1.5 = 15\\)."], "Similarity"),
  s("Factorise \\(18ax^{2} - 12xay\\).", "\\(6ax(3x - 2y)\\)", ["The common factor is \\(6ax\\): \\(6ax(3x - 2y)\\)."], "Factorisation"),
  s("I think of a number. \\(19\\) subtracted from the number gives \\(-2\\). What number am I thinking of?", "\\(17\\)", ["\\(n - 19 = -2\\), so \\(n = 17\\)."], "Algebra"),
  s("Find the value of \\(0.8 \\div (0.17 - 0.09)\\).", "\\(10\\)", ["\\(0.17 - 0.09 = 0.08\\); \\(0.8 \\div 0.08 = 10\\)."], "Decimals"),
  s("Find the HCF of \\(32\\), \\(40\\) and \\(56\\).", "\\(8\\)", ["\\(32 = 2^{5}\\), \\(40 = 2^{3} \\times 5\\), \\(56 = 2^{3} \\times 7\\); HCF \\(= 2^{3} = 8\\)."], "HCF and LCM"),
  s("Solve the equation \\(5 - \\frac{2x}{3} = 1\\).", "\\(x = 6\\)", ["\\(\\frac{2x}{3} = 4\\), so \\(x = 6\\)."], "Algebra"),
  s("What is the complement of an angle of \\(70^{\\circ}\\)?", "\\(20^{\\circ}\\)", ["Complementary angles add up to \\(90^{\\circ}\\): \\(90 - 70 = 20^{\\circ}\\)."], "Angles"),
  s("The number which occurs most frequently in a set of numbers is called the ____.", "mode", ["The most frequent value is the mode."], "Statistics"),
  s("In the given figure, \\(AB = AC\\) and \\(\\angle ACD = 105^{\\circ}\\). What is \\(\\angle BAC\\)?", "\\(30^{\\circ}\\)", ["\\(\\angle ACB = 180 - 105 = 75^{\\circ}\\); \\(AB = AC\\), so \\(\\angle ABC = 75^{\\circ}\\).", "\\(\\angle BAC = 180 - 75 - 75 = 30^{\\circ}\\)."], "Triangles", { image: "./q49.svg" }),
  s("If the mean of \\(6\\) numbers is \\(17\\), then the sum of these numbers is ____.", "\\(102\\)", ["Sum \\(= 6 \\times 17 = 102\\)."], "Statistics"),
];

setupQuiz(quizData, 3600);
