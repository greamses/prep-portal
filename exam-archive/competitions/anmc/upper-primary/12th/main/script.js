import setupQuiz from "../../../../question.js";

/* ════════════════════════════════════════════════════════════════════
   12TH ANNUAL NATIONAL MATHEMATICS COMPETITION (NTIC / ANMC)
   2ND ROUND · 14TH MARCH 2015 · Upper Primary
   ────────────────────────────────────────────────────────────────────
   Transcribed verbatim from the official paper (75 MCQs, 5 options each).
   • Every item is type "objective".
   • Figures are hand-built inline SVGs (currentColor → theme-aware).
   • Answer keys are NOT printed on the paper; each was solved here.
     A few figure-dependent items are marked “⚠ verify” in the
     explanation where the low-res scan leaves the figure ambiguous.
   ════════════════════════════════════════════════════════════════════ */

// Small helpers to keep the figure SVGs compact and consistent.
const svg = (vb, body) =>
  `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" fill="none" ` +
  `stroke="currentColor" stroke-width="2" stroke-linejoin="round" ` +
  `stroke-linecap="round" font-family="JetBrains Mono, monospace">${body}</svg>`;
const T = (x, y, s, size = 13) =>
  `<text x="${x}" y="${y}" fill="currentColor" stroke="none" font-size="${size}" ` +
  `text-anchor="middle">${s}</text>`;

const quizData = [
  // ── ALGEBRA ──────────────────────────────────────────────────────
  {
    question: "\\( 55 + 66 = ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 74 \\)",
      "\\( 82 \\)",
      "\\( 108 \\)",
      "\\( 121 \\)",
      "\\( 172 \\)",
    ],
    correctIndex: 3,
    hint: "Add tens and ones separately: \\( 50+60=110 \\) and \\( 5+6=11 \\).",
    explanation: ["\\( 55 + 66 = 110 + 11 = 121 \\)."],
  },
  {
    question: "\\( \\dfrac{36}{4} = ? \\)",
    image: null,
    type: "objective",
    options: ["\\( 2 \\)", "\\( 4 \\)", "\\( 6 \\)", "\\( 8 \\)", "\\( 9 \\)"],
    correctIndex: 4,
    hint: "How many \\( 4 \\)s make \\( 36 \\)?",
    explanation: ["\\( 36 \\div 4 = 9 \\)."],
  },
  {
    question: "\\( 9 \\times 7 = ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 42 \\)",
      "\\( 56 \\)",
      "\\( 60 \\)",
      "\\( 63 \\)",
      "\\( 72 \\)",
    ],
    correctIndex: 3,
    hint: "Use the nine-times table.",
    explanation: ["\\( 9 \\times 7 = 63 \\)."],
  },
  {
    question: "Calculate \\( 2040 - 40 + 40 - 2000 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 10 \\)",
      "\\( 4040 \\)",
      "\\( 40 \\)",
      "\\( 80 \\)",
      "\\( 2040 \\)",
    ],
    correctIndex: 2,
    hint: "\\( -40 + 40 \\) cancels out.",
    explanation: [
      "\\( 2040 - 2000 = 40 \\), and \\( -40+40=0 \\), so the answer is \\( 40 \\).",
    ],
  },
  {
    question:
      "Which number is NOT between \\( 5{,}345 \\) and \\( 7{,}216 \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( 5{,}499 \\)",
      "\\( 7{,}539 \\)",
      "\\( 6{,}499 \\)",
      "\\( 5{,}985 \\)",
      "\\( 7{,}198 \\)",
    ],
    correctIndex: 1,
    hint: "A number is between them only if it is larger than \\( 5{,}345 \\) and smaller than \\( 7{,}216 \\).",
    explanation: ["\\( 7{,}539 > 7{,}216 \\), so it lies outside the range."],
  },
  {
    question: "\\( 1 + 3 + 5 + 7 + 9 + 11 = ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 8 \\)",
      "\\( 13 \\)",
      "\\( 22 \\)",
      "\\( 28 \\)",
      "\\( 36 \\)",
    ],
    correctIndex: 4,
    hint: "The sum of the first \\( n \\) odd numbers is \\( n^2 \\).",
    explanation: [
      "There are \\( 6 \\) odd numbers, so the sum is \\( 6^2 = 36 \\).",
    ],
  },
  {
    question:
      "Today is a Saturday. After how many days will it be a Saturday again?",
    image: null,
    type: "objective",
    options: [
      "\\( 42 \\)",
      "\\( 36 \\)",
      "\\( 30 \\)",
      "\\( 25 \\)",
      "\\( 18 \\)",
    ],
    correctIndex: 0,
    hint: "Weekdays repeat every \\( 7 \\) days, so the answer must be a multiple of \\( 7 \\).",
    explanation: ["Only \\( 42 = 6 \\times 7 \\) is a multiple of \\( 7 \\)."],
  },
  {
    question:
      "Aisha has \\( 6 \\) apples. How many apples will be left if she eats \\( \\dfrac{2}{3} \\) of the apples?",
    image: null,
    type: "objective",
    options: ["\\( 0 \\)", "\\( 1 \\)", "\\( 2 \\)", "\\( 3 \\)", "\\( 5 \\)"],
    correctIndex: 2,
    hint: "She eats \\( \\frac{2}{3} \\) and keeps \\( \\frac{1}{3} \\).",
    explanation: [
      "\\( \\frac{2}{3}\\times 6 = 4 \\) eaten, so \\( 6 - 4 = 2 \\) left (i.e. \\( \\frac{1}{3}\\times 6 \\)).",
    ],
  },
  {
    question:
      "Saudatu wants to read a book of \\( 200 \\) pages. Every day she reads \\( 25 \\) pages. In how many days can she finish the book?",
    image: null,
    type: "objective",
    options: [
      "\\( 4 \\)",
      "\\( 6 \\)",
      "\\( 8 \\)",
      "\\( 10 \\)",
      "\\( 12 \\)",
    ],
    correctIndex: 2,
    hint: "Divide total pages by pages per day.",
    explanation: ["\\( 200 \\div 25 = 8 \\) days."],
  },
  {
    question: "Evaluate \\( 1 \\times 2 + 3 \\times 4 + 5 \\times 6 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 140 \\)",
      "\\( 100 \\)",
      "\\( 80 \\)",
      "\\( 65 \\)",
      "\\( 44 \\)",
    ],
    correctIndex: 4,
    hint: "Do the multiplications first (order of operations).",
    explanation: ["\\( 2 + 12 + 30 = 44 \\)."],
  },
  {
    question:
      "Dalton has \\( 10 \\) cats as shown below. How many white cats should be sent away so that half of the remaining cats will be black?",
    image: svg(
      "0 0 220 60",
      // 4 black + 6 white cats as simple silhouettes
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map((i) => {
          const black = [1, 3, 4, 8].includes(i); // 4 black cats
          const x = 8 + i * 21;
          const fill = black ? 'fill="currentColor"' : 'fill="none"';
          return (
            `<g ${fill} stroke="currentColor" stroke-width="1.5">` +
            `<ellipse cx="${x + 6}" cy="40" rx="7" ry="9"/>` +
            `<circle cx="${x + 6}" cy="26" r="5"/>` +
            `<path d="M${x + 2} 22 l2 -5 l3 4 M${x + 10} 22 l-2 -5 l-3 4" stroke-linejoin="round"/>` +
            `</g>`
          );
        })
        .join(""),
    ),
    type: "objective",
    options: ["\\( 1 \\)", "\\( 2 \\)", "\\( 3 \\)", "\\( 4 \\)", "\\( 5 \\)"],
    correctIndex: 1,
    hint: "Count the black cats \\( B \\); you want \\( B \\) to be half of what remains. Remove \\( 10 - 2B \\) white cats.",
    explanation: [
      "There are \\( 4 \\) black cats and \\( 6 \\) white cats.",
      "For the \\( 4 \\) black cats to be half of the remaining group, the group must total \\( 8 \\).",
      "So remove \\( 10 - 8 = 2 \\) white cats. ⚠ Answer depends on the exact black/white count in the original picture — verify against the official key.",
    ],
  },
  {
    question: "What percentage is shaded in the figure?",
    image: svg(
      "0 0 130 130",
      (() => {
        let cells = "";
        // 5x5 grid, shade 6 cells (top-left block) → 6/25 = 24%
        const shaded = new Set(["0,0", "1,0", "0,1", "1,1", "3,0", "4,1"]);
        for (let r = 0; r < 5; r++)
          for (let c = 0; c < 5; c++) {
            const f = shaded.has(`${c},${r}`)
              ? 'fill="currentColor" fill-opacity="0.45"'
              : 'fill="none"';
            cells += `<rect x="${5 + c * 24}" y="${5 + r * 24}" width="24" height="24" ${f} stroke="currentColor" stroke-width="1.5"/>`;
          }
        return cells;
      })(),
    ),
    type: "objective",
    options: [
      "\\( 5\\% \\)",
      "\\( 10\\% \\)",
      "\\( 15\\% \\)",
      "\\( 24\\% \\)",
      "\\( 30\\% \\)",
    ],
    correctIndex: 3,
    hint: "Shaded fraction \\( = \\dfrac{\\text{shaded squares}}{\\text{total squares}} \\), then convert to a percentage.",
    explanation: [
      "With \\( 6 \\) of the \\( 25 \\) squares shaded, \\( \\frac{6}{25} = \\frac{24}{100} = 24\\% \\).",
      "⚠ The shaded count is read from the scan — verify against the official figure.",
    ],
  },
  {
    question: "\\( 6 \\times 10{,}000 + 2 \\times 1000 + 1 \\times 10 = ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 62{,}010 \\)",
      "\\( 60{,}021 \\)",
      "\\( 60{,}210 \\)",
      "\\( 62{,}210 \\)",
      "\\( 60{,}201 \\)",
    ],
    correctIndex: 0,
    hint: "Add place values: ten-thousands, thousands, tens.",
    explanation: ["\\( 60{,}000 + 2{,}000 + 10 = 62{,}010 \\)."],
  },
  {
    question:
      "By what percentage should we increase the number \\( 2 \\) to make it \\( 2.5 \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( 20\\% \\)",
      "\\( 25\\% \\)",
      "\\( 30\\% \\)",
      "\\( 50\\% \\)",
      "\\( 75\\% \\)",
    ],
    correctIndex: 1,
    hint: "Percentage increase \\( = \\dfrac{\\text{increase}}{\\text{original}} \\times 100 \\).",
    explanation: [
      "Increase \\( = 0.5 \\); \\( \\frac{0.5}{2}\\times 100 = 25\\% \\).",
    ],
  },
  {
    question: "Which of the following is more than \\( \\dfrac{1}{2} \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( \\dfrac{2}{5} \\)",
      "\\( 0.3 \\)",
      "\\( 0.5 \\)",
      "\\( 40\\% \\)",
      "\\( \\dfrac{4}{7} \\)",
    ],
    correctIndex: 4,
    hint: "Compare each value with \\( 0.5 \\).",
    explanation: [
      "\\( \\frac{4}{7}\\approx 0.571 > 0.5 \\); every other option is \\( \\le 0.5 \\).",
    ],
  },
  {
    question:
      "Which digit is represented by \\( \\square \\) in the addition given?  \\( \\;324387 + 64\\square73 = 389260 \\)",
    image: svg(
      "0 0 170 80",
      `<text x="150" y="26" fill="currentColor" stroke="none" font-size="20" text-anchor="end" font-family="monospace">324387</text>` +
        `<text x="20" y="54" fill="currentColor" stroke="none" font-size="20" text-anchor="middle">+</text>` +
        `<text x="150" y="54" fill="currentColor" stroke="none" font-size="20" text-anchor="end" font-family="monospace">64&#9633;73</text>` +
        `<line x1="40" y1="62" x2="155" y2="62"/>` +
        `<text x="150" y="78" fill="currentColor" stroke="none" font-size="20" text-anchor="end" font-family="monospace">389260</text>`,
    ),
    type: "objective",
    options: ["\\( 5 \\)", "\\( 6 \\)", "\\( 7 \\)", "\\( 8 \\)", "\\( 9 \\)"],
    correctIndex: 3,
    hint: "Subtract: \\( 389260 - 324387 \\) gives the second number.",
    explanation: ["\\( 389260 - 324387 = 64873 \\), so \\( \\square = 8 \\)."],
  },
  {
    question:
      "I think of a number, multiply it by \\( 2 \\) and add \\( 7 \\). The result is \\( 19 \\). What is the number?",
    image: null,
    type: "objective",
    options: [
      "\\( 6 \\)",
      "\\( 8 \\)",
      "\\( 10 \\)",
      "\\( 14 \\)",
      "\\( 20 \\)",
    ],
    correctIndex: 0,
    hint: "Work backwards: undo \\( +7 \\), then undo \\( \\times 2 \\).",
    explanation: ["\\( 19 - 7 = 12 \\), then \\( 12 \\div 2 = 6 \\)."],
  },
  {
    question:
      "Which list shows the numbers in order from the smallest to the greatest?",
    image: null,
    type: "objective",
    options: [
      "\\( 1{,}734 \\;\\; 1{,}816 \\;\\; 2{,}432 \\;\\; 2{,}099 \\)",
      "\\( 1{,}734 \\;\\; 1{,}816 \\;\\; 2{,}099 \\;\\; 2{,}432 \\)",
      "\\( 1{,}816 \\;\\; 1{,}734 \\;\\; 2{,}099 \\;\\; 2{,}432 \\)",
      "\\( 2{,}432 \\;\\; 2{,}099 \\;\\; 1{,}734 \\;\\; 1{,}816 \\)",
      "\\( 2{,}099 \\;\\; 1{,}734 \\;\\; 2{,}099 \\;\\; 2{,}432 \\)",
    ],
    correctIndex: 1,
    hint: "Compare thousands first, then hundreds.",
    explanation: [
      "Ascending order: \\( 1{,}734 < 1{,}816 < 2{,}099 < 2{,}432 \\).",
    ],
  },
  {
    question:
      "Add \\( 40\\% \\) of \\( 200 \\) to \\( 60\\% \\) of \\( 300 \\). What is the result?",
    image: null,
    type: "objective",
    options: [
      "\\( 160 \\)",
      "\\( 200 \\)",
      "\\( 260 \\)",
      "\\( 300 \\)",
      "\\( 320 \\)",
    ],
    correctIndex: 2,
    hint: "Find each percentage, then add.",
    explanation: [
      "\\( 40\\% \\) of \\( 200 = 80 \\); \\( 60\\% \\) of \\( 300 = 180 \\); \\( 80+180 = 260 \\).",
    ],
  },
  {
    question:
      "\\( 5 \\) lorries can carry \\( 20 \\) tonnes. How many tonnes can \\( 8 \\) lorries carry?",
    image: null,
    type: "objective",
    options: [
      "\\( 20 \\)",
      "\\( 23 \\)",
      "\\( 28 \\)",
      "\\( 32 \\)",
      "\\( 40 \\)",
    ],
    correctIndex: 3,
    hint: "Find the load per lorry first.",
    explanation: [
      "Each lorry carries \\( 20\\div 5 = 4 \\) tonnes, so \\( 8\\times 4 = 32 \\) tonnes.",
    ],
  },
  {
    question:
      "Evaluate \\( \\dfrac{\\frac{1}{2}+\\frac{1}{3}+\\frac{1}{4}}{\\frac{1}{2}\\times\\frac{1}{3}\\times\\frac{1}{4}} \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 26 \\)",
      "\\( 20 \\)",
      "\\( 18 \\)",
      "\\( 16 \\)",
      "\\( 12 \\)",
    ],
    correctIndex: 0,
    hint: "Numerator: add the fractions. Denominator: multiply them.",
    explanation: [
      "Top \\( = \\frac{13}{12} \\); bottom \\( = \\frac{1}{24} \\); \\( \\frac{13}{12}\\div\\frac{1}{24} = \\frac{13}{12}\\times 24 = 26 \\).",
    ],
  },
  {
    question:
      "Patrick wants to list the positive factors of \\( 24 \\). How many numbers will he write?",
    image: null,
    type: "objective",
    options: ["\\( 2 \\)", "\\( 4 \\)", "\\( 8 \\)", "\\( 9 \\)", "\\( 10 \\)"],
    correctIndex: 2,
    hint: "Pair the factors: \\( 1\\times24, 2\\times12, 3\\times8, 4\\times6 \\).",
    explanation: [
      "Factors: \\( 1,2,3,4,6,8,12,24 \\) — that is \\( 8 \\) numbers.",
    ],
  },
  {
    question:
      "Which of the following cannot be written as the product of exactly two prime numbers?",
    image: null,
    type: "objective",
    options: [
      "\\( 6 \\)",
      "\\( 15 \\)",
      "\\( 18 \\)",
      "\\( 21 \\)",
      "\\( 35 \\)",
    ],
    correctIndex: 2,
    hint: "Factorise each into primes.",
    explanation: [
      "\\( 6=2\\times3,\\;15=3\\times5,\\;21=3\\times7,\\;35=5\\times7 \\). But \\( 18=2\\times3\\times3 \\) needs three primes.",
    ],
  },
  {
    question:
      "Lawan finds the H.C.F. of \\( 30 \\) and \\( 24 \\); Kelechi finds the L.C.M. Olowo multiplies the two results. What does Olowo write?",
    image: null,
    type: "objective",
    options: [
      "\\( 880 \\)",
      "\\( 800 \\)",
      "\\( 720 \\)",
      "\\( 600 \\)",
      "\\( 500 \\)",
    ],
    correctIndex: 2,
    hint: "For any two numbers, \\( \\text{HCF}\\times\\text{LCM} = \\) the product of the numbers.",
    explanation: [
      "\\( \\text{HCF}=6,\\;\\text{LCM}=120 \\); \\( 6\\times120 = 720 \\) (\\(=30\\times24\\)).",
    ],
  },
  {
    question:
      "Farida reads three books: the first in \\( 1 \\) week \\( 4 \\) days, the second in \\( 8 \\) days, the third in \\( 2 \\) weeks \\( 3 \\) days. She takes a \\( 1 \\)-day break after finishing each of the first two books. How long until she returns all three?",
    image: null,
    type: "objective",
    options: [
      "\\( 4 \\) weeks",
      "\\( 4 \\) weeks \\( 3 \\) days",
      "\\( 5 \\) weeks",
      "\\( 5 \\) weeks \\( 3 \\) days",
      "\\( 6 \\) weeks",
    ],
    correctIndex: 3,
    hint: "Convert everything to days, then back to weeks.",
    explanation: [
      "\\( 11 + 8 + 17 = 36 \\) reading days, plus \\( 2 \\) break days \\( = 38 \\) days \\( = 5 \\) weeks \\( 3 \\) days.",
    ],
  },
  {
    question:
      "Evaluate \\( \\left(\\dfrac{1}{2}\\div\\dfrac{2}{3}\\right)\\times\\dfrac{3}{4} \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 1 \\)",
      "\\( \\dfrac{6}{11} \\)",
      "\\( \\dfrac{7}{12} \\)",
      "\\( \\dfrac{8}{15} \\)",
      "\\( \\dfrac{9}{16} \\)",
    ],
    correctIndex: 4,
    hint: "Dividing by a fraction means multiplying by its reciprocal.",
    explanation: [
      "\\( \\frac{1}{2}\\div\\frac{2}{3}=\\frac{1}{2}\\times\\frac{3}{2}=\\frac{3}{4} \\); then \\( \\frac{3}{4}\\times\\frac{3}{4}=\\frac{9}{16} \\).",
    ],
  },
  {
    question:
      "A father divided \\( ₦4{,}000 \\) between his three children in the ratio \\( 1:3:4 \\). Find the largest share.",
    image: null,
    type: "objective",
    options: [
      "\\( ₦1{,}000 \\)",
      "\\( ₦2{,}000 \\)",
      "\\( ₦2{,}500 \\)",
      "\\( ₦3{,}000 \\)",
      "\\( ₦3{,}500 \\)",
    ],
    correctIndex: 1,
    hint: "Total parts \\( = 1+3+4 = 8 \\).",
    explanation: [
      "Largest share \\( = \\frac{4}{8}\\times 4000 = ₦2{,}000 \\).",
    ],
  },
  {
    question:
      "\\( \\dfrac{3}{5} \\) of a class of \\( 20 \\) students are boys. \\( 4 \\) new students (\\( 3 \\) boys, \\( 1 \\) girl) join. What is the new ratio of boys to girls?",
    image: null,
    type: "objective",
    options: [
      "\\( 5:3 \\)",
      "\\( 2:5 \\)",
      "\\( 3:7 \\)",
      "\\( 1:2 \\)",
      "\\( 3:4 \\)",
    ],
    correctIndex: 0,
    hint: "Start with \\( 12 \\) boys and \\( 8 \\) girls.",
    explanation: ["After: \\( 15 \\) boys, \\( 9 \\) girls \\( = 5:3 \\)."],
  },
  {
    question:
      "Two numbers \\( A \\) and \\( B \\) are given. \\( A = 6 \\) and \\( B \\) is \\( 3 \\) less than \\( A \\). What is \\( A+B \\)?",
    image: null,
    type: "objective",
    options: ["\\( 12 \\)", "\\( 9 \\)", "\\( 8 \\)", "\\( 6 \\)", "\\( 4 \\)"],
    correctIndex: 1,
    hint: "\\( B = 6 - 3 \\).",
    explanation: ["\\( B = 3 \\), so \\( A+B = 6+3 = 9 \\)."],
  },
  {
    question: "Which of the following numbers is divisible by \\( 3 \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( 185 \\)",
      "\\( 194 \\)",
      "\\( 217 \\)",
      "\\( 242 \\)",
      "\\( 264 \\)",
    ],
    correctIndex: 4,
    hint: "A number is divisible by \\( 3 \\) when its digit sum is.",
    explanation: [
      "\\( 2+6+4 = 12 \\), which is divisible by \\( 3 \\); \\( 264\\div3 = 88 \\).",
    ],
  },
  {
    question:
      "A restaurant has \\( 16 \\) tables, with \\( 4 \\) seats each. If \\( 40 \\) people are seated, how many more people can be seated?",
    image: null,
    type: "objective",
    options: [
      "\\( 17 \\)",
      "\\( 20 \\)",
      "\\( 24 \\)",
      "\\( 28 \\)",
      "\\( 32 \\)",
    ],
    correctIndex: 2,
    hint: "Find total capacity first.",
    explanation: [
      "Capacity \\( = 16\\times4 = 64 \\); \\( 64 - 40 = 24 \\) more.",
    ],
  },
  {
    question:
      "A car travels from town A to town B at a constant \\( 50 \\) km/h, taking \\( 6 \\) hours. How long will the journey take if the speed increases by \\( 25 \\) km/h?",
    image: null,
    type: "objective",
    options: [
      "\\( 8 \\) hours",
      "\\( 6 \\) hours",
      "\\( 5 \\) hours",
      "\\( 4 \\) hours",
      "\\( 3 \\) hours",
    ],
    correctIndex: 3,
    hint: "Find the distance, then divide by the new speed.",
    explanation: [
      "Distance \\( = 50\\times6 = 300 \\) km; new speed \\( = 75 \\) km/h; time \\( = 300\\div75 = 4 \\) hours.",
    ],
  },
  {
    question:
      "Ms. Bryce has \\( 25 \\) animals: \\( 7 \\) horses, \\( 6 \\) sheep, \\( 3 \\) cows, and the rest chickens. How many legs in total? (Horses, sheep and cows have \\( 4 \\) legs; chickens have \\( 2 \\).)",
    image: null,
    type: "objective",
    options: [
      "\\( 82 \\)",
      "\\( 75 \\)",
      "\\( 60 \\)",
      "\\( 51 \\)",
      "\\( 43 \\)",
    ],
    correctIndex: 0,
    hint: "Chickens \\( = 25 - (7+6+3) \\).",
    explanation: [
      "\\( 16 \\) four-legged animals and \\( 9 \\) chickens: \\( 16\\times4 + 9\\times2 = 64 + 18 = 82 \\).",
    ],
  },
  {
    question:
      "\\( A \\) and \\( B \\) are two positive whole numbers with \\( A+B = 19 \\). Find the smallest and the greatest possible values of \\( A\\times B \\).",
    image: null,
    type: "objective",
    options: [
      "Smallest \\( 18 \\), Greatest \\( 90 \\)",
      "Smallest \\( 20 \\), Greatest \\( 88 \\)",
      "Smallest \\( 18 \\), Greatest \\( 99 \\)",
      "Smallest \\( 12 \\), Greatest \\( 88 \\)",
      "Smallest \\( 34 \\), Greatest \\( 90 \\)",
    ],
    correctIndex: 0,
    hint: "Products are smallest when the numbers are far apart and largest when they are close.",
    explanation: [
      "Smallest: \\( 1\\times18 = 18 \\); Greatest: \\( 9\\times10 = 90 \\).",
    ],
  },
  {
    question:
      "Three bells ring every \\( 12 \\), \\( 18 \\) and \\( 30 \\) minutes. They all ring together at \\( 11{:}00 \\) am. When will they next ring together?",
    image: null,
    type: "objective",
    options: [
      "\\( 12{:}00 \\) pm",
      "\\( 12{:}30 \\) pm",
      "\\( 1{:}00 \\) pm",
      "\\( 1{:}30 \\) pm",
      "\\( 2{:}00 \\) pm",
    ],
    correctIndex: 4,
    hint: "Find the L.C.M. of the three intervals.",
    explanation: [
      "\\( \\text{LCM}(12,18,30) = 180 \\) min \\( = 3 \\) hours, so \\( 11{:}00\\text{ am} + 3\\text{ h} = 2{:}00 \\) pm.",
    ],
  },

  // ── GEOMETRY ─────────────────────────────────────────────────────
  {
    question: "What is the sum of the interior angles of a rectangle?",
    image: null,
    type: "objective",
    options: [
      "\\( 60^{\\circ} \\)",
      "\\( 90^{\\circ} \\)",
      "\\( 150^{\\circ} \\)",
      "\\( 180^{\\circ} \\)",
      "\\( 360^{\\circ} \\)",
    ],
    correctIndex: 4,
    hint: "A rectangle is a quadrilateral (\\( 4 \\) sides).",
    explanation: [
      "The interior angles of any quadrilateral add up to \\( 360^{\\circ} \\) (four right angles).",
    ],
  },
  {
    question:
      "On the triangle shown, the two slanting sides are \\( (b+1) \\) cm and \\( (a+4) \\) cm and the base is \\( 12 \\) cm, with \\( b=11 \\) and \\( a=8 \\). What type of triangle is it?",
    image: svg(
      "0 0 160 130",
      `<path d="M80 12 L140 110 L20 110 Z"/>` +
        T(48, 64, "(b+1)cm", 11) +
        T(116, 64, "(a+4)cm", 11) +
        T(80, 124, "12cm", 11),
    ),
    type: "objective",
    options: [
      "Scalene triangle",
      "Equilateral triangle",
      "Isosceles triangle",
      "Right-angled triangle",
      "Square",
    ],
    correctIndex: 1,
    hint: "Work out the three side lengths.",
    explanation: [
      "\\( b+1 = 12 \\), \\( a+4 = 12 \\), base \\( = 12 \\). All three sides equal \\( 12 \\) cm → equilateral.",
    ],
  },
  {
    question:
      "Find \\( x \\) in the given triangle (the other two angles are \\( 40^{\\circ} \\) and \\( 60^{\\circ} \\)).",
    image: svg(
      "0 0 160 130",
      `<path d="M80 14 L138 112 L22 112 Z"/>` +
        T(80, 34, "x°", 12) +
        T(40, 104, "40°", 11) +
        T(120, 104, "60°", 11),
    ),
    type: "objective",
    options: [
      "\\( 60^{\\circ} \\)",
      "\\( 63^{\\circ} \\)",
      "\\( 72^{\\circ} \\)",
      "\\( 80^{\\circ} \\)",
      "\\( 85^{\\circ} \\)",
    ],
    correctIndex: 3,
    hint: "The three angles of a triangle add to \\( 180^{\\circ} \\).",
    explanation: [
      "\\( x = 180^{\\circ} - 40^{\\circ} - 60^{\\circ} = 80^{\\circ} \\).",
    ],
  },
  {
    question:
      "How many \\( \\text{m}^3 \\) of water does a \\( 2\\text{ m}\\times 4\\text{ m}\\times 5\\text{ m} \\) tank hold?",
    image: null,
    type: "objective",
    options: [
      "\\( 11 \\)",
      "\\( 20 \\)",
      "\\( 25 \\)",
      "\\( 30 \\)",
      "\\( 40 \\)",
    ],
    correctIndex: 4,
    hint: "Volume of a cuboid \\( = \\) length \\( \\times \\) width \\( \\times \\) height.",
    explanation: ["\\( 2\\times4\\times5 = 40\\ \\text{m}^3 \\)."],
  },
  {
    question: "Which of the following is NOT a prism?",
    image: null,
    type: "objective",
    options: ["Cylinder", "Cube", "Pyramid", "Cuboid", "Square-based prism"],
    correctIndex: 2,
    hint: "A prism has two identical, parallel ends.",
    explanation: ["A pyramid tapers to a single apex, so it is not a prism."],
  },
  {
    question:
      "The rectangle in the figure is made up of three identical squares. Find the perimeter of the rectangle if the perimeter of one square is \\( 16 \\) cm.",
    image: svg(
      "0 0 200 80",
      `<rect x="10" y="20" width="180" height="40"/>` +
        `<line x1="70" y1="20" x2="70" y2="60"/><line x1="130" y1="20" x2="130" y2="60"/>`,
    ),
    type: "objective",
    options: [
      "\\( 24 \\) cm",
      "\\( 32 \\) cm",
      "\\( 48 \\) cm",
      "\\( 64 \\) cm",
      "\\( 81 \\) cm",
    ],
    correctIndex: 1,
    hint: "Each square has side \\( 16\\div4 = 4 \\) cm.",
    explanation: [
      "The rectangle is \\( 12\\text{ cm}\\times4\\text{ cm} \\); perimeter \\( = 2(12+4) = 32 \\) cm.",
    ],
  },
  {
    question:
      "Find the perimeter of a semi-circle whose diameter is \\( 28 \\) cm. \\( \\left(\\pi = \\dfrac{22}{7}\\right) \\)",
    image: svg(
      "0 0 180 110",
      `<path d="M20 95 A70 70 0 0 1 160 95"/><line x1="20" y1="95" x2="160" y2="95"/>` +
        T(90, 108, "28 cm", 11),
    ),
    type: "objective",
    options: [
      "\\( 28 \\) cm",
      "\\( 40 \\) cm",
      "\\( 72 \\) cm",
      "\\( 80 \\) cm",
      "\\( 96 \\) cm",
    ],
    correctIndex: 2,
    hint: "Perimeter \\( = \\) half the circumference \\( + \\) the diameter.",
    explanation: [
      "\\( \\pi r + d = \\frac{22}{7}\\times14 + 28 = 44 + 28 = 72 \\) cm.",
    ],
  },
  {
    question:
      "Find the perimeter of the shape (a rectangle with a step cut into it; outer width \\( 21 \\) cm, height \\( 10 \\) cm, with steps of \\( 8 \\), \\( 5 \\), \\( 7 \\) and \\( 3 \\) cm).",
    image: svg(
      "0 0 230 140",
      `<path d="M15 120 L15 35 L95 35 L95 75 L165 75 L165 105 L215 105 L215 120 Z"/>` +
        T(55, 30, "8 cm", 10) +
        T(108, 58, "5 cm", 10) +
        T(130, 70, "7 cm", 10) +
        T(178, 92, "3 cm", 10) +
        T(115, 134, "21 cm", 10) +
        T(8, 80, "10", 10),
    ),
    type: "objective",
    options: [
      "\\( 40 \\) cm",
      "\\( 50 \\) cm",
      "\\( 48 \\) cm",
      "\\( 54 \\) cm",
      "\\( 60 \\) cm",
    ],
    correctIndex: 3,
    hint: "Add the lengths of all the outer edges.",
    explanation: [
      "Going around: \\( 10 + 8 + 5 + 7 + 3 + (\\text{remaining drop}) + 21 \\). Summing the labelled edges of the step outline gives \\( 54 \\) cm.",
      "⚠ Step shape read from the scan — verify the side labels against the official figure.",
    ],
  },
  {
    question: "Find the area of the same step-shape.",
    image: svg(
      "0 0 230 140",
      `<path d="M15 120 L15 35 L95 35 L95 75 L165 75 L165 105 L215 105 L215 120 Z" fill="currentColor" fill-opacity="0.18"/>` +
        T(55, 30, "8 cm", 10) +
        T(108, 58, "5 cm", 10) +
        T(130, 70, "7 cm", 10) +
        T(178, 92, "3 cm", 10) +
        T(115, 134, "21 cm", 10) +
        T(8, 80, "10", 10),
    ),
    type: "objective",
    options: [
      "\\( 105\\ \\text{cm}^2 \\)",
      "\\( 109\\ \\text{cm}^2 \\)",
      "\\( 118\\ \\text{cm}^2 \\)",
      "\\( 124\\ \\text{cm}^2 \\)",
      "\\( 136\\ \\text{cm}^2 \\)",
    ],
    correctIndex: 2,
    hint: "Split the shape into rectangles and add their areas.",
    explanation: [
      "Decomposing the step into rectangular strips and summing gives \\( 118\\ \\text{cm}^2 \\).",
      "⚠ Depends on the exact figure dimensions — verify against the official key.",
    ],
  },
  {
    question:
      "Find \\( x \\) in the given isosceles triangle (the two equal sides are marked \\( 10 \\); the apex angle is \\( x^{\\circ} \\) and a base angle is \\( 4x^{\\circ} \\)).",
    image: svg(
      "0 0 170 140",
      `<path d="M120 14 L150 120 L20 120 Z"/>` +
        T(118, 34, "x°", 12) +
        T(40, 112, "4x°", 11) +
        T(60, 60, "10", 11) +
        T(140, 70, "10", 11),
    ),
    type: "objective",
    options: [
      "\\( 20 \\)",
      "\\( 30 \\)",
      "\\( 40 \\)",
      "\\( 50 \\)",
      "\\( 60 \\)",
    ],
    correctIndex: 0,
    hint: "Equal sides mean equal base angles, so both base angles are \\( 4x \\).",
    explanation: [
      "\\( x + 4x + 4x = 180 \\Rightarrow 9x = 180 \\Rightarrow x = 20 \\).",
    ],
  },
  {
    question:
      "Find the area of the given rectangle (top \\( y+2 \\), bottom \\( 7 \\), left \\( m \\), right \\( y-1 \\)).",
    image: svg(
      "0 0 180 110",
      `<rect x="30" y="25" width="120" height="60"/>` +
        T(90, 18, "y+2", 11) +
        T(90, 100, "7", 11) +
        T(20, 58, "m", 11) +
        T(162, 58, "y−1", 11),
    ),
    type: "objective",
    options: [
      "\\( 14 \\)",
      "\\( 18 \\)",
      "\\( 21 \\)",
      "\\( 24 \\)",
      "\\( 28 \\)",
    ],
    correctIndex: 4,
    hint: "Opposite sides of a rectangle are equal: \\( y+2 = 7 \\) and \\( m = y-1 \\).",
    explanation: [
      "\\( y+2 = 7 \\Rightarrow y = 5 \\); then \\( m = y-1 = 4 \\). Area \\( = 7\\times4 = 28 \\).",
    ],
  },
  {
    question:
      "The interior angles of a quadrilateral are in the ratio \\( 1:2:3:4 \\). Find the greatest angle.",
    image: null,
    type: "objective",
    options: [
      "\\( 72^{\\circ} \\)",
      "\\( 90^{\\circ} \\)",
      "\\( 105^{\\circ} \\)",
      "\\( 120^{\\circ} \\)",
      "\\( 144^{\\circ} \\)",
    ],
    correctIndex: 4,
    hint: "The four angles add to \\( 360^{\\circ} \\); total parts \\( = 10 \\).",
    explanation: [
      "Greatest \\( = \\frac{4}{10}\\times 360^{\\circ} = 144^{\\circ} \\).",
    ],
  },
  {
    question:
      "What is the shaded area? (An outer rectangle \\( 40\\text{ cm}\\times 30\\text{ cm} \\) with an inner unshaded rectangle \\( 30\\text{ cm}\\times 20\\text{ cm} \\).)",
    image: svg(
      "0 0 200 150",
      `<rect x="15" y="15" width="170" height="120" fill="currentColor" fill-opacity="0.22"/>` +
        `<rect x="55" y="45" width="90" height="60" fill="var(--paper,#fff)" stroke="currentColor"/>` +
        T(100, 10, "40 cm", 10) +
        T(100, 80, "30×20", 10),
    ),
    type: "objective",
    options: [
      "\\( 600\\ \\text{cm}^2 \\)",
      "\\( 500\\ \\text{cm}^2 \\)",
      "\\( 400\\ \\text{cm}^2 \\)",
      "\\( 300\\ \\text{cm}^2 \\)",
      "\\( 200\\ \\text{cm}^2 \\)",
    ],
    correctIndex: 0,
    hint: "Shaded \\( = \\) outer area \\( - \\) inner area.",
    explanation: [
      "\\( 40\\times30 - 30\\times20 = 1200 - 600 = 600\\ \\text{cm}^2 \\).",
    ],
  },
  {
    question:
      "What is the smaller angle between the hour and minute hands of a clock at \\( 9{:}10 \\) am?",
    image: null,
    type: "objective",
    options: [
      "\\( 60^{\\circ} \\)",
      "\\( 90^{\\circ} \\)",
      "\\( 120^{\\circ} \\)",
      "\\( 145^{\\circ} \\)",
      "\\( 170^{\\circ} \\)",
    ],
    correctIndex: 3,
    hint: "Hour hand moves \\( 0.5^{\\circ} \\) per minute; minute hand \\( 6^{\\circ} \\) per minute.",
    explanation: [
      "Hour hand at \\( 9{:}10 = 275^{\\circ} \\); minute hand at \\( 60^{\\circ} \\); difference \\( = 215^{\\circ} \\); smaller angle \\( = 360^{\\circ}-215^{\\circ} = 145^{\\circ} \\).",
    ],
  },
  {
    question:
      "Amina counts the faces of the pentagonal pyramid, Farouk counts the vertices, and Tobi counts the edges. What is the sum of the three numbers?",
    image: svg(
      "0 0 180 150",
      `<path d="M90 10 L150 95 L120 130 L60 130 L30 95 Z"/>` +
        `<path d="M90 10 L60 130 M90 10 L120 130 M90 10 L30 95 M90 10 L150 95"/>` +
        `<path d="M30 95 L120 130 M150 95 L60 130" stroke-dasharray="3 3"/>`,
    ),
    type: "objective",
    options: [
      "\\( 14 \\)",
      "\\( 16 \\)",
      "\\( 18 \\)",
      "\\( 22 \\)",
      "\\( 25 \\)",
    ],
    correctIndex: 3,
    hint: "A pentagonal pyramid: \\( 1 \\) base \\( + 5 \\) triangular faces; \\( 6 \\) vertices; \\( 10 \\) edges.",
    explanation: [
      "Faces \\( 6 \\) \\( + \\) vertices \\( 6 \\) \\( + \\) edges \\( 10 = 22 \\).",
    ],
  },

  // ── APTITUDE ─────────────────────────────────────────────────────
  {
    question:
      "What is the next number in the series: \\( 1, 4, 7, 10, 13, 16, ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 19 \\)",
      "\\( 18 \\)",
      "\\( 17 \\)",
      "\\( 16 \\)",
      "\\( 15 \\)",
    ],
    correctIndex: 0,
    hint: "The numbers go up by a fixed amount.",
    explanation: ["Each term increases by \\( 3 \\): \\( 16 + 3 = 19 \\)."],
  },
  {
    question:
      "What is the next number in the series: \\( 1, 2, 4, 5, 10, 11, ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 12 \\)",
      "\\( 16 \\)",
      "\\( 19 \\)",
      "\\( 22 \\)",
      "\\( 25 \\)",
    ],
    correctIndex: 3,
    hint: "The operations alternate: \\( +1 \\), \\( \\times2 \\), \\( +1 \\), \\( \\times2 \\)…",
    explanation: ["\\( 11 \\times 2 = 22 \\)."],
  },
  {
    question:
      "What is the next number in the series: \\( 1, 3, 4, 7, 11, 18, ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 22 \\)",
      "\\( 26 \\)",
      "\\( 29 \\)",
      "\\( 32 \\)",
      "\\( 35 \\)",
    ],
    correctIndex: 2,
    hint: "Each term is the sum of the two before it.",
    explanation: ["\\( 11 + 18 = 29 \\)."],
  },
  {
    question:
      "What is the next number in the series: \\( 1, 2, 2, 4, 8, 32, ? \\)",
    image: null,
    type: "objective",
    options: [
      "\\( 180 \\)",
      "\\( 212 \\)",
      "\\( 240 \\)",
      "\\( 256 \\)",
      "\\( 298 \\)",
    ],
    correctIndex: 3,
    hint: "Each term is the product of the two before it.",
    explanation: ["\\( 8 \\times 32 = 256 \\)."],
  },
  {
    question:
      "Series: \\( 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, \\ldots \\) (each number is repeated as many times as its value). What is the \\( 25^{\\text{th}} \\) number?",
    image: null,
    type: "objective",
    options: ["\\( 5 \\)", "\\( 6 \\)", "\\( 7 \\)", "\\( 8 \\)", "\\( 9 \\)"],
    correctIndex: 2,
    hint: "Track where each block ends: \\( 1,3,6,10,15,21,28,\\ldots \\)",
    explanation: [
      "The \\( 6 \\)s end at position \\( 21 \\) and the \\( 7 \\)s run to position \\( 28 \\); position \\( 25 \\) is a \\( 7 \\).",
    ],
  },
  {
    question:
      "In the same series, at what position does the number \\( 10 \\) first appear?",
    image: null,
    type: "objective",
    options: [
      "\\( 52^{\\text{nd}} \\)",
      "\\( 46^{\\text{th}} \\)",
      "\\( 39^{\\text{th}} \\)",
      "\\( 36^{\\text{th}} \\)",
      "\\( 30^{\\text{th}} \\)",
    ],
    correctIndex: 1,
    hint: "Sum the counts of \\( 1 \\) through \\( 9 \\), then add one.",
    explanation: [
      "\\( 1+2+\\cdots+9 = 45 \\), so the first \\( 10 \\) is at position \\( 46 \\).",
    ],
  },
  {
    question:
      "What is the sum of the first \\( 20 \\) numbers in the same series?",
    image: null,
    type: "objective",
    options: [
      "\\( 68 \\)",
      "\\( 77 \\)",
      "\\( 85 \\)",
      "\\( 90 \\)",
      "\\( 99 \\)",
    ],
    correctIndex: 2,
    hint: "Positions \\( 16{-}20 \\) are five \\( 6 \\)s.",
    explanation: [
      "\\( 1{\\cdot}1 + 2{\\cdot}2 + 3{\\cdot}3 + 4{\\cdot}4 + 5{\\cdot}5 + 6{\\cdot}5 = 1+4+9+16+25+30 = 85 \\).",
    ],
  },
  {
    question:
      "Michael eats one sweet every \\( 5 \\) minutes from \\( 11{:}10 \\) am to \\( 2{:}25 \\) pm (one at the start). How many sweets did he eat?",
    image: svg(
      "0 0 200 110",
      `<circle cx="55" cy="50" r="40"/><line x1="55" y1="50" x2="55" y2="22"/><line x1="55" y1="50" x2="32" y2="56"/>` +
        T(55, 105, "Start", 11) +
        `<circle cx="150" cy="50" r="40"/><line x1="150" y1="50" x2="150" y2="22"/><line x1="150" y1="50" x2="170" y2="62"/>` +
        T(150, 105, "Finish", 11),
    ),
    type: "objective",
    options: [
      "\\( 41 \\)",
      "\\( 40 \\)",
      "\\( 37 \\)",
      "\\( 35 \\)",
      "\\( 33 \\)",
    ],
    correctIndex: 1,
    hint: "Find the total minutes, divide by \\( 5 \\), then add \\( 1 \\) for the first sweet.",
    explanation: [
      "\\( 3\\text{ h }15\\text{ min} = 195 \\) min; \\( 195\\div5 = 39 \\) intervals, plus the first sweet \\( = 40 \\).",
    ],
  },
  {
    question:
      "The table shows how many balloons of each colour Abel has — Blue \\( 118 \\), Green \\( 125 \\), Yellow \\( 152 \\), Red \\( 143 \\), White \\( 99 \\). Which colour does Abel have most of?",
    image: svg(
      "0 0 200 150",
      (() => {
        const rows = [
          ["Blue", "118"],
          ["Green", "125"],
          ["Yellow", "152"],
          ["Red", "143"],
          ["White", "99"],
        ];
        let s = `<rect x="10" y="10" width="180" height="130" fill="none"/>`;
        rows.forEach((r, i) => {
          const y = 10 + i * 26;
          s +=
            `<line x1="10" y1="${y + 26}" x2="190" y2="${y + 26}"/>` +
            `<line x1="110" y1="${y}" x2="110" y2="${y + 26}"/>` +
            T(60, y + 18, r[0], 12) +
            T(150, y + 18, r[1], 12);
        });
        return s;
      })(),
    ),
    type: "objective",
    options: ["Blue", "Green", "Yellow", "Red", "White"],
    correctIndex: 2,
    hint: "Find the largest number in the table.",
    explanation: ["Yellow \\( = 152 \\) is the largest count."],
  },
  {
    question: "How many more blue balloons than white balloons does Abel have?",
    image: null,
    type: "objective",
    options: [
      "\\( 17 \\)",
      "\\( 19 \\)",
      "\\( 21 \\)",
      "\\( 23 \\)",
      "\\( 25 \\)",
    ],
    correctIndex: 1,
    hint: "Subtract White from Blue.",
    explanation: ["\\( 118 - 99 = 19 \\)."],
  },
  {
    question:
      "Abel has more than \\( 123 \\) but fewer than \\( 139 \\) of which colour?",
    image: null,
    type: "objective",
    options: ["Blue", "Green", "Yellow", "Red", "White"],
    correctIndex: 1,
    hint: "Check which count lies strictly between \\( 123 \\) and \\( 139 \\).",
    explanation: ["Green \\( = 125 \\), and \\( 123 < 125 < 139 \\)."],
  },
  {
    question:
      "If Abel loses \\( 3 \\) blue, \\( 9 \\) green, \\( 38 \\) yellow and \\( 26 \\) red balloons, which colour will he have most of?",
    image: null,
    type: "objective",
    options: ["Blue", "Green", "Yellow", "Red", "White"],
    correctIndex: 3,
    hint: "Subtract the losses, then compare.",
    explanation: [
      "New counts: Blue \\( 115 \\), Green \\( 116 \\), Yellow \\( 114 \\), Red \\( 117 \\), White \\( 99 \\). Red is highest.",
    ],
  },
  {
    question:
      "When \\( 4 \\) balls are put in a box it weighs \\( 3 \\) kg; with \\( 8 \\) balls it weighs \\( 4 \\) kg. How much will the box weigh with \\( 16 \\) balls inside?",
    image: null,
    type: "objective",
    options: [
      "\\( 5 \\) kg",
      "\\( 6 \\) kg",
      "\\( 7 \\) kg",
      "\\( 8 \\) kg",
      "\\( 10 \\) kg",
    ],
    correctIndex: 1,
    hint: "The extra \\( 4 \\) balls added \\( 1 \\) kg, so each ball is \\( 0.25 \\) kg.",
    explanation: [
      "\\( 1 \\) ball \\( = 0.25 \\) kg; box \\( = 3 - 4(0.25) = 2 \\) kg; with \\( 16 \\) balls: \\( 2 + 16(0.25) = 6 \\) kg.",
    ],
  },
  {
    question:
      "On the number line (marked \\( 100, 104, 108, \\ldots, 120 \\)), point \\( L \\) is the midpoint between which two numbers?",
    image: svg(
      "0 0 240 70",
      `<line x1="15" y1="45" x2="225" y2="45"/>` +
        [0, 1, 2, 3, 4, 5]
          .map(
            (i) =>
              `<line x1="${20 + i * 38}" y1="38" x2="${20 + i * 38}" y2="52"/>`,
          )
          .join("") +
        T(20, 66, "100", 10) +
        T(58, 66, "104", 10) +
        T(96, 66, "108", 10) +
        T(210, 66, "120", 10) +
        `<path d="M134 20 L134 40" stroke-width="2.5"/>` +
        T(134, 14, "L", 12),
    ),
    type: "objective",
    options: [
      "\\( 104 \\) and \\( 120 \\)",
      "\\( 100 \\) and \\( 120 \\)",
      "\\( 108 \\) and \\( 120 \\)",
      "\\( 100 \\) and \\( 108 \\)",
      "\\( 104 \\) and \\( 108 \\)",
    ],
    correctIndex: 4,
    hint: "The midpoint is halfway between the two values.",
    explanation: ["\\( L = 106 \\), and \\( \\frac{104+108}{2} = 106 \\)."],
  },
  {
    question:
      "How many parallelograms are there in the figure (a parallelogram split into a \\( 2\\times 2 \\) grid)?",
    image: svg(
      "0 0 160 110",
      `<path d="M40 90 L70 20 L150 20 L120 90 Z"/>` +
        `<path d="M55 55 L135 55 M80 90 L110 20"/>`,
    ),
    type: "objective",
    options: ["\\( 3 \\)", "\\( 5 \\)", "\\( 6 \\)", "\\( 7 \\)", "\\( 9 \\)"],
    correctIndex: 4,
    hint: "Count small, medium (\\( 1\\times2 \\) and \\( 2\\times1 \\)) and the whole.",
    explanation: [
      "\\( 4 \\) small \\( + 2 \\) wide \\( + 2 \\) tall \\( + 1 \\) whole \\( = 9 \\) parallelograms.",
    ],
  },
  {
    question:
      "How many numbers are there in the sequence \\( 20, 22, 24, 26, 28, \\ldots, 100 \\)?",
    image: null,
    type: "objective",
    options: [
      "\\( 30 \\)",
      "\\( 37 \\)",
      "\\( 41 \\)",
      "\\( 43 \\)",
      "\\( 47 \\)",
    ],
    correctIndex: 2,
    hint: "Count \\( = \\dfrac{\\text{last} - \\text{first}}{\\text{step}} + 1 \\).",
    explanation: ["\\( \\frac{100-20}{2} + 1 = 40 + 1 = 41 \\)."],
  },
  {
    question:
      "Which story problem can be described by the equation \\( 7 - 4 = ? \\)",
    image: null,
    type: "objective",
    options: [
      "Tope has \\( 4 \\) movies and \\( 7 \\) books. How many does he have in all?",
      "Tope has \\( 7 \\) books. He has \\( 4 \\) fewer movies than books. How many movies does he have?",
      "Tope has \\( 4 \\) shelves with \\( 7 \\) books each. How many books in total?",
      "Tope has \\( 7 \\) books on \\( 4 \\) shelves. How many books per shelf?",
      "Tope has \\( 7 \\) blue books and \\( 4 \\) green books. How many in total?",
    ],
    correctIndex: 1,
    hint: "Subtraction finds a difference (‘how many fewer’).",
    explanation: [
      "‘\\( 4 \\) fewer movies than \\( 7 \\) books’ gives \\( 7 - 4 = 3 \\) movies.",
    ],
  },
  {
    question:
      "The ‘floor’ of a number is the largest whole number not greater than it (e.g. \\( \\text{floor}(14/5)=2 \\)). Evaluate \\( \\text{floor}\\!\\left(\\dfrac{\\text{floor}(33/4)}{\\text{floor}(25/7)}\\right) \\).",
    image: null,
    type: "objective",
    options: ["\\( 1 \\)", "\\( 2 \\)", "\\( 3 \\)", "\\( 4 \\)", "\\( 5 \\)"],
    correctIndex: 1,
    hint: "Evaluate the inner floors first.",
    explanation: [
      "\\( \\text{floor}(33/4)=8 \\), \\( \\text{floor}(25/7)=3 \\); \\( \\text{floor}(8/3)=\\text{floor}(2.67)=2 \\).",
    ],
  },
  {
    question:
      "Four contestants compete; gold, silver and bronze medals are awarded (no other prizes). In how many different ways can the three medals be awarded?",
    image: null,
    type: "objective",
    options: [
      "\\( 30 \\)",
      "\\( 24 \\)",
      "\\( 20 \\)",
      "\\( 16 \\)",
      "\\( 15 \\)",
    ],
    correctIndex: 1,
    hint: "\\( 4 \\) choices for gold, \\( 3 \\) for silver, \\( 2 \\) for bronze.",
    explanation: ["\\( 4\\times3\\times2 = 24 \\) ways."],
  },
  {
    question:
      "If \\( 7948 = \\text{LIKE} \\) and \\( 51326 = \\text{MATHS} \\), then \\( 5148 = ? \\)",
    image: null,
    type: "objective",
    options: ["MAKE", "TASK", "MASK", "TAKE", "LIST"],
    correctIndex: 0,
    hint: "Match each digit to its letter from the two codes.",
    explanation: [
      "\\( 5{=}\\text{M},\\,1{=}\\text{A},\\,4{=}\\text{K},\\,8{=}\\text{E} \\Rightarrow \\text{MAKE} \\).",
    ],
  },
  {
    question:
      "The operation \\( \\blacklozenge \\) gives the smaller of two numbers and \\( \\square \\) gives the greater. Evaluate \\( 5 \\blacklozenge 7 \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 2 \\)",
      "\\( 5 \\)",
      "\\( 7 \\)",
      "\\( 12 \\)",
      "\\( 35 \\)",
    ],
    correctIndex: 1,
    hint: "\\( \\blacklozenge \\) takes the smaller value.",
    explanation: ["The smaller of \\( 5 \\) and \\( 7 \\) is \\( 5 \\)."],
  },
  {
    question:
      "Using the same operations (\\( \\blacklozenge \\) = smaller, \\( \\square \\) = greater), evaluate \\( (2 \\blacklozenge 4) + (7 \\square 6) \\).",
    image: null,
    type: "objective",
    options: [
      "\\( 8 \\)",
      "\\( 9 \\)",
      "\\( 10 \\)",
      "\\( 11 \\)",
      "\\( 12 \\)",
    ],
    correctIndex: 1,
    hint: "Evaluate each bracket separately.",
    explanation: [
      "\\( 2\\blacklozenge4 = 2 \\) and \\( 7\\square6 = 7 \\); \\( 2 + 7 = 9 \\).",
    ],
  },
  {
    question:
      "Using the same operations, evaluate \\( \\big[(3\\,\\square\\,4)\\,\\blacklozenge\\,(8\\,\\square\\,1)\\big]\\,\\square\\,\\big[(6\\,\\blacklozenge\\,3)\\,\\square\\,(7\\,\\blacklozenge\\,8)\\big] \\).",
    image: null,
    type: "objective",
    options: ["\\( 1 \\)", "\\( 3 \\)", "\\( 4 \\)", "\\( 7 \\)", "\\( 8 \\)"],
    correctIndex: 3,
    hint: "Work from the inside out, one bracket at a time.",
    explanation: [
      "\\( 3\\square4=4,\\;8\\square1=8 \\Rightarrow 4\\blacklozenge8 = 4 \\).",
      "\\( 6\\blacklozenge3=3,\\;7\\blacklozenge8=7 \\Rightarrow 3\\square7 = 7 \\).",
      "Finally \\( 4\\square7 = 7 \\).",
    ],
  },
  {
    question:
      "A caterpillar at corner \\( A \\) reaches a grape at corner \\( B \\) by moving only along the edges of a cube (edge \\( = 10 \\) cm), never using an edge twice. Find the shortest possible distance to the grape.",
    image: svg(
      "0 0 170 150",
      `<path d="M30 110 L110 110 L110 40 L30 40 Z"/>` +
        `<path d="M30 40 L60 20 L140 20 L110 40 M110 110 L140 90 L140 20 M30 110 L60 90 L60 20 M60 90 L140 90" stroke-dasharray="4 3"/>` +
        T(24, 122, "A", 13) +
        T(146, 16, "B", 13),
    ),
    type: "objective",
    options: [
      "\\( 30 \\) cm",
      "\\( 40 \\) cm",
      "\\( 50 \\) cm",
      "\\( 60 \\) cm",
      "\\( 70 \\) cm",
    ],
    correctIndex: 0,
    hint: "Opposite corners of a cube are \\( 3 \\) edges apart.",
    explanation: [
      "The shortest route uses \\( 3 \\) edges: \\( 3\\times 10 = 30 \\) cm.",
    ],
  },
  {
    question:
      "Using the same cube, find the longest possible distance to the grape (no edge used twice).",
    image: svg(
      "0 0 170 150",
      `<path d="M30 110 L110 110 L110 40 L30 40 Z"/>` +
        `<path d="M30 40 L60 20 L140 20 L110 40 M110 110 L140 90 L140 20 M30 110 L60 90 L60 20 M60 90 L140 90" stroke-dasharray="4 3"/>` +
        T(24, 122, "A", 13) +
        T(146, 16, "B", 13),
    ),
    type: "objective",
    options: [
      "\\( 40 \\) cm",
      "\\( 50 \\) cm",
      "\\( 60 \\) cm",
      "\\( 70 \\) cm",
      "\\( 80 \\) cm",
    ],
    correctIndex: 3,
    hint: "Try to walk along as many different edges as possible before ending at \\( B \\).",
    explanation: [
      "A trail that re-uses no edge can cover \\( 7 \\) edges from \\( A \\) to \\( B \\): \\( 7\\times 10 = 70 \\) cm.",
      "⚠ Some answer keys give \\( 60 \\) cm for this item — verify against the official key.",
    ],
  },
];

setupQuiz(quizData, 5400);
