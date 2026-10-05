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

   On PrepBot's TV the secret is acted out: the ten sums, the tens counting
   down the page, the units counting up it, and the two columns closing into
   the answers (`tv: "nines"` — the scene is in explain.js).
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { ask, big, box, worked, say, step, steps, strip } from "./common.js";

export const TT_GROUPS = [
  { id: "vm-tables", chapter: "Chapter 7 · Times table secrets", label: "The 9 times table", blurb: "Count down the page, count up the page: 09, 18, 27 …" },
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
  instruction: () => SECRET + " Fill the first box of every row counting down the page, then the second box of every row counting up from the bottom.",
  tv: "nines",
  cols: 1,
  defaultCount: 1,
  /* `n` is only for the drill form of the section: one sum out of the table */
  make: (r) => ({ n: r.int(2, 9) }),
  render: () => `<div class="vm-tt">${Array.from({ length: 10 }, (_, i) =>
    `<p class="wb-ask vm-tt__row"><span class="vm-tt__sum">9 × ${i + 1} =</span> <span class="vm-tt__pair">${box()}${box()}</span></p>`).join("")}</div>`,
  worked: () => worked(ask("9 × 1 = " + strip("0", "9") + " &nbsp; 9 × 2 = " + strip("1", "8") + " &nbsp; 9 × 3 = " + strip("2", "7")) +
    say("Down the page the first digits go 0, 1, 2 … and up the page the second digits go 0, 1, 2 … so the top rows read 09, 18, 27.")),
  key: () => Array.from({ length: 10 }, (_, i) => [want.num(i), want.num(9 - i)]).flat(),
  answer: () => [Array.from({ length: 10 }, (_, i) => `${i}${9 - i}`).join(", ")],
};

export const TT_EXERCISES = [nineOne, nineAll];
