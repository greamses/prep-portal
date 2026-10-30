/* ═══════════════════════════════════════════════════════════════════════════
   THE RULE BOOK

   Every rule the engine knows, written the way a textbook states it, sitting
   in the formula book beside the formulas. A rule is not a new move: it NAMES
   moves the engine already makes. Pick some terms (or nothing, for the whole
   line), tap a rule, and the engine looks for that rule among the moves on
   offer there — so a rule that does not fit is refused, never forced.

   `keys` are the move keys in ops.js the rule covers; `match`, when there is
   one, narrows them by what the move says it did (its label and note), which
   is how "the power rule" is told apart from "the chain rule" when both are
   a step of differentiating.
   ═══════════════════════════════════════════════════════════════════════════ */

const r = (id, name, says, keys, match = null) => ({ id, name, eq: says, keys, match, rule: true, letters: {} });

export const RULE_GROUPS = [
  {
    group: "Rules: equations",
    items: [
      r("r-balance-add", "Add or take the same from both sides", "a = b, so a + c = b + c", ["across"]),
      r("r-balance-times", "Multiply or divide both sides", "a = b, so ka = kb", ["divide", "times"]),
      r("r-flip", "Change every sign", "−a = −b, so a = b", ["flip"]),
      r("r-swap", "Turn the equation round", "a = b, so b = a", ["swap"]),
      r("r-root", "Square root of both sides", "x^2 = k, so x = ±√k", ["root"]),
      r("r-pm", "Split ± into two answers", "x = a ± b", ["branches"]),
    ],
  },
  {
    group: "Rules: tidying",
    items: [
      r("r-like", "Collect like terms", "3x + 5x = 8x", ["combine"]),
      r("r-arith", "Work out the numbers", "2·5 + 3 = 13", ["workout", "multiply"]),
      r("r-expand", "Open the brackets", "a(b + c) = ab + ac", ["expand"]),
      r("r-factor", "Take out a common factor", "ab + ac = a(b + c)", ["factor"]),
      r("r-factor-surd", "Take out a common surd", "a√2 + b√2 = √2(a + b)", ["factor"], /√/),
      r("r-foil", "Brackets times brackets", "(a + b)(c + d) = ac + ad + bc + bd", ["expand"], /every term times every term|is \(/i),
      r("r-zero", "Rub out a zero", "a + 0 = a", ["dropzero"]),
      r("r-reorder", "Write the terms the other way round", "a + b = b + a", ["reorder"]),
      r("r-square", "Complete the square", "x^2 + px = (x + p/2)^2 − (p/2)^2", ["square"], /complete/i),
    ],
  },
  {
    group: "Rules: quadratics",
    items: [
      r("r-q-split", "Split the middle term", "ax^2 + bx + c = ax^2 + px + qx + c", ["quadsplit"]),
      r("r-q-pair", "The two numbers: product ac, sum b", "pq = ac, so p + q = b", ["quadsplit"]),
      r("r-q-group", "Factorise in pairs, then the common bracket", "a(x + p) + b(x + p) = (x + p)(a + b)", ["factor"]),
      r("r-q-factor", "Factorise a quadratic", "x^2 + 5x + 6 = (x + 2)(x + 3)", ["quadfactor"]),
      r("r-q-diff", "The difference of two squares", "x^2 − a^2 = (x − a)(x + a)", ["quadfactor"]),
      r("r-q-perfect", "A perfect square", "x^2 + 2px + p^2 = (x + p)^2", ["square"], /perfect square/i),
      r("r-q-complete", "Complete the square", "x^2 + px = (x + p/2)^2 − (p/2)^2", ["square"], /complete/i),
      r("r-q-psl", "Po-Shen Loh", "x^2 + bx + c = 0, so x = −b/2 ± u", ["poshenloh"]),
      r("r-q-pslu", "Po-Shen Loh's u", "(b/2)^2 − u^2 = c, so u^2 = b^2/4 − c", ["poshenloh"]),
      r("r-q-roots", "Square root of both sides", "(x + p)^2 = k, so x + p = ±√k", ["root"]),
    ],
  },
  {
    group: "Rules: matrices",
    items: [
      r("r-m-add", "Add matrices: entry by entry", "[[a,b],[c,d]] + [[e,f],[g,h]] = [[a + e, b + f],[c + g, d + h]]", ["matadd"]),
      r("r-m-scale", "A number times a matrix", "k[[a,b],[c,d]] = [[ka, kb],[kc, kd]]", ["matscale"]),
      r("r-m-mul", "Multiply matrices: row by column", "[[a,b],[c,d]][[e,f],[g,h]] = [[ae + bg, af + bh],[ce + dg, cf + dh]]", ["matmul"]),
      r("r-m-pow", "A power of a matrix", "A^2 = A·A", ["matpow"]),
      r("r-m-det", "The determinant", "det[[a,b],[c,d]] = ad − bc", ["det"]),
      r("r-m-trans", "Transpose: rows become columns", "[[a,b],[c,d]]^T = [[a,c],[b,d]]", ["transpose"]),
      r("r-m-inv", "The inverse of a matrix", "[[a,b],[c,d]]^(-1) = 1/(ad − bc)[[d,−b],[−c,a]]", ["inverse"]),
    ],
  },
  {
    group: "Rules: picking several",
    items: [
      r("r-swap", "Swap two terms", "3x + 5 = 5 + 3x", ["swapterms"]),
      r("r-group-like", "Put like terms together", "x^2 + 3 + 5x + 2x = x^2 + 5x + 2x + 3", ["grouplike"]),
      r("r-swap-factors", "Swap two factors", "3·x = x·3", ["swapfactors"]),
      r("r-diff-picked", "Differentiate the picked terms", "d/dx(x^2 + 3x)", ["diffpicked"]),
      r("r-int-picked", "Integrate the picked terms", "∫(x^2 + 3x)dx", ["intpicked"]),
    ],
  },
  {
    group: "Rules: inequalities",
    items: [
      r("r-ineq-across", "Move a term across an inequality", "x + 3 < 7  →  x < 7 − 3", ["across"]),
      r("r-ineq-divide", "Divide both sides by a positive number", "2x < 6  →  x < 3", ["divide"]),
      r("r-ineq-negative", "Multiply or divide by a negative number: the sign turns round", "−2x < 6  →  x > −3", ["divide", "times", "flip"]),
      r("r-ineq-swap", "Read it the other way round", "5 < x  →  x > 5", ["swap"]),
      r("r-ineq-chain", "A compound inequality: do the same to all three parts", "−3 < 2x + 1 ≤ 7  →  −4 < 2x ≤ 6", ["across", "divide", "times"]),
      r("r-ineq-quad", "A quadratic inequality: test the stretches", "x² − 5x + 6 < 0  →  2 < x < 3", ["signchart"]),
      r("r-ineq-rational", "A rational inequality: test the stretches", "(x − 1)/(x + 2) ≥ 0  →  x < −2 or x ≥ 1", ["signchart"]),
      r("r-ineq-exp", "An exponential inequality: take the log (a base below 1 turns the sign)", "2^x > 8  →  x > 3", ["explog"]),
      r("r-ineq-log", "A logarithmic inequality: undo the log, keep what is inside positive", "log_2(x) < 3  →  0 < x < 8", ["explog"]),
      r("r-abs-equal", "An absolute value equation: two answers", "|x − 3| = 5  →  x − 3 = 5 or x − 3 = −5", ["abssplit"]),
      r("r-abs-less", "Absolute value less than a number: between its opposite and it", "|x − 3| < 5  →  −5 < x − 3 < 5", ["abssplit"]),
      r("r-abs-greater", "Absolute value greater than a number: outside, two ranges", "|x| > 4  →  x < −4 or x > 4", ["abssplit"]),
      r("r-abs-out", "A number multiplying inside the bars comes out", "|3x| = 3|x|", ["absout"]),
    ],
  },
  {
    group: "Rules: roots and towers",
    items: [
      r("r-nroot-take", "Take whole powers out of a root", "∛54 = 3·∛2", ["surd"]),
      r("r-nroot-power", "A root is a power", "root_3(x) = x^(1/3)", ["rootpower"]),
      r("r-nroot-swap", "Undo a power with a root", "x^3 = 8 means x = root_3(8)", ["rootswap"]),
      r("r-tet", "A power tower", "3^^3 = 3^(3^3)", ["tetexpand"]),
    ],
  },
  {
    group: "Rules: logarithms",
    items: [
      r("r-log-own", "A power of the base", "log_b(b^n) = n", ["logown"]),
      r("r-log-law", "Products, quotients and powers", "log_b(xy) = log_b x + log_b y", ["loglaw"]),
      r("r-log-change", "Change of base", "log_b x = ln x / ln b", ["logchange"]),
      r("r-log-swap", "A log is a power the other way round", "log_2 x = 3 means x = 2^3", ["logswap"]),
    ],
  },
  {
    group: "Rules: counting",
    items: [
      r("r-sigma", "Σ: write out the terms", "Σ_(i=1)^(3)(2i + 1) = (2·1 + 1) + (2·2 + 1) + (2·3 + 1)", ["sigma"]),
      r("r-mean", "The mean of a list", "mean({a, b, c}) = (a + b + c)/3", ["mean"]),
      r("r-median", "The median: put them in order first", "median({3, 1, 2}) = median({1, 2, 3})", ["sortlist"]),
      r("r-fact", "A factorial", "5! = 5 × 4 × 3 × 2 × 1", ["factorial"]),
      r("r-perm", "Arrangements: nPr", "nPr(n,r) = n!/(n − r)!", ["choose"]),
      r("r-comb", "Choices: nCr", "nCr(n,r) = n!/(r!(n − r)!)", ["choose"]),
    ],
  },
  {
    group: "Rules: fractions",
    items: [
      r("r-cancel", "Cancel it down", "ka/(kb) = a/b", ["cancel"]),
      r("r-base-expand", "Expand a number in base ten", "1011_2 = 1·2^3 + 0·2^2 + 1·2^1 + 1·2^0", ["expandbase"]),
      r("r-base-ten", "Write a number in base ten", "1011_2 = 11", ["base10"]),
      r("r-powers-first", "Powers before products", "3·y^1 + 5·y^0 = 3·y + 5·1", ["resolvepowers"]),
      r("r-base-letter", "A base that is a letter", "35_y = 3·y^1 + 5·y^0", ["expandletter"]),
      r("r-base-to", "Write a number in another base", "25_10 = 11001_2", ["tobase"]),
      r("r-tofrac", "A decimal or percentage as a fraction", "0.75 = 75/100, 75% = 75/100", ["tofraction"]),
      r("r-todec", "A fraction or percentage as a decimal", "3/4 = 0.75, 75% = 0.75", ["todecimal"]),
      r("r-topct", "A fraction or decimal as a percentage", "3/4 = 75%, 0.75 = 75%", ["topct"]),
      r("r-improper", "Mixed number to improper fraction", "2 1/3 = (2·3 + 1)/3", ["improper"]),
      r("r-tomixed", "Improper fraction to mixed number", "7/3 = 2 1/3", ["tomixed"]),
      r("r-split", "Split a fraction over its bottom", "(a + b)/c = a/c + b/c", ["split"]),
      r("r-addlike", "Add fractions with the same bottom", "a/c + b/c = (a + b)/c", ["addfrac"], /same bottom/i),
      r("r-addunlike", "Make the bottoms the same", "a/b + c/d = ad/(bd) + bc/(bd)", ["addfrac"], /bottoms the same/i),
    ],
  },
  {
    group: "Rules: indices",
    items: [
      r("r-ind-mul", "Multiplying: add the powers", "a^m·a^n = a^(m + n)", ["indices"], /add the powers/i),
      r("r-ind-div", "Dividing: take the powers away", "a^m/a^n = a^(m − n)", ["indices"], /take the powers away/i),
      r("r-ind-pow", "A power of a power", "(a^m)^n = a^(mn)", ["indices"], /power of a power/i),
      r("r-ind-zero", "The power 0", "a^0 = 1", ["indices"], /power 0/i),
      r("r-ind-neg", "A negative power", "a^(−n) = 1/a^n", ["indices"], /negative power/i),
      r("r-ind-prod", "A power of a product or a fraction", "(ab)^n = a^nb^n", ["indices"], /power of a (product|fraction)/i),
    ],
  },
  {
    group: "Rules: surds",
    items: [
      r("r-surd-simplify", "Take out the square factor", "√(a^2b) = a√b", ["surd"], /simplify the surd/i),
      r("r-surd-mul", "Multiply roots", "√a·√b = √(ab)", ["surd"], /roots multiply|multiply the roots/i),
      r("r-surd-div", "Divide roots", "√a/√b = √(a/b)", ["surd"], /roots divide|divide the roots/i),
      r("r-surd-frac", "The root of a fraction", "√(a/b) = √a/√b", ["surd"], /root of a fraction|root the top/i),
      r("r-surd-rat", "Rationalise the bottom", "a/√b = a√b/b", ["surd"], /clear the root|top and bottom by/i),
    ],
  },
  {
    group: "Rules: trigonometry",
    items: [
      r("r-trig-exact", "Exact values from the special triangles", "sin(30°) = 1/2", ["trig"]),
      r("r-trig-pyth", "sin² + cos² = 1", "sin(x)^2 + cos(x)^2 = 1", ["pyth"]),
      r("r-trig-tan", "tan is sin over cos", "tan(x) = sin(x)/cos(x)", ["trigid"]),
      r("r-trig-inv", "Undo sin, cos or tan on both sides", "sin(x) = k, so x = arcsin(k)", ["invert"]),
      r("r-trig-all", "Every angle from 0° to 360°", "sin(x°) = 1/2, so x = 30 or 150", ["angles"]),
      r("r-trig-deg", "Drop the degree signs", "x° = 30°, so x = 30", ["degrees"]),
    ],
  },
  {
    group: "Rules: differentiation",
    items: [
      r("r-d-const", "A constant has slope 0", "d/dx(c) = 0", ["diff"], /constant is 0/i),
      r("r-d-x", "The slope of x is 1", "d/dx(x) = 1", ["diff"], /slope of [a-z] is 1/i),
      r("r-d-sum", "Term by term", "d/dx(u + v) = d/dx(u) + d/dx(v)", ["diff"], /term by term/i),
      r("r-d-mult", "A number in front waits outside", "d/dx(ku) = k·d/dx(u)", ["diff"], /waits outside/i),
      r("r-d-power", "The power rule", "d/dx(x^n) = nx^(n − 1)", ["diff"], /power rule/i),
      r("r-d-chain", "The chain rule", "d/dx(f(u)) = f'(u)·d/dx(u)", ["diff"], /chain rule/i),
      r("r-d-product", "The product rule", "d/dx(uv) = u·d/dx(v) + v·d/dx(u)", ["diff"], /product rule/i),
      r("r-d-quotient", "The quotient rule", "d/dx(u/v) = (v·d/dx(u) − u·d/dx(v))/v^2", ["diff"], /quotient rule/i),
      r("r-d-sin", "The slope of sin", "d/dx(sin(x)) = cos(x)", ["diff"], /slope of sin/i),
      r("r-d-cos", "The slope of cos", "d/dx(cos(x)) = −sin(x)", ["diff"], /slope of cos/i),
      r("r-d-tan", "The slope of tan", "d/dx(tan(x)) = 1/cos(x)^2", ["diff"], /slope of tan/i),
      r("r-d-exp", "eˣ is its own slope", "d/dx(e^x) = e^x", ["diff"], /eˣ is its own|eᵘ times/i),
      r("r-d-ln", "The slope of ln", "d/dx(ln(x)) = 1/x", ["diff"], /ln u|log u/i),
      r("r-d-new", "Differentiate an expression", "d/dx(f(x))", ["differentiate"]),
    ],
  },
  {
    group: "Rules: integration",
    items: [
      r("r-i-sum", "Term by term", "∫(u + v)dx = ∫(u)dx + ∫(v)dx", ["integrate"], /term by term/i),
      r("r-i-mult", "A number in front waits outside", "∫(ku)dx = k∫(u)dx", ["integrate"], /waits outside/i),
      r("r-i-const", "A constant", "∫(k)dx = kx + C", ["integrate"], /constant integrates|integrates to x²/i),
      r("r-i-power", "The power rule backwards", "∫(x^n)dx = x^(n + 1)/(n + 1) + C", ["integrate"], /power rule backwards|to the power ½|to the −n/i),
      r("r-i-recip", "One over x", "∫(1/x)dx = ln(x) + C", ["integrate"], /ln x/i),
      r("r-i-exp", "e to the x", "∫(e^x)dx = e^x + C", ["integrate"], /eᵘ integrates/i),
      r("r-i-trig", "sin and cos", "∫(cos(x))dx = sin(x) + C", ["integrate"], /integrates to (−cos|sin)/i),
      r("r-i-def", "Put the limits in", "∫_a^b(f)dx = F(b) − F(a)", ["integrate"], /top limit/i),
      r("r-i-sub", "Substitution", "∫(f(u)·du/dx)dx = ∫(f(u))du", ["usub"]),
      r("r-i-parts", "By parts", "∫(u·dv/dx)dx = uv − ∫(v·du/dx)dx", ["parts"]),
      r("r-i-new", "Integrate an expression", "∫(f(x))dx", ["integrateit"]),
    ],
  },
  {
    group: "Rules: limits",
    items: [
      r("r-lim", "Let h go to its value", "lim(h->0)(2x + h) = 2x", ["limit"]),
    ],
  },
];

/** Does an offer (with what it would do) belong to this rule? */
export function ruleFits(rule, offer, result) {
  if (!rule.keys.includes(offer.key)) return false;
  if (!rule.match) return true;
  return rule.match.test(`${offer.label || ""} ${result?.note || ""}`);
}
