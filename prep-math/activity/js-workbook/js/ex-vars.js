/* ============================================================================
   JavaScript Workbook — CHAPTER 2: Variables, and what to call them
   ----------------------------------------------------------------------------
   Chapter 1 ended with a box called `let`. This chapter is the box itself: the
   three keywords that make one, and — half the chapter, on purpose — what you
   are allowed to call it and what you OUGHT to call it.

     the rules          what a name may be made of, and what the computer
                        simply will not accept
     camelCase          how JavaScript writes a name of several words, and
                        that a capital letter is part of the name
     say what it holds  `x` is legal and useless. A name is a sentence you
                        leave for whoever reads the program next
     let                a box whose value can change, and what changing it
                        looks like from the console
     const              a name that cannot be pointed at anything else, and
                        the error you get for trying
     var                the OLD keyword, and the one thing it does that made
                        let and const necessary: it leaks out of a block
     which one          const unless it has to change; let when it does;
                        var never
     write it properly  a whole little program: a const, a let, real names

   WHY NAMING IS TAUGHT WITH THE KEYWORDS and not left for later: a beginner
   who learns `let a = 5` writes `let a = 5` for a year. The habit is formed in
   the first week, and it is formed by whatever the book put in front of them.

   ES6 is why there are three keywords at all. `var` is what JavaScript had
   until 2015 and it is still in every old program on the web, so a child will
   meet it; `let` and `const` are what it has now. This chapter does not tell
   them "var is bad" — it shows them the program where var gives the wrong
   answer and let gives the right one, and lets that do the arguing.
   ========================================================================== */

import { codeHtml } from "/utils/components/workbook/code.js";
import { want } from "/utils/components/workbook/want.js";
import { levelOf, dealer } from "./levels.js";

/* ── the paper's furniture, the same in every workbook on this site ──────── */

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const c = (t) => `<code class="js-inline wb-nomath">${esc(t)}</code>`;

const pairs = (head, rows) =>
  `<table class="js-table wb-nomath"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>` +
  `<tbody>${rows.map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

/* An empty listing of `n` numbered lines. A box the child writes their own
   program in is blank, but on PAPER it still has to be somewhere to write:
   one line to hold four lines of program is not a box, it is a hint that
   something has gone wrong. */
const blank = (n) => "\n".repeat(Math.max(0, n - 1));

const tier = (o) => levelOf(o).id;
const upTo = (o) => ({ gentle: 0, middle: 1, stretch: 2 }[tier(o)] ?? 0);

export const VR_GROUPS = [
  { id: "vr-rules", chapter: "Chapter 2 · Variables", label: "What may a name be made of?", blurb: "The rules JavaScript enforces — and the ones it only sighs at." },
  { id: "vr-camel", label: "camelCase", blurb: "Several words, no spaces, a capital on each word but the first." },
  { id: "vr-choose", label: "Say what it holds", blurb: "x is legal and useless. Name it for what is in it." },
  { id: "vr-let", label: "let — a box that can change", blurb: "Put a value in, print it, change it, print it again." },
  { id: "vr-const", label: "const — a name that stays put", blurb: "Try to change it and the program stops." },
  { id: "vr-var", label: "var, the old keyword", blurb: "Why ES6 added let and const: var leaks out of its block." },
  { id: "vr-which", label: "Which keyword?", blurb: "const unless it must change. let when it does. var never." },
  { id: "vr-write", label: "Write it properly", blurb: "A const, a let, and names that say what they hold." },
];

/* ═══ 1. what may a name be made of? ═══════════════════════════════════════*/

/* `ok` is whether JavaScript ACCEPTS it, and `why` is what is wrong with the
   ones it does not. Kept together so the question and the worked example can
   never disagree about a name. */
const NAMES = [
  { name: "score", ok: true, tier: 0 },
  { name: "score2", ok: true, tier: 0 },
  { name: "my age", ok: false, why: "there is a space in it", tier: 0 },
  { name: "2fast", ok: false, why: "it starts with a figure", tier: 0 },
  { name: "firstName", ok: true, tier: 0 },
  { name: "first-name", ok: false, why: "the hyphen is a minus sign to JavaScript", tier: 0 },
  { name: "_total", ok: true, tier: 1 },
  { name: "total$", ok: true, tier: 1 },
  { name: "class", ok: false, why: "it is a word JavaScript has kept for itself", tier: 1 },
  { name: "playerOne", ok: true, tier: 0 },
  { name: "3", ok: false, why: "a name cannot be a number", tier: 0 },
  { name: "let", ok: false, why: "it is a word JavaScript has kept for itself", tier: 1 },
  { name: "dayOfWeek", ok: true, tier: 0 },
  { name: "full name", ok: false, why: "there is a space in it", tier: 0 },
  { name: "$price", ok: true, tier: 1 },
  { name: "if", ok: false, why: "it is a word JavaScript has kept for itself", tier: 2 },
];

const dealNames = dealer();
const someNames = (r, o, n, i = 0) => {
  const pool = NAMES.filter((v) => v.tier <= upTo(o));
  const out = [];
  for (let k = 0; k < n; k++) out.push(dealNames(r, pool, i * n + k));
  const spread = out.filter((v, k) => out.indexOf(v) === k);
  const picked = spread.length === n ? out : r.shuffle(pool.slice()).slice(0, n);
  /* a page of six names that are all fine teaches nothing, and neither does
     six that are all wrong */
  return picked.some((v) => v.ok) && picked.some((v) => !v.ok)
    ? picked
    : r.shuffle(pool.filter((v) => v.ok)).slice(0, Math.ceil(n / 2))
      .concat(r.shuffle(pool.filter((v) => !v.ok)).slice(0, Math.floor(n / 2)));
};

const vrRules = {
  id: "vr-rules",
  group: "vr-rules",
  label: "Allowed, or not?",
  blurb: "Six names. Which ones will JavaScript take?",
  heading: "What may a name be made of?",
  instruction: () =>
    "A name may be made of letters, figures, an underscore " + c("_") + " and a dollar sign " + c("$") + ". " +
    "It may <b>not</b> start with a figure, it may <b>not</b> have a space in it, and it may not be one of the " +
    "words JavaScript keeps for itself (" + c("let") + ", " + c("const") + ", " + c("if") + ", " + c("class") + " …). " +
    "A hyphen is out too — JavaScript reads it as a minus sign. Tick whether each name is allowed.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    return { ns: someNames(r, o, 6, i).map((v) => NAMES.indexOf(v)) };
  },
  render(item) {
    return pairs(["The name", "May JavaScript have it?"],
      item.ns.map((n) => [c(NAMES[n].name), tick("allowed", "not allowed")]));
  },
  worked() {
    return worked(say(
      c("2fast") + " is <b>not allowed</b>: a name cannot start with a figure, because JavaScript has begun " +
      "reading a number by the time it reaches the f. " + c("fast2") + " is fine — the rule is only about the " +
      "<i>first</i> character."));
  },
  key(item) {
    return item.ns.map((n) => want.tick(NAMES[n].ok ? 0 : 1));
  },
  answer(item) {
    return item.ns.map((n) => `${NAMES[n].name}: ${NAMES[n].ok ? "allowed" : `not allowed — ${NAMES[n].why}`}`);
  },
};

/* ═══ 2. camelCase ═════════════════════════════════════════════════════════*/

const WORDS = [
  { words: "total score", name: "totalScore", tier: 0 },
  { words: "first name", name: "firstName", tier: 0 },
  { words: "days in month", name: "daysInMonth", tier: 0 },
  { words: "is game over", name: "isGameOver", tier: 1 },
  { words: "pupil count", name: "pupilCount", tier: 0 },
  { words: "price of one book", name: "priceOfOneBook", tier: 1 },
  { words: "home town", name: "homeTown", tier: 0 },
  { words: "number of legs", name: "numberOfLegs", tier: 1 },
  { words: "seconds left", name: "secondsLeft", tier: 0 },
  { words: "has paid", name: "hasPaid", tier: 1 },
];

const dealWords = dealer();
const someWords = (r, o, n, i = 0) => {
  const pool = WORDS.filter((w) => w.tier <= upTo(o));
  const out = [];
  for (let k = 0; k < n; k++) out.push(dealWords(r, pool, i * n + k));
  return out.filter((w, k) => out.indexOf(w) === k).length === n ? out : r.shuffle(pool.slice()).slice(0, n);
};

const vrCamel = {
  id: "vr-camel",
  group: "vr-camel",
  label: "Write it in camelCase",
  blurb: "Join the words up, capital on each one but the first.",
  heading: "camelCase",
  instruction: () =>
    "A name cannot hold a space, so JavaScript joins the words up and puts a <b>capital letter</b> at the start " +
    "of every word except the first: " + c("total score") + " becomes " + c("totalScore") + ". It is called " +
    "camelCase because of the humps. Capitals are part of the name — " + c("totalscore") + " and " +
    c("totalScore") + " are two different names — so write them exactly.",
  cols: 2,
  defaultCount: 2,
  make(r, o, k, i) {
    return { ws: someWords(r, o, 4, i).map((w) => WORDS.indexOf(w)) };
  },
  render(item) {
    return pairs(["What it holds", "The name, in camelCase"],
      item.ws.map((n) => [WORDS[n].words, box()]));
  },
  worked() {
    return worked(say(
      c("days in month") + " becomes " + c("daysInMonth") + ": the first word stays as it is, and every word " +
      "after it loses its space and gains a capital. Not " + c("DaysInMonth") + " — a capital at the very front " +
      "is saved for something else you will meet later."));
  },
  key(item) {
    return item.ws.map((n) => want.exact(WORDS[n].name));
  },
  answer(item) {
    return item.ws.map((n) => `${WORDS[n].words} → ${WORDS[n].name}`);
  },
};

/* ═══ 3. say what it holds ═════════════════════════════════════════════════*/

/* Each one: the line as it should be written, and three names for it — the
   useless one, the wrong one, and the one that says what is in the box. The
   right answer is `at`. */
const NAMING = [
  { value: `31`, holds: "how many days June has", opts: ["d", "june", "daysInJune"], at: 2,
    why: "d says nothing and june says the wrong thing — it is not June that is in the box, it is a number of days." },
  { value: `"Amara"`, holds: "the pupil's first name", opts: ["firstName", "x", "string"], at: 0,
    why: "string names the KIND, which the computer already knows. The name is for the reader, and the reader wants to know whose name it is." },
  { value: `true`, holds: "whether the homework is done", opts: ["thing", "isDone", "true2"], at: 1,
    why: "a box holding true or false is usually named like a question: isDone, hasPaid, canPlay." },
  { value: `2500`, holds: "the price of a book in naira", opts: ["priceInNaira", "n", "money"], at: 0,
    why: "money could be anybody's money, and n could be anything at all." },
  { value: `9`, holds: "how many pupils came", opts: ["p", "pupilsHere", "nine"], at: 1,
    why: "nine is the value written as a word — and the moment ten pupils come, the name is a lie." },
];

const dealNaming = dealer();

const vrChoose = {
  id: "vr-choose",
  group: "vr-choose",
  label: "Name it for what it holds",
  blurb: "Three names offered. One of them says what is in the box.",
  heading: "Say what it holds",
  instruction: () =>
    "JavaScript will take " + c("x") + " quite happily. The person reading your program in a month — who is " +
    "usually you — will not. A good name says <b>what is in the box</b>, not what kind it is and not what the " +
    "value happens to be today. Tick the best name for each one.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const n = NAMING.indexOf(dealNaming(r, NAMING, i));
    return { n };
  },
  render(item) {
    const t = NAMING[item.n];
    return ask(`A box is to hold ${c(t.value)} — ${t.holds}. What should it be called?`) +
      tick(...t.opts.map((o) => c(o))) +
      ask(`Now write the whole line, with your name in it: ${c("let")} ${box()} ${c("=")} ${c(`${t.value};`)}`);
  },
  worked() {
    return worked(say(
      "A box holding " + c("31") + " because June has 31 days is called " + c("daysInJune") + ". Not " + c("d") +
      ", which says nothing, and not " + c("june") + ", which says the wrong thing: June is a month, and what is " +
      "in the box is a number of days."));
  },
  key(item) {
    const t = NAMING[item.n];
    return [want.tick(t.at), want.exact(t.opts[t.at])];
  },
  answer(item) {
    const t = NAMING[item.n];
    return [`${t.opts[t.at]} — ${t.why}`];
  },
};

/* ═══ 4. let ═══════════════════════════════════════════════════════════════*/

/* NONE of these is the one in the worked example. A child who is shown score
   going 0 → 10 and is then asked for score going 0 → 10 has been asked to
   copy, and the page cannot tell copying from knowing. */
const CHANGES = [
  { name: "lives", from: "3", to: "2", type: "number" },
  { name: "town", from: `"Jos"`, to: `"Kano"`, type: "string" },
  { name: "counter", from: "1", to: "5", type: "number" },
  { name: "goals", from: "0", to: "2", type: "number" },
  { name: "player", from: `"Ada"`, to: `"Bola"`, type: "string" },
];
const shown = (v) => String(v).replace(/^"|"$/g, "");

const dealChange = dealer();

const vrLet = {
  id: "vr-let",
  group: "vr-let",
  label: "Change what is in the box",
  blurb: "Print it, change it, print it again.",
  heading: "let — a box that can change",
  instruction: () =>
    c("let") + " makes a box and puts a value in it. Later you can put a <b>different</b> value in the same box, " +
    "and you do NOT write " + c("let") + " again — that word is for making the box, not for filling it. Write " +
    "what each line prints, then write the program yourself.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    return { n: CHANGES.indexOf(dealChange(r, CHANGES, i)) };
  },
  render(item) {
    const t = CHANGES[item.n];
    const src = `let ${t.name} = ${t.from};\nconsole.log(${t.name});\n${t.name} = ${t.to};\nconsole.log(${t.name});`;
    return codeHtml({ src, file: "change.js", out: 2 }) +
      pairs(["Line", "It prints"], [["2", box()], ["4", box()]]) +
      ask(`Now write it yourself, in the other box: make ${c(t.name)} hold ${c(t.from)}, print it, ` +
        `change it to ${c(t.to)}, print it again.`) +
      codeHtml({ src: blank(4), edit: true, mark: true, rows: 5, file: "mine.js", out: 2 });
  },
  worked() {
    return worked(say(
      c("let score = 0;") + " then " + c("score = 10;") + " prints <b>0</b> and then <b>10</b>. The second line " +
      "has no " + c("let") + " on it: the box already exists, and this is just putting something else in it. " +
      "Writing " + c("let") + " twice for the same name is an error."));
  },
  key(item) {
    const t = CHANGES[item.n];
    return [
      want.text(shown(t.from)),
      want.text(shown(t.to)),
      want.code({
        prints: [shown(t.from), shown(t.to)],
        must: ["let", t.name],
        says: `${shown(t.from)} then ${shown(t.to)}`,
      }),
    ];
  },
  answer(item) {
    const t = CHANGES[item.n];
    return [`prints ${shown(t.from)} then ${shown(t.to)}`];
  },
};

/* ═══ 5. const ═════════════════════════════════════════════════════════════*/

/* pi is the worked one, so it is not one of these — see CHANGES above. */
const FIXED = [
  { name: "schoolName", value: `"Unity High"`, other: `"Other High"`, why: "the school is not going to be renamed halfway down the program" },
  { name: "daysInWeek", value: "7", other: "8", why: "there are seven days in a week and there always will be" },
  { name: "minutesInHour", value: "60", other: "90", why: "an hour is sixty minutes wherever you are" },
  { name: "townName", value: `"Kaduna"`, other: `"Zaria"`, why: "the town the program is about does not change halfway through it" },
];

const dealFixed = dealer();

const vrConst = {
  id: "vr-const",
  group: "vr-const",
  label: "What const refuses",
  blurb: "The line that stops the program, and what it says.",
  heading: "const — a name that stays put",
  instruction: () =>
    c("const") + " makes a box you cannot point at anything else. It is not that the value is precious — it is " +
    "that you are promising the reader this name means one thing all the way down. Break the promise and the " +
    "program stops on that line with " + c("TypeError: Assignment to constant variable.") + " Read the program " +
    "and answer underneath.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    return { n: FIXED.indexOf(dealFixed(r, FIXED, i)) };
  },
  render(item) {
    const t = FIXED[item.n];
    const src = `const ${t.name} = ${t.value};\nconsole.log(${t.name});\n${t.name} = ${t.other};\nconsole.log("done");`;
    return codeHtml({ src, file: "fixed.js", out: 2 }) +
      ask(`Line 2 prints ${box()}.`) +
      ask("Which line stops the program?") +
      tick("line 1", "line 2", "line 3", "line 4") +
      ask(`So the word <b>done</b> is ${box()} printed. (Write <i>never</i> or <i>always</i>.)`);
  },
  worked() {
    return worked(say(
      c("const pi = 3.14;") + " prints <b>3.14</b> quite happily. " + c("pi = 3;") + " is where it stops: you " +
      "may look in a const box as often as you like, but you may never point the name at something else. " +
      "Nothing after that line runs at all, so <b>done</b> is never printed."));
  },
  key(item) {
    const t = FIXED[item.n];
    return [want.text(shown(t.value)), want.tick(2), want.text("never")];
  },
  answer(item) {
    const t = FIXED[item.n];
    return [`prints ${shown(t.value)}, then line 3 stops it — "done" is never printed (${t.why})`];
  },
};

/* ═══ 6. var, the old keyword ══════════════════════════════════════════════*/

const vrVar = {
  id: "vr-var",
  group: "vr-var",
  label: "Why let was invented",
  blurb: "The same program twice: once with var, once with let.",
  heading: "var, the old keyword",
  instruction: () =>
    "Until 2015 JavaScript had one keyword for making a box: " + c("var") + ". Its trouble is that a " +
    c("var") + " made inside a block — anything between " + c("{") + " and " + c("}") + " — is not kept inside " +
    "it. It leaks out and overwrites the one outside. " + c("let") + " and " + c("const") + " stay where they " +
    "were made, which is why they were added. Here is the same program written both ways.",
  cols: 1,
  defaultCount: 1,
  minLevel: "middle",
  make(r) {
    const a = r.int(1, 4);
    const b = a + r.int(3, 6);
    return { a, b };
  },
  render(item) {
    const withVar = `var total = ${item.a};\nif (true) {\n  var total = ${item.b};\n}\nconsole.log(total);`;
    const withLet = `let total = ${item.a};\nif (true) {\n  let total = ${item.b};\n}\nconsole.log(total);`;
    return ask("<b>With var:</b>") +
      codeHtml({ src: withVar, file: "old.js", out: 1 }) +
      ask(`It prints ${box()}.`) +
      ask("<b>With let:</b>") +
      codeHtml({ src: withLet, file: "new.js", out: 1 }) +
      ask(`It prints ${box()}.`) +
      ask("Which one kept the box inside the block where it was made?") +
      tick(c("var"), c("let"));
  },
  worked() {
    return worked(say(
      "With " + c("var") + " there is only ever ONE box called total: the one inside the " + c("if") +
      " is the same box, so the number outside is overwritten and the answer is the inside one. With " +
      c("let") + " the one inside the braces is its own box that stops existing at the " + c("}") + ", so the " +
      "one outside is untouched. That is the whole reason ES6 added " + c("let") + "."));
  },
  key(item) {
    return [want.text(String(item.b)), want.text(String(item.a)), want.tick(1)];
  },
  answer(item) {
    return [`var prints ${item.b} (it leaked out), let prints ${item.a}`];
  },
};

/* ═══ 7. which keyword? ════════════════════════════════════════════════════*/

const CASES = [
  { what: "how many days there are in a week", keep: true },
  { what: "the score, which goes up when you get one right", keep: false },
  { what: "the name of the school", keep: true },
  { what: "how many lives are left in the game", keep: false },
  { what: "the number of minutes in an hour", keep: true },
  { what: "the pupil's answer, typed in again each time", keep: false },
  { what: "the price of a stamp, fixed for the whole program", keep: true },
  { what: "the total so far, added to on every line", keep: false },
];

const dealCase = dealer();
const someCases = (r, o, n, i = 0) => {
  const out = [];
  for (let k = 0; k < n; k++) out.push(dealCase(r, CASES, i * n + k));
  return out.filter((v, k) => out.indexOf(v) === k).length === n ? out : r.shuffle(CASES.slice()).slice(0, n);
};

const vrWhich = {
  id: "vr-which",
  group: "vr-which",
  label: "const or let?",
  blurb: "Four boxes. Which keyword makes each one?",
  heading: "Which keyword?",
  instruction: () =>
    "The rule real programmers use: <b>" + c("const") + " unless it has to change</b>, " + c("let") + " when it " +
    "does, and " + c("var") + " never — it is only there so that programs written before 2015 still run. " +
    "Starting with " + c("const") + " means the program tells the reader which things move. Tick one for each.",
  cols: 2,
  defaultCount: 2,
  make(r, o, k, i) {
    return { cs: someCases(r, o, 4, i).map((v) => CASES.indexOf(v)) };
  },
  render(item) {
    return pairs(["The box is to hold", "Which keyword?"],
      item.cs.map((n) => [CASES[n].what, tick(c("const"), c("let"))]));
  },
  worked() {
    return worked(say(
      "How many days there are in a week is " + c("const") + ": it is seven now and it will be seven at the " +
      "bottom of the program. A score is " + c("let") + ": the whole point of a score is that it changes. If " +
      "you are not sure, start with " + c("const") + " — the program will tell you off the moment it needs to " +
      "change, and then you know."));
  },
  key(item) {
    return item.cs.map((n) => want.tick(CASES[n].keep ? 0 : 1));
  },
  answer(item) {
    return item.cs.map((n) => `${CASES[n].what}: ${CASES[n].keep ? "const" : "let"}`);
  },
};

/* ═══ 8. write it properly ═════════════════════════════════════════════════*/

/* and the worked example here is a club with members, which none of these is */
const JOBS = [
  {
    fixed: { name: "schoolName", value: `"Unity High"`, prints: "Unity High" },
    moves: { name: "pupilCount", from: "18", to: "19", },
    story: "one pupil arrives late",
  },
  {
    fixed: { name: "subject", value: `"Maths"`, prints: "Maths" },
    moves: { name: "score", from: "6", to: "7" },
    story: "they get one more right",
  },
  {
    fixed: { name: "townName", value: `"Abuja"`, prints: "Abuja" },
    moves: { name: "temperature", from: "31", to: "34" },
    story: "the afternoon gets hotter",
  },
];

const dealJob = dealer();

const vrWrite = {
  id: "vr-write",
  group: "vr-write",
  label: "A const, a let, and good names",
  blurb: "The whole thing: make them, print them, change the one that changes.",
  heading: "Write it properly",
  instruction: () =>
    "Everything in this chapter at once. Use " + c("const") + " for the thing that cannot change and " +
    c("let") + " for the thing that does, spell the names exactly as they are given, and print the four lines " +
    "in the order they are asked for. Press <b>Run</b> and read the console — the program is marked by what it " +
    "prints, not by how you wrote it.",
  cols: 1,
  defaultCount: 1,
  make(r, o, k, i) {
    return { n: JOBS.indexOf(dealJob(r, JOBS, i)) };
  },
  render(item) {
    const t = JOBS[item.n];
    return ask(
      `Make ${c(t.fixed.name)} with ${c("const")}, holding ${c(t.fixed.value)}. ` +
      `Make ${c(t.moves.name)} with ${c("let")}, holding ${c(t.moves.from)}. ` +
      `Print them both. Then ${t.story}: change ${c(t.moves.name)} to ${c(t.moves.to)} and print it again. ` +
      `Last, print the kind of ${c(t.moves.name)} with ${c("typeof")}.`) +
      codeHtml({ src: blank(7), edit: true, mark: true, rows: 8, file: "properly.js", out: 4 });
  },
  worked() {
    return worked(
      codeHtml({
        src: `const clubName = "Chess Club";\nlet members = 12;\nconsole.log(clubName);\nconsole.log(members);\nmembers = 13;\nconsole.log(members);\nconsole.log(typeof members);`,
        file: "properly.js", out: 4,
      }) +
      say("It prints <b>Chess Club</b>, <b>12</b>, <b>13</b>, <b>number</b>. The club's name never changes, so " +
        "it is a " + c("const") + "; how many members it has does, so it is a " + c("let") + " — and the line " +
        "that changes it has no keyword on it at all."));
  },
  key(item) {
    const t = JOBS[item.n];
    return [want.code({
      prints: [t.fixed.prints, t.moves.from, t.moves.to, "number"],
      must: ["const", "let", t.fixed.name, t.moves.name, "typeof"],
      says: `${t.fixed.prints}, ${t.moves.from}, ${t.moves.to}, number`,
    })];
  },
  answer(item) {
    const t = JOBS[item.n];
    return [`const ${t.fixed.name} = ${t.fixed.value}; let ${t.moves.name} = ${t.moves.from}; ` +
      `prints ${t.fixed.prints}, ${t.moves.from}, ${t.moves.to}, number`];
  },
};

export const VR_EXERCISES = [vrRules, vrCamel, vrChoose, vrLet, vrConst, vrVar, vrWhich, vrWrite];
