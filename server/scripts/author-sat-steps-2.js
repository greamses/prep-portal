/* ═══════════════════════════════════════════════════════════════════════
   Author "animation steps" for the SAT math bank — BATCH 2 (indices 100-499).

   Same approach as author-sat-steps.js: every item solved & verified by hand,
   morph-ready LaTeX `steps`, with `answer` / `choices` / `question` overrides
   where the auto-generated item had a wrong key, an answer missing from the
   options, or a broken stem. Every change is logged on run.

   Usage (from repo root):
     node server/scripts/author-sat-steps-2.js          # apply 100-499
     node server/scripts/author-sat-steps-2.js --check   # validate only
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const MATH_DIR = path.join(ROOT, 'exam-archive', 'international', 'sat', 'math');
const CHECK_ONLY = process.argv.includes('--check');

const DATA = {
  100: { steps: ['c = \\sqrt{5^2 + 12^2}', 'c = \\sqrt{25 + 144}', 'c = \\sqrt{169}', 'c = 13'] },
  101: { steps: ['o = 80 - 50', 'o = 30'] },
  102: { steps: ['b = 60 - 20', 'b = 40'] },
  103: { steps: ['\\frac{(x+1)^2}{(x-1)(x+1)}', '\\frac{x+1}{x-1}', '\\frac{3+1}{3-1}', '\\frac{4}{2}', '2'] },
  104: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  105: { steps: ['P = 6 \\times 6', 'P = 36'] },
  106: { steps: ['r = \\sqrt{(5-2)^2 + (7-3)^2}', 'r = \\sqrt{9 + 16}', 'r = \\sqrt{25}', 'r = 5'] },
  107: { steps: ['C = 3.14 \\times 10', 'C = 31.4'] },
  108: { steps: ['\\angle ABC = \\frac{180 - 40}{2}', '\\angle ABC = \\frac{140}{2}', '\\angle ABC = 70'] },
  109: { steps: ['\\frac{1}{2} + \\frac{1}{4}', '\\frac{2}{4} + \\frac{1}{4}', '\\frac{3}{4}'] },
  110: { steps: ['c = 3 \\times 24', 'c = 72'] },
  111: { steps: ['2(0)^3 + 5(0)^2 - 4(0) - 3', '-3'] },
  112: { steps: ['f(\\sqrt{3}) = \\sqrt{(\\sqrt{3})^2 + 1}', 'f(\\sqrt{3}) = \\sqrt{3 + 1}', 'f(\\sqrt{3}) = \\sqrt{4}', 'f(\\sqrt{3}) = 2'] },
  113: { steps: ['x + 2 = 0', 'x = -2'] },
  114: { steps: ['f(-2) = (-2)^2 + 3(-2) - 4', 'f(-2) = 4 - 6 - 4', 'f(-2) = -6'] },
  115: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  116: { steps: ['f(-3) = \\sqrt{(-3)^2 + 1}', 'f(-3) = \\sqrt{9 + 1}', 'f(-3) = \\sqrt{10}'] },
  117: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  // [118] system gave y=20/11; fix 2x+5y=16 -> =18 so y=2 (key B)
  118: { steps: ['2(3y - 2) + 5y = 18', '6y - 4 + 5y = 18', '11y = 22', 'y = 2'], question: 'If $x = 3y - 2$ and $2x + 5y = 18$, what is the value of $y$?' },
  119: { steps: ['p = \\frac{120}{200}', 'p = 60\\%'] },
  120: { steps: ['A = 5^2', 'A = 25'] },
  121: { steps: ['a = 10 \\times \\sin(30^\\circ)', 'a = 10 \\times \\frac{1}{2}', 'a = 5'] },
  122: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  123: { steps: ['8\\sqrt{x} = 48', '\\sqrt{x} = 6', 'x = 36'] },
  124: { steps: ['f(4) = 3(4)^2 - 2', 'f(4) = 48 - 2', 'f(4) = 46'] },
  125: { steps: ['w = \\frac{180}{15}', 'w = 12'] },
  126: { steps: ['n = 100 - (60 + 40 - 20)', 'n = 100 - 80', 'n = 20'] },
  127: { steps: ['m = \\frac{4 - (-2)}{4 - 1}', 'm = \\frac{6}{3}', 'm = 2'] },
  128: { steps: ['(x+3)^2 = 0', 'x + 3 = 0', 'x = -3'] },
  // [129] (2x+3)/(x-7)=4 gave x=15.5; rewrite to (2x+3)/5=5 so x=11 (key D)
  129: { steps: ['\\frac{2x+3}{5} = 5', '2x + 3 = 25', '2x = 22', 'x = 11'], question: 'If $\\frac{2x+3}{5}=5$, what is the value of $x$?' },
  130: { steps: ['t = 150 \\times 3 + 50', 't = 450 + 50', 't = 500'], answer: 'B' },
  131: { steps: ['a = 60 - 10', 'a = 50'] },
  132: { steps: ['p = \\frac{150}{300}', 'p = 50\\%'] },
  133: { steps: ['x - 2 = 0', 'x = 2'] },
  134: { steps: ['x - 2 = 0', 'x = 2'] },
  135: { steps: ['x - 2 = 0', 'x = 2'] },
  // [136] f(-2)=-5, not in options -> option A
  136: { steps: ['f(x) = \\frac{(2x-1)(x+3)}{x+3}', 'f(x) = 2x - 1', 'f(-2) = 2(-2) - 1', 'f(-2) = -5'], choices: { A: '-5' } },
  // [137] f^{-1}(5)=16, not in options -> option D
  137: { steps: ['f^{-1}(x) = 2x + 6', 'f^{-1}(5) = 2(5) + 6', 'f^{-1}(5) = 10 + 6', 'f^{-1}(5) = 16'], choices: { D: '16' } },
  // [138] x+y true=4.4; fix 2x+3y=10 -> =14 so x+y=6 (key C)
  138: { steps: ['x = y + 2', '2(y+2) + 3y = 14', '5y = 10', 'y = 2', 'x + y = 6'], question: 'If $2x + 3y = 14$ and $x - y = 2$, what is the value of $x + y$?' },
  139: { steps: ['a = 60 - 20', 'a = 40'] },
  140: { steps: ['(x-1)^2 + (y+2)^2 = 5^2', '(x-1)^2 + (y+2)^2 = 25'] },
  // [141] f(-2)=15, not in options -> option D
  141: { steps: ['f(-2) = 2(-2)^2 - 3(-2) + 1', 'f(-2) = 8 + 6 + 1', 'f(-2) = 15'], choices: { D: '15' } },
  142: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  143: { steps: ['w = \\frac{72}{12}', 'w = 6'] },
  144: { steps: ['2x + 3 = 7', '2x = 4', 'x = 2'] },
  145: { steps: ['s = 2 \\times 5', 's = 10', 'A = 10^2', 'A = 100'] },
  146: { steps: ['A = 12 \\times 8', 'A = 96'] },
  147: { steps: ['D = (-2)^2 - 4(1)(-9)', 'D = 4 + 36', 'D = 40'] },
  148: { steps: ['A = 3.14 \\times 5^2', 'A = 3.14 \\times 25', 'A = 78.5'] },
  // [149] radius=9 (diameter 18), not in options -> option A
  149: { steps: ['d = |14 - (-4)|', 'd = 18', 'r = \\frac{18}{2}', 'r = 9'], choices: { A: '9' } },
  150: { steps: ['C = \\pi \\times 10', 'C = 10\\pi'] },
  // [151] neither=40 -> option B
  151: { steps: ['n = 200 - (120 + 100 - 60)', 'n = 200 - 160', 'n = 40'], answer: 'B' },
  152: { steps: ['3x - 2y = 10', 'x + 2y = 2', '4x = 12', 'x = 3'] },
  153: { steps: ['P = 6 \\times 6', 'P = 36'] },
  154: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  // [155] neither=15 -> option B
  155: { steps: ['n = 100 - (60 + 40 - 15)', 'n = 100 - 85', 'n = 15'], answer: 'B' },
  156: { steps: ['C = 2 \\times 3.14 \\times 5', 'C = 31.4'] },
  157: { steps: ['f(5) = 2(5) - 3', 'f(5) = 10 - 3', 'f(5) = 7'] },
  158: { steps: ['x + y = 5', 'x - y = 1', '2x = 6', 'x = 3'] },
  159: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  160: { steps: ['d = \\sqrt{6^2 - 4^2}', 'd = \\sqrt{36 - 16}', 'd = \\sqrt{20}'] },
  // [161] a=3, not in options -> option D
  161: { steps: ['2a^2 - 3a + 1 = 10', '2a^2 - 3a - 9 = 0', '(2a+3)(a-3) = 0', 'a = 3'], choices: { D: '3' } },
  162: { steps: ['c = \\frac{3.50}{6}', 'c = 0.58'] },
  163: { steps: ['x_1 + x_2 = -\\frac{-4}{1}', 'x_1 + x_2 = 4'] },
  // [164] f(2)=9 -> option A
  164: { steps: ['f(2) = 3(2)^2 - 2(2) + 1', 'f(2) = 12 - 4 + 1', 'f(2) = 9'], answer: 'A' },
  165: { steps: ['o = 100 - 60', 'o = 40'] },
  166: { steps: ['A = \\frac{72}{360} \\times \\pi \\times 5^2', 'A = \\frac{1}{5} \\times 25\\pi', 'A = 5\\pi'] },
  167: { steps: ['A = 8 \\times 5', 'A = 40'] },
  // [168] system gave x=2.4; fix 3x+2y=10 -> =13 so x=3 (key C)
  168: { steps: ['3x + 2y = 13', '2x - 2y = 2', '5x = 15', 'x = 3'], question: 'If $3x + 2y = 13$ and $x - y = 1$, what is the value of $x$?' },
  169: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  170: { steps: ['d = \\sqrt{10^2 + 10^2}', 'd = \\sqrt{200}', 'd = 10\\sqrt{2}'] },
  171: { steps: ['5 + 12 = 17', 'x < 17'] },
  // [172] roots 1±sqrt(10); fix x^2-2x-9 -> x^2-2x-3 so x=3 (key C)
  172: { steps: ['x^2 - 2x - 3 = 0', '(x-3)(x+1) = 0', 'x - 3 = 0', 'x = 3'], question: 'If $x^2 - 2x - 3 = 0$, which of the following is a possible value of $x$?' },
  // [173] fix 2x^2-5 -> 2x^2+5 so f(-3)=23 (key D)
  173: { steps: ['f(-3) = 2(-3)^2 + 5', 'f(-3) = 18 + 5', 'f(-3) = 23'], question: 'The function *f* is defined by *f*(x) = 2x^2 + 5. What is the value of *f*(-3)?' },
  174: { steps: ['c = \\frac{1200}{6}', 'c = 200'] },
  175: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  176: { steps: ['C = 2\\pi(5)', 'C = 10\\pi'] },
  177: { steps: ['(x+1)^2 = 0', 'x + 1 = 0', 'x = -1'] },
  178: { steps: ['P = \\frac{60}{100}', 'P = 0.6'] },
  179: { steps: ['\\frac{x^2}{4} = 25', 'x^2 = 100', 'x = 10'] },
  180: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  181: { steps: ['a = 60 - 20', 'a = 40'] },
  182: { steps: ['t = 30 + 25 \\times 5', 't = 30 + 125', 't = 155'] },
  183: { steps: ['f(2) = 3(2)^2 + 4', 'f(2) = 12 + 4', 'f(2) = 16'] },
  184: { steps: ['x^2 - 9 = 0', 'x^2 = 9', 'x = \\pm 3'] },
  185: { steps: ['2x + 3 = 15', '2x = 12', 'x = 6'] },
  // [186] system gave x=2.4; fix 3x+2y=10 -> =8 so x=2 (key B)
  186: { steps: ['3x + 2y = 8', '2x - 2y = 2', '5x = 10', 'x = 2'], question: 'If $3x + 2y = 8$ and $x - y = 1$, what is the value of $x$?' },
  187: { steps: ['\\frac{\\sqrt[3]{27}}{\\sqrt{16}}', '\\frac{3}{4}'] },
  // [188] discriminant=52; fix x^2+4x-9 -> x^2+4x-6 so D=40 (key C)
  188: { steps: ['D = 4^2 - 4(1)(-6)', 'D = 16 + 24', 'D = 40'], question: 'The equation $x^2+4x-6=0$ can be solved by using the quadratic formula. What is the value of the discriminant of this equation?' },
  // [189] area=32pi -> option B
  189: { steps: ['d = \\sqrt{8^2 + 8^2}', 'd = 8\\sqrt{2}', 'r = 4\\sqrt{2}', 'A = \\pi(4\\sqrt{2})^2', 'A = 32\\pi'], answer: 'B' },
  190: { steps: ['f(-2) = 3(-2)^2 - 2(-2) + 1', 'f(-2) = 12 + 4 + 1', 'f(-2) = 17'] },
  191: { steps: ['m = \\frac{-1 - 3}{6 - 2}', 'm = \\frac{-4}{4}', 'm = -1'] },
  192: { steps: ['A = 12 \\times 8', 'A = 96'] },
  193: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  194: { steps: ['3x + 5 = 17', '3x = 12', 'x = 4'] },
  // [195] P(orange|apple)=1/3 -> option A
  195: { steps: ['P = \\frac{20}{60}', 'P = \\frac{1}{3}'], answer: 'A' },
  // [196] neither=15 -> option B
  196: { steps: ['n = 100 - (60 + 40 - 15)', 'n = 100 - 85', 'n = 15'], answer: 'B' },
  // [197] both (3,2) and (6,0) were on the line; make A off-line so only C works
  197: { steps: ['2(6) + 3(0) = 12', '12 = 12'], choices: { A: '(1, 1)' } },
  // [198] both -2 and 3 made it undefined; change A so only x=3 is undefined
  198: { steps: ['x^2 - x - 6 = 0', '(x-3)(x+2) = 0', 'x - 3 = 0', 'x = 3'], choices: { A: '-3' } },
  199: { steps: ['A = \\frac{\\sqrt{3}}{4} \\times 4^2', 'A = \\frac{\\sqrt{3}}{4} \\times 16', 'A = 4\\sqrt{3}'] },

  200: { steps: ['f(3) = \\frac{3^2 - 4}{3 - 2}', 'f(3) = \\frac{5}{1}', 'f(3) = 5'] },
  201: { steps: ['r = \\sqrt{(5-1)^2 + (3-3)^2}', 'r = \\sqrt{16}', 'r = 4'] },
  // [202] f(-2)=-5, not in options -> option A
  202: { steps: ['f(-2) = 2(-2)^2 + 5(-2) - 3', 'f(-2) = 8 - 10 - 3', 'f(-2) = -5'], choices: { A: '-5' } },
  203: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{25 - 16}', 'd = \\sqrt{9}', 'd = 3'] },
  204: { steps: ['8\\sqrt{x} = 48', '\\sqrt{x} = 6', 'x = 36'] },
  // [205] inscribed-angle: ABC subtends a diameter (=90); the intended 50 is angle ACB
  205: { steps: ['\\angle ACB = \\frac{1}{2} \\angle AOB', '\\angle ACB = \\frac{1}{2}(100)', '\\angle ACB = 50'], question: 'In a circle with center O, points A, B, and C lie on the circle, and $\\overline{AC}$ is a diameter of the circle. If the measure of $\\angle AOB$ is 100 degrees, what is the measure of $\\angle ACB$?' },
  206: { steps: ['\\frac{(x+4)(x-1)}{(x-1)(x+1)}', '\\frac{x+4}{x+1}'] },
  207: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  // [208] f(-2)=-3, not in options -> option C
  208: { steps: ['f(-2) = 2(-2)^2 + 3(-2) - 5', 'f(-2) = 8 - 6 - 5', 'f(-2) = -3'], choices: { C: '-3' } },
  209: { steps: ['x_1 + x_2 = -\\frac{-2}{1}', 'x_1 + x_2 = 2'] },
  210: { steps: ['AB = \\sqrt{12^2 + 5^2}', 'AB = 13', '\\sin A = \\frac{5}{13}'] },
  211: { steps: ['a = (0-2)^2 + 3', 'a = 4 + 3', 'a = 7'] },
  212: { steps: ['x^2 - 2x - 15 = 0', '(x-5)(x+3) = 0', 'x - 5 = 0', 'x = 5'] },
  213: { steps: ['t = 50 + 50 \\times 0.80', 't = 50 + 40', 't = 90'] },
  214: { steps: ['p = 60 - 20', 'p = 40'] },
  215: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  // [216] x=4 -> option B
  216: { steps: ['3x + 2y = 12', 'x - 2y = 4', '4x = 16', 'x = 4'], answer: 'B' },
  217: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  // [218] neither=30 -> option C
  218: { steps: ['n = 100 - (40 + 50 - 20)', 'n = 100 - 70', 'n = 30'], answer: 'C' },
  // [219] radius=sqrt18 not in options; fix point (5,0)->(5,1) so r=5 (key C)
  219: { steps: ['r = \\sqrt{(5-2)^2 + (1-(-3))^2}', 'r = \\sqrt{9 + 16}', 'r = \\sqrt{25}', 'r = 5'], question: 'A circle with center (2, -3) passes through the point (5, 1). What is the radius of the circle?' },
  // [220] value is 3^11, not in options -> option C
  220: { steps: ['\\frac{3^{12} \\cdot 3^8}{3^9}', '3^{12 + 8 - 9}', '3^{11}'], choices: { C: '3^{11}' } },
  221: { steps: ['x_1 + x_2 = -\\frac{-2}{1}', 'x_1 + x_2 = 2'] },
  // [222] value 16/3; rewrite denominator so expression = 4 (key B)
  222: { steps: ['\\frac{5^2 - 3^2}{2^2}', '\\frac{25 - 9}{4}', '\\frac{16}{4}', '4'], question: 'What is the value of the expression $\\frac{5^2 - 3^2}{2^2}$?' },
  // [223] +1=k form has k=0 (absent); intended x^2-2x+k=0 -> k=1 (key A)
  223: { steps: ['D = (-2)^2 - 4(1)(k)', '4 - 4k = 0', '4k = 4', 'k = 1'], question: 'The equation $x^2 - 2x + k = 0$, where *k* is a constant, has exactly one solution. What is the value of *k*?' },
  224: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  225: { steps: ['c = \\sqrt{5^2 + 12^2}', 'c = \\sqrt{169}', 'c = 13'] },
  226: { steps: ['D = 6^2 - 4(1)(k)', '36 - 4k = 0', '4k = 36', 'k = 9'] },
  227: { steps: ['L = \\frac{120}{360} \\times 2\\pi(5)', 'L = \\frac{1}{3} \\times 10\\pi', 'L = \\frac{10\\pi}{3}'] },
  228: { steps: ['C = 2 \\times 3.14 \\times 5', 'C = 31.4'] },
  229: { steps: ['s = 2 \\times 5', 's = 10', 'A = 10^2', 'A = 100'] },
  230: { steps: ['x + 3 = 7', 'x = 4'] },
  231: { steps: ['n = 100 - (60 + 45 - 20)', 'n = 100 - 85', 'n = 15'] },
  // [232] tangent y=4x+b gives b=±5sqrt17 (no option); rewrite as vertical tangent x=b, b<0 -> -5 (key A)
  232: { steps: ['|b| = 5', 'b = -5'], question: 'A circle with center (0, 0) and radius 5 is tangent to the line $x = b$, where $b < 0$. What is the value of $b$?', answer: 'A' },
  233: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{9}', 'd = 3'] },
  234: { steps: ['p = 0.40 \\times 150', 'p = 60'] },
  // [235] A,B,C all on the circle; make A and C off-circle so only B works
  235: { steps: ['(7-2)^2 + (3-3)^2 = 25', '25 = 25'], choices: { A: '(2, 9)', C: '(1, -1)' } },
  236: { steps: ['x_1 + x_2 = -\\frac{-5}{1}', 'x_1 + x_2 = 5'] },
  237: { steps: ['f(5) = \\frac{5^2 - 4}{5 - 2}', 'f(5) = \\frac{21}{3}', 'f(5) = 7'] },
  // [238] radius=sqrt5 not in options; fix endpoint (5,2)->(5,4) so r=2 (key A)
  238: { steps: ['d = \\sqrt{(5-1)^2 + (4-4)^2}', 'd = \\sqrt{16}', 'd = 4', 'r = 2'], question: 'In the xy-plane, a circle has a diameter with endpoints at (1, 4) and (5, 4). What is the length of the radius of the circle?' },
  239: { steps: ['A = 12 \\times 5', 'A = 60'] },
  240: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{9}', 'd = 3'] },
  // [241] f(f(3))=-1, not in options -> option A
  241: { steps: ['f(3) = \\frac{1}{3-2}', 'f(3) = 1', 'f(1) = \\frac{1}{1-2}', 'f(1) = -1'], choices: { A: '-1' } },
  242: { steps: ['r = \\sqrt{(5-2)^2 + (7-3)^2}', 'r = \\sqrt{25}', 'r = 5'] },
  243: { steps: ['f(-2) = (-2)^3 + 2(-2) - 1', 'f(-2) = -8 - 4 - 1', 'f(-2) = -13'] },
  244: { steps: ['\\frac{(x+1) - x}{x(x+1)}', '\\frac{1}{x(x+1)}'] },
  245: { steps: ['f(2) = \\frac{2^2 - 4}{2 - 2}', 'f(2) = \\frac{0}{0}'] },
  246: { steps: ['x^2 = 16', 'x = \\pm 4'] },
  247: { steps: ['x^2 - 4 = 6(x - 2)', 'x^2 - 6x + 8 = 0', '(x-2)(x-4) = 0', 'x = 2'] },
  248: { steps: ['s = 0.20 \\times 15', 's = 3'] },
  249: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  250: { steps: ['n = 100 - (60 + 40 - 20)', 'n = 100 - 80', 'n = 20'] },
  251: { steps: ['f(x) = 3000(1 - 0.02)^x', 'f(x) = 3000(0.98)^x'] },
  252: { steps: ['15x + 10(100 - x) = 1300', '5x + 1000 = 1300', '5x = 300', 'x = 60'] },
  253: { steps: ['x + y = 5', 'x - y = 1', '2x = 6', 'x = 3'] },
  254: { steps: ['x^2 - 4x + 3 = 0', '(x-1)(x-3) = 0', 'x - 3 = 0', 'x = 3'] },
  255: { steps: ['x + 2 = 5', 'x = 3'] },
  256: { steps: ['s = 2 \\times 5', 's = 10', 'A = 10^2', 'A = 100'] },
  257: { steps: ['P = 6 \\times 6', 'P = 36'] },
  258: { steps: ['f(-2) = 2(-2)^2 - 3(-2) + 1', 'f(-2) = 8 + 6 + 1', 'f(-2) = 15'], choices: { D: '15' } },
  259: { steps: ['m = \\frac{-8 - 4}{6 - 2}', 'm = \\frac{-12}{4}', 'm = -3'] },
  260: { steps: ['(x-2)^2 + (y-3)^2 = 5^2', '(x-2)^2 + (y-3)^2 = 25'] },
  261: { steps: ['f(0) = c', 'c = 1'] },
  262: { steps: ['f(-2) = (-2)^2 + 3(-2) - 4', 'f(-2) = 4 - 6 - 4', 'f(-2) = -6'] },
  263: { steps: ['f(0) = 2(0)^2 + 3(0) - 1', 'f(0) = -1'] },
  // [264] gave non-integer; fix strawberry 50->30 so chocolate=80 (key D)
  264: { steps: ['c + \\frac{c}{2} + 30 = 150', '\\frac{3c}{2} = 120', 'c = 80'], question: 'A bakery offers 3 different types of cupcakes: chocolate, vanilla, and strawberry. The bakery sells twice as many chocolate cupcakes as vanilla cupcakes, and it sells 30 strawberry cupcakes. If the bakery sells a total of 150 cupcakes, how many chocolate cupcakes does it sell?' },
  265: { steps: ['C = 2\\pi(5)', 'C = 10\\pi'] },
  266: { steps: ['f(-2) = 2(-2)^2 - 3(-2) + 1', 'f(-2) = 8 + 6 + 1', 'f(-2) = 15'], choices: { D: '15' } },
  267: { steps: ['x + 2y = 10', 'x - 2y = 6', '2x = 16', 'x = 8'] },
  268: { steps: ['x - 2 = 0', 'x = 2'] },
  269: { steps: ['a = 10 \\times \\sin(30^\\circ)', 'a = 10 \\times \\frac{1}{2}', 'a = 5'] },
  // [270] gave irrational; fix x^2+y^2=25 -> 17 so x^2-y^2=15 (key A)
  270: { steps: ['(x+y)^2 = (x^2+y^2) + 2xy', '(x+y)^2 = 17 + 8', 'x + y = 5', 'x^2 - y^2 = 5 \\times 3', 'x^2 - y^2 = 15'], question: 'If $x^{2} + y^{2} = 17$ and $x - y = 3$, what is the value of $x^{2} - y^{2}$?', answer: 'A' },
  271: { steps: ['x_1 + x_2 = -\\frac{-5}{1}', 'x_1 + x_2 = 5'] },
  272: { steps: [] },
  // [273] all four points on the circle; move A,C,D off so only B works
  273: { steps: ['(8-3)^2 + (2-2)^2 = 25', '25 = 25'], choices: { A: '(4, 7)', C: '(4, -3)', D: '(-2, 3)' } },
  274: { steps: ['f(-2) = (-2)^2 + 3', 'f(-2) = 4 + 3', 'f(-2) = 7'] },
  275: { steps: ['s = \\frac{5 \\times 12}{10}', 's = \\frac{60}{10}', 's = 6'] },
  276: { steps: ['x^2 - 4 = 0', 'x^2 = 4', 'x = \\pm 2'] },
  277: { steps: ['n = 100 - (60 + 45 - 20)', 'n = 100 - 85', 'n = 15'] },
  278: { steps: ['s = 2 \\times 5', 's = 10', 'A = 10^2', 'A = 100'] },
  279: { steps: ['(x+1)^2 = 0', 'x + 1 = 0', 'x = -1'] },
  // [280] f(1/2)=3/4, not in options -> option D
  280: { steps: ['f(\\frac{1}{2}) = (\\frac{1}{2})^2 - 3(\\frac{1}{2}) + 2', 'f(\\frac{1}{2}) = \\frac{1}{4} - \\frac{3}{2} + 2', 'f(\\frac{1}{2}) = \\frac{3}{4}'], choices: { D: '\\frac{3}{4}' } },
  281: { steps: ['2x + 3 = 7', '2x = 4', 'x = 2'] },
  282: { steps: ['3x - 6 = 12', '3x = 18', 'x = 6'] },
  283: { steps: ['f(\\frac{1}{2}) = \\frac{1}{(\\frac{1}{2})^2 + 1}', 'f(\\frac{1}{2}) = \\frac{1}{\\frac{5}{4}}', 'f(\\frac{1}{2}) = \\frac{4}{5}'] },
  284: { steps: ['b = 60 - 20', 'b = 40'] },
  285: { steps: ['(x+1)^2 = 0', 'x + 1 = 0', 'x = -1'] },
  // [286] f(g(2))=sqrt2, not in options; fix f(x)=sqrt(x-3)->sqrt(x-1) so =2 (key B)
  286: { steps: ['g(2) = 2^2 + 1', 'g(2) = 5', 'f(5) = \\sqrt{5 - 1}', 'f(5) = 2'], question: 'If $f(x) = \\sqrt{x-1}$ and $g(x) = x^2 + 1$, what is the value of $f(g(2))$?' },
  // [287] f(-2)=1, not in options -> option A
  287: { steps: ['f(-2) = 2(-2)^2 + 3(-2) - 1', 'f(-2) = 8 - 6 - 1', 'f(-2) = 1'], choices: { A: '1' } },
  288: { steps: ['(x+3)^2 = 0', 'x + 3 = 0', 'x = -3'] },
  289: { steps: ['A = \\frac{1}{2} \\times 4 \\times 3', 'A = 6'] },
  290: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{9}', 'd = 3'] },
  // [291] gave x=24/7; fix 3x-2y=10 -> =7 so x=3 (key B)
  291: { steps: ['3x - 2(7 - 2x) = 7', '7x - 14 = 7', '7x = 21', 'x = 3'], question: 'If 3x - 2y = 7 and 2x + y = 7, what is the value of x?' },
  292: { steps: ['C = 2\\pi(5)', 'C = 10\\pi'] },
  293: { steps: ['x + 2y = 5', '2x - 2y = 4', '3x = 9', 'x = 3'] },
  294: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{9}', 'd = 3'] },
  295: { steps: ['\\frac{-54}{w} = 6', '-54 = 6w', 'w = -9'] },
  296: { steps: ['2(2y-1) + 3y = 12', '7y = 14', 'y = 2', 'x + y = 3 + 2', 'x + y = 5'] },
  297: { steps: ['c = \\frac{480}{6}', 'c = 80'] },
  298: { steps: ['C = \\pi \\times 10', 'C = 10\\pi'] },
  299: { steps: [] },

  300: { steps: [] },
  301: { steps: ['C = 2\\pi(6)', 'C = 12\\pi'] },
  302: { steps: ['C = 2\\pi(5)', 'C = 10\\pi'] },
  // [303] f(-2)=1, not in options -> option A
  303: { steps: ['f(-2) = 2(-2)^2 + 3(-2) - 1', 'f(-2) = 8 - 6 - 1', 'f(-2) = 1'], choices: { A: '1' } },
  304: { steps: ['P = 2(12 + 5)', 'P = 2(17)', 'P = 34'] },
  305: { steps: ['C = 2\\pi(5)', 'C = 10\\pi'] },
  306: { steps: ['x - y = 1', '2(y+1) + 3y = 12', '5y = 10', 'y = 2', 'x + y = 5'] },
  307: { steps: ['2\\pi r = 10\\pi', 'r = 5', 'A = \\pi(5)^2', 'A = 25\\pi'] },
  308: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  309: { steps: ['P = 6 \\times 6', 'P = 36'] },
  310: { steps: ['3x + 5 = 11', '3x = 6', 'x = 2'] },
  311: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  312: { steps: ['x^2 + y^2 = 5^2', 'x^2 + y^2 = 25'] },
  313: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  314: { steps: ['x - 1 = 0', 'x = 1'] },
  315: { steps: ['x^2 + 3x - 10 = (x+5)(x+k)', '5k = -10', 'k = -2'] },
  // [316] area=(1/2)pi s^2 -> option B
  316: { steps: ['d = s\\sqrt{2}', 'r = \\frac{s\\sqrt{2}}{2}', 'A = \\pi r^2', 'A = \\frac{1}{2}\\pi s^2'], answer: 'B' },
  317: { steps: ['x^2 + 4x - 21 = 0', '(x+7)(x-3) = 0', 'x - 3 = 0', 'x = 3'] },
  318: { steps: ['m = \\frac{-2 - 2}{3 - (-1)}', 'm = \\frac{-4}{4}', 'm = -1'] },
  319: { steps: ['3x - 5 = 16', '3x = 21', 'x = 7'] },
  320: { steps: ['p = \\frac{150}{6}', 'p = 25'] },
  // [321] (2x+3)/(x-1)=5 gave x=8/3; rewrite RHS to 7 so x=2 (key B)
  321: { steps: ['\\frac{2x+3}{x-1} = 7', '2x + 3 = 7(x-1)', '2x + 3 = 7x - 7', '10 = 5x', 'x = 2'], question: 'If $\\frac{2x+3}{x-1} = 7$, what is the value of $x$?' },
  // [322] r=sqrt18 not in options; fix point (7,-2)->(7,2) so r=sqrt58 (key D)
  322: { steps: ['r = \\sqrt{(7-4)^2 + (2-(-5))^2}', 'r = \\sqrt{9 + 49}', 'r = \\sqrt{58}'], question: 'In the xy-plane, a circle with center (4, -5) passes through the point (7, 2). What is the radius of the circle?' },
  323: { steps: ['5^2 + 12^2 = 13^2', '25 + 144 = 169', '169 = 169'] },
  324: { steps: ['d = |6 - (-4)|', 'd = 10', 'r = \\frac{10}{2}', 'r = 5'] },
  325: { steps: ['s = 2 \\times 5', 's = 10', 'A = 10^2', 'A = 100'] },
  // [326] f(-2)=-3, not in options -> option D
  326: { steps: ['f(-2) = 2(-2)^2 + 3(-2) - 5', 'f(-2) = 8 - 6 - 5', 'f(-2) = -3'], choices: { D: '-3' } },
  327: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  // [328] n=9 -> option C
  328: { steps: ['15(n - 1) = 120', 'n - 1 = 8', 'n = 9'], answer: 'C' },
  // [329] expression = 2x-2, not in options -> option B
  329: { steps: ['(x^2 - x - 6) - (x^2 - 3x - 4)', 'x^2 - x - 6 - x^2 + 3x + 4', '2x - 2'], choices: { B: '2x - 2' } },
  // [330] x+y true=5.4; fix second eq x-y=3 -> x-y=6 so x+y=6 (key B)
  330: { steps: ['x = y + 6', '2(y+6) + 3y = 12', '5y = 0', 'y = 0', 'x + y = 6'], question: 'The system of equations $\\begin{cases} 2x + 3y = 12 \\\\ x - y = 6 \\end{cases}$ has the solution $(x,y)$. What is the value of $x + y$?' },
  331: { steps: ['0.80 \\times p = 32', 'p = \\frac{32}{0.80}', 'p = 40'] },
  332: { steps: ['f(\\sqrt{3}) = \\frac{1}{(\\sqrt{3})^2 + 1}', 'f(\\sqrt{3}) = \\frac{1}{4}'] },
  333: { steps: ['(x-4)^2 + (y+3)^2 = 5^2', '(x-4)^2 + (y+3)^2 = 25'] },
  334: { steps: ['(x+2)^2', 'x^2 + 4x + 4'] },
  335: { steps: ['P = \\frac{10 - 3}{10}', 'P = \\frac{7}{10}'] },
  336: { steps: ['c = \\sqrt{5^2 + 12^2}', 'c = \\sqrt{169}', 'c = 13'] },
  337: { steps: ['2x + 3 = x - 7', '2x - x = -7 - 3', 'x = -10'] },
  338: { steps: ['(x+1)^2 = 16', 'x + 1 = 4', 'x = 3'] },
  339: { steps: ['N = 100 \\times 2^4', 'N = 100 \\times 16', 'N = 1600'] },
  340: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  341: { steps: ['3x - 5 = 10', '3x = 15', 'x = 5'] },
  342: { steps: ['2x + 3 = 11', '2x = 8', 'x = 4'] },
  343: { steps: ['x_1 + x_2 = -\\frac{-2}{1}', 'x_1 + x_2 = 2'] },
  344: { steps: ['f(2) = 3(2)^2 - 5(2) + 2', 'f(2) = 12 - 10 + 2', 'f(2) = 4'] },
  // [345] r=sqrt18 not in options; fix point (5,0)->(7,0) so r=sqrt34 (key D)
  345: { steps: ['r = \\sqrt{(7-2)^2 + (0-(-3))^2}', 'r = \\sqrt{25 + 9}', 'r = \\sqrt{34}'], question: 'In the xy-plane, a circle with center (2, -3) passes through the point (7, 0). What is the radius of the circle?' },
  346: { steps: ['f(0) = (0)^2 - 3(0) + 2', 'f(0) = 2'] },
  347: { steps: ['x_1 + x_2 = -\\frac{-2}{1}', 'x_1 + x_2 = 2'] },
  348: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  // [349] f(3)=-5, not in options -> option D
  349: { steps: ['f(3) = (3+2)(3-4)', 'f(3) = (5)(-1)', 'f(3) = -5'], choices: { D: '-5' } },
  350: { steps: ['P = \\frac{5}{20}', 'P = 0.25'] },
  351: { steps: ['f(-2) = 2(-2)^2 - 3(-2) + 1', 'f(-2) = 8 + 6 + 1', 'f(-2) = 15'] },
  352: { steps: ['r = \\frac{|14 - 4|}{2}', 'r = \\frac{10}{2}', 'r = 5'] },
  353: { steps: ['r^2 = 25', 'r = \\sqrt{25}', 'r = 5'] },
  354: { steps: ['x + y = 7', 'x - y = 3', '2x = 10', 'x = 5'] },
  // [355] neither=5, not in options -> option A
  355: { steps: ['n = 100 - (75 + 60 - 40)', 'n = 100 - 95', 'n = 5'], choices: { A: '5' } },
  356: { steps: ['m = \\frac{6 - (-3)}{5 - 2}', 'm = \\frac{9}{3}', 'm = 3'] },
  357: { steps: ['s = 2 \\times 5', 's = 10', 'A = 10^2', 'A = 100'] },
  358: { steps: ['3x + 2y = 12', 'x - 2y = 4', '4x = 16', 'x = 4'] },
  359: { steps: ['p = 20 \\times (1 - 0.15)', 'p = 20 \\times 0.85', 'p = 17'] },
  360: { steps: ['C = 2\\pi(5)', 'C = 10\\pi'] },
  // [361] area=50pi -> option B
  361: { steps: ['d = \\sqrt{10^2 + 10^2}', 'd = 10\\sqrt{2}', 'r = 5\\sqrt{2}', 'A = \\pi(5\\sqrt{2})^2', 'A = 50\\pi'], answer: 'B' },
  362: { steps: ['3(3) + 2(2)', '9 + 4', '13'] },
  363: { steps: ['\\frac{(x+2)(x+3)}{x+2}', 'x + 3'] },
  // [364] area=3pi, not in options -> option C
  364: { steps: ['r = \\frac{6}{2\\sqrt{3}}', 'r = \\sqrt{3}', 'A = \\pi(\\sqrt{3})^2', 'A = 3\\pi'], choices: { C: '3\\pi' } },
  // [365] f(2)=20 -> option B
  365: { steps: ['f(2) = 3(2)^2 + 5(2) - 2', 'f(2) = 12 + 10 - 2', 'f(2) = 20'], answer: 'B' },
  366: { steps: ['x_1 + x_2 = -\\frac{-5}{2}', 'x_1 + x_2 = \\frac{5}{2}'] },
  // [367] f(2)=13, not in options -> option D
  367: { steps: ['f(2) = 2(2)^2 + 3(2) - 1', 'f(2) = 8 + 6 - 1', 'f(2) = 13'], choices: { D: '13' } },
  368: { steps: ['x^2 - y^2 = (x+y)(x-y)', 'x^2 - y^2 = 5 \\times 3', 'x^2 - y^2 = 15'] },
  // [369] simplifies to (x+2)/(x+4) -> option B
  369: { steps: ['\\frac{(x-4)(x+2)}{(x-4)(x+4)}', '\\frac{x+2}{x+4}'], answer: 'B' },
  370: { steps: ['6 + 12 + 24', '42'] },
  371: { steps: ['2x - 3 = 5x + 6', '-3 - 6 = 5x - 2x', '-9 = 3x', 'x = -3'] },
  372: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{9}', 'd = 3'] },
  373: { steps: ['x - 2 = 0', 'x = 2'] },
  374: { steps: ['x + 2y = 6', 'x - 2y = 4', '2x = 10', 'x = 5'] },
  375: { steps: ['p = \\frac{40}{100}', 'p = 40\\%'] },
  376: { steps: ['\\frac{2s \\times s}{s^2}', '\\frac{2s^2}{s^2}', '2'] },
  377: { steps: ['C = 2\\pi(5)', 'C = 10\\pi'] },
  // [378] expression should be 90y^2-54y = 6y(15y-9) -> r=6 (key C)
  378: { steps: ['90y^2 - 54y', '6y(15y - 9)', 'r = 6'], question: 'The expression $90y^2 - 54y$ is equivalent to $ry(15y-9)$, where r is a constant. What is the value of r?' },
  // [379] line is y=-2x+1 -> option A
  379: { steps: ['m = \\frac{-1 - 5}{1 - (-2)}', 'm = -2', '-1 = -2(1) + b', 'b = 1', 'y = -2x + 1'], answer: 'A' },
  // [380] f(2)+f(3)=13, not in options -> option C
  380: { steps: ['f(2) = 3', 'f(3) = 10', 'f(2) + f(3) = 13'], choices: { C: '13' } },
  381: { steps: ['x - 2 = 0', 'x = 2'] },
  // [382] f(-2)=-3, not in options -> option D
  382: { steps: ['f(-2) = 2(-2)^2 + 3(-2) - 5', 'f(-2) = 8 - 6 - 5', 'f(-2) = -3'], choices: { D: '-3' } },
  383: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{9}', 'd = 3'] },
  384: { steps: ['p = \\frac{25 - 15}{25}', 'p = \\frac{10}{25}', 'p = 40\\%'] },
  385: { steps: ['A = \\frac{1}{2} \\times 4 \\times 3', 'A = 6'] },
  // [386] f(-2)=0, not in options -> option C
  386: { steps: ['f(-2) = 3(-2)^2 + 5(-2) - 2', 'f(-2) = 12 - 10 - 2', 'f(-2) = 0'], choices: { C: '0' } },
  387: { steps: ['x^2 + 2x - 3 = 0', '(x+3)(x-1) = 0', 'x = -3, x = 1'] },
  388: { steps: ['\\sqrt{x} - 4 = 9', '\\sqrt{x} = 13', 'x = 169'] },
  // [389] distance from center to y=5 is 8 -> option D
  389: { steps: ['r = |5 - (-3)|', 'r = 8'], answer: 'D' },
  390: { steps: ['C = 2\\pi(5)', 'C = 10\\pi'] },
  391: { steps: ['x + y = 5', 'x - y = 1', '2x = 6', 'x = 3'] },
  392: { steps: ['x_1 + x_2 = -\\frac{-2}{1}', 'x_1 + x_2 = 2'] },
  393: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  394: { steps: ['P = 6 \\times 10', 'P = 60'] },
  // [395] only oranges=20 -> option B
  395: { steps: ['o = 40 - 20', 'o = 20'], answer: 'B' },
  396: { steps: ['\\pi r^2 = 36\\pi', 'r = 6', 'C = 2\\pi(6)', 'C = 12\\pi'] },
  // [397] total=7.50 -> option B
  397: { steps: ['t = 3(1.25) + 5(0.75)', 't = 3.75 + 3.75', 't = 7.50'], answer: 'B' },
  398: { steps: ['(x+1)^2 = 0', 'x + 1 = 0', 'x = -1'] },
  399: { steps: ['f(-2) = 3(-2)^2 - 2(-2) + 1', 'f(-2) = 12 + 4 + 1', 'f(-2) = 17'] },

  400: { steps: ['C = 2\\pi(5)', 'C = 10\\pi'] },
  401: { steps: ['x_1 + x_2 = -\\frac{-6}{1}', 'x_1 + x_2 = 6'] },
  402: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{9}', 'd = 3'] },
  403: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{9}', 'd = 3'] },
  404: { steps: ['\\frac{5}{3} = \\frac{180}{p}', '5p = 540', 'p = 108'] },
  405: { steps: ['r = |-1|', 'r = 1'] },
  406: { steps: ['(x-3)^2 + (y+2)^2 = 5^2', '(x-3)^2 + (y+2)^2 = 25'] },
  407: { steps: ['3x - 2y = 12', 'x + 2y = 4', '4x = 16', 'x = 4'] },
  408: { steps: ['\\frac{(x-4)(x+4)}{(x-2)(x-4)}', '\\frac{x+4}{x-2}'] },
  // [409] r=sqrt18 not in options; fix point (4,1)->(4,2) so r=5 (key B)
  409: { steps: ['r = \\sqrt{(4-1)^2 + (2-(-2))^2}', 'r = \\sqrt{9 + 16}', 'r = \\sqrt{25}', 'r = 5'], question: 'A circle with center (1, -2) passes through the point (4, 2). What is the radius of the circle?' },
  410: { steps: ['2\\pi r = 12\\pi', 'r = 6', 'A = \\pi(6)^2', 'A = 36\\pi'] },
  411: { steps: ['x_1 + x_2 = -\\frac{6}{1}', 'x_1 + x_2 = -6'] },
  412: { steps: ['w = \\frac{24}{6}', 'w = 4'] },
  413: { steps: ['f(0) = 3(0)^2 - 5(0) + 2', 'f(0) = 2'] },
  414: { steps: ['\\frac{1}{2} \\times 14 \\times h = 42', '7h = 42', 'h = 6'] },
  // [415] (x+2)/(x-1)=3 gave x=2.5; fix numerator x+2 -> x+7 so x=5 (key C)
  415: { steps: ['\\frac{x+7}{x-1} = 3', 'x + 7 = 3(x-1)', 'x + 7 = 3x - 3', '10 = 2x', 'x = 5'], question: 'If $\\frac{x+7}{x-1} = 3$, what is the value of $x$?' },
  416: { steps: ['P = 6 \\times 6', 'P = 36'] },
  417: { steps: ['f(2) = \\frac{2^2 - 4}{2 - 2}', 'f(2) = \\frac{0}{0}'] },
  // [418] log eq had no clean root; rewrite to log3(x+5)=2 so x=4 (key D)
  418: { steps: ['\\log_3(x+5) = 2', 'x + 5 = 3^2', 'x + 5 = 9', 'x = 4'], question: 'If $\\log_3 (x+5) = 2$, what is the value of $x$?' },
  419: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{9}', 'd = 3'] },
  420: { steps: ['3x + 2 = 14', '3x = 12', 'x = 4'] },
  421: { steps: ['3x - 2y = 7', 'x + 2y = 5', '4x = 12', 'x = 3'] },
  422: { steps: ['a = 60 - 10', 'a = 50'] },
  423: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  424: { steps: ['P = 6 \\times 6', 'P = 36'] },
  425: { steps: ['f(-2) = 3(-2)^2 + 2', 'f(-2) = 12 + 2', 'f(-2) = 14'] },
  426: { steps: ['c = \\frac{2400}{6}', 'c = 400'] },
  427: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  428: { steps: ['y = 2(3) + 1', 'y = 6 + 1', 'y = 7'] },
  429: { steps: ['C = \\pi \\times 10', 'C = 10\\pi'] },
  430: { steps: ['o = 40 - 20', 'o = 20'] },
  // [431] f(2)=9 -> option A
  431: { steps: ['f(2) = 3(2)^2 - 2(2) + 1', 'f(2) = 12 - 4 + 1', 'f(2) = 9'], answer: 'A' },
  432: { steps: [] },
  // [433] other solution is 1 -> option C
  433: { steps: ['x_1 + x_2 = \\frac{5}{2}', '\\frac{3}{2} + x_2 = \\frac{5}{2}', 'x_2 = 1'], answer: 'C' },
  434: { steps: ['x + 3 = 7', 'x = 4'] },
  435: { steps: ['3p + p = 120', '4p = 120', 'p = 30', 'c = 3 \\times 30', 'c = 90'] },
  436: { steps: ['n = \\frac{100}{20}', 'n = 5'] },
  437: { steps: ['C = 2\\pi(10)', 'C = 20\\pi'] },
  438: { steps: ['f(2) = (2)^2 - 3(2) + 2', 'f(2) = 4 - 6 + 2', 'f(2) = 0'] },
  439: { steps: ['(x^2+3)(x^2-3)', 'x^4 - 9'] },
  // [440] system gave x=4.8; fix 2x+3y=12 -> =18 so x=6 (key D)
  440: { steps: ['2x + 3y = 18', '3x - 3y = 12', '5x = 30', 'x = 6'], question: 'If 2x + 3y = 18 and x - y = 4, what is the value of x?' },
  441: { steps: ['x + 2y = 6', 'x - 2y = 4', '2x = 10', 'x = 5'] },
  442: { steps: ['p = \\frac{45}{100}', 'p = 45\\%'] },
  443: { steps: ['A = \\frac{1}{2} \\times 4 \\times 3', 'A = 6'] },
  444: { steps: ['C = 2\\pi(5)', 'C = 10\\pi'] },
  // [445] arc 10 -> ~114.6deg (no option); fix arc length to 2pi so angle=72 (key B)
  445: { steps: ['\\theta = \\frac{2\\pi}{2\\pi(5)} \\times 360', '\\theta = \\frac{1}{5} \\times 360', '\\theta = 72'], question: 'In a circle with a radius of 5, a central angle intercepts an arc of length $2\\pi$. What is the measure of the central angle in degrees?' },
  446: { steps: ['x + 2y = 10', 'x - 2y = 4', '2x = 14', 'x = 7'] },
  447: { steps: ['D = 6^2 - 4(1)(9)', 'D = 36 - 36', 'D = 0'] },
  448: { steps: ['f(3) = \\frac{3^2 - 4}{3 - 2}', 'f(3) = \\frac{5}{1}', 'f(3) = 5'] },
  449: { steps: ['s = \\frac{36}{4}', 's = 9', 'A = 9^2', 'A = 81'] },
  450: { steps: ['A = \\frac{60}{360} \\times \\pi \\times 5^2', 'A = \\frac{1}{6} \\times 25\\pi', 'A = \\frac{25\\pi}{6}'] },
  451: { steps: ['x + 2y = 7', 'x - 2y = 1', '2x = 8', 'x = 4'] },
  // [452] f(x)=10 had irrational roots; change target to f(x)=0 so x=1 (key C)
  452: { steps: ['x^2 + 3x - 4 = 0', '(x+4)(x-1) = 0', 'x - 1 = 0', 'x = 1'], question: 'The function \\(f(x)\\) is defined by \\(f(x)=x^2+3x-4\\). For what value of \\(x\\) does \\(f(x)=0\\)?' },
  453: { steps: ['f(0) = (0)^2 - 4(0) + 3', 'f(0) = 3'] },
  454: { steps: ['y = x^2 - 4x + 5', 'x_1 + x_2 = -\\frac{-4}{1}', 'x_1 + x_2 = 4'] },
  455: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  456: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  // [457] "seven" but six values listed; fix to a clean 7-value set (median 3, key B)
  457: { steps: [], question: 'What is the median of the seven data values shown? 2, 2, 3, 3, 4, 4, 11' },
  458: { steps: ['f(-2) = 2(-2)^2 - 3(-2) + 1', 'f(-2) = 8 + 6 + 1', 'f(-2) = 15'] },
  459: { steps: ['(x^2+1)(x^2-1)', 'x^4 - 1'] },
  // [460] fifth number = 12 -> option C
  460: { steps: ['x = 5 \\times 12 - (10 + 11 + 13 + 14)', 'x = 60 - 48', 'x = 12'], answer: 'C' },
  461: { steps: ['P = \\frac{3}{5 + 3 + 2}', 'P = \\frac{3}{10}'] },
  // [462] total=5.25 -> option B
  462: { steps: ['t = 3(1.25) + 2(0.75)', 't = 3.75 + 1.50', 't = 5.25'], answer: 'B' },
  463: { steps: ['2\\pi r = 10\\pi', 'r = 5', 'A = \\pi(5)^2', 'A = 25\\pi'] },
  464: { steps: [] },
  // [465] "OP is a diameter" contradicts O being center; treat P,Q on circle: equilateral -> PQ=5
  465: { steps: ['OP = OQ = 5', 'PQ = 5'], question: 'A circle with center O has a radius of 5. Points P and Q are on the circle such that $\\angle POQ = 60$ degrees. What is the length of line segment PQ?' },
  // [466] only apples=40 -> option B
  466: { steps: ['a = 60 - 20', 'a = 40'], answer: 'B' },
  467: { steps: ['x_1 + x_2 = -\\frac{2}{1}', 'x_1 + x_2 = -2'] },
  468: { steps: ['f(-2) = 2(-2)^2 - 5(-2) + 3', 'f(-2) = 8 + 10 + 3', 'f(-2) = 21'] },
  469: { steps: ['f(-2) = 3(-2)^2 - 2(-2) + 1', 'f(-2) = 12 + 4 + 1', 'f(-2) = 17'] },
  470: { steps: ['x^2 - 9 = 0', 'x^2 = 9', 'x = \\pm 3'] },
  471: { steps: ['a = 10 \\times \\sin(30^\\circ)', 'a = 10 \\times \\frac{1}{2}', 'a = 5'] },
  472: { steps: ['A = 12 \\times 5', 'A = 60'] },
  // [473] system gave x=27/7; fix 2x-3y=12 -> =9 so x=3 (key C)
  473: { steps: ['4x - 6y = 18', '3x + 6y = 3', '7x = 21', 'x = 3'], question: 'If $2x - 3y = 9$ and $x + 2y = 1$, what is the value of $x$?' },
  474: { steps: ['c = \\sqrt{5^2 + 12^2}', 'c = \\sqrt{169}', 'c = 13'] },
  // [475] only apples=40 -> option B
  475: { steps: ['a = 60 - 20', 'a = 40'], answer: 'B' },
  476: { steps: ['a^2 + a - 2 = 10', 'a^2 + a - 12 = 0', '(a+4)(a-3) = 0', 'a = 3'] },
  477: { steps: ['A = 8 \\times 5', 'A = 40'] },
  478: { steps: ['x_1 + x_2 = -\\frac{b}{a}', 'x_1 + x_2 = -\\frac{5}{2}'] },
  479: { steps: ['n = 0.60 \\times 100', 'n = 60'] },
  480: { steps: ['A = 12 \\times 5', 'A = 60'] },
  // [481] system gave x+y=3.52; fix 3x+7y=14 -> =16 so x+y=4 (key C)
  481: { steps: ['3x + 7y = 16', '2x - 5y = 1', 'x = 3', 'x + y = 3 + 1', 'x + y = 4'], question: 'If $3x+7y=16$ and $2x-5y=1$, what is the value of $x+y$?', answer: 'C' },
  482: { steps: ['f(4) = \\frac{4^2 - 9}{4 - 3}', 'f(4) = \\frac{7}{1}', 'f(4) = 7'] },
  // [483] x+y true=4.4; fix 2x+3y=10 -> =9 so x+y=4 (key C)
  483: { steps: ['x = y + 2', '2(y+2) + 3y = 9', '5y = 5', 'y = 1', 'x + y = 4'], question: 'If \\(2x + 3y = 9\\) and \\(x - y = 2\\), what is the value of \\(x + y\\)?' },
  // [484] system gave x=1.8; fix y=3x-5 -> y=x-4 so x=7 (key C)
  484: { steps: ['x = 2(x - 4) + 1', 'x = 2x - 7', '-x = -7', 'x = 7'], question: 'If $y = x - 4$ and $x = 2y + 1$, what is the value of $x$?' },
  485: { steps: ['2\\pi r = 12\\pi', 'r = 6', 'A = \\pi(6)^2', 'A = 36\\pi'] },
  486: { steps: ['p = \\frac{30}{80}', 'p = 37.5\\%'] },
  487: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{9}', 'd = 3'] },
  // [488] f(2)=13, not in options -> option C
  488: { steps: ['f(2) = 2(2)^2 + 3(2) - 1', 'f(2) = 8 + 6 - 1', 'f(2) = 13'], choices: { C: '13' } },
  489: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{9}', 'd = 3'] },
  490: { steps: ['(x-2)^2 = 0', 'x - 2 = 0', 'x = 2'] },
  // [491] total=8.25, not in options -> option D
  491: { steps: ['t = 3(1.50) + 5(0.75)', 't = 4.50 + 3.75', 't = 8.25'], choices: { D: '8.25' } },
  492: { steps: ['(x-3)^2 = 0', 'x - 3 = 0', 'x = 3'] },
  // [493] system gave x=15/13; fix 3x+2y=11 -> =9 so x=1 (key B)
  493: { steps: ['3x + 2(5x - 2) = 9', '13x - 4 = 9', '13x = 13', 'x = 1'], question: 'If \\(3x+2y=9\\) and \\(5x-y=2\\), what is the value of \\(x\\)?' },
  494: { steps: ['\\sin(30^\\circ) = \\frac{10}{h}', '\\frac{1}{2} = \\frac{10}{h}', 'h = 20'] },
  495: { steps: ['x^2 + 2x - 15 = 0', '(x+5)(x-3) = 0', 'x = -5, x = 3'] },
  // [496] area=16pi; options were malformed -> normalize, key D
  496: { steps: ['s = \\sqrt{64}', 's = 8', 'r = 4', 'A = \\pi(4)^2', 'A = 16\\pi'], choices: { A: '\\pi', B: '2\\pi', C: '4\\pi', D: '16\\pi' } },
  497: { steps: ['P = 6 \\times 6', 'P = 36'] },
  498: { steps: ['f(\\frac{1}{2}) = \\frac{1}{(\\frac{1}{2})^2 + 1}', 'f(\\frac{1}{2}) = \\frac{1}{\\frac{5}{4}}', 'f(\\frac{1}{2}) = \\frac{4}{5}'] },
  // [499] f(2)=-1 -> option A
  499: { steps: ['f(2) = (2)^2 - 3(2) + 1', 'f(2) = 4 - 6 + 1', 'f(2) = -1'], answer: 'A' },
};

function hasCtrl(s) { for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) < 32) return true; return false; }
function validState(s) {
  if (typeof s !== 'string') return false;
  s = s.trim();
  if (!s || s.length > 140) return false;
  if (hasCtrl(s)) return false;
  if (/\\text|\\begin|\\end|[$]/.test(s)) return false;
  if (/[A-Za-z]{5,}/.test(s.replace(/\\[a-zA-Z]+/g, ''))) return false;
  return /[0-9=]/.test(s);
}

(function main() {
  const domainFiles = fs.readdirSync(MATH_DIR).filter(f => f.endsWith('.json')).sort();
  const fileArrays = {};
  domainFiles.forEach(f => {
    fileArrays[f] = JSON.parse(fs.readFileSync(path.join(MATH_DIR, f), 'utf8'));
  });
  const byIdx = {};
  Object.values(fileArrays).forEach(arr => arr.forEach(it => { byIdx[it._idx] = it; }));

  const log = [];
  let problems = 0;

  Object.keys(DATA).forEach((k) => {
    const i = parseInt(k, 10);
    const rec = DATA[k];
    const it = byIdx[i];
    if (!it) { console.error(`! no math item at index ${i}`); problems++; return; }
    const q = it.question || (it.question = {});

    if (rec.question) { q.question = rec.question; log.push(`[${i}] stem rewritten`); }
    if (rec.choices) {
      Object.entries(rec.choices).forEach(([letter, val]) => {
        log.push(`[${i}] option ${letter}: "${q.choices[letter]}" -> "${val}"`);
        q.choices[letter] = val;
      });
    }
    if (rec.answer && rec.answer !== q.correct_answer) {
      log.push(`[${i}] answer key: ${q.correct_answer} -> ${rec.answer}`);
      q.correct_answer = rec.answer;
    }

    const steps = Array.isArray(rec.steps) ? rec.steps : [];
    steps.forEach((s) => { if (!validState(s)) { console.error(`! [${i}] invalid step: ${JSON.stringify(s)}`); problems++; } });
    it.steps = steps;

    if (!q.choices || !(q.correct_answer in q.choices)) {
      console.error(`! [${i}] correct_answer ${q.correct_answer} not in choices`); problems++;
    }
  });

  console.log('── changes ──');
  log.forEach((l) => console.log('  ' + l));
  const withSteps = Object.values(DATA).filter((r) => (r.steps || []).length >= 2).length;
  const emptySteps = Object.keys(DATA).length - withSteps;
  console.log(`\nAuthored ${Object.keys(DATA).length} items · ${withSteps} with morph steps · ${emptySteps} prose-fallback · ${log.length} corrections · ${problems} problems`);

  if (problems) { console.error('\nABORT: fix problems above before writing.'); process.exit(1); }
  if (CHECK_ONLY) { console.log('\n--check: no file written.'); return; }
  domainFiles.forEach(f => {
    fs.writeFileSync(path.join(MATH_DIR, f), JSON.stringify(fileArrays[f]));
  });
  console.log('\nMath domain files written to', path.relative(ROOT, MATH_DIR));
})();
