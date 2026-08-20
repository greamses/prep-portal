/* ============================================================================
   Writing mathematics the way a word processor takes it
   ----------------------------------------------------------------------------
   TeX is what MathJax sets and what this site stores, but TeX is not what a
   learner types. Nobody working out a fraction writes \frac{1}{2}; they write
   1/2, the way they would say it. This turns the one into the other:

       1/2                 →  \frac{1}{2}
       (a + b)/2           →  \frac{a+b}{2}
       x^(2n + 1)          →  x^{2n+1}
       sqrt(b^2 - 4ac)     →  \sqrt{b^{2}-4ac}
       sum_(i=1)^n i^2     →  \sum_{i=1}^{n} i^{2}
       theta <= pi/2       →  \theta \le \frac{\pi}{2}

   ── the two rules that decide everything ─────────────────────────────────
   1. A BRACKET IS A PARCEL. `(…)` after a `/`, a `^`, a `_` or a root is the
      whole of that operand and its brackets are not drawn — which is the one
      thing a learner needs in order to write an index that is more than a
      single character. Anywhere else brackets are drawn, because there they
      are the brackets of the sum.

   2. A `/` TAKES EVERYTHING SINCE THE LAST OPERATOR. `2x/3` is 2x over 3, not
      2 times x-over-3; `1 + x/2` is one plus x-over-two, because the `+` ended
      the run. Word takes only the atom before the slash and makes `2x/3` mean
      2·(x/3), which is right by its own logic and wrong by everybody else's.
      This is the one place we knowingly part company with it.

   ── raw TeX still works ───────────────────────────────────────────────────
   Anything beginning with a backslash is passed through untouched, arguments
   and all, so \frac{1}{2} and \begin{matrix}… go in exactly as written. That
   matters for two reasons: everything already stored on a note is TeX, and it
   has to keep meaning what it meant; and the translation must be safe to run
   over its OWN output, which is what makes re-opening an equation possible.

   Nothing here touches the DOM. It is a string in and a string out, so it can
   be tested on its own — and is, because a wrong bracket here is a wrong
   formula on a child's screen.
   ========================================================================== */

/* ── the words a learner may type ─────────────────────────────────────────── */

/** Letters that are a Greek letter rather than a run of variables. */
const GREEK = [
  "alpha", "beta", "gamma", "delta", "epsilon", "varepsilon", "zeta", "eta",
  "theta", "vartheta", "iota", "kappa", "lambda", "mu", "nu", "xi", "pi",
  "rho", "sigma", "tau", "upsilon", "phi", "varphi", "chi", "psi", "omega",
  "Gamma", "Delta", "Theta", "Lambda", "Xi", "Pi", "Sigma", "Upsilon", "Phi",
  "Psi", "Omega",
];

/** Functions, which are set upright and not as a run of italic variables. */
const FUNCS = [
  "sin", "cos", "tan", "sec", "csc", "cot",
  "sinh", "cosh", "tanh", "coth",
  "arcsin", "arccos", "arctan", "log", "ln", "lg", "exp",
  "min", "max", "gcd", "det", "dim", "deg", "arg", "hom", "ker",
];

/** The tall ones, which carry their limits under and over rather than beside. */
const BIG = {
  sum: "\\sum", prod: "\\prod", coprod: "\\coprod",
  int: "\\int", iint: "\\iint", iiint: "\\iiint", oint: "\\oint",
  lim: "\\lim", limsup: "\\limsup", liminf: "\\liminf",
  bigcup: "\\bigcup", bigcap: "\\bigcap",
};

/** Words that are simply a sign. */
const WORDS = {
  infty: "\\infty", inf: "\\infty", infinity: "\\infty",
  times: "\\times", div: "\\div", cdot: "\\cdot",
  pm: "\\pm", mp: "\\mp",
  le: "\\le", ge: "\\ge", ne: "\\ne", neq: "\\ne",
  approx: "\\approx", equiv: "\\equiv", propto: "\\propto", sim: "\\sim",
  to: "\\to", implies: "\\Rightarrow", iff: "\\Leftrightarrow",
  in: "\\in", notin: "\\notin", subset: "\\subset", subseteq: "\\subseteq",
  cup: "\\cup", cap: "\\cap", emptyset: "\\varnothing",
  forall: "\\forall", exists: "\\exists", nabla: "\\nabla", partial: "\\partial",
  therefore: "\\therefore", because: "\\because",
  perp: "\\perp", parallel: "\\parallel", angle: "\\angle",
  triangle: "\\triangle", square: "\\square", circ: "\\circ",
  deg: "^{\\circ}", degree: "^{\\circ}", degrees: "^{\\circ}",
  dots: "\\dots", cdots: "\\cdots", ldots: "\\dots", vdots: "\\vdots",
  prime: "'", quad: "\\quad",
};

/** One argument in, one dressed thing out. */
const ONE_ARG = {
  sqrt: (a) => `\\sqrt{${a}}`,
  cbrt: (a) => `\\sqrt[3]{${a}}`,
  abs: (a) => `\\left|${a}\\right|`,
  norm: (a) => `\\left\\|${a}\\right\\|`,
  floor: (a) => `\\left\\lfloor ${a}\\right\\rfloor`,
  ceil: (a) => `\\left\\lceil ${a}\\right\\rceil`,
  bar: (a) => `\\overline{${a}}`,
  overline: (a) => `\\overline{${a}}`,
  underline: (a) => `\\underline{${a}}`,
  vec: (a) => `\\vec{${a}}`,
  hat: (a) => `\\hat{${a}}`,
  tilde: (a) => `\\tilde{${a}}`,
  dot: (a) => `\\dot{${a}}`,
  ddot: (a) => `\\ddot{${a}}`,
  bold: (a) => `\\mathbf{${a}}`,
  bb: (a) => `\\mathbb{${a}}`,
};

/** Two arguments in — `root(3)(x)` is the cube root of x. */
const TWO_ARG = {
  root: (n, a) => `\\sqrt[${n}]{${a}}`,
  frac: (n, d) => `\\frac{${n}}{${d}}`,
  binom: (n, k) => `\\binom{${n}}{${k}}`,
  log_: (b, a) => `\\log_{${b}}${a}`,
};

/** A grid of cells: rows split on `;`, cells on `,`. */
const GRIDS = {
  matrix: "matrix", pmatrix: "pmatrix", bmatrix: "bmatrix",
  vmatrix: "vmatrix", cases: "cases", array: "matrix",
};

/** Words a learner might paste in already as a sign. */
const UNICODE = {
  "×": "\\times", "÷": "\\div", "·": "\\cdot", "−": "-",
  "≤": "\\le", "≥": "\\ge", "≠": "\\ne", "≈": "\\approx", "≡": "\\equiv",
  "±": "\\pm", "∓": "\\mp", "∞": "\\infty", "√": "\\surd",
  "→": "\\to", "⇒": "\\Rightarrow", "⇔": "\\Leftrightarrow",
  "∈": "\\in", "∉": "\\notin", "⊂": "\\subset", "∪": "\\cup", "∩": "\\cap",
  "∑": "\\sum", "∏": "\\prod", "∫": "\\int", "∂": "\\partial", "∇": "\\nabla",
  "°": "^{\\circ}", "∠": "\\angle", "∴": "\\therefore", "∵": "\\because",
  "⊥": "\\perp", "∥": "\\parallel", "…": "\\dots", "′": "'",
  "α": "\\alpha", "β": "\\beta", "γ": "\\gamma", "δ": "\\delta",
  "ε": "\\epsilon", "θ": "\\theta", "λ": "\\lambda", "μ": "\\mu",
  "π": "\\pi", "ρ": "\\rho", "σ": "\\sigma", "τ": "\\tau", "φ": "\\phi",
  "ω": "\\omega", "Δ": "\\Delta", "Σ": "\\Sigma", "Ω": "\\Omega", "Θ": "\\Theta",
};

/** Two and three characters that are one sign. Longest first — order matters. */
const PUNCT = [
  ["<->", "\\leftrightarrow"], ["...", "\\dots"],
  ["<=", "\\le"], [">=", "\\ge"], ["!=", "\\ne"], ["~=", "\\approx"],
  ["==", "="], ["=>", "\\Rightarrow"], ["->", "\\to"], ["+-", "\\pm"],
  ["-+", "\\mp"], ["**", "\\cdot"], ["xx", "\\times"],
];

/* Characters TeX would read as instructions rather than as themselves. */
const ESCAPE = { "%": "\\%", "&": "\\&", "#": "\\#", "$": "\\$" };

/* What ends a run: after one of these, a `/` starts its numerator afresh. */
const BREAKS = new Set(["+", "-", "=", "<", ">", ",", ";", ":", "~"]);

const isDigit = (c) => c >= "0" && c <= "9";
const isAlpha = (c) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
const isSpace = (c) => c === " " || c === "\t" || c === "\n";

/* ── the reader ───────────────────────────────────────────────────────────── */

/**
 * Turn what somebody typed into TeX.
 *
 * @param {string} src  linear mathematics, TeX, or any mixture of the two
 * @returns {string} TeX, ready for MathJax
 */
export function toTeX(src) {
  const s = String(src == null ? "" : src);
  if (!s.trim()) return "";
  try {
    const { tex } = readRun(s, 0, null);
    return tidy(tex.replace(/\s+/g, " ")).trim();
  } catch {
    /* A half-typed formula is the normal case, not an error — somebody is in
       the middle of writing it. Give back what they typed and let MathJax say
       what it makes of it; the note is never blank either way. */
    return s;
  }
}

/**
 * Read a run of mathematics, up to `close` or up to the end.
 *
 * `chunk` is everything written since the last +, −, = and so on: it is what a
 * `/` takes upstairs, and it is tipped into `out` the moment an operator
 * arrives. Every piece carries a `bare` beside its `tex` — itself without its
 * outer brackets — because `(a+b)/2` wants a+b on top and not (a+b).
 *
 * In `denominator` mode it stops where a numerator would have started, which
 * is what makes `x/2 + 1` one-half-of-x plus one rather than x over two-plus-
 * one. It stops at a further `/` as well, so `a/b/c` is read left to right by
 * the caller — a over b, and the whole of that over c — the way it is said.
 *
 * NOTHING IS PADDED WITH SPACES. TeX spaces its own operators, and every space
 * we add is a space that comes back changed when this is run over its own
 * output, which happens every time an equation is opened again.
 */
function readRun(s, i, close, denominator = false) {
  const out = [];
  let chunk = [];

  const bareOf = (pieces) => (pieces.length === 1 ? pieces[0].bare
    : pieces.map((p) => p.tex).join(""));
  /* The whole run, without brackets, IF the run is nothing but one bracketed
     group — so a denominator or an operand can be handed on undressed. */
  const wholeBare = () => (!out.length && chunk.length ? bareOf(chunk) : null);
  const flush = () => {
    if (chunk.length) out.push(chunk.map((p) => p.tex).join(""));
    chunk = [];
  };
  const done = (at, step) => {
    const bare = wholeBare();
    flush();
    const tex = out.join("");
    return { tex, bare: bare === null ? tex : bare, i: at + (step || 0) };
  };

  while (i < s.length) {
    const c = s[i];
    if (close && c === close) return done(i, denominator ? 0 : 1);
    if (isSpace(c)) { i++; continue; }

    if (c === "^" || c === "_") {
      const base = chunk.pop() || { tex: "{}", bare: "{}" };
      const arg = readOperand(s, i + 1);
      const tex = `${base.tex}${c}{${arg.tex}}`;
      chunk.push({ tex, bare: tex });
      i = arg.i;
      continue;
    }

    if (c === "/") {
      if (denominator) return done(i);
      const top = chunk.length ? bareOf(chunk) : "{}";
      chunk = [];
      const bot = readRun(s, i + 1, close, true);
      const tex = `\\frac{${top}}{${bot.bare || "{}"}}`;
      chunk.push({ tex, bare: tex });
      i = bot.i;
      continue;
    }

    const two = punct(s, i);
    if (two) {
      if (denominator) return done(i);
      flush();
      out.push(gap(two.tex));
      i = two.i;
      continue;
    }

    if (BREAKS.has(c)) {
      if (denominator) return done(i);
      flush();
      out.push(c);
      i++;
      continue;
    }

    const atom = readAtom(s, i);
    chunk.push(atom);
    i = atom.i;
  }

  return done(i);
}

/** A two- or three-character sign, if one starts here. */
function punct(s, i) {
  for (const [k, tex] of PUNCT) {
    if (s.startsWith(k, i)) return { tex, i: i + k.length };
  }
  return null;
}

/**
 * One thing: a bracket, a word, a number, a command, a character.
 *
 * Returns its `tex` and its `bare` — the same without outer brackets, for
 * whoever is about to put it over, under or inside something else.
 */
function readAtom(s, i) {
  const c = s[i];

  /* raw TeX, arguments and all — this is what lets stored TeX come back
     through unharmed, and what makes translating twice safe */
  if (c === "\\") return readCommand(s, i);

  if (c === "(") {
    const g = readRun(s, i + 1, ")");
    return { tex: `\\left(${g.tex}\\right)`, bare: g.tex, i: g.i };
  }
  if (c === "[") {
    const g = readRun(s, i + 1, "]");
    return { tex: `\\left[${g.tex}\\right]`, bare: g.tex, i: g.i };
  }
  if (c === "{") {
    const g = readRun(s, i + 1, "}");
    return { tex: `\\left\\{${g.tex}\\right\\}`, bare: g.tex, i: g.i };
  }

  if (isDigit(c)) {
    let j = i;
    while (j < s.length && (isDigit(s[j]) || (s[j] === "." && isDigit(s[j + 1] || "")))) j++;
    const tex = s.slice(i, j);
    return { tex, bare: tex, i: j };
  }

  if (isAlpha(c)) return readWord(s, i);

  if (UNICODE[c]) return { tex: UNICODE[c], bare: UNICODE[c], i: i + 1 };
  if (ESCAPE[c]) return { tex: ESCAPE[c], bare: ESCAPE[c], i: i + 1 };
  if (c === "*") return { tex: gap("\\times"), bare: "\\times", i: i + 1 };
  if (c === "!") return { tex: "!", bare: "!", i: i + 1 };

  return { tex: c, bare: c, i: i + 1 };
}

/* Commands whose next CHARACTER belongs to them — `\left(` is one thing, and
   reading the bracket separately would wrap it in a second pair. */
const DELIMITED = new Set(["left", "right", "big", "Big", "bigg", "Bigg",
  "bigl", "bigr", "Bigl", "Bigr", "biggl", "biggr", "Biggl", "Biggr"]);

/**
 * A backslash command with whatever belongs to it.
 *
 * This is the door raw TeX comes through, and it has to be a faithful one:
 * every equation already written is TeX, and opening one to correct it reads
 * it back through here. Three things belong to a command besides its name —
 * its braced arguments, the delimiter after a `\left`, and the whole body of
 * a `\begin{…}…\end{…}` — and each of them is copied across untouched.
 */
function readCommand(s, i) {
  let j = i + 1;
  while (j < s.length && isAlpha(s[j])) j++;
  if (j === i + 1) j++; // \{ \} \\ \, and friends: one character
  const name = s.slice(i + 1, j);

  /* A whole environment goes through as it stands: what is inside is rows and
     cells written in TeX's own punctuation, and reading `&` as a character to
     be escaped — which it is anywhere else — would break every matrix. */
  if (name === "begin") {
    const open = s.slice(j).match(/^\{([^}]*)\}/);
    if (open) {
      const env = open[1];
      const end = s.indexOf(`\\end{${env}}`, j);
      if (end !== -1) {
        const stop = end + `\\end{${env}}`.length;
        const tex = s.slice(i, stop);
        return { tex, bare: tex, i: stop };
      }
    }
  }

  // its arguments, copied across exactly as they were written
  while (j < s.length && (s[j] === "{" || s[j] === "[")) {
    const close = s[j] === "{" ? "}" : "]";
    let depth = 0;
    let k = j;
    for (; k < s.length; k++) {
      if (s[k] === s[j]) depth++;
      else if (s[k] === close) { depth--; if (!depth) { k++; break; } }
    }
    j = k;
  }

  if (DELIMITED.has(name)) {
    while (j < s.length && isSpace(s[j])) j++;
    if (s[j] === "\\") { j++; while (j < s.length && isAlpha(s[j])) j++; }
    else if (j < s.length) j++;
    const tex = s.slice(i, j);
    return { tex, bare: tex, i: j };
  }

  const bare = s.slice(i, j);
  return { tex: gap(bare), bare, i: j };
}

/**
 * A name, and a space after it so it cannot run into what follows.
 *
 * `\ne b` must not set as `\neb`, a command nothing has ever heard of. The
 * space goes on unconditionally here and is taken off again by `tidy` at the
 * very end — which is the only place that knows what actually ended up next
 * to it. Deciding it here, from the SOURCE, gets `pi/2` wrong: what follows
 * `\le` in the writing is a letter, and what follows it in the ANSWER is
 * `\frac`, so a space chosen from the one is a space wrong for the other.
 */
const gap = (tex) => (/[A-Za-z]$/.test(tex) ? tex + " " : tex);

/**
 * Take out every space that is not holding two names apart.
 *
 * Run over the finished TeX, where what is beside what is finally settled. It
 * leaves the string it is given if there is nothing to take out, so reading an
 * equation back and writing it again lands on exactly the same characters.
 */
const tidy = (tex) => tex.replace(/(\\[A-Za-z]+) +(?![A-Za-z])/g, "$1");

/** A run of letters, which may be a name the learner expects us to know. */
function readWord(s, i) {
  let j = i;
  while (j < s.length && isAlpha(s[j])) j++;
  const word = s.slice(i, j);

  if (GRIDS[word] && s[j] === "(") {
    const g = readGrid(s, j + 1, GRIDS[word]);
    return { tex: g.tex, bare: g.tex, i: g.i };
  }
  if (TWO_ARG[word] && s[j] === "(") {
    const a = readRun(s, j + 1, ")");
    let k = a.i;
    while (k < s.length && isSpace(s[k])) k++;
    if (s[k] === "(") {
      const b = readRun(s, k + 1, ")");
      const tex = TWO_ARG[word](a.tex, b.tex);
      return { tex, bare: tex, i: b.i };
    }
    // only one bracket given — root(x) is a square root, frac(x) is just x
    const tex = word === "root" ? `\\sqrt{${a.tex}}` : a.tex;
    return { tex, bare: tex, i: a.i };
  }
  if (ONE_ARG[word]) {
    const a = readOperand(s, j);
    const tex = ONE_ARG[word](a.tex);
    return { tex, bare: tex, i: a.i };
  }
  if (word === "text" && s[j] === "(") {
    const end = s.indexOf(")", j + 1);
    const stop = end === -1 ? s.length : end;
    const tex = `\\text{${s.slice(j + 1, stop)}}`;
    return { tex, bare: tex, i: stop + 1 };
  }
  if (BIG[word]) {
    /* A tall sign sets its limits above and below rather than beside, which is
       what `\limits` says — and `\lim` has them there already. */
    const tex = word.startsWith("lim") ? BIG[word] : `${BIG[word]}\\limits`;
    return { tex: gap(tex), bare: tex, i: j };
  }
  const sign = (tex) => ({ tex: gap(tex), bare: tex, i: j });
  if (WORDS[word]) return sign(WORDS[word]);
  if (GREEK.includes(word)) return sign(`\\${word}`);
  if (FUNCS.includes(word)) return sign(`\\${word}`);

  /* Just letters, then — variables, set the way TeX sets a variable. */
  return { tex: word, bare: word, i: j };
}

/**
 * What a `^`, a `_` or a root takes.
 *
 * A bracket is the whole of it and its brackets are dropped; otherwise it is
 * ONE thing — one number, one letter, one name, one command. That is the rule
 * a word processor uses, and the reason `x^(2n+1)` has to be written with its
 * brackets while `x^2` need not be.
 */
function readOperand(s, i) {
  while (i < s.length && isSpace(s[i])) i++;
  const c = s[i];
  if (c === undefined) return { tex: "{}", i };

  if (c === "(") { const g = readRun(s, i + 1, ")"); return { tex: g.tex, i: g.i }; }
  if (c === "{") { const g = readRun(s, i + 1, "}"); return { tex: g.tex, i: g.i }; }
  if (c === "[") { const g = readRun(s, i + 1, "]"); return { tex: g.tex, i: g.i }; }

  /* a sign belongs to the index it is the sign of: x^-1, not x^- then 1 */
  if (c === "-" || c === "+") {
    const rest = readOperand(s, i + 1);
    return { tex: c + rest.tex, i: rest.i };
  }

  if (isDigit(c)) {
    let j = i;
    while (j < s.length && (isDigit(s[j]) || (s[j] === "." && isDigit(s[j + 1] || "")))) j++;
    return { tex: s.slice(i, j), i: j };
  }

  if (isAlpha(c)) {
    const w = readWord(s, i);
    /* One letter only, unless the letters spell something we know: `x^ab` is x
       to the a, times b — but `x^theta` is x to the theta. */
    const plain = /^[A-Za-z]+$/.test(w.tex);
    if (plain && w.tex.length > 1) return { tex: s[i], i: i + 1 };
    return { tex: w.tex, i: w.i };
  }

  const a = readAtom(s, i);
  return { tex: a.bare, i: a.i };
}

/** `matrix(a, b; c, d)` — rows on the semicolons, cells on the commas. */
function readGrid(s, i, kind) {
  const rows = [[]];
  let cell = "";
  let depth = 0;
  let j = i;
  for (; j < s.length; j++) {
    const c = s[j];
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" && !depth) { j++; break; }
    else if (c === ")" || c === "]" || c === "}") depth--;
    if (!depth && c === ",") { rows[rows.length - 1].push(cell); cell = ""; continue; }
    if (!depth && c === ";") { rows[rows.length - 1].push(cell); cell = ""; rows.push([]); continue; }
    cell += c;
  }
  rows[rows.length - 1].push(cell);
  const body = rows
    .map((r) => r.map((x) => toTeX(x)).join(" & "))
    .join(" \\\\ ");
  return { tex: `\\begin{${kind}}${body}\\end{${kind}}`, i: j };
}

/* ── the card that says what you may type ─────────────────────────────────── */

/**
 * Everything above, as something a learner can read and press.
 *
 * `type` is what they put in, `tex` is what it comes out as — the panel sets
 * the second with MathJax so the card SHOWS the answer rather than describing
 * it, and pressing a row types the first for them.
 */
export const SIGNS = [
  {
    name: "The shapes",
    hint: "Brackets make a parcel: everything inside goes in together.",
    items: [
      { type: "1/2", says: "A fraction" },
      { type: "(a + b)/2", says: "Brackets go on top whole" },
      { type: "x^2", says: "A power" },
      { type: "x^(2n + 1)", says: "A power of more than one thing" },
      { type: "x_1", says: "An index below" },
      { type: "a_(i+1)^2", says: "Both at once" },
      { type: "sqrt(x)", says: "A square root" },
      { type: "root(3)(x)", says: "Any other root" },
      { type: "abs(x)", says: "How big it is" },
    ],
  },
  {
    name: "The signs",
    hint: "Typed as they are said, or as they are written.",
    items: [
      { type: "*", says: "Times" },
      { type: "div", says: "Divided by" },
      { type: "+-", says: "Plus or minus" },
      { type: "<=", says: "Not more than" },
      { type: ">=", says: "Not less than" },
      { type: "!=", says: "Is not" },
      { type: "~=", says: "Is about" },
      { type: "->", says: "Goes to" },
      { type: "=>", says: "So" },
      { type: "...", says: "And so on" },
      { type: "deg", says: "Degrees" },
      { type: "infty", says: "For ever" },
    ],
  },
  {
    name: "Greek letters",
    hint: "Write the name and you get the letter.",
    items: [
      { type: "alpha", says: "" },
      { type: "beta", says: "" },
      { type: "gamma", says: "" },
      { type: "delta", says: "" },
      { type: "theta", says: "" },
      { type: "lambda", says: "" },
      { type: "mu", says: "" },
      { type: "pi", says: "" },
      { type: "rho", says: "" },
      { type: "sigma", says: "" },
      { type: "phi", says: "" },
      { type: "omega", says: "" },
      { type: "Delta", says: "" },
      { type: "Sigma", says: "" },
      { type: "Omega", says: "" },
    ],
  },
  {
    name: "Functions",
    hint: "Set upright, the way a function is written.",
    items: [
      { type: "sin(x)", says: "" },
      { type: "cos(x)", says: "" },
      { type: "tan(x)", says: "" },
      { type: "log(x)", says: "" },
      { type: "log_(10)(x)", says: "To a base" },
      { type: "ln(x)", says: "" },
    ],
  },
  {
    name: "The tall ones",
    hint: "Their limits go under and over, on _ and ^.",
    items: [
      { type: "sum_(i=1)^n", says: "Add them all up" },
      { type: "prod_(i=1)^n", says: "Multiply them all" },
      { type: "int_0^1", says: "Integrate" },
      { type: "lim_(x->0)", says: "As it gets close to" },
    ],
  },
  {
    name: "Over a letter",
    hint: "One letter, or a bracket for more.",
    items: [
      { type: "bar(x)", says: "The mean" },
      { type: "vec(v)", says: "A vector" },
      { type: "hat(y)", says: "" },
      { type: "dot(x)", says: "" },
      { type: "text(and)", says: "Words inside a formula" },
    ],
  },
  {
    name: "Grids",
    hint: "Commas between the cells, semicolons between the rows.",
    items: [
      { type: "matrix(a, b; c, d)", says: "" },
      { type: "pmatrix(a, b; c, d)", says: "In brackets" },
      { type: "cases(x, x>0; -x, x<0)", says: "One thing or the other" },
    ],
  },
];
