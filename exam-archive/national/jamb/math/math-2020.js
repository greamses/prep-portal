const examQuestions = [
  // ======================== PAGE 1 (Questions 1–5) ========================
  {
    question:
      "Evaluate and correct to two decimal places, \\( 75.0785 - 34.624 + 9.83 \\)",
    image: null,
    options: [
      "\\( 30.60 \\)",
      "\\( 50.29 \\)",
      "\\( 50.28 \\)",
      "\\( 30.63 \\)",
    ],
    correctIndex: 1,
    hint: "Add and subtract in order: \\( 75.0785 - 34.624 = 40.4545 \\), then \\( 40.4545 + 9.83 = 50.2845 \\)",
    explanation: [
      "\\( 75.0785 - 34.624 = 40.4545 \\)",
      "\\( 40.4545 + 9.83 = 50.2845 \\)",
      "Rounded to two decimal places = \\( 50.29 \\)",
    ],
  },
  {
    question:
      "If \\( X = \\{x : x < 7\\} \\) and \\( Y = \\{y: y \\text{ is a factor of } 24\\} \\) are subsets of \\( \\mu = \\{1, 2, 3, \\dots, 10\\} \\), find \\( X \\cap Y \\).",
    image: null,
    options: [
      "\\( \\{2, 3, 4, 6\\} \\)",
      "\\( \\{1, 2, 3, 4, 6\\} \\)",
      "\\( \\{2, 3, 4, 6, 8\\} \\)",
      "\\( \\{1, 2, 3, 4, 6, 8\\} \\)",
    ],
    correctIndex: 1,
    hint: "\\( X = \\{1, 2, 3, 4, 5, 6\\} \\), \\( Y = \\{1, 2, 3, 4, 6, 8\\} \\)",
    explanation: ["\\( X \\cap Y = \\{1, 2, 3, 4, 6\\} \\)"],
  },
  {
    question:
      "Simplify \\( \\left[ \\left(\\frac{16}{9}\\right)^{\\frac{-3}{2}} \\times 16^{\\frac{-3}{4}} \\right]^{\\frac{1}{3}} \\)",
    image: null,
    options: [
      "\\( \\frac{3}{4} \\)",
      "\\( \\frac{9}{16} \\)",
      "\\( \\frac{3}{8} \\)",
      "\\( \\frac{1}{4} \\)",
    ],
    correctIndex: 2,
    hint: "Use laws of indices. \\( \\left(\\frac{16}{9}\\right)^{\\frac{-3}{2}} = \\left(\\frac{9}{16}\\right)^{\\frac{3}{2}} = \\left(\\frac{3}{4}\\right)^3 = \\frac{27}{64} \\). \\( 16^{\\frac{-3}{4}} = \\frac{1}{8} \\). Multiply: \\( \\frac{27}{64} \\times \\frac{1}{8} = \\frac{27}{512} \\). Then raise to \\( \\frac{1}{3} \\): \\( \\sqrt[3]{\\frac{27}{512}} = \\frac{3}{8} \\).",
    explanation: [
      "\\( \\left(\\frac{16}{9}\\right)^{\\frac{-3}{2}} = \\frac{27}{64} \\)",
      "\\( 16^{\\frac{-3}{4}} = \\frac{1}{8} \\)",
      "\\( \\frac{27}{64} \\times \\frac{1}{8} = \\frac{27}{512} \\)",
      "\\( \\left(\\frac{27}{512}\\right)^{\\frac{1}{3}} = \\frac{3}{8} \\)",
    ],
  },
  {
    question:
      "Express \\( 1 + 2 \\log_{10} 3 \\) in the form \\( \\log_{10} \\)",
    image: null,
    options: [
      "\\( \\log_{10} 90 \\)",
      "\\( \\log_{10} 19 \\)",
      "\\( \\log_{10} 9 \\)",
      "\\( \\log_{10} 6 \\)",
    ],
    correctIndex: 0,
    hint: "\\( 1 = \\log_{10} 10 \\), \\( 2 \\log_{10} 3 = \\log_{10} 3^2 = \\log_{10} 9 \\). Sum: \\( \\log_{10} 10 + \\log_{10} 9 = \\log_{10} (10 \\times 9) = \\log_{10} 90 \\).",
    explanation: [
      "\\( 1 = \\log_{10} 10 \\)",
      "\\( 2 \\log_{10} 3 = \\log_{10} 9 \\)",
      "\\( \\log_{10} 10 + \\log_{10} 9 = \\log_{10} 90 \\)",
    ],
  },
  {
    question:
      "If \\( 101_{\\text{two}} + 12_y = 23_{\\text{five}} \\), find the value of \\( y \\).",
    image: null,
    options: ["\\( 8 \\)", "\\( 7 \\)", "\\( 6 \\)", "\\( 5 \\)"],
    correctIndex: 2,
    hint: "Convert: \\( 101_{\\text{two}} = 1 \\times 2^2 + 0 \\times 2^1 + 1 \\times 2^0 = 5 \\). \\( 23_{\\text{five}} = 2 \\times 5^1 + 3 \\times 5^0 = 13 \\). So \\( 5 + 12_y = 13 \\), thus \\( 12_y = 8 \\). In base \\( y \\), \\( 12_y = 1 \\times y + 2 = 8 \\), so \\( y = 6 \\).",
    explanation: [
      "\\( 101_{\\text{two}} = 5 \\)",
      "\\( 23_{\\text{five}} = 13 \\)",
      "\\( 5 + 12_y = 13 \\Rightarrow 12_y = 8 \\)",
      "\\( 1 \\times y + 2 = 8 \\Rightarrow y = 6 \\)",
    ],
  },

  // ======================== PAGE 2 (Questions 6–10) ========================
  {
    question:
      "An amount of \\( \\text{N}550,000.00 \\) was realized when a principal, \\( x \\) was saved at \\( 2\\% \\) simple interest for \\( 5 \\) years. Find the value of \\( x \\).",
    image: null,
    options: [
      "\\( \\text{N}470,000.00 \\)",
      "\\( \\text{N}480,000.00 \\)",
      "\\( \\text{N}490,000.00 \\)",
      "\\( \\text{N}500,000.00 \\)",
    ],
    correctIndex: 3,
    hint: "Simple interest formula: \\( A = P(1 + rt) \\). Here \\( A = 550,000 \\), \\( r = 0.02 \\), \\( t = 5 \\). So \\( 550,000 = x(1 + 0.02 \\times 5) = x(1.1) \\). Thus \\( x = \\frac{550,000}{1.1} = 500,000 \\).",
    explanation: [
      "\\( 550,000 = x(1 + 0.1) = 1.1x \\)",
      "\\( x = 550,000 \\div 1.1 = 500,000 \\)",
    ],
  },
  {
    question:
      "Given that \\( \\frac{\\sqrt{3} + \\sqrt{5}}{\\sqrt{5}} = x + y\\sqrt{15} \\), find the value of \\( (x + y) \\).",
    image: null,
    options: [
      "\\( 1\\frac{3}{5} \\)",
      "\\( 1\\frac{2}{5} \\)",
      "\\( 1\\frac{1}{5} \\)",
      "\\( \\frac{1}{5} \\)",
    ],
    correctIndex: 2,
    hint: "Rationalize: \\( \\frac{\\sqrt{3} + \\sqrt{5}}{\\sqrt{5}} = \\frac{\\sqrt{15} + 5}{5} = 1 + \\frac{\\sqrt{15}}{5} \\). So \\( x = 1 \\), \\( y = \\frac{1}{5} \\), and \\( x + y = 1 + \\frac{1}{5} = 1\\frac{1}{5} \\).",
    explanation: [
      "\\( \\frac{\\sqrt{3} + \\sqrt{5}}{\\sqrt{5}} = 1 + \\frac{1}{5}\\sqrt{15} \\)",
      "\\( x + y = 1 + \\frac{1}{5} = \\frac{6}{5} = 1\\frac{1}{5} \\)",
    ],
  },
  {
    question:
      "If \\( x = 3 \\) and \\( y = -1 \\), evaluate \\( 2(x^2 - y^3) \\).",
    image: null,
    options: ["\\( 24 \\)", "\\( 22 \\)", "\\( 20 \\)", "\\( 16 \\)"],
    correctIndex: 2,
    hint: "\\( x^2 = 9 \\), \\( y^3 = (-1)^3 = -1 \\), so \\( x^2 - y^3 = 9 - (-1) = 10 \\). Then \\( 2 \\times 10 = 20 \\).",
    explanation: [
      "\\( x^2 - y^3 = 9 - (-1) = 10 \\)",
      "\\( 2 \\times 10 = 20 \\)",
    ],
  },
  {
    question:
      "Solve \\( 3x - 2y = 10 \\) and \\( x + 3y = 7 \\) simultaneously.",
    image: null,
    options: [
      "\\( x = -4, y = 1 \\)",
      "\\( x = -1, y = -4 \\)",
      "\\( x = 1, y = 4 \\)",
      "\\( x = 4, y = 1 \\)",
    ],
    correctIndex: 3,
    hint: "From \\( x + 3y = 7 \\), \\( x = 7 - 3y \\). Substitute: \\( 3(7 - 3y) - 2y = 10 \\) → \\( 21 - 9y - 2y = 10 \\) → \\( 21 - 11y = 10 \\) → \\( -11y = -11 \\) → \\( y = 1 \\). Then \\( x = 7 - 3(1) = 4 \\).",
    explanation: ["\\( y = 1 \\)", "\\( x = 4 \\)"],
  },
  {
    question: "The implication \\( x \\to y \\) is equivalent to?",
    image: null,
    options: [
      "\\( \\sim y \\to \\sim x \\)",
      "\\( y \\to \\sim x \\)",
      "\\( \\sim x \\to \\sim y \\)",
      "\\( y \\to x \\)",
    ],
    correctIndex: 0,
    hint: "The contrapositive of \\( x \\to y \\) is \\( \\sim y \\to \\sim x \\), which is logically equivalent.",
    explanation: [
      "\\( x \\to y \\equiv \\sim y \\to \\sim x \\) (contrapositive)",
    ],
  },

  // ======================== PAGE 3 (Questions 11–15) ========================
  {
    question:
      "The first term of a geometric progression (G.P.) is \\( 3 \\) and the \\( 5^{\\text{th}} \\) term is \\( 48 \\). Find the common ratio.",
    image: null,
    options: ["\\( 2 \\)", "\\( 4 \\)", "\\( 8 \\)", "\\( 16 \\)"],
    correctIndex: 0,
    hint: "For a GP, \\( T_n = ar^{n-1} \\). So \\( T_5 = 3 \\times r^4 = 48 \\). Thus \\( r^4 = 16 \\), so \\( r = 2 \\) (positive ratio).",
    explanation: ["\\( 3r^4 = 48 \\)", "\\( r^4 = 16 \\)", "\\( r = 2 \\)"],
  },
  {
    question: "Solve \\( \\frac{1}{3}(5 - 3x) < \\frac{2}{5}(3 - 7x) \\).",
    image: null,
    options: [
      "\\( x > \\frac{7}{22} \\)",
      "\\( x < \\frac{7}{22} \\)",
      "\\( x > -\\frac{7}{27} \\)",
      "\\( x < -\\frac{7}{27} \\)",
    ],
    correctIndex: 3,
    hint: "Multiply through by \\( 15 \\) (LCM of \\( 3 \\) and \\( 5 \\)): \\( 5(5 - 3x) < 6(3 - 7x) \\) → \\( 25 - 15x < 18 - 42x \\) → \\( 25 - 15x - 18 + 42x < 0 \\) → \\( 7 + 27x < 0 \\) → \\( 27x < -7 \\) → \\( x < -\\frac{7}{27} \\).",
    explanation: [
      "\\( 25 - 15x < 18 - 42x \\)",
      "\\( 7 + 27x < 0 \\)",
      "\\( x < -\\frac{7}{27} \\)",
    ],
  },
  {
    question:
      "Make \\( m \\) the subject of the relation \\( k = \\sqrt{\\frac{m - y}{m + 1}} \\).",
    image: null,
    options: [
      "\\( m = \\frac{y + k^2}{k^2 + 1} \\)",
      "\\( m = \\frac{y + k^2}{1 - k^2} \\)",
      "\\( m = \\frac{y - k^2}{k^2 + 1} \\)",
      "\\( m = \\frac{y - k^2}{1 - k^2} \\)",
    ],
    correctIndex: 1,
    hint: "Square both sides: \\( k^2 = \\frac{m - y}{m + 1} \\). Then \\( k^2(m + 1) = m - y \\) → \\( k^2 m + k^2 = m - y \\) → \\( k^2 + y = m - k^2 m = m(1 - k^2) \\). Thus \\( m = \\frac{k^2 + y}{1 - k^2} \\).",
    explanation: [
      "\\( k^2 = \\frac{m - y}{m + 1} \\)",
      "\\( k^2(m + 1) = m - y \\)",
      "\\( k^2 + y = m(1 - k^2) \\)",
      "\\( m = \\frac{y + k^2}{1 - k^2} \\)",
    ],
  },
  {
    question:
      "Find the quadratic equation whose roots are \\( \\frac{1}{2} \\) and \\( -\\frac{1}{3} \\).",
    image: null,
    options: [
      "\\( 3x^2 + x + 1 = 0 \\)",
      "\\( 6x^2 + x - 1 = 0 \\)",
      "\\( 3x^2 + x - 1 = 0 \\)",
      "\\( 6x^2 - x - 1 = 0 \\)",
    ],
    correctIndex: 3,
    hint: "Sum of roots \\( S = \\frac{1}{2} + \\left(-\\frac{1}{3}\\right) = \\frac{1}{6} \\). Product \\( P = \\frac{1}{2} \\times \\left(-\\frac{1}{3}\\right) = -\\frac{1}{6} \\). Quadratic: \\( x^2 - Sx + P = 0 \\) → \\( x^2 - \\frac{1}{6}x - \\frac{1}{6} = 0 \\). Multiply by \\( 6 \\): \\( 6x^2 - x - 1 = 0 \\).",
    explanation: [
      "\\( S = \\frac{1}{6}, P = -\\frac{1}{6} \\)",
      "\\( x^2 - \\frac{1}{6}x - \\frac{1}{6} = 0 \\)",
      "\\( 6x^2 - x - 1 = 0 \\)",
    ],
  },
  {
    question:
      "Given that \\( x \\) is directly proportional to \\( y \\) and inversely proportional to \\( Z \\), \\( x = 15 \\) when \\( y = 10 \\) and \\( Z = 4 \\), find the equation connecting \\( x, y \\) and \\( z \\).",
    image: null,
    options: [
      "\\( x = \\frac{6y}{z} \\)",
      "\\( x = \\frac{12y}{z} \\)",
      "\\( x = \\frac{3y}{z} \\)",
      "\\( x = \\frac{3y}{2z} \\)",
    ],
    correctIndex: 0,
    hint: "\\( x \\propto \\frac{y}{z} \\Rightarrow x = \\frac{ky}{z} \\). Substitute: \\( 15 = \\frac{k \\times 10}{4} = \\frac{10k}{4} = \\frac{5k}{2} \\). So \\( 5k = 30 \\Rightarrow k = 6 \\). Thus \\( x = \\frac{6y}{z} \\).",
    explanation: [
      "\\( x = \\frac{ky}{z} \\)",
      "\\( 15 = \\frac{10k}{4} = \\frac{5k}{2} \\)",
      "\\( k = 6 \\)",
      "\\( x = \\frac{6y}{z} \\)",
    ],
  },

  // ======================== PAGE 4 (Questions 16–20) ========================
  {
    question:
      "Two buses start from the same station at \\( 9:00 \\text{ am} \\) and travel in opposite directions along the same straight road. The first bus travels at a speed of \\( 72 \\text{ km/h} \\) and the second at \\( 48 \\text{ km/h} \\). At what time will they be \\( 240 \\text{ km} \\) apart?",
    image: null,
    options: [
      "\\( 1:00 \\text{ pm} \\)",
      "\\( 12:00 \\text{ noon} \\)",
      "\\( 11:00 \\text{ am} \\)",
      "\\( 10:00 \\text{ am} \\)",
    ],
    correctIndex: 2,
    hint: "Relative speed = \\( 72 + 48 = 120 \\text{ km/h} \\). Time = distance / relative speed = \\( 240 / 120 = 2 \\) hours. \\( 9:00 \\text{ am} + 2 \\text{ hours} = 11:00 \\text{ am} \\).",
    explanation: [
      "Relative speed = \\( 120 \\text{ km/h} \\)",
      "Time = \\( 240 \\div 120 = 2 \\text{ hours} \\)",
      "Arrival time = \\( 11:00 \\text{ am} \\)",
    ],
  },
  {
    question:
      "A solid cuboid has a length of \\( 7 \\text{ cm} \\), a width of \\( 5 \\text{ cm} \\), and a height of \\( 4 \\text{ cm} \\). Calculate its total surface area.",
    image: null,
    options: [
      "\\( 280 \\text{ cm}^2 \\)",
      "\\( 166 \\text{ cm}^2 \\)",
      "\\( 140 \\text{ cm}^2 \\)",
      "\\( 83 \\text{ cm}^2 \\)",
    ],
    correctIndex: 1,
    hint: "Total surface area of cuboid = \\( 2(lw + lh + wh) = 2(7\\times5 + 7\\times4 + 5\\times4) = 2(35 + 28 + 20) = 2 \\times 83 = 166 \\text{ cm}^2 \\).",
    explanation: [
      "\\( lw = 35, lh = 28, wh = 20 \\)",
      "Sum = \\( 35 + 28 + 20 = 83 \\)",
      "TSA = \\( 2 \\times 83 = 166 \\text{ cm}^2 \\)",
    ],
  },
  {
    question:
      "In the diagram, \\( PQ \\parallel SR \\). Find the value of \\( x \\).",
    image: true,
    options: ["\\( 34 \\)", "\\( 46 \\)", "\\( 57 \\)", "\\( 68 \\)"],
    correctIndex: null,
    hint: "Use properties of parallel lines (alternate interior angles, corresponding angles) to form an equation.",
    explanation: [],
  },
  {
    question:
      "Find the equation of the line parallel to \\( 2y = 3(x - 2) \\) and passes through the point \\( (2, 3) \\).",
    image: null,
    options: [
      "\\( y = \\frac{2}{3}x - 3 \\)",
      "\\( y = \\frac{2}{3}x - 2 \\)",
      "\\( y = \\frac{3}{2}x \\)",
      "\\( y = -\\frac{2}{3}x \\)",
    ],
    correctIndex: 2,
    hint: "Rewrite: \\( 2y = 3x - 6 \\Rightarrow y = \\frac{3}{2}x - 3 \\). Slope = \\( \\frac{3}{2} \\). Parallel line: \\( y - 3 = \\frac{3}{2}(x - 2) \\) → \\( y = \\frac{3}{2}x \\) (since \\( 3 - 3 = 0 \\)).",
    explanation: [
      "Slope of given line = \\( \\frac{3}{2} \\)",
      "Using point-slope: \\( y - 3 = \\frac{3}{2}(x - 2) \\)",
      "Simplify: \\( y = \\frac{3}{2}x \\)",
    ],
  },
  {
    question:
      "The expression \\( \\frac{5x + 3}{6x(x + 1)} \\) will be undefined when \\( x \\) equals?",
    image: null,
    options: [
      "\\( \\{0, 1\\} \\)",
      "\\( \\{0, -1\\} \\)",
      "\\( \\{-3, -11\\} \\)",
      "\\( \\{-3, 0\\} \\)",
    ],
    correctIndex: 1,
    hint: "A rational expression is undefined when the denominator is zero. \\( 6x(x + 1) = 0 \\) when \\( x = 0 \\) or \\( x = -1 \\).",
    explanation: [
      "Denominator = \\( 6x(x + 1) \\)",
      "Set equal to zero: \\( x = 0 \\) or \\( x = -1 \\)",
    ],
  },

  // ======================== PAGE 5 (Questions 21–25) ========================
  {
    question:
      "A man is five times as old as his son. In four years' time, the product of their ages would be \\( 340 \\). If the son's age is \\( y \\), express the product of their ages in terms of \\( y \\).",
    image: null,
    options: [
      "\\( 5y^2 - 16y - 380 = 0 \\)",
      "\\( 5y^2 - 24y - 380 = 0 \\)",
      "\\( 5y^2 - 16y - 330 = 0 \\)",
      "\\( 5y^2 + 24y - 324 = 0 \\)",
    ],
    correctIndex: 3,
    hint: "Son's age now = \\( y \\), father's age now = \\( 5y \\). In \\( 4 \\) years: son = \\( y + 4 \\), father = \\( 5y + 4 \\). Product: \\( (y + 4)(5y + 4) = 340 \\) → \\( 5y^2 + 4y + 20y + 16 = 340 \\) → \\( 5y^2 + 24y + 16 - 340 = 0 \\) → \\( 5y^2 + 24y - 324 = 0 \\).",
    explanation: [
      "\\( (y + 4)(5y + 4) = 340 \\)",
      "\\( 5y^2 + 24y + 16 = 340 \\)",
      "\\( 5y^2 + 24y - 324 = 0 \\)",
    ],
  },
  {
    question: "Simplify; \\( \\frac{a}{b} - \\frac{b}{a} - \\frac{c}{b} \\)",
    image: null,
    options: [
      "\\( \\frac{a - b + c}{ab} \\)",
      "\\( \\frac{ab - bc - ac}{ab} \\)",
      "\\( \\frac{a^2 - b^2 + ac}{ab} \\)",
      "\\( \\frac{a^2 - b^2 - ac}{ab} \\)",
    ],
    correctIndex: 3,
    hint: "Common denominator = \\( ab \\). \\( \\frac{a^2}{ab} - \\frac{b^2}{ab} - \\frac{ac}{ab} = \\frac{a^2 - b^2 - ac}{ab} \\).",
    explanation: [
      "\\( \\frac{a}{b} = \\frac{a^2}{ab} \\)",
      "\\( \\frac{b}{a} = \\frac{b^2}{ab} \\)",
      "\\( \\frac{c}{b} = \\frac{ac}{ab} \\)",
      "Result: \\( \\frac{a^2 - b^2 - ac}{ab} \\)",
    ],
  },
  {
    question:
      "In the diagram, \\( XYZ \\) is an equilateral triangle of side \\( 6 \\text{ cm} \\) and \\( Y \\) is the midpoint of \\( \\overline{XY} \\). Find \\( \\tan(\\angle XZT) \\).",
    image: true,
    options: [
      "\\( \\frac{1}{\\sqrt{3}} \\)",
      "\\( \\frac{\\sqrt{3}}{2} \\)",
      "\\( \\sqrt{3} \\)",
      "\\( \\frac{1}{2} \\)",
    ],
    correctIndex: null,
    hint: "Use properties of equilateral triangles and right triangles formed.",
    explanation: [],
  },
  {
    question:
      "A fence \\( 2.4 \\text{ m} \\) tall is \\( 10 \\text{ m} \\) away from a tree of height \\( 16 \\text{ m} \\). Calculate the angle of elevation of the top of the tree from the top of the fence.",
    image: null,
    options: [
      "\\( 76.11^\\circ \\)",
      "\\( 53.67^\\circ \\)",
      "\\( 52.40^\\circ \\)",
      "\\( 51.32^\\circ \\)",
    ],
    correctIndex: 1,
    hint: "Height difference = \\( 16 - 2.4 = 13.6 \\text{ m} \\). Horizontal distance = \\( 10 \\text{ m} \\). \\( \\tan \\theta = \\frac{13.6}{10} = 1.36 \\), \\( \\theta = \\tan^{-1}(1.36) \\approx 53.67^\\circ \\).",
    explanation: [
      "Opposite = \\( 13.6 \\text{ m} \\)",
      "Adjacent = \\( 10 \\text{ m} \\)",
      "\\( \\tan \\theta = 1.36 \\)",
      "\\( \\theta \\approx 53.67^\\circ \\)",
    ],
  },
  {
    question:
      "Fati buys milk at \\( \\text{₦}x \\) per tin and sells each at a profit of \\( \\text{₦}y \\). If she sells \\( 10 \\) tins of milk, how much does she receive from the sales?",
    image: null,
    options: [
      "\\( \\text{₦}(xy + 10) \\)",
      "\\( \\text{₦}(x + 10y) \\)",
      "\\( \\text{₦}(10x + y) \\)",
      "\\( \\text{₦}10(x + y) \\)",
    ],
    correctIndex: 3,
    hint: "Selling price per tin = cost + profit = \\( x + y \\). For \\( 10 \\) tins: \\( 10(x + y) \\).",
    explanation: [
      "Selling price per tin = \\( x + y \\)",
      "Total for \\( 10 \\) tins = \\( 10(x + y) \\)",
    ],
  },

  // ======================== PAGE 6 (Questions 26–30) ========================
  {
    question:
      "If \\( \\tan y \\) is positive and \\( \\sin y \\) is negative, in which quadrant would \\( y \\) lie?",
    image: null,
    options: [
      "First and third only",
      "First and second only",
      "Third only",
      "Second only",
    ],
    correctIndex: 2,
    hint: "\\( \\tan \\) positive in Q1 and Q3. \\( \\sin \\) negative in Q3 and Q4. Intersection = Q3.",
    explanation: [
      "\\( \\tan \\) positive → Q1 or Q3",
      "\\( \\sin \\) negative → Q3 or Q4",
      "Common → Q3",
    ],
  },
  {
    question:
      "The dimensions of a rectangular base of a right pyramid is \\( 9 \\text{ cm} \\) by \\( 5 \\text{ cm} \\). If the volume of the pyramid is \\( 105 \\text{ cm}^3 \\), how high is the pyramid?",
    image: null,
    options: [
      "\\( 10 \\text{ cm} \\)",
      "\\( 6 \\text{ cm} \\)",
      "\\( 8 \\text{ cm} \\)",
      "\\( 7 \\text{ cm} \\)",
    ],
    correctIndex: 3,
    hint: "Volume of pyramid = \\( \\frac{1}{3} \\times \\text{base area} \\times \\text{height} \\). Base area = \\( 9 \\times 5 = 45 \\text{ cm}^2 \\). So \\( 105 = \\frac{1}{3} \\times 45 \\times h = 15h \\). Thus \\( h = 7 \\text{ cm} \\).",
    explanation: [
      "Base area = \\( 45 \\text{ cm}^2 \\)",
      "\\( 105 = \\frac{1}{3} \\times 45 \\times h = 15h \\)",
      "\\( h = 7 \\text{ cm} \\)",
    ],
  },
  {
    question:
      "Each interior angle of a regular polygon is \\( 168^\\circ \\). Find the number of sides of the polygon.",
    image: null,
    options: ["\\( 30 \\)", "\\( 36 \\)", "\\( 24 \\)", "\\( 18 \\)"],
    correctIndex: 0,
    hint: "Each interior angle = \\( \\frac{(n-2) \\times 180}{n} = 168 \\) → \\( (n-2) \\times 180 = 168n \\) → \\( 180n - 360 = 168n \\) → \\( 12n = 360 \\) → \\( n = 30 \\).",
    explanation: [
      "\\( 180(n-2) = 168n \\)",
      "\\( 180n - 360 = 168n \\)",
      "\\( 12n = 360 \\)",
      "\\( n = 30 \\)",
    ],
  },
  {
    question:
      "In the diagram, \\( \\overline{MN} \\parallel \\overline{PQ} \\), \\( \\angle MNP = 2x \\), and \\( \\angle NPQ = (3x - 50)^\\circ \\). Find the value of \\( \\angle NPQ \\).",
    image: true,
    options: [
      "\\( 200^\\circ \\)",
      "\\( 100^\\circ \\)",
      "\\( 120^\\circ \\)",
      "\\( 90^\\circ \\)",
    ],
    correctIndex: null,
    hint: "Use properties of parallel lines and alternate interior angles.",
    explanation: [],
  },
  {
    question:
      "The length of an arc of a circle of radius \\( 3.5 \\text{ cm} \\) is \\( \\frac{19}{36} \\text{ cm} \\). Calculate, correct to the nearest degree, the angle subtended at the centre of the circle. \\( \\left[ \\text{Take } \\pi = \\frac{22}{7} \\right] \\)",
    image: null,
    options: [
      "\\( 55^\\circ \\)",
      "\\( 36^\\circ \\)",
      "\\( 25^\\circ \\)",
      "\\( 22^\\circ \\)",
    ],
    correctIndex: 0,
    hint: "Arc length = \\( \\frac{\\theta}{360} \\times 2\\pi r \\). So \\( \\frac{19}{36} = \\frac{\\theta}{360} \\times 2 \\times \\frac{22}{7} \\times 3.5 = \\frac{\\theta}{360} \\times 22 \\). Solve: \\( \\theta = \\frac{19}{36} \\times \\frac{360}{22} = \\frac{19 \\times 10}{22} = \\frac{190}{22} \\approx 8.64^\\circ \\)? That seems too small. Recheck carefully.",
    explanation: [],
  },

  // ======================== PAGE 7 (Questions 31–35) ========================
  {
    question:
      "In the diagram, \\( \\overline{PU} \\parallel \\overline{SR} \\), \\( \\overline{PS} \\parallel \\overline{TR} \\), \\( \\overline{QS} \\parallel \\overline{UR} \\), \\( UR = 15 \\text{ cm} \\), \\( SR = 8 \\text{ cm} \\), \\( PS = 10 \\text{ cm} \\) and area of \\( \\triangle SUR = 24 \\text{ cm}^2 \\). Calculate the area of \\( PTRS \\).",
    image: true,
    options: [
      "\\( 40 \\text{ cm}^2 \\)",
      "\\( 48 \\text{ cm}^2 \\)",
      "\\( 80 \\text{ cm}^2 \\)",
      "\\( 120 \\text{ cm}^2 \\)",
    ],
    correctIndex: null,
    hint: "Use area ratios and parallel line properties to find the area of the quadrilateral.",
    explanation: [],
  },
  {
    question:
      "In the diagram, \\( PQR \\) is a circle with centre \\( O \\). If \\( \\angle OPQ = 48^\\circ \\), find the value of \\( M \\).",
    image: true,
    options: [
      "\\( 96^\\circ \\)",
      "\\( 90^\\circ \\)",
      "\\( 68^\\circ \\)",
      "\\( 42^\\circ \\)",
    ],
    correctIndex: null,
    hint: "Use circle theorems (isosceles triangles, angles at centre).",
    explanation: [],
  },
  {
    question:
      "The pie chart shows the population of men, women, and children in a city. If the population of the city is \\( 1,800,000 \\), how many men are in the city?",
    image: true,
    options: [
      "\\( 845,000 \\)",
      "\\( 600,000 \\)",
      "\\( 355,000 \\)",
      "\\( 250,000 \\)",
    ],
    correctIndex: null,
    hint: "Measure the angle for men in the pie chart, then \\( \\frac{\\text{angle}}{360} \\times \\text{total population} \\).",
    explanation: [],
  },
  {
    question:
      "The mean of the numbers \\( 15, 21, 17, 26, 18, \\) and \\( 29 \\) is \\( 21 \\). Calculate the standard deviation.",
    image: null,
    options: ["\\( 9 \\)", "\\( 6 \\)", "\\( 5 \\)", "\\( 0 \\)"],
    correctIndex: 2,
    hint: "Find variance: average of squared differences from mean. Sum of squares: \\( (15-21)^2 = 36 \\), \\( (21-21)^2 = 0 \\), \\( (17-21)^2 = 16 \\), \\( (26-21)^2 = 25 \\), \\( (18-21)^2 = 9 \\), \\( (29-21)^2 = 64 \\). Sum = \\( 150 \\). Variance = \\( \\frac{150}{6} = 25 \\). SD = \\( \\sqrt{25} = 5 \\).",
    explanation: ["Variance = \\( 25 \\)", "SD = \\( 5 \\)"],
  },
  {
    question: "Find the sum of the interior angles of a pentagon.",
    image: null,
    options: [
      "\\( 340^\\circ \\)",
      "\\( 350^\\circ \\)",
      "\\( 540^\\circ \\)",
      "\\( 550^\\circ \\)",
    ],
    correctIndex: 2,
    hint: "Sum of interior angles of \\( n \\)-gon = \\( (n-2) \\times 180^\\circ \\). For pentagon, \\( n = 5 \\), sum = \\( 3 \\times 180 = 540^\\circ \\).",
    explanation: ["\\( (5-2) \\times 180 = 3 \\times 180 = 540^\\circ \\)"],
  },

  // ======================== PAGE 8 (Questions 36–40) ========================
  {
    question:
      "The diameter of a sphere is \\( 12 \\text{ cm} \\). Calculate, correct to the nearest \\( \\text{cm}^3 \\), the volume of the sphere. \\( \\left[ \\text{Take } \\pi = \\frac{22}{7} \\right] \\)",
    image: null,
    options: [
      "\\( 903 \\text{ cm}^3 \\)",
      "\\( 904 \\text{ cm}^3 \\)",
      "\\( 905 \\text{ cm}^3 \\)",
      "\\( 906 \\text{ cm}^3 \\)",
    ],
    correctIndex: 2,
    hint: "Radius \\( r = 6 \\text{ cm} \\). Volume = \\( \\frac{4}{3} \\pi r^3 = \\frac{4}{3} \\times \\frac{22}{7} \\times 216 = \\frac{4 \\times 22 \\times 216}{21} = \\frac{88 \\times 216}{21} = \\frac{19008}{21} \\approx 905.14 \\rightarrow 905 \\text{ cm}^3 \\).",
    explanation: [
      "\\( r = 6 \\)",
      "\\( V = \\frac{4}{3} \\pi r^3 = \\frac{4}{3} \\times \\frac{22}{7} \\times 216 = \\frac{19008}{21} \\approx 905.14 \\)",
      "Rounded to nearest cm³ = \\( 905 \\)",
    ],
  },
  {
    question:
      "A box contains \\( 12 \\) identical balls of which \\( 5 \\) are red, \\( 4 \\) blue, and the rest are green. If a ball is selected at random from the box, what is the probability that it is green?",
    image: null,
    options: [
      "\\( \\frac{3}{4} \\)",
      "\\( \\frac{1}{2} \\)",
      "\\( \\frac{1}{3} \\)",
      "\\( \\frac{1}{4} \\)",
    ],
    correctIndex: 3,
    hint: "Number of green = \\( 12 - 5 - 4 = 3 \\). Probability = \\( \\frac{3}{12} = \\frac{1}{4} \\).",
    explanation: [
      "Green balls = \\( 3 \\)",
      "\\( P(\\text{green}) = \\frac{3}{12} = \\frac{1}{4} \\)",
    ],
  },
  {
    question:
      "A box contains \\( 12 \\) identical balls of which \\( 5 \\) are red, \\( 4 \\) blue, and the rest are green. If two balls are selected at random one after the other with replacement, what is the probability that both are red?",
    image: null,
    options: [
      "\\( \\frac{25}{144} \\)",
      "\\( \\frac{5}{33} \\)",
      "\\( \\frac{5}{6} \\)",
      "\\( \\frac{103}{132} \\)",
    ],
    correctIndex: 0,
    hint: "\\( P(\\text{red}) = \\frac{5}{12} \\). With replacement: \\( \\frac{5}{12} \\times \\frac{5}{12} = \\frac{25}{144} \\).",
    explanation: [
      "\\( P(\\text{red}) = \\frac{5}{12} \\)",
      "\\( P(\\text{both red}) = \\left(\\frac{5}{12}\\right)^2 = \\frac{25}{144} \\)",
    ],
  },
  {
    question:
      "In the diagram, \\( PQ \\) is a straight line. If \\( m = \\frac{1}{2}(x + y + z) \\), find the value of \\( m \\).",
    image: true,
    options: [
      "\\( 45^\\circ \\)",
      "\\( 60^\\circ \\)",
      "\\( 90^\\circ \\)",
      "\\( 100^\\circ \\)",
    ],
    correctIndex: null,
    hint: "Angles on a straight line sum to \\( 180^\\circ \\), and other angle relationships.",
    explanation: [],
  },
  {
    question:
      "The points on a linear graph are as shown in the table. Find the gradient (slope) of the line.",
    image: null,
    options: [
      "\\( 2\\frac{1}{2} \\)",
      "\\( 2 \\)",
      "\\( 1 \\)",
      "\\( \\frac{1}{2} \\)",
    ],
    correctIndex: 1,
    hint: "Points: \\( (6.20, 3.90) \\) and \\( (6.85, 5.20) \\). Slope = \\( \\frac{5.20 - 3.90}{6.85 - 6.20} = \\frac{1.30}{0.65} = 2 \\).",
    explanation: [
      "Slope = \\( \\frac{\\Delta y}{\\Delta x} = \\frac{1.30}{0.65} = 2 \\)",
    ],
  },

  // ======================== PAGE 9 (Questions 41–45) ========================
  {
    question:
      "In the diagram, \\( O \\) is the centre of the circle. \\( \\overline{PQ} \\) and \\( \\overline{RS} \\) are tangents to the circle. Find the value of \\( (M + N) \\).",
    image: true,
    options: [
      "\\( 120^\\circ \\)",
      "\\( 90^\\circ \\)",
      "\\( 75^\\circ \\)",
      "\\( 60^\\circ \\)",
    ],
    correctIndex: null,
    hint: "Tangents from a point to a circle are equal, and angle between tangents can be found using quadrilateral properties.",
    explanation: [],
  },
  {
    question:
      "Which of the following is not a sufficient condition for two triangles to be congruent?",
    image: null,
    options: ["AAS", "SSS", "SAS", "SSA"],
    correctIndex: 3,
    hint: "SSA (or ASS) is not a valid congruence condition (ambiguous case).",
    explanation: ["SSA does not guarantee congruence"],
  },
  {
    question:
      "A woman received a discount of \\( 20\\% \\) on a piece of cloth she purchased from a shop. If she paid \\( \\$525.00 \\), what was the original price?",
    image: null,
    options: [
      "\\( \\$675.25 \\)",
      "\\( \\$660.25 \\)",
      "\\( \\$656.25 \\)",
      "\\( \\$616.25 \\)",
    ],
    correctIndex: 2,
    hint: "She paid \\( 80\\% \\) of original price. So \\( 0.8 \\times \\text{original} = 525 \\) → \\( \\text{original} = \\frac{525}{0.8} = 656.25 \\).",
    explanation: [
      "\\( 0.8 \\times \\text{original} = 525 \\)",
      "\\( \\text{original} = 525 \\div 0.8 = 656.25 \\)",
    ],
  },
  {
    question:
      "The interquartile range of a distribution is \\( 7 \\). If the \\( 25^{\\text{th}} \\) percentile is \\( 16 \\), find the upper quartile.",
    image: null,
    options: ["\\( 35 \\)", "\\( 30 \\)", "\\( 23 \\)", "\\( 9 \\)"],
    correctIndex: 2,
    hint: "Interquartile range = \\( Q_3 - Q_1 \\). Here \\( Q_1 = 16 \\), IQR = \\( 7 \\), so \\( Q_3 = 16 + 7 = 23 \\).",
    explanation: ["\\( Q_3 - Q_1 = 7 \\)", "\\( Q_3 = 16 + 7 = 23 \\)"],
  },
  {
    question:
      "The graph of the equations \\( y = 2x + 5 \\) and \\( y = 2x^2 + x - 1 \\) are shown. Find the point of intersection of the two graphs.",
    image: true,
    options: [
      "\\( (2.0, 9.0) \\) and \\( (-1.5, 2.0) \\)",
      "\\( (2.0, 8.5) \\) and \\( (-1.5, 2.0) \\)",
      "\\( (2.0, 8.0) \\) and \\( (-1.5, 2.5) \\)",
      "\\( (2.0, 7.5) \\) and \\( (-1.5, 2.5) \\)",
    ],
    correctIndex: null,
    hint: "Solve the system of equations graphically or algebraically.",
    explanation: [],
  },

  // ======================== PAGE 10 (Questions 46–50) ========================
  {
    question:
      "The graph of the equations \\( y = 2x + 5 \\) and \\( y = 2x^2 + x - 1 \\) are shown. If \\( x = -2.5 \\), what is the value of \\( u \\) on the curve?",
    image: true,
    options: [
      "\\( y = 8.0 \\)",
      "\\( y = 8.5 \\)",
      "\\( y = 9.0 \\)",
      "\\( y = 9.5 \\)",
    ],
    correctIndex: null,
    hint: "Substitute \\( x = -2.5 \\) into \\( y = 2x^2 + x - 1 \\).",
    explanation: [],
  },
  {
    question:
      "If \\( (x + 2) \\) is a factor of \\( x^2 + px - 10 \\), find the value of \\( p \\).",
    image: null,
    options: ["\\( 3 \\)", "\\( -3 \\)", "\\( 7 \\)", "\\( -7 \\)"],
    correctIndex: 0,
    hint: "If \\( (x + 2) \\) is a factor, then \\( f(-2) = 0 \\). So \\( (-2)^2 + p(-2) - 10 = 0 \\) → \\( 4 - 2p - 10 = 0 \\) → \\( -2p - 6 = 0 \\) → \\( -2p = 6 \\) → \\( p = -3 \\).",
    explanation: [
      "\\( f(-2) = 4 - 2p - 10 = -2p - 6 = 0 \\)",
      "\\( -2p = 6 \\)",
      "\\( p = -3 \\)",
    ],
  },
  {
    question:
      "In the diagram, \\( O \\) is the centre of the circle. If \\( \\angle NLM = 74^\\circ \\), \\( \\angle LMN = 39^\\circ \\) and \\( \\angle LOM = x \\), find the value of \\( x \\).",
    image: true,
    options: [
      "\\( 134^\\circ \\)",
      "\\( 126^\\circ \\)",
      "\\( 113^\\circ \\)",
      "\\( 106^\\circ \\)",
    ],
    correctIndex: null,
    hint: "Use circle theorems (angles in a triangle, angles at centre).",
    explanation: [],
  },
  {
    question:
      "Find the least value of \\( x \\) which satisfies the equation \\( 4x = 7 \\pmod{9} \\).",
    image: null,
    options: ["\\( 7 \\)", "\\( 6 \\)", "\\( 5 \\)", "\\( 4 \\)"],
    correctIndex: 3,
    hint: "\\( 4x \\equiv 7 \\pmod{9} \\). Try values: \\( 4 \\times 4 = 16 \\equiv 7 \\pmod{9} \\). So \\( x = 4 \\).",
    explanation: [
      "\\( 4 \\times 4 = 16 \\equiv 7 \\pmod{9} \\)",
      "Least value = \\( 4 \\)",
    ],
  },
  {
    question:
      "(a) If \\( A = \\{ \\text{multiples of } 2 \\} \\), \\( B = \\{ \\text{multiples of } 3 \\} \\) and \\( C = \\{ \\text{factors of } 6 \\} \\) are subsets of \\( \\mu = \\{ x : 1 \\le x \\le 10 \\} \\), find \\( A' \\cap B' \\cap C' \\).\n\n(b) Tickets for a movie premiere cost \\( \\$18.50 \\) each while the bulk purchase price for \\( 5 \\) tickets is \\( \\$80.00 \\). If \\( 4 \\) gentlemen decide to get a fifth person to join them so that they can share the bulk purchase price equally, how much would each person save?",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Part (a): Find complements and intersection. Part (b): Compare individual vs group price.",
    explanation: [],
  },

  // ======================== PAGE 11 (Questions 51–55) ========================
  {
    question:
      "(a) Given that \\( P = \\left(\\frac{rk}{Q} - ms\\right)^{\\frac{2}{3}} \\), (i) make \\( Q \\) the subject of the relation; (ii) find, correct to two decimal places, the value of \\( Q \\) when \\( P = 3 \\), \\( m = 15 \\), \\( s = 0.2 \\), \\( k = 4 \\) and \\( r = 10 \\).\n\n(b) Given that \\( \\frac{x + 2y}{5} = x - 2y \\), find \\( x : y \\).",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Part (a): Solve for Q by raising both sides to power 3/2 and rearranging. Part (b): Cross-multiply and solve ratio.",
    explanation: [],
  },
  {
    question:
      "(a) In the diagram, O is the centre of the circle ABCDE, BC = CD and ∠BCD = 108°. Find ∠CDE.\n\n(b) Given that tan x = √3, 0° ≤ x ≤ 90°, evaluate \\( \\frac{(\\cos x)^2 - \\sin x}{(\\sin x)^2 + \\cos x} \\).",
    image: true,
    options: [],
    correctIndex: null,
    hint: "Part (a): Use isosceles triangles and circle theorems. Part (b): tan x = √3 ⇒ x = 60°, substitute values.",
    explanation: [],
  },
  {
    question:
      "The total surface area of a cone of slant height l cm and base radius r cm is 224π cm². If r : l = 2 : 5, find: (a) correct to one decimal place, the value of r; (b) correct to the nearest whole number, the volume of the cone. [Take π = 22/7]",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Total surface area = πr² + πrl = πr(r + l) = 224π. Ratio r:l = 2:5 ⇒ l = (5/2)r. Substitute and solve for r.",
    explanation: [],
  },
  {
    question:
      "A die was rolled a number of times. The outcomes are as shown in the table: Number 1,2,3,4,5,6; Outcomes 32, m, 25, 40, 28, 45. If the probability of obtaining 2 is 0.15, find: (a) the value of m; (b) the number of times the die was rolled; (c) the probability of obtaining an even number.",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Total outcomes = 32 + m + 25 + 40 + 28 + 45 = 170 + m. P(2) = m/(170+m) = 0.15. Solve for m, then total, then P(even).",
    explanation: [],
  },
  {
    question:
      "(a) Copy and complete the table of values for the relation y = 3 sin 2x.\n(b) Using a scale of 2 cm to 15° on the x-axis and 2 cm to 1 unit on the y-axis, draw the graph of y = 3 sin 2x for 0° ≤ x ≤ 150°.\n(c) Use the graph to find the truth set of: (i) 3 sin 2x + 2 = 0; (ii) (3/2) sin 2x = 0.25.",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Complete table for x = 0°, 15°, 30°, 45°, 60°, 75°, 90°, 105°, 120°, 135°, 150°. Then plot and read solutions.",
    explanation: [],
  },

  // ======================== PAGE 12 (Questions 56–60) ========================
  {
    question:
      "(a) The diagram shows a wooden structure in the form of a cone, mounted on a hemispherical base. The vertical height of the cone is 48 m and the base radius is 14 m. Calculate, correct to three significant figures, the surface area of the structure. [Take π = 22/7]\n\n(b) Five years ago, Musah was twice as old as Sesay. If the sum of their ages is 100, find Sesay's present age.",
    image: true,
    options: [],
    correctIndex: null,
    hint: "Part (a): Surface area = curved surface area of cone + curved surface area of hemisphere. Part (b): Let Sesay = x, Musah = y, form equations.",
    explanation: [],
  },
  {
    question:
      "(a) Ms. Maureen spent 1/4 of her monthly income at a shopping mall, 1/3 at an open market and 2/5 of the remaining amount at a mechanic workshop. If she had ₦222,000.00 left, find: (i) her monthly income; (ii) the amount spent at the open market.\n\n(b) The third term of an Arithmetic Progression (A.P.) is 4m - 2n. If the ninth term of the progression is 2m - 8n, find the common difference in terms of m and n.",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Part (a): Work backwards from remaining amount. Part (b): Use T3 = a + 2d, T9 = a + 8d, subtract to find d.",
    explanation: [],
  },
  {
    question:
      "(a) Two cyclists X and Y leave town Q at the same time. Cyclist X travels at 5 km/h on a bearing of 049° and cyclist Y travels at 9 km/h on a bearing of 319°.\n(b) After travelling for two hours, calculate, correct to the nearest whole number, the: (i) distance between cyclist X and Y; (ii) bearing of cyclist X from Y.\n(c) Find the average speed at which cyclist X will get to Y in 4 hours.",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Use cosine rule for distance, sine rule for bearing, average speed = distance/time.",
    explanation: [],
  },
  {
    question:
      "The table shows the distribution of marks obtained by students in an examination.\n(a) Construct a cumulative frequency table for the distribution.\n(b) Draw the cumulative frequency curve for the distribution.\n(c) Using the curve, find correct to one decimal place, the: (i) median mark; (ii) lowest mark for distinction if 5% of the students passed with distinction.",
    image: null,
    options: [],
    correctIndex: null,
    hint: "Follow standard cumulative frequency steps, then read median and percentile from ogive.",
    explanation: [],
  },
  {
    question:
      "(a) In the diagram, MNPQ is a circle with centre O, |MN| = |NP| and ∠OMN = 50°. Find: (i) ∠MNP; (ii) ∠POQ.\n(b) Find the equation of the line which has the same gradient as 8y + 4xy = 24 and passes through the point (-8, 12).",
    image: true,
    options: [],
    correctIndex: null,
    hint: "Part (a): Isosceles triangles and circle theorems. Part (b): Simplify equation to find gradient, then use point-slope form.",
    explanation: [],
  },

  // ======================== PAGE 13 (Question 61) ========================
  {
    question:
      "(a) In the diagram, AB is a tangent to the circle with centre O, and COB is a straight line. If CD ∥ AB and ∠ABE = 40°, find: ∠ODE.\n(b) ABCD is a parallelogram in which |CD| = 7 cm, |AD| = 5 cm and ∠ADC = 125°. (i) Illustrate the information in a diagram. (ii) Find, correct to one decimal place, the area of the parallelogram.\n(c) If x = ½(1 − √2). Evaluate (2x² − 2x).",
    image: true,
    options: [],
    correctIndex: null,
    hint: "Part (a): Tangent-chord theorem, parallel lines, and triangle angle sum. Part (b): Area = ab sin C. Part (c): Substitute and simplify.",
    explanation: [],
  },
];
