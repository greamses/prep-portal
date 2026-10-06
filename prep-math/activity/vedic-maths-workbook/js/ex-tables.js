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

       THE COUNTING STICKS (optional): 9 is 10 − 1, so lay out ten sticks
       and take away the one at the number you multiply by. The sticks to
       its left are the tens; the sticks to its right are the units. (And
       nine are always left — which is why the digits add up to 9.)

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
       4, 5, 6 | 7. The units are counted from the SMALLEST to the BIGGEST,
       0 to 9: 0 for the last sum; then 1, 2, 3 in the LAST row of each
       three; 4, 5, 6 in the SECOND rows; 7, 8, 9 in the FIRST rows.
       One at a time: 7 is 5 and 2, so five of it and two of it, added.

     THE SIX TIMES TABLE
       A LINE under 6 × 5. The tens go 0, 1, 1, 2, 3 down to the line — the
       1 comes twice — and from the same 3 below it: 3, 4, 4, 5, 6, the 4
       twice. The units are the even numbers, written IN ORDER — 2, 4, 6,
       8, 0 — each in its own row: 2 beside 6 × 2, 4 beside 6 × 4, 6 beside
       6 × 1, 8 beside 6 × 3, 0 beside 6 × 5; and the same again below the
       line.
       One at a time: 6 is 5 and 1, so five of it and one more of it.

     THE FIVE TIMES TABLE
       A LINE after every two sums. The tens go two at a time, and each new
       two starts by saying the last number AGAIN: 0, 1 | 1, 2 | 2, 3 |
       3, 4 | 4, 5. The units are only ever 0 and 5: 0 in the SECOND row of
       every two, 5 in the FIRST.
       One at a time: 5 is half of 10, so ten of it, halved.

     THE FOUR TIMES TABLE
       A LINE under 4 × 5. The tens go 0, 0, 1, 1, 2 down to the line and
       from the same 2 below it: 2, 2, 3, 3, 4. The units are the fours
       counted with only the last figure written: 4, 8, 2, 6, 0 — twice.

       A SECOND TRICK, BY ITSELF — THE W. Draw TWO big W's. Count in twos
       ALONG each: 0, 2, 4, 6, 8 — the units. Then the tens: 0, 0, 0 across
       the TOP of the first W, 1, 1 across its BOTTOM; 2, 2, 2 across the
       top of the second, 3, 3 across its bottom. Read top then bottom:
       00 04 08 12 16 · 20 24 28 32 36. And 40 stands by itself.

     THE SIXES' SECOND TRICK, BY ITSELF — THE DIAGONALS
       Count in twos stepping DOWN A DIAGONAL: 0, 2, 4. Go back to the top,
       beside the 0, and carry on down a second diagonal: 6, 8.
              0     6
                 2     8
                    4
       Do it twice. Read ROW BY ROW — 0 6, 2 8, 4 — and those are the
       units. The tens go the same way, row by row: 0, 0, 1, 1, 2 in the
       first set and 3, 3, 4, 4, 5 in the second: 00 06 12 18 24 ·
       30 36 42 48 54. And 60 stands by itself.

     ONE FACT OF THE SIXES, SEVENS OR FOURS, ON COUNTING STICKS
       Lay out one stick for each of the number. Count them UP IN FIVES.
       Then count the SAME sticks again, carrying on from there: in ONES
       for the sixes (6 = 5 + 1), in TWOS for the sevens (7 = 5 + 2), and
       going BACK in ones for the fours (4 = 5 − 1).

     A LINE across a table marks where its pattern REPEATS. It is on the
     paper and on the TV.

   On PrepBot's TV the secret is acted out: the ten sums, the tens counting
   down the page, the units counting up it, and the two columns closing into
   the answers (`tv: "nines"` — the scene is in explain.js).
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { ask, big, box, worked, say, step, steps, strip } from "./common.js";
import { sticksSvg, wSvg, W_POINTS } from "./tableart.js";

export const TT_GROUPS = [
  { id: "vm-tables", chapter: "Chapter 7 · Times table secrets", label: "The 9 times table", blurb: "Count down the page, count up the page: 09, 18, 27 … And the counting sticks." },
  { id: "vm-tables8", label: "The 8 times table", blurb: "Tens to 4 and from 4 again; units up the page in twos." },
  { id: "vm-tables7", label: "The 7 times table", blurb: "Three at a time: say the last ten again, and count the units up in threes." },
  { id: "vm-tables6", label: "The 6 times table", blurb: "Units in the order 2, 4, 6, 8, 0; one ten in each half comes twice. And a second trick: the diagonals." },
  { id: "vm-tables5", label: "The 5 times table", blurb: "Two at a time: the last ten said again, and the units only 0 and 5." },
  { id: "vm-tables4", label: "The 4 times table", blurb: "Tens 0 0 1 1 2 and from 2 again; units 4 8 2 6 0. And a second trick: two W's." },
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
   from the bottom row (steps 10 to 19) — unless the table counts its units
   another way and says so (`unitStep`: the sevens count theirs 0 to 9,
   wherever each one stands). `cuts` are the rows a line is ruled under:
   where the pattern repeats. */
function tableHtml(n, cuts, keyT, keyU, unitStep = (i) => 19 - i) {
  return `<p class="vm-tt__key"><span class="is-t">${keyT}</span><span class="is-u">${keyU}</span></p>` +
    `<div class="vm-tt" data-steps="listed">${Array.from({ length: 10 }, (_, i) =>
      `<p class="wb-ask vm-tt__row${cuts.includes(i) ? " vm-tt__row--cut" : ""}"><span class="vm-tt__sum">${n} × ${i + 1} =</span> <span class="vm-tt__pair">` +
      `<span class="wb-answer vm-tt__t" data-step="${i}"></span><span class="wb-answer vm-tt__u" data-step="${unitStep(i)}"></span></span></p>`).join("")}</div>`;
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
  "line — 7. The UNITS are counted from the smallest to the biggest, 0 to 9: 0 goes in the last sum; then 1, 2, 3 go " +
  "in the LAST row of each three; 4, 5, 6 in the SECOND rows; and 7, 8, 9 in the FIRST rows.";

const sevenOne = {
  id: "vm-tt7",
  group: "vm-tables7",
  label: "Sevens, one at a time",
  blurb: "7 is 5 and 2: five of it, and two of it.",
  heading: "The 7 times table — five of it and two of it",
  instruction: () => "7 is 5 and 2. So seven of a number is FIVE of it and TWO of it, added together — and fives and twos " +
    "are the easy tables. With counting sticks: lay out one stick for each of the number, count them UP IN FIVES, then count the SAME sticks again, carrying on IN TWOS.",
  tv: "sticks7",
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
    "then the SECOND boxes, counting 0 to 9: the last sum, the last rows, the second rows, the first rows. On screen the " +
    "boxes open one at a time, in that order.",
  tv: "sevens",
  cols: 1,
  defaultCount: 1,
  make: (r) => ({ n: r.int(2, 9) }),
  /* the units open in the order they are counted, 0 to 9: a box's step is 10 and the digit it holds */
  render: () => tableHtml(7, [2, 5, 8], "first box, down the page: 0 1 2 · 2 3 4 · 4 5 6 · 7",
    "second box, 0 to 9: the last sum · last rows · second rows · first rows", (i) => 10 + ((7 * (i + 1)) % 10)),
  worked: () => worked(ask("7 × 3 = " + strip("2", "1") + " &nbsp; — the line — &nbsp; 7 × 4 = " + strip("2", "8") + " &nbsp; 7 × 5 = " + strip("3", "5")) +
    say("The first digit before the line is 2, and the first digit after it is 2 again. The second digits are counted 0 to 9: 1 is in the last row of the first three, 8 and 5 are in the first and second rows of the next.")),
  key: () => tableKey(7),
  answer: () => tableAnswer(7),
};

/* ═══ THE SIXES ═══════════════════════════════════════════════════════════*/

const SECRET6 =
  "Write the ten sums, 6 × 1 to 6 × 10, down the page, and rule a LINE under 6 × 5. The TENS go 0, 1, 1, 2, 3 down to " +
  "the line — the 1 comes twice — and below it start from the same 3: 3, 4, 4, 5, 6, with the 4 twice. The UNITS " +
  "are the even numbers, written IN ORDER — 2, 4, 6, 8, 0 — each in its own row: 2 beside 6 × 2, 4 beside 6 × 4, " +
  "6 beside 6 × 1, 8 beside 6 × 3, and 0 beside 6 × 5. Below the line it is the same again.";

/* Where each unit goes when they are written 2, 4, 6, 8, 0: the row within a half (0 to 4) → its turn. */
const SIX_TURN = [2, 0, 3, 1, 4];

const sixOne = {
  id: "vm-tt6",
  group: "vm-tables6",
  label: "Sixes, one at a time",
  blurb: "6 is 5 and 1: five of it, and one more of it.",
  heading: "The 6 times table — five of it and one more",
  instruction: () => "6 is 5 and 1. So six of a number is FIVE of it, and ONE MORE of it. Find five of the number — half of " +
    "ten of it — and add the number on once. With counting sticks: lay out one stick for each of the number, count " +
    "them UP IN FIVES, then count the SAME sticks again, carrying on IN ONES.",
  tv: "sticks6",
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
    "then the SECOND boxes in the order 2, 4, 6, 8, 0, above the line and then below it. On screen the boxes open one at " +
    "a time, in that order.",
  tv: "sixes",
  cols: 1,
  defaultCount: 1,
  make: (r) => ({ n: r.int(2, 9) }),
  /* the units open in the order they are written, 2 4 6 8 0, the top half and then the bottom */
  render: () => tableHtml(6, [4], "first box, down the page: 0 1 1 2 3 · the line · 3 4 4 5 6",
    "second box, in the order 2 4 6 8 0 — twice", (i) => 10 + (i < 5 ? 0 : 5) + SIX_TURN[i % 5]),
  worked: () => worked(ask("6 × 4 = " + strip("2", "4") + " &nbsp; 6 × 5 = " + strip("3", "0") + " &nbsp; — the line — &nbsp; 6 × 6 = " + strip("3", "6")) +
    say("Down to the line the first digits reach 3, and under the line they start from 3 again. The second digits are the even numbers 2, 4, 6, 8, 0, each written beside its own sum — and the same five again under the line.")),
  key: () => tableKey(6),
  answer: () => tableAnswer(6),
};

/* THE SIXES' SECOND TRICK, BY ITSELF: THE DIAGONALS.
   Five numbers to a set, WRITTEN 0 2 4 down one diagonal and 6 8 down the next, and READ row by row:
   0 6 / 2 8 / 4. The units are written first; then the tens, in reading order. */
const DG_WRITE = [0, 2, 4, 6, 8];                                  // the order the units are written in
const DG_AT = { 0: [9, 16], 2: [32, 50], 4: [55, 84], 6: [55, 16], 8: [78, 50] };   // where each stands, in hundredths of the figure
const DG_READ = [0, 6, 2, 8, 4];                                   // the order they are read in: row by row
const dgValue = (w, u) => 30 * w + 6 * DG_READ.indexOf(u);         // the number that unit ends up in
const dgFig = (w) => `<div class="vm-dfig">${DG_WRITE.map((u, k) =>
  `<span class="vm-wfig__pt vm-tt__pair" style="left:${DG_AT[u][0]}%;top:${DG_AT[u][1]}%">` +
  `<span class="wb-answer vm-tt__t" data-step="${10 + w * 5 + DG_READ.indexOf(u)}"></span>` +
  `<span class="wb-answer vm-tt__u" data-step="${w * 5 + k}"></span></span>`).join("")}</div>`;

const sixDiag = {
  id: "vm-tt6-diag",
  group: "vm-tables6",
  label: "A second trick: the diagonals",
  blurb: "0 2 4 down one diagonal, 6 8 down the next; read row by row.",
  heading: "The 6 times table — the diagonals",
  instruction: () => "Here is a second trick for the sixes. Count in twos, stepping DOWN A DIAGONAL: 0, 2, 4. Go back to the " +
    "top, beside the 0, and carry on down a second diagonal: 6, 8. Do that twice. Those are the UNITS. Then the TENS, " +
    "written in front ROW BY ROW: 0, 0, then 1, 1, then 2 in the first set; 3, 3, then 4, 4, then 5 in the second. " +
    "Read each set row by row: 0, 6, 12, 18, 24 and 30, 36, 42, 48, 54. And 60 stands by itself. On screen the boxes " +
    "open one at a time, in that order.",
  tv: "sixd",
  cols: 1,
  defaultCount: 1,
  make: (r) => ({ n: r.int(2, 9) }),
  render: () => `<p class="vm-tt__key"><span class="is-u">second boxes first: 0 2 4 down, then 6 8 down — in each set</span>` +
    `<span class="is-t">then the first boxes, row by row: 0 0 · 1 1 · 2, then 3 3 · 4 4 · 5</span></p>` +
    `<div class="vm-tt vm-tt--w" data-steps="listed">${dgFig(0)}${dgFig(1)}</div>` +
    ask(`And by itself, to finish the table: 6 × 10 = ${box()}`),
  worked: () => worked(ask("0 &nbsp; 6 &nbsp; / &nbsp; 2 &nbsp; 8 &nbsp; / &nbsp; 4 &nbsp; → &nbsp; " + strip("00", "06") + " " + strip("12", "18") + " " + strip("24")) +
    say("Down the first diagonal: 0, 2, 4. Down the second: 6, 8. Row by row that reads 0, 6, 2, 8, 4. With the tens 0, 0, 1, 1, 2 in front: 0, 6, 12, 18, 24.")),
  key: () => [...[0, 1].flatMap((w) => DG_WRITE.flatMap((u) => [want.num(Math.floor(dgValue(w, u) / 10)), want.num(u)])), want.num(60)],
  answer: () => ["first set, row by row: 0, 6, 12, 18, 24; second set: 30, 36, 42, 48, 54; and 60"],
};

/* ═══ THE FIVES ═══════════════════════════════════════════════════════════*/

const SECRET5 =
  "Write the ten sums, 5 × 1 to 5 × 10, down the page, and rule a LINE after every two. The TENS go two at a time, " +
  "and each new two starts by saying the last number AGAIN: 0, 1 — line — 1, 2 — line — 2, 3 — line — 3, 4 — line — " +
  "4, 5. The UNITS are only ever 0 and 5: 0 goes in the SECOND row of every two, and 5 in the FIRST.";

const fiveOne = {
  id: "vm-tt5",
  group: "vm-tables5",
  label: "Fives, one at a time",
  blurb: "5 is half of 10: ten of it, halved.",
  heading: "The 5 times table — ten of it, halved",
  instruction: () => "5 is half of 10. So five of a number is TEN of it — write a 0 on the end — and then HALF of that.",
  tv: "fives",
  cols: 2,
  defaultCount: 6,
  make: (r) => ({ n: r.int(2, 10) }),
  render: ({ n }) => big(`5 × ${n}`) +
    steps(step(`10 × ${n} =`), step("half of that — the answer:")),
  worked: () => worked(big("5 × 7") + ask(strip("10 × 7", "÷ 2") + " → " + strip("70", "÷ 2") + " = 35") +
    say("Ten sevens are 70. Half of 70 is 35. So 5 × 7 is 35.")),
  key: ({ n }) => [want.num(10 * n), want.num(5 * n)],
  answer: ({ n }) => [`half of ${10 * n}: 5 × ${n} = ${5 * n}`],
};

const fiveAll = {
  id: "vm-tt5-all",
  group: "vm-tables5",
  label: "The whole five times table",
  blurb: "Tens two at a time, the last one said again; units 0 and 5.",
  heading: "The 5 times table — two at a time",
  instruction: () => SECRET5 + " It is set out as PrepBot sets it out. Fill the FIRST box of every row going down the page; " +
    "then the SECOND boxes, the smallest first: 0 in every second row, then 5 in every first row. On screen the boxes " +
    "open one at a time, in that order.",
  tv: "fives",
  cols: 1,
  defaultCount: 1,
  make: (r) => ({ n: r.int(2, 9) }),
  /* the units open smallest first: the five 0s down the page (steps 10 to 14), then the five 5s (15 to 19) */
  render: () => tableHtml(5, [1, 3, 5, 7], "first box, down the page: 0 1 · 1 2 · 2 3 · 3 4 · 4 5",
    "second box: 0 in every second row, then 5 in every first row", (i) => (i % 2 ? 10 + (i - 1) / 2 : 15 + i / 2)),
  worked: () => worked(ask("5 × 1 = " + strip("0", "5") + " &nbsp; 5 × 2 = " + strip("1", "0") + " &nbsp; — the line — &nbsp; 5 × 3 = " + strip("1", "5")) +
    say("The first digit before the line is 1, and the first digit after it is 1 again. The second digits take turns: 5 in the first row of a pair, 0 in the second.")),
  key: () => tableKey(5),
  answer: () => tableAnswer(5),
};

/* ═══ TWO OPTIONAL METHODS, each with a picture ════════════════════════════*/

/* THE COUNTING STICKS for the nines: 9 is 10 − 1, so one of ten sticks is taken away. */
const nineSticks = {
  id: "vm-tt9-sticks",
  group: "vm-tables",
  label: "The counting sticks (optional)",
  blurb: "9 is 10 − 1: take one stick of ten away. Tens on its left, units on its right.",
  heading: "The 9 times table — with ten counting sticks",
  instruction: () => "9 is 10 − 1. So lay out TEN counting sticks, numbered 1 to 10, and TAKE AWAY the stick at the number you " +
    "are multiplying by. Count the sticks to the LEFT of the gap: those are the tens. Count the sticks to the RIGHT " +
    "of it: those are the units.",
  tv: "nines",
  cols: 2,
  defaultCount: 4,
  make: (r) => ({ n: r.int(2, 9) }),
  render: ({ n }) => big(`9 × ${n}`) + `<div class="vm-art">${sticksSvg({ take: n, colour: true })}</div>` +
    steps(step("sticks to the left:"), step("sticks to the right:"), step("the answer:")),
  worked: () => worked(big("9 × 7") + `<div class="vm-art">${sticksSvg({ take: 7, colour: true })}</div>` +
    say("The stick at number 7 is taken away. There are 6 sticks to its left and 3 to its right. So 9 × 7 is 63.")),
  key: ({ n }) => [want.num(n - 1), want.num(10 - n), want.num(9 * n)],
  answer: ({ n }) => [`${n - 1} left, ${10 - n} right: 9 × ${n} = ${9 * n}`],
};

/* ═══ THE FOURS ═══════════════════════════════════════════════════════════*/

const fourOne = {
  id: "vm-tt4",
  group: "vm-tables4",
  label: "Fours, one at a time",
  blurb: "4 is 5 take away 1: five of it, less one of it.",
  heading: "The 4 times table — five of it, less one",
  instruction: () => "4 is 5 take away 1. So four of a number is FIVE of it, LESS ONE of it. Find five of the number — half of " +
    "ten of it — and take the number away once. With counting sticks: lay out one stick for each of the number, count " +
    "them UP IN FIVES, then count the SAME sticks again, going BACK IN ONES.",
  tv: "sticks4",
  cols: 2,
  defaultCount: 6,
  make: (r) => ({ n: r.int(2, 10) }),
  render: ({ n }) => big(`4 × ${n}`) +
    steps(step(`5 × ${n} =`), step(`take one ${n} away — the answer:`)),
  worked: () => worked(big("4 × 7") + ask(strip("5 × 7", "− 7") + " → " + strip("35", "− 7") + " = 28") +
    say("Five sevens are 35. One seven less is 28. So 4 × 7 is 28.")),
  key: ({ n }) => [want.num(5 * n), want.num(4 * n)],
  answer: ({ n }) => [`${5 * n} − ${n}: 4 × ${n} = ${4 * n}`],
};

const fourAll = {
  id: "vm-tt4-all",
  group: "vm-tables4",
  label: "The whole four times table",
  blurb: "Tens 0 0 1 1 2, and from 2 again; units 4 8 2 6 0, twice.",
  heading: "The 4 times table — a line under 4 × 5",
  instruction: () => "Write the ten sums, 4 × 1 to 4 × 10, down the page, and rule a LINE under 4 × 5. The TENS go 0, 0, 1, 1, 2 " +
    "down to the line, and from the same 2 below it: 2, 2, 3, 3, 4. For the UNITS count in fours and write only the " +
    "last figure: 4, 8, 2, 6, 0 — and the same again below the line. It is set out as PrepBot sets it out. Fill the " +
    "FIRST box of every row going down the page, then the SECOND box of every row going down the page. On screen the " +
    "boxes open one at a time, in that order.",
  tv: "fours",
  cols: 1,
  defaultCount: 1,
  make: (r) => ({ n: r.int(2, 9) }),
  render: () => tableHtml(4, [4], "first box, down the page: 0 0 1 1 2 · the line · 2 2 3 3 4",
    "second box, down the page: 4 8 2 6 0 — twice", (i) => 10 + i),
  worked: () => worked(ask("4 × 1 = " + strip("0", "4") + " &nbsp; 4 × 2 = " + strip("0", "8") + " &nbsp; 4 × 3 = " + strip("1", "2")) +
    say("Counting in fours: 4, 8, 12. Only the last figure goes in the second box: 4, 8, 2. The first digit goes up one each time the second digit gets smaller.")),
  key: () => tableKey(4),
  answer: () => tableAnswer(4),
};

/* A SECOND TRICK, BY ITSELF: THE TWO W's.
   Each point of a W holds a number of two figures. Along the stroke the points are top, bottom, top,
   bottom, top; the UNITS are the twos counted along it (0 2 4 6 8), and the TENS are one figure across the
   whole top and the next across the whole bottom: 0 and 1 on the first W, 2 and 3 on the second. */
const W_TOP = (pt) => pt % 2 === 0;
const wUnit = (pt) => 2 * pt;
const wTens = (w, pt) => 2 * w + (W_TOP(pt) ? 0 : 1);
/* when each box is filled: the ten units along the two W's first (0 to 9), then the tens —
   first W's top, its bottom, second W's top, its bottom (10 to 19) */
const wUnitStep = (w, pt) => w * 5 + pt;
const wTensStep = (w, pt) => 10 + w * 5 + (W_TOP(pt) ? pt / 2 : 3 + (pt - 1) / 2);
const wFig = (w) => `<div class="vm-wfig">${wSvg({ dots: false })}${W_POINTS.map(([x, y], pt) =>
  `<span class="vm-wfig__pt vm-tt__pair" style="left:${((x / 124) * 100).toFixed(2)}%;top:${((y / 76) * 100).toFixed(2)}%">` +
  `<span class="wb-answer vm-tt__t" data-step="${wTensStep(w, pt)}"></span><span class="wb-answer vm-tt__u" data-step="${wUnitStep(w, pt)}"></span></span>`).join("")}</div>`;

const fourW = {
  id: "vm-tt4-w",
  group: "vm-tables4",
  label: "A second trick: the two W's",
  blurb: "Twos along each W for the units; 0 0 0, 1 1, then 2 2 2, 3 3 for the tens.",
  heading: "The 4 times table — the two W's",
  instruction: () => "Here is a second trick for the fours. Draw TWO big W's. First the UNITS: count in twos ALONG each W, " +
    "from the left — 0, 2, 4, 6, 8. Then the TENS, written in front: 0, 0, 0 across the TOP of the first W and 1, 1 " +
    "across its BOTTOM; 2, 2, 2 across the top of the second W and 3, 3 across its bottom. Read each W across the " +
    "top and then the bottom: 0, 4, 8, 12, 16 and 20, 24, 28, 32, 36. And 40 stands by itself. On screen the boxes " +
    "open one at a time, in that order.",
  tv: "fourw",
  cols: 1,
  defaultCount: 1,
  make: (r) => ({ n: r.int(2, 9) }),
  render: () => `<p class="vm-tt__key"><span class="is-u">second boxes first: 0 2 4 6 8 along each W</span>` +
    `<span class="is-t">then the first boxes: 0 0 0 top, 1 1 bottom · 2 2 2 top, 3 3 bottom</span></p>` +
    `<div class="vm-tt vm-tt--w" data-steps="listed">${wFig(0)}${wFig(1)}</div>` +
    ask(`And by itself, to finish the table: 4 × 10 = ${box()}`),
  worked: () => worked(`<div class="vm-art vm-art--w">${wSvg({ labels: ["0", "2", "4", "6", "8"], tens: ["0", "1", "0", "1", "0"] })}</div>` +
    say("Along the first W the units are 0, 2, 4, 6, 8. The tens are 0 across the top and 1 across the bottom. Top then bottom it reads 0, 4, 8, 12, 16.")),
  key: () => [...[0, 1].flatMap((w) => W_POINTS.flatMap((_, pt) => [want.num(wTens(w, pt)), want.num(wUnit(pt))])), want.num(40)],
  answer: () => ["first W, top then bottom: 0, 4, 8, 12, 16; second W: 20, 24, 28, 32, 36; and 40"],
};

export const TT_EXERCISES = [nineOne, nineAll, nineSticks, eightOne, eightAll, sevenOne, sevenAll, sixOne, sixAll, sixDiag, fiveOne, fiveAll, fourOne, fourAll, fourW];

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
