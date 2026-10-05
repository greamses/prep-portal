/* ============================================================================
   Mental Maths Workbook — CHAPTER 7: TIMES TABLE SECRETS
   ----------------------------------------------------------------------------
   Every times table has a pattern in it that makes it easy to write out and
   hard to forget. One table to a section, its secret first.

     THE NINE TIMES TABLE
       Write the ten sums down the page. Count 0 to 9 going DOWN the page —
       those are the tens. Count 0 to 9 again going UP the page — those are
       the units. 09, 18, 27 … 90: the whole table, with nothing multiplied.

       So for any one of them: the tens digit is ONE LESS than the number
       you multiply by, and the two digits ADD UP TO 9.

         one at a time     9 × 7: one less than 7 is 6; 6 needs 3 to make 9; 63
         the whole table   the two columns, counted down and counted up

     THE EIGHT TIMES TABLE
       The tens count 0, 1, 2, 3, 4 down the page; a LINE; and from the same
       4 again, 4, 5, 6, 7, 8. The units count UP the page in twos from the
       bottom, 0, 2, 4, 6, 8 — and at the line they start again, 0, 2, 4, 6, 8.
       (The line is where the pattern repeats: five eights are exactly 40.)
       One at a time: 8 is 2 × 2 × 2, so double three times.

     THE SEVEN TIMES TABLE
       The tens go three at a time, a LINE after each three, and each new
       three starts by saying the last number AGAIN: 0, 1, 2 | 2, 3, 4 |
       4, 5, 6 | 7. The units count UP the page from the bottom: 0 for the
       last row, then in threes above each line — 3, 6, 9 | 2, 5, 8 | 1, 4, 7
       — each three starting one lower than the last.
       One at a time: 7 is 5 and 2, so five of it and two of it, added.

     THE SIX TIMES TABLE
       A LINE under 6 × 5. The tens go 0, 1, 1, 2, 3 down to the line — the
       1 comes twice — and from the same 3 below it: 3, 4, 4, 5, 6, the 4
       twice. The units count UP the page in FOURS, writing only the last
       figure: 0, 4, 8, (1)2, (1)6 — and the same again above the line.
       One at a time: 6 is 5 and 1, so five of it and one more of it.

     A LINE across a table marks where its pattern REPEATS. It is on the
     paper and on the TV.

   On PrepBot's TV the secret is acted out: the ten sums, the tens counting
   down the page, the units counting up it, and the two columns closing into
   the answers (`tv: "nines"` — the scene is in explain.js).
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { ask, big, worked, say, step, steps, strip } from "./common.js";

export const TT_GROUPS = [
  { id: "vm-tables", chapter: "Chapter 7 · Times table secrets", label: "The 9 times table", blurb: "Count down the page, count up the page: 09, 18, 27 …" },
  { id: "vm-tables8", label: "The 8 times table", blurb: "Tens to 4 and from 4 again; units up the page in twos." },
  { id: "vm-tables7", label: "The 7 times table", blurb: "Three at a time: say the last ten again, and count the units up in threes." },
  { id: "vm-tables6", label: "The 6 times table", blurb: "Units up the page in fours; one ten in each half comes twice." },
];

const SECRET =
  "Write the ten sums, 9 × 1 to 9 × 10, down the page. Count from 0 to 9 going DOWN the page: those are the tens. " +
  "Count from 0 to 9 again going UP the page: those are the units. So the tens digit is always ONE LESS than the " +
  "number you multiply by, and the two digits always ADD UP TO 9.";

const nineOne = {
  id: "vm-tt9",
  group: "vm-tables",
  label: "Nines, one at a time",
  blurb: "One less for the tens; what makes 9 for the units.",
  heading: "The 9 times table — one less, and what makes 9",
  instruction: () => SECRET,
  tv: "nines",
  cols: 2,
  defaultCount: 6,
  make: (r) => ({ n: r.int(2, 10) }),
  render: ({ n }) => big(`9 × ${n}`) +
    steps(step(`one less than ${n}:`), step("what goes with it to make 9:"), step("the answer:")),
  worked: () => worked(big("9 × 7") + ask(strip("7 − 1", "9 − 6") + " → " + strip("6", "3") + " = 63") +
    say("One less than 7 is 6: that is the tens. 6 needs 3 to make 9: that is the units. So 9 × 7 is 63.")),
  key: ({ n }) => [want.num(n - 1), want.num(10 - n), want.num(9 * n)],
  answer: ({ n }) => [`${n - 1} and ${10 - n}: 9 × ${n} = ${9 * n}`],
};

const nineAll = {
  id: "vm-tt9-all",
  group: "vm-tables",
  label: "The whole nine times table",
  blurb: "The tens counted down the page, the units counted up.",
  heading: "The 9 times table — count down, count up",
  instruction: () => SECRET + " It is set out as PrepBot sets it out. Fill the FIRST box of every row, counting 0 to 9 down the page; " +
    "then the SECOND box of every row, counting 0 to 9 up from the bottom. On screen the boxes open one at a time, in that order.",
  tv: "nines",
  cols: 1,
  defaultCount: 1,
  /* `n` is only for the drill form of the section: one sum out of the table */
  make: (r) => ({ n: r.int(2, 9) }),
  /* One column of ten, as on the TV. Each box says WHEN it is filled (data-step):
     the tens down the page are steps 0 to 9, the units up the page 10 to 19 —
     and that is the order they open in on screen (data-steps="listed"). */
  render: () => `<p class="vm-tt__key"><span class="is-t">first box: 0 to 9, down the page</span><span class="is-u">second box: 0 to 9, up the page</span></p>` +
    `<div class="vm-tt" data-steps="listed">${Array.from({ length: 10 }, (_, i) =>
      `<p class="wb-ask vm-tt__row"><span class="vm-tt__sum">9 × ${i + 1} =</span> <span class="vm-tt__pair">` +
      `<span class="wb-answer vm-tt__t" data-step="${i}"></span><span class="wb-answer vm-tt__u" data-step="${19 - i}"></span></span></p>`).join("")}</div>`,
  worked: () => worked(ask("9 × 1 = " + strip("0", "9") + " &nbsp; 9 × 2 = " + strip("1", "8") + " &nbsp; 9 × 3 = " + strip("2", "7")) +
    say("Down the page the first digits go 0, 1, 2 … and up the page the second digits go 0, 1, 2 … so the top rows read 09, 18, 27.")),
  key: () => Array.from({ length: 10 }, (_, i) => [want.num(i), want.num(9 - i)]).flat(),
  answer: () => [Array.from({ length: 10 }, (_, i) => `${i}${9 - i}`).join(", ")],
};

/* ═══ a whole table, set out as the TV sets it out ════════════════════════
   One column of ten sums, a tens box and a units box to a row. The TENS are
   filled first, down the page (steps 0 to 9); then the UNITS, UP the page
   from the bottom row (steps 10 to 19). `cuts` are the rows a line is ruled
   under: where the pattern repeats. */
function tableHtml(n, cuts, keyT, keyU) {
  return `<p class="vm-tt__key"><span class="is-t">${keyT}</span><span class="is-u">${keyU}</span></p>` +
    `<div class="vm-tt" data-steps="listed">${Array.from({ length: 10 }, (_, i) =>
      `<p class="wb-ask vm-tt__row${cuts.includes(i) ? " vm-tt__row--cut" : ""}"><span class="vm-tt__sum">${n} × ${i + 1} =</span> <span class="vm-tt__pair">` +
      `<span class="wb-answer vm-tt__t" data-step="${i}"></span><span class="wb-answer vm-tt__u" data-step="${19 - i}"></span></span></p>`).join("")}</div>`;
}
const tableKey = (n) => Array.from({ length: 10 }, (_, i) => [want.num(Math.floor((n * (i + 1)) / 10)), want.num((n * (i + 1)) % 10)]).flat();
const tableAnswer = (n) => [Array.from({ length: 10 }, (_, i) => String(n * (i + 1)).padStart(2, "0")).join(", ")];

/* ═══ THE EIGHTS ══════════════════════════════════════════════════════════*/

const SECRET8 =
  "Write the ten sums, 8 × 1 to 8 × 10, down the page, and rule a LINE under 8 × 5. The TENS count 0, 1, 2, 3, 4 down " +
  "to the line, and below it start again from the same 4: 4, 5, 6, 7, 8. The UNITS count UP the page in twos from " +
  "the bottom, 0, 2, 4, 6, 8 — and at the line they start again, 0, 2, 4, 6, 8.";

const eightOne = {
  id: "vm-tt8",
  group: "vm-tables8",
  label: "Eights, one at a time",
  blurb: "8 is 2 × 2 × 2: double, double, double.",
  heading: "The 8 times table — double three times",
  instruction: () => "8 is 2 × 2 × 2, so multiplying by 8 is DOUBLING THREE TIMES. Double the number, double the answer, " +
    "and double once more.",
  tv: "eights",
  cols: 2,
  defaultCount: 6,
  make: (r) => ({ n: r.int(2, 10) }),
  render: ({ n }) => big(`8 × ${n}`) +
    steps(step(`double ${n}:`), step("double that:"), step("double once more — the answer:")),
  worked: () => worked(big("8 × 7") + ask(strip("7 × 2", "× 2", "× 2") + " → " + strip("14", "28", "56") + " = 56") +
    say("Double 7 is 14. Double 14 is 28. Double 28 is 56. So 8 × 7 is 56.")),
  key: ({ n }) => [want.num(2 * n), want.num(4 * n), want.num(8 * n)],
  answer: ({ n }) => [`${2 * n}, ${4 * n}, ${8 * n}: 8 × ${n} = ${8 * n}`],
};

const eightAll = {
  id: "vm-tt8-all",
  group: "vm-tables8",
  label: "The whole eight times table",
  blurb: "Tens to 4 and from 4 again; units up the page in twos.",
  heading: "The 8 times table — the line where it repeats",
  instruction: () => SECRET8 + " It is set out as PrepBot sets it out. Fill the FIRST box of every row going down the page; " +
    "then the SECOND box of every row going up from the bottom. On screen the boxes open one at a time, in that order.",
  tv: "eights",
  cols: 1,
  defaultCount: 1,
  make: (r) => ({ n: r.int(2, 9) }),
  render: () => tableHtml(8, [4], "first box, down the page: 0 to 4, the line, 4 to 8", "second box, up the page: 0, 2, 4, 6, 8 — twice"),
  worked: () => worked(ask("8 × 4 = " + strip("3", "2") + " &nbsp; 8 × 5 = " + strip("4", "0") + " &nbsp; — the line — &nbsp; 8 × 6 = " + strip("4", "8")) +
    say("Down to the line the first digits reach 4, and under the line they start from 4 again. Coming up the page the second digits reach 8 at the line and start from 0 again above it.")),
  key: () => tableKey(8),
  answer: () => tableAnswer(8),
};

/* ═══ THE SEVENS ══════════════════════════════════════════════════════════*/

const SECRET7 =
  "Write the ten sums, 7 × 1 to 7 × 10, down the page, and rule a LINE under every third one. The TENS go three at a " +
  "time, and each new three starts by saying the last number AGAIN: 0, 1, 2 — line — 2, 3, 4 — line — 4, 5, 6 — " +
  "line — 7. The UNITS count UP the page from the bottom: 0 for the last row, then in threes above each line, " +
  "3, 6, 9 — then starting one lower, 2, 5, 8 — and one lower again, 1, 4, 7.";

const sevenOne = {
  id: "vm-tt7",
  group: "vm-tables7",
  label: "Sevens, one at a time",
  blurb: "7 is 5 and 2: five of it, and two of it.",
  heading: "The 7 times table — five of it and two of it",
  instruction: () => "7 is 5 and 2. So seven of a number is FIVE of it and TWO of it, added together — and fives and twos " +
    "are the easy tables.",
  tv: "sevens",
  cols: 2,
  defaultCount: 6,
  make: (r) => ({ n: r.int(2, 10) }),
  render: ({ n }) => big(`7 × ${n}`) +
    steps(step(`5 × ${n} =`), step(`2 × ${n} =`), step("add them — the answer:")),
  worked: () => worked(big("7 × 6") + ask(strip("5 × 6", "2 × 6") + " → " + strip("30", "12") + " = 42") +
    say("Five sixes are 30 and two sixes are 12. 30 and 12 make 42. So 7 × 6 is 42.")),
  key: ({ n }) => [want.num(5 * n), want.num(2 * n), want.num(7 * n)],
  answer: ({ n }) => [`${5 * n} + ${2 * n}: 7 × ${n} = ${7 * n}`],
};

const sevenAll = {
  id: "vm-tt7-all",
  group: "vm-tables7",
  label: "The whole seven times table",
  blurb: "Tens in threes, the last one said again; units up the page in threes.",
  heading: "The 7 times table — three at a time",
  instruction: () => SECRET7 + " It is set out as PrepBot sets it out. Fill the FIRST box of every row going down the page; " +
    "then the SECOND box of every row going up from the bottom. On screen the boxes open one at a time, in that order.",
  tv: "sevens",
  cols: 1,
  defaultCount: 1,
  make: (r) => ({ n: r.int(2, 9) }),
  render: () => tableHtml(7, [2, 5, 8], "first box, down the page: 0 1 2 · 2 3 4 · 4 5 6 · 7", "second box, up the page: 0 · 3 6 9 · 2 5 8 · 1 4 7"),
  worked: () => worked(ask("7 × 3 = " + strip("2", "1") + " &nbsp; — the line — &nbsp; 7 × 4 = " + strip("2", "8") + " &nbsp; 7 × 5 = " + strip("3", "5")) +
    say("The first digit before the line is 2, and the first digit after it is 2 again. Coming up the page the second digits above this line go 2, 5, 8.")),
  key: () => tableKey(7),
  answer: () => tableAnswer(7),
};

/* ═══ THE SIXES ═══════════════════════════════════════════════════════════*/

const SECRET6 =
  "Write the ten sums, 6 × 1 to 6 × 10, down the page, and rule a LINE under 6 × 5. The TENS go 0, 1, 1, 2, 3 down to " +
  "the line — the 1 comes twice — and below it start from the same 3: 3, 4, 4, 5, 6, with the 4 twice. The UNITS " +
  "count UP the page in FOURS from the bottom, writing only the last figure: 0, 4, 8, then 12 and 16 give 2 and 6 — " +
  "and at the line they start again, 0, 4, 8, 2, 6.";

const sixOne = {
  id: "vm-tt6",
  group: "vm-tables6",
  label: "Sixes, one at a time",
  blurb: "6 is 5 and 1: five of it, and one more of it.",
  heading: "The 6 times table — five of it and one more",
  instruction: () => "6 is 5 and 1. So six of a number is FIVE of it, and ONE MORE of it. Find five of the number — half of " +
    "ten of it — and add the number on once.",
  tv: "sixes",
  cols: 2,
  defaultCount: 6,
  make: (r) => ({ n: r.int(2, 10) }),
  render: ({ n }) => big(`6 × ${n}`) +
    steps(step(`5 × ${n} =`), step(`add one more ${n} — the answer:`)),
  worked: () => worked(big("6 × 7") + ask(strip("5 × 7", "+ 7") + " → " + strip("35", "+ 7") + " = 42") +
    say("Five sevens are 35. One more seven makes 42. So 6 × 7 is 42.")),
  key: ({ n }) => [want.num(5 * n), want.num(6 * n)],
  answer: ({ n }) => [`${5 * n} + ${n}: 6 × ${n} = ${6 * n}`],
};

const sixAll = {
  id: "vm-tt6-all",
  group: "vm-tables6",
  label: "The whole six times table",
  blurb: "One ten twice in each half; units up the page in fours.",
  heading: "The 6 times table — count up in fours",
  instruction: () => SECRET6 + " It is set out as PrepBot sets it out. Fill the FIRST box of every row going down the page; " +
    "then the SECOND box of every row going up from the bottom. On screen the boxes open one at a time, in that order.",
  tv: "sixes",
  cols: 1,
  defaultCount: 1,
  make: (r) => ({ n: r.int(2, 9) }),
  render: () => tableHtml(6, [4], "first box, down the page: 0 1 1 2 3 · the line · 3 4 4 5 6", "second box, up the page: 0 4 8 2 6 — twice"),
  worked: () => worked(ask("6 × 4 = " + strip("2", "4") + " &nbsp; 6 × 5 = " + strip("3", "0") + " &nbsp; — the line — &nbsp; 6 × 6 = " + strip("3", "6")) +
    say("Down to the line the first digits reach 3, and under the line they start from 3 again. Coming up the page in fours the second digits are 0, 4, 8, 2, 6, and above the line 0, 4, 8, 2, 6 again.")),
  key: () => tableKey(6),
  answer: () => tableAnswer(6),
};

export const TT_EXERCISES = [nineOne, nineAll, eightOne, eightAll, sevenOne, sevenAll, sixOne, sixAll];

/* ── one digit to a box, and on to the next ──────────────────────────────────
   On screen the table's boxes open one at a time (the engine's data-steps).
   Each holds ONE digit, so the moment it has one the pencil moves to the box
   that has just opened — tens down the page, then units up it — and the table
   is filled by typing 0 1 2 … 9, 0 1 2 … 9, exactly as it is counted on the TV. */
if (typeof document !== "undefined" && !document.__vmTableDigits) {
  document.__vmTableDigits = true;
  document.addEventListener("input", (e) => {
    const input = e.target;
    const box = input.closest?.(".vm-tt .wb-answer");
    if (!box) return;
    if (input.value.length > 1) {
      /* a second figure typed into a full box replaces the first; said again so the page keeps the one figure */
      input.value = input.value.slice(-1);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    if (!input.value.trim()) return;
    const mine = Number(box.dataset.step);
    setTimeout(() => {
      const next = [...box.closest(".vm-tt").querySelectorAll(".wb-answer")]
        .filter((b) => Number(b.dataset.step) > mine && !b.classList.contains("is-waiting"))
        .sort((x, y) => Number(x.dataset.step) - Number(y.dataset.step))
        .find((b) => !b.querySelector("input")?.value.trim());
      next?.querySelector("input")?.focus();
    }, 40);
  });
}
