/* ============================================================================
   SAYING MATHS OUT LOUD
   ----------------------------------------------------------------------------
   Every text-to-speech engine we can buy reads prose. None of them reads
   maths. "x²" comes out as "x", "3/4" as "three slash four" or "three fourths
   on the fourth of March", "×" as nothing at all, and a line like
   "Here is x². A square, of side x." is read to a child as a sentence with a
   hole in it.

   THERE IS NO SETTING THAT FIXES THIS. ElevenLabs has one normalisation
   switch, `apply_text_normalization`, and what it normalises is numbers,
   dates, currency and abbreviations — the things a newsreader meets. It knows
   nothing about superscripts, fractions, roots or relations, and on the v2.5
   models it is an Enterprise feature besides. A pronunciation dictionary is
   word-for-word and cannot turn 3/4 into "three quarters" in one place and
   "three over four" in another. So the text has to be spoken-ised before it
   is sent, by us, here — which has the happy side effect of fixing the free
   Web Speech fallback at the same time, since that engine is no better.

   WHAT IT DOES NOT DO is touch the words. This runs over lesson lines that
   are mostly prose, so every rule below is written to leave ordinary writing
   exactly as it found it: a hyphen inside "well-known" stays a hyphen, a full
   stop at the end of a sentence stays a full stop, and a lone letter stays a
   lone letter. When in doubt it does nothing, because a line read slightly
   flatly is better than a line read wrongly.

     sayMaths("Here is x². A square, of side x.")
       -> "Here is x squared. A square, of side x."
     sayMaths("3.45 × 10² = 345")
       -> "three point four five times ten squared equals three hundred and forty five"
     sayMaths("\\frac{3}{4} of 20")
       -> "three quarters of twenty"
   ========================================================================== */

/* ── numbers in words ─────────────────────────────────────────────────────*/

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function under1000(n) {
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = TENS[Math.floor(n / 10)];
    return n % 10 ? `${t}-${ONES[n % 10]}` : t;
  }
  const h = `${ONES[Math.floor(n / 100)]} hundred`;
  return n % 100 ? `${h} and ${under1000(n % 100)}` : h;
}

/** A whole number in words. Big ones are left as figures — nobody says them. */
export function sayWhole(n) {
  if (!Number.isFinite(n)) return String(n);
  if (n < 0) return `minus ${sayWhole(-n)}`;
  if (n >= 1e9) return String(n);
  let out = [];
  const bn = Math.floor(n / 1e9);
  const m = Math.floor((n % 1e9) / 1e6);
  const k = Math.floor((n % 1e6) / 1000);
  const r = n % 1000;
  if (bn) out.push(`${under1000(bn)} billion`);
  if (m) out.push(`${under1000(m)} million`);
  if (k) out.push(`${under1000(k)} thousand`);
  if (r) out.push((out.length && r < 100 ? "and " : "") + under1000(r));
  return out.join(" ") || "zero";
}

/**
 * A number in words, decimals and all. After the point the figures are read
 * one at a time — "point four five", never "point forty-five", which is how
 * a decimal is actually said and the commonest thing an engine gets wrong.
 */
export function sayNumber(text) {
  const s = String(text).trim();
  const m = /^(-|−)?(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) return s;
  const sign = m[1] ? "minus " : "";
  const whole = sayWhole(Number(m[2]));
  if (!m[3]) return sign + whole;
  /* trailing zeros after the point are not read: 25.00 is "twenty-five", and
     12.50 is "twelve point five". Nobody says "point zero zero", and money is
     written with them on every line of a shop bill. */
  const figs = m[3].replace(/0+$/, "");
  if (!figs) return sign + whole;
  const after = [...figs].map((d) => ONES[Number(d)]).join(" ");
  return `${sign}${whole} point ${after}`;
}

/* ── fractions ────────────────────────────────────────────────────────────*/

/* The denominators that have a name. Anything else is read "over", which is
   what a person says: nobody says "five twenty-thirds". */
const DEN = {
  2: ["half", "halves"], 3: ["third", "thirds"], 4: ["quarter", "quarters"],
  5: ["fifth", "fifths"], 6: ["sixth", "sixths"], 7: ["seventh", "sevenths"],
  8: ["eighth", "eighths"], 9: ["ninth", "ninths"], 10: ["tenth", "tenths"],
  11: ["eleventh", "elevenths"], 12: ["twelfth", "twelfths"],
  16: ["sixteenth", "sixteenths"], 20: ["twentieth", "twentieths"],
  100: ["hundredth", "hundredths"], 1000: ["thousandth", "thousandths"],
};

/** "3/4" -> "three quarters"; "1/2" -> "a half"; "5/23" -> "five over twenty-three". */
export function sayFraction(num, den) {
  const n = Number(num);
  const d = Number(den);
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) return `${sayNumber(num)} over ${sayNumber(den)}`;
  const name = DEN[d];
  if (!name) return `${sayWhole(n)} over ${sayWhole(d)}`;
  if (n === 1) return d === 2 ? "a half" : `a ${name[0]}`;
  return `${sayWhole(n)} ${name[1]}`;
}

/* ── the signs ────────────────────────────────────────────────────────────*/

const SIGNS = [
  [/×/g, " times "],
  [/÷/g, " divided by "],
  [/≠/g, " is not equal to "],
  [/≤/g, " is less than or equal to "],
  [/≥/g, " is greater than or equal to "],
  [/≈/g, " is about "],
  [/±/g, " plus or minus "],
  [/∞/g, " infinity "],
  [/π/g, " pi "],
  [/°/g, " degrees "],
  [/∠/g, " angle "],
  [/△/g, " triangle "],
  [/∵/g, " since "],
  [/∴/g, " therefore "],
];

const SUPER = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
  "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
  "⁺": "+", "⁻": "-", "ⁿ": "n" };

/** "x²" -> "x^2", so one rule below can read every power the same way. */
const flattenSupers = (s) => s.replace(/[⁰¹²³⁴-⁹⁺⁻ⁿ]+/g,
  (run) => `^${[...run].map((c) => SUPER[c]).join("")}`);

/** The spoken form of an exponent. */
function sayPowerOf(exp) {
  const e = exp.trim();
  if (e === "2") return " squared";
  if (e === "3") return " cubed";
  if (/^-?\d+$/.test(e)) return ` to the power of ${sayNumber(e.replace("-", "−"))}`;
  return ` to the power of ${e}`;
}

/* ── LaTeX, in the little of it our pages write ───────────────────────────*/

function unLatex(s) {
  return s
    .replace(/\\\[|\\\]|\\\(|\\\)|\$\$|\$/g, " ")
    .replace(/\\(?:d?frac|tfrac)\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)")
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)")
    .replace(/\\(?:times)\b/g, "×")
    .replace(/\\(?:div)\b/g, "÷")
    .replace(/\\(?:cdot)\b/g, "×")
    .replace(/\\(?:pi)\b/g, "π")
    .replace(/\\(?:le|leq)\b/g, "≤")
    .replace(/\\(?:ge|geq)\b/g, "≥")
    .replace(/\\(?:ne|neq)\b/g, "≠")
    .replace(/\\(?:pm)\b/g, "±")
    .replace(/\\(?:approx)\b/g, "≈")
    .replace(/\\(?:degree|deg)\b/g, "°")
    .replace(/\\left|\\right/g, "")
    .replace(/\^\s*\{([^{}]*)\}/g, "^$1")
    .replace(/_\s*\{([^{}]*)\}/g, " sub $1")
    .replace(/\\[a-zA-Z]+/g, " ");
}

/* ── the whole job ────────────────────────────────────────────────────────*/

/**
 * Turn a line of lesson text into a line that can be read aloud.
 *
 *   numbers   false leaves figures as figures, for an engine whose own
 *             normaliser you would rather trust with them
 */
export function sayMaths(text, { numbers = true } = {}) {
  if (typeof text !== "string" || !text) return text;
  let s = text;

  if (s.includes("\\") || s.includes("$")) s = unLatex(s);
  s = flattenSupers(s);

  /* a mixed number, before the bare fraction rule gets at it: "3 1/2" */
  s = s.replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)(?!\d)/g,
    (_, w, n, d) => `${sayWhole(Number(w))} and ${sayFraction(n, d)}`);

  /* a fraction in brackets, as \frac leaves it: "(3)/(4)" and "(x+1)/(2)" */
  s = s.replace(/\(([^()]*)\)\s*\/\s*\(([^()]*)\)/g, (_, a, b) =>
    (/^\d+$/.test(a.trim()) && /^\d+$/.test(b.trim()))
      ? ` ${sayFraction(a.trim(), b.trim())} `
      : ` ${a} over ${b} `);

  /* a plain fraction between two numbers */
  s = s.replace(/(?<![\d.])(\d+)\s*\/\s*(\d+)(?![\d.])/g, (_, n, d) => ` ${sayFraction(n, d)} `);

  /* a root: a number, a letter, or a bracketed group */
  s = s.replace(/√\s*\(([^()]*)\)/g, " the square root of ($1) ");
  s = s.replace(/√\s*([A-Za-z0-9.]+)/g, " the square root of $1 ");

  /* a power: x^2, 10^-3, (a+b)^2 */
  s = s.replace(/\^\s*\(([^()]*)\)/g, (_, e) => sayPowerOf(e));
  /* the exponent is a number or a name — NOT "2." with the sentence's full
     stop swallowed into it, which turned "x²." into "to the power of 2." */
  s = s.replace(/\^\s*(-?\d+(?:\.\d+)?|[A-Za-z]\w*)/g, (_, e) => sayPowerOf(e));

  /* A RATIO COLON, AND ONLY A RATIO COLON. A colon between a number and a
     number is not enough: "each is 50: 4 × 50" is prose introducing the
     working, and "The easy one: it is" was being read as "one to it is". A
     ratio is written tight (3:4) or spaced on BOTH sides (4 : 5); a colon
     with a space only after it is punctuation. */
  s = s.replace(/(?<=\d):(?=\d)/g, " to ");
  s = s.replace(/(?<=\d) +: +(?=\d)/g, " to ");
  s = s.replace(/(?<=[A-Za-z0-9)])\s*\/\s*(?=[A-Za-z(])/g, " over ");

  /* per cent, which is two words when it is read */
  s = s.replace(/%/g, " per cent ");

  for (const [re, word] of SIGNS) s = s.replace(re, word);

  /* THE SIGNS THAT ARE ALSO PUNCTUATION. A minus is only a minus when it is
     doing arithmetic: spaced between two things, or in front of a figure at
     the start of one. A hyphen inside "well-known" or "twenty-one" is left
     exactly where it is, which is the whole reason these are not in the table
     above. */
  s = s.replace(/(?<=[\dA-Za-z)\s])\s[-−]\s(?=[\dA-Za-z(])/g, " minus ");
  s = s.replace(/(?<=^|[\s(=+*×])[-−](?=\d)/g, "minus ");
  s = s.replace(/\s\+\s/g, " plus ");
  /* an unspaced plus is safe where an unspaced minus is not: no English word
     has a + in it, while "well-known" and "twenty-one" are full of hyphens */
  s = s.replace(/(?<=[\dA-Za-z)])\+(?=[\dA-Za-z(])/g, " plus ");
  s = s.replace(/\s\*\s/g, " times ");
  s = s.replace(/\s=\s/g, " equals ");
  /* an unspaced equals, as in "x=5", which people do write */
  s = s.replace(/(?<=[\dA-Za-z)])=(?=[-\d A-Za-z(])/g, " equals ");
  s = s.replace(/(?<=[\dA-Za-z)])\s*<\s*(?=[\d A-Za-z(])/g, " is less than ");
  s = s.replace(/(?<=[\dA-Za-z)])\s*>\s*(?=[\d A-Za-z(])/g, " is greater than ");

  /* and only now the figures, so that every rule above has had the digits it
     needed to recognise what it was looking at */
  if (numbers) {
    /* The full stop that ends a sentence is not a decimal point. Refusing any
       following "." skipped every number a sentence ended on — "of 20." came
       back with its figures while "= 345" was read properly. */
    s = s.replace(/(?<![\w.])\d+(?:\.\d+)?(?!\w|\.\d)/g, (n) => sayNumber(n));
  }

  return s.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
}

export default sayMaths;
