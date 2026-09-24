/* ============================================================================
   JavaScript Workbook — CHAPTER 1: Data types
   ----------------------------------------------------------------------------
   Before a beginner can be told what a variable is, they have to notice that
   the computer cares WHAT KIND OF THING a value is. 17 and "17" look the same
   on the page and behave differently the moment you add something to them,
   and that surprise is the whole chapter.

     what kind is it     name the kind of each value: text, a number, or
                         true/false — and see that quotes decide it
     quotes change it    7 + 7 is 14; "7" + "7" is 77. The same keys typed,
                         two different answers
     typeof              ask the computer instead of guessing: what typeof
                         prints, and that it always prints a WORD
     print it            the first program they write themselves, marked by
                         running it (code.js), not by how it is written
     nothing             null (empty on purpose) and undefined (nothing yet)
     joining or adding   "2" + 2, and mending it with Number(...)
     put it in a box     let and const, and the type of what is in the box

   Every value in this chapter is written the way a console prints it, because
   that is what the child is going to compare their answer against.
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
/** A scrap of code inside a sentence. `wb-nomath` keeps MathJax off it. */
const c = (t) => `<code class="js-inline wb-nomath">${esc(t)}</code>`;

/** A two-column table of questions: the value, and a box to answer in. */
const pairs = (head, rows) =>
  `<table class="js-table wb-nomath"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>` +
  `<tbody>${rows.map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

const tier = (o) => levelOf(o).id;

/* ── the values this chapter talks about ─────────────────────────────────── */

/* `src` is how it is written in a program, `type` what typeof says, `prints`
   what the console shows. Kept together so a question can ask any of the
   three about the same value and the answer key cannot drift. */
const VALUES = [
  { src: `"Amara"`, type: "string", prints: "Amara", tier: 0 },
  { src: `17`, type: "number", prints: "17", tier: 0 },
  { src: `true`, type: "boolean", prints: "true", tier: 0 },
  { src: `"Lagos"`, type: "string", prints: "Lagos", tier: 0 },
  { src: `0`, type: "number", prints: "0", tier: 0 },
  { src: `false`, type: "boolean", prints: "false", tier: 0 },
  { src: `"7"`, type: "string", prints: "7", tier: 0 },
  { src: `3.5`, type: "number", prints: "3.5", tier: 1 },
  { src: `"true"`, type: "string", prints: "true", tier: 1 },
  { src: `-4`, type: "number", prints: "-4", tier: 1 },
  { src: `"3.5"`, type: "string", prints: "3.5", tier: 1 },
  { src: `"2 + 2"`, type: "string", prints: "2 + 2", tier: 2 },
  { src: `100`, type: "number", prints: "100", tier: 1 },
];

const poolFor = (o) => {
  const t = { gentle: 0, middle: 1, stretch: 2 }[tier(o)] ?? 0;
  return VALUES.filter((v) => v.tier <= t);
};

/* words a beginner may reasonably write for each kind */
const ACCEPT = {
  string: ["string", "text", "a string", "words"],
  number: ["number", "a number"],
  boolean: ["boolean", "true or false", "a boolean", "bool"],
};
const kindOf = (v) => want.text(...ACCEPT[v.type]);

const deal = dealer();
const someValues = (r, o, n, i = 0) => {
  const pool = poolFor(o);
  const out = [];
  for (let k = 0; k < n; k++) out.push(deal(r, pool, i * n + k));
  /* the same value twice in one list teaches nothing */
  return out.filter((v, k) => out.indexOf(v) === k).length === n ? out : r.shuffle(pool).slice(0, n);
};

export const DT_GROUPS = [
  { id: "dt-kind", chapter: "Chapter 1 · Data types", label: "What kind of value is it?", blurb: "Text, a number, or true/false — and quotes decide." },
  { id: "dt-quotes", label: "Quotes change everything", blurb: "7 + 7 is 14. \"7\" + \"7\" is 77." },
  { id: "dt-typeof", label: "Ask the computer: typeof", blurb: "Stop guessing — typeof tells you, in a word." },
  { id: "dt-print", label: "Print it yourself", blurb: "Your first program, marked by running it." },
  { id: "dt-empty", label: "Nothing, two ways", blurb: "null is empty on purpose; undefined is nothing yet." },
  { id: "dt-join", label: "Joining or adding?", blurb: "\"2\" + 2, and how to mend it." },
  { id: "dt-vars", label: "Put it in a box: let and const", blurb: "A name for a value — and the value keeps its kind." },
];

/* ═══ 1. what kind of value is it? ═════════════════════════════════════════*/

const dtKind = {
  id: "dt-kind",
  group: "dt-kind",
  label: "Name the kind",
  blurb: "Five values: text, number, or true/false?",
  heading: "What kind of value is it?",
  instruction: () =>
    "JavaScript has a few kinds of value. <b>Text</b> (a <i>string</i>) is anything inside quote marks. A " +
    "<b>number</b> is written with no quotes. <b>true</b> and <b>false</b> are their own kind (a <i>boolean</i>). " +
    "Write string, number or boolean for each one. Watch the quote marks — they are what decides it.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    return { vs: someValues(r, o, 5, i).map((v) => VALUES.indexOf(v)) };
  },
  render(item) {
    const rows = item.vs.map((n) => [c(VALUES[n].src), box()]);
    return pairs(["The value", "What kind is it?"], rows);
  },
  worked() {
    return worked(say(`${c(`"7"`)} is a <b>string</b>. It looks like a number, but the quote marks make it text — ` +
      `it is the <i>character</i> 7, the way a name is characters. ${c(`7`)} with no quotes is a <b>number</b>.`));
  },
  key(item) {
    return item.vs.map((n) => kindOf(VALUES[n]));
  },
  answer(item) {
    return [item.vs.map((n) => `${VALUES[n].src} → ${VALUES[n].type}`).join(", ")];
  },
};

/* ═══ 2. quotes change everything ══════════════════════════════════════════*/

/* a + b done twice: once as numbers, once as the same digits in quotes */
const dtQuotes = {
  id: "dt-quotes",
  group: "dt-quotes",
  label: "Numbers add, text joins",
  blurb: "The same keys typed; two different answers.",
  heading: "Adding numbers, joining text",
  instruction: () =>
    "The + sign does two different jobs, and the kind of value decides which. Two <b>numbers</b> are ADDED. Two " +
    "<b>strings</b> are JOINED, end to end, exactly as they are written. Write what each line prints, then press " +
    "Run and see whether you were right.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const a = r.int(2, 9);
    const b = r.int(2, 9);
    return { a, b };
  },
  render(item) {
    const src = `console.log(${item.a} + ${item.b});\nconsole.log("${item.a}" + "${item.b}");`;
    return codeHtml({ src, file: "adding.js", out: 2 }) +
      ask(`Line 1 prints ${box()} and line 2 prints ${box()}.`) +
      ask(`Line 2's answer is a`) + tick("number", "string");
  },
  worked() {
    return worked(say(`${c("3 + 4")} is two numbers, so JavaScript adds them: <b>7</b>. ` +
      `${c(`"3" + "4"`)} is two strings, so it sticks them together: <b>34</b> — the characters 3 and 4 in a row, ` +
      `and the answer is text, not a number.`));
  },
  key(item) {
    return [want.num(item.a + item.b), want.text(`${item.a}${item.b}`), want.tick(1)];
  },
  answer(item) {
    return [`${item.a + item.b} and ${item.a}${item.b} (a string)`];
  },
};

/* ═══ 3. typeof ════════════════════════════════════════════════════════════*/

const dtTypeof = {
  id: "dt-typeof",
  group: "dt-typeof",
  label: "What does typeof print?",
  blurb: "The computer will tell you the kind — in a word.",
  heading: "Ask the computer: typeof",
  instruction: () =>
    `Put ${c("typeof")} in front of a value and JavaScript tells you its kind. It answers with a WORD — ` +
    `${c(`"string"`)}, ${c(`"number"`)}, ${c(`"boolean"`)} — and the console prints that word with no quotes. ` +
    "Write what each line prints. Run it afterwards to check.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    return { vs: someValues(r, o, 3, i + 1).map((v) => VALUES.indexOf(v)) };
  },
  render(item) {
    const src = item.vs.map((n) => `console.log(typeof ${VALUES[n].src});`).join("\n");
    return codeHtml({ src, file: "typeof.js", out: 3 }) +
      pairs(["Line", "It prints"], item.vs.map((n, j) => [String(j + 1), box()]));
  },
  worked() {
    return worked(say(`${c(`console.log(typeof "Amara");`)} prints <b>string</b>. Not "Amara", and not with quote ` +
      `marks round it: typeof does not print the value, it prints the KIND of the value.`));
  },
  key(item) {
    return item.vs.map((n) => want.text(VALUES[n].type));
  },
  answer(item) {
    return [item.vs.map((n) => VALUES[n].type).join(", ")];
  },
};

/* ═══ 4. print it yourself ═════════════════════════════════════════════════*/

const TASKS = [
  { what: "the number 12", prints: ["12"], must: [], tier: 0 },
  { what: "the word Lagos (as text)", prints: ["Lagos"], must: [], tier: 0 },
  { what: "the value true", prints: ["true"], must: [], tier: 0 },
  { what: "the number 3.5", prints: ["3.5"], must: [], tier: 1 },
  { what: "the word yes on one line, then the number 9 on the next", prints: ["yes", "9"], must: [], tier: 1 },
  { what: "the kind of the value 42 (use typeof)", prints: ["number"], must: ["typeof"], tier: 1 },
  { what: "the kind of the value \"42\" (use typeof)", prints: ["string"], must: ["typeof"], tier: 2 },
];

const dtPrint = {
  id: "dt-print",
  group: "dt-print",
  label: "Write it and run it",
  blurb: "Your program is marked by what it prints.",
  heading: "Print it yourself",
  instruction: () =>
    `${c("console.log( … )")} prints whatever you put between the brackets. Write the program, then press ` +
    "<b>Run</b> (or Ctrl + Enter). This box is marked by what it PRINTS, so any program that prints the right " +
    "thing is right.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const t = { gentle: 0, middle: 1, stretch: 2 }[tier(o)] ?? 0;
    const pool = TASKS.filter((x) => x.tier <= t);
    return { t: TASKS.indexOf(deal(r, pool, i)) };
  },
  render(item) {
    const t = TASKS[item.t];
    return ask(`Make the console print <b>${t.what}</b>.`) +
      codeHtml({ src: "console.log();", edit: true, mark: true, rows: 3, file: "mine.js", out: t.prints.length });
  },
  worked() {
    return worked(say(`To print the number 12, the whole program is one line: ${c("console.log(12);")} — and the ` +
      `console shows <b>12</b>. To print a WORD you need quote marks: ${c(`console.log("Lagos");`)}.`));
  },
  key(item) {
    const t = TASKS[item.t];
    return [want.code({ prints: t.prints, must: t.must, says: t.prints.join(" then ") })];
  },
  answer(item) {
    const t = TASKS[item.t];
    return [`prints ${t.prints.join(" then ")}`];
  },
};

/* ═══ 5. nothing, two ways ═════════════════════════════════════════════════*/

const dtEmpty = {
  id: "dt-empty",
  group: "dt-empty",
  label: "null and undefined",
  blurb: "Empty on purpose, and nothing yet.",
  heading: "Nothing, two ways",
  instruction: () =>
    `A box with nothing in it YET prints ${c("undefined")} — JavaScript has not been given a value to keep there. ` +
    `A box you deliberately emptied holds ${c("null")}: "nothing, and I meant it". Write what each line prints.`,
  cols: 1,
  defaultCount: 2,
  minLevel: "middle",
  make(r) {
    return { name: r.pick(["score", "prize", "seat", "answer"]) };
  },
  render(item) {
    const src = `let ${item.name};\nconsole.log(${item.name});\n\nlet chosen = null;\nconsole.log(chosen);\nconsole.log(typeof chosen);`;
    return codeHtml({ src, file: "empty.js", out: 3 }) +
      pairs(["Line", "It prints"], [["2", box()], ["5", box()], ["6", box()]]) +
      ask("Line 6 surprises everybody. Which kind of value does JavaScript say null is?") +
      tick("null", "object", "undefined");
  },
  worked() {
    return worked(say(`A variable made with no value in it holds <b>undefined</b>. Give it ${c("null")} and it ` +
      `holds <b>null</b>. And ${c("typeof null")} prints <b>object</b> — which is wrong, and is a famous mistake ` +
      "from the first week JavaScript existed that can never be mended without breaking the web."));
  },
  key() {
    return [want.text("undefined"), want.text("null"), want.text("object"), want.tick(1)];
  },
  answer() {
    return ["undefined, null, object"];
  },
};

/* ═══ 6. joining or adding? ════════════════════════════════════════════════*/

const dtJoin = {
  id: "dt-join",
  group: "dt-join",
  label: "Mend the sum",
  blurb: "A number that came in as text, and how to convert it.",
  heading: "Joining or adding?",
  instruction: () =>
    `When one side of + is a string, JavaScript makes the OTHER side a string too and joins them. That is why ` +
    `${c(`"2" + 2`)} is ${c(`"22"`)}. ${c("Number( … )")} turns text into a real number, so the + can add. ` +
    "Write what the broken program prints, then mend it in the second box so it prints the right total.",
  cols: 1,
  defaultCount: 2,
  minLevel: "middle",
  make(r) {
    const a = r.int(2, 9);
    const b = r.int(2, 9);
    return { a, b };
  },
  render(item) {
    const broken = `let typed = "${item.a}";\nconsole.log(typed + ${item.b});`;
    return codeHtml({ src: broken, file: "broken.js", out: 1 }) +
      ask(`It prints ${box()}, because ${c("typed")} is a ${box()} and not a number.`) +
      ask(`Now mend it: make the console print the real total, ${c(`${item.a} + ${item.b}`)}.`) +
      codeHtml({ src: `let typed = "${item.a}";\nconsole.log(typed + ${item.b});`, edit: true, mark: true, rows: 3, file: "mended.js", out: 1 });
  },
  worked() {
    return worked(say(`${c(`"2" + 2`)} prints <b>22</b>: the 2 on the left is text, so the 2 on the right is made ` +
      `into text and joined on the end. Wrap the text in ${c("Number( … )")} — ${c("Number(typed) + 2")} — and ` +
      "both sides are numbers, so they add: <b>4</b>."));
  },
  key(item) {
    return [
      want.text(`${item.a}${item.b}`),
      want.text(...ACCEPT.string),
      want.code({ prints: [String(item.a + item.b)], says: String(item.a + item.b) }),
    ];
  },
  answer(item) {
    return [`${item.a}${item.b} (joined), mended it prints ${item.a + item.b}`];
  },
};

/* ═══ 7. let and const ═════════════════════════════════════════════════════*/

const THINGS = [
  { name: "age", src: "14", type: "number", prints: "14" },
  { name: "town", src: `"Enugu"`, type: "string", prints: "Enugu" },
  { name: "passed", src: "true", type: "boolean", prints: "true" },
  { name: "price", src: "250", type: "number", prints: "250" },
  { name: "name", src: `"Chidi"`, type: "string", prints: "Chidi" },
];

const dtVars = {
  id: "dt-vars",
  group: "dt-vars",
  label: "A name for a value",
  blurb: "let, const, and the kind of what is inside.",
  heading: "Put it in a box: let and const",
  instruction: () =>
    `${c("let")} makes a box with a name, and puts a value in it: ${c(`let age = 14;`)}. The box does not change ` +
    "what kind the value is — 14 in a box is still a number. Write the program, then run it: it must print the " +
    "value first and then its kind.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    return { t: THINGS.indexOf(deal(r, THINGS, i)) };
  },
  render(item) {
    const t = THINGS[item.t];
    return ask(`Make a variable called ${c(t.name)} holding ${c(t.src)}. Print it, then print its kind with ` +
      `${c("typeof")}.`) +
      codeHtml({ src: `let ${t.name} = ;\nconsole.log();\nconsole.log();`, edit: true, mark: true, rows: 4, file: "boxes.js", out: 2 });
  },
  worked() {
    return worked(say(`${c(`let age = 14;`)} then ${c("console.log(age);")} prints <b>14</b>, and ` +
      `${c("console.log(typeof age);")} prints <b>number</b>. The name in the box is not in quotes — ` +
      `${c(`console.log("age")`)} would print the word age instead of what is inside it.`));
  },
  key(item) {
    const t = THINGS[item.t];
    return [want.code({ prints: [t.prints, t.type], must: ["let", "typeof", t.name], says: `${t.prints} then ${t.type}` })];
  },
  answer(item) {
    const t = THINGS[item.t];
    return [`let ${t.name} = ${t.src}; prints ${t.prints} then ${t.type}`];
  },
};

export const DT_EXERCISES = [dtKind, dtQuotes, dtTypeof, dtPrint, dtEmpty, dtJoin, dtVars];
