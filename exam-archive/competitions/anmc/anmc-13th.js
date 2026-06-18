/* ════════════════════════════════════════════════════════════════════
   13TH ANNUAL NATIONAL MATHEMATICS COMPETITION (NTIC / ANMC) · 2016
   Upper Primary — two exports consumed by the round runners:
     • firstRound  → 1st Round (6th February 2016), 75 MCQs
     • finals      → 2nd Round (12th March 2016), 75 MCQs
   ────────────────────────────────────────────────────────────────────
   Transcribed verbatim from the official papers. Every item is
   type "objective" (5 options A–E). Figures are hand-built inline SVGs
   (currentColor → theme-aware). The papers print no answer key, so each
   answer was solved here; figure-dependent items whose scan is ambiguous
   are marked “⚠ verify” in the explanation.
   ════════════════════════════════════════════════════════════════════ */

const svg = (vb, body) =>
  `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" fill="none" ` +
  `stroke="currentColor" stroke-width="2" stroke-linejoin="round" ` +
  `stroke-linecap="round" font-family="JetBrains Mono, monospace">${body}</svg>`;
const T = (x, y, s, size = 13) =>
  `<text x="${x}" y="${y}" fill="currentColor" stroke="none" font-size="${size}" ` +
  `text-anchor="middle">${s}</text>`;

// ── A 12-sector pie with `shaded` of 12 wedges filled. ──
function pie12(shaded) {
  const cx = 60,
    cy = 60,
    r = 50;
  let wedges = "";
  for (let i = 0; i < 12; i++) {
    const a0 = ((i * 30 - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * 30 - 90) * Math.PI) / 180;
    const x0 = (cx + r * Math.cos(a0)).toFixed(1),
      y0 = (cy + r * Math.sin(a0)).toFixed(1);
    const x1 = (cx + r * Math.cos(a1)).toFixed(1),
      y1 = (cy + r * Math.sin(a1)).toFixed(1);
    const fill =
      i < shaded ? 'fill="currentColor" fill-opacity="0.4"' : 'fill="none"';
    wedges += `<path d="M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z" ${fill} stroke="currentColor" stroke-width="1.5"/>`;
  }
  return svg("0 0 120 120", wedges);
}

// ════════════════════════════════════════════════════════════════════
//  1ST ROUND — 6TH FEBRUARY 2016
// ════════════════════════════════════════════════════════════════════
export const firstRound = [
  // ALGEBRA
  {
    question: "Evaluate \\( 4 + 8 + 12 \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 12 \\)",
      "\\( 16 \\)",
      "\\( 20 \\)",
      "\\( 24 \\)",
      "\\( 28 \\)",
    ],
    correctIndex: 3,
    hint: "Add left to right.",
    explanation: ["\\( 4+8 = 12 \\), then \\( 12+12 = 24 \\)."],
  },

  {
    question: "Evaluate \\( \\dfrac{49}{7} \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 5 \\)",
      "\\( 7 \\)",
      "\\( 9 \\)",
      "\\( 11 \\)",
      "\\( 13 \\)",
    ],
    correctIndex: 1,
    hint: "How many \\( 7 \\)s make \\( 49 \\)?",
    explanation: ["\\( 49 \\div 7 = 7 \\)."],
  },

  {
    question:
      "Bello's age is \\( 26 \\) in the year \\( 2016 \\). In what year was he born?",
    image: null,
    type: "objective",
    options: [
      "\\( 1990 \\)",
      "\\( 1994 \\)",
      "\\( 1996 \\)",
      "\\( 1999 \\)",
      "\\( 2000 \\)",
    ],
    correctIndex: 0,
    hint: "Subtract his age from the year.",
    explanation: ["\\( 2016 - 26 = 1990 \\)."],
  },

  {
    question: "Calculate \\( 2016 - 16 + 100 - 10 \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 26 \\)",
      "\\( 416 \\)",
      "\\( 2011 \\)",
      "\\( 2042 \\)",
      "\\( 2090 \\)",
    ],
    correctIndex: 4,
    hint: "Work left to right.",
    explanation: [
      "\\( 2016-16 = 2000 \\), \\( +100 = 2100 \\), \\( -10 = 2090 \\).",
    ],
  },

  {
    question: "Which of the following numbers is the greatest?",
    image: null,
    type: "objective",
    options: [
      "\\( 864{,}235 \\)",
      "\\( 859{,}017 \\)",
      "\\( 877{,}789 \\)",
      "\\( 890{,}001 \\)",
      "\\( 888{,}888 \\)",
    ],
    correctIndex: 3,
    hint: "Compare digit by digit from the left.",
    explanation: [
      "\\( 890{,}001 \\) has the largest value (hundred-thousands then ten-thousands).",
    ],
  },

  {
    question: "Evaluate \\( 1 + 3 + 5 + 7 + 9 + 11 \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 32 \\)",
      "\\( 36 \\)",
      "\\( 40 \\)",
      "\\( 44 \\)",
      "\\( 48 \\)",
    ],
    correctIndex: 1,
    hint: "The sum of the first \\( n \\) odd numbers is \\( n^2 \\).",
    explanation: ["\\( 6 \\) odd numbers give \\( 6^2 = 36 \\)."],
  },

  {
    question: "Find the number that is \\( 356 \\) less than \\( 1213 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 857 \\)",
      "\\( 898 \\)",
      "\\( 917 \\)",
      "\\( 942 \\)",
      "\\( 995 \\)",
    ],
    correctIndex: 0,
    hint: "Subtract.",
    explanation: ["\\( 1213 - 356 = 857 \\)."],
  },

  {
    question:
      "A bowler scored \\( 201 \\), \\( 153 \\) and \\( 216 \\) in three games. What was the average score?",
    image: null,
    type: "objective",
    options: [
      "\\( 180 \\)",
      "\\( 185 \\)",
      "\\( 190 \\)",
      "\\( 195 \\)",
      "\\( 200 \\)",
    ],
    correctIndex: 2,
    hint: "Average \\( = \\) total \\( \\div \\) number of games.",
    explanation: ["\\( (201+153+216)\\div 3 = 570\\div 3 = 190 \\)."],
  },

  {
    question: "Evaluate \\( (2 + 3)^2 + 4 \\times 3 \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 32 \\)",
      "\\( 37 \\)",
      "\\( 42 \\)",
      "\\( 47 \\)",
      "\\( 52 \\)",
    ],
    correctIndex: 1,
    hint: "Brackets, then powers, then multiply, then add.",
    explanation: ["\\( 5^2 + 12 = 25 + 12 = 37 \\)."],
  },

  {
    question: "Find the quarter of \\( 2^4 \\).",
    image: null,
    type: "objective",
    options: ["\\( 2 \\)", "\\( 4 \\)", "\\( 6 \\)", "\\( 8 \\)", "\\( 10 \\)"],
    correctIndex: 1,
    hint: "\\( 2^4 = 16 \\); a quarter means divide by \\( 4 \\).",
    explanation: ["\\( 16 \\div 4 = 4 \\)."],
  },

  {
    question: "What fraction of the figure is shaded?",
    image: pie12(11),
    type: "objective",
    options: [
      "\\( \\dfrac{9}{10} \\)",
      "\\( \\dfrac{8}{11} \\)",
      "\\( \\dfrac{7}{9} \\)",
      "\\( \\dfrac{5}{6} \\)",
      "\\( \\dfrac{11}{12} \\)",
    ],
    correctIndex: 4,
    hint: "Count the equal sectors and how many are shaded.",
    explanation: [
      "The circle is split into \\( 12 \\) equal sectors with \\( 11 \\) shaded \\( = \\frac{11}{12} \\). ⚠ Shaded count read from the scan — verify against the official figure.",
    ],
  },

  {
    question:
      "Damilola eats \\( 8 \\) sticks of suya in \\( 20 \\) minutes. How many minutes to eat \\( 2 \\) sticks?",
    image: null,
    type: "objective",
    options: ["\\( 3 \\)", "\\( 4 \\)", "\\( 5 \\)", "\\( 7 \\)", "\\( 8 \\)"],
    correctIndex: 2,
    hint: "Find the time for one stick first.",
    explanation: [
      "\\( 20\\div 8 = 2.5 \\) min per stick; \\( 2\\times 2.5 = 5 \\) min.",
    ],
  },

  {
    question: "Change \\( 1.25 \\) to a fraction.",
    image: null,
    type: "objective",
    options: [
      "\\( \\dfrac{1}{4} \\)",
      "\\( \\dfrac{15}{7} \\)",
      "\\( \\dfrac{11}{8} \\)",
      "\\( \\dfrac{5}{4} \\)",
      "\\( \\dfrac{6}{5} \\)",
    ],
    correctIndex: 3,
    hint: "\\( 1.25 = 1\\tfrac{1}{4} \\).",
    explanation: ["\\( 1.25 = \\frac{125}{100} = \\frac{5}{4} \\)."],
  },

  {
    question:
      "The sum of the first \\( n \\) positive integers is \\( \\dfrac{n(n+1)}{2} \\). Evaluate \\( 1+2+3+\\cdots+200 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 20100 \\)",
      "\\( 18500 \\)",
      "\\( 16300 \\)",
      "\\( 14700 \\)",
      "\\( 12900 \\)",
    ],
    correctIndex: 0,
    hint: "Use the formula with \\( n=200 \\).",
    explanation: ["\\( \\frac{200\\times 201}{2} = 20100 \\)."],
  },

  {
    question: "Which of the following is NOT a perfect square?",
    image: null,
    type: "objective",
    options: [
      "\\( 16 \\)",
      "\\( 20 \\)",
      "\\( 25 \\)",
      "\\( 36 \\)",
      "\\( 49 \\)",
    ],
    correctIndex: 1,
    hint: "Which one is not \\( k\\times k \\)?",
    explanation: [
      "\\( 16=4^2,25=5^2,36=6^2,49=7^2 \\); \\( 20 \\) is not a perfect square.",
    ],
  },

  {
    question:
      "\\( a \\) and \\( b \\) are positive integers with \\( a:b = 4:1 \\) and \\( a:4 = 4:2 \\). Find \\( a+b \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 8 \\)",
      "\\( 9 \\)",
      "\\( 10 \\)",
      "\\( 11 \\)",
      "\\( 12 \\)",
    ],
    correctIndex: 2,
    hint: "From \\( a:4 = 4:2 \\) find \\( a \\), then use \\( a = 4b \\).",
    explanation: [
      "\\( a:4 = 2:1 \\Rightarrow a = 8 \\); \\( a=4b \\Rightarrow b=2 \\); \\( a+b = 10 \\).",
    ],
  },

  {
    question: "Which of the following is a positive number?",
    image: null,
    type: "objective",
    options: [
      "\\( (-4)\\times(-5)\\times(-6) \\)",
      "\\( 7\\times 8\\times(-9) \\)",
      "\\( 10\\times(-11)\\times 12 \\)",
      "\\( (-13)\\times(-14)\\times(-15) \\)",
      "\\( (-16)\\times 17\\times(-18) \\)",
    ],
    correctIndex: 4,
    hint: "An even number of negative factors gives a positive product.",
    explanation: [
      "Option E has two negative factors → positive; all others have one or three negatives → negative.",
    ],
  },

  {
    question:
      "A teacher takes \\( 18 \\) students on a trip. They pay \\( ₦6300 \\) in total for transport and entrance tickets. If transport costs \\( ₦2700 \\), how much is one entrance ticket?",
    image: null,
    type: "objective",
    options: [
      "\\( ₦200 \\)",
      "\\( ₦250 \\)",
      "\\( ₦300 \\)",
      "\\( ₦350 \\)",
      "\\( ₦400 \\)",
    ],
    correctIndex: 0,
    hint: "Tickets cost \\( 6300 - 2700 \\) in total.",
    explanation: ["\\( (6300-2700)\\div 18 = 3600\\div 18 = ₦200 \\)."],
  },

  {
    question: "What is \\( 150\\% \\) of \\( 150 \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( 175 \\)",
      "\\( 200 \\)",
      "\\( 225 \\)",
      "\\( 250 \\)",
      "\\( 275 \\)",
    ],
    correctIndex: 2,
    hint: "\\( 150\\% = 1.5 \\).",
    explanation: ["\\( 1.5 \\times 150 = 225 \\)."],
  },

  {
    question:
      "Evaluate \\( \\dfrac{\\frac{1}{2}-\\frac{1}{3}}{\\frac{1}{2}+\\frac{1}{3}} \\).",
    image: null,
    type: "objective",
    options: [
      "\\( \\dfrac{1}{5} \\)",
      "\\( \\dfrac{5}{6} \\)",
      "\\( \\dfrac{1}{6} \\)",
      "\\( \\dfrac{3}{4} \\)",
      "\\( \\dfrac{4}{5} \\)",
    ],
    correctIndex: 0,
    hint: "Top \\( = \\frac{1}{6} \\), bottom \\( = \\frac{5}{6} \\).",
    explanation: ["\\( \\frac{1/6}{5/6} = \\frac{1}{5} \\)."],
  },

  {
    question: "Which of the following is divisible by \\( 3 \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( 100 \\)",
      "\\( 210 \\)",
      "\\( 340 \\)",
      "\\( 430 \\)",
      "\\( 560 \\)",
    ],
    correctIndex: 1,
    hint: "Check the digit sum.",
    explanation: [
      "\\( 2+1+0 = 3 \\), so \\( 210 \\) is divisible by \\( 3 \\).",
    ],
  },

  {
    question:
      "Find the product of the L.C.M. and H.C.F. of \\( 6 \\) and \\( 8 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 14 \\)",
      "\\( 26 \\)",
      "\\( 36 \\)",
      "\\( 48 \\)",
      "\\( 52 \\)",
    ],
    correctIndex: 3,
    hint: "\\( \\text{LCM}\\times\\text{HCF} = \\) product of the numbers.",
    explanation: [
      "\\( \\text{LCM}=24,\\;\\text{HCF}=2 \\); \\( 24\\times 2 = 48 = 6\\times 8 \\).",
    ],
  },

  {
    question: "Which of the following is a prime number?",
    image: null,
    type: "objective",
    options: [
      "\\( 21 \\)",
      "\\( 35 \\)",
      "\\( 49 \\)",
      "\\( 54 \\)",
      "\\( 61 \\)",
    ],
    correctIndex: 4,
    hint: "A prime has no factors other than \\( 1 \\) and itself.",
    explanation: [
      "\\( 21=3\\times7,35=5\\times7,49=7^2,54=2\\times27 \\); \\( 61 \\) is prime.",
    ],
  },

  {
    question:
      "Which of the following is neither a factor of \\( 80 \\) nor a multiple of \\( 8 \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( 8 \\)",
      "\\( 16 \\)",
      "\\( 30 \\)",
      "\\( 40 \\)",
      "\\( 80 \\)",
    ],
    correctIndex: 2,
    hint: "Check each for ‘factor of 80’ and ‘multiple of 8’.",
    explanation: [
      "\\( 8,16 \\) are multiples of \\( 8 \\); \\( 40,80 \\) are factors of \\( 80 \\); \\( 30 \\) is neither.",
    ],
  },

  {
    question: "Which of the following is NOT equal to \\( \\dfrac{1}{5} \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( \\dfrac{2}{10} \\)",
      "\\( \\dfrac{3}{12} \\)",
      "\\( \\dfrac{4}{20} \\)",
      "\\( \\dfrac{5}{25} \\)",
      "\\( \\dfrac{6}{30} \\)",
    ],
    correctIndex: 1,
    hint: "Simplify each fraction.",
    explanation: [
      "\\( \\frac{3}{12} = \\frac{1}{4} \\neq \\frac{1}{5} \\); the rest equal \\( \\frac{1}{5} \\).",
    ],
  },

  {
    question:
      "Evaluate \\( \\left(1-\\dfrac{1}{2}\\right)\\times\\left(1-\\dfrac{1}{3}\\right)\\times\\left(1-\\dfrac{1}{4}\\right) \\).",
    image: null,
    type: "objective",
    options: [
      "\\( \\dfrac{1}{4} \\)",
      "\\( \\dfrac{1}{5} \\)",
      "\\( \\dfrac{2}{5} \\)",
      "\\( \\dfrac{5}{6} \\)",
      "\\( 1 \\)",
    ],
    correctIndex: 0,
    hint: "Simplify each bracket first.",
    explanation: [
      "\\( \\frac{1}{2}\\times\\frac{2}{3}\\times\\frac{3}{4} = \\frac{6}{24} = \\frac{1}{4} \\).",
    ],
  },

  {
    question:
      "Arrange from least to greatest: \\( \\dfrac{3}{5},\\ \\dfrac{7}{10},\\ \\dfrac{13}{20} \\).",
    image: null,
    type: "objective",
    options: [
      "\\( \\dfrac{13}{20},\\ \\dfrac{7}{10},\\ \\dfrac{3}{5} \\)",
      "\\( \\dfrac{13}{20},\\ \\dfrac{3}{5},\\ \\dfrac{7}{10} \\)",
      "\\( \\dfrac{3}{5},\\ \\dfrac{7}{10},\\ \\dfrac{13}{20} \\)",
      "\\( \\dfrac{3}{5},\\ \\dfrac{13}{20},\\ \\dfrac{7}{10} \\)",
      "\\( \\dfrac{7}{10},\\ \\dfrac{3}{5},\\ \\dfrac{13}{20} \\)",
    ],
    correctIndex: 3,
    hint: "Use a common denominator of \\( 20 \\): \\( \\frac{12}{20},\\frac{14}{20},\\frac{13}{20} \\).",
    explanation: [
      "\\( \\frac{3}{5}=\\frac{12}{20} < \\frac{13}{20} < \\frac{14}{20}=\\frac{7}{10} \\).",
    ],
  },

  {
    question:
      "It is ten minutes past three. What is the time after one hundred minutes?",
    image: null,
    type: "objective",
    options: [
      "twenty minutes to five",
      "ten minutes past five",
      "half past four",
      "ten minutes past four",
      "ten minutes to five",
    ],
    correctIndex: 4,
    hint: "\\( 100 \\) minutes \\( = 1 \\) hour \\( 40 \\) minutes.",
    explanation: ["\\( 3{:}10 + 1{:}40 = 4{:}50 \\) = ten minutes to five."],
  },

  {
    question: "Evaluate \\( 20 + 0.2 + 0.12 \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 2.14 \\)",
      "\\( 2.23 \\)",
      "\\( 20.32 \\)",
      "\\( 22.02 \\)",
      "\\( 23.12 \\)",
    ],
    correctIndex: 2,
    hint: "Line up the decimal points.",
    explanation: ["\\( 20 + 0.2 + 0.12 = 20.32 \\)."],
  },

  {
    question:
      "Austin and Michael together have \\( ₦800 \\). If Austin gives \\( ₦100 \\) to Michael, they will each have the same amount. How much did Austin have at the beginning?",
    image: null,
    type: "objective",
    options: [
      "\\( ₦600 \\)",
      "\\( ₦500 \\)",
      "\\( ₦400 \\)",
      "\\( ₦300 \\)",
      "\\( ₦200 \\)",
    ],
    correctIndex: 1,
    hint: "After sharing equally each has \\( ₦400 \\); Austin gave away \\( ₦100 \\).",
    explanation: [
      "Each ends with \\( ₦400 \\); Austin gave \\( ₦100 \\), so he started with \\( ₦500 \\).",
    ],
  },

  {
    question:
      "Nine more than a number equals four times the number. What is the difference between six times the number and the number itself?",
    image: null,
    type: "objective",
    options: [
      "\\( 9 \\)",
      "\\( 10 \\)",
      "\\( 13 \\)",
      "\\( 15 \\)",
      "\\( 17 \\)",
    ],
    correctIndex: 3,
    hint: "Solve \\( x+9 = 4x \\) first.",
    explanation: ["\\( x+9=4x \\Rightarrow x=3 \\); \\( 6x - x = 5x = 15 \\)."],
  },

  {
    question: "Which number is between \\( 11{,}888 \\) and \\( 12{,}222 \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( 11{,}777 \\)",
      "\\( 11{,}879 \\)",
      "\\( 12{,}129 \\)",
      "\\( 12{,}231 \\)",
      "\\( 12{,}321 \\)",
    ],
    correctIndex: 2,
    hint: "It must be larger than \\( 11{,}888 \\) and smaller than \\( 12{,}222 \\).",
    explanation: ["\\( 11{,}888 < 12{,}129 < 12{,}222 \\)."],
  },

  {
    question: "Today is Monday. After how many days will it be a Monday again?",
    image: null,
    type: "objective",
    options: [
      "\\( 35 \\)",
      "\\( 30 \\)",
      "\\( 25 \\)",
      "\\( 20 \\)",
      "\\( 15 \\)",
    ],
    correctIndex: 0,
    hint: "It must be a multiple of \\( 7 \\).",
    explanation: ["\\( 35 = 5\\times 7 \\) is the only multiple of \\( 7 \\)."],
  },

  {
    question:
      "Find the least three-digit number which is divisible by \\( 6 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 100 \\)",
      "\\( 101 \\)",
      "\\( 102 \\)",
      "\\( 103 \\)",
      "\\( 104 \\)",
    ],
    correctIndex: 2,
    hint: "Divisible by \\( 6 \\) means divisible by both \\( 2 \\) and \\( 3 \\).",
    explanation: [
      "\\( 102 \\) is even and \\( 1+0+2=3 \\) is divisible by \\( 3 \\); \\( 102\\div 6 = 17 \\).",
    ],
  },

  {
    question:
      "There are \\( 26 \\) students in a class; the number of girls is five more than twice the number of boys. If \\( x \\) is the number of girls, which equation is true?",
    image: null,
    type: "objective",
    options: [
      "\\( x-\\dfrac{x-5}{2}=26 \\)",
      "\\( x-\\dfrac{x+2}{5}=26 \\)",
      "\\( x+\\dfrac{x-2}{5}=26 \\)",
      "\\( x+\\dfrac{x-5}{2}=26 \\)",
      "\\( x+\\dfrac{x+5}{2}=26 \\)",
    ],
    correctIndex: 3,
    hint: "Boys \\( = \\dfrac{x-5}{2} \\); boys \\( + \\) girls \\( = 26 \\).",
    explanation: [
      "Girls \\( x = 2(\\text{boys})+5 \\Rightarrow \\text{boys}=\\frac{x-5}{2} \\); so \\( x + \\frac{x-5}{2} = 26 \\).",
    ],
  },

  // GEOMETRY
  {
    question: "A square has",
    image: null,
    type: "objective",
    options: [
      "\\( 1 \\) side",
      "\\( 2 \\) sides",
      "\\( 3 \\) sides",
      "\\( 4 \\) sides",
      "\\( 5 \\) sides",
    ],
    correctIndex: 3,
    hint: "Count the edges of a square.",
    explanation: ["A square has \\( 4 \\) equal sides."],
  },

  {
    question: "Find the area of the square given (side \\( 8 \\) cm).",
    image: svg(
      "0 0 120 120",
      `<rect x="25" y="25" width="70" height="70"/>` +
        T(60, 112, "8 cm", 12) +
        T(108, 62, "8 cm", 12),
    ),
    type: "objective",
    options: [
      "\\( 16\\ \\text{cm}^2 \\)",
      "\\( 30\\ \\text{cm}^2 \\)",
      "\\( 32\\ \\text{cm}^2 \\)",
      "\\( 40\\ \\text{cm}^2 \\)",
      "\\( 64\\ \\text{cm}^2 \\)",
    ],
    correctIndex: 4,
    hint: "Area \\( = \\) side \\( \\times \\) side.",
    explanation: ["\\( 8\\times 8 = 64\\ \\text{cm}^2 \\)."],
  },

  {
    question:
      "Find \\( x \\) in the given right-angled triangle (one angle is \\( 60^{\\circ} \\)).",
    image: svg(
      "0 0 130 120",
      `<path d="M25 100 L110 100 L110 30 Z"/>` +
        `<rect x="100" y="90" width="10" height="10" stroke-width="1.5"/>` +
        T(102, 24, "x", 13) +
        T(95, 96, "60°", 11),
    ),
    type: "objective",
    options: [
      "\\( 20^{\\circ} \\)",
      "\\( 30^{\\circ} \\)",
      "\\( 40^{\\circ} \\)",
      "\\( 50^{\\circ} \\)",
      "\\( 60^{\\circ} \\)",
    ],
    correctIndex: 1,
    hint: "The angles add to \\( 180^{\\circ} \\), and one is \\( 90^{\\circ} \\).",
    explanation: [
      "\\( x = 180^{\\circ} - 90^{\\circ} - 60^{\\circ} = 30^{\\circ} \\).",
    ],
  },

  {
    question: "How many vertices does a cuboid have?",
    image: null,
    type: "objective",
    options: ["\\( 3 \\)", "\\( 4 \\)", "\\( 5 \\)", "\\( 8 \\)", "\\( 10 \\)"],
    correctIndex: 3,
    hint: "Count the corners of a box.",
    explanation: ["A cuboid has \\( 8 \\) vertices."],
  },

  {
    question: "Which is the odd one out?",
    image: null,
    type: "objective",
    options: ["square", "triangle", "rectangle", "cube", "pentagon"],
    correctIndex: 3,
    hint: "Four are flat (2-D) shapes.",
    explanation: [
      "A cube is a \\( 3 \\)-D solid; the others are \\( 2 \\)-D shapes.",
    ],
  },

  {
    question: "Find the volume of a cube whose edges are \\( 2 \\) cm each.",
    image: null,
    type: "objective",
    options: [
      "\\( 2\\ \\text{cm}^3 \\)",
      "\\( 4\\ \\text{cm}^3 \\)",
      "\\( 8\\ \\text{cm}^3 \\)",
      "\\( 16\\ \\text{cm}^3 \\)",
      "\\( 64\\ \\text{cm}^3 \\)",
    ],
    correctIndex: 2,
    hint: "Volume \\( = \\) side\\( ^3 \\).",
    explanation: ["\\( 2^3 = 8\\ \\text{cm}^3 \\)."],
  },

  {
    question:
      "If the breadth of a rectangle is \\( 10 \\) cm and its length is twice the breadth, find the perimeter.",
    image: null,
    type: "objective",
    options: [
      "\\( 20 \\) cm",
      "\\( 30 \\) cm",
      "\\( 40 \\) cm",
      "\\( 50 \\) cm",
      "\\( 60 \\) cm",
    ],
    correctIndex: 4,
    hint: "Length \\( = 20 \\) cm; perimeter \\( = 2(l+b) \\).",
    explanation: ["\\( 2(20+10) = 60 \\) cm."],
  },

  {
    question: "Which of the following is NOT a cylinder?",
    image: svg(
      "0 0 250 70",
      // 4 cylinders + 1 cone (option D)
      `<g><ellipse cx="30" cy="18" rx="14" ry="5"/><path d="M16 18 V52 a14 5 0 0 0 28 0 V18"/></g>` +
        T(30, 66, "A", 11) +
        `<g><ellipse cx="80" cy="18" rx="14" ry="5"/><path d="M66 18 V52 a14 5 0 0 0 28 0 V18"/></g>` +
        T(80, 66, "B", 11) +
        `<g><ellipse cx="130" cy="18" rx="14" ry="5"/><path d="M116 18 V52 a14 5 0 0 0 28 0 V18"/></g>` +
        T(130, 66, "C", 11) +
        `<g><path d="M180 14 L194 52 L166 52 Z"/></g>` +
        T(180, 66, "D", 11) +
        `<g><ellipse cx="230" cy="18" rx="14" ry="5"/><path d="M216 18 V52 a14 5 0 0 0 28 0 V18"/></g>` +
        T(230, 66, "E", 11),
    ),
    type: "objective",
    options: ["A", "B", "C", "D", "E"],
    correctIndex: 3,
    hint: "A cylinder has two equal circular ends.",
    explanation: ["Shape D is a cone (pyramid-like), not a cylinder."],
  },

  {
    question:
      "Find \\( x \\) in the figure where lines \\( m \\) and \\( n \\) are parallel (angles \\( 60^{\\circ} \\) and \\( 40^{\\circ} \\) are marked).",
    image: svg(
      "0 0 200 140",
      `<line x1="20" y1="40" x2="180" y2="40"/>` +
        T(190, 44, "m", 12) +
        `<line x1="20" y1="110" x2="180" y2="110"/>` +
        T(190, 114, "n", 12) +
        `<line x1="60" y1="20" x2="150" y2="130"/><line x1="150" y1="20" x2="80" y2="130"/>` +
        T(112, 36, "60°", 10) +
        T(132, 52, "40°", 10) +
        T(96, 104, "x", 12),
    ),
    type: "objective",
    options: [
      "\\( 90^{\\circ} \\)",
      "\\( 80^{\\circ} \\)",
      "\\( 75^{\\circ} \\)",
      "\\( 60^{\\circ} \\)",
      "\\( 40^{\\circ} \\)",
    ],
    correctIndex: 1,
    hint: "The two given angles and the third angle of the triangle add to \\( 180^{\\circ} \\); \\( x \\) is alternate to that third angle.",
    explanation: [
      "Third angle \\( = 180^{\\circ}-60^{\\circ}-40^{\\circ} = 80^{\\circ} \\), and \\( x = 80^{\\circ} \\) (alternate angles). ⚠ Verify against the official figure.",
    ],
  },

  {
    question: "Which of the following is NOT a quadrilateral?",
    image: null,
    type: "objective",
    options: ["Triangle", "Square", "Rectangle", "Trapezium", "Parallelogram"],
    correctIndex: 0,
    hint: "A quadrilateral has four sides.",
    explanation: ["A triangle has only \\( 3 \\) sides."],
  },

  {
    question:
      "In the figure a rectangle is given (top \\( 12 \\), left \\( 8 \\), right \\( y-2 \\), bottom \\( x+4 \\)). Find \\( x+y \\).",
    image: svg(
      "0 0 200 110",
      `<rect x="30" y="25" width="120" height="60"/>` +
        T(90, 18, "12", 12) +
        T(20, 58, "8", 12) +
        T(168, 58, "y−2", 11) +
        T(90, 100, "x+4", 11),
    ),
    type: "objective",
    options: [
      "\\( 10 \\)",
      "\\( 12 \\)",
      "\\( 15 \\)",
      "\\( 18 \\)",
      "\\( 20 \\)",
    ],
    correctIndex: 3,
    hint: "Opposite sides of a rectangle are equal.",
    explanation: [
      "\\( x+4 = 12 \\Rightarrow x=8 \\); \\( y-2 = 8 \\Rightarrow y=10 \\); \\( x+y = 18 \\).",
    ],
  },

  {
    question:
      "Find the area of a triangle whose base is \\( 9 \\) cm and height \\( 6 \\) cm.",
    image: null,
    type: "objective",
    options: [
      "\\( 12\\ \\text{cm}^2 \\)",
      "\\( 15\\ \\text{cm}^2 \\)",
      "\\( 18\\ \\text{cm}^2 \\)",
      "\\( 24\\ \\text{cm}^2 \\)",
      "\\( 27\\ \\text{cm}^2 \\)",
    ],
    correctIndex: 4,
    hint: "Area \\( = \\tfrac{1}{2}\\times \\text{base}\\times \\text{height} \\).",
    explanation: [
      "\\( \\frac{1}{2}\\times 9\\times 6 = 27\\ \\text{cm}^2 \\).",
    ],
  },

  {
    question:
      "Find the perimeter of the L-shaped figure (sides \\( 16 \\), \\( 14 \\), \\( 20 \\), \\( 4 \\)).",
    image: svg(
      "0 0 200 150",
      `<path d="M20 20 L20 130 L180 130 L180 105 L70 105 L70 20 Z"/>` +
        T(12, 75, "16", 11) +
        T(125, 100, "14", 11) +
        T(100, 144, "20", 11) +
        T(188, 118, "4", 11),
    ),
    type: "objective",
    options: [
      "\\( 40 \\) cm",
      "\\( 48 \\) cm",
      "\\( 64 \\) cm",
      "\\( 72 \\) cm",
      "\\( 80 \\) cm",
    ],
    correctIndex: 3,
    hint: "For an L-shape the perimeter equals that of its bounding rectangle.",
    explanation: [
      "Bounding box \\( 20\\times16 \\): perimeter \\( = 2(20+16) = 72 \\) cm. ⚠ Verify side labels against the official figure.",
    ],
  },

  {
    question:
      "A circle is divided into three sectors from the centre: two are equal and the third is a quarter circle. Find \\( x \\) (one of the equal sectors).",
    image: svg(
      "0 0 130 130",
      `<circle cx="65" cy="65" r="55"/>` +
        `<line x1="65" y1="65" x2="65" y2="10"/><line x1="65" y1="65" x2="120" y2="65"/><line x1="65" y1="65" x2="20" y2="105"/>` +
        T(78, 55, "¼", 11) +
        T(95, 92, "x", 12) +
        T(45, 92, "x", 12),
    ),
    type: "objective",
    options: [
      "\\( 95^{\\circ} \\)",
      "\\( 120^{\\circ} \\)",
      "\\( 135^{\\circ} \\)",
      "\\( 150^{\\circ} \\)",
      "\\( 180^{\\circ} \\)",
    ],
    correctIndex: 2,
    hint: "A quarter circle is \\( 90^{\\circ} \\); the rest is split into two equal parts.",
    explanation: [
      "Remaining \\( 360^{\\circ}-90^{\\circ}=270^{\\circ} \\), split equally: \\( x = 135^{\\circ} \\).",
    ],
  },

  {
    question:
      "Find the shaded area in the given rectangle (a triangle inside a rectangle; bottom split \\( 8 \\) and \\( 4 \\), right split \\( 2 \\) and \\( 6 \\)).",
    image: svg(
      "0 0 200 130",
      `<rect x="20" y="15" width="160" height="100"/>` +
        `<path d="M20 15 L180 55 L100 115 Z" fill="currentColor" fill-opacity="0.5"/>` +
        T(70, 128, "8", 11) +
        T(140, 128, "4", 11) +
        T(190, 35, "2", 11) +
        T(190, 85, "6", 11),
    ),
    type: "objective",
    options: [
      "\\( 40 \\)",
      "\\( 50 \\)",
      "\\( 54 \\)",
      "\\( 68 \\)",
      "\\( 90 \\)",
    ],
    correctIndex: 2,
    hint: "Find the rectangle's dimensions, then use \\( \\tfrac{1}{2}\\,b\\,h \\) for the triangle.",
    explanation: [
      "With the given splits the shaded triangle works out to \\( 54 \\). ⚠ Strongly figure-dependent — verify against the official key.",
    ],
  },

  // APTITUDE
  {
    question: "What is the next number in the series: \\( 1, 2, 3, 4, 5, ? \\)",
    image: null,
    type: "objective",
    options: ["\\( 4 \\)", "\\( 6 \\)", "\\( 7 \\)", "\\( 8 \\)", "\\( 10 \\)"],
    correctIndex: 1,
    hint: "Count on by one.",
    explanation: ["\\( 5+1 = 6 \\)."],
  },

  {
    question:
      "What is the next number in the series: \\( 24, 20, 16, 12, ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 14 \\)",
      "\\( 12 \\)",
      "\\( 10 \\)",
      "\\( 8 \\)",
      "\\( 6 \\)",
    ],
    correctIndex: 3,
    hint: "Each term decreases by \\( 4 \\).",
    explanation: ["\\( 12 - 4 = 8 \\)."],
  },

  {
    question: "ONE → \\( 3 \\); TWO → \\( 3 \\); THREE → \\( 5 \\); NINE → ?",
    image: null,
    type: "objective",
    options: ["\\( 3 \\)", "\\( 4 \\)", "\\( 5 \\)", "\\( 6 \\)", "\\( 9 \\)"],
    correctIndex: 1,
    hint: "Count the letters in each word.",
    explanation: ["NINE has \\( 4 \\) letters."],
  },

  {
    question: "What is the next number: \\( 8, 24, 12, 36, 18, 54, ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 72 \\)",
      "\\( 49 \\)",
      "\\( 36 \\)",
      "\\( 27 \\)",
      "\\( 16 \\)",
    ],
    correctIndex: 3,
    hint: "The operations alternate \\( \\times 3 \\) then \\( \\div 2 \\).",
    explanation: ["\\( 54 \\div 2 = 27 \\)."],
  },

  {
    question:
      "Tanya is older than Eric. Cliff is older than Tanya. Eric is older than Jessica. Cliff is older than Eric. Tanya is younger than Michael. Who is the youngest?",
    image: null,
    type: "objective",
    options: ["Tanya", "Eric", "Cliff", "Jessica", "Michael"],
    correctIndex: 3,
    hint: "Order them from oldest to youngest.",
    explanation: [
      "Eric is older than Jessica, and everyone else is older than Eric, so Jessica is youngest.",
    ],
  },

  {
    question: "Find the odd one out: \\( 3, 5, 11, 14, 17, 21 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 3 \\)",
      "\\( 5 \\)",
      "\\( 11 \\)",
      "\\( 14 \\)",
      "\\( 21 \\)",
    ],
    correctIndex: 3,
    hint: "Look at which is even.",
    explanation: ["\\( 14 \\) is the only even number; the rest are odd."],
  },

  {
    question: "Find the odd one out: \\( 6, 9, 15, 21, 24, 28, 30 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 6 \\)",
      "\\( 9 \\)",
      "\\( 15 \\)",
      "\\( 21 \\)",
      "\\( 28 \\)",
    ],
    correctIndex: 4,
    hint: "Which is not a multiple of \\( 3 \\)?",
    explanation: [
      "\\( 28 \\) is not a multiple of \\( 3 \\); all the others are.",
    ],
  },

  {
    question: "Find the odd one out: \\( 396, 462, 572, 427, 671, 264 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 396 \\)",
      "\\( 462 \\)",
      "\\( 427 \\)",
      "\\( 671 \\)",
      "\\( 264 \\)",
    ],
    correctIndex: 2,
    hint: "Test each for divisibility by \\( 11 \\).",
    explanation: [
      "\\( 396,462,572,671,264 \\) are all divisible by \\( 11 \\); \\( 427 \\) is not.",
    ],
  },

  {
    question:
      "Find the wrong number in the series: \\( 1, 1, 2, 6, 24, 96, 720 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 2 \\)",
      "\\( 6 \\)",
      "\\( 24 \\)",
      "\\( 96 \\)",
      "\\( 720 \\)",
    ],
    correctIndex: 3,
    hint: "These should be the factorials \\( 0!,1!,2!,3!,4!,5!,6! \\).",
    explanation: ["\\( 5! = 120 \\), not \\( 96 \\); so \\( 96 \\) is wrong."],
  },

  {
    question:
      "\\( 12593 \\) is to \\( 35291 \\) and \\( 29684 \\) is to \\( 46982 \\). Therefore \\( 72936 \\) is to ?",
    image: null,
    type: "objective",
    options: [
      "\\( 69237 \\)",
      "\\( 69732 \\)",
      "\\( 67329 \\)",
      "\\( 39267 \\)",
      "\\( 36297 \\)",
    ],
    correctIndex: 0,
    hint: "The digits are rearranged by a fixed position pattern (the middle digit stays put).",
    explanation: [
      "Positions map \\( (1,2,3,4,5)\\to(5,3,2,4,1) \\): \\( 72936 \\to 69237 \\).",
    ],
  },

  {
    question:
      "In each triangle a number sits in the middle. Triangles: \\( (4 \\text{ top}, 7, 9 \\to 12) \\), \\( (1,1,4 \\to 4) \\), \\( (2,6,5 \\to ?) \\). Which number replaces the question mark?",
    image: svg(
      "0 0 240 110",
      `<path d="M40 20 L70 90 L10 90 Z"/>` +
        T(40, 30, "4", 12) +
        T(40, 75, "12", 12) +
        T(18, 86, "7", 11) +
        T(62, 86, "9", 11) +
        `<path d="M120 20 L150 90 L90 90 Z"/>` +
        T(120, 30, "1", 12) +
        T(120, 75, "4", 12) +
        T(98, 86, "1", 11) +
        T(142, 86, "4", 11) +
        `<path d="M200 20 L230 90 L170 90 Z"/>` +
        T(200, 30, "2", 12) +
        T(200, 75, "?", 12) +
        T(178, 86, "6", 11) +
        T(222, 86, "5", 11),
    ),
    type: "objective",
    options: [
      "\\( 7 \\)",
      "\\( 9 \\)",
      "\\( 12 \\)",
      "\\( 14 \\)",
      "\\( 18 \\)",
    ],
    correctIndex: 1,
    hint: "Middle \\( = \\) (bottom-left) \\( + \\) (bottom-right) \\( - \\) (top).",
    explanation: ["\\( 7+9-4=12 \\), \\( 1+4-1=4 \\), so \\( 6+5-2 = 9 \\)."],
  },

  {
    question:
      "There are \\( 2 \\) mothers, \\( 2 \\) daughters, \\( 1 \\) grandmother and \\( 1 \\) granddaughter. How many people are there?",
    image: null,
    type: "objective",
    options: ["\\( 1 \\)", "\\( 2 \\)", "\\( 3 \\)", "\\( 4 \\)", "\\( 5 \\)"],
    correctIndex: 2,
    hint: "The middle person is both a mother and a daughter.",
    explanation: [
      "Grandmother, mother and daughter — \\( 3 \\) people cover all the roles.",
    ],
  },

  {
    question:
      "What number replaces the question mark?  \\( (13)\\,Q\\,(7) \\); \\( (4)\\,J\\,(9) \\); \\( (16)\\,S\\,(?) \\)",
    image: svg(
      "0 0 220 130",
      `<g>${[
        [40, 28, "13"],
        [110, 28, "Q"],
        [180, 28, "7"],
      ]
        .map(
          ([x, y, s]) =>
            `<ellipse cx="${x}" cy="${y}" rx="22" ry="13"/>` +
            T(x, y + 5, s, 13),
        )
        .join("")}</g>` +
        `<g>${[
          [40, 68, "4"],
          [110, 68, "J"],
          [180, 68, "9"],
        ]
          .map(
            ([x, y, s]) =>
              `<ellipse cx="${x}" cy="${y}" rx="22" ry="13"/>` +
              T(x, y + 5, s, 13),
          )
          .join("")}</g>` +
        `<g>${[
          [40, 108, "16"],
          [110, 108, "S"],
          [180, 108, "?"],
        ]
          .map(
            ([x, y, s]) =>
              `<ellipse cx="${x}" cy="${y}" rx="22" ry="13"/>` +
              T(x, y + 5, s, 13),
          )
          .join("")}</g>`,
    ),
    type: "objective",
    options: [
      "\\( 6 \\)",
      "\\( 7 \\)",
      "\\( 8 \\)",
      "\\( 10 \\)",
      "\\( 14 \\)",
    ],
    correctIndex: 0,
    hint: "Compare (left \\( + \\) right) with the letter's position in the alphabet.",
    explanation: [
      "\\( Q=17,J=10,S=19 \\). Left+right \\( - \\) letter \\( = 3 \\): \\( 13+7-17=3 \\), \\( 4+9-10=3 \\), so \\( 16+?-19=3 \\Rightarrow ?=6 \\). ⚠ Pattern-based — verify against the official key.",
    ],
  },

  {
    question: "Which arrow continues the pattern:  → ↙ ↑ ↘ ?",
    image: svg(
      "0 0 220 60",
      [
        ["→", 20],
        ["↙", 70],
        ["↑", 120],
        ["↘", 170],
      ]
        .map(([s, x]) => T(x, 38, s, 26))
        .join("") + T(210, 38, "?", 22),
    ),
    type: "objective",
    options: ["←", "↓", "↗", "↙", "→"],
    correctIndex: 0,
    hint: "Each arrow turns \\( 135^{\\circ} \\) clockwise.",
    explanation: [
      "Bearings E→SW→N→SE each add \\( 135^{\\circ} \\); the next is W (←). ⚠ Verify against the official figure.",
    ],
  },

  {
    question:
      "The ‘floor’ of a number is the largest whole number not greater than it, e.g. \\( \\text{floor}(14/5)=2 \\). Evaluate \\( \\text{floor}(38/7) + \\text{floor}(38/6) \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 18 \\)",
      "\\( 15 \\)",
      "\\( 14 \\)",
      "\\( 12 \\)",
      "\\( 11 \\)",
    ],
    correctIndex: 4,
    hint: "Evaluate each floor separately.",
    explanation: [
      "\\( \\text{floor}(5.43)=5 \\) and \\( \\text{floor}(6.33)=6 \\); \\( 5+6 = 11 \\).",
    ],
  },

  {
    question:
      "Which number should replace the question mark?  Triangles: \\( (3;8,4 \\to 44) \\), \\( (9;7,2 \\to 32) \\), \\( (8;7,? \\to 75) \\).",
    image: svg(
      "0 0 240 110",
      `<path d="M40 20 L70 90 L10 90 Z"/>` +
        T(40, 30, "3", 12) +
        T(40, 75, "44", 12) +
        T(18, 86, "8", 11) +
        T(62, 86, "4", 11) +
        `<path d="M120 20 L150 90 L90 90 Z"/>` +
        T(120, 30, "9", 12) +
        T(120, 75, "32", 12) +
        T(98, 86, "7", 11) +
        T(142, 86, "2", 11) +
        `<path d="M200 20 L230 90 L170 90 Z"/>` +
        T(200, 30, "8", 12) +
        T(200, 75, "75", 12) +
        T(178, 86, "7", 11) +
        T(222, 86, "?", 11),
    ),
    type: "objective",
    options: ["\\( 3 \\)", "\\( 5 \\)", "\\( 7 \\)", "\\( 9 \\)", "\\( 10 \\)"],
    correctIndex: 1,
    hint: "Middle \\( = \\) bottom-right \\( \\times \\) (bottom-left \\( + \\) top).",
    explanation: [
      "\\( 4\\times(8+3)=44 \\), \\( 2\\times(7+9)=32 \\), so \\( ?\\times(7+8)=75 \\Rightarrow ?=5 \\).",
    ],
  },

  {
    question: "Find the missing number in the grid.",
    image: svg(
      "0 0 170 170",
      (() => {
        const g = [
          [1, 2, 6, 0],
          [1, 3, 6, 5],
          [2, 1, 10, 5],
          [3, 3, "?", 5],
        ];
        let s = "";
        for (let r = 0; r < 4; r++)
          for (let c = 0; c < 4; c++) {
            s +=
              `<rect x="${10 + c * 38}" y="${10 + r * 38}" width="38" height="38"/>` +
              T(29 + c * 38, 34 + r * 38, String(g[r][c]), 14);
          }
        return s;
      })(),
    ),
    type: "objective",
    options: [
      "\\( 14 \\)",
      "\\( 15 \\)",
      "\\( 16 \\)",
      "\\( 18 \\)",
      "\\( 19 \\)",
    ],
    correctIndex: 2,
    hint: "Look for a rule linking the four numbers in each row.",
    explanation: [
      "Following the row pattern of the grid gives \\( 16 \\). ⚠ Grid puzzle reconstructed from the scan — verify against the official key.",
    ],
  },

  {
    question:
      "Complete the analogy of patterned tiles (top pair is to its image as the bottom-left tile is to … ?).",
    image: svg(
      "0 0 200 80",
      `<rect x="20" y="20" width="40" height="40"/>` +
        `<circle cx="33" cy="33" r="5"/>` +
        `<path d="M47 27 l8 0 l-4 8 z" fill="currentColor"/>` +
        T(100, 45, "→", 22) +
        `<rect x="140" y="20" width="40" height="40" stroke-dasharray="4 3"/>` +
        T(160, 46, "?", 18),
    ),
    type: "objective",
    options: ["A", "B", "C", "D", "E"],
    correctIndex: 2,
    hint: "Apply the same change (rotation/shading) shown by the top pair.",
    explanation: [
      "Applying the same transformation as the top pair selects option C. ⚠ Visual analogy — verify against the official figure/key.",
    ],
  },

  {
    question: "How many squares are there in the given figure?",
    image: svg(
      "0 0 130 130",
      `<rect x="15" y="15" width="100" height="100"/>` +
        `<line x1="65" y1="15" x2="65" y2="115"/><line x1="15" y1="65" x2="115" y2="65"/>` +
        `<rect x="40" y="40" width="50" height="50"/>`,
    ),
    type: "objective",
    options: [
      "\\( 2 \\)",
      "\\( 8 \\)",
      "\\( 10 \\)",
      "\\( 12 \\)",
      "\\( 16 \\)",
    ],
    correctIndex: 2,
    hint: "Count squares of every size, including overlapping ones.",
    explanation: [
      "Counting the small, medium, large and overlapping squares gives \\( 10 \\). ⚠ Count depends on the exact figure — verify against the official key.",
    ],
  },

  {
    question:
      "In the \\( 4\\times 4 \\) grid every column and row must contain each shape once. Which row completes the last (bottom) row?",
    image: svg(
      "0 0 200 200",
      (() => {
        const sym = { S: "★", C: "●", Q: "■", T: "▲" };
        const grid = [
          ["S", "T", "C", "Q"],
          ["C", "Q", "S", "T"],
          ["Q", "S", "T", "C"],
          ["", "", "", ""],
        ];
        let s = "";
        for (let r = 0; r < 4; r++)
          for (let c = 0; c < 4; c++) {
            s += `<rect x="${10 + c * 45}" y="${10 + r * 45}" width="45" height="45"/>`;
            if (grid[r][c])
              s += T(32 + c * 45, 42 + r * 45, sym[grid[r][c]], 22);
          }
        s += T(100, 196, "? ? ? ?", 13);
        return s;
      })(),
    ),
    type: "objective",
    options: ["★ ● ■ ▲", "★ ● ▲ ■", "● ▲ ■ ★", "▲ ● ■ ★", "▲ ■ ● ★"],
    correctIndex: 3,
    hint: "Each column is missing exactly one shape.",
    explanation: [
      "Columns are missing ▲, ●, ■, ★ respectively, so the last row is ▲ ● ■ ★.",
    ],
  },

  {
    question:
      "Which piece, when fitted into the piece on the left, forms a perfect square?",
    image: svg(
      "0 0 120 90",
      `<path d="M20 15 H90 V35 H60 V50 H90 V75 H20 Z"/>` +
        T(55, 88, "fit me", 11),
    ),
    type: "objective",
    options: ["A", "B", "C", "D", "E"],
    correctIndex: 0,
    hint: "The missing piece must be the exact complement of the notch.",
    explanation: [
      "Only the piece matching the notch completes the square (option A). ⚠ Jigsaw figure — verify against the official key.",
    ],
  },

  // Q72–75: number pyramid (each cell = sum of the two cells below it)
  {
    question:
      "In the pyramid each number is the sum of the two numbers immediately below it. (Top: \\( z,\\,56 \\); next: \\( 19,\\,x,\\,28 \\); then \\( 7,\\,y,\\ldots \\); bottom: \\( k,\\,7,\\,m \\).) Find \\( x \\).",
    image: svg(
      "0 0 220 150",
      `<rect x="55" y="10" width="50" height="30"/>` +
        T(80, 30, "z", 13) +
        `<rect x="105" y="10" width="50" height="30"/>` +
        T(130, 30, "56", 13) +
        `<rect x="30" y="45" width="50" height="30"/>` +
        T(55, 65, "19", 13) +
        `<rect x="80" y="45" width="50" height="30"/>` +
        T(105, 65, "x", 13) +
        `<rect x="130" y="45" width="50" height="30"/>` +
        T(155, 65, "28", 13) +
        `<rect x="55" y="80" width="50" height="30"/>` +
        T(80, 100, "7", 13) +
        `<rect x="105" y="80" width="50" height="30"/>` +
        T(130, 100, "y", 13) +
        `<rect x="55" y="115" width="40" height="28"/>` +
        T(75, 134, "k", 12) +
        `<rect x="95" y="115" width="40" height="28"/>` +
        T(115, 134, "7", 12) +
        `<rect x="135" y="115" width="40" height="28"/>` +
        T(155, 134, "m", 12),
    ),
    type: "objective",
    options: [
      "\\( 28 \\)",
      "\\( 32 \\)",
      "\\( 36 \\)",
      "\\( 40 \\)",
      "\\( 45 \\)",
    ],
    correctIndex: 0,
    hint: "\\( 56 \\) sits above \\( x \\) and \\( 28 \\), so \\( 56 = x + 28 \\).",
    explanation: [
      "\\( 56 = x + 28 \\Rightarrow x = 28 \\). ⚠ Pyramid reconstructed from the scan — verify against the official key.",
    ],
  },

  {
    question: "Using the same pyramid, find \\( y \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 10 \\)",
      "\\( 12 \\)",
      "\\( 16 \\)",
      "\\( 20 \\)",
      "\\( 26 \\)",
    ],
    correctIndex: 1,
    hint: "\\( 19 \\) sits above \\( 7 \\) and \\( y \\).",
    explanation: [
      "\\( 19 = 7 + y \\Rightarrow y = 12 \\). ⚠ Reconstructed — verify against the official key.",
    ],
  },

  {
    question: "Using the same pyramid, find \\( z \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 12 \\)",
      "\\( 20 \\)",
      "\\( 38 \\)",
      "\\( 47 \\)",
      "\\( 50 \\)",
    ],
    correctIndex: 3,
    hint: "\\( z \\) sits above \\( 19 \\) and \\( x \\).",
    explanation: [
      "\\( z = 19 + x = 19 + 28 = 47 \\). ⚠ Reconstructed — verify against the official key.",
    ],
  },

  {
    question: "Using the same pyramid, find \\( k+m \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 12 \\)",
      "\\( 10 \\)",
      "\\( 8 \\)",
      "\\( 7 \\)",
      "\\( 5 \\)",
    ],
    correctIndex: 4,
    hint: "Build the bottom row so that each cell above is the sum of the two below it.",
    explanation: [
      "The bottom row \\( (2,5,7,9,3) \\) reproduces the pyramid, giving \\( k=2,\\,m=3 \\), so \\( k+m = 5 \\). ⚠ Reconstructed — verify against the official key.",
    ],
  },
];

// ════════════════════════════════════════════════════════════════════
//  2ND ROUND / FINALS — 12TH MARCH 2016
// ════════════════════════════════════════════════════════════════════
export const finals = [
  // ALGEBRA
  {
    question: "Evaluate \\( 5 + 10 + 15 + 20 \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 45 \\)",
      "\\( 50 \\)",
      "\\( 55 \\)",
      "\\( 60 \\)",
      "\\( 65 \\)",
    ],
    correctIndex: 1,
    hint: "Add the multiples of \\( 5 \\).",
    explanation: ["\\( 5+10+15+20 = 50 \\)."],
  },

  {
    question: "Evaluate \\( 3 \\times 6 - 10 \\div 2 \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 4 \\)",
      "\\( 8 \\)",
      "\\( 9 \\)",
      "\\( 12 \\)",
      "\\( 13 \\)",
    ],
    correctIndex: 4,
    hint: "Multiply and divide before subtracting.",
    explanation: ["\\( 18 - 5 = 13 \\)."],
  },

  {
    question: "What percentage of an hour is \\( 36 \\) minutes?",
    image: null,
    type: "objective",
    options: [
      "\\( 30\\% \\)",
      "\\( 40\\% \\)",
      "\\( 50\\% \\)",
      "\\( 60\\% \\)",
      "\\( 70\\% \\)",
    ],
    correctIndex: 3,
    hint: "An hour is \\( 60 \\) minutes.",
    explanation: ["\\( \\frac{36}{60}\\times 100 = 60\\% \\)."],
  },

  {
    question:
      "Simplify \\( \\left(1+\\dfrac{1}{2}\\right)\\left(1+\\dfrac{1}{3}\\right)\\left(1+\\dfrac{1}{4}\\right)\\left(1+\\dfrac{1}{5}\\right) \\).",
    image: null,
    type: "objective",
    options: ["\\( 1 \\)", "\\( 2 \\)", "\\( 3 \\)", "\\( 4 \\)", "\\( 5 \\)"],
    correctIndex: 2,
    hint: "Write each bracket as a single fraction and watch the cancellation.",
    explanation: [
      "\\( \\frac{3}{2}\\cdot\\frac{4}{3}\\cdot\\frac{5}{4}\\cdot\\frac{6}{5} = \\frac{6}{2} = 3 \\).",
    ],
  },

  {
    question: "Change \\( 0.375 \\) to a fraction.",
    image: null,
    type: "objective",
    options: [
      "\\( \\dfrac{1}{11} \\)",
      "\\( \\dfrac{3}{8} \\)",
      "\\( \\dfrac{5}{8} \\)",
      "\\( \\dfrac{2}{7} \\)",
      "\\( \\dfrac{4}{9} \\)",
    ],
    correctIndex: 1,
    hint: "\\( 0.375 = \\frac{375}{1000} \\).",
    explanation: ["\\( \\frac{375}{1000} = \\frac{3}{8} \\)."],
  },

  {
    question: "Evaluate \\( 3^4 - 2^6 \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 17 \\)",
      "\\( 19 \\)",
      "\\( 21 \\)",
      "\\( 22 \\)",
      "\\( 24 \\)",
    ],
    correctIndex: 0,
    hint: "\\( 3^4 = 81 \\), \\( 2^6 = 64 \\).",
    explanation: ["\\( 81 - 64 = 17 \\)."],
  },

  {
    question: "Which decimal fraction is represented by the shaded squares?",
    image: svg(
      "0 0 130 130",
      (() => {
        let s = "";
        const shaded = new Set([
          "0,0",
          "2,0",
          "4,0",
          "1,2",
          "3,2",
          "0,4",
          "2,4",
          "4,4",
          "1,1",
          "3,3",
        ]); // 10/25
        for (let r = 0; r < 5; r++)
          for (let c = 0; c < 5; c++) {
            const f = shaded.has(`${c},${r}`)
              ? 'fill="currentColor" fill-opacity="0.45"'
              : 'fill="none"';
            s += `<rect x="${5 + c * 24}" y="${5 + r * 24}" width="24" height="24" ${f} stroke="currentColor" stroke-width="1.5"/>`;
          }
        return s;
      })(),
    ),
    type: "objective",
    options: [
      "\\( 0.5 \\)",
      "\\( 0.4 \\)",
      "\\( 0.3 \\)",
      "\\( 0.2 \\)",
      "\\( 0.1 \\)",
    ],
    correctIndex: 1,
    hint: "Shaded squares \\( \\div \\) total squares, written as a decimal.",
    explanation: [
      "\\( \\frac{10}{25} = \\frac{4}{10} = 0.4 \\). ⚠ Shaded count read from the scan — verify against the official figure.",
    ],
  },

  {
    question:
      "A farmer counts his goats; each has four legs. The total number of legs is \\( 51 \\) more than the number of goats. How many goats are there?",
    image: null,
    type: "objective",
    options: [
      "\\( 16 \\)",
      "\\( 17 \\)",
      "\\( 18 \\)",
      "\\( 19 \\)",
      "\\( 20 \\)",
    ],
    correctIndex: 1,
    hint: "If there are \\( g \\) goats, \\( 4g = g + 51 \\).",
    explanation: [
      "\\( 4g - g = 51 \\Rightarrow 3g = 51 \\Rightarrow g = 17 \\).",
    ],
  },

  {
    question: "Which of the following fractions is the greatest?",
    image: null,
    type: "objective",
    options: [
      "\\( \\dfrac{11}{12} \\)",
      "\\( \\dfrac{13}{14} \\)",
      "\\( \\dfrac{15}{16} \\)",
      "\\( \\dfrac{17}{18} \\)",
      "\\( \\dfrac{19}{20} \\)",
    ],
    correctIndex: 4,
    hint: "Each is \\( 1 \\) minus a small fraction; the smallest gap wins.",
    explanation: [
      "\\( \\frac{19}{20} = 1-\\frac{1}{20} \\) has the smallest gap, so it is the largest.",
    ],
  },

  {
    question: "Find the square of \\( 5^2 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 5 \\)",
      "\\( 125 \\)",
      "\\( 250 \\)",
      "\\( 475 \\)",
      "\\( 625 \\)",
    ],
    correctIndex: 4,
    hint: "\\( 5^2 = 25 \\); now square that.",
    explanation: ["\\( (5^2)^2 = 25^2 = 625 \\)."],
  },

  {
    question:
      "An ‘interesting number’ is the product of two prime numbers. Which of the following is NOT interesting?",
    image: null,
    type: "objective",
    options: [
      "\\( 6 \\)",
      "\\( 10 \\)",
      "\\( 12 \\)",
      "\\( 14 \\)",
      "\\( 15 \\)",
    ],
    correctIndex: 2,
    hint: "Factorise each into primes.",
    explanation: [
      "\\( 6=2\\times3,10=2\\times5,14=2\\times7,15=3\\times5 \\); but \\( 12=2\\times2\\times3 \\) needs three primes.",
    ],
  },

  {
    question:
      "The sum of the first \\( n \\) odd numbers is \\( n^2 \\). Evaluate \\( 1+3+5+\\cdots+29 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 169 \\)",
      "\\( 196 \\)",
      "\\( 225 \\)",
      "\\( 256 \\)",
      "\\( 289 \\)",
    ],
    correctIndex: 2,
    hint: "How many odd numbers up to \\( 29 \\)?",
    explanation: [
      "\\( 29 = 2(15)-1 \\), so there are \\( 15 \\) terms: \\( 15^2 = 225 \\).",
    ],
  },

  {
    question: "Find \\( \\sqrt{4} \\).",
    image: null,
    type: "objective",
    options: ["\\( 1 \\)", "\\( 2 \\)", "\\( 4 \\)", "\\( 8 \\)", "\\( 16 \\)"],
    correctIndex: 1,
    hint: "What number times itself is \\( 4 \\)?",
    explanation: ["\\( 2\\times 2 = 4 \\), so \\( \\sqrt{4} = 2 \\)."],
  },

  {
    question: "Find \\( x \\) if \\( 3 : 2x = 12 : 40 \\).",
    image: null,
    type: "objective",
    options: ["\\( 1 \\)", "\\( 2 \\)", "\\( 4 \\)", "\\( 5 \\)", "\\( 8 \\)"],
    correctIndex: 3,
    hint: "Cross-multiply: \\( 3\\times 40 = 12\\times 2x \\).",
    explanation: ["\\( 120 = 24x \\Rightarrow x = 5 \\)."],
  },

  {
    question:
      "The sum of two of the numbers \\( -7, -4, -3, -1, 3, 5 \\) is \\( 0 \\). What is the product of these two numbers?",
    image: null,
    type: "objective",
    options: [
      "\\( -9 \\)",
      "\\( -6 \\)",
      "\\( -5 \\)",
      "\\( 2 \\)",
      "\\( 12 \\)",
    ],
    correctIndex: 0,
    hint: "Which pair are opposites?",
    explanation: [
      "\\( -3 + 3 = 0 \\); their product is \\( -3\\times 3 = -9 \\).",
    ],
  },

  {
    question: "Evaluate \\( (7a - 5)\\times(3a - 8) \\) when \\( a = 1 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( -10 \\)",
      "\\( -8 \\)",
      "\\( -6 \\)",
      "\\( -5 \\)",
      "\\( -2 \\)",
    ],
    correctIndex: 0,
    hint: "Substitute \\( a=1 \\) first.",
    explanation: ["\\( (7-5)(3-8) = 2\\times(-5) = -10 \\)."],
  },

  {
    question:
      "On the number line the interval between \\( 3 \\) and \\( 4 \\) is divided into \\( 5 \\) equal parts, and the value \\( a\\tfrac{b}{5} \\) is marked. What is \\( a+b \\)?",
    image: svg(
      "0 0 240 70",
      `<line x1="20" y1="45" x2="220" y2="45"/>` +
        [0, 1, 2, 3, 4, 5]
          .map(
            (i) =>
              `<line x1="${30 + i * 34}" y1="38" x2="${30 + i * 34}" y2="52"/>`,
          )
          .join("") +
        T(30, 66, "3", 11) +
        T(200, 66, "4", 11) +
        `<path d="M166 22 L166 40" stroke-width="2.5"/>`,
    ),
    type: "objective",
    options: ["\\( 5 \\)", "\\( 6 \\)", "\\( 7 \\)", "\\( 8 \\)", "\\( 9 \\)"],
    correctIndex: 2,
    hint: "The whole-number part is \\( 3 \\); read the marked fifth.",
    explanation: [
      "The mark is at \\( 3\\tfrac{4}{5} \\), so \\( a=3,\\,b=4 \\) and \\( a+b = 7 \\). ⚠ Position read from the scan — verify against the official figure.",
    ],
  },

  {
    question:
      "The figure is the answer key for a 10-question test, with James's answers marked. What percentage did James answer correctly?",
    image: svg(
      "0 0 210 150",
      (() => {
        const key = ["A", "A", "B", "C", "D", "B", "A", "D", "D", "A"];
        let s = T(50, 16, "ANSWER KEY", 11) + T(160, 16, "James", 11);
        key.forEach((k, i) => {
          const y = 30 + i * 11;
          s += T(20, y, `${i + 1}–${k}`, 9);
          s += `<circle cx="150" cy="${y - 3}" r="3.5"/>`;
        });
        return s;
      })(),
    ),
    type: "objective",
    options: [
      "\\( 40\\% \\)",
      "\\( 45\\% \\)",
      "\\( 50\\% \\)",
      "\\( 55\\% \\)",
      "\\( 60\\% \\)",
    ],
    correctIndex: 2,
    hint: "Count how many of James's marks match the key, then turn it into a percentage of \\( 10 \\).",
    explanation: [
      "Comparing James's marked bubbles with the key gives \\( 5 \\) correct out of \\( 10 = 50\\% \\). ⚠ James's marks must be read from the scan — verify against the official figure.",
    ],
  },

  {
    question: "What is \\( 20\\% \\) of \\( 15 \\)?",
    image: null,
    type: "objective",
    options: ["\\( 2 \\)", "\\( 3 \\)", "\\( 4 \\)", "\\( 5 \\)", "\\( 6 \\)"],
    correctIndex: 1,
    hint: "\\( 20\\% = \\frac{1}{5} \\).",
    explanation: ["\\( \\frac{1}{5}\\times 15 = 3 \\)."],
  },

  {
    question:
      "Evaluate \\( \\dfrac{\\frac{1}{2}+\\frac{1}{3}+\\frac{1}{6}}{\\frac{1}{2}-\\frac{1}{3}} \\).",
    image: null,
    type: "objective",
    options: [
      "\\( \\dfrac{1}{5} \\)",
      "\\( 5 \\)",
      "\\( \\dfrac{1}{6} \\)",
      "\\( 6 \\)",
      "\\( \\dfrac{5}{6} \\)",
    ],
    correctIndex: 3,
    hint: "Top \\( = 1 \\), bottom \\( = \\frac{1}{6} \\).",
    explanation: [
      "\\( \\frac{1}{2}+\\frac{1}{3}+\\frac{1}{6}=1 \\); \\( \\frac{1}{2}-\\frac{1}{3}=\\frac{1}{6} \\); \\( 1\\div\\frac{1}{6}=6 \\).",
    ],
  },

  {
    question: "Which of the following is NOT divisible by \\( 6 \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( 246 \\)",
      "\\( 336 \\)",
      "\\( 432 \\)",
      "\\( 456 \\)",
      "\\( 578 \\)",
    ],
    correctIndex: 4,
    hint: "Divisible by \\( 6 \\) means even and digit-sum divisible by \\( 3 \\).",
    explanation: [
      "\\( 5+7+8 = 20 \\) is not divisible by \\( 3 \\), so \\( 578 \\) is not divisible by \\( 6 \\).",
    ],
  },

  {
    question: "Which of the following is equal to \\( \\dfrac{2}{7} \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( \\dfrac{16}{60} \\)",
      "\\( \\dfrac{8}{32} \\)",
      "\\( \\dfrac{6}{28} \\)",
      "\\( \\dfrac{12}{40} \\)",
      "\\( \\dfrac{10}{35} \\)",
    ],
    correctIndex: 4,
    hint: "Simplify each fraction.",
    explanation: ["\\( \\frac{10}{35} = \\frac{2}{7} \\)."],
  },

  {
    question: "Which of the following is NOT a prime number?",
    image: null,
    type: "objective",
    options: ["\\( 2 \\)", "\\( 3 \\)", "\\( 5 \\)", "\\( 7 \\)", "\\( 10 \\)"],
    correctIndex: 4,
    hint: "Which one has more than two factors?",
    explanation: ["\\( 10 = 2\\times 5 \\) is composite."],
  },

  {
    question:
      "A father's current age is six times the age difference between his two children. In two years he will be \\( 56 \\). Find the age difference between the children.",
    image: null,
    type: "objective",
    options: ["\\( 5 \\)", "\\( 6 \\)", "\\( 8 \\)", "\\( 9 \\)", "\\( 10 \\)"],
    correctIndex: 3,
    hint: "Father's current age \\( = 56 - 2 = 54 \\).",
    explanation: ["\\( 54 = 6\\times d \\Rightarrow d = 9 \\)."],
  },

  {
    question: "Evaluate \\( 51.4 + 2.41 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 53.81 \\)",
      "\\( 62.6 \\)",
      "\\( 75.5 \\)",
      "\\( 87.214 \\)",
      "\\( 100 \\)",
    ],
    correctIndex: 0,
    hint: "Line up the decimal points.",
    explanation: ["\\( 51.40 + 2.41 = 53.81 \\)."],
  },

  {
    question: "Find \\( x \\) if \\( 5x + 4 = 19 \\).",
    image: null,
    type: "objective",
    options: ["\\( 0 \\)", "\\( 1 \\)", "\\( 2 \\)", "\\( 3 \\)", "\\( 4 \\)"],
    correctIndex: 3,
    hint: "Subtract \\( 4 \\), then divide by \\( 5 \\).",
    explanation: ["\\( 5x = 15 \\Rightarrow x = 3 \\)."],
  },

  {
    question: "Find the L.C.M. of \\( 12 \\), \\( 16 \\) and \\( 20 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 180 \\)",
      "\\( 210 \\)",
      "\\( 220 \\)",
      "\\( 240 \\)",
      "\\( 300 \\)",
    ],
    correctIndex: 3,
    hint: "Use prime factors: \\( 2^4\\times3\\times5 \\).",
    explanation: ["\\( \\text{LCM} = 2^4\\times3\\times5 = 240 \\)."],
  },

  {
    question: "Change \\( 4500 \\) cm to metres.",
    image: null,
    type: "objective",
    options: [
      "\\( 0.45 \\) m",
      "\\( 4.5 \\) m",
      "\\( 45 \\) m",
      "\\( 45000 \\) m",
      "\\( 450000 \\) m",
    ],
    correctIndex: 2,
    hint: "\\( 100 \\) cm \\( = 1 \\) m.",
    explanation: ["\\( 4500\\div 100 = 45 \\) m."],
  },

  {
    question: "Find the average of \\( 3, 5, 5, 7, 7, 9 \\).",
    image: null,
    type: "objective",
    options: ["\\( 5 \\)", "\\( 6 \\)", "\\( 7 \\)", "\\( 8 \\)", "\\( 9 \\)"],
    correctIndex: 1,
    hint: "Add them and divide by \\( 6 \\).",
    explanation: ["\\( \\frac{3+5+5+7+7+9}{6} = \\frac{36}{6} = 6 \\)."],
  },

  {
    question:
      "\\( 133 \\) tonnes of sand was carried by three lorries of capacity \\( 5 \\), \\( 6 \\) and \\( 8 \\) tonnes. If each made the same number of trips, how many trips did each make?",
    image: null,
    type: "objective",
    options: [
      "\\( 7 \\)",
      "\\( 8 \\)",
      "\\( 10 \\)",
      "\\( 11 \\)",
      "\\( 13 \\)",
    ],
    correctIndex: 0,
    hint: "Together they carry \\( 5+6+8 = 19 \\) tonnes per round of trips.",
    explanation: ["\\( 19n = 133 \\Rightarrow n = 7 \\) trips each."],
  },

  {
    question: "Which of the following is greater than \\( 77{,}777 \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( 77{,}121 \\)",
      "\\( 76{,}543 \\)",
      "\\( 77{,}689 \\)",
      "\\( 70{,}999 \\)",
      "\\( 77{,}781 \\)",
    ],
    correctIndex: 4,
    hint: "Compare digit by digit.",
    explanation: ["\\( 77{,}781 > 77{,}777 \\); all others are smaller."],
  },

  {
    question: "How many hours are there in \\( 2 \\) weeks \\( 6 \\) days?",
    image: null,
    type: "objective",
    options: [
      "\\( 500 \\)",
      "\\( 480 \\)",
      "\\( 460 \\)",
      "\\( 440 \\)",
      "\\( 420 \\)",
    ],
    correctIndex: 1,
    hint: "\\( 2 \\) weeks \\( 6 \\) days \\( = 20 \\) days; each day has \\( 24 \\) hours.",
    explanation: ["\\( 20\\times 24 = 480 \\) hours."],
  },

  {
    question:
      "Find the value of \\( 100 - 99 + 98 - 97 + 96 - 95 + \\cdots + 4 - 3 + 2 - 1 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 50 \\)",
      "\\( 40 \\)",
      "\\( 35 \\)",
      "\\( 30 \\)",
      "\\( 20 \\)",
    ],
    correctIndex: 0,
    hint: "Group the numbers into pairs.",
    explanation: [
      "There are \\( 50 \\) pairs, each equal to \\( 1 \\): total \\( = 50 \\).",
    ],
  },

  {
    question: "Ten more than twice a number is \\( 20 \\). What is the number?",
    image: null,
    type: "objective",
    options: [
      "\\( 5 \\)",
      "\\( 10 \\)",
      "\\( 0 \\)",
      "\\( 20 \\)",
      "\\( 15 \\)",
    ],
    correctIndex: 0,
    hint: "Solve \\( 2n + 10 = 20 \\).",
    explanation: ["\\( 2n = 10 \\Rightarrow n = 5 \\)."],
  },

  {
    question:
      "The balance is level: a triangle and a square in the left pan, six circles in the right pan. A triangle weighs four times a circle, and a square weighs \\( 3 \\) g more than a circle. If \\( x \\) is the mass of a circle, which equation models the balance?",
    image: svg(
      "0 0 220 120",
      `<line x1="20" y1="40" x2="200" y2="40"/><line x1="110" y1="40" x2="110" y2="95"/>` +
        `<path d="M40 40 a45 18 0 0 0 50 0" /><path d="M130 40 a45 18 0 0 0 50 0"/>` +
        `<path d="M55 30 l8 -14 l8 14 z"/><rect x="72" y="20" width="12" height="12"/>` +
        [0, 1, 2, 3, 4, 5]
          .map(
            (i) =>
              `<circle cx="${140 + (i % 3) * 12}" cy="${22 + Math.floor(i / 3) * 12}" r="4"/>`,
          )
          .join(""),
    ),
    type: "objective",
    options: [
      "\\( 3x + (x+6) = 4x \\)",
      "\\( 4x - (x-3) = 6x \\)",
      "\\( 4x + (x+3) = 6x \\)",
      "\\( 6x - (x+4) = 3x \\)",
      "\\( 6x - (x-4) = 3x \\)",
    ],
    correctIndex: 2,
    hint: "Left pan \\( = \\) triangle \\( + \\) square \\( = 4x + (x+3) \\); right pan \\( = 6x \\).",
    explanation: [
      "Triangle \\( = 4x \\), square \\( = x+3 \\), six circles \\( = 6x \\): \\( 4x + (x+3) = 6x \\).",
    ],
  },

  // GEOMETRY
  {
    question: "A parallelogram has",
    image: null,
    type: "objective",
    options: [
      "\\( 1 \\) side",
      "\\( 2 \\) sides",
      "\\( 3 \\) sides",
      "\\( 4 \\) sides",
      "\\( 5 \\) sides",
    ],
    correctIndex: 3,
    hint: "Count its edges.",
    explanation: ["A parallelogram has \\( 4 \\) sides."],
  },

  {
    question:
      "The volume of the cuboid (\\( 5 \\) cm \\( \\times \\) \\( 6 \\) cm \\( \\times \\) \\( 10 \\) cm) is",
    image: svg(
      "0 0 200 130",
      `<path d="M30 50 L130 50 L130 110 L30 110 Z"/>` +
        `<path d="M30 50 L60 25 L160 25 L130 50 M130 110 L160 85 L160 25 M130 50 L160 25" />` +
        T(80, 38, "10 cm", 10) +
        T(20, 82, "6 cm", 10) +
        T(150, 70, "5 cm", 10),
    ),
    type: "objective",
    options: [
      "\\( 110\\ \\text{cm}^3 \\)",
      "\\( 240\\ \\text{cm}^3 \\)",
      "\\( 300\\ \\text{cm}^3 \\)",
      "\\( 320\\ \\text{cm}^3 \\)",
      "\\( 360\\ \\text{cm}^3 \\)",
    ],
    correctIndex: 2,
    hint: "Volume \\( = l\\times w\\times h \\).",
    explanation: ["\\( 5\\times 6\\times 10 = 300\\ \\text{cm}^3 \\)."],
  },

  {
    question:
      "Find \\( x \\) in the given right-angled triangle (one angle is \\( 60^{\\circ} \\)).",
    image: svg(
      "0 0 130 120",
      `<path d="M25 100 L110 100 L110 30 Z"/>` +
        `<rect x="100" y="90" width="10" height="10" stroke-width="1.5"/>` +
        T(102, 24, "x", 13) +
        T(95, 96, "60°", 11),
    ),
    type: "objective",
    options: [
      "\\( 20^{\\circ} \\)",
      "\\( 30^{\\circ} \\)",
      "\\( 40^{\\circ} \\)",
      "\\( 50^{\\circ} \\)",
      "\\( 60^{\\circ} \\)",
    ],
    correctIndex: 1,
    hint: "The three angles sum to \\( 180^{\\circ} \\); one is a right angle.",
    explanation: [
      "\\( x = 180^{\\circ} - 90^{\\circ} - 60^{\\circ} = 30^{\\circ} \\).",
    ],
  },

  {
    question: "The pencil in the figure is made of which two solids?",
    image: svg(
      "0 0 200 70",
      `<path d="M20 25 H140 V45 H20 Z"/><path d="M140 25 L175 35 L140 45 Z"/>`,
    ),
    type: "objective",
    options: [
      "a cuboid and a cone",
      "a cylinder and a cone",
      "a cylinder and a cube",
      "a sphere and a cylinder",
      "a sphere and a cuboid",
    ],
    correctIndex: 1,
    hint: "The body is round; the sharpened tip is pointed.",
    explanation: ["The body is a cylinder and the tip is a cone."],
  },

  {
    question:
      "A rectangle has perimeter \\( 64 \\) m. Find its length if the breadth is \\( 12 \\) m.",
    image: null,
    type: "objective",
    options: [
      "\\( 76 \\) m",
      "\\( 52 \\) m",
      "\\( 20 \\) m",
      "\\( 16 \\) m",
      "\\( 12 \\) m",
    ],
    correctIndex: 2,
    hint: "\\( 2(l + 12) = 64 \\).",
    explanation: ["\\( l + 12 = 32 \\Rightarrow l = 20 \\) m."],
  },

  {
    question: "Find the area of a square whose perimeter is \\( 4 \\) cm.",
    image: null,
    type: "objective",
    options: [
      "\\( 1\\ \\text{cm}^2 \\)",
      "\\( 2\\ \\text{cm}^2 \\)",
      "\\( 4\\ \\text{cm}^2 \\)",
      "\\( 8\\ \\text{cm}^2 \\)",
      "\\( 16\\ \\text{cm}^2 \\)",
    ],
    correctIndex: 0,
    hint: "Side \\( = 4\\div 4 = 1 \\) cm.",
    explanation: [
      "Side \\( 1 \\) cm gives area \\( 1\\times 1 = 1\\ \\text{cm}^2 \\).",
    ],
  },

  {
    question:
      "Find the perimeter of a quarter circle of radius \\( 7 \\) cm. \\( \\left(\\pi = \\dfrac{22}{7}\\right) \\)",
    image: svg(
      "0 0 120 120",
      `<path d="M20 100 L20 20 A80 80 0 0 1 100 100 Z"/>`,
    ),
    type: "objective",
    options: [
      "\\( 48 \\) cm",
      "\\( 36 \\) cm",
      "\\( 32 \\) cm",
      "\\( 25 \\) cm",
      "\\( 20 \\) cm",
    ],
    correctIndex: 3,
    hint: "Perimeter \\( = \\) quarter of the circumference \\( + \\) two radii.",
    explanation: [
      "Arc \\( = \\frac{1}{4}(2\\pi r) = \\frac{1}{4}\\times 44 = 11 \\); plus \\( 7+7 \\): \\( 11 + 14 = 25 \\) cm.",
    ],
  },

  {
    question:
      "Find the total area of the two shapes if each unit square represents \\( 4\\ \\text{cm}^2 \\).",
    image: svg(
      "0 0 170 110",
      (() => {
        let s = "";
        for (let r = 0; r < 4; r++)
          for (let c = 0; c < 6; c++)
            s += `<rect x="${10 + c * 25}" y="${10 + r * 22}" width="25" height="22" stroke-width="1" stroke="currentColor" stroke-opacity="0.5"/>`;
        s += `<path d="M10 98 L35 10 L60 98 Z" fill="currentColor" fill-opacity="0.4"/>`;
        s += `<path d="M110 10 L160 10 L110 98 Z" fill="currentColor" fill-opacity="0.4"/>`;
        return s;
      })(),
    ),
    type: "objective",
    options: [
      "\\( 34\\ \\text{cm}^2 \\)",
      "\\( 30\\ \\text{cm}^2 \\)",
      "\\( 28\\ \\text{cm}^2 \\)",
      "\\( 24\\ \\text{cm}^2 \\)",
      "\\( 20\\ \\text{cm}^2 \\)",
    ],
    correctIndex: 2,
    hint: "Count the unit squares the shapes cover, then multiply by \\( 4 \\).",
    explanation: [
      "The two shapes cover about \\( 7 \\) unit squares: \\( 7\\times 4 = 28\\ \\text{cm}^2 \\). ⚠ Square count read from the scan — verify against the official figure.",
    ],
  },

  {
    question:
      "Two parallel lines are cut by two transversals; one angle is \\( 40^{\\circ} \\) (angles labelled \\( a,b,c,d,e,f,h \\)). Which one is NOT equal to \\( 40^{\\circ} \\)?",
    image: svg(
      "0 0 220 120",
      `<line x1="10" y1="45" x2="210" y2="45"/><line x1="10" y1="85" x2="210" y2="85"/>` +
        `<line x1="60" y1="20" x2="120" y2="110"/><line x1="150" y1="20" x2="210" y2="110"/>` +
        T(78, 40, "a", 10) +
        T(95, 40, "b", 10) +
        T(165, 40, "c", 10) +
        T(182, 40, "d", 10) +
        T(70, 80, "e", 10) +
        T(87, 80, "f", 10) +
        T(160, 80, "40°", 9) +
        T(185, 80, "h", 10),
    ),
    type: "objective",
    options: [
      "\\( e \\)",
      "\\( b \\)",
      "\\( a \\)",
      "\\( d \\)",
      "They are all equal to \\( 40^{\\circ} \\)",
    ],
    correctIndex: 1,
    hint: "Vertical and corresponding angles equal \\( 40^{\\circ} \\); the adjacent ones equal \\( 140^{\\circ} \\).",
    explanation: [
      "\\( b \\) is adjacent to the \\( 40^{\\circ} \\) angle, so \\( b = 140^{\\circ} \\). ⚠ Label positions read from the scan — verify against the official figure.",
    ],
  },

  {
    question:
      "How many of the shapes (rectangle, parallelogram, rhombus, trapezoid, square) have four right angles?",
    image: svg(
      "0 0 220 110",
      `<rect x="15" y="15" width="50" height="30"/>` +
        T(40, 62, "rect", 9) +
        `<path d="M90 15 l40 0 l-12 30 l-40 0 z"/>` +
        T(108, 62, "par'gram", 9) +
        `<path d="M170 15 l20 15 l-20 15 l-20 -15 z"/>` +
        T(170, 62, "rhombus", 9) +
        `<path d="M30 75 l40 0 l-10 25 l-20 0 z"/>` +
        T(50, 108, "trapezoid", 9) +
        `<rect x="120" y="75" width="28" height="28"/>` +
        T(134, 118, "square", 9),
    ),
    type: "objective",
    options: ["\\( 1 \\)", "\\( 2 \\)", "\\( 3 \\)", "\\( 4 \\)", "\\( 5 \\)"],
    correctIndex: 1,
    hint: "Only shapes with all \\( 90^{\\circ} \\) corners count.",
    explanation: [
      "Only the rectangle and the square have four right angles → \\( 2 \\).",
    ],
  },

  {
    question:
      "In the figure a rectangle is given (top \\( 7+m \\), bottom \\( 11-m \\), left \\( k \\), right \\( 2k-3 \\)). Find its area.",
    image: svg(
      "0 0 200 110",
      `<rect x="30" y="25" width="120" height="60"/>` +
        T(90, 18, "7+m", 11) +
        T(90, 100, "11−m", 11) +
        T(20, 58, "k", 12) +
        T(168, 58, "2k−3", 10),
    ),
    type: "objective",
    options: [
      "\\( 24 \\)",
      "\\( 27 \\)",
      "\\( 30 \\)",
      "\\( 40 \\)",
      "\\( 48 \\)",
    ],
    correctIndex: 1,
    hint: "Opposite sides are equal: \\( 7+m = 11-m \\) and \\( k = 2k-3 \\).",
    explanation: [
      "\\( 7+m = 11-m \\Rightarrow m=2 \\), so each long side \\( = 9 \\); \\( k = 2k-3 \\Rightarrow k=3 \\). Area \\( = 9\\times 3 = 27 \\).",
    ],
  },

  {
    question:
      "Two circles have radii \\( 3 \\) cm and \\( 4 \\) cm (one inside the other). Find the perimeter of the shaded ring. \\( \\left(\\pi = \\dfrac{22}{7}\\right) \\)",
    image: svg(
      "0 0 120 120",
      `<circle cx="60" cy="60" r="50" fill="currentColor" fill-opacity="0.3"/>` +
        `<circle cx="60" cy="60" r="30" fill="var(--paper,#fff)"/>`,
    ),
    type: "objective",
    options: [
      "\\( 32 \\) cm",
      "\\( 44 \\) cm",
      "\\( 48 \\) cm",
      "\\( 56 \\) cm",
      "\\( 60 \\) cm",
    ],
    correctIndex: 1,
    hint: "Add the circumferences of both circles.",
    explanation: [
      "\\( 2\\pi(4) + 2\\pi(3) = 2\\pi(7) = 2\\times\\frac{22}{7}\\times 7 = 44 \\) cm.",
    ],
  },

  {
    question:
      "Find the area of the L-shaped figure (sides \\( 16 \\), \\( 14 \\), \\( 20 \\), \\( 4 \\)).",
    image: svg(
      "0 0 200 150",
      `<path d="M20 20 L20 130 L180 130 L180 105 L70 105 L70 20 Z" fill="currentColor" fill-opacity="0.15"/>` +
        T(12, 75, "16", 11) +
        T(125, 100, "14", 11) +
        T(100, 144, "20", 11) +
        T(188, 118, "4", 11),
    ),
    type: "objective",
    options: [
      "\\( 140 \\)",
      "\\( 148 \\)",
      "\\( 152 \\)",
      "\\( 168 \\)",
      "\\( 180 \\)",
    ],
    correctIndex: 2,
    hint: "Split into a tall rectangle and a low horizontal strip.",
    explanation: [
      "Vertical bar \\( 6\\times 16 = 96 \\) plus strip \\( 14\\times 4 = 56 \\): \\( 96 + 56 = 152 \\). ⚠ Verify side labels against the official figure.",
    ],
  },

  {
    question:
      "In the figure find angle \\( B \\) (the triangle has a marked angle of \\( 48^{\\circ} \\) at \\( C \\) with two equal sides).",
    image: svg(
      "0 0 200 130",
      `<path d="M20 30 L180 30 L120 110 Z"/>` +
        `<line x1="110" y1="30" x2="120" y2="110"/>` +
        T(16, 26, "A", 11) +
        T(184, 26, "B", 11) +
        T(120, 122, "C", 11) +
        T(110, 24, "D", 10) +
        T(118, 95, "48°", 10),
    ),
    type: "objective",
    options: [
      "\\( 66^{\\circ} \\)",
      "\\( 55^{\\circ} \\)",
      "\\( 48^{\\circ} \\)",
      "\\( 40^{\\circ} \\)",
      "\\( 33^{\\circ} \\)",
    ],
    correctIndex: 0,
    hint: "Use the isosceles base angles and the angle sum of the triangle.",
    explanation: [
      "With the apex angle \\( 48^{\\circ} \\) and equal sides, each base angle \\( = \\frac{180^{\\circ}-48^{\\circ}}{2} = 66^{\\circ} \\). ⚠ Figure-dependent — verify against the official key.",
    ],
  },

  {
    question:
      "Rectangle \\( ABCD \\) is divided into \\( 10 \\) equal small rectangles, with \\( AB = 20 \\). Find the perimeter of one small rectangle.",
    image: svg(
      "0 0 200 140",
      `<rect x="20" y="20" width="160" height="90"/>` +
        [1, 2, 3, 4]
          .map(
            (i) =>
              `<line x1="${20 + i * 32}" y1="20" x2="${20 + i * 32}" y2="110"/>`,
          )
          .join("") +
        `<line x1="20" y1="65" x2="180" y2="65"/>` +
        T(15, 18, "D", 10) +
        T(185, 18, "C", 10) +
        T(15, 124, "A", 10) +
        T(185, 124, "B", 10) +
        T(100, 134, "20", 11),
    ),
    type: "objective",
    options: [
      "\\( 16 \\)",
      "\\( 20 \\)",
      "\\( 24 \\)",
      "\\( 30 \\)",
      "\\( 36 \\)",
    ],
    correctIndex: 1,
    hint: "Five columns make each small width \\( 20\\div 5 = 4 \\); find the height too.",
    explanation: [
      "Each small rectangle is \\( 4 \\) wide; with the grid height it works out to a perimeter of \\( 20 \\). ⚠ Height read from the scan — verify against the official figure.",
    ],
  },

  // APTITUDE
  {
    question:
      "What is the next number in the series: \\( 5, 7, 9, 11, 13, ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 12 \\)",
      "\\( 13 \\)",
      "\\( 14 \\)",
      "\\( 15 \\)",
      "\\( 16 \\)",
    ],
    correctIndex: 3,
    hint: "Add \\( 2 \\) each time.",
    explanation: ["\\( 13 + 2 = 15 \\)."],
  },

  {
    question: "What is the next number in the series: \\( 24, 19, 14, 9, ? \\)",
    image: null,
    type: "objective",
    options: ["\\( 4 \\)", "\\( 6 \\)", "\\( 7 \\)", "\\( 8 \\)", "\\( 10 \\)"],
    correctIndex: 0,
    hint: "Subtract \\( 5 \\) each time.",
    explanation: ["\\( 9 - 5 = 4 \\)."],
  },

  {
    question: "What is the next number: \\( 8, 6, 12, 10, 20, 18, ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 24 \\)",
      "\\( 36 \\)",
      "\\( 47 \\)",
      "\\( 58 \\)",
      "\\( 60 \\)",
    ],
    correctIndex: 1,
    hint: "The operations alternate \\( -2 \\) then \\( \\times 2 \\).",
    explanation: ["\\( 18\\times 2 = 36 \\)."],
  },

  {
    question: "What is the next number: \\( 1, 2, 4, 7, 28, 33, 198, ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 264 \\)",
      "\\( 248 \\)",
      "\\( 220 \\)",
      "\\( 212 \\)",
      "\\( 205 \\)",
    ],
    correctIndex: 4,
    hint: "The operations alternate: \\( \\times2, \\times2, +3, \\times4, +5, \\times6, +7 \\).",
    explanation: ["\\( 198 + 7 = 205 \\)."],
  },

  {
    question:
      "In the pattern \\( 2, 4, 7, 13, 16, \\ldots \\), each term is the square of the previous term with its digits added (e.g. \\( 7^2=49,\\ 4+9=13 \\)). Find the \\( 20^{\\text{th}} \\) term.",
    image: null,
    type: "objective",
    options: [
      "\\( 11 \\)",
      "\\( 13 \\)",
      "\\( 15 \\)",
      "\\( 17 \\)",
      "\\( 19 \\)",
    ],
    correctIndex: 1,
    hint: "After a while the pattern repeats \\( 13, 16, 13, 16, \\ldots \\)",
    explanation: [
      "From the 4th term on it cycles \\( 13,16,13,16,\\ldots \\); even-position terms are \\( 13 \\), so the \\( 20^{\\text{th}} \\) is \\( 13 \\).",
    ],
  },

  {
    question:
      "Given \\( 1\\to2,\\ 2\\to5,\\ 3\\to5,\\ 4\\to4,\\ 5\\to5,\\ 6\\to6,\\ 7\\to4 \\), what is \\( 8\\to? \\)",
    image: null,
    type: "objective",
    options: ["\\( 4 \\)", "\\( 5 \\)", "\\( 6 \\)", "\\( 7 \\)", "\\( 8 \\)"],
    correctIndex: 3,
    hint: "Think of the segments lit when each digit is shown on a calculator display.",
    explanation: [
      "The values are the seven-segment counts; the digit \\( 8 \\) lights all \\( 7 \\) segments. ⚠ Verify against the official key.",
    ],
  },

  {
    question:
      "In a queue, \\( A \\) is \\( 7^{\\text{th}} \\) from the left and \\( B \\) is \\( 9^{\\text{th}} \\) from the right. They swap places, and \\( A \\) becomes \\( 11^{\\text{th}} \\) from the left. How many people are in the row?",
    image: null,
    type: "objective",
    options: [
      "\\( 18 \\)",
      "\\( 19 \\)",
      "\\( 20 \\)",
      "\\( 21 \\)",
      "\\( 22 \\)",
    ],
    correctIndex: 1,
    hint: "After the swap, \\( A \\) is in \\( B \\)'s old position (\\( 9^{\\text{th}} \\) from the right \\( = 11^{\\text{th}} \\) from the left).",
    explanation: ["Total \\( = 11 + 9 - 1 = 19 \\)."],
  },

  {
    question: "Find the odd one out: \\( 5, 10, 15, 18, 20, 25 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 5 \\)",
      "\\( 10 \\)",
      "\\( 15 \\)",
      "\\( 18 \\)",
      "\\( 20 \\)",
    ],
    correctIndex: 3,
    hint: "Which is not a multiple of \\( 5 \\)?",
    explanation: ["\\( 18 \\) is not a multiple of \\( 5 \\)."],
  },

  {
    question: "Find the odd one out: \\( 1, 4, 9, 12, 16, 25, 36 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 36 \\)",
      "\\( 25 \\)",
      "\\( 16 \\)",
      "\\( 12 \\)",
      "\\( 9 \\)",
    ],
    correctIndex: 3,
    hint: "Which is not a perfect square?",
    explanation: [
      "\\( 12 \\) is not a perfect square; the rest are \\( 1^2,2^2,3^2,4^2,5^2,6^2 \\).",
    ],
  },

  {
    question: "Find the odd one out: \\( 135, 317, 975, 731, 573, 264 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 317 \\)",
      "\\( 975 \\)",
      "\\( 731 \\)",
      "\\( 573 \\)",
      "\\( 264 \\)",
    ],
    correctIndex: 4,
    hint: "Look at which number is even.",
    explanation: ["\\( 264 \\) is even; all the others are odd."],
  },

  {
    question: "Find the missing number in the grid.",
    image: svg(
      "0 0 170 130",
      (() => {
        const g = [
          [4, 8, 20],
          [9, 3, 15],
          [6, 6, "?"],
        ];
        let s = "";
        for (let r = 0; r < 3; r++)
          for (let c = 0; c < 3; c++) {
            s +=
              `<rect x="${10 + c * 50}" y="${10 + r * 38}" width="50" height="38"/>` +
              T(35 + c * 50, 34 + r * 38, String(g[r][c]), 15);
          }
        return s;
      })(),
    ),
    type: "objective",
    options: [
      "\\( 18 \\)",
      "\\( 16 \\)",
      "\\( 12 \\)",
      "\\( 10 \\)",
      "\\( 6 \\)",
    ],
    correctIndex: 0,
    hint: "In each row, third \\( = \\) first \\( + 2\\times \\) second.",
    explanation: [
      "\\( 4+2(8)=20 \\), \\( 9+2(3)=15 \\), so \\( 6+2(6)=18 \\).",
    ],
  },

  {
    question:
      "Seven cars stand facing east. Cadillac is just right of Fargo; Fargo is fourth to the right of Fiat; Maruti is between Ambassador and Bedford; Fiat (third to the left of Ambassador) is at one end. What is the correct position of Mercedes?",
    image: null,
    type: "objective",
    options: [
      "Next to the left of Cadillac",
      "Next to the left of Bedford",
      "Between Bedford and Fargo",
      "Fourth to the right of Maruti",
      "On the leftmost position",
    ],
    correctIndex: 3,
    hint: "Fix Fiat at the left end, then place the rest.",
    explanation: [
      "Order: Fiat, Bedford, Maruti, Ambassador, Fargo, Cadillac, Mercedes. Mercedes is fourth to the right of Maruti.",
    ],
  },

  {
    question: "Which of the following is least like the others?",
    image: null,
    type: "objective",
    options: ["cube", "sphere", "pyramid", "circle", "cone"],
    correctIndex: 3,
    hint: "Four are solids (3-D).",
    explanation: [
      "A circle is a flat \\( 2 \\)-D shape; the others are \\( 3 \\)-D solids.",
    ],
  },

  {
    question:
      "Five girls sit on a bench. Seema is to the left of Rani and to the right of Bindu. Mary is to the right of Rani. Reeta is between Rani and Mary. Who is sitting immediately to the right of Reeta?",
    image: null,
    type: "objective",
    options: ["Bindu", "Mary", "Rani", "Reeta", "Seema"],
    correctIndex: 1,
    hint: "Work out the seating order left to right.",
    explanation: [
      "Order: Bindu, Seema, Rani, Reeta, Mary; so Mary is immediately right of Reeta.",
    ],
  },

  {
    question:
      "At which number did the car park (the figures are read upside-down: \\( 16, 06, 68, 88, ?, 98 \\))?",
    image: svg(
      "0 0 230 60",
      [
        ["16", 25],
        ["06", 60],
        ["68", 95],
        ["88", 130],
        ["?", 165],
        ["98", 200],
      ]
        .map(
          ([s, x], i) =>
            `<rect x="${x - 14}" y="15" width="28" height="35" transform="skewX(-12)" />` +
            T(x - 3, 38, s, 12),
        )
        .join(""),
    ),
    type: "objective",
    options: [
      "\\( 87 \\)",
      "\\( 90 \\)",
      "\\( 92 \\)",
      "\\( 95 \\)",
      "\\( 99 \\)",
    ],
    correctIndex: 0,
    hint: "Read the numbers upside-down — they run in order.",
    explanation: [
      "Turned around, the spaces read \\( 86, 87, 88, 89, 90, 91 \\); the missing one is \\( 87 \\).",
    ],
  },

  {
    question:
      "Susan types \\( 10 \\) pages in \\( 5 \\) minutes; Mary types \\( 5 \\) pages in \\( 10 \\) minutes. Working together, how many pages can they type in \\( 30 \\) minutes?",
    image: null,
    type: "objective",
    options: [
      "\\( 15 \\)",
      "\\( 20 \\)",
      "\\( 25 \\)",
      "\\( 65 \\)",
      "\\( 75 \\)",
    ],
    correctIndex: 4,
    hint: "Find each person's pages-per-minute, then add.",
    explanation: [
      "Susan \\( 2 \\)/min, Mary \\( 0.5 \\)/min → \\( 2.5 \\)/min together; \\( 2.5\\times 30 = 75 \\) pages.",
    ],
  },

  {
    question:
      "Each child in a family has at least \\( 4 \\) brothers and \\( 3 \\) sisters. What is the smallest number of children the family might have?",
    image: null,
    type: "objective",
    options: [
      "\\( 7 \\)",
      "\\( 8 \\)",
      "\\( 9 \\)",
      "\\( 10 \\)",
      "\\( 11 \\)",
    ],
    correctIndex: 2,
    hint: "A boy needs \\( 4 \\) brothers (so \\( 5 \\) boys) and a girl needs \\( 3 \\) sisters (so \\( 4 \\) girls).",
    explanation: ["\\( 5 \\) boys \\( + 4 \\) girls \\( = 9 \\) children."],
  },

  {
    question:
      "Find the missing number in the grid: \\( (2,3),(4,6),(6,9),(?,9) \\).",
    image: svg(
      "0 0 110 170",
      (() => {
        const g = [
          [2, 3],
          [4, 6],
          [6, 9],
          ["?", 9],
        ];
        let s = "";
        for (let r = 0; r < 4; r++)
          for (let c = 0; c < 2; c++) {
            s +=
              `<rect x="${15 + c * 40}" y="${10 + r * 38}" width="40" height="38"/>` +
              T(35 + c * 40, 34 + r * 38, String(g[r][c]), 14);
          }
        return s;
      })(),
    ),
    type: "objective",
    options: ["\\( 2 \\)", "\\( 3 \\)", "\\( 4 \\)", "\\( 6 \\)", "\\( 9 \\)"],
    correctIndex: 3,
    hint: "In each row the right value is \\( 1.5 \\) times the left value.",
    explanation: [
      "Since right \\( = 1.5\\times \\) left, and the right value is \\( 9 \\): \\( ? = 9\\div 1.5 = 6 \\). ⚠ Grid reading from the scan — verify against the official key.",
    ],
  },

  {
    question:
      "In the Venn diagram (square = married people, circle = people in a joint family, triangle = school teachers), which letter marks people in a joint family who are neither married nor teachers?",
    image: svg(
      "0 0 200 150",
      `<rect x="30" y="55" width="110" height="70"/>` +
        `<circle cx="80" cy="90" r="45"/>` +
        `<path d="M120 20 L180 120 L60 120 Z"/>` +
        T(150, 40, "teachers", 9) +
        T(45, 120, "married", 9) +
        T(95, 135, "joint family", 9) +
        T(60, 95, "S", 12) +
        T(95, 80, "Q", 12) +
        T(110, 100, "R", 12) +
        T(40, 85, "T", 12) +
        T(110, 118, "P", 12) +
        T(120, 55, "U", 12),
    ),
    type: "objective",
    options: ["P", "Q", "R", "S", "T"],
    correctIndex: 3,
    hint: "Find the region inside the circle only (not the square, not the triangle).",
    explanation: [
      "The circle-only region (joint family, not married, not a teacher) is marked S. ⚠ Region letters read from the scan — verify against the official figure.",
    ],
  },

  {
    question: "In the same Venn diagram, what does R represent?",
    image: null,
    type: "objective",
    options: [
      "People in a joint family who are neither married nor teachers",
      "Married school teachers who do not live in a joint family",
      "School teachers who are not married",
      "Married people who are not in a joint family and not teachers",
      "Married school teachers",
    ],
    correctIndex: 4,
    hint: "Find which three regions overlap at R.",
    explanation: [
      "R lies where all three regions meet (married, joint family and teacher), i.e. married school teachers. ⚠ Region position read from the scan — verify against the official figure.",
    ],
  },

  {
    question:
      "Which symbol is on the face opposite the face marked \\( * \\) on the cube (faces use \\( @, *, \\$, 8, +, - \\))?",
    image: svg(
      "0 0 200 90",
      `<path d="M20 30 L50 15 L80 30 L80 70 L50 85 L20 70 Z"/><path d="M20 30 L50 45 L80 30 M50 45 L50 85"/>` +
        T(38, 32, "@", 11) +
        T(64, 52, "*", 13) +
        T(38, 62, "−", 13) +
        `<path d="M110 30 L140 15 L170 30 L170 70 L140 85 L110 70 Z"/><path d="M110 30 L140 45 L170 30 M140 45 L140 85"/>` +
        T(128, 32, "@", 11) +
        T(155, 52, "+", 12) +
        T(128, 62, "*", 12),
    ),
    type: "objective",
    options: ["@", "$", "8", "+", "−"],
    correctIndex: 1,
    hint: "Use the two views to find which symbol never appears next to \\( * \\).",
    explanation: [
      "From the two views, \\( \\$ \\) is the only face never adjacent to \\( * \\), so it is opposite. ⚠ Cube-folding figure — verify against the official key.",
    ],
  },

  {
    question:
      "John walks east, then north, then turns \\( 45^{\\circ} \\) to his right and walks, then finally turns left. In which direction is he now walking?",
    image: null,
    type: "objective",
    options: ["North", "East", "South-East", "North-East", "North-West"],
    correctIndex: 4,
    hint: "From north, a \\( 45^{\\circ} \\) right turn faces north-east; a left turn then swings him \\( 90^{\\circ} \\) anticlockwise.",
    explanation: [
      "North → \\( 45^{\\circ} \\) right = NE; turning left \\( 90^{\\circ} \\) from NE gives NW. ⚠ Depends on the turn size — verify against the official key.",
    ],
  },

  // Q73–75: 5×5 Latin square (each row and column has 1–5 once)
  {
    question:
      "Numbers \\( 1 \\) to \\( 5 \\) are placed in the grid so each row and column contains each number once. Rows: \\( (1,x,3,5,2),(4,\\_,1,2,5),(2,5,4,\\_,1),(3,y,5,\\_,z),(\\_,1,\\_,4,\\_) \\). Find \\( x \\).",
    image: svg(
      "0 0 200 200",
      (() => {
        const g = [
          ["1", "x", "3", "5", "2"],
          ["4", "", "1", "2", "5"],
          ["2", "5", "4", "", "1"],
          ["3", "y", "5", "", "z"],
          ["", "1", "", "4", ""],
        ];
        let s = "";
        for (let r = 0; r < 5; r++)
          for (let c = 0; c < 5; c++) {
            s += `<rect x="${10 + c * 36}" y="${10 + r * 36}" width="36" height="36"/>`;
            if (g[r][c]) s += T(28 + c * 36, 33 + r * 36, g[r][c], 15);
          }
        return s;
      })(),
    ),
    type: "objective",
    options: ["\\( 1 \\)", "\\( 2 \\)", "\\( 3 \\)", "\\( 4 \\)", "\\( 5 \\)"],
    correctIndex: 3,
    hint: "Row 1 already has \\( 1,3,5,2 \\) — only one number is missing.",
    explanation: ["Row 1 is missing \\( 4 \\), so \\( x = 4 \\)."],
  },

  {
    question: "Using the same grid, find \\( y \\).",
    image: null,
    type: "objective",
    options: ["\\( 1 \\)", "\\( 2 \\)", "\\( 3 \\)", "\\( 4 \\)", "\\( 5 \\)"],
    correctIndex: 1,
    hint: "Use column 2 once you know the other entries.",
    explanation: [
      "Column 2 already holds \\( 4,3,5,1 \\) (after solving), so \\( y = 2 \\).",
    ],
  },

  {
    question: "Using the same grid, find \\( z \\).",
    image: null,
    type: "objective",
    options: ["\\( 1 \\)", "\\( 2 \\)", "\\( 3 \\)", "\\( 4 \\)", "\\( 5 \\)"],
    correctIndex: 3,
    hint: "Finish row 4 and column 5.",
    explanation: ["Row 4 becomes \\( 3,2,5,1,4 \\), so \\( z = 4 \\)."],
  },
];
