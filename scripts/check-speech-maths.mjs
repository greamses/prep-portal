const { sayMaths } = await import("../utils/speech-maths.js");
let bad = 0;
let ran = 0;
const t = (src, want) => {
  ran++;
  const got = sayMaths(src);
  if (got !== want) {
    bad++;
    console.log(`  FAIL  ${JSON.stringify(src)}`);
    console.log(`        got  ${JSON.stringify(got)}`);
    console.log(`        want ${JSON.stringify(want)}`);
  }
};

/* ── the maths ─────────────────────────────────────────────────────────── */
t("Here is x\u00b2. A square, of side x.", "Here is x squared. A square, of side x.");
t("x\u00b3 + 1", "x cubed plus one");
t("10\u207b\u00b3", "ten to the power of minus three");
t("3.45 \u00d7 10\u00b2 = 345", "three point four five times ten squared equals three hundred and forty-five");
t("20 \u00f7 4", "twenty divided by four");
t("3/4 of 20", "three quarters of twenty");
t("1/2 a cake", "a half a cake");
t("2/3", "two thirds");
t("5/23", "five over twenty-three");
t("3 1/2 hours", "three and a half hours");
t("\u221a16", "the square root of sixteen");
t("a \u2264 b", "a is less than or equal to b");
t("45\u00b0", "forty-five degrees");
t("25%", "twenty-five per cent");
t("the ratio 3:4", "the ratio three to four");
t("x/y", "x over y");
t("-5 + 3", "minus five plus three");
t("7 - 2", "seven minus two");
t("x=5", "x equals five");
t("2\u03c0r", "two pi r");
t("1000 counters", "one thousand counters");
t("2026", "two thousand and twenty-six");
t("0.5", "zero point five");

/* LaTeX, written with real backslashes */
t("\\frac{3}{4}", "three quarters");
t("\\sqrt{x+1}", "the square root of (x plus one)");
t("x \\times y", "x times y");
t("\\(a^2 + b^2 = c^2\\)", "a squared plus b squared equals c squared");

/* ── and the prose it must not touch ───────────────────────────────────── */
t("It's a well-known short-cut.", "It's a well-known short-cut.");
t("Twenty-one children, and no more.", "Twenty-one children, and no more.");
t("Bring a faint copy of the right digit, R, into the gap.",
  "Bring a faint copy of the right digit, R, into the gap.");
t("That leaves a gap between each pair to fill in.",
  "That leaves a gap between each pair to fill in.");
t("Pop a plus sign in between them.", "Pop a plus sign in between them.");
t("To times 7 by eleven, spread its digits apart.",
  "To times seven by eleven, spread its digits apart.");
t("We're going to add this pair together.", "We're going to add this pair together.");

console.log(bad ? `\n${bad} of ${ran} wrong` : `\nall ${ran} right — maths read aloud, prose left alone`);
